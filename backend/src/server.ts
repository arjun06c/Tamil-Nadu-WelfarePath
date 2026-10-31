import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
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

// Ensure DB connection for serverless requests (Must run BEFORE API routes)
let isSeeding = false;
const ensureDB = async () => {
  if ((mongoose.connection.readyState as number) !== 1) {
    await connectDB();
  }
  if (!isSeeding) {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        isSeeding = true;
        console.log('[Auto-Seed] Initializing master database & default user accounts...');
        await seedDatabase();
      }
    } catch (seedErr) {
      console.warn('[Auto-Seed Warning]:', seedErr);
    } finally {
      isSeeding = false;
    }
  }
};

app.use(async (_req: Request, _res: Response, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Root Landing Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    message: 'Tamil Nadu WelfarePath API Server is Live & Healthy!',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    system: 'Tamil Nadu WelfarePath API Engine',
    dbState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Explicit Database Seed Endpoint
app.get('/api/seed', async (_req: Request, res: Response) => {
  try {
    await ensureDB();
    await seedDatabase();
    res.status(200).json({
      status: 'OK',
      message: 'Master database and demo user accounts seeded successfully!',
      credentials: {
        admin: { email: 'admin@tnwelfare.gov.in', password: 'Admin@123' },
        officer: { email: 'officer@tnwelfare.gov.in', password: 'Officer@123' },
        citizen: { email: 'citizen@gmail.com', password: 'Citizen@123' }
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
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
