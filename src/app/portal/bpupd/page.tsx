'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Mock Data Types
type Transaction = {
  id: number
  date: string
  category: string
  amount: number
  currency: 'USD' | 'EGP' | 'IDR'
  type: 'in' | 'out'
  description: string
  status: 'pending' | 'approved' | 'paid'
  quantity?: number
  unitPrice?: number
  proofImage?: any
}

type Task = {
  id: string
  title: string
  category: 'housekeeping' | 'maintenance' | 'inventory' | 'admin'
  priority: 'high' | 'normal' | 'low'
  status: 'pending' | 'in_progress' | 'done'
  dueDate: string
}

export default function BPUPDPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'kanban' | 'jamaah' | 'broadcast' | 'proker' | 'keuangan'>('kanban')
  const [financeTab, setFinanceTab] = useState<'income' | 'expense'>('income')

  // Financial State
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'housekeeping',
    priority: 'normal'
  })



  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'out', // 'in' = Debit from Treasurer, 'out' = Credit/Shopping
    category: 'operational',
    amount: '',
    currency: 'EGP',
    description: '',
    quantity: '',
    unitPrice: '',
    file: null as File | null
  })

  // Mock initial fetch
  // Initial Fetch
  useEffect(() => {
    // Fetch Finance Data
    const fetchFinance = async () => {
      try {
        const res = await fetch('/api/finance')
        if (res.ok) {
          const data = await res.json()
          // Map backend fields to frontend Transaction type
          const mappedData = data.map((item: any) => ({
            id: item.id,
            date: item.transactionDate.split('T')[0],
            category: item.category,
            amount: item.amount,
            currency: item.currency,
            type: item.type,
            description: item.description,
            status: item.approvalStatus
          }))
          setTransactions(mappedData)
        }
      } catch (error) {
        console.error('Failed to fetch finance', error)
      }
    }
    fetchFinance()

    // Fetch Tasks
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks')
        if (res.ok) {
          const data = await res.json()
          setTasks(data)
        }
      } catch (error) {
        console.error('Failed to fetch tasks', error)
      }
    }
    fetchTasks()
  }, [])



  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let proofImageId = null

      // 1. Upload Image (Bukti)
      if (expenseForm.file) {
        const formData = new FormData()
        formData.append('file', expenseForm.file)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const media = await uploadRes.json()
          proofImageId = media.id
        } else {
          alert('Gagal upload gambar, tapi data transaksi akan tetap disimpan.')
        }
      }

      const payload = {
        ...expenseForm,
        proofImage: proofImageId
        // type is already set in expenseForm
      }
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const newItem = await res.json()
        const newTx: Transaction = {
          id: newItem.id,
          date: newItem.transactionDate.split('T')[0],
          category: newItem.category,
          amount: newItem.amount,
          currency: newItem.currency,
          type: newItem.type,
          description: newItem.description,
          status: newItem.approvalStatus,
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice,
          proofImage: newItem.proofImage
        }
        setTransactions(prev => [newTx, ...prev])
        alert('Transaksi berhasil disimpan!')
        setExpenseForm({
          ...expenseForm,
          amount: '',
          description: '',
          quantity: '',
          unitPrice: '',
          file: null
        })
      }
    } catch (error) {
      console.error('Error saving expense', error)
      alert('Gagal menyimpan transaksi')
    }
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks(prev => [newTask, ...prev])
        setTaskForm({ title: '', category: 'housekeeping', priority: 'normal' })
      }
    } catch (error) {
      console.error('Error creating task', error)
      alert('Failed to create task')
    }
  }

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus })
      })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
      }
    } catch (error) {
      console.error('Error updating task', error)
    }
  }

  const generatePDF = (type: 'income' | 'expense') => {
    const doc = new jsPDF()
    const title = type === 'income'
      ? 'Laporan Pemasukan (Arsip)'
      : 'Laporan Pengeluaran BPUPD'

    const filteredTx = transactions.filter(t => {
      if (type === 'income') {
        return t.type === 'in' && t.category !== 'treasurer_funding'
      } else {
        return t.type === 'out' || t.category === 'treasurer_funding'
      }
    })

    doc.setFontSize(18)
    doc.text(title, 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

    const tableColumn = ["Date", "Description", "Category", "Amount", "Currency"]
    const tableRows = filteredTx.map(tx => [
      tx.date,
      tx.description,
      tx.category,
      tx.amount,
      tx.currency
    ])

    autoTable(doc as any, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    })

    doc.save(`report-${type}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  // Calculate totals
  const totalIncomeUSD = transactions.filter(t => t.type === 'in' && t.currency === 'USD').reduce((acc, curr) => acc + curr.amount, 0)
  const totalIncomeEGP = transactions.filter(t => t.type === 'in' && t.currency === 'EGP').reduce((acc, curr) => acc + curr.amount, 0)

  // Expense/Fund Calculations
  const totalDebit = transactions.filter(t => t.category === 'treasurer_funding' && t.type === 'in').reduce((acc, curr) => acc + curr.amount, 0)
  const totalCredit = transactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0)
  const remainingBalance = totalDebit - totalCredit

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
          <button className={`tab ${activeTab === 'kanban' ? 'active' : ''}`} onClick={() => setActiveTab('kanban')}>📋 Visa Kanban</button>
          <button className={`tab ${activeTab === 'proker' ? 'active' : ''}`} onClick={() => setActiveTab('proker')}>📝 Proker Bulanan</button>
          <button className={`tab ${activeTab === 'keuangan' ? 'active' : ''}`} onClick={() => setActiveTab('keuangan')}>💰 Keuangan</button>
        </div>

        {activeTab === 'kanban' && (
          <div className="kanban-board">
            <div className="kanban-column">
              <h3 className="column-header pending">📄 Pending Docs (2)</h3>
            </div>
            {/* ... existing kanban ... */}
          </div>
        )}

        {activeTab === 'proker' && (
          <div className="proker-container">
            <div className="card full-width">
              <div className="card-header">
                <h3>📝 Program Kerja Bulanan - Februari 2026</h3>
              </div>

              <form onSubmit={handleTaskSubmit} className="task-form">
                <input
                  type="text"
                  placeholder="Tambah kegiatan baru..."
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  className="task-input"
                />
                <select
                  value={taskForm.category}
                  onChange={e => setTaskForm({ ...taskForm, category: e.target.value as any })}
                  className="task-select"
                >
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inventory">Inventory</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={taskForm.priority}
                  onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                  className="task-select"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
                <button type="submit" className="btn btn-primary btn-sm">Tambah</button>
              </form>

              <div className="todo-list">
                {tasks.length === 0 ? (
                  <p className="no-tasks">Belum ada program kerja.</p>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className={`todo-item ${task.status}`}>
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={() => toggleTaskStatus(task)}
                      />
                      <div className="todo-content">
                        <span className={`todo-title ${task.status === 'done' ? 'completed' : ''}`}>
                          {task.title}
                        </span>
                        <div className="todo-meta">
                          <span className="badge">{task.category}</span>
                          <span className={`priority-dot ${task.priority}`}></span>
                          <span className="priority-text">{task.priority}</span>
                        </div>
                      </div>
                      <span className={`badge badge-${task.status === 'done' ? 'success' : 'warning'}`}>
                        {task.status === 'done' ? 'Selesai' : 'Pending'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>


          </div>
        )}

        {activeTab === 'keuangan' && (
          <div className="finance-dashboard">
            <div className="finance-tabs">
              <button className={`sub-tab ${financeTab === 'income' ? 'active' : ''}`} onClick={() => setFinanceTab('income')}>📥 Pemasukan</button>
              <button className={`sub-tab ${financeTab === 'expense' ? 'active' : ''}`} onClick={() => setFinanceTab('expense')}>📤 Pengeluaran & Dana</button>
            </div>

            {financeTab === 'income' && (
              <div className="finance-section">
                <div className="folders-container">
                  <div className="folder-grid">
                    {['Februari 2026', 'Januari 2026', 'Desember 2025'].map(month => (
                      <div key={month} className="folder-card" onClick={() => alert('Fitur Integrasi Portal Invoice (Segera Hadir)')}>
                        <div className="folder-icon">📁</div>
                        <div className="folder-name">{month}</div>
                        <div className="folder-info">4 Laporan Tersedia</div>
                      </div>
                    ))}
                  </div>
                  <div className="empty-state-message">
                    <p>ℹ️ Data Pemasukan akan otomatis terintegrasi dari <strong>Portal Invoice</strong> (Public).</p>
                    <p>Tidak ada input manual di halaman ini.</p>
                  </div>
                </div>

                <div className="card mt-4">
                  <div className="card-header">
                    <h3>Arsip Laporan Pemasukan (Terbaru)</h3>
                    <button onClick={() => generatePDF('income')} className="btn btn-sm btn-outline">🖨️ PDF Arsip</button>
                  </div>
                  <table className="table">
                    <thead>
                      <tr><th>Tgl</th><th>Ket</th><th>Jml</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.type === 'in' && t.category !== 'treasurer_funding').slice(0, 5).map(t => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td>{t.description}</td>
                          <td className="text-success">{t.amount} {t.currency}</td>
                          <td><span className="badge">{t.status}</span></td>
                        </tr>
                      ))}
                      {transactions.filter(t => t.type === 'in').length === 0 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data arsip</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {financeTab === 'expense' && (
              <div className="finance-section">
                <div className="card">
                  <h3>Input Pengeluaran / Dana Taktis</h3>
                  <form onSubmit={handleExpenseSubmit} className="finance-form">
                    <div className="form-group">
                      <label>Jenis Transaksi</label>
                      <select value={expenseForm.type} onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value as 'in' | 'out', category: e.target.value === 'in' ? 'treasurer_funding' : 'operational' })}>
                        <option value="in">📥 Debit (Terima Dana dari Bendahara)</option>
                        <option value="out">📤 Kredit (Belanja / Pengeluaran)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tanggal</label>
                      <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                    </div>

                    {expenseForm.type === 'out' && (
                      <div className="form-group">
                        <label>Kategori Belanja</label>
                        <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                          <option value="operational">Operasional Umum</option>
                          <option value="stock_hotel">Stok Hotel</option>
                          <option value="stock_aula">Stok Aula</option>
                          <option value="stock_visa">Stok Visa</option>
                          <option value="salary">Gaji / Honor</option>
                        </select>
                      </div>
                    )}


                    <div className="form-group full">
                      <label>Nama Barang / Keterangan</label>
                      <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} required placeholder="Contoh: Beli Air Mineral 10 dus" />
                    </div>

                    <div className="form-group">
                      <label>Qty (Pcs/Unit)</label>
                      <input
                        type="number"
                        value={expenseForm.quantity}
                        onChange={e => {
                          const qty = Number(e.target.value)
                          const price = Number(expenseForm.unitPrice)
                          setExpenseForm({
                            ...expenseForm,
                            quantity: e.target.value,
                            amount: (qty * price).toString()
                          })
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Harga Satuan</label>
                      <input
                        type="number"
                        value={expenseForm.unitPrice}
                        onChange={e => {
                          const price = Number(e.target.value)
                          const qty = Number(expenseForm.quantity)
                          setExpenseForm({
                            ...expenseForm,
                            unitPrice: e.target.value,
                            amount: (qty * price).toString()
                          })
                        }}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="form-group">
                      <label>Total Jumlah (Otomatis)</label>
                      <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required placeholder="0.00" />
                    </div>

                    <div className="form-group">
                      <label>Upload Foto Bukti / Kwitansi</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setExpenseForm({ ...expenseForm, file: e.target.files[0] })
                          }
                        }}
                        className="file-input"
                      />
                    </div>

                    <button type="submit" className={`btn ${expenseForm.type === 'in' ? 'btn-success' : 'btn-danger'} full`}>
                      {expenseForm.type === 'in' ? 'Simpan Pemasukan Dana' : 'Simpan Pengeluaran'}
                    </button>
                  </form>
                </div>

                <div className="card mt-4">
                  <div className="card-header">
                    <h3>Laporan Operasional & Belanja</h3>
                    <button onClick={() => generatePDF('expense')} className="btn btn-sm btn-outline">🖨️ Download PDF</button>
                  </div>
                  <div className="stats-row">
                    <div className="stat-item">
                      <span className="label">Total Debit (Dana)</span>
                      <span className="value text-success">{totalDebit}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Total Kredit (Belanja)</span>
                      <span className="value text-danger">{totalCredit}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Sisa Saldo</span>
                      <span className={`value ${remainingBalance < 0 ? 'text-danger' : 'text-primary'}`}>{remainingBalance}</span>
                    </div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr><th>Tgl</th><th>Ket</th><th>Kategori</th><th>Debit</th><th>Kredit</th></tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.type === 'out' || t.category === 'treasurer_funding').map(t => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td>
                            {t.description}
                            {t.quantity && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t.quantity} x {t.unitPrice}</div>}
                          </td>
                          <td><span className="badge">{t.category}</span></td>
                          <td className="text-success">{t.category === 'treasurer_funding' ? t.amount : '-'}</td>
                          <td className="text-danger">{t.type === 'out' ? t.amount : '-'}</td>
                          <td>
                            {t.proofImage && (
                              <a href={`/api/media/file/${typeof t.proofImage === 'string' ? t.proofImage : t.proofImage.filename}`} target="_blank" className="text-primary" style={{ fontSize: '0.8rem' }}>
                                📸 Bukti
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        /* Reuse existing styles plus new form styles */
        .task-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .task-input { flex: 2; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
        .task-select { flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
        .todo-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .no-tasks { text-align: center; color: #9ca3af; padding: 2rem; font-style: italic; }
        .todo-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; border-left: 4px solid transparent; transition: all 0.2s; }
        .todo-item.done { border-left-color: var(--color-success); background: #f0fdf4; }
        .todo-item.pending { border-left-color: var(--color-warning); }
        .todo-content { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
        .todo-title { font-weight: 500; }
        .todo-title.completed { text-decoration: line-through; color: #9ca3af; }
        .todo-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #6b7280; }
        .priority-dot { width: 8px; height: 8px; border-radius: 50%; }
        .priority-dot.high { background: #dc2626; }
        .priority-dot.normal { background: #f59e0b; }
        .priority-dot.low { background: #10b981; }

        .dashboard-layout { display: flex; min-height: 100vh; background: var(--color-bg-primary); }
        .portal-header { margin-bottom: 2rem; }
        .tabs { display: flex; gap: 1rem; margin-bottom: 2rem; }
        .tab { padding: 0.5rem 1rem; border: none; background: transparent; cursor: pointer; font-weight: 500; }
        .tab.active { color: var(--color-primary); border-bottom: 2px solid var(--color-primary); }
        
        .finance-tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
        .sub-tab { padding: 0.5rem 1rem; border: none; background: #f3f4f6; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
        .sub-tab.active { background: var(--color-primary); color: white; }

        .finance-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 0.875rem; color: #4b5563; }
        .form-group input, .form-group select { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
        
        .btn { padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600; }
        .btn-primary { background: var(--color-primary); color: white; }
        .btn-success { background: var(--color-success); color: white; }
        .btn-danger { background: #dc2626; color: white; }
        .btn-outline { border: 1px solid #d1d5db; background: white; }
        
        .stats-row { display: flex; gap: 2rem; margin-bottom: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; }
        .stat-item { display: flex; flex-direction: column; }
        .stat-item .label { font-size: 0.875rem; color: #6b7280; }
        .stat-item .value { font-size: 1.25rem; font-weight: 700; }

        .card { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .mt-4 { margin-top: 1.5rem; }
        .text-success { color: var(--color-success); }
        .text-danger { color: #dc2626; }
        .text-primary { color: var(--color-primary); }
        
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .badge { padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; background: #e5e7eb; }
        .wallet-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.25rem; }
        .wallet-tab { padding: 0.75rem 1.25rem; border: 1px solid #e5e7eb; background: white; border-radius: 0.5rem; cursor: pointer; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
        .wallet-tab.active { background: var(--color-primary); color: white; border-color: var(--color-primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .input-disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
        .text-warning { color: #f59e0b; }

        .folders-container { margin-bottom: 2rem; }
        .folder-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .folder-card { background: white; border-radius: 1rem; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; border: 1px solid #e5e7eb; }
        .folder-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: var(--color-primary); }
        .folder-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .folder-name { font-weight: 600; color: #1f2937; margin-bottom: 0.25rem; }
        .folder-info { font-size: 0.75rem; color: #6b7280; }
        .empty-state-message { text-align: center; padding: 2rem; background: #eff6ff; border-radius: 1rem; color: #1e40af; border: 1px dashed #bfdbfe; }
      `}</style>
    </div>
  )
}
