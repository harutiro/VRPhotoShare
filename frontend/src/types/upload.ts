import type { FileWithPath } from '@mantine/dropzone';

export interface EncodedFile {
  name: string;
  data: string;
}

export interface UploadState {
  files: FileWithPath[];
  uploading: boolean;
}

export { type FileWithPath }; 