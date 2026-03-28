import InstallGuide from '@/components/pwa/InstallGuide'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Instal Aplikasi ERP Wisma',
    description: 'Panduan instalasi aplikasi ERP Wisma Nusantara di perangkat mobile kamu.',
}

export default function InstallPage() {
    return (
        <main className="min-h-screen bg-bg-primary">
            <InstallGuide />
            
            <div className="install-footer">
                <p>&copy; {new Date().getFullYear()} Wisma Nusantara Cairo. All Rights Reserved.</p>
            </div>

            <style jsx>{`
                .install-footer {
                    text-align: center;
                    padding: 2rem;
                    color: var(--color-text-muted);
                    font-size: 0.8125rem;
                }
                
                main {
                    background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
                }
            `}</style>
        </main>
    )
}
