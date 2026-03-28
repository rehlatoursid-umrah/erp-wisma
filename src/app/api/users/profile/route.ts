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

        // Handle avatar upload via FormData
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData()
            const file = formData.get('avatar') as File | null

            if (file) {
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)

                // Upload to media collection
                const media = await payload.create({
                    collection: 'media',
                    data: { alt: `Avatar - ${user.name || user.email}` },
                    file: {
                        data: buffer,
                        name: file.name,
                        mimetype: file.type,
                        size: file.size,
                    },
                })

                // Update user's avatar field
                const updated = await payload.update({
                    collection: 'users',
                    id: user.id,
                    data: { avatar: media.id },
                    depth: 1,
                })

                return NextResponse.json({ user: updated })
            }
        }

        // Handle JSON profile update (name, phoneWA)
        const body = await req.json()
        const { name, phoneWA } = body

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (phoneWA !== undefined) updateData.phoneWA = phoneWA

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
