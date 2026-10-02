import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, Users, ShieldAlert, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminAnalyticsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  const [loading, setLoading] = useState(false);

  const applicationTrends = [
    { month: 'Jan', submitted: 120, approved: 95 },
    { month: 'Feb', submitted: 210, approved: 180 },
    { month: 'Mar', submitted: 340, approved: 290 },
    { month: 'Apr', submitted: 480, approved: 410 },
    { month: 'May', submitted: 620, approved: 540 },
    { month: 'Jun', submitted: 890, approved: 760 }
  ];

  const domainDistribution = [
    { name: 'Women Empowerment', value: 35, color: '#0284c7' },
    { name: 'Higher Education', value: 25, color: '#0d9488' },
    { name: 'Differently Abled', value: 20, color: '#8b5cf6' },
    { name: 'Social Welfare', value: 20, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full w-fit mb-1">
          <BarChart3 className="w-4 h-4 text-indigo-700" />
          <span>{isTa ? 'அமைப்பின் புள்ளிவிவரங்கள் & அணுகல் பகுப்பாய்வு' : 'Platform Analytics & Access Gap Intelligence'}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'நலத்திட்ட புள்ளிவிவரங்கள்' : 'Welfare Analytics & Access Gap Intelligence'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'தமிழ்நாடு மாவட்ட வாரியான திட்டங்கள் வரவேற்பு மற்றும் அணுகல் பகுப்பாய்வு' : 'District-wise application trends, scheme distribution, and underserved demographic gaps'}
        </p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-slate-400 text-xs font-semibold block">{isTa ? 'மொத்த விண்ணப்பங்கள்' : 'Total Applications'}</span>
          <div className="text-2xl font-black text-slate-900">2,660</div>
          <span className="text-[10px] text-emerald-700 font-bold flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +18.4% this month
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-slate-400 text-xs font-semibold block">{isTa ? 'ஒப்புதல் விகிதம்' : 'Approval Success Rate'}</span>
          <div className="text-2xl font-black text-emerald-800">85.4%</div>
          <span className="text-[10px] text-slate-500 font-semibold">2,275 Benefits Issued</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-slate-400 text-xs font-semibold block">{isTa ? 'சராசரி செயலாக்க காலம்' : 'Avg Turnaround Time'}</span>
          <div className="text-2xl font-black text-blue-900">2.4 Days</div>
          <span className="text-[10px] text-emerald-700 font-bold">Fastest in Chennai Region</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-slate-400 text-xs font-semibold block">{isTa ? 'OCR வெற்றி விகிதம்' : 'OCR Match Accuracy'}</span>
          <div className="text-2xl font-black text-purple-900">92.1%</div>
          <span className="text-[10px] text-slate-500 font-semibold">Tesseract.js Automated</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Application Volume Trends (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-900" />
            <span>{isTa ? 'மாதாந்திர விண்ணப்ப வளர்ச்சி' : 'Monthly Application Growth & Approvals'}</span>
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationTrends}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="submitted" stroke="#1e3a8a" fillOpacity={1} fill="url(#colorSub)" name="Submitted" />
                <Area type="monotone" dataKey="approved" stroke="#059669" fillOpacity={1} fill="url(#colorApp)" name="Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Domain Share (1 Col) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>{isTa ? 'நலப் பிரிவு விநியோகம்' : 'Welfare Domain Share'}</span>
          </h3>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={domainDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {domainDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {domainDistribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-700 font-semibold">{d.name}</span>
                </span>
                <span className="font-bold text-slate-900">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
