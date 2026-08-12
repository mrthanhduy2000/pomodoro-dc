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
import { BLUEPRINT_CATALOG } from './constants.js';

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
