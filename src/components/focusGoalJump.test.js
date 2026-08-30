import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { SESSION_GOAL_FIELD_SELECTOR, jumpToSessionGoal } from './focusGoalJump.js';

const ENGINE = readFileSync(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8');

// ⚠️ VÌ SAO BÀI NÀY TỒN TẠI: nút chính của app, khi chưa có mục tiêu, từng là một nút `disabled`
// ghi "Cần điền mục tiêu" — tức nói ra điều đang thiếu mà không nói thiếu Ở ĐÂU, và bấm vào thì
// không có gì xảy ra (nút `disabled` không nhận sự kiện bấm). Ô mục tiêu thật nằm ở y≈1400 trên
// một trang cao 3035px. Không cổng nào bắt được chuyện đó: lint sạch, test xanh, build xanh.

test('cuộn-và-đặt-con-trỏ chạm ĐÚNG ô mang mốc chung', () => {
  const calls = [];
  const field = {
    scrollIntoView: (opts) => calls.push(['scroll', opts]),
    focus: (opts) => calls.push(['focus', opts]),
  };
  const doc = {
    querySelector: (sel) => (sel === SESSION_GOAL_FIELD_SELECTOR ? field : null),
  };

  assert.equal(jumpToSessionGoal(doc), true);
  assert.deepEqual(calls.map(([k]) => k), ['scroll', 'focus']);
  // Cuộn TRƯỚC rồi mới đặt con trỏ: trên iOS bàn phím bật lên che nửa dưới màn hình, nên nếu
  // `focus` chạy trước thì ô vừa cuộn tới lại bị đẩy khuất ngay.
  assert.equal(calls[0][1].block, 'center');
  assert.equal(calls[1][1].preventScroll, true);
});

test('không có ô nào thì nói KHÔNG TÌM THẤY, không im lặng nuốt', () => {
  assert.equal(jumpToSessionGoal({ querySelector: () => null }), false);
});

// ⚠️ Bài quan trọng nhất của file này. Màn Tập trung dựng HAI ô nhập mục tiêu ở hai bố cục khác
// nhau, mỗi lúc chỉ một cái được gắn. Quên mốc ở một nhánh thì nút dẫn đường lặng lẽ không làm gì
// ở đúng bố cục ấy — và chỉ ảnh chụp ở đúng khổ màn hình đó mới thấy.
// THỬ-CHO-ĐỎ: xoá một dòng `data-session-goal-field` ⇒ bài này đỏ.
test('CẢ HAI ô nhập mục tiêu đều mang mốc chung', () => {
  const marks = ENGINE.match(/data-session-goal-field/g) ?? [];
  const textareas = ENGINE.match(/<textarea\b/g) ?? [];
  assert.equal(
    marks.length,
    2,
    `có ${textareas.length} thẻ <textarea> trong PomodoroEngine nhưng chỉ ${marks.length} chỗ khai `
    + 'data-session-goal-field — nút "Điền mục tiêu →" sẽ không dẫn tới đâu ở bố cục bị quên',
  );
  for (const m of ENGINE.matchAll(/data-session-goal-field/g)) {
    const after = ENGINE.slice(m.index, m.index + 400);
    assert.match(after, /pendingSessionGoal/,
      'mốc phải nằm trên chính ô nhập mục tiêu, không phải một ô nhập nào khác');
  }
});

// Gác: nút lúc bị chặn phải THẬT SỰ bấm được (nếu nó `disabled` trở lại thì cả bản vá thành vô
// nghĩa mà không có gì đỏ lên) và phải gọi đúng hàm dẫn đường.
test('nút lúc chưa có mục tiêu bấm được và gọi hàm dẫn đường', () => {
  // ⚠️ NEO VÀO LỜI GỌI, KHÔNG NEO VÀO NHÃN. Bản đầu của bài này tìm chuỗi 'Điền mục tiêu →' và
  // ĐỎ OAN trên mã hoàn toàn đúng — vì chữ ấy xuất hiện LẦN ĐẦU trong khối chú thích giải thích
  // bản vá, nên phép cắt "lùi về thẻ <ActionButton gần nhất" nhảy ngược lên một nút khác hẳn
  // ("Kết Thúc Giải Lao"). Cùng họ bài học đã ghi ở CLAUDE.md: hỏi `/tênHàm\(/` trên mã nguồn thì
  // chính dòng định nghĩa cũng là một match. Lời gọi `jumpToSessionGoal()` thì chỉ có đúng một
  // chỗ và nó nằm trong JSX, nên neo vào đó mới trỏ đúng nút.
  const call = ENGINE.indexOf('onClick={() => jumpToSessionGoal()}');
  assert.ok(call > 0, 'không tìm thấy lời gọi dẫn đường trong JSX');

  const open = ENGINE.lastIndexOf('<ActionButton', call);
  const close = ENGINE.indexOf('</ActionButton>', call);
  assert.ok(open > 0 && close > call, 'không cắt được đúng thẻ nút');
  const block = ENGINE.slice(open, close);

  assert.match(block, /Điền mục tiêu →/, 'nút dẫn đường phải nói ra việc nó làm');
  assert.doesNotMatch(block, /disabled=/,
    'nút dẫn đường mà `disabled` thì lại thành ngõ cụt như bản cũ');
  assert.match(block, /variant="soft"/,
    'nút này KHÔNG bắt đầu phiên, nên nó không được trông như nút chính');
});

// Luật KHÔNG được nới: vẫn phải đủ ký tự mới bắt đầu được phiên.
test('cổng "đủ ký tự mới được bắt đầu" vẫn còn nguyên', () => {
  assert.match(ENGINE, /!isCrisisBlockingStart && !isSessionGoalValid \?/);
  const i = ENGINE.indexOf('onClick={handleStartSession}');
  assert.ok(i > 0);
});
