import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../navigation/AdminSidebar';
import { AdminHeader } from '../navigation/AdminHeader';
import { DashboardLayoutShell } from './DashboardLayoutShell';

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DashboardLayoutShell
      sidebarCollapsed={sidebarCollapsed}
      expandedPaddingClass="lg:pl-64"
      bgClass="bg-slate-50 text-slate-900"
      contentContainerClass="p-4 md:p-6 w-full"
      sidebar={
        <AdminSidebar
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      }
      header={<AdminHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
    >
      <Outlet />
    </DashboardLayoutShell>
  );
};
