import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
    try {
        const payload = await getPayload({ config: await configPromise })
        const dummyBuffer = Buffer.from('Testing R2 upload directly from Payload local API route', 'utf8')

        const media = await payload.create({
            collection: 'media',
            data: { alt: `Test R2 Upload` },
            file: {
                data: dummyBuffer,
                name: 'test-r2-upload.txt',
                mimetype: 'text/plain',
                size: dummyBuffer.length,
            },
        })

        return NextResponse.json({ success: true, media })
    } catch (error: any) {
        console.error('Test upload error:', error)
        return NextResponse.json({ success: false, errorMessage: error.message, errorStack: error.stack }, { status: 500 })
    }
}
