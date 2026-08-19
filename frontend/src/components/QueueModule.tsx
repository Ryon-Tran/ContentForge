import React, { useEffect, useState } from 'react';

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
      const res = await fetch('http://localhost:8000/api/jobs');
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
    await fetch(`http://localhost:8000/api/jobs/${id}/cancel`, { method: 'POST' });
    fetchJobs();
  };

  const handleRetry = async (id: string) => {
    await fetch(`http://localhost:8000/api/jobs/${id}/retry`, { method: 'POST' });
    fetchJobs();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'DONE': return 'text-green-500';
        case 'FAILED': return 'text-red-500';
        case 'RUNNING': return 'text-blue-500 animate-pulse';
        case 'CANCELLED': return 'text-gray-500';
        default: return 'text-yellow-500';
    }
  };

  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col text-white">
      <div className="p-4 border-b border-white/5 bg-[#111] flex justify-between items-center">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">queue</span>
            HỆ THỐNG &gt; HÀNG ĐỢI ({jobs.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {jobs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
            <span className="material-symbols-outlined text-8xl animate-spin-slow">sync</span>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-widest">Hàng đợi đang rỗng</p>
            </div>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="bg-[#1a1a1a] p-3 rounded-md border border-white/10 flex justify-between items-center hover:bg-[#222] transition-colors">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400">{job.job_type} - Row: {job.row_id}</span>
                    <span className={`text-xs mt-1 font-mono font-bold ${getStatusColor(job.status)}`}>
                        {job.status} {job.status === 'RUNNING' && <span className="material-symbols-outlined text-[10px] animate-spin">sync</span>}
                    </span>
                    {job.error && <span className="text-[10px] text-red-500 mt-1 line-clamp-1 opacity-80">{job.error}</span>}
                </div>
                <div className="flex space-x-2">
                    {['PENDING', 'RUNNING'].includes(job.status) && (
                        <button onClick={() => handleCancel(job.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded text-[10px] font-bold transition-colors">Hủy</button>
                    )}
                    {['FAILED', 'CANCELLED'].includes(job.status) && (
                        <button onClick={() => handleRetry(job.id)} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-3 py-1.5 rounded text-[10px] font-bold transition-colors">Thử lại</button>
                    )}
                </div>
            </div>
          ))
        )}
      </div>
      
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
      `}</style>
    </div>
  );
};