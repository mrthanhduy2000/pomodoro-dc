import test from 'node:test';
import assert from 'node:assert/strict';

import { isAppSpace } from './keys.js';

const key = (over = {}) => ({ code: 'Space', key: ' ', repeat: false, target: { tagName: 'BODY' }, ...over });

test('a bare Space on the page is the app shortcut', () => {
  assert.equal(isAppSpace(key()), true);
});

test('Space is never stolen from typing, from a focused control, under a modifier, or on auto-repeat', () => {
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY']) {
    assert.equal(isAppSpace(key({ target: { tagName } })), false, tagName);
  }
  assert.equal(isAppSpace(key({ target: { tagName: 'DIV', isContentEditable: true } })), false);
  for (const mod of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'repeat']) {
    assert.equal(isAppSpace(key({ [mod]: true })), false, mod);
  }
  assert.equal(isAppSpace(key({ code: 'Enter', key: 'Enter' })), false);
});
