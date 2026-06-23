import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI; // This is the internal App DB
let client;
let clientPromise;

if (!uri) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const dbClient = await clientPromise;
  const dbName = uri.split('/').pop().split('?')[0] || 'ai_explorer_saas';
  return dbClient.db(dbName);
}
