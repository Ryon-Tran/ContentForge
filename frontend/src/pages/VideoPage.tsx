import React, { useState } from 'react';
import { VideoRow, WorkflowRow, AppConfig } from '../types';
import { FlowService } from '../services/FlowService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ToastContainer, ToastMessage } from '../components/ui/Toast';

interface Props {
  items: VideoRow[];
  setItems: React.Dispatch<React.SetStateAction<VideoRow[]>>;
  productionItems: WorkflowRow[];
  config: AppConfig;
}

export const VideoModule: React.FC<Props> = ({
  items,
  setItems,
  productionItems,
  config
}) => {
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const updateRow = (id: string, field: keyof VideoRow, value: any) => {
    setItems(prev => {
      const next = prev.map(r => (r.id === id ? { ...r, [field]: value } : r));
      const updated = next.find(r => r.id === id);
      if (updated) FlowService.storage.saveRow(updated, 'video').catch(console.error);
      return next;
    });
  };

  const handleBrowseFolderForRow = async (rowId: string) => {
    try {
      const path = await FlowService.files.browseFolder();
      if (path) {
        updateRow(rowId, 'savePath', path);
        addToast('success', `Đã chọn thư mục: ${path}`);
      }
    } catch (e: any) {
      addToast('error', `Lỗi mở hộp thoại: ${e.message}`);
    }
  };

  const handleBrowseAndApplyAll = async () => {
    try {
      const path = await FlowService.files.browseFolder();
      if (path) {
        setItems(prev => {
          const next = prev.map(r => ({ ...r, savePath: path }));
          next.forEach(r => FlowService.storage.saveRow(r, 'video').catch(console.error));
          return next;
        });
        addToast('success', `Đã áp dụng thư mục cho toàn bộ ${items.length} dòng: ${path}`);
      }
    } catch (e: any) {
      addToast('error', `Lỗi mở hộp thoại: ${e.message}`);
    }
  };

  // SINH VIDEO
  const handleGenerateVideo = async (row: VideoRow) => {
    const prodRow = productionItems.find(p => p.id === row.id);
    const selectedImg =
      prodRow?.imageVersions && prodRow.currentImageIndex >= 0
        ? prodRow.imageVersions[prodRow.currentImageIndex]
        : null;

    const prompt = row.videoPrompt || prodRow?.imagePrompt || 'cinematic motion, smooth camera panning';

    setLoadingRowId(row.id);
    updateRow(row.id, 'status', 'RUNNING');
    addToast('info', `STT ${row.stt}: Bắt đầu sinh Video (quá trình có thể mất 1-3 phút)...`);

    try {
      const res = await FlowService.ai.generateVideo({
        prompt,
        firstFrameId: selectedImg?.id || '',
        firstFrameBase64: selectedImg?.base64,
        firstFrameMimeType: selectedImg?.mimeType,
        aspectRatio: '9:16',
        durationSeconds: 8,
        resolution: '720p',
        model: config.defaultVideoAI
      });

      const newVer = {
        id: crypto.randomUUID(),
        base64: res.base64,
        mimeType: res.mimeType,
        mediaId: res.mediaId,
        sourceImageId: selectedImg?.id || '',
        createdAt: Date.now()
      };

      const versions = [...(row.videoVersions || []), newVer];
      updateRow(row.id, 'videoVersions', versions);
      updateRow(row.id, 'currentVideoIndex', versions.length - 1);
      updateRow(row.id, 'status', 'COMPLETED');
      addToast('success', `STT ${row.stt}: Sinh video thành công!`);
    } catch (e: any) {
      updateRow(row.id, 'status', 'FAILED');
      addToast('error', `STT ${row.stt}: Lỗi sinh video - ${e.message}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  // LƯU FILE VIDEO
  const handleSaveVideo = async (row: VideoRow) => {
    const currentVid = row.videoVersions?.[row.currentVideoIndex];
    if (!currentVid) {
      addToast('error', `STT ${row.stt}: Chưa có video để lưu.`);
      return;
    }
    if (!row.savePath?.trim()) {
      addToast('error', `STT ${row.stt}: Vui lòng chọn thư mục lưu.`);
      return;
    }

    try {
      await FlowService.files.saveFile({
        path: row.savePath,
        filename: `${row.stt.padStart(3, '0')}.mp4`,
        base64: currentVid.base64,
        mimeType: currentVid.mimeType || 'video/mp4'
      });
      updateRow(row.id, 'saveConfirmed', true);
      updateRow(row.id, 'isDone', true);
      addToast('success', `STT ${row.stt}: Đã lưu file ${row.stt}.mp4 thành công!`);
    } catch (e: any) {
      addToast('error', `STT ${row.stt}: Lỗi lưu video - ${e.message}`);
    }
  };

  return (
    <div className="page-wrap">
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">SẢN XUẤT VIDEO PIPELINE</h2>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Dùng ảnh đã chọn từ tab Sản Xuất làm First Frame để sinh Video chuyển động AI (Veo / Grok)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon="folder_open"
            onClick={handleBrowseAndApplyAll}
            title="Mở hộp thoại chọn thư mục lưu chung cho toàn bộ bảng Video"
          >
            Chọn thư mục chung
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="data-table-container">
        {items.length === 0 ? (
          <EmptyState
            icon="movie"
            title="Chưa có dữ liệu Video"
            description="Hãy tạo các dòng ảnh và kịch bản trong tab 'Ảnh & Caption' trước, dữ liệu sẽ tự động đồng bộ sang đây."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>STT</th>
                <th style={{ width: 120 }}>Ảnh Nguồn</th>
                <th style={{ width: 300 }}>Prompt Chuyển Động Video</th>
                <th style={{ width: 280 }}>Trình Phát Video (Preview)</th>
                <th style={{ width: 230 }}>Thư Mục Lưu</th>
                <th style={{ width: 130 }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => {
                const prodRow = productionItems.find(p => p.id === row.id);
                const sourceImg =
                  prodRow?.imageVersions && prodRow.currentImageIndex >= 0
                    ? prodRow.imageVersions[prodRow.currentImageIndex]
                    : null;
                const currentVid = row.videoVersions?.[row.currentVideoIndex];
                const isBusy = loadingRowId === row.id;

                return (
                  <tr key={row.id}>
                    {/* STT */}
                    <td>
                      <div className="font-bold text-[13px] text-[var(--primary)]">{row.stt}</div>
                      <StatusBadge status={row.status} className="mt-1" />
                    </td>

                    {/* Source Image */}
                    <td>
                      {sourceImg ? (
                        <div className="w-16 h-24 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-soft)]">
                          <img
                            src={`data:${sourceImg.mimeType};base64,${sourceImg.base64}`}
                            alt={`Source STT ${row.stt}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)] text-center py-6">
                          Chưa có ảnh
                        </div>
                      )}
                    </td>

                    {/* Video Prompt */}
                    <td>
                      <textarea
                        className="ui-textarea"
                        placeholder="Mô tả hướng chuyển động (VD: camera pan slow zoom in, cinematic lighting...)"
                        value={row.videoPrompt || ''}
                        onChange={e => updateRow(row.id, 'videoPrompt', e.target.value)}
                      />
                      <div className="mt-1.5 flex justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          icon="movie"
                          loading={isBusy}
                          onClick={() => handleGenerateVideo(row)}
                        >
                          Sinh Video
                        </Button>
                      </div>
                    </td>

                    {/* Video Player Preview */}
                    <td>
                      {currentVid ? (
                        <div className="space-y-1.5">
                          <video
                            controls
                            className="w-full max-h-48 rounded-lg bg-black border border-[var(--border)]"
                            src={`data:${currentVid.mimeType || 'video/mp4'};base64,${currentVid.base64}`}
                          />
                          {row.videoVersions.length > 1 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {row.videoVersions.map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`version-chip ${row.currentVideoIndex === idx ? 'active' : ''}`}
                                  onClick={() => updateRow(row.id, 'currentVideoIndex', idx)}
                                >
                                  V{idx + 1}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-[11.5px] text-[var(--text-muted)]">
                          Chưa có video
                        </div>
                      )}
                    </td>

                    {/* Save Path */}
                    <td>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            className="ui-input text-[11px] flex-1 min-w-0"
                            placeholder="D:\VideoMMO\Out"
                            value={row.savePath || ''}
                            onChange={e => updateRow(row.id, 'savePath', e.target.value)}
                          />
                          <button
                            type="button"
                            className="px-2 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-soft)] hover:bg-[var(--primary-soft)] hover:border-[var(--primary)] text-[var(--text-main)] text-[11px] font-bold shrink-0 transition-colors flex items-center gap-0.5"
                            title="Chọn thư mục trên máy tính"
                            onClick={() => handleBrowseFolderForRow(row.id)}
                          >
                            <span className="material-symbols-outlined text-[15px]">folder_open</span>
                          </button>
                        </div>

                        {currentVid && (
                          <Button
                            size="sm"
                            variant={row.saveConfirmed ? 'success' : 'primary'}
                            icon="save"
                            className="w-full"
                            onClick={() => handleSaveVideo(row)}
                          >
                            {row.saveConfirmed ? 'Đã Lưu Video ✓' : 'Lưu Video .mp4'}
                          </Button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="refresh"
                        loading={isBusy}
                        onClick={() => handleGenerateVideo(row)}
                      >
                        Tạo Lại
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};