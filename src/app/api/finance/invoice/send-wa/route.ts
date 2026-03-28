import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
        }

        const payload = await getPayload({ config: configPromise })
        const invoice = await payload.findByID({
            collection: 'transactions',
            id
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const whatsappEndpoint = process.env.WHATSAPP_API_ENDPOINT
        const whatsappUsername = process.env.WHATSAPP_API_USERNAME
        const whatsappPassword = process.env.WHATSAPP_API_PASSWORD

        if (!whatsappEndpoint || !whatsappUsername || !whatsappPassword) {
            return NextResponse.json({ error: 'WhatsApp API credentials not configured' }, { status: 500 })
        }

        let formattedPhone = invoice.customerWA?.replace(/\D/g, '') || ''
        
        if (!formattedPhone || formattedPhone.length < 5) {
            return NextResponse.json({ error: 'Customer WhatsApp number is invalid/missing' }, { status: 400 })
        }

        if (!formattedPhone.includes('@s.whatsapp.net')) {
            formattedPhone += '@s.whatsapp.net'
        }

        const baseUrl = whatsappEndpoint.replace(/\/$/, '')
        
        let itemsText = ''
        if (invoice.items && Array.isArray(invoice.items)) {
            itemsText = invoice.items.map((item: any) => 
                `- ${item.itemName} (${item.quantity}x): ${invoice.currency} ${item.subtotal?.toLocaleString() || 0}`
            ).join('\n')
        }

        const isPaid = invoice.paymentStatus === 'paid'
        const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('id-ID')
        const invoiceType = invoice.bookingType?.replace('_', ' ').toUpperCase() || 'Layanan Umum'

        const messageText = 
            `*INVOICE WISMA NUSANTARA CAIRO*\n` +
            `----------------------------------------\n` +
            `No. Invoice: ${invoice.invoiceNo}\n` +
            `Tanggal: ${invoiceDate}\n\n` +
            `Yth. Bapak/Ibu *${invoice.customerName}*,\n\n` +
            `Terima kasih telah menggunakan layanan kami. Berikut adalah rincian tagihan Anda untuk ${invoiceType}:\n\n` +
            `${itemsText}\n\n` +
            `*Subtotal:* ${invoice.currency} ${invoice.subtotal?.toLocaleString() || 0}\n` +
            (invoice.discount ? `*Diskon:* -${invoice.currency} ${invoice.discount.toLocaleString()}\n` : '') +
            `*Total Tagihan: ${invoice.currency} ${invoice.totalAmount?.toLocaleString() || 0}*\n` +
            `*Status: ${isPaid ? 'LUNAS ✅' : 'PENDING ⏳'}*\n\n` +
            `----------------------------------------\n` +
            (isPaid 
                ? `Terima kasih atas pembayaran Anda via ${invoice.paymentMethod?.toUpperCase() || 'CASH'}.` 
                : `Mohon segera selesaikan pembayaran. Aplikasi dan Invoice digital ini membuktikan keabsahan transaksi Anda.`
            );

        console.log(`🚀 Sending Invoice WA to: ${baseUrl}/send/message`)

        const response = await axios.post(`${baseUrl}/send/message`, {
            phone: formattedPhone,
            message: messageText,
            is_forwarded: false,
        }, {
            auth: {
                username: whatsappUsername,
                password: whatsappPassword,
            },
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
            },
            timeout: 45000,
            validateStatus: () => true,
        })

        if (response.status >= 200 && response.status < 300) {
            return NextResponse.json({ success: true, message: 'Invoice Whatsapp sent successfully' })
        } else {
            console.error('WhatsApp API Error:', response.data)
            return NextResponse.json({ error: 'Failed to send WhatsApp message', details: response.data }, { status: 502 })
        }

    } catch (error: any) {
        console.error('Send invoice WA error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
