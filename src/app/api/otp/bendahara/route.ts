import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export const dynamic = 'force-dynamic'

// ── In-Memory OTP Store ──
interface OtpEntry {
  code: string
  expiresAt: number
  used: boolean
}

const otpStore = new Map<string, OtpEntry>()
let lastRequestTime = 0
const RATE_LIMIT_MS = 30_000 // 30 seconds between requests
const OTP_TTL_MS = 60_000   // 60 seconds validity

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function cleanExpired() {
  const now = Date.now()
  for (const [key, entry] of otpStore) {
    if (now > entry.expiresAt) otpStore.delete(key)
  }
}

// ── POST: Generate & Send OTP ──
export async function POST() {
  try {
    // Rate limit
    const now = Date.now()
    if (now - lastRequestTime < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastRequestTime)) / 1000)
      return NextResponse.json(
        { error: `Tunggu ${waitSec} detik sebelum request OTP baru.` },
        { status: 429 }
      )
    }

    // Check WA config
    const waEndpoint = process.env.WHATSAPP_API_ENDPOINT
    const waUsername = process.env.WHATSAPP_API_USERNAME
    const waPassword = process.env.WHATSAPP_API_PASSWORD
    const bendaharaPhone = process.env.BENDAHARA_WA_NUMBER

    if (!waEndpoint || !waUsername || !waPassword) {
      return NextResponse.json({ error: 'WhatsApp API not configured' }, { status: 500 })
    }
    if (!bendaharaPhone) {
      return NextResponse.json({ error: 'Nomor WA Bendahara belum dikonfigurasi (BENDAHARA_WA_NUMBER)' }, { status: 500 })
    }

    // Clean expired entries & generate new OTP
    cleanExpired()
    const code = generateOtp()
    const expiresAt = now + OTP_TTL_MS

    // Store OTP
    otpStore.set('bendahara', { code, expiresAt, used: false })
    lastRequestTime = now

    // Format phone
    let phone = bendaharaPhone.replace(/\D/g, '')
    if (!phone.includes('@s.whatsapp.net')) {
      phone += '@s.whatsapp.net'
    }

    // Send via GoWA API
    const message =
      `🔐 *KODE OTP PORTAL BENDAHARA*\n\n` +
      `Kode Anda: *${code}*\n\n` +
      `⏱️ Berlaku selama 1 menit.\n` +
      `Jangan berikan kode ini kepada siapapun.\n\n` +
      `— Wisma Nusantara ERP Security`

    const baseUrl = waEndpoint.replace(/\/$/, '')
    const response = await axios.post(`${baseUrl}/send/message`, {
      phone,
      message,
      is_forwarded: false,
    }, {
      auth: { username: waUsername, password: waPassword },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      timeout: 30000,
      validateStatus: () => true,
    })

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ OTP sent to Bendahara: ${bendaharaPhone}`)
      return NextResponse.json({ success: true, expiresIn: 60 })
    } else {
      console.error('❌ WhatsApp OTP send failed:', response.status, response.data)
      // Still allow verify in case WA had delay but delivered
      return NextResponse.json(
        { error: 'Gagal mengirim OTP via WhatsApp. Coba lagi.', details: response.data },
        { status: 502 }
      )
    }
  } catch (error: any) {
    console.error('OTP generate error:', error.message)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH: Verify OTP ──
export async function PATCH(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ verified: false, error: 'Kode OTP harus 6 digit.' }, { status: 400 })
    }

    const entry = otpStore.get('bendahara')

    if (!entry) {
      return NextResponse.json({ verified: false, error: 'Belum ada OTP. Silakan request terlebih dahulu.' }, { status: 400 })
    }

    if (entry.used) {
      return NextResponse.json({ verified: false, error: 'Kode OTP sudah digunakan.' }, { status: 400 })
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete('bendahara')
      return NextResponse.json({ verified: false, error: 'Kode OTP sudah kedaluwarsa.' }, { status: 400 })
    }

    if (entry.code !== code) {
      return NextResponse.json({ verified: false, error: 'Kode OTP salah.' }, { status: 401 })
    }

    // Valid! Mark as used
    entry.used = true
    otpStore.delete('bendahara')
    console.log('✅ Bendahara OTP verified successfully')

    return NextResponse.json({ verified: true })
  } catch (error: any) {
    console.error('OTP verify error:', error.message)
    return NextResponse.json({ verified: false, error: 'Internal server error' }, { status: 500 })
  }
}
