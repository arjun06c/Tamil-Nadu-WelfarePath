import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SchemeCard } from '../components/SchemeCard';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import {
  Search,
  Filter,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Heart,
  ShieldAlert,
  Accessibility,
  Sprout,
  Activity,
  Briefcase,
  TrendingUp,
  Home,
  HardHat,
  Anchor,
  Trees,
  BookOpen,
  Trophy,
  HeartHandshake,
  ChevronRight,
  Layers,
  X,
  Compass,
  RotateCcw
} from 'lucide-react';

const iconComponents: Record<string, any> = {
  GraduationCap,
  Heart,
  ShieldAlert,
  Accessibility,
  Sprout,
  Activity,
  Briefcase,
  TrendingUp,
  Home,
  HardHat,
  Anchor,
  Trees,
  BookOpen,
  Trophy,
  HeartHandshake,
  Award
};

export const SchemeDiscoveryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const domainKeyParam = searchParams.get('domainKey') || '';

  const [schemes, setSchemes] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domainKeyParam);
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const { user, lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchDomains();
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  useEffect(() => {
    setSelectedDomain(domainKeyParam);
    fetchSchemes();
  }, [search, searchParams]);

  const fetchDomains = async () => {
    try {
      const res = await api.get('/schemes/domains');
      setDomains(res.data.domains || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await api.get('/schemes/recommended');
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schemes', {
        params: {
          search,
          domainKey: searchParams.get('domainKey') || ''
        }
      });
      setSchemes(res.data.schemes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDomain = (key: string) => {
    setSelectedDomain(key);
    if (key) {
      setSearchParams({ domainKey: key });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedDomain('');
    setSelectedDepartment('ALL');
    setSearchParams({});
  };

  const activeDomainObj = domains.find((d) => d.domainKey === selectedDomain);

  // Extract unique departments for filtering
  const departments = Array.from(
    new Set(
      schemes
        .map((s) => (isTa ? s.department?.ta || s.department?.en : s.department?.en))
        .filter(Boolean)
    )
  );

  // Filter schemes client-side by department if selected
  const displayedSchemes = schemes.filter((scheme) => {
    if (selectedDepartment === 'ALL') return true;
    const dept = isTa ? scheme.department?.ta || scheme.department?.en : scheme.department?.en;
    return dept === selectedDepartment;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title={isTa ? 'நலத்திட்டங்கள் கண்டறிதல்' : 'Discover Welfare Schemes'}
        subtitle={
          isTa
            ? 'தமிழ்நாடு அரசின் அனைத்து நலத்திட்டங்கள், உதவித்தொகைகள் மற்றும் சலுகைகளின் அதிகாரப்பூர்வ பட்டியல்'
            : 'Explore all authorized Government of Tamil Nadu welfare programs, subsidies, and grants'
        }
        badge={isTa ? 'அரசு நல களஞ்சியம்' : 'Official State Catalog'}
        badgeVariant="blue"
        icon={Compass}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Home', href: user ? '/citizen/dashboard' : '/' },
          { label: isTa ? 'திட்டங்கள்' : 'Discover Schemes' }
        ]}
      />

      {/* Global Search and Filter Bar */}
      <div className="gov-card p-5 space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isTa
                  ? 'திட்டப் பெயர், துறை அல்லது முக்கிய சொல் மூலம் தேடுக...'
                  : 'Search schemes by title, department, or keyword...'
              }
              className="gov-input pl-10 pr-9 text-xs sm:text-sm font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative md:w-60">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="gov-input text-xs font-bold appearance-none pr-8 cursor-pointer"
            >
              <option value="ALL">
                {isTa ? 'அனைத்து அரசுத் துறைகளும்' : 'All Departments'}
              </option>
              {departments.map((dept, i) => (
                <option key={i} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {/* Clear Filters Button */}
          {(search || selectedDomain || selectedDepartment !== 'ALL') && (
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{isTa ? 'வடிகட்டிகளை அழிக்க' : 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Welfare Sector Pills Filter */}
        <div className="pt-2 border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleSelectDomain('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              !selectedDomain
                ? 'bg-[#10243A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'அனைத்து துறைகளும்' : 'All Sectors'}
          </button>
          {domains.map((dom) => (
            <button
              key={dom._id}
              onClick={() => handleSelectDomain(dom.domainKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedDomain === dom.domainKey
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isTa ? dom.name?.ta : dom.name?.en} ({dom.schemeCount || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Active Domain Info Banner if selected */}
      {selectedDomain && activeDomainObj && (
        <div className="gov-card p-5 border-l-4 border-l-blue-600 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center shrink-0">
              {React.createElement(iconComponents[activeDomainObj.iconName] || Award, {
                className: 'w-5 h-5'
              })}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#172B4D]">
                {isTa ? activeDomainObj.name?.ta : activeDomainObj.name?.en}
              </h2>
              <p className="text-xs text-slate-600">
                {isTa ? activeDomainObj.description?.ta : activeDomainObj.description?.en}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSelectDomain('')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-lg bg-white border border-blue-200 self-start sm:self-auto shrink-0"
          >
            {isTa ? 'அனைத்தையும் காட்டுக' : 'Show All Sectors'}
          </button>
        </div>
      )}

      {/* Browse by Welfare Area Grid (When no specific sector is active) */}
      {!selectedDomain && !search && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#172B4D] uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>{isTa ? 'துறை வாரியாக உலாவுங்கள்' : 'Browse by Welfare Sector'}</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              {domains.length} {isTa ? 'துறைகள்' : 'State Sectors'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {domains.map((dom) => {
              const IconCmp = iconComponents[dom.iconName] || Award;
              return (
                <div
                  key={dom._id}
                  onClick={() => handleSelectDomain(dom.domainKey)}
                  className="gov-card p-4 rounded-xl cursor-pointer hover:border-blue-400 hover:-translate-y-0.5 transition-all group flex flex-col justify-between space-y-2 bg-white"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 group-hover:scale-105 transition-transform">
                      <IconCmp className="w-4 h-4" />
                    </div>

                    <h4 className="font-bold text-[#172B4D] text-xs group-hover:text-blue-700 transition-colors line-clamp-1">
                      {isTa ? dom.name?.ta : dom.name?.en}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {isTa ? dom.description?.ta : dom.description?.en}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                    <span className="font-extrabold text-[#10243A] bg-slate-100 px-2 py-0.5 rounded">
                      {dom.schemeCount || 0} {isTa ? 'திட்டங்கள்' : 'Schemes'}
                    </span>
                    <span className="font-bold text-blue-700 flex items-center group-hover:translate-x-0.5 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schemes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>
            {displayedSchemes.length} {isTa ? 'திட்டங்கள் பட்டியலிடப்பட்டுள்ளன' : 'welfare schemes available'}
          </span>
          {selectedDepartment !== 'ALL' && (
            <span className="text-[11px] text-blue-700">
              Filtering by: {selectedDepartment}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#10243A] border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500">
              {isTa ? 'திட்டங்கள் பெறப்படுகின்றன...' : 'Loading verified government schemes...'}
            </p>
          </div>
        ) : displayedSchemes.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={isTa ? 'திட்டங்கள் எதுவும் கிடைக்கவில்லை' : 'No Schemes Found'}
            description={
              isTa
                ? 'உங்கள் தேடல் அளவுகோலுக்கு ஏற்ப திட்டங்கள் எதுவும் இல்லை. வடிகட்டிகளை மாற்றி மீண்டும் முயற்சிக்கவும்.'
                : 'No welfare schemes matched your search query or department filter. Try resetting your search parameters.'
            }
            actionText={isTa ? 'வடிகட்டிகளை மீட்டமைக்க' : 'Clear All Filters'}
            onAction={handleClearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedSchemes.map((scheme) => (
              <SchemeCard key={scheme._id} scheme={scheme} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
