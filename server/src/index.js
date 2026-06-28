import http from 'node:http';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { db, initSchema } from './db.js';
import { ensureSeed } from './seed.js';
import { initWebSocket } from './wsHub.js';
import { startSimulator } from './simulator.js';
import { broadcastDeviceStatus } from './wsHub.js';

import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import telemetryRoutes from './routes/telemetry.js';
import statsRoutes from './routes/stats.js';
import userRoutes from './routes/users.js';
import ingestRoutes from './routes/ingest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

initSchema();
ensureSeed();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ingest', ingestRoutes);

// Serve the built frontend if present (single-deployment mode).
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

const server = http.createServer(app);
initWebSocket(server);

// Mark devices offline when they stop reporting.
const OFFLINE_AFTER = 20000;
setInterval(() => {
  const stale = db.prepare(
    "SELECT * FROM devices WHERE status='online' AND (last_seen IS NULL OR last_seen < ?)"
  ).all(Date.now() - OFFLINE_AFTER);
  for (const d of stale) {
    db.prepare("UPDATE devices SET status='offline' WHERE id = ?").run(d.id);
    d.status = 'offline';
    broadcastDeviceStatus(d);
  }
}, 10000);

server.listen(PORT, () => {
  console.log(`[wrd-iot] API + WS listening on http://localhost:${PORT}`);
  if (process.env.SIMULATOR !== 'off') {
    startSimulator({ intervalMs: Number(process.env.SIM_INTERVAL_MS) || 4000 });
  }
});
