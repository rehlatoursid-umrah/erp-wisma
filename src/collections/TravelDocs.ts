import type { CollectionConfig } from 'payload'

export const TravelDocs: CollectionConfig = {
    slug: 'travel-docs',
    admin: {
        useAsTitle: 'passengerName',
        group: 'Operations',
        defaultColumns: ['passengerName', 'passportNo', 'visaStatus', 'createdAt'],
    },
    fields: [
        {
            name: 'transaction',
            type: 'relationship',
            relationTo: 'transactions',
        },
        {
            name: 'passengerName',
            type: 'text',
            required: true,
        },
        {
            name: 'passportNo',
            type: 'text',
            required: true,
        },
        {
            name: 'passportExpiry',
            type: 'date',
        },
        {
            name: 'nationality',
            type: 'text',
            defaultValue: 'Indonesia',
        },
        {
            name: 'travelType',
            type: 'select',
            options: [
                { label: 'Umrah', value: 'umrah' },
                { label: 'Haji', value: 'haji' },
                { label: 'Tour', value: 'tour' },
                { label: 'Tiket Only', value: 'ticket' },
            ],
        },
        {
            name: 'visaStatus',
            type: 'select',
            options: [
                { label: '📄 Pending Docs', value: 'pending_docs' },
                { label: '🔄 On Process', value: 'on_process' },
                { label: '✅ Issued', value: 'issued' },
                { label: '❌ Rejected', value: 'rejected' },
            ],
            defaultValue: 'pending_docs',
        },
        {
            name: 'documents',
            type: 'array',
            fields: [
                {
                    name: 'docType',
                    type: 'select',
                    options: [
                        { label: 'Passport Scan', value: 'passport' },
                        { label: 'Photo 4x6', value: 'photo' },
                        { label: 'Visa Copy', value: 'visa' },
                        { label: 'Ticket', value: 'ticket' },
                        { label: 'Other', value: 'other' },
                    ],
                },
                {
                    name: 'file',
                    type: 'upload',
                    relationTo: 'media',
                },
            ],
        },
        {
            name: 'notes',
            type: 'textarea',
        },
    ],
}
