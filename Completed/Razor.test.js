require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const { verifyPaymentSignature } = require('../utils/razorpay');

test('accepts a correctly signed payment', () => {
  const order_id = 'order_test123';
  const payment_id = 'pay_test456';
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  const ok = verifyPaymentSignature({
    razorpay_order_id: order_id,
    razorpay_payment_id: payment_id,
    razorpay_signature: signature
  });
  assert.equal(ok, true);
});

test('rejects a tampered signature', () => {
  const ok = verifyPaymentSignature({
    razorpay_order_id: 'order_test123',
    razorpay_payment_id: 'pay_test456',
    razorpay_signature: 'deadbeef'
  });
  assert.equal(ok, false);
});

test('rejects a signature computed for a different payment_id', () => {
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update('order_test123|pay_different')
    .digest('hex');

  const ok = verifyPaymentSignature({
    razorpay_order_id: 'order_test123',
    razorpay_payment_id: 'pay_test456', // mismatched on purpose
    razorpay_signature: signature
  });
  assert.equal(ok, false);
});