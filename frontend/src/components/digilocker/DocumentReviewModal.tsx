import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  ArrowRight,
  FileText,
  Eye,
  Info,
  RefreshCw
} from 'lucide-react';
import { DigiLockerModeBadge } from './DigiLockerModeBadge';
import { type AvailableDocument } from './DigiLockerDocumentPicker';
import { useNavigate } from 'react-router-dom';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AvailableDocument | any;
  mode?: string;
  badgeLabel?: string;
  profileIncome?: number;
  onConfirmUse: (doc: any) => void;
  loading?: boolean;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  isOpen,
  onClose,
  document,
  mode = 'mock',
  badgeLabel,
  profileIncome,
  onConfirmUse,
  loading = false
}) => {
  const { lang } = useAuth();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  if (!isOpen || !document) return null;

  const isDigi = document.source === 'DIGILOCKER' || !document.fileUrl;
  const docType = document.documentType || document.docType || 'Certificate';
  const nameEn = document.name?.en || document.documentName?.en || docType;
  const nameTa = document.name?.ta || document.documentName?.ta || docType;
  const issuer = document.issuer || 'Revenue & Disaster Management Dept, Govt of Tamil Nadu';
  const issueDate = document.issueDate || '12 May 2025';

  // Metadata / Extracted Data
  const metadata = document.metadata || document.extractedData || {};
  const extractedIncome = metadata.annualFamilyIncome || metadata.incomeAmount || (docType === 'IncomeCertificate' ? 120000 : null);
  const certNo = metadata.certificateNumber || document.documentReference || 'TN-2026-981023';

  // Data conflict check
  const hasIncomeConflict =
    profileIncome !== undefined &&
    extractedIncome !== null &&
    profileIncome !== extractedIncome;

  const handleFindSchemes = () => {
    onConfirmUse(document);
    navigate('/citizen/eligibility');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-card bg-white max-w-xl w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded">
                {isTa ? 'ஆவண ஆய்வு & சரிபார்ப்பு முன்னோட்டம்' : 'Document Review & Data Inspection'}
              </span>
              <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
            </div>
            <h2 className="text-base font-black text-slate-900 mt-1">
              {isTa ? nameTa : nameEn}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provenance & Status Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 block font-semibold">{isTa ? 'ஆவண ஆதாரம்:' : 'Document Source:'}</span>
              <span className="font-extrabold text-slate-800 flex items-center space-x-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{isDigi ? (mode === 'mock' ? 'Demo Document Source' : 'DigiLocker') : 'Manual Upload'}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">{isTa ? 'ஆவண நிலை:' : 'Retrieval Status:'}</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] inline-block mt-0.5">
                {isTa ? 'வெற்றிகரமாக பெறப்பட்டது' : 'Retrieved Successfully'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">{isTa ? 'சரிபார்ப்பு நிலை:' : 'Verification Status:'}</span>
              <span className="font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center space-x-1 mt-0.5">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{isTa ? 'அதிகாரி சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending Officer Review'}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">{isTa ? 'வழங்கிய அமைப்பு:' : 'Issuer Authority:'}</span>
              <span className="font-bold text-slate-800 truncate block mt-0.5" title={issuer}>
                {issuer}
              </span>
            </div>
          </div>
        </div>

        {/* Extracted Document Facts Section */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-purple-900" />
            <span>{isTa ? 'ஆவணத்தில் உள்ள பெறப்பட்ட தகவல்கள்' : 'Extracted / Available Document Information'}</span>
          </h3>

          <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">{isTa ? 'சான்றிதழ் எண்:' : 'Certificate Number:'}</span>
              <span className="font-mono font-bold text-purple-950">{certNo}</span>
            </div>

            {extractedIncome !== null && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">{isTa ? 'ஆண்டு குடும்ப வருமானம்:' : 'Annual Family Income:'}</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  ₹{Number(extractedIncome).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">{isTa ? 'வழங்கப்பட்ட தேதி:' : 'Issue Date:'}</span>
              <span className="font-semibold text-slate-800">{issueDate}</span>
            </div>
          </div>
        </div>

        {/* Data Conflict Warning Banner */}
        {hasIncomeConflict && (
          <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl flex items-start space-x-3 text-xs text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-amber-950 text-xs">
                {isTa ? 'சுயவிவர தகவல் வேறுபாடு கண்டறியப்பட்டது' : 'Information Differs From Your Profile'}
              </h4>
              <p className="text-[11px] leading-relaxed text-amber-900">
                {isTa
                  ? `உங்கள் சுயவிவரத்தில் ஆண்டு வருமானம் ₹${profileIncome?.toLocaleString('en-IN')} என உள்ளது, ஆனால் இந்த சான்றிதழில் ₹${extractedIncome?.toLocaleString('en-IN')} எனக் குறிப்பிடப்பட்டுள்ளது. அதிகாரி சரிபார்க்கும் போது சான்றிதழ் தகவல் முன்னுரிமை பெறும்.`
                  : `Profile states annual income ₹${profileIncome?.toLocaleString('en-IN')}, but certificate states ₹${extractedIncome?.toLocaleString('en-IN')}. Certificate facts will take precedence upon officer verification.`}
              </p>
            </div>
          </div>
        )}

        {/* Factual Disclaimer */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            {isTa
              ? 'குறிப்பு: டிஜிலாக்கரில் இருந்து சான்றிதழைப் பெறுவது தானியங்கி அதிகாரி அங்கீகாரம் ஆகாது. சான்றிதழ் தகவல்கள் முதற்கட்ட தகுதி மதிப்பீட்டிற்கு மட்டுமே பயன்படுத்தப்படும்.'
              : 'Note: Retrieving documents attaches proof for preliminary evaluation. Official government benefit approval requires district officer audit.'}
          </p>
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
          >
            {isTa ? 'ரத்து செய்' : 'Cancel'}
          </button>

          <button
            onClick={() => onConfirmUse(document)}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
            <span>{isTa ? 'உறுதிசெய்து பயன்படுத்துக' : 'Confirm & Use Document'}</span>
          </button>

          <button
            onClick={handleFindSchemes}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isTa ? 'தகுதியான திட்டங்களைக் காண்க' : 'Find Relevant Schemes'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
