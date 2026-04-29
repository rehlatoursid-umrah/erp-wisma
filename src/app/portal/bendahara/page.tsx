'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import PortalPinGuard from '@/components/auth/PortalPinGuard'
import SlipGajiWidget from '@/components/bendahara/SlipGajiWidget'

import { Wallet, ArrowDownLeft, TrendingDown, ClipboardCheck, ArrowRight, Activity, PlusCircle } from 'lucide-react'

export default function BendaharaPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [distForm, setDistForm] = useState({ division: 'bpupd', amount: '', description: '' })
  const [distHistory, setDistHistory] = useState<any[]>([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [pendingFunds, setPendingFunds] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(true)

  const fetchData = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/finance')
      if (res.ok) {
        const data = await res.json()
        const cashflow = data.cashflow || []
        const invoices = data.invoices || []
        
        // Distributions history (sent by bendahara)
        const history = cashflow.filter((c: any) => c.category === 'treasurer_funding' && c.type === 'in')
        setDistHistory(history.slice(0, 5))

        // Calculate Summary
        let totalIncome = 0
        invoices.forEach((i: any) => { if (i.currency === 'EGP') totalIncome += i.totalAmount })
        cashflow.filter((c: any) => c.type === 'in' && c.category !== 'treasurer_funding' && c.currency === 'EGP').forEach((c: any) => totalIncome += c.amount)
        
        let totalExpense = 0
        cashflow.filter((c: any) => (c.type === 'out' || (c.type === 'in' && c.category === 'treasurer_funding')) && c.currency === 'EGP').forEach((c: any) => totalExpense += c.amount)

        setSummary({ income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense })

        // Pending Funds
        const pending = cashflow.filter((c: any) => c.type === 'in' && c.approvalStatus === 'pending')
        setPendingFunds(pending)
      }
    } catch (e) { console.error(e) }
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const submitDistribusi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!distForm.amount || !distForm.description) return
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'in', 
          category: 'treasurer_funding',
          division: distForm.division,
          amount: distForm.amount,
          currency: 'EGP',
          description: distForm.description,
          transactionDate: new Date().toISOString().split('T')[0]
        })
      })
      if (res.ok) {
        setDistForm({ division: 'bpupd', amount: '', description: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to distribute funds', error)
      alert('Gagal mengirim dana')
    }
  }

  const LogbookTasks = ({ category }: { category: string }) => {
    const [tasks, setTasks] = useState<any[]>([])

    useEffect(() => {
      fetch(`/api/tasks?category=${category}`).then(res => res.json()).then(data => setTasks(data)).catch(err => console.error(err))
    }, [category])

    if (tasks.length === 0) return <div className="empty-state"><ClipboardCheck size={24} /> <p>Tidak ada pesan logbook.</p></div>

    return (
      <div className="logbook-list">
        {tasks.map((t: any) => (
          <div key={t.id} className="logbook-item">
            <p className="lb-title">{t.title}</p>
            <span className="lb-date">{new Date(t.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <PortalPinGuard portalName="Bendahara" expectedPin={process.env.NEXT_PUBLIC_BENDAHARA_PIN}>
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="main-content">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <div className="portal-header">
            <div>
              <h1>🛡️ Bendahara Umum</h1>
              <p className="portal-subtitle">Sistem Manajemen Keuangan Pusat</p>
            </div>
            {isRefreshing ? (
               <span className="badge badge-info shrink-0"><Activity size={14} className="animate-spin" /> Syncing...</span>
            ) : (
               <span className="badge badge-success shrink-0"><ClipboardCheck size={14} /> Terverifikasi</span>
            )}
          </div>

          <div className="cf-summary-row" style={{ marginBottom: '1.5rem' }}>
             <div className="cf-card cf-income-card">
               <div className="cf-card-icon"><ArrowDownLeft size={22} /></div>
               <div className="cf-card-body">
                 <span className="cf-card-label">Total Pemasukan</span>
                 <span className="cf-card-value">EGP {summary.income.toLocaleString()}</span>
                 <span className="cf-card-sub">Bulan Ini</span>
               </div>
             </div>
             <div className="cf-card cf-expense-card">
               <div className="cf-card-icon"><TrendingDown size={22} /></div>
               <div className="cf-card-body">
                 <span className="cf-card-label">Total Pengeluaran</span>
                 <span className="cf-card-value">EGP {summary.expense.toLocaleString()}</span>
                 <span className="cf-card-sub">Bulan Ini</span>
               </div>
             </div>
             <div className={`cf-card cf-balance-card ${summary.balance < 0 ? 'cf-negative' : ''}`}>
               <div className="cf-card-icon"><Wallet size={22} /></div>
               <div className="cf-card-body">
                 <span className="cf-card-label">Total Saldo Aktif</span>
                 <span className="cf-card-value">EGP {summary.balance.toLocaleString()}</span>
                 <span className="cf-card-sub">{summary.balance < 0 ? 'Defisit' : 'Surplus'}</span>
               </div>
             </div>
           </div>

          <div className="portal-grid">
            
            <div className="card">
              <div className="card-header-icon">
                 <ArrowDownLeft size={20} className="icon-income" />
                 <h3>Incoming Funds</h3>
              </div>
              <p className="card-desc">Setoran tunai & kas yang menunggu persetujuan pusat</p>
              
              <div className="pending-list">
                {pendingFunds.length === 0 ? (
                   <div className="empty-state">
                      <ClipboardCheck size={28} style={{ color: 'var(--color-success)' }} />
                      <p>Semua dana telah disetujui.</p>
                   </div>
                ) : (
                   pendingFunds.map(p => (
                    <div key={p.id} className="pending-item">
                      <div>
                        <strong>{p.description}</strong>
                        <span className="amount">EGP {p.amount?.toLocaleString()}</span>
                      </div>
                      <div className="actions">
                        <button className="btn btn-primary" onClick={() => alert('Fitur approval dalam pengembangan')}>Approve</button>
                      </div>
                    </div>
                   ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header-icon">
                 <ArrowRight size={20} className="icon-primary" />
                 <h3>Distribusi Uang Operasional</h3>
              </div>
              <p className="card-desc">Kirim dana operasional bulan ini ke divisi terkait</p>
              
              <form className="dist-form" onSubmit={submitDistribusi}>
                <div className="dist-group">
                  <label>Pilih Divisi Penerima</label>
                  <select className="dist-input" value={distForm.division} onChange={e => setDistForm({...distForm, division: e.target.value})}>
                    <option value="bpupd">BPUPD (Biro Perjalanan Umrah)</option>
                    <option value="bppg">BPPG (Biro Pemeliharaan & HK)</option>
                  </select>
                </div>
                <div className="dist-row">
                  <div className="dist-group">
                    <label>Jumlah (EGP) *</label>
                    <input type="number" required className="dist-input" placeholder="0" value={distForm.amount} onChange={e => setDistForm({...distForm, amount: e.target.value})} />
                  </div>
                </div>
                <div className="dist-group">
                  <label>Keterangan / Tujuan Dana *</label>
                  <input type="text" required className="dist-input" placeholder="Contoh: Dana Operasional April" value={distForm.description} onChange={e => setDistForm({...distForm, description: e.target.value})} />
                </div>
                <button type="submit" className="cf-submit-btn"><ArrowRight size={16} /> Distribusikan Dana</button>
              </form>

              <div className="dist-history">
                <h4>Riwayat Distribusi</h4>
                {distHistory.length === 0 ? (
                  <p className="text-muted">Belum ada data distribusi.</p>
                ) : (
                  distHistory.map(h => (
                    <div key={h.id} className="history-item">
                      <div>
                        <div className="hi-title">{h.description} <span className="hi-badge">{h.division}</span></div>
                        <div className="hi-date">{h.transactionDate ? h.transactionDate.split('T')[0] : ''}</div>
                      </div>
                      <div className="hi-amount">- EGP {h.amount?.toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header-icon">
                 <ClipboardCheck size={20} className="icon-muted" />
                 <h3>Catatan Logbook</h3>
              </div>
              <p className="card-desc">Pesan & laporan dari Piket/Resepsionis</p>
              <LogbookTasks category="bendahara" />
            </div>

            <SlipGajiWidget />
          </div>
        </main>

        <style jsx>{`
          .dashboard-layout { display: flex; min-height: 100vh; background: var(--color-bg-primary); }
          .main-content { flex: 1; padding: var(--spacing-2xl); width: 100%; display: flex; flex-direction: column; animation: fadeIn 0.4s ease-out forwards; }
          
          .portal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); }
          .portal-header h1 { font-size: 2rem; font-weight: 800; color: var(--color-text); margin: 0 0 0.25rem 0; letter-spacing: -0.02em; }
          .portal-subtitle { font-size: 0.95rem; color: var(--color-text-muted); margin: 0; font-weight: 500; }
          .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
          .badge-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .badge-info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
          .shrink-0 { flex-shrink: 0; }

          /* Summary Cards (from BPUPD/BPPG aesthetic) */
          .cf-summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; animation: slideUp 0.4s ease-out forwards; }
          .cf-card { background: var(--color-bg-card); border-radius: 16px; border: 1px solid var(--color-border); padding: 1.5rem; display: flex; align-items: flex-start; gap: 1.25rem; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
          .cf-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
          .cf-card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .cf-income-card .cf-card-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
          .cf-expense-card .cf-card-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
          .cf-balance-card .cf-card-icon { background: rgba(139, 69, 19, 0.1); color: var(--color-primary); }
          .cf-negative { border-color: #ef4444 !important; background: rgba(239, 68, 68, 0.02); }
          .cf-negative .cf-card-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
          .cf-card-body { display: flex; flex-direction: column; gap: 0.25rem; }
          .cf-card-label { font-size: 0.75rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
          .cf-card-value { font-size: 1.5rem; font-weight: 800; color: var(--color-text-primary); }
          .cf-card-sub { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500; }

          .portal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .card { background: var(--color-bg-card); border-radius: 16px; padding: 1.5rem; border: 1px solid var(--color-border); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); transition: all 0.2s ease; display: flex; flex-direction: column; }
          .card:hover { box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05); border-color: var(--color-primary-light); }
          
          .card-header-icon { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
          .card-header-icon h3 { font-size: 1.15rem; font-weight: 700; color: var(--color-text); margin: 0; }
          .icon-income { color: #10b981; }
          .icon-primary { color: var(--color-primary); }
          .icon-muted { color: var(--color-text-muted); }
          .card-desc { color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; }

          .pending-list { display: flex; flex-direction: column; gap: 1rem; }
          .pending-item { display: flex; flex-direction: column; padding: 1.25rem; background: var(--color-bg-secondary); border-radius: 12px; border: 1px solid transparent; transition: all 0.2s ease; }
          .pending-item:hover { border-color: var(--color-border); background: var(--color-bg-card); box-shadow: var(--shadow-sm); }
          .pending-item > div:first-child { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
          .pending-item strong { display: block; color: var(--color-text); font-size: 0.95rem; font-weight: 600; margin-bottom: 0.25rem; }
          .amount { display: block; font-size: 1.15rem; font-weight: 800; color: #10b981; }
          .actions { display: flex; gap: 0.5rem; width: 100%; }
          .actions .btn { flex: 1; padding: 0.6rem; font-size: 0.85rem; border-radius: 8px; font-weight: 600; }

          .empty-state { padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; color: var(--color-text-muted); background: var(--color-bg-secondary); border-radius: 12px; }
          .empty-state p { margin: 0; font-size: 0.9rem; font-weight: 500; }

          /* Distribusi Form Styles */
          .dist-form { display: flex; flex-direction: column; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); }
          .dist-group { display: flex; flex-direction: column; gap: 0.4rem; }
          .dist-group label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); }
          .dist-row { display: flex; gap: 1rem; }
          .dist-row .dist-group { flex: 1; }
          .dist-input { padding: 0.75rem 1rem; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-bg-primary); font-size: 0.9rem; outline: none; transition: all 0.2s; font-family: inherit; }
          .dist-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1); background: var(--color-bg-card); }
          .cf-submit-btn { margin-top: 0.5rem; width: 100%; padding: 0.875rem; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 0.5rem; box-shadow: 0 4px 10px rgba(139, 69, 19, 0.2); transition: transform 0.2s; }
          .cf-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(139, 69, 19, 0.3); }

          .dist-history h4 { font-size: 0.8rem; color: var(--color-text-muted); margin: 1.5rem 0 1rem 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .history-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--color-bg-secondary); border-radius: 12px; margin-bottom: 0.5rem; border: 1px solid transparent; transition: all 0.2s; }
          .history-item:hover { border-color: var(--color-border); background: var(--color-bg-card); }
          .hi-title { font-weight: 600; font-size: 0.9rem; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem; }
          .hi-badge { background: var(--color-primary-light); color: var(--color-primary-dark); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
          .hi-date { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; font-weight: 500; }
          .hi-amount { font-weight: 700; color: #ef4444; font-size: 0.95rem; }
          
          .text-muted { color: var(--color-text-muted); font-size: 0.85rem; }

          /* Logbook Styles */
          .logbook-list { display: flex; flex-direction: column; gap: 0.75rem; }
          .logbook-item { padding: 1rem; background: var(--color-bg-secondary); border-radius: 10px; border-left: 3px solid var(--color-text-muted); }
          .lb-title { font-weight: 600; font-size: 0.9rem; margin: 0 0 4px 0; color: var(--color-text-primary); }
          .lb-date { font-size: 0.75rem; color: var(--color-text-muted); }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

          @media (max-width: 1024px) {
            .cf-summary-row { grid-template-columns: 1fr; }
          }
          @media (max-width: 768px) {
            .portal-grid { grid-template-columns: 1fr; }
            .main-content { padding: 1.25rem; padding-top: calc(var(--spacing-2xl) + 20px); }
            .cf-card { padding: 1.25rem; }
            .portal-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          }
        `}</style>
      </div>
    </PortalPinGuard>
  )
}
