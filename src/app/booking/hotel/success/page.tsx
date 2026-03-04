'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function HotelSuccessContent() {
    const searchParams = useSearchParams()
    const bookingId = searchParams.get('id')
    const totalUSD = searchParams.get('usd') || '0'
    const totalEGP = searchParams.get('egp') || '0'

    const handleDownloadPDF = async () => {
        if (!bookingId) return

        try {
            const response = await fetch(`/api/booking/download/${bookingId}`)
            if (!response.ok) throw new Error('Download failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Booking-${bookingId}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            alert('Failed to download PDF. Please try again.')
        }
    }

    return (
        <main className="booking-page">
            <div className="booking-container">
                <div className="form-wrapper">
                    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
                        <div className="booking-form success">
                            <div className="success-content">
                                <div className="success-icon">🎉</div>
                                <h2>Booking Kamar Hotel Berhasil!</h2>
                                {bookingId && <p className="booking-id">Booking ID: <strong>{bookingId}</strong></p>}

                                <div className="success-summary">
                                    <p>
                                        <span>📧 WhatsApp Konfirmasi:</span>
                                        <strong>Terkirim</strong>
                                    </p>
                                    <p>
                                        <span>🏨 Status Kamar:</span>
                                        <strong style={{ color: '#e5b072' }}>Menunggu Pembayaran</strong>
                                    </p>
                                    <p style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <span>💰 Total Tagihan:</span>
                                        <strong style={{ fontSize: '1.25rem' }}>${totalUSD} USD <span style={{ fontSize: '1rem', color: '#a1a1aa', fontWeight: 'normal' }}>+ {totalEGP} EGP</span></strong>
                                    </p>
                                </div>

                                <div className="success-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleDownloadPDF}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Download PDF Invoice
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => window.location.href = '/booking/hotel'}
                                    >
                                        Buat Booking Baru
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => window.location.href = '/dashboard'}
                                    >
                                        Kembali ke Kalender
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .booking-page {
                    min-height: 100vh;
                    background: #0f0f11;
                    background-image: 
                        radial-gradient(circle at 15% 50%, rgba(139, 69, 19, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 85% 30%, rgba(200, 150, 80, 0.05) 0%, transparent 50%);
                    padding: 4rem 1.5rem;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    color: #f3f4f6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .booking-container {
                    width: 100%;
                    max-width: 800px;
                }

                .booking-form.success {
                    text-align: center;
                padding: 4rem 2rem;
                background: rgba(20, 20, 23, 0.6);
                border: 1px solid rgba(34, 197, 94, 0.3);
                box-shadow: 0 0 40px rgba(34, 197, 94, 0.1);
                border-radius: 20px;
                }

                .success-icon {
                    font-size: 4.5rem;
                margin-bottom: 24px;
                animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                filter: drop-shadow(0 0 20px rgba(34,197,94,0.4));
                }

                .success-content h2 {
                    margin: 0 0 16px;
                color: #4ade80;
                font-size: 2rem;
                font-weight: 700;
                letter-spacing: -0.5px;
                }

                .booking-id {
                    font-size: 1.1rem;
                color: #a1a1aa;
                margin-bottom: 32px;
                background: rgba(0,0,0,0.3);
                padding: 8px 16px;
                border-radius: 8px;
                display: inline-block;
                border: 1px dashed rgba(255,255,255,0.1);
                }

                .booking-id strong {color: #f3f4f6; font-family: monospace; font-size: 1.25rem; }

                .success-summary {
                    background: rgba(34, 197, 94, 0.05);
                border: 1px solid rgba(34, 197, 94, 0.2);
                padding: 24px;
                border-radius: 16px;
                margin-bottom: 32px;
                text-align: left;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
                }

                .success-summary p {
                    margin: 12px 0;
                color: #d4d4d8;
                display: flex;
                justify-content: space-between;
                font-size: 1.05rem;
                }

                .success-actions {
                    display: flex;
                gap: 16px;
                justify-content: center;
                margin-top: 40px;
                }

                @media (max-width: 640px) {
                    .booking-page {
                        padding: 2rem 1rem;
                        align-items: flex-start;
                    }

                    .booking-form.success {
                    padding: 2.5rem 1.25rem;
                    }
                .success-icon {font-size: 3.5rem; margin-bottom: 20px; }
                .success-content h2 {font-size: 1.5rem; }
                .booking-id {font-size: 0.95rem; padding: 8px 12px; }
                .booking-id strong {font-size: 1.1rem; }

                .success-summary {
                    padding: 16px;
                margin-bottom: 24px;
                    }
                .success-summary p {
                    flex-direction: column;
                gap: 4px;
                font-size: 0.95rem;
                text-align: left;
                    }

                .success-actions {
                    flex-direction: column;
                margin-top: 24px;
                gap: 12px;
                    }
                .success-actions .btn {width: 100%; justify-content: center; }
                }

                @keyframes scaleIn {
                    from {transform: scale(0); opacity: 0; }
                to {transform: scale(1); opacity: 1; }
                }
            ` }} />
        </main>
    )
}

export default function HotelSuccessPage() {
    return (
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Loading...</div>}>
            <HotelSuccessContent />
        </Suspense>
    )
}
