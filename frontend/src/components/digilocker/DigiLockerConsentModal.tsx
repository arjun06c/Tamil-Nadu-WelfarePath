import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, Lock, X, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { DigiLockerModeBadge } from './DigiLockerModeBadge';

interface DigiLockerConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmConsent: () => Promise<void> | void;
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
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [step, setStep] = useState<1 | 2>(1);
  const [internalLoading, setInternalLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAllowAccess = async () => {
    setInternalLoading(true);
    try {
      await onConfirmConsent();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setInternalLoading(false);
        setStep(1);
      }, 1000);
    } catch (err) {
      setInternalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setStep(1);
    setInternalLoading(false);
    setIsSuccess(false);
    onClose();
  };

  const isLoadingState = loading || internalLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide">
                {isTa ? 'டிஜிலாக்கருடன் இணைக்கவும்' : 'Connect to DigiLocker'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {isTa ? 'பாதுகாப்பான டிஜிட்டல் சான்றிதழ் அணுகல்' : 'Secure Access to Digital Certificates'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
            <button
              onClick={handleCloseModal}
              disabled={isLoadingState}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Loading / Success State */}
          {isLoadingState ? (
            <div className="py-8 text-center space-y-3">
              {isSuccess ? (
                <div className="space-y-2 animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">
                    {isTa ? 'வெற்றிகரமாக இணைக்கப்பட்டது' : 'Connected Successfully'}
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    {isTa ? 'உங்கள் சான்றிதழ்கள் தயார் நிலையில் உள்ளன.' : 'Your digital documents are now available for eligible welfare applications.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isTa ? 'டிஜிலாக்கருடன் இணைக்கிறது...' : 'Connecting to DigiLocker...'}
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    {isTa ? 'தயவுசெய்து காத்திருக்கவும்...' : 'Verifying consent and initializing secure connection.'}
                  </p>
                </div>
              )}
            </div>
          ) : step === 1 ? (
            /* STEP 1: Purpose & Access Details */
            <div className="space-y-4">
              <p className="text-slate-700 leading-relaxed text-xs">
                {isTa
                  ? 'உங்கள் நலத்திட்ட விண்ணப்பத்திற்கு தேவையான சான்றிதழ்களை அணுக தமிழ்நாடு நலன்பாதைக்கு அனுமதியளிக்கவும்.'
                  : 'Allow TN WelfarePath to access eligible digital documents for your welfare application.'}
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{isTa ? 'விண்ணப்பம்:' : 'Application:'}</span>
                  <span className="font-extrabold text-slate-900">TN WelfarePath</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{isTa ? 'கோரப்படும் அணுகல்:' : 'Access requested:'}</span>
                  <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                    {isTa ? 'தேவையான டிஜிட்டல் சான்றிதழ்கள்' : 'Digital documents required for welfare application'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center space-x-2 text-teal-950 text-[11px]">
                <Lock className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  {isTa
                    ? 'உங்கள் சான்றிதழ்கள் பாதுகாப்பாகவும் உங்கள் சம்மதத்துடனும் பெறப்படும்.'
                    : 'Your documents are accessed strictly with your explicit authorization.'}
                </span>
              </div>
            </div>
          ) : (
            /* STEP 2: Citizen Consent Confirmation */
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-900 text-sm">
                {isTa ? 'உங்கள் சான்றிதழ்களை பெற அனுமதிக்கிறீர்களா?' : 'Do you allow access to your available documents?'}
              </h4>

              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2 text-slate-700">
                <p className="text-xs leading-relaxed">
                  {isTa
                    ? 'உங்கள் சம்மதத்தின் பேரில் மட்டுமே வருமான சான்றிதழ், சாதி சான்றிதழ் போன்ற ஆவணங்கள் பெறப்பட்டு விண்ணப்பத்துடன் இணைக்கப்படும்.'
                    : 'Your documents are retrieved from DigiLocker only upon your consent and attached for welfare scheme verification.'}
                </p>
                <div className="text-[11px] font-semibold text-slate-500 pt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isTa ? 'எப்போது வேண்டுமானாலும் இணைப்பைத் துண்டிக்கலாம்.' : 'You can revoke access anytime.'}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {!isLoadingState && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
            {step === 1 ? (
              <>
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {isTa ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <span>{isTa ? 'தொடர்க' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isTa ? 'பின்செல்' : 'Back'}</span>
                </button>
                <button
                  onClick={handleAllowAccess}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-teal-800 hover:from-blue-800 hover:to-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-300" />
                  <span>{isTa ? 'அணுகலை அனுமதி' : 'Allow Access'}</span>
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
