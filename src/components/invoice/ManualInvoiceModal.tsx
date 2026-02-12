'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ManualInvoiceModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: any // Optional: for viewing/editing existing invoice
}

interface InvoiceItem {
    id: string
    itemName: string
    quantity: number
    priceUnit: number
    total: number
}

// Mock Salespeople
const SALES_PEOPLE = [
    { id: 'S001', name: 'Ahmad Fauzi' },
    { id: 'S002', name: 'Siti Aminah' },
    { id: 'S003', name: 'Budi Santoso' },
    { id: 'S004', name: 'Dewi Lestari' }
]

export default function ManualInvoiceModal({ isOpen, onClose, onSuccess, initialData }: ManualInvoiceModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')

    // Form State
    const [customerName, setCustomerName] = useState('')
    const [customerWA, setCustomerWA] = useState('')
    const [customerNotes, setCustomerNotes] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [salesperson, setSalesperson] = useState('')
    const [bookingType, setBookingType] = useState('manual')

    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', itemName: '', quantity: 1, priceUnit: 0, total: 0 }
    ])

    const [currency, setCurrency] = useState('EGP')
    const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')
    const [discountValue, setDiscountValue] = useState(0)
    const [paymentReceived, setPaymentReceived] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('cash')

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Initialize Data or Generate Order Number
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Populate from existing invoice
                setOrderNumber(initialData.invoiceNo || '')
                setCustomerName(initialData.customerName || '')
                setCustomerWA(initialData.customerWA || '')
                setCustomerNotes(initialData.notes || '')
                setInvoiceDate(initialData.invoiceDate ? new Date(initialData.invoiceDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
                setSalesperson(initialData.salesperson || '')
                setBookingType(initialData.bookingType || 'manual')
                setCurrency(initialData.currency || 'EGP')

                if (initialData.items && Array.isArray(initialData.items)) {
                    setItems(initialData.items.map((i: any, idx: number) => ({
                        id: i.id || idx.toString(),
                        itemName: i.itemName,
                        quantity: i.quantity,
                        priceUnit: i.priceUnit,
                        total: i.subtotal
                    })))
                }

                setDiscountValue(initialData.discount || 0)
                setPaymentReceived(initialData.paymentStatus === 'paid')
                setPaymentMethod(initialData.paymentMethod || 'cash')
            } else {
                // Reset for new invoice
                const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
                setOrderNumber(`INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomId}`)
                setCustomerName('')
                setCustomerWA('')
                setCustomerNotes('')
                setItems([{ id: '1', itemName: '', quantity: 1, priceUnit: 0, total: 0 }])
                setDiscountValue(0)
                setPaymentReceived(false)
            }
        }
    }, [isOpen, initialData])

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const discountAmount = discountType === 'amount'
        ? discountValue
        : (subtotal * discountValue / 100)
    const grandTotal = Math.max(0, subtotal - discountAmount)

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items]
        const item = { ...newItems[index], [field]: value }

        // Auto-calc total
        if (field === 'quantity' || field === 'priceUnit') {
            item.total = Number(item.quantity) * Number(item.priceUnit)
        }

        newItems[index] = item
        setItems(newItems)
    }

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), itemName: '', quantity: 1, priceUnit: 0, total: 0 }])
    }

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!paymentReceived) {
            alert('❌ Mohon konfirmasi penerimaan pembayaran.')
            return
        }
        setIsLoading(true)

        try {
            const res = await fetch('/api/finance/invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceNo: orderNumber,
                    customerName,
                    customerWA: customerWA || '-',
                    items: items.map(i => ({
                        itemName: i.itemName,
                        quantity: i.quantity,
                        priceUnit: i.priceUnit,
                        subtotal: i.total
                    })),
                    totalAmount: grandTotal,
                    subtotal: subtotal,
                    discount: discountAmount,
                    currency,
                    notes: customerNotes,
                    salesperson,
                    invoiceDate,
                    paymentStatus: 'paid', // Validated by checkbox
                    paymentMethod: paymentReceived ? paymentMethod : undefined,
                    bookingType: bookingType
                })
            })

            if (res.ok) {
                alert('✅ Invoice berhasil disimpan!')
                onSuccess()
                onClose()
            } else {
                const errData = await res.json();
                console.error('Save Error:', errData);
                alert('❌ Error: ' + (errData.details || errData.error || 'Unknown error'))
            }
        } catch (error: any) {
            console.error(error)
            alert('❌ System Error: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!mounted || !isOpen) return null

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999, // Super high z-index
            backdropFilter: 'blur(4px)',
            visibility: 'visible', // Ensure visibility overrides any global css
            opacity: 1 // Ensure opacity
        }} className="manual-invoice-overlay">
            <div className="manual-invoice-modal">
                <div className="modal-header">
                    <h3>🧾 New Invoice</h3>
                    <div className="header-actions">
                        <span className="order-number">{orderNumber}</span>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Top Definition Section */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Invoice Type</label>
                            <select
                                required
                                className="form-input"
                                value={bookingType}
                                onChange={e => setBookingType(e.target.value)}
                                style={{ fontWeight: 'bold', color: '#2563eb' }}
                            >
                                <option value="manual">General / Lainnya</option>
                                <option value="hotel">🏨 Hotel</option>
                                <option value="auditorium">🎤 Auditorium / Aula</option>
                                <option value="visa_arrival">✈️ Visa</option>
                                <option value="rental">🚗 Rental</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Customer Name</label>
                            <input
                                required
                                className="form-input"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="e.g. Abdullah"
                            />
                        </div>
                        <div className="form-group">
                            <label>WhatsApp (Required)</label>
                            <input
                                required
                                type="tel"
                                className="form-input"
                                value={customerWA}
                                onChange={e => setCustomerWA(e.target.value)}
                                placeholder="+62..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Salesperson</label>
                            <select
                                required
                                className="form-input"
                                value={salesperson}
                                onChange={e => setSalesperson(e.target.value)}
                            >
                                <option value="">Select Staff</option>
                                {SALES_PEOPLE.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '15px' }}>
                        <div className="form-group">
                            <label>Invoice Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={invoiceDate}
                                onChange={e => setInvoiceDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Currency</label>
                            <select
                                className="form-input"
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                            >
                                <option value="EGP">EGP</option>
                                <option value="USD">USD</option>
                                <option value="IDR">IDR</option>
                            </select>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="items-section">
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40%' }}>Item Details</th>
                                    <th style={{ width: '15%' }}>Qty</th>
                                    <th style={{ width: '20%' }}>Price</th>
                                    <th style={{ width: '20%' }}>Amount</th>
                                    <th style={{ width: '5%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                className="table-input"
                                                value={item.itemName}
                                                onChange={e => updateItem(idx, 'itemName', e.target.value)}
                                                placeholder="Service or Item name"
                                                required
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number" min="1"
                                                className="table-input"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number" min="0"
                                                className="table-input"
                                                value={item.priceUnit}
                                                onChange={e => updateItem(idx, 'priceUnit', Number(e.target.value))}
                                            />
                                        </td>
                                        <td>
                                            <div className="amount-display">
                                                {item.total.toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <button type="button" onClick={() => removeItem(idx)} className="delete-row-btn">×</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={addItem} className="add-item-btn">+ Add Line Item</button>
                    </div>

                    {/* Footer Calculations */}
                    <div className="footer-grid">
                        <div className="notes-section">
                            <label>Customer Notes</label>
                            <textarea
                                className="form-textarea"
                                rows={3}
                                value={customerNotes}
                                onChange={e => setCustomerNotes(e.target.value)}
                                placeholder="Additional notes..."
                            />
                        </div>
                        <div className="totals-section">
                            <div className="total-row">
                                <span>Sub Total</span>
                                <span>{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="total-row">
                                <span>Discount</span>
                                <div className="discount-input-group">
                                    <input
                                        type="number"
                                        className="tiny-input"
                                        value={discountValue}
                                        onChange={e => setDiscountValue(Number(e.target.value))}
                                    />
                                    <select
                                        className="tiny-select"
                                        value={discountType}
                                        onChange={e => setDiscountType(e.target.value as any)}
                                    >
                                        <option value="amount">{currency}</option>
                                        <option value="percent">%</option>
                                    </select>
                                </div>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total</span>
                                <span>{currency} {grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="final-actions">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={paymentReceived}
                                onChange={e => setPaymentReceived(e.target.checked)}
                            />
                            I have received the payment
                        </label>

                        {paymentReceived && (
                            <select
                                className="form-input"
                                style={{ width: 'auto', marginLeft: '10px' }}
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                            >
                                <option value="cash">💵 Cash</option>
                                <option value="transfer">🏦 Transfer</option>
                                <option value="instapay">📱 Instapay</option>
                                <option value="qris">💳 QRIS</option>
                            </select>
                        )}

                        <div className="buttons">
                            <button type="button" className="action-btn preview" onClick={() => window.print()}>
                                {initialData ? '🖨️ Cetak PDF' : '🖨️ Preview / Print'}
                            </button>
                            {!initialData && (
                                <button type="submit" disabled={isLoading} className="action-btn save">
                                    {isLoading ? 'Saving...' : '💾 Save Invoice'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .manual-invoice-modal {
                    background: white;
                    width: 95%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    position: relative; 
                    z-index: 1000000;
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8fafc;
                    border-radius: 12px 12px 0 0;
                }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .order-number {
                    background: #e2e8f0;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #475569;
                }
                .close-btn {
                    background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;
                }
                
                .modal-body {
                    padding: 20px;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .form-group label {
                    display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 5px;
                }
                .form-input {
                    width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;
                }

                .items-table {
                    width: 100%; border-collapse: collapse; margin-bottom: 15px;
                }
                .items-table th {
                    text-align: left; padding: 8px; background: #f1f5f9; font-size: 0.85rem; color: #475569;
                }
                .items-table td {
                    padding: 8px; border-bottom: 1px solid #f1f5f9;
                }
                .table-input {
                    width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;
                }
                .amount-display {
                    padding: 6px; background: #f8fafc; text-align: right; border-radius: 4px; font-weight: 500;
                }
                .delete-row-btn {
                    color: #ef4444; background: none; border: none; font-size: 1.2rem; cursor: pointer;
                }
                .add-item-btn {
                    background: #f1f5f9; color: #475569; border: 1px dashed #cbd5e1;
                    width: 100%; padding: 8px; border-radius: 6px; cursor: pointer;
                    font-size: 0.9rem; transition: all 0.2s;
                }
                .add-item-btn:hover { background: #e2e8f0; color: #1e293b; }

                .footer-grid {
                    display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-top: 20px;
                }
                .form-textarea {
                    width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; resize: vertical;
                }
                .total-row {
                    display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
                    font-size: 0.9rem; color: #64748b;
                }
                .grand-total {
                    font-size: 1.2rem; font-weight: 700; color: #1e293b; border-top: 2px solid #e2e8f0; padding-top: 10px;
                }
                .discount-input-group {
                    display: flex; gap: 5px;
                }
                .tiny-input { width: 60px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: right; }
                .tiny-select { padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; }

                .final-actions {
                    margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .checkbox-label {
                    display: flex; align-items: center; gap: 10px; font-weight: 500; color: #1e293b; cursor: pointer;
                }
                .checkbox-label input { width: 18px; height: 18px; accent-color: #2563eb; }
                
                .buttons { display: flex; gap: 10px; }
                .action-btn {
                    padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none;
                }
                .preview { background: #f1f5f9; color: #475569; }
                .save { background: #2563eb; color: white; }
                .save:disabled { background: #94a3b8; cursor: not-allowed; }

                @media print {
                    .manual-invoice-overlay {
                        background: white !important;
                        position: fixed;
                        inset: 0;
                        z-index: 9999999;
                        visibility: visible !important;
                    }
                    .manual-invoice-modal {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: none;
                        box-shadow: none;
                        border: none;
                        visibility: visible !important;
                    }
                     /* Hide everything else */
                    :global(body > *:not(.manual-invoice-overlay)) {
                        display: none !important;
                    }
                    .close-btn, .final-actions, .add-item-btn, .delete-row-btn {
                        display: none !important;
                    }
                    .form-input, .tiny-input, .tiny-select, select, textarea {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                        appearance: none;
                    }
                     .items-table th {
                        background-color: #f1f5f9 !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>,
        document.body
    )
}
