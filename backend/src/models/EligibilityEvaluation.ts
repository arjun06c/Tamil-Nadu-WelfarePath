import mongoose, { Schema, Document } from 'mongoose';

export interface ICriteriaResult {
  field: string;
  operator: string;
  requiredValue: any;
  citizenValue: any;
  passed: boolean;
  label: {
    en: string;
    ta: string;
  };
  explanation: {
    en: string;
    ta: string;
  };
  isMandatory: boolean;
}

export interface IEligibilityEvaluation extends Document {
  citizenId: mongoose.Types.ObjectId;
  schemeId: mongoose.Types.ObjectId;
  status: 'ELIGIBLE' | 'NEAR_ELIGIBLE' | 'NOT_ELIGIBLE';
  criteriaBreakdown: ICriteriaResult[];
  missingDocuments: Array<{
    docType: string;
    label: {
      en: string;
      ta: string;
    };
    isMandatory: boolean;
  }>;
  failedMandatoryCount: number;
  gapAnalysisRemarks: {
    en: string;
    ta: string;
  };
  evaluatedAt: Date;
}

const EligibilityEvaluationSchema: Schema = new Schema(
  {
    citizenId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    status: {
      type: String,
      enum: ['ELIGIBLE', 'NEAR_ELIGIBLE', 'NOT_ELIGIBLE'],
      required: true
    },
    criteriaBreakdown: [
      {
        field: { type: String, required: true },
        operator: { type: String, required: true },
        requiredValue: { type: Schema.Types.Mixed },
        citizenValue: { type: Schema.Types.Mixed },
        passed: { type: Boolean, required: true },
        label: {
          en: { type: String, required: true },
          ta: { type: String, required: true }
        },
        explanation: {
          en: { type: String, required: true },
          ta: { type: String, required: true }
        },
        isMandatory: { type: Boolean, default: true }
      }
    ],
    missingDocuments: [
      {
        docType: { type: String, required: true },
        label: {
          en: { type: String, required: true },
          ta: { type: String, required: true }
        },
        isMandatory: { type: Boolean, default: true }
      }
    ],
    failedMandatoryCount: { type: Number, default: 0 },
    gapAnalysisRemarks: {
      en: { type: String, default: '' },
      ta: { type: String, default: '' }
    },
    evaluatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const EligibilityEvaluation = mongoose.model<IEligibilityEvaluation>(
  'EligibilityEvaluation',
  EligibilityEvaluationSchema
);
