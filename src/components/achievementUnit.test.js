import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS } from '../engine/constants.js';
import { DON_VI_NGUONG, cauConLai } from './achievementUnit.js';

test('MỌI trường ngưỡng đang dùng đều có đơn vị — không có mặc định im lặng', () => {
  // ⚠️ Đây là cái gác chính. Không có nó thì một trường mới đếm GIỜ sẽ in ra "còn 12 phiên" và
  // không cổng nào thấy — một câu sai trông y hệt một câu đúng.
  const dung = [...new Set(ACHIEVEMENTS.map((a) => a.dem).filter(Boolean))];
  assert.ok(dung.length > 50, `chỉ quét ra ${dung.length} trường — regex/dữ liệu đã lạc, bài này đang xanh rỗng.`);
  const thieu = dung.filter((d) => !DON_VI_NGUONG[d]);
  assert.deepEqual(thieu, [], `thiếu đơn vị cho: ${thieu.join(', ')}`);
});

test('bảng đơn vị KHÔNG chứa trường thừa — thừa nghĩa là bảng đang trôi khỏi dữ liệu', () => {
  const dung = new Set(ACHIEVEMENTS.map((a) => a.dem).filter(Boolean));
  const thua = Object.keys(DON_VI_NGUONG).filter((d) => !dung.has(d));
  assert.deepEqual(thua, [], `bảng có trường không mục nào dùng: ${thua.join(', ')}`);
});

test('câu "còn N" gắn đúng đơn vị và có dấu phân cách nghìn kiểu Việt', () => {
  assert.equal(cauConLai(751, 'totalFocusMinutes'), 'còn 751 phút');
  assert.equal(cauConLai(112, 'sessionsCompleted'), 'còn 112 phiên');
  assert.equal(cauConLai(4, 'longestStreak'), 'còn 4 ngày');
  assert.equal(cauConLai(1234, 'totalXP'), 'còn 1.234 XP', 'phải là dấu chấm kiểu Việt, không phải dấu phẩy');
});

test('không biết đơn vị thì CÂM, không đoán bừa', () => {
  // Một câu cụt còn hơn một câu sai: "còn 12" đọc lên là chưa đủ thông tin, "còn 12 phiên" cho một
  // mốc tính bằng giờ thì đọc lên là một lời hứa sai.
  assert.equal(cauConLai(12, 'truongLa'), '');
  assert.equal(cauConLai(12, undefined), '');
  assert.equal(cauConLai(0, 'sessionsCompleted'), '', 'còn 0 thì không phải "sắp đạt" nữa');
  assert.equal(cauConLai(-3, 'sessionsCompleted'), '');
  assert.equal(cauConLai(NaN, 'sessionsCompleted'), '');
});
