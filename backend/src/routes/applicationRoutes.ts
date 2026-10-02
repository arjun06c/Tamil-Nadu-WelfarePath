import { Router } from 'express';
import {
  submitApplication,
  getMyApplications,
  getApplicationById
} from '../controllers/applicationController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.post('/submit', authenticateJWT, submitApplication);
router.get('/my-portfolio', authenticateJWT, getMyApplications);
router.get('/:id', authenticateJWT, getApplicationById);

export default router;
