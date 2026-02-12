import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })
        const { searchParams } = new URL(req.url)
        const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        console.log(`Fetching invoices: limit=${limit}, status=${status}, type=${type}`)

        const query: any = {
            collection: 'transactions',
            sort: '-createdAt',
            limit,
            depth: 0,
            where: {}
        }

        if (status) {
            query.where.paymentStatus = { equals: status }
        }

        if (type) {
            query.where.bookingType = { equals: type }
        }

        const transactions = await payload.find(query)

        return NextResponse.json(transactions)
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }
}
