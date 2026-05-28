'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import SlipGajiWidget from '@/components/bendahara/SlipGajiWidget'
import ProkerBoard from '@/components/dashboard/ProkerBoard'

import { Wallet, ArrowDownLeft, TrendingDown, ClipboardCheck, ArrowRight, Activity, PlusCircle, Folder, FolderOpen, ChevronDown, ChevronRight, Trash2, FileText, KanbanSquare } from 'lucide-react'

export default function BendaharaPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'proker' | 'incoming' | 'distribusi' | 'slip_gaji'>('proker')
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }))
  }

  const [distForm, setDistForm] = useState({ division: 'bpupd', amount: '', description: '', date: new Date().toISOString().split('T')[0] })
  const [distHistory, setDistHistory] = useState<any[]>([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [pendingFunds, setPendingFunds] = useState<any[]>([])
  const [approvedFunds, setApprovedFunds] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(true)

  // Current month constants
  const NOW = new Date()
  const CURRENT_MONTH = NOW.getMonth()
  const CURRENT_YEAR = NOW.getFullYear()
  const currentMonthLabel = NOW.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  // Helper: is this cashflow within current month?
  const isCurrentMonth = (dateStr: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getMonth() === CURRENT_MONTH && d.getFullYear() === CURRENT_YEAR
  }

  const fetchData = async () => {
    setIsRefreshing(true)
    try {
      // Fetch ALL cashflow (no month filter) for history/archive
      const res = await fetch('/api/finance')
      if (res.ok) {
        const data = await res.json()
        const cashflow = data.cashflow || []
        
        // Distributions history (sent by bendahara) — ALL months
        const history = cashflow.filter((c: any) => c.category === 'treasurer_funding' && c.type === 'in')
        setDistHistory(history)

        if (history.length > 0) {
           const d = new Date(history[0].transactionDate || new Date())
           const monthYear = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
           setExpandedMonths(prev => ({ ...prev, [monthYear]: true }))
        }

        // ── Summary: ONLY current month ──
        const currentCashflow = cashflow.filter((c: any) => isCurrentMonth(c.transactionDate))

        let totalIncome = 0
        currentCashflow.filter((c: any) => 
            c.type === 'in' && 
            c.category !== 'treasurer_funding' && 
            c.approvalStatus === 'approved' &&
            c.currency === 'EGP'
        ).forEach((c: any) => totalIncome += c.amount)
        
        let totalDistribusi = 0
        currentCashflow.filter((c: any) => 
            c.type === 'in' && 
            c.category === 'treasurer_funding' && 
            c.currency === 'EGP'
        ).forEach((c: any) => totalDistribusi += c.amount)

        let totalOperasional = 0
        currentCashflow.filter((c: any) => 
            c.type === 'out' && 
            c.currency === 'EGP'
        ).forEach((c: any) => totalOperasional += c.amount)

        // Total Pengeluaran = Uang pengeluaran operasional per bulannya
        let totalExpense = totalOperasional

        // Total Saldo Aktif = Saldo sisa operasional (Distribusi - Operasional)
        let totalBalance = totalDistribusi - totalOperasional

        setSummary({ income: totalIncome, expense: totalExpense, balance: totalBalance })

        // Pending Funds — show ALL pending (regardless of month)
        const pending = cashflow.filter((c: any) => 
          c.type === 'in' && 
          c.approvalStatus === 'pending' &&
          !(c.description || '').startsWith('Invoice #')
        )
        setPendingFunds(pending)

        // Approved Funds (Riwayat Setoran) — ALL months for archive
        const approved = cashflow.filter((c: any) => 
          c.type === 'in' && 
          c.approvalStatus === 'approved' &&
          c.category !== 'treasurer_funding' &&
          !(c.description || '').startsWith('Invoice #')
        )
        setApprovedFunds(approved)
      }
    } catch (e) { console.error(e) }
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const submitDistribusi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!distForm.amount || !distForm.description) return
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'in', 
          category: 'treasurer_funding',
          division: distForm.division,
          amount: distForm.amount,
          currency: 'EGP',
          description: distForm.description,
          transactionDate: distForm.date || new Date().toISOString().split('T')[0]
        })
      })
      if (res.ok) {
        setDistForm({ division: 'bpupd', amount: '', description: '', date: new Date().toISOString().split('T')[0] })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to distribute funds', error)
      alert('Gagal mengirim dana')
    }
  }

  const deleteDistribusi = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data distribusi ini? Saldo divisi terkait akan kembali seperti semula.')) return
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      } else {
        alert('Gagal menghapus data')
      }
    } catch (e) {
      console.error(e)
    }
  }



  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approvalStatus: status })
      })
      if (res.ok) {
        fetchData()
        alert(status === 'approved' ? 'Dana berhasil disetujui!' : 'Setoran ditolak.')
      } else {
        alert('Gagal memproses persetujuan.')
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan saat menghubungi server.')
    }
  }

  return (
    <PortalPinGuard portalName="Bendahara" useOtp otpEndpoint="/api/otp/bendahara">
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="portal-header">
            <div>
              <h1>🛡️ Bendahara Umum</h1>
              <p className="portal-subtitle">Sistem Manajemen Keuangan Pusat — <strong>{currentMonthLabel}</strong></p>
            </div>
            {isRefreshing ? (
               <span className="badge badge-info shrink-0"><Activity size={14} className="animate-spin" /> Syncing...</span>
            ) : (
               <span className="badge badge-success shrink-0"><ClipboardCheck size={14} /> Terverifikasi</span>
            )}
          </div>

          {/* ── Tab Navigation ── */}
          <div className="tabs-container">
            <div className="tabs">
              {[
                { key: 'proker' as const, icon: <KanbanSquare size={18} />, label: 'Proker Bulanan' },
                { key: 'incoming' as const, icon: <ArrowDownLeft size={18} />, label: 'Incoming Funds' },
                { key: 'distribusi' as const, icon: <ArrowRight size={18} />, label: 'Distribusi Operasional' },
                { key: 'slip_gaji' as const, icon: <FileText size={18} />, label: 'Generate Slip Gaji' },
              ].map(t => (
                <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="finance-section">
            <div className="cf-summary-row">
              <div className="cf-card cf-income-card">
                <div className="cf-card-icon"><ArrowDownLeft size={22} /></div>
                <div className="cf-card-body">
                  <span className="cf-card-label">Total Pemasukan</span>
                  <span className="cf-card-value">EGP {summary.income.toLocaleString()}</span>
                  <span className="cf-card-sub">{currentMonthLabel}</span>
                </div>
              </div>
              <div className="cf-card cf-expense-card">
                <div className="cf-card-icon"><TrendingDown size={22} /></div>
                <div className="cf-card-body">
                  <span className="cf-card-label">Total Pengeluaran</span>
                  <span className="cf-card-value">EGP {summary.expense.toLocaleString()}</span>
                  <span className="cf-card-sub">{currentMonthLabel}</span>
                </div>
              </div>
              <div className={`cf-card cf-balance-card ${summary.balance < 0 ? 'cf-negative' : ''}`}>
                <div className="cf-card-icon"><Wallet size={22} /></div>
                <div className="cf-card-body">
                  <span className="cf-card-label">Total Saldo Aktif</span>
                  <span className="cf-card-value">EGP {summary.balance.toLocaleString()}</span>
                  <span className="cf-card-sub">{currentMonthLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ TAB: Proker Bulanan ═══════ */}
          {activeTab === 'proker' && (
            <ProkerBoard 
              category="bendahara" 
              staffList={[
                { name: 'Bendahara Umum', initials: 'BU', color: '#10b981' },
                { name: 'Staff Bendahara', initials: 'SB', color: '#8b5cf6' }
              ]} 
            />
          )}

          {/* ═══════ TAB: Incoming Funds ═══════ */}
          {activeTab === 'incoming' && (
            <div className="finance-section">
              <div className="cf-section">
                <div className="cf-section-header income-header">
                  <span className="cf-section-title"><ArrowDownLeft size={18} /> Pending Approval</span>
                  <span className="cf-readonly-badge">{pendingFunds.length} menunggu</span>
                </div>
                <div className="cf-timeline">
                  {pendingFunds.length === 0 ? (
                    <div className="cf-empty"><ClipboardCheck size={28} style={{ color: '#10b981' }} /><p>Semua dana telah disetujui.</p></div>
                  ) : (
                    pendingFunds.map(p => (
                      <div key={p.id} className="pending-item">
                        <div>
                          <strong>{p.description}</strong>
                          <div className="hi-badge" style={{ display: 'inline-block', marginLeft: 8 }}>{p.division}</div>
                          <span className="amount">EGP {p.amount?.toLocaleString()}</span>
                        </div>
                        <div className="actions">
                          <button className="approve-btn" onClick={() => handleApproval(p.id, 'approved')}>Approve</button>
                          <button className="reject-btn" onClick={() => handleApproval(p.id, 'rejected')}>Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="cf-section" style={{ marginTop: '1.5rem' }}>
                <div className="cf-section-header">
                  <span className="cf-section-title"><Folder size={18} /> Riwayat Setoran (Approved)</span>
                </div>
                <div className="cf-timeline">
                  {(() => {
                    const grouped = approvedFunds.reduce((acc, h) => {
                      if (!h.transactionDate) return acc
                      const d = new Date(h.transactionDate)
                      const my = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
                      if (!acc[my]) acc[my] = []
                      acc[my].push(h)
                      return acc
                    }, {} as Record<string, any[]>)
                    return Object.keys(grouped).length === 0 ? (
                      <div className="cf-empty"><p>Belum ada riwayat setoran.</p></div>
                    ) : (
                      Object.entries(grouped).map(([month, items]: [string, any]) => {
                        const isExp = !!expandedMonths[month]
                        return (
                          <div key={month} className="month-folder">
                            <button type="button" className="folder-header" onClick={() => toggleMonth(month)}>
                              <div className="folder-title">{isExp ? <FolderOpen size={18} className="folder-icon" /> : <Folder size={18} className="folder-icon" />}<span>{month}</span><span className="folder-count">{items.length}</span></div>
                              {isExp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            {isExp && <div className="folder-content">{items.map((item: any) => (
                              <div key={item.id} className="history-item"><div className="history-info"><span className="history-desc">{item.description}</span><span className="history-date">{new Date(item.transactionDate).toLocaleDateString('id-ID')} • {item.division?.toUpperCase()}</span></div><div className="history-amount text-success">+ EGP {item.amount?.toLocaleString()}</div></div>
                            ))}</div>}
                          </div>
                        )
                      })
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ TAB: Distribusi ═══════ */}
          {activeTab === 'distribusi' && (
            <div className="finance-section">
              <div className="cf-section">
                <div className="cf-section-header expense-header">
                  <span className="cf-section-title"><ArrowRight size={18} /> Kirim Dana Operasional</span>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <form className="dist-form" onSubmit={submitDistribusi}>
                    <div className="dist-group"><label>Pilih Divisi Penerima</label>
                      <select className="dist-input" value={distForm.division} onChange={e => setDistForm({...distForm, division: e.target.value})}>
                        <option value="bpupd">BPUPD (Pengembangan Usaha & Pengelolaan Dana)</option>
                        <option value="bppg">BPPG (Perbaikan & Pemeliharaan Gedung)</option>
                        <option value="pmik">PMIK (Perpustakaan, Media, Informasi & Komunikasi)</option>
                        <option value="dapur">Dapur</option>
                      </select>
                    </div>
                    <div className="dist-row">
                      <div className="dist-group"><label>Tanggal *</label><input type="date" required className="dist-input" value={distForm.date} onChange={e => setDistForm({...distForm, date: e.target.value})} /></div>
                      <div className="dist-group"><label>Jumlah (EGP) *</label><input type="number" required className="dist-input" placeholder="0" value={distForm.amount} onChange={e => setDistForm({...distForm, amount: e.target.value})} /></div>
                    </div>
                    <div className="dist-group"><label>Keterangan / Tujuan Dana *</label><input type="text" required className="dist-input" placeholder="Contoh: Dana Operasional April" value={distForm.description} onChange={e => setDistForm({...distForm, description: e.target.value})} /></div>
                    <button type="submit" className="cf-submit-btn"><ArrowRight size={16} /> Distribusikan Dana</button>
                  </form>
                </div>
              </div>

              <div className="cf-section" style={{ marginTop: '1.5rem' }}>
                <div className="cf-section-header"><span className="cf-section-title"><Folder size={18} /> Riwayat Distribusi</span></div>
                <div className="cf-timeline">
                  {(() => {
                    const grouped = distHistory.reduce((acc, h) => {
                      if (!h.transactionDate) return acc
                      const d = new Date(h.transactionDate)
                      const my = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
                      if (!acc[my]) acc[my] = []
                      acc[my].push(h)
                      return acc
                    }, {} as Record<string, any[]>)
                    return Object.keys(grouped).length === 0 ? (
                      <div className="cf-empty"><p>Belum ada data distribusi.</p></div>
                    ) : (
                      Object.entries(grouped).map(([month, items]: [string, any]) => {
                        const isExp = !!expandedMonths[month]
                        return (
                          <div key={month} className="month-folder">
                            <button type="button" className="folder-header" onClick={() => toggleMonth(month)}>
                              <div className="folder-title">{isExp ? <FolderOpen size={18} className="folder-icon" /> : <Folder size={18} className="folder-icon" />}<span>{month}</span><span className="folder-count">{items.length}</span></div>
                              {isExp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            {isExp && <div className="folder-content">{items.map((h: any) => (
                              <div key={h.id} className="history-item">
                                <div><div className="hi-title">{h.description} <span className="hi-badge">{h.division}</span></div><div className="hi-date">{h.transactionDate ? h.transactionDate.split('T')[0] : ''}</div></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div className="hi-amount">- EGP {h.amount?.toLocaleString()}</div>
                                  <button type="button" onClick={() => deleteDistribusi(h.id)} className="delete-btn" title="Hapus"><Trash2 size={16} /></button>
                                </div>
                              </div>
                            ))}</div>}
                          </div>
                        )
                      })
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ TAB: Slip Gaji ═══════ */}
          {activeTab === 'slip_gaji' && (
            <div className="finance-section">
              <SlipGajiWidget />
            </div>
          )}
        </main>

        <style jsx>{`
          /* Mobile-First Fullwidth (matches BPUPD/PMIK) */
          .dashboard-layout { display: flex; min-height: 100vh; background: var(--color-bg-primary); font-family: var(--font-sans); color: var(--color-text-primary); }
          .main-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding-bottom: 80px; animation: fadeIn 0.4s ease-out forwards; }
          h1, h2, h3, h4 { font-family: var(--font-heading); }

          .portal-header { padding: var(--spacing-lg); background: var(--color-bg-card); border-bottom: 1px solid var(--color-bg-secondary); display: flex; align-items: center; justify-content: space-between; }
          .portal-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.25rem 0; line-height: 1.2; }
          .portal-subtitle { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; font-weight: 500; }
          .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
          .badge-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .badge-info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
          .shrink-0 { flex-shrink: 0; }

          /* Tabs */
          .tabs-container { margin: var(--spacing-md) 0 var(--spacing-lg) 0; padding: 0 var(--spacing-lg); overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .tabs-container::-webkit-scrollbar { display: none; }
          .tabs { display: inline-flex; gap: var(--spacing-sm); padding-right: var(--spacing-lg); }
          .tab { display: flex; align-items: center; gap: var(--spacing-xs); padding: 0.75rem 1.25rem; border: 1px solid var(--color-bg-secondary); border-radius: var(--radius-full); background: var(--color-bg-card); color: var(--color-text-secondary); font-weight: 600; font-size: 0.9rem; white-space: nowrap; transition: all 0.2s; cursor: pointer; }
          .tab.active { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: #fff; border-color: var(--color-primary); box-shadow: var(--shadow-md); }

          /* Finance Section */
          .finance-section { padding: 0 var(--spacing-lg); margin-bottom: var(--spacing-lg); }

          /* Summary Cards */
          .cf-summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; animation: slideUp 0.4s ease-out forwards; }
          .cf-card { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem; transition: transform 0.2s, box-shadow 0.2s; }
          .cf-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
          .cf-card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .cf-income-card .cf-card-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .cf-expense-card .cf-card-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
          .cf-balance-card .cf-card-icon { background: rgba(139, 69, 19, 0.1); color: var(--color-primary); }
          .cf-negative { border-color: #ef4444 !important; background: rgba(239, 68, 68, 0.02); }
          .cf-negative .cf-card-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
          .cf-card-body { display: flex; flex-direction: column; gap: 0.2rem; }
          .cf-card-label { font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
          .cf-card-value { font-size: 1.35rem; font-weight: 800; color: var(--color-text-primary); font-family: var(--font-heading); }
          .cf-card-sub { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; }

          /* Section Card */
          .cf-section { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); overflow: hidden; }
          .cf-section-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
          .income-header { background: rgba(16, 185, 129, 0.03); }
          .expense-header { background: rgba(239, 68, 68, 0.03); }
          .cf-section-title { font-weight: 700; font-size: 1rem; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem; }
          .cf-readonly-badge { font-size: 0.7rem; font-weight: 700; background: var(--color-bg-secondary); padding: 4px 8px; border-radius: 6px; color: var(--color-text-muted); }
          .cf-timeline { padding: 1.25rem; display: flex; flex-direction: column; gap: 0; }
          .cf-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px; color: var(--color-text-muted); text-align: center; }
          .cf-empty p { font-size: 0.82rem; margin: 0; }

          /* Pending Items */
          .pending-item { display: flex; flex-direction: column; padding: 1.25rem; background: var(--color-bg-secondary); border-radius: 12px; border: 1px solid transparent; transition: all 0.2s; margin-bottom: 0.75rem; }
          .pending-item:hover { border-color: var(--color-border); background: var(--color-bg-card); }
          .pending-item > div:first-child { margin-bottom: 1rem; }
          .pending-item strong { display: block; color: var(--color-text-primary); font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem; }
          .amount { display: block; font-size: 1.15rem; font-weight: 800; color: #10b981; margin-top: 0.5rem; }
          .actions { display: flex; gap: 0.5rem; width: 100%; }
          .approve-btn { flex: 1; padding: 0.6rem; font-size: 0.85rem; border-radius: 8px; font-weight: 600; background: #10b981; color: white; border: none; cursor: pointer; transition: opacity 0.2s; }
          .approve-btn:hover { opacity: 0.88; }
          .reject-btn { flex: 1; padding: 0.6rem; font-size: 0.85rem; border-radius: 8px; font-weight: 600; background: #ef4444; color: white; border: none; cursor: pointer; transition: opacity 0.2s; }
          .reject-btn:hover { opacity: 0.88; }

          /* Distribusi Form */
          .dist-form { display: flex; flex-direction: column; gap: 1rem; }
          .dist-group { display: flex; flex-direction: column; gap: 0.4rem; }
          .dist-group label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); }
          .dist-row { display: flex; gap: 1rem; }
          .dist-row .dist-group { flex: 1; }
          .dist-input { padding: 0.75rem 1rem; border: 1.5px solid var(--color-bg-secondary); border-radius: 10px; background: var(--color-bg-primary); font-size: 0.85rem; outline: none; transition: all 0.2s; font-family: inherit; color: var(--color-text-primary); }
          .dist-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1); }
          .cf-submit-btn { margin-top: 0.5rem; width: 100%; padding: 0.875rem; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 0.5rem; transition: transform 0.2s, opacity 0.2s; }
          .cf-submit-btn:hover { transform: translateY(-1px); opacity: 0.92; }

          /* Folder & History */
          .month-folder { margin-bottom: 0.75rem; background: var(--color-bg-secondary); border-radius: 12px; border: 1px solid var(--color-border); overflow: hidden; }
          .month-folder:hover { border-color: var(--color-primary-light); }
          .folder-header { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: transparent; border: none; cursor: pointer; color: var(--color-text); transition: background 0.2s; }
          .folder-header:hover { background: var(--color-bg-highlight); }
          .folder-title { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.95rem; }
          .folder-icon { color: var(--color-primary); }
          .folder-count { font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700; background: var(--color-bg-primary); padding: 2px 8px; border-radius: 10px; border: 1px solid var(--color-border); }
          .folder-content { padding: 0 1rem 1rem 1rem; animation: fadeIn 0.3s ease; }
          .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.875rem; background: var(--color-bg-primary); border-radius: 10px; margin-bottom: 0.5rem; border: 1px solid var(--color-border); transition: all 0.2s; }
          .history-item:hover { border-color: var(--color-primary-light); }
          .history-info { display: flex; flex-direction: column; gap: 2px; }
          .history-desc { font-weight: 600; font-size: 0.88rem; color: var(--color-text-primary); }
          .history-date { font-size: 0.72rem; color: var(--color-text-muted); }
          .history-amount { font-weight: 700; font-size: 0.92rem; }
          .text-success { color: #10b981; }
          .hi-title { font-weight: 600; font-size: 0.88rem; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem; }
          .hi-badge { background: rgba(139,69,19,0.1); color: var(--color-primary-dark); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
          .hi-date { font-size: 0.72rem; color: var(--color-text-muted); margin-top: 3px; }
          .hi-amount { font-weight: 700; color: #ef4444; font-size: 0.92rem; }
          .delete-btn { background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s; }
          .delete-btn:hover { background: #ef4444; color: white; }
          .text-muted { color: var(--color-text-muted); font-size: 0.85rem; }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

          /* Desktop scale-up */
          @media (min-width: 768px) {
            .portal-header { padding: var(--spacing-lg) var(--spacing-2xl); }
            .tabs-container { margin: var(--spacing-xl) 0 var(--spacing-xl) var(--spacing-2xl); }
            .finance-section { padding: 0 var(--spacing-2xl); }
          }
          @media (max-width: 1024px) {
            .cf-summary-row { grid-template-columns: 1fr; }
          }
          @media (max-width: 768px) {
            .portal-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
            .cf-card { padding: 1rem; gap: 0.75rem; }
            .cf-card-icon { width: 36px; height: 36px; }
            .cf-card-value { font-size: 1.1rem; }
            .cf-section-header { padding: 1rem; }
            .dist-row { flex-direction: column; gap: 0.75rem; }
          }
        `}</style>
      </div>
    </PortalPinGuard>
  )
}
