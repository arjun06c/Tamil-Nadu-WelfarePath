import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ApplicationTimeline } from '../components/ApplicationTimeline';
import {
  FileCheck,
  Shield,
  Clock,
  Award,
  FileText,
  AlertTriangle,
  FileUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  XCircle,
  ShieldCheck,
  UserCheck,
  X,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';
import { type AvailableDocument } from '../components/digilocker/DigiLockerDocumentPicker';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';

export const ApplicationTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Correction Modal / Workflow states
  const [activeCorrectionDoc, setActiveCorrectionDoc] = useState<any>(null);
  const [correctionMode, setCorrectionMode] = useState<'CHOICE' | 'UPLOAD' | 'DIGILOCKER'>('CHOICE');
  const [replacementFile, setReplacementFile] = useState<any>(null);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // DigiLocker options state for correction
  const [availableDigiDocs, setAvailableDigiDocs] = useState<AvailableDocument[]>([]);
  const [loadingDigiDocs, setLoadingDigiDocs] = useState(false);

  // Collapsible metadata toggle per doc
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const { lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Fetch application error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (docId: string) => {
    setExpandedDetails((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleOpenCorrection = async (doc: any) => {
    setActiveCorrectionDoc(doc);
    setCorrectionMode('CHOICE');
    setReplacementFile(null);

    setLoadingDigiDocs(true);
    try {
      const dlRes = await api.get('/integrations/digilocker/documents');
      setAvailableDigiDocs(dlRes.data.documents || []);
    } catch (err) {
      console.error('Fetch digilocker docs error:', err);
    } finally {
      setLoadingDigiDocs(false);
    }
  };

  const handleCorrectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReplacementFile({
      file,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date()
    });
  };

  const handleResubmitManualUpload = async () => {
    if (!replacementFile || !activeCorrectionDoc) return;
    setSubmittingCorrection(true);
    try {
      let serverFileUrl = replacementFile.fileUrl;
      if (replacementFile.file) {
        try {
          const formData = new FormData();
          formData.append('file', replacementFile.file);
          const uploadRes = await api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.fileUrl) {
            serverFileUrl = uploadRes.data.fileUrl;
          }
        } catch (uploadErr) {
          console.warn('Fallback to local file URL:', uploadErr);
        }
      }

      await api.post(`/applications/${id}/correction`, {
        replacementDoc: {
          docType: activeCorrectionDoc.docType,
          fileName: replacementFile.fileName,
          fileUrl: serverFileUrl,
          source: 'MANUAL_UPLOAD',
          ocrConfidence: 90
        }
      });
      setActiveCorrectionDoc(null);
      await fetchApplicationDetails();
    } catch (err: any) {
      console.error('Correction submit error:', err);
      alert(err.response?.data?.message || 'Error submitting replacement document.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleResubmitDigiLocker = async (dlDoc: AvailableDocument) => {
    if (!activeCorrectionDoc) return;
    setSubmittingCorrection(true);
    try {
      await api.post(`/applications/${id}/documents/from-digilocker`, {
        digilockerDocumentId: dlDoc.id,
        docType: activeCorrectionDoc.docType
      });
      setActiveCorrectionDoc(null);
      await fetchApplicationDetails();
    } catch (err: any) {
      console.error('DigiLocker correction error:', err);
      alert(err.response?.data?.message || 'Error attaching replacement DigiLocker document.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'விண்ணப்ப காலவரிசை ஏற்றப்படுகிறது...' : 'Loading application journey timeline...'}
        </p>
      </div>
    );
  }

  if (!data || !data.application) {
    return (
      <div className="py-20 text-center space-y-3 text-xs text-slate-500">
        <p>{isTa ? 'விண்ணப்பம் கிடைக்கவில்லை.' : 'Application record not found.'}</p>
        <button
          onClick={() => navigate('/citizen/applications')}
          className="px-4 py-2 bg-[#10243A] text-white rounded-xl text-xs font-bold"
        >
          {isTa ? 'விண்ணப்பங்களுக்குத் திரும்பு' : 'Back to My Applications'}
        </button>
      </div>
    );
  }

  const { application, documents = [], benefitRecord } = data;
  const schemeName = isTa
    ? application.schemeId?.name?.ta || application.schemeId?.name?.en
    : application.schemeId?.name?.en;

  const hasPendingDocs = documents.some(
    (d: any) =>
      d.verificationStatus === 'NOT_REVIEWED' || d.verificationStatus === 'CORRECTION_REQUIRED'
  );

  const displayStatus =
    hasPendingDocs &&
    (application.status === 'APPROVED' || application.status === 'BENEFIT_RELEASED')
      ? 'DOC_VERIFICATION'
      : application.status;

  const isCorrectionRequired =
    displayStatus === 'CORRECTION_REQUIRED' ||
    documents.some((d: any) => d.verificationStatus === 'CORRECTION_REQUIRED');
  const pendingDocCount = documents.filter(
    (d: any) => d.verificationStatus === 'NOT_REVIEWED'
  ).length;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title={isTa ? 'விண்ணப்ப கண்காணிப்பு காலவரிசை' : 'Application Timeline & Progress'}
        subtitle={
          isTa
            ? 'அரசு அலுவலர் ஆய்வு, ஆவண சரிபார்ப்பு மற்றும் தகுதி ஒப்புதல் நிலைகளை நேரலையாகக் கண்காணிக்கலாம்'
            : 'Track review stages, officer credential checks, and direct disbursement sanction orders'
        }
        badge={application.applicationReference || application.applicationNo}
        badgeVariant="blue"
        icon={FileCheck}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'விண்ணப்பங்கள்' : 'My Applications', href: '/citizen/applications' },
          { label: isTa ? 'காலவரிசை' : 'Tracking' }
        ]}
        actions={
          <Link
            to="/citizen/applications"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isTa ? 'பட்டியலுக்கு திரும்பு' : 'Back to List'}</span>
          </Link>
        }
      />

      {/* Application Snapshot Card */}
      <div className="gov-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                handleCopyRef(application.applicationReference || application.applicationNo)
              }
              className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <span className="font-mono">
                {application.applicationReference || application.applicationNo}
              </span>
              {copiedRef ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-blue-500" />
              )}
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              Submitted:{' '}
              {new Date(application.submittedAt || application.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h2 className="text-lg font-extrabold text-[#172B4D] mt-1">{schemeName}</h2>

          {/* Approved By Identity Block */}
          <div className="pt-1 text-xs text-slate-600 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Reviewing Officer: </strong>
              {application.approvedBy?.name ? (
                <span className="text-emerald-950 font-extrabold">
                  {application.approvedBy.name} (
                  {application.approvedBy.role || 'Authorized Reviewing Officer'})
                  {application.approvedAt
                    ? ` on ${new Date(application.approvedAt).toLocaleDateString()}`
                    : ''}
                </span>
              ) : (
                <span className="text-slate-500 italic">Under department evaluation</span>
              )}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={displayStatus} isTamil={isTa} size="md" />
        </div>
      </div>

      {/* Prominent Status Callout Panels */}
      {displayStatus === 'APPROVED' && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-emerald-900">
                {isTa ? 'விண்ணப்பம் அங்கீகரிக்கப்பட்டது – நலத்திட்ட ஆணை வழங்கப்பட்டது' : 'Application Approved – Scheme Benefit Sanctioned'}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                {isTa
                  ? `உங்கள் விண்ணப்பம் மாவட்ட அலுவலரால் வெற்றிகரமாக சரிபார்க்கப்பட்டு அங்கீகரிக்கப்பட்டுள்ளது.`
                  : `Your welfare scheme application has been officially verified and sanctioned by the District Welfare Office.`}
              </p>
            </div>
          </div>
          {application.officerRemarks && (
            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs">
              <span className="font-bold text-slate-700 block">Reviewing Officer Remarks:</span>
              <p className="text-slate-800 italic mt-0.5">"{application.officerRemarks}"</p>
            </div>
          )}
          <div className="pt-1 text-xs text-emerald-800 flex items-center space-x-2 font-medium">
            <span>Next Steps: Monthly DBT disbursement or card distribution will be initiated as per scheme schedule.</span>
          </div>
        </div>
      )}

      {displayStatus === 'CORRECTION_REQUIRED' && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-amber-900">
                {isTa ? 'நடவடிக்கை தேவை: ஆவணத் திருத்தம் கோரப்பட்டுள்ளது' : 'Action Required: Application Returned for Corrections'}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {isTa
                  ? `ஆய்வு அதிகாரி உங்கள் விண்ணப்பத்தில் சில ஆவணங்களை மீண்டும் பதிவேற்றக் கோரியுள்ளார்.`
                  : `The reviewing officer has identified issues requiring your correction before processing can continue.`}
              </p>
            </div>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Officer's Specific Correction Instructions:</span>
            <p className="text-amber-900 font-medium italic">
              "{application.officerRemarks || 'Please upload clear and valid supporting documents.'}"
            </p>
          </div>
          <div className="pt-1 text-xs text-amber-800">
            <span>Instructions: Click the "Correct File" button next to the affected document below to replace and resubmit.</span>
          </div>
        </div>
      )}

      {displayStatus === 'REJECTED' && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-rose-900">
                {isTa ? 'விண்ணப்பம் நிராகரிக்கப்பட்டது' : 'Application Rejected by Reviewing Authority'}
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                {isTa
                  ? `உங்கள் விண்ணப்பம் பரிசீலிக்கப்பட்டு தகுதி விதிகளுக்கு உட்படாததால் நிராகரிக்கப்பட்டது.`
                  : `Your application could not be approved due to statutory eligibility criteria or document non-compliance.`}
              </p>
            </div>
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Official Rejection Reason:</span>
            <p className="text-rose-900 font-medium italic">
              "{application.officerRemarks || 'Does not meet statutory eligibility guidelines.'}"
            </p>
          </div>
          <div className="pt-1 text-xs text-rose-800 font-medium">
            <span>Grievance Redressal: If you believe this decision was made in error, you may file an appeal through the District Collectorate portal.</span>
          </div>
        </div>
      )}

      {/* Dynamic Application Timeline Stepper */}
      <ApplicationTimeline
        currentStatus={displayStatus}
        history={application.statusHistory}
        officerRemarks={application.officerRemarks}
        pendingDocCount={pendingDocCount}
      />

      {/* Approved Benefit Sanction Card */}
      {benefitRecord &&
      (displayStatus === 'APPROVED' || displayStatus === 'BENEFIT_RELEASED') ? (
        <div className="gov-card p-6 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border-emerald-300">
          <div className="flex items-center space-x-2.5 mb-3">
            <Award className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-extrabold text-emerald-950">
              {isTa ? 'உரிமைத் தொகை வழங்கல் விவரம்' : 'Official Sanction Order & Disbursement'}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-2">
            <div>
              <span className="text-slate-400 block text-[10px]">
                {isTa ? 'ஆணை எண்' : 'Sanction Ref'}
              </span>
              <span className="font-extrabold font-mono text-slate-900">
                {benefitRecord.benefitReferenceNo}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">
                {isTa ? 'மாதாந்திர தொகை' : 'Monthly Grant'}
              </span>
              <span className="font-extrabold text-emerald-800 text-sm">
                ₹{benefitRecord.disbursementAmount?.toLocaleString()} / mo
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">
                {isTa ? 'விடுவிக்கப்பட்ட நாள்' : 'Release Date'}
              </span>
              <span className="font-extrabold text-slate-900">
                {new Date(benefitRecord.releaseDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">
                {isTa ? 'பரிமாற்ற நிலை' : 'Disbursement Status'}
              </span>
              <span className="font-extrabold text-teal-800 uppercase">
                {benefitRecord.status || 'RELEASED (DBT)'}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Submitted Documents & Provenance Cards */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-extrabold text-[#172B4D] uppercase tracking-wider">
              {isTa ? 'சமர்ப்பிக்கப்பட்ட சான்றிதழ்கள்' : 'Attached Verification Documents'}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {documents.length} Proofs Provided
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-4 text-center">
            No documents attached to this application record.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc: any) => {
              const isDigi = doc.source === 'DIGILOCKER';
              const isVerified =
                doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';
              const isCorrection = doc.verificationStatus === 'CORRECTION_REQUIRED';
              const isRejected = doc.verificationStatus === 'REJECTED';
              const showExpanded = expandedDetails[doc._id];

              return (
                <div
                  key={doc._id}
                  className={`border rounded-xl p-4 space-y-3 transition-all ${
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isCorrection
                      ? 'border-amber-300 bg-amber-50/30'
                      : isRejected
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-[#172B4D] text-xs">
                        {isTa
                          ? doc.documentName?.ta || doc.docType
                          : doc.documentName?.en || doc.docType}
                        {doc.version ? ` (Version ${doc.version})` : ''}
                      </h4>
                      <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-500">
                        <span>
                          Source: <strong>{isDigi ? 'DigiLocker Verified' : 'Manual Upload'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Uploaded: {new Date(doc.uploadedAt || new Date()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <StatusBadge status={doc.verificationStatus} isTamil={isTa} size="sm" />
                  </div>

                  {/* Officer Verification Stamp */}
                  {isVerified && (
                    <div className="bg-white/90 border border-emerald-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Verified By:</span>
                          <span className="font-extrabold text-slate-900">
                            {doc.verifiedBy?.name || 'Authorized Reviewing Officer'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Officer Role:</span>
                          <span className="font-semibold text-slate-800">
                            {doc.verifiedBy?.role || 'District Welfare Officer'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Verified Timestamp:</span>
                          <span className="font-semibold text-slate-800">
                            {doc.verifiedAt
                              ? new Date(doc.verifiedAt).toLocaleString()
                              : 'Official Record'}
                          </span>
                        </div>
                      </div>
                      {doc.officerRemarks && (
                        <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-100">
                          <strong>Remarks:</strong> "{doc.officerRemarks}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correction Required Banner */}
                  {isCorrection && (
                    <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold block text-xs">
                            Correction Reason: {doc.correctionReason || 'Document illegible or mismatched'}
                          </span>
                          {doc.officerRemarks && (
                            <p className="text-[11px] mt-0.5 italic">"{doc.officerRemarks}"</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenCorrection(doc)}
                          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center space-x-1 shrink-0"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>{isTa ? 'ஆவணம் மாற்றுக' : 'Correct File'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rejection Notice */}
                  {isRejected && (
                    <div className="bg-rose-100/70 border border-rose-300 rounded-xl p-3 text-xs text-rose-950 space-y-1">
                      <div>
                        <strong>Rejection Reason:</strong>{' '}
                        {doc.rejectionReason || 'Document details could not be authenticated'}
                      </div>
                      {doc.officerRemarks && (
                        <div>
                          <strong>Officer Remark:</strong> "{doc.officerRemarks}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata Toggle */}
                  <div className="pt-1">
                    <button
                      onClick={() => toggleDetails(doc._id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                    >
                      <span>{showExpanded ? 'Hide technical details' : 'View file metadata'}</span>
                      {showExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {showExpanded && (
                      <div className="mt-2 p-3 bg-[#0a1726] text-slate-200 font-mono text-[10px] rounded-xl space-y-1 overflow-x-auto">
                        <div>File Name: {doc.fileName}</div>
                        <div>Issuer: {doc.issuer || 'Government of Tamil Nadu'}</div>
                        <div>Source Reference: {doc.sourceReference || 'PORTAL-VERIFIED-AUTH'}</div>
                        <div>OCR Scan Confidence: {doc.ocrConfidence || 88}%</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Citizen Document Correction Modal */}
      {activeCorrectionDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="gov-card bg-white max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#172B4D] flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>
                  Correct Document:{' '}
                  {activeCorrectionDoc.documentName?.en || activeCorrectionDoc.docType}
                </span>
              </h3>
              <button
                onClick={() => setActiveCorrectionDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
              <strong>Officer Feedback:</strong> "
              {activeCorrectionDoc.officerRemarks || 'Please upload valid replacement copy.'}"
            </div>

            {/* Source Options */}
            {correctionMode === 'CHOICE' && (
              <div className="space-y-3 pt-2">
                <p className="font-bold text-slate-800 text-xs">Choose replacement source:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setCorrectionMode('UPLOAD')}
                    className="p-4 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-600 hover:bg-blue-50/30 text-left space-y-2 transition-all"
                  >
                    <FileUp className="w-6 h-6 text-blue-700" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">OPTION 1</div>
                      <div className="text-xs font-bold text-blue-900">Upload Clean File</div>
                      <div className="text-[10px] text-slate-500">PDF, PNG, JPG from device</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setCorrectionMode('DIGILOCKER')}
                    className="p-4 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-600 hover:bg-teal-50/30 text-left space-y-2 transition-all"
                  >
                    <ShieldCheck className="w-6 h-6 text-teal-700" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">OPTION 2</div>
                      <div className="text-xs font-bold text-teal-900">Fetch from DigiLocker</div>
                      <div className="text-[10px] text-slate-500">Verified official certificate</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Option 1: Manual Upload */}
            {correctionMode === 'UPLOAD' && (
              <div className="space-y-4 pt-2">
                <button
                  onClick={() => setCorrectionMode('CHOICE')}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  ← Back to Options
                </button>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    Select Replacement File
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleCorrectionFileChange}
                    className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#10243A] file:text-white hover:file:bg-[#193352]"
                  />

                  {replacementFile && (
                    <div className="text-xs text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ready: {replacementFile.fileName}</span>
                    </div>
                  )}

                  <button
                    onClick={handleResubmitManualUpload}
                    disabled={!replacementFile || submittingCorrection}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xs transition-all text-xs"
                  >
                    {submittingCorrection ? 'Resubmitting...' : 'Confirm & Resubmit File'}
                  </button>
                </div>
              </div>
            )}

            {/* Option 2: DigiLocker */}
            {correctionMode === 'DIGILOCKER' && (
              <div className="space-y-4 pt-2">
                <button
                  onClick={() => setCorrectionMode('CHOICE')}
                  className="text-xs text-teal-700 font-bold hover:underline"
                >
                  ← Back to Options
                </button>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs">Available DigiLocker Documents:</h4>
                  {loadingDigiDocs ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Loading DigiLocker repository...
                    </div>
                  ) : availableDigiDocs.length === 0 ? (
                    <div className="text-slate-500 italic p-4 bg-slate-50 rounded-xl text-xs">
                      No DigiLocker documents available.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {availableDigiDocs.map((dl) => (
                        <div
                          key={dl.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {isTa ? dl.name?.ta || dl.name?.en : dl.name?.en}
                            </div>
                            <div className="text-[10px] text-slate-500">Issuer: {dl.issuer}</div>
                          </div>
                          <button
                            onClick={() => handleResubmitDigiLocker(dl)}
                            disabled={submittingCorrection}
                            className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs"
                          >
                            Use This Proof
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
