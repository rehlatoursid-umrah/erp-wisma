import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()

        const doc = await payload.create({
            collection: 'laporan-piket',
            data: {
                ...body,
                tanggal: body.tanggal ? new Date(body.tanggal).toISOString() : new Date().toISOString(),
            },
        })

        return NextResponse.json(doc)
    } catch (error) {
        console.error('Error creating laporan piket:', error)
        return NextResponse.json({ error: 'Failed to save laporan piket' }, { status: 500 })
    }
}

export async function GET(req: Request) {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)

    const petugas = searchParams.get('petugas')
    const month = searchParams.get('month') // 1-12
    const year = searchParams.get('year')

    try {
        const where: any = {}
        const andConditions: any[] = []

        if (petugas) {
            andConditions.push({ namaPetugas: { equals: petugas } })
        }

        if (month && year) {
            const m = parseInt(month, 10)
            const y = parseInt(year, 10)
            const startDate = new Date(y, m - 1, 1).toISOString()
            const endDate = new Date(y, m, 0, 23, 59, 59).toISOString()

            andConditions.push({ tanggal: { greater_than_equal: startDate } })
            andConditions.push({ tanggal: { less_than_equal: endDate } })
        }

        if (andConditions.length > 0) {
            where.and = andConditions
        }

        const results = await payload.find({
            collection: 'laporan-piket',
            where,
            sort: '-tanggal',
            limit: 100,
        })

        return NextResponse.json(results.docs)
    } catch (error) {
        console.error('Error fetching laporan piket:', error)
        return NextResponse.json({ error: 'Failed to fetch laporan piket' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const payload = await getPayload({ config })
    try {
        const body = await req.json()
        const { id, ...data } = body

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const updated = await payload.update({
            collection: 'laporan-piket',
            id,
            data,
        })
        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating laporan piket:', error)
        return NextResponse.json({ error: 'Failed to update laporan piket' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const payload = await getPayload({ config })
    try {
        const body = await req.json()
        const { id } = body

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await payload.delete({
            collection: 'laporan-piket',
            id,
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting laporan piket:', error)
        return NextResponse.json({ error: 'Failed to delete laporan piket' }, { status: 500 })
    }
}
