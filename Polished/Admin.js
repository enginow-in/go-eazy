const express = require('express');
const { z } = require('zod');

const pool = require('../db/pool');
const { requireAuth } = require('./auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth, requireAdmin);

function toPublicProfile(row) {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    category: row.category,
    documents: row.documents,
    status: row.status,
    adminNote: row.admin_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email
  };
}

// ---------------------------------------------------------------------------
// Service provider verification queue
// ---------------------------------------------------------------------------

// GET /api/admin/service-providers?status=pending — defaults to the
// review queue (pending only); pass status=approved|rejected|all for others.
router.get('/service-providers', async (req, res, next) => {
  const status = req.query.status || 'pending';
  const clause = status === 'all' ? '' : 'WHERE sp.status = $1';
  const params = status === 'all' ? [] : [status];

  try {
    const { rows } = await pool.query(
      `SELECT sp.*, u.name AS owner_name, u.email AS owner_email
       FROM service_provider_profiles sp
       JOIN users u ON u.id = sp.user_id
       ${clause}
       ORDER BY sp.created_at ASC`,
      params
    );
    res.json({ profiles: rows.map(toPublicProfile) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/service-providers/:id/approve
router.post('/service-providers/:id/approve', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE service_provider_profiles
       SET status = 'approved', admin_note = NULL, reviewed_at = now(), reviewed_by = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [req.user.sub, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Profile not found.' });
    res.json({ profile: toPublicProfile(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/service-providers/:id/reject  { note? }
router.post(
  '/service-providers/:id/reject',
  validate(z.object({ note: z.string().trim().max(500).optional() })),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `UPDATE service_provider_profiles
         SET status = 'rejected', admin_note = $1, reviewed_at = now(), reviewed_by = $2, updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [req.body.note || null, req.user.sub, req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Profile not found.' });
      res.json({ profile: toPublicProfile(rows[0]) });
    } catch (err) {
      next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// Live platform metrics — matches the product's "Live Platform Metrics:
// real-time telemetry governing platform health across Users, Properties,
// and Service Providers."
// ---------------------------------------------------------------------------
router.get('/metrics', async (req, res, next) => {
  try {
    const [users, properties, reviews, serviceProviders, revenue] = await Promise.all([
      pool.query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`),
      pool.query(`SELECT status, COUNT(*)::int AS count FROM properties GROUP BY status`),
      pool.query(`SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average_rating FROM reviews`),
      pool.query(`SELECT status, COUNT(*)::int AS count FROM service_provider_profiles GROUP BY status`),
      pool.query(`SELECT COUNT(*)::int AS paid_listings, COALESCE(SUM(199), 0)::int AS total_revenue_inr
                  FROM properties WHERE status = 'live'`)
    ]);

    const toMap = (rows, key) => Object.fromEntries(rows.map(r => [r[key] ?? 'unset', r.count]));

    res.json({
      users: { total: users.rows.reduce((s, r) => s + r.count, 0), byRole: toMap(users.rows, 'role') },
      properties: { total: properties.rows.reduce((s, r) => s + r.count, 0), byStatus: toMap(properties.rows, 'status') },
      reviews: { count: reviews.rows[0].count, averageRating: Math.round(reviews.rows[0].average_rating * 10) / 10 },
      serviceProviders: {
        total: serviceProviders.rows.reduce((s, r) => s + r.count, 0),
        byStatus: toMap(serviceProviders.rows, 'status')
      },
      revenue: {
        paidListings: revenue.rows[0].paid_listings,
        totalInr: revenue.rows[0].total_revenue_inr
      },
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;