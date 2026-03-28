import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config: await configPromise })
        const reqHeaders = await headers()
        const { user } = await payload.auth({ headers: reqHeaders })

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
        }

        if (!user.email) {
            return NextResponse.json({ error: 'Email pengguna tidak tersedia' }, { status: 400 })
        }

        // Verify current password by attempting login
        try {
            await payload.login({
                collection: 'users',
                data: {
                    email: user.email,
                    password: currentPassword,
                },
            })
        } catch {
            return NextResponse.json({ error: 'Password lama salah' }, { status: 403 })
        }

        // Update to new password
        await payload.update({
            collection: 'users',
            id: user.id,
            data: { password: newPassword },
        })

        return NextResponse.json({ success: true, message: 'Password berhasil diubah' })
    } catch (error) {
        console.error('Error changing password:', error)
        return NextResponse.json({ error: 'Gagal mengubah password' }, { status: 500 })
    }
}
