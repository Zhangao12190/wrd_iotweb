import { db } from './db.js';
import { DEVICE_TYPES } from './deviceTypes.js';
import { ingestTelemetry } from './ingest.js';

// Simulates field devices uploading telemetry, so the platform shows live data
// out of the box. In production this loop would be replaced by an MQTT broker /
// device gateway feeding ingestTelemetry().

const state = new Map(); // deviceId -> last numeric values for smooth random walk

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function nextValue(prev, spec) {
  if (spec.unit === 'bool') {
    // occasionally toggle; leak alarms stay mostly 0
    const flipChance = spec.normal[1] === 0 ? 0.01 : 0.08;
    if (prev == null) prev = spec.normal[1] === 0 ? 0 : Math.round(Math.random());
    return Math.random() < flipChance ? (prev ? 0 : 1) : prev;
  }
  const [lo, hi] = spec.normal;
  if (prev == null) prev = lo + Math.random() * (hi - lo);
  const range = hi - lo || 1;
  // random walk biased toward the normal band centre
  const drift = (lo + hi) / 2 - prev;
  const step = (Math.random() - 0.5) * range * 0.18 + drift * 0.05;
  let v = prev + step;
  // rare excursion to create warnings/alarms
  if (Math.random() < 0.03) v += (Math.random() - 0.5) * range * 0.8;
  v = clamp(v, spec.min, spec.max);
  return spec.unit === 'pH' ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10;
}

function buildPayload(device) {
  const def = DEVICE_TYPES[device.type];
  if (!def) return {};
  let prev = state.get(device.id) || {};
  const payload = {};
  for (const [metric, spec] of Object.entries(def.metrics)) {
    payload[metric] = nextValue(prev[metric], spec);
  }
  state.set(device.id, payload);
  return payload;
}

let timer = null;

export function startSimulator({ intervalMs = 4000, onlineRatio = 0.85 } = {}) {
  if (timer) return;
  const listDevices = db.prepare('SELECT * FROM devices');
  // Pick a stable subset that is "online" for this process lifetime.
  const offline = new Set();
  for (const d of listDevices.all()) {
    if (Math.random() > onlineRatio) offline.add(d.id);
  }

  timer = setInterval(() => {
    const devices = listDevices.all();
    for (const device of devices) {
      if (offline.has(device.id)) continue;
      const payload = buildPayload(device);
      ingestTelemetry(device, payload);
    }
  }, intervalMs);

  console.log(
    `[simulator] running, interval=${intervalMs}ms, online=${
      listDevices.all().length - offline.size
    }/${listDevices.all().length}`
  );
}

export function stopSimulator() {
  if (timer) clearInterval(timer);
  timer = null;
}
