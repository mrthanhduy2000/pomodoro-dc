/**
 * flora.test.js — khoá những TÍNH CHẤT làm cho một cái cây đọc ra là cây chứ không phải hình nón.
 *
 * ⚠️ ĐỌC KỸ CHỖ NÀY TRƯỚC KHI THÊM BÀI: bài test ở đây cố ý KHÔNG so hình khối với những con số
 * viết cứng ("thuỳ thứ hai phải rộng 0,31"). Con số viết cứng chỉ khoá được đúng cái hình hiện tại,
 * và nó sẽ đỏ ngay lần đầu có người chỉnh mỹ thuật — tức nó trừng phạt việc làm đẹp thêm, đúng thứ
 * dự án cần khuyến khích. Cái đáng khoá là những tính chất mà mất đi thì cây quay về "hình nón trên
 * que", và cả bốn tính chất ấy đã được ghi rõ ở đầu `flora.js`: viền không đều · có bóng trong tán ·
 * không đối xứng xoay · chỗ nối thân–tán bị che.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { growTree, growEraTree } from './flora.js';
import { FLORA_SPECIES, FLORA_STYLES } from './floraStyle.js';
import { PART_ROLES, countSpecTriangles } from './parts.js';

const ROLE_SET = new Set(PART_ROLES);
const LEAFY = FLORA_SPECIES.filter((s) => s !== 'bush');
const ERAS = Object.keys(FLORA_STYLES).map(Number);

/** Chữ ký CẤU TRÚC: số khối + số cạnh + vai màu, làm tròn tỉ lệ. KHÔNG gồm kích thước tuyệt đối. */
function structure(parts) {
  return parts
    .map((p) => `${p.sides}/${p.role}/${Math.round((p.taper ?? 0) * 5)}`)
    .join('|');
}

test('mọi loài sinh ra khối hợp lệ, vai màu đã khai, kích thước dương', () => {
  for (const species of FLORA_SPECIES) {
    for (let i = 0; i < 6; i += 1) {
      const parts = growTree({ species, seed: `s${i}`, size: 1 });
      assert.ok(parts.length > 0, `"${species}" không sinh khối nào`);
      for (const p of parts) {
        assert.ok(ROLE_SET.has(p.role), `"${species}" dùng vai lạ: ${p.role}`);
        assert.ok(p.w > 0 && p.h > 0, `"${species}" có khối kích thước 0`);
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z),
          `"${species}" có khối ở toạ độ NaN`);
      }
    }
  }
});

test('CÂY KHÔNG CÒN LÀ "hình nón trên que": tán phải có từ 2 thuỳ trở lên', () => {
  // Đây là bài test trung tâm của Phase 8D. Bản cũ dựng cây bằng 2–3 khối tổng cộng, tức tán là
  // MỘT khối lồi duy nhất — và một khối lồi thì tất yếu cho viền trơn, một dải sáng, đối xứng xoay
  // hoàn hảo. Ba tính chất ấy KHÔNG chữa được bằng cách tăng số cạnh hay số tam giác.
  for (const species of LEAFY) {
    for (let i = 0; i < 8; i += 1) {
      const parts = growTree({ species, seed: `tán-${i}`, size: 1 });
      const canopy = parts.filter((p) => p.role === 'leaf' || p.role === 'leaf2');
      assert.ok(canopy.length >= 2,
        `"${species}" (hạt ${i}) chỉ có ${canopy.length} khối tán ⇒ quay về một khối lồi duy nhất`);
      assert.ok(parts.some((p) => p.role === 'wood'), `"${species}" không có thân gỗ nào`);
    }
  }
});

test('tán có CẢ HAI mặt sáng và khuất — thiếu một vế thì tán phẳng lì một màu', () => {
  // Vật liệu tô màu THEO VAI. Cả tán cùng một vai ⇒ ba thuỳ chồng nhau chỉ phân biệt được bằng
  // bóng đổ, mà bóng đổ ở cỡ vài chục điểm ảnh thì gần như không thấy. Xem ghi chú `SUN`/`SHADE`.
  for (const species of LEAFY) {
    let sawBoth = 0;
    for (let i = 0; i < 8; i += 1) {
      const parts = growTree({ species, seed: `màu-${i}`, size: 1 });
      const hasSun = parts.some((p) => p.role === 'leaf');
      const hasShade = parts.some((p) => p.role === 'leaf2');
      if (hasSun && hasShade) sawBoth += 1;
    }
    assert.ok(sawBoth >= 6,
      `"${species}": chỉ ${sawBoth}/8 hạt có cả mặt sáng lẫn mặt khuất`);
  }
});

test('thuỳ tán LỆCH TÂM — đối xứng xoay hoàn hảo là dấu vân tay của hình học', () => {
  // Nếu mọi thuỳ đều nằm đúng trục thân (x = z = 0) thì xoay cái cây bao nhiêu độ cũng ra cùng một
  // hình bóng, và mười cái cây cạnh nhau đọc ra thành mười bản sao dù đã xoay khác nhau.
  for (const species of LEAFY) {
    let offCentre = 0;
    for (let i = 0; i < 8; i += 1) {
      const parts = growTree({ species, seed: `lệch-${i}`, size: 1 });
      const canopy = parts.filter((p) => p.role === 'leaf' || p.role === 'leaf2');
      if (canopy.some((p) => Math.hypot(p.x ?? 0, p.z ?? 0) > 0.02)) offCentre += 1;
    }
    assert.ok(offCentre >= 6,
      `"${species}": chỉ ${offCentre}/8 hạt có thuỳ lệch tâm ⇒ tán đối xứng xoay như cái nón`);
  }
});

test('cùng hạt giống → cây y hệt, mãi mãi (bất biến "bảo tàng bất động", ADR-007)', () => {
  for (const species of FLORA_SPECIES) {
    assert.deepEqual(
      growTree({ species, seed: 'ô|3|5', size: 1.1 }),
      growTree({ species, seed: 'ô|3|5', size: 1.1 }),
      `"${species}" ra hai kết quả khác nhau cho cùng một hạt`,
    );
  }
});

test('mỗi loài phải cho NHIỀU dáng khác nhau, không phải một khuôn đổi cỡ', () => {
  // ⚠️ Bài test của một lỗi ĐÃ ĐO ĐƯỢC, không phải một giả định: bản trước Phase 8D cho **đúng MỘT
  // cấu trúc trên 40 hạt giống** — hạt chỉ đổi được chiều cao. Và bản đầu của chính Phase 8D vẫn
  // còn 4/40 ở kỷ 9, vì `cypress`/`streetTree` viết cứng `sides` và `taper`. Chữ ký ở đây cố ý BỎ
  // QUA kích thước: kích thước đổi không làm đổi HÌNH BÓNG, mà hình bóng mới là thứ mắt đọc.
  for (const species of FLORA_SPECIES) {
    const seen = new Set();
    for (let i = 0; i < 40; i += 1) {
      seen.add(structure(growTree({ species, seed: `dáng-${i}`, size: 1 })));
    }
    assert.ok(seen.size >= 6,
      `"${species}": 40 hạt chỉ ra ${seen.size} dáng ⇒ vẫn là một cái khuôn`);
  }
});

test('BỤI phải thấp và mọc TỪ đất, không phải một cái cây thu nhỏ', () => {
  // ⚠️ Khoá lại lỗi đã xảy ra thật trong phiên làm Phase 8D: "bụi" ở kỷ 1 ra 5 khối, 212 tam giác,
  // CAO 0,94 — một cái cây hoàn chỉnh đứng ở chỗ đáng lẽ là bụi thấp. Xem `floraStyle.js`.
  for (const era of ERAS) {
    for (let i = 0; i < 5; i += 1) {
      const parts = growEraTree({ era, seed: `bụi-${i}`, species: 'bush' });
      const top = Math.max(...parts.map((p) => (p.y ?? 0) + p.h));
      assert.ok(top < 0.42, `kỷ ${era}: bụi cao ${top.toFixed(2)} — đó là một cái cây`);
      assert.ok(parts.every((p) => p.role !== 'wood'), `kỷ ${era}: bụi lại mọc ra thân gỗ`);
      assert.ok(parts.some((p) => (p.y ?? 0) < 0),
        `kỷ ${era}: bụi đặt LÊN mặt đất thay vì mọc TỪ đất — hở một khe sáng dưới gốc`);
    }
  }
});

test('không có khối nào lơ lửng dưới đáy cây — vật bay là lỗi thấy ngay bằng mắt', () => {
  for (const species of FLORA_SPECIES) {
    for (let i = 0; i < 6; i += 1) {
      const parts = growTree({ species, seed: `đáy-${i}`, size: 1 });
      const floor = Math.min(...parts.map((p) => p.y ?? 0));
      assert.ok(floor <= 0.001,
        `"${species}": khối thấp nhất ở y=${floor.toFixed(3)} ⇒ cả cây treo trên không`);
    }
  }
});

test('mức chi tiết THẤP phải rẻ hơn mức CAO ở mọi loài — nếu không thì cái núm LOD không nối', () => {
  // Cùng hình dạng sai với bài học Phase 7A: một cái núm không nối vào đâu vẫn "chạy" bình thường,
  // và chỉ lộ ra khi đo. Ở đây `lowDetail` là công tắc DUY NHẤT bảo vệ máy yếu.
  for (const species of FLORA_SPECIES) {
    let cheaper = 0;
    for (let i = 0; i < 10; i += 1) {
      const hi = growTree({ species, seed: `lod-${i}`, size: 1, detail: 'high' });
      const lo = growTree({ species, seed: `lod-${i}`, size: 1, detail: 'low' });
      assert.ok(lo.length > 0, `"${species}" ở mức thấp biến mất hẳn`);
      if (lo.length < hi.length) cheaper += 1;
      assert.ok(lo.length <= hi.length, `"${species}": mức thấp lại NHIỀU khối hơn mức cao`);
    }
    assert.ok(cheaper >= 7,
      `"${species}": mức thấp chỉ rẻ hơn ở ${cheaper}/10 hạt ⇒ núm LOD gần như không tác dụng`);
  }
});

test('NGÂN SÁCH TAM GIÁC: một cái cây không được đắt hơn một căn nhà', () => {
  // Trần này là thứ giữ cho "nhiều thuỳ hơn" không lặng lẽ trượt thành "nhiều thuỳ vô hạn". Con số
  // 340 đo từ loài đắt nhất (`palm`: thân nhiều đốt + 7 tàu lá + búp ngọn) rồi chừa ~25% biên.
  for (const species of FLORA_SPECIES) {
    for (const detail of ['high', 'low']) {
      let worst = 0;
      for (let i = 0; i < 30; i += 1) {
        const parts = growTree({ species, seed: `ns-${i}`, size: 1.2, detail });
        worst = Math.max(worst, countSpecTriangles(parts));
      }
      assert.ok(worst <= 340,
        `"${species}" (${detail}) tốn tới ${worst} tam giác cho MỘT cái cây`);
    }
  }
});

test('cây theo kỷ: 15 kỷ không được ra cùng một rừng', () => {
  // Đo ở tầng CÂY (không phải tầng bảng): bảng khai khác nhau mà cây ra giống nhau thì bảng vô
  // nghĩa. Đây đúng là ca "một bài test xanh không cho biết CÁI GÌ đang giữ nó xanh" (Phase 4D).
  const perEra = ERAS.map((era) => {
    const seen = new Set();
    for (let i = 0; i < 25; i += 1) {
      seen.add(structure(growEraTree({ era, seed: `kỷ${era}-${i}` })));
    }
    return { era, seen };
  });

  for (const { era, seen } of perEra) {
    assert.ok(seen.size >= 8, `kỷ ${era}: 25 hạt chỉ ra ${seen.size} dáng cây`);
  }
  // Và hai kỷ bất kỳ không được dùng chung TOÀN BỘ kho dáng. Duyệt tổ hợp đôi, không duyệt danh
  // sách theo thứ tự — bài học `daylight.test.js`: cặp đầu-cuối sẽ không bao giờ được đem so.
  for (let i = 0; i < perEra.length; i += 1) {
    for (let j = i + 1; j < perEra.length; j += 1) {
      const a = perEra[i];
      const b = perEra[j];
      const shared = [...a.seen].filter((s) => b.seen.has(s)).length;
      assert.ok(shared < Math.min(a.seen.size, b.seen.size),
        `kỷ ${a.era} và kỷ ${b.era} ra kho dáng cây trùng khít nhau`);
    }
  }
});

test('cỡ cây đi theo `scale` của kỷ — bảng khai to mà cây không to thì bảng chỉ để trang trí', () => {
  const bySpecies = 'conifer';
  const small = growTree({ species: bySpecies, seed: 'cỡ', size: 0.82 });
  const large = growTree({ species: bySpecies, seed: 'cỡ', size: 1.20 });
  const top = (parts) => Math.max(...parts.map((p) => (p.y ?? 0) + p.h));
  assert.ok(top(large) > top(small) * 1.3,
    `cây kỷ to (${top(large).toFixed(2)}) không cao hơn cây kỷ nhỏ (${top(small).toFixed(2)})`);
});

test('loài lạ → lùi về cây tán rộng, KHÔNG ném lỗi (dữ liệu cloud có thể hỏng)', () => {
  for (const bad of [undefined, null, 'cây-ma', 42, {}]) {
    const parts = growTree({ species: bad, seed: 'x', size: 1 });
    assert.ok(parts.length > 0, `loài "${bad}" làm cây biến mất`);
    for (const p of parts) assert.ok(ROLE_SET.has(p.role));
  }
  for (const bad of [undefined, null, 0, 99, 'bảy', NaN]) {
    assert.ok(growEraTree({ era: bad, seed: 'x' }).length > 0, `kỷ "${bad}" làm cây biến mất`);
  }
});

test('cỡ rác → vẫn ra cây cỡ chuẩn, không ra cây kích thước âm', () => {
  for (const bad of [0, -3, NaN, undefined, 'to']) {
    const parts = growTree({ species: 'broadleaf', seed: 'x', size: bad });
    assert.ok(parts.every((p) => p.w > 0 && p.h > 0), `cỡ "${bad}" sinh khối kích thước ≤ 0`);
  }
});
