import {
  WorkflowRow,
  VideoRow,
  ImageVersion,
  VideoVersion,
  ActivityLog
} from '../types';


export type StorageTable =
  | 'production'
  | 'news'
  | 'video';


export interface AIService {

  generateImage(
    prompt: string,
    referenceIds: string[],
    model: string
  ): Promise<ImageVersion>;


  generateVideo(
    prompt: string,
    firstFrameId: string,
    model: string
  ): Promise<VideoVersion>;


  generateText(
    prompt: string
  ): Promise<string>;

}


export interface StorageService {

  saveRow(
    row: WorkflowRow | VideoRow,
    table: StorageTable
  ): Promise<void>;


  loadRows(
    table: StorageTable
  ): Promise<any[]>;


  loadRow(
    id: string
  ): Promise<any>;


  deleteRow(
    id: string,
    table: StorageTable
  ): Promise<void>;

  importCSV(
    file: File
  ): Promise<{ status: string, imported: number }>;

}


export interface FileService {

  saveFile(
    base64: string,
    mimeType: string,
    filename: string,
    path: string
  ): Promise<void>;

}


export interface ActivityLogService {

  create(
    log: ActivityLog
  ): Promise<ActivityLog>;


  list(): Promise<ActivityLog[]>;


  update(
    id: string,
    patch: Partial<ActivityLog>
  ): Promise<ActivityLog>;


  delete(
    id: string
  ): Promise<void>;


  clear(): Promise<void>;

}


export interface JobService {
  enqueue(
    rowId: string,
    jobType: string,
    payload: any
  ): Promise<{ id: string, status: string }>;

  getJob(
    jobId: string
  ): Promise<any>;
}

export interface IService {

  ai: AIService;

  storage: StorageService;

  files: FileService;

  activity: ActivityLogService;

  jobs: JobService;

}