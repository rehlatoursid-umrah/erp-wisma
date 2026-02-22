import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const payload = await getPayload({ config: configPromise })

        // 1. Calculate Date Range (Monday to Sunday of current week)
        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday (0)

        const startOfWeek = new Date(now)
        startOfWeek.setDate(diff)
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const startISO = startOfWeek.toISOString()
        const endISO = endOfWeek.toISOString()

        // 2. Fetch Stats in Parallel
        const [hotelCount, auditoriumCount, visaCount, rentalCount] = await Promise.all([
            // Hotel: Count rooms for bookings with check-in this week (exclude cancelled)
            payload.find({
                collection: 'hotel-bookings',
                where: {
                    and: [
                        { checkIn: { greater_than_equal: startISO, less_than_equal: endISO } },
                        { status: { not_equals: 'cancelled' } }
                    ]
                },
                limit: 500, // Reasonable max per week
                pagination: false
            }),

            // Auditorium: Count events scheduled this week (exclude cancelled)
            payload.count({
                collection: 'auditorium-bookings',
                where: {
                    and: [
                        { 'event.date': { greater_than_equal: startISO, less_than_equal: endISO } },
                        { status: { not_equals: 'cancelled' } }
                    ]
                },
            }),

            // Visa: Count travel docs created this week (Inquiries)
            payload.count({
                collection: 'travel-docs',
                where: {
                    createdAt: {
                        greater_than_equal: startISO,
                        less_than_equal: endISO,
                    },
                },
            }),

            // Rental: Count transactions with bookingType 'rental' created this week
            payload.count({
                collection: 'transactions',
                where: {
                    and: [
                        {
                            bookingType: {
                                equals: 'rental',
                            },
                        },
                        {
                            createdAt: {
                                greater_than_equal: startISO,
                                less_than_equal: endISO,
                            },
                        },
                    ],
                },
            }),
        ])

        // Calculate Hotel Rooms
        let hotelCheckinSum = 0;
        if (hotelCount && hotelCount.docs) {
            hotelCount.docs.forEach((booking: any) => {
                const rooms = booking.rooms || {};
                const single = Number(rooms.singleQty) || 0;
                const double = Number(rooms.doubleQty) || 0;
                const triple = Number(rooms.tripleQty) || 0;
                const quad = Number(rooms.quadrupleQty) || 0;
                const homestay = Number(rooms.homestayQty) || 0;
                hotelCheckinSum += (single + double + triple + quad + homestay);
            });
        }

        const stats = {
            hotel: hotelCheckinSum,
            auditorium: auditoriumCount.totalDocs,
            visa: visaCount.totalDocs,
            rental: rentalCount.totalDocs,
        }

        const period = {
            start: startISO,
            end: endISO,
        }

        return NextResponse.json({
            stats,
            period,
        })

    } catch (error) {
        console.error('Error fetching weekly stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch weekly stats' },
            { status: 500 }
        )
    }
}
