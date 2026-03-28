'use client'

import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, Smartphone, Globe } from 'lucide-react'
import Image from 'next/image'

export default function InstallGuide() {
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Platform detection
        const userAgent = window.navigator.userAgent.toLowerCase()
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios')
        } else if (/android/.test(userAgent)) {
            setPlatform('android')
        } else {
            setPlatform('desktop')
        }

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        // Listen for beforeinstallprompt (Chrome/Android/Desktop)
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            console.log('beforeinstallprompt triggered')
        }

        window.addEventListener('beforeinstallprompt', handler)
        
        // Cleanup
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsInstalled(true)
        }
    }

    if (isInstalled) {
        return (
            <div className="install-card-success animate-fadeIn">
                <div className="icon-circle success">
                    <Download size={32} />
                </div>
                <h2>Aplikasi Terinstal!</h2>
                <p>Terima kasih telah menginstal ERP Wisma Nusantara. Kamu bisa membukanya langsung dari layar utama HP kamu.</p>
                <div style={{ marginTop: '2rem' }}>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="btn btn-primary btn-large w-full"
                    >
                        Buka Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="install-container">
            <div className="brand-header animate-slideUp">
                <div className="logo-wrapper">
                    <Image src="/media/sticky-header.png" alt="Wisma Nusantara" width={100} height={100} className="brand-logo" />
                </div>
                <h1>Instal ERP Wisma</h1>
                <p>Akses cepat & stabil langsung dari layar utama HP kamu tanpa perlu buka browser.</p>
            </div>

            {platform === 'android' && (
                <div className="guide-card animate-slideUp" style={{ animationDelay: '100ms' }}>
                    <div className="card-header">
                        <Smartphone className="text-primary-color" />
                        <span>Pengguna Android</span>
                    </div>
                    
                    {deferredPrompt ? (
                        <div className="cta-section">
                            <button onClick={handleInstallClick} className="btn btn-primary btn-large w-full gap-3">
                                <Download size={20} />
                                Instal Sekarang
                            </button>
                            <p className="hint">Klik tombol di atas untuk proses instalasi otomatis.</p>
                        </div>
                    ) : (
                        <div className="steps-list">
                            <div className="step-item">
                                <div className="step-num">1</div>
                                <div className="step-content">
                                    <p>Klik ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas Chrome.</p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-num">2</div>
                                <div className="step-content">
                                    <p>Cari & pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar utama"</strong>.</p>
                                </div>
                            </div>
                            <div className="step-item">
                                <div className="step-num">3</div>
                                <div className="step-content">
                                    <p>Tunggu sebentar, aplikasi akan muncul di menu HP kamu.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {platform === 'ios' && (
                <div className="guide-card animate-slideUp" style={{ animationDelay: '100ms' }}>
                    <div className="card-header">
                        <Smartphone className="text-primary-color" />
                        <span>Pengguna iPhone / iOS</span>
                    </div>
                    
                    <div className="steps-list">
                        <div className="step-item">
                            <div className="step-num">1</div>
                            <div className="step-content">
                                <p>Klik ikon <strong>Bagikan (Share)</strong> <Share size={18} className="inline-icon" /> di bar bawah Safari.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-num">2</div>
                            <div className="step-content">
                                <p>Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama"</strong> <PlusSquare size={18} className="inline-icon" />.</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-num">3</div>
                            <div className="step-content">
                                <p>Klik <strong>"Tambah"</strong> di pojok kanan atas layar.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="ios-badge">
                        <Globe size={16} />
                        <span>Gunakan browser <strong>Safari</strong> untuk hasil terbaik</span>
                    </div>
                </div>
            )}

            {platform === 'desktop' && (
                <div className="guide-card animate-slideUp" style={{ animationDelay: '100ms' }}>
                    <div className="card-header">
                        <Globe className="text-primary-color" />
                        <span>Pengguna Desktop / Web</span>
                    </div>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>Untuk pengalaman terbaik, instalasi disarankan dilakukan melalui HP. Namun kamu juga bisa instal di Chrome Desktop:</p>
                    <div className="steps-list">
                        <div className="step-item">
                            <div className="step-num">1</div>
                            <div className="step-content">
                                <p>Klik ikon <strong>Instal</strong> <Download size={18} className="inline-icon" /> di bar alamat browser (kanan atas).</p>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-num">2</div>
                            <div className="step-content">
                                <p>Konfirmasi dengan klik <strong>"Instal"</strong> pada pop-up yang muncul.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .install-container {
                    max-width: 480px;
                    margin: 0 auto;
                    padding: 3rem 1.5rem;
                }

                .brand-header {
                    text-align: center;
                    margin-bottom: 3.5rem;
                }

                .logo-wrapper {
                    background: white;
                    width: 120px;
                    height: 120px;
                    border-radius: var(--radius-2xl);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    box-shadow: var(--shadow-lg);
                    padding: 0.5rem;
                }

                .brand-logo {
                    object-fit: contain;
                }

                .brand-header h1 {
                    font-size: 2.25rem;
                    margin-bottom: 0.75rem;
                    color: var(--color-primary);
                    font-family: var(--font-heading);
                }

                .brand-header p {
                    color: var(--color-text-secondary);
                    font-size: 1.125rem;
                    line-height: 1.5;
                }

                .guide-card {
                    background: var(--color-bg-card);
                    border-radius: var(--radius-2xl);
                    padding: 2.5rem 2rem;
                    box-shadow: var(--shadow-xl);
                    border: 1px solid rgba(139, 69, 19, 0.1);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    font-size: 1.25rem;
                    margin-bottom: 2rem;
                    padding-bottom: 1.25rem;
                    border-bottom: 1px solid var(--color-bg-secondary);
                    color: var(--color-text-primary);
                }

                .text-primary-color {
                    color: var(--color-primary);
                }

                .cta-section {
                    text-align: center;
                }

                .hint {
                    margin-top: 1.25rem;
                    font-size: 0.875rem;
                    color: var(--color-text-muted);
                }

                .steps-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.75rem;
                }

                .step-item {
                    display: flex;
                    gap: 1.25rem;
                    align-items: flex-start;
                }

                .step-num {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9375rem;
                    font-weight: 700;
                    flex-shrink: 0;
                    box-shadow: var(--shadow-sm);
                }

                .step-content p {
                    color: var(--color-text-primary);
                    font-size: 1.0625rem;
                    line-height: 1.5;
                }

                .inline-icon {
                    display: inline-block;
                    vertical-align: middle;
                    margin: 0 4px;
                    color: var(--color-primary);
                }

                .ios-badge {
                    margin-top: 2.5rem;
                    background: rgba(139, 69, 19, 0.05);
                    padding: 1rem;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                    border: 1px dashed rgba(139, 69, 19, 0.2);
                }

                .install-card-success {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: var(--color-bg-card);
                    border-radius: var(--radius-2xl);
                    box-shadow: var(--shadow-xl);
                    max-width: 420px;
                    margin: 4rem auto;
                }

                .icon-circle {
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 2.5rem;
                }

                .icon-circle.success {
                    background: var(--color-success-light);
                    color: var(--color-success);
                }

                .w-full { width: 100%; }
                .gap-3 { gap: 0.75rem; }
            `}</style>
        </div>
    )
}
