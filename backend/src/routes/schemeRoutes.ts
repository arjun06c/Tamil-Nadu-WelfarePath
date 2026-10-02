import { Router } from 'express';
import {
  getAllDomains,
  getAllSchemes,
  getSchemeById,
  evaluateSchemeEligibilityHandler,
  evaluateAllSchemesHandler
} from '../controllers/schemeController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/domains', getAllDomains);
router.get('/', getAllSchemes);
router.get('/evaluate-all', authenticateJWT, evaluateAllSchemesHandler);
router.get('/:id', getSchemeById);
router.post('/:id/evaluate', authenticateJWT, evaluateSchemeEligibilityHandler);

export default router;
