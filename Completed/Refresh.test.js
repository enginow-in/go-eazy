require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const { resetDb, closeDb } = require('./helpers');

test.before(resetDb);
test.after(closeDb);

function getCookie(res, name) {
  const raw = res.headers['set-cookie'].find(c => c.startsWith(`${name}=`));
  return raw.split(';')[0]; // "name=value"
}

test('refresh rotates the token, and replaying the old one revokes the whole session', async () => {
  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Refresh Test',
    email: 'refresh.test@example.com',
    password: 'password123',
    role: 'tenant'
  });
  assert.equal(signup.status, 201);

  const oldAccess = getCookie(signup, 'goeazy_access');
  const oldRefresh = getCookie(signup, 'goeazy_refresh');

  // First refresh: should succeed and rotate to a new token.
  const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', [oldAccess, oldRefresh]);
  assert.equal(refreshed.status, 200);
  const newRefresh = getCookie(refreshed, 'goeazy_refresh');
  assert.notEqual(newRefresh, oldRefresh);

  // Replaying the now-rotated-away refresh token should be rejected...
  const replay = await request(app).post('/api/auth/refresh').set('Cookie', [oldAccess, oldRefresh]);
  assert.equal(replay.status, 401);
  assert.equal(replay.body.code, 'REFRESH_REVOKED');

  // ...and should have taken the NEW token down with it (theft-detection
  // cascade), not just the one that was replayed.
  const afterCascade = await request(app).post('/api/auth/refresh').set('Cookie', [oldAccess, newRefresh]);
  assert.equal(afterCascade.status, 401);
  assert.equal(afterCascade.body.code, 'REFRESH_REVOKED');
});

test('logout revokes the refresh token so it cannot be reused', async () => {
  const signup = await request(app).post('/api/auth/signup').send({
    name: 'Logout Test',
    email: 'logout.test@example.com',
    password: 'password123',
    role: 'tenant'
  });
  const access = getCookie(signup, 'goeazy_access');
  const refresh = getCookie(signup, 'goeazy_refresh');

  const logout = await request(app).post('/api/auth/logout').set('Cookie', [access, refresh]);
  assert.equal(logout.status, 200);

  const reuse = await request(app).post('/api/auth/refresh').set('Cookie', [access, refresh]);
  assert.equal(reuse.status, 401);
});