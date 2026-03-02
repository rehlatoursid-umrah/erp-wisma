'use client'

import { useState, useMemo } from 'react'
import {
  HALL_PACKAGES,
  AFTER_HOURS_RATE,
  EXTRA_HOUR_RATE,
  AC_OPTIONS,
  CHAIR_OPTIONS,
  PROJECTOR_SCREEN_OPTIONS,
  TABLE_OPTIONS,
  PLATE_OPTIONS,
  GLASS_OPTIONS,
  calculateDuration,
  calculateAfterHours,
  calculateHallPricing
} from '@/constants/auditorium'

export interface AuditoriumBookingData {
  // Personal Information
  fullName: string
  countryOfOrigin: string
  // Event Details
  eventName: string
  eventDate: string
  startTime: string
  endTime: string
  // Contact Information
  phoneEgypt: string
  whatsappEgypt: string
  // Hall Rental (auto-calculated)
  hallPackage: string
  duration: number
  afterHoursCount: number
  // Additional Services
  acOption: string
  chairOption: string
  projectorScreen: string
  tableOption: string
  plateOption: string
  glassOption: string
  // Calculated prices
  hallRentalPrice: number
  afterHoursPrice: number
  servicesPrice: number
  totalPrice: number
}

interface AuditoriumBookingFormProps {
  initialDate?: string
  onSubmit: (data: AuditoriumBookingData) => Promise<void>
  onCancel?: () => void
  isModal?: boolean
}

// Constants and helper functions are now imported from @/constants/auditorium

export default function AuditoriumBookingForm({
  initialDate = '',
  onSubmit,
  onCancel,
  isModal = false,
}: AuditoriumBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    countryOfOrigin: '',
    eventName: '',
    eventDate: initialDate,
    startTime: '09:00',
    endTime: '13:00',
    phoneEgypt: '',
    whatsappEgypt: '',
    acOption: '',
    chairOption: '',
    projectorScreen: '',
    tableOption: '',
    plateOption: '',
    glassOption: '',
  })

  // Calculate all prices automatically
  const pricing = useMemo(() => {
    const duration = calculateDuration(formData.startTime, formData.endTime)
    const afterHoursCount = calculateAfterHours(formData.startTime, formData.endTime)

    // Hall rental: base package + extra hours
    const hallPricing = calculateHallPricing(duration)
    const basePackagePrice = hallPricing.basePrice
    const extraHoursPrice = hallPricing.extraHoursPrice
    const extraHours = hallPricing.extraHours

    // After-hours surcharge (22:00-07:00) - added on top
    const afterHoursPrice = afterHoursCount * AFTER_HOURS_RATE

    // Total hall rental = base + extra hours + after-hours surcharge
    const hallRentalPrice = basePackagePrice + extraHoursPrice + afterHoursPrice

    // Additional services
    const acOption = AC_OPTIONS.find(o => o.value === formData.acOption)
    const chairOption = CHAIR_OPTIONS.find(o => o.value === formData.chairOption)
    const projectorOption = PROJECTOR_SCREEN_OPTIONS.find(o => o.value === formData.projectorScreen)
    const tableOption = TABLE_OPTIONS.find(o => o.value === formData.tableOption)
    const plateOption = PLATE_OPTIONS.find(o => o.value === formData.plateOption)
    const glassOption = GLASS_OPTIONS.find(o => o.value === formData.glassOption)

    const acPrice = acOption?.price || 0
    const chairPrice = chairOption?.price || 0
    const projectorPrice = projectorOption?.price || 0
    const tablePrice = tableOption?.price || 0
    const platePrice = plateOption?.price || 0
    const glassPrice = glassOption?.price || 0
    const servicesPrice = acPrice + chairPrice + projectorPrice + tablePrice + platePrice + glassPrice

    // Build itemized services list
    const serviceItems: { label: string; price: number; icon: string }[] = []
    if (acPrice > 0) serviceItems.push({ label: acOption!.label, price: acPrice, icon: '❄️' })
    if (chairPrice > 0) serviceItems.push({ label: chairOption!.label, price: chairPrice, icon: '🪑' })
    if (projectorPrice > 0) serviceItems.push({ label: projectorOption!.label, price: projectorPrice, icon: '📽️' })
    if (tablePrice > 0) serviceItems.push({ label: tableOption!.label, price: tablePrice, icon: '🪑' })
    if (platePrice > 0) serviceItems.push({ label: plateOption!.label, price: platePrice, icon: '🍽️' })
    if (glassPrice > 0) serviceItems.push({ label: glassOption!.label, price: glassPrice, icon: '🥛' })

    const totalPrice = hallRentalPrice + servicesPrice

    return {
      duration,
      afterHoursCount,
      selectedPackage: hallPricing.basePackage,
      basePackagePrice,
      extraHours,
      extraHoursPrice,
      afterHoursPrice,
      hallRentalPrice,
      servicesPrice,
      serviceItems,
      totalPrice,
    }
  }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Auto-prefix Egypt phone numbers with +20
    if (name === 'phoneEgypt' || name === 'whatsappEgypt') {
      let val = value
      // Remove any non-numeric characters (except the plus if it's there)
      val = val.replace(/[^\d+]/g, '')

      if (val === '') {
        setFormData(prev => ({ ...prev, [name]: '' }))
        return
      }

      if (!val.startsWith('+20')) {
        // If they start typing 01x, replace 0 with +20 or prefix +20
        if (val.startsWith('0')) {
          val = '+20' + val.substring(1)
        } else if (!val.startsWith('+')) {
          val = '+20' + val
        }
      }
      setFormData(prev => ({ ...prev, [name]: val }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pricing.duration < 1) {
      alert('Please select valid start and end times')
      return
    }
    if (pricing.duration > 14) {
      alert('Maximum booking duration is 14 hours. Please contact admin for longer events.')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        hallPackage: pricing.selectedPackage?.value || '',
        duration: pricing.duration,
        afterHoursCount: pricing.afterHoursCount,
        hallRentalPrice: pricing.hallRentalPrice,
        afterHoursPrice: pricing.afterHoursPrice,
        servicesPrice: pricing.servicesPrice,
        totalPrice: pricing.totalPrice,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPriceOption = (option: { value: string; label: string; price: number }) => (
    <option key={option.value} value={option.value}>
      {option.label}{option.price > 0 ? ` - ${option.price} EGP` : ''}
    </option>
  )

  return (
    <form onSubmit={handleSubmit} className="booking-form">

      <div className="form-grid">
        {/* Left Column - Personal & Event Details */}
        <div className="form-column">
          {/* Personal Information */}
          <div className="bento-panel">
            <div className="panel-header">
              <span className="panel-icon">👤</span>
              <h3>Personal Information</h3>
            </div>
            <div className="panel-content">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  className="premium-input"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country of Origin *</label>
                <input
                  type="text"
                  name="countryOfOrigin"
                  className="premium-input"
                  placeholder="e.g., Indonesia, Egypt, etc."
                  value={formData.countryOfOrigin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bento-panel">
            <div className="panel-header">
              <span className="panel-icon">🎉</span>
              <h3>Event Details</h3>
            </div>
            <div className="panel-content">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  name="eventName"
                  className="premium-input"
                  placeholder="e.g., Wedding Reception, Seminar, etc."
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  name="eventDate"
                  className="premium-input date-input"
                  value={formData.eventDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Start Time *</label>
                  <select
                    name="startTime"
                    className="premium-input select-input"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>
                        {h.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <select
                    name="endTime"
                    className="premium-input select-input"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>
                        {h.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration Info */}
              {pricing.duration > 0 && (
                <div className="duration-info-box">
                  <div className="duration-primary">
                    <span className="info-icon">⏱️</span>
                    <strong>{pricing.duration} hour{pricing.duration > 1 ? 's' : ''}</strong> Duration
                  </div>
                  {pricing.afterHoursCount > 0 && (
                    <div className="duration-secondary">
                      <span className="info-icon">🌙</span>
                      {pricing.afterHoursCount}h after-hours (22:00-08:00)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bento-panel">
            <div className="panel-header">
              <span className="panel-icon">📞</span>
              <h3>Contact Information</h3>
            </div>
            <div className="panel-content">
              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Phone Number (Egypt) *</label>
                  <input
                    type="tel"
                    name="phoneEgypt"
                    className="premium-input"
                    placeholder="+20 1xxxxxxxxx"
                    value={formData.phoneEgypt}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number (Egypt) *</label>
                  <input
                    type="tel"
                    name="whatsappEgypt"
                    className="premium-input"
                    placeholder="+20 1xxxxxxxxx"
                    value={formData.whatsappEgypt}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Services & Price Summary */}
        <div className="form-column">

          {/* Additional Services */}
          <div className="bento-panel services-panel">
            <div className="panel-header">
              <span className="panel-icon">⚙️</span>
              <div>
                <h3>Additional Services</h3>
                <p className="panel-subtitle">Select services. All prices in EGP.</p>
              </div>
            </div>

            <div className="services-grid">
              <div className="service-group">
                <label>❄️ Air Conditioning</label>
                <div className="select-wrapper">
                  <select name="acOption" className="premium-select" value={formData.acOption} onChange={handleChange}>
                    {AC_OPTIONS.map(renderPriceOption)}
                  </select>
                </div>
              </div>

              <div className="service-group">
                <label>📽️ Projector & Screen</label>
                <div className="select-wrapper">
                  <select name="projectorScreen" className="premium-select" value={formData.projectorScreen} onChange={handleChange}>
                    {PROJECTOR_SCREEN_OPTIONS.map(renderPriceOption)}
                  </select>
                </div>
              </div>

              <div className="service-group">
                <label>🪑 Chairs</label>
                <div className="select-wrapper">
                  <select name="chairOption" className="premium-select" value={formData.chairOption} onChange={handleChange}>
                    {CHAIR_OPTIONS.map(renderPriceOption)}
                  </select>
                </div>
              </div>

              <div className="service-group">
                <label>🪑 Tables</label>
                <div className="select-wrapper">
                  <select name="tableOption" className="premium-select" value={formData.tableOption} onChange={handleChange}>
                    {TABLE_OPTIONS.map(renderPriceOption)}
                  </select>
                </div>
              </div>

              <div className="service-group">
                <label>🍽️ Plates</label>
                <div className="select-wrapper">
                  <select name="plateOption" className="premium-select" value={formData.plateOption} onChange={handleChange}>
                    {PLATE_OPTIONS.map(renderPriceOption)}
                  </select>
                </div>
              </div>

              <div className="service-group">
                <label>🥛 Glasses</label>
                <div className="select-wrapper">
                  <select name="glassOption" className="premium-select" value={formData.glassOption} onChange={handleChange}>
                    {GLASS_OPTIONS.map(renderPriceOption)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary Receipt */}
          <div className="receipt-panel">
            <div className="receipt-header">
              <h3>Receipt Summary</h3>
              <div className="receipt-divider"></div>
            </div>

            <div className="receipt-body">
              <div className="receipt-line primary">
                <span className="label">🏛️ Base Package ({pricing.selectedPackage?.label || '-'})</span>
                <span className="value">{pricing.basePackagePrice} EGP</span>
              </div>

              {pricing.extraHours > 0 && (
                <div className="receipt-line warning">
                  <span className="label">⏰ Extra Hours ({pricing.extraHours}h × {EXTRA_HOUR_RATE})</span>
                  <span className="value">+{pricing.extraHoursPrice} EGP</span>
                </div>
              )}

              {pricing.afterHoursPrice > 0 && (
                <div className="receipt-line danger">
                  <span className="label">🌙 After Hours ({pricing.afterHoursCount}h × {AFTER_HOURS_RATE})</span>
                  <span className="value">+{pricing.afterHoursPrice} EGP</span>
                </div>
              )}

              <div className="receipt-line subtotal">
                <span className="label">Hall Rental Total</span>
                <span className="value">{pricing.hallRentalPrice} EGP</span>
              </div>

              {pricing.serviceItems.length > 0 && (
                <div className="receipt-services">
                  <div className="services-title">Additional Services</div>
                  {pricing.serviceItems.map((item, i) => (
                    <div key={i} className="receipt-line secondary">
                      <span className="label">{item.icon} {item.label}</span>
                      <span className="value">+{item.price} EGP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="receipt-footer">
              <div className="receipt-divider dashed"></div>
              <div className="receipt-total">
                <span>Grand Total</span>
                <div className="total-amount">
                  <span className="currency">EGP</span>
                  <span className="number">{pricing.totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <p className="receipt-note">* Price is auto-calculated based on duration</p>
            </div>
          </div>

          <div className="form-actions-premium">
            {onCancel && (
              <button type="button" className="premium-btn ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </button>
            )}
            <button type="submit" className="premium-btn primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-mini"></span>
                  Processing...
                </>
              ) : (
                <>Confirm Reservation <span>→</span></>
              )}
            </button>
          </div>

          <p className="secure-note">
            🔒 Confirmation will be sent securely to WhatsApp
          </p>
        </div>
      </div>

      <style jsx>{`
        .booking-form {
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .form-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Bento Panels */
        .bento-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.75rem;
          transition: border-color 0.3s ease;
        }

        .bento-panel:focus-within {
          border-color: rgba(139, 69, 19, 0.4);
          box-shadow: 0 0 20px rgba(139, 69, 19, 0.05);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .panel-icon {
          font-size: 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #f3f4f6;
          letter-spacing: -0.01em;
        }

        .panel-subtitle {
          margin: 0.25rem 0 0 0;
          font-size: 0.85rem;
          color: #a1a1aa;
        }

        .panel-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row.two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #a1a1aa;
        }

        /* Premium Inputs */
        .premium-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.875rem 1rem;
          color: #ffffff;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .premium-input::placeholder {
          color: #52525b;
        }

        .premium-input:focus {
          outline: none;
          border-color: rgba(139, 69, 19, 0.6);
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
        }

        /* Select styling overrides using wrapper */
        .select-wrapper {
          position: relative;
        }
        
        .select-wrapper::after {
          content: '▾';
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a1a1aa;
          pointer-events: none;
          font-size: 1.2rem;
        }

        .premium-select, .select-input {
          appearance: none;
          padding-right: 2.5rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.875rem 1rem;
          color: #ffffff;
          font-size: 0.95rem;
          width: 100%;
          cursor: pointer;
        }
        
        .premium-select:focus, .select-input:focus {
          outline: none;
          border-color: rgba(139, 69, 19, 0.6);
        }

        .premium-select option, .select-input option {
          background: #18181b;
          color: #fff;
          padding: 10px;
        }

        .date-input {
          color-scheme: dark;
        }

        /* Duration Info Box */
        .duration-info-box {
          background: rgba(139, 69, 19, 0.1);
          border: 1px solid rgba(139, 69, 19, 0.2);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .duration-primary {
          color: #e5b072;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .duration-primary strong {
          color: #fff;
          font-weight: 600;
        }

        .duration-secondary {
          color: #a78bfa;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Services Grid */
        .services-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        /* Receipt Panel */
        .receipt-panel {
          background: linear-gradient(180deg, rgba(20, 20, 23, 0.8) 0%, rgba(15, 15, 17, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        .receipt-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #8B4513, #e5b072, #8B4513);
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .receipt-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #ffffff;
        }

        .receipt-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 1rem 0;
        }
        
        .receipt-divider.dashed {
          background: transparent;
          border-top: 1px dashed rgba(255, 255, 255, 0.2);
        }

        .receipt-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .receipt-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
        }

        .receipt-line.primary .label { color: #f3f4f6; }
        .receipt-line.primary .value { color: #f3f4f6; font-weight: 500; }
        
        .receipt-line.warning .label { color: #fcd34d; }
        .receipt-line.warning .value { color: #fcd34d; font-weight: 500; }
        
        .receipt-line.danger .label { color: #fca5a5; }
        .receipt-line.danger .value { color: #fca5a5; font-weight: 500; }
        
        .receipt-line.secondary .label { color: #a1a1aa; font-size: 0.85rem; }
        .receipt-line.secondary .value { color: #a1a1aa; font-size: 0.85rem; }

        .receipt-line.subtotal {
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .receipt-line.subtotal .label { color: #a1a1aa; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-line.subtotal .value { color: #ffffff; font-weight: 600; }

        .receipt-services {
          margin-top: 0.5rem;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .services-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #71717a;
          margin-bottom: 0.25rem;
        }

        .receipt-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }

        .receipt-total > span {
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
        }

        .total-amount {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .total-amount .currency {
          font-size: 1rem;
          color: #e5b072;
          font-weight: 600;
        }

        .total-amount .number {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -1px;
        }

        .receipt-note {
          text-align: center;
          font-size: 0.75rem;
          color: #52525b;
          margin: 1rem 0 0 0;
        }

        /* Actions */
        .form-actions-premium {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .premium-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.125rem 2rem;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
        }

        .premium-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .premium-btn.ghost {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .premium-btn.ghost:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .premium-btn.primary {
          background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(139, 69, 19, 0.4);
        }

        .premium-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 69, 19, 0.6);
        }

        .premium-btn.primary span {
          transition: transform 0.2s;
        }

        .premium-btn.primary:hover:not(:disabled) span {
          transform: translateX(4px);
        }

        .secure-note {
          text-align: center;
          font-size: 0.85rem;
          color: #71717a;
          margin: 0;
        }

        .spinner-mini {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 600px) {
          .form-row.two-cols {
            grid-template-columns: 1fr;
          }
          .services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  )
}
