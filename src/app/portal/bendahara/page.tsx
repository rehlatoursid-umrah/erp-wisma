'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function BendaharaPortal() {
  const [step, setStep] = useState<'pin' | 'otp' | 'dashboard'>('pin')
  const [pin, setPin] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock PIN validation - akan diganti dengan Payload auth
    if (pin === '123456') {
      setError('')
      setStep('otp')
      // TODO: Trigger WA OTP via API
      alert('OTP telah dikirim ke WhatsApp Bendahara')
    } else {
      setError('PIN salah. Coba lagi.')
    }
  }

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock OTP validation
    if (otp.length === 5) {
      setError('')
      setStep('dashboard')
    } else {
      setError('OTP tidak valid')
    }
  }

  if (step !== 'dashboard') {
    return (
      <div className="security-gate">
        <div className="security-card">
          <div className="security-icon">🛡️</div>
          <h1>Portal Bendahara</h1>
          <p className="security-subtitle">
            {step === 'pin' ? 'Masukkan PIN keamanan Anda' : 'Masukkan kode OTP dari WhatsApp'}
          </p>

          {step === 'pin' ? (
            <form onSubmit={handlePinSubmit}>
              <div className="form-group">
                <input
                  type="password"
                  className="form-input pin-input"
                  placeholder="••••••"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
                Verifikasi PIN
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input otp-input"
                  placeholder="12345"
                  maxLength={5}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
                Verifikasi OTP
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
                onClick={() => setStep('pin')}
              >
                ← Kembali
              </button>
            </form>
          )}
        </div>

        <style jsx>{`
          .security-gate {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--color-bg-dark) 0%, #2D2620 100%);
            padding: var(--spacing-lg);
          }

          .security-card {
            width: 100%;
            max-width: 400px;
            background: var(--color-bg-card);
            border-radius: var(--radius-2xl);
            box-shadow: var(--shadow-xl);
            padding: var(--spacing-2xl);
            text-align: center;
          }

          .security-icon {
            font-size: 4rem;
            margin-bottom: var(--spacing-lg);
          }

          h1 {
            margin-bottom: var(--spacing-xs);
            color: var(--color-primary);
          }

          .security-subtitle {
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-xl);
          }

          .pin-input, .otp-input {
            text-align: center;
            font-size: 2rem;
            letter-spacing: 0.5rem;
            font-weight: 600;
          }

          .error-text {
            color: var(--color-error);
            font-size: 0.875rem;
            margin-bottom: var(--spacing-md);
          }
        `}</style>
      </div>
    )
  }

  // Dashboard setelah verifikasi berhasil
  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="portal-header">
          <h1>🛡️ Portal Bendahara</h1>
          <span className="badge badge-success">Terverifikasi</span>
        </div>

        <div className="portal-grid">
          <div className="card">
            <h3>💰 Incoming Funds</h3>
            <p className="card-desc">Setoran piket menunggu approval</p>
            <div className="pending-list">
              <div className="pending-item">
                <div>
                  <strong>Setoran Piket Pagi</strong>
                  <span className="amount">EGP 1,200</span>
                </div>
                <div className="actions">
                  <button className="btn btn-primary">Approve</button>
                  <button className="btn btn-secondary">Reject</button>
                </div>
              </div>
              <div className="pending-item">
                <div>
                  <strong>Setoran Piket Sore</strong>
                  <span className="amount">EGP 850</span>
                </div>
                <div className="actions">
                  <button className="btn btn-primary">Approve</button>
                  <button className="btn btn-secondary">Reject</button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>💸 Petty Cash Requests</h3>
            <p className="card-desc">Permintaan pencairan dana</p>
            <div className="pending-list">
              <div className="pending-item">
                <div>
                  <strong>Beli sabun & deterjen</strong>
                  <span className="amount">EGP 150</span>
                  <span className="requester">by BPPG</span>
                </div>
                <div className="actions">
                  <button className="btn btn-primary">Cairkan</button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>📊 Summary Bulan Ini</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Total Pemasukan</span>
                <span className="value income">EGP 45,200</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Pengeluaran</span>
                <span className="value expense">EGP 12,350</span>
              </div>
              <div className="summary-item">
                <span className="label">Saldo</span>
                <span className="value">EGP 32,850</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg-primary);
        }

        .portal-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .portal-header h1 {
          margin: 0;
          font-size: 2rem;
        }

        .portal-grid {
          display: flex;
          gap: var(--spacing-lg);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .portal-grid > .card {
          flex: 1;
          min-width: 0;
        }

        .card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary-light);
        }

        .card-desc {
          color: var(--color-text-muted);
          font-size: 0.9375rem;
          margin-bottom: var(--spacing-lg);
        }

        .pending-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .pending-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .pending-item:hover {
          transform: translateX(4px);
          box-shadow: var(--shadow-md);
        }

        .amount {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
        }

        .requester {
          display: block;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        .actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .summary-grid {
          display: grid;
          gap: var(--spacing-lg);
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .summary-item:hover {
          transform: scale(1.02);
          box-shadow: var(--shadow-md);
        }

        .summary-item .label {
          color: var(--color-text-secondary);
          font-size: 1rem;
        }

        .summary-item .value {
          font-weight: 700;
          font-size: 1.25rem;
        }

        .summary-item .value.income {
          color: var(--color-success);
        }

        .summary-item .value.expense {
          color: var(--color-error);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 968px) {
          .portal-grid {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
