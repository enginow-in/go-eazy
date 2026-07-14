const express = require('express');
const bcrypt = require('bcryptjs');

const pool = require('../db/pool');
const { validate, schemas } = require('../middleware/validate');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimit');
const { sendMail } = require('../utils/mailer');
const {
  signAccessToken,
  verifyAccessToken,
  generateRawToken,
  hashToken,
  refreshExpiryDate
} = require('../lib/tokens');

const router = express.Router();

const ACCESS_COOKIE = 'goeazy_access';
const REFRESH_COOKIE = 'goeazy_refresh';
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
function setAccessCookie(res, token) {
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, // mirrors the JWT's own 15m expiry
    path: '/'
  });
}

// Scoped to /api/auth so the refresh token is never sent on ordinary API
// calls — only to the one endpoint that needs it.
function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth'
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: Boolean(row.email_verified_at),
    createdAt: row.created_at
  };
}

// Issues a fresh access token + a brand new refresh token row, and sets
// both cookies. Used by signup, login, and the OAuth callback.
async function issueSession(res, user) {
  const accessToken = signAccessToken(user);
  const rawRefresh = generateRawToken();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [user.id, hashToken(rawRefresh), refreshExpiryDate()]
  );

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, rawRefresh);
}

async function sendVerificationEmail(user) {
  const rawToken = generateRawToken();
  await pool.query(
    `INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, 'email_verify', $3)`,
    [user.id, hashToken(rawToken), new Date(Date.now() + EMAIL_VERIFY_TTL_MS)]
  );

  const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your GoEazy email',
    text: `Hi ${user.name},\n\nVerify your email to finish setting up your GoEazy account:\n${verifyUrl}\n\nThis link expires in 24 hours.`
  });
}

// ---------------------------------------------------------------------------
// requireAuth — checks the short-lived access token. On expiry, responds
// with a machine-readable code so the frontend knows to call /refresh
// and retry, rather than treating every 401 as "log the user out".
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  const token = req.cookies[ACCESS_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not signed in.', code: 'NO_SESSION' });
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid session.', code: 'INVALID_TOKEN' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------
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
       RETURNING id, name, email, role, email_verified_at, created_at`,
      [name, email, passwordHash, role]
    );
    const user = rows[0];

    await issueSession(res, user);
    sendVerificationEmail(user).catch(err => console.error('Failed to send verification email:', err));

    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', loginLimiter, validate(schemas.login), async (req, res, next) => {
  const { email, password, role } = req.body;
  const genericError = () => res.status(401).json({ error: 'Incorrect email or password.' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return genericError();

    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account signs in with Google. Use "Continue with Google" instead.' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return genericError();

    if (role && user.role && role !== user.role) {
      return res.status(403).json({
        error: `This account is registered as a ${user.role}, not a ${role}. Switch tabs and try again.`
      });
    }

    await issueSession(res, user);
    res.json({ user: toPublicUser(user), needsRole: !user.role });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh — rotates the refresh token and issues a new
// access token. If the presented token was already used once before
// (i.e. it's been revoked but is being replayed), that's a signal of
// possible theft, so every other session for that user gets revoked too.
// ---------------------------------------------------------------------------
router.post('/refresh', async (req, res, next) => {
  const rawToken = req.cookies[REFRESH_COOKIE];
  if (!rawToken) return res.status(401).json({ error: 'No refresh token.', code: 'NO_REFRESH' });

  const tokenHash = hashToken(rawToken);

  try {
    const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    const record = rows[0];

    if (!record) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid refresh token.', code: 'INVALID_REFRESH' });
    }

    if (record.revoked_at || new Date(record.expires_at) < new Date()) {
      // Reused-after-revoke (or expired-but-still-presented) — treat as
      // potential theft and kill every session for this user.
      await pool.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [record.user_id]
      );
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token no longer valid. Please sign in again.', code: 'REFRESH_REVOKED' });
    }

    const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id = $1', [record.user_id]);
    const user = userRows[0];
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Account no longer exists.', code: 'NO_USER' });
    }

    // Rotate: revoke the presented token, issue a new one, link them.
    const newRawToken = generateRawToken();
    const { rows: newRows } = await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING id`,
      [user.id, hashToken(newRawToken), refreshExpiryDate()]
    );
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = now(), replaced_by = $1 WHERE id = $2`,
      [newRows[0].id, record.id]
    );

    setAccessCookie(res, signAccessToken(user));
    setRefreshCookie(res, newRawToken);

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout — revokes the current refresh token so it can't
// be replayed even if it leaked, then clears both cookies.
// ---------------------------------------------------------------------------
router.post('/logout', async (req, res, next) => {
  const rawToken = req.cookies[REFRESH_COOKIE];
  try {
    if (rawToken) {
      await pool.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
        [hashToken(rawToken)]
      );
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, email_verified_at, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: toPublicUser(rows[0]), needsRole: !rows[0].role });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/select-role — for accounts created without a role
// (Google sign-ins), or as a one-time correction. Matches the product's
// "Universal Role Selection: All new users (Google & Email) are prompted
// for a role upon first login."
// ---------------------------------------------------------------------------
router.post('/select-role', requireAuth, async (req, res, next) => {
  const { role } = req.body || {};
  const ROLES = ['tenant', 'landlord', 'service'];
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(', ')}` });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 AND role IS NULL
       RETURNING id, name, email, role, email_verified_at, created_at`,
      [role, req.user.sub]
    );
    if (!rows[0]) {
      return res.status(409).json({ error: 'This account already has a role set.' });
    }
    // Role changed — old access token still has the old (null) role baked
    // in, so issue a fresh one immediately.
    setAccessCookie(res, signAccessToken(rows[0]));
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  router,
  requireAuth,
  issueSession,
  sendVerificationEmail,
  toPublicUser,
  setAccessCookie,
  ACCESS_COOKIE,
  REFRESH_COOKIE
};