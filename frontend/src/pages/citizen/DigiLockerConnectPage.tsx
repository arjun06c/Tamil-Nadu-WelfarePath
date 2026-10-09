import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ShieldCheck, ShieldAlert, CheckCircle2, RefreshCw, LogOut, Check, ArrowRight, FileCheck } from 'lucide-react';
import { DigiLockerConsentModal } from '../../components/digilocker/DigiLockerConsentModal';
import { DigiLockerDocumentPicker, type AvailableDocument } from '../../components/digilocker/DigiLockerDocumentPicker';
import { useNavigate } from 'react-router-dom';

export const DigiLockerConnectPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();

  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [documents, setDocuments] = useState<AvailableDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/integrations/digilocker/status');
      setConnectionStatus(res.data);
      if (res.data.connected) {
        fetchDocuments();
      }
    } catch (err: any) {
      console.error('Fetch status error:', err);
      setErrorMsg(err.response?.data?.message || (isTa ? 'இணைப்பு நிலையைப் பெற முடியவில்லை.' : 'Unable to fetch DigiLocker status.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await api.get('/integrations/digilocker/documents');
      setDocuments(res.data.documents || []);
    } catch (err: any) {
      console.error('Fetch documents error:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleStartConnectFlow = async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      await api.post('/integrations/digilocker/consent', {
        purpose: 'Welfare application digital document verification',
        requestedScopes: ['doc_type', 'income_cert', 'community_cert', 'hsc_marksheet'],
        grantedScopes: ['doc_type', 'income_cert', 'community_cert', 'hsc_marksheet']
      });

      const connectRes = await api.get('/integrations/digilocker/connect');
      const { state } = connectRes.data;

      const callbackRes = await api.get(`/integrations/digilocker/callback?code=mock_code_grant&state=${encodeURIComponent(state)}`);

      if (callbackRes.data.success) {
        setShowConsentModal(false);
        await fetchStatus();
      } else {
        setErrorMsg(callbackRes.data.message || (isTa ? 'அங்கீகாரம் நிறைவடையவில்லை.' : 'Authorization could not be completed.'));
      }
    } catch (err: any) {
      console.error('Connect DigiLocker error:', err);
      setErrorMsg(err.response?.data?.message || (isTa ? 'டிஜிலாக்கர் இணைப்பு தோல்வியடைந்தது.' : 'DigiLocker connection failed.'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post('/integrations/digilocker/disconnect');
      setConnectionStatus((prev: any) => ({ ...prev, connected: false, status: 'DISCONNECTED' }));
      setDocuments([]);
      setSuccessToast(isTa ? 'டிஜிலாக்கர் இணைப்புத் துண்டிக்கப்பட்டது.' : 'DigiLocker disconnected successfully.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setErrorMsg(isTa ? 'இணைப்பைத் துண்டிக்க முடியவில்லை.' : 'Failed to disconnect integration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDocument = async (doc: AvailableDocument) => {
    try {
      await api.post(`/integrations/digilocker/documents/${doc.id}/select`, {});
      setSuccessToast(
        isTa
          ? `${doc.name.ta || doc.documentType} தேர்ந்தெடுக்கப்பட்டு ஆவண மையத்தில் சேர்க்கப்பட்டது.`
          : `${doc.name.en || doc.documentType} selected and added to Document Center.`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      await fetchDocuments();
    } catch (err: any) {
      console.error('Select document error:', err);
      setErrorMsg(err.response?.data?.message || (isTa ? 'ஆவணத்தைத் தேர்ந்தெடுக்க முடியவில்லை.' : 'Failed to select document.'));
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-xs text-slate-500 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-900 mx-auto" />
        <p>{isTa ? 'டிஜிலாக்கர் இணைப்பைத் சரிபார்க்கிறது...' : 'Loading DigiLocker integration...'}</p>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;
  const mode = connectionStatus?.mode || 'mock';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-xs">
      
      {/* Toast Feedback */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successToast}</span>
          </div>
          <button
            onClick={() => navigate('/citizen/documents')}
            className="text-[11px] font-extrabold text-emerald-800 hover:underline flex items-center space-x-1"
          >
            <span>{isTa ? 'ஆவண மையத்தைக் காண்க' : 'Go to Document Center'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-center space-x-2 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
              {isTa ? 'டிஜிலாக்கர் ஆவண இணைப்பு' : 'DigiLocker Document Integration'}
            </span>
            {mode === 'mock' && (
              <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {isTa ? 'சிமுலேஷன் முறை' : 'Simulation Mode'}
              </span>
            )}
          </div>

          <h1 className="text-xl font-black text-slate-900 mt-2">
            {isTa ? 'டிஜிலாக்கர் இணைப்பு' : 'Connect DigiLocker'}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-lg">
            {isTa
              ? 'நலத்திட்ட விண்ணப்பங்களுக்குத் தேவையான சான்றிதழ்களைப் பாதுகாப்பாகப் பெற உங்கள் டிஜிலாக்கர் கணக்கை இணைக்கவும்.'
              : 'Securely access your available digital documents for welfare applications.'}
          </p>
        </div>

        <div className="shrink-0">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-all flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{isTa ? 'இணைப்பைத் துண்டி' : 'Disconnect'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConsentModal(true)}
              className="px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <ShieldCheck className="w-4.5 h-4.5 text-teal-300" />
              <span>{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SIMPLE CONNECTION STATUS CARD */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
            <span>DigiLocker</span>
          </h2>

          <div>
            {isConnected ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                <span>{isTa ? 'இணைக்கப்பட்டுள்ளது' : 'Connected'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                <span>{isTa ? 'இணைக்கப்படவில்லை' : 'Not Connected'}</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {isConnected
            ? isTa
              ? 'உங்கள் டிஜிலாக்கர் சான்றிதழ்கள் தகுதியான நலத்திட்ட விண்ணப்பங்களுக்குக் கிடைக்கின்றன.'
              : 'Your DigiLocker documents are available for eligible applications.'
            : isTa
            ? 'கிடைக்கக்கூடிய டிஜிட்டல் சான்றிதழ்களை அணுக டிஜிலாக்கரை இணைக்கவும்.'
            : 'Connect DigiLocker to access your available digital documents.'}
        </p>

        {/* PRIMARY ACTION */}
        <div className="pt-2">
          {isConnected ? (
            <button
              onClick={() => {
                const el = document.getElementById('available-documents-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-xs transition-all flex items-center space-x-1.5"
            >
              <span>{isTa ? 'சான்றிதழ்களைக் காண்க' : 'View Available Documents'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConsentModal(true)}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}</span>
            </button>
          )}
        </div>
      </div>

      {/* WHAT YOU CAN DO (3 BENEFITS) */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
          {isTa ? 'நீங்கள் செய்யக்கூடியவை' : 'What You Can Do'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="flex items-start space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isTa ? 'கிடைக்கும் டிஜிட்டல் சான்றிதழ்களை அணுகலாம்' : 'Access available digital documents'}</span>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isTa ? 'நலத்திட்டங்களுக்கு ஆவணங்களைத் தேர்வு செய்யலாம்' : 'Choose documents for welfare applications'}</span>
          </div>
          <div className="flex items-start space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{isTa ? 'எப்போது வேண்டுமானாலும் இணைப்பைத் துண்டிக்கலாம்' : 'Disconnect access anytime'}</span>
          </div>
        </div>
      </div>

      {/* ONE SHORT SENTENCE SECURITY NOTE */}
      <div className="text-[11px] text-slate-500 text-center py-1">
        {isTa
          ? 'உங்கள் ஆவணங்கள் உங்கள் சம்மதத்துடன் மட்டுமே பெறப்படும்.'
          : 'Your documents are accessed only with your consent.'}
      </div>

      {/* AVAILABLE DOCUMENTS SECTION (WHEN CONNECTED) */}
      {isConnected && (
        <div id="available-documents-section" className="glass-card p-6 rounded-3xl border border-slate-200 space-y-4">
          <DigiLockerDocumentPicker
            documents={documents}
            onSelectDocument={handleSelectDocument}
            mode={mode}
            badgeLabel={connectionStatus?.badgeLabel}
            loading={docsLoading}
          />
        </div>
      )}

      {/* CONSENT DIALOG */}
      <DigiLockerConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirmConsent={handleStartConnectFlow}
        mode={mode}
        badgeLabel={connectionStatus?.badgeLabel}
        loading={connecting}
      />

    </div>
  );
};
