import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Award, FileText, ExternalLink, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, HelpCircle, Layers, FileCheck, Info } from 'lucide-react';

export const SchemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const { user, lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchScheme();
  }, [id]);

  const fetchScheme = async () => {
    try {
      const res = await api.get(`/schemes/${id}`);
      setScheme(res.data.scheme);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEvaluating(true);
    try {
      await api.post(`/schemes/${id}/evaluate`);
      navigate(`/schemes/${id}/eligibility-result`);
    } catch (err: any) {
      console.error('Evaluate error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleStartApplication = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/citizen/apply/${scheme._id}`);
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading scheme details...</div>;
  if (!scheme) return <div className="text-center py-20 text-xs text-slate-400">Scheme not found.</div>;

  const name = isTa ? scheme.name?.ta : scheme.name?.en;
  const department = isTa ? scheme.department?.ta : scheme.department?.en;
  const description = isTa ? scheme.description?.ta : scheme.description?.en;
  const benefit = isTa ? scheme.benefitSummary?.ta : scheme.benefitSummary?.en;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Top Banner Header */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden shadow-sm border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-900 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-blue-100/80 border border-blue-200 uppercase tracking-wide">
            {scheme.schemeCode || 'TN-SCHEME'}
          </span>
          <span>•</span>
          <span className="text-slate-600 font-semibold">{department}</span>
          {scheme.category && (
            <>
              <span>•</span>
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold">
                {scheme.category}
              </span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
          {name}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-4xl">
          {description}
        </p>

        {/* Benefits Highlight Box */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 border border-emerald-200 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              {isTa ? 'அரசு வழங்கும் நிதி / உதவி சலுகைகள்' : 'Official Benefit Financial Support'}
            </span>
            <div className="text-base font-extrabold text-emerald-950 mt-1">
              {benefit}
            </div>
          </div>
          <div className="text-xs font-medium text-emerald-800 bg-white/80 px-3.5 py-2 rounded-xl border border-emerald-200 self-start sm:self-auto">
            {isTa ? 'செல்லுபடியாகும் காலம்: 2026 தமிழ்நாடு அரசு' : 'Validity: Government of Tamil Nadu Welfare 2026'}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleStartApplication}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 hover:from-blue-800 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>{isTa ? 'விண்ணப்ப உதவியைத் தொடங்குங்கள் (Start Application)' : 'Start Application Assistance'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{evaluating ? (isTa ? 'கணக்கிடுகிறது...' : 'Evaluating Rules...') : (isTa ? 'தகுதியை சோதிக்கவும்' : 'Check My Eligibility')}</span>
          </button>

          {scheme.officialUrl && (
            <a
              href={scheme.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <span>{isTa ? 'அதிகாரப்பூர்வ தமிழ்நாடு தளம்' : 'Official TN Portal'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Grid Section: Eligibility Criteria Breakdown & Application Method Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 3-Level Eligibility Summary Card (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-900" />
            <span>{isTa ? '3-நிலை தகுதி விதிமுறைகள் (Eligibility Breakdown)' : '3-Level Eligibility Criteria Breakdown'}</span>
          </h2>

          <div className="space-y-4">
            {/* Level 1: Fully Eligible */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isTa ? '1. முழு தகுதி (Fully Eligible Criteria)' : '1. Mandatory Direct Criteria'}</span>
              </div>
              <ul className="text-xs text-emerald-950 space-y-1 pl-6 list-disc">
                <li>{isTa ? 'தமிழ்நாடு நிரந்தர வசிப்பிட சான்றிதழ் கொண்டவர்' : 'Resident of Tamil Nadu with domicile proof'}</li>
                <li>{isTa ? `குடும்ப ஆண்டு வருமானம் வரம்பு: ₹${scheme.eligibilityRules?.incomeCap?.toLocaleString('en-IN') || '2,50,000'} க்குள்` : `Family annual income must be within cap of ₹${scheme.eligibilityRules?.incomeCap?.toLocaleString('en-IN') || '2,50,000'}`}</li>
                <li>{isTa ? `வயது வரம்பு: ${scheme.eligibilityRules?.minAge || 18} முதல் ${scheme.eligibilityRules?.maxAge || 60} ஆண்டுகள்` : `Age boundary between ${scheme.eligibilityRules?.minAge || 18} and ${scheme.eligibilityRules?.maxAge || 60} years`}</li>
              </ul>
            </div>

            {/* Level 2: Near Eligible / Minor Gaps */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 mb-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{isTa ? '2. பகுதித் தகுதி / சான்றிதழ் தேவைகள் (Near Eligible Conditions)' : '2. Conditional & Certificate Gaps'}</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                {isTa ? 'சான்றிதழ் புதுப்பிப்பு தேவைப்படலாம் (எ.கா: நடப்பு நிதியாண்டு வருமானச் சான்றிதழ் அல்லது ரேஷன் கார்டு திருத்தம்).' : 'May require document updates (e.g., current financial year income certificate or family card address match).'}
              </p>
            </div>

            {/* Level 3: Ineligible Rules */}
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-900 mb-1.5">
                <HelpCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{isTa ? '3. தகுதியின்மை விதிகள் (Ineligible Exemptions)' : '3. Strict Exclusion Boundaries'}</span>
              </div>
              <ul className="text-xs text-rose-950 space-y-1 pl-6 list-disc">
                <li>{isTa ? 'வருமான வரி செலுத்துவோர் அல்லது அரசு நிரந்தர ஊழியர்கள்' : 'Income tax payers or permanent government employees'}</li>
                <li>{isTa ? 'இதே போன்ற பிற மாநில அரசு உதவித்தொகை பெறுபவர்கள்' : 'Beneficiaries receiving duplicate state grant for same category'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Application Method & Guidelines (1 Col) */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-900" />
              <span>{isTa ? 'விண்ணப்ப முறை' : 'Application Method'}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-900 block mb-1">
                  {isTa ? '1. இத்தளத்தின் உதவி வழிமுறை (Platform Assisted)' : '1. Platform Assisted Application'}
                </span>
                <p className="text-blue-950 text-[11px] leading-relaxed">
                  {isTa ? 'எங்கள் வழிகாட்டி மூலம் படிவங்களை நிரப்பி, OCR ஆவணங்களை சரிபார்த்து TNP-WP குறிப்பு எண் பெறலாம்.' : 'Fill multi-step guided forms, scan documents with OCR, generate reference TNP-WP-2026-XXXXXX.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block mb-1">
                  {isTa ? '2. நேரடி அரசு இணையதளம் (Official Portal)' : '2. Direct Official TN Portal'}
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {isTa ? 'தமிழ்நாடு இ-சேவை அல்லது துறை சார்ந்த அதிகாரப்பூர்வ இணையதளத்தில் நேரடியாக சமர்ப்பிக்கலாம்.' : 'Submit directly through TN e-Sevai or official departmental portal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Official Verification Information Note */}
          <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-600 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-900 shrink-0" />
              <span>{isTa ? 'முக்கிய அறிவிப்பு' : 'Information Note'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {isTa 
                ? 'திட்ட நிபந்தனைகள் மற்றும் விண்ணப்ப நடைமுறைகளைச் சம்பந்தப்பட்ட அரசுத் துறையின் மூலம் உறுதிப்படுத்திக் கொள்ளவும்.'
                : 'Please confirm scheme conditions and application procedures through the relevant official department.'}
            </p>
          </div>
        </div>

      </div>

      {/* Required Documents Section */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-900" />
          <span>{isTa ? 'தேவைப்படும் சான்றிதழ்கள் & ஆவணங்கள்' : 'Required Supporting Documents & Standards'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scheme.requiredDocuments?.map((doc: any, idx: number) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">{isTa ? doc.label?.ta : doc.label?.en}</span>
                <span className="text-[10px] text-slate-500">
                  {doc.docType} • Max 5MB (PDF/JPG)
                </span>
              </div>
              {doc.isMandatory ? (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                  {isTa ? 'கட்டாயம்' : 'Mandatory'}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                  {isTa ? 'விருப்பத் தேர்வு' : 'Optional'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

