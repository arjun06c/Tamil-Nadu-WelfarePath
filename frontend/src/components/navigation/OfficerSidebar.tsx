import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  ListTodo,
  FileCheck,
  AlertCircle,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';

export const OfficerSidebar: React.FC = () => {
  const { user, lang, logout } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const menu = [
    { path: '/officer/dashboard', labelEn: 'Officer Dashboard', labelTa: 'அதிகாரி டாஷ்போர்டு', icon: ShieldCheck },
    { path: '/officer/applications', labelEn: 'Application Queue', labelTa: 'விண்ணப்ப வரிசை', icon: ListTodo },
    { path: '/officer/verification', labelEn: 'Document Verification', labelTa: 'ஆவண சரிபார்ப்பு', icon: FileCheck },
    { path: '/officer/corrections', labelEn: 'Correction Requests', labelTa: 'திருத்தக் கோரிக்கைகள்', icon: AlertCircle },
    { path: '/officer/reports', labelEn: 'Review Reports', labelTa: 'ஆய்வு அறிக்கைகள்', icon: BarChart3 },
    { path: '/officer/notifications', labelEn: 'Officer Notifications', labelTa: 'அறிவிப்புகள்', icon: Bell },
    { path: '/officer/settings', labelEn: 'Account Settings', labelTa: 'கணக்கு அமைப்புகள்', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-purple-950 text-purple-200 min-h-screen flex flex-col justify-between p-4 border-r border-purple-900 shrink-0">
      <div>
        
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-6 border-b border-purple-900">
          <div className="w-9 h-9 rounded-xl bg-purple-800 text-white flex items-center justify-center font-black shadow-md border border-purple-700">
            <ShieldCheck className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {isTa ? 'அதிகாரி பணிப்பக்கம்' : 'Officer Workspace'}
            </h2>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-900 px-2 py-0.5 rounded border border-purple-700">
              DISTRICT OFFICER
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
                      ? 'bg-purple-800 text-white shadow-sm font-bold border border-purple-700'
                      : 'text-purple-300 hover:text-white hover:bg-purple-900/60'
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
      <div className="pt-4 border-t border-purple-900">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center font-bold text-xs border border-purple-700">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white max-w-[110px] truncate">{user?.name}</div>
              <div className="text-[10px] text-purple-400">{user?.district} District</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-purple-400 hover:text-red-400 rounded-lg hover:bg-purple-900 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
