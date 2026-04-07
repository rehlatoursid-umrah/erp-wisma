import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')  // 0-11
    const year  = searchParams.get('year')

    try {
        // Build cashflow query with optional month/year filter
        const cashflowWhere: any = {}

        if (month !== null && year !== null) {
            const m = Number(month)
            const y = Number(year)
            const startOfMonth = new Date(y, m, 1).toISOString()
            const endOfMonth   = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString()
            cashflowWhere.and = [
                { transactionDate: { greater_than_equal: startOfMonth } },
                { transactionDate: { less_than_equal: endOfMonth } },
            ]
        }

        const cashflow = await payload.find({
            collection: 'cashflow',
            where: cashflowWhere,
            sort: '-transactionDate',
            limit: 500,
            pagination: false,
        })

        const invoices = await payload.find({
            collection: 'transactions',
            where: { paymentStatus: { equals: 'paid' } },
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

        if (!transactionDate || !category || !amount || !currency || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newTransaction = await payload.create({
            collection: 'cashflow',
            data: {
                transactionDate,
                type,
                category,
                amount: Number(amount),
                currency,
                description,
                quantity:   quantity   ? Number(quantity)   : undefined,
                unitPrice:  unitPrice  ? Number(unitPrice)  : undefined,
                proofImage: proofImage || undefined,
                approvalStatus: 'approved',
            },
        })

        return NextResponse.json(newTransaction)
    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const payload = await getPayload({ config })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 })
        }

        await payload.delete({ collection: 'cashflow', id })
        return NextResponse.json({ success: true, deleted: id })
    } catch (error) {
        console.error('Error deleting transaction:', error)
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }
}
