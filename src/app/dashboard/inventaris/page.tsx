'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import {
  Package, Plus, Search, Filter, Trash2, Edit3, QrCode, Printer,
  ChevronDown, X, Building2, Layers, DollarSign, AlertTriangle,
  CheckCircle2, ArrowLeft, Loader2, Camera
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FLOORS, CONDITION_OPTIONS, DEFAULT_EGP_TO_IDR } from '@/constants/asset-inventory'
import QRCode from 'qrcode'

// ═══ TYPES ═══
interface Room {
  id: string
  floor: number
  roomName: string
  roomCode: string
}

interface AssetItem {
  id: string
  inventoryCode: string
  floor: number
  room: Room | string
  yearAcquired: number
  itemName: string
  brand?: string
  quantity: number
  priceEGP: number
  exchangeRate: number
  priceIDR: number
  totalValueEGP: number
  totalValueIDR: number
  condition: 'baik' | 'rusak'
  description?: string
  photo?: any
  createdAt: string
}

interface Summary {
  totalRecords: number
  totalItems: number
  totalValueEGP: number
  totalValueIDR: number
  totalBaik: number
  totalRusak: number
}

// ═══ QR CODE COMPONENT ═══
function QRCodeCanvas({ value, size = 180 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#1a1612', light: '#ffffff' },
      })
    }
  }, [value, size])

  return <canvas ref={canvasRef} />
}

// ═══ MAIN PAGE ═══
export default function InventarisPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data state
  const [items, setItems] = useState<AssetItem[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [summary, setSummary] = useState<Summary>({ totalRecords: 0, totalItems: 0, totalValueEGP: 0, totalValueIDR: 0, totalBaik: 0, totalRusak: 0 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterFloor, setFilterFloor] = useState<string>('')
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [filterCondition, setFilterCondition] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [editingItem, setEditingItem] = useState<AssetItem | null>(null)
  const [qrItem, setQrItem] = useState<AssetItem | null>(null)

  // Form state
  const [itemForm, setItemForm] = useState({
    floor: 1,
    room: '',
    yearAcquired: new Date().getFullYear(),
    itemName: '',
    brand: '',
    quantity: 1,
    priceEGP: 0,
    exchangeRate: DEFAULT_EGP_TO_IDR,
    condition: 'baik' as 'baik' | 'rusak',
    description: '',
  })
  const [roomForm, setRoomForm] = useState({ floor: 1, roomName: '' })
  const [submitting, setSubmitting] = useState(false)

  // ═══ DATA FETCHING ═══
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/asset-rooms')
      if (res.ok) setRooms(await res.json())
    } catch (e) { console.error(e) }
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterFloor) params.set('floor', filterFloor)
      if (filterRoom) params.set('room', filterRoom)
      if (filterCondition) params.set('condition', filterCondition)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/asset-inventory?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.docs)
        setSummary(data.summary)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filterFloor, filterRoom, filterCondition, searchQuery])

  useEffect(() => { fetchRooms() }, [fetchRooms])
  useEffect(() => { fetchItems() }, [fetchItems])

  // Rooms filtered by selected floor
  const floorRooms = rooms.filter(r => !filterFloor || r.floor === Number(filterFloor))
  const formFloorRooms = rooms.filter(r => r.floor === itemForm.floor)

  // ═══ HANDLERS ═══
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomForm.roomName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/asset-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomForm),
      })
      if (res.ok) {
        setShowAddRoom(false)
        setRoomForm({ floor: 1, roomName: '' })
        fetchRooms()
      } else {
        const err = await res.json()
        alert(err.error || 'Gagal menambah ruangan')
      }
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Hapus ruangan ini?')) return
    try {
      const res = await fetch(`/api/asset-rooms?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchRooms()
      } else {
        const err = await res.json()
        alert(err.error || 'Gagal menghapus ruangan')
      }
    } catch (e) { console.error(e) }
  }

  const resetItemForm = () => {
    setItemForm({
      floor: 1, room: '', yearAcquired: new Date().getFullYear(),
      itemName: '', brand: '', quantity: 1, priceEGP: 0,
      exchangeRate: DEFAULT_EGP_TO_IDR, condition: 'baik', description: '',
    })
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.room || !itemForm.itemName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/asset-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm),
      })
      if (res.ok) {
        const newItem = await res.json()
        setShowAddItem(false)
        resetItemForm()
        fetchItems()
        // Show QR code for the new item
        setQrItem(newItem)
      } else {
        const err = await res.json()
        alert(err.error || 'Gagal menambah barang')
      }
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/asset-inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          itemName: itemForm.itemName,
          brand: itemForm.brand,
          quantity: itemForm.quantity,
          priceEGP: itemForm.priceEGP,
          exchangeRate: itemForm.exchangeRate,
          condition: itemForm.condition,
          description: itemForm.description,
          yearAcquired: itemForm.yearAcquired,
        }),
      })
      if (res.ok) {
        setEditingItem(null)
        resetItemForm()
        fetchItems()
      }
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Hapus barang inventaris ini?')) return
    try {
      const res = await fetch(`/api/asset-inventory?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchItems()
    } catch (e) { console.error(e) }
  }

  const openEditModal = (item: AssetItem) => {
    setEditingItem(item)
    setItemForm({
      floor: item.floor,
      room: typeof item.room === 'object' ? item.room.id : item.room,
      yearAcquired: item.yearAcquired,
      itemName: item.itemName,
      brand: item.brand || '',
      quantity: item.quantity,
      priceEGP: item.priceEGP,
      exchangeRate: item.exchangeRate,
      condition: item.condition,
      description: item.description || '',
    })
  }

  // Print QR label
  const printQR = (item: AssetItem) => {
    const roomData = typeof item.room === 'object' ? item.room : null
    const w = window.open('', '_blank', 'width=400,height=600')
    if (!w) return

    const canvas = document.createElement('canvas')
    QRCode.toCanvas(canvas, item.inventoryCode, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } }, () => {
      const dataUrl = canvas.toDataURL()
      w.document.write(`
        <html><head><title>Label ${item.inventoryCode}</title>
        <style>
          @page { size: 60mm 40mm; margin: 2mm; }
          body { font-family: 'Arial', sans-serif; text-align: center; padding: 4px; margin: 0; }
          .label { border: 1px dashed #ccc; padding: 8px; display: inline-block; }
          .code { font-size: 11px; font-weight: 900; letter-spacing: 1px; margin-bottom: 4px; }
          .qr { margin: 4px 0; }
          .name { font-size: 10px; font-weight: 600; margin: 2px 0; }
          .room { font-size: 9px; color: #666; }
        </style></head><body onload="window.print()">
        <div class="label">
          <div class="code">${item.inventoryCode}</div>
          <div class="qr"><img src="${dataUrl}" width="140" height="140" /></div>
          <div class="name">${item.itemName}</div>
          <div class="room">${roomData ? `LT${roomData.floor} - ${roomData.roomName}` : ''}</div>
        </div>
        </body></html>
      `)
      w.document.close()
    })
  }

  const getRoomName = (item: AssetItem) => {
    if (typeof item.room === 'object' && item.room) return item.room.roomName
    return '-'
  }

  const getRoomCode = (item: AssetItem) => {
    if (typeof item.room === 'object' && item.room) return item.room.roomCode
    return '-'
  }

  // ═══ RENDER ═══
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[280px] min-h-screen w-full lg:w-[calc(100vw-280px)] max-w-full transition-all flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* ═══ HEADER ═══ */}
          <div className="mb-6">
            <button onClick={() => router.push('/dashboard')} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4">
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-border">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-foreground tracking-tight flex items-center gap-3">
                  <Package className="text-[#8b4513]" size={32} />
                  Inventaris Aset Wisma
                </h1>
                <p className="text-slate-500 dark:text-muted-foreground mt-1 font-medium">
                  Pencatatan aset perusahaan dengan QR Code per lantai & ruangan
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddRoom(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-sm font-semibold hover:bg-slate-50 transition-colors">
                  <Building2 size={16} /> Kelola Ruangan
                </button>
                <button onClick={() => { resetItemForm(); setShowAddItem(true) }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8b4513] text-white text-sm font-bold hover:bg-[#6d350f] transition-colors shadow-sm">
                  <Plus size={18} /> Tambah Barang
                </button>
              </div>
            </div>
          </div>

          {/* ═══ SUMMARY CARDS ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Jenis Barang', value: summary.totalRecords, sub: `${summary.totalItems} unit`, icon: Package, color: '#8b4513', bg: 'bg-amber-50 dark:bg-amber-950/20' },
              { label: 'Total Nilai (EGP)', value: `EGP ${summary.totalValueEGP.toLocaleString()}`, sub: null, icon: DollarSign, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950/20' },
              { label: 'Total Nilai (IDR)', value: `Rp ${summary.totalValueIDR.toLocaleString()}`, sub: null, icon: DollarSign, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
              { label: 'Kondisi', value: `${summary.totalBaik} Baik`, sub: `${summary.totalRusak} Rusak`, icon: CheckCircle2, color: summary.totalRusak > 0 ? '#ef4444' : '#10b981', bg: summary.totalRusak > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20' },
            ].map((card, i) => (
              <div key={i} className={cn("rounded-2xl p-4 lg:p-5 border border-slate-100 dark:border-border shadow-sm", card.bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <card.icon size={18} style={{ color: card.color }} />
                  <span className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">{card.label}</span>
                </div>
                <div className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-foreground">{card.value}</div>
                {card.sub && <div className="text-xs font-medium text-slate-500 dark:text-muted-foreground mt-0.5">{card.sub}</div>}
              </div>
            ))}
          </div>

          {/* ═══ FILTERS ═══ */}
          <div className="bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama barang atau kode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted focus:outline-none focus:ring-2 focus:ring-[#8b4513]/20 focus:border-[#8b4513]/30"
                />
              </div>
              {/* Floor filter */}
              <select
                value={filterFloor}
                onChange={e => { setFilterFloor(e.target.value); setFilterRoom('') }}
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted font-medium"
              >
                <option value="">Semua Lantai</option>
                {FLOORS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              {/* Room filter */}
              <select
                value={filterRoom}
                onChange={e => setFilterRoom(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted font-medium"
              >
                <option value="">Semua Ruangan</option>
                {floorRooms.map(r => <option key={r.id} value={r.id}>{r.roomName} ({r.roomCode})</option>)}
              </select>
              {/* Condition filter */}
              <select
                value={filterCondition}
                onChange={e => setFilterCondition(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted font-medium"
              >
                <option value="">Semua Kondisi</option>
                {CONDITION_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
          </div>

          {/* ═══ TABLE ═══ */}
          <div className="bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-[#8b4513]" size={40} />
                <p className="text-slate-500 font-medium">Memuat data inventaris...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Package size={48} />
                <p className="font-semibold text-lg">Belum ada data inventaris</p>
                <p className="text-sm">Mulai dengan menambah ruangan, lalu tambahkan barang.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-muted/50 border-b border-slate-100 dark:border-border">
                      <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider">Kode</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider">Nama Barang</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Merek</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider">Qty</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Harga (EGP)</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Total (IDR)</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider">Kondisi</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Lokasi</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-600 dark:text-muted-foreground text-xs uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} className={cn("border-b border-slate-50 dark:border-border/50 hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors", idx % 2 === 0 ? '' : 'bg-slate-25')}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-[#8b4513] bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md">{item.inventoryCode}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 dark:text-foreground">{item.itemName}</div>
                          <div className="text-xs text-slate-400">{item.yearAcquired}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-muted-foreground hidden md:table-cell">{item.brand || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-foreground">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-foreground hidden lg:table-cell">
                          {item.priceEGP.toLocaleString()}
                          <div className="text-xs text-slate-400">× {item.quantity} = {item.totalValueEGP.toLocaleString()}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-foreground hidden lg:table-cell">
                          Rp {item.totalValueIDR.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-full",
                            item.condition === 'baik' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-red-50 text-red-600 dark:bg-red-950/30'
                          )}>
                            {item.condition === 'baik' ? '🟢 Baik' : '🔴 Rusak'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-xs font-semibold text-slate-600 dark:text-muted-foreground">LT{item.floor}</div>
                          <div className="text-xs text-slate-400">{getRoomName(item)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setQrItem(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-500 hover:text-[#8b4513] transition-colors" title="Lihat QR Code">
                              <QrCode size={16} />
                            </button>
                            <button onClick={() => printQR(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-500 hover:text-blue-600 transition-colors" title="Cetak Label">
                              <Printer size={16} />
                            </button>
                            <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-500 hover:text-amber-600 transition-colors" title="Edit">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors" title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ═══ ADD ITEM MODAL ═══ */}
      {(showAddItem || editingItem) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => { setShowAddItem(false); setEditingItem(null); resetItemForm() }}>
          <div className="bg-white dark:bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-border" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-card border-b border-slate-100 dark:border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-foreground flex items-center gap-2">
                <Package size={20} className="text-[#8b4513]" />
                {editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}
              </h3>
              <button onClick={() => { setShowAddItem(false); setEditingItem(null); resetItemForm() }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="p-6 space-y-4">
              {/* Floor & Room */}
              {!editingItem && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Lantai *</label>
                    <select value={itemForm.floor} onChange={e => { setItemForm({ ...itemForm, floor: Number(e.target.value), room: '' }) }} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted font-medium">
                      {FLOORS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ruangan *</label>
                    <select value={itemForm.room} onChange={e => setItemForm({ ...itemForm, room: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted font-medium" required>
                      <option value="">— Pilih Ruangan —</option>
                      {formFloorRooms.map(r => <option key={r.id} value={r.id}>{r.roomName} ({r.roomCode})</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Item Name & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nama Barang *</label>
                  <input type="text" value={itemForm.itemName} onChange={e => setItemForm({ ...itemForm, itemName: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted" placeholder="AC Split, Meja Kayu..." required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Merek</label>
                  <input type="text" value={itemForm.brand} onChange={e => setItemForm({ ...itemForm, brand: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted" placeholder="Samsung, IKEA..." />
                </div>
              </div>

              {/* Year & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tahun Pengadaan *</label>
                  <input type="number" value={itemForm.yearAcquired} onChange={e => setItemForm({ ...itemForm, yearAcquired: Number(e.target.value) })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted" min={2000} max={2100} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Jumlah *</label>
                  <input type="number" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted" min={1} required />
                </div>
              </div>

              {/* Price EGP, Exchange Rate */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Harga/Unit (EGP) *</label>
                  <input type="number" value={itemForm.priceEGP} onChange={e => setItemForm({ ...itemForm, priceEGP: Number(e.target.value) })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted" min={0} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Kurs (IDR/EGP)</label>
                  <input type="number" value={itemForm.exchangeRate} onChange={e => setItemForm({ ...itemForm, exchangeRate: Number(e.target.value) })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted" min={0} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Total (IDR)</label>
                  <div className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-100 dark:bg-muted/50 font-bold text-emerald-600">
                    Rp {(itemForm.priceEGP * itemForm.quantity * itemForm.exchangeRate).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Kondisi *</label>
                <div className="flex gap-3">
                  {CONDITION_OPTIONS.map(c => (
                    <button key={c.value} type="button" onClick={() => setItemForm({ ...itemForm, condition: c.value as any })}
                      className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all",
                        itemForm.condition === c.value
                          ? c.value === 'baik' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-200 dark:border-border text-slate-400 hover:border-slate-300'
                      )}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Keterangan</label>
                <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted resize-none" rows={2} placeholder="Catatan tambahan..." />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddItem(false); setEditingItem(null); resetItemForm() }} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-border text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#8b4513] text-white text-sm font-bold hover:bg-[#6d350f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ QR CODE MODAL ═══ */}
      {qrItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setQrItem(null)}>
          <div className="bg-white dark:bg-card rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-border text-center" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-border flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-foreground">QR Code Inventaris</h3>
              <button onClick={() => setQrItem(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block">
                <QRCodeCanvas value={qrItem.inventoryCode} size={200} />
              </div>
              <div>
                <div className="font-mono text-lg font-black text-[#8b4513] tracking-wider">{qrItem.inventoryCode}</div>
                <div className="font-bold text-slate-800 dark:text-foreground mt-1">{qrItem.itemName}</div>
                <div className="text-sm text-slate-500">
                  LT{qrItem.floor} — {typeof qrItem.room === 'object' ? qrItem.room.roomName : '-'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {qrItem.quantity} unit · EGP {qrItem.priceEGP.toLocaleString()} · {qrItem.condition === 'baik' ? '🟢 Baik' : '🔴 Rusak'}
                </div>
              </div>
              <button onClick={() => printQR(qrItem)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8b4513] text-white font-bold text-sm hover:bg-[#6d350f] transition-colors shadow-sm">
                <Printer size={16} /> Cetak Label QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD ROOM MODAL ═══ */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowAddRoom(false)}>
          <div className="bg-white dark:bg-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-border" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-card border-b border-slate-100 dark:border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-foreground flex items-center gap-2">
                <Building2 size={20} className="text-[#8b4513]" /> Kelola Ruangan
              </h3>
              <button onClick={() => setShowAddRoom(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-slate-400"><X size={20} /></button>
            </div>

            <div className="p-6">
              {/* Add Room Form */}
              <form onSubmit={handleAddRoom} className="flex gap-2 mb-6">
                <select value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: Number(e.target.value) })} className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted font-medium">
                  {FLOORS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <input type="text" value={roomForm.roomName} onChange={e => setRoomForm({ ...roomForm, roomName: e.target.value })} className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted" placeholder="Nama ruangan (Lobby, Kamar 101, Gudang...)" required />
                <button type="submit" disabled={submitting} className="px-4 py-2.5 rounded-xl bg-[#8b4513] text-white text-sm font-bold hover:bg-[#6d350f] transition-colors disabled:opacity-50">
                  <Plus size={16} />
                </button>
              </form>

              {/* Room List by Floor */}
              {FLOORS.map(floor => {
                const floorRooms = rooms.filter(r => r.floor === floor.value)
                if (floorRooms.length === 0) return null
                return (
                  <div key={floor.value} className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Layers size={14} /> {floor.label}
                      <span className="bg-slate-100 dark:bg-muted text-slate-600 px-2 py-0.5 rounded-md text-xs">{floorRooms.length} ruangan</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {floorRooms.map(room => (
                        <div key={room.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-muted/50 border border-slate-100 dark:border-border">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-[#8b4513] bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">{room.roomCode}</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-foreground">{room.roomName}</span>
                          </div>
                          <button onClick={() => handleDeleteRoom(room.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors" title="Hapus ruangan">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {rooms.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                  <Building2 size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">Belum ada ruangan</p>
                  <p className="text-sm">Tambahkan ruangan per lantai untuk mulai mencatat inventaris.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
