'use client'

import { useState, useEffect } from 'react'
import { Download, Share, PlusSquare, Smartphone, Globe } from 'lucide-react'
import Image from 'next/image'
import styles from './InstallGuide.module.css'

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
            <div className={`${styles.installCardSuccess} animate-fadeIn`}>
                <div className={`${styles.iconCircle} ${styles.iconCircleSuccess}`}>
                    <Download size={32} />
                </div>
                <h2>Aplikasi Terinstal!</h2>
                <p>Terima kasih telah menginstal ERP Wisma Nusantara. Kamu bisa membukanya langsung dari layar utama HP kamu.</p>
                <div style={{ marginTop: '2rem' }}>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className={`btn btn-primary btn-large ${styles.wFull}`}
                    >
                        Buka Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.installContainer}>
            <div className={`${styles.brandHeader} animate-slideUp`}>
                <div className={styles.logoWrapper}>
                    <Image src="/media/sticky-header.png" alt="Wisma Nusantara" width={100} height={100} className={styles.brandLogo} />
                </div>
                <h1 className={styles.brandHeaderTitle}>Instal ERP Wisma</h1>
                <p className={styles.brandHeaderDesc}>Akses cepat &amp; stabil langsung dari layar utama HP kamu tanpa perlu buka browser.</p>
            </div>

            {platform === 'android' && (
                <div className={`${styles.guideCard} animate-slideUp`} style={{ animationDelay: '100ms' }}>
                    <div className={styles.cardHeader}>
                        <Smartphone className={styles.textPrimaryColor} />
                        <span>Pengguna Android</span>
                    </div>
                    
                    {deferredPrompt ? (
                        <div className={styles.ctaSection}>
                            <button onClick={handleInstallClick} className={`btn btn-primary btn-large ${styles.wFull} ${styles.gap3}`}>
                                <Download size={20} />
                                Instal Sekarang
                            </button>
                            <p className={styles.hint}>Klik tombol di atas untuk proses instalasi otomatis.</p>
                        </div>
                    ) : (
                        <div className={styles.stepsList}>
                            <div className={styles.stepItem}>
                                <div className={styles.stepNum}>1</div>
                                <div>
                                    <p className={styles.stepContentText}>Klik ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas Chrome.</p>
                                </div>
                            </div>
                            <div className={styles.stepItem}>
                                <div className={styles.stepNum}>2</div>
                                <div>
                                    <p className={styles.stepContentText}>Cari &amp; pilih <strong>&quot;Instal aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar utama&quot;</strong>.</p>
                                </div>
                            </div>
                            <div className={styles.stepItem}>
                                <div className={styles.stepNum}>3</div>
                                <div>
                                    <p className={styles.stepContentText}>Tunggu sebentar, aplikasi akan muncul di menu HP kamu.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {platform === 'ios' && (
                <div className={`${styles.guideCard} animate-slideUp`} style={{ animationDelay: '100ms' }}>
                    <div className={styles.cardHeader}>
                        <Smartphone className={styles.textPrimaryColor} />
                        <span>Pengguna iPhone / iOS</span>
                    </div>
                    
                    <div className={styles.stepsList}>
                        <div className={styles.stepItem}>
                            <div className={styles.stepNum}>1</div>
                            <div>
                                <p className={styles.stepContentText}>Klik ikon <strong>Bagikan (Share)</strong> <Share size={18} className={styles.inlineIcon} /> di bar bawah Safari.</p>
                            </div>
                        </div>
                        <div className={styles.stepItem}>
                            <div className={styles.stepNum}>2</div>
                            <div>
                                <p className={styles.stepContentText}>Gulir ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong> <PlusSquare size={18} className={styles.inlineIcon} />.</p>
                            </div>
                        </div>
                        <div className={styles.stepItem}>
                            <div className={styles.stepNum}>3</div>
                            <div>
                                <p className={styles.stepContentText}>Klik <strong>&quot;Tambah&quot;</strong> di pojok kanan atas layar.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.iosBadge}>
                        <Globe size={16} />
                        <span>Gunakan browser <strong>Safari</strong> untuk hasil terbaik</span>
                    </div>
                </div>
            )}

            {platform === 'desktop' && (
                <div className={`${styles.guideCard} animate-slideUp`} style={{ animationDelay: '100ms' }}>
                    <div className={styles.cardHeader}>
                        <Globe className={styles.textPrimaryColor} />
                        <span>Pengguna Desktop / Web</span>
                    </div>
                    <p className={styles.desktopNote}>Untuk pengalaman terbaik, instalasi disarankan dilakukan melalui HP. Namun kamu juga bisa instal di Chrome Desktop:</p>
                    <div className={styles.stepsList}>
                        <div className={styles.stepItem}>
                            <div className={styles.stepNum}>1</div>
                            <div>
                                <p className={styles.stepContentText}>Klik ikon <strong>Instal</strong> <Download size={18} className={styles.inlineIcon} /> di bar alamat browser (kanan atas).</p>
                            </div>
                        </div>
                        <div className={styles.stepItem}>
                            <div className={styles.stepNum}>2</div>
                            <div>
                                <p className={styles.stepContentText}>Konfirmasi dengan klik <strong>&quot;Instal&quot;</strong> pada pop-up yang muncul.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
