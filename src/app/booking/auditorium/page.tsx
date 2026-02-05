'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuditoriumBookingForm, { AuditoriumBookingData } from '@/components/booking/AuditoriumBookingForm'

export default function AuditoriumBookingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          <a href="/" className="back-link">← Back to Home</a>
          <div className="header-content">
            <h1>🏛️ Auditorium Reservation</h1>
            <p>Wisma Nusantara Cairo</p>
          </div>
        </header>

        <div className="booking-info">
          <h2>Auditorium Facilities</h2>
          <ul>
            <li>✓ Capacity up to 200 people</li>
            <li>✓ Air conditioning available</li>
            <li>✓ Professional sound system</li>
            <li>✓ Projector & screen</li>
            <li>✓ Tables & chairs</li>
            <li>✓ Strategic location in Cairo</li>
          </ul>
        </div>

        <AuditoriumBookingForm onSubmit={handleSubmit} />

        {isSubmitting && (
          <div className="loading-overlay">
            <div className="loading-spinner">⏳</div>
            <p>Processing your reservation...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .booking-page {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--color-bg-dark) 0%, #2D2620 100%);
          padding: var(--spacing-2xl);
          position: relative;
        }

        .booking-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .booking-header {
          margin-bottom: var(--spacing-xl);
        }

        .back-link {
          color: var(--color-text-muted);
          text-decoration: none;
          font-size: 0.9375rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--color-primary-light);
        }

        .header-content {
          text-align: center;
          margin-top: var(--spacing-lg);
        }

        .header-content h1 {
          color: var(--color-bg-card);
          margin-bottom: var(--spacing-xs);
        }

        .header-content p {
          color: var(--color-primary-light);
          font-size: 1.125rem;
        }

        .booking-info {
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          margin-bottom: var(--spacing-xl);
        }

        .booking-info h2 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: 1.125rem;
          color: var(--color-primary);
        }

        .booking-info ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
        }

        .booking-info li {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
        }

        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .loading-spinner {
          font-size: 3rem;
          animation: spin 1s linear infinite;
        }

        .loading-overlay p {
          color: white;
          margin-top: var(--spacing-md);
          font-size: 1.125rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .booking-info ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
