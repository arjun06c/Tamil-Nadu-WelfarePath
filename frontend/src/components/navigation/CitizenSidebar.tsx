import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  LayoutDashboard,
  BadgeCheck,
  Compass,
  FileCheck,
  Award,
  FolderLock,
  ShieldCheck,
  Bookmark,
  Bell,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink
} from 'lucide-react';

interface CitizenSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CitizenSidebar: React.FC<CitizenSidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { user, profile, lang, logout } = useAuth();
  const isTa = lang === 'ta';
  const location = useLocation();

  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [loadingBadge, setLoadingBadge] = useState<boolean>(true);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchEligibleBadgeCount();

    const handleProfileUpdated = () => {
      fetchEligibleBadgeCount();
    };

    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [profile]);

  const fetchEligibleBadgeCount = async () => {
    setLoadingBadge(true);
    try {
      const res = await api.get('/schemes/recommended');
      if (res.data?.summary) {
        setEligibleCount(res.data.summary.totalEligibleCount ?? 0);
      } else if (Array.isArray(res.data?.recommendations)) {
        setEligibleCount(res.data.recommendations.length);
      } else {
        setEligibleCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch eligible badge count:', err);
      setEligibleCount(0);
    } finally {
      setLoadingBadge(false);
    }
  };

  // Exactly 9 items as requested in Section 4. Welfare Portfolio is completely removed.
  const menu = [
    {
      path: '/citizen/dashboard',
      labelEn: 'Dashboard',
      labelTa: 'டாஷ்போர்டு',
      icon: LayoutDashboard
    },
    {
      path: '/citizen/eligible-schemes',
      labelEn: 'My Eligible Schemes',
      labelTa: 'எனக்கு தகுதியானவை',
      icon: BadgeCheck,
      hasBadge: true
    },
    {
      path: '/citizen/schemes',
      labelEn: 'Discover Schemes',
      labelTa: 'நலத்திட்டங்கள்',
      icon: Compass
    },
    {
      path: '/citizen/applications',
      labelEn: 'My Applications',
      labelTa: 'என் விண்ணப்பங்கள்',
      icon: FileCheck
    },
    {
      path: '/citizen/benefits',
      labelEn: 'Approved Benefits',
      labelTa: 'பெறப்பட்ட உதவிகள்',
      icon: Award
    },
    {
      path: '/citizen/documents',
      labelEn: 'Document Center',
      labelTa: 'ஆவண மையம்',
      icon: FolderLock
    },
    {
      path: '/citizen/settings/digilocker',
      labelEn: 'DigiLocker Integration',
      labelTa: 'டிஜிலாக்கர் இணைப்பு',
      icon: ShieldCheck
    },
    {
      path: '/citizen/saved-schemes',
      labelEn: 'Saved Schemes',
      labelTa: 'சேமித்த திட்டங்கள்',
      icon: Bookmark
    },
    {
      path: '/citizen/notifications',
      labelEn: 'Notifications',
      labelTa: 'அறிவிப்புகள்',
      icon: Bell
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen h-[100dvh] flex flex-col justify-between bg-[#10243A] text-slate-300 border-r border-[#193352] transition-all duration-300 ease-in-out shadow-xl lg:shadow-none overflow-hidden ${
          isCollapsed ? 'lg:w-20' : 'lg:w-68'
        } ${
          isMobileOpen
            ? 'w-72 translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-[#193352]">
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'} overflow-hidden`}>
              {/* Emblem / Seal Icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0 border border-white/20">
                <span className="text-sm font-extrabold tracking-wider">TN</span>
              </div>

              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <div className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                    {isTa ? 'தமிழ்நாடு நலன்பாதை' : 'TN WelfarePath'}
                  </div>
                  <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center space-x-1 mt-0.5">
                    <span>Govt of Tamil Nadu</span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#193352] transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Portal Badge (only when expanded) */}
          {!isCollapsed && (
            <div className="px-4 py-2.5 mx-3 mt-3 rounded-lg bg-[#0a1726]/60 border border-[#193352]/80 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Citizen Portal
              </span>
              <span className="flex items-center space-x-1 text-[10px] font-bold text-teal-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items (Proper Spacing & Clean Active States with Independent Internal Scroll) */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3 space-y-1 mt-1 sidebar-scroll">
          {menu.map((item) => {
            const Icon = item.icon;
            const label = isTa ? item.labelTa : item.labelEn;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#193352]/70'
                  }`
                }
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} min-w-0`}>
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!isCollapsed && (
                    <span className="truncate leading-normal">{label}</span>
                  )}
                </div>

                {!isCollapsed && item.hasBadge && (
                  <div className="ml-2 shrink-0">
                    {loadingBadge ? (
                      <Loader2 className="w-3 h-3 text-teal-400 animate-spin" />
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/40">
                        {eligibleCount ?? 0}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Account & Collapse Toggle */}
        <div className="shrink-0 p-3 border-t border-[#193352] bg-[#0a1726]/40">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-white/20">
                  {user?.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {user?.name || 'Citizen User'}
                  </div>
                  <div className="text-[10px] text-teal-400 font-medium truncate">
                    Verified Citizen
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#193352] rounded-lg transition-colors shrink-0"
                title={isTa ? 'வெளியேறு' : 'Sign Out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#193352] rounded-lg transition-colors"
                title={isTa ? 'வெளியேறு' : 'Sign Out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Desktop Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-full mt-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-[#193352] rounded-lg text-xs font-medium transition-colors"
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
