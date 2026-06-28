import { WebSocketServer } from 'ws';
import { verifyToken } from './auth.js';
import { canAccessDevice } from './rbac.js';
import { db } from './db.js';

// Maintains authenticated websocket clients and broadcasts telemetry/alarm
// updates, respecting each client's access scope.

const clients = new Set(); // { ws, user }

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const user = token ? verifyToken(token) : null;
    if (!user) {
      ws.close(4001, 'unauthorized');
      return;
    }
    const client = { ws, user };
    clients.add(client);
    ws.send(JSON.stringify({ type: 'hello', role: user.role }));

    ws.on('close', () => clients.delete(client));
    ws.on('error', () => clients.delete(client));
  });

  return wss;
}

// Broadcast a telemetry update for a device only to clients allowed to see it.
export function broadcastTelemetry(device, payload, alarm, ts) {
  const msg = JSON.stringify({
    type: 'telemetry',
    deviceId: device.id,
    serial: device.serial,
    deviceType: device.type,
    country: device.country,
    alarm,
    ts,
    payload
  });
  for (const c of clients) {
    if (canAccessDevice(c.user, device) && c.ws.readyState === 1) {
      c.ws.send(msg);
    }
  }
}

export function broadcastEvent(device, event) {
  const msg = JSON.stringify({ type: 'event', deviceId: device.id, ...event });
  for (const c of clients) {
    if (canAccessDevice(c.user, device) && c.ws.readyState === 1) {
      c.ws.send(msg);
    }
  }
}

export function broadcastDeviceStatus(device) {
  const msg = JSON.stringify({
    type: 'status',
    deviceId: device.id,
    status: device.status,
    alarm: device.alarm,
    last_seen: device.last_seen
  });
  for (const c of clients) {
    if (canAccessDevice(c.user, device) && c.ws.readyState === 1) {
      c.ws.send(msg);
    }
  }
}
