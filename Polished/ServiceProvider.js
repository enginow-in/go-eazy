const express = require('express');
const { z } = require('zod');

const pool = require('../db/pool');
const { requireAuth } = require('./auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const schema = z.object({
  businessName: z.string().trim().min(2, 'Business name is required.').max(160),
  category: z.string().trim().min(2, 'Category is required.').max(80),
  documents: z.array(
    z.string().refine(
      (v) => v.startsWith('/uploads/') || /^https?:\/\//.test(v),
      'Each document must be a URL or an /uploads/... path from the upload endpoint.'
    )
  ).min(1, 'Attach at least one document.').max(5, 'Up to 5 documents.')
});

function toPublicProfile(row) {
  return {
    id: row.id,
    businessName: row.business_name,
    category: row.category,
    documents: row.documents,
    status: row.status,
    adminNote: row.admin_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// POST /api/service-providers/profile — create on first submit, or
// resubmit after a rejection. Resubmitting always resets status to
// `pending` so it re-enters the review queue.
router.post('/profile', requireAuth, validate(schema), async (req, res, next) => {
  if (req.user.role !== 'service') {
    return res.status(403).json({ error: 'Only service-provider accounts can submit a verification profile.' });
  }
  const { businessName, category, documents } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO service_provider_profiles (user_id, business_name, category, documents, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (user_id) DO UPDATE SET
         business_name = EXCLUDED.business_name,
         category = EXCLUDED.category,
         documents = EXCLUDED.documents,
         status = 'pending',
         admin_note = NULL,
         reviewed_at = NULL,
         reviewed_by = NULL,
         updated_at = now()
       RETURNING *`,
      [req.user.sub, businessName, category, documents]
    );
    res.status(201).json({ profile: toPublicProfile(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// GET /api/service-providers/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM service_provider_profiles WHERE user_id = $1', [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'No verification profile submitted yet.' });
    res.json({ profile: toPublicProfile(rows[0]) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;