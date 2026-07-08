const crypto = require('crypto');
const Razorpay = require('razorpay');

const LISTING_FEE_PAISE = 19900; // ₹199.00, in the smallest currency unit Razorpay expects

let client = null;
function getClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set. Add them to .env.');
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return client;
}

/**
 * Creates a Razorpay order for a listing's ₹199 activation fee.
 * The returned order id is what the frontend's Razorpay checkout widget
 * needs to open the payment sheet.
 */
async function createListingOrder(propertyId) {
  const razorpay = getClient();
  return razorpay.orders.create({
    amount: LISTING_FEE_PAISE,
    currency: 'INR',
    receipt: `listing_${propertyId}`,
    notes: { propertyId }
  });
}

/**
 * Verifies the HMAC-SHA256 signature Razorpay sends back after checkout.
 * This is the check that actually matters — never mark a listing as paid
 * without it passing.
 */
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_SECRET is not set. Add it to .env.');
  }
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // timingSafeEqual requires equal-length buffers; guard against mismatched
  // lengths throwing instead of just failing the comparison.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(razorpay_signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { LISTING_FEE_PAISE, createListingOrder, verifyPaymentSignature };