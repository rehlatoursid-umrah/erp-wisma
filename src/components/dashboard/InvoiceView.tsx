'use client'

import { useState, useEffect } from 'react'
import ManualInvoiceModal from '@/components/invoice/ManualInvoiceModal'

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

type TabType = 'all' | 'hotel' | 'auditorium' | 'visa_arrival' | 'rental' | 'manual'

interface InvoiceViewProps {
    onUpdate?: () => void
    refreshTrigger?: number
}

export default function InvoiceView({ onUpdate, refreshTrigger = 0 }: InvoiceViewProps) {
    const [invoices, setInvoices] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null)
    const [activeTab, setActiveTab] = useState<TabType>('all')

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

    const tabs: { id: TabType, label: string }[] = [
        { id: 'all', label: 'Semua' },
        { id: 'hotel', label: '🏨 Hotel' },
        { id: 'auditorium', label: '🎤 Aula' },
        { id: 'visa_arrival', label: '✈️ Visa' },
        { id: 'rental', label: '🚗 Rental' },
        { id: 'manual', label: '📄 Lainnya' },
    ]

    return (
        <div className="invoice-view">
            <div className="header-actions">
                <h2>📑 Daftar Invoice</h2>
                <div className="action-buttons">
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        ➕ Buat Invoice
                    </button>
                    <button
                        onClick={fetchInvoices}
                        className="btn-refresh"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div className="tabs-container">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <ManualInvoiceModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    setSelectedInvoice(null) // Reset on close
                }}
                onSuccess={() => {
                    fetchInvoices()
                    if (onUpdate) onUpdate()
                }}
                initialData={selectedInvoice}
            />

            {isLoading ? (
                <div className="loading-state">⏳ Loading invoices...</div>
            ) : (
                <div className="table-container">
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Tanggal</th>
                                <th>Tipe</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="empty-state">Belum ada invoice di kategori ini.</td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td>{inv.invoiceNo}</td>
                                        <td>{new Date(inv.createdAt).toLocaleDateString('id-ID')}</td>
                                        <td>
                                            <span className={`badge type-${inv.bookingType || 'manual'}`}>
                                                {inv.bookingType === 'visa_arrival' ? 'Visa' :
                                                    inv.bookingType ? inv.bookingType.charAt(0).toUpperCase() + inv.bookingType.slice(1) : 'Manual'}
                                            </span>
                                        </td>
                                        <td>{inv.customerName}</td>
                                        <td>{inv.currency} {inv.totalAmount.toLocaleString()}</td>
                                        <td>
                                            <span className={`badge status-${inv.paymentStatus}`}>
                                                {inv.paymentStatus === 'paid' ? '✅ Lunas' :
                                                    inv.paymentStatus === 'pending' ? '⏳ Pending' : inv.paymentStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-row">
                                                {/* Preview / Print */}
                                                <button
                                                    className="btn-icon-action"
                                                    title="Preview PDF"
                                                    onClick={() => {
                                                        setSelectedInvoice(inv)
                                                        setShowModal(true)
                                                    }}
                                                >
                                                    📄
                                                </button>

                                                {/* Mark as Paid (only if not paid) */}
                                                {inv.paymentStatus !== 'paid' && (
                                                    <button
                                                        className="btn-pay"
                                                        title="Bayar"
                                                        onClick={async () => {
                                                            const method = prompt('Tulis metode pembayaran (cash/transfer/qris):', 'cash');
                                                            if (!method) return;

                                                            if (!confirm(`Konfirmasi pembayaran invoice #${inv.invoiceNo} dengan metode ${method}?`)) return;

                                                            try {
                                                                const res = await fetch('/api/finance/invoice', {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        id: inv.id,
                                                                        status: 'paid',
                                                                        paymentMethod: method
                                                                    })
                                                                })
                                                                if (res.ok) {
                                                                    alert('✅ Pembayaran berhasil dicatat!');
                                                                    fetchInvoices();
                                                                    if (onUpdate) onUpdate();
                                                                } else {
                                                                    const err = await res.json();
                                                                    alert('❌ Gagal: ' + (err.error || 'Unknown error'));
                                                                }
                                                            } catch (e) {
                                                                alert('❌ Error system');
                                                            }
                                                        }}
                                                    >
                                                        💰
                                                    </button>
                                                )}

                                                {/* Delete */}
                                                <button
                                                    className="btn-icon-delete"
                                                    title="Hapus Invoice"
                                                    onClick={async () => {
                                                        if (!confirm(`⚠️ Apakah Anda yakin ingin menghapus invoice #${inv.invoiceNo}?\nData tidak dapat dikembalikan.`)) return;

                                                        try {
                                                            const res = await fetch(`/api/finance/invoice?id=${inv.id}`, { method: 'DELETE' })
                                                            if (res.ok) {
                                                                alert('✅ Invoice berhasil dihapus');
                                                                fetchInvoices();
                                                                if (onUpdate) onUpdate();
                                                            } else {
                                                                alert('❌ Gagal menghapus invoice');
                                                            }
                                                        } catch (e) {
                                                            alert('❌ Error system');
                                                        }
                                                    }}
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                .action-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .btn-icon-action, .btn-icon-delete {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .btn-icon-action:hover {
                    background: #f3f4f6;
                }
                .btn-icon-delete:hover {
                    background: #fee2e2;
                }
                .header-actions {
                display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            align-items: center;
                }
            .action-buttons {
                display: flex;
            gap: 10px;
                }
            .btn-primary {
                display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: #2563eb;
            color: white;
            border: none;
            borderRadius: 6px;
            cursor: pointer;
            font-weight: 500;
            position: relative;
            z-index: 50;
            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
                }
            .btn-refresh {
                padding: 8px 16px;
            background: #f3f4f6;
            border: none;
            border-radius: 6px;
            cursor: pointer;
                }

            .tabs-container {
                display: flex;
            gap: 10px;
            margin-bottom: 20px;
            overflow-x: auto;
            padding-bottom: 5px;
                }
            .tab-btn {
                padding: 8px 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            color: #6b7280;
            white-space: nowrap;
            transition: all 0.2s;
                }
            .tab-btn:hover {
                background: #f9fafb;
                }
            .tab-btn.active {
                background: #2563eb;
            color: white;
            border-color: #2563eb;
                }

            .table-container {
                background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            overflow-x: auto;
                }
            .invoice-table {
                width: 100%;
            border-collapse: collapse;
                }
            .invoice-table th, .invoice-table td {
                padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #f3f4f6;
                }
            .invoice-table th {
                background: #f9fafb;
            font-weight: 600;
            color: #374151;
                }
            .badge {
                padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 500;
                }
            .badge.status-paid {background: #dcfce7; color: #166534; }
            .badge.status-pending {background: #fef9c3; color: #854d0e; }

            .badge.type-hotel {background: #dbeafe; color: #1e40af; }
            .badge.type-auditorium {background: #fce7f3; color: #9d174d; }
            .badge.type-visa_arrival {background: #ffedd5; color: #c2410c; }
            .badge.type-rental {background: #e0e7ff; color: #4338ca; }
            .badge.type-manual {background: #f3f4f6; color: #374151; }

            .btn-pay {
                background: #2563eb;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
                }
            .loading-state, .empty-state {
                text-align: center;
            padding: 40px;
            color: #6b7280;
                }
            `}</style>
        </div>
    )
}
