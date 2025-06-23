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

// --- API Endpoints ---

// Get all photos
app.get('/api/photos', async (c) => {
  try {
    const result = await pool.query('SELECT id, title, description, image_data, created_at FROM photos ORDER BY created_at DESC')
    return c.json(result.rows)
  } catch (error) {
    console.error('Failed to fetch photos:', error)
    return c.json({ error: 'Failed to fetch photos' }, 500)
  }
})

// Upload a new photo
app.post('/api/photos', async (c) => {
  try {
    const { title, description, imageData } = await c.req.json<{ title: string; description: string; imageData: string }>()

    if (!title || !imageData) {
      return c.json({ error: 'Title and image data are required' }, 400)
    }

    const result = await pool.query(
      'INSERT INTO photos (title, description, image_data) VALUES ($1, $2, $3) RETURNING *',
      [title, description, imageData]
    )

    return c.json(result.rows[0], 201)
  } catch (error) {
    console.error('Failed to upload photo:', error)
    return c.json({ error: 'Failed to upload photo' }, 500)
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
}) 