import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Shield,
  FilePlus,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Bell,
  Building,
  Filter
} from 'lucide-react';

interface OfficerStats {
  newApplications: number;
  pendingVerification: number;
  underReview: number;
  correctionRequired: number;
  approved: number;
  rejected: number;
}

export const OfficerDashboardPage: React.FC = () => {
  const { user, lang } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isTa = lang === 'ta';

  const [stats, setStats] = useState<OfficerStats>({
    newApplications: 0,
    pendingVerification: 0,
    underReview: 0,
    correctionRequired: 0,
    approved: 0,
    rejected: 0
  });

  const [newApplications, setNewApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh interval every 30 seconds for real-time dashboard capability
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, newAppsRes] = await Promise.all([
        api.get('/admin/officer-stats'),
        api.get('/admin/applications', { params: { queue: 'new', sort: 'newest' } })
      ]);

      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
      setNewApplications(newAppsRes.data?.applications || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Fetch officer dashboard data error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isRecentApplication = (submittedAt: string | Date) => {
    if (!submittedAt) return false;
    const diffHours = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60);
    return diffHours <= 48; // Within 48 hours
  };

  const cards = [
    {
      title: isTa ? 'புதிய விண்ணப்பங்கள்' : 'New Applications',
      count: stats.newApplications,
      icon: FilePlus,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      badgeColor: 'bg-blue-600 text-white',
      desc: isTa ? 'உடனடி ஆய்வு தேவை' : 'Fresh submissions awaiting initial check',
      queue: 'new',
      status: 'SUBMITTED'
    },
    {
      title: isTa ? 'சரிபார்ப்பு நிலுவை' : 'Pending Verification',
      count: stats.pendingVerification,
      icon: Clock,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeColor: 'bg-amber-600 text-white',
      desc: isTa ? 'ஆவணங்கள் ஆய்வு செய்யப்பட வேண்டும்' : 'Awaiting officer document audit',
      queue: 'pending',
      status: ''
    },
    {
      title: isTa ? 'பரிசீலனையில் உள்ளவை' : 'Under Review',
      count: stats.underReview,
      icon: Search,
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      badgeColor: 'bg-indigo-600 text-white',
      desc: isTa ? 'அதிகாரி ஆய்வில் உள்ளது' : 'Active case eligibility evaluation',
      queue: 'under_review',
      status: 'UNDER_REVIEW'
    },
    {
      title: isTa ? 'திருத்தம் கோரப்பட்டவை' : 'Correction Required',
      count: stats.correctionRequired,
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-800 border-orange-200',
      badgeColor: 'bg-orange-600 text-white',
      desc: isTa ? 'பயனாளி ஆவண திருத்தம் தேவை' : 'Sent back to citizens for corrections',
      queue: 'corrections',
      status: 'CORRECTION_REQUIRED'
    },
    {
      title: isTa ? 'ஒப்புதல் பெற்றவை' : 'Approved Applications',
      count: stats.approved,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      desc: isTa ? 'பயன் ஆணை வழங்கப்பட்டது' : 'Sanctioned benefits successfully processed',
      queue: 'completed',
      status: 'APPROVED'
    },
    {
      title: isTa ? 'நிராகரிக்கப்பட்டவை' : 'Rejected Applications',
      count: stats.rejected,
      icon: XCircle,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeColor: 'bg-rose-600 text-white',
      desc: isTa ? 'தகுதி பெறாத விண்ணப்பங்கள்' : 'Ineligible or non-compliant case decisions',
      queue: 'completed',
      status: 'REJECTED'
    }
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <PageHeader
        title={isTa ? 'மாவட்ட நலத்துறை அதிகாரி பணித்தளம்' : 'District Welfare Officer Application Workbench'}
        subtitle={
          isTa
            ? `${user?.district || 'தமிழ்நாடு'} மண்டல நலத்திட்ட விண்ணப்பங்களின் நிகழ்நேர பரிசீலனை மற்றும் ஒப்புதல் மையம்`
            : `Real-time case queue, document verification, and statutory benefit sanction orders for ${user?.district || 'Tamil Nadu'}`
        }
        badge={`${user?.district || 'District'} Jurisdiction`}
        badgeVariant="blue"
        icon={Shield}
        actions={
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 hidden sm:inline">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isTa ? 'புதுப்பி' : 'Refresh Data'}</span>
            </button>
            <Link
              to="/officer/applications"
              className="px-4 py-2 bg-[#10243A] hover:bg-[#1a385c] text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-all"
            >
              <span>{isTa ? 'முழு பணிவரிசை' : 'All Queues'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* 6 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(`/officer/applications?queue=${c.queue}${c.status ? `&status=${c.status}` : ''}`)}
              className="gov-card p-5 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                    {c.title}
                  </span>
                  <div className="text-3xl font-extrabold text-[#172B4D] tracking-tight">
                    {loading ? '...' : c.count}
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${c.color} shadow-2xs`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                  {c.desc}
                </span>
                <span className="font-bold text-[#10243A] flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View Queue</span>
                  <ArrowRight className="w-3 h-3 text-blue-600" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEWLY RECEIVED APPLICATIONS SECTION */}
      <div className="gov-card p-6 space-y-5 border-l-4 border-l-blue-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-[#172B4D]">
                  {isTa ? 'புதிதாக பெறப்பட்ட விண்ணப்பங்கள்' : 'Newly Received Applications'}
                </h2>
                {newApplications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white animate-pulse">
                    {newApplications.length} NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTa
                  ? 'மனுதாரர்களிடமிருந்து சமர்ப்பிக்கப்பட்டு உங்கள் பரிசீலனைக்கு தயாராக உள்ள புதிய விண்ணப்பங்கள்'
                  : 'Citizens applications submitted in your jurisdiction awaiting initial officer verification'}
              </p>
            </div>
          </div>

          <Link
            to="/officer/applications?queue=new"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>{isTa ? 'அனைத்து புதிய மனுக்கள்' : 'View Full New Queue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Table of New Applications */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading incoming applications...</div>
        ) : newApplications.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700">All caught up! No incoming applications waiting for review.</p>
            <p className="text-[11px] text-slate-400">Newly submitted applications from citizens will appear here immediately.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Application Ref</th>
                  <th className="py-3 px-4">Citizen Name</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Welfare Scheme</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {newApplications.slice(0, 5).map((app) => {
                  const isNew = isRecentApplication(app.submittedAt || app.createdAt);
                  const schemeName = isTa ? app.schemeId?.name?.ta || app.schemeId?.name?.en : app.schemeId?.name?.en;

                  return (
                    <tr key={app._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#10243A]">
                        <div className="flex items-center space-x-1.5">
                          <span>{app.applicationReference || app.applicationNo}</span>
                          {isNew && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                              NEW
                            </span>
                          )}
                        </div>
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
                        <div className="font-bold text-slate-800 max-w-[220px] truncate">{schemeName}</div>
                        <div className="text-[10px] text-slate-400">{app.schemeId?.department?.en || 'Welfare Dept'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
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

      {/* QUICK WORKSPACE NAVIGATION TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/officer/applications?queue=pending"
          className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-xs transition-all flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#172B4D]">{isTa ? 'நிலுவை வரிசை' : 'Pending Verification Queue'}</h3>
            <p className="text-[11px] text-slate-500">{stats.pendingVerification} cases waiting for document review</p>
          </div>
        </Link>

        <Link
          to="/officer/applications?queue=under_review"
          className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-xs transition-all flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#172B4D]">{isTa ? 'நேரடி பரிசீலனை' : 'In-Progress Case Review'}</h3>
            <p className="text-[11px] text-slate-500">{stats.underReview} applications currently being audited</p>
          </div>
        </Link>

        <Link
          to="/officer/applications?queue=corrections"
          className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-xs transition-all flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#172B4D]">{isTa ? 'திருத்தம் கண்காணிப்பு' : 'Correction Tracking Queue'}</h3>
            <p className="text-[11px] text-slate-500">{stats.correctionRequired} returned to citizens for corrections</p>
          </div>
        </Link>
      </div>

    </div>
  );
};
