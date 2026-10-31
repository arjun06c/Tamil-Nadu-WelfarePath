import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, ShieldAlert, Menu } from 'lucide-react';
import { HomeNavigation } from '../common/HomeNavigation';

export interface AdminHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <header className="h-16 shrink-0 w-full bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 shadow-2xs">
      
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <HomeNavigation variant="admin" />
        <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-900 flex items-center space-x-2 truncate">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate">{isTa ? 'தமிழ்நாடு நலன்பாதை தலைமை நிர்வாகத் தளம்' : 'WelfarePath Administration Center'}</span>
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">
            {isTa ? 'அரசுத் திட்டங்கள், விதிகளின் கட்டமைப்பு மற்றும் பயனர்களின் மேலாண்மை' : 'Manage welfare content, eligibility rules, officers, and platform operations'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-amber-700" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-950 text-xs font-bold border border-amber-300">
          <span className="max-w-[120px] truncate">{user?.name}</span>
          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono shrink-0">SUPER ADMIN</span>
        </div>
      </div>

    </header>
  );
};
