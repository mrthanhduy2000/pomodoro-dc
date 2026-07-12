import test from 'node:test';
import assert from 'node:assert/strict';

import { isCronAuthorized } from '../../_lib/http.js';

test('isCronAuthorized: không có CRON_SECRET → luôn cho qua', () => {
  delete process.env.CRON_SECRET;
  assert.equal(isCronAuthorized({ headers: {} }), true);
});

test('isCronAuthorized: có CRON_SECRET → phải khớp đúng Bearer token', () => {
  process.env.CRON_SECRET = 'test-secret';
  assert.equal(isCronAuthorized({ headers: { authorization: 'Bearer test-secret' } }), true);
  assert.equal(isCronAuthorized({ headers: { authorization: 'Bearer wrong' } }), false);
  assert.equal(isCronAuthorized({ headers: {} }), false);
  delete process.env.CRON_SECRET;
});
