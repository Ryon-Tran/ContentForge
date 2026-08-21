import React, { useRef, useState } from 'react';
import { WorkflowRow, ReferenceImage, AppConfig } from '../types';
import { FlowService } from '../services/FlowService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ToastContainer, ToastMessage } from '../components/ui/Toast';

interface Props {
  title: string;
  items: WorkflowRow[];
  setItems: React.Dispatch<React.SetStateAction<WorkflowRow[]>>;
  config: AppConfig;
  isNews?: boolean;
}

export const PipelineModule: React.FC<Props> = ({
  title,
  items,
  setItems,
  config,
  isNews = false
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const updateRow = (id: string, field: keyof WorkflowRow, value: any) => {
    setItems(prev => {
      const next = prev.map(r => (r.id === id ? { ...r, [field]: value } : r));
      const updated = next.find(r => r.id === id);
      if (updated) FlowService.storage.saveRow(updated, isNews ? 'news' : 'production').catch(console.error);
      return next;
    });
  };

  const handleAddRow = () => {
    const nextStt = String(items.length + 1).padStart(3, '0');
    const newRow: WorkflowRow = {
      id: crypto.randomUUID(),
      stt: nextStt,
      characterName: '',
      referenceImages: [],
      imagePrompt: '',
      imageVersions: [],
      currentImageIndex: -1,
      captionSample: '',
      captionInstruction: '',
      captionPreset: '',
      captionResult: '',
      savePath: items[items.length - 1]?.savePath || '',
      isDone: false,
      status: 'IDLE',
      error: '',
      createdAt: Date.now()
    };
    setItems(prev => [...prev, newRow]);
    FlowService.storage.saveRow(newRow, isNews ? 'news' : 'production').catch(console.error);
    addToast('info', `Đã thêm dòng STT ${nextStt}`);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const confirm = window.confirm(`Bạn có chắc muốn xóa ${selectedIds.size} dòng đã chọn?`);
    if (!confirm) return;

    selectedIds.forEach(id => {
      FlowService.storage.deleteRow(id, isNews ? 'news' : 'production').catch(console.error);
    });
    setItems(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    addToast('success', 'Đã xóa các dòng đã chọn.');
  };

  // 1. SINH ẢNH
  const handleGenerateImage = async (row: WorkflowRow) => {
    if (!row.imagePrompt.trim()) {
      addToast('error', `STT ${row.stt}: Vui lòng nhập Prompt tạo ảnh.`);
      return;
    }
    setLoadingRowId(row.id);
    updateRow(row.id, 'status', 'RUNNING');
    try {
      const res = await FlowService.ai.generateImage({
        prompt: row.imagePrompt,
        referenceImages: row.referenceImages,
        model: config.defaultImageAI
      });
      const newVer = {
        id: crypto.randomUUID(),
        base64: res.base64,
        mimeType: res.mimeType,
        mediaId: res.mediaId,
        createdAt: Date.now()
      };
      const versions = [...(row.imageVersions || []), newVer];
      updateRow(row.id, 'imageVersions', versions);
      updateRow(row.id, 'currentImageIndex', versions.length - 1);
      updateRow(row.id, 'status', 'COMPLETED');
      addToast('success', `STT ${row.stt}: Sinh ảnh thành công.`);
    } catch (e: any) {
      updateRow(row.id, 'status', 'FAILED');
      addToast('error', `STT ${row.stt}: Lỗi sinh ảnh - ${e.message}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  // 2. SINH CAPTION
  const handleGenerateCaption = async (row: WorkflowRow) => {
    const instruction = row.captionInstruction || row.imagePrompt;
    if (!instruction.trim()) {
      addToast('error', `STT ${row.stt}: Vui lòng nhập hướng dẫn viết caption.`);
      return;
    }
    setLoadingRowId(row.id);
    try {
      const res = await FlowService.ai.generateText(
        `${instruction}\nHãy viết nội dung/caption ngắn gọn, hấp dẫn, chuẩn SEO/TikTok.`,
        config.defaultTextAI
      );
      updateRow(row.id, 'captionResult', res.text);
      addToast('success', `STT ${row.stt}: Viết caption thành công.`);
    } catch (e: any) {
      addToast('error', `STT ${row.stt}: Lỗi viết caption - ${e.message}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  // 3. SINH GIỌNG ĐỌC TTS
  const handleGenerateTTS = async (row: WorkflowRow) => {
    if (!row.captionResult?.trim()) {
      addToast('error', `STT ${row.stt}: Cần có kết quả Caption trước khi đọc.`);
      return;
    }
    setLoadingRowId(row.id);
    try {
      const res = await FlowService.tts.generateTTS(row.captionResult);
      updateRow(row.id, 'audioVersion', res);
      addToast('success', `STT ${row.stt}: Tạo giọng đọc TTS thành công.`);
    } catch (e: any) {
      addToast('error', `STT ${row.stt}: Lỗi TTS - ${e.message}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  // 4. AUTO RUN TOÀN BỘ ROW (Full Pipeline)
  const handleAutoRunRow = async (row: WorkflowRow) => {
    setLoadingRowId(row.id);
    updateRow(row.id, 'status', 'RUNNING');
    addToast('info', `STT ${row.stt}: Bắt đầu chạy tự động toàn bộ...`);

    try {
      await FlowService.jobs.enqueue({
        row_id: row.id,
        job_type: 'FULL_PIPELINE',
        payload: { table_name: isNews ? 'news' : 'production' }
      });
      addToast('success', `STT ${row.stt}: Đã gửi vào hàng đợi xử lý ngầm.`);
    } catch (e: any) {
      addToast('error', `STT ${row.stt}: Lỗi chạy auto - ${e.message}`);
    } finally {
      setLoadingRowId(null);
    }
  };

  // 5. XUẤT TRỌN GÓI BUNDLE (1-Click Export)
  const handleExportBundle = async (row: WorkflowRow) => {
    if (!row.savePath?.trim()) {
      addToast('error', `STT ${row.stt}: Vui lòng điền 'Thư mục lưu' trước khi xuất.`);
      return;
    }
    const currentImg = row.imageVersions?.[row.currentImageIndex];
    try {
      const res = await FlowService.files.exportBundle({
        stt: row.stt,
        savePath: row.savePath,
        imageVersion: currentImg,
        captionText: row.captionResult,
        audioBase64: row.audioVersion?.base64,
        metadata: { characterName: row.characterName, stt: row.stt }
      });
      updateRow(row.id, 'isDone', true);
      addToast('success', `STT ${row.stt}: Đã xuất ${res.savedFiles.length} file vào thư mục!`);
    } catch (e: any) {
      addToast('error', `STT ${row.stt}: Lỗi xuất file - ${e.message}`);
    }
  };

  return (
    <div className="page-wrap">
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Quản lý {items.length} dòng kịch bản — Tự động sinh Ảnh, Caption và Giọng đọc TTS
          </p>
        </div>

        {/* ACTION TOOLBAR */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" icon="add" onClick={handleAddRow}>
            Thêm hàng
          </Button>

          {selectedIds.size > 0 && (
            <Button variant="danger" icon="delete" onClick={handleDeleteSelected}>
              Xóa ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="data-table-container">
        {items.length === 0 ? (
          <EmptyState
            icon="photo_library"
            title="Chưa có dữ liệu sản xuất"
            description="Bắt đầu bằng cách thêm một hàng kịch bản mới hoặc nhập từ file CSV."
            actionLabel="Thêm hàng đầu tiên"
            actionIcon="add"
            onAction={handleAddRow}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(new Set(items.map(r => r.id)));
                      else setSelectedIds(new Set());
                    }}
                  />
                </th>
                <th style={{ width: 64 }}>STT</th>
                <th style={{ width: 140 }}>Nhân Vật</th>
                <th style={{ width: 260 }}>Prompt Tạo Ảnh</th>
                <th style={{ width: 160 }}>Ảnh Đã Tạo</th>
                <th style={{ width: 280 }}>Hướng Dẫn & Caption</th>
                <th style={{ width: 160 }}>Giọng Đọc (TTS)</th>
                <th style={{ width: 180 }}>Thư Mục Lưu & Xuất</th>
                <th style={{ width: 130 }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => {
                const currentImg = row.imageVersions?.[row.currentImageIndex];
                const isSelected = selectedIds.has(row.id);
                const isBusy = loadingRowId === row.id;

                return (
                  <tr key={row.id} className={isSelected ? 'bg-[var(--primary-soft)]' : ''}>
                    {/* Checkbox */}
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          setSelectedIds(next);
                        }}
                      />
                    </td>

                    {/* STT & Status */}
                    <td>
                      <div className="font-bold text-[13px] text-[var(--primary)]">{row.stt}</div>
                      <StatusBadge status={row.status} className="mt-1" />
                    </td>

                    {/* Character Name */}
                    <td>
                      <input
                        type="text"
                        className="ui-input"
                        placeholder="Tên nhân vật..."
                        value={row.characterName || ''}
                        onChange={e => updateRow(row.id, 'characterName', e.target.value)}
                      />
                    </td>

                    {/* Image Prompt */}
                    <td>
                      <textarea
                        className="ui-textarea"
                        placeholder="Nhập prompt mô tả cảnh ảnh chi tiết..."
                        value={row.imagePrompt || ''}
                        onChange={e => updateRow(row.id, 'imagePrompt', e.target.value)}
                      />
                      <div className="mt-1.5 flex justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          icon="draw"
                          loading={isBusy}
                          onClick={() => handleGenerateImage(row)}
                        >
                          Sinh Ảnh
                        </Button>
                      </div>
                    </td>

                    {/* Image Preview & Versions */}
                    <td>
                      {currentImg ? (
                        <div className="space-y-1.5">
                          <div
                            className="image-preview-box mx-auto"
                            onClick={() => setPreviewImageUrl(`data:${currentImg.mimeType};base64,${currentImg.base64}`)}
                          >
                            <img
                              src={`data:${currentImg.mimeType};base64,${currentImg.base64}`}
                              alt={`STT ${row.stt}`}
                            />
                          </div>
                          {row.imageVersions.length > 1 && (
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {row.imageVersions.map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`version-chip ${row.currentImageIndex === idx ? 'active' : ''}`}
                                  onClick={() => updateRow(row.id, 'currentImageIndex', idx)}
                                >
                                  V{idx + 1}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-[11.5px] text-[var(--text-muted)]">
                          Chưa có ảnh
                        </div>
                      )}
                    </td>

                    {/* Caption Instruction & Result */}
                    <td>
                      <textarea
                        className="ui-textarea text-[12px]"
                        rows={2}
                        placeholder="Hướng dẫn kịch bản / viết caption..."
                        value={row.captionInstruction || ''}
                        onChange={e => updateRow(row.id, 'captionInstruction', e.target.value)}
                      />
                      {row.captionResult && (
                        <div className="mt-1.5 p-2 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] text-[12px] text-[var(--text-main)] max-h-20 overflow-y-auto">
                          {row.captionResult}
                        </div>
                      )}
                      <div className="mt-1.5 flex justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon="edit_note"
                          loading={isBusy}
                          onClick={() => handleGenerateCaption(row)}
                        >
                          Viết Caption
                        </Button>
                      </div>
                    </td>

                    {/* TTS Audio */}
                    <td>
                      {row.audioVersion ? (
                        <div className="space-y-1.5">
                          <audio
                            controls
                            className="w-full h-7"
                            src={`data:${row.audioVersion.mimeType};base64,${row.audioVersion.base64}`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="refresh"
                            onClick={() => handleGenerateTTS(row)}
                          >
                            Đọc lại
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon="record_voice_over"
                          loading={isBusy}
                          onClick={() => handleGenerateTTS(row)}
                        >
                          Tạo Giọng Đọc
                        </Button>
                      )}
                    </td>

                    {/* Save Path & Export */}
                    <td>
                      <input
                        type="text"
                        className="ui-input text-[11px]"
                        placeholder="D:\VideoMMO\Out"
                        value={row.savePath || ''}
                        onChange={e => updateRow(row.id, 'savePath', e.target.value)}
                      />
                      <div className="mt-1.5">
                        <Button
                          size="sm"
                          variant="success"
                          icon="folder_zip"
                          className="w-full"
                          onClick={() => handleExportBundle(row)}
                        >
                          {row.isDone ? 'Đã Xuất ✓' : 'Xuất Bundle'}
                        </Button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="primary"
                          icon="bolt"
                          loading={isBusy}
                          onClick={() => handleAutoRunRow(row)}
                        >
                          Auto Run
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="delete"
                          onClick={() => {
                            FlowService.storage.deleteRow(row.id, isNews ? 'news' : 'production');
                            setItems(prev => prev.filter(r => r.id !== row.id));
                          }}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img src={previewImageUrl} alt="Full Preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
