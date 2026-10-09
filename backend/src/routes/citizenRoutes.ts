import { Router } from 'express';
import { getCitizenDashboard, getCitizenRecommendedSchemes } from '../controllers/citizenDashboardController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/dashboard', authenticateJWT, getCitizenDashboard);
router.get('/schemes/recommended', authenticateJWT, getCitizenRecommendedSchemes);

export default router;
