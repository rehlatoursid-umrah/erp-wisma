'use client'

import { useState } from 'react'

interface TransactionModalProps {
    isOpen: boolean
    onClose: () => void
}

type ServiceCategory = 'hotel' | 'homestay' | 'aula' | 'travel' | 'rental'

const serviceCategories = [
    { id: 'hotel', icon: '🛏️', label: 'Hotel/Homestay', desc: 'Check-in/Booking' },
    { id: 'aula', icon: '🏢', label: 'Aula', desc: 'Event Booking' },
    { id: 'travel', icon: '✈️', label: 'Travel', desc: 'Tiket/Visa Deposit' },
    { id: 'rental', icon: '📦', label: 'Rental', desc: 'Equipment Out' },
]

export default function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
    const [step, setStep] = useState(1)
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
    const [formData, setFormData] = useState({
        customerName: '',
        customerWA: '',
        selectedRoom: '',
        checkIn: '',
        checkOut: '',
        notes: '',
    })

    const handleCategorySelect = (category: ServiceCategory) => {
        setSelectedCategory(category)
        setStep(2)
    }

    const handleBack = () => {
        if (step === 2) {
            setStep(1)
            setSelectedCategory(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Submit to Payload CMS and trigger WA invoice
        console.log('Transaction:', { category: selectedCategory, ...formData })
        onClose()
        setStep(1)
        setSelectedCategory(null)
    }

    const handleClose = () => {
        onClose()
        setStep(1)
        setSelectedCategory(null)
    }

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        {step === 1 ? '🛒 New Transaction' : `${serviceCategories.find(s => s.id === selectedCategory)?.icon} ${serviceCategories.find(s => s.id === selectedCategory)?.label}`}
                    </h3>
                    <button className="btn btn-icon" onClick={handleClose}>✕</button>
                </div>

                <div className="modal-body">
                    {step === 1 && (
                        <div className="service-grid">
                            {serviceCategories.map((service) => (
                                <button
                                    key={service.id}
                                    className="service-card"
                                    onClick={() => handleCategorySelect(service.id as ServiceCategory)}
                                >
                                    <span className="service-icon">{service.icon}</span>
                                    <span className="service-name">{service.label}</span>
                                    <span className="service-desc">{service.desc}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nama Pelanggan</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nama lengkap"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nomor WhatsApp</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="+62xxx atau +20xxx"
                                    value={formData.customerWA}
                                    onChange={(e) => setFormData({ ...formData, customerWA: e.target.value })}
                                    required
                                />
                            </div>

                            {selectedCategory === 'hotel' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Pilih Kamar</label>
                                        <select
                                            className="form-input"
                                            value={formData.selectedRoom}
                                            onChange={(e) => setFormData({ ...formData, selectedRoom: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Pilih Kamar --</option>
                                            <option value="101">101 - Standard (EGP 300/night)</option>
                                            <option value="103">103 - Standard (EGP 300/night)</option>
                                            <option value="105">105 - Deluxe (EGP 450/night)</option>
                                            <option value="108">108 - Suite (EGP 600/night)</option>
                                        </select>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Check-in</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.checkIn}
                                                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Check-out</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.checkOut}
                                                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label className="form-label">Catatan (opsional)</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Catatan tambahan..."
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                                    ← Kembali
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Submit & Kirim Invoice 📤
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style jsx>{`
        .service-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }

        .service-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          border: 2px solid transparent;
        }

        .service-card:hover {
          border-color: var(--color-primary);
          background: rgba(139, 69, 19, 0.05);
          transform: translateY(-2px);
        }

        .service-icon {
          font-size: 2.5rem;
        }

        .service-name {
          font-weight: 600;
          font-size: 1rem;
        }

        .service-desc {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(139, 69, 19, 0.1);
        }

        textarea.form-input {
          resize: vertical;
        }

        @media (max-width: 480px) {
          .service-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    )
}
