export type DigiLockerMode = 'mock' | 'sandbox' | 'production';

export interface DigiLockerUser {
  id: string;
  name: string;
  dob?: string;
  gender?: string;
  maskedAadhaar?: string;
  mobile?: string;
  email?: string;
}

export interface DigiLockerDocumentItem {
  uri: string;
  docType: string;
  name: {
    en: string;
    ta: string;
  };
  issuer: string;
  issueDate?: string;
  mimeType?: string;
  status: 'AVAILABLE' | 'RETRIEVED';
  description?: string;
}

export interface DigiLockerDocumentContent {
  uri: string;
  docType: string;
  mimeType: string;
  contentUrl?: string;
  base64Data?: string;
  metadata: Record<string, any>;
}

export interface DigiLockerAuthResult {
  success: boolean;
  code?: string;
  state?: string;
  accessToken?: string;
  expiresIn?: number;
  user?: DigiLockerUser;
  error?: string;
}

export interface DigiLockerHealthStatus {
  configured: boolean;
  mode: DigiLockerMode;
  status: 'HEALTHY' | 'NOT_CONFIGURED' | 'ERROR';
  apiReachability: boolean;
  lastChecked: Date;
  details?: string;
  badgeLabel: 'Demo Document Source' | 'DigiLocker Sandbox' | 'DigiLocker';
}

export interface WelfareNormalizedDocument {
  id: string;
  source: 'MANUAL_UPLOAD' | 'DIGILOCKER';
  sourceReference?: string;
  documentType: string;
  name: {
    en: string;
    ta: string;
  };
  issuer?: string;
  issueDate?: string;
  mimeType?: string;
  status:
    | 'AVAILABLE'
    | 'SELECTED'
    | 'RETRIEVED'
    | 'PENDING_VERIFICATION'
    | 'VERIFIED'
    | 'CORRECTION_REQUIRED';
  applicationId?: string;
  createdAt: string;
}
