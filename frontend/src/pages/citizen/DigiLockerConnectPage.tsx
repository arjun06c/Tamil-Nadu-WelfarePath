import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Check,
  ArrowRight,
  FileCheck,
  Lock,
  FileText,
  Landmark,
  ExternalLink,
  KeyRound,
  Shield
} from 'lucide-react';
import { DigiLockerConsentModal } from '../../components/digilocker/DigiLockerConsentModal';
import { DigiLockerDocumentPicker, type AvailableDocument } from '../../components/digilocker/DigiLockerDocumentPicker';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';

export const DigiLockerConnectPage: React.FC = () => {
  const { lang, user } = useAuth();
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
      setErrorMsg(
        err.response?.data?.message ||
          (isTa ? 'இணைப்பு நிலையைப் பெற முடியவில்லை.' : 'Unable to fetch DigiLocker status.')
      );
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

      const callbackRes = await api.get(
        `/integrations/digilocker/callback?code=mock_code_grant&state=${encodeURIComponent(state)}`
      );

      if (callbackRes.data.success) {
        setShowConsentModal(false);
        await fetchStatus();
      } else {
        setErrorMsg(
          callbackRes.data.message ||
            (isTa ? 'அங்கீகாரம் நிறைவடையவில்லை.' : 'Authorization could not be completed.')
        );
      }
    } catch (err: any) {
      console.error('Connect DigiLocker error:', err);
      setErrorMsg(
        err.response?.data?.message ||
          (isTa ? 'டிஜிலாக்கர் இணைப்பு தோல்வியடைந்தது.' : 'DigiLocker connection failed.')
      );
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
      setSuccessToast(
        isTa ? 'டிஜிலாக்கர் இணைப்புத் துண்டிக்கப்பட்டது.' : 'DigiLocker disconnected successfully.'
      );
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
      setErrorMsg(
        err.response?.data?.message ||
          (isTa ? 'ஆவணத்தைத் தேர்ந்தெடுக்க முடியவில்லை.' : 'Failed to select document.')
      );
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-teal-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'டிஜிலாக்கர் இணைப்பைத் சரிபார்க்கிறது...' : 'Verifying DigiLocker integration status...'}
        </p>
      </div>
    );
  }

  const isConnected = Boolean(connectionStatus?.connected);
  const mode = connectionStatus?.mode || 'mock';

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Toast Feedback */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successToast}</span>
          </div>
          <button
            onClick={() => navigate('/citizen/documents')}
            className="text-xs font-extrabold text-emerald-800 hover:underline flex items-center space-x-1"
          >
            <span>{isTa ? 'ஆவண மையம் செல்க' : 'Go to Document Center'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center space-x-2.5 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={isTa ? 'டிஜிலாக்கர் இணைப்பு' : 'DigiLocker Integration'}
        subtitle={
          isTa
            ? 'அரசு ஆவண களஞ்சியத்துடன் இணைந்து மெய்யான சான்றிதழ்களை உடனடியாகப் பெறுங்கள்'
            : 'Link your authenticated DigiLocker account to fetch tamper-proof government documents instantly'
        }
        badge={mode === 'mock' ? 'Sandbox Simulation' : 'Government Production Gateway'}
        badgeVariant={isConnected ? 'teal' : 'amber'}
        icon={ShieldCheck}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'டிஜிலாக்கர்' : 'DigiLocker' }
        ]}
      />

      {/* Connection Status Card */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-[#172B4D]">
                  DigiLocker (Digital India)
                </h2>
                {isConnected ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
                    <span>{isTa ? 'இணைக்கப்பட்டுள்ளது' : 'Connected & Active'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-300">
                    <span>{isTa ? 'இணைக்கப்படவில்லை' : 'Not Connected'}</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                {isConnected
                  ? isTa
                    ? 'உங்கள் டிஜிலாக்கர் கணக்கு வெற்றிகரமாக இணைக்கப்பட்டுள்ளது.'
                    : `Linked with Citizen Profile: TN-${(user?._id || user?.id || '9841').slice(-6).toUpperCase()}`
                  : isTa
                  ? 'டிஜிலாக்கரை இணைத்து சான்றிதழ்களை உடனடியாக சரிபார்க்கவும்.'
                  : 'Connect DigiLocker to auto-fill income, community, and education proofs without physical visits.'}
              </p>
            </div>
          </div>

          {/* Connect / Disconnect Action Button */}
          <div className="shrink-0 self-start sm:self-auto">
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isTa ? 'இணைப்பைத் துண்டி' : 'Disconnect Account'}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowConsentModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#10243A] hover:bg-[#193352] text-white font-extrabold text-xs shadow-xs transition-all flex items-center space-x-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-teal-300" />
                <span>{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Security & Privacy Standards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <Lock className="w-4 h-4 text-teal-700" />
            <div className="font-bold text-[#172B4D] text-xs">
              {isTa ? 'AES-256 குறியாக்கம்' : 'AES-256 Encryption'}
            </div>
            <div className="text-[10px] text-slate-500">
              {isTa ? 'முழுமையான தரவுப் பாதுகாப்பு' : 'End-to-end encrypted transport'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <Shield className="w-4 h-4 text-blue-700" />
            <div className="font-bold text-[#172B4D] text-xs">
              {isTa ? 'சம்மத மேலாண்மை' : 'Citizen Consent'}
            </div>
            <div className="text-[10px] text-slate-500">
              {isTa ? 'உங்கள் அனுமதியுடன் மட்டுமே' : 'No access without authorization'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <Landmark className="w-4 h-4 text-emerald-700" />
            <div className="font-bold text-[#172B4D] text-xs">
              {isTa ? 'சட்டப்பூர்வ அங்கீகாரம்' : 'IT Act 2000'}
            </div>
            <div className="text-[10px] text-slate-500">
              {isTa ? 'அசல் ஆவணங்களுக்கு சமமானது' : 'Legally valid at par with originals'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <FileCheck className="w-4 h-4 text-indigo-700" />
            <div className="font-bold text-[#172B4D] text-xs">
              {isTa ? 'நேரடி சான்றளிப்பு' : 'Direct Issuer Sync'}
            </div>
            <div className="text-[10px] text-slate-500">
              {isTa ? 'TNeGA மற்றும் UIDAI மூலம்' : 'Fetched directly from authorities'}
            </div>
          </div>
        </div>
      </div>

      {/* Available Documents Section (When Connected) */}
      {isConnected ? (
        <div className="gov-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#172B4D]">
                {isTa ? 'கிடைக்கும் சான்றிதழ்கள்' : 'Available Official Documents'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTa
                  ? 'உங்கள் டிஜிலாக்கரிலிருந்து பெறப்பட்ட ஆவணங்களை நலத்திட்டங்களுக்குப் பயன்படுத்த தேர்வு செய்க'
                  : 'Select any verified credential to import directly into your welfare application Document Center'}
              </p>
            </div>

            <span className="text-xs font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full shrink-0">
              {documents.length} {isTa ? 'ஆவணங்கள்' : 'Documents'}
            </span>
          </div>

          <DigiLockerDocumentPicker
            documents={documents}
            onSelectDocument={handleSelectDocument}
            mode={mode}
            badgeLabel={connectionStatus?.badgeLabel}
            loading={docsLoading}
          />
        </div>
      ) : (
        <div className="gov-card p-8 text-center space-y-4 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6 text-blue-700" />
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-extrabold text-[#172B4D]">
              {isTa ? 'டிஜிலாக்கரை இணைத்து பலன்களை விரைவுபடுத்துங்கள்' : 'Connect DigiLocker for Instant Verification'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isTa
                ? 'டிஜிலாக்கர் இணைக்கப்பட்ட கணக்குகளுக்கு வருவாய் மற்றும் கல்விச் சான்றிதழ்கள் தானாகவே சரிபார்க்கப்பட்டு விரைவாக அரசு உதவிகள் விடுவிக்கப்படுகின்றன.'
                : 'Applications with linked DigiLocker credentials bypass manual officer document queues and receive accelerated state DBT processing.'}
            </p>
          </div>

          <button
            onClick={() => setShowConsentModal(true)}
            className="px-6 py-2.5 bg-[#10243A] hover:bg-[#193352] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>{isTa ? 'டிஜிலாக்கரை இணைக்கவும்' : 'Connect DigiLocker Now'}</span>
          </button>
        </div>
      )}

      {/* Official Consent Dialog */}
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
