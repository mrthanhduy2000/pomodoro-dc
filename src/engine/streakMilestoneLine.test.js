import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { describeStreakMilestone, STREAK_MILESTONE_NEAR_DAYS } from './gameMath.js';
import { STREAK_MILESTONES } from './constants.js';

// ⚠️ VÌ SAO BỘ NÀY TỒN TẠI: cột mốc chuỗi (kể cả mốc "Bền Vững" cho một bonus VĨNH VIỄN — phần
// thưởng mạnh nhất game) đã chạy từ lâu và CHỈ hiện ở `FocusRail`, một cột `hidden … lg:flex`.
// Tức nó chưa bao giờ tới được iPhone. Hàm này là cái cổng đưa nó ra màn hình chính, và vì nó
// THUẦN nên gác được bằng test thay vì bằng ảnh chụp.

test('chưa có chuỗi thì IM — không nói về cái đích chưa có đường tới', () => {
  assert.equal(describeStreakMilestone({ currentStreak: 0 }), null);
  assert.equal(describeStreakMilestone({ currentStreak: -5 }), null);
  assert.equal(describeStreakMilestone({}), null);
  assert.equal(describeStreakMilestone(), null);
});

test('còn xa thì IM — một cái đích quá xa làm nản chứ không kéo', () => {
  // Ngay sau khi vừa chạm mốc 7, mốc kế là 14 ⇒ còn 7 ngày ⇒ phải im.
  assert.equal(describeStreakMilestone({ currentStreak: 7 }), null);
  assert.equal(describeStreakMilestone({ currentStreak: 8 }), null);
});

test('vào tầm thì nói, và nói ĐÚNG số ngày còn lại', () => {
  for (const m of STREAK_MILESTONES) {
    for (let d = 1; d <= STREAK_MILESTONE_NEAR_DAYS; d += 1) {
      const streak = m.days - d;
      if (streak < 1) continue;
      const out = describeStreakMilestone({ currentStreak: streak });
      assert.ok(out, `chuỗi ${streak} (còn ${d} ngày tới ${m.label}) phải nói ra`);
      assert.equal(out.days, d);
      assert.equal(out.permanent, m.permanent === true);
    }
  }
});

// ⚠️ Gác BIÊN, không chỉ gác giữa. Đúng chỗ trần cắt là chỗ một bản vá "nới cho chắc" sẽ đi qua mà
// không ai thấy — bài học cái phễu Phase 9A.
test('trần cắt ĐÚNG ở ngày thứ N, không rộng hơn', () => {
  const m = STREAK_MILESTONES[0];
  const vua = m.days - STREAK_MILESTONE_NEAR_DAYS;
  assert.ok(describeStreakMilestone({ currentStreak: vua }), 'đúng trần thì phải nói');
  assert.equal(describeStreakMilestone({ currentStreak: vua - 1 }), null, 'quá trần một ngày thì phải im');
});

test('còn 1 ngày thì nói "Mai" và đổi giọng — dopamine mạnh nhất nằm ngay trước đích', () => {
  const m = STREAK_MILESTONES[0];
  const out = describeStreakMilestone({ currentStreak: m.days - 1 });
  assert.equal(out.tone, 'imminent');
  assert.match(out.text, /^Mai /);
  const xa = describeStreakMilestone({ currentStreak: m.days - 3 });
  assert.equal(xa.tone, 'normal');
  assert.match(xa.text, /^Còn 3 ngày/);
});

// ⚠️ Bản đầu ghép thẳng nhãn của bảng vào câu và ra "chạm mốc 7 chuỗi" — đúng dữ liệu, sai tiếng
// Việt. Hai mốc đầu chỉ là con số nên gọi bằng số ngày; mốc cuối có TÊN RIÊNG và tên ấy chính là
// thứ đáng khoe.
test('mốc thường gọi bằng SỐ NGÀY, mốc vĩnh viễn gọi bằng TÊN và nói rõ phần thưởng', () => {
  const thuong = STREAK_MILESTONES.find((m) => !m.permanent);
  const vinhVien = STREAK_MILESTONES.find((m) => m.permanent);
  assert.ok(thuong && vinhVien, 'bảng mốc phải có cả hai loại, nếu không bài này mất nghĩa');

  const a = describeStreakMilestone({ currentStreak: thuong.days - 2 });
  assert.match(a.text, new RegExp(`mốc chuỗi ${thuong.days} ngày`));
  assert.doesNotMatch(a.text, /vĩnh viễn/);

  const b = describeStreakMilestone({ currentStreak: vinhVien.days - 2 });
  assert.match(b.text, new RegExp(vinhVien.label));
  assert.match(b.text, /bonus vĩnh viễn/);
});

// ⚠️ Gác "đã tới được màn hình chưa". Cơ chế này đã tồn tại nhiều tháng ở FocusRail mà iPhone
// không thấy — đúng loại hỏng mà lint/build/test thường không bắt. Bài này hỏi thẳng App.jsx.
// THỬ-CHO-ĐỎ: xoá dòng `<FocusStreakMilestone />` ⇒ đỏ.
test('dòng cột mốc chuỗi thật sự tới được màn hình', () => {
  // ⚠️ TỪ 2026-08-30 nó không còn là component riêng — đã gộp vào `FocusMoment` cùng đếm ngược
  // chặng và tổng kết tuần (ba cái gác độc lập nhau nên cả ba có thể cùng nổ, đẩy đồng hồ xuống
  // dưới nếp gấp). LỜI HỨA giữ nguyên: cơ chế này phải TỚI ĐƯỢC iPhone, chứ không nằm mãi trong
  // cột phải `hidden … lg:flex` như trước vòng 10.
  const app = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
  assert.match(app, /<FocusMoment\b/, 'dòng khoảnh khắc chưa được gắn ⇒ iPhone vẫn không thấy');

  const moment = readFileSync(new URL('../components/FocusMoment.jsx', import.meta.url), 'utf8');
  assert.match(moment, /useStreakMilestone/, '`FocusMoment` không còn đọc cột mốc chuỗi');

  const pick = readFileSync(new URL('../components/focusMomentPick.js', import.meta.url), 'utf8');
  assert.match(pick, /streak\.text/, 'luật chọn không còn nhánh nào nói ra cột mốc chuỗi');
  // Thứ tự: chuỗi phải đứng TRÊN đếm ngược chặng — chuỗi đứt là thứ không lấy lại được.
  const streakAt = pick.indexOf('streak.text');
  const stageAt = pick.indexOf('stage.text', streakAt);
  assert.ok(stageAt > streakAt, 'cột mốc chuỗi phải được xét trước đếm ngược chặng');
});
