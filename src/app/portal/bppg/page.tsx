'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Plus, Trash2, Eye, Wallet, BarChart3, Download, ArrowDownLeft, TrendingDown, ClipboardList, Camera, Save, KanbanSquare, MoveRight, MoveLeft, X, Package, Wrench, Layers, Zap, Droplets, Sparkles, Box } from 'lucide-react'
import jsPDF from 'jspdf'

export default function BPPGPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'proker' | 'dana_ops' | 'inventaris'>('proker')

  // --- PROKER BULANAN STATE ---
  const [tasks, setTasks] = useState<any[]>([])
  const [prokerMonth, setProkerMonth] = useState(new Date().getMonth())
  const [prokerYear, setProkerYear] = useState(new Date().getFullYear())
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'high' | 'normal' | 'low',
    assigneeName: '',
    dueDate: new Date().toISOString().split('T')[0],
  })

  const STAFF = [
    { name: 'Subhan Hadi Alhabsyi', initials: 'SH', color: '#3b82f6' },
    { name: 'Rausan Fiqri', initials: 'RF', color: '#8b5cf6' },
  ]

  // --- INVENTARIS STATE ---
  const [inventoryList, setInventoryList] = useState<any[]>([])
  const [showInvForm, setShowInvForm] = useState(false)
  const [invForm, setInvForm] = useState<any>({
    itemName: '', category: 'tools', inventoryType: 'asset', currentStock: 1, minimumStock: 1, unit: 'pcs',
    condition: { good: 1, broken: 0, lost: 0 }, setDetails: []
  })

  const fetchInv = async () => {
    try {
      const res = await fetch('/api/inventory?division=bppg')
      if (res.ok) setInventoryList(await res.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchInv()
  }, [])

  const [isSubmittingInv, setIsSubmittingInv] = useState(false)

  const handleInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingInv(true)
    try {
      const res = await fetch('/api/inventory?division=bppg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...invForm, division: 'bppg' })
      })
      if (res.ok) {
        setShowInvForm(false)
        fetchInv()
        setInvForm({
          itemName: '', category: 'tools', inventoryType: 'asset', currentStock: 1, minimumStock: 1, unit: 'pcs',
          condition: { good: 1, broken: 0, lost: 0 }, setDetails: []
        })
      } else {
        const err = await res.text()
        alert('Gagal menyimpan data: ' + err)
      }
    } catch (e) {
      console.error(e)
      alert('Terjadi kesalahan jaringan saat menyimpan.')
    } finally {
      setIsSubmittingInv(false)
    }
  }

  const deleteInv = async (id: string) => {
    if (!confirm('Hapus item inventaris ini?')) return
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchInv()
    } catch (e) { console.error(e) }
  }

  const addSetDetail = () => {
    setInvForm({ ...invForm, setDetails: [...invForm.setDetails, { itemName: '', quantity: 1, status: 'good' }] })
  }
  const removeSetDetail = (idx: number) => {
    setInvForm({ ...invForm, setDetails: invForm.setDetails.filter((_: any, i: number) => i !== idx) })
  }
  const updateSetDetail = (idx: number, field: string, val: any) => {
    const newDetails = [...invForm.setDetails]
    newDetails[idx][field] = val
    setInvForm({ ...invForm, setDetails: newDetails })
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'tools': return <Wrench size={15} />
      case 'materials': return <Layers size={15} />
      case 'electrical': return <Zap size={15} />
      case 'plumbing': return <Droplets size={15} />
      case 'cleaning': return <Sparkles size={15} />
      default: return <Box size={15} />
    }
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'tools': return '#ef4444'
      case 'materials': return '#f59e0b'
      case 'electrical': return '#eab308'
      case 'plumbing': return '#3b82f6'
      case 'cleaning': return '#10b981'
      default: return '#6b7280'
    }
  }

  // --- DANA OPERASIONAL STATE ---
  const CURRENT_MONTH = new Date().getMonth()
  const CURRENT_YEAR = new Date().getFullYear()

  const [cfMonth, setCfMonth] = useState(CURRENT_MONTH)
  const [cfYear, setCfYear] = useState(CURRENT_YEAR)
  const [transactions, setTransactions] = useState<any[]>([])
  const [fiscalChartData, setFiscalChartData] = useState<any[]>([])
  const [expenseForm, setExpenseForm] = useState<{ itemName: string, quantity: string, unitPrice: string, amount: string, date: string, file: File | null }>({
    itemName: '', quantity: '', unitPrice: '', amount: '0', date: new Date().toISOString().split('T')[0], file: null
  })

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
          proofImage: item.proofImage,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
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

  // --- PROKER HOOKS & HANDLERS ---
  useEffect(() => {
    const fetchTasksByMonth = async () => {
      try {
        const res = await fetch(`/api/tasks?category=bppg&month=${prokerMonth}&year=${prokerYear}`)
        if (res.ok) {
          const data = await res.json()
          setTasks(data)
        }
      } catch (e) { console.error(e) }
    }
    fetchTasksByMonth()
  }, [prokerMonth, prokerYear])

  const handleAddTask = async (colStatus: string) => {
    if (!taskForm.title.trim()) return
    const dueDate = new Date(prokerYear, prokerMonth, 15).toISOString()
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskForm, category: 'bppg', status: colStatus, dueDate })
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks(prev => [{ ...newTask, relatedRoom: newTask.relatedRoom || '' }, ...prev])
        setTaskForm({ title: '', description: '', priority: 'normal', assigneeName: '', dueDate })
        setShowAddTask(null)
      }
    } catch (e) { console.error(e) }
  }

  const moveTask = async (task: any, newStatus: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus })
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as any } : t))
      }
    } catch (e) { console.error(e) }
  }

  const deleteProkerTask = async (id: string) => {
    if (!confirm('Hapus task ini?')) return
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
      if (res.ok) setTasks(prev => prev.filter(t => t.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseForm.itemName || !expenseForm.amount) return

    let mediaId = null
    if (expenseForm.file) {
      const fd = new FormData()
      fd.append('file', expenseForm.file)
      try {
        const resFile = await fetch('/api/upload', { method: 'POST', body: fd })
        if (resFile.ok) {
          const fileData = await resFile.json()
          mediaId = fileData.doc.id
        }
      } catch (err) { console.error('Upload failed', err) }
    }

    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseForm.itemName,
          amount: Number(expenseForm.amount),
          quantity: expenseForm.quantity ? Number(expenseForm.quantity) : undefined,
          unitPrice: expenseForm.unitPrice ? Number(expenseForm.unitPrice) : undefined,
          transactionDate: expenseForm.date,
          type: 'out',
          category: 'operational',
          currency: 'EGP',
          division: 'bppg',
          proofImage: mediaId
        }),
      })
      if (res.ok) {
        setExpenseForm({ itemName: '', quantity: '', unitPrice: '', amount: '0', date: new Date().toISOString().split('T')[0], file: null })
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
  const isArchive = cfMonth !== CURRENT_MONTH || cfYear !== CURRENT_YEAR
  const viewLabel = new Date(cfYear, cfMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })

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
                { key: 'proker', icon: <KanbanSquare size={18} />, label: 'Proker Bulanan' },
                { key: 'inventaris', icon: <Package size={18} />, label: 'Inventaris BPPG' },
                { key: 'dana_ops', icon: <Wallet size={18} />, label: 'Dana Operasional' },
              ].map(t => (
                <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key as any)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              PROKER BULANAN — Trello Board
          ═══════════════════════════════════════════ */}
          {activeTab === 'proker' && (() => {
            const monthName = new Date(prokerYear, prokerMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
            const COLS = [
              { status: 'pending', label: '📋 Todo', color: '#6b7280', bg: '#f3f4f6' },
              { status: 'in_progress', label: '⚡ In Progress', color: '#f59e0b', bg: '#fffbeb' },
              { status: 'done', label: '✅ Selesai', color: '#10b981', bg: '#ecfdf5' },
            ]
            const filtered = tasks.filter(t => filterAssignee === 'all' || (t as any).relatedRoom === filterAssignee)
            return (
              <div className="proker-board-wrapper">
                {/* Board Header */}
                <div className="proker-header">
                  <div className="proker-title-row">
                    <KanbanSquare size={22} style={{ color: 'var(--color-primary)' }} />
                    <h2>Program Kerja Bulanan</h2>
                  </div>
                  <div className="proker-controls-row">
                    {/* Month Selector */}
                    <div className="month-nav-pill">
                      <button className="mnav-btn" onClick={() => { if (prokerMonth === 0) { setProkerMonth(11); setProkerYear(y => y - 1) } else setProkerMonth(m => m - 1) }}><ChevronLeft size={16} /></button>
                      <span className="mnav-label">{monthName}</span>
                      <button className="mnav-btn" onClick={() => { if (prokerMonth === 11) { setProkerMonth(0); setProkerYear(y => y + 1) } else setProkerMonth(m => m + 1) }}><ChevronRight size={16} /></button>
                    </div>
                    {/* Assignee Filter */}
                    <div className="assignee-filter-row">
                      <button className={`af-chip ${filterAssignee === 'all' ? 'af-active' : ''}`} onClick={() => setFilterAssignee('all')}>Semua</button>
                      {STAFF.map(s => (
                        <button key={s.name} className={`af-chip ${filterAssignee === s.name ? 'af-active' : ''}`} onClick={() => setFilterAssignee(filterAssignee === s.name ? 'all' : s.name)} style={{ '--chip-color': s.color } as any}>
                          <span className="af-avatar" style={{ background: s.color }}>{s.initials}</span>
                          <span className="af-name">{s.initials}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kanban Board */}
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

                        {/* Quick Add Form */}
                        {showAddTask === col.status && (
                          <div className="trello-add-form">
                            <input className="trello-input" placeholder="Judul task..." value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                            <textarea className="trello-textarea" placeholder="Deskripsi (opsional)" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                            <div className="trello-form-row">
                              <select className="trello-select" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}>
                                <option value="high">🔴 High</option>
                                <option value="normal">🟡 Normal</option>
                                <option value="low">🟢 Low</option>
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

                        {/* Cards */}
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
                                  {col.status !== 'pending' && (
                                    <button className="card-move-btn" title="Mundur" onClick={() => moveTask(task, col.status === 'in_progress' ? 'pending' : 'in_progress')}><MoveLeft size={13} /></button>
                                  )}
                                  {col.status !== 'done' && (
                                    <button className="card-move-btn fwd" title="Maju" onClick={() => moveTask(task, col.status === 'pending' ? 'in_progress' : 'done')}><MoveRight size={13} /></button>
                                  )}
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

          {/* ═══════════════════════════════════════════
              INVENTARIS BPPG
          ═══════════════════════════════════════════ */}
          {activeTab === 'inventaris' && (
            <div className="inv-dashboard">
              <div className="inv-header" style={{ position: 'relative', zIndex: 10 }}>
                <div>
                  <h2>📦 Inventaris BPPG</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Pencatatan aset tetap, alat kerja, dan material operasional.</p>
                </div>
                <button className="btn btn-primary" style={{ position: 'relative', zIndex: 50, cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => setShowInvForm(true)}>+ Tambah Barang</button>
              </div>

              {showInvForm && (
                <div className="modal-overlay">
                  <div className="modal-content inv-modal">
                    <h3>Tambah Barang Inventaris</h3>
                    <form onSubmit={handleInvSubmit} className="inv-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Nama Barang / Alat</label>
                          <input type="text" className="trello-input" value={invForm.itemName} onChange={e => setInvForm({ ...invForm, itemName: e.target.value })} required />
                        </div>
                        <div className="form-group">
                          <label>Kategori</label>
                          <select className="trello-select" value={invForm.category} onChange={e => setInvForm({ ...invForm, category: e.target.value })}>
                            <option value="tools">Alat Tukang (Tools)</option>
                            <option value="materials">Material Bangunan</option>
                            <option value="electrical">Elektronik & Kelistrikan</option>
                            <option value="plumbing">Pipa & Saluran</option>
                            <option value="cleaning">Alat Kebersihan</option>
                            <option value="others">Lainnya</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Tipe Barang</label>
                          <select className="trello-select" value={invForm.inventoryType} onChange={e => setInvForm({ ...invForm, inventoryType: e.target.value })}>
                            <option value="asset">Aset Tetap (Palu, Bor, Kunci)</option>
                            <option value="consumable">Habis Pakai (Paku, Lem, Pipa)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Satuan</label>
                          <select className="trello-select" value={invForm.unit} onChange={e => setInvForm({ ...invForm, unit: e.target.value })}>
                            <option value="pcs">Pcs</option>
                            <option value="set">Set</option>
                            <option value="roll">Roll</option>
                            <option value="meter">Meter</option>
                            <option value="kg">Kg</option>
                            <option value="box">Box</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Total Stok Keseluruhan</label>
                          <input type="number" className="trello-input" min="1" value={invForm.currentStock} onChange={e => setInvForm({ ...invForm, currentStock: Number(e.target.value) })} required />
                        </div>
                        <div className="form-group">
                          <label>Minimum Stok (Warning)</label>
                          <input type="number" className="trello-input" min="0" value={invForm.minimumStock} onChange={e => setInvForm({ ...invForm, minimumStock: Number(e.target.value) })} />
                        </div>
                      </div>

                      {invForm.inventoryType === 'asset' && (
                        <div className="form-group condition-box">
                          <label>Rincian Kondisi Aset (Total = {invForm.currentStock})</label>
                          <div className="condition-row">
                            <div className="cond-item"><label>🟢 Bagus</label><input type="number" className="trello-input" min="0" value={invForm.condition.good} onChange={e => setInvForm({ ...invForm, condition: { ...invForm.condition, good: Number(e.target.value) } })} /></div>
                            <div className="cond-item"><label>🟡 Rusak</label><input type="number" className="trello-input" min="0" value={invForm.condition.broken} onChange={e => setInvForm({ ...invForm, condition: { ...invForm.condition, broken: Number(e.target.value) } })} /></div>
                            <div className="cond-item"><label>🔴 Hilang</label><input type="number" className="trello-input" min="0" value={invForm.condition.lost} onChange={e => setInvForm({ ...invForm, condition: { ...invForm.condition, lost: Number(e.target.value) } })} /></div>
                          </div>
                        </div>
                      )}

                      {invForm.unit === 'set' && (
                        <div className="form-group set-details-box">
                          <div className="set-box-header">
                            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rincian Isi Set (Opsional)</label>
                            <button type="button" className="btn-mini" onClick={addSetDetail}>+ Tambah Isi Set</button>
                          </div>
                          {invForm.setDetails.map((det: any, idx: number) => (
                            <div key={idx} className="set-detail-row">
                              <input type="text" className="trello-input" placeholder="Nama item (misal: Kunci Pas 10mm)" value={det.itemName} onChange={e => updateSetDetail(idx, 'itemName', e.target.value)} required />
                              <input type="number" className="trello-input qty-input" placeholder="Qty" value={det.quantity} onChange={e => updateSetDetail(idx, 'quantity', Number(e.target.value))} min="1" required />
                              <select className="trello-select status-sel" value={det.status} onChange={e => updateSetDetail(idx, 'status', e.target.value)}>
                                <option value="good">🟢 Bagus</option>
                                <option value="broken">🟡 Rusak</option>
                                <option value="missing">🔴 Hilang</option>
                              </select>
                              <button type="button" className="btn-icon text-danger" onClick={() => removeSetDetail(idx)}><Trash2 size={16} /></button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowInvForm(false)}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmittingInv}>
                          {isSubmittingInv ? 'Menyimpan...' : 'Simpan Barang'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="inv-grid">
                {inventoryList.map(item => {
                  const isLow = item.currentStock <= item.minimumStock
                  const catColor = getCategoryColor(item.category)
                  
                  // Calculate Condition Percentages
                  let goodPct = 0, brokenPct = 0, lostPct = 0
                  if (item.inventoryType === 'asset' && item.condition && item.currentStock > 0) {
                    goodPct = (item.condition.good / item.currentStock) * 100
                    brokenPct = (item.condition.broken / item.currentStock) * 100
                    lostPct = (item.condition.lost / item.currentStock) * 100
                  }

                  return (
                    <div key={item.id} className={`inv-card premium-card ${isLow ? 'low-stock' : ''}`} style={{ '--card-accent': catColor } as React.CSSProperties}>
                      {/* Decorative Background Blur */}
                      <div className="inv-card-bg-blur" style={{ background: catColor }}></div>
                      
                      <div className="inv-card-header">
                        <div className="inv-cat-pill" style={{ color: catColor, background: `${catColor}15`, border: `1px solid ${catColor}30` }}>
                          {getCategoryIcon(item.category)}
                          <span>{item.category.toUpperCase()}</span>
                        </div>
                        <button onClick={() => deleteInv(item.id)} className="btn-icon text-danger"><Trash2 size={15} /></button>
                      </div>

                      <div className="inv-card-body">
                        <h3 className="inv-title">{item.itemName}</h3>
                        
                        <div className="inv-stock-main">
                          <div className="stock-number">
                            <span className="inv-stock-num">{item.currentStock}</span>
                            <span className="inv-stock-unit">{item.unit}</span>
                          </div>
                          {item.inventoryType === 'asset' ? (
                             <span className="inv-type-badge premium asset">Aset Tetap</span>
                          ) : (
                             <span className="inv-type-badge premium cons">Habis Pakai</span>
                          )}
                        </div>

                        {isLow && (
                          <div className="low-stock-warning">
                            <AlertTriangle size={14} /> Stok menipis (Minimum: {item.minimumStock})
                          </div>
                        )}

                        {item.inventoryType === 'asset' && item.condition && (
                          <div className="inv-condition-module">
                            <div className="condition-bar-wrapper">
                              <div className="cond-segment good" style={{ width: `${goodPct}%` }}></div>
                              <div className="cond-segment broken" style={{ width: `${brokenPct}%` }}></div>
                              <div className="cond-segment lost" style={{ width: `${lostPct}%` }}></div>
                            </div>
                            <div className="condition-legend">
                              <div className="legend-item"><span className="dot good"></span> Bagus: {item.condition.good || 0}</div>
                              <div className="legend-item"><span className="dot broken"></span> Rusak: {item.condition.broken || 0}</div>
                              <div className="legend-item"><span className="dot lost"></span> Hilang: {item.condition.lost || 0}</div>
                            </div>
                          </div>
                        )}

                        {item.unit === 'set' && item.setDetails && item.setDetails.length > 0 && (
                          <div className="inv-set-module">
                            <div className="set-module-header">
                              <Package size={14} /> Rincian Isi Set
                            </div>
                            <div className="set-items-grid">
                              {item.setDetails.map((sd: any, i: number) => (
                                <div key={i} className={`set-item-row ${sd.status}`}>
                                  <span className="sd-qty">{sd.quantity}x</span>
                                  <span className="sd-name">{sd.itemName}</span>
                                  <span className={`sd-badge ${sd.status}`}>
                                    {sd.status === 'good' ? '✓' : sd.status === 'broken' ? 'Rusak' : 'Hilang'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {inventoryList.length === 0 && (
                  <div className="inv-empty-state">
                    <Box size={40} />
                    Belum ada inventaris yang dicatat.
                  </div>
                )}
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
                   <button onClick={() => generateCashflowPDF(cfMonth, cfYear, transactions)} className="cf-pdf-btn"><Download size={14} /> PDF</button>
                 </div>

                 {isArchive ? (
                   <div className="cf-archive-expense-note">
                     <span>🔒 Periode ini sudah ditutup. Data di bawah adalah arsip belanja.</span>
                   </div>
                 ) : (
                   <form onSubmit={handleExpenseSubmit} className="cf-expense-form">
                     <input type="text" className="cf-input" placeholder="Nama barang / keperluan *" value={expenseForm.itemName} onChange={e => setExpenseForm({ ...expenseForm, itemName: e.target.value })} required />
                     <div className="cf-input-row">
                       <div className="cf-input-group">
                         <label>Qty</label>
                         <input type="number" className="cf-input" placeholder="1" value={expenseForm.quantity} onChange={e => { const qty = Number(e.target.value); const price = Number(expenseForm.unitPrice); setExpenseForm({ ...expenseForm, quantity: e.target.value, amount: (qty * price).toString() }) }} />
                       </div>
                       <div className="cf-input-group">
                         <label>Harga Satuan</label>
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
                         <Camera size={18} />
                         <span>{expenseForm.file ? expenseForm.file.name : 'Upload Struk / Kwitansi'}</span>
                       </label>
                     </div>
                     <button type="submit" className="cf-submit-btn"><Save size={16} /> Simpan Belanja</button>
                   </form>
                 )}

                 <div className="cf-timeline" style={{ marginTop: '12px' }}>
                   {transactions.filter(t => t.type === 'out').length === 0 ? (
                     <div className="cf-empty"><TrendingDown size={32} /><p>{isArchive ? 'Tidak ada belanja di periode ini' : 'Belum ada catatan belanja'}</p></div>
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
                               {t.proofImage && <a href={`/api/media/file/${typeof t.proofImage === 'string' ? t.proofImage : t.proofImage.filename}`} target="_blank" className="cf-proof-link"><Eye size={11} /> Struk</a>}
                               {!isArchive && <button onClick={() => deleteTransaction(t.id)} className="cf-del-btn"><Trash2 size={12} /></button>}
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

        /* ═══════════════════════════════════
           TRELLO BOARD — Proker Bulanan
        ═══════════════════════════════════ */
        .proker-board-wrapper { display: flex; flex-direction: column; gap: 20px; animation: fadeIn 0.4s ease-out; }
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

        /* ═══════════════════════════════════
           INVENTARIS BPPG - PREMIUM UI
        ═══════════════════════════════════ */
        .inv-dashboard { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.4s ease-out; }
        .inv-header { display: flex; justify-content: space-between; align-items: center; background: var(--color-bg-card); padding: 20px 28px; border-radius: var(--radius-2xl); box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid var(--color-bg-secondary); position: relative; z-index: 10; }
        .inv-header h2 { font-size: 1.6rem; font-weight: 800; margin: 0 0 4px 0; color: var(--color-text-primary); letter-spacing: -0.02em; }
        .inv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        
        .premium-card { position: relative; background: var(--color-bg-card); border-radius: var(--radius-2xl); padding: 20px; border: 1px solid var(--color-bg-secondary); box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 16px; overflow: hidden; z-index: 1; }
        .premium-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); border-color: rgba(var(--card-accent), 0.3); }
        .premium-card.low-stock { border-left: 4px solid #ef4444; }
        
        /* Ambient Background Blur */
        .inv-card-bg-blur { position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; filter: blur(50px); opacity: 0.15; z-index: -1; transition: opacity 0.3s; }
        .premium-card:hover .inv-card-bg-blur { opacity: 0.3; }

        .inv-card-header { display: flex; justify-content: space-between; align-items: center; }
        .inv-cat-pill { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .inv-card-body { display: flex; flex-direction: column; gap: 12px; }
        .inv-title { font-size: 1.25rem; font-weight: 800; margin: 0; color: var(--color-text-primary); line-height: 1.3; }
        
        .inv-stock-main { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); padding: 12px 16px; border-radius: var(--radius-lg); border: 1px solid rgba(0,0,0,0.03); }
        .stock-number { display: flex; align-items: baseline; gap: 6px; }
        .inv-stock-num { font-size: 2.2rem; font-weight: 900; color: var(--color-text-primary); line-height: 1; letter-spacing: -0.03em; }
        .inv-stock-unit { font-size: 0.9rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .inv-type-badge.premium { font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; border: 1px solid; }
        .inv-type-badge.premium.asset { background: rgba(59, 130, 246, 0.05); color: #2563eb; border-color: rgba(59, 130, 246, 0.2); }
        .inv-type-badge.premium.cons { background: rgba(16, 185, 129, 0.05); color: #059669; border-color: rgba(16, 185, 129, 0.2); }

        .low-stock-warning { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 8px; border: 1px solid #fee2e2; }

        /* Condition Bar */
        .inv-condition-module { display: flex; flex-direction: column; gap: 8px; }
        .condition-bar-wrapper { display: flex; width: 100%; height: 8px; border-radius: 4px; overflow: hidden; background: var(--color-bg-secondary); }
        .cond-segment { height: 100%; transition: width 0.5s ease; }
        .cond-segment.good { background: #10b981; }
        .cond-segment.broken { background: #f59e0b; }
        .cond-segment.lost { background: #ef4444; }
        .condition-legend { display: flex; gap: 12px; font-size: 0.7rem; font-weight: 600; color: var(--color-text-secondary); }
        .legend-item { display: flex; align-items: center; gap: 4px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.good { background: #10b981; }
        .dot.broken { background: #f59e0b; }
        .dot.lost { background: #ef4444; }

        /* Set Details Module */
        .inv-set-module { background: rgba(0,0,0,0.015); border-radius: var(--radius-lg); border: 1px solid rgba(0,0,0,0.04); overflow: hidden; margin-top: 4px; }
        .set-module-header { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: var(--color-text-secondary); padding: 10px 14px; background: rgba(0,0,0,0.02); border-bottom: 1px solid rgba(0,0,0,0.03); text-transform: uppercase; letter-spacing: 0.05em; }
        .set-items-grid { display: flex; flex-direction: column; }
        .set-item-row { display: grid; grid-template-columns: 30px 1fr auto; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(0,0,0,0.02); font-size: 0.8rem; transition: background 0.2s; }
        .set-item-row:last-child { border-bottom: none; }
        .set-item-row:hover { background: rgba(0,0,0,0.02); }
        .sd-qty { font-weight: 800; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
        .sd-name { font-weight: 600; color: var(--color-text-primary); }
        .set-item-row.missing .sd-name { text-decoration: line-through; opacity: 0.5; }
        .sd-badge { font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; text-align: center; min-width: 45px; }
        .sd-badge.good { background: #ecfdf5; color: #059669; }
        .sd-badge.broken { background: #fef3c7; color: #b45309; }
        .sd-badge.missing { background: #fef2f2; color: #dc2626; }

        /* Form Modal - Upgraded */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px; backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out; }
        .modal-content.inv-modal { background: var(--color-bg-primary); border-radius: var(--radius-2xl); width: 100%; max-width: 650px; padding: 32px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.1); position: relative; z-index: 100000; }
        .modal-content h3 { font-size: 1.5rem; font-weight: 800; margin: 0 0 24px 0; color: var(--color-text-primary); border-bottom: 2px solid var(--color-bg-secondary); padding-bottom: 16px; letter-spacing: -0.02em; }
        .inv-form { display: flex; flex-direction: column; gap: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; gap: 16px; } }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.85rem; font-weight: 700; color: var(--color-text-secondary); }
        
        .condition-box { background: rgba(243, 244, 246, 0.5); border-radius: var(--radius-xl); padding: 18px; border: 1px solid var(--color-bg-secondary); }
        .condition-row { display: flex; gap: 16px; }
        @media (max-width: 400px) { .condition-row { flex-direction: column; } }
        .cond-item { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .cond-item label { font-size: 0.8rem; }
        
        .set-details-box { background: #fafafa; border-radius: var(--radius-xl); padding: 18px; border: 2px dashed #e5e7eb; transition: border-color 0.2s; }
        .set-details-box:focus-within { border-color: var(--color-primary-light); }
        .set-box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .btn-mini { background: var(--color-primary-light); color: var(--color-primary-dark); border: none; font-size: 0.75rem; font-weight: 700; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .btn-mini:hover { background: var(--color-primary); color: white; transform: translateY(-1px); }
        .set-detail-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; background: white; padding: 8px; border-radius: var(--radius-lg); border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .qty-input { width: 80px; text-align: center; }
        .status-sel { width: 130px; font-weight: 600; }
        .btn-icon { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 8px; transition: all 0.2s; color: var(--color-text-muted); }
        .btn-icon:hover { background: #fee2e2; color: #ef4444; }

        .inv-empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(0,0,0,0.015); border: 2px dashed rgba(0,0,0,0.05); border-radius: var(--radius-2xl); color: var(--color-text-muted); font-size: 0.95rem; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .inv-empty-state svg { color: var(--color-text-secondary); opacity: 0.5; }

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
        
        /* Timeline */
        .cf-timeline { display: flex; flex-direction: column; gap: 0; }
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
        .cf-tl-meta { display: flex; align-items: center; gap: 10px; font-size: 0.72rem; color: var(--color-text-muted); }
        .cf-proof-link { display: inline-flex; align-items: center; gap: 3px; color: var(--color-primary); font-weight: 600; text-decoration: none; font-size: 0.72rem; }
        .cf-del-btn { background: none; border: none; padding: 2px 4px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; border-radius: 4px; transition: all 0.15s; }
        .cf-del-btn:hover { background: rgba(239,68,68,0.08); color: #ef4444; }
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
        .cf-upload-label { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; color: var(--color-text-muted); font-size: 0.82rem; transition: background 0.2s; }
        .cf-upload-label:hover { background: var(--color-bg-secondary); }
        .cf-submit-btn { background: linear-gradient(135deg, #8B4513, #A0522D); color: white; border: none; border-radius: 10px; padding: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s, transform 0.15s; }
        .cf-submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .cf-archive-banner { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; margin-bottom: 0.5rem; }
        .cf-archive-icon { font-size: 1.5rem; background: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; box-shadow: var(--shadow-sm); }
        .cf-archive-info { flex: 1; display: flex; flex-direction: column; }
        .cf-archive-title { font-weight: 700; color: #1e40af; font-size: 0.95rem; }
        .cf-archive-sub { font-size: 0.75rem; color: #3b82f6; }
        .cf-archive-pdf-btn { background: #3b82f6; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s; }
        .cf-archive-pdf-btn:hover { opacity: 0.9; }
        .cf-archive-expense-note { background: var(--color-bg-secondary); padding: 12px; border-radius: 10px; border: 1px dashed var(--color-border); text-align: center; font-size: 0.8rem; color: var(--color-text-muted); font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 6px; }

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
