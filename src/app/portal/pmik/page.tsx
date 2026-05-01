'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import { ChevronLeft, ChevronRight, CheckCircle2, Plus, Trash2, Wallet, BarChart3, Download, ArrowDownLeft, TrendingDown, ClipboardList, Save, KanbanSquare, MoveRight, MoveLeft, X, BookOpen, Eye } from 'lucide-react'
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
    { name: 'Ketua PMIK', initials: 'K', color: '#3b82f6' },
    { name: 'Wakil Ketua PMIK', initials: 'WK', color: '#8b5cf6' },
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

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Hapus catatan pengeluaran ini?')) return
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchCashflow(cfMonth, cfYear)
    } catch (e) { console.error(e) }
  }

  const totalIncome = transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0)
  const saldo = totalIncome - totalExpense
  const viewLabel = new Date(cfYear, cfMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  const isArchive = cfMonth !== CURRENT_MONTH || cfYear !== CURRENT_YEAR

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

              <div className="cf-two-col">
                {/* LEFT — Dana Masuk */}
                <div className="cf-section">
                  <div className="cf-section-header income-header">
                    <div className="cf-section-title"><ArrowDownLeft size={18} /> Dana dari Bendahara</div>
                    <span className="cf-readonly-badge">Read-Only</span>
                  </div>
                  <div className="cf-timeline">
                    {transactions.filter(t => t.type === 'in').length === 0 ? (
                      <div className="cf-empty"><Wallet size={32} /><p>Menunggu transfer dari Bendahara</p></div>
                    ) : (
                      transactions.filter(t => t.type === 'in').map(t => (
                        <div key={t.id} className="cf-timeline-item income-item">
                          <div className="cf-tl-dot income-dot" />
                          <div className="cf-tl-body">
                            <div className="cf-tl-top">
                              <span className="cf-tl-title">{t.description}</span>
                              <span className="cf-tl-amount income-amount">+ EGP {t.amount.toLocaleString()}</span>
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
                    <div className="cf-section-title"><TrendingDown size={18} /> Catat Pengeluaran</div>
                    <button type="button" onClick={generateCashflowPDF} className="cf-pdf-btn" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}><Download size={14} /> PDF</button>
                  </div>

                  {isArchive ? (
                    <div className="cf-archive-expense-note" style={{ margin: '1rem' }}>
                      <span>🔒 Periode ini sudah ditutup. Data di bawah adalah arsip pengeluaran.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleExpenseSubmit} className="cf-expense-form" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                      <input type="text" className="cf-input" placeholder="Keterangan pengeluaran *" value={expenseForm.itemName} onChange={e => setExpenseForm({ ...expenseForm, itemName: e.target.value })} required />
                      <div className="cf-input-row">
                        <div className="cf-input-group">
                          <label>Qty</label>
                          <input type="number" className="cf-input" placeholder="1" value={expenseForm.quantity} onChange={e => { const qty = Number(e.target.value); const price = Number(expenseForm.unitPrice); setExpenseForm({ ...expenseForm, quantity: e.target.value, amount: (qty * price).toString() }) }} />
                        </div>
                        <div className="cf-input-group">
                          <label>Harga Satuan (EGP)</label>
                          <input type="number" className="cf-input" placeholder="0" value={expenseForm.unitPrice} onChange={e => { const price = Number(e.target.value); const qty = Number(expenseForm.quantity); setExpenseForm({ ...expenseForm, unitPrice: e.target.value, amount: (qty * price).toString() }) }} />
                        </div>
                      </div>
                      <div className="cf-total-display">
                        <span>Total</span>
                        <span className="cf-total-value">EGP {Number(expenseForm.amount).toLocaleString() || '0'}</span>
                      </div>
                      <input type="date" className="cf-input" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                      <div className="cf-upload-area">
                        <input type="file" accept="image/*,application/pdf" id="exp-file" className="hidden-file-input" onChange={e => { if (e.target.files?.[0]) setExpenseForm({ ...expenseForm, file: e.target.files[0] }) }} />
                        <label htmlFor="exp-file" className="cf-upload-label">
                          <ClipboardList size={18} />
                          <span>{expenseForm.file ? expenseForm.file.name : 'Upload Bukti / Struk'}</span>
                        </label>
                      </div>
                      <button type="submit" className="cf-submit-btn"><Save size={16} /> Simpan Pengeluaran</button>
                    </form>
                  )}

                  <div className="cf-timeline" style={{ padding: '0 1.5rem 1.5rem 1.5rem', marginTop: '12px' }}>
                    {transactions.filter(t => t.type === 'out').length === 0 ? (
                      <div className="cf-empty"><TrendingDown size={32} /><p>{isArchive ? 'Tidak ada pengeluaran di periode ini' : 'Belum ada catatan pengeluaran'}</p></div>
                    ) : (
                      transactions.filter(t => t.type === 'out').map(t => (
                        <div key={t.id} className="cf-timeline-item expense-item">
                          <div className="cf-tl-dot expense-dot" />
                          <div className="cf-tl-body">
                            <div className="cf-tl-top">
                              <span className="cf-tl-title">{t.description}</span>
                              <span className="cf-tl-amount expense-amount">-{t.amount.toLocaleString()} EGP</span>
                            </div>
                            <div className="cf-tl-meta">
                              <span>{t.date}{t.quantity ? ` · ${t.quantity}x @ ${t.unitPrice}` : ''}</span>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {t.proofImage && <a href={`/api/media/file/${typeof t.proofImage === 'string' ? t.proofImage : t.proofImage.filename}`} target="_blank" className="cf-proof-link"><Eye size={11} /> Bukti</a>}
                                <button onClick={() => handleDeleteExpense(t.id)} className="card-del-btn" style={{ marginLeft: '8px' }} title="Hapus"><Trash2 size={12} /></button>
                              </div>
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
        /* PMIK STYLES — Mobile-First Fullwidth (matches BPUPD) */
        .dashboard-layout { display: flex; min-height: 100vh; background: var(--color-bg-primary); font-family: var(--font-sans); color: var(--color-text-primary); }
        .main-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding-bottom: 80px; animation: fadeIn 0.4s ease-out forwards; }
        h1, h2, h3, h4 { font-family: var(--font-heading); }
        .portal-header { padding: var(--spacing-lg); background: var(--color-bg-card); border-bottom: 1px solid var(--color-bg-secondary); }
        .portal-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.25rem 0; line-height: 1.2; }
        .portal-header p { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; font-weight: 500; }
        
        /* TABS — mobile-first */
        .tabs-container { margin: var(--spacing-md) 0 var(--spacing-lg) 0; padding: 0 var(--spacing-lg); overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .tabs-container::-webkit-scrollbar { display: none; }
        .tabs { display: inline-flex; gap: var(--spacing-sm); padding-right: var(--spacing-lg); }
        .tab { display: flex; align-items: center; gap: var(--spacing-xs); padding: 0.75rem 1.25rem; border: 1px solid var(--color-bg-secondary); border-radius: var(--radius-full); background: var(--color-bg-card); color: var(--color-text-secondary); font-weight: 600; font-size: 0.9rem; white-space: nowrap; transition: all 0.2s; cursor: pointer; }
        .tab.active { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: #fff; border-color: var(--color-primary); box-shadow: var(--shadow-md); }

        /* PROKER — mobile-first */
        .proker-board-wrapper { display: flex; flex-direction: column; gap: 20px; animation: fadeIn 0.4s ease-out; padding: 0 var(--spacing-lg); }

        /* DANA OPS — mobile-first */
        .cashflow-dashboard { display: flex; flex-direction: column; gap: 1.5rem; padding: var(--spacing-lg); }

        /* Desktop scale-up */
        @media (min-width: 768px) {
          .portal-header { padding: var(--spacing-lg) var(--spacing-2xl); }
          .tabs-container { margin: var(--spacing-xl) 0 var(--spacing-xl) var(--spacing-2xl); }
          .proker-board-wrapper { padding: var(--spacing-xl) var(--spacing-2xl); }
          .cashflow-dashboard { padding: var(--spacing-xl) var(--spacing-2xl); }
        }

        .portal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--spacing-xl); animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--spacing-xl); border: 1px solid var(--color-border); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: all 0.2s ease-in-out; display: flex; flex-direction: column; }
        .card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); transform: translateY(-2px); border-color: var(--color-primary-light); }
        .card h3 { font-size: 1.25rem; font-weight: 600; color: var(--color-text); margin: 0 0 0.25rem 0; }
        .card-desc { color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: var(--spacing-xl); }
        .proker-header { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .proker-title-row { display: flex; align-items: center; gap: 10px; }
        .proker-title-row h2 { font-size: 1.2rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }
        .proker-controls-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }

        /* Month Nav */
        .month-nav-pill { display: inline-flex; align-items: center; background: var(--color-bg-secondary); border-radius: 30px; overflow: hidden; border: 1px solid var(--color-bg-secondary); }
        .mnav-btn { background: none; border: none; padding: 6px 10px; cursor: pointer; color: var(--color-text-secondary); display: flex; align-items: center; transition: background 0.2s; }
        .mnav-btn:hover { background: rgba(139,69,19,0.08); color: var(--color-primary); }
        .mnav-label { font-size: 0.85rem; font-weight: 700; padding: 0 8px; color: var(--color-text-primary); white-space: nowrap; min-width: 110px; text-align: center; }

        /* Assignee Filter */
        .assignee-filter-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .af-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; border: 1.5px solid var(--color-bg-secondary); background: var(--color-bg-secondary); color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s; }
        .af-chip.af-active { background: rgba(139,69,19,0.1); border-color: var(--color-primary); color: var(--color-primary); }
        .af-avatar { font-size: 0.68rem; font-weight: 700; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* Board */
        .trello-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 768px) { .trello-board { grid-template-columns: 1fr; } }

        /* Column */
        .trello-col { background: var(--color-bg-secondary); border-radius: var(--radius-xl); padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 300px; }
        .trello-col-header { display: flex; align-items: center; gap: 8px; padding: 2px 0 6px; border-bottom: 1.5px solid rgba(0,0,0,0.06); }
        .trello-col-title { font-size: 0.82rem; font-weight: 700; flex: 1; }
        .trello-col-count { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; min-width: 22px; text-align: center; }
        .trello-add-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; border-radius: 6px; padding: 3px; transition: all 0.2s; }
        .trello-add-btn:hover { background: var(--color-bg-card); color: var(--color-primary); }

        /* Add Form */
        .trello-add-form { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: 10px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid var(--color-bg-secondary); }
        .trello-input, .trello-textarea, .trello-select { width: 100%; padding: 8px 10px; border: 1.5px solid var(--color-bg-secondary); border-radius: 8px; font-size: 0.82rem; background: var(--color-bg-primary); color: var(--color-text-primary); font-family: var(--font-sans); transition: border 0.2s; resize: none; }
        .trello-input:focus, .trello-textarea:focus, .trello-select:focus { outline: none; border-color: var(--color-primary); }
        .trello-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .trello-form-actions { display: flex; gap: 6px; }
        .trello-save-btn { flex: 1; background: var(--color-primary); color: white; border: none; border-radius: 8px; padding: 7px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: opacity 0.2s; }
        .trello-save-btn:hover { opacity: 0.88; }
        .trello-cancel-btn { background: var(--color-bg-secondary); border: none; border-radius: 8px; padding: 7px 10px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; transition: background 0.2s; }
        .trello-cancel-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

        /* Cards */
        .trello-cards { display: flex; flex-direction: column; gap: 8px; }
        .trello-empty { text-align: center; padding: 20px; color: var(--color-text-muted); font-size: 0.78rem; border: 1.5px dashed var(--color-bg-card); border-radius: var(--radius-lg); }
        .trello-card { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: 10px 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-left: 3px solid transparent; transition: box-shadow 0.2s, transform 0.15s; }
        .trello-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .trello-card.priority-high { border-left-color: #ef4444; }
        .trello-card.priority-normal { border-left-color: #f59e0b; }
        .trello-card.priority-low { border-left-color: #10b981; }
        .trello-card-body { margin-bottom: 8px; }
        .trello-card-title { font-size: 0.85rem; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; }
        .trello-card-title.task-done { text-decoration: line-through; color: var(--color-text-muted); }
        .trello-card-desc { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; line-height: 1.4; }
        .trello-card-footer { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
        .priority-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
        .p-high { background: #fee2e2; color: #dc2626; }
        .p-normal { background: #fef3c7; color: #b45309; }
        .p-low { background: #d1fae5; color: #065f46; }
        .assignee-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
        .assignee-dot { width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; color: white; font-weight: 700; }
        .trello-card-actions { display: flex; gap: 4px; justify-content: flex-end; padding-top: 6px; border-top: 1px solid var(--color-bg-secondary); }
        .card-move-btn { background: var(--color-bg-secondary); border: none; border-radius: 6px; padding: 4px 6px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; transition: all 0.15s; }
        .card-move-btn:hover { background: rgba(139,69,19,0.1); color: var(--color-primary); }
        .card-move-btn.fwd:hover { background: rgba(16,185,129,0.1); color: #10b981; }
        .card-del-btn { background: none; border: none; border-radius: 6px; padding: 4px 6px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; transition: all 0.15s; margin-left: auto; }
        .card-del-btn:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

        /* Staff Summary */
        .staff-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 768px) { .staff-summary { grid-template-columns: 1fr; } }
        .staff-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 14px 16px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .staff-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
        .staff-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .staff-name { font-size: 0.82rem; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .staff-progress-bar { height: 6px; background: var(--color-bg-secondary); border-radius: 10px; overflow: hidden; }
        .staff-progress-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
        .staff-stat { font-size: 0.72rem; color: var(--color-text-muted); }


        /* DANA OPS inner components */
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

        .cf-two-col { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; align-items: start; }
        .cf-section { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); overflow: hidden; }
        .cf-section-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
        .income-header { background: rgba(16, 185, 129, 0.03); }
        .expense-header { background: rgba(239, 68, 68, 0.03); }
        .cf-section-title { font-weight: 700; font-size: 1rem; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem; }
        .cf-readonly-badge { font-size: 0.7rem; font-weight: 700; background: var(--color-bg-secondary); padding: 4px 8px; border-radius: 6px; color: var(--color-text-muted); }
        
        /* Timeline */
        .cf-timeline { display: flex; flex-direction: column; gap: 0; padding: 1.5rem; }
        .cf-timeline-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--color-bg-secondary); }
        .cf-timeline-item:last-child { border-bottom: none; }
        .cf-tl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .income-dot { background: #10b981; }
        .expense-dot { background: #ef4444; }
        .cf-tl-body { flex: 1; min-width: 0; }
        .cf-tl-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 3px; }
        .cf-tl-title { font-size: 0.84rem; font-weight: 600; color: var(--color-text-primary); }
        .cf-tl-amount { font-size: 0.84rem; font-weight: 800; white-space: nowrap; font-family: var(--font-heading); }
        .income-amount { color: #10b981; }
        .expense-amount { color: #ef4444; }
        .cf-tl-date { font-size: 0.72rem; color: var(--color-text-muted); }
        .cf-tl-meta { display: flex; align-items: center; gap: 10px; font-size: 0.72rem; color: var(--color-text-muted); }
        .cf-proof-link { display: inline-flex; align-items: center; gap: 3px; color: var(--color-primary); font-weight: 600; text-decoration: none; font-size: 0.72rem; }
        .cf-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px; color: var(--color-text-muted); text-align: center; }
        .cf-empty p { font-size: 0.82rem; }

        /* Expense Form */
        .cf-expense-form { display: flex; flex-direction: column; gap: 10px; }
        .cf-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--color-bg-secondary); border-radius: 10px; font-size: 0.85rem; background: var(--color-bg-primary); color: var(--color-text-primary); font-family: var(--font-sans); transition: border 0.2s; box-sizing: border-box; }
        .cf-input:focus { outline: none; border-color: var(--color-primary); }
        .cf-input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .cf-input-group { display: flex; flex-direction: column; gap: 4px; }
        .cf-input-group label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); }
        .cf-total-display { background: var(--color-bg-secondary); border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
        .cf-total-value { font-size: 1.05rem; font-weight: 800; color: #ef4444; font-family: var(--font-heading); }
        .cf-upload-area { border: 1.5px dashed var(--color-bg-secondary); border-radius: 10px; overflow: hidden; }
        .hidden-file-input { display: none; }
        .cf-upload-label { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; color: var(--color-text-muted); font-size: 0.82rem; transition: background 0.2s; }
        .cf-upload-label:hover { background: var(--color-bg-secondary); }
        .cf-submit-btn { background: linear-gradient(135deg, #8B4513, #A0522D); color: white; border: none; border-radius: 10px; padding: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s, transform 0.15s; }
        .cf-submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .cf-archive-expense-note { background: var(--color-bg-secondary); padding: 12px; border-radius: 10px; border: 1px dashed var(--color-border); text-align: center; font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 6px; }

        @media (max-width: 1024px) {
          .cf-summary-row { grid-template-columns: 1fr; }
          .cf-two-col { grid-template-columns: 1fr; }
          .cf-month-pills { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 768px) {
          .cf-month-pills { grid-template-columns: repeat(3, 1fr); }
          .cf-card { padding: 1rem; gap: 0.75rem; }
          .cf-card-icon { width: 40px; height: 40px; }
          .cf-card-value { font-size: 1.2rem; }
          .cf-section-header { padding: 1rem; }
          .cf-timeline { padding: 1rem; }
        }
      `}</style>
      </div>
    </PortalPinGuard>
  )
}
