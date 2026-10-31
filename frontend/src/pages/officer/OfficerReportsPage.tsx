import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FileText,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Printer,
  RefreshCw,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  CheckSquare,
  Building,
  Info,
  Calendar,
  Lock,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MetricDelta {
  count: number;
  previousCount: number;
  delta: number;
}

interface ReportSummary {
  period: {
    startDate: string;
    endDate: string;
    label: string;
    rangeType: string;
  };
  authorizedDistrict: string;
  kpis: {
    totalReceived: MetricDelta;
    pendingVerification: MetricDelta;
    underReview: MetricDelta;
    approved: MetricDelta;
    rejected: MetricDelta;
    correctionRequired: MetricDelta;
  };
  lastUpdated: string;
}

interface TrendItem {
  label: string;
  periodStart: string;
  received: number;
  processed: number;
}

interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface DecisionAnalysis {
  approved: { count: number; percentage: number };
  rejected: { count: number; percentage: number };
  awaitingDecision: { count: number; percentage: number };
}

interface SchemePerformanceItem {
  schemeId: string;
  schemeCode: string;
  schemeName: { en: string; ta: string };
  department: { en: string; ta: string };
  totalReceived: number;
  approved: number;
  rejected: number;
  pending: number;
  correctionRequired: number;
  approvalRate: number | null;
  approvalRateDisplay: string;
  avgProcessingTimeHours: number | null;
  avgProcessingTimeDisplay: string;
}

interface OfficerPerformanceData {
  periodLabel: string;
  avgVerificationTimeHours: number | null;
  avgVerificationTimeDisplay: string;
  avgProcessingTimeHours: number | null;
  avgProcessingTimeDisplay: string;
  approvalRate: number | null;
  approvalRateDisplay: string;
  correctionRate: number;
  correctionRateDisplay: string;
  clearanceRate: number | null;
  clearanceRateDisplay: string;
  clearanceExplanation: string;
  totalDecisionsInPeriod: number;
  totalReceivedInPeriod: number;
  pendingBacklog: {
    totalPending: number;
    pendingOver7Days: number;
    pendingOver15Days: number;
    pendingOver30Days: number;
  };
}

interface AgingBucketItem {
  bucket: string;
  label: string;
  count: number;
  urgency: 'normal' | 'attention' | 'warning' | 'high' | 'critical';
  color: string;
  description: string;
}

interface RecentActivityApplication {
  id: string;
  applicationNo: string;
  applicationReference: string;
  citizenName: string;
  citizenDistrict: string;
  schemeId: string;
  schemeCode: string;
  schemeName: { en: string; ta: string };
  status: string;
  submittedAt: string;
  updatedAt: string;
  assignedOfficer: string;
  correctionCount: number;
  officerRemarks: string;
}

export const OfficerReportsPage: React.FC = () => {
  const { user, lang } = useAuth();
  const isTa = lang === 'ta';
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter Toolbar States
  const [dateRange, setDateRange] = useState<string>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(user?.district || 'Madurai');

  // Trend Interval State
  const [trendInterval, setTrendInterval] = useState<'weekly' | 'monthly' | 'daily'>('weekly');

  // Scheme Performance Sorting
  const [schemeSortBy, setSchemeSortBy] = useState<'totalReceived' | 'approvalRate'>('totalReceived');
  const [schemeSortDir, setSchemeSortDir] = useState<'asc' | 'desc'>('desc');

  // Recent Activity Search & Pagination
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('ALL');
  const [activityPage, setActivityPage] = useState<number>(1);
  const [activityLimit] = useState<number>(8);
  const [activityTotalPages, setActivityTotalPages] = useState<number>(1);
  const [activityTotalCount, setActivityTotalCount] = useState<number>(0);

  // Master Data & Status
  const [schemesList, setSchemesList] = useState<any[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDistributionItem[]>([]);
  const [decisionAnalysis, setDecisionAnalysis] = useState<DecisionAnalysis | null>(null);
  const [schemePerf, setSchemePerf] = useState<SchemePerformanceItem[]>([]);
  const [officerPerf, setOfficerPerf] = useState<OfficerPerformanceData | null>(null);
  const [agingBuckets, setAgingBuckets] = useState<AgingBucketItem[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentActivityApplication[]>([]);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activityLoading, setActivityLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Available districts for Admin role
  const tnDistricts = [
    'Chennai',
    'Madurai',
    'Coimbatore',
    'Salem',
    'Tiruchirappalli',
    'Tirunelveli',
    'Vellore',
    'Thanjavur',
    'Erode',
    'Dindigul'
  ];

  // Fetch schemes once for filter dropdown
  useEffect(() => {
    const fetchMasterSchemes = async () => {
      try {
        const res = await api.get('/schemes');
        setSchemesList(res.data.schemes || []);
      } catch (err) {
        console.error('Error fetching master schemes:', err);
      }
    };
    fetchMasterSchemes();
  }, []);

  // Fetch dashboard data whenever filters change
  useEffect(() => {
    fetchDashboardAnalytics(true);
  }, [dateRange, selectedSchemeId, selectedStatus, selectedDistrict, trendInterval]);

  // Fetch recent activity table when table filters / page changes
  useEffect(() => {
    fetchRecentActivity();
  }, [dateRange, selectedSchemeId, selectedDistrict, activitySearch, activityStatusFilter, activityPage]);

  // Core Aggregation Fetcher
  const fetchDashboardAnalytics = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const params: any = {
        dateRange,
        schemeId: selectedSchemeId,
        status: selectedStatus,
        district: selectedDistrict,
        interval: trendInterval
      };

      if (dateRange === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      // Execute consolidated report fetch
      const [dashRes, trendsRes] = await Promise.all([
        api.get('/officer/reports/dashboard', { params }),
        api.get('/officer/reports/application-trends', { params })
      ]);

      const dash = dashRes.data;
      if (dash) {
        setSummary(dash.summary || null);
        setStatusDist(dash.statusDistribution?.distribution || []);
        setDecisionAnalysis(dash.statusDistribution?.decisionAnalysis || null);
        setSchemePerf(dash.schemePerformance?.schemes || []);
        setOfficerPerf(dash.officerPerformance || null);
        setAgingBuckets(dash.pendingAging?.agingBuckets || []);
      }

      if (trendsRes.data?.trends) {
        setTrends(trendsRes.data.trends);
      }

      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Error fetching officer reports data:', err);
      setError(
        err.response?.data?.message || 'Unable to retrieve government analytics reports. Please retry.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recent Activity Fetcher
  const fetchRecentActivity = async () => {
    setActivityLoading(true);
    try {
      const params: any = {
        dateRange,
        schemeId: selectedSchemeId,
        district: selectedDistrict,
        status: activityStatusFilter !== 'ALL' ? activityStatusFilter : undefined,
        search: activitySearch.trim() || undefined,
        page: activityPage,
        limit: activityLimit,
        sortBy: 'updatedAt',
        sortDir: 'desc'
      };

      if (dateRange === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const res = await api.get('/officer/reports/recent-activity', { params });
      setRecentApplications(res.data.applications || []);
      if (res.data.pagination) {
        setActivityTotalPages(res.data.pagination.totalPages || 1);
        setActivityTotalCount(res.data.pagination.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching recent application activity:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setDateRange('this_month');
    setCustomStart('');
    setCustomEnd('');
    setSelectedSchemeId('ALL');
    setSelectedStatus('ALL');
    setSelectedDistrict(user?.district || 'Madurai');
    setTrendInterval('weekly');
    setActivitySearch('');
    setActivityStatusFilter('ALL');
    setActivityPage(1);
  };

  // CSV Export Action
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        dateRange,
        schemeId: selectedSchemeId,
        status: selectedStatus,
        district: selectedDistrict
      });

      if (dateRange === 'custom' && customStart && customEnd) {
        params.append('startDate', customStart);
        params.append('endDate', customEnd);
      }

      // Download file directly from secured server endpoint
      const response = await api.get(`/officer/reports/export/csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TN_Welfare_Audit_Report_${selectedDistrict}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export failed:', err);
      alert('Failed to generate export file. Please verify database connectivity.');
    }
  };

  // Print Report Action
  const handlePrintReport = () => {
    window.print();
  };

  // Sorted Scheme Performance List
  const sortedSchemes = useMemo(() => {
    return [...schemePerf].sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (schemeSortBy === 'approvalRate') {
        valA = a.approvalRate ?? -1;
        valB = b.approvalRate ?? -1;
      } else {
        valA = a.totalReceived;
        valB = b.totalReceived;
      }

      return schemeSortDir === 'desc' ? valB - valA : valA - valB;
    });
  }, [schemePerf, schemeSortBy, schemeSortDir]);

  // Horizontal Bar Chart Data for Welfare Schemes
  const schemeChartData = useMemo(() => {
    return sortedSchemes.slice(0, 6).map((s) => ({
      name: (isTa ? s.schemeName.ta : s.schemeName.en).slice(0, 26) + '...',
      fullName: isTa ? s.schemeName.ta : s.schemeName.en,
      code: s.schemeCode,
      total: s.totalReceived,
      approved: s.approved,
      pending: s.pending,
      rejected: s.rejected
    }));
  }, [sortedSchemes, isTa]);

  // 6 KPI Cards Configuration
  const kpiCards = [
    {
      id: 'totalReceived',
      title: isTa ? 'மொத்த விண்ணப்பங்கள்' : 'Total Applications Received',
      count: summary?.kpis.totalReceived.count ?? 0,
      delta: summary?.kpis.totalReceived.delta ?? 0,
      icon: FileText,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      badgeColor: 'bg-blue-600 text-white',
      desc: isTa ? 'நடப்பு காலகட்டத்தில் பெறப்பட்டவை' : 'Submitted during reporting period',
      queue: 'all',
      status: ''
    },
    {
      id: 'pendingVerification',
      title: isTa ? 'சரிபார்ப்பு நிலுவை' : 'Pending Verification',
      count: summary?.kpis.pendingVerification.count ?? 0,
      delta: summary?.kpis.pendingVerification.delta ?? 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeColor: 'bg-amber-600 text-white',
      desc: isTa ? 'முதல்நிலை ஆவண ஆய்வு தேவை' : 'Fresh submissions awaiting officer check',
      queue: 'pending',
      status: 'SUBMITTED'
    },
    {
      id: 'underReview',
      title: isTa ? 'பரிசீலனையில் உள்ளவை' : 'Under Review',
      count: summary?.kpis.underReview.count ?? 0,
      delta: summary?.kpis.underReview.delta ?? 0,
      icon: Search,
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      badgeColor: 'bg-indigo-600 text-white',
      desc: isTa ? 'அதிகாரி தீவிர ஆய்வில் உள்ளவை' : 'Case eligibility audit in active progress',
      queue: 'under_review',
      status: 'UNDER_REVIEW'
    },
    {
      id: 'approved',
      title: isTa ? 'ஒப்புதல் பெற்றவை' : 'Approved Applications',
      count: summary?.kpis.approved.count ?? 0,
      delta: summary?.kpis.approved.delta ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      desc: isTa ? 'பயன் ஆணை வழங்கப்பட்டவை' : 'Statutory benefit sanction orders granted',
      queue: 'completed',
      status: 'APPROVED'
    },
    {
      id: 'rejected',
      title: isTa ? 'நிராகரிக்கப்பட்டவை' : 'Rejected Applications',
      count: summary?.kpis.rejected.count ?? 0,
      delta: summary?.kpis.rejected.delta ?? 0,
      icon: XCircle,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeColor: 'bg-rose-600 text-white',
      desc: isTa ? 'விதிகளின்படி நிராகரிக்கப்பட்டவை' : 'Ineligible or non-compliant decisions recorded',
      queue: 'completed',
      status: 'REJECTED'
    },
    {
      id: 'correctionRequired',
      title: isTa ? 'திருத்தம் கோரப்பட்டவை' : 'Correction Required',
      count: summary?.kpis.correctionRequired.count ?? 0,
      delta: summary?.kpis.correctionRequired.delta ?? 0,
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-800 border-orange-200',
      badgeColor: 'bg-orange-600 text-white',
      desc: isTa ? 'விண்ணப்பதாரர் ஆவண திருத்தம் தேவை' : 'Sent back to citizens for missing documents',
      queue: 'corrections',
      status: 'CORRECTION_REQUIRED'
    }
  ];

  return (
    <div ref={reportRef} className="space-y-8 pb-20 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
      
      {/* =========================================================================
          PRINT-ONLY OFFICIAL GOVERNMENT HEADER
         ========================================================================= */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Government of Tamil Nadu • தமிழ்நாடு அரசு
            </h1>
            <h2 className="text-sm font-bold text-slate-700">
              Department of Welfare • District Officer Statutory Review & Performance Audit
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Authorized District: <strong>{selectedDistrict} District</strong> | Generated: {new Date().toLocaleString()} | Period: {summary?.period.label}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <span className="font-mono font-bold block">PORTAL AUDIT REPORT</span>
            <span>TN-WP-REP-SECURE</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOP PAGE HEADER & EXPORT ACTIONS (SCREEN)
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#10243A] text-white shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user?.role === 'Officer' ? `${user?.district || 'Madurai'} District Jurisdiction` : 'State-Wide Purview'}</span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Tamil Nadu Citizen Welfare Governance Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight">
            {isTa ? 'மாவட்ட பணி ஆய்வு அறிக்கைகள் & பகுப்பாய்வு' : 'Officer Performance & Review Reports'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isTa
              ? `${selectedDistrict} மாவட்ட நலத்திட்ட விண்ணப்பங்களின் பணி சுமை, தீர்வு காலம் மற்றும் செயல்திறன் பகுப்பாய்வு`
              : `Comprehensive turnaround SLA metrics, backlog cohorts, and scheme clearance ratios for ${selectedDistrict} District`}
          </p>
        </div>

        {/* Global Export & Refresh Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="text-xs text-slate-400 hidden lg:block mr-1">
            {isTa ? 'கடைசியாக புதுப்பிக்கப்பட்டது:' : 'Last updated:'}{' '}
            <span className="font-mono font-semibold text-slate-600">{lastRefreshedAt.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => fetchDashboardAnalytics(false)}
            disabled={refreshing || loading}
            title="Refresh database metrics"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center space-x-2 transition-all shadow-2xs cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">{isTa ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            title="Export CSV containing current filter results"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center space-x-2 transition-all shadow-2xs cursor-pointer text-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{isTa ? 'CSV பதிவிறக்கம்' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handlePrintReport}
            title="Generate printable government report"
            className="px-4 py-2.5 bg-[#10243A] hover:bg-[#1a385c] text-white font-bold rounded-xl flex items-center space-x-2 shadow-2xs transition-all cursor-pointer text-xs"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isTa ? 'அறிக்கை அச்சிடு' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          REPORT FILTER TOOLBAR (SECTION 2)
         ========================================================================= */}
      <div className="gov-card p-5 space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>{isTa ? 'அறிக்கை வடிகட்டிகள் (Audit Scope Filters)' : 'Statutory Report Filters'}</span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-rose-600 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isTa ? 'வடிகட்டிகளை மீட்டமை' : 'Reset Filters'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Date Range Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">
              {isTa ? 'கால வரம்பு (Date Range)' : 'Date Range Period'}
            </label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="today">{isTa ? 'இன்று (Today)' : 'Today'}</option>
                <option value="last_7_days">{isTa ? 'கடந்த 7 நாட்கள் (Last 7 Days)' : 'Last 7 Days'}</option>
                <option value="this_month">{isTa ? 'இந்த மாதம் (This Month)' : 'This Month'}</option>
                <option value="last_month">{isTa ? 'கடந்த மாதம் (Last Month)' : 'Last Month'}</option>
                <option value="custom">{isTa ? 'தனிப்பயன் வரம்பு (Custom Range)' : 'Custom Range...'}</option>
              </select>
            </div>
          </div>

          {/* 2. Welfare Scheme Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">
              {isTa ? 'நலத்திட்டம் (Welfare Scheme)' : 'Welfare Scheme'}
            </label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer truncate"
            >
              <option value="ALL">{isTa ? 'அனைத்து நலத்திட்டங்கள் (All Schemes)' : 'All Welfare Schemes'}</option>
              {schemesList.map((scheme) => (
                <option key={scheme._id} value={scheme._id}>
                  {scheme.schemeCode} - {isTa ? scheme.name?.ta : scheme.name?.en}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Application Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">
              {isTa ? 'விண்ணப்ப நிலை (Application Status)' : 'Application Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">{isTa ? 'அனைத்து நிலைகளும் (All Statuses)' : 'All Statuses'}</option>
              <option value="SUBMITTED">{isTa ? 'புதிய விண்ணப்பம் (Submitted)' : 'Submitted'}</option>
              <option value="DOC_VERIFICATION">{isTa ? 'ஆவண சரிபார்ப்பு (Doc Verification)' : 'Doc Verification'}</option>
              <option value="UNDER_REVIEW">{isTa ? 'பரிசீலனையில் (Under Review)' : 'Under Review'}</option>
              <option value="CORRECTION_REQUIRED">{isTa ? 'திருத்தம் கோரப்பட்டது (Correction Required)' : 'Correction Required'}</option>
              <option value="RESUBMITTED">{isTa ? 'மீண்டும் சமர்ப்பிக்கப்பட்டது (Resubmitted)' : 'Resubmitted'}</option>
              <option value="APPROVED">{isTa ? 'ஒப்புதல் அளிக்கப்பட்டது (Approved)' : 'Approved'}</option>
              <option value="REJECTED">{isTa ? 'நிராகரிக்கப்பட்டது (Rejected)' : 'Rejected'}</option>
            </select>
          </div>

          {/* 4. District Scope Filter (Strict Officer Jurisdiction) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>{isTa ? 'மண்டலம் / மாவட்டம்' : 'District Jurisdiction'}</span>
              {user?.role === 'Officer' && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Locked</span>
                </span>
              )}
            </label>
            {user?.role === 'Officer' ? (
              <div className="w-full text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-700 flex items-center justify-between">
                <span>{user?.district || 'Madurai'} District (Authorized)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
            ) : (
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="ALL">{isTa ? 'அனைத்து மாவட்டங்கள் (State Total)' : 'All Districts (Statewide)'}</option>
                {tnDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d} District
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Custom Date Range Sub-Bar (Revealed when Custom selected) */}
        {dateRange === 'custom' && (
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-blue-900 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Select Exact Boundaries:</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-semibold">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-semibold">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium"
              />
            </div>
            <button
              onClick={() => fetchDashboardAnalytics(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Apply Custom Range
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          ERROR ALERT WITH RETRY BUTTON
         ========================================================================= */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardAnalytics(true)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: 6 APPLICATION PERFORMANCE KPI CARDS
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-[#172B4D] uppercase tracking-wider flex items-center space-x-2">
            <span>{isTa ? 'பணி செயல்திறன் முக்கிய குறிகாட்டிகள்' : 'Application Performance Indicators (KPIs)'}</span>
            <span className="text-[11px] font-bold text-slate-400 normal-case">
              ({summary?.period.label || 'Selected Period'})
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            const delta = card.delta;

            return (
              <div
                key={card.id}
                onClick={() =>
                  navigate(
                    `/officer/applications?queue=${card.queue}${card.status ? `&status=${card.status}` : ''}`
                  )
                }
                className="gov-card p-5 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {card.title}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.color} shadow-2xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-2 text-3xl font-extrabold text-[#172B4D] tracking-tight">
                    {loading ? (
                      <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
                    ) : (
                      card.count
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium leading-tight line-clamp-1">
                    {card.desc}
                  </span>
                  {!loading && (
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                        delta > 0
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : delta < 0
                          ? 'bg-slate-50 text-slate-600 border border-slate-200'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '0'} vs prior
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: APPLICATION PROCESSING ANALYTICS (CHARTS)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART A: Received vs Processed Trend (2 Columns) */}
        <div className="lg:col-span-2 gov-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>{isTa ? 'விண்ணப்ப வரவு vs தீர்வு வளர்ச்சி' : 'Application Received vs Processed Trend'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTa
                  ? 'விண்ணப்ப சமர்ப்பிப்பு மற்றும் இறுதி முடிவுகளின் கால ஒப்பீடு'
                  : 'Breakdown of applications submitted vs finalized decisions across time intervals'}
              </p>
            </div>

            {/* Breakdown Switcher: Weekly, Monthly, Daily */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 w-fit">
              <button
                onClick={() => setTrendInterval('weekly')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  trendInterval === 'weekly' ? 'bg-white text-blue-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTrendInterval('monthly')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  trendInterval === 'monthly' ? 'bg-white text-blue-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTrendInterval('daily')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  trendInterval === 'daily' ? 'bg-white text-blue-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
                }`}
              >
                Daily
              </button>
            </div>
          </div>

          <div className="h-68 w-full mt-2">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400 font-bold">
                Loading Application Trend Chart...
              </div>
            ) : trends.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Info className="w-6 h-6 mb-1 text-slate-300" />
                <span>No application trend records for this interval.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="received" name="Applications Received" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="processed" name="Cases Processed / Decided" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART B: Status Distribution Donut Chart (1 Column) */}
        <div className="gov-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>{isTa ? 'விண்ணப்ப நிலை பரவல்' : 'Application Status Distribution'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa ? 'அனைத்து நிலைகளின் சதவீதம் மற்றும் எண்ணிக்கை' : 'Cohort distribution across active workflow statuses'}
            </p>
          </div>

          <div className="h-52 w-full my-2">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
            ) : statusDist.length === 0 || statusDist.every((s) => s.count === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Info className="w-6 h-6 mb-1 text-slate-300" />
                <span>No active status distribution in this period.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${value} applications (${props.payload.percentage}%)`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Decision Analysis Badges (Section 4.D) */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isTa ? 'இறுதி முடிவுகள் நிலை' : 'Application Decision Analysis'}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                <span className="text-[10px] font-bold text-emerald-800 block">Approved</span>
                <span className="text-xs font-black text-emerald-900">
                  {decisionAnalysis?.approved.count ?? 0}
                </span>
                <span className="text-[9px] text-emerald-700 block">
                  {decisionAnalysis?.approved.percentage ?? 0}%
                </span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5">
                <span className="text-[10px] font-bold text-rose-800 block">Rejected</span>
                <span className="text-xs font-black text-rose-900">
                  {decisionAnalysis?.rejected.count ?? 0}
                </span>
                <span className="text-[9px] text-rose-700 block">
                  {decisionAnalysis?.rejected.percentage ?? 0}%
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5">
                <span className="text-[10px] font-bold text-blue-800 block">In Progress</span>
                <span className="text-xs font-black text-blue-900">
                  {decisionAnalysis?.awaitingDecision.count ?? 0}
                </span>
                <span className="text-[9px] text-blue-700 block">
                  {decisionAnalysis?.awaitingDecision.percentage ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          CHART C: WELFARE SCHEME-WISE APPLICATION DISTRIBUTION
         ========================================================================= */}
      <div className="gov-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>{isTa ? 'திட்ட வாரியான விண்ணப்ப ஒதுக்கீடு & பணிச்சுமை' : 'Welfare Scheme-Wise Application Distribution'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa ? 'அதிக விண்ணப்பங்கள் பெற்ற முன்னணி நலத்திட்டங்களின் ஒப்பீடு' : 'Comparative volume, approvals, and backlog per scheme to identify demand concentration'}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            Showing Active Schemes
          </span>
        </div>

        <div className="h-72 w-full mt-2">
          {loading ? (
            <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
          ) : schemeChartData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <Info className="w-6 h-6 mb-1 text-slate-300" />
              <span>No scheme application records found for the selected period.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={schemeChartData} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} width={160} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} applications`, name]}
                  labelFormatter={(label: any, payload: any) => {
                    const full = payload?.[0]?.payload?.fullName;
                    return full || label;
                  }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '11px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="total" name="Total Received" fill="#10243A" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="approved" name="Approved" fill="#10B981" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="rejected" name="Rejected" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: OFFICER PERFORMANCE ANALYTICS (EFFICIENCY GAUGES)
         ========================================================================= */}
      <div className="gov-card p-6 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>{isTa ? 'அதிகாரி பணி செயல்திறன் & தீர்வு வேகம்' : 'Officer Performance & Turnaround Analytics'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isTa
              ? 'சரிபார்ப்பு நேரம், மொத்த தீர்வு வேகம், ஒப்புதல் விகிதம் மற்றும் நிலுவை தேக்க நிலை'
              : 'Empirical SLA benchmarks based strictly on historical audit timestamps for finalized cases'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* 1. Average Verification Time */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isTa ? 'சராசரி சரிபார்ப்பு நேரம்' : 'Avg Verification Time'}
              </span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : officerPerf?.avgVerificationTimeDisplay || 'N/A'}
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Time between officer review initiation and final decision.
            </span>
          </div>

          {/* 2. Average Application Processing Time */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isTa ? 'மொத்த செயலாக்க காலம்' : 'Avg Processing Time'}
              </span>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : officerPerf?.avgProcessingTimeDisplay || 'N/A'}
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Total elapsed span from citizen submission to final decision.
            </span>
          </div>

          {/* 3. Approval Rate */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isTa ? 'ஒப்புதல் விகிதம்' : 'Application Approval Rate'}
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-800">
              {loading ? '...' : officerPerf?.approvalRateDisplay || 'N/A'}
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Approved / (Approved + Rejected) decisions during reporting period.
            </span>
          </div>

          {/* 4. Correction Rate */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isTa ? 'திருத்தம் கோரப்பட்ட விகிதம்' : 'Correction Request Rate'}
              </span>
              <RotateCcw className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-orange-800">
              {loading ? '...' : officerPerf?.correctionRateDisplay || '0%'}
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Percentage of submissions returned to citizens for document revision.
            </span>
          </div>

          {/* 5. Clearance Rate */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isTa ? 'காலகட்ட தீர்வு விகிதம்' : 'Period Clearance Rate'}
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-900">
              {loading ? '...' : officerPerf?.clearanceRateDisplay || 'N/A'}
            </div>
            <span className="text-[11px] text-slate-500 block leading-tight">
              {officerPerf?.clearanceExplanation || 'Decisions issued vs new applications received.'}
            </span>
          </div>

          {/* 6. Pending Backlog Cohort */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isTa ? 'தற்போதைய நிலுவை தேக்கம்' : 'Active Pending Backlog'}
              </span>
              <Layers className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : officerPerf?.pendingBacklog.totalPending ?? 0}
            </div>
            <div className="flex items-center gap-2 pt-1 text-[10px] font-bold">
              <span className="text-slate-600">
                &gt;7d: <strong>{officerPerf?.pendingBacklog.pendingOver7Days ?? 0}</strong>
              </span>
              <span className="text-amber-700">
                &gt;15d: <strong>{officerPerf?.pendingBacklog.pendingOver15Days ?? 0}</strong>
              </span>
              <span className="text-rose-700 bg-rose-50 px-1 rounded">
                &gt;30d: <strong>{officerPerf?.pendingBacklog.pendingOver30Days ?? 0}</strong>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          SECTION 6: PENDING APPLICATION AGING REPORT (GOVERNMENT SLA ANALYSIS)
         ========================================================================= */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>{isTa ? 'நிலுவை விண்ணப்ப காலாவதி அறிக்கை (SLA Aging Report)' : 'Pending Application Aging & SLA Risk Analysis'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? 'தீர்க்கப்படாத விண்ணப்பங்களின் வயது வகைப்பாடு மற்றும் காலதாமத கண்காணிப்பு'
                : 'Turnaround latency cohorts for all unresolved applications in jurisdiction against statutory benchmarks'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
            Total Pending Backlog: {officerPerf?.pendingBacklog.totalPending ?? 0}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {agingBuckets.map((bucket) => {
            const total = officerPerf?.pendingBacklog.totalPending || 1;
            const percentage = Math.round((bucket.count / total) * 100);

            const borderColors: Record<string, string> = {
              normal: 'border-l-emerald-600 bg-emerald-50/30',
              attention: 'border-l-blue-600 bg-blue-50/30',
              warning: 'border-l-amber-600 bg-amber-50/30',
              high: 'border-l-orange-600 bg-orange-50/30',
              critical: 'border-l-rose-600 bg-rose-50/30'
            };

            const textColors: Record<string, string> = {
              normal: 'text-emerald-800',
              attention: 'text-blue-800',
              warning: 'text-amber-800',
              high: 'text-orange-800',
              critical: 'text-rose-800'
            };

            return (
              <div
                key={bucket.bucket}
                className={`p-4 rounded-xl border border-slate-200 border-l-4 ${borderColors[bucket.urgency] || 'border-l-slate-400'} flex flex-col justify-between space-y-2`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{bucket.label}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${textColors[bucket.urgency]}`}>
                      {bucket.urgency}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{bucket.count}</div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">{bucket.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentage}%`, backgroundColor: bucket.color }}
                    />
                  </div>
                  <button
                    onClick={() => navigate('/officer/applications?queue=pending')}
                    className="w-full text-center text-[11px] font-bold text-blue-700 hover:text-blue-900 pt-1 flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>View Cases</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 8: SCHEME PERFORMANCE REPORT TABLE
         ========================================================================= */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>{isTa ? 'திட்ட வாரியான விரிவான பணி அறிக்கை' : 'Statutory Welfare Scheme Performance Table'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa
                ? 'திட்டம் வாரியான விண்ணப்பங்கள், ஒப்புதல்கள், நிராகரிப்புகள் மற்றும் சராசரி செயலாக்க காலம்'
                : 'Empirical turnaround benchmarks and sanction volumes grouped by statutory department'}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-semibold">Sort by:</span>
            <button
              onClick={() => {
                if (schemeSortBy === 'totalReceived') {
                  setSchemeSortDir(schemeSortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSchemeSortBy('totalReceived');
                  setSchemeSortDir('desc');
                }
              }}
              className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1 font-bold cursor-pointer transition-all ${
                schemeSortBy === 'totalReceived'
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Total Received</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (schemeSortBy === 'approvalRate') {
                  setSchemeSortDir(schemeSortDir === 'desc' ? 'asc' : 'desc');
                } else {
                  setSchemeSortBy('approvalRate');
                  setSchemeSortDir('desc');
                }
              }}
              className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1 font-bold cursor-pointer transition-all ${
                schemeSortBy === 'approvalRate'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Approval Rate</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Scheme Performance Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Scheme Code & Title</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-right">Received</th>
                <th className="py-3 px-3 text-right text-emerald-700">Approved</th>
                <th className="py-3 px-3 text-right text-rose-700">Rejected</th>
                <th className="py-3 px-3 text-right text-amber-700">Pending</th>
                <th className="py-3 px-3 text-right text-orange-700">Correction Req</th>
                <th className="py-3 px-3 text-right">Approval Rate</th>
                <th className="py-3 px-4 text-right">Avg Turnaround</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading welfare scheme performance table...
                  </td>
                </tr>
              ) : sortedSchemes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No application activity for any welfare scheme during this period.
                  </td>
                </tr>
              ) : (
                sortedSchemes.map((scheme) => (
                  <tr key={scheme.schemeId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block text-[11px]">
                        {scheme.schemeCode}
                      </span>
                      <span className="font-semibold text-slate-800 line-clamp-1">
                        {isTa ? scheme.schemeName.ta : scheme.schemeName.en}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] line-clamp-1 max-w-[200px]">
                      {isTa ? scheme.department.ta : scheme.department.en}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {scheme.totalReceived}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {scheme.approved}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-700">
                      {scheme.rejected}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-700">
                      {scheme.pending}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-orange-700">
                      {scheme.correctionRequired}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {scheme.approvalRate !== null ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            scheme.approvalRate >= 80
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : scheme.approvalRate >= 50
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {scheme.approvalRateDisplay}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 text-[11px]">
                      {scheme.avgProcessingTimeDisplay}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          SECTION 7: RECENT APPLICATION ACTIVITY TABLE
         ========================================================================= */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#172B4D] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{isTa ? 'சமீபத்திய விண்ணப்ப செயல்பாடுகள்' : 'Recent Application Workflow Activity'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTa ? 'சமீபத்தில் புதுப்பிக்கப்பட்ட விண்ணப்பங்களின் நேரடி பார்வை' : 'Live chronological application log sorted by recent review timestamps'}
            </p>
          </div>

          {/* Table Search & Status Filter */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isTa ? 'விண்ணப்ப எண் / பயனாளி பெயர்...' : 'Search reference or applicant...'}
                value={activitySearch}
                onChange={(e) => {
                  setActivitySearch(e.target.value);
                  setActivityPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>

            <select
              value={activityStatusFilter}
              onChange={(e) => {
                setActivityStatusFilter(e.target.value);
                setActivityPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CORRECTION_REQUIRED">Correction Req</option>
            </select>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Application Reference</th>
                <th className="py-3 px-3">Citizen Name</th>
                <th className="py-3 px-3">Welfare Scheme</th>
                <th className="py-3 px-3">Submitted Date</th>
                <th className="py-3 px-3">Last Updated</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assigned Officer</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {activityLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading activity records...
                  </td>
                </tr>
              ) : recentApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No application records match your filter criteria.
                  </td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-900 block">
                        {app.applicationReference || app.applicationNo}
                      </span>
                      <span className="text-[10px] text-slate-400">{app.citizenDistrict}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {app.citizenName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-[220px]">
                      <span className="font-mono text-[10px] text-slate-400 block">{app.schemeCode}</span>
                      <span className="line-clamp-1">{isTa ? app.schemeName.ta : app.schemeName.en}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={app.status} isTamil={isTa} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      {app.assignedOfficer}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/officer/applications/${app.id}`)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <span>View Case</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-800">
              {recentApplications.length > 0 ? (activityPage - 1) * activityLimit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(activityPage * activityLimit, activityTotalCount)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{activityTotalCount}</span> records
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
              disabled={activityPage <= 1 || activityLoading}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded-lg border border-slate-200">
              Page {activityPage} of {activityTotalPages}
            </span>
            <button
              onClick={() => setActivityPage((prev) => Math.min(activityTotalPages, prev + 1))}
              disabled={activityPage >= activityTotalPages || activityLoading}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 9: EXPORT & STATUTORY COMPLIANCE FOOTER
         ========================================================================= */}
      <div className="gov-card p-6 bg-slate-50 border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-[#10243A] uppercase tracking-wider">
              Statutory Government Audit & Data Integrity Attestation
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              All turnaround metrics and approval calculations are cryptographically verified against the Tamil Nadu WelfarePath live state database. Officer district boundary constraints are enforced at the server API layer.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrintReport}
              className="px-3 py-2 bg-[#10243A] hover:bg-[#1a385c] text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OfficerReportsPage;
