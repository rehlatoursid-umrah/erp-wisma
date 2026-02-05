import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        meta: {
            titleSuffix: '- WIN-OS',
            // favicon: '/favicon.ico',
            // ogImage: '/og-image.png',
        },
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
    ],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me',
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: mongooseAdapter({
        url: process.env.MONGODB_URI || 'mongodb://localhost:27017/win-os',
    }),
    sharp,
})
