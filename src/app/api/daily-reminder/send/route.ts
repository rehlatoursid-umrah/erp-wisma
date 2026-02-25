import { NextResponse } from 'next/server'
import axios from 'axios'
import dns from 'dns'
import https from 'https'
import { Resolver } from 'dns'

// Custom DNS resolver using Google DNS (8.8.8.8)
// Bypasses ISP DNS that may not resolve certain domains (e.g. sumopod.my.id)
const resolver = new Resolver()
resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])

function customLookup(
    hostname: string,
    options: any,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
) {
    // Try Google DNS first
    resolver.resolve4(hostname, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
            return callback(null, addresses[0], 4)
        }
        // Fallback to system DNS (works on Vercel/cloud servers)
        dns.lookup(hostname, { family: 4 }, (err2, address, family) => {
            if (err2) return callback(err2, '', 4)
            callback(null, address, family)
        })
    })
}

// Create HTTPS agent with custom DNS lookup
const httpsAgent = new https.Agent({
    lookup: customLookup as any,
    keepAlive: true,
})

export async function POST(request: Request) {
    const start = Date.now()

    try {
        // 1. Get WhatsApp Config
        const whatsappEndpoint = process.env.WHATSAPP_API_ENDPOINT
        const whatsappUsername = process.env.WHATSAPP_API_USERNAME
        const whatsappPassword = process.env.WHATSAPP_API_PASSWORD
        const whatsappGroupId = process.env.WHATSAPP_GROUP_ID

        if (!whatsappEndpoint || !whatsappUsername || !whatsappPassword || !whatsappGroupId) {
            console.error('❌ WhatsApp API config missing:', {
                endpoint: !!whatsappEndpoint,
                username: !!whatsappUsername,
                password: !!whatsappPassword,
                groupId: !!whatsappGroupId,
            })
            return NextResponse.json(
                { success: false, error: 'Server configuration error: WhatsApp API not configured' },
                { status: 500 }
            )
        }

        // 2. Parse Form Data
        const data = await request.json()

        const {
            tanggal,
            petugasPiketKantor,
            petugasPiketDapur,
            acaraAuditorium,
            excludeService,
            kamarTerisi,
            catatan,
        } = data

        if (!petugasPiketKantor || !petugasPiketDapur) {
            return NextResponse.json(
                { success: false, error: 'Petugas piket kantor dan dapur wajib diisi' },
                { status: 400 }
            )
        }

        // 3. Format the date nicely
        const dateObj = new Date(tanggal)
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

        // 4. Build the WhatsApp message
        const excludeText = Array.isArray(excludeService) && excludeService.length > 0
            ? excludeService.join(', ')
            : 'Tidak ada'

        const kamarText = Array.isArray(kamarTerisi) && kamarTerisi.length > 0
            ? kamarTerisi.join(', ')
            : 'Tidak ada'

        const catatanText = catatan && catatan.trim()
            ? catatan.trim()
            : '1. Piket kantor dimulai dari pukul 08.00 s/d 22.00'

        const message = `*✨Daily Reminder✨*

Tanggal: ${formattedDate}

Petugas piket kantor: ${petugasPiketKantor}

Petugas Piket dapur: ${petugasPiketDapur}

Acara Penyewaan Auditorium: ${acaraAuditorium || 'Tidak ada'}

Exclude Service: ${excludeText}

Kamar Hotel terisi: ${kamarText}

Catatan:
${catatanText}`

        // 5. Format Phone for Group
        let formattedPhone = whatsappGroupId
        if (!formattedPhone.includes('@')) {
            formattedPhone += '@g.us'
        }

        // 6. Build URL
        const url = `${whatsappEndpoint.replace(/\/$/, '')}/send/message`

        console.log(`🚀 Sending Daily Reminder to: ${url}`)
        console.log(`📱 Group: ${formattedPhone}`)
        console.log(`🔐 Auth: ${whatsappUsername}:${'*'.repeat(whatsappPassword.length)}`)
        console.log(`🌐 Using custom DNS: 8.8.8.8, 8.8.4.4, 1.1.1.1`)

        // 7. Send with axios + Basic Auth + Custom DNS Agent
        const whatsappResponse = await axios.post(url, {
            phone: formattedPhone,
            message: message,
            is_forwarded: false,
        }, {
            auth: {
                username: whatsappUsername,
                password: whatsappPassword,
            },
            headers: {
                'Content-Type': 'application/json',
            },
            httpsAgent: httpsAgent,
            timeout: 45000,
            validateStatus: () => true,
        })

        const tookMs = Date.now() - start

        console.log(`📥 Response Status: ${whatsappResponse.status}`)
        console.log(`📥 Response Data:`, JSON.stringify(whatsappResponse.data).substring(0, 300))

        if (whatsappResponse.status >= 200 && whatsappResponse.status < 300) {
            console.log('✅ Daily Reminder sent successfully!')
            return NextResponse.json({
                success: true,
                message: 'Daily Reminder berhasil dikirim ke WA Group!',
                preview: message,
                tookMs,
                whatsappResponse: whatsappResponse.data,
            })
        } else {
            console.error('❌ WhatsApp API error:', whatsappResponse.status, whatsappResponse.data)
            return NextResponse.json({
                success: false,
                error: 'WhatsApp API gagal mengirim pesan',
                status: whatsappResponse.status,
                details: whatsappResponse.data,
                tookMs,
            }, { status: 502 })
        }

    } catch (error: any) {
        const tookMs = Date.now() - start
        console.error('❌ Daily Reminder send error:', error.message)

        let userMessage = error.message
        if (error.code === 'ECONNREFUSED') {
            userMessage = 'Tidak bisa terhubung ke server WhatsApp API. Pastikan server GoWA aktif.'
        } else if (error.code === 'ETIMEDOUT' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
            userMessage = 'Koneksi ke server WhatsApp timeout. Periksa jaringan internet Anda.'
        } else if (error.code === 'ENOTFOUND') {
            userMessage = 'Domain server WhatsApp tidak ditemukan. Periksa WHATSAPP_API_ENDPOINT di .env'
        }

        return NextResponse.json({
            success: false,
            error: userMessage,
            tookMs,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ready',
        endpoint: '/api/daily-reminder/send',
        method: 'POST',
        description: 'Send daily reminder message to WhatsApp group',
    })
}
