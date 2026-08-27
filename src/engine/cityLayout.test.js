import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CITY_GRID_SIZE,
  MAX_PROPS,
  MAX_SCATTER_PROPS,
  TILE_H,
  TILE_W,
  cellToScreen,
  roadCellCandidates,
  computeCityLayout,
  deriveGroundCover,
  deriveProps,
  describeRoadCell,
  hashId,
  placeBuilding,
  roadCellCount,
} from './cityLayout.js';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from './constants.js';
import { PROP_KINDS } from './city3d/propSpec.js';
import { GROUND_COVER_STYLES } from './city3d/groundCoverStyle.js';

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

/** Đếm số TRỤC (cột hoặc hàng) có ít nhất `k` ô đường — thước đo "mạng lưới" hay "dấu cộng". */
function demTruc(roads, k) {
  const cols = new Map();
  const rows = new Map();
  for (const r of roads) {
    cols.set(r.x, (cols.get(r.x) ?? 0) + 1);
    rows.set(r.y, (rows.get(r.y) ?? 0) + 1);
  }
  return [...cols.values()].filter((v) => v >= k).length
    + [...rows.values()].filter((v) => v >= k).length;
}

test('MẠNG ĐƯỜNG là một mạng lưới, không phải một dấu cộng — ở CẢ 15 KỶ', () => {
  // Đàm 2026-08-14: *"đường đi cũng nên phức tạp hơn"*. Trước đó cả thành phố chỉ có cột x=4 và
  // hàng y=4 — 23 ô trên lưới 144 ô, tức hai con đường mòn cắt nhau giữa đồng.
  //
  // ⚠️ PHASE 20 PHẢI HỎI TỪNG KỶ, VÀ NGƯỠNG PHẢI HẠ XUỐNG — cả hai đều là sửa cho đúng chứ không
  // phải nới cho tiện. Bản cũ hỏi mỗi kỷ 1 rồi đòi ≥ 40 ô, đúng khi cả 15 kỷ dùng chung một bộ
  // xương 80 ô. Nay số ô đường là HỆ QUẢ của số thửa mà kỷ ấy khai: kỷ 1 (Göbekli Tepe, 6 thửa lớn
  // quanh một khoảng trống chung — đúng lời Đàm) ra 34 ô, kỷ 11 (Manhattan, 14 thửa) ra 92. Giữ
  // ngưỡng 40 là bắt Göbekli Tepe phải có mạng đường của Manhattan.
  // Ngưỡng 30 lấy từ phép đo thật (thấp nhất 34) và vẫn nằm TRÊN HẲN vùng hỏng (23 của dấu cộng).
  let soKy = 0;
  const soTruc = [];
  for (let era = 1; era <= 15; era += 1) {
    const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    const roads = deriveProps({ era, buildingCount: ids.length, sessionCount: 1e6, streakLength: 100 })
      .filter((p) => p.kind === 'road');

    // (a) ĐỦ NHIỀU.
    assert.ok(roads.length >= 30,
      `kỷ ${era} chỉ có ${roads.length} ô đường — mạng cũ đã có 23, thêm chừng này thì mắt không nhận ra`);

    // (b) VÀ ĐỦ RỘNG THEO CẢ HAI CHIỀU. Vế (a) một mình vẫn xanh nếu ai đó kéo dài một con đường
    //     duy nhất; thứ làm nên "mạng lưới" là có nhiều đường SONG SONG cắt nhau. Một dấu cộng có
    //     đúng 2 trục, nên đòi ≥ 3 là đòi một thứ dấu cộng KHÔNG THỂ đạt (đo thật: 3…24).
    const truc = demTruc(roads, 4);
    soTruc.push(truc);
    assert.ok(truc >= 3,
      `kỷ ${era} chỉ có ${truc} trục đường dài — chưa chia được thành phố thành các ô phố`);

    // (c) BA HẠNG ĐƯỜNG phải cùng có mặt. `variant` không phải nhãn trang trí: bộ vẽ 3D đọc nó để
    //     quyết bề rộng mặt đường. Nếu mọi ô cùng một hạng thì thêm bao nhiêu đường cũng chỉ ra
    //     một tấm lưới đều tăm tắp.
    const variants = new Set(roads.map((r) => r.variant));
    for (const v of [0, 1, 2]) {
      assert.ok(variants.has(v), `kỷ ${era} thiếu hẳn hạng đường ${v} ⇒ mất thứ bậc đại lộ ↔ ngõ phố`);
    }

    // (d) KHÔNG ô đường nào đè lên công trình.
    const layout = computeCityLayout({ built: ids, era, stats: { sessionCount: 1e6, streakLength: 100 } });
    const houses = new Set(layout.buildings.map((b) => `${b.x},${b.y}`));
    for (const road of layout.props.filter((p) => p.kind === 'road')) {
      assert.ok(!houses.has(`${road.x},${road.y}`),
        `kỷ ${era}: ô đường (${road.x},${road.y}) đè lên công trình`);
    }
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');

  // ⚠️ VÀ SỐ TRỤC PHẢI KHÁC NHAU GIỮA CÁC KỶ. Đây là nửa thứ hai của lời hứa Phase 20, và nếu
  // thiếu nó thì cả bài trên vẫn xanh trong đúng cái thế giới Đàm đã bác: 15 mạng lưới đẹp nhưng
  // giống hệt nhau. Đo thật: 3 (kỷ 1) tới 24 (kỷ 4, 7, 9, 11).
  assert.ok(Math.max(...soTruc) >= Math.min(...soTruc) * 3,
    `số trục đường chỉ trải từ ${Math.min(...soTruc)} tới ${Math.max(...soTruc)} — 15 kỷ đọc ra `
    + 'cùng một mật độ đường');
});

test('ĐỐI CHỨNG: bộ xương DẤU CỘNG của thời trước Phase 20 phải bị phép đo trên BẮT ĐƯỢC', () => {
  // ⚠️ Không có bài này thì hai ngưỡng trên (30 ô · 3 trục) chỉ là hai con số, và lần sau ai đó
  // thấy chúng vướng sẽ nới thêm một chút cho tiện. Nhốt sẵn bộ số HỎNG cũ rồi bắt phép đo phải
  // còn bắt được nó là cách duy nhất giữ cho ngưỡng không trôi (bài học Phase 9A).
  const dauCong = [];
  for (let i = 0; i < CITY_GRID_SIZE; i += 1) {
    dauCong.push({ x: 4, y: i, variant: 0 });
    if (i !== 4) dauCong.push({ x: i, y: 4, variant: 0 });
  }
  assert.equal(dauCong.length, 23, 'dấu cộng của mạng cũ phải đúng 23 ô — nếu không thì đối chứng sai');
  assert.ok(dauCong.length < 30, 'ngưỡng 30 ô không còn bắt được dấu cộng cũ');
  assert.equal(demTruc(dauCong, 4), 2, 'dấu cộng phải ra đúng 2 trục — nếu không thì phép đếm trục hỏng');
  assert.ok(demTruc(dauCong, 4) < 3, 'ngưỡng 3 trục không còn bắt được dấu cộng cũ');
});

test('VÀNH ĐAI mở SAU toàn bộ mạng trong — thành phố Đàm đang có không được tự sắp xếp lại', () => {
  // ⚠️ ĐÂY LÀ BÀI TEST QUAN TRỌNG NHẤT CỦA PHASE 6C, và nó canh một thứ **không nhìn thấy được
  // trong ảnh chụp**: tính TƯƠNG THÍCH NGƯỢC của một thành phố đang chạy thật.
  // Danh sách ô đường xếp theo khoảng cách tới tâm. Nếu vành đai chỉ được thả vào rồi để phép xếp
  // đó lo, thì ô giữa cạnh viền (cách tâm 6) sẽ CHEN LÊN TRƯỚC đoạn cuối một con phố chạy ra mép
  // (cách tâm 7) — nghĩa là với một người đã chơi tới phiên 30, thứ tự 30 ô đường của họ đổi hẳn
  // và thành phố **tự sắp xếp lại** sau một lần deploy. Không có gì đỏ lên, không ai mất dữ liệu,
  // chỉ là một buổi sáng mở app thấy phố mình khác đi. Trường `tier` chặn đúng điều đó.
  //
  // ⚠️ PHASE 20 ĐỔI KỶ ĐEM RA THỬ, VÀ ĐÓ LÀ MỘT SỬA LỖI CHỨ KHÔNG PHẢI MỘT LỰA CHỌN CHO TIỆN. Bản
  // cũ thử trên kỷ 1 vì hồi ấy **mọi kỷ đều có vành đai** (bộ xương là một hằng số chung). Nay vành
  // đai là một trường trong bảng `networkStyle.js` và kỷ 1 khai `ring: false` — Göbekli Tepe không
  // có tường thành. Cứ giữ kỷ 1 thì bài này xanh một cách vô nghĩa: không có vành đai thì đương
  // nhiên không có ô vành đai nào chen vào. Vì vậy bài chạy trên MỌI kỷ CÓ vành đai, và có một
  // gác đếm bắt buộc phải tìm thấy ít nhất một kỷ như thế.
  let soKyCoVanhDai = 0;
  for (let era = 1; era <= 15; era += 1) {
    const ungVien = roadCellCandidates(era);
    const oVanhDai = new Set(ungVien.filter((c) => c.tier >= 1).map((c) => `${c.x},${c.y}`));
    if (oVanhDai.size === 0) continue;
    soKyCoVanhDai += 1;

    // ⚠️ "NẰM TRÊN VIỀN" KHÔNG BẰNG "LÀ VÀNH ĐAI" — bản đầu của bài test này dùng phép thử hình học
    // `x === 0 || y === 0 || …` và nó ĐỎ ngay, kêu tên một ô nằm trên viền thật nhưng là **đầu mút
    // của một con phố** chạy từ trong ra tới mép: thuộc mạng trong, tier 0, mở từ lâu. Phép đo sai
    // chứ không phải mã sai (đúng luật "số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước").
    // Nguồn sự thật duy nhất là chính trường `tier` mà bộ sinh vừa ghi ra — dùng luôn nó, thay vì
    // phát biểu lại cùng một luật bằng một công thức thứ hai.
    const onRing = (c) => oVanhDai.has(`${c.x},${c.y}`);
    const soONoiThanh = ungVien.length - oVanhDai.size;

    // Dựng lại THỨ TỰ MỞ bằng cách tăng dần `sessionCount` rồi ghi lại ô nào mới xuất hiện — thay
    // vì đọc thẳng danh sách ứng viên. Cách này còn hơn ở chỗ nó đo đúng thứ Đàm gặp: thứ tự SAU
    // khi đã trừ những ô bị công trình chiếm.
    const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    const order = [];
    const seen = new Set();
    for (let n = 1; n <= ungVien.length + 5; n += 1) {
      const roads = deriveProps({ era, buildingCount: ids.length, sessionCount: n, streakLength: 0 })
        .filter((p) => p.kind === 'road');
      for (const r of roads) {
        const k = `${r.x},${r.y}`;
        if (!seen.has(k)) { seen.add(k); order.push(r); }
      }
    }

    const early = order.slice(0, soONoiThanh - 8); // trừ hao vài ô bị công trình chiếm
    const strays = early.filter(onRing);
    assert.equal(strays.length, 0,
      `kỷ ${era}: ${strays.length} ô vành đai (vd ${strays[0] && `${strays[0].x},${strays[0].y}`}) `
      + `chen vào ${soONoiThanh} ô nội thành đầu tiên ⇒ thành phố của người đang chơi sẽ tự sắp `
      + 'xếp lại sau deploy');

    // Và vành đai PHẢI có thật ở cuối — nếu không thì phép đo trên xanh một cách vô nghĩa.
    assert.ok(order.filter(onRing).length >= 30,
      `kỷ ${era}: chỉ có ${order.filter(onRing).length} ô vành đai mở ra — mạng lưới chưa hề ra tới viền`);
  }
  assert.ok(soKyCoVanhDai >= 3,
    `chỉ có ${soKyCoVanhDai} kỷ có vành đai — bài test này gần như không còn chỗ nào để cắn`);
});

/**
 * Toàn bộ CÁCH GỌI mà `describeRoadCell` có thể trả về. Chép tay ở đây là CỐ Ý và có lý do đo
 * được: bài dưới đòi cả 15 kỷ cộng lại phải dùng HẾT danh sách này, tức nó là hàng rào chống một
 * nhánh chết. Suy nó ra từ chính mã sản phẩm thì hàng rào biến mất (một nhánh không bao giờ chạy
 * cũng tự động "khớp" với chính nó).
 */
const MOI_CACH_GOI = [
  'một đoạn phố dọc', 'một đoạn phố ngang', 'một đoạn đại lộ',
  'một ngã ba mới', 'một ngã tư mới',
  'một đoạn vành đai dọc', 'một đoạn vành đai ngang', 'một khúc cua vành đai',
  'một lối rẽ ra vành đai',
];

test('TÊN ĐOẠN ĐƯỜNG nói đúng loại đường của ô đó', () => {
  // Câu báo sau mỗi phiên nay nói *cái gì* vừa mở ("vừa mở thêm một ngã ba mới") thay vì "một đoạn
  // đường" lặp lại hàng chục lần. Cái tên đó chỉ có giá trị nếu nó ĐÚNG — một cái tên sai còn tệ
  // hơn không có tên, đúng luật trung thực của `cityMoment.js`.
  //
  // ⚠️ PHASE 20 BỎ HẲN CÁCH HỎI BẰNG TOẠ ĐỘ VIẾT CỨNG (`describeRoadCell(4, 0)` === 'đại lộ dọc').
  // Toạ độ ấy đúng vì bộ xương là một hằng số chung; nay mỗi kỷ một bộ xương nên một toạ độ cụ thể
  // không còn nghĩa gì. Bài này vì thế hỏi những thứ CÒN ĐÚNG khi bộ xương đổi: mọi ô đều có tên ·
  // tên "vành đai" chỉ rơi vào ô vành đai thật · và không cách gọi nào chết.
  const dungOMoiKy = new Map();
  let soKy = 0;
  for (let era = 1; era <= 15; era += 1) {
    const cells = roadCellCandidates(era);
    const tenTrongKy = new Set();
    for (const c of cells) {
      const name = describeRoadCell(c.x, c.y, era);
      assert.ok(MOI_CACH_GOI.includes(name),
        `kỷ ${era} ô (${c.x},${c.y}) mang tên lạ "${name}" — không có trong danh mục cách gọi`);
      tenTrongKy.add(name);
      dungOMoiKy.set(name, (dungOMoiKy.get(name) ?? 0) + 1);
      if (name.includes('vành đai')) {
        assert.ok(c.tier >= 1, `kỷ ${era} ô (${c.x},${c.y}) thuộc mạng trong nhưng bị gọi là vành đai`);
        assert.ok(c.x === 0 || c.y === 0 || c.x === CITY_GRID_SIZE - 1 || c.y === CITY_GRID_SIZE - 1,
          `kỷ ${era} ô (${c.x},${c.y}) nằm giữa thành phố nhưng bị gọi là vành đai`);
      } else {
        assert.equal(c.tier, 0, `kỷ ${era} ô (${c.x},${c.y}) là vành đai nhưng không được gọi tên như vậy`);
      }
    }

    // ⚠️ VÀ KHÔNG KỶ NÀO ĐƯỢC CHỈ CÓ MỘT CÁI TÊN. Kỷ thưa nhất có 34 ô đường; nếu cả 34 dùng chung
    // một câu thì Đàm đọc đúng một dòng chữ suốt 34 phiên liền — tái diễn đúng cái bệnh mà
    // `cityMoment.js` đã đo và chữa một lần rồi ("82% số phiên đọc đúng 4 chữ"). Ngưỡng 4 lấy từ
    // phép đo thật (kỷ 1 và kỷ 5 ra đúng 4; kỷ có vành đai ra 8–9), không phải một số cho đẹp.
    assert.ok(tenTrongKy.size >= 4,
      `kỷ ${era} chỉ có ${tenTrongKy.size} cách gọi (${[...tenTrongKy].join(' · ')}) — chưa đủ để `
      + 'hàng chục phiên mở đường không đọc ra như một câu lặp lại');
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');

  // ⚠️ HÀNG RÀO CHỐNG NHÁNH CHẾT — và nó KHÔNG phải lo xa, nó đã bắt được một lỗi thật. Bản đầu của
  // Phase 20 giữ nguyên câu `if (cell.junction) return 'một ngã tư mới'`, mà `junction` chỉ bật ở 4
  // góc vành đai (một nhát cắt BSP không bao giờ đè lên nhát cũ, nên hai đường gặp nhau ở hình chữ
  // T chứ không ở một ô chung). Nhánh vành đai đứng trước ⇒ câu "một ngã tư mới" **chưa từng một
  // lần tới được mắt Đàm**, mà mọi bài test vẫn xanh. Đòi cả 15 kỷ cộng lại phải dùng HẾT danh mục
  // là cách rẻ nhất để một cách gọi chết bị lộ ra ngay.
  for (const ten of MOI_CACH_GOI) {
    assert.ok((dungOMoiKy.get(ten) ?? 0) > 0,
      `cách gọi "${ten}" không xuất hiện ở một ô nào trong cả 15 kỷ — nó là một nhánh chết`);
  }

  // Ô KHÔNG phải đường thì rơi về câu chung — và nó phải là một câu đọc được, không phải `undefined`.
  const oTrong = [];
  for (let y = 0; y < CITY_GRID_SIZE && oTrong.length === 0; y += 1) {
    for (let x = 0; x < CITY_GRID_SIZE; x += 1) {
      if (!roadCellCandidates(1).some((c) => c.x === x && c.y === y)) { oTrong.push([x, y]); break; }
    }
  }
  assert.equal(oTrong.length, 1, 'gác chạy-rỗng: không tìm được ô nào không phải đường');
  assert.equal(describeRoadCell(oTrong[0][0], oTrong[0][1], 1), 'một đoạn đường');
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

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * DANH SÁCH ỨNG VIÊN MẠNG ĐƯỜNG — TIỀN ĐỀ CỦA `city3d/terrain.js`
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `terrain.js` sắp đặt ranh giới thềm bậc theo mạng đường. Cao độ mặt đất **tuyệt đối không được
 * đổi theo tiến độ** (ADR-007: xây thêm một căn nhà mà cả quả đồi nhích lên thì nhà cũ lún, im
 * lặng, không gì đỏ). Nên trước khi cho `terrain.js` biết đường nằm ở đâu, phải chứng minh cái
 * "đâu" ấy là một hằng số — bằng test, không bằng lời.
 *
 * ⚠️ VÀ PHẢI NÓI RÕ NÓ LÀ HẰNG SỐ Ở TẦNG NÀO. Có HAI tập ô đường, và chúng khác nhau:
 *   · **ứng viên** (`roadCellCandidates`) — 80 ô suy từ hằng số lưới. BẤT BIẾN.
 *   · **đã hiện** (`layout.props` kind `road`) — mở dần theo `sessionCount` VÀ bị công trình
 *     chiếm chỗ đá ra, mà công trình thì đặt theo kỷ. **KHÔNG bất biến.**
 * Ba bài dưới đây khoá cả hai vế: vế "ứng viên bất biến" (thứ `terrain.js` dựa vào) và vế "đã hiện
 * KHÔNG bất biến" (thứ `terrain.js` PHẢI TRÁNH). Thiếu vế thứ hai thì phiên sau sẽ đọc bài đầu
 * rồi kết luận "mạng đường bất biến" và đi hỏi `layout.props` cho tiện.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/** Tập khoá "x|y" của những ô đường THẬT SỰ hiện ra trong một bố cục. */
function roadKeysOf(layout) {
  return new Set(layout.props.filter((p) => p.kind === 'road').map((p) => `${p.x}|${p.y}`));
}

function layoutAt(era, ids, sessionCount) {
  return computeCityLayout({
    built: ids,
    levels: Object.fromEntries(ids.map((id) => [id, 3])),
    era,
    stats: { sessionCount, streakLength: 9 },
  });
}

test('ỨNG VIÊN MẠNG ĐƯỜNG LÀ HẰNG SỐ CỦA MỘT KỶ — không đổi theo công trình hay số phiên', () => {
  // ⚠️ PHASE 20 ĐỔI PHÁT BIỂU CỦA LỜI HỨA NÀY, VÀ ĐỔI THEO HƯỚNG CHẶT HƠN CHỨ KHÔNG LỎNG HƠN.
  // Trước: "danh sách này là MỘT hằng số dùng chung cho 15 kỷ". Nay: "với MỖI kỷ, danh sách của kỷ
  // ấy là một hằng số". Vế `terrain.js` dựa vào vẫn nguyên vẹn — cao độ mặt đất của kỷ đang xem
  // không nhúc nhích khi Đàm xây thêm nhà — nhưng nay `terrain.js` **bắt buộc phải truyền `era`**,
  // và quên truyền thì nó lặng lẽ san phẳng mặt đất dọc theo những con đường của MỘT KỶ KHÁC.
  let soKy = 0;
  for (let era = 1; era <= 15; era += 1) {
    const a = roadCellCandidates(era);
    assert.deepEqual(a, roadCellCandidates(era), `kỷ ${era}: hai lần gọi ra hai danh sách khác nhau`);
    assert.equal(a.length, roadCellCount(era),
      `kỷ ${era}: danh sách ứng viên phải đúng bằng mẫu số đang công bố`);

    // ⚠️ GỌI KÈM DỮ LIỆU RÁC (ADR-007). "Hàm hiện không nhận tham số đó" là một sự thật rất dễ mất:
    // người sau chỉ cần thêm một tham số tuỳ chọn là bất biến chết mà mọi test vẫn xanh.
    const moc = JSON.stringify(a);
    assert.equal(
      JSON.stringify(roadCellCandidates(era, { built: ['a', 'b'], sessionCount: 999, buildings: [1, 2] })),
      moc, `kỷ ${era}: danh sách ứng viên đổi khi có dữ liệu tiến độ`);

    // Bản sao thật: đầu độc kết quả rồi gọi lại, danh sách gốc phải nguyên vẹn.
    // ⚠️ MỐC SO SÁNH PHẢI LÀ MỘT ẢNH CHỤP RỜI, KHÔNG PHẢI MỘT LẦN GỌI THỨ HAI. Bản đầu của bài này
    // giữ mốc bằng `const b = roadCellCandidates()` rồi đầu độc `a` — mà nếu hàm trả về CHÍNH mảng
    // gốc thì `a` và `b` là một, nên phép đầu độc bẩn cả hai vế và `deepEqual` vẫn xanh. Phép phá
    // (bỏ `.map`) đã KHÔNG nổ vì đúng lý do đó: hỏng nằm ở bài test, không ở phép phá.
    a.sort((p, q) => q.x - p.x);
    a[0].x = -999;
    assert.equal(JSON.stringify(roadCellCandidates(era)), moc,
      `kỷ ${era}: danh sách gốc bị sửa từ bên ngoài — nó không phải bản sao`);
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');
});

test('…NHƯNG 15 KỶ RA 15 MẠNG ĐƯỜNG KHÁC NHAU — đó là cả mục đích của Phase 20', () => {
  // ⚠️ Vế đối chứng của bài trên, và nếu thiếu nó thì bài trên xanh hoàn hảo trong đúng cái thế
  // giới Đàm vừa bác bỏ: một bộ xương cứng dùng chung cho 15 kỷ cũng "bất biến theo tiến độ".
  // Anh nói *"nhà vẫn quy hoạch rất kỳ quặc, rất bài bản"* — thứ chữa được câu đó là 15 bộ xương
  // KHÁC NHAU, nên phải có một bài đòi đúng điều ấy.
  const chuKy = new Set();
  for (let era = 1; era <= 15; era += 1) {
    chuKy.add(roadCellCandidates(era).map((c) => `${c.x},${c.y}`).sort().join('|'));
  }
  assert.equal(chuKy.size, 15,
    `15 kỷ chỉ ra ${chuKy.size} mạng đường phân biệt được — có hai kỷ dùng chung một bộ xương`);
});

test('ỨNG VIÊN LÀ TẬP CHA THẬT SỰ của mọi mạng đường đã hiện, ở mọi kỷ và mọi mốc phiên', () => {
  // Đây là vế khiến `terrain.js` được phép dựa vào danh sách ứng viên: đặt luật lên tập cha là
  // một lời hứa CHẶT HƠN mọi tập con, nên không thể hụt ở một tổ hợp chưa nghĩ tới.
  let soLuotDuyet = 0;
  let tongOHien = 0;
  for (let era = 1; era <= 15; era += 1) {
    // ⚠️ DỰNG ỨNG VIÊN **BÊN TRONG** VÒNG LẶP KỶ. Bản trước Phase 20 dựng một lần ở ngoài, đúng
    // chừng nào bộ xương còn dùng chung; nay mỗi kỷ một mạng nên để ngoài là đem mạng của kỷ 1 đi
    // chấm cả 15 kỷ.
    const ungVien = new Set(roadCellCandidates(era).map((c) => `${c.x}|${c.y}`));
    const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    for (const phien of [0, 1, 7, 20, 44, 60, 80, 120, 200]) {
      for (const built of [[], ids.slice(0, 2), ids]) {
        const keys = roadKeysOf(layoutAt(era, built, phien));
        soLuotDuyet += 1;
        tongOHien += keys.size;
        for (const k of keys) {
          assert.ok(ungVien.has(k), `kỷ ${era}/${phien} phiên: ô đường ${k} nằm NGOÀI danh sách ứng viên`);
        }
      }
    }
  }
  // Gác chạy-rỗng: một vòng lặp bỏ sót mọi thứ cũng "không có ô nào ngoài danh sách".
  assert.equal(soLuotDuyet, 15 * 9 * 3, 'phép quét không duyệt đủ số tổ hợp đã hứa');
  assert.ok(tongOHien > 1000, `chỉ thấy ${tongOHien} ô đường trong cả phép quét — bố cục đang trả về rỗng`);
});

test('MẠNG ĐƯỜNG ĐÃ HIỆN thì NGƯỢC LẠI — nó ĐỔI theo kỷ và theo tiến độ, đừng dựa vào nó', () => {
  // ⚠️ Bài này khoá một sự thật NGƯỢC với bài trên, và đó là lý do nó tồn tại. Nguyên nhân:
  // `deriveProps` bỏ qua ô đường nào đã bị một công trình chiếm, mà `placeBuilding` đặt công trình
  // theo `hashPick(bpId)` — khác nhau từng kỷ. Ai đọc bài đầu rồi kết luận "mạng đường bất biến"
  // sẽ đi hỏi `layout.props` và gài đúng quả mìn ADR-007 vào `terrain.js`.
  const chuKy = new Set();
  for (let era = 1; era <= 15; era += 1) {
    const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    chuKy.add([...roadKeysOf(layoutAt(era, ids, 40))].sort().join(','));
  }
  assert.ok(chuKy.size > 1,
    'cùng 40 phiên mà 15 kỷ ra CÙNG một mạng đường — nếu điều này thành thật thì hãy xoá bài test '
    + 'này và ghi lại lý do, đừng lặng lẽ tin rằng `layout.props` bất biến');

  // Và nó cũng đổi theo tiến độ trong CÙNG một kỷ: chưa xây gì thì chưa có đường nào.
  const ids7 = BLUEPRINT_CATALOG[7].map((bp) => bp.id);
  assert.equal(roadKeysOf(layoutAt(7, [], 80)).size, 0, 'chưa xây gì mà đã có đường');
  assert.ok(roadKeysOf(layoutAt(7, ids7, 80)).size > roadKeysOf(layoutAt(7, ids7, 20)).size,
    'mạng đường không lớn thêm theo số phiên');
});

/* ════════════════════════════════════════════════════════════════════════════════════════════
 * MẢNG PHỦ ĐẤT (§2-C, ADR-037) — `share` KHÔNG ĐƯỢC BỊ NUỐT.
 *
 * ⚠️ VÌ SAO CÓ NHÓM BÀI NÀY: bản đầu của ngân sách mảng phủ viết
 *      min(MAX, floor(ungVien × share), 4 × nhà + phiên)
 * — đặt một PHẦN cạnh một LƯỢNG trong cùng một `Math.min`. Lý lẽ nghe xuôi, và **mọi bài test
 * lúc ấy đều xanh**: bảng `groundCoverStyle.test.js` chỉ hỏi cái BẢNG, `groundCover.test.js` chỉ
 * hỏi cái HÌNH, không bài nào hỏi *"con số trong bảng có tới được thành phố không"*. Đo bằng ảnh
 * mới lộ ra: ở mốc **20 phiên** (mốc đất trống tệ nhất) **8/15 kỷ** cùng dựng ra ĐÚNG 40 mảng —
 * tám con số `share` khác nhau cho một kết quả. Đúng bẫy `MIN_STONE` (Phase 9D) và bẫy trường
 * nhiễu (Phase 7B), lần này do chính tay tôi cài vào.
 * ⇒ Bài học đã ghi thành mã: **một bảng bản sắc phải được canh ở CẢ HAI ĐẦU** — đầu KHAI
 * (validator) và đầu DỰNG (ở đây).
 * ════════════════════════════════════════════════════════════════════════════════════════════ */

/** Số mảng phủ của một kỷ ở một mốc tuổi. Cả 5 bản vẽ đã xây, cấp 1 — đúng thành phố mà `--sessions` dựng. */
function soMangPhu(era, sessionCount) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  return (computeCityLayout({
    built: ids,
    levels: Object.fromEntries(ids.map((id) => [id, 1])),
    era,
    stats: { sessionCount, streakLength: 9 },
  }).covers ?? []).length;
}

/**
 * Các mốc tuổi phải quét. KHÔNG chỉ 20/50/80 — cái bẫy chỉ nổ ở thành phố TRẺ, nên phải có cả mốc
 * rất trẻ (4, 10) lẫn mốc đã bão hoà (150).
 */
const MOC_TUOI = [4, 10, 20, 30, 50, 80, 150];

test('MẢNG PHỦ — `share` quyết định ở MỌI mốc tuổi, không bị một trần TUYỆT ĐỐI nuốt mất', () => {
  // ⚠️ NGƯỠNG LẤY TỪ PHÉP ĐO, KHÔNG ĐOÁN (bài học Phase 9A). Đo ngày 2026-08-19, số giá trị khác
  // nhau trong 15 kỷ: 10 · 11 · 13 · 14 · 11 · 10 · 10 theo thứ tự `MOC_TUOI` ⇒ thật sự nhỏ nhất
  // là 10, nên để sàn 9: sát đủ để một lần thoái hoá là đỏ, không sát tới mức đỏ vì làm tròn.
  for (const moc of MOC_TUOI) {
    const dem = [];
    for (let era = 1; era <= 15; era += 1) dem.push(soMangPhu(era, moc));
    assert.ok(new Set(dem).size >= 9,
      `mốc ${moc} phiên: 15 kỷ chỉ ra ${new Set(dem).size} giá trị khác nhau [${dem.join(',')}] `
      + '⇒ có một cái trần đang nuốt `share`');
  }
});

test('MẢNG PHỦ — kỷ khai `share` CAO nhất luôn phủ nhiều hơn kỷ khai THẤP nhất', () => {
  // Đây là assert bắt được đúng con bug thật: bản cũ cho kỷ 14 (`share` 0,66) và kỷ 9 (0,54) và
  // kỷ 3 (0,46) cùng ra 40 ở mốc 20 phiên. Hỏi "nhiều giá trị khác nhau" thôi là chưa đủ —
  // phải hỏi thẳng thứ tự có còn không.
  //
  // ⚠️ PHASE 21 PHẢI TÁCH BÀI NÀY LÀM HAI VẾ, VÌ MẪU SỐ THÔI KHÔNG CÒN CHUNG NỮA. Trước Phase 20
  // cả 15 kỷ dùng CHUNG một lưới đường cứng, nên số ô trống của mọi kỷ xấp xỉ bằng nhau và việc
  // đem hai con số ĐẾM của hai kỷ ra so là một phép so công bằng. Nay mỗi kỷ tự sinh bộ xương
  // riêng (ADR-066 + ADR-059) nên mẫu số khác nhau tới **3 lần**: đo ở mốc 150 phiên, kỷ 1 còn
  // ~33 ô trống trong khi kỷ 14 chỉ còn ~12. Cả hai cùng ra 8 mảng — kỷ 1 lấy 24% phần đất của
  // MÌNH, kỷ 14 lấy 66% phần đất của MÌNH, tức `share` vẫn cai trị hoàn hảo, chỉ là hai phân số
  // khác mẫu tình cờ rơi vào cùng một số nguyên.
  // ⇒ Đúng bài học "mẫu số là vế không ai kiểm" (đo mật độ nhà, 2026-08-19). Cách sửa KHÔNG phải
  // nới ngưỡng hay bỏ mốc 150 đi, mà là hỏi câu này ở nơi mẫu số THẬT SỰ chung.
  const shares = Object.entries(GROUND_COVER_STYLES).map(([e, s]) => [Number(e), s.share]);
  const thap = shares.reduce((m, r) => (r[1] < m[1] ? r : m))[0];
  const cao = shares.reduce((m, r) => (r[1] > m[1] ? r : m))[0];
  assert.notEqual(thap, cao, 'bảng dẹt: `share` cao nhất và thấp nhất là cùng một kỷ');

  // ── VẾ 1: CÙNG MỘT MẪU SỐ ─────────────────────────────────────────────────────────────────
  // Hỏi thẳng `deriveGroundCover` với y hệt một tập ô trống cho cả hai kỷ. Không còn mẫu số nào
  // để đổ lỗi: nếu `share` thôi quyết định thì bài này đỏ ngay, ở MỌI mức đông đúc.
  const oTrong = (bo) => {
    const chan = new Set();
    const nha = new Set();
    for (let y = 0; y < CITY_GRID_SIZE; y += 1) {
      for (let x = 0; x < CITY_GRID_SIZE; x += 1) {
        if ((x * 7 + y * 13) % bo === 0) { chan.add(`${x},${y}`); nha.add(`${x},${y}`); }
      }
    }
    return { chan, nha };
  };
  for (const bo of [2, 3, 5, 8]) {
    const { chan, nha } = oTrong(bo);
    const dem = (era) => deriveGroundCover({
      era, buildingCount: 5, sessionCount: 150, blocked: chan, nhaCua: nha,
    }).length;
    assert.ok(dem(cao) > dem(thap),
      `cùng một mẫu số (chặn 1/${bo} lưới): kỷ ${cao} (share cao nhất) phủ ${dem(cao)} mảng, `
      + `không nhiều hơn kỷ ${thap} (share thấp nhất) ${dem(thap)}`);
  }

  // ── VẾ 2: THÀNH PHỐ THẬT ──────────────────────────────────────────────────────────────────
  // Vẫn giữ phép so đầu-cuối, vì nó mới là thứ trả lời *"con số trong bảng có TỚI ĐƯỢC thành phố
  // không"*. Mốc nào mẫu số đã lệch quá xa để phép so hết công bằng thì KỂ TÊN BẰNG, không bỏ đi
  // trong im lặng: mốc thứ hai rơi vào đây thì đỏ, mà mốc 150 được chữa xong cũng đỏ.
  const hoa = [];
  for (const moc of MOC_TUOI) {
    if (soMangPhu(cao, moc) > soMangPhu(thap, moc)) continue;
    hoa.push(moc);
  }
  //
  // ⚠️ PHASE 21 §5 CHỮA XONG MỐC 150, VÀ KHÔNG PHẢI BẰNG CÁCH ĐỤNG VÀO `GROUND_COVER_STYLES`. §5
  // nâng số thửa kỷ 1 từ 6 lên 11 (kèm `minSide` 2 → 1), nên bộ xương kỷ 1 dày lên: **ô đường kỷ 1
  // đi từ 39 lên 57** (kỷ 14 = 88), tức mẫu số của hai kỷ xích lại gần nhau và phép so đầu-cuối
  // công bằng trở lại. Đo ở mốc 150: kỷ 14 phủ **8** mảng, kỷ 1 phủ **6** — trước §5 cả hai cùng
  // ra 8 nên chúng hoà. Danh sách nay RỖNG: lời hứa `share` giữ được ở CẢ BẢY mốc tuổi.
  assert.deepEqual(hoa, [],
    `mốc mà kỷ ${cao} (share cao nhất) KHÔNG phủ nhiều hơn kỷ ${thap} (share thấp nhất) nay là `
    + `[${hoa.join(',')}] — danh sách này phải RỖNG; dài ra là mẫu số vừa lệch ở một mốc nào đó `
    + '(hãy đo lại số ô đường của hai kỷ ấy trước khi nghi bảng `share`)');
});

test('MẢNG PHỦ — ĐỐI CHỨNG: chưa bỏ công thì chưa được thưởng (thành phố sơ khai vẫn phải thưa)', () => {
  // ⚠️ Không có vế này thì bản vá "bỏ trần tuyệt đối đi" cũng xanh — mà bỏ hẳn là sai: một thành
  // phố mới 1 công trình + 2 phiên sẽ mọc ngay mấy chục cái sân, tức phần thưởng đến TRƯỚC công
  // sức. Ý định của cái trần cũ là ĐÚNG; chỉ đơn vị của nó là sai.
  const ids = BLUEPRINT_CATALOG[14].slice(0, 1).map((bp) => bp.id);
  const soKhai = (computeCityLayout({
    built: ids, levels: { [ids[0]]: 1 }, era: 14, stats: { sessionCount: 2, streakLength: 0 },
  }).covers ?? []).length;
  assert.ok(soKhai <= 5,
    `kỷ rộng tay nhất mà mới 1 công trình + 2 phiên đã có ${soKhai} mảng phủ ⇒ thưởng trước công`);
  // …và nó phải LỚN LÊN thật, chứ không phải luôn luôn bằng 0.
  assert.ok(soMangPhu(14, 30) > soKhai * 3,
    'mảng phủ không lớn lên theo công sức — cái nhịp công sức đang chết cứng');
});

/* ════════════════════════════════════════════════════════════════════════════════════════════
 * "CHỈ THÊM, KHÔNG BAO GIỜ DỜI" — bất biến quan trọng nhất của cả mảng mật độ.
 *
 * Đàm nêu nó thành điều kiện cứng cho §2-B, nhưng nó cũng chính là thứ §2-C đang **tự nhận là
 * đúng theo cấu trúc** (mảng phủ nằm ở một mảng RIÊNG nên `deriveProps`/`deriveDwellings` không hề
 * bị đụng tới). ⚠️ Và "đúng theo cấu trúc" là đúng loại lời hứa chết trong im lặng khi phiên sau
 * đổi cấu trúc — nên nó phải thành một bài TEST, không phải một câu trong ADR.
 *
 * ⚠️ PHẠM VI, NÓI THẲNG RA ĐỂ KHÔNG AI ĐỌC NHẦM SỰ IM LẶNG THÀNH MỘT LỜI BẢO ĐẢM:
 *   · CÓ canh: **công trình** (theo `bpId`) và **nhà dân** (theo `index`) — những thứ Đàm KIẾM ĐƯỢC.
 *   · KHÔNG canh: cây, đèn, mảng phủ. Chúng CỐ Ý nhường chỗ — một cái cây đứng ở ô mà sau này thành
 *     nhà thì phải biến đi, và đó là hành vi đúng, không phải vi phạm.
 *
 * ⚠️ VÀ PHẦN NÀO Ở ĐÂY THẬT SỰ MỚI, ĐỂ KHÔNG AI TƯỞNG NÓ CANH NHIỀU HƠN NÓ CANH. Nửa "công trình"
 * đã có `BẤT BIẾN #2` canh từ lâu — phép phá "dời công trình theo số công trình đã xây" làm đỏ
 * SÁU bài, trong đó có bài ấy. Nửa **NHÀ DÂN theo trục THỜI GIAN** thì chưa ai canh: phép phá
 * "dời nhà dân theo số phiên" chỉ làm đỏ **một** bài, và đó là bài dưới đây.
 *
 * ⚠️⚠️ BẢN NÀY QUÉT ĐẦY ĐỦ, KHÔNG CÒN CHỌN TAY (Đàm yêu cầu 2026-08-19). Bản trước lấy 9 mốc phiên
 * chọn tay ([0, 4, 10, 20, 30, 50, 80, 120, 150]) rồi viết kết luận cho mọi mốc — **đúng hình dạng
 * đã sinh ra `TECH_DEBT #38`** (đo 3 kỷ rồi viết thành trần cho 15). `computeCityLayout` là hàm
 * THUẦN nên quét dày gần như miễn phí: đã ĐO — lưới tích đầy đủ 15 kỷ × 5 mốc công trình × 151 mốc
 * phiên = **11.325 lượt dựng trong 1,74 giây**. Không có cớ nào để đoán nữa.
 *
 * ⚠️ VÀ NÓ QUÉT **LƯỚI TÍCH**, KHÔNG PHẢI HAI TRỤC RỜI. Bản trước kiểm trục thời gian ở một giá trị
 * cố định của trục công trình, rồi kiểm trục công trình ở một giá trị cố định của trục thời gian —
 * hai lát cắt ấy KHÔNG chứng minh được gì cho phần còn lại của mặt phẳng. Bố cục là hàm của HAI
 * biến, và lời hứa là "lớn lên theo thứ tự tích": (n, s) ≤ (n′, s′) khi n ≤ n′ VÀ s ≤ s′.
 * Kiểm hai BƯỚC ĐƠN VỊ — (n, s) → (n, s+1) và (n, s) → (n+1, s) — là đủ cho toàn bộ thứ tự tích,
 * vì mọi cặp so sánh được đều nối với nhau bằng một đường đi gồm các bước ấy, và cả "tập con" lẫn
 * "cùng một ô" đều bắc cầu.
 *
 * ⚠️ VÀ ĐÂY LÀ BẰNG CHỨNG rằng lưới tích KHÔNG phải cầu toàn thừa thãi, chứ không phải một lý lẽ:
 * phép phá N6 dời nhà dân CHỈ ở đúng ô (3 công trình, ≥ 77 phiên) — một điểm nằm ngoài cả hai lát
 * cắt của bản cũ (bản cũ quét thời gian ở n = 5, quét tiến độ ở s = 60). Bản CŨ **xanh 2/2**; bản
 * này **đỏ ngay**: "kỷ 1, 3 công trình, 76 → 77 phiên: nd:9 bị DỜI từ ô 2,5 sang ô 9,5". Hai lát
 * cắt qua một mặt phẳng thì để lọt cả phần mặt phẳng còn lại, và §2-B sẽ vặn đúng vùng ấy.
 * ════════════════════════════════════════════════════════════════════════════════════════════ */

/** Bảng "ô nào của ai" cho một mốc tiến độ: công trình theo `bpId`, nhà dân theo `index`. */
function soDoODat(era, built, sessionCount) {
  const l = computeCityLayout({
    built,
    levels: Object.fromEntries(built.map((id) => [id, 1])),
    era,
    stats: { sessionCount, streakLength: 9 },
  });
  const o = new Map();
  for (const b of l.buildings) o.set(`ct:${b.bpId}`, `${b.x},${b.y}`);
  for (const d of l.dwellings ?? []) o.set(`nd:${d.index}`, `${d.x},${d.y}`);
  return o;
}

/** Mọi thứ có trong `cu` phải còn nguyên vị trí trong `moi`. `moi` được phép có thêm. */
function khongDoiCho(cu, moi, boiCanh) {
  for (const [ai, oCu] of cu) {
    const oMoi = moi.get(ai);
    assert.ok(oMoi !== undefined, `${boiCanh}: ${ai} BIẾN MẤT (đang ở ${oCu})`);
    assert.equal(oMoi, oCu, `${boiCanh}: ${ai} bị DỜI từ ô ${oCu} sang ô ${oMoi}`);
  }
}

test('CHỈ THÊM — quét ĐẦY ĐỦ lưới tích (5 mốc công trình × 151 mốc phiên × 15 kỷ)', () => {
  const PHIEN_MAX = 150;
  let soSanhPhien = 0;      // bước đơn vị theo trục THỜI GIAN
  let soSanhCongTrinh = 0;  // bước đơn vị theo trục TIẾN ĐỘ XÂY
  let themTheoCongTrinh = 0; // trong đó, bao nhiêu bước THẬT SỰ mọc thêm chỗ ở
  const themTheoPhienMoiKy = []; // đếm RIÊNG từng kỷ — xem gác đối chứng ở cuối

  for (let era = 1; era <= 15; era += 1) {
    const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    let hangTruoc = null; // cả một hàng (mọi mốc phiên) của `nb − 1`
    let themTheoPhien = 0;

    for (let nb = 1; nb <= ids.length; nb += 1) {
      const built = ids.slice(0, nb);
      const hangNay = [];
      for (let s = 0; s <= PHIEN_MAX; s += 1) hangNay.push(soDoODat(era, built, s));

      // Bước ngang: thêm một phiên.
      for (let s = 0; s < PHIEN_MAX; s += 1) {
        khongDoiCho(hangNay[s], hangNay[s + 1], `kỷ ${era}, ${nb} công trình, ${s} → ${s + 1} phiên`);
        soSanhPhien += 1;
        if (hangNay[s + 1].size > hangNay[s].size) themTheoPhien += 1;
      }

      // Bước dọc: xây thêm một công trình, giữ nguyên số phiên.
      if (hangTruoc) {
        for (let s = 0; s <= PHIEN_MAX; s += 1) {
          khongDoiCho(hangTruoc[s], hangNay[s], `kỷ ${era}, ${s} phiên, xây tới công trình thứ ${nb}`);
          soSanhCongTrinh += 1;
          if (hangNay[s].size > hangTruoc[s].size) themTheoCongTrinh += 1;
        }
      }
      hangTruoc = hangNay;
    }
    themTheoPhienMoiKy.push(themTheoPhien);
  }

  // Gác chạy-rỗng, HỎI TỪNG TRỤC MỘT: một `continue` đặt nhầm chỗ, hay một vòng lặp thu về đúng
  // một giá trị, sẽ làm bài này im lặng không so gì cả trên đúng cái trục đang bị phá.
  assert.equal(soSanhPhien, 15 * BUILDINGS_PER_ERA * PHIEN_MAX,
    'trục THỜI GIAN so thiếu — vòng lặp đã chạy rỗng');
  assert.equal(soSanhCongTrinh, 15 * (BUILDINGS_PER_ERA - 1) * (PHIEN_MAX + 1),
    'trục TIẾN ĐỘ XÂY so thiếu — vòng lặp đã chạy rỗng');

  // ĐỐI CHỨNG: "không dời" là một lời hứa RỖNG TUẾCH nếu thành phố đứng im. Hỏi TỪNG TRỤC MỘT, và
  // trên trục thời gian thì hỏi TỪNG KỶ MỘT — hỏi tổng thì một kỷ đóng băng vẫn được 14 kỷ kia che,
  // đúng cái phễu mà chính §2-C vừa ghi thành bài học.
  //
  // ⚠️ NGƯỠNG LẤY TỪ SỐ ĐO, KHÔNG PHẢI "nới cho chắc" (bài học Phase 9A): đo ngày 2026-08-19, mỗi
  // kỷ có 85–150 bước phiên làm thành phố mọc thêm trên tổng 750 bước (kỷ 1 thấp nhất = 85, kỷ
  // 14/15 cao nhất = 150; tổng 1.855/11.250 = 16,5%). Sàn 40 nằm dưới mốc thấp nhất ĐO ĐƯỢC đúng
  // hơn hai lần — đủ chỗ cho việc chỉnh nhịp hợp lệ, mà một kỷ bị đóng băng thì tụt về 0 và đỏ ngay.
  themTheoPhienMoiKy.forEach((t, i) => {
    assert.ok(t >= 40,
      `kỷ ${i + 1}: chỉ ${t}/750 bước phiên làm thành phố mọc thêm — kỷ này gần như đứng im theo thời gian`);
  });
  // Trục công trình thì KHÔNG cần ngưỡng: xây thêm một công trình LUÔN thêm một khoá `ct:`, nên
  // 100% là một lời hứa CẤU TRÚC, không phải một con số may rủi. Nó bắt được ca "công trình thứ n
  // lặng lẽ không được đặt" — thứ mà một ngưỡng phần trăm sẽ cho qua.
  assert.equal(themTheoCongTrinh, soSanhCongTrinh,
    'có bước xây thêm công trình mà thành phố KHÔNG lớn thêm — một công trình đã không được đặt');
});
