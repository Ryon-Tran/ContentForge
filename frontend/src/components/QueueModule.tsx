import React, { useEffect, useState } from 'react';
import { FlowService } from '../services/FlowService';
import { StatusBadge } from './ui/StatusBadge';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';

export const QueueModule: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchJobs = async () => {
    try {
      const data = await FlowService.jobs.list(
        undefined,
        filterStatus === 'ALL' ? undefined : filterStatus
      );
      setJobs(data);
    } catch (e) {
      console.error('Lỗi tải danh sách Jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const handleRetry = async (jobId: string) => {
    await FlowService.jobs.retry(jobId);
    fetchJobs();
  };

  const handleCancel = async (jobId: string) => {
    await FlowService.jobs.cancel(jobId);
    fetchJobs();
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h2 className="page-title">HÀNG ĐỢI XỬ LÝ (JOB QUEUE)</h2>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Quản lý các tác vụ sinh Ảnh, Video, Audio và Full Pipeline đang chạy ngầm
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="ui-select text-[12px] py-1.5 h-8.5 w-36"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ (Pending)</option>
            <option value="RUNNING">Đang chạy (Running)</option>
            <option value="DONE">Hoàn thành (Done)</option>
            <option value="FAILED">Thất bại (Failed)</option>
          </select>
          <Button variant="secondary" icon="refresh" onClick={fetchJobs}>
            Làm mới
          </Button>
        </div>
      </div>

      <div className="data-table-container">
        {jobs.length === 0 ? (
          <EmptyState
            icon="queue"
            title="Hàng đợi trống"
            description="Hiện không có tác vụ nào đang chờ xử lý."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Mã Tác Vụ</th>
                <th style={{ width: 140 }}>Loại Tác Vụ</th>
                <th style={{ width: 120 }}>Trạng Thái</th>
                <th style={{ width: 90 }}>Lần Thử</th>
                <th style={{ width: 280 }}>Lỗi / Thông Tin</th>
                <th style={{ width: 140 }}>Thời Gian</th>
                <th style={{ width: 120 }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td className="font-mono text-[11px] text-[var(--text-muted)]">
                    {job.id.substring(0, 8)}...
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--text-main)]">
                      {job.job_type}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="text-center font-semibold text-[12px]">
                    {job.retry_count} / {job.max_retries}
                  </td>
                  <td className="text-[11.5px] text-rose-400 font-mono max-w-xs truncate">
                    {job.error || '—'}
                  </td>
                  <td className="text-[11px] text-[var(--text-muted)]">
                    {new Date(job.created_at).toLocaleTimeString('vi-VN')}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {job.status === 'FAILED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon="replay"
                          onClick={() => handleRetry(job.id)}
                        >
                          Thử lại
                        </Button>
                      )}
                      {(job.status === 'PENDING' || job.status === 'RUNNING') && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon="cancel"
                          onClick={() => handleCancel(job.id)}
                        >
                          Hủy
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
