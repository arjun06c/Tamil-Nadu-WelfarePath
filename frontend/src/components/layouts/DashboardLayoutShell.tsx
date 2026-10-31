import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface DashboardLayoutShellProps {
  /** The fixed sidebar component */
  sidebar: React.ReactNode;
  /** The fixed top navbar component */
  header: React.ReactNode;
  /** Main page content (usually <Outlet />) */
  children: React.ReactNode;
  /** Whether the sidebar is currently collapsed */
  sidebarCollapsed: boolean;
  /** Tailwind class for padding-left when expanded (e.g. 'lg:pl-68' or 'lg:pl-64') */
  expandedPaddingClass?: string;
  /** Background and text classes for the outer viewport shell */
  bgClass?: string;
  /** Inner content container class */
  contentContainerClass?: string;
  /** Floating modals or overlays (e.g. <AssistantModal />) */
  extraFloatingElements?: React.ReactNode;
}

/**
 * Universal Dashboard Layout Shell for TN WelfarePath
 * 
 * Provides:
 * - Fixed Sidebar (full viewport height, independent nav scroll, stays stationary)
 * - Fixed Top Navbar (stays pinned to top, starts after sidebar, full available width)
 * - Independently Scrollable Main Content (the ONLY container that scrolls vertically)
 * - Automatic Scroll Restoration to top on route change
 * - Mobile drawer off-canvas support with overlay
 * - Collapsible sidebar width adaptation
 */
export const DashboardLayoutShell: React.FC<DashboardLayoutShellProps> = ({
  sidebar,
  header,
  children,
  sidebarCollapsed,
  expandedPaddingClass = 'lg:pl-64',
  bgClass = 'bg-slate-50 text-slate-900',
  contentContainerClass = 'p-4 md:p-6 w-full',
  extraFloatingElements
}) => {
  const mainContentRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Reset scroll to top on page navigation
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div className={`h-screen h-[100dvh] w-full overflow-hidden flex ${bgClass}`}>
      {/* 1. Fixed Sidebar Area */}
      {sidebar}

      {/* 2. Main Application Area */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : expandedPaddingClass
        }`}
      >
        {/* Fixed Top Navbar */}
        {header}

        {/* Scrollable Main Content: ONLY container that scrolls vertically */}
        <main
          ref={mainContentRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth focus:outline-none"
        >
          <div className={contentContainerClass}>
            {children}
          </div>
        </main>
      </div>

      {/* Floating or background elements */}
      {extraFloatingElements}
    </div>
  );
};
