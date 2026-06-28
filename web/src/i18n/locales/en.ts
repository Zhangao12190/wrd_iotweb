export default {
  app: { title: 'WRD IoT Platform', tagline: 'Connected industrial equipment' },
  nav: {
    dashboard: 'Dashboard',
    devices: 'Devices',
    countries: 'Countries',
    users: 'Users',
    logout: 'Log out'
  },
  login: {
    title: 'Sign in',
    subtitle: 'Industrial IoT management platform',
    username: 'Username',
    password: 'Password',
    submit: 'Sign in',
    error: 'Invalid username or password',
    demo: 'Demo accounts'
  },
  role: { admin: 'Administrator', dealer: 'Dealer', user: 'Customer' },
  common: {
    online: 'Online', offline: 'Offline', total: 'Total',
    normal: 'Normal', warning: 'Warning', critical: 'Critical',
    status: 'Status', alarm: 'Alarm', search: 'Search', all: 'All',
    country: 'Country', type: 'Type', actions: 'Actions', save: 'Save',
    cancel: 'Cancel', create: 'Create', delete: 'Delete', edit: 'Edit',
    name: 'Name', serial: 'Serial', firmware: 'Firmware', owner: 'Owner',
    dealer: 'Dealer', lastSeen: 'Last seen', loading: 'Loading…',
    noData: 'No data', refresh: 'Refresh', never: 'Never', confirm: 'Confirm',
    close: 'Close', filters: 'Filters'
  },
  deviceType: {
    plasma_cutter: 'Plasma Cutter',
    welder: 'Welder',
    water_tank: 'Smart Water Tank',
    gas_control_box: 'Gas Control Box'
  },
  metric: {
    current: 'Current', voltage: 'Voltage', cutting_speed: 'Cutting speed',
    gas_pressure: 'Gas pressure', temperature: 'Temperature', arc_on: 'Arc on',
    wire_feed_speed: 'Wire feed speed', duty_cycle: 'Duty cycle', gas_flow: 'Gas flow',
    water_level: 'Water level', ph: 'pH', tds: 'TDS', flow_rate: 'Flow rate',
    pump_on: 'Pump', valve_position: 'Valve position',
    o2_concentration: 'O₂ concentration', leak_alarm: 'Leak alarm'
  },
  dashboard: {
    title: 'Overview',
    totalDevices: 'Total devices',
    onlineDevices: 'Online',
    warnings: 'Warnings',
    criticals: 'Critical alarms',
    byType: 'Devices by type',
    byStatus: 'Online / Offline',
    byCountry: 'Devices by country',
    recentAlarms: 'Recent alarms',
    noAlarms: 'No recent alarms'
  },
  countries: {
    title: 'Country breakdown',
    subtitle: 'How equipment performs across the markets you serve',
    matrix: 'Country × device type',
    deviceCount: 'Devices'
  },
  devices: {
    title: 'Devices',
    add: 'Add device',
    empty: 'No devices found',
    realtime: 'Live'
  },
  detail: {
    realtime: 'Real-time telemetry',
    history: 'History',
    events: 'Events & alarms',
    info: 'Device info',
    metrics: 'Live metrics',
    noTelemetry: 'Waiting for telemetry…',
    connected: 'Live connected',
    disconnected: 'Disconnected'
  },
  users: {
    title: 'Users',
    add: 'Add user',
    empty: 'No users',
    create: 'Create user'
  },
  form: {
    serial: 'Serial number', name: 'Name', type: 'Device type',
    country: 'Country', dealer: 'Dealer', owner: 'Owner (customer)',
    firmware: 'Firmware', role: 'Role', username: 'Username', password: 'Password'
  },
  country: {
    JP: 'Japan', KR: 'South Korea', TW: 'Taiwan', DE: 'Germany',
    FR: 'France', IT: 'Italy', US: 'United States', MX: 'Mexico',
    CA: 'Canada', CN: 'China'
  }
};
