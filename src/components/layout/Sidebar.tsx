'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const navItems = [
    {
        section: 'Main',
        items: [
            { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
        ]
    },
    {
        section: 'Portal Divisi',
        items: [
            { href: '/portal/bendahara', icon: '🛡️', label: 'Bendahara', locked: true },
            { href: '/portal/bpupd', icon: '✈️', label: 'BPUPD' },
            { href: '/portal/bppg', icon: '🛠️', label: 'BPPG' },
            { href: '/portal/sekretaris', icon: '🗄️', label: 'Sekretaris' },
            { href: '/portal/direktur', icon: '👔', label: 'Direktur' },
        ]
    },
    {
        section: 'Data',
        items: [
            { href: '/transactions', icon: '📊', label: 'Transaksi' },
            { href: '/reports', icon: '📈', label: 'Laporan' },
        ]
    },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-icon">🏛️</div>
                    <div>
                        <h2>WIN-OS</h2>
                        <p className="logo-subtitle">Wisma Nusantara</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((section, sIdx) => (
                        <div key={sIdx}>
                            <p className="nav-section-title">{section.section}</p>
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                    {item.locked && <span className="nav-lock">🔒</span>}
                                </Link>
                            ))}
                            {sIdx < navItems.length - 1 && <div className="nav-divider" />}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <Link href="/settings" className="nav-item">
                        <span className="nav-icon">⚙️</span>
                        <span>Pengaturan</span>
                    </Link>
                    <button className="nav-item logout-btn">
                        <span className="nav-icon">🚪</span>
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            <style jsx>{`
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: var(--color-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .logo-subtitle {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .nav-icon {
          font-size: 1.25rem;
          width: 24px;
          text-align: center;
        }

        .nav-lock {
          margin-left: auto;
          font-size: 0.75rem;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(254, 252, 249, 0.1);
        }

        .logout-btn {
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
        }

        @media (max-width: 768px) {
          .sidebar-overlay.open {
            display: block;
          }
        }
      `}</style>
        </>
    )
}
