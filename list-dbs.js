const { MongoClient } = require('mongodb');

async function listDatabases() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log("Databases:");
    dbs.databases.forEach(db => console.log(` - ${db.name}`));
  } finally {
    await client.close();
  }
}

listDatabases();
