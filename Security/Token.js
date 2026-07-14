const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---------------------------------------------------------------------------
// Access tokens — short-lived JWTs, never stored server-side. Expiry alone
// limits how long a stolen access token is useful for.
// ---------------------------------------------------------------------------
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET); // throws TokenExpiredError / JsonWebTokenError
}

// ---------------------------------------------------------------------------
// Refresh tokens — opaque random strings. Only a SHA-256 hash is ever
// stored, so a database leak alone can't be replayed as a live session.
// This is what makes revocation actually possible: delete/mark the row
// and the token stops working immediately, unlike a stateless JWT.
// ---------------------------------------------------------------------------
function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function refreshExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

module.exports = {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_MS,
  signAccessToken,
  verifyAccessToken,
  generateRawToken,
  hashToken,
  refreshExpiryDate
};