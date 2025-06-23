import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Pool } from 'pg'
import { cors } from 'hono/cors'
import { Client as MinioClient } from 'minio'
import { v4 as uuidv4 } from 'uuid'

const MINIO_ROOT_USER = process.env.MINIO_ROOT_USER || 'minioadmin';
const MINIO_ROOT_PASSWORD = process.env.MINIO_ROOT_PASSWORD || 'minioadmin123';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'vrphotoshare';
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'minio';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_USE_SSL = false;

// アップロード用MinIOクライアント（Docker内部からアクセス）
const minio = new MinioClient({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ROOT_USER,
  secretKey: MINIO_ROOT_PASSWORD,
});

// 署名付きURL生成用MinIOクライアント（外部からアクセス）
const minioForPresigned = new MinioClient({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ROOT_USER,
  secretKey: MINIO_ROOT_PASSWORD,
});

const app = new Hono()

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'db',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
})

// CORS middleware
app.use('/api/*', cors({
  origin: 'http://localhost:5173',
  allowHeaders: ['Content-Type'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}))

// --- API Types ---
interface PhotoUpload {
  name: string;
  data: string; // Base64 encoded string
}

// --- API Endpoints ---

// 0. Get all albums
app.get('/api/albums', async (c) => {
  try {
    const result = await pool.query('SELECT * FROM albums ORDER BY created_at DESC');
    return c.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch albums:', error);
    return c.json({ error: 'Failed to fetch albums' }, 500);
  }
});

// 1. Create a new album
app.post('/api/albums', async (c) => {
  try {
    const { custom_id, name } = await c.req.json<{ custom_id: string, name: string }>();
    if (!custom_id || !name) {
      return c.json({ error: 'Album name and ID are required' }, 400);
    }

    const result = await pool.query(
      'INSERT INTO albums (custom_id, name) VALUES ($1, $2) RETURNING *',
      [custom_id, name]
    );

    return c.json(result.rows[0], 201);
  } catch (error: any) {
    if (error.code === '23505') { // unique_violation
      return c.json({ error: 'This album ID is already taken.' }, 409);
    }
    console.error('Failed to create album:', error);
    return c.json({ error: 'Failed to create album' }, 500);
  }
});

// 2. Get album details (and check existence)
app.get('/api/albums/:custom_id', async (c) => {
    try {
        const { custom_id } = c.req.param();
        const result = await pool.query('SELECT * FROM albums WHERE custom_id = $1', [custom_id]);

        if (result.rows.length === 0) {
            return c.json({ error: 'Album not found' }, 404);
        }
        return c.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to fetch album:', error);
        return c.json({ error: 'Failed to fetch album' }, 500);
    }
});

// アルバム名変更API
app.put('/api/albums/:custom_id', async (c) => {
  try {
    const { custom_id } = c.req.param();
    const { name } = await c.req.json<{ name: string }>();
    if (!name) {
      return c.json({ error: 'Album name is required' }, 400);
    }
    const result = await pool.query(
      'UPDATE albums SET name = $1 WHERE custom_id = $2 RETURNING *',
      [name, custom_id]
    );
    if (result.rows.length === 0) {
      return c.json({ error: 'Album not found' }, 404);
    }
    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update album name:', error);
    return c.json({ error: 'Failed to update album name' }, 500);
  }
});

// PNGバイナリからPngPackageチャンク(JSON)またはiTXtチャンク(Description)を抽出する関数
function extractPngPackage(buffer: Buffer): string | null {
  // PNGファイルのシグネチャは8バイト
  if (buffer.readUInt32BE(0) !== 0x89504e47 || buffer.readUInt32BE(4) !== 0x0d0a1a0a) {
    return null;
  }
  let offset = 8;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'PngP') { // 'PngPackage'の先頭4文字
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buffer.length) break;
      const chunkData = buffer.slice(dataStart, dataEnd).toString('utf8');
      return chunkData;
    }
    // iTXtチャンク対応
    if (type === 'iTXt') {
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > buffer.length) break;
      const chunkData = buffer.slice(dataStart, dataEnd);
      // iTXtチャンクの構造: keyword\0 compression_flag\0 compression_method\0 lang_tag\0 translated_keyword\0 text
      // keywordはnull終端文字まで
      const nullIdx = chunkData.indexOf(0x00);
      if (nullIdx !== -1) {
        const keyword = chunkData.slice(0, nullIdx).toString('utf8');
        if (keyword === 'Description') {
          // Descriptionキーワードのテキスト部分を抽出
          // nullIdx+1: compression_flag, +2: compression_method, +3: lang_tag(null終端), ...
          let ptr = nullIdx + 1; // compression_flag
          ptr += 1; // compression_method
          // lang_tag (null終端文字まで)
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++;
          ptr++; // null終端
          // translated_keyword (null終端文字まで)
          while (ptr < chunkData.length && chunkData[ptr] !== 0x00) ptr++;
          ptr++; // null終端
          // ここからtext
          if (ptr < chunkData.length) {
            const text = chunkData.slice(ptr).toString('utf8');
            // ヌルバイトを除去して返す
            return text.replace(/\u0000/g, '');
          }
        }
      }
    }
    offset += 8 + length + 4; // length + type + data + CRC
  }
  return null;
}

// 3. Upload photos to an album
app.post('/api/albums/:custom_id/photos', async (c) => {
  const { custom_id } = c.req.param();
  const photos = await c.req.json<PhotoUpload[]>();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const albumResult = await client.query('SELECT id FROM albums WHERE custom_id = $1', [custom_id]);
    if (albumResult.rows.length === 0) {
      return c.json({ error: 'Album not found' }, 404);
    }
    const albumId = albumResult.rows[0].id;

    for (const photo of photos) {
      const { name, data } = photo;
      const ext = name.split('.').pop();
      const uuidName = `${uuidv4()}.${ext}`;
      const buffer = Buffer.from(data, 'base64');
      // PNGメタデータ抽出
      let imageMeta: string | null = null;
      if (ext && ext.toLowerCase() === 'png') {
        // デバッグ: 全チャンク名を列挙
        let offset = 8;
        const chunkNames: string[] = [];
        while (offset + 8 <= buffer.length) {
          const length = buffer.readUInt32BE(offset);
          const type = buffer.toString('ascii', offset + 4, offset + 8);
          chunkNames.push(type);
          offset += 8 + length + 4;
        }
        console.log('PNGチャンク一覧:', chunkNames);
        imageMeta = extractPngPackage(buffer);
        if (imageMeta) {
          console.log('PngPackage抽出:', imageMeta);
        } else {
          console.log('PngPackageなし');
        }
      }
      try {
        await minio.putObject(MINIO_BUCKET, uuidName, buffer);
      } catch (minioErr) {
        await client.query('ROLLBACK');
        console.error('MinIO error:', minioErr);
        return c.json({ error: 'MinIOへの保存に失敗しました', detail: String(minioErr) }, 500);
      }
      try {
        await client.query(
          'INSERT INTO photos (album_id, filename, stored_filename, image_data) VALUES ($1, $2, $3, $4)',
          [albumId, name, uuidName, imageMeta]
        );
      } catch (dbErr) {
        await client.query('ROLLBACK');
        console.error('DB error:', dbErr);
        return c.json({ error: 'DBへの保存に失敗しました', detail: String(dbErr) }, 500);
      }
    }

    await client.query('COMMIT');
    return c.json({ message: `${photos.length} photos uploaded successfully.` }, 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to upload photos:', error);
    return c.json({ error: 'Failed to upload photos', detail: String(error) }, 500);
  } finally {
    client.release();
  }
});


// 4. Get all photos for an album
app.get('/api/albums/:custom_id/photos', async (c) => {
    try {
        const { custom_id } = c.req.param();
        // クエリパラメータでソート順を指定（asc/desc）
        const sort = (c.req.query('sort') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        const result = await pool.query(
            `SELECT p.id, p.filename as name, p.stored_filename, p.image_data, p.created_at
             FROM photos p
             JOIN albums a ON p.album_id = a.id
             WHERE a.custom_id = $1
             ORDER BY p.created_at ${sort}`,
            [custom_id]
        );
        // presigned URLを生成
        const photos = await Promise.all(result.rows.map(async (row) => {
          // 公開バケットなので直接URLを使用
          const url = `http://localhost:9000/${MINIO_BUCKET}/${row.stored_filename}`;
          // image_dataからfile_dateを抽出
          let fileDate = null;
          if (row.image_data) {
            try {
              const meta = JSON.parse(row.image_data);
              if (meta && meta.date) fileDate = meta.date;
            } catch {}
          }
          return { id: row.id, name: row.name, url: url, image_data: row.image_data, file_date: fileDate };
        }));
        return c.json(photos);
    } catch (error) {
        console.error('Failed to fetch photos:', error);
        return c.json({ error: 'Failed to fetch photos' }, 500);
    }
});

// 5. Delete a photo
app.delete('/api/photos/:id', async (c) => {
    try {
        const { id } = c.req.param();
        const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return c.json({ error: 'Photo not found' }, 404);
        }

        return c.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Failed to delete photo:', error);
        return c.json({ error: 'Failed to delete photo' }, 500);
    }
});

// 6. Get all photos (for homepage)
app.get('/api/photos', async (c) => {
    try {
        // クエリパラメータでソート順を指定（asc/desc）
        const sort = (c.req.query('sort') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        const result = await pool.query(
            `SELECT id, filename as name, stored_filename, image_data FROM photos WHERE album_id IS NULL ORDER BY created_at ${sort}`
        );
        // presigned URLを生成
        const photos = await Promise.all(result.rows.map(async (row) => {
          // 公開バケットなので直接URLを使用
          const url = `http://localhost:9000/${MINIO_BUCKET}/${row.stored_filename}`;
          // image_dataからfile_dateを抽出
          let fileDate = null;
          if (row.image_data) {
            try {
              const meta = JSON.parse(row.image_data);
              if (meta && meta.date) fileDate = meta.date;
            } catch {}
          }
          return { id: row.id, name: row.name, url: url, image_data: row.image_data, file_date: fileDate };
        }));
        return c.json(photos);
    } catch (error) {
        console.error('Failed to fetch all photos:', error);
        return c.json({ error: 'Failed to fetch photos' }, 500);
    }
});

// 7. Upload photos without album association
app.post('/api/photos', async (c) => {
    const photos = await c.req.json<PhotoUpload[]>();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const photo of photos) {
            const { name, data } = photo;
            const ext = name.split('.').pop();
            const uuidName = `${uuidv4()}.${ext}`;
            const buffer = Buffer.from(data, 'base64');
            // PNGメタデータ抽出
            let imageMeta: string | null = null;
            if (ext && ext.toLowerCase() === 'png') {
              // デバッグ: 全チャンク名を列挙
              let offset = 8;
              const chunkNames: string[] = [];
              while (offset + 8 <= buffer.length) {
                const length = buffer.readUInt32BE(offset);
                const type = buffer.toString('ascii', offset + 4, offset + 8);
                chunkNames.push(type);
                offset += 8 + length + 4;
              }
              console.log('PNGチャンク一覧:', chunkNames);
              imageMeta = extractPngPackage(buffer);
              if (imageMeta) {
                console.log('PngPackage抽出:', imageMeta);
              } else {
                console.log('PngPackageなし');
              }
            }
            try {
              await minio.putObject(MINIO_BUCKET, uuidName, buffer);
            } catch (minioErr) {
              await client.query('ROLLBACK');
              console.error('MinIO error:', minioErr);
              return c.json({ error: 'MinIOへの保存に失敗しました', detail: String(minioErr) }, 500);
            }
            try {
              await client.query(
                  'INSERT INTO photos (album_id, filename, stored_filename, image_data) VALUES ($1, $2, $3, $4)',
                  [null, name, uuidName, imageMeta]
              );
            } catch (dbErr) {
              await client.query('ROLLBACK');
              console.error('DB error:', dbErr);
              return c.json({ error: 'DBへの保存に失敗しました', detail: String(dbErr) }, 500);
            }
        }

        await client.query('COMMIT');
        return c.json({ message: `${photos.length} photos uploaded successfully.` }, 201);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to upload photos:', error);
        return c.json({ error: 'Failed to upload photos', detail: String(error) }, 500);
    } finally {
        client.release();
    }
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
