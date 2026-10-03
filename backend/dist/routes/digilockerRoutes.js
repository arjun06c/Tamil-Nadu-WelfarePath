"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const digilockerValidators_1 = require("../validators/digilockerValidators");
const digilockerController_1 = require("../controllers/digilockerController");
const router = (0, express_1.Router)();
// Connection & OAuth Endpoints (Harden with rate limiters)
router.get('/status', authMiddleware_1.authenticateJWT, digilockerController_1.getConnectionStatus);
router.get('/connect', authMiddleware_1.authenticateJWT, rateLimiter_1.digilockerConnectLimiter, digilockerController_1.startConnection);
router.get('/callback', rateLimiter_1.digilockerCallbackLimiter, digilockerController_1.handleOAuthCallback);
router.post('/disconnect', authMiddleware_1.authenticateJWT, digilockerController_1.disconnectConnection);
// Consent Endpoints (Harden with body validators)
router.post('/consent', authMiddleware_1.authenticateJWT, (0, digilockerValidators_1.validateBody)(digilockerValidators_1.consentValidationSchema), digilockerController_1.recordConsent);
router.get('/consent/status', authMiddleware_1.authenticateJWT, digilockerController_1.getConsentStatus);
// Document Endpoints (Harden with rate limiters and Mongo ID validators)
router.get('/documents', authMiddleware_1.authenticateJWT, rateLimiter_1.digilockerDocumentLimiter, digilockerController_1.getAvailableDocuments);
router.get('/documents/:id', authMiddleware_1.authenticateJWT, (0, digilockerValidators_1.validateMongoIdParam)('id'), rateLimiter_1.digilockerRetrievalLimiter, digilockerController_1.getDocumentById);
router.post('/documents/:id/select', authMiddleware_1.authenticateJWT, (0, digilockerValidators_1.validateMongoIdParam)('id'), (0, digilockerValidators_1.validateBody)(digilockerValidators_1.selectDocumentValidationSchema), digilockerController_1.selectDocument);
exports.default = router;
