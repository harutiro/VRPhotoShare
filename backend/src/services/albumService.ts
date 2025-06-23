import * as albumRepo from '../repositories/albumRepository';

export const fetchAlbums = async () => {
  return await albumRepo.getAllAlbums();
};

export const createNewAlbum = async (custom_id: string, name: string) => {
  return await albumRepo.insertAlbum(custom_id, name);
};

export const fetchAlbumDetail = async (custom_id: string) => {
  return await albumRepo.getAlbumByCustomId(custom_id);
};

export const updateAlbumName = async (custom_id: string, name: string) => {
  return await albumRepo.updateAlbumByCustomId(custom_id, name);
};

export const removeAlbum = async (custom_id: string) => {
  return await albumRepo.deleteAlbumByCustomId(custom_id);
}; 