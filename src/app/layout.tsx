import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
})

export const metadata: Metadata = {
    title: 'Wisma Nusantara ERP',
    description: 'Sistem operasional terpadu Wisma Nusantara',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Wisma Nusantara',
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/icons/icon-192x192.png',
    },
}

export const viewport = {
    themeColor: '#8b4513',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="id" className={`${inter.variable} ${outfit.variable}`}>
            <body>{children}</body>
        </html>
    )
}
