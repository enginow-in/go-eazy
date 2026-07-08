const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../db/pool');
const { validate, schemas } = require('../middleware/validate');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const COOKIE_NAME = 'goeazy_token';
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at };
}

function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not signed in.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please sign in again.' });
  }
}

// POST /api/auth/signup
router.post('/signup', signupLimiter, validate(schemas.signup), async (req, res, next) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );

    const user = rows[0];
    setAuthCookie(res, signToken(user));
    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(schemas.login), async (req, res, next) => {
  const { email, password, role } = req.body;
  const genericError = () => res.status(401).json({ error: 'Incorrect email or password.' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return genericError();

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return genericError();

    if (role && role !== user.role) {
      return res.status(403).json({
        error: `This account is registered as a ${user.role}, not a ${role}. Switch tabs and try again.`
      });
    }

    setAuthCookie(res, signToken(user));
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, requireAuth };