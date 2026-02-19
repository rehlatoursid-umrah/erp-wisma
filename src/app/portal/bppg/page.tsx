'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function BPPGPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const housekeepingList = [
    { room: '102', status: 'dirty', guest: 'Check-out 10:00' },
    { room: '104', status: 'dirty', guest: 'Check-out 11:30' },
  ]

  const [maintenanceTickets, setMaintenanceTickets] = useState<any[]>([])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks?category=bppg')
        if (res.ok) {
          const data = await res.json()
          setMaintenanceTickets(data)
        }
      } catch (error) {
        console.error('Failed to fetch tasks', error)
      }
    }
    fetchTasks()
  }, [])

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="portal-header">
          <h1>🛠️ Portal BPPG</h1>
          <p>Maintenance & Housekeeping</p>
        </div>

        <div className="portal-grid">
          <div className="card">
            <h3>🧹 Housekeeping List</h3>
            <p className="card-desc">Kamar yang perlu dibersihkan</p>

            {housekeepingList.length === 0 ? (
              <div className="empty-state">✨ Semua kamar sudah bersih!</div>
            ) : (
              <div className="task-list">
                {housekeepingList.map((item) => (
                  <div key={item.room} className="task-item dirty">
                    <div className="task-info">
                      <strong>Kamar {item.room}</strong>
                      <span>{item.guest}</span>
                    </div>
                    <button className="btn btn-primary">✓ Selesai</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3>🔧 Maintenance Tickets (Logbook)</h3>
            <p className="card-desc">Laporan kerusakan dari Logbook</p>

            <div className="task-list">
              {maintenanceTickets.length === 0 ? (
                <p className="text-muted">Tidak ada tiket maintenance aktif.</p>
              ) : (
                maintenanceTickets.map((ticket) => (
                  <div key={ticket.id} className={`task-item ${ticket.status}`}>
                    <div className="task-info">
                      <strong>{ticket.title}</strong>
                      <div className="task-meta">
                        <span className={`priority ${ticket.priority}`}>
                          {ticket.priority === 'high' ? '🔴' : ticket.priority === 'normal' ? '🟡' : '🟢'} {ticket.priority}
                        </span>
                        <span className={`status-badge ${ticket.status}`}>
                          {ticket.status === 'pending' ? '📋 Pending' : ticket.status === 'in_progress' ? '🔄 In Progress' : '✅ Done'}
                        </span>
                      </div>
                    </div>
                    {ticket.status !== 'done' && (
                      <button className="btn btn-secondary">Update</button>
                    )}
                  </div>
                ))
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>
              + Tambah Ticket
            </button>
          </div>

          <div className="card">
            <h3>📦 Inventory Check</h3>
            <p className="card-desc">Cek stok barang di gudang</p>

            <div className="inventory-grid">
              <div className="inventory-item">
                <span className="item-name">Handuk</span>
                <span className="item-count">24 pcs</span>
              </div>
              <div className="inventory-item">
                <span className="item-name">Sabun</span>
                <span className="item-count low">5 pcs</span>
              </div>
              <div className="inventory-item">
                <span className="item-name">Sprei</span>
                <span className="item-count">18 set</span>
              </div>
              <div className="inventory-item">
                <span className="item-name">Kursi Lipat</span>
                <span className="item-count">12 pcs</span>
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

        .task-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .task-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--color-text-muted);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .task-item:hover {
          transform: translateX(4px);
          box-shadow: var(--shadow-md);
        }

        .task-item.dirty { border-left-color: var(--color-warning); }
        .task-item.pending { border-left-color: var(--color-info); }
        .task-item.in_progress { border-left-color: var(--color-warning); }
        .task-item.done { border-left-color: var(--color-success); opacity: 0.7; }

        .task-info strong { display: block; margin-bottom: 6px; font-size: 1rem; }
        .task-info span { font-size: 0.875rem; color: var(--color-text-muted); }

        .task-meta {
          display: flex;
          gap: var(--spacing-lg);
          margin-top: 6px;
        }

        .priority { font-size: 0.8125rem; }
        .status-badge { font-size: 0.8125rem; }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--color-success);
          font-size: 1.25rem;
        }

        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--spacing-md);
        }

        .inventory-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .inventory-item:hover {
          transform: scale(1.03);
          box-shadow: var(--shadow-md);
        }

        .item-count { font-weight: 600; font-size: 1rem; }
        .item-count.low { color: var(--color-error); }

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
