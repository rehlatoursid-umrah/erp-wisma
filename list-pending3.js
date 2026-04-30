const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://Habibarifin:Habib113333@cluster0.jjasiss.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('wisma-nusantara');
    const cashflow = database.collection('cashflow');

    // List all cashflow to see what's in there
    const docs = await cashflow.find({ approvalStatus: 'pending' }).toArray();
    console.log(`Found ${docs.length} pending cashflow documents`);
    for (const doc of docs) {
      console.log(`ID: ${doc._id}, Desc: ${doc.description}, type: ${doc.type}, status: ${doc.approvalStatus}`);
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
