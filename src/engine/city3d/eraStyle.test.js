/**
 * eraStyle.test.js — khoá hai luật hình học mà Phase 7C thêm vào ngữ pháp kỷ:
 *   1. `vernacularRoof` — nhà thường KHÔNG được đội mái của công trình biểu tượng.
 *   2. `eaveOverhang`   — diềm mái phải kẹp theo cỡ công trình, không phải một số tuyệt đối.
 *
 * ⚠️ Cả hai luật đều thuộc loại "sai thì KHÔNG có gì đỏ lên": mã vẫn chạy, ngân sách tam giác vẫn
 * còn dư, chỉ có hình bóng sai — và hình bóng sai chỉ lộ ra khi có người ngồi nhìn ảnh chụp.
 * Đó chính là lý do chúng cần test đọc-dữ-liệu ở đây.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ERA_STYLES, ROOF_KINDS, EAVE_MAX_RATIO,
  getEraStyle, getVernacularStyle, eaveOverhang,
} from './eraStyle';
import { buildBuildingSpec } from './buildingSpec';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);

test('MỌI KỶ PHẢI KHAI mái nhà thường, và khai một kiểu mái có thật', () => {
  // ⚠️ Trường BẮT BUỘC, không phải tuỳ chọn. Nếu để trống được thì một kỷ thêm sau này sẽ lặng lẽ
  // rơi về `roof` và cái bẫy "nhà dân đội mái kỳ quan" quay lại y nguyên — lần này không ai nhìn
  // vào ảnh chụp để mà phát hiện, vì nó đã "chạy tốt" nhiều tháng.
  assert.equal(ERAS.length, 15);
  for (const era of ERAS) {
    const style = ERA_STYLES[era];
    assert.ok(style.vernacularRoof, `kỷ ${era} chưa khai vernacularRoof`);
    assert.ok(
      ROOF_KINDS.includes(style.vernacularRoof),
      `kỷ ${era} khai mái nhà thường "${style.vernacularRoof}" — không có trong ROOF_KINDS`,
    );
  }
});

test('NHÀ THƯỜNG KHÔNG ĐỘI MÁI KỲ ĐÀI ở những kỷ mà hai thứ đó khác nhau ngoài đời', () => {
  // Đây là bài đối chứng nhốt sẵn LỖI CŨ: trước Phase 7C mọi kỷ đều dùng chung một `roof`, nên
  // Firenze có 25 mái vòm tí hon vây quanh Duomo. Danh sách dưới đây là những kỷ mà công trình
  // biểu tượng dùng một thủ pháp mái mà nhà dân KHÔNG BAO GIỜ được phép dùng (mái chồng nhiều
  // tầng từng bị luật cấm với dân thường; giật cấp New York là luật cho cao ốc; vòm Duomo có đúng
  // một cái). Kỷ nào trong danh sách này mà lại khai trùng thì hoặc bảng sai, hoặc lịch sử sai.
  const MUST_DIFFER = [2, 3, 4, 6, 7, 9, 10, 11, 15];
  for (const era of MUST_DIFFER) {
    const style = ERA_STYLES[era];
    assert.notEqual(
      style.vernacularRoof, style.roof,
      `kỷ ${era} (${style.country}): nhà dân đang đội đúng mái của "${style.landmark}"`,
    );
  }
  // …và các kỷ còn lại khai TRÙNG một cách có chủ đích (thời đồ đá thì nhà nào cũng là lều).
  // Canh cả vế này để không ai "sửa" bảng bằng cách cho mọi kỷ khác nhau cho đủ chỉ tiêu.
  const same = ERAS.filter((e) => ERA_STYLES[e].vernacularRoof === ERA_STYLES[e].roof);
  assert.deepEqual(same, [1, 5, 8, 12, 13, 14]);
});

test('getVernacularStyle THAY MÁI Ở NGUỒN — mọi trường khác giữ nguyên từng chữ số', () => {
  for (const era of ERAS) {
    const base = getEraStyle(era);
    const vern = getVernacularStyle(era);
    assert.equal(vern.roof, base.vernacularRoof, `kỷ ${era} chưa thay mái`);
    // Chỉ ĐÚNG MỘT trường được đổi. Nếu hàm này lỡ đổi thêm `roofColor` hay `massScale` thì nhà dân
    // sẽ trôi khỏi bản sắc kỷ mà không ai để ý — đúng thứ `plain` sinh ra để KHÔNG làm.
    for (const key of Object.keys(base)) {
      if (key === 'roof') continue;
      assert.deepEqual(vern[key], base[key], `kỷ ${era}: trường "${key}" bị đổi ngoài ý muốn`);
    }
  }
});

test('NHÀ DÂN DÙNG MÁI THƯỜNG, KỲ QUAN DÙNG MÁI KỲ ĐÀI — đo trên spec dựng ra thật', () => {
  // ⚠️ Hai bài trên canh BẢNG DỮ LIỆU; bài này canh ĐƯỜNG DÂY. Bảng đúng mà `buildBuildingSpec`
  // quên gọi `getVernacularStyle` thì cả hai bài trên vẫn xanh còn màn hình vẫn sai — đúng bài học
  // "test tầng engine chứng minh hàm chạy đúng, không chứng minh hàm có ai gọi" (Phase 4H).
  // Cách đo: mái `dome` của kỷ 7 sinh ra khối vai `gold` (quả cầu đỉnh vòm); mái `gable` thì không.
  const hasGold = (spec) => spec.parts.some((p) => p.role === 'gold');

  const wonder = buildBuildingSpec({ bpId: 'bp_x', era: 7, type: 'wonder', rarity: 'epic', level: 1 });
  const home = buildBuildingSpec({ bpId: 'dw|7|3|4', era: 7, type: 'house', rarity: 'epic', level: 1 });

  assert.ok(hasGold(wonder), 'kỳ quan kỷ 7 phải còn quả cầu đỉnh vòm');
  assert.ok(!hasGold(home), 'nhà dân kỷ 7 vẫn đang dựng mái vòm — chưa đi qua getVernacularStyle');
});

test('DIỀM MÁI KẸP THEO CỠ NHÀ — nhà càng nhỏ, diềm càng không được phép thò xa', () => {
  const style = { eaves: 0.4 };                       // kỷ 6: diềm sâu nhất bảng
  // Công trình to: kẹp không chạm tới, giữ nguyên con số đã cân trong bảng.
  assert.equal(eaveOverhang(style, 2, 2), 0.4);
  // Nhà dân nhỏ: kẹp ăn vào. 0,56 × 0,28 = 0,1568.
  assert.ok(Math.abs(eaveOverhang(style, 0.56, 0.56) - 0.56 * EAVE_MAX_RATIO) < 1e-9);
  // Lấy theo cạnh NGẮN, không phải cạnh dài — nhà bè ngang vẫn phải kẹp theo bề hẹp, nếu không
  // diềm sẽ thò qua hẳn hai đầu hồi.
  assert.equal(eaveOverhang(style, 3, 0.4), 0.4 * EAVE_MAX_RATIO);
  // Dữ liệu hỏng vẫn ra số dùng được, không `NaN` (màn Thành Phố phải dựng được kể cả khi state lỗi).
  assert.ok(Number.isFinite(eaveOverhang(undefined, undefined, undefined)));
});

test('KHÔNG CÒN CÔNG TRÌNH NÀO ĐỘI Ô: mái rộng nhất không quá 1,6 lần thân nhà', () => {
  // ⚠️ Bài đối chứng nhốt lỗi cũ bằng SỐ. Trước khi kẹp, nhà dân kỷ 6 có mái rộng 1,33 trên thân
  // 0,56 — gấp 2,38 lần, tức một cái ô che nắng chứ không phải mái hiên. Ngưỡng 1,6 suy thẳng từ
  // EAVE_MAX_RATIO (1 + 2 × 0,28 = 1,56) nên nới hằng số kia là bài này đỏ ngay, không trôi ngầm.
  const LIMIT = 1 + 2 * EAVE_MAX_RATIO + 0.05;
  const WALL_ROLES = new Set(['wall', 'wall2', 'stone', 'wood', 'glass', 'dark']);
  let worst = { ratio: 0 };

  for (const era of ERAS) {
    for (const rarity of ['common', 'rare', 'epic']) {
      for (const type of ['house', 'shop', 'workshop']) {
        if (type === 'workshop' && rarity === 'epic') continue;   // xưởng chỉ có nhỏ/vừa
        const spec = buildBuildingSpec({ bpId: `dw|${era}|3|4`, era, type, rarity, level: 1 });
        let wall = 0; let roof = 0;
        for (const p of spec.parts) {
          if (WALL_ROLES.has(p.role)) wall = Math.max(wall, p.w ?? 0);
          if (p.role === 'roof') roof = Math.max(roof, p.w ?? 0);
        }
        if (wall > 0 && roof / wall > worst.ratio) worst = { ratio: roof / wall, era, type, rarity };
      }
    }
  }
  assert.ok(
    worst.ratio <= LIMIT,
    `kỷ ${worst.era} ${worst.type}/${worst.rarity}: mái rộng gấp ${worst.ratio.toFixed(2)} lần thân nhà`,
  );
  console.log(`   [diềm mái] rộng nhất: kỷ ${worst.era} ${worst.type}/${worst.rarity}`
    + ` — mái gấp ${worst.ratio.toFixed(2)} lần thân (trần ${LIMIT.toFixed(2)})`);
});
