import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
    slug: 'media',
    admin: {
        group: 'System',
    },
    access: {
        read: () => true,
    },
    upload: {
        staticDir: 'media',
        mimeTypes: ['image/*', 'application/pdf'],
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
        },
    ],
}
