import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countRichTextWords,
  stripRichTextMarkup,
  trimRichTextToWordLimit,
} from './richText.js';

test('rich text word count uses visible text', () => {
  const value = '# Mục tiêu\n- [x] **hoàn thành** [phiên sâu](https://example.com)';

  assert.equal(stripRichTextMarkup(value), 'Mục tiêu\nhoàn thành phiên sâu');
  assert.equal(countRichTextWords(value), 6);
});

test('rich text trimming preserves complete inline wrappers', () => {
  const value = '**một hai ba** [bốn năm](https://example.com) sáu';
  const trimmed = trimRichTextToWordLimit(value, 5);

  assert.equal(trimmed, '**một hai ba** [bốn năm](https://example.com)');
  assert.equal(countRichTextWords(trimmed), 5);
});

test('rich text trimming keeps block prefix and counts visible words', () => {
  const value = '- [ ] **một hai** ba bốn';
  const trimmed = trimRichTextToWordLimit(value, 3);

  assert.equal(trimmed, '- [ ] **một hai** ba');
  assert.equal(countRichTextWords(trimmed), 3);
});
