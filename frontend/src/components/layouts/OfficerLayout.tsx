import React from 'react';
import { Outlet } from 'react-router-dom';
import { AcademicDisclaimerBanner } from '../common/AcademicDisclaimerBanner';
import { OfficerSidebar } from '../navigation/OfficerSidebar';
import { OfficerHeader } from '../navigation/OfficerHeader';

export const OfficerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <div className="flex flex-1">
        <OfficerSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <OfficerHeader />
          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
