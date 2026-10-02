import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SchemeCard } from '../components/SchemeCard';
import { Search, Filter, Award } from 'lucide-react';

export const SchemeDiscoveryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const domainKeyParam = searchParams.get('domainKey') || '';

  const [schemes, setSchemes] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domainKeyParam);
  const [loading, setLoading] = useState(true);

  const { lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    fetchSchemes();
  }, [search, selectedDomain]);

  const fetchDomains = async () => {
    try {
      const res = await api.get('/schemes/domains');
      setDomains(res.data.domains || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schemes', {
        params: {
          search,
          domainKey: selectedDomain
        }
      });
      setSchemes(res.data.schemes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'தமிழ்நாடு அரசு நலத்திட்டங்கள்' : 'Discover Tamil Nadu Welfare Schemes'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'அனைத்து அரசுத் துறைகளின் தகுதியான நலத்திட்டங்களைக் கண்டறியவும்' : 'Search, filter, and explore official government benefit programs'}
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div className="glass-card p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isTa ? 'திட்டப் பெயர் அல்லது துறையைத் தேடவும்...' : 'Search by scheme name or department...'}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
          />
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => {
              setSelectedDomain('');
              setSearchParams({});
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDomain === ''
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'அனைத்து துறைகளும்' : 'All Domains'}
          </button>
          {domains.map((dom) => (
            <button
              key={dom._id}
              onClick={() => {
                setSelectedDomain(dom.domainKey);
                setSearchParams({ domainKey: dom.domainKey });
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDomain === dom.domainKey
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isTa ? dom.name?.ta : dom.name?.en}
            </button>
          ))}
        </div>

      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          {isTa ? 'நலத்திட்டங்கள் பெறப்படுகின்றன...' : 'Loading verified schemes...'}
        </div>
      ) : schemes.length === 0 ? (
        <div className="glass-card text-center py-16 px-4 rounded-2xl">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">
            {isTa ? 'திட்டங்கள் எதுவும் கிடைக்கவில்லை' : 'No schemes found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'தேடல் அல்லது துறை தேர்வை மாற்றி முயலவும்.' : 'Try adjusting your search criteria or domain filter.'}
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
  );
};
