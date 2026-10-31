"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const schemeRoutes_1 = __importDefault(require("./routes/schemeRoutes"));
const applicationRoutes_1 = __importDefault(require("./routes/applicationRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const assistantRoutes_1 = __importDefault(require("./routes/assistantRoutes"));
const miscRoutes_1 = __importDefault(require("./routes/miscRoutes"));
const digilockerRoutes_1 = __importDefault(require("./routes/digilockerRoutes"));
const citizenRoutes_1 = __importDefault(require("./routes/citizenRoutes"));
const officerReportRoutes_1 = __importDefault(require("./routes/officerReportRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const seedData_1 = require("./seed/seedData");
const WelfareDomain_1 = require("./models/WelfareDomain");
const User_1 = require("./models/User");
const Application_1 = require("./models/Application");
const path_1 = __importDefault(require("path"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const app = (0, express_1.default)();
// Core Middlewares
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: '15mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '15mb' }));
// Static Document Storage & Mock Assets
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/mock-documents', express_1.default.static(path_1.default.join(__dirname, '../public/mock-documents')));
app.use('/api/documents/static', express_1.default.static(path_1.default.join(__dirname, '../public/mock-documents')));
// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (env_1.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});
// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        system: 'Tamil Nadu WelfarePath API Engine',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
app.use('/api/schemes', schemeRoutes_1.default);
app.use('/api/applications', applicationRoutes_1.default);
app.use('/api/documents', documentRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/assistant', assistantRoutes_1.default);
app.use('/api/misc', miscRoutes_1.default);
app.use('/api/integrations/digilocker', digilockerRoutes_1.default);
app.use('/api/citizen', citizenRoutes_1.default);
app.use('/api/officer/reports', officerReportRoutes_1.default);
app.use('/api/admin/reports', officerReportRoutes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Connect Database & Start Server
const startServer = async () => {
    await (0, db_1.connectDB)();
    // Auto-seed if database is unpopulated or missing seeded users
    const domainCount = await WelfareDomain_1.WelfareDomain.countDocuments();
    const userCount = await User_1.User.countDocuments();
    const appCount = await Application_1.Application.countDocuments();
    if (domainCount === 0 || userCount === 0 || appCount < 10) {
        console.log('[Auto-Seed] Initializing master database & default user accounts...');
        await (0, seedData_1.seedDatabase)();
    }
    app.listen(env_1.env.PORT, () => {
        console.log(`========================================================`);
        console.log(`🚀 Tamil Nadu WelfarePath API Server Running!`);
        console.log(`📡 PORT: http://localhost:${env_1.env.PORT}`);
        console.log(`🌍 ENVIRONMENT: ${env_1.env.NODE_ENV}`);
        console.log(`========================================================`);
    });
};
startServer();
