'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Plus, Trash2, Eye, Wallet, BarChart3, Download, ArrowDownLeft, TrendingDown, ClipboardList } from 'lucide-react'
import jsPDF from 'jspdf'

export default function BPPGPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'dana_ops'>('tasks')

  // --- EXISTING BPPG TASKS STATE ---
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

  // --- DANA OPERASIONAL STATE ---
  const CURRENT_MONTH = new Date().getMonth()
  const CURRENT_YEAR = new Date().getFullYear()

  const [cfMonth, setCfMonth] = useState(CURRENT_MONTH)
  const [cfYear, setCfYear] = useState(CURRENT_YEAR)
  const [transactions, setTransactions] = useState<any[]>([])
  const [fiscalChartData, setFiscalChartData] = useState<any[]>([])
  const [financeForm, setFinanceForm] = useState({ description: '', amount: '', transactionDate: new Date().toISOString().split('T')[0] })

  // Build fiscal year months: Feb of start year → Jan of next year
  const buildFiscalMonths = () => {
    const fiscalStartYear = CURRENT_MONTH >= 1 ? CURRENT_YEAR : CURRENT_YEAR - 1
    const months: { month: number; year: number; label: string }[] = []
    for (let i = 0; i < 12; i++) {
      let m = 1 + i
      let y = fiscalStartYear
      if (m > 11) { m -= 12; y += 1 }
      const d = new Date(y, m, 1)
      months.push({ month: m, year: y, label: d.toLocaleString('id-ID', { month: 'short' }) })
    }
    return months
  }
  const fiscalMonths = buildFiscalMonths()

  const fetchFiscalChart = async () => {
    try {
      const res = await fetch('/api/finance?division=bppg')
      if (res.ok) {
        const data = await res.json()
        const allCf = data.cashflow || []
        const months = buildFiscalMonths()
        const chartData = months.map(fm => {
          const monthCf = allCf.filter((c: any) => {
            const cd = new Date(c.transactionDate)
            return cd.getMonth() === fm.month && cd.getFullYear() === fm.year
          })
          const income = monthCf.filter((c: any) => c.type === 'in' && c.category === 'treasurer_funding').reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
          const expense = monthCf.filter((c: any) => c.type === 'out').reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
          return { ...fm, income, expense }
        })
        setFiscalChartData(chartData)
      }
    } catch (error) {
      console.error('Failed to fetch fiscal chart', error)
    }
  }

  const fetchCashflow = async (month: number, year: number) => {
    try {
      const res = await fetch(`/api/finance?month=${month}&year=${year}&division=bppg`)
      if (res.ok) {
        const data = await res.json()
        const mapped = (data.cashflow || []).map((item: any) => ({
          id: item.id,
          date: item.transactionDate ? item.transactionDate.split('T')[0] : '',
          category: item.category,
          amount: item.amount,
          currency: item.currency,
          type: item.type,
          description: item.description,
          status: item.approvalStatus,
        }))
        setTransactions(mapped)
      }
    } catch (error) {
      console.error('Failed to fetch finance', error)
    }
  }

  useEffect(() => {
    fetchFiscalChart()
  }, [])

  useEffect(() => {
    fetchCashflow(cfMonth, cfYear)
  }, [cfMonth, cfYear])

  const submitFinanceForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!financeForm.description || !financeForm.amount) return
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...financeForm,
          type: 'out',
          category: 'operational',
          currency: 'EGP',
          division: 'bppg'
        }),
      })
      if (res.ok) {
        setFinanceForm({ description: '', amount: '', transactionDate: new Date().toISOString().split('T')[0] })
        fetchCashflow(cfMonth, cfYear)
        fetchFiscalChart()
      }
    } catch (error) {
      console.error('Failed to submit finance form', error)
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Yakin hapus transaksi ini?')) return
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCashflow(cfMonth, cfYear)
        fetchFiscalChart()
      }
    } catch (error) {
      console.error('Failed to delete transaction', error)
    }
  }

  const generateCashflowPDF = (month: number, year: number, data: any[]) => {
    const doc = new jsPDF()
    const monthName = new Date(year, month, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    doc.setFontSize(16)
    doc.text('Laporan Dana Operasional BPPG', 105, 22, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Periode: ${monthName}`, 105, 30, { align: 'center' })

    const inc = data.filter(t => t.type === 'in' && t.category === 'treasurer_funding').reduce((sum, t) => sum + t.amount, 0)
    const exp = data.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0)
    const bal = inc - exp

    doc.setFontSize(10)
    doc.text(`Total Dana Diterima: EGP ${inc.toLocaleString()}`, 20, 45)
    doc.text(`Total Belanja: EGP ${exp.toLocaleString()}`, 20, 52)
    doc.text(`Sisa Saldo: EGP ${bal.toLocaleString()}`, 20, 59)

    doc.text('Rincian Belanja:', 20, 75)
    let y = 85
    const expenses = data.filter(t => t.type === 'out')
    if (expenses.length === 0) {
      doc.text('- Belum ada data belanja -', 20, y)
    } else {
      expenses.forEach((t, i) => {
        doc.text(`${i + 1}. ${t.date} - ${t.description} : EGP ${t.amount.toLocaleString()}`, 20, y)
        y += 7
      })
    }
    doc.save(`Laporan_Ops_BPPG_${monthName}.pdf`)
  }

  // Calc totals
  const totalIncome = transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0)
  const remainingBalance = totalIncome - totalExpense

  return (
    <PortalPinGuard portalName="BPPG" expectedPin={process.env.NEXT_PUBLIC_BPPG_PIN}>
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="portal-header">
            <div>
                <h1>🛠️ Portal BPPG</h1>
                <p>Maintenance, Housekeeping, & Operasional</p>
            </div>
          </div>

          <div className="tabs-container">
            <div className="tabs">
              {[
                { key: 'tasks', icon: <ClipboardList size={18} />, label: 'Maintenance & Tasks' },
                { key: 'dana_ops', icon: <Wallet size={18} />, label: 'Dana Operasional' },
              ].map(t => (
                <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key as any)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'tasks' && (
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
          )}

          {activeTab === 'dana_ops' && (
             <div className="cashflow-dashboard">

             {/* ── Fiscal Year Chart ── */}
             {fiscalChartData.length > 0 && (() => {
               const maxVal = Math.max(...fiscalChartData.map(b => Math.max(b.income, b.expense)), 1)
               const totalYearIncome  = fiscalChartData.reduce((a, b) => a + b.income, 0)
               const totalYearExpense = fiscalChartData.reduce((a, b) => a + b.expense, 0)
               return (
                 <div className="fy-chart-card">
                   <div className="fy-chart-header">
                     <div className="fy-chart-title-row">
                       <BarChart3 size={20} style={{ color: 'var(--color-primary)' }} />
                       <h3>Grafik Operasional Tahunan</h3>
                     </div>
                     <div className="fy-chart-legend">
                       <span className="fy-legend-item"><span className="fy-legend-dot fy-dot-income" /> Dana Masuk <strong>EGP {totalYearIncome.toLocaleString()}</strong></span>
                       <span className="fy-legend-item"><span className="fy-legend-dot fy-dot-expense" /> Belanja <strong>EGP {totalYearExpense.toLocaleString()}</strong></span>
                     </div>
                   </div>
                   <div className="fy-chart-body">
                     <div className="fy-y-axis">
                       <span>{maxVal.toLocaleString()}</span>
                       <span>{Math.round(maxVal * 0.75).toLocaleString()}</span>
                       <span>{Math.round(maxVal * 0.5).toLocaleString()}</span>
                       <span>{Math.round(maxVal * 0.25).toLocaleString()}</span>
                       <span>0</span>
                     </div>
                     <div className="fy-bars-area">
                       <div className="fy-gridlines">
                         <div className="fy-gridline" style={{ bottom: '25%' }} />
                         <div className="fy-gridline" style={{ bottom: '50%' }} />
                         <div className="fy-gridline" style={{ bottom: '75%' }} />
                         <div className="fy-gridline" style={{ bottom: '100%' }} />
                       </div>
                       {fiscalChartData.map((bar, i) => {
                         const incPct = maxVal > 0 ? (bar.income / maxVal) * 100 : 0
                         const expPct = maxVal > 0 ? (bar.expense / maxVal) * 100 : 0
                         const isSel = bar.month === cfMonth && bar.year === cfYear
                         return (
                           <div key={i} className={`fy-bar-group ${isSel ? 'fy-bar-selected' : ''}`} onClick={() => { setCfMonth(bar.month); setCfYear(bar.year) }}>
                             <div className="fy-bar-pair">
                               <div className="fy-bar fy-bar-income" style={{ height: `${incPct}%` }}>
                                 {bar.income > 0 && <span className="fy-bar-tooltip">{bar.income.toLocaleString()}</span>}
                               </div>
                               <div className="fy-bar fy-bar-expense" style={{ height: `${expPct}%` }}>
                                 {bar.expense > 0 && <span className="fy-bar-tooltip">{bar.expense.toLocaleString()}</span>}
                               </div>
                             </div>
                             <span className="fy-bar-label">{bar.label}</span>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 </div>
               )
             })()}

             {/* ── Month Navigator ── */}
             <div className="cf-month-nav">
               <div className="cf-month-nav-header">
                 <span className="cf-fiscal-label">📅 Tahun Fiskal — {fiscalMonths[0]?.label} {fiscalMonths[0]?.year} s/d {fiscalMonths[11]?.label} {fiscalMonths[11]?.year}</span>
               </div>
               <div className="cf-month-pills">
                 {fiscalMonths.map((fm) => {
                   const isCurrent = fm.month === CURRENT_MONTH && fm.year === CURRENT_YEAR
                   const isSelected = fm.month === cfMonth && fm.year === cfYear
                   const isPast = new Date(fm.year, fm.month, 1) < new Date(CURRENT_YEAR, CURRENT_MONTH, 1)
                   return (
                     <button
                       key={`${fm.year}-${fm.month}`}
                       className={`cf-month-pill ${isSelected ? 'cf-mp-selected' : ''} ${isCurrent ? 'cf-mp-current' : ''} ${isPast ? 'cf-mp-past' : ''}`}
                       onClick={() => { setCfMonth(fm.month); setCfYear(fm.year) }}
                     >
                       <span className="cf-mp-label">{fm.label}</span>
                       <span className="cf-mp-year">{String(fm.year).slice(2)}</span>
                       {isCurrent && <span className="cf-mp-dot" />}
                       {isPast && <span className="cf-mp-check">✓</span>}
                     </button>
                   )
                 })}
               </div>
             </div>

             {/* Summary Row */}
             <div className="cf-summary-row">
               <div className="cf-card cf-income-card">
                 <div className="cf-card-icon"><ArrowDownLeft size={22} /></div>
                 <div className="cf-card-body">
                   <span className="cf-card-label">Dana Diterima</span>
                   <span className="cf-card-value">EGP {totalIncome.toLocaleString()}</span>
                   <span className="cf-card-sub">dari Bendahara</span>
                 </div>
               </div>
               <div className="cf-card cf-expense-card">
                 <div className="cf-card-icon"><TrendingDown size={22} /></div>
                 <div className="cf-card-body">
                   <span className="cf-card-label">Total Belanja</span>
                   <span className="cf-card-value">EGP {totalExpense.toLocaleString()}</span>
                   <span className="cf-card-sub">sudah dipakai</span>
                 </div>
               </div>
               <div className={`cf-card cf-balance-card ${remainingBalance < 0 ? 'cf-negative' : ''}`}>
                 <div className="cf-card-icon"><Wallet size={22} /></div>
                 <div className="cf-card-body">
                   <span className="cf-card-label">Sisa Saldo</span>
                   <span className="cf-card-value">EGP {remainingBalance.toLocaleString()}</span>
                   <span className="cf-card-sub">{remainingBalance < 0 ? '⚠️ melebihi anggaran' : 'tersisa'}</span>
                 </div>
               </div>
             </div>

             {/* Budget Progress Bar */}
             {totalIncome > 0 && (
               <div className="cf-progress-wrapper">
                 <div className="cf-progress-header">
                   <span>Penggunaan Anggaran</span>
                   <span className={`cf-pct ${totalExpense / totalIncome > 0.8 ? 'cf-pct-danger' : ''}`}>
                     {Math.min(Math.round((totalExpense / totalIncome) * 100), 100)}% terpakai
                   </span>
                 </div>
                 <div className="cf-progress-bar">
                   <div className="cf-progress-fill" style={{ width: `${Math.min((totalExpense / totalIncome) * 100, 100)}%`, background: totalExpense / totalIncome > 0.8 ? '#ef4444' : totalExpense / totalIncome > 0.6 ? '#f59e0b' : '#10b981' }} />
                 </div>
               </div>
             )}

             <div className="cf-two-col">
               {/* LEFT — Dana Masuk */}
               <div className="cf-section">
                 <div className="cf-section-header income-header">
                   <div className="cf-section-title"><ArrowDownLeft size={18} /> Dana dari Bendahara</div>
                   <span className="cf-readonly-badge">Read-Only</span>
                 </div>
                 <div className="cf-timeline">
                   {transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').length === 0 ? (
                     <div className="cf-empty"><Wallet size={32} /><p>Menunggu transfer dari Bendahara</p></div>
                   ) : (
                     transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').map(t => (
                       <div key={t.id} className="cf-timeline-item income-item">
                         <div className="cf-tl-dot income-dot" />
                         <div className="cf-tl-body">
                           <div className="cf-tl-top">
                             <span className="cf-tl-title">{t.description}</span>
                             <span className="cf-tl-amount">+ EGP {t.amount.toLocaleString()}</span>
                           </div>
                           <div className="cf-tl-bot">
                             <span className="cf-tl-date">{t.date}</span>
                           </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>

               {/* RIGHT — Form Belanja & Riwayat */}
               <div className="cf-section">
                 <div className="cf-section-header expense-header">
                   <div className="cf-section-title"><TrendingDown size={18} /> Catat Belanja</div>
                   <button className="cf-pdf-btn" onClick={() => generateCashflowPDF(cfMonth, cfYear, transactions)}><Download size={14} /> PDF</button>
                 </div>

                 <form className="cf-form" onSubmit={submitFinanceForm}>
                   <input required type="text" placeholder="Nama barang / keperluan *" className="cf-input" value={financeForm.description} onChange={e => setFinanceForm({ ...financeForm, description: e.target.value })} />
                   <div className="cf-form-row">
                     <div className="cf-input-group">
                       <label>Total Belanja (EGP) *</label>
                       <input required type="number" className="cf-input" value={financeForm.amount} onChange={e => setFinanceForm({ ...financeForm, amount: e.target.value })} />
                     </div>
                     <div className="cf-input-group">
                       <label>Tanggal *</label>
                       <input required type="date" className="cf-input" value={financeForm.transactionDate} onChange={e => setFinanceForm({ ...financeForm, transactionDate: e.target.value })} />
                     </div>
                   </div>
                   <button type="submit" className="cf-submit-btn"><Wallet size={16} /> Simpan Belanja</button>
                 </form>

                 <div className="cf-timeline">
                   {transactions.filter(t => t.type === 'out').length === 0 ? (
                     <div className="cf-empty"><ClipboardList size={32} /><p>Belum ada catatan belanja</p></div>
                   ) : (
                     transactions.filter(t => t.type === 'out').map(t => (
                       <div key={t.id} className="cf-timeline-item expense-item">
                         <div className="cf-tl-dot expense-dot" />
                         <div className="cf-tl-body">
                           <div className="cf-tl-top">
                             <span className="cf-tl-title">{t.description}</span>
                             <span className="cf-tl-amount">- EGP {t.amount.toLocaleString()}</span>
                           </div>
                           <div className="cf-tl-bot">
                             <span className="cf-tl-date">{t.date}</span>
                             <button onClick={() => deleteTransaction(t.id)} className="cf-tl-del"><Trash2 size={14} /></button>
                           </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
             </div>
           </div>
          )}
        </main>

        <style jsx>{`
        /* EXISTING BPPG STYLES */
        .dashboard-layout { display: flex; min-height: 100vh; background: var(--color-bg-primary); }
        .main-content { flex: 1; padding: var(--spacing-2xl); width: 100%; display: flex; flex-direction: column; animation: fadeIn 0.4s ease-out forwards; }
        .portal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-2xl); padding-bottom: var(--spacing-lg); border-bottom: 2px solid var(--color-border); }
        .portal-header h1 { font-size: 2rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.5rem 0; letter-spacing: -0.025em; }
        .portal-header p { font-size: 1rem; color: var(--color-text-muted); margin: 0; }
        .portal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--spacing-xl); animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--spacing-xl); border: 1px solid var(--color-border); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: all 0.2s ease-in-out; display: flex; flex-direction: column; }
        .card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); transform: translateY(-2px); border-color: var(--color-primary-light); }
        .card h3 { font-size: 1.25rem; font-weight: 600; color: var(--color-text); margin: 0 0 0.25rem 0; }
        .card-desc { color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: var(--spacing-xl); }
        .task-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .task-item { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg); background: var(--color-bg-secondary); border-radius: var(--radius-lg); border-left: 4px solid var(--color-text-muted); transition: all 0.3s ease; cursor: pointer; }
        .task-item.dirty { border-left-color: var(--color-warning); }
        .task-item.pending { border-left-color: var(--color-info); }
        .task-item.in_progress { border-left-color: var(--color-warning); }
        .task-item.done { border-left-color: var(--color-success); opacity: 0.7; }
        .task-info strong { display: block; margin-bottom: 6px; font-size: 1rem; }
        .task-info span { font-size: 0.875rem; color: var(--color-text-muted); }
        .empty-state { text-align: center; padding: var(--spacing-2xl); color: var(--color-success); font-size: 1.25rem; }
        .inventory-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-md); }
        .inventory-item { display: flex; justify-content: space-between; padding: var(--spacing-lg); background: var(--color-bg-secondary); border-radius: var(--radius-lg); }
        .item-count { font-weight: 600; font-size: 1rem; }
        .item-count.low { color: var(--color-error); }

        /* TABS */
        .tabs-container { margin: var(--spacing-md) 0 var(--spacing-lg) 0; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .tabs-container::-webkit-scrollbar { display: none; }
        .tabs { display: inline-flex; gap: var(--spacing-sm); padding-right: var(--spacing-lg); }
        .tab { display: flex; align-items: center; gap: var(--spacing-xs); padding: 0.75rem 1.25rem; border: 1px solid var(--color-bg-secondary); border-radius: var(--radius-full); background: var(--color-bg-card); color: var(--color-text-secondary); font-weight: 600; font-size: 0.9rem; white-space: nowrap; transition: all 0.2s; cursor: pointer; }
        .tab.active { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: #fff; border-color: var(--color-primary); box-shadow: var(--shadow-md); }

        /* DANA OPS STYLES */
        .cashflow-dashboard { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .fy-chart-card { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .fy-chart-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .fy-chart-title-row { display: flex; align-items: center; gap: 0.75rem; }
        .fy-chart-title-row h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--color-text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
        .fy-chart-legend { display: flex; gap: 1.25rem; font-size: 0.85rem; }
        .fy-legend-item { display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-secondary); }
        .fy-legend-item strong { color: var(--color-text-primary); font-size: 0.9rem; }
        .fy-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
        .fy-dot-income { background: #10b981; }
        .fy-dot-expense { background: #ef4444; }

        .fy-chart-body { display: flex; height: 220px; gap: 1rem; position: relative; }
        .fy-y-axis { display: flex; flex-direction: column; justify-content: space-between; text-align: right; font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; min-width: 40px; padding-bottom: 24px; }
        .fy-bars-area { flex: 1; position: relative; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 24px; }
        .fy-gridlines { position: absolute; top: 0; left: 0; right: 0; bottom: 24px; pointer-events: none; }
        .fy-gridline { position: absolute; left: 0; right: 0; height: 1px; background: var(--color-border); opacity: 0.5; }
        .fy-bar-group { width: 6%; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; border-radius: 8px; padding: 4px; }
        .fy-bar-group:hover { background: var(--color-bg-secondary); }
        .fy-bar-selected { background: rgba(139, 69, 19, 0.05) !important; border: 1px solid rgba(139, 69, 19, 0.1); }
        .fy-bar-pair { display: flex; gap: 2px; width: 100%; height: calc(100% - 20px); align-items: flex-end; justify-content: center; }
        .fy-bar { width: 45%; border-radius: 4px 4px 0 0; position: relative; transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .fy-bar-income { background: linear-gradient(to top, #059669, #34d399); }
        .fy-bar-expense { background: linear-gradient(to top, #dc2626, #f87171); }
        .fy-bar-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 0.7rem; font-weight: 700; padding: 4px 6px; border-radius: 4px; box-shadow: var(--shadow-sm); opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 10; border: 1px solid var(--color-border); }
        .fy-bar-group:hover .fy-bar-tooltip { opacity: 1; }
        .fy-bar-label { font-size: 0.65rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }

        .cf-month-nav { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .cf-month-nav-header { display: flex; justify-content: space-between; align-items: center; }
        .cf-fiscal-label { font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .cf-month-pills { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 0.5rem; }
        .cf-month-pill { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.75rem 0.5rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 12px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
        .cf-month-pill:hover { border-color: var(--color-primary-light); background: var(--color-bg-primary); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
        .cf-mp-selected { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%) !important; color: #fff; border-color: var(--color-primary) !important; box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2); }
        .cf-mp-past { opacity: 0.7; }
        .cf-mp-label { font-weight: 700; font-size: 0.9rem; margin-bottom: 2px; }
        .cf-mp-year { font-size: 0.7rem; opacity: 0.8; font-weight: 600; }
        .cf-mp-dot { width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; position: absolute; top: 6px; right: 6px; box-shadow: 0 0 0 2px var(--color-bg-card); }
        .cf-mp-check { position: absolute; bottom: -4px; right: 4px; font-size: 1.5rem; color: var(--color-text-muted); opacity: 0.15; font-weight: 900; }
        .cf-mp-selected .cf-mp-check { color: #fff; opacity: 0.2; }

        .cf-summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .cf-card { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); padding: 1.5rem; display: flex; align-items: flex-start; gap: 1.25rem; transition: transform 0.2s; }
        .cf-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .cf-card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cf-income-card .cf-card-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .cf-expense-card .cf-card-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .cf-balance-card .cf-card-icon { background: rgba(139, 69, 19, 0.1); color: var(--color-primary); }
        .cf-negative { border-color: #ef4444 !important; background: rgba(239, 68, 68, 0.02); }
        .cf-negative .cf-card-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .cf-card-body { display: flex; flex-direction: column; gap: 0.25rem; }
        .cf-card-label { font-size: 0.8rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .cf-card-value { font-size: 1.5rem; font-weight: 800; color: var(--color-text-primary); }
        .cf-card-sub { font-size: 0.8rem; color: var(--color-text-muted); }

        .cf-progress-wrapper { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); padding: 1.25rem 1.5rem; }
        .cf-progress-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
        .cf-pct-danger { color: #ef4444; }
        .cf-progress-bar { height: 10px; background: var(--color-bg-secondary); border-radius: 5px; overflow: hidden; }
        .cf-progress-fill { height: 100%; transition: width 0.5s ease-out; }

        .cf-two-col { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; align-items: start; }
        .cf-section { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); overflow: hidden; }
        .cf-section-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
        .income-header { background: rgba(16, 185, 129, 0.03); }
        .expense-header { background: rgba(239, 68, 68, 0.03); }
        .cf-section-title { font-weight: 700; font-size: 1rem; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem; }
        .cf-readonly-badge { font-size: 0.7rem; font-weight: 700; background: var(--color-bg-secondary); padding: 4px 8px; border-radius: 6px; color: var(--color-text-muted); }
        
        .cf-form { padding: 1.5rem; border-bottom: 1px solid var(--color-border); background: var(--color-bg-primary); }
        .cf-input-group { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .cf-input-group label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); }
        .cf-input { padding: 0.75rem 1rem; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg-card); font-size: 0.95rem; outline: none; width: 100%; transition: border-color 0.2s; }
        .cf-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1); }
        .cf-form-row { display: flex; gap: 1rem; margin-top: 1rem; margin-bottom: 1.25rem; }
        .cf-submit-btn { width: 100%; padding: 0.875rem; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 0.5rem; box-shadow: 0 4px 10px rgba(139, 69, 19, 0.2); transition: transform 0.2s; }
        .cf-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(139, 69, 19, 0.3); }

        .cf-timeline { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .cf-timeline-item { display: flex; gap: 1rem; position: relative; }
        .cf-timeline-item::before { content: ''; position: absolute; left: 6px; top: 20px; bottom: -20px; width: 2px; background: var(--color-border); }
        .cf-timeline-item:last-child::before { display: none; }
        .cf-tl-dot { width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--color-bg-card); box-shadow: 0 0 0 1px var(--color-border); z-index: 1; margin-top: 4px; }
        .income-dot { background: #10b981; }
        .expense-dot { background: #ef4444; }
        
        .cf-tl-body { flex: 1; background: var(--color-bg-secondary); padding: 1rem; border-radius: 12px; border: 1px solid transparent; transition: border-color 0.2s; }
        .cf-tl-body:hover { border-color: var(--color-border); background: var(--color-bg-card); }
        .cf-tl-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
        .cf-tl-title { font-weight: 600; color: var(--color-text-primary); font-size: 0.95rem; }
        .cf-tl-amount { font-weight: 800; font-size: 1rem; }
        .income-item .cf-tl-amount { color: #10b981; }
        .expense-item .cf-tl-amount { color: #ef4444; }
        .cf-tl-bot { display: flex; justify-content: space-between; align-items: center; }
        .cf-tl-date { font-size: 0.8rem; color: var(--color-text-muted); }
        .cf-tl-del { background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; }
        .cf-tl-del:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .cf-empty { text-align: center; padding: 3rem 1rem; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .cf-empty p { margin: 0; font-size: 0.9rem; font-weight: 500; }

        @media (max-width: 1024px) {
          .cf-summary-row { grid-template-columns: 1fr; }
          .cf-two-col { grid-template-columns: 1fr; }
          .cf-month-pills { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 768px) {
          .cf-month-pills { grid-template-columns: repeat(3, 1fr); }
          .fy-chart-card { display: none; }
        }
      `}</style>
      </div>
    </PortalPinGuard>
  )
}
