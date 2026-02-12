import type { CollectionConfig } from 'payload'

export const Transactions: CollectionConfig = {
    slug: 'transactions',
    admin: {
        useAsTitle: 'invoiceNo',
        group: 'Operations',
        defaultColumns: ['invoiceNo', 'customerName', 'totalAmount', 'paymentStatus', 'createdAt'],
    },
    fields: [
        {
            name: 'invoiceNo',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'Auto-generated: INV-YYYYMMDD-XXXX',
            },
        },
        {
            name: 'customerName',
            type: 'text',
            required: true,
        },
        {
            name: 'customerWA',
            type: 'text',
            required: true,
            admin: {
                description: 'Nomor WhatsApp pelanggan',
            },
        },
        {
            name: 'customerEmail',
            type: 'email',
        },
        {
            name: 'items',
            type: 'array',
            fields: [
                {
                    name: 'itemName',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'service',
                    type: 'relationship',
                    relationTo: 'services',
                    required: false,
                },
                {
                    name: 'quantity',
                    type: 'number',
                    required: true,
                    defaultValue: 1,
                },
                {
                    name: 'priceUnit',
                    type: 'number',
                    required: true,
                    defaultValue: 0,
                },
                {
                    name: 'subtotal',
                    type: 'number',
                    required: true,
                    defaultValue: 0,
                },
            ],
        },
        {
            name: 'currency',
            type: 'select',
            options: [
                { label: 'USD', value: 'USD' },
                { label: 'EGP', value: 'EGP' },
            ],
            defaultValue: 'EGP',
        },
        {
            name: 'totalAmount',
            type: 'number',
            required: true,
        },
        {
            name: 'paymentStatus',
            type: 'select',
            options: [
                { label: '⏳ Pending', value: 'pending' },
                { label: '💳 Partial', value: 'partial' },
                { label: '✅ Paid', value: 'paid' },
                { label: '❌ Cancelled', value: 'cancelled' },
            ],
            defaultValue: 'pending',
        },
        {
            name: 'paymentMethod',
            type: 'select',
            options: [
                { label: 'Cash', value: 'cash' },
                { label: 'Transfer Bank', value: 'transfer' },
                { label: 'Instapay', value: 'instapay' },
                { label: 'QRIS', value: 'qris' },
            ],
        },
        {
            name: 'officer',
            type: 'relationship',
            relationTo: 'users',
            admin: {
                description: 'Petugas piket yang input transaksi',
            },
        },
        {
            name: 'invoicePdf',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'PDF Invoice yang sudah di-generate',
            },
        },
        {
            name: 'waSent',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Sudah dikirim ke WhatsApp?',
            },
        },
        {
            name: 'notes',
            type: 'textarea',
        },
        // Auto-Invoicing Fields
        {
            name: 'relatedBooking',
            type: 'relationship',
            relationTo: ['hotel-bookings', 'auditorium-bookings', 'travel-docs'],
            admin: {
                description: 'Booking yang berhubungan dengan invoice ini',
            },
        },
        {
            name: 'bookingType',
            type: 'select',
            options: [
                { label: 'Hotel', value: 'hotel' },
                { label: 'Auditorium', value: 'auditorium' },
                { label: 'Visa', value: 'visa_arrival' },
                { label: 'Rental', value: 'rental' },
                { label: 'Manual/Lainnya', value: 'manual' },
            ],
            admin: {
                description: 'Tipe booking/transaksi (untuk auto-cashflow)',
            },
        },
    ],
    hooks: {
        beforeChange: [
            async ({ data, operation }) => {
                if (operation === 'create' && !data.invoiceNo) {
                    const date = new Date()
                    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
                    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
                    data.invoiceNo = `INV-${dateStr}-${random}`
                }
                return data
            },
        ],
    },
}
