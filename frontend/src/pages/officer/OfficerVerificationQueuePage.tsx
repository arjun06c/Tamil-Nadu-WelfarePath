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
  MessageSquare
} from 'lucide-react';
import { DigiLockerModeBadge } from '../../components/digilocker/DigiLockerModeBadge';

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
  officerRemarks?: string;
}

export const OfficerVerificationQueuePage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appDocuments, setAppDocuments] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApp, setLoadingApp] = useState(false);

  // Remarks state for specific document correction
  const [activeDocForRemark, setActiveDocForRemark] = useState<string | null>(null);
  const [docRemark, setDocRemark] = useState('');

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

  const handleVerifyDocument = async (docId: string, newStatus: 'VERIFIED' | 'CORRECTION_REQUIRED' | 'REJECTED', remarkText?: string) => {
    if (!selectedApp) return;
    try {
      await api.put(`/admin/applications/${selectedApp._id}/documents/${docId}`, {
        verificationStatus: newStatus,
        officerRemarks: remarkText || ''
      });

      // Refresh documents
      const res = await api.get(`/admin/applications/${selectedApp._id}`);
      setSelectedApp(res.data.application);
      setAppDocuments(res.data.documents || []);
      setActiveDocForRemark(null);
      setDocRemark('');
      fetchVerificationQueue();
    } catch (err: any) {
      console.error('Update document error:', err);
      alert(err.response?.data?.message || 'Error updating document verification status');
    }
  };

  const handleFinalCaseDecision = async (newStatus: string) => {
    if (!selectedApp) return;
    try {
      await api.put(`/admin/applications/${selectedApp._id}/status`, {
        status: newStatus,
        remarks: `Document verification completed by officer. Case set to ${newStatus}.`
      });
      alert(isTa ? `விண்ணப்ப நிலை மாற்றப்பட்டது: ${newStatus}` : `Application status updated to ${newStatus}`);
      setSelectedApp(null);
      fetchVerificationQueue();
    } catch (err) {
      console.error('Case decision error:', err);
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
            {isTa ? 'ஆவண சரிபார்ப்பு மற்றும் OCR தணிக்கை பணி வரிசை' : 'Document Verification & Provenance Audit Queue'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa
              ? 'டிஜிலாக்கர் சான்றிதழ்கள் மற்றும் கைமுறை ஆவணங்களை அதிகாரப்பூர்வமாக சரிபார்த்து முடிவு எடுக்கவும்.'
              : 'Audit DigiLocker provenance metadata and manual OCR uploads before releasing welfare scheme benefits.'}
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
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isCorrection
                            ? 'bg-rose-100 text-rose-800'
                            : app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status}
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
                      <span className="font-bold text-purple-900 hover:underline">{isTa ? 'ஆய்வு செய்க →' : 'Audit Case →'}</span>
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
                    Status: <span className="text-slate-900 uppercase">{selectedApp.status}</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {isTa ? selectedApp.schemeId?.name?.ta : selectedApp.schemeId?.name?.en}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Applicant: <strong className="text-slate-900">{selectedApp.citizenId?.name}</strong> | District:{' '}
                    <strong className="text-slate-900">{selectedApp.citizenId?.district || 'Tamil Nadu'}</strong>
                  </p>
                </div>
              </div>

              {/* Per-Document Verification Cards List */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-900" />
                  <span>{isTa ? 'இணைக்கப்பட்ட சான்றிதழ்கள் சரிபார்ப்பு' : 'Attached Documents Verification Workbench'}</span>
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

                    return (
                      <div
                        key={doc._id}
                        className={`p-4 rounded-2xl border space-y-3 transition-all ${
                          isVerified
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : isCorrection
                            ? 'border-rose-300 bg-rose-50/30'
                            : isRejected
                            ? 'border-red-300 bg-red-50/30'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {/* Doc Title & Source Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                              {doc.docType}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-xs">
                              {isTa ? doc.documentName?.ta || doc.docType : doc.documentName?.en || doc.docType}
                            </h4>
                          </div>

                          {/* Source Badge */}
                          {isDigi ? (
                            <span className="px-2.5 py-1 bg-teal-50 text-teal-900 font-extrabold text-[10px] rounded-full border border-teal-200 flex items-center space-x-1 shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                              <span>Demo Document Source</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded border border-slate-200 shrink-0">
                              Manual File Upload
                            </span>
                          )}
                        </div>

                        {/* Details Row */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-slate-600">
                          <div>
                            <span className="text-slate-400 block">{isTa ? 'வழங்கியவர்:' : 'Issuer:'}</span>
                            <span className="font-bold text-slate-800">{doc.issuer || 'Govt of Tamil Nadu'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">{isTa ? 'பெறப்பட்ட தேதி:' : 'Date:'}</span>
                            <span className="font-bold text-slate-800">
                              {new Date(doc.retrievedAt || doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {doc.ocrConfidence ? (
                            <div className="col-span-2 flex items-center justify-between text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-1 rounded border border-teal-200">
                              <span>OCR Scan Readiness Match:</span>
                              <span>{doc.ocrConfidence}% Confidence</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Current Verification Status Indicator */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-bold text-slate-600">{isTa ? 'சரிபார்ப்பு நிலை:' : 'Verification State:'}</span>
                          {isVerified && (
                            <span className="text-emerald-800 font-extrabold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{isTa ? 'அதிகாரியால் சரிபார்க்கப்பட்டது' : 'Officer Verified'}</span>
                            </span>
                          )}

                          {isCorrection && (
                            <span className="text-rose-900 font-extrabold bg-rose-100 px-3 py-1 rounded-full border border-rose-300 flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                              <span>{isTa ? 'திருத்தம் கேட்கப்பட்டுள்ளது' : 'Correction Requested'}</span>
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

                        {doc.officerRemarks && (
                          <p className="text-xs text-slate-600 italic bg-slate-100 p-2 rounded-lg">
                            Remark: "{doc.officerRemarks}"
                          </p>
                        )}

                        {/* Correction Remarks Input Overlay */}
                        {activeDocForRemark === doc._id && (
                          <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-2">
                            <label className="font-extrabold text-amber-950 text-xs block">
                              {isTa ? 'திருத்தத்திற்கான குறிப்பு வழங்கவும்:' : 'Specify Officer Remark for Citizen Correction:'}
                            </label>
                            <textarea
                              rows={2}
                              value={docRemark}
                              onChange={(e) => setDocRemark(e.target.value)}
                              placeholder="e.g. Document image is blurry. Please provide clear copy."
                              className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setActiveDocForRemark(null)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleVerifyDocument(doc._id, 'CORRECTION_REQUIRED', docRemark)}
                                className="px-3 py-1 bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send Correction Request</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Per-Document Officer Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleVerifyDocument(doc._id, 'VERIFIED')}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-lg flex items-center space-x-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isTa ? 'சரிபார் (Verify)' : 'Verify Document'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveDocForRemark(doc._id);
                              setDocRemark('');
                            }}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-extrabold rounded-lg flex items-center space-x-1 shadow-2xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{isTa ? 'திருத்தம் கோருக' : 'Request Correction'}</span>
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
                  {isTa ? 'முழுமையான வழக்கு முடிவு:' : 'Final Case Decision:'}
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
    </div>
  );
};
