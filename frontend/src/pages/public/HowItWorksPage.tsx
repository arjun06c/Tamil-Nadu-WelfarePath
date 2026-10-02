import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, UserCheck, Search, Scan, Award } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isTa ? 'தமிழ்நாடு நலன்பாதை எவ்வாறு செயல்படுகிறது?' : 'How Tamil Nadu WelfarePath Works'}
        </h1>
        <p className="text-xs text-slate-500 mt-2 max-w-xl mx-auto">
          {isTa ? 'தகுதி கண்டறிதல் முதல் உரிமைத் தொகை பெறுவது வரை 4 எளிய படிகள்' : '4 Simple Steps from Eligibility Assessment to Direct Benefit Transfer'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <UserCheck className="w-8 h-8 text-blue-900 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">Step 1: Build Citizen Profile</h3>
          <p className="text-xs text-slate-600">Enter basic age, income, education level, and schooling background securely.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <Search className="w-8 h-8 text-teal-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">Step 2: Transparent Eligibility Rule Check</h3>
          <p className="text-xs text-slate-600">Get criterion-by-criterion pass/fail reasons and 3-level status (Eligible, Near Eligible, Ineligible).</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <Scan className="w-8 h-8 text-indigo-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">Step 3: OCR Document Readiness</h3>
          <p className="text-xs text-slate-600">Upload supporting certificates to scan text and pre-fill application forms.</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <Award className="w-8 h-8 text-emerald-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">Step 4: Application Tracking & Benefits</h3>
          <p className="text-xs text-slate-600">Track milestone status history and receive renewal reminders for ongoing benefits.</p>
        </div>
      </div>
    </div>
  );
};
