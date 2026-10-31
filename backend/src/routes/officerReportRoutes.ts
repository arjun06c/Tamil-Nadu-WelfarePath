import { Router } from 'express';
import {
  getReportSummary,
  getApplicationTrends,
  getStatusDistribution,
  getSchemePerformance,
  getOfficerPerformance,
  getPendingAgingReport,
  getRecentActivity,
  getCompleteDashboardReport,
  exportReportCSV
} from '../controllers/officerReportController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../models/User';

const router = Router();

// Secure all reporting endpoints: accessible only to Officers and Admins
router.use(authenticateJWT);
router.use(authorizeRoles(UserRole.OFFICER, UserRole.ADMIN));

router.get('/summary', getReportSummary);
router.get('/application-trends', getApplicationTrends);
router.get('/status-distribution', getStatusDistribution);
router.get('/scheme-performance', getSchemePerformance);
router.get('/officer-performance', getOfficerPerformance);
router.get('/pending-aging', getPendingAgingReport);
router.get('/recent-activity', getRecentActivity);
router.get('/dashboard', getCompleteDashboardReport);
router.get('/export/csv', exportReportCSV);

export default router;
