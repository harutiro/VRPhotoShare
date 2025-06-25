import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Photo, Album } from '../types/photo';

export const usePhotoActions = (
  photos: Photo[], 
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>,
  album: Album | null,
  setSelectedPhotos: React.Dispatch<React.SetStateAction<number[]>>
) => {
  const [isZipping, setIsZipping] = useState(false);

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

  const handleBulkDownload = async (selectedPhotos: number[]) => {
    if (selectedPhotos.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const photosToDownload = photos.filter(p => selectedPhotos.includes(p.id));

      for (const photo of photosToDownload) {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        zip.file(photo.name, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${album?.name || 'album'}.zip`);
      
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to create ZIP file.', color: 'red' });
    } finally {
      setIsZipping(false);
    }
  };

  return {
    isZipping,
    handleDelete,
    handleIndividualDownload,
    handleBulkDownload
  };
}; 