import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UserCheck,
  FileText
} from 'lucide-react';

export const MyEligibleSchemesPage: React.FC = () => {
  const { lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    strongMatches: 0,
    potentialMatches: 0,
    needsInformation: 0,
    documentsNeeded: 0,
    notEligible: 0,
    totalEligibleCount: 0
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotEligible, setShowNotEligible] = useState<boolean>(false);
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState<any | null>(null);

  useEffect(() => {
    fetchEligibleSchemes();
    fetchDomains();

    const handleProfileUpdated = () => {
      fetchEligibleSchemes();
    };

    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setSelectedStatus(statusFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const fetchEligibleSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schemes/recommended');
      if (res.data) {
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.recommendations) {
          setRecommendations(res.data.recommendations);
        }
      }
    } catch (err) {
      console.error('Error fetching eligible schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await api.get('/schemes/domains');
      setDomains(res.data.domains || []);
    } catch (err) {
      console.error('Error fetching domains:', err);
    }
  };

  // Filter recommendations
  const activeRecommendations = recommendations.filter((item) => item.status !== 'NOT_ELIGIBLE');
  const notEligibleRecommendations = recommendations.filter((item) => item.status === 'NOT_ELIGIBLE');

  const filteredRecommendations = activeRecommendations.filter((item) => {
    const statusMatch =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'STRONG' && item.status === 'STRONG_MATCH') ||
      (selectedStatus === 'STRONG_MATCH' && item.status === 'STRONG_MATCH') ||
      (selectedStatus === 'POTENTIAL' && item.status === 'POTENTIAL_MATCH') ||
      (selectedStatus === 'POTENTIAL_MATCH' && item.status === 'POTENTIAL_MATCH') ||
      (selectedStatus === 'NEEDS_INFO' && item.status === 'NEEDS_INFORMATION') ||
      (selectedStatus === 'NEEDS_INFORMATION' && item.status === 'NEEDS_INFORMATION') ||
      (selectedStatus === 'DOCS_NEEDED' && (item.status === 'DOCUMENTS_REQUIRED' || (item.missingDocuments && item.missingDocuments.length > 0)));

    const domainMatch = selectedDomain === 'ALL' || item.scheme?.domainKey === selectedDomain;

    const query = searchQuery.trim().toLowerCase();
    const nameEn = item.scheme?.name?.en?.toLowerCase() || '';
    const nameTa = item.scheme?.name?.ta?.toLowerCase() || '';
    const code = item.scheme?.schemeCode?.toLowerCase() || '';
    const searchMatch = !query || nameEn.includes(query) || nameTa.includes(query) || code.includes(query);

    return statusMatch && domainMatch && searchMatch;
  });

  const getStatusBadgeUI = (status: string) => {
    switch (status) {
      case 'STRONG_MATCH':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTa ? 'முழு தகுதி (STRONG MATCH)' : 'STRONG MATCH'}</span>
          </span>
        );
      case 'POTENTIAL_MATCH':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTa ? 'சாத்தியமான தகுதி (POTENTIAL MATCH)' : 'POTENTIAL MATCH'}</span>
          </span>
        );
      case 'NEEDS_INFORMATION':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>{isTa ? 'கூடுதல் தகவல் தேவை' : 'MORE INFORMATION NEEDED'}</span>
          </span>
        );
      case 'DOCUMENTS_REQUIRED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isTa ? 'ஆவணங்கள் தேவைப்படுகின்றன' : 'DOCUMENTS NEEDED'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{isTa ? 'தகுதியற்றது' : 'NOT ELIGIBLE'}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'உங்கள் சுயவிவரத்துடன் நலத்திட்டங்களை ஒப்பிடுகிறது...' : 'Evaluating personalized scheme matches based on policy engine...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-extrabold uppercase tracking-wider mb-1">
              <BadgeCheck className="w-4 h-4 text-teal-400" />
              <span>{isTa ? 'தனிப்பட்ட தகுதிப் பட்டியல்' : 'PERSONALIZED MATCH RESULTS'}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {isTa ? 'எனக்கு தகுதியான நலத்திட்டங்கள்' : 'My Eligible Schemes'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isTa
                ? 'உங்கள் தற்போதைய சுயவிவரத்துடன் பொருந்தக்கூடிய அரசு நலத்திட்டங்கள்.'
                : 'Welfare schemes that may match your current profile.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/citizen/profile"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>{isTa ? 'சுயவிவரத்தைப் புதுப்பிக்க' : 'Update Profile'}</span>
            </Link>
          </div>
        </div>

        {/* Small Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>
            {isTa
              ? 'குறிப்பு: தகுதி நிலை உங்கள் சுயவிவரத் தகவலின் அடிப்படையில் கணிக்கப்பட்டது. அதிகாரப்பூர்வ சான்றிதழ் சரிபார்ப்புக்கு உட்பட்டது.'
              : 'Eligibility is based on the information currently available in your profile and may require official verification during application submission.'}
          </span>
        </div>
      </div>

      {/* Top Compact Summary Statistics (Requirement 6) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <button
          onClick={() => { setSelectedStatus('STRONG_MATCH'); setSearchParams({ status: 'strong' }); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === 'STRONG_MATCH' || selectedStatus === 'STRONG'
              ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-2 ring-emerald-400'
              : 'glass-card hover:border-emerald-300'
          }`}
        >
          <div className="text-2xl font-black text-emerald-900">{summary.strongMatches || 0}</div>
          <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center justify-between">
            <span>{isTa ? 'முழு தகுதி' : 'Strong Match'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus('POTENTIAL_MATCH'); setSearchParams({ status: 'potential' }); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === 'POTENTIAL_MATCH' || selectedStatus === 'POTENTIAL'
              ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-400'
              : 'glass-card hover:border-amber-300'
          }`}
        >
          <div className="text-2xl font-black text-amber-900">{summary.potentialMatches || 0}</div>
          <div className="text-xs font-bold text-amber-700 mt-1 flex items-center justify-between">
            <span>{isTa ? 'சாத்தியமான தகுதி' : 'Potential Match'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus('NEEDS_INFORMATION'); setSearchParams({ status: 'needs_info' }); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === 'NEEDS_INFORMATION' || selectedStatus === 'NEEDS_INFO'
              ? 'bg-sky-50 border-sky-500 shadow-sm ring-2 ring-sky-400'
              : 'glass-card hover:border-sky-300'
          }`}
        >
          <div className="text-2xl font-black text-sky-900">{summary.needsInformation || 0}</div>
          <div className="text-xs font-bold text-sky-700 mt-1 flex items-center justify-between">
            <span>{isTa ? 'கூடுதல் தகவல் தேவை' : 'More Info Needed'}</span>
            <HelpCircle className="w-4 h-4 text-sky-600" />
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus('DOCS_NEEDED'); setSearchParams({ status: 'docs' }); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedStatus === 'DOCS_NEEDED'
              ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-2 ring-indigo-400'
              : 'glass-card hover:border-indigo-300'
          }`}
        >
          <div className="text-2xl font-black text-indigo-900">{summary.documentsNeeded || 0}</div>
          <div className="text-xs font-bold text-indigo-700 mt-1 flex items-center justify-between">
            <span>{isTa ? 'ஆவணங்கள் தேவை' : 'Docs Needed'}</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
        </button>

      </div>

      {/* Filter and Search Bar (Requirement 29) */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Quick Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => { setSelectedStatus('ALL'); setSearchParams({}); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'அனைத்தும்' : 'All Matches'} ({activeRecommendations.length})
          </button>

          <button
            onClick={() => { setSelectedStatus('STRONG'); setSearchParams({ status: 'strong' }); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'STRONG' || selectedStatus === 'STRONG_MATCH'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'முழு தகுதி' : 'Strong Matches'}
          </button>

          <button
            onClick={() => { setSelectedStatus('POTENTIAL'); setSearchParams({ status: 'potential' }); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'POTENTIAL' || selectedStatus === 'POTENTIAL_MATCH'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'சாத்தியமான தகுதி' : 'Potential Matches'}
          </button>

          <button
            onClick={() => { setSelectedStatus('NEEDS_INFO'); setSearchParams({ status: 'needs_info' }); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'NEEDS_INFO' || selectedStatus === 'NEEDS_INFORMATION'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'கூடுதல் தகவல்' : 'More Info'}
          </button>

          <button
            onClick={() => { setSelectedStatus('DOCS_NEEDED'); setSearchParams({ status: 'docs' }); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'DOCS_NEEDED'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'ஆவணங்கள் தேவை' : 'Docs Needed'}
          </button>
        </div>

        {/* Search & Domain Filter Dropdown */}
        <div className="flex items-center space-x-2">
          
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={isTa ? 'திட்டத்தைத் தேட...' : 'Search schemes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
            >
              <option value="ALL">{isTa ? 'அனைத்துத் துறைகள்' : 'All Welfare Areas'}</option>
              {domains.map((d) => (
                <option key={d.domainKey} value={d.domainKey}>
                  {isTa ? d.name?.ta || d.name?.en : d.name?.en}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

        </div>

      </div>

      {/* Main Section — Best Matches For You (Requirement 7, 8, 9, 30) */}
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>{isTa ? 'உங்களுக்கான பரிந்துரைக்கப்பட்ட நலத்திட்டங்கள்' : 'Best Matches For You'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {filteredRecommendations.length} {isTa ? 'திட்டங்கள் கண்டறியப்பட்டன' : 'schemes found'}
          </span>
        </div>

        {filteredRecommendations.length === 0 ? (
          /* Empty State (Requirement 31) */
          <div className="glass-card p-10 rounded-3xl text-center space-y-4 max-w-xl mx-auto border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isTa ? 'பொருந்தக்கூடிய நலத்திட்டங்கள் எதுவும் கிடைக்கவில்லை' : 'No matching schemes found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isTa
                  ? 'உங்கள் தற்போதைய சுயவிவரத் தகவலின் அடிப்படையில் நேரடி தகுதிகள் ஏதும் கிடைக்கவில்லை. உங்கள் சுயவிவரத்தை முழுமையாக்கவும்.'
                  : 'We couldn\'t find a current match based on the information in your profile. Complete your profile details to improve scheme matching.'}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <Link
                to="/citizen/profile"
                className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-colors shadow-sm"
              >
                {isTa ? 'சுயவிவரத்தை புதுப்பிக்க' : 'Complete Profile'}
              </Link>
              <Link
                to="/citizen/schemes"
                className="px-4 py-2 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                {isTa ? 'அனைத்துத் திட்டங்களையும் காண்க' : 'Explore All Schemes'}
              </Link>
            </div>
          </div>
        ) : (
          /* List of Scheme Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecommendations.map((item) => {
              const { scheme, status, criteriaBreakdown, missingInformation, missingDocuments, gapAnalysisRemarks } = item;
              const title = isTa ? scheme?.name?.ta || scheme?.name?.en : scheme?.name?.en;
              const domainName = isTa ? scheme?.domainKey : scheme?.domainKey;
              const benefitText = isTa ? scheme?.benefitSummary?.ta || scheme?.benefitSummary?.en : scheme?.benefitSummary?.en;

              const passedCriteria = (criteriaBreakdown || []).filter((c: any) => c.passed);

              return (
                <div
                  key={scheme._id || scheme.schemeCode}
                  className="glass-card p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Card Top: Domain & Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider border border-slate-200">
                        {scheme.domainKey?.replace('_', ' ')}
                      </span>
                      {getStatusBadgeUI(status)}
                    </div>

                    {/* Scheme Titles */}
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {title}
                    </h3>
                    {scheme?.name?.ta && !isTa && (
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {scheme.name.ta}
                      </p>
                    )}

                    {/* Benefit Summary */}
                    {benefitText && (
                      <div className="mt-3 p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900">
                        <span className="font-bold">{isTa ? 'உதவி விவரம்: ' : 'Benefit: '}</span>
                        {benefitText}
                      </div>
                    )}

                    {/* Why this scheme appears (Requirement 9) */}
                    <div className="mt-4 space-y-1.5">
                      <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                        {isTa ? 'ஏன் இந்தத் திட்டம் பொருந்துகிறது:' : 'Why this scheme appears:'}
                      </div>

                      {/* Criteria Checkmarks */}
                      {passedCriteria.slice(0, 3).map((c: any, idx: number) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{isTa ? c.label?.ta || c.label?.en : c.label?.en}</span>
                        </div>
                      ))}

                      {/* Missing Documents Warning */}
                      {missingDocuments && missingDocuments.length > 0 && (
                        <div className="flex items-start space-x-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/60 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{isTa ? 'ஆவணம் தேவை: ' : 'Required Document: '}</span>
                            {missingDocuments.map((d: any) => (isTa ? d.label?.ta || d.label?.en : d.label?.en)).join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Missing Info Warning */}
                      {missingInformation && missingInformation.length > 0 && (
                        <div className="flex items-start space-x-2 text-xs text-sky-800 bg-sky-50 p-2 rounded-xl border border-sky-200/60 mt-1">
                          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{isTa ? 'விவரம் தேவை: ' : 'Information Needed: '}</span>
                            {missingInformation.map((m: any) => (isTa ? m.label?.ta || m.label?.en : m.label?.en)).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom CTA Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedSchemeDetail(scheme)}
                      className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      {isTa ? 'விவரங்களைக் காண்க' : 'View Details'}
                    </button>

                    <Link
                      to={`/citizen/apply/${scheme._id}`}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <span>{isTa ? 'விண்ணப்பிக்க' : 'Apply Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Optional Not Eligible Collapsible Section (Requirement 32) */}
      {notEligibleRecommendations.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
          <button
            onClick={() => setShowNotEligible(!showNotEligible)}
            className="w-full p-4 bg-slate-100/80 hover:bg-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-slate-500" />
              <span>
                {isTa ? 'தற்போது தகுதியற்ற திட்டங்கள்' : 'Not Currently a Match'} ({notEligibleRecommendations.length})
              </span>
            </div>
            {showNotEligible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showNotEligible && (
            <div className="p-4 space-y-3 divide-y divide-slate-100">
              {notEligibleRecommendations.slice(0, 3).map((item) => (
                <div key={item.scheme._id} className="pt-3 first:pt-0 flex items-start justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {isTa ? item.scheme?.name?.ta || item.scheme?.name?.en : item.scheme?.name?.en}
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {isTa ? item.gapAnalysisRemarks?.ta : item.gapAnalysisRemarks?.en}
                    </p>
                  </div>
                  <Link
                    to={`/citizen/schemes/${item.scheme._id}`}
                    className="text-blue-900 font-bold hover:underline shrink-0 ml-4"
                  >
                    {isTa ? 'விவரம்' : 'View Rules'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheme Details Modal */}
      {selectedSchemeDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 uppercase">
                  {selectedSchemeDetail.domainKey?.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {isTa ? selectedSchemeDetail.name?.ta || selectedSchemeDetail.name?.en : selectedSchemeDetail.name?.en}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSchemeDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 max-h-96 overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-900">{isTa ? 'திட்டத்தைப் பற்றி:' : 'About Scheme:'}</h4>
                <p className="mt-0.5">{isTa ? selectedSchemeDetail.description?.ta || selectedSchemeDetail.description?.en : selectedSchemeDetail.description?.en}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">{isTa ? 'அரசு உதவி விவரம்:' : 'Benefit Summary:'}</h4>
                <p className="mt-0.5 font-semibold text-blue-900">{isTa ? selectedSchemeDetail.benefitSummary?.ta || selectedSchemeDetail.benefitSummary?.en : selectedSchemeDetail.benefitSummary?.en}</p>
              </div>

              {selectedSchemeDetail.requiredDocuments && selectedSchemeDetail.requiredDocuments.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900">{isTa ? 'தேவையான ஆவணங்கள்:' : 'Required Proof Documents:'}</h4>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {selectedSchemeDetail.requiredDocuments.map((doc: any, i: number) => (
                      <li key={i}>{isTa ? doc.label?.ta || doc.label?.en : doc.label?.en}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedSchemeDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                {isTa ? 'மூடுக' : 'Close'}
              </button>
              <Link
                to={`/citizen/apply/${selectedSchemeDetail._id}`}
                className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950"
              >
                {isTa ? 'இப்போது விண்ணப்பிக்க' : 'Apply Now'}
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
