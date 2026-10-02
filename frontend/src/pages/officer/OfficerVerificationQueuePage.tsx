import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, ShieldCheck } from 'lucide-react';

export const OfficerVerificationQueuePage: React.FC = () => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isTa ? 'ஆவண சரிபார்ப்பு பணி வரிசை' : 'Document Verification & OCR Audit Queue'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'ஆதார், வருமான சான்றிதழ் மற்றும் OCR வாசிப்பு முடிவுகளை ஒப்பிட்டு சரிபார்க்கும் பக்கம்' : 'Verify OCR text extractions against original certificate images and citizen profiles'}
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-200 text-center py-12">
        <FileCheck className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">
          {isTa ? 'அனைத்து ஆவணங்களும் சரிபார்க்கப்பட்டன' : 'All Document Verification Tasks Complete'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isTa ? 'தற்போது நிலுவையில் உள்ள ஆவணங்கள் எதுவும் இல்லை.' : 'No pending OCR document verification tasks requiring immediate officer attention.'}
        </p>
      </div>
    </div>
  );
};
