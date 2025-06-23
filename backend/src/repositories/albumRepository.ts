import { pool } from '../db/pgPool';

export const getAllAlbums = async () => {
  const result = await pool.query('SELECT * FROM albums ORDER BY created_at DESC');
  return result.rows;
};

export const insertAlbum = async (custom_id: string, name: string) => {
  const result = await pool.query(
    'INSERT INTO albums (custom_id, name) VALUES ($1, $2) RETURNING *',
    [custom_id, name]
  );
  return result.rows[0];
};

export const getAlbumByCustomId = async (custom_id: string) => {
  const result = await pool.query('SELECT * FROM albums WHERE custom_id = $1', [custom_id]);
  return result.rows[0] || null;
};

export const updateAlbumByCustomId = async (custom_id: string, name: string) => {
  const result = await pool.query(
    'UPDATE albums SET name = $1 WHERE custom_id = $2 RETURNING *',
    [name, custom_id]
  );
  return result.rows[0] || null;
};

export const deleteAlbumByCustomId = async (custom_id: string) => {
  // まずアルバムID取得
  const albumResult = await pool.query('SELECT id FROM albums WHERE custom_id = $1', [custom_id]);
  if (albumResult.rows.length === 0) return null;
  const albumId = albumResult.rows[0].id;
  // 写真削除
  await pool.query('DELETE FROM photos WHERE album_id = $1', [albumId]);
  // アルバム削除
  await pool.query('DELETE FROM albums WHERE id = $1', [albumId]);
  return true;
}; 