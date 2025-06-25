import { useState, useEffect, useCallback } from 'react';
import type { ViewedAlbum } from '../types/album';

export const useViewedAlbums = () => {
  const [viewedAlbums, setViewedAlbums] = useState<ViewedAlbum[]>([]);

  const getViewedAlbums = useCallback((): ViewedAlbum[] => {
    try {
      const history = localStorage.getItem('viewedAlbums');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }, []);

  const saveViewedAlbums = useCallback((albums: ViewedAlbum[]): void => {
    try {
      localStorage.setItem('viewedAlbums', JSON.stringify(albums));
      setViewedAlbums(albums);
      // カスタムイベントを発火して他のコンポーネントに変更を通知
      window.dispatchEvent(new CustomEvent('viewedAlbumsChanged'));
    } catch (error) {
      console.error('Failed to save viewed albums:', error);
    }
  }, []);

  const addToViewedAlbums = useCallback((album: ViewedAlbum): void => {
    const currentAlbums = getViewedAlbums();
    const filtered = currentAlbums.filter(a => a.custom_id !== album.custom_id);
    const updated = [album, ...filtered].slice(0, 10);
    saveViewedAlbums(updated);
  }, [getViewedAlbums, saveViewedAlbums]);

  const removeFromViewedAlbums = useCallback((customId: string): void => {
    console.log('閲覧履歴からアルバムを削除:', customId);
    const currentAlbums = getViewedAlbums();
    console.log('削除前の閲覧履歴:', currentAlbums);
    const filtered = currentAlbums.filter(album => album.custom_id !== customId);
    console.log('削除後の閲覧履歴:', filtered);
    saveViewedAlbums(filtered);
  }, [getViewedAlbums, saveViewedAlbums]);

  // 初期化時とlocalStorageの変更を監視
  useEffect(() => {
    const loadAlbums = () => {
      const albums = getViewedAlbums();
      setViewedAlbums(albums);
    };

    // 初期読み込み
    loadAlbums();

    // カスタムイベントを監視
    const handleViewedAlbumsChanged = () => {
      loadAlbums();
    };

    window.addEventListener('viewedAlbumsChanged', handleViewedAlbumsChanged);
    
    // storageイベントも監視（他のタブでの変更を検知）
    window.addEventListener('storage', handleViewedAlbumsChanged);

    return () => {
      window.removeEventListener('viewedAlbumsChanged', handleViewedAlbumsChanged);
      window.removeEventListener('storage', handleViewedAlbumsChanged);
    };
  }, [getViewedAlbums]);

  return { 
    viewedAlbums, 
    setViewedAlbums,
    addToViewedAlbums,
    removeFromViewedAlbums
  };
}; 