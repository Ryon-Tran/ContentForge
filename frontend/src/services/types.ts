import {
  WorkflowRow,
  VideoRow,
  ActivityLog,
  AIProviderConfig
} from '../types';

export interface IService {
  ai: {
    generateText: (prompt: string, model?: string) => Promise<{ text: string }>;
    generateImage: (payload: {
      prompt: string;
      referenceImages?: any[];
      aspectRatio?: string;
      model?: string;
    }) => Promise<{ base64: string; mimeType: string; mediaId: string }>;
    generateVideo: (payload: {
      prompt: string;
      firstFrameId?: string;
      firstFrameBase64?: string;
      firstFrameMimeType?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      resolution?: string;
      model?: string;
    }) => Promise<{ base64: string; mimeType: string; mediaId: string }>;
  };

  tts: {
    generateTTS: (text: string, voice?: string) => Promise<{ base64: string; mimeType: string; mediaId: string; voice: string }>;
  };

  storage: {
    saveRow: (row: WorkflowRow | VideoRow, table: string) => Promise<{ success: boolean }>;
    loadRows: (table: string) => Promise<WorkflowRow[] | VideoRow[]>;
    deleteRow: (id: string, table: string) => Promise<{ success: boolean }>;
  };

  files: {
    saveFile: (payload: {
      path: string;
      filename: string;
      base64: string;
      mimeType: string;
    }) => Promise<{ success: boolean; path: string; filename: string }>;
    exportBundle: (payload: {
      stt: string;
      savePath: string;
      imageVersion?: any;
      captionText?: string;
      audioBase64?: string;
      videoVersion?: any;
      metadata?: any;
    }) => Promise<{ success: boolean; directory: string; stt: string; savedFiles: string[] }>;
  };

  activity: {
    log: (activity: Partial<ActivityLog>) => Promise<any>;
    list: () => Promise<ActivityLog[]>;
    clear: () => Promise<any>;
  };

  jobs: {
    enqueue: (payload: { row_id: string; job_type: string; payload?: any }) => Promise<any>;
    list: (row_id?: string, status?: string) => Promise<any[]>;
    retry: (jobId: string) => Promise<any>;
    cancel: (jobId: string) => Promise<any>;
  };

  config: {
    listProviders: () => Promise<AIProviderConfig[]>;
    createProvider: (provider: Partial<AIProviderConfig> & { apiKey?: string }) => Promise<any>;
    updateProvider: (id: string, provider: Partial<AIProviderConfig> & { apiKey?: string }) => Promise<any>;
    deleteProvider: (id: string) => Promise<any>;
    setDefault: (id: string, type: string) => Promise<any>;
    testConnection: (data: {
      provider: string;
      type: string;
      model: string;
      baseUrl?: string;
      apiKey?: string;
      extraConfig?: any;
    }) => Promise<{ ok: boolean; message: string; models?: string[] }>;
  };
}