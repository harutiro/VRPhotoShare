import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import type { FileWithPath, EncodedFile } from '../types/upload';

export const useFileUpload = (customId?: string, onSuccess?: () => void) => {
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileToBase64 = (file: File): Promise<EncodedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({
        name: file.name,
        data: (reader.result as string).split(',')[1]
      });
      reader.onerror = (error) => reject(error);
    });
  };

  const validateFiles = (): boolean => {
    if (files.length === 0) {
      notifications.show({ 
        title: 'ファイルがありません', 
        message: 'アップロードするファイルを選択してください。', 
        color: 'red' 
      });
      return false;
    }
    return true;
  };

  const uploadFiles = async (): Promise<void> => {
    if (!validateFiles()) return;

    setUploading(true);
    try {
      const encodedFiles = await Promise.all(files.map(fileToBase64));
      
      const url = customId ? `/api/albums/${customId}/photos` : '/api/photos';
      const response = await axios.post(url, encodedFiles);

      if (response.status !== 201) {
        const errorData = response.data;
        throw new Error(errorData.error || 'Upload failed due to a server error.');
      }

      notifications.show({ 
        title: 'アップロード成功', 
        message: 'すべての写真をアップロードしました！', 
        color: 'green' 
      });
      
      setFiles([]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred.';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || 'Server error occurred.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      notifications.show({ 
        title: 'アップロードエラー', 
        message: errorMessage, 
        color: 'red' 
      });
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = (): void => {
    setFiles([]);
  };

  const handleFileReject = (): void => {
    notifications.show({
      title: 'ファイルが拒否されました',
      message: '一部のファイルが拒否されました。画像で10MB以下か確認してください。',
      color: 'red'
    });
  };

  return {
    files,
    setFiles,
    uploading,
    uploadFiles,
    clearSelection,
    handleFileReject
  };
}; 