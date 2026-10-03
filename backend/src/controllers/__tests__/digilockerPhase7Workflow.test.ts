import { connectDB } from '../../config/db';
import { User, UserRole } from '../../models/User';
import { Scheme } from '../../models/Scheme';
import { Application, ApplicationStatus } from '../../models/Application';
import { ApplicationDocument } from '../../models/ApplicationDocument';
import { DigiLockerDocument } from '../../models/DigiLockerDocument';
import { submitApplication, resubmitCorrection } from '../applicationController';
import { attachDigiLockerDocumentToApplication } from '../digilockerController';

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

async function runPhase7WorkflowTests() {
  console.log('🔄 Starting Phase 7 DigiLocker Application Document Workflow Test Suite...\n');

  await connectDB();

  // Create Test Citizen
  const citizen = await User.create({
    name: 'Workflow Citizen',
    email: `wf_${Date.now()}@tn.gov.in`,
    mobile: '9876543210',
    passwordHash: 'hashed_password',
    role: UserRole.CITIZEN,
    district: 'Trichy'
  });

  // Create Test Scheme with Mixed Document Source Requirements
  const scheme = await Scheme.create({
    schemeCode: `TN-SCH-WF-${Date.now()}`,
    name: { en: 'Moovalur Ramamirtham Ammaiyar Scheme', ta: 'மூவலூர் இராமாமிர்தம் அம்மையார் திட்டம்' },
    department: { en: 'Social Welfare', ta: 'சமூக நலத்துறை' },
    domainKey: 'WOMEN_EMPOWERMENT',
    description: { en: 'Higher Education Assurance', ta: 'உயர் கல்வி உறுதித் திட்டம்' },
    benefitSummary: { en: '₹1000 Monthly DBT', ta: 'மாதம் ₹1000' },
    rules: { all: [] },
    requiredDocuments: [
      {
        docType: 'IncomeCertificate',
        isMandatory: true,
        label: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' },
        sources: ['DIGILOCKER', 'MANUAL_UPLOAD']
      },
      {
        docType: 'CommunityCertificate',
        isMandatory: true,
        label: { en: 'Community Certificate', ta: 'சாதி சான்றிதழ்' },
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

  // Test 1: Mixed-Source Application Submission (DigiLocker + Manual Upload)
  console.log('[Test 1] Submitting Application with Mixed Document Sources...');

  const mixedDocs = [
    {
      docType: 'IncomeCertificate',
      fileName: 'IncomeCertificate.pdf',
      fileUrl: 'https://via.placeholder.com/800x1100.png?text=DigiLocker+Income',
      source: 'DIGILOCKER',
      sourceReference: 'in.gov.tn.edistrict.inc:2026-981023',
      issuer: 'Revenue & Disaster Management Department, Govt of Tamil Nadu',
      issueDate: '2025-05-12',
      retrievedAt: new Date()
    },
    {
      docType: 'CommunityCertificate',
      fileName: 'CommunityCert_Scan.jpg',
      fileUrl: 'https://via.placeholder.com/800x1100.png?text=Manual+Community',
      source: 'MANUAL_UPLOAD',
      ocrConfidence: 88,
      ocrText: 'COMMUNITY CERTIFICATE SCAN:\nCategory: BC\nDistrict: Trichy'
    }
  ];

  const req1: any = {
    user: { id: citizen._id.toString(), email: citizen.email },
    body: {
      schemeId: scheme._id.toString(),
      formData: { applicantName: citizen.name, district: citizen.district },
      documents: mixedDocs,
      declarationAccepted: true
    }
  };

  const res1 = createMockRes();
  await submitApplication(req1, res1);

  console.log(`[Test 1] Application Submitted Ref: ${res1.data.applicationReference}`);
  if (!res1.data.applicationReference) throw new Error('Application submission failed');

  const appRecord = await Application.findById(res1.data.application._id);
  const appDocs = await ApplicationDocument.find({ applicationId: appRecord!._id });

  console.log(`[Test 1.1] Total Application Documents Attached: ${appDocs.length}`);
  if (appDocs.length !== 2) throw new Error('Expected 2 attached application documents');

  const dlAppDoc = appDocs.find((d) => d.docType === 'IncomeCertificate');
  const manualAppDoc = appDocs.find((d) => d.docType === 'CommunityCertificate');

  // Test 2: Verify Source Metadata & Verification Status Distinction
  console.log(`[Test 2] Verifying DigiLocker Document Provenance & Verification Status...`);
  console.log(`[Test 2.1] DigiLocker Doc -> Source: ${dlAppDoc?.source}, VerificationStatus: ${dlAppDoc?.verificationStatus}, Issuer: ${dlAppDoc?.issuer}`);

  if (dlAppDoc?.source !== 'DIGILOCKER' || dlAppDoc?.verificationStatus !== 'NOT_REVIEWED') {
    throw new Error('DigiLocker document source provenance or verification status failed distinction test!');
  }

  console.log(`[Test 2.2] Manual Doc -> Source: ${manualAppDoc?.source}, OCR Confidence: ${manualAppDoc?.ocrConfidence}%`);
  if (manualAppDoc?.source !== 'MANUAL_UPLOAD') {
    throw new Error('Manual document source failed check');
  }

  // Test 3: Document Replacement Workflow on CORRECTION_REQUIRED
  console.log('[Test 3] Testing Targeted Document Replacement Workflow...');
  appRecord!.status = ApplicationStatus.CORRECTION_REQUIRED;
  appRecord!.officerRemarks = 'Community certificate copy is blurry. Please provide a clear replacement.';
  await appRecord!.save();

  const req3: any = {
    user: { id: citizen._id.toString(), email: citizen.email },
    params: { id: appRecord!._id.toString() },
    body: {
      replacementDoc: {
        docType: 'CommunityCertificate',
        fileName: 'CommunityCert_Clear_Scan.pdf',
        fileUrl: 'https://via.placeholder.com/800x1100.png?text=Replacement+Community+Scan',
        ocrConfidence: 96
      }
    }
  };

  const res3 = createMockRes();
  await resubmitCorrection(req3, res3);

  console.log(`[Test 3] Resubmission Result Status: ${res3.data.application.status}`);
  if (res3.data.application.status !== ApplicationStatus.DOC_VERIFICATION) {
    throw new Error('Correction resubmission failed to transition status back to DOC_VERIFICATION');
  }

  const updatedDoc = await ApplicationDocument.findOne({ applicationId: appRecord!._id, docType: 'CommunityCertificate' });
  console.log(`[Test 3.1] Updated Replacement File: ${updatedDoc?.fileName}, VerificationStatus: ${updatedDoc?.verificationStatus}`);
  if (updatedDoc?.fileName !== 'CommunityCert_Clear_Scan.pdf' || updatedDoc?.verificationStatus !== 'NOT_REVIEWED') {
    throw new Error('Replacement document failed update check');
  }

  console.log('\n✅ ALL PHASE 7 WORKFLOW INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runPhase7WorkflowTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Phase 7 Test Suite Failed:', err);
    process.exit(1);
  });
