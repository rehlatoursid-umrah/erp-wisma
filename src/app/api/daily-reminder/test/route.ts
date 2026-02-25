import { NextResponse } from 'next/server'
import axios from 'axios'

export const maxDuration = 60

// Diagnostic endpoint: tests GoWA connectivity and actual message sending
export async function GET(request: Request) {
    const start = Date.now()
    const endpoint = process.env.WHATSAPP_API_ENDPOINT
    const username = process.env.WHATSAPP_API_USERNAME!
    const password = process.env.WHATSAPP_API_PASSWORD!
    const groupId = process.env.WHATSAPP_GROUP_ID!

    const results: any = {
        timestamp: new Date().toISOString(),
        env_ok: !!(endpoint && username && password && groupId),
    }

    if (!endpoint) {
        return NextResponse.json({ ...results, error: 'ENV VARS MISSING' })
    }

    const authConfig = {
        auth: { username, password },
        timeout: 15000,
        validateStatus: () => true as const,
    }

    // Test 1: Check GoWA app status (is WhatsApp connected?)
    try {
        const statusRes = await axios.get(`${endpoint}/app/status`, authConfig)
        results.app_status = {
            http_status: statusRes.status,
            data: statusRes.data,
        }
    } catch (e: any) {
        results.app_status = { error: e.code || e.message }
    }

    // Test 2: Check connected devices
    try {
        const devicesRes = await axios.get(`${endpoint}/app/devices`, authConfig)
        results.devices = {
            http_status: devicesRes.status,
            data: devicesRes.data,
        }
    } catch (e: any) {
        results.devices = { error: e.code || e.message }
    }

    // Test 3: Try sending a simple test message
    const formattedPhone = groupId.includes('@') ? groupId : `${groupId}@g.us`
    try {
        const sendRes = await axios.post(`${endpoint}/send/message`, {
            phone: formattedPhone,
            message: '🧪 Test koneksi dari ERP Wisma Nusantara Cairo',
        }, {
            ...authConfig,
            timeout: 30000,
        })
        results.send_test = {
            http_status: sendRes.status,
            data: sendRes.data,
            took_ms: Date.now() - start,
        }
    } catch (e: any) {
        results.send_test = {
            error: e.code || e.message,
            took_ms: Date.now() - start,
        }
    }

    results.total_time_ms = Date.now() - start
    return NextResponse.json(results, { status: 200 })
}
