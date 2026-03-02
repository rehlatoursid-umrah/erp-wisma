'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuditoriumBookingForm, { AuditoriumBookingData } from '@/components/booking/AuditoriumBookingForm'

export default function AuditoriumBookingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    // Simulate initial page load for premium feel
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (data: AuditoriumBookingData) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/booking/auditorium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create reservation')
      }

      // Redirect to success page with booking details
      const params = new URLSearchParams({
        bookingId: result.bookingId,
        event: data.eventName,
        date: data.eventDate,
        time: `${data.startTime} - ${data.endTime}`,
        total: result.totalPrice.toString(),
      })

      router.push(`/booking/auditorium/success?${params.toString()}`)
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to create reservation'}`)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <header className="booking-header">
          <div className="header-content">
            <div className="badge">Premium Space</div>
            <h1>🏛️ Auditorium Reservation</h1>
            <p>Wisma Nusantara Cairo</p>
          </div>
        </header>

        <div className="booking-info-bento">
          <div className="bento-header">
            <h2>Auditorium Facilities</h2>
            <p>Everything you need for a successful event</p>
          </div>
          <div className="bento-grid">
            <div className="bento-card">
              <div className="bento-icon">👥</div>
              <div className="bento-text">
                <strong>Capacity up to 100 people</strong>
                <span>Spacious seating arrangement</span>
              </div>
            </div>
            <div className="bento-card">
              <div className="bento-icon">🎤</div>
              <div className="bento-text">
                <strong>Professional sound system</strong>
                <span>Includes 2 wireless microphones</span>
              </div>
            </div>
            <div className="bento-card optional">
              <div className="bento-icon">❄️</div>
              <div className="bento-text">
                <strong>Air conditioning</strong>
                <span>Available (exclude from base price)</span>
              </div>
            </div>
            <div className="bento-card optional">
              <div className="bento-icon">📽️</div>
              <div className="bento-text">
                <strong>Projector & screen</strong>
                <span>Available (exclude from base price)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-wrapper">
          <AuditoriumBookingForm onSubmit={handleSubmit} />
        </div>

        {isSubmitting && (
          <div className="loading-overlay">
            <div className="loading-spinner">✨</div>
            <p>Securing your reservation...</p>
          </div>
        )}

        {isPageLoading && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#0f0f11', // Solid dark background to hide unstyled content
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
          }}>
            <style>{`
              @keyframes spin-inline {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ fontSize: '3rem', animation: 'spin-inline 1s linear infinite' }}>⏳</div>
            <p style={{ color: 'white', marginTop: '1rem', fontSize: '1.125rem', fontWeight: 500, letterSpacing: '0.5px' }}>
              Memuat formulir...
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .booking-page {
          min-height: 100vh;
          background: #0f0f11;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(139, 69, 19, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(200, 150, 80, 0.05) 0%, transparent 50%);
          padding: 4rem 1.5rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #f3f4f6;
        }

        .booking-container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .booking-header {
          text-align: center;
          margin-bottom: 1rem;
          animation: fadeDown 0.6s ease-out;
        }

        .badge {
          display: inline-block;
          padding: 0.35rem 1rem;
          background: rgba(139, 69, 19, 0.2);
          border: 1px solid rgba(139, 69, 19, 0.3);
          color: #e5b072;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
        }

        .header-content h1 {
          font-size: 2.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }

        .header-content p {
          color: #a1a1aa;
          font-size: 1.15rem;
          font-weight: 400;
        }

        .booking-info-bento {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: fadeUp 0.6s ease-out 0.1s both;
        }

        .bento-header {
          margin-bottom: 1.5rem;
        }

        .bento-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .bento-header p {
          color: #a1a1aa;
          font-size: 0.95rem;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .bento-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: all 0.3s ease;
        }

        .bento-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
          border-color: rgba(139, 69, 19, 0.3);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .bento-card.optional .bento-text strong {
          color: #e5b072;
        }

        .bento-icon {
          font-size: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bento-card:hover .bento-icon {
          background: rgba(139, 69, 19, 0.2);
        }

        .bento-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .bento-text strong {
          color: #f3f4f6;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .bento-text span {
          color: #71717a;
          font-size: 0.85rem;
        }

        .form-wrapper {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 2.5rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          animation: fadeUp 0.6s ease-out 0.2s both;
        }

        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .loading-spinner {
          font-size: 3rem;
          animation: pulse 1.5s ease-in-out infinite;
          margin-bottom: 1rem;
        }

        .loading-overlay p {
          color: #ffffff;
          font-size: 1.125rem;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        @media (max-width: 768px) {
          .booking-page {
            padding: 2rem 1rem;
          }
          
          .header-content h1 {
            font-size: 2rem;
          }

          .bento-grid {
            grid-template-columns: 1fr;
          }

          .bento-card {
            padding: 1rem;
          }
        }

        /* Loading Overlay (Same as Dashboard Login) */
        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .loading-spinner {
          font-size: 3rem;
          animation: spin 1s linear infinite;
        }

        .loading-overlay p {
          color: white;
          margin-top: 1rem;
          font-size: 1.125rem;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
