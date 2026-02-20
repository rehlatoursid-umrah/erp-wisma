'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function SekretarisPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'beranda' | 'jawaban_piket' | 'arsip_bulanan'>('beranda')

  // Piket Tab State
  const [piketData, setPiketData] = useState<any[]>([])
  const [piketPetugas, setPiketPetugas] = useState('')
  const [piketMonth, setPiketMonth] = useState(new Date().getMonth() + 1)
  const [piketYear, setPiketYear] = useState(new Date().getFullYear())
  const [piketLoading, setPiketLoading] = useState(false)
  const [piketDetailIdx, setPiketDetailIdx] = useState<number | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  // Arsip Bulanan State
  const [arsipYear, setArsipYear] = useState(new Date().getFullYear())
  const [arsipData, setArsipData] = useState<{ month: number; count: number; totalHours: string }[]>([])
  const [arsipLoading, setArsipLoading] = useState(false)
  const [arsipPdfGen, setArsipPdfGen] = useState<number | null>(null)

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

  // Fetch arsip overview for selected year
  const fetchArsipOverview = async () => {
    setArsipLoading(true)
    const results: { month: number; count: number; totalHours: string }[] = []
    try {
      const now = new Date()
      const currentMonth = now.getFullYear() === arsipYear ? now.getMonth() + 1 : 12
      for (let m = 1; m <= currentMonth; m++) {
        const params = new URLSearchParams({ month: String(m), year: String(arsipYear) })
        const res = await fetch(`/api/laporan-piket?${params.toString()}`)
        const data = await res.json()
        const docs = Array.isArray(data) ? data : []
        let totalMins = 0
        docs.forEach((d: any) => {
          if (d.jamMasuk && d.jamKeluar) {
            const [h1, m1] = d.jamMasuk.split(':').map(Number)
            const [h2, m2] = d.jamKeluar.split(':').map(Number)
            totalMins += (h2 * 60 + m2) - (h1 * 60 + m1)
          }
        })
        const hrs = Math.floor(totalMins / 60)
        const mins = totalMins % 60
        results.push({ month: m, count: docs.length, totalHours: `${hrs}j ${mins}m` })
      }
    } catch { /* ignore */ }
    setArsipData(results)
    setArsipLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'arsip_bulanan') fetchArsipOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, arsipYear])

  // ── PDF Generation ──
  const generatePDF = async (month: number, year: number, petugasFilter?: string) => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    // Fetch data for the PDF
    const params = new URLSearchParams({ month: String(month), year: String(year) })
    if (petugasFilter) params.set('petugas', petugasFilter)
    const res = await fetch(`/api/laporan-piket?${params.toString()}`)
    const rawData = await res.json()
    const data: any[] = Array.isArray(rawData) ? rawData : []

    if (data.length === 0) {
      alert('Tidak ada data untuk periode ini.')
      return
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const monthName = MONTH_NAMES[month - 1]
    const pageW = doc.internal.pageSize.getWidth()

    // ── Header ──
    doc.setFillColor(139, 69, 19)
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('REKAP LAPORAN PIKET KANTOR', pageW / 2, 12, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Wisma Nusantara Cairo — ${monthName} ${year}${petugasFilter ? ` — ${petugasFilter}` : ''}`, pageW / 2, 20, { align: 'center' })

    // ── Summary Box ──
    let totalMins = 0
    let shiftComplete = 0
    data.forEach((d: any) => {
      if (d.jamMasuk && d.jamKeluar) {
        shiftComplete++
        const [h1, m1] = d.jamMasuk.split(':').map(Number)
        const [h2, m2] = d.jamKeluar.split(':').map(Number)
        totalMins += (h2 * 60 + m2) - (h1 * 60 + m1)
      }
    })
    const totalHrs = Math.floor(totalMins / 60)
    const totalMinsR = totalMins % 60

    doc.setTextColor(80, 80, 80)
    doc.setFontSize(9)
    const summaryY = 34
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Laporan: ${data.length}`, 14, summaryY)
    doc.text(`Shift Lengkap: ${shiftComplete}`, 80, summaryY)
    doc.text(`Total Jam Kerja: ${totalHrs}j ${totalMinsR}m`, 150, summaryY)
    doc.setFont('helvetica', 'normal')

    // ── Table ──
    const tableData = data.map((d: any, i: number) => {
      let durasi = '-'
      if (d.jamMasuk && d.jamKeluar) {
        const [h1, m1] = d.jamMasuk.split(':').map(Number)
        const [h2, m2] = d.jamKeluar.split(':').map(Number)
        const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
        durasi = `${Math.floor(diff / 60)}j ${diff % 60}m`
      }
      const tgl = d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
      const lampu = Array.isArray(d.lampu) ? d.lampu.join(', ') : '-'
      const kebersihan = Array.isArray(d.kebersihan) ? d.kebersihan.join(', ') : '-'
      const ruangan = Array.isArray(d.ruangan) ? d.ruangan.join(', ') : '-'

      return [
        i + 1,
        tgl,
        d.namaPetugas || '-',
        d.jamMasuk || '-',
        d.jamKeluar || '-',
        durasi,
        lampu,
        kebersihan,
        ruangan,
        d.laporanKeamanan || 'Aman',
        (d.kegiatanHariIni || '-').substring(0, 40),
      ]
    })

    autoTable(doc, {
      startY: 40,
      head: [['No', 'Tanggal', 'Petugas', 'Masuk', 'Keluar', 'Durasi', 'Lampu', 'Kebersihan', 'Ruangan', 'Keamanan', 'Kegiatan']],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 32 },
        3: { cellWidth: 14 },
        4: { cellWidth: 14 },
        5: { cellWidth: 14 },
        10: { cellWidth: 40 },
      },
      margin: { left: 8, right: 8 },
      didDrawPage: (d: any) => {
        // Footer
        const pageH = doc.internal.pageSize.getHeight()
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, pageH - 6)
        doc.text(`Halaman ${doc.getCurrentPageInfo().pageNumber}`, pageW - 14, pageH - 6, { align: 'right' })
      }
    })

    // ── Per-Person Summary Page ──
    doc.addPage()
    doc.setFillColor(139, 69, 19)
    doc.rect(0, 0, pageW, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`RINGKASAN PER PETUGAS — ${monthName} ${year}`, pageW / 2, 14, { align: 'center' })

    // Build per-person stats
    const personStats: Record<string, { count: number; totalMins: number; shifts: number }> = {}
    data.forEach((d: any) => {
      const name = d.namaPetugas || 'Tidak Diketahui'
      if (!personStats[name]) personStats[name] = { count: 0, totalMins: 0, shifts: 0 }
      personStats[name].count++
      if (d.jamMasuk && d.jamKeluar) {
        personStats[name].shifts++
        const [h1, m1] = d.jamMasuk.split(':').map(Number)
        const [h2, m2] = d.jamKeluar.split(':').map(Number)
        personStats[name].totalMins += (h2 * 60 + m2) - (h1 * 60 + m1)
      }
    })

    const personTableData = Object.entries(personStats).map(([name, stats], i) => {
      const hrs = Math.floor(stats.totalMins / 60)
      const mins = stats.totalMins % 60
      return [i + 1, name, stats.count, stats.shifts, `${hrs}j ${mins}m`]
    })

    autoTable(doc, {
      startY: 28,
      head: [['No', 'Nama Petugas', 'Total Laporan', 'Shift Lengkap', 'Total Jam Kerja']],
      body: personTableData,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      alternateRowStyles: { fillColor: [250, 248, 245] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 70 },
      },
      margin: { left: 14, right: 14 },
    })

    // Save
    const filename = `Rekap_Piket_${monthName}_${year}${petugasFilter ? `_${petugasFilter.replace(/\s+/g, '_')}` : ''}.pdf`
    doc.save(filename)
  }

  // Download from Jawaban Piket tab
  const handleDownloadPDF = async () => {
    setPdfGenerating(true)
    try {
      await generatePDF(piketMonth, piketYear, piketPetugas || undefined)
    } catch (err) {
      console.error(err)
      alert('Gagal generate PDF')
    }
    setPdfGenerating(false)
  }

  // Download from Arsip tab
  const handleArsipDownload = async (month: number) => {
    setArsipPdfGen(month)
    try {
      await generatePDF(month, arsipYear)
    } catch (err) {
      console.error(err)
      alert('Gagal generate PDF')
    }
    setArsipPdfGen(null)
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
          <button className={`tab ${activeTab === 'arsip_bulanan' ? 'active' : ''}`} onClick={() => setActiveTab('arsip_bulanan')}>📁 Arsip Bulanan</button>
        </div>

        {/* ═══════ BERANDA TAB ═══════ */}
        {activeTab === 'beranda' && (
          <div className="portal-grid">
            <div className="card">
              <h3>📝 Master Data</h3>
              <p className="card-desc">Kelola data layanan dan pengguna</p>
              <div className="menu-list">
                <a href="/admin" className="menu-item"><span>🛏️</span><span>Harga Kamar</span></a>
                <a href="/admin" className="menu-item"><span>👤</span><span>Tambah User Baru</span></a>
                <a href="/admin" className="menu-item"><span>📋</span><span>Daftar Layanan</span></a>
              </div>
            </div>
            <div className="card">
              <h3>👥 HR Monitor</h3>
              <p className="card-desc">Rekap absensi dan performa staff</p>
              <table className="data-table">
                <thead><tr><th>Nama</th><th>Piket</th><th>Input</th></tr></thead>
                <tbody>
                  <tr><td>Ahmad</td><td>12 hari</td><td>45 trx</td></tr>
                  <tr><td>Budi</td><td>10 hari</td><td>38 trx</td></tr>
                  <tr><td>Citra</td><td>8 hari</td><td>32 trx</td></tr>
                </tbody>
              </table>
            </div>
            <div className="card">
              <h3>📜 Audit Log</h3>
              <p className="card-desc">Riwayat perubahan data</p>
              <div className="log-list">
                <div className="log-item"><span className="log-action edit">EDIT</span><span className="log-detail">Ahmad mengedit harga Kamar 101</span><span className="log-time">5 menit lalu</span></div>
                <div className="log-item"><span className="log-action create">CREATE</span><span className="log-detail">Budi membuat transaksi INV-20260202-0012</span><span className="log-time">1 jam lalu</span></div>
                <div className="log-item"><span className="log-action delete">DELETE</span><span className="log-detail">Admin menghapus task lama</span><span className="log-time">2 jam lalu</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ JAWABAN PIKET TAB ═══════ */}
        {activeTab === 'jawaban_piket' && (
          <div>
            {/* Filter Bar */}
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
              {piketData.length > 0 && (
                <button onClick={handleDownloadPDF} disabled={pdfGenerating} style={{ padding: '8px 20px', borderRadius: '8px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', height: '38px', opacity: pdfGenerating ? 0.6 : 1 }}>
                  {pdfGenerating ? '⏳ Generating...' : '📄 Download PDF'}
                </button>
              )}
            </div>

            {/* Summary Cards */}
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
                      return `${Math.floor(totalMins / 60)}j ${totalMins % 60}m`
                    })()}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#a16207' }}>Total Jam Kerja</div>
                </div>
              </div>
            )}

            {/* Data Table */}
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

        {/* ═══════ ARSIP BULANAN TAB ═══════ */}
        {activeTab === 'arsip_bulanan' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📁 Arsip Rekap Piket Bulanan</h3>
              <select value={arsipYear} onChange={e => setArsipYear(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}>
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {arsipLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Memuat arsip bulanan...</div>
            ) : (
              <div className="arsip-grid">
                {arsipData.map(item => (
                  <div key={item.month} className={`arsip-folder ${item.count === 0 ? 'empty' : ''}`}>
                    <div className="arsip-folder-icon">{item.count > 0 ? '📂' : '📁'}</div>
                    <div className="arsip-folder-name">{MONTH_NAMES[item.month - 1]} {arsipYear}</div>
                    <div className="arsip-folder-stats">
                      <span>{item.count} laporan</span>
                      {item.count > 0 && <span> · {item.totalHours}</span>}
                    </div>
                    {item.count > 0 && (
                      <button
                        className="arsip-download-btn"
                        onClick={() => handleArsipDownload(item.month)}
                        disabled={arsipPdfGen === item.month}
                      >
                        {arsipPdfGen === item.month ? '⏳ Generating...' : '📄 Download PDF'}
                      </button>
                    )}
                    {item.count === 0 && (
                      <span className="arsip-empty-label">Belum ada data</span>
                    )}
                  </div>
                ))}
                {arsipData.length === 0 && !arsipLoading && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Tidak ada data untuk tahun {arsipYear}</div>
                )}
              </div>
            )}
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

        .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
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

        .portal-grid > .card { flex: 1; min-width: 0; }

        .card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-primary-light);
        }
        .card-desc { color: var(--color-text-muted); font-size: 0.9375rem; margin-bottom: var(--spacing-lg); }

        .menu-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .menu-item {
          display: flex; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-lg);
          background: var(--color-bg-secondary); border-radius: var(--radius-lg);
          text-decoration: none; color: var(--color-text-primary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-size: 1rem;
        }
        .menu-item:hover {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white; transform: translateX(8px); box-shadow: var(--shadow-md);
        }

        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: var(--spacing-md) var(--spacing-lg); text-align: left; border-bottom: 1px solid rgba(139, 69, 19, 0.1); }
        .data-table tr { transition: all 0.2s ease; }
        .data-table tbody tr:hover { background: var(--color-bg-secondary); }
        .data-table th { font-weight: 600; color: var(--color-text-secondary); font-size: 0.875rem; }

        .log-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .log-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); font-size: 0.9375rem; transition: all 0.2s ease; border-radius: var(--radius-md); }
        .log-item:hover { background: var(--color-bg-secondary); transform: translateX(4px); }
        .log-action { padding: 4px 10px; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600; }
        .log-action.edit { background: var(--color-warning-light); color: #854D0E; }
        .log-action.create { background: var(--color-success-light); color: #166534; }
        .log-action.delete { background: var(--color-error-light); color: #991B1B; }
        .log-detail { flex: 1; }
        .log-time { color: var(--color-text-muted); font-size: 0.8125rem; }

        /* ═══════ Arsip Bulanan Grid ═══════ */
        .arsip-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .arsip-folder {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px 20px;
          text-align: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .arsip-folder:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          border-color: var(--color-primary, #8B4513);
        }

        .arsip-folder.empty {
          opacity: 0.5;
        }
        .arsip-folder.empty:hover {
          transform: none;
          box-shadow: none;
          border-color: #e5e7eb;
        }

        .arsip-folder-icon {
          font-size: 2.5rem;
          line-height: 1;
        }

        .arsip-folder-name {
          font-weight: 700;
          font-size: 1rem;
          color: var(--color-text-primary, #111);
        }

        .arsip-folder-stats {
          font-size: 0.82rem;
          color: #6b7280;
        }

        .arsip-download-btn {
          margin-top: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          background: #dc2626;
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.82rem;
          transition: all 0.2s;
        }
        .arsip-download-btn:hover {
          background: #b91c1c;
          transform: scale(1.04);
        }
        .arsip-download-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .arsip-empty-label {
          margin-top: 4px;
          font-size: 0.78rem;
          color: #9ca3af;
          font-style: italic;
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
          .portal-grid { flex-direction: column; }
          .arsip-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
        }
      `}</style>
    </div>
  )
}
