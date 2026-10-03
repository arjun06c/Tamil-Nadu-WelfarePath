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
const errorHandler_1 = require("./middleware/errorHandler");
const seedData_1 = require("./seed/seedData");
const WelfareDomain_1 = require("./models/WelfareDomain");
const app = (0, express_1.default)();
// Core Middlewares
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
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
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/assistant', assistantRoutes_1.default);
app.use('/api/misc', miscRoutes_1.default);
app.use('/api/integrations/digilocker', digilockerRoutes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Connect Database & Start Server
const startServer = async () => {
    await (0, db_1.connectDB)();
    // Auto-seed if database is unpopulated
    const count = await WelfareDomain_1.WelfareDomain.countDocuments();
    if (count === 0) {
        console.log('[Auto-Seed] Initializing master database records...');
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
