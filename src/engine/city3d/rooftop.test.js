/**
 * rooftop.test.js — CANH PHẦN HÌNH của Phase 11.
 *
 * ⚠️ RANH GIỚI VỚI HAI BÀI TEST ANH EM — đọc trước khi thêm bài mới vào đây.
 *
 *   `roofStyle.test.js`     canh **BẢNG**: 15 dòng có đủ không, có buộc vào `country` không, 15 kỷ
 *                           có ra 15 cái mái khác nhau không.
 *   `drawCallBudget.test.js` canh **LỆNH VẼ** trên quần thể thật. Đó là nơi DUY NHẤT phát biểu luật
 *                           *"mỗi kỷ không được tốn hơn mốc của chính nó"*. File này **không** chép
 *                           lại luật ấy — chép là tạo ra "một luật hai công thức", thứ đã cắn dự án
 *                           ở `daylight.test.js` và `palette3d.js`. Ở đây chỉ hỏi một câu HẸP HƠN và
 *                           KHÁC hẳn: *"`rooftop.js` có kéo vào một VAI nào ngoài danh sách đã đo
 *                           không"* — bắt được cùng một tai nạn sớm hơn một tầng, ở mức đơn vị.
 *
 *   File này canh **HÌNH**: mỗi kiểu có dựng ra khối thật không · kích thước có phải tỉ lệ có trần
 *                           không · LOD có cắn không · thành phố có bị nhân bản không · kỳ quan có
 *                           còn cân không.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  emitRooftop, stackWidth, stackSlots,
  ROOFTOP_MIN_SPAN, STACK_W_MIN, STACK_W_MAX_RATIO,
} from './rooftop.js';
import { CROWN_KINDS, STACK_KINDS, ROOF_STYLES } from './roofStyle.js';
import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import { collectCitySpecs } from './cityParts.js';

const ERAS = Object.keys(ROOF_STYLES).map(Number).sort((a, b) => a - b);
const CROWNS = CROWN_KINDS.filter((k) => k !== 'none');
const STACKS = STACK_KINDS.filter((k) => k !== 'none');

/**
 * Một `RoofAnchors` đầy đủ: có mặt bằng (`deck`) VÀ có sống mái (`ridges`), nên mọi kiểu đều tìm
 * thấy chỗ bám. Đây là chỗ đứng để hỏi *"cái hàm dựng này có chạy không"*, KHÔNG phải để hỏi
 * *"thành phố thật trông ra sao"* — câu sau luôn hỏi trên `collectCitySpecs`.
 */
function neo(rw = 0.9) {
  return {
    x: 0, z: 0, eaveY: 1, apexY: 1.35, rw, rd: rw, pitch: 0.3,
    deck:   { x: 0, z: 0, y: 1.35, w: rw * 0.94, d: rw * 0.94 },
    ridges: [{ x: 0, z: 0, y: 1.35, w: rw, ry: 0 }],
  };
}

function dongThu(patch) {
  return {
    crown: 'none', crownWeight: 0, stack: 'none', stackCount: 1,
    vernacularCrown: 'none', vernacularStack: 'none',
    note: 'dòng thử dùng riêng trong bài test', ...patch,
  };
}

function dung(rs, ctx = {}, a = neo()) {
  const out = [];
  emitRooftop(out, rs, a, { bpId: 'bp', index: 0, ...ctx });
  return out;
}

/** Một dòng bảng chỉ khai ĐÚNG MỘT kiểu, ở đúng một vế — để mỗi phép đo hỏi đúng một biến. */
function chiCo(truc, kind, { plain = false } = {}) {
  if (truc === 'crown') {
    return plain
      ? dongThu({ vernacularCrown: kind, crownWeight: 1.0 })
      : dongThu({ crown: kind, crownWeight: 1.0 });
  }
  return plain ? dongThu({ vernacularStack: kind, stackCount: 2 }) : dongThu({ stack: kind, stackCount: 2 });
}

/** Chữ ký hình học của một danh sách khối — dùng để hỏi "hai cái mái này có giống hệt nhau không". */
function chuKy(parts) {
  return parts
    .map((p) => [p.x, p.y, p.z, p.w, p.d, p.h, p.ry ?? 0, p.sides ?? 0, p.taper ?? 1, p.role]
      .map((v) => (typeof v === 'number' ? v.toFixed(5) : v)).join(','))
    .sort().join('|');
}

/** Thành phố trưởng thành của một kỷ — ĐÚNG quần thể mà `drawCallBudget.test.js` đo. */
function thanhPho(era) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  return computeCityLayout({
    built: ids,
    levels: Object.fromEntries(ids.map((id) => [id, 1])),
    era,
    stats: { sessionCount: 40, streakLength: 9 },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════

test('MỌI KIỂU KHAI ĐƯỢC ĐỀU PHẢI DỰNG RA KHỐI THẬT — "hợp lệ" và "dựng ra thật" là HAI câu hỏi', () => {
  // ⚠️ Đây chính là cái bẫy đã cắn ở Phase 10 Bước 2: `isValidGroundFloor` từ chối đúng, `emitGroundFloor`
  // trả `false` đúng, và **cả kỷ 14 không có cửa** — build xanh, lint sạch, không một cảnh báo nào.
  // Hai lời "đúng" cộng lại thành một lỗi. Nên phải có người ĐẾM ở đầu bên kia.
  const khongDung = [];
  let daKiem = 0;
  for (const [truc, ds] of [['crown', CROWNS], ['stack', STACKS]]) {
    for (const kind of ds) {
      for (const plain of [false, true]) {
        const out = dung(chiCo(truc, kind, { plain }), { plain });
        if (out.length === 0) khongDung.push(`${truc}:${kind}${plain ? ' (nhà dân)' : ''}`);
        daKiem += 1;
      }
    }
  }
  assert.equal(daKiem, (CROWNS.length + STACKS.length) * 2,
    'không duyệt đủ mọi kiểu × hai vế — một `continue` đặt nhầm chỗ đã nuốt mất vài kiểu');
  assert.deepEqual(khongDung, [],
    `khai được mà KHÔNG dựng ra khối nào: ${khongDung.join(' · ')} — bảng nói có, màn hình nói không`);
});

test('TRẦN LUÔN THẮNG SÀN: mái quá hẹp thì KHÔNG có vật, chứ không phải một vật tí hon', () => {
  // ⚠️ Bẫy `eaves` ở Phase 7C: một số tuyệt đối áp lên những khối chênh nhau nhiều lần thì sớm muộn
  // cũng sai — cái mái đua 0,4 trên một căn nhà rộng 0,56 thò ra 71% mỗi bên và đọc thành CÂY NẤM.
  // Luật ở đây: `STACK_W_MAX_RATIO` (trần theo tỉ lệ) phải thắng `STACK_W_MIN` (sàn tuyệt đối), và
  // khi hai cái đó mâu thuẫn thì câu trả lời là **KHÔNG DỰNG**, không phải "dựng bé lại nữa".
  const nguong = STACK_W_MIN / STACK_W_MAX_RATIO;
  assert.equal(stackWidth(nguong * 0.99), 0,
    'mái hẹp hơn ngưỡng vẫn nặn ra một vật — sàn tuyệt đối đang thắng trần tỉ lệ');
  assert.ok(stackWidth(nguong * 1.01) > 0, 'mái vừa qua ngưỡng mà không dựng được gì');

  let truoc = 0;
  for (const span of [0.05, 0.1, 0.18, 0.2, 0.24, 0.4, 0.9, 1.6, 3, 8]) {
    const w = stackWidth(span);
    assert.ok(w === 0 || w <= span * STACK_W_MAX_RATIO + 1e-12,
      `span ${span}: bề ngang ${w} vượt trần tỉ lệ ${STACK_W_MAX_RATIO}`);
    assert.ok(w === 0 || w >= STACK_W_MIN - 1e-12,
      `span ${span}: bề ngang ${w} nhỏ hơn sàn ${STACK_W_MIN} mà vẫn được dựng`);
    assert.ok(w >= truoc, `span ${span}: mái RỘNG hơn mà vật lại NHỎ đi (${truoc} → ${w})`);
    truoc = w;
  }
  // Đầu vào rác không được ra `NaN` — một `NaN` lọt vào hình học thì cả khối biến mất trong im lặng.
  for (const rac of [NaN, undefined, null, -5, Infinity]) {
    assert.ok(Number.isFinite(stackWidth(rac)), `stackWidth(${String(rac)}) ra số không hữu hạn`);
  }
});

test('`stackCount` là mong muốn văn hoá, BỀ NGANG MÁI mới là thứ quyết định nhét vừa mấy cái', () => {
  assert.equal(stackSlots(2, 0.1, 4), 4, 'mái rộng mà không nhét đủ số kỷ khai');
  assert.equal(stackSlots(0.2, 0.1, 4), 1, 'mái hẹp mà vẫn nhét 4 cái — bề ngang không được tôn trọng');
  assert.equal(stackSlots(2, 0.1, 99), 4, 'không có trần trên số lượng');
  assert.equal(stackSlots(2, 0, 3), 0, 'vật bề ngang 0 mà vẫn xếp chỗ');
  // ⚠️ Kết quả luôn phải NGUYÊN và không âm — đây là số cái, không phải một tỉ lệ.
  for (const [span, w, n] of [[1, 0.07, 2], [0.3, 0.09, 3], [5, 0.2, 1], [0.1, 0.2, 4]]) {
    const s = stackSlots(span, w, n);
    assert.ok(Number.isInteger(s) && s >= 0 && s <= 4, `stackSlots(${span},${w},${n}) = ${s}`);
  }
});

test('MÁI QUÁ NHỎ THÌ KHÔNG CÓ GÌ TRÊN NÓ — và ranh giới ấy phải kiểm CẢ HAI PHÍA', () => {
  // Một cái ống khói to bằng nửa căn nhà là một cây nấm. `ROOFTOP_MIN_SPAN` là câu trả lời "thôi
  // không dựng", và một ngưỡng chỉ kiểm một phía là cái phễu chứ không phải hàng rào (Phase 9A).
  const rs = dongThu({ crown: 'ridge', crownWeight: 1, stack: 'chimney' });
  assert.equal(dung(rs, {}, neo(ROOFTOP_MIN_SPAN * 0.99)).length, 0,
    'mái hẹp hơn ngưỡng vẫn mọc đồ lên trên');
  assert.ok(dung(rs, {}, neo(ROOFTOP_MIN_SPAN)).length > 0,
    'mái đúng bằng ngưỡng mà không dựng được gì — ngưỡng đang lệch một nấc');

  // …và neo hỏng thì phải TỪ CHỐI THẲNG, không đoán bừa một cái mái.
  for (const [a, vi] of [
    [null, 'không có neo'],
    [{ ...neo(), rw: 0 }, 'bề ngang 0'],
    [{ ...neo(), rd: NaN }, 'chiều sâu NaN'],
  ]) {
    assert.equal(emitRooftop([], rs, a, { bpId: 'x' }), false, `phải từ chối: ${vi}`);
  }
  assert.equal(emitRooftop([], dongThu({ crown: 'kieu-la' }), neo(), { bpId: 'x' }), false,
    'dòng bảng sai định dạng mà vẫn dựng — validator đang bị bỏ qua');
});

test('THỨ CẦN MẶT BẰNG THÌ KHÔNG ĐƯỢC DỰNG TRÊN MÁI DỐC', () => {
  // Một bồn nước trên đỉnh mái nhọn thì đứng bằng gì? `NEEDS_DECK` là câu trả lời, và nó phải
  // im lặng bỏ qua chứ không dựng bừa.
  const khongCoSan = { ...neo(), deck: null };
  const dungTrenSan = [];
  for (const kind of STACKS) {
    if (dung(chiCo('stack', kind), {}, khongCoSan).length === 0) dungTrenSan.push(kind);
  }
  assert.deepEqual(dungTrenSan.sort(),
    ['condenser', 'dryingRack', 'liftHouse', 'mast', 'planter', 'roofHatch', 'tank'],
    'danh sách "cần mặt bằng" đã đổi — hoặc một vật vừa mọc lên mái dốc, hoặc một vật vừa mất chỗ');
});

test('LOD PHẢI THẬT SỰ CẮN — và đo bằng cách giữ nguyên KIỂU, chỉ lật `plain`', () => {
  // ⚠️ CÁCH ĐO NÀY LÀ MỘT QUYẾT ĐỊNH, KHÔNG PHẢI TIỆN TAY. Cách hiển nhiên hơn — so số khối mái của
  // KỲ QUAN với của NHÀ DÂN trên quần thể thật — **đo sai đại lượng**: hai vế đọc HAI CỘT KHÁC NHAU
  // của bảng (`crown`/`stack` vs `vernacularCrown`/`vernacularStack`). Đo thử thì kỷ 6 ra "nhà dân
  // 20,4 khối > kỳ quan 17,6" và kỷ 10 ra "8,0 > 6,6", trông y hệt một LOD hỏng — nhưng sự thật là
  // đình làng Bắc Bộ có đầu đao (8 khối) còn nhà ba gian lợp ngói mũi hài (12 khối); hai ĐẶC TRƯNG
  // khác nhau, không phải hai mức chi tiết của một đặc trưng. Trộn hai trục vào một phép đo là đúng
  // bẫy `TECH_DEBT #22`. Giữ kiểu cố định thì phép đo hỏi đúng một biến.
  const can = [];
  for (const [truc, ds] of [['crown', CROWNS], ['stack', STACKS]]) {
    for (const kind of ds) {
      const nhieu = dung(chiCo(truc, kind), {}).length;
      const it = dung(chiCo(truc, kind, { plain: true }), { plain: true }).length;
      assert.ok(it <= nhieu,
        `"${kind}": nhà dân tốn ${it} khối, NHIỀU HƠN công trình chính ${nhieu} — LOD chạy ngược`);
      if (it < nhieu) can.push(kind);
    }
  }
  // ⚠️ ĐẾM ĐƯỢC, KHÔNG IM LẶNG (Phase 8D: cơ chế lùm cây chạy suốt một phase mà chẳng đổi gì).
  // Bốn kiểu KHÔNG cắn vì chúng vốn không có gì để cắt: `ridge` là MỘT thanh nóc; `crossPoles`,
  // `chimney`, `mast`, `condenser` có số khối do hình dạng quy định chứ không do chi tiết. Nếu một
  // kiểu rơi ra khỏi danh sách này thì hoặc nhánh `plain` của nó vừa bị quên, hoặc nó vừa có thêm
  // chi tiết mà không ai hạ ngân sách cho nhà dân.
  assert.deepEqual(can.sort(),
    ['balustrade', 'barrel', 'beamEnds', 'dormer', 'dryingRack', 'liftHouse', 'planter', 'roofHatch', 'tank', 'upturn'],
    `danh sách kiểu có LOD cắn đã đổi (nay: ${can.sort().join(', ')})`);
  assert.ok(can.length >= (CROWNS.length + STACKS.length) / 2,
    `chỉ ${can.length}/${CROWNS.length + STACKS.length} kiểu có LOD cắn — cơ chế đang gần như không làm gì`);
});

test('KHÔNG CÓ HAI CÁI MÁI GIỐNG HỆT NHAU trong cùng một kỷ — đo trên QUẦN THỂ THẬT', () => {
  // ⚠️ ĐO CÁI ĐÁNG LO, ĐỪNG ĐO CƠ CHẾ. Ba kiểu đường nét (`ridge`, `upturn`, `balustrade`) KHÔNG hề
  // đọc hạt giống — 40 hạt ra đúng 1 chữ ký. Nghe như đúng bẫy Phase 8D (`sides`/`taper` viết cứng
  // ⇒ "40 hạt chỉ ra 2–4 dáng"). Đo trên thành phố thật thì KHÔNG: cả 5 công trình và cả 20 nhà dân
  // của MỌI kỷ đều ra chữ ký khác nhau, vì biến thể chảy qua **kích thước mái** (`RoofAnchors`) chứ
  // không chỉ qua hạt giống. Một thanh nóc thẳng thì ngoài đời cũng thẳng như nhau; thứ phân biệt
  // hai căn nhà là chúng to nhỏ khác nhau.
  //
  // ⚠️ Nhưng đó đúng là hình dạng "một lời hứa đúng NHỜ MỘT THỨ CHẲNG LIÊN QUAN" đã cắn ở Phase 7D.
  // Nên phải khoá chính KẾT QUẢ (không nhân bản), không khoá cơ chế — nếu ngày nào nhà dân bị làm
  // cho bằng cỡ nhau thì bài này đỏ, dù không ai đụng vào `rooftop.js`.
  //
  // ⚠️ CÓ **HAI** THỨ ĐANG GIỮ BÀI NÀY XANH, VÀ ĐÃ ĐẾM BẰNG PHÉP THỬ NGƯỢC (Phase 4D: *"một bài
  // test xanh không cho biết có BAO NHIÊU thứ đang giữ nó xanh"*):
  //   (1) `rooftop.js` bám theo neo — thử cho `emitTank` không dựng gì ⇒ bài này ĐỎ ở kỷ 11/13.
  //   (2) neo tự nó khác nhau — thử ép mọi mái nhận đúng một cái neo ⇒ ĐỎ.
  // Ép chung MỘT trong hai (chỉ hạt giống, hoặc chỉ cỡ mái mà giữ nguyên `x`/`z`) thì **KHÔNG đỏ**.
  // Nói cho đúng: nguồn biến thể nằm ở bộ sinh KHỐI NHÀ chứ không ở file này; bài test canh cả
  // chuỗi, và đó là chủ ý — thứ Đàm nhìn thấy là kết quả cuối, không phải một mắt xích.
  let daKiem = 0;
  // ⚠️ 2026-08-24 — MỘT LOẠI CÔNG TRÌNH KHÔNG CÓ MÁI ĐỂ MÀ SO. Nguyên mẫu `monolith` (ADR-062) dựng
  // kỳ quan THẲNG TỪ MẶT ĐẤT thành một khối đặc: kim tự tháp Giza và ziggurat Ur không có mái, nên
  // chúng KHÔNG được tính vào phép đếm này. Trước đây gác `ct.length >= 5` đỏ với thông báo *"kỷ 2:
  // chỉ 4 công trình có mái — quần thể sai hình dạng"*, mà quần thể hoàn toàn lành.
  // Cách xử lý ĐÚNG không phải hạ 5 xuống 4 (nới cho cả 15 kỷ, tức bỏ răng), mà là ĐẾM NGOẠI LỆ RA
  // TƯỜNG MINH: kỷ thứ ba mọc thêm một công trình không mái thì đỏ, mà kỷ 2 hay 3 được trả về
  // nhà-có-mái cũng đỏ. Đúng khuôn `assert.deepEqual(TRUOT, [4])` của `TECH_DEBT #44`.
  const kyCoKhoiDac = [];
  for (const era of ERAS) {
    const ct = []; const nd = [];
    let khongMai = 0;
    for (const item of collectCitySpecs({ layout: thanhPho(era) })) {
      const mai = item.spec.parts.filter((p) => p.rooftop);
      if (!mai.length) { if (item.kind === 'building') khongMai += 1; continue; }
      if (item.kind === 'building') ct.push(chuKy(mai));
      if (item.kind === 'dwelling') nd.push(chuKy(mai));
    }
    if (khongMai > 0) kyCoKhoiDac.push(era);
    assert.equal(ct.length + khongMai, 5,
      `kỷ ${era}: ${ct.length} công trình có mái + ${khongMai} không mái ≠ 5 — quần thể sai hình dạng`);
    assert.ok(khongMai <= 1, `kỷ ${era}: ${khongMai} công trình không mái — chỉ kỳ quan khối đặc mới được vậy`);
    assert.ok(nd.length >= 6, `kỷ ${era}: chỉ ${nd.length} nhà dân có mái — quần thể sai hình dạng`);
    assert.equal(new Set(ct).size, ct.length,
      `kỷ ${era}: ${ct.length - new Set(ct).size} công trình đội mái y hệt nhau`);
    assert.equal(new Set(nd).size, nd.length,
      `kỷ ${era}: ${nd.length - new Set(nd).size} nhà dân đội mái y hệt nhau`);
    daKiem += 1;
  }
  assert.equal(daKiem, 15, 'không duyệt đủ 15 kỷ');
  assert.deepEqual(kyCoKhoiDac, [2, 3],
    'danh sách kỷ có kỳ quan KHÔNG mái (nguyên mẫu `monolith`) đã đổi — thêm hay bớt đều phải xem lại');
});

test('ĐỐI CHỨNG: phép đếm chữ ký PHẢI sập xuống 1 khi thật sự có nhân bản', () => {
  // ⚠️ Không có bài này thì bài trên có thể xanh vì `chuKy` đang đếm một thứ không bao giờ trùng
  // (ví dụ nếu nó lỡ nuốt cả toạ độ ô lưới vào chữ ký). Nhốt sẵn ca hỏng: cùng neo, cùng hạt giống
  // ⇒ đúng một chữ ký. Cùng neo, KHÁC hạt ⇒ với kiểu có đọc hạt thì phải khác.
  const rs = dongThu({ stack: 'chimney', stackCount: 2 });
  const nhanBan = new Set(Array.from({ length: 12 },
    () => chuKy(dung(rs, { bpId: 'giong-het-nhau' }))));
  assert.equal(nhanBan.size, 1, 'cùng neo cùng hạt mà ra nhiều chữ ký — `chuKy` đang đếm cả thứ không thuộc hình học');

  const theoHat = new Set(Array.from({ length: 12 }, (_, i) => chuKy(dung(rs, { bpId: `bp${i}` }))));
  assert.equal(theoHat.size, 12, 'đổi hạt giống mà ống khói không đổi gì — biến thể theo hạt đã chết');

  const theoCo = new Set([0.5, 0.7, 0.9, 1.3].map((rw) => chuKy(dung(rs, { bpId: 'x' }, neo(rw)))));
  assert.equal(theoCo.size, 4, 'đổi cỡ mái mà mái trên đó không đổi gì');
});

test('TẤT ĐỊNH: cùng một đầu vào phải cho ra đúng cùng một cái mái, mãi mãi (ADR-007)', () => {
  // "Bảo tàng bất động": một công trình đã xây không được đổi hình sau này. Hạt giống phải là hàm
  // thuần của `bpId` + vị trí, không được dính `Math.random` hay đồng hồ.
  let daKiem = 0;
  for (const [truc, ds] of [['crown', CROWNS], ['stack', STACKS]]) {
    for (const kind of ds) {
      const rs = chiCo(truc, kind);
      assert.equal(chuKy(dung(rs, { bpId: 'ổn-định', index: 2 })),
        chuKy(dung(rs, { bpId: 'ổn-định', index: 2 })),
        `"${kind}" dựng hai lần ra hai kết quả khác nhau`);
      daKiem += 1;
    }
  }
  assert.equal(daKiem, CROWNS.length + STACKS.length, 'không duyệt đủ mọi kiểu');
});

test('KỲ QUAN CÂN TUYỆT ĐỐI VỚI MỌI TỔ HỢP — kể cả tổ hợp bảng hôm nay chưa dùng', () => {
  // ⚠️ VÌ SAO KHÔNG DỰA VÀO BÀI ĐỐI XỨNG SẴN CÓ Ở `buildingSpec.test.js`: bài ấy đo trên kỳ quan
  // THẬT của 15 kỷ, nên nó chỉ chạm tới những kiểu mà bảng ĐANG khai — 8/11 kiểu nhô lên. Ba kiểu
  // (`roofHatch`, `dryingRack`, `chimney`) chưa từng được kiểm ở chế độ đối xứng. Ngày nào có ai
  // gán `chimney` cho kỳ quan một kỷ thì lời hứa ADR-007 vỡ, và bài kia sẽ đỏ MUỘN — sau khi bảng
  // đã đổi. Bài này hỏi trước, trên cả 6 × 11 tổ hợp.
  const modPi = (a) => {
    const t = Math.PI;
    return ((((a ?? 0) % t) + t) % t);
  };
  let daKiem = 0;
  for (const crown of CROWN_KINDS) {
    for (const stack of STACK_KINDS) {
      const rs = dongThu({ crown, stack, crownWeight: crown === 'none' ? 0 : 1.0, stackCount: 2 });
      const parts = dung(rs, { bpId: 'ky-quan', index: 1, symmetric: true });
      daKiem += 1;
      if (!parts.length) continue;
      const sumX = parts.reduce((s, p) => s + p.x, 0);
      assert.ok(Math.abs(sumX) < 1e-9,
        `"${crown}"+"${stack}": tổng x = ${sumX} ≠ 0 — kỳ quan lệch sang một bên`);
      for (const p of parts) {
        const soiGuong = parts.some((q) => Math.abs(q.x + p.x) < 1e-9
          && Math.abs(q.z - p.z) < 1e-9 && Math.abs(q.y - p.y) < 1e-9
          && Math.abs(q.w - p.w) < 1e-9 && Math.abs(q.d - p.d) < 1e-9 && Math.abs(q.h - p.h) < 1e-9
          && Math.abs(modPi(q.ry) - modPi(-p.ry)) < 1e-9);
        assert.ok(soiGuong,
          `"${crown}"+"${stack}": khối tại x=${p.x} (${p.role}) không có khối soi gương`);
      }
    }
  }
  assert.equal(daKiem, CROWN_KINDS.length * STACK_KINDS.length,
    'không duyệt đủ mọi tổ hợp — một `continue` đặt nhầm chỗ');
});

test('ĐỐI CHỨNG: phép kiểm đối xứng phải BẮT ĐƯỢC một cái mái lệch', () => {
  // Cùng dòng bảng, cùng neo, nhưng KHÔNG bật `symmetric` ⇒ hạt giống được phép đẩy đồ lệch sang
  // một bên. Nếu phép kiểm trên còn răng thì ít nhất một kiểu ở chế độ này phải lệch tâm.
  const lech = [];
  for (const kind of STACKS) {
    const parts = dung(chiCo('stack', kind), { bpId: 'nha-thuong', index: 1, symmetric: false });
    if (parts.length && Math.abs(parts.reduce((s, p) => s + p.x, 0)) > 1e-9) lech.push(kind);
  }
  assert.ok(lech.length >= 3,
    `chỉ ${lech.length} kiểu lệch tâm khi TẮT đối xứng — hoặc mọi thứ vốn đã cân sẵn (thì cờ `
    + '`symmetric` là mã chết), hoặc phép kiểm đối xứng ở bài trên không thể đỏ');
});

test('`rooftop.js` KHÔNG ĐƯỢC KÉO VÀO MỘT VAI MÀU MỚI — luật lệnh vẽ nằm ở `drawCallBudget.test.js`', () => {
  // ⚠️ Đây KHÔNG phải bản chép của luật lệnh vẽ (xem khối chú thích đầu file). Luật kia hỏi trên
  // quần thể thật: *"kỷ này có tốn hơn mốc của chính nó không"*. Bài này hỏi hẹp hơn và sớm hơn:
  // *"file này có phát ra một VAI nào ngoài danh sách đã đo không"*. Một vai mới không nhất thiết
  // thành một họ mới (ánh xạ vai→họ phụ thuộc kỷ), nên hai bài bắt hai tai nạn khác nhau — nhưng
  // bài này chỉ đỏ đúng một dòng và nói thẳng tên vai, tức nó chẩn đoán nhanh hơn nhiều.
  const vai = new Set();
  for (const [truc, ds] of [['crown', CROWNS], ['stack', STACKS]]) {
    for (const kind of ds) {
      for (const plain of [false, true]) {
        for (const p of dung(chiCo(truc, kind, { plain }), { plain })) vai.add(p.role);
      }
    }
  }
  assert.deepEqual([...vai].sort(), ['dark', 'glass', 'leaf', 'roof', 'stone', 'trim', 'wood'],
    `danh sách vai màu của phần mái đã đổi (nay: ${[...vai].sort().join(', ')}) — kiểm lại `
    + '`drawCallBudget.test.js` xem có kỷ nào vừa bị kéo thêm một họ vật liệu không');

  // ⚠️ `glass` là vai HIẾM nhất ở đây (chỉ ô kính cửa sổ mái) và nó KHÔNG có ở kỷ 1–2. Hôm nay điều
  // đó an toàn nhờ `EARLIEST_ERA.dormer = 5`, tức nhờ một luật LỊCH SỬ ở file khác — đúng hình dạng
  // "đúng nhờ một thứ chẳng liên quan" (Phase 7D). Khoá thẳng: kỷ nào có cửa sổ mái thì kỷ ấy phải
  // đã dùng kính từ trước.
  for (const era of ERAS) {
    const rs = ROOF_STYLES[era];
    if (rs.stack !== 'dormer' && rs.vernacularStack !== 'dormer') continue;
    const coKinh = collectCitySpecs({ layout: thanhPho(era) })
      .some((it) => it.spec.parts.some((p) => p.role === 'glass' && !p.rooftop));
    assert.ok(coKinh,
      `kỷ ${era} có cửa sổ mái nhưng phần thân nhà chưa hề dùng kính — cửa sổ mái đang MỘT MÌNH kéo `
      + 'cả một họ vật liệu vào kỷ này, tức thêm một lệnh vẽ');
  }
});
