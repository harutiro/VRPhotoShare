import type { FileWithPath } from '@mantine/dropzone';

export interface EncodedFile {
  name: string;
  data: string;
}

export interface UploadState {
  files: FileWithPath[];
  uploading: boolean;
}

// ファイルごとのアップロード状況を管理するための型定義
export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface FileUploadItem {
  id: string;
  file: FileWithPath;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  retryCount: number;
}

export interface BatchUploadState {
  files: FileUploadItem[];
  totalFiles: number;
  completedFiles: number;
  isUploading: boolean;
  allCompleted: boolean;
}

export { type FileWithPath }; 