import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GOAL_TONE,
  SESSION_GOAL_MIN_CHARS,
  deriveSessionGoalState,
  pickRecentGoals,
  sessionGoalHint,
} from './sessionGoalState.js';

test('ô trống và ô gõ dở KHÔNG được cùng một tông — đây là cả lý do file này tồn tại', () => {
  // ⚠️ Bài quan trọng nhất trong file. Mã cũ chỉ có `isSessionGoalValid` đúng/sai, nên "chưa gõ gì"
  // và "gõ 4 chữ rồi dừng" nhận CÙNG một bộ class cảnh báo. Hệ quả: mỗi lần Đàm mở app là một dòng
  // chữ đậm màu cảnh báo, trên một ô anh còn chưa chạm vào.
  const empty = deriveSessionGoalState('');
  const partial = deriveSessionGoalState('viết');

  assert.equal(empty.phase, 'empty');
  assert.equal(partial.phase, 'partial');
  assert.notEqual(empty.tone, partial.tone, 'ô trống và ô gõ dở đang lại chung một tông');
  assert.equal(empty.tone, GOAL_TONE.neutral);
  assert.equal(partial.tone, GOAL_TONE.warn);
});

test('ba trạng thái, ba nhãn khác nhau', () => {
  assert.equal(deriveSessionGoalState('').badgeLabel, 'Chưa đặt mục tiêu');
  assert.equal(deriveSessionGoalState('abcd').badgeLabel, 'Thiếu 6 ký tự');
  assert.equal(deriveSessionGoalState('chốt xong outline').badgeLabel, 'Sẵn sàng bắt đầu');
});

test('nhãn ô trống KHÔNG quy kết thiếu sót', () => {
  // Chữ "Thiếu" nói rằng có một khiếm khuyết. Ở ô chưa ai chạm vào thì điều đó không đúng sự thật.
  assert.ok(!deriveSessionGoalState('').badgeLabel.includes('Thiếu'));
  // Nhưng khi ĐÃ gõ dở thì "Thiếu" là mô tả đúng, phải giữ.
  assert.ok(deriveSessionGoalState('ab').badgeLabel.includes('Thiếu'));
});

test('khoảng trắng không tính là đã đặt mục tiêu', () => {
  const s = deriveSessionGoalState('     \n\t  ');
  assert.equal(s.charCount, 0);
  assert.equal(s.phase, 'empty');
});

test('ngưỡng: đúng bằng minChars là ĐỦ, thiếu 1 là chưa', () => {
  const exact = 'x'.repeat(SESSION_GOAL_MIN_CHARS);
  assert.equal(deriveSessionGoalState(exact).phase, 'ready');
  assert.equal(deriveSessionGoalState(exact).remaining, 0);
  assert.equal(deriveSessionGoalState('x'.repeat(SESSION_GOAL_MIN_CHARS - 1)).phase, 'partial');
  assert.equal(deriveSessionGoalState('x'.repeat(SESSION_GOAL_MIN_CHARS - 1)).remaining, 1);
});

test('thanh tiến độ: trống = 0%, đủ = 100%, không bao giờ vượt 100%', () => {
  assert.equal(deriveSessionGoalState('').progressPct, 0);
  assert.equal(deriveSessionGoalState('x'.repeat(SESSION_GOAL_MIN_CHARS)).progressPct, 100);
  assert.equal(deriveSessionGoalState('x'.repeat(500)).progressPct, 100);
});

test('đầu vào rác không làm vỡ', () => {
  for (const bad of [null, undefined, 0, {}, []]) {
    const s = deriveSessionGoalState(bad);
    assert.equal(s.phase, 'empty');
    assert.equal(s.charCount, 0);
  }
  // minChars rác → rơi về ngưỡng mặc định, không chia cho 0 ra Infinity/NaN.
  const s = deriveSessionGoalState('abc', 0);
  assert.ok(Number.isFinite(s.progressPct));
  assert.equal(s.remaining, SESSION_GOAL_MIN_CHARS - 3);
});

test('câu gợi ý lúc ô trống là LỜI MỜI, không phải lời quở', () => {
  const hint = sessionGoalHint(deriveSessionGoalState(''));
  // Vẫn phải nói rõ ngưỡng — đổi giọng chứ không giấu thông tin.
  assert.ok(hint.includes(String(SESSION_GOAL_MIN_CHARS)), 'câu gợi ý phải vẫn nêu ngưỡng ký tự');
  assert.ok(!hint.startsWith('Cần '), 'câu mở đầu bằng "Cần" là quở, không phải mời');
});

test('hai khối giao diện chỉ khác nhau ở câu LÚC ĐÃ ĐỦ', () => {
  const empty = deriveSessionGoalState('');
  const partial = deriveSessionGoalState('ab');
  const ready = deriveSessionGoalState('chốt xong outline');

  assert.equal(sessionGoalHint(empty, 'compact'), sessionGoalHint(empty, 'expanded'));
  assert.equal(sessionGoalHint(partial, 'compact'), sessionGoalHint(partial, 'expanded'));
  assert.notEqual(sessionGoalHint(ready, 'compact'), sessionGoalHint(ready, 'expanded'));
  // Bản mở rộng nằm xa nút Bắt đầu nên phải chỉ đường ngược lên.
  assert.ok(sessionGoalHint(ready, 'expanded').includes('quay lên'));
});

test('state rỗng/thiếu → vẫn ra câu của trạng thái trống, không ném lỗi', () => {
  assert.equal(sessionGoalHint(null), sessionGoalHint(deriveSessionGoalState('')));
  assert.equal(sessionGoalHint(undefined), sessionGoalHint(deriveSessionGoalState('')));
});

/* ─── GỢI Ý MỤC TIÊU GẦN ĐÂY ─────────────────────────────────────────────────── */

test('chỉ gợi ý mục tiêu ĐỦ DÀI để mở được nút Bắt đầu', () => {
  // ⚠️ Gợi ý một chuỗi mà bấm vào vẫn không mở được nút là một cái bẫy: người dùng bấm, nút vẫn
  // xám, và không có gì giải thích vì sao.
  const ra = pickRecentGoals([
    { goal: 'ngắn' },
    { goal: 'Hoàn thành phần đang dở' },
    { goal: '   ' },
    { goal: null },
  ]);
  assert.deepEqual(ra, ['Hoàn thành phần đang dở']);
  ra.forEach((g) => assert.ok(g.length >= SESSION_GOAL_MIN_CHARS));
});

test('bỏ trùng KHÔNG phân biệt hoa-thường và khoảng trắng thừa', () => {
  // "Viết báo cáo tuần" và "viết  BÁO CÁO  tuần" là một việc; hiện hai chip thì vừa tốn chỗ vừa
  // trông như app không nhớ gì.
  const ra = pickRecentGoals([
    { goal: 'Viết báo cáo tuần' },
    { goal: 'viết  BÁO CÁO  tuần' },
    { goal: 'Đọc tài liệu dự án' },
  ]);
  assert.deepEqual(ra, ['Viết báo cáo tuần', 'Đọc tài liệu dự án'],
    'giữ nguyên chữ gốc của lần dùng GẦN NHẤT, và chỉ một chip cho một việc');
});

test('giữ đúng thứ tự mới-nhất-trước và tôn trọng giới hạn', () => {
  const lichSu = ['việc thứ nhất', 'việc thứ hai', 'việc thứ ba', 'việc thứ tư']
    .map((goal) => ({ goal }));
  assert.deepEqual(pickRecentGoals(lichSu, 2), ['việc thứ nhất', 'việc thứ hai']);
  assert.deepEqual(pickRecentGoals(lichSu, 0), [], 'giới hạn 0 phải ra rỗng, không phải ra tất cả');
  assert.deepEqual(pickRecentGoals(null), [], 'lịch sử rỗng/rác ⇒ không gợi ý gì');
});
