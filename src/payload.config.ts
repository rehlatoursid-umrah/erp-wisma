import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Services } from './collections/Services'
import { Transactions } from './collections/Transactions'
import { TravelDocs } from './collections/TravelDocs'
import { Tasks } from './collections/Tasks'
import { Cashflow } from './collections/Cashflow'
import { Media } from './collections/Media'
import { AuditoriumBookings } from './collections/AuditoriumBookings'
import { HotelBookings } from './collections/HotelBookings'
import { LaporanPiket } from './collections/LaporanPiket'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const getMongoUri = () => {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/win-os'
    if (uri && !uri.startsWith('mongodb+srv://')) {
        const params = []
        if (!uri.includes('directConnection=true')) params.push('directConnection=true')
        if (!uri.includes('authSource=admin')) params.push('authSource=admin')

        if (params.length > 0) {
            uri = uri.includes('?')
                ? `${uri}&${params.join('&')}`
                : `${uri}?${params.join('&')}`
        }
    }
    return uri
}

export default buildConfig({
    admin: {
        user: Users.slug,
        meta: {
            titleSuffix: '- Operational System Wisma Nusantara Cairo',
        },
        // ogImage: '/og-image.png',
    },
    collections: [
        Users,
        Services,
        Transactions,
        TravelDocs,
        Tasks,
        Cashflow,
        Media,
        AuditoriumBookings,
        HotelBookings,
        LaporanPiket,
    ],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: mongooseAdapter({
        url: getMongoUri(),
    }),
    plugins: [
        s3Storage({
            collections: {
                media: {
                    prefix: 'media',
                },
            },
            bucket: process.env.R2_BUCKET || 'wisma-erp',
            config: {
                credentials: {
                    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
                },
                region: 'auto',
                endpoint: process.env.R2_ENDPOINT || '',
                forcePathStyle: true,
            },
        }),
    ],
    sharp,
})
