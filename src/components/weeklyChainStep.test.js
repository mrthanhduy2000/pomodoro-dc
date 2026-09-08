/**
 * weeklyChainStep.test.js — canh cái lỗi "hai công thức cho một sự thật".
 *
 * Bản cũ suy trạng thái một bước bằng HAI biểu thức độc lập, và chúng nói NGƯỢC nhau đúng lúc
 * chuỗi tuần hoàn tất: bước cuối in "Đã chốt" ở cột trái và "0%" ở cột phải, ngay tại khoảnh
 * khắc trả phần thưởng lớn nhất của tuần.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { weeklyChainStepState, CHAIN_STEP_STATE } from './weeklyChainStep.js';
import { stripComments } from '../utils/sourceScan.js';

// THỬ-CHO-ĐỎ: đổi `index === xong && xong < totalSteps` thành `index === xong` ⇒ bài 1 đỏ ở ca
// chuỗi đã xong (bước cuối vừa "đã chốt" vừa "đang làm").
test('xong chuỗi thì MỌI bước là "đã chốt" — không bước nào vừa xong vừa đang chờ', () => {
  for (const tong of [1, 2, 4, 7]) {
    const bang = Array.from({ length: tong }, (_, i) => (
      weeklyChainStepState({ index: i, currentStep: tong, totalSteps: tong })
    ));
    for (const [i, b] of bang.entries()) {
      assert.equal(b.state, CHAIN_STEP_STATE.DA_CHOT, `chuỗi ${tong} bước: bước ${i} không phải "đã chốt"`);
      assert.equal(b.done, true);
      assert.equal(b.isCurrent, false, `chuỗi đã xong mà bước ${i} vẫn được coi là ĐANG LÀM`);
    }
  }
});

// THỬ-CHO-ĐỎ: đổi `index < xong` thành `index <= xong` ⇒ bài 2 đỏ.
test('ba trạng thái loại trừ nhau, và có ĐÚNG một bước đang làm khi chuỗi chưa xong', () => {
  const TONG = 4;
  for (let xong = 0; xong < TONG; xong += 1) {
    const bang = Array.from({ length: TONG }, (_, i) => (
      weeklyChainStepState({ index: i, currentStep: xong, totalSteps: TONG })
    ));
    assert.equal(bang.filter((b) => b.isCurrent).length, 1, `xong=${xong}: phải có đúng MỘT bước đang làm`);
    assert.equal(bang.filter((b) => b.done).length, xong, `xong=${xong}: số bước đã chốt phải bằng ${xong}`);
    for (const b of bang) {
      assert.equal(
        [b.done, b.isCurrent].filter(Boolean).length <= 1, true,
        'một bước không thể vừa "đã chốt" vừa "đang làm"',
      );
    }
  }
  // Đầu vào rác không được làm vỡ màn Nhiệm vụ.
  assert.equal(weeklyChainStepState({ index: 0, currentStep: -5, totalSteps: 3 }).isCurrent, true);
  assert.equal(weeklyChainStepState({ index: 0, currentStep: 99, totalSteps: 3 }).done, true);
  assert.equal(weeklyChainStepState({ index: 0 }).state, CHAIN_STEP_STATE.DANG_CHO);
});

// THỬ-CHO-ĐỎ: dán lại cột `{... '100%' : '0%'}` vào WeeklyStepRow ⇒ bài 3 đỏ.
test('hàng bước chỉ mã hoá trạng thái MỘT lần — cột "%" không được quay lại', () => {
  const ma = stripComments(readFileSync(new URL('./DailyMissions.jsx', import.meta.url), 'utf8'));
  assert.ok(/weeklyChainStepState\s*\(/.test(ma), 'không còn dùng hàm thuần — phép đo chạy rỗng');
  assert.ok(
    !/'100%'\s*:\s*'0%'/.test(ma),
    'cột "%" quay lại — nó là HÀM của dòng chữ bên trái nó, và chính nó đã in "0%" cạnh chữ '
    + '"Đã chốt" ở bước cuối của một chuỗi vừa hoàn tất',
  );
  assert.ok(
    !/currentIndex/.test(ma),
    '`currentIndex` quay lại — đó là biểu thức thứ hai đã nói ngược biểu thức thứ nhất',
  );
});

// ⚠️ ROUND 45 — THE WEEK-AT-A-GLANCE LINE ON THE DAY CARD.
// Đàm's round-45 brief: "Ba nhiệm vụ ngày cộng một nhiệm vụ tuần là bốn thứ để nhớ, với một app
// tôi chỉ muốn mở lên bấm Bắt đầu." The fix is a merge, not a deletion: the phone Focus screen's
// day card ends with one line naming the week's current step. The failure mode a merge invites is
// DOUBLE VISION — the same line shipping next to the full weekly card on desktop and on Tiến
// trình, which would turn one memory into two. That gate is what these tests hold.
// THỬ-CHO-ĐỎ: đổi `showDaily && !showWeekly` thành `showDaily` ⇒ bài 4 đỏ.
test('dòng "Tuần này" chỉ mọc ở nơi KHÔNG có thẻ tuần đầy đủ', () => {
  const ma = stripComments(readFileSync(new URL('./DailyMissions.jsx', import.meta.url), 'utf8'));
  assert.ok(/const\s+weeklyGlance\s*=/.test(ma), 'không còn cờ `weeklyGlance` — phép đo chạy rỗng');
  const dieuKien = ma.match(/const\s+weeklyGlance\s*=\s*([^;]+);/)[1];
  assert.ok(
    /showDaily/.test(dieuKien) && /!\s*showWeekly/.test(dieuKien),
    'cờ phải là `showDaily && !showWeekly`: có thẻ tuần đầy đủ ở đâu thì dòng tóm tắt phải im ở đó, '
    + `hiện đang là: ${dieuKien.trim()}`,
  );
  assert.ok(/\{weeklyGlance\s*&&/.test(ma), 'cờ được tính nhưng không ai dùng để chặn phần vẽ');
});

// THỬ-CHO-ĐỎ: thêm `truncate` vào class của `glanceLine` ⇒ bài 5 đỏ.
test('dòng tóm tắt tuần không được cắt chữ — bảng phủ quyết cấm chữ bị cắt', () => {
  const ma = stripComments(readFileSync(new URL('./DailyMissions.jsx', import.meta.url), 'utf8'));
  const khoi = ma.match(/\{weeklyGlance\s*&&\s*\(([\s\S]*?)\n\s*\)\}/);
  assert.ok(khoi, 'không tìm thấy khối vẽ dòng tóm tắt tuần');
  assert.ok(
    !/truncate|text-ellipsis|whitespace-nowrap/.test(khoi[1]),
    'dòng tóm tắt bị cắt bằng "…" — bước dài nhất hôm nay là 30 ký tự, nó phải XUỐNG DÒNG chứ '
    + 'không được biến mất',
  );
  // Hai con số, không hơn: "n/N" của tuần và tiền công của tuần. Tiến độ trong TỪNG bước ở lại
  // thẻ đầy đủ bên Tiến trình — chỗ có đủ diện tích cho nó.
  assert.ok(
    !/stepProgress/.test(khoi[1]),
    'tiến độ từng bước lọt vào dòng tóm tắt — thành ba con số trên một dòng ở khổ 390px',
  );
});

// THỬ-CHO-ĐỎ: bỏ `.split('—')` (in nguyên `activeStep.label`) ⇒ bài 6 đỏ.
test('dòng tóm tắt lấy NỬA VIỆC CẦN LÀM của nhãn bước, không lấy nửa tên gọi', () => {
  const ma = stripComments(readFileSync(new URL('./DailyMissions.jsx', import.meta.url), 'utf8'));
  const cat = ma.match(/const\s+glanceTask\s*=\s*([\s\S]*?);\n/);
  assert.ok(cat, 'không còn `glanceTask` — phép đo chạy rỗng');
  assert.ok(
    /split\('—'\)/.test(cat[1]) && /pop\(\)/.test(cat[1]),
    'phải tách nhãn ở dấu — và lấy vế SAU: "Nhóm lửa" là tên, "hoàn thành phiên đầu tiên" mới là '
    + 'thứ trả lời được câu "giờ tôi phải làm gì"',
  );
  // Nhãn không có dấu — thì vẫn phải in ra được nguyên câu, không được thành chuỗi rỗng.
  const tach = (nhan) => (nhan.split('—').pop() ?? '').trim() || nhan;
  assert.equal(tach('Nhóm lửa — hoàn thành phiên đầu tiên'), 'hoàn thành phiên đầu tiên');
  assert.equal(tach('Khánh thành — chinh phục 150 phút trong tuần'), 'chinh phục 150 phút trong tuần');
  assert.equal(tach('Một bước không dấu gạch'), 'Một bước không dấu gạch');
  assert.equal(tach('Chỉ có tên — '), 'Chỉ có tên — ');
});
