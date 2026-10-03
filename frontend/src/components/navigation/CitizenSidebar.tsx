import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Search,
  ShieldCheck,
  FolderKanban,
  FileCheck,
  Award,
  Scan,
  Bot,
  Bookmark,
  Bell,
  HelpCircle,
  LogOut
} from 'lucide-react';

export const CitizenSidebar: React.FC = () => {
  const { user, lang, logout } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const menu = [
    { path: '/citizen/dashboard', labelEn: 'Dashboard', labelTa: 'டாஷ்போர்டு', icon: LayoutDashboard },
    { path: '/citizen/profile', labelEn: 'My Profile', labelTa: 'என் சுயவிவரம்', icon: User },
    { path: '/citizen/schemes', labelEn: 'Discover Schemes', labelTa: 'நலத்திட்டங்கள்', icon: Search },
    { path: '/citizen/portfolio', labelEn: 'Welfare Portfolio', labelTa: 'என் நலன்பாதை', icon: FolderKanban },
    { path: '/citizen/applications', labelEn: 'My Applications', labelTa: 'என் விண்ணப்பங்கள்', icon: FileCheck },
    { path: '/citizen/benefits', labelEn: 'Approved Benefits', labelTa: 'பெறப்பட்ட உதவிகள்', icon: Award },
    { path: '/citizen/documents', labelEn: 'Document Center', labelTa: 'ஆவண மையம்', icon: Scan },
    { path: '/citizen/settings/digilocker', labelEn: 'DigiLocker Integration', labelTa: 'டிஜிலாக்கர் இணைப்பு', icon: ShieldCheck },
    { path: '/citizen/assistant', labelEn: 'Welfare Assistant', labelTa: 'நல உதவியாளன்', icon: Bot },
    { path: '/citizen/saved-schemes', labelEn: 'Saved Schemes', labelTa: 'சேமித்த திட்டங்கள்', icon: Bookmark },
    { path: '/citizen/notifications', labelEn: 'Notifications', labelTa: 'அறிவிப்புகள்', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800 shrink-0">
      <div>
        
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center font-black shadow-md">
            TN
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {isTa ? 'தமிழ்நாடு நலன்பாதை' : 'TN WelfarePath'}
            </h2>
            <span className="text-[10px] font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
              CITIZEN WORKSPACE
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const label = isTa ? item.labelTa : item.labelEn;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

      </div>

      {/* Footer User Info */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-950 text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-800">
              {user?.name?.[0] || 'C'}
            </div>
            <div>
              <div className="text-xs font-bold text-white max-w-[110px] truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500">Citizen Account</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
