import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateStreakAtRisk } from './gameMath.js';

/**
 * "Chuỗi đang treo" — thứ đáng nói nhất trong ngày, và app chưa bao giờ nói nó ở màn chính.
 * Một con số trần (`Chuỗi 17`) không phân biệt được "hôm nay xong rồi" với "hết hôm nay là mất".
 */

test('chưa có chuỗi ⇒ null: không có gì để mất thì không có gì để cảnh báo', () => {
  assert.equal(evaluateStreakAtRisk({ currentStreak: 0, sessionsCompletedToday: 0 }), null);
  assert.equal(evaluateStreakAtRisk({}), null);
  assert.equal(evaluateStreakAtRisk({ currentStreak: -3 }), null);
});

test('còn chuỗi + hôm nay chưa chốt phiên nào ⇒ TREO', () => {
  const r = evaluateStreakAtRisk({ currentStreak: 17, sessionsCompletedToday: 0 });
  assert.equal(r.atRisk, true);
  assert.equal(r.streak, 17);
});

test('hôm nay đã chốt ⇒ HẾT treo, dù chỉ một phiên', () => {
  // Biên: đúng 1 phiên là đủ giữ chuỗi. Viết `> 1` ở đây thì cảnh báo sẽ kêu suốt cả ngày sau khi
  // Đàm đã làm xong việc của mình — một cảnh báo kêu oan còn tệ hơn không có cảnh báo.
  assert.equal(evaluateStreakAtRisk({ currentStreak: 17, sessionsCompletedToday: 1 }).atRisk, false);
  assert.equal(evaluateStreakAtRisk({ currentStreak: 17, sessionsCompletedToday: 9 }).atRisk, false);
});

test('Lá Chắn KHÔNG làm hết treo — nó chỉ đổi hậu quả', () => {
  // Nói "an toàn" khi có khiên là nói dối: khiên tiêu một lần rồi hết, và người chơi vẫn nên biết
  // hôm nay mình đang tiêu nó.
  const r = evaluateStreakAtRisk({ currentStreak: 17, sessionsCompletedToday: 0, shieldReady: true });
  assert.equal(r.atRisk, true, 'có khiên mà báo hết treo');
  assert.equal(r.shieldReady, true, 'không nói ra là đang có khiên thì lời cảnh báo nặng hơn sự thật');
});
