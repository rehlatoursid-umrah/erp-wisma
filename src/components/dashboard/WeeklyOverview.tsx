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
  const [user, setUser] = useState<{ name: string; role: string; email: string; avatar?: any } | null>(null)

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

      // Fetch user data for mobile profile card
      const userRes = await fetch('/api/users/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        if (userData?.user) setUser(userData.user)
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

      {/* Mobile User Profile Card */}
      <div className="mobile-user-card">
        <div className="mobile-user-avatar">
          {user?.avatar ? (
            <img src={user.avatar.url || user.avatar} alt={user?.name} />
          ) : (
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
          )}
        </div>
        <div className="mobile-user-info">
          <h3>{user?.name || 'Loading...'}</h3>
          <p className="role">{user?.role || 'User'}</p>
          <p className="email">{user?.email || ''}</p>
        </div>
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
            <span className="stat-label">Event Auditorium Check-ins</span>
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

        .mobile-user-card {
          display: none;
        }

        @media (max-width: 768px) {
          .stats-grid {
            display: none !important; /* Hide stats grid per user request */
          }
          
          .mobile-user-card {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            background: var(--color-bg-card);
            padding: var(--spacing-lg);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-sm);
            margin-bottom: var(--spacing-md);
            border: 1px solid var(--color-bg-secondary);
          }

          .mobile-user-avatar {
            width: 60px;
            height: 60px;
            border-radius: var(--radius-full);
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            font-weight: 600;
            flex-shrink: 0;
            overflow: hidden;
          }

          .mobile-user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .mobile-user-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .mobile-user-info h3 {
            margin: 0;
            font-size: 1.1rem;
            line-height: 1.2;
            color: var(--color-text-primary);
          }

          .mobile-user-info .role {
            margin: 0;
            font-size: 0.85rem;
            color: var(--color-primary);
            font-weight: 500;
            text-transform: capitalize;
          }

          .mobile-user-info .email {
            margin: 0;
            font-size: 0.8rem;
            color: var(--color-text-muted);
          }
        }
      `}</style>
    </div >
  )
}
