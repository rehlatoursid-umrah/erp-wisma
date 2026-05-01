import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const RATE_LIMIT_KEY = 'bendahara_otp_last'
const OTP_TTL_SEC = 60

// Secret for signing tokens — uses WA password as seed (always available server-side)
function getSecret() {
  return process.env.WHATSAPP_API_PASSWORD || 'wisma-otp-fallback-secret-key'
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function hashCode(code: string): string {
  return crypto.createHmac('sha256', getSecret()).update(code).digest('hex')
}

function createSignedToken(codeHash: string, expiresAt: number): string {
  const payload = JSON.stringify({ h: codeHash, exp: expiresAt })
  const signature = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  const token = Buffer.from(payload).toString('base64') + '.' + signature
  return token
}

function verifySignedToken(token: string): { h: string; exp: number } | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null
    const payload = Buffer.from(payloadB64, 'base64').toString('utf8')
    const expectedSig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
    if (signature !== expectedSig) return null
    return JSON.parse(payload)
  } catch {
    return null
  }
}

// Simple rate limit via global (best-effort, not critical)
let lastRequestTime = 0
const RATE_LIMIT_MS = 30_000

// ── POST: Generate & Send OTP ──
export async function POST() {
  try {
    const now = Date.now()
    if (now - lastRequestTime < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastRequestTime)) / 1000)
      return NextResponse.json({ error: `Tunggu ${waitSec} detik sebelum request OTP baru.` }, { status: 429 })
    }

    const waEndpoint = process.env.WHATSAPP_API_ENDPOINT
    const waUsername = process.env.WHATSAPP_API_USERNAME
    const waPassword = process.env.WHATSAPP_API_PASSWORD
    const bendaharaPhone = process.env.BENDAHARA_WA_NUMBER

    if (!waEndpoint || !waUsername || !waPassword) {
      return NextResponse.json({ error: 'WhatsApp API not configured' }, { status: 500 })
    }
    if (!bendaharaPhone) {
      return NextResponse.json({ error: 'Nomor WA Bendahara belum dikonfigurasi' }, { status: 500 })
    }

    const code = generateOtp()
    const expiresAt = Math.floor(now / 1000) + OTP_TTL_SEC
    const codeHash = hashCode(code)
    const token = createSignedToken(codeHash, expiresAt)

    lastRequestTime = now

    // Format phone
    let phone = bendaharaPhone.replace(/\D/g, '')
    if (!phone.includes('@s.whatsapp.net')) {
      phone += '@s.whatsapp.net'
    }

    // Send via GoWA
    const message =
      `🔐 *KODE OTP PORTAL BENDAHARA*\n\n` +
      `Kode Anda: *${code}*\n\n` +
      `⏱️ Berlaku selama 1 menit.\n` +
      `Jangan berikan kode ini kepada siapapun.\n\n` +
      `— Wisma Nusantara ERP Security`

    const baseUrl = waEndpoint.replace(/\/$/, '')
    const response = await axios.post(`${baseUrl}/send/message`, {
      phone, message, is_forwarded: false,
    }, {
      auth: { username: waUsername, password: waPassword },
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      timeout: 30000,
      validateStatus: () => true,
    })

    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ OTP sent to Bendahara: ${bendaharaPhone}`)
      return NextResponse.json({ success: true, expiresIn: OTP_TTL_SEC, token })
    } else {
      console.error('❌ WA OTP send failed:', response.status, response.data)
      return NextResponse.json({ error: 'Gagal mengirim OTP via WhatsApp.', details: response.data }, { status: 502 })
    }
  } catch (error: any) {
    console.error('OTP generate error:', error.message)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH: Verify OTP (stateless via signed token) ──
export async function PATCH(request: NextRequest) {
  try {
    const { code, token } = await request.json()

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ verified: false, error: 'Kode OTP harus 6 digit.' }, { status: 400 })
    }
    if (!token) {
      return NextResponse.json({ verified: false, error: 'Token verifikasi tidak ditemukan. Silakan request OTP ulang.' }, { status: 400 })
    }

    const payload = verifySignedToken(token)
    if (!payload) {
      return NextResponse.json({ verified: false, error: 'Token tidak valid. Silakan request OTP baru.' }, { status: 400 })
    }

    // Check expiry
    if (Math.floor(Date.now() / 1000) > payload.exp) {
      return NextResponse.json({ verified: false, error: 'Kode OTP sudah kedaluwarsa.' }, { status: 400 })
    }

    // Verify code hash
    const inputHash = hashCode(code)
    if (inputHash !== payload.h) {
      return NextResponse.json({ verified: false, error: 'Kode OTP salah.' }, { status: 401 })
    }

    console.log('✅ Bendahara OTP verified successfully')
    return NextResponse.json({ verified: true })
  } catch (error: any) {
    console.error('OTP verify error:', error.message)
    return NextResponse.json({ verified: false, error: 'Internal server error' }, { status: 500 })
  }
}
