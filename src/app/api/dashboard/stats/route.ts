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

        // 1. Hotel: Active Guests Today (Checked In)
        // Logic: Status is 'checked-in' OR (CheckIn <= Today AND CheckOut > Today)
        const hotelBookings = await payload.find({
            collection: 'hotel-bookings',
            where: {
                and: [
                    {
                        or: [
                            { status: { equals: 'checked-in' } },
                            {
                                and: [
                                    { checkIn: { less_than_equal: now.toISOString() } },
                                    { checkOut: { greater_than: now.toISOString() } },
                                    { status: { not_equals: 'cancelled' } }
                                ]
                            }
                        ]
                    }
                ]
            },
            limit: 5,
            sort: 'checkIn',
        })
        const occupiedRooms = hotelBookings.totalDocs // We want total count, but also details for the card

        // 2. Auditorium: Events This Week
        const aulaBookings = await payload.find({
            collection: 'auditorium-bookings',
            where: {
                and: [
                    { 'event.date': { greater_than_equal: startOfWeekStr } },
                    { 'event.date': { less_than_equal: endOfWeekStr } },
                    { status: { not_equals: 'cancelled' } }
                ]
            },
            sort: 'event.date',
            limit: 5,
        })
        const upcomingEventsCount = aulaBookings.totalDocs

        // 3. Visa: Recent Inquiries (Pending Docs or On Process)
        const visaInquiries = await payload.find({
            collection: 'travel-docs',
            where: {
                visaStatus: { in: ['pending_docs', 'on_process'] }
            },
            limit: 5,
            sort: '-createdAt',
        })
        const activeVisaCount = visaInquiries.totalDocs

        // 4. Rental: Recent Orders (Transactions with type 'rental')
        const rentalTransactions = await payload.find({
            collection: 'transactions',
            where: {
                bookingType: { equals: 'rental' }
            },
            limit: 5,
            sort: '-createdAt',
        })
        const activeRentalsCount = rentalTransactions.totalDocs

        // 5. Recent Paid Invoices
        const paidInvoices = await payload.find({
            collection: 'transactions',
            where: {
                paymentStatus: { equals: 'paid' }
            },
            limit: 5,
            sort: '-updatedAt', // Show most recently paid/updated
        })

        // 6. Calculate Balances (USD, EGP, IDR)
        // Income: From Paid Transactions
        const allPaidInvoices = await payload.find({
            collection: 'transactions',
            where: {
                paymentStatus: { equals: 'paid' }
            },
            limit: 10000,
            pagination: false,
        })

        // Expense: From Approved Cashflow (Type: 'out')
        const allExpenses = await payload.find({
            collection: 'cashflow',
            where: {
                and: [
                    { type: { equals: 'out' } },
                    { approvalStatus: { equals: 'approved' } }
                ]
            },
            limit: 10000,
            pagination: false,
        })

        const balances = {
            EGP: 0,
            USD: 0,
            IDR: 0,
        }

        // Add Income
        allPaidInvoices.docs.forEach((inv: any) => {
            const amount = inv.totalAmount || 0
            const currency = inv.currency as 'EGP' | 'USD' | 'IDR'
            if (balances.hasOwnProperty(currency)) {
                balances[currency] += amount
            }
        })

        // Subtract Expenses
        allExpenses.docs.forEach((exp: any) => {
            const amount = exp.amount || 0
            const currency = exp.currency as 'EGP' | 'USD' | 'IDR'
            if (balances.hasOwnProperty(currency)) {
                balances[currency] -= amount
            }
        })

        return NextResponse.json({
            stats: {
                hotel: occupiedRooms,
                aula: upcomingEventsCount,
                visa: activeVisaCount,
                rental: activeRentalsCount,
                balances // Add balances here
            },
            data: {
                hotel: hotelBookings.docs,
                aula: aulaBookings.docs,
                visa: visaInquiries.docs,
                rental: rentalTransactions.docs,
                recentPaidInvoices: paidInvoices.docs
            }
        })

    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
