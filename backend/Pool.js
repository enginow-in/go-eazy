const { Pool } = require('pg');

// DATABASE_URL works for plain Postgres AND for a Supabase project's
// connection string (Project Settings → Database → Connection string).
// Example: postgresql://user:pass@host:5432/dbname
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  // Most managed Postgres providers (Supabase included) require SSL.
  // Disabled automatically for local dev connections.
  ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;