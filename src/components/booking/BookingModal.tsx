'use client'

import { useState, useEffect } from 'react'

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: BookingData) => void
    type: 'hotel' | 'aula' | 'visa' | 'rental'
    selectedDate?: Date
    roomId?: string
}

interface BookingData {
    customerName: string
    customerWA: string
    type: string
    startDate: string
    endDate?: string
    roomId?: string
    itemId?: string
    notes: string
}

export default function BookingModal({
    isOpen,
    onClose,
    onSubmit,
    type,
    selectedDate,
    roomId
}: BookingModalProps) {
    const [formData, setFormData] = useState<BookingData>({
        customerName: '',
        customerWA: '',
        type: type,
        startDate: selectedDate?.toISOString().split('T')[0] || '',
        endDate: '',
        roomId: roomId || '',
        notes: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (selectedDate) {
            setFormData(prev => ({
                ...prev,
                startDate: selectedDate.toISOString().split('T')[0]
            }))
        }
    }, [selectedDate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        onSubmit(formData)
        setIsSubmitting(false)
        onClose()

        // Reset form
        setFormData({
            customerName: '',
            customerWA: '',
            type: type,
            startDate: '',
            endDate: '',
            roomId: '',
            notes: '',
        })
    }

    const getTitle = () => {
        switch (type) {
            case 'hotel': return '🛏️ Book Hotel Room'
            case 'aula': return '🏢 Book Auditorium'
            case 'visa': return '✈️ Add Visa Inquiry'
            case 'rental': return '📦 Rent Equipment'
            default: return 'New Booking'
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay open" onClick={onClose}>
            <div className="modal booking-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{getTitle()}</h3>
                    <button className="btn btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nama Customer *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Nama lengkap"
                                value={formData.customerName}
                                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">WhatsApp *</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="+62xxx atau +20xxx"
                                value={formData.customerWA}
                                onChange={e => setFormData({ ...formData, customerWA: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Tanggal Mulai *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        {(type === 'hotel' || type === 'aula' || type === 'rental') && (
                            <div className="form-group">
                                <label className="form-label">Tanggal Selesai</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {type === 'hotel' && (
                        <div className="form-group">
                            <label className="form-label">Pilih Kamar</label>
                            <select
                                className="form-input"
                                value={formData.roomId}
                                onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                            >
                                <option value="">-- Pilih Kamar --</option>
                                <option value="101">101 - Standard (EGP 300/night)</option>
                                <option value="102">102 - Standard (EGP 300/night)</option>
                                <option value="103">103 - Deluxe (EGP 450/night)</option>
                                <option value="104">104 - Suite (EGP 600/night)</option>
                            </select>
                        </div>
                    )}

                    {type === 'rental' && (
                        <div className="form-group">
                            <label className="form-label">Pilih Equipment</label>
                            <select
                                className="form-input"
                                value={formData.itemId}
                                onChange={e => setFormData({ ...formData, itemId: e.target.value })}
                            >
                                <option value="">-- Pilih Item --</option>
                                <option value="projector">Projector (EGP 100/day)</option>
                                <option value="sound">Sound System (EGP 150/day)</option>
                                <option value="chairs">Kursi Lipat x50 (EGP 50/day)</option>
                                <option value="tent">Tenda (EGP 200/day)</option>
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Catatan</label>
                        <textarea
                            className="form-input"
                            placeholder="Catatan tambahan..."
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Batal
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? '⏳ Memproses...' : '✓ Simpan & Kirim Invoice'}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
        .booking-modal {
          max-width: 500px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(139, 69, 19, 0.1);
        }

        textarea.form-input {
          resize: vertical;
        }

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    )
}
