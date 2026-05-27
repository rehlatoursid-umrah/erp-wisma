import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { generateRoomCode } from '@/constants/asset-inventory'

export async function GET(req: Request) {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const floor = searchParams.get('floor')

    try {
        const where: any = {}
        if (floor) {
            where.floor = { equals: Number(floor) }
        }

        const rooms = await payload.find({
            collection: 'asset-rooms',
            where,
            sort: 'floor,roomName',
            limit: 500,
            pagination: false,
        })

        return NextResponse.json(rooms.docs)
    } catch (error) {
        console.error('Error fetching rooms:', error)
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        const { floor, roomName } = body

        if (!floor || !roomName) {
            return NextResponse.json({ error: 'Floor and roomName are required' }, { status: 400 })
        }

        // Generate room code
        const roomCode = generateRoomCode(roomName)

        // Check if code already exists, if so, append floor number
        const existing = await payload.find({
            collection: 'asset-rooms',
            where: { roomCode: { equals: roomCode } },
            limit: 1,
        })

        let finalCode = roomCode
        if (existing.docs.length > 0) {
            finalCode = `${roomCode}${floor}`
            // Check again
            const existing2 = await payload.find({
                collection: 'asset-rooms',
                where: { roomCode: { equals: finalCode } },
                limit: 1,
            })
            if (existing2.docs.length > 0) {
                // Add timestamp suffix
                finalCode = `${roomCode}${floor}${Date.now().toString().slice(-3)}`
            }
        }

        const newRoom = await payload.create({
            collection: 'asset-rooms',
            data: {
                floor: Number(floor),
                roomName,
                roomCode: finalCode,
            },
        })

        return NextResponse.json(newRoom)
    } catch (error) {
        console.error('Error creating room:', error)
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
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

        // Check if room has inventory items
        const items = await payload.find({
            collection: 'asset-inventory',
            where: { room: { equals: id } },
            limit: 1,
        })

        if (items.docs.length > 0) {
            return NextResponse.json(
                { error: 'Tidak bisa menghapus ruangan yang masih memiliki inventaris. Hapus semua barang di ruangan ini terlebih dahulu.' },
                { status: 400 }
            )
        }

        await payload.delete({ collection: 'asset-rooms', id })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting room:', error)
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
    }
}
