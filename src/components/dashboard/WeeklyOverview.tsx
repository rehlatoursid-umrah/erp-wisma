'use client'

import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Hotel,
  Building2,
  Plane,
  Package
} from 'lucide-react'

interface WeeklyStats {
  hotel: number
  auditorium: number
  visa: number
  rental: number
}

interface WeeklyOverviewProps {
  refreshTrigger?: number
}

export default function WeeklyOverview({ refreshTrigger = 0 }: WeeklyOverviewProps) {
  const [stats, setStats] = useState<WeeklyStats>({
    hotel: 0,
    auditorium: 0,
    visa: 0,
    rental: 0
  })
  const [dateRange, setDateRange] = useState<string>('')

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/weekly-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)

        // Format date range
        if (data.period) {
          const start = new Date(data.period.start)
          const end = new Date(data.period.end)
          const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
          setDateRange(`${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`)
        }
      }
    } catch (error) {
      console.error('Failed to fetch weekly stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  return (
    <div className="weekly-overview">
      <div className="section-header">
        <h2><CalendarDays className="inline-icon" size={24} /> Overview Minggu Ini</h2>
        <span className="date-range">{dateRange}</span>
      </div>

      <div className="stats-grid">
        {/* Hotel Card */}
        <div className="stat-card hotel">
          <div className="stat-icon"><Hotel size={28} /></div>
          <div className="stat-content">
            <span className="stat-label">Hotel Check-ins</span>
            <span className="stat-value">{stats.hotel}</span>
          </div>
        </div>

        {/* Auditorium Card */}
        <div className="stat-card auditorium">
          <div className="stat-icon"><Building2 size={28} /></div>
          <div className="stat-content">
            <span className="stat-label">Event Auditorium</span>
            <span className="stat-value">{stats.auditorium}</span>
          </div>
        </div>

        {/* Visa Card */}
        <div className="stat-card visa">
          <div className="stat-icon"><Plane size={28} /></div>
          <div className="stat-content">
            <span className="stat-label">Visa Inquiry</span>
            <span className="stat-value">{stats.visa}</span>
          </div>
        </div>

        {/* Rental Card */}
        <div className="stat-card rental">
          <div className="stat-icon"><Package size={28} /></div>
          <div className="stat-content">
            <span className="stat-label">Rental Orders</span>
            <span className="stat-value">{stats.rental}</span>
          </div>
        </div>
      </div>

      {/* ... styles ... */}

      <style jsx>{`
        .weekly-overview {
          margin-bottom: var(--spacing-xl);
          animation: fadeIn 0.5s ease-out;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .section-header h2 {
          font-size: 1.25rem;
          color: var(--color-text-primary);
          margin: 0;
        }

        .date-range {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          background: var(--color-bg-secondary);
          padding: 4px 12px;
          border-radius: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--spacing-md);
        }

        .stat-card {
          background: var(--color-bg-card);
          padding: var(--spacing-lg);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid transparent;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .stat-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--color-bg-secondary);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.2;
        }

        /* Specific Colors */
        .stat-card.hotel:hover { border-color: #3b82f6; }
        .stat-card.hotel .stat-icon { background: #eff6ff; color: #3b82f6; }
        .stat-card.hotel .stat-value { color: #1d4ed8; }

        .stat-card.auditorium:hover { border-color: #8b5cf6; }
        .stat-card.auditorium .stat-icon { background: #f5f3ff; color: #8b5cf6; }
        .stat-card.auditorium .stat-value { color: #6d28d9; }

        .stat-card.visa:hover { border-color: #f59e0b; }
        .stat-card.visa .stat-icon { background: #fffbeb; color: #f59e0b; }
        .stat-card.visa .stat-value { color: #b45309; }

        .stat-card.rental:hover { border-color: #10b981; }
        .stat-card.rental .stat-icon { background: #ecfdf5; color: #10b981; }
        .stat-card.rental .stat-value { color: #047857; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div >
  )
}
