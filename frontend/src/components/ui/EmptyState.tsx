import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  message,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-lg border border-slate-200 border-dashed min-h-[200px]">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">
        {icon}
      </span>
      <h3 className="text-[13px] font-semibold text-slate-700 mb-1">
        {title}
      </h3>
      {message && (
        <p className="text-[12px] text-slate-500 max-w-sm mb-4 leading-relaxed">
          {message}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
