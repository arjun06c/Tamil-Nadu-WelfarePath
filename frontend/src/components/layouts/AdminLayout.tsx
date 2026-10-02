import React from 'react';
import { Outlet } from 'react-router-dom';
import { AcademicDisclaimerBanner } from '../common/AcademicDisclaimerBanner';
import { AdminSidebar } from '../navigation/AdminSidebar';
import { AdminHeader } from '../navigation/AdminHeader';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AcademicDisclaimerBanner />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
