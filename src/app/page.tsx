'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // TODO: Implement Payload auth
        setTimeout(() => {
            window.location.href = '/dashboard'
        }, 1000)
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="logo-container">
                        <div className="logo-icon">🏛️</div>
                    </div>
                    <h1>WIN-OS</h1>
                    <p>Wisma Nusantara Integrated Operation System</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="nama@wisma.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-large"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <div className="login-divider">
                    <span>atau</span>
                </div>

                <button className="btn btn-secondary btn-large google-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Masuk dengan Google
                </button>

                <p className="login-footer">
                    Butuh bantuan? Hubungi <a href="#">Administrator</a>
                </p>
            </div>

            <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
          padding: var(--spacing-lg);
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl);
          padding: var(--spacing-2xl);
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .logo-container {
          width: 80px;
          height: 80px;
          margin: 0 auto var(--spacing-lg);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
        }

        .logo-icon {
          font-size: 2.5rem;
        }

        .login-header h1 {
          font-size: 1.75rem;
          color: var(--color-primary);
          margin-bottom: var(--spacing-xs);
        }

        .login-header p {
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }

        .login-form {
          margin-bottom: var(--spacing-lg);
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: var(--spacing-lg) 0;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(139, 69, 19, 0.2);
        }

        .login-divider span {
          padding: 0 var(--spacing-md);
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        .login-footer {
          text-align: center;
          margin-top: var(--spacing-xl);
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }

        .login-footer a {
          color: var(--color-primary);
          text-decoration: none;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
        </div>
    )
}
