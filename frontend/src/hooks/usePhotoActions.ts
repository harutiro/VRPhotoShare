import { useState, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Photo, Album } from '../types/photo';

// ダウンロード進捗の型定義
export interface DownloadProgress {
  currentStep: 'downloading' | 'zipping' | 'saving' | 'completed';
  totalPhotos: number;
  completedPhotos: number;
  currentPhotoName: string;
  overallProgress: number; // 0-100
  isActive: boolean;
  canCancel: boolean;
}

export const usePhotoActions = (
  photos: Photo[], 
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>,
  album: Album | null,
  setSelectedPhotos: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [isZipping, setIsZipping] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    currentStep: 'downloading',
    totalPhotos: 0,
    completedPhotos: 0,
    currentPhotoName: '',
    overallProgress: 0,
    isActive: false,
    canCancel: true
  });

  // AbortControllerを管理するためのref
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDelete = async (photoId: number) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete photo.');
      
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSelectedPhotos(prev => prev.filter(id => id !== photoId));
      notifications.show({ title: 'Success', message: 'Photo deleted.', color: 'green' });

    } catch (err) {
      if (err instanceof Error) {
        notifications.show({ title: 'Error', message: err.message, color: 'red' });
      } else {
        notifications.show({ title: 'Error', message: "An unknown error occurred", color: 'red' });
      }
    }
  };

  const handleIndividualDownload = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ダウンロードをキャンセルする関数
  const cancelDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsZipping(false);
    setDownloadProgress(prev => ({ ...prev, isActive: false }));
    notifications.show({ 
      title: 'キャンセル', 
      message: 'ダウンロードがキャンセルされました', 
      color: 'orange' 
    });
  }, []);

  const handleBulkDownload = async (selectedPhotos: number[]) => {
    if (selectedPhotos.length === 0) return;

    // AbortControllerを作成
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsZipping(true);
    const photosToDownload = photos.filter(p => selectedPhotos.includes(p.id));
    
    // 進捗状態を初期化
    setDownloadProgress({
      currentStep: 'downloading',
      totalPhotos: photosToDownload.length,
      completedPhotos: 0,
      currentPhotoName: '',
      overallProgress: 0,
      isActive: true,
      canCancel: true
    });

    try {
      const zip = new JSZip();
      
      // 写真をダウンロードしてZIPに追加
      for (let i = 0; i < photosToDownload.length; i++) {
        const photo = photosToDownload[i];
        
        // キャンセルチェック
        if (signal.aborted) {
          throw new Error('Download cancelled');
        }

        // 現在の写真の進捗を更新
        setDownloadProgress(prev => ({
          ...prev,
          currentPhotoName: photo.name,
          completedPhotos: i,
          overallProgress: Math.round((i / photosToDownload.length) * 70) // ダウンロードは全体の70%
        }));

        try {
          const response = await fetch(photo.url, { signal });
          if (!response.ok) {
            throw new Error(`Failed to download ${photo.name}`);
          }
          const blob = await response.blob();
          zip.file(photo.name, blob);
        } catch (fetchError) {
          if (signal.aborted) {
            throw new Error('Download cancelled');
          }
          console.warn(`Failed to download ${photo.name}:`, fetchError);
          // 個別の写真ダウンロード失敗は続行
        }
      }

      // ZIP作成フェーズ
      setDownloadProgress(prev => ({
        ...prev,
        currentStep: 'zipping',
        completedPhotos: photosToDownload.length,
        currentPhotoName: 'ZIPファイルを作成中...',
        overallProgress: 70,
        canCancel: false // ZIP作成中はキャンセル不可
      }));

      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // 保存フェーズ
      setDownloadProgress(prev => ({
        ...prev,
        currentStep: 'saving',
        currentPhotoName: 'ファイルを保存中...',
        overallProgress: 90
      }));

      saveAs(content, `${album?.name || 'album'}.zip`);

      // 完了
      setDownloadProgress(prev => ({
        ...prev,
        currentStep: 'completed',
        currentPhotoName: 'ダウンロード完了',
        overallProgress: 100
      }));

      notifications.show({ 
        title: '成功', 
        message: `${photosToDownload.length}枚の写真をダウンロードしました`, 
        color: 'green' 
      });

      // 2秒後に進捗表示を非表示
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, isActive: false }));
      }, 2000);
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Download cancelled') {
        // キャンセルは既にcancelDownload関数で処理済み
        return;
      }
      
      setDownloadProgress(prev => ({ ...prev, isActive: false }));
      notifications.show({ 
        title: 'エラー', 
        message: 'ZIPファイルの作成に失敗しました', 
        color: 'red' 
      });
    } finally {
      setIsZipping(false);
      abortControllerRef.current = null;
    }
  };

  return {
    isZipping,
    downloadProgress,
    handleDelete,
    handleIndividualDownload,
    handleBulkDownload,
    cancelDownload
  };
}; 