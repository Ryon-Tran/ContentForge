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
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  // CHỌN THƯ MỤC LƯU QUA HỘP THOẠI WINDOWS
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

  // CHỌN THƯ MỤC VÀ ÁP DỤNG CHO TẤT CẢ CÁC DÒNG
  const handleBrowseAndApplyAll = async () => {
    try {
      const path = await FlowService.files.browseFolder();
      if (path) {
        setItems(prev => {
          const next = prev.map(r => ({ ...r, savePath: path }));
          next.forEach(r => FlowService.storage.saveRow(r, isNews ? 'news' : 'production').catch(console.error));
          return next;
        });
        addToast('success', `Đã áp dụng thư mục cho toàn bộ ${items.length} dòng: ${path}`);
      }
    } catch (e: any) {
      addToast('error', `Lỗi mở hộp thoại: ${e.message}`);
    }
  };

  // UPLOAD ẢNH THAM KHẢO
  const handleUploadReferences = (rowId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const base64Data = (e.target?.result as string).split(',')[1];
        const newRef: ReferenceImage = {
          id: crypto.randomUUID(),
          base64: base64Data,
          mimeType: file.type || 'image/jpeg',
          mediaId: crypto.randomUUID()
        };
        setItems(prev => {
          const next = prev.map(r => {
            if (r.id === rowId) {
              const updatedRefs = [...(r.referenceImages || []), newRef];
              return { ...r, referenceImages: updatedRefs };
            }
            return r;
          });
          const row = next.find(r => r.id === rowId);
          if (row) FlowService.storage.saveRow(row, isNews ? 'news' : 'production').catch(console.error);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    addToast('success', `Đã thêm ảnh tham khảo.`);
  };

  const handleDeleteReference = (rowId: string, refId: string) => {
    setItems(prev => {
      const next = prev.map(r => {
        if (r.id === rowId) {
          const updatedRefs = (r.referenceImages || []).filter(rf => rf.id !== refId);
          return { ...r, referenceImages: updatedRefs };
        }
        return r;
      });
      const row = next.find(r => r.id === rowId);
      if (row) FlowService.storage.saveRow(row, isNews ? 'news' : 'production').catch(console.error);
      return next;
    });
  };

  const handleInsert2CharPromptTemplate = (row: WorkflowRow) => {
    const template = `Two characters in the same frame standing side by side. On the left is the first person (reference image 1, character A). On the right is the second person (reference image 2, character B). Both looking at the camera, highly detailed, realistic faces, cinematic lighting, 8k resolution.`;
    updateRow(row.id, 'imagePrompt', template);
    addToast('info', `STT ${row.stt}: Đã chèn mẫu Prompt ghép 2 nhân vật.`);
  };

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

  const handleExportBundle = async (row: WorkflowRow) => {
    if (!row.savePath?.trim()) {
      addToast('error', `STT ${row.stt}: Vui lòng bấm 'Chọn thư mục' trước khi xuất.`);
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
            Quản lý {items.length} dòng kịch bản — Hỗ trợ nhiều ảnh tham khảo ghép 2 nhân vật, Giọng đọc TTS & Video
          </p>
        </div>

        {/* ACTION TOOLBAR */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            icon="folder_open"
            onClick={handleBrowseAndApplyAll}
            title="Mở hộp thoại chọn thư mục lưu chung cho toàn bộ bảng"
          >
            Chọn thư mục chung
          </Button>

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
            description="Bắt đầu bằng cách thêm một hàng kịch bản mới hoặc tải ảnh tham khảo lên."
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
                <th style={{ width: 130 }}>Nhân Vật</th>
                <th style={{ width: 170 }}>Hình Tham Khảo (NV 1, 2...)</th>
                <th style={{ width: 280 }}>Prompt Tạo Ảnh</th>
                <th style={{ width: 140 }}>Ảnh Đã Tạo</th>
                <th style={{ width: 260 }}>Hướng Dẫn & Caption</th>
                <th style={{ width: 150 }}>Giọng Đọc (TTS)</th>
                <th style={{ width: 210 }}>Thư Mục Lưu & Xuất</th>
                <th style={{ width: 120 }}>Thao Tác</th>
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
                        placeholder="VD: Tuấn & Linh..."
                        value={row.characterName || ''}
                        onChange={e => updateRow(row.id, 'characterName', e.target.value)}
                      />
                    </td>

                    {/* Multi-Reference Images (NV 1, NV 2...) */}
                    <td>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {row.referenceImages && row.referenceImages.map((ref, idx) => (
                            <div
                              key={ref.id}
                              className="relative w-12 h-14 rounded-lg overflow-hidden border border-[var(--border)] group bg-black shrink-0"
                            >
                              <img
                                src={`data:${ref.mimeType};base64,${ref.base64}`}
                                alt={`Ref ${idx + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setPreviewImageUrl(`data:${ref.mimeType};base64,${ref.base64}`)}
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] font-extrabold text-center py-0.5">
                                NV {idx + 1}
                              </span>
                              <button
                                type="button"
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteReference(row.id, ref.id)}
                              >
                                <span className="material-symbols-outlined text-[11px]">close</span>
                              </button>
                            </div>
                          ))}

                          {/* Add button */}
                          <button
                            type="button"
                            className="w-12 h-14 rounded-lg border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--primary)] text-[var(--text-muted)] hover:text-[var(--primary)] flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-bold transition-all bg-[var(--bg-soft)] shrink-0"
                            onClick={() => fileInputRefs.current[row.id]?.click()}
                          >
                            <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                            <span>+ NV</span>
                          </button>
                        </div>

                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          ref={el => (fileInputRefs.current[row.id] = el)}
                          className="hidden"
                          onChange={e => handleUploadReferences(row.id, e.target.files)}
                        />

                        {row.referenceImages && row.referenceImages.length >= 2 && (
                          <button
                            type="button"
                            className="text-[10px] text-[var(--primary)] font-bold hover:underline flex items-center gap-1"
                            onClick={() => handleInsert2CharPromptTemplate(row)}
                          >
                            <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                            Mẫu Prompt 2 NV
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Image Prompt */}
                    <td>
                      <textarea
                        className="ui-textarea"
                        placeholder="Nhập prompt mô tả cảnh và vị trí của 2 nhân vật..."
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
