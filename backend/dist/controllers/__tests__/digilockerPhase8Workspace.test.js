"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../config/db");
const User_1 = require("../../models/User");
const Scheme_1 = require("../../models/Scheme");
const Application_1 = require("../../models/Application");
const ApplicationDocument_1 = require("../../models/ApplicationDocument");
const applicationController_1 = require("../applicationController");
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
async function runPhase8WorkspaceTests() {
    console.log('🔄 Starting Phase 8 Citizen Document Workspace Integration Test Suite...\n');
    await (0, db_1.connectDB)();
    // 1. Create Test Citizen
    const citizen = await User_1.User.create({
        name: 'Phase 8 Citizen',
        email: `p8_citizen_${Date.now()}@example.com`,
        mobile: '9876543210',
        passwordHash: 'hashed_password',
        role: User_1.UserRole.CITIZEN,
        district: 'Chennai'
    });
    // 2. Create Test Scheme
    const scheme = await Scheme_1.Scheme.create({
        schemeCode: `SCH-P8-${Date.now()}`,
        name: { en: 'Moovalur Ramamirtham Scheme', ta: 'மூவலூர் இராமாமிர்தம் அம்மையார் திட்டம்' },
        department: { en: 'Social Welfare', ta: 'சமூக நலத்துறை' },
        domainKey: 'WOMEN_EMPOWERMENT',
        description: { en: 'Higher Education Assistance', ta: 'உயர் கல்வி உறுதித் திட்டம்' },
        benefitSummary: { en: '₹1000 Monthly DBT', ta: 'மாதம் ₹1000' },
        rules: { all: [] },
        requiredDocuments: [
            { docType: 'IncomeCertificate', label: { en: 'Income Cert', ta: 'வருமான சான்றிதழ்' }, isMandatory: true }
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
    // 3. Create Application
    const app = await Application_1.Application.create({
        applicationNo: `TNP-WP-2026-P8-${Math.floor(100000 + Math.random() * 900000)}`,
        applicationReference: `TNP-WP-2026-P8-${Math.floor(100000 + Math.random() * 900000)}`,
        citizenId: citizen._id,
        schemeId: scheme._id,
        status: Application_1.ApplicationStatus.CORRECTION_REQUIRED,
        currentStep: 6,
        completionPercentage: 100
    });
    // 4. Create Application Documents (DigiLocker & Manual)
    const doc1 = await ApplicationDocument_1.ApplicationDocument.create({
        applicationId: app._id,
        citizenId: citizen._id,
        docType: 'IncomeCertificate',
        documentName: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' },
        fileName: 'Income_DigiLocker.pdf',
        fileUrl: 'https://digilocker.example.com/doc/1',
        source: 'DIGILOCKER',
        issuer: 'Revenue Department, Govt of Tamil Nadu',
        retrievedAt: new Date(),
        uploadStatus: 'RETRIEVED',
        verificationStatus: 'NOT_REVIEWED',
        uploadedAt: new Date()
    });
    const doc2 = await ApplicationDocument_1.ApplicationDocument.create({
        applicationId: app._id,
        citizenId: citizen._id,
        docType: 'CommunityCertificate',
        documentName: { en: 'Community Certificate', ta: 'சாதிச் சான்றிதழ்' },
        fileName: 'Community_Scan.jpg',
        fileUrl: 'https://welfarepath.example.com/uploads/comm.jpg',
        source: 'MANUAL_UPLOAD',
        ocrConfidence: 92,
        uploadStatus: 'UPLOADED',
        verificationStatus: 'CORRECTION_REQUIRED',
        officerRemarks: 'Document scan blurry, please provide a clear digital copy.',
        uploadedAt: new Date()
    });
    // 5. Test getMyDocuments Controller
    console.log('[Test 1] Fetching unified citizen documents via getMyDocuments API...');
    const req1 = { user: { id: citizen._id.toString() } };
    const res1 = createMockRes();
    await (0, applicationController_1.getMyDocuments)(req1, res1);
    if (res1.statusCode !== 200 || !res1.data?.documents) {
        throw new Error('getMyDocuments API failed or returned empty payload');
    }
    const docs = res1.data.documents;
    console.log(`[Test 1.1] Total Unified Documents Retrieved: ${docs.length}`);
    if (docs.length !== 2)
        throw new Error(`Expected 2 documents, got ${docs.length}`);
    const dlDoc = docs.find((d) => d.source === 'DIGILOCKER');
    console.log(`[Test 1.2] DigiLocker Doc -> Source: ${dlDoc.source}, Issuer: ${dlDoc.issuer}, VerificationStatus: ${dlDoc.verificationStatus}`);
    if (dlDoc.source !== 'DIGILOCKER' || dlDoc.verificationStatus !== 'NOT_REVIEWED') {
        throw new Error('DigiLocker document source provenance check failed');
    }
    const manualDoc = docs.find((d) => d.source === 'MANUAL_UPLOAD');
    console.log(`[Test 1.3] Manual Doc -> Source: ${manualDoc.source}, Correction Remark: "${manualDoc.officerRemarks}"`);
    if (manualDoc.verificationStatus !== 'CORRECTION_REQUIRED' || !manualDoc.officerRemarks) {
        throw new Error('Manual document correction status check failed');
    }
    // 6. Test Document Replacement Flow via resubmitCorrection
    console.log('[Test 2] Executing document replacement for correction-required document...');
    const req2 = {
        user: { id: citizen._id.toString() },
        params: { id: app._id.toString() },
        body: {
            replacementDoc: {
                docType: 'CommunityCertificate',
                fileName: 'Community_DigiLocker_Replacement.pdf',
                fileUrl: 'https://digilocker.example.com/doc/community_replaced',
                source: 'DIGILOCKER',
                sourceReference: 'in.gov.tn.edistrict.comm:2026-999',
                issuer: 'Revenue & Disaster Management Department',
                retrievedAt: new Date()
            }
        }
    };
    const res2 = createMockRes();
    await (0, applicationController_1.resubmitCorrection)(req2, res2);
    console.log(`[Test 2.1] Application Status After Replacement: ${res2.data.application.status}`);
    if (res2.data.application.status !== Application_1.ApplicationStatus.DOC_VERIFICATION) {
        throw new Error('Application status failed to update to DOC_VERIFICATION');
    }
    const replacedDoc = await ApplicationDocument_1.ApplicationDocument.findOne({ applicationId: app._id, docType: 'CommunityCertificate' });
    console.log(`[Test 2.2] Replaced Doc -> Source: ${replacedDoc?.source}, File: ${replacedDoc?.fileName}, VerificationStatus: ${replacedDoc?.verificationStatus}`);
    if (replacedDoc?.source !== 'DIGILOCKER' || replacedDoc?.verificationStatus !== 'NOT_REVIEWED') {
        throw new Error('Replacement document failed to update source to DIGILOCKER or reset verification status');
    }
    console.log('\n✅ ALL PHASE 8 WORKSPACE INTEGRATION TESTS PASSED SUCCESSFULLY!');
}
runPhase8WorkspaceTests()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('❌ Phase 8 Test Suite Failed:', err);
    process.exit(1);
});
