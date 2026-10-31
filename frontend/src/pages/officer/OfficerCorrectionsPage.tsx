import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  MapPin,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const OfficerCorrectionsPage: React.FC = () => {
  const { lang, user } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCorrectionsQueue();
  }, [search]);

  const fetchCorrectionsQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/applications', {
        params: {
          queue: 'corrections',
          search: search.trim() || undefined
        }
      });
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error('Fetch corrections queue error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title={isTa ? 'திருத்தக் கோரிக்கைகள் பணிவரிசை' : 'Pending Correction Requests Queue'}
        subtitle={
          isTa
            ? 'சான்றிதழ் திருத்தத்திற்காக மனுதாரர்களுக்கு திருப்பி அனுப்பப்பட்ட விண்ணப்பங்களின் நிலவரம்'
            : 'Track applications returned to citizens for re-upload of unreadable or missing supporting documents'
        }
        badge={`${applications.length} Pending Actions`}
        badgeVariant="amber"
        icon={AlertTriangle}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Workbench', href: '/officer/dashboard' },
          { label: isTa ? 'திருத்தக் கோரிக்கைகள்' : 'Correction Requests' }
        ]}
        actions={
          <button
            onClick={() => fetchCorrectionsQueue()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh Queue'}</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="gov-card p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by application ref, citizen name, or mobile..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#10243A] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="gov-card overflow-hidden border border-slate-200">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading correction cases...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 space-y-2 text-slate-500 text-xs">
            <AlertCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-700">No applications currently awaiting citizen correction.</p>
            <p className="text-slate-400">All requested corrections have been submitted or cleared.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Application Reference</th>
                  <th className="py-3 px-4">Citizen Details</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Welfare Scheme</th>
                  <th className="py-3 px-4">Correction Count</th>
                  <th className="py-3 px-4">Officer Correction Remarks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => {
                  const schemeName = isTa ? app.schemeId?.name?.ta || app.schemeId?.name?.en : app.schemeId?.name?.en;

                  return (
                    <tr key={app._id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#10243A]">
                        {app.applicationReference || app.applicationNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172B4D]">{app.citizenId?.name || app.formData?.applicantName || 'Citizen'}</div>
                        <div className="text-[10px] text-slate-400">{app.citizenId?.mobile || app.formData?.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{app.district || app.citizenId?.district || 'Madurai'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 max-w-[200px] truncate">{schemeName}</div>
                        <div className="text-[10px] text-slate-400">{app.schemeId?.department?.en}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          {app.correctionCount || 1} Request(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-amber-900 max-w-[240px] truncate font-medium italic">
                        "{app.officerRemarks || 'Correction requested by reviewing officer'}"
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/officer/applications/${app._id}`}
                          className="px-3.5 py-1.5 bg-[#10243A] hover:bg-[#1a385c] text-white font-bold text-xs rounded-xl shadow-2xs transition-all inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Case</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
