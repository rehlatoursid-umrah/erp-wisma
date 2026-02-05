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
    title: 'WIN-OS | Wisma Nusantara Integrated Operation System',
    description: 'Sistem operasional terpadu untuk Wisma Nusantara Cairo',
    icons: {
        icon: '/favicon.ico',
    },
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
