import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Search, CheckCircle2, Building2, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { DigiLockerModeBadge } from './DigiLockerModeBadge';
import { DocumentReviewModal } from './DocumentReviewModal';

export interface AvailableDocument {
  id: string;
  source: 'DIGILOCKER' | 'MANUAL_UPLOAD';
  sourceReference: string;
  documentType: string;
  name: {
    en: string;
    ta: string;
  };
  issuer: string;
  issueDate?: string;
  mimeType?: string;
  status: 'AVAILABLE' | 'SELECTED' | 'RETRIEVED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CORRECTION_REQUIRED';
}

interface DigiLockerDocumentPickerProps {
  documents: AvailableDocument[];
  onSelectDocument: (doc: AvailableDocument) => void;
  selectedDocId?: string;
  mode?: string;
  badgeLabel?: string;
  loading?: boolean;
  filterDocType?: string;
}

export const DigiLockerDocumentPicker: React.FC<DigiLockerDocumentPickerProps> = ({
  documents,
  onSelectDocument,
  selectedDocId,
  mode = 'mock',
  badgeLabel,
  loading = false,
  filterDocType
}) => {
  const { lang, profile } = useAuth();
  const isTa = lang === 'ta';
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingDoc, setReviewingDoc] = useState<AvailableDocument | null>(null);

  const profileIncome = (profile as any)?.annualIncome;

  const filtered = documents.filter((doc) => {
    const title = (isTa ? doc.name.ta : doc.name.en) || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.issuer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterDocType || doc.documentType.toLowerCase().includes(filterDocType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const handleConfirmDocUse = (doc: AvailableDocument) => {
    onSelectDocument(doc);
    setReviewingDoc(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 animate-pulse">
        {isTa ? 'டிஜிலாக்கர் சான்றிதழ்களைப் பெறுகிறது...' : 'Fetching eligible digital documents from DigiLocker...'}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-900" />
          <h3 className="font-extrabold text-slate-900 text-sm">
            {isTa ? 'கிடைக்கக்கூடிய டிஜிட்டல் ஆவணங்கள்' : 'Available Digital Documents'}
          </h3>
          <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isTa ? 'ஆவணத்தைத் தேடுக...' : 'Search document or issuer...'}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2">
          <FileText className="w-8 h-8 text-amber-600 mx-auto" />
          <h4 className="font-bold text-amber-950">
            {isTa ? 'பொருந்தும் ஆவணங்கள் எதுவும் இல்லை' : 'No Eligible Documents Found'}
          </h4>
          <p className="text-[11px] text-amber-800">
            {isTa
              ? 'உங்கள் டிஜிலாக்கர் கணக்கில் இந்த சான்றிதழ் கிடைக்கவில்லை என்றால், கைமுறையாக பதிவேற்றலாம்.'
              : 'If this certificate is not available in DigiLocker, you can choose Manual Upload.'}
          </p>
        </div>
      ) : (
        /* Document Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((doc) => {
            const isSelected = selectedDocId === doc.id || doc.status === 'SELECTED' || doc.status === 'RETRIEVED';
            const docTitle = isTa ? doc.name.ta : doc.name.en;

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-900 shadow-xs ring-1 ring-blue-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded">
                      {doc.documentType}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                      {docTitle}
                    </h4>
                  </div>
                  {isSelected && (
                    <span className="p-1 bg-emerald-600 text-white rounded-full shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.issuer}</span>
                  </div>
                  {doc.issueDate && (
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Issued: {doc.issueDate}</span>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500">
                    Source: {doc.source === 'DIGILOCKER' ? 'DigiLocker' : 'Manual Upload'}
                  </span>

                  <button
                    onClick={() => setReviewingDoc(doc)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-blue-900 hover:bg-blue-800 text-white shadow-2xs'
                    }`}
                  >
                    <span>{isSelected ? (isTa ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Selected') : (isTa ? 'பயன்படுத்துக' : 'Use Document')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DOCUMENT REVIEW MODAL */}
      <DocumentReviewModal
        isOpen={!!reviewingDoc}
        onClose={() => setReviewingDoc(null)}
        document={reviewingDoc}
        mode={mode}
        badgeLabel={badgeLabel}
        profileIncome={profileIncome}
        onConfirmUse={handleConfirmDocUse}
      />

    </div>
  );
};

