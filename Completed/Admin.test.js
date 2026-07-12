require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const { resetDb, closeDb, pool } = require('./helpers');

test.before(resetDb);
test.after(closeDb);

function getCookie(res, name) {
  const raw = res.headers['set-cookie'].find(c => c.startsWith(`${name}=`));
  return raw.split(';')[0];
}

test('non-admin accounts get 403 from admin routes', async () => {
  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Regular User',
    email: 'not.admin@example.com',
    password: 'password123',
    role: 'tenant'
  });
  const access = getCookie(signup, 'goeazy_access');
  const refresh = getCookie(signup, 'goeazy_refresh');

  const res = await request(app).get('/api/admin/metrics').set('Cookie', [access, refresh]);
  assert.equal(res.status, 403);
});

test('service provider profile goes pending -> approved through the admin queue', async () => {
  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Fix-It Fatima',
    email: 'provider@example.com',
    password: 'password123',
    role: 'service'
  });
  const providerAccess = getCookie(signup, 'goeazy_access');
  const providerRefresh = getCookie(signup, 'goeazy_refresh');

  const submit = await request(app)
    .post('/api/service-providers/profile')
    .set('Cookie', [providerAccess, providerRefresh])
    .send({
      businessName: 'Fatima Plumbing',
      category: 'Plumber',
      documents: ['/uploads/fake-license.png']
    });
  assert.equal(submit.status, 201);
  assert.equal(submit.body.profile.status, 'pending');

  // Promote a second account to admin directly via SQL (mirrors what
  // scripts/make-admin.js does), then log in as them.
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_admin, email_verified_at)
     VALUES ('Admin', 'admin@example.com', $1, 'tenant', true, now())`,
    [await require('bcryptjs').hash('password123', 10)]
  );
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'password123'
  });
  const adminAccess = getCookie(adminLogin, 'goeazy_access');
  const adminRefresh = getCookie(adminLogin, 'goeazy_refresh');

  const queue = await request(app)
    .get('/api/admin/service-providers?status=pending')
    .set('Cookie', [adminAccess, adminRefresh]);
  assert.equal(queue.status, 200);
  assert.equal(queue.body.profiles.length, 1);

  const profileId = queue.body.profiles[0].id;
  const approve = await request(app)
    .post(`/api/admin/service-providers/${profileId}/approve`)
    .set('Cookie', [adminAccess, adminRefresh]);
  assert.equal(approve.status, 200);
  assert.equal(approve.body.profile.status, 'approved');

  const metrics = await request(app).get('/api/admin/metrics').set('Cookie', [adminAccess, adminRefresh]);
  assert.equal(metrics.status, 200);
  assert.equal(metrics.body.serviceProviders.byStatus.approved, 1);
});