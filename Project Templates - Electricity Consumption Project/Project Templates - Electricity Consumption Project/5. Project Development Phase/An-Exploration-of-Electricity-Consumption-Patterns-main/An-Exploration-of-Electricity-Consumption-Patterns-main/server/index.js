import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes.js';
import { loadData } from './dataStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
let PORT = parseInt(process.env.PORT, 10) || 3001;

app.use(cors());
app.use(express.json());

loadData();

app.use('/api', apiRoutes);

// health endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok', port: PORT }));

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
