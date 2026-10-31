import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ListTodo,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  Building,
  User,
  ArrowUpDown,
  FileText
} from 'lucide-react';

export const OfficerApplicationQueuePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang, user } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const initialQueue = searchParams.get('queue') || 'new';
  const initialStatus = searchParams.get('status') || '';

  const [activeQueue, setActiveQueue] = useState<'new' | 'pending' | 'under_review' | 'completed'>(
    (initialQueue as any) || 'new'
  );
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [districtFilter, setDistrictFilter] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [applications, setApplications] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [activeQueue, statusFilter, districtFilter, schemeFilter, search, sortOrder]);

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/schemes');
      setSchemes(res.data.schemes || []);
    } catch (err) {
      console.error('Fetch schemes error:', err);
    }
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params: any = {
        queue: activeQueue,
        sort: sortOrder,
        search: search.trim() || undefined,
        district: districtFilter || undefined,
        schemeId: schemeFilter || undefined
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await api.get('/admin/applications', { params });
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error('Fetch queue error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (queueTab: 'new' | 'pending' | 'under_review' | 'completed') => {
    setActiveQueue(queueTab);
    setStatusFilter('');
    setSearchParams({ queue: queueTab });
  };

  const queueTabs = [
    {
      id: 'new',
      label: isTa ? 'புதிய விண்ணப்பங்கள்' : 'New Applications',
      icon: Clock,
      desc: isTa ? 'சமீபத்தில் சமர்ப்பிக்கப்பட்டவை' : 'Fresh citizen submissions'
    },
    {
      id: 'pending',
      label: isTa ? 'சரிபார்ப்பு நிலுவை' : 'Pending Verification',
      icon: FileText,
      desc: isTa ? 'மீண்டும் சமர்ப்பிக்கப்பட்டவை / நிலுவை' : 'Resubmitted / awaiting document check'
    },
    {
      id: 'under_review',
      label: isTa ? 'பரிசீலனையில் உள்ளவை' : 'Under Review',
      icon: Search,
      desc: isTa ? 'அதிகாரி நேரடி ஆய்வில் உள்ளவை' : 'Active case examination in progress'
    },
    {
      id: 'completed',
      label: isTa ? 'முடிவு பெற்றவை' : 'Completed Cases',
      icon: CheckCircle2,
      desc: isTa ? 'ஒப்புதல் மற்றும் நிராகரிக்கப்பட்டவை' : 'Sanctioned approvals & rejections'
    }
  ];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title={isTa ? 'விண்ணப்ப மேலாண்மை மற்றும் பணிவரிசைகள்' : 'Welfare Application Queues & Case Management'}
        subtitle={
          isTa
            ? 'அரசு நலத்திட்ட விண்ணப்பங்களை நிலைகளின் அடிப்படையில் வகைப்படுத்தி ஆய்வு செய்யவும்'
            : 'Multi-stage administrative processing queues for citizen welfare applications'
        }
        badge={`${applications.length} Records`}
        badgeVariant="blue"
        icon={ListTodo}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Workbench', href: '/officer/dashboard' },
          { label: isTa ? 'விண்ணப்ப பணிவரிசை' : 'Application Queues' }
        ]}
        actions={
          <button
            onClick={() => fetchQueue()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isTa ? 'புதுப்பி' : 'Refresh Queue'}</span>
          </button>
        }
      />

      {/* 4 Main Application Management Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {queueTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeQueue === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-[#10243A] text-white border-[#10243A] shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                <span className="font-extrabold text-xs">{tab.label}</span>
              </div>
              <p className={`text-[10px] mt-1 line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="gov-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ref number, applicant name, mobile..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#10243A] focus:outline-none"
            />
          </div>

          {/* District Filter */}
          <div className="sm:col-span-3">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#10243A] focus:outline-none"
            >
              <option value="">All Districts (Jurisdiction)</option>
              <option value="Madurai">Madurai</option>
              <option value="Chennai">Chennai</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Tiruchirappalli">Tiruchirappalli</option>
              <option value="Salem">Salem</option>
              <option value="Tirunelveli">Tirunelveli</option>
            </select>
          </div>

          {/* Scheme Filter */}
          <div className="sm:col-span-3">
            <select
              value={schemeFilter}
              onChange={(e) => setSchemeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#10243A] focus:outline-none"
            >
              <option value="">All Schemes</option>
              {schemes.map((s) => (
                <option key={s._id} value={s._id}>{s.name?.en || s.schemeCode}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="sm:col-span-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center space-x-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>

        {/* Sub-status filters for Completed queue */}
        {activeQueue === 'completed' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-bold">Decision Filter:</span>
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                statusFilter === '' ? 'bg-[#10243A] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All Completed
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                statusFilter === 'APPROVED' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Approved Sanctions
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                statusFilter === 'REJECTED' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Rejected Cases
            </button>
          </div>
        )}
      </div>

      {/* Applications Table */}
      <div className="gov-card overflow-hidden border border-slate-200">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs">Loading queue applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 space-y-2 text-slate-500 text-xs">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No applications found in this queue.</p>
            <p className="text-slate-400">Try adjusting your search keywords or filter criteria.</p>
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
                  <th className="py-3 px-4">Submitted Date</th>
                  {activeQueue === 'under_review' && <th className="py-3 px-4">Review Started</th>}
                  {activeQueue === 'completed' && <th className="py-3 px-4">Decision Remarks</th>}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => {
                  const schemeName = isTa ? app.schemeId?.name?.ta || app.schemeId?.name?.en : app.schemeId?.name?.en;

                  return (
                    <tr key={app._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#10243A]">
                        {app.applicationReference || app.applicationNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#172B4D]">{app.citizenId?.name || app.formData?.applicantName || 'Citizen'}</div>
                        <div className="text-[10px] text-slate-400">{app.citizenId?.mobile || app.formData?.mobile}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{app.district || app.citizenId?.district || 'Madurai'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 max-w-[200px] truncate">{schemeName}</div>
                        <div className="text-[10px] text-slate-400">{app.schemeId?.department?.en}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(app.submittedAt || app.createdAt).toLocaleDateString()}
                      </td>

                      {activeQueue === 'under_review' && (
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {app.verificationStartedAt ? new Date(app.verificationStartedAt).toLocaleDateString() : 'In Progress'}
                        </td>
                      )}

                      {activeQueue === 'completed' && (
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate font-medium">
                          {app.officerRemarks || (app.status === 'APPROVED' ? 'Approved by officer' : 'Rejected')}
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/officer/applications/${app._id}`}
                          className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow-2xs transition-all inline-flex items-center space-x-1 ${
                            activeQueue === 'new' || activeQueue === 'pending'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-[#10243A] hover:bg-[#1a385c] text-white'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {activeQueue === 'new' ? 'Inspect Case' :
                             activeQueue === 'pending' ? 'Start Review' :
                             activeQueue === 'under_review' ? 'Continue Review' :
                             'View Case'}
                          </span>
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
