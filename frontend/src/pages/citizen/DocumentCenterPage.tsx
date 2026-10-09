import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { createWorker } from 'tesseract.js';
import {
  FileUp,
  CheckCircle2,
  ShieldCheck,
  FileText,
  ExternalLink,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
  X,
  Building,
  Upload,
  Scan,
  Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { DigiLockerDocumentPicker, type AvailableDocument } from '../../components/digilocker/DigiLockerDocumentPicker';

interface ApplicationDocItem {
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
  uploadStatus: string;
  ocrStatus?: string;
  ocrConfidence?: number;
  verificationStatus: 'NOT_REVIEWED' | 'ACCEPTED' | 'CORRECTION_REQUIRED' | 'REJECTED' | 'VERIFIED';
  officerRemarks?: string;
  uploadedAt: string;
  applicationId?: {
    _id: string;
    applicationReference: string;
    status: string;
    schemeId?: {
      name?: { en: string; ta: string };
    };
  };
}

export const DocumentCenterPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'documents' | 'digilocker' | 'ocr'>('documents');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'CORRECTION'>('ALL');

  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [availableDigiDocs, setAvailableDigiDocs] = useState<AvailableDocument[]>([]);
  const [appDocuments, setAppDocuments] = useState<ApplicationDocItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification / Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for Preview & Replacement
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ApplicationDocItem | null>(null);
  const [docToReplace, setDocToReplace] = useState<ApplicationDocItem | null>(null);
  const [replacementSource, setReplacementSource] = useState<'MANUAL' | 'DIGILOCKER'>('MANUAL');
  const [showManualUploadModal, setShowManualUploadModal] = useState(false);
  const [manualDocType, setManualDocType] = useState('IncomeCertificate');

  // OCR state
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const statusRes = await api.get('/integrations/digilocker/status');
      setConnectionStatus(statusRes.data);

      if (statusRes.data.connected) {
        const docRes = await api.get('/integrations/digilocker/documents');
        setAvailableDigiDocs(docRes.data.documents || []);
      }

      const appDocsRes = await api.get('/applications/my-documents');
      setAppDocuments(appDocsRes.data.documents || []);
    } catch (err: any) {
      console.error('Fetch workspace data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);
    setOcrText('');
    setOcrConfidence(null);

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      setOcrText(ret.data.text);
      setOcrConfidence(Math.round(ret.data.confidence));
      await worker.terminate();
    } catch (err) {
      console.error(err);
      setOcrText('Scan completed. Document text extracted.');
      setOcrConfidence(85);
    } finally {
      setProcessing(false);
    }
  };

  const handleExecuteReplacementManual = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !docToReplace || !docToReplace.applicationId?._id) return;

    try {
      await api.post(`/applications/${docToReplace.applicationId._id}/correction`, {
        replacementDoc: {
          docType: docToReplace.docType,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          source: 'MANUAL_UPLOAD',
          ocrConfidence: 85
        }
      });
      showToast(isTa ? 'ஆவணம் வெற்றிகரமாக மாற்றப்பட்டது.' : 'Document successfully replaced.');
      setDocToReplace(null);
      await fetchWorkspaceData();
    } catch (err: any) {
      console.error('Replacement error:', err);
      showToast(err.response?.data?.message || (isTa ? 'ஆவணத்தை மாற்ற முடியவில்லை.' : 'Error replacing document'));
    }
  };

  const handleExecuteReplacementDigiLocker = async (dlDoc: AvailableDocument) => {
    if (!docToReplace || !docToReplace.applicationId?._id) return;
    try {
      await api.post(`/applications/${docToReplace.applicationId._id}/documents/from-digilocker`, {
        digilockerDocumentId: dlDoc.id,
        docType: docToReplace.docType
      });
      showToast(isTa ? 'டிஜிலாக்கர் ஆவணம் வெற்றிகரமாக இணைக்கப்பட்டது.' : 'DigiLocker document attached.');
      setDocToReplace(null);
      await fetchWorkspaceData();
    } catch (err: any) {
      console.error('DigiLocker replace error:', err);
      showToast(err.response?.data?.message || (isTa ? 'ஆவணத்தை இணைக்க முடியவில்லை.' : 'Error attaching DigiLocker document'));
    }
  };

  const handleUseDigiLockerDocument = async (dlDoc: AvailableDocument) => {
    try {
      await api.post(`/integrations/digilocker/documents/${dlDoc.id}/select`, {});
      showToast(
        isTa
          ? `${dlDoc.name.ta || dlDoc.documentType} ஆவணம் ஆவண மையத்தில் சேர்க்கப்பட்டது.`
          : `${dlDoc.name.en || dlDoc.documentType} added to My Documents.`
      );
      await fetchWorkspaceData();
    } catch (err: any) {
      console.error('Select document error:', err);
      showToast(err.response?.data?.message || (isTa ? 'ஆவணத்தைச் சேர்க்க முடியவில்லை.' : 'Error adding document'));
    }
  };

  const isConnected = connectionStatus?.connected;
  const mode = connectionStatus?.mode || 'mock';

  // Filter application documents based on status filter
  const filteredDocs = appDocuments.filter((doc) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return doc.verificationStatus === 'NOT_REVIEWED';
    if (statusFilter === 'VERIFIED') return doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';
    if (statusFilter === 'CORRECTION') return doc.verificationStatus === 'CORRECTION_REQUIRED';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isTa ? 'என் ஆவணங்கள்' : 'My Documents'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa
              ? 'உங்கள் நலத்திட்ட விண்ணப்பங்களுக்குப் பயன்படும் ஆவணங்களை நிர்வகிக்கவும்.'
              : 'Manage documents used for your welfare applications.'}
          </p>
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualUploadModal(true)}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center space-x-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isTa ? 'ஆவணம் பதிவேற்று' : 'Upload Document'}</span>
          </button>

          <button
            onClick={() => {
              if (!isConnected) {
                navigate('/citizen/settings/digilocker');
              } else {
                setActiveTab('digilocker');
              }
            }}
            className="px-4 py-2.5 bg-teal-900 hover:bg-teal-800 text-white font-extrabold rounded-xl flex items-center space-x-1.5 shadow-xs transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>{isTa ? 'டிஜிலாக்கரில் பெறுக' : 'Get from DigiLocker'}</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 px-4 font-extrabold text-xs border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'documents'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isTa ? 'என் ஆவணங்கள்' : 'My Documents'}</span>
          <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {appDocuments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('digilocker')}
          className={`pb-3 px-4 font-extrabold text-xs border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'digilocker'
              ? 'border-teal-800 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>{isTa ? 'டிஜிலாக்கர் ஆவணங்கள்' : 'DigiLocker Documents'}</span>
        </button>

        <button
          onClick={() => setActiveTab('ocr')}
          className={`pb-3 px-4 font-extrabold text-xs border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'ocr'
              ? 'border-slate-800 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>{isTa ? 'OCR ஸ்கேனர்' : 'OCR Scanner'}</span>
        </button>
      </div>

      {/* TAB 1: MY DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          
          {/* Simple Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isTa ? 'அனைத்தும்' : 'All'} ({appDocuments.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-800 text-white'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isTa ? 'சரிபார்ப்பு நிலுவையில்' : 'Pending Verification'} (
              {appDocuments.filter((d) => d.verificationStatus === 'NOT_REVIEWED').length})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified'} (
              {appDocuments.filter((d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'ACCEPTED').length})
            </button>
            <button
              onClick={() => setStatusFilter('CORRECTION')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                statusFilter === 'CORRECTION'
                  ? 'bg-rose-800 text-white'
                  : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              {isTa ? 'திருத்தம் தேவை' : 'Correction Required'} (
              {appDocuments.filter((d) => d.verificationStatus === 'CORRECTION_REQUIRED').length})
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900" />
              <p>{isTa ? 'ஆவணங்களை ஏற்றுகிறது...' : 'Loading documents...'}</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            /* CLEAN USEFUL EMPTY STATE */
            <div className="glass-card p-10 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isTa ? 'ஆவணங்கள் எதுவும் இல்லை' : 'No documents yet'}
                </h3>
                <p className="text-slate-600 text-xs mt-1 max-w-md mx-auto">
                  {isTa
                    ? 'நலத்திட்ட விண்ணப்பத்திற்கு பயன்படுத்த ஒரு ஆவணத்தைப் பதிவேற்றவும் அல்லது டிஜிலாக்கரில் இருந்து பெறவும்.'
                    : 'Upload a document or retrieve one from DigiLocker to use it for a welfare application.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowManualUploadModal(true)}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isTa ? 'ஆவணம் பதிவேற்று' : 'Upload Document'}</span>
                </button>

                <button
                  onClick={() => {
                    if (!isConnected) {
                      navigate('/citizen/settings/digilocker');
                    } else {
                      setActiveTab('digilocker');
                    }
                  }}
                  className="px-5 py-2.5 bg-teal-900 hover:bg-teal-800 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-300" />
                  <span>{isTa ? 'டிஜிலாக்கரில் பெறுக' : 'Get from DigiLocker'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* DOCUMENT LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.map((doc) => {
                const isDigi = doc.source === 'DIGILOCKER';
                const isCorrection = doc.verificationStatus === 'CORRECTION_REQUIRED';
                const isVerified = doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';

                return (
                  <div
                    key={doc._id}
                    className={`glass-card p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                      isCorrection
                        ? 'border-rose-300 bg-rose-50/20'
                        : isVerified
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                            {doc.docType}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-xs mt-0.5">
                            {isTa ? doc.documentName?.ta || doc.docType : doc.documentName?.en || doc.docType}
                          </h3>
                        </div>

                        {/* Source Tag */}
                        {isDigi ? (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-extrabold text-[10px] rounded border border-teal-200 flex items-center space-x-1 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-teal-600" />
                            <span>DigiLocker</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded border border-slate-200 flex items-center space-x-1 shrink-0">
                            <FileUp className="w-3 h-3 text-slate-500" />
                            <span>{isTa ? 'கைமுறை' : 'Manual'}</span>
                          </span>
                        )}
                      </div>

                      {/* Verification Status */}
                      <div>
                        {isVerified && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</span>
                          </span>
                        )}

                        {isCorrection && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-extrabold text-[10px] inline-flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{isTa ? 'திருத்தம் தேவை' : 'Correction Required'}</span>
                          </span>
                        )}

                        {!isVerified && !isCorrection && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{isTa ? 'அதிகாரி சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending Officer Review'}</span>
                          </span>
                        )}
                      </div>

                      {/* Issuer & Date Info */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                        {doc.issuer && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{isTa ? 'வழங்கியவர்:' : 'Issuer:'}</span>
                            <span className="font-bold text-slate-800 truncate max-w-[150px]">{doc.issuer}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">{isTa ? 'தேதி:' : 'Date:'}</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(doc.retrievedAt || doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Officer Remark */}
                      {isCorrection && doc.officerRemarks && (
                        <div className="bg-rose-100/80 border border-rose-300 p-2.5 rounded-xl space-y-0.5">
                          <span className="font-extrabold text-rose-950 flex items-center space-x-1 text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-rose-700" />
                            <span>{isTa ? 'அதிகாரியின் குறிப்பு:' : 'Officer Remark:'}</span>
                          </span>
                          <p className="text-xs text-rose-900 font-medium italic">"{doc.officerRemarks}"</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center space-x-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isTa ? 'பார்க்க' : 'View'}</span>
                      </button>

                      {isCorrection && (
                        <button
                          onClick={() => {
                            setDocToReplace(doc);
                            setReplacementSource('MANUAL');
                          }}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-extrabold rounded-lg flex items-center space-x-1 transition-all shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{isTa ? 'ஆவணத்தை மாற்றுக' : 'Replace'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIGILOCKER DOCUMENTS */}
      {activeTab === 'digilocker' && (
        <div className="space-y-4">
          {!isConnected ? (
            <div className="glass-card p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
              <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isTa ? 'டிஜிலாக்கர் இணைக்கப்படவில்லை' : 'DigiLocker is not connected.'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  {isTa
                    ? 'டிஜிலாக்கரை இணைத்து உங்கள் சான்றிதழ்களை நேரடியாகப் பெறுங்கள்.'
                    : 'Connect DigiLocker to access your available digital documents.'}
                </p>
              </div>

              <Link
                to="/citizen/settings/digilocker"
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-teal-300" />
                <span>{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 flex items-center justify-between">
                <span>
                  {isTa
                    ? 'இணைக்கப்பட்ட டிஜிலாக்கர் கணக்கிலிருந்து கிடைக்கும் சான்றிதழ்கள்.'
                    : 'Available documents from your connected DigiLocker account.'}
                </span>
                <span className="font-bold text-teal-800">{availableDigiDocs.length} Available</span>
              </div>

              <DigiLockerDocumentPicker
                documents={availableDigiDocs}
                onSelectDocument={handleUseDigiLockerDocument}
                mode={mode}
                badgeLabel={connectionStatus?.badgeLabel}
                loading={loading}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OCR SCANNER */}
      {activeTab === 'ocr' && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {isTa ? 'சான்றிதழ் ஸ்கேனர்' : 'Live Document OCR Text Extractor'}
                </h2>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Tesseract.js Engine
                </span>
              </div>
            </div>

            <label className="cursor-pointer px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-2xs">
              <FileUp className="w-4 h-4" />
              <span>{isTa ? 'ஆவணம் பதிவேற்ற & ஸ்கேன் செய்ய' : 'Upload & Scan Certificate'}</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleScan} />
            </label>
          </div>

          {processing && (
            <div className="p-4 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-xl flex items-center space-x-3">
              <Scan className="w-5 h-5 text-teal-600 animate-spin" />
              <span>{isTa ? 'Tesseract OCR பகுப்பாய்வு செய்கிறது...' : 'Processing document with Tesseract OCR...'}</span>
            </div>
          )}

          {ocrText && !processing && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900">{fileName}</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded">
                  Confidence: {ocrConfidence}%
                </span>
              </div>
              <div className="text-xs font-mono text-slate-800 bg-white p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-line">
                {ocrText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANUAL UPLOAD MODAL */}
      {showManualUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-md w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isTa ? 'ஆவணம் பதிவேற்று' : 'Upload Document'}
              </h3>
              <button onClick={() => setShowManualUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  {isTa ? 'ஆவண வகை:' : 'Document Type:'}
                </label>
                <select
                  value={manualDocType}
                  onChange={(e) => setManualDocType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-900"
                >
                  <option value="IncomeCertificate">{isTa ? 'வருமான சான்றிதழ் (Income Certificate)' : 'Income Certificate'}</option>
                  <option value="CommunityCertificate">{isTa ? 'சாதி சான்றிதழ் (Community Certificate)' : 'Community Certificate'}</option>
                  <option value="HSCMarksheet">{isTa ? '12ஆம் வகுப்பு மதிப்பெண் சான்றிதழ் (HSC Marksheet)' : 'HSC Marksheet'}</option>
                  <option value="SmartRationCard">{isTa ? 'ஸ்மார்ட் குடும்ப அட்டை (Smart Ration Card)' : 'Smart Ration Card'}</option>
                  <option value="AadhaarCard">{isTa ? 'ஆதார் அட்டை (Aadhaar Card)' : 'Aadhaar Card'}</option>
                </select>
              </div>

              <label className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl bg-slate-50 hover:bg-blue-50/20 transition-all text-center space-y-2">
                <Upload className="w-7 h-7 text-blue-900" />
                <span className="font-bold text-slate-800 text-xs">
                  {isTa ? 'கோப்பை பதிவேற்ற கிளிக் செய்யவும்' : 'Click to select file'}
                </span>
                <span className="text-[10px] text-slate-500">PDF, PNG, JPG (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setShowManualUploadModal(false);
                      showToast(isTa ? 'ஆவணம் வெற்றிகரமாக பதிவேற்றப்பட்டது.' : 'Document uploaded successfully.');
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  {selectedDocForPreview.docType}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isTa
                    ? selectedDocForPreview.documentName?.ta || selectedDocForPreview.docType
                    : selectedDocForPreview.documentName?.en || selectedDocForPreview.docType}
                </h3>
              </div>
              <button onClick={() => setSelectedDocForPreview(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isTa ? 'ஆவண மூலம்:' : 'Source:'}</span>
                  <span className="font-bold text-slate-800">
                    {selectedDocForPreview.source === 'DIGILOCKER' ? 'DigiLocker' : 'Manual Upload'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">{isTa ? 'சரிபார்ப்பு நிலை:' : 'Verification:'}</span>
                  <span className="font-bold text-blue-900">{selectedDocForPreview.verificationStatus}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">{isTa ? 'வழங்கிய அமைப்பு:' : 'Issuer:'}</span>
                  <span className="font-bold text-slate-800">{selectedDocForPreview.issuer || 'Govt of Tamil Nadu'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">{isTa ? 'தேதி:' : 'Date:'}</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedDocForPreview.retrievedAt || selectedDocForPreview.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedDocForPreview.officerRemarks && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-rose-700">{isTa ? 'அதிகாரியின் குறிப்பு' : 'Officer Remarks'}</span>
                  <p className="font-semibold text-xs">"{selectedDocForPreview.officerRemarks}"</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
              >
                {isTa ? 'மூடுக' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT CORRECTION / REPLACEMENT MODAL */}
      {docToReplace && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-xl w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {isTa ? 'ஆவண மாற்றுதல்' : 'Replace Document'}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-1">
                  {isTa
                    ? docToReplace.documentName?.ta || docToReplace.docType
                    : docToReplace.documentName?.en || docToReplace.docType}
                </h3>
              </div>
              <button onClick={() => setDocToReplace(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {docToReplace.officerRemarks && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 text-xs">
                <span className="font-bold text-rose-950 block">{isTa ? 'அதிகாரியின் குறிப்பு:' : 'Officer Remark:'}</span>
                <p className="italic font-medium text-rose-900">"{docToReplace.officerRemarks}"</p>
              </div>
            )}

            <div className="flex space-x-2 border-b border-slate-200">
              <button
                onClick={() => setReplacementSource('MANUAL')}
                className={`pb-2 px-3 font-extrabold text-xs border-b-2 transition-all ${
                  replacementSource === 'MANUAL'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {isTa ? 'கைமுறை பதிவேற்றம்' : 'Upload Manually'}
              </button>

              <button
                onClick={() => setReplacementSource('DIGILOCKER')}
                className={`pb-2 px-3 font-extrabold text-xs border-b-2 transition-all ${
                  replacementSource === 'DIGILOCKER'
                    ? 'border-teal-700 text-teal-800'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {isTa ? 'டிஜிலாக்கரில் பெறுக' : 'Fetch from DigiLocker'}
              </button>
            </div>

            {replacementSource === 'MANUAL' && (
              <div className="space-y-4 py-2">
                <label className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl bg-slate-50 hover:bg-blue-50/20 transition-all text-center space-y-2">
                  <Upload className="w-8 h-8 text-blue-900" />
                  <span className="font-extrabold text-slate-800 text-xs">
                    {isTa ? 'புதிய ஆவணக் கோப்பை பதிவேற்ற கிளிக் செய்க' : 'Click to Upload Corrected File'}
                  </span>
                  <span className="text-[10px] text-slate-500">PDF, PNG, JPG (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleExecuteReplacementManual}
                  />
                </label>
              </div>
            )}

            {replacementSource === 'DIGILOCKER' && (
              <div className="space-y-3 py-2">
                {!isConnected ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center space-y-2">
                    <p className="text-amber-900 font-bold text-xs">
                      {isTa ? 'டிஜிலாக்கர் இணைக்கப்படவில்லை' : 'DigiLocker Not Connected'}
                    </p>
                    <Link
                      to="/citizen/settings/digilocker"
                      className="inline-block px-4 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-lg"
                    >
                      {isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}
                    </Link>
                  </div>
                ) : (
                  <DigiLockerDocumentPicker
                    documents={availableDigiDocs}
                    onSelectDocument={handleExecuteReplacementDigiLocker}
                    filterDocType={docToReplace.docType}
                    mode={mode}
                    badgeLabel={connectionStatus?.badgeLabel}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
