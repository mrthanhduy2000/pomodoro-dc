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
