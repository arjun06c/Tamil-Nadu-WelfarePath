import { Router } from 'express';
import {
  submitApplication,
  getMyApplications,
  getApplicationById,
  getMyDocuments,
  resubmitCorrection
} from '../controllers/applicationController';
import { attachDigiLockerDocumentToApplication } from '../controllers/digilockerController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { digilockerRetrievalLimiter } from '../middleware/rateLimiter';
import { validateMongoIdParam, validateBody, attachDocumentValidationSchema } from '../validators/digilockerValidators';

const router = Router();

router.post('/submit', authenticateJWT, submitApplication);
router.post('/', authenticateJWT, submitApplication);
router.get('/my-portfolio', authenticateJWT, getMyApplications);
router.get('/my-documents', authenticateJWT, getMyDocuments);
router.get('/:id', authenticateJWT, getApplicationById);
router.post('/:id/correction', authenticateJWT, resubmitCorrection);
router.post(
  '/:applicationId/documents/from-digilocker',
  authenticateJWT,
  validateMongoIdParam('applicationId'),
  validateBody(attachDocumentValidationSchema),
  digilockerRetrievalLimiter,
  attachDigiLockerDocumentToApplication
);

export default router;

