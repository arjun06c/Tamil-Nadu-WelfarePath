import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, ShieldAlert } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      
      <div>
        <h1 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <span>{isTa ? 'தமிழ்நாடு நலன்பாதை தலைமை நிர்வாகத் தளம்' : 'WelfarePath Administration Center'}</span>
        </h1>
        <p className="text-[11px] text-slate-500 font-medium">
          {isTa ? 'அரசுத் திட்டங்கள், விதிகளின் கட்டமைப்பு மற்றும் பயனர்களின் மேலாண்மை' : 'Manage welfare content, eligibility rules, officers, and platform operations'}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-amber-700" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-950 text-xs font-bold border border-amber-300">
          <span>{user?.name}</span>
          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono">SUPER ADMIN</span>
        </div>
      </div>

    </header>
  );
};
