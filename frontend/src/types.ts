export type JobStatus =
  | 'IDLE'
  | 'WAITING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';


export type AIProviderType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO';


export type ActivityModule =
  | 'PRODUCTION'
  | 'VIDEO'
  | 'SYSTEM';


export type ActivityType =
  | 'CREATE_IMAGE'
  | 'REGENERATE_IMAGE'
  | 'SAVE_IMAGE'
  | 'CREATE_CAPTION'
  | 'SAVE_CAPTION'
  | 'CREATE_AUDIO'
  | 'SAVE_AUDIO'
  | 'CREATE_VIDEO'
  | 'SAVE_VIDEO'
  | 'EXPORT_BUNDLE'
  | 'CONFIG_CREATE'
  | 'CONFIG_UPDATE'
  | 'CONFIG_DELETE'
  | 'OTHER';


export type ActivityStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'RUNNING'
  | 'INFO';


export interface ImageVersion {
  id: string;
  base64: string;
  mimeType: string;
  mediaId: string;
  createdAt: number;
}


export interface AudioVersion {
  base64: string;
  mimeType: string;
  mediaId: string;
  voice: string;
}


export interface VideoVersion {
  id: string;
  base64: string;
  mimeType: string;
  mediaId: string;
  sourceImageId: string;
  createdAt: number;
}


export interface ReferenceImage {
  id: string;
  base64: string;
  mimeType: string;
  mediaId: string;
}


export interface WorkflowRow {
  id: string;
  stt: string;
  characterName: string;
  referenceImages: ReferenceImage[];
  imagePrompt: string;
  imageVersions: ImageVersion[];
  currentImageIndex: number;
  captionSample: string;
  captionInstruction: string;
  captionPreset: string;
  captionResult: string;
  audioVersion?: AudioVersion;
  savePath: string;
  isDone: boolean;
  status: JobStatus;
  error: string;
  createdAt: number;
}


export interface VideoRow {
  id: string;
  stt: string;
  videoPrompt: string;
  videoVersions: VideoVersion[];
  currentVideoIndex: number;
  status: JobStatus;
  saveConfirmed: boolean;
  isDone: boolean;
  savePath: string;
  error: string;
}


export interface ActivityLog {
  id: string;
  module: ActivityModule;
  type: ActivityType;
  status: ActivityStatus;
  rowId?: string;
  stt?: string;
  subject?: string;
  message: string;
  filePath?: string;
  error?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}


export type ViewType =
  | 'DASHBOARD'
  | 'PRODUCTION_PHOTO'
  | 'PRODUCTION_VIDEO'
  | 'ACTIVITY_LOG'
  | 'CONFIG'
  | 'QUEUE';


export interface AIProviderConfig {
  id: string;
  name: string;
  provider: string;
  type: AIProviderType;
  model: string;
  baseUrl: string;
  apiKeyMasked?: string;
  isActive: boolean;
  isDefault: boolean;
  extraConfig?: Record<string, any>;
  createdAt: number;
}


export interface AppConfig {
  defaultTextAI?: string;
  defaultImageAI?: string;
  defaultVideoAI?: string;
}