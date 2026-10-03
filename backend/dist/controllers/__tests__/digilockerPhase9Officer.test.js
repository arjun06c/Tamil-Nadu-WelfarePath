"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../config/db");
const User_1 = require("../../models/User");
const Scheme_1 = require("../../models/Scheme");
const Application_1 = require("../../models/Application");
const ApplicationDocument_1 = require("../../models/ApplicationDocument");
const Notification_1 = require("../../models/Notification");
const AuditLog_1 = require("../../models/AuditLog");
const adminController_1 = require("../adminController");
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
async function runPhase9OfficerTests() {
    console.log('🔄 Starting Phase 9 Officer Verification Workspace Integration Test Suite...\n');
    await (0, db_1.connectDB)();
    // 1. Create Officer & Citizen Users
    const officer = await User_1.User.create({
        name: 'District Officer V. Selvam',
        email: `officer_p9_${Date.now()}@tn.gov.in`,
        mobile: '9840123456',
        passwordHash: 'hashed_pass',
        role: User_1.UserRole.OFFICER,
        district: 'Madurai'
    });
    const citizen = await User_1.User.create({
        name: 'Citizen M. Anitha',
        email: `anitha_p9_${Date.now()}@example.com`,
        mobile: '9789012345',
        passwordHash: 'hashed_pass',
        role: User_1.UserRole.CITIZEN,
        district: 'Madurai'
    });
    // 2. Create Scheme
    const scheme = await Scheme_1.Scheme.create({
        schemeCode: `TN-P9-${Date.now()}`,
        name: { en: 'Chief Minister Comprehensive Health Insurance', ta: 'முதலமைச்சரின் விரிவான மருத்துவக் காப்பீட்டுத் திட்டம்' },
        department: { en: 'Health and Family Welfare', ta: 'மக்கள் நல்வாழ்வுத் துறை' },
        domainKey: 'HEALTHCARE',
        description: { en: 'Health Coverage', ta: 'மருத்துவக் காப்பீடு' },
        benefitSummary: { en: 'Up to ₹5 Lakh/Year', ta: 'ஆண்டுக்கு ₹5 லட்சம் வரை' },
        rules: { all: [] },
        requiredDocuments: [
            { docType: 'IncomeCertificate', label: { en: 'Income Cert', ta: 'வருமானச் சான்றிதழ்' }, isMandatory: true }
        ],
        applicationMethods: [
            {
                methodType: 'PLATFORM_ASSISTED',
                title: { en: 'Online', ta: 'ஆன்லைன்' },
                instructions: { en: 'Portal', ta: 'இணையதளம்' },
                responsibleOffice: { en: 'District Health Office', ta: 'மாவட்ட சுகாதார அலுவலகம்' }
            }
        ]
    });
    // 3. Create Application & Documents
    const app = await Application_1.Application.create({
        applicationNo: `TNP-WP-2026-OFF-${Math.floor(100000 + Math.random() * 900000)}`,
        applicationReference: `TNP-WP-2026-OFF-${Math.floor(100000 + Math.random() * 900000)}`,
        citizenId: citizen._id,
        schemeId: scheme._id,
        status: Application_1.ApplicationStatus.DOC_VERIFICATION,
        currentStep: 6,
        completionPercentage: 100
    });
    const digiDoc = await ApplicationDocument_1.ApplicationDocument.create({
        applicationId: app._id,
        citizenId: citizen._id,
        docType: 'IncomeCertificate',
        documentName: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' },
        fileName: 'Income_DigiLocker.pdf',
        fileUrl: 'https://digilocker.example.com/doc/inc_99',
        source: 'DIGILOCKER',
        sourceReference: 'in.gov.tn.edistrict.inc:2026-888',
        issuer: 'Revenue Department, Govt of Tamil Nadu',
        retrievedAt: new Date(),
        uploadStatus: 'RETRIEVED',
        verificationStatus: 'NOT_REVIEWED',
        uploadedAt: new Date()
    });
    // Test 1: Verify Initial Unverified DigiLocker State
    console.log('[Test 1] Verifying that DigiLocker document initially requires officer review...');
    console.log(`[Test 1.1] Doc Source: ${digiDoc.source}, Initial VerificationStatus: ${digiDoc.verificationStatus}`);
    if (digiDoc.source !== 'DIGILOCKER' || digiDoc.verificationStatus !== 'NOT_REVIEWED') {
        throw new Error('DigiLocker document should start in NOT_REVIEWED status pending officer verification');
    }
    // Test 2: Officer Requests Document Correction
    console.log('[Test 2] Officer requesting document correction with remarks...');
    const reqCorrection = {
        user: { id: officer._id.toString(), email: officer.email, role: 'Officer' },
        params: { id: app._id.toString(), docId: digiDoc._id.toString() },
        body: {
            verificationStatus: 'CORRECTION_REQUIRED',
            officerRemarks: 'Income certificate issuer stamp signature is illegible. Please provide valid copy.'
        }
    };
    const resCorrection = createMockRes();
    await (0, adminController_1.updateDocumentVerificationStatus)(reqCorrection, resCorrection);
    console.log(`[Test 2.1] Update Result Message: ${resCorrection.data.message}`);
    if (resCorrection.statusCode !== 200) {
        throw new Error('Failed to update document verification status');
    }
    const updatedDoc = await ApplicationDocument_1.ApplicationDocument.findById(digiDoc._id);
    console.log(`[Test 2.2] Updated Doc verificationStatus: ${updatedDoc?.verificationStatus}, Remarks: "${updatedDoc?.officerRemarks}"`);
    if (updatedDoc?.verificationStatus !== 'CORRECTION_REQUIRED' || !updatedDoc?.officerRemarks) {
        throw new Error('Document status failed to update to CORRECTION_REQUIRED');
    }
    const updatedApp = await Application_1.Application.findById(app._id);
    console.log(`[Test 2.3] Updated Application status: ${updatedApp?.status}`);
    if (updatedApp?.status !== Application_1.ApplicationStatus.CORRECTION_REQUIRED) {
        throw new Error('Application status failed to transition to CORRECTION_REQUIRED');
    }
    // Verify Citizen Notification & Audit Log created
    const notif = await Notification_1.Notification.findOne({ userId: citizen._id });
    console.log(`[Test 2.4] Citizen Notification Title: ${notif?.title?.en}`);
    if (!notif)
        throw new Error('Citizen notification was not created');
    const audit = await AuditLog_1.AuditLog.findOne({ targetId: digiDoc._id.toString() });
    console.log(`[Test 2.5] Audit Log Action: ${audit?.action}, Actor: ${audit?.actorEmail}`);
    if (!audit)
        throw new Error('Audit log entry was not created');
    // Test 3: Officer Verifies Corrected Document
    console.log('[Test 3] Officer marking document as VERIFIED after review...');
    const reqVerify = {
        user: { id: officer._id.toString(), email: officer.email, role: 'Officer' },
        params: { id: app._id.toString(), docId: digiDoc._id.toString() },
        body: {
            verificationStatus: 'VERIFIED',
            officerRemarks: 'Verified against e-District Govt database.'
        }
    };
    const resVerify = createMockRes();
    await (0, adminController_1.updateDocumentVerificationStatus)(reqVerify, resVerify);
    const finalDoc = await ApplicationDocument_1.ApplicationDocument.findById(digiDoc._id);
    console.log(`[Test 3.1] Final Document Verification Status: ${finalDoc?.verificationStatus}`);
    if (finalDoc?.verificationStatus !== 'VERIFIED') {
        throw new Error('Document verification status failed to update to VERIFIED');
    }
    // Test 4: Final Officer Application Approval
    console.log('[Test 4] Officer approving application case...');
    const reqApprove = {
        user: { id: officer._id.toString(), email: officer.email, role: 'Officer' },
        params: { id: app._id.toString() },
        body: {
            status: Application_1.ApplicationStatus.APPROVED,
            remarks: 'All documents verified. Benefit entitlement approved.'
        }
    };
    const resApprove = createMockRes();
    await (0, adminController_1.updateApplicationStatus)(reqApprove, resApprove);
    const finalApp = await Application_1.Application.findById(app._id);
    console.log(`[Test 4.1] Final Application Status: ${finalApp?.status}`);
    if (finalApp?.status !== Application_1.ApplicationStatus.APPROVED) {
        throw new Error('Final application approval failed');
    }
    console.log('\n✅ ALL PHASE 9 OFFICER VERIFICATION WORKSPACE TESTS PASSED SUCCESSFULLY!');
}
runPhase9OfficerTests()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('❌ Phase 9 Test Suite Failed:', err);
    process.exit(1);
});
