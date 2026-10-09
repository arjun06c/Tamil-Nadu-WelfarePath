"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSchemeEligibility = exports.evaluateCriterion = void 0;
// Field Label Dictionary for Explainability
const FIELD_LABELS = {
    annualFamilyIncome: { en: 'Annual Family Income', ta: 'குடும்பத்தின் ஆண்டு வருமானம்' },
    annualIncome: { en: 'Annual Income', ta: 'ஆண்டு வருமானம்' },
    monthlySalary: { en: 'Monthly Salary', ta: 'மாத வருமானம்' },
    age: { en: 'Age', ta: 'வயது' },
    gender: { en: 'Gender', ta: 'பாலினம்' },
    residence: { en: 'Tamil Nadu Residence', ta: 'தமிழ்நாடு இருப்பிடம்' },
    governmentEmployee: { en: 'Government Employee Status', ta: 'அரசு ஊழியர் தகுதி' },
    employmentStatus: { en: 'Employment Status', ta: 'வேலைவாய்ப்பு நிலை' },
    isFarmer: { en: 'Farmer Status', ta: 'விவசாயி தகுதி' },
    hasDisability: { en: 'Differently Abled Status', ta: 'மாற்றுத்திறனாளி தகுதி' },
    disabilityPercentage: { en: 'Disability Percentage', ta: 'மாற்றுத்திறன் சதவீதம்' },
    alreadyReceivingBenefit: { en: 'Existing Scheme Benefit', ta: 'தற்போது பெறும் அரசு உதவி' },
    communityCategory: { en: 'Social Category / Community', ta: 'சமூகப் பிரிவு / சாதி' },
    isWidow: { en: 'Destitute Widow Status', ta: 'ஆதரவற்ற விதவை தகுதி' }
};
const evaluateCriterion = (condition, profile, docContext, conflictAccumulator, isExclusionRule = false) => {
    const { field, operator, value: requiredValue, valueSecondary, frequency, label, isMandatory = true } = condition;
    // Extract base profile value
    let citizenValue = profile[field];
    let profileRawValue = citizenValue;
    let isVerifiedDocumentFact = false;
    let isPreliminaryDocumentFact = false;
    // Aliases and defaults
    if (citizenValue === undefined || citizenValue === null || citizenValue === '') {
        if (field === 'annualFamilyIncome')
            citizenValue = profile.annualIncome;
        if (field === 'annualIncome')
            citizenValue = profile.annualFamilyIncome;
        if (field === 'residence')
            citizenValue = profile.state === 'Tamil Nadu' ? 'Tamil Nadu' : profile.residence;
        if (field === 'governmentEmployee')
            citizenValue = profile.isGovtEmployee ?? profile.isGovernmentEmployee;
    }
    // Helper map for document facts
    const getDocValue = (factsObj) => {
        if (!factsObj)
            return undefined;
        if (factsObj[field] !== undefined)
            return factsObj[field];
        if (field === 'annualIncome' && factsObj['annualFamilyIncome'] !== undefined)
            return factsObj['annualFamilyIncome'];
        if (field === 'annualFamilyIncome' && factsObj['annualIncome'] !== undefined)
            return factsObj['annualIncome'];
        return undefined;
    };
    const verifiedDocValue = getDocValue(docContext?.verifiedFacts);
    const confirmedDocValue = getDocValue(docContext?.confirmedFacts);
    if (verifiedDocValue !== undefined) {
        citizenValue = verifiedDocValue;
        isVerifiedDocumentFact = true;
    }
    else if (confirmedDocValue !== undefined) {
        citizenValue = confirmedDocValue;
        isPreliminaryDocumentFact = true;
    }
    // Calculate age from DOB if age field
    if (field === 'age' && (citizenValue === undefined || citizenValue === null)) {
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
    // Income Normalization Check
    if ((field === 'annualFamilyIncome' || field === 'annualIncome') && citizenValue !== undefined && citizenValue !== null) {
        if (frequency === 'Monthly') {
            // Required value is monthly, convert citizen annual income to monthly or vice-versa
            citizenValue = Math.round(Number(citizenValue) / 12);
        }
    }
    else if (field === 'monthlySalary' && citizenValue !== undefined && citizenValue !== null) {
        if (frequency === 'Annual' || !frequency) {
            citizenValue = Number(citizenValue) * 12;
        }
    }
    // Check if info is missing
    const isMissingInfo = citizenValue === undefined || citizenValue === null || citizenValue === '';
    let passed = false;
    if (isMissingInfo) {
        passed = false;
    }
    else {
        switch (operator) {
            case 'equals':
            case '=':
                if (typeof requiredValue === 'boolean') {
                    passed = Boolean(citizenValue) === Boolean(requiredValue);
                }
                else {
                    passed = String(citizenValue).toLowerCase() === String(requiredValue).toLowerCase();
                }
                break;
            case 'not_equals':
            case '!=':
                passed = String(citizenValue).toLowerCase() !== String(requiredValue).toLowerCase();
                break;
            case 'greater_than':
            case '>':
                passed = Number(citizenValue) > Number(requiredValue);
                break;
            case 'greater_than_or_equal':
            case '>=':
                passed = Number(citizenValue) >= Number(requiredValue);
                break;
            case 'less_than':
            case '<':
                passed = Number(citizenValue) < Number(requiredValue);
                break;
            case 'less_than_or_equal':
            case '<=':
                passed = Number(citizenValue) <= Number(requiredValue);
                break;
            case 'between':
                if (valueSecondary !== undefined) {
                    passed = Number(citizenValue) >= Number(requiredValue) && Number(citizenValue) <= Number(valueSecondary);
                }
                break;
            case 'in':
                if (Array.isArray(requiredValue)) {
                    passed = requiredValue.map(v => String(v).toLowerCase()).includes(String(citizenValue).toLowerCase());
                }
                break;
            case 'not_in':
                if (Array.isArray(requiredValue)) {
                    passed = !requiredValue.map(v => String(v).toLowerCase()).includes(String(citizenValue).toLowerCase());
                }
                break;
            case 'contains':
                passed = String(citizenValue).toLowerCase().includes(String(requiredValue).toLowerCase());
                break;
            case 'is_true':
                passed = Boolean(citizenValue) === true;
                break;
            case 'is_false':
                passed = Boolean(citizenValue) === false;
                break;
            case 'exists':
                passed = !isMissingInfo;
                break;
            case 'does_not_exist':
                passed = isMissingInfo;
                break;
            default:
                passed = false;
        }
    }
    // Label fallback
    const displayLabel = label || FIELD_LABELS[field] || { en: field, ta: field };
    let explanationEn = '';
    let explanationTa = '';
    if (isMissingInfo) {
        explanationEn = `Missing Info: ${displayLabel.en} is required to evaluate this rule.`;
        explanationTa = `தகவல் விடுபட்டுள்ளது: இந்த விதியை மதிப்பிட ${displayLabel.ta} தேவைப்படுகிறது.`;
    }
    else if (isExclusionRule) {
        if (passed) {
            explanationEn = `Exclusion Triggered: ${displayLabel.en} is "${citizenValue}" which disqualifies from this scheme.`;
            explanationTa = `விலக்கு நிபந்தனை பொருந்தியது: ${displayLabel.ta} "${citizenValue}" என்பதால் இந்த திட்டத்திற்கு தகுதியற்றது.`;
        }
        else {
            explanationEn = `Exclusion Not Triggered: ${displayLabel.en} condition satisfied (${citizenValue}).`;
            explanationTa = `விலக்கு நிபந்தனை பொருந்தவில்லை: ${displayLabel.ta} சரி (${citizenValue}).`;
        }
    }
    else {
        if (passed) {
            explanationEn = `Satisfied: ${displayLabel.en} (${citizenValue}) meets requirement (${operator} ${requiredValue}).`;
            explanationTa = `நிறைவேறியது: ${displayLabel.ta} (${citizenValue}) நிபந்தனையை பூர்த்தி செய்கிறது (${requiredValue}).`;
        }
        else {
            explanationEn = `Not Satisfied: ${displayLabel.en} (${citizenValue}) does not meet requirement (${operator} ${requiredValue}).`;
            explanationTa = `பூர்த்தியாகவில்லை: ${displayLabel.ta} (${citizenValue}) நிபந்தனையை பூர்த்தி செய்யவில்லை (${requiredValue}).`;
        }
    }
    return {
        field,
        operator,
        requiredValue,
        citizenValue: citizenValue ?? 'Not Provided',
        passed,
        label: displayLabel,
        explanation: { en: explanationEn, ta: explanationTa },
        isMandatory,
        isMissingInfo
    };
};
exports.evaluateCriterion = evaluateCriterion;
const evaluateSchemeEligibility = (scheme, profile, uploadedDocTypes = [], docContext) => {
    const criteriaBreakdown = [];
    const exclusionBreakdown = [];
    const conflictDetails = [];
    const missingInformation = [];
    let failedMandatoryCount = 0;
    let triggeredExclusionCount = 0;
    const combinedDocTypes = Array.from(new Set([...uploadedDocTypes, ...(docContext?.attachedDocTypes || [])]));
    // 1. Evaluate Required Positive Conditions ('all' array)
    if (scheme.rules.all && Array.isArray(scheme.rules.all)) {
        for (const condition of scheme.rules.all) {
            const result = (0, exports.evaluateCriterion)(condition, profile, docContext, conflictDetails, false);
            criteriaBreakdown.push(result);
            if (result.isMissingInfo) {
                missingInformation.push({
                    field: result.field,
                    label: result.label
                });
            }
            else if (!result.passed && result.isMandatory) {
                failedMandatoryCount++;
            }
        }
    }
    // Evaluate Alternative Conditions ('any' array if present)
    if (scheme.rules.any && Array.isArray(scheme.rules.any) && scheme.rules.any.length > 0) {
        let anyPassed = false;
        for (const condition of scheme.rules.any) {
            const result = (0, exports.evaluateCriterion)(condition, profile, docContext, conflictDetails, false);
            criteriaBreakdown.push(result);
            if (result.passed) {
                anyPassed = true;
            }
        }
        if (!anyPassed) {
            failedMandatoryCount++;
        }
    }
    // 2. Evaluate Exclusion Conditions ('exclusions' or 'none' array)
    const exclusionsList = scheme.rules.exclusions || scheme.rules.none || [];
    if (Array.isArray(exclusionsList)) {
        for (const condition of exclusionsList) {
            const result = (0, exports.evaluateCriterion)(condition, profile, docContext, conflictDetails, true);
            exclusionBreakdown.push(result);
            // In exclusion rules: if result.passed === true, the exclusion is TRIGGERED (disqualified)!
            if (result.passed) {
                triggeredExclusionCount++;
            }
        }
    }
    // 3. Check missing mandatory proof documents
    const missingDocuments = [];
    if (scheme.requiredDocuments && Array.isArray(scheme.requiredDocuments)) {
        for (const doc of scheme.requiredDocuments) {
            if (!combinedDocTypes.includes(doc.docType)) {
                missingDocuments.push({
                    docType: doc.docType,
                    label: doc.label,
                    isMandatory: doc.isMandatory !== false
                });
            }
        }
    }
    const missingMandatoryDocsCount = missingDocuments.filter((d) => d.isMandatory).length;
    // 4. Determine Outcome Status
    let status = 'NOT_ELIGIBLE';
    if (triggeredExclusionCount > 0) {
        status = 'NOT_ELIGIBLE';
    }
    else if (failedMandatoryCount > 0) {
        status = 'NOT_ELIGIBLE';
    }
    else if (missingInformation.length > 0) {
        status = 'NEEDS_INFORMATION';
    }
    else if (missingMandatoryDocsCount > 0) {
        status = 'POTENTIAL_MATCH';
    }
    else {
        status = 'STRONG_MATCH';
    }
    // Status Badges
    const badgeMap = {
        STRONG_MATCH: { en: 'Strong Match', ta: 'முழு தகுதி பொருத்தம்' },
        POTENTIAL_MATCH: { en: 'Potential Match', ta: 'சாத்தியமான தகுதி' },
        NEEDS_INFORMATION: { en: 'More Information Needed', ta: 'கூடுதல் தகவல் தேவை' },
        DOCUMENTS_REQUIRED: { en: 'Proof Documents Needed', ta: 'ஆவணங்கள் தேவைப்படுகின்றன' },
        NOT_ELIGIBLE: { en: 'Not Eligible Based on Current Info', ta: 'தற்போது தகுதியற்றது' }
    };
    const statusBadge = badgeMap[status] || badgeMap.NOT_ELIGIBLE;
    // Remarks Generation
    let remarksEn = '';
    let remarksTa = '';
    if (status === 'STRONG_MATCH') {
        remarksEn = 'Strong Match! Your profile satisfies all policy criteria and required proof documents are attached.';
        remarksTa = 'முழு பொருத்தம்! உங்கள் சுயவிவரம் அனைத்து தகுதி விதிகளையும் பூர்த்தி செய்துள்ளது.';
    }
    else if (status === 'POTENTIAL_MATCH') {
        const docNamesEn = missingDocuments.map((d) => d.label.en).join(', ');
        const docNamesTa = missingDocuments.map((d) => d.label.ta).join(', ');
        remarksEn = `Potential Match! Profile criteria met. Please upload required proof document(s): ${docNamesEn}.`;
        remarksTa = `சாத்தியமான தகுதி! சுயவிவர விதிகள் நிறைவேறின. விடுபட்ட சான்றிதழ்களைப் பதிவேற்றவும்: ${docNamesTa}.`;
    }
    else if (status === 'NEEDS_INFORMATION') {
        const fieldNamesEn = missingInformation.map((f) => f.label.en).join(', ');
        const fieldNamesTa = missingInformation.map((f) => f.label.ta).join(', ');
        remarksEn = `More Information Needed! To complete eligibility evaluation, please update profile details: ${fieldNamesEn}.`;
        remarksTa = `கூடுதல் தகவல் தேவை! உங்கள் சுயவிவரத்தில் இந்த விபரங்களைப் புதுப்பிக்கவும்: ${fieldNamesTa}.`;
    }
    else {
        if (triggeredExclusionCount > 0) {
            const triggeredNames = exclusionBreakdown.filter((e) => e.passed).map((e) => e.label.en).join(', ');
            remarksEn = `Not Eligible. Disqualified due to exclusion policy condition(s): ${triggeredNames}.`;
            remarksTa = `தகுதியற்றது. விலக்கு நிபந்தனை பொருந்தியதால் இந்தத் திட்டத்திற்கு விண்ணப்பிக்க முடியாது.`;
        }
        else {
            remarksEn = 'Not Eligible. Profile criteria (such as income limit or age boundary) do not meet scheme requirements.';
            remarksTa = 'தகுதியற்றது. வருமான வரம்பு அல்லது வயது வரம்பு போன்ற அடிப்படை நிபந்தனைகள் பொருந்தவில்லை.';
        }
    }
    const hasVerifiedFact = Object.keys(docContext?.verifiedFacts || {}).length > 0;
    const hasConfirmedFact = Object.keys(docContext?.confirmedFacts || {}).length > 0;
    return {
        status,
        statusBadge,
        isPreliminaryMatch: !hasVerifiedFact && hasConfirmedFact,
        isVerifiedMatch: hasVerifiedFact,
        hasDataConflict: conflictDetails.length > 0,
        conflictDetails,
        criteriaBreakdown,
        exclusionBreakdown,
        missingInformation,
        missingDocuments,
        failedMandatoryCount,
        triggeredExclusionCount,
        gapAnalysisRemarks: { en: remarksEn, ta: remarksTa }
    };
};
exports.evaluateSchemeEligibility = evaluateSchemeEligibility;
