import { NextResponse } from 'next/server'
import axios from 'axios'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { phone, pdfBase64, bookingId, guestName, eventName, total, currency, status, date } = data

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Nomor WhatsApp customer tidak tersedia' }, { status: 400 })
        }

        if (!pdfBase64) {
            return NextResponse.json({ success: false, error: 'PDF data tidak tersedia' }, { status: 400 })
        }

        const whatsappEndpoint = process.env.WHATSAPP_API_ENDPOINT
        const whatsappUsername = process.env.WHATSAPP_API_USERNAME
        const whatsappPassword = process.env.WHATSAPP_API_PASSWORD

        if (!whatsappEndpoint || !whatsappUsername || !whatsappPassword) {
            return NextResponse.json({ success: false, error: 'WhatsApp API belum dikonfigurasi' }, { status: 500 })
        }

        // Format phone number
        let formattedPhone = phone.replace(/[^0-9]/g, '')
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1)
        }
        if (!formattedPhone.includes('@')) {
            formattedPhone += '@s.whatsapp.net'
        }

        const baseUrl = whatsappEndpoint.replace(/\/$/, '')

        // Convert base64 PDF to Buffer
        const pdfBuffer = Buffer.from(pdfBase64, 'base64')
        // Generate PDF Filename based on request
        const bookingNumber = bookingId.replace('AULA-', '')
        const invoiceFilename = `Confirmation_Aula-${bookingNumber}.pdf`

        console.log(`📄 PDF received: ${pdfBuffer.length} bytes`)
        console.log(`📤 Sending PDF + caption to ${formattedPhone}`)

        // Build caption text
        const isConfirmed = status === 'paid' || status === 'confirmed'
        const statusText = isConfirmed ? '✅ Booking Confirmed' : '⏳ Booking Pending'
        const captionText = `📄 *BOOKING CONFIRMATION - Wisma Nusantara Cairo*

━━━━━━━━━━━━━━━━━━━━━━

🏨 *Detail Booking*
• Booking ID: *${bookingId}*
• Penyewa: *${guestName}*
• Layanan: *Sewa Auditorium*
• Tanggal Acara: ${date}

💰 *Total: ${parseInt(total).toLocaleString()} ${currency}*

📌 Status: ${statusText}

━━━━━━━━━━━━━━━━━━━━━━

💳 Pembayaran HANYA CASH (TUNAI) kepada resepsionis.

📞 Admin: +62 851-8991-6769

_Terima kasih telah menggunakan layanan Wisma Nusantara Cairo_ 🏠`

        // Send PDF + caption as ONE message via GoWA /send/file (multipart/form-data)
        const formData = new FormData()
        formData.append('phone', formattedPhone)
        formData.append('caption', captionText)
        formData.append('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), invoiceFilename)

        const response = await axios.post(`${baseUrl}/send/file`, formData, {
            auth: { username: whatsappUsername, password: whatsappPassword },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
            },
            timeout: 45000,
            validateStatus: () => true,
        })

        console.log(`📥 GoWA Response: ${response.status}`, JSON.stringify(response.data).substring(0, 500))

        if (response.status >= 200 && response.status < 300) {
            return NextResponse.json({
                success: true,
                message: `Booking Confirmation PDF berhasil dikirim ke WhatsApp ${phone}`,
            })
        } else {
            console.error('❌ GoWA file send failed:', response.data)
            return NextResponse.json({
                success: false,
                error: 'Gagal mengirim file ke WhatsApp',
                gowaStatus: response.status,
                details: response.data,
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
