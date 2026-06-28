export default {
  app: { title: 'WRD IoT プラットフォーム', tagline: '産業機器の接続管理' },
  nav: {
    dashboard: 'ダッシュボード',
    devices: 'デバイス',
    countries: '国別分布',
    users: 'ユーザー管理',
    logout: 'ログアウト'
  },
  login: {
    title: 'ログイン',
    subtitle: '産業用 IoT 管理プラットフォーム',
    username: 'ユーザー名',
    password: 'パスワード',
    submit: 'ログイン',
    error: 'ユーザー名またはパスワードが正しくありません',
    demo: 'デモアカウント'
  },
  role: { admin: '管理者', dealer: '販売店', user: '顧客' },
  common: {
    online: 'オンライン', offline: 'オフライン', total: '合計',
    normal: '正常', warning: '警告', critical: '重大',
    status: 'ステータス', alarm: 'アラーム', search: '検索', all: 'すべて',
    country: '国', type: '種類', actions: '操作', save: '保存',
    cancel: 'キャンセル', create: '作成', delete: '削除', edit: '編集',
    name: '名称', serial: 'シリアル番号', firmware: 'ファームウェア', owner: '顧客',
    dealer: '販売店', lastSeen: '最終通信', loading: '読み込み中…',
    noData: 'データなし', refresh: '更新', never: 'なし', confirm: '確定',
    close: '閉じる', filters: 'フィルター'
  },
  deviceType: {
    plasma_cutter: 'プラズマ切断機',
    welder: '溶接機',
    water_tank: 'スマート水タンク',
    gas_control_box: 'ガス制御ボックス'
  },
  metric: {
    current: '電流', voltage: '電圧', cutting_speed: '切断速度',
    gas_pressure: 'ガス圧', temperature: '温度', arc_on: 'アーク',
    wire_feed_speed: 'ワイヤ送給速度', duty_cycle: '使用率', gas_flow: 'ガス流量',
    water_level: '水位', ph: 'pH', tds: 'TDS', flow_rate: '流量',
    pump_on: 'ポンプ', valve_position: 'バルブ開度',
    o2_concentration: '酸素濃度', leak_alarm: '漏れ警報'
  },
  dashboard: {
    title: 'ダッシュボード',
    totalDevices: 'デバイス総数',
    onlineDevices: 'オンライン',
    warnings: '警告',
    criticals: '重大アラーム',
    byType: 'タイプ別',
    byStatus: 'オンライン / オフライン',
    byCountry: '国別分布',
    recentAlarms: '最新アラーム',
    noAlarms: 'アラームなし'
  },
  countries: {
    title: '国別分布',
    subtitle: '各国に出荷した機器の稼働状況',
    matrix: '国 × デバイスタイプ',
    deviceCount: 'デバイス数'
  },
  devices: {
    title: 'デバイス',
    add: 'デバイス追加',
    empty: 'デバイスが見つかりません',
    realtime: 'ライブ'
  },
  detail: {
    realtime: 'リアルタイム計測',
    history: '履歴',
    events: 'イベント・アラーム',
    info: 'デバイス情報',
    metrics: 'ライブ指標',
    noTelemetry: 'テレメトリ待機中…',
    connected: 'ライブ接続中',
    disconnected: '切断'
  },
  users: {
    title: 'ユーザー管理',
    add: 'ユーザー追加',
    empty: 'ユーザーなし',
    create: 'ユーザー作成'
  },
  form: {
    serial: 'シリアル番号', name: '名称', type: 'デバイスタイプ',
    country: '国', dealer: '販売店', owner: '顧客',
    firmware: 'ファームウェア', role: '役割', username: 'ユーザー名', password: 'パスワード'
  },
  country: {
    JP: '日本', KR: '韓国', TW: '台湾', DE: 'ドイツ',
    FR: 'フランス', IT: 'イタリア', US: 'アメリカ', MX: 'メキシコ',
    CA: 'カナダ', CN: '中国'
  }
};
