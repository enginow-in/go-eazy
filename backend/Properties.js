const express = require('express');

const pool = require('../db/pool');
const { requireAuth } = require('./auth');
const { validate, schemas } = require('../middleware/validate');
const { paymentLimiter } = require('../middleware/rateLimit');
const { createListingOrder, verifyPaymentSignature } = require('../utils/razorpay');

const router = express.Router();

function toPublicProperty(row) {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    rentPerMonth: Number(row.rent_per_month),
    photos: row.photos,
    createdAt: row.created_at
  };
}

// GET /api/properties — public, live listings only, non-sensitive fields.
// Mirrors "Tiered Data Access": lat/lng and contact info never leave the
// database for anonymous or unauthorized callers — see /:id/contact below.
router.get('/', async (req, res, next) => {
  const { city, minRent, maxRent, q } = req.query;
  const clauses = [`status = 'live'`];
  const params = [];

  if (city) { params.push(`%${city}%`); clauses.push(`city ILIKE $${params.length}`); }
  if (minRent) { params.push(Number(minRent)); clauses.push(`rent_per_month >= $${params.length}`); }
  if (maxRent) { params.push(Number(maxRent)); clauses.push(`rent_per_month <= $${params.length}`); }
  if (q) { params.push(`%${q}%`); clauses.push(`title ILIKE $${params.length}`); }

  try {
    const { rows } = await pool.query(
      `SELECT id, title, city, rent_per_month, photos, created_at
       FROM properties
       WHERE ${clauses.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT 100`,
      params
    );
    res.json({ properties: rows.map(toPublicProperty) });
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:id/contact — gated: only returns lat/lng + phone
// once the caller is signed in. (A real "pay ₹9 to unlock" gate would add
// a second check here against a per-user unlock record; left as a TODO.)
router.get('/:id/contact', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT latitude, longitude, contact_phone FROM properties WHERE id = $1 AND status = 'live'`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Listing not found.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/properties — landlord creates a draft listing.
router.post('/', requireAuth, validate(schemas.createProperty), async (req, res, next) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ error: 'Only landlord accounts can create listings.' });
  }
  const { title, city, rentPerMonth, photos, latitude, longitude, contactPhone } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO properties (owner_id, title, city, rent_per_month, photos, latitude, longitude, contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.sub, title, city, rentPerMonth, photos || [], latitude ?? null, longitude ?? null, contactPhone ?? null]
    );
    const property = rows[0];
    res.status(201).json({
      property: toPublicProperty(property),
      status: property.status,
      next: `/api/properties/${property.id}/checkout`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/properties/:id/checkout — creates a real Razorpay order for
// the ₹199 listing fee. Frontend takes the returned order id into
// Razorpay's checkout widget.
router.post('/:id/checkout', requireAuth, paymentLimiter, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    const property = rows[0];
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    if (property.owner_id !== req.user.sub) return res.status(403).json({ error: 'Not your listing.' });
    if (property.status === 'live') return res.status(400).json({ error: 'This listing is already live.' });

    const order = await createListingOrder(property.id);

    await pool.query('UPDATE properties SET razorpay_order_id = $1 WHERE id = $2', [order.id, property.id]);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID // safe to expose — it's the public key
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/properties/:id/pay — verifies the Razorpay signature for real
// before flipping the listing to `live`. This is the check that matters;
// nothing here trusts the client's word for it.
router.post('/:id/pay', requireAuth, paymentLimiter, validate(schemas.verifyPayment), async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const { rows } = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    const property = rows[0];
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    if (property.owner_id !== req.user.sub) return res.status(403).json({ error: 'Not your listing.' });
    if (property.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order id does not match this listing.' });
    }

    const valid = verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!valid) {
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    const { rows: updated } = await pool.query(
      `UPDATE properties SET status = 'live', paid_at = now() WHERE id = $1 RETURNING *`,
      [property.id]
    );

    res.json({ property: toPublicProperty(updated[0]), status: updated[0].status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;