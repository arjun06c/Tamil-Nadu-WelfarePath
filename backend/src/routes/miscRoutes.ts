import { Router } from 'express';
import {
  getFaqs,
  getSavedSchemes,
  toggleSaveScheme,
  getNotifications,
  markNotificationRead
} from '../controllers/miscController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/faqs', getFaqs);
router.get('/saved-schemes', authenticateJWT, getSavedSchemes);
router.post('/saved-schemes/:schemeId/toggle', authenticateJWT, toggleSaveScheme);
router.get('/notifications', authenticateJWT, getNotifications);
router.put('/notifications/:id/read', authenticateJWT, markNotificationRead);

export default router;
