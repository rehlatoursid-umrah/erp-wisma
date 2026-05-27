import type { CollectionConfig } from 'payload'

export const AssetRooms: CollectionConfig = {
    slug: 'asset-rooms',
    admin: {
        useAsTitle: 'roomName',
        group: 'Inventaris',
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    fields: [
        {
            name: 'floor',
            type: 'number',
            required: true,
            label: 'Lantai',
            min: 1,
            max: 6,
        },
        {
            name: 'roomName',
            type: 'text',
            required: true,
            label: 'Nama Ruangan',
        },
        {
            name: 'roomCode',
            type: 'text',
            required: true,
            unique: true,
            label: 'Kode Ruangan',
            admin: {
                description: 'Kode singkat ruangan (auto-generated, misal: LBY, K101, DPR)',
            },
        },
    ],
}
