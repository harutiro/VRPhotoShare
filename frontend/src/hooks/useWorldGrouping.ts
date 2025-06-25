import { useMemo } from 'react';
import type { Photo, WorldGroup } from '../types/photo';

export const useWorldGrouping = (photos: Photo[]): WorldGroup => {
  return useMemo(() => {
    // ワールド情報がない写真に近傍ワールド名を割り当て（dateベース）
    const assignedPhotos = photos.map((photo, _idx, arr) => {
      let worldName = 'ワールド情報なし';
      let hasWorld = false;
      let photoDate: Date | null = null;
      
      if (photo.image_data) {
        try {
          const meta = JSON.parse(photo.image_data);
          if (meta && meta.world && meta.world.name) {
            worldName = meta.world.name;
            hasWorld = true;
          }
          if (meta && meta.date) {
            photoDate = new Date(meta.date);
          }
        } catch (e) { 
          void e; /* メタデータ不正時は無視 */ 
        }
      }
      
      if (!hasWorld && photoDate) {
        // 他のワールド情報あり写真のdateと最も近いものを探す
        let minDiff = Infinity;
        let nearestWorld: string | null = null;
        
        arr.forEach((other) => {
          if (other.image_data) {
            try {
              const meta = JSON.parse(other.image_data);
              if (meta && meta.world && meta.world.name && meta.date) {
                const otherDate = new Date(meta.date);
                const diff = Math.abs(photoDate.getTime() - otherDate.getTime());
                if (diff < minDiff) {
                  minDiff = diff;
                  nearestWorld = meta.world.name;
                }
              }
            } catch (e) { 
              void e; 
            }
          }
        });
        
        if (nearestWorld) {
          worldName = nearestWorld;
        }
      }
      
      return { ...photo, _assignedWorld: worldName };
    });

    // ワールドごとにグループ化
    const worldGroups: WorldGroup = {};
    assignedPhotos.forEach((photo) => {
      const worldName = photo._assignedWorld || 'ワールド情報なし';
      if (!worldGroups[worldName]) worldGroups[worldName] = [];
      worldGroups[worldName].push(photo);
    });

    return worldGroups;
  }, [photos]);
}; 