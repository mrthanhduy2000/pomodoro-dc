import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMergedGeometry } from './geometryFactory.js';
import { MATERIAL_ORDER, contactShade, materialFamilyFor } from '../../../engine/city3d/materials.js';
import { getEraStyle } from '../../../engine/city3d/eraStyle.js';
import { buildBuildingSpec } from '../../../engine/city3d/buildingSpec.js';
import { gable, prism } from '../../../engine/city3d/parts.js';
import { buildScenePalette } from '../../../engine/city3d/palette3d.js';

/**
 * Bài test cho NHÀ MÁY HÌNH HỌC — tầng duy nhất được phép chạm vào three.js.
 *
 * ⚠️ VÌ SAO CẦN, DÙ `materials.test.js` ĐÃ XANH: bài kia chứng minh **bảng tra vật liệu đúng**.
 * Nó hoàn toàn không biết gì về việc bảng ấy có được DÙNG hay không. Đúng cái bẫy Phase 4H:
 * `summarizeMuseum` viết xong, có test riêng, test xanh — và không một dòng mã sản phẩm nào gọi nó.
 * Ở đây hậu quả còn im lặng hơn: nếu `mergeSinks` đánh nhầm số nhóm thì cảnh vẫn hiện đủ hình khối,
 * chỉ là mái mang bề mặt của mặt nước. Không có gì đỏ, không có gì thiếu — chỉ sai bề mặt.
 *
 * Cả bốn bài dưới đây đều đã được thử NGƯỢC (làm hỏng mã rồi xem có đỏ không) trước khi giữ lại.
 */

const PALETTE = buildScenePalette({ era: 9 });

/** Một chỗ đặt tối giản: mô tả thẳng bằng tay để bài test tự nói rõ nó đang kiểm cái gì. */
function placement(parts, at = { x: 0, z: 0 }) {
  return [{ spec: { parts }, x: at.x, z: at.z }];
}

test('nhóm vật liệu xếp theo MATERIAL_ORDER, KHÔNG theo thứ tự khối được dựng', () => {
  // ⚠️ Đây là bất biến quan trọng nhất của file. Thứ tự chèn vào `Map` phụ thuộc khối nào tình cờ
  // dựng trước — nghĩa là nó ĐỔI khi Đàm xây thêm một công trình. Nên bài test cố tình dựng hai
  // thành phố có cùng bộ họ vật liệu nhưng THỨ TỰ KHỐI NGƯỢC NHAU, và đòi hai bên ra cùng một
  // danh sách `families`.
  const era = 9; // đá vôi (stone) + mái kẽm (metal) — hai họ chắc chắn khác nhau
  const wallFirst = [
    prism({ w: 1, h: 1, role: 'wall' }),
    gable({ y: 1, w: 1, h: 0.4, role: 'roof' }),
  ];
  const roofFirst = [
    gable({ y: 1, w: 1, h: 0.4, role: 'roof' }),
    prism({ w: 1, h: 1, role: 'wall' }),
  ];

  const a = buildMergedGeometry(placement(wallFirst), PALETTE, { era });
  const b = buildMergedGeometry(placement(roofFirst), PALETTE, { era });

  assert.deepEqual(a.families, b.families, 'đảo thứ tự khối làm đổi thứ tự nhóm vật liệu');

  // Và danh sách đó phải là một dãy con ĐÚNG THỨ TỰ của MATERIAL_ORDER.
  const positions = a.families.map((f) => MATERIAL_ORDER.indexOf(f));
  assert.ok(positions.every((p) => p >= 0), `có họ lạ trong families: ${a.families.join(', ')}`);
  assert.deepEqual(positions, [...positions].sort((x, y) => x - y), 'families không theo MATERIAL_ORDER');
});

test('tường và mái của kỷ 9 phải rơi vào HAI nhóm khác nhau — đây là toàn bộ mục đích Phase 7A', () => {
  const style = getEraStyle(9);
  assert.notEqual(
    materialFamilyFor('wall', style),
    materialFamilyFor('roof', style),
    'fixture hỏng: kỷ 9 phải có vật liệu tường khác vật liệu mái thì bài test này mới có nghĩa',
  );

  const merged = buildMergedGeometry(
    placement([prism({ w: 1, h: 1, role: 'wall' }), gable({ y: 1, w: 1, h: 0.4, role: 'roof' })]),
    PALETTE,
    { era: 9 },
  );

  assert.equal(merged.families.length, 2, `mong 2 nhóm, nhận ${merged.families.length}`);
  assert.ok(merged.families.includes(materialFamilyFor('wall', style)));
  assert.ok(merged.families.includes(materialFamilyFor('roof', style)));
  assert.equal(merged.geometry.groups.length, 2);
});

test('ĐỐI CHỨNG: cùng bộ khối đó ở kỷ 12 (tường VÀ mái đều bê tông) chỉ được ra MỘT nhóm', () => {
  // Không có bài này thì bài trên chỉ chứng minh "có ít nhất 2 nhóm", tức nó vẫn xanh nếu nhà máy
  // chia nhóm bừa theo VAI màu thay vì theo HỌ vật liệu — mà chia theo vai là đúng thứ bị cấm:
  // 11 vai = 11 lệnh vẽ, gấp đôi ngân sách, để đổi lấy đúng 0 khác biệt trên màn hình.
  const style = getEraStyle(12);
  assert.equal(
    materialFamilyFor('wall', style),
    materialFamilyFor('roof', style),
    'fixture hỏng: kỷ 12 phải dùng CHUNG một vật liệu cho tường và mái',
  );

  const merged = buildMergedGeometry(
    placement([prism({ w: 1, h: 1, role: 'wall' }), gable({ y: 1, w: 1, h: 0.4, role: 'roof' })]),
    PALETTE,
    { era: 12 },
  );
  assert.equal(merged.families.length, 1, 'hai vai dùng chung vật liệu mà vẫn tách nhóm');
});

test('KHÔNG TAM GIÁC NÀO ĐƯỢC RƠI RA NGOÀI hay bị đếm hai lần', () => {
  // Nhóm là các lát cắt trên một mảng đỉnh phẳng. Lệch một chỉ số thì phần đuôi của khối rơi ra
  // ngoài mọi nhóm và **biến mất khỏi màn hình mà không có lỗi nào** — three chỉ vẽ những gì nằm
  // trong nhóm. Cách bắt: tổng độ dài các nhóm phải bằng đúng số đỉnh, và chúng phải nối liền nhau
  // từ 0, không hở không chồng.
  const spec = buildBuildingSpec({ bpId: 'bp-test', era: 6, type: 'wonder', rarity: 'epic', level: 3 });
  const merged = buildMergedGeometry(placement(spec.parts), PALETTE, { era: 6 });

  const vertices = merged.geometry.getAttribute('position').count;
  assert.equal(vertices, merged.triangles * 3, 'số đỉnh không khớp số tam giác báo ra');

  const groups = [...merged.geometry.groups].sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const g of groups) {
    assert.equal(g.start, cursor, `nhóm bắt đầu ở ${g.start} nhưng nhóm trước kết thúc ở ${cursor}`);
    assert.ok(g.count > 0, 'có nhóm rỗng — đừng tạo lệnh vẽ cho 0 tam giác');
    cursor += g.count;
  }
  assert.equal(cursor, vertices, `các nhóm phủ ${cursor}/${vertices} đỉnh`);

  // Và mỗi nhóm phải trỏ tới một ô CÓ THẬT trong mảng vật liệu bên `sceneGraph.js`.
  const indices = groups.map((g) => g.materialIndex).sort((a, b) => a - b);
  assert.deepEqual(indices, merged.families.map((_, i) => i), 'materialIndex không khớp mảng families');
});

test('BÓNG TIẾP XÚC ĐƯỢC NƯỚNG THẬT VÀO MÀU ĐỈNH — chân tối hơn nóc', () => {
  // ⚠️ Bài này canh đúng cái mà `materials.test.js` KHÔNG canh được: `contactShade` có thể hoàn hảo
  // mà vẫn không ai gọi nó. Cách đo: một cột cao dùng MỘT vai màu duy nhất, nên mọi chênh lệch màu
  // giữa đỉnh trên và đỉnh dưới chỉ có thể đến từ bóng tiếp xúc.
  const merged = buildMergedGeometry(
    placement([prism({ w: 0.6, h: 4, sides: 4, role: 'wall' })]),
    PALETTE,
    { era: 9 },
  );

  const pos = merged.geometry.getAttribute('position');
  const col = merged.geometry.getAttribute('color');
  let lowest = { y: Infinity, lum: 0 };
  let highest = { y: -Infinity, lum: 0 };
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const lum = col.getX(i) + col.getY(i) + col.getZ(i);
    if (y < lowest.y) lowest = { y, lum };
    if (y > highest.y) highest = { y, lum };
  }

  assert.ok(
    lowest.lum < highest.lum * 0.9,
    `chân cột (y=${lowest.y}) sáng ${lowest.lum.toFixed(3)}, nóc (y=${highest.y}) sáng `
    + `${highest.lum.toFixed(3)} — bóng tiếp xúc không được nướng vào màu đỉnh.`,
  );
  // Và đậm đúng bằng mức đường cong đã khai, không phải một hằng số nào khác lẻn vào.
  const expected = contactShade(0) / contactShade(highest.y);
  assert.ok(
    Math.abs(lowest.lum / highest.lum - expected) < 1e-5,
    `tỉ lệ tối đo được ${(lowest.lum / highest.lum).toFixed(5)}, đường cong khai ${expected.toFixed(5)}`,
  );
});

test('ô cửa sáng đèn nằm ở khối RIÊNG và KHÔNG bị bóng tiếp xúc làm tối', () => {
  // Đèn cửa sổ tự phát sáng; tối chân một ô đèn là vô lý và nó đã từng làm cái ao thành hộp đèn
  // (xem chú thích vai `water` ở `parts.js`). Khối phát sáng phải tách hẳn khỏi khối chính.
  const merged = buildMergedGeometry(
    placement([
      prism({ w: 1, h: 2, role: 'wall' }),
      prism({ x: 0.6, y: 0.1, w: 0.2, h: 0.2, role: 'glass' }),
    ]),
    PALETTE,
    { era: 9, glowRole: 'glass' },
  );

  assert.ok(merged.glowTriangles > 0, 'không có tam giác nào vào khối phát sáng');
  assert.ok(merged.glowGeometry, 'khối phát sáng rỗng');
  assert.ok(
    !merged.families.includes('glass'),
    'vai `glass` vẫn còn trong khối chính — nó phải chuyển hết sang khối phát sáng',
  );

  // Mọi đỉnh của khối phát sáng phải cùng MỘT màu: không có đỉnh nào bị làm tối theo độ cao.
  const col = merged.glowGeometry.getAttribute('color');
  const first = [col.getX(0), col.getY(0), col.getZ(0)];
  for (let i = 1; i < col.count; i += 1) {
    assert.ok(
      Math.abs(col.getX(i) - first[0]) < 1e-6
      && Math.abs(col.getY(i) - first[1]) < 1e-6
      && Math.abs(col.getZ(i) - first[2]) < 1e-6,
      `đỉnh ${i} của khối phát sáng bị đổi màu — bóng tiếp xúc đang ăn vào ô cửa đèn`,
    );
  }
});

test('cả 15 kỷ đều dựng được, và không kỷ nào vượt ngân sách lệnh vẽ', () => {
  // ⚠️ Ngân sách ở đây là SỐ NHÓM, không phải số tam giác — mỗi nhóm là một lệnh vẽ. Cả kiến trúc
  // gộp-hình-học chỉ có ý nghĩa chừng nào con số này còn nhỏ; nó phình lên là mất sạch lợi ích mà
  // không ai để ý, vì hình vẫn hiện đúng.
  for (let era = 1; era <= 15; era += 1) {
    const parts = [];
    for (const rarity of ['common', 'rare', 'epic']) {
      const spec = buildBuildingSpec({ bpId: `bp-${era}-${rarity}`, era, type: 'wonder', rarity, level: 3 });
      parts.push(...spec.parts);
    }
    const merged = buildMergedGeometry(placement(parts), PALETTE, { era });
    assert.ok(merged, `kỷ ${era} không dựng được hình học nào`);
    assert.ok(
      merged.families.length <= 8,
      `kỷ ${era} cần ${merged.families.length} lệnh vẽ (${merged.families.join(', ')}) — quá 8`,
    );
  }
});
