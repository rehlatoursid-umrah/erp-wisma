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
            name: 'amount',
            type: 'number',
            required: true,
        },
        {
            name: 'currency',
            type: 'select',
            options: [
                { label: 'EGP', value: 'EGP' },
                { label: 'USD', value: 'USD' },
            ],
            defaultValue: 'EGP',
        },
        {
            name: 'category',
            type: 'select',
            options: [
                { label: 'Setoran Piket', value: 'piket' },
                { label: 'Petty Cash', value: 'petty' },
                { label: 'Gaji', value: 'salary' },
                { label: 'Operasional', value: 'operational' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Lainnya', value: 'other' },
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
