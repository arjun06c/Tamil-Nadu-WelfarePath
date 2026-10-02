import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const OfficerCorrectionsPage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'திருத்தக் கோரிக்கைகள் (Correction Requests)' : 'Pending Correction Requests Queue'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'குடிமக்களுக்கு அனுப்பப்பட்ட சான்றிதழ் திருத்தக் கோரிக்கைகளின் நிலவரம்' : 'Track pending correction notices sent to citizens for re-uploading unreadable proof documents'}
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 text-center py-12">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">
          {isTa ? 'செயலில் உள்ள திருத்தக் கோரிக்கைகள் இல்லை' : 'No Active Correction Requests Pending'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'அனைத்து திருத்தப்பட்ட விண்ணப்பங்களும் ஆய்விற்கு பெறப்பட்டுவிட்டன.' : 'All requested corrections have been submitted by applicants and cleared.'}
        </p>
      </div>
    </div>
  );
};
