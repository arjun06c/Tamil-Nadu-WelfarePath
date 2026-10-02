import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateJWT, getProfile);
router.put('/', authenticateJWT, updateProfile);

export default router;
