"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all officer/admin routes
router.use(authMiddleware_1.authenticateJWT);
router.use((0, authMiddleware_1.authorizeRoles)(User_1.UserRole.OFFICER, User_1.UserRole.ADMIN));
router.get('/applications', adminController_1.getAllApplications);
router.put('/applications/:id/status', adminController_1.updateApplicationStatus);
router.get('/duplicate-flags', adminController_1.getDuplicateFlags);
router.put('/duplicate-flags/:id', adminController_1.updateDuplicateFlagStatus);
router.get('/analytics', adminController_1.getDashboardAnalytics);
exports.default = router;
