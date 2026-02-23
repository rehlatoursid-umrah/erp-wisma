import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
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
        const p = await payload.init({ config: await configPromise })
        const results = []

        for (const userData of USERS_TO_SEED) {
            // Check if user already exists based on email
            const existingUsers = await p.find({
                collection: 'users',
                where: { email: { equals: userData.email } },
            })

            if (existingUsers.totalDocs > 0) {
                results.push({ email: userData.email, status: 'Already exists' })
            } else {
                // Create user
                await p.create({
                    collection: 'users',
                    data: {
                        name: userData.name,
                        email: userData.email,
                        password: userData.password,
                        role: userData.role,
                        pin: userData.pin, // Included pin for applicable roles
                    },
                })
                results.push({ email: userData.email, status: 'Created successfully' })
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('Error seeding users:', error)
        return NextResponse.json({ success: false, error: 'Failed to seed users' }, { status: 500 })
    }
}
