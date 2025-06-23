import { Hono } from 'hono';
import { getAlbums, createAlbum, getAlbumDetail, updateAlbum, deleteAlbum } from '../controllers/albumController';
import { getAlbumPhotos, uploadAlbumPhotos } from '../controllers/photoController';

export const albumRouter = new Hono();

albumRouter.get('/', getAlbums); // 一覧取得
albumRouter.post('/', createAlbum); // 作成
albumRouter.get('/:custom_id', getAlbumDetail); // 詳細取得
albumRouter.put('/:custom_id', updateAlbum); // 更新
albumRouter.delete('/:custom_id', deleteAlbum); // 削除

albumRouter.get('/:custom_id/photos', getAlbumPhotos); // アルバム内写真一覧
albumRouter.post('/:custom_id/photos', uploadAlbumPhotos); // アルバム内写真アップロード

// ここにアルバム関連のルーティングを追加していく 