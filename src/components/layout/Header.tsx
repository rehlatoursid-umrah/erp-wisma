'use client'

import { useState, useEffect } from 'react'
import { Menu, Banknote, Coins, Clock, Globe } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick, balances }: HeaderProps & {
  balances?: {
    EGP: number
    USD: number
    IDR: number
  }
}) {
  // Mock data - akan diganti dengan data real
  const user = {
    name: 'Ahmad Fauzi',
    role: 'Staff Piket',
    avatar: null,
  }

  const [time, setTime] = useState<string>('')
  const [internalBalances, setInternalBalances] = useState<{ EGP: number, USD: number, IDR: number } | null>(null)

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
          {/* USD Balance */}
          <div className="ticker-item">
            <Globe size={16} />
            <span>USD: <strong>{displayBalances?.USD?.toLocaleString() || '0'}</strong></span>
          </div>
          {/* EGP Balance */}
          <div className="ticker-item">
            <Banknote size={16} />
            <span>EGP: <strong>{displayBalances?.EGP?.toLocaleString() || '0'}</strong></span>
          </div>
          {/* IDR Balance */}
          <div className="ticker-item">
            <Coins size={16} />
            <span>IDR: <strong>{displayBalances?.IDR?.toLocaleString() || '0'}</strong></span>
          </div>

          <div className="ticker-divider">|</div>

          {/* Clock */}
          <div className="ticker-item clock">
            <Clock size={16} />
            <span style={{ minWidth: '80px', display: 'inline-block' }}>{time}</span>
          </div>
        </div>
      </div>

      <div className="user-profile">
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-role">{user.role}</div>
        </div>
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user.name.charAt(0)}</span>
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
          gap: var(--spacing-lg);
          align-items: center;
          overflow-x: auto; /* Allow horizontal scroll if needed */
          padding-bottom: 4px; /* Space for scrollbar */
          scrollbar-width: none; /* Hide scrollbar Firefox */
        }

        .header-ticker::-webkit-scrollbar {
          display: none; /* Hide scrollbar Chrome/Safari */
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          white-space: nowrap;
        }

        .ticker-divider {
            color: var(--color-text-muted);
            opacity: 0.5;
            font-size: 1.2rem;
        }

        .clock {
            font-family: monospace;
            font-weight: 600;
            color: var(--color-primary);
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
          .menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-ticker {
            display: none; /* Hide ticker on very small screens or make it scrollable */
          }
        }
      `}</style>
    </header>
  )
}
