import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in .env');
}

export const client = new MongoClient(process.env.MONGODB_URI);
export let db: Db;

export async function connectDB(): Promise<void> {
  await client.connect();
  db = client.db('copycutsave-dev');
  console.log('MongoDB connected');
}
