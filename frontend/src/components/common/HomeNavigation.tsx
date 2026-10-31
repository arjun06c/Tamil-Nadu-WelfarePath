import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface HomeNavigationProps {
  variant?: 'default' | 'citizen' | 'officer' | 'admin';
  className?: string;
  showIconOnlyOnMobile?: boolean;
}

export const HomeNavigation: React.FC<HomeNavigationProps> = ({
  variant = 'default',
  className = '',
  showIconOnlyOnMobile = true
}) => {
  const { lang } = useAuth();
  const isTa = lang === 'ta';

  // Variant-specific styling tokens to seamlessly blend with each portal's theme
  const variantStyles = {
    default:
      'bg-slate-50 hover:bg-slate-100/90 text-[#172B4D] hover:text-[#10243A] border-slate-200 hover:border-slate-300 focus:ring-[#10243A]/20',
    citizen:
      'bg-slate-50 hover:bg-slate-100 text-[#172B4D] hover:text-[#10243A] border-slate-200 hover:border-slate-300 focus:ring-blue-600/20',
    officer:
      'bg-purple-50/80 hover:bg-purple-100 text-purple-950 hover:text-purple-900 border-purple-200 hover:border-purple-300 focus:ring-purple-600/20',
    admin:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border-slate-300 hover:border-slate-400 focus:ring-amber-600/20'
  };

  return (
    <Link
      to="/"
      className={`group inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 border shadow-2xs shrink-0 select-none focus:outline-none focus:ring-2 active:scale-95 ${variantStyles[variant]} ${className}`}
      title={isTa ? 'பொது முகப்புப் பக்கத்திற்குச் செல்க' : 'Back to Public Home Page'}
      aria-label={isTa ? 'முகப்புக்குச் செல்க' : 'Back to Home'}
    >
      {/* Left arrow with subtle nudge on hover */}
      <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-inherit transition-transform duration-150 group-hover:-translate-x-0.5 shrink-0" />
      {/* Home emblem */}
      <Home className="w-3.5 h-3.5 text-teal-600 shrink-0" />
      {/* Responsive labels */}
      <span className={showIconOnlyOnMobile ? 'hidden sm:inline' : 'inline'}>
        {isTa ? 'முகப்புக்குச் செல்க' : 'Back to Home'}
      </span>
      {showIconOnlyOnMobile && (
        <span className="inline sm:hidden font-extrabold text-[11px]">
          {isTa ? 'முகப்பு' : 'Home'}
        </span>
      )}
    </Link>
  );
};
