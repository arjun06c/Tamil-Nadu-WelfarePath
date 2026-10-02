import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ApplicationTimeline } from '../components/ApplicationTimeline';
import { FileCheck, Shield, Clock, Award, FileText, AlertTriangle, FileUp, CheckCircle2, ArrowRight } from 'lucide-react';

export const ApplicationTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [correctionDoc, setCorrectionDoc] = useState<any>(null);
  const [correctionNote, setCorrectionNote] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  const { lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCorrectionDoc({
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date()
    });
  };

  const handleResubmitCorrection = async () => {
    if (!correctionDoc) return;
    setSubmittingCorrection(true);
    try {
      await api.post(`/applications/${id}/correction-response`, {
        replacementDocument: correctionDoc,
        citizenNote: correctionNote
      });
      setCorrectionSuccess(true);
      fetchApplicationDetails();
    } catch (err) {
      console.error('Correction submit error:', err);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading tracking timeline...</div>;
  if (!data || !data.application) return <div className="text-center py-20 text-xs text-slate-400">Application not found.</div>;

  const { application, documents, benefitRecord } = data;
  const schemeName = isTa ? application.schemeId?.name?.ta : application.schemeId?.name?.en;
  const isCorrectionRequired = application.status === 'CORRECTION_REQUIRED';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Top Banner */}
      <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs mb-1">
            <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
              {application.applicationReference || application.applicationNo}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">
              Submitted: {new Date(application.submittedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {schemeName}
          </h1>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full text-white shadow-sm inline-block ${
              isCorrectionRequired
                ? 'bg-amber-600'
                : application.status === 'APPROVED'
                ? 'bg-emerald-600'
                : 'bg-blue-900'
            }`}
          >
            {application.status}
          </span>
        </div>
      </div>

      {/* Post-Submission Milestone Stepper */}
      <ApplicationTimeline
        currentStatus={application.status}
        history={application.statusHistory}
        officerRemarks={application.officerRemarks}
        correctionRequested={application.correctionRequested}
      />

      {/* Targeted Document Replacement Portal for CORRECTION_REQUIRED */}
      {isCorrectionRequired && (
        <div className="glass-card p-6 rounded-2xl border border-amber-300 bg-amber-50/50 space-y-4">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>{isTa ? 'சான்றிதழ் திருத்தக் கோரிக்கை (Targeted Document Replacement)' : 'Targeted Document Replacement Portal'}</span>
          </div>

          <p className="text-xs text-amber-950">
            {application.officerRemarks || (isTa ? 'அதிகாரி உங்கள் சான்றிதழில் தெளிவின்மையைக் கண்டறிந்துள்ளார்.' : 'The reviewing officer has requested a replacement document before final approval.')}
          </p>

          <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              {isTa ? 'புதிய தெளிவான சான்றிதழைப் பதிவேற்றவும்' : 'Upload Replacement Document (PDF/JPG)'}
            </label>

            <div className="flex items-center space-x-3">
              <label className="cursor-pointer px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2">
                <FileUp className="w-4 h-4" />
                <span>{correctionDoc ? (isTa ? 'மாற்றித் தேர்' : 'Change File') : (isTa ? 'கோப்பைத் தேர்ந்தெடு' : 'Select Replacement File')}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleCorrectionFileChange}
                />
              </label>

              {correctionDoc && (
                <span className="text-xs font-semibold text-emerald-800 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{correctionDoc.fileName}</span>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isTa ? 'அதிகாரிக்கு குறிப்பு (விருப்பத் தேர்வு)' : 'Note for Reviewing Officer (Optional)'}
              </label>
              <textarea
                rows={2}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder={isTa ? 'சான்றிதழ் புதுப்பிக்கப்பட்டது...' : 'Re-uploaded current financial year certificate as requested...'}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={handleResubmitCorrection}
              disabled={!correctionDoc || submittingCorrection}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <span>{submittingCorrection ? (isTa ? 'சமர்ப்பிக்கிறது...' : 'Submitting...') : (isTa ? 'திருத்தத்தை சமர்ப்பிக்க' : 'Resubmit for Officer Audit')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {correctionSuccess && (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                {isTa ? 'திருத்தம் வெற்றிகரமாக அனுப்பப்பட்டது! அதிகாரி மீண்டும் ஆய்வு செய்வார்.' : 'Correction successfully submitted! Application returned to Officer Review Queue.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefit Disbursement Card if Approved */}
      {benefitRecord && (
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300">
          <div className="flex items-center space-x-3 mb-2">
            <Award className="w-6 h-6 text-emerald-600" />
            <h3 className="text-sm font-bold text-emerald-950">
              {isTa ? 'உரிமைத் தொகை வழங்கல் விவரம்' : 'Approved Benefit Release Details'}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
            <div>
              <span className="text-slate-400 block">{isTa ? 'குறிப்பு எண்' : 'Ref No'}</span>
              <span className="font-bold text-slate-900">{benefitRecord.benefitReferenceNo}</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isTa ? 'தொகை' : 'Amount'}</span>
              <span className="font-bold text-emerald-800">₹{benefitRecord.disbursementAmount} / month</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isTa ? 'வழங்கப்பட்ட நாள்' : 'Release Date'}</span>
              <span className="font-bold text-slate-900">{new Date(benefitRecord.releaseDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block">{isTa ? 'புதுப்பித்தல் நாள்' : 'Next Renewal'}</span>
              <span className="font-bold text-teal-800">{new Date(benefitRecord.nextRenewalDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Documents & OCR Text List */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-900" />
          <span>{isTa ? 'சமர்ப்பிக்கப்பட்ட சான்றிதழ்கள் (Uploaded Proofs)' : 'Uploaded Supporting Documents & OCR Records'}</span>
        </h3>

        {documents.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No document files attached.</div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc: any) => (
              <div key={doc._id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span>{doc.docType} ({doc.fileName})</span>
                  <span className="text-emerald-700">OCR Confidence: {doc.ocrConfidence}%</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-100 line-clamp-2">
                  {doc.ocrText || 'Document OCR scan text available.'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

