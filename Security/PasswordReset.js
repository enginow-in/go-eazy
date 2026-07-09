const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const pool = require('../db/pool');
const { validate } = require('../middleware/validate');
const { sendMail } = require('../utils/mailer');
const { generateRawToken, hashToken } = require('../lib/tokens');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: 'Too many reset requests. Please wait a bit and try again.' })
});

const schemas = {
  forgot: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address.')
  }),
  reset: z.object({
    token: z.string().min(1, 'Reset token is required.'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters.').max(200)
  })
};

// POST /api/auth/forgot-password — always responds the same way whether
// or not the email exists, so this endpoint can't be used to check which
// emails have accounts.
router.post('/forgot-password', forgotLimiter, validate(schemas.forgot), async (req, res, next) => {
  const { email } = req.body;
  const genericResponse = () => res.json({ ok: true, message: 'If that email has an account, a reset link is on its way.' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !user.password_hash) {
      // Either no account, or a Google-only account with no password to reset.
      return genericResponse();
    }

    const rawToken = generateRawToken();
    await pool.query(
      `INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
       VALUES ($1, $2, 'password_reset', $3)`,
      [user.id, hashToken(rawToken), new Date(Date.now() + RESET_TTL_MS)]
    );

    const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your GoEazy password',
      text: `Hi ${user.name},\n\nReset your password here:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`
    });

    genericResponse();
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(schemas.reset), async (req, res, next) => {
  const { token, newPassword } = req.body;
  const tokenHash = hashToken(token);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM verification_tokens
       WHERE token_hash = $1 AND purpose = 'password_reset' AND used_at IS NULL AND expires_at > now()`,
      [tokenHash]
    );
    const record = rows[0];
    if (!record) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query('BEGIN');
    try {
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, record.user_id]);
      await pool.query('UPDATE verification_tokens SET used_at = now() WHERE id = $1', [record.id]);
      // Resetting a password is a "sign out everywhere" moment — revoke
      // every existing refresh token so old sessions can't linger.
      await pool.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [record.user_id]
      );
      await pool.query('COMMIT');
    } catch (txErr) {
      await pool.query('ROLLBACK');
      throw txErr;
    }

    res.json({ ok: true, message: 'Password updated. Please sign in again.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;