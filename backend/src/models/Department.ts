import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  departmentCode: string;
  name: {
    en: string;
    ta: string;
  };
  description: {
    en: string;
    ta: string;
  };
  headOfficerId?: mongoose.Types.ObjectId;
  districtsCovered: string[];
  isActive: boolean;
  createdAt: Date;
}

const DepartmentSchema: Schema = new Schema(
  {
    departmentCode: { type: String, required: true, unique: true },
    name: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    description: {
      en: { type: String, default: '' },
      ta: { type: String, default: '' }
    },
    headOfficerId: { type: Schema.Types.ObjectId, ref: 'User' },
    districtsCovered: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
