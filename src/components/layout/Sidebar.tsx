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
    Lock,
    X
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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

/** Navigation content shared between desktop sidebar and mobile sheet */
function NavContent({ pathname, onNavClick }: { pathname: string; onNavClick?: () => void }) {
    return (
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-hide pr-1">
            {navItems.map((section, sIdx) => (
                <div key={sIdx}>
                    <p className="px-3 py-2 text-[0.7rem] uppercase tracking-wider font-semibold text-white/40">
                        {section.section}
                    </p>
                    {section.items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavClick}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all duration-200 min-h-[44px] border border-transparent",
                                pathname === item.href
                                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-sm border-white/10 font-medium"
                                    : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
                            )}
                        >
                            <span className="flex justify-center w-6">
                                <item.icon size={20} className="text-current" />
                            </span>
                            <span>{item.label}</span>
                            {item.locked && (
                                <span className="ml-auto flex items-center text-xs">
                                    <Lock size={12} />
                                </span>
                            )}
                        </Link>
                    ))}
                    {sIdx < navItems.length - 1 && (
                        <Separator className="my-3 bg-white/[0.08]" />
                    )}
                </div>
            ))}
        </nav>
    )
}

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

    const FooterNav = () => (
        <div className="mt-auto pt-4 border-t border-white/[0.08] flex flex-col gap-1">
            <Link
                href="/settings"
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all duration-200 min-h-[44px]",
                    pathname === '/settings'
                        ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-sm font-medium"
                        : "text-white/50 hover:bg-white/[0.05] hover:text-white/90"
                )}
            >
                <span className="flex justify-center w-6">
                    <Settings size={20} className="text-current" />
                </span>
                <span>Pengaturan</span>
            </Link>
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm transition-all duration-200 min-h-[44px] text-white/50 hover:bg-red-500/10 hover:text-red-400 w-full text-left border-0 bg-transparent cursor-pointer"
            >
                <span className="flex justify-center w-6">
                    <LogOut size={20} className="text-current" />
                </span>
                <span>Keluar</span>
            </button>
        </div>
    )

    const LogoSection = () => (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                <Image src="/media/header.png" alt="Logo" width={40} height={40} className="object-contain" />
            </div>
            <div>
                <h2 className="text-[0.85rem] font-semibold leading-tight text-white/90">
                    Operational System<br />Wisma Nusantara Cairo
                </h2>
            </div>
        </div>
    )

    return (
        <>
            {/* ═══ DESKTOP SIDEBAR ═══ */}
            <aside className="hidden lg:flex w-[280px] h-screen fixed inset-y-0 left-0 bg-[#1A1612] dark:bg-[#0C0A09] p-6 flex-col z-[100] border-r border-white/[0.03]">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-5 mb-5 flex-shrink-0">
                    <LogoSection />
                </div>

                {/* Navigation */}
                <NavContent pathname={pathname} />

                {/* Footer */}
                <FooterNav />
            </aside>

            {/* ═══ MOBILE SHEET ═══ */}
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent
                    side="left"
                    className="w-[300px] p-0 bg-[#1A1612] dark:bg-[#0C0A09] border-r border-white/[0.03] [&>button]:text-white/50 [&>button]:hover:text-white"
                >
                    <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
                        <SheetTitle className="text-left">
                            <LogoSection />
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col flex-1 h-[calc(100vh-100px)] px-4 py-4">
                        <NavContent pathname={pathname} onNavClick={onClose} />
                        <FooterNav />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
