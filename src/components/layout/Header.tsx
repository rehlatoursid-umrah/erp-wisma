'use client'

import { useState, useEffect } from 'react'
import { Menu, Banknote, Coins, Clock, Globe, Euro } from 'lucide-react'

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
    if (balances) return // If controlled by parent, don't fetch internally? 
    // Actually user wants "always active" so maybe just fetch anyway for other pages?
    // If on Dashboard, Dashboard passes props. If on BPUPD, it does NOT pass props.
    // So this effect will run on BPUPD.

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

    fetchBalances() // Initial fetch
    const balanceInterval = setInterval(fetchBalances, 10000) // Poll every 10s

    return () => clearInterval(balanceInterval)
  }, [balances])

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="header-ticker">
          <div className="ticker-wrapper">
            {/* Month Label Badge */}
            <div className="ticker-month-badge">
              📅 {displayBalances?.monthLabel || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </div>

            <div className="ticker-divider">|</div>

            {/* USD Balance */}
            <div className="ticker-item">
              <Globe size={15} />
              <span className="ticker-currency">USD</span>
              <strong className="ticker-amount">{displayBalances?.USD?.toLocaleString() || '0'}</strong>
            </div>
            {/* EUR Balance */}
            <div className="ticker-item">
              <Euro size={15} />
              <span className="ticker-currency">EUR</span>
              <strong className="ticker-amount">{displayBalances?.EUR?.toLocaleString() || '0'}</strong>
            </div>
            {/* EGP Balance */}
            <div className="ticker-item">
              <Banknote size={15} />
              <span className="ticker-currency">EGP</span>
              <strong className="ticker-amount">{displayBalances?.EGP?.toLocaleString() || '0'}</strong>
            </div>
            {/* IDR Balance */}
            <div className="ticker-item">
              <Coins size={15} />
              <span className="ticker-currency">IDR</span>
              <strong className="ticker-amount">{displayBalances?.IDR?.toLocaleString() || '0'}</strong>
            </div>

            <div className="ticker-divider">|</div>

            {/* Clock */}
            <div className="ticker-item clock">
              <Clock size={15} />
              <span style={{ minWidth: '80px', display: 'inline-block' }}>{time}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="user-profile">
        <div className="user-info">
          <div className="user-name">{user?.name || 'Loading...'}</div>
          <div className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role || '...'}</div>
        </div>
        <div className="user-avatar">
          {user?.avatar ? (
            <img src={user.avatar.url || user.avatar} alt={user?.name} />
          ) : (
            <span>{user?.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          margin-bottom: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          flex: 1;
          overflow: hidden; /* Prevent overflow on small screens */
        }

        .menu-btn {
          display: none;
          width: 40px;
          height: 40px;
          border: none;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 1.25rem;
        }

        .header-ticker {
          display: flex;
          align-items: center;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
          flex: 1;
        }

        .header-ticker::-webkit-scrollbar {
          display: none;
        }
        
        .ticker-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .ticker-month-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--color-primary);
          background: rgba(139, 69, 19, 0.08);
          border: 1px solid rgba(139, 69, 19, 0.15);
          padding: 3px 10px;
          border-radius: 20px;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          white-space: nowrap;
          background: var(--color-bg-secondary);
          padding: 4px 10px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .ticker-item:hover {
          background: rgba(139, 69, 19, 0.06);
        }

        .ticker-currency {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        .ticker-amount {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .ticker-divider {
            color: var(--color-text-muted);
            opacity: 0.3;
            font-size: 1rem;
            padding: 0 2px;
        }

        .clock {
            font-family: monospace;
            font-weight: 600;
            color: var(--color-primary);
            background: rgba(139, 69, 19, 0.06) !important;
        }

        .status-ok {
          color: var(--color-success);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-left: var(--spacing-lg);
          flex-shrink: 0;
        }

        .user-info {
          text-align: right;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .user-role {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.125rem;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .header {
             padding: var(--spacing-sm) var(--spacing-md);
             gap: var(--spacing-sm);
             position: sticky;
             top: 0;
             z-index: 50;
             margin: -var(--spacing-md) -var(--spacing-md) var(--spacing-lg) -var(--spacing-md);
             border-radius: 0 0 var(--radius-xl) var(--radius-xl);
             box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
             padding-top: max(env(safe-area-inset-top), var(--spacing-sm)); /* Safe area offset */
          }

          .header-left {
             gap: var(--spacing-md);
          }

          .menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .header-ticker {
            overflow: hidden;
            position: relative;
            flex: 1;
            padding-bottom: 0px; 
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          }
          
          .ticker-wrapper {
            animation: marquee 12s linear infinite;
            width: max-content;
            padding-left: 100%; /* Start off-screen */
          }
          
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }

          .user-profile {
            display: none !important; /* Hide completely on mobile */
          }
        }
      `}</style>
    </header>
  )
}
