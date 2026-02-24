import { NextResponse } from 'next/server'

const WA_ENDPOINT = process.env.WHATSAPP_API_ENDPOINT || ''
const WA_USERNAME = process.env.WHATSAPP_API_USERNAME || ''
const WA_PASSWORD = process.env.WHATSAPP_API_PASSWORD || ''
const WA_GROUP_ID = process.env.WHATSAPP_GROUP_ID || ''

export async function POST(req: Request) {
    try {
        const data = await req.json()

        const {
            tanggal,
            petugasPiketKantor,
            petugasPiketDapur,
            acaraAuditorium,
            excludeService,
            kamarTerisi,
            catatan,
        } = data

        // Format the date nicely
        const dateObj = new Date(tanggal)
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

        // Build the WhatsApp message
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

Petugas piket kantor: ${petugasPiketKantor || '-'}

Petugas Piket dapur: ${petugasPiketDapur || '-'}

Acara Penyewaan Auditorium: ${acaraAuditorium || 'Tidak ada'}

Exclude Service: ${excludeText}

Kamar Hotel terisi: ${kamarText}

Catatan:
${catatanText}`

        // Send via WhatsApp API (GoWA) with Basic Auth
        const authHeader = 'Basic ' + Buffer.from(`${WA_USERNAME}:${WA_PASSWORD}`).toString('base64')

        // GoWA uses /send/message endpoint with phone field
        // For groups, phone is formatted as groupId@g.us
        const recipientPhone = WA_GROUP_ID.includes('@') ? WA_GROUP_ID : `${WA_GROUP_ID}@g.us`

        const waResponse = await fetch(`${WA_ENDPOINT}/send/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                phone: recipientPhone,
                message: message,
            }),
        })

        if (!waResponse.ok) {
            const errorText = await waResponse.text()
            console.error('WhatsApp API error:', errorText)
            return NextResponse.json(
                { success: false, error: 'Gagal mengirim pesan ke WhatsApp', details: errorText },
                { status: 500 }
            )
        }

        const result = await waResponse.json()

        return NextResponse.json({
            success: true,
            message: 'Daily Reminder berhasil dikirim ke WA Group!',
            preview: message,
            waResult: result,
        })
    } catch (error: any) {
        console.error('Daily Reminder send error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Terjadi kesalahan' },
            { status: 500 }
        )
    }
}
