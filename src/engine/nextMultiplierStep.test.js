/**
 * nextMultiplierStep.test.js — canh lời hứa "huy hiệu hệ số phải gọi tên vách KẾ TIẾP".
 *
 * Bản cũ chỉ nói được vách ×1.3 rồi câm ở 75,2% số phiên (đo trên fixture 624 phiên), mà im
 * lặng đúng ở khúc 45–59 phút — nơi 117 phiên đã dừng khi chỉ còn 1–15 phút nữa là ×2.0.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { nextMultiplierStep, getMultiplierTier } from './gameMath.js';
import {
  DEFAULT_DEEP_FOCUS_THRESHOLD,
  DEEP_SESSION_THRESHOLD,
  WARMUP_REDUCED_THRESHOLD,
} from './constants.js';

// THỬ-CHO-ĐỎ: bỏ vách `{ moc: DEEP_SESSION_THRESHOLD, he: 2.0 }` khỏi mảng ⇒ bài 1 đỏ ở phút 45.
test('gọi tên vách kế tiếp ở MỌI bậc, không chỉ bậc đầu', () => {
  // dưới ×1.3
  assert.deepEqual(nextMultiplierStep(10), { minutesLeft: 16, targetMultiplier: 1.3 });
  assert.deepEqual(nextMultiplierStep(25), { minutesLeft: 1, targetMultiplier: 1.3 });
  // ĐÂY là khoảng mà bản cũ câm hoàn toàn
  assert.deepEqual(nextMultiplierStep(26), { minutesLeft: 34, targetMultiplier: 2.0 });
  assert.deepEqual(nextMultiplierStep(45), { minutesLeft: 15, targetMultiplier: 2.0 });
  assert.deepEqual(nextMultiplierStep(59), { minutesLeft: 1, targetMultiplier: 2.0 });
  // kịch trần ⇒ không nói gì
  assert.equal(nextMultiplierStep(60), null);
  assert.equal(nextMultiplierStep(120), null);
  // đầu vào rác không được làm vỡ huy hiệu
  assert.equal(nextMultiplierStep(undefined), null);
  assert.equal(nextMultiplierStep(NaN), null);
});

test('ngưỡng ×1.3 co lại theo kỹ năng Khởi Động Nhanh', () => {
  assert.deepEqual(
    nextMultiplierStep(15, WARMUP_REDUCED_THRESHOLD),
    { minutesLeft: 5, targetMultiplier: 1.3 },
  );
  // đã qua ngưỡng rút gọn ⇒ chuyển sang chỉ về ×2.0
  assert.deepEqual(
    nextMultiplierStep(20, WARMUP_REDUCED_THRESHOLD),
    { minutesLeft: 40, targetMultiplier: 2.0 },
  );
});

// THỬ-CHO-ĐỎ: đổi `DEEP_SESSION_THRESHOLD` về 55 trong `getMultiplierTier` ⇒ bài 3 đỏ.
// Đây là bài quan trọng nhất: nó khoá QUAN HỆ giữa hai hàm, không khoá một con số.
test('vách phải khớp TỪNG PHÚT với thang mà getMultiplierTier đang dùng', () => {
  let soLanDoiBac = 0;
  for (const nguong of [DEFAULT_DEEP_FOCUS_THRESHOLD, WARMUP_REDUCED_THRESHOLD]) {
    const nhanh = nguong === WARMUP_REDUCED_THRESHOLD;
    for (let phut = 1; phut <= 90; phut += 1) {
      const buoc = nextMultiplierStep(phut, nguong);
      const bacHienTai = getMultiplierTier(phut, nhanh).multiplier;

      if (buoc === null) {
        assert.equal(bacHienTai, 2.0, `phút ${phut}: nói "kịch trần" nhưng thang mới ở ×${bacHienTai}`);
        continue;
      }
      // Đi thêm đúng số phút nó hứa thì PHẢI lên đúng bậc nó hứa…
      const sauKhiDi = getMultiplierTier(phut + buoc.minutesLeft, nhanh).multiplier;
      assert.equal(
        sauKhiDi, buoc.targetMultiplier,
        `phút ${phut}: hứa đi thêm ${buoc.minutesLeft}' lên ×${buoc.targetMultiplier}, thực tế ×${sauKhiDi}`,
      );
      // …và đi THIẾU một phút thì PHẢI chưa lên (nếu không, nó đang nói thừa).
      const thieuMot = getMultiplierTier(phut + buoc.minutesLeft - 1, nhanh).multiplier;
      assert.ok(
        thieuMot < buoc.targetMultiplier,
        `phút ${phut}: đi thiếu 1' đã lên ×${thieuMot} — huy hiệu đang bắt chờ thừa`,
      );
      if (sauKhiDi !== bacHienTai) soLanDoiBac += 1;
    }
  }
  // Gác chạy-rỗng: nếu vòng lặp không thật sự đi qua các vách thì mọi assert trên là vô nghĩa.
  assert.ok(soLanDoiBac >= 100, `mới thấy ${soLanDoiBac} lần đổi bậc — phép đo đang chạy rỗng`);
  assert.equal(DEEP_SESSION_THRESHOLD, 60, 'mốc ×2.0 đổi ⇒ đọc lại chú thích ở gameMath.js');
});
