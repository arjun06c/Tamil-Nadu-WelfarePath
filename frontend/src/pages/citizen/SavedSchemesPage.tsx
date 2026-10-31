import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  ArrowRight,
  Trash2,
  FileText,
  Landmark,
  Compass
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';

export const SavedSchemesPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [savedSchemes, setSavedSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await api.get('/misc/saved-schemes');
      setSavedSchemes(res.data.savedSchemes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (schemeId: string) => {
    setRemovingId(schemeId);
    try {
      await api.post(`/misc/saved-schemes/${schemeId}/toggle`);
      setSavedSchemes((prev) => prev.filter((s) => s._id !== schemeId));
    } catch (err) {
      console.error('Error removing saved scheme:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const filteredSchemes = savedSchemes.filter((scheme) => {
    const q = searchQuery.trim().toLowerCase();
    const nameEn = scheme.name?.en?.toLowerCase() || '';
    const nameTa = scheme.name?.ta?.toLowerCase() || '';
    const code = scheme.schemeCode?.toLowerCase() || '';
    return !q || nameEn.includes(q) || nameTa.includes(q) || code.includes(q);
  });

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'சேமித்த திட்டங்கள் பெறப்படுகின்றன...' : 'Loading bookmarked schemes...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title={isTa ? 'சேமித்த திட்டங்கள்' : 'Saved Schemes'}
        subtitle={
          isTa
            ? 'விரைவான பயன்பாட்டிற்காகவும் பிற்பாடு விண்ணப்பிப்பதற்காகவும் நீங்கள் சேமித்து வைத்துள்ள அரசு நலத்திட்டங்கள்'
            : 'Your bookmarked welfare schemes for quick eligibility review and fast-track application'
        }
        badge={`${savedSchemes.length} ${isTa ? 'சேமிக்கப்பட்டுள்ளன' : 'Bookmarked'}`}
        badgeVariant="blue"
        icon={Bookmark}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'சேமித்த திட்டங்கள்' : 'Saved Schemes' }
        ]}
      />

      {/* Search Bar when schemes exist */}
      {savedSchemes.length > 0 && (
        <div className="gov-card p-4 flex items-center justify-between gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={isTa ? 'சேமித்த திட்டங்களைத் தேடுக...' : 'Search within saved schemes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
            />
          </div>

          <Link
            to="/citizen/schemes"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 shrink-0"
          >
            <span>{isTa ? 'மேலும் திட்டங்களைக் காண்க' : 'Discover More Schemes'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Schemes Grid */}
      {savedSchemes.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={isTa ? 'சேமிக்கப்பட்ட திட்டங்கள் எதுவும் இல்லை' : 'No Bookmarked Schemes Yet'}
          description={
            isTa
              ? 'நீங்கள் விரும்பும் திட்டங்களை பிறகு விண்ணப்பிக்க அல்லது விவரங்களை அறிய சேமித்து வைக்கலாம்.'
              : 'Bookmark schemes while browsing the catalog to save them for easy access and quick application anytime.'
          }
          actionText={isTa ? 'நலத்திட்டங்களை கண்டறிக' : 'Explore Welfare Schemes'}
          onAction={() => window.location.assign('/citizen/schemes')}
        />
      ) : filteredSchemes.length === 0 ? (
        <div className="gov-card p-8 text-center text-xs text-slate-500">
          {isTa
            ? 'தேடலுக்கு ஏற்ப சேமித்த திட்டங்கள் எதுவும் இல்லை.'
            : 'No saved schemes matched your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((scheme) => {
            const name = isTa ? scheme.name?.ta || scheme.name?.en : scheme.name?.en;
            const department = isTa
              ? scheme.department?.ta || scheme.department?.en
              : scheme.department?.en;
            const benefit = isTa
              ? scheme.benefitSummary?.ta || scheme.benefitSummary?.en
              : scheme.benefitSummary?.en;

            return (
              <div
                key={scheme._id}
                className="gov-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all duration-200"
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-[#10243A] border border-slate-200">
                      {scheme.schemeCode || scheme.domainKey?.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => handleRemove(scheme._id)}
                      disabled={removingId === scheme._id}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      title={isTa ? 'சேமிப்பிலிருந்து நீக்குக' : 'Remove from bookmarks'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#172B4D] mb-1 leading-snug hover:text-blue-700 transition-colors">
                    <Link to={`/schemes/${scheme._id}`}>{name}</Link>
                  </h3>

                  {/* Department */}
                  {department && (
                    <p className="text-xs text-slate-500 font-medium mb-3 flex items-center space-x-1.5">
                      <Landmark className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span className="truncate">{department}</span>
                    </p>
                  )}

                  {/* Benefit Box */}
                  {benefit && (
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-950">
                      <div className="text-[10px] font-bold uppercase text-emerald-800 mb-0.5">
                        {isTa ? 'அரசு உதவித்தொகை:' : 'Financial Grant:'}
                      </div>
                      <div className="font-extrabold line-clamp-1">{benefit}</div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/schemes/${scheme._id}`}
                    className="text-xs font-bold text-slate-700 hover:text-[#10243A] px-2 py-1 rounded"
                  >
                    {isTa ? 'விவரம்' : 'Details'}
                  </Link>

                  <Link
                    to={`/citizen/apply/${scheme._id}`}
                    className="px-3.5 py-1.5 bg-[#10243A] hover:bg-[#193352] text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
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
  );
};
