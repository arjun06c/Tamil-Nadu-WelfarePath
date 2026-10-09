"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const citizenDashboardController_1 = require("../controllers/citizenDashboardController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/dashboard', authMiddleware_1.authenticateJWT, citizenDashboardController_1.getCitizenDashboard);
router.get('/schemes/recommended', authMiddleware_1.authenticateJWT, citizenDashboardController_1.getCitizenRecommendedSchemes);
exports.default = router;
