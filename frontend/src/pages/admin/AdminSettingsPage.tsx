import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, ShieldCheck } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'நிர்வாக அமைப்புகள் (System Settings)' : 'Enterprise System & Security Settings'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'அமைப்பின் பாதுகாப்பு, விதிகளின் பதிப்பு மற்றும் மொழிக் கட்டுப்பாடுகள்' : 'Manage platform security parameters, rule version thresholds, and system preferences'}
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="font-bold text-slate-900">System Environment</span>
          <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">PRODUCTION_STAGING</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="font-bold text-slate-900">Deterministic Match Threshold</span>
          <span className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-bold">0.85 (85% Similarity)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">Interface Language Toggle</span>
          <button onClick={() => toggleLanguage()} className="px-3 py-1 bg-slate-100 font-bold rounded">
            {lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}
          </button>
        </div>
      </div>
    </div>
  );
};
