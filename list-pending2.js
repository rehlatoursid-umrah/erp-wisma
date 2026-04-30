const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://Habibarifin:Habib113333@cluster0.jjasiss.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    // Try to list all databases to find the right one
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log(dbs.databases.map(d => d.name));
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
