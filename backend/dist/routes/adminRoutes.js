"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const schemeController_1 = require("../controllers/schemeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all officer/admin routes
router.use(authMiddleware_1.authenticateJWT);
router.use((0, authMiddleware_1.authorizeRoles)(User_1.UserRole.OFFICER, User_1.UserRole.ADMIN));
router.get('/applications', adminController_1.getAllApplications);
router.get('/applications/:id', adminController_1.getApplicationDetailsForOfficer);
router.put('/applications/:id/status', adminController_1.updateApplicationStatus);
router.put('/applications/:id/documents/:docId', adminController_1.updateDocumentVerificationStatus);
router.get('/duplicate-flags', adminController_1.getDuplicateFlags);
router.put('/duplicate-flags/:id', adminController_1.updateDuplicateFlagStatus);
router.get('/analytics', adminController_1.getDashboardAnalytics);
router.get('/integrations/digilocker', adminController_1.getAdminDigiLockerMetrics);
router.get('/integrations/health', adminController_1.getAdminIntegrationHealth);
// Admin Welfare Domain & Scheme Management
router.post('/domains', schemeController_1.createDomainAdmin);
router.patch('/domains/:id', schemeController_1.updateDomainAdmin);
router.post('/schemes', schemeController_1.createSchemeAdmin);
router.patch('/schemes/:id', schemeController_1.updateSchemeAdmin);
router.post('/schemes/rules/test', schemeController_1.testRulesHandler);
exports.default = router;
