import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

const ADMIN_PHONE = '201507049289'

import {
    HALL_PACKAGES,
    AFTER_HOURS_RATE,
    // Note: The API was using a Record<string, number> for prices but the constant uses an array of objects. 
    // We need to be careful with the replacement logic if the data structure differs.
    // The previous API code had: const AC_PRICES = { '4-6': 150 ... }
    // The shared constant has: const AC_OPTIONS = [{ value: '4-6', price: 150 }, ...]
    // I will need to map the array back to a record for easy lookup, or update the logic to find in array.
    AC_OPTIONS, CHAIR_OPTIONS, PROJECTOR_SCREEN_OPTIONS, TABLE_OPTIONS, PLATE_OPTIONS, GLASS_OPTIONS
} from '@/constants/auditorium'

// Helper to convert options array to price map for backend compatibility/ease of use
const toPriceMap = (options: { value: string; price: number }[]) =>
    options.reduce((acc, curr) => ({ ...acc, [curr.value]: curr.price }), {} as Record<string, number>)

const AC_PRICES = toPriceMap(AC_OPTIONS)
const CHAIR_PRICES = toPriceMap(CHAIR_OPTIONS)
const PROJECTOR_PRICES = toPriceMap(PROJECTOR_SCREEN_OPTIONS)
const TABLE_PRICES = toPriceMap(TABLE_OPTIONS)
const PLATE_PRICES = toPriceMap(PLATE_OPTIONS)
const GLASS_PRICES = toPriceMap(GLASS_OPTIONS)

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        // Validate required fields
        const required = ['fullName', 'countryOfOrigin', 'eventName', 'eventDate', 'startTime', 'endTime', 'phoneEgypt', 'whatsappEgypt']
        for (const field of required) {
            if (!data[field]) {
                return NextResponse.json({ error: `Field ${field} is required` }, { status: 400 })
            }
        }

        // Generate booking ID
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const bookingId = `AULA-${dateStr}-${random}`

        // Get prices from form (already calculated on client)
        const hallPackage = data.hallPackage || ''
        const duration = data.duration || 0
        const afterHoursCount = data.afterHoursCount || 0
        const hallRentalPrice = data.hallRentalPrice || 0
        const afterHoursPrice = data.afterHoursPrice || 0
        const servicesPrice = data.servicesPrice || 0
        const totalPrice = data.totalPrice || 0

        // Get Payload instance
        const payload = await getPayload({ config: configPromise })

        // Check if date is already booked
        const existingBookings = await payload.find({
            collection: 'auditorium-bookings',
            where: {
                'event.date': { equals: data.eventDate },
                status: { not_equals: 'cancelled' },
            },
        })

        // Check for time overlap
        for (const booking of existingBookings.docs) {
            const existingStart = booking.event?.startTime
            const existingEnd = booking.event?.endTime
            const newStart = data.startTime
            const newEnd = data.endTime

            if (existingStart && existingEnd) {
                if (!(newEnd <= existingStart || newStart >= existingEnd)) {
                    return NextResponse.json({
                        error: `Time slot already booked (${existingStart} - ${existingEnd})`,
                    }, { status: 409 })
                }
            }
        }

        // Create booking in database
        const booking = await payload.create({
            collection: 'auditorium-bookings',
            data: {
                bookingId,
                personal: {
                    fullName: data.fullName,
                    countryOfOrigin: data.countryOfOrigin,
                },
                event: {
                    name: data.eventName,
                    date: data.eventDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                },
                contact: {
                    phoneEgypt: data.phoneEgypt,
                    whatsappEgypt: data.whatsappEgypt,
                },
                hallRental: {
                    package: hallPackage,
                    duration,
                    afterHoursCount,
                    extraHours: 0, // Admin will add this manually for late checkout
                    hallPrice: hallRentalPrice,
                    afterHoursPrice,
                },
                services: {
                    acOption: data.acOption || '',
                    chairOption: data.chairOption || '',
                    projectorScreen: data.projectorScreen || '',
                    tableOption: data.tableOption || '',
                    plateOption: data.plateOption || '',
                    glassOption: data.glassOption || '',
                },
                servicesPrice,
                totalPrice,
                status: 'pending',
            },
        })

        // Format date for message
        const formattedDate = new Date(data.eventDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })

        // Get package label
        const packageLabel = HALL_PACKAGES.find(p => p.value === hallPackage)?.label || `${duration}h`

        // Build services summary
        const servicesSummary = []
        if (data.acOption) servicesSummary.push(`❄️ AC: ${data.acOption}h`)
        if (data.chairOption) servicesSummary.push(`🪑 Chairs: ${data.chairOption}`)
        if (data.projectorScreen) servicesSummary.push(`📽️ Projector/Screen: ${data.projectorScreen}`)
        if (data.tableOption) servicesSummary.push(`🪑 Tables: ${data.tableOption}`)
        if (data.plateOption) servicesSummary.push(`🍽️ Plates: ${data.plateOption}`)
        if (data.glassOption) servicesSummary.push(`🥛 Glasses: ${data.glassOption}`)

        // Send WhatsApp notifications
        await sendWhatsAppNotification({
            to: ADMIN_PHONE,
            message: `🔔 *NEW AUDITORIUM RESERVATION*\n\n` +
                `📋 Booking ID: ${bookingId}\n\n` +
                `👤 *Personal Info:*\n` +
                `Name: ${data.fullName}\n` +
                `Country: ${data.countryOfOrigin}\n\n` +
                `🎉 *Event:*\n` +
                `Name: ${data.eventName}\n` +
                `Date: ${formattedDate}\n` +
                `Time: ${data.startTime} - ${data.endTime}\n` +
                `Duration: ${duration} hours\n\n` +
                `📞 *Contact:*\n` +
                `Phone: ${data.phoneEgypt}\n` +
                `WhatsApp: ${data.whatsappEgypt}\n\n` +
                `🏛️ *Hall Rental:*\n` +
                `Package: ${packageLabel} = ${hallRentalPrice} EGP\n` +
                (afterHoursCount > 0 ? `After Hours: ${afterHoursCount}h × ${AFTER_HOURS_RATE} = ${afterHoursPrice} EGP\n` : '') +
                `\n⚙️ *Services:* ${servicesPrice} EGP\n${servicesSummary.join('\n') || 'None'}\n\n` +
                `━━━━━━━━━━━━━━\n` +
                `💰 *TOTAL: ${totalPrice} EGP*\n\n` +
                `Status: *PENDING*\nPlease confirm this reservation.`,
        })

        await sendWhatsAppNotification({
            to: data.whatsappEgypt,
            message: `✅ *AUDITORIUM RESERVATION SUBMITTED*\n` +
                `Operational System Wisma Nusantara Cairo\n\n` +
                `Thank you, ${data.fullName}!\n\n` +
                `📋 Booking ID: ${bookingId}\n` +
                `📅 Date: ${formattedDate}\n` +
                `⏰ Time: ${data.startTime} - ${data.endTime}\n` +
                `⏱️ Duration: ${duration} hours\n` +
                `🎉 Event: ${data.eventName}\n\n` +
                `💰 *Price Summary:*\n` +
                `🏛️ Hall (${packageLabel}): ${hallRentalPrice} EGP\n` +
                (afterHoursPrice > 0 ? `🌙 After Hours: ${afterHoursPrice} EGP\n` : '') +
                (servicesPrice > 0 ? `⚙️ Services: ${servicesPrice} EGP\n` : '') +
                `━━━━━━━━━━━━━━\n` +
                `TOTAL: ${totalPrice} EGP\n\n` +
                `Status: *AWAITING CONFIRMATION*\n\n` +
                `Our admin will contact you shortly.\n` +
                `For questions, call: +${ADMIN_PHONE}`,
        })

        return NextResponse.json({
            success: true,
            bookingId,
            duration,
            hallRentalPrice,
            afterHoursPrice,
            servicesPrice,
            totalPrice,
            message: 'Reservation submitted successfully',
        })

    } catch (error) {
        console.error('Booking error:', error)
        return NextResponse.json({
            error: 'Failed to create reservation. Please try again.',
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const payload = await getPayload({ config: configPromise })

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const status = searchParams.get('status') || 'confirmed'

        const where: Record<string, any> = {
            status: { not_equals: 'cancelled' },
        }

        if (date) {
            where['event.date'] = { equals: date }
        }

        if (status !== 'all') {
            where.status = { equals: status }
        }

        const bookings = await payload.find({
            collection: 'auditorium-bookings',
            where,
            sort: '-event.date',
            limit: 100,
        })

        return NextResponse.json({
            success: true,
            bookings: bookings.docs.map(b => ({
                id: b.id,
                bookingId: b.bookingId,
                date: b.event?.date,
                startTime: b.event?.startTime,
                endTime: b.event?.endTime,
                bookerName: b.personal?.fullName,
                eventName: b.event?.name,
                country: b.personal?.countryOfOrigin,
                phone: b.contact?.phoneEgypt,
                whatsapp: b.contact?.whatsappEgypt,
                hallPackage: b.hallRental?.package,
                duration: b.hallRental?.duration,
                afterHoursCount: b.hallRental?.afterHoursCount,
                hallPrice: b.hallRental?.hallPrice,
                afterHoursPrice: b.hallRental?.afterHoursPrice,
                servicesPrice: b.servicesPrice,
                totalPrice: b.totalPrice,
                status: b.status,
                // Include Services
                services: b.services || {},
            })),
        })

    } catch (error) {
        console.error('Get bookings error:', error)
        return NextResponse.json({
            error: 'Failed to fetch bookings',
        }, { status: 500 })
    }
}

// WhatsApp notification helper (GoWA API - Basic Auth)
async function sendWhatsAppNotification({ to, message }: { to: string; message: string }) {
    const endpoint = process.env.WHATSAPP_API_ENDPOINT
    const username = process.env.WHATSAPP_API_USERNAME
    const password = process.env.WHATSAPP_API_PASSWORD

    if (!endpoint || !username || !password) {
        console.error('❌ WhatsApp API not configured (missing WHATSAPP_API_ENDPOINT/USERNAME/PASSWORD)')
        return false
    }

    let phone = to.replace(/[^0-9]/g, '')
    if (phone.startsWith('0')) {
        phone = '20' + phone.slice(1)
    }
    if (!phone.includes('@')) {
        phone += '@s.whatsapp.net'
    }

    try {
        const { default: axios } = await import('axios')
        const response = await axios.post(`${endpoint.replace(/\/$/, '')}/send/message`, {
            phone,
            message,
            is_forwarded: false,
        }, {
            auth: { username, password },
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
            },
            timeout: 30000,
            validateStatus: () => true,
        })

        if (response.status >= 200 && response.status < 300) {
            console.log(`✅ WA notification sent to ${to}`)
            return true
        } else {
            console.error('❌ WhatsApp API error:', response.status, response.data)
            return false
        }
    } catch (error) {
        console.error('❌ WhatsApp send error:', error)
        return false
    }
}
