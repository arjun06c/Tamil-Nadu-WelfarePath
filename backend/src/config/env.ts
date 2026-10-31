import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://arjun06c_db_user:admin123@cluster0.qlafckz.mongodb.net/tn_welfarepath?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || 'tn_welfarepath_super_secure_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // DigiLocker Integration Config
  DIGILOCKER_MODE: (process.env.DIGILOCKER_MODE as 'mock' | 'sandbox' | 'production') || 'mock',
  DIGILOCKER_CLIENT_ID: process.env.DIGILOCKER_CLIENT_ID || '',
  DIGILOCKER_CLIENT_SECRET: process.env.DIGILOCKER_CLIENT_SECRET || '',
  DIGILOCKER_REDIRECT_URI: process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:5000/api/integrations/digilocker/callback',
  DIGILOCKER_AUTHORIZATION_URL: process.env.DIGILOCKER_AUTHORIZATION_URL || '',
  DIGILOCKER_TOKEN_URL: process.env.DIGILOCKER_TOKEN_URL || '',
  DIGILOCKER_API_BASE_URL: process.env.DIGILOCKER_API_BASE_URL || '',
  DIGILOCKER_SCOPES: process.env.DIGILOCKER_SCOPES || 'doc_type',
  DIGILOCKER_ENVIRONMENT: process.env.DIGILOCKER_ENVIRONMENT || 'production',
  DIGILOCKER_TIMEOUT_MS: parseInt(process.env.DIGILOCKER_TIMEOUT_MS || '10000', 10)
};
