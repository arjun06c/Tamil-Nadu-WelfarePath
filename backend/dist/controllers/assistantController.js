"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAssistantChat = void 0;
exports.getDigiLockerStatusTool = getDigiLockerStatusTool;
exports.getDigiLockerConsentStatusTool = getDigiLockerConsentStatusTool;
exports.getAvailableDigiLockerDocumentsTool = getAvailableDigiLockerDocumentsTool;
exports.getApplicationDocumentsTool = getApplicationDocumentsTool;
exports.getMissingDocumentsTool = getMissingDocumentsTool;
const CitizenProfile_1 = require("../models/CitizenProfile");
const Scheme_1 = require("../models/Scheme");
const Application_1 = require("../models/Application");
const ApplicationDocument_1 = require("../models/ApplicationDocument");
const DigiLockerConnection_1 = require("../models/DigiLockerConnection");
const DigiLockerConsent_1 = require("../models/DigiLockerConsent");
const DigiLockerDocument_1 = require("../models/DigiLockerDocument");
const eligibilityService_1 = require("../services/eligibilityService");
// Controlled Assistant Service Tools (Using authorized backend services only - No raw direct DB exposure)
async function getDigiLockerStatusTool(userId) {
    const connection = await DigiLockerConnection_1.DigiLockerConnection.findOne({ userId });
    const mode = process.env.DIGILOCKER_MODE || 'mock';
    return {
        connected: connection?.status === 'CONNECTED',
        mode,
        badgeLabel: mode === 'sandbox'
            ? 'DigiLocker Sandbox'
            : mode === 'production'
                ? 'DigiLocker'
                : 'Demo Document Source'
    };
}
async function getDigiLockerConsentStatusTool(userId) {
    const consent = await DigiLockerConsent_1.DigiLockerConsent.findOne({ userId, status: 'ACTIVE' });
    return {
        hasActiveConsent: !!consent,
        policyVersion: consent?.policyVersion || '2026.1',
        consentedAt: consent?.consentedAt || null
    };
}
async function getAvailableDigiLockerDocumentsTool(userId) {
    const docs = await DigiLockerDocument_1.DigiLockerDocument.find({ userId, status: { $ne: 'REVOKED' } });
    return docs;
}
async function getApplicationDocumentsTool(userId, applicationId) {
    const query = { citizenId: userId };
    if (applicationId)
        query.applicationId = applicationId;
    const docs = await ApplicationDocument_1.ApplicationDocument.find(query).populate('applicationId', 'applicationReference status');
    return docs;
}
async function getMissingDocumentsTool(userId, applicationId) {
    const app = await Application_1.Application.findById(applicationId).populate('schemeId');
    if (!app)
        return { missing: [], totalRequired: 0, attachedCount: 0 };
    const docs = await ApplicationDocument_1.ApplicationDocument.find({ applicationId });
    const attachedTypes = new Set(docs.map((d) => d.docType));
    const scheme = app.schemeId;
    const reqDocs = scheme?.requiredDocuments || [];
    const missing = reqDocs.filter((r) => r.isMandatory !== false && !attachedTypes.has(r.docType));
    return {
        missing,
        attachedCount: docs.length,
        totalRequired: reqDocs.length,
        schemeName: scheme?.name
    };
}
const handleAssistantChat = async (req, res) => {
    try {
        const { message, lang = 'en' } = req.body;
        const isTa = lang === 'ta' || /[அ-ஹ]/.test(message || '');
        let responseText = '';
        const actionButtons = [];
        let userId = req.user?.id;
        let userApplications = [];
        if (userId) {
            userApplications = await Application_1.Application.find({ citizenId: userId }).populate('schemeId').sort({ createdAt: -1 });
        }
        const queryLower = (message || '').toLowerCase();
        // INTENT 1: DigiLocker Connection & Integration Status
        if (queryLower.includes('digilocker') ||
            queryLower.includes('டிஜிலாக்கர்') ||
            queryLower.includes('connect digilocker') ||
            queryLower.includes('இணைப்பு')) {
            if (!userId) {
                responseText = isTa
                    ? 'டிஜிலாக்கர் நிலையைச் சோதிக்க தயவுசெய்து கணக்கில் உள்நுழையவும்.'
                    : 'Please sign in to check your DigiLocker integration status.';
                actionButtons.push({ label: isTa ? 'உள்நுழைக' : 'Sign In', path: '/login' });
            }
            else {
                const dlStatus = await getDigiLockerStatusTool(userId);
                const consentStatus = await getDigiLockerConsentStatusTool(userId);
                if (dlStatus.connected) {
                    responseText = isTa
                        ? `உங்கள் டிஜிலாக்கர் கணக்கு வெற்றிகரமாக இணைக்கப்பட்டுள்ளது (${dlStatus.badgeLabel}). சம்மத நிலை: செயலில் உள்ளது. வருமானம், சாதி மற்றும் கல்விச் சான்றிதழ்களை விண்ணப்பங்களில் நேரடியாகப் பயன்படுத்தலாம்.`
                        : `Your DigiLocker account is connected (${dlStatus.badgeLabel}). Active Consent: Granted. You can attach official digital proofs directly to welfare applications.`;
                    actionButtons.push({
                        label: isTa ? 'ஆவண மையம்' : 'Go to Document Workspace',
                        path: '/citizen/documents'
                    });
                }
                else {
                    responseText = isTa
                        ? 'உங்கள் டிஜிலாக்கர் கணக்கு இன்னும் இணைக்கப்படவில்லை. டிஜிலாக்கரை இணைப்பதன் மூலம் சான்றிதழ்களை தானாகப் பெறலாம்.'
                        : 'Your DigiLocker account is not yet connected. Connect DigiLocker to seamlessly discover and attach digital proofs to your applications.';
                    actionButtons.push({
                        label: isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker',
                        path: '/citizen/settings/digilocker'
                    });
                }
            }
        }
        // INTENT 2: Available DigiLocker Documents
        else if (queryLower.includes('available document') ||
            queryLower.includes('my certificates') ||
            queryLower.includes('சான்றிதழ்கள்') ||
            queryLower.includes('டிஜிட்டல் ஆவணங்கள்')) {
            if (!userId) {
                responseText = isTa
                    ? 'சான்றிதழ்களைக் காண உள்நுழைக.'
                    : 'Please sign in to view available digital proofs.';
                actionButtons.push({ label: isTa ? 'உள்நுழைக' : 'Sign In', path: '/login' });
            }
            else {
                const dlDocs = await getAvailableDigiLockerDocumentsTool(userId);
                if (dlDocs.length === 0) {
                    responseText = isTa
                        ? 'கிடைக்கக்கூடிய டிஜிலாக்கர் சான்றிதழ்கள் எதுவும் காணப்படவில்லை. டிஜிலாக்கர் அமைப்புகளில் இணைப்பைச் சோதிக்கவும்.'
                        : 'No digital proof documents discovered yet. Check your DigiLocker connection in settings.';
                    actionButtons.push({
                        label: isTa ? 'டிஜிலாக்கர் அமைப்புகள்' : 'DigiLocker Settings',
                        path: '/citizen/settings/digilocker'
                    });
                }
                else {
                    const docNames = dlDocs.map((d) => (isTa ? d.name.ta : d.name.en)).join(', ');
                    responseText = isTa
                        ? `உங்களிடம் ${dlDocs.length} டிஜிலாக்கர் சான்றிதழ்கள் உள்ளன: ${docNames}.`
                        : `You have ${dlDocs.length} digital certificates available in DigiLocker repository: ${docNames}.`;
                    actionButtons.push({
                        label: isTa ? 'ஆவணங்களைக் காண்க' : 'View Documents Workspace',
                        path: '/citizen/documents'
                    });
                }
            }
        }
        // INTENT 3: Missing Required Application Documents
        else if (queryLower.includes('missing') ||
            queryLower.includes('pending document') ||
            queryLower.includes('விடுபட்ட') ||
            queryLower.includes('தேவைப்படும்')) {
            if (!userId || userApplications.length === 0) {
                responseText = isTa
                    ? 'உங்களிடம் நிலுவையில் உள்ள விண்ணப்பங்கள் எதுவும் இல்லை.'
                    : 'You do not have any active applications in progress.';
                actionButtons.push({ label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes', path: '/schemes' });
            }
            else {
                const latestApp = userApplications[0];
                const missingInfo = await getMissingDocumentsTool(userId, latestApp._id);
                if (missingInfo.missing.length === 0) {
                    responseText = isTa
                        ? `விண்ணப்பம் #${latestApp.applicationReference || latestApp.applicationNo}-க்கு தேவையான அனைத்து ஆவணங்களும் இணைக்கப்பட்டுள்ளன!`
                        : `All required documents are successfully attached for application #${latestApp.applicationReference || latestApp.applicationNo}!`;
                }
                else {
                    const missingNames = missingInfo.missing
                        .map((m) => (isTa ? m.label?.ta || m.docType : m.label?.en || m.docType))
                        .join(', ');
                    responseText = isTa
                        ? `விண்ணப்பம் #${latestApp.applicationReference || latestApp.applicationNo}-க்கு விடுபட்ட ஆவணங்கள் (${missingInfo.missing.length}): ${missingNames}.`
                        : `Missing required documents for application #${latestApp.applicationReference || latestApp.applicationNo} (${missingInfo.missing.length}): ${missingNames}.`;
                    actionButtons.push({
                        label: isTa ? 'ஆவணங்களை இணைக்கவும்' : 'Attach Documents',
                        path: `/citizen/applications/${latestApp._id}/documents`
                    });
                }
            }
        }
        // INTENT 4: Document Verification Status & Officer Correction Explanation
        else if (queryLower.includes('verification') ||
            queryLower.includes('correction') ||
            queryLower.includes('remark') ||
            queryLower.includes('officer') ||
            queryLower.includes('சரிபார்ப்பு') ||
            queryLower.includes('திருத்தம்')) {
            if (!userId) {
                responseText = isTa ? 'சரிபார்ப்பு நிலையைச் சோதிக்க உள்நுழைக.' : 'Please sign in to check verification status.';
                actionButtons.push({ label: isTa ? 'உள்நுழைக' : 'Sign In', path: '/login' });
            }
            else {
                const appDocs = await getApplicationDocumentsTool(userId);
                const correctionDocs = appDocs.filter((d) => d.verificationStatus === 'CORRECTION_REQUIRED');
                const pendingDocs = appDocs.filter((d) => d.verificationStatus === 'NOT_REVIEWED');
                const verifiedDocs = appDocs.filter((d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'ACCEPTED');
                if (correctionDocs.length > 0) {
                    const doc = correctionDocs[0];
                    responseText = isTa
                        ? `⚠️ கவனிக்கவும்: "${isTa ? doc.documentName?.ta : doc.documentName?.en}" சான்றிதழில் அதிகாரி திருத்தம் கேட்டுள்ளார். அதிகாரியின் குறிப்பு: "${doc.officerRemarks || 'சரியான சான்றிதழைப் பதிவேற்றவும்'}".`
                        : `⚠️ Action Required: Officer requested correction for "${doc.documentName?.en || doc.docType}". Officer remark: "${doc.officerRemarks || 'Please replace document'}".`;
                    actionButtons.push({
                        label: isTa ? 'ஆவணத்தை மாற்றுக' : 'Replace Document',
                        path: `/citizen/applications/${doc.applicationId?._id || ''}/documents`
                    });
                }
                else {
                    responseText = isTa
                        ? `ஆவண சரிபார்ப்பு நிலவரம்: ${verifiedDocs.length} அதிகாரியால் சரிபார்க்கப்பட்டது, ${pendingDocs.length} அதிகாரி சரிபார்ப்பு நிலுவையில் உள்ளது. (குறிப்பு: டிஜிலாக்கரில் பெறப்பட்ட ஆவணங்களும் அதிகாரி சரிபார்ப்பிற்கு பின்னரே 'Verified' நிலையைப் பெறும்).`
                        : `Document Verification Status: ${verifiedDocs.length} Verified by Officer, ${pendingDocs.length} Pending Officer Review. (Note: DigiLocker retrieval attaches proof but requires explicit officer audit before being marked Verified).`;
                    actionButtons.push({
                        label: isTa ? 'என் ஆவணங்கள்' : 'My Documents Workspace',
                        path: '/citizen/documents'
                    });
                }
            }
        }
        // INTENT 5: Scheme Eligibility Discovery Query
        else if (queryLower.includes('eligible') || queryLower.includes('தகுதி') || queryLower.includes('வாய்ப்பு')) {
            if (!userId) {
                responseText = isTa
                    ? 'உங்கள் தகுதியைக் கண்டறிய முதலில் உள்நுழைந்து சுயவிவரத்தைப் பூர்த்தி செய்யவும்.'
                    : 'To evaluate your exact eligibility, please sign in and complete your profile.';
                actionButtons.push({ label: isTa ? 'உள்நுழைக' : 'Sign In', path: '/login' });
            }
            else {
                const profile = await CitizenProfile_1.CitizenProfile.findOne({ userId });
                if (!profile) {
                    responseText = isTa
                        ? 'உங்கள் சுயவிவரம் பூர்த்தி செய்யப்படவில்லை. தகுதியைக் கணக்கிட சுயவிவரத்தைப் பூர்த்தி செய்யவும்.'
                        : 'Please build your citizen profile first to compute personalized scheme eligibility.';
                    actionButtons.push({ label: isTa ? 'சுயவிவரம் நிரப்புக' : 'Complete Profile', path: '/citizen/profile' });
                }
                else {
                    const activeSchemes = await Scheme_1.Scheme.find({ isActive: true });
                    const eligibleList = [];
                    for (const scheme of activeSchemes) {
                        const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(scheme, profile);
                        if (outcome.status === 'ELIGIBLE') {
                            eligibleList.push(isTa ? scheme.name.ta : scheme.name.en);
                        }
                    }
                    responseText = isTa
                        ? `உங்கள் சுயவிவரத்தின்படி ${eligibleList.length} திட்டங்களுக்கு முழு தகுதி உள்ளது: ${eligibleList.slice(0, 3).join(', ')}.`
                        : `Based on your profile, you are eligible for ${eligibleList.length} schemes: ${eligibleList.slice(0, 3).join(', ')}.`;
                    actionButtons.push({ label: isTa ? 'டாஷ்போர்டு' : 'View Dashboard', path: '/citizen/dashboard' });
                }
            }
        }
        // INTENT 6: Application Status Query
        else if (queryLower.includes('status') ||
            queryLower.includes('track') ||
            queryLower.includes('நிலை') ||
            queryLower.includes('விண்ணப்பம்')) {
            if (userApplications.length === 0) {
                responseText = isTa
                    ? 'நீங்கள் இதுவரை எந்த விண்ணப்பத்தையும் சமர்ப்பிக்கவில்லை.'
                    : 'You have not submitted any welfare applications yet.';
                actionButtons.push({ label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes', path: '/citizen/schemes' });
            }
            else {
                const latestApp = userApplications[0];
                const schemeTitle = isTa ? latestApp.schemeId?.name?.ta : latestApp.schemeId?.name?.en;
                responseText = isTa
                    ? `உங்கள் சமீபத்திய விண்ணப்பம் #${latestApp.applicationReference || latestApp.applicationNo} (${schemeTitle}) தற்போது "${latestApp.status}" நிலையில் உள்ளது.`
                    : `Your recent application #${latestApp.applicationReference || latestApp.applicationNo} (${schemeTitle}) is currently in status "${latestApp.status}".`;
                actionButtons.push({
                    label: isTa ? 'விண்ணப்பத்தைக் கண்காணிக்க' : 'Track Application',
                    path: `/citizen/applications/${latestApp._id}`
                });
            }
        }
        // INTENT 7: General Default Greeting
        else {
            responseText = isTa
                ? 'வணக்கம்! நான் உங்கள் தமிழ்நாடு நலன்பாதை இருமொழி உதவியாளன். டிஜிலாக்கர் இணைப்பு, விடுபட்ட சான்றிதழ்கள், மற்றும் விண்ணப்பங்களின் நிலை குறித்து என்னிடம் கேட்கலாம்.'
                : 'Hello! I am your bilingual Tamil Nadu WelfarePath Assistant. You can ask me about DigiLocker status, missing documents, scheme eligibility, or application tracking!';
            actionButtons.push({ label: isTa ? 'ஆவண மையம்' : 'Document Workspace', path: '/citizen/documents' }, { label: isTa ? 'டிஜிலாக்கர்' : 'DigiLocker Settings', path: '/citizen/settings/digilocker' });
        }
        res.status(200).json({
            reply: responseText,
            actionButtons,
            lang: isTa ? 'ta' : 'en'
        });
    }
    catch (error) {
        console.error('handleAssistantChat error:', error);
        res.status(500).json({ message: 'Error processing assistant prompt' });
    }
};
exports.handleAssistantChat = handleAssistantChat;
