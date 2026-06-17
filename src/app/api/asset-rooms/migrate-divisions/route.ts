import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getResponsibleDivision } from '@/constants/asset-inventory'

/**
 * POST /api/asset-rooms/migrate-divisions
 * One-time migration: set responsibleDivision for all existing rooms
 * based on floor + roomName mapping.
 */
export async function POST() {
    const payload = await getPayload({ config })

    try {
        // Fetch ALL rooms
        const allRooms = await payload.find({
            collection: 'asset-rooms',
            limit: 500,
            pagination: false,
        })

        const results: { id: string; roomName: string; floor: number; oldDiv: string; newDiv: string }[] = []

        for (const room of allRooms.docs) {
            const floor = room.floor as number
            const roomName = room.roomName as string
            const oldDiv = (room.responsibleDivision as string) || '(kosong)'
            const newDiv = getResponsibleDivision(floor, roomName)

            // Update the room
            await payload.update({
                collection: 'asset-rooms',
                id: room.id,
                data: {
                    responsibleDivision: newDiv,
                },
            })

            results.push({ id: room.id, roomName, floor, oldDiv, newDiv })
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil update ${results.length} ruangan`,
            details: results,
        })
    } catch (error) {
        console.error('Error migrating divisions:', error)
        return NextResponse.json({ error: 'Failed to migrate divisions' }, { status: 500 })
    }
}
