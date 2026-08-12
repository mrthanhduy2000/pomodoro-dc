import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CITY_GRID_SIZE,
  MAX_PROPS,
  TILE_H,
  TILE_W,
  cellToScreen,
  computeCityLayout,
  deriveProps,
  hashId,
  placeBuilding,
} from './cityLayout.js';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from './constants.js';

// Bộ 5 bản vẽ có thật của kỷ 1 (dùng id thật để test bám sát dữ liệu game).
const ERA_1 = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
const ERA_2 = BLUEPRINT_CATALOG[2].map((bp) => bp.id);

function allCells(layout) {
  return [...layout.buildings, ...layout.props];
}

// ─── 1-2. Nền tảng: hàm băm ─────────────────────────────────────────────────

test('hashId tất định: cùng chuỗi → cùng số, gọi 1000 lần không đổi', () => {
  const first = hashId('bp_hang_dong');
  for (let i = 0; i < 1000; i += 1) {
    assert.equal(hashId('bp_hang_dong'), first);
  }
  assert.notEqual(hashId('bp_hang_dong'), hashId('bp_bep_lua'));
});

test('hashId không bao giờ trả số âm hay NaN', () => {
  const inputs = ['', 'a', 'bp_hang_dong', 'ký tự tiếng Việt', '💧', 'x'.repeat(500),
    null, undefined, 0, -1, NaN, {}];
  for (const input of inputs) {
    const result = hashId(input);
    assert.ok(Number.isInteger(result), `không phải số nguyên với đầu vào ${String(input)}`);
    assert.ok(result >= 0, `số âm với đầu vào ${String(input)}`);
    assert.ok(!Number.isNaN(result), `NaN với đầu vào ${String(input)}`);
  }
});

// ─── 3-5. Ba bất biến sống còn của bảo tàng ─────────────────────────────────

test('BẤT BIẾN #1 — cùng built → bố cục giống hệt (so sánh JSON)', () => {
  const input = { built: ERA_1, levels: { [ERA_1[0]]: 2 }, era: 1, stats: { sessionCount: 30, streakLength: 4 } };
  const a = computeCityLayout(input);
  const b = computeCityLayout(input);
  const c = computeCityLayout({ ...input, built: [...ERA_1] });

  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(JSON.stringify(a), JSON.stringify(c));
});

test('BẤT BIẾN #2 — thêm công trình mới KHÔNG làm xê dịch công trình cũ', () => {
  // Kiểm mọi tiền tố: xây dần từng công trình một, nhà cũ phải đứng yên tuyệt đối.
  for (let n = 1; n < ERA_1.length; n += 1) {
    const before = computeCityLayout({ built: ERA_1.slice(0, n), era: 1, stats: { sessionCount: 10 } });
    const after  = computeCityLayout({ built: ERA_1.slice(0, n + 1), era: 1, stats: { sessionCount: 10 } });

    for (const oldBuilding of before.buildings) {
      const moved = after.buildings.find((b) => b.bpId === oldBuilding.bpId);
      assert.ok(moved, `mất công trình ${oldBuilding.bpId}`);
      assert.equal(moved.x, oldBuilding.x, `${oldBuilding.bpId} xê dịch theo trục x`);
      assert.equal(moved.y, oldBuilding.y, `${oldBuilding.bpId} xê dịch theo trục y`);
    }
  }
});

test('BẤT BIẾN #2b — thứ tự xây bất kỳ đều cho cùng vị trí (không phụ thuộc lịch sử)', () => {
  const forward = computeCityLayout({ built: ERA_1, era: 1 });
  const reversed = computeCityLayout({ built: [...ERA_1].reverse(), era: 1 });
  const shuffled = computeCityLayout({ built: [ERA_1[3], ERA_1[0], ERA_1[4], ERA_1[1], ERA_1[2]], era: 1 });

  assert.deepEqual(reversed.buildings, forward.buildings);
  assert.deepEqual(shuffled.buildings, forward.buildings);
});

test('BẤT BIẾN #3 — đảo thứ tự mảng built → toàn bộ kết quả giống hệt', () => {
  const forward = computeCityLayout({ built: ERA_2, era: 2, stats: { sessionCount: 18, streakLength: 3 } });
  const reversed = computeCityLayout({ built: [...ERA_2].reverse(), era: 2, stats: { sessionCount: 18, streakLength: 3 } });
  assert.equal(JSON.stringify(reversed), JSON.stringify(forward));
});

// ─── 6-7. Lưới ──────────────────────────────────────────────────────────────

test('không có 2 vật thể nào trùng ô (công trình lẫn cảnh vật)', () => {
  for (const sessionCount of [0, 1, 5, 23, 60, 500]) {
    const layout = computeCityLayout({ built: ERA_1, era: 1, stats: { sessionCount, streakLength: 12 } });
    const seen = new Set();
    for (const item of allCells(layout)) {
      const key = `${item.x},${item.y}`;
      assert.ok(!seen.has(key), `trùng ô ${key} khi sessionCount=${sessionCount}`);
      seen.add(key);
    }
  }
});

test('mọi toạ độ nằm trong [0, CITY_GRID_SIZE)', () => {
  const layout = computeCityLayout({ built: ERA_1, era: 1, stats: { sessionCount: 400, streakLength: 99 } });
  for (const item of [...allCells(layout), ...layout.ground]) {
    assert.ok(Number.isInteger(item.x) && item.x >= 0 && item.x < CITY_GRID_SIZE, `x xấu: ${item.x}`);
    assert.ok(Number.isInteger(item.y) && item.y >= 0 && item.y < CITY_GRID_SIZE, `y xấu: ${item.y}`);
  }
  assert.equal(layout.ground.length, CITY_GRID_SIZE * CITY_GRID_SIZE);
  assert.equal(layout.gridSize, CITY_GRID_SIZE);
});

// ─── 8-10, 13. Phòng thủ dữ liệu ────────────────────────────────────────────

test('built rỗng → isEmpty true, không ném lỗi', () => {
  const layout = computeCityLayout({ built: [], era: 5, stats: { sessionCount: 0 } });
  assert.equal(layout.isEmpty, true);
  assert.equal(layout.buildings.length, 0);
  assert.equal(layout.props.length, 0, 'chưa có công trình thì chưa có đường');
  assert.equal(layout.ground.length, CITY_GRID_SIZE * CITY_GRID_SIZE);
});

test('id rác / id sai kỷ → bỏ qua, không ném lỗi', () => {
  const layout = computeCityLayout({
    built: ['bp_khong_ton_tai', '', null, undefined, 42, ERA_2[0], ERA_1[0], ERA_1[0]],
    era: 1,
  });
  assert.deepEqual(layout.buildings.map((b) => b.bpId), [ERA_1[0]], 'chỉ giữ id thật, đúng kỷ, không trùng');
  assert.equal(layout.isEmpty, false);
});

test('levels thiếu hoặc xấu → mặc định cấp 1, luôn nằm trong [1,3]', () => {
  const layout = computeCityLayout({
    built: ERA_1,
    levels: { [ERA_1[0]]: 3, [ERA_1[1]]: 99, [ERA_1[2]]: 0, [ERA_1[3]]: 'hai' },
    era: 1,
  });
  const level = (bpId) => layout.buildings.find((b) => b.bpId === bpId).level;
  assert.equal(level(ERA_1[0]), 3);
  assert.equal(level(ERA_1[1]), 3, 'cắt trần về 3');
  assert.equal(level(ERA_1[2]), 1, 'cắt sàn về 1');
  assert.equal(level(ERA_1[3]), 1, 'giá trị không phải số → 1');
  assert.equal(level(ERA_1[4]), 1, 'thiếu hẳn → 1');
});

test('đầu vào thiếu/hỏng hoàn toàn → không ném lỗi', () => {
  assert.doesNotThrow(() => computeCityLayout());
  assert.doesNotThrow(() => computeCityLayout({}));
  assert.doesNotThrow(() => computeCityLayout({ built: null, era: null, stats: undefined }));
  assert.doesNotThrow(() => computeCityLayout({ built: ERA_1, era: 1, stats: { sessionCount: NaN, streakLength: -5 } }));

  const layout = computeCityLayout({ built: ERA_1, era: 1, stats: undefined });
  assert.equal(layout.era, 1);
  assert.equal(layout.buildings.length, 5);
});

// ─── 11. Chiều sâu isometric ────────────────────────────────────────────────

test('buildings và props đã sắp xếp theo (x + y) tăng dần — chiều sâu isometric', () => {
  const layout = computeCityLayout({ built: ERA_1, era: 1, stats: { sessionCount: 40, streakLength: 6 } });
  for (const list of [layout.buildings, layout.props]) {
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1].x + list[i - 1].y;
      const curr = list[i].x + list[i].y;
      assert.ok(prev <= curr, `sai thứ tự chiều sâu tại vị trí ${i}: ${prev} > ${curr}`);
    }
  }
});

test('cellToScreen khớp công thức isometric 2:1', () => {
  assert.deepEqual(cellToScreen(0, 0), { screenX: 0, screenY: 0 });
  assert.deepEqual(cellToScreen(1, 0), { screenX: TILE_W / 2, screenY: TILE_H / 2 });
  assert.deepEqual(cellToScreen(0, 1), { screenX: -TILE_W / 2, screenY: TILE_H / 2 });
  assert.deepEqual(cellToScreen(3, 3), { screenX: 0, screenY: 3 * TILE_H });
});

// ─── 12. Trần cảnh vật ──────────────────────────────────────────────────────

test('deriveProps không bao giờ vượt MAX_PROPS dù số liệu lớn đến đâu', () => {
  for (const sessionCount of [0, 1, 10, 100, 5000, 1e9]) {
    const props = deriveProps({ era: 1, buildingCount: 5, sessionCount, streakLength: 5000 });
    assert.ok(props.length <= MAX_PROPS, `vượt trần với sessionCount=${sessionCount}: ${props.length}`);
  }
  // ngân sách DOM: 144 nền + 5 nhà + 48 cảnh vật = 197 < 200
  const layout = computeCityLayout({ built: ERA_1, era: 1, stats: { sessionCount: 1e6, streakLength: 1e6 } });
  const domBudget = layout.ground.length + layout.buildings.length + layout.props.length;
  assert.ok(domBudget <= 200, `ngân sách DOM vượt 200: ${domBudget}`);
});

test('cảnh vật đông dần theo số phiên (thành phố lớn lên)', () => {
  const few  = deriveProps({ era: 1, buildingCount: 2, sessionCount: 2,  streakLength: 0 });
  const many = deriveProps({ era: 1, buildingCount: 2, sessionCount: 40, streakLength: 0 });
  assert.ok(many.length > few.length, 'số phiên tăng mà cảnh vật không tăng');
});

test('deriveProps tránh các ô đã bị công trình chiếm', () => {
  const occupied = new Set(['0,0', '1,1', '4,4', '5,5', '11,11']);
  const props = deriveProps({ era: 3, buildingCount: 5, sessionCount: 80, streakLength: 10, occupied });
  for (const prop of props) {
    assert.ok(!occupied.has(`${prop.x},${prop.y}`), `cảnh vật đè lên công trình tại ${prop.x},${prop.y}`);
  }
});

test('deriveProps chỉ sinh các loại cảnh vật đã khai báo', () => {
  const allowed = new Set(['tree', 'rock', 'lamp', 'road', 'water', 'field']);
  const props = deriveProps({ era: 7, buildingCount: 4, sessionCount: 120, streakLength: 20 });
  for (const prop of props) {
    assert.ok(allowed.has(prop.kind), `loại lạ: ${prop.kind}`);
    assert.ok(Number.isInteger(prop.variant) && prop.variant >= 0, `variant xấu: ${prop.variant}`);
  }
});

// ─── placeBuilding trực tiếp ────────────────────────────────────────────────

test('placeBuilding tất định và tôn trọng ô đã bị chiếm', () => {
  const first = placeBuilding('bp_hang_dong');
  assert.deepEqual(placeBuilding('bp_hang_dong'), first);
  assert.deepEqual(placeBuilding('bp_hang_dong', new Set()), first);

  const blocked = placeBuilding('bp_hang_dong', new Set([`${first.x},${first.y}`]));
  assert.notDeepEqual(blocked, first, 'ô đã bị chiếm mà vẫn trả về ô đó');
  assert.ok(blocked.x >= 0 && blocked.x < CITY_GRID_SIZE && blocked.y >= 0 && blocked.y < CITY_GRID_SIZE);
});

test('placeBuilding xử lý id lạ mà không ném lỗi', () => {
  for (const bad of ['bp_khong_co_that', '', null, undefined, 123]) {
    const cell = placeBuilding(bad);
    assert.ok(cell.x >= 0 && cell.x < CITY_GRID_SIZE, `x xấu với ${String(bad)}`);
    assert.ok(cell.y >= 0 && cell.y < CITY_GRID_SIZE, `y xấu với ${String(bad)}`);
  }
});

// ─── Bao phủ toàn bộ 15 kỷ ──────────────────────────────────────────────────

test('cả 15 kỷ đều dựng được thành phố đầy đủ, không va chạm, không lỗi', () => {
  for (let era = 1; era <= 15; era += 1) {
    const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    const layout = computeCityLayout({ built, era, stats: { sessionCount: 25, streakLength: 5 } });

    assert.equal(layout.buildings.length, 5, `kỷ ${era} thiếu công trình`);
    assert.equal(layout.era, era);
    assert.equal(layout.isEmpty, false);

    const seen = new Set();
    for (const item of allCells(layout)) {
      const key = `${item.x},${item.y}`;
      assert.ok(!seen.has(key), `kỷ ${era} trùng ô ${key}`);
      seen.add(key);
    }
    for (const building of layout.buildings) {
      assert.ok(typeof building.label === 'string' && building.label.length > 0, `kỷ ${era} thiếu nhãn`);
      assert.ok(typeof building.icon === 'string' && building.icon.length > 0, `kỷ ${era} thiếu icon`);
      assert.ok(['common', 'rare', 'epic'].includes(building.rarity), `kỷ ${era} rarity lạ`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GIÀN GIÁO — công trình ĐANG XÂY (Phase 3H)
//
// Vì sao đáng có cả một cụm test: trước tính năng này, thành phố chỉ đổi khi một công trình HOÀN
// THÀNH — mà rẻ nhất cũng 4 phiên, đắt nhất 11 phiên. Đàm có thể làm việc cả tuần mà thành phố
// không nhúc nhích một pixel. Giàn giáo là thứ trả phần thưởng nhìn thấy được về nhịp MỖI PHIÊN.
// ─────────────────────────────────────────────────────────────────────────────

/** Vài bpId có thật của kỷ 6, kèm số phiên cần để xây xong. */
const ERA6 = BLUEPRINT_CATALOG[6].map((bp) => bp.id);
const totalFor = (bpId) => BUILDING_EFFECTS[bpId].sessionsToComplete;

test('GIÀN GIÁO — KHÔNG truyền `pending` ⇒ bố cục giống hệt bản cũ TỪNG BYTE', () => {
  // ⚠️ Đây là bài quan trọng nhất cụm, và nó có từ trước khi viết dòng code nào (rủi ro #31 của kế
  // hoạch). `computeCityLayout` là hàm mà TOÀN BỘ vị trí mọi thứ trong thành phố suy ra từ đó, và
  // ADR-007 hứa "bảo tàng bất động": thành phố kỷ cũ phải trông y hệt mãi mãi. Thêm một tham số
  // vào hàm này mà lỡ làm xê dịch dù một cái cây thì lời hứa đó vỡ trong im lặng — không có màn
  // hình nào báo lỗi, chỉ là những thành phố cũ lặng lẽ khác đi.
  const args = { built: ERA6, levels: {}, era: 6, stats: { sessionCount: 40, streakLength: 9 } };
  const before = computeCityLayout(args);
  for (const pending of [undefined, null, [], 'rác', 42, {}]) {
    const after = computeCityLayout({ ...args, pending });
    assert.equal(
      JSON.stringify({ ...after, scaffolds: undefined }),
      JSON.stringify({ ...before, scaffolds: undefined }),
      `pending = ${JSON.stringify(pending)} làm xê dịch bố cục`,
    );
    assert.deepEqual(after.scaffolds, [], 'không có gì đang xây mà vẫn ra giàn giáo');
  }
});

test('GIÀN GIÁO — tiến độ đi lên sau mỗi phiên, và luôn nằm trong [0,1]', () => {
  const bpId = ERA6[4];                       // công trình đắt nhất kỷ 6 (9 phiên) — thấy rõ nhất
  const total = totalFor(bpId);
  const progressAt = (sessionsRemaining) => computeCityLayout({
    built: [], era: 6, pending: [{ bpId, sessionsRemaining }],
  }).scaffolds[0].progress;

  assert.equal(progressAt(total), 0, 'vừa đặt móng mà đã có tiến độ');
  assert.equal(progressAt(1), (total - 1) / total);

  let prev = -1;
  for (let remaining = total; remaining >= 1; remaining -= 1) {
    const now = progressAt(remaining);
    assert.ok(now > prev, `còn ${remaining} phiên: tiến độ không tăng (${now} ≤ ${prev})`);
    assert.ok(now >= 0 && now <= 1, `tiến độ ${now} ngoài [0,1]`);
    prev = now;
  }

  // Dữ liệu lệch (còn nhiều phiên hơn cả tổng, hoặc số âm) vẫn phải ra giá trị dùng được — cái này
  // đi thẳng vào hình học, một `NaN` ở đây là một công trình cao vô hạn hoặc biến mất.
  for (const remaining of [total + 99, -5, NaN, undefined, 'ba']) {
    const p = computeCityLayout({ built: [], era: 6, pending: [{ bpId, sessionsRemaining: remaining }] })
      .scaffolds[0].progress;
    assert.ok(Number.isFinite(p) && p >= 0 && p <= 1, `sessionsRemaining=${remaining} → tiến độ ${p}`);
  }
});

test('GIÀN GIÁO — không bao giờ chồng lên công trình, cảnh vật hay giàn giáo khác', () => {
  // Cây mọc giữa công trường, hay hai giàn giáo lồng vào nhau, là loại lỗi chỉ lộ ra khi nhìn tận
  // mắt đúng cái ô đó — mà `deriveProps` thì né theo `occupied`, nên thứ tự đặt là chỗ dễ sai.
  const layout = computeCityLayout({
    built: ERA6.slice(0, 2),
    era: 6,
    stats: { sessionCount: 60, streakLength: 12 },
    pending: ERA6.slice(2).map((bpId, i) => ({ bpId, sessionsRemaining: i + 1 })),
  });

  assert.equal(layout.scaffolds.length, 3, 'thiếu giàn giáo cho công trình đang xây');
  const cells = [...layout.buildings, ...layout.props, ...layout.scaffolds].map((o) => `${o.x},${o.y}`);
  assert.equal(new Set(cells).size, cells.length, 'có ô bị hai vật thể cùng chiếm');

  for (const s of layout.scaffolds) {
    assert.ok(s.x >= 0 && s.x < CITY_GRID_SIZE && s.y >= 0 && s.y < CITY_GRID_SIZE,
      `giàn giáo ${s.bpId} ra ngoài lưới`);
    assert.equal(typeof s.label, 'string');
  }
});

test('GIÀN GIÁO — bỏ qua bpId lạ, khác kỷ, trùng nhau, và ĐÃ XÂY XONG', () => {
  const built = [ERA6[0]];
  const layout = computeCityLayout({
    built,
    era: 6,
    pending: [
      { bpId: ERA6[0], sessionsRemaining: 2 },     // đã xây xong rồi → không thể còn giàn giáo
      { bpId: ERA6[1], sessionsRemaining: 2 },
      { bpId: ERA6[1], sessionsRemaining: 3 },     // trùng
      { bpId: BLUEPRINT_CATALOG[9][0].id, sessionsRemaining: 2 },  // khác kỷ
      { bpId: 'bp_không_có_thật', sessionsRemaining: 2 },
      null, undefined, {},
    ],
  });
  assert.deepEqual(layout.scaffolds.map((s) => s.bpId), [ERA6[1]]);

  // ⚠️ "Đã xây xong" là ca xảy ra THẬT, không phải phòng xa: ngay sau phiên làm công trình hoàn
  // thành, có một nhịp mà `buildings` đã có id đó còn `craftingQueue` chưa kịp dọn. Vẽ cả hai thì
  // căn nhà mới toanh mọc lên trong lòng một bộ giàn giáo — đúng lúc đáng ăn mừng nhất.
});

test('GIÀN GIÁO — bãi đất chỉ có công trình đang xây vẫn tính là TRỐNG', () => {
  // `CityBackdrop` dựa vào `isEmpty` để quyết định có vẽ lớp nền ở trang chủ không. Bốn cái cọc gỗ
  // sau lưng đồng hồ đếm ngược thì đọc ra "lỗi hiển thị", không đọc ra "thành phố của bạn".
  const layout = computeCityLayout({
    built: [], era: 6, pending: [{ bpId: ERA6[0], sessionsRemaining: 3 }],
  });
  assert.equal(layout.isEmpty, true);
  assert.equal(layout.scaffolds.length, 1, 'vẫn phải dựng giàn giáo — chỉ là không tính vào "có gì"');
});

test('GIÀN GIÁO — mang theo SỐ PHIÊN CÒN LẠI, không chỉ tỉ lệ phần trăm', () => {
  // ⚠️ Màn hình cần nói được "còn 2 phiên nữa" — một con số Đàm hành động được NGAY HÔM NAY — chứ
  // không phải "đã xong 67%", thứ nghe thì chính xác mà chẳng bảo anh phải làm gì. Tính ở engine
  // để tab Thành Phố và lớp nền trang chủ không thể nói hai con số khác nhau cho cùng một công
  // trình.
  const bpId = ERA6[2];
  const total = totalFor(bpId);
  const [s] = computeCityLayout({
    built: [], era: 6, pending: [{ bpId, sessionsRemaining: 2 }],
  }).scaffolds;

  assert.equal(s.remaining, 2);
  assert.equal(s.total, total);
  assert.equal(typeof s.icon, 'string', 'thiếu icon ⇒ danh sách "Đang xây" mất biểu tượng');

  // Dữ liệu lệch không được rò ra màn hình dưới dạng số vô nghĩa ("còn 99 phiên" khi tổng có 6,
  // hay "còn -3 phiên"). Kẹp ở engine, đúng chỗ mọi màn hình cùng đi qua.
  const clamped = (sessionsRemaining) => computeCityLayout({
    built: [], era: 6, pending: [{ bpId, sessionsRemaining }],
  }).scaffolds[0].remaining;
  assert.equal(clamped(total + 99), total, 'còn nhiều phiên hơn cả tổng');
  assert.equal(clamped(-4), 0, 'số phiên còn lại âm');
  assert.equal(clamped('ba'), 0, 'số phiên còn lại là chuỗi');
});

test('GIÀN GIÁO — mang theo PHẦN THƯỞNG sẽ mở khoá, để "còn 2 phiên" có nghĩa', () => {
  // "Còn 2 phiên" trả lời được CÒN BAO XA. Không có dòng này thì Đàm vẫn không biết ĐI TỚI ĐÓ ĐỂ
  // LÀM GÌ — và một thanh tiến độ không nói phần thưởng thì chỉ là một thanh tiến độ.
  //
  // Bài này cũng khoá luôn một thứ dễ vỡ âm thầm: nếu ai đó đổi `perk.label` thành `perk.name`
  // trong `constants.js`, `reward` sẽ lặng lẽ thành `null` ở CẢ 75 công trình mà không bài test
  // nào kêu — dòng "Mở khoá:" biến mất khỏi màn hình và không ai biết vì sao.
  let seen = 0;
  for (let era = 1; era <= 15; era += 1) {
    for (const bp of BLUEPRINT_CATALOG[era]) {
      const [s] = computeCityLayout({
        built: [], era, pending: [{ bpId: bp.id, sessionsRemaining: 1 }],
      }).scaffolds;
      assert.ok(s, `kỷ ${era} · ${bp.id} không dựng được giàn giáo`);
      assert.equal(typeof s.reward, 'string', `kỷ ${era} · ${bp.id} thiếu nhãn phần thưởng`);
      assert.ok(s.reward.length > 0 && s.reward.length <= 40,
        `nhãn phần thưởng của ${bp.id} dài ${s.reward.length} ký tự — một dòng danh sách sẽ tràn`);
      seen += 1;
    }
  }
  assert.equal(seen, 75, 'phải quét đủ 75 công trình của 15 kỷ');
});

test('GIÀN GIÁO — dữ liệu lạ thì reward là null chứ KHÔNG ném lỗi', () => {
  // Bản vẽ có thật nhưng chưa khai `BUILDING_EFFECTS` (hoặc khai thiếu `perk`) là chuyện có thể
  // xảy ra khi thêm kỷ mới. Lúc đó thà mất một dòng chữ còn hơn vỡ cả màn hình Thành Phố.
  const layout = computeCityLayout({
    built: [], era: 6, pending: [{ bpId: ERA6[0], sessionsRemaining: 1 }, { bpId: 'bp_khong_ton_tai' }],
  });
  assert.equal(layout.scaffolds.length, 1, 'bản vẽ không tồn tại phải bị bỏ, không được dựng giàn giáo');
  assert.ok('reward' in layout.scaffolds[0], 'trường reward phải luôn có mặt');
});
