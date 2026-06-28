// Domain definitions for the four supported device categories.
// Each device type declares the telemetry metrics it reports, including unit,
// a healthy operating range and bounds used by the simulator / alarm engine.

export const DEVICE_TYPES = {
  plasma_cutter: {
    key: 'plasma_cutter',
    // i18n keys resolved on the frontend (deviceType.plasma_cutter ...)
    metrics: {
      current: { unit: 'A', min: 0, max: 400, normal: [80, 320] },
      voltage: { unit: 'V', min: 0, max: 200, normal: [100, 160] },
      cutting_speed: { unit: 'mm/min', min: 0, max: 8000, normal: [1000, 6000] },
      gas_pressure: { unit: 'bar', min: 0, max: 12, normal: [4, 9] },
      temperature: { unit: '°C', min: 0, max: 120, normal: [20, 75] },
      arc_on: { unit: 'bool', min: 0, max: 1, normal: [0, 1] }
    }
  },
  welder: {
    key: 'welder',
    metrics: {
      current: { unit: 'A', min: 0, max: 500, normal: [60, 350] },
      voltage: { unit: 'V', min: 0, max: 80, normal: [15, 40] },
      wire_feed_speed: { unit: 'm/min', min: 0, max: 25, normal: [3, 18] },
      duty_cycle: { unit: '%', min: 0, max: 100, normal: [20, 85] },
      temperature: { unit: '°C', min: 0, max: 130, normal: [20, 80] },
      gas_flow: { unit: 'L/min', min: 0, max: 30, normal: [8, 20] }
    }
  },
  water_tank: {
    key: 'water_tank',
    metrics: {
      water_level: { unit: '%', min: 0, max: 100, normal: [20, 95] },
      temperature: { unit: '°C', min: 0, max: 90, normal: [10, 60] },
      ph: { unit: 'pH', min: 0, max: 14, normal: [6.5, 8.5] },
      tds: { unit: 'ppm', min: 0, max: 2000, normal: [50, 600] },
      flow_rate: { unit: 'L/min', min: 0, max: 120, normal: [5, 90] },
      pump_on: { unit: 'bool', min: 0, max: 1, normal: [0, 1] }
    }
  },
  gas_control_box: {
    key: 'gas_control_box',
    metrics: {
      gas_pressure: { unit: 'bar', min: 0, max: 16, normal: [3, 12] },
      flow_rate: { unit: 'm³/h', min: 0, max: 200, normal: [10, 150] },
      valve_position: { unit: '%', min: 0, max: 100, normal: [0, 100] },
      o2_concentration: { unit: '%', min: 0, max: 100, normal: [18, 23] },
      temperature: { unit: '°C', min: -10, max: 80, normal: [5, 50] },
      leak_alarm: { unit: 'bool', min: 0, max: 1, normal: [0, 0] }
    }
  }
};

export const DEVICE_TYPE_KEYS = Object.keys(DEVICE_TYPES);

export function isValidType(t) {
  return DEVICE_TYPE_KEYS.includes(t);
}

// Evaluate a telemetry payload and return an alarm level: 'normal' | 'warning' | 'critical'
export function evaluateAlarm(type, payload) {
  const def = DEVICE_TYPES[type];
  if (!def) return 'normal';
  let level = 'normal';
  for (const [metric, spec] of Object.entries(def.metrics)) {
    const v = payload[metric];
    if (v == null) continue;
    if (spec.unit === 'bool') {
      // leak_alarm: 1 means leaking -> critical
      if (metric === 'leak_alarm' && v >= 1) return 'critical';
      continue;
    }
    const [lo, hi] = spec.normal;
    // Outside the hard min/max is critical, outside the normal band is warning.
    if (v < spec.min || v > spec.max) return 'critical';
    if (v < lo || v > hi) {
      // how far outside normal band relative to range
      const range = spec.max - spec.min || 1;
      const dist = Math.max(lo - v, v - hi) / range;
      if (dist > 0.25) return 'critical';
      level = level === 'critical' ? 'critical' : 'warning';
    }
  }
  return level;
}
