import { useState } from 'react';
import type { Photo } from '../types/photo';

export const usePhotoSelection = (photos: Photo[]) => {
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);

  const handleSelectionChange = (id: number, checked: boolean) => {
    setSelectedPhotos((prev) =>
      checked ? [...prev, id] : prev.filter((photoId) => photoId !== id)
    );
  };

  const allSelected = photos.length > 0 && selectedPhotos.length === photos.length;
  const isIndeterminate = selectedPhotos.length > 0 && selectedPhotos.length < photos.length;

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedPhotos(photos.map((p) => p.id));
    } else {
      setSelectedPhotos([]);
    }
  };

  return {
    selectedPhotos,
    setSelectedPhotos,
    handleSelectionChange,
    allSelected,
    isIndeterminate,
    handleSelectAllChange
  };
}; 