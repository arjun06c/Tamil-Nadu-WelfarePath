import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://admin:Y1vUvjLSTeTVi0RO@cluster0.qlafckz.mongodb.net/tn_welfarepath?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || 'tn_welfarepath_super_secure_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
