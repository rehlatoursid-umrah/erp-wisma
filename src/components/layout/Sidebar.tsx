'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
    Home,
    Shield,
    Plane,
    Wrench,
    FileText,
    Briefcase,
    BarChart3,
    LineChart,
    ClipboardList,
    MessageSquare,
    Settings,
    LogOut,
    Building2,
    Lock,
    X
} from 'lucide-react'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const navItems = [
    {
        section: 'Main',
        items: [
            { href: '/dashboard', icon: Home, label: 'Dashboard' },
        ]
    },
    {
        section: 'Portal Divisi',
        items: [
            { href: '/portal/bendahara', icon: Shield, label: 'Bendahara', locked: true },
            { href: '/portal/bpupd', icon: Plane, label: 'BPUPD' },
            { href: '/portal/bppg', icon: Wrench, label: 'BPPG' },
            { href: '/portal/sekretaris', icon: FileText, label: 'Sekretaris' },
            { href: '/portal/direktur', icon: Briefcase, label: 'Direktur' },
        ]
    },
    {
        section: 'Data',
        items: [
            { href: '/transactions', icon: BarChart3, label: 'Transaksi' },
            { href: '/reports', icon: LineChart, label: 'Laporan' },
            { href: '/laporan-piket', icon: ClipboardList, label: 'Laporan Piket' },
            { href: '/daily-reminder', icon: MessageSquare, label: 'Daily Reminder' },
        ]
    },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await fetch('/api/users/logout', { method: 'POST' })
            router.push('/')
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon-image">
                            <Image src="/media/header.png" alt="Logo" width={40} height={40} className="sidebar-logo-img" />
                        </div>
                        <div className="sidebar-brand-text">
                            <h2>Operational System<br />Wisma Nusantara Cairo</h2>
                        </div>
                    </div>
                    <button className="mobile-close-btn" onClick={onClose} aria-label="Tutup menu">
                        <X size={24} color="var(--color-text-light)" />
                    </button>
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
                                    <span className="nav-icon">
                                        <item.icon size={20} color="white" />
                                    </span>
                                    <span>{item.label}</span>
                                    {item.locked && <span className="nav-lock"><Lock size={12} /></span>}
                                </Link>
                            ))}
                            {sIdx < navItems.length - 1 && <div className="nav-divider" />}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <Link href="/settings" className="nav-item">
                        <span className="nav-icon"><Settings size={20} color="white" /></span>
                        <span>Pengaturan</span>
                    </Link>
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <span className="nav-icon"><LogOut size={20} color="white" /></span>
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>


        </>
    )
}
