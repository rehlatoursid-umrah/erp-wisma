import InstallGuide from '@/components/pwa/InstallGuide'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Instal Aplikasi ERP Wisma',
    description: 'Panduan instalasi aplikasi ERP Wisma Nusantara di perangkat mobile kamu.',
}

export default function InstallPage() {
    return (
        <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)' }}>
            <InstallGuide />
            
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                <p>&copy; {new Date().getFullYear()} Wisma Nusantara Cairo. All Rights Reserved.</p>
            </div>
        </main>
    )
}
