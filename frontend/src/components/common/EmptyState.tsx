import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction
}) => {
  return (
    <div className="gov-card text-center py-12 px-6 rounded-2xl flex flex-col items-center max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7 text-[#10243A]" />
      </div>

      <h3 className="text-base font-bold text-[#172B4D] mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2.5 bg-[#10243A] hover:bg-[#193352] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              {actionText}
            </button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
