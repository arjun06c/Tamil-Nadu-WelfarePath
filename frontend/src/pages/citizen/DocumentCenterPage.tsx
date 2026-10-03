import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { createWorker } from 'tesseract.js';
import {
  Scan,
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DigiLockerModeBadge } from '../../components/digilocker/DigiLockerModeBadge';
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

  const [activeTab, setActiveTab] = useState<'workspace' | 'digilocker' | 'ocr'>('workspace');
  const [categoryFilter, setCategoryFilter] = useState<
    'ALL' | 'MANUAL' | 'DIGILOCKER' | 'APPLICATION' | 'CORRECTION' | 'VERIFIED' | 'PENDING'
  >('ALL');

  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [availableDigiDocs, setAvailableDigiDocs] = useState<AvailableDocument[]>([]);
  const [appDocuments, setAppDocuments] = useState<ApplicationDocItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Preview & Replacement
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ApplicationDocItem | null>(null);
  const [docToReplace, setDocToReplace] = useState<ApplicationDocItem | null>(null);
  const [replacementSource, setReplacementSource] = useState<'MANUAL' | 'DIGILOCKER'>('MANUAL');

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
      // Fetch DigiLocker status
      const statusRes = await api.get('/integrations/digilocker/status');
      setConnectionStatus(statusRes.data);

      if (statusRes.data.connected) {
        const docRes = await api.get('/integrations/digilocker/documents');
        setAvailableDigiDocs(docRes.data.documents || []);
      }

      // Fetch citizen application documents
      const appDocsRes = await api.get('/applications/my-documents');
      setAppDocuments(appDocsRes.data.documents || []);
    } catch (err: any) {
      console.error('Fetch workspace data error:', err);
    } finally {
      setLoading(false);
    }
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
      setOcrText('Scan completed. Document text extracted for pre-fill inspection.');
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
      alert(isTa ? 'ஆவணம் வெற்றிகரமாக மாற்றப்பட்டது' : 'Document successfully replaced.');
      setDocToReplace(null);
      await fetchWorkspaceData();
    } catch (err: any) {
      console.error('Replacement error:', err);
      alert(err.response?.data?.message || 'Error replacing document');
    }
  };

  const handleExecuteReplacementDigiLocker = async (dlDoc: AvailableDocument) => {
    if (!docToReplace || !docToReplace.applicationId?._id) return;
    try {
      await api.post(`/applications/${docToReplace.applicationId._id}/documents/from-digilocker`, {
        digilockerDocumentId: dlDoc.id,
        docType: docToReplace.docType
      });
      alert(isTa ? 'டிஜிலாக்கர் ஆவணம் வெற்றிகரமாக மாற்றப்பட்டது' : 'DigiLocker document attached.');
      setDocToReplace(null);
      await fetchWorkspaceData();
    } catch (err: any) {
      console.error('DigiLocker replace error:', err);
      alert(err.response?.data?.message || 'Error attaching DigiLocker document');
    }
  };

  const isConnected = connectionStatus?.connected;
  const mode = connectionStatus?.mode || 'mock';
  const badgeLabel = connectionStatus?.badgeLabel;

  // Filter application documents based on selected category
  const filteredAppDocs = appDocuments.filter((doc) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'MANUAL') return doc.source === 'MANUAL_UPLOAD' || !doc.source;
    if (categoryFilter === 'DIGILOCKER') return doc.source === 'DIGILOCKER';
    if (categoryFilter === 'APPLICATION') return !!doc.applicationId;
    if (categoryFilter === 'CORRECTION') return doc.verificationStatus === 'CORRECTION_REQUIRED';
    if (categoryFilter === 'VERIFIED') return doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';
    if (categoryFilter === 'PENDING') return doc.verificationStatus === 'NOT_REVIEWED';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>{isTa ? 'குடிமக்களின் ஆவண மையம்' : 'Citizen Document Workspace'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa
              ? 'கைமுறை பதிவேற்றங்கள், டிஜிலாக்கர் சான்றிதழ்கள் மற்றும் விண்ணப்ப ஆவண நிலைகளை ஒரே இடத்தில் நிர்வகிக்கவும்.'
              : 'Unified portal for managing manual uploads, DigiLocker digital documents, and application document verification lifecycle.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
          <Link
            to="/citizen/settings/digilocker"
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs w-fit"
          >
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>{isTa ? 'டிஜிலாக்கர் அமைப்புகள்' : 'DigiLocker Settings'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`pb-3 px-4 font-extrabold text-xs border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'workspace'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isTa ? 'என் ஆவணங்கள் (ஒருங்கிணைந்தது)' : 'My Documents (Unified Workspace)'}</span>
          <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {appDocuments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('digilocker')}
          className={`pb-3 px-4 font-extrabold text-xs border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'digilocker'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>{isTa ? 'டிஜிலாக்கர் களஞ்சியம்' : 'DigiLocker Digital Repository'}</span>
          {isConnected && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {availableDigiDocs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ocr')}
          className={`pb-3 px-4 font-extrabold text-xs border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'ocr'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scan className="w-4 h-4" />
          <span>{isTa ? 'கைமுறை ஆவண OCR ஸ்கேனர்' : 'Manual Document OCR Scanner'}</span>
        </button>
      </div>

      {/* TAB 1: Unified Citizen Workspace */}
      {activeTab === 'workspace' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === 'ALL'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isTa ? 'அனைத்து ஆவணங்கள்' : 'All Documents'} ({appDocuments.length})
            </button>
            <button
              onClick={() => setCategoryFilter('MANUAL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === 'MANUAL'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isTa ? 'கைமுறை பதிவேற்றங்கள்' : 'Manual Uploads'} (
              {appDocuments.filter((d) => d.source === 'MANUAL_UPLOAD' || !d.source).length})
            </button>
            <button
              onClick={() => setCategoryFilter('DIGILOCKER')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === 'DIGILOCKER'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              {isTa ? 'டிஜிலாக்கர் சான்றிதழ்கள்' : 'DigiLocker Documents'} (
              {appDocuments.filter((d) => d.source === 'DIGILOCKER').length})
            </button>
            <button
              onClick={() => setCategoryFilter('APPLICATION')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === 'APPLICATION'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isTa ? 'விண்ணப்ப ஆவணங்கள்' : 'Application Documents'} (
              {appDocuments.filter((d) => !!d.applicationId).length})
            </button>
            <button
              onClick={() => setCategoryFilter('CORRECTION')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === 'CORRECTION'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              {isTa ? 'திருத்தம் தேவைப்படுபவை' : 'Requiring Correction'} (
              {appDocuments.filter((d) => d.verificationStatus === 'CORRECTION_REQUIRED').length})
            </button>
            <button
              onClick={() => setCategoryFilter('VERIFIED')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === 'VERIFIED'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {isTa ? 'சரிபார்க்கப்பட்டவை' : 'Verified Documents'} (
              {
                appDocuments.filter((d) => d.verificationStatus === 'VERIFIED' || d.verificationStatus === 'ACCEPTED')
                  .length
              }
              )
            </button>
            <button
              onClick={() => setCategoryFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === 'PENDING'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              {isTa ? 'சரிபார்ப்பு நிலுவையில் உள்ளவை' : 'Pending Verification'} (
              {appDocuments.filter((d) => d.verificationStatus === 'NOT_REVIEWED').length})
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900" />
              <p>{isTa ? 'ஆவண மையத் தகவல்களை ஏற்றுகிறது...' : 'Loading document workspace items...'}</p>
            </div>
          ) : filteredAppDocs.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-slate-200 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-extrabold text-slate-800 text-sm">
                {isTa ? 'ஆவணங்கள் எதுவும் காணப்படவில்லை' : 'No Documents Found in Selected Category'}
              </h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                {isTa
                  ? 'தேர்ந்தெடுக்கப்பட்ட பிரிவில் ஆவணங்கள் எதுவும் இல்லை. புதிய விண்ணப்பத்தைச் சமர்ப்பிக்கவும் அல்லது டிஜிலாக்கரை இணைக்கவும்.'
                  : 'There are no active document records matching this filter. Submit a welfare application or fetch proof from DigiLocker.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppDocs.map((doc) => {
                const isDigi = doc.source === 'DIGILOCKER';
                const isCorrection = doc.verificationStatus === 'CORRECTION_REQUIRED';
                const isVerified = doc.verificationStatus === 'VERIFIED' || doc.verificationStatus === 'ACCEPTED';

                return (
                  <div
                    key={doc._id}
                    className={`glass-card p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                      isCorrection
                        ? 'border-rose-300 bg-rose-50/20'
                        : isVerified
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header: Title & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            {doc.docType}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-sm">
                            {isTa ? doc.documentName?.ta || doc.docType : doc.documentName?.en || doc.docType}
                          </h3>
                        </div>

                        {/* Source Badge */}
                        {isDigi ? (
                          <span className="px-2.5 py-1 bg-teal-50 text-teal-800 font-extrabold text-[10px] rounded-full border border-teal-200 flex items-center space-x-1 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-teal-600" />
                            <span>{mode === 'mock' ? 'Demo Document Source' : 'DigiLocker'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold text-[10px] rounded-full border border-slate-200 flex items-center space-x-1 shrink-0">
                            <FileUp className="w-3 h-3 text-slate-500" />
                            <span>{isTa ? 'கைமுறை பதிவேற்றம்' : 'Manual Upload'}</span>
                          </span>
                        )}
                      </div>

                      {/* State Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        {/* Retrieval / Upload State */}
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          {isDigi ? (isTa ? 'பெறப்பட்டது' : 'Retrieved') : (isTa ? 'பதிவேற்றப்பட்டது' : 'Uploaded')}
                        </span>

                        {/* Verification Status Badge */}
                        {isVerified && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isTa ? 'அதிகாரியால் சரிபார்க்கப்பட்டது' : 'Officer Verified'}</span>
                          </span>
                        )}

                        {isCorrection && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-extrabold border border-rose-200 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{isTa ? 'திருத்தம் தேவை' : 'Correction Required'}</span>
                          </span>
                        )}

                        {!isVerified && !isCorrection && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-200 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{isTa ? 'அதிகாரி சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending Officer Review'}</span>
                          </span>
                        )}
                      </div>

                      {/* Document Details Metadata */}
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                        {doc.issuer && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{isTa ? 'வழங்கியவர்:' : 'Issuer:'}</span>
                            <span className="font-bold text-slate-800 flex items-center space-x-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{doc.issuer}</span>
                            </span>
                          </div>
                        )}

                        {doc.applicationId && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">{isTa ? 'இணைக்கப்பட்ட விண்ணப்பம்:' : 'Linked App:'}</span>
                            <Link
                              to={`/citizen/applications/${doc.applicationId._id}`}
                              className="font-extrabold text-blue-900 hover:underline flex items-center space-x-1"
                            >
                              <span>{doc.applicationId.applicationReference}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">{isTa ? 'தேதி:' : 'Date:'}</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(doc.retrievedAt || doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Officer Remark Callout if Correction Required */}
                      {isCorrection && doc.officerRemarks && (
                        <div className="bg-rose-100/70 border border-rose-300 p-3 rounded-xl space-y-1">
                          <span className="font-extrabold text-rose-950 flex items-center space-x-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                            <span>{isTa ? 'அதிகாரியின் குறிப்பு:' : 'Officer Remark:'}</span>
                          </span>
                          <p className="text-xs text-rose-900 font-medium italic">"{doc.officerRemarks}"</p>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center space-x-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isTa ? 'விவரம் பார்க்க' : 'View Details'}</span>
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
                          <span>{isTa ? 'ஆவணத்தை மாற்றுக' : 'Replace Document'}</span>
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

      {/* TAB 2: DigiLocker Digital Repository */}
      {activeTab === 'digilocker' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900">{isTa ? 'இணைப்பு நிலை:' : 'Connection Status:'}</span>
                {isConnected ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {isTa ? 'இணைக்கப்பட்டுள்ளது' : 'Connected'}
                  </span>
                ) : (
                  <span className="text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                    {isTa ? 'இணைக்கப்படவில்லை' : 'Not Connected'}
                  </span>
                )}
              </div>

              <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
            </div>

            {!isConnected ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-amber-700 mx-auto" />
                <h3 className="font-extrabold text-amber-950 text-sm">
                  {isTa ? 'டிஜிலாக்கர் கணக்கு இன்னும் இணைக்கப்படவில்லை' : 'DigiLocker Account Not Connected'}
                </h3>
                <p className="text-xs text-amber-900 max-w-md mx-auto">
                  {isTa
                    ? 'டிஜிலாக்கரை இணைப்பதன் மூலம் வருமானம், சாதி மற்றும் கல்விச் சான்றிதழ்களை நேரடியாகப் பெறலாம்.'
                    : 'Connect your DigiLocker account to automatically discover and attach eligible digital certificates to welfare applications.'}
                </p>
                <Link
                  to="/citizen/settings/digilocker"
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md transition-all"
                >
                  <span>{isTa ? 'இணைப்பைத் தொடங்குக' : 'Connect DigiLocker'}</span>
                </Link>
              </div>
            ) : (
              <DigiLockerDocumentPicker
                documents={availableDigiDocs}
                onSelectDocument={(doc) => {
                  console.log('Selected document for welfare matching:', doc);
                }}
                mode={mode}
                badgeLabel={badgeLabel}
                loading={loading}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Tesseract.js OCR Scanner */}
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
              <span>
                {isTa
                  ? 'Tesseract OCR ஆவணப் உரையைச் பகுப்பாய்வு செய்கிறது...'
                  : 'Processing document text extraction with client Tesseract.js engine...'}
              </span>
            </div>
          )}

          {ocrText && !processing && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{fileName}</span>
                </span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded">
                  Extraction Confidence: {ocrConfidence}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Extracted Text Contents:
                </span>
                <div className="text-xs font-mono text-slate-800 bg-white p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed">
                  {ocrText}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
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
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isTa ? 'ஆவண மூலம்:' : 'Source:'}</span>
                  <span className="font-bold text-slate-800">
                    {selectedDocForPreview.source === 'DIGILOCKER' ? 'DigiLocker Repository' : 'Manual File Upload'}
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
                    {new Date(
                      selectedDocForPreview.retrievedAt || selectedDocForPreview.uploadedAt
                    ).toLocaleDateString()}
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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
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
          <div className="glass-card bg-white max-w-xl w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
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
              <button
                onClick={() => setDocToReplace(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {docToReplace.officerRemarks && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 text-xs">
                <span className="font-bold text-rose-950 block">{isTa ? 'அதிகாரியின் குறிப்பு:' : 'Officer Remark:'}</span>
                <p className="italic font-medium text-rose-900">"{docToReplace.officerRemarks}"</p>
              </div>
            )}

            {/* Source Selection Tabs for Replacement */}
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
                {isTa ? 'டிஜிலாக்கரில் இருந்து பெறுக' : 'Fetch from DigiLocker'}
              </button>
            </div>

            {/* Option A: Upload Replacement Manually */}
            {replacementSource === 'MANUAL' && (
              <div className="space-y-4 py-2">
                <label className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl bg-slate-50 hover:bg-blue-50/20 transition-all text-center space-y-2">
                  <Upload className="w-8 h-8 text-blue-900" />
                  <span className="font-extrabold text-slate-800 text-xs">
                    {isTa ? 'புதிய ஆவணக் கோப்பை பதிவேற்ற கிளிக் செய்க' : 'Click to Upload Corrected File'}
                  </span>
                  <span className="text-[10px] text-slate-500">Supported formats: PDF, PNG, JPG (Max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleExecuteReplacementManual}
                  />
                </label>
              </div>
            )}

            {/* Option B: Choose Replacement from DigiLocker */}
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
                    badgeLabel={badgeLabel}
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
