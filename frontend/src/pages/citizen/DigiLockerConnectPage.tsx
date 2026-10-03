import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ShieldCheck, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, LogOut, Info, Lock, ArrowRight, FileText } from 'lucide-react';
import { DigiLockerModeBadge } from '../../components/digilocker/DigiLockerModeBadge';
import { DigiLockerConsentModal } from '../../components/digilocker/DigiLockerConsentModal';
import { DigiLockerDocumentPicker, type AvailableDocument } from '../../components/digilocker/DigiLockerDocumentPicker';

export const DigiLockerConnectPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, lang } = useAuth();
  const isTa = lang === 'ta';

  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [documents, setDocuments] = useState<AvailableDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      console.error('Fetch DigiLocker status error:', err);
      setErrorMsg(err.response?.data?.message || 'Error connecting to DigiLocker API engine.');
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
      console.error('Fetch DigiLocker documents error:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleStartConnectFlow = async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      // 1. Record Citizen Consent
      await api.post('/integrations/digilocker/consent', {
        purpose: 'Welfare application digital document verification',
        requestedScopes: ['doc_type', 'income_cert', 'community_cert', 'hsc_marksheet'],
        grantedScopes: ['doc_type', 'income_cert', 'community_cert', 'hsc_marksheet']
      });

      // 2. Initiate OAuth flow to generate authorization URL
      const connectRes = await api.get('/integrations/digilocker/connect');
      const { authorizationUrl, state } = connectRes.data;

      // 3. Process OAuth Callback
      const callbackRes = await api.get(`/integrations/digilocker/callback?code=mock_code_grant&state=${encodeURIComponent(state)}`);

      if (callbackRes.data.success) {
        setShowConsentModal(false);
        await fetchStatus();
      } else {
        setErrorMsg(callbackRes.data.message || 'Authorization could not be completed.');
      }
    } catch (err: any) {
      console.error('Connect DigiLocker error:', err);
      setErrorMsg(err.response?.data?.message || 'DigiLocker connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(isTa ? 'நிச்சயமாக டிஜிலாக்கர் இணைப்பைத் துண்டிக்க விரும்புகிறீர்களா?' : 'Are you sure you want to disconnect your DigiLocker integration?')) {
      return;
    }
    setLoading(true);
    try {
      await api.post('/integrations/digilocker/disconnect');
      setConnectionStatus((prev: any) => ({ ...prev, connected: false, status: 'DISCONNECTED' }));
      setDocuments([]);
    } catch (err: any) {
      console.error('Disconnect error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-500 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-900 mx-auto" />
        <p>{isTa ? 'டிஜிலாக்கர் இணைப்பு நிலையைச் சரிபார்க்கிறது...' : 'Loading DigiLocker Integration Workspace...'}</p>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;
  const mode = connectionStatus?.mode || 'mock';
  const badgeLabel = connectionStatus?.badgeLabel;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              {isTa ? 'டிஜிலாக்கர் ஆவண ஒருங்கிணைப்பு' : 'DigiLocker Document Integration'}
            </span>
            <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {isTa ? 'டிஜிலாக்கர் இணைப்பு மேலாண்மை' : 'DigiLocker Connection Workspace'}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            {isTa
              ? 'உங்கள் அரசு டிஜிலாக்கர் கணக்கை இணைத்து, நலத்திட்ட விண்ணப்பங்களுக்குத் தேவையான சான்றிதழ்களைப் பாதுகாப்பாகப் பெறவும்.'
              : 'Connect your DigiLocker account to securely access eligible digital certificates for your welfare applications.'}
          </p>
        </div>

        <div className="shrink-0">
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition-all flex items-center space-x-2 shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>{isTa ? 'இணைப்பைத் துண்டி' : 'Disconnect Account'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConsentModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 hover:from-blue-800 hover:to-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2"
            >
              <ShieldCheck className="w-4.5 h-4.5 text-teal-300" />
              <span>{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Connection Status Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
            <span>{isTa ? 'இணைப்பு நிலைப்பாடு' : 'Connection Overview'}</span>
          </h2>

          <div className="flex items-center space-x-2">
            {isConnected ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isTa ? 'இணைக்கப்பட்டுள்ளது' : 'Connected & Authorized'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-xs font-bold">
                <span>{isTa ? 'இணைக்கப்படவில்லை' : 'Not Connected'}</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block">{isTa ? 'இயங்கும் நிலை (Mode)' : 'Integration Mode'}</span>
            <span className="font-bold text-slate-900 uppercase">{mode}</span>
          </div>

          <div>
            <span className="text-slate-400 block">{isTa ? 'அங்கீகார ஆதாரம்' : 'Source Badge'}</span>
            <span className="font-bold text-slate-900">{badgeLabel || 'Demo Document Source'}</span>
          </div>

          <div>
            <span className="text-slate-400 block">{isTa ? 'கடைசி பயன்பாடு' : 'Last Connected'}</span>
            <span className="font-bold text-slate-900">
              {connectionStatus?.connectedAt ? new Date(connectionStatus.connectedAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Documents Section (If Connected) */}
      {isConnected && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 space-y-4">
          <DigiLockerDocumentPicker
            documents={documents}
            onSelectDocument={(doc) => {
              console.log('Document selected for welfare path:', doc);
            }}
            mode={mode}
            badgeLabel={badgeLabel}
            loading={docsLoading}
          />
        </div>
      )}

      {/* Security & Privacy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
          <Lock className="w-5 h-5 text-blue-900" />
          <h4 className="font-bold text-slate-900">{isTa ? 'உங்கள் கட்டுப்பாடு' : 'You Control Access'}</h4>
          <p className="text-[11px] text-slate-600">
            {isTa
              ? 'உங்கள் சம்மதம் இல்லாமல் எந்த ஆவணமும் பெறப்படாது.'
              : 'Documents are fetched strictly upon explicit citizen authorization.'}
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-teal-700" />
          <h4 className="font-bold text-slate-900">{isTa ? 'நோக்கத்திற்கான பயன்பாடு' : 'Purpose Bound'}</h4>
          <p className="text-[11px] text-slate-600">
            {isTa
              ? 'தேர்ந்தெடுக்கப்பட்ட நலத்திட்ட விண்ணப்பத்திற்கு மட்டுமே ஆவணங்கள் பயன்படும்.'
              : 'Used strictly for the selected welfare application verification requirement.'}
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
          <Info className="w-5 h-5 text-indigo-900" />
          <h4 className="font-bold text-slate-900">{isTa ? 'எப்போது வேண்டுமானாலும் துண்டிக்கலாம்' : 'Easy Revocation'}</h4>
          <p className="text-[11px] text-slate-600">
            {isTa
              ? 'எப்போது வேண்டுமானாலும் டிஜிலாக்கர் இணைப்பைத் துண்டிக்கலாம்.'
              : 'You can disconnect integration access anytime from settings.'}
          </p>
        </div>
      </div>

      {/* Consent Modal Popup */}
      <DigiLockerConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirmConsent={handleStartConnectFlow}
        mode={mode}
        badgeLabel={badgeLabel}
        loading={connecting}
      />

    </div>
  );
};
