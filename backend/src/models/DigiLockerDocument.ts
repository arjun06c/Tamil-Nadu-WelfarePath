import mongoose, { Schema, Document } from 'mongoose';

export type DigiLockerDocumentStatus = 'AVAILABLE' | 'SELECTED' | 'RETRIEVED' | 'REVOKED';
export type DigiLockerDocumentVerificationStatus = 'PENDING_OFFICER_REVIEW' | 'VERIFIED' | 'CORRECTION_REQUIRED';

export interface IDigiLockerDocument extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  source: string;
  documentReference: string;
  documentType: string;
  name: {
    en: string;
    ta: string;
  };
  issuer: string;
  issueDate?: string;
  retrievedAt?: Date;
  mimeType: string;
  status: DigiLockerDocumentStatus;
  verificationStatus: DigiLockerDocumentVerificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DigiLockerDocumentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
    source: { type: String, default: 'DIGILOCKER' },
    documentReference: { type: String, required: true },
    documentType: { type: String, required: true },
    name: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    issuer: { type: String, required: true },
    issueDate: { type: String, default: '' },
    retrievedAt: { type: Date },
    mimeType: { type: String, default: 'application/pdf' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'SELECTED', 'RETRIEVED', 'REVOKED'],
      default: 'AVAILABLE'
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_OFFICER_REVIEW', 'VERIFIED', 'CORRECTION_REQUIRED'],
      default: 'PENDING_OFFICER_REVIEW'
    },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const DigiLockerDocument = mongoose.model<IDigiLockerDocument>(
  'DigiLockerDocument',
  DigiLockerDocumentSchema
);
