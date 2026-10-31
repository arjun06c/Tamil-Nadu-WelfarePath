import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'blue' | 'teal' | 'navy';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'blue',
  onClick,
  className = ''
}) => {
  const variantStyles = {
    emerald: {
      border: 'border-l-4 border-l-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      subtext: 'text-emerald-700'
    },
    amber: {
      border: 'border-l-4 border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
      subtext: 'text-amber-700'
    },
    blue: {
      border: 'border-l-4 border-l-blue-600',
      iconBg: 'bg-blue-50 text-blue-700 border-blue-100',
      subtext: 'text-blue-700'
    },
    teal: {
      border: 'border-l-4 border-l-teal-600',
      iconBg: 'bg-teal-50 text-teal-700 border-teal-100',
      subtext: 'text-teal-700'
    },
    navy: {
      border: 'border-l-4 border-l-[#10243A]',
      iconBg: 'bg-slate-100 text-[#10243A] border-slate-200',
      subtext: 'text-slate-700'
    }
  };

  const style = variantStyles[variant];
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`gov-card p-5 text-left w-full transition-all duration-200 group relative ${
        style.border
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-2xl lg:text-3xl font-extrabold text-[#172B4D] tracking-tight">
            {value}
          </div>
          <div className="text-xs font-bold text-slate-700 leading-snug">
            {title}
          </div>
        </div>

        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${style.iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {subtext && (
        <div
          className={`text-[11px] font-semibold mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between ${style.subtext}`}
        >
          <span>{subtext}</span>
          {onClick && (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          )}
        </div>
      )}
    </Component>
  );
};
