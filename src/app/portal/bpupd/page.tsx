'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Plane, ClipboardList, Wallet, BarChart3, ChevronLeft, ChevronRight, Folder, FileText, CheckCircle2, Circle, Clock, Check, Plus, Upload, Printer, Download, Camera, Save, Eye, ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react'

// Mock Data Types
type Transaction = {
  id: string | number
  date: string
  category: string
  amount: number
  currency: 'USD' | 'EGP' | 'IDR' | 'EUR'
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
      tableColumn = ["No", "Tanggal", "Full Name", "Nama Event", "Total", "Durasi Sewa Aula", "Keterangan"]
      tableRows = filteredData.map((inv, index) => {
        // Handle Polymorphic Relationship
        let booking = inv.relatedBooking || {}
        if (booking.value) {
          booking = booking.value
        }

        const eventName = booking.event?.name || '-'

        // Duration logic: Use Booking Hall Rental duration if available
        const durationVal = booking.hallRental?.duration || (inv.items && inv.items.length > 0 ? inv.items[0].quantity : 0)
        const durationStr = `${durationVal} Jam`

        // Detailed Description from Booking Service Form
        let descriptionParts = []

        // 1. Hall Rental Package
        if (booking.hallRental?.package) {
          descriptionParts.push(`Paket: ${booking.hallRental.package}`)
        } else {
          // Fallback
          if (durationVal > 0) descriptionParts.push(`Sewa Aula (${durationVal} Jam)`)
        }

        // 2. Additional Services
        if (booking.services) {
          const s = booking.services
          if (s.acOption) descriptionParts.push(`AC (${s.acOption} Jam)`)
          if (s.chairOption) descriptionParts.push(`Kursi (${s.chairOption})`)
          if (s.projectorScreen) {
            const projMap: Record<string, string> = { 'projector': 'Projector Only', 'screen': 'Screen Only', 'both': 'Projector & Screen' }
            descriptionParts.push(projMap[s.projectorScreen] || s.projectorScreen)
          }
          if (s.tableOption) descriptionParts.push(`Meja (${s.tableOption})`)
          if (s.plateOption) descriptionParts.push(`Piring (${s.plateOption})`)
          if (s.glassOption) descriptionParts.push(`Gelas (${s.glassOption})`)
        }

        // 3. Fallback: If no booking details found, use invoice items
        if (descriptionParts.length === 0 && inv.items) {
          inv.items.forEach((item: any) => {
            descriptionParts.push(`${item.itemName} (${item.quantity})`)
          })
        }

        return [
          index + 1,
          inv.date,
          inv.customerName || booking.personal?.fullName || '-',
          eventName,
          `${inv.amount.toLocaleString()} ${inv.currency}`,
          durationStr,
          descriptionParts.join(', ')
        ]
      })
    } else if (category === 'visa_arrival') {
      tableColumn = ["No", "Tanggal", "Customer", "Passenger", "Passport", "Status", "Total"]
      tableRows = filteredData.map((inv, index) => {
        const booking = inv.relatedBooking || {}

        return [
          index + 1,
          inv.date,
          inv.customerName,
          booking.passengerName || '-',
          booking.passportNo || '-',
          booking.visaStatus ? booking.visaStatus.toUpperCase() : '-',
          `${inv.amount.toLocaleString()} ${inv.currency}`
        ]
      })
    } else if (category === 'rental') {
      tableColumn = ["No", "Tanggal", "Customer", "Items", "Total"]
      tableRows = filteredData.map((inv, index) => {

        const itemsList = inv.items?.map((item: any) => `${item.itemName} (${item.quantity})`).join(', ') || '-'

        return [
          index + 1,
          inv.date,
          inv.customerName,
          itemsList,
          `${inv.amount.toLocaleString()} ${inv.currency}`
        ]
      })
    } else {
      // Default / Fallback
      tableColumn = ["No", "Tanggal", "Keterangan", "Jumlah"]
      tableRows = filteredData.map((tx, index) => [
        index + 1,
        tx.date,
        tx.description || tx.items?.map((i: any) => i.itemName).join(', ') || '-',
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
        const res = await fetch('/api/tasks?category=bpupd')
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

  const handleDeleteTransaction = async (id: string | number) => {
    if (!confirm('Yakin ingin menghapus transaksi ini? Data tidak bisa dikembalikan.')) return
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id))
        alert('Transaksi berhasil dihapus!')
      } else {
        alert('Gagal menghapus transaksi.')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Gagal menghapus transaksi.')
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
    <PortalPinGuard portalName="BPUPD" expectedPin={process.env.NEXT_PUBLIC_BPUPD_PIN}>
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="portal-header">
            <div className="header-title-row">
                <div className="icon-wrapper bg-primary-faint text-primary">
                    <Plane size={28} />
                </div>
                <div>
                   <h1>Portal BPUPD</h1>
                   <p>Travel & Sales Management</p>
                </div>
            </div>
          </div>

          <div className="tabs-container">
            <div className="tabs">
              <button className={`tab ${activeTab === 'kanban' ? 'active' : ''}`} onClick={() => setActiveTab('kanban')}>
                  <ClipboardList size={18} /> Visa Kanban
              </button>
              <button className={`tab ${activeTab === 'proker' ? 'active' : ''}`} onClick={() => setActiveTab('proker')}>
                  <CheckCircle2 size={18} /> Proker Bulanan
              </button>
              <button className={`tab ${activeTab === 'dana_ops' ? 'active' : ''}`} onClick={() => setActiveTab('dana_ops')}>
                  <Wallet size={18} /> Dana Operasional
              </button>
              <button className={`tab ${activeTab === 'pendapatan_unit' ? 'active' : ''}`} onClick={() => setActiveTab('pendapatan_unit')}>
                  <BarChart3 size={18} /> Monitor Pendapatan
              </button>
            </div>
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

                <form onSubmit={handleTaskSubmit} className="mobile-task-form">
                  <div className="task-input-row">
                    <input
                      type="text"
                      placeholder="Tambah kegiatan baru..."
                      value={taskForm.title}
                      onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                      required
                      className="task-input"
                    />
                    <button type="submit" className="task-submit-btn">
                       <Plus size={20} />
                    </button>
                  </div>
                  <div className="task-filters-row">
                    <select
                      value={taskForm.category}
                      onChange={e => setTaskForm({ ...taskForm, category: e.target.value as any })}
                      className="task-select pill-select"
                    >
                      <option value="housekeeping">Housekeeping</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inventory">Inventory</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="task-select pill-select"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High priority</option>
                      <option value="low">Low priority</option>
                    </select>
                  </div>
                </form>

                <div className="todo-list">
                  {tasks.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle2 size={48} className="text-gray-300 mb-2" />
                        <p>Belum ada program kerja.</p>
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className={`todo-item modern-card ${task.status}`}>
                        <div className="todo-checkbox" onClick={() => toggleTaskStatus(task)}>
                            {task.status === 'done' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Circle size={24} className="text-gray-300" />}
                        </div>
                        <div className="todo-content">
                          <span className={`todo-title ${task.status === 'done' ? 'completed' : ''}`}>
                            {task.title}
                          </span>
                          <div className="todo-meta-tags">
                            <span className="micro-tag text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{task.category}</span>
                            <span className={`micro-tag text-xs font-medium px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'normal' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {task.priority}
                            </span>
                          </div>
                        </div>
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
                <button className={`sub-tab ${financeTab === 'income' ? 'active' : ''}`} onClick={() => setFinanceTab('income')}>
                   <Download size={18} /> Pemasukan (Bendahara)
                </button>
                <button className={`sub-tab ${financeTab === 'expense' ? 'active' : ''}`} onClick={() => setFinanceTab('expense')}>
                   <Upload size={18} /> Belanja / Pengeluaran
                </button>
              </div>

              {financeTab === 'income' && (
                <div className="finance-section animate-fadeIn">
                  <div className="card finance-card-padded">
                    <div className="card-top-accent accent-income"></div>
                    <div className="card-header-minimal">
                       <h3>Input Penerimaan Dana</h3>
                       <p className="helper-text">Hanya untuk input dana taktis dari bendahara.</p>
                    </div>
                    
                    <form onSubmit={handleIncomeSubmit} className="form-stack">
                      <div className="form-group">
                        <label className="standard-label">Jumlah Uang (EGP)</label>
                        <div className="currency-input-wrapper">
                           <span className="currency-prefix">EGP</span>
                           <input
                             type="number"
                             value={incomeForm.amount}
                             onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                             required
                             placeholder="0.00"
                             className="amount-input"
                           />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="form-group">
                          <label className="standard-label">Tanggal</label>
                          <input
                            type="date"
                            value={incomeForm.date}
                            onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })}
                            required
                            className="task-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="standard-label">Keterangan</label>
                          <input
                            type="text"
                            value={incomeForm.description}
                            onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })}
                            required
                            placeholder="Contoh: Dana Takis Hostel"
                            className="task-input"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="standard-label">Upload Bukti Struk</label>
                        <div className="custom-file-upload">
                           <input
                             type="file"
                             accept="image/*,application/pdf"
                             onChange={e => {
                               if (e.target.files && e.target.files[0]) {
                                 setIncomeForm({ ...incomeForm, file: e.target.files[0] })
                               }
                             }}
                             id="income-file"
                             className="hidden-file-input"
                           />
                           <label htmlFor="income-file" className="file-upload-trigger">
                              <Camera size={20} /> 
                              <span>{incomeForm.file ? incomeForm.file.name : 'Tap untuk Unggah Bukti'}</span>
                           </label>
                        </div>
                      </div>

                      <button type="submit" className="action-btn income-btn">
                        <Save size={18} /> Simpan Pemasukan
                      </button>
                    </form>
                  </div>

                  <div className="mt-6">
                    <div className="section-header-row mb-4">
                      <h3>Riwayat Pemasukan</h3>
                      <button onClick={() => generatePDF('income')} className="pdf-mini-btn">
                         <FileText size={16} /> PDF
                      </button>
                    </div>

                    <div className="transaction-list">
                        {transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').map(t => (
                          <div key={t.id} className="transaction-item income-item">
                             <div className="item-main">
                                <div className="item-info">
                                   <span className="item-title">{t.description}</span>
                                   <span className="item-date">{t.date}</span>
                                </div>
                                <div className="item-financial">
                                   <span className="item-amount">+{t.amount}</span>
                                   <span className="item-currency">{t.currency}</span>
                                </div>
                             </div>
                             <div className="item-footer">
                                <span className="item-badge-income">Dana Taktis</span>
                                {t.proofImage && (
                                  <a 
                                    href={`/api/media/file/${typeof t.proofImage === 'string' ? t.proofImage : t.proofImage.filename}`} 
                                    target="_blank" 
                                    className="proof-link"
                                  >
                                    <Eye size={12} /> Bukti
                                  </a>
                                )}
                                <button onClick={() => handleDeleteTransaction(t.id)} className="delete-btn" title="Hapus transaksi">
                                  <Trash2 size={14} />
                                </button>
                             </div>
                          </div>
                        ))}
                        {transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').length === 0 && (
                          <div className="empty-state">Belum ada data pemasukan</div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {financeTab === 'expense' && (
                <div className="finance-section animate-fadeIn">
                  <div className="card finance-card-padded">
                    <div className="card-top-accent accent-expense"></div>
                    <div className="card-header-minimal">
                       <h3>Input Pengeluaran Operasional</h3>
                       <p className="helper-text">Pencatatan belanja alat tulis, kantor, dan taktis lainnya.</p>
                    </div>

                    <form onSubmit={handleExpenseSubmit} className="form-stack">
                      <div className="form-group">
                        <label className="standard-label">Nama Barang / Belanja</label>
                        <input 
                          type="text" 
                          value={expenseForm.itemName} 
                          onChange={e => setExpenseForm({ ...expenseForm, itemName: e.target.value })} 
                          required 
                          placeholder="Contoh: Beli Token Listrik" 
                          className="task-input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="standard-label">Qty</label>
                          <input
                            type="number"
                            value={expenseForm.quantity}
                            onChange={e => {
                              const qty = Number(e.target.value)
                              const price = Number(expenseForm.unitPrice)
                              setExpenseForm({ ...expenseForm, quantity: e.target.value, amount: (qty * price).toString() })
                            }}
                            className="task-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="standard-label">Harga Satuan</label>
                          <input
                            type="number"
                            value={expenseForm.unitPrice}
                            onChange={e => {
                              const price = Number(e.target.value)
                              const qty = Number(expenseForm.quantity)
                              setExpenseForm({ ...expenseForm, unitPrice: e.target.value, amount: (qty * price).toString() })
                            }}
                            className="task-input"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="standard-label">Total Pengeluaran (EGP)</label>
                        <div className="currency-input-wrapper bg-gray-50">
                           <span className="currency-prefix">EGP</span>
                           <input type="number" value={expenseForm.amount} readOnly placeholder="0.00" className="amount-input text-danger font-bold" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                         <div className="form-group text-sm font-medium">
                            <label className="standard-label">Tanggal Transaksi</label>
                            <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required className="task-input" />
                         </div>
                      </div>

                      <div className="form-group">
                        <label className="standard-label">Upload Bukti Kwitansi</label>
                        <div className="custom-file-upload border-dashed">
                           <input
                             type="file"
                             accept="image/*,application/pdf"
                             onChange={e => {
                               if (e.target.files && e.target.files[0]) {
                                 setExpenseForm({ ...expenseForm, file: e.target.files[0] })
                               }
                             }}
                             id="expense-file"
                             className="hidden-file-input"
                           />
                           <label htmlFor="expense-file" className="file-upload-trigger">
                              <Camera size={20} /> 
                              <span>{expenseForm.file ? expenseForm.file.name : 'Tap untuk Unggah Struk'}</span>
                           </label>
                        </div>
                      </div>

                      <button type="submit" className="action-btn expense-btn">
                        <Save size={18} /> Simpan Pengeluaran
                      </button>
                    </form>
                  </div>

                  <div className="card mt-6 financial-summary-card">
                    <div className="card-header-minimal">
                      <h3>Ikhtisar Saldo</h3>
                      <button onClick={() => generatePDF('expense')} className="pdf-mini-btn">
                         <Download size={16} /> Laporan PDF
                      </button>
                    </div>
                    
                    <div className="summary-pills mt-4">
                        <div className="summary-pill">
                           <div className="pill-icon bg-success-faint text-success"><ArrowDownLeft size={16} /></div>
                           <div className="pill-content">
                              <span className="pill-label">Total Masuk</span>
                              <span className="pill-value text-success">{totalIncome}</span>
                           </div>
                        </div>
                        <div className="summary-pill">
                           <div className="pill-icon bg-danger-faint text-danger"><ArrowUpRight size={16} /></div>
                           <div className="pill-content">
                              <span className="pill-label">Total Belanja</span>
                              <span className="pill-value text-danger">{totalExpense}</span>
                           </div>
                        </div>
                        <div className="summary-pill highlight">
                           <div className="pill-icon bg-primary-faint text-primary"><Wallet size={16} /></div>
                           <div className="pill-content">
                              <span className="pill-label">Sisa Saldo</span>
                              <span className={`pill-value ${remainingBalance < 0 ? 'text-danger' : 'text-primary'}`}>{remainingBalance}</span>
                           </div>
                        </div>
                    </div>

                    <div className="transaction-list mt-8">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Daftar Belanja</h4>
                        {transactions.filter(t => t.type === 'out' && t.category === 'operational').map(t => (
                          <div key={t.id} className="transaction-item expense-item">
                             <div className="item-main">
                                <div className="item-info">
                                   <span className="item-title">{t.description}</span>
                                   <span className="item-date">{t.date} • {t.quantity} Pcs x {t.unitPrice}</span>
                                </div>
                                <div className="item-financial">
                                   <span className="item-amount">-{t.amount}</span>
                                   <span className="item-currency">EGP</span>
                                </div>
                             </div>
                             <div className="item-footer">
                                <span className="item-badge-expense">Operasional</span>
                                {t.proofImage && (
                                  <a 
                                    href={`/api/media/file/${typeof t.proofImage === 'string' ? t.proofImage : t.proofImage.filename}`} 
                                    target="_blank" 
                                    className="proof-link"
                                  >
                                   <Eye size={12} /> Struk
                                  </a>
                                )}
                                <button onClick={() => handleDeleteTransaction(t.id)} className="delete-btn" title="Hapus transaksi">
                                  <Trash2 size={14} />
                                </button>
                             </div>
                          </div>
                        ))}
                    </div>
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
                <div className="revenue-grid mt-4">
                  {['hotel', 'visa_arrival', 'auditorium', 'rental', 'cancellation'].map(category => {
                    const relevant = invoices.filter(t => t.category === category)
                    const totals: Record<string, number> = {}
                    relevant.forEach(t => {
                      const curr = t.currency || 'USD'
                      totals[curr] = (totals[curr] || 0) + (t.amount || 0)
                    })
                    const hasData = Object.keys(totals).length > 0

                    // Label Mapping
                    const labelMap: Record<string, string> = {
                      'hotel': 'Hotel',
                      'visa_arrival': 'Visa',
                      'auditorium': 'Auditorium',
                      'rental': 'Rental',
                      'cancellation': 'Pembatalan'
                    }

                    return (
                      <div className="revenue-card" key={category}>
                        <div className="revenue-header">
                            <span className="revenue-label">{labelMap[category] || category}</span>
                        </div>
                        <div className="revenue-values">
                          {Object.entries(totals).filter(([_, val]) => val > 0).map(([curr, val]) => (
                            <div key={curr} className="revenue-amount">
                              <span className="revenue-number">{val.toLocaleString()}</span>
                              <span className={`revenue-currency badge-${curr.toLowerCase()}`}>{curr}</span>
                            </div>
                          ))}
                          {!hasData && <div className="revenue-amount"><span className="revenue-number text-gray-400">0</span></div>}
                        </div>
                      </div>
                    )
                  })}

                  {/* Grand Total Keseluruhan */}
                  <div className="revenue-card grand-total-card col-span-full">
                    <span className="revenue-label text-slate-500">Total Keseluruhan Usaha</span>

                    <div className="value-group">
                      {(() => {
                        const grandTotals: Record<string, number> = {}
                        invoices.forEach(t => {
                          const curr = t.currency || 'USD'
                          grandTotals[curr] = (grandTotals[curr] || 0) + (t.amount || 0)
                        })
                        const hasGrandData = Object.keys(grandTotals).length > 0
                        return (
                          <div className="revenue-values" style={{ rowGap: '8px', paddingTop: '8px' }}>
                            {Object.entries(grandTotals).filter(([_, val]) => val > 0).map(([curr, val]) => (
                              <div key={curr} className="revenue-amount items-center">
                                <span className="revenue-number grand-number">{val.toLocaleString()}</span>
                                <span className={`revenue-currency badge-${curr.toLowerCase()}`}>{curr}</span>
                              </div>
                            ))}
                            {!hasGrandData && <div className="revenue-amount"><span className="revenue-number text-gray-400">0</span></div>}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
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
                    {['hotel', 'visa_arrival', 'auditorium', 'rental', 'cancellation'].map(cat => (
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

        <style jsx global>{`
        /* WIN-OS BPUPD Refinement V2 (Brown/Gold Aesthetic) */
        
        .dashboard-layout { 
            display: flex; 
            min-height: 100vh; 
            background: var(--color-bg-primary); 
            font-family: var(--font-sans); 
            color: var(--color-text-primary);
        }
        
        .main-content { 
            flex: 1; 
            overflow-y: auto; 
            overflow-x: hidden; 
            padding-bottom: 80px; 
        }
        
        /* Consistent Typography */
        h1, h2, h3, h4 { font-family: var(--font-heading); }
        .revenue-number { font-family: var(--font-heading); }

        /* Modern Portal Header */
        .portal-header { 
            padding: var(--spacing-lg); 
            background: var(--color-bg-card); 
            border-bottom: 1px solid var(--color-bg-secondary); 
        }
        .header-title-row { display: flex; align-items: center; gap: var(--spacing-md); }
        .icon-wrapper { 
            padding: 0.75rem; 
            border-radius: var(--radius-lg); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .bg-primary-faint { background: rgba(139, 69, 19, 0.08); }
        .text-primary { color: var(--color-primary); }
        
        .portal-header h1 { 
            font-size: 1.5rem; 
            font-weight: 700; 
            color: var(--color-text-primary); 
            line-height: 1.2; 
            margin: 0; 
        }
        .portal-header p { 
            font-size: 0.875rem; 
            color: var(--color-text-secondary); 
            margin: 0; 
            font-weight: 500; 
        }

        /* Navigasi Tab (Wisma Brown Aesthetic) */
        .tabs-container { 
            margin: var(--spacing-lg) 0 var(--spacing-lg) var(--spacing-lg); 
            overflow-x: auto; 
            scrollbar-width: none; 
            -webkit-overflow-scrolling: touch; 
        }
        .tabs-container::-webkit-scrollbar { display: none; }
        .tabs { display: inline-flex; gap: var(--spacing-sm); padding-right: var(--spacing-lg); }
        .tab { 
            display: flex; align-items: center; gap: var(--spacing-xs); 
            padding: 0.75rem 1.25rem; 
            border: 1px solid var(--color-bg-secondary); 
            border-radius: var(--radius-full); 
            background: var(--color-bg-card); 
            color: var(--color-text-secondary); 
            font-weight: 600; 
            font-size: 0.9rem; 
            white-space: nowrap; 
            transition: all var(--transition-fast); 
        }
        .tab.active { 
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); 
            color: var(--color-text-light); 
            border-color: var(--color-primary); 
            box-shadow: var(--shadow-md); 
        }

        /* Revenue Metrics Grid (Wisma Cards) */
        .finance-section { padding: 0 var(--spacing-lg); }
        .revenue-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: var(--spacing-md); 
            margin-top: var(--spacing-lg); 
        }
        .revenue-card { 
            background: var(--color-bg-card); 
            padding: 1.25rem; 
            border-radius: var(--radius-xl); 
            box-shadow: var(--shadow-sm); 
            display: flex; 
            flex-direction: column; 
            gap: 0.75rem;
            border: 1px solid var(--color-bg-secondary);
            transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .revenue-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        
        .revenue-label { font-size: 0.85rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.02em; }
        .revenue-values { display: flex; flex-direction: column; gap: 0.4rem; }
        .revenue-amount { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.3rem; }
        .revenue-number { font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary); line-height: 1; }
        .grand-number { font-size: 1.6rem; color: var(--color-primary); }
        
        .revenue-currency { font-weight: 700; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
        .badge-usd { background: var(--color-success-light); color: #166534; }
        .badge-eur { background: var(--color-info-light); color: #1e40af; }
        .badge-egp { background: var(--color-warning-light); color: #92400e; }
        .badge-idr { background: #f3e8ff; color: #6b21a8; }
        .grand-total-card { grid-column: 1 / -1; background: linear-gradient(135deg, #fff 0%, #fff9f5 100%); border-left: 4px solid var(--color-secondary); padding: 1.5rem; }

        /* Task Management (Premium Proker) */
        .proker-container { padding: 0 var(--spacing-lg); }
        .mobile-task-form { 
            background: var(--color-bg-card); 
            padding: 1.25rem; 
            border-radius: var(--radius-xl); 
            box-shadow: var(--shadow-md); 
            margin-bottom: 1.5rem; 
            border: 1px solid var(--color-bg-secondary);
        }
        .task-input-row { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
        .task-input { 
            flex: 1; width: 100%;
            padding: 0.875rem 1rem; 
            border: 1px solid var(--color-bg-secondary); 
            border-radius: var(--radius-lg); 
            font-size: 0.95rem; 
            outline: none; 
            background: var(--color-bg-primary); 
            transition: all var(--transition-fast);
        }
        .task-input:focus { border-color: var(--color-primary); background: var(--color-bg-card); box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1); }
        .task-submit-btn { 
            width: 48px; height: 48px; 
            display: flex; align-items: center; justify-content: center; 
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); 
            color: var(--color-text-light); 
            border: none; border-radius: var(--radius-lg); 
            cursor: pointer; 
            box-shadow: var(--shadow-md); 
        }
        .task-filters-row { display: flex; gap: var(--spacing-xs); overflow-x: auto; scrollbar-width: none; }
        .task-filters-row::-webkit-scrollbar { display: none; }
        .pill-select { 
            padding: 0.5rem 1rem; 
            border: 1px solid var(--color-bg-secondary); 
            border-radius: var(--radius-full); 
            background: var(--color-bg-card); 
            font-size: 0.8rem; 
            font-weight: 600; 
            color: var(--color-text-secondary); 
            appearance: none; 
            cursor: pointer; 
            min-width: 110px;
        }
        
        .todo-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
        .modern-card { 
            background: var(--color-bg-card); 
            padding: 1.25rem; 
            border-radius: var(--radius-xl); 
            display: flex; 
            align-items: flex-start; 
            gap: 1rem; 
            border: 1px solid var(--color-bg-secondary); 
            box-shadow: var(--shadow-sm); 
            transition: all var(--transition-fast); 
        }
        .modern-card.done { opacity: 0.55; background: var(--color-bg-secondary); }
        .todo-checkbox { margin-top: 3px; cursor: pointer; }
        .todo-content { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .todo-title { font-weight: 600; color: var(--color-text-primary); font-size: 0.95rem; line-height: 1.4; }
        .todo-title.completed { text-decoration: line-through; color: var(--color-text-muted); }
        .todo-meta-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .micro-tag { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: var(--radius-full); }
        .empty-state { padding: 3rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.9rem; font-weight: 500; }

        /* Generic Cards & Tables */
        .card { 
            background: var(--color-bg-card); 
            padding: 1.5rem; 
            border-radius: var(--radius-xl); 
            box-shadow: var(--shadow-sm); 
            border: 1px solid var(--color-bg-secondary); 
        }
        .card h3 { margin: 0 0 1.25rem 0; font-size: 1.15rem; font-weight: 700; color: var(--color-text-primary); }
        .table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .table th { font-weight: 700; color: var(--color-text-secondary); background: var(--color-bg-secondary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        .table th, .table td { padding: 1rem 0.75rem; text-align: left; border-bottom: 1px solid var(--color-bg-secondary); }

        @media (min-width: 768px) {
            .revenue-grid { grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); }
            .tabs-container { margin: var(--spacing-xl) 0 var(--spacing-xl) var(--spacing-2xl); }
            .finance-section, .proker-container { padding: 0 var(--spacing-2xl); }
        }
        
        .btn-select {
            padding: 0.75rem;
            border: 1px solid var(--color-bg-secondary);
            background: var(--color-bg-card);
            border-radius: var(--radius-md);
            cursor: pointer;
            text-align: left;
            transition: all var(--transition-fast);
            color: var(--color-text-primary);
        }
        .btn-select:hover { border-color: var(--color-primary); }
        .btn-select.selected {
            background: rgba(139, 69, 19, 0.08);
            border-color: var(--color-primary);
            color: var(--color-primary);
            font-weight: 700;
        }

        .currency-select { 
            width: 80px; 
            padding: 0.75rem; 
            border: 1px solid var(--color-bg-secondary); 
            border-radius: var(--radius-md); 
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            font-weight: 700;
        }

        /* =============================================
           PHASE 10: Dana Operasional - Complete Styles
           ============================================= */
        
        /* Sub-Tab Pill Switcher */
        .finance-tabs { 
            display: flex; 
            padding: 0 var(--spacing-lg); 
            gap: 0.5rem; 
            margin-bottom: var(--spacing-lg);
        }
        .sub-tab { 
            flex: 1;
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            padding: 0.85rem 1rem; border-radius: var(--radius-lg); 
            border: 1.5px solid var(--color-bg-secondary); background: var(--color-bg-card);
            color: var(--color-text-secondary); font-weight: 700; font-size: 0.8rem;
            transition: all var(--transition-fast); cursor: pointer;
            white-space: nowrap;
        }
        .sub-tab.active { 
            background: var(--color-bg-dark); color: white; border-color: var(--color-bg-dark);
            box-shadow: var(--shadow-md);
        }
        
        /* Form Card Container */
        .finance-card-padded { padding: 1.5rem !important; position: relative; overflow: hidden; }
        .card-top-accent { position: absolute; top: 0; left: 0; right: 0; height: 4px; }
        .accent-income { background: var(--color-success); }
        .accent-expense { background: var(--color-error); }
        
        .card-header-minimal { margin-bottom: 1.25rem; }
        .card-header-minimal h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.25rem !important; }
        .helper-text { font-size: 0.8rem; color: var(--color-text-muted); margin: 0; line-height: 1.4; }
        
        /* Form Layout */
        .form-stack { display: flex; flex-direction: column; gap: 1.25rem; }
        .standard-label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.4rem; }
        .form-group { display: flex; flex-direction: column; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: 1fr; }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
        .gap-4 { gap: 1rem; }
        
        /* Currency Input (EGP prefix) */
        .currency-input-wrapper { 
            display: flex; align-items: center; 
            background: var(--color-bg-primary); 
            border: 1.5px solid var(--color-bg-secondary); 
            border-radius: var(--radius-lg); overflow: hidden;
            transition: border-color var(--transition-fast);
        }
        .currency-input-wrapper:focus-within { border-color: var(--color-primary); }
        .currency-prefix { padding: 0.875rem 1rem; background: var(--color-bg-secondary); font-weight: 800; color: var(--color-text-muted); font-size: 0.8rem; letter-spacing: 0.02em; }
        .amount-input { flex: 1; border: none !important; padding: 0.875rem 1rem; outline: none; background: transparent; font-size: 1.35rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-text-primary); }
        
        /* Custom File Upload */
        .custom-file-upload { position: relative; }
        .hidden-file-input { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; overflow: hidden; }
        .file-upload-trigger { 
            display: flex; align-items: center; gap: 0.75rem; 
            padding: 1.1rem 1.25rem; border: 2px dashed var(--color-bg-secondary); 
            border-radius: var(--radius-lg); cursor: pointer; color: var(--color-text-muted); 
            font-weight: 600; font-size: 0.85rem; transition: all var(--transition-fast);
            background: var(--color-bg-primary);
        }
        .file-upload-trigger:hover, .file-upload-trigger:active { border-color: var(--color-primary); color: var(--color-primary); background: rgba(139, 69, 19, 0.03); }
        
        /* Action Buttons (Submit) */
        .action-btn { 
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            padding: 1rem; border-radius: var(--radius-lg); border: none;
            color: white; font-weight: 700; font-size: 0.95rem; cursor: pointer;
            box-shadow: var(--shadow-md); transition: all var(--transition-fast);
            width: 100%;
        }
        .action-btn:active { transform: scale(0.98); }
        .income-btn { background: linear-gradient(135deg, var(--color-success) 0%, #15803d 100%); }
        .expense-btn { background: linear-gradient(135deg, var(--color-error) 0%, #b91c1c 100%); }
        
        /* Section Header Row */
        .section-header-row { display: flex; justify-content: space-between; align-items: center; padding: 0 var(--spacing-lg); }
        .section-header-row h3 { margin: 0 !important; font-size: 1.05rem; font-weight: 800; }
        
        /* PDF Mini Button */
        .pdf-mini-btn { 
            display: flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.85rem;
            border-radius: var(--radius-md); border: 1.5px solid var(--color-bg-secondary);
            background: var(--color-bg-card); font-weight: 700; font-size: 0.75rem;
            cursor: pointer; color: var(--color-text-secondary); transition: all var(--transition-fast);
        }
        .pdf-mini-btn:active { background: var(--color-bg-secondary); }
        
        /* Transaction Timeline Cards */
        .transaction-list { display: flex; flex-direction: column; gap: 0.75rem; padding: 0 var(--spacing-lg); }
        .transaction-item { 
            background: var(--color-bg-card); padding: 1rem 1.15rem; border-radius: var(--radius-xl);
            border: 1px solid var(--color-bg-secondary); box-shadow: var(--shadow-sm);
        }
        .item-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.65rem; }
        .item-info { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; min-width: 0; }
        .item-title { font-weight: 700; color: var(--color-text-primary); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .item-date { font-size: 0.75rem; color: var(--color-text-muted); }
        .item-financial { text-align: right; display: flex; flex-direction: column; line-height: 1.1; flex-shrink: 0; margin-left: 0.75rem; }
        .item-amount { font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); }
        .income-item .item-amount { color: var(--color-success); }
        .expense-item .item-amount { color: var(--color-error); }
        .item-currency { font-size: 0.65rem; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        
        .item-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 0.6rem; border-top: 1px solid var(--color-bg-primary); }
        .item-badge-income { font-size: 0.65rem; font-weight: 800; color: #854d0e; background: var(--color-warning-light); padding: 3px 10px; border-radius: var(--radius-full); }
        .item-badge-expense { font-size: 0.65rem; font-weight: 800; color: #374151; background: #e5e7eb; padding: 3px 10px; border-radius: var(--radius-full); }
        .proof-link { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 700; color: var(--color-primary); text-decoration: none; }

        /* Delete Button */
        .delete-btn {
            display: flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; border-radius: var(--radius-md);
            border: 1.5px solid #fecaca; background: #fff5f5;
            color: #dc2626; cursor: pointer;
            transition: all var(--transition-fast);
            flex-shrink: 0; margin-left: auto;
        }
        .delete-btn:active { background: #dc2626; color: white; border-color: #dc2626; transform: scale(0.92); }

        /* Financial Summary Pills */
        .financial-summary-card { padding: 1.5rem !important; }
        .financial-summary-card .card-header-minimal { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; }
        .financial-summary-card .card-header-minimal h3 { margin: 0 !important; }
        .summary-pills { display: flex; flex-direction: column; gap: 0.65rem; }
        .summary-pill { 
            display: flex; align-items: center; gap: 0.85rem; padding: 0.85rem 1rem;
            background: var(--color-bg-card); border-radius: var(--radius-lg);
            border: 1px solid var(--color-bg-secondary);
        }
        .summary-pill.highlight { border-color: var(--color-primary); background: rgba(139, 69, 19, 0.03); }
        .pill-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); flex-shrink: 0; }
        .bg-success-faint { background: var(--color-success-light); }
        .bg-danger-faint { background: var(--color-error-light); }
        .bg-primary-faint { background: rgba(139, 69, 19, 0.08); }
        .pill-content { display: flex; flex-direction: column; }
        .pill-label { font-size: 0.7rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .pill-value { font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); }

        /* Utility classes */
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-4 { margin-bottom: 1rem; }
        .text-success { color: var(--color-success); }
        .text-danger { color: var(--color-error); }
        .text-primary { color: var(--color-primary); }
        .font-bold { font-weight: 700; }
        .bg-gray-50 { background: var(--color-bg-primary); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .badge-warning { background: var(--color-warning-light); color: #854d0e; }
        .badge-info { background: var(--color-info-light); color: #1e40af; }

      `}</style>
      </div >
    </PortalPinGuard>
  )
}
