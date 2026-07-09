/**
 * GoEazy backend — entry point
 * ------------------------------------------------------------
 * Serves /public/index.html and /public/login.html, and mounts
 * the auth + property APIs. Real Postgres storage, real Razorpay
 * signature verification, validated input, rate-limited auth.
 *
 * Run:
 *   cp .env.example .env        (fill in the values)
 *   psql "$DATABASE_URL" -f db/schema.sql
 *   npm install
 *   npm start
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('Warning: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — checkout/pay endpoints will fail until they are.');
}

const { router: authRouter } = require('./routes/auth');
const propertiesRouter = require('./routes/properties');
const uploadsRouter = require('./routes/uploads');
const recentlyViewedRouter = require('./routes/recentlyViewed');
const { startPruneSchedule } = require('./lib/prune');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Local-disk upload storage for dev — see middleware/upload.js for the
// S3/Supabase swap note before deploying this anywhere with ephemeral disk.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/recently-viewed', recentlyViewedRouter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Central error handler — every route above calls next(err) on failure
// instead of formatting its own 500, so this is the one place that decides
// what a caller ever sees for an unexpected error.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === '23505') { // Postgres unique_violation, in case a race slips past the pre-check
    return res.status(409).json({ error: 'That record already exists.' });
  }
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`GoEazy backend running -> http://localhost:${PORT}`);
  startPruneSchedule(); // hourly sweep of recently_viewed rows older than 72h
});