import React from 'react';
import { Outlet } from 'react-router-dom';
import { AcademicDisclaimerBanner } from '../common/AcademicDisclaimerBanner';
import { PublicNavbar } from '../navigation/PublicNavbar';
import { Footer } from '../Footer';
import { AssistantModal } from '../AssistantModal';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-200 selection:text-teal-900">
      <AcademicDisclaimerBanner />
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <AssistantModal />
      <Footer />
    </div>
  );
};
