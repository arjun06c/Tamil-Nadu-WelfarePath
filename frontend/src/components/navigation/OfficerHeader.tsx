import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Globe, Shield, Menu } from 'lucide-react';
import { HomeNavigation } from '../common/HomeNavigation';

export interface OfficerHeaderProps {
  onOpenMobileMenu?: () => void;
}

export const OfficerHeader: React.FC<OfficerHeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, lang, toggleLanguage } = useAuth();
  const isTa = lang === 'ta';

  return (
    <header className="h-16 shrink-0 w-full bg-white border-b border-purple-100 px-4 md:px-6 flex items-center justify-between z-30 shadow-2xs">
      
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-purple-900 hover:text-purple-950 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <HomeNavigation variant="officer" />
        <div className="hidden sm:block h-6 w-px bg-purple-200 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-900 flex items-center space-x-2 truncate">
            <Shield className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="truncate">{isTa ? 'மாவட்ட நலத்துறை அதிகாரி பணிமனை' : 'District Case Management Console'}</span>
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">
            {isTa ? `மாவட்ட பணி எல்லை: ${user?.district || 'Tamil Nadu'}` : `Department Jurisdiction: ${user?.district || 'Tamil Nadu'} District`}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => toggleLanguage()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-900 transition-all cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-purple-700" />
          <span>{lang === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-100 text-purple-950 text-xs font-bold border border-purple-300">
          <span className="max-w-[120px] truncate">{user?.name}</span>
          <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-mono shrink-0">OFFICER</span>
        </div>
      </div>

    </header>
  );
};
