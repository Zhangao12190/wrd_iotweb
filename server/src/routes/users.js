import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { authRequired, requireRole, hashPassword } from '../auth.js';

const router = Router();
router.use(authRequired);

function publicUser(u) {
  return {
    id: u.id, username: u.username, name: u.name, role: u.role,
    country: u.country, locale: u.locale, dealer_id: u.dealer_id, created_at: u.created_at
  };
}

// List users. admin sees all; dealer sees its own end-users.
router.get('/', requireRole('admin', 'dealer'), (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    const { role } = req.query;
    rows = role
      ? db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC').all(role)
      : db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  } else {
    rows = db.prepare(
      "SELECT * FROM users WHERE role='user' AND dealer_id = ? ORDER BY created_at DESC"
    ).all(req.user.id);
  }
  res.json({ users: rows.map(publicUser) });
});

// Create a user. admin can create dealers or users; dealer can create users under itself.
router.post('/', requireRole('admin', 'dealer'), (req, res) => {
  const { username, password, name, role, country, dealer_id, locale } = req.body || {};
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (!['dealer', 'user'].includes(role)) {
    return res.status(400).json({ error: 'invalid_role' });
  }
  if (req.user.role === 'dealer' && role !== 'user') {
    return res.status(403).json({ error: 'dealers_create_users_only' });
  }
  const finalDealer = req.user.role === 'dealer'
    ? req.user.id
    : (role === 'user' ? (dealer_id || null) : null);

  const id = nanoid(12);
  try {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, name, role, dealer_id, country, locale, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, hashPassword(password), name, role, finalDealer, country || null, locale || 'zh', Date.now());
  } catch {
    return res.status(409).json({ error: 'username_exists' });
  }
  res.status(201).json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)) });
});

export default router;
