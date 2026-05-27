import type { CollectionConfig } from 'payload'

export const AssetInventory: CollectionConfig = {
    slug: 'asset-inventory',
    admin: {
        useAsTitle: 'itemName',
        group: 'Inventaris',
        defaultColumns: ['inventoryCode', 'itemName', 'brand', 'quantity', 'priceEGP', 'condition', 'floor'],
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    fields: [
        {
            name: 'inventoryCode',
            type: 'text',
            required: true,
            unique: true,
            label: 'Kode Inventaris',
            admin: {
                description: 'Auto-generated: LT[lantai]-[KODE_RUANGAN]-[NOMOR]',
                readOnly: true,
            },
        },
        {
            name: 'floor',
            type: 'number',
            required: true,
            label: 'Lantai',
            min: 1,
            max: 5,
        },
        {
            name: 'room',
            type: 'relationship',
            relationTo: 'asset-rooms',
            required: true,
            label: 'Ruangan',
        },
        {
            name: 'yearAcquired',
            type: 'number',
            required: true,
            label: 'Tahun Pengadaan',
            min: 2000,
            max: 2100,
        },
        {
            name: 'itemName',
            type: 'text',
            required: true,
            label: 'Nama Barang',
        },
        {
            name: 'brand',
            type: 'text',
            label: 'Merek',
        },
        {
            name: 'quantity',
            type: 'number',
            required: true,
            label: 'Jumlah Barang',
            min: 1,
            defaultValue: 1,
        },
        {
            name: 'priceEGP',
            type: 'number',
            required: true,
            label: 'Harga per Unit (EGP)',
            min: 0,
        },
        {
            name: 'exchangeRate',
            type: 'number',
            required: true,
            label: 'Kurs EGP → IDR',
            min: 0,
            defaultValue: 4900,
            admin: {
                description: 'Kurs konversi saat pencatatan (misal 4900 = 1 EGP = Rp 4.900)',
            },
        },
        {
            name: 'priceIDR',
            type: 'number',
            label: 'Harga per Unit (IDR)',
            admin: {
                readOnly: true,
                description: 'Auto-calculated: priceEGP × exchangeRate',
            },
        },
        {
            name: 'totalValueEGP',
            type: 'number',
            label: 'Total Nilai (EGP)',
            admin: {
                readOnly: true,
                description: 'Auto-calculated: priceEGP × quantity',
            },
        },
        {
            name: 'totalValueIDR',
            type: 'number',
            label: 'Total Nilai (IDR)',
            admin: {
                readOnly: true,
                description: 'Auto-calculated: totalValueEGP × exchangeRate',
            },
        },
        {
            name: 'condition',
            type: 'select',
            required: true,
            label: 'Kondisi',
            options: [
                { label: '🟢 Baik', value: 'baik' },
                { label: '🔴 Rusak', value: 'rusak' },
            ],
            defaultValue: 'baik',
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Keterangan Barang',
        },
        {
            name: 'photo',
            type: 'upload',
            relationTo: 'media',
            label: 'Foto Barang',
        },
    ],
    hooks: {
        beforeChange: [
            ({ data }) => {
                if (data) {
                    const egp = data.priceEGP || 0
                    const rate = data.exchangeRate || 4900
                    const qty = data.quantity || 1
                    data.priceIDR = Math.round(egp * rate)
                    data.totalValueEGP = egp * qty
                    data.totalValueIDR = Math.round(egp * qty * rate)
                }
                return data
            },
        ],
    },
}
