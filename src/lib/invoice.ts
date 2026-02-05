// Invoice generation service
// Uses template-based generation for now, will integrate with @react-pdf/renderer

export interface InvoiceData {
    invoiceNo: string
    customerName: string
    customerWA: string
    customerEmail?: string
    items: {
        description: string
        quantity: number
        unitPrice: number
        subtotal: number
    }[]
    totalAmount: number
    currency: 'EGP' | 'USD'
    paymentStatus: 'pending' | 'partial' | 'paid'
    createdAt: Date
    dueDate?: Date
    notes?: string
}

export function generateInvoiceNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `INV-${dateStr}-${random}`
}

export function formatCurrency(amount: number, currency: 'EGP' | 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
    }).format(amount)
}

export function createInvoiceData(
    customerName: string,
    customerWA: string,
    items: { description: string; quantity: number; unitPrice: number }[],
    currency: 'EGP' | 'USD' = 'EGP'
): InvoiceData {
    const calculatedItems = items.map(item => ({
        ...item,
        subtotal: item.quantity * item.unitPrice,
    }))

    const totalAmount = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0)

    return {
        invoiceNo: generateInvoiceNumber(),
        customerName,
        customerWA,
        items: calculatedItems,
        totalAmount,
        currency,
        paymentStatus: 'pending',
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
}

export function generateInvoiceText(invoice: InvoiceData): string {
    const itemsText = invoice.items
        .map(item => `• ${item.description} x${item.quantity} = ${formatCurrency(item.subtotal, invoice.currency)}`)
        .join('\n')

    return `
🧾 *INVOICE ${invoice.invoiceNo}*
Wisma Nusantara Cairo

━━━━━━━━━━━━━━━━━━
Kepada: *${invoice.customerName}*
Tanggal: ${invoice.createdAt.toLocaleDateString('id-ID')}
━━━━━━━━━━━━━━━━━━

${itemsText}

━━━━━━━━━━━━━━━━━━
*TOTAL: ${formatCurrency(invoice.totalAmount, invoice.currency)}*
━━━━━━━━━━━━━━━━━━

Status: ⏳ ${invoice.paymentStatus === 'pending' ? 'Menunggu Pembayaran' : invoice.paymentStatus === 'partial' ? 'Dibayar Sebagian' : '✅ Lunas'}

📱 Pembayaran dapat dilakukan via:
• Transfer Bank: [Bank Details]
• InstaPay: [InstaPay ID]

Terima kasih atas kepercayaan Anda! 🙏
Wisma Nusantara Cairo
`.trim()
}

// WhatsApp message templates
export function generateBookingConfirmation(
    customerName: string,
    bookingType: string,
    date: string,
    invoiceNo: string
): string {
    return `
🎉 *Booking Terkonfirmasi!*

Halo *${customerName}*,

Terima kasih telah melakukan booking di Wisma Nusantara Cairo!

📋 Detail Booking:
• Layanan: ${bookingType}
• Tanggal: ${date}
• Invoice: ${invoiceNo}

Invoice akan dikirim dalam pesan berikutnya.

Jika ada pertanyaan, silakan hubungi kami.

Salam hangat,
_Wisma Nusantara Cairo_ 🏨
`.trim()
}

export function generatePaymentReminder(
    customerName: string,
    invoiceNo: string,
    amount: string,
    daysLeft: number
): string {
    return `
⏰ *Pengingat Pembayaran*

Halo *${customerName}*,

Invoice *${invoiceNo}* senilai *${amount}* akan jatuh tempo dalam ${daysLeft} hari.

Mohon segera lakukan pembayaran untuk menghindari pembatalan booking.

Terima kasih! 🙏
`.trim()
}
