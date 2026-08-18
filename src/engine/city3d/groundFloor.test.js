/**
 * groundFloor.test.js — TẦNG TRỆT (Phase 10).
 *
 * ⚠️ MỌI BÀI TRONG FILE NÀY ĐỀU ĐÃ ĐƯỢC THỬ-CHO-ĐỎ trước khi commit (luật dự án: *"một bài test
 * chưa từng thấy đỏ thì chưa phải test"*), và với mỗi bài, phép phá được nêu ra TRƯỚC khi chạy —
 * vì bài học Phase 4D còn nói thêm một vế: xanh không cho biết có BAO NHIÊU thứ đang giữ nó xanh,
 * nên phải biết mình mong đỏ ở đâu. Ghi lại phép phá ngay tại chỗ để phiên sau tái lập được.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { ERA_STYLES, getEraStyle, getGroundFloor } from './eraStyle.js';
import { buildBuildingSpec, LEGACY_DOOR_WIDTH, WINDOW_RELIEF, SILL_RELIEF } from './buildingSpec.js';
import { materialFamilyFor } from './materials.js';
import {
  DOOR_KINDS, GROUND_FEATURES, FRAME_ROLES, LEGACY_DOOR,
  DOOR_MIN_WIDTH, DOOR_MAX_WIDTH_RATIO, DOOR_MAX_HEIGHT_RATIO,
  DOOR_FRAME_RELIEF, MAX_STEPS, VERNACULAR_DOOR_SHRINK,
  isValidGroundFloor, doorMetrics, emitGroundFloor,
} from './groundFloor.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);
/** Ba kỷ Đàm chọn cho Bước 1 — làm ít, nhìn kỹ, rồi mới trải ra. */
const DA_NGHIEN_CUU = [6, 9, 13];

/** Bối cảnh mẫu: một mảng nhà cỡ trung bình. Tách ra để mọi bài dùng chung một mốc. */
function ctxMau(gf, over = {}) {
  return {
    gf, bpId: 'bp_mau', index: 0,
    x: 0, z: 0, base: 0, w: 0.9, d: 0.7, height: 1.4, ry: 0,
    storyHeight: 0.7, plain: false, symmetric: false,
    ...over,
  };
}

function dungTangTret(gf, over = {}) {
  const out = [];
  const ok = emitGroundFloor(out, ctxMau(gf, over));
  return { out, ok };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BẢNG
// ═══════════════════════════════════════════════════════════════════════════════

test('BẢNG: cả 15 kỷ đều khai `groundFloor`, và không dòng nào sai định dạng', () => {
  // THỬ-CHO-ĐỎ: xoá `groundFloor` của kỷ 7 → đỏ ở kỷ 7. Đổi `door` của kỷ 6 thành 'khong-co' → đỏ.
  for (const era of ERAS) {
    const gf = getGroundFloor(era);
    assert.ok(gf, `kỷ ${era} không khai \`groundFloor\` — trường này BẮT BUỘC, xem chú thích đầu `
      + '`eraStyle.js`: trường tuỳ chọn thì kỷ mới lặng lẽ rơi về mặc định và cả bảng mất nghĩa');
    assert.ok(isValidGroundFloor(gf),
      `kỷ ${era}: dòng \`groundFloor\` không hợp lệ — ${JSON.stringify(gf)}`);
  }
  assert.equal(ERAS.length, 15);
});

test('BƯỚC 1: ĐÚNG 3 kỷ đã nghiên cứu, ĐÚNG 12 kỷ còn `legacy` — trạng thái dở dang phải ĐẾM ĐƯỢC', () => {
  // ⚠️ Bài này CỐ Ý khoá một con số sẽ phải sửa. Đó là chủ đích, không phải sơ suất: Bước 2 đưa số
  // 12 về 0 và lúc ấy bài test BẮT BUỘC phải được đụng tới — nên trạng thái tạm không thể trôi
  // thành vĩnh viễn trong im lặng. Đây là thứ một dòng chú thích "TODO" không làm được.
  // THỬ-CHO-ĐỎ: đổi kỷ 7 sang một bảng thật → đỏ (12 → 11). Đổi kỷ 6 về `legacy` → đỏ cả hai vế.
  const legacy = ERAS.filter((e) => getGroundFloor(e).door === LEGACY_DOOR);
  const xong = ERAS.filter((e) => getGroundFloor(e).door !== LEGACY_DOOR);
  assert.deepEqual(xong, DA_NGHIEN_CUU,
    `Bước 1 chỉ làm 3 kỷ (6 Việt Nam · 9 Pháp · 13 Nhật); đang có ${JSON.stringify(xong)}`);
  assert.equal(legacy.length, 12);
});

test('KHOÁ VÀO `country`: mỗi dòng phải nói về ĐÚNG nước của kỷ đó, và không dính chữ của nước khác', () => {
  // ⚠️ ĐÂY LÀ SỢI DÂY BUỘC BẢNG TẦNG TRỆT VÀO `country` — vế mà `streetStyle.test.js`/
  // `floraStyle.test.js` làm bằng cách so hai bảng. Bảng này nằm CÙNG FILE với `country` nên không
  // có bảng thứ hai để so; thay vào đó, từ khoá dưới đây làm đúng việc ấy. Chúng sống trong bài
  // test chứ không trong mã sản phẩm, vì nhiệm vụ duy nhất của chúng LÀ sợi dây buộc.
  //
  // Vế thứ hai ("không dính chữ của nước khác") mới là vế bắt được lỗi thật: cách hỏng dễ xảy ra
  // nhất là chép dòng của kỷ này sang kỷ kia rồi sửa nửa chừng.
  // THỬ-CHO-ĐỎ: đổi note kỷ 13 thành "…genkan… kiểu Haussmann" → đỏ ở vế thứ hai.
  const TU_KHOA = {
    'Việt Nam': ['đình làng', 'phố cổ', 'bắc bộ', 'nhà ống', 'bức bàn'],
    'Pháp': ['haussmann', 'paris', 'porte cochère', 'persiennes'],
    'Nhật Bản': ['genkan', 'nhật', 'noren', 'kanban', 'mành che'],
  };
  for (const era of DA_NGHIEN_CUU) {
    const style = getEraStyle(era);
    const note = style.groundFloor.note.toLowerCase();
    const cua_minh = TU_KHOA[style.country];
    assert.ok(cua_minh, `kỷ ${era}: nước "${style.country}" chưa có từ khoá trong bài test này — `
      + 'thêm kỷ nghiên cứu mới thì phải thêm dây buộc cho nó, không được bỏ qua');
    assert.ok(cua_minh.some((k) => note.includes(k)),
      `kỷ ${era} (${style.country}): dòng tầng trệt không nhắc tới thứ gì của nước ấy — "${note}"`);
    for (const [nuoc, tu] of Object.entries(TU_KHOA)) {
      if (nuoc === style.country) continue;
      const lan = tu.filter((k) => note.includes(k));
      assert.equal(lan.length, 0,
        `kỷ ${era} (${style.country}) lại nhắc tới ${nuoc}: ${lan.join(', ')} — dấu hiệu chép dòng`);
    }
  }
});

test('KHÔNG NHÉT ĐẶC ĐIỂM HIỆN ĐẠI VÀO KỶ CỔ', () => {
  // ⚠️ Cùng luật mà `streetStyle.js` đặt cho bó vỉa và vạch kẻ. Ban công sắt uốn và cửa chớp lá
  // sách là chuyện của thế kỷ 17 trở đi; biển hiệu khối bám mặt tiền là chuyện của phố buôn bán
  // có mặt tiền cố định. Rắc chúng lên kỷ đồ đá thì đẹp hơn thật, nhưng nó phá đúng thứ mà cả 15
  // kỷ sinh ra để kể. Đây là cách rẻ nhất để "cho 15 kỷ khác nhau" KHÔNG trở thành nói dối lịch sử.
  // THỬ-CHO-ĐỎ: cho kỷ 3 khai `feature: 'balcony'` → đỏ.
  const CAM = { balcony: 7, shutters: 7, sign: 6 };
  for (const era of ERAS) {
    const gf = getGroundFloor(era);
    for (const [ten, tuKy] of Object.entries(CAM)) {
      for (const truong of ['feature', 'vernacularFeature']) {
        assert.ok(!(gf[truong] === ten && era < tuKy),
          `kỷ ${era} khai \`${truong}: '${ten}'\` — đặc điểm này chỉ có từ kỷ ${tuKy} trở đi`);
      }
    }
  }
});

test('3 kỷ đã nghiên cứu phải phân biệt được với nhau, không phải cùng một cái cửa đổi tên', () => {
  // THỬ-CHO-ĐỎ: cho kỷ 9 dùng `door: 'panel'`, `frame: 'wood'`, `feature: 'porch'` như kỷ 6 → đỏ.
  const truc = (gf) => [gf.door, gf.frame, gf.feature, gf.vernacularFeature, gf.steps];
  for (let i = 0; i < DA_NGHIEN_CUU.length; i += 1) {
    for (let j = i + 1; j < DA_NGHIEN_CUU.length; j += 1) {
      const a = truc(getGroundFloor(DA_NGHIEN_CUU[i]));
      const b = truc(getGroundFloor(DA_NGHIEN_CUU[j]));
      const khac = a.filter((v, k) => v !== b[k]).length;
      assert.ok(khac >= 2,
        `kỷ ${DA_NGHIEN_CUU[i]} và ${DA_NGHIEN_CUU[j]} chỉ khác nhau ${khac}/5 trục tầng trệt`);
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// KHÔNG CÓ ĐƯỜNG RƠI VỀ MẶC ĐỊNH
// ═══════════════════════════════════════════════════════════════════════════════

test('MỌI kiểu cửa trong danh sách đều dựng ra khối THẬT — không kiểu nào rơi vào im lặng', () => {
  // ⚠️ Bài học `PAVING_KINDS`: một danh sách liệt kê thứ ĐỊNH làm chứ không phải thứ ĐÃ làm là một
  // cái phễu — kỷ khai vào đó sẽ nhận về một lỗ trống mà không gì đỏ lên.
  // THỬ-CHO-ĐỎ: thêm 'arch' vào `DOOR_KINDS` mà chưa viết mã dựng → đỏ ngay ở 'arch'.
  // ⚠️ `frame: 'stone'` CHỨ KHÔNG PHẢI 'wood', và đây là một lỗi THẬT của chính bài test này bị
  // phép thử ngược bắt được: bản đầu để khung cửa là gỗ, nên khi thêm một kiểu cửa CHƯA CÓ MÃ DỰNG
  // vào danh sách thì mấy thanh khung gỗ vẫn đủ làm bài test xanh — nó tưởng đã thấy cánh cửa.
  // Muốn hỏi "cánh cửa có được dựng không" thì mọi thứ KHÁC trên mặt tiền phải thôi mang vai gỗ.
  // (Cùng họ với bài học `/envMap,/` xanh oan ở Phase 7A: đếm tổng số lần một vai xuất hiện là
  // cái phễu, phải cắt đúng khối cần hỏi ra rồi mới đếm.)
  const goc = { note: 'dòng thử của bài test', doorWidth: 0.3, doorTall: 0.7, frame: 'stone', recess: 0.3, steps: 1, feature: 'none', vernacularFeature: 'none' };
  const dem = new Map();
  for (const door of DOOR_KINDS) {
    if (door === LEGACY_DOOR) continue;
    const { out, ok } = dungTangTret({ ...goc, door });
    assert.ok(ok, `kiểu cửa '${door}' không dựng được gì cả`);
    const canh = out.filter((p) => p.role === 'wood' && !p.ground);
    assert.ok(canh.length > 0, `kiểu cửa '${door}' không có lấy một cánh cửa nào`);
    dem.set(door, out.length);
  }
  // …và chúng phải KHÁC NHAU, không phải cùng một cánh cửa gọi ba tên.
  const chuKy = new Set([...dem.keys()].map((k) => {
    const { out } = dungTangTret({ ...goc, door: k });
    return out.filter((p) => p.role === 'wood').map((p) => `${p.w.toFixed(3)}@${p.z.toFixed(3)}`).sort().join('|');
  }));
  assert.equal(chuKy.size, dem.size, 'hai kiểu cửa dựng ra hình y hệt nhau');
});

test('MỌI đặc trưng trong danh sách đều dựng ra khối THẬT, và `none` thì đúng là không dựng gì', () => {
  // THỬ-CHO-ĐỎ: thêm 'columns' vào `GROUND_FEATURES` mà chưa viết `case` → đỏ ở 'columns'.
  const goc = { note: 'dòng thử của bài test', door: 'panel', doorWidth: 0.3, doorTall: 0.7, frame: 'wood', recess: 0.3, steps: 1, vernacularFeature: 'none' };
  const nen = dungTangTret({ ...goc, feature: 'none' }).out.length;
  for (const feature of GROUND_FEATURES) {
    const { out } = dungTangTret({ ...goc, feature });
    if (feature === 'none') {
      assert.equal(out.length, nen, '`none` phải là KHÔNG dựng gì thêm, không phải dựng một thứ vô hình');
      continue;
    }
    assert.ok(out.length > nen,
      `đặc trưng '${feature}' có tên trong danh sách nhưng không dựng thêm khối nào`);
  }
});

test('bảng sai định dạng bị TỪ CHỐI THẲNG, không được lặng lẽ dựng bừa', () => {
  const ok = { note: 'dòng thử của bài test', door: 'panel', doorWidth: 0.3, doorTall: 0.7, frame: 'wood', recess: 0.3, steps: 1, feature: 'none', vernacularFeature: 'none' };
  assert.ok(isValidGroundFloor(ok));
  const hong = [
    ['thiếu hẳn', null],
    ['kiểu cửa lạ', { ...ok, door: 'xoay' }],
    ['đặc trưng lạ', { ...ok, feature: 'hologram' }],
    ['khung lạ', { ...ok, frame: 'plutonium' }],
    ['cửa rộng quá trần', { ...ok, doorWidth: DOOR_MAX_WIDTH_RATIO + 0.01 }],
    ['cửa rộng âm', { ...ok, doorWidth: -0.1 }],
    ['bậc quá nhiều', { ...ok, steps: MAX_STEPS + 1 }],
    ['bậc không nguyên', { ...ok, steps: 1.5 }],
    ['hốc ngoài khoảng', { ...ok, recess: 1.4 }],
    ['note rỗng', { ...ok, note: '' }],
    ['legacy mà lại khai đặc trưng', { note: 'x'.repeat(10), door: LEGACY_DOOR, feature: 'porch', vernacularFeature: 'none' }],
  ];
  for (const [ten, gf] of hong) {
    assert.equal(isValidGroundFloor(gf), false, `"${ten}" đáng lẽ phải bị từ chối`);
    assert.equal(dungTangTret(gf).ok, false, `"${ten}" vẫn dựng ra khối`);
  }
  assert.equal(FRAME_ROLES.includes('none'), true, '`frame: none` phải hợp lệ — cửa là một lỗ trên tường');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TỈ LỆ, KHÔNG PHẢI SỐ TUYỆT ĐỐI — đây là lỗi Phase 10 sinh ra để sửa
// ═══════════════════════════════════════════════════════════════════════════════

test('CỬA LÀ TỈ LỆ CỦA BỀ NGANG NHÀ — và đối chứng: con số cũ 0,14 KHÔNG qua nổi bài này', () => {
  // ⚠️ ĐỐI CHỨNG NHỐT BỘ SỐ HỎNG CŨ (luật Phase 9A): một bài test chỉ chứng minh bản mới đúng thì
  // vẫn để ngỏ khả năng nó đúng vì lý do khác. Vế thứ hai bắt phép đo phải còn bắt được đúng cái
  // lỗi đã có thật — cửa rộng cứng 0,14 cho mọi công trình.
  // THỬ-CHO-ĐỎ: bỏ nhân `mass` trong `doorMetrics` (trả về hằng số) → đỏ ở vế thứ nhất.
  const gf = getGroundFloor(9);
  const hep = doorMetrics(gf, { w: 0.45, height: 1.2, storyHeight: 0.76 });
  const rong = doorMetrics(gf, { w: 1.35, height: 2.4, storyHeight: 0.76 });
  assert.ok(rong.doorW > hep.doorW * 2.4,
    `nhà rộng gấp 3 mà cửa chỉ rộng gấp ${(rong.doorW / hep.doorW).toFixed(2)} — cửa chưa theo tỉ lệ`);

  // Đối chứng: nếu ai đó quay lại con số tuyệt đối, tỉ lệ ấy tụt về đúng 1,00 và bài trên sẽ đỏ.
  const tyLeCu = LEGACY_DOOR_WIDTH / LEGACY_DOOR_WIDTH;
  assert.equal(tyLeCu, 1, 'một số tuyệt đối thì không thể nở theo bề ngang nhà — đó chính là lỗi cũ');
  // …và nó SAI ở cả hai đầu: quá rộng trên nhà dân, quá hẹp trên kỳ quan.
  assert.ok(LEGACY_DOOR_WIDTH / 0.45 > 0.28, 'cửa cũ chiếm hơn 28% mặt tiền nhà dân — đọc ra là cái cổng');
  assert.ok(LEGACY_DOOR_WIDTH / 1.35 < 0.12, 'cửa cũ chỉ chiếm dưới 12% mặt tiền kỳ quan — đọc ra là vết nứt');
});

test('TRẦN LUÔN THẮNG SÀN: không bao giờ có cái cửa rộng hơn bức tường nó nằm trên', () => {
  // ⚠️ Thứ tự phép kẹp là chỗ dễ viết ngược nhất, và viết ngược thì lỗi chỉ hiện ra ở mảng nhà hẹp
  // — tức ở nhà dân, tức ở 30 trong 35 công trình mỗi thành phố.
  //
  // ⚠️ NHƯNG PHÉP THỬ NGƯỢC ĐÃ CHỈ RA MỘT SỰ THẬT PHẢI GHI LẠI: **đảo thứ tự kẹp MỘT MÌNH KHÔNG
  // làm bài này đỏ.** Lý do là hôm nay có HAI thứ cùng giữ nó xanh — câu chặn "mảng quá hẹp thì
  // trả `null`" ở `doorMetrics` đã loại sạch mọi ca mà cái sàn có thể thắng cái trần. Phải gỡ CẢ
  // HAI (bỏ câu chặn *và* đảo thứ tự kẹp) thì mới đỏ; đã thử và thấy đỏ.
  // Đây đúng bài học Phase 4D: *một bài test xanh không cho biết có BAO NHIÊU thứ đang giữ nó
  // xanh*. Ghi ra đây vì nếu phiên sau gỡ câu chặn ấy vì một lý do khác, họ cần biết rằng lưới an
  // toàn còn lại chỉ là thứ tự kẹp — chứ không phải hai lớp như trước.
  const gf = getGroundFloor(6);
  for (let w = 0.2; w <= 2.0; w += 0.02) {
    const m = doorMetrics(gf, { w, height: 1.5, storyHeight: 0.66 });
    if (!m) continue;
    assert.ok(m.doorW <= w * DOOR_MAX_WIDTH_RATIO + 1e-9,
      `bề ngang ${w.toFixed(2)}: cửa rộng ${m.doorW.toFixed(3)} > trần ${(w * DOOR_MAX_WIDTH_RATIO).toFixed(3)}`);
    assert.ok(m.doorH <= 1.5 * DOOR_MAX_HEIGHT_RATIO + 1e-9, 'cửa cao quá trần');
  }
});

test('MẢNG NHÀ QUÁ HẸP THÌ KHÔNG CÓ CỬA — chứ không phải có cái cửa tí hon', () => {
  // ⚠️ Bài học Phase 7D ("KẸP thì phá thứ tự"): cứ kẹp thì mọi mảng hẹp ra cùng một cỡ cửa, và bốn
  // kỷ khai bốn con số sẽ dựng ra một kết quả. Một bức tường hông không có cửa là chuyện bình
  // thường ngoài đời; một cái cửa rộng 4cm thì không.
  // THỬ-CHO-ĐỎ: bỏ câu `if (ceiling < DOOR_MIN_WIDTH) return null` → đỏ.
  const gf = getGroundFloor(13);
  const quaHep = DOOR_MIN_WIDTH / DOOR_MAX_WIDTH_RATIO - 0.01;
  assert.equal(doorMetrics(gf, { w: quaHep, height: 1.2, storyHeight: 0.66 }), null);
  assert.equal(dungTangTret(gf, { w: quaHep }).ok, false);
  assert.equal(dungTangTret(gf, { w: quaHep }).out.length, 0, 'đã từ chối mà vẫn ghi khối vào danh sách');
  // Ngay trên ngưỡng thì phải dựng được — nếu không, cái ngưỡng đang ăn cả vùng hợp lệ.
  assert.ok(doorMetrics(gf, { w: quaHep + 0.05, height: 1.2, storyHeight: 0.66 }));
});

test('KHUNG CỬA PHẢI NHÔ RA XA HƠN MỌI CHI TIẾT CỬA SỔ — cửa là cái neo tỉ lệ', () => {
  // ⚠️ Bài này import CẢ HAI bên rồi so, không chép con số nào sang đây. Đó là khác biệt giữa
  // "khoá công thức" và "khoá sự KHỚP NHAU" — bài học Phase 8B (`countTriangles`).
  // THỬ-CHO-ĐỎ: hạ `DOOR_FRAME_RELIEF` xuống 0,05 → đỏ.
  assert.ok(DOOR_FRAME_RELIEF > SILL_RELIEF,
    `khung cửa (${DOOR_FRAME_RELIEF}) nhô ra ít hơn bệ cửa sổ (${SILL_RELIEF}) — cửa sẽ chìm xuống `
    + 'dưới cửa sổ trong thứ bậc thị giác, và mắt mất mốc để ước lượng công trình to cỡ nào');
  assert.ok(DOOR_FRAME_RELIEF > WINDOW_RELIEF);
});

// ═══════════════════════════════════════════════════════════════════════════════
// NGÂN SÁCH — PHẢI THẬT SỰ CẮN
// ═══════════════════════════════════════════════════════════════════════════════

test('NHÀ DÂN NHẸ HƠN CÔNG TRÌNH CHÍNH THẬT SỰ — ngân sách LOD phải CẮN', () => {
  // ⚠️ Bài học Phase 8D: một ngân sách đặt bằng đúng khoảng mà mức cao có thể ra thì hai mức y hệt
  // nhau, và cơ chế trở thành mã chết mà ảnh vẫn "trông có vẻ đúng". Nhà dân là 30/35 công trình
  // mỗi thành phố nên nó mới là chỗ quyết định ngân sách.
  // THỬ-CHO-ĐỎ: bỏ nhân `VERNACULAR_DOOR_SHRINK` và bỏ chặn má cửa cho nhà dân → đỏ.
  assert.ok(VERNACULAR_DOOR_SHRINK < 1);
  for (const era of DA_NGHIEN_CUU) {
    const gf = getGroundFloor(era);
    const chinh = dungTangTret(gf, { plain: false, symmetric: true });
    const dan = dungTangTret(gf, { plain: true });
    assert.ok(dan.out.length < chinh.out.length,
      `kỷ ${era}: nhà dân ${dan.out.length} khối, công trình chính ${chinh.out.length} — ngân sách không cắn`);
    const rongChinh = doorMetrics(gf, { w: 0.9, height: 1.4, storyHeight: 0.7, plain: false }).doorW;
    const rongDan = doorMetrics(gf, { w: 0.9, height: 1.4, storyHeight: 0.7, plain: true }).doorW;
    assert.ok(rongDan < rongChinh, `kỷ ${era}: cửa nhà dân không hề hẹp hơn cửa công trình chính`);
    assert.ok(doorMetrics(gf, { w: 0.9, height: 1.4, storyHeight: 0.7, plain: true }).steps <= 1,
      `kỷ ${era}: nhà dân có quá 1 bậc thềm — bậc nhiều là dấu hiệu công trình được nâng khỏi mặt đất`);
  }
});

test('KHÔNG THÊM MỘT LỆNH VẼ NÀO: tầng trệt chỉ dùng họ vật liệu thành phố VỐN ĐÃ CÓ', () => {
  // ⚠️ ĐÂY LÀ CÁCH NGHIỆM THU RÀNG BUỘC "cấm tiêu lệnh vẽ mới" BẰNG QUAN HỆ, không bằng một con số
  // đếm được ở đâu đó. Mỗi họ vật liệu = một lệnh vẽ (`MATERIAL_ORDER`, `materials.js`); nếu tập
  // họ của phần tầng trệt nằm gọn trong tập họ của phần còn lại thì số lệnh vẽ KHÔNG THỂ tăng,
  // bất kể sau này thêm bao nhiêu chi tiết.
  //
  // ⚠️ VÀ PHẢI HỎI Ở ĐÚNG CẤP: cả thành phố GỘP thành một bộ khối theo họ vật liệu, không phải mỗi
  // công trình một bộ (bằng chứng: cảnh thật chỉ có 12–13 lệnh vẽ trong khi có 16 họ — xem
  // `PERFORMANCE.md`). Bản đầu của bài này hỏi ở cấp TỪNG CÔNG TRÌNH và **báo động giả ngay**: kỳ
  // quan kỷ 9 tự nó không dùng `wood`, nên cánh cửa gỗ Paris trông như một họ mới — trong khi nhà
  // dân và xưởng của chính kỷ ấy đã kéo `wood` vào bộ khối chung từ lâu. Đúng họ với `TECH_DEBT
  // #22`: phép đo đúng, cấp độ sai, và nó sai theo hướng GÂY HOẢNG.
  //
  // THỬ-CHO-ĐỎ: đổi một vai trong `groundFloor.js` thành 'water' (không kỷ nào có) → đỏ cả 15 kỷ.
  const LOAI = ['infrastructure', 'economy', 'defense', 'wonder', 'house', 'shop', 'workshop'];
  for (const era of ERAS) {
    const style = getEraStyle(era);
    const nen = new Set();
    const them = new Set();
    for (const type of LOAI) {
      for (const rarity of ['common', 'rare', 'epic']) {
        const spec = buildBuildingSpec({ bpId: `bp_${type}_${rarity}`, era, type, rarity, level: 3 });
        for (const p of spec.parts) {
          (p.ground ? them : nen).add(materialFamilyFor(p.role, style));
        }
      }
    }
    for (const ho of them) {
      assert.ok(nen.has(ho),
        `kỷ ${era}: tầng trệt kéo thêm họ vật liệu "${ho}" mà cả thành phố vốn không có `
        + '⇒ MỘT LỆNH VẼ MỚI cho mỗi khung hình');
    }
  }
});

test('ĐỐI CHỨNG: phép đo lệnh vẽ ở trên thật sự bắt được một họ vật liệu lạ', () => {
  // ⚠️ Không có bài này thì bài trên có thể xanh vì nó chẳng đo gì (ví dụ: cờ `ground` không được
  // gắn ⇒ `them` luôn rỗng ⇒ vòng lặp không chạy lần nào). Luật Phase 9A: mỗi ngưỡng phải kèm một
  // đối chứng nhốt sẵn ca hỏng, nếu không nó sẽ được nới dần cho tiện.
  const style = getEraStyle(9);
  const spec = buildBuildingSpec({ bpId: 'bp_x', era: 9, type: 'shop', rarity: 'common', level: 2 });
  const ground = spec.parts.filter((p) => p.ground);
  assert.ok(ground.length > 0, 'cờ `ground` không được gắn — bài "không thêm lệnh vẽ" đang chạy rỗng');
  const nen = new Set(spec.parts.filter((p) => !p.ground).map((p) => materialFamilyFor(p.role, style)));
  assert.equal(nen.has(materialFamilyFor('water', style)), false,
    'kỷ 9 mà đã có họ `water` thì đối chứng này mất tác dụng — chọn một họ khác');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TẤT ĐỊNH & BIẾN THỂ THEO HẠT GIỐNG
// ═══════════════════════════════════════════════════════════════════════════════

test('TẤT ĐỊNH: cùng đầu vào → cùng mô tả, và không có `Math.random`/`Date` trong tầng này', async () => {
  const gf = getGroundFloor(6);
  assert.deepEqual(dungTangTret(gf).out, dungTangTret(gf).out);
  const nguon = await readFile(new URL('./groundFloor.js', import.meta.url), 'utf8');
  const khongChuThich = nguon.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.equal(/Math\.random|new Date|Date\.now/.test(khongChuThich), false,
    'tầng mô tả phải THUẦN — một công trình đã xây thì vĩnh viễn không được đổi hình (ADR-007)');
  // Bộ lọc chú thích có thật sự hoạt động không — nếu không thì bài trên xanh oan.
  assert.ok(khongChuThich.length < nguon.length * 0.7, 'bộ lọc chú thích không cắt được gì');
});

test('BIẾN THỂ THEO HẠT GIỐNG: mỗi đại lượng seeded phải TỰ NÓ biến thiên', () => {
  // ⚠️ Bài học Phase 8D, lỗi đã cắn BỐN lần trong `flora.js`: viết cứng số tấm/số cột thì "40 hạt
  // chỉ ra 2–4 dáng", và không gì đỏ lên vì mã vẫn chạy đúng.
  //
  // ⚠️ VÀ BẢN ĐẦU CỦA CHÍNH BÀI NÀY ĐÃ HỎNG ĐÚNG KIỂU ẤY — phép thử ngược bắt được: nó gom cả
  // công trình vào một chữ ký rồi đếm chữ ký khác nhau, mà chữ ký ấy chứa toạ độ `x`, mà `x` thì
  // đã lệch theo hạt giống sẵn. Nên **viết cứng số tấm cửa vẫn cho ra 40 chữ ký khác nhau** và bài
  // test xanh trơn. Một phép đo gộp nhiều đại lượng thì chỉ cần MỘT đại lượng còn sống là nó không
  // bao giờ đỏ — cùng hình dạng với "hằng số nền pha loãng 1,43 lần xuống 1,16 lần" ở vòng 2
  // Performance Gate.
  // ⇒ Bản đúng: mỗi ca dưới đây bật đúng MỘT đại lượng seeded và tắt hết những cái khác.
  const goc = { note: 'dòng thử của bài test', doorWidth: 0.3, doorTall: 0.7, frame: 'stone', recess: 0.3, steps: 1, vernacularFeature: 'none' };
  // Ba ca đầu khoá cửa ở CHÍNH GIỮA (`symmetric`) để độ lệch cửa thôi che mất đại lượng cần đo.
  const CA = [
    ['số tấm cửa bức bàn', { ...goc, door: 'panel', feature: 'none' }, true, 3],
    ['số cột hàng hiên', { ...goc, door: 'double', feature: 'porch' }, true, 3],
    ['số con tiện lan can', { ...goc, door: 'double', feature: 'balcony' }, true, 3],
  ];
  for (const [ten, gf, symmetric, toiThieu] of CA) {
    const dem = new Set();
    for (let i = 0; i < 40; i += 1) dem.add(dungTangTret(gf, { bpId: `bp_${i}`, symmetric }).out.length);
    assert.ok(dem.size >= toiThieu,
      `${ten}: 40 hạt giống chỉ ra ${dem.size} giá trị — đại lượng này đang bị viết cứng`);
  }

  // Hai ca sau là BÊN NÀO, không phải BAO NHIÊU — nên đo TƯƠNG ĐỐI so với tâm cửa, để độ lệch cửa
  // (cũng seeded) không trộn vào. Tâm cửa chính là khối `dark` — lòng cửa.
  const ben = (gf, bpId, loc) => {
    const { out } = dungTangTret(gf, { bpId, symmetric: false });
    const tam = out.find((p) => p.role === 'dark');
    return loc(out, tam);
  };
  const truot = new Set();
  const bienHieu = new Set();
  for (let i = 0; i < 40; i += 1) {
    // Cửa lùa: tấm nào nằm ở đường ray NGOÀI — đo bằng dấu của (x tấm sâu nhất − x tâm cửa).
    truot.add(ben({ ...goc, door: 'sliding', feature: 'none' }, `bp_${i}`, (out, tam) => {
      const canh = out.filter((p) => p.role === 'wood').sort((a, b) => b.z - a.z)[0];
      return canh && canh.x > tam.x ? 'phải' : 'trái';
    }));
    // Biển hiệu: treo bên trái hay bên phải cửa.
    bienHieu.add(ben({ ...goc, door: 'double', feature: 'sign' }, `bp_${i}`, (out, tam) => {
      const bien = out.filter((p) => p.role === 'wood').sort((a, b) => Math.abs(b.x - tam.x) - Math.abs(a.x - tam.x))[0];
      return bien && bien.x > tam.x ? 'phải' : 'trái';
    }));
  }
  assert.equal(truot.size, 2, 'cửa lùa luôn để cùng một tấm ra ngoài — bên nào đang bị viết cứng');
  assert.equal(bienHieu.size, 2, 'biển hiệu luôn treo cùng một bên — bên nào đang bị viết cứng');
});

test('KỲ QUAN: cửa nằm CHÍNH GIỮA, tuyệt đối không lệch dù hạt giống nào', () => {
  // THỬ-CHO-ĐỎ: bỏ nhánh `symmetric ? 0 : …` → đỏ.
  for (const era of DA_NGHIEN_CUU) {
    const gf = getGroundFloor(era);
    for (let i = 0; i < 20; i += 1) {
      const { out } = dungTangTret(gf, { bpId: `bp_${i}`, symmetric: true });
      const tong = out.reduce((s, p) => s + p.x, 0);
      assert.ok(Math.abs(tong) < 1e-9,
        `kỷ ${era} hạt ${i}: tầng trệt của kỳ quan lệch ${tong.toFixed(4)} theo trục X`);
    }
  }
});

test('12 KỶ `legacy` KHÔNG ĐỔI GÌ — vẫn đúng cái cửa cũ, không một khối tầng trệt nào', () => {
  // ⚠️ Đây là thứ cho phép nghiệm thu hướng mỹ thuật ở 3 kỷ mà không làm 12 kỷ kia đổi theo. Nó
  // dùng `LEGACY_DOOR_WIDTH` import từ mã sản phẩm chứ không chép số 0,14 vào đây.
  // THỬ-CHO-ĐỎ: bỏ câu `if (hasGroundFloor) return` trong `emitWindows` → đỏ (kỷ legacy vẫn ổn,
  // nhưng 3 kỷ mới sẽ có cả hai cửa; đổi phép phá thành "cho kỷ 7 một bảng thật" → đỏ ngay).
  for (const era of ERAS) {
    if (getGroundFloor(era).door !== LEGACY_DOOR) continue;
    const spec = buildBuildingSpec({ bpId: 'bp_x', era, type: 'economy', rarity: 'rare', level: 2 });
    assert.equal(spec.parts.filter((p) => p.ground).length, 0,
      `kỷ ${era} khai legacy mà vẫn dựng tầng trệt`);
    if (getEraStyle(era).windows === 'none') continue;   // kỷ 1 và 2 xưa nay KHÔNG có cửa nào
    const cua = spec.parts.filter((p) => p.role === 'dark' && Math.abs(p.w - LEGACY_DOOR_WIDTH) < 1e-9);
    assert.ok(cua.length > 0, `kỷ ${era}: cửa đời cũ đã biến mất`);
  }
});

test('3 KỶ MỚI: cửa cũ đã đi hẳn, không còn hai cái cửa chồng lên nhau', () => {
  // THỬ-CHO-ĐỎ: bỏ `hasGroundFloor` khỏi lời gọi `emitWindows` → đỏ.
  for (const era of DA_NGHIEN_CUU) {
    const spec = buildBuildingSpec({ bpId: 'bp_x', era, type: 'economy', rarity: 'rare', level: 2 });
    const cuaCu = spec.parts.filter((p) => p.role === 'dark' && Math.abs(p.w - LEGACY_DOOR_WIDTH) < 1e-9);
    assert.equal(cuaCu.length, 0, `kỷ ${era} vẫn còn cửa đời cũ chồng lên cửa mới`);
    assert.ok(spec.parts.filter((p) => p.ground).length > 0, `kỷ ${era} không dựng tầng trệt nào`);
  }
});
