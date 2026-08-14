import test from 'node:test';
import assert from 'node:assert/strict';

import { ERA_TERRAIN, TERRACE_STEP, buildTerrain, eraTerrainProfile } from './terrain.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const GRID = 12;

/** Đếm số ô ở mỗi cao độ. Trả về `{levels, topShare}`. */
function levelStats(terrain) {
  const count = new Map();
  for (const cell of terrain.cells) {
    const key = cell.h.toFixed(6);
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  return {
    levels: count.size,
    topShare: Math.max(...count.values()) / terrain.cells.length,
  };
}

test('mọi kỷ có khai bậc thì phải CÓ ĐẤT Ở BẬC 0 và có chỗ cao hơn 0', () => {
  // ⚠️ NÓI CHO ĐÚNG BÀI NÀY CANH GÌ. Tôi đã suýt ghi rằng nó "chặn lỗi hàm hình dạng gánh cả biên
  // độ" — lỗi có thật, đã đo (4 kỷ phẳng tuyệt đối, 15 kỷ chỉ còn 11 trường khác nhau). Nhưng thử
  // ngược thì bài này **KHÔNG đỏ** khi tôi cố ý tái tạo lỗi đó: bước căng trường ở `buildTerrain`
  // đã làm nó thành bất khả thi, nhân hệ số nào vào hàm hình dạng cũng ra kết quả y hệt từng con
  // số. Thứ bài này thật sự canh hẹp hơn nhiều: **trường cao độ có neo ở 0 và có vươn lên**.
  // Bài "dùng đủ số bậc" bên dưới mới là bài đỏ khi bước căng bị gỡ.
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    if (profile.terraces < 2) continue;      // kỷ 14 phẳng có chủ đích
    const terrain = buildTerrain({ era, gridSize: GRID });
    const lowest = Math.min(...terrain.cells.map((c) => c.h));
    assert.equal(lowest, 0, `kỷ ${era}: bậc thấp nhất phải là 0, đang là ${lowest}`);
    assert.ok(terrain.maxHeight > 0, `kỷ ${era} (${profile.shape}) phẳng lì dù khai ${profile.terraces} bậc`);
  }
});

test('MỌI KỶ PHẢI DÙNG ĐỦ SỐ BẬC MÌNH KHAI — khai 5 mà dùng 3 là đã mất địa hình', () => {
  // Đây là hàng rào CHÍNH của cả file, và điều đáng ghi là nó canh **bước căng trường** chứ không
  // canh hai lỗi phân bố ban đầu (cả hai nay đã bất khả thi — xem chú thích ở `SHAPES`). Đã thử
  // ngược: gỡ bước căng ⇒ bài này đỏ ngay. "cao nhất > 0" thì KHÔNG bắt được gì — đó là cái phễu.
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    const { levels } = levelStats(buildTerrain({ era, gridSize: GRID }));
    assert.equal(
      levels, profile.terraces,
      `kỷ ${era} (${profile.shape}) khai ${profile.terraces} bậc nhưng chỉ dùng ${levels}`,
    );
  }
});

test('kỷ khai TỪ 3 BẬC TRỞ LÊN thì không bậc nào được nuốt quá 60% mặt đất', () => {
  // ⚠️ VÌ SAO NGƯỠNG NÀY CHỈ ÁP CHO KỶ ≥3 BẬC, và vì sao đó KHÔNG phải nới tay cho tiện:
  // bản đầu tôi áp 70% cho cả 15 kỷ, và hai kỷ "trượt" là kỷ 3 (Ur, Lưỡng Hà) với kỷ 12 (thảo
  // nguyên Nga) — đúng hai nơi mà chính bảng `ERA_TERRAIN` mô tả là "phẳng tuyệt đối" và "phẳng
  // đến mức thành biểu tượng". Ngưỡng ấy đang ĐÒI BỊA RA ĐỒI Ở NƠI KHÔNG CÓ ĐỒI — cùng hình dạng
  // sai với phép đếm "15 mái phải phủ 6 múi màu" mà Phase 6B đã phải hạ xuống. Một kỷ khai 2 bậc
  // là một kỷ đồng bằng: nó chỉ cần có GỢN (bài trên đã canh), không cần cân bằng.
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    if (profile.terraces < 3) continue;
    const { topShare } = levelStats(buildTerrain({ era, gridSize: GRID }));
    assert.ok(
      topShare <= 0.60,
      `kỷ ${era} (${profile.shape}, ${profile.terraces} bậc): ${(topShare * 100).toFixed(0)}% mặt đất `
      + 'nằm ở cùng một bậc — địa hình đã sập về phẳng ở một cao độ lẻ.',
    );
  }
});

test('ĐỐI CHỨNG: một trường cao độ PHẲNG LÌ phải bị hai hàng rào trên bắt', () => {
  // Không có bài này thì hai ngưỡng trên chỉ là hai con số ai cũng hạ được cho tiện.
  const flat = { cells: Array.from({ length: 144 }, (_, i) => ({ x: i % 12, y: (i / 12) | 0, h: 0 })) };
  const { levels, topShare } = levelStats(flat);
  assert.equal(levels, 1, 'trường phẳng phải chỉ có 1 mức');
  assert.ok(topShare > 0.60, 'trường phẳng phải vượt ngưỡng 60%');
});

test('15 KỶ RA 15 ĐỊA HÌNH KHÁC NHAU — không dùng chung một quả đồi rồi đổi độ cao', () => {
  // Yêu cầu gốc của Đàm: "không dùng cùng một thành phố rồi đổi màu". Địa hình là một trong những
  // trục nói lên điều đó. So bằng CHỮ KÝ (toàn bộ 144 cao độ), không phải bằng maxHeight — hai
  // quả đồi hình khác hẳn nhau vẫn có thể cùng đỉnh.
  const signatures = new Set(ERAS.map((era) => (
    buildTerrain({ era, gridSize: GRID }).cells.map((c) => Math.round(c.h * 1000)).join(',')
  )));
  assert.equal(signatures.size, 15, `chỉ có ${signatures.size} địa hình khác nhau trên 15 kỷ`);
});

test('ĐẤT KHÔNG ĐƯỢC XÊ DỊCH: cùng một kỷ thì địa hình y hệt nhau, mãi mãi', () => {
  // ⚠️ Bất biến quan trọng nhất của file. Nếu cao độ phụ thuộc vào việc Đàm đã xây gì thì mỗi lần
  // xây xong một căn nhà cả quả đồi sẽ nhích, nhà cũ lún hoặc nhô mà không có gì báo. Cùng luật đã
  // giữ cho VỊ TRÍ (ADR-007) và THỨ TỰ MỞ ĐƯỜNG (`tier`, Phase 6C).
  for (const era of ERAS) {
    const a = buildTerrain({ era, gridSize: GRID });
    const b = buildTerrain({ era, gridSize: GRID });
    assert.deepEqual(a.cells, b.cells, `kỷ ${era} dựng hai lần ra hai địa hình`);
  }
  // Và chữ ký hàm KHÔNG được nhận danh sách công trình — nếu ai đó thêm tham số đó vào thì bất
  // biến trên chết ngay. Kiểm bằng cách gọi với rác: kết quả phải không đổi.
  const clean = buildTerrain({ era: 7, gridSize: GRID });
  const noisy = buildTerrain({ era: 7, gridSize: GRID, built: ['a', 'b'], buildings: [1, 2, 3] });
  assert.deepEqual(noisy.cells, clean.cells, 'địa hình đổi theo dữ liệu công trình — đất đang xê dịch');
});

test('cao độ luôn là BỘI SỐ NGUYÊN của một bậc thềm — không có dốc liên tục', () => {
  // Nền là 144 ô hộp và công trình là khối đáy phẳng; một cao độ lẻ giữa hai bậc sẽ cho ra ô nền
  // xuyên vào nhau hoặc hở khe. Thềm bậc không phải lựa chọn mỹ thuật, nó là điều kiện hình học.
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const unit = TERRACE_STEP * eraTerrainProfile(era).relief;
    if (unit <= 0) continue;
    for (const cell of terrain.cells) {
      const steps = cell.h / unit;
      assert.ok(
        Math.abs(steps - Math.round(steps)) < 1e-9,
        `kỷ ${era} ô (${cell.x},${cell.y}) cao ${cell.h} — không phải bội số của bậc ${unit}`,
      );
    }
  }
});

test('`footprint` trả cao độ CAO NHẤT dưới bóng công trình, và phần hụt để làm móng', () => {
  // Đứng ở cao độ cao nhất ⇒ KHÔNG BAO GIỜ có góc treo lơ lửng. Phần hụt (`drop`) là chiều cao
  // khối móng phải lấp xuống — bệ kè, đúng như nhà trên sườn đồi ngoài đời.
  const terrain = buildTerrain({ era: 5, gridSize: GRID });   // kỷ dốc nhất
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const fp = terrain.footprint(x, y, 3);
      assert.ok(fp.drop >= 0, `drop âm tại (${x},${y})`);
      let top = -Infinity;
      let bottom = Infinity;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const h = terrain.heightAt(x + dx, y + dy);
          if (h > top) top = h;
          if (h < bottom) bottom = h;
        }
      }
      assert.equal(fp.top, top, `(${x},${y}): phải đứng ở cao độ CAO NHẤT dưới bóng mình`);
      assert.equal(fp.drop, top - bottom, `(${x},${y}): drop phải bằng phần hụt`);
    }
  }
  // Công trình rộng 1 ô không bao giờ cần móng.
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      assert.equal(terrain.footprint(x, y, 1).drop, 0, `ô đơn (${x},${y}) không được cần móng`);
    }
  }
});

test('dữ liệu rác KHÔNG làm nổ, và ngoài lưới thì kẹp về mép', () => {
  const terrain = buildTerrain({ era: 999, gridSize: GRID });
  assert.ok(Number.isFinite(terrain.maxHeight));
  assert.equal(terrain.cells.length, GRID * GRID);
  assert.equal(terrain.heightAt(-5, -5), terrain.heightAt(0, 0), 'ngoài lưới phải kẹp về ô mép');
  assert.equal(terrain.heightAt(99, 99), terrain.heightAt(GRID - 1, GRID - 1));
  assert.ok(Number.isFinite(buildTerrain({}).maxHeight), 'gọi không tham số vẫn phải chạy');
  assert.equal(buildTerrain({ era: 1, gridSize: 0 }).cells.length, 1, 'lưới suy biến vẫn phải hợp lệ');
});

test('mỗi kỷ phải GIẢI THÍCH ĐƯỢC địa hình của mình bằng một nơi có thật', () => {
  // ⚠️ Cùng luật với `country`/`landmark` ở `eraStyle.js` (`CLAUDE.md`): con số không có lời giải
  // thích là con số tuỳ hứng, và tuỳ hứng chính là thứ đã sinh ra "15 kỷ cao bằng nhau" ở Phase 5B.
  for (const era of ERAS) {
    const profile = ERA_TERRAIN[era];
    assert.ok(profile, `kỷ ${era} thiếu hồ sơ địa hình`);
    assert.ok(
      typeof profile.note === 'string' && profile.note.length >= 20,
      `kỷ ${era} thiếu lời giải thích địa hình (đang là ${JSON.stringify(profile.note)})`,
    );
    assert.ok(profile.terraces >= 1 && profile.relief >= 0, `kỷ ${era} có tham số vô lý`);
  }
});
