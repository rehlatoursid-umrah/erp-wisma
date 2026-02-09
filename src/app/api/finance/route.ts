import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET() {
    const payload = await getPayload({ config })

    try {
        const transactions = await payload.find({
            collection: 'cashflow',
            sort: '-transactionDate',
            limit: 100,
        })

        return NextResponse.json(transactions.docs)
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        const { date, category, amount, currency, type, description, quantity, unitPrice, proofImage } = body

        // Validation
        if (!date || !category || !amount || !currency || !type || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newTransaction = await payload.create({
            collection: 'cashflow',
            data: {
                transactionDate: date,
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
