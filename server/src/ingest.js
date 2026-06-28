import { db } from './db.js';
import { evaluateAlarm } from './deviceTypes.js';
import { broadcastTelemetry, broadcastEvent, broadcastDeviceStatus } from './wsHub.js';

const HISTORY_CAP = 500; // keep last N telemetry rows per device

const insertTel = db.prepare(
  'INSERT INTO telemetry (device_id, ts, alarm, payload) VALUES (?, ?, ?, ?)'
);
const insertEvt = db.prepare(
  'INSERT INTO events (device_id, ts, level, code, message) VALUES (?, ?, ?, ?, ?)'
);
const trimTel = db.prepare(
  `DELETE FROM telemetry WHERE device_id = ? AND id NOT IN (
     SELECT id FROM telemetry WHERE device_id = ? ORDER BY id DESC LIMIT ?
   )`
);
const updateDevice = db.prepare(
  'UPDATE devices SET status = ?, alarm = ?, last_seen = ? WHERE id = ?'
);

// Accept a telemetry payload for a device (from simulator or HTTP/MQTT ingest).
// Persists, evaluates alarms, updates device state and broadcasts to clients.
export function ingestTelemetry(device, payload, ts = Date.now()) {
  const alarm = evaluateAlarm(device.type, payload);

  insertTel.run(device.id, ts, alarm, JSON.stringify(payload));
  trimTel.run(device.id, device.id, HISTORY_CAP);

  const prevAlarm = device.alarm;
  updateDevice.run('online', alarm, ts, device.id);
  device.status = 'online';
  device.alarm = alarm;
  device.last_seen = ts;

  broadcastTelemetry(device, payload, alarm, ts);
  broadcastDeviceStatus(device);

  // Raise an event when entering a non-normal alarm state.
  if (alarm !== 'normal' && alarm !== prevAlarm) {
    const event = {
      ts,
      level: alarm,
      code: `${device.type}_${alarm}`.toUpperCase(),
      message: `Device ${device.serial} entered ${alarm} state`
    };
    insertEvt.run(device.id, event.ts, event.level, event.code, event.message);
    broadcastEvent(device, event);
  }
  return { alarm, ts };
}
