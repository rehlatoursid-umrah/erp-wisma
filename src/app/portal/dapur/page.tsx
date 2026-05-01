'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import { Download, TrendingDown, ClipboardList, Save, Eye, Wallet, BarChart3, ChefHat } from 'lucide-react'
import jsPDF from 'jspdf'

export default function DapurPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const fetchCashflow = async (month: number, year: number) => {
    try {
      const res = await fetch(`/api/finance?month=${month}&year=${year}&division=dapur`)
      if (res.ok) {
        const data = await res.json()
        setTransactions((data.cashflow || []).map((item: any) => ({
          id: item.id, date: item.transactionDate ? item.transactionDate.split('T')[0] : '',
          category: item.category, amount: item.amount, currency: item.currency, type: item.type,
          description: item.description, status: item.approvalStatus, quantity: item.quantity, unitPrice: item.unitPrice,
          proofImage: item.proofImage
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

    setIsSubmitting(true)
    let proofImage: string | undefined
    if (expenseForm.file) {
      const fd = new FormData(); fd.append('file', expenseForm.file)
      try { 
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (upRes.ok) { 
            const d = await upRes.json()
            proofImage = d.doc?.id || d.id 
        } 
      } catch (e) { console.error(e) }
    }

    try {
      const res = await fetch('/api/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            type: 'out', category: 'operational', division: 'dapur', 
            amount: totalAmount, currency: 'EGP', description: expenseForm.itemName, 
            transactionDate: expenseForm.date, 
            quantity: expenseForm.quantity ? Number(expenseForm.quantity) : undefined, 
            unitPrice: expenseForm.unitPrice ? Number(expenseForm.unitPrice) : undefined, 
            proofImage 
        })
      })
      if (res.ok) { 
        setExpenseForm({ itemName: '', quantity: '', unitPrice: '', amount: '0', date: new Date().toISOString().split('T')[0], file: null })
        fetchCashflow(cfMonth, cfYear) 
      }
    } catch (e) { console.error(e) }
    setIsSubmitting(false)
  }

  const totalIncome = transactions.filter(t => t.type === 'in' && t.category === 'treasurer_funding').reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpense = transactions.filter(t => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0)
  const saldo = totalIncome - totalExpense
  const viewLabel = new Date(cfYear, cfMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  const isArchive = cfMonth !== CURRENT_MONTH || cfYear !== CURRENT_YEAR

  const generateCashflowPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16); doc.text(`Laporan Dana Operasional Dapur`, 105, 22, { align: 'center' })
    doc.setFontSize(12); doc.text(`Periode: ${viewLabel}`, 105, 30, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Dana Diterima: EGP ${totalIncome.toLocaleString()}`, 20, 45)
    doc.text(`Pengeluaran: EGP ${totalExpense.toLocaleString()}`, 20, 52)
    doc.text(`Sisa Saldo: EGP ${saldo.toLocaleString()}`, 20, 59)
    let y = 75; doc.text('Rincian Pengeluaran:', 20, y); y += 10
    transactions.filter(t => t.type === 'out').forEach((t, i) => { 
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(`${i+1}. ${t.date} - ${t.description} : EGP ${(t.amount||0).toLocaleString()}`, 20, y)
        y += 7 
    })
    doc.save(`Laporan_Dapur_${viewLabel}.pdf`)
  }

  return (
    <PortalPinGuard portalName="Dapur" expectedPin={process.env.NEXT_PUBLIC_DAPUR_PIN}>
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="portal-header">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="flex items-center gap-2">
                  <ChefHat className="text-[#8b4513]" size={28} />
                  Portal Dapur
                </h1>
                <p>Manajemen Logistik & Operasional Dapur</p>
              </div>
            </div>
          </div>

          <div className="cashflow-dashboard">
            {/* Bulan Navigasi */}
            <div className="cf-month-nav">
                <div className="cf-month-nav-header">
                <span className="cf-fiscal-label">Periode Laporan</span>
                <button onClick={generateCashflowPDF} className="trello-save-btn" style={{ padding: '6px 12px', width: 'auto' }}>
                    <Download size={14} /> PDF
                </button>
                </div>
                <div className="cf-month-pills">
                {fiscalMonths.map((m, i) => {
                    const isSelected = m.month === cfMonth && m.year === cfYear;
                    const isPast = (m.year < CURRENT_YEAR) || (m.year === CURRENT_YEAR && m.month < CURRENT_MONTH);
                    return (
                    <div
                        key={i}
                        onClick={() => { setCfMonth(m.month); setCfYear(m.year); }}
                        className={`cf-month-pill ${isSelected ? 'cf-mp-selected' : ''} ${isPast && !isSelected ? 'cf-mp-past' : ''}`}
                    >
                        <span className="cf-mp-label">{m.label}</span>
                        <span className="cf-mp-year">{m.year}</span>
                        {m.month === CURRENT_MONTH && m.year === CURRENT_YEAR && !isSelected && <div className="cf-mp-dot" />}
                        {isPast && <span className="cf-mp-check">✓</span>}
                    </div>
                    )
                })}
                </div>
            </div>

            {/* Summary Row */}
            <div className="cf-summary-row">
                <div className="cf-card cf-income-card">
                <div className="cf-card-icon"><Wallet size={24} /></div>
                <div className="cf-card-body">
                    <span className="cf-card-label">Dana Diterima</span>
                    <span className="cf-card-value">EGP {totalIncome.toLocaleString()}</span>
                </div>
                </div>
                <div className="cf-card cf-expense-card">
                <div className="cf-card-icon"><TrendingDown size={24} /></div>
                <div className="cf-card-body">
                    <span className="cf-card-label">Total Pengeluaran</span>
                    <span className="cf-card-value">EGP {totalExpense.toLocaleString()}</span>
                </div>
                </div>
                <div className={`cf-card cf-balance-card ${saldo < 0 ? 'cf-negative' : ''}`}>
                <div className="cf-card-icon"><BarChart3 size={24} /></div>
                <div className="cf-card-body">
                    <span className="cf-card-label">Sisa Saldo</span>
                    <span className="cf-card-value">EGP {saldo.toLocaleString()}</span>
                </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="cf-two-col">
                {/* KIRI: Form Pengeluaran */}
                <div className="cf-section" style={{ position: 'sticky', top: '20px' }}>
                <div className="cf-section-header expense-header">
                    <div className="cf-section-title"><TrendingDown size={18} color="#ef4444" /> Catat Pengeluaran Dapur</div>
                </div>
                <form onSubmit={handleExpenseSubmit} className="cf-timeline" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {isArchive && <div style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '10px', background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>⚠️ Anda mencatat pengeluaran di bulan lalu.</div>}
                    
                    <div className="cf-input-group">
                    <label>Nama Item / Bahan</label>
                    <input type="text" className="cf-input" placeholder="Contoh: Beras 50kg, Minyak Goreng" value={expenseForm.itemName} onChange={e => setExpenseForm({ ...expenseForm, itemName: e.target.value })} required />
                    </div>
                    <div className="cf-form-row">
                    <div className="cf-input-group">
                        <label>Qty (Opsional)</label>
                        <input type="number" className="cf-input" placeholder="1" value={expenseForm.quantity} onChange={e => { const qty = Number(e.target.value); const price = Number(expenseForm.unitPrice); setExpenseForm({ ...expenseForm, quantity: e.target.value, amount: (qty * price).toString() }) }} />
                    </div>
                    <div className="cf-input-group">
                        <label>Harga Satuan (EGP)</label>
                        <input type="number" className="cf-input" placeholder="0" value={expenseForm.unitPrice} onChange={e => { const price = Number(e.target.value); const qty = Number(expenseForm.quantity); setExpenseForm({ ...expenseForm, unitPrice: e.target.value, amount: (qty * price).toString() }) }} />
                    </div>
                    </div>
                    <div className="cf-total-display">
                    <span>Total Biaya</span>
                    <span className="cf-total-value">EGP {Number(expenseForm.amount).toLocaleString() || '0'}</span>
                    </div>
                    <div className="cf-input-group" style={{ marginTop: '12px' }}>
                        <label>Tanggal Pembelian</label>
                        <input type="date" className="cf-input" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                    </div>
                    <div className="cf-upload-area">
                    <input type="file" accept="image/*,application/pdf" id="exp-file" className="hidden-file-input" onChange={e => { if (e.target.files?.[0]) setExpenseForm({ ...expenseForm, file: e.target.files[0] }) }} />
                    <label htmlFor="exp-file" className="cf-upload-label">
                        <ClipboardList size={18} />
                        <span>{expenseForm.file ? expenseForm.file.name : 'Upload Struk Belanja / Bon'}</span>
                    </label>
                    </div>
                    <button type="submit" className="cf-submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Menyimpan...' : <><Save size={16} /> Simpan Pengeluaran</>}
                    </button>
                </form>
                </div>

                {/* KANAN: Timeline */}
                <div className="cf-section">
                <div className="cf-section-header">
                    <div className="cf-section-title">Timeline Pengeluaran</div>
                    <span className="cf-readonly-badge">{transactions.filter(t => t.type === 'out').length} Transaksi</span>
                </div>
                <div className="cf-timeline">
                    {transactions.filter(t => t.type === 'out').length === 0 ? (
                    <div className="cf-empty"><TrendingDown size={32} /><p>{isArchive ? 'Tidak ada pengeluaran di periode ini' : 'Belum ada catatan pengeluaran bulan ini'}</p></div>
                    ) : (
                    transactions.filter(t => t.type === 'out').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
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
        </main>
        
        <style jsx>{`
        /* MOBILE-FIRST FULLWIDTH STYLES (Matches PMIK / BPPG / Bendahara) */
        .dashboard-layout { display: flex; min-height: 100vh; background: var(--color-bg-primary); font-family: var(--font-sans); color: var(--color-text-primary); }
        .main-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding-bottom: 80px; animation: fadeIn 0.4s ease-out forwards; }
        
        .portal-header { padding: var(--spacing-lg); background: var(--color-bg-card); border-bottom: 1px solid var(--color-bg-secondary); }
        .portal-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 0.25rem 0; line-height: 1.2; }
        .portal-header p { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; font-weight: 500; }
        
        .cashflow-dashboard { display: flex; flex-direction: column; gap: 1.5rem; padding: var(--spacing-lg); }

        /* Desktop scale-up */
        @media (min-width: 768px) {
          .portal-header { padding: var(--spacing-lg) var(--spacing-2xl); }
          .cashflow-dashboard { padding: var(--spacing-xl) var(--spacing-2xl); }
        }

        /* Month Nav */
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

        /* Summary Cards */
        .cf-summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        @media (max-width: 768px) { .cf-summary-row { grid-template-columns: 1fr; gap: 1rem; } }
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

        /* Forms & Containers */
        .cf-two-col { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 1024px) { .cf-two-col { grid-template-columns: 1fr; } }
        .cf-section { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); overflow: hidden; }
        .cf-section-header { padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
        .expense-header { background: rgba(239, 68, 68, 0.03); }
        .cf-section-title { font-weight: 700; font-size: 1rem; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem; }
        .cf-readonly-badge { font-size: 0.7rem; font-weight: 700; background: var(--color-bg-secondary); padding: 4px 8px; border-radius: 6px; color: var(--color-text-muted); }
        
        .cf-input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .cf-input-group label { font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); }
        .cf-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--color-bg-secondary); border-radius: 8px; font-size: 0.9rem; background: var(--color-bg-primary); color: var(--color-text-primary); transition: all 0.2s; }
        .cf-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(139,69,19,0.1); }
        .cf-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cf-total-display { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: rgba(139,69,19,0.05); border-radius: 8px; margin: 8px 0; }
        .cf-total-display span:first-child { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
        .cf-total-value { font-size: 1.2rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-heading); }
        
        .cf-upload-area { margin: 16px 0; }
        .hidden-file-input { display: none; }
        .cf-upload-label { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; border: 1.5px dashed var(--color-border); border-radius: 8px; font-size: 0.85rem; color: var(--color-text-muted); cursor: pointer; transition: all 0.2s; background: var(--color-bg-primary); }
        .cf-upload-label:hover { border-color: var(--color-primary); color: var(--color-primary); background: rgba(139,69,19,0.02); }
        
        .cf-submit-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--color-primary); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .cf-submit-btn:hover { background: var(--color-primary-dark); }
        .cf-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .trello-save-btn { flex: 1; background: var(--color-primary); color: white; border: none; border-radius: 8px; padding: 7px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: opacity 0.2s; }

        /* Timeline */
        .cf-timeline { display: flex; flex-direction: column; gap: 0; padding: 1.5rem; }
        .cf-timeline-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--color-bg-secondary); }
        .cf-timeline-item:last-child { border-bottom: none; }
        .cf-tl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .expense-dot { background: #ef4444; }
        .cf-tl-body { flex: 1; min-width: 0; }
        .cf-tl-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 3px; }
        .cf-tl-title { font-size: 0.84rem; font-weight: 600; color: var(--color-text-primary); }
        .cf-tl-amount { font-size: 0.84rem; font-weight: 800; white-space: nowrap; font-family: var(--font-heading); }
        .expense-amount { color: #ef4444; }
        .cf-tl-meta { display: flex; align-items: center; gap: 10px; font-size: 0.72rem; color: var(--color-text-muted); }
        .cf-proof-link { display: inline-flex; align-items: center; gap: 3px; color: var(--color-primary); font-weight: 600; text-decoration: none; font-size: 0.72rem; }
        .cf-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px; color: var(--color-text-muted); text-align: center; }
        .cf-empty p { font-size: 0.82rem; }
        `}</style>
      </div>
    </PortalPinGuard>
  )
}
