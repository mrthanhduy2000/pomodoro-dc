import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { pickFocusMoment } from './focusMomentPick.js';

const APP = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');

const STAGE_NORMAL = { text: 'Còn ~3 phiên nữa tới «X»', tone: 'normal' };
const STAGE_IMMINENT = { text: 'Còn 1 phiên nữa tới «X»', tone: 'imminent' };
const STAGE_CELEBRATE = { text: 'Vừa mở «X»', tone: 'celebrate', dismiss: () => {} };
const STREAK = { text: 'Còn 2 ngày là chạm mốc chuỗi 14 ngày', tone: 'normal', permanent: false };
const STREAK_PERM = { text: 'Mai là chạm Bền Vững — bonus vĩnh viễn', tone: 'imminent', permanent: true };
const onOpenWeekly = () => {};

// ⚠️ VÌ SAO BỘ NÀY TỒN TẠI: ba nguồn của dòng này có ba cái gác ĐỘC LẬP nhau (≤12 phiên tới hết
// chặng · ≤3 ngày tới mốc chuỗi · chưa xem tổng kết tuần). Trước khi gộp, cả ba là ba component
// riêng nên cả ba CÓ THỂ cùng hiện — cộng hai dòng kia là năm dòng, đủ đẩy đồng hồ xuống dưới nếp
// gấp. Bài test này canh đúng cái luật đã thay cho chuyện đó.

test('không có gì để nói thì IM', () => {
  assert.equal(pickFocusMoment({ stage: null, streak: null, weeklyUnseen: false }), null);
  assert.equal(pickFocusMoment({}), null);
});

test('ăn mừng vừa qua mốc chặng THẮNG tất cả — ăn mừng thì phải ngay, để lỡ là mất luôn', () => {
  const out = pickFocusMoment({
    stage: STAGE_CELEBRATE, streak: STREAK_PERM, weeklyUnseen: true, onOpenWeekly, sessionInProgress: false,
  });
  assert.equal(out.text, STAGE_CELEBRATE.text);
  assert.equal(out.icon, '🎉');
  assert.equal(out.onClick, STAGE_CELEBRATE.dismiss, 'lời chúc mừng phải bấm tắt được');
});

test('tổng kết tuần đứng trên mốc chuỗi và đếm ngược chặng', () => {
  const out = pickFocusMoment({
    stage: STAGE_IMMINENT, streak: STREAK_PERM, weeklyUnseen: true, onOpenWeekly, sessionInProgress: false,
  });
  assert.match(out.text, /Tổng kết tuần/);
  assert.equal(out.onClick, onOpenWeekly);
});

// ⚠️ Nhánh tuần là lời MỜI ĐI CHỖ KHÁC ⇒ phải im trong lúc đang tập trung, cùng luật
// `FocusNextAction`. Ba nguồn kia nói lý do NGỒI YÊN nên chúng ở lại — đó là lý do cả cụm KHÔNG
// bị bọc trong `!hasFocusSessionInProgress` ở `App.jsx`, mà chỉ riêng nhánh này tự im.
test('đang chạy phiên thì tổng kết tuần IM, nhưng nhánh khác vẫn nói', () => {
  const out = pickFocusMoment({
    stage: STAGE_NORMAL, streak: STREAK, weeklyUnseen: true, onOpenWeekly, sessionInProgress: true,
  });
  assert.equal(out.text, STREAK.text, 'phải rơi xuống mốc chuỗi, không được im hết');
});

test('mốc chuỗi đứng trên đếm ngược chặng — chuỗi đứt là thứ không lấy lại được', () => {
  const out = pickFocusMoment({ stage: STAGE_IMMINENT, streak: STREAK, weeklyUnseen: false });
  assert.equal(out.text, STREAK.text);
});

test('chỉ còn đếm ngược chặng thì nói nó', () => {
  assert.equal(pickFocusMoment({ stage: STAGE_NORMAL, streak: null, weeklyUnseen: false }).text, STAGE_NORMAL.text);
  assert.equal(pickFocusMoment({ stage: STAGE_NORMAL, streak: null, weeklyUnseen: false }).icon, '◈');
  assert.equal(pickFocusMoment({ stage: STAGE_IMMINENT, streak: null, weeklyUnseen: false }).icon, '🔥');
});

// ⚠️ Gác chống "một dòng lúc nào cũng sáng rực thì chẳng còn gì để sáng rực khi đáng".
test('giọng mạnh chỉ dành cho ca đáng — không phải mặc định', () => {
  assert.equal(pickFocusMoment({ stage: STAGE_NORMAL, streak: null }).strong, false);
  assert.equal(pickFocusMoment({ stage: null, streak: STREAK }).strong, false);
  assert.equal(pickFocusMoment({ stage: null, streak: STREAK_PERM }).strong, true);
  assert.equal(pickFocusMoment({ stage: STAGE_IMMINENT, streak: null }).strong, true);
});

// ⚠️ Gác cấu trúc: ĐÚNG MỘT dòng khoảnh khắc được gắn vào App. Cái sai mà bài này ngăn là chuyện
// một phiên sau thêm "thêm một dòng nữa cho tiện" và dựng lại đúng đống năm dòng vừa gỡ.
// THỬ-CHO-ĐỎ: thêm lại `<FocusStageCountdown />` vào App ⇒ đỏ.
test('màn Tập trung chỉ gắn MỘT dòng khoảnh khắc', () => {
  assert.equal((APP.match(/<FocusMoment\b/g) ?? []).length, 1);
  for (const cu of ['FocusStageCountdown', 'FocusStreakMilestone', 'FocusWeeklyReportTease']) {
    assert.ok(!APP.includes(`<${cu}`), `${cu} đã được gộp vào FocusMoment — đừng gắn lại thành dòng riêng`);
  }
});

test('nhánh tổng kết tuần được nối đủ hai thứ nó cần', () => {
  const i = APP.indexOf('<FocusMoment');
  const tag = APP.slice(i, APP.indexOf('/>', i));
  assert.match(tag, /weeklyUnseen=\{weeklyReportUnseen\}/);
  assert.match(tag, /onOpenWeekly=\{openWeeklyReport\}/);
  assert.match(tag, /sessionInProgress=\{hasFocusSessionInProgress\}/);
});
