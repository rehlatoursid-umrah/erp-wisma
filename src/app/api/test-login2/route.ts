import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
    try {
        const payload = await getPayload({ config: await configPromise })
        try {
            const res = await payload.login({
                collection: 'users',
                data: {
                    email: 'ubaidillah@wismacairo.com',
                    password: 'WNC-Ubaidillah26',
                },
            })
            return NextResponse.json({ success: true, user: res.user.email })
        } catch (authErr) {
            return NextResponse.json({ success: false, authError: String(authErr) })
        }
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
