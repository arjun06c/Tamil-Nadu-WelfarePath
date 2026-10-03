import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Award,
  Layers,
  Sliders,
  FileSearch,
  Users,
  Building2,
  BarChart3,
  ShieldAlert,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { user, lang, logout } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';

  const menu = [
    { path: '/admin/dashboard', labelEn: 'Admin Overview', labelTa: 'நிர்வாகக் கண்ணோட்டம்', icon: LayoutDashboard },
    { path: '/admin/schemes', labelEn: 'Scheme Management', labelTa: 'திட்டங்கள் நிர்வாகம்', icon: Award },
    { path: '/admin/domains', labelEn: 'Welfare Domains', labelTa: 'நலத் துறைகள்', icon: Layers },
    { path: '/admin/rules', labelEn: 'Eligibility Rule Builder', labelTa: 'தகுதி விதிகள்', icon: Sliders },
    { path: '/admin/applications', labelEn: 'Application Monitoring', labelTa: 'விண்ணப்பக் கண்காணிப்பு', icon: FileSearch },
    { path: '/admin/users', labelEn: 'User & Officers', labelTa: 'பயனர்கள் & அதிகாரிகள்', icon: Users },
    { path: '/admin/departments', labelEn: 'Departments', labelTa: 'அரசுத் துறைகள்', icon: Building2 },
    { path: '/admin/analytics', labelEn: 'Analytics & Access Gap', labelTa: 'புள்ளிவிவரங்கள்', icon: BarChart3 },
    { path: '/admin/integrity', labelEn: 'Integrity Review', labelTa: 'போலி விண்ணப்ப ஆய்வு', icon: ShieldAlert },
    { path: '/admin/integrations/digilocker', labelEn: 'DigiLocker Integration', labelTa: 'டிஜிலாக்கர் இணைப்பு', icon: ShieldCheck },
    { path: '/admin/integrations/health', labelEn: 'Integration Health', labelTa: 'இணைப்பு ஆரோக்கியம்', icon: Activity },
    { path: '/admin/audit-logs', labelEn: 'System Audit Logs', labelTa: 'தணிக்கைப் பதிவுகள்', icon: History },
    { path: '/admin/settings', labelEn: 'System Settings', labelTa: 'அமைப்புகள்', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 min-h-screen flex flex-col justify-between p-4 border-r border-slate-800 shrink-0">
      <div>
        
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-black shadow-md">
            <ShieldCheck className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {isTa ? 'நிர்வாக மையம்' : 'Admin Control Center'}
            </h2>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              ENTERPRISE SAAS
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
                      ? 'bg-amber-950 text-amber-200 shadow-sm font-bold border border-amber-800/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-amber-500/80" />
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
            <div className="w-8 h-8 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-800">
              A
            </div>
            <div>
              <div className="text-xs font-bold text-white max-w-[110px] truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500">System Admin</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
