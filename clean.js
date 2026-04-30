const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://Habibarifin:Habib113333@cluster0.jjasiss.mongodb.net/wisma-nusantara?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('wisma-nusantara');
    const cashflow = database.collection('cashflow');

    // Delete documents where type="in", approvalStatus="pending", and description starts with "Invoice #"
    const query = {
      type: "in",
      approvalStatus: "pending",
      description: { $regex: /^Invoice #/ }
    };

    const result = await cashflow.deleteMany(query);
    console.log("Deleted " + result.deletedCount + " documents");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
