import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { authRequired, requireRole } from '../auth.js';
import { deviceScope, canAccessDevice } from '../rbac.js';
import { isValidType } from '../deviceTypes.js';

const router = Router();
router.use(authRequired);

// List devices visible to the current user, with optional filters.
router.get('/', (req, res) => {
  const scope = deviceScope(req.user);
  const clauses = [scope.where];
  const params = [...scope.params];

  const { type, country, status, alarm, q } = req.query;
  if (type) { clauses.push('devices.type = ?'); params.push(type); }
  if (country) { clauses.push('devices.country = ?'); params.push(country); }
  if (status) { clauses.push('devices.status = ?'); params.push(status); }
  if (alarm) { clauses.push('devices.alarm = ?'); params.push(alarm); }
  if (q) {
    clauses.push('(devices.name LIKE ? OR devices.serial LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  const rows = db.prepare(`
    SELECT devices.*,
           owner.name AS owner_name,
           dealer.name AS dealer_name
    FROM devices
    LEFT JOIN users owner ON owner.id = devices.owner_user_id
    LEFT JOIN users dealer ON dealer.id = devices.dealer_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY devices.created_at DESC
  `).all(...params);

  res.json({ devices: rows });
});

router.get('/:id', (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device || !canAccessDevice(req.user, device)) {
    return res.status(404).json({ error: 'not_found' });
  }
  res.json({ device });
});

// Create a device. admin can assign any dealer; dealer creates under itself.
router.post('/', requireRole('admin', 'dealer'), (req, res) => {
  const { serial, name, type, country, owner_user_id, dealer_id, firmware } = req.body || {};
  if (!serial || !name || !type || !country) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (!isValidType(type)) return res.status(400).json({ error: 'invalid_type' });

  const finalDealer = req.user.role === 'dealer' ? req.user.id : (dealer_id || null);
  const id = nanoid(12);
  try {
    db.prepare(`
      INSERT INTO devices (id, serial, name, type, owner_user_id, dealer_id, country, firmware, status, alarm, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'offline', 'normal', ?)
    `).run(id, serial, name, type, owner_user_id || null, finalDealer, country, firmware || '1.0.0', Date.now());
  } catch (e) {
    return res.status(409).json({ error: 'serial_exists' });
  }
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  res.status(201).json({ device });
});

router.put('/:id', requireRole('admin', 'dealer'), (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device || !canAccessDevice(req.user, device)) {
    return res.status(404).json({ error: 'not_found' });
  }
  const { name, country, owner_user_id, firmware } = req.body || {};
  db.prepare(`
    UPDATE devices SET name = COALESCE(?, name), country = COALESCE(?, country),
      owner_user_id = COALESCE(?, owner_user_id), firmware = COALESCE(?, firmware)
    WHERE id = ?
  `).run(name ?? null, country ?? null, owner_user_id ?? null, firmware ?? null, device.id);
  res.json({ device: db.prepare('SELECT * FROM devices WHERE id = ?').get(device.id) });
});

router.delete('/:id', requireRole('admin', 'dealer'), (req, res) => {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device || !canAccessDevice(req.user, device)) {
    return res.status(404).json({ error: 'not_found' });
  }
  db.prepare('DELETE FROM telemetry WHERE device_id = ?').run(device.id);
  db.prepare('DELETE FROM events WHERE device_id = ?').run(device.id);
  db.prepare('DELETE FROM devices WHERE id = ?').run(device.id);
  res.json({ ok: true });
});

export default router;
