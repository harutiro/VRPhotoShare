import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { albumRouter } from './routes/albumRoutes'
import { photoRouter } from './routes/photoRoutes'

const app = new Hono()

// CORSなど必要なミドルウェアはここで設定
// ...

app.route('/api/albums', albumRouter);
app.route('/api/photos', photoRouter);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
