const rateLimit = require('express-rate-limit');

// Generic JSON response instead of the default plain-text one.
function jsonHandler(req, res) {
  res.status(429).json({ error: 'Too many requests. Please wait a bit and try again.' });
}

// Login: the classic brute-force target. Keyed by IP + email so one bad
// actor can't lock out other users sharing the same IP (e.g. campus wifi).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body && req.body.email) || 'unknown'}`,
  handler: jsonHandler
});

// Signup: slightly looser, still capped per IP to slow down mass account creation.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

// Payment verification: low volume by nature, keep it tight.
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

module.exports = { loginLimiter, signupLimiter, paymentLimiter };