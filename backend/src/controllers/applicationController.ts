import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Application, ApplicationStatus } from '../models/Application';
import { Scheme } from '../models/Scheme';
import { ApplicationDocument } from '../models/ApplicationDocument';
import { BenefitRecord } from '../models/BenefitRecord';
import { Notification } from '../models/Notification';
import { User, UserRole } from '../models/User';
import { checkApplicationIntegrity } from '../services/duplicateService';

export const submitApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { schemeId, formData, documents, applicationMethod, declarationAccepted } = req.body;

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    // Duplicate submission prevention for active applications
    const existingActiveApp = await Application.findOne({
      citizenId: req.user.id,
      schemeId: scheme._id,
      status: {
        $in: [
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.CORRECTION_REQUIRED,
          ApplicationStatus.RESUBMITTED,
          ApplicationStatus.DOC_VERIFICATION,
          ApplicationStatus.OFFICER_REVIEW
        ]
      }
    });

    if (existingActiveApp) {
      res.status(400).json({
        message: `You already have an active application (${existingActiveApp.applicationReference}) under processing for this scheme. Please wait for the current application to complete.`
      });
      return;
    }

    // Backend Mandatory Document Validation Check
    const mandatoryConfigs = scheme.requiredDocuments?.filter((r: any) => r.isMandatory !== false) || [];
    const providedDocTypes = (documents || []).map((d: any) => d.docType);
    const missingMandatoryDocs = mandatoryConfigs.filter((cfg: any) => !providedDocTypes.includes(cfg.docType));

    if (missingMandatoryDocs.length > 0) {
      res.status(400).json({
        canProceed: false,
        message: 'Cannot submit application: All mandatory scheme documents must be provided.',
        missingDocuments: missingMandatoryDocs.map((m: any) => m.label?.en || m.docType)
      });
      return;
    }

    // Determine district from form data or user profile
    const district = formData?.district || req.user.district || 'Chennai';

    // Jurisdiction routing: Find officer responsible for this district
    let assignedOfficer = await User.findOne({ role: UserRole.OFFICER, district });
    if (!assignedOfficer) {
      // Fallback: look for any officer
      assignedOfficer = await User.findOne({ role: UserRole.OFFICER });
    }

    // Generate Secure Unique Reference Number: TNP-WP-2026-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const applicationReference = `TNP-WP-2026-${randomSuffix}`;

    const application = await Application.create({
      applicationNo: applicationReference,
      applicationReference,
      citizenId: req.user.id,
      schemeId: scheme._id,
      district,
      assignedOfficerId: assignedOfficer ? assignedOfficer._id : undefined,
      assignedAt: assignedOfficer ? new Date() : undefined,
      applicationMethod: applicationMethod || 'PROTOTYPE_ASSISTED',
      status: ApplicationStatus.SUBMITTED,
      currentStep: 1,
      completionPercentage: 10,
      formData: formData || {},
      declarationAccepted: declarationAccepted !== undefined ? declarationAccepted : true,
      statusHistory: [
        {
          previousStatus: 'DRAFT',
          newStatus: ApplicationStatus.SUBMITTED,
          changedBy: req.user.id as any,
          changedByRole: 'Citizen',
          reason: 'Application submitted by citizen',
          remarks: `Application logged for ${district} jurisdiction. Forwarded to District Officer.`,
          timestamp: new Date()
        }
      ]
    });

    // Save attached document records
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        await ApplicationDocument.create({
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
    await Notification.create({
      userId: req.user.id,
      title: {
        en: `Application ${applicationReference} Submitted`,
        ta: `விண்ணப்பம் ${applicationReference} சமர்ப்பிக்கப்பட்டது`
      },
      message: {
        en: `Your application for ${scheme.name.en} has been logged. Forwarded to ${district} District Officer. Status: SUBMITTED.`,
        ta: `${scheme.name.ta} திட்டத்திற்கான உங்கள் விண்ணப்பம் ${district} மாவட்ட அதிகாரிக்கு அனுப்பப்பட்டுள்ளது.`
      },
      type: 'SUCCESS',
      linkUrl: `/citizen/applications/${application._id}`
    });

    // Create Notification for the responsible Officer
    if (assignedOfficer) {
      await Notification.create({
        userId: assignedOfficer._id,
        title: {
          en: `New Application Received: ${applicationReference}`,
          ta: `புதிய விண்ணப்பம் பெறப்பட்டது: ${applicationReference}`
        },
        message: {
          en: `New application for ${scheme.name.en} from ${district} submitted by citizen ${req.user.name || ''}. Initial verification pending.`,
          ta: `${district} மாவட்டத்திலிருந்து ${scheme.name.ta} திட்டத்திற்கான புதிய விண்ணப்பம் சமர்ப்பிக்கப்பட்டுள்ளது.`
        },
        type: 'ACTION_REQUIRED',
        linkUrl: `/officer/applications/${application._id}`
      });
    }

    // Trigger asynchronous integrity check
    checkApplicationIntegrity(application);

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationReference,
      application
    });
  } catch (error) {
    console.error('submitApplication error:', error);
    res.status(500).json({ message: 'Error submitting application' });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const applications = await Application.find({ citizenId: req.user.id })
      .populate('schemeId')
      .sort({ createdAt: -1 });

    const activeBenefits = await BenefitRecord.find({ citizenId: req.user.id })
      .populate('schemeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      applications,
      activeBenefits
    });
  } catch (error) {
    console.error('getMyApplications error:', error);
    res.status(500).json({ message: 'Error fetching applications portfolio' });
  }
};

export const getApplicationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate('schemeId')
      .populate('citizenId', 'name email mobile district')
      .populate('approvedBy', 'name role district email')
      .populate('rejectedBy', 'name role district email')
      .populate('statusHistory.changedBy', 'name role district');
      
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const documents = await ApplicationDocument.find({ applicationId: application._id })
      .populate('verifiedBy', 'name role district email')
      .populate('correctionRequestedBy', 'name role district email')
      .populate('rejectedBy', 'name role district email')
      .sort({ version: -1, createdAt: -1 });

    const benefitRecord = await BenefitRecord.findOne({ applicationId: application._id });

    res.status(200).json({
      application,
      documents,
      benefitRecord
    });
  } catch (error) {
    console.error('getApplicationById error:', error);
    res.status(500).json({ message: 'Error fetching application tracking timeline' });
  }
};

export const getMyDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const documents = await ApplicationDocument.find({ citizenId: req.user.id, isCurrentVersion: true })
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
  } catch (error) {
    console.error('getMyDocuments error:', error);
    res.status(500).json({ message: 'Error fetching application documents' });
  }
};

export const resubmitCorrection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { id } = req.params;
    const { replacementDoc } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    let newDoc = null;

    // Document Versioning: Keep old document record in history, create new version
    if (replacementDoc) {
      const existingDoc = await ApplicationDocument.findOne({
        applicationId: application._id,
        docType: replacementDoc.docType,
        isCurrentVersion: true
      });

      if (existingDoc) {
        existingDoc.isCurrentVersion = false;
        await existingDoc.save();
      }

      newDoc = await ApplicationDocument.create({
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

    application.status = ApplicationStatus.RESUBMITTED;
    application.statusHistory.push({
      previousStatus: ApplicationStatus.CORRECTION_REQUIRED,
      newStatus: ApplicationStatus.RESUBMITTED,
      changedBy: req.user.id as any,
      changedByRole: 'Citizen',
      reason: 'Citizen submitted corrected supporting document.',
      timestamp: new Date()
    });

    await application.save();

    // Notify assigned officer
    if (application.assignedOfficerId) {
      await Notification.create({
        userId: application.assignedOfficerId,
        title: {
          en: `Corrected Documents Resubmitted: ${application.applicationReference}`,
          ta: `திருத்தப்பட்ட ஆவணம் மீண்டும் சமர்ப்பிக்கப்பட்டது: ${application.applicationReference}`
        },
        message: {
          en: `Citizen has resubmitted corrected documents for application ${application.applicationReference}. Ready for verification.`,
          ta: `${application.applicationReference} விண்ணப்பத்திற்கான திருத்தப்பட்ட ஆவணம் பெறப்பட்டுள்ளது.`
        },
        type: 'ACTION_REQUIRED',
        linkUrl: `/officer/applications/${application._id}`
      });
    }

    res.status(200).json({
      message: 'Correction resubmitted successfully. Case returned to officer review queue.',
      application,
      newDocument: newDoc
    });
  } catch (error) {
    console.error('resubmitCorrection error:', error);
    res.status(500).json({ message: 'Error resubmitting correction' });
  }
};

