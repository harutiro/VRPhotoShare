import type { AlbumThumbnail } from '../types/album';

export const fetchAlbumThumbnail = async (customId: string): Promise<AlbumThumbnail | null> => {
  try {
    const response = await fetch(`/api/albums/${customId}/thumbnail`);
    if (response.ok) {
      const thumbnail = await response.json();
      return thumbnail;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching thumbnail for ${customId}:`, error);
    return null;
  }
};

export const checkAlbumExists = async (albumId: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/albums/${albumId.trim()}`);
    return res.ok;
  } catch {
    return false;
  }
}; 