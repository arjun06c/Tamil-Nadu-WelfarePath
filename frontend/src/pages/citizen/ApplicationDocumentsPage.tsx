import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { FileText, ArrowLeft, ShieldCheck, FileUp, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { DigiLockerModeBadge } from '../../components/digilocker/DigiLockerModeBadge';
import { DocumentSourceSelector } from '../../components/digilocker/DocumentSourceSelector';
import { DigiLockerConsentModal } from '../../components/digilocker/DigiLockerConsentModal';
import { DigiLockerDocumentPicker, type AvailableDocument } from '../../components/digilocker/DigiLockerDocumentPicker';

export const ApplicationDocumentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [digilockerStatus, setDigilockerStatus] = useState<any>(null);
  const [showPickerDocType, setShowPickerDocType] = useState<string | null>(null);
  const [availableDocs, setAvailableDocs] = useState<AvailableDocument[]>([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
    fetchDigiLockerStatus();
  }, [id]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/applications/${id}`);
      setApplicationData(res.data);
    } catch (err: any) {
      console.error('Fetch application error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDigiLockerStatus = async () => {
    try {
      const res = await api.get('/integrations/digilocker/status');
      setDigilockerStatus(res.data);
      if (res.data.connected) {
        fetchAvailableDocs();
      }
    } catch (err: any) {
      console.error('Fetch DigiLocker status error:', err);
    }
  };

  const fetchAvailableDocs = async () => {
    try {
      const res = await api.get('/integrations/digilocker/documents');
      setAvailableDocs(res.data.documents || []);
    } catch (err: any) {
      console.error('Fetch docs error:', err);
    }
  };

  const handleAttachFromDigiLocker = async (dlDoc: AvailableDocument) => {
    if (!showPickerDocType || !id) return;
    try {
      await api.post(`/applications/${id}/documents/from-digilocker`, {
        digilockerDocumentId: dlDoc.id,
        docType: showPickerDocType
      });
      setShowPickerDocType(null);
      await fetchApplicationDetails();
    } catch (err: any) {
      console.error('Attach error:', err);
      alert(err.response?.data?.message || 'Error attaching document from DigiLocker.');
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      await api.post(`/applications/${id}/correction`, {
        replacementDoc: {
          docType,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          ocrConfidence: 85
        }
      });
      await fetchApplicationDetails();
    } catch (err: any) {
      console.error('Manual upload error:', err);
    }
  };

  const handleConnectDigiLocker = async () => {
    setConnecting(true);
    try {
      await api.post('/integrations/digilocker/consent', {
        purpose: 'Welfare application document attachment',
        requestedScopes: ['doc_type'],
        grantedScopes: ['doc_type']
      });
      const connectRes = await api.get('/integrations/digilocker/connect');
      await api.get(`/integrations/digilocker/callback?code=mock_code_grant&state=${encodeURIComponent(connectRes.data.state)}`);
      setShowConsentModal(false);
      await fetchDigiLockerStatus();
    } catch (err: any) {
      console.error('Connect error:', err);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-500 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-900 mx-auto" />
        <p>{isTa ? 'விண்ணப்ப ஆவணப் பக்கத்தை ஏற்றுகிறது...' : 'Loading Application Documents Center...'}</p>
      </div>
    );
  }

  if (!applicationData?.application) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        {isTa ? 'விண்ணப்பம் காணப்படவில்லை.' : 'Application record not found.'}
      </div>
    );
  }

  const app = applicationData.application;
  const docs = applicationData.documents || [];
  const scheme = app.schemeId || {};
  const requiredDocConfigs = scheme.requiredDocuments || [
    { docType: 'IncomeCertificate', label: { en: 'Income Certificate', ta: 'வருமானச் சான்றிதழ்' }, isMandatory: true }
  ];

  const isConnected = digilockerStatus?.connected;
  const mode = digilockerStatus?.mode || 'mock';
  const badgeLabel = digilockerStatus?.badgeLabel;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Navigation Back */}
      <button
        onClick={() => navigate(`/citizen/applications/${id}`)}
        className="text-xs font-bold text-slate-600 hover:text-blue-900 flex items-center space-x-1 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{isTa ? 'விண்ணப்பக் கண்காணிப்பிற்குத் திரும்புக' : 'Back to Application Tracking'}</span>
      </button>

      {/* Application Summary Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              {app.applicationReference}
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-2">
              {isTa ? scheme.name?.ta : scheme.name?.en}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <DigiLockerModeBadge mode={mode} badgeLabel={badgeLabel} />
          </div>
        </div>

        {/* Document Progress Summary */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900 block">
              {isTa ? 'ஆவணங்கள் நிறைவு நிலை:' : 'Document Completion Status:'}
            </span>
            <span className="text-[11px] text-slate-500">
              {docs.length} of {requiredDocConfigs.length} required documents submitted
            </span>
          </div>

          <span className="text-xs font-extrabold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
            Status: {app.status}
          </span>
        </div>
      </div>

      {/* Document Picker Overlay if Active */}
      {showPickerDocType && (
        <div className="glass-card p-6 rounded-3xl border border-blue-200 bg-blue-50/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-blue-900 text-xs">
              {isTa ? `டிஜிலாக்கரில் இருந்து சான்றிதழ் தேர்வு (${showPickerDocType})` : `Select DigiLocker Document for ${showPickerDocType}`}
            </h3>
            <button
              onClick={() => setShowPickerDocType(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900"
            >
              {isTa ? 'மூடுக' : 'Close'}
            </button>
          </div>

          <DigiLockerDocumentPicker
            documents={availableDocs}
            onSelectDocument={handleAttachFromDigiLocker}
            filterDocType={showPickerDocType}
            mode={mode}
            badgeLabel={badgeLabel}
          />
        </div>
      )}

      {/* Document Requirements List */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-900" />
          <span>{isTa ? 'தேவைப்படும் சான்றிதழ்கள் பட்டியல்' : 'Required Document Management'}</span>
        </h2>

        {requiredDocConfigs.map((cfg: any, idx: number) => {
          const attached = docs.find((d: any) => d.docType === cfg.docType);

          return (
            <DocumentSourceSelector
              key={idx}
              docType={cfg.docType}
              label={cfg.label}
              isMandatory={cfg.isMandatory !== false}
              isConnected={!!isConnected}
              activeMode={mode}
              badgeLabel={badgeLabel}
              attachedDoc={attached}
              onSelectDigiLocker={() => setShowPickerDocType(cfg.docType)}
              onConnectDigiLocker={() => setShowConsentModal(true)}
              onManualUpload={(e) => handleManualUpload(e, cfg.docType)}
            />
          );
        })}
      </div>

      {/* Consent Modal */}
      <DigiLockerConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirmConsent={handleConnectDigiLocker}
        mode={mode}
        badgeLabel={badgeLabel}
        loading={connecting}
      />

    </div>
  );
};
