import mongoose from 'mongoose';
import { env } from './env';

let isConnecting = false;

export const connectDB = async (): Promise<void> => {
  // If already connected, reuse existing connection (crucial for Serverless lambdas)
  if ((mongoose.connection.readyState as number) === 1) {
    return;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise((r) => setTimeout(r, 100));
      if ((mongoose.connection.readyState as number) === 1) return;
    }
  }

  isConnecting = true;
  try {
    console.log(`[MongoDB] Attempting connection to Atlas URI...`);
    const conn = await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
  } catch (error: any) {
    console.warn(`\n⚠️ [MongoDB Atlas Auth/Connection Warning]: ${error.message}`);

    // In Vercel serverless environment, in-memory mongodb cannot run
    if (process.env.VERCEL) {
      console.error(`❌ [MongoDB Atlas Error on Vercel]: Please verify MONGO_URI in Vercel Environment Variables. ${error.message}`);
      throw error;
    }

    console.warn(`⚡ [Auto-Fallback]: Initializing MongoMemoryServer for instant zero-config development...\n`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ [MongoDB In-Memory DB] Connected successfully at: ${conn.connection.host}`);
    } catch (memErr: any) {
      console.error(`❌ [MongoDB Fatal Error]: Could not start memory server fallback: ${memErr.message}`);
      process.exit(1);
    }
  } finally {
    isConnecting = false;
  }
};
