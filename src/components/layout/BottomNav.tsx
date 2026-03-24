'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarClock, ReceiptText, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/portal/sekretaris', label: 'Booking', icon: CalendarClock },
    { href: '/transactions', label: 'Invoice', icon: ReceiptText },
    { href: '/settings', label: 'Menu', icon: User },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
            <div className="icon-wrapper">
              <item.icon size={22} className="nav-icon" strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="nav-label">{item.label}</span>
          </Link>
        )
      })}

      <style jsx>{`
        .bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .bottom-nav {
            display: flex;
            justify-content: space-around;
            align-items: center;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 65px;
            background: rgba(30, 30, 30, 0.85); /* Glassmorphism background */
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            z-index: 100;
            padding-bottom: env(safe-area-inset-bottom);
          }

          .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: var(--color-text-muted);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
            -webkit-tap-highlight-color: transparent;
          }

          .nav-item:active {
            transform: scale(0.92);
          }

          .nav-item.active {
            color: var(--color-primary);
          }

          .icon-wrapper {
            position: relative;
            margin-bottom: 4px;
            transition: transform 0.2s;
          }

          .nav-item.active .icon-wrapper {
            transform: translateY(-2px);
          }

          .nav-label {
            font-size: 0.65rem;
            font-weight: 500;
          }
        }
      `}</style>
    </nav>
  )
}
