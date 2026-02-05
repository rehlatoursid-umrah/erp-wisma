'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DirekturPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="portal-header">
          <h1>👔 Portal Direktur</h1>
          <p>Executive Dashboard (View Only)</p>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <span className="summary-icon">💰</span>
            <div className="summary-info">
              <span className="summary-value">EGP 45,200</span>
              <span className="summary-label">Revenue Bulan Ini</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">🛏️</span>
            <div className="summary-info">
              <span className="summary-value">78%</span>
              <span className="summary-label">Occupancy Rate</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">✈️</span>
            <div className="summary-info">
              <span className="summary-value">12</span>
              <span className="summary-label">Visa Processed</span>
            </div>
          </div>
          <div className="summary-card">
            <span className="summary-icon">📊</span>
            <div className="summary-info">
              <span className="summary-value">156</span>
              <span className="summary-label">Total Transaksi</span>
            </div>
          </div>
        </div>

        <div className="portal-grid">
          <div className="card">
            <div className="card-header">
              <h3>📈 Revenue Chart</h3>
              <button className="btn btn-secondary">Download PDF</button>
            </div>
            <div className="chart-placeholder">
              <p>📊 Chart akan ditampilkan di sini</p>
              <p className="chart-note">Integrasi dengan library chart seperti Chart.js atau Recharts</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>🏨 Occupancy Trend</h3>
              <button className="btn btn-secondary">Download PDF</button>
            </div>
            <div className="chart-placeholder">
              <p>📉 Trend occupancy bulanan</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>📋 Recent Transactions</h3>
            <button className="btn btn-secondary">Export CSV</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>INV-20260202-0012</td>
                <td>Ahmad Fauzi</td>
                <td>Hotel - Kamar 103</td>
                <td>EGP 900</td>
                <td><span className="badge badge-success">Paid</span></td>
                <td>02 Feb 2026</td>
              </tr>
              <tr>
                <td>INV-20260201-0011</td>
                <td>Siti Aminah</td>
                <td>Travel - Umrah</td>
                <td>USD 1,200</td>
                <td><span className="badge badge-warning">Partial</span></td>
                <td>01 Feb 2026</td>
              </tr>
              <tr>
                <td>INV-20260201-0010</td>
                <td>Budi Santoso</td>
                <td>Aula - 3 Jam</td>
                <td>EGP 450</td>
                <td><span className="badge badge-success">Paid</span></td>
                <td>01 Feb 2026</td>
              </tr>
            </tbody>
          </table>
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

        .summary-cards {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .summary-card {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl);
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          cursor: pointer;
        }

        .summary-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: var(--shadow-xl);
          border-color: var(--color-primary-light);
        }

        .summary-icon {
          font-size: 3rem;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .summary-card:hover .summary-icon {
          transform: scale(1.2) rotate(-5deg);
        }

        .summary-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .summary-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1;
        }

        .summary-label {
          font-size: 0.9375rem;
          color: var(--color-text-muted);
        }

        .portal-grid {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .portal-grid > .card {
          flex: 1;
          min-width: 0;
        }

        .card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary-light);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .card-header h3 { margin: 0; font-size: 1.25rem; }

        .chart-placeholder {
          height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-xl);
          color: var(--color-text-muted);
          font-size: 1.125rem;
        }

        .chart-note {
          font-size: 0.875rem;
          margin-top: var(--spacing-md);
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
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .summary-cards { flex-wrap: wrap; }
          .summary-card { min-width: calc(50% - var(--spacing-md)); }
          .portal-grid { flex-direction: column; }
        }

        @media (max-width: 768px) {
          .summary-card { min-width: 100%; }
        }
      `}</style>
    </div>
  )
}
