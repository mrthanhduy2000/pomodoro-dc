import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APRON_DROP, APRON_EDGE, ERA_TERRAIN, TERRACE_STEP, buildTerrain, eraTerrainProfile,
} from './terrain.js';

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
  // ⚠️ LÝ DO CỦA BÀI NÀY ĐÃ ĐỔI Ở PHASE 8C, DÙ LUẬT THÌ KHÔNG. Lý do CŨ là "nền là 144 ô hộp, cao
  // độ lẻ sẽ cho ô nền xuyên nhau hoặc hở khe" — vế ấy chết rồi, mặt đất nay là một tấm lưới liền
  // và nó dốc được tuỳ ý. Nhưng CÔNG TRÌNH vẫn là khối đáy phẳng, và chúng vẫn đứng theo bảng cao
  // độ này; thềm bậc là thứ cho một toà nhà rộng 3 ô có mặt đất bằng phẳng để đặt xuống. Giữ bài
  // test, sửa lời giải thích — một lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào.
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

test('MẶT ĐẤT MƯỢT PHẢI ĐI QUA ĐÚNG TÂM Ô — nếu không, cả thành phố lơ lửng hoặc lún', () => {
  // ⚠️ ĐÂY LÀ BẤT BIẾN ĐẮT NHẤT CỦA PHASE 8C, và nó hỏng trong im lặng tuyệt đối.
  // Nhà, giàn giáo, cây, cư dân đều đứng ở `heightAt` của ô mình. Mặt đất thì nay được vẽ bằng
  // `smoothHeightAt`. Hai hàm ấy PHẢI bằng nhau tại toạ độ nguyên — không phải "gần bằng", mà
  // bằng đúng: lệch 2% thôi là mỗi căn nhà trong thành phố hụt hoặc lún vài phân, và không có gì
  // đỏ lên, không có cảnh báo nào, chỉ có một tấm ảnh trông hơi sai mà không ai chỉ ra được sai ở
  // đâu. Đúng hình dạng lỗi "sáu chỗ bám đất" của Phase 7B, lần này nhỏ hơn nên khó thấy hơn.
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (const cell of terrain.cells) {
      assert.equal(
        terrain.smoothHeightAt(cell.x, cell.y), terrain.heightAt(cell.x, cell.y),
        `kỷ ${era} ô (${cell.x},${cell.y}): mặt đất mượt lệch khỏi cao độ mà mọi vật đang đứng`,
      );
    }
  }
});

test('MẶT ĐẤT PHẢI THẬT SỰ DỐC GIỮA HAI TÂM Ô — không được lén quay về bậc thang', () => {
  // Bài trên đòi hai hàm khớp nhau ở tâm ô. Chỉ mình nó thì `smoothHeightAt = heightAt` (làm tròn
  // về ô gần nhất) cũng qua cửa — mà đó CHÍNH LÀ bậc thang, tức cả Phase 8C bị hoàn tác mà test
  // vẫn xanh. Nên phải hỏi thêm: giữa hai ô chênh nhau một bậc, điểm chính giữa có nằm ở KHOẢNG
  // GIỮA không.
  let checked = 0;
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID - 1; x += 1) {
        const a = terrain.heightAt(x, y); const b = terrain.heightAt(x + 1, y);
        if (a === b) continue;
        const mid = terrain.smoothHeightAt(x + 0.5, y);
        assert.ok(
          Math.abs(mid - (a + b) / 2) < 1e-9,
          `kỷ ${era} giữa ô (${x},${y}) và (${x + 1},${y}): điểm giữa ở ${mid}, đáng lẽ ${(a + b) / 2}`,
        );
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 50, `chỉ kiểm được ${checked} chỗ chênh bậc — bài test này đang chạy không`);
});

test('RA KHỎI `APRON_EDGE` THÌ MẶT ĐẤT PHẲNG ĐÚNG `-APRON_DROP`', () => {
  // ⚠️ Đây là LỜI HỨA VỚI `sceneGraph.js`: tấm ván vùng ngoài ngồi ở đúng cao độ ấy, nên nếu rìa
  // tấm địa hình còn gợn thì chỗ giáp sẽ là một đường răng cưa hở cả gầm — vòng quanh thành phố,
  // và im lặng. Kiểm ở NHIỀU hướng vì bán kính chuyển tiếp bị nhiễu nhân vào: chỗ nào nhiễu lớn
  // nhất mới là chỗ chạm trần, và đúng chỗ đó mới lộ lỗi.
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (let t = 0; t <= 24; t += 1) {
      const along = -0.5 + (GRID * t) / 24;
      const out = GRID - 0.5 + APRON_EDGE + 0.01;
      for (const [u, v] of [[-0.5 - APRON_EDGE - 0.01, along], [out, along],
        [along, -0.5 - APRON_EDGE - 0.01], [along, out]]) {
        assert.ok(
          Math.abs(terrain.surfaceHeightAt(u, v) + APRON_DROP) < 1e-9,
          `kỷ ${era} tại (${u.toFixed(2)},${v.toFixed(2)}): rìa ở ${terrain.surfaceHeightAt(u, v)}, `
          + `đáng lẽ ${-APRON_DROP} — sẽ hở một khe giữa địa hình và tấm ván vùng ngoài`,
        );
      }
    }
  }
});

test('VÙNG ĐẤT NGOÀI PHẢI THẤP HƠN CAO NGUYÊN, và ranh giới phải LƯỢN chứ không vuông', () => {
  // Hai nửa của cùng một điều Đàm yêu cầu ("irregular silhouettes"). Nửa (a): thành phố phải nằm
  // TRÊN một cao nguyên, không phải trên một cái khay. Nửa (b): bán kính chuyển tiếp bị nhiễu nhân
  // vào, nên nếu nó ra một hằng số thì mép lại vuông vức — và một mép vuông hoàn hảo chính là dấu
  // hiệu số một để mắt đọc ra "bàn cờ".
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const rim = [];
    for (let t = 0; t <= 40; t += 1) {
      const along = -0.5 + (GRID * t) / 40;
      // Đi ra ngoài đúng 1 ô rồi đo tụt bao nhiêu — số này chính là "ranh giới nằm ở đâu".
      rim.push(terrain.smoothHeightAt(0, Math.min(GRID - 1, Math.max(0, along)))
        - terrain.surfaceHeightAt(-1.5, along));
    }
    const lo = Math.min(...rim); const hi = Math.max(...rim);
    assert.ok(hi > 0.02, `kỷ ${era}: vùng ngoài không hề thấp hơn cao nguyên`);
    assert.ok(
      hi - lo > 0.05,
      `kỷ ${era}: mức tụt ở rìa gần như không đổi (${lo.toFixed(3)}..${hi.toFixed(3)}) — ranh giới `
      + 'đang là một hình vuông đều tăm tắp, đúng thứ làm cảnh đọc ra bàn cờ',
    );
  }
});

test('`tintAt` phải TẤT ĐỊNH, nằm trong 0..1, và đổi theo cả hai trục', () => {
  // Vết loang là thứ giữ cho mặt đất KHÔNG phẳng lì ở 5 kỷ đồng bằng (nơi độ dốc bằng 0 nên tầng
  // "sườn dốc lộ đất" không đóng góp gì). Nó trả một hằng số thì 5 kỷ ấy về lại một mảng màu chết.
  for (const era of [1, 7, 12, 15]) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const seen = new Set();
    for (let j = 0; j <= 12; j += 1) {
      for (let i = 0; i <= 12; i += 1) {
        const v = terrain.tintAt(i, j);
        assert.ok(v >= 0 && v <= 1, `kỷ ${era} tintAt(${i},${j}) = ${v} — ngoài 0..1`);
        assert.equal(v, terrain.tintAt(i, j), 'không tất định');
        seen.add(v.toFixed(4));
      }
    }
    assert.ok(seen.size >= 30, `kỷ ${era}: vết loang chỉ có ${seen.size} giá trị — gần như phẳng`);
  }
});
