import { Router } from 'express';
import {
  getAllApplications,
  getApplicationDetailsForOfficer,
  updateApplicationStatus,
  updateDocumentVerificationStatus,
  getDuplicateFlags,
  updateDuplicateFlagStatus,
  getDashboardAnalytics,
  getAdminDigiLockerMetrics,
  getAdminIntegrationHealth
} from '../controllers/adminController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all officer/admin routes
router.use(authenticateJWT);
router.use(authorizeRoles(UserRole.OFFICER, UserRole.ADMIN));

router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationDetailsForOfficer);
router.put('/applications/:id/status', updateApplicationStatus);
router.put('/applications/:id/documents/:docId', updateDocumentVerificationStatus);
router.get('/duplicate-flags', getDuplicateFlags);
router.put('/duplicate-flags/:id', updateDuplicateFlagStatus);
router.get('/analytics', getDashboardAnalytics);
router.get('/integrations/digilocker', getAdminDigiLockerMetrics);
router.get('/integrations/health', getAdminIntegrationHealth);

export default router;


