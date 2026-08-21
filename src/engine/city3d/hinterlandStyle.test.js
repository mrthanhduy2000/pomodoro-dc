/**
 * hinterlandStyle.test.js — CANH BẢNG 15 KỶ CỦA VÙNG PHỤ CẬN.
 *
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI. Bảng phụ cận có một cách hỏng RẺ và RẤT HẤP DẪN: muốn (G1)/(G2) lên
 * điểm thì chỉ cần rắc ruộng, đường sắt và ống khói lên cả 15 kỷ. Số đo sẽ đẹp lên thật — và cái
 * giá là nói dối lịch sử, thứ không có phép đo hình ảnh nào bắt được. Nên phần lớn các bài dưới
 * đây KHÔNG canh mã, chúng canh **kỷ luật của người điền bảng**.
 *
 * Bốn nhóm:
 *   A. Cấu trúc — `isValidHinterland` từ chối đúng thứ nó phải từ chối, và KHÔNG tự chữa.
 *   B. Quan hệ giữa hai bảng — `country` ⇄ `eraStyle.js`, bến cảng ⇄ `settingStyle.js`.
 *   C. Lịch sử HAI CHIỀU — kỷ cổ không được có thứ chưa phát minh, kỷ hiện đại không được thiếu
 *      hạ tầng của mình. Thiếu chiều thứ hai thì cách rẻ nhất để "15 kỷ khác nhau" là bỏ trống.
 *   D. Trục còn sống — mỗi trục phải có ≥ 2 giá trị được dùng thật (bài học lùm cây Phase 8D: cơ
 *      chế chạy đủ, ảnh trông thuyết phục, đo ra là nó chưa bao giờ làm gì).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HINTERLAND_STYLES, HINTERLAND_ERAS, isValidHinterland,
  hinterlandCountryMismatches, summarizeHinterland,
  FIELD_FORMS, WATERWORKS, WALL_KINDS, OUTBOUND_ROADS, DOCK_KINDS, INFRA_KINDS,
  MOC_CONG_NGHIEP, MOC_THE_KY_20, MOC_CONTAINER,
} from './hinterlandStyle.js';
import { getSetting, hasWater } from './settingStyle.js';

/** Một dòng hợp lệ tối thiểu, để các bài cấu trúc bẻ từng trường một. */
function dongMau(sua = {}) {
  return {
    country: 'Nước Nào Đó',
    note: 'Một mô tả đủ dài để nêu đích danh một nơi có thật trên bản đồ.',
    fields: 'strips', fieldDensity: 0.5,
    waterworks: 'ditch', wall: 'earth', gate: true,
    outboundRoad: 'road', hamletCount: 2, hamletSize: 3,
    dock: 'none', infra: ['granary'],
    ...sua,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// A. CẤU TRÚC
// ─────────────────────────────────────────────────────────────────────────────

test('bảng có đủ 15 kỷ và MỌI dòng đều hợp lệ', () => {
  // THỬ-CHO-ĐỎ: đổi `fieldDensity` của kỷ 6 thành 1.4 → đỏ ở đây, nêu đích danh kỷ 6.
  assert.equal(HINTERLAND_ERAS.length, 15, 'phải đủ 15 kỷ, không kỷ nào rơi về mặc định');
  assert.deepEqual(HINTERLAND_ERAS, Array.from({ length: 15 }, (_, i) => i + 1));
  const hong = HINTERLAND_ERAS.filter((e) => !isValidHinterland(HINTERLAND_STYLES[e]));
  assert.deepEqual(hong, [], `dòng KHÔNG hợp lệ: ${hong.join(', ')}`);
});

test('validator TỪ CHỐI từng loại dòng hỏng — và từ chối bằng cách trả false, không tự chữa', () => {
  // Không có bài này thì `isValidHinterland` có thể `return true` vô điều kiện mà bài trên vẫn xanh.
  const ca = [
    ['không phải đối tượng',        null],
    ['thiếu hẳn trường',            { fields: 'strips' }],
    ['fields lạ',                   dongMau({ fields: 'ruộng bậc thang' })],
    ['waterworks lạ',               dongMau({ waterworks: 'giếng' })],
    ['wall lạ',                     dongMau({ wall: 'thép' })],
    ['outboundRoad lạ',             dongMau({ outboundRoad: 'none' })],
    ['dock lạ',                     dongMau({ dock: 'bến du thuyền' })],
    ['mật độ âm',                   dongMau({ fieldDensity: -0.1 })],
    ['mật độ > 1',                  dongMau({ fieldDensity: 1.2 })],
    ['có hình thái mà mật độ 0',    dongMau({ fields: 'strips', fieldDensity: 0 })],
    ['không hình thái mà mật độ>0', dongMau({ fields: 'none', fieldDensity: 0.3 })],
    ['cổng mà không có tường',      dongMau({ wall: 'none', gate: true })],
    ['gate không phải boolean',     dongMau({ gate: 1 })],
    ['hamletCount không nguyên',    dongMau({ hamletCount: 2.5 })],
    ['hamletSize = 0',              dongMau({ hamletSize: 0 })],
    ['infra quá 3',                 dongMau({ infra: ['granary', 'kiln', 'quarry', 'bridge'] })],
    ['infra trùng nhau',            dongMau({ infra: ['granary', 'granary'] })],
    ['infra có giá trị lạ',         dongMau({ infra: ['sân bay'] })],
    ['note quá ngắn',               dongMau({ note: 'ở đâu đó' })],
    ['thiếu country',               dongMau({ country: '' })],
  ];
  for (const [ten, dong] of ca) {
    assert.equal(isValidHinterland(dong), false, `phải TỪ CHỐI: ${ten}`);
  }
  // Vế đối chứng: dòng mẫu KHÔNG bị bẻ thì phải được nhận — nếu không, mọi ca trên đỏ vì lý do
  // chẳng liên quan và bài test này không còn nói được gì.
  assert.equal(isValidHinterland(dongMau()), true, 'dòng mẫu lành phải được NHẬN');
});

// ─────────────────────────────────────────────────────────────────────────────
// B. QUAN HỆ GIỮA HAI BẢNG
// ─────────────────────────────────────────────────────────────────────────────

test('country của bảng phụ cận KHỚP eraStyle.js ở cả 15 kỷ', () => {
  // THỬ-CHO-ĐỎ: đổi `country` kỷ 7 thành 'Hy Lạp' → đỏ, in ra cả hai vế.
  const lech = hinterlandCountryMismatches();
  assert.deepEqual(lech, [],
    `lệch nước: ${lech.map((l) => `kỷ ${l.era}: "${l.cua_bang}" ≠ "${l.cua_eraStyle}"`).join(' · ')}`);
});

test('BẾN CẢNG chỉ có ở kỷ mà settingStyle.js khai CÓ NƯỚC — khoá hai chiều', () => {
  // Chiều 1: khô mà có bến = một cái bến giữa sa mạc.
  // Chiều 2: có BIỂN mà không có bến gì = bỏ mất tín hiệu quy mô mạnh nhất của kỷ ven biển.
  // THỬ-CHO-ĐỎ: đổi `dock` kỷ 1 (settingStyle khai water:'none') thành 'wharf' → đỏ ở chiều 1.
  const khoMaCoBen = [];
  const bienMaKhongBen = [];
  for (const era of HINTERLAND_ERAS) {
    const st = HINTERLAND_STYLES[era];
    const co_nuoc = hasWater(era);
    if (!co_nuoc && st.dock !== 'none') khoMaCoBen.push(era);
    if (getSetting(era).water === 'sea' && st.dock === 'none') bienMaKhongBen.push(era);
  }
  assert.deepEqual(khoMaCoBen, [], `kỷ KHÔNG có nước mà khai bến: ${khoMaCoBen.join(', ')}`);
  assert.deepEqual(bienMaKhongBen, [], `kỷ giáp BIỂN mà không có bến: ${bienMaKhongBen.join(', ')}`);
});

test('CÔNG TRÌNH NƯỚC chỉ có ở kỷ có nước', () => {
  // Kênh, đê, cống dẫn đều là công trình DẪN nước — không có nước thì không có gì để dẫn.
  const lech = HINTERLAND_ERAS.filter((e) => !hasWater(e) && HINTERLAND_STYLES[e].waterworks !== 'none');
  assert.deepEqual(lech, [], `kỷ khô mà có công trình nước: ${lech.join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// C. LỊCH SỬ — HAI CHIỀU
// ─────────────────────────────────────────────────────────────────────────────

/** Thứ gì ra đời từ mốc nào. Mốc CÔNG NGHỆ, không phải mốc thẩm mỹ, nên kiểm được. */
const MOC_CUA = {
  railway:         MOC_CONG_NGHIEP,   // đường sắt hơi nước — thế kỷ 19
  chimney:         MOC_CONG_NGHIEP,   // ống khói nhà máy
  factory:         MOC_CONG_NGHIEP,
  terracedHousing: MOC_CONG_NGHIEP,   // dãy nhà thợ
  crane:           MOC_CONTAINER,     // cần cẩu giàn container — McLean 1956
  elevatedRoad:    MOC_THE_KY_20,
};
const MOC_RUONG = { hedgedGrid: MOC_CONG_NGHIEP, collective: 12 };
const MOC_DUONG = { highway: MOC_THE_KY_20 };
const MOC_BEN   = { container: MOC_CONTAINER };

test('CHIỀU CẤM — kỷ cổ không được mang thứ chưa phát minh', () => {
  // THỬ-CHO-ĐỎ: thêm 'railway' vào `infra` kỷ 3 → đỏ, nêu đích danh kỷ 3 và mốc 10.
  const pham = [];
  for (const era of HINTERLAND_ERAS) {
    const st = HINTERLAND_STYLES[era];
    for (const k of st.infra) {
      if (MOC_CUA[k] && era < MOC_CUA[k]) pham.push(`kỷ ${era} có "${k}" (mốc ${MOC_CUA[k]})`);
    }
    if (MOC_RUONG[st.fields] && era < MOC_RUONG[st.fields]) {
      pham.push(`kỷ ${era} có ruộng "${st.fields}" (mốc ${MOC_RUONG[st.fields]})`);
    }
    if (MOC_DUONG[st.outboundRoad] && era < MOC_DUONG[st.outboundRoad]) {
      pham.push(`kỷ ${era} có đường "${st.outboundRoad}" (mốc ${MOC_DUONG[st.outboundRoad]})`);
    }
    if (MOC_BEN[st.dock] && era < MOC_BEN[st.dock]) {
      pham.push(`kỷ ${era} có bến "${st.dock}" (mốc ${MOC_BEN[st.dock]})`);
    }
  }
  assert.deepEqual(pham, [], `lỗi thời đại: ${pham.join(' · ')}`);
});

test('CHIỀU BẮT BUỘC — kỷ công nghiệp trở đi phải MANG hạ tầng của mình', () => {
  // Không có chiều này thì cách rẻ nhất để qua chiều cấm là bỏ trống nửa bảng, và vùng phụ cận của
  // sáu kỷ hiện đại sẽ trông y hệt vùng phụ cận thời đồ đá.
  // THỬ-CHO-ĐỎ: xoá 'railway' và 'chimney' khỏi `infra` kỷ 10 → đỏ đúng ở kỷ 10.
  const HIEN_DAI = new Set(['railway', 'chimney', 'factory', 'terracedHousing', 'crane', 'elevatedRoad']);
  const thieu = HINTERLAND_ERAS
    .filter((e) => e >= MOC_CONG_NGHIEP)
    .filter((e) => !HINTERLAND_STYLES[e].infra.some((k) => HIEN_DAI.has(k)));
  assert.deepEqual(thieu, [], `kỷ ≥ ${MOC_CONG_NGHIEP} mà không có hạ tầng hiện đại nào: ${thieu.join(', ')}`);

  // Và kỷ container phải dùng ĐÚNG bến container — cảng Keihin/Marina Bay/Jebel Ali đều là cảng
  // container, dựng chúng thành bến gỗ là nói dối theo chiều ngược lại.
  const sai_ben = HINTERLAND_ERAS
    .filter((e) => e >= MOC_CONTAINER && hasWater(e))
    .filter((e) => HINTERLAND_STYLES[e].dock !== 'container');
  assert.deepEqual(sai_ben, [], `kỷ ≥ ${MOC_CONTAINER} có nước mà không phải cảng container: ${sai_ben.join(', ')}`);
});

test('ĐỐI CHỨNG — hai chiều lịch sử phải BẮT được một bảng cố tình phạm', () => {
  // Bài học Phase 10: một đối chứng hỏi TỔNG thì một kỷ dư bù cho một kỷ vượt. Hỏi từng chiều một.
  const bomCo = { 3: { ...HINTERLAND_STYLES[3], infra: ['railway'] } };
  const pham_cam = Object.entries(bomCo).filter(([e, st]) =>
    st.infra.some((k) => MOC_CUA[k] && Number(e) < MOC_CUA[k]));
  assert.equal(pham_cam.length, 1, 'chiều CẤM phải bắt được kỷ 3 mang đường sắt');

  const bomTrong = { 14: { ...HINTERLAND_STYLES[14], infra: ['granary'] } };
  const HIEN_DAI = new Set(['railway', 'chimney', 'factory', 'terracedHousing', 'crane', 'elevatedRoad']);
  const pham_thieu = Object.entries(bomTrong).filter(([e, st]) =>
    Number(e) >= MOC_CONG_NGHIEP && !st.infra.some((k) => HIEN_DAI.has(k)));
  assert.equal(pham_thieu.length, 1, 'chiều BẮT BUỘC phải bắt được kỷ 14 trống trơn');
});

test('KỶ 1 VÀ KỶ 15 — hai ca nghiệm thu, phải KHÁC hẳn mười ba kỷ kia', () => {
  // Đàm chốt: nếu bảng làm hai kỷ này trông giống phần còn lại thì BẢNG SAI, không phải cổng sai.
  // Cả hai đều thật sự ÍT nông nghiệp, nên tín hiệu quy mô của chúng phải đến từ chỗ khác.
  for (const era of [1, 15]) {
    const st = HINTERLAND_STYLES[era];
    assert.equal(st.fields, 'none', `kỷ ${era} không được có ruộng (Göbekli Tepe / sa mạc Dubai)`);
    assert.equal(st.fieldDensity, 0);
    assert.ok(st.infra.length >= 3, `kỷ ${era} phải bù tín hiệu quy mô bằng ≥ 3 hạ tầng, đang có ${st.infra.length}`);
    assert.ok(st.hamletCount >= 3, `kỷ ${era} phải có ≥ 3 cụm dân cư ngoài lưới`);
  }
  // Và hai kỷ ấy KHÔNG được giống nhau: một bên là đá dựng + lối mòn, một bên là cảng + đường thẳng.
  assert.notEqual(HINTERLAND_STYLES[1].outboundRoad, HINTERLAND_STYLES[15].outboundRoad);
  assert.notEqual(HINTERLAND_STYLES[1].dock, HINTERLAND_STYLES[15].dock);
  const chung = HINTERLAND_STYLES[1].infra.filter((k) => HINTERLAND_STYLES[15].infra.includes(k));
  assert.deepEqual(chung, [], `kỷ 1 và kỷ 15 dùng chung hạ tầng: ${chung.join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// D. TRỤC CÒN SỐNG
// ─────────────────────────────────────────────────────────────────────────────

test('MỌI TRỤC còn sống — không trục nào cả 15 kỷ khai giống hệt nhau', () => {
  // THỬ-CHO-ĐỎ: đặt `wall: 'none'` cho cả 15 kỷ → đỏ đúng ở trục `wall`.
  const dem = summarizeHinterland();
  const chet = Object.entries(dem).filter(([, d]) => Object.keys(d).length < 2).map(([t]) => t);
  assert.deepEqual(chet, [], `trục CHẾT (chỉ một giá trị được dùng): ${chet.join(', ')}`);
});

test('MỌI GIÁ TRỊ TỪ VỰNG đều có ít nhất một kỷ dùng tới', () => {
  // Từ vựng thừa là nợ im lặng: nó nằm trong bảng, đọc lên nghe như một lựa chọn có thật, mà không
  // dòng nào dùng và không hình nào dựng. Bốn giá trị đã bị GỠ ở vòng phản biện đúng vì lý do này.
  const dem = summarizeHinterland();
  const thua = [];
  const soi = [
    ['fields', FIELD_FORMS, dem.fields], ['waterworks', WATERWORKS, dem.waterworks],
    ['wall', WALL_KINDS, dem.wall], ['outboundRoad', OUTBOUND_ROADS, dem.outboundRoad],
    ['dock', DOCK_KINDS, dem.dock], ['infra', INFRA_KINDS, dem.infra],
  ];
  for (const [ten, tuvung, d] of soi) {
    for (const v of tuvung) if (!d[v]) thua.push(`${ten}.${v}`);
  }
  assert.deepEqual(thua, [], `giá trị từ vựng KHÔNG kỷ nào dùng: ${thua.join(' · ')}`);
});

test('ĐỐI CHỨNG — phép đếm trục phải BẮT được một bảng dẹt', () => {
  // Không có bài này thì `summarizeHinterland` có thể đếm sai và bài trên vẫn xanh.
  const det = {};
  for (const e of HINTERLAND_ERAS) det[e] = { ...HINTERLAND_STYLES[1] };
  const dem = summarizeHinterland(det);
  const chet = Object.entries(dem).filter(([, d]) => Object.keys(d).length < 2).map(([t]) => t);
  assert.ok(chet.length >= 5, `bảng dẹt phải làm ÍT NHẤT 5 trục chết, đo được ${chet.length}`);
});

test('KHÔNG hai kỷ nào có vùng phụ cận GIỐNG HỆT nhau', () => {
  // Duyệt đủ 105 cặp, không duyệt danh sách theo thứ tự (bài học `daylight.test.js`: dawn ở đầu và
  // dusk ở cuối không bao giờ được đem so với nhau, và một lỗi thật sống sót qua mọi lần chạy).
  const van = (e) => {
    const s = HINTERLAND_STYLES[e];
    return [s.fields, s.waterworks, s.wall, s.gate, s.outboundRoad, s.hamletCount,
      s.hamletSize, s.dock, [...s.infra].sort().join('+')].join('|');
  };
  const trung = [];
  for (let i = 0; i < HINTERLAND_ERAS.length; i++) {
    for (let j = i + 1; j < HINTERLAND_ERAS.length; j++) {
      const a = HINTERLAND_ERAS[i]; const b = HINTERLAND_ERAS[j];
      if (van(a) === van(b)) trung.push(`${a}↔${b}`);
    }
  }
  assert.deepEqual(trung, [], `cặp kỷ trùng khít: ${trung.join(', ')}`);
});
