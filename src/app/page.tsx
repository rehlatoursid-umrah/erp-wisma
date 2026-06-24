'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorVisible, setErrorVisible] = useState(false)

  // Auto-hide error toast
  useEffect(() => {
    if (error) {
      setErrorVisible(true)
      const timer = setTimeout(() => {
        setErrorVisible(false)
        setTimeout(() => setError(null), 300)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.user?.role === 'pengawas') {
          router.push('/dashboard/proker-rapat')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError('Email atau password salah!')
        setIsLoading(false)
      }
    } catch {
      setError('Terjadi kesalahan koneksi.')
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Import the requested Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        body {
          font-family: "Plus Jakarta Sans", sans-serif;
          color: var(--ink, #2B2018);
          min-height: 100dvh;
          background: var(--cream, #F6EEE2);
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
      `}</style>
      
      <div className={styles.grain}></div>

      <div className={styles.shell}>
        {/* BRAND (left) */}
        <section className={styles.brand}>
          <span className={styles.lattice}></span>
          <span className={styles.glow}></span>

          <div className={styles.brandTop}>
            <span className={styles.logo} aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" stroke="#3B2316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 22 24 8l17 14" /><path d="M11 20v18h26V20" /><path d="M20 38V28h8v10" />
                <circle cx="36" cy="13" r="2.4" fill="#C2622E" stroke="none" />
              </svg>
            </span>
            <span className={styles.wordmark}>Wisma Nusantara · ERP</span>
          </div>

          <div className={styles.brandMid}>
            <h1 className={styles.brandTitle}>Wisma Nusantara <span className={styles.accent}>Cairo</span></h1>
            <p className={styles.lead}>Operational System — platform manajemen terpadu untuk hunian, keuangan, dan operasional harian.</p>
            <p className={styles.leadSm}>Operational System · manajemen operasional terpadu.</p>
            <div className={styles.badges}>
              <span className={styles.badge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
                End-to-End Secure
              </span>
              <span className={styles.badgeDivider}></span>
              <span className={styles.badge}><span className={styles.live}></span> System Online</span>
            </div>
          </div>

          <div className={styles.brandFoot}>© 2026 Wisma Nusantara · Kairo, Mesir 🇪🇬</div>
        </section>

        {/* FORM (right) */}
        <section className={styles.pane}>
          <div className={styles.paneTop}>
            <Link href="#" className={styles.chip}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" /></svg> ID</Link>
            <Link href="#" className={styles.chip}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg> Bantuan</Link>
          </div>

          <div className={styles.formCenter}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <span className={styles.eyebrow}>Selamat Datang Kembali</span>
              <h2 className={styles.formTitle}>Masuk</h2>
              <p className={styles.hello}>Silakan masuk untuk mengakses dasbor operasional.</p>

              <div className={styles.field}>
                <label htmlFor="email" className={styles.fieldLabel}>Email</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg></span>
                  <input
                    id="email"
                    type="email"
                    className={styles.fieldInput}
                    placeholder="nama@wisma.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.fieldLabel}>Password</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg></span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.fieldInput}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 004.2 4.2"/><path d="M9.4 5.2A9.6 9.6 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.3 6.3A17 17 0 002 12s3.5 7 10 7a9.3 9.3 0 004.3-1"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.rowExtra}><Link href="#">Lupa password?</Link></div>

              <button type="submit" className={styles.btnPrimary} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className={styles.spinner} style={{ width: 19, height: 19, borderWidth: 2 }} />
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></svg>
                    Masuk
                  </>
                )}
              </button>

              <div className={styles.divider}>atau masuk dengan</div>

              <button type="button" className={styles.btnGoogle}>
                <svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" /></svg>
                Masuk dengan Google
              </button>

              <p className={styles.help}>Butuh bantuan? <Link href="#">Hubungi Admin</Link></p>
            </form>
          </div>
        </section>
      </div>

      {/* ERROR TOAST */}
      {error && (
        <div className={`${styles.errorToast} ${!errorVisible ? styles.errorToastHide : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* LOADING OVERLAY (Full Screen) */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Membuat sesi pengguna...</p>
          </div>
        </div>
      )}
    </>
  )
}
