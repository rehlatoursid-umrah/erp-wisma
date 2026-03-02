import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const bookingId = params.id

    try {
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
        const { width, height } = page.getSize()

        // Fonts
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // Colors
        const primaryColor = rgb(139 / 255, 69 / 255, 19 / 255) // #8B4513
        const secondaryColor = rgb(229 / 255, 176 / 255, 114 / 255) // #e5b072
        const textColor = rgb(55 / 255, 65 / 255, 81 / 255) // #374151
        const lightGray = rgb(243 / 255, 244 / 255, 246 / 255) // #f3f4f6

        // Header Background
        page.drawRectangle({
            x: 0,
            y: height - 100, // Top margin
            width: width,
            height: 100,
            color: primaryColor,
        })

        // Title
        page.drawText('WISMA NUSANTARA CAIRO', {
            x: width / 2 - 140, // rough center manually
            y: height - 40,
            size: 24,
            font: helveticaBold,
            color: rgb(1, 1, 1),
        })

        page.drawText('Your Home Away from Home', {
            x: width / 2 - 70,
            y: height - 60,
            size: 11,
            font: helvetica,
            color: rgb(1, 1, 1),
        })

        // Booking Info
        page.drawText('BOOKING CONFIRMATION', {
            x: 40,
            y: height - 150,
            size: 16,
            font: helveticaBold,
            color: textColor,
        })

        page.drawText(`Booking ID: ${bookingId}`, { x: 40, y: height - 175, size: 10, font: helvetica, color: textColor })
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 40, y: height - 190, size: 10, font: helvetica, color: textColor })
        page.drawText(`Status: Pending Payment`, { x: 40, y: height - 205, size: 10, font: helvetica, color: textColor })

        // Customer Details Box
        page.drawRectangle({
            x: 40,
            y: height - 280,
            width: width - 80,
            height: 50,
            color: lightGray,
        })

        page.drawText('Customer Details', { x: 50, y: height - 250, size: 11, font: helveticaBold, color: textColor })
        page.drawText('Name: Guest Name', { x: 50, y: height - 265, size: 10, font: helvetica, color: textColor })
        page.drawText('Contact: WhatsApp Number provided', { x: 50, y: height - 280, size: 10, font: helvetica, color: textColor })

        // Simple table stand-in since pdf-lib doesn't have autotable
        const startY = height - 340
        page.drawText('Description', { x: 40, y: startY, size: 11, font: helveticaBold, color: textColor })
        page.drawText('Details', { x: 250, y: startY, size: 11, font: helveticaBold, color: textColor })
        page.drawText('Status', { x: 450, y: startY, size: 11, font: helveticaBold, color: textColor })

        page.drawLine({
            start: { x: 40, y: startY - 10 },
            end: { x: width - 40, y: startY - 10 },
            thickness: 1,
            color: secondaryColor
        })

        const items = [
            ['Hotel Accommodation', '1 Night(s)', 'Pending'],
            ['Room(s) Reserved', 'Refer to Invoice', 'Pending'],
            ['Airport Pickup', 'As requested', 'Pending'],
            ['Meal Package', 'As requested', 'Pending']
        ]

        let currentY = startY - 30
        for (const [desc, details, status] of items) {
            page.drawText(desc, { x: 40, y: currentY, size: 10, font: helvetica, color: textColor })
            page.drawText(details, { x: 250, y: currentY, size: 10, font: helvetica, color: textColor })
            page.drawText(status, { x: 450, y: currentY, size: 10, font: helvetica, color: textColor })
            currentY -= 20
        }

        // Footer
        page.drawLine({
            start: { x: 40, y: currentY - 20 },
            end: { x: width - 40, y: currentY - 20 },
            thickness: 1,
            color: secondaryColor
        })

        page.drawText('Total Amount Due:', { x: 40, y: currentY - 45, size: 12, font: helveticaBold, color: textColor })
        page.drawText('Refer to WhatsApp', { x: width - 150, y: currentY - 45, size: 12, font: helveticaBold, color: primaryColor })

        const termsText = 'This is an auto-generated confirmation receipt. Please present this document along with your valid ID upon check-in. Payment is expected as per the instructions sent to your WhatsApp/Email.'

        page.drawText(termsText, {
            x: 40,
            y: currentY - 80,
            size: 8,
            font: helvetica,
            color: rgb(156 / 255, 163 / 255, 175 / 255),
            maxWidth: width - 80
        })

        const pdfBytes = await pdfDoc.save()

        return new NextResponse(pdfBytes, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Booking-${bookingId}.pdf"`,
            },
        })
    } catch (error) {
        console.error('PDF Generation Error:', error)
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
    }
}
