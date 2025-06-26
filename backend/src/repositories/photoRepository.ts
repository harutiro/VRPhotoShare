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
      const uuid = uuidv4();
      // アルバムなしの写真はphotos/ディレクトリに保存
      const uuidName = `photos/${uuid}.${ext}`;
      const buffer = Buffer.from(data, 'base64');
      let imageMeta: string | null = null;
      if (ext && ext.toLowerCase() === 'png') {
        imageMeta = extractPngPackage(buffer);
      }
      // サムネイルもphotos/thumbnails/に保存
      const thumbUuidName = `photos/thumbnails/${uuid}.webp`;
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
      const uuid = uuidv4();
      // アルバムごとのディレクトリに保存
      const uuidName = `albums/${custom_id}/${uuid}.${ext}`;
      const buffer = Buffer.from(data, 'base64');
      let imageMeta: string | null = null;
      if (ext && ext.toLowerCase() === 'png') {
        imageMeta = extractPngPackage(buffer);
      }
      // サムネイルもアルバムディレクトリ内のthumbnails/に保存
      const thumbUuidName = `albums/${custom_id}/thumbnails/${uuid}.webp`;
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

// ワールド情報の自動補完機能
export const updateWorldInfoForPhotos = async (custom_id: string | null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 対象の写真を取得（アルバム指定か全体かによって分岐）
    let query: string;
    let params: any[] = [];
    
    if (custom_id) {
      // アルバム内の写真のみ
      query = `
        SELECT p.id, p.image_data, p.created_at
        FROM photos p
        JOIN albums a ON p.album_id = a.id
        WHERE a.custom_id = $1
        ORDER BY p.created_at ASC
      `;
      params = [custom_id];
    } else {
      // 全体写真（アルバムなし）
      query = `
        SELECT id, image_data, created_at
        FROM photos
        WHERE album_id IS NULL
        ORDER BY created_at ASC
      `;
    }
    
    const result = await client.query(query, params);
    const photos = result.rows;
    
    // 各写真のメタデータを解析
    const photosWithMeta = photos.map(photo => {
      let worldName: string | null = null;
      let photoDate: Date | null = null;
      let hasWorld = false;
      
      if (photo.image_data) {
        try {
          const meta = JSON.parse(photo.image_data);
          if (meta && meta.world && meta.world.name) {
            worldName = meta.world.name;
            hasWorld = true;
          }
          if (meta && meta.date) {
            photoDate = new Date(meta.date);
          }
        } catch (e) {
          // メタデータが不正な場合は無視
        }
      }
      
      // dateがない場合はcreated_atを使用
      if (!photoDate) {
        photoDate = new Date(photo.created_at);
      }
      
      return {
        id: photo.id,
        worldName,
        photoDate,
        hasWorld,
        originalMeta: photo.image_data
      };
    });
    
    // ワールド情報がない写真に対して、近い時間のワールド情報を割り当て
    for (const photo of photosWithMeta) {
      if (!photo.hasWorld && photo.photoDate) {
        let minDiff = Infinity;
        let nearestWorld: string | null = null;
        
        // 他の写真の中で最も時間が近いワールド情報を探す
        for (const other of photosWithMeta) {
          if (other.hasWorld && other.worldName && other.photoDate) {
            const diff = Math.abs(photo.photoDate.getTime() - other.photoDate.getTime());
            // 24時間以内の写真のみを対象とする
            if (diff < minDiff && diff <= 24 * 60 * 60 * 1000) {
              minDiff = diff;
              nearestWorld = other.worldName;
            }
          }
        }
        
        // 近い時間のワールド情報が見つかった場合、メタデータを更新
        if (nearestWorld) {
          let updatedMeta: any = {};
          
          // 既存のメタデータがある場合はそれをベースにする
          if (photo.originalMeta) {
            try {
              updatedMeta = JSON.parse(photo.originalMeta);
            } catch (e) {
              // パース失敗時は空オブジェクトから開始
            }
          }
          
          // ワールド情報を追加/更新
          updatedMeta.world = {
            name: nearestWorld,
            id: `auto-assigned-${Date.now()}`, // 自動割り当てであることを示すID
            auto_assigned: true // 自動割り当てフラグ
          };
          
          // データベースを更新
          await client.query(
            'UPDATE photos SET image_data = $1 WHERE id = $2',
            [JSON.stringify(updatedMeta), photo.id]
          );
          
          console.log(`Updated photo ${photo.id} with world info: ${nearestWorld}`);
        }
      }
    }
    
    await client.query('COMMIT');
    console.log(`World info update completed for ${custom_id || 'all photos'}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update world info:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const deletePhotoById = async (id: number) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 削除前にファイルパス情報を取得
    const selectResult = await client.query(
      'SELECT stored_filename, thumbnail_filename FROM photos WHERE id = $1',
      [id]
    );
    
    if (selectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { error: 'Photo not found', status: 404 };
    }
    
    const { stored_filename, thumbnail_filename } = selectResult.rows[0];
    
    // データベースから削除
    await client.query('DELETE FROM photos WHERE id = $1', [id]);
    
    // MinIOからファイル削除
    try {
      if (stored_filename) {
        await minio.removeObject(MINIO_BUCKET, stored_filename);
        console.log(`Deleted file from MinIO: ${stored_filename}`);
      }
      if (thumbnail_filename) {
        await minio.removeObject(MINIO_BUCKET, thumbnail_filename);
        console.log(`Deleted thumbnail from MinIO: ${thumbnail_filename}`);
      }
    } catch (minioError) {
      console.error('Failed to delete files from MinIO:', minioError);
      // MinIOエラーでもトランザクションは継続（ファイルが既に存在しない場合もある）
    }
    
    await client.query('COMMIT');
    return { message: 'Photo deleted successfully' };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to delete photo:', error);
    return { error: 'Failed to delete photo', status: 500 };
  } finally {
    client.release();
  }
};

export const getAlbumThumbnail = async (custom_id: string) => {
  const result = await pool.query(
    `SELECT p.id, p.filename as name, p.stored_filename, p.thumbnail_filename
     FROM photos p
     JOIN albums a ON p.album_id = a.id
     WHERE a.custom_id = $1
     ORDER BY p.created_at ASC
     LIMIT 1`,
    [custom_id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  const url = buildFileUrl(row.stored_filename);
  const thumbnailUrl = row.thumbnail_filename ? buildFileUrl(row.thumbnail_filename) : null;
  
  return { 
    id: row.id, 
    name: row.name, 
    url, 
    thumbnailUrl 
  };
}; 