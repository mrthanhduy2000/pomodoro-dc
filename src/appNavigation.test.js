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
  assert.ok(
    /new Set\(inventoryNeedsAttention \? \['inventory'\] : \[\]\)/.test(APP_SOURCE),
    'Tập tab có chấm không còn suy từ `inventoryNeedsAttention` — cái chấm mất nguồn tín hiệu.',
  );
});

// ─── SAU KHI LÀM PHẲNG (2026-09-01) ──────────────────────────────────────────────────────────────

test('"Hành trang" chỉ còn MỘT hàng tab — tầng thứ hai đã bị xoá, không phải giấu đi', () => {
  // ⚠️ Ba hàng tab chồng nhau từng ăn 246px = 29,1% màn hình 390×844 trước khi hiện chữ đầu tiên,
  // và cả ba dùng CHUNG `SubTabs` nên không có gì nói hàng nào là cha. Bài này bắt đúng cái tầng
  // ấy nếu có ai dựng lại nó: hai lời gọi `<SubTabs` trong cùng một cây là hai hàng viên giống hệt
  // nhau chồng lên nhau.
  const soLoiGoi = [...APP_SOURCE.matchAll(/<SubTabs\b/g)].length;
  assert.equal(soLoiGoi, 1, `App.jsx có ${soLoiGoi} lời gọi <SubTabs>; nhiều hơn một là hàng tab lồng hàng tab.`);
  assert.ok(!APP_SOURCE.includes('const COLLECTION_TABS'), 'COLLECTION_TABS quay lại ⇒ tầng tab thứ hai quay lại.');
  assert.ok(!APP_SOURCE.includes('function CollectionView'), 'CollectionView quay lại ⇒ tầng tab thứ hai quay lại.');
});

test('tab "Lịch sử" đã xoá, và KHÔNG có thông báo nào còn trỏ tới nó', () => {
  // Nó dài 98.568px = 117 màn hình điện thoại, 4.362 con số, 0 nút bấm được, và 0 thông báo trỏ
  // tới (so với `workshop` 8 chỗ · `blueprints` 4 · `relics` 1). Cùng mảng `history` ấy đã được
  // màn Thống kê đọc và tóm tắt.
  assert.ok(!APP_SOURCE.includes('function SessionHistory'), 'SessionHistory quay lại.');
  const nguon = `${STORE_SOURCE}\n${NOTIFICATION_SOURCE}\n${APP_SOURCE}`;
  const troToi = [...nguon.matchAll(/collectionTab: '([^']+)'/g)].map((hit) => hit[1]);
  assert.ok(!troToi.includes('history'), 'Có thông báo trỏ tới tab "Lịch sử" đã bị xoá — một nút chết.');
  assert.ok(troToi.length > 0, 'Không quét ra `collectionTab` nào — regex đã lạc, bài này đang xanh rỗng.');
});

test('MỌI `collectionTab` cũ trong thông báo đã lưu vẫn tới được một màn CÓ THẬT', () => {
  // ⚠️ Bốn cái tên ấy nằm trong localStorage của Đàm từ trước khi gộp tab. `relics` là ca hiểm:
  // nó nay thuộc "Huy hiệu" chứ không phải "Công trình", nên nếu `resolveTabTarget` bỏ qua tham số
  // thứ hai thì nút cũ sẽ lặng lẽ mở SAI màn — build, lint, test đều không thấy.
  const than = APP_SOURCE.slice(APP_SOURCE.indexOf('function resolveTabTarget'));
  const than1 = than.slice(0, than.indexOf('\n}\n'));
  assert.ok(/collectionTab\s*=\s*null/.test(than1), 'resolveTabTarget phải NHẬN `collectionTab`, không thì nó mù với ca `relics`.');
  assert.ok(/'relics'[\s\S]*sub: 'achievements'/.test(than1), '`relics` phải được dịch sang tab con "achievements".');
  assert.ok(/'history'[\s\S]*tab: 'stats'/.test(than1), '`history` phải được dịch sang màn Thống kê.');
  // Và `selectTab` phải TRUYỀN nó xuống — dịch đúng mà không ai gọi thì vô nghĩa.
  assert.ok(
    /selectTab\(action\.tab, action\.collectionTab\)/.test(APP_SOURCE),
    'handleNotificationNavigate phải truyền `collectionTab` xuống `selectTab`.',
  );
});

test('không màn nào còn bảo người chơi đi sang một TAB đã bị gộp', () => {
  // ⚠️ Bản vá gộp tab TỰ TẠO RA lỗi này: màn Xưởng vẫn in "Đi sang mục Bản vẽ để mở thêm công
  // trình" trong khi Bản vẽ nay nằm ngay bên dưới cùng màn. Một câu chỉ đường tới một cái tab
  // không còn tồn tại thì tệ hơn không có câu nào — và không cổng nào bắt được nó.
  const MAN = ['BuildingWorkshop', 'BlueprintInventory', 'RelicInventory', 'Achievements', 'SkillTree'];
  for (const ten of MAN) {
    const nguon = readFileSync(join(HERE, 'components', `${ten}.jsx`), 'utf8');
    const pham = [...nguon.matchAll(/(?:sang|qua|tới|đến)\s+(?:mục|tab)\s+([^.<{]{1,20})/gi)].map((h) => h[0].trim());
    assert.deepEqual(pham, [], `${ten}.jsx còn câu chỉ đường sang một tab khác: ${pham.join(' · ')}`);
  }
});

test('bấm "Hành trang" thì rơi vào tab con CÓ VIỆC, và phép nhắm nằm ở cú bấm chứ không ở effect', () => {
  // ⚠️ Đo trước: tab con mặc định luôn là "Kỹ năng" — màn duy nhất trong ba màn thường KHÔNG có
  // nút nào bấm được (1 SP, nút rẻ nhất 2 SP, ~11 ngày nữa mới có nút đầu tiên). Mỗi lần mở túi
  // đồ là 83 con số và 0 việc làm.
  const than = APP_SOURCE.slice(APP_SOURCE.indexOf('const selectTab = ('));
  const than1 = than.slice(0, than.indexOf('\n  };'));
  assert.match(than1, /nextAction\?\.action\?\.tab/, 'selectTab phải hỏi "việc tiếp theo" khi không có tab con chỉ định.');
  assert.match(than1, /else if \(target\.tab === 'inventory'/, 'chỉ nhắm khi người gọi nói ĐÍCH DANH "inventory" — lời gọi mang sẵn tab con phải giữ nguyên đích.');

  // ⚠️ VÀ NÓ PHẢI Ở TRONG `selectTab`, KHÔNG Ở TRONG MỘT `useEffect`. Bản đầu viết bằng effect và
  // `react-hooks/set-state-in-effect` chặn lại — đúng đắn: effect ấy chạy lại mỗi lần `nextAction`
  // đổi, tức có thể giật tab dưới tay Đàm trong lúc anh đang ngồi trong Hành trang.
  // ⚠️ Phép quét này bản đầu viết `/useEffect\([^)]*\{[^}]*setInventoryTab/s` và **KHÔNG BẮT ĐƯỢC**
  // phép phá — vì `[^)]*` dừng ngay ở dấu `)` của `() =>`. Một regex sai kiểu đó cho ra một bài
  // test luôn xanh, tức đúng thứ nó sinh ra để ngăn. Nay cắt theo từng khối `useEffect(` rồi hỏi
  // trong thân của nó.
  const coEffectNham = APP_SOURCE
    .split('useEffect(')
    .slice(1)
    .some((khoi) => khoi.slice(0, khoi.indexOf('}, [') + 1).includes('setInventoryTab'));
  assert.equal(coEffectNham, false, 'phép nhắm tab quay lại trong một useEffect — nó sẽ giật tab dưới tay người dùng.');

  // Nguồn gợi ý phải là CÙNG hàm nuôi cái chấm đỏ và dòng "việc tiếp theo" ở màn Tập trung.
  assert.match(APP_SOURCE, /import useNextAction from '\.\/hooks\/useNextAction'/, 'không được dựng lại phép chọn việc lần thứ hai.');
});

test('khối "Thành tựu gần đây" đã rời màn Kỹ năng — và không còn là mã chết nằm lại', () => {
  // ⚠️ Lý do giữ nó ("nó KHÔNG có tab nào của riêng nó") chết khi ba hàng tab gộp làm một: "Huy
  // hiệu" nay là một trong BA viên cùng hàng, cách đúng một cú chạm. Đo được: con số "147" và ba
  // tên huy hiệu gần nhất xuất hiện 4/4 ở CẢ hai màn.
  const ma = readFileSync(join(HERE, 'components', 'SkillTree.jsx'), 'utf8');
  assert.ok(!/<RecentAchievements/.test(ma), 'khối "Thành tựu gần đây" quay lại màn Kỹ năng.');
  assert.ok(!/function RecentAchievements/.test(ma), 'hàm còn nằm lại mà không ai gọi — mã chết.');
});
