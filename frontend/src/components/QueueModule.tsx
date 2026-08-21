import React, { useEffect, useState } from 'react';
import { PageLayout } from '../layouts/PageLayout';
import { Button } from './ui/Button';
import {
  API_BASE
} from '../config';

interface Job {
  id: string;
  row_id: string;
  job_type: string;
  status: string;
  retry_count: number;
  error: string | null;
  created_at: number;
}

export const QueueModule: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: string) => {
    await fetch(`${API_BASE}/api/jobs/${id}/cancel`, { method: 'POST' });
    fetchJobs();
  };

  const handleRetry = async (id: string) => {
    await fetch(`${API_BASE}/api/jobs/${id}/retry`, { method: 'POST' });
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'DONE': return 'text-green-600';
        case 'FAILED': return 'text-red-600';
        case 'RUNNING': return 'text-blue-600 animate-pulse';
        case 'CANCELLED': return 'text-slate-400';
        default: return 'text-amber-600';
    }
  };

  return (
    <PageLayout
      title="HÀNG ĐỢI"
      description={`${jobs.length} công việc trong hệ thống`}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {jobs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-300 space-y-4">
            <span className="material-symbols-outlined text-7xl">sync</span>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Hàng đợi đang rỗng</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="bg-white p-3 rounded-md border border-slate-200 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500">{job.job_type} - Row: {job.row_id}</span>
                    <span className={`text-xs mt-1 font-mono font-bold ${getStatusColor(job.status)}`}>
                        {job.status} {job.status === 'RUNNING' && <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>}
                    </span>
                    {job.error && <span className="text-[10px] text-red-500 mt-1 line-clamp-1 opacity-80">{job.error}</span>}
                </div>
                <div className="flex space-x-2">
                    {['PENDING', 'RUNNING'].includes(job.status) && (
                        <Button variant="danger" size="sm" onClick={() => handleCancel(job.id)}>Hủy</Button>
                    )}
                    {['FAILED', 'CANCELLED'].includes(job.status) && (
                        <Button variant="secondary" size="sm" onClick={() => handleRetry(job.id)}>Thử lại</Button>
                    )}
                </div>
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
};
