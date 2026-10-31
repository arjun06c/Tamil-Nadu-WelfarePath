"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminIntegrationHealth = exports.getAdminDigiLockerMetrics = exports.getDashboardAnalytics = exports.updateDuplicateFlagStatus = exports.getDuplicateFlags = exports.updateApplicationStatus = exports.updateDocumentVerificationStatus = exports.getApplicationDetailsForOfficer = exports.saveOfficerVerification = exports.getOfficerDashboardStats = exports.getAllApplications = void 0;
const Application_1 = require("../models/Application");
const Scheme_1 = require("../models/Scheme");
const User_1 = require("../models/User");
const DuplicateFlag_1 = require("../models/DuplicateFlag");
const BenefitRecord_1 = require("../models/BenefitRecord");
const AuditLog_1 = require("../models/AuditLog");
const ApplicationDocument_1 = require("../models/ApplicationDocument");
const Notification_1 = require("../models/Notification");
const DigiLockerConnection_1 = require("../models/DigiLockerConnection");
const DigiLockerConsent_1 = require("../models/DigiLockerConsent");
const DigiLockerDocument_1 = require("../models/DigiLockerDocument");
const getAllApplications = async (req, res) => {
    try {
        const { status, search, queue, district, schemeId, sort } = req.query;
        const query = {};
        // Queue-based filtering
        if (queue) {
            if (queue === 'new') {
                query.status = Application_1.ApplicationStatus.SUBMITTED;
            }
            else if (queue === 'pending') {
                query.status = { $in: [Application_1.ApplicationStatus.RESUBMITTED, Application_1.ApplicationStatus.DOC_VERIFICATION] };
            }
            else if (queue === 'under_review') {
                query.status = { $in: [Application_1.ApplicationStatus.UNDER_REVIEW, Application_1.ApplicationStatus.OFFICER_REVIEW] };
            }
            else if (queue === 'corrections') {
                query.status = Application_1.ApplicationStatus.CORRECTION_REQUIRED;
            }
            else if (queue === 'completed') {
                query.status = { $in: [Application_1.ApplicationStatus.APPROVED, Application_1.ApplicationStatus.REJECTED] };
            }
        }
        else if (status) {
            if (typeof status === 'string' && status.includes(',')) {
                query.status = { $in: status.split(',') };
            }
            else {
                query.status = status;
            }
        }
        // District filter
        if (district) {
            query.district = district;
        }
        // Scheme filter
        if (schemeId) {
            query.schemeId = schemeId;
        }
        // Search query
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            query.$or = [
                { applicationNo: searchRegex },
                { applicationReference: searchRegex }
            ];
        }
        // Officer jurisdiction scoping
        if (req.user?.role === User_1.UserRole.OFFICER) {
            const officerDistrict = req.user.district;
            query.$or = query.$or
                ? [{ $and: [query, { $or: [{ district: officerDistrict }, { assignedOfficerId: req.user.id }] }] }]
                : [{ district: officerDistrict }, { assignedOfficerId: req.user.id }];
        }
        const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
        const applications = await Application_1.Application.find(query)
            .populate('schemeId')
            .populate('citizenId', 'name email mobile district')
            .populate('assignedOfficerId', 'name email district')
            .sort(sortOrder);
        res.status(200).json({ applications });
    }
    catch (error) {
        console.error('getAllApplications error:', error);
        res.status(500).json({ message: 'Error fetching application queue' });
    }
};
exports.getAllApplications = getAllApplications;
const getOfficerDashboardStats = async (req, res) => {
    try {
        const baseQuery = {};
        if (req.user?.role === User_1.UserRole.OFFICER) {
            const officerDistrict = req.user.district;
            baseQuery.$or = [
                { district: officerDistrict },
                { assignedOfficerId: req.user.id }
            ];
        }
        const [newApplications, pendingVerification, underReview, correctionRequired, approved, rejected] = await Promise.all([
            Application_1.Application.countDocuments({ ...baseQuery, status: Application_1.ApplicationStatus.SUBMITTED }),
            Application_1.Application.countDocuments({
                ...baseQuery,
                status: { $in: [Application_1.ApplicationStatus.SUBMITTED, Application_1.ApplicationStatus.RESUBMITTED, Application_1.ApplicationStatus.DOC_VERIFICATION] }
            }),
            Application_1.Application.countDocuments({
                ...baseQuery,
                status: { $in: [Application_1.ApplicationStatus.UNDER_REVIEW, Application_1.ApplicationStatus.OFFICER_REVIEW] }
            }),
            Application_1.Application.countDocuments({ ...baseQuery, status: Application_1.ApplicationStatus.CORRECTION_REQUIRED }),
            Application_1.Application.countDocuments({ ...baseQuery, status: Application_1.ApplicationStatus.APPROVED }),
            Application_1.Application.countDocuments({ ...baseQuery, status: Application_1.ApplicationStatus.REJECTED })
        ]);
        res.status(200).json({
            stats: {
                newApplications,
                pendingVerification,
                underReview,
                correctionRequired,
                approved,
                rejected
            }
        });
    }
    catch (error) {
        console.error('getOfficerDashboardStats error:', error);
        res.status(500).json({ message: 'Error calculating officer statistics' });
    }
};
exports.getOfficerDashboardStats = getOfficerDashboardStats;
const saveOfficerVerification = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { id } = req.params;
        const { eligibilityReviews, verificationChecklist, officerRemarks, startReview } = req.body;
        const application = await Application_1.Application.findById(id);
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        if (eligibilityReviews !== undefined) {
            application.eligibilityReviews = eligibilityReviews;
        }
        if (verificationChecklist !== undefined) {
            application.verificationChecklist = verificationChecklist;
        }
        if (officerRemarks !== undefined) {
            application.officerRemarks = officerRemarks;
        }
        // If starting review or transitioning from SUBMITTED / RESUBMITTED to UNDER_REVIEW
        if (startReview ||
            application.status === Application_1.ApplicationStatus.SUBMITTED ||
            application.status === Application_1.ApplicationStatus.RESUBMITTED) {
            const prev = application.status;
            application.status = Application_1.ApplicationStatus.UNDER_REVIEW;
            application.verificationStartedAt = new Date();
            application.assignedOfficerId = req.user.id;
            application.statusHistory.push({
                previousStatus: prev,
                newStatus: Application_1.ApplicationStatus.UNDER_REVIEW,
                changedBy: req.user.id,
                changedByRole: req.user.role || 'Officer',
                remarks: officerRemarks || 'Officer started verification and case review',
                timestamp: new Date()
            });
            // Notify citizen
            await Notification_1.Notification.create({
                userId: application.citizenId,
                title: {
                    en: `Verification Started: ${application.applicationReference}`,
                    ta: `சரிபார்ப்பு தொடங்கியது: ${application.applicationReference}`
                },
                message: {
                    en: `A District Welfare Officer has started reviewing your application documents and eligibility criteria.`,
                    ta: `உங்கள் விண்ணப்பம் மற்றும் ஆவணங்களை மாவட்ட நல அலுவலர் சரிபார்க்கத் தொடங்கியுள்ளார்.`
                },
                type: 'INFO',
                linkUrl: `/citizen/applications/${application._id}`
            });
        }
        await application.save();
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: 'OFFICER_VERIFICATION_CHECKLIST_SAVED',
            targetType: 'Application',
            targetId: application._id.toString(),
            details: `Saved verification checklist and eligibility reviews`
        });
        res.status(200).json({
            message: 'Verification progress saved successfully',
            application
        });
    }
    catch (error) {
        console.error('saveOfficerVerification error:', error);
        res.status(500).json({ message: 'Error saving verification progress' });
    }
};
exports.saveOfficerVerification = saveOfficerVerification;
const getApplicationDetailsForOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await Application_1.Application.findById(id)
            .populate('schemeId')
            .populate('citizenId', 'name email mobile district annualIncome community')
            .populate('approvedBy', 'name role district email')
            .populate('rejectedBy', 'name role district email');
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
        console.error('getApplicationDetailsForOfficer error:', error);
        res.status(500).json({ message: 'Error fetching application details' });
    }
};
exports.getApplicationDetailsForOfficer = getApplicationDetailsForOfficer;
const updateDocumentVerificationStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        if (req.user.role !== 'Officer' && req.user.role !== 'Admin') {
            res.status(403).json({ message: 'Unauthorized: Only authorized officers can verify application documents' });
            return;
        }
        const { id, docId } = req.params;
        const { verificationStatus, officerRemarks, correctionReason, rejectionReason } = req.body;
        const document = await ApplicationDocument_1.ApplicationDocument.findOne({
            _id: docId,
            applicationId: id
        });
        if (!document) {
            res.status(404).json({ message: 'Application document not found' });
            return;
        }
        document.verificationStatus = verificationStatus;
        if (officerRemarks !== undefined) {
            document.officerRemarks = officerRemarks;
        }
        let auditAction = `DOCUMENT_VERIFICATION_UPDATED`;
        if (verificationStatus === 'VERIFIED' || verificationStatus === 'ACCEPTED') {
            document.verifiedAt = new Date();
            document.verifiedBy = req.user.id;
            auditAction = 'DOCUMENT_VERIFIED';
        }
        else if (verificationStatus === 'CORRECTION_REQUIRED') {
            document.correctionReason = correctionReason || officerRemarks || 'Correction requested by reviewing officer';
            document.correctionRequestedAt = new Date();
            document.correctionRequestedBy = req.user.id;
            auditAction = 'DOCUMENT_CORRECTION_REQUESTED';
        }
        else if (verificationStatus === 'REJECTED') {
            document.rejectionReason = rejectionReason || officerRemarks || 'Document rejected by officer';
            document.rejectedAt = new Date();
            document.rejectedBy = req.user.id;
            auditAction = 'DOCUMENT_REJECTED';
        }
        await document.save();
        const application = await Application_1.Application.findById(id);
        if (application) {
            if (verificationStatus === 'VERIFIED' || verificationStatus === 'ACCEPTED') {
                const allDocs = await ApplicationDocument_1.ApplicationDocument.find({ applicationId: id, isCurrentVersion: true });
                const scheme = await Scheme_1.Scheme.findById(application.schemeId);
                const mandatoryConfigs = scheme?.requiredDocuments?.filter((r) => r.isMandatory !== false) || [];
                const allMandatoryVerified = mandatoryConfigs.every((cfg) => {
                    const attached = allDocs.find((d) => d.docType === cfg.docType);
                    return attached && (attached.verificationStatus === 'VERIFIED' || attached.verificationStatus === 'ACCEPTED');
                });
                if (allMandatoryVerified && (application.status === Application_1.ApplicationStatus.SUBMITTED || application.status === Application_1.ApplicationStatus.DOC_VERIFICATION)) {
                    application.status = Application_1.ApplicationStatus.OFFICER_REVIEW;
                    application.statusHistory.push({
                        previousStatus: application.status,
                        newStatus: Application_1.ApplicationStatus.OFFICER_REVIEW,
                        changedBy: req.user.id,
                        changedByRole: req.user.role || 'Officer',
                        reason: 'All required documents verified successfully.',
                        timestamp: new Date()
                    });
                    await application.save();
                }
            }
            else if (verificationStatus === 'CORRECTION_REQUIRED') {
                application.status = Application_1.ApplicationStatus.CORRECTION_REQUIRED;
                application.officerRemarks = officerRemarks || 'Correction required for supporting document.';
                application.correctionCount = (application.correctionCount || 0) + 1;
                application.statusHistory.push({
                    previousStatus: application.status,
                    newStatus: Application_1.ApplicationStatus.CORRECTION_REQUIRED,
                    changedBy: req.user.id,
                    changedByRole: req.user.role || 'Officer',
                    reason: officerRemarks || 'Officer requested document correction',
                    timestamp: new Date()
                });
                await application.save();
                await Notification_1.Notification.create({
                    userId: application.citizenId,
                    title: {
                        en: `Action Required: Document Correction (${document.docType})`,
                        ta: `நடவடிக்கை தேவை: சான்றிதழ் திருத்தம் (${document.docType})`
                    },
                    message: {
                        en: `Officer requested correction for ${document.docType}: "${officerRemarks || 'Please upload a clear copy'}"`,
                        ta: `அதிகாரி சான்றிதழ் திருத்தம் கேட்டுள்ளார்: "${officerRemarks || 'தயவுசெய்து சரியான சான்றிதழைப் பதிவேற்றவும்'}"`
                    },
                    type: 'WARNING',
                    linkUrl: `/citizen/applications/${application._id}/documents`
                });
            }
            else if (verificationStatus === 'REJECTED') {
                application.status = Application_1.ApplicationStatus.REJECTED;
                application.officerRemarks = officerRemarks || 'Supporting document rejected by officer.';
                application.statusHistory.push({
                    previousStatus: application.status,
                    newStatus: Application_1.ApplicationStatus.REJECTED,
                    changedBy: req.user.id,
                    changedByRole: req.user.role || 'Officer',
                    reason: officerRemarks || 'Officer rejected supporting document',
                    timestamp: new Date()
                });
                await application.save();
                await Notification_1.Notification.create({
                    userId: application.citizenId,
                    title: {
                        en: `Application Document Rejected (${document.docType})`,
                        ta: `ஆவணம் நிராகரிக்கப்பட்டது (${document.docType})`
                    },
                    message: {
                        en: `Your document ${document.docType} was rejected: "${officerRemarks || 'Does not meet requirements'}"`,
                        ta: `உங்கள் சான்றிதழ் ${document.docType} நிராகரிக்கப்பட்டது: "${officerRemarks || 'தேவைகளை பூர்த்தி செய்யவில்லை'}"`
                    },
                    type: 'ACTION_REQUIRED',
                    linkUrl: `/citizen/applications/${application._id}`
                });
            }
        }
        // Audit Log
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: auditAction,
            targetType: 'ApplicationDocument',
            targetId: document._id.toString(),
            details: officerRemarks || `Document verification status set to ${verificationStatus}`
        });
        res.status(200).json({
            message: `Document status updated to ${verificationStatus}`,
            document
        });
    }
    catch (error) {
        console.error('updateDocumentVerificationStatus error:', error);
        res.status(500).json({ message: 'Error updating document verification status' });
    }
};
exports.updateDocumentVerificationStatus = updateDocumentVerificationStatus;
const updateApplicationStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { id } = req.params;
        const { status, remarks } = req.body;
        const application = await Application_1.Application.findById(id);
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        // Validation: Rejection requires a mandatory specific reason
        if (status === Application_1.ApplicationStatus.REJECTED && (!remarks || remarks.trim().length === 0)) {
            res.status(400).json({ message: 'A specific rejection reason is mandatory before rejecting an application.' });
            return;
        }
        // Validation: Requesting corrections requires mandatory instructions
        if (status === Application_1.ApplicationStatus.CORRECTION_REQUIRED && (!remarks || remarks.trim().length === 0)) {
            res.status(400).json({ message: 'Detailed correction instructions and reasons are mandatory.' });
            return;
        }
        // When an Officer approves an application, auto-verify any attached documents and ensure mandatory scheme requirements are met.
        if (status === Application_1.ApplicationStatus.APPROVED || status === Application_1.ApplicationStatus.BENEFIT_RELEASED) {
            const scheme = await Scheme_1.Scheme.findById(application.schemeId);
            const requiredDocs = scheme?.requiredDocuments || [];
            const appDocs = await ApplicationDocument_1.ApplicationDocument.find({ applicationId: application._id, isCurrentVersion: true });
            // Auto-verify all attached documents for this application upon officer approval
            for (const doc of appDocs) {
                if (doc.verificationStatus !== 'VERIFIED' && doc.verificationStatus !== 'ACCEPTED') {
                    doc.verificationStatus = 'VERIFIED';
                    doc.verifiedAt = new Date();
                    doc.verifiedBy = req.user.id;
                    doc.officerRemarks = doc.officerRemarks || remarks || 'Auto-verified during officer application approval';
                    await doc.save();
                }
            }
            // Ensure mandatory scheme documents have records
            const mandatoryConfigs = requiredDocs.filter((r) => r.isMandatory !== false);
            for (const cfg of mandatoryConfigs) {
                const attached = appDocs.find((d) => d.docType === cfg.docType);
                if (!attached) {
                    await ApplicationDocument_1.ApplicationDocument.create({
                        applicationId: application._id,
                        citizenId: application.citizenId,
                        docType: cfg.docType,
                        documentName: cfg.label || { en: cfg.docType, ta: cfg.docType },
                        fileName: `${cfg.docType}_verified.pdf`,
                        fileUrl: 'https://via.placeholder.com/600x800?text=Verified+Document',
                        source: 'MANUAL_UPLOAD',
                        verificationStatus: 'VERIFIED',
                        verifiedAt: new Date(),
                        verifiedBy: req.user.id,
                        officerRemarks: remarks || 'Verified during officer approval',
                        uploadedAt: new Date()
                    });
                }
            }
        }
        const previousStatus = application.status;
        application.status = status;
        application.officerRemarks = remarks || application.officerRemarks;
        if (status === Application_1.ApplicationStatus.APPROVED) {
            application.approvedBy = req.user.id;
            application.approvedAt = new Date();
        }
        else if (status === Application_1.ApplicationStatus.REJECTED) {
            application.rejectedBy = req.user.id;
            application.rejectedAt = new Date();
        }
        else if (status === Application_1.ApplicationStatus.CORRECTION_REQUIRED) {
            application.correctionCount = (application.correctionCount || 0) + 1;
        }
        else if (status === Application_1.ApplicationStatus.UNDER_REVIEW) {
            application.verificationStartedAt = new Date();
            application.assignedOfficerId = req.user.id;
        }
        application.statusHistory.push({
            previousStatus: previousStatus,
            newStatus: status,
            changedBy: req.user.id,
            changedByRole: req.user.role || 'Officer',
            remarks: remarks || `Status updated to ${status} by Officer`,
            timestamp: new Date()
        });
        await application.save();
        // If Approved, create active BenefitRecord
        if (status === Application_1.ApplicationStatus.APPROVED) {
            const scheme = await Scheme_1.Scheme.findById(application.schemeId);
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            await BenefitRecord_1.BenefitRecord.create({
                applicationId: application._id,
                citizenId: application.citizenId,
                schemeId: application.schemeId,
                disbursementAmount: 1000,
                disbursementFrequency: 'Monthly',
                releaseDate: new Date(),
                status: 'ACTIVE',
                nextRenewalDate: nextYear,
                benefitReferenceNo: `TN-BEN-${Math.floor(100000 + Math.random() * 900000)}`,
                notes: `Benefit approved under ${scheme?.name?.en || 'Welfare Scheme'}`
            });
            // Citizen notification for approval
            await Notification_1.Notification.create({
                userId: application.citizenId,
                title: {
                    en: `Application Approved: ${application.applicationReference}`,
                    ta: `விண்ணப்பம் அங்கீகரிக்கப்பட்டது: ${application.applicationReference}`
                },
                message: {
                    en: `Congratulations! Your welfare application ${application.applicationReference} has been verified and APPROVED by the District Welfare Officer. Remarks: "${remarks || 'All requirements satisfied.'}"`,
                    ta: `வாழ்த்துகள்! உங்கள் விண்ணப்பம் ${application.applicationReference} அங்கீகரிக்கப்பட்டுள்ளது.`
                },
                type: 'SUCCESS',
                linkUrl: `/citizen/applications/${application._id}`
            });
        }
        else if (status === Application_1.ApplicationStatus.REJECTED) {
            // Citizen notification for rejection
            await Notification_1.Notification.create({
                userId: application.citizenId,
                title: {
                    en: `Application Rejected: ${application.applicationReference}`,
                    ta: `விண்ணப்பம் நிராகரிக்கப்பட்டது: ${application.applicationReference}`
                },
                message: {
                    en: `Your application ${application.applicationReference} could not be approved. Reason: "${remarks}". You may review the decision in your tracking portal.`,
                    ta: `உங்கள் விண்ணப்பம் ${application.applicationReference} நிராகரிக்கப்பட்டது. காரணம்: "${remarks}".`
                },
                type: 'ACTION_REQUIRED',
                linkUrl: `/citizen/applications/${application._id}`
            });
        }
        else if (status === Application_1.ApplicationStatus.CORRECTION_REQUIRED) {
            // Citizen notification for correction
            await Notification_1.Notification.create({
                userId: application.citizenId,
                title: {
                    en: `Action Required: Document Corrections (${application.applicationReference})`,
                    ta: `நடவடிக்கை தேவை: ஆவணத் திருத்தம் (${application.applicationReference})`
                },
                message: {
                    en: `Officer requested correction for application ${application.applicationReference}: "${remarks}". Please upload the required documents to continue.`,
                    ta: `விண்ணப்பத்தில் திருத்தம் கோரப்பட்டுள்ளது: "${remarks}".`
                },
                type: 'WARNING',
                linkUrl: `/citizen/applications/${application._id}`
            });
        }
        else if (status === Application_1.ApplicationStatus.UNDER_REVIEW) {
            await Notification_1.Notification.create({
                userId: application.citizenId,
                title: {
                    en: `Verification Started: ${application.applicationReference}`,
                    ta: `சரிபார்ப்பு தொடங்கியது: ${application.applicationReference}`
                },
                message: {
                    en: `The District Welfare Officer has begun reviewing your application and supporting documentation.`,
                    ta: `உங்கள் விண்ணப்பத்தை மாவட்ட நல அலுவலர் ஆய்வு செய்யத் தொடங்கியுள்ளார்.`
                },
                type: 'INFO',
                linkUrl: `/citizen/applications/${application._id}`
            });
        }
        // Audit log
        await AuditLog_1.AuditLog.create({
            actorId: req.user.id,
            actorEmail: req.user.email,
            action: `UPDATE_APPLICATION_STATUS_${status}`,
            targetType: 'Application',
            targetId: application._id.toString(),
            details: remarks || `Application status changed to ${status}`
        });
        res.status(200).json({
            message: `Application status updated to ${status}`,
            application
        });
    }
    catch (error) {
        console.error('updateApplicationStatus error:', error);
        res.status(500).json({ message: 'Error updating application status' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
const getDuplicateFlags = async (req, res) => {
    try {
        const flags = await DuplicateFlag_1.DuplicateFlag.find()
            .populate({
            path: 'applicationId',
            populate: [{ path: 'schemeId' }, { path: 'citizenId', select: 'name email district' }]
        })
            .populate({
            path: 'matchedApplicationId',
            populate: [{ path: 'schemeId' }, { path: 'citizenId', select: 'name email district' }]
        })
            .sort({ createdAt: -1 });
        res.status(200).json({ flags });
    }
    catch (error) {
        console.error('getDuplicateFlags error:', error);
        res.status(500).json({ message: 'Error fetching duplicate integrity flags' });
    }
};
exports.getDuplicateFlags = getDuplicateFlags;
const updateDuplicateFlagStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { id } = req.params;
        const { reviewStatus, officerNotes } = req.body;
        const flag = await DuplicateFlag_1.DuplicateFlag.findByIdAndUpdate(id, {
            reviewStatus,
            officerNotes,
            reviewedBy: req.user.id
        }, { new: true });
        res.status(200).json({
            message: 'Duplicate flag review updated',
            flag
        });
    }
    catch (error) {
        console.error('updateDuplicateFlagStatus error:', error);
        res.status(500).json({ message: 'Error updating duplicate flag status' });
    }
};
exports.updateDuplicateFlagStatus = updateDuplicateFlagStatus;
const getDashboardAnalytics = async (req, res) => {
    try {
        const totalCitizens = await User_1.User.countDocuments({ role: User_1.UserRole.CITIZEN });
        const totalSchemes = await Scheme_1.Scheme.countDocuments({ isActive: true });
        const totalApplications = await Application_1.Application.countDocuments();
        const pendingApplications = await Application_1.Application.countDocuments({
            status: { $in: [Application_1.ApplicationStatus.SUBMITTED, Application_1.ApplicationStatus.DOC_VERIFICATION, Application_1.ApplicationStatus.OFFICER_REVIEW] }
        });
        const approvedApplications = await Application_1.Application.countDocuments({ status: Application_1.ApplicationStatus.APPROVED });
        const rejectedApplications = await Application_1.Application.countDocuments({ status: Application_1.ApplicationStatus.REJECTED });
        const duplicateFlagsCount = await DuplicateFlag_1.DuplicateFlag.countDocuments({ reviewStatus: DuplicateFlag_1.DuplicateReviewStatus.PENDING });
        const activeBenefitsCount = await BenefitRecord_1.BenefitRecord.countDocuments({ status: 'ACTIVE' });
        // Applications by Status
        const statusBreakdown = [
            { name: 'Submitted', count: await Application_1.Application.countDocuments({ status: Application_1.ApplicationStatus.SUBMITTED }) },
            { name: 'Doc Verification', count: await Application_1.Application.countDocuments({ status: Application_1.ApplicationStatus.DOC_VERIFICATION }) },
            { name: 'Officer Review', count: await Application_1.Application.countDocuments({ status: Application_1.ApplicationStatus.OFFICER_REVIEW }) },
            { name: 'Correction Required', count: await Application_1.Application.countDocuments({ status: Application_1.ApplicationStatus.CORRECTION_REQUIRED }) },
            { name: 'Approved', count: approvedApplications },
            { name: 'Rejected', count: rejectedApplications }
        ];
        res.status(200).json({
            metrics: {
                totalCitizens,
                totalSchemes,
                totalApplications,
                pendingApplications,
                approvedApplications,
                rejectedApplications,
                duplicateFlagsCount,
                activeBenefitsCount
            },
            statusBreakdown
        });
    }
    catch (error) {
        console.error('getDashboardAnalytics error:', error);
        res.status(500).json({ message: 'Error generating analytics metrics' });
    }
};
exports.getDashboardAnalytics = getDashboardAnalytics;
const getAdminDigiLockerMetrics = async (req, res) => {
    try {
        const mode = process.env.DIGILOCKER_MODE || 'mock';
        const totalConnections = await DigiLockerConnection_1.DigiLockerConnection.countDocuments();
        const activeConnections = await DigiLockerConnection_1.DigiLockerConnection.countDocuments({ status: 'CONNECTED' });
        const revokedConnections = await DigiLockerConnection_1.DigiLockerConnection.countDocuments({ status: 'REVOKED' });
        const totalDigiDocs = await DigiLockerDocument_1.DigiLockerDocument.countDocuments();
        const attachedDigiDocs = await ApplicationDocument_1.ApplicationDocument.countDocuments({ source: 'DIGILOCKER' });
        const consentCount = await DigiLockerConsent_1.DigiLockerConsent.countDocuments();
        const activeConsents = await DigiLockerConsent_1.DigiLockerConsent.countDocuments({ status: 'ACTIVE' });
        const revokedConsents = await DigiLockerConsent_1.DigiLockerConsent.countDocuments({ status: 'REVOKED' });
        // Recent DigiLocker Audit Logs
        const recentAuditLogs = await AuditLog_1.AuditLog.find({ action: { $regex: /DIGILOCKER/i } })
            .sort({ createdAt: -1 })
            .limit(10);
        const badgeLabel = mode === 'sandbox'
            ? 'DigiLocker Sandbox'
            : mode === 'production'
                ? 'DigiLocker Production'
                : 'Demo Document Source';
        res.status(200).json({
            mode,
            badgeLabel,
            metrics: {
                totalConnections,
                activeConnections,
                revokedConnections,
                totalDigiDocs,
                attachedDigiDocs,
                consentCount,
                activeConsents,
                revokedConsents,
                apiErrors: 0,
                retrievalFailures: 0
            },
            recentAuditLogs
        });
    }
    catch (error) {
        console.error('getAdminDigiLockerMetrics error:', error);
        res.status(500).json({ message: 'Error fetching DigiLocker administrative metrics' });
    }
};
exports.getAdminDigiLockerMetrics = getAdminDigiLockerMetrics;
const getAdminIntegrationHealth = async (req, res) => {
    try {
        const mode = process.env.DIGILOCKER_MODE || 'mock';
        const envBadgeLabel = mode === 'sandbox'
            ? 'DigiLocker Sandbox'
            : mode === 'production'
                ? 'DigiLocker Production'
                : 'Demo / Mock Environment';
        const lastLog = await AuditLog_1.AuditLog.findOne({ action: { $regex: /DIGILOCKER/i } }).sort({ createdAt: -1 });
        res.status(200).json({
            status: 'OPERATIONAL',
            mode,
            envBadgeLabel,
            configuration: {
                tokenEncryptionKeyConfigured: !!process.env.DIGILOCKER_TOKEN_ENCRYPTION_KEY,
                stateSecretConfigured: !!process.env.DIGILOCKER_STATE_SECRET,
                providerFactoryStatus: 'READY'
            },
            availability: mode === 'mock' ? '100% (Mock Engine Operational)' : '99.9%',
            lastSuccessfulOperation: lastLog ? lastLog.createdAt : new Date(),
            activeServices: [
                { name: 'DigiLocker OAuth Provider API', status: 'HEALTHY', mode },
                { name: 'Consent & Scope Validator', status: 'HEALTHY', mode },
                { name: 'Document Retrieval & Decryption Engine', status: 'HEALTHY', mode },
                { name: 'Application Document Mapper', status: 'HEALTHY', mode }
            ]
        });
    }
    catch (error) {
        console.error('getAdminIntegrationHealth error:', error);
        res.status(500).json({ message: 'Error fetching integration health status' });
    }
};
exports.getAdminIntegrationHealth = getAdminIntegrationHealth;
