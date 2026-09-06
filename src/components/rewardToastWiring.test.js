import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * LUẬT MỨC ĐỘ LÀM PHIỀN (2026-08-27, ADR-060) — canh bằng cách ĐỌC MÃ NGUỒN.
 *
 * ⚠️ Vì sao đọc mã nguồn thay vì dựng React: dự án chạy test bằng `node --test`
 * thuần, không có DOM, không có thư viện render. Thứ cần khoá ở đây lại là một
 * ĐIỀU KIỆN JSX — "hộp thoại phần thưởng chỉ mở khi lên kỷ" — và nó hỏng theo
 * kiểu im lặng nhất có thể: đổi `showLootModal` về `lootModalOpen` thì build vẫn
 * xanh, lint vẫn sạch, mọi bài test khác vẫn xanh, chỉ có mỗi phiên Pomodoro lại
 * chặn màn hình như cũ. Cùng lý do đã viết ở `notificationLayer.test.js`.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = readFileSync(join(HERE, '..', 'App.jsx'), 'utf8');

/** Chỉ lấy phần MÃ — nếu không thì chính chú thích giải thích luật sẽ bị đếm như mã. */
function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

const APP_CODE = codeOnly(APP);

/**
 * ⚠️ ĐÂY LÀ ĐIỀU KIỆN NGHIỆM THU CỦA CẢ THAY ĐỔI (ADR-060 → ADR-070): xong một phiên thì màn hình
 * chỉ có MỘT cái kết — chuỗi thẻ thưởng. Cổng cũ `{lootModalOpen && <RewardSequence />}` mở hộp thoại
 * 7 giai đoạn sau MỌI phiên; ADR-060 giữ nó cho riêng lúc lên kỷ + khi bấm "Xem chi tiết"; ADR-070
 * (2026-09-06) gỡ hẳn: không còn `LootDropModal`, không còn `detail === 'loot'`, thẻ «Kỷ nguyên mới»
 * là cái kết khi lên kỷ.
 */
test('ADR-070: KHÔNG còn hộp thoại chi tiết — chuỗi thẻ là cái kết duy nhất, kể cả khi lên kỷ', () => {
  assert.ok(!existsSync(join(HERE, 'LootDropModal.jsx')), 'LootDropModal.jsx vẫn còn — hai cái kết cho một phiên');
  assert.ok(
    !/LootDropModal|RewardSequence|showLootModal/.test(APP_CODE),
    'App.jsx vẫn tham chiếu hộp thoại chi tiết — một phiên lại có hai cái kết',
  );
  assert.ok(!/detail === 'loot'/.test(APP_CODE), '`detail === "loot"` quay lại — một cửa thứ hai vào cùng phần thưởng');
  // Lên kỷ được kể ở chuỗi thẻ, không ở một hộp thoại riêng.
  const story = codeOnly(readFileSync(join(HERE, 'sessionRewardStory.js'), 'utf8'));
  assert.match(story, /reward\.eraChanged/, 'bộ dựng thẻ không còn đọc `eraChanged` ⇒ lên kỷ không được kể ở đâu cả');
  const storyJsx = codeOnly(readFileSync(join(HERE, 'SessionRewardStory.jsx'), 'utf8'));
  assert.match(storyJsx, /card\.id === 'era'/, 'component không dựng thẻ kỷ mới');
  assert.ok(!/Xem chi tiết/.test(storyJsx), 'nút "Xem chi tiết" quay lại — nó dẫn tới một hộp thoại không còn tồn tại');
});

/**
 * ⚠️ CHUỖI THẺ THƯỞNG CHẠY SAU MỌI PHIÊN (2026-09-05, ADR-068) — và nó SỬA LẠI MỘT NỬA ADR-060.
 * ADR-060 đúng khi cấm hộp thoại 7 giai đoạn chặn màn hình sau mỗi phiên; nó sai ở chỗ thay bằng
 * một thẻ toast 4 giây ở góc: ~82% số phiên không còn lễ mừng nào (đo ở `timerSession.js`), nên
 * 25 phút làm việc thật kết thúc bằng thứ dễ bỏ lỡ nhất app. Chuỗi thẻ là cái KẾT — ngắn, mỗi thẻ
 * một con số, bỏ qua được bằng một chạm.
 */
test('chuỗi thẻ thưởng bám `lootModalOpen` (mọi phiên), là cái kết DUY NHẤT (ADR-076), tính vào `blocking`, và ĐÓNG phần thưởng không điều kiện', () => {
  const gate = /const\s+showStory\s*=\s*([^;]+);/.exec(APP_CODE);
  assert.ok(gate, 'không đọc được `showStory` — chuỗi thẻ thưởng đã đi đâu?');
  assert.match(gate[1], /lootModalOpen/, 'chuỗi thẻ phải bám `lootModalOpen` — chạy sau MỌI phiên, không chỉ khi lên kỷ');
  assert.doesNotMatch(gate[1], /showMoment/, 'ADR-076: nothing stands before the story any more — no second gate');
  assert.match(gate[1], /!storyDone/, 'thiếu cờ "đã xem xong" ⇒ chuỗi thẻ dựng lại ngay sau khi đóng');
  assert.match(APP_CODE, /\{\s*showStory\s*&&\s*<SessionRewardStory/, 'chuỗi thẻ không được dựng');

  const blocking = /const\s+blocking\s*=\s*([\s\S]*?);/.exec(APP_CODE);
  assert.match(blocking[1], /showStory/, '`blocking` bỏ sót chuỗi thẻ ⇒ 4 giây của toast cháy sau lưng nó');

  // ADR-070: kết thúc chuỗi thẻ phải ĐÓNG phần thưởng KHÔNG ĐIỀU KIỆN — không còn ai đọc `pendingReward`
  // sau đó. Giữ lại cổng `pendingEraChanged` là để `lootModalOpen` treo mãi ở đúng lúc lên kỷ.
  const finish = /const\s+finishStory\s*=\s*useCallback\(([\s\S]*?)\}, \[/.exec(APP_CODE);
  assert.ok(finish, 'không đọc được `finishStory`');
  assert.match(finish[1], /closeLootModal\(\)/, 'chuỗi thẻ xong mà không đóng phần thưởng ⇒ `lootModalOpen` treo mãi');
  assert.ok(!/pendingEraChanged|openDetail/.test(finish[1]), '`finishStory` còn giữ `pendingReward` lại cho một hộp thoại không còn tồn tại');
  assert.match(finish[1], /if \(navigate\) onNavigate/, 'nút trên thẻ ("Chọn công trình ngay" · "Xem thành phố mới") không dẫn đi đâu');
});

test('lên cấp cũng không tự chặn màn hình nữa', () => {
  assert.ok(
    !/\{\s*hasLevelUp\s*&&\s*<LevelUpModal/.test(APP_CODE),
    'màn lên cấp lại tự bật — lên cấp không buộc Đàm quyết định gì nên nó thuộc nhóm toast',
  );
  assert.match(
    /const\s+showLevelModal\s*=\s*([^;]+);/.exec(APP_CODE)?.[1] ?? '',
    /detail === 'level'/,
    'màn lên cấp phải do Đàm bấm vào thẻ mới mở',
  );
  // Mở theo yêu cầu thì KHÔNG được tự đóng sau 4 giây.
  assert.match(APP_CODE, /<LevelUpModal\s+autoDismissMs=\{0\}\s*\/>/);
});

test('chồng toast được gắn vào app, và nó dừng đồng hồ khi có hộp thoại chặn', () => {
  assert.match(APP_CODE, /<RewardToastHost/, 'chưa gắn `RewardToastHost` vào app');
  assert.match(APP_CODE, /paused=\{blocking\}/, 'đồng hồ toast không dừng khi hộp thoại đang chặn — 4 giây sẽ cháy sau lớp mờ');
  assert.match(APP_CODE, /onOpenDetail=\{setDetail\}/, 'bấm vào thẻ phải mở được chi tiết');
  assert.match(APP_CODE, /onNavigate=\{onNavigate\}/, 'bấm vào thẻ phải nhảy được tới tab đang giữ phần thưởng');
});

/**
 * Hai kênh này store GHI từ lâu mà TRƯỚC 2026-08-27 không màn hình nào ĐỌC (xem
 * chú thích đầu `engine/rewardFeed.js`). Nếu điều kiện dựng lớp phủ quên chúng
 * thì di vật lại về trạng thái cũ: nhận xong không hiện gì cả.
 */
test('điều kiện dựng lớp phủ có tính cả di vật và nhiệm vụ ngày', () => {
  const gate = /const\s+hasToast\s*=\s*\(([\s\S]*?)\);/.exec(APP_CODE);
  assert.ok(gate, 'không đọc được `hasToast`');
  for (const needle of ['relicPending', 'missionCompletedCount', 'achievementQueueLength', 'hasLevelUp']) {
    assert.match(gate[1], new RegExp(needle), `\`hasToast\` bỏ sót ${needle}`);
  }
});

test('toast thành tích cũ đã bị gỡ, không còn hai hệ toast chạy song song', () => {
  assert.ok(
    !existsSync(join(HERE, 'AchievementToast.jsx')),
    'AchievementToast.jsx vẫn còn — hai chồng toast cùng lúc là đúng thứ phân mảnh mà thay đổi này đi gỡ',
  );
  assert.ok(!/AchievementToast/.test(APP_CODE), 'App.jsx vẫn còn tham chiếu `AchievementToast`');
});

/**
 * ⚠️ Thẻ phần thưởng phải nằm DƯỚI sàn hộp thoại (z-50) và TRÊN chuông (z-[45]).
 * Đây là thứ bậc mới thành hình ảnh: hộp thoại là việc phải quyết nên nó che thẻ;
 * thẻ chỉ là việc cần biết. `notificationLayer.test.js` chỉ quét `*Modal.jsx` nên
 * nó không nhìn thấy file này — chỗ canh phải ở đây.
 */
test('chồng toast nằm giữa chuông thông báo và sàn hộp thoại', () => {
  const host = readFileSync(join(HERE, 'RewardToastHost.jsx'), 'utf8');
  const layers = [...codeOnly(host).matchAll(/\bz-(?:\[(\d+)\]|(\d+)\b)/g)]
    .map((m) => Number(m[1] ?? m[2]));
  assert.ok(layers.length > 0, 'không đọc được lớp z của chồng toast');

  const top = Math.max(...layers);
  assert.ok(top > 45, `chồng toast ở z-${top} — không cao hơn chuông thông báo (z-[45])`);
  assert.ok(top < 50, `chồng toast ở z-${top} — từ 50 trở lên là dải HỘP THOẠI, thẻ sẽ nổi lên trên lớp mờ`);
});

/**
 * Màn được phép chặn màn hình phải còn nguyên. Bài này bắt hướng hỏng NGƯỢC lại: dọn quá tay
 * rồi đẩy luôn một việc BUỘC PHẢI QUYẾT ĐỊNH xuống toast, tức để nó trôi qua trong 4 giây.
 */
test('những việc buộc phải quyết định VẪN chặn màn hình', () => {
  // ⚠️ ADR-069 (2026-09-06): `EraCrisisModal` và `DisasterModal` ĐÃ GỠ — khủng hoảng kỷ không còn
  // là một quyết định (hiến tế hay thử thách) mà là một nhiệm vụ mềm tự chạy theo lịch sử, và
  // hộp "mất N% tài nguyên" sau khi huỷ chỉ còn là một lời trách về một đồng tiền đã rời đường
  // chơi. Còn đúng MỘT hộp thoại buộc-phải-quyết-định: chuyển kỷ (prestige).
  for (const [flag, component] of [
    ['prestigeModalOpen', 'PrestigeModal'],
  ]) {
    assert.ok(
      new RegExp(`\\{\\s*${flag}\\s*&&\\s*<${component}`).test(APP_CODE),
      `${component} không còn mở thẳng theo ${flag} — đây là việc buộc phải quyết định, nó PHẢI chặn màn hình`,
    );
  }
  // Lên kỷ (ADR-070): không còn hộp thoại — thẻ «Kỷ nguyên mới» của chuỗi thẻ là cái kết, kiểm ở bài đầu.
});

/**
 * ADR-076: the 3.2-second «city moment» overlay is gone — a finished building is told by the ending's
 * project card (all bricks laid). The test that used to pin the overlay now pins its absence.
 */
test('no city-moment overlay stands before the reward story any more (ADR-076)', () => {
  assert.doesNotMatch(APP_CODE, /<CityGrowthMoment/, 'the growth overlay is back — the project card already tells this');
  assert.doesNotMatch(APP_CODE, /showMoment/, 'a second ending gate reappeared');
  const blocking = /const\s+blocking\s*=\s*([\s\S]*?);/.exec(APP_CODE);
  assert.ok(blocking, 'không đọc được `blocking`');
  assert.match(blocking[1], /showStory/, '`blocking` must still hold the reward story');
});

/**
 * ⚠️ LỐI VÀO TRÊN ĐIỆN THOẠI LÀ ĐIỀU KIỆN AN TOÀN CỦA ADR-061, KHÔNG PHẢI MỘT TIỆN ÍCH.
 *
 * ADR-061 bỏ hộp thoại báo cáo tuần tự bật, thay bằng một thẻ toast 4 giây cộng một CHẤM "chưa
 * xem" làm lưới an toàn. Cái chấm ấy lúc đầu chỉ có ở thanh bên desktop — mà thanh bên là
 * `hidden md:flex`. Nghĩa là trên iPhone: toast lỡ là hết, vì **nút mở báo cáo tuần chưa từng
 * tồn tại ở đó**. Cái hộp thoại tự bật không chỉ là cách báo cáo XUẤT HIỆN trên điện thoại, nó
 * là cách báo cáo TỒN TẠI.
 *
 * Nên mục "Báo cáo tuần" trong menu "Thêm" chính là thứ làm cho việc bỏ chặn màn hình an toàn.
 * Gỡ nó đi thì ADR-061 quay lại thành một hồi quy — trên đúng thiết bị Đàm dùng nhiều nhất, và
 * hoàn toàn im lặng: build xanh, lint sạch, mọi bài test khác xanh.
 */
test('báo cáo tuần có đường vào trên ĐIỆN THOẠI, không chỉ ở thanh bên desktop', () => {
  const mobileMenu = APP_CODE.slice(APP_CODE.indexOf('MOBILE_SECONDARY_TABS.map'));
  assert.ok(
    /openWeeklyReport\(\)/.test(mobileMenu),
    'menu "Thêm" trên điện thoại không còn mục mở báo cáo tuần — trên iPhone báo cáo tuần lại '
    + 'không có đường vào nào.',
  );
  // Số cột của menu ấy phải đếm cả mục vừa thêm, nếu không nó tràn hàng.
  assert.match(
    APP_CODE,
    /MOBILE_SECONDARY_TABS\.length \+ 1/,
    'số cột menu "Thêm" chưa cộng thêm mục báo cáo tuần',
  );
  // Và chấm "chưa xem" phải có ở CẢ HAI nơi — nối một chỗ quên một chỗ là hình dạng lỗi đã cắn
  // dự án nhiều lần, mà lần này chỗ bị quên lại đúng là điện thoại.
  assert.ok(
    /\{weeklyReportUnseen && \(/.test(mobileMenu),
    'mục báo cáo tuần trên điện thoại không có chấm "chưa xem"',
  );
  assert.match(APP_CODE, /attention=\{weeklyReportUnseen\}/, 'thanh bên desktop mất chấm "chưa xem"');
});
