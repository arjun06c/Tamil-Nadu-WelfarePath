"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resubmitCorrection = exports.getMyDocuments = exports.getApplicationById = exports.getMyApplications = exports.submitApplication = void 0;
const Application_1 = require("../models/Application");
const Scheme_1 = require("../models/Scheme");
const ApplicationDocument_1 = require("../models/ApplicationDocument");
const BenefitRecord_1 = require("../models/BenefitRecord");
const Notification_1 = require("../models/Notification");
const duplicateService_1 = require("../services/duplicateService");
const submitApplication = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { schemeId, formData, documents, applicationMethod, declarationAccepted } = req.body;
        const scheme = await Scheme_1.Scheme.findById(schemeId);
        if (!scheme) {
            res.status(404).json({ message: 'Scheme not found' });
            return;
        }
        // Backend Mandatory Document Validation Check (Requirement 1 & 23)
        const mandatoryConfigs = scheme.requiredDocuments?.filter((r) => r.isMandatory !== false) || [];
        const providedDocTypes = (documents || []).map((d) => d.docType);
        const missingMandatoryDocs = mandatoryConfigs.filter((cfg) => !providedDocTypes.includes(cfg.docType));
        if (missingMandatoryDocs.length > 0) {
            res.status(400).json({
                canProceed: false,
                message: 'Cannot submit application: All mandatory scheme documents must be provided.',
                missingDocuments: missingMandatoryDocs.map((m) => m.label?.en || m.docType)
            });
            return;
        }
        // Generate Secure Unique Reference Number: TNP-WP-2026-XXXXXX
        const randomSuffix = Math.floor(100000 + Math.random() * 900000);
        const applicationReference = `TNP-WP-2026-${randomSuffix}`;
        const application = await Application_1.Application.create({
            applicationNo: applicationReference,
            applicationReference,
            citizenId: req.user.id,
            schemeId: scheme._id,
            applicationMethod: applicationMethod || 'PROTOTYPE_ASSISTED',
            status: Application_1.ApplicationStatus.SUBMITTED,
            currentStep: 6,
            completionPercentage: 100,
            formData: formData || {},
            declarationAccepted: declarationAccepted !== undefined ? declarationAccepted : true,
            statusHistory: [
                {
                    previousStatus: 'DRAFT',
                    newStatus: Application_1.ApplicationStatus.SUBMITTED,
                    changedBy: req.user.id,
                    changedByRole: 'Citizen',
                    reason: 'Application submitted by citizen',
                    remarks: 'Application assistance package logged into WelfarePath system.',
                    timestamp: new Date()
                }
            ]
        });
        // Save attached document records
        if (documents && Array.isArray(documents)) {
            for (const doc of documents) {
                await ApplicationDocument_1.ApplicationDocument.create({
                    applicationId: application._id,
                    citizenId: req.user.id,
                    docType: doc.docType || 'GeneralProof',
                    documentName: doc.documentName || { en: doc.docType, ta: doc.docType },
                    fileName: doc.fileName || 'Document.pdf',
                    fileUrl: doc.fileUrl || 'https://via.placeholder.com/600x800?text=Uploaded+Proof',
                    fileSize: doc.fileSize || 2048,
                    mimeType: doc.mimeType || 'application/pdf',
                    source: doc.source || 'MANUAL_UPLOAD',
                    sourceReference: doc.sourceReference || '',
                    issuer: doc.issuer || '',
                    issueDate: doc.issueDate || '',
                    retrievedAt: doc.retrievedAt ? new Date(doc.retrievedAt) : undefined,
                    uploadStatus: 'UPLOADED',
                    ocrStatus: doc.ocrConfidence ? 'COMPLETED' : 'BYPASSED',
                    ocrConfidence: doc.ocrConfidence || 0,
                    extractedData: doc.ocrText ? { text: doc.ocrText } : (doc.extractedData || {}),
                    citizenConfirmedData: doc.confirmedFields || {},
                    verificationStatus: 'NOT_REVIEWED'
                });
            }
        }
        // Create In-App Notification for Citizen
        await Notification_1.Notification.create({
            userId: req.user.id,
            title: {
                en: `Application ${applicationReference} Submitted`,
                ta: `விண்ணப்பம் ${applicationReference} சமர்ப்பிக்கப்பட்டது`
            },
            message: {
                en: `Your application assistance package for ${scheme.name.en} has been logged. Current Status: Submitted.`,
                ta: `${scheme.name.ta} திட்டத்திற்கான உங்கள் விண்ணப்பம் பெறப்பட்டது.`
            },
            type: 'SUCCESS',
            linkUrl: `/citizen/applications/${application._id}`
        });
        // Trigger asynchronous integrity check
        (0, duplicateService_1.checkApplicationIntegrity)(application);
        res.status(201).json({
            message: 'Application submitted successfully',
            applicationReference,
            application
        });
    }
    catch (error) {
        console.error('submitApplication error:', error);
        res.status(500).json({ message: 'Error submitting application' });
    }
};
exports.submitApplication = submitApplication;
const getMyApplications = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const applications = await Application_1.Application.find({ citizenId: req.user.id })
            .populate('schemeId')
            .sort({ createdAt: -1 });
        const activeBenefits = await BenefitRecord_1.BenefitRecord.find({ citizenId: req.user.id })
            .populate('schemeId')
            .sort({ createdAt: -1 });
        res.status(200).json({
            applications,
            activeBenefits
        });
    }
    catch (error) {
        console.error('getMyApplications error:', error);
        res.status(500).json({ message: 'Error fetching applications portfolio' });
    }
};
exports.getMyApplications = getMyApplications;
const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await Application_1.Application.findById(id)
            .populate('schemeId')
            .populate('citizenId', 'name email mobile district')
            .populate('approvedBy', 'name role district email')
            .populate('rejectedBy', 'name role district email')
            .populate('statusHistory.changedBy', 'name role district');
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        const documents = await ApplicationDocument_1.ApplicationDocument.find({ applicationId: application._id })
            .populate('verifiedBy', 'name role district email')
            .populate('correctionRequestedBy', 'name role district email')
            .populate('rejectedBy', 'name role district email')
            .sort({ version: -1, createdAt: -1 });
        const benefitRecord = await BenefitRecord_1.BenefitRecord.findOne({ applicationId: application._id });
        res.status(200).json({
            application,
            documents,
            benefitRecord
        });
    }
    catch (error) {
        console.error('getApplicationById error:', error);
        res.status(500).json({ message: 'Error fetching application tracking timeline' });
    }
};
exports.getApplicationById = getApplicationById;
const getMyDocuments = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const documents = await ApplicationDocument_1.ApplicationDocument.find({ citizenId: req.user.id, isCurrentVersion: true })
            .populate({
            path: 'applicationId',
            select: 'applicationReference status schemeId',
            populate: { path: 'schemeId', select: 'name' }
        })
            .populate('verifiedBy', 'name role district email')
            .populate('correctionRequestedBy', 'name role district email')
            .sort({ createdAt: -1 });
        res.status(200).json({
            documents
        });
    }
    catch (error) {
        console.error('getMyDocuments error:', error);
        res.status(500).json({ message: 'Error fetching application documents' });
    }
};
exports.getMyDocuments = getMyDocuments;
const resubmitCorrection = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { id } = req.params;
        const { replacementDoc } = req.body;
        const application = await Application_1.Application.findById(id);
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        let newDoc = null;
        // Document Versioning: Keep old document record in history, create new version
        if (replacementDoc) {
            const existingDoc = await ApplicationDocument_1.ApplicationDocument.findOne({
                applicationId: application._id,
                docType: replacementDoc.docType,
                isCurrentVersion: true
            });
            if (existingDoc) {
                existingDoc.isCurrentVersion = false;
                await existingDoc.save();
            }
            newDoc = await ApplicationDocument_1.ApplicationDocument.create({
                applicationId: application._id,
                citizenId: req.user.id,
                docType: replacementDoc.docType,
                documentName: replacementDoc.documentName || existingDoc?.documentName || { en: replacementDoc.docType, ta: replacementDoc.docType },
                fileName: replacementDoc.fileName || 'Document.pdf',
                fileUrl: replacementDoc.fileUrl || 'https://via.placeholder.com/600x800',
                fileSize: replacementDoc.fileSize || 2048,
                mimeType: replacementDoc.mimeType || 'application/pdf',
                source: replacementDoc.source || 'MANUAL_UPLOAD',
                sourceReference: replacementDoc.sourceReference || '',
                issuer: replacementDoc.issuer || existingDoc?.issuer || '',
                issueDate: replacementDoc.issueDate || existingDoc?.issueDate || '',
                retrievedAt: replacementDoc.retrievedAt ? new Date(replacementDoc.retrievedAt) : undefined,
                uploadStatus: replacementDoc.source === 'DIGILOCKER' ? 'RETRIEVED' : 'UPLOADED',
                verificationStatus: 'NOT_REVIEWED',
                officerRemarks: '',
                version: existingDoc ? (existingDoc.version || 1) + 1 : 1,
                previousVersionId: existingDoc ? existingDoc._id : undefined,
                isCurrentVersion: true,
                resubmittedAt: new Date(),
                resubmittedBy: req.user.id,
                ocrConfidence: replacementDoc.ocrConfidence || 85,
                uploadedAt: new Date()
            });
        }
        application.status = Application_1.ApplicationStatus.DOC_VERIFICATION;
        application.statusHistory.push({
            previousStatus: Application_1.ApplicationStatus.CORRECTION_REQUIRED,
            newStatus: Application_1.ApplicationStatus.DOC_VERIFICATION,
            changedBy: req.user.id,
            changedByRole: 'Citizen',
            reason: 'Citizen submitted corrected supporting document.',
            timestamp: new Date()
        });
        await application.save();
        res.status(200).json({
            message: 'Correction resubmitted successfully. Case returned to officer review queue.',
            application,
            newDocument: newDoc
        });
    }
    catch (error) {
        console.error('resubmitCorrection error:', error);
        res.status(500).json({ message: 'Error resubmitting correction' });
    }
};
exports.resubmitCorrection = resubmitCorrection;
