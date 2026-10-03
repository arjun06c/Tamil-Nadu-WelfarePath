import { connectDB } from '../../config/db';
import { User, UserRole } from '../../models/User';
import { Scheme } from '../../models/Scheme';
import { Application, ApplicationStatus } from '../../models/Application';
import { ApplicationDocument } from '../../models/ApplicationDocument';
import { DigiLockerConnection } from '../../models/DigiLockerConnection';
import { DigiLockerConsent } from '../../models/DigiLockerConsent';
import { DigiLockerDocument } from '../../models/DigiLockerDocument';
import {
  handleAssistantChat,
  getDigiLockerStatusTool,
  getDigiLockerConsentStatusTool,
  getAvailableDigiLockerDocumentsTool,
  getApplicationDocumentsTool,
  getMissingDocumentsTool
} from '../assistantController';

const createMockRes = () => {
  const res: any = {};
  res.statusCode = 200;
  res.data = null;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.data = payload;
    return res;
  };
  return res;
};

async function runPhase11AssistantTests() {
  console.log('🔄 Starting Phase 11 Welfare Assistant DigiLocker Integration Test Suite...\n');

  await connectDB();

  // 1. Create Test Citizen
  const citizen = await User.create({
    name: 'Citizen A. Murugan',
    email: `murugan_p11_${Date.now()}@example.com`,
    mobile: '9840888777',
    passwordHash: 'hashed_pass',
    role: UserRole.CITIZEN,
    district: 'Coimbatore'
  });

  // 2. Create Test Scheme
  const scheme = await Scheme.create({
    schemeCode: `TN-P11-${Date.now()}`,
    name: { en: 'Pudhumai Penn Scheme', ta: 'புதுமைப் பெண் திட்டம்' },
    department: { en: 'Social Welfare', ta: 'சமூக நலத்துறை' },
    domainKey: 'WOMEN_EMPOWERMENT',
    description: { en: 'Higher Education Assistance', ta: 'உயர் கல்வி உறுதித் திட்டம்' },
    benefitSummary: { en: '₹1000 Monthly DBT', ta: 'மாதம் ₹1000' },
    rules: { all: [] },
    requiredDocuments: [
      { docType: 'IncomeCertificate', label: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' }, isMandatory: true },
      { docType: 'CommunityCertificate', label: { en: 'Community Certificate', ta: 'சாதிச் சான்றிதழ்' }, isMandatory: true }
    ],
    applicationMethods: [
      {
        methodType: 'PLATFORM_ASSISTED',
        title: { en: 'Online', ta: 'ஆன்லைன்' },
        instructions: { en: 'Portal', ta: 'இணையதளம்' },
        responsibleOffice: { en: 'Social Welfare Office', ta: 'சமூக நல அலுவலகம்' }
      }
    ]
  });

  // 3. Create DigiLocker Connection, Consent, and DigiLocker Document Records
  await DigiLockerConnection.create({
    userId: citizen._id,
    environment: 'MOCK',
    status: 'CONNECTED',
    scopes: ['doc_type'],
    connectedAt: new Date()
  });

  await DigiLockerConsent.create({
    userId: citizen._id,
    purpose: 'Welfare document attachment',
    requestedScopes: ['doc_type'],
    grantedScopes: ['doc_type'],
    consentReference: `REF-P11-${Date.now()}`,
    status: 'ACTIVE'
  });

  await DigiLockerDocument.create({
    userId: citizen._id,
    source: 'DIGILOCKER',
    documentReference: 'in.gov.tn.edistrict.inc:2026-P11',
    documentType: 'IncomeCertificate',
    name: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' },
    issuer: 'Revenue Department, Govt of Tamil Nadu',
    mimeType: 'application/pdf',
    status: 'AVAILABLE'
  });

  // 4. Create Application with 1 attached doc (IncomeCertificate) and missing 1 doc (CommunityCertificate)
  const app = await Application.create({
    applicationNo: `TNP-WP-2026-AST-${Math.floor(100000 + Math.random() * 900000)}`,
    applicationReference: `TNP-WP-2026-AST-${Math.floor(100000 + Math.random() * 900000)}`,
    citizenId: citizen._id,
    schemeId: scheme._id,
    status: ApplicationStatus.DOC_VERIFICATION,
    currentStep: 6,
    completionPercentage: 80
  });

  await ApplicationDocument.create({
    applicationId: app._id,
    citizenId: citizen._id,
    docType: 'IncomeCertificate',
    documentName: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' },
    fileName: 'Income_DigiLocker.pdf',
    fileUrl: 'https://digilocker.example.com/doc/p11',
    source: 'DIGILOCKER',
    issuer: 'Revenue Department, Govt of Tamil Nadu',
    retrievedAt: new Date(),
    uploadStatus: 'RETRIEVED',
    verificationStatus: 'NOT_REVIEWED',
    uploadedAt: new Date()
  });

  // Test 1: Controlled Helper Tools Integration
  console.log('[Test 1] Testing controlled helper tools for Assistant...');
  const dlStatus = await getDigiLockerStatusTool(citizen._id.toString());
  console.log(`[Test 1.1] DigiLocker Status Tool -> Connected: ${dlStatus.connected}, Badge: "${dlStatus.badgeLabel}"`);
  if (!dlStatus.connected) throw new Error('DigiLocker status tool failed');

  const consentStatus = await getDigiLockerConsentStatusTool(citizen._id.toString());
  console.log(`[Test 1.2] Consent Status Tool -> HasActiveConsent: ${consentStatus.hasActiveConsent}`);
  if (!consentStatus.hasActiveConsent) throw new Error('Consent status tool failed');

  const dlDocs = await getAvailableDigiLockerDocumentsTool(citizen._id.toString());
  console.log(`[Test 1.3] Available Docs Count: ${dlDocs.length}, Doc Type: ${dlDocs[0].documentType}`);
  if (dlDocs.length < 1) throw new Error('Available docs tool failed');

  const missingInfo = await getMissingDocumentsTool(citizen._id.toString(), app._id.toString());
  console.log(`[Test 1.4] Missing Docs Count: ${missingInfo.missing.length}, Missing Type: ${missingInfo.missing[0]?.docType}`);
  if (missingInfo.missing.length !== 1 || missingInfo.missing[0].docType !== 'CommunityCertificate') {
    throw new Error('Missing documents calculation tool failed');
  }

  // Test 2: Assistant Chat - DigiLocker Status Intent (English)
  console.log('[Test 2] Testing Assistant chat for DigiLocker status query in English...');
  const req2: any = {
    user: { id: citizen._id.toString() },
    body: { message: 'Is my DigiLocker connected?', lang: 'en' }
  };
  const res2 = createMockRes();
  await handleAssistantChat(req2, res2);

  console.log(`[Test 2.1] Reply: "${res2.data.reply}"`);
  if (!res2.data.reply.includes('connected') || res2.data.actionButtons.length === 0) {
    throw new Error('DigiLocker status prompt response failed');
  }

  // Test 3: Assistant Chat - DigiLocker Status Intent (Tamil)
  console.log('[Test 3] Testing Assistant chat for DigiLocker status query in Tamil...');
  const req3: any = {
    user: { id: citizen._id.toString() },
    body: { message: 'என் டிஜிலாக்கர் கணக்கு இணைக்கப்பட்டுள்ளதா?', lang: 'ta' }
  };
  const res3 = createMockRes();
  await handleAssistantChat(req3, res3);

  console.log(`[Test 3.1] Tamil Reply: "${res3.data.reply}"`);
  if (!res3.data.reply.includes('இணைக்கப்பட்டுள்ளது') || res3.data.lang !== 'ta') {
    throw new Error('Tamil DigiLocker status response failed');
  }

  // Test 4: Assistant Chat - Missing Documents Query
  console.log('[Test 4] Testing Assistant chat for missing application documents query...');
  const req4: any = {
    user: { id: citizen._id.toString() },
    body: { message: 'What documents are missing for my application?', lang: 'en' }
  };
  const res4 = createMockRes();
  await handleAssistantChat(req4, res4);

  console.log(`[Test 4.1] Reply: "${res4.data.reply}"`);
  if (!res4.data.reply.includes('Community Certificate') && !res4.data.reply.includes('CommunityCertificate')) {
    throw new Error('Missing document prompt response failed');
  }

  // Test 5: Assistant Chat - Verification Status Explanation
  console.log('[Test 5] Testing Assistant chat for document verification status explanation...');
  const req5: any = {
    user: { id: citizen._id.toString() },
    body: { message: 'Is my document verified by the officer?', lang: 'en' }
  };
  const res5 = createMockRes();
  await handleAssistantChat(req5, res5);

  console.log(`[Test 5.1] Reply: "${res5.data.reply}"`);
  if (!res5.data.reply.includes('Pending Officer Review') && !res5.data.reply.includes('DigiLocker retrieval')) {
    throw new Error('Verification status explanation response failed');
  }

  console.log('\n✅ ALL PHASE 11 WELFARE ASSISTANT INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runPhase11AssistantTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Phase 11 Test Suite Failed:', err);
    process.exit(1);
  });
