/**
 * GoEazy backend — the Express app itself.
 * ------------------------------------------------------------
 * Split from server.js so tests can `require('./app')` and hit routes
 * with supertest without needing a real listening port or a running
 * prune schedule.
 */

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const pool = require('./db/pool');
const logger = require('./lib/logger');

const { router: authRouter } = require('./routes/auth');
const passwordResetRouter = require('./routes/passwordReset');
const emailVerificationRouter = require('./routes/emailVerification');
const oauthRouter = require('./routes/oauth');
const propertiesRouter = require('./routes/properties');
const uploadsRouter = require('./routes/uploads');
const recentlyViewedRouter = require('./routes/recentlyViewed');
const serviceProvidersRouter = require('./routes/serviceProviders');
const adminRouter = require('./routes/admin');

const app = express();

app.disable('x-powered-by');

// Structured request logging — one JSON line per request in production,
// pretty-printed in dev. Skips noisy health-check polling so real traffic
// doesn't get buried under it.
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/api/health' },
  // Never let a stray log statement leak credentials or session tokens.
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]']
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Local-disk upload storage for dev — see lib/storage.js for the
// S3/Supabase swap (STORAGE_DRIVER=s3) before deploying with ephemeral disk.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/auth', passwordResetRouter);
app.use('/api/auth', emailVerificationRouter);
app.use('/api/auth', oauthRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/recently-viewed', recentlyViewedRouter);
app.use('/api/service-providers', serviceProvidersRouter);
app.use('/api/admin', adminRouter);

// GET /api/health — used by Docker HEALTHCHECK and hosting platforms
// (Railway/Render) to confirm the app *and* its DB connection are up,
// not just that the process is running.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'unreachable' });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forgot-password.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset-password.html')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Central error handler — every route calls next(err) on failure instead
// of formatting its own 500, so this is the one place that decides what
// a caller ever sees for an unexpected error.
app.use((err, req, res, next) => {
  (req.log || logger).error({ err }, 'Unhandled error');
  if (err.code === '23505') { // Postgres unique_violation, in case a race slips past the pre-check
    return res.status(409).json({ error: 'That record already exists.' });
  }
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
});

module.exports = app;