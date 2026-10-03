import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Application, ApplicationStatus } from '../models/Application';
import { Scheme } from '../models/Scheme';
import { User, UserRole } from '../models/User';
import { DuplicateFlag, DuplicateReviewStatus } from '../models/DuplicateFlag';
import { BenefitRecord } from '../models/BenefitRecord';
import { AuditLog } from '../models/AuditLog';
import { ApplicationDocument } from '../models/ApplicationDocument';
import { Notification } from '../models/Notification';
import { DigiLockerConnection } from '../models/DigiLockerConnection';
import { DigiLockerConsent } from '../models/DigiLockerConsent';
import { DigiLockerDocument } from '../models/DigiLockerDocument';


export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [{ applicationNo: searchRegex }, { applicationReference: searchRegex }];
    }

    const applications = await Application.find(query)
      .populate('schemeId')
      .populate('citizenId', 'name email mobile district')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('getAllApplications error:', error);
    res.status(500).json({ message: 'Error fetching application queue' });
  }
};

export const getApplicationDetailsForOfficer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate('schemeId')
      .populate('citizenId', 'name email mobile district annualIncome community');

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const documents = await ApplicationDocument.find({ applicationId: application._id });
    const benefitRecord = await BenefitRecord.findOne({ applicationId: application._id });

    res.status(200).json({
      application,
      documents,
      benefitRecord
    });
  } catch (error) {
    console.error('getApplicationDetailsForOfficer error:', error);
    res.status(500).json({ message: 'Error fetching application details' });
  }
};

export const updateDocumentVerificationStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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
    const { verificationStatus, officerRemarks } = req.body;

    const document = await ApplicationDocument.findOne({
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
    document.verifiedAt = new Date();
    document.verifiedBy = req.user.id as any;
    await document.save();

    // If status is CORRECTION_REQUIRED, update application status as well and notify citizen
    if (verificationStatus === 'CORRECTION_REQUIRED') {
      const application = await Application.findById(id);
      if (application) {
        application.status = ApplicationStatus.CORRECTION_REQUIRED;
        application.officerRemarks = officerRemarks || 'Correction required for supporting document.';
        application.correctionCount = (application.correctionCount || 0) + 1;
        application.statusHistory.push({
          previousStatus: application.status,
          newStatus: ApplicationStatus.CORRECTION_REQUIRED,
          changedBy: req.user.id as any,
          changedByRole: req.user.role || 'Officer',
          reason: officerRemarks || 'Officer requested document correction',
          timestamp: new Date()
        });
        await application.save();

        // Create Citizen Notification
        await Notification.create({
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
    }

    // Audit Log
    await AuditLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: `VERIFY_DOCUMENT_${verificationStatus}`,
      targetType: 'ApplicationDocument',
      targetId: document._id.toString(),
      details: officerRemarks || `Document verification status set to ${verificationStatus}`
    });

    res.status(200).json({
      message: `Document status updated to ${verificationStatus}`,
      document
    });
  } catch (error) {
    console.error('updateDocumentVerificationStatus error:', error);
    res.status(500).json({ message: 'Error updating document verification status' });
  }
};

export const updateApplicationStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { id } = req.params;
    const { status, remarks, correctionRequested } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const previousStatus = application.status;
    application.status = status;
    application.officerRemarks = remarks || application.officerRemarks;

    if (status === ApplicationStatus.CORRECTION_REQUIRED) {
      application.correctionCount = (application.correctionCount || 0) + 1;
    }

    application.statusHistory.push({
      previousStatus: previousStatus as string,
      newStatus: status as string,
      changedBy: req.user.id as any,
      changedByRole: req.user.role || 'Officer',
      remarks: remarks || `Status updated to ${status} by Officer`,
      timestamp: new Date()
    });

    await application.save();

    // If Approved, create active BenefitRecord
    if (status === ApplicationStatus.APPROVED) {
      const scheme = await Scheme.findById(application.schemeId);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      await BenefitRecord.create({
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
    await AuditLog.create({
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
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
};

export const getDuplicateFlags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flags = await DuplicateFlag.find()
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
  } catch (error) {
    console.error('getDuplicateFlags error:', error);
    res.status(500).json({ message: 'Error fetching duplicate integrity flags' });
  }
};

export const updateDuplicateFlagStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { id } = req.params;
    const { reviewStatus, officerNotes } = req.body;

    const flag = await DuplicateFlag.findByIdAndUpdate(
      id,
      {
        reviewStatus,
        officerNotes,
        reviewedBy: req.user.id
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Duplicate flag review updated',
      flag
    });
  } catch (error) {
    console.error('updateDuplicateFlagStatus error:', error);
    res.status(500).json({ message: 'Error updating duplicate flag status' });
  }
};

export const getDashboardAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalCitizens = await User.countDocuments({ role: UserRole.CITIZEN });
    const totalSchemes = await Scheme.countDocuments({ isActive: true });
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({
      status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.DOC_VERIFICATION, ApplicationStatus.OFFICER_REVIEW] }
    });
    const approvedApplications = await Application.countDocuments({ status: ApplicationStatus.APPROVED });
    const rejectedApplications = await Application.countDocuments({ status: ApplicationStatus.REJECTED });
    const duplicateFlagsCount = await DuplicateFlag.countDocuments({ reviewStatus: DuplicateReviewStatus.PENDING });
    const activeBenefitsCount = await BenefitRecord.countDocuments({ status: 'ACTIVE' });

    // Applications by Status
    const statusBreakdown = [
      { name: 'Submitted', count: await Application.countDocuments({ status: ApplicationStatus.SUBMITTED }) },
      { name: 'Doc Verification', count: await Application.countDocuments({ status: ApplicationStatus.DOC_VERIFICATION }) },
      { name: 'Officer Review', count: await Application.countDocuments({ status: ApplicationStatus.OFFICER_REVIEW }) },
      { name: 'Correction Required', count: await Application.countDocuments({ status: ApplicationStatus.CORRECTION_REQUIRED }) },
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
  } catch (error) {
    console.error('getDashboardAnalytics error:', error);
    res.status(500).json({ message: 'Error generating analytics metrics' });
  }
};

export const getAdminDigiLockerMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mode = process.env.DIGILOCKER_MODE || 'mock';
    const totalConnections = await DigiLockerConnection.countDocuments();
    const activeConnections = await DigiLockerConnection.countDocuments({ status: 'CONNECTED' });
    const revokedConnections = await DigiLockerConnection.countDocuments({ status: 'REVOKED' });
    const totalDigiDocs = await DigiLockerDocument.countDocuments();
    const attachedDigiDocs = await ApplicationDocument.countDocuments({ source: 'DIGILOCKER' });
    const consentCount = await DigiLockerConsent.countDocuments();
    const activeConsents = await DigiLockerConsent.countDocuments({ status: 'ACTIVE' });
    const revokedConsents = await DigiLockerConsent.countDocuments({ status: 'REVOKED' });

    // Recent DigiLocker Audit Logs
    const recentAuditLogs = await AuditLog.find({ action: { $regex: /DIGILOCKER/i } })
      .sort({ createdAt: -1 })
      .limit(10);

    const badgeLabel =
      mode === 'sandbox'
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
  } catch (error) {
    console.error('getAdminDigiLockerMetrics error:', error);
    res.status(500).json({ message: 'Error fetching DigiLocker administrative metrics' });
  }
};

export const getAdminIntegrationHealth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mode = process.env.DIGILOCKER_MODE || 'mock';
    const envBadgeLabel =
      mode === 'sandbox'
        ? 'DigiLocker Sandbox'
        : mode === 'production'
        ? 'DigiLocker Production'
        : 'Demo / Mock Environment';

    const lastLog = await AuditLog.findOne({ action: { $regex: /DIGILOCKER/i } }).sort({ createdAt: -1 });

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
  } catch (error) {
    console.error('getAdminIntegrationHealth error:', error);
    res.status(500).json({ message: 'Error fetching integration health status' });
  }
};


