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
  FileText,
  Landmark,
  X,
  ArrowUpDown
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';

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

  // Filters & Sorting
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'domain'>('match');
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
      (selectedStatus === 'DOCS_NEEDED' &&
        (item.status === 'DOCUMENTS_REQUIRED' || (item.missingDocuments && item.missingDocuments.length > 0)));

    const domainMatch = selectedDomain === 'ALL' || item.scheme?.domainKey === selectedDomain;

    const query = searchQuery.trim().toLowerCase();
    const nameEn = item.scheme?.name?.en?.toLowerCase() || '';
    const nameTa = item.scheme?.name?.ta?.toLowerCase() || '';
    const code = item.scheme?.schemeCode?.toLowerCase() || '';
    const searchMatch = !query || nameEn.includes(query) || nameTa.includes(query) || code.includes(query);

    return statusMatch && domainMatch && searchMatch;
  });

  // Sort recommendations
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.scheme?.name?.en || '';
      const nameB = b.scheme?.name?.en || '';
      return nameA.localeCompare(nameB);
    }
    if (sortBy === 'domain') {
      const domA = a.scheme?.domainKey || '';
      const domB = b.scheme?.domainKey || '';
      return domA.localeCompare(domB);
    }
    // Default by Match Strength: STRONG_MATCH first, then POTENTIAL_MATCH, then others
    const score = (status: string) => {
      if (status === 'STRONG_MATCH') return 3;
      if (status === 'POTENTIAL_MATCH') return 2;
      return 1;
    };
    return score(b.status) - score(a.status);
  });

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-teal-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa
            ? 'உங்கள் சுயவிவரத்துடன் நலத்திட்டங்களை ஒப்பிடுகிறது...'
            : 'Evaluating personalized scheme matches based on state policy rules...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <PageHeader
        title={isTa ? 'எனக்கு தகுதியான நலத்திட்டங்கள்' : 'My Eligible Schemes'}
        subtitle={
          isTa
            ? 'அரசு தகுதி விதிகளுக்கு உட்பட்டு உங்கள் சுயவிவரத்துடன் பொருந்தக்கூடிய திட்டங்கள்'
            : 'Personalized government welfare schemes matched to your authenticated profile credentials'
        }
        badge={isTa ? 'தானியங்கி தகுதி கணிப்பு' : 'Automated Policy Match'}
        badgeVariant="teal"
        icon={BadgeCheck}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'தகுதியானவை' : 'Eligible Schemes' }
        ]}
        actions={
          <Link
            to="/citizen/profile"
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-[#172B4D] text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center space-x-2"
          >
            <UserCheck className="w-4 h-4 text-teal-600" />
            <span>{isTa ? 'சுயவிவரம் புதுப்பிக்க' : 'Update Profile Facts'}</span>
          </Link>
        }
      />

      {/* Top Filter Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <button
          onClick={() => {
            setSelectedStatus('STRONG_MATCH');
            setSearchParams({ status: 'strong' });
          }}
          className={`gov-card p-4 text-left transition-all duration-200 border-l-4 ${
            selectedStatus === 'STRONG_MATCH' || selectedStatus === 'STRONG'
              ? 'border-l-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
              : 'border-l-emerald-500 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#172B4D]">
              {summary.strongMatches || 0}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1">
            {isTa ? 'முழு தகுதி' : 'Strong Matches'}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
            {isTa ? 'உடனடி விண்ணப்பம்' : 'Ready to apply'}
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedStatus('POTENTIAL_MATCH');
            setSearchParams({ status: 'potential' });
          }}
          className={`gov-card p-4 text-left transition-all duration-200 border-l-4 ${
            selectedStatus === 'POTENTIAL_MATCH' || selectedStatus === 'POTENTIAL'
              ? 'border-l-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
              : 'border-l-amber-500 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#172B4D]">
              {summary.potentialMatches || 0}
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1">
            {isTa ? 'சாத்தியமான தகுதி' : 'Potential Matches'}
          </div>
          <div className="text-[11px] font-semibold text-amber-700 mt-0.5">
            {isTa ? 'ஆவணம் தேவை' : 'Conditional match'}
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedStatus('NEEDS_INFORMATION');
            setSearchParams({ status: 'needs_info' });
          }}
          className={`gov-card p-4 text-left transition-all duration-200 border-l-4 ${
            selectedStatus === 'NEEDS_INFORMATION' || selectedStatus === 'NEEDS_INFO'
              ? 'border-l-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
              : 'border-l-sky-500 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#172B4D]">
              {summary.needsInformation || 0}
            </span>
            <HelpCircle className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1">
            {isTa ? 'கூடுதல் விவரம்' : 'More Info Needed'}
          </div>
          <div className="text-[11px] font-semibold text-sky-700 mt-0.5">
            {isTa ? 'விவரம் நிரப்பவும்' : 'Update profile info'}
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedStatus('DOCS_NEEDED');
            setSearchParams({ status: 'docs' });
          }}
          className={`gov-card p-4 text-left transition-all duration-200 border-l-4 ${
            selectedStatus === 'DOCS_NEEDED'
              ? 'border-l-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20'
              : 'border-l-indigo-500 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-[#172B4D]">
              {summary.documentsNeeded || 0}
            </span>
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1">
            {isTa ? 'ஆவணங்கள் தேவை' : 'Docs Required'}
          </div>
          <div className="text-[11px] font-semibold text-indigo-700 mt-0.5">
            {isTa ? 'சான்றிதழ் பதிவேற்றுக' : 'Upload certificate'}
          </div>
        </button>
      </div>

      {/* Search, Domain Filter & Sort Bar */}
      <div className="gov-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setSelectedStatus('ALL');
              setSearchParams({});
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-[#10243A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'அனைத்தும்' : 'All Matches'} ({activeRecommendations.length})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('STRONG');
              setSearchParams({ status: 'strong' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'STRONG' || selectedStatus === 'STRONG_MATCH'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'முழு தகுதி' : 'Strong'}
          </button>

          <button
            onClick={() => {
              setSelectedStatus('POTENTIAL');
              setSearchParams({ status: 'potential' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'POTENTIAL' || selectedStatus === 'POTENTIAL_MATCH'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'சாத்தியமானவை' : 'Potential'}
          </button>

          <button
            onClick={() => {
              setSelectedStatus('NEEDS_INFO');
              setSearchParams({ status: 'needs_info' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'NEEDS_INFO' || selectedStatus === 'NEEDS_INFORMATION'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'விவரம் தேவை' : 'Info Needed'}
          </button>

          <button
            onClick={() => {
              setSelectedStatus('DOCS_NEEDED');
              setSearchParams({ status: 'docs' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedStatus === 'DOCS_NEEDED'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'ஆவணங்கள்' : 'Docs Needed'}
          </button>
        </div>

        {/* Search, Domain & Sort Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={isTa ? 'திட்டத்தை தேடுக...' : 'Search by title / code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department Domain Dropdown */}
          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-600/30 outline-none appearance-none"
            >
              <option value="ALL">{isTa ? 'அனைத்துத் துறைகள்' : 'All Sectors'}</option>
              {domains.map((d) => (
                <option key={d.domainKey} value={d.domainKey}>
                  {isTa ? d.name?.ta || d.name?.en : d.name?.en}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-600/30 outline-none appearance-none"
            >
              <option value="match">{isTa ? 'பொருத்தம் அடிப்படையில்' : 'Sort: Match Score'}</option>
              <option value="name">{isTa ? 'பெயர் அடிப்படையில்' : 'Sort: Name'}</option>
              <option value="domain">{isTa ? 'துறை அடிப்படையில்' : 'Sort: Sector'}</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>
            {sortedRecommendations.length} {isTa ? 'திட்டங்கள் கண்டறியப்பட்டன' : 'schemes found matching criteria'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {isTa ? 'சான்றிதழ் சரிபார்ப்புக்கு உட்பட்டது' : 'Subject to official document verification'}
          </span>
        </div>

        {sortedRecommendations.length === 0 ? (
          <EmptyState
            icon={Search}
            title={isTa ? 'பொருந்தக்கூடிய நலத்திட்டங்கள் இல்லை' : 'No Matching Schemes Found'}
            description={
              isTa
                ? 'உங்கள் தற்போதைய வடிகட்டி அல்லது சுயவிவரத்தின்படி திட்டங்கள் கிடைக்கவில்லை. சுயவிவரத்தைப் புதுப்பித்து பார்க்கவும்.'
                : 'No schemes match the selected filters. Try adjusting your search query, sector filter, or update your citizen profile details.'
            }
            actionText={isTa ? 'சுயவிவரத்தை புதுப்பிக்க' : 'Update Profile Facts'}
            onAction={() => window.location.assign('/citizen/profile')}
            secondaryActionText={isTa ? 'வடிகட்டிகளை அழிக்க' : 'Clear Filters'}
            onSecondaryAction={() => {
              setSelectedStatus('ALL');
              setSelectedDomain('ALL');
              setSearchQuery('');
              setSearchParams({});
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedRecommendations.map((item) => {
              const {
                scheme,
                status,
                criteriaBreakdown,
                missingInformation,
                missingDocuments,
                gapAnalysisRemarks
              } = item;
              const title = isTa ? scheme?.name?.ta || scheme?.name?.en : scheme?.name?.en;
              const benefitText = isTa
                ? scheme?.benefitSummary?.ta || scheme?.benefitSummary?.en
                : scheme?.benefitSummary?.en;
              const passedCriteria = (criteriaBreakdown || []).filter((c: any) => c.passed);

              return (
                <div
                  key={scheme._id || scheme.schemeCode}
                  className="gov-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all duration-200"
                >
                  <div>
                    {/* Top: Scheme Code & Status */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-[#10243A] border border-slate-200">
                          {scheme.schemeCode || scheme.domainKey?.replace('_', ' ')}
                        </span>
                        {scheme.domainKey && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                            {scheme.domainKey.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={status} isTamil={isTa} size="sm" />
                    </div>

                    {/* Scheme Title */}
                    <h3 className="text-[15px] font-bold text-[#172B4D] tracking-tight leading-snug hover:text-blue-700 transition-colors">
                      <Link to={`/schemes/${scheme._id}`}>{title}</Link>
                    </h3>

                    {/* Benefit Text Box */}
                    {benefitText && (
                      <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950">
                        <div className="text-[10px] font-bold uppercase text-emerald-800 mb-0.5">
                          {isTa ? 'அரசு உதவித்தொகை:' : 'Government Financial Grant:'}
                        </div>
                        <div className="font-extrabold">{benefitText}</div>
                      </div>
                    )}

                    {/* Explainable Matching Logic Section */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        {isTa ? 'தகுதி பொருத்தம் & நிபந்தனைகள்:' : 'Why You Match This Scheme:'}
                      </div>

                      {/* Passed Criteria */}
                      {passedCriteria.slice(0, 3).map((c: any, idx: number) => (
                        <div key={idx} className="flex items-start space-x-1.5 text-xs text-emerald-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">
                            {isTa ? c.label?.ta || c.label?.en : c.label?.en}
                          </span>
                        </div>
                      ))}

                      {/* Missing Documents Alert */}
                      {missingDocuments && missingDocuments.length > 0 && (
                        <div className="flex items-start space-x-1.5 text-xs text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200/70 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <span className="font-bold">
                              {isTa ? 'ஆவணம் தேவை: ' : 'Required Document: '}
                            </span>
                            {missingDocuments
                              .map((d: any) => (isTa ? d.label?.ta || d.label?.en : d.label?.en))
                              .join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Missing Information Alert */}
                      {missingInformation && missingInformation.length > 0 && (
                        <div className="flex items-start space-x-1.5 text-xs text-sky-900 bg-sky-50 p-2 rounded-xl border border-sky-200/70 mt-1">
                          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <span className="font-bold">
                              {isTa ? 'விவரம் தேவை: ' : 'Profile Info Needed: '}
                            </span>
                            {missingInformation
                              .map((m: any) => (isTa ? m.label?.ta || m.label?.en : m.label?.en))
                              .join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedSchemeDetail(scheme)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {isTa ? 'விவரங்களைக் காண்க' : 'View Breakdown'}
                    </button>

                    <Link
                      to={`/citizen/apply/${scheme._id}`}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#10243A] hover:bg-[#193352] rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 active:scale-95"
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

      {/* Not Eligible Collapsible Section */}
      {notEligibleRecommendations.length > 0 && (
        <div className="gov-card rounded-2xl overflow-hidden border border-slate-200">
          <button
            onClick={() => setShowNotEligible(!showNotEligible)}
            className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>
                {isTa ? 'தற்போது தகுதியற்ற திட்டங்கள்' : 'Schemes You Do Not Currently Match'} (
                {notEligibleRecommendations.length})
              </span>
            </div>
            {showNotEligible ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showNotEligible && (
            <div className="p-4 space-y-3 divide-y divide-slate-100">
              {notEligibleRecommendations.map((item) => (
                <div
                  key={item.scheme._id}
                  className="pt-3 first:pt-0 flex items-start justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-800">
                      {isTa ? item.scheme?.name?.ta || item.scheme?.name?.en : item.scheme?.name?.en}
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {isTa ? item.gapAnalysisRemarks?.ta : item.gapAnalysisRemarks?.en}
                    </p>
                  </div>
                  <Link
                    to={`/schemes/${item.scheme._id}`}
                    className="text-blue-700 font-bold hover:underline shrink-0 ml-4"
                  >
                    {isTa ? 'விவரம்' : 'View Policy'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheme Details Modal */}
      {selectedSchemeDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                  {selectedSchemeDetail.schemeCode || selectedSchemeDetail.domainKey?.replace('_', ' ')}
                </span>
                <h3 className="text-base font-extrabold text-[#172B4D] mt-1.5 leading-snug">
                  {isTa
                    ? selectedSchemeDetail.name?.ta || selectedSchemeDetail.name?.en
                    : selectedSchemeDetail.name?.en}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSchemeDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-[#172B4D] uppercase text-[10px] tracking-wider mb-1">
                  {isTa ? 'திட்டத்தைப் பற்றி:' : 'About Scheme:'}
                </h4>
                <p className="leading-relaxed">
                  {isTa
                    ? selectedSchemeDetail.description?.ta || selectedSchemeDetail.description?.en
                    : selectedSchemeDetail.description?.en}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#172B4D] uppercase text-[10px] tracking-wider mb-1">
                  {isTa ? 'அரசு உதவி விவரம்:' : 'Official Benefit Grant:'}
                </h4>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-bold">
                  {isTa
                    ? selectedSchemeDetail.benefitSummary?.ta || selectedSchemeDetail.benefitSummary?.en
                    : selectedSchemeDetail.benefitSummary?.en}
                </div>
              </div>

              {selectedSchemeDetail.requiredDocuments && selectedSchemeDetail.requiredDocuments.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#172B4D] uppercase text-[10px] tracking-wider mb-1">
                    {isTa ? 'தேவையான ஆவணங்கள்:' : 'Required Verification Documents:'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedSchemeDetail.requiredDocuments.map((doc: any, i: number) => (
                      <li key={i}>{isTa ? doc.label?.ta || doc.label?.en : doc.label?.en}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedSchemeDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                {isTa ? 'மூடுக' : 'Close'}
              </button>
              <Link
                to={`/citizen/apply/${selectedSchemeDetail._id}`}
                className="px-4 py-2 bg-[#10243A] hover:bg-[#193352] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {isTa ? 'விண்ணப்பிக்க' : 'Apply Now'}
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
