export default {
  app: { title: 'WRD 物联网平台', tagline: '工业设备互联管理' },
  nav: {
    dashboard: '总览',
    devices: '设备',
    countries: '国家分布',
    users: '用户管理',
    logout: '退出登录'
  },
  login: {
    title: '登录',
    subtitle: '工业物联网管理平台',
    username: '用户名',
    password: '密码',
    submit: '登录',
    error: '用户名或密码错误',
    demo: '演示账号'
  },
  role: { admin: '平台管理员', dealer: '经销商', user: '客户' },
  common: {
    online: '在线', offline: '离线', total: '总数',
    normal: '正常', warning: '警告', critical: '严重',
    status: '状态', alarm: '告警', search: '搜索', all: '全部',
    country: '国家', type: '类型', actions: '操作', save: '保存',
    cancel: '取消', create: '新建', delete: '删除', edit: '编辑',
    name: '名称', serial: '序列号', firmware: '固件', owner: '所属客户',
    dealer: '经销商', lastSeen: '最后上线', loading: '加载中…',
    noData: '暂无数据', refresh: '刷新', never: '从未', confirm: '确定',
    close: '关闭', filters: '筛选'
  },
  deviceType: {
    plasma_cutter: '等离子切割机',
    welder: '焊机',
    water_tank: '智能水箱',
    gas_control_box: '气控箱'
  },
  metric: {
    current: '电流', voltage: '电压', cutting_speed: '切割速度',
    gas_pressure: '气压', temperature: '温度', arc_on: '起弧',
    wire_feed_speed: '送丝速度', duty_cycle: '负载率', gas_flow: '气体流量',
    water_level: '水位', ph: 'pH 值', tds: 'TDS', flow_rate: '流量',
    pump_on: '水泵', valve_position: '阀门开度',
    o2_concentration: '氧气浓度', leak_alarm: '泄漏报警'
  },
  dashboard: {
    title: '总览',
    totalDevices: '设备总数',
    onlineDevices: '在线设备',
    warnings: '警告',
    criticals: '严重告警',
    byType: '按设备类型',
    byStatus: '在线 / 离线',
    byCountry: '按国家分布',
    recentAlarms: '最新告警',
    noAlarms: '暂无告警'
  },
  countries: {
    title: '国家分布',
    subtitle: '查看销往各国设备的运行情况',
    matrix: '国家 × 设备类型',
    deviceCount: '设备数'
  },
  devices: {
    title: '设备',
    add: '新增设备',
    empty: '未找到设备',
    realtime: '实时'
  },
  detail: {
    realtime: '实时遥测',
    history: '历史数据',
    events: '事件与告警',
    info: '设备信息',
    metrics: '实时指标',
    noTelemetry: '等待遥测数据…',
    connected: '实时已连接',
    disconnected: '已断开'
  },
  users: {
    title: '用户管理',
    add: '新增用户',
    empty: '暂无用户',
    create: '创建用户'
  },
  form: {
    serial: '序列号', name: '名称', type: '设备类型',
    country: '国家', dealer: '经销商', owner: '所属客户',
    firmware: '固件版本', role: '角色', username: '用户名', password: '密码'
  },
  country: {
    JP: '日本', KR: '韩国', TW: '中国台湾', DE: '德国',
    FR: '法国', IT: '意大利', US: '美国', MX: '墨西哥',
    CA: '加拿大', CN: '中国'
  }
};
