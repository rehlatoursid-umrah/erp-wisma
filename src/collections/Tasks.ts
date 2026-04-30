import type { CollectionConfig } from 'payload'

export const Tasks: CollectionConfig = {
    slug: 'tasks',
    admin: {
        useAsTitle: 'title',
        group: 'Operations',
        defaultColumns: ['title', 'category', 'priority', 'status', 'assignee'],
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'category',
            type: 'select',
            options: [
                { label: '📢 General (Piket)', value: 'general' },
                { label: '✈️ BPUPD', value: 'bpupd' },
                { label: '🏠 BPPG', value: 'bppg' },
                { label: '💰 Bendahara', value: 'bendahara' },
                { label: '👔 Direktur', value: 'direktur' },
                { label: '🧹 Housekeeping', value: 'housekeeping' },
                { label: '🔧 Maintenance', value: 'maintenance' },
                { label: '📦 Inventory', value: 'inventory' },
                { label: '📝 Admin', value: 'admin' },
                { label: '📚 PMIK', value: 'pmik' },
            ],
            defaultValue: 'general',
        },
        {
            name: 'priority',
            type: 'select',
            options: [
                { label: '🔴 High', value: 'high' },
                { label: '🟡 Normal', value: 'normal' },
                { label: '🟢 Low', value: 'low' },
            ],
            defaultValue: 'normal',
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: '📋 Pending', value: 'pending' },
                { label: '🔄 In Progress', value: 'in_progress' },
                { label: '✅ Done', value: 'done' },
            ],
            defaultValue: 'pending',
        },
        {
            name: 'relatedRoom',
            type: 'text',
            admin: {
                description: 'Nomor kamar/unit terkait (jika ada)',
            },
        },
        {
            name: 'assignee',
            type: 'relationship',
            relationTo: 'users',
            admin: {
                description: 'PIC BPPG',
            },
        },
        {
            name: 'dueDate',
            type: 'date',
        },
        {
            name: 'completedAt',
            type: 'date',
        },
        {
            name: 'photos',
            type: 'array',
            fields: [
                {
                    name: 'image',
                    type: 'upload',
                    relationTo: 'media',
                },
                {
                    name: 'caption',
                    type: 'text',
                },
            ],
        },
    ],
}
