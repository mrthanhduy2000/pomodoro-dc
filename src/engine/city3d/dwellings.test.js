/**
 * dwellings.test.js — khoá lời hứa "mỗi ~2 phiên thành phố mọc thêm một căn nhà, và nó mọc ĐÚNG CHỖ".
 *
 * ⚠️ Loại lỗi mà file này canh đều im lặng: nhà mọc đè lên ô đã hứa cho kỳ quan, nhà mọc giữa lòng
 * đường, hay nhà mọc trước cả công trình đầu tiên. Không cái nào làm đỏ build hay lint — bố cục vẫn
 * hợp lệ, chỉ là sai. Chúng chỉ lộ ra khi có người ngồi nhìn ảnh chụp, mà ảnh chụp thì không chạy
 * trong CI.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SESSIONS_PER_DWELLING, districtAt, densityCap, deriveDwellings,
  dwellingPlotCount, dwellingPlots, sessionsToNextDwelling,
} from './dwellings';
import { CITY_GRID_SIZE, isBuildingZone } from '../cityGrid';
import { buildRoadPlan } from '../roadPlan';
import { getNetworkStyle } from './networkStyle';
import { computeCityLayout } from '../cityLayout';
import { BLUEPRINT_CATALOG } from '../constants';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const key = (c) => `${c.x},${c.y}`;

test('Ô ĐẤT TRỐNG: không ô nào nằm trên đường hay trong khu đất kỳ quan — ĐỦ 15 KỶ', () => {
  // ⚠️ NAY PHẢI DUYỆT CẢ 15 KỶ. Trước ADR-059 danh sách ô đất là một hằng số cấp module nên hỏi
  // một lần là đủ; nay mỗi kỷ có một mạng đường riêng, nên "ô này có nằm trên đường không" là một
  // câu hỏi THEO KỶ. Hỏi bằng `isRoadLine` (bàn cờ cũ) thì bài test canh một thành phố không còn
  // tồn tại — và nó sẽ XANH trong khi nhà dân mọc giữa lòng đường ở 14/15 kỷ.
  for (const era of ERAS) {
    const plots = dwellingPlots(era);
    assert.ok(plots.length > 0, `kỷ ${era}: không còn ô đất nào`);
    const duong = new Set(
      buildRoadPlan(era, getNetworkStyle(era)).cells.map((c) => `${c.x}|${c.y}`),
    );
    for (const plot of plots) {
      assert.ok(!duong.has(`${plot.x}|${plot.y}`), `kỷ ${era}: ô (${plot.x},${plot.y}) nằm trên đường`);
      assert.ok(!isBuildingZone(plot.x, plot.y), `kỷ ${era}: ô (${plot.x},${plot.y}) lấn khu đất kỳ quan`);
      assert.ok(plot.x >= 0 && plot.x < CITY_GRID_SIZE && plot.y >= 0 && plot.y < CITY_GRID_SIZE);
    }
    // Không ô nào trùng ô nào — hai căn nhà chồng lên nhau là lỗi im lặng nhất trong cả file này.
    assert.equal(new Set(plots.map(key)).size, plots.length, `kỷ ${era}: có ô trùng`);
  }
});

test('BA KHU ĐỀU CÓ THẬT — không khu nào rỗng', () => {
  // ⚠️ Đàm yêu cầu đích danh "ngoại vi → khu dân cư → trung tâm → landmark". Nếu một ngưỡng bị
  // chỉnh lệch thì một khu có thể biến mất sạch mà mọi bài test khác vẫn xanh, và thành phố lại
  // thành "rải rác ngẫu nhiên" — đúng thứ anh nói là KHÔNG được.
  // ⚠️ VÀ NAY PHẢI ĐÚNG Ở CẢ 15 KỶ — đây chính là bài test bắt được hồi quy của ADR-059: mạng
  // đường mới mở lại phần giữa lưới, nên nếu khu vẫn chia theo KHOẢNG CÁCH TUYỆT ĐỐI thì cả 17
  // căn của kỷ 1 rơi hết vào `civic` và hai khu kia biến mất. Xem `khuTheoHang` ở `dwellings.js`.
  for (const era of ERAS) {
    const byDistrict = new Map();
    for (const plot of dwellingPlots(era)) {
      byDistrict.set(plot.district, (byDistrict.get(plot.district) ?? 0) + 1);
    }
    for (const d of ['outskirts', 'residential', 'civic']) {
      assert.ok(byDistrict.get(d) > 0, `kỷ ${era}: khu "${d}" không có ô nào`);
    }
    assert.equal([...byDistrict.values()].reduce((a, b) => a + b, 0), dwellingPlotCount(era));
  }
});

test('KHU ĐI THEO KHOẢNG CÁCH TỚI TÂM, không đảo lộn', () => {
  assert.equal(districtAt(5, 5), 'civic');        // sát tâm
  assert.equal(districtAt(6, 6), 'civic');
  assert.equal(districtAt(2, 5), 'residential');
  assert.equal(districtAt(1, 1), 'outskirts');    // góc xa nhất
  assert.equal(districtAt(0, 0), 'outskirts');
});

test('CHƯA CÓ CÔNG TRÌNH NÀO THÌ CHƯA CÓ NHÀ DÂN', () => {
  // Công trình đầu tiên là thứ Đàm đổi 4–11 phiên để có. Nếu nó mọc lên giữa một thị trấn có sẵn
  // thì mất trọn ý nghĩa — cùng luật đang áp cho đường sá.
  assert.deepEqual(deriveDwellings({ era: 3, buildingCount: 0, sessionCount: 500 }), []);
  assert.equal(sessionsToNextDwelling({ era: 3, buildingCount: 0, sessionCount: 500 }), null);
  assert.ok(deriveDwellings({ era: 3, buildingCount: 1, sessionCount: 500 }).length > 0);
});

test('MỖI 2 PHIÊN THÊM MỘT CĂN — và câu đếm ngược khớp với chính phép đếm đó', () => {
  const base = { era: 8, buildingCount: 1 };
  assert.equal(deriveDwellings({ ...base, sessionCount: 0 }).length, 0);
  assert.equal(deriveDwellings({ ...base, sessionCount: 1 }).length, 0);
  assert.equal(deriveDwellings({ ...base, sessionCount: 2 }).length, 1);
  assert.equal(deriveDwellings({ ...base, sessionCount: 3 }).length, 1);
  assert.equal(deriveDwellings({ ...base, sessionCount: 4 }).length, 2);

  // ⚠️ Câu đếm ngược phải SUY TỪ cùng một phép chia, không phải viết cứng "còn 2 phiên nữa". Lệch
  // nhau thì màn hình hứa một đằng, thành phố mọc một nẻo — và không có gì đỏ lên.
  for (let s = 0; s < 10; s += 1) {
    const now = deriveDwellings({ ...base, sessionCount: s }).length;
    const wait = sessionsToNextDwelling({ ...base, sessionCount: s });
    assert.equal(deriveDwellings({ ...base, sessionCount: s + wait }).length, now + 1,
      `sau ${wait} phiên nữa (từ mốc ${s}) phải có đúng thêm 1 căn`);
  }
  assert.ok(SESSIONS_PER_DWELLING >= 1);
});

test('TRẦN MẬT ĐỘ: kỷ càng hiện đại càng dày, và không bao giờ vượt số ô đất có thật', () => {
  let prevDense = 0;
  for (const era of ERAS) {
    const cap = densityCap(era);
    assert.ok(cap > 0 && cap <= dwellingPlotCount(era), `kỷ ${era} trần ${cap} vô lý`);
    assert.equal(deriveDwellings({ era, buildingCount: 5, sessionCount: 100000 }).length, cap,
      `kỷ ${era} không dừng ở trần mật độ`);
    if (era > 1) {
      // Không đòi tăng nghiêm ngặt (kỷ 12 thời chiến thưa hơn kỷ 11 là có chủ đích), chỉ đòi
      // đầu và cuối hành trình phải khác nhau rõ.
      assert.ok(cap >= prevDense - 3, `kỷ ${era} thưa hụt hẳn so với kỷ trước`);
    }
    prevDense = cap;
  }
  assert.ok(densityCap(15) > densityCap(1) * 1.4,
    'kỷ 15 phải dày hơn kỷ 1 rõ rệt — nếu không thì 15 kỷ đọc ra cùng một mật độ');
});

test('TẤT ĐỊNH: cùng đầu vào cho ra cùng thành phố, mãi mãi', () => {
  // Cùng lời hứa ADR-007 đã đưa cho VỊ TRÍ công trình, nay áp cho nhà dân. Dùng `Math.random` ở
  // tầng này sẽ phá nó âm thầm: thành phố vẫn chạy, chỉ là mỗi lần mở lại trông một khác.
  for (const era of [1, 7, 15]) {
    const a = deriveDwellings({ era, buildingCount: 3, sessionCount: 60 });
    const b = deriveDwellings({ era, buildingCount: 3, sessionCount: 60 });
    assert.deepEqual(a, b);
  }
  // Và nhà đã mọc thì KHÔNG được dời chỗ khi có thêm phiên — thành phố lớn thêm, không xáo lại.
  const early = deriveDwellings({ era: 9, buildingCount: 2, sessionCount: 20 });
  const later = deriveDwellings({ era: 9, buildingCount: 2, sessionCount: 40 });
  assert.ok(later.length > early.length);
  assert.deepEqual(later.slice(0, early.length), early, 'nhà cũ bị xáo chỗ khi thành phố lớn lên');
});

test('ĐỐI CHỨNG TOÀN LƯỚI: nhà dân · công trình · giàn giáo · cảnh vật không ai đứng đè ai', () => {
  // ⚠️ Bài quan trọng nhất file. Sáu bài trên canh `dwellings.js` một mình; bài này dựng cả bố cục
  // thật qua `computeCityLayout` và đếm ô — đúng bài học "test tầng engine chứng minh hàm chạy
  // đúng, không chứng minh hàm được nối đúng" (Phase 4H).
  for (const era of ERAS) {
    const ids = (BLUEPRINT_CATALOG[era] ?? []).map((b) => b.id);
    const layout = computeCityLayout({
      built: ids.slice(0, 3),
      era,
      stats: { sessionCount: 400 },
      pending: [{ bpId: ids[3], sessionsRemaining: 2 }],
    });

    const seen = new Map();
    const claim = (cell, what) => {
      const k = key(cell);
      assert.equal(seen.get(k), undefined,
        `kỷ ${era} ô (${k}): "${what}" đứng đè lên "${seen.get(k)}"`);
      seen.set(k, what);
    };
    for (const b of layout.buildings) claim(b, 'công trình');
    for (const s of layout.scaffolds) claim(s, 'giàn giáo');
    for (const h of layout.dwellings) claim(h, 'nhà dân');
    for (const p of layout.props) claim(p, 'cảnh vật');

    assert.ok(layout.dwellings.length > 0, `kỷ ${era} không có nhà dân nào`);
    // ⚠️ Hỏi mạng đường CỦA CHÍNH KỶ ẤY, không hỏi bàn cờ cũ (`isRoadLine`). Sau ADR-059 mỗi kỷ
    // một mạng riêng, nên một phép hỏi theo hằng số sẽ xanh trong khi nhà mọc giữa lòng đường.
    const duong = new Set(
      buildRoadPlan(era, getNetworkStyle(era)).cells.map((c) => `${c.x}|${c.y}`),
    );
    for (const h of layout.dwellings) {
      assert.ok(!duong.has(`${h.x}|${h.y}`), `kỷ ${era}: nhà dân (${key(h)}) nằm giữa đường`);
      assert.ok(!isBuildingZone(h.x, h.y), `kỷ ${era}: nhà dân (${key(h)}) lấn đất kỳ quan`);
    }
  }
});
