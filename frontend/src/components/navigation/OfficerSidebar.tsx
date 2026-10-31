import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  ListTodo,
  AlertCircle,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export interface OfficerSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const OfficerSidebar: React.FC<OfficerSidebarProps> = ({
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
    { path: '/officer/dashboard', labelEn: 'Officer Dashboard', labelTa: 'அதிகாரி டாஷ்போர்டு', icon: ShieldCheck },
    { path: '/officer/applications', labelEn: 'Application Queue', labelTa: 'விண்ணப்ப வரிசை', icon: ListTodo },
    { path: '/officer/corrections', labelEn: 'Correction Requests', labelTa: 'திருத்தக் கோரிக்கைகள்', icon: AlertCircle },
    { path: '/officer/reports', labelEn: 'Review Reports', labelTa: 'ஆய்வு அறிக்கைகள்', icon: BarChart3 },
    { path: '/officer/notifications', labelEn: 'Officer Notifications', labelTa: 'அறிவிப்புகள்', icon: Bell },
    { path: '/officer/settings', labelEn: 'Account Settings', labelTa: 'கணக்கு அமைப்புகள்', icon: Settings }
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
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen h-[100dvh] flex flex-col justify-between bg-purple-950 text-purple-200 border-r border-purple-900 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none overflow-hidden ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isMobileOpen
            ? 'w-72 translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-purple-900">
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'} overflow-hidden`}>
              <div className="w-10 h-10 rounded-xl bg-purple-800 text-white flex items-center justify-center font-black shadow-md shrink-0 border border-purple-700">
                <ShieldCheck className="w-5 h-5 text-purple-300" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <div className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                    {isTa ? 'அதிகாரி பணிப்பக்கம்' : 'Officer Workspace'}
                  </div>
                  <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1 mt-0.5">
                    <span>DISTRICT OFFICER</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-purple-300 hover:text-white rounded-lg hover:bg-purple-900 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Console Badge (only when expanded) */}
          {!isCollapsed && (
            <div className="px-4 py-2 mx-3 mt-3 rounded-lg bg-purple-900/40 border border-purple-800/80 flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Officer Console
              </span>
              <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items (Independent Vertical Internal Scrolling) */}
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
                      ? 'bg-purple-800 text-white shadow-sm font-bold border border-purple-700'
                      : 'text-purple-300 hover:text-white hover:bg-purple-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer User Info & Desktop Collapse Toggle */}
        <div className="shrink-0 p-3 border-t border-purple-900 bg-purple-950/80">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-700">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-xs font-bold text-white truncate leading-tight">{user?.name}</div>
                  <div className="text-[10px] text-purple-400 truncate">{user?.district || 'Tamil Nadu'} District</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-purple-400 hover:text-red-400 rounded-lg hover:bg-purple-900 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div
                className="w-8 h-8 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center font-bold text-xs border border-purple-700"
                title={user?.name}
              >
                <UserCheck className="w-4 h-4" />
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-purple-400 hover:text-red-400 rounded-lg hover:bg-purple-900 transition-colors"
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
              className="hidden lg:flex items-center justify-center w-full mt-2 py-1 text-purple-300 hover:text-white hover:bg-purple-900/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
