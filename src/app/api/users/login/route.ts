import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json()
        const payload = await getPayload({ config: await configPromise })

        try {
            const res = await payload.login({
                collection: 'users',
                data: { email, password },
            })

            if (res.token) {
                const cookieStore = await cookies()
                cookieStore.set('payload-token', res.token, {
                    httpOnly: true,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                })
            }

            return NextResponse.json({ success: true, user: res.user })
        } catch (authErr) {
            return NextResponse.json({ success: false, error: 'Email atau Password salah!' }, { status: 401 })
        }
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
