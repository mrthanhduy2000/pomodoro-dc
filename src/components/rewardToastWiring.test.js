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
 * ⚠️ ĐÂY LÀ ĐIỀU KIỆN NGHIỆM THU CỦA CẢ THAY ĐỔI: xong một phiên thường thì màn
 * hình KHÔNG bị chặn. Cổng cũ là `{lootModalOpen && <RewardSequence />}` — mở hộp
 * thoại toàn màn hình sau MỌI phiên.
 */
test('phiên thường KHÔNG mở hộp thoại phần thưởng — chỉ lên kỷ mới mở', () => {
  assert.ok(
    !/\{\s*lootModalOpen\s*&&\s*<(RewardSequence|LootDropModal)/.test(APP_CODE),
    'hộp thoại phần thưởng lại đang mở thẳng theo `lootModalOpen` — tức mọi phiên đều chặn màn hình',
  );
  assert.ok(
    /\{\s*showLootModal\s*&&\s*<LootDropModal/.test(APP_CODE),
    'không tìm thấy cổng `showLootModal` trước `<LootDropModal>`',
  );

  // Cổng ấy phải THẬT SỰ hỏi "có lên kỷ không". Không có vế này thì `showLootModal`
  // có thể là bất cứ thứ gì, kể cả `lootModalOpen` đổi tên.
  const gate = /const\s+showLootModal\s*=\s*([^;]+);/.exec(APP_CODE);
  assert.ok(gate, 'không đọc được định nghĩa `showLootModal`');
  assert.match(
    gate[1],
    /pendingEraChanged/,
    '`showLootModal` không nhắc tới việc lên kỷ — cổng đang mở cho thứ khác',
  );
  assert.match(
    gate[1],
    /detail === 'loot'/,
    'bấm vào thẻ phải mở được hộp thoại chi tiết, nếu không thì phần thưởng phiên không còn xem lại được',
  );
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
 * Cả bốn màn được phép chặn màn hình phải còn nguyên. Bài này bắt hướng hỏng
 * NGƯỢC lại: dọn quá tay rồi đẩy luôn khủng hoảng kỷ hay thảm hoạ xuống toast,
 * tức là để một việc BUỘC PHẢI QUYẾT ĐỊNH trôi qua trong 4 giây.
 */
test('bốn việc buộc phải quyết định VẪN chặn màn hình', () => {
  for (const [flag, component] of [
    ['disasterModalOpen', 'DisasterModal'],
    ['eraCrisisModalOpen', 'EraCrisisModal'],
    ['prestigeModalOpen', 'PrestigeModal'],
  ]) {
    assert.ok(
      new RegExp(`\\{\\s*${flag}\\s*&&\\s*<${component}`).test(APP_CODE),
      `${component} không còn mở thẳng theo ${flag} — đây là việc buộc phải quyết định, nó PHẢI chặn màn hình`,
    );
  }
  // Lên kỷ: cổng nằm trong `showLootModal`, đã kiểm ở bài đầu.
  assert.match(APP_CODE, /pendingReward\?\.eraChanged/, 'không còn chỗ nào đọc `eraChanged` để biết đã lên kỷ');
});

/**
 * ⚠️ BÀI NÀY CANH MỘT HỒI QUY ĐÃ THẬT SỰ XẢY RA TRONG CHÍNH PHIÊN VIẾT RA NÓ.
 * Lễ mừng thành phố xưa nay nằm TRONG `RewardSequence`, mà `RewardSequence` chỉ
 * dựng khi hộp thoại phần thưởng bật. Bản vá đầu tiên của luật "chỉ bốn việc được
 * chặn màn hình" siết đúng cái cổng ấy — và thế là lễ mừng "vừa xây xong một công
 * trình" biến mất ở MỌI phiên thường. Không có gì đỏ lên: build xanh, lint sạch,
 * mọi bài test khác xanh, chỉ có một tính năng lặng lẽ chết.
 * Lễ mừng là một đoạn chuyển cảnh TỰ KẾT THÚC, không đòi Đàm quyết định gì, nên
 * luật kia không áp cho nó — nó phải chạy theo `lootModalOpen`, không theo cổng
 * hộp thoại.
 */
test('lễ mừng thành phố vẫn chạy sau MỌI phiên, không bị buộc vào hộp thoại', () => {
  const gate = /const\s+showMoment\s*=\s*([^;]+);/.exec(APP_CODE);
  assert.ok(gate, 'không đọc được `showMoment` — lễ mừng thành phố đã đi đâu?');
  assert.match(gate[1], /lootModalOpen/, 'lễ mừng phải bám `lootModalOpen` (mọi phiên)');
  assert.ok(
    !/showLootModal/.test(gate[1]),
    'lễ mừng đang bị buộc vào cổng hộp thoại — phiên thường sẽ mất lễ mừng trong im lặng',
  );
  assert.match(APP_CODE, /<CityGrowthMoment/, 'không còn chỗ nào dựng lễ mừng');

  // Nó che màn hình lúc chạy ⇒ phải làm đồng hồ toast dừng, nếu không 4 giây của
  // thẻ cháy hết sau lưng lễ mừng và Đàm không bao giờ thấy thẻ.
  const blocking = /const\s+blocking\s*=\s*([\s\S]*?);/.exec(APP_CODE);
  assert.ok(blocking, 'không đọc được `blocking`');
  assert.match(blocking[1], /showMoment/, '`blocking` bỏ sót lễ mừng');
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
