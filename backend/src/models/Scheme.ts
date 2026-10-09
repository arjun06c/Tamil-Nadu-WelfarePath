import mongoose, { Schema, Document } from 'mongoose';

export interface IRuleCondition {
  field: string;
  operator:
    | 'equals'
    | '='
    | 'not_equals'
    | '!='
    | 'greater_than'
    | '>'
    | 'greater_than_or_equal'
    | '>='
    | 'less_than'
    | '<'
    | 'less_than_or_equal'
    | '<='
    | 'between'
    | 'in'
    | 'not_in'
    | 'contains'
    | 'is_true'
    | 'is_false'
    | 'exists'
    | 'does_not_exist';
  value: any;
  valueSecondary?: any;
  frequency?: 'Monthly' | 'Annual';
  label: {
    en: string;
    ta: string;
  };
  isMandatory?: boolean;
}

export interface ISchemeRules {
  all?: IRuleCondition[];
  any?: IRuleCondition[];
  exclusions?: IRuleCondition[];
  none?: IRuleCondition[];
}

export interface IRequiredDocumentConfig {
  docType: string;
  isMandatory: boolean;
  label: {
    en: string;
    ta: string;
  };
  description?: {
    en: string;
    ta: string;
  };
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
  ocrSupported?: boolean;
  sources?: ('DIGILOCKER' | 'MANUAL_UPLOAD')[];
}

export interface IApplicationMethod {
  methodType: 'ONLINE_PORTAL' | 'OFFLINE_OFFICE' | 'EDUCATIONAL_INSTITUTION' | 'DEPARTMENT_OFFICE' | 'PLATFORM_ASSISTED';
  title: {
    en: string;
    ta: string;
  };
  instructions: {
    en: string;
    ta: string;
  };
  responsibleOffice: {
    en: string;
    ta: string;
  };
  officialWebsiteUrl?: string;
}

export interface IScheme extends Document {
  schemeCode: string;
  name: {
    en: string;
    ta: string;
  };
  department: {
    en: string;
    ta: string;
  };
  domainKey: string;
  description: {
    en: string;
    ta: string;
  };
  shortDescription?: {
    en: string;
    ta: string;
  };
  benefitSummary: {
    en: string;
    ta: string;
  };
  targetBeneficiaries: {
    en: string;
    ta: string;
  };
  rules: ISchemeRules;
  requiredDocuments: IRequiredDocumentConfig[];
  applicationMethods: IApplicationMethod[];
  applicationFrequency: string;
  officialUrl: string;
  lastVerifiedDate: string;
  ruleVersion: string;
  isActive: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isDemoData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SchemeSchema: Schema = new Schema(
  {
    schemeCode: { type: String, required: true, unique: true },
    name: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    department: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    domainKey: { type: String, required: true },
    description: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    shortDescription: {
      en: { type: String, default: '' },
      ta: { type: String, default: '' }
    },
    benefitSummary: {
      en: { type: String, required: true },
      ta: { type: String, required: true }
    },
    targetBeneficiaries: {
      en: { type: String, default: 'General Citizens' },
      ta: { type: String, default: 'பொது மக்கள்' }
    },
    rules: { type: Object, required: true },
    requiredDocuments: [
      {
        docType: { type: String, required: true },
        isMandatory: { type: Boolean, default: true },
        label: {
          en: { type: String, required: true },
          ta: { type: String, required: true }
        },
        description: {
          en: { type: String, default: '' },
          ta: { type: String, default: '' }
        },
        acceptedFileTypes: [{ type: String, default: ['PDF', 'JPG', 'PNG'] }],
        maxFileSizeMB: { type: Number, default: 5 },
        ocrSupported: { type: Boolean, default: true },
        sources: [{ type: String, enum: ['DIGILOCKER', 'MANUAL_UPLOAD'], default: ['DIGILOCKER', 'MANUAL_UPLOAD'] }]
      }
    ],
    applicationMethods: [
      {
        methodType: { type: String, required: true },
        title: {
          en: { type: String, required: true },
          ta: { type: String, required: true }
        },
        instructions: {
          en: { type: String, required: true },
          ta: { type: String, required: true }
        },
        responsibleOffice: {
          en: { type: String, default: 'Department Office' },
          ta: { type: String, default: 'துறை அலுவலகம்' }
        },
        officialWebsiteUrl: { type: String, default: '' }
      }
    ],
    applicationFrequency: { type: String, default: 'Monthly' },
    officialUrl: { type: String, default: 'https://tn.gov.in' },
    lastVerifiedDate: { type: String, default: '2026-01-01' },
    ruleVersion: { type: String, default: '1.0' },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'PUBLISHED' },
    isDemoData: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Scheme = mongoose.model<IScheme>('Scheme', SchemeSchema);
