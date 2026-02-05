import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
    slug: 'users',
    admin: {
        useAsTitle: 'email',
        group: 'System',
    },
    auth: true,
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'role',
            type: 'select',
            required: true,
            options: [
                { label: 'Direktur', value: 'direktur' },
                { label: 'Bendahara', value: 'bendahara' },
                { label: 'Sekretaris', value: 'sekretaris' },
                { label: 'BPUPD', value: 'bpupd' },
                { label: 'BPPG', value: 'bppg' },
                { label: 'Staff', value: 'staff' },
            ],
            defaultValue: 'staff',
        },
        {
            name: 'pin',
            type: 'text',
            admin: {
                description: 'PIN untuk akses Bendahara (6 digit)',
                condition: (data) => data?.role === 'bendahara',
            },
        },
        {
            name: 'phoneWA',
            type: 'text',
            admin: {
                description: 'Nomor WhatsApp untuk OTP',
            },
        },
        {
            name: 'deviceId',
            type: 'text',
            admin: {
                description: 'Device ID untuk verifikasi keamanan',
                condition: (data) => data?.role === 'bendahara',
            },
        },
        {
            name: 'otpSecret',
            type: 'text',
            hidden: true,
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'media',
        },
    ],
}
