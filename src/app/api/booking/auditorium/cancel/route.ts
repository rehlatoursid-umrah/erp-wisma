import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })
        const { bookingId } = await req.json()

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
        }

        console.log(`Cancelling auditorium booking: ${bookingId}`)

        // 1. Find the booking internal ID
        // We support finding by 'bookingId' (custom ID like AULA-...) or internal UUID.

        let internalId = null

        // Try finding by custom bookingId first
        const bookingQuery = await payload.find({
            collection: 'auditorium-bookings',
            where: {
                bookingId: {
                    equals: bookingId
                }
            },
            limit: 1
        })

        if (bookingQuery.docs.length > 0) {
            internalId = bookingQuery.docs[0].id
        } else {
            // Maybe it was already an internal ID?
            const byId = await payload.findByID({
                collection: 'auditorium-bookings',
                id: bookingId,
            }).catch(() => null)

            if (byId) internalId = byId.id
        }

        if (!internalId) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // 2. Update Status to 'cancelled'
        await payload.update({
            collection: 'auditorium-bookings',
            id: internalId,
            data: {
                status: 'cancelled'
            }
        })

        // 3. Find Related Invoices and mark as 'cancelled'
        const invoices = await payload.find({
            collection: 'transactions',
            where: {
                and: [
                    {
                        bookingType: {
                            equals: 'auditorium'
                        }
                    },
                    {
                        'relatedBooking.value': {
                            equals: internalId
                        }
                    }
                ]
            }
        })

        if (invoices.docs.length > 0) {
            console.log(`Found ${invoices.docs.length} related invoices. Marking as cancelled...`)
            for (const invoice of invoices.docs) {
                // Delete related cashflow entries (reverse revenue)
                if (invoice.invoiceNo) {
                    try {
                        const cashflowQuery = await payload.find({
                            collection: 'cashflow',
                            where: {
                                description: {
                                    contains: invoice.invoiceNo
                                }
                            },
                            limit: 1
                        })
                        if (cashflowQuery.docs.length > 0) {
                            await payload.delete({
                                collection: 'cashflow',
                                id: cashflowQuery.docs[0].id
                            })
                        }
                    } catch (e) {
                        console.error('Error deleting cashflow:', e)
                    }
                }

                // Convert invoice into a cancellation fee draft
                await payload.update({
                    collection: 'transactions',
                    id: invoice.id,
                    data: {
                        bookingType: 'cancellation',
                        paymentStatus: 'pending',
                        notes: `Draft Biaya Pembatalan - Booking Aula ${bookingId}`,
                        totalAmount: 0,
                        subtotal: 0,
                        items: [{
                            itemName: 'Biaya Pembatalan',
                            quantity: 1,
                            priceUnit: 0,
                            subtotal: 0
                        }]
                    }
                })
            }
        }

        return NextResponse.json({ success: true, message: 'Booking cancelled and invoices marked as cancelled' })

    } catch (error: any) {
        console.error('Error cancelling booking:', error)
        return NextResponse.json({ error: 'Failed to cancel booking', details: error.message }, { status: 500 })
    }
}
