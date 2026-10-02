import mongoose, { Schema, Document } from 'mongoose';

export interface IBenefitRecord extends Document {
  applicationId: mongoose.Types.ObjectId;
  citizenId: mongoose.Types.ObjectId;
  schemeId: mongoose.Types.ObjectId;
  disbursementAmount: number;
  disbursementFrequency: string;
  releaseDate: Date;
  status: 'ACTIVE' | 'RENEWAL_DUE' | 'EXPIRED' | 'REVERIFICATION_REQUIRED';
  nextRenewalDate?: Date;
  benefitReferenceNo: string;
  notes?: string;
  createdAt: Date;
}

const BenefitRecordSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    disbursementAmount: { type: Number, required: true },
    disbursementFrequency: { type: String, default: 'Monthly' },
    releaseDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['ACTIVE', 'RENEWAL_DUE', 'EXPIRED', 'REVERIFICATION_REQUIRED'],
      default: 'ACTIVE'
    },
    nextRenewalDate: { type: Date },
    benefitReferenceNo: { type: String, required: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const BenefitRecord = mongoose.model<IBenefitRecord>('BenefitRecord', BenefitRecordSchema);
