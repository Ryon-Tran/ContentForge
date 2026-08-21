import { API_BASE } from '../config';
import {
  WorkflowRow,
  VideoRow,
  ActivityLog,
  AIProviderConfig
} from '../types';
import { IService } from './types';

export const FlowService: IService = {
  ai: {
    generateText: async (prompt: string, model?: string) => {
      const res = await fetch(`${API_BASE}/api/ai/generate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi sinh Text');
      }
      return await res.json();
    },

    generateImage: async (payload: {
      prompt: string;
      referenceImages?: any[];
      aspectRatio?: string;
      model?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/ai/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: payload.prompt,
          referenceImages: payload.referenceImages || [],
          aspectRatio: payload.aspectRatio || '9:16',
          model: payload.model
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi sinh Ảnh');
      }
      return await res.json();
    },

    generateVideo: async (payload: {
      prompt: string;
      firstFrameId?: string;
      firstFrameBase64?: string;
      firstFrameMimeType?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      resolution?: string;
      model?: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/ai/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi sinh Video');
      }
      return await res.json();
    }
  },

  tts: {
    generateTTS: async (text: string, voice: string = 'vi-VN-HoaiMyNeural') => {
      const res = await fetch(`${API_BASE}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi sinh giọng đọc TTS');
      }
      return await res.json();
    }
  },

  storage: {
    saveRow: async (row: WorkflowRow | VideoRow, table: string) => {
      const res = await fetch(`${API_BASE}/api/storage/save-row`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row, table })
      });
      if (!res.ok) throw new Error('Lỗi lưu dữ liệu hàng');
      return await res.json();
    },

    loadRows: async (table: string) => {
      const res = await fetch(`${API_BASE}/api/storage/load-rows?table=${encodeURIComponent(table)}`);
      if (!res.ok) throw new Error('Lỗi tải dữ liệu bảng');
      const data = await res.json();
      return data.rows || [];
    },

    deleteRow: async (id: string, table: string) => {
      const res = await fetch(`${API_BASE}/api/storage/delete-row`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, table })
      });
      if (!res.ok) throw new Error('Lỗi xóa dòng');
      return await res.json();
    }
  },

  files: {
    browseFolder: async () => {
      const res = await fetch(`${API_BASE}/api/files/browse-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Lỗi mở hộp thoại chọn thư mục');
      const data = await res.json();
      return data.path || '';
    },

    saveFile: async (payload: {
      path: string;
      filename: string;
      base64: string;
      mimeType: string;
    }) => {
      const res = await fetch(`${API_BASE}/api/files/save-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi lưu file');
      }
      return await res.json();
    },

    exportBundle: async (payload: {
      stt: string;
      savePath: string;
      imageVersion?: any;
      captionText?: string;
      audioBase64?: string;
      videoVersion?: any;
      metadata?: any;
    }) => {
      const res = await fetch(`${API_BASE}/api/files/export-bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi xuất trọn gói bundle');
      }
      return await res.json();
    }
  },

  activity: {
    log: async (activity: Partial<ActivityLog>) => {
      try {
        const res = await fetch(`${API_BASE}/api/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activity })
        });
        return await res.json();
      } catch (e) {
        console.error('Lỗi ghi log:', e);
      }
    },

    list: async () => {
      const res = await fetch(`${API_BASE}/api/activity`);
      if (!res.ok) throw new Error('Lỗi tải nhật ký');
      const data = await res.json();
      return data.activities || [];
    },

    clear: async () => {
      const res = await fetch(`${API_BASE}/api/activity`, { method: 'DELETE' });
      return await res.json();
    }
  },

  jobs: {
    enqueue: async (payload: { row_id: string; job_type: string; payload?: any }) => {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Lỗi đẩy job vào hàng đợi');
      return await res.json();
    },

    list: async (row_id?: string, status?: string) => {
      let url = `${API_BASE}/api/jobs?`;
      if (row_id) url += `row_id=${encodeURIComponent(row_id)}&`;
      if (status) url += `status=${encodeURIComponent(status)}&`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Lỗi tải hàng đợi');
      return await res.json();
    },

    retry: async (jobId: string) => {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/retry`, { method: 'POST' });
      return await res.json();
    },

    cancel: async (jobId: string) => {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}/cancel`, { method: 'POST' });
      return await res.json();
    }
  },

  config: {
    listProviders: async () => {
      const res = await fetch(`${API_BASE}/api/config/ai-providers`);
      if (!res.ok) throw new Error('Lỗi tải AI providers');
      const data = await res.json();
      return data.providers || [];
    },

    createProvider: async (provider: Partial<AIProviderConfig> & { apiKey?: string }) => {
      const res = await fetch(`${API_BASE}/api/config/ai-providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi tạo AI provider');
      }
      return await res.json();
    },

    updateProvider: async (id: string, provider: Partial<AIProviderConfig> & { apiKey?: string }) => {
      const res = await fetch(`${API_BASE}/api/config/ai-providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi cập nhật AI provider');
      }
      return await res.json();
    },

    deleteProvider: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/config/ai-providers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi xóa AI provider');
      return await res.json();
    },

    setDefault: async (id: string, type: string) => {
      const res = await fetch(`${API_BASE}/api/config/set-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type })
      });
      return await res.json();
    },

    testConnection: async (data: {
      provider: string;
      type: string;
      model: string;
      baseUrl?: string;
      apiKey?: string;
      extraConfig?: any;
    }) => {
      const res = await fetch(`${API_BASE}/api/config/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    }
  }
};
