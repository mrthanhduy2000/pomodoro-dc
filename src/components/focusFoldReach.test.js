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

test('chip mục tiêu gần đây ĐỨNG THAY CHỖ nút dẫn đường, không thêm một hàng', () => {
  // ⚠️ Bản đầu của bản vá cho chip một hàng RIÊNG bên trên nút — nó chạy, nhưng tốn thêm **68px**
  // và đẩy đáy nút xuống y=771 trong khi thanh tab bắt đầu ở y=774: **hở đúng 3px**. Màn này đã
  // để nút chính chạm thanh tab hai lần trước đó (vòng 19, vòng 20). Đứng THAY CHỖ thì chiều cao
  // không đổi một điểm ảnh nào — nay hở 71px.
  assert.match(NGUON, /recentGoals\.slice\(0, 1\)\.map\(/, 'mất hàng chip — đường tắt hai-cú-chạm đã biến mất');
  assert.match(NGUON, /Tự viết →/, 'mất đường thoát để tự đặt mục tiêu mới');
  // Chip phải nằm TRONG nhánh "chưa đủ mục tiêu" của cùng hàng nút, tức trước nhánh "Bắt đầu phiên".
  const iChip = NGUON.indexOf('recentGoals.slice(0, 1).map(');
  const iBatDau = NGUON.indexOf("'Bắt đầu phiên'");
  assert.ok(iChip !== -1 && iBatDau !== -1 && iChip < iBatDau, 'chip phải ở nhánh chưa-đủ-mục-tiêu của hàng nút.');
});

test('chip chỉ hiện khi CHƯA đủ mục tiêu — đủ rồi thì nó là chỗ chiếm chỗ', () => {
  const i = NGUON.indexOf('recentGoals.slice(0, 1).map(');
  const khoi = NGUON.slice(Math.max(0, i - 2600), i);
  assert.match(khoi, /!isCrisisBlockingStart && !isSessionGoalValid \?/, 'thiếu gác: chip vẫn hiện sau khi đã có mục tiêu.');
  // Không có mục tiêu gần đây thì nút phải trở lại dạng đầy-hàng, không để một hàng rỗng.
  assert.match(NGUON, /recentGoals\.length > 0 \? 'compactEscape' : 'compactPrimary'/,
    'nút thoát phải trở lại cỡ đầy-hàng khi không có chip nào bên cạnh.');
});

test('KHÔNG in hai hàng chip trên một màn', () => {
  // Bản gốc của hàng chip nằm cạnh ô nhập; giữ cả hai là nói cùng một chuyện hai lần, mà bản dưới
  // chỉ thấy được sau khi đã cuộn — tức nó chỉ phục vụ người đã đi hết quãng đường bản trên xoá.
  const soLan = [...NGUON.matchAll(/recentGoals[.\w()0-9, ]*\.map\(/g)].length;
  assert.equal(soLan, 1, `có ${soLan} hàng chip mục tiêu; phải đúng 1.`);
});

test('LUẬT KHÔNG BỊ NỚI — vẫn phải đủ ký tự tối thiểu mới bắt đầu được', () => {
  // ⚠️ Đây là vế quan trọng nhất. Cả bản vá chỉ được phép xoá quãng ĐI LẠI, không được xoá cái
  // cổng: mục tiêu được chấm thưởng khi đạt và được AI Coach đọc.
  assert.match(NGUON, /pendingSessionGoal\.trim\(\)\.length < SESSION_GOAL_MIN_CHARS/,
    'cổng "đủ ký tự mới bắt đầu" đã bị gỡ — đó là nới luật, không phải bớt ma sát.');
});

test('KHÔNG tự điền mục tiêu giùm người chơi', () => {
  // Gán ngầm mục tiêu hôm qua cho phiên hôm nay là nói dối thay Đàm — mục tiêu ấy sẽ được chấm
  // "đạt/không đạt" và được AI Coach đọc. Chip phải do anh BẤM.
  const i = NGUON.indexOf('recentGoals.slice(0, 1).map(');
  const khoi = NGUON.slice(i, i + 900);
  assert.match(khoi, /onClick=\{\(\) => setPendingSessionGoal\(goal\)\}/, 'chip phải điền khi BẤM.');
  assert.ok(
    !/useEffect\([^;]*setPendingSessionGoal\(recentGoals/.test(NGUON),
    'có chỗ tự điền mục tiêu gần đây mà không ai bấm — đó là nói dối thay người chơi.',
  );
});

test('ô mục tiêu BẮT BUỘC đứng trước ô ghi chú TUỲ CHỌN', () => {
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
 *   · chỗ ấy nằm TRONG vòng đồng hồ (đặt ở thẻ dưới thì rơi xuống dưới nếp gấp, đúng cái bẫy mà
 *     cả vòng này sinh ra để gỡ — nhìn thì "có hiện" mà thật ra vẫn phải cuộn mới thấy).
 */
test('mục tiêu phiên còn hiện trong lúc phiên chạy, và hiện TRONG vòng đồng hồ', () => {
  const src = stripComments(
    readFileSync(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8'),
  );

  const gac = '{!isBreakMode && !isIdle && sessionGoalText && (';
  assert.ok(
    src.includes(gac),
    'mục tiêu phiên lại biến mất khi phiên chạy — app bắt gõ nó rồi giấu đi suốt 25 phút, '
    + 'đúng lúc nó phải làm việc',
  );

  // Vòng đồng hồ = cột tuyệt đối phủ kín giữa vòng tròn. Chỗ render phải nằm SAU khi cột ấy mở
  // và TRƯỚC khi khối bấm-giờ-tự-do bắt đầu — đó là dải duy nhất còn nằm trong vòng.
  const moCot = src.indexOf('absolute inset-0 flex flex-col items-center justify-center');
  const viTri = src.indexOf(gac);
  const heoStopwatch = src.indexOf('Ghi nhận theo phút thực tế');
  assert.ok(moCot > 0 && heoStopwatch > moCot, 'không tìm thấy vòng đồng hồ — phép đo đang chạy rỗng');
  assert.ok(
    viTri > moCot && viTri < heoStopwatch,
    'mục tiêu có hiện nhưng KHÔNG nằm trong vòng đồng hồ — đặt ở thẻ dưới thì nó lại rơi xuống '
    + 'dưới nếp gấp, tức vẫn phải cuộn mới đọc được',
  );

  // ⚠️ `line-clamp-2` chứ không `truncate`: cắt một mục tiêu thật còn MỘT dòng thì ra một câu cụt,
  // mà câu cụt tệ hơn không có câu.
  const khoi = src.slice(viTri, viTri + 400);
  assert.match(khoi, /line-clamp-2/, 'thiếu giới hạn 2 dòng ⇒ mục tiêu dài phá vỡ vòng đồng hồ');
  assert.doesNotMatch(khoi, /\btruncate\b/, 'truncate cắt còn một dòng ⇒ câu cụt, tệ hơn không có');
});
