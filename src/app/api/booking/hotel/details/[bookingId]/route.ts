import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ bookingId: string }> }
) {
    try {
        const params = await props.params;
        const bookingId = params?.bookingId

        if (!bookingId) {
            return NextResponse.json({ success: false, error: 'Missing booking ID' }, { status: 400 })
        }

        const payload = await getPayload({ config })

        const bookings = await payload.find({
            collection: 'hotel-bookings',
            where: {
                bookingId: {
                    equals: bookingId,
                },
            },
            depth: 1, // Get related guest details if any
        })

        if (!bookings.docs || bookings.docs.length === 0) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        const booking = bookings.docs[0]

        return NextResponse.json({ success: true, booking })
    } catch (error: any) {
        console.error('Error fetching booking details:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
