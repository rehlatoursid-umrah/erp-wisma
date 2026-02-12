import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ROOM_TYPES, HOTEL_ROOMS, AIRPORT_PICKUP, MEAL_PACKAGES, EXTRA_BED_PRICE } from '@/constants/hotel'

// GET: Fetch bookings for a specific month (for calendar)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)

        const payload = await getPayload({ config })

        const bookings = await payload.find({
            collection: 'hotel-bookings',
            where: {
                or: [
                    { checkIn: { greater_than_equal: startDate.toISOString(), less_than_equal: endDate.toISOString() } },
                    { checkOut: { greater_than_equal: startDate.toISOString(), less_than_equal: endDate.toISOString() } },
                    { and: [{ checkIn: { less_than: startDate.toISOString() } }, { checkOut: { greater_than: endDate.toISOString() } }] },
                ],
            },
            limit: 500,
            sort: 'checkIn',
        })

        // Transform to calendar format (EXPAND bookings per assigned room)
        const calendarData: any[] = []

        bookings.docs.forEach((booking: any) => {
            const assignedRooms = booking.assignedRooms || []

            // If explicit rooms are assigned (new system), use them
            if (assignedRooms.length > 0) {
                assignedRooms.forEach((roomNum: string) => {
                    calendarData.push({
                        id: `${booking.id}-${roomNum}`, // Unique ID for calendar key
                        originalId: booking.id, // Real DB ID for relationships
                        bookingId: booking.bookingId,
                        roomNumber: roomNum, // Critical for matching row in calendar
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                        nights: booking.nights,
                        guestName: booking.guest?.fullName || '',
                        guestCountry: booking.guest?.country || '',
                        guestWhatsapp: booking.guest?.whatsapp || '',
                        pricing: booking.pricing,
                        status: booking.status,
                        // Helper to show total price only on first room or split? 
                        // For now we show total price on detail modal, so it's fine.
                        pricePerNight: HOTEL_ROOMS.find(r => r.number === roomNum)?.price || 0,
                        totalPrice: booking.pricing?.grandTotal || 0,
                    })
                })
            }
            // Fallback for old bookings or if no rooms assigned yet (optional: show as 'Pending Assignment'?)
            // For now, we only show assigned rooms to avoid cluttering unrelated rows or erroring.
        })

        return NextResponse.json({
            success: true,
            year,
            month,
            bookings: calendarData,
        })
    } catch (error: any) {
        console.error('Hotel bookings fetch error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// POST: Create a new booking
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            fullName, country, passport, phone, whatsapp,
            singleQty, doubleQty, tripleQty, quadrupleQty, homestayQty,
            doubleExtraBed, tripleExtraBed, quadrupleExtraBed, homestayExtraBed,
            adults, children,
            checkInDate, checkInTime,
            checkOutDate, checkOutTime,
            airportPickup, meals, nights
        } = body

        // Validate basic fields
        if (!fullName || !country || !passport || !phone || !whatsapp) {
            return NextResponse.json({ success: false, error: 'Missing personal information' }, { status: 400 })
        }
        if (!checkInDate || !checkOutDate || nights < 1) {
            return NextResponse.json({ success: false, error: 'Invalid dates' }, { status: 400 })
        }

        const payload = await getPayload({ config })

        // 1. Availability Check & Room Assignment
        const newCheckIn = new Date(checkInDate)
        const newCheckOut = new Date(checkOutDate)

        // Fetch overlapping bookings
        const existingBookings = await payload.find({
            collection: 'hotel-bookings',
            where: {
                and: [
                    { checkIn: { less_than: newCheckOut.toISOString() } },
                    { checkOut: { greater_than: newCheckIn.toISOString() } },
                    { status: { not_equals: 'cancelled' } }
                ]
            },
            limit: 1000,
        })

        // Collect all currently booked room numbers
        const occupiedRoomNumbers = new Set<string>()
        existingBookings.docs.forEach((b: any) => {
            if (b.assignedRooms && Array.isArray(b.assignedRooms)) {
                b.assignedRooms.forEach((r: string) => occupiedRoomNumbers.add(r))
            }
        })

        // Assign rooms for each requested type
        const assignedRooms: string[] = []
        const requests = [
            { type: 'single', qty: singleQty || 0 },
            { type: 'double', qty: doubleQty || 0 },
            { type: 'triple', qty: tripleQty || 0 },
            { type: 'quadruple', qty: quadrupleQty || 0 },
            { type: 'homestay', qty: homestayQty || 0 },
        ]

        for (const req of requests) {
            if (req.qty > 0) {
                // Find available rooms of this type
                const availableOfTypes = HOTEL_ROOMS.filter(r =>
                    r.type === req.type && !occupiedRoomNumbers.has(r.number)
                )

                if (availableOfTypes.length < req.qty) {
                    return NextResponse.json({
                        success: false,
                        error: `Not enough available ${req.type} rooms for the selected dates. Only ${availableOfTypes.length} left.`
                    }, { status: 400 })
                }

                // Take the first N available rooms and mark them as occupied for this booking
                for (let i = 0; i < req.qty; i++) {
                    const room = availableOfTypes[i]
                    assignedRooms.push(room.number)
                    occupiedRoomNumbers.add(room.number) // Mark locally as occupied so we don't double assign in same request (though usually types differ)
                }
            }
        }

        if (assignedRooms.length === 0) {
            return NextResponse.json({ success: false, error: 'Please select at least one room' }, { status: 400 })
        }

        // Generate ID
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const bookingId = `HTL-${dateStr}-${random}`

        // Calculate Pricing
        const roomsTotal = (
            (singleQty || 0) * ROOM_TYPES.single.price +
            (doubleQty || 0) * ROOM_TYPES.double.price +
            (tripleQty || 0) * ROOM_TYPES.triple.price +
            (quadrupleQty || 0) * ROOM_TYPES.quadruple.price +
            (homestayQty || 0) * ROOM_TYPES.homestay.price
        ) * nights

        const extraBedTotal = (
            (doubleExtraBed || 0) + (tripleExtraBed || 0) + (quadrupleExtraBed || 0) + (homestayExtraBed || 0)
        ) * EXTRA_BED_PRICE * nights

        const pickupPrice = airportPickup === 'medium' ? 35 : airportPickup === 'hiace' ? 50 : 0

        const mealsTotal = Object.values(meals || {}).reduce((sum: number, meal: any) => {
            if (!meal.menuId || !meal.qty) return sum
            const mealConfig = MEAL_PACKAGES.find(m => m.id === meal.menuId)
            if (!mealConfig) return sum

            const multiplier = meal.isDaily ? nights : 1
            return sum + (meal.qty * mealConfig.price * multiplier)
        }, 0)

        // Create Booking
        const booking = await payload.create({
            collection: 'hotel-bookings',
            data: {
                bookingId,
                assignedRooms, // Save the auto-assigned rooms
                guest: { fullName, country, passport, phone, whatsapp },
                rooms: {
                    singleQty: singleQty || 0,
                    doubleQty: doubleQty || 0,
                    tripleQty: tripleQty || 0,
                    quadrupleQty: quadrupleQty || 0,
                    homestayQty: homestayQty || 0,
                    doubleExtraBed: doubleExtraBed || 0,
                    tripleExtraBed: tripleExtraBed || 0,
                    quadrupleExtraBed: quadrupleExtraBed || 0,
                    homestayExtraBed: homestayExtraBed || 0,
                },
                adults, children: children || 0,
                checkIn: newCheckIn.toISOString(),
                checkInTime: checkInTime || '14:00',
                checkOut: newCheckOut.toISOString(),
                checkOutTime: checkOutTime || '12:00',
                nights,
                airportPickup: airportPickup || 'none',
                meals,
                pricing: {
                    roomsTotal, extraBedTotal, pickupTotal: pickupPrice, mealsTotal,
                    grandTotal: roomsTotal + extraBedTotal + pickupPrice,
                },
                status: 'pending',
            },
        })

        return NextResponse.json({
            success: true,
            booking: {
                id: booking.id,
                bookingId: booking.bookingId,
                assignedRooms, // Return assigned rooms to frontend
                totalUSD: roomsTotal + extraBedTotal + pickupPrice,
                totalEGP: mealsTotal,
            },
        })
    } catch (error: any) {
        console.error('Hotel booking creation error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
