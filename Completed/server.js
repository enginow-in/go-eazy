/**
 * GoEazy backend — entry point.
 *
 * Run:
 *   cp .env.example .env        (fill in the values)
 *   psql "$DATABASE_URL" -f db/schema.sql
 *   npm install
 *   npm start
 */

require('dotenv').config();

const logger = require('./lib/logger');

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length) {
  logger.error(`Missing required env vars: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  logger.warn('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — checkout/pay endpoints will fail until they are.');
}

const app = require('/app');
const { startPruneSchedule } = require('./lib/prune');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`GoEazy backend running -> http://localhost:${PORT}`);
  startPruneSchedule(); // hourly sweep of recently_viewed rows older than 72h
});

// Give in-flight requests a chance to finish instead of dropping them,
// on the SIGTERM most hosting platforms send before killing a container.
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully.');
  server.close(() => process.exit(0));
});

module.exports = server;