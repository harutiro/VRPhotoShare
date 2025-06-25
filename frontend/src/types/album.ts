export interface ViewedAlbum {
  custom_id: string;
  name: string;
  viewedAt: string;
}

export interface AlbumThumbnail {
  id: number;
  name: string;
  url: string;
  thumbnailUrl?: string;
} 