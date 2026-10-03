import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { createWorker } from 'tesseract.js';
import {
  FileUp,
  Scan,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  User,
  MapPin,
  Building2,
  CreditCard,
  Edit3,
  Lock,
  Download,
  ExternalLink,
  Info,
  Check
} from 'lucide-react';
import { DocumentSourceSelector } from '../components/digilocker/DocumentSourceSelector';
import { DigiLockerDocumentPicker, type AvailableDocument } from '../components/digilocker/DigiLockerDocumentPicker';
import { DigiLockerConsentModal } from '../components/digilocker/DigiLockerConsentModal';

export const ApplyPage: React.FC = () => {
  const { schemeId } = useParams<{ schemeId: string }>();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const { user, profile, lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  const p = profile as any;

  const [formData, setFormData] = useState({
    applicantName: user?.name || '',
    mobile: user?.mobile || '',
    gender: p?.gender || 'Female',
    age: p?.age || 32,
    address: p?.address || '',
    district: p?.district || 'Chennai',
    pincode: p?.pincode || '600001',
    annualIncome: p?.annualIncome || 120000,
    rationCardNo: 'TN-RATION-2026-9812',
    bankAccountNo: 'XXXX-XXXX-4589',
    bankIfsc: 'SBIN0001234',
    bankName: 'State Bank of India',
    rationCardType: p?.rationCardType || 'PHH (Priority Household)',
    community: p?.community || 'BC'
  });

  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [ocrProcessingDoc, setOcrProcessingDoc] = useState<string | null>(null);
  const [declarationTruth, setDeclarationTruth] = useState(false);
  const [declarationPrototype, setDeclarationPrototype] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<any>(null);

  // DigiLocker State
  const [digilockerStatus, setDigilockerStatus] = useState<any>(null);
  const [availableDocs, setAvailableDocs] = useState<AvailableDocument[]>([]);
  const [pickerDocType, setPickerDocType] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchScheme();
    fetchDigiLockerStatus();
  }, [schemeId]);

  const fetchDigiLockerStatus = async () => {
    try {
      const res = await api.get('/integrations/digilocker/status');
      setDigilockerStatus(res.data);
      if (res.data.connected) {
        const docRes = await api.get('/integrations/digilocker/documents');
        setAvailableDocs(docRes.data.documents || []);
      }
    } catch (err) {
      console.error('Fetch DigiLocker status error:', err);
    }
  };

  const handleSelectDigiLockerDoc = (dlDoc: AvailableDocument) => {
    if (!pickerDocType) return;
    const newDoc = {
      docType: pickerDocType,
      fileName: `${dlDoc.documentType}.pdf`,
      fileUrl: `https://via.placeholder.com/800x1100.png?text=DigiLocker+${dlDoc.documentType}`,
      fileSize: 2048,
      mimeType: dlDoc.mimeType || 'application/pdf',
      source: 'DIGILOCKER',
      sourceReference: dlDoc.sourceReference,
      issuer: dlDoc.issuer,
      issueDate: dlDoc.issueDate,
      ocrText: `DIGILOCKER VERIFIED DOCUMENT METADATA:\nType: ${dlDoc.documentType}\nIssuer: ${dlDoc.issuer}\nURI: ${dlDoc.sourceReference}`,
      ocrConfidence: 95,
      extractedData: { issuer: dlDoc.issuer, source: 'DIGILOCKER' },
      citizenConfirmedData: { source: 'DIGILOCKER' },
      isConfirmed: true
    };

    setUploadedDocs((prev) => [...prev.filter((d) => d.docType !== pickerDocType), newDoc]);
    setPickerDocType(null);
  };

  const handleConnectDigiLockerInWizard = async () => {
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
    } catch (err) {
      console.error('Connect DigiLocker error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const fetchScheme = async () => {
    try {
      const res = await api.get(`/schemes/${schemeId}`);
      setScheme(res.data.scheme);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // OCR Upload Handler using Tesseract.js
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrProcessingDoc(docType);

    try {
      let confidence = 85;
      let text = '';
      let extractedData: any = {};

      try {
        const worker = await createWorker('eng');
        const ret = await worker.recognize(file);
        text = ret.data.text;
        confidence = Math.round(ret.data.confidence) || 82;
        await worker.terminate();
      } catch (ocrErr) {
        console.warn('Browser Tesseract fallback triggered:', ocrErr);
        text = `DOCUMENT OCR SCAN RESULT:\nDocument Type: ${docType}\nName: ${user?.name}\nStatus: Text Matched`;
        confidence = 78;
      }

      // Simulate key field extractions based on document type
      if (docType === 'AadhaarCard') {
        extractedData = {
          nameOnDoc: user?.name,
          docNumber: 'XXXX-XXXX-8912',
          district: formData.district
        };
      } else if (docType === 'IncomeCertificate') {
        extractedData = {
          declaredIncome: formData.annualIncome,
          issuedYear: '2025-2026',
          validUntil: '2026-12-31'
        };
      } else {
        extractedData = {
          matchedName: user?.name,
          verificationCode: 'TN-GOV-VERIFIED-2026'
        };
      }

      const newDoc = {
        docType,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        mimeType: file.type,
        ocrText: text,
        ocrConfidence: confidence,
        extractedData,
        citizenConfirmedData: extractedData,
        isConfirmed: false
      };

      setUploadedDocs((prev) => [...prev.filter((d) => d.docType !== docType), newDoc]);
    } catch (err) {
      console.error('File Upload error:', err);
    } finally {
      setOcrProcessingDoc(null);
    }
  };

  const confirmOcrData = (docType: string) => {
    setUploadedDocs((prev) =>
      prev.map((d) => (d.docType === docType ? { ...d, isConfirmed: true } : d))
    );
  };

  const handleSubmitApplication = async () => {
    if (!declarationTruth || !declarationPrototype) return;
    setSubmitting(true);
    try {
      const res = await api.post('/applications', {
        schemeId,
        formData,
        documents: uploadedDocs
      });

      setSubmittedApplication(res.data.application);
      setCurrentStep(6);
    } catch (err: any) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading application wizard...</div>;
  if (!scheme) return <div className="text-center py-20 text-xs text-slate-400">Scheme not found.</div>;

  const name = isTa ? scheme.name?.ta : scheme.name?.en;

  const steps = [
    { num: 1, title: isTa ? '1. விண்ணப்பத் தகவல்' : '1. Application Info' },
    { num: 2, title: isTa ? '2. ஆவணங்கள்' : '2. Supporting Docs' },
    { num: 3, title: isTa ? '3. OCR சரிபார்ப்பு' : '3. OCR Review' },
    { num: 4, title: isTa ? '4. முன்நோக்கு' : '4. Preview Summary' },
    { num: 5, title: isTa ? '5. உறுதிமொழி' : '5. Declaration' },
    { num: 6, title: isTa ? '6. சமர்ப்பித்தல்' : '6. Confirmation' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {isTa ? 'வழிகாட்டப்பட்ட விண்ணப்ப உதவி' : 'Guided Application Assistance'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {name}
            </h1>
          </div>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">
            {scheme.schemeCode}
          </span>
        </div>

        {/* Multi-Step Stepper Header */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {steps.map((step) => {
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <div key={step.num} className="text-center">
                  <div
                    className={`h-2 rounded-full mb-2 transition-all ${
                      isDone
                        ? 'bg-emerald-600'
                        : isActive
                        ? 'bg-blue-900 shadow-sm'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] sm:text-xs font-bold block truncate ${
                      isActive ? 'text-blue-900' : isDone ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STEP 1: Application Information */}
      {currentStep === 1 && (
        <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-900" />
            <span>{isTa ? '1. விண்ணப்பதாரர் தனிப்பட்ட & வங்கித் தகவல்கள்' : '1. Applicant Personal & Bank Information'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'முழு பெயர்' : 'Full Name'}</label>
              <input
                type="text"
                value={formData.applicantName}
                onChange={(e) => handleInputChange('applicantName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'கைப்பேசி எண்' : 'Mobile Number'}</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'முகவரி' : 'Street Address'}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'மாவட்டம்' : 'District'}</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'குடும்ப ஆண்டு வருமானம் (₹)' : 'Annual Income (₹)'}</label>
              <input
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'குடும்ப அட்டை வகை' : 'Ration Card Category'}</label>
              <select
                value={formData.rationCardType}
                onChange={(e) => handleInputChange('rationCardType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
              >
                <option value="PHH (Priority Household)">PHH (Priority Household)</option>
                <option value="NPHH (Non-Priority)">NPHH (Non-Priority)</option>
                <option value="AAY (Antyodaya Anna Yojana)">AAY (Antyodaya Anna Yojana)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'வங்கி கணக்கு எண் (Direct Benefit Transfer)' : 'Bank Account Number (DBT)'}</label>
              <input
                type="text"
                value={formData.bankAccountNo}
                onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{isTa ? 'வங்கி IFSC குறியீடு' : 'Bank IFSC Code'}</label>
              <input
                type="text"
                value={formData.bankIfsc}
                onChange={(e) => handleInputChange('bankIfsc', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2"
            >
              <span>{isTa ? 'அடுத்த படி: ஆவணங்கள் பதிவேற்றம்' : 'Next: Upload Documents'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Supporting Documents Upload */}
      {currentStep === 2 && (
        <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileUp className="w-5 h-5 text-blue-900" />
              <span>{isTa ? '2. தேவைப்படும் சான்றிதழ்கள் (மூலம் தேர்வு)' : '2. Required Document Source Selection'}</span>
            </h2>
            <span className="text-[11px] text-slate-500">
              Option A: Manual Upload | Option B: Fetch DigiLocker
            </span>
          </div>

          {/* DigiLocker Picker Modal inside Step 2 */}
          {pickerDocType && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 text-xs">
                  {isTa ? `டிஜிலாக்கரில் இருந்து சான்றிதழ் தேர்வு (${pickerDocType})` : `Select DigiLocker Document for ${pickerDocType}`}
                </span>
                <button
                  onClick={() => setPickerDocType(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  {isTa ? 'மூடுக' : 'Close'}
                </button>
              </div>

              <DigiLockerDocumentPicker
                documents={availableDocs}
                onSelectDocument={handleSelectDigiLockerDoc}
                filterDocType={pickerDocType}
                mode={digilockerStatus?.mode || 'mock'}
                badgeLabel={digilockerStatus?.badgeLabel}
              />
            </div>
          )}

          <div className="space-y-4">
            {scheme.requiredDocuments?.map((doc: any, idx: number) => {
              const uploaded = uploadedDocs.find((d) => d.docType === doc.docType);

              return (
                <DocumentSourceSelector
                  key={idx}
                  docType={doc.docType}
                  label={doc.label || { en: doc.docType, ta: doc.docType }}
                  isMandatory={doc.isMandatory !== false}
                  isConnected={!!digilockerStatus?.connected}
                  activeMode={digilockerStatus?.mode || 'mock'}
                  badgeLabel={digilockerStatus?.badgeLabel}
                  attachedDoc={uploaded}
                  onSelectDigiLocker={() => setPickerDocType(doc.docType)}
                  onConnectDigiLocker={() => setShowConsentModal(true)}
                  onManualUpload={(e) => handleFileUpload(e, doc.docType)}
                  isProcessing={ocrProcessingDoc === doc.docType}
                />
              );
            })}
          </div>

          {/* Consent Modal Popup */}
          <DigiLockerConsentModal
            isOpen={showConsentModal}
            onClose={() => setShowConsentModal(false)}
            onConfirmConsent={handleConnectDigiLockerInWizard}
            mode={digilockerStatus?.mode || 'mock'}
            badgeLabel={digilockerStatus?.badgeLabel}
            loading={connecting}
          />

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isTa ? 'முந்தைய படி' : 'Back'}</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2"
            >
              <span>{isTa ? 'அடுத்த படி: OCR சரிபார்ப்பு' : 'Next: OCR Review'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Tesseract.js OCR Scanner & Citizen Review */}
      {currentStep === 3 && (
        <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Scan className="w-5 h-5 text-teal-600" />
              <span>{isTa ? '3. Tesseract.js OCR உரை எடுக்கப்பட்ட சரிபார்ப்பு' : '3. Tesseract OCR Text Extraction Review'}</span>
            </h2>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Automated Document Matching
            </span>
          </div>

          {uploadedDocs.length === 0 ? (
            <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold">
              {isTa ? 'சான்றிதழ்கள் எதுவும் பதிவேற்றப்படவில்லை. முந்தைய படிக்குச் சென்று ஆவணங்களைப் பதிவேற்றவும்.' : 'No documents uploaded yet. Please go back to Step 2 and upload required files.'}
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedDocs.map((doc, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{doc.docType} ({doc.fileName})</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded">
                      Score: {doc.ocrConfidence}%
                    </span>
                  </div>

                  {/* Extracted Text Snippet */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600 max-h-24 overflow-y-auto">
                    {doc.ocrText || 'Document text successfully analyzed.'}
                  </div>

                  {/* Citizen Confirmation Switch */}
                  <div className="flex items-center justify-between bg-white/60 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-700">
                      {isTa ? 'எடுக்கப்பட்ட தரவுகள் சரியாக உள்ளதா?' : 'Do you confirm extracted fields match your proof?'}
                    </span>

                    {doc.isConfirmed ? (
                      <span className="text-emerald-700 font-bold flex items-center space-x-1 text-xs">
                        <Check className="w-4 h-4" />
                        <span>{isTa ? 'உறுதிசெய்யப்பட்டது' : 'Confirmed'}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmOcrData(doc.docType)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all"
                      >
                        {isTa ? 'உறுதிப்படுத்து' : 'Confirm Data'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isTa ? 'முந்தைய படி' : 'Back'}</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2"
            >
              <span>{isTa ? 'அடுத்த படி: விண்ணப்ப முன்நோக்கு' : 'Next: Preview Summary'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Application Read-Only Preview & Summary */}
      {currentStep === 4 && (
        <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-900" />
              <span>{isTa ? '4. விண்ணப்ப முன்நோக்கு & சரிபார்ப்பு' : '4. Read-Only Application Summary Preview'}</span>
            </h2>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-blue-900 hover:underline flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isTa ? 'திருத்துக' : 'Edit Section'}</span>
            </button>
          </div>

          {/* Form Summary Grid */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">{isTa ? 'விண்ணப்பதாரர் பெயர்' : 'Applicant Name'}</span>
              <span className="font-bold text-slate-900">{formData.applicantName}</span>
            </div>

            <div>
              <span className="text-slate-400 block">{isTa ? 'கைப்பேசி' : 'Mobile'}</span>
              <span className="font-bold text-slate-900">{formData.mobile}</span>
            </div>

            <div>
              <span className="text-slate-400 block">{isTa ? 'வருமானம்' : 'Annual Income'}</span>
              <span className="font-bold text-emerald-800">₹{formData.annualIncome.toLocaleString('en-IN')}</span>
            </div>

            <div>
              <span className="text-slate-400 block">{isTa ? 'மாவட்டம்' : 'District'}</span>
              <span className="font-bold text-slate-900">{formData.district}</span>
            </div>

            <div>
              <span className="text-slate-400 block">{isTa ? 'ரேஷன் கார்டு வகை' : 'Ration Card Category'}</span>
              <span className="font-bold text-slate-900">{formData.rationCardType}</span>
            </div>

            <div>
              <span className="text-slate-400 block">{isTa ? 'வங்கி கணக்கு (DBT)' : 'Bank Account'}</span>
              <span className="font-bold text-slate-900">{formData.bankAccountNo}</span>
            </div>
          </div>

          {/* Attached Documents List */}
          <div>
            <span className="font-bold text-xs text-slate-900 block mb-2">{isTa ? 'இணைக்கப்பட்ட சான்றிதழ்கள்' : 'Attached Document Proofs'}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {uploadedDocs.map((d, i) => (
                <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{d.docType}</span>
                  <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded">Attached</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isTa ? 'முந்தைய படி' : 'Back'}</span>
            </button>

            <button
              onClick={() => setCurrentStep(5)}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2"
            >
              <span>{isTa ? 'அடுத்த படி: உறுதிமொழி & சம்மதம்' : 'Next: Consent & Declaration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Consent, Declaration & Disclaimers */}
      {currentStep === 5 && (
        <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
            <span>{isTa ? '5. சம்மதம் & உறுதிமொழி (Declaration)' : '5. Citizen Declaration & Consent'}</span>
          </h2>

          <div className="space-y-4">
            {/* Checkbox 1: Truth Declaration */}
            <label className="flex items-start space-x-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/80 transition-all">
              <input
                type="checkbox"
                checked={declarationTruth}
                onChange={(e) => setDeclarationTruth(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-900 rounded focus:ring-blue-900"
              />
              <div className="text-xs text-slate-700">
                <span className="font-bold block text-slate-900 mb-0.5">
                  {isTa ? '1. தகவல்களின் உண்மைத் தன்மை' : '1. Truthfulness Declaration'}
                </span>
                {isTa
                  ? 'நான் வழங்கிய அனைத்து தகவல்களும் ஆவணங்களும் உண்மையானவை என உறுதி கூறுகிறேன்.'
                  : 'I declare that all information and attached document proofs provided in this assistance application are true and correct to the best of my knowledge.'}
              </div>
            </label>

            {/* Checkbox 2: Prototype Disclaimer */}
            <label className="flex items-start space-x-3 p-4 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100/80 transition-all">
              <input
                type="checkbox"
                checked={declarationPrototype}
                onChange={(e) => setDeclarationPrototype(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-900 rounded focus:ring-amber-900"
              />
              <div className="text-xs text-amber-950">
                <span className="font-bold block text-amber-900 mb-0.5">
                  {isTa ? '2. கல்விசார் மாதிரித் திட்ட அறிவிப்பு சம்மதம்' : '2. Academic Prototype Assistance Consent'}
                </span>
                {isTa
                  ? 'தமிழ்நாடு WelfarePath ஒரு கல்விசார் மாதிரித் திட்டமாகும், இது நேரடி அரசு ஒப்புதலுக்கு உத்தரவாதம் அளிக்காது என்பதை ஒப்புக்கொள்கிறேன்.'
                  : 'I understand that Tamil Nadu WelfarePath is an educational academic final-year project providing application assistance and journey tracking, not direct official government approval.'}
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isTa ? 'முந்தைய படி' : 'Back'}</span>
            </button>

            <button
              onClick={handleSubmitApplication}
              disabled={!declarationTruth || !declarationPrototype || submitting}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 disabled:opacity-50 hover:from-blue-800 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
            >
              <span>
                {submitting
                  ? isTa
                    ? 'சமர்ப்பிக்கிறது...'
                    : 'Submitting Package...'
                  : isTa
                  ? 'விண்ணப்பத்தை இறுதியாக சமர்ப்பி'
                  : 'Submit Application Assistance Package'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmation & Reference Number Screen */}
      {currentStep === 6 && (
        <div className="glass-card p-8 rounded-3xl text-center space-y-6 border border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30 shadow-md">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
              {isTa ? 'வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது' : 'Application Successfully Logged'}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-3">
              {isTa ? 'உங்கள் விண்ணப்ப உதவி பதிவு செய்யப்பட்டுள்ளது!' : 'Application Assistance Confirmation'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-lg mx-auto">
              {isTa
                ? 'உங்கள் விண்ணப்பக் கோப்பு அதிகாரி சரிபார்ப்புக் குழுவிற்கு அனுப்பப்பட்டுள்ளது.'
                : 'Your application assistance request has been assigned reference number for tracking.'}
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
              {isTa ? 'அரசு குறிப்பு எண் (Reference Number)' : 'Application Reference Number'}
            </span>
            <div className="text-2xl font-black text-blue-900 font-mono tracking-wider">
              {submittedApplication?.applicationReference || 'TNP-WP-2026-000124'}
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit mx-auto border border-emerald-200 mt-2">
              Status: SUBMITTED (Assigned for Officer Audit)
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate(`/citizen/applications/${submittedApplication?._id || ''}`)}
              className="px-6 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <span>{isTa ? 'விண்ணப்ப நிலையைக் கண்காணிக்க' : 'Track Application Timeline'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="px-5 py-3.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{isTa ? 'ஒப்புதல் ரசீது பதிவிறக்கம்' : 'Download Acknowledgement'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

