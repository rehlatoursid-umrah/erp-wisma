import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const payload = await getPayload({ config: configPromise })

        // Find all cashflow records that are pending and start with "Invoice #"
        const pendingCashflows = await payload.find({
            collection: 'cashflow',
            where: {
                and: [
                    { type: { equals: 'in' } },
                    { approvalStatus: { equals: 'pending' } },
                    { description: { contains: 'Invoice #' } }
                ]
            },
            limit: 5000,
            pagination: false
        })

        let deletedCount = 0;
        for (const doc of pendingCashflows.docs) {
            if ((doc.description || '').startsWith('Invoice #')) {
                await payload.delete({
                    collection: 'cashflow',
                    id: doc.id,
                    overrideAccess: true
                })
                deletedCount++;
            }
        }

        return NextResponse.json({ success: true, message: `Berhasil menghapus ${deletedCount} riwayat kas masuk dari Invoice.` })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
