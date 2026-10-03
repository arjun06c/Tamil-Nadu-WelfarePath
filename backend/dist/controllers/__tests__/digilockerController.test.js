"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../config/db");
const User_1 = require("../../models/User");
const Application_1 = require("../../models/Application");
const Scheme_1 = require("../../models/Scheme");
const ApplicationDocument_1 = require("../../models/ApplicationDocument");
const DigiLockerConnection_1 = require("../../models/DigiLockerConnection");
const digilockerController_1 = require("../digilockerController");
// Helper mock Express Response
const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.data = null;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (payload) => {
        res.data = payload;
        return res;
    };
    return res;
};
async function runPhase4IntegrationTests() {
    console.log('🧪 Starting Phase 4 DigiLocker Controller & API Integration Test Suite...\n');
    await (0, db_1.connectDB)();
    // Create Test Citizens
    const citizenA = await User_1.User.create({
        name: 'Citizen Alpha',
        email: `alpha_${Date.now()}@tn.gov.in`,
        mobile: '9876543210',
        passwordHash: 'hashed_password',
        role: User_1.UserRole.CITIZEN,
        district: 'Chennai'
    });
    const citizenB = await User_1.User.create({
        name: 'Citizen Beta',
        email: `beta_${Date.now()}@tn.gov.in`,
        mobile: '9876543211',
        passwordHash: 'hashed_password',
        role: User_1.UserRole.CITIZEN,
        district: 'Coimbatore'
    });
    // Create Test Scheme
    const scheme = await Scheme_1.Scheme.create({
        schemeCode: `TN-SCH-TEST-${Date.now()}`,
        name: { en: 'Pudukhumai Penn Scheme', ta: 'புதுமைப் பெண் திட்டம்' },
        department: { en: 'Social Welfare', ta: 'சமூக நலத்துறை' },
        domainKey: 'WOMEN_EMPOWERMENT',
        description: { en: 'Higher education assistance', ta: 'உயர் கல்வி உதவி' },
        benefitSummary: { en: '₹1000 monthly', ta: 'மாதம் ₹1000' },
        rules: { all: [] },
        requiredDocuments: [
            {
                docType: 'IncomeCertificate',
                isMandatory: true,
                label: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' },
                sources: ['DIGILOCKER', 'MANUAL_UPLOAD']
            }
        ],
        applicationMethods: [
            {
                methodType: 'PLATFORM_ASSISTED',
                title: { en: 'Online', ta: 'ஆன்லைன்' },
                instructions: { en: 'Apply via portal', ta: 'இணையதளம் வழியாக' },
                responsibleOffice: { en: 'Dept Office', ta: 'அலுவலகம்' }
            }
        ]
    });
    // Create Application for Citizen A
    const appA = await Application_1.Application.create({
        applicationNo: `TNP-WP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        applicationReference: `TNP-WP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        citizenId: citizenA._id,
        schemeId: scheme._id,
        status: Application_1.ApplicationStatus.SUBMITTED,
        formData: { district: 'Chennai' }
    });
    console.log(`[Setup] Test Citizen A: ${citizenA.email} (${citizenA._id})`);
    console.log(`[Setup] Test Citizen B: ${citizenB.email} (${citizenB._id})`);
    console.log(`[Setup] Test Application A: ${appA.applicationReference}`);
    // Test 1: Initial Status Check (Disconnected)
    const req1 = { user: { id: citizenA._id.toString(), email: citizenA.email } };
    const res1 = createMockRes();
    await (0, digilockerController_1.getConnectionStatus)(req1, res1);
    console.log(`[Test 1] Disconnected Status Check: connected=${res1.data.connected}, badge="${res1.data.badgeLabel}"`);
    if (res1.data.connected !== false || res1.data.badgeLabel !== 'Demo Document Source') {
        throw new Error('Initial status test failed');
    }
    // Test 2: Start Connection & OAuth URL Generation
    const req2 = { user: { id: citizenA._id.toString(), email: citizenA.email } };
    const res2 = createMockRes();
    await (0, digilockerController_1.startConnection)(req2, res2);
    console.log(`[Test 2] Start Connection Auth URL: ${res2.data.authorizationUrl}`);
    if (!res2.data.authorizationUrl.includes('mock_auth=true')) {
        throw new Error('Start connection failed');
    }
    // Test 3: OAuth Callback Handler
    const req3 = {
        user: { id: citizenA._id.toString(), email: citizenA.email },
        query: { code: 'mock_code_alpha', state: res2.data.state }
    };
    const res3 = createMockRes();
    await (0, digilockerController_1.handleOAuthCallback)(req3, res3);
    console.log(`[Test 3] OAuth Callback Execution: success=${res3.data.success}`);
    if (!res3.data.success)
        throw new Error('OAuth callback failed');
    // Verify DB Connection Record Created
    const connA = await DigiLockerConnection_1.DigiLockerConnection.findOne({ userId: citizenA._id, status: 'CONNECTED' });
    if (!connA)
        throw new Error('DigiLockerConnection record missing in database');
    // Test 4: Record Citizen Consent
    const req4 = {
        user: { id: citizenA._id.toString(), email: citizenA.email },
        body: { purpose: 'Welfare verification', requestedScopes: ['doc_type'], grantedScopes: ['doc_type'] }
    };
    const res4 = createMockRes();
    await (0, digilockerController_1.recordConsent)(req4, res4);
    console.log(`[Test 4] Consent Recorded Ref: ${res4.data.consent.consentReference}`);
    if (!res4.data.consent.consentReference)
        throw new Error('Consent recording failed');
    // Test 5: Fetch Available Digital Documents
    const req5 = { user: { id: citizenA._id.toString(), email: citizenA.email } };
    const res5 = createMockRes();
    await (0, digilockerController_1.getAvailableDocuments)(req5, res5);
    console.log(`[Test 5] Available Documents Count: ${res5.data.count}`);
    if (res5.data.count < 3)
        throw new Error('Digital document discovery failed');
    const incDoc = res5.data.documents.find((d) => d.documentType === 'IncomeCertificate');
    console.log(`[Test 5.1] Discovered Document ID: ${incDoc.id} | Name: ${incDoc.name.en}`);
    // Test 6: Cross-Citizen Ownership Security Protection Check
    console.log('[Test 6] Testing Cross-Citizen Document Access Prevention...');
    const req6 = {
        user: { id: citizenB._id.toString(), email: citizenB.email },
        params: { id: incDoc.id }
    };
    const res6 = createMockRes();
    await (0, digilockerController_1.getDocumentById)(req6, res6);
    console.log(`[Test 6] Accessing Citizen A's doc from Citizen B -> StatusCode: ${res6.statusCode} (${res6.data.message})`);
    if (res6.statusCode !== 403) {
        throw new Error('FAILED SECURITY CHECK: Citizen B was able to view Citizen A document!');
    }
    // Test 7: Select Document for Citizen A
    const req7 = {
        user: { id: citizenA._id.toString(), email: citizenA.email },
        params: { id: incDoc.id },
        body: { applicationId: appA._id.toString() }
    };
    const res7 = createMockRes();
    await (0, digilockerController_1.selectDocument)(req7, res7);
    console.log(`[Test 7] Selected Document Status: ${res7.data.document.status}`);
    // Test 8: Attach DigiLocker Document to Application
    const req8 = {
        user: { id: citizenA._id.toString(), email: citizenA.email },
        params: { applicationId: appA._id.toString() },
        body: { digilockerDocumentId: incDoc.id, docType: 'IncomeCertificate' }
    };
    const res8 = createMockRes();
    await (0, digilockerController_1.attachDigiLockerDocumentToApplication)(req8, res8);
    console.log(`[Test 8] Attached Doc Source: ${res8.data.source} | VerificationStatus: ${res8.data.verificationStatus}`);
    if (res8.data.source !== 'DIGILOCKER' || res8.data.verificationStatus !== 'NOT_REVIEWED') {
        throw new Error('Attachment failed or incorrectly marked document as verified without officer review');
    }
    // Test 9: Cross-Citizen Application Link Prevention
    console.log('[Test 9] Testing Cross-Citizen Application Attachment Prevention...');
    const req9 = {
        user: { id: citizenB._id.toString(), email: citizenB.email },
        params: { applicationId: appA._id.toString() },
        body: { digilockerDocumentId: incDoc.id, docType: 'IncomeCertificate' }
    };
    const res9 = createMockRes();
    await (0, digilockerController_1.attachDigiLockerDocumentToApplication)(req9, res9);
    console.log(`[Test 9] Linking Citizen A's app from Citizen B -> StatusCode: ${res9.statusCode} (${res9.data.message})`);
    if (res9.statusCode !== 403) {
        throw new Error('FAILED SECURITY CHECK: Citizen B was able to attach to Citizen A application!');
    }
    // Test 10: Disconnect Integration
    const req10 = { user: { id: citizenA._id.toString(), email: citizenA.email } };
    const res10 = createMockRes();
    await (0, digilockerController_1.disconnectConnection)(req10, res10);
    console.log(`[Test 10] Disconnect Status Result: ${res10.data.status}`);
    if (res10.data.status !== 'DISCONNECTED')
        throw new Error('Disconnect failed');
    // Verify attached ApplicationDocument is preserved (data retention requirement)
    const appDocCheck = await ApplicationDocument_1.ApplicationDocument.findOne({ applicationId: appA._id, docType: 'IncomeCertificate' });
    console.log(`[Test 10.1] Historical Application Document Preserved: ${appDocCheck?.fileName} (Source: ${appDocCheck?.source})`);
    if (!appDocCheck)
        throw new Error('Disconnect deleted historical application document!');
    console.log('\n✅ ALL PHASE 4 CONTROLLER & SECURITY INTEGRATION TESTS PASSED SUCCESSFULLY!');
}
runPhase4IntegrationTests()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('❌ Phase 4 Test Suite Failed:', err);
    process.exit(1);
});
