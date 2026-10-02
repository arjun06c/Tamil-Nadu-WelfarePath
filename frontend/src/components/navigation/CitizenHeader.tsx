import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CitizenHeader: React.FC = () => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      
      {/* Breadcrumb / Title */}
      <div>
        <h1 className="text-sm font-bold text-slate-900">
          {isTa ? 'குடிமகன் நலன் போர்ட்டல்' : 'Citizen Welfare Service Portal'}
        </h1>
        <p className="text-[11px] text-slate-500 font-medium">
          {isTa ? 'உங்கள் தகுதியான அரசு உதவித்தொகைகள் மற்றும் விண்ணப்பங்கள்' : 'Personalized scheme discovery & benefit lifecycle'}
        </p>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center space-x-3">
        
        {/* Language Switcher Button */}
        <button
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition-all shadow-2xs"
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        {/* Notifications Icon */}
        <Link
          to="/citizen/notifications"
          className="p-2 text-slate-600 hover:text-blue-900 rounded-xl hover:bg-slate-100 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-900"></span>
        </Link>

        {/* User Pill */}
        <Link
          to="/citizen/profile"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors border border-blue-200"
        >
          <User className="w-3.5 h-3.5" />
          <span>{user?.name}</span>
        </Link>

      </div>

    </header>
  );
};
