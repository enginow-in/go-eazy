const express = require('express');
const crypto = require('crypto');

const pool = require('../db/pool');
const { issueSession } = require('/auth');

const router = express.Router();

const STATE_COOKIE = 'goeazy_oauth_state';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

function requireGoogleConfig(req, res, next) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return res.status(500).json({
      error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env.'
    });
  }
  next();
}

// GET /api/auth/google — kicks off the flow. A random `state` value is
// stored in a short-lived cookie and echoed back by Google; comparing the
// two on callback is what prevents CSRF on the OAuth redirect.
router.get('/google', requireGoogleConfig, (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');

  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth/google'
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account'
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// GET /api/auth/google/callback — Google redirects here with ?code&state.
router.get('/google/callback', requireGoogleConfig, async (req, res, next) => {
  const { code, state, error: googleError } = req.query;
  const expectedState = req.cookies[STATE_COOKIE];
  const frontend = process.env.APP_BASE_URL || 'http://localhost:3000';

  res.clearCookie(STATE_COOKIE, { path: '/api/auth/google' });

  if (googleError) {
    return res.redirect(`${frontend}/login?error=${encodeURIComponent(String(googleError))}`);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return res.redirect(`${frontend}/login?error=oauth_state_mismatch`);
  }

  try {
    // Exchange the authorization code for an access token.
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return res.redirect(`${frontend}/login?error=oauth_token_exchange_failed`);
    }
    const { access_token } = await tokenRes.json();

    // Fetch the user's Google profile.
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!profileRes.ok) {
      console.error('Google userinfo fetch failed:', await profileRes.text());
      return res.redirect(`${frontend}/login?error=oauth_profile_fetch_failed`);
    }
    const profile = await profileRes.json(); // { sub, email, email_verified, name, picture, ... }

    if (!profile.email) {
      return res.redirect(`${frontend}/login?error=oauth_no_email`);
    }

    // Find or create the user. Google already verified this email, so we
    // trust it and mark the account verified immediately.
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [profile.email.toLowerCase(), profile.sub]
    );

    let user = existingRows[0];
    if (user) {
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [profile.sub, user.id]);
      }
      if (!user.email_verified_at) {
        await pool.query('UPDATE users SET email_verified_at = now() WHERE id = $1', [user.id]);
      }
    } else {
      const { rows: created } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, google_id, email_verified_at)
         VALUES ($1, $2, NULL, NULL, $3, now())
         RETURNING *`,
        [profile.name || profile.email.split('@')[0], profile.email.toLowerCase(), profile.sub]
      );
      user = created[0];
    }

    await issueSession(res, user);
    res.redirect(user.role ? `${frontend}/` : `${frontend}/login?needsRole=1`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;