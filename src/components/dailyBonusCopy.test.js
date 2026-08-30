import test from 'node:test';
import assert from 'node:assert/strict';

import { DAILY_BONUS_COPY, REWARD_DESCRIPTION_MAX_CHARS } from './dailyBonusCopy.js';

// ⚠️ VÌ SAO BÀI NÀY TỒN TẠI: ba câu này đi vào một ô `truncate` một dòng, nên khi chúng dài quá
// thì trình duyệt cắt bằng "…" và KHÔNG có gì đỏ lên — build xanh, lint sạch, test xanh, chỉ có
// một câu cụt trên màn hình iPhone. Đó đúng là chuyện đã xảy ra (bản cũ 32–34 ký tự, cả ba đều
// cụt). Hợp đồng "một dòng" từng chỉ được ghi trong một chú thích, và một chú thích thì không
// chặn được gì.
// THỬ-CHO-ĐỎ: đổi `claimed` về 'Đã nhận thưởng trọn ngày hôm nay.' ⇒ bài đầu tiên đỏ.

test('mọi câu của thẻ "Thưởng trọn ngày" đều lọt MỘT dòng', () => {
  const fixed = [
    ['claimed', DAILY_BONUS_COPY.claimed],
    ['ready', DAILY_BONUS_COPY.ready],
  ];
  for (const [key, text] of fixed) {
    assert.ok(
      text.length <= REWARD_DESCRIPTION_MAX_CHARS,
      `câu «${key}» dài ${text.length} ký tự, quá trần ${REWARD_DESCRIPTION_MAX_CHARS} ⇒ sẽ bị cắt cụt: "${text}"`,
    );
  }
});

// ⚠️ Câu `pending` mang một CON SỐ, nên độ dài của nó thay đổi theo người chơi. Kiểm ở giá trị
// nhỏ là kiểm đúng cái ca dễ nhất; ca thật sự nguy hiểm là lúc XP nhiều nhất — tức đúng lúc câu
// này đáng đọc nhất. Bơm thẳng ca xấu nhất vào.
test('câu "còn bao nhiêu XP" vẫn lọt một dòng ở ca XP LỚN NHẤT', () => {
  for (const xp of [0, 43, 999, 12345, 99999]) {
    const text = DAILY_BONUS_COPY.pending(xp);
    assert.ok(
      text.length <= REWARD_DESCRIPTION_MAX_CHARS,
      `với xp=${xp} câu dài ${text.length} ký tự, quá trần ${REWARD_DESCRIPTION_MAX_CHARS}: "${text}"`,
    );
  }
});

// Gác chạy-rỗng: nếu một ngày nào đó ai đó đổi `pending` thành hằng số thì hai bài trên vẫn xanh
// trong khi con số biến mất khỏi màn hình. Bài này đòi con số PHẢI có mặt.
test('câu "còn bao nhiêu XP" thật sự có nhắc con số', () => {
  assert.match(DAILY_BONUS_COPY.pending(1234), /1[.,]234/);
  assert.notEqual(DAILY_BONUS_COPY.pending(1), DAILY_BONUS_COPY.pending(2));
});

// ⚠️ Ca `ready` là ca DUY NHẤT có một nút bấm hiện ra cạnh nó. Câu cũ ("Đã hoàn tất toàn bộ nhiệm
// vụ ngày.") mô tả trạng thái và không nhắc gì tới cái nút, nên phần thưởng có thể nằm đó không ai
// lấy. Khoá lại việc câu này phải CHỈ VIỆC, không phải kể trạng thái.
test('câu lúc xong hết phải chỉ ra việc cần làm, không chỉ kể trạng thái', () => {
  assert.match(DAILY_BONUS_COPY.ready, /Nhận/);
});
