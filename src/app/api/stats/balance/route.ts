import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const payload = await getPayload({ config: configPromise })

    // 1. Paid Invoices (Income)
    const paidInvoices = await payload.find({
        collection: 'transactions',
        where: {
            paymentStatus: { equals: 'paid' }
        },
        pagination: false,
        limit: 10000,
        depth: 0 // minimal data
    })

    const balances = {
        EGP: 0,
        USD: 0,
        IDR: 0,
    }

    // Add Income
    paidInvoices.docs.forEach((inv: any) => {
        const amount = inv.totalAmount || 0
        const currency = inv.currency as 'EGP' | 'USD' | 'IDR'
        if (balances.hasOwnProperty(currency)) {
            balances[currency] += amount
        }
    })

    return NextResponse.json(balances)
}
