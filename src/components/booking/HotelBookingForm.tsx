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
        [key: string]: {
            qty: number
            timing: string[]
        }
    }
}

export default function HotelBookingForm() {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [bookingId, setBookingId] = useState('')

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
            nasiGoreng: { qty: 0, timing: [] },
            ayamGoreng: { qty: 0, timing: [] },
            nasiKuning: { qty: 0, timing: [] },
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

        const extraBedTotal = (
            formData.doubleExtraBed +
            formData.tripleExtraBed +
            formData.quadrupleExtraBed +
            formData.homestayExtraBed
        ) * EXTRA_BED_PRICE * nights

        const pickupOption = AIRPORT_PICKUP.find(p => p.value === formData.airportPickup)
        const pickupTotal = pickupOption?.price || 0

        const mealsTotal = MEAL_PACKAGES.reduce((sum, meal) => {
            const mealData = formData.meals[meal.id]
            return sum + (mealData.qty * meal.price * mealData.timing.length)
        }, 0)

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

    const updateMeal = (mealId: string, field: 'qty' | 'timing', value: any) => {
        setFormData(prev => ({
            ...prev,
            meals: {
                ...prev.meals,
                [mealId]: {
                    ...prev.meals[mealId],
                    [field]: value,
                },
            },
        }))
    }

    const toggleMealTiming = (mealId: string, timing: string) => {
        const current = formData.meals[mealId].timing
        const newTiming = current.includes(timing)
            ? current.filter(t => t !== timing)
            : [...current, timing]
        updateMeal(mealId, 'timing', newTiming)
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
                    <div className="success-icon">✅</div>
                    <h2>Booking Berhasil!</h2>
                    <p className="booking-id">ID: <strong>{bookingId}</strong></p>
                    <div className="success-summary">
                        <p>📧 Konfirmasi akan dikirim ke WhatsApp Anda</p>
                        <p>💰 Total: <strong>${pricing.totalUSD} USD</strong> + <strong>{pricing.totalEGP} EGP</strong></p>
                    </div>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/booking/hotel'}>
                        Booking Lagi
                    </button>
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
                            <label>WhatsApp Number *</label>
                            <input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={e => updateField('whatsapp', e.target.value)}
                                placeholder="+62812XXXXXXXX"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => updateField('phone', e.target.value)}
                                placeholder="+62812XXXXXXXX"
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
                        {(Object.entries(ROOM_TYPES) as [string, typeof ROOM_TYPES.single][]).map(([key, room]) => {
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
                                            onClick={() => updateField(qtyField, Math.max(0, qty - 1))}
                                            disabled={qty <= 0}
                                        >−</button>
                                        <span>{qty}</span>
                                        <button
                                            onClick={() => updateField(qtyField, Math.min(room.maxQty, qty + 1))}
                                            disabled={qty >= room.maxQty}
                                        >+</button>
                                    </div>

                                    {room.allowExtraBed && qty > 0 && (
                                        <div className="extra-bed">
                                            <label>Extra Bed (+${EXTRA_BED_PRICE}/night)</label>
                                            <div className="qty-selector small">
                                                <button onClick={() => updateField(extraBedField, Math.max(0, (formData[extraBedField] as number) - 1))}>−</button>
                                                <span>{formData[extraBedField] as number}</span>
                                                <button onClick={() => updateField(extraBedField, (formData[extraBedField] as number) + 1)}>+</button>
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
                        {MEAL_PACKAGES.map(meal => {
                            const mealData = formData.meals[meal.id]
                            return (
                                <div key={meal.id} className={`meal-card ${mealData.qty > 0 ? 'selected' : ''}`}>
                                    <div className="meal-header">
                                        <span className="meal-name">{meal.label}</span>
                                        <span className="meal-price">{meal.price} EGP</span>
                                    </div>

                                    <div className="qty-selector">
                                        <button onClick={() => updateMeal(meal.id, 'qty', Math.max(0, mealData.qty - 1))}>−</button>
                                        <span>{mealData.qty}</span>
                                        <button onClick={() => updateMeal(meal.id, 'qty', mealData.qty + 1)}>+</button>
                                    </div>

                                    {mealData.qty > 0 && (
                                        <div className="meal-timing">
                                            <label>When to serve:</label>
                                            <div className="timing-grid">
                                                {MEAL_TIMES.map(time => (
                                                    MEAL_DAYS.map(day => {
                                                        const key = `${time}_${day}`.toLowerCase().replace(/ /g, '_').replace(/-/g, '')
                                                        return (
                                                            <label key={key} className="timing-checkbox">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={mealData.timing.includes(key)}
                                                                    onChange={() => toggleMealTiming(meal.id, key)}
                                                                />
                                                                <span>{time} - {day}</span>
                                                            </label>
                                                        )
                                                    })
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                                <span>Double × {formData.doubleQty} {formData.doubleExtraBed > 0 ? `(+${formData.doubleExtraBed} extra bed)` : ''}</span>
                                <span>${ROOM_TYPES.double.price * formData.doubleQty * nights}</span>
                            </div>
                        )}
                        {formData.tripleQty > 0 && (
                            <div className="summary-row">
                                <span>Triple × {formData.tripleQty} {formData.tripleExtraBed > 0 ? `(+${formData.tripleExtraBed} extra bed)` : ''}</span>
                                <span>${ROOM_TYPES.triple.price * formData.tripleQty * nights}</span>
                            </div>
                        )}
                        {formData.quadrupleQty > 0 && (
                            <div className="summary-row">
                                <span>Quadruple × {formData.quadrupleQty} {formData.quadrupleExtraBed > 0 ? `(+${formData.quadrupleExtraBed} extra bed)` : ''}</span>
                                <span>${ROOM_TYPES.quadruple.price * formData.quadrupleQty * nights}</span>
                            </div>
                        )}
                        {formData.homestayQty > 0 && (
                            <div className="summary-row">
                                <span>Homestay × {formData.homestayQty} {formData.homestayExtraBed > 0 ? `(+${formData.homestayExtraBed} extra bed)` : ''}</span>
                                <span>${ROOM_TYPES.homestay.price * formData.homestayQty * nights}</span>
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

                    {pricing.mealsTotal > 0 && (
                        <div className="summary-section">
                            <h3>🍚 Meals</h3>
                            {MEAL_PACKAGES.map(meal => {
                                const mealData = formData.meals[meal.id]
                                if (mealData.qty === 0) return null
                                return (
                                    <div key={meal.id} className="summary-row">
                                        <span>{meal.label} × {mealData.qty} ({mealData.timing.length} times)</span>
                                        <span>{meal.price * mealData.qty * mealData.timing.length} EGP</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

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
        padding: 24px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }

    .progress-bar {
        display: flex;
        justify-content: space-between;
        margin-bottom: 32px;
        padding: 0 20px;
    }

    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        opacity: 0.4;
        transition: all 0.3s ease;
    }

    .step.active { opacity: 1; }
    .step.current .step-number { 
        background: #8B4513; 
        color: white; 
        transform: scale(1.2);
    }

    .step-number {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #e5e7eb;
        font-weight: 700;
        transition: all 0.3s ease;
    }

    .step.active .step-number { background: #22c55e; color: white; }

    .step-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
    }

    .form-step {
        animation: fadeIn 0.3s ease;
    }

    .form-step h2 {
        margin: 0 0 24px;
        color: #1f2937;
        font-size: 1.5rem;
    }

    .subtitle {
        color: #6b7280;
        margin: -16px 0 24px;
        font-size: 0.9rem;
    }

    .section-title {
        font-weight: 600;
        color: #374151;
        margin: 24px 0 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #f3f4f6;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #374151;
    }

    .form-group input, .form-group select {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 1rem;
        transition: border-color 0.2s;
    }

    .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: #8B4513;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .room-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
    }

    .room-card {
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
    }

    .room-card:hover { border-color: #8B4513; }
    .room-card.selected { 
        border-color: #22c55e; 
        background: #f0fdf4;
    }

    .room-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .room-icon { font-size: 1.5rem; }
    .room-name { font-weight: 600; color: #1f2937; }
    .room-desc { font-size: 0.75rem; color: #6b7280; margin: 0 0 8px; }
    .room-price { font-size: 1.25rem; font-weight: 700; color: #8B4513; }
    .room-max { font-size: 0.75rem; color: #9ca3af; margin-bottom: 12px; }

    .qty-selector {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
    }

    .qty-selector button {
        width: 36px;
        height: 36px;
        border: 2px solid #e5e7eb;
        border-radius: 50%;
        background: white;
        font-size: 1.25rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .qty-selector button:hover:not(:disabled) {
        background: #8B4513;
        color: white;
        border-color: #8B4513;
    }

    .qty-selector button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .qty-selector span {
        font-size: 1.25rem;
        font-weight: 700;
        min-width: 30px;
    }

    .qty-selector.small button { width: 28px; height: 28px; font-size: 1rem; }
    .qty-selector.inline { justify-content: flex-start; }

    .extra-bed {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #e5e7eb;
    }

    .extra-bed label {
        display: block;
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 8px;
    }

    .selection-summary {
        margin-top: 20px;
        padding: 12px 20px;
        background: #f0fdf4;
        border-radius: 12px;
        text-align: center;
        color: #166534;
    }

    .nights-badge {
        display: inline-block;
        margin-top: 16px;
        padding: 8px 20px;
        background: #fef3c7;
        color: #92400e;
        border-radius: 20px;
        font-weight: 600;
    }

    .pickup-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .pickup-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .pickup-card:hover { border-color: #8B4513; }
    .pickup-card.selected { 
        border-color: #22c55e; 
        background: #f0fdf4;
    }

    .pickup-price {
        font-weight: 700;
        color: #8B4513;
    }

    .meal-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .meal-card {
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        padding: 20px;
        transition: all 0.2s;
    }

    .meal-card.selected {
        border-color: #22c55e;
        background: #f0fdf4;
    }

    .meal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .meal-name { font-weight: 600; font-size: 1.1rem; }
    .meal-price { font-weight: 700; color: #8B4513; }

    .meal-timing {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px dashed #e5e7eb;
    }

    .meal-timing label:first-child {
        display: block;
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 12px;
    }

    .timing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }

    .timing-checkbox {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        cursor: pointer;
    }

    .timing-checkbox input { accent-color: #8B4513; }

    .summary-section {
        padding: 20px;
        background: #f9fafb;
        border-radius: 12px;
        margin-bottom: 16px;
    }

    .summary-section h3 {
        margin: 0 0 16px;
        font-size: 1rem;
        color: #374151;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
    }

    .summary-row:last-child { border-bottom: none; }

    .summary-total {
        background: #1f2937;
        color: white;
        padding: 20px;
        border-radius: 12px;
    }

    .total-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        opacity: 0.8;
    }

    .grand-total {
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        margin-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.2);
        font-size: 1.25rem;
    }

    .form-nav {
        display: flex;
        margin-top: 32px;
        padding-top: 20px;
        border-top: 2px solid #f3f4f6;
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
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {
        background: #8B4513;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background: #6d3610;
    }

    .btn-secondary {
        background: #f3f4f6;
        color: #374151;
    }

    .btn-success {
        background: #22c55e;
        color: white;
    }

    .btn-success:hover:not(:disabled) {
        background: #16a34a;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
        .form-row { grid-template-columns: 1fr; }
        .room-grid { grid-template-columns: 1fr; }
        .timing-grid { grid-template-columns: 1fr; }
        .progress-bar { padding: 0; gap: 4px; }
        .step-label { display: none; }
    }
`

const successStyles = `
    .booking-form.success {
        text-align: center;
        padding: 60px 40px;
    }

    .success-icon {
        font-size: 4rem;
        margin-bottom: 20px;
    }

    .success-content h2 {
        margin: 0 0 16px;
        color: #166534;
    }

    .booking-id {
        font-size: 1.25rem;
        color: #374151;
        margin-bottom: 24px;
    }

    .success-summary {
        background: #f0fdf4;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 24px;
    }

    .success-summary p {
        margin: 8px 0;
        color: #166534;
    }
`
