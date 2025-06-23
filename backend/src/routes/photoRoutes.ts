import { Hono } from 'hono';
import { getPhotos, uploadPhotos, deletePhoto } from '../controllers/photoController';

export const photoRouter = new Hono();

photoRouter.get('/', getPhotos); // 全写真一覧
photoRouter.post('/', uploadPhotos); // アルバムなし写真アップロード
photoRouter.delete('/:id', deletePhoto); // 写真削除

// ここに写真関連のルーティングを追加していく 