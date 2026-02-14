'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Mock Data Types
type Transaction = {
  id: string | number
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
  relatedBooking?: any // Populated booking object (Hotel or Auditorium)
  customerName?: string
  items?: { itemName: string; quantity: number }[]
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
  const [activeTab, setActiveTab] = useState<'kanban' | 'jamaah' | 'broadcast' | 'proker' | 'dana_ops' | 'pendapatan_unit'>('kanban')
  const [financeTab, setFinanceTab] = useState<'income' | 'expense'>('income')

  // Financial State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Transaction[]>([])

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'housekeeping',
    priority: 'normal'
  })

  // Income Form State
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    file: null as File | null,
  })

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    itemName: '',
    quantity: '',
    unitPrice: '',
    amount: '',
    file: null as File | null
  })

  // Report State
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [openMonth, setOpenMonth] = useState<number | null>(null)

  const generateMonthlyUnitReport = (monthIndex: number, category: string) => {
    const doc = new jsPDF()
    const monthName = new Date(reportYear, monthIndex, 1).toLocaleString('id-ID', { month: 'long' })
    const title = `Laporan Pendapatan ${category.charAt(0).toUpperCase() + category.slice(1)}`
    const period = `Periode: ${monthName} ${reportYear}`

    const filteredData = invoices.filter(inv => {
      const d = new Date(inv.date)
      return d.getFullYear() === reportYear &&
        d.getMonth() === monthIndex &&
        inv.category === category
    })

    if (filteredData.length === 0) {
      alert(`Tidak ada data transaksi untuk ${category} pada bulan ${monthName} ${reportYear}`)
      return
    }

    // --- Header (Kop Surat) ---
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("WISMA NUSANTARA CAIRO", 105, 15, { align: "center" })
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Indonesian Student Hostel & Community Center", 105, 20, { align: "center" })
    doc.text("Rabaa Adawiyah, Nasr City, Cairo, Egypt", 105, 25, { align: "center" })
    doc.line(14, 28, 196, 28) // Horizontal Line

    // --- Title ---
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(title.toUpperCase(), 14, 38)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(period, 14, 44)
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 50)

    // --- Totals ---
    const totals: Record<string, number> = {}
    filteredData.forEach(t => {
      totals[t.currency] = (totals[t.currency] || 0) + (t.amount || 0)
    })

    let yPos = 58
    doc.setFont("helvetica", "bold")
    doc.text("Ringkasan Total:", 14, yPos)
    yPos += 6
    doc.setFont("helvetica", "normal")
    Object.entries(totals).forEach(([curr, val]) => {
      doc.text(`- ${curr}: ${val.toLocaleString()}`, 20, yPos)
      yPos += 6
    })

    // --- Table Content ---
    let tableColumn: string[] = []
    let tableRows: any[] = []

    if (category === 'hotel') {
      tableColumn = ["No", "Tanggal", "Nama Tamu", "Total", "Durasi", "Keterangan (Kamar & Layanan)"]
      tableRows = filteredData.map((inv, index) => {
        // Duration from Item Quantity (First Item)
        const duration = inv.items && inv.items.length > 0 ? `${inv.items[0].quantity} Malam` : '-'

        // Description from Item Names
        const itemDescription = inv.items && inv.items.length > 0
          ? inv.items.map(i => i.itemName).join(', ')
          : '-'

        return [
          index + 1,
          inv.date,
          inv.customerName || inv.description.split('-')[1]?.trim() || '-',
          `${inv.amount.toLocaleString()} ${inv.currency}`,
          duration,
          itemDescription
        ]
      })
    } else if (category === 'auditorium') {
      tableColumn = ["No", "Tanggal", "Penyewa", "Event", "Total", "Durasi", "Keterangan (Paket & Fasilitas)"]
      tableRows = filteredData.map((inv, index) => {
        const booking = inv.relatedBooking || {}
        const eventName = booking.event?.name || '-'
        const duration = booking.hallRental?.duration ? `${booking.hallRental.duration} Jam` : (
          inv.items && inv.items.length > 0 ? `${inv.items[0].quantity} Jam` : '-'
        )

        // Try to use Invoice Items for description if available, else fallback to booking
        let description = ''
        if (inv.items && inv.items.length > 0) {
          description = inv.items.map(i => i.itemName).join(', ')
        } else {
          description = `Paket: ${booking.hallRental?.package || '-'}`
        }

        return [
          index + 1,
          inv.date,
          inv.customerName || booking.personal?.fullName || '-',
          eventName,
          `${inv.amount.toLocaleString()} ${inv.currency}`,
          duration,
          description
        ]
      })
    } else {
      // Default (Visa, Rental, etc.)
      tableColumn = ["No", "Tanggal", "Keterangan", "Jumlah"]
      tableRows = filteredData.map((tx, index) => [
        index + 1,
        tx.date,
        tx.description,
        `${tx.amount.toLocaleString()} ${tx.currency}`
      ])
    }

    autoTable(doc as any, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos + 5,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    })

    doc.save(`Laporan_${category}_${monthName}_${reportYear}.pdf`)
  }

  // Initial Fetch

  // Initial Fetch
  useEffect(() => {
    // Fetch Finance Data
    const fetchFinance = async () => {
      try {
        const res = await fetch('/api/finance')
        if (res.ok) {
          const data = await res.json()

          // 1. Map Cashflow Records (For Dana Operasional & Reports)
          const mappedCashflow = (data.cashflow || []).map((item: any) => ({
            id: item.id,
            date: item.transactionDate ? item.transactionDate.split('T')[0] : '',
            category: item.category,
            amount: item.amount,
            currency: item.currency,
            type: item.type,
            description: item.description,
            status: item.approvalStatus,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            proofImage: item.proofImage
          }))
          setTransactions(mappedCashflow)

          // 2. Map Paid Invoices (For Monitor Pendapatan Unit - The "Truth" for Income)
          const mappedInvoices = (data.invoices || []).map((inv: any) => ({
            id: inv.id,
            date: inv.invoiceDate ? inv.invoiceDate.split('T')[0] : (inv.updatedAt ? inv.updatedAt.split('T')[0] : ''),
            category: inv.bookingType || 'manual',
            amount: inv.totalAmount,
            currency: inv.currency,
            type: 'in',
            description: `${inv.invoiceNo} - ${inv.customerName}`,
            status: 'approved',
            quantity: 1,
            unitPrice: inv.totalAmount,
            proofImage: null,
            relatedBooking: inv.relatedBooking,
            customerName: inv.customerName,
            items: inv.items
          }))
          setInvoices(mappedInvoices)
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

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let proofImageId = null

      if (incomeForm.file) {
        const formData = new FormData()
        formData.append('file', incomeForm.file)

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
        type: 'in',
        category: 'treasurer_funding',
        amount: incomeForm.amount,
        transactionDate: incomeForm.date,
        description: incomeForm.description,
        currency: 'EGP',
        proofImage: proofImageId
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
          proofImage: newItem.proofImage
        }
        setTransactions(prev => [newTx, ...prev])
        alert('Pemasukan berhasil disimpan!')
        setIncomeForm({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          description: '',
          file: null
        })
      }
    } catch (error) {
      console.error('Error saving income', error)
      alert('Gagal menyimpan pemasukan')
    }
  }

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
        type: 'out',
        category: 'operational', // Default for BPUPD spending
        transactionDate: expenseForm.date,
        description: expenseForm.itemName,
        quantity: expenseForm.quantity,
        unitPrice: expenseForm.unitPrice,
        amount: expenseForm.amount,
        currency: 'EGP', // Default
        proofImage: proofImageId
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
        alert('Pengeluaran berhasil disimpan!')
        setExpenseForm({
          date: new Date().toISOString().split('T')[0],
          itemName: '',
          quantity: '',
          unitPrice: '',
          amount: '',
          file: null
        })
      }
    } catch (error) {
      console.error('Error saving expense', error)
      alert('Gagal menyimpan pengeluaran')
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
        return t.type === 'in' && t.category === 'treasurer_funding'
      } else {
        return t.type === 'out'
      }
    })

    doc.setFontSize(18)
    doc.text(title, 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

    const tableColumn = ["Date", "Description", "Qty", "Price", "Amount"]
    const tableRows = filteredTx.map(tx => [
      tx.date,
      tx.description,
      tx.quantity || '-',
      tx.unitPrice || '-',
      `${tx.amount} ${tx.currency}`
    ])

    autoTable(doc as any, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    })

    doc.save(`report-${type}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  // Calculate totals
  // Income calculations (Only from Treasurer Funding for this view mainly, but user might want to see all Income if relevant)
  const totalIncome = transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').reduce((acc, curr) => acc + curr.amount, 0)

  // Expense calculations
  const totalExpense = transactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0)

  const remainingBalance = totalIncome - totalExpense

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
          <button className={`tab ${activeTab === 'dana_ops' ? 'active' : ''}`} onClick={() => setActiveTab('dana_ops')}>💰 Dana Operasional</button>
          <button className={`tab ${activeTab === 'pendapatan_unit' ? 'active' : ''}`} onClick={() => setActiveTab('pendapatan_unit')}>📊 Monitor Pendapatan Unit</button>
        </div>

        {activeTab === 'kanban' && (
          <div className="kanban-board">
            <div className="kanban-column">
              <h3 className="column-header pending">📄 Pending Docs (2)</h3>
            </div>
            {/* ... existing kanban ... */}
            <div className="kanban-unavailable">
              <p>Kanban Board Visualization</p>
            </div>
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

        {activeTab === 'dana_ops' && (
          <div className="finance-dashboard">
            <div className="finance-tabs">
              <button className={`sub-tab ${financeTab === 'income' ? 'active' : ''}`} onClick={() => setFinanceTab('income')}>📥 Pemasukan (Dari Bendahara)</button>
              <button className={`sub-tab ${financeTab === 'expense' ? 'active' : ''}`} onClick={() => setFinanceTab('expense')}>📤 Pengeluaran Operasional</button>
            </div>

            {financeTab === 'income' && (
              <div className="finance-section">
                <div className="card">
                  <h3>Input Penerimaan Dana (Bendahara)</h3>
                  <p className="text-sm text-gray-500 mb-4">Hanya untuk input dana taktis dari bendahara. Pendapatan unit usaha tercatat otomatis.</p>
                  <form onSubmit={handleIncomeSubmit} className="finance-form">
                    <div className="form-group">
                      <label>Jumlah Uang (EGP)</label>
                      <input
                        type="number"
                        value={incomeForm.amount}
                        onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                        required
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Tanggal</label>
                      <input
                        type="date"
                        value={incomeForm.date}
                        onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group full">
                      <label>Keterangan</label>
                      <input
                        type="text"
                        value={incomeForm.description}
                        onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })}
                        required
                        placeholder="Contoh: Penerimaan Uang dari Bendahara"
                      />
                    </div>
                    <div className="form-group full">
                      <label>Upload Bukti Struk/Invoice</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setIncomeForm({ ...incomeForm, file: e.target.files[0] })
                          }
                        }}
                        className="file-input"
                      />
                    </div>
                    <button type="submit" className="btn btn-success full">
                      Simpan Pemasukan
                    </button>
                  </form>
                </div>

                <div className="card mt-4">
                  <div className="card-header">
                    <h3>Riwayat Pemasukan Bendahara</h3>
                    <div className="filter-tabs">
                      <button onClick={() => generatePDF('income')} className="btn btn-sm btn-outline">🖨️ PDF Arsip</button>
                    </div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr><th>Tgl</th><th>Ket</th><th>Kategori</th><th>Jml</th><th>Bukti</th></tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').map(t => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td>{t.description}</td>
                          <td>
                            <span className="badge badge-warning">Dana Taktis</span>
                          </td>
                          <td className="text-success">{t.amount} {t.currency}</td>
                          <td>
                            {t.proofImage && (
                              <a href={`/api/media/file/${typeof t.proofImage === 'string' ? t.proofImage : t.proofImage.filename}`} target="_blank" className="text-primary" style={{ fontSize: '0.8rem' }}>
                                📸 Lihat
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada data pemasukan</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {financeTab === 'expense' && (
              <div className="finance-section">
                <div className="card">
                  <h3>Input Pengeluaran Operasional</h3>
                  <form onSubmit={handleExpenseSubmit} className="finance-form">
                    <div className="form-group">
                      <label>Tanggal</label>
                      <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                    </div>

                    <div className="form-group full">
                      <label>Nama Barang / Keterangan</label>
                      <input type="text" value={expenseForm.itemName} onChange={e => setExpenseForm({ ...expenseForm, itemName: e.target.value })} required placeholder="Contoh: Beli Kertas HVS" />
                    </div>

                    <div className="form-group">
                      <label>Quantity</label>
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
                      <input type="number" value={expenseForm.amount} readOnly placeholder="0.00" className="input-disabled" />
                    </div>

                    <div className="form-group">
                      <label>Upload Bukti Kwitansi</label>
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

                    <button type="submit" className="btn btn-danger full">
                      Simpan Pengeluaran
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
                      <span className="value text-success">{totalIncome}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Total Kredit (Belanja)</span>
                      <span className="value text-danger">{totalExpense}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Sisa Saldo</span>
                      <span className={`value ${remainingBalance < 0 ? 'text-danger' : 'text-primary'}`}>{remainingBalance}</span>
                    </div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr><th>Tgl</th><th>Nama Barang</th><th>Qty</th><th>Harga</th><th>Total</th><th>Bukti</th></tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.type === 'out' && t.category === 'operational').map(t => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td>{t.description}</td>
                          <td>{t.quantity}</td>
                          <td>{t.unitPrice}</td>
                          <td className="text-danger">{t.amount}</td>
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

        {/* New Monitor Pendapatan Unit Tab */}
        {activeTab === 'pendapatan_unit' && (
          <div className="finance-section">
            <div className="card mb-4" style={{ borderLeft: '4px solid #3b82f6' }}>
              <h3>📊 Monitor Pendapatan Unit Usaha</h3>
              <p>Halaman ini hanya untuk monitoring. Data masuk otomatis dari sistem Invoice & Booking (Hotel, Visa, Aula, Rental).</p>
              <div className="stats-row mt-4">
                {['hotel', 'visa_arrival', 'auditorium', 'rental'].map(category => {
                  const relevant = invoices.filter(t => t.category === category)
                  const totals: Record<string, number> = {}
                  relevant.forEach(t => {
                    const curr = t.currency || 'USD'
                    totals[curr] = (totals[curr] || 0) + (t.amount || 0)
                  })
                  const hasData = Object.keys(totals).length > 0

                  // Label Mapping
                  const labelMap: Record<string, string> = {
                    'hotel': 'Total Hotel',
                    'visa_arrival': 'Total Visa',
                    'auditorium': 'Total Auditorium',
                    'rental': 'Total Rental'
                  }

                  return (
                    <div className="stat-item" key={category}>
                      <span className="label">{labelMap[category] || category}</span>
                      <div className="value-group">
                        {Object.entries(totals).filter(([_, val]) => val > 0).map(([curr, val]) => (
                          <div key={curr} className={`value text-${curr === 'EGP' ? 'secondary' : 'primary'}`}>
                            {val.toLocaleString()} {curr}
                          </div>
                        ))}
                        {!hasData && <div className="value text-gray-400">0</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-header">
                <h3>📂 Arsip Laporan Bulanan</h3>
                <div className="year-selector">
                  <button onClick={() => setReportYear(prev => prev - 1)} className="btn btn-sm btn-outline">◀</button>
                  <span className="text-lg font-bold mx-2">{reportYear}</span>
                  <button onClick={() => setReportYear(prev => prev + 1)} className="btn btn-sm btn-outline">▶</button>
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              {openMonth !== null && (
                <div className="breadcrumb mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <button onClick={() => setOpenMonth(null)} className="hover:text-blue-600">📁 Tahun {reportYear}</button>
                  <span>/</span>
                  <span className="font-semibold text-gray-900">{new Date(reportYear, openMonth, 1).toLocaleString('id-ID', { month: 'long' })}</span>
                </div>
              )}

              {/* View 1: Month Grid (Root) */}
              {openMonth === null && (
                <div className="folders-grid">
                  {Array.from({ length: 12 }).map((_, index) => {
                    const date = new Date(reportYear, index, 1)
                    const monthName = date.toLocaleString('id-ID', { month: 'long' })

                    return (
                      <div
                        key={index}
                        className="folder-item"
                        onClick={() => setOpenMonth(index)}
                      >
                        <div className="folder-icon">📂</div>
                        <div className="folder-name">{monthName}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* View 2: Files Grid (Inside Month) */}
              {openMonth !== null && (
                <div className="files-grid">
                  {/* Back Button Item */}
                  <div className="folder-item back-item" onClick={() => setOpenMonth(null)}>
                    <div className="folder-icon">🔙</div>
                    <div className="folder-name">Kembali</div>
                  </div>

                  {/* Unit Report Files */}
                  {['hotel', 'visa_arrival', 'auditorium', 'rental'].map(cat => (
                    <div
                      key={cat}
                      className="file-item"
                      onClick={() => generateMonthlyUnitReport(openMonth, cat)}
                    >
                      <div className="file-icon-large">📄</div>
                      <div className="file-details">
                        <span className="file-name-large">Laporan {cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                        <span className="file-meta">PDF • Klik untuk Unduh</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card mt-4">
              <div className="card-header">
                <h3>Riwayat Transaksi Masuk (Read-Only)</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Unit Usaha</th>
                    <th>Keterangan</th>
                    <th>Jumlah</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(t => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td>
                        <span className="badge badge-info">
                          {t.category === 'visa_arrival' ? 'Visa On Arrival' : t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'General'}
                        </span>
                      </td>
                      <td>{t.description}</td>
                      <td className="text-success font-bold">{t.amount} {t.currency}</td>
                      <td>
                        <span className="badge badge-success">Auto-Verified</span>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Belum ada data pendapatan unit usaha.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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

        /* Folder UI Refined */
        .year-selector { display: flex; align-items: center; gap: 0.5rem; }
        
        /* Grid Layouts */
        .folders-grid, .files-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); 
            gap: 1.5rem; 
            padding: 1.5rem; 
        }

        /* Folder Item (Month) */
        .folder-item { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            text-align: center; 
            padding: 1.5rem; 
            border: 1px solid transparent; 
            border-radius: 0.75rem; 
            cursor: pointer; 
            transition: all 0.2s; 
            background: #fff;
        }
        .folder-item:hover { 
            background: #eff6ff; 
            border-color: #dbeafe; 
            transform: translateY(-2px);
        }
        .folder-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .folder-name { font-weight: 500; color: #374151; font-size: 0.95rem; }

        /* File Item (Report) */
        .file-item {
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            text-align: center; 
            padding: 1rem; 
            border: 1px solid #e5e7eb; 
            border-radius: 0.75rem; 
            cursor: pointer; 
            transition: all 0.2s; 
            background: white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .file-item:hover {
            border-color: var(--color-primary);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        .file-icon-large { font-size: 2.5rem; margin-bottom: 0.5rem; color: #ef4444; /* PDF Color */ }
        .file-details { display: flex; flex-direction: column; gap: 0.25rem; }
        .file-name-large { font-weight: 600; font-size: 0.9rem; color: #1f2937; line-height: 1.3; }
        .file-meta { font-size: 0.75rem; color: #9ca3af; }

        /* Back Button Special Style */
        .back-item {
            border: 2px dashed #e5e7eb;
            background: #f9fafb;
        }
        .back-item:hover {
            border-color: #9ca3af;
            background: #f3f4f6;
        }

        /* Breadcrumb */
        .breadcrumb { padding: 0 1.5rem; margin-top: -0.5rem; }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .card { background: white; padding: 1.5rem; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .mt-4 { margin-top: 1.5rem; }
        .text-success { color: var(--color-success); }
        .text-danger { color: #dc2626; }
        .text-primary { color: var(--color-primary); }
        
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .badge { padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; background: #e5e7eb; }
        .input-disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }

        .kanban-unavailable { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 200px; 
            background: #f9fafb; 
            border: 2px dashed #e5e7eb; 
            border-radius: 1rem;
            color: #9ca3af;
        }

        /* New Styles for Financial Forms */
        .mb-4 { margin-bottom: 1rem; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .gap-2 { gap: 0.5rem; }
        
        .btn-select {
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 0.5rem;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
        }
        .btn-select:hover { border-color: var(--color-primary); }
        .btn-select.selected {
            background: #eff6ff;
            border-color: var(--color-primary);
            color: var(--color-primary);
            font-weight: 500;
            box-shadow: 0 0 0 1px var(--color-primary);
        }

        .input-group { display: flex; gap: 0.5rem; }
        .input-group input { flex: 1; }
        .currency-select { 
            width: 80px; 
            padding: 0.75rem; 
            border: 1px solid #d1d5db; 
            border-radius: 0.5rem; 
            background: #f9fafb;
            font-weight: 500;
        }
        
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-info { background: #dbeafe; color: #1e40af; }
      `}</style>
    </div>
  )
}
