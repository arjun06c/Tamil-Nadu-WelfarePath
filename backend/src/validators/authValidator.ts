import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  district: z.string().min(2, 'District is required'),
  role: z.enum(['Citizen', 'Officer', 'Admin']).optional().default('Citizen'),
  languagePreference: z.enum(['en', 'ta']).optional().default('en')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
