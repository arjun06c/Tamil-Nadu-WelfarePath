import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Award,
  FileText,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Layers,
  FileCheck,
  Info,
  Landmark,
  ArrowLeft,
  Calendar,
  Check
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';

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
      navigate(`/citizen/eligibility?schemeId=${id}`);
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

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'திட்ட விவரங்கள் பெறப்படுகின்றன...' : 'Loading verified scheme details...'}
        </p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="py-20 text-center space-y-3 text-xs text-slate-500">
        <p>{isTa ? 'திட்டம் கிடைக்கவில்லை.' : 'Welfare scheme record not found.'}</p>
        <Link
          to="/citizen/schemes"
          className="inline-block px-4 py-2 bg-[#10243A] text-white rounded-xl text-xs font-bold"
        >
          {isTa ? 'திட்டங்கள் பட்டியலுக்குத் திரும்பு' : 'Back to Schemes Catalog'}
        </Link>
      </div>
    );
  }

  const name = isTa ? scheme.name?.ta || scheme.name?.en : scheme.name?.en;
  const department = isTa ? scheme.department?.ta || scheme.department?.en : scheme.department?.en;
  const description = isTa
    ? scheme.description?.ta || scheme.description?.en
    : scheme.description?.en;
  const benefit = isTa
    ? scheme.benefitSummary?.ta || scheme.benefitSummary?.en
    : scheme.benefitSummary?.en;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title={name}
        subtitle={department}
        badge={scheme.schemeCode || 'TN-GOV-SCHEME'}
        badgeVariant="blue"
        icon={Landmark}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: user ? '/citizen/dashboard' : '/' },
          { label: isTa ? 'திட்டங்கள்' : 'Discover Schemes', href: user ? '/citizen/schemes' : '/schemes' },
          { label: isTa ? 'விவரம்' : 'Scheme Details' }
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartApplication}
              className="px-5 py-2.5 bg-[#10243A] hover:bg-[#193352] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <FileCheck className="w-4 h-4 text-teal-300" />
              <span>{isTa ? 'இப்போது விண்ணப்பிக்க' : 'Apply Now'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        }
      />

      {/* Main Banner / Benefit Box */}
      <div className="gov-card p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-md font-extrabold uppercase bg-slate-100 text-[#10243A] border border-slate-200">
            {scheme.schemeCode}
          </span>
          {scheme.domainKey && (
            <span className="px-2.5 py-0.5 rounded-md font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
              {scheme.domainKey.replace(/_/g, ' ')}
            </span>
          )}
          {scheme.category && (
            <span className="px-2.5 py-0.5 rounded-md font-bold uppercase bg-indigo-50 text-indigo-900 border border-indigo-200">
              {scheme.category}
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">
          {description}
        </p>

        {/* Benefits Highlight Box */}
        <div className="p-5 bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-emerald-50/60 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              {isTa ? 'அரசு வழங்கும் நிதி / உதவி சலுகைகள்' : 'Official Financial Grant & Benefit Scope'}
            </span>
            <div className="text-base font-extrabold text-emerald-950 mt-1">
              {benefit}
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-800 bg-white/90 px-3.5 py-2 rounded-xl border border-emerald-200 self-start sm:self-auto">
            {isTa ? 'அங்கீகரிக்கப்பட்டது: தமிழ்நாடு அரசு' : 'Official State Program 2026'}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleStartApplication}
            className="px-5 py-2.5 bg-[#10243A] hover:bg-[#193352] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 active:scale-95"
          >
            <FileCheck className="w-4 h-4 text-teal-300" />
            <span>{isTa ? 'விண்ணப்பத்தைத் தொடங்குக' : 'Start Application Process'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {evaluating
                ? isTa
                  ? 'கணக்கிடுகிறது...'
                  : 'Evaluating Criteria...'
                : isTa
                ? 'தகுதியை சோதிக்க'
                : 'Evaluate My Profile'}
            </span>
          </button>

          {scheme.officialUrl && (
            <a
              href={scheme.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <span>{isTa ? 'அதிகாரப்பூர்வ தளம்' : 'Official Dept Portal'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          )}
        </div>
      </div>

      {/* Grid: Eligibility Criteria & Application Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Eligibility Breakdown (2 Cols) */}
        <div className="lg:col-span-2 gov-card p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>{isTa ? 'தகுதி விதிமுறைகள்' : 'Official Eligibility Criteria Breakdown'}</span>
          </h2>

          <div className="space-y-3">
            {/* Level 1: Fully Eligible */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isTa ? '1. முக்கிய தகுதிகள் (Mandatory Criteria)' : '1. Mandatory Direct Criteria'}</span>
              </div>
              <ul className="text-xs text-emerald-950 space-y-1 pl-6 list-disc">
                <li>
                  {isTa
                    ? 'தமிழ்நாடு நிரந்தர வசிப்பிட சான்றிதழ் கொண்டவர்'
                    : 'Resident of Tamil Nadu with verified domicile proof'}
                </li>
                <li>
                  {isTa
                    ? `குடும்ப ஆண்டு வருமானம்: ₹${
                        scheme.eligibilityRules?.incomeCap?.toLocaleString('en-IN') || '2,50,000'
                      } வரம்பிற்குள்`
                    : `Family annual income must be within ₹${
                        scheme.eligibilityRules?.incomeCap?.toLocaleString('en-IN') || '2,50,000'
                      }`}
                </li>
                <li>
                  {isTa
                    ? `வயது வரம்பு: ${scheme.eligibilityRules?.minAge || 18} முதல் ${
                        scheme.eligibilityRules?.maxAge || 60
                      } ஆண்டுகள்`
                    : `Age criteria: ${scheme.eligibilityRules?.minAge || 18} to ${
                        scheme.eligibilityRules?.maxAge || 60
                      } years`}
                </li>
              </ul>
            </div>

            {/* Level 2: Conditional Gaps */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isTa
                    ? '2. சான்றிதழ் தேவைகள் (Conditional Requirements)'
                    : '2. Conditional Proof Requirements'}
                </span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed pl-6">
                {isTa
                  ? 'நடப்பு நிதியாண்டு வருமானச் சான்றிதழ் அல்லது ரேஷன் கார்டு திருத்தம் தேவைப்படலாம்.'
                  : 'May require valid current financial year revenue certificates or Aadhaar-linked bank details.'}
              </p>
            </div>

            {/* Level 3: Ineligible Exclusions */}
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-900">
                <HelpCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{isTa ? '3. தகுதியின்மை விலக்குகள் (Exclusions)' : '3. Strict Exclusion Boundaries'}</span>
              </div>
              <ul className="text-xs text-rose-950 space-y-1 pl-6 list-disc">
                <li>
                  {isTa
                    ? 'வருமான வரி செலுத்துவோர் அல்லது அரசு நிரந்தர ஊழியர்கள் விலக்கப்படுகிறார்கள்.'
                    : 'Income tax payees and permanent state/central government employees are excluded.'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Application Method & Guidelines */}
        <div className="space-y-4">
          <div className="gov-card p-6 space-y-3">
            <h2 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>{isTa ? 'விண்ணப்ப முறை' : 'Application Process'}</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-900 block mb-0.5">
                  {isTa ? '1. இணையவழி உதவி (Platform Assisted)' : '1. Digital Portal Assistance'}
                </span>
                <p className="text-blue-950 text-[11px] leading-relaxed">
                  {isTa
                    ? 'இத்தளம் வழியே விண்ணப்பித்து ஆவணங்களை இணைத்து TNP-WP கண்காணிப்பு எண் பெறலாம்.'
                    : 'Submit application online through WelfarePath with automated DigiLocker document attachment.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-800 block mb-0.5">
                  {isTa ? '2. இ-சேவை மையம் (e-Sevai Center)' : '2. Direct e-Sevai / Portal'}
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {isTa
                    ? 'அருகிலுள்ள தமிழ்நாடு அரசு இ-சேவை மையத்திலும் விண்ணப்பிக்கலாம்.'
                    : 'You can also apply in person at any authorized Tamil Nadu e-Sevai center.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{isTa ? 'அரசு வழிகாட்டுதல்' : 'Department Notice'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {isTa
                ? 'அனைத்து விண்ணப்பங்களும் அதிகாரப்பூர்வ அலுவலர் சரிபார்ப்புக்கு உட்பட்டவை.'
                : 'All scheme approvals are subject to official verification of original records by designated welfare officers.'}
            </p>
          </div>
        </div>
      </div>

      {/* Required Supporting Documents Section */}
      <div className="gov-card p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2 pb-2 border-b border-slate-100">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>{isTa ? 'தேவைப்படும் ஆவணங்கள்' : 'Required Verification Documents'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scheme.requiredDocuments?.map((doc: any, idx: number) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-800 block">
                  {isTa ? doc.label?.ta || doc.label?.en : doc.label?.en}
                </span>
                <span className="text-[10px] text-slate-400">{doc.docType} • Max 5MB</span>
              </div>
              {doc.isMandatory ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  {isTa ? 'கட்டாயம்' : 'Mandatory'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
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
