import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, AlertCircle, FileCheck, CheckCircle2, Lock, X } from 'lucide-react';
import { DigiLockerModeBadge } from './DigiLockerModeBadge';

interface DigiLockerConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmConsent: () => void;
  mode?: string;
  badgeLabel?: string;
  loading?: boolean;
}

export const DigiLockerConsentModal: React.FC<DigiLockerConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirmConsent,
  mode = 'mock',
  badgeLabel,
  loading = false
}) => {
  const { t } = useTranslation();
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide">
                {isTa ? 'குடிமக்களின் ஆவண அணுகல் சம்மதம்' : 'Citizen Data Access Consent'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {isTa ? 'பாதுகாப்பான டிஜிலாக்கர் சான்றிதழ் இணைப்பு' : 'Consent-based Official Document Retrieval'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-700">
              {isTa ? 'இணைப்பு வகை:' : 'Integration Mode:'}
            </span>
            <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
          </div>

          {/* Scope Explanation */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-900" />
              <span>{isTa ? 'அணுகக் கோரப்படும் சான்றிதழ்கள்:' : 'Requested Access Scopes:'}</span>
            </h4>
            <ul className="grid grid-cols-1 gap-2 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 text-slate-700">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{isTa ? 'வருமான சான்றிதழ் (Income Certificate)' : 'Income Certificate metadata'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{isTa ? 'சாதி சான்றிதழ் (Community Certificate)' : 'Community Certificate proof'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{isTa ? '12ஆம் வகுப்பு மதிப்பெண் சான்றிதழ் (HSC Marksheet)' : 'Educational HSC Mark Sheet'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{isTa ? 'குடும்ப அட்டை (Smart Ration Card)' : 'PDS Smart Ration Card details'}</span>
              </li>
            </ul>
          </div>

          {/* Privacy Protections Notice */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5 text-amber-950">
            <div className="flex items-center space-x-2 font-bold text-amber-900">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>{isTa ? 'தனியுரிமை மற்றும் பயன்பாட்டு விதிமுறை:' : 'Privacy & Data Use Notice:'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              {isTa
                ? 'உங்கள் சம்மதத்தின் பேரில் மட்டுமே ஆவணங்கள் பெறப்படும். பெறப்பட்ட ஆவணங்கள் உங்கள் நலத்திட்ட விண்ணப்ப சரிபார்ப்பிற்கு மட்டுமே பயன்படுத்தப்படும்.'
                : 'Access is consent-driven. WelfarePath only retrieves documents required for your specific welfare application. You may revoke access at any time.'}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="text-[11px] text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {isTa
                ? 'டிஜிலாக்கரில் இருந்து ஆவணம் பெறப்படுவது உடனடியாக விண்ணப்ப ஒப்புதலாக கருதப்படாது. அதிகாரி சரிபார்ப்பு தனித்து நடைபெறும்.'
                : 'Retrieving documents from DigiLocker attaches digital proof to your application, but officer verification remains required.'}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isTa ? 'ரத்து செய்' : 'Cancel'}
          </button>

          <button
            onClick={onConfirmConsent}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-teal-800 hover:from-blue-800 hover:to-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <span>
              {loading
                ? isTa
                  ? 'இணைக்கிறது...'
                  : 'Connecting...'
                : isTa
                ? 'சம்மதித்து தொடர்க'
                : 'Continue with DigiLocker'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
