import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
    slug: 'services',
    admin: {
        useAsTitle: 'name',
        group: 'Master Data',
    },
    fields: [
        {
            name: 'category',
            type: 'select',
            required: true,
            options: [
                { label: '🛏️ Hotel', value: 'hotel' },
                { label: '🏠 Homestay', value: 'homestay' },
                { label: '🏢 Aula', value: 'aula' },
                { label: '✈️ Travel', value: 'travel' },
                { label: '📦 Rental', value: 'rental' },
            ],
        },
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'priceUSD',
            type: 'number',
            required: true,
            admin: {
                description: 'Harga dalam USD',
            },
        },
        {
            name: 'priceEGP',
            type: 'number',
            required: true,
            admin: {
                description: 'Harga dalam EGP (Egyptian Pound)',
            },
        },
        {
            name: 'unit',
            type: 'select',
            options: [
                { label: 'Per Malam', value: 'night' },
                { label: 'Per Hari', value: 'day' },
                { label: 'Per Jam', value: 'hour' },
                { label: 'Per Paket', value: 'package' },
                { label: 'Per Item', value: 'item' },
            ],
            defaultValue: 'night',
        },
        {
            name: 'isActive',
            type: 'checkbox',
            defaultValue: true,
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
        },
    ],
}
