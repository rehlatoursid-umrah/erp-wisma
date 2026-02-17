import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// POST: Create Invoice
export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })
        const body = await req.json()
        const {
            customerName,
            customerWA,
            items,
            totalAmount,
            currency,
            bookingType,
            relatedBooking,
            paymentStatus,
            paymentMethod,
            notes
        } = body

        // Determine collection slug for polymorphic relationship
        let relationSlug = null;
        if (bookingType === 'hotel') relationSlug = 'hotel-bookings';
        else if (bookingType === 'auditorium') relationSlug = 'auditorium-bookings';
        else if (bookingType === 'visa_arrival') relationSlug = 'travel-docs';

        // Format relatedBooking for polymorphic field
        const formattedRelatedBooking = (relatedBooking && relationSlug)
            ? { relationTo: relationSlug, value: relatedBooking }
            : undefined;

        // Ensure bookingType has a value
        const safeBookingType = bookingType || 'manual';

        // 1. Create Transaction (Invoice)
        const newInvoice = await payload.create({
            collection: 'transactions',
            data: {
                customerName: body.customerName,
                customerWA: body.customerWA,
                bookingType: safeBookingType,
                paymentMethod: body.paymentMethod,

                // New Fields
                invoiceDate: body.invoiceDate || new Date().toISOString(),
                invoiceNo: body.invoiceNo, // Use client-generated or auto-generated
                salesperson: body.salesperson,
                notes: body.notes,

                // Financials
                currency: body.currency || 'EGP',
                totalAmount: body.totalAmount,
                subtotal: body.subtotal,
                discount: body.discount,

                // Complex Items Array
                items: body.items.map((item: any) => ({
                    itemName: item.itemName || 'Item',
                    quantity: Number(item.quantity) || 1,
                    priceUnit: Number(item.priceUnit) || 0,
                    subtotal: Number(item.subtotal) || 0,
                    startDate: undefined,
                    endDate: undefined,
                    service: undefined
                })),

                // REMOVED 'status' field as it does not exist in Transactions schema
                relatedBooking: formattedRelatedBooking,
                paymentStatus: paymentStatus || 'pending',
                waSent: false // Default
            },
            overrideAccess: true // Ensure system can create
        })

        console.log('Invoice created successfully:', newInvoice.id);

        // 2. Update Booking Status if linked (Always to 'confirmed' if invoice created)
        if (relatedBooking && relationSlug) {
            try {
                await payload.update({
                    collection: relationSlug as any,
                    id: relatedBooking,
                    data: { status: 'confirmed' }, // standardized status
                    overrideAccess: true
                })
                console.log('Related booking updated to confirmed.');
            } catch (err) {
                console.error('Failed to update related booking status', err)
            }
        }

        // 3. If Status is PAID, immediately create Cashflow
        if (paymentStatus === 'paid') {
            console.log('Attempting to create Cashflow for paid invoice...');
            try {
                await payload.create({
                    collection: 'cashflow',
                    data: {
                        type: 'in',
                        category: safeBookingType === 'manual' ? 'other' : safeBookingType, // hotel, auditorium, visa_arrival, rental
                        amount: totalAmount,
                        currency: currency || 'EGP',
                        transactionDate: new Date().toISOString(),
                        description: `Invoice #${newInvoice.invoiceNo} - ${customerName}`,
                        proofImage: undefined // Optional for system generated
                    },
                    overrideAccess: true // Ensure system can create
                })
                console.log('Cashflow entry created.');
            } catch (cfError) {
                console.error('Failed to create Cashflow:', cfError);
            }
        }

        return NextResponse.json(newInvoice)
    } catch (error: any) {
        console.error('Detailed Error creating invoice:', error);
        console.error('Error Stack:', error.stack);
        if (error.data) console.error('Payload Error Data:', JSON.stringify(error.data, null, 2));
        return NextResponse.json({ error: 'Failed to create invoice', details: error.message }, { status: 500 })
    }
}

// PATCH: Update Invoice Status (e.g. Mark as Paid)
export async function PATCH(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })
        const body = await req.json()
        const { id, status, paymentMethod } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing ID or Status' }, { status: 400 })
        }

        const currentInvoice = await payload.findByID({
            collection: 'transactions',
            id: id
        })

        if (!currentInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        // Update Invoice
        const updatedInvoice = await payload.update({
            collection: 'transactions',
            id: id,
            data: {
                paymentStatus: status,
                paymentMethod: paymentMethod || currentInvoice.paymentMethod
            }
        })

        // If newly marked as PAID (and wasn't before)
        if (status === 'paid' && currentInvoice.paymentStatus !== 'paid') {
            // Create Cashflow
            await payload.create({
                collection: 'cashflow',
                data: {
                    type: 'in',
                    category: updatedInvoice.bookingType === 'manual' ? 'other' : updatedInvoice.bookingType as any,
                    amount: updatedInvoice.totalAmount,
                    currency: updatedInvoice.currency as any,
                    transactionDate: new Date().toISOString(),
                    description: `Invoice #${updatedInvoice.invoiceNo} - ${updatedInvoice.customerName}`,
                }
            })

            // Update Related Booking
            if (updatedInvoice.relatedBooking && updatedInvoice.bookingType) {
                let relationSlug = null;
                if (updatedInvoice.bookingType === 'hotel') relationSlug = 'hotel-bookings';
                else if (updatedInvoice.bookingType === 'auditorium') relationSlug = 'auditorium-bookings';
                else if (updatedInvoice.bookingType === 'visa_arrival') relationSlug = 'travel-docs';

                if (relationSlug) {
                    // Extract ID if relatedBooking is populated (object), otherwise use it as string
                    const bookingId = typeof updatedInvoice.relatedBooking === 'object'
                        ? (updatedInvoice.relatedBooking as any).id || (updatedInvoice.relatedBooking as any).value
                        : updatedInvoice.relatedBooking;

                    if (bookingId) {
                        await payload.update({
                            collection: relationSlug as any,
                            id: bookingId,
                            data: { status: 'confirmed' }, // standardized status
                            overrideAccess: true
                        })
                    }
                }
            }
        }

        return NextResponse.json(updatedInvoice)

    } catch (error) {
        console.error('Error updating invoice:', error)
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
    }
}

// DELETE: Delete Invoice and Cascade to Cashflow
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const payload = await getPayload({ config: configPromise })

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
        }

        // 1. Get the invoice details first (to find related cashflow)
        const invoice = await payload.findByID({
            collection: 'transactions',
            id: id,
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        // 2. Cascade Delete: Remove associated Cashflow if it exists
        // We link via description: "Invoice #INV-..."
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
                        id: cashflowQuery.docs[0].id,
                        overrideAccess: true
                    })
                    console.log(`Cascade delete: Cashflow for invoice ${invoice.invoiceNo} deleted.`)
                }
            } catch (cfError) {
                console.error('Error deleting associated cashflow:', cfError)
            }
        }

        // 3. Delete the transaction
        await payload.delete({
            collection: 'transactions',
            id: id,
            overrideAccess: true
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting invoice:', error)
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
    }
}
