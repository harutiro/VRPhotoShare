import { useState, useEffect, useMemo } from 'react';
import type { ViewedAlbum, AlbumThumbnail } from '../types/album';
import { fetchAlbumThumbnail } from '../utils/albumApi';

export const useAlbumThumbnails = (
  viewedAlbums: ViewedAlbum[], 
  removeFromViewedAlbums?: (customId: string) => void
) => {
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
      const failedAlbums: string[] = [];
      
      for (const album of viewedAlbums.slice(0, 6)) {
        try {
          // サムネイル取得を試行
          const response = await fetch(`/api/albums/${album.custom_id}/thumbnail`);
          if (response.status === 404) {
            // アルバムが存在しない場合は閲覧履歴から削除
            console.log('アルバムが存在しないため閲覧履歴から削除:', album.custom_id);
            failedAlbums.push(album.custom_id);
            continue;
          }
          
          if (response.ok) {
            const thumbnail = await response.json();
            thumbnails[album.custom_id] = thumbnail;
          } else {
            thumbnails[album.custom_id] = null;
          }
        } catch (error) {
          console.error(`サムネイル取得エラー for ${album.custom_id}:`, error);
          thumbnails[album.custom_id] = null;
        }
        
        // 1つずつ更新して即座に反映
        setAlbumThumbnails(prev => ({ ...prev, [album.custom_id]: thumbnails[album.custom_id] }));
      }
      
      // 削除されたアルバムを閲覧履歴から除去
      if (failedAlbums.length > 0 && removeFromViewedAlbums) {
        console.log('閲覧履歴から削除されるアルバム:', failedAlbums);
        failedAlbums.forEach(customId => {
          removeFromViewedAlbums(customId);
        });
      }
    };

    // 少し遅延を入れてからサムネイルを読み込む
    const timeoutId = setTimeout(loadThumbnails, 100);
    return () => clearTimeout(timeoutId);
  }, [albumIds, viewedAlbums, removeFromViewedAlbums]);

  return albumThumbnails;
}; 