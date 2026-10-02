"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSchemeEligibility = exports.evaluateCriterion = void 0;
const evaluateCriterion = (condition, profile) => {
    const { field, operator, value: requiredValue, label, isMandatory = true } = condition;
    // Extract value from profile dynamically
    let citizenValue = profile[field];
    // Special calculated fields
    if (field === 'age' && profile.dob) {
        const today = new Date();
        const birthDate = new Date(profile.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        citizenValue = age;
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
    const explanationEn = passed
        ? `Satisfied: Your ${field} (${citizenValue ?? 'Not provided'}) meets requirement (${requiredValue}).`
        : `Failed: Your ${field} (${citizenValue ?? 'Not provided'}) does not meet requirement (${requiredValue}).`;
    const explanationTa = passed
        ? `நிறைவேறியது: உங்கள் ${field} (${citizenValue ?? 'வழங்கப்படவில்லை'}) நிபந்தனையை (${requiredValue}) பூர்த்தி செய்கிறது.`
        : `பூர்த்தியாகவில்லை: உங்கள் ${field} (${citizenValue ?? 'வழங்கப்படவில்லை'}) நிபந்தனையை (${requiredValue}) பூர்த்தி செய்யவில்லை.`;
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
exports.evaluateCriterion = evaluateCriterion;
const evaluateSchemeEligibility = (scheme, profile, uploadedDocTypes = []) => {
    const criteriaBreakdown = [];
    let failedMandatoryCount = 0;
    // Evaluate 'all' conditions (AND logic)
    if (scheme.rules.all && Array.isArray(scheme.rules.all)) {
        for (const condition of scheme.rules.all) {
            const result = (0, exports.evaluateCriterion)(condition, profile);
            criteriaBreakdown.push(result);
            if (!result.passed && result.isMandatory) {
                failedMandatoryCount++;
            }
        }
    }
    // Check missing mandatory documents
    const missingDocuments = [];
    if (scheme.requiredDocuments && Array.isArray(scheme.requiredDocuments)) {
        for (const doc of scheme.requiredDocuments) {
            if (!uploadedDocTypes.includes(doc.docType)) {
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
    let status = 'NOT_ELIGIBLE';
    if (failedMandatoryCount === 0 && missingMandatoryDocsCount === 0) {
        status = 'ELIGIBLE';
    }
    else if (failedMandatoryCount === 0 && missingMandatoryDocsCount > 0) {
        // Satisfies all demographic/income rules, but missing document proof
        status = 'NEAR_ELIGIBLE';
    }
    else if (failedMandatoryCount === 1 && missingMandatoryDocsCount <= 2) {
        // 1 criteria failed or missing profile detail, near eligible
        status = 'NEAR_ELIGIBLE';
    }
    else {
        status = 'NOT_ELIGIBLE';
    }
    // Generate Gap Analysis Remarks
    let remarksEn = '';
    let remarksTa = '';
    if (status === 'ELIGIBLE') {
        remarksEn = 'Congratulations! You meet all configured eligibility criteria and have prepared required proof documents.';
        remarksTa = 'வாழ்த்துக்கள்! நீங்கள் அனைத்து தகுதி அளவுகோல்களையும் பூர்த்தி செய்து தேவையான சான்றிதழ்களை தயார் வைத்துள்ளீர்கள்.';
    }
    else if (status === 'NEAR_ELIGIBLE') {
        const docNamesEn = missingDocuments.map((d) => d.label.en).join(', ');
        const docNamesTa = missingDocuments.map((d) => d.label.ta).join(', ');
        if (missingMandatoryDocsCount > 0) {
            remarksEn = `You meet demographic criteria! To complete eligibility, please upload missing proof document(s): ${docNamesEn}.`;
            remarksTa = `நீங்கள் தகுதி பெறலாம்! தகுதியை முழுமையாக்க விடுபட்ட சான்றிதழ்களைப் பதிவேற்றவும்: ${docNamesTa}.`;
        }
        else {
            remarksEn = 'You are near eligible! Please review your profile data and criteria breakdown above for unresolved fields.';
            remarksTa = 'நீங்கள் தகுதி பெறக்கூடிய நிலையில் உள்ளீர்கள்! உங்கள் சுயவிவரத் தகவல்களைச் சரிபார்த்து புதுப்பிக்கவும்.';
        }
    }
    else {
        remarksEn = 'Currently ineligible based on core policy criteria (such as income limit, age boundary, or target school background).';
        remarksTa = 'அடிப்படை நிபந்தனைகள் (வருமான வரம்பு, வயது அல்லது கல்வி வகை) பொருந்தாததால் தற்போது தகுதியற்றது.';
    }
    return {
        status,
        criteriaBreakdown,
        missingDocuments,
        failedMandatoryCount,
        gapAnalysisRemarks: { en: remarksEn, ta: remarksTa }
    };
};
exports.evaluateSchemeEligibility = evaluateSchemeEligibility;
