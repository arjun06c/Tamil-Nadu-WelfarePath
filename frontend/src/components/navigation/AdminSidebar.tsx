import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Activity,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { user, lang, logout } = useAuth();
  const { t } = useTranslation();
  const isTa = lang === 'ta';
  const location = useLocation();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  }, [location.pathname]);

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
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen h-[100dvh] flex flex-col justify-between bg-slate-950 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none overflow-hidden ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isMobileOpen
            ? 'w-72 translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'} overflow-hidden`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-black shadow-md shrink-0 border border-amber-600/30">
                <ShieldCheck className="w-5 h-5 text-amber-100" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <div className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                    {isTa ? 'நிர்வாக மையம்' : 'Admin Control Center'}
                  </div>
                  <div className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 uppercase tracking-wider inline-block mt-0.5">
                    <span>ENTERPRISE SAAS</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Console Badge (only when expanded) */}
          {!isCollapsed && (
            <div className="px-4 py-2 mx-3 mt-3 rounded-lg bg-amber-950/30 border border-amber-900/50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Admin Center
              </span>
              <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Super Admin</span>
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu (13 Items with Independent Vertical Internal Scrolling) */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-1 p-3 mt-1 sidebar-scroll">
          {menu.map((item) => {
            const Icon = item.icon;
            const label = isTa ? item.labelTa : item.labelEn;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-3.5'} py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-amber-950 text-amber-200 shadow-sm font-bold border border-amber-800/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-amber-500/80 transition-transform group-hover:scale-105" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer User Info & Desktop Collapse Toggle */}
        <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-950/80">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-800">
                  A
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-xs font-bold text-white truncate leading-tight">{user?.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">System Admin</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors shrink-0 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div
                className="w-8 h-8 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-800"
                title={user?.name}
              >
                A
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Desktop Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-full mt-2 py-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
