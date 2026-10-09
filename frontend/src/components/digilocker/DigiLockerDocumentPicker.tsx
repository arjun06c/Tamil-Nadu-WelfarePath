import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Search, CheckCircle2, Building2, Calendar, ArrowRight, Eye } from 'lucide-react';
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
  onSelectDocument: (doc: AvailableDocument) => Promise<void> | void;
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
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingDoc, setReviewingDoc] = useState<AvailableDocument | null>(null);

  const filtered = documents.filter((doc) => {
    const title = (isTa ? doc.name.ta : doc.name.en) || '';
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.issuer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterDocType || doc.documentType.toLowerCase().includes(filterDocType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const handleConfirmDocUse = async (doc: AvailableDocument) => {
    await onSelectDocument(doc);
    setReviewingDoc(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 animate-pulse">
        {isTa ? 'ஆவணங்களைப் பெறுகிறது...' : 'Fetching available digital documents...'}
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
            {isTa ? 'கிடைக்கும் ஆவணங்கள்' : 'Available Documents'}
          </h3>
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
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-900">
            {isTa ? 'பொருந்தும் ஆவணங்கள் எதுவும் இல்லை' : 'No Available Documents Found'}
          </h4>
          <p className="text-[11px] text-slate-500">
            {isTa
              ? 'உங்கள் டிஜிலாக்கர் கணக்கில் இந்த சான்றிதழ் கிடைக்கவில்லை என்றால், கைமுறையாக பதிவேற்றலாம்.'
              : 'If your certificate is not available in DigiLocker, you can choose manual upload.'}
          </p>
        </div>
      ) : (
        /* Document Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const isSelected = selectedDocId === doc.id || doc.status === 'SELECTED' || doc.status === 'RETRIEVED';
            const docTitleEn = doc.name.en;
            const docTitleTa = doc.name.ta;

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-900 shadow-xs ring-1 ring-blue-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-900" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs leading-snug">
                          {docTitleEn}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 block">
                          {docTitleTa}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold shrink-0">
                      {isTa ? 'கிடைக்கும்' : 'Available'}
                    </span>
                  </div>

                  <div className="pt-1 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.issuer}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => setReviewingDoc(doc)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition-all flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isTa ? 'விவரம் பார்க்க' : 'View'}</span>
                  </button>

                  <button
                    onClick={() => setReviewingDoc(doc)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-blue-900 hover:bg-blue-800 text-white shadow-md'
                    }`}
                  >
                    <span>{isTa ? 'ஆவணத்தைப் பயன்படுத்து' : 'Use Document'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
        onConfirmUse={handleConfirmDocUse}
      />

    </div>
  );
};
