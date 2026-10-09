import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationDocument extends Document {
  applicationId: mongoose.Types.ObjectId;
  citizenId: mongoose.Types.ObjectId;
  docType: string;
  documentName: {
    en: string;
    ta: string;
  };
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadStatus: 'NOT_UPLOADED' | 'UPLOADING' | 'UPLOADED' | 'RETRIEVED' | 'PROCESSING' | 'OCR_COMPLETED' | 'CORRECTION_REQUIRED' | 'REJECTED' | 'UPLOAD_FAILED';
  ocrStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'BYPASSED';
  ocrConfidence?: number;
  extractedData?: Record<string, any>;
  citizenConfirmedData?: Record<string, any>;
  source?: 'MANUAL_UPLOAD' | 'DIGILOCKER';
  sourceReference?: string;
  storageReference?: string;
  issuer?: string;
  issueDate?: string;
  retrievedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationStatus: 'NOT_REVIEWED' | 'ACCEPTED' | 'CORRECTION_REQUIRED' | 'REJECTED' | 'VERIFIED';
  officerRemarks?: string;
  version?: number;
  previousVersionId?: mongoose.Types.ObjectId;
  isCurrentVersion?: boolean;
  correctionReason?: string;
  correctionRequestedAt?: Date;
  correctionRequestedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  resubmittedAt?: Date;
  resubmittedBy?: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

const ApplicationDocumentSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    docType: { type: String, required: true },
    documentName: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, default: 1024 },
    mimeType: { type: String, default: 'application/pdf' },
    source: {
      type: String,
      enum: ['MANUAL_UPLOAD', 'DIGILOCKER'],
      default: 'MANUAL_UPLOAD'
    },
    sourceReference: { type: String, default: '' },
    storageReference: { type: String, default: '' },
    issuer: { type: String, default: '' },
    issueDate: { type: String, default: '' },
    retrievedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadStatus: {
      type: String,
      enum: ['NOT_UPLOADED', 'UPLOADING', 'UPLOADED', 'RETRIEVED', 'PROCESSING', 'OCR_COMPLETED', 'CORRECTION_REQUIRED', 'REJECTED', 'UPLOAD_FAILED'],
      default: 'UPLOADED'
    },
    ocrStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'BYPASSED'],
      default: 'COMPLETED'
    },
    ocrConfidence: { type: Number, default: 0 },
    extractedData: { type: Object, default: {} },
    citizenConfirmedData: { type: Object, default: {} },
    verificationStatus: {
      type: String,
      enum: ['NOT_REVIEWED', 'ACCEPTED', 'CORRECTION_REQUIRED', 'REJECTED', 'VERIFIED'],
      default: 'NOT_REVIEWED'
    },
    officerRemarks: { type: String, default: '' },
    version: { type: Number, default: 1 },
    previousVersionId: { type: Schema.Types.ObjectId, ref: 'ApplicationDocument' },
    isCurrentVersion: { type: Boolean, default: true },
    correctionReason: { type: String, default: '' },
    correctionRequestedAt: { type: Date },
    correctionRequestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' },
    rejectedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resubmittedAt: { type: Date },
    resubmittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ApplicationDocument = mongoose.model<IApplicationDocument>(
  'ApplicationDocument',
  ApplicationDocumentSchema
);
