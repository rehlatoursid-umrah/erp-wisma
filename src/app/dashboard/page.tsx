'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import LiveCalendar from '@/components/calendar/LiveCalendar'
import HotelCalendar from '@/components/calendar/HotelCalendar'
import AuditoriumCalendar from '@/components/calendar/AuditoriumCalendar'
import BookingModal from '@/components/booking/BookingModal'
import Logbook from '@/components/dashboard/Logbook'

// Auditorium booking interface
interface AuditoriumBooking {
  id: string
  date: string
  bookerName: string
  eventName: string
  startTime: string
  endTime: string
  excludeService: string
}

// Mock data untuk demo
const mockAulaBookings = [
  { date: '2026-02-02', title: 'Pertemuan Keluarga Ahmad', type: 'booked' as const },
  { date: '2026-02-05', title: 'Acara Pengajian', type: 'booked' as const },
  { date: '2026-02-08', title: 'Inquiry: Resepsi', type: 'inquiry' as const },
  { date: '2026-02-12', title: 'Workshop UMKM', type: 'booked' as const },
  { date: '2026-02-15', title: 'Inquiry: Meeting', type: 'inquiry' as const },
]

const mockVisaInquiries = [
  { date: '2026-02-03', title: 'Ahmad - Umrah', type: 'inquiry' as const },
  { date: '2026-02-04', title: 'Siti - Umrah', type: 'inquiry' as const },
  { date: '2026-02-07', title: 'Budi - Tour', type: 'booked' as const },
  { date: '2026-02-10', title: 'Group 5 pax - Umrah', type: 'inquiry' as const },
]

const mockRentalBookings = [
  { date: '2026-02-02', title: 'Projector', type: 'rental' as const },
  { date: '2026-02-05', title: 'Sound System', type: 'rental' as const },
  { date: '2026-02-08', title: 'Kursi x50', type: 'rental' as const },
]

const mockHotelRooms = [
  {
    id: '101', name: 'Room 101', type: 'standard' as const, price: 300, bookings: [
      { date: '2026-02-02', guestName: 'Ahmad' },
      { date: '2026-02-03', guestName: 'Ahmad' },
      { date: '2026-02-10', guestName: 'Siti' },
    ]
  },
  {
    id: '102', name: 'Room 102', type: 'standard' as const, price: 300, bookings: [
      { date: '2026-02-05', guestName: 'Budi' },
      { date: '2026-02-06', guestName: 'Budi' },
    ]
  },
  { id: '103', name: 'Room 103', type: 'deluxe' as const, price: 450, bookings: [] },
  {
    id: '104', name: 'Room 104', type: 'suite' as const, price: 600, bookings: [
      { date: '2026-02-08', guestName: 'VIP Guest' },
      { date: '2026-02-09', guestName: 'VIP Guest' },
      { date: '2026-02-10', guestName: 'VIP Guest' },
    ]
  },
  { id: 'A', name: 'Homestay A', type: 'standard' as const, price: 500, bookings: [] },
  {
    id: 'B', name: 'Homestay B', type: 'standard' as const, price: 500, bookings: [
      { date: '2026-02-02', guestName: 'Keluarga Ali' },
      { date: '2026-02-03', guestName: 'Keluarga Ali' },
      { date: '2026-02-04', guestName: 'Keluarga Ali' },
    ]
  },
]

type BookingType = 'hotel' | 'aula' | 'visa' | 'rental'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'hotel' | 'aula' | 'visa' | 'rental'>('overview')
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; type: BookingType; date?: Date }>({
    isOpen: false,
    type: 'hotel',
  })
  const [recentInvoices, setRecentInvoices] = useState([
    { id: 'INV-20260202-0001', customer: 'Ahmad Fauzi', type: 'Hotel', amount: 'EGP 900', status: 'sent' },
    { id: 'INV-20260201-0012', customer: 'Siti Aminah', type: 'Aula', amount: 'EGP 450', status: 'paid' },
  ])
  const [auditoriumBookings, setAuditoriumBookings] = useState<AuditoriumBooking[]>([])

  // Fetch auditorium bookings from API
  const fetchAuditoriumBookings = async () => {
    try {
      const res = await fetch('/api/booking/auditorium?status=all')
      if (res.ok) {
        const data = await res.json()
        setAuditoriumBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch auditorium bookings:', error)
    }
  }

  const [stats, setStats] = useState({
    hotel: 0,
    aula: 0,
    visa: 0,
    rental: 0
  })

  const [dashboardData, setDashboardData] = useState<{
    hotel: any[],
    aula: any[],
    visa: any[],
    rental: any[]
  }>({
    hotel: [],
    aula: [],
    visa: [],
    rental: []
  })

  // Fetch dashboard stats from API
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setDashboardData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }

  // Load bookings on mount
  useEffect(() => {
    fetchAuditoriumBookings()
    fetchDashboardStats()
  }, [])

  const handleBooking = (data: any) => {
    // Generate invoice
    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`

    // Add to recent invoices
    setRecentInvoices(prev => [{
      id: invoiceNo,
      customer: data.customerName,
      type: bookingModal.type.charAt(0).toUpperCase() + bookingModal.type.slice(1),
      amount: 'EGP XXX',
      status: 'sent',
    }, ...prev])

    // Show success message
    alert(`✅ Booking berhasil!\n\n📄 Invoice ${invoiceNo} telah dikirim ke WhatsApp ${data.customerWA}`)
  }

  const openBookingModal = (type: BookingType, date?: Date) => {
    setBookingModal({ isOpen: true, type, date })
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${activeTab === 'hotel' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotel')}
          >
            🏨 Hotel
          </button>
          <button
            className={`tab ${activeTab === 'aula' ? 'active' : ''}`}
            onClick={() => setActiveTab('aula')}
          >
            🏢 Auditorium
          </button>
          <button
            className={`tab ${activeTab === 'visa' ? 'active' : ''}`}
            onClick={() => setActiveTab('visa')}
          >
            ✈️ Visa
          </button>
          <button
            className={`tab ${activeTab === 'rental' ? 'active' : ''}`}
            onClick={() => setActiveTab('rental')}
          >
            📦 Rental
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            {/* Quick Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-icon">🏨</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.hotel}/20</span>
                  <span className="stat-label">Kamar Terisi</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🏢</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.aula}</span>
                  <span className="stat-label">Booking Aula</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">✈️</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.visa}</span>
                  <span className="stat-label">Visa Inquiry</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📦</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.rental}</span>
                  <span className="stat-label">Rental Aktif</span>
                </div>
              </div>
            </div>

            {/* Mini Calendars Grid */}
            <div className="mini-calendars">
              <div className="mini-calendar-card" onClick={() => setActiveTab('hotel')}>
                <h4>🏨 Hotel - Hari Ini</h4>
                <div className="mini-events">
                  {dashboardData.hotel.length === 0 ? <div className="text-muted" style={{ padding: 10, color: '#888' }}>Tidak ada tamu hari ini</div> :
                    dashboardData.hotel.map((booking: any, idx) => (
                      <div key={idx} className="mini-event booked">
                        <span style={{ fontWeight: 'bold', minWidth: 30 }}>{booking.assignedRooms?.[0] || '?'}</span>
                        <span>{booking.guest?.fullName}</span>
                      </div>
                    ))
                  }
                </div>
                <span className="view-more">Lihat Detail →</span>
              </div>

              <div className="mini-calendar-card" onClick={() => setActiveTab('aula')}>
                <h4>🏢 Auditorium - Minggu Ini</h4>
                <div className="mini-events">
                  {dashboardData.aula.length === 0 ? <div className="text-muted" style={{ padding: 10, color: '#888' }}>Tidak ada event minggu ini</div> :
                    dashboardData.aula.slice(0, 3).map((booking: any, idx) => (
                      <div key={idx} className="mini-event booked">
                        <span style={{ whiteSpace: 'nowrap' }}>{new Date(booking.date).getDate()} {new Date(booking.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                        <span>{booking.eventName}</span>
                      </div>
                    ))}
                </div>
                <span className="view-more">Lihat Kalender →</span>
              </div>

              <div className="mini-calendar-card" onClick={() => setActiveTab('visa')}>
                <h4>✈️ Visa Inquiries</h4>
                <div className="mini-list">
                  {dashboardData.visa.length === 0 ? <div className="text-muted" style={{ padding: 10, color: '#888' }}>Tidak ada inquiry baru</div> :
                    dashboardData.visa.map((item: any, idx) => (
                      <div key={idx} className="mini-list-item">
                        <span className={`dot inquiry`}></span>
                        <span>{item.passengerName} - {item.visaStatus === 'pending_docs' ? 'Pending' : 'Process'}</span>
                      </div>
                    ))}
                </div>
                <span className="view-more">Lihat Semua →</span>
              </div>

              <div className="mini-calendar-card" onClick={() => setActiveTab('rental')}>
                <h4>📦 Equipment Rental</h4>
                <div className="mini-list">
                  {dashboardData.rental.length === 0 ? <div className="text-muted" style={{ padding: 10, color: '#888' }}>Tidak ada rental aktif</div> :
                    dashboardData.rental.slice(0, 3).map((item: any, idx) => (
                      <div key={idx} className="mini-list-item">
                        <span className="dot rental"></span>
                        <span>{item.customerName} - {item.invoiceNo}</span>
                      </div>
                    ))}
                </div>
                <span className="view-more">Lihat Semua →</span>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="card invoices-card">
              <div className="card-header">
                <h3>📄 Auto-Generated Invoices</h3>
                <span className="badge badge-info">Auto-sent via WA</span>
              </div>
              <table className="invoices-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv, idx) => (
                    <tr key={idx}>
                      <td><code>{inv.id}</code></td>
                      <td>{inv.customer}</td>
                      <td>{inv.type}</td>
                      <td>{inv.amount}</td>
                      <td>
                        <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-info'}`}>
                          {inv.status === 'paid' ? '✓ Paid' : '📤 Sent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Logbook */}
            <Logbook />
          </div>
        )}

        {/* Hotel Tab */}
        {activeTab === 'hotel' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>🏨 Hotel & Homestay Calendar</h2>
              <button
                className="btn btn-primary"
                onClick={() => openBookingModal('hotel')}
              >
                + New Booking
              </button>
            </div>
            <HotelCalendar
              onBookRoom={(roomNumber, date) => {
                setBookingModal({ isOpen: true, type: 'hotel', date })
              }}
            />
          </div>
        )}

        {/* Auditorium Tab */}
        {activeTab === 'aula' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>🏢 Auditorium Calendar</h2>
            </div>
            <AuditoriumCalendar />
          </div>
        )}

        {/* Visa Tab */}
        {activeTab === 'visa' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>✈️ Visa Inquiry Calendar</h2>
              <button
                className="btn btn-primary"
                onClick={() => openBookingModal('visa')}
              >
                + Add Inquiry
              </button>
            </div>
            <LiveCalendar
              bookings={mockVisaInquiries}
              onDateClick={(date) => openBookingModal('visa', date)}
              legendItems={[
                { label: 'Confirmed', color: 'var(--color-success)', type: 'booked' },
                { label: 'Inquiry', color: 'var(--color-warning)', type: 'inquiry' },
                { label: 'No Inquiry', color: 'var(--color-text-muted)', type: 'available' },
              ]}
            />
          </div>
        )}

        {/* Rental Tab */}
        {activeTab === 'rental' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>📦 Equipment Rental Calendar</h2>
              <button
                className="btn btn-primary"
                onClick={() => openBookingModal('rental')}
              >
                + New Rental
              </button>
            </div>
            <LiveCalendar
              bookings={mockRentalBookings}
              onDateClick={(date) => openBookingModal('rental', date)}
              legendItems={[
                { label: 'Rented', color: 'var(--color-info)', type: 'rental' },
                { label: 'Available', color: 'var(--color-success)', type: 'available' },
              ]}
            />
          </div>
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ ...bookingModal, isOpen: false })}
        onSubmit={handleBooking}
        type={bookingModal.type}
        selectedDate={bookingModal.date}
      />

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg-primary);
        }

        .dashboard-tabs {
          display: flex;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
          padding: var(--spacing-xs);
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        .tab {
          padding: var(--spacing-sm) var(--spacing-xl);
          background: transparent;
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all var(--transition-base);
          position: relative;
          overflow: hidden;
        }

        .tab::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--color-primary);
          opacity: 0;
          transform: scale(0.8);
          transition: all var(--transition-base);
          border-radius: inherit;
          z-index: -1;
        }

        .tab:hover {
          color: var(--color-primary);
          transform: translateY(-2px);
        }

        .tab:hover::before {
          opacity: 0.1;
          transform: scale(1);
        }

        .tab.active {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .tab.active::before {
          opacity: 0;
        }

        .overview-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
          animation: slideUp 0.5s var(--transition-base);
          width: 100%;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          width: 100%;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl);
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-base);
          cursor: pointer;
          border: 1px solid transparent;
        }

        .stat-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary-light);
        }

        .stat-icon {
          font-size: 2.5rem;
          transition: transform var(--transition-spring);
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.2) rotate(-5deg);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.9375rem;
          color: var(--color-text-muted);
        }

        .mini-calendars {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          width: 100%;
        }

        .mini-calendar-card {
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: all var(--transition-base);
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .mini-calendar-card::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, var(--color-primary-light) 0%, transparent 70%);
          opacity: 0;
          transition: opacity var(--transition-base);
          border-radius: 0 var(--radius-xl) 0 100%;
        }

        .mini-calendar-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: var(--shadow-xl);
          border-color: var(--color-primary-light);
        }

        .mini-calendar-card:hover::after {
          opacity: 0.3;
        }

        .mini-calendar-card h4 {
          margin-bottom: var(--spacing-lg);
          font-size: 1rem;
          font-weight: 600;
        }

        .mini-rooms {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .mini-room {
          padding: var(--spacing-sm);
          text-align: center;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          transition: all var(--transition-base);
        }

        .mini-room:hover {
          transform: scale(1.1);
        }

        .mini-room.available {
          background: var(--color-success-light);
          color: #166534;
        }

        .mini-room.booked {
          background: var(--color-error-light);
          color: #991B1B;
        }

        .mini-events {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .mini-event {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          transition: all var(--transition-fast);
        }

        .mini-event:hover {
          transform: translateX(4px);
        }

        .mini-event.booked {
          background: var(--color-error-light);
        }

        .mini-event.inquiry {
          background: var(--color-warning-light);
        }

        .mini-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .mini-list-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          font-size: 0.875rem;
          padding: var(--spacing-xs) 0;
          transition: all var(--transition-fast);
        }

        .mini-list-item:hover {
          transform: translateX(4px);
          color: var(--color-primary);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: transform var(--transition-spring);
        }

        .mini-list-item:hover .dot {
          transform: scale(1.5);
        }

        .dot.booked { background: var(--color-success); }
        .dot.inquiry { background: var(--color-warning); }
        .dot.rental { background: var(--color-info); }

        .view-more {
          font-size: 0.875rem;
          color: var(--color-primary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          transition: all var(--transition-fast);
        }

        .mini-calendar-card:hover .view-more {
          transform: translateX(4px);
        }

        .invoices-card {
          overflow: hidden;
          border-radius: var(--radius-xl);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .invoices-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoices-table th, .invoices-table td {
          padding: var(--spacing-md) var(--spacing-lg);
          text-align: left;
          border-bottom: 1px solid rgba(139, 69, 19, 0.1);
        }

        .invoices-table tr {
          transition: all var(--transition-fast);
        }

        .invoices-table tbody tr:hover {
          background: var(--color-bg-secondary);
        }

        .invoices-table th {
          font-weight: 600;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .invoices-table code {
          font-size: 0.875rem;
          color: var(--color-primary);
          background: rgba(139, 69, 19, 0.05);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
        }

        .tab-content {
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .tab-header h2 {
          margin: 0;
          font-size: 1.75rem;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @media (max-width: 1200px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .mini-calendars {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-row {
            grid-template-columns: 1fr;
          }
          .mini-calendars {
            grid-template-columns: 1fr;
          }
          .tab {
            padding: var(--spacing-sm) var(--spacing-md);
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}
