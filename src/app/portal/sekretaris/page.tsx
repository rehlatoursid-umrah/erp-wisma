'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function SekretarisPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'beranda' | 'jawaban_piket'>('beranda')

  // Piket Tab State
  const [piketData, setPiketData] = useState<any[]>([])
  const [piketPetugas, setPiketPetugas] = useState('')
  const [piketMonth, setPiketMonth] = useState(new Date().getMonth() + 1)
  const [piketYear, setPiketYear] = useState(new Date().getFullYear())
  const [piketLoading, setPiketLoading] = useState(false)
  const [piketDetailIdx, setPiketDetailIdx] = useState<number | null>(null)

  const PETUGAS_LIST = [
    'Ubaidillah Chair', 'Obeid Albar', 'Habib Arifin Makhtum', 'Muaz Widad',
    'Indra Juliana Salim', 'Zulfan Firosi Zulfadhli', 'Subhan Hadi', 'Rausan Fiqri', 'Pengganti Sementara'
  ]
  const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const fetchPiketData = async () => {
    setPiketLoading(true)
    try {
      const params = new URLSearchParams()
      if (piketPetugas) params.set('petugas', piketPetugas)
      params.set('month', String(piketMonth))
      params.set('year', String(piketYear))
      const res = await fetch(`/api/laporan-piket?${params.toString()}`)
      const data = await res.json()
      setPiketData(Array.isArray(data) ? data : [])
    } catch { setPiketData([]) }
    finally { setPiketLoading(false) }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="portal-header">
          <h1>🗄️ Portal Sekretaris</h1>
          <p>Admin & HR Management</p>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'beranda' ? 'active' : ''}`} onClick={() => setActiveTab('beranda')}>🏠 Beranda</button>
          <button className={`tab ${activeTab === 'jawaban_piket' ? 'active' : ''}`} onClick={() => setActiveTab('jawaban_piket')}>📋 Jawaban Laporan Piket</button>
        </div>

        {activeTab === 'beranda' && (
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
        )}

        {activeTab === 'jawaban_piket' && (
          <div>
            {/* ── Filter Bar ── */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>Petugas</label>
                <select value={piketPetugas} onChange={e => setPiketPetugas(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', minWidth: '200px' }}>
                  <option value=''>Semua Petugas</option>
                  {PETUGAS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>Bulan</label>
                <select value={piketMonth} onChange={e => setPiketMonth(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>Tahun</label>
                <select value={piketYear} onChange={e => setPiketYear(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={fetchPiketData} style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--color-primary, #8B4513)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', height: '38px' }}>
                {piketLoading ? 'Memuat...' : '🔍 Tampilkan'}
              </button>
            </div>

            {/* ── Summary Cards ── */}
            {piketData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e40af' }}>{piketData.length}</div>
                  <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>Total Laporan</div>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#166534' }}>{piketData.filter(d => d.jamMasuk && d.jamKeluar).length}</div>
                  <div style={{ fontSize: '0.85rem', color: '#22c55e' }}>Shift Lengkap</div>
                </div>
                <div style={{ background: '#fefce8', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#854d0e' }}>
                    {(() => {
                      let totalMins = 0
                      piketData.forEach(d => {
                        if (d.jamMasuk && d.jamKeluar) {
                          const [h1, m1] = d.jamMasuk.split(':').map(Number)
                          const [h2, m2] = d.jamKeluar.split(':').map(Number)
                          totalMins += (h2 * 60 + m2) - (h1 * 60 + m1)
                        }
                      })
                      const hrs = Math.floor(totalMins / 60)
                      const mins = totalMins % 60
                      return `${hrs}j ${mins}m`
                    })()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#a16207' }}>Total Jam Kerja</div>
                </div>
              </div>
            )}

            {/* ── Data Table ── */}
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>No</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Tanggal</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Petugas</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Masuk</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Keluar</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Durasi</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Kegiatan</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {piketData.map((d, i) => {
                    let durasi = '-'
                    if (d.jamMasuk && d.jamKeluar) {
                      const [h1, m1] = d.jamMasuk.split(':').map(Number)
                      const [h2, m2] = d.jamKeluar.split(':').map(Number)
                      const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
                      durasi = `${Math.floor(diff / 60)}j ${diff % 60}m`
                    }
                    const tgl = d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
                    return (
                      <>
                        <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => setPiketDetailIdx(piketDetailIdx === i ? null : i)}>
                          <td style={{ padding: '10px 14px' }}>{i + 1}</td>
                          <td style={{ padding: '10px 14px' }}>{tgl}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{d.namaPetugas || '-'}</td>
                          <td style={{ padding: '10px 14px' }}>{d.jamMasuk || '-'}</td>
                          <td style={{ padding: '10px 14px' }}>{d.jamKeluar || '-'}</td>
                          <td style={{ padding: '10px 14px' }}>{durasi}</td>
                          <td style={{ padding: '10px 14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.kegiatanHariIni || '-'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              {piketDetailIdx === i ? '▲' : '▼'}
                            </button>
                          </td>
                        </tr>
                        {piketDetailIdx === i && (
                          <tr key={`detail-${d.id}`}>
                            <td colSpan={8} style={{ padding: '16px 24px', background: '#f9fafb', fontSize: '0.85rem', lineHeight: 1.7 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                  <strong>📧 Email:</strong> {d.email || '-'}<br />
                                  <strong>💡 Lampu:</strong> {Array.isArray(d.lampu) ? d.lampu.join(', ') : '-'}<br />
                                  <strong>🧹 Kebersihan:</strong> {Array.isArray(d.kebersihan) ? d.kebersihan.join(', ') : '-'}<br />
                                  <strong>🚪 Ruangan:</strong> {Array.isArray(d.ruangan) ? d.ruangan.join(', ') : '-'} {d.ruanganLain ? `(${d.ruanganLain})` : ''}<br />
                                  <strong>🔒 Keamanan:</strong> {d.laporanKeamanan || 'Aman'}<br />
                                  <strong>📝 Kegiatan Hari Ini:</strong> {d.kegiatanHariIni || '-'}<br />
                                  <strong>📅 Kegiatan Esok:</strong> {d.kegiatanEsokHari || '-'}<br />
                                  <strong>💧 Meteran Air:</strong> {d.meteranAir || '-'} | <strong>⚡ Listrik:</strong> {d.meteranListrik || '-'}
                                </div>
                                <div>
                                  <strong>🏨 Kamar Terisi:</strong> {Array.isArray(d.kamarTerisi) ? d.kamarTerisi.join(', ') : '-'}<br />
                                  <strong>🍪 Snack:</strong> {Array.isArray(d.snack) ? d.snack.join(', ') : '-'}<br />
                                  <strong>🧹 Lobby:</strong> {Array.isArray(d.beresLobby) ? d.beresLobby.join(', ') : '-'} {d.beresLobbyLain ? `(${d.beresLobbyLain})` : ''}<br />
                                  <strong>📶 Wifi:</strong> {d.wifiHostel || '-'}<br />
                                  <strong>💰 Pembayaran Hostel:</strong> {d.adaPembayaranHostel || '-'}<br />
                                  <strong>📝 Rincian:</strong> {d.rincianPembayaranHostel || '-'}<br />
                                  <strong>🏛️ Penyewa 1:</strong> {d.penyewa1 || '-'} {d.penyewa1Nama ? `(${d.penyewa1Nama})` : ''} — {d.totalBiaya1 || '0'}<br />
                                  <strong>🏛️ Penyewa 2:</strong> {d.penyewa2 || '-'} {d.penyewa2Nama ? `(${d.penyewa2Nama})` : ''} — {d.totalBiaya2 || '0'}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                  {piketData.length === 0 && !piketLoading && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Klik &quot;Tampilkan&quot; untuk memuat data, atau belum ada data untuk filter ini.</td></tr>
                  )}
                  {piketLoading && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Memuat data...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <style jsx global>{`
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

        .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; }
        .tab {
          padding: 0.75rem 1.25rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          font-size: 0.92rem;
          transition: all 0.2s;
        }
        .tab:hover { border-color: var(--color-primary, #8B4513); }
        .tab.active {
          background: var(--color-primary, #8B4513);
          color: white;
          border-color: var(--color-primary, #8B4513);
        }

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
