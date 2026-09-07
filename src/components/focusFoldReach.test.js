import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripComments } from '../utils/sourceScan.js';

/**
 * ĐƯỜNG NGẮN NHẤT TỚI MỘT PHIÊN — bài test đọc thẳng mã nguồn `PomodoroEngine.jsx`.
 *
 * ⚠️ VÌ SAO ĐÁNG MỘT FILE RIÊNG. Việc quan trọng nhất của cả app là **bắt đầu một phiên**, và
 * trước 2026-09-01 nó tốn bốn thao tác: bấm một nút chỉ-để-cuộn ("Điền mục tiêu →" ở y=661) → gõ
 * đủ 10 ký tự vào ô ở **y=934** (dưới thanh điều hướng y=774) → cuộn ngược lên → bấm Bắt đầu.
 * Mỗi phiên một lần, mãi mãi. Nay: bấm một chip mục tiêu gần đây ở y=682 → bấm Bắt đầu ở y=728.
 * Hai cú chạm, cả hai trên nếp gấp, không gõ chữ nào.
 *
 * Cái này gãy trong IM LẶNG: đổi thứ tự vài khối JSX là ô nhập lại rơi xuống dưới nếp gấp, mà
 * build/lint/test thường đều xanh và ảnh chụp thì không ai nhìn mỗi lần.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const NGUON = stripComments(readFileSync(join(HERE, 'PomodoroEngine.jsx'), 'utf8'));

test('ADR-077: the idle row is ONE primary Start button — no goal gate, no detour button', () => {
  assert.match(NGUON, /onClick=\{handleStartSession\}/, 'the Start button is gone');
  assert.doesNotMatch(NGUON, /\{!isSessionGoalValid \?/, 'the goal gate is back on the Start row');
  assert.doesNotMatch(NGUON, /jumpToSessionGoal/, 'the scroll-to-goal detour is back');
  assert.doesNotMatch(NGUON, /pendingSessionGoal\.trim\(\)\.length < SESSION_GOAL_MIN_CHARS/,
    'Start blocks on the goal again — Đàm rarely types one, so this gate had nobody behind it');
  assert.doesNotMatch(NGUON, /Điền mục tiêu →|Tự viết →/, 'old detour labels are back');
});

test('recent-goal chips: ONE row, inside the goal card, tap to fill, never auto-filled', () => {
  const soLan = [...NGUON.matchAll(/recentGoals\.map\(/g)].length;
  assert.equal(soLan, 1, `có ${soLan} hàng chip mục tiêu; phải đúng 1.`);
  const i = NGUON.indexOf('recentGoals.map(');
  const khoi = NGUON.slice(i, i + 900);
  assert.match(khoi, /onClick=\{\(\) => setPendingSessionGoal\(goal\)\}/, 'chip phải điền khi BẤM.');
  assert.ok(!/useEffect\([^;]*setPendingSessionGoal\(recentGoals/.test(NGUON),
    'có chỗ tự điền mục tiêu gần đây mà không ai bấm — đó là nói dối thay người chơi.');
  // The chips sit in the goal card (after the "Mục tiêu phiên" label), not on the Start row.
  const iCard = NGUON.indexOf('Mục tiêu phiên');
  const iStart = NGUON.indexOf('onClick={handleStartSession}');
  assert.ok(iStart < iCard && iCard < i, 'chips must live in the goal card below the timer, not on the fold');
  // Same task type first — the "smart default" of ADR-077.
  assert.match(NGUON, /pickRecentGoals\(sessionHistory, GOAL_SUGGESTION_LIMIT, \{ preferCategoryId: pendingCategoryId \}\)/);
});

test('the goal card says it is optional, and no longer counts characters toward a gate', () => {
  assert.match(NGUON, /Tuỳ chọn/, 'the goal badge must say optional');
  assert.doesNotMatch(NGUON, /Bắt buộc/, 'the goal badge still says mandatory');
  assert.doesNotMatch(NGUON, /ký tự tối thiểu/, 'the character counter of the old gate is back');
});

test('ô mục tiêu đứng trước ô ghi chú (cả hai tuỳ chọn, nhưng mục tiêu được chấm cuối phiên)', () => {
  // Trước bản vá, accordion "Ghi chú phiên" (tuỳ chọn, đang đóng) nằm CHEN GIỮA nút bấm và ô mục
  // tiêu bắt buộc — chính nó đẩy ô bắt buộc xuống dưới nếp gấp.
  const iMucTieu = NGUON.indexOf('Mục tiêu phiên');
  const iGhiChu = NGUON.indexOf('Ghi chú phiên');
  assert.ok(iMucTieu !== -1 && iGhiChu !== -1, 'phép đo chạy rỗng — một trong hai khối đã đổi tên');
  assert.ok(iMucTieu < iGhiChu, 'ô ghi chú tuỳ chọn lại chen lên trước ô mục tiêu bắt buộc.');
});

/**
 * ⚠️ MỤC TIÊU PHIÊN PHẢI CÒN NHÌN THẤY TRONG LÚC PHIÊN CHẠY (2026-09-02).
 *
 * App bắt buộc gõ ≥10 ký tự mới cho bấm "Bắt đầu", rồi giấu câu ấy đi 25 phút. Đo được: mọi chỗ
 * render mục tiêu đều nằm trong khối `isIdle`, và thẻ chuẩn bị còn bị hạ xuống `opacity-25
 * pointer-events-none` khi `!isIdle` — KHÔNG một chỗ nào gác theo phiên đang chạy.
 *
 * Bài này canh cả HAI vế, vì mỗi vế một mình đều xanh oan được:
 *   · có một chỗ render gác `!isIdle` (thiếu ⇒ lại giấu mất);
 *   · chỗ ấy nằm NGAY DƯỚI vòng đồng hồ, trong cùng thẻ, TRƯỚC hàng nút (đặt ở thẻ dưới thì rơi
 *     xuống dưới nếp gấp — nhìn thì "có hiện" mà thật ra vẫn phải cuộn mới thấy).
 *
 * ADR-079 (round 39): the line used to sit INSIDE the ring. At 390 px the disc's chord at that height
 * is ~96 px, so every real goal ran across the ring's stroke — text over a ring is the "chữ tràn"
 * Đàm counted. It now renders right after the ring container: same card, above the buttons, full
 * width, wraps, and NO clamp — a clamp is an ellipsis waiting to happen.
 */
test('mục tiêu phiên còn hiện trong lúc phiên chạy, NGAY DƯỚI vòng đồng hồ, không cắt (ADR-079)', () => {
  const src = stripComments(
    readFileSync(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8'),
  );

  const gac = '{!isBreakMode && !isIdle && sessionGoalText && (';
  assert.ok(
    src.includes(gac),
    'mục tiêu phiên lại biến mất khi phiên chạy — app bắt gõ nó rồi giấu đi suốt 25 phút, '
    + 'đúng lúc nó phải làm việc',
  );

  // The ring column is the absolute overlay in the middle of the circle; the stopwatch note is the
  // last thing rendered inside it. The goal must come AFTER that (outside the disc) and BEFORE the
  // action row is defined — same card, above the buttons.
  const moCot = src.indexOf('absolute inset-0 flex flex-col items-center justify-center');
  const viTri = src.indexOf(gac);
  const heoStopwatch = src.indexOf('Ghi nhận theo phút thực tế');
  const hangNut = src.indexOf('const compactTimerActionRowClassName');
  assert.ok(moCot > 0 && heoStopwatch > moCot && hangNut > heoStopwatch, 'không tìm thấy vòng đồng hồ — phép đo đang chạy rỗng');
  assert.ok(
    viTri > heoStopwatch && viTri < hangNut,
    'mục tiêu phải nằm NGAY DƯỚI vòng đồng hồ (sau cột trong vòng, trước hàng nút) — trong vòng thì '
    + 'chữ tràn qua nét vòng ở 390px, ở thẻ dưới thì rơi xuống dưới nếp gấp',
  );

  // No clamp, no truncate: a real goal is often longer than a line; it wraps, it is never cut.
  const khoi = src.slice(viTri, viTri + 400);
  assert.doesNotMatch(khoi, /line-clamp|\btruncate\b/, 'mục tiêu bị cắt — ADR-079: không «…» ở bất cứ đâu');
  assert.match(khoi, /\bw-full\b/, 'mục tiêu phải có cả bề ngang thẻ để không phải cắt');
});
