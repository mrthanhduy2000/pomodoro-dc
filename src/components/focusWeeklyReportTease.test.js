import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./FocusWeeklyReportTease.jsx', import.meta.url), 'utf8');
const APP = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');

// ⚠️ VÌ SAO BỘ NÀY TỒN TẠI: `WeeklyReportModal` là màn đầy dopamine nhất của app (số to, mức tăng,
// điểm hạng, số ngày hoạt động — phần thưởng cho cả một tuần), mà trên iPhone tín hiệu DUY NHẤT
// báo có nó là một chấm 6px nằm BÊN TRONG một menu phải bấm mới mở ra. Phần thưởng lớn nhất được
// thông báo bằng thứ nhỏ nhất, ở chỗ khuất nhất — và không cổng nào bắt được chuyện đó.

test('im lặng khi không có gì để khoe', () => {
  // Gác mặc định phải nằm NGAY ĐẦU hàm, trước mọi thứ khác.
  assert.match(SRC, /if \(!unseen \|\| typeof onOpen !== 'function'\) return null;/);
});

// ⚠️ Bài quan trọng nhất: dòng này là một lời MỜI ĐI CHỖ KHÁC, nên nó phải biến mất trong lúc Đàm
// đang tập trung — cùng luật `FocusNextAction`, và ngược với `FocusCityTease`/`FocusStageCountdown`
// (những dòng nói lý do NGỒI YÊN). Đặt sai nhóm thì nó mời anh rời khỏi đúng việc vừa bấm nút để làm.
// THỬ-CHO-ĐỎ: bỏ `!hasFocusSessionInProgress &&` quanh nó ⇒ đỏ.
test('ẨN khi phiên đang chạy — đây là lời mời đi, không phải lý do ngồi yên', () => {
  const i = APP.indexOf('<FocusWeeklyReportTease');
  assert.ok(i > 0, 'component chưa được gắn vào App ⇒ iPhone vẫn chỉ có cái chấm 6px');
  const before = APP.slice(Math.max(0, i - 260), i);
  assert.match(before, /!hasFocusSessionInProgress && \(/);
});

test('nối đúng hai thứ nó cần: cờ chưa-xem và hàm mở báo cáo', () => {
  const i = APP.indexOf('<FocusWeeklyReportTease');
  const tag = APP.slice(i, APP.indexOf('/>', i));
  assert.match(tag, /unseen=\{weeklyReportUnseen\}/);
  assert.match(tag, /onOpen=\{openWeeklyReport\}/);
});

// ⚠️ Gác chống nhân đôi công thức. Điểm hạng và các con số tuần sống trong `WeeklyReportModal`;
// kéo chúng ra đây để in sẵn lên dòng chữ sẽ hoặc phải chép lại công thức (bẫy "một luật hai công
// thức" mà dự án đã trả giá nhiều lần), hoặc phải tách một module engine mới cho một dòng chữ.
// Dòng này chỉ làm một việc: nói rằng CÓ, và mở ra.
test('không tự tính lại con số nào của báo cáo tuần', () => {
  // ⚠️ PHẢI LỌC CHÚ THÍCH TRƯỚC KHI HỎI. Bản đầu của bài này ĐỎ OAN trên mã hoàn toàn đúng, vì
  // khối chú thích của chính component nhắc đích danh `GRADES` và `computeWeekStats` để GIẢI THÍCH
  // vì sao nó KHÔNG dùng chúng. Cùng hình dạng đã cắn ở `focusGoalJump.test.js` (neo vào nhãn thay
  // vì lời gọi) và ở luật `/tênHàm\(/` trong CLAUDE.md: một phép tìm trên mã nguồn thì phần văn
  // xuôi cũng là một match, và văn xuôi nói về một thứ chính là nơi cái tên ấy xuất hiện nhiều nhất.
  const codeOnly = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const cam of ['GRADES', 'computeWeekStats', 'getGrade', 'totalMinutes']) {
    assert.ok(!codeOnly.includes(cam), `dòng mời KHÔNG được tính lại "${cam}" — con số ở lại trong modal`);
  }
});
