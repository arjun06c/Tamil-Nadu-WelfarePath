import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Award,
  Scan,
  UserCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  Search,
  Check,
  FileText,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Sprout,
  Stethoscope,
  Home,
  Briefcase,
  Landmark,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';

export const CitizenDashboardPage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();

    const handleProfileUpdated = () => {
      fetchDashboardData();
    };

    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/citizen/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error fetching citizen dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-teal-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa
            ? 'உங்கள் தனிப்பட்ட நலன்பாதை போர்ட்டல் லோடு செய்யப்படுகிறது...'
            : 'Loading personalized citizen welfare workspace...'}
        </p>
      </div>
    );
  }

  const profileCompletion = dashboardData?.profileCompletion || {
    percentage: 85,
    isComplete: false,
    missingFields: []
  };
  const eligibilitySummary = dashboardData?.eligibilitySummary || {
    strongMatches: 0,
    potentialMatches: 0,
    needsInformation: 0,
    documentsNeeded: 0,
    totalEligibleCount: 0
  };
  const recommendations = dashboardData?.recommendations || [];
  const topRecommendations = recommendations.slice(0, 4);
  const applicationsSummary = dashboardData?.applicationsSummary || {
    totalCount: 0,
    activeCount: 0,
    recentApplications: []
  };
  const documentsSummary = dashboardData?.documentsSummary || {
    verifiedCount: 0,
    pendingCount: 0,
    correctionCount: 0
  };
  const benefitsSummary = dashboardData?.benefitsSummary || {
    totalActive: 0,
    activeBenefits: []
  };
  const digilockerStatus = dashboardData?.digilockerStatus || { isConnected: false };
  const actionRequiredItems = dashboardData?.actionRequiredItems || [];

  const topDomains = [
    {
      key: 'education',
      nameEn: 'Education & Scholarships',
      nameTa: 'கல்வி & உதவித்தொகை',
      icon: GraduationCap,
      color: 'bg-blue-50/70 text-blue-900 border-blue-200'
    },
    {
      key: 'women_child',
      nameEn: 'Women & Child Welfare',
      nameTa: 'மகளிர் & குழந்தைகள் நலன்',
      icon: HeartHandshake,
      color: 'bg-rose-50/70 text-rose-900 border-rose-200'
    },
    {
      key: 'agriculture',
      nameEn: 'Agriculture & Farmers',
      nameTa: 'வேளாண்மை & விவசாயிகள்',
      icon: Sprout,
      color: 'bg-emerald-50/70 text-emerald-900 border-emerald-200'
    },
    {
      key: 'health',
      nameEn: 'Health & Nutrition',
      nameTa: 'சுகாதாரம் & ஊட்டச்சத்து',
      icon: Stethoscope,
      color: 'bg-teal-50/70 text-teal-900 border-teal-200'
    },
    {
      key: 'housing',
      nameEn: 'Housing & Basic Livelihood',
      nameTa: 'வீட்டு வசதி & வாழ்வாதாரம்',
      icon: Home,
      color: 'bg-amber-50/70 text-amber-900 border-amber-200'
    },
    {
      key: 'employment',
      nameEn: 'Employment & Skill Development',
      nameTa: 'வேலைவாய்ப்பு & திறன்',
      icon: Briefcase,
      color: 'bg-indigo-50/70 text-indigo-900 border-indigo-200'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. WELCOME HERO SECTION (Balanced & Modern, No Oversized Empty Space) */}
      <div className="gov-card p-6 md:p-7 bg-gradient-to-r from-[#10243A] via-[#163354] to-[#0D9488] text-white shadow-lg relative overflow-hidden border-0">
        {/* Subtle Decorative Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none opacity-50" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>
                {isTa
                  ? `வணக்கம், ${user?.name || 'குடிமகன்'}`
                  : `Welcome, ${user?.name || 'Citizen'}`}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-[11px] font-semibold text-teal-100">
                Tamil Nadu Citizen ID: TN-{(user?._id || user?.id || '9841').slice(-6).toUpperCase()}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {isTa
                ? 'உங்கள் தகுதியான அரசு நலத்திட்டங்களை எளிதாக கண்டறியுங்கள்'
                : 'Direct Access to Your Eligible Government Welfare Benefits'}
            </h1>

            <p className="text-xs md:text-sm text-slate-200 leading-relaxed max-w-xl">
              {eligibilitySummary.totalEligibleCount > 0
                ? isTa
                  ? `உங்கள் சுயவிவரத்தின் அடிப்படையில் ${eligibilitySummary.totalEligibleCount} அரசு நலத்திட்டங்கள் பொருந்தக்கூடியவையாக உள்ளன.`
                  : `We identified ${eligibilitySummary.totalEligibleCount} government schemes that match your authenticated profile.`
                : isTa
                ? 'உங்கள் தற்போதைய தகவல்களுக்கு நேரடி திட்டங்கள் கண்டறியப்படவில்லை. சுயவிவரத்தை முழுமையாக நிரப்பவும்.'
                : 'No active matches found for current profile facts. Update details to check full eligibility.'}
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/citizen/eligible-schemes"
              className="px-4 py-2.5 bg-[#0D9488] hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 active:scale-95 border border-teal-300/30"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{isTa ? 'எனக்கு தகுதியானவை' : 'View Eligible Schemes'}</span>
            </Link>

            <Link
              to="/citizen/profile"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/25 transition-colors backdrop-blur-xs"
            >
              {isTa ? 'சுயவிவரம் புதுப்பிக்க' : 'Complete Profile'}
            </Link>
          </div>
        </div>

        {/* Integrated Profile Completion Progress Strip */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="font-bold text-slate-200 text-xs shrink-0">
              {isTa
                ? `சுயவிவர நிறைவு நிலை: ${profileCompletion.percentage}%`
                : `Profile Completion: ${profileCompletion.percentage}%`}
            </span>
            <div className="w-full max-w-xs bg-black/30 h-2 rounded-full overflow-hidden shrink-1">
              <div
                className="bg-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>
          </div>

          {profileCompletion.missingFields && profileCompletion.missingFields.length > 0 && (
            <div className="text-[11px] text-teal-200 font-medium truncate">
              {isTa ? 'விடுபட்டவை: ' : 'Missing: '}
              <span className="underline decoration-teal-300/50">
                {profileCompletion.missingFields
                  .slice(0, 2)
                  .map((m: any) => (isTa ? m.label?.ta || m.label?.en : m.label?.en))
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. FOUR CORE STATISTICS CARDS (Consistent, Clickable, Exact Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Strong Matches */}
        <StatCard
          title={isTa ? 'முழு தகுதி பெற்றவை' : 'Strong Matches'}
          value={eligibilitySummary.strongMatches || 0}
          subtext={isTa ? 'உடனடி விண்ணப்பம் செய்யலாம்' : 'Fully verified & ready to apply'}
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => navigate('/citizen/eligible-schemes?status=strong')}
        />

        {/* Potential Matches */}
        <StatCard
          title={isTa ? 'சாத்தியமான தகுதி' : 'Potential Matches'}
          value={eligibilitySummary.potentialMatches || 0}
          subtext={isTa ? 'கூடுதல் ஆவணம் தேவைப்படலாம்' : 'Requires additional document'}
          icon={AlertTriangle}
          variant="amber"
          onClick={() => navigate('/citizen/eligible-schemes?status=potential')}
        />

        {/* Active Applications */}
        <StatCard
          title={isTa ? 'செயலிலுள்ள விண்ணப்பங்கள்' : 'Active Applications'}
          value={applicationsSummary.activeCount || 0}
          subtext={isTa ? 'முன்னேற்றத்தைக் காண்க' : 'Track ongoing verification'}
          icon={FileCheck}
          variant="blue"
          onClick={() => navigate('/citizen/applications')}
        />

        {/* Approved Benefits */}
        <StatCard
          title={isTa ? 'பெறப்பட்ட அரசு உதவிகள்' : 'Approved Benefits'}
          value={benefitsSummary.totalActive || 0}
          subtext={isTa ? 'பரிமாற்ற விவரங்களைக் காண்க' : 'Active DBT disbursements'}
          icon={Award}
          variant="teal"
          onClick={() => navigate('/citizen/benefits')}
        />
      </div>

      {/* 3. ACTION REQUIRED & NEXT STEPS (Timeline style alert card) */}
      {actionRequiredItems && actionRequiredItems.length > 0 && (
        <div className="gov-card p-5 border-l-4 border-l-amber-500 bg-amber-50/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{isTa ? 'உடனடி நடவடிக்கைகள் தேவை' : 'Action Required for Eligibility'}</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              {actionRequiredItems.length} {isTa ? 'நடவடிக்கைகள்' : 'Pending Tasks'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {actionRequiredItems.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#172B4D]">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{isTa ? item.title?.ta || item.title?.en : item.title?.en}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {isTa ? item.description?.ta || item.description?.en : item.description?.en}
                  </p>
                </div>

                <Link
                  to={item.ctaPath || '/citizen/profile'}
                  className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 self-start"
                >
                  <span>{isTa ? item.ctaText?.ta || 'தொடங்குக' : item.ctaText?.en || 'Proceed'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. RECOMMENDED SCHEMES GRID (High Priority Cards with Clear Benefits) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172B4D] tracking-tight">
                {isTa ? 'உங்களுக்காக பரிந்துரைக்கப்பட்ட திட்டங்கள்' : 'Recommended Schemes for Your Profile'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isTa ? 'துல்லியமான தகுதி விதிகளுக்கு உட்பட்டு தேர்ந்தெடுக்கப்பட்டவை' : 'Matched via automated state rule engine based on your credentials'}
              </p>
            </div>
          </div>

          <Link
            to="/citizen/eligible-schemes"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>{isTa ? 'அனைத்தையும் காண்க' : 'View All Eligible Schemes'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topRecommendations.length === 0 ? (
          <div className="gov-card p-8 rounded-2xl text-center space-y-2">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              {isTa ? 'பரிந்துரைக்கப்பட்ட திட்டங்கள் ஏதும் இல்லை.' : 'No direct scheme matches found for current credentials.'}
            </p>
            <p className="text-[11px] text-slate-500">
              {isTa ? 'அனைத்து திட்டங்களையும் உலாவவும்:' : 'Explore all government schemes catalog:'}
            </p>
            <Link
              to="/citizen/schemes"
              className="inline-block mt-2 px-4 py-2 bg-[#10243A] text-white rounded-xl text-xs font-bold"
            >
              {isTa ? 'நலத்திட்டங்கள் கண்டறிதல்' : 'Discover All Schemes'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topRecommendations.map((item: any) => {
              const { scheme, status, criteriaBreakdown, missingDocuments } = item;
              const title = isTa ? scheme?.name?.ta || scheme?.name?.en : scheme?.name?.en;
              const benefitText = isTa
                ? scheme?.benefitSummary?.ta || scheme?.benefitSummary?.en
                : scheme?.benefitSummary?.en;
              const passedCriteria = (criteriaBreakdown || []).filter((c: any) => c.passed);

              return (
                <div
                  key={scheme._id || scheme.schemeCode}
                  className="gov-card p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-200"
                >
                  <div>
                    {/* Tags */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-[#10243A] border border-slate-200">
                        {scheme.schemeCode || scheme.domainKey?.replace('_', ' ')}
                      </span>
                      <StatusBadge status={status} isTamil={isTa} size="sm" />
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-[#172B4D] mb-1.5 line-clamp-1 hover:text-blue-700 transition-colors">
                      <Link to={`/schemes/${scheme._id}`}>{title}</Link>
                    </h3>

                    {/* Benefit Box */}
                    {benefitText && (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 mb-3">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                          {isTa ? 'அரசு உதவித்தொகை' : 'Direct Financial Grant'}
                        </div>
                        <div className="text-xs font-extrabold text-emerald-950 truncate">
                          {benefitText}
                        </div>
                      </div>
                    )}

                    {/* Criteria Preview */}
                    <div className="space-y-1.5 text-xs">
                      {passedCriteria.slice(0, 2).map((c: any, i: number) => (
                        <div key={i} className="flex items-center space-x-1.5 text-emerald-900 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{isTa ? c.label?.ta || c.label?.en : c.label?.en}</span>
                        </div>
                      ))}
                      {missingDocuments && missingDocuments.length > 0 && (
                        <div className="flex items-center space-x-1.5 text-amber-800 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">
                            {isTa ? missingDocuments[0].label?.ta || missingDocuments[0].label?.en : missingDocuments[0].label?.en} {isTa ? 'தேவைப்படுகிறது' : 'required'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to="/citizen/eligible-schemes"
                      className="text-xs font-bold text-slate-600 hover:text-[#10243A]"
                    >
                      {isTa ? 'தகுதி விவரம்' : 'View Criteria Breakdown'}
                    </Link>

                    <Link
                      to={`/citizen/apply/${scheme._id}`}
                      className="px-3.5 py-1.5 bg-[#10243A] hover:bg-[#193352] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                    >
                      <span>{isTa ? 'விண்ணப்பிக்க' : 'Apply Now'}</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. SPLIT SECTION: RECENT APPLICATIONS & DOCUMENT CENTER OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Recent Applications Tracker */}
        <div className="gov-card p-5 flex flex-col justify-between space-y-4 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <h3 className="text-xs font-extrabold text-[#172B4D] uppercase tracking-wider">
                  {isTa ? 'சமீபத்திய விண்ணப்பங்கள்' : 'Application Journey & Tracking'}
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-extrabold text-[10px] rounded-full">
                {applicationsSummary.totalCount || 0} {isTa ? 'மொத்தம்' : 'Total'}
              </span>
            </div>

            {applicationsSummary.recentApplications && applicationsSummary.recentApplications.length > 0 ? (
              <div className="mt-3.5 space-y-2.5">
                {applicationsSummary.recentApplications.slice(0, 3).map((app: any) => (
                  <div
                    key={app._id}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-[11px] text-[#10243A] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {app.applicationNo}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#172B4D] mt-1 truncate max-w-md">
                        {(app.schemeId as any)?.name?.en || app.applicationNo}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <StatusBadge status={app.status} isTamil={isTa} size="sm" />
                      <Link
                        to={`/citizen/applications/${app._id}`}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900"
                      >
                        {isTa ? 'கண்காணிக்க' : 'Track'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                {isTa ? 'செயலிலுள்ள விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No active applications currently submitted.'}
              </div>
            )}
          </div>

          <Link
            to="/citizen/applications"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition-colors block"
          >
            {isTa ? 'அனைத்து விண்ணப்பங்களையும் காண்க' : 'View Full Application History'}
          </Link>
        </div>

        {/* Verified Documents & DigiLocker Widget */}
        <div className="gov-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Scan className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-extrabold text-[#172B4D] uppercase tracking-wider">
                  {isTa ? 'ஆவண மையம்' : 'Document Center'}
                </h3>
              </div>

              {digilockerStatus.isConnected ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>DigiLocker Synced</span>
                </span>
              ) : (
                <Link
                  to="/citizen/settings/digilocker"
                  className="text-[10px] font-bold text-blue-700 hover:underline"
                >
                  + Link DigiLocker
                </Link>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <div className="text-lg font-black text-emerald-800">
                  {documentsSummary.verifiedCount || 0}
                </div>
                <div className="text-[10px] font-bold text-emerald-900">
                  {isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified'}
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <div className="text-lg font-black text-amber-800">
                  {documentsSummary.pendingCount || 0}
                </div>
                <div className="text-[10px] font-bold text-amber-900">
                  {isTa ? 'நிலுவையில்' : 'Pending'}
                </div>
              </div>

              <div className="p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl">
                <div className="text-lg font-black text-rose-800">
                  {documentsSummary.correctionCount || 0}
                </div>
                <div className="text-[10px] font-bold text-rose-900">
                  {isTa ? 'திருத்தம்' : 'Correction'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              {isTa
                ? 'உங்கள் சான்றிதழ்கள் TNeGA மற்றும் அரசு அங்கீகரிக்கப்பட்ட ஆவண களஞ்சியத்துடன் ஒத்திசைக்கப்படுகின்றன.'
                : 'Authenticated e-Governance certificates and DigiLocker credentials are safely linked to your profile.'}
            </p>
          </div>

          <Link
            to="/citizen/documents"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition-colors block"
          >
            {isTa ? 'ஆவண மையத்தைத் திறக்குக' : 'Manage Documents'}
          </Link>
        </div>

      </div>

      {/* 6. WELFARE AREAS / DEPARTMENTS */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-extrabold text-[#172B4D] uppercase tracking-wider">
              {isTa ? 'நலத்திட்டத் துறைகளை ஆராய்க' : 'Tamil Nadu Welfare Sectors'}
            </h3>
          </div>

          <Link
            to="/citizen/schemes"
            className="text-xs font-bold text-blue-700 hover:underline flex items-center space-x-1"
          >
            <span>{isTa ? 'அனைத்துத் துறைகளும்' : 'View All Welfare Areas'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {topDomains.map((dom) => {
            const Icon = dom.icon;
            return (
              <Link
                key={dom.key}
                to={`/citizen/schemes?domainKey=${dom.key}`}
                className={`p-3.5 rounded-xl border text-center transition-all hover:-translate-y-0.5 hover:shadow-sm ${dom.color}`}
              >
                <Icon className="w-5 h-5 mx-auto mb-2 opacity-90" />
                <div className="text-xs font-bold leading-tight">
                  {isTa ? dom.nameTa : dom.nameEn}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
};
