# Security Policy

## Supported Versions

GoEazy follows semantic versioning. Security updates are released for the latest minor version of each major release.

| Version | Status             | Notes                                      |
| ------- | ------------------ | ------------------------------------------ |
| 3.2.x   | :white_check_mark: | Current (Active Security Fixes)           |
| 3.1.x   | :white_check_mark: | LTS (Security Fixes for 12 months)        |
| 3.0.x   | :x:                | EOL (18 May 2026)                         |
| < 3.0   | :x:                | Unsupported                               |

**Current Release**: v3.2.0 (Authentication Hardening & Onboarding v2)  
**Next LTS**: v3.1.0 (Security Hardening & UI Overhaul)

---

## Critical Security Surfaces

GoEazy's infrastructure relies on three hardened layers. Vulnerabilities in these areas require immediate disclosure.

### 1. Supabase Row Level Security (RLS)

**Surface**: PostgreSQL RLS policies control access to property metadata, user profiles, and service provider data.

**Risk Model**:
- Misconfigured RLS allows unauthorized read/write access to other users' data
- RLS bypass in Edge Functions exposes latitude, longitude, contact details

**Mitigation** (Current v3.1.0+):
- All property queries gated behind `auth.uid()` checks
- Sensitive fields (lat, lng, phone) behind RPC functions requiring payment verification
- Estate tier: Landlords can only access their own properties via `user_id = auth.uid()`

**Testing**: Before merge, verify RLS with:
```sql
-- Attempt to read another user's property (should fail)
SELECT * FROM properties WHERE user_id != auth.uid();
-- Should return 0 rows; if not, RLS is misconfigured
```

---

### 2. Razorpay Payment Verification (HMAC-SHA256)

**Surface**: Payment API at Supabase Edge Functions validates microTransaction purchases (₹9 map unlock, ₹199 listing placement).

**Risk Model**:
- Malformed HMAC signature validation allows zero-payment exploitation
- Missing amount cross-check enables payment tampering
- Replay attacks if webhook tokens not validated

**Mitigation** (Current v3.1.0+):
- All payments verified with SHA-256 HMAC signatures (Razorpay secret key)
- Server-side amount validation: `₹199.00` exact match required before database write
- Webhook idempotency via payment_id deduplication in PostgreSQL UNIQUE constraint

**Testing**: Before merge, verify with:
```javascript
// Mock Razorpay webhook
const mockPayload = {
  payment_id: "pay_1234567890",
  order_id: "order_1234567890",
  amount: 19900, // ₹199.00 in paise
  currency: "INR",
  status: "captured"
};
// HMAC must match Razorpay secret; amount must be exact
```

---

### 3. Authentication & Session Management

**Surface**: Supabase GoTrue (JWT-based) with ES256 Elliptic Curve signatures.

**Risk Model**:
- Weak JWT secrets enable token forgery
- Missing role persistence across Google Sign-in causes authorization bypass
- Session hijacking if JWT refresh tokens exposed

**Mitigation** (Current v3.1.0+):
- JWT secrets use 256-bit Elliptic Curve (ES256) for non-repudiation
- Role persisted in `user_metadata` (survives Google Sign-in)
- Forced auth modal on search results prevents unauthenticated data access

**Testing**: Before merge, verify with:
```javascript
// Test role persistence post-Google Sign-in
const user = await supabase.auth.getUser();
console.assert(user.user_metadata.role in ['tenant', 'landlord', 'service_provider']);
```

---

## Reporting a Vulnerability

If you discover a security vulnerability in GoEazy, **do not open a public issue**. Instead:

### **1. Disclosure Channel**
Email: `security@goeazy.in` (or GoEazy team maintainer email)  
Subject: `[SECURITY] Vulnerability Report: <brief description>`

**Include:**
- Affected version(s)
- Vulnerability type (RLS bypass, HMAC weakness, etc.)
- Proof-of-concept (if applicable)
- Impact assessment
- Suggested remediation (if known)

### **2. Expected Timeline**
- **24 hours**: Acknowledgment of receipt
- **72 hours**: Initial severity assessment
- **7 days**: Fix development begins
- **14 days**: Patch released (or extended timeline if complex)
- **30 days**: Public disclosure (unless embargo negotiated)

### **3. Vulnerability Acceptance Criteria**
**Accepted**:
- RLS policy misconfiguration allowing cross-user data access
- HMAC validation weakness in Razorpay integration
- Authentication bypass in role-based access control
- SQL injection in Edge Functions
- XSS in client-side rendering

**Declined** (Low Risk):
- Missing HTTP security headers (not served over HTTPS)
- Typos in documentation
- Performance inefficiencies
- UI-only flaws without backend impact

### **4. Attribution**
Upon fix release, reporters will be credited in the patch notes unless anonymity is requested.

**Example**:
> v3.2.1 Patch: Fixed RLS bypass in property queries (reported by @researcher-name)

---

## Security Best Practices for Contributors

When submitting PRs with security implications:

1. **Never commit secrets**: `.env` files are gitignored. Verify before push.
2. **Test RLS policies**: Use SQL to verify row-level access controls.
3. **Validate payment flows**: Mock Razorpay webhooks with HMAC signatures.
4. **Audit authentication**: Ensure role persistence after Google Sign-in.
5. **Lint security**: Run `npm run lint` to catch common vulnerabilities via eslint-plugin-security.

---

## Incident Response

If a vulnerability is exploited in production:

1. **Immediate**: Revoke affected API keys + rotate Supabase secrets
2. **Within 2 hours**: Deploy patched version
3. **Within 24 hours**: Audit logs for unauthorized data access
4. **Post-incident**: Root cause analysis + preventive measures

---

## External Dependencies

GoEazy relies on third-party security:
- **Supabase** (PostgreSQL, GoTrue, Edge Functions)
- **Razorpay** (Payment processing & HMAC validation)
- **Mapbox GL** (Location services)

Monitor their security advisories at:
- https://status.supabase.com
- https://razorpay.com/security
- https://github.com/mapbox/mapbox-gl-js/security
