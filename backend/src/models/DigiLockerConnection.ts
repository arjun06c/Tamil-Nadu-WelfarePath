import mongoose, { Schema, Document } from 'mongoose';

export type DigiLockerEnvironment = 'MOCK' | 'SANDBOX' | 'PRODUCTION';
export type DigiLockerConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'REVOKED';

export interface IDigiLockerConnection extends Document {
  userId: mongoose.Types.ObjectId;
  provider: string;
  environment: DigiLockerEnvironment;
  externalUserReference?: string;
  status: DigiLockerConnectionStatus;
  scopes: string[];
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
  connectedAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DigiLockerConnectionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, default: 'API_SETU_DIGILOCKER' },
    environment: {
      type: String,
      enum: ['MOCK', 'SANDBOX', 'PRODUCTION'],
      required: true,
      default: 'MOCK'
    },
    externalUserReference: { type: String, default: '' },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED', 'REVOKED'],
      default: 'CONNECTED'
    },
    scopes: [{ type: String }],
    accessTokenEncrypted: { type: String, select: false },
    refreshTokenEncrypted: { type: String, select: false },
    tokenExpiresAt: { type: Date },
    connectedAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date }
  },
  { timestamps: true }
);

export const DigiLockerConnection = mongoose.model<IDigiLockerConnection>(
  'DigiLockerConnection',
  DigiLockerConnectionSchema
);
