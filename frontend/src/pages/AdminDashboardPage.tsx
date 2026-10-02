import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldAlert, Users, Award, FileText, CheckCircle2, TrendingUp } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { lang } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xs text-slate-400">Loading system analytics...</div>;

  const metrics = analytics?.metrics || {};
  const statusBreakdown = analytics?.statusBreakdown || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit mb-1">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <span>{isTa ? 'அரசு தலைமை நிர்வாகி பக்கம்' : 'System Administration & Policy Analytics Console'}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isTa ? 'தமிழ்நாடு நலன்பாதை ஒட்டுமொத்த புள்ளிவிவரங்கள்' : 'State Welfare Access Gap & System Analytics'}
        </h1>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.totalCitizens || 0}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Registered Citizens</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.totalSchemes || 0}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Active State Schemes</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.totalApplications || 0}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Applications Logged</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-emerald-800">{metrics.approvedApplications || 0}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Approved Benefits</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Recharts Graphical Visualization */}
      <div className="glass-card p-6 rounded-2xl mb-8">
        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-900" />
          <span>Application Workflow Milestone Status Breakdown</span>
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#cbd5e1', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
