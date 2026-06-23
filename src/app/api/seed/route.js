import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  console.warn("Please add your MONGODB_URI to .env.local");
} else {
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
}

const mockData = [
  { name: "Alice Smith", age: 28, city: "New York", isActive: true, role: "user" },
  { name: "Bob Jones", age: 34, city: "San Francisco", isActive: false, role: "admin" },
  { name: "Charlie Brown", age: 22, city: "New York", isActive: true, role: "user" },
  { name: "Diana Prince", age: 30, city: "London", isActive: true, role: "admin" },
  { name: "Ethan Hunt", age: 45, city: "Paris", isActive: false, role: "user" }
];

export async function GET(req) {
  try {
    if (!clientPromise) {
      return NextResponse.json({ error: "MongoDB is not configured. Please add MONGODB_URI to .env.local" }, { status: 500 });
    }

    const dbClient = await clientPromise;
    const dbName = uri.split('/').pop().split('?')[0] || 'ai_explorer';
    const db = dbClient.db(dbName);
    const collection = db.collection('users');

    // Clear existing mock data
    await collection.deleteMany({});
    
    // Insert new mock data
    const result = await collection.insertMany(mockData);

    return NextResponse.json({ 
      message: "Successfully seeded the database with mock users", 
      count: result.insertedCount 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
