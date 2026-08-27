import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ĐIỀU HƯỚNG CHÍNH — bài test đọc THẲNG mã nguồn `App.jsx`.
 *
 * Vì sao phải là một bài test chứ không phải một dòng chú thích: cả ba lời hứa dưới đây là những
 * con số ĐẾM ĐƯỢC ("đúng 5 mục ở thanh bên", "4 nút cộng nút Thêm trên iPhone", "3 tab con"), và
 * cả ba đều gãy TRONG IM LẶNG — thêm một mục thứ sáu vào `DESKTOP_TABS` thì build xanh, lint
 * sạch, app vẫn chạy, chỉ có thanh bên dài ra. Không ai đếm lại thanh điều hướng sau mỗi lần thêm
 * màn hình; máy thì có.
 *
 * Đọc mã nguồn chứ không import: `App.jsx` kéo theo cả React, framer-motion, three.js và toàn bộ
 * store — nạp nó trong `node --test` là dựng nửa cái app để đếm bảy dòng dữ liệu.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_SOURCE = readFileSync(join(HERE, 'App.jsx'), 'utf8');
const STORE_SOURCE = readFileSync(join(HERE, 'store', 'gameStore.js'), 'utf8');
const NOTIFICATION_SOURCE = readFileSync(join(HERE, 'components', 'NotificationCenter.jsx'), 'utf8');

/** Cắt lấy đúng thân của một mảng hằng số cấp module: `const TÊN = [ … ];` */
function readArrayBody(source, name) {
  const opener = `const ${name} = [`;
  const start = source.indexOf(opener);
  assert.notEqual(start, -1, `Không tìm thấy \`${name}\` trong App.jsx — mảng bị đổi tên hay bị xoá?`);
  const end = source.indexOf('\n];', start);
  assert.notEqual(end, -1, `\`${name}\` không đóng bằng \`\\n];\` — phép cắt dưới đây đang đọc nhầm phạm vi.`);
  return source.slice(start + opener.length, end);
}

/** Danh sách `id` theo ĐÚNG THỨ TỰ khai báo — thứ tự là một phần của lời hứa, không chỉ số lượng. */
function readTabIds(source, name) {
  return [...readArrayBody(source, name).matchAll(/\bid: '([^']+)'/g)].map((match) => match[1]);
}

/** Mọi id nằm trong một mảng chuỗi cấp module: `const TÊN = ['a', 'b'];` */
function readIdList(source, name) {
  const match = source.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`));
  assert.ok(match, `Không tìm thấy \`${name}\` trong App.jsx.`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((hit) => hit[1]);
}

const DESKTOP_IDS = readTabIds(APP_SOURCE, 'DESKTOP_TABS');
const MOBILE_IDS = readTabIds(APP_SOURCE, 'MOBILE_TABS');
const MOBILE_PRIMARY_IDS = readIdList(APP_SOURCE, 'MOBILE_PRIMARY_IDS');
const INVENTORY_SUB_IDS = readTabIds(APP_SOURCE, 'INVENTORY_TABS');

test('thanh bên desktop có ĐÚNG 5 mục, đúng thứ tự', () => {
  assert.deepEqual(DESKTOP_IDS, ['focus', 'inventory', 'city', 'stats', 'settings']);
});

test('thanh dưới iPhone có ĐÚNG 4 nút chính, phần còn lại nằm sau nút "Thêm"', () => {
  assert.equal(MOBILE_PRIMARY_IDS.length, 4, `Thanh dưới iPhone phải có đúng 4 nút chính (đang có ${MOBILE_PRIMARY_IDS.length}); nút thứ 5 luôn là "Thêm".`);

  for (const id of MOBILE_PRIMARY_IDS) {
    assert.ok(MOBILE_IDS.includes(id), `\`MOBILE_PRIMARY_IDS\` gọi tên "${id}" mà \`MOBILE_TABS\` không có mục ấy — nút sẽ biến mất trong im lặng.`);
  }

  const secondary = MOBILE_IDS.filter((id) => !MOBILE_PRIMARY_IDS.includes(id));
  assert.ok(secondary.length > 0, 'Không còn mục phụ nào thì nút "Thêm" mở ra một hộp rỗng.');
  assert.ok(
    APP_SOURCE.includes('aria-label="Thêm mục"'),
    'Mất nút "Thêm" thì mọi mục phụ không còn đường nào vào.',
  );
});

test('"Hành trang" có đúng 3 tab con, và GIỮ NGUYÊN id của ba màn cũ', () => {
  // ⚠️ Đây là bài test đắt giá nhất file: gộp tab là việc GOM NHÓM, không phải xoá màn. Ba id này
  // còn nằm trong thông báo ĐÃ LƯU ở localStorage của Đàm — đổi chúng thì thông báo cũ bấm vào
  // không đi đâu cả, và không có gì đỏ lên.
  assert.deepEqual(INVENTORY_SUB_IDS, ['skills', 'collection', 'achievements']);
});

test('ba màn cũ KHÔNG còn là mục điều hướng chính ở cả hai khung', () => {
  for (const id of INVENTORY_SUB_IDS) {
    assert.ok(!DESKTOP_IDS.includes(id), `"${id}" vừa là tab con của Hành trang vừa là mục riêng ở thanh bên — hai đường vào cùng một màn.`);
    assert.ok(!MOBILE_IDS.includes(id), `"${id}" vừa là tab con của Hành trang vừa là mục riêng ở thanh dưới.`);
  }
});

test('MỌI đích điều hướng mà thông báo trỏ tới đều còn tới được', () => {
  // Thông báo mang sẵn `action: { tab: '…' }` và chúng được LƯU LẠI. Một id không còn ai nhận là
  // một nút chết — thứ mà cả build, lint lẫn mắt đều không thấy. Bài này quét CẢ HAI nguồn sinh ra
  // thông báo, nên nó không già đi khi có người thêm loại thông báo mới.
  const targets = new Set(
    [...`${STORE_SOURCE}\n${NOTIFICATION_SOURCE}`.matchAll(/\btab: '([^']+)'/g)].map((hit) => hit[1]),
  );
  assert.ok(targets.size > 0, 'Không quét ra đích nào — regex đã lạc, bài test này đang xanh rỗng.');

  const reachable = new Set([...DESKTOP_IDS, ...MOBILE_IDS, ...INVENTORY_SUB_IDS]);
  for (const target of targets) {
    assert.ok(
      reachable.has(target),
      `Thông báo trỏ tới tab "${target}" mà điều hướng không còn nhận id ấy. Đừng sửa thông báo — hãy dạy \`resolveTabTarget\` dịch id cũ, vì thông báo cũ đã nằm trong localStorage của Đàm rồi.`,
    );
  }

  // Và id cũ phải đi qua đúng cái cửa dịch, chứ không phải trùng tên may mắn ở đâu đó.
  assert.ok(
    /function resolveTabTarget\([\s\S]*?INVENTORY_SUB_IDS\.includes\(tab\)[\s\S]*?tab: 'inventory'/.test(APP_SOURCE),
    '`resolveTabTarget` không còn dịch id tab con sang tab "inventory" — `selectTab(\'achievements\')` sẽ đặt `activeTab` thành một giá trị không màn nào nhận, và màn hình trắng.',
  );
});

test('chấm "có việc cần xem" được nối ở CẢ hai thanh điều hướng', () => {
  // Nối một chỗ quên một chỗ là hình dạng lỗi đã cắn dự án nhiều lần: desktop có chấm, iPhone
  // không — mà iPhone mới là chỗ Đàm dùng nhiều nhất.
  assert.ok(
    /attentionTabIds=\{attentionTabIds\}/.test(APP_SOURCE),
    'Thanh bên desktop không còn nhận `attentionTabIds` — chấm chú ý tắt câm ở desktop.',
  );
  assert.ok(
    /attentionTabIds\?\.has\(tab\.id\)/.test(APP_SOURCE),
    'Thanh bên desktop nhận `attentionTabIds` nhưng không hỏi tới nó.',
  );
  assert.ok(
    /attentionTabIds\.has\(tab\.id\)/.test(APP_SOURCE),
    'Thanh dưới iPhone không hỏi `attentionTabIds` — chấm chú ý tắt câm trên điện thoại.',
  );
  // ⚠️ HỎI NGUỒN TÍN HIỆU, KHÔNG HỎI HÌNH DẠNG MÃ (sửa 2026-08-27 tối, ADR-061).
  // Bản đầu khớp nguyên văn `new Set(inventoryNeedsAttention ? […] : [])`, nên nó ĐỎ ngay khi cái
  // tập ấy nhận thêm nguồn thứ hai (chấm "báo cáo tuần chưa xem") — mã hoàn toàn đúng, chỉ đổi
  // cách viết. Một bài test khoá cách viết thì nó chặn cả những thay đổi ĐÚNG, và người sửa sẽ
  // học được bài học sai: bóp mã cho vừa regex. Nay nó hỏi đúng điều chú thích trên tuyên bố.
  assert.ok(
    /inventoryNeedsAttention \? \['inventory'\] : \[\]/.test(APP_SOURCE),
    'Tập tab có chấm không còn suy từ `inventoryNeedsAttention` — cái chấm mất nguồn tín hiệu.',
  );
  assert.ok(
    /weeklyReportUnread \? \['weeklyReport'\] : \[\]/.test(APP_SOURCE),
    'Tập tab có chấm không còn suy từ `weeklyReportUnread` — báo cáo tuần mất tín hiệu DUY NHẤT '
    + 'của nó, vì từ ADR-061 nó không tự bật hộp thoại nữa.',
  );
});
