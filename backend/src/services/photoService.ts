import * as photoRepo from '../repositories/photoRepository';
import { v4 as uuidv4 } from 'uuid';
import { minio, MINIO_BUCKET } from '../utils/minioClient';
import { extractPngPackage } from '../utils/pngMeta';

export const fetchPhotos = async (sort: string) => {
  return await photoRepo.getAllPhotos(sort);
};

export const fetchAlbumPhotos = async (custom_id: string, sort: string) => {
  return await photoRepo.getPhotosByAlbumCustomId(custom_id, sort);
};

export const uploadNewPhotos = async (photos: any[]) => {
  // MinIO保存・メタデータ抽出・DB登録
  return await photoRepo.insertPhotos(photos);
};

export const uploadNewAlbumPhotos = async (custom_id: string, photos: any[]) => {
  // MinIO保存・メタデータ抽出・DB登録
  return await photoRepo.insertAlbumPhotos(custom_id, photos);
};

// 単一ファイルアップロード用の新しい関数
export const uploadSinglePhoto = async (photo: any) => {
  // 1つの写真をアップロード
  return await photoRepo.insertPhotos([photo]);
};

export const uploadSingleAlbumPhoto = async (custom_id: string, photo: any) => {
  // アルバムに1つの写真をアップロード
  return await photoRepo.insertAlbumPhotos(custom_id, [photo]);
};

export const removePhoto = async (id: number) => {
  return await photoRepo.deletePhotoById(id);
};

export const fetchAlbumThumbnail = async (custom_id: string) => {
  return await photoRepo.getAlbumThumbnail(custom_id);
}; 