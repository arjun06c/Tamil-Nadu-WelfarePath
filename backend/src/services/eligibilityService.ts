import { ICitizenProfile } from '../models/CitizenProfile';
import { IScheme, IRuleCondition } from '../models/Scheme';
import { ICriteriaResult } from '../models/EligibilityEvaluation';

export interface IDocumentFactContext {
  confirmedFacts?: Record<string, any>;
  verifiedFacts?: Record<string, any>;
  attachedDocTypes?: string[];
  verifiedDocTypes?: string[];
}

export interface IConflictDetail {
  field: string;
  profileValue: any;
  documentValue: any;
  documentSource?: string;
  isVerified: boolean;
  message: { en: string; ta: string };
}

export interface IEvaluationOutcome {
  status: 'ELIGIBLE' | 'NEAR_ELIGIBLE' | 'NOT_ELIGIBLE';
  isPreliminaryMatch?: boolean;
  isVerifiedMatch?: boolean;
  hasDataConflict?: boolean;
  conflictDetails?: IConflictDetail[];
  criteriaBreakdown: ICriteriaResult[];
  missingDocuments: Array<{
    docType: string;
    label: { en: string; ta: string };
    isMandatory: boolean;
  }>;
  failedMandatoryCount: number;
  gapAnalysisRemarks: {
    en: string;
    ta: string;
  };
}

export const evaluateCriterion = (
  condition: IRuleCondition,
  profile: ICitizenProfile,
  docContext?: IDocumentFactContext,
  conflictAccumulator?: IConflictDetail[]
): ICriteriaResult => {
  const { field, operator, value: requiredValue, label, isMandatory = true } = condition;

  // Extract base profile value
  let citizenValue: any = (profile as any)[field];
  let profileRawValue = citizenValue;
  let isVerifiedDocumentFact = false;
  let isPreliminaryDocumentFact = false;

  // Helper map for field aliases (e.g. annualIncome <-> annualFamilyIncome)
  const getDocValue = (factsObj?: Record<string, any>) => {
    if (!factsObj) return undefined;
    if (factsObj[field] !== undefined) return factsObj[field];
    if (field === 'annualIncome' && factsObj['annualFamilyIncome'] !== undefined) return factsObj['annualFamilyIncome'];
    if (field === 'annualFamilyIncome' && factsObj['annualIncome'] !== undefined) return factsObj['annualIncome'];
    return undefined;
  };

  const verifiedDocValue = getDocValue(docContext?.verifiedFacts);
  const confirmedDocValue = getDocValue(docContext?.confirmedFacts);

  if (verifiedDocValue !== undefined) {
    citizenValue = verifiedDocValue;
    isVerifiedDocumentFact = true;
    if (profileRawValue !== undefined && String(profileRawValue) !== String(verifiedDocValue) && conflictAccumulator) {
      conflictAccumulator.push({
        field,
        profileValue: profileRawValue,
        documentValue: verifiedDocValue,
        isVerified: true,
        message: {
          en: `Notice: Information differs from your profile (${field}: Profile states ${profileRawValue}, Verified Certificate states ${verifiedDocValue}). Verified document fact used.`,
          ta: `அறிவிப்பு: உங்கள் சுயவிவரத்திலிருந்து தகவல் மாறுகிறது (${field}: சுயவிவரம் ${profileRawValue}, சரிபார்க்கப்பட்ட சான்றிதழ் ${verifiedDocValue}). சரிபார்க்கப்பட்ட ஆவணத் தகவல் பயன்படுத்தப்பட்டது.`
        }
      });
    }
  } else if (confirmedDocValue !== undefined) {
    citizenValue = confirmedDocValue;
    isPreliminaryDocumentFact = true;
    if (profileRawValue !== undefined && String(profileRawValue) !== String(confirmedDocValue) && conflictAccumulator) {
      conflictAccumulator.push({
        field,
        profileValue: profileRawValue,
        documentValue: confirmedDocValue,
        isVerified: false,
        message: {
          en: `Notice: Information differs from your profile (${field}: Profile states ${profileRawValue}, Certificate states ${confirmedDocValue}). Certificate value used for preliminary evaluation (Pending Officer Review).`,
          ta: `அறிவிப்பு: உங்கள் சுயவிவரத்திலிருந்து தகவல் மாறுகிறது (${field}: சுயவிவரம் ${profileRawValue}, சான்றிதழ் ${confirmedDocValue}). சான்றிதழ் தகவல் முதற்கட்ட மதிப்பீட்டிற்கு பயன்படுத்தப்பட்டது.`
        }
      });
    }
  }

  // Special calculated fields (age)
  if (field === 'age') {
    const dob = verifiedDocValue?.dob || confirmedDocValue?.dob || profile.dob;
    if (dob) {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      citizenValue = age;
    }
  }

  let passed = false;

  switch (operator) {
    case 'equals':
      passed = citizenValue === requiredValue;
      break;
    case 'not_equals':
      passed = citizenValue !== requiredValue;
      break;
    case 'greater_than_or_equal':
      passed = Number(citizenValue) >= Number(requiredValue);
      break;
    case 'less_than_or_equal':
      passed = Number(citizenValue) <= Number(requiredValue);
      break;
    case 'in':
      if (Array.isArray(requiredValue)) {
        passed = requiredValue.includes(citizenValue);
      }
      break;
    case 'not_in':
      if (Array.isArray(requiredValue)) {
        passed = !requiredValue.includes(citizenValue);
      }
      break;
    case 'contains':
      if (typeof citizenValue === 'string') {
        passed = citizenValue.toLowerCase().includes(String(requiredValue).toLowerCase());
      }
      break;
    default:
      passed = false;
  }

  const factTagEn = isVerifiedDocumentFact
    ? ' [Verified Document Information]'
    : isPreliminaryDocumentFact
    ? ' [Preliminary Match - Pending Officer Review]'
    : '';

  const factTagTa = isVerifiedDocumentFact
    ? ' [சரிபார்க்கப்பட்ட ஆவணத் தகவல்]'
    : isPreliminaryDocumentFact
    ? ' [முதற்கட்ட பொருத்தம் - அதிகாரி சரிபார்ப்பு நிலுவையில்]'
    : '';

  const explanationEn = passed
    ? `Satisfied: Your ${field} (${citizenValue ?? 'Not provided'}) meets requirement (${requiredValue}).${factTagEn}`
    : `Failed: Your ${field} (${citizenValue ?? 'Not provided'}) does not meet requirement (${requiredValue}).${factTagEn}`;

  const explanationTa = passed
    ? `நிறைவேறியது: உங்கள் ${field} (${citizenValue ?? 'வழங்கப்படவில்லை'}) நிபந்தனையை (${requiredValue}) பூர்த்தி செய்கிறது.${factTagTa}`
    : `பூர்த்தியாகவில்லை: உங்கள் ${field} (${citizenValue ?? 'வழங்கப்படவில்லை'}) நிபந்தனையை (${requiredValue}) பூர்த்தி செய்யவில்லை.${factTagTa}`;

  return {
    field,
    operator,
    requiredValue,
    citizenValue,
    passed,
    label,
    explanation: { en: explanationEn, ta: explanationTa },
    isMandatory
  };
};

export const evaluateSchemeEligibility = (
  scheme: IScheme,
  profile: ICitizenProfile,
  uploadedDocTypes: string[] = [],
  docContext?: IDocumentFactContext
): IEvaluationOutcome => {
  const criteriaBreakdown: ICriteriaResult[] = [];
  const conflictDetails: IConflictDetail[] = [];
  let failedMandatoryCount = 0;

  // Merge uploadedDocTypes with attachedDocTypes in docContext if present
  const combinedDocTypes = Array.from(
    new Set([...uploadedDocTypes, ...(docContext?.attachedDocTypes || [])])
  );

  // Evaluate 'all' conditions (AND logic)
  if (scheme.rules.all && Array.isArray(scheme.rules.all)) {
    for (const condition of scheme.rules.all) {
      const result = evaluateCriterion(condition, profile, docContext, conflictDetails);
      criteriaBreakdown.push(result);
      if (!result.passed && result.isMandatory) {
        failedMandatoryCount++;
      }
    }
  }

  // Check missing mandatory documents
  const missingDocuments: Array<{
    docType: string;
    label: { en: string; ta: string };
    isMandatory: boolean;
  }> = [];

  if (scheme.requiredDocuments && Array.isArray(scheme.requiredDocuments)) {
    for (const doc of scheme.requiredDocuments) {
      if (!combinedDocTypes.includes(doc.docType)) {
        missingDocuments.push({
          docType: doc.docType,
          label: doc.label,
          isMandatory: doc.isMandatory
        });
      }
    }
  }

  const missingMandatoryDocsCount = missingDocuments.filter((d) => d.isMandatory).length;

  // Determine 3-Level Classification
  let status: 'ELIGIBLE' | 'NEAR_ELIGIBLE' | 'NOT_ELIGIBLE' = 'NOT_ELIGIBLE';

  if (failedMandatoryCount === 0 && missingMandatoryDocsCount === 0) {
    status = 'ELIGIBLE';
  } else if (failedMandatoryCount === 0 && missingMandatoryDocsCount > 0) {
    status = 'NEAR_ELIGIBLE';
  } else if (failedMandatoryCount === 1 && missingMandatoryDocsCount <= 2) {
    status = 'NEAR_ELIGIBLE';
  } else {
    status = 'NOT_ELIGIBLE';
  }

  const hasVerifiedFact = Object.keys(docContext?.verifiedFacts || {}).length > 0;
  const hasConfirmedFact = Object.keys(docContext?.confirmedFacts || {}).length > 0;

  const isVerifiedMatch = hasVerifiedFact;
  const isPreliminaryMatch = !hasVerifiedFact && hasConfirmedFact;
  const hasDataConflict = conflictDetails.length > 0;

  // Generate Gap Analysis Remarks
  let remarksEn = '';
  let remarksTa = '';

  if (status === 'ELIGIBLE') {
    if (isVerifiedMatch) {
      remarksEn = 'Eligible! Verified document information used in eligibility evaluation.';
      remarksTa = 'தகுதியானது! சரிபார்க்கப்பட்ட ஆவணத் தகவல் தகுதி மதிப்பீட்டில் பயன்படுத்தப்பட்டது.';
    } else if (isPreliminaryMatch) {
      remarksEn = 'Potentially Eligible! Preliminary scheme matching based on attached document (Pending Officer Review).';
      remarksTa = 'சாத்தியமான தகுதி! இணைக்கப்பட்ட சான்றிதழின் அடிப்படையில் முதற்கட்ட தகுதி பொருத்தம் (அதிகாரி சரிபார்ப்பு நிலுவையில் உள்ளன).';
    } else {
      remarksEn = 'Congratulations! You meet all configured eligibility criteria and have prepared required proof documents.';
      remarksTa = 'வாழ்த்துக்கள்! நீங்கள் அனைத்து தகுதி அளவுகோல்களையும் பூர்த்தி செய்து தேவையான சான்றிதழ்களை தயார் வைத்துள்ளீர்கள்.';
    }
  } else if (status === 'NEAR_ELIGIBLE') {
    const docNamesEn = missingDocuments.map((d) => d.label.en).join(', ');
    const docNamesTa = missingDocuments.map((d) => d.label.ta).join(', ');

    if (missingMandatoryDocsCount > 0) {
      remarksEn = `Needs More Information! To complete eligibility, please upload missing proof document(s): ${docNamesEn}.`;
      remarksTa = `கூடுதல் தகவல் தேவை! தகுதியை முழுமையாக்க விடுபட்ட சான்றிதழ்களைப் பதிவேற்றவும்: ${docNamesTa}.`;
    } else {
      remarksEn = 'Needs More Information! Please review your profile data and criteria breakdown above for unresolved fields.';
      remarksTa = 'கூடுதல் தகவல் தேவை! உங்கள் சுயவிவரத் தகவல்களைச் சரிபார்த்து புதுப்பிக்கவும்.';
    }
  } else {
    remarksEn = 'Currently ineligible based on core policy criteria (such as income limit, age boundary, or target school background).';
    remarksTa = 'அடிப்படை நிபந்தனைகள் (வருமான வரம்பு, வயது அல்லது கல்வி வகை) பொருந்தாததால் தற்போது தகுதியற்றது.';
  }

  return {
    status,
    isPreliminaryMatch,
    isVerifiedMatch,
    hasDataConflict,
    conflictDetails,
    criteriaBreakdown,
    missingDocuments,
    failedMandatoryCount,
    gapAnalysisRemarks: { en: remarksEn, ta: remarksTa }
  };
};
