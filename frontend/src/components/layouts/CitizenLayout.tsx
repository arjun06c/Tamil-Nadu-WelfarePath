import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CitizenSidebar } from '../navigation/CitizenSidebar';
import { CitizenHeader } from '../navigation/CitizenHeader';
import { AssistantModal } from '../AssistantModal';
import { DashboardLayoutShell } from './DashboardLayoutShell';

export const CitizenLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DashboardLayoutShell
      sidebarCollapsed={sidebarCollapsed}
      expandedPaddingClass="lg:pl-68"
      bgClass="bg-[#F4F7FB] text-[#172B4D]"
      contentContainerClass="p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto"
      sidebar={
        <CitizenSidebar
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      }
      header={<CitizenHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
      extraFloatingElements={<AssistantModal />}
    >
      <Outlet />
    </DashboardLayoutShell>
  );
};
