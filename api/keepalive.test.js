import test from 'node:test';
import assert from 'node:assert/strict';

import { isAuthorized } from './keepalive.js';

test('keepalive isAuthorized: không có CRON_SECRET → luôn cho qua', () => {
  delete process.env.CRON_SECRET;
  assert.equal(isAuthorized({ headers: {} }), true);
});

test('keepalive isAuthorized: có CRON_SECRET → phải khớp đúng Bearer token', () => {
  process.env.CRON_SECRET = 'test-secret';
  assert.equal(isAuthorized({ headers: { authorization: 'Bearer test-secret' } }), true);
  assert.equal(isAuthorized({ headers: { authorization: 'Bearer wrong' } }), false);
  assert.equal(isAuthorized({ headers: {} }), false);
  delete process.env.CRON_SECRET;
});
