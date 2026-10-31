import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  FileCheck,
  ArrowRight,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';

export const MyApplicationsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await api.get('/applications/my-portfolio');
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics calculation
  const totalCount = applications.length;
  const inReviewCount = applications.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'PENDING'
  ).length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const actionRequiredCount = applications.filter(
    (a) => a.status === 'CORRECTION_REQUIRED' || a.status === 'DOCUMENTS_REQUIRED'
  ).length;

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const statusMatch =
      statusFilter === 'ALL' ||
      (statusFilter === 'REVIEW' &&
        (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'PENDING')) ||
      (statusFilter === 'APPROVED' && app.status === 'APPROVED') ||
      (statusFilter === 'ACTION' &&
        (app.status === 'CORRECTION_REQUIRED' || app.status === 'DOCUMENTS_REQUIRED'));

    const q = searchQuery.trim().toLowerCase();
    const appNo = app.applicationNo?.toLowerCase() || '';
    const nameEn = app.schemeId?.name?.en?.toLowerCase() || '';
    const nameTa = app.schemeId?.name?.ta?.toLowerCase() || '';
    const searchMatch = !q || appNo.includes(q) || nameEn.includes(q) || nameTa.includes(q);

    return statusMatch && searchMatch;
  });

  // Calculate 4-step progress based on status
  const getStepProgress = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 4;
      case 'UNDER_REVIEW':
        return 3;
      case 'SUBMITTED':
      case 'PENDING':
        return 2;
      case 'CORRECTION_REQUIRED':
        return 2;
      case 'REJECTED':
        return 1;
      default:
        return 2;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#10243A] border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">
          {isTa ? 'விண்ணப்பங்கள் பெறப்படுகின்றன...' : 'Loading your application portfolio...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title={isTa ? 'என் விண்ணப்பங்கள்' : 'My Applications'}
        subtitle={
          isTa
            ? 'அரசு நலத்திட்ட விண்ணப்பங்களின் தற்போதைய நிலை, சரிபார்ப்பு மற்றும் மைல்கல் முன்னேற்றம்'
            : 'Track the complete lifecycle, verification reviews, and official approval status of your welfare applications'
        }
        badge={isTa ? 'விண்ணப்ப கண்காணிப்பு' : 'Live State Tracker'}
        badgeVariant="blue"
        icon={FileCheck}
        breadcrumbs={[
          { label: isTa ? 'முகப்பு' : 'Dashboard', href: '/citizen/dashboard' },
          { label: isTa ? 'விண்ணப்பங்கள்' : 'My Applications' }
        ]}
      />

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title={isTa ? 'மொத்த விண்ணப்பங்கள்' : 'Total Applications'}
          value={totalCount}
          subtext={isTa ? 'சமர்ப்பிக்கப்பட்டவை' : 'Registered in portal'}
          icon={FileCheck}
          variant="navy"
          onClick={() => setStatusFilter('ALL')}
        />

        <StatCard
          title={isTa ? 'பரிசீலனையில்' : 'Under Review'}
          value={inReviewCount}
          subtext={isTa ? 'அதிகாரிகள் ஆய்வு' : 'Officer verification stage'}
          icon={Clock}
          variant="blue"
          onClick={() => setStatusFilter('REVIEW')}
        />

        <StatCard
          title={isTa ? 'அங்கீகரிக்கப்பட்டவை' : 'Approved Benefits'}
          value={approvedCount}
          subtext={isTa ? 'உதவி விடுவிக்கப்பட்டது' : 'Benefit sanctioned'}
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => setStatusFilter('APPROVED')}
        />

        <StatCard
          title={isTa ? 'நடவடிக்கை தேவை' : 'Action Required'}
          value={actionRequiredCount}
          subtext={isTa ? 'ஆவணத் திருத்தம்' : 'Corrections / Documents'}
          icon={AlertTriangle}
          variant="amber"
          onClick={() => setStatusFilter('ACTION')}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="gov-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-[#10243A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'அனைத்தும்' : 'All'} ({totalCount})
          </button>

          <button
            onClick={() => setStatusFilter('REVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'REVIEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'பரிசீலனையில்' : 'In Review'} ({inReviewCount})
          </button>

          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'அங்கீகரிக்கப்பட்டவை' : 'Approved'} ({approvedCount})
          </button>

          <button
            onClick={() => setStatusFilter('ACTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'ACTION'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isTa ? 'நடவடிக்கை தேவை' : 'Action Needed'} ({actionRequiredCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={isTa ? 'விண்ணப்ப எண் / திட்டம் தேடுக...' : 'Search by App ID or Scheme...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <EmptyState
            icon={FileCheck}
            title={isTa ? 'விண்ணப்பங்கள் எதுவும் இல்லை' : 'No Applications Found'}
            description={
              isTa
                ? 'நீங்கள் இதுவரை எந்த அரசு நலத்திட்டத்திற்கும் விண்ணப்பிக்கவில்லை அல்லது தேர்ந்தெடுக்கப்பட்ட வடிகட்டியில் விண்ணப்பங்கள் இல்லை.'
                : 'You have not submitted any applications yet, or no applications match the selected status filter.'
            }
            actionText={isTa ? 'நலத்திட்டங்களை கண்டறிக' : 'Discover Welfare Schemes'}
            onAction={() => window.location.assign('/citizen/eligible-schemes')}
          />
        ) : (
          filteredApps.map((app: any) => {
            const currentStep = getStepProgress(app.status);
            const schemeName = isTa
              ? app.schemeId?.name?.ta || app.schemeId?.name?.en
              : app.schemeId?.name?.en;

            return (
              <div
                key={app._id}
                className="gov-card p-5 space-y-4 hover:border-slate-300 transition-all duration-200"
              >
                {/* Application Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(app.applicationNo)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition-colors"
                      title="Click to copy application number"
                    >
                      <span>{app.applicationNo}</span>
                      {copiedId === app.applicationNo ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-blue-500" />
                      )}
                    </button>

                    <span className="text-slate-300">•</span>

                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <StatusBadge status={app.status} isTamil={isTa} size="md" />
                </div>

                {/* Main Details & Scheme Title */}
                <div>
                  <h3 className="text-base font-extrabold text-[#172B4D] leading-snug">
                    {schemeName}
                  </h3>
                  {app.schemeId?.department && (
                    <p className="text-xs text-slate-500 mt-1">
                      {isTa ? app.schemeId.department.ta : app.schemeId.department.en}
                    </p>
                  )}
                </div>

                {/* 4-Stage Visual Progress Tracker */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span className={currentStep >= 1 ? 'text-blue-900' : ''}>
                      1. {isTa ? 'சமர்ப்பிக்கப்பட்டது' : 'Submitted'}
                    </span>
                    <span className={currentStep >= 2 ? 'text-blue-900' : ''}>
                      2. {isTa ? 'ஆவண சரிபார்ப்பு' : 'Verification'}
                    </span>
                    <span className={currentStep >= 3 ? 'text-blue-900' : ''}>
                      3. {isTa ? 'துறை ஆய்வு' : 'Department Review'}
                    </span>
                    <span className={currentStep >= 4 ? 'text-emerald-700' : ''}>
                      4. {isTa ? 'அங்கீகாரம்' : 'Sanctioned'}
                    </span>
                  </div>

                  {/* Step Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        app.status === 'REJECTED'
                          ? 'bg-rose-500 w-1/4'
                          : app.status === 'CORRECTION_REQUIRED'
                          ? 'bg-amber-500 w-1/2'
                          : app.status === 'APPROVED'
                          ? 'bg-emerald-500 w-full'
                          : currentStep === 3
                          ? 'bg-blue-600 w-3/4'
                          : 'bg-blue-600 w-1/2'
                      }`}
                    />
                  </div>
                </div>

                {/* Footer Action Links */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {isTa ? 'கடைசியாக புதுப்பிக்கப்பட்டது: ' : 'Last status update: '}
                    <span className="font-semibold text-slate-700">
                      {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/citizen/applications/${app._id}/documents`}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isTa ? 'ஆவணங்கள்' : 'Documents'}</span>
                    </Link>

                    <Link
                      to={`/citizen/applications/${app._id}`}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#10243A] hover:bg-[#193352] rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 active:scale-95"
                    >
                      <span>{isTa ? 'முழு காலவரிசை' : 'Track Timeline'}</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
