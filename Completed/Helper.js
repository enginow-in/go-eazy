require('dotenv').config();
const pool = require('../db/pool');

const TABLES = [
  'refresh_tokens',
  'verification_tokens',
  'reviews',
  'recently_viewed',
  'service_provider_profiles',
  'properties',
  'users'
];

async function resetDb() {
  const url = process.env.DATABASE_URL || '';
  const looksSafe = process.env.NODE_ENV === 'test' || /test|localhost|127\.0\.0\.1/.test(url);
  if (!looksSafe) {
    throw new Error(
      'Refusing to run tests: DATABASE_URL doesn\'t look like a local/test database ' +
      '(set NODE_ENV=test, or point DATABASE_URL at a database with "test" in its name, ' +
      'or run against localhost). This suite TRUNCATEs every table — never point it at production.'
    );
  }
  await pool.query(`TRUNCATE ${TABLES.join(', ')} CASCADE`);
}

async function closeDb() {
  await pool.end();
}

module.exports = { resetDb, closeDb, pool };