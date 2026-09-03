/**
 * pomodoroSetupSummary.test.js — canh dòng tóm tắt thiết lập phiên.
 * Chạy: node --test src/components/pomodoroSetupSummary.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { tomTatThietLap, CHE_DO_BAM_GIO } from './pomodoroSetupSummary.js';

test('POMO: nói ĐỦ ba cần gạt — số phút · nghỉ ngắn · nghỉ dài', () => {
  // ⚠️ Gấp một bảng lại mà dòng thay thế thiếu một cần gạt thì đó là GIẤU, không phải gấp.
  const s = tomTatThietLap({ mode: 'pomodoro', focusMinutes: 25, shortBreak: 5, longBreak: 15 });
  assert.match(s, /25/);
  assert.match(s, /5/);
  assert.match(s, /15/);
  assert.equal(s, '25′ · nghỉ 5′/15′');
});

test('KỶ LUẬT CHỈ HIỆN KHI ĐANG BẬT — và có dấu ngăn, không dính vào chữ trước', () => {
  assert.equal(
    tomTatThietLap({ mode: 'pomodoro', focusMinutes: 52, shortBreak: 17, longBreak: 30, strict: true }),
    '52′ · nghỉ 17′/30′ · kỷ luật',
  );
  assert.doesNotMatch(
    tomTatThietLap({ mode: 'pomodoro', focusMinutes: 52, shortBreak: 17, longBreak: 30, strict: false }),
    /kỷ luật/,
  );
});

test('BẤM GIỜ KHÔNG ĐƯỢC IN SỐ PHÚT ĐỊNH TRƯỚC — đó là nói dối về chính chế độ ấy', () => {
  const s = tomTatThietLap({ mode: CHE_DO_BAM_GIO, focusMinutes: 25, shortBreak: 5, longBreak: 15 });
  assert.doesNotMatch(s, /25/, 'chế độ Bấm giờ không có thời lượng định trước');
  assert.doesNotMatch(s, /nghỉ 5/, 'giờ nghỉ ở Bấm giờ suy từ thời lượng vừa làm, không phải hằng số');
  assert.match(s, /Bấm giờ/);
  // …nhưng kỷ luật thì VẪN áp cho cả hai chế độ, nên nó vẫn phải hiện.
  assert.match(tomTatThietLap({ mode: CHE_DO_BAM_GIO, strict: true }), /kỷ luật/);
});

test('KHÔNG TRUYỀN GÌ ⇒ không ném, và không bịa ra con số nào', () => {
  const s = tomTatThietLap();
  assert.equal(typeof s, 'string');
  assert.equal(s, '0′ · nghỉ 0′/0′');
});
