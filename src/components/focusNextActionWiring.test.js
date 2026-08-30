import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * DÒNG "VIỆC TIẾP THEO" — canh DÂY NỐI bằng cách đọc mã nguồn.
 *
 * ⚠️ VÌ SAO PHẢI CÓ RIÊNG BÀI NÀY, KHI `opportunities.test.js` ĐÃ CANH `pickNextAction`. Một hàm
 * engine chạy đúng KHÔNG chứng minh là có ai gọi nó. Dự án đã bị đúng chuyện này cắn một lần:
 * `summarizeMuseum` viết xong, có test riêng, chạy đúng — và `grep` cả cây `src/` ra đúng hai chỗ
 * là dòng định nghĩa và bài test của chính nó. Build xanh, lint sạch, không cảnh báo "unused" nào
 * (hàm CÓ được dùng — bởi bài test của nó), và trên màn hình thì thiếu mất một thứ không ai nhớ
 * là đáng lẽ phải có.
 *
 * ⚠️ VÀ VÌ SAO BÀI THỨ HAI LẠI VỀ VỊ TRÍ. Cột phải (`FocusRail`) là `hidden … lg:flex` — trên
 * iPhone nó KHÔNG BAO GIỜ hiện, mà iPhone là chỗ Đàm dùng nhiều nhất. Đặt dòng này vào đó thì mọi
 * cổng vẫn xanh và Đàm vẫn không thấy gì. Đúng bài học của ADR-061: *một lưới chỉ căng ở một nền
 * tảng thì nó không phải lưới — nó là một lời hứa đúng một nửa, và nửa sai rơi vào iPhone.*
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = readFileSync(join(HERE, '..', 'App.jsx'), 'utf8');
const RAIL = readFileSync(join(HERE, 'FocusRail.jsx'), 'utf8');
const COMPONENT = readFileSync(join(HERE, 'FocusNextAction.jsx'), 'utf8');

/** Chỉ lấy phần MÃ — nếu không thì chính chú thích giải thích luật sẽ bị đếm như mã. */
function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

const APP_CODE = codeOnly(APP);

test('dòng "việc tiếp theo" thật sự được dựng ở App, kèm bộ điều hướng', () => {
  assert.ok(
    /<FocusNextAction\b/.test(APP_CODE),
    '`FocusNextAction` không được dựng ở đâu cả — hàm `pickNextAction` đang chạy đúng cho không ai',
  );
  assert.ok(
    /<FocusNextAction[^>]*onNavigate=\{handleNotificationNavigate\}/.test(APP_CODE),
    'thiếu `onNavigate` ⇒ bấm vào dòng không đi đâu cả; và phải dùng CHUNG bộ điều hướng của cái '
    + 'chuông, không dựng lại một bộ thứ hai',
  );
});

test('nó nằm ở CỘT GIỮA (iPhone thấy được), không nằm trong cột phải', () => {
  assert.ok(
    !/FocusNextAction/.test(RAIL),
    '`FocusNextAction` lọt vào `FocusRail` — cột đó là `hidden … lg:flex`, iPhone không bao giờ thấy',
  );
  // Neo vào một thứ CHẮC CHẮN thuộc cột giữa: `FocusCityTease`, thứ đã có sẵn ở đó với đúng lý do
  // ấy. Hỏi "có nằm cạnh nó không" đúng hơn là đếm số dấu cách thụt lề — thụt lề đổi theo mọi lần
  // bọc thêm một thẻ, còn quan hệ láng giềng thì không.
  const giua = APP_CODE.indexOf('<FocusCityTease');
  const dong = APP_CODE.indexOf('<FocusNextAction');
  assert.ok(giua > 0 && dong > giua, 'không tìm thấy `FocusCityTease` đứng trước — bố cục đã đổi, đọc lại');
  // ⚠️ TÌM ĐỒNG HỒ *SAU* MỐC NEO, không phải `indexOf` từ đầu file. Bản đầu của assert này viết
  // `APP_CODE.indexOf('<PomodoroEngine')` và ĐỎ trên mã hoàn toàn đúng: `App.jsx` dựng
  // `<PomodoroEngine>` ở HAI nhánh (một cho chế độ toàn màn hình, một cho cột giữa), và nhánh
  // toàn màn hình đứng trước cả khối này. `indexOf` trả về chỗ đầu tiên, nên nó đang so với một
  // cái đồng hồ ở màn hình KHÁC. Phép đo hỏng, không phải bố cục hỏng.
  const dongHo = APP_CODE.indexOf('<PomodoroEngine', giua);
  assert.ok(dongHo > 0, 'không thấy đồng hồ nào sau `FocusCityTease` — bố cục đã đổi, đọc lại');
  assert.ok(
    dongHo > dong,
    'dòng này bị đẩy xuống DƯỚI đồng hồ; thẻ đồng hồ cao gần hết màn iPhone nên chỗ đó nằm dưới '
    + 'nếp gấp — cùng lý do đã ghi cho `FocusCityTease`',
  );
});

test('không có việc nào thì KHÔNG render gì — không khung rỗng', () => {
  assert.ok(
    /if\s*\(!next\)\s*return null;/.test(COMPONENT),
    'thiếu cổng im lặng ⇒ màn Tập trung mọc ra một dòng trống chừa chỗ sẵn ở những ngày không có việc',
  );
});

test('không dựng lại ba phép đếm ở tầng giao diện', () => {
  // Cùng luật với bài "MỘT LUẬT MỘT CÔNG THỨC" ở `opportunities.test.js`: cái chuông, cái chấm và
  // dòng này phải luôn nói cùng một chuyện. Chép công thức xuống đây cho "gần chỗ dùng" là cách
  // hai bản sao trôi khỏi nhau ở biên, rồi dòng nói có việc trong khi cái chấm im.
  for (const dauHieu of ['ALL_SKILLS', 'BLUEPRINT_META', 'BUILDING_SPECS', 'countActiveCrafting']) {
    assert.ok(
      !COMPONENT.includes(dauHieu),
      `\`${dauHieu}\` xuất hiện trong FocusNextAction.jsx — dấu hiệu phép đếm đang được dựng lại lần hai`,
    );
  }
});

test('KHÔNG hiện khi phiên đang chạy — nó là lời mời đi chỗ khác', () => {
  // ⚠️ Dòng này là một cái NÚT dẫn sang tab khác. Để nó giữa màn hình tập trung trong lúc đồng hồ
  // đang chạy là mời Đàm rời khỏi đúng việc anh vừa bấm nút để làm. Chỉ soi ảnh lúc phiên chạy mới
  // thấy — mọi cổng khác đều xanh.
  // `FocusCityTease` / `FocusStageCountdown` thì Ở LẠI: chúng nói "phiên này đang đẩy cái gì tới
  // đâu", tức động lực để NGỒI YÊN.
  assert.ok(
    /\{!hasFocusSessionInProgress && \(\s*<FocusNextAction/.test(APP_CODE),
    '`FocusNextAction` không còn bị ẩn khi phiên đang chạy',
  );
});
