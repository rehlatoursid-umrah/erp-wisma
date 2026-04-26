'use client'

import { useState, useEffect } from 'react'
import { Menu, Banknote, Coins, Clock, Globe, Euro, CalendarDays } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick, balances }: HeaderProps & {
  balances?: {
    EGP: number
    USD: number
    IDR: number
    EUR: number
    monthLabel?: string
  }
}) {
  const [user, setUser] = useState<{ name: string; role: string; avatar?: any } | null>(null)
  const [time, setTime] = useState<string>('')
  const [internalBalances, setInternalBalances] = useState<{ EGP: number, USD: number, IDR: number, EUR: number, monthLabel?: string } | null>(null)

  // Fetch current user
  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setUser(data.user)
        }
      })
      .catch(console.error)
  }, [])

  // Use props if available, otherwise use internal state
  const displayBalances = balances || internalBalances

  useEffect(() => {
    // Hydration fix: only set time on client
    setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))

    const timerInterval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [])

  // Fetch balances if not provided via props (or to keep updated)
  useEffect(() => {
    if (balances) return

    const fetchBalances = async () => {
      try {
        const res = await fetch('/api/stats/balance')
        if (res.ok) {
          const data = await res.json()
          setInternalBalances(data)
        }
      } catch (e) {
        console.error('Failed to fetch header balances', e)
      }
    }

    fetchBalances()
    const balanceInterval = setInterval(fetchBalances, 10000)

    return () => clearInterval(balanceInterval)
  }, [balances])

  const tickerItems = [
    { icon: Globe, currency: 'USD', amount: displayBalances?.USD },
    { icon: Euro, currency: 'EUR', amount: displayBalances?.EUR },
    { icon: Banknote, currency: 'EGP', amount: displayBalances?.EGP },
    { icon: Coins, currency: 'IDR', amount: displayBalances?.IDR },
  ]

  return (
    <header className={cn(
      "flex items-center justify-between",
      "px-4 py-3 lg:px-6 lg:py-3",
      "bg-card dark:bg-card",
      "rounded-xl lg:rounded-xl",
      "mb-4 lg:mb-6",
      "shadow-sm dark:shadow-none dark:border dark:border-border",
      // Mobile: sticky header with safe area
      "max-lg:sticky max-lg:top-0 max-lg:z-50",
      "max-lg:-mx-4 max-lg:-mt-4 max-lg:mb-4",
      "max-lg:rounded-none max-lg:rounded-b-xl",
      "max-lg:shadow-md",
      "max-lg:pt-[max(env(safe-area-inset-top),0.75rem)]"
    )}>
      {/* Left Section: Menu + Ticker */}
      <div className="flex items-center gap-3 lg:gap-4 flex-1 overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-secondary dark:bg-secondary border-0 cursor-pointer flex-shrink-0 transition-colors hover:bg-secondary/80"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={22} className="text-foreground" />
        </button>

        {/* Ticker Bar */}
        <div className={cn(
          "flex items-center flex-1",
          "overflow-x-auto lg:overflow-x-visible",
          "scrollbar-hide",
          // Mobile: marquee mask effect
          "max-lg:overflow-hidden max-lg:relative",
          "max-lg:[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]",
        )}>
          <div className={cn(
            "flex items-center gap-2 lg:gap-3",
            // Mobile: marquee animation
            "max-lg:animate-[marquee_14s_linear_infinite] max-lg:w-max max-lg:pl-[100%]"
          )}>
            {/* Month Badge */}
            <div className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-primary bg-primary/[0.08] dark:bg-primary/20 border border-primary/15 dark:border-primary/30 px-2.5 py-1 rounded-full whitespace-nowrap">
              <CalendarDays size={13} />
              {displayBalances?.monthLabel || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>

            <span className="text-muted-foreground/30 text-sm select-none">|</span>

            {/* Currency Balances */}
            {tickerItems.map(({ icon: Icon, currency, amount }) => (
              <div
                key={currency}
                className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary dark:bg-muted px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors hover:bg-primary/[0.06] dark:hover:bg-primary/10"
              >
                <Icon size={14} className="text-muted-foreground/70" />
                <span className="text-[0.7rem] font-medium tracking-wider text-muted-foreground/60">{currency}</span>
                <strong className="text-sm font-bold text-foreground">{amount?.toLocaleString() || '0'}</strong>
              </div>
            ))}

            <span className="text-muted-foreground/30 text-sm select-none">|</span>

            {/* Clock */}
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary/[0.06] dark:bg-primary/15 px-2.5 py-1 rounded-lg whitespace-nowrap font-mono">
              <Clock size={14} />
              <span className="min-w-[72px] inline-block tabular-nums">{time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Theme Toggle + User Profile */}
      <div className="flex items-center gap-2 lg:gap-3 ml-3 lg:ml-4 flex-shrink-0">
        {/* Theme Toggle — Desktop Only */}
        <div className="hidden lg:block">
          <ModeToggle />
        </div>

        {/* User Profile — Desktop Only */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-foreground">{user?.name || 'Loading...'}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role || '...'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-base overflow-hidden flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar.url || user.avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
            )}
          </div>
        </div>

        {/* Mobile Theme Toggle */}
        <div className="lg:hidden">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
