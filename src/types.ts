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
  | 'NEWS'
  | 'VIDEO'
  | 'SYSTEM';


export type ActivityType =
  | 'CREATE_IMAGE'
  | 'REGENERATE_IMAGE'
  | 'SAVE_IMAGE'
  | 'CREATE_CAPTION'
  | 'SAVE_CAPTION'
  | 'CREATE_VIDEO'
  | 'SAVE_VIDEO'
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

  // Số thứ tự dùng chung cho file final:
  // 001.png
  // 001.txt
  // 001.mp4 (chỉ production)
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

  // Thư mục lưu file final
  savePath: string;

  isDone: boolean;

  status: JobStatus;

  error: string;

  createdAt: number;
}


export interface VideoRow {
  // Map trực tiếp với WorkflowRow thuộc SẢN XUẤT.
  // NEWS không được map vào Video.
  id: string;

  stt: string;

  videoPrompt: string;

  videoVersions: VideoVersion[];

  currentVideoIndex: number;

  status: JobStatus;

  // Người dùng phải xem video trước,
  // sau đó tự xác nhận mới được lưu.
  saveConfirmed: boolean;

  isDone: boolean;

  savePath: string;

  error: string;
}


export interface ActivityLog {
  id: string;

  // SẢN XUẤT / LÀM BÁO / VIDEO / HỆ THỐNG
  module: ActivityModule;

  // Hành động đã thực hiện
  type: ActivityType;

  // Trạng thái của hành động
  status: ActivityStatus;

  // ID của row nguồn nếu hoạt động thuộc một row
  rowId?: string;

  // STT để đối chiếu:
  // 001 / 002 / 003...
  stt?: string;

  // Tên nhân vật hoặc chủ thể
  subject?: string;

  // Nội dung mô tả ngắn hoạt động
  message: string;

  // Đường dẫn file nếu có
  filePath?: string;

  // Nội dung lỗi nếu thất bại
  error?: string;

  // Note cho CRUD thủ công trong màn hình lịch sử
  note?: string;

  createdAt: number;

  updatedAt: number;
}


export type ViewType =
  | 'DASHBOARD'
  | 'PRODUCTION_PHOTO'
  | 'PRODUCTION_VIDEO'
  | 'NEWS_PHOTO'
  | 'ACTIVITY_LOG'
  | 'CONFIG';


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

  createdAt: number;
}


export interface AppConfig {
  defaultTextAI?: string;

  defaultImageAI?: string;

  defaultVideoAI?: string;
}