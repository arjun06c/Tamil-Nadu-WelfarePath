import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, Bell, Shield } from 'lucide-react';

export const OfficerHeader: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <header className="h-16 bg-white border-b border-purple-100 px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      
      <div>
        <h1 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-purple-700" />
          <span>{isTa ? 'மாவட்ட நலத்துறை அதிகாரி பணிமனை' : 'District Case Management & Verification Console'}</span>
        </h1>
        <p className="text-[11px] text-slate-500 font-medium">
          {isTa ? `மாவட்ட பணி எல்லை: ${user?.district || 'Tamil Nadu'}` : `Department Jurisdiction: ${user?.district || 'Tamil Nadu'} District`}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-900 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-purple-700" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-950 text-xs font-bold border border-purple-300">
          <span>{user?.name}</span>
          <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-mono">OFFICER</span>
        </div>
      </div>

    </header>
  );
};
