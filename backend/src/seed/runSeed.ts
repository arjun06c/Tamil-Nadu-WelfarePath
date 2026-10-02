import { connectDB } from '../config/db';
import { seedDatabase } from './seedData';

const run = async () => {
  await connectDB();
  await seedDatabase();
  process.exit(0);
};

run();
