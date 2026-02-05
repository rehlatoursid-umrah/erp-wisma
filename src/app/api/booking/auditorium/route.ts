import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

const ADMIN_PHONE = '201507049289'

// Hall Rental Packages (based on duration)
const HALL_PACKAGES: Record<string, { price: number; label: string }> = {
    '4h': { price: 420, label: '4 Hours' },
    '9h': { price: 900, label: '9 Hours' },
    '12h': { price: 1100, label: '12 Hours' },
    '14h': { price: 1250, label: 'Full Day (14h)' },
}
const AFTER_HOURS_RATE = 125 // per hour (22:00 - 07:00)
const EXTRA_HOUR_RATE = 115 // for late checkout (admin only)

// Additional Services Pricing
const AC_PRICES: Record<string, number> = { '4-6': 150, '7-9': 200, '10-12': 300, '13-14': 350 }
const CHAIR_PRICES: Record<string, number> = { '3': 75, '5': 120, '7': 160, '10': 210, '15': 300, '20': 380, '30': 540, '40': 680 }
const PROJECTOR_PRICES: Record<string, number> = { 'projector': 250, 'screen': 75, 'both': 275 }
const TABLE_PRICES: Record<string, number> = { '3': 140, '6': 240, '9': 300 }
const PLATE_PRICES: Record<string, number> = { '6': 60, '12': 110, '18': 160, '24': 200 }
const GLASS_PRICES: Record<string, number> = { '3': 20, '6': 35, '12': 60 }

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        // Validate required fields
        const required = ['fullName', 'countryOfOrigin', 'eventName', 'eventDate', 'startTime', 'endTime', 'phoneEgypt', 'whatsappEgypt']
        for (const field of required) {
            if (!data[field]) {
                return NextResponse.json({ error: `Field ${field} is required` }, { status: 400 })
            }
        }

        // Generate booking ID
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const bookingId = `AULA-${dateStr}-${random}`

        // Get prices from form (already calculated on client)
        const hallPackage = data.hallPackage || ''
        const duration = data.duration || 0
        const afterHoursCount = data.afterHoursCount || 0
        const hallRentalPrice = data.hallRentalPrice || 0
        const afterHoursPrice = data.afterHoursPrice || 0
        const servicesPrice = data.servicesPrice || 0
        const totalPrice = data.totalPrice || 0

        // Get Payload instance
        const payload = await getPayload({ config: configPromise })

        // Check if date is already booked
        const existingBookings = await payload.find({
            collection: 'auditorium-bookings',
            where: {
                'event.date': { equals: data.eventDate },
                status: { not_equals: 'cancelled' },
            },
        })

        // Check for time overlap
        for (const booking of existingBookings.docs) {
            const existingStart = booking.event?.startTime
            const existingEnd = booking.event?.endTime
            const newStart = data.startTime
            const newEnd = data.endTime

            if (existingStart && existingEnd) {
                if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                    return NextResponse.json({
                        error: `Time slot already booked (${existingStart} - ${existingEnd})`,
                    }, { status: 409 })
                }
            }
        }

        // Create booking in database
        const booking = await payload.create({
            collection: 'auditorium-bookings',
            data: {
                bookingId,
                personal: {
                    fullName: data.fullName,
                    countryOfOrigin: data.countryOfOrigin,
                },
                event: {
                    name: data.eventName,
                    date: data.eventDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                },
                contact: {
                    phoneEgypt: data.phoneEgypt,
                    whatsappEgypt: data.whatsappEgypt,
                },
                hallRental: {
                    package: hallPackage,
                    duration,
                    afterHoursCount,
                    extraHours: 0, // Admin will add this manually for late checkout
                    hallPrice: hallRentalPrice,
                    afterHoursPrice,
                },
                services: {
                    acOption: data.acOption || '',
                    chairOption: data.chairOption || '',
                    projectorScreen: data.projectorScreen || '',
                    tableOption: data.tableOption || '',
                    plateOption: data.plateOption || '',
                    glassOption: data.glassOption || '',
                },
                servicesPrice,
                totalPrice,
                status: 'pending',
            },
        })

        // Format date for message
        const formattedDate = new Date(data.eventDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

        // Get package label
        const packageLabel = HALL_PACKAGES[hallPackage]?.label || `${duration}h`

        // Build services summary
        const servicesSummary = []
        if (data.acOption) servicesSummary.push(`❄️ AC: ${data.acOption}h`)
        if (data.chairOption) servicesSummary.push(`🪑 Chairs: ${data.chairOption}`)
        if (data.projectorScreen) servicesSummary.push(`📽️ Projector/Screen: ${data.projectorScreen}`)
        if (data.tableOption) servicesSummary.push(`🪑 Tables: ${data.tableOption}`)
        if (data.plateOption) servicesSummary.push(`🍽️ Plates: ${data.plateOption}`)
        if (data.glassOption) servicesSummary.push(`🥛 Glasses: ${data.glassOption}`)

        // Send WhatsApp notifications
        await sendWhatsAppNotification({
            to: ADMIN_PHONE,
            message: `🔔 *NEW AUDITORIUM RESERVATION*\n\n` +
                `📋 Booking ID: ${bookingId}\n\n` +
                `👤 *Personal Info:*\n` +
                `Name: ${data.fullName}\n` +
                `Country: ${data.countryOfOrigin}\n\n` +
                `🎉 *Event:*\n` +
                `Name: ${data.eventName}\n` +
                `Date: ${formattedDate}\n` +
                `Time: ${data.startTime} - ${data.endTime}\n` +
                `Duration: ${duration} hours\n\n` +
                `📞 *Contact:*\n` +
                `Phone: ${data.phoneEgypt}\n` +
                `WhatsApp: ${data.whatsappEgypt}\n\n` +
                `🏛️ *Hall Rental:*\n` +
                `Package: ${packageLabel} = ${hallRentalPrice} EGP\n` +
                (afterHoursCount > 0 ? `After Hours: ${afterHoursCount}h × ${AFTER_HOURS_RATE} = ${afterHoursPrice} EGP\n` : '') +
                `\n⚙️ *Services:* ${servicesPrice} EGP\n${servicesSummary.join('\n') || 'None'}\n\n` +
                `━━━━━━━━━━━━━━\n` +
                `💰 *TOTAL: ${totalPrice} EGP*\n\n` +
                `Status: *PENDING*\nPlease confirm this reservation.`,
        })

        await sendWhatsAppNotification({
            to: data.whatsappEgypt,
            message: `✅ *AUDITORIUM RESERVATION SUBMITTED*\n` +
                `Wisma Nusantara Cairo\n\n` +
                `Thank you, ${data.fullName}!\n\n` +
                `📋 Booking ID: ${bookingId}\n` +
                `📅 Date: ${formattedDate}\n` +
                `⏰ Time: ${data.startTime} - ${data.endTime}\n` +
                `⏱️ Duration: ${duration} hours\n` +
                `🎉 Event: ${data.eventName}\n\n` +
                `💰 *Price Summary:*\n` +
                `🏛️ Hall (${packageLabel}): ${hallRentalPrice} EGP\n` +
                (afterHoursPrice > 0 ? `🌙 After Hours: ${afterHoursPrice} EGP\n` : '') +
                (servicesPrice > 0 ? `⚙️ Services: ${servicesPrice} EGP\n` : '') +
                `━━━━━━━━━━━━━━\n` +
                `TOTAL: ${totalPrice} EGP\n\n` +
                `Status: *AWAITING CONFIRMATION*\n\n` +
                `Our admin will contact you shortly.\n` +
                `For questions, call: +${ADMIN_PHONE}`,
        })

        return NextResponse.json({
            success: true,
            bookingId,
            duration,
            hallRentalPrice,
            afterHoursPrice,
            servicesPrice,
            totalPrice,
            message: 'Reservation submitted successfully',
        })

    } catch (error) {
        console.error('Booking error:', error)
        return NextResponse.json({
            error: 'Failed to create reservation. Please try again.',
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config: configPromise })

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const status = searchParams.get('status') || 'confirmed'

        const where: Record<string, any> = {
            status: { not_equals: 'cancelled' },
        }

        if (date) {
            where['event.date'] = { equals: date }
        }

        if (status !== 'all') {
            where.status = { equals: status }
        }

        const bookings = await payload.find({
            collection: 'auditorium-bookings',
            where,
            sort: '-event.date',
            limit: 100,
        })

        return NextResponse.json({
            success: true,
            bookings: bookings.docs.map(b => ({
                id: b.id,
                bookingId: b.bookingId,
                date: b.event?.date,
                startTime: b.event?.startTime,
                endTime: b.event?.endTime,
                bookerName: b.personal?.fullName,
                eventName: b.event?.name,
                country: b.personal?.countryOfOrigin,
                phone: b.contact?.phoneEgypt,
                whatsapp: b.contact?.whatsappEgypt,
                hallPackage: b.hallRental?.package,
                duration: b.hallRental?.duration,
                afterHoursCount: b.hallRental?.afterHoursCount,
                hallPrice: b.hallRental?.hallPrice,
                afterHoursPrice: b.hallRental?.afterHoursPrice,
                servicesPrice: b.servicesPrice,
                totalPrice: b.totalPrice,
                status: b.status,
                // Include Services
                services: b.services || {},
            })),
        })

    } catch (error) {
        console.error('Get bookings error:', error)
        return NextResponse.json({
            error: 'Failed to fetch bookings',
        }, { status: 500 })
    }
}

// WhatsApp notification helper
async function sendWhatsAppNotification({ to, message }: { to: string; message: string }) {
    let phone = to.replace(/[^0-9]/g, '')
    if (phone.startsWith('0')) {
        phone = '20' + phone.slice(1)
    }

    try {
        const response = await fetch(process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: message },
            }),
        })

        if (!response.ok) {
            console.error('WhatsApp API error:', await response.text())
        }

        return response.ok
    } catch (error) {
        console.error('WhatsApp send error:', error)
        return false
    }
}
