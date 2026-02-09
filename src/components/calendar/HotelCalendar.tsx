'use client'

import { useState, useEffect, useCallback } from 'react'

// Room configuration (synced with HotelBookings collection)
const HOTEL_ROOMS = [
  // Floor 1
  { number: '101', type: 'double', floor: 1, price: 35 },
  { number: '102', type: 'single', floor: 1, price: 30 },
  { number: '103', type: 'single', floor: 1, price: 30 },
  { number: '104', type: 'double', floor: 1, price: 35 },
  { number: '105', type: 'double', floor: 1, price: 35 },
  { number: '106', type: 'double', floor: 1, price: 35 },
  // Floor 2
  { number: '201', type: 'double', floor: 2, price: 35 },
  { number: '202', type: 'single', floor: 2, price: 30 },
  { number: '203', type: 'single', floor: 2, price: 30 },
  { number: '204', type: 'triple', floor: 2, price: 30 },
  { number: '205', type: 'quadruple', floor: 2, price: 35 },
  { number: '206', type: 'quadruple', floor: 2, price: 35 },
  // Homestay
  { number: 'HOMESTAY', type: 'homestay', floor: 0, price: 100 },
]

interface HotelBooking {
  id: string
  bookingId: string
  roomNumber: string
  roomType: string
  checkIn: string
  checkOut: string
  nights: number
  guestName: string
  guestCountry: string
  guestPhone: string
  guestWhatsapp: string
  pricePerNight: number
  totalPrice: number
  status: string
}

interface HotelCalendarProps {
  onBookRoom?: (roomNumber: string, date: Date) => void
}

export default function HotelCalendar({ onBookRoom }: HotelCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<HotelBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/booking/hotel?year=${year}&month=${month}`)
      const data = await res.json()
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Failed to fetch hotel bookings:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [year, month])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Generate days of the month
  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month - 1, i))
    }
    return days
  }

  const days = getDaysInMonth()

  // Check if a room is booked on a specific date
  const getBookingForDate = (roomNumber: string, date: Date): HotelBooking | null => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.find(b => {
      if (b.roomNumber !== roomNumber) return false
      const checkIn = b.checkIn.split('T')[0]
      const checkOut = b.checkOut.split('T')[0]
      return dateStr >= checkIn && dateStr < checkOut
    }) || null
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#22c55e'
      case 'checked-in': return '#3b82f6'
      case 'pending': return '#eab308'
      default: return '#22c55e'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Pending'
      case 'confirmed': return '✅ Confirmed'
      case 'checked-in': return '🏨 Checked-In'
      case 'checked-out': return '🚪 Checked-Out'
      case 'cancelled': return '❌ Cancelled'
      default: return status
    }
  }

  /* Color Palette for Bookings */
  const BOOKING_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#D946EF', // Fuchsia
    '#F43F5E', // Rose
    '#64748B', // Slate
    '#A855F7', // Purple
    '#EC4899', // Pink
  ]

  const getColorByName = (name: string) => {
    if (!name) return '#22c55e'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % BOOKING_COLORS.length
    return BOOKING_COLORS[index]
  }

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'single': return '🛏️'
      case 'double': return '🛏️🛏️'
      case 'triple': return '🛏️×3'
      case 'quadruple': return '🛏️×4'
      case 'homestay': return '🏠'
      default: return '🛏️'
    }
  }

  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="hotel-calendar">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button
            className="nav-btn"
            onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
          >
            ◀
          </button>
          <h3>{monthName}</h3>
          <button
            className="nav-btn"
            onClick={() => setCurrentDate(new Date(year, month, 1))}
          >
            ▶
          </button>
        </div>
        <div className="header-actions">
          <button
            className="today-btn"
            onClick={() => setCurrentDate(new Date())}
          >
            📅 Hari Ini
          </button>
          <button
            className="refresh-btn"
            onClick={fetchBookings}
            disabled={refreshing}
          >
            {refreshing ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="legend">
        <span className="legend-item"><span className="dot available"></span> Tersedia</span>
        <span className="legend-item"><span className="dot booked"></span> Terisi</span>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="loading">Memuat data...</div>
      ) : (
        <div className="calendar-scroll">
          <table className="room-table">
            <thead>
              <tr>
                <th className="room-header">Kamar</th>
                {days.map((day, idx) => (
                  <th
                    key={idx}
                    className={`day-header ${isToday(day) ? 'today' : ''}`}
                  >
                    <span className="day-name">
                      {day.toLocaleDateString('id-ID', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className="day-date">{day.getDate()}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Floor 1 Header */}
              <tr className="floor-header">
                <td colSpan={days.length + 1}>🏢 Lantai 1</td>
              </tr>
              {HOTEL_ROOMS.filter(r => r.floor === 1).map(room => (
                <tr key={room.number}>
                  <td className="room-info">
                    <strong>{room.number}</strong>
                    <span className="room-type">{getRoomTypeIcon(room.type)} {room.type}</span>
                    <span className="room-price">${room.price}/night</span>
                  </td>
                  {days.map((day, idx) => {
                    const booking = getBookingForDate(room.number, day)
                    return (
                      <td
                        key={idx}
                        className={`day-cell ${booking ? 'booked' : 'available'} ${isToday(day) ? 'today' : ''}`}
                        onClick={() => booking ? setSelectedBooking(booking) : onBookRoom?.(room.number, day)}
                        title={booking ? `${booking.guestName} (${booking.status})` : 'Tersedia'}
                        style={booking ? { backgroundColor: getColorByName(booking.guestName) + '30' } : {}}
                      >
                        {booking && (
                          <span className="booking-indicator" style={{ backgroundColor: getColorByName(booking.guestName) }}></span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Floor 2 Header */}
              <tr className="floor-header">
                <td colSpan={days.length + 1}>🏢 Lantai 2</td>
              </tr>
              {HOTEL_ROOMS.filter(r => r.floor === 2).map(room => (
                <tr key={room.number}>
                  <td className="room-info">
                    <strong>{room.number}</strong>
                    <span className="room-type">{getRoomTypeIcon(room.type)} {room.type}</span>
                    <span className="room-price">${room.price}/night</span>
                  </td>
                  {days.map((day, idx) => {
                    const booking = getBookingForDate(room.number, day)
                    return (
                      <td
                        key={idx}
                        className={`day-cell ${booking ? 'booked' : 'available'} ${isToday(day) ? 'today' : ''}`}
                        onClick={() => booking ? setSelectedBooking(booking) : onBookRoom?.(room.number, day)}
                        title={booking ? `${booking.guestName} (${booking.status})` : 'Tersedia'}
                        style={booking ? { backgroundColor: getColorByName(booking.guestName) + '30' } : {}}
                      >
                        {booking && (
                          <span className="booking-indicator" style={{ backgroundColor: getColorByName(booking.guestName) }}></span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Homestay Header */}
              <tr className="floor-header homestay">
                <td colSpan={days.length + 1}>🏠 Homestay</td>
              </tr>
              {HOTEL_ROOMS.filter(r => r.floor === 0).map(room => (
                <tr key={room.number}>
                  <td className="room-info">
                    <strong>{room.number}</strong>
                    <span className="room-type">{getRoomTypeIcon(room.type)} 3 Kamar + Fasilitas</span>
                    <span className="room-price">${room.price}/night</span>
                  </td>
                  {days.map((day, idx) => {
                    const booking = getBookingForDate(room.number, day)
                    return (
                      <td
                        key={idx}
                        className={`day-cell ${booking ? 'booked' : 'available'} ${isToday(day) ? 'today' : ''}`}
                        onClick={() => booking ? setSelectedBooking(booking) : onBookRoom?.(room.number, day)}
                        title={booking ? `${booking.guestName} (${booking.status})` : 'Tersedia'}
                        style={booking ? { backgroundColor: getStatusColor(booking.status) + '30' } : {}}
                      >
                        {booking && (
                          <span className="booking-indicator" style={{ backgroundColor: getStatusColor(booking.status) }}></span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Detail Modal */}
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
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2147483647,
            visibility: 'visible',
            opacity: 1,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>
                  🏨 Kamar {selectedBooking.roomNumber}
                </h3>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  ID: {selectedBooking.bookingId}
                </span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Status */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                borderRadius: '12px',
                background: getStatusColor(selectedBooking.status) + '15',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600 }}>Status</span>
                <span style={{ fontWeight: 700, color: getStatusColor(selectedBooking.status) }}>
                  {getStatusLabel(selectedBooking.status)}
                </span>
              </div>

              {/* Guest Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Informasi Tamu
                </h4>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>👤 Nama</span>
                    <span style={{ fontWeight: 600 }}>{selectedBooking.guestName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>🌍 Negara</span>
                    <span>{selectedBooking.guestCountry}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>📱 WhatsApp</span>
                    <a
                      href={`https://wa.me/${selectedBooking.guestWhatsapp}`}
                      target="_blank"
                      style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {selectedBooking.guestWhatsapp} ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Stay Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Detail Menginap
                </h4>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>📅 Check-In</span>
                    <span style={{ fontWeight: 600 }}>{selectedBooking.checkIn.split('T')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>📅 Check-Out</span>
                    <span style={{ fontWeight: 600 }}>{selectedBooking.checkOut.split('T')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>🌙 Malam</span>
                    <span>{selectedBooking.nights} malam</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#6b7280' }}>
                  <span>Harga/Malam</span>
                  <span>${selectedBooking.pricePerNight} USD</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontWeight: 600 }}>💰 Total</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#8B4513' }}>
                    ${selectedBooking.totalPrice} USD
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  onClick={() => {
                    const message = `📋 *Detail Booking Hotel*\n\n` +
                      `ID: ${selectedBooking.bookingId}\n` +
                      `Kamar: ${selectedBooking.roomNumber}\n` +
                      `Nama: ${selectedBooking.guestName}\n` +
                      `Check-In: ${selectedBooking.checkIn.split('T')[0]}\n` +
                      `Check-Out: ${selectedBooking.checkOut.split('T')[0]}\n` +
                      `Total: $${selectedBooking.totalPrice} USD`
                    window.open(`https://wa.me/${selectedBooking.guestWhatsapp}?text=${encodeURIComponent(message)}`, '_blank')
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#25D366',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  📱 WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
                .hotel-calendar {
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
                }

                .nav-btn, .today-btn, .refresh-btn {
                    padding: var(--spacing-sm) var(--spacing-md);
                    border: 1px solid rgba(139, 69, 19, 0.2);
                    border-radius: var(--radius-md);
                    background: var(--color-bg-secondary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .nav-btn:hover, .today-btn:hover, .refresh-btn:hover {
                    background: var(--color-primary);
                    color: white;
                }

                .header-actions {
                    display: flex;
                    gap: var(--spacing-sm);
                }

                .legend {
                    display: flex;
                    gap: var(--spacing-lg);
                    margin-bottom: var(--spacing-md);
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                }

                .dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }

                .dot.available { background: #e5e7eb; border: 2px solid #d1d5db; }
                .dot.booked { background: #22c55e; }

                .loading {
                    text-align: center;
                    padding: 60px;
                    color: var(--color-text-muted);
                }

                .calendar-scroll {
                    overflow-x: auto;
                }

                .room-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 800px;
                }

                .room-header {
                    text-align: left;
                    padding: var(--spacing-md);
                    background: var(--color-bg-secondary);
                    font-weight: 600;
                    min-width: 140px;
                    position: sticky;
                    left: 0;
                    z-index: 2;
                }

                .day-header {
                    padding: var(--spacing-sm);
                    text-align: center;
                    background: var(--color-bg-secondary);
                    min-width: 36px;
                }

                .day-header.today {
                    background: var(--color-primary);
                    color: white;
                }

                .day-name {
                    display: block;
                    font-size: 0.625rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .day-date {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 700;
                }

                .floor-header td {
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: #f3f4f6;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                }

                .floor-header.homestay td {
                    background: #fef3c7;
                    color: #92400e;
                }

                .room-info {
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: var(--color-bg-card);
                    position: sticky;
                    left: 0;
                    z-index: 1;
                    border-bottom: 1px solid rgba(139, 69, 19, 0.1);
                }

                .room-info strong {
                    display: block;
                    font-size: 1rem;
                }

                .room-type {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--color-text-muted);
                    text-transform: capitalize;
                }

                .room-price {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--color-primary);
                    font-weight: 500;
                }

                .day-cell {
                    text-align: center;
                    padding: 4px;
                    border-bottom: 1px solid rgba(139, 69, 19, 0.1);
                    border-right: 1px solid rgba(139, 69, 19, 0.05);
                    cursor: pointer;
                    transition: all 0.15s ease;
                    position: relative;
                    min-height: 32px;
                }

                .day-cell.today {
                    background: rgba(139, 69, 19, 0.05);
                }

                .day-cell.available:hover {
                    background: #dcfce7;
                }

                .day-cell.booked {
                    cursor: pointer;
                }

                .booking-indicator {
                    display: block;
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    margin: 4px 0;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
    </div>
  )
}
