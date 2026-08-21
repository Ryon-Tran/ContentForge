import React from 'react';
import { Button } from './Button';

interface Props {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  actionIcon,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] border border-[var(--border-glow)] flex items-center justify-center mb-4 text-[var(--primary)] shadow-sm">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="text-[16px] font-bold text-[var(--text-main)] tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
