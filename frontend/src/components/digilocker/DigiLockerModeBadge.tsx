import React from 'react';
import { ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DigiLockerModeBadgeProps {
  mode?: 'mock' | 'sandbox' | 'production' | string;
  badgeLabel?: string;
  className?: string;
}

export const DigiLockerModeBadge: React.FC<DigiLockerModeBadgeProps> = ({
  mode = 'mock',
  badgeLabel,
  className = ''
}) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';
  const modeLower = mode?.toLowerCase();

  if (modeLower === 'sandbox') {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-50 border border-blue-200 text-blue-800 shadow-2xs ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span>{badgeLabel || (isTa ? 'டிஜிலாக்கர் பரிசோதனை களம்' : 'DigiLocker Sandbox')}</span>
      </span>
    );
  }

  if (modeLower === 'production') {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>{badgeLabel || 'DigiLocker'}</span>
      </span>
    );
  }

  // Default fallback: MOCK mode (Demo Document Source)
  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
      <span>{badgeLabel || (isTa ? 'டெமோ ஆவண ஆதாரம்' : 'Demo Document Source')}</span>
    </span>
  );
};
