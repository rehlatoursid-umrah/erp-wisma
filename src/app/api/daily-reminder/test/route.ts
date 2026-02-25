import { NextResponse } from 'next/server'
import axios from 'axios'

// Simple test endpoint to verify GoWA connectivity from Vercel
export async function GET() {
    const start = Date.now()
    const endpoint = process.env.WHATSAPP_API_ENDPOINT
    const username = process.env.WHATSAPP_API_USERNAME
    const password = process.env.WHATSAPP_API_PASSWORD
    const groupId = process.env.WHATSAPP_GROUP_ID

    const results: any = {
        timestamp: new Date().toISOString(),
        env_check: {
            endpoint: endpoint ? `✅ ${endpoint}` : '❌ MISSING',
            username: username ? `✅ ${username}` : '❌ MISSING',
            password: password ? `✅ ${'*'.repeat(password.length)}` : '❌ MISSING',
            groupId: groupId ? `✅ ${groupId}` : '❌ MISSING',
        },
        dns_test: 'pending',
        connection_test: 'pending',
    }

    if (!endpoint) {
        results.error = 'WHATSAPP_API_ENDPOINT not set in Vercel env vars'
        return NextResponse.json(results)
    }

    // Test 1: DNS resolution
    try {
        const dns = require('dns')
        const url = new URL(endpoint)
        const hostname = url.hostname

        await new Promise<void>((resolve, reject) => {
            dns.lookup(hostname, { family: 4 }, (err: any, address: string) => {
                if (err) {
                    results.dns_test = `❌ Failed: ${err.code} - ${err.message}`
                    reject(err)
                } else {
                    results.dns_test = `✅ Resolved to ${address}`
                    resolve()
                }
            })
        })
    } catch (e: any) {
        results.dns_test = `❌ ${e.message}`
    }

    // Test 2: HTTP connection to GoWA
    try {
        const response = await axios.get(endpoint, {
            auth: { username: username!, password: password! },
            timeout: 15000,
            validateStatus: () => true,
        })
        results.connection_test = `✅ Status ${response.status} (${Date.now() - start}ms)`
        results.server_response = typeof response.data === 'string'
            ? response.data.substring(0, 200)
            : JSON.stringify(response.data).substring(0, 200)
    } catch (e: any) {
        results.connection_test = `❌ ${e.code || e.message} (${Date.now() - start}ms)`
    }

    // Test 3: Send message endpoint check
    try {
        const url = `${endpoint.replace(/\/$/, '')}/send/message`
        const response = await axios.options(url, {
            auth: { username: username!, password: password! },
            timeout: 10000,
            validateStatus: () => true,
        })
        results.send_endpoint_test = `✅ Status ${response.status}`
    } catch (e: any) {
        results.send_endpoint_test = `❌ ${e.code || e.message}`
    }

    results.total_time_ms = Date.now() - start
    return NextResponse.json(results, { status: 200 })
}
