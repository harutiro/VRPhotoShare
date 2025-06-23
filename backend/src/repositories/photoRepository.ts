import { pool } from '../db/pgPool';
import { minio, MINIO_BUCKET } from '../utils/minioClient';
import { extractPngPackage } from '../utils/pngMeta';
import { v4 as uuidv4 } from 'uuid';

export const getAllPhotos = async (sort: string) => {
  const result = await pool.query(
    `SELECT id, filename as name, stored_filename, image_data FROM photos WHERE album_id IS NULL ORDER BY created_at ${sort.toUpperCase()}`
  );
  return result.rows.map(row => {
    const isProd = process.env.NODE_ENV === 'production';
    const url = isProd
      ? `/minio-api/${MINIO_BUCKET}/${row.stored_filename}`
      : `http://localhost:9000/${MINIO_BUCKET}/${row.stored_filename}`;
    let fileDate = null;
    if (row.image_data) {
      try {
        const meta = JSON.parse(row.image_data);
        if (meta && meta.date) fileDate = meta.date;
      } catch {}
    }
    return { id: row.id, name: row.name, url, image_data: row.image_data, file_date: fileDate };
  });
};

export const getPhotosByAlbumCustomId = async (custom_id: string, sort: string) => {
  const result = await pool.query(
    `SELECT p.id, p.filename as name, p.stored_filename, p.image_data, p.created_at
     FROM photos p
     JOIN albums a ON p.album_id = a.id
     WHERE a.custom_id = $1
     ORDER BY p.created_at ${sort.toUpperCase()}`,
    [custom_id]
  );
  return result.rows.map(row => {
    const isProd = process.env.NODE_ENV === 'production';
    const url = isProd
      ? `/minio-api/${MINIO_BUCKET}/${row.stored_filename}`
      : `http://localhost:9000/${MINIO_BUCKET}/${row.stored_filename}`;
    let fileDate = null;
    if (row.image_data) {
      try {
        const meta = JSON.parse(row.image_data);
        if (meta && meta.date) fileDate = meta.date;
      } catch {}
    }
    return { id: row.id, name: row.name, url, image_data: row.image_data, file_date: fileDate };
  });
};

export const insertPhotos = async (photos: any[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const photo of photos) {
      const { name, data } = photo;
      const ext = name.split('.').pop();
      const uuidName = `${uuidv4()}.${ext}`;
      const buffer = Buffer.from(data, 'base64');
      let imageMeta: string | null = null;
      if (ext && ext.toLowerCase() === 'png') {
        imageMeta = extractPngPackage(buffer);
      }
      await minio.putObject(MINIO_BUCKET, uuidName, buffer);
      await client.query(
        'INSERT INTO photos (album_id, filename, stored_filename, image_data) VALUES ($1, $2, $3, $4)',
        [null, name, uuidName, imageMeta]
      );
    }
    await client.query('COMMIT');
    return { message: `${photos.length} photos uploaded successfully.` };
  } catch (error) {
    await client.query('ROLLBACK');
    return { error: 'Failed to upload photos', detail: String(error), status: 500 };
  } finally {
    client.release();
  }
};

export const insertAlbumPhotos = async (custom_id: string, photos: any[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const albumResult = await client.query('SELECT id FROM albums WHERE custom_id = $1', [custom_id]);
    if (albumResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { error: 'Album not found', status: 404 };
    }
    const albumId = albumResult.rows[0].id;
    for (const photo of photos) {
      const { name, data } = photo;
      const ext = name.split('.').pop();
      const uuidName = `${uuidv4()}.${ext}`;
      const buffer = Buffer.from(data, 'base64');
      let imageMeta: string | null = null;
      if (ext && ext.toLowerCase() === 'png') {
        imageMeta = extractPngPackage(buffer);
      }
      await minio.putObject(MINIO_BUCKET, uuidName, buffer);
      await client.query(
        'INSERT INTO photos (album_id, filename, stored_filename, image_data) VALUES ($1, $2, $3, $4)',
        [albumId, name, uuidName, imageMeta]
      );
    }
    await client.query('COMMIT');
    return { message: `${photos.length} photos uploaded successfully.` };
  } catch (error) {
    await client.query('ROLLBACK');
    return { error: 'Failed to upload photos', detail: String(error), status: 500 };
  } finally {
    client.release();
  }
};

export const deletePhotoById = async (id: number) => {
  const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING id', [id]);
  if (result.rowCount === 0) {
    return { error: 'Photo not found', status: 404 };
  }
  return { message: 'Photo deleted successfully' };
}; 