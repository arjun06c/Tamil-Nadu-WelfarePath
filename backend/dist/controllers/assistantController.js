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
// Controlled Assistant Tools
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
    return await DigiLockerDocument_1.DigiLockerDocument.find({ userId, status: { $ne: 'REVOKED' } });
}
async function getApplicationDocumentsTool(userId, applicationId) {
    const query = { citizenId: userId };
    if (applicationId)
        query.applicationId = applicationId;
    return await ApplicationDocument_1.ApplicationDocument.find(query).populate('applicationId', 'applicationReference status');
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
        const { message, lang = 'en', context = {} } = req.body;
        const isTa = lang === 'ta' || /[அ-ஹ]/.test(message || '');
        const queryLower = (message || '').toLowerCase().trim();
        let responseText = '';
        let responseType = 'TEXT'; // TEXT, SCHEME_LIST, ELIGIBILITY_RESULT, APPLICATION_STATUS, DOCUMENT_LIST, NAVIGATION
        let actionButtons = [];
        let structuredData = null;
        const userId = req.user?.id;
        let userApplications = [];
        let citizenProfile = null;
        if (userId) {
            userApplications = await Application_1.Application.find({ citizenId: userId }).populate('schemeId').sort({ createdAt: -1 });
            citizenProfile = await CitizenProfile_1.CitizenProfile.findOne({ userId });
        }
        // 1. DIRECT NAVIGATION INTENTS
        if (queryLower.includes('open profile') ||
            queryLower.includes('my profile') ||
            queryLower.includes('சுயவிவரம்') ||
            queryLower.includes('profile')) {
            responseText = isTa ? 'சரி, உங்கள் சுயவிவரப் பக்கத்தைத் திறக்கிறேன்.' : 'Sure, opening your profile page.';
            actionButtons.push({ label: isTa ? 'சுயவிவரம் திறக்குக' : 'Open Profile', path: '/citizen/profile', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('open applications') ||
            queryLower.includes('my applications') ||
            queryLower.includes('விண்ணப்பங்கள்') ||
            queryLower.includes('show applications')) {
            responseText = isTa ? 'உங்கள் விண்ணப்பப் பக்கத்தைத் திறக்கிறேன்.' : 'Opening your submitted applications page.';
            actionButtons.push({ label: isTa ? 'விண்ணப்பங்கள்' : 'Open Applications', path: '/citizen/applications', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('document center') ||
            queryLower.includes('my documents') ||
            queryLower.includes('ஆவண மையம்') ||
            queryLower.includes('documents')) {
            responseText = isTa ? 'ஆவண மையத்தைத் திறக்கிறேன்.' : 'Opening your Document Center.';
            actionButtons.push({ label: isTa ? 'ஆவண மையம்' : 'Open Document Center', path: '/citizen/documents', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('digilocker') ||
            queryLower.includes('connect digilocker') ||
            queryLower.includes('டிஜிலாக்கர்')) {
            if (!userId) {
                responseText = isTa ? 'டிஜிலாக்கர் நிலையைச் சோதிக்க உள்நுழைக.' : 'Please sign in to check your DigiLocker status.';
                actionButtons.push({ label: isTa ? 'உள்நுழைக' : 'Sign In', path: '/login', actionType: 'NAVIGATE' });
            }
            else {
                const dlStatus = await getDigiLockerStatusTool(userId);
                if (dlStatus.connected) {
                    responseText = isTa
                        ? `உங்கள் டிஜிலாக்கர் கணக்கு வெற்றிகரமாக இணைக்கப்பட்டுள்ளது (${dlStatus.badgeLabel}).`
                        : `Your DigiLocker account is connected (${dlStatus.badgeLabel}).`;
                    actionButtons.push({ label: isTa ? 'ஆவணங்கள்' : 'View Documents', path: '/citizen/documents', actionType: 'NAVIGATE' });
                }
                else {
                    responseText = isTa
                        ? 'உங்கள் டிஜிலாக்கர் கணக்கு இன்னும் இணைக்கப்படவில்லை. சான்றிதழ்களைத் தானாகப் பெற இணைக்கவும்.'
                        : 'Your DigiLocker account is not yet connected. Connect DigiLocker to retrieve official digital proofs.';
                    actionButtons.push({ label: isTa ? 'டிஜிலாக்கர் இணைக்கவும்' : 'Connect DigiLocker', path: '/citizen/settings/digilocker', actionType: 'NAVIGATE' });
                }
            }
        }
        else if (queryLower.includes('benefits') ||
            queryLower.includes('approved benefits') ||
            queryLower.includes('பலன்கள்')) {
            responseText = isTa ? 'உங்கள் ஒப்புதலளிக்கப்பட்ட பலன்கள் பக்கத்தைத் திறக்கிறேன்.' : 'Opening your approved benefits tracking page.';
            actionButtons.push({ label: isTa ? 'பலன்கள்' : 'View Benefits', path: '/citizen/benefits', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('saved schemes') ||
            queryLower.includes('சேமிக்கப்பட்ட திட்டங்கள்')) {
            responseText = isTa ? 'சேமிக்கப்பட்ட திட்டங்கள் பக்கத்தைத் திறக்கிறேன்.' : 'Opening your saved schemes page.';
            actionButtons.push({ label: isTa ? 'சேமிக்கப்பட்டவை' : 'Saved Schemes', path: '/citizen/saved-schemes', actionType: 'NAVIGATE' });
        }
        // 2. SCHEME DOMAIN & CATEGORY SEARCH INTENTS
        else if (queryLower.includes('scholarship') ||
            queryLower.includes('education') ||
            queryLower.includes('student') ||
            queryLower.includes('கல்வி') ||
            queryLower.includes('மாணவர்')) {
            const schemes = await Scheme_1.Scheme.find({ domainKey: 'education', isActive: true, status: 'PUBLISHED' }).limit(5);
            responseText = isTa
                ? `கல்வி மற்றும் உதவித்தொகை பிரிவில் ${schemes.length} திட்டங்கள் உள்ளன:`
                : `Found ${schemes.length} Education & Scholarship schemes:`;
            responseType = 'SCHEME_LIST';
            structuredData = schemes;
            actionButtons.push({ label: isTa ? 'அனைத்து கல்வி திட்டங்கள்' : 'View All Education Schemes', path: '/citizen/schemes?domainKey=education', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('women') ||
            queryLower.includes('maternity') ||
            queryLower.includes('மகளிர்') ||
            queryLower.includes('பெண்')) {
            const schemes = await Scheme_1.Scheme.find({ domainKey: 'women_child', isActive: true, status: 'PUBLISHED' }).limit(5);
            responseText = isTa
                ? `மகளிர் மற்றும் குழந்தைகள் நலப் பிரிவில் ${schemes.length} திட்டங்கள் உள்ளன:`
                : `Found ${schemes.length} Women & Child Welfare schemes:`;
            responseType = 'SCHEME_LIST';
            structuredData = schemes;
            actionButtons.push({ label: isTa ? 'அனைத்து மகளிர் திட்டங்கள்' : 'View All Women Schemes', path: '/citizen/schemes?domainKey=women_child', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('farmer') ||
            queryLower.includes('agriculture') ||
            queryLower.includes('crop') ||
            queryLower.includes('விவசாயி')) {
            const schemes = await Scheme_1.Scheme.find({ domainKey: 'agriculture', isActive: true, status: 'PUBLISHED' }).limit(5);
            responseText = isTa
                ? `வேளாண்மை மற்றும் விவசாயிகள் நலப் பிரிவில் ${schemes.length} திட்டங்கள் உள்ளன:`
                : `Found ${schemes.length} Agriculture & Farmers Welfare schemes:`;
            responseType = 'SCHEME_LIST';
            structuredData = schemes;
            actionButtons.push({ label: isTa ? 'அனைத்து விவசாய திட்டங்கள்' : 'View All Farming Schemes', path: '/citizen/schemes?domainKey=agriculture', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('housing') ||
            queryLower.includes('patta') ||
            queryLower.includes('house') ||
            queryLower.includes('வீடு') ||
            queryLower.includes('பட்டா')) {
            const schemes = await Scheme_1.Scheme.find({ domainKey: 'housing', isActive: true, status: 'PUBLISHED' }).limit(5);
            responseText = isTa
                ? `வீட்டுவசதி மற்றும் பட்டா பிரிவில் ${schemes.length} திட்டங்கள் உள்ளன:`
                : `Found ${schemes.length} Housing & Basic Livelihood schemes:`;
            responseType = 'SCHEME_LIST';
            structuredData = schemes;
            actionButtons.push({ label: isTa ? 'அனைத்து வீட்டு திட்டங்கள்' : 'View All Housing Schemes', path: '/citizen/schemes?domainKey=housing', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('disability') ||
            queryLower.includes('differently abled') ||
            queryLower.includes('மாற்றுத்திறனாளி')) {
            const schemes = await Scheme_1.Scheme.find({ domainKey: 'differently_abled', isActive: true, status: 'PUBLISHED' }).limit(5);
            responseText = isTa
                ? `மாற்றுத்திறனாளிகள் நலப் பிரிவில் ${schemes.length} திட்டங்கள் உள்ளன:`
                : `Found ${schemes.length} Differently Abled Welfare schemes:`;
            responseType = 'SCHEME_LIST';
            structuredData = schemes;
            actionButtons.push({ label: isTa ? 'அனைத்து மாற்றுத்திறனாளி திட்டங்கள்' : 'View All Disability Schemes', path: '/citizen/schemes?domainKey=differently_abled', actionType: 'NAVIGATE' });
        }
        else if (queryLower.includes('pension') ||
            queryLower.includes('social security') ||
            queryLower.includes('ஓய்வூதியம்')) {
            const schemes = await Scheme_1.Scheme.find({ domainKey: 'social_security', isActive: true, status: 'PUBLISHED' }).limit(5);
            responseText = isTa
                ? `சமூக பாதுகாப்பு மற்றும் ஓய்வூதியப் பிரிவில் ${schemes.length} திட்டங்கள் உள்ளன:`
                : `Found ${schemes.length} Social Security & Pension schemes:`;
            responseType = 'SCHEME_LIST';
            structuredData = schemes;
            actionButtons.push({ label: isTa ? 'அனைத்து ஓய்வூதிய திட்டங்கள்' : 'View All Pension Schemes', path: '/citizen/schemes?domainKey=social_security', actionType: 'NAVIGATE' });
        }
        // 3. PERSONALIZED ELIGIBILITY & RECOMMENDATION INTENT
        else if (queryLower.includes('am i eligible') ||
            queryLower.includes('what schemes am i eligible for') ||
            queryLower.includes('which schemes for me') ||
            queryLower.includes('தகுதி') ||
            queryLower.includes('வாய்ப்பு')) {
            if (!userId) {
                responseText = isTa
                    ? 'உங்கள் தகுதியைக் கண்டறிய முதலில் உள்நுழைந்து சுயவிவரத்தைப் பூர்த்தி செய்யவும்.'
                    : 'Please sign in to evaluate your personalized scheme eligibility.';
                actionButtons.push({ label: isTa ? 'உள்நுழைக' : 'Sign In', path: '/login', actionType: 'NAVIGATE' });
            }
            else if (!citizenProfile) {
                responseText = isTa
                    ? 'உங்கள் சுயவிவரம் பூர்த்தி செய்யப்படவில்லை. தகுதியைக் கணக்கிட சுயவிவரத்தைப் பூர்த்தி செய்யவும்.'
                    : 'Please build your citizen profile first to compute personalized scheme eligibility.';
                actionButtons.push({ label: isTa ? 'சுயவிவரம் நிரப்புக' : 'Complete Profile', path: '/citizen/profile', actionType: 'NAVIGATE' });
            }
            else {
                const appDocs = await ApplicationDocument_1.ApplicationDocument.find({ citizenId: userId });
                const attachedDocTypes = appDocs.map((d) => d.docType);
                const activeSchemes = await Scheme_1.Scheme.find({ isActive: true, status: 'PUBLISHED' });
                const matches = [];
                for (const scheme of activeSchemes) {
                    const outcome = (0, eligibilityService_1.evaluateSchemeEligibility)(scheme, citizenProfile, attachedDocTypes);
                    if (outcome.status === 'STRONG_MATCH' || outcome.status === 'POTENTIAL_MATCH' || outcome.status === 'ELIGIBLE' || outcome.status === 'NEAR_ELIGIBLE') {
                        matches.push({
                            scheme,
                            outcome
                        });
                    }
                }
                responseType = 'ELIGIBILITY_RESULT';
                structuredData = matches;
                responseText = isTa
                    ? `உங்கள் சுயவிவரத்தின்படி ${matches.length} பொருந்துகின்ற திட்டங்கள் கண்டறியப்பட்டன:`
                    : `Based on your profile, I found ${matches.length} potential matches:`;
                actionButtons.push({ label: isTa ? 'அனைத்து திட்டங்கள்' : 'Explore All Schemes', path: '/citizen/schemes', actionType: 'NAVIGATE' });
            }
        }
        // 4. APPLICATION TRACKING & STATUS INTENT
        else if (queryLower.includes('application status') ||
            queryLower.includes('my application') ||
            queryLower.includes('track') ||
            queryLower.includes('விண்ணப்ப நிலை')) {
            if (!userId || userApplications.length === 0) {
                responseText = isTa
                    ? 'நீங்கள் இதுவரை எந்த நலத்திட்ட விண்ணப்பத்தையும் சமர்ப்பிக்கவில்லை.'
                    : 'You do not have any active applications in progress.';
                actionButtons.push({ label: isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes', path: '/citizen/schemes', actionType: 'NAVIGATE' });
            }
            else {
                const latestApp = userApplications[0];
                const schemeTitle = isTa ? latestApp.schemeId?.name?.ta : latestApp.schemeId?.name?.en;
                responseText = isTa
                    ? `உங்கள் சமீபத்திய விண்ணப்பம் #${latestApp.applicationReference || latestApp.applicationNo} (${schemeTitle}) தற்போது "${latestApp.status}" நிலையில் உள்ளது.`
                    : `Your recent application #${latestApp.applicationReference || latestApp.applicationNo} (${schemeTitle}) is currently in status "${latestApp.status}".`;
                responseType = 'APPLICATION_STATUS';
                structuredData = userApplications;
                actionButtons.push({ label: isTa ? 'விண்ணப்பத்தைக் கண்காணிக்க' : 'Track Application', path: `/citizen/applications/${latestApp._id}`, actionType: 'NAVIGATE' });
            }
        }
        // 5. REQUIRED DOCUMENTS INTENT
        else if (queryLower.includes('required doc') ||
            queryLower.includes('missing doc') ||
            queryLower.includes('ஆவணங்கள்') ||
            queryLower.includes('சான்றிதழ்')) {
            if (!userId) {
                responseText = isTa ? 'ஆவணத் தேவைகளைச் சோதிக்க உள்நுழைக.' : 'Please sign in to view required documents.';
                actionButtons.push({ label: isTa ? 'உள்நுழைக' : 'Sign In', path: '/login', actionType: 'NAVIGATE' });
            }
            else {
                const appDocs = await ApplicationDocument_1.ApplicationDocument.find({ citizenId: userId });
                const correctionDocs = appDocs.filter((d) => d.verificationStatus === 'CORRECTION_REQUIRED');
                const pendingDocs = appDocs.filter((d) => d.verificationStatus === 'NOT_REVIEWED');
                const verifiedDocs = appDocs.filter((d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'ACCEPTED');
                responseText = isTa
                    ? `ஆவண நிலைமை: ${verifiedDocs.length} அதிகாரியால் சரிபார்க்கப்பட்டது, ${pendingDocs.length} அதிகாரி சரிபார்ப்பிற்கு நிலுவையில் உள்ளது, ${correctionDocs.length} திருத்தம் தேவைப்படுகிறது.`
                    : `Document Summary: ${verifiedDocs.length} Verified, ${pendingDocs.length} Pending Officer Review, ${correctionDocs.length} Correction Required.`;
                actionButtons.push({ label: isTa ? 'ஆவண மையம்' : 'Go to Document Center', path: '/citizen/documents', actionType: 'NAVIGATE' });
            }
        }
        // 6. DEFAULT FALLBACK OR GENERAL QUERY
        else {
            responseText = isTa
                ? 'வணக்கம்! நான் உங்கள் தமிழ்நாடு நலன்பாதை இருமொழி உதவியாளன். தகுதிச் சோதனை, விண்ணப்ப நிலை, சான்றிதழ்கள் மற்றும் டிஜிலாக்கர் இணைப்பு பற்றி என்னிடம் கேட்கலாம்.'
                : 'Hello! I am your bilingual Tamil Nadu WelfarePath Assistant. You can ask me to check scheme eligibility, track applications, manage documents, or connect DigiLocker!';
            actionButtons.push({ label: isTa ? 'என் தகுதியைச் சோதிக்க' : 'Check My Eligibility', path: '/citizen/schemes', actionType: 'ELIGIBILITY_CHECK' }, { label: isTa ? 'திட்டங்களை உலாவுங்கள்' : 'Explore Schemes', path: '/citizen/schemes', actionType: 'NAVIGATE' }, { label: isTa ? 'விண்ணப்ப நிலை' : 'Application Status', path: '/citizen/applications', actionType: 'NAVIGATE' }, { label: isTa ? 'ஆவண மையம்' : 'Document Center', path: '/citizen/documents', actionType: 'NAVIGATE' });
        }
        res.status(200).json({
            reply: responseText,
            responseType,
            structuredData,
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
