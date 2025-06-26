import { Context } from 'hono';
import * as photoService from '../services/photoService';

export const getPhotos = async (c: Context) => {
  const sort = (c.req.query('sort') || 'desc').toLowerCase();
  const photos = await photoService.fetchPhotos(sort);
  return c.json(photos);
};

export const getAlbumPhotos = async (c: Context) => {
  const { custom_id } = c.req.param();
  const sort = (c.req.query('sort') || 'desc').toLowerCase();
  const photos = await photoService.fetchAlbumPhotos(custom_id, sort);
  return c.json(photos);
};

export const uploadPhotos = async (c: Context) => {
  const photos = await c.req.json();
  const result = await photoService.uploadNewPhotos(photos);
  return c.json(result, 201);
};

export const uploadAlbumPhotos = async (c: Context) => {
  const { custom_id } = c.req.param();
  const photos = await c.req.json();
  const result = await photoService.uploadNewAlbumPhotos(custom_id, photos);
  return c.json(result, 201);
};

// 単一ファイルアップロード用のエンドポイント
export const uploadSinglePhoto = async (c: Context) => {
  const photo = await c.req.json();
  const result = await photoService.uploadSinglePhoto(photo);
  return c.json(result, 201);
};

export const uploadSingleAlbumPhoto = async (c: Context) => {
  const { custom_id } = c.req.param();
  const photo = await c.req.json();
  const result = await photoService.uploadSingleAlbumPhoto(custom_id, photo);
  return c.json(result, 201);
};

export const deletePhoto = async (c: Context) => {
  const { id } = c.req.param();
  const result = await photoService.removePhoto(Number(id));
  return c.json(result, 200);
};

export const getAlbumThumbnail = async (c: Context) => {
  const { custom_id } = c.req.param();
  const thumbnail = await photoService.fetchAlbumThumbnail(custom_id);
  if (!thumbnail) {
    return c.json({ error: 'No photos found in this album' }, 404);
  }
  return c.json(thumbnail);
}; 