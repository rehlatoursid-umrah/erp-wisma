import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { generateInventoryCode } from '@/constants/asset-inventory'

export async function GET(req: Request) {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const floor = searchParams.get('floor')
    const room = searchParams.get('room')
    const search = searchParams.get('search')
    const condition = searchParams.get('condition')

    try {
        const andQuery: any[] = []

        if (floor) andQuery.push({ floor: { equals: Number(floor) } })
        if (room) andQuery.push({ room: { equals: room } })
        if (condition) andQuery.push({ condition: { equals: condition } })
        if (search) {
            andQuery.push({
                or: [
                    { itemName: { contains: search } },
                    { inventoryCode: { contains: search } },
                    { brand: { contains: search } },
                ]
            })
        }

        const items = await payload.find({
            collection: 'asset-inventory',
            where: andQuery.length > 0 ? { and: andQuery } : {},
            sort: '-createdAt',
            limit: 1000,
            pagination: false,
            depth: 1, // populate room relationship
        })

        // Calculate summary stats
        const docs = items.docs
        const totalItems = docs.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0)
        const totalValueEGP = docs.reduce((sum: number, d: any) => sum + (d.totalValueEGP || 0), 0)
        const totalValueIDR = docs.reduce((sum: number, d: any) => sum + (d.totalValueIDR || 0), 0)
        const totalBaik = docs.filter((d: any) => d.condition === 'baik').length
        const totalRusak = docs.filter((d: any) => d.condition === 'rusak').length

        return NextResponse.json({
            docs,
            summary: {
                totalRecords: docs.length,
                totalItems,
                totalValueEGP,
                totalValueIDR,
                totalBaik,
                totalRusak,
            }
        })
    } catch (error) {
        console.error('Error fetching asset inventory:', error)
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        const { floor, room: roomId, ...rest } = body

        if (!floor || !roomId) {
            return NextResponse.json({ error: 'Floor and room are required' }, { status: 400 })
        }

        // Get room details for code generation
        const roomDoc = await payload.findByID({
            collection: 'asset-rooms',
            id: roomId,
        })

        if (!roomDoc) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }

        // Find next sequence number for this floor+room
        const existing = await payload.find({
            collection: 'asset-inventory',
            where: {
                and: [
                    { floor: { equals: Number(floor) } },
                    { room: { equals: roomId } },
                ]
            },
            sort: '-inventoryCode',
            limit: 1,
        })

        let nextSeq = 1
        if (existing.docs.length > 0) {
            const lastCode = existing.docs[0].inventoryCode as string
            const parts = lastCode.split('-')
            const lastNum = parseInt(parts[parts.length - 1], 10)
            if (!isNaN(lastNum)) nextSeq = lastNum + 1
        }

        const inventoryCode = generateInventoryCode(Number(floor), roomDoc.roomCode as string, nextSeq)

        const newItem = await payload.create({
            collection: 'asset-inventory',
            data: {
                ...rest,
                floor: Number(floor),
                room: roomId,
                inventoryCode,
            },
        })

        // Re-fetch with depth to populate room
        const populated = await payload.findByID({
            collection: 'asset-inventory',
            id: newItem.id,
            depth: 1,
        })

        return NextResponse.json(populated)
    } catch (error) {
        console.error('Error creating asset inventory:', error)
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
            collection: 'asset-inventory',
            id,
            data: updateData,
        })

        // Re-fetch with depth
        const populated = await payload.findByID({
            collection: 'asset-inventory',
            id: updatedItem.id,
            depth: 1,
        })

        return NextResponse.json(populated)
    } catch (error) {
        console.error('Error updating asset inventory:', error)
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

        await payload.delete({ collection: 'asset-inventory', id })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting asset inventory:', error)
        return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
    }
}
