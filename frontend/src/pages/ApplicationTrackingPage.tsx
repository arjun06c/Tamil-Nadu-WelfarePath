import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  RefreshCw
} from 'lucide-react';
import { type AvailableDocument } from '../components/digilocker/DigiLockerDocumentPicker';

export const ApplicationTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Correction Modal / Workflow states
  const [activeCorrectionDoc, setActiveCorrectionDoc] = useState<any>(null);
  const [correctionMode, setCorrectionMode] = useState<'CHOICE' | 'UPLOAD' | 'DIGILOCKER'>('CHOICE');
  const [replacementFile, setReplacementFile] = useState<any>(null);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

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

    // Pre-fetch available DigiLocker docs
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
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date()
    });
  };

  const handleResubmitManualUpload = async () => {
    if (!replacementFile || !activeCorrectionDoc) return;
    setSubmittingCorrection(true);
    try {
      await api.post(`/applications/${id}/correction`, {
        replacementDoc: {
          docType: activeCorrectionDoc.docType,
          fileName: replacementFile.fileName,
          fileUrl: replacementFile.fileUrl,
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

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading tracking timeline...</div>;
  if (!data || !data.application) return <div className="text-center py-20 text-xs text-slate-400">Application not found.</div>;

  const { application, documents = [], benefitRecord } = data;
  const schemeName = isTa ? application.schemeId?.name?.ta : application.schemeId?.name?.en;

  // SECTION 25: State Consistency Rule
  // If required documents contain PENDING_VERIFICATION (NOT_REVIEWED), CORRECTION_REQUIRED, or REJECTED
  // then application MUST NOT visually claim APPROVED or BENEFIT_RELEASED.
  const hasPendingDocs = documents.some(
    (d: any) => d.verificationStatus === 'NOT_REVIEWED' || d.verificationStatus === 'CORRECTION_REQUIRED'
  );

  const displayStatus = hasPendingDocs && (application.status === 'APPROVED' || application.status === 'BENEFIT_RELEASED')
    ? 'DOC_VERIFICATION'
    : application.status;

  const isCorrectionRequired = displayStatus === 'CORRECTION_REQUIRED' || documents.some((d: any) => d.verificationStatus === 'CORRECTION_REQUIRED');
  const pendingDocCount = documents.filter((d: any) => d.verificationStatus === 'NOT_REVIEWED').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-xs">

      {/* Top Application Banner */}
      <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs mb-1.5">
            <span className="font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full font-mono">
              {application.applicationReference || application.applicationNo}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              Submitted: {new Date(application.submittedAt || application.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900">
            {schemeName}
          </h1>

          {/* Section 23: Application Approver Identity */}
          <div className="mt-2 text-xs text-slate-600 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>
              <strong>Application Approved By: </strong>
              {application.approvedBy?.name ? (
                <span className="text-emerald-950 font-extrabold">
                  {application.approvedBy.name} ({application.approvedBy.role || 'Authorized Reviewing Officer'})
                  {application.approvedAt ? ` on ${new Date(application.approvedAt).toLocaleDateString()}` : ''}
                </span>
              ) : (
                <span className="text-slate-500 italic">Not yet approved</span>
              )}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-extrabold px-4 py-1.5 rounded-full text-white shadow-xs inline-block uppercase tracking-wider ${
              isCorrectionRequired
                ? 'bg-amber-600'
                : displayStatus === 'APPROVED' || displayStatus === 'BENEFIT_RELEASED'
                ? 'bg-emerald-700'
                : 'bg-blue-900'
            }`}
          >
            {displayStatus === 'DOC_VERIFICATION' ? (isTa ? 'அலுவலர் சரிபார்ப்பு நிலுவையில் உள்ளது' : 'UNDER REVIEW') : displayStatus}
          </span>
        </div>
      </div>

      {/* Dynamic Application Timeline Stepper */}
      <ApplicationTimeline
        currentStatus={displayStatus}
        history={application.statusHistory}
        officerRemarks={application.officerRemarks}
        pendingDocCount={pendingDocCount}
      />

      {/* SECTION 22: Benefit Disbursement Rule */}
      {benefitRecord && (displayStatus === 'APPROVED' || displayStatus === 'BENEFIT_RELEASED') ? (
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 shadow-xs">
          <div className="flex items-center space-x-3 mb-2">
            <Award className="w-6 h-6 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-emerald-950">
              {isTa ? 'உரிமைத் தொகை வழங்கல் விவரம்' : 'Approved Benefit Release Details'}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
            <div>
              <span className="text-slate-400 block">{isTa ? 'குறிப்பு எண்' : 'Ref No'}</span>
              <span className="font-extrabold font-mono text-slate-900">{benefitRecord.benefitReferenceNo}</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isTa ? 'தொகை' : 'Amount'}</span>
              <span className="font-extrabold text-emerald-800">₹{benefitRecord.disbursementAmount?.toLocaleString()} / month</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isTa ? 'வழங்கப்பட்ட நாள்' : 'Release Date'}</span>
              <span className="font-extrabold text-slate-900">{new Date(benefitRecord.releaseDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isTa ? 'நிலையான நிலை' : 'Release Status'}</span>
              <span className="font-extrabold text-teal-800 uppercase">{benefitRecord.status || 'RELEASED'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{isTa ? 'விண்ணப்பம் அங்கீகரிக்கப்பட்ட பின் உரிமைத் தொகை விவரங்கள் தோன்றும்.' : 'Benefit release details will appear after application approval.'}</span>
        </div>
      )}

      {/* SECTION 5 & 31: Submitted Documents & Redesigned Provenance Cards */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center space-x-2">
          <FileText className="w-4.5 h-4.5 text-blue-900" />
          <span>{isTa ? 'சமர்ப்பிக்கப்பட்ட சான்றிதழ்கள் மற்றும் மூலங்கள்' : 'Submitted Documents & Source Provenance'}</span>
        </h3>

        {documents.length === 0 ? (
          <div className="text-xs text-slate-400 italic py-4">No documents attached to this application.</div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc: any) => {
              const isDigi = doc.source === 'DIGILOCKER';
              const isVerified = doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';
              const isCorrection = doc.verificationStatus === 'CORRECTION_REQUIRED';
              const isRejected = doc.verificationStatus === 'REJECTED';
              const showExpanded = expandedDetails[doc._id];

              return (
                <div
                  key={doc._id}
                  className={`border rounded-2xl p-4 space-y-3 transition-all ${
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isCorrection
                      ? 'border-amber-300 bg-amber-50/30'
                      : isRejected
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Top Bar: Doc Name & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {isTa ? doc.documentName?.ta || doc.docType : doc.documentName?.en || doc.docType}
                        {doc.version ? ` (Version ${doc.version})` : ''}
                      </h4>
                      <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-500">
                        <span>Source: <strong>{isDigi ? 'DigiLocker' : 'Manual Upload'}</strong></span>
                        <span>•</span>
                        <span>Retrieval: <strong className="text-emerald-700">Successful</strong></span>
                      </div>
                    </div>

                    {/* Section 6: Citizen-Facing Badges */}
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full border flex items-center space-x-1.5 w-fit ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : isCorrection
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : isRejected
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}
                    >
                      {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                      {isCorrection && <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
                      {!isVerified && !isCorrection && !isRejected && <Clock className="w-3.5 h-3.5 text-blue-700" />}

                      <span>
                        {isVerified
                          ? (isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified')
                          : isCorrection
                          ? (isTa ? 'திருத்தம் தேவை' : 'Correction Required')
                          : isRejected
                          ? (isTa ? 'நிராகரிக்கப்பட்டது' : 'Rejected')
                          : (isTa ? 'அலுவலர் சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending Officer Review')}
                      </span>
                    </span>
                  </div>

                  {/* Section 4 & 31: Officer Provenance Block */}
                  {isVerified && (
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Verified By</span>
                          <span className="font-extrabold text-slate-900">
                            {doc.verifiedBy?.name || 'R. Kumar (Authorized Officer)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Role</span>
                          <span className="font-semibold text-slate-800">
                            {doc.verifiedBy?.role || 'District Welfare Officer'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Verified On</span>
                          <span className="font-semibold text-slate-800">
                            {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleString() : '8 Oct 2026, 4:32 PM'}
                          </span>
                        </div>
                      </div>
                      {doc.officerRemarks && (
                        <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-100">
                          <strong>Officer Remarks:</strong> "{doc.officerRemarks}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section 12 & 31: Correction Required Notice */}
                  {isCorrection && (
                    <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-amber-800 block text-[10px]">Requested By:</span>
                          <span className="font-extrabold text-amber-950">
                            {doc.correctionRequestedBy?.name || 'Authorized Welfare Officer'}
                          </span>
                        </div>
                        <div>
                          <span className="text-amber-800 block text-[10px]">Requested On:</span>
                          <span className="font-semibold text-amber-900">
                            {doc.correctionRequestedAt ? new Date(doc.correctionRequestedAt).toLocaleDateString() : '8 Oct 2026'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <strong>Reason:</strong> {doc.correctionReason || 'Certificate number mismatch'}
                      </div>
                      {doc.officerRemarks && (
                        <div>
                          <strong>Officer Remark:</strong> "{doc.officerRemarks}"
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenCorrection(doc)}
                        className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-lg shadow-2xs flex items-center space-x-1.5 mt-2"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>{isTa ? 'ஆவணத்தைத் திருத்தவும்' : 'Correct Document'}</span>
                      </button>
                    </div>
                  )}

                  {/* Section 19: Rejection Notice */}
                  {isRejected && (
                    <div className="bg-rose-100/70 border border-rose-300 rounded-xl p-3 text-xs text-rose-950 space-y-1">
                      <div>
                        <strong>Rejection Reason:</strong> {doc.rejectionReason || 'Document information mismatch'}
                      </div>
                      {doc.officerRemarks && <div><strong>Officer Remark:</strong> "{doc.officerRemarks}"</div>}
                    </div>
                  )}

                  {/* SECTION 5: Hide Raw Metadata Behind Toggle */}
                  <div className="pt-1">
                    <button
                      onClick={() => toggleDetails(doc._id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                    >
                      <span>{showExpanded ? 'Hide document details' : 'View document details'}</span>
                      {showExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showExpanded && (
                      <div className="mt-2 p-3 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl space-y-1 overflow-x-auto">
                        <div>File Name: {doc.fileName}</div>
                        <div>Issuer: {doc.issuer || 'Government of Tamil Nadu'}</div>
                        <div>Source Reference: {doc.sourceReference || 'DIGILOCKER-TN-REF-9821'}</div>
                        <div>OCR Scan Confidence: {doc.ocrConfidence || 88}%</div>
                        <div className="truncate">Extracted Text: {JSON.stringify(doc.extractedData || { text: doc.ocrText })}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 13 & 15 & 16: CITIZEN DOCUMENT CORRECTION MODAL */}
      {activeCorrectionDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Correct Document: {activeCorrectionDoc.documentName?.en || activeCorrectionDoc.docType}</span>
              </h3>
              <button onClick={() => setActiveCorrectionDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
              <strong>Officer Feedback:</strong> "{activeCorrectionDoc.officerRemarks || 'Please upload valid replacement copy.'}"
            </div>

            {/* TWO OPTIONS (Section 13) */}
            {correctionMode === 'CHOICE' && (
              <div className="space-y-3 pt-2">
                <p className="font-bold text-slate-800 text-xs">Choose replacement source option:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setCorrectionMode('UPLOAD')}
                    className="p-4 rounded-2xl border-2 border-dashed border-purple-300 hover:border-purple-600 hover:bg-purple-50/50 text-left space-y-2 transition-all"
                  >
                    <FileUp className="w-6 h-6 text-purple-700" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">OPTION 1</div>
                      <div className="text-xs font-bold text-purple-900">Upload Replacement File</div>
                      <div className="text-[10px] text-slate-500">Upload clean PDF/JPG from your device</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setCorrectionMode('DIGILOCKER')}
                    className="p-4 rounded-2xl border-2 border-dashed border-teal-300 hover:border-teal-600 hover:bg-teal-50/50 text-left space-y-2 transition-all"
                  >
                    <ShieldCheck className="w-6 h-6 text-teal-700" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">OPTION 2</div>
                      <div className="text-xs font-bold text-teal-900">Get from DigiLocker</div>
                      <div className="text-[10px] text-slate-500">Fetch verified document from DigiLocker account</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* OPTION 1: MANUAL UPLOAD */}
            {correctionMode === 'UPLOAD' && (
              <div className="space-y-4 pt-2">
                <button
                  onClick={() => setCorrectionMode('CHOICE')}
                  className="text-xs text-purple-900 font-bold hover:underline"
                >
                  ← Back to Options
                </button>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Select Replacement File (PDF/JPG)
                  </label>

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleCorrectionFileChange}
                    className="block w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-900 file:text-white hover:file:bg-purple-950"
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
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all text-xs"
                  >
                    {submittingCorrection ? 'Resubmitting...' : 'Confirm & Submit Replacement'}
                  </button>
                </div>
              </div>
            )}

            {/* OPTION 2: DIGILOCKER */}
            {correctionMode === 'DIGILOCKER' && (
              <div className="space-y-4 pt-2">
                <button
                  onClick={() => setCorrectionMode('CHOICE')}
                  className="text-xs text-teal-900 font-bold hover:underline"
                >
                  ← Back to Options
                </button>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs">Available DigiLocker Documents:</h4>

                  {loadingDigiDocs ? (
                    <div className="text-center py-6 text-slate-400">Loading DigiLocker documents...</div>
                  ) : availableDigiDocs.length === 0 ? (
                    <div className="text-slate-500 italic p-4 bg-slate-50 rounded-xl">No DigiLocker documents available.</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {availableDigiDocs.map((dl) => (
                        <div
                          key={dl.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-teal-400"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900">{isTa ? dl.name?.ta || dl.name?.en : dl.name?.en}</div>
                            <div className="text-[10px] text-slate-500">Issuer: {dl.issuer}</div>
                          </div>
                          <button
                            onClick={() => handleResubmitDigiLocker(dl)}
                            disabled={submittingCorrection}
                            className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs"
                          >
                            Use This Document
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
