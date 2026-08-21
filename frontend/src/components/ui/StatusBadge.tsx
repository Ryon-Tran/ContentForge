import React from 'react';
import { JobStatus } from '../../types';

interface Props {
  status: JobStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'RUNNING':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse';
      case 'WAITING':
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'FAILED':
      case 'ERROR':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'IDLE':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'COMPLETED':
      case 'DONE':
        return 'Hoàn thành';
      case 'RUNNING':
        return 'Đang chạy...';
      case 'WAITING':
      case 'PENDING':
        return 'Đang chờ';
      case 'FAILED':
        return 'Thất bại';
      case 'IDLE':
      default:
        return 'Chưa chạy';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {getLabel()}
    </span>
  );
};
