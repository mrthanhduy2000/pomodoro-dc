/**
 * roofStyle.test.js — BẢNG MÁI 15 KỶ.
 *
 * Chia việc với `rooftop.test.js` đúng theo khuôn `streetStyle` / `groundFloorStyle`: file này soi
 * **BẢNG** (đủ 15 dòng · buộc vào `country` · mốc lịch sử · mái đỡ được thứ đặt lên nó · 15 kỷ ra
 * 15 mái), file kia soi **HÌNH** (khối dựng ra thật · tỉ lệ có trần · ngân sách LOD cắn · không
 * thêm lệnh vẽ).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ROOF_STYLES, getRoofStyle, isValidRoofStyle,
  CROWN_KINDS, STACK_KINDS, CROWN_NEEDS_ROOF, STACK_NEEDS_ROOF,
  EARLIEST_ERA, MODERN_STACK_FROM_ERA,
  CROWN_WEIGHT_MIN, CROWN_WEIGHT_MAX, STACK_COUNT_MAX,
} from './roofStyle.js';
import { ERA_STYLES, getEraStyle } from './eraStyle.js';
import { getGroundFloor } from './groundFloorStyle.js';
import { emitRooftop } from './rooftop.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);

test('BẢNG: cả 15 kỷ đều khai `roofStyle`, và không dòng nào sai định dạng', () => {
  for (const era of ERAS) {
    const rs = getRoofStyle(era);
    assert.ok(rs, `kỷ ${era} chưa có dòng mái`);
    assert.ok(isValidRoofStyle(rs), `kỷ ${era}: dòng mái sai định dạng — ${JSON.stringify(rs)}`);
  }
});

test('HAI BẢNG KHÔNG ĐƯỢC TRÔI KHỎI NHAU: khoá của bảng mái phải khớp KHOÁ CỦA `ERA_STYLES`', () => {
  // Cùng một sợi dây đã buộc `groundFloorStyle` vào `eraStyle`. Thiếu nó thì thêm một kỷ thứ 16 sẽ
  // lặng lẽ nhận về `undefined` ở một bảng và không có gì đỏ lên.
  assert.deepEqual(
    Object.keys(ROOF_STYLES).sort(),
    Object.keys(ERA_STYLES).sort(),
    'bảng mái và bảng kỷ không còn cùng một bộ khoá',
  );
  assert.equal(ERAS.length, 15, 'dự án có đúng 15 kỷ — đổi con số này là đổi cả game');
});

test('KỶ LẠ PHẢI RƠI VỀ CÙNG MỘT KỶ Ở CẢ BA BẢNG — một luật, một công thức', () => {
  // ⚠️ Bài này ra đời vì một phép thử ngược ở Việc 2 **KHÔNG NỔ**: thay `normalizeEraKey` bằng
  // `Math.round` trong `getGroundFloor` mà không có gì đỏ lên, tức lời hứa "ba bảng cùng một phép
  // chuẩn hoá" khi ấy chỉ được giữ bởi một dòng chú thích. Nay bảng thứ ba (mái) ra đời thì lời
  // hứa ấy có thêm một chỗ để gãy, nên phải hỏi cả ba cùng lúc.
  const LA = [undefined, null, NaN, 0, -3, 2.4, 99, 16, '7', Infinity];
  const khoaCua = (style) => Object.keys(ERA_STYLES).find((k) => ERA_STYLES[k] === style);
  for (const dauVao of LA) {
    const ky = khoaCua(getEraStyle(dauVao));
    assert.ok(ky, `đầu vào ${String(dauVao)}: `
      + '`getEraStyle` không trả về một dòng nào của bảng kỷ');
    assert.equal(getRoofStyle(dauVao), ROOF_STYLES[ky],
      `đầu vào ${String(dauVao)}: bảng mái rơi về một kỷ KHÁC bảng kỷ`);
    assert.equal(getGroundFloor(dauVao), getGroundFloor(Number(ky)),
      `đầu vào ${String(dauVao)}: bảng tầng trệt rơi về một kỷ KHÁC bảng kỷ`);
  }
});

test('KHOÁ VÀO `country`: mỗi dòng mái phải nói về ĐÚNG nước của kỷ đó, không dính chữ nước khác', () => {
  // ⚠️ Sợi dây buộc bảng mái vào `country`, cùng vai trò với vế tương ứng ở `groundFloor.test.js` ·
  // `streetStyle.test.js` · `floraStyle.test.js`. Vế thứ hai ("không dính chữ nước khác") mới là vế
  // bắt được lỗi thật: cách hỏng dễ xảy ra nhất là chép dòng của kỷ này sang kỷ kia rồi sửa nửa
  // chừng.
  //
  // ⚠️ CHỌN TỪ KHOÁ — ba luật, cả ba đều đã trả giá ngay khi viết bài này:
  //   (a) **Không dùng thuật ngữ mà hai nền cùng có.** "ngói ống" xuất hiện ở CẢ kỷ 4 (筒瓦 Trung
  //       Hoa) lẫn kỷ 8 (telha canudo Bồ) — vì cả hai nền đều lợp ngói ống thật. Đưa nó vào danh
  //       sách là tự tạo một báo động giả vĩnh viễn.
  //   (b) **Không dùng chuỗi quá ngắn.** 'ur' (thành Ur) là chuỗi con của "Burg Eltz" — nó sẽ tố
  //       cáo kỷ 5 là đang nói về Iraq. Dùng 'ziggurat'.
  //   (c) **Ghi chú KHÔNG được nhắc tên nước của kỷ khác.** Bản đầu của dòng kỷ 6 viết "đầu đao
  //       đình Bắc Bộ vút cao hơn mái Trung Hoa" — một so sánh đúng và đáng giữ, nhưng nó nhắc
  //       đúng ô `country` của kỷ 4. So sánh ấy nay nằm trong CHÚ THÍCH ngay trên dòng, chỗ nó
  //       không thể bị đọc nhầm thành "dòng này chép từ kỷ 4".
  // THỬ-CHO-ĐỎ: đổi `note` kỷ 11 thành "…bồn nước gỗ kiểu Haussmann" → đỏ ở vế thứ hai.
  const TU_KHOA = {
    'Thổ Nhĩ Kỳ': ['anatolia'],
    'Ai Cập': ['sông nin'],
    Iraq: ['ziggurat'],
    'Trung Quốc': ['trung hoa', 'tứ hợp viện'],
    'Đức': ['burg eltz', 'fachwerk'],
    'Việt Nam': ['bắc bộ', 'ba gian', 'mũi hài'],
    'Ý': ['phục hưng', 'toscana', 'coppi'],
    'Bồ Đào Nha': ['telha canudo', 'pombaline', 'lisboa', 'trapeira'],
    'Pháp': ['panthéon', 'haussmann', 'lucarne'],
    Anh: ['manchester'],
    'Mỹ': ['new york', 'beaux-arts'],
    Nga: ['stalingrad', 'xô viết'],
    'Nhật Bản': ['nakagin', 'nhật'],
    Singapore: ['marina bay'],
    UAE: ['dubai'],
  };
  assert.equal(Object.keys(TU_KHOA).length, ERAS.length,
    'mỗi kỷ một nước — thiếu/thừa ở đây nghĩa là bảng `country` đã đổi mà bài test chưa theo');
  for (const era of ERAS) {
    const style = getEraStyle(era);
    const note = getRoofStyle(era).note.toLowerCase();
    const cuaMinh = TU_KHOA[style.country];
    assert.ok(cuaMinh, `kỷ ${era}: nước "${style.country}" chưa có từ khoá trong bài test này`);
    assert.ok(cuaMinh.some((k) => note.includes(k)),
      `kỷ ${era} (${style.country}): dòng mái không nhắc tới thứ gì của nước ấy — "${note}"`);
    for (const [nuoc, tu] of Object.entries(TU_KHOA)) {
      if (nuoc === style.country) continue;
      const lan = tu.filter((k) => note.includes(k));
      assert.deepEqual(lan, [],
        `kỷ ${era} (${style.country}) lại nhắc tới ${nuoc}: ${lan.join(', ')} — dấu hiệu chép dòng`);
    }
  }
});

test('MÁI PHẢI ĐỠ ĐƯỢC THỨ ĐẶT LÊN NÓ — và kiểm RIÊNG từng vế, không kiểm gộp', () => {
  // ⚠️ Đây là ràng buộc HÌNH HỌC, không phải trí nhớ lịch sử: không đứng được trên mái dốc 45° để
  // hong lúa, không khoét cửa sổ mái vào một mặt phẳng, không có sống mái trên một cái chóp nón.
  // Nó hỏi thẳng `CROWN_NEEDS_ROOF`/`STACK_NEEDS_ROOF` chứ không hỏi một danh sách kỷ phải nhớ, nên
  // nó không già đi khi có ai đổi hình mái của một kỷ.
  //
  // ⚠️ VÀ PHẢI KIỂM RIÊNG TỪNG VẾ. Kiểm gộp (`crown` với `style.roof` mà quên `vernacularCrown` với
  // `style.vernacularRoof`) bỏ lọt đúng ca hay sai nhất — kỷ 6 khai `upturn` cho đình (mái `tiered`)
  // và `barrel` cho nhà ba gian (mái `gable`), hai vế hai hình mái khác nhau.
  // THỬ-CHO-ĐỎ: đổi `vernacularStack` kỷ 12 thành 'dormer' (mái `flat` không khoét cửa sổ mái được)
  // → đỏ ở đúng kỷ 12, vế nhà dân.
  let daKiem = 0;
  for (const era of ERAS) {
    const style = getEraStyle(era);
    const rs = getRoofStyle(era);
    const VE = [
      { ten: 'công trình chính', mai: style.roof, crown: rs.crown, stack: rs.stack },
      { ten: 'nhà dân', mai: style.vernacularRoof, crown: rs.vernacularCrown, stack: rs.vernacularStack },
    ];
    for (const ve of VE) {
      const c = CROWN_NEEDS_ROOF[ve.crown];
      assert.notEqual(c, undefined,
        `kỷ ${era}: đường nét "${ve.crown}" không có trong \`CROWN_NEEDS_ROOF\``);
      if (c) {
        assert.ok(c.includes(ve.mai),
          `kỷ ${era} (${ve.ten}): mái "${ve.mai}" KHÔNG đỡ được đường nét "${ve.crown}" `
          + `(chỉ hợp với ${c.join('/')})`);
      }
      const s = STACK_NEEDS_ROOF[ve.stack];
      assert.notEqual(s, undefined,
        `kỷ ${era}: thứ nhô lên "${ve.stack}" không có trong \`STACK_NEEDS_ROOF\``);
      if (s) {
        assert.ok(s.includes(ve.mai),
          `kỷ ${era} (${ve.ten}): mái "${ve.mai}" KHÔNG đỡ được "${ve.stack}" `
          + `(chỉ hợp với ${s.join('/')})`);
      }
      daKiem += 1;
    }
  }
  // Gác chạy-rỗng: 15 kỷ × 2 vế. Thiếu là một `continue` đặt nhầm chỗ đã nuốt mất nửa bài.
  assert.equal(daKiem, ERAS.length * 2, 'bài này không duyệt đủ 15 kỷ × 2 vế');
});

test('KHÔNG NHÉT ĐẶC ĐIỂM HIỆN ĐẠI VÀO KỶ CỔ — và kỷ hiện đại không được để mái trống trơn', () => {
  // ⚠️ CẢ HAI CHIỀU, cùng luật `streetStyle.js` đặt cho bó vỉa và vạch kẻ. Chỉ khoá một chiều thì
  // cách rẻ nhất để "cho 15 kỷ khác nhau" vẫn còn nguyên: rắc cục nóng xuống kỷ cổ, tức mua điểm
  // bản sắc bằng cách nói dối lịch sử.
  for (const era of ERAS) {
    const rs = getRoofStyle(era);
    for (const [ten, gt] of [['chính', rs.stack], ['nhà dân', rs.vernacularStack],
      ['chính', rs.crown], ['nhà dân', rs.vernacularCrown]]) {
      const moc = EARLIEST_ERA[gt];
      if (moc === undefined) continue;
      assert.ok(era >= moc,
        `kỷ ${era} (${ten}) dùng "${gt}" — thứ này chỉ có từ kỷ ${moc} trở đi`);
    }
  }
  // Chiều ngược: từ kỷ 12, mái BẰNG là một sàn máy. Bỏ trống nó là nói dối theo hướng còn lại.
  for (const era of ERAS.filter((e) => e >= MODERN_STACK_FROM_ERA)) {
    const rs = getRoofStyle(era);
    assert.notEqual(rs.stack, 'none',
      `kỷ ${era}: công trình chính mái bằng mà trên nóc không có gì — thời này không có mái nào trống`);
    assert.notEqual(rs.vernacularStack, 'none',
      `kỷ ${era}: nhà dân mái bằng mà trên nóc không có gì`);
  }
  // Và mọi mốc phải có ít nhất một kỷ dùng tới — một mốc không ai chạm là một luật chết.
  for (const gt of Object.keys(EARLIEST_ERA)) {
    const dung = ERAS.some((e) => {
      const rs = getRoofStyle(e);
      return [rs.crown, rs.stack, rs.vernacularCrown, rs.vernacularStack].includes(gt);
    });
    assert.ok(dung, `mốc lịch sử của "${gt}" không kỷ nào chạm tới — luật chết`);
  }
});

test('MỖI KỶ CÓ MỘT HOẶC HAI ĐẶC TRƯNG — không kỷ nào trống trơn, không kỷ nào rắc đủ mâm', () => {
  // Luật của Đàm: *"mỗi kỷ đúng một-hai đặc trưng"*. Rắc đều mọi thứ cho mọi kỷ thì 15 kỷ lại về
  // giống nhau, chỉ là giống nhau ở mức rườm rà hơn.
  // ⚠️ Đếm TỪNG VẾ một (công trình chính / nhà dân), không cộng gộp bốn trường — cộng gộp thì một
  // kỷ có thể dồn cả hai đặc trưng vào nhà dân rồi để công trình chính trơ ra mà vẫn "đủ hai".
  for (const era of ERAS) {
    const rs = getRoofStyle(era);
    for (const [ten, c, s] of [
      ['công trình chính', rs.crown, rs.stack],
      ['nhà dân', rs.vernacularCrown, rs.vernacularStack],
    ]) {
      const n = (c === 'none' ? 0 : 1) + (s === 'none' ? 0 : 1);
      assert.ok(n >= 1, `kỷ ${era} (${ten}): mái không có đặc trưng nào`);
      assert.ok(n <= 2, `kỷ ${era} (${ten}): ${n} đặc trưng — quá mâm`);
    }
  }
});

// ─── 15 KỶ RA 15 MÁI ─────────────────────────────────────────────────────────

/**
 * Một chỗ đứng giả để ĐO. Không lấy từ `buildBuildingSpec` vì ở đây ta muốn đổi ĐÚNG MỘT biến
 * (`crownWeight`) và giữ mọi thứ khác cố định — lấy công trình thật thì hình mái, bề ngang và số
 * mảng nhà cùng đổi theo kỷ, và phép đo hết nói được về cái biến mình đang hỏi.
 */
function neoDo(rw = 0.6) {
  return {
    x: 0, z: 0, eaveY: 1, apexY: 1.3, rw, rd: rw, pitch: 0.3,
    deck: { x: 0, z: 0, y: 1.3, w: rw * 0.94, d: rw * 0.94 },
    ridges: [{ x: 0, z: 0, y: 1.3, w: rw, ry: 0 }],
  };
}

function dongThu(patch) {
  return {
    crown: 'none', crownWeight: 0, stack: 'none', stackCount: 1,
    vernacularCrown: 'none', vernacularStack: 'none',
    note: 'dòng thử dùng riêng trong bài test', ...patch,
  };
}

/** Kích thước bao của phần đường nét, tính bằng đơn vị thế giới. */
function tamDuongNet(kind, weight) {
  const out = [];
  emitRooftop(out, dongThu({ crown: kind, vernacularCrown: kind, crownWeight: weight }),
    neoDo(), { bpId: 'do', index: 0 });
  let X = 0; let Y = 0; let Z = 0;
  for (const p of out) {
    X = Math.max(X, Math.abs(p.x) + p.w / 2);
    Y = Math.max(Y, p.y + p.h);
    Z = Math.max(Z, Math.abs(p.z) + p.d / 2);
  }
  return X + Y + Z;
}

/**
 * ⚠️ BƯỚC LƯỢNG HOÁ CỦA `crownWeight` — **ĐO, KHÔNG ĐOÁN**, và đo RIÊNG cho từng kiểu đường nét.
 *
 * `crownWeight` là một số trơn, nên hỏi "hai kỷ có khác nhau ở trục này không" mà không có bước
 * lượng hoá thì mọi cặp đều "khác" — kể cả chênh nhau một hạt bụi. Nhưng bước ấy KHÔNG được chọn
 * tay: dự án đã hai lần trả giá cho một hằng số chọn cho tiện (`MIN_STONE` 9D · ngưỡng sương 9A).
 *
 * Cách suy: dựng CÙNG một mảng nhà hai lần, chỉ đổi `crownWeight`, đo hình bao thật đổi bao nhiêu
 * ⇒ ra "một đơn vị trọng số dịch hình bao nhiêu đơn vị thế giới". Chia ngưỡng mắt vào đó thì ra
 * bước. Ngưỡng mắt lấy từ chính phép đo đã hiệu chuẩn của dự án: **một ô lưới ≈ 64 điểm ảnh** trên
 * bản quét (`streetStyle.test.js`), nên một điểm ảnh = 1/64 đơn vị thế giới.
 *
 * ⚠️ VÀ ĐỘ NHẠY KHÁC NHAU RẤT XA GIỮA CÁC KIỂU: đầu đao 0,175/đơn-vị (bước 0,09) còn ngói bò chỉ
 * 0,011 (bước 1,46). Dùng MỘT bước chung là vừa quá dễ cho kiểu này vừa quá khắt khe với kiểu kia.
 * Đo được (2026-08-18): beamEnds 0,458 · barrel 1,459 · ridge 0,850 · upturn 0,089 · balustrade
 * 0,286.
 */
const BUOC_TRONG_SO = Object.fromEntries(
  CROWN_KINDS.filter((k) => k !== 'none').map((k) => {
    const doNhay = tamDuongNet(k, 1.5) - tamDuongNet(k, 0.5);
    return [k, (1 / 64) / doNhay];
  }),
);

/**
 * SÁU TRỤC mà mắt đọc được trên một cái mái. Trả về danh sách TÊN trục khác nhau, không phải một
 * con số — tên là thứ đọc được trong thông báo lỗi.
 *
 * ⚠️ `crownWeight` chỉ được tính khi HAI KỶ CÙNG MỘT KIỂU đường nét. Khác kiểu thì trục `crown` đã
 * kể chuyện ấy rồi; tính thêm trọng số là đếm một khác biệt hai lần, đúng cái làm điểm số phồng
 * lên mà không thêm thông tin.
 */
function trucKhacNhau(A, B) {
  const t = [];
  if (A.crown !== B.crown) t.push('crown');
  else if (A.crown !== 'none'
    && Math.abs(A.crownWeight - B.crownWeight) >= BUOC_TRONG_SO[A.crown]) t.push('crownWeight');
  if (A.vernacularCrown !== B.vernacularCrown) t.push('vernacularCrown');
  if (A.stack !== B.stack) t.push('stack');
  if (A.vernacularStack !== B.vernacularStack) t.push('vernacularStack');
  // `stackCount` là số ĐẾM: chênh nhau một cái ống khói là một khác biệt nhìn thấy được, không cần
  // lượng hoá thêm. Đây là lý do nó không có bước như `crownWeight`.
  if (Math.abs(A.stackCount - B.stackCount) >= 1) t.push('stackCount');
  return t;
}

/** Cực tiểu + trung vị của 105 cặp — hai con số, vì cực tiểu là một con số GỘP. */
function chamBang(bang) {
  const keys = Object.keys(bang);
  const diem = [];
  let yeuNhat = null;
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      const t = trucKhacNhau(bang[keys[i]], bang[keys[j]]);
      diem.push(t.length);
      if (!yeuNhat || t.length < yeuNhat.n) yeuNhat = { a: keys[i], b: keys[j], n: t.length, t };
    }
  }
  diem.sort((a, b) => a - b);
  return { soCap: diem.length, cucTieu: diem[0], trungVi: diem[Math.floor(diem.length / 2)], yeuNhat };
}

test('15 KỶ RA 15 MÁI: cả 105 cặp đều khác nhau ở ≥2/6 trục, và TRUNG VỊ phải còn cao', () => {
  // ⚠️ HAI CON SỐ, KHÔNG PHẢI MỘT — bài học Bước 2 của Phase 10: cực tiểu là một con số GỘP, nó
  // đứng yên y hệt dù có MỘT cặp yếu hay bốn mươi cặp yếu. Trung vị mới nói được bảng có đang dẹt
  // dần đi không.
  // Đo được 2026-08-18: cực tiểu **2** (8 cặp) · trung vị **4** · phân bố 2:8 · 3:15 · 4:51 · 5:31.
  // Tám cặp chạm sàn đều là những cặp GẦN NHAU THẬT: Ai Cập ↔ Lưỡng Hà (cùng nhà bùn mái bằng),
  // Đức ↔ Anh (cùng mái dốc + ống khói), ba nền ngói Địa Trung Hải/Đông Á, và ba kỷ hiện đại mái
  // bằng. Cả tám cặp ấy vẫn còn một trục thứ bảy mà bài này CỐ Ý không tính: **hình dạng mái**
  // (`style.roof`), vì nó thuộc bảng khác — nên con số ở đây là con số THẬN TRỌNG, không phải con
  // số đẹp nhất kể được.
  const kq = chamBang(ROOF_STYLES);
  assert.equal(kq.soCap, 105, 'phải duyệt đủ 105 cặp — thiếu là vòng lặp đặt sai');
  assert.ok(kq.cucTieu >= 2,
    `cặp yếu nhất là kỷ ${kq.yeuNhat.a}↔${kq.yeuNhat.b} chỉ khác ${kq.cucTieu}/6 trục `
    + `(${kq.yeuNhat.t.join(', ') || 'không trục nào'}) — hai kỷ đọc ra gần như một cái mái`);
  assert.ok(kq.trungVi >= 4,
    `trung vị tụt còn ${kq.trungVi}/6 — bảng đang dẹt dần, dù cặp yếu nhất vẫn qua sàn`);
});

test('MỖI TRỤC PHẢI CÒN SỐNG: không trục nào nằm trong bảng mà chẳng tách được cặp nào', () => {
  // ⚠️ Bài học cơ chế "lùm cây" chết im lặng ở Phase 8D: một cơ chế vẫn chạy, vẫn có mã, vẫn được
  // chú thích tử tế — mà không đổi được gì. Trục nào cả 15 kỷ khai giống nhau thì bảng thật ra hẹp
  // hơn nó trông, và không có gì đỏ lên.
  // Đo được 2026-08-18: crown 87 cặp · vernacularStack 99 · vernacularCrown 77 · stack 77 ·
  // stackCount 74 · crownWeight **6**. Trục cuối mỏng nhất — nếu nó tụt về 0 thì `crownWeight` đã
  // thành một trường trang trí, và phải hoặc bỏ nó đi hoặc trải nó ra cho đáng.
  const dem = {};
  const keys = Object.keys(ROOF_STYLES);
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      for (const truc of trucKhacNhau(ROOF_STYLES[keys[i]], ROOF_STYLES[keys[j]])) {
        dem[truc] = (dem[truc] ?? 0) + 1;
      }
    }
  }
  for (const truc of ['crown', 'crownWeight', 'vernacularCrown', 'stack', 'vernacularStack', 'stackCount']) {
    assert.ok((dem[truc] ?? 0) >= 1,
      `trục "${truc}" không tách được cặp nào — nó đang nằm trong bảng mà không làm gì`);
  }
});

test('ĐỐI CHỨNG: phép đo 6 trục thật sự bắt được bảng DẸT, và từ chối một HẠT BỤI ở TỪNG trục', () => {
  // ⚠️ *"Không có đối chứng thì không biết bài test có còn răng hay không"* — Đàm, 2026-08-18.
  // (a) BẢNG DẸT: 15 dòng giống hệt ⇒ mọi cặp phải ra 0 trục. Nếu ra >0 thì phép đo đang đếm một
  //     thứ không tồn tại.
  const det = {};
  for (const k of Object.keys(ROOF_STYLES)) det[k] = dongThu({ crown: 'ridge', crownWeight: 1, stack: 'chimney' });
  const kqDet = chamBang(det);
  assert.equal(kqDet.cucTieu, 0, 'bảng dẹt mà phép đo vẫn thấy khác biệt — phép đo hỏng');
  assert.equal(kqDet.trungVi, 0, 'bảng dẹt mà trung vị vẫn > 0');

  // (b) HẠT BỤI — và hỏi **TỪNG TRỤC MỘT**, không hỏi tổng.
  // ⚠️ Đây đúng là cái bẫy đã cắn ở Phase 10 Bước 2: đối chứng cũ cộng ba lệch 0,001 vào một dòng
  // rồi hỏi `tổng < 3`; nới riêng MỘT ngưỡng chỉ làm một trục sáng lên, mà 1 < 3 nên đối chứng vẫn
  // XANH — một cái phễu nằm ngay trong thứ sinh ra để chống phễu. Trục trơn duy nhất của bảng này
  // là `crownWeight`, nên phải hỏi đích danh nó.
  //
  // ⚠️ VÀ PHÉP THỬ NÀY PHẢI GHIM NGƯỠNG TỪ **HAI PHÍA**, KHÔNG PHẢI ĐỨNG ĐÚNG TRÊN NÓ. Bản đầu
  // dựng `1.0 + bước` rồi đòi phép đo phải thấy — nghe chặt chẽ, và nó ĐỎ ở "barrel" vì một lý do
  // chẳng liên quan gì tới bảng: số thực dấu phẩy động **không trả lại đúng thứ vừa cộng vào**.
  // Đo ra: `(0,35 + 0,0890…) − 0,35 = 0,08903133903133903`, NHỎ HƠN chính cái bước 0,0890…, nên
  // `>= bước` là sai — ở "upturn" cũng vậy. Đứng đúng trên ngưỡng thì kết quả do sai số cuối cùng
  // của phép cộng quyết định, tức bài test đang hỏi một câu mà câu trả lời là ngẫu nhiên.
  // Ghim hai phía chặt HƠN bản cũ chứ không lỏng hơn: nó nhốt bước vào ±0,1% (bản cũ chỉ chặn được
  // phía "quá thô", bỏ ngỏ phía "quá mịn").
  const KHONG_VUA_DAI = [];
  for (const kind of CROWN_KINDS.filter((k) => k !== 'none')) {
    const buoc = BUOC_TRONG_SO[kind];
    const nen = CROWN_WEIGHT_MIN;
    const A = dongThu({ crown: kind, vernacularCrown: kind, crownWeight: nen });
    const B = dongThu({ crown: kind, vernacularCrown: kind, crownWeight: nen + 0.001 });
    assert.deepEqual(trucKhacNhau(A, B), [],
      `hạt bụi 0,001 ở "${kind}" bị tính thành một trục — bước lượng hoá đã bị nới`);

    // ⚠️ Bước của "barrel" (1,459) RỘNG HƠN CẢ DẢI HỢP LỆ (1,6 − 0,35 = 1,25) ⇒ hai kỷ cùng lợp
    // ngói bò thì `crownWeight` **không bao giờ** tách được chúng, dù khai số nào. Đó là một sự
    // thật của bảng, không phải một ca cần né: mọi giá trị thử ở đây đều phải nằm trong dải mà
    // bảng thật sự chứa được (bài học Phase 8B: khối rút gọn cho tiện chính là khối lọt lưới).
    // Nên ca ấy được ĐẾM ra ngoài rồi khoá lại bên dưới, chứ không `continue` trong im lặng.
    if (nen + buoc > CROWN_WEIGHT_MAX) { KHONG_VUA_DAI.push(kind); continue; }

    const duoi = dongThu({ crown: kind, vernacularCrown: kind, crownWeight: nen + buoc * 0.999 });
    assert.deepEqual(trucKhacNhau(A, duoi), [],
      `chênh 99,9% một bước ở "${kind}" đã bị tính thành một trục — bước đang quá mịn`);
    const tren = dongThu({ crown: kind, vernacularCrown: kind, crownWeight: nen + buoc * 1.001 });
    assert.deepEqual(trucKhacNhau(A, tren), ['crownWeight'],
      `chênh 100,1% một bước ở "${kind}" mà phép đo KHÔNG thấy — bước đang quá thô`);
  }
  // ⚠️ ĐẾM ĐƯỢC, KHÔNG IM LẶNG: nếu một kiểu nữa rơi vào đây thì trục `crownWeight` vừa chết thêm
  // một phần mà không ai biết; nếu "barrel" rơi ra khỏi đây thì bước của nó vừa đổi và phải đo lại.
  assert.deepEqual(KHONG_VUA_DAI, ['barrel'],
    `bước lượng hoá rộng hơn cả dải \`crownWeight\` hợp lệ ở: ${KHONG_VUA_DAI.join(', ') || 'không kiểu nào'}`
    + ' — đo lại bước rồi cập nhật chính con số này, đừng nới dải cho vừa');
});

test('BẢNG SAI ĐỊNH DẠNG BỊ TỪ CHỐI THẲNG, không được lặng lẽ tự chữa', () => {
  // ⚠️ Tự chữa là cách một bảng 15 dòng lặng lẽ thoái hoá về 1 dòng (bẫy `MIN_STONE` Phase 9D).
  assert.ok(isValidRoofStyle(dongThu({})), 'dòng thử hợp lệ mà bị từ chối');
  const HONG = [
    [null, 'không phải đối tượng'],
    [dongThu({ crown: 'ngoi-bo-lo' }), 'kiểu đường nét lạ'],
    [dongThu({ stack: 'ban-cong' }), 'kiểu nhô lên lạ'],
    [dongThu({ vernacularCrown: undefined }), 'thiếu vế nhà dân của đường nét'],
    [dongThu({ vernacularStack: undefined }), 'thiếu vế nhà dân của thứ nhô lên'],
    [dongThu({ note: 'ngắn' }), 'ghi chú quá ngắn để nói được nước nào'],
    [dongThu({ stackCount: 0 }), 'đếm 0'],
    [dongThu({ stackCount: STACK_COUNT_MAX + 1 }), 'vượt trần đếm'],
    [dongThu({ stackCount: 2.5 }), 'đếm không nguyên'],
    [dongThu({ crown: 'ridge', crownWeight: CROWN_WEIGHT_MIN - 0.01 }), 'trọng số dưới sàn'],
    [dongThu({ crown: 'ridge', crownWeight: CROWN_WEIGHT_MAX + 0.01 }), 'trọng số vượt trần'],
    // ⚠️ CA QUAN TRỌNG NHẤT: một trường bị VÔ HIỆU HOÁ trong im lặng bởi một trường khác. Khai
    // `crown: 'upturn'` kèm trọng số 0 thì cái đầu đao dài đúng 0 — bảng nói có, màn hình nói
    // không. Đúng hình dạng lỗi `emitWindows` đã nuốt cái cửa của kỷ 1–2 suốt nhiều tháng.
    [dongThu({ crown: 'upturn', crownWeight: 0 }), 'có đường nét mà trọng số 0'],
    [dongThu({ vernacularCrown: 'ridge', crownWeight: 0 }), 'nhà dân có đường nét mà trọng số 0'],
    // …và chiều ngược lại: không có đường nét nào thì trọng số PHẢI là 0, không được để một số lơ
    // lửng chẳng ai đọc.
    [dongThu({ crown: 'none', vernacularCrown: 'none', crownWeight: 0.9 }), 'trọng số thừa'],
  ];
  for (const [rs, vi] of HONG) {
    assert.equal(isValidRoofStyle(rs), false, `phải TỪ CHỐI: ${vi}`);
  }
  // Gác chạy-rỗng: mọi giá trị trong hai danh sách từ vựng phải được validator CHẤP NHẬN — nếu
  // không thì một kiểu đã dựng được vẫn bị chặn ở cửa và không kỷ nào dùng nổi.
  for (const c of CROWN_KINDS) {
    const w = c === 'none' ? 0 : 1;
    assert.equal(isValidRoofStyle(dongThu({ crown: c, crownWeight: w })), true, `từ chối oan "${c}"`);
  }
  for (const s of STACK_KINDS) {
    assert.equal(isValidRoofStyle(dongThu({ stack: s })), true, `từ chối oan "${s}"`);
  }
});
