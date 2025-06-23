import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Pool } from 'pg'
import { cors } from 'hono/cors'

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
      await client.query(
        'INSERT INTO photos (album_id, filename, image_data) VALUES ($1, $2, $3)',
        [albumId, name, data]
      );
    }

    await client.query('COMMIT');
    return c.json({ message: `${photos.length} photos uploaded successfully.` }, 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to upload photos:', error);
    return c.json({ error: 'Failed to upload photos' }, 500);
  } finally {
    client.release();
  }
});


// 4. Get all photos for an album
app.get('/api/albums/:custom_id/photos', async (c) => {
    try {
        const { custom_id } = c.req.param();
        const result = await pool.query(
            `SELECT p.id, p.filename as name, p.image_data as data, p.created_at
             FROM photos p
             JOIN albums a ON p.album_id = a.id
             WHERE a.custom_id = $1
             ORDER BY p.created_at DESC`,
            [custom_id]
        );
        return c.json(result.rows);
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
        const result = await pool.query(
            `SELECT id, filename as name, image_data as data FROM photos WHERE album_id IS NULL ORDER BY created_at DESC`
        );
        return c.json(result.rows);
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
            await client.query(
                'INSERT INTO photos (album_id, filename, image_data) VALUES ($1, $2, $3)',
                [null, name, data] // album_id is null
            );
        }

        await client.query('COMMIT');
        return c.json({ message: `${photos.length} photos uploaded successfully.` }, 201);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to upload photos:', error);
        return c.json({ error: 'Failed to upload photos' }, 500);
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
