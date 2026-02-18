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
    const acPrice = AC_OPTIONS.find(o => o.value === formData.acOption)?.price || 0
    const chairPrice = CHAIR_OPTIONS.find(o => o.value === formData.chairOption)?.price || 0
    const projectorPrice = PROJECTOR_SCREEN_OPTIONS.find(o => o.value === formData.projectorScreen)?.price || 0
    const tablePrice = TABLE_OPTIONS.find(o => o.value === formData.tableOption)?.price || 0
    const platePrice = PLATE_OPTIONS.find(o => o.value === formData.plateOption)?.price || 0
    const glassPrice = GLASS_OPTIONS.find(o => o.value === formData.glassOption)?.price || 0
    const servicesPrice = acPrice + chairPrice + projectorPrice + tablePrice + platePrice + glassPrice

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
      totalPrice,
    }
  }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
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
      {/* Personal Information */}
      <div className="form-section">
        <h3>👤 Personal Information</h3>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="fullName"
            className="form-input"
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
            className="form-input"
            placeholder="e.g., Indonesia, Egypt, etc."
            value={formData.countryOfOrigin}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Event Details */}
      <div className="form-section">
        <h3>🎉 Event Details</h3>
        <div className="form-group">
          <label>Event Name *</label>
          <input
            type="text"
            name="eventName"
            className="form-input"
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
            className="form-input"
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
              className="form-input time-select"
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
              className="form-input time-select"
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
          <div className="duration-info">
            <span className="duration-badge">
              ⏱️ Duration: {pricing.duration} hour{pricing.duration > 1 ? 's' : ''}
            </span>
            {pricing.afterHoursCount > 0 && (
              <span className="after-hours-badge">
                🌙 {pricing.afterHoursCount} after-hours (22:00-07:00)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="form-section">
        <h3>📞 Contact Information</h3>
        <div className="form-row two-cols">
          <div className="form-group">
            <label>Phone Number (Egypt) *</label>
            <input
              type="tel"
              name="phoneEgypt"
              className="form-input"
              placeholder="01xxxxxxxxx"
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
              className="form-input"
              placeholder="01xxxxxxxxx"
              value={formData.whatsappEgypt}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Additional Services */}
      <div className="form-section">
        <h3>⚙️ Additional Services</h3>
        <p className="section-note">Select the services you need. All prices in EGP.</p>

        <div className="form-row two-cols">
          <div className="form-group">
            <label>❄️ Air Conditioning</label>
            <select
              name="acOption"
              className="form-input"
              value={formData.acOption}
              onChange={handleChange}
            >
              {AC_OPTIONS.map(renderPriceOption)}
            </select>
          </div>
          <div className="form-group">
            <label>🪑 Chairs</label>
            <select
              name="chairOption"
              className="form-input"
              value={formData.chairOption}
              onChange={handleChange}
            >
              {CHAIR_OPTIONS.map(renderPriceOption)}
            </select>
          </div>
        </div>

        <div className="form-row two-cols">
          <div className="form-group">
            <label>📽️ Projector & Screen</label>
            <select
              name="projectorScreen"
              className="form-input"
              value={formData.projectorScreen}
              onChange={handleChange}
            >
              {PROJECTOR_SCREEN_OPTIONS.map(renderPriceOption)}
            </select>
          </div>
          <div className="form-group">
            <label>🪑 Tables</label>
            <select
              name="tableOption"
              className="form-input"
              value={formData.tableOption}
              onChange={handleChange}
            >
              {TABLE_OPTIONS.map(renderPriceOption)}
            </select>
          </div>
        </div>

        <div className="form-row two-cols">
          <div className="form-group">
            <label>🍽️ Plates</label>
            <select
              name="plateOption"
              className="form-input"
              value={formData.plateOption}
              onChange={handleChange}
            >
              {PLATE_OPTIONS.map(renderPriceOption)}
            </select>
          </div>
          <div className="form-group">
            <label>🥛 Glasses</label>
            <select
              name="glassOption"
              className="form-input"
              value={formData.glassOption}
              onChange={handleChange}
            >
              {GLASS_OPTIONS.map(renderPriceOption)}
            </select>
          </div>
        </div>
      </div>

      {/* Price Summary */}
      <div className="price-summary">
        <h3>💰 Price Summary</h3>
        <div className="price-breakdown">
          <div className="price-line">
            <span>🏛️ Base Package ({pricing.selectedPackage?.label || '-'})</span>
            <span>{pricing.basePackagePrice} EGP</span>
          </div>
          {pricing.extraHours > 0 && (
            <div className="price-line extra-hours">
              <span>⏰ Extra Hours ({pricing.extraHours}h × {EXTRA_HOUR_RATE})</span>
              <span>+{pricing.extraHoursPrice} EGP</span>
            </div>
          )}
          {pricing.afterHoursPrice > 0 && (
            <div className="price-line after-hours">
              <span>🌙 After Hours Surcharge ({pricing.afterHoursCount}h × {AFTER_HOURS_RATE})</span>
              <span>+{pricing.afterHoursPrice} EGP</span>
            </div>
          )}
          <div className="price-line subtotal">
            <span>🏛️ Hall Rental Total</span>
            <span>{pricing.hallRentalPrice} EGP</span>
          </div>
          {pricing.servicesPrice > 0 && (
            <div className="price-line">
              <span>⚙️ Additional Services</span>
              <span>{pricing.servicesPrice} EGP</span>
            </div>
          )}
          <div className="price-line total">
            <span>Total</span>
            <span className="price-value">{pricing.totalPrice} EGP</span>
          </div>
        </div>
        <p className="price-note">* Price is calculated automatically based on your booking duration</p>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '⏳ Processing...' : '✓ Submit Reservation'}
        </button>
      </div>

      <p className="form-note">
        After submission, confirmation will be sent to your WhatsApp and our admin.
      </p>

      <style jsx>{`
        .booking-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .form-section {
          background: var(--color-bg-secondary);
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
        }

        .form-section h3 {
          margin: 0 0 var(--spacing-lg) 0;
          font-size: 1.125rem;
          color: var(--color-primary);
        }

        .section-note {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0 0 var(--spacing-lg) 0;
        }

        .form-row {
          display: flex;
          gap: var(--spacing-lg);
        }

        .form-row.two-cols > .form-group {
          flex: 1;
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 500;
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
        }

        .form-input {
          width: 100%;
          padding: var(--spacing-md);
          border: 1px solid rgba(139, 69, 19, 0.2);
          border-radius: var(--radius-lg);
          font-size: 1rem;
          background: var(--color-bg-card);
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
        }

        select.form-input {
          cursor: pointer;
        }

        select.time-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238B4513' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }

        select.time-select option {
          padding: var(--spacing-sm);
          font-size: 1rem;
        }

        /* Duration Info */
        .duration-info {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .duration-badge {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .after-hours-badge {
          background: linear-gradient(135deg, #6B21A8 0%, #4C1D95 100%);
          color: white;
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* Price Summary */
        .price-summary {
          background: linear-gradient(135deg, var(--color-bg-dark) 0%, #2D2620 100%);
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          color: white;
        }

        .price-summary h3 {
          margin: 0 0 var(--spacing-lg) 0;
          color: white;
        }

        .price-breakdown {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .price-line {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .price-line.extra-hours {
          color: #FCD34D;
        }

        .price-line.after-hours {
          color: #C4B5FD;
        }

        .price-line.subtotal {
          border-bottom: 1px dashed rgba(255, 255, 255, 0.3);
          font-weight: 600;
        }

        .price-line.total {
          border-bottom: none;
          border-top: 2px solid rgba(255, 255, 255, 0.3);
          padding-top: var(--spacing-md);
          margin-top: var(--spacing-sm);
          font-weight: 700;
          font-size: 1.25rem;
        }

        .price-value {
          font-size: 1.75rem;
          color: var(--color-primary-light);
        }

        .price-note {
          margin: var(--spacing-md) 0 0 0;
          font-size: 0.8125rem;
          opacity: 0.7;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: ${isModal ? 'flex-end' : 'center'};
        }

        .btn {
          padding: var(--spacing-md) var(--spacing-2xl);
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--color-bg-secondary);
          border: 1px solid rgba(139, 69, 19, 0.2);
          color: var(--color-text-primary);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-bg-primary);
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          border: none;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .form-note {
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0;
        }

        @media (max-width: 768px) {
          .form-row.two-cols {
            flex-direction: column;
          }
        }
      `}</style>
    </form>
  )
}
