import { NextResponse } from 'next/server'
import axios from 'axios'
import { jsPDF } from 'jspdf'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function generateInvoicePDF(data: {
    bookingId: string
    guestName: string
    room: string
    nights: string
    checkIn: string
    checkOut: string
    total: string
    currency: string
    status: string
    extraBed?: string
    pickup?: string
    meals?: string
}): string {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const statusText = data.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'
    const invoiceNo = `INV-${data.bookingId.replace('HTL-', '')}`
    const totalNum = parseInt(data.total) || 0
    const extraBed = parseInt(data.extraBed || '0')
    const pickup = parseInt(data.pickup || '0')
    const meals = parseInt(data.meals || '0')
    const roomCharge = totalNum - extraBed - pickup

    // ── Header Bar ──
    doc.setFillColor(17, 24, 39) // #111827
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageW / 2, 14, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Wisma Nusantara Cairo — Indonesian Hostel in Cairo', pageW / 2, 22, { align: 'center' })
    doc.setFontSize(8)
    doc.text(invoiceNo, pageW / 2, 28, { align: 'center' })

    // ── Status Badge ──
    const badgeY = 40
    if (data.status === 'paid') {
        doc.setFillColor(240, 253, 244)
        doc.setDrawColor(22, 163, 74)
        doc.setTextColor(22, 163, 74)
    } else {
        doc.setFillColor(254, 242, 242)
        doc.setDrawColor(220, 38, 38)
        doc.setTextColor(220, 38, 38)
    }
    const badgeText = statusText
    const badgeW = doc.getTextWidth(badgeText) + 16
    doc.roundedRect((pageW - badgeW) / 2, badgeY - 5, badgeW, 10, 3, 3, 'FD')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(badgeText, pageW / 2, badgeY + 1.5, { align: 'center' })

    // ── Guest Info ──
    let y = 58
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('TAGIHAN KEPADA', 20, y)
    doc.text('INFO INVOICE', pageW - 20, y, { align: 'right' })

    y += 7
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(data.guestName, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const invoiceDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.text(`Tanggal: ${invoiceDate}`, pageW - 20, y, { align: 'right' })

    y += 6
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(9)
    doc.text(`Booking ID: ${data.bookingId}`, 20, y)

    // ── Separator ──
    y += 8
    doc.setDrawColor(229, 231, 235)
    doc.line(20, y, pageW - 20, y)

    // ── Items Table Header ──
    y += 8
    doc.setFillColor(243, 244, 246)
    doc.rect(20, y - 4, pageW - 40, 10, 'F')
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Deskripsi', 25, y + 2)
    doc.text('Qty', 120, y + 2)
    doc.text('Harga', pageW - 25, y + 2, { align: 'right' })

    // ── Room Item ──
    y += 14
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(9)
    doc.text(`Sewa Kamar ${data.room}`, 25, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.text(`${data.nights} Malam (${data.checkIn} - ${data.checkOut})`, 25, y + 5)
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(9)
    doc.text('1', 120, y)
    doc.text(`${roomCharge.toLocaleString()} ${data.currency}`, pageW - 25, y, { align: 'right' })

    // ── Extra Bed ──
    if (extraBed > 0) {
        y += 14
        doc.setFont('helvetica', 'bold')
        doc.text('Extra Bed', 25, y)
        doc.setFont('helvetica', 'normal')
        doc.text('1', 120, y)
        doc.text(`${extraBed.toLocaleString()} ${data.currency}`, pageW - 25, y, { align: 'right' })
    }

    // ── Airport Pickup ──
    if (pickup > 0) {
        y += 14
        doc.setFont('helvetica', 'bold')
        doc.text('Airport Pickup', 25, y)
        doc.setFont('helvetica', 'normal')
        doc.text('1', 120, y)
        doc.text(`${pickup.toLocaleString()} ${data.currency}`, pageW - 25, y, { align: 'right' })
    }

    // ── Separator ──
    y += 10
    doc.setDrawColor(229, 231, 235)
    doc.line(20, y, pageW - 20, y)

    // ── Meals Note ──
    if (meals > 0) {
        y += 8
        doc.setTextColor(234, 88, 12)
        doc.setFontSize(9)
        doc.text(`Paket Makan (EGP): + ${meals.toLocaleString()} EGP`, pageW - 25, y, { align: 'right' })
    }

    // ── Grand Total ──
    y += 10
    const totalBoxW = 120
    const totalBoxX = pageW - 20 - totalBoxW
    doc.setFillColor(17, 24, 39)
    doc.roundedRect(totalBoxX, y - 5, totalBoxW, 14, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Total', totalBoxX + 10, y + 4)
    doc.text(`${totalNum.toLocaleString()} ${data.currency}`, totalBoxX + totalBoxW - 10, y + 4, { align: 'right' })

    // ── Payment Info ──
    y += 22
    doc.setDrawColor(17, 24, 39)
    doc.setLineWidth(0.8)
    doc.line(20, y - 2, 20, y + 14)
    doc.setFillColor(249, 250, 251)
    doc.rect(22, y - 4, pageW - 44, 20, 'F')
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Informasi Pembayaran', 28, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(75, 85, 99)
    doc.text('Pembayaran HANYA dapat dilakukan secara CASH (TUNAI) kepada resepsionis.', 28, y + 10)

    // ── Footer ──
    y += 30
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(8)
    doc.text('Terima kasih telah menginap di Wisma Nusantara Cairo', pageW / 2, y, { align: 'center' })
    y += 5
    doc.setFontSize(7)
    doc.text('WhatsApp: +62 851-8991-6769 | Phone: 01554646871 | Email: admin@wismanusantaracairo.com', pageW / 2, y, { align: 'center' })

    // Return as base64
    return doc.output('datauristring').split(',')[1]
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { phone, bookingId, guestName, room, nights, checkIn, checkOut, total, currency, status, extraBed, pickup, meals } = data

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

        // Format phone number
        let formattedPhone = phone.replace(/[^0-9]/g, '')
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1)
        }
        if (!formattedPhone.includes('@')) {
            formattedPhone += '@s.whatsapp.net'
        }

        const authConfig = {
            auth: { username: whatsappUsername, password: whatsappPassword },
            headers: { 'Content-Type': 'application/json' },
            timeout: 45000,
            validateStatus: () => true as const,
        }

        const baseUrl = whatsappEndpoint.replace(/\/$/, '')

        // ── Step 1: Send Broadcast Text Message ──
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

💳 Pembayaran HANYA CASH (TUNAI) kepada resepsionis.

📞 Admin: +62 851-8991-6769

_Terima kasih telah menginap di Wisma Nusantara Cairo_ 🏠`

        console.log(`🚀 Step 1: Sending broadcast text to ${formattedPhone}`)

        const textResponse = await axios.post(`${baseUrl}/send/message`, {
            phone: formattedPhone,
            message: invoiceMessage,
            is_forwarded: false,
        }, authConfig)

        console.log(`📥 Text response: ${textResponse.status}`)

        // ── Step 2: Generate PDF Invoice ──
        console.log(`📄 Step 2: Generating PDF invoice...`)

        const pdfBase64 = generateInvoicePDF({
            bookingId, guestName, room, nights, checkIn, checkOut, total, currency, status,
            extraBed, pickup, meals
        })

        const invoiceFilename = `Invoice_${bookingId}.pdf`

        // ── Step 3: Send PDF File via GoWA API ──
        console.log(`📤 Step 3: Sending PDF file to ${formattedPhone}`)

        const fileResponse = await axios.post(`${baseUrl}/send/file`, {
            phone: formattedPhone,
            file: pdfBase64,
            filename: invoiceFilename,
            caption: `📄 Invoice ${bookingId} — ${guestName}`,
            is_forwarded: false,
        }, authConfig)

        console.log(`📥 File response: ${fileResponse.status}`)

        const textOk = textResponse.status >= 200 && textResponse.status < 300
        const fileOk = fileResponse.status >= 200 && fileResponse.status < 300

        if (textOk && fileOk) {
            return NextResponse.json({
                success: true,
                message: `Invoice + PDF berhasil dikirim ke WhatsApp ${phone}`,
            })
        } else if (textOk && !fileOk) {
            return NextResponse.json({
                success: true,
                message: `Teks invoice terkirim, tapi PDF gagal dikirim.`,
                warning: 'PDF send failed',
                fileError: fileResponse.data,
            })
        } else {
            return NextResponse.json({
                success: false,
                error: 'Gagal mengirim ke WhatsApp',
                textStatus: textResponse.status,
                fileStatus: fileResponse.status,
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
