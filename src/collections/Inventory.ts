import type { CollectionConfig } from 'payload'

export const Inventory: CollectionConfig = {
    slug: 'inventory',
    admin: {
        useAsTitle: 'itemName',
        group: 'Operations',
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    fields: [
        {
            name: 'division',
            type: 'select',
            required: true,
            label: 'Divisi',
            options: [
                { label: 'BPUPD', value: 'bpupd' },
                { label: 'BPPG', value: 'bppg' },
            ],
            defaultValue: 'bpupd',
        },
        {
            name: 'itemName',
            type: 'text',
            required: true,
            label: 'Nama Barang',
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            label: 'Kategori',
            options: [
                { label: 'Toiletries (Sabun, Sampo)', value: 'toiletries' },
                { label: 'Linen (Handuk, Sprei)', value: 'linen' },
                { label: 'Cleaning Supplies (Alat Kebersihan)', value: 'cleaning' },
                { label: 'F&B (Air Mineral, Kopi)', value: 'fnb' },
                { label: 'Peralatan Tukang (Tools)', value: 'tools' },
                { label: 'Material Bangunan (Materials)', value: 'materials' },
                { label: 'Elektronik & Kelistrikan', value: 'electrical' },
                { label: 'Pipa & Saluran (Plumbing)', value: 'plumbing' },
                { label: 'Lainnya', value: 'others' },
            ],
            defaultValue: 'toiletries',
        },
        {
            name: 'inventoryType',
            type: 'select',
            label: 'Tipe Inventaris',
            options: [
                { label: 'Barang Habis Pakai (Consumable)', value: 'consumable' },
                { label: 'Aset Tetap (Asset)', value: 'asset' },
            ],
            defaultValue: 'consumable',
            admin: {
                condition: (data) => data.division === 'bppg'
            }
        },
        {
            name: 'currentStock',
            type: 'number',
            required: true,
            label: 'Stok Saat Ini (Total)',
            defaultValue: 0,
        },
        {
            name: 'minimumStock',
            type: 'number',
            required: true,
            label: 'Batas Minimum Stok',
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
                { label: 'Meter', value: 'meter' },
                { label: 'Kg', value: 'kg' },
            ],
            defaultValue: 'pcs',
        },
        {
            name: 'condition',
            type: 'group',
            label: 'Kondisi Barang',
            admin: {
                condition: (data) => data.inventoryType === 'asset'
            },
            fields: [
                { name: 'good', type: 'number', label: 'Bagus', defaultValue: 0 },
                { name: 'broken', type: 'number', label: 'Rusak', defaultValue: 0 },
                { name: 'lost', type: 'number', label: 'Hilang', defaultValue: 0 },
            ]
        },
        {
            name: 'setDetails',
            type: 'array',
            label: 'Rincian Isi Set',
            admin: {
                condition: (data) => data.unit === 'set'
            },
            fields: [
                { name: 'itemName', type: 'text', label: 'Nama Item (misal: Kunci 10mm)', required: true },
                { name: 'quantity', type: 'number', label: 'Jumlah', required: true, defaultValue: 1 },
                {
                    name: 'status',
                    type: 'select',
                    label: 'Status',
                    options: [
                        { label: 'Ada (Bagus)', value: 'good' },
                        { label: 'Rusak', value: 'broken' },
                        { label: 'Hilang', value: 'missing' },
                    ],
                    defaultValue: 'good'
                }
            ]
        },
        {
            name: 'lastRestocked',
            type: 'date',
            label: 'Tanggal Terakhir Restock',
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Detail / Catatan',
        },
    ],
}
