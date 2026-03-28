'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Smartphone, Mail, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react'
import styles from './login.module.css'

export default function LoginPage() {
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
        window.location.href = '/dashboard'
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
    <div className={styles.loginPage}>
      <div className={styles.loginWrapper}>
        {/* ═══ HERO SECTION ═══ */}
        <div className={styles.heroSection}>
          <div className={styles.brandSection}>
            <div className={styles.logoCircle}>
              <Image
                src="/media/sticky-header.png"
                alt="Wisma Nusantara Cairo"
                width={64}
                height={64}
                className={styles.logoImage}
                priority
              />
            </div>
            <h1 className={styles.brandName}>Wisma Nusantara Cairo</h1>
            <p className={styles.brandTagline}>Operational System</p>
          </div>
          <div className={styles.heroTriangle} />
        </div>

        {/* ═══ FORM SECTION ═══ */}
        <div className={styles.formSection}>
          <h2 className={styles.loginTitle}>Masuk</h2>

          <form onSubmit={handleSubmit} autoComplete="on">
            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="login-email" className={styles.fieldLabel}>Email</label>
              </div>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="login-email"
                  type="email"
                  className={styles.fieldInput}
                  placeholder="nama@wisma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="login-password" className={styles.fieldLabel}>Password</label>
                {/* <a href="#" className={styles.forgotLink}>Lupa?</a> */}
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.fieldInput}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>atau masuk dengan</span>
          </div>

          {/* Google Sign-In */}
          <button className={styles.googleButton} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Masuk dengan Google
          </button>

          {/* Install CTA */}
          <Link href="/install" className={styles.installCta}>
            <Smartphone size={18} className={styles.installCtaIcon} />
            <span className={styles.installCtaText}>
              Pasang di HP? <strong>Instal Aplikasi</strong>
            </span>
          </Link>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Butuh bantuan? <a href="#" className={styles.footerLink}>Hubungi Admin</a>
            </p>
          </div>
        </div>
      </div>

      {/* ═══ ERROR TOAST ═══ */}
      {error && (
        <div className={`${styles.errorToast} ${!errorVisible ? styles.errorToastHide : ''}`}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* ═══ LOADING OVERLAY ═══ */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Membuat sesi pengguna...</p>
          </div>
        </div>
      )}
    </div>
  )
}
