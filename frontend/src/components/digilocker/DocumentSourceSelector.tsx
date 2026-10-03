import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileUp, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, FileText } from 'lucide-react';
import { DigiLockerModeBadge } from './DigiLockerModeBadge';

interface DocumentSourceSelectorProps {
  docType: string;
  label: { en: string; ta: string };
  isMandatory?: boolean;
  isConnected: boolean;
  activeMode?: string;
  badgeLabel?: string;
  selectedSource?: 'DIGILOCKER' | 'MANUAL_UPLOAD';
  attachedDoc?: any;
  onSelectDigiLocker: () => void;
  onConnectDigiLocker: () => void;
  onManualUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing?: boolean;
}

export const DocumentSourceSelector: React.FC<DocumentSourceSelectorProps> = ({
  docType,
  label,
  isMandatory = true,
  isConnected,
  activeMode = 'mock',
  badgeLabel,
  selectedSource,
  attachedDoc,
  onSelectDigiLocker,
  onConnectDigiLocker,
  onManualUpload,
  isProcessing = false
}) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const docLabel = isTa ? label.ta : label.en;

  const currentSource = attachedDoc?.source || selectedSource || (attachedDoc ? 'MANUAL_UPLOAD' : undefined);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
      
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-900" />
          <span className="font-extrabold text-slate-900 text-xs">{docLabel}</span>
          {isMandatory ? (
            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              {isTa ? 'கட்டாயம்' : 'Mandatory'}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
              {isTa ? 'விருப்பத் தேர்வு' : 'Optional'}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {currentSource && (
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                currentSource === 'DIGILOCKER'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              {currentSource === 'DIGILOCKER'
                ? isTa
                  ? 'ஆதாரம்: டிஜிலாக்கர்'
                  : 'Source: DigiLocker'
                : isTa
                ? 'ஆதாரம்: கைமுறை பதிவேற்றம்'
                : 'Source: Manual Upload'}
            </span>
          )}
        </div>
      </div>

      {/* Source Selection Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        
        {/* OPTION A: Manual Upload */}
        <label className="cursor-pointer p-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between transition-all shadow-2xs hover:bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">{isTa ? 'கைமுறையாக பதிவேற்றவும்' : 'Upload From Device'}</span>
              <span className="text-[10px] text-slate-500">PDF, JPG, PNG (Max 5MB)</span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={onManualUpload}
          />
        </label>

        {/* OPTION B: Fetch from DigiLocker */}
        {isConnected ? (
          <button
            type="button"
            onClick={onSelectDigiLocker}
            className="p-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 hover:from-blue-800 hover:to-teal-700 text-white rounded-xl flex items-center justify-between transition-all shadow-2xs"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <span className="font-bold block">{isTa ? 'டிஜிலாக்கரில் இருந்து பெறவும்' : 'Fetch from DigiLocker'}</span>
                <span className="text-[10px] text-teal-200">Official Digital Document</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-teal-300" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnectDigiLocker}
            className="p-3.5 bg-amber-50 border border-amber-300 hover:bg-amber-100/70 text-amber-950 rounded-xl flex items-center justify-between transition-all shadow-2xs"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-amber-200/60 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <span className="font-bold block text-amber-950">{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}</span>
                <span className="text-[10px] text-amber-800">Authorization required</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-amber-800" />
          </button>
        )}

      </div>

      {/* Display Attached Document Status Banner */}
      {attachedDoc && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block truncate max-w-xs">{attachedDoc.fileName}</span>
              <span className="text-[10px] text-slate-500">
                {attachedDoc.issuer ? `Issuer: ${attachedDoc.issuer}` : 'Uploaded via Device'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded block">
              {isTa ? 'சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Pending Officer Review'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
