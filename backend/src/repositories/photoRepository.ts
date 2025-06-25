import { pool } from '../db/pgPool';
import { minio, MINIO_BUCKET } from '../utils/minioClient';
import { extractPngPackage } from '../utils/pngMeta';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// URL構築のヘルパー関数
const buildFileUrl = (filename: string): string => {
  const minioPublicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
  return `${minioPublicUrl}/${MINIO_BUCKET}/${filename}`;
};

export const getAllPhotos = async (sort: string) => {
  const result = await pool.query(
    `SELECT id, filename as name, stored_filename, image_data, thumbnail_filename FROM photos WHERE album_id IS NULL ORDER BY created_at ${sort.toUpperCase()}`
  );
  return result.rows.map(row => {
    const url = buildFileUrl(row.stored_filename);
    const thumbnailUrl = row.thumbnail_filename ? buildFileUrl(row.thumbnail_filename) : null;
    let fileDate = null;
    if (row.image_data) {
      try {
        const meta = JSON.parse(row.image_data);
        if (meta && meta.date) fileDate = meta.date;
      } catch {}
    }
    return { id: row.id, name: row.name, url, thumbnailUrl, image_data: row.image_data, file_date: fileDate };
  });
};

export const getPhotosByAlbumCustomId = async (custom_id: string, sort: string) => {
  const result = await pool.query(
    `SELECT p.id, p.filename as name, p.stored_filename, p.image_data, p.thumbnail_filename, p.created_at
     FROM photos p
     JOIN albums a ON p.album_id = a.id
     WHERE a.custom_id = $1
     ORDER BY p.created_at ${sort.toUpperCase()}`,
    [custom_id]
  );
  return result.rows.map(row => {
    const url = buildFileUrl(row.stored_filename);
    const thumbnailUrl = row.thumbnail_filename ? buildFileUrl(row.thumbnail_filename) : null;
    let fileDate = null;
    if (row.image_data) {
      try {
        const meta = JSON.parse(row.image_data);
        if (meta && meta.date) fileDate = meta.date;
      } catch {}
    }
    return { id: row.id, name: row.name, url, thumbnailUrl, image_data: row.image_data, file_date: fileDate };
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
      // サムネイル生成
      const thumbUuidName = `thumbnails/${uuidv4()}.webp`;
      const sharpImg = sharp(buffer);
      const metadata = await sharpImg.metadata();
      let resizeOptions = {};
      if (metadata.width && metadata.height) {
        if (metadata.width > metadata.height) {
          if (metadata.width > 1080) resizeOptions = { width: 1080 };
        } else {
          if (metadata.height > 1080) resizeOptions = { height: 1080 };
        }
      }
      const thumbBuffer = await sharpImg
        .resize(resizeOptions)
        .webp({ quality: 80 })
        .toBuffer();
      await minio.putObject(MINIO_BUCKET, uuidName, buffer);
      await minio.putObject(MINIO_BUCKET, thumbUuidName, thumbBuffer);
      await client.query(
        'INSERT INTO photos (album_id, filename, stored_filename, image_data, thumbnail_filename) VALUES ($1, $2, $3, $4, $5)',
        [null, name, uuidName, imageMeta, thumbUuidName]
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
      // サムネイル生成
      const thumbUuidName = `thumbnails/${uuidv4()}.webp`;
      const sharpImg = sharp(buffer);
      const metadata = await sharpImg.metadata();
      let resizeOptions = {};
      if (metadata.width && metadata.height) {
        if (metadata.width > metadata.height) {
          if (metadata.width > 1080) resizeOptions = { width: 1080 };
        } else {
          if (metadata.height > 1080) resizeOptions = { height: 1080 };
        }
      }
      const thumbBuffer = await sharpImg
        .resize(resizeOptions)
        .webp({ quality: 80 })
        .toBuffer();
      await minio.putObject(MINIO_BUCKET, uuidName, buffer);
      await minio.putObject(MINIO_BUCKET, thumbUuidName, thumbBuffer);
      await client.query(
        'INSERT INTO photos (album_id, filename, stored_filename, image_data, thumbnail_filename) VALUES ($1, $2, $3, $4, $5)',
        [albumId, name, uuidName, imageMeta, thumbUuidName]
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