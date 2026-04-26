'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Hotel,
  Building2,
  Plane,
  Package,
  Receipt,
  LayoutDashboard,
  Loader2
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import LiveCalendar from '@/components/calendar/LiveCalendar'
import HotelCalendar from '@/components/calendar/HotelCalendar'
import AuditoriumCalendar from '@/components/calendar/AuditoriumCalendar'
import BookingModal from '@/components/booking/BookingModal'
import Logbook from '@/components/dashboard/Logbook'
import ManualInvoiceModal from '@/components/invoice/ManualInvoiceModal'
import InvoiceView from '@/components/dashboard/InvoiceView'
import WeeklyOverview from '@/components/dashboard/WeeklyOverview'
import MiniCalendarCard from '@/components/dashboard/MiniCalendarCard'
import RecentInvoicesCard from '@/components/dashboard/RecentInvoicesCard'
import { cn } from '@/lib/utils'

// Lazy-load Recharts components (SSR unsafe)
const RevenueChart = dynamic(() => import('@/components/dashboard/RevenueChart'), { ssr: false })
const OccupancyBar = dynamic(() => import('@/components/dashboard/OccupancyBar'), { ssr: false })

// ═══ TYPES ═══
type BookingType = 'hotel' | 'aula' | 'visa' | 'rental'
type TabType = 'overview' | 'invoice' | BookingType

const TAB_CONFIG = [
  { key: 'overview' as const, icon: LayoutDashboard, label: 'Overview', color: '#8B4513' },
  { key: 'hotel' as const, icon: Hotel, label: 'Hotel', color: '#3b82f6' },
  { key: 'aula' as const, icon: Building2, label: 'Auditorium', color: '#8b5cf6' },
  { key: 'visa' as const, icon: Plane, label: 'Visa', color: '#f59e0b' },
  { key: 'rental' as const, icon: Package, label: 'Rental', color: '#10b981' },
  { key: 'invoice' as const, icon: Receipt, label: 'Invoice', color: '#ef4444' },
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

export default function DashboardPage() {
  const router = useRouter()
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // ═══ SESSION CHECK ═══
  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (!data?.user) router.push('/')
        else setSessionLoading(false)
      })
      .catch(() => router.push('/'))
  }, [router])

  // ═══ BOOKING MODAL STATE ═══
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; type: BookingType; date?: Date }>({
    isOpen: false,
    type: 'hotel',
  })

  // ═══ DASHBOARD DATA ═══
  const [stats, setStats] = useState<{
    hotel: number; aula: number; visa: number; rental: number
    balances?: { EGP: number; USD: number; IDR: number; EUR: number; monthLabel?: string }
  }>({ hotel: 0, aula: 0, visa: 0, rental: 0, balances: { EGP: 0, USD: 0, IDR: 0, EUR: 0 } })

  const [dashboardData, setDashboardData] = useState<{
    hotel: any[]; aula: any[]; visa: any[]; rental: any[]; recentPaidInvoices: any[]
  }>({ hotel: [], aula: [], visa: [], rental: [], recentPaidInvoices: [] })

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

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  // ═══ HANDLERS ═══
  const handleBooking = (data: any) => {
    fetchDashboardStats()
    setRefreshTrigger(prev => prev + 1)
  }

  const openBookingModal = (type: BookingType, date?: Date) => {
    setBookingModal({ isOpen: true, type, date })
  }

  // ═══ LOADING STATE ═══
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium text-sm">Memuat sesi pengguna...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[280px] min-h-screen w-full lg:w-[calc(100vw-280px)] max-w-full p-4 lg:p-6 xl:p-8 transition-all">
        <Header onMenuClick={() => setSidebarOpen(true)} balances={stats.balances} />

        {/* ═══ TAB NAVIGATION ═══ */}
        <div className="mb-6 mt-1 lg:mt-0">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide p-1.5 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-primary/[0.08] dark:border-border rounded-2xl shadow-sm">
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 relative transition-all duration-200",
                  activeTab === tab.key
                    ? "bg-card dark:bg-muted shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                style={{ color: activeTab === tab.key ? tab.color : undefined }}
              >
                <tab.icon size={16} />
                <span className={cn("hidden sm:inline", activeTab === tab.key && "inline")}>
                  {tab.label}
                </span>
                {activeTab === tab.key && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full animate-fade-in"
                    style={{ background: tab.color }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ INVOICE TAB ═══ */}
        {activeTab === 'invoice' && (
          <InvoiceView
            refreshTrigger={refreshTrigger}
            onUpdate={() => { fetchDashboardStats(); setRefreshTrigger(prev => prev + 1) }}
          />
        )}

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <WeeklyOverview refreshTrigger={refreshTrigger} />

            {/* Mini Calendar Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <MiniCalendarCard
                icon={Hotel}
                title="Hotel - Minggu Ini"
                items={dashboardData.hotel}
                emptyText="Tidak ada booking minggu ini"
                onViewAll={() => setActiveTab('hotel')}
                viewAllLabel="Lihat Detail →"
                renderItem={(booking: any, idx) => {
                  let roomNum = '?'
                  try {
                    if (Array.isArray(booking.assignedRooms)) roomNum = booking.assignedRooms[0]
                    else if (typeof booking.assignedRooms === 'string') {
                      const parsed = JSON.parse(booking.assignedRooms)
                      if (Array.isArray(parsed)) roomNum = parsed[0]
                      else roomNum = booking.assignedRooms
                    }
                  } catch { roomNum = booking.assignedRooms || '?' }
                  const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm p-1.5 rounded-md bg-red-50/60 dark:bg-red-950/20">
                      <span className="text-xs whitespace-nowrap min-w-[36px] text-muted-foreground">
                        {checkInDate ? checkInDate.getDate() : '-'}{' '}
                        <span className="text-[0.65rem]">{checkInDate ? checkInDate.toLocaleDateString('id-ID', { month: 'short' }) : ''}</span>
                      </span>
                      <span className="truncate text-foreground/80">
                        {booking.guest?.fullName || 'Tamu'}{' '}
                        <span className="text-muted-foreground text-xs">R.{roomNum}</span>
                      </span>
                    </div>
                  )
                }}
              />

              <MiniCalendarCard
                icon={Building2}
                title="Auditorium - Minggu Ini"
                items={dashboardData.aula}
                emptyText="Tidak ada booking minggu ini"
                onViewAll={() => setActiveTab('aula')}
                viewAllLabel="Lihat Kalender →"
                renderItem={(booking: any, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm p-1.5 rounded-md bg-red-50/60 dark:bg-red-950/20">
                    <span className="text-xs whitespace-nowrap min-w-[36px] text-muted-foreground">
                      {booking.event?.date ? new Date(booking.event.date).getDate() : '-'}{' '}
                      <span className="text-[0.65rem]">{booking.event?.date ? new Date(booking.event.date).toLocaleDateString('id-ID', { month: 'short' }) : ''}</span>
                    </span>
                    <span className="truncate text-foreground/80">{booking.event?.name || 'Event'}</span>
                  </div>
                )}
              />

              <MiniCalendarCard
                icon={Plane}
                title="Visa Inquiries - Minggu Ini"
                items={dashboardData.visa}
                emptyText="Tidak ada inquiry minggu ini"
                onViewAll={() => setActiveTab('visa')}
                viewAllLabel="Lihat Semua →"
                renderItem={(item: any, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm py-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[0.75rem] text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      </span>
                      <span className="truncate block text-foreground/80">
                        {item.passengerName}{' '}
                        <span className="text-muted-foreground text-xs">
                          ({item.visaStatus === 'pending_docs' ? 'Pending' : 'Process'})
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              />

              <MiniCalendarCard
                icon={Package}
                title="Rental Equipment - Minggu Ini"
                items={dashboardData.rental}
                emptyText="Tidak ada rental minggu ini"
                onViewAll={() => setActiveTab('rental')}
                viewAllLabel="Lihat Semua →"
                renderItem={(item: any, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm py-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-info flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[0.75rem] text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                      </span>
                      <span className="truncate block text-foreground/80">
                        {item.customerName}{' '}
                        <span className="text-muted-foreground text-xs">({item.invoiceNo})</span>
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RevenueChart invoices={dashboardData.recentPaidInvoices} />
              <OccupancyBar stats={{ hotel: stats.hotel, auditorium: stats.aula, visa: stats.visa, rental: stats.rental }} />
            </div>

            {/* Recent Paid Invoices */}
            <RecentInvoicesCard invoices={dashboardData.recentPaidInvoices || []} />

            {/* Logbook */}
            <Logbook />
          </div>
        )}

        {/* ═══ HOTEL TAB ═══ */}
        {activeTab === 'hotel' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-3 font-heading">
                <Hotel size={28} strokeWidth={1.5} /> Hotel Calendar
              </h2>
              <button className="btn btn-primary" onClick={() => openBookingModal('hotel')}>+ New Booking</button>
            </div>
            <HotelCalendar
              refreshTrigger={refreshTrigger}
              onUpdate={() => { fetchDashboardStats(); setRefreshTrigger(prev => prev + 1) }}
              onBookRoom={(roomNumber, date) => setBookingModal({ isOpen: true, type: 'hotel', date })}
            />
          </div>
        )}

        {/* ═══ AUDITORIUM TAB ═══ */}
        {activeTab === 'aula' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-3 font-heading">
              <Building2 size={28} strokeWidth={1.5} /> Auditorium Schedule
            </h2>
            <AuditoriumCalendar />
          </div>
        )}

        {/* ═══ VISA TAB ═══ */}
        {activeTab === 'visa' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-3 font-heading">
                <Plane size={28} strokeWidth={1.5} /> Visa Inquiries
              </h2>
              <button className="btn btn-primary" onClick={() => openBookingModal('visa')}>+ Add Inquiry</button>
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

        {/* ═══ RENTAL TAB ═══ */}
        {activeTab === 'rental' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-3 font-heading">
                <Package size={28} strokeWidth={1.5} /> Equipment Rentals
              </h2>
              <button className="btn btn-primary" onClick={() => openBookingModal('rental')}>+ New Rental</button>
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
    </div>
  )
}
