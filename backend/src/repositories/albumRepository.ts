import { pool } from '../db/pgPool';
import { minio, MINIO_BUCKET } from '../utils/minioClient';

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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // アルバムID取得
    const albumResult = await client.query('SELECT id FROM albums WHERE custom_id = $1', [custom_id]);
    if (albumResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const albumId = albumResult.rows[0].id;
    
    // 削除前にアルバム内の全写真のファイルパス情報を取得
    const photosResult = await client.query(
      'SELECT stored_filename, thumbnail_filename FROM photos WHERE album_id = $1',
      [albumId]
    );
    
    // データベースから写真削除
    await client.query('DELETE FROM photos WHERE album_id = $1', [albumId]);
    
    // データベースからアルバム削除
    await client.query('DELETE FROM albums WHERE id = $1', [albumId]);
    
    // MinIOから個別の写真ファイルを削除
    for (const photo of photosResult.rows) {
      try {
        if (photo.stored_filename) {
          await minio.removeObject(MINIO_BUCKET, photo.stored_filename);
          console.log(`Deleted file from MinIO: ${photo.stored_filename}`);
        }
        if (photo.thumbnail_filename) {
          await minio.removeObject(MINIO_BUCKET, photo.thumbnail_filename);
          console.log(`Deleted thumbnail from MinIO: ${photo.thumbnail_filename}`);
        }
      } catch (minioError) {
        console.error(`Failed to delete file from MinIO: ${photo.stored_filename}`, minioError);
        // 個別ファイルの削除エラーでもアルバム削除は継続
      }
    }
    
    // アルバムディレクトリ自体も削除を試行（空の場合）
    try {
      // アルバムのメインディレクトリ
      const albumPrefix = `albums/${custom_id}/`;
      const objectsList = await minio.listObjects(MINIO_BUCKET, albumPrefix, true);
      
      // オブジェクトが残っていないか確認して、空の場合はディレクトリを削除
      let hasObjects = false;
      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      for await (const _obj of objectsList) {
        hasObjects = true;
        break; // 1つでもオブジェクトがあればbreak
      }
      
      if (!hasObjects) {
        console.log(`Album directory ${albumPrefix} is empty and cleaned up`);
      }
    } catch (dirError) {
      console.error(`Failed to check/cleanup album directory: ${custom_id}`, dirError);
    }
    
    await client.query('COMMIT');
    console.log(`Album ${custom_id} and all its files deleted successfully`);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to delete album:', error);
    throw error;
  } finally {
    client.release();
  }
}; 