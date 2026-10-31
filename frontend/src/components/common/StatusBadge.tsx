import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, FileCheck2, XCircle, Clock, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  isTamil?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isTamil = false,
  size = 'md'
}) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (normalized) {
    case 'STRONG_MATCH':
    case 'STRONG':
    case 'ELIGIBLE':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{isTamil ? 'முழு தகுதி' : 'Strong Match'}</span>
        </span>
      );

    case 'POTENTIAL_MATCH':
    case 'POTENTIAL':
    case 'NEAR_ELIGIBLE':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{isTamil ? 'சாத்தியமான தகுதி' : 'Potential Match'}</span>
        </span>
      );

    case 'NEEDS_INFORMATION':
    case 'MORE_INFORMATION_NEEDED':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-sky-50 text-sky-800 border border-sky-300 ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{isTamil ? 'கூடுதல் விவரம் தேவை' : 'Needs Info'}</span>
        </span>
      );

    case 'DOCUMENTS_REQUIRED':
    case 'DOCS_NEEDED':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-indigo-50 text-indigo-800 border border-indigo-300 ${sizeClasses}`}>
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{isTamil ? 'ஆவணங்கள் தேவை' : 'Docs Needed'}</span>
        </span>
      );

    case 'APPROVED':
    case 'ACCEPTED':
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{isTamil ? 'அங்கீகரிக்கப்பட்டது' : 'Approved'}</span>
        </span>
      );

    case 'SUBMITTED':
    case 'PENDING':
    case 'UNDER_REVIEW':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-blue-50 text-blue-800 border border-blue-300 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{isTamil ? 'பரிசீலனையில்' : 'Under Review'}</span>
        </span>
      );

    case 'CORRECTION_REQUIRED':
    case 'CORRECTION':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{isTamil ? 'திருத்தம் தேவை' : 'Action Required'}</span>
        </span>
      );

    case 'REJECTED':
    case 'NOT_ELIGIBLE':
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full font-bold bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{isTamil ? 'தகுதியற்றது' : 'Not Eligible'}</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center space-x-1 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};
