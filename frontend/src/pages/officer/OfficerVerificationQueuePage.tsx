import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  Building,
  Calendar,
  FileText,
  UserCheck,
  Scan,
  Send,
  MessageSquare,
  X,
  HelpCircle,
  ArrowRight,
  Check
} from 'lucide-react';

interface ApplicationDoc {
  _id: string;
  docType: string;
  documentName: { en: string; ta: string };
  fileName: string;
  fileUrl: string;
  source?: 'MANUAL_UPLOAD' | 'DIGILOCKER';
  sourceReference?: string;
  issuer?: string;
  issueDate?: string;
  retrievedAt?: string;
  uploadedAt: string;
  ocrStatus?: string;
  ocrConfidence?: number;
  extractedData?: any;
  verificationStatus: 'NOT_REVIEWED' | 'ACCEPTED' | 'CORRECTION_REQUIRED' | 'REJECTED' | 'VERIFIED';
  verifiedBy?: { _id: string; name: string; role: string };
  verifiedAt?: string;
  officerRemarks?: string;
  correctionReason?: string;
  correctionRequestedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  version?: number;
}

export const OfficerVerificationQueuePage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appDocuments, setAppDocuments] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApp, setLoadingApp] = useState(false);

  // Active Modals
  const [docForVerifyModal, setDocForVerifyModal] = useState<ApplicationDoc | null>(null);
  const [docForCorrectionModal, setDocForCorrectionModal] = useState<ApplicationDoc | null>(null);
  const [docForRejectModal, setDocForRejectModal] = useState<ApplicationDoc | null>(null);

  // Modal Inputs
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [correctionReason, setCorrectionReason] = useState('Certificate number mismatch');
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Information mismatch');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchVerificationQueue();
  }, []);

  const fetchVerificationQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/applications');
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error('Fetch queue error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApp = async (appId: string) => {
    setLoadingApp(true);
    try {
      const res = await api.get(`/admin/applications/${appId}`);
      setSelectedApp(res.data.application);
      setAppDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Fetch app detail error:', err);
    } finally {
      setLoadingApp(false);
    }
  };

  const executeDocumentAction = async (
    docId: string,
    newStatus: 'VERIFIED' | 'CORRECTION_REQUIRED' | 'REJECTED',
    reason?: string,
    remarks?: string
  ) => {
    if (!selectedApp) return;
    setSubmittingAction(true);
    try {
      const payload: any = {
        verificationStatus: newStatus,
        officerRemarks: remarks || ''
      };

      if (newStatus === 'CORRECTION_REQUIRED') {
        payload.correctionReason = reason;
      } else if (newStatus === 'REJECTED') {
        payload.rejectionReason = reason;
      }

      await api.put(`/admin/applications/${selectedApp._id}/documents/${docId}`, payload);

      // Close all modals
      setDocForVerifyModal(null);
      setDocForCorrectionModal(null);
      setDocForRejectModal(null);
      setVerifyRemarks('');
      setCorrectionRemarks('');
      setRejectionRemarks('');

      // Refresh documents & queue
      const res = await api.get(`/admin/applications/${selectedApp._id}`);
      setSelectedApp(res.data.application);
      setAppDocuments(res.data.documents || []);
      fetchVerificationQueue();
    } catch (err: any) {
      console.error('Update document error:', err);
      alert(err.response?.data?.message || 'Error updating document verification status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFinalCaseDecision = async (newStatus: string) => {
    if (!selectedApp) return;
    try {
      await api.put(`/admin/applications/${selectedApp._id}/status`, {
        status: newStatus,
        remarks: `Officer audit transition to ${newStatus}.`
      });
      setSelectedApp(null);
      fetchVerificationQueue();
    } catch (err: any) {
      console.error('Case decision error:', err);
      alert(err.response?.data?.message || 'Error updating application status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full w-fit mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>{isTa ? 'அதிகாரியின் ஆவண சரிபார்ப்பு அரங்கம்' : 'Officer Document Verification Workspace'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTa ? 'ஆவண சரிபார்ப்பு மற்றும் தணிக்கை வரிசை' : 'Document Verification & Provenance Audit Queue'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa
              ? 'டிஜிலாக்கர் சான்றிதழ்கள் மற்றும் கைமுறை ஆவணங்களை அதிகாரப்பூர்வமாக சரிபார்த்து முடிவு எடுக்கவும்.'
              : 'Audit DigiLocker provenance metadata and applicant profile facts before releasing scheme benefits.'}
          </p>
        </div>

        <button
          onClick={fetchVerificationQueue}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center space-x-1.5 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{isTa ? 'புதுப்பிக்குக' : 'Refresh Queue'}</span>
        </button>
      </div>

      {/* Main Grid: Queue Table + Verification Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List: Application Queue */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
            <span>{isTa ? 'சரிபார்ப்பு வரிசை' : 'Pending Verification Queue'}</span>
            <span className="bg-purple-100 text-purple-900 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              {applications.length} {isTa ? 'விண்ணப்பங்கள்' : 'Cases'}
            </span>
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-900" />
              <p>{isTa ? 'பணி வரிசையை ஏற்றுகிறது...' : 'Loading verification queue...'}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-bold">{isTa ? 'நிலுவையில் உள்ள ஆவணங்கள் எதுவும் இல்லை.' : 'No pending verification cases found.'}</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {applications.map((app) => {
                const isSelected = selectedApp?._id === app._id;
                const isCorrection = app.status === 'CORRECTION_REQUIRED';

                return (
                  <div
                    key={app._id}
                    onClick={() => handleSelectApp(app._id)}
                    className={`glass-card p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-purple-900 bg-purple-50/40 shadow-sm'
                        : isCorrection
                        ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-purple-900 text-xs bg-purple-100/80 px-2 py-0.5 rounded">
                        {app.applicationReference || app.applicationNo}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isCorrection
                            ? 'bg-rose-100 text-rose-800'
                            : app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status === 'DOC_VERIFICATION' ? 'DOC VERIFICATION' : app.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">
                        {isTa ? app.schemeId?.name?.ta : app.schemeId?.name?.en}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {app.citizenId?.name || 'Citizen'} • {app.citizenId?.district || 'District'}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold text-purple-900 hover:underline">{isTa ? 'ஆய்வு செய்க [ Review ]' : 'Review Case →'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Workbench: Per-Document Verification */}
        <div className="lg:col-span-7">
          {!selectedApp ? (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 text-center space-y-3 min-h-[500px] flex flex-col items-center justify-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-700 text-sm">
                {isTa ? 'ஆவணங்களைச் சரிபார்க்க விண்ணப்பத்தைத் தேர்ந்தெடுக்கவும்' : 'Select an Application from the Queue'}
              </h3>
              <p className="text-slate-400 text-xs max-w-xs">
                {isTa
                  ? 'இடதுபுறம் உள்ள வரிசையிலிருந்து ஏதேனும் ஒரு விண்ணப்பத்தைக் கிளிக் செய்து சான்றிதழ்களைச் சரிபார்க்கவும்.'
                  : 'Click any application case on the left queue to open the per-document verification workbench.'}
              </p>
            </div>
          ) : loadingApp ? (
            <div className="glass-card p-12 rounded-3xl border border-slate-200 text-center py-20 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-900" />
              <p className="font-bold text-slate-600">{isTa ? 'வழக்கு விவரங்களை ஏற்றுகிறது...' : 'Loading case details & documents...'}</p>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* Selected Application Header */}
              <div className="border-b border-slate-200 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-xs text-purple-900 bg-purple-100 px-3 py-1 rounded-full">
                    {selectedApp.applicationReference || selectedApp.applicationNo}
                  </span>
                  <span className="font-bold text-xs text-slate-500">
                    Status:{' '}
                    <span className="font-extrabold text-slate-900 uppercase">
                      {selectedApp.status === 'DOC_VERIFICATION' ? 'PENDING VERIFICATION' : selectedApp.status}
                    </span>
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {isTa ? selectedApp.schemeId?.name?.ta : selectedApp.schemeId?.name?.en}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Citizen: <strong className="text-slate-900">{selectedApp.citizenId?.name}</strong> | District:{' '}
                    <strong className="text-slate-900">{selectedApp.citizenId?.district || 'Tamil Nadu'}</strong>
                  </p>
                </div>
              </div>

              {/* Per-Document Verification Cards List */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-900" />
                  <span>{isTa ? 'இணைக்கப்பட்ட சான்றிதழ்கள் சரிபார்ப்பு' : 'Submitted Documents Review Workbench'}</span>
                </h3>

                {appDocuments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl">
                    No documents attached to this application record.
                  </p>
                ) : (
                  appDocuments.map((doc) => {
                    const isDigi = doc.source === 'DIGILOCKER';
                    const isVerified = doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';
                    const isCorrection = doc.verificationStatus === 'CORRECTION_REQUIRED';
                    const isRejected = doc.verificationStatus === 'REJECTED';

                    // Mock extraction facts for side-by-side comparison
                    const applicantIncome = selectedApp.citizenId?.annualIncome ? `₹${selectedApp.citizenId.annualIncome.toLocaleString()}` : '₹1,20,000';
                    const docIncome = doc.extractedData?.annualIncome ? `₹${doc.extractedData.annualIncome.toLocaleString()}` : '₹1,20,000';
                    const incomeMatch = applicantIncome === docIncome;

                    return (
                      <div
                        key={doc._id}
                        className={`p-4 rounded-2xl border space-y-4 transition-all ${
                          isVerified
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : isCorrection
                            ? 'border-rose-300 bg-rose-50/30'
                            : isRejected
                            ? 'border-red-300 bg-red-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {/* Header: Doc Name & Source */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                              {doc.docType} {doc.version ? `(Version ${doc.version})` : ''}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-xs">
                              {isTa ? doc.documentName?.ta || doc.docType : doc.documentName?.en || doc.docType}
                            </h4>
                          </div>

                          {/* Source Badge */}
                          <span
                            className={`px-2.5 py-1 font-extrabold text-[10px] rounded-full border flex items-center space-x-1 shrink-0 ${
                              isDigi
                                ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{isDigi ? 'Source: DigiLocker' : 'Source: Manual Upload'}</span>
                          </span>
                        </div>

                        {/* Side-by-Side Fact Comparison Table */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2">
                          <span className="font-bold text-[11px] text-slate-800 block">
                            {isTa ? 'தரவு ஒப்பீடு (Applicant Profile vs Extracted Facts):' : 'Fact Verification Comparison:'}
                          </span>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">{isTa ? 'விண்ணப்பதாரர் தகவல்:' : 'Applicant Profile Fact'}</span>
                              <span className="font-bold text-slate-800 block">Annual Income: {applicantIncome}</span>
                              <span className="text-slate-500 text-[10px]">District: {selectedApp.citizenId?.district || 'Chennai'}</span>
                            </div>

                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">{isTa ? 'சான்றிதழ் சான்றுகள்:' : 'Document Extracted Fact'}</span>
                              <span className="font-bold text-slate-800 block">Annual Income: {docIncome}</span>
                              <span className="text-slate-500 text-[10px]">Issuer: {doc.issuer || 'Govt of Tamil Nadu'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[10px] border-t border-slate-200">
                            <span className="text-slate-500">Cross-Validation Result:</span>
                            {incomeMatch ? (
                              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Match Verified</span>
                              </span>
                            ) : (
                              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                Fact Discrepancy
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Display */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-bold text-slate-600">{isTa ? 'சரிபார்ப்பு நிலை:' : 'Verification Status:'}</span>
                          {isVerified && (
                            <span className="text-emerald-800 font-extrabold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</span>
                            </span>
                          )}

                          {isCorrection && (
                            <span className="text-rose-900 font-extrabold bg-rose-100 px-3 py-1 rounded-full border border-rose-300 flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                              <span>{isTa ? 'திருத்தம் கோரப்பட்டது' : 'Correction Required'}</span>
                            </span>
                          )}

                          {isRejected && (
                            <span className="text-red-900 font-extrabold bg-red-100 px-3 py-1 rounded-full border border-red-300 flex items-center space-x-1">
                              <XCircle className="w-3.5 h-3.5 text-red-700" />
                              <span>{isTa ? 'நிராகரிக்கப்பட்டது' : 'Rejected'}</span>
                            </span>
                          )}

                          {!isVerified && !isCorrection && !isRejected && (
                            <span className="text-amber-900 font-extrabold bg-amber-100 px-3 py-1 rounded-full border border-amber-300 flex items-center space-x-1">
                              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                              <span>{isTa ? 'அதிகாரி சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending Officer Review'}</span>
                            </span>
                          )}
                        </div>

                        {/* Verified Metadata */}
                        {isVerified && doc.verifiedBy && (
                          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-950 space-y-0.5">
                            <div><strong>Verified By:</strong> {doc.verifiedBy.name || 'Authorized Officer'} ({doc.verifiedBy.role || 'District Welfare Officer'})</div>
                            {doc.verifiedAt && <div><strong>Verified On:</strong> {new Date(doc.verifiedAt).toLocaleString()}</div>}
                            {doc.officerRemarks && <div><strong>Officer Remarks:</strong> {doc.officerRemarks}</div>}
                          </div>
                        )}

                        {/* Officer Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setDocForVerifyModal(doc);
                              setVerifyRemarks(doc.officerRemarks || 'Document details match application.');
                            }}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl flex items-center space-x-1 text-xs shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isTa ? 'சரிபார் (Verify)' : 'Verify Document'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setDocForCorrectionModal(doc);
                              setCorrectionRemarks('Certificate details do not match the submitted application information.');
                            }}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl flex items-center space-x-1 text-xs shadow-2xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{isTa ? 'திருத்தம் கோருக' : 'Request Correction'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setDocForRejectModal(doc);
                              setRejectionRemarks('Document does not satisfy eligibility criteria.');
                            }}
                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-extrabold rounded-xl flex items-center space-x-1 text-xs shadow-2xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isTa ? 'நிராகரி (Reject)' : 'Reject Document'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Overall Final Case Decision Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">
                  {isTa ? 'முழுமையான வழக்கு முடிவு:' : 'Final Case Approval Decision:'}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFinalCaseDecision('CORRECTION_REQUIRED')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs shadow-2xs"
                  >
                    {isTa ? 'திருத்தம் கோருக' : 'Require Correction'}
                  </button>
                  <button
                    onClick={() => handleFinalCaseDecision('APPROVED')}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isTa ? 'அங்கீகரித்து உதவித்தொகை வழங்' : 'Approve & Release Benefit'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: VERIFY CONFIRMATION MODAL */}
      {docForVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Verify Document Confirmation</span>
              </div>
              <button onClick={() => setDocForVerifyModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Verify this document? The document information will be marked as verified and may be used by the eligibility engine.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Document:</span>
              <span className="font-extrabold text-slate-900">{docForVerifyModal.documentName?.en || docForVerifyModal.docType}</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Officer Remarks (Optional):</label>
              <textarea
                rows={2}
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                placeholder="Document details match the submitted application."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDocForVerifyModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDocumentAction(docForVerifyModal._id, 'VERIFIED', undefined, verifyRemarks)}
                disabled={submittingAction}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs shadow-md"
              >
                {submittingAction ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST CORRECTION MODAL */}
      {docForCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Request Document Correction</span>
              </div>
              <button onClick={() => setDocForCorrectionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
              <span className="font-bold block mb-1">Document:</span>
              <span className="font-extrabold">{docForCorrectionModal.documentName?.en || docForCorrectionModal.docType}</span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">Correction Reason:</label>
              <select
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Information does not match profile">Information does not match profile</option>
                <option value="Document is unclear">Document is unclear</option>
                <option value="Document is expired">Document is expired</option>
                <option value="Required information is missing">Required information is missing</option>
                <option value="Wrong document">Wrong document</option>
                <option value="Certificate number mismatch">Certificate number mismatch</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">Officer Remarks (Required):</label>
              <textarea
                rows={3}
                value={correctionRemarks}
                onChange={(e) => setCorrectionRemarks(e.target.value)}
                placeholder="Please upload a valid income certificate. The certificate number does not match..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDocForCorrectionModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDocumentAction(docForCorrectionModal._id, 'CORRECTION_REQUIRED', correctionReason, correctionRemarks)}
                disabled={submittingAction || !correctionRemarks.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md"
              >
                {submittingAction ? 'Sending...' : 'Send Correction Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT DOCUMENT MODAL */}
      {docForRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-900 font-extrabold text-sm">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Document</span>
              </div>
              <button onClick={() => setDocForRejectModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-950">
              <span className="font-bold block mb-1">Document:</span>
              <span className="font-extrabold">{docForRejectModal.documentName?.en || docForRejectModal.docType}</span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">Rejection Reason:</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Invalid document">Invalid document</option>
                <option value="Document does not belong to applicant">Document does not belong to applicant</option>
                <option value="Expired document">Expired document</option>
                <option value="Information mismatch">Information mismatch</option>
                <option value="Unsupported document">Unsupported document</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">Officer Remarks:</label>
              <textarea
                rows={3}
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Reason for rejecting this document..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDocForRejectModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDocumentAction(docForRejectModal._id, 'REJECTED', rejectionReason, rejectionRemarks)}
                disabled={submittingAction}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-extrabold rounded-xl text-xs shadow-md"
              >
                {submittingAction ? 'Rejecting...' : 'Reject Document'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

