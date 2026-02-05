'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface AuditoriumBooking {
  id: string
  bookingId: string
  date: string
  bookerName: string
  country: string
  eventName: string
  startTime: string
  endTime: string
  phone: string
  whatsapp: string
  hallPackage: string
  duration: number
  // Pricing & Services
  afterHoursCount: number
  hallPrice: number
  afterHoursPrice: number
  servicesPrice: number
  totalPrice: number
  status: string
  services: {
    acOption?: string
    chairOption?: string
    projectorScreen?: string
    tableOption?: string
    plateOption?: string
    glassOption?: string
  }
}

interface AuditoriumCalendarProps {
  onBookingClick?: (booking: AuditoriumBooking) => void
}

export default function AuditoriumCalendar({
  onBookingClick,
}: AuditoriumCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<AuditoriumBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<AuditoriumBooking | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Track component mount status
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true)

      // Use window.location.origin to construct absolute URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const response = await fetch(`${baseUrl}/api/booking/auditorium?status=all`)

      if (!response.ok) {
        console.error('API returned error:', response.status)
        return
      }

      const data = await response.json()

      if (data.success && data.bookings) {
        // Transform API data to calendar format
        const transformedBookings: AuditoriumBooking[] = data.bookings.map((b: any) => ({
          id: b.id,
          bookingId: b.bookingId,
          date: b.date || '', // Robust fallback
          bookerName: b.bookerName || 'No Name',
          country: b.country || '',
          eventName: b.eventName || 'Unnamed Event',
          startTime: b.startTime || '00:00',
          endTime: b.endTime || '00:00',
          phone: b.phone || '',
          whatsapp: b.whatsapp || '',
          hallPackage: b.hallPackage || '',
          duration: b.duration || 0,
          afterHoursCount: b.afterHoursCount || 0,
          hallPrice: b.hallPrice || 0,
          afterHoursPrice: b.afterHoursPrice || 0,
          servicesPrice: b.servicesPrice || 0,
          totalPrice: b.totalPrice || 0,
          status: b.status || 'pending',
          services: b.services || {},
        }))
        setBookings(transformedBookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      // Silently fail - calendar will show empty
    } finally {
      setIsLoading(false)
    }
  }, [])


  useEffect(() => {
    fetchBookings()
    // Refresh every 30 seconds
    const interval = setInterval(fetchBookings, 30000)
    return () => clearInterval(interval)
  }, [fetchBookings])

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; bookings: AuditoriumBooking[] }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      // Format date as YYYY-MM-DD using LOCAL timezone (not UTC)
      // toISOString() converts to UTC which causes date shift issues
      const dateYear = date.getFullYear()
      const dateMonth = String(date.getMonth() + 1).padStart(2, '0')
      const dateDay = String(date.getDate()).padStart(2, '0')
      const dateStr = `${dateYear}-${dateMonth}-${dateDay}`

      // Find all bookings for this date
      // API returns date as ISO string like "2026-02-10T00:00:00.000Z"
      // We need to compare using the date part only
      const dateBookings = bookings.filter(b => {
        const bookingDate = b.date.split('T')[0] // Extract YYYY-MM-DD from ISO string
        return bookingDate === dateStr
      })

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        bookings: dateBookings,
      })
    }

    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  const goToToday = () => setCurrentDate(new Date())

  const handleBookingClick = (booking: AuditoriumBooking) => {
    console.log('Booking clicked:', booking)
    // Use requestAnimationFrame to ensure state update happens after render
    requestAnimationFrame(() => {
      if (isMounted) {
        setSelectedBooking(booking)
        onBookingClick?.(booking)
      }
    })
  }

  const calendarDays = getCalendarDays()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pending', color: '#f59e0b' }
      case 'confirmed': return { label: 'Confirmed', color: '#22c55e' }
      case 'cancelled': return { label: 'Cancelled', color: '#ef4444' }
      case 'completed': return { label: 'Completed', color: '#6366f1' }
      default: return { label: status, color: '#6b7280' }
    }
  }

  return (
    <div className="auditorium-calendar">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={() => navigateMonth(-1)}>←</button>
          <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button className="nav-btn" onClick={() => navigateMonth(1)}>→</button>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchBookings} disabled={isLoading}>
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
          <button className="today-btn" onClick={goToToday}>Hari Ini</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {daysOfWeek.map(day => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}

        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.bookings.length > 0 ? 'booked' : 'available'}`}
          >
            <span className="day-number">{day.date.getDate()}</span>
            {day.bookings.length > 0 ? (
              <div className="bookings-list">
                {day.bookings.map(booking => (
                  <div
                    key={booking.id}
                    className={`booking-card status-${booking.status}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      console.log('Booking card clicked (FORCE):', booking.bookingId)
                      handleBookingClick(booking)
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto'
                    }}
                  >
                    <div className="booking-name">👤 {booking.bookerName}</div>
                    <div className="booking-country">🌍 {booking.country}</div>
                    <div className="booking-event">🎉 {booking.eventName}</div>
                    <div className="booking-time">⏰ {booking.startTime} - {booking.endTime}</div>
                  </div>
                ))}
              </div>
            ) : day.isCurrentMonth && (
              <div className="available-label">Tersedia</div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot booked" />
          <span>Terboking</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot available" />
          <span>Tersedia</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot pending" />
          <span>Pending</span>
        </div>
      </div>

      {/* Booking Detail Modal - Portal for guaranteed z-index */}
      {/* Booking Detail Modal - Direct Fixed Overlay (No Portal) */}
      {selectedBooking && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedBooking(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2147483647, // Max Safe Integer
            cursor: 'default',
            visibility: 'visible',
            opacity: 1,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div
            className="modal booking-detail-modal"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '85vh',
              overflow: 'hidden', // Contain scroll
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              zIndex: 1000000000,
              padding: '0',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div className="modal-header" style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: 700 }}>{selectedBooking.eventName}</h3>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>ID: {selectedBooking.bookingId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#4b5563',
                  fontSize: '1.2rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="booking-detail-content" style={{ padding: '24px', overflowY: 'auto' }}>

              {/* Status Banner */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                borderRadius: '12px',
                background: getStatusBadge(selectedBooking.status || 'pending').color + '15',
                border: `1px solid ${getStatusBadge(selectedBooking.status || 'pending').color}40`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>Status Booking</span>
                <span style={{
                  fontWeight: 700,
                  color: getStatusBadge(selectedBooking.status || 'pending').color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusBadge(selectedBooking.status || 'pending').color }}></span>
                  {getStatusBadge(selectedBooking.status || 'pending').label}
                </span>
              </div>

              {/* Customer Info */}
              <div className="detail-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Informasi Pemesan</h4>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>👤 Nama Lengkap</span>
                    <span className="detail-value" style={{ fontWeight: 600, color: '#111827' }}>{selectedBooking.bookerName}</span>
                  </div>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>🌍 Asal Negara</span>
                    <span className="detail-value" style={{ fontWeight: 500 }}>{selectedBooking.country}</span>
                  </div>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>📞 Telepon</span>
                    <span className="detail-value" style={{ fontFamily: 'monospace' }}>{selectedBooking.phone}</span>
                  </div>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>📱 WhatsApp</span>
                    <a href={`https://wa.me/${selectedBooking.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}>
                      {selectedBooking.whatsapp} ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="detail-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Detail Acara</h4>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>📅 Tanggal</span>
                    <span className="detail-value" style={{ fontWeight: 600 }}>{selectedBooking.date ? selectedBooking.date.split('T')[0] : '-'}</span>
                  </div>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>⏰ Waktu</span>
                    <span className="detail-value" style={{ fontWeight: 600 }}>{selectedBooking.startTime} - {selectedBooking.endTime}</span>
                  </div>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>📦 Paket Aula</span>
                    <span className="detail-value">{selectedBooking.hallPackage}</span>
                  </div>
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="detail-label" style={{ color: '#6b7280' }}>⏱️ Durasi</span>
                    <span className="detail-value">{selectedBooking.duration} Jam</span>
                  </div>
                </div>
              </div>

              {/* Services Info */}
              {(selectedBooking.services && Object.values(selectedBooking.services).some(val => val && val !== '')) && (
                <div className="detail-section" style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Layanan Tambahan</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {selectedBooking.services.acOption && (
                      <div style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#0369a1' }}>❄️ AC: <b>{selectedBooking.services.acOption} Jam</b></div>
                    )}
                    {selectedBooking.services.chairOption && (
                      <div style={{ background: '#fdf2f8', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#be185d' }}>🪑 Kursi: <b>{selectedBooking.services.chairOption}</b></div>
                    )}
                    {selectedBooking.services.tableOption && (
                      <div style={{ background: '#fff7ed', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#c2410c' }}>🪑 Meja: <b>{selectedBooking.services.tableOption}</b></div>
                    )}
                    {selectedBooking.services.projectorScreen && (
                      <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#15803d' }}>📽️ Proyektor: <b>{selectedBooking.services.projectorScreen}</b></div>
                    )}
                    {selectedBooking.services.plateOption && (
                      <div style={{ background: '#fefce8', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#a16207' }}>🍽️ Piring: <b>{selectedBooking.services.plateOption}</b></div>
                    )}
                    {selectedBooking.services.glassOption && (
                      <div style={{ background: '#fefce8', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#a16207' }}>🥛 Gelas: <b>{selectedBooking.services.glassOption}</b></div>
                    )}
                  </div>
                </div>
              )}

              {/* Price Breakdown Component */}
              <div className="detail-section total-section" style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
                <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#6b7280' }}>
                  <span className="detail-label">🏛️ Sewa Aula</span>
                  <span className="detail-value">{selectedBooking.hallPrice?.toLocaleString() || 0} EGP</span>
                </div>
                {selectedBooking.afterHoursPrice > 0 && (
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#6b7280' }}>
                    <span className="detail-label">🌙 After Hours ({selectedBooking.afterHoursCount}h)</span>
                    <span className="detail-value">+{selectedBooking.afterHoursPrice?.toLocaleString() || 0} EGP</span>
                  </div>
                )}
                {selectedBooking.servicesPrice > 0 && (
                  <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#6b7280' }}>
                    <span className="detail-label">⚙️ Layanan Tambahan</span>
                    <span className="detail-value">+{selectedBooking.servicesPrice?.toLocaleString() || 0} EGP</span>
                  </div>
                )}
                <div className="detail-row total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <span className="detail-label" style={{ fontWeight: 600, color: '#374151' }}>💰 Total Harga</span>
                  <span className="detail-value price" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#8B4513' }}>{selectedBooking.totalPrice?.toLocaleString() || 0} EGP</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (!selectedBooking.date) return
                      const params = new URLSearchParams({
                        bookingId: selectedBooking.bookingId,
                        name: selectedBooking.bookerName,
                        event: selectedBooking.eventName,
                        date: selectedBooking.date.split('T')[0],
                        time: `${selectedBooking.startTime} - ${selectedBooking.endTime}`,
                        total: selectedBooking.totalPrice.toString(),
                      })
                      window.open(`/api/booking/auditorium/pdf?${params.toString()}`, '_blank')
                    }}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 500 }}
                  >
                    📄 Download PDF
                  </button>

                  <button
                    onClick={() => {
                      if (!selectedBooking.date) return
                      const params = new URLSearchParams({
                        bookingId: selectedBooking.bookingId,
                        name: selectedBooking.bookerName,
                        event: selectedBooking.eventName,
                        date: selectedBooking.date.split('T')[0],
                        total: selectedBooking.totalPrice.toString(),
                      })
                      window.open(`/api/booking/auditorium/invoice?${params.toString()}`, '_blank')
                    }}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 500 }}
                  >
                    🧾 Buat Invoice
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (!selectedBooking.date) return
                    const message = `📋 *Konfirmasi Booking Auditorium*\n\n` +
                      `Booking ID: ${selectedBooking.bookingId}\n` +
                      `Nama: ${selectedBooking.bookerName}\n` +
                      `Acara: ${selectedBooking.eventName}\n` +
                      `Tanggal: ${selectedBooking.date.split('T')[0]}\n` +
                      `Waktu: ${selectedBooking.startTime} - ${selectedBooking.endTime}\n` +
                      `Total: ${selectedBooking.totalPrice.toLocaleString()} EGP\n\n` +
                      `Status: ${getStatusBadge(selectedBooking.status || 'pending').label}`
                    window.open(`https://wa.me/${selectedBooking.whatsapp}?text=${encodeURIComponent(message)}`, '_blank')
                  }}
                  style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#25D366', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  📱 Kirim ke Customer
                </button>

                <button
                  onClick={() => {
                    const adminPhone = '201507049289'
                    const message = `🔔 *Update Booking Auditorium*\n\n` +
                      `📋 ID: ${selectedBooking.bookingId}\n` +
                      `👤 Nama: ${selectedBooking.bookerName}\n` +
                      `🎉 Acara: ${selectedBooking.eventName}\n` +
                      `📅 Tanggal: ${selectedBooking.date ? selectedBooking.date.split('T')[0] : ''}\n` +
                      `⏰ Waktu: ${selectedBooking.startTime} - ${selectedBooking.endTime}\n` +
                      `💰 Total: ${selectedBooking.totalPrice.toLocaleString()} EGP\n` +
                      `📊 Status: ${getStatusBadge(selectedBooking.status).label}\n\n` +
                      `📱 WA Customer: ${selectedBooking.whatsapp}`
                    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank')
                  }}
                  style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  📣 Broadcast Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .auditorium-calendar {
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-lg);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .calendar-nav {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .calendar-nav h3 {
          margin: 0;
          min-width: 180px;
          text-align: center;
          font-size: 1.25rem;
          color: var(--color-text-primary);
        }

        .nav-btn, .today-btn, .refresh-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid rgba(139, 69, 19, 0.2);
          border-radius: var(--radius-md);
          background: var(--color-bg-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .nav-btn:hover, .today-btn:hover, .refresh-btn:hover {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          background: rgba(139, 69, 19, 0.1);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .calendar-header-cell {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          padding: var(--spacing-sm);
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .calendar-day {
          background: var(--color-bg-card);
          min-height: 140px;
          padding: var(--spacing-sm);
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .calendar-day:hover {
          transform: scale(1.02);
          box-shadow: var(--shadow-md);
          z-index: 1;
        }

        .calendar-day.other-month {
          opacity: 0.4;
        }

        .calendar-day.today {
          border: 2px solid var(--color-primary);
          box-shadow: 0 0 0 2px rgba(139, 69, 19, 0.2);
        }

        .calendar-day.booked {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
        }

        .calendar-day.booked .day-number {
          color: white;
          font-weight: 700;
        }

        .calendar-day.available:hover {
          background: rgba(139, 69, 19, 0.1);
        }

        .day-number {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .bookings-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
          pointer-events: auto;
          position: relative;
          z-index: 50;
        }

        .booking-card {
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          padding: 4px 6px;
          font-size: 0.6875rem;
          display: flex;
          flex-direction: column;
          gap: 1px;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          z-index: 100;
          pointer-events: auto !important;
          user-select: none;
        }

        .booking-card:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.02);
        }

        .booking-card.status-pending {
          border-left: 3px solid #f59e0b;
        }

        .booking-card.status-confirmed {
          border-left: 3px solid #ffffff;
        }

        .booking-name {
          font-weight: 700;
          font-size: 0.75rem;
        }

        .booking-country,
        .booking-event,
        .booking-time {
          opacity: 0.9;
          font-size: 0.625rem;
        }

        .available-label {
          margin-top: auto;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-align: center;
          padding: var(--spacing-xs);
        }

        .calendar-legend {
          display: flex;
          gap: var(--spacing-lg);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(139, 69, 19, 0.1);
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.875rem;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-dot.booked {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }

        .legend-dot.available {
          background: var(--color-bg-card);
          border: 2px solid rgba(139, 69, 19, 0.3);
        }

        .legend-dot.pending {
          background: #f59e0b;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(0, 0, 0, 0.6) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          animation: fadeIn 0.2s ease;
        }

        .modal {
          background: #ffffff !important;
          border-radius: 16px !important;
          width: 90% !important;
          max-width: 500px !important;
          max-height: 90vh !important;
          overflow: auto !important;
          animation: slideUp 0.3s ease;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25) !important;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid rgba(139, 69, 19, 0.1);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(139, 69, 19, 0.1);
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: var(--color-primary);
          color: white;
        }

        .booking-detail-content {
          padding: var(--spacing-lg);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) 0;
        }

        .detail-label {
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }

        .detail-value {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .detail-row.total {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
        }

        .detail-value.price {
          font-size: 1.25rem;
          color: var(--color-primary);
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 999px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
        }

        hr {
          border: none;
          border-top: 1px solid rgba(139, 69, 19, 0.1);
          margin: var(--spacing-md) 0;
        }

        .detail-section {
          padding: var(--spacing-md) 0;
          border-bottom: 1px solid rgba(139, 69, 19, 0.1);
        }

        .detail-section:last-of-type {
          border-bottom: none;
        }

        .detail-section h4 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 0.9375rem;
          color: var(--color-primary);
        }

        .total-section {
          background: rgba(139, 69, 19, 0.05);
          margin: var(--spacing-md) calc(-1 * var(--spacing-lg));
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: none;
        }

        .booking-id {
          font-family: monospace;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .detail-value a {
          color: #25D366;
          text-decoration: none;
        }

        .detail-value a:hover {
          text-decoration: underline;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
          padding: var(--spacing-lg) 0 0 0;
          border-top: 1px solid rgba(139, 69, 19, 0.1);
          margin-top: var(--spacing-md);
        }

        .action-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .pdf-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .send-pdf-btn {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
        }

        .invoice-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .admin-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 768px) {
          .calendar-day {
            min-height: 100px;
          }
          .booking-card {
            font-size: 0.5625rem;
          }
          .booking-name {
            font-size: 0.625rem;
          }
        }
      `}</style>
    </div >
  )
}
