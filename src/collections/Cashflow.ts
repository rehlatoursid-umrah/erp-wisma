import type { CollectionConfig } from 'payload'

export const Cashflow: CollectionConfig = {
    slug: 'cashflow',
    admin: {
        useAsTitle: 'description',
        group: 'Finance',
        defaultColumns: ['description', 'type', 'amount', 'category', 'approvalStatus', 'createdAt'],
    },
    access: {
        read: ({ req: { user } }) => {
            if (!user) return false
            return ['bendahara', 'direktur'].includes(user.role as string)
        },
        create: ({ req: { user } }) => {
            if (!user) return false
            return ['bendahara', 'sekretaris', 'bppg'].includes(user.role as string)
        },
        update: ({ req: { user } }) => {
            if (!user) return false
            return user.role === 'bendahara'
        },
    },
    fields: [
        {
            name: 'type',
            type: 'select',
            required: true,
            options: [
                { label: '💰 Income', value: 'in' },
                { label: '💸 Expense', value: 'out' },
            ],
        },
        {
            name: 'quantity',
            type: 'number',
            admin: {
                description: 'Jumlah barang/jasa (opsional)',
            },
        },
        {
            name: 'unitPrice',
            type: 'number',
            admin: {
                description: 'Harga satuan (opsional)',
            },
        },
        {
            name: 'amount',
            type: 'number',
            required: true,
            admin: {
                description: 'Total (Otomatis atau Manual)',
            },
        },
        {
            name: 'transactionDate',
            type: 'date',
            required: true,
            defaultValue: () => new Date().toISOString(),
            admin: {
                date: { pickerAppearance: 'dayAndTime' },
                description: 'Tanggal transaksi (bisa diubah sesuai waktu kejadian nyata)',
            },
        },
        {
            name: 'currency',
            type: 'select',
            options: [
                { label: 'EGP', value: 'EGP' },
                { label: 'USD', value: 'USD' },
                { label: 'IDR', value: 'IDR' },
                { label: 'EUR', value: 'EUR' },
            ],
            defaultValue: 'EGP',
        },
        {
            name: 'category',
            type: 'select',
            options: [
                // Pendapatan
                { label: '🏨 Hotel (Income)', value: 'hotel' },
                { label: '🏛️ Auditorium (Income)', value: 'auditorium' },
                { label: '✈️ Visa On Arrival', value: 'visa_arrival' },
                { label: '🚗 Rental/Services', value: 'rental' },
                // Dana Taktis
                { label: '💰 Dana dari Bendahara (Debit)', value: 'treasurer_funding' },
                // Pengeluaran
                { label: '📦 Stok Hotel', value: 'stock_hotel' },
                { label: '📦 Stok Aula', value: 'stock_aula' },
                { label: '📦 Stok Visa', value: 'stock_visa' },
                { label: '🛠️ Operasional Umum', value: 'operational' },
                { label: '💵 Gaji / Honor', value: 'salary' },
                { label: '🔹 Lainnya', value: 'other' },
            ],
        },
        {
            name: 'description',
            type: 'text',
            required: true,
        },
        {
            name: 'transaction',
            type: 'relationship',
            relationTo: 'transactions',
            admin: {
                description: 'Transaksi terkait (jika ada)',
            },
        },
        {
            name: 'proofImage',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Bukti transfer/kwitansi',
            },
        },
        {
            name: 'approvalStatus',
            type: 'select',
            options: [
                { label: '⏳ Pending', value: 'pending' },
                { label: '✅ Approved', value: 'approved' },
                { label: '❌ Rejected', value: 'rejected' },
            ],
            defaultValue: 'pending',
        },
        {
            name: 'approvedBy',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'approvedAt',
            type: 'date',
        },
        {
            name: 'notes',
            type: 'textarea',
        },
    ],
}
