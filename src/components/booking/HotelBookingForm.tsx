'use client'

import { useState, useEffect } from 'react'
import { ROOM_TYPES, AIRPORT_PICKUP, MEAL_PACKAGES, MEAL_TIMES, MEAL_DAYS, EXTRA_BED_PRICE } from '@/constants/hotel'

interface FormData {
    // Personal Info
    fullName: string
    country: string
    passport: string
    phone: string
    whatsapp: string
    // Rooms
    singleQty: number
    doubleQty: number
    tripleQty: number
    quadrupleQty: number
    homestayQty: number
    // Extra Beds
    doubleExtraBed: number
    tripleExtraBed: number
    quadrupleExtraBed: number
    homestayExtraBed: number
    // Guests
    adults: number
    children: number
    // Stay
    checkInDate: string
    checkInTime: string
    checkOutDate: string
    checkOutTime: string
    // Pickup
    airportPickup: string
    // Meals
    meals: {
        breakfast: { menuId: string, qty: number, isDaily: boolean }
        lunch: { menuId: string, qty: number, isDaily: boolean }
        dinner: { menuId: string, qty: number, isDaily: boolean }
    }
}

interface HotelBookingFormProps {
    initialDate?: Date
    onClose?: () => void
    isModal?: boolean
    onSuccess?: () => void
}

export default function HotelBookingForm({ initialDate, onClose, isModal = false, onSuccess }: HotelBookingFormProps) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [bookingId, setBookingId] = useState('')

    useEffect(() => {
        if (initialDate) {
            setFormData(prev => ({
                ...prev,
                checkInDate: initialDate.toISOString().split('T')[0]
            }))
        }
    }, [initialDate])

    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        country: '',
        passport: '',
        phone: '',
        whatsapp: '',
        singleQty: 0,
        doubleQty: 0,
        tripleQty: 0,
        quadrupleQty: 0,
        homestayQty: 0,
        doubleExtraBed: 0,
        tripleExtraBed: 0,
        quadrupleExtraBed: 0,
        homestayExtraBed: 0,
        adults: 1,
        children: 0,
        checkInDate: '',
        checkInTime: '14:00',
        checkOutDate: '',
        checkOutTime: '12:00',
        airportPickup: 'none',
        meals: {
            breakfast: { menuId: '', qty: 0, isDaily: true },
            lunch: { menuId: '', qty: 0, isDaily: true },
            dinner: { menuId: '', qty: 0, isDaily: true },
        },
    })

    // Calculate nights
    const calculateNights = () => {
        if (!formData.checkInDate || !formData.checkOutDate) return 0
        const checkIn = new Date(formData.checkInDate)
        const checkOut = new Date(formData.checkOutDate)
        const diff = checkOut.getTime() - checkIn.getTime()
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    const nights = calculateNights()

    // Calculate pricing
    const calculatePricing = () => {
        const roomsTotal = (
            (formData.singleQty * ROOM_TYPES.single.price) +
            (formData.doubleQty * ROOM_TYPES.double.price) +
            (formData.tripleQty * ROOM_TYPES.triple.price) +
            (formData.quadrupleQty * ROOM_TYPES.quadruple.price) +
            (formData.homestayQty * ROOM_TYPES.homestay.price)
        ) * nights

        const mealsTotal = (Object.keys(formData.meals) as Array<keyof typeof formData.meals>).reduce((sum, key) => {
            const meal = formData.meals[key]
            if (!meal.menuId || meal.qty <= 0) return sum
            const menu = MEAL_PACKAGES.find(m => m.id === meal.menuId)
            const price = menu ? menu.price : 0
            const multiplier = meal.isDaily ? nights : 1
            return sum + (price * meal.qty * multiplier)
        }, 0)

        // Extra Beds Logic (Confirmed: Qty * Price * Nights)
        const extraBedTotal = (
            formData.doubleExtraBed +
            formData.tripleExtraBed +
            formData.quadrupleExtraBed +
            formData.homestayExtraBed
        ) * EXTRA_BED_PRICE * nights

        const pickupOption = AIRPORT_PICKUP.find(p => p.value === formData.airportPickup)
        const pickupTotal = pickupOption?.price || 0

        return {
            roomsTotal,
            extraBedTotal,
            pickupTotal,
            mealsTotal,
            totalUSD: roomsTotal + extraBedTotal + pickupTotal,
            totalEGP: mealsTotal,
        }
    }

    const pricing = calculatePricing()

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateMealSelection = (time: keyof typeof formData.meals, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            meals: {
                ...prev.meals,
                [time]: {
                    ...prev.meals[time],
                    [field]: value
                }
            }
        }))
    }

    const handleDownloadPDF = async () => {
        if (!bookingId) return

        try {
            const response = await fetch(`/api/booking/download/${bookingId}`)
            if (!response.ok) throw new Error('Download failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Booking-${bookingId}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            alert('Failed to download PDF. Please try again.')
        }
    }

    const getTotalRooms = () => {
        return formData.singleQty + formData.doubleQty + formData.tripleQty + formData.quadrupleQty + formData.homestayQty
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/booking/hotel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    nights,
                    pricing,
                }),
            })
            const data = await response.json()
            if (data.success) {
                setBookingId(data.booking.bookingId)
                setSubmitSuccess(true)
                if (onSuccess) onSuccess()
            } else {
                alert(data.error || 'Booking failed')
            }
        } catch (error) {
            alert('Network error. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Validation
    const isStep1Valid = formData.fullName && formData.country && formData.passport && formData.phone && formData.whatsapp
    const isStep2Valid = getTotalRooms() > 0
    const isStep3Valid = formData.adults >= 1 && formData.checkInDate && formData.checkOutDate && nights >= 1

    if (submitSuccess) {
        return (
            <div className="booking-form success">
                <div className="success-content">
                    <div className="success-icon">🎉</div>
                    <h2>Booking Berhasil!</h2>
                    <p className="booking-id">Booking ID: <strong>{bookingId}</strong></p>

                    <div className="success-summary">
                        <p>
                            <span>📧 WhatsApp Konfirmasi:</span>
                            <strong>Terkirim</strong>
                        </p>
                        <p>
                            <span>🏨 Status Kamar:</span>
                            <strong style={{ color: '#e5b072' }}>Menunggu Pembayaran</strong>
                        </p>
                        <p style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                            <span>💰 Total Tagihan:</span>
                            <strong style={{ fontSize: '1.25rem' }}>${pricing.totalUSD} USD <span style={{ fontSize: '1rem', color: '#a1a1aa', fontWeight: 'normal' }}>+ {pricing.totalEGP} EGP</span></strong>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleDownloadPDF}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download PDF
                        </button>

                        <button className="btn btn-primary" onClick={() => {
                            if (onClose) {
                                onClose()
                            } else {
                                window.location.href = '/booking/hotel'
                            }
                        }}>
                            {onClose ? 'Tutup' : 'Booking Lagi'}
                        </button>
                    </div>
                </div>
                <style jsx>{successStyles}</style>
            </div>
        )
    }

    return (
        <div className="booking-form">
            {/* Progress Steps */}
            <div className="progress-bar">
                {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className={`step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
                        <span className="step-number">{s}</span>
                        <span className="step-label">
                            {s === 1 ? 'Personal' : s === 2 ? 'Rooms' : s === 3 ? 'Stay' : s === 4 ? 'Add-ons' : 'Summary'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Step 1: Personal Information */}
            {step === 1 && (
                <div className="form-step">
                    <h2>👤 Personal Information</h2>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={e => updateField('fullName', e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Country of Origin *</label>
                        <input
                            type="text"
                            value={formData.country}
                            onChange={e => updateField('country', e.target.value)}
                            placeholder="e.g. Indonesia"
                        />
                    </div>
                    <div className="form-group">
                        <label>Passport Number *</label>
                        <input
                            type="text"
                            value={formData.passport}
                            onChange={e => updateField('passport', e.target.value)}
                            placeholder="Enter passport number"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>WhatsApp Number (start with country code) *</label>
                            <input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={e => updateField('whatsapp', e.target.value)}
                                placeholder="+62..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number (start with country code) *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => updateField('phone', e.target.value)}
                                placeholder="+62..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Room Selection */}
            {step === 2 && (
                <div className="form-step">
                    <h2>🛏️ Choose Room Types</h2>
                    <p className="subtitle">Select the number of rooms you need</p>

                    <div className="room-grid">
                        {(Object.entries(ROOM_TYPES) as [string, (typeof ROOM_TYPES)[keyof typeof ROOM_TYPES]][]).map(([key, room]) => {
                            const qtyField = `${key}Qty` as keyof FormData
                            const extraBedField = `${key}ExtraBed` as keyof FormData
                            const qty = formData[qtyField] as number

                            return (
                                <div key={key} className={`room-card ${qty > 0 ? 'selected' : ''}`}>
                                    <div className="room-header">
                                        <span className="room-icon">{room.icon}</span>
                                        <span className="room-name">{room.label}</span>
                                    </div>
                                    {'description' in room && (
                                        <p className="room-desc">{room.description}</p>
                                    )}
                                    <div className="room-price">${room.price}/night</div>
                                    <div className="room-max">Max: {room.maxQty} rooms</div>

                                    <div className="qty-selector">
                                        <button
                                            onClick={() => {
                                                const newQty = Math.max(0, qty - 1);
                                                updateField(qtyField, newQty);
                                                // Clamp extra bed if it exceeds new room quantity
                                                if (room.allowExtraBed && (formData[extraBedField] as number) > newQty) {
                                                    updateField(extraBedField, newQty);
                                                }
                                            }}
                                            disabled={qty <= 0}
                                            title="Decrease Room"
                                        >−</button>
                                        <span>{qty}</span>
                                        <button
                                            onClick={() => updateField(qtyField, Math.min(room.maxQty, qty + 1))}
                                            disabled={qty >= room.maxQty}
                                            title="Increase Room"
                                        >+</button>
                                    </div>

                                    {room.allowExtraBed && (
                                        <div className="extra-bed" style={{ opacity: qty > 0 ? 1 : 0.4 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <label style={{ margin: 0 }}>Extra Bed (+${EXTRA_BED_PRICE}/night)</label>
                                                <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Max: {qty}</span>
                                            </div>
                                            <div className="qty-selector small">
                                                <button
                                                    onClick={() => updateField(extraBedField, Math.max(0, (formData[extraBedField] as number) - 1))}
                                                    disabled={qty === 0 || (formData[extraBedField] as number) <= 0}
                                                    title="Decrease Extra Bed"
                                                >−</button>
                                                <span>{formData[extraBedField] as number}</span>
                                                <button
                                                    onClick={() => updateField(extraBedField, Math.min(qty, (formData[extraBedField] as number) + 1))}
                                                    disabled={qty === 0 || (formData[extraBedField] as number) >= qty}
                                                    title="Increase Extra Bed"
                                                >+</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {getTotalRooms() > 0 && (
                        <div className="selection-summary">
                            <strong>Selected:</strong> {getTotalRooms()} room(s)
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Stay Details */}
            {step === 3 && (
                <div className="form-step">
                    <h2>📅 Stay Duration & Guests</h2>

                    <div className="section-title">Guest Details</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Adults (18+) *</label>
                            <div className="qty-selector inline">
                                <button onClick={() => updateField('adults', Math.max(1, formData.adults - 1))}>−</button>
                                <span>{formData.adults}</span>
                                <button onClick={() => updateField('adults', formData.adults + 1)}>+</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Children (under 18)</label>
                            <div className="qty-selector inline">
                                <button onClick={() => updateField('children', Math.max(0, formData.children - 1))}>−</button>
                                <span>{formData.children}</span>
                                <button onClick={() => updateField('children', formData.children + 1)}>+</button>
                            </div>
                        </div>
                    </div>

                    <div className="section-title">Check-in</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={formData.checkInDate}
                                onChange={e => updateField('checkInDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="form-group">
                            <label>Time</label>
                            <input
                                type="time"
                                value={formData.checkInTime}
                                onChange={e => updateField('checkInTime', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="section-title">Check-out</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Date *</label>
                            <input
                                type="date"
                                value={formData.checkOutDate}
                                onChange={e => updateField('checkOutDate', e.target.value)}
                                min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="form-group">
                            <label>Time</label>
                            <input
                                type="time"
                                value={formData.checkOutTime}
                                onChange={e => updateField('checkOutTime', e.target.value)}
                            />
                        </div>
                    </div>

                    {nights > 0 && (
                        <div className="nights-badge">
                            🌙 {nights} Night{nights > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Add-ons */}
            {step === 4 && (
                <div className="form-step">
                    <h2>✨ Optional Add-ons</h2>

                    <div className="section-title">🚗 Airport Pickup</div>
                    <div className="pickup-options">
                        {AIRPORT_PICKUP.map(option => (
                            <div
                                key={option.value}
                                className={`pickup-card ${formData.airportPickup === option.value ? 'selected' : ''}`}
                                onClick={() => updateField('airportPickup', option.value)}
                            >
                                <div className="pickup-label">{option.label}</div>
                                {option.price > 0 && (
                                    <div className="pickup-price">${option.price} USD</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="section-title">🍚 Indonesian Meal Package</div>
                    <p className="subtitle">Prices in EGP per portion</p>

                    <div className="meal-grid">
                        {(['breakfast', 'lunch', 'dinner'] as const).map((time) => {
                            const mealData = formData.meals[time]
                            const isSelected = mealData.qty > 0 && !!mealData.menuId
                            const label = time.charAt(0).toUpperCase() + time.slice(1)

                            return (
                                <div key={time} className={`meal-card ${isSelected ? 'selected' : ''}`}>
                                    <div className="meal-header">
                                        <span className="meal-name">{label}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                        {/* 1. Select Menu */}
                                        <select
                                            value={mealData.menuId}
                                            onChange={e => updateMealSelection(time, 'menuId', e.target.value)}
                                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', width: '100%' }}
                                        >
                                            <option value="">-- Select Menu --</option>
                                            {MEAL_PACKAGES.map(pkg => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.label} ({pkg.price} EGP)
                                                </option>
                                            ))}
                                        </select>

                                        {/* 2. Quantity */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                            <label style={{ fontSize: '0.9rem' }}>Qty:</label>
                                            <div className="qty-selector small">
                                                <button onClick={() => updateMealSelection(time, 'qty', Math.max(0, mealData.qty - 1))}>−</button>
                                                <span>{mealData.qty}</span>
                                                <button onClick={() => updateMealSelection(time, 'qty', mealData.qty + 1)}>+</button>
                                            </div>
                                        </div>

                                        {/* 3. Daily Toggle */}
                                        {mealData.qty > 0 && (
                                            <div style={{
                                                marginTop: '12px', padding: '8px', background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '8px', fontSize: '0.85rem'
                                            }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={mealData.isDaily}
                                                        onChange={e => updateMealSelection(time, 'isDaily', e.target.checked)}
                                                    />
                                                    During Stay (Daily)
                                                </label>
                                                <p style={{ marginTop: '4px', color: '#666' }}>
                                                    {mealData.isDaily
                                                        ? `${mealData.qty} x ${nights} nights = ${mealData.qty * nights} total`
                                                        : `${mealData.qty} portion (One-time)`
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
                <div className="form-step">
                    <h2>📋 Booking Summary</h2>

                    <div className="summary-section">
                        <h3>👤 Personal Information</h3>
                        <div className="summary-row">
                            <span>Name:</span>
                            <strong>{formData.fullName}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Country:</span>
                            <span>{formData.country}</span>
                        </div>
                        <div className="summary-row">
                            <span>Passport:</span>
                            <span>{formData.passport}</span>
                        </div>
                        <div className="summary-row">
                            <span>WhatsApp:</span>
                            <span>{formData.whatsapp}</span>
                        </div>
                    </div>

                    <div className="summary-section">
                        <h3>🛏️ Rooms</h3>
                        {formData.singleQty > 0 && (
                            <div className="summary-row">
                                <span>Single × {formData.singleQty}</span>
                                <span>${ROOM_TYPES.single.price * formData.singleQty * nights}</span>
                            </div>
                        )}
                        {formData.doubleQty > 0 && (
                            <div className="summary-row">
                                <span>Double × {formData.doubleQty}</span>
                                <span>${ROOM_TYPES.double.price * formData.doubleQty * nights}</span>
                            </div>
                        )}
                        {formData.tripleQty > 0 && (
                            <div className="summary-row">
                                <span>Triple × {formData.tripleQty}</span>
                                <span>${ROOM_TYPES.triple.price * formData.tripleQty * nights}</span>
                            </div>
                        )}
                        {formData.quadrupleQty > 0 && (
                            <div className="summary-row">
                                <span>Quadruple × {formData.quadrupleQty}</span>
                                <span>${ROOM_TYPES.quadruple.price * formData.quadrupleQty * nights}</span>
                            </div>
                        )}
                        {formData.homestayQty > 0 && (
                            <div className="summary-row">
                                <span>Homestay × {formData.homestayQty}</span>
                                <span>${ROOM_TYPES.homestay.price * formData.homestayQty * nights}</span>
                            </div>
                        )}

                        {/* Extra Beds Summary */}
                        {pricing.extraBedTotal > 0 && (
                            <div className="summary-row" style={{ color: '#e5b072', borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '12px' }}>
                                <span>
                                    Extra Bed ({formData.doubleExtraBed + formData.tripleExtraBed + formData.quadrupleExtraBed + formData.homestayExtraBed} beds)
                                    <br />
                                    <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                                        ${EXTRA_BED_PRICE}/night × {nights} nights
                                    </span>
                                </span>
                                <span>${pricing.extraBedTotal}</span>
                            </div>
                        )}
                    </div>

                    <div className="summary-section">
                        <h3>📅 Stay Details</h3>
                        <div className="summary-row">
                            <span>Check-in:</span>
                            <span>{formData.checkInDate} {formData.checkInTime}</span>
                        </div>
                        <div className="summary-row">
                            <span>Check-out:</span>
                            <span>{formData.checkOutDate} {formData.checkOutTime}</span>
                        </div>
                        <div className="summary-row">
                            <span>Nights:</span>
                            <strong>{nights}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Guests:</span>
                            <span>{formData.adults} adult(s), {formData.children} child(ren)</span>
                        </div>
                    </div>

                    {formData.airportPickup !== 'none' && (
                        <div className="summary-section">
                            <h3>🚗 Airport Pickup</h3>
                            <div className="summary-row">
                                <span>{AIRPORT_PICKUP.find(p => p.value === formData.airportPickup)?.label}</span>
                                <span>${pricing.pickupTotal}</span>
                            </div>
                        </div>
                    )}

                    <div className="summary-section">
                        <h3>🍚 Meals (Daily during stay)</h3>
                        {(['breakfast', 'lunch', 'dinner'] as const).map(time => {
                            const mealData = formData.meals[time]
                            if (!mealData.menuId || mealData.qty === 0) return null

                            const menu = MEAL_PACKAGES.find(m => m.id === mealData.menuId)
                            if (!menu) return null

                            const multiplier = mealData.isDaily ? nights : 1
                            const label = time.charAt(0).toUpperCase() + time.slice(1)
                            const totalCost = menu.price * mealData.qty * multiplier

                            return (
                                <div key={time} className="summary-row">
                                    <span>
                                        <strong>{label}</strong>: {menu.label} <br />
                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {mealData.qty} x {menu.price} EGP {mealData.isDaily ? `x ${nights} nights` : '(One-time)'}
                                        </span>
                                    </span>
                                    <span>{totalCost.toLocaleString()} EGP</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="summary-total">
                        <div className="total-row">
                            <span>Rooms & Extras (USD)</span>
                            <strong>${pricing.roomsTotal + pricing.extraBedTotal}</strong>
                        </div>
                        {pricing.pickupTotal > 0 && (
                            <div className="total-row">
                                <span>Airport Pickup (USD)</span>
                                <strong>${pricing.pickupTotal}</strong>
                            </div>
                        )}
                        {pricing.mealsTotal > 0 && (
                            <div className="total-row">
                                <span>Meals (EGP)</span>
                                <strong>{pricing.mealsTotal} EGP</strong>
                            </div>
                        )}
                        <div className="grand-total">
                            <span>Grand Total</span>
                            <div>
                                <strong>${pricing.totalUSD} USD</strong>
                                {pricing.totalEGP > 0 && <span> + {pricing.totalEGP} EGP</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            {isSubmitting && (
                <div className="loading-overlay">
                    <div className="loading-spinner">⏳</div>
                    <p>Securing your reservation...</p>
                </div>
            )}
            <div className="form-nav">
                {step > 1 && (
                    <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                        ← Back
                    </button>
                )}
                <div className="nav-spacer"></div>
                {step < 5 ? (
                    <button
                        className="btn btn-primary"
                        onClick={() => setStep(step + 1)}
                        disabled={
                            (step === 1 && !isStep1Valid) ||
                            (step === 2 && !isStep2Valid) ||
                            (step === 3 && !isStep3Valid)
                        }
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        className="btn btn-success"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : '✓ Confirm Booking'}
                    </button>
                )}
            </div>

            <style jsx>{formStyles}</style>
        </div>
    )
}

const formStyles = `
    .booking-form {
        max-width: 800px;
        margin: 0 auto;
        padding: 2.5rem;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 24px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        position: relative;
        overflow: hidden;
    }

    /* Loading Overlay Styles (for form submission) */
    .loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 15, 17, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 50;
        border-radius: 24px;
    }

    .loading-spinner {
        font-size: 3rem;
        animation: spin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        margin-bottom: 1rem;
    }

    .loading-overlay p {
        color: #f3f4f6;
        font-size: 1.125rem;
        font-weight: 500;
        letter-spacing: 0.5px;
        animation: pulseText 2s infinite ease-in-out;
    }

    @keyframes pulseText {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; text-shadow: 0 0 10px rgba(229, 176, 114, 0.3); }
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .progress-bar {
        display: flex;
        justify-content: space-between;
        margin-bottom: 32px;
        padding: 0 10px;
        position: relative;
    }

    /* Connecting Line */
    .progress-bar::before {
        content: '';
        position: absolute;
        top: 18px;
        left: 30px;
        right: 30px;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        z-index: 0;
    }

    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        opacity: 0.5;
        transition: all 0.3s ease;
        z-index: 1;
        position: relative;
    }

    .step.active { opacity: 1; }
    .step.current .step-number { 
        background: linear-gradient(135deg, #e5b072 0%, #a4703f 100%);
        color: #000; 
        transform: scale(1.15);
        box-shadow: 0 0 15px rgba(229, 176, 114, 0.4);
        border: none;
    }

    .step-number {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #1f1f22;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #a1a1aa;
        font-weight: 700;
        transition: all 0.3s ease;
    }

    .step.active .step-number { 
        background: rgba(229, 176, 114, 0.15);
        color: #e5b072;
        border-color: rgba(229, 176, 114, 0.3);
    }

    .step-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #a1a1aa;
        background: #0f0f11; /* to mask the line behind text */
        padding: 0 4px;
        border-radius: 4px;
    }

    .form-step {
        animation: fadeIn 0.4s ease-out;
    }

    .form-step h2 {
        margin: 0 0 24px;
        color: #ffffff;
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: -0.5px;
    }

    .subtitle {
        color: #a1a1aa;
        margin: -16px 0 24px;
        font-size: 0.95rem;
    }

    .section-title {
        font-weight: 600;
        color: #e5b072;
        margin: 28px 0 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.85rem;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #e4e4e7;
        font-size: 0.95rem;
    }

    .form-group input, .form-group select {
        width: 100%;
        padding: 14px 16px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        font-size: 1rem;
        color: #ffffff;
        transition: all 0.3s ease;
    }

    .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: #e5b072;
        box-shadow: 0 0 0 3px rgba(229, 176, 114, 0.1);
        background: rgba(0, 0, 0, 0.4);
    }

    .form-group input::placeholder, .form-group select::placeholder {
        color: #52525b;
    }

    /* Style for date picker icon */
    input[type="date"]::-webkit-calendar-picker-indicator,
    input[type="time"]::-webkit-calendar-picker-indicator {
        filter: invert(0.8) sepia(1) saturate(3) hue-rotate(340deg);
        cursor: pointer;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    /* ------ Bento Grid Look matches room-card and meal-card ------ */
    .room-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
    }

    .room-card, .pickup-card, .meal-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
        position: relative;
    }
    .pickup-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
    }
    .meal-card {
        text-align: left;
    }

    .room-card:hover, .pickup-card:hover, .meal-card:hover { 
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(229, 176, 114, 0.3);
        transform: translateY(-2px);
    }
    
    .room-card.selected, .pickup-card.selected, .meal-card.selected { 
        background: rgba(229, 176, 114, 0.08);
        border-color: #e5b072;
        box-shadow: inset 0 0 20px rgba(229, 176, 114, 0.05);
    }

    /* Highlight badge for selected items */
    .room-card.selected::before, .pickup-card.selected::before, .meal-card.selected::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: #e5b072;
        border-radius: 4px 0 0 4px;
    }

    .room-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .room-icon { font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
    .room-name { font-weight: 600; color: #f3f4f6; font-size: 1.1rem; }
    .room-desc { font-size: 0.8rem; color: #a1a1aa; margin: 0 0 12px; line-height: 1.4; }
    .room-price { font-size: 1.25rem; font-weight: 700; color: #e5b072; margin-bottom: 4px; }
    .room-max { font-size: 0.75rem; color: #71717a; margin-bottom: 16px; }

    .qty-selector {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        background: rgba(0,0,0,0.2);
        padding: 4px;
        border-radius: 100px;
        border: 1px solid rgba(255,255,255,0.05);
    }

    .qty-selector button {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        color: #e4e4e7;
        font-size: 1.25rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .qty-selector button:hover:not(:disabled) {
        background: #e5b072;
        color: #000;
        box-shadow: 0 0 10px rgba(229,176,114,0.3);
    }

    .qty-selector button:disabled {
        opacity: 0.2;
        cursor: not-allowed;
    }

    .qty-selector span {
        font-size: 1.1rem;
        font-weight: 600;
        min-width: 24px;
        color: #f3f4f6;
    }

    .qty-selector.small button { width: 26px; height: 26px; font-size: 1rem; }
    .qty-selector.inline { 
        justify-content: flex-start; 
        background: transparent; 
        border: none; 
        padding: 0; 
    }
    .qty-selector.inline button {
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
    }

    .extra-bed {
        margin-top: 20px;
        padding: 14px 16px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        text-align: left;
        transition: all 0.3s ease;
    }

    .room-card.selected .extra-bed {
        background: rgba(229, 176, 114, 0.05);
        border-color: rgba(229, 176, 114, 0.15);
    }

    .extra-bed label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: #e4e4e7;
        margin-bottom: 4px;
    }

    .selection-summary {
        margin-top: 24px;
        padding: 16px 20px;
        background: rgba(229, 176, 114, 0.05);
        border: 1px solid rgba(229, 176, 114, 0.2);
        border-radius: 12px;
        text-align: center;
        color: #e5b072;
        font-weight: 500;
    }

    .nights-badge {
        display: inline-block;
        margin-top: 20px;
        padding: 8px 20px;
        background: rgba(229, 176, 114, 0.1);
        color: #e5b072;
        border: 1px solid rgba(229, 176, 114, 0.2);
        border-radius: 20px;
        font-weight: 600;
        letter-spacing: 0.5px;
    }

    .pickup-label { color: #f3f4f6; font-weight: 500; }
    .pickup-price { font-weight: 700; color: #e5b072; }

    .meal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
    }

    .meal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .meal-name { font-weight: 600; font-size: 1.1rem; color: #f3f4f6; }
    
    select option {
        background: #18181b; /* Dark bg for dropdown options */
        color: #f3f4f6;
    }

    /* ------ Summary Receipt ------ */
    .summary-section {
        padding: 24px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        margin-bottom: 16px;
    }

    .summary-section h3 {
        margin: 0 0 20px;
        font-size: 1.1rem;
        color: #e5b072;
        font-weight: 600;
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        padding-bottom: 12px;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        color: #d4d4d8;
        font-size: 0.95rem;
    }

    .summary-row strong { color: #f3f4f6; font-weight: 600; }
    .summary-row span:last-child { color: #f3f4f6; font-weight: 500; }

    .summary-total {
        background: linear-gradient(135deg, rgba(229, 176, 114, 0.1) 0%, rgba(139, 69, 19, 0.1) 100%);
        border: 1px solid rgba(229, 176, 114, 0.2);
        padding: 24px;
        border-radius: 16px;
        margin-top: 24px;
    }

    .total-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        color: #d4d4d8;
        font-size: 1rem;
    }
    .total-row strong { color: #f3f4f6; }

    .grand-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        margin-top: 12px;
        border-top: 1px dashed rgba(229, 176, 114, 0.3);
        font-size: 1.25rem;
        color: #f3f4f6;
    }

    .grand-total strong {
        font-size: 1.5rem;
        color: #e5b072;
        font-weight: 700;
    }

    .form-nav {
        display: flex;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .nav-spacer { flex: 1; }

    .btn {
        padding: 14px 28px;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {
        background: linear-gradient(135deg, #e5b072 0%, #a4703f 100%);
        color: #000;
        box-shadow: 0 4px 15px rgba(229, 176, 114, 0.2);
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(229, 176, 114, 0.3);
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        color: #d4d4d8;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    .btn-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
        padding: 16px 36px;
        font-size: 1.1rem;
    }

    .btn-success:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
        .booking-form { padding: 1.5rem; }
        .form-row { grid-template-columns: 1fr; }
        .room-grid { grid-template-columns: 1fr; }
        .progress-bar { padding: 0; gap: 4px; }
        .progress-bar::before { left: 15px; right: 15px; }
        .step-label { display: none; }
    }
`

const successStyles = `
    .booking-form.success {
        text-align: center;
        padding: 4rem 2rem;
        background: rgba(20, 20, 23, 0.6);
        border: 1px solid rgba(34, 197, 94, 0.3);
        box-shadow: 0 0 40px rgba(34, 197, 94, 0.1);
    }

    .success-icon {
        font-size: 4.5rem;
        margin-bottom: 24px;
        animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        filter: drop-shadow(0 0 20px rgba(34,197,94,0.4));
    }

    .success-content h2 {
        margin: 0 0 16px;
        color: #4ade80;
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.5px;
    }

    .booking-id {
        font-size: 1.1rem;
        color: #a1a1aa;
        margin-bottom: 32px;
        background: rgba(0,0,0,0.3);
        padding: 8px 16px;
        border-radius: 8px;
        display: inline-block;
        border: 1px dashed rgba(255,255,255,0.1);
    }
    
    .booking-id strong { color: #f3f4f6; font-family: monospace; font-size: 1.25rem; }

    .success-summary {
        background: rgba(34, 197, 94, 0.05);
        border: 1px solid rgba(34, 197, 94, 0.2);
        padding: 24px;
        border-radius: 16px;
        margin-bottom: 32px;
        text-align: left;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    }

    .success-summary p {
        margin: 12px 0;
        color: #d4d4d8;
        display: flex;
        justify-content: space-between;
        font-size: 1.05rem;
    }
    
    .success-summary strong { color: #f3f4f6; }

    @keyframes scaleIn {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`
