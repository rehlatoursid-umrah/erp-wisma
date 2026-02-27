import { NextResponse } from 'next/server'
import axios from 'axios'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { phone, bookingId, guestName, room, nights, checkIn, checkOut, total, currency, status } = data

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Nomor WhatsApp customer tidak tersedia' }, { status: 400 })
        }

        // WhatsApp API Config
        const whatsappEndpoint = process.env.WHATSAPP_API_ENDPOINT
        const whatsappUsername = process.env.WHATSAPP_API_USERNAME
        const whatsappPassword = process.env.WHATSAPP_API_PASSWORD

        if (!whatsappEndpoint || !whatsappUsername || !whatsappPassword) {
            return NextResponse.json({ success: false, error: 'WhatsApp API belum dikonfigurasi' }, { status: 500 })
        }

        // Format phone number (ensure it starts with country code, no + prefix)
        let formattedPhone = phone.replace(/[^0-9]/g, '')
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1) // Indonesian default
        }
        if (!formattedPhone.includes('@')) {
            formattedPhone += '@s.whatsapp.net'
        }

        // Build the invoice message
        const statusText = status === 'paid' ? '✅ LUNAS' : '⏳ BELUM LUNAS'
        const invoiceMessage = `📄 *INVOICE - Wisma Nusantara Cairo*

━━━━━━━━━━━━━━━━━━━━━━

🏨 *Detail Booking*
• Booking ID: *${bookingId}*
• Tamu: *${guestName}*
• Kamar: *${room}*
• Check-in: ${checkIn}
• Check-out: ${checkOut}
• Durasi: ${nights} malam

💰 *Total: ${parseInt(total).toLocaleString()} ${currency}*

📌 Status: ${statusText}

━━━━━━━━━━━━━━━━━━━━━━

💳 *Informasi Pembayaran*
Pembayaran HANYA dapat dilakukan secara CASH (TUNAI) kepada resepsionis.

━━━━━━━━━━━━━━━━━━━━━━

📞 *Kontak Admin*
• WhatsApp: +62 851-8991-6769
• Phone: 01554646871
• Email: admin@wismanusantaracairo.com

_Terima kasih telah menginap di Wisma Nusantara Cairo_ 🏠`

        // Send message via GoWA API
        const url = `${whatsappEndpoint.replace(/\/$/, '')}/send/message`

        console.log(`🚀 Sending Invoice WA to: ${formattedPhone}`)

        const whatsappResponse = await axios.post(url, {
            phone: formattedPhone,
            message: invoiceMessage,
            is_forwarded: false,
        }, {
            auth: {
                username: whatsappUsername,
                password: whatsappPassword,
            },
            headers: { 'Content-Type': 'application/json' },
            timeout: 45000,
            validateStatus: () => true,
        })

        console.log(`📥 WA Response: ${whatsappResponse.status}`)

        if (whatsappResponse.status >= 200 && whatsappResponse.status < 300) {
            return NextResponse.json({
                success: true,
                message: `Invoice berhasil dikirim ke WhatsApp ${phone}`,
            })
        } else {
            console.error('❌ WhatsApp API error:', whatsappResponse.status, whatsappResponse.data)
            return NextResponse.json({
                success: false,
                error: 'Gagal mengirim ke WhatsApp',
                details: whatsappResponse.data,
            }, { status: 502 })
        }

    } catch (error: any) {
        console.error('❌ Send WA Invoice error:', error.message)

        let userMessage = error.message
        if (error.code === 'ECONNREFUSED') {
            userMessage = 'Server WhatsApp API tidak aktif.'
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            userMessage = 'Koneksi ke WhatsApp timeout.'
        }

        return NextResponse.json({
            success: false,
            error: userMessage,
        }, { status: 500 })
    }
}
