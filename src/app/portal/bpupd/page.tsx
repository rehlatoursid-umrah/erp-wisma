'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Plane, ClipboardList, Wallet, BarChart3, ChevronLeft, ChevronRight, Folder, FileText, CheckCircle2, Plus, Download, Camera, Save, Eye, ArrowDownLeft, ArrowUpRight, Trash2, X, KanbanSquare, TrendingDown, GripVertical, UserCircle2, Calendar, AlertCircle, CheckCheck, MoveRight, MoveLeft, Filter } from 'lucide-react'

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
  description?: string
  category: 'housekeeping' | 'maintenance' | 'inventory' | 'admin' | 'bpupd'
  priority: 'high' | 'normal' | 'low'
  status: 'pending' | 'in_progress' | 'done'
  dueDate: string
  relatedRoom?: string
}

type ChartBar = {
  month: number
  year: number
  label: string
  income: number
  expense: number
}

export default function BPUPDPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'proker' | 'dana_ops' | 'pendapatan_unit'>('proker')
  const [financeTab, setFinanceTab] = useState<'income' | 'expense'>('income')

  // Financial State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [invoices, setInvoices] = useState<Transaction[]>([])

  // Trello Board State
  const [tasks, setTasks] = useState<Task[]>([])
  const [prokerMonth, setProkerMonth] = useState(new Date().getMonth())
  const [prokerYear, setProkerYear] = useState(new Date().getFullYear())
  const [showAddTask, setShowAddTask] = useState<string | null>(null) // column status
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as 'high' | 'normal' | 'low',
    assigneeName: '',
    dueDate: new Date().toISOString().split('T')[0],
  })

  const STAFF = [
    { name: 'Widad Arsyad', initials: 'WA', color: '#3b82f6' },
    { name: 'Indra Juliana Salim', initials: 'IJ', color: '#8b5cf6' },
    { name: 'Zulfan Firosi Zulfadhli', initials: 'ZF', color: '#10b981' },
  ]

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

  // Monthly Cashflow State
  const TODAY = new Date()
  const CURRENT_MONTH = TODAY.getMonth()   // 0-11
  const CURRENT_YEAR  = TODAY.getFullYear()
  const [cfMonth, setCfMonth] = useState(CURRENT_MONTH)
  const [cfYear,  setCfYear]  = useState(CURRENT_YEAR)
  const [cfView, setCfView]   = useState<'dashboard' | 'archive'>('dashboard')
  // Archive: month summaries for the fiscal year (Feb → Jan)
  const [archiveSummaries, setArchiveSummaries] = useState<Record<string, { income: number; expense: number; balance: number }>>({})

  // Fiscal Year Chart Data
  const [fiscalChartData, setFiscalChartData] = useState<ChartBar[]>([])

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
  useEffect(() => {
    // Fetch Finance Data for current month
    fetchCashflow(CURRENT_MONTH, CURRENT_YEAR)

    // Fetch ALL cashflow (no filter) for fiscal year chart
    const fetchFiscalChart = async () => {
      try {
        const res = await fetch('/api/finance')
        if (res.ok) {
          const data = await res.json()
          const allCf = data.cashflow || []
          // Group by month
          const grouped: Record<string, { income: number; expense: number }> = {}
          allCf.forEach((item: any) => {
            if (!item.transactionDate) return
            const d = new Date(item.transactionDate)
            const key = `${d.getFullYear()}-${d.getMonth()}`
            if (!grouped[key]) grouped[key] = { income: 0, expense: 0 }
            if (item.type === 'in') grouped[key].income += item.amount || 0
            if (item.type === 'out') grouped[key].expense += item.amount || 0
          })
          // Map to fiscal months
          const fiscalStartYear = CURRENT_MONTH >= 1 ? CURRENT_YEAR : CURRENT_YEAR - 1
          const bars: ChartBar[] = []
          for (let i = 0; i < 12; i++) {
            const raw = 1 + i
            const month = raw % 12
            const year = raw >= 12 ? fiscalStartYear + 1 : fiscalStartYear
            const key = `${year}-${month}`
            const d = grouped[key] || { income: 0, expense: 0 }
            bars.push({ month, year, label: new Date(year, month, 1).toLocaleString('id-ID', { month: 'short' }), ...d })
          }
          setFiscalChartData(bars)
        }
      } catch (e) { console.error('Failed to fetch fiscal chart', e) }
    }
    fetchFiscalChart()

    // Fetch Tasks
    const fetchTasks = async () => {
      try {
        const now = new Date()
        const res = await fetch(`/api/tasks?category=bpupd&month=${now.getMonth()}&year=${now.getFullYear()}`)
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

  // Re-fetch when cfMonth/cfYear changes
  useEffect(() => {
    fetchCashflow(cfMonth, cfYear)
  }, [cfMonth, cfYear])

  const fetchCashflow = async (month: number, year: number) => {
    try {
      const res = await fetch(`/api/finance?month=${month}&year=${year}`)
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
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          proofImage: item.proofImage
        }))
        setTransactions(mapped)

        const mappedInvoices = (data.invoices || []).map((inv: any) => ({
          id: inv.id,
          date: inv.invoiceDate ? inv.invoiceDate.split('T')[0] : (inv.updatedAt ? inv.updatedAt.split('T')[0] : ''),
          category: inv.bookingType || 'manual',
          amount: inv.totalAmount,
          currency: inv.currency,
          type: 'in' as const,
          description: `${inv.invoiceNo} - ${inv.customerName}`,
          status: 'approved' as const,
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

  // Build fiscal year months: Feb of start year → Jan of next year
  const buildFiscalMonths = () => {
    // Fiscal year starts Feb; determine start year based on current date
    // If current month >= Feb (index 1), fiscal year started this year
    // If current month < Feb (Jan only), fiscal year started last year
    const fiscalStartYear = CURRENT_MONTH >= 1 ? CURRENT_YEAR : CURRENT_YEAR - 1
    const months: { month: number; year: number; label: string }[] = []
    // Feb (1) → Jan (0) next year = 12 months
    for (let i = 0; i < 12; i++) {
      const raw = 1 + i // Feb=1 ... Dec=11, then Jan=0
      const month = raw % 12 // wraps Jan to 0
      const year  = raw >= 12 ? fiscalStartYear + 1 : fiscalStartYear
      months.push({
        month,
        year,
        label: new Date(year, month, 1).toLocaleString('id-ID', { month: 'short' }),
      })
    }
    return months
  }

  const fiscalMonths = buildFiscalMonths()

  // Generate monthly PDF for cashflow
  const generateCashflowPDF = (month: number, year: number, txs: Transaction[]) => {
    const doc = new jsPDF()
    const monthName = new Date(year, month, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })

    // Header
    doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text('WISMA NUSANTARA CAIRO — BPUPD', 105, 15, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Laporan Dana Operasional', 105, 22, { align: 'center' })
    doc.text(`Periode: ${monthName}`, 105, 28, { align: 'center' })
    doc.line(14, 32, 196, 32)

    const income  = txs.filter(t => t.type === 'in').reduce((a, t) => a + t.amount, 0)
    const expense = txs.filter(t => t.type === 'out').reduce((a, t) => a + t.amount, 0)

    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('Ringkasan:', 14, 40)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(`Dana Masuk  : EGP ${income.toLocaleString()}`, 14, 47)
    doc.text(`Total Belanja: EGP ${expense.toLocaleString()}`, 14, 53)
    doc.text(`Sisa Saldo   : EGP ${(income - expense).toLocaleString()}`, 14, 59)

    autoTable(doc as any, {
      head: [['Tgl', 'Keterangan', 'Tipe', 'Qty', 'Jumlah (EGP)']],
      body: txs.map(t => [
        t.date,
        t.description,
        t.type === 'in' ? '💰 Masuk' : '🛒 Belanja',
        t.quantity || '-',
        `${t.type === 'in' ? '+' : '-'}${t.amount.toLocaleString()}`
      ]),
      startY: 68,
      theme: 'grid',
      headStyles: { fillColor: [139, 69, 19], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    })

    doc.save(`Cashflow_BPUPD_${monthName.replace(' ', '_')}.pdf`)
  }

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

  // Fetch tasks when month/year changes
  useEffect(() => {
    const fetchTasksByMonth = async () => {
      try {
        const res = await fetch(`/api/tasks?category=bpupd&month=${prokerMonth}&year=${prokerYear}`)
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
        body: JSON.stringify({ ...taskForm, category: 'bpupd', status: colStatus, dueDate })
      })
      if (res.ok) {
        const newTask = await res.json()
        setTasks(prev => [{ ...newTask, relatedRoom: newTask.relatedRoom || '' }, ...prev])
        setTaskForm({ title: '', description: '', priority: 'normal', assigneeName: '', dueDate })
        setShowAddTask(null)
      }
    } catch (e) { console.error(e) }
  }

  const moveTask = async (task: Task, newStatus: string) => {
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

  const deleteTask = async (id: string) => {
    if (!confirm('Hapus task ini?')) return
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
      if (res.ok) setTasks(prev => prev.filter(t => t.id !== id))
    } catch (e) { console.error(e) }
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

          {/* Premium Tab Navigation */}
          <div className="tabs-container">
            <div className="tabs">
              {[
                { key: 'proker', icon: <KanbanSquare size={18} />, label: 'Proker Bulanan' },
                { key: 'dana_ops', icon: <Wallet size={18} />, label: 'Dana Operasional' },
                { key: 'pendapatan_unit', icon: <BarChart3 size={18} />, label: 'Monitor Pendapatan' },
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
                                  <button className="card-del-btn" title="Hapus" onClick={() => deleteTask(task.id)}><Trash2 size={13} /></button>
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
              DANA OPERASIONAL — Monthly Cashflow UI
          ═══════════════════════════════════════════ */}
          {activeTab === 'dana_ops' && (() => {
            const isCurrentMonth = cfMonth === CURRENT_MONTH && cfYear === CURRENT_YEAR
            const isArchive = !isCurrentMonth
            const viewLabel = new Date(cfYear, cfMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })

            return (
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
                      {/* Y-axis labels */}
                      <div className="fy-y-axis">
                        <span>{maxVal.toLocaleString()}</span>
                        <span>{Math.round(maxVal * 0.75).toLocaleString()}</span>
                        <span>{Math.round(maxVal * 0.5).toLocaleString()}</span>
                        <span>{Math.round(maxVal * 0.25).toLocaleString()}</span>
                        <span>0</span>
                      </div>
                      {/* Bars */}
                      <div className="fy-bars-area">
                        {/* Horizontal gridlines */}
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

              {/* ── Month Navigator (Fiscal Year: Feb → Jan) ── */}
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

              {/* ── Archive Banner (when viewing past month) ── */}
              {isArchive && (
                <div className="cf-archive-banner">
                  <div className="cf-archive-icon">📁</div>
                  <div className="cf-archive-info">
                    <span className="cf-archive-title">Arsip — {viewLabel}</span>
                    <span className="cf-archive-sub">Periode ini sudah selesai. Data bersifat read-only.</span>
                  </div>
                  <button
                    className="cf-archive-pdf-btn"
                    onClick={() => generateCashflowPDF(cfMonth, cfYear, transactions)}
                  >
                    <Download size={16} /> Unduh PDF
                  </button>
                </div>
              )}

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
                {/* LEFT — Dana Masuk (READ-ONLY dari Bendahara) */}
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
                              <span className="cf-tl-amount income-amount">+{t.amount.toLocaleString()} EGP</span>
                            </div>
                            <div className="cf-tl-meta">
                              <span>{t.date}</span>
                              {t.proofImage && <a href={`/api/media/file/${typeof t.proofImage === 'string' ? t.proofImage : t.proofImage.filename}`} target="_blank" className="cf-proof-link"><Eye size={11} /> Bukti</a>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT — Catat Belanja (only for current month) */}
                <div className="cf-section">
                  <div className="cf-section-header expense-header">
                    <div className="cf-section-title"><TrendingDown size={18} /> Catat Belanja</div>
                    <button onClick={() => generateCashflowPDF(cfMonth, cfYear, transactions)} className="cf-pdf-btn"><Download size={14} /> PDF</button>
                  </div>

                  {isArchive ? (
                    /* Archive View — read-only expense list only */
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

                  {/* Expense List — shared (current & archive) */}
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
                                {!isArchive && <button onClick={() => handleDeleteTransaction(t.id)} className="cf-del-btn"><Trash2 size={12} /></button>}
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
            )
          })()}

          {/* Monitor Pendapatan Unit — Premium Overhaul */}
          {activeTab === 'pendapatan_unit' && (
            <div className="finance-section monitor-section animate-fadeIn">
              
              {/* Header Card */}
              <div className="card monitor-header-card">
                <div className="card-top-accent accent-monitor"></div>
                <div className="monitor-header-row">
                  <div className="monitor-icon-circle">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="monitor-title">Monitor Pendapatan</h3>
                    <p className="helper-text">Data otomatis dari Invoice & Booking.</p>
                  </div>
                </div>

                {/* Revenue Grid */}
                <div className="monitor-grid">
                  {['hotel', 'visa_arrival', 'auditorium', 'rental', 'cancellation'].map(category => {
                    const relevant = invoices.filter(t => t.category === category)
                    const totals: Record<string, number> = {}
                    relevant.forEach(t => {
                      const curr = t.currency || 'USD'
                      totals[curr] = (totals[curr] || 0) + (t.amount || 0)
                    })
                    const hasData = Object.keys(totals).length > 0

                    const meta: Record<string, { label: string; color: string; bg: string }> = {
                      'hotel': { label: 'Hotel', color: '#1e40af', bg: '#dbeafe' },
                      'visa_arrival': { label: 'Visa', color: '#15803d', bg: '#dcfce7' },
                      'auditorium': { label: 'Auditorium', color: '#92400e', bg: '#fef3c7' },
                      'rental': { label: 'Rental', color: '#7c3aed', bg: '#ede9fe' },
                      'cancellation': { label: 'Pembatalan', color: '#dc2626', bg: '#fee2e2' },
                    }
                    const m = meta[category] || { label: category, color: '#6b7280', bg: '#f3f4f6' }

                    return (
                      <div className="monitor-metric-card" key={category}>
                        <div className="metric-icon-pill" style={{ background: m.bg, color: m.color }}>
                          {category === 'hotel' && <Plane size={16} />}
                          {category === 'visa_arrival' && <FileText size={16} />}
                          {category === 'auditorium' && <ClipboardList size={16} />}
                          {category === 'rental' && <Folder size={16} />}
                          {category === 'cancellation' && <ArrowUpRight size={16} />}
                        </div>
                        <span className="metric-label">{m.label}</span>
                        <div className="metric-values">
                          {Object.entries(totals).filter(([_, val]) => val > 0).map(([curr, val]) => (
                            <div key={curr} className="metric-amount-row">
                              <span className="metric-number">{val.toLocaleString()}</span>
                              <span className={`metric-currency badge-${curr.toLowerCase()}`}>{curr}</span>
                            </div>
                          ))}
                          {!hasData && <span className="metric-number metric-zero">0</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Grand Total */}
                <div className="grand-total-row">
                  <div className="gt-label-row">
                    <Wallet size={18} />
                    <span>Total Keseluruhan</span>
                  </div>
                  <div className="gt-values">
                    {(() => {
                      const grandTotals: Record<string, number> = {}
                      invoices.forEach(t => {
                        const curr = t.currency || 'USD'
                        grandTotals[curr] = (grandTotals[curr] || 0) + (t.amount || 0)
                      })
                      const hasGrandData = Object.keys(grandTotals).length > 0
                      return (
                        <>
                          {Object.entries(grandTotals).filter(([_, val]) => val > 0).map(([curr, val]) => (
                            <div key={curr} className="gt-amount">
                              <span className="gt-number">{val.toLocaleString()}</span>
                              <span className={`metric-currency badge-${curr.toLowerCase()}`}>{curr}</span>
                            </div>
                          ))}
                          {!hasGrandData && <span className="gt-number metric-zero">0</span>}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Archive Card */}
              <div className="card mt-6 monitor-archive-card">
                <div className="card-header-minimal">
                  <h3><Folder size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px' }} />Arsip Laporan</h3>
                  <div className="year-nav">
                    <button onClick={() => setReportYear(prev => prev - 1)} className="year-btn"><ChevronLeft size={16} /></button>
                    <span className="year-label">{reportYear}</span>
                    <button onClick={() => setReportYear(prev => prev + 1)} className="year-btn"><ChevronRight size={16} /></button>
                  </div>
                </div>

                {/* Breadcrumb */}
                {openMonth !== null && (
                  <div className="archive-breadcrumb">
                    <button onClick={() => setOpenMonth(null)} className="breadcrumb-btn">
                      <Folder size={14} /> {reportYear}
                    </button>
                    <ChevronRight size={14} />
                    <span className="breadcrumb-current">{new Date(reportYear, openMonth, 1).toLocaleString('id-ID', { month: 'long' })}</span>
                  </div>
                )}

                {/* Month Grid */}
                {openMonth === null && (
                  <div className="archive-month-grid">
                    {Array.from({ length: 12 }).map((_, index) => {
                      const monthName = new Date(reportYear, index, 1).toLocaleString('id-ID', { month: 'short' })
                      return (
                        <button key={index} className="month-cell" onClick={() => setOpenMonth(index)}>
                          <Folder size={20} className="month-folder-icon" />
                          <span className="month-name">{monthName}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* File List Inside Month */}
                {openMonth !== null && (
                  <div className="archive-file-list">
                    <button className="archive-file-item back-item" onClick={() => setOpenMonth(null)}>
                      <ChevronLeft size={16} />
                      <span>Kembali</span>
                    </button>
                    {['hotel', 'visa_arrival', 'auditorium', 'rental', 'cancellation'].map(cat => (
                      <button key={cat} className="archive-file-item" onClick={() => generateMonthlyUnitReport(openMonth, cat)}>
                        <FileText size={16} className="file-icon-accent" />
                        <div className="file-detail-col">
                          <span className="file-title">Laporan {cat === 'visa_arrival' ? 'Visa' : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                          <span className="file-sub">PDF • Tap untuk Unduh</span>
                        </div>
                        <Download size={14} className="file-dl-icon" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Transaction History — Mobile Timeline */}
              <div className="card mt-6">
                <div className="card-header-minimal">
                  <h3>Riwayat Transaksi</h3>
                </div>
                <div className="transaction-list" style={{ padding: 0 }}>
                  {invoices.map(t => (
                    <div key={t.id} className="transaction-item income-item">
                      <div className="item-main">
                        <div className="item-info">
                          <span className="item-title">{t.description || t.customerName || 'Invoice'}</span>
                          <span className="item-date">{t.date} • {t.category === 'visa_arrival' ? 'Visa' : t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'General'}</span>
                        </div>
                        <div className="item-financial">
                          <span className="item-amount">+{(t.amount || 0).toLocaleString()}</span>
                          <span className="item-currency">{t.currency}</span>
                        </div>
                      </div>
                      <div className="item-footer">
                        <span className="item-badge-income">Auto-Verified</span>
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && (
                    <div className="empty-state">Belum ada data pendapatan unit usaha.</div>
                  )}
                </div>
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
        
        h1, h2, h3, h4 { font-family: var(--font-heading); }

        /* Portal Header */
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
        .finance-dashboard { padding-bottom: 2rem; }
        .finance-tabs { 
            display: flex; 
            padding: 0 var(--spacing-lg); 
            gap: 0.5rem; 
            margin-bottom: var(--spacing-lg);
        }
        .sub-tab { 
            flex: 1;
            display: flex; align-items: center; justify-content: center; gap: 0.4rem;
            padding: 0.75rem 0.5rem; border-radius: var(--radius-lg); 
            border: 1.5px solid var(--color-bg-secondary); background: var(--color-bg-card);
            color: var(--color-text-secondary); font-weight: 700; font-size: 0.82rem;
            transition: all var(--transition-fast); cursor: pointer;
            white-space: nowrap; letter-spacing: -0.01em;
        }
        .sub-tab.active { 
            background: var(--color-bg-dark); color: white; border-color: var(--color-bg-dark);
            box-shadow: var(--shadow-md);
        }
        
        /* Form Card Container */
        .finance-card-padded { 
            padding: 1.25rem 1.15rem 1.5rem !important; 
            position: relative; overflow: hidden;
            border-radius: var(--radius-xl) !important;
        }
        .card-top-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .accent-income { background: linear-gradient(90deg, var(--color-success), #86efac); }
        .accent-expense { background: linear-gradient(90deg, var(--color-error), #fca5a5); }
        
        .card-header-minimal { margin-bottom: 1rem; }
        .card-header-minimal h3 { font-size: 1rem; font-weight: 800; margin-bottom: 0.15rem !important; color: var(--color-text-primary); }
        .helper-text { font-size: 0.78rem; color: var(--color-text-muted); margin: 0; line-height: 1.4; }
        
        /* Form Layout */
        .form-stack { display: flex; flex-direction: column; gap: 1rem; }
        .standard-label { 
            display: block; font-size: 0.7rem; font-weight: 800; 
            color: var(--color-text-secondary); text-transform: uppercase; 
            letter-spacing: 0.05em; margin-bottom: 0.35rem; 
        }
        .form-group { display: flex; flex-direction: column; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: 1fr; }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
        .gap-4 { gap: 0.75rem; }
        
        /* All text/number/date inputs */
        .finance-section .task-input,
        .finance-section input[type="text"],
        .finance-section input[type="number"],
        .finance-section input[type="date"] {
            width: 100%; box-sizing: border-box;
            padding: 0.8rem 0.9rem; 
            border: 1.5px solid var(--color-bg-secondary); 
            border-radius: var(--radius-lg); 
            font-size: 0.92rem; font-weight: 500;
            outline: none; 
            background: var(--color-bg-card); 
            color: var(--color-text-primary);
            transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
            -webkit-appearance: none; appearance: none;
        }
        .finance-section .task-input:focus,
        .finance-section input[type="text"]:focus,
        .finance-section input[type="number"]:focus,
        .finance-section input[type="date"]:focus { 
            border-color: var(--color-primary); 
            box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.08); 
            background: white;
        }
        .finance-section input::placeholder { color: var(--color-text-muted); font-weight: 400; }
        
        /* Currency Input (EGP prefix) */
        .currency-input-wrapper { 
            display: flex; align-items: center; 
            background: var(--color-bg-card); 
            border: 1.5px solid var(--color-bg-secondary); 
            border-radius: var(--radius-lg); overflow: hidden;
            transition: border-color var(--transition-fast);
        }
        .currency-input-wrapper:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.08); }
        .currency-prefix { 
            padding: 0.8rem 0.85rem; 
            background: var(--color-bg-secondary); 
            font-weight: 800; color: var(--color-text-muted); 
            font-size: 0.78rem; letter-spacing: 0.02em; 
            flex-shrink: 0;
        }
        .amount-input { 
            flex: 1; border: none !important; padding: 0.8rem 0.9rem; outline: none; 
            background: transparent; font-size: 1.2rem; font-weight: 800; 
            font-family: var(--font-heading); color: var(--color-text-primary);
            box-shadow: none !important;
        }
        
        /* Custom File Upload */
        .custom-file-upload { position: relative; }
        .hidden-file-input { position: absolute; width: 0; height: 0; opacity: 0; pointer-events: none; overflow: hidden; }
        .file-upload-trigger { 
            display: flex; align-items: center; gap: 0.65rem; 
            padding: 0.95rem 1rem; border: 2px dashed var(--color-bg-secondary); 
            border-radius: var(--radius-lg); cursor: pointer; color: var(--color-text-muted); 
            font-weight: 600; font-size: 0.82rem; transition: all var(--transition-fast);
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

        /* =============================================
           MONITOR PENDAPATAN — Premium Styles
           ============================================= */
        .monitor-section { padding-bottom: 2rem; }
        
        /* Header Card */
        .monitor-header-card { 
            padding: 1.25rem 1.15rem 1.5rem !important; 
            position: relative; overflow: hidden; 
            border-radius: var(--radius-xl) !important;
        }
        .accent-monitor { background: linear-gradient(90deg, var(--color-primary), #d4a574); }
        
        .monitor-header-row { 
            display: flex; align-items: center; gap: 0.85rem; 
            margin-bottom: 1.25rem; 
        }
        .monitor-icon-circle { 
            width: 42px; height: 42px; border-radius: var(--radius-lg); 
            background: rgba(139, 69, 19, 0.08); color: var(--color-primary);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .monitor-title { font-size: 1rem; font-weight: 800; margin: 0 !important; }
        
        /* Revenue Metric Grid */
        .monitor-grid { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; 
            margin-bottom: 1rem; 
        }
        .monitor-metric-card { 
            padding: 0.9rem; border-radius: var(--radius-lg); 
            border: 1px solid var(--color-bg-secondary); background: var(--color-bg-card);
            display: flex; flex-direction: column; gap: 0.35rem;
        }
        .metric-icon-pill { 
            width: 32px; height: 32px; border-radius: var(--radius-md);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .metric-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
        .metric-values { display: flex; flex-direction: column; gap: 0.15rem; }
        .metric-amount-row { display: flex; align-items: baseline; gap: 0.35rem; }
        .metric-number { font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-text-primary); }
        .metric-zero { color: #d1d5db; }
        .metric-currency { 
            font-size: 0.6rem; font-weight: 800; padding: 2px 6px; 
            border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.03em; 
        }
        .badge-usd { background: #dbeafe; color: #1e40af; }
        .badge-eur { background: #dcfce7; color: #15803d; }
        .badge-egp { background: #fef3c7; color: #92400e; }
        .badge-idr { background: #ede9fe; color: #7c3aed; }
        
        /* Grand Total Row */
        .grand-total-row { 
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.06), rgba(212, 165, 116, 0.1));
            border: 1.5px solid rgba(139, 69, 19, 0.15); border-radius: var(--radius-lg);
            padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem;
        }
        .gt-label-row { display: flex; align-items: center; gap: 0.45rem; font-size: 0.72rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; }
        .gt-values { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .gt-amount { display: flex; align-items: baseline; gap: 0.35rem; }
        .gt-number { font-size: 1.4rem; font-weight: 800; font-family: var(--font-heading); color: var(--color-text-primary); }
        
        /* Archive Card */
        .monitor-archive-card { 
            padding: 1.25rem 1.15rem !important; 
            border-radius: var(--radius-xl) !important; 
        }
        .monitor-archive-card .card-header-minimal { 
            display: flex; justify-content: space-between; align-items: center; 
            margin-bottom: 1rem; 
        }
        
        .year-nav { display: flex; align-items: center; gap: 0.3rem; }
        .year-btn { 
            width: 30px; height: 30px; border-radius: var(--radius-md); border: 1.5px solid var(--color-bg-secondary);
            background: var(--color-bg-card); display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: var(--color-text-secondary); transition: all var(--transition-fast);
        }
        .year-btn:active { background: var(--color-bg-secondary); }
        .year-label { font-size: 0.95rem; font-weight: 800; font-family: var(--font-heading); min-width: 48px; text-align: center; }
        
        /* Breadcrumb */
        .archive-breadcrumb { 
            display: flex; align-items: center; gap: 0.35rem; 
            padding: 0.5rem 0.75rem; background: var(--color-bg-primary); border-radius: var(--radius-md);
            margin-bottom: 0.75rem; font-size: 0.78rem; color: var(--color-text-muted);
        }
        .breadcrumb-btn { 
            display: flex; align-items: center; gap: 0.3rem; 
            background: none; border: none; cursor: pointer; 
            color: var(--color-primary); font-weight: 700; font-size: 0.78rem; padding: 0;
        }
        .breadcrumb-current { font-weight: 800; color: var(--color-text-primary); }
        
        /* Month Grid (3 cols) */
        .archive-month-grid { 
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; 
        }
        .month-cell { 
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 0.25rem; padding: 0.75rem 0.5rem; 
            border-radius: var(--radius-lg); border: 1.5px solid var(--color-bg-secondary);
            background: var(--color-bg-card); cursor: pointer; 
            transition: all var(--transition-fast);
        }
        .month-cell:active { background: rgba(139, 69, 19, 0.06); border-color: var(--color-primary); transform: scale(0.97); }
        .month-folder-icon { color: var(--color-primary); }
        .month-name { font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); text-transform: capitalize; }
        
        /* File List */
        .archive-file-list { display: flex; flex-direction: column; gap: 0.4rem; }
        .archive-file-item { 
            display: flex; align-items: center; gap: 0.75rem; 
            padding: 0.85rem 0.9rem; border-radius: var(--radius-lg);
            border: 1.5px solid var(--color-bg-secondary); background: var(--color-bg-card);
            cursor: pointer; transition: all var(--transition-fast); width: 100%; text-align: left;
        }
        .archive-file-item:active { background: var(--color-bg-primary); border-color: var(--color-primary); }
        .archive-file-item.back-item { border-style: dashed; color: var(--color-text-muted); font-weight: 700; font-size: 0.82rem; }
        .file-icon-accent { color: var(--color-primary); flex-shrink: 0; }
        .file-detail-col { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .file-title { font-size: 0.85rem; font-weight: 700; color: var(--color-text-primary); }
        .file-sub { font-size: 0.7rem; color: var(--color-text-muted); }
        .file-dl-icon { color: var(--color-text-muted); flex-shrink: 0; }

        /* ═══════════════════════════════════
           TRELLO BOARD — Proker Bulanan
        ═══════════════════════════════════ */
        .proker-board-wrapper { padding: var(--spacing-lg); display: flex; flex-direction: column; gap: 20px; }
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
        .staff-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 768px) { .staff-summary { grid-template-columns: 1fr; } }
        .staff-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 14px 16px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .staff-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
        .staff-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .staff-name { font-size: 0.82rem; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .staff-progress-bar { height: 6px; background: var(--color-bg-secondary); border-radius: 10px; overflow: hidden; }
        .staff-progress-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
        .staff-stat { font-size: 0.72rem; color: var(--color-text-muted); }

        /* ═══════════════════════════════════
           CASHFLOW DASHBOARD — Dana Ops
        ═══════════════════════════════════ */
        .cashflow-dashboard { padding: var(--spacing-lg); display: flex; flex-direction: column; gap: 20px; }

        /* Summary Cards */
        .cf-summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 768px) { .cf-summary-row { grid-template-columns: 1fr; gap: 10px; } }
        .cf-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-sm); border: 1.5px solid transparent; transition: all 0.2s; }
        .cf-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .cf-card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cf-income-card .cf-card-icon { background: rgba(16,185,129,0.1); color: #10b981; }
        .cf-income-card { border-color: rgba(16,185,129,0.15); }
        .cf-expense-card .cf-card-icon { background: rgba(239,68,68,0.1); color: #ef4444; }
        .cf-expense-card { border-color: rgba(239,68,68,0.15); }
        .cf-balance-card .cf-card-icon { background: rgba(139,69,19,0.1); color: var(--color-primary); }
        .cf-balance-card { border-color: rgba(139,69,19,0.15); }
        .cf-negative .cf-card-icon { background: rgba(239,68,68,0.1); color: #ef4444; }
        .cf-negative { border-color: rgba(239,68,68,0.3) !important; }
        .cf-card-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cf-card-label { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .cf-card-value { font-size: 1.1rem; font-weight: 800; color: var(--color-text-primary); font-family: var(--font-heading); }
        .cf-card-sub { font-size: 0.72rem; color: var(--color-text-muted); }

        /* Progress */
        .cf-progress-wrapper { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 16px 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .cf-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); }
        .cf-pct { font-weight: 800; color: #10b981; }
        .cf-pct.cf-pct-danger { color: #ef4444; }
        .cf-progress-bar { height: 10px; background: var(--color-bg-secondary); border-radius: 10px; overflow: hidden; }
        .cf-progress-fill { height: 100%; border-radius: 10px; transition: width 0.6s ease; }

        /* Two Column Layout */
        .cf-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 900px) { .cf-two-col { grid-template-columns: 1fr; } }
        .cf-section { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 18px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); display: flex; flex-direction: column; gap: 14px; }
        .cf-section-header { display: flex; align-items: center; justify-content: space-between; }
        .cf-section-title { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary); }
        .income-header .cf-section-title { color: #10b981; }
        .expense-header .cf-section-title { color: #ef4444; }
        .cf-readonly-badge { font-size: 0.68rem; font-weight: 700; padding: 3px 9px; background: rgba(107,114,128,0.1); color: var(--color-text-muted); border-radius: 20px; border: 1px solid var(--color-bg-secondary); }
        .cf-pdf-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 700; padding: 5px 10px; background: var(--color-bg-secondary); border: none; border-radius: 8px; cursor: pointer; color: var(--color-text-secondary); transition: all 0.2s; }
        .cf-pdf-btn:hover { background: rgba(139,69,19,0.1); color: var(--color-primary); }

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

        /* ── Month Navigator ── */
        .cf-month-nav { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 14px 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .cf-month-nav-header { margin-bottom: 10px; }
        .cf-fiscal-label { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .cf-month-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .cf-month-pill { position: relative; display: flex; flex-direction: column; align-items: center; padding: 6px 10px; border-radius: 10px; border: 1.5px solid var(--color-bg-secondary); background: var(--color-bg-primary); cursor: pointer; transition: all 0.18s; min-width: 44px; gap: 1px; }
        .cf-month-pill:hover { border-color: var(--color-primary); background: rgba(139,69,19,0.05); }
        .cf-mp-label { font-size: 0.78rem; font-weight: 700; color: var(--color-text-primary); }
        .cf-mp-year  { font-size: 0.62rem; color: var(--color-text-muted); font-weight: 600; }
        .cf-month-pill.cf-mp-past { opacity: 0.75; }
        .cf-month-pill.cf-mp-past .cf-mp-label { color: var(--color-text-muted); }
        .cf-mp-check { position: absolute; top: -5px; right: -5px; font-size: 0.6rem; background: #10b981; color: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .cf-month-pill.cf-mp-current { border-color: var(--color-primary); background: rgba(139,69,19,0.08); }
        .cf-month-pill.cf-mp-current .cf-mp-label { color: var(--color-primary); }
        .cf-mp-dot { position: absolute; top: -4px; right: -4px; width: 9px; height: 9px; background: var(--color-primary); border-radius: 50%; border: 2px solid var(--color-bg-card); animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100% { transform: scale(1); opacity:1 } 50% { transform: scale(1.3); opacity:.7 } }
        .cf-month-pill.cf-mp-selected { border-color: var(--color-primary) !important; background: var(--color-primary) !important; }
        .cf-month-pill.cf-mp-selected .cf-mp-label,
        .cf-month-pill.cf-mp-selected .cf-mp-year { color: white !important; }

        /* ── Archive Banner ── */
        .cf-archive-banner { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg, rgba(107,114,128,0.08), rgba(107,114,128,0.04)); border: 1.5px solid rgba(107,114,128,0.2); border-radius: var(--radius-xl); padding: 14px 18px; }
        .cf-archive-icon { font-size: 2rem; flex-shrink: 0; }
        .cf-archive-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .cf-archive-title { font-size: 0.95rem; font-weight: 700; color: var(--color-text-primary); }
        .cf-archive-sub   { font-size: 0.78rem; color: var(--color-text-muted); }
        .cf-archive-pdf-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; background: var(--color-primary); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; flex-shrink: 0; }
        .cf-archive-pdf-btn:hover { opacity: 0.88; }
        .cf-archive-expense-note { background: rgba(107,114,128,0.06); border: 1.5px dashed rgba(107,114,128,0.25); border-radius: 10px; padding: 10px 14px; font-size: 0.8rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 8px; }

        /* ── Fiscal Year Chart ── */
        .fy-chart-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .fy-chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .fy-chart-title-row { display: flex; align-items: center; gap: 10px; }
        .fy-chart-title-row h3 { font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }
        .fy-chart-legend { display: flex; gap: 16px; font-size: 0.8rem; color: var(--color-text-secondary); }
        .fy-legend-item { display: flex; align-items: center; gap: 6px; }
        .fy-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
        .fy-dot-income { background: #10b981; }
        .fy-dot-expense { background: #ef4444; }
        
        .fy-chart-body { display: flex; gap: 10px; height: 220px; position: relative; }
        .fy-y-axis { display: flex; flex-direction: column; justify-content: space-between; font-size: 0.65rem; color: var(--color-text-muted); text-align: right; padding-right: 8px; font-family: var(--font-heading); min-width: 40px; }
        
        .fy-bars-area { flex: 1; display: flex; justify-content: space-between; position: relative; padding-top: 5px; }
        .fy-gridlines { position: absolute; inset: 0; display: flex; flex-direction: column; pointer-events: none; z-index: 0; }
        .fy-gridline { position: absolute; left: 0; right: 0; border-bottom: 1px dashed rgba(0,0,0,0.06); }
        
        .fy-bar-group { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 8px; z-index: 1; flex: 1; cursor: pointer; transition: transform 0.2s; padding: 0 4px; }
        .fy-bar-group:hover { transform: translateY(-4px); }
        .fy-bar-group.fy-bar-selected .fy-bar-label { color: var(--color-primary); font-weight: 800; }
        .fy-bar-group.fy-bar-selected .fy-bar { opacity: 1; }
        
        .fy-bar-pair { display: flex; gap: 2px; align-items: flex-end; height: 100%; width: 100%; justify-content: center; position: relative; }
        .fy-bar { width: 40%; max-width: 24px; min-width: 8px; border-radius: 4px 4px 0 0; position: relative; opacity: 0.85; transition: opacity 0.2s, height 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .fy-bar:hover { opacity: 1; }
        .fy-bar-income { background: linear-gradient(to top, #059669, #10b981); }
        .fy-bar-expense { background: linear-gradient(to top, #dc2626, #ef4444); }
        
        .fy-bar-tooltip { position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: var(--color-bg-inverse); color: var(--color-text-inverse); font-size: 0.65rem; font-weight: 700; padding: 3px 6px; border-radius: 4px; pointer-events: none; opacity: 0; transition: opacity 0.2s, top 0.2s; white-space: nowrap; font-family: var(--font-heading); z-index: 10; }
        .fy-bar:hover .fy-bar-tooltip { opacity: 1; top: -30px; }
        
        .fy-bar-label { font-size: 0.65rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }


      `}</style>
      </div >
    </PortalPinGuard>
  )
}
