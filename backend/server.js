/**
 * GoEazy — single-file backend
 * ------------------------------------------------------------
 * Serves /public/index.html and /public/login.html, and provides
 * the auth + property API both pages talk to.
 *
 * Storage: a flat JSON file at ./data/db.json (zero external DB
 * required to run this locally). Swap `readDB`/`writeDB` for a
 * real database (e.g. Postgres/Supabase) later without touching
 * the route handlers.
 *
 * Run:
 *   npm install
 *   npm start
 *   -> http://localhost:3000        (index.html)
 *   -> http://localhost:3000/login  (login.html)
 *
 * Env vars (create a .env or export before running):
 *   JWT_SECRET      required in production, defaults to a dev secret
 *   PORT            defaults to 3000
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const COOKIE_NAME = 'goeazy_token';
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const VALID_ROLES = ['tenant', 'landlord', 'service'];

// ---------------------------------------------------------------
// Tiny JSON "database"
// ---------------------------------------------------------------
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], properties: [] };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
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

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

// ---------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------

// POST /api/auth/signup  { name, email, password, role }
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are all required.' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const db = readDB();
  const emailLower = String(email).toLowerCase().trim();

  if (db.users.some(u => u.email === emailLower)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    name,
    email: emailLower,
    passwordHash,
    role,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  writeDB(db);

  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user) });
});

// POST /api/auth/login  { email, password, role }
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const db = readDB();
  const emailLower = String(email).toLowerCase().trim();
  const user = db.users.find(u => u.email === emailLower);

  // Same error for "no user" and "wrong password" — don't leak which one.
  const genericError = () => res.status(401).json({ error: 'Incorrect email or password.' });

  if (!user) return genericError();

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return genericError();

  if (role && role !== user.role) {
    return res.status(403).json({
      error: `This account is registered as a ${user.role}, not a ${role}. Switch tabs and try again.`
    });
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: publicUser(user) });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

// ---------------------------------------------------------------
// Property routes (minimal, matches the "GoEazy" front end)
// ---------------------------------------------------------------

// GET /api/properties — public listing, non-sensitive fields only
// (mirrors the "Tiered Data Access" idea from the product notes:
// lat/lng and contact details are never sent to anonymous callers)
app.get('/api/properties', (req, res) => {
  const db = readDB();
  const safe = db.properties
    .filter(p => p.status === 'live')
    .map(({ id, title, city, rentPerMonth, photos, createdAt }) => ({
      id, title, city, rentPerMonth, photos, createdAt
    }));
  res.json({ properties: safe });
});

// POST /api/properties — landlord creates a *draft* listing
// (goes live only after /api/properties/:id/pay succeeds, matching
// the "payment-gated API" behaviour described for the real product)
app.post('/api/properties', requireAuth, (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ error: 'Only landlord accounts can create listings.' });
  }
  const { title, city, rentPerMonth, photos } = req.body || {};
  if (!title || !city || !rentPerMonth) {
    return res.status(400).json({ error: 'title, city and rentPerMonth are required.' });
  }

  const db = readDB();
  const property = {
    id: crypto.randomUUID(),
    ownerId: req.user.sub,
    title,
    city,
    rentPerMonth,
    photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
    status: 'draft', // becomes 'live' once payment is verified
    createdAt: new Date().toISOString()
  };
  db.properties.push(property);
  writeDB(db);

  res.status(201).json({ property, next: `/api/properties/${property.id}/pay` });
});

// POST /api/properties/:id/pay — stubbed payment verification
// Replace this with a real Razorpay order + HMAC signature check
// before touching `status` in production.
app.post('/api/properties/:id/pay', requireAuth, (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({
      error: 'Missing Razorpay fields. This endpoint expects the values Razorpay returns after checkout.'
    });
  }

  // --- Real implementation would look like: -----------------------------
  // const expected = crypto
  //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  //   .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  //   .digest('hex');
  // if (expected !== razorpay_signature) return res.status(400).json({ error: 'Signature mismatch.' });
  // ------------------------------------------------------------------------

  const db = readDB();
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  if (property.ownerId !== req.user.sub) return res.status(403).json({ error: 'Not your listing.' });

  property.status = 'live';
  property.paidAt = new Date().toISOString();
  writeDB(db);

  res.json({ property });
});

// ---------------------------------------------------------------
// Page routes
// ---------------------------------------------------------------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

// Fallback 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.listen(PORT, () => {
  console.log(`GoEazy backend running → http://localhost:${PORT}`);
});