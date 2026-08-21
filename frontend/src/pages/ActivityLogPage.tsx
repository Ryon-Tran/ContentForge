import React, { useEffect, useState } from 'react';
import { ActivityLog } from '../types';
import { FlowService } from '../services/FlowService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

interface Props {
  items: ActivityLog[];
  setItems: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
}

export const ActivityLogModule: React.FC<Props> = ({ items, setItems }) => {
  const [search, setSearch] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('ALL');

  const loadLogs = async () => {
    try {
      const list = await FlowService.activity.list();
      setItems(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClear = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) return;
    await FlowService.activity.clear();
    setItems([]);
  };

  const filteredLogs = items.filter(log => {
    if (filterModule !== 'ALL' && log.module !== filterModule) return false;
    if (search && !log.message?.toLowerCase().includes(search.toLowerCase()) && !log.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-wrap">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">LỊCH SỬ HOẠT ĐỘNG</h2>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Nhật ký các thao tác tạo ảnh, caption, audio, video và thay đổi cấu hình
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            className="ui-input text-[12px] py-1.5 h-8.5 w-48"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="ui-select text-[12px] py-1.5 h-8.5 w-36"
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
          >
            <option value="ALL">Tất cả Module</option>
            <option value="PRODUCTION">Sản Xuất</option>
            <option value="VIDEO">Video</option>
            <option value="SYSTEM">Hệ Thống</option>
          </select>
          <Button variant="danger" icon="delete_sweep" onClick={handleClear}>
            Xóa nhật ký
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="data-table-container">
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon="history"
            title="Chưa có nhật ký"
            description="Các hoạt động tạo ảnh, video, audio sẽ tự động ghi lại tại đây."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Thời Gian</th>
                <th style={{ width: 120 }}>Phân Hệ</th>
                <th style={{ width: 140 }}>Hành Động</th>
                <th style={{ width: 100 }}>Trạng Thái</th>
                <th style={{ width: 350 }}>Nội Dung / Tin Nhắn</th>
                <th style={{ width: 160 }}>STT / Đối Tượng</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td className="text-[11.5px] text-[var(--text-muted)]">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--bg-soft)] border border-[var(--border)] text-[var(--text-main)]">
                      {log.module}
                    </span>
                  </td>
                  <td className="font-mono text-[11.5px] font-semibold text-[var(--primary)]">
                    {log.type}
                  </td>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="text-[12.5px] text-[var(--text-main)]">
                    {log.message}
                    {log.error && (
                      <div className="text-[11px] text-rose-400 font-mono mt-0.5">{log.error}</div>
                    )}
                  </td>
                  <td className="text-[12px] font-semibold text-[var(--text-secondary)]">
                    {log.stt ? `STT ${log.stt}` : log.subject || '—'}
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
