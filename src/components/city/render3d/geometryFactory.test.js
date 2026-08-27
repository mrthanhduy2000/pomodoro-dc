import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMergedGeometry } from './geometryFactory.js';
import { MATERIAL_ORDER, SOFFIT_FLOOR, contactShade, materialFamilyFor } from '../../../engine/city3d/materials.js';
import { getEraStyle } from '../../../engine/city3d/eraStyle.js';
import { buildBuildingSpec } from '../../../engine/city3d/buildingSpec.js';
import { bevelWidth, countSpecTriangles, gable, prism } from '../../../engine/city3d/parts.js';
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
  const nor = merged.geometry.getAttribute('normal');
  let lowest = { y: Infinity, lum: 0 };
  let highest = { y: -Infinity, lum: 0 };
  for (let i = 0; i < pos.count; i += 1) {
    // ⚠️ CHỈ LẤY ĐỈNH TRÊN MẶT TƯỜNG DỰNG ĐỨNG (`ny ≈ 0`), và đó là điều kiện của phép đo chứ
    // không phải sự cầu kỳ. Từ 2026-08-27 màu đỉnh là TÍCH của hai trục che khuất — độ cao
    // (`contactShade`) × hướng mặt (`soffitShade`) — nên đỉnh thấp nhất của khối lại nằm trên MẶT
    // ĐÁY (úp thẳng xuống), chỗ cả hai trục cùng tối. Đo ở đó rồi so với một mình `contactShade`
    // là đang so hai đại lượng khác nhau; bài này đỏ đúng vì lý do ấy, không phải vì mã hỏng.
    // Mặt tường đứng có `soffitShade = 1` theo cấu tạo, nên ở đó `contactShade` là thứ DUY NHẤT
    // còn biến thiên — đúng cái bài này tuyên bố đang canh.
    if (Math.abs(nor.getY(i)) > 1e-6) continue;
    const y = pos.getY(i);
    const lum = col.getX(i) + col.getY(i) + col.getZ(i);
    if (y < lowest.y) lowest = { y, lum };
    if (y > highest.y) highest = { y, lum };
  }
  assert.ok(Number.isFinite(lowest.y) && Number.isFinite(highest.y) && lowest.y < highest.y,
    'Không lọc ra được đỉnh nào trên mặt tường đứng — phép lọc pháp tuyến đã trượt, bài test đang chạy rỗng.');

  assert.ok(
    lowest.lum < highest.lum * 0.9,
    `chân cột (y=${lowest.y}) sáng ${lowest.lum.toFixed(3)}, nóc (y=${highest.y}) sáng `
    + `${highest.lum.toFixed(3)} — bóng tiếp xúc không được nướng vào màu đỉnh.`,
  );
  // Và đậm đúng bằng mức đường cong đã khai, không phải một hằng số nào khác lẻn vào.
  //
  // ⚠️ HỎI ĐƯỜNG CONG TẠI ĐÚNG `lowest.y` ĐÃ ĐO ĐƯỢC, đừng viết cứng `contactShade(0)`: khối có
  // MÉP VÁT, nên đỉnh thấp nhất của mặt tường đứng nằm ở y ≈ 0,035 chứ không phải 0. Viết cứng số
  // 0 là ngầm khẳng định một điều về hình học mà bài test này không hề kiểm — và nó sai.
  const expected = contactShade(lowest.y) / contactShade(highest.y);
  assert.ok(
    Math.abs(lowest.lum / highest.lum - expected) < 1e-5,
    `tỉ lệ tối đo được ${(lowest.lum / highest.lum).toFixed(5)}, đường cong khai ${expected.toFixed(5)}`,
  );
});

test('CHE KHUẤT THEO HƯỚNG MẶT được nướng vào màu đỉnh — mặt úp xuống tối hơn mặt tường', () => {
  // ⚠️ VÌ SAO TRỤC NÀY ĐÁNG MỘT BÀI TEST TRONG KHI `PHASE_RULES` §4 miễn test cho mỹ thuật: luật
  // miễn ấy dựa trên "hỏng thì nhìn ảnh là thấy ngay". Đo được ngày 2026-08-27 là ở khung mặc
  // định của app, trục này đổi **0,0% điểm ảnh trên ngưỡng mắt** — vì camera chúi xuống 34° nên
  // gần như không mặt úp nào lọt vào khung. Tức nếu nó chết thì KHÔNG ai nhìn ảnh mà thấy được,
  // và lối thoát của §4 không áp dụng. Nó vẫn đáng giữ (đúng vật lý, 0 đồng, và đọc được ở khung
  // cận cảnh ADR-034), nhưng phải có một cái gác vì mắt không gác nổi.
  const merged = buildMergedGeometry(
    placement([prism({ w: 0.6, h: 4, sides: 4, role: 'wall' })]),
    PALETTE,
    { era: 9 },
  );
  const pos = merged.geometry.getAttribute('position');
  const col = merged.geometry.getAttribute('color');
  const nor = merged.geometry.getAttribute('normal');

  // So ở CÙNG một độ cao để trục `contactShade` không lẫn vào: lấy mặt đáy (úp xuống) và mặt
  // tường đứng, cả hai đều có đỉnh ở chân khối.
  let upXuong = null; let dungDung = null;
  for (let i = 0; i < pos.count; i += 1) {
    const ny = nor.getY(i);
    const lum = col.getX(i) + col.getY(i) + col.getZ(i);
    const mau = { y: pos.getY(i), lum };
    if (ny < -0.999 && (upXuong === null || mau.y < upXuong.y)) upXuong = mau;
    if (Math.abs(ny) < 1e-6 && (dungDung === null || mau.y < dungDung.y)) dungDung = mau;
  }

  assert.ok(upXuong && dungDung, 'Không tìm thấy đủ hai loại mặt để so — bài test đang chạy rỗng.');
  const tiSo = upXuong.lum / (dungDung.lum * (contactShade(upXuong.y) / contactShade(dungDung.y)));
  assert.ok(
    Math.abs(tiSo - SOFFIT_FLOOR) < 1e-4,
    `Mặt úp xuống chỉ tối bằng ${tiSo.toFixed(4)} lần mặt tường (sau khi đã trừ trục độ cao), `
    + `trong khi \`SOFFIT_FLOOR\` khai ${SOFFIT_FLOOR}. Trục che khuất theo hướng mặt đã đứt.`,
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

// ─────────────────────────────────────────────────────────────────────────────
// CẠNH VÁT (Phase 8B) — và cái test đối chiếu mà chú thích đã HỨA suốt từ Phase 3B
// ─────────────────────────────────────────────────────────────────────────────

test('NGÂN SÁCH KHÔNG NÓI DỐI: số tam giác tầng thuần đếm = số tam giác nhà máy thật sự dựng', () => {
  // ⚠️ BÀI NÀY ĐÁNG LẼ PHẢI CÓ TỪ PHASE 3B. Chú thích của `countTriangles` (`parts.js`) khẳng định
  // *"có test đối chiếu hai bên, vì một ngân sách tự tính riêng mà lệch với thực tế thì còn tệ hơn
  // không có ngân sách"* — nhưng bài duy nhất tồn tại chỉ so `countTriangles` với **những con số
  // viết cứng** (`countTriangles({shape:'prism', sides:4, taper:1}) === 12`), trên những khối
  // KHÔNG HỀ CÓ `w`/`d`/`h`, tức những khối không thể tồn tại trong thành phố thật. Nó chưa bao giờ
  // chạm vào nhà máy hình học. Suốt thời gian đó, hai bên có thể lệch nhau tuỳ ý mà không gì đỏ:
  // ngân sách vẫn in ra một con số, chỉ là con số ấy nói về một thành phố khác.
  //
  // Phase 8B làm chuyện đó thành nguy hiểm thật, vì vát cạnh khiến MỘT KHỐI ĐỔI SỐ TAM GIÁC tuỳ
  // theo kích thước của chính nó — hai bên phải cùng đọc một luật, hoặc bảng ngân sách thành rác.
  for (let era = 1; era <= 15; era += 1) {
    const parts = [];
    for (const rarity of ['common', 'rare', 'epic']) {
      for (const type of ['infrastructure', 'economy', 'defense', 'wonder', 'house']) {
        parts.push(...buildBuildingSpec({ bpId: `bp-${era}-${type}-${rarity}`, era, type, rarity, level: 3 }).parts);
      }
    }
    const merged = buildMergedGeometry(placement(parts), PALETTE, { era });
    // Đếm từ chính bộ đệm đỉnh — 3 đỉnh một tam giác. Đây là "sự thật trên GPU", không phải một
    // con số nhà máy tự khai.
    const thật = merged.geometry.getAttribute('position').count / 3;
    assert.equal(thật, countSpecTriangles(parts),
      `kỷ ${era}: nhà máy dựng ${thật} tam giác nhưng tầng thuần đếm ${countSpecTriangles(parts)}`);
    assert.equal(merged.triangles, thật, `kỷ ${era}: con số nhà máy tự khai lệch với bộ đệm đỉnh`);
  }
});

test('KHỐI TO ĐƯỢC VÁT, KHỐI MỎNG THÌ KHÔNG — và khối mỏng phải giữ NGUYÊN hình cũ', () => {
  // Vát một cái gờ dày 0,022 bằng dải vát 0,020 là nuốt gần trọn cái gờ vừa dựng ở Phase 8A.
  const to = prism({ w: 1, d: 1, h: 1, role: 'wall' });
  const mỏng = prism({ w: 1, d: 1, h: 0.022, role: 'trim' });
  assert.ok(bevelWidth(to) > 0, 'thân nhà 1×1×1 phải được vát');
  assert.equal(bevelWidth(mỏng), 0, 'gờ mảnh 0,022 không được vát');

  const đỉnh = (p) => buildMergedGeometry(placement([p]), PALETTE, { era: 9 })
    .geometry.getAttribute('position').count / 3;
  assert.equal(đỉnh(mỏng), 12, 'khối không vát phải giữ đúng 12 tam giác như trước Phase 8B');
  assert.equal(đỉnh(to), 28, 'khối vát = 3 vành mặt bên (6×4) + 2 mặt đáy/trên (2×2)');
});

test('DẢI VÁT NẰM ĐÚNG BÊN TRONG KHỐI — không phình ra, không thủng', () => {
  // ⚠️ Vát mà làm khối PHÌNH RA thì nhà sẽ lấn sang ô bên cạnh, và bài "bề ngang" ở
  // `buildingSpec.test.js` sẽ không bắt được vì nó đo tầng MÔ TẢ, không đo hình thật.
  const p = prism({ w: 1, d: 1, h: 1, sides: 4, role: 'wall' });
  const pos = buildMergedGeometry(placement([p]), PALETTE, { era: 9 })
    .geometry.getAttribute('position');
  let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
  for (let i = 0; i < pos.count; i += 1) {
    maxX = Math.max(maxX, Math.abs(pos.getX(i)));
    minY = Math.min(minY, pos.getY(i));
    maxY = Math.max(maxY, pos.getY(i));
  }
  assert.ok(maxX <= 0.5 + 1e-9, `khối phình ra ${maxX.toFixed(4)} > nửa bề ngang 0,5`);
  assert.ok(Math.abs(minY) < 1e-9, 'đáy khối phải đúng y = 0');
  assert.ok(Math.abs(maxY - 1) < 1e-9, 'đỉnh khối phải đúng y = chiều cao');

  // Và dải vát phải THẬT SỰ hẹp lại ở hai đầu — nếu không thì ba vành chỉ là ba bản sao chồng nhau
  // (tốn tam giác mà không có mép vát nào), một cách hỏng mà số tam giác không hề phát hiện được.
  let mépĐáy = 0;
  for (let i = 0; i < pos.count; i += 1) {
    if (Math.abs(pos.getY(i)) < 1e-9) mépĐáy = Math.max(mépĐáy, Math.abs(pos.getX(i)));
  }
  assert.ok(mépĐáy < 0.5 - 1e-6, `vòng đáy rộng ${mépĐáy.toFixed(4)} — không hề thóp vào, tức không có dải vát`);
});
