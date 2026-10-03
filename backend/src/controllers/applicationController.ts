import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Application, ApplicationStatus } from '../models/Application';
import { Scheme } from '../models/Scheme';
import { ApplicationDocument } from '../models/ApplicationDocument';
import { BenefitRecord } from '../models/BenefitRecord';
import { Notification } from '../models/Notification';
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

    // Generate Secure Unique Reference Number: TNP-WP-2026-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const applicationReference = `TNP-WP-2026-${randomSuffix}`;

    const application = await Application.create({
      applicationNo: applicationReference,
      applicationReference,
      citizenId: req.user.id,
      schemeId: scheme._id,
      applicationMethod: applicationMethod || 'PROTOTYPE_ASSISTED',
      status: ApplicationStatus.SUBMITTED,
      currentStep: 6,
      completionPercentage: 100,
      formData: formData || {},
      declarationAccepted: declarationAccepted !== undefined ? declarationAccepted : true,
      statusHistory: [
        {
          previousStatus: 'DRAFT',
          newStatus: ApplicationStatus.SUBMITTED,
          changedBy: req.user.id as any,
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
        en: `Your application assistance package for ${scheme.name.en} has been logged. Current Status: Submitted.`,
        ta: `${scheme.name.ta} திட்டத்திற்கான உங்கள் விண்ணப்பம் பெறப்பட்டது.`
      },
      type: 'SUCCESS',
      linkUrl: `/citizen/applications/${application._id}`
    });

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
      .populate('citizenId', 'name email mobile district');
      
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

    const documents = await ApplicationDocument.find({ citizenId: req.user.id })
      .populate({
        path: 'applicationId',
        select: 'applicationReference status schemeId',
        populate: { path: 'schemeId', select: 'name' }
      })
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

    // Replace or add document
    if (replacementDoc) {
      await ApplicationDocument.findOneAndUpdate(
        { applicationId: application._id, docType: replacementDoc.docType },
        {
          fileName: replacementDoc.fileName || 'Document.pdf',
          fileUrl: replacementDoc.fileUrl || 'https://via.placeholder.com/600x800',
          source: replacementDoc.source || 'MANUAL_UPLOAD',
          sourceReference: replacementDoc.sourceReference || '',
          issuer: replacementDoc.issuer || '',
          issueDate: replacementDoc.issueDate || '',
          retrievedAt: replacementDoc.retrievedAt ? new Date(replacementDoc.retrievedAt) : undefined,
          uploadStatus: replacementDoc.source === 'DIGILOCKER' ? 'RETRIEVED' : 'UPLOADED',
          verificationStatus: 'NOT_REVIEWED',
          ocrConfidence: replacementDoc.ocrConfidence || 80,
          uploadedAt: new Date()
        },
        { upsert: true }
      );
    }

    application.status = ApplicationStatus.DOC_VERIFICATION;
    application.statusHistory.push({
      previousStatus: ApplicationStatus.CORRECTION_REQUIRED,
      newStatus: ApplicationStatus.DOC_VERIFICATION,
      changedBy: req.user.id as any,
      changedByRole: 'Citizen',
      reason: 'Citizen submitted corrected supporting document.',
      timestamp: new Date()
    });

    await application.save();

    res.status(200).json({
      message: 'Correction resubmitted successfully. Case returned to officer review queue.',
      application
    });
  } catch (error) {
    console.error('resubmitCorrection error:', error);
    res.status(500).json({ message: 'Error resubmitting correction' });
  }
};

