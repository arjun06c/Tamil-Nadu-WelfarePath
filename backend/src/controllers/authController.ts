import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { CitizenProfile } from '../models/CitizenProfile';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (id: string, role: UserRole, email: string, name: string, district?: string): string => {
  return jwt.sign({ id, role, email, name, district }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const { name, email, mobile, password, district, role, languagePreference } = parseResult.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'A user with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      passwordHash,
      role: role as UserRole,
      district,
      languagePreference: languagePreference || 'en'
    });

    // If registered as Citizen, create default CitizenProfile record
    if (user.role === UserRole.CITIZEN) {
      await CitizenProfile.create({
        userId: user._id,
        dob: new Date('2000-01-01'),
        gender: 'Female',
        district: user.district,
        taluk: '',
        villageTown: '',
        annualIncome: 150000,
        occupation: '',
        employmentStatus: 'Student',
        educationLevel: 'Undergraduate',
        socialCategory: 'BC',
        disabilityStatus: false,
        disabilityPercentage: 0,
        isFarmer: false,
        isUnorganizedWorker: false,
        govtSchoolYears6To12: false,
        familyMembersCount: 4,
        dependentsCount: 2
      });
    }

    const token = generateToken(user._id.toString(), user.role, user.email, user.name, user.district);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        district: user.district,
        languagePreference: user.languagePreference
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user._id.toString(), user.role, user.email, user.name, user.district);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        district: user.district,
        languagePreference: user.languagePreference
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error?.message || 'Internal server error during login.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let profile = null;
    if (user.role === UserRole.CITIZEN) {
      profile = await CitizenProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      user,
      profile
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Internal server error fetching user profile.' });
  }
};
