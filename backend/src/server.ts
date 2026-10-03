import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import schemeRoutes from './routes/schemeRoutes';
import applicationRoutes from './routes/applicationRoutes';
import adminRoutes from './routes/adminRoutes';
import assistantRoutes from './routes/assistantRoutes';
import miscRoutes from './routes/miscRoutes';
import digilockerRoutes from './routes/digilockerRoutes';
import { errorHandler } from './middleware/errorHandler';
import { seedDatabase } from './seed/seedData';
import { WelfareDomain } from './models/WelfareDomain';

const app: Application = express();

// Core Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Headers Middleware
app.use((req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    system: 'Tamil Nadu WelfarePath API Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/integrations/digilocker', digilockerRoutes);

// Global Error Handler
app.use(errorHandler);

// Connect Database & Start Server
const startServer = async () => {
  await connectDB();

  // Auto-seed if database is unpopulated
  const count = await WelfareDomain.countDocuments();
  if (count === 0) {
    console.log('[Auto-Seed] Initializing master database records...');
    await seedDatabase();
  }

  app.listen(env.PORT, () => {
    console.log(`========================================================`);
    console.log(`🚀 Tamil Nadu WelfarePath API Server Running!`);
    console.log(`📡 PORT: http://localhost:${env.PORT}`);
    console.log(`🌍 ENVIRONMENT: ${env.NODE_ENV}`);
    console.log(`========================================================`);
  });
};

startServer();
