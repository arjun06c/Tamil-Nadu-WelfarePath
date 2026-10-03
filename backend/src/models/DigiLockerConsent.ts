import mongoose, { Schema, Document } from 'mongoose';

export type ConsentStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface IDigiLockerConsent extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  purpose: string;
  requestedScopes: string[];
  grantedScopes: string[];
  consentReference: string;
  consentedAt: Date;
  revokedAt?: Date;
  status: ConsentStatus;
  policyVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const DigiLockerConsentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
    purpose: { type: String, required: true },
    requestedScopes: [{ type: String }],
    grantedScopes: [{ type: String }],
    consentReference: { type: String, required: true, unique: true },
    consentedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED', 'EXPIRED'],
      default: 'ACTIVE'
    },
    policyVersion: { type: String, default: '2026.1' }
  },
  { timestamps: true }
);

export const DigiLockerConsent = mongoose.model<IDigiLockerConsent>(
  'DigiLockerConsent',
  DigiLockerConsentSchema
);
