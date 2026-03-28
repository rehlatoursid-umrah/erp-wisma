import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function PATCH(req: Request) {
    try {
        const payload = await getPayload({ config: await configPromise })
        const reqHeaders = await headers()
        const { user } = await payload.auth({ headers: reqHeaders })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const contentType = req.headers.get('content-type') || ''
        
        // Ensure request is application/json
        if (!contentType.includes('application/json')) {
            return NextResponse.json({ error: 'Unsupported media type' }, { status: 415 })
        }

        // Handle JSON profile update (name, phoneWA, avatar)
        const body = await req.json()
        const { name, phoneWA, avatar } = body

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (phoneWA !== undefined) updateData.phoneWA = phoneWA
        if (avatar !== undefined) updateData.avatar = avatar

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        const updated = await payload.update({
            collection: 'users',
            id: user.id,
            data: updateData,
            depth: 1,
        })

        return NextResponse.json({ user: updated })
    } catch (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}
