import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/authMiddleware';
import { ApplicationDocument } from '../models/ApplicationDocument';
import { Application, ApplicationStatus } from '../models/Application';
import { Notification } from '../models/Notification';
import { UserRole } from '../models/User';

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MOCK_DIR = path.join(__dirname, '../../public/mock-documents');

/**
 * Handle citizen document file upload via multer
 */
export const uploadDocumentFile = async (req: AuthRequest & { file?: any }, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    res.status(200).json({
      success: true,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('uploadDocumentFile error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
};

/**
 * Retrieve document metadata by ID
 */
export const getDocumentMetadata = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const doc = await ApplicationDocument.findById(id)
      .populate('verifiedBy', 'name role district')
      .populate('correctionRequestedBy', 'name role district');

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Access check: citizen owner or officer/admin
    if (req.user && req.user.role === UserRole.CITIZEN && doc.citizenId.toString() !== req.user.id) {
      res.status(403).json({ message: 'Access denied to this document' });
      return;
    }

    res.status(200).json({ document: doc });
  } catch (error) {
    console.error('getDocumentMetadata error:', error);
    res.status(500).json({ message: 'Error retrieving document metadata' });
  }
};

/**
 * Stream or download document file
 */
export const streamDocumentFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isDownload = req.query.download === 'true';

    const doc = await ApplicationDocument.findById(id);
    if (!doc) {
      res.status(404).json({ message: 'Document record not found' });
      return;
    }

    let filePath: string | null = null;
    let fileName = doc.fileName || 'document.pdf';
    let mimeType = doc.mimeType || 'application/pdf';

    // 1. Check if fileUrl points to mock-documents
    if (doc.fileUrl.includes('/mock-documents/')) {
      const mockFileName = doc.fileUrl.split('/mock-documents/').pop();
      if (mockFileName) {
        const potentialMockPath = path.join(MOCK_DIR, mockFileName);
        if (fs.existsSync(potentialMockPath)) {
          filePath = potentialMockPath;
          if (mockFileName.endsWith('.svg')) mimeType = 'image/svg+xml';
          else if (mockFileName.endsWith('.png')) mimeType = 'image/png';
          else if (mockFileName.endsWith('.pdf')) mimeType = 'application/pdf';
        }
      }
    }

    // 2. Check if fileUrl points to uploads
    if (!filePath && doc.fileUrl.includes('/uploads/documents/')) {
      const uploadFileName = doc.fileUrl.split('/uploads/documents/').pop();
      if (uploadFileName) {
        const potentialUploadPath = path.join(UPLOAD_DIR, uploadFileName);
        if (fs.existsSync(potentialUploadPath)) {
          filePath = potentialUploadPath;
        }
      }
    }

    // 3. Fallback to matching mock document based on docType if file is missing
    if (!filePath) {
      const docTypeToMock: Record<string, string> = {
        GovtSchoolStudyCertificate: 'study_certificate_kavitha.svg',
        CollegeStudyCertificate: 'college_bonafide_kavitha.svg',
        CollegeBonafideCertificate: 'college_bonafide_kavitha.svg',
        StudyCertificate: 'study_certificate_kavitha.svg',
        IncomeCertificate: 'income_certificate_kavitha.svg',
        CommunityCertificate: 'community_certificate_kavitha.svg',
        BankPassbook: 'bank_passbook_kavitha.svg',
        AadhaarCard: 'aadhaar_card_kavitha.svg',
        AadhaarProof: 'aadhaar_card_kavitha.svg',
        AgeProof: 'aadhaar_card_kavitha.svg',
        SmartRationCard: 'smart_ration_card_kavitha.svg',
        RationCard: 'smart_ration_card_kavitha.svg',
        NativityCertificate: 'nativity_certificate_kavitha.svg',
        ResidenceCertificate: 'nativity_certificate_kavitha.svg'
      };

      const matchedMock = docTypeToMock[doc.docType] || 'income_certificate_kavitha.svg';
      const mockCandidate = path.join(MOCK_DIR, matchedMock);
      if (fs.existsSync(mockCandidate)) {
        filePath = mockCandidate;
        mimeType = 'image/svg+xml';
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Document file not found on server' });
      return;
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      isDownload ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`
    );
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    console.error('streamDocumentFile error:', error);
    res.status(500).json({ message: 'Error streaming document' });
  }
};

/**
 * Replace a document requested for correction
 */
export const replaceDocumentOnCorrection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthenticated' });
      return;
    }

    const { id } = req.params;
    const { fileUrl, fileName, fileSize, mimeType } = req.body;

    const oldDoc = await ApplicationDocument.findById(id);
    if (!oldDoc) {
      res.status(404).json({ message: 'Target document not found' });
      return;
    }

    if (oldDoc.citizenId.toString() !== req.user.id) {
      res.status(403).json({ message: 'Unauthorized: cannot replace another user document' });
      return;
    }

    // Mark previous version inactive
    oldDoc.isCurrentVersion = false;
    await oldDoc.save();

    // Create new version
    const newVersionDoc = await ApplicationDocument.create({
      applicationId: oldDoc.applicationId,
      citizenId: oldDoc.citizenId,
      docType: oldDoc.docType,
      documentName: oldDoc.documentName,
      fileName: fileName || oldDoc.fileName,
      fileUrl: fileUrl || oldDoc.fileUrl,
      fileSize: fileSize || oldDoc.fileSize,
      mimeType: mimeType || oldDoc.mimeType,
      source: 'MANUAL_UPLOAD',
      uploadStatus: 'UPLOADED',
      ocrStatus: 'COMPLETED',
      verificationStatus: 'NOT_REVIEWED',
      version: (oldDoc.version || 1) + 1,
      previousVersionId: oldDoc._id,
      isCurrentVersion: true,
      resubmittedAt: new Date(),
      resubmittedBy: req.user.id as any
    });

    // Update parent application status
    const app = await Application.findById(oldDoc.applicationId);
    if (app) {
      app.status = ApplicationStatus.RESUBMITTED;
      app.statusHistory.push({
        previousStatus: ApplicationStatus.CORRECTION_REQUIRED,
        newStatus: ApplicationStatus.RESUBMITTED,
        changedBy: req.user.id as any,
        changedByRole: 'Citizen',
        reason: `Replaced document: ${oldDoc.documentName.en} (v${newVersionDoc.version})`,
        timestamp: new Date()
      });
      await app.save();

      // Notify reviewing officer if assigned
      if (app.assignedOfficerId) {
        await Notification.create({
          userId: app.assignedOfficerId,
          title: {
            en: `Document Resubmitted: ${app.applicationReference}`,
            ta: `ஆவணம் மீண்டும் சமர்ப்பிக்கப்பட்டது: ${app.applicationReference}`
          },
          message: {
            en: `Citizen has uploaded replacement for '${oldDoc.documentName.en}'. Pending re-verification.`,
            ta: `'${oldDoc.documentName.ta}' ஆவணத்தின் மாற்று நகல் சமர்ப்பிக்கப்பட்டுள்ளது.`
          },
          type: 'ACTION_REQUIRED',
          linkUrl: `/officer/applications/${app._id}`
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Document replaced successfully',
      document: newVersionDoc
    });
  } catch (error) {
    console.error('replaceDocumentOnCorrection error:', error);
    res.status(500).json({ message: 'Error replacing document' });
  }
};
