const { z } = require('zod');

/**
 * Wraps a Zod schema as Express middleware.
 * On failure, responds 400 with a flattened, readable error list instead
 * of a raw Zod error object.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map(i => ({
        field: i.path.join('.') || '(body)',
        message: i.message
      }));
      return res.status(400).json({ error: 'Validation failed.', issues });
    }
    req.body = result.data; // parsed + coerced values
    next();
  };
}

const ROLES = ['tenant', 'landlord', 'service'];

const schemas = {
  signup: z.object({
    name: z.string().trim().min(1, 'Name is required.').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
    role: z.enum(ROLES, { errorMap: () => ({ message: `role must be one of: ${ROLES.join(', ')}` }) })
  }),

  login: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
    role: z.enum(ROLES).optional()
  }),

  createProperty: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(160),
    city: z.string().trim().min(2, 'City is required.').max(80),
    rentPerMonth: z.coerce.number().positive('Rent must be a positive number.'),
    photos: z.array(z.string().url('Each photo must be a valid URL.')).max(3, 'Up to 3 photos only.').optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    contactPhone: z.string().trim().min(6).max(20).optional()
  }),

  createCheckout: z.object({}).optional().default({}),

  verifyPayment: z.object({
    razorpay_order_id: z.string().min(1, 'razorpay_order_id is required.'),
    razorpay_payment_id: z.string().min(1, 'razorpay_payment_id is required.'),
    razorpay_signature: z.string().min(1, 'razorpay_signature is required.')
  })
};

module.exports = { validate, schemas };