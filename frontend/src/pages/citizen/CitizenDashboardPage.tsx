import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileCheck,
  Award,
  ArrowRight,
  Bot,
  Scan,
  RefreshCw
} from 'lucide-react';

export const CitizenDashboardPage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const [data, setData] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading citizen dashboard...</div>;

  const eligibleSchemes = data?.eligibleSchemes || [];
  const nearEligibleSchemes = data?.nearEligibleSchemes || [];
  const applications = portfolio?.applications || [];
  const benefits = portfolio?.activeBenefits || [];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="glass-card p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs text-teal-300 font-bold mb-1">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>{isTa ? 'வணக்கம், ' + user?.name : 'Welcome back, ' + user?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isTa ? 'உங்கள் தனிப்பட்ட நலன்பாதை போர்ட்டல்' : 'Your Personal Citizen Welfare Workspace'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isTa
              ? 'உங்கள் தகுதியான அரசு உதவித்தொகைகள், விடுபட்ட சான்றிதழ் விவரங்கள் மற்றும் விண்ணப்ப நிலை.'
              : 'Discover matching state benefits, resolve document gaps, and track your active benefit lifecycle.'}
          </p>
        </div>

        <Link
          to="/citizen/profile"
          className="px-5 py-3 bg-white text-blue-950 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
        >
          {isTa ? 'சுயவிவரத்தை புதுப்பிக்க' : 'Complete Profile (85%)'}
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{eligibleSchemes.length}</div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">{isTa ? 'முழு தகுதியான திட்டங்கள்' : 'Eligible Schemes'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{nearEligibleSchemes.length}</div>
            <div className="text-xs font-semibold text-amber-800 mt-0.5">{isTa ? 'சான்றிதழ் தேவைப்படுபவை' : 'Near Eligible (Gap)'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-900 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{applications.length}</div>
            <div className="text-xs font-semibold text-blue-900 mt-0.5">{isTa ? 'விண்ணப்பங்கள்' : 'Active Applications'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-600 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{benefits.length}</div>
            <div className="text-xs font-semibold text-teal-800 mt-0.5">{isTa ? 'அரசு உதவிகள்' : 'Approved Benefits'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Quick Action Hub */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          {isTa ? 'விரைவு நடவடிக்கைகள் (Quick Actions)' : 'Quick Citizen Actions'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/citizen/schemes"
            className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-center transition-colors group"
          >
            <FolderKanban className="w-6 h-6 text-blue-900 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-800">{isTa ? 'திட்டங்களைக் காண்க' : 'Explore Schemes'}</div>
          </Link>

          <Link
            to="/citizen/documents"
            className="p-4 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-xl text-center transition-colors group"
          >
            <Scan className="w-6 h-6 text-teal-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-800">{isTa ? 'OCR ஆவண மையம்' : 'OCR Doc Scanner'}</div>
          </Link>

          <Link
            to="/citizen/portfolio"
            className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl text-center transition-colors group"
          >
            <Award className="w-6 h-6 text-indigo-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-800">{isTa ? 'என் நலன்பாதை' : 'Welfare Portfolio'}</div>
          </Link>

          <Link
            to="/citizen/assistant"
            className="p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl text-center transition-colors group"
          >
            <Bot className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-800">{isTa ? 'நல உதவியாளன்' : 'Welfare Assistant'}</div>
          </Link>
        </div>
      </div>

    </div>
  );
};
