'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import { ChevronLeft, ChevronRight, CheckCircle2, Plus, Trash2, Wallet, BarChart3, Download, ArrowDownLeft, TrendingDown, ClipboardList, Save, KanbanSquare, MoveRight, MoveLeft, X, BookOpen } from 'lucide-react'
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
    title: '', description: '', priority: 'normal' as 'high' | 'normal' | 'low',
    assigneeName: '', dueDate: new Date().toISOString().split('T')[0],
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
  const [expenseForm, setExpenseForm] = useState({
    itemName: '', quantity: '', unitPrice: '', amount: '0',
    date: new Date().toISOString().split('T')[0], file: null as File | null
  })

  const buildFiscalMonths = () => {
    const fiscalStartYear = CURRENT_MONTH >= 1 ? CURRENT_YEAR : CURRENT_YEAR - 1
    const months: { month: number; year: number; label: string }[] = []
    for (let i = 0; i < 12; i++) {
      let m = 1 + i; let y = fiscalStartYear
      if (m > 11) { m -= 12; y += 1 }
      months.push({ month: m, year: y, label: new Date(y, m, 1).toLocaleString('id-ID', { month: 'short' }) })
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

  const handleAddTask = async (status: string) => {
    if (!taskForm.title) return
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskForm, category: 'pmik', status, relatedRoom: taskForm.assigneeName, dueDate: taskForm.dueDate || undefined })
      })
      if (res.ok) { setTaskForm({ title: '', description: '', priority: 'normal', assigneeName: '', dueDate: new Date().toISOString().split('T')[0] }); setShowAddTask(null); fetchTasks() }
    } catch (e) { console.error(e) }
  }

  const moveTask = async (task: any, newStatus: string) => {
    try {
      const res = await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, status: newStatus }) })
      if (res.ok) fetchTasks()
    } catch (e) { console.error(e) }
  }

  const deleteProkerTask = async (id: string) => {
    if (!confirm('Hapus proker ini?')) return
    try { const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchTasks() } catch (e) { console.error(e) }
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
      ? Number(expenseForm.quantity) * Number(expenseForm.unitPrice) : Number(expenseForm.amount)
    if (!expenseForm.itemName || totalAmount <= 0) return alert('Lengkapi data pengeluaran')

    let proofImage: string | undefined
    if (expenseForm.file) {
      const fd = new FormData(); fd.append('file', expenseForm.file)
      try { const upRes = await fetch('/api/upload', { method: 'POST', body: fd }); if (upRes.ok) { const d = await upRes.json(); proofImage = d.doc?.id || d.id } } catch (e) { console.error(e) }
    }

    try {
      const res = await fetch('/api/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'out', category: 'operational', division: 'pmik', amount: totalAmount, currency: 'EGP', description: expenseForm.itemName, transactionDate: expenseForm.date, quantity: expenseForm.quantity ? Number(expenseForm.quantity) : undefined, unitPrice: expenseForm.unitPrice ? Number(expenseForm.unitPrice) : undefined, proofImage })
      })
      if (res.ok) { setExpenseForm({ itemName: '', quantity: '', unitPrice: '', amount: '0', date: new Date().toISOString().split('T')[0], file: null }); fetchCashflow(cfMonth, cfYear) }
    } catch (e) { console.error(e) }
  }

  const totalIncome = transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0)
  const saldo = totalIncome - totalExpense
  const viewLabel = new Date(cfYear, cfMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  const generateCashflowPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.text(`Laporan Dana Operasional PMIK`, 105, 22, { align: 'center' })
    doc.setFontSize(12); doc.text(`Periode: ${viewLabel}`, 105, 30, { align: 'center' })
    doc.setFontSize(10); doc.text(`Dana Diterima: EGP ${totalIncome.toLocaleString()}`, 20, 45); doc.text(`Pengeluaran: EGP ${totalExpense.toLocaleString()}`, 20, 52); doc.text(`Sisa Saldo: EGP ${saldo.toLocaleString()}`, 20, 59)
    let y = 75; doc.text('Rincian:', 20, y); y += 10
    transactions.filter(t => t.type === 'out').forEach((t, i) => { if (y > 270) { doc.addPage(); y = 20 }; doc.text(`${i+1}. ${t.date} - ${t.description} : EGP ${(t.amount||0).toLocaleString()}`, 20, y); y += 7 })
    doc.save(`Laporan_PMIK_${viewLabel}.pdf`)
  }

  const prokerMonthLabel = new Date(prokerYear, prokerMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  const COLS = [
    { status: 'pending', label: '📋 Todo', color: '#6b7280', bg: '#f3f4f6' },
    { status: 'in_progress', label: '⚡ In Progress', color: '#f59e0b', bg: '#fffbeb' },
    { status: 'done', label: '✅ Selesai', color: '#10b981', bg: '#ecfdf5' },
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
              <p>Perpustakaan, Media, Informasi & Komunikasi</p>
            </div>
          </div>

          {/* ── Tab Switcher (matches BPPG) ── */}
          <div className="tabs-container">
            <div className="tabs">
              {[
                { key: 'proker' as const, icon: <KanbanSquare size={18} />, label: 'Proker Bulanan' },
                { key: 'dana_ops' as const, icon: <Wallet size={18} />, label: 'Dana Operasional' },
              ].map(t => (
                <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════ PROKER BULANAN ═══════════════ */}
          {activeTab === 'proker' && (() => {
            const filtered = tasks
            return (
              <div className="proker-board-wrapper">
                <div className="proker-header">
                  <div className="proker-title-row">
                    <KanbanSquare size={22} style={{ color: 'var(--color-primary)' }} />
                    <h2>Program Kerja Bulanan</h2>
                  </div>
                  <div className="proker-controls-row">
                    <div className="month-nav-pill">
                      <button className="mnav-btn" onClick={() => { if (prokerMonth === 0) { setProkerMonth(11); setProkerYear(y => y - 1) } else setProkerMonth(m => m - 1) }}><ChevronLeft size={16} /></button>
                      <span className="mnav-label">{prokerMonthLabel}</span>
                      <button className="mnav-btn" onClick={() => { if (prokerMonth === 11) { setProkerMonth(0); setProkerYear(y => y + 1) } else setProkerMonth(m => m + 1) }}><ChevronRight size={16} /></button>
                    </div>
                  </div>
                </div>

                <div className="trello-board">
                  {COLS.map(col => {
                    const colTasks = filtered.filter(t => t.status === col.status)
                    return (
                      <div key={col.status} className="trello-col">
                        <div className="trello-col-header">
                          <span className="trello-col-title" style={{ color: col.color }}>{col.label}</span>
                          <span className="trello-col-count" style={{ background: col.bg, color: col.color }}>{colTasks.length}</span>
                          <button className="trello-add-btn" onClick={() => { setShowAddTask(showAddTask === col.status ? null : col.status); setTaskForm({ title: '', description: '', priority: 'normal', assigneeName: '', dueDate: new Date(prokerYear, prokerMonth, 15).toISOString().split('T')[0] }) }}>
                            <Plus size={16} />
                          </button>
                        </div>

                        {showAddTask === col.status && (
                          <div className="trello-add-form">
                            <input className="trello-input" placeholder="Judul task..." value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                            <textarea className="trello-textarea" placeholder="Deskripsi (opsional)" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                            <div className="trello-form-row">
                              <select className="trello-select" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}>
                                <option value="high">🔴 High</option><option value="normal">🟡 Normal</option><option value="low">🟢 Low</option>
                              </select>
                              <select className="trello-select" value={taskForm.assigneeName} onChange={e => setTaskForm(f => ({ ...f, assigneeName: e.target.value }))}>
                                <option value="">— Assignee —</option>
                                {STAFF.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                              </select>
                            </div>
                            <div className="trello-form-actions">
                              <button className="trello-save-btn" onClick={() => handleAddTask(col.status)}><Plus size={14} /> Tambah</button>
                              <button className="trello-cancel-btn" onClick={() => setShowAddTask(null)}><X size={14} /></button>
                            </div>
                          </div>
                        )}

                        <div className="trello-cards">
                          {colTasks.length === 0 && showAddTask !== col.status && (
                            <div className="trello-empty">Belum ada task di sini</div>
                          )}
                          {colTasks.map(task => {
                            const assignee = STAFF.find(s => s.name === (task as any).relatedRoom)
                            return (
                              <div key={task.id} className={`trello-card priority-${task.priority}`}>
                                <div className="trello-card-body">
                                  <p className={`trello-card-title ${task.status === 'done' ? 'task-done' : ''}`}>{task.title}</p>
                                  {task.description && <p className="trello-card-desc">{task.description}</p>}
                                </div>
                                <div className="trello-card-footer">
                                  <span className={`priority-badge p-${task.priority}`}>
                                    {task.priority === 'high' ? '🔴 High' : task.priority === 'normal' ? '🟡 Normal' : '🟢 Low'}
                                  </span>
                                  {assignee && (
                                    <span className="assignee-chip" style={{ background: assignee.color + '20', color: assignee.color, border: `1px solid ${assignee.color}40` }}>
                                      <span className="assignee-dot" style={{ background: assignee.color }}>{assignee.initials[0]}</span>
                                      {assignee.initials}
                                    </span>
                                  )}
                                </div>
                                <div className="trello-card-actions">
                                  {col.status !== 'pending' && <button className="card-move-btn" title="Mundur" onClick={() => moveTask(task, col.status === 'in_progress' ? 'pending' : 'in_progress')}><MoveLeft size={13} /></button>}
                                  {col.status !== 'done' && <button className="card-move-btn fwd" title="Maju" onClick={() => moveTask(task, col.status === 'pending' ? 'in_progress' : 'done')}><MoveRight size={13} /></button>}
                                  <button className="card-del-btn" title="Hapus" onClick={() => deleteProkerTask(task.id)}><Trash2 size={13} /></button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Staff Summary */}
                <div className="staff-summary">
                  {STAFF.map(s => {
                    const myTasks = tasks.filter(t => (t as any).relatedRoom === s.name)
                    const done = myTasks.filter(t => t.status === 'done').length
                    const total = myTasks.length
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0
                    return (
                      <div key={s.name} className="staff-card">
                        <div className="staff-avatar" style={{ background: s.color }}>{s.initials}</div>
                        <div className="staff-info">
                          <span className="staff-name">{s.name}</span>
                          <div className="staff-progress-bar"><div className="staff-progress-fill" style={{ width: `${pct}%`, background: s.color }} /></div>
                          <span className="staff-stat">{done}/{total} selesai · {pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* ═══════════════ DANA OPERASIONAL ═══════════════ */}
          {activeTab === 'dana_ops' && (
            <div className="finance-section animate-fadeIn">
              {/* Month Navigator */}
              <div className="cf-month-nav" style={{ marginBottom: '1.5rem' }}>
                <div className="cf-month-pills">
                  {fiscalMonths.map((fm) => {
                    const isCurrent = fm.month === CURRENT_MONTH && fm.year === CURRENT_YEAR
                    const isSelected = fm.month === cfMonth && fm.year === cfYear
                    const isPast = new Date(fm.year, fm.month, 1) < new Date(CURRENT_YEAR, CURRENT_MONTH, 1)
                    return (
                      <button key={`${fm.year}-${fm.month}`} className={`cf-month-pill ${isSelected ? 'cf-mp-selected' : ''} ${isCurrent ? 'cf-mp-current' : ''} ${isPast ? 'cf-mp-past' : ''}`} onClick={() => { setCfMonth(fm.month); setCfYear(fm.year) }}>
                        <span className="cf-mp-label">{fm.label}</span>
                        <span className="cf-mp-year">{String(fm.year).slice(2)}</span>
                        {isCurrent && <span className="cf-mp-dot" />}
                        {isPast && <span className="cf-mp-check">✓</span>}
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
                    <span className="cf-card-value">EGP {totalIncome.toLocaleString()}</span>
                    <span className="cf-card-sub">{viewLabel}</span>
                  </div>
                </div>
                <div className="cf-card cf-expense-card">
                  <div className="cf-card-icon"><TrendingDown size={22} /></div>
                  <div className="cf-card-body">
                    <span className="cf-card-label">Total Pengeluaran</span>
                    <span className="cf-card-value">EGP {totalExpense.toLocaleString()}</span>
                    <span className="cf-card-sub">{viewLabel}</span>
                  </div>
                </div>
                <div className={`cf-card cf-balance-card ${saldo < 0 ? 'cf-negative' : ''}`}>
                  <div className="cf-card-icon"><Wallet size={22} /></div>
                  <div className="cf-card-body">
                    <span className="cf-card-label">Sisa Saldo</span>
                    <span className="cf-card-value">EGP {saldo.toLocaleString()}</span>
                    <span className="cf-card-sub">{saldo < 0 ? 'Defisit' : 'Surplus'}</span>
                  </div>
                </div>
              </div>

              <div className="portal-grid">
                {/* Expense Form */}
                <div className="card">
                  <div className="card-header-icon">
                    <ClipboardList size={20} className="icon-expense" />
                    <h3>Input Pengeluaran</h3>
                  </div>
                  <p className="card-desc">Catat pengeluaran harian operasional PMIK</p>
                  <form className="dist-form" onSubmit={handleExpenseSubmit}>
                    <div className="dist-group">
                      <label>Keterangan *</label>
                      <input type="text" required className="dist-input" placeholder="Contoh: Beli buku referensi" value={expenseForm.itemName} onChange={e => setExpenseForm({ ...expenseForm, itemName: e.target.value })} />
                    </div>
                    <div className="dist-row">
                      <div className="dist-group"><label>Tanggal *</label><input type="date" required className="dist-input" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} /></div>
                      <div className="dist-group"><label>Qty</label><input type="number" className="dist-input" placeholder="1" value={expenseForm.quantity} onChange={e => setExpenseForm({ ...expenseForm, quantity: e.target.value })} /></div>
                    </div>
                    <div className="dist-row">
                      <div className="dist-group"><label>Harga Satuan (EGP)</label><input type="number" className="dist-input" placeholder="0" value={expenseForm.unitPrice} onChange={e => setExpenseForm({ ...expenseForm, unitPrice: e.target.value })} /></div>
                      <div className="dist-group"><label>Bukti (Opsional)</label><input type="file" accept="image/*" className="dist-input" onChange={e => setExpenseForm({ ...expenseForm, file: e.target.files?.[0] || null })} /></div>
                    </div>
                    <button type="submit" className="cf-submit-btn"><Save size={16} /> Simpan Pengeluaran</button>
                  </form>
                </div>

                {/* Transaction History */}
                <div className="card">
                  <div className="card-header-icon">
                    <BarChart3 size={20} className="icon-primary" />
                    <h3>Riwayat Transaksi</h3>
                  </div>
                  <p className="card-desc">{viewLabel}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                    <button onClick={generateCashflowPDF} className="cf-submit-btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}><Download size={14} /> PDF</button>
                  </div>
                  <div className="cf-table-wrap">
                    <table className="cf-table">
                      <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Tipe</th><th>Jumlah</th></tr></thead>
                      <tbody>
                        {transactions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada transaksi bulan ini.</td></tr>}
                        {transactions.map(t => (
                          <tr key={t.id}>
                            <td>{t.date}</td><td>{t.description}</td>
                            <td><span className={`cf-badge ${t.type === 'in' ? 'cf-badge-in' : 'cf-badge-out'}`}>{t.type === 'in' ? '💰 Masuk' : '💸 Keluar'}</span></td>
                            <td style={{ fontWeight: 600, color: t.type === 'in' ? '#16a34a' : '#dc2626' }}>{t.type === 'in' ? '+' : '-'} EGP {(t.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </PortalPinGuard>
  )
}
