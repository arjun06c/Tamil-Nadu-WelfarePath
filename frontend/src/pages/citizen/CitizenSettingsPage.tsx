import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, Settings, User } from 'lucide-react';

export const CitizenSettingsPage: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'கணக்கு அமைப்புகள் (Settings)' : 'Account & Language Settings'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'உங்கள் கணக்கு விருப்பங்கள் மற்றும் மொழித் தேர்வு' : 'Manage interface language preferences and security options'}
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-6">
        
        {/* Language Option */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{isTa ? 'தளத்தின் மொழி (Interface Language)' : 'Preferred Interface Language'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTa ? 'முழு தளத்தையும் ஆங்கிலம் அல்லது தமிழில் மாற்றுக' : 'Switch entire interface labels, tables, and assistant between English & Tamil'}
            </p>
          </div>

          <button
            onClick={() => toggleLanguage()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-colors"
          >
            {lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}
          </button>
        </div>

        {/* User Account Info */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-3">
            <User className="w-4 h-4 text-blue-900" />
            <span>{isTa ? 'கணக்கு விவரங்கள்' : 'Account Identity'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block">Name:</span>
              <span className="font-bold text-slate-900">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Email:</span>
              <span className="font-bold text-slate-900">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Mobile:</span>
              <span className="font-bold text-slate-900">{user?.mobile}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Role:</span>
              <span className="font-bold text-blue-900">{user?.role}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
