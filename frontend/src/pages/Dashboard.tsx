import React, { useEffect, useState } from 'react';
import { ViewType, WorkflowRow, VideoRow } from '../types';
import { FlowService } from '../services/FlowService';
import { Button } from '../components/ui/Button';

interface Props {
  productionCount: number;
  onNavigate?: (view: ViewType) => void;
}

export const Dashboard: React.FC<Props> = ({ productionCount, onNavigate }) => {
  const [prodRows, setProdRows] = useState<WorkflowRow[]>([]);
  const [videoRows, setVideoRows] = useState<VideoRow[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [p, v, q] = await Promise.all([
          FlowService.storage.loadRows('production'),
          FlowService.storage.loadRows('video'),
          FlowService.jobs.list(undefined, 'PENDING')
        ]);
        setProdRows(p as WorkflowRow[]);
        setVideoRows(v as VideoRow[]);
        setQueueCount(q.length);
      } catch (e) {
        console.error('Lỗi tải thống kê Dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalImages = prodRows.reduce((acc, r) => acc + (r.imageVersions?.length || 0), 0);
  const totalAudios = prodRows.filter(r => !!r.audioVersion).length;
  const totalVideos = videoRows.reduce((acc, r) => acc + (r.videoVersions?.length || 0), 0);
  const completedRows = prodRows.filter(r => r.isDone || r.status === 'COMPLETED').length;

  return (
    <div className="page-wrap overflow-y-auto">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">TỔNG QUAN HỆ THỐNG</h2>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Bảng điều khiển & chỉ số sản xuất nội dung đa phương thức
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <Button
              variant="primary"
              icon="photo_library"
              onClick={() => onNavigate('PRODUCTION_PHOTO')}
            >
              Vào Sản Xuất Ảnh & Caption
            </Button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Rows */}
          <div className="soft-card flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Kịch Bản / STT
              </div>
              <div className="text-3xl font-black text-[var(--text-main)] mt-1.5">
                {loading ? '...' : prodRows.length}
              </div>
              <div className="text-[11px] text-emerald-500 font-semibold mt-1">
                {completedRows} dòng hoàn tất
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">list_alt</span>
            </div>
          </div>

          {/* Card 2: Generated Images */}
          <div className="soft-card flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Ảnh Đã Tạo
              </div>
              <div className="text-3xl font-black text-[var(--text-main)] mt-1.5">
                {loading ? '...' : totalImages}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                Bao gồm các version
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">image</span>
            </div>
          </div>

          {/* Card 3: Generated Audio & Video */}
          <div className="soft-card flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Video & Giọng Đọc
              </div>
              <div className="text-3xl font-black text-[var(--text-main)] mt-1.5">
                {loading ? '...' : `${totalVideos} v / ${totalAudios} a`}
              </div>
              <div className="text-[11px] text-purple-400 font-semibold mt-1">
                Sẵn sàng xuất bundle
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">movie</span>
            </div>
          </div>

          {/* Card 4: Queue Status */}
          <div className="soft-card flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Hàng Đợi Chạy Ngầm
              </div>
              <div className="text-3xl font-black text-[var(--text-main)] mt-1.5">
                {loading ? '...' : queueCount}
              </div>
              <div className="text-[11px] text-amber-500 font-semibold mt-1">
                {queueCount > 0 ? 'Đang xử lý ngầm...' : 'Hệ thống rảnh rỗi'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">queue</span>
            </div>
          </div>
        </div>

        {/* WORKFLOW PIPELINE OVERVIEW */}
        <div className="soft-card">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
            <h3 className="font-bold text-[14px] text-[var(--text-main)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">hub</span>
              Quy Trình Sản Xuất Tự Động (Asset Bundle Workflow)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="w-9 h-9 mx-auto rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 font-bold">1</div>
              <div className="font-bold text-[13px] text-[var(--text-main)]">Nhập Kịch Bản</div>
              <div className="text-[11.5px] text-[var(--text-secondary)] mt-1">Nhập CSV hoặc thêm dòng kịch bản nhân vật</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="w-9 h-9 mx-auto rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center mb-2 font-bold">2</div>
              <div className="font-bold text-[13px] text-[var(--text-main)]">Sinh Ảnh & Caption</div>
              <div className="text-[11.5px] text-[var(--text-secondary)] mt-1">Tạo ảnh (Cloud/Local) + Viết caption + Đọc TTS</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="w-9 h-9 mx-auto rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 font-bold">3</div>
              <div className="font-bold text-[13px] text-[var(--text-main)]">Sinh Video Chuyển Động</div>
              <div className="text-[11.5px] text-[var(--text-secondary)] mt-1">Dùng ảnh làm First Frame tạo clip Veo / Grok</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="w-9 h-9 mx-auto rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 font-bold">4</div>
              <div className="font-bold text-[13px] text-[var(--text-main)]">Xuất Trọn Gói Bundle</div>
              <div className="text-[11.5px] text-[var(--text-secondary)] mt-1">Lưu đồng thời 001.png, 001.txt, 001.mp3, 001.mp4</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};