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
        {
            name: 'responsibleDivision',
            type: 'select',
            required: true,
            label: 'Divisi Penanggung Jawab',
            options: [
                { label: '🏠 BPPG', value: 'bppg' },
                { label: '✈️ BPUPD', value: 'bpupd' },
                { label: '🏛️ BPH', value: 'bph' },
                { label: '📚 PMIK', value: 'pmik' },
            ],
            defaultValue: 'bppg',
            admin: {
                description: 'Divisi yang bertanggung jawab atas inventaris di ruangan ini',
            },
        },
    ],
}
