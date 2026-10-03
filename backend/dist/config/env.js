"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.env = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://admin:Y1vUvjLSTeTVi0RO@cluster0.qlafckz.mongodb.net/tn_welfarepath?retryWrites=true&w=majority',
    JWT_SECRET: process.env.JWT_SECRET || 'tn_welfarepath_super_secure_jwt_secret_key_2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    NODE_ENV: process.env.NODE_ENV || 'development',
    // DigiLocker Integration Config
    DIGILOCKER_MODE: process.env.DIGILOCKER_MODE || 'mock',
    DIGILOCKER_CLIENT_ID: process.env.DIGILOCKER_CLIENT_ID || '',
    DIGILOCKER_CLIENT_SECRET: process.env.DIGILOCKER_CLIENT_SECRET || '',
    DIGILOCKER_REDIRECT_URI: process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:5000/api/integrations/digilocker/callback',
    DIGILOCKER_AUTHORIZATION_URL: process.env.DIGILOCKER_AUTHORIZATION_URL || '',
    DIGILOCKER_TOKEN_URL: process.env.DIGILOCKER_TOKEN_URL || '',
    DIGILOCKER_API_BASE_URL: process.env.DIGILOCKER_API_BASE_URL || '',
    DIGILOCKER_SCOPES: process.env.DIGILOCKER_SCOPES || 'doc_type'
};
