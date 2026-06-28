import { nanoid } from 'nanoid';
import { db, initSchema } from './db.js';
import { hashPassword } from './auth.js';
import { DEVICE_TYPE_KEYS } from './deviceTypes.js';

// Seed demo data: one platform admin, several dealers (each selling into a set of
// countries), end-users under each dealer, and a fleet of the four device types
// spread across countries. Idempotent: only runs when the users table is empty.

const DEVICE_NAME = {
  plasma_cutter: 'Plasma Cutter',
  welder: 'Welder',
  water_tank: 'Smart Water Tank',
  gas_control_box: 'Gas Control Box'
};

const SERIAL_PREFIX = {
  plasma_cutter: 'PLC',
  welder: 'WLD',
  water_tank: 'WTK',
  gas_control_box: 'GCB'
};

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function ensureSeed() {
  initSchema();
  const count = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (count > 0) return;

  console.log('[seed] empty database, seeding demo data...');

  const now = Date.now();
  const insUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, role, dealer_id, country, locale, created_at)
    VALUES (@id, @username, @password_hash, @name, @role, @dealer_id, @country, @locale, @created_at)
  `);
  const insDevice = db.prepare(`
    INSERT INTO devices (id, serial, name, type, owner_user_id, dealer_id, country, firmware, status, alarm, created_at)
    VALUES (@id, @serial, @name, @type, @owner_user_id, @dealer_id, @country, @firmware, 'offline', 'normal', @created_at)
  `);

  // ---- platform admin ----
  insUser.run({
    id: nanoid(12), username: 'admin', password_hash: hashPassword('admin123'),
    name: 'Platform Admin', role: 'admin', dealer_id: null, country: 'CN', locale: 'zh', created_at: now
  });

  // ---- dealers, each with a market (set of destination countries) ----
  const dealers = [
    { id: nanoid(12), username: 'dealer_jp', name: 'Sakura Industrial (JP)', country: 'JP', markets: ['JP', 'KR', 'TW'] },
    { id: nanoid(12), username: 'dealer_eu', name: 'EuroWeld GmbH (DE)', country: 'DE', markets: ['DE', 'FR', 'IT'] },
    { id: nanoid(12), username: 'dealer_us', name: 'PacWest Equipment (US)', country: 'US', markets: ['US', 'MX', 'CA'] }
  ];
  for (const d of dealers) {
    insUser.run({
      id: d.id, username: d.username, password_hash: hashPassword('dealer123'),
      name: d.name, role: 'dealer', dealer_id: null, country: d.country, locale: 'en', created_at: now
    });
  }

  // ---- end-users under each dealer ----
  let userIdx = 1;
  const usersByDealer = {};
  for (const d of dealers) {
    usersByDealer[d.id] = [];
    const n = 3;
    for (let i = 0; i < n; i++) {
      const country = rand(d.markets);
      const id = nanoid(12);
      insUser.run({
        id, username: `user${userIdx}`, password_hash: hashPassword('user123'),
        name: `Customer ${userIdx}`, role: 'user', dealer_id: d.id, country, locale: 'en', created_at: now
      });
      usersByDealer[d.id].push({ id, country });
      userIdx++;
    }
  }

  // ---- devices: spread the four types across each dealer's users/markets ----
  let serialIdx = 1000;
  const insertDevices = db.transaction(() => {
    for (const d of dealers) {
      const users = usersByDealer[d.id];
      // ~10-14 devices per dealer
      const total = 10 + Math.floor(Math.random() * 5);
      for (let i = 0; i < total; i++) {
        const type = rand(DEVICE_TYPE_KEYS);
        const owner = rand(users);
        const country = Math.random() < 0.7 ? owner.country : rand(d.markets);
        serialIdx++;
        insDevice.run({
          id: nanoid(12),
          serial: `${SERIAL_PREFIX[type]}-${country}-${serialIdx}`,
          name: `${DEVICE_NAME[type]} #${serialIdx}`,
          type,
          owner_user_id: owner.id,
          dealer_id: d.id,
          country,
          firmware: rand(['1.0.0', '1.2.3', '2.0.1']),
          created_at: now
        });
      }
    }
  });
  insertDevices();

  const stats = {
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    devices: db.prepare('SELECT COUNT(*) c FROM devices').get().c
  };
  console.log(`[seed] done: ${stats.users} users, ${stats.devices} devices`);
  console.log('[seed] logins -> admin/admin123, dealer_jp|dealer_eu|dealer_us /dealer123, user1.../user123');
}

// allow running directly: `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  ensureSeed();
}
