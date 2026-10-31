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
import citizenRoutes from './routes/citizenRoutes';
import officerReportRoutes from './routes/officerReportRoutes';
import { errorHandler } from './middleware/errorHandler';
import { seedDatabase } from './seed/seedData';
import { WelfareDomain } from './models/WelfareDomain';
import { User } from './models/User';
import { Application as ApplicationModel } from './models/Application';

import path from 'path';
import documentRoutes from './routes/documentRoutes';

const app: Application = express();

// Core Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static Document Storage & Mock Assets
const uploadStaticDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadStaticDir));
app.use('/mock-documents', express.static(path.join(__dirname, '../public/mock-documents')));
app.use('/api/documents/static', express.static(path.join(__dirname, '../public/mock-documents')));

// Security Headers Middleware
app.use((req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
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
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/integrations/digilocker', digilockerRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/officer/reports', officerReportRoutes);
app.use('/api/admin/reports', officerReportRoutes);

// Ensure DB connection for serverless requests
let dbInitPromise: Promise<void> | null = null;
const ensureDB = async () => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await connectDB();
      try {
        const domainCount = await WelfareDomain.countDocuments();
        const userCount = await User.countDocuments();
        const appCount = await ApplicationModel.countDocuments();
        if (domainCount === 0 || userCount === 0 || appCount < 10) {
          console.log('[Auto-Seed] Initializing master database & default user accounts...');
          await seedDatabase();
        }
      } catch (seedErr) {
        console.warn('[Auto-Seed Warning]:', seedErr);
      }
    })();
  }
  return dbInitPromise;
};

app.use(async (_req: Request, _res: Response, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Global Error Handler
app.use(errorHandler);

// Connect Database & Start Server for local/persistent environments
const startServer = async () => {
  await ensureDB();

  app.listen(env.PORT, () => {
    console.log(`========================================================`);
    console.log(`🚀 Tamil Nadu WelfarePath API Server Running!`);
    console.log(`📡 PORT: http://localhost:${env.PORT}`);
    console.log(`🌍 ENVIRONMENT: ${env.NODE_ENV}`);
    console.log(`========================================================`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
