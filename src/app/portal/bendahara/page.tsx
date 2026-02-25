'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'

export default function BendaharaPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const LogbookTasks = ({ category }: { category: string }) => {
    const [tasks, setTasks] = useState<any[]>([])

    useEffect(() => {
      fetch(`/api/tasks?category=${category}`)
        .then(res => res.json())
        .then(data => setTasks(data))
        .catch(err => console.error(err))
    }, [category])

    if (tasks.length === 0) return <p className="text-sm text-gray-500">Tidak ada catatan baru.</p>

    return (
      <div className="flex flex-col gap-2">
        {tasks.map((t: any) => (
          <div key={t.id} className="p-3 bg-gray-50 rounded border border-gray-100">
            <p className="font-medium text-sm">{t.title}</p>
            <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    )
  }

  // Dashboard setelah verifikasi berhasil
  return (
    <PortalPinGuard portalName="Bendahara" expectedPin={process.env.NEXT_PUBLIC_BENDAHARA_PIN}>
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="portal-header">
            <div>
              <h1>🛡️ Portal Bendahara</h1>
              <p className="portal-subtitle">Pengelolaan Keuangan & Anggaran</p>
            </div>
            <span className="badge badge-success shrink-0">Terverifikasi</span>
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
              {/* Logic for petty cash */}
            </div>

            <div className="card">
              <h3>📝 Catatan Logbook</h3>
              <p className="card-desc">Pesan dari Piket/Resepsionis</p>
              <LogbookTasks category="bendahara" />
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

          .main-content {
            flex: 1;
            padding: var(--spacing-2xl);
            width: 100%;
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.4s ease-out forwards;
          }

          .portal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-2xl);
            padding-bottom: var(--spacing-lg);
            border-bottom: 2px solid var(--color-border);
          }

          .portal-header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--color-text);
            margin: 0 0 0.5rem 0;
            letter-spacing: -0.025em;
          }

          .portal-subtitle {
            font-size: 1rem;
            color: var(--color-text-muted);
            margin: 0;
          }

          .shrink-0 {
            flex-shrink: 0;
          }

          .portal-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: var(--spacing-xl);
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .card {
            background: var(--color-bg-card);
            border-radius: var(--radius-xl);
            padding: var(--spacing-xl);
            border: 1px solid var(--color-border);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease-in-out;
            display: flex;
            flex-direction: column;
          }

          .card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
            border-color: var(--color-primary-light);
          }

          .card h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--color-text);
            margin: 0 0 0.25rem 0;
          }

          .card-desc {
            color: var(--color-text-muted);
            font-size: 0.875rem;
            margin-bottom: var(--spacing-xl);
          }

          .pending-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }

          .pending-item {
            display: flex;
            flex-direction: column;
            padding: var(--spacing-lg);
            background: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
            transition: all 0.2s ease;
          }

          .pending-item:hover {
            border-color: var(--color-primary);
            background: var(--color-bg-highlight);
          }

          .pending-item > div:first-child {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--spacing-md);
          }

          .pending-item strong {
            display: block;
            color: var(--color-text);
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
          }

          .amount {
            display: block;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--color-primary);
          }

          .actions {
            display: flex;
            gap: var(--spacing-sm);
            width: 100%;
          }
          
          .actions .btn {
            flex: 1;
            padding: 0.5rem;
            font-size: 0.875rem;
          }

          .summary-grid {
            display: grid;
            gap: var(--spacing-md);
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-md) var(--spacing-lg);
            background: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
          }

          .summary-item .label {
            color: var(--color-text-secondary);
            font-size: 0.9375rem;
            font-weight: 500;
          }

          .summary-item .value {
            font-weight: 700;
            font-size: 1.125rem;
            color: var(--color-text);
          }

          .summary-item .value.income {
            color: var(--color-success);
          }

          .summary-item .value.expense {
            color: var(--color-danger);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (max-width: 768px) {
            .portal-grid {
              grid-template-columns: 1fr;
            }
            .main-content {
              padding: var(--spacing-lg);
              padding-top: calc(var(--spacing-2xl) + 40px); /* Account for mobile header */
            }
          }
        `}</style>
      </div>
    </PortalPinGuard>
  )
}
