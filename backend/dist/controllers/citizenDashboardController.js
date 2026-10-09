"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCitizenRecommendedSchemes = exports.getCitizenDashboard = exports.getEvaluatedRecommendationsForCitizen = exports.calculateProfileCompletion = void 0;
const CitizenProfile_1 = require("../models/CitizenProfile");
const Scheme_1 = require("../models/Scheme");
const Application_1 = require("../models/Application");
const ApplicationDocument_1 = require("../models/ApplicationDocument");
const BenefitRecord_1 = require("../models/BenefitRecord");
const DigiLockerConnection_1 = require("../models/DigiLockerConnection");
const eligibilityService_1 = require("../services/eligibilityService");
/**
 * Dynamic Profile Completion Calculator
 */
const calculateProfileCompletion = (profile) => {
    if (!profile) {
        return {
            percentage: 0,
            isComplete: false,
            missingFields: [
                { field: 'dob', label: { en: 'Date of Birth', ta: 'பிறந்த தேதி' } },
                { field: 'district', label: { en: 'District', ta: 'மாவட்டம்' } },
                { field: 'annualIncome', label: { en: 'Annual Income', ta: 'ஆண்டு வருமானம்' } }
            ]
        };
    }
    const checkFields = [
        { key: 'dob', label: { en: 'Date of Birth', ta: 'பிறந்த தேதி' }, filled: !!profile.dob },
        { key: 'gender', label: { en: 'Gender', ta: 'பாலினம்' }, filled: !!profile.gender },
        { key: 'district', label: { en: 'District', ta: 'மாவட்டம்' }, filled: !!profile.district && profile.district.trim() !== '' },
        { key: 'taluk', label: { en: 'Taluk', ta: 'தாலுகா' }, filled: !!profile.taluk && profile.taluk.trim() !== '' },
        { key: 'villageTown', label: { en: 'Village / Town', ta: 'கிராமம் / நகரம்' }, filled: !!profile.villageTown && profile.villageTown.trim() !== '' },
        { key: 'annualIncome', label: { en: 'Annual Family Income', ta: 'ஆண்டு குடும்ப வருமானம்' }, filled: profile.annualIncome !== undefined && profile.annualIncome !== null && profile.annualIncome > 0 },
        { key: 'occupation', label: { en: 'Occupation Details', ta: 'தொழில் விவரங்கள்' }, filled: !!profile.occupation && profile.occupation.trim() !== '' },
        { key: 'employmentStatus', label: { en: 'Employment Status', ta: 'வேலைவாய்ப்பு நிலை' }, filled: !!profile.employmentStatus },
        { key: 'educationLevel', label: { en: 'Education Level', ta: 'கல்வித்தகுதி' }, filled: !!profile.educationLevel },
        { key: 'socialCategory', label: { en: 'Social Category (Community)', ta: 'சமூகப் பிரிவு (ஜாதி)' }, filled: !!profile.socialCategory },
        { key: 'aadhaarHash', label: { en: 'Aadhaar Verification', ta: 'ஆதார் சரிபார்ப்பு' }, filled: !!profile.aadhaarHash && profile.aadhaarHash.trim() !== '' },
        { key: 'bankDetails', label: { en: 'Bank Account & IFSC', ta: 'வங்கி கணக்கு மற்றும் IFSC' }, filled: !!(profile.bankDetails?.ifscCode && profile.bankDetails.ifscCode.trim() !== '') }
    ];
    const total = checkFields.length;
    const filled = checkFields.filter((f) => f.filled).length;
    const missingFields = checkFields.filter((f) => !f.filled).map((f) => ({ field: f.key, label: f.label }));
    const percentage = Math.round((filled / total) * 100);
    return {
        percentage,
        isComplete: percentage === 100,
        missingFields
    };
};
exports.calculateProfileCompletion = calculateProfileCompletion;
/**
 * Evaluates citizen eligibility across all published schemes
 */
const getEvaluatedRecommendationsForCitizen = async (userId) => {
    let profile = await CitizenProfile_1.CitizenProfile.findOne({ userId });
    if (!profile) {
        profile = await CitizenProfile_1.CitizenProfile.create({
            userId,
            dob: new Date('2000-01-01'),
            gender: 'Female',
            district: 'Chennai',
            taluk: 'Egmore',
            villageTown: 'Nungambakkam',
            annualIncome: 150000,
            occupation: 'Student',
            employmentStatus: 'Student',
            educationLevel: 'Undergraduate',
            socialCategory: 'BC',
            disabilityStatus: false,
            disabilityPercentage: 0,
            isFarmer: false,
            isUnorganizedWorker: false,
            govtSchoolYears6To12: false,
            familyMembersCount: 4,
            dependentsCount: 2
        });
    }
    const appDocs = await ApplicationDocument_1.ApplicationDocument.find({ citizenId: userId });
    const attachedDocTypes = appDocs.map((d) => d.docType);
    const confirmedFacts = {};
    const verifiedFacts = {};
    for (const doc of appDocs) {
        const facts = doc.citizenConfirmedData || doc.extractedData || {};
        if (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED') {
            Object.assign(verifiedFacts, facts);
        }
        else {
            Object.assign(confirmedFacts, facts);
        }
    }
    const schemes = await Scheme_1.Scheme.find({ isActive: true });
    const recommendations = [];
    let strongMatches = 0;
    let potentialMatches = 0;
    let needsInformation = 0;
    let documentsNeeded = 0;
    let notEligible = 0;
    for (const scheme of schemes) {
        const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(scheme, profile, attachedDocTypes, {
            confirmedFacts,
            verifiedFacts,
            attachedDocTypes
        });
        if (outcome.status === 'STRONG_MATCH')
            strongMatches++;
        else if (outcome.status === 'POTENTIAL_MATCH')
            potentialMatches++;
        else if (outcome.status === 'NEEDS_INFORMATION')
            needsInformation++;
        else if (outcome.status === 'DOCUMENTS_REQUIRED')
            documentsNeeded++;
        else
            notEligible++;
        if (outcome.missingDocuments && outcome.missingDocuments.length > 0 && outcome.status !== 'NOT_ELIGIBLE') {
            documentsNeeded++;
        }
        recommendations.push({
            scheme,
            status: outcome.status,
            statusBadge: outcome.statusBadge,
            gapAnalysisRemarks: outcome.gapAnalysisRemarks,
            criteriaBreakdown: outcome.criteriaBreakdown,
            exclusionBreakdown: outcome.exclusionBreakdown,
            missingInformation: outcome.missingInformation,
            missingDocuments: outcome.missingDocuments,
            isPreliminaryMatch: outcome.isPreliminaryMatch,
            isVerifiedMatch: outcome.isVerifiedMatch,
            hasDataConflict: outcome.hasDataConflict,
            conflictDetails: outcome.conflictDetails,
            failedMandatoryCount: outcome.failedMandatoryCount,
            triggeredExclusionCount: outcome.triggeredExclusionCount
        });
    }
    const statusPriority = {
        STRONG_MATCH: 1,
        POTENTIAL_MATCH: 2,
        NEEDS_INFORMATION: 3,
        DOCUMENTS_REQUIRED: 4,
        NOT_ELIGIBLE: 5
    };
    recommendations.sort((a, b) => (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99));
    const summary = {
        strongMatches,
        potentialMatches,
        needsInformation,
        documentsNeeded,
        notEligible,
        totalEligibleCount: strongMatches + potentialMatches
    };
    return {
        profile,
        summary,
        recommendations
    };
};
exports.getEvaluatedRecommendationsForCitizen = getEvaluatedRecommendationsForCitizen;
/**
 * Aggregated Citizen Dashboard Controller
 */
const getCitizenDashboard = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const userId = req.user.id;
        const [recData, applications, appDocs, activeBenefits, digilockerConn] = await Promise.all([
            (0, exports.getEvaluatedRecommendationsForCitizen)(userId),
            Application_1.Application.find({ citizenId: userId }).populate('schemeId').sort({ createdAt: -1 }),
            ApplicationDocument_1.ApplicationDocument.find({ citizenId: userId }),
            BenefitRecord_1.BenefitRecord.find({ citizenId: userId }).populate('schemeId').sort({ createdAt: -1 }),
            DigiLockerConnection_1.DigiLockerConnection.findOne({ citizenId: userId, status: 'CONNECTED' })
        ]);
        const profileCompletion = (0, exports.calculateProfileCompletion)(recData.profile);
        // Application Statistics
        const activeApps = applications.filter((a) => a.status !== Application_1.ApplicationStatus.APPROVED && a.status !== Application_1.ApplicationStatus.REJECTED);
        const attentionApps = applications.filter((a) => a.status === Application_1.ApplicationStatus.CORRECTION_REQUIRED || a.status === Application_1.ApplicationStatus.REJECTED);
        // Document Statistics
        const verifiedDocs = appDocs.filter((d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'ACCEPTED');
        const pendingDocs = appDocs.filter((d) => d.verificationStatus === 'NOT_REVIEWED');
        const correctionDocs = appDocs.filter((d) => d.verificationStatus === 'REJECTED' || d.verificationStatus === 'CORRECTION_REQUIRED');
        // Action Required Generator ("What should you do next?")
        const actionRequiredItems = [];
        if (!profileCompletion.isComplete) {
            const topMissing = profileCompletion.missingFields.slice(0, 2).map((m) => m.label.en).join(', ');
            const topMissingTa = profileCompletion.missingFields.slice(0, 2).map((m) => m.label.ta).join(', ');
            actionRequiredItems.push({
                id: 'act-profile',
                type: 'PROFILE',
                title: { en: 'Complete your profile', ta: 'சுயவிவரத்தைப் பூர்த்தி செய்யவும்' },
                description: {
                    en: `Your profile is ${profileCompletion.percentage}% complete. Missing: ${topMissing}`,
                    ta: `உங்கள் சுயவிவரம் ${profileCompletion.percentage}% பூர்த்தியாகியுள்ளது. விடுபட்டவை: ${topMissingTa}`
                },
                ctaText: { en: 'Complete Profile', ta: 'சுயவிவரத்தை புதுப்பிக்க' },
                ctaPath: '/citizen/profile'
            });
        }
        if (recData.summary.potentialMatches > 0 || recData.summary.documentsNeeded > 0) {
            actionRequiredItems.push({
                id: 'act-docs',
                type: 'DOCUMENT',
                title: { en: 'Proof Documents Needed', ta: 'சான்றிதழ் ஆவணங்கள் தேவைப்படுகின்றன' },
                description: {
                    en: `Upload proof documents to confirm eligibility for ${recData.summary.potentialMatches} scheme match(es).`,
                    ta: `${recData.summary.potentialMatches} திட்டங்களுக்கான சான்றிதழ்களைப் பதிவேற்றவும்.`
                },
                ctaText: { en: 'Add Documents', ta: 'ஆவணம் சேர்க்க' },
                ctaPath: '/citizen/documents'
            });
        }
        if (attentionApps.length > 0) {
            const firstApp = attentionApps[0];
            const schemeTitle = firstApp.schemeId?.name?.en || firstApp.applicationNo;
            const schemeTitleTa = firstApp.schemeId?.name?.ta || firstApp.applicationNo;
            actionRequiredItems.push({
                id: 'act-app-' + firstApp._id,
                type: 'APPLICATION',
                title: { en: 'Application Action Required', ta: 'விண்ணப்ப நடவடிக்கை தேவை' },
                description: {
                    en: `${schemeTitle} requires doc correction or review.`,
                    ta: `${schemeTitleTa} சான்றிதழ் திருத்தம் தேவைப்படுகிறது.`
                },
                ctaText: { en: 'View Application', ta: 'விண்ணப்பத்தைப் பார்க்க' },
                ctaPath: `/citizen/applications/${firstApp._id}`
            });
        }
        res.status(200).json({
            profileCompletion,
            eligibilitySummary: recData.summary,
            recommendations: recData.recommendations,
            applicationsSummary: {
                totalCount: applications.length,
                activeCount: activeApps.length,
                attentionCount: attentionApps.length,
                recentApplications: applications.slice(0, 3)
            },
            documentsSummary: {
                totalUploaded: appDocs.length,
                verifiedCount: verifiedDocs.length,
                pendingCount: pendingDocs.length,
                correctionCount: correctionDocs.length
            },
            benefitsSummary: {
                totalActive: activeBenefits.length,
                activeBenefits
            },
            digilockerStatus: {
                isConnected: !!digilockerConn,
                connectedAt: digilockerConn?.connectedAt || null
            },
            actionRequiredItems
        });
    }
    catch (error) {
        console.error('getCitizenDashboard error:', error);
        res.status(500).json({ message: 'Error fetching citizen dashboard data' });
    }
};
exports.getCitizenDashboard = getCitizenDashboard;
/**
 * Dedicated Recommendation Controller for Citizen
 */
const getCitizenRecommendedSchemes = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthenticated' });
            return;
        }
        const { summary, recommendations } = await (0, exports.getEvaluatedRecommendationsForCitizen)(req.user.id);
        res.status(200).json({
            summary,
            recommendations
        });
    }
    catch (error) {
        console.error('getCitizenRecommendedSchemes error:', error);
        res.status(500).json({ message: 'Error fetching recommended schemes' });
    }
};
exports.getCitizenRecommendedSchemes = getCitizenRecommendedSchemes;
