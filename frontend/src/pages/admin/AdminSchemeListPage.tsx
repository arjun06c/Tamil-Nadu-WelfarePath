import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Award, Plus, Edit, Search, Filter, Layers, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

export const AdminSchemeListPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [searchParams, setSearchParams] = useSearchParams();
  const domainKeyParam = searchParams.get('domainKey') || '';

  const [schemes, setSchemes] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domainKeyParam);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    fetchSchemes();
  }, [search, selectedDomain, selectedStatus]);

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
          domainKey: selectedDomain,
          status: selectedStatus,
          includeDrafts: 'true'
        }
      });
      setSchemes(res.data.schemes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDomainObj = domains.find((d) => d.domainKey === selectedDomain);

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Award className="w-6 h-6 text-blue-900" />
            <span>{isTa ? 'அரசு நலத்திட்டங்கள் நிர்வாகம்' : 'State Welfare Scheme Management (CRUD)'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTa ? 'அரசுத் திட்டங்களை உருவாக்குதல், திருத்துதல் மற்றும் தகுதி விதிகளின் கட்டமைப்பு' : 'Configure bilingual details, eligibility rules, and required documents'}
          </p>
        </div>

        <Link
          to="/admin/schemes/new"
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isTa ? 'புதிய திட்டம் சேர்க்க' : 'Create New Scheme'}</span>
        </Link>
      </div>

      {/* Domain Active Filter Banner */}
      {selectedDomainObj && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-900 shrink-0" />
            <div>
              <span className="font-extrabold text-blue-950 block">
                {isTa ? selectedDomainObj.name?.ta : selectedDomainObj.name?.en}
              </span>
              <span className="text-slate-500 text-[11px]">
                {isTa ? selectedDomainObj.description?.ta : selectedDomainObj.description?.en}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedDomain('');
              setSearchParams({});
            }}
            className="text-[11px] font-bold text-blue-900 hover:underline"
          >
            {isTa ? 'அனைத்து துறைகளையும் காட்டுக' : 'Clear Domain Filter'}
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isTa ? 'திட்டக் குறியீடு அல்லது பெயர் மூலம் தேடுக...' : 'Search scheme code, name, department...'}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900"
          />
        </div>

        {/* Domain Select */}
        <div className="w-full md:w-56">
          <select
            value={selectedDomain}
            onChange={(e) => {
              setSelectedDomain(e.target.value);
              setSearchParams(e.target.value ? { domainKey: e.target.value } : {});
            }}
            className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 font-medium"
          >
            <option value="">{isTa ? 'அனைத்து துறைகளும் (All Domains)' : 'All Welfare Domains'}</option>
            {domains.map((d) => (
              <option key={d._id} value={d.domainKey}>
                {isTa ? d.name?.ta : d.name?.en} ({d.schemeCount || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Status Select */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 font-medium"
          >
            <option value="">{isTa ? 'அனைத்து நிலைகளும்' : 'All Statuses'}</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

      </div>

      {/* Scheme List Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading master schemes...</div>
        ) : schemes.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">No matching schemes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Scheme Code</th>
                  <th className="py-3.5 px-4">Scheme Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Domain</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schemes.map((scheme) => (
                  <tr key={scheme._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-amber-900">{scheme.schemeCode}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 max-w-xs">
                      <div>{isTa ? scheme.name?.ta : scheme.name?.en}</div>
                      {scheme.isDemoData && (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          Sample Record
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {isTa ? scheme.department?.ta : scheme.department?.en}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-bold uppercase text-[10px]">
                      {scheme.domainKey}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        scheme.status === 'PUBLISHED' || scheme.isActive
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {scheme.status || (scheme.isActive ? 'PUBLISHED' : 'DRAFT')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/schemes/${scheme._id}/edit`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-extrabold transition-colors inline-flex items-center space-x-1 text-[11px]"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit / Rules</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
