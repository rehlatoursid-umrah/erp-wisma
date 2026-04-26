'use client'

import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Hotel,
  Building2,
  Plane,
  Package
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WeeklyStats {
  hotel: number
  auditorium: number
  visa: number
  rental: number
}

interface WeeklyOverviewProps {
  refreshTrigger?: number
}

const statCards = [
  { key: 'hotel' as const, icon: Hotel, label: 'Hotel Check-ins', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  { key: 'auditorium' as const, icon: Building2, label: 'Event Auditorium Check-ins', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  { key: 'visa' as const, icon: Plane, label: 'Visa Inquiry', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  { key: 'rental' as const, icon: Package, label: 'Rental Orders', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
]

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
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2 text-foreground font-heading">
          <CalendarDays size={22} className="text-primary" />
          Overview Minggu Ini
        </h2>
        <span className="text-xs lg:text-sm text-muted-foreground bg-muted/60 dark:bg-muted px-3 py-1 rounded-full">
          {dateRange}
        </span>
      </div>

      {/* Mobile User Profile Card */}
      <div className="lg:hidden">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0 ring-2 ring-white/30">
                {user?.avatar ? (
                  <img src={user.avatar.url || user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{user?.name || 'Loading...'}</h3>
                <p className="text-sm text-white/70 capitalize">{user?.role || '...'}</p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-3 text-center">
                {[
                  { val: stats.hotel, label: 'Hotel' },
                  { val: stats.auditorium, label: 'Event' },
                  { val: stats.visa, label: 'Visa' },
                  { val: stats.rental, label: 'Rental' },
                ].map((s) => (
                  <div key={s.label}>
                    <strong className="text-lg block leading-tight">{s.val}</strong>
                    <span className="text-[0.65rem] text-white/60">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        {statCards.map(({ key, icon: Icon, label, color, bg }) => (
          <Card
            key={key}
            className={cn(
              "transition-all duration-300 cursor-pointer border border-transparent group",
              "hover:-translate-y-1 hover:shadow-md hover:border-primary/15"
            )}
          >
            <CardContent className="flex items-center gap-3 lg:gap-4 p-3 lg:p-5">
              <div className={cn("p-2 lg:p-3 rounded-xl transition-transform duration-300 group-hover:scale-110", bg)}>
                <Icon size={22} className={color} />
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-bold text-primary leading-none">
                  {stats[key]}
                </div>
                <div className="text-xs lg:text-sm text-muted-foreground mt-0.5 leading-tight">
                  {label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
