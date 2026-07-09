const pool = require('../db/pool');

/**
 * Deletes recently_viewed rows older than 72 hours. Called both inline
 * (cheap, keeps the table small on every write) and on a periodic timer
 * as a backstop for rows nobody happens to touch again.
 */
async function pruneRecentlyViewed() {
  const { rowCount } = await pool.query(
    `DELETE FROM recently_viewed WHERE viewed_at < now() - interval '72 hours'`
  );
  return rowCount;
}

/**
 * Starts a periodic prune. Call once at server startup.
 * Returns the interval handle in case the caller wants to clear it (tests, etc).
 */
function startPruneSchedule(intervalMs = 60 * 60 * 1000) {
  return setInterval(() => {
    pruneRecentlyViewed().catch(err => console.error('recently_viewed prune failed:', err));
  }, intervalMs);
}

module.exports = { pruneRecentlyViewed, startPruneSchedule };