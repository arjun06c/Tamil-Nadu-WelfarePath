"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardAnalytics = exports.updateDuplicateFlagStatus = exports.getDuplicateFlags = exports.updateApplicationStatus = exports.getAllApplications = void 0;
const Application_1 = require("../models/Application");
const Scheme_1 = require("../models/Scheme");
const User_1 = require("../models/User");
const DuplicateFlag_1 = require("../models/DuplicateFlag");
const BenefitRecord_1 = require("../models/BenefitRecord");
const AuditLog_1 = require("../models/AuditLog");
const getAllApplications = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            query.$or = [{ applicationNo: searchRegex }];
        }
        const applications = await Application_1.Application.find(query)
            .populate('schemeId')
            .populate('citizenId', 'name email mobile district')
            .sort({ createdAt: -1 });
        res.status(200).json({ applications });
    }
    catch (error) {
        console.error('getAllApplications error:', error);
        res.status(500).json({ message: 'Error fetching application queue' });
    }
};
exports.getAllApplications = getAllApplications;
const updateApplicationStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { id } = req.params;
        const { status, remarks, correctionRequested } = req.body;
        const application = await Application_1.Application.findById(id);
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        const previousStatus = application.status;
        application.status = status;
        application.officerRemarks = remarks || application.officerRemarks;
        if (status === Application_1.ApplicationStatus.CORRECTION_REQUIRED) {
            application.correctionCount = (application.correctionCount || 0) + 1;
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
