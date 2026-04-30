import { getPayload } from 'payload'
import configPromise from './src/payload.config'

async function run() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Find all cashflow records that are pending and start with "Invoice #"
    const pendingCashflows = await payload.find({
      collection: 'cashflow',
      where: {
        and: [
          { type: { equals: 'in' } },
          { approvalStatus: { equals: 'pending' } },
          { description: { like: 'Invoice #' } }
        ]
      },
      limit: 1000,
    })

    console.log(`Found ${pendingCashflows.totalDocs} pending invoice cashflows to delete.`)

    for (const doc of pendingCashflows.docs) {
      await payload.delete({
        collection: 'cashflow',
        id: doc.id,
      })
      console.log(`Deleted cashflow ${doc.id} - ${doc.description}`)
    }

    console.log("Cleanup complete!")
  } catch (error) {
    console.error(error)
  }
  process.exit(0)
}

run()
