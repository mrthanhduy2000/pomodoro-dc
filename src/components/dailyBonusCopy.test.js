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

// ⚠️ ADR-070: không còn nút "Nhận" — thưởng trọn ngày tự vào trong phiên. Ca `ready` chỉ còn xảy ra
// khi nhiệm vụ cuối xong NGOÀI phiên, và lúc ấy câu phải nói KHI NÀO thưởng vào. Một câu còn chữ
// "Nhận" cạnh chỗ không còn nút là một lời hứa treo — khoá cả hai chiều.
test('câu lúc xong hết phải nói KHI NÀO thưởng vào, và không được gọi một cái nút không còn tồn tại', () => {
  assert.match(DAILY_BONUS_COPY.ready, /phiên kế/);
  for (const text of [DAILY_BONUS_COPY.ready, DAILY_BONUS_COPY.claimed, DAILY_BONUS_COPY.pending(43)]) {
    assert.ok(!/Nhận|bấm|lấy/i.test(text), `câu «${text}» còn gọi người chơi đi bấm/nhận/lấy — nút ấy đã gỡ`);
  }
});
