import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { CitizenProfile, ICitizenProfile } from '../models/CitizenProfile';
import { Scheme } from '../models/Scheme';
import { Application, ApplicationStatus } from '../models/Application';
import { ApplicationDocument } from '../models/ApplicationDocument';
import { BenefitRecord } from '../models/BenefitRecord';
import { DigiLockerConnection } from '../models/DigiLockerConnection';
import { evaluateSchemeEligibility } from '../services/eligibilityService';

/**
 * Dynamic Profile Completion Calculator
 */
export const calculateProfileCompletion = (profile: ICitizenProfile | null) => {
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

/**
 * Evaluates citizen eligibility across all published schemes
 */
export const getEvaluatedRecommendationsForCitizen = async (userId: string) => {
  let profile = await CitizenProfile.findOne({ userId });
  if (!profile) {
    profile = await CitizenProfile.create({
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

  const appDocs = await ApplicationDocument.find({ citizenId: userId });
  const attachedDocTypes = appDocs.map((d) => d.docType);
  const confirmedFacts: Record<string, any> = {};
  const verifiedFacts: Record<string, any> = {};

  for (const doc of appDocs) {
    const facts = doc.citizenConfirmedData || doc.extractedData || {};
    if (doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED') {
      Object.assign(verifiedFacts, facts);
    } else {
      Object.assign(confirmedFacts, facts);
    }
  }

  const schemes = await Scheme.find({ isActive: true });
  const recommendations: any[] = [];

  let strongMatches = 0;
  let potentialMatches = 0;
  let needsInformation = 0;
  let documentsNeeded = 0;
  let notEligible = 0;

  for (const scheme of schemes) {
    const outcome = evaluateSchemeEligibility(scheme, profile, attachedDocTypes, {
      confirmedFacts,
      verifiedFacts,
      attachedDocTypes
    });

    if (outcome.status === 'STRONG_MATCH') strongMatches++;
    else if (outcome.status === 'POTENTIAL_MATCH') potentialMatches++;
    else if (outcome.status === 'NEEDS_INFORMATION') needsInformation++;
    else if (outcome.status === 'DOCUMENTS_REQUIRED') documentsNeeded++;
    else notEligible++;

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

  const statusPriority: Record<string, number> = {
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

/**
 * Aggregated Citizen Dashboard Controller
 */
export const getCitizenDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const userId = req.user.id;

    const [recData, applications, appDocs, activeBenefits, digilockerConn] = await Promise.all([
      getEvaluatedRecommendationsForCitizen(userId),
      Application.find({ citizenId: userId }).populate('schemeId').sort({ createdAt: -1 }),
      ApplicationDocument.find({ citizenId: userId }),
      BenefitRecord.find({ citizenId: userId }).populate('schemeId').sort({ createdAt: -1 }),
      DigiLockerConnection.findOne({ citizenId: userId, status: 'CONNECTED' })
    ]);

    const profileCompletion = calculateProfileCompletion(recData.profile);

    // Application Statistics
    const activeApps = applications.filter(
      (a) => a.status !== ApplicationStatus.APPROVED && a.status !== ApplicationStatus.REJECTED
    );
    const attentionApps = applications.filter(
      (a) => a.status === ApplicationStatus.CORRECTION_REQUIRED || a.status === ApplicationStatus.REJECTED
    );

    // Document Statistics
    const verifiedDocs = appDocs.filter((d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'ACCEPTED');
    const pendingDocs = appDocs.filter((d) => d.verificationStatus === 'NOT_REVIEWED');
    const correctionDocs = appDocs.filter((d) => d.verificationStatus === 'REJECTED' || d.verificationStatus === 'CORRECTION_REQUIRED');

    // Action Required Generator ("What should you do next?")
    const actionRequiredItems: Array<{
      id: string;
      type: 'PROFILE' | 'DOCUMENT' | 'APPLICATION';
      title: { en: string; ta: string };
      description: { en: string; ta: string };
      ctaText: { en: string; ta: string };
      ctaPath: string;
    }> = [];

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
      const schemeTitle = (firstApp.schemeId as any)?.name?.en || firstApp.applicationNo;
      const schemeTitleTa = (firstApp.schemeId as any)?.name?.ta || firstApp.applicationNo;
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
  } catch (error) {
    console.error('getCitizenDashboard error:', error);
    res.status(500).json({ message: 'Error fetching citizen dashboard data' });
  }
};

/**
 * Dedicated Recommendation Controller for Citizen
 */
export const getCitizenRecommendedSchemes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { summary, recommendations } = await getEvaluatedRecommendationsForCitizen(req.user.id);

    res.status(200).json({
      summary,
      recommendations
    });
  } catch (error) {
    console.error('getCitizenRecommendedSchemes error:', error);
    res.status(500).json({ message: 'Error fetching recommended schemes' });
  }
};
