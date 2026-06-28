// Mirrors the backend metric definitions (units only) so the UI can render
// labelled live tiles and charts per device type.
export const DEVICE_METRICS: Record<string, { key: string; unit: string; bool?: boolean }[]> = {
  plasma_cutter: [
    { key: 'current', unit: 'A' },
    { key: 'voltage', unit: 'V' },
    { key: 'cutting_speed', unit: 'mm/min' },
    { key: 'gas_pressure', unit: 'bar' },
    { key: 'temperature', unit: '°C' },
    { key: 'arc_on', unit: '', bool: true }
  ],
  welder: [
    { key: 'current', unit: 'A' },
    { key: 'voltage', unit: 'V' },
    { key: 'wire_feed_speed', unit: 'm/min' },
    { key: 'duty_cycle', unit: '%' },
    { key: 'temperature', unit: '°C' },
    { key: 'gas_flow', unit: 'L/min' }
  ],
  water_tank: [
    { key: 'water_level', unit: '%' },
    { key: 'temperature', unit: '°C' },
    { key: 'ph', unit: 'pH' },
    { key: 'tds', unit: 'ppm' },
    { key: 'flow_rate', unit: 'L/min' },
    { key: 'pump_on', unit: '', bool: true }
  ],
  gas_control_box: [
    { key: 'gas_pressure', unit: 'bar' },
    { key: 'flow_rate', unit: 'm³/h' },
    { key: 'valve_position', unit: '%' },
    { key: 'o2_concentration', unit: '%' },
    { key: 'temperature', unit: '°C' },
    { key: 'leak_alarm', unit: '', bool: true }
  ]
};

// Numeric metrics worth charting (exclude booleans), pick first 3 for the chart.
export function chartMetrics(type: string) {
  return (DEVICE_METRICS[type] || []).filter((m) => !m.bool).slice(0, 3);
}
