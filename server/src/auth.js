import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'wrd-iot-dev-secret-change-me';
const TOKEN_TTL = '12h';

export function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// Express middleware: requires a valid Bearer token, attaches req.user
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.sub);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// Express middleware factory: restrict to given roles
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

// Verify a token string (used by the WebSocket layer)
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return getUserById(decoded.sub) || null;
  } catch {
    return null;
  }
}
