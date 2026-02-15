import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET() {
    const payload = await getPayload({ config })

    try {
        const cashflow = await payload.find({
            collection: 'cashflow',
            sort: '-transactionDate',
            limit: 100,
            pagination: false,
        })

        const invoices = await payload.find({
            collection: 'transactions',
            where: {
                paymentStatus: { equals: 'paid' }
            },
            sort: '-updatedAt',
            limit: 10000,
            pagination: false,
            depth: 2,
        })

        return NextResponse.json({
            cashflow: cashflow.docs,
            invoices: invoices.docs
        })
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        const { transactionDate, category, amount, currency, type, description, quantity, unitPrice, proofImage } = body

        // Validation
        if (!transactionDate || !category || !amount || !currency || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newTransaction = await payload.create({
            collection: 'cashflow',
            data: {
                transactionDate: transactionDate,
                type: type, // 'in' or 'out'
                category: category,
                amount: Number(amount),
                currency: currency,
                description: description,
                quantity: quantity ? Number(quantity) : undefined,
                unitPrice: unitPrice ? Number(unitPrice) : undefined,
                proofImage: proofImage || undefined,
                approvalStatus: 'approved', // Auto-approve for now/Simplification
            },
        })

        return NextResponse.json(newTransaction)
    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }
}
