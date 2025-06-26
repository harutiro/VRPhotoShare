import { useMemo } from 'react';
import type { Photo, WorldGroup } from '../types/photo';

export const useWorldGrouping = (photos: Photo[]): WorldGroup => {
  return useMemo(() => {
    // ワールドごとにグループ化（バックエンドで自動補完済み）
    const worldGroups: WorldGroup = {};
    
    photos.forEach((photo) => {
      let worldName = 'ワールド情報なし';
      
      if (photo.image_data) {
        try {
          const meta = JSON.parse(photo.image_data);
          if (meta && meta.world && meta.world.name) {
            worldName = meta.world.name;
          }
        } catch (e) { 
          void e; /* メタデータ不正時は無視 */ 
        }
      }
      
      if (!worldGroups[worldName]) {
        worldGroups[worldName] = [];
      }
      
      // 写真をグループに追加
      const enhancedPhoto = { 
        ...photo, 
        _assignedWorld: worldName
      };
      
      worldGroups[worldName].push(enhancedPhoto);
    });

    return worldGroups;
  }, [photos]);
}; 