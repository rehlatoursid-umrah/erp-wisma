'use client'

import { useState, useEffect } from 'react'
import { ROOM_TYPES, AIRPORT_PICKUP, MEAL_PACKAGES, MEAL_TIMES, MEAL_DAYS, EXTRA_BED_PRICE } from '@/constants/hotel'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import './hotel-booking-form.css'

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
            toast.error('Download gagal. Silakan coba lagi.')
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
                if (onSuccess) {
                    onSuccess()
                } else {
                    window.location.href = `/booking/hotel/success?id=${data.booking.bookingId}&usd=${pricing.totalUSD}&egp=${pricing.totalEGP}&cin=${formData.checkInDate}&cout=${formData.checkOutDate}&nights=${nights}`
                }
            } else {
                toast.error(data.error || 'Booking gagal')
            }
        } catch (error) {
            toast.error('Koneksi gagal. Silakan coba lagi.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Validation
    const isStep1Valid = formData.fullName && formData.country && formData.passport && formData.phone && formData.whatsapp
    const isStep2Valid = getTotalRooms() > 0
    const isStep3Valid = formData.adults >= 1 && formData.checkInDate && formData.checkOutDate && nights >= 1

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
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <label style={{ margin: 0, lineHeight: 1.2 }}>Extra Bed (+${EXTRA_BED_PRICE}/n)</label>
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
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
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

        </div>
    )
}

