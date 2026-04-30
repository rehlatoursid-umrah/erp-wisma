'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Loader2, Calendar, FileText, CheckCircle2, Circle, Clock, ChevronRight, ChevronDown, User, AlertTriangle, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface TaskStats {
  total: number
  completed: number
  pending: number
  in_progress: number
}

interface DivisionData {
  title: string
  stats: TaskStats
  tasks: any[]
}

export default function RapatProkerPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Record<string, DivisionData>>({})
  const [periodLabel, setPeriodLabel] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // State for Accordion (Expanded divisions)
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proker-rapat?month=${selectedMonth}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
        setPeriodLabel(json.period.label)
        
        // Expand divisions that have tasks by default
        const toExpand: Record<string, boolean> = {}
        Object.entries(json.data).forEach(([key, val]: [string, any]) => {
          if (val.tasks.length > 0) toExpand[key] = true
        })
        setExpandedDivisions(toExpand)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleDivision = (key: string) => {
    setExpandedDivisions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getPriorityColor = (p: string) => {
    if (p === 'high') return 'text-red-600 bg-red-50 border-red-200'
    if (p === 'normal') return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }

  const getStatusIcon = (s: string) => {
    if (s === 'done') return <CheckCircle2 size={18} className="text-emerald-500" />
    if (s === 'in_progress') return <Clock size={18} className="text-amber-500" />
    return <Circle size={18} className="text-slate-300" />
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[280px] min-h-screen w-full lg:w-[calc(100vw-280px)] max-w-full transition-all flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* Header Section */}
          <div className="mb-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4">
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <FileText className="text-[#8b4513]" size={32} />
                  Rekapitulasi Proker Divisi
                </h1>
                <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
                  <Calendar size={16} /> Data Rapat Bulanan • {periodLabel}
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-sm font-semibold text-slate-600 pl-2">Filter Bulan:</span>
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#8b4513]" size={40} />
              <p className="text-slate-500 font-medium">Memuat data proker...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(data).map(([key, division]) => {
                const hasTasks = division.tasks.length > 0
                const isExpanded = expandedDivisions[key]
                const progressPct = division.stats.total === 0 ? 0 : Math.round((division.stats.completed / division.stats.total) * 100)

                return (
                  <div key={key} className={cn(
                    "bg-white rounded-2xl border overflow-hidden transition-all duration-200 shadow-sm",
                    hasTasks ? "border-slate-200" : "border-slate-100 opacity-60"
                  )}>
                    {/* Accordion Header */}
                    <button 
                      onClick={() => hasTasks && toggleDivision(key)}
                      disabled={!hasTasks}
                      className={cn(
                        "w-full px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors",
                        hasTasks ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                          hasTasks ? "bg-[#8b4513] text-white" : "bg-slate-200 text-slate-400"
                        )}>
                          {isExpanded && hasTasks ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg font-bold text-slate-800">{division.title}</h2>
                          <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">Total: {division.stats.total}</span>
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">Selesai: {division.stats.completed}</span>
                            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">Proses: {division.stats.in_progress}</span>
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Pending: {division.stats.pending}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {hasTasks && (
                        <div className="flex items-center gap-4 lg:w-64">
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                progressPct === 100 ? "bg-emerald-500" : "bg-[#8b4513]"
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-700 min-w-[3rem] text-right">{progressPct}%</span>
                        </div>
                      )}
                    </button>

                    {/* Accordion Body */}
                    {isExpanded && hasTasks && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {division.tasks.map((task: any) => (
                            <div key={task.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                              
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <h3 className="font-semibold text-slate-800 text-[0.95rem] leading-snug">{task.title}</h3>
                                <div className="flex-shrink-0 mt-0.5">
                                  {getStatusIcon(task.status)}
                                </div>
                              </div>
                              
                              {task.description && (
                                <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">{task.description}</p>
                              )}

                              <div className="flex items-center flex-wrap gap-2 mb-4">
                                <span className={cn("text-[0.65rem] font-bold uppercase tracking-wider px-2 py-1 rounded-md border", getPriorityColor(task.priority))}>
                                  {task.priority === 'high' ? 'High Priority' : task.priority === 'normal' ? 'Normal' : 'Low Priority'}
                                </span>
                                {task.relatedRoom && (
                                  <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700">
                                    {task.relatedRoom}
                                  </span>
                                )}
                              </div>

                              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                    <User size={12} />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px]">
                                    {task.assigneeData?.fullName || 'Belum di-assign'}
                                  </span>
                                </div>
                                <div className="text-[0.65rem] font-semibold text-slate-400">
                                  {new Date(task.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </div>
                              </div>

                              {/* Indicator for Photos */}
                              {task.photos && task.photos.length > 0 && (
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-[#8b4513] text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                  {task.photos.length} Foto
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
