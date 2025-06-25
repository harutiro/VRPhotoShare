import { useState, useEffect, useMemo } from 'react';
import type { ViewedAlbum, AlbumThumbnail } from '../types/album';
import { fetchAlbumThumbnail } from '../utils/albumApi';

export const useAlbumThumbnails = (viewedAlbums: ViewedAlbum[]) => {
  const [albumThumbnails, setAlbumThumbnails] = useState<Record<string, AlbumThumbnail | null>>({});

  // viewedAlbumsが変更された時にのみ再計算
  const albumIds = useMemo(
    () => viewedAlbums.slice(0, 6).map(album => album.custom_id).join(','),
    [viewedAlbums]
  );

  useEffect(() => {
    const loadThumbnails = async () => {
      if (viewedAlbums.length === 0) {
        setAlbumThumbnails({});
        return;
      }

      // 現在のサムネイルをクリア
      setAlbumThumbnails({});
      
      const thumbnails: Record<string, AlbumThumbnail | null> = {};
      
      for (const album of viewedAlbums.slice(0, 6)) {
        const thumbnail = await fetchAlbumThumbnail(album.custom_id);
        thumbnails[album.custom_id] = thumbnail;
        // 1つずつ更新して即座に反映
        setAlbumThumbnails(prev => ({ ...prev, [album.custom_id]: thumbnail }));
      }
    };

    // 少し遅延を入れてからサムネイルを読み込む
    const timeoutId = setTimeout(loadThumbnails, 100);
    return () => clearTimeout(timeoutId);
  }, [albumIds, viewedAlbums]);

  return albumThumbnails;
}; 