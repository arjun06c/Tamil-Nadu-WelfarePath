"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const CitizenProfile_1 = require("../models/CitizenProfile");
const authValidator_1 = require("../validators/authValidator");
const env_1 = require("../config/env");
const generateToken = (id, role, email, name) => {
    return jsonwebtoken_1.default.sign({ id, role, email, name }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN
    });
};
const register = async (req, res) => {
    try {
        const parseResult = authValidator_1.registerSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parseResult.error.flatten().fieldErrors
            });
            return;
        }
        const { name, email, mobile, password, district, role, languagePreference } = parseResult.data;
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({ message: 'A user with this email address already exists.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await User_1.User.create({
            name,
            email: email.toLowerCase(),
            mobile,
            passwordHash,
            role: role,
            district,
            languagePreference: languagePreference || 'en'
        });
        // If registered as Citizen, create default CitizenProfile record
        if (user.role === User_1.UserRole.CITIZEN) {
            await CitizenProfile_1.CitizenProfile.create({
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
        const token = generateToken(user._id.toString(), user.role, user.email, user.name);
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
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const parseResult = authValidator_1.loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: 'Validation failed',
                errors: parseResult.error.flatten().fieldErrors
            });
            return;
        }
        const { email, password } = parseResult.data;
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }
        const token = generateToken(user._id.toString(), user.role, user.email, user.name);
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const user = await User_1.User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        let profile = null;
        if (user.role === User_1.UserRole.CITIZEN) {
            profile = await CitizenProfile_1.CitizenProfile.findOne({ userId: user._id });
        }
        res.status(200).json({
            user,
            profile
        });
    }
    catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Internal server error fetching user profile.' });
    }
};
exports.getMe = getMe;
