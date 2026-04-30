import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const division = searchParams.get('division')

    try {
        const andQuery: any[] = []

        if (division) {
            andQuery.push({ division: { equals: division } })
        }

        const inventory = await payload.find({
            collection: 'inventory',
            where: andQuery.length > 0 ? { and: andQuery } : {},
            sort: '-createdAt',
            limit: 500,
            pagination: false,
        })

        return NextResponse.json(inventory.docs)
    } catch (error) {
        console.error('Error fetching inventory:', error)
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        
        const newItem = await payload.create({
            collection: 'inventory',
            data: {
                ...body,
                lastRestocked: new Date().toISOString()
            },
        })

        return NextResponse.json(newItem)
    } catch (error) {
        console.error('Error creating inventory item:', error)
        return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        }

        const updatedItem = await payload.update({
            collection: 'inventory',
            id,
            data: updateData,
        })

        return NextResponse.json(updatedItem)
    } catch (error) {
        console.error('Error updating inventory item:', error)
        return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const payload = await getPayload({ config })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        }

        await payload.delete({ collection: 'inventory', id })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting inventory item:', error)
        return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
    }
}
