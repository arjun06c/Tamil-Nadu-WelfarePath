import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3 } from 'lucide-react';

export const OfficerReportsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'மாவட்ட பணி அறிக்கைகள் (Department Turnaround Reports)' : 'Officer Audit Performance & Department Workload Reports'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'வாராந்திர ஆய்வுகள், ஒப்புதல் விகிதங்கள் மற்றும் பணி வேகத்தின் அறிக்கை' : 'Weekly application volume, clearance turnaround rate, and approval distribution'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-purple-600">
          <div className="text-2xl font-black text-slate-900">4.2 Hours</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Average Turnaround Time</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-600">
          <div className="text-2xl font-black text-slate-900">92%</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Application Approval Rate</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-600">
          <div className="text-2xl font-black text-slate-900">128</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Cases Cleared This Month</div>
        </div>
      </div>
    </div>
  );
};
