import { useState, useEffect } from 'react';
import type { Album, Photo } from '../types/photo';

export const useAlbumData = (customId: string | undefined, sortOrder: 'asc' | 'desc') => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      if (!customId) return;

      try {
        setLoading(true);
        setError(null);
        
        const albumResponse = await fetch(`/api/albums/${customId}`);
        if (albumResponse.status === 404) {
          throw new Error('Album not found. Check the ID and try again.');
        }
        if (!albumResponse.ok) {
          throw new Error('Failed to fetch album details.');
        }
        const albumData = await albumResponse.json();
        setAlbum(albumData);

        // 閲覧履歴をlocalStorageに保存
        const viewedAlbum = {
          custom_id: albumData.custom_id,
          name: albumData.name,
          viewedAt: new Date().toISOString()
        };
        
        // 既存の閲覧履歴を取得
        const existingHistory = localStorage.getItem('viewedAlbums');
        let history: typeof viewedAlbum[] = existingHistory ? JSON.parse(existingHistory) : [];
        
        // 同じアルバムがあれば削除（重複を避けるため）
        history = history.filter(item => item.custom_id !== albumData.custom_id);
        
        // 新しいアルバムを先頭に追加
        history.unshift(viewedAlbum);
        
        // 最大10件まで保持
        history = history.slice(0, 10);
        
        // localStorageに保存
        localStorage.setItem('viewedAlbums', JSON.stringify(history));

        const photosResponse = await fetch(`/api/albums/${customId}/photos?sort=${sortOrder}`);
        if (!photosResponse.ok) {
            throw new Error('Failed to fetch photos for the album.');
        }
        const photosData = await photosResponse.json();
        setPhotos(photosData);

      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [customId, sortOrder]);

  return {
    album,
    photos,
    loading,
    error,
    setAlbum,
    setPhotos
  };
}; 