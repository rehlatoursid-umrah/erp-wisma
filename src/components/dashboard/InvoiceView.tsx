'use client'

import { useState, useEffect, ReactNode } from 'react'
import {
    FileText,
    Plus,
    RefreshCw,
    Hotel,
    Building2,
    Plane,
    Package,
    MoreHorizontal,
    CheckCircle,
    Clock,
    Eye,
    Banknote,
    Trash2,
    XCircle,
    Loader2
} from 'lucide-react'
import ManualInvoiceModal from '@/components/invoice/ManualInvoiceModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Transaction {
    id: string
    invoiceNo: string
    customerName: string
    totalAmount: number
    currency: string
    paymentStatus: string
    bookingType: string
    createdAt: string
    paymentMethod?: string
}

type TabType = 'all' | 'hotel' | 'auditorium' | 'visa_arrival' | 'rental' | 'manual' | 'cancellation'

interface InvoiceViewProps {
    onUpdate?: () => void
    refreshTrigger?: number
}

const TYPE_BADGE_STYLES: Record<string, string> = {
    hotel: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    auditorium: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    visa_arrival: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    rental: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    manual: 'bg-muted text-foreground border-border',
    cancellation: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800',
}

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'transfer', label: 'Transfer', icon: '🏦' },
    { value: 'qris', label: 'QRIS', icon: '📱' },
]

export default function InvoiceView({ onUpdate, refreshTrigger = 0 }: InvoiceViewProps) {
    const [invoices, setInvoices] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null)
    const [activeTab, setActiveTab] = useState<TabType>('all')

    // Payment dialog state
    const [paymentDialog, setPaymentDialog] = useState<{
        isOpen: boolean
        invoice: Transaction | null
        method: string
    }>({ isOpen: false, invoice: null, method: 'cash' })

    // Delete confirmation dialog state
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean
        invoice: Transaction | null
    }>({ isOpen: false, invoice: null })

    // Payment confirmation dialog state
    const [confirmPayment, setConfirmPayment] = useState(false)

    const fetchInvoices = async () => {
        setIsLoading(true)
        try {
            let url = '/api/finance/invoices?limit=50'
            if (activeTab !== 'all') {
                url += `&type=${activeTab}`
            }

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setInvoices(data.docs)
            }
        } catch (error) {
            console.error('Failed to fetch invoices', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [activeTab, refreshTrigger])

    // ═══ Payment Handler ═══
    const handlePayment = async () => {
        const inv = paymentDialog.invoice
        if (!inv) return

        try {
            const res = await fetch('/api/finance/invoice', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: inv.id,
                    status: 'paid',
                    paymentMethod: paymentDialog.method
                })
            })
            if (res.ok) {
                toast.success('Pembayaran berhasil dicatat', {
                    description: `Invoice #${inv.invoiceNo} — ${paymentDialog.method.toUpperCase()}`
                })
                fetchInvoices()
                if (onUpdate) onUpdate()
            } else {
                const err = await res.json()
                toast.error('Gagal mencatat pembayaran', {
                    description: err.error || 'Unknown error'
                })
            }
        } catch (e) {
            toast.error('Error system', { description: 'Tidak bisa menghubungi server' })
        } finally {
            setPaymentDialog({ isOpen: false, invoice: null, method: 'cash' })
            setConfirmPayment(false)
        }
    }

    // ═══ Delete Handler ═══
    const handleDelete = async () => {
        const inv = deleteDialog.invoice
        if (!inv) return

        try {
            const res = await fetch(`/api/finance/invoice?id=${inv.id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Invoice berhasil dihapus', {
                    description: `#${inv.invoiceNo} telah dihapus`
                })
                fetchInvoices()
                if (onUpdate) onUpdate()
            } else {
                toast.error('Gagal menghapus invoice')
            }
        } catch (e) {
            toast.error('Error system', { description: 'Tidak bisa menghubungi server' })
        } finally {
            setDeleteDialog({ isOpen: false, invoice: null })
        }
    }

    const tabs: { id: TabType, label: ReactNode, icon?: React.ComponentType<{ size?: number }> }[] = [
        { id: 'all', label: 'Semua' },
        { id: 'hotel', label: 'Hotel', icon: Hotel },
        { id: 'auditorium', label: 'Aula', icon: Building2 },
        { id: 'visa_arrival', label: 'Visa', icon: Plane },
        { id: 'rental', label: 'Rental', icon: Package },
        { id: 'manual', label: 'Lainnya', icon: MoreHorizontal },
        { id: 'cancellation', label: 'Pembatalan', icon: XCircle },
    ]

    const getTypeName = (type: string) => {
        if (type === 'visa_arrival') return 'Visa'
        if (type === 'cancellation') return 'Pembatalan'
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Manual'
    }

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold flex items-center gap-2 text-foreground font-heading">
                    <FileText size={22} className="text-primary" />
                    Daftar Invoice
                </h2>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowModal(true)}
                        size="sm"
                        className="gap-1.5"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Buat Invoice</span>
                    </Button>
                    <Button
                        onClick={fetchInvoices}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                    >
                        <RefreshCw size={16} /> <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Tab Pills */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                        )}
                    >
                        {tab.icon && <tab.icon size={14} />}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Manual Invoice Modal — preserved exactly */}
            <ManualInvoiceModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    setSelectedInvoice(null)
                }}
                onSuccess={() => {
                    fetchInvoices()
                    if (onUpdate) onUpdate()
                }}
                initialData={selectedInvoice}
            />

            {/* Table Content */}
            {isLoading ? (
                <Card>
                    <CardContent className="py-8 space-y-3">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 size={20} className="animate-spin" />
                            <span>Loading invoices...</span>
                        </div>
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0 lg:p-0">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs uppercase tracking-wider">Invoice No</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider">Tanggal</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider">Tipe</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider">Customer</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider">Total</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="text-xs uppercase tracking-wider">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                                Belum ada invoice di kategori ini.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((inv) => (
                                            <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-mono text-sm">{inv.invoiceNo}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("text-xs", TYPE_BADGE_STYLES[inv.bookingType || 'manual'])}>
                                                        {getTypeName(inv.bookingType)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{inv.customerName}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {inv.currency} {inv.totalAmount.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn("gap-1 text-xs",
                                                            inv.paymentStatus === 'paid'
                                                                ? 'text-success border-success/30 bg-success/5'
                                                                : 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                                                        )}
                                                    >
                                                        {inv.paymentStatus === 'paid' ? <><CheckCircle size={12} /> Lunas</> :
                                                            <><Clock size={12} /> Pending</>}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Preview */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            title="Preview PDF"
                                                            onClick={() => {
                                                                setSelectedInvoice(inv)
                                                                setShowModal(true)
                                                            }}
                                                        >
                                                            <Eye size={16} />
                                                        </Button>

                                                        {/* Pay */}
                                                        {inv.paymentStatus !== 'paid' && (
                                                            <Button
                                                                variant="default"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                title="Bayar"
                                                                onClick={() => setPaymentDialog({
                                                                    isOpen: true,
                                                                    invoice: inv,
                                                                    method: 'cash'
                                                                })}
                                                            >
                                                                <Banknote size={16} />
                                                            </Button>
                                                        )}

                                                        {/* Delete */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            title="Hapus Invoice"
                                                            onClick={() => setDeleteDialog({
                                                                isOpen: true,
                                                                invoice: inv
                                                            })}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col gap-3 p-3">
                            {invoices.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">
                                    Belum ada invoice di kategori ini.
                                </p>
                            ) : (
                                invoices.map((inv) => (
                                    <div key={inv.id} className="bg-muted/20 dark:bg-muted/10 rounded-xl p-3 border border-border/50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs text-primary">{inv.invoiceNo}</span>
                                            <Badge
                                                variant="outline"
                                                className={cn("text-[0.65rem] gap-0.5",
                                                    inv.paymentStatus === 'paid'
                                                        ? 'text-success border-success/30 bg-success/5'
                                                        : 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                                                )}
                                            >
                                                {inv.paymentStatus === 'paid' ? <><CheckCircle size={10} /> Lunas</> : <><Clock size={10} /> Pending</>}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{inv.customerName}</span>
                                            <span className="font-semibold text-sm text-primary">{inv.currency} {inv.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className={cn("text-[0.65rem]", TYPE_BADGE_STYLES[inv.bookingType || 'manual'])}>
                                                {getTypeName(inv.bookingType)}
                                            </Badge>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedInvoice(inv); setShowModal(true) }}>
                                                    <Eye size={14} />
                                                </Button>
                                                {inv.paymentStatus !== 'paid' && (
                                                    <Button variant="default" size="icon" className="h-7 w-7" onClick={() => setPaymentDialog({ isOpen: true, invoice: inv, method: 'cash' })}>
                                                        <Banknote size={14} />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ isOpen: true, invoice: inv })}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══ PAYMENT METHOD DIALOG ═══ */}
            <Dialog
                open={paymentDialog.isOpen}
                onOpenChange={(open) => !open && setPaymentDialog({ isOpen: false, invoice: null, method: 'cash' })}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
                        <DialogDescription>
                            Invoice <span className="font-mono text-primary">#{paymentDialog.invoice?.invoiceNo}</span>
                            <br />
                            <span className="font-semibold">{paymentDialog.invoice?.currency} {paymentDialog.invoice?.totalAmount?.toLocaleString()}</span>
                            {' — '}{paymentDialog.invoice?.customerName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-3 py-4">
                        {PAYMENT_METHODS.map((pm) => (
                            <button
                                key={pm.value}
                                onClick={() => setPaymentDialog(prev => ({ ...prev, method: pm.value }))}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                    paymentDialog.method === pm.value
                                        ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                                )}
                            >
                                <span className="text-2xl">{pm.icon}</span>
                                <span className={cn("text-sm font-medium",
                                    paymentDialog.method === pm.value ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {pm.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPaymentDialog({ isOpen: false, invoice: null, method: 'cash' })}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                setPaymentDialog(prev => ({ ...prev, isOpen: false }))
                                setConfirmPayment(true)
                            }}
                        >
                            Konfirmasi →
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ PAYMENT CONFIRMATION ALERT ═══ */}
            <AlertDialog open={confirmPayment} onOpenChange={setConfirmPayment}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Pembayaran</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>Anda akan mencatat pembayaran untuk:</p>
                                <div className="bg-muted/60 dark:bg-muted rounded-lg p-3 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Invoice</span>
                                        <span className="font-mono font-medium text-foreground">#{paymentDialog.invoice?.invoiceNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Jumlah</span>
                                        <span className="font-semibold text-primary">
                                            {paymentDialog.invoice?.currency} {paymentDialog.invoice?.totalAmount?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Metode</span>
                                        <span className="font-medium text-foreground uppercase">{paymentDialog.method}</span>
                                    </div>
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setConfirmPayment(false)
                            setPaymentDialog(prev => ({ ...prev, isOpen: true }))
                        }}>
                            Kembali
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handlePayment}>
                            Ya, Bayar Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ═══ DELETE CONFIRMATION ALERT ═══ */}
            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, invoice: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>⚠️ Hapus Invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus invoice{' '}
                            <span className="font-mono font-medium text-foreground">#{deleteDialog.invoice?.invoiceNo}</span>?
                            <br />
                            <span className="text-destructive font-medium">Data tidak dapat dikembalikan.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
