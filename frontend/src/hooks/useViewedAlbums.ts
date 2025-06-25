import { useState, useEffect } from 'react';
import type { ViewedAlbum } from '../types/album';

export const useViewedAlbums = () => {
  const [viewedAlbums, setViewedAlbums] = useState<ViewedAlbum[]>([]);

  const getViewedAlbums = (): ViewedAlbum[] => {
    try {
      const history = localStorage.getItem('viewedAlbums');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const albums = getViewedAlbums();
    setViewedAlbums(albums);
  }, []);

  return { viewedAlbums, setViewedAlbums };
}; 