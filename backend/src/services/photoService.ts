import * as photoRepo from '../repositories/photoRepository';

export const fetchPhotos = async (sort: string) => {
  return await photoRepo.getAllPhotos(sort);
};

export const fetchAlbumPhotos = async (custom_id: string, sort: string) => {
  return await photoRepo.getPhotosByAlbumCustomId(custom_id, sort);
};

export const uploadNewPhotos = async (photos: any[]) => {
  // MinIO保存・メタデータ抽出・DB登録
  const result = await photoRepo.insertPhotos(photos);
  
  // アップロード成功時にワールド情報の自動補完を実行
  if (!result.error) {
    await updateWorldInfoForAllPhotos();
  }
  
  return result;
};

export const uploadNewAlbumPhotos = async (custom_id: string, photos: any[]) => {
  // MinIO保存・メタデータ抽出・DB登録
  const result = await photoRepo.insertAlbumPhotos(custom_id, photos);
  
  // アップロード成功時にワールド情報の自動補完を実行
  if (!result.error) {
    await updateWorldInfoForAlbumPhotos(custom_id);
  }
  
  return result;
};

// 単一ファイルアップロード用の新しい関数
export const uploadSinglePhoto = async (photo: any) => {
  // 1つの写真をアップロード
  const result = await photoRepo.insertPhotos([photo]);
  
  // アップロード成功時にワールド情報の自動補完を実行
  if (!result.error) {
    await updateWorldInfoForAllPhotos();
  }
  
  return result;
};

export const uploadSingleAlbumPhoto = async (custom_id: string, photo: any) => {
  // アルバムに1つの写真をアップロード
  const result = await photoRepo.insertAlbumPhotos(custom_id, [photo]);
  
  // アップロード成功時にワールド情報の自動補完を実行
  if (!result.error) {
    await updateWorldInfoForAlbumPhotos(custom_id);
  }
  
  return result;
};

// 全写真のワールド情報を自動補完する関数（エクスポート）
export const updateWorldInfoForAllPhotos = async () => {
  try {
    await photoRepo.updateWorldInfoForPhotos(null);
  } catch (error) {
    console.error('Failed to update world info for all photos:', error);
    throw error;
  }
};

// アルバム内写真のワールド情報を自動補完する関数（エクスポート）
export const updateWorldInfoForAlbumPhotos = async (custom_id: string) => {
  try {
    await photoRepo.updateWorldInfoForPhotos(custom_id);
  } catch (error) {
    console.error(`Failed to update world info for album ${custom_id}:`, error);
    throw error;
  }
};

export const removePhoto = async (id: number) => {
  return await photoRepo.deletePhotoById(id);
};

export const fetchAlbumThumbnail = async (custom_id: string) => {
  return await photoRepo.getAlbumThumbnail(custom_id);
}; 