import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import type { FileWithPath, FileUploadItem, BatchUploadState, EncodedFile } from '../types/upload';

const MAX_RETRY_COUNT = 3;

// uuidの代わりに使用するシンプルなID生成関数
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useBatchFileUpload = (customId?: string, onSuccess?: () => void) => {
  const [uploadState, setUploadState] = useState<BatchUploadState>({
    files: [],
    totalFiles: 0,
    completedFiles: 0,
    isUploading: false,
    allCompleted: false,
  });

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

  const uploadSingleFile = async (fileItem: FileUploadItem): Promise<void> => {
    try {
      // ファイルのステータスを'uploading'に更新
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 10 }
            : f
        )
      }));

      // Base64エンコード
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress: 30 }
            : f
        )
      }));

      const encodedFile = await fileToBase64(fileItem.file);

      // アップロード開始
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress: 70 }
            : f
        )
      }));

      const url = customId 
        ? `/api/albums/${customId}/photos/single` 
        : '/api/photos/single';
      
      const response = await axios.post(url, encodedFile);

      if (response.status !== 201) {
        throw new Error('アップロードに失敗しました');
      }

      // 成功時の更新
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ),
        completedFiles: prev.completedFiles + 1
      }));

    } catch (error: unknown) {
      let errorMessage = 'アップロードエラーが発生しました';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || 'サーバーエラーが発生しました';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // エラー時の更新
      setUploadState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', progress: 0, error: errorMessage }
            : f
        ),
        completedFiles: prev.completedFiles + 1
      }));
    }
  };

  const setFiles = useCallback((files: FileWithPath[]) => {
    const fileItems: FileUploadItem[] = files.map(file => ({
      id: generateId(),
      file,
      status: 'pending' as const,
      progress: 0,
      retryCount: 0,
    }));

    setUploadState({
      files: fileItems,
      totalFiles: files.length,
      completedFiles: 0,
      isUploading: false,
      allCompleted: false,
    });
  }, []);

  const startUpload = async (): Promise<void> => {
    if (uploadState.files.length === 0) {
      notifications.show({ 
        title: 'ファイルがありません', 
        message: 'アップロードするファイルを選択してください。', 
        color: 'red' 
      });
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true, completedFiles: 0 }));

    // ファイルを1つずつ順番にアップロード
    for (const fileItem of uploadState.files) {
      if (fileItem.status === 'pending') {
        await uploadSingleFile(fileItem);
      }
    }

    // 全ファイルの処理完了後の処理
    setUploadState(prev => {
      const successCount = prev.files.filter(f => f.status === 'success').length;
      const errorCount = prev.files.filter(f => f.status === 'error').length;
      
      if (successCount > 0) {
        notifications.show({ 
          title: 'アップロード完了', 
          message: `${successCount}個のファイルがアップロードされました。${errorCount > 0 ? `${errorCount}個のファイルでエラーが発生しました。` : ''}`, 
          color: errorCount > 0 ? 'yellow' : 'green' 
        });
      }

      if (errorCount === 0 && onSuccess) {
        onSuccess();
      }

      return {
        ...prev,
        isUploading: false,
        allCompleted: true
      };
    });
  };

  const retryFile = async (fileId: string): Promise<void> => {
    const fileItem = uploadState.files.find(f => f.id === fileId);
    if (!fileItem || fileItem.retryCount >= MAX_RETRY_COUNT) {
      return;
    }

    // リトライ回数を増やしてステータスをリセット
    setUploadState(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === fileId 
          ? { ...f, status: 'pending', progress: 0, error: undefined, retryCount: f.retryCount + 1 }
          : f
      ),
      completedFiles: prev.completedFiles - 1
    }));

    const updatedFileItem = { ...fileItem, retryCount: fileItem.retryCount + 1 };
    await uploadSingleFile(updatedFileItem);
  };

  const clearFiles = useCallback(() => {
    setUploadState({
      files: [],
      totalFiles: 0,
      completedFiles: 0,
      isUploading: false,
      allCompleted: false,
    });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setUploadState(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId),
      totalFiles: prev.totalFiles - 1
    }));
  }, []);

  return {
    uploadState,
    setFiles,
    startUpload,
    retryFile,
    clearFiles,
    removeFile,
  };
}; 