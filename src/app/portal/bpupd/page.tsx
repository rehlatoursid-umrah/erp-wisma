'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function BPUPDPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'kanban' | 'jamaah' | 'broadcast'>('kanban')

  const visaData = {
    pending: [
      { id: 1, name: 'Ahmad Fauzi', passport: 'A1234567', type: 'Umrah' },
      { id: 2, name: 'Siti Aminah', passport: 'B2345678', type: 'Umrah' },
    ],
    process: [
      { id: 3, name: 'Budi Santoso', passport: 'C3456789', type: 'Tour' },
    ],
    issued: [
      { id: 4, name: 'Dewi Lestari', passport: 'D4567890', type: 'Umrah' },
      { id: 5, name: 'Eko Prasetyo', passport: 'E5678901', type: 'Haji' },
    ],
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="portal-header">
          <h1>✈️ Portal BPUPD</h1>
          <p>Travel & Sales Management</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            📋 Visa Kanban
          </button>
          <button
            className={`tab ${activeTab === 'jamaah' ? 'active' : ''}`}
            onClick={() => setActiveTab('jamaah')}
          >
            👥 Database Jamaah
          </button>
          <button
            className={`tab ${activeTab === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcast')}
          >
            📢 Broadcast WA
          </button>
        </div>

        {activeTab === 'kanban' && (
          <div className="kanban-board">
            <div className="kanban-column">
              <h3 className="column-header pending">📄 Pending Docs ({visaData.pending.length})</h3>
              {visaData.pending.map(item => (
                <div key={item.id} className="kanban-card">
                  <strong>{item.name}</strong>
                  <span className="passport">{item.passport}</span>
                  <span className="badge badge-info">{item.type}</span>
                </div>
              ))}
            </div>
            <div className="kanban-column">
              <h3 className="column-header process">🔄 On Process ({visaData.process.length})</h3>
              {visaData.process.map(item => (
                <div key={item.id} className="kanban-card">
                  <strong>{item.name}</strong>
                  <span className="passport">{item.passport}</span>
                  <span className="badge badge-warning">{item.type}</span>
                </div>
              ))}
            </div>
            <div className="kanban-column">
              <h3 className="column-header issued">✅ Issued ({visaData.issued.length})</h3>
              {visaData.issued.map(item => (
                <div key={item.id} className="kanban-card">
                  <strong>{item.name}</strong>
                  <span className="passport">{item.passport}</span>
                  <span className="badge badge-success">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'jamaah' && (
          <div className="card">
            <h3>Database Jamaah</h3>
            <p>Fitur ini akan menampilkan data historis jamaah Umrah/Haji/Tour</p>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="card">
            <h3>Broadcast WhatsApp</h3>
            <p>Fitur ini akan memungkinkan pengiriman promo ke nomor tamu</p>
          </div>
        )}
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

        .portal-header p {
          color: var(--color-text-muted);
        }

        .tabs {
          display: flex;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-xs);
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          width: fit-content;
        }

        .tab {
          padding: var(--spacing-sm) var(--spacing-xl);
          background: transparent;
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab:hover {
          color: var(--color-primary);
          transform: translateY(-2px);
        }

        .tab.active {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          box-shadow: var(--shadow-md);
        }

        .kanban-board {
          display: flex;
          gap: var(--spacing-lg);
          width: 100%;
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kanban-column {
          flex: 1;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-xl);
          padding: var(--spacing-lg);
          min-height: 500px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kanban-column:hover {
          box-shadow: var(--shadow-md);
        }

        .column-header {
          padding: var(--spacing-md) var(--spacing-lg);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-lg);
          font-size: 1rem;
          font-weight: 600;
        }

        .column-header.pending {
          background: var(--color-info-light);
          color: #1E40AF;
        }

        .column-header.process {
          background: var(--color-warning-light);
          color: #854D0E;
        }

        .column-header.issued {
          background: var(--color-success-light);
          color: #166534;
        }

        .kanban-card {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: 1px solid transparent;
        }

        .kanban-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary-light);
        }

        .kanban-card strong {
          display: block;
          margin-bottom: var(--spacing-sm);
          font-size: 1rem;
        }

        .passport {
          display: block;
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-sm);
        }

        .card {
          width: 100%;
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
          .kanban-board {
            flex-direction: column;
          }
          .kanban-column {
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  )
}
