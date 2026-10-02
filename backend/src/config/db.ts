import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    console.log(`[MongoDB] Attempting connection to Atlas URI...`);
    const conn = await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
  } catch (error: any) {
    console.warn(`\n⚠️ [MongoDB Atlas Auth/Connection Warning]: ${error.message}`);
    console.warn(`⚡ [Auto-Fallback]: Initializing MongoMemoryServer for instant zero-config development...\n`);
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ [MongoDB In-Memory DB] Connected successfully at: ${conn.connection.host}`);
      console.log(`💡 Note: To connect to your MongoDB Atlas cluster, update MONGO_URI in backend/.env with your exact <db_username>.\n`);
    } catch (memErr: any) {
      console.error(`❌ [MongoDB Fatal Error]: Could not start memory server fallback: ${memErr.message}`);
      process.exit(1);
    }
  }
};
