import { Router } from 'express';
import { db } from '../db.js';
import { ingestTelemetry } from '../ingest.js';
import { isValidType } from '../deviceTypes.js';

const router = Router();

// Device data upload endpoint. Simulates the MQTT/HTTP gateway that field
// devices push telemetry through. Authenticated with a device ingest key
// (here: the device serial) to keep the demo self-contained.
//
// POST /api/ingest  { serial, payload, ts? }
router.post('/', (req, res) => {
  const { serial, payload, ts } = req.body || {};
  if (!serial || typeof payload !== 'object') {
    return res.status(400).json({ error: 'missing_serial_or_payload' });
  }
  const device = db.prepare('SELECT * FROM devices WHERE serial = ?').get(serial);
  if (!device) return res.status(404).json({ error: 'unknown_device' });
  if (!isValidType(device.type)) return res.status(400).json({ error: 'invalid_type' });

  const result = ingestTelemetry(device, payload, ts || Date.now());
  res.json({ ok: true, ...result });
});

export default router;
