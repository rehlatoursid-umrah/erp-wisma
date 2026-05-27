'use client'

import { useState, useEffect } from 'react'
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
    X,
    KanbanSquare,
    BookOpen,
    ChefHat,
    Package
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

interface NavItem {
    href: string
    icon: any
    label: string
    locked?: boolean
    /** If defined, only these roles can see this item. If undefined, visible to all (except pengawas). */
    roles?: string[]
}

interface NavSection {
    section: string
    items: NavItem[]
}

const navItems: NavSection[] = [
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
            { href: '/portal/dapur', icon: ChefHat, label: 'Dapur' },
            { href: '/portal/pmik', icon: BookOpen, label: 'PMIK' },
            { href: '/portal/sekretaris', icon: FileText, label: 'Sekretaris' },
            { href: '/portal/direktur', icon: Briefcase, label: 'Direktur' },
        ]
    },
    {
        section: 'Data',
        items: [
            { href: '/laporan-piket', icon: ClipboardList, label: 'Laporan Piket' },
            { href: '/daily-reminder', icon: MessageSquare, label: 'Daily Reminder' },
        ]
    },
    {
        section: 'Manajemen',
        items: [
            { href: '/dashboard/proker-rapat', icon: KanbanSquare, label: 'Rapat Proker', roles: ['all'] },
            { href: '/dashboard/inventaris', icon: Package, label: 'Inventaris Aset', roles: ['all'] },
        ]
    },
]

/** Roles that have restricted sidebar access */
const RESTRICTED_ROLES: Record<string, string[]> = {
    pengawas: ['/dashboard/proker-rapat', '/dashboard/inventaris'],
}

/** Filter nav items based on user role */
function getFilteredNavItems(role?: string): NavSection[] {
    // Return empty array while loading to prevent flashing unrestricted items
    if (role === undefined) return []

    // If there is no role (unlikely after loading) or it's a role not in RESTRICTED_ROLES, show everything
    const allowedPaths = RESTRICTED_ROLES[role]
    if (!allowedPaths) return navItems

    // For restricted roles, only show items whose href is in the allowedPaths
    return navItems
        .map(section => ({
            ...section,
            items: section.items.filter(item => allowedPaths.includes(item.href)),
        }))
        .filter(section => section.items.length > 0)
}

/** Navigation content shared between desktop sidebar and mobile sheet */
function NavContent({ pathname, onNavClick, userRole }: { pathname: string; onNavClick?: () => void; userRole?: string }) {
    const filteredNav = getFilteredNavItems(userRole)

    return (
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-hide pr-1">
            {filteredNav.map((section, sIdx) => (
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
                    {sIdx < filteredNav.length - 1 && (
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
    const [userRole, setUserRole] = useState<string | undefined>(undefined)

    // Fetch current user role for sidebar filtering and route guarding
    useEffect(() => {
        fetch('/api/users/me')
            .then(res => res.json())
            .then(data => {
                if (data?.user?.role) {
                    const role = data.user.role
                    setUserRole(role)

                    // Client-side route guard for restricted roles
                    const allowedPaths = RESTRICTED_ROLES[role]
                    if (allowedPaths) {
                        const isAllowed = allowedPaths.some(p => pathname.startsWith(p)) || pathname === '/settings'
                        if (!isAllowed) {
                            router.replace(allowedPaths[0])
                        }
                    }
                }
            })
            .catch(console.error)
    }, [pathname, router])

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
                <NavContent pathname={pathname} userRole={userRole} />

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
                        <NavContent pathname={pathname} onNavClick={onClose} userRole={userRole} />
                        <FooterNav />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
