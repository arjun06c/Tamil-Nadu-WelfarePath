import React from 'react';
import { Outlet } from 'react-router-dom';
import { AcademicDisclaimerBanner } from '../common/AcademicDisclaimerBanner';
import { CitizenSidebar } from '../navigation/CitizenSidebar';
import { CitizenHeader } from '../navigation/CitizenHeader';
import { AssistantModal } from '../AssistantModal';

export const CitizenLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <div className="flex flex-1">
        <CitizenSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <CitizenHeader />
          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <AssistantModal />
    </div>
  );
};
