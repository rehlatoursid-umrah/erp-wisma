import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const payload = await getPayload({ config: configPromise })

    const headers = new Headers(req.headers)
    const { user } = await payload.auth({ headers })
    
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balances = {
        EGP: 0,
        USD: 0,
        IDR: 0,
        EUR: 0,
    }

    try {
        // Calculate start and end of current month
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

        // Use mongoose aggregation directly for performance
        const Model = payload.db.collections?.['transactions']
        if (Model && typeof Model.aggregate === 'function') {
            const result = await Model.aggregate([
                {
                    $match: {
                        paymentStatus: 'paid',
                        createdAt: {
                            $gte: startOfMonth,
                            $lte: endOfMonth
                        }
                    }
                },
                { $group: { _id: '$currency', total: { $sum: '$totalAmount' } } }
            ])
            
            result.forEach((item: any) => {
                if (balances.hasOwnProperty(item._id)) {
                    balances[item._id as keyof typeof balances] += item.total
                }
            })
        } else {
            // Fallback (for testing / if adapter is different)
            const paidInvoices = await payload.find({
                collection: 'transactions',
                where: {
                    and: [
                        { paymentStatus: { equals: 'paid' } },
                        { createdAt: { greater_than_equal: startOfMonth.toISOString() } },
                        { createdAt: { less_than_equal: endOfMonth.toISOString() } },
                    ]
                },
                pagination: false,
                limit: 10000,
                depth: 0 
            })

            paidInvoices.docs.forEach((inv: any) => {
                const amount = inv.totalAmount || 0
                const currency = inv.currency as 'EGP' | 'USD' | 'IDR' | 'EUR'
                if (balances.hasOwnProperty(currency)) {
                    balances[currency] += amount
                }
            })
        }

        // Include month label for the frontend
        const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        return NextResponse.json({ ...balances, monthLabel })
    } catch (error) {
        console.error('Error calculating balances:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
