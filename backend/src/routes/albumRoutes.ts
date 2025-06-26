import { Hono } from 'hono';
import { getAlbums, createAlbum, getAlbumDetail, updateAlbum, deleteAlbum } from '../controllers/albumController';
import { getAlbumPhotos, uploadAlbumPhotos, getAlbumThumbnail, uploadSingleAlbumPhoto, updateAlbumWorldInfo } from '../controllers/photoController';

export const albumRouter = new Hono();

albumRouter.get('/', getAlbums); // 一覧取得
albumRouter.post('/', createAlbum); // 作成
albumRouter.get('/:custom_id', getAlbumDetail); // 詳細取得
albumRouter.put('/:custom_id', updateAlbum); // 更新
albumRouter.delete('/:custom_id', deleteAlbum); // 削除

albumRouter.get('/:custom_id/photos', getAlbumPhotos); // アルバム内写真一覧
albumRouter.post('/:custom_id/photos', uploadAlbumPhotos); // アルバム内写真アップロード（一括）
albumRouter.post('/:custom_id/photos/single', uploadSingleAlbumPhoto); // アルバム内写真アップロード（単一）
albumRouter.patch('/:custom_id/photos/world-info', updateAlbumWorldInfo); // アルバム内ワールド情報手動補完
albumRouter.get('/:custom_id/thumbnail', getAlbumThumbnail); // アルバムサムネイル取得

// ここにアルバム関連のルーティングを追加していく 