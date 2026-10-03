import { Router } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import {
  digilockerConnectLimiter,
  digilockerCallbackLimiter,
  digilockerDocumentLimiter,
  digilockerRetrievalLimiter
} from '../middleware/rateLimiter';
import {
  consentValidationSchema,
  selectDocumentValidationSchema,
  validateBody,
  validateMongoIdParam
} from '../validators/digilockerValidators';
import {
  getConnectionStatus,
  startConnection,
  handleOAuthCallback,
  recordConsent,
  getConsentStatus,
  getAvailableDocuments,
  getDocumentById,
  selectDocument,
  disconnectConnection
} from '../controllers/digilockerController';

const router = Router();

// Connection & OAuth Endpoints (Harden with rate limiters)
router.get('/status', authenticateJWT, getConnectionStatus);
router.get('/connect', authenticateJWT, digilockerConnectLimiter, startConnection);
router.get('/callback', digilockerCallbackLimiter, handleOAuthCallback);
router.post('/disconnect', authenticateJWT, disconnectConnection);

// Consent Endpoints (Harden with body validators)
router.post('/consent', authenticateJWT, validateBody(consentValidationSchema), recordConsent);
router.get('/consent/status', authenticateJWT, getConsentStatus);

// Document Endpoints (Harden with rate limiters and Mongo ID validators)
router.get('/documents', authenticateJWT, digilockerDocumentLimiter, getAvailableDocuments);
router.get(
  '/documents/:id',
  authenticateJWT,
  validateMongoIdParam('id'),
  digilockerRetrievalLimiter,
  getDocumentById
);
router.post(
  '/documents/:id/select',
  authenticateJWT,
  validateMongoIdParam('id'),
  validateBody(selectDocumentValidationSchema),
  selectDocument
);

export default router;
