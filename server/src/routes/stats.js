import { Router } from 'express';
import { db } from '../db.js';
import { authRequired } from '../auth.js';
import { deviceScope } from '../rbac.js';
import { DEVICE_TYPE_KEYS } from '../deviceTypes.js';

const router = Router();
router.use(authRequired);

// Dashboard summary scoped to the current user's role.
router.get('/overview', (req, res) => {
  const scope = deviceScope(req.user);
  const w = scope.where;
  const p = scope.params;

  const total = db.prepare(`SELECT COUNT(*) c FROM devices WHERE ${w}`).get(...p).c;
  const online = db.prepare(`SELECT COUNT(*) c FROM devices WHERE ${w} AND status='online'`).get(...p).c;
  const warning = db.prepare(`SELECT COUNT(*) c FROM devices WHERE ${w} AND alarm='warning'`).get(...p).c;
  const critical = db.prepare(`SELECT COUNT(*) c FROM devices WHERE ${w} AND alarm='critical'`).get(...p).c;

  const byTypeRows = db.prepare(
    `SELECT type, COUNT(*) c FROM devices WHERE ${w} GROUP BY type`
  ).all(...p);
  const byType = Object.fromEntries(DEVICE_TYPE_KEYS.map((k) => [k, 0]));
  for (const r of byTypeRows) byType[r.type] = r.c;

  const byStatus = { online, offline: total - online };

  res.json({
    total,
    online,
    offline: total - online,
    warning,
    critical,
    byType,
    byStatus
  });
});

// Country breakdown (dealers + admins). Shows how devices sold to each country
// are performing.
router.get('/by-country', (req, res) => {
  const scope = deviceScope(req.user);
  const w = scope.where;
  const p = scope.params;

  const rows = db.prepare(`
    SELECT country,
           COUNT(*) AS total,
           SUM(CASE WHEN status='online' THEN 1 ELSE 0 END) AS online,
           SUM(CASE WHEN alarm='warning' THEN 1 ELSE 0 END) AS warning,
           SUM(CASE WHEN alarm='critical' THEN 1 ELSE 0 END) AS critical
    FROM devices WHERE ${w}
    GROUP BY country
    ORDER BY total DESC
  `).all(...p);

  // also a country x type matrix
  const matrixRows = db.prepare(`
    SELECT country, type, COUNT(*) c FROM devices WHERE ${w}
    GROUP BY country, type
  `).all(...p);
  const matrix = {};
  for (const r of matrixRows) {
    matrix[r.country] = matrix[r.country] || {};
    matrix[r.country][r.type] = r.c;
  }

  res.json({ countries: rows, matrix, types: DEVICE_TYPE_KEYS });
});

// Recent alarms across the visible fleet.
router.get('/alarms', (req, res) => {
  const scope = deviceScope(req.user);
  const rows = db.prepare(`
    SELECT e.ts, e.level, e.code, e.message, d.serial, d.name, d.type, d.country, d.id AS device_id
    FROM events e JOIN devices d ON d.id = e.device_id
    WHERE ${scope.where}
    ORDER BY e.ts DESC LIMIT 50
  `).all(...scope.params);
  res.json({ alarms: rows });
});

export default router;
