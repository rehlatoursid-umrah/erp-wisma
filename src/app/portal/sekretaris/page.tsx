'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function SekretarisPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="portal-header">
          <h1>🗄️ Portal Sekretaris</h1>
          <p>Admin & HR Management</p>
        </div>

        <div className="portal-grid">
          <div className="card">
            <h3>📝 Master Data</h3>
            <p className="card-desc">Kelola data layanan dan pengguna</p>
            <div className="menu-list">
              <a href="/admin" className="menu-item">
                <span>🛏️</span>
                <span>Harga Kamar</span>
              </a>
              <a href="/admin" className="menu-item">
                <span>👤</span>
                <span>Tambah User Baru</span>
              </a>
              <a href="/admin" className="menu-item">
                <span>📋</span>
                <span>Daftar Layanan</span>
              </a>
            </div>
          </div>

          <div className="card">
            <h3>👥 HR Monitor</h3>
            <p className="card-desc">Rekap absensi dan performa staff</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Piket</th>
                  <th>Input</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ahmad</td>
                  <td>12 hari</td>
                  <td>45 trx</td>
                </tr>
                <tr>
                  <td>Budi</td>
                  <td>10 hari</td>
                  <td>38 trx</td>
                </tr>
                <tr>
                  <td>Citra</td>
                  <td>8 hari</td>
                  <td>32 trx</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>📜 Audit Log</h3>
            <p className="card-desc">Riwayat perubahan data</p>
            <div className="log-list">
              <div className="log-item">
                <span className="log-action edit">EDIT</span>
                <span className="log-detail">Ahmad mengedit harga Kamar 101</span>
                <span className="log-time">5 menit lalu</span>
              </div>
              <div className="log-item">
                <span className="log-action create">CREATE</span>
                <span className="log-detail">Budi membuat transaksi INV-20260202-0012</span>
                <span className="log-time">1 jam lalu</span>
              </div>
              <div className="log-item">
                <span className="log-action delete">DELETE</span>
                <span className="log-detail">Admin menghapus task lama</span>
                <span className="log-time">2 jam lalu</span>
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
          margin-bottom: var(--spacing-xl);
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .portal-header h1 { 
          margin-bottom: var(--spacing-xs);
          font-size: 2rem;
        }
        .portal-header p { color: var(--color-text-muted); }

        .portal-grid {
          display: flex;
          gap: var(--spacing-lg);
          width: 100%;
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

        .menu-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          text-decoration: none;
          color: var(--color-text-primary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 1rem;
        }

        .menu-item:hover {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          transform: translateX(8px);
          box-shadow: var(--shadow-md);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th, .data-table td {
          padding: var(--spacing-md) var(--spacing-lg);
          text-align: left;
          border-bottom: 1px solid rgba(139, 69, 19, 0.1);
        }

        .data-table tr {
          transition: all 0.2s ease;
        }

        .data-table tbody tr:hover {
          background: var(--color-bg-secondary);
        }

        .data-table th {
          font-weight: 600;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .log-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .log-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          font-size: 0.9375rem;
          transition: all 0.2s ease;
          border-radius: var(--radius-md);
        }

        .log-item:hover {
          background: var(--color-bg-secondary);
          transform: translateX(4px);
        }

        .log-action {
          padding: 4px 10px;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .log-action.edit { background: var(--color-warning-light); color: #854D0E; }
        .log-action.create { background: var(--color-success-light); color: #166534; }
        .log-action.delete { background: var(--color-error-light); color: #991B1B; }

        .log-detail { flex: 1; }
        .log-time { color: var(--color-text-muted); font-size: 0.8125rem; }

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
