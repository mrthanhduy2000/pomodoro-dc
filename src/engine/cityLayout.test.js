import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CITY_GRID_SIZE,
  MAX_PROPS,
  MAX_SCATTER_PROPS,
  TILE_H,
  TILE_W,
  ROAD_CELL_COUNT,
  cellToScreen,
  computeCityLayout,
  deriveProps,
  describeRoadCell,
  hashId,
  placeBuilding,
} from './cityLayout.js';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from './constants.js';
import { PROP_KINDS } from './city3d/propSpec.js';

// Bộ 5 bản vẽ có thật của kỷ 1 (dùng id thật để test bám sát dữ liệu game).
const ERA_1 = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
/** Số công trình tối đa hiện cùng lúc trong một kỷ — đếm từ dữ liệu thật, không viết cứng số 5. */
const BUILDINGS_PER_ERA = BLUEPRINT_CATALOG[1].length;
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
  // ⚠️ NGÂN SÁCH DOM — SUY RA, KHÔNG VIẾT CỨNG (đổi 2026-08-14, Phase 6C).
  // Con số này canh **bộ vẽ 2D dự phòng** (`render2d/`), nơi mỗi phần tử là một nút SVG thật.
  // Nó đã phải nới HAI lần vì cùng một lý do — 200 (mạng đường dấu cộng 23 ô) → 230 (mạng lưới 44
  // ô) → và lần này vành đai đưa đường lên 80. Ba lần cùng một hình dạng thì đó không còn là sự
  // trùng hợp: **một hằng số nghiệm thu chép tay từ các hằng số khác thì chắc chắn sẽ trôi khỏi
  // chúng.** Nay nó tính thẳng từ nguồn, nên lần sau ai thêm một trục đường, bài test tự đi theo
  // và chỉ đỏ khi có lỗi THẬT (một tầng vượt trần của chính nó).
  // Vì sao nới là ĐÚNG chứ không phải cho vừa ý: phần tăng thêm nằm trọn ở ô ĐƯỜNG — đa giác
  // phẳng, không viền, rẻ nhất trong cả cảnh; ở bộ vẽ 3D chúng gộp vào đúng MỘT `InstancedMesh`,
  // không thêm một lệnh vẽ nào. Số cảnh vật KHỐI (thứ đắt thật) vẫn bị siết ở 34, không nhúc nhích.
  const maxDom = CITY_GRID_SIZE * CITY_GRID_SIZE + BUILDINGS_PER_ERA + MAX_PROPS;
  const layout = computeCityLayout({ built: ERA_1, era: 1, stats: { sessionCount: 1e6, streakLength: 1e6 } });
  const domBudget = layout.ground.length + layout.buildings.length + layout.props.length;
  assert.ok(domBudget <= maxDom, `ngân sách DOM vượt ${maxDom}: ${domBudget}`);
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

test('deriveProps chỉ sinh các loại cảnh vật mà BỘ VẼ dựng được', () => {
  // ⚠️ HỎI THẲNG `PROP_KINDS` CỦA BỘ VẼ, KHÔNG CHÉP LẠI MỘT DANH SÁCH THỨ BA (sửa ở Phase 8D).
  // Bản cũ viết tay `['tree','rock','lamp','road','water','field']`, tức cùng một luật ("bố cục
  // và bộ vẽ phải biết cùng một bộ loại") được phát biểu ở BA chỗ. Thêm loại `bush` làm bài này
  // đỏ — đúng ra thì nó phải đỏ khi hai bên LỆCH nhau, chứ không phải khi cả hai bên cùng thêm
  // đúng một thứ. Nay nó so hai bên thật với nhau: `deriveProps` sinh ra gì thì `buildPropSpec`
  // phải dựng được cái đó, cộng `road` (do chính tầng nền vẽ, không đi qua `buildPropSpec`).
  const allowed = new Set([...PROP_KINDS, 'road']);
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

// ─── 13. MẠNG ĐƯỜNG ─────────────────────────────────────────────────────────

test('MẠNG ĐƯỜNG là một mạng lưới, không phải một dấu cộng', () => {
  // Đàm 2026-08-14: *"đường đi cũng nên phức tạp hơn"*. Trước đó cả thành phố chỉ có cột x=4 và
  // hàng y=4 — 23 ô trên lưới 144 ô, tức hai con đường mòn cắt nhau giữa đồng.
  const props = deriveProps({ era: 1, buildingCount: 5, sessionCount: 1e6, streakLength: 100 });
  const roads = props.filter((p) => p.kind === 'road');

  // (a) ĐỦ NHIỀU. 40 là hàng rào đặt dưới giá trị thật (44 trừ vài ô bị công trình chiếm) và trên
  //     hẳn vùng hỏng (23 của mạng cũ).
  assert.ok(roads.length >= 40,
    `chỉ có ${roads.length} ô đường — mạng cũ đã có 23, thêm chừng này thì mắt không nhận ra`);

  // (b) VÀ ĐỦ RỘNG THEO CẢ HAI CHIỀU. Vế (a) một mình vẫn xanh nếu ai đó kéo dài một con đường
  //     duy nhất; thứ làm nên "mạng lưới" là có nhiều đường SONG SONG cắt nhau.
  const cols = new Set(roads.map((r) => r.x));
  const rows = new Set(roads.map((r) => r.y));
  const fullCols = [...cols].filter((x) => roads.filter((r) => r.x === x).length >= 10);
  const fullRows = [...rows].filter((y) => roads.filter((r) => r.y === y).length >= 10);
  assert.ok(fullCols.length >= 2 && fullRows.length >= 2,
    `chỉ có ${fullCols.length} trục dọc và ${fullRows.length} trục ngang chạy suốt — `
    + 'chưa chia được thành phố thành các ô phố');

  // (c) BA HẠNG ĐƯỜNG phải cùng có mặt. `variant` không phải nhãn trang trí: bộ vẽ 3D đọc nó để
  //     quyết bề rộng mặt đường (`LANE_WIDTH` trong `sceneGraph.js`). Nếu mọi ô cùng một hạng thì
  //     thêm bao nhiêu đường cũng chỉ ra một tấm lưới đều tăm tắp.
  const variants = new Set(roads.map((r) => r.variant));
  for (const v of [0, 1, 2]) {
    assert.ok(variants.has(v), `thiếu hẳn hạng đường ${v} ⇒ mất thứ bậc đại lộ ↔ ngõ phố`);
  }

  // (d) KHÔNG ô đường nào đè lên công trình.
  const layout = computeCityLayout({ built: ERA_1, era: 1, stats: { sessionCount: 1e6, streakLength: 100 } });
  const houses = new Set(layout.buildings.map((b) => `${b.x},${b.y}`));
  for (const road of layout.props.filter((p) => p.kind === 'road')) {
    assert.ok(!houses.has(`${road.x},${road.y}`), `ô đường (${road.x},${road.y}) đè lên công trình`);
  }
});

test('VÀNH ĐAI mở SAU toàn bộ mạng cũ — thành phố Đàm đang có không được tự sắp xếp lại', () => {
  // ⚠️ ĐÂY LÀ BÀI TEST QUAN TRỌNG NHẤT CỦA PHASE 6C, và nó canh một thứ **không nhìn thấy được
  // trong ảnh chụp**: tính TƯƠNG THÍCH NGƯỢC của một thành phố đang chạy thật.
  // `ROAD_CELLS` xếp theo khoảng cách tới tâm. Nếu vành đai chỉ được thả vào rồi để phép xếp đó
  // lo, thì ô giữa cạnh viền `(0,5)` (cách tâm 6) sẽ CHEN LÊN TRƯỚC đoạn cuối đại lộ `(4,11)`
  // (cách tâm 7) — nghĩa là với một người đã chơi tới phiên 30, thứ tự 30 ô đường của họ đổi hẳn
  // và thành phố **tự sắp xếp lại** sau một lần deploy. Không có gì đỏ lên, không ai mất dữ liệu,
  // chỉ là một buổi sáng mở app thấy phố mình khác đi.
  // Trường `tier` chặn đúng điều đó. Bài này khoá nó bằng cách: 44 ô đầu tiên (đúng bằng cỡ mạng
  // cũ) phải KHÔNG có ô nào nằm trên viền — tức toàn bộ mạng cũ mở xong rồi vành đai mới bắt đầu.
  const OLD_NETWORK_SIZE = 44;
  // ⚠️ "NẰM TRÊN VIỀN" KHÔNG BẰNG "LÀ VÀNH ĐAI" — bản đầu của bài test này dùng phép thử hình học
  // `x === 0 || y === 0 || …` và nó ĐỎ ngay, kêu tên ô `(4, 0)`. Ô đó nằm trên viền thật, nhưng nó
  // là **đầu mút của đại lộ dọc** chạy từ tâm ra tới mép — thuộc mạng cũ, tier 0, mở từ lâu. Phép
  // đo sai chứ không phải mã sai (đúng luật "số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước").
  // Nguồn sự thật duy nhất cho câu hỏi "ô này thuộc con đường nào" là `describeRoadCell` — dùng
  // luôn nó, thay vì phát biểu lại cùng một luật bằng một công thức thứ hai.
  const onRing = (c) => describeRoadCell(c.x, c.y).includes('vành đai');

  // Dựng lại THỨ TỰ MỞ bằng cách tăng dần `sessionCount` rồi ghi lại ô nào mới xuất hiện — thay vì
  // đọc thẳng `ROAD_CELLS` (không xuất ra ngoài). Cách này còn hơn ở chỗ nó đo đúng thứ Đàm gặp:
  // thứ tự SAU khi đã trừ những ô bị công trình chiếm.
  const order = [];
  for (let n = 1; n <= ROAD_CELL_COUNT + 5; n += 1) {
    const roads = deriveProps({ era: 1, buildingCount: 5, sessionCount: n, streakLength: 0 })
      .filter((p) => p.kind === 'road');
    const seen = new Set(order.map((c) => `${c.x},${c.y}`));
    for (const r of roads) if (!seen.has(`${r.x},${r.y}`)) order.push(r);
  }

  const early = order.slice(0, OLD_NETWORK_SIZE - 8); // trừ hao vài ô bị công trình chiếm
  const strays = early.filter(onRing);
  assert.equal(strays.length, 0,
    `${strays.length} ô vành đai (vd ${strays[0] && `${strays[0].x},${strays[0].y}`}) chen vào `
    + `${OLD_NETWORK_SIZE} ô đầu ⇒ thành phố của người đang chơi sẽ tự sắp xếp lại sau deploy`);

  // Và vành đai PHẢI có thật ở cuối — nếu không thì bài trên xanh một cách vô nghĩa (không có
  // vành đai thì đương nhiên không có ô nào chen vào).
  assert.ok(order.filter(onRing).length >= 30,
    `chỉ có ${order.filter(onRing).length} ô vành đai — mạng lưới chưa hề mở rộng ra viền`);
  assert.ok(ROAD_CELL_COUNT >= 76,
    `mạng đường chỉ có ${ROAD_CELL_COUNT} ô — vành đai đáng lẽ phải đưa nó lên khoảng 80`);
});

test('TÊN ĐOẠN ĐƯỜNG nói đúng loại đường của ô đó', () => {
  // Câu báo sau mỗi phiên nay nói *cái gì* vừa mở ("vừa mở thêm một đoạn đại lộ ngang") thay vì
  // "một đoạn đường" lặp lại 80 lần. Cái tên đó chỉ có giá trị nếu nó ĐÚNG — một cái tên sai còn
  // tệ hơn không có tên, đúng luật trung thực của `cityMoment.js`.
  assert.equal(describeRoadCell(4, 0), 'một đoạn đại lộ dọc');
  assert.equal(describeRoadCell(0, 4), 'một đoạn đại lộ ngang');
  assert.equal(describeRoadCell(8, 2), 'một đoạn phố dọc');
  assert.equal(describeRoadCell(2, 8), 'một đoạn phố ngang');
  assert.equal(describeRoadCell(0, 6), 'một đoạn vành đai dọc');
  assert.equal(describeRoadCell(11, 6), 'một đoạn vành đai dọc');
  assert.equal(describeRoadCell(6, 0), 'một đoạn vành đai ngang');
  assert.equal(describeRoadCell(6, 11), 'một đoạn vành đai ngang');
  // Bốn góc vành đai là chỗ đoạn dọc gặp đoạn ngang — đường ở đó BẺ CUA chứ không CẮT NHAU, nên
  // gọi là "ngã tư" sẽ sai. Đủ cả bốn góc vì mỗi góc là một tổ hợp `RING_LOW`/`RING_HIGH` riêng.
  assert.equal(describeRoadCell(0, 0), 'một khúc cua vành đai');
  assert.equal(describeRoadCell(0, 11), 'một khúc cua vành đai');
  assert.equal(describeRoadCell(11, 0), 'một khúc cua vành đai');
  assert.equal(describeRoadCell(11, 11), 'một khúc cua vành đai');
  // Giao của hai trục bất kỳ ⇒ ngã tư. Đủ CẢ BỐN tổ hợp, vì mỗi tổ hợp đi qua một nhánh `if` khác
  // nhau và bỏ sót một nhánh thì tên rơi về "đại lộ"/"phố" — nghe vẫn hợp lý nên không ai để ý.
  assert.equal(describeRoadCell(4, 4), 'một ngã tư mới');
  assert.equal(describeRoadCell(4, 8), 'một ngã tư mới');
  assert.equal(describeRoadCell(8, 4), 'một ngã tư mới');
  assert.equal(describeRoadCell(8, 8), 'một ngã tư mới');

  // ⚠️ MỌI ô đường thật đều phải có tên — không ô nào rơi ra ngoài bảng. Đây là vế bảo vệ cho việc
  // hàm này suy tên từ TOẠ ĐỘ: thêm một trục đường mới mà quên sửa hàm thì ô của nó sẽ lặng lẽ
  // mang tên "đường vành đai" dù nó nằm giữa thành phố.
  const roads = deriveProps({ era: 1, buildingCount: 5, sessionCount: 1e6, streakLength: 100 })
    .filter((p) => p.kind === 'road');
  for (const r of roads) {
    const name = describeRoadCell(r.x, r.y);
    assert.ok(typeof name === 'string' && name.startsWith('một'), `ô (${r.x},${r.y}) không có tên`);
    if (name.includes('vành đai')) {
      assert.ok(r.x === 0 || r.y === 0 || r.x === CITY_GRID_SIZE - 1 || r.y === CITY_GRID_SIZE - 1,
        `ô (${r.x},${r.y}) nằm giữa thành phố nhưng bị gọi là vành đai`);
    }
  }

  // ⚠️ VÀ KHÔNG ĐƯỢC CHỈ CÓ MỘT CÁI TÊN. 36/80 ô là vành đai; nếu cả 36 dùng chung một câu thì Đàm
  // đọc đúng một dòng chữ suốt 36 phiên liền — tái diễn đúng cái bệnh mà `cityMoment.js` đã đo và
  // chữa một lần ("82% số phiên đọc đúng 4 chữ"). Đây là hàng rào chống việc gộp lại cho gọn.
  const names = new Set(roads.map((r) => describeRoadCell(r.x, r.y)));
  assert.ok(names.size >= 6,
    `mạng đường chỉ có ${names.size} cách gọi (${[...names].join(' · ')}) — chưa đủ để 80 phiên `
    + 'mở đường không đọc ra như một câu lặp lại');
});

test('MỖI PHIÊN MỞ THÊM ĐÚNG MỘT Ô ĐƯỜNG — thành phố lớn lên nhìn thấy được', () => {
  // Đây là lời hứa game hoá cốt lõi ("mỗi phiên hoàn thành thì phải có nhà xây lên hay gì đó") ở
  // dạng rẻ nhất: kể cả khi hàng đợi xây rỗng, phiên nào cũng có MỘT thứ đổi trên bản đồ.
  const countRoads = (sessionCount) => deriveProps({
    era: 1, buildingCount: 5, sessionCount, streakLength: 0,
  }).filter((p) => p.kind === 'road').length;

  let previous = countRoads(1);
  for (let n = 2; n <= 30; n += 1) {
    const now = countRoads(n);
    assert.ok(now >= previous, `phiên ${n} làm MẤT đường (${previous} → ${now})`);
    previous = now;
  }
  // …và tới phiên 30 thì phải nhiều hơn hẳn phiên 1, không phải nhích một hai ô.
  assert.ok(countRoads(30) >= countRoads(1) + 20,
    `từ phiên 1 tới phiên 30 chỉ mở thêm ${countRoads(30) - countRoads(1)} ô đường`);

  // Chưa có công trình nào thì chưa có đường — bãi đất trống mới khai hoang.
  assert.equal(
    deriveProps({ era: 1, buildingCount: 0, sessionCount: 50, streakLength: 0 })
      .filter((p) => p.kind === 'road').length,
    0,
  );
});

test('CẢNH VẬT KHÔNG BỊ ĐƯỜNG BÓP NGHẸT khi mạng đường mở rộng', () => {
  // ⚠️ Cái bẫy im lặng của phase này: trần cũ trừ CHUNG cho đường và cảnh vật. Mạng đường tăng từ
  // 23 lên 44 ô ⇒ nếu vẫn trừ chung thì tới phiên thứ 44 đường ăn gần hết trần và cây cối biến
  // mất dần đúng lúc thành phố đông đúc nhất, mà không có gì đỏ lên.
  const props = deriveProps({ era: 1, buildingCount: 5, sessionCount: 1e6, streakLength: 1e6 });
  const scatter = props.filter((p) => p.kind !== 'road');
  assert.ok(scatter.length >= 30,
    `thành phố đông nhất mà chỉ còn ${scatter.length} cảnh vật — đường đã nuốt mất trần chung`);
  assert.ok(scatter.length <= MAX_SCATTER_PROPS,
    `cảnh vật khối vượt trần riêng: ${scatter.length} > ${MAX_SCATTER_PROPS}`);
});
