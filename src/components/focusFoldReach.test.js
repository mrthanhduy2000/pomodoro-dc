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

test('chip "Mục tiêu gần đây" nằm TRONG thẻ đồng hồ, TRƯỚC hàng nút chính', () => {
  const iChip = NGUON.indexOf('Mục tiêu gần đây');
  const iNut = NGUON.indexOf('Điền mục tiêu →');
  assert.notEqual(iChip, -1, 'mất khối chip mục tiêu gần đây — đường tắt hai-cú-chạm đã biến mất');
  assert.notEqual(iNut, -1, 'không tìm thấy nút chính — phép đo chạy rỗng');
  assert.ok(iChip < iNut, 'chip phải đứng TRƯỚC nút: đứng sau thì nó rơi xuống dưới nếp gấp.');
});

test('chip chỉ hiện khi CHƯA đủ mục tiêu — đủ rồi thì nó là chỗ chiếm chỗ', () => {
  const khoi = NGUON.slice(NGUON.indexOf('Mục tiêu gần đây') - 700, NGUON.indexOf('Mục tiêu gần đây'));
  assert.match(khoi, /!isSessionGoalValid/, 'thiếu gác: chip vẫn hiện sau khi đã có mục tiêu.');
  assert.match(khoi, /recentGoals\.length > 0/, 'thiếu gác: hàng chip rỗng vẫn chiếm chỗ và một nhãn.');
});

test('KHÔNG in hai hàng chip trên một màn', () => {
  // Bản gốc của hàng chip nằm cạnh ô nhập; giữ cả hai là nói cùng một chuyện hai lần, mà bản dưới
  // chỉ thấy được sau khi đã cuộn — tức nó chỉ phục vụ người đã đi hết quãng đường bản trên xoá.
  const soLan = [...NGUON.matchAll(/recentGoals\.map\(/g)].length;
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
  const khoi = NGUON.slice(NGUON.indexOf('Mục tiêu gần đây'), NGUON.indexOf('Mục tiêu gần đây') + 900);
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
