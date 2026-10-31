import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Building,
  FileText,
  Eye,
  Download,
  ExternalLink,
  ArrowLeft,
  Send,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Calendar,
  Layers,
  Award,
  Hash
} from 'lucide-react';

interface DocumentRecord {
  _id: string;
  docType: string;
  documentName: { en: string; ta: string };
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  source?: 'MANUAL_UPLOAD' | 'DIGILOCKER';
  sourceReference?: string;
  issuer?: string;
  issueDate?: string;
  verificationStatus: 'NOT_REVIEWED' | 'ACCEPTED' | 'CORRECTION_REQUIRED' | 'REJECTED' | 'VERIFIED';
  officerRemarks?: string;
  correctionReason?: string;
  rejectionReason?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: { name: string; email: string };
  ocrStatus?: string;
  ocrConfidence?: number;
}

const CHECKLIST_ITEMS = [
  { key: 'identityVerified', label: 'Applicant identity & personal credentials verified' },
  { key: 'personalDetailsMatch', label: 'Personal details match civil records & submitted forms' },
  { key: 'schemeEligibilityMet', label: 'Mandatory scheme eligibility conditions verified' },
  { key: 'incomeVerified', label: 'Income certificate & income threshold satisfied' },
  { key: 'residenceVerified', label: 'District and residence jurisdiction confirmed' },
  { key: 'documentsVerified', label: 'All required supporting documents verified and authentic' },
  { key: 'duplicateCheckPassed', label: 'Duplicate application & cross-scheme check passed' },
  { key: 'mandatoryCriteriaSatisfied', label: 'All mandatory statutory criteria satisfied' }
];

export const OfficerVerificationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, user } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [benefitRecord, setBenefitRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);

  // Criteria Verification State
  const [eligibilityReviews, setEligibilityReviews] = useState<Record<string, { status: string; remarks: string }>>({});
  
  // 8-Point Checklist State
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    identityVerified: false,
    personalDetailsMatch: false,
    schemeEligibilityMet: false,
    incomeVerified: false,
    residenceVerified: false,
    documentsVerified: false,
    duplicateCheckPassed: false,
    mandatoryCriteriaSatisfied: false
  });

  const [generalOfficerRemarks, setGeneralOfficerRemarks] = useState('');

  // Modals
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewRotate, setPreviewRotate] = useState<number>(0);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [previewLoading, setPreviewLoading] = useState<boolean>(true);
  const [previewError, setPreviewError] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  const handleOpenPreviewDoc = (doc: DocumentRecord) => {
    setPreviewZoom(100);
    setPreviewRotate(0);
    setPreviewPage(1);
    setPreviewLoading(true);
    setPreviewError(false);
    setPreviewDoc(doc);
  };
  const [docActionModal, setDocActionModal] = useState<{
    doc: DocumentRecord;
    action: 'VERIFIED' | 'CORRECTION_REQUIRED' | 'REJECTED';
    remarks: string;
    reason: string;
  } | null>(null);

  const [decisionModal, setDecisionModal] = useState<{
    type: 'APPROVE' | 'CORRECTION' | 'REJECT';
    remarks: string;
    affectedDocType?: string;
    affectedField?: string;
  } | null>(null);

  const [approvalBlocker, setApprovalBlocker] = useState<{
    missingDocs: string[];
    unverifiedRules: string[];
  } | null>(null);

  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/applications/${id}`);
      const app = res.data.application;
      setApplication(app);
      setDocuments(res.data.documents || []);
      setBenefitRecord(res.data.benefitRecord || null);

      if (app.eligibilityReviews) {
        setEligibilityReviews(app.eligibilityReviews);
      }
      if (app.verificationChecklist) {
        setChecklist((prev) => ({ ...prev, ...app.verificationChecklist }));
      }
      if (app.officerRemarks) {
        setGeneralOfficerRemarks(app.officerRemarks);
      }
    } catch (err) {
      console.error('Fetch application error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async () => {
    try {
      await api.put(`/admin/applications/${id}/verification`, {
        startReview: true,
        eligibilityReviews,
        verificationChecklist: checklist,
        officerRemarks: generalOfficerRemarks
      });
      fetchApplicationDetails();
    } catch (err) {
      console.error('Start review error:', err);
    }
  };

  const handleSaveProgress = async () => {
    setSavingProgress(true);
    try {
      await api.put(`/admin/applications/${id}/verification`, {
        eligibilityReviews,
        verificationChecklist: checklist,
        officerRemarks: generalOfficerRemarks
      });
      alert(isTa ? 'சரிபார்ப்பு முன்னேற்றம் சேமிக்கப்பட்டது.' : 'Verification progress saved successfully.');
    } catch (err) {
      console.error('Save progress error:', err);
      alert('Error saving verification progress.');
    } finally {
      setSavingProgress(false);
    }
  };

  const updateCriterionReview = (criterionKey: string, status: 'VERIFIED' | 'NOT_VERIFIED' | 'REQUIRES_CLARIFICATION', remarks?: string) => {
    setEligibilityReviews((prev) => ({
      ...prev,
      [criterionKey]: {
        status,
        remarks: remarks !== undefined ? remarks : prev[criterionKey]?.remarks || ''
      }
    }));
  };

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const checklistPercentage = Math.round((completedChecklistCount / CHECKLIST_ITEMS.length) * 100);

  // Document Verification
  const handleOpenDocAction = (doc: DocumentRecord, action: 'VERIFIED' | 'CORRECTION_REQUIRED' | 'REJECTED') => {
    setDocActionModal({
      doc,
      action,
      remarks: doc.officerRemarks || '',
      reason: action === 'CORRECTION_REQUIRED' ? 'Image/document unclear or expired' : 'Does not satisfy scheme guidelines'
    });
  };

  const submitDocumentAction = async () => {
    if (!docActionModal) return;
    try {
      await api.put(`/admin/applications/${id}/documents/${docActionModal.doc._id}`, {
        verificationStatus: docActionModal.action,
        officerRemarks: docActionModal.remarks,
        correctionReason: docActionModal.reason,
        rejectionReason: docActionModal.reason
      });
      if (previewDoc && previewDoc._id === docActionModal.doc._id) {
        setPreviewDoc({
          ...previewDoc,
          verificationStatus: docActionModal.action,
          officerRemarks: docActionModal.remarks
        });
      }
      setDocActionModal(null);
      fetchApplicationDetails();
    } catch (err) {
      console.error('Document verification error:', err);
      alert('Error updating document status');
    }
  };

  // Pre-approval Statutory Validation Barrier
  const handleAttemptApprove = () => {
    const rulesList: any[] = application?.schemeId?.rules?.all || [];
    const requiredDocsConfig: any[] = application?.schemeId?.requiredDocuments || [];
    const missingDocs: string[] = [];
    const unverifiedRules: string[] = [];

    // 1. Mandatory Scheme Documents check
    requiredDocsConfig.forEach((reqDoc: any) => {
      if (reqDoc.isMandatory !== false) {
        const found = documents.find((d) => d.docType === reqDoc.docType);
        if (!found) {
          missingDocs.push(`Missing Mandatory Document: ${reqDoc.name?.en || reqDoc.docType}`);
        }
      }
    });

    // 2. Uploaded documents verification check
    documents.forEach((d) => {
      if (d.verificationStatus !== 'VERIFIED' && d.verificationStatus !== 'ACCEPTED') {
        const docTitle = d.documentName?.en || d.docType;
        const currentSt = d.verificationStatus === 'CORRECTION_REQUIRED'
          ? 'Correction Requested'
          : d.verificationStatus === 'NOT_REVIEWED'
          ? 'Pending Audit'
          : d.verificationStatus.replace('_', ' ');
        missingDocs.push(`Document '${docTitle}' is ${currentSt} (Must be Verified)`);
      }
    });

    // 3. Scheme Eligibility Rules check (Do not automatically verify)
    rulesList.forEach((rule: any, idx: number) => {
      const ruleKey = rule.field || `rule_${idx}`;
      const rev = eligibilityReviews[ruleKey];
      const ruleLabel = rule.label?.en || rule.field;
      if (!rev || rev.status !== 'VERIFIED') {
        const statusText = !rev || rev.status === 'PENDING'
          ? 'Pending Review'
          : rev.status === 'NOT_VERIFIED'
          ? 'Failed / Not Met'
          : 'Requires Clarification';
        unverifiedRules.push(`Eligibility Criterion '${ruleLabel}': ${statusText}`);
      }
    });

    if (missingDocs.length > 0 || unverifiedRules.length > 0) {
      setApprovalBlocker({
        missingDocs,
        unverifiedRules
      });
      return;
    }

    setApprovalBlocker(null);
    setDecisionModal({
      type: 'APPROVE',
      remarks: generalOfficerRemarks || 'All statutory conditions and documents verified.'
    });
  };

  // Final Decision Handler
  const handleExecuteDecision = async () => {
    if (!decisionModal) return;
    setSubmittingDecision(true);
    setDecisionError(null);

    try {
      if (decisionModal.type === 'APPROVE') {
        await api.put(`/admin/applications/${id}/status`, {
          status: 'APPROVED',
          remarks: decisionModal.remarks || 'All eligibility conditions and documents verified successfully.'
        });
      } else if (decisionModal.type === 'CORRECTION') {
        if (!decisionModal.remarks.trim()) {
          setDecisionError('Correction instructions are mandatory.');
          setSubmittingDecision(false);
          return;
        }
        await api.put(`/admin/applications/${id}/status`, {
          status: 'CORRECTION_REQUIRED',
          remarks: decisionModal.remarks
        });
      } else if (decisionModal.type === 'REJECT') {
        if (!decisionModal.remarks.trim()) {
          setDecisionError('A specific rejection reason is mandatory.');
          setSubmittingDecision(false);
          return;
        }
        await api.put(`/admin/applications/${id}/status`, {
          status: 'REJECTED',
          remarks: decisionModal.remarks
        });
      }

      setDecisionModal(null);
      fetchApplicationDetails();
    } catch (err: any) {
      console.error('Execute decision error:', err);
      setDecisionError(err.response?.data?.message || 'Error processing decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'விண்ணப்பப் பரிசீலனைப் பக்கம் ஏற்றப்படுகிறது...' : 'Loading case verification workspace...'}
        </p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-bold text-slate-600">Application not found.</p>
        <button
          onClick={() => navigate('/officer/applications')}
          className="px-4 py-2 bg-[#10243A] text-white text-xs font-bold rounded-xl"
        >
          Back to Applications Queue
        </button>
      </div>
    );
  }

  const scheme = application.schemeId || {};
  const citizen = application.citizenId || {};
  const schemeName = isTa ? scheme.name?.ta || scheme.name?.en : scheme.name?.en;
  const isCompleted = application.status === 'APPROVED' || application.status === 'REJECTED';

  // Scheme rules evaluation
  const rulesList: any[] = scheme.rules?.all || [];
  const requiredDocsConfig: any[] = scheme.requiredDocuments || [];

  const verifiedDocCount = documents.filter((d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'ACCEPTED').length;
  const invalidDocCount = documents.filter((d) => d.verificationStatus === 'CORRECTION_REQUIRED' || d.verificationStatus === 'REJECTED').length;
  const pendingDocCount = documents.filter((d) => !['VERIFIED', 'ACCEPTED', 'CORRECTION_REQUIRED', 'REJECTED'].includes(d.verificationStatus)).length;
  const missingDocCount = Math.max(0, requiredDocsConfig.filter((r) => r.isMandatory !== false).length - documents.length);

  const verifiedRulesCount = rulesList.filter((r: any, idx: number) => {
    const k = r.field || `rule_${idx}`;
    return eligibilityReviews[k]?.status === 'VERIFIED';
  }).length;
  const failedRulesCount = rulesList.filter((r: any, idx: number) => {
    const k = r.field || `rule_${idx}`;
    return eligibilityReviews[k]?.status === 'NOT_VERIFIED';
  }).length;
  const pendingRulesCount = rulesList.length - verifiedRulesCount - failedRulesCount;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <PageHeader
        title={isTa ? 'அதிகாரப்பூர்வ விண்ணப்ப சரிபார்ப்பு பணித்தளம்' : 'Officer Case Verification & Approval Workspace'}
        subtitle={
          isTa
            ? `விண்ணப்ப எண்: ${application.applicationReference || application.applicationNo} | தகுதி மற்றும் ஆவணங்களை மதிப்பாய்வு செய்யவும்`
            : `Case Reference: ${application.applicationReference || application.applicationNo} | Review applicant eligibility, audit documents, and issue statutory decision`
        }
        badge={application.status}
        badgeVariant={
          application.status === 'APPROVED' ? 'teal' :
          application.status === 'REJECTED' ? 'default' :
          application.status === 'CORRECTION_REQUIRED' ? 'amber' : 'blue'
        }
        icon={ShieldCheck}
        breadcrumbs={[
          { label: isTa ? 'அலுவலர் முகப்பு' : 'Officer Workbench', href: '/officer/dashboard' },
          { label: isTa ? 'விண்ணப்ப வரிசை' : 'Application Queue', href: '/officer/applications' },
          { label: application.applicationReference || 'Case Details' }
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Link
              to="/officer/applications"
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isTa ? 'வரிசைக்கு திரும்பு' : 'Back to Queue'}</span>
            </Link>
            {!isCompleted && application.status === 'SUBMITTED' && (
              <button
                onClick={handleStartReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isTa ? 'ஆய்வைத் தொடங்கு' : 'Start Verification'}</span>
              </button>
            )}
            {!isCompleted && (
              <button
                onClick={handleSaveProgress}
                disabled={savingProgress}
                className="px-4 py-2 bg-[#10243A] hover:bg-[#1a385c] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${savingProgress ? 'animate-spin' : ''}`} />
                <span>{isTa ? 'முன்னேற்றத்தை சேமி' : 'Save Progress'}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Grid: Left Column Details & Eligibility, Right Column Documents & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ============================================================== */}
        {/* LEFT COLUMN: Overview & Eligibility Verification (7 cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: Application & Citizen Overview */}
          <div className="gov-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4 text-[#10243A]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#172B4D]">
                    {isTa ? '1. விண்ணப்பதாரர் மற்றும் மனு விவரங்கள்' : '1. Application & Citizen Overview'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {isTa ? 'விண்ணப்பதாரர் சுயவிவரம் மற்றும் அதிகார எல்லை' : 'Citizen credentials, jurisdiction, and submission timestamp'}
                  </p>
                </div>
              </div>
              <StatusBadge status={application.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Application Ref</span>
                <span className="font-mono font-bold text-[#10243A] text-xs mt-0.5 block truncate">
                  {application.applicationReference || application.applicationNo}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Citizen Name</span>
                <span className="font-bold text-[#172B4D] text-xs mt-0.5 block truncate">
                  {citizen.name || application.formData?.applicantName || 'Citizen'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Citizen ID</span>
                <span className="font-mono text-slate-700 text-xs mt-0.5 block truncate">
                  {citizen.citizenId || (citizen._id ? `TN-CIT-${String(citizen._id).slice(-6).toUpperCase()}` : 'N/A')}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Mobile Number</span>
                <span className="font-mono font-bold text-slate-700 text-xs mt-0.5 block">
                  {citizen.mobile || application.formData?.mobile || 'N/A'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Email Address</span>
                <span className="text-slate-700 text-xs mt-0.5 block truncate">
                  {citizen.email || application.formData?.email || 'N/A'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">District</span>
                <span className="font-bold text-[#10243A] text-xs mt-0.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{application.district || citizen.district || 'Madurai'}</span>
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Residential Address</span>
                <span className="text-slate-700 text-xs mt-0.5 block truncate">
                  {[citizen.addressLine1 || citizen.villageTown, citizen.taluk, citizen.district, citizen.pincode].filter(Boolean).join(', ') || application.formData?.address || 'Tamil Nadu, India'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Submitted On</span>
                <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                  {new Date(application.submittedAt || application.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Annual Income</span>
                <span className="font-bold text-emerald-800 text-xs mt-0.5 block">
                  ₹{(citizen.annualIncome || application.formData?.annualIncome || 140000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Selected Welfare Scheme Bar */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-900 tracking-wider">Applied Welfare Scheme</span>
                <h3 className="text-xs font-bold text-[#10243A] mt-0.5">{schemeName}</h3>
                <span className="text-[11px] text-slate-500 font-medium">{scheme.department?.en} • Code: {scheme.schemeCode}</span>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-300 px-3 py-1 rounded-lg">
                {scheme.benefitSummary?.en || 'Government Benefit'}
              </span>
            </div>
          </div>

          {/* SECTION 2: Scheme Eligibility Criteria Verification */}
          <div className="gov-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#172B4D]">
                    {isTa ? '2. திட்டத் தகுதி விதிகள் சரிபார்ப்பு' : '2. Scheme Eligibility Criteria Verification'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {isTa ? 'ஒவ்வொரு தகுதி நிபந்தனையையும் பயனாளி தகவலுடன் ஒப்பிட்டு ஆய்வு செய்க' : 'Compare applicant submitted parameters against statutory scheme rules'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {rulesList.length} {isTa ? 'விதிகள்' : 'Criteria Rules'}
              </span>
            </div>

            {/* Criteria Breakdown Summary Bar */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Total Criteria</span>
                <span className="font-extrabold text-[#172B4D]">{rulesList.length}</span>
              </div>
              <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 block font-bold">Verified</span>
                <span className="font-extrabold text-emerald-700">{verifiedRulesCount}</span>
              </div>
              <div className="p-2 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-800 block font-bold">Failed / Not Met</span>
                <span className="font-extrabold text-rose-700">{failedRulesCount}</span>
              </div>
              <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-800 block font-bold">Pending Review</span>
                <span className="font-extrabold text-amber-700">{pendingRulesCount}</span>
              </div>
            </div>

            {rulesList.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                No complex algorithmic rules specified. Standard residency and income criteria apply.
              </div>
            ) : (
              <div className="space-y-3">
                {rulesList.map((rule: any, idx: number) => {
                  const ruleKey = rule.field || `rule_${idx}`;
                  // Do not automatically mark criteria as verified: default to PENDING
                  const currentReview = eligibilityReviews[ruleKey] || { status: 'PENDING', remarks: '' };

                  // Attempt auto-comparison against applicant data
                  let submittedVal = application.formData?.[rule.field] || (citizen as any)[rule.field] || 'Submitted in profile';
                  if (rule.field === 'annualIncome') {
                    submittedVal = `₹${Number(submittedVal).toLocaleString('en-IN')}`;
                  }

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-[#172B4D]">
                              {isTa ? rule.label?.ta || rule.label?.en : rule.label?.en || rule.field}
                            </span>
                            {currentReview.status === 'VERIFIED' && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                Verified
                              </span>
                            )}
                            {currentReview.status === 'NOT_VERIFIED' && (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                                Failed
                              </span>
                            )}
                            {currentReview.status === 'REQUIRES_CLARIFICATION' && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                Clarification
                              </span>
                            )}
                            {currentReview.status === 'PENDING' && (
                              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-md flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>Pending Review</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Required Condition: {rule.operator} {rule.value !== undefined ? String(rule.value) : ''}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-right shrink-0">
                          <span className="text-[9px] text-slate-400 uppercase block font-bold">Applicant Value</span>
                          <span className="font-bold text-xs text-[#10243A]">{String(submittedVal)}</span>
                        </div>
                      </div>

                      {/* 3 Verification State Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-1.5 text-xs">
                          <button
                            type="button"
                            disabled={isCompleted}
                            onClick={() => updateCriterionReview(ruleKey, 'VERIFIED')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 ${
                              currentReview.status === 'VERIFIED'
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Verify</span>
                          </button>
                          <button
                            type="button"
                            disabled={isCompleted}
                            onClick={() => updateCriterionReview(ruleKey, 'REQUIRES_CLARIFICATION')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 ${
                              currentReview.status === 'REQUIRES_CLARIFICATION'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>Clarification</span>
                          </button>
                          <button
                            type="button"
                            disabled={isCompleted}
                            onClick={() => updateCriterionReview(ruleKey, 'NOT_VERIFIED')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 ${
                              currentReview.status === 'NOT_VERIFIED'
                                ? 'bg-rose-700 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            <span>Mark Failed</span>
                          </button>
                        </div>

                        {/* Officer remarks per rule */}
                        <input
                          type="text"
                          disabled={isCompleted}
                          value={currentReview.remarks || ''}
                          onChange={(e) => updateCriterionReview(ruleKey, currentReview.status as any, e.target.value)}
                          placeholder="Officer criterion notes..."
                          className="flex-1 min-w-[160px] px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#10243A]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Document Verification & Secure Viewer (5 cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-6">

          {/* SECTION 3: Document Verification */}
          <div className="gov-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 flex items-center justify-center font-bold text-xs">
                  <FileText className="w-4 h-4 text-purple-800" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#172B4D]">
                    {isTa ? '3. சான்றிதழ் & ஆவண சரிபார்ப்பு' : '3. Supporting Documents Audit'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {isTa ? 'பதிவேற்றப்பட்ட ஆவணங்களை ஆய்வு செய்து உறுதிப்படுத்துக' : 'Review authenticity, view inline preview, and record status'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {documents.length} Uploaded
              </span>
            </div>

            {/* Verification Metric Summary Bar */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">Required</span>
                <span className="font-extrabold text-[#172B4D]">{requiredDocsConfig.length || documents.length}</span>
              </div>
              <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-800 block font-bold">Verified</span>
                <span className="font-extrabold text-emerald-700">{verifiedDocCount}</span>
              </div>
              <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] text-amber-800 block font-bold">Invalid</span>
                <span className="font-extrabold text-amber-700">{invalidDocCount}</span>
              </div>
              <div className="p-2 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-800 block font-bold">Missing</span>
                <span className="font-extrabold text-rose-700">{missingDocCount}</span>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {documents.map((doc) => {
                const isVerified = doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';
                const isCorrection = doc.verificationStatus === 'CORRECTION_REQUIRED';
                const isRejected = doc.verificationStatus === 'REJECTED';

                return (
                  <div
                    key={doc._id}
                    className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-[#172B4D]">
                            {isTa ? doc.documentName?.ta || doc.docType : doc.documentName?.en || doc.docType}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-md">
                            {doc.source || 'MANUAL'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                          {doc.fileName}
                        </p>
                      </div>

                      <StatusBadge status={doc.verificationStatus} />
                    </div>

                    {/* Remarks if any */}
                    {doc.officerRemarks && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 italic">
                        "{doc.officerRemarks}"
                      </p>
                    )}

                    {/* Actions: Preview Proof, Download, Verify, Mark Invalid, Request Re-upload */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPreviewDoc(doc)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center space-x-1 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Preview Proof</span>
                        </button>
                        <a
                          href={doc.fileUrl}
                          download={doc.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-lg flex items-center space-x-1 text-[11px] border border-blue-200"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>Download</span>
                        </a>
                      </div>

                      {!isCompleted && (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDocAction(doc, 'VERIFIED')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-300 flex items-center space-x-0.5"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Verify</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDocAction(doc, 'CORRECTION_REQUIRED')}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] rounded-lg border border-amber-300 flex items-center space-x-0.5"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Request Re-upload</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDocAction(doc, 'REJECTED')}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[10px] rounded-lg border border-rose-300 flex items-center space-x-0.5"
                          >
                            <X className="w-3 h-3 text-rose-600" />
                            <span>Mark Invalid</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: 8-Point Officer Verification Checklist */}
          <div className="gov-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#172B4D]">
                    {isTa ? '4. அதிகாரி சரிபார்ப்பு சரிபார்ப்புப் பட்டியல்' : '4. Officer Verification Checklist'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {completedChecklistCount} of {CHECKLIST_ITEMS.length} checkpoints satisfied ({checklistPercentage}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 transition-all duration-300 rounded-full ${
                  checklistPercentage === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
                style={{ width: `${checklistPercentage}%` }}
              ></div>
            </div>

            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = checklist[item.key] || false;
                return (
                  <label
                    key={item.key}
                    className={`flex items-start space-x-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                      isChecked ? 'bg-emerald-50/50 border-emerald-200 text-[#172B4D]' : 'bg-slate-50/50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isCompleted}
                      checked={isChecked}
                      onChange={() => toggleChecklistItem(item.key)}
                      className="mt-0.5 w-4 h-4 text-[#10243A] rounded border-slate-300 focus:ring-[#10243A]"
                    />
                    <span className="font-medium text-[11px] leading-tight">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* SECTION 5: Final Decision Panel (Bottom Bar) */}
      {/* ============================================================== */}
      <div className="gov-card p-6 space-y-4 border-t-4 border-t-[#10243A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#172B4D] flex items-center space-x-2">
              <Award className="w-5 h-5 text-[#10243A]" />
              <span>{isTa ? '5. இறுதி தீர்மானம் மற்றும் ஆணைப் பிறப்பித்தல்' : '5. Final Statutory Decision & Sanction Panel'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTa
                ? 'அனைத்து ஆவணங்கள் மற்றும் விதிகளின் ஆய்வுக்குப் பிறகு அதிகாரப்பூர்வ முடிவை எடுக்கவும்.'
                : 'After reviewing eligibility and evidence, record the official administrative decision.'}
            </p>
          </div>

          {isCompleted && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">Decision Issued:</span>
              <StatusBadge status={application.status} />
            </div>
          )}
        </div>

        {/* General Officer Notes Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isTa ? 'அதிகாரியின் பொதுவான குறிப்புரை & பரிந்துரைகள்' : 'Reviewing Officer Remarks & Case Summary:'}
          </label>
          <textarea
            disabled={isCompleted}
            rows={2}
            value={generalOfficerRemarks}
            onChange={(e) => setGeneralOfficerRemarks(e.target.value)}
            placeholder="Enter case observations, verification notes, or sanction order references..."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10243A] focus:outline-none"
          />
        </div>

        {/* 3 Decision Action Buttons */}
        {!isCompleted ? (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                setDecisionModal({
                  type: 'REJECT',
                  remarks: ''
                })
              }
              className="w-full sm:w-auto px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <XCircle className="w-4 h-4 text-rose-200" />
              <span>{isTa ? 'விண்ணப்பத்தை நிராகரி' : 'Reject Application'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setDecisionModal({
                  type: 'CORRECTION',
                  remarks: 'Supporting document needs replacement or clarification.',
                  affectedDocType: documents[0]?.docType || 'Document'
                })
              }
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-200" />
              <span>{isTa ? 'திருத்தம் கோருக' : 'Request Corrections'}</span>
            </button>

            <button
              type="button"
              onClick={handleAttemptApprove}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isTa ? 'விண்ணப்பத்தை அங்கீகரிக்கவும்' : 'Approve Application'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800">
                {application.status === 'APPROVED' ? 'Application has been APPROVED and sanction registered.' : 'Application was REJECTED.'}
              </span>
              <p className="text-slate-500">
                Decision Remarks: "{application.officerRemarks || 'No additional remarks'}"
              </p>
            </div>
            {benefitRecord && (
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg">
                Ref: {benefitRecord.benefitReferenceNo}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: Inline Document Viewer */}
      {/* ============================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-700/20">
            {/* Header: Navy #10243A */}
            <div className="p-4 bg-[#10243A] text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-white">
                      {isTa ? (previewDoc.documentName?.ta || previewDoc.documentName?.en) : (previewDoc.documentName?.en || previewDoc.docType)}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {previewDoc.mimeType?.includes('pdf') || previewDoc.fileUrl.endsWith('.pdf') ? 'PDF DOCUMENT' : 'IMAGE / SVG'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-300">
                    <span className="font-medium text-amber-300">
                      Citizen: {application?.formData?.applicantName || 'Kavitha R'} ({application?.citizenId?._id ? `ID: ${String(application.citizenId._id).slice(-6).toUpperCase()}` : 'TN-CIT-BB7A07'})
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">
                      App: {application?.applicationReference || application?.applicationNo}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {previewDoc.fileName} • {previewDoc.fileSize ? `${Math.round(previewDoc.fileSize / 1024)} KB` : 'Verified Size'}
                    </span>
                    <span>•</span>
                    <span className="text-blue-300 font-medium">
                      Source: {previewDoc.source || 'MANUAL_UPLOAD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Close Preview (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Document Toolbar */}
            <div className="bg-slate-800 text-slate-200 px-4 py-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Zoom & View Controls */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-slate-400 font-medium mr-1 text-[11px]">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.max(50, z - 25))}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-slate-200 min-w-[42px] text-center text-xs">
                  {previewZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.min(250, z + 25))}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setPreviewZoom(100); setPreviewRotate(0); }}
                  className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-medium transition-colors"
                  title="Reset Zoom & Rotation"
                >
                  Reset
                </button>
                <div className="h-4 w-px bg-slate-600 mx-1" />
                <button
                  type="button"
                  onClick={() => setPreviewRotate((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center space-x-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Rotate</span>
                </button>
              </div>

              {/* PDF Page Controls (if PDF) */}
              {(previewDoc.fileUrl.endsWith('.pdf') || previewDoc.mimeType === 'application/pdf') && (
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
                  <span className="text-slate-400 text-[11px]">Page:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    disabled={previewPage <= 1}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-white"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-white px-1">
                    {previewPage} / 2
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewPage((p) => Math.min(2, p + 1))}
                    disabled={previewPage >= 2}
                    className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-white"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Action shortcuts */}
              <div className="flex items-center space-x-2">
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center space-x-1 text-[11px] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg flex items-center space-x-1 text-[11px] transition-colors"
                  title="Open in Full Window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Window</span>
                </a>
              </div>
            </div>

            {/* Prototype Security Watermark Strip */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 flex items-center justify-between text-[11px] text-amber-800 font-medium">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>MOCK CITIZEN DOCUMENT — NOT VALID FOR OFFICIAL GOVERNMENT USE</span>
              </span>
              <span className="text-slate-500 text-[10px] hidden sm:inline">
                Inspection Mode • TN WelfarePath Prototype
              </span>
            </div>

            {/* Main Preview Canvas */}
            <div className="flex-1 bg-slate-200/90 relative flex items-center justify-center overflow-auto min-h-[420px] max-h-[66vh] p-4">
              {/* Loading Indicator */}
              {previewLoading && (
                <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-xs flex flex-col items-center justify-center z-10 space-y-2">
                  <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-700">Loading citizen proof document...</span>
                  <span className="text-[11px] text-slate-500 font-mono">{previewDoc.fileName}</span>
                </div>
              )}

              {/* Error State with Retry */}
              {previewError ? (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-rose-200 max-w-md text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Document Preview Failed to Load</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Could not render the file content from "{previewDoc.fileUrl}". The file might be corrupted or temporarily unreachable.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setPreviewError(false); setPreviewLoading(true); setRetryKey((k) => k + 1); }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Preview</span>
                    </button>
                    <a
                      href={previewDoc.fileUrl}
                      download={previewDoc.fileName}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              ) : previewDoc.fileUrl.endsWith('.pdf') || previewDoc.mimeType === 'application/pdf' ? (
                /* PDF Preview with iframe */
                <div className="w-full h-full min-h-[500px] flex items-center justify-center">
                  <iframe
                    key={`pdf-${retryKey}-${previewPage}`}
                    src={`${previewDoc.fileUrl}#page=${previewPage}&zoom=${previewZoom}`}
                    title={previewDoc.documentName?.en || 'Document Preview'}
                    className="w-full h-[580px] border border-slate-300 rounded-xl bg-white shadow-md"
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => { setPreviewLoading(false); setPreviewError(true); }}
                  />
                </div>
              ) : (
                /* Image / SVG Preview with Zoom and Pan */
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img
                    key={`img-${retryKey}`}
                    src={previewDoc.fileUrl}
                    alt={previewDoc.documentName?.en || 'Citizen Document Proof'}
                    style={{
                      transform: `scale(${previewZoom / 100}) rotate(${previewRotate}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease'
                    }}
                    className="max-h-[560px] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-300 bg-white"
                    onLoad={() => setPreviewLoading(false)}
                    onError={() => { setPreviewLoading(false); setPreviewError(true); }}
                  />
                </div>
              )}
            </div>

            {/* Footer: Verification Actions & Status */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-slate-600 font-medium">Status:</span>
                <StatusBadge status={previewDoc.verificationStatus} />
                {previewDoc.officerRemarks && (
                  <span className="text-[11px] text-slate-500 italic max-w-xs truncate">
                    Remarks: "{previewDoc.officerRemarks}"
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Officer Direct Decision Actions inside preview modal */}
                {!isCompleted && (
                  <div className="flex items-center space-x-1.5 mr-2 pr-2 border-r border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleOpenDocAction(previewDoc, 'VERIFIED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
                      title="Verify this document after inspection"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify Proof</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDocAction(previewDoc, 'CORRECTION_REQUIRED')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-300 flex items-center space-x-1 transition-colors"
                      title="Request citizen to re-upload clear proof"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Request Re-upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDocAction(previewDoc, 'REJECTED')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-lg border border-rose-300 flex items-center space-x-1 transition-colors"
                      title="Mark document invalid"
                    >
                      <X className="w-3.5 h-3.5 text-rose-600" />
                      <span>Mark Invalid</span>
                    </button>
                  </div>
                )}

                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold rounded-lg flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Window</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 bg-[#10243A] hover:bg-[#1a385a] text-white font-bold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Single Document Action Modal */}
      {/* ============================================================== */}
      {docActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-base text-[#172B4D]">
              {docActionModal.action === 'VERIFIED' && 'Verify Document'}
              {docActionModal.action === 'CORRECTION_REQUIRED' && 'Request Document Re-upload'}
              {docActionModal.action === 'REJECTED' && 'Reject Document'}
            </h3>

            <p className="text-xs text-slate-600">
              Updating verification status for <strong>{docActionModal.doc.docType}</strong> ({docActionModal.doc.fileName}).
            </p>

            {docActionModal.action !== 'VERIFIED' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correction / Rejection Reason:</label>
                <select
                  value={docActionModal.reason}
                  onChange={(e) => setDocActionModal({ ...docActionModal, reason: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="Image/document unclear or illegible">Image/document unclear or illegible</option>
                  <option value="Document expired or invalid issue date">Document expired or invalid issue date</option>
                  <option value="Certificate number mismatch with submitted data">Certificate number mismatch with submitted data</option>
                  <option value="Wrong document category uploaded">Wrong document category uploaded</option>
                  <option value="Official seal or authority signature missing">Official seal or authority signature missing</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Officer Notes / Remarks:</label>
              <textarea
                rows={3}
                value={docActionModal.remarks}
                onChange={(e) => setDocActionModal({ ...docActionModal, remarks: e.target.value })}
                placeholder="Specific instructions for citizen..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDocActionModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDocumentAction}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs ${
                  docActionModal.action === 'VERIFIED' ? 'bg-emerald-700 hover:bg-emerald-800' :
                  docActionModal.action === 'CORRECTION_REQUIRED' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                Confirm Status Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Final Decision Confirmation (Approve / Corrections / Reject) */}
      {/* ============================================================== */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold">
              {decisionModal.type === 'APPROVE' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {decisionModal.type === 'CORRECTION' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {decisionModal.type === 'REJECT' && <XCircle className="w-5 h-5 text-rose-600" />}
              <span className="text-[#172B4D]">
                {decisionModal.type === 'APPROVE' && 'Confirm Scheme Benefit Approval'}
                {decisionModal.type === 'CORRECTION' && 'Request Application Corrections from Citizen'}
                {decisionModal.type === 'REJECT' && 'Confirm Rejection of Welfare Application'}
              </span>
            </div>

            {decisionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{decisionError}</span>
              </div>
            )}

            {decisionModal.type === 'APPROVE' && (
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to issue statutory approval for <strong>{citizen.name}</strong> under <strong>{schemeName}</strong>.
                This will release the active benefit record and notify the citizen via in-app messaging.
              </p>
            )}

            {decisionModal.type === 'CORRECTION' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Select the affected document and specify the exact modifications required from the citizen:
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Affected Document / Field:</label>
                  <select
                    value={decisionModal.affectedDocType}
                    onChange={(e) => setDecisionModal({ ...decisionModal, affectedDocType: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {documents.map((d) => (
                      <option key={d._id} value={d.docType}>{d.documentName?.en || d.docType} ({d.fileName})</option>
                    ))}
                    <option value="GENERAL_INFO">Personal / Income Information Field</option>
                  </select>
                </div>
              </div>
            )}

            {decisionModal.type === 'REJECT' && (
              <p className="text-xs text-slate-600 leading-relaxed">
                Welfare applications may only be rejected with an official statutory reason recorded in the audit trail.
                The applicant will receive your detailed rationale.
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {decisionModal.type === 'APPROVE' ? 'Sanction Order Remarks:' :
                 decisionModal.type === 'CORRECTION' ? 'Correction Instructions (Mandatory):' :
                 'Statutory Rejection Reason (Mandatory):'}
              </label>
              <textarea
                rows={3}
                value={decisionModal.remarks}
                onChange={(e) => setDecisionModal({ ...decisionModal, remarks: e.target.value })}
                placeholder={
                  decisionModal.type === 'APPROVE' ? 'Approval notes...' :
                  decisionModal.type === 'CORRECTION' ? 'e.g., The ration card image is blurred. Please upload a clear photo...' :
                  'e.g., Annual family income exceeds scheme limit of ₹2,50,000...'
                }
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#10243A] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={submittingDecision}
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleExecuteDecision}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 ${
                  decisionModal.type === 'APPROVE' ? 'bg-emerald-700 hover:bg-emerald-800' :
                  decisionModal.type === 'CORRECTION' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {submittingDecision && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {decisionModal.type === 'APPROVE' && 'Confirm & Sanction'}
                  {decisionModal.type === 'CORRECTION' && 'Send Correction Request'}
                  {decisionModal.type === 'REJECT' && 'Confirm Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Approval Blocker (Requirements Incomplete) */}
      {/* ============================================================== */}
      {approvalBlocker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 border-t-4 border-rose-600">
            <div className="flex items-center space-x-2 text-rose-800 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Approval Requirements Incomplete</span>
            </div>

            <p className="text-xs text-slate-600">
              Government welfare scheme guidelines prohibit statutory approval until all mandatory eligibility criteria and supporting documents have been verified:
            </p>

            {approvalBlocker.missingDocs.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wide block">
                  Document Requirements Pending ({approvalBlocker.missingDocs.length})
                </span>
                <ul className="list-disc list-inside text-xs text-rose-800 space-y-1">
                  {approvalBlocker.missingDocs.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {approvalBlocker.unverifiedRules.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                  Scheme Eligibility Rules Pending ({approvalBlocker.unverifiedRules.length})
                </span>
                <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                  {approvalBlocker.unverifiedRules.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovalBlocker(null)}
                className="px-5 py-2 bg-[#10243A] hover:bg-[#1a385c] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Return to Workspace & Complete Verification
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
