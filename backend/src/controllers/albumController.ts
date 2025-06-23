import { Context } from 'hono';
import * as albumService from '../services/albumService';

export const getAlbums = async (c: Context) => {
  try {
    const albums = await albumService.fetchAlbums();
    return c.json(albums);
  } catch (error) {
    console.error('Failed to fetch albums:', error);
    return c.json({ error: 'Failed to fetch albums' }, 500);
  }
};

export const createAlbum = async (c: Context) => {
  try {
    const { custom_id, name } = await c.req.json<{ custom_id: string, name: string }>();
    if (!custom_id || !name) {
      return c.json({ error: 'Album name and ID are required' }, 400);
    }
    const album = await albumService.createNewAlbum(custom_id, name);
    return c.json(album, 201);
  } catch (error: any) {
    if (error.code === '23505') {
      return c.json({ error: 'This album ID is already taken.' }, 409);
    }
    console.error('Failed to create album:', error);
    return c.json({ error: 'Failed to create album' }, 500);
  }
};

export const getAlbumDetail = async (c: Context) => {
  try {
    const { custom_id } = c.req.param();
    const album = await albumService.fetchAlbumDetail(custom_id);
    if (!album) {
      return c.json({ error: 'Album not found' }, 404);
    }
    return c.json(album);
  } catch (error) {
    console.error('Failed to fetch album:', error);
    return c.json({ error: 'Failed to fetch album' }, 500);
  }
};

export const updateAlbum = async (c: Context) => {
  try {
    const { custom_id } = c.req.param();
    const { name } = await c.req.json<{ name: string }>();
    if (!name) {
      return c.json({ error: 'Album name is required' }, 400);
    }
    const album = await albumService.updateAlbumName(custom_id, name);
    if (!album) {
      return c.json({ error: 'Album not found' }, 404);
    }
    return c.json(album);
  } catch (error) {
    console.error('Failed to update album name:', error);
    return c.json({ error: 'Failed to update album name' }, 500);
  }
};

export const deleteAlbum = async (c: Context) => {
  try {
    const { custom_id } = c.req.param();
    const result = await albumService.removeAlbum(custom_id);
    if (!result) {
      return c.json({ error: 'Album not found' }, 404);
    }
    return c.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Failed to delete album:', error);
    return c.json({ error: 'Failed to delete album' }, 500);
  }
}; 