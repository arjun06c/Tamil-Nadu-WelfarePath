import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SchemeCard } from '../components/SchemeCard';
import {
  Search,
  Filter,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
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
  X
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

  const activeDomainObj = domains.find((d) => d.domainKey === selectedDomain);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* 1. Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 inline-flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isTa ? 'தமிழ்நாடு நலத்திட்டக் கண்டறிதல் தளம்' : 'Tamil Nadu Welfare Discovery Platform'}</span>
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {isTa ? 'நலத்திட்டங்களை கண்டறியுங்கள்' : 'Discover Welfare Schemes'}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {isTa
            ? 'உங்கள் தகுதி, சுயவிவரம் மற்றும் வாழ்வாதாரத் தேவைகளின் அடிப்படையில் அரசு சலுகைகளைக் கண்டறியவும்.'
            : 'Find welfare benefits based on your needs, profile and life situation.'}
        </p>
      </div>

      {/* 2. Global Search Bar */}
      <div className="glass-card p-4 rounded-3xl max-w-3xl mx-auto shadow-md border border-slate-200/80">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isTa
                ? 'திட்டப் பெயர், துறை அல்லது முக்கிய சொற்கள் மூலம் தேடவும்...'
                : 'Search schemes by name, department, or eligibility keywords...'
            }
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none shadow-inner font-medium"
          />
        </div>
      </div>

      {/* 3. Recommended For You Section (If Authenticated and has recommendations) */}
      {user && recommendations.length > 0 && !selectedDomain && !search && (
        <div className="glass-card p-6 rounded-3xl border border-emerald-200 bg-emerald-50/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {isTa ? 'உங்களுக்காகப் பரிந்துரைக்கப்பட்டவை (Recommended for You)' : 'Recommended for You'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isTa
                    ? 'உங்கள் தற்போதைய சுயவிவரச் சான்றுகளின் அடிப்படையில் முதற்கட்ட பொருத்தம்'
                    : 'Based on your current profile and uploaded credentials'}
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              {recommendations.length} Matches
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.scheme._id} className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                      {rec.scheme.schemeCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>{isTa ? rec.matchReason?.ta : rec.matchReason?.en}</span>
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2">
                    {isTa ? rec.scheme.name?.ta : rec.scheme.name?.en}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-1">
                    {isTa ? rec.scheme.department?.ta : rec.scheme.department?.en}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[60%]">
                    {isTa ? rec.scheme.benefitSummary?.ta : rec.scheme.benefitSummary?.en}
                  </span>
                  <button
                    onClick={() => navigate(`/schemes/${rec.scheme._id}`)}
                    className="text-xs font-extrabold text-blue-900 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Browse By Welfare Area (Interactive Domain Grid) */}
      {!selectedDomain && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-900" />
              <span>{isTa ? 'நலத் துறைகள் வாரியாக உலாவுங்கள்' : 'Browse by Welfare Area'}</span>
            </h2>
            <span className="text-xs text-slate-500 font-extrabold">
              {domains.length} {isTa ? 'துறைகள்' : 'Domains'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {domains.map((dom) => {
              const IconCmp = iconComponents[dom.iconName] || Award;
              return (
                <div
                  key={dom._id}
                  onClick={() => handleSelectDomain(dom.domainKey)}
                  className="glass-card p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3 bg-white hover:bg-blue-50/20"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 group-hover:scale-110 transition-transform">
                      <IconCmp className="w-5 h-5" />
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-blue-900 transition-colors line-clamp-1">
                      {isTa ? dom.name?.ta : dom.name?.en}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {isTa ? dom.description?.ta : dom.description?.en}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-black text-blue-950 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {dom.schemeCount || 0} {isTa ? 'திட்டங்கள்' : 'Schemes'}
                    </span>
                    <span className="font-extrabold text-blue-900 flex items-center space-x-0.5 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Active Domain Header Bar if selected */}
      {selectedDomain && activeDomainObj && (
        <div className="glass-card p-6 rounded-3xl border border-blue-200 bg-blue-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold">
                {React.createElement(iconComponents[activeDomainObj.iconName] || Award, { className: 'w-5 h-5' })}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {isTa ? activeDomainObj.name?.ta : activeDomainObj.name?.en}
                </h2>
                <p className="text-xs text-slate-600">
                  {isTa ? activeDomainObj.description?.ta : activeDomainObj.description?.en}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelectDomain('')}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>{isTa ? 'அனைத்து துறைகளும்' : 'All Welfare Areas'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Filter Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => handleSelectDomain('')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            !selectedDomain ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isTa ? 'அனைத்து துறைகளும்' : 'All Domains'}
        </button>
        {domains.map((dom) => (
          <button
            key={dom._id}
            onClick={() => handleSelectDomain(dom.domainKey)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedDomain === dom.domainKey ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isTa ? dom.name?.ta : dom.name?.en} ({dom.schemeCount || 0})
          </button>
        ))}
      </div>

      {/* 7. Schemes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-900">
            {selectedDomain
              ? (isTa ? `நலத்திட்டங்கள் (${schemes.length})` : `Schemes in Category (${schemes.length})`)
              : (isTa ? `கிடைக்கும் நலத்திட்டங்கள் பட்டியல் (${schemes.length})` : `Available Welfare Schemes (${schemes.length})`)}
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            {isTa ? 'நலத்திட்டங்கள் பெறப்படுகின்றன...' : 'Loading verified schemes...'}
          </div>
        ) : schemes.length === 0 ? (
          <div className="glass-card text-center py-16 px-4 rounded-3xl border border-slate-200">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">
              {isTa ? 'திட்டங்கள் எதுவும் கிடைக்கவில்லை' : 'No schemes found in this category.'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isTa ? 'தேடல் அல்லது துறை தேர்வை மாற்றி முயலவும்.' : 'Try adjusting your search query or choosing another welfare domain.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme._id} scheme={scheme} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
