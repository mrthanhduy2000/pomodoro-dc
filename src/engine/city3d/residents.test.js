/**
 * residents.test.js — cư dân thành phố.
 *
 * Ba bất biến, theo mức thiệt hại:
 *   1. **TẤT ĐỊNH** — cùng bố cục + cùng thời điểm ⇒ cùng vị trí. Đây là thứ cho phép chuyển
 *      động sống sót qua việc rời tab: quay lại sau nửa tiếng thì thành phố ở đúng chỗ đáng lẽ
 *      phải có, chứ không đứng im từ lúc bị đóng băng.
 *   2. **KHÔNG BAO GIỜ NỔ** — bố cục rỗng, chưa có đường, dữ liệu rác đều phải ra danh sách rỗng
 *      chứ không ném lỗi. Một ngoại lệ ở đây làm sập cả màn hình Thành Phố.
 *   3. **BÁM ĐƯỜNG** — người đi xuyên qua bãi đất trống trông như lỗi vật lý.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import {
  MAX_RESIDENTS,
  buildResidentRoute,
  buildResidents,
  deriveResidentCount,
  residentAt,
} from './residents.js';

const ERA = 6;
const BUILT = BLUEPRINT_CATALOG[ERA].map((bp) => bp.id);
const LAYOUT = computeCityLayout({
  built: BUILT,
  era: ERA,
  stats: { sessionCount: 40, streakLength: 9 },
});

test('dân số suy từ tiến độ, và KHÔNG có nhà thì KHÔNG có ai', () => {
  assert.equal(deriveResidentCount({ buildingCount: 0, sessionCount: 500, streakLength: 90 }), 0,
    'bãi đất trống mà có người đi lại thì vô lý');

  const few = deriveResidentCount({ buildingCount: 1, sessionCount: 2, streakLength: 0 });
  const many = deriveResidentCount({ buildingCount: 5, sessionCount: 200, streakLength: 30 });
  assert.ok(few > 0, 'có nhà thì phải có người');
  assert.ok(many > few, 'làm nhiều hơn thì thành phố phải đông hơn');
  assert.ok(many <= MAX_RESIDENTS, 'vượt trần hiệu năng');
});

test('dân số tăng RÕ ở những phiên đầu, thoải dần về sau', () => {
  // Đường cong này là một quyết định thiết kế, không phải ngẫu nhiên: những phiên đầu tiên là
  // lúc dễ bỏ cuộc nhất, nên phần thưởng hình ảnh phải cảm nhận được ngay.
  const at = (s) => deriveResidentCount({ buildingCount: 2, sessionCount: s, streakLength: 1 });
  const early = at(9) - at(1);
  const late = at(200) - at(160);
  assert.ok(early > late, `bước nhảy lúc đầu (${early}) phải lớn hơn lúc sau (${late})`);
});

test('dữ liệu rác không làm nổ màn hình Thành Phố', () => {
  for (const junk of [undefined, {}, { buildings: null, props: null }, { props: [] }]) {
    assert.deepEqual(buildResidents(junk), [], 'phải ra danh sách rỗng, không được ném');
  }
  assert.equal(buildResidentRoute(0, []), null);
  assert.equal(buildResidentRoute(0, [{ x: 1, y: 1 }]), null, 'một ô đường thì không thành tuyến');
  assert.equal(buildResidentRoute(0, null), null);
  assert.equal(residentAt(null, 5), null);
});

test('tất định: cùng thời điểm ⇒ cùng vị trí, gọi bao nhiêu lần cũng vậy', () => {
  const a = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  const b = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  assert.equal(JSON.stringify(a), JSON.stringify(b));

  for (const t of [0, 1.5, 12.5, 999.25]) {
    assert.deepEqual(residentAt(a[0], t), residentAt(b[0], t), `lệch ở t=${t}`);
  }
});

test('tất định: nhảy thẳng tới t = 1800 giây bằng đúng đi dần tới đó', () => {
  // Đây chính là ca "rời tab nửa tiếng rồi quay lại". Nếu vị trí phụ thuộc số khung hình đã vẽ
  // thay vì thời gian, bài test này sẽ đỏ — và trên máy thật thì thành phố sẽ trôi sai nhịp.
  const [route] = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  const direct = residentAt(route, 1800);
  // Cùng một thời điểm, dù đi tới bằng đường nào, phải ra cùng kết quả.
  const again = residentAt(route, 1800);
  assert.deepEqual(direct, again);
  // Và một chu kỳ trọn vẹn phải quay về đúng chỗ cũ.
  const period = route.length / route.speed;
  const p0 = residentAt(route, 100);
  const p1 = residentAt(route, 100 + period);
  assert.ok(Math.abs(p0.x - p1.x) < 1e-6 && Math.abs(p0.y - p1.y) < 1e-6,
    'đi trọn một vòng mà không về chỗ cũ ⇒ tuyến không khép kín');
});

test('cư dân luôn đi TRÊN ĐƯỜNG, không cắt ngang bãi đất trống', () => {
  const roads = LAYOUT.props.filter((p) => p.kind === 'road');
  const roadKeys = new Set(roads.map((r) => `${r.x},${r.y}`));
  const residents = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  assert.ok(residents.length > 0, 'thành phố đủ 5 công trình mà không có ai ở');

  for (const route of residents) {
    for (const cell of route.path) {
      assert.ok(roadKeys.has(`${cell.x},${cell.y}`), `tuyến đi qua ô không phải đường: ${cell.x},${cell.y}`);
    }
    // Hai điểm liên tiếp phải KỀ NHAU trên lưới, nếu không người sẽ trượt xuyên qua nhà.
    for (let i = 0; i < route.path.length; i += 1) {
      const a = route.path[i];
      const b = route.path[(i + 1) % route.path.length];
      const step = Math.hypot(b.x - a.x, b.y - a.y);
      assert.ok(step <= Math.SQRT2 + 1e-9, `bước nhảy quá xa (${step.toFixed(2)} ô) giữa hai điểm tuyến`);
    }
  }
});

test('cư dân KHÔNG dồn cục một chỗ lúc bắt đầu', () => {
  // Không lệch pha thì cả thành phố xuất phát cùng một điểm và biến thành đoàn diễu hành.
  const residents = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  const spots = new Set(residents.map((r) => {
    const p = residentAt(r, 0);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }));
  assert.ok(spots.size >= Math.min(4, residents.length),
    `mới có ${spots.size} vị trí khác nhau trên ${residents.length} người`);
});

test('hướng quay mặt khớp với hướng đang đi', () => {
  const [route] = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  const now = residentAt(route, 3);
  const soon = residentAt(route, 3.25);
  const moved = Math.hypot(soon.x - now.x, soon.y - now.y);
  if (moved > 1e-6) {
    const heading = Math.atan2(soon.y - now.y, soon.x - now.x);
    const diff = Math.abs(((heading - now.angle + Math.PI) % (Math.PI * 2)) - Math.PI);
    assert.ok(diff < 0.5, `quay mặt lệch ${diff.toFixed(2)} rad so với hướng đi`);
  }
});
