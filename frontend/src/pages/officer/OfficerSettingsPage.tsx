import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

export const OfficerSettingsPage: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'அதிகாரி கணக்கு அமைப்புகள்' : 'Officer Account & Jurisdiction Settings'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'உங்கள் மாவட்ட எல்லை மற்றும் அறிவிப்பு விருப்பங்கள்' : 'Manage district assignment notifications and language preferences'}
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="font-bold text-slate-900">Officer Jurisdiction</span>
          <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">{user?.district || 'Coimbatore'} District</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">Language Preference</span>
          <button onClick={() => toggleLanguage()} className="px-3 py-1 bg-slate-100 font-bold rounded">
            {lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}
          </button>
        </div>
      </div>
    </div>
  );
};
