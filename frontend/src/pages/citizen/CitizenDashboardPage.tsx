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
  Briefcase
} from 'lucide-react';

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
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'உங்கள் தனிப்பட்ட நலன்பாதை போர்ட்டல் லோடு செய்யப்படுகிறது...' : 'Loading personalized citizen welfare workspace...'}
        </p>
      </div>
    );
  }

  const profileCompletion = dashboardData?.profileCompletion || { percentage: 85, missingFields: [] };
  const eligibilitySummary = dashboardData?.eligibilitySummary || { strongMatches: 0, potentialMatches: 0, needsInformation: 0, documentsNeeded: 0, totalEligibleCount: 0 };
  const recommendations = dashboardData?.recommendations || [];
  const topRecommendations = recommendations.slice(0, 4);
  const applicationsSummary = dashboardData?.applicationsSummary || { totalCount: 0, activeCount: 0, recentApplications: [] };
  const documentsSummary = dashboardData?.documentsSummary || { verifiedCount: 0, pendingCount: 0, correctionCount: 0 };
  const benefitsSummary = dashboardData?.benefitsSummary || { totalActive: 0, activeBenefits: [] };
  const digilockerStatus = dashboardData?.digilockerStatus || { isConnected: false };
  const actionRequiredItems = dashboardData?.actionRequiredItems || [];

  const topDomains = [
    { key: 'education', nameEn: 'Education & Scholarships', nameTa: 'கல்வி & உதவித்தொகை', icon: GraduationCap, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'women_child', nameEn: 'Women & Child Welfare', nameTa: 'மகளிர் & குழந்தைகள் நலன்', icon: HeartHandshake, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { key: 'agriculture', nameEn: 'Agriculture & Farmers', nameTa: 'வேளாண்மை & விவசாயிகள் நலன்', icon: Sprout, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'health', nameEn: 'Health & Nutrition', nameTa: 'சுகாதாரம் & ஊட்டச்சத்து', icon: Stethoscope, color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { key: 'housing', nameEn: 'Housing & Basic Livelihood', nameTa: 'வீட்டு வசதி & வாழ்வாதாரம்', icon: Home, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'employment', nameEn: 'Employment & Skill Development', nameTa: 'வேலைவாய்ப்பு & திறன் மேம்பாடு', icon: Briefcase, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. WELCOME HERO SECTION (Requirement 11 & 12) */}
      <div className="glass-card p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-teal-900 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{isTa ? 'வணக்கம், ' + (user?.name || 'வாடிக்கையாளர்') : 'Welcome back, ' + (user?.name || 'Citizen')}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isTa ? 'உங்கள் தகுதியான நலத்திட்டங்களைக் கண்டறிவோம்' : 'Let\'s find welfare benefits that match your profile.'}
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {eligibilitySummary.totalEligibleCount > 0
                ? isTa
                  ? `உங்கள் சுயவிவரத்துடன் பொருந்தக்கூடிய ${eligibilitySummary.totalEligibleCount} நலத்திட்டங்கள் கண்டறியப்பட்டுள்ளன.`
                  : `We found ${eligibilitySummary.totalEligibleCount} welfare schemes that may match your profile.`
                : isTa
                ? 'உங்கள் தற்போதைய சுயவிவரத் தகவலின் அடிப்படையில் நேரடி தகுதிகள் ஏதும் கிடைக்கவில்லை.'
                : 'We couldn\'t find a current match based on your available profile information.'}
              {!profileCompletion.isComplete && (
                <span className="block text-teal-300 font-semibold mt-1">
                  {isTa ? 'சுயவிவரத்தை பூர்த்தி செய்வதன் மூலம் துல்லியமான தகுதியைப் பெறலாம்.' : 'Complete your profile to improve personalized matching.'}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/citizen/eligible-schemes"
              className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 hover:scale-[1.02]"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{isTa ? 'எனக்கு தகுதியானவை' : 'View My Eligible Schemes'}</span>
            </Link>

            <Link
              to="/citizen/profile"
              className="px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              {isTa ? 'சுயவிவரம் புதுப்பிக்க' : 'Complete Profile'}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. PROFILE COMPLETION CARD (Requirement 10 & 42) */}
      {!profileCompletion.isComplete && (
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                {isTa ? `உங்கள் சுயவிவரம் ${profileCompletion.percentage}% பூர்த்தியாகியுள்ளது` : `Your profile is ${profileCompletion.percentage}% complete.`}
              </span>
              <span className="text-xs font-black text-teal-700">{profileCompletion.percentage}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${profileCompletion.percentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-600">
              {isTa ? 'திட்டங்கள் தகுதியை மேம்படுத்த விடுபட்ட தகவல்களைப் பூர்த்தி செய்யவும்:' : 'Complete your profile to improve scheme matching.'}
              {profileCompletion.missingFields && profileCompletion.missingFields.length > 0 && (
                <span className="font-semibold text-slate-800 ml-1">
                  Missing: {profileCompletion.missingFields.map((m: any) => (isTa ? m.label.ta : m.label.en)).join(', ')}
                </span>
              )}
            </p>
          </div>

          <Link
            to="/citizen/profile"
            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-xs rounded-xl border border-teal-200 transition-colors shrink-0"
          >
            {isTa ? 'சுயவிவரம் பூர்த்தி செய்க' : 'Complete Profile'}
          </Link>
        </div>
      )}

      {/* 3. CLICKABLE DASHBOARD STATISTICS (Requirement 13, 14, 45) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Strong Matches */}
        <button
          onClick={() => navigate('/citizen/eligible-schemes?status=strong')}
          className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black text-slate-900">{eligibilitySummary.strongMatches || 0}</div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">{isTa ? 'முழு தகுதியான திட்டங்கள்' : 'Strong Matches'}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center">
            <span>{isTa ? 'உடனடி விண்ணப்பம்' : 'Ready to apply'}</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </button>

        {/* Potential Matches (Replaced Near Eligible) */}
        <button
          onClick={() => navigate('/citizen/eligible-schemes?status=potential')}
          className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black text-slate-900">{eligibilitySummary.potentialMatches || 0}</div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">{isTa ? 'சாத்தியமான தகுதி' : 'Potential Matches'}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center">
            <span>{isTa ? 'ஆவணம் தேவைப்படலாம்' : 'May qualify'}</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </button>

        {/* Active Applications */}
        <button
          onClick={() => navigate('/citizen/applications')}
          className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-900 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black text-slate-900">{applicationsSummary.activeCount || 0}</div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">{isTa ? 'செயலிலுள்ள விண்ணப்பங்கள்' : 'Active Applications'}</div>
          <div className="text-[11px] text-blue-800 font-semibold mt-0.5 flex items-center">
            <span>{isTa ? 'நிலையைக் காண்க' : 'Track progress'}</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </button>

        {/* Approved Benefits */}
        <button
          onClick={() => navigate('/citizen/benefits')}
          className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-600 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black text-slate-900">{benefitsSummary.totalActive || 0}</div>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2">{isTa ? 'பெறப்பட்ட உதவிகள்' : 'Approved Benefits'}</div>
          <div className="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center">
            <span>{isTa ? 'பயன் விவரங்கள்' : 'View portfolio'}</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </button>

      </div>

      {/* 4. MAIN SECTION — RECOMMENDED FOR YOU (Requirement 7, 8, 9, 30) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>{isTa ? 'உங்களுக்கான சிறந்த பரிந்துரைகள்' : 'Recommended For You'}</span>
          </h2>

          <Link
            to="/citizen/eligible-schemes"
            className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center space-x-1"
          >
            <span>{isTa ? 'அனைத்தையும் காண்க' : 'View All Eligible Schemes'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {topRecommendations.length === 0 ? (
          <div className="glass-card p-6 rounded-2xl text-center text-xs text-slate-500">
            {isTa ? 'தற்போது பரிந்துரைகள் ஏதும் இல்லை. ' : 'No scheme recommendations found. '}
            <Link to="/citizen/schemes" className="text-blue-900 font-bold underline">
              {isTa ? 'திட்டங்களைக் கண்டறியவும்' : 'Explore All Schemes'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topRecommendations.map((item: any) => {
              const { scheme, status, criteriaBreakdown, missingDocuments } = item;
              const title = isTa ? scheme?.name?.ta || scheme?.name?.en : scheme?.name?.en;
              const benefitText = isTa ? scheme?.benefitSummary?.ta || scheme?.benefitSummary?.en : scheme?.benefitSummary?.en;
              const passedCriteria = (criteriaBreakdown || []).filter((c: any) => c.passed);

              return (
                <div
                  key={scheme._id || scheme.schemeCode}
                  className="glass-card p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {scheme.domainKey?.replace('_', ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        status === 'STRONG_MATCH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'POTENTIAL_MATCH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>

                    {benefitText && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {benefitText}
                      </p>
                    )}

                    <div className="mt-3 space-y-1 text-xs">
                      {passedCriteria.slice(0, 2).map((c: any, i: number) => (
                        <div key={i} className="flex items-center space-x-1.5 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{isTa ? c.label?.ta || c.label?.en : c.label?.en}</span>
                        </div>
                      ))}
                      {missingDocuments && missingDocuments.length > 0 && (
                        <div className="flex items-center space-x-1.5 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{isTa ? missingDocuments[0].label?.ta || missingDocuments[0].label?.en : missingDocuments[0].label?.en} required</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to="/citizen/eligible-schemes"
                      className="text-xs font-bold text-slate-700 hover:text-slate-900"
                    >
                      {isTa ? 'விவரம்' : 'View Breakdown'}
                    </Link>

                    <Link
                      to={`/citizen/apply/${scheme._id}`}
                      className="px-3 py-1.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-colors"
                    >
                      {isTa ? 'விண்ணப்பிக்க' : 'Apply Now'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. WHAT SHOULD I DO NEXT? & ACTION REQUIRED (Requirement 20 & 21) */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          {isTa ? 'அடுத்து என்ன செய்ய வேண்டும்?' : 'What should you do next?'}
        </h3>

        {actionRequiredItems.length === 0 ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{isTa ? 'நீங்கள் அனைத்தையும் பூர்த்தி செய்துவிட்டீர்கள். புதிய விபரங்கள் புதுப்பிக்கப்படும்போது தெரிவிக்கப்படும்.' : 'You\'re all caught up. No pending document or profile actions required at this time.'}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {actionRequiredItems.map((item: any, idx: number) => (
              <div key={item.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{isTa ? item.title.ta : item.title.en}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5">
                    {isTa ? item.description.ta : item.description.en}
                  </p>
                </div>

                <Link
                  to={item.ctaPath}
                  className="mt-2 text-xs font-extrabold text-blue-900 hover:text-blue-950 flex items-center space-x-1"
                >
                  <span>{isTa ? item.ctaText.ta : item.ctaText.en}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. SUMMARY CARDS GRID (Requirement 22, 23, 24, 25) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Applications Summary (Requirement 22) */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-blue-900" />
                <span>{isTa ? 'எனது விண்ணப்பங்கள்' : 'My Applications'}</span>
              </h4>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-[10px] rounded-full">
                {applicationsSummary.totalCount || 0}
              </span>
            </div>

            {applicationsSummary.recentApplications && applicationsSummary.recentApplications.length > 0 ? (
              <div className="mt-3 space-y-2">
                {applicationsSummary.recentApplications.slice(0, 2).map((app: any) => (
                  <div key={app._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {(app.schemeId as any)?.name?.en || app.applicationNo}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-teal-800">{app.status}</span>
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-3">
                {isTa ? 'செயலிலுள்ள விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No active applications.'}
              </p>
            )}
          </div>

          <Link
            to="/citizen/applications"
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition-colors block"
          >
            {isTa ? 'அனைத்து விண்ணப்பங்களையும் காண்க' : 'View All Applications'}
          </Link>
        </div>

        {/* Documents Summary (Requirement 24 & 25) */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Scan className="w-4 h-4 text-teal-600" />
                <span>{isTa ? 'எனது ஆவணங்கள்' : 'My Documents'}</span>
              </h4>
              {digilockerStatus.isConnected ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>DigiLocker</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500">DigiLocker Off</span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-lg font-black text-emerald-700">{documentsSummary.verifiedCount || 0}</div>
                <div className="text-[10px] font-semibold text-slate-600">{isTa ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-lg font-black text-amber-700">{documentsSummary.pendingCount || 0}</div>
                <div className="text-[10px] font-semibold text-slate-600">{isTa ? 'நிலுவையில்' : 'Pending'}</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-lg font-black text-rose-700">{documentsSummary.correctionCount || 0}</div>
                <div className="text-[10px] font-semibold text-slate-600">{isTa ? 'திருத்தம்' : 'Correction'}</div>
              </div>
            </div>
          </div>

          <Link
            to="/citizen/documents"
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition-colors block"
          >
            {isTa ? 'ஆவண மையத்தைத் திறக்குக' : 'Open Document Center'}
          </Link>
        </div>

        {/* Benefits Summary (Requirement 23) */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>{isTa ? 'செயலிலுள்ள உதவிகள்' : 'My Active Benefits'}</span>
              </h4>
              <span className="px-2 py-0.5 bg-teal-100 text-teal-900 font-extrabold text-[10px] rounded-full">
                {benefitsSummary.totalActive || 0}
              </span>
            </div>

            {benefitsSummary.activeBenefits && benefitsSummary.activeBenefits.length > 0 ? (
              <div className="mt-3 space-y-2">
                {benefitsSummary.activeBenefits.slice(0, 2).map((b: any) => (
                  <div key={b._id} className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl space-y-1 text-xs">
                    <div className="font-bold text-slate-900">
                      {(b.schemeId as any)?.name?.en || 'Approved Scheme Benefit'}
                    </div>
                    <div className="text-teal-900 font-extrabold">
                      {b.benefitDetails?.amount ? `₹${b.benefitDetails.amount.toLocaleString()} / month` : 'Active Benefit Released'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-3">
                {isTa ? 'செயலிலுள்ள அரசு உதவிகள் ஏதும் இல்லை.' : 'No active benefits yet.'}
              </p>
            )}
          </div>

          <Link
            to="/citizen/benefits"
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition-colors block"
          >
            {isTa ? 'உதவிகளைக் காண்க' : 'View Benefits'}
          </Link>
        </div>

      </div>

      {/* 7. EXPLORE WELFARE AREAS (Requirement 33) */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {isTa ? 'நலத்திட்டத் துறைகளை ஆராய்க' : 'Explore Welfare Areas'}
          </h3>
          <Link
            to="/citizen/schemes"
            className="text-xs font-bold text-blue-900 hover:underline flex items-center space-x-1"
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
                to={`/citizen/schemes?domain=${dom.key}`}
                className={`p-3.5 rounded-2xl border text-center transition-all hover:scale-[1.03] ${dom.color}`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
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
