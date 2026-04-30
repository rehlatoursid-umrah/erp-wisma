import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const payload = await getPayload({ config: configPromise })
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0] // YYYY-MM-DD

        // Calculate Start/End of Current Week for Auditorium
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday start
        const startOfWeek = new Date(now)
        startOfWeek.setDate(diff)
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)

        const startOfWeekStr = startOfWeek.toISOString().split('T')[0]
        const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

        // Clamp week start to current month boundary
        const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const effectiveStartStr = startOfWeekStr < startOfMonthStr ? startOfMonthStr : startOfWeekStr
        const effectiveStartISO = startOfWeekStr < startOfMonthStr ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString() : startOfWeek.toISOString()

        // 1. Hotel: Bookings This Week
        const hotelBookings = await payload.find({
            collection: 'hotel-bookings',
            where: {
                and: [
                    { checkIn: { greater_than_equal: effectiveStartStr } },
                    { checkIn: { less_than_equal: endOfWeekStr } },
                    { status: { not_equals: 'cancelled' } }
                ]
            },
            limit: 10,
            sort: 'checkIn',
        })
        const occupiedRooms = hotelBookings.totalDocs

        // 2. Auditorium: Events This Week
        const aulaBookings = await payload.find({
            collection: 'auditorium-bookings',
            where: {
                and: [
                    { 'event.date': { greater_than_equal: effectiveStartStr } },
                    { 'event.date': { less_than_equal: endOfWeekStr } },
                    { status: { not_equals: 'cancelled' } }
                ]
            },
            sort: 'event.date',
            limit: 5,
        })
        const upcomingEventsCount = aulaBookings.totalDocs

        // 3. Visa: Inquiries This Week
        const visaInquiries = await payload.find({
            collection: 'travel-docs',
            where: {
                and: [
                    { createdAt: { greater_than_equal: effectiveStartISO } },
                    { createdAt: { less_than_equal: endOfWeek.toISOString() } }
                ]
            },
            limit: 10,
            sort: '-createdAt',
        })
        const activeVisaCount = visaInquiries.totalDocs

        // 4. Rental: Orders This Week
        const rentalTransactions = await payload.find({
            collection: 'transactions',
            where: {
                and: [
                    { bookingType: { equals: 'rental' } },
                    { createdAt: { greater_than_equal: effectiveStartISO } },
                    { createdAt: { less_than_equal: endOfWeek.toISOString() } }
                ]
            },
            limit: 10,
            sort: '-createdAt',
        })
        const activeRentalsCount = rentalTransactions.totalDocs

        // 5. Recent Paid Invoices — CURRENT MONTH ONLY
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

        const paidInvoices = await payload.find({
            collection: 'transactions',
            where: {
                and: [
                    { paymentStatus: { equals: 'paid' } },
                    { createdAt: { greater_than_equal: startOfMonth.toISOString() } },
                    { createdAt: { less_than_equal: endOfMonth.toISOString() } },
                ]
            },
            limit: 10,
            sort: '-updatedAt',
        })

        // 6. Calculate Balances — CURRENT MONTH only (from Paid Transactions)
        // startOfMonth and endOfMonth already defined above

        const monthlyPaidInvoices = await payload.find({
            collection: 'transactions',
            where: {
                and: [
                    { paymentStatus: { equals: 'paid' } },
                    { createdAt: { greater_than_equal: startOfMonth.toISOString() } },
                    { createdAt: { less_than_equal: endOfMonth.toISOString() } },
                ]
            },
            limit: 10000,
            pagination: false,
        })

        const balances = {
            EGP: 0,
            USD: 0,
            IDR: 0,
            EUR: 0,
        }

        // Add Income (current month only)
        monthlyPaidInvoices.docs.forEach((inv: any) => {
            const amount = inv.totalAmount || 0
            const currency = inv.currency as 'EGP' | 'USD' | 'IDR' | 'EUR'
            if (balances.hasOwnProperty(currency)) {
                balances[currency] += amount
            }
        })

        const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

        // 7. Trend Invoices (Last 6 Months for Revenue Chart)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0)
        
        const trendInvoices = await payload.find({
            collection: 'transactions',
            where: {
                and: [
                    { paymentStatus: { equals: 'paid' } },
                    { createdAt: { greater_than_equal: sixMonthsAgo.toISOString() } }
                ]
            },
            limit: 5000,
            pagination: false,
            sort: 'createdAt',
        })

        return NextResponse.json({
            stats: {
                hotel: occupiedRooms,
                aula: upcomingEventsCount,
                visa: activeVisaCount,
                rental: activeRentalsCount,
                balances: { ...balances, monthLabel }
            },
            data: {
                hotel: hotelBookings.docs,
                aula: aulaBookings.docs,
                visa: visaInquiries.docs,
                rental: rentalTransactions.docs,
                recentPaidInvoices: paidInvoices.docs,
                revenueTrend: trendInvoices.docs
            }
        })

    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
