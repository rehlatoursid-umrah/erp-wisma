import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const USERS_TO_SEED = [
    { name: 'Ubaidillah Chair', email: 'ubaidillah@wismacairo.com', role: 'direktur', password: 'WNC-Ubaidillah26', pin: '311311' },
    { name: 'Habib Arifin makhtum', email: 'habib@wismacairo.com', role: 'sekretaris', password: 'WNC-Habib26' },
    { name: 'Obeid Albar', email: 'obeid@wismacairo.com', role: 'bendahara', password: 'WNC-Obeid26', pin: '310310' },
    { name: 'Muaz Widad', email: 'muaz@wismacairo.com', role: 'bpupd', password: 'WNC-Muaz26', pin: '312312' },
    { name: 'Indra Juliana Salim', email: 'indra@wismacairo.com', role: 'bpupd', password: 'WNC-Indra26', pin: '312312' },
    { name: 'Zulfan Firosi Zulfadhli', email: 'zulfan@wismacairo.com', role: 'bpupd', password: 'WNC-Zulfan26', pin: '312312' },
    { name: 'Subhan Hadi Alhabsyi', email: 'subhan@wismacairo.com', role: 'bpupd', password: 'WNC-Subhan26', pin: '312312' },
    { name: 'Rausan Fiqri', email: 'rausan@wismacairo.com', role: 'bpupd', password: 'WNC-Rausan26', pin: '312312' },
]

export async function GET(req: NextRequest) {
    try {
        const p = await getPayload({ config: await configPromise })
        const results = []

        for (const userData of USERS_TO_SEED) {
            // Delete existing user if present
            const existingUsers = await p.find({
                collection: 'users',
                where: { email: { equals: userData.email } },
            })
            if (existingUsers.totalDocs > 0) {
                await p.delete({
                    collection: 'users',
                    id: existingUsers.docs[0].id
                })
            }

            // Create user
            try {
                const newUser = await p.create({
                    collection: 'users',
                    data: {
                        name: userData.name,
                        email: userData.email,
                        password: userData.password,
                        role: userData.role,
                        pin: userData.pin
                    }
                })

                // Read directly from DB to verify hashing
                const dbUser = await p.db.findOne({ collection: 'users', req: { payload: p } as any, where: { email: { equals: userData.email } } })

                results.push({
                    email: userData.email,
                    status: 'Created successfully',
                    verifiedHashed: !!dbUser?.hash
                })
            } catch (err) {
                results.push({ email: userData.email, status: 'Payload create error', error: String(err) })
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('Error seeding users:', error)
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
