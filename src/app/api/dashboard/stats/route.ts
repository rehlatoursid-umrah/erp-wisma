
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const payload = await getPayload({ config: configPromise })
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // 1. Hotel Stats (Active Rooms Today)
        const hotelBookings = await payload.find({
            collection: 'hotel-bookings',
            where: {
                and: [
                    { checkIn: { less_than_equal: today.toISOString() } },
                    { checkOut: { greater_than: today.toISOString() } },
                    { status: { not_equals: 'cancelled' } }
                ]
            },
            limit: 100,
        })
        const occupiedRooms = hotelBookings.docs.length

        // 2. Auditorium Stats (Upcoming Events)
        const aulaBookings = await payload.find({
            collection: 'auditorium-bookings',
            where: {
                date: { greater_than_equal: todayStr }
            },
            sort: 'date',
            limit: 5,
        })
        const upcomingEventsCount = aulaBookings.totalDocs

        // 3. Visa Stats (Active Inquiries)
        const visaInquiries = await payload.find({
            collection: 'travel-docs',
            where: {
                visaStatus: { in: ['pending_docs', 'on_process'] }
            },
            limit: 5,
            sort: '-createdAt',
        })
        const activeVisaCount = visaInquiries.totalDocs

        // 4. Rental Stats (From Transactions)
        // Note: Complex query for rentals might be simplified here
        const rentalTransactions = await payload.find({
            collection: 'transactions',
            where: {
                paymentStatus: { not_equals: 'cancelled' }
            },
            limit: 5,
            sort: '-createdAt',
        })
        const activeRentalsCount = 0 // Placeholder logic for now

        return NextResponse.json({
            stats: {
                hotel: occupiedRooms,
                aula: upcomingEventsCount,
                visa: activeVisaCount,
                rental: activeRentalsCount
            },
            data: {
                hotel: hotelBookings.docs.slice(0, 4),
                aula: aulaBookings.docs.slice(0, 2),
                visa: visaInquiries.docs.slice(0, 3),
                rental: rentalTransactions.docs.slice(0, 3)
            }
        })

    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
