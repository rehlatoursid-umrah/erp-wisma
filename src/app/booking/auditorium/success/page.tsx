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
  const name = searchParams.get('name') || ''

  const handleDownloadPDF = () => {
    // Construct the URL to the PDF generation endpoint
    const pdfUrl = `/api/booking/auditorium/pdf?bookingId=${bookingId}&name=${encodeURIComponent(name)}&event=${encodeURIComponent(eventName)}&date=${date}&time=${encodeURIComponent(time)}&total=${total}&status=pending`
    // Open in a new tab which will trigger the print/download dialog
    window.open(pdfUrl, '_blank')
  }

  return (
    <div className="success-page">
      <div className="success-container">

        {/* Success Icon & Header */}
        <div className="success-header">
          <div className="success-icon-wrapper">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="pulse-ring"></div>
          </div>
          <h1>Booking Successful!</h1>
          <p className="success-message">
            Your auditorium reservation has been submitted and is pending confirmation.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="bento-grid">

          {/* Main Booking Details (Receipt Style) */}
          <div className="bento-card receipt-card">
            <div className="receipt-header">
              <span className="label">BOOKING ID</span>
              <span className="booking-id">{bookingId}</span>
            </div>

            <div className="receipt-body">
              <div className="detail-row">
                <div className="icon">🎉</div>
                <div className="content">
                  <span className="label">Event Name</span>
                  <span className="value">{decodeURIComponent(eventName)}</span>
                </div>
              </div>

              {date && (
                <div className="detail-row">
                  <div className="icon">📅</div>
                  <div className="content">
                    <span className="label">Date</span>
                    <span className="value">{date}</span>
                  </div>
                </div>
              )}

              {time && (
                <div className="detail-row">
                  <div className="icon">⏰</div>
                  <div className="content">
                    <span className="label">Time</span>
                    <span className="value">{decodeURIComponent(time)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="receipt-footer">
              <div className="receipt-divider"></div>
              <div className="total-row">
                <span className="label">Grand Total</span>
                <div className="price-display">
                  <span className="currency">EGP</span>
                  <span className="amount">{parseInt(total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Status & Steps */}
          <div className="side-cards">
            {/* Status Card */}
            <div className="bento-card status-card">
              <div className="status-badge pending">
                <span className="spinner">⏳</span> Pending Confirmation
              </div>
              <p>Our admin will contact you via WhatsApp shortly to confirm payment and details.</p>
            </div>

            {/* Next Steps Card */}
            <div className="bento-card steps-card">
              <h3>📋 Next Steps</h3>
              <ul className="step-list">
                <li>Save your Booking ID: <strong>{bookingId}</strong></li>
                <li>Wait for WhatsApp confirmation</li>
                <li>Complete payment via instructions</li>
                <li>Enjoy your premium event space</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Link href="/booking/auditorium" className="premium-btn ghost">
            ← New Reservation
          </Link>
          <a href="https://wa.me/201507049289" target="_blank" rel="noreferrer" className="premium-btn whatsapp">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Contact Admin
          </a>
          <button onClick={handleDownloadPDF} type="button" className="premium-btn primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Confirmation
          </button>
        </div>

      </div>

      <style jsx>{`
        .success-page {
          min-height: 100vh;
          background: #0f0f11;
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 15% 50%, rgba(139, 69, 19, 0.05) 0%, transparent 50%);
          padding: 4rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #f3f4f6;
        }

        .success-container {
          max-width: 850px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        /* Header animations and styles */
        .success-header {
          text-align: center;
          animation: fadeDown 0.6s ease-out;
        }

        .success-icon-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-icon {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          box-shadow: 0 10px 25px rgba(34, 197, 94, 0.4);
          animation: scaleBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .success-icon svg {
          width: 44px;
          height: 44px;
          color: white;
        }

        .pulse-ring {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 2px solid rgba(34, 197, 94, 0.5);
          animation: pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
        }

        .success-message {
          color: #a1a1aa;
          font-size: 1.15rem;
          margin: 0;
        }

        /* Bento Grid */
        .bento-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.5rem;
          animation: fadeUp 0.6s ease-out 0.2s both;
        }

        .bento-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          backdrop-filter: blur(12px);
          padding: 2rem;
        }

        /* Receipt Card */
        .receipt-card {
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, rgba(20, 20, 23, 0.6) 0%, rgba(15, 15, 17, 0.8) 100%);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          position: relative;
          overflow: hidden;
        }
        
        .receipt-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #8B4513, #e5b072, #8B4513);
        }

        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1.5rem;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
          margin-bottom: 1.5rem;
        }

        .receipt-header .label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #71717a;
          letter-spacing: 1px;
        }

        .booking-id {
          font-family: 'SF Mono', ui-monospace, monospace;
          font-size: 1.125rem;
          font-weight: 700;
          color: #e5b072;
          background: rgba(139, 69, 19, 0.15);
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(139, 69, 19, 0.3);
        }

        .receipt-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }

        .detail-row {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .detail-row .icon {
          font-size: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .detail-row .content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-row .label {
          font-size: 0.85rem;
          color: #a1a1aa;
        }

        .detail-row .value {
          font-size: 1.125rem;
          font-weight: 500;
          color: #ffffff;
        }

        .receipt-divider {
          height: 1px;
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
          margin: 1.5rem 0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .total-row .label {
          font-size: 1.125rem;
          font-weight: 500;
          color: #ffffff;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
        }

        .price-display .currency {
          color: #e5b072;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .price-display .amount {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -1px;
          color: #ffffff;
          line-height: 1;
        }

        /* Side Cards */
        .side-cards {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .status-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          justify-content: center;
          border-color: rgba(234, 179, 8, 0.2);
          background: rgba(234, 179, 8, 0.02);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(234, 179, 8, 0.15);
          color: #fca5a5;
          color: #fde047;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.95rem;
          width: fit-content;
          border: 1px solid rgba(234, 179, 8, 0.3);
        }

        .spinner {
          display: inline-block;
          animation: tilt 2s infinite ease-in-out;
        }

        .status-card p {
          color: #d4d4d8;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        .steps-card {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .steps-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
        }

        .step-list {
          margin: 0;
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          color: #a1a1aa;
        }

        .step-list li {
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .step-list li strong {
          color: #e5b072;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 1.25rem;
          justify-content: center;
          animation: fadeUp 0.6s ease-out 0.4s both;
          flex-wrap: wrap;
        }

        :global(.premium-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.125rem 2rem;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
        }

        :global(.premium-btn.ghost) {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        :global(.premium-btn.ghost:hover) {
          background: rgba(255, 255, 255, 0.1);
        }

        :global(.premium-btn.whatsapp) {
          background: #25D366;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
        }

        :global(.premium-btn.whatsapp:hover) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
        }

        :global(.premium-btn.primary) {
          background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(139, 69, 19, 0.4);
        }

        :global(.premium-btn.primary:hover) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 69, 19, 0.6);
        }

        /* Animations */
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleBounce {
          0% { transform: scale(0); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        @keyframes pulseRing {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes tilt {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }

        @media (max-width: 900px) {
          .bento-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .success-page {
            padding: 2rem 1rem;
          }
          
          h1 {
            font-size: 2rem;
          }

          .price-display .amount {
            font-size: 2rem;
          }

          .action-buttons {
            flex-direction: column;
          }
          
          .premium-btn {
            width: 100%;
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
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f11',
        gap: '12px',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⏳</div>
        <p>Loading your receipt...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}

