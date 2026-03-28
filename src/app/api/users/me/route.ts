import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function GET(req: Request) {
    try {
        const payload = await getPayload({ config: await configPromise })

        // Use Payload 3 native auth utility
        const reqHeaders = await headers()
        const { user: authUser } = await payload.auth({ headers: reqHeaders })

        if (!authUser) {
            return NextResponse.json({ user: null }, { status: 401 })
        }

        const user = await payload.findByID({
            collection: 'users',
            id: authUser.id,
            depth: 1,
        })

        return NextResponse.json({ user })
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
