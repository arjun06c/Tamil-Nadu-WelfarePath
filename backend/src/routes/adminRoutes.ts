import { Router } from 'express';
import {
  getAllApplications,
  updateApplicationStatus,
  getDuplicateFlags,
  updateDuplicateFlagStatus,
  getDashboardAnalytics
} from '../controllers/adminController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all officer/admin routes
router.use(authenticateJWT);
router.use(authorizeRoles(UserRole.OFFICER, UserRole.ADMIN));

router.get('/applications', getAllApplications);
router.put('/applications/:id/status', updateApplicationStatus);
router.get('/duplicate-flags', getDuplicateFlags);
router.put('/duplicate-flags/:id', updateDuplicateFlagStatus);
router.get('/analytics', getDashboardAnalytics);

export default router;
