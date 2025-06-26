import { Hono } from 'hono';
import { getPhotos, uploadPhotos, deletePhoto, uploadSinglePhoto, updateWorldInfo } from '../controllers/photoController';

export const photoRouter = new Hono();

photoRouter.get('/', getPhotos); // 全写真一覧
photoRouter.post('/', uploadPhotos); // アルバムなし写真アップロード（一括）
photoRouter.post('/single', uploadSinglePhoto); // アルバムなし写真アップロード（単一）
photoRouter.patch('/world-info', updateWorldInfo); // ワールド情報手動補完
photoRouter.delete('/:id', deletePhoto); // 写真削除

// ここに写真関連のルーティングを追加していく 