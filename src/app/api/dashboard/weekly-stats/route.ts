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
            // Hotel: Count bookings with check-in this week
            payload.count({
                collection: 'hotel-bookings',
                where: {
                    checkIn: {
                        greater_than_equal: startISO,
                        less_than_equal: endISO,
                    },
                },
            }),

            // Auditorium: Count events scheduled this week
            payload.count({
                collection: 'auditorium-bookings',
                where: {
                    'event.date': {
                        greater_than_equal: startISO,
                        less_than_equal: endISO,
                    },
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

        const stats = {
            hotel: hotelCount.totalDocs,
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
