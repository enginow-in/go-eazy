const express = require('express');

const pool = require('../db/pool');
const { requireAuth } = require('./auth');
const { pruneRecentlyViewed } = require('../lib/prune');

const router = express.Router();

// POST /api/recently-viewed/:propertyId — call when a signed-in user opens
// a listing's detail page. Upserts so re-viewing just bumps the timestamp
// instead of creating duplicate rows.
router.post('/:propertyId', requireAuth, async (req, res, next) => {
  try {
    const { rows: propRows } = await pool.query(
      `SELECT id FROM properties WHERE id = $1 AND status = 'live'`,
      [req.params.propertyId]
    );
    if (!propRows[0]) return res.status(404).json({ error: 'Listing not found.' });

    await pool.query(
      `INSERT INTO recently_viewed (user_id, property_id, viewed_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id, property_id) DO UPDATE SET viewed_at = now()`,
      [req.user.sub, req.params.propertyId]
    );

    // Cheap inline prune — keeps the table from growing between the
    // hourly scheduled sweep in lib/prune.js.
    pruneRecentlyViewed().catch(err => console.error('inline prune failed:', err));

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/recently-viewed — this user's views from the last 72 hours,
// most recent first.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.title, p.city, p.rent_per_month, p.photos, rv.viewed_at
       FROM recently_viewed rv
       JOIN properties p ON p.id = rv.property_id
       WHERE rv.user_id = $1 AND rv.viewed_at >= now() - interval '72 hours'
       ORDER BY rv.viewed_at DESC
       LIMIT 20`,
      [req.user.sub]
    );

    res.json({
      properties: rows.map(r => ({
        id: r.id,
        title: r.title,
        city: r.city,
        rentPerMonth: Number(r.rent_per_month),
        photos: r.photos,
        viewedAt: r.viewed_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;