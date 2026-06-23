const { MongoClient } = require('mongodb');

async function copyDatabase() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const sourceDb = client.db('routeTracker');
    const targetDb = client.db('ai_explorer');

    const collections = await sourceDb.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log("No collections found in route-tracking");
      return;
    }

    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`Copying collection: ${colName}`);
      
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      const docs = await sourceCol.find({}).toArray();
      
      if (docs.length > 0) {
        // Optional: clear existing target collection before copying
        await targetCol.deleteMany({});
        await targetCol.insertMany(docs);
        console.log(`Copied ${docs.length} documents to ${colName}`);
        
        // Print one sample document to infer schema
        console.log(`Sample document for ${colName}:`);
        console.log(JSON.stringify(docs[0], null, 2));
      } else {
        console.log(`Collection ${colName} is empty`);
      }
    }
  } catch (error) {
    console.error("Error copying database:", error);
  } finally {
    await client.close();
  }
}

copyDatabase();
