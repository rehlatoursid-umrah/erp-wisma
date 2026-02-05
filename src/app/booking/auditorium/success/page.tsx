'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function BookingSuccessContent() {
  const searchParams = useSearchParams()

  const bookingId = searchParams.get('bookingId') || 'N/A'
  const eventName = searchParams.get('event') || 'Your Event'
  const date = searchParams.get('date') || ''
  const time = searchParams.get('time') || ''
  const total = searchParams.get('total') || '0'

  return (
    <div className="success-page">
      <div className="success-container">
        {/* Success Icon */}
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>🎉 Booking Berhasil!</h1>
        <p className="success-message">
          Reservasi auditorium Anda telah berhasil disubmit dan sedang menunggu konfirmasi.
        </p>

        {/* Booking Details Card */}
        <div className="booking-card">
          <div className="booking-header">
            <span className="label">Booking ID</span>
            <span className="booking-id">{bookingId}</span>
          </div>

          <div className="booking-details">
            <div className="detail-row">
              <span className="icon">🎉</span>
              <div>
                <span className="label">Nama Acara</span>
                <span className="value">{decodeURIComponent(eventName)}</span>
              </div>
            </div>

            {date && (
              <div className="detail-row">
                <span className="icon">📅</span>
                <div>
                  <span className="label">Tanggal</span>
                  <span className="value">{date}</span>
                </div>
              </div>
            )}

            {time && (
              <div className="detail-row">
                <span className="icon">⏰</span>
                <div>
                  <span className="label">Waktu</span>
                  <span className="value">{decodeURIComponent(time)}</span>
                </div>
              </div>
            )}

            <div className="detail-row total">
              <span className="icon">💰</span>
              <div>
                <span className="label">Total Harga</span>
                <span className="value price">{parseInt(total).toLocaleString()} EGP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="status-section">
          <span className="status-badge pending">⏳ Menunggu Konfirmasi</span>
          <p className="status-note">
            Admin kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi pembayaran.
          </p>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3>📋 Langkah Selanjutnya:</h3>
          <ol>
            <li>Simpan Booking ID Anda: <strong>{bookingId}</strong></li>
            <li>Tunggu konfirmasi dari admin via WhatsApp</li>
            <li>Lakukan pembayaran sesuai instruksi</li>
            <li>Datang ke lokasi sesuai jadwal</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Link href="/booking/auditorium" className="btn btn-secondary">
            ← Buat Reservasi Lain
          </Link>
          <Link href="/" className="btn btn-primary">
            🏠 Kembali ke Home
          </Link>
        </div>

        {/* Contact Info */}
        <div className="contact-info">
          <p>Ada pertanyaan? Hubungi kami:</p>
          <a href="https://wa.me/201507049289" className="whatsapp-link">
            📱 WhatsApp: +20 150 704 9289
          </a>
        </div>
      </div>

      <style jsx>{`
        .success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--color-bg-dark) 0%, #2D2620 100%);
          padding: var(--spacing-2xl) var(--spacing-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-container {
          max-width: 600px;
          width: 100%;
          text-align: center;
        }

        .success-icon {
          width: 100px;
          height: 100px;
          margin: 0 auto var(--spacing-xl);
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scaleIn 0.5s ease, pulse 2s ease-in-out infinite;
        }

        .success-icon svg {
          width: 50px;
          height: 50px;
          color: white;
        }

        h1 {
          font-size: 2rem;
          color: var(--color-bg-card);
          margin: 0 0 var(--spacing-md) 0;
        }

        .success-message {
          color: var(--color-primary-light);
          font-size: 1.125rem;
          margin: 0 0 var(--spacing-xl) 0;
        }

        .booking-card {
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-lg);
          margin-bottom: var(--spacing-xl);
          text-align: left;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--spacing-md);
          border-bottom: 1px dashed rgba(139, 69, 19, 0.2);
          margin-bottom: var(--spacing-lg);
        }

        .booking-header .label {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .booking-id {
          font-family: monospace;
          font-size: 1rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .booking-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
        }

        .detail-row .icon {
          font-size: 1.25rem;
        }

        .detail-row > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-row .label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .detail-row .value {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .detail-row.total {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(139, 69, 19, 0.1);
        }

        .detail-row .value.price {
          font-size: 1.5rem;
          color: var(--color-primary);
        }

        .status-section {
          margin-bottom: var(--spacing-xl);
        }

        .status-badge {
          display: inline-block;
          padding: var(--spacing-sm) var(--spacing-lg);
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .status-badge.pending {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #78350f;
        }

        .status-note {
          margin: var(--spacing-md) 0 0 0;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .next-steps {
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          text-align: left;
        }

        .next-steps h3 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: 1rem;
          color: var(--color-text-primary);
        }

        .next-steps ol {
          margin: 0;
          padding-left: var(--spacing-xl);
        }

        .next-steps li {
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }

        .next-steps li strong {
          color: var(--color-primary);
        }

        .action-buttons {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--spacing-xl);
        }

        .btn {
          padding: var(--spacing-md) var(--spacing-xl);
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .btn-secondary {
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          border: 1px solid rgba(139, 69, 19, 0.2);
        }

        .btn-secondary:hover {
          background: var(--color-bg-secondary);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          border: none;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .contact-info {
          padding: var(--spacing-lg);
          background: rgba(139, 69, 19, 0.05);
          border-radius: var(--radius-lg);
        }

        .contact-info p {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .whatsapp-link {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: #25D366;
          font-weight: 600;
          text-decoration: none;
        }

        .whatsapp-link:hover {
          text-decoration: underline;
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 1.5rem;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
