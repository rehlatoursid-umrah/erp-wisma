import { NextRequest, NextResponse } from 'next/server'
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

        const response = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${whatsappUsername}:${whatsappPassword}`).toString('base64'),
            },
            body: JSON.stringify({
                to: formattedPhone,
                type: 'text',
                text: {
                    body: messageText
                }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('WhatsApp API Error:', errorText)
            return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Invoice Whatsapp sent successfully' })

    } catch (error: any) {
        console.error('Send invoice WA error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
