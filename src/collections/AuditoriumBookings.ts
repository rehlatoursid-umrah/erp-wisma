import type { CollectionConfig } from 'payload'

export const AuditoriumBookings: CollectionConfig = {
    slug: 'auditorium-bookings',
    admin: {
        useAsTitle: 'bookingId',
        defaultColumns: ['bookingId', 'event.name', 'personal.fullName', 'event.date', 'status'],
        group: 'Operations',
    },
    access: {
        read: () => true,
        create: () => true,
    },
    fields: [
        {
            name: 'bookingId',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'Auto-generated booking ID',
            },
        },
        // Personal Information
        {
            type: 'group',
            name: 'personal',
            label: 'Personal Information',
            fields: [
                {
                    name: 'fullName',
                    type: 'text',
                    required: true,
                    label: 'Full Name',
                },
                {
                    name: 'countryOfOrigin',
                    type: 'text',
                    required: true,
                    label: 'Country of Origin',
                },
            ],
        },
        // Event Details
        {
            type: 'group',
            name: 'event',
            label: 'Event Details',
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    label: 'Event Name',
                },
                {
                    name: 'date',
                    type: 'date',
                    required: true,
                    label: 'Event Date',
                    admin: {
                        date: {
                            pickerAppearance: 'dayOnly',
                            displayFormat: 'd MMMM yyyy',
                        },
                    },
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'startTime',
                            type: 'text',
                            required: true,
                            label: 'Start Time',
                            admin: { width: '50%', placeholder: '09:00' },
                        },
                        {
                            name: 'endTime',
                            type: 'text',
                            required: true,
                            label: 'End Time',
                            admin: { width: '50%', placeholder: '12:00' },
                        },
                    ],
                },
            ],
        },
        // Contact Information
        {
            type: 'group',
            name: 'contact',
            label: 'Contact Information',
            fields: [
                {
                    name: 'phoneEgypt',
                    type: 'text',
                    required: true,
                    label: 'Phone Number (Egypt)',
                    admin: { placeholder: '01xxxxxxxxx' },
                },
                {
                    name: 'whatsappEgypt',
                    type: 'text',
                    required: true,
                    label: 'WhatsApp Number (Egypt)',
                    admin: { placeholder: '01xxxxxxxxx' },
                },
            ],
        },
        // Hall Rental
        {
            type: 'group',
            name: 'hallRental',
            label: 'Hall Rental',
            fields: [
                {
                    name: 'package',
                    type: 'select',
                    label: 'Package (Auto-detected)',
                    options: [
                        { label: '4 Hours - 420 EGP', value: '4h' },
                        { label: '9 Hours - 900 EGP', value: '9h' },
                        { label: '12 Hours - 1,100 EGP', value: '12h' },
                        { label: 'Full Day (14h) - 1,250 EGP', value: '14h' },
                    ],
                },
                {
                    name: 'duration',
                    type: 'number',
                    label: 'Duration (hours)',
                    admin: { readOnly: true },
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'afterHoursCount',
                            type: 'number',
                            label: 'After Hours Count (22:00-07:00)',
                            defaultValue: 0,
                            admin: { width: '50%', readOnly: true },
                        },
                        {
                            name: 'extraHours',
                            type: 'number',
                            label: 'Extra Hours (Admin - Late Checkout)',
                            defaultValue: 0,
                            admin: {
                                width: '50%',
                                description: '+115 EGP/hour for late checkout'
                            },
                        },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'hallPrice',
                            type: 'number',
                            label: 'Hall Rental Price (EGP)',
                            admin: { width: '50%', readOnly: true },
                        },
                        {
                            name: 'afterHoursPrice',
                            type: 'number',
                            label: 'After Hours Price (EGP)',
                            admin: { width: '50%', readOnly: true },
                        },
                    ],
                },
            ],
        },
        // Additional Services
        {
            type: 'group',
            name: 'services',
            label: 'Additional Services',
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'acOption',
                            type: 'select',
                            label: 'Air Conditioning',
                            admin: { width: '50%' },
                            options: [
                                { label: 'No AC', value: '' },
                                { label: '4-6 hours - 150 EGP', value: '4-6' },
                                { label: '7-9 hours - 200 EGP', value: '7-9' },
                                { label: '10-12 hours - 300 EGP', value: '10-12' },
                                { label: '13-14 hours - 350 EGP', value: '13-14' },
                            ],
                        },
                        {
                            name: 'chairOption',
                            type: 'select',
                            label: 'Chairs',
                            admin: { width: '50%' },
                            options: [
                                { label: 'No chairs', value: '' },
                                { label: '3 chairs - 75 EGP', value: '3' },
                                { label: '5 chairs - 120 EGP', value: '5' },
                                { label: '7 chairs - 160 EGP', value: '7' },
                                { label: '10 chairs - 210 EGP', value: '10' },
                                { label: '15 chairs - 300 EGP', value: '15' },
                                { label: '20 chairs - 380 EGP', value: '20' },
                                { label: '30 chairs - 540 EGP', value: '30' },
                                { label: '40 chairs - 680 EGP', value: '40' },
                            ],
                        },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'projectorScreen',
                            type: 'select',
                            label: 'Projector & Screen',
                            admin: { width: '50%' },
                            options: [
                                { label: 'None', value: '' },
                                { label: 'Projector only - 250 EGP', value: 'projector' },
                                { label: 'Screen only - 75 EGP', value: 'screen' },
                                { label: 'Projector & Screen - 275 EGP', value: 'both' },
                            ],
                        },
                        {
                            name: 'tableOption',
                            type: 'select',
                            label: 'Tables',
                            admin: { width: '50%' },
                            options: [
                                { label: 'No tables', value: '' },
                                { label: '3 tables - 140 EGP', value: '3' },
                                { label: '6 tables - 240 EGP', value: '6' },
                                { label: '9 tables - 300 EGP', value: '9' },
                                { label: 'More than 9 (ask availability)', value: 'more' },
                            ],
                        },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'plateOption',
                            type: 'select',
                            label: 'Plates',
                            admin: { width: '50%' },
                            options: [
                                { label: 'No plates', value: '' },
                                { label: '6 plates - 60 EGP', value: '6' },
                                { label: '12 plates - 110 EGP', value: '12' },
                                { label: '18 plates - 160 EGP', value: '18' },
                                { label: '24 plates - 200 EGP', value: '24' },
                            ],
                        },
                        {
                            name: 'glassOption',
                            type: 'select',
                            label: 'Glasses',
                            admin: { width: '50%' },
                            options: [
                                { label: 'No glasses', value: '' },
                                { label: '3 glasses - 20 EGP', value: '3' },
                                { label: '6 glasses - 35 EGP', value: '6' },
                                { label: '12 glasses - 60 EGP', value: '12' },
                            ],
                        },
                    ],
                },
            ],
        },
        // Pricing
        {
            name: 'servicesPrice',
            type: 'number',
            label: 'Services Price (EGP)',
            admin: {
                position: 'sidebar',
                readOnly: true,
            },
        },
        {
            name: 'totalPrice',
            type: 'number',
            label: 'Total Price (EGP)',
            admin: {
                position: 'sidebar',
                readOnly: true,
            },
        },
        // Status
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Completed', value: 'completed' },
            ],
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'notes',
            type: 'textarea',
            label: 'Admin Notes',
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'confirmedAt',
            type: 'date',
            admin: {
                position: 'sidebar',
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },
    ],
    timestamps: true,
    hooks: {
        beforeChange: [
            ({ data, operation }) => {
                // Auto-generate booking ID on create
                if (operation === 'create' && !data.bookingId) {
                    const date = new Date()
                    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
                    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
                    data.bookingId = `AULA-${dateStr}-${random}`
                }
                return data
            },
        ],
    },
}
