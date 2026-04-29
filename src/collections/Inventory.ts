import type { CollectionConfig } from 'payload'

export const Inventory: CollectionConfig = {
    slug: 'inventory',
    admin: {
        useAsTitle: 'itemName',
        group: 'BPUPD',
    },
    fields: [
        {
            name: 'itemName',
            type: 'text',
            required: true,
            label: 'Nama Barang / Amenities',
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            label: 'Kategori',
            options: [
                { label: 'Toiletries (Sabun, Sampo, dll)', value: 'toiletries' },
                { label: 'Linen (Handuk, Sprei)', value: 'linen' },
                { label: 'Cleaning Supplies (Alat Kebersihan)', value: 'cleaning' },
                { label: 'F&B (Air Mineral, Kopi, Teh)', value: 'fnb' },
                { label: 'Lainnya', value: 'others' },
            ],
            defaultValue: 'toiletries',
        },
        {
            name: 'currentStock',
            type: 'number',
            required: true,
            label: 'Stok Saat Ini',
            defaultValue: 0,
        },
        {
            name: 'minimumStock',
            type: 'number',
            required: true,
            label: 'Batas Minimum Stok (Warning)',
            defaultValue: 10,
        },
        {
            name: 'unit',
            type: 'select',
            required: true,
            label: 'Satuan',
            options: [
                { label: 'Pcs', value: 'pcs' },
                { label: 'Botol', value: 'botol' },
                { label: 'Box', value: 'box' },
                { label: 'Roll', value: 'roll' },
                { label: 'Pack', value: 'pack' },
                { label: 'Set', value: 'set' },
            ],
            defaultValue: 'pcs',
        },
        {
            name: 'lastRestocked',
            type: 'date',
            label: 'Tanggal Terakhir Restock',
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Detail Kustom / Deskripsi',
        },
    ],
}
