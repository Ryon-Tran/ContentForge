import React from 'react';

export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED' | 'IDLE';

interface StatusBadgeProps {
  status: JobStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyle = (s: string) => {
    switch (s.toUpperCase()) {
      case 'PENDING':
        return { bg: '#fef9c3', border: '#fef08a', text: '#a16207' };
      case 'RUNNING':
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
      case 'DONE':
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' };
      case 'FAILED':
        return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };
      case 'CANCELLED':
      case 'IDLE':
      default:
        return { bg: '#f1f5f9', border: '#e2e8f0', text: '#64748b' };
    }
  };

  const style = getStatusStyle(status);

  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${
        status.toUpperCase() === 'RUNNING' ? 'animate-pulse' : ''
      } ${className}`}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.text
      }}
    >
      {status.toUpperCase()}
    </span>
  );
};
