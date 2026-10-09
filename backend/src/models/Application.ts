import mongoose, { Schema, Document } from 'mongoose';

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  DOC_VERIFICATION = 'DOC_VERIFICATION',
  CORRECTION_REQUIRED = 'CORRECTION_REQUIRED',
  OFFICER_REVIEW = 'OFFICER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BENEFIT_RELEASED = 'BENEFIT_RELEASED',
  COMPLETED = 'COMPLETED'
}

export interface IStatusHistory {
  previousStatus: string;
  newStatus: string;
  changedBy?: mongoose.Types.ObjectId;
  changedByRole: string;
  reason?: string;
  remarks?: string;
  timestamp: Date;
}

export interface IApplication extends Document {
  applicationNo: string; // Legacy alias or reference
  applicationReference: string; // e.g. TNP-WP-2026-000124
  citizenId: mongoose.Types.ObjectId;
  schemeId: mongoose.Types.ObjectId;
  applicationMethod: string;
  status: ApplicationStatus;
  currentStep: number;
  completionPercentage: number;
  formData: Record<string, any>;
  statusHistory: IStatusHistory[];
  officerRemarks?: string;
  correctionCount: number;
  assignedOfficerId?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  declarationAccepted: boolean;
  submittedAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
  {
    applicationNo: { type: String, required: true },
    applicationReference: { type: String, required: true, unique: true },
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    applicationMethod: { type: String, default: 'PROTOTYPE_ASSISTED' },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.SUBMITTED
    },
    currentStep: { type: Number, default: 1 },
    completionPercentage: { type: Number, default: 0 },
    formData: { type: Object, default: {} },
    statusHistory: [
      {
        previousStatus: { type: String, default: 'DRAFT' },
        newStatus: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changedByRole: { type: String, default: 'Citizen' },
        reason: { type: String, default: '' },
        remarks: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    officerRemarks: { type: String, default: '' },
    correctionCount: { type: Number, default: 0 },
    assignedOfficerId: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    declarationAccepted: { type: Boolean, default: true },
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
