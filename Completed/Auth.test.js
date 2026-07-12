require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const { resetDb, closeDb } = require('./helpers');

test.before(resetDb);
test.after(closeDb);

test('GET /api/health reports ok and a connected DB', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.db, 'connected');
});

test('signup rejects an invalid email and a short password', async () => {
  const res = await request(app).post('/api/auth/signup').send({
    name: 'A',
    email: 'not-an-email',
    password: 'short',
    role: 'tenant'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed.');
  const fields = res.body.issues.map(i => i.field);
  assert.ok(fields.includes('email'));
  assert.ok(fields.includes('password'));
});

test('signup succeeds and sets session cookies', async () => {
  const res = await request(app).post('/api/auth/signup').send({
    name: 'Tenant Test',
    email: 'tenant.auth.test@example.com',
    password: 'password123',
    role: 'tenant'
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'tenant.auth.test@example.com');
  assert.equal(res.body.user.emailVerified, false);

  const cookies = res.headers['set-cookie'].join(';');
  assert.match(cookies, /goeazy_access=/);
  assert.match(cookies, /goeazy_refresh=/);
});

test('signup rejects a duplicate email', async () => {
  const res = await request(app).post('/api/auth/signup').send({
    name: 'Duplicate',
    email: 'tenant.auth.test@example.com', // same as the previous test
    password: 'password123',
    role: 'tenant'
  });
  assert.equal(res.status, 409);
});

test('login rejects a wrong password with a generic message', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'tenant.auth.test@example.com',
    password: 'wrongpassword'
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Incorrect email or password.');
});

test('login rejects a role mismatch', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'tenant.auth.test@example.com',
    password: 'password123',
    role: 'landlord'
  });
  assert.equal(res.status, 403);
  assert.match(res.body.error, /registered as a tenant/);
});

test('login succeeds with correct credentials and matching role', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'tenant.auth.test@example.com',
    password: 'password123',
    role: 'tenant'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'tenant.auth.test@example.com');
});

test('an expired access token is rejected with code TOKEN_EXPIRED', async () => {
  const jwt = require('jsonwebtoken');
  const expired = jwt.sign(
    { sub: 'x', email: 'x@test.com', role: 'tenant' },
    process.env.JWT_SECRET,
    { expiresIn: '-10s' }
  );

  const res = await request(app).get('/api/auth/me').set('Cookie', [`goeazy_access=${expired}`]);
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'TOKEN_EXPIRED');
});

test('a garbage access token is rejected with code INVALID_TOKEN', async () => {
  const res = await request(app).get('/api/auth/me').set('Cookie', ['goeazy_access=not.a.jwt']);
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'INVALID_TOKEN');
});

test('no access token at all is rejected with code NO_SESSION', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'NO_SESSION');
});

test('forgot-password responds identically for a real and a fake email (no enumeration)', async () => {
  const real = await request(app).post('/api/auth/forgot-password').send({ email: 'tenant.auth.test@example.com' });
  const fake = await request(app).post('/api/auth/forgot-password').send({ email: 'definitely-not-registered@example.com' });

  assert.equal(real.status, 200);
  assert.equal(fake.status, 200);
  assert.equal(real.body.message, fake.body.message);
});