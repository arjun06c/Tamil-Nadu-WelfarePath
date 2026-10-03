import { connectDB } from '../../config/db';
import { User, UserRole } from '../../models/User';
import { CitizenProfile } from '../../models/CitizenProfile';
import { Scheme } from '../../models/Scheme';
import { Application, ApplicationStatus } from '../../models/Application';
import { ApplicationDocument } from '../../models/ApplicationDocument';
import { AuditLog } from '../../models/AuditLog';
import { evaluateSchemeEligibility } from '../../services/eligibilityService';
import { updateDocumentVerificationStatus } from '../adminController';

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

async function runPhase12EnhancementTests() {
  console.log('🔄 Starting Post-Phase-12 Final Enhancement Integration Test Suite...\n');

  await connectDB();

  // 1. Create Test Citizen & Citizen Profile with Profile Income = ₹2,00,000
  const citizenA = await User.create({
    name: 'M. Kausalya',
    email: `kausalya_p12_${Date.now()}@example.com`,
    mobile: '9840998877',
    passwordHash: 'hashed_pass',
    role: UserRole.CITIZEN,
    district: 'Coimbatore'
  });

  const citizenProfileA = await CitizenProfile.create({
    userId: citizenA._id,
    dob: new Date('1998-05-12'),
    gender: 'Female',
    district: 'Coimbatore',
    annualIncome: 200000,
    socialCategory: 'BC'
  });

  const officer = await User.create({
    name: 'District Officer S. Raman',
    email: `officer_p12_${Date.now()}@tn.gov.in`,
    mobile: '9840112233',
    passwordHash: 'hashed_pass',
    role: UserRole.OFFICER,
    district: 'Coimbatore'
  });

  // 2. Create Scheme with Income <= ₹1,50,000 criterion
  const scheme = await Scheme.create({
    schemeCode: `TN-P12-${Date.now()}`,
    name: { en: 'Pudhumai Penn Scheme', ta: 'புதுமைப் பெண் திட்டம்' },
    department: { en: 'Social Welfare Department', ta: 'சமூக நலத்துறை' },
    domainKey: 'WOMEN_EMPOWERMENT',
    description: { en: 'Financial Assistance for Higher Education', ta: 'உயர் கல்வி உதவித்தொகை' },
    benefitSummary: { en: '₹1,000 / month', ta: 'மாதம் ₹1,000' },
    rules: {
      all: [
        { field: 'annualIncome', operator: 'less_than_or_equal', value: 150000 }
      ]
    },
    requiredDocuments: [
      { docType: 'IncomeCertificate', label: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' }, isMandatory: true }
    ],
    applicationMethods: [
      {
        methodType: 'PLATFORM_ASSISTED',
        title: { en: 'Online Portal', ta: 'இணையதளம்' },
        instructions: { en: 'Portal', ta: 'இணையதளம்' },
        responsibleOffice: { en: 'District Social Welfare Office', ta: 'மாவட்ட சமூக நல அலுவலகம்' }
      }
    ]
  });

  // Test 1: Rule evaluation WITHOUT document facts (Profile income = ₹2,00,000 vs limit ₹1,50,000 => NEAR_ELIGIBLE gap analysis)
  console.log('[Test 1] Rule evaluation using Citizen Profile data only...');
  const resProfileOnly = evaluateSchemeEligibility(scheme, citizenProfileA);
  console.log(`[Test 1 Outcome] Profile-only eligibility status: ${resProfileOnly.status}`);
  if (resProfileOnly.status !== 'NEAR_ELIGIBLE') {
    throw new Error('Test 1 failed: Expected NEAR_ELIGIBLE based on gap analysis for profile income ₹2,00,000');
  }
  console.log('✅ Test 1 Passed.\n');

  // 3. Attach DigiLocker Income Certificate with extracted income = ₹1,20,000 (Pending Officer Verification)
  const app = await Application.create({
    applicationNo: `TNP-WP-2026-P12-${Math.floor(100000 + Math.random() * 900000)}`,
    applicationReference: `TNP-WP-2026-P12-${Math.floor(100000 + Math.random() * 900000)}`,
    citizenId: citizenA._id,
    schemeId: scheme._id,
    status: ApplicationStatus.DOC_VERIFICATION,
    currentStep: 6,
    completionPercentage: 100
  });

  const doc = await ApplicationDocument.create({
    applicationId: app._id,
    citizenId: citizenA._id,
    docType: 'IncomeCertificate',
    documentName: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' },
    fileName: 'Income_Certificate_DigiLocker.pdf',
    fileUrl: 'https://digilocker.example.com/doc/inc_120',
    source: 'DIGILOCKER',
    sourceReference: 'in.gov.tn.edistrict.inc:2026-120',
    issuer: 'Revenue & Disaster Management Dept, Govt of Tamil Nadu',
    retrievedAt: new Date(),
    uploadStatus: 'RETRIEVED',
    verificationStatus: 'NOT_REVIEWED',
    extractedData: {
      annualFamilyIncome: 120000,
      certificateNumber: 'TN-2026-981023',
      issuedYear: '2025-2026'
    },
    uploadedAt: new Date()
  });

  // Test 2: Rule evaluation with PRELIMINARY document fact (Income = ₹1,20,000) & Data Conflict Detection
  console.log('[Test 2] Rule evaluation with Preliminary document fact & Conflict Detection...');
  const docContextPreliminary = {
    confirmedFacts: { annualIncome: 120000 },
    verifiedFacts: {},
    attachedDocTypes: ['IncomeCertificate']
  };
  const resPreliminary = evaluateSchemeEligibility(scheme, citizenProfileA, ['IncomeCertificate'], docContextPreliminary);
  console.log(`[Test 2 Outcome] Preliminary Status: ${resPreliminary.status}, IsPreliminaryMatch: ${resPreliminary.isPreliminaryMatch}, Conflicts: ${resPreliminary.conflictDetails?.length}`);
  if (resPreliminary.status !== 'ELIGIBLE' || !resPreliminary.isPreliminaryMatch) {
    throw new Error('Test 2 failed: Expected ELIGIBLE status with isPreliminaryMatch=true');
  }
  if (!resPreliminary.conflictDetails || resPreliminary.conflictDetails.length === 0) {
    throw new Error('Test 2 failed: Expected conflict warning between profile income ₹2,00,000 and document income ₹1,20,000');
  }
  console.log('✅ Test 2 Passed.\n');

  // Test 3: Officer Document Verification Workflow
  console.log('[Test 3] Officer verifies Income Certificate...');
  const appIdStr = (app as any)._id.toString();
  const docIdStr = (doc as any)._id.toString();
  const officerIdStr = (officer as any)._id.toString();

  const reqVerify: any = {
    user: { id: officerIdStr, role: UserRole.OFFICER, email: officer.email },
    params: { id: appIdStr, docId: docIdStr },
    body: {
      verificationStatus: 'VERIFIED',
      officerRemarks: 'Certificate valid. Income verified as ₹1,20,000.'
    }
  };
  const resVerify = createMockRes();
  await updateDocumentVerificationStatus(reqVerify, resVerify);

  if (resVerify.statusCode !== 200) {
    throw new Error(`Test 3 failed: Expected 200 from officer verification, got ${resVerify.statusCode}`);
  }
  const updatedDoc = await ApplicationDocument.findById(docIdStr);
  console.log(`[Test 3 Outcome] Verification Status: ${updatedDoc?.verificationStatus}, VerifiedBy: ${updatedDoc?.verifiedBy}`);
  if (updatedDoc?.verificationStatus !== 'VERIFIED') {
    throw new Error('Test 3 failed: Document verificationStatus was not set to VERIFIED');
  }

  // Audit Log Verification
  const audit = await AuditLog.findOne({ targetId: docIdStr });
  if (!audit) {
    throw new Error('Test 3 failed: AuditLog for document verification was not created');
  }
  console.log('✅ Test 3 Passed.\n');

  // Test 4: Re-evaluate Scheme Eligibility after Officer Verification
  console.log('[Test 4] Re-evaluating eligibility after official document verification...');
  const docContextVerified = {
    confirmedFacts: { annualIncome: 120000 },
    verifiedFacts: { annualIncome: 120000 },
    attachedDocTypes: ['IncomeCertificate']
  };
  const resVerified = evaluateSchemeEligibility(scheme, citizenProfileA, ['IncomeCertificate'], docContextVerified);
  console.log(`[Test 4 Outcome] Verified Match Status: ${resVerified.status}, IsVerifiedMatch: ${resVerified.isVerifiedMatch}`);
  if (resVerified.status !== 'ELIGIBLE' || !resVerified.isVerifiedMatch) {
    throw new Error('Test 4 failed: Expected ELIGIBLE with isVerifiedMatch=true');
  }
  console.log('✅ Test 4 Passed.\n');

  // Test 5: Security Check — Citizen B cannot alter Citizen A documents
  console.log('[Test 5] Security Isolation Check...');
  const citizenB = await User.create({
    name: 'Citizen B. Suresh',
    email: `suresh_p12_${Date.now()}@example.com`,
    mobile: '9840991122',
    passwordHash: 'hashed_pass',
    role: UserRole.CITIZEN,
    district: 'Madurai'
  });

  const reqUnauthorized: any = {
    user: { id: (citizenB as any)._id.toString(), role: UserRole.CITIZEN },
    params: { id: appIdStr, docId: docIdStr },
    body: { verificationStatus: 'VERIFIED' }
  };
  const resUnauthorized = createMockRes();
  await updateDocumentVerificationStatus(reqUnauthorized, resUnauthorized);
  if (resUnauthorized.statusCode !== 403) {
    throw new Error(`Test 5 failed: Citizen B marking Citizen A document returned ${resUnauthorized.statusCode} instead of 403`);
  }
  console.log('✅ Test 5 Passed (Citizens cannot mark documents as verified or access other users documents).\n');

  console.log('🎉 ALL POST-PHASE-12 FINAL ENHANCEMENT TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runPhase12EnhancementTests().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
