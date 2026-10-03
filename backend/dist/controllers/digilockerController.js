"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectConnection = exports.attachDigiLockerDocumentToApplication = exports.selectDocument = exports.getDocumentById = exports.getAvailableDocuments = exports.getConsentStatus = exports.recordConsent = exports.handleOAuthCallback = exports.startConnection = exports.getConnectionStatus = void 0;
const User_1 = require("../models/User");
const DigiLockerConnection_1 = require("../models/DigiLockerConnection");
const DigiLockerConsent_1 = require("../models/DigiLockerConsent");
const DigiLockerDocument_1 = require("../models/DigiLockerDocument");
const Application_1 = require("../models/Application");
const ApplicationDocument_1 = require("../models/ApplicationDocument");
const AuditLog_1 = require("../models/AuditLog");
const DigiLockerProviderFactory_1 = require("../services/digilocker/DigiLockerProviderFactory");
const DigiLockerSecurityService_1 = require("../services/digilocker/DigiLockerSecurityService");
/**
 * GET /api/integrations/digilocker/status
 * Returns authenticated citizen connection status and environment metadata
 */
const getConnectionStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const provider = DigiLockerProviderFactory_1.DigiLockerProviderFactory.getProvider();
        const health = await provider.getHealthStatus();
        const connection = await DigiLockerConnection_1.DigiLockerConnection.findOne({
            userId: req.user.id,
            status: 'CONNECTED'
        });
        res.status(200).json({
            connected: !!connection,
            mode: health.mode,
            badgeLabel: health.badgeLabel,
            status: connection ? connection.status : 'DISCONNECTED',
            externalUserReference: connection?.externalUserReference || '',
            connectedAt: connection?.connectedAt,
            scopes: connection?.scopes || [],
            health
        });
    }
    catch (error) {
        console.error('[getConnectionStatus] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error checking DigiLocker connection status' });
    }
};
exports.getConnectionStatus = getConnectionStatus;
/**
 * GET /api/integrations/digilocker/connect
 * Generates secure signed state token and OAuth authorization URL
 */
const startConnection = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const provider = DigiLockerProviderFactory_1.DigiLockerProviderFactory.getProvider();
        // Cryptographically signed and timestamped state parameter
        const state = DigiLockerSecurityService_1.DigiLockerSecurityService.generateSecureState(req.user.id);
        const scopes = ['doc_type', 'income_cert', 'community_cert', 'hsc_marksheet'];
        const authorizationUrl = await provider.getAuthorizationUrl(state, scopes);
        // Record audit event
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: 'DIGILOCKER_CONNECT_STARTED',
            targetType: 'DigiLockerIntegration',
            targetId: req.user.id,
            details: `Initiated OAuth authorization flow under mode: ${provider.getMode()}`
        });
        res.status(200).json({
            authorizationUrl,
            state,
            mode: provider.getMode(),
            badgeLabel: provider.getMode() === 'mock' ? 'Demo Document Source' : 'DigiLocker'
        });
    }
    catch (error) {
        console.error('[startConnection] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error initiating DigiLocker connection' });
    }
};
exports.startConnection = startConnection;
/**
 * GET /api/integrations/digilocker/callback
 * Handles authorization redirect, HMAC state signature validation, replay attack check, and token handling
 */
const handleOAuthCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            await AuditLog_1.AuditLog.create({
                actorId: req.user?.id || 'ANONYMOUS',
                actorEmail: req.user?.email || 'unknown@welfarepath.tn.gov.in',
                action: 'DIGILOCKER_AUTH_FAILED',
                targetType: 'DigiLockerOAuth',
                targetId: 'CALLBACK',
                details: `OAuth authorization was denied or cancelled by user: ${error}`
            });
            res.status(400).json({
                success: false,
                message: 'Authorization request was denied or cancelled.'
            });
            return;
        }
        if (!code || !state) {
            res.status(400).json({
                success: false,
                message: 'Invalid OAuth callback parameters. Authorization code and state are required.'
            });
            return;
        }
        const stateStr = String(state);
        const codeStr = String(code);
        // 1. Cryptographic HMAC State Signature Validation & One-Time Replay Check
        const stateValidation = DigiLockerSecurityService_1.DigiLockerSecurityService.validateAndConsumeState(stateStr);
        if (!stateValidation.valid || !stateValidation.userId) {
            await AuditLog_1.AuditLog.create({
                actorId: req.user?.id || 'UNKNOWN',
                actorEmail: req.user?.email || 'security_audit@welfarepath.tn.gov.in',
                action: 'DIGILOCKER_AUTH_FAILED',
                targetType: 'DigiLockerOAuth',
                targetId: 'CALLBACK',
                details: `OAuth callback state validation failed: ${stateValidation.error}`
            });
            res.status(400).json({
                success: false,
                message: `Security Validation Error: ${stateValidation.error}`
            });
            return;
        }
        const targetUserId = stateValidation.userId;
        const provider = DigiLockerProviderFactory_1.DigiLockerProviderFactory.getProvider();
        const authResult = await provider.handleCallback(codeStr, stateStr);
        if (!authResult.success) {
            await AuditLog_1.AuditLog.create({
                actorId: targetUserId,
                actorEmail: req.user?.email || 'citizen@welfarepath.tn.gov.in',
                action: 'DIGILOCKER_AUTH_FAILED',
                targetType: 'DigiLockerOAuth',
                targetId: targetUserId,
                details: `Provider authentication failed: ${authResult.error}`
            });
            res.status(400).json({
                success: false,
                message: authResult.error || 'DigiLocker authorization failed.'
            });
            return;
        }
        // Encrypt token at rest
        const encryptedToken = authResult.accessToken
            ? DigiLockerSecurityService_1.DigiLockerSecurityService.encrypt(authResult.accessToken)
            : undefined;
        // Upsert DigiLockerConnection record
        const connection = await DigiLockerConnection_1.DigiLockerConnection.findOneAndUpdate({ userId: targetUserId }, {
            provider: 'API_SETU_DIGILOCKER',
            environment: provider.getMode().toUpperCase(),
            externalUserReference: authResult.user?.maskedAadhaar || authResult.user?.id || 'DL-USER-REF',
            status: 'CONNECTED',
            scopes: ['doc_type', 'income_cert', 'community_cert', 'hsc_marksheet'],
            accessTokenEncrypted: encryptedToken,
            connectedAt: new Date(),
            lastUsedAt: new Date()
        }, { upsert: true, new: true });
        // Record audit event (redacting tokens or secrets)
        await AuditLog_1.AuditLog.create({
            actorId: targetUserId,
            actorEmail: req.user?.email || 'citizen@welfarepath.tn.gov.in',
            action: 'DIGILOCKER_AUTHORIZED',
            targetType: 'DigiLockerConnection',
            targetId: connection._id.toString(),
            details: `Successfully authorized DigiLocker integration in ${provider.getMode()} mode.`
        });
        res.status(200).json({
            success: true,
            message: 'DigiLocker authorization completed successfully',
            mode: provider.getMode(),
            badgeLabel: provider.getMode() === 'mock' ? 'Demo Document Source' : 'DigiLocker',
            user: authResult.user
        });
    }
    catch (error) {
        console.error('[handleOAuthCallback] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error processing DigiLocker callback' });
    }
};
exports.handleOAuthCallback = handleOAuthCallback;
/**
 * POST /api/integrations/digilocker/consent
 * Records explicit citizen consent details
 */
const recordConsent = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { purpose, requestedScopes, grantedScopes, applicationId } = req.body;
        const consentRef = `DL-CONSENT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        const consent = await DigiLockerConsent_1.DigiLockerConsent.create({
            userId: req.user.id,
            applicationId: applicationId || undefined,
            purpose: purpose || 'Access digital certificates for welfare application verification',
            requestedScopes: requestedScopes || ['doc_type'],
            grantedScopes: grantedScopes || ['doc_type'],
            consentReference: consentRef,
            consentedAt: new Date(),
            status: 'ACTIVE',
            policyVersion: '2026.1'
        });
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: 'DIGILOCKER_CONSENT_GRANTED',
            targetType: 'DigiLockerConsent',
            targetId: consent._id.toString(),
            details: `Granted consent ref ${consentRef} for purpose: ${consent.purpose}`
        });
        res.status(201).json({
            message: 'Consent recorded successfully',
            consent
        });
    }
    catch (error) {
        console.error('[recordConsent] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error recording citizen consent' });
    }
};
exports.recordConsent = recordConsent;
/**
 * GET /api/integrations/digilocker/consent/status
 * Fetches active consent state for authenticated citizen
 */
const getConsentStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const consent = await DigiLockerConsent_1.DigiLockerConsent.findOne({
            userId: req.user.id,
            status: 'ACTIVE'
        }).sort({ createdAt: -1 });
        res.status(200).json({
            hasActiveConsent: !!consent,
            consent
        });
    }
    catch (error) {
        console.error('[getConsentStatus] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error checking consent status' });
    }
};
exports.getConsentStatus = getConsentStatus;
/**
 * GET /api/integrations/digilocker/documents
 * Fetches available digital documents for connected citizen
 */
const getAvailableDocuments = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        // Role-based restrictions: Only Citizen role can query personal document locker
        if (req.user.role && req.user.role !== User_1.UserRole.CITIZEN) {
            res.status(403).json({ message: 'Access denied. Document locker query is restricted to citizen owners.' });
            return;
        }
        const connection = await DigiLockerConnection_1.DigiLockerConnection.findOne({
            userId: req.user.id,
            status: 'CONNECTED'
        });
        if (!connection) {
            res.status(400).json({
                message: 'DigiLocker is not connected. Please authorize access first.'
            });
            return;
        }
        const provider = DigiLockerProviderFactory_1.DigiLockerProviderFactory.getProvider();
        const items = await provider.getIssuedDocuments(req.user.id);
        // Normalize and upsert into DigiLockerDocument collection
        const normalizedDocs = [];
        for (const item of items) {
            const doc = await DigiLockerDocument_1.DigiLockerDocument.findOneAndUpdate({ userId: req.user.id, documentReference: item.uri }, {
                userId: req.user.id,
                source: 'DIGILOCKER',
                documentReference: item.uri,
                documentType: item.docType,
                name: item.name,
                issuer: item.issuer,
                issueDate: item.issueDate || '',
                mimeType: item.mimeType || 'application/pdf',
                status: 'AVAILABLE',
                verificationStatus: 'PENDING_OFFICER_REVIEW',
                metadata: {
                    description: item.description,
                    providerMode: provider.getMode(),
                    badgeLabel: provider.getMode() === 'mock' ? 'Demo Document Source' : 'DigiLocker'
                }
            }, { upsert: true, new: true });
            normalizedDocs.push({
                id: doc._id.toString(),
                source: 'DIGILOCKER',
                sourceReference: doc.documentReference,
                documentType: doc.documentType,
                name: doc.name,
                issuer: doc.issuer,
                issueDate: doc.issueDate,
                mimeType: doc.mimeType,
                status: doc.status,
                createdAt: doc.createdAt.toISOString()
            });
        }
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: 'DIGILOCKER_DOCUMENT_LIST_REQUESTED',
            targetType: 'DigiLockerDocument',
            targetId: req.user.id,
            details: `Retrieved ${normalizedDocs.length} eligible digital document metadata records.`
        });
        res.status(200).json({
            documents: normalizedDocs,
            count: normalizedDocs.length,
            badgeLabel: provider.getMode() === 'mock' ? 'Demo Document Source' : 'DigiLocker'
        });
    }
    catch (error) {
        console.error('[getAvailableDocuments] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error fetching available DigiLocker documents' });
    }
};
exports.getAvailableDocuments = getAvailableDocuments;
/**
 * GET /api/integrations/digilocker/documents/:id
 * Retrieves specific document metadata with ownership verification
 */
const getDocumentById = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const document = await DigiLockerDocument_1.DigiLockerDocument.findById(id);
        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }
        // Role-based Access Control & Ownership Verification Check
        const isOwner = document.userId.toString() === req.user.id;
        const isOfficer = req.user.role === User_1.UserRole.OFFICER || req.user.role === User_1.UserRole.ADMIN;
        if (!isOwner && !isOfficer) {
            res.status(403).json({ message: 'Access denied. You do not own this document.' });
            return;
        }
        // Admins are restricted from viewing raw citizen document contents directly
        if (req.user.role === User_1.UserRole.ADMIN) {
            res.status(403).json({ message: 'Access denied. Admin role cannot inspect raw citizen digital documents.' });
            return;
        }
        const provider = DigiLockerProviderFactory_1.DigiLockerProviderFactory.getProvider();
        const content = await provider.getDocument(document.userId.toString(), document.documentReference);
        res.status(200).json({
            document,
            previewUrl: content.contentUrl,
            badgeLabel: provider.getMode() === 'mock' ? 'Demo Document Source' : 'DigiLocker'
        });
    }
    catch (error) {
        console.error('[getDocumentById] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error retrieving document details' });
    }
};
exports.getDocumentById = getDocumentById;
/**
 * POST /api/integrations/digilocker/documents/:id/select
 * Selects a digital document for an application requirement
 */
const selectDocument = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const { applicationId } = req.body;
        const document = await DigiLockerDocument_1.DigiLockerDocument.findById(id);
        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }
        // Ownership Verification Check
        if (document.userId.toString() !== req.user.id) {
            res.status(403).json({ message: 'Access denied. You do not own this document.' });
            return;
        }
        document.status = 'SELECTED';
        if (applicationId) {
            document.applicationId = applicationId;
        }
        await document.save();
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: 'DIGILOCKER_DOCUMENT_SELECTED',
            targetType: 'DigiLockerDocument',
            targetId: document._id.toString(),
            details: `Selected document ${document.documentType} (${document.documentReference})`
        });
        res.status(200).json({
            message: 'Document selected successfully',
            document
        });
    }
    catch (error) {
        console.error('[selectDocument] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error selecting document' });
    }
};
exports.selectDocument = selectDocument;
/**
 * POST /api/applications/:applicationId/documents/from-digilocker
 * Links selected DigiLocker document to a citizen welfare application requirement
 */
const attachDigiLockerDocumentToApplication = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { applicationId } = req.params;
        const { digilockerDocumentId, docType } = req.body;
        // Verify Application Ownership
        const application = await Application_1.Application.findById(applicationId);
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        if (application.citizenId.toString() !== req.user.id) {
            res.status(403).json({ message: 'Access denied. You do not own this application.' });
            return;
        }
        // Verify DigiLocker Document Ownership
        const dlDoc = await DigiLockerDocument_1.DigiLockerDocument.findById(digilockerDocumentId);
        if (!dlDoc) {
            res.status(404).json({ message: 'DigiLocker document reference not found' });
            return;
        }
        if (dlDoc.userId.toString() !== req.user.id) {
            res.status(403).json({ message: 'Access denied. You do not own this DigiLocker document.' });
            return;
        }
        const provider = DigiLockerProviderFactory_1.DigiLockerProviderFactory.getProvider();
        const docContent = await provider.getDocument(req.user.id, dlDoc.documentReference);
        // Create or Update ApplicationDocument
        const targetDocType = docType || dlDoc.documentType;
        const appDoc = await ApplicationDocument_1.ApplicationDocument.findOneAndUpdate({ applicationId: application._id, docType: targetDocType }, {
            applicationId: application._id,
            citizenId: req.user.id,
            docType: targetDocType,
            documentName: dlDoc.name,
            fileName: `${dlDoc.documentType}.pdf`,
            fileUrl: docContent.contentUrl || `https://via.placeholder.com/800x1100.png?text=DigiLocker+${targetDocType}`,
            fileSize: 2048,
            mimeType: dlDoc.mimeType || 'application/pdf',
            source: 'DIGILOCKER',
            sourceReference: dlDoc.documentReference,
            issuer: dlDoc.issuer,
            issueDate: dlDoc.issueDate,
            retrievedAt: new Date(),
            uploadStatus: 'UPLOADED',
            ocrStatus: 'COMPLETED',
            ocrConfidence: 95,
            verificationStatus: 'NOT_REVIEWED', // Explicitly NOT automatically verified
            uploadedAt: new Date()
        }, { upsert: true, new: true });
        // Update DigiLockerDocument Status
        dlDoc.status = 'RETRIEVED';
        dlDoc.applicationId = application._id;
        dlDoc.retrievedAt = new Date();
        await dlDoc.save();
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: 'DIGILOCKER_DOCUMENT_RETRIEVED',
            targetType: 'ApplicationDocument',
            targetId: appDoc._id.toString(),
            details: `Attached DigiLocker document ${targetDocType} to application ${application.applicationReference}`
        });
        res.status(200).json({
            message: 'DigiLocker document attached to application successfully',
            applicationDocument: appDoc,
            source: 'DIGILOCKER',
            verificationStatus: 'NOT_REVIEWED'
        });
    }
    catch (error) {
        console.error('[attachDigiLockerDocumentToApplication] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error attaching DigiLocker document to application' });
    }
};
exports.attachDigiLockerDocumentToApplication = attachDigiLockerDocumentToApplication;
/**
 * POST /api/integrations/digilocker/disconnect
 * Revokes connection and updates local integration state
 */
const disconnectConnection = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const provider = DigiLockerProviderFactory_1.DigiLockerProviderFactory.getProvider();
        await provider.revokeAccess(req.user.id);
        // Update connection state
        await DigiLockerConnection_1.DigiLockerConnection.findOneAndUpdate({ userId: req.user.id, status: 'CONNECTED' }, {
            status: 'DISCONNECTED',
            revokedAt: new Date()
        });
        // Update consent state
        await DigiLockerConsent_1.DigiLockerConsent.updateMany({ userId: req.user.id, status: 'ACTIVE' }, {
            status: 'REVOKED',
            revokedAt: new Date()
        });
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: 'DIGILOCKER_DISCONNECTED',
            targetType: 'DigiLockerConnection',
            targetId: req.user.id,
            details: 'Disconnected DigiLocker account access.'
        });
        res.status(200).json({
            message: 'DigiLocker integration disconnected successfully',
            status: 'DISCONNECTED'
        });
    }
    catch (error) {
        console.error('[disconnectConnection] Error:', DigiLockerSecurityService_1.DigiLockerSecurityService.sanitizeLogData(error.message));
        res.status(500).json({ message: 'Error disconnecting DigiLocker' });
    }
};
exports.disconnectConnection = disconnectConnection;
