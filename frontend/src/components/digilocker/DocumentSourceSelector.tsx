import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  FileText,
  Search,
  X,
  Clock,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { type AvailableDocument } from './DigiLockerDocumentPicker';
import { DocumentReviewModal } from './DocumentReviewModal';

interface DocumentSourceSelectorProps {
  docType: string;
  label: { en: string; ta: string };
  isMandatory?: boolean;
  isConnected: boolean;
  activeMode?: string;
  badgeLabel?: string;
  attachedDoc?: any;
  availableDocs?: AvailableDocument[];
  onSelectDigiLockerDoc: (dlDoc: AvailableDocument) => void;
  onConnectDigiLocker: () => void;
  onManualUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDocument?: () => void;
  isProcessing?: boolean;
}

export const DocumentSourceSelector: React.FC<DocumentSourceSelectorProps> = ({
  docType,
  label,
  isMandatory = true,
  isConnected,
  activeMode = 'mock',
  badgeLabel,
  attachedDoc,
  availableDocs = [],
  onSelectDigiLockerDoc,
  onConnectDigiLocker,
  onManualUpload,
  onRemoveDocument,
  isProcessing = false
}) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const docLabel = isTa ? label.ta : label.en;

  // Inline DigiLocker Panel Open State
  const [isInlinePickerOpen, setIsInlinePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<AvailableDocument | null>(null);

  // Helper: Find matching DigiLocker document
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetKey = normalize(docType);

  const matchingDocs = availableDocs.filter((d) => {
    const dlDocType = normalize(d.documentType || (d as any).docType || '');
    const dlName = normalize(d.name?.en || d.name?.ta || '');
    return dlDocType.includes(targetKey) || targetKey.includes(dlDocType) || dlName.includes(targetKey);
  });

  const displayAvailableDocs = searchQuery
    ? availableDocs.filter(
        (d) =>
          (d.name?.en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.issuer || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableDocs;

  const currentSource = attachedDoc?.source || (attachedDoc ? 'MANUAL_UPLOAD' : undefined);

  // File input ref for fallback trigger
  const fileInputId = `manual-upload-input-${docType}`;

  const handleConfirmUseDigiLocker = (dlDoc: AvailableDocument) => {
    onSelectDigiLockerDoc(dlDoc);
    setPreviewDoc(null);
    setIsInlinePickerOpen(false);
  };

  return (
    <div
      className={`border rounded-2xl p-4 transition-all space-y-3 text-xs ${
        attachedDoc
          ? 'border-emerald-300 bg-emerald-50/20'
          : isInlinePickerOpen
          ? 'border-blue-400 bg-blue-50/20 shadow-xs'
          : 'border-slate-200 bg-white'
      }`}
    >
      {/* 1. Header Bar: Document Name, Mandatory Badge, Source Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {attachedDoc ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          ) : (
            <FileText className="w-4.5 h-4.5 text-blue-900 shrink-0" />
          )}
          <span className="font-extrabold text-slate-900 text-xs">{docLabel}</span>

          {isMandatory ? (
            <span className="text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              {isTa ? 'கட்டாயம் (Mandatory)' : 'Mandatory'}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {isTa ? 'விருப்பத் தேர்வு' : 'Optional'}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {attachedDoc ? (
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-900 border-emerald-300 flex items-center space-x-1">
              <Check className="w-3 h-3 text-emerald-700" />
              <span>{isTa ? 'ஆவணம் சேர்க்கப்பட்டது' : 'Document Added'}</span>
            </span>
          ) : (
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-amber-700" />
              <span>{isTa ? 'தேவைப்படுகின்றது' : 'Required'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Hidden File Input for Manual Upload Trigger */}
      <input
        id={fileInputId}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={onManualUpload}
      />

      {/* 2. STATE A: ATTACHED DOCUMENT CARD */}
      {attachedDoc ? (
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <span>{attachedDoc.fileName || attachedDoc.documentName?.en || docType}</span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                <span>
                  Source:{' '}
                  <strong className={currentSource === 'DIGILOCKER' ? 'text-indigo-900' : 'text-slate-800'}>
                    {currentSource === 'DIGILOCKER' ? 'DigiLocker' : 'Manual Upload'}
                  </strong>
                </span>
                {attachedDoc.issuer && (
                  <>
                    <span>•</span>
                    <span>Issuer: <strong>{attachedDoc.issuer}</strong></span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {isTa ? 'அலுவலர் சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending Officer Review'}
              </span>

              {onRemoveDocument && (
                <button
                  type="button"
                  onClick={onRemoveDocument}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                >
                  {isTa ? 'மாற்று' : 'Change'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 3. STATE B: NOT ATTACHED — SOURCE SELECTION & INLINE PICKER */
        <div className="space-y-3">
          
          {/* Initial Action Buttons when Inline Picker is Closed */}
          {!isInlinePickerOpen && (
            <div>
              <p className="text-[11px] font-semibold text-slate-600 mb-2">
                {isTa ? 'ஆவணத்தைச் சமர்ப்பிக்கும் முறையைத் தேர்ந்தெடுக்கவும்:' : 'Choose how you want to provide this document:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* OPTION A: Upload Manually */}
                <label
                  htmlFor={fileInputId}
                  className="cursor-pointer p-3 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 rounded-xl flex items-center justify-between transition-all shadow-2xs group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-purple-50 text-purple-900 rounded-lg group-hover:bg-purple-900 group-hover:text-white transition-all">
                      <FileUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        {isTa ? 'கைமுறையாக பதிவேற்றவும்' : 'Upload manually'}
                      </span>
                      <span className="text-[10px] text-slate-500">PDF, JPG, PNG (Max 5MB)</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-900" />
                </label>

                {/* OPTION B: Get from DigiLocker */}
                <button
                  type="button"
                  onClick={() => setIsInlinePickerOpen(true)}
                  className="p-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 hover:from-blue-800 hover:to-teal-800 text-white rounded-xl flex items-center justify-between transition-all shadow-2xs text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
                      <ShieldCheck className="w-4 h-4 text-teal-300" />
                    </div>
                    <div>
                      <span className="font-bold block text-xs">
                        {isTa ? 'டிஜிலாக்கரில் இருந்து பெறவும்' : 'Get from DigiLocker'}
                      </span>
                      <span className="text-[10px] text-teal-200">Instant Official Retrieval</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* INLINE EXPANDABLE DIGILOCKER PANEL */}
          {isInlinePickerOpen && (
            <div className="bg-slate-50 border border-blue-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
              
              {/* Header inside Panel */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-teal-700" />
                  <span className="font-extrabold text-slate-900 text-xs">
                    {isTa ? `டிஜிலாக்கர் சான்றிதழ் பார்வை: ${docLabel}` : `DigiLocker Search: ${docLabel}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInlinePickerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>{isTa ? 'மூடுக' : 'Close'}</span>
                </button>
              </div>

              {/* 1. IF NOT CONNECTED */}
              {!isConnected ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-950">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-700 shrink-0" />
                    <span className="font-extrabold text-xs">
                      {isTa ? 'டிஜிலாக்கர் கணக்கு இணைக்கப்படவில்லை' : 'Connect DigiLocker to retrieve this document.'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    {isTa
                      ? 'அதிகாரப்பூர்வ சான்றிதழைப் பெற உங்கள் டிஜிலாக்கர் கணக்கை பாதுகாப்பாக இணைக்கவும்.'
                      : 'Authenticate with your official DigiLocker account to fetch verified digital certificates directly.'}
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onConnectDigiLocker}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center space-x-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-200" />
                      <span>{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 2. IF CONNECTED: CHECK MATCH vs NO MATCH */
                <div className="space-y-3">
                  
                  {/* CASE A: MATCH FOUND */}
                  {matchingDocs.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 p-2.5 rounded-xl flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          {isTa
                            ? `பொருந்தக்கூடிய சான்றிதழ் டிஜிலாக்கரில் உள்ளது (${matchingDocs.length})`
                            : `Matching document found in DigiLocker (${matchingDocs.length})`}
                        </span>
                      </div>

                      {matchingDocs.map((dl) => (
                        <div
                          key={dl.id || dl.sourceReference}
                          className="bg-white border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">
                              {isTa ? dl.name?.ta || dl.name?.en || dl.documentType : dl.name?.en || dl.documentType}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Issuer: {dl.issuer || 'Government Authority'} {dl.issueDate ? `• Issued: ${dl.issueDate}` : ''}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPreviewDoc(dl)}
                            className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-lg text-xs shadow-2xs flex items-center space-x-1 shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-300" />
                            <span>{isTa ? 'சரிபார்த்து பயன்படுத்துக' : 'Review & Use'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* CASE B: NO MATCH FOUND */
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3 text-amber-950">
                      <div>
                        <h4 className="font-extrabold text-amber-950 text-xs flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span>
                            {isTa
                              ? `டிஜிலாக்கரில் ${docLabel} எதுவும் கிடைக்கவில்லை.`
                              : `No ${docLabel} found in DigiLocker.`}
                          </span>
                        </h4>
                        <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                          {isTa
                            ? 'உங்கள் இணைக்கப்பட்ட டிஜிலாக்கர் கணக்கில் இந்த குறிப்பிட்ட சான்றிதழ் கிடைக்கவில்லை. நீங்கள் இதை கைமுறையாக பதிவேற்றலாம்.'
                            : 'This document is not currently available in your connected DigiLocker account. You can upload a copy manually.'}
                        </p>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {/* Fallback Button Triggering Upload Specifically for This Requirement */}
                        <label
                          htmlFor={fileInputId}
                          className="cursor-pointer px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white font-extrabold rounded-xl text-xs shadow-xs flex items-center space-x-1.5"
                        >
                          <FileUp className="w-4 h-4 text-purple-200" />
                          <span>{isTa ? `${docLabel} பதிவேற்றவும்` : `Upload ${docLabel}`}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setIsInlinePickerOpen(false)}
                          className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold hover:underline"
                        >
                          {isTa ? 'வேறொரு வழியைத் தேர்ந்தெடுக்கவும்' : 'Choose another source'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search / View All Other Connected DigiLocker Docs Section */}
                  {displayAvailableDocs.length > 0 && matchingDocs.length === 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>{isTa ? 'கிடைக்கக்கூடிய இதர டிஜிலாக்கர் சான்றிதழ்கள்:' : 'Other Available DigiLocker Documents:'}</span>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={isTa ? 'சான்றிதழைத் தேடுக...' : 'Search documents...'}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] focus:ring-1 focus:ring-blue-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {displayAvailableDocs.map((dl) => (
                          <div
                            key={dl.id || dl.sourceReference}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between hover:border-slate-300"
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-slate-900 block text-[11px] truncate">
                                {isTa ? dl.name?.ta || dl.name?.en || dl.documentType : dl.name?.en || dl.documentType}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">{dl.issuer}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPreviewDoc(dl)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 font-bold rounded text-[10px] shrink-0 transition-colors"
                            >
                              {isTa ? 'பயன்படுத்துக' : 'Use'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* DOCUMENT REVIEW MODAL (When clicking Review & Use) */}
      <DocumentReviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        mode={activeMode}
        badgeLabel={badgeLabel}
        onConfirmUse={handleConfirmUseDigiLocker}
        loading={isProcessing}
      />

    </div>
  );
};
