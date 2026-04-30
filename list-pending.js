const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://Habibarifin:Habib113333@cluster0.jjasiss.mongodb.net/wisma-nusantara?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('wisma-nusantara');
    const cashflow = database.collection('cashflow');

    const query = { approvalStatus: "pending" };
    const docs = await cashflow.find(query).toArray();
    
    for (const doc of docs) {
       console.log(`ID: ${doc._id}, Desc: ${doc.description}`);
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
