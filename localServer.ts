import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app } from './server';

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (path.extname(req.path)) return res.sendStatus(404);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`AIM Life OS server running on http://0.0.0.0:${port}`);
  });
}

// Keep the local/Cloud Run listener separate from the Vercel Function.
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
