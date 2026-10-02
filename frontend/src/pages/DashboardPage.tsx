import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SchemeCard } from '../components/SchemeCard';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Award,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const [activeTab, setActiveTab] = useState<'eligible' | 'nearEligible' | 'applications' | 'benefits'>('eligible');
  const [data, setData] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [evalRes, portRes] = await Promise.all([
        api.get('/schemes/evaluate-all'),
        api.get('/applications/my-portfolio')
      ]);
      setData(evalRes.data);
      setPortfolio(portRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReevaluate = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Evaluating your welfare portfolio...</div>;

  const eligibleSchemes = data?.eligibleSchemes || [];
  const nearEligibleSchemes = data?.nearEligibleSchemes || [];
  const applications = portfolio?.applications || [];
  const benefits = portfolio?.activeBenefits || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <button
          onClick={handleReevaluate}
          disabled={refreshing}
          className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-2 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{t('dashboard.reevaluateBtn')}</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* KPI 1: Eligible */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{eligibleSchemes.length}</div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">{t('dashboard.kpiEligible')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Near Eligible */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{nearEligibleSchemes.length}</div>
            <div className="text-xs font-semibold text-amber-800 mt-0.5">{t('dashboard.kpiNearEligible')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Applications */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-900 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{applications.length}</div>
            <div className="text-xs font-semibold text-blue-900 mt-0.5">{t('dashboard.kpiApplications')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Active Benefits */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-600 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{benefits.length}</div>
            <div className="text-xs font-semibold text-teal-800 mt-0.5">{t('dashboard.kpiBenefits')}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('eligible')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'eligible'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('dashboard.eligibleTab')} ({eligibleSchemes.length})
        </button>

        <button
          onClick={() => setActiveTab('nearEligible')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'nearEligible'
              ? 'border-amber-500 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('dashboard.nearEligibleTab')} ({nearEligibleSchemes.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'applications'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('dashboard.applicationsTab')} ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab('benefits')}
          className={`pb-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'benefits'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('dashboard.benefitsTab')} ({benefits.length})
        </button>
      </div>

      {/* Tab 1: Eligible */}
      {activeTab === 'eligible' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eligibleSchemes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-xs">
              {isTa ? 'தற்போது முழு தகுதியுள்ள திட்டங்கள் இல்லை.' : 'No fully eligible schemes match your current profile.'}
            </div>
          ) : (
            eligibleSchemes.map((item: any) => (
              <SchemeCard key={item.scheme._id} scheme={item.scheme} status="ELIGIBLE" />
            ))
          )}
        </div>
      )}

      {/* Tab 2: Near Eligible */}
      {activeTab === 'nearEligible' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearEligibleSchemes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-xs">
              {isTa ? 'விடுபட்ட சான்றிதழ் திட்டங்கள் எதுவுமில்லை.' : 'No near-eligible schemes found.'}
            </div>
          ) : (
            nearEligibleSchemes.map((item: any) => (
              <SchemeCard
                key={item.scheme._id}
                scheme={item.scheme}
                status="NEAR_ELIGIBLE"
                missingDocsCount={item.missingDocumentsCount}
                gapRemarks={item.gapAnalysisRemarks}
              />
            ))
          )}
        </div>
      )}

      {/* Tab 3: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="glass-card text-center py-12 px-4 rounded-2xl">
              <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">{isTa ? 'விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No applications submitted yet.'}</p>
            </div>
          ) : (
            applications.map((app: any) => (
              <div key={app._id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                      {app.applicationNo}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isTa ? app.schemeId?.name?.ta : app.schemeId?.name?.en}
                  </h3>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                    {app.status}
                  </span>
                  <Link
                    to={`/applications/${app._id}`}
                    className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                  >
                    <span>{isTa ? 'கண்காணிக்க' : 'Track Status'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Benefits */}
      {activeTab === 'benefits' && (
        <div className="space-y-4">
          {benefits.length === 0 ? (
            <div className="glass-card text-center py-12 px-4 rounded-2xl">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">{isTa ? 'பெறப்பட்ட அரசு உதவிகள் இல்லை.' : 'No active approved benefits recorded yet.'}</p>
            </div>
          ) : (
            benefits.map((b: any) => (
              <div key={b._id} className="glass-card p-5 rounded-2xl bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                    {b.benefitReferenceNo}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {isTa ? b.schemeId?.name?.ta : b.schemeId?.name?.en}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Disbursement: <span className="font-bold text-emerald-800">₹{b.disbursementAmount} / {b.disbursementFrequency}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block mb-1">
                    ACTIVE BENEFIT
                  </span>
                  {b.nextRenewalDate && (
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Renewal Due: {new Date(b.nextRenewalDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
