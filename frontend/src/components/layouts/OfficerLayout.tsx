import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { OfficerSidebar } from '../navigation/OfficerSidebar';
import { OfficerHeader } from '../navigation/OfficerHeader';
import { DashboardLayoutShell } from './DashboardLayoutShell';

export const OfficerLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DashboardLayoutShell
      sidebarCollapsed={sidebarCollapsed}
      expandedPaddingClass="lg:pl-64"
      bgClass="bg-slate-50 text-slate-900"
      contentContainerClass="p-4 md:p-6 w-full"
      sidebar={
        <OfficerSidebar
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      }
      header={<OfficerHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
    >
      <Outlet />
    </DashboardLayoutShell>
  );
};
