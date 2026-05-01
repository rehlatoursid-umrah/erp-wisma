'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

interface PortalPinGuardProps {
    expectedPin?: string
    portalName: string
    children: React.ReactNode
    useOtp?: boolean
    otpEndpoint?: string
}

export default function PortalPinGuard({ expectedPin, portalName, children, useOtp, otpEndpoint }: PortalPinGuardProps) {
    const [pin, setPin] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [error, setError] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // OTP states
    const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request')
    const [otpLoading, setOtpLoading] = useState(false)
    const [otpError, setOtpError] = useState('')
    const [countdown, setCountdown] = useState(0)
    const [cooldown, setCooldown] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const cooldownRef = useRef<NodeJS.Timeout | null>(null)

    // Skip guard if no expected PIN and not OTP mode
    useEffect(() => {
        if (!expectedPin && !useOtp) {
            setIsAuthenticated(true)
        }
    }, [expectedPin, portalName, useOtp])

    // Countdown timer for OTP expiry
    useEffect(() => {
        if (countdown > 0) {
            timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000)
        } else if (countdown === 0 && otpStep === 'verify') {
            // OTP expired — go back
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [countdown, otpStep])

    // Cooldown timer for resend
    useEffect(() => {
        if (cooldown > 0) {
            cooldownRef.current = setTimeout(() => setCooldown(c => c - 1), 1000)
        }
        return () => { if (cooldownRef.current) clearTimeout(cooldownRef.current) }
    }, [cooldown])

    if (isAuthenticated) {
        return <>{children}</>
    }

    // ── PIN Mode Logic ──
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (useOtp) {
            handleOtpVerify()
            return
        }
        if (pin === expectedPin) {
            setIsAuthenticated(true)
        } else {
            setError(true)
            setTimeout(() => {
                setPin('')
                setError(false)
                inputRef.current?.focus()
            }, 800)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '')
        setPin(val)
        setError(false)
        setOtpError('')

        if (!useOtp && val.length === 6) {
            if (val === expectedPin) {
                setTimeout(() => setIsAuthenticated(true), 150)
            } else {
                setError(true)
                setTimeout(() => {
                    setPin('')
                    setError(false)
                    inputRef.current?.focus()
                }, 800)
            }
        }
    }

    // ── OTP Mode Logic ──
    const handleRequestOtp = async () => {
        if (!otpEndpoint) return
        setOtpLoading(true)
        setOtpError('')
        try {
            const res = await fetch(otpEndpoint, { method: 'POST' })
            const data = await res.json()
            if (res.ok && data.success) {
                setOtpStep('verify')
                setCountdown(data.expiresIn || 60)
                setCooldown(30)
                setPin('')
                setTimeout(() => inputRef.current?.focus(), 300)
            } else {
                setOtpError(data.error || 'Gagal mengirim OTP.')
            }
        } catch {
            setOtpError('Gagal terhubung ke server.')
        }
        setOtpLoading(false)
    }

    const handleOtpVerify = async () => {
        if (!otpEndpoint || pin.length !== 6) return
        setOtpLoading(true)
        setOtpError('')
        try {
            const res = await fetch(otpEndpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: pin }),
            })
            const data = await res.json()
            if (res.ok && data.verified) {
                setIsAuthenticated(true)
            } else {
                setOtpError(data.error || 'Kode OTP salah.')
                setError(true)
                setTimeout(() => {
                    setPin('')
                    setError(false)
                    inputRef.current?.focus()
                }, 800)
            }
        } catch {
            setOtpError('Gagal terhubung ke server.')
        }
        setOtpLoading(false)
    }

    // ── OTP Request Screen ──
    if (useOtp && otpStep === 'request') {
        return (
            <div className="pin-guard-container">
                <div className="pin-card">
                    <div className="logo-wrapper">
                        <Image src="/media/sticky-header.png" alt="Wisma Nusantara Cairo Logo" width={96} height={96} className="logo-img" priority />
                    </div>
                    <div className="text-center-mb6">
                        <h2><span>Portal</span><br /><span>{portalName}</span></h2>
                        <p>Verifikasi identitas melalui WhatsApp OTP</p>
                    </div>
                    <div className="form-wrapper">
                        <div className="otp-info-box">
                            <span className="otp-shield">🔐</span>
                            <p>Kode OTP 6-digit akan dikirim ke nomor WhatsApp Bendahara yang terdaftar. Kode berlaku selama <strong>1 menit</strong>.</p>
                        </div>
                        <button
                            onClick={handleRequestOtp}
                            disabled={otpLoading}
                            className="submit-btn otp-request-btn"
                        >
                            {otpLoading ? (
                                <><span className="spinner" /> Mengirim...</>
                            ) : (
                                <>📱 Kirim Kode OTP ke WhatsApp</>
                            )}
                        </button>
                        <a href="/dashboard" className="back-btn">Kembali ke Dashboard</a>
                        {otpError && <div className="error-wrapper"><p className="error-text visible">{otpError}</p></div>}
                    </div>
                </div>
                <style jsx>{guardStyles}</style>
            </div>
        )
    }

    // ── OTP Verify Screen / PIN Screen ──
    return (
        <div className="pin-guard-container">
            <div className={`pin-card ${error ? 'animate-shake' : ''}`}>
                <div className="logo-wrapper">
                    <Image src="/media/sticky-header.png" alt="Wisma Nusantara Cairo Logo" width={96} height={96} className="logo-img" priority />
                </div>
                <div className="text-center-mb6">
                    <h2><span>Portal</span><br /><span>{portalName}</span></h2>
                    <p>{useOtp ? 'Masukkan kode OTP dari WhatsApp' : 'Masukkan PIN keamanan Anda'}</p>
                </div>

                {useOtp && countdown > 0 && (
                    <div className="otp-countdown-bar">
                        <div className="otp-countdown-fill" style={{ width: `${(countdown / 60) * 100}%` }} />
                        <span className="otp-countdown-text">⏱️ {countdown} detik</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-wrapper">
                    <div className="input-wrapper">
                        <input
                            ref={inputRef}
                            type="password"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={pin}
                            onChange={handleChange}
                            className={`pin-input ${error ? 'input-error' : ''}`}
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={otpLoading || (useOtp && pin.length !== 6)}>
                        {otpLoading ? <><span className="spinner" /> Memverifikasi...</> : 'Verifikasi'}
                    </button>

                    {useOtp && (
                        <button
                            type="button"
                            onClick={() => { if (cooldown <= 0) handleRequestOtp() }}
                            disabled={cooldown > 0 || otpLoading}
                            className="back-btn"
                        >
                            {cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : '🔄 Kirim Ulang Kode OTP'}
                        </button>
                    )}

                    {!useOtp && (
                        <a href="/dashboard" className="back-btn">Kembali ke Dashboard</a>
                    )}

                    <div className="error-wrapper">
                        <p className={`error-text ${(error || otpError) ? 'visible' : ''}`}>
                            {otpError || 'PIN Salah. Silakan coba lagi.'}
                        </p>
                    </div>
                </form>
            </div>
            <style jsx>{guardStyles}</style>
        </div>
    )
}

const guardStyles = `
    .pin-guard-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #24211e;
        padding: 1rem;
        position: relative;
    }
    .pin-card {
        width: 100%;
        max-width: 380px;
        background-color: #ffffff;
        border-radius: 1.25rem;
        padding: 3rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        z-index: 10;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        transition: transform 0.3s;
    }
    .logo-wrapper { margin-bottom: 0.5rem; }
    .text-center-mb6 { text-align: center; margin-bottom: 2rem; }
    .text-center-mb6 h2 { font-size: 1.875rem; font-weight: 700; color: #8b4513; line-height: 1.2; margin: 0; }
    .text-center-mb6 p { color: #6b7280; font-size: 0.875rem; margin-top: 0.75rem; margin-bottom: 0px; }
    .form-wrapper { width: 100%; }
    .input-wrapper { margin-bottom: 1.5rem; }
    .pin-input {
        width: 100%;
        text-align: center;
        font-size: 2.25rem;
        letter-spacing: 0.5em;
        font-weight: 700;
        border: 2px solid #e5e7eb;
        border-radius: 0.75rem;
        padding-top: 0.75rem;
        padding-bottom: 0.75rem;
        padding-left: 1.125em;
        outline: none;
        transition: all 0.2s;
        color: #1f2937;
        background-color: transparent;
    }
    .pin-input:focus { border-color: #8b4513; box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1); }
    .input-error { border-color: #ef4444; background-color: #fef2f2; color: #dc2626; }
    .pin-input::placeholder { color: #9ca3af; }
    .submit-btn {
        width: 100%;
        background-color: #8b4513;
        color: #ffffff;
        font-weight: 600;
        padding: 0.875rem;
        border-radius: 0.75rem;
        border: none;
        transition: background-color 0.2s, opacity 0.2s;
        letter-spacing: 0.025em;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    .submit-btn:hover { background-color: #653610; }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .otp-request-btn { font-size: 1.05rem; padding: 1rem; }
    .back-btn {
        display: block;
        width: 100%;
        text-align: center;
        background-color: transparent;
        color: #6b7280;
        font-weight: 500;
        padding: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        margin-top: 0.75rem;
        transition: all 0.2s;
        font-size: 0.95rem;
        text-decoration: none;
        cursor: pointer;
    }
    .back-btn:hover { background-color: #f3f4f6; color: #374151; border-color: #d1d5db; }
    .back-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-wrapper { height: 1.5rem; margin-top: 1rem; display: flex; align-items: center; justify-content: center; }
    .error-text { color: #ef4444; font-size: 0.875rem; font-weight: 500; opacity: 0; transition: opacity 0.2s; margin: 0; text-align: center; }
    .error-text.visible { opacity: 1; }
    .otp-info-box {
        background: linear-gradient(135deg, rgba(139,69,19,0.06) 0%, rgba(139,69,19,0.02) 100%);
        border: 1px solid rgba(139,69,19,0.15);
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }
    .otp-shield { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .otp-info-box p { color: #6b7280; font-size: 0.85rem; margin: 0; line-height: 1.5; }
    .otp-info-box strong { color: #8b4513; }
    .otp-countdown-bar {
        width: 100%;
        height: 28px;
        background: #f3f4f6;
        border-radius: 14px;
        overflow: hidden;
        position: relative;
        margin-bottom: 1.5rem;
    }
    .otp-countdown-fill {
        height: 100%;
        background: linear-gradient(90deg, #8b4513, #a0522d);
        border-radius: 14px;
        transition: width 1s linear;
    }
    .otp-countdown-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.78rem;
        font-weight: 700;
        color: #374151;
    }
    .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
    }
    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
`
