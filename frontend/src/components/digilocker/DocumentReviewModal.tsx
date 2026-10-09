import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Clock,
  X,
  CheckCircle2,
  FileText,
  Info,
  RefreshCw,
  Building,
  Calendar,
  User,
  Hash,
  IndianRupee
} from 'lucide-react';
import { DigiLockerModeBadge } from './DigiLockerModeBadge';
import { type AvailableDocument } from './DigiLockerDocumentPicker';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AvailableDocument | any;
  mode?: string;
  badgeLabel?: string;
  profileIncome?: number;
  onConfirmUse: (doc: any) => Promise<void> | void;
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
  const { lang, user } = useAuth();
  const isTa = lang === 'ta';

  if (!isOpen || !document) return null;

  const docType = document.documentType || document.docType || 'Certificate';
  const nameEn = document.name?.en || document.documentName?.en || docType;
  const nameTa = document.name?.ta || document.documentName?.ta || docType;
  const issuer = document.issuer || 'Revenue Department';
  const issueDate = document.issueDate || '15 Jun 2026';

  // Extract Metadata/Fields
  const metadata = document.metadata || document.extractedData || {};
  const certNo = metadata.certificateNumber || document.documentReference || document.sourceReference || 'TN-INC-12345';
  const applicantName = metadata.applicantName || user?.name || 'Kavitha R';
  const annualIncome = metadata.annualFamilyIncome || metadata.incomeAmount || (docType.toLowerCase().includes('income') ? 120000 : null);

  const handleConfirm = async () => {
    await onConfirmUse(document);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-card bg-white max-w-lg w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                {isTa ? 'சான்றிதழ் சரிபார்ப்பு' : 'Review Document'}
              </span>
              <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              {isTa ? nameTa : nameEn}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Core Concepts: Source, Retrieval, Verification */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            {/* 1. SOURCE */}
            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">{isTa ? 'ஆதாரம்:' : 'Source:'}</span>
              <span className="font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded inline-flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>DigiLocker</span>
              </span>
            </div>

            {/* 2. RETRIEVAL */}
            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">{isTa ? 'பெறப்பட்டது:' : 'Retrieval:'}</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded inline-flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isTa ? 'வெற்றி' : 'Successful'}</span>
              </span>
            </div>

            {/* 3. VERIFICATION */}
            <div className="space-y-1">
              <span className="text-slate-400 block font-semibold">{isTa ? 'சரிபார்ப்பு:' : 'Verification:'}</span>
              <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded inline-flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{isTa ? 'அதிகாரி நிலுவை' : 'Pending Officer Review'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Document Details Section */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-blue-900" />
            <span>{isTa ? 'ஆவண விவரங்கள்' : 'Document Details'}</span>
          </h3>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs shadow-2xs">
            
            {/* Applicant Name */}
            {applicantName && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTa ? 'விண்ணப்பதாரர் பெயர்:' : 'Applicant Name:'}</span>
                </span>
                <span className="font-bold text-slate-900">{applicantName}</span>
              </div>
            )}

            {/* Annual Income (if present) */}
            {annualIncome !== null && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold flex items-center space-x-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isTa ? 'ஆண்டு குடும்ப வருமானம்:' : 'Annual Family Income:'}</span>
                </span>
                <span className="font-black text-emerald-800 text-sm">
                  ₹{Number(annualIncome).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Certificate Number */}
            {certNo && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTa ? 'சான்றிதழ் எண்:' : 'Certificate Number:'}</span>
                </span>
                <span className="font-mono font-bold text-blue-950">{certNo}</span>
              </div>
            )}

            {/* Issue Date */}
            {issueDate && (
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTa ? 'வழங்கப்பட்ட தேதி:' : 'Issue Date:'}</span>
                </span>
                <span className="font-semibold text-slate-800">{issueDate}</span>
              </div>
            )}

            {/* Issuer Authority */}
            {issuer && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTa ? 'வழங்கிய அமைப்பு:' : 'Issued By:'}</span>
                </span>
                <span className="font-bold text-slate-800">{issuer}</span>
              </div>
            )}

          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50/90 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-950 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isTa
              ? 'இந்த ஆவணம் டிஜிலாக்கரில் இருந்து பெறப்பட்டது. இது இன்னும் தமிழ்நாடு நலன்பாதை அதிகாரியால் சரிபார்க்கப்படவில்லை.'
              : 'This document was retrieved from DigiLocker. It has not yet been verified by a WelfarePath officer.'}
          </p>
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3 text-xs">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
          >
            {isTa ? 'ரத்து செய்' : 'Cancel'}
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            )}
            <span>{isTa ? 'உறுதிப்படுத்தி பயன்படுத்தவும்' : 'Confirm & Use Document'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
