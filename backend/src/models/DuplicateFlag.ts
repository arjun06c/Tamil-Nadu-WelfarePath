import mongoose, { Schema, Document } from 'mongoose';

export enum DuplicateFlagType {
  SAME_AADHAAR = 'SAME_AADHAAR',
  SAME_BANK = 'SAME_BANK',
  HIGH_NAME_DOB_SIMILARITY = 'HIGH_NAME_DOB_SIMILARITY',
  SAME_HOUSEHOLD = 'SAME_HOUSEHOLD'
}

export enum DuplicateReviewStatus {
  PENDING = 'PENDING',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  CONFIRMED_DUPLICATE = 'CONFIRMED_DUPLICATE',
  RESOLVED = 'RESOLVED'
}

export interface IDuplicateFlag extends Document {
  applicationId: mongoose.Types.ObjectId;
  matchedApplicationId: mongoose.Types.ObjectId;
  flagType: DuplicateFlagType;
  similarityScore: number;
  matchingDetails: string;
  reviewStatus: DuplicateReviewStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  officerNotes?: string;
  createdAt: Date;
}

const DuplicateFlagSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    matchedApplicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    flagType: { type: String, enum: Object.values(DuplicateFlagType), required: true },
    similarityScore: { type: Number, required: true },
    matchingDetails: { type: String, required: true },
    reviewStatus: {
      type: String,
      enum: Object.values(DuplicateReviewStatus),
      default: DuplicateReviewStatus.PENDING
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    officerNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const DuplicateFlag = mongoose.model<IDuplicateFlag>('DuplicateFlag', DuplicateFlagSchema);
