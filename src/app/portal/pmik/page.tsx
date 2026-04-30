'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import { ChevronDown, CheckCircle2, AlertTriangle, Plus, Trash2, Wallet, BarChart3, Download, ArrowDownLeft, TrendingDown, ClipboardList, Save, KanbanSquare, MoveRight, MoveLeft, X, BookOpen } from 'lucide-react'
import jsPDF from 'jspdf'

export default function PMIKPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'proker' | 'dana_ops'>('proker')

  // --- PROKER BULANAN STATE ---
  const [tasks, setTasks] = useState<any[]>([])
  const [prokerMonth, setProkerMonth] = useState(new Date().getMonth())
  const [prokerYear, setProkerYear] = useState(new Date().getFullYear())
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'high' | 'normal' | 'low',
    assigneeName: '',
    dueDate: new Date().toISOString().split('T')[0],
  })

  const STAFF = [
    { name: 'Staff PMIK 1', initials: 'P1', color: '#3b82f6' },
    { name: 'Staff PMIK 2', initials: 'P2', color: '#8b5cf6' },
  ]

  // --- DANA OPERASIONAL STATE ---
  const CURRENT_MONTH = new Date().getMonth()
  const CURRENT_YEAR = new Date().getFullYear()
  const [cfMonth, setCfMonth] = useState(CURRENT_MONTH)
  const [cfYear, setCfYear] = useState(CURRENT_YEAR)
  const [transactions, setTransactions] = useState<any[]>([])
  const [expenseForm, setExpenseForm] = useState<{ itemName: string, quantity: string, unitPrice: string, amount: string, date: string, file: File | null }>({
    itemName: '', quantity: '', unitPrice: '', amount: '0', date: new Date().toISOString().split('T')[0], file: null
  })

  // Build fiscal year months
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

  // --- PROKER FUNCTIONS ---
  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?category=pmik&month=${prokerMonth}&year=${prokerYear}`)
      if (res.ok) setTasks(await res.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchTasks() }, [prokerMonth, prokerYear])

  const addTask = async (status: string) => {
    if (!taskForm.title) return
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskForm, category: 'pmik', status, dueDate: taskForm.dueDate || undefined })
      })
      if (res.ok) {
        setTaskForm({ title: '', description: '', priority: 'normal', assigneeName: '', dueDate: new Date().toISOString().split('T')[0] })
        setShowAddTask(null)
        fetchTasks()
      }
    } catch (e) { console.error(e) }
  }

  const moveTask = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) })
      if (res.ok) fetchTasks()
    } catch (e) { console.error(e) }
  }

  const deleteTask = async (id: string) => {
    if (!confirm('Hapus proker ini?')) return
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchTasks()
    } catch (e) { console.error(e) }
  }

  // --- DANA OPS FUNCTIONS ---
  const fetchCashflow = async (month: number, year: number) => {
    try {
      const res = await fetch(`/api/finance?month=${month}&year=${year}&division=pmik`)
      if (res.ok) {
        const data = await res.json()
        setTransactions((data.cashflow || []).map((item: any) => ({
          id: item.id, date: item.transactionDate ? item.transactionDate.split('T')[0] : '',
          category: item.category, amount: item.amount, currency: item.currency, type: item.type,
          description: item.description, status: item.approvalStatus, quantity: item.quantity, unitPrice: item.unitPrice,
        })))
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => { fetchCashflow(cfMonth, cfYear) }, [cfMonth, cfYear])

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const totalAmount = expenseForm.quantity && expenseForm.unitPrice
      ? Number(expenseForm.quantity) * Number(expenseForm.unitPrice)
      : Number(expenseForm.amount)
    if (!expenseForm.itemName || totalAmount <= 0) return alert('Lengkapi data pengeluaran')

    let proofImage: string | undefined
    if (expenseForm.file) {
      const fd = new FormData()
      fd.append('file', expenseForm.file)
      try {
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (upRes.ok) { const upData = await upRes.json(); proofImage = upData.doc?.id || upData.id }
      } catch (e) { console.error('Upload failed', e) }
    }

    try {
      const res = await fetch('/api/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'out', category: 'operational', division: 'pmik',
          amount: totalAmount, currency: 'EGP',
          description: expenseForm.itemName,
          transactionDate: expenseForm.date || new Date().toISOString().split('T')[0],
          quantity: expenseForm.quantity ? Number(expenseForm.quantity) : undefined,
          unitPrice: expenseForm.unitPrice ? Number(expenseForm.unitPrice) : undefined,
          proofImage,
        })
      })
      if (res.ok) {
        setExpenseForm({ itemName: '', quantity: '', unitPrice: '', amount: '0', date: new Date().toISOString().split('T')[0], file: null })
        fetchCashflow(cfMonth, cfYear)
      }
    } catch (e) { console.error(e) }
  }

  // Summary calculations
  const incomeThisMonth = transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').reduce((s, t) => s + (t.amount || 0), 0)
  const expenseThisMonth = transactions.filter(t => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0)
  const saldoThisMonth = incomeThisMonth - expenseThisMonth

  const generateCashflowPDF = () => {
    const doc = new jsPDF()
    const monthLabel = new Date(cfYear, cfMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    doc.setFontSize(16); doc.text(`Laporan Keuangan PMIK - ${monthLabel}`, 14, 20)
    doc.setFontSize(10)
    let y = 35
    doc.text('No', 14, y); doc.text('Tanggal', 28, y); doc.text('Keterangan', 60, y); doc.text('Tipe', 130, y); doc.text('Jumlah', 150, y)
    y += 8
    transactions.forEach((t, i) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(`${i + 1}`, 14, y); doc.text(t.date || '-', 28, y); doc.text((t.description || '').substring(0, 35), 60, y)
      doc.text(t.type === 'in' ? 'Masuk' : 'Keluar', 130, y); doc.text(`EGP ${(t.amount || 0).toLocaleString()}`, 150, y)
      y += 7
    })
    y += 10
    doc.setFontSize(11)
    doc.text(`Dana Masuk: EGP ${incomeThisMonth.toLocaleString()}`, 14, y)
    doc.text(`Pengeluaran: EGP ${expenseThisMonth.toLocaleString()}`, 14, y + 7)
    doc.text(`Saldo: EGP ${saldoThisMonth.toLocaleString()}`, 14, y + 14)
    doc.save(`Laporan-PMIK-${monthLabel}.pdf`)
  }

  // --- PROKER MONTH NAV ---
  const prokerMonthLabel = new Date(prokerYear, prokerMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  const prevProkerMonth = () => {
    if (prokerMonth === 0) { setProkerMonth(11); setProkerYear(prokerYear - 1) }
    else setProkerMonth(prokerMonth - 1)
  }
  const nextProkerMonth = () => {
    if (prokerMonth === 11) { setProkerMonth(0); setProkerYear(prokerYear + 1) }
    else setProkerMonth(prokerMonth + 1)
  }

  const TABS = [
    { key: 'proker' as const, icon: <KanbanSquare size={18} />, label: 'Proker Bulanan' },
    { key: 'dana_ops' as const, icon: <Wallet size={18} />, label: 'Dana Operasional' },
  ]

  const COLUMNS = [
    { status: 'pending', label: '📋 Rencana', color: '#f59e0b' },
    { status: 'in_progress', label: '🔄 Berjalan', color: '#3b82f6' },
    { status: 'done', label: '✅ Selesai', color: '#10b981' },
  ]

  return (
    <PortalPinGuard portalName="PMIK" expectedPin={process.env.NEXT_PUBLIC_PMIK_PIN}>
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="portal-header">
            <div>
              <h1>📚 Portal PMIK</h1>
              <p className="portal-subtitle">Perpustakaan, Media, Informasi & Komunikasi</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="cf-tabs" style={{ marginBottom: '1.5rem' }}>
            {TABS.map(tab => (
              <button key={tab.key} className={`cf-tab ${activeTab === tab.key ? 'cf-tab-active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ══════════════ PROKER TAB ══════════════ */}
          {activeTab === 'proker' && (
            <div className="finance-section animate-fadeIn">
              {/* Month Navigator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <button onClick={prevProkerMonth} className="cf-submit-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>← Prev</button>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>📅 {prokerMonthLabel}</h3>
                <button onClick={nextProkerMonth} className="cf-submit-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Next →</button>
              </div>

              {/* Kanban Board */}
              <div className="portal-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {COLUMNS.map(col => {
                  const colTasks = tasks.filter(t => t.status === col.status)
                  return (
                    <div key={col.status} className="card" style={{ borderTop: `3px solid ${col.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{col.label} <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{colTasks.length}</span></h3>
                        <button onClick={() => setShowAddTask(showAddTask === col.status ? null : col.status)} className="cf-submit-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          <Plus size={14} />
                        </button>
                      </div>

                      {showAddTask === col.status && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <input className="dist-input" placeholder="Judul proker *" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={{ marginBottom: '0.5rem' }} />
                          <textarea className="dist-input" placeholder="Deskripsi" rows={2} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ marginBottom: '0.5rem', resize: 'vertical' }} />
                          <select className="dist-input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })} style={{ marginBottom: '0.5rem' }}>
                            <option value="high">🔴 High</option>
                            <option value="normal">🟡 Normal</option>
                            <option value="low">🟢 Low</option>
                          </select>
                          <select className="dist-input" value={taskForm.assigneeName} onChange={e => setTaskForm({ ...taskForm, assigneeName: e.target.value })} style={{ marginBottom: '0.5rem' }}>
                            <option value="">-- Pilih PIC --</option>
                            {STAFF.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          </select>
                          <input type="date" className="dist-input" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} style={{ marginBottom: '0.5rem' }} />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="cf-submit-btn" onClick={() => addTask(col.status)} style={{ flex: 1, fontSize: '0.8rem' }}><Save size={14} /> Simpan</button>
                            <button className="cf-submit-btn" onClick={() => setShowAddTask(null)} style={{ background: '#6b7280', fontSize: '0.8rem' }}><X size={14} /></button>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '60px' }}>
                        {colTasks.length === 0 && <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.8rem', padding: '1rem 0' }}>Belum ada proker</p>}
                        {colTasks.map(task => (
                          <div key={task.id} style={{ padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                              <strong style={{ flex: 1 }}>{task.title}</strong>
                              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: task.priority === 'high' ? '#fee2e2' : task.priority === 'low' ? '#dcfce7' : '#fef3c7', color: task.priority === 'high' ? '#dc2626' : task.priority === 'low' ? '#16a34a' : '#d97706' }}>
                                {task.priority}
                              </span>
                            </div>
                            {task.description && <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0.25rem 0' }}>{task.description}</p>}
                            {task.assigneeName && <p style={{ fontSize: '0.7rem', color: '#3b82f6', margin: '0.2rem 0' }}>👤 {task.assigneeName}</p>}
                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              {col.status !== 'pending' && <button className="cf-submit-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', background: '#f59e0b' }} onClick={() => moveTask(task.id, col.status === 'done' ? 'in_progress' : 'pending')}><MoveLeft size={12} /></button>}
                              {col.status !== 'done' && <button className="cf-submit-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', background: '#10b981' }} onClick={() => moveTask(task.id, col.status === 'pending' ? 'in_progress' : 'done')}><MoveRight size={12} /></button>}
                              <button className="cf-submit-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', background: '#ef4444' }} onClick={() => deleteTask(task.id)}><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══════════════ DANA OPERASIONAL TAB ══════════════ */}
          {activeTab === 'dana_ops' && (
            <div className="finance-section animate-fadeIn">
              {/* Month Navigator */}
              <div className="cf-month-nav" style={{ marginBottom: '1.5rem' }}>
                <div className="cf-month-pills">
                  {fiscalMonths.map((fm) => {
                    const isCurrent = fm.month === CURRENT_MONTH && fm.year === CURRENT_YEAR
                    const isSelected = fm.month === cfMonth && fm.year === cfYear
                    return (
                      <button key={`${fm.year}-${fm.month}`} className={`cf-month-pill ${isSelected ? 'cf-mp-selected' : ''} ${isCurrent ? 'cf-mp-current' : ''}`} onClick={() => { setCfMonth(fm.month); setCfYear(fm.year) }}>
                        <span className="cf-mp-label">{fm.label}</span>
                        <span className="cf-mp-year">{String(fm.year).slice(2)}</span>
                        {isCurrent && <span className="cf-mp-dot" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="cf-summary-row" style={{ marginBottom: '1.5rem' }}>
                <div className="cf-card cf-income-card">
                  <div className="cf-card-icon"><ArrowDownLeft size={22} /></div>
                  <div className="cf-card-body">
                    <span className="cf-card-label">Dana dari Bendahara</span>
                    <span className="cf-card-value">EGP {incomeThisMonth.toLocaleString()}</span>
                  </div>
                </div>
                <div className="cf-card cf-expense-card">
                  <div className="cf-card-icon"><TrendingDown size={22} /></div>
                  <div className="cf-card-body">
                    <span className="cf-card-label">Total Pengeluaran</span>
                    <span className="cf-card-value">EGP {expenseThisMonth.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`cf-card cf-balance-card ${saldoThisMonth < 0 ? 'cf-negative' : ''}`}>
                  <div className="cf-card-icon"><Wallet size={22} /></div>
                  <div className="cf-card-body">
                    <span className="cf-card-label">Sisa Saldo</span>
                    <span className="cf-card-value">EGP {saldoThisMonth.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expense Form */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header-icon">
                  <ClipboardList size={20} className="icon-expense" />
                  <h3>Input Pengeluaran Operasional</h3>
                </div>
                <form className="dist-form" onSubmit={handleExpenseSubmit}>
                  <div className="dist-group">
                    <label>Nama Item / Keterangan *</label>
                    <input type="text" required className="dist-input" placeholder="Contoh: Beli buku referensi" value={expenseForm.itemName} onChange={e => setExpenseForm({ ...expenseForm, itemName: e.target.value })} />
                  </div>
                  <div className="dist-row">
                    <div className="dist-group">
                      <label>Tanggal *</label>
                      <input type="date" required className="dist-input" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                    </div>
                    <div className="dist-group">
                      <label>Qty</label>
                      <input type="number" className="dist-input" placeholder="1" value={expenseForm.quantity} onChange={e => setExpenseForm({ ...expenseForm, quantity: e.target.value })} />
                    </div>
                    <div className="dist-group">
                      <label>Harga Satuan (EGP)</label>
                      <input type="number" className="dist-input" placeholder="0" value={expenseForm.unitPrice} onChange={e => setExpenseForm({ ...expenseForm, unitPrice: e.target.value })} />
                    </div>
                  </div>
                  <div className="dist-group">
                    <label>Bukti (Opsional)</label>
                    <input type="file" accept="image/*" className="dist-input" onChange={e => setExpenseForm({ ...expenseForm, file: e.target.files?.[0] || null })} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Total: EGP {((Number(expenseForm.quantity) || 1) * (Number(expenseForm.unitPrice) || 0)).toLocaleString()}</span>
                    <button type="submit" className="cf-submit-btn"><Save size={16} /> Simpan Pengeluaran</button>
                  </div>
                </form>
              </div>

              {/* Transaction Table */}
              <div className="card">
                <div className="card-header-icon" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={20} className="icon-primary" />
                    <h3>Riwayat Transaksi — {new Date(cfYear, cfMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h3>
                  </div>
                  <button onClick={generateCashflowPDF} className="cf-submit-btn" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}><Download size={14} /> PDF</button>
                </div>
                <div className="cf-table-wrap">
                  <table className="cf-table">
                    <thead>
                      <tr><th>Tanggal</th><th>Keterangan</th><th>Tipe</th><th>Jumlah</th></tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada transaksi</td></tr>}
                      {transactions.map(t => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td>{t.description}</td>
                          <td><span className={`cf-badge ${t.type === 'in' ? 'cf-badge-in' : 'cf-badge-out'}`}>{t.type === 'in' ? '💰 Masuk' : '💸 Keluar'}</span></td>
                          <td style={{ fontWeight: 600, color: t.type === 'in' ? '#16a34a' : '#dc2626' }}>{t.type === 'in' ? '+' : '-'} EGP {(t.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </PortalPinGuard>
  )
}
