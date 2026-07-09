const express = require('express');

const pool = require('../db/pool');
const { requireAuth } = require('./auth');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router({ mergeParams: true }); // mounted at /api/properties/:id/reviews

// GET /api/properties/:id/reviews — public. Reviewer name shown, not email.
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.property_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    const { rows: agg } = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
       FROM reviews WHERE property_id = $1`,
      [req.params.id]
    );

    res.json({
      reviews: rows.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewerName: r.reviewer_name
      })),
      summary: { count: agg[0].count, average: Math.round(agg[0].average * 10) / 10 }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/properties/:id/reviews — one review per (property, user).
// "Reviewer verification" (per the product notes) here means: you can only
// review a property once, under your own signed-in identity — not
// anonymous, not repeatable. Swap in a "must have booked a visit" check
// for a stronger form of verification once site-visit bookings exist.
router.post('/', requireAuth, validate(schemas.createReview), async (req, res, next) => {
  const { rating, comment } = req.body;

  try {
    const { rows: propRows } = await pool.query(
      `SELECT id FROM properties WHERE id = $1 AND status = 'live'`,
      [req.params.id]
    );
    if (!propRows[0]) return res.status(404).json({ error: 'Listing not found.' });

    const { rows } = await pool.query(
      `INSERT INTO reviews (property_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (property_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
       RETURNING id, rating, comment, created_at`,
      [req.params.id, req.user.sub, rating, comment ?? null]
    );

    res.status(201).json({ review: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;