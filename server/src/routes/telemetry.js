import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../auth.js';
import { canAccessDevice } from '../rbac.js';

const router = Router();
router.use(authRequired);

// Historical telemetry for a device (most recent first), capped by `limit`.
router.get('/:deviceId', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.deviceId);
  if (!device || !canAccessDevice(req.user, device)) {
    return res.status(404).json({ error: 'not_found' });
  }
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const rows = db.prepare(
    'SELECT ts, alarm, payload FROM telemetry WHERE device_id = ? ORDER BY ts DESC LIMIT ?'
  ).all(device.id, limit);
  const history = rows
    .map((r) => ({ ts: r.ts, alarm: r.alarm, ...JSON.parse(r.payload) }))
    .reverse();
  res.json({ deviceId: device.id, type: device.type, history });
});

// Latest telemetry sample for a device.
router.get('/:deviceId/latest', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.deviceId);
  if (!device || !canAccessDevice(req.user, device)) {
    return res.status(404).json({ error: 'not_found' });
  }
  const row = db.prepare(
    'SELECT ts, alarm, payload FROM telemetry WHERE device_id = ? ORDER BY ts DESC LIMIT 1'
  ).get(device.id);
  res.json({ latest: row ? { ts: row.ts, alarm: row.alarm, ...JSON.parse(row.payload) } : null });
});

// Recent events / alarms for a device.
router.get('/:deviceId/events', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.deviceId);
  if (!device || !canAccessDevice(req.user, device)) {
    return res.status(404).json({ error: 'not_found' });
  }
  const rows = db.prepare(
    'SELECT ts, level, code, message FROM events WHERE device_id = ? ORDER BY ts DESC LIMIT 50'
  ).all(device.id);
  res.json({ events: rows });
});

export default router;
