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
    }

    try {
        // Use mongoose aggregation directly to avoid memory exhaustion
        const Model = payload.db.collections?.['transactions']
        if (Model && typeof Model.aggregate === 'function') {
            const result = await Model.aggregate([
                { $match: { paymentStatus: 'paid' } },
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
                    paymentStatus: { equals: 'paid' }
                },
                pagination: false,
                limit: 10000,
                depth: 0 
            })

            paidInvoices.docs.forEach((inv: any) => {
                const amount = inv.totalAmount || 0
                const currency = inv.currency as 'EGP' | 'USD' | 'IDR'
                if (balances.hasOwnProperty(currency)) {
                    balances[currency] += amount
                }
            })
        }

        return NextResponse.json(balances)
    } catch (error) {
        console.error('Error calculating balances:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
