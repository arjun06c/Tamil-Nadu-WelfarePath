import mongoose, { Schema, Document } from 'mongoose';

export interface ICitizenProfile extends Document {
  userId: mongoose.Types.ObjectId;
  dob: Date;
  gender: 'Male' | 'Female' | 'Transgender' | 'Other';
  district: string;
  taluk: string;
  villageTown: string;
  annualIncome: number;
  occupation: string;
  employmentStatus: 'Employed' | 'Unemployed' | 'Student' | 'Self-Employed' | 'Pensioner';
  educationLevel: 'Illiterate' | 'Primary' | 'High School' | 'Higher Secondary' | 'Undergraduate' | 'Postgraduate' | 'Diploma' | 'ITI';
  socialCategory: 'FC' | 'BC' | 'MBC' | 'SC' | 'ST' | 'Minority';
  disabilityStatus: boolean;
  disabilityPercentage: number;
  isFarmer: boolean;
  isUnorganizedWorker: boolean;
  govtSchoolYears6To12: boolean;
  familyMembersCount: number;
  dependentsCount: number;
  aadhaarHash?: string;
  bankDetails?: {
    accountNoHash?: string;
    ifscCode?: string;
    bankName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CitizenProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Transgender', 'Other'], required: true },
    district: { type: String, required: true },
    taluk: { type: String, default: '' },
    villageTown: { type: String, default: '' },
    annualIncome: { type: Number, required: true, default: 0 },
    occupation: { type: String, default: '' },
    employmentStatus: {
      type: String,
      enum: ['Employed', 'Unemployed', 'Student', 'Self-Employed', 'Pensioner'],
      default: 'Unemployed'
    },
    educationLevel: {
      type: String,
      enum: ['Illiterate', 'Primary', 'High School', 'Higher Secondary', 'Undergraduate', 'Postgraduate', 'Diploma', 'ITI'],
      default: 'High School'
    },
    socialCategory: {
      type: String,
      enum: ['FC', 'BC', 'MBC', 'SC', 'ST', 'Minority'],
      default: 'BC'
    },
    disabilityStatus: { type: Boolean, default: false },
    disabilityPercentage: { type: Number, default: 0 },
    isFarmer: { type: Boolean, default: false },
    isUnorganizedWorker: { type: Boolean, default: false },
    govtSchoolYears6To12: { type: Boolean, default: false },
    familyMembersCount: { type: Number, default: 1 },
    dependentsCount: { type: Number, default: 0 },
    aadhaarHash: { type: String, default: '' },
    bankDetails: {
      accountNoHash: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export const CitizenProfile = mongoose.model<ICitizenProfile>('CitizenProfile', CitizenProfileSchema);
