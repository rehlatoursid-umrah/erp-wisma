'use client'

import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import LaporanPiketForm from '@/components/forms/LaporanPiketForm'
import { useState } from 'react'
import { ClipboardList } from 'lucide-react'

export default function LaporanPiketPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <ClipboardList size={28} /> Laporan Piket Kantor
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Formulir laporan harian petugas piket kantor Wisma Nusantara Cairo
                    </p>
                </div>

                <LaporanPiketForm />
            </main>
        </>
    )
}
