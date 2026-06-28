import { Router } from 'express';
import { db } from '../db.js';
import { verifyPassword, signToken, authRequired } from '../auth.js';
import { capabilities } from '../rbac.js';

const router = Router();

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    country: u.country,
    locale: u.locale,
    dealer_id: u.dealer_id
  };
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user), capabilities: capabilities(user) });
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user), capabilities: capabilities(req.user) });
});

router.put('/me/locale', authRequired, (req, res) => {
  const { locale } = req.body || {};
  if (!['zh', 'ja', 'en'].includes(locale)) {
    return res.status(400).json({ error: 'invalid_locale' });
  }
  db.prepare('UPDATE users SET locale = ? WHERE id = ?').run(locale, req.user.id);
  res.json({ ok: true, locale });
});

export default router;
