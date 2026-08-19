/**
 * groundCoverStyle.test.js — khoá BẢNG "mảnh đất cạnh nhà được dùng làm gì", 15 kỷ.
 *
 * Bảng này là dữ liệu thuần, nên phần lớn lỗi của nó là lỗi GÕ NHẦM — và lỗi gõ nhầm ở đây im lặng
 * tuyệt đối: khai một kiểu không tồn tại thì `buildGroundCover` trả mảng RỖNG, và cả kỷ ấy mất
 * mảng phủ mà build/lint/test đều xanh. Đó đúng là cái bẫy đã cắn ở Phase 10 Bước 2 (kỷ 14 khai
 * `doorWidth` vượt trần ⇒ validator từ chối ĐÚNG, hàm dựng trả `false` ĐÚNG, và kỷ ấy không có
 * cửa), nên bài đầu tiên dưới đây là bài ĐẾM SỐ LẦN TỪ CHỐI Ở ĐẦU BÊN KIA.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COVER_KINDS, GROUND_COVER_STYLES,
  getGroundCoverStyle, isValidGroundCoverStyle, pickCoverKind,
} from './groundCoverStyle.js';
import { buildGroundCover } from './groundCover.js';
import { ERA_STYLES } from './eraStyle.js';
import { CELL_PIXELS, EYE_PIXELS } from './streetStyle.js';

const ERAS = Object.keys(GROUND_COVER_STYLES).map(Number);
const KIND_SET = new Set(COVER_KINDS);

/**
 * Số ô đất còn TRỐNG của một thành phố trẻ (20 phiên) — đo ngày 2026-08-19 bằng
 * `computeCityLayout` ở kỷ 1/6/11/15, cả bốn đều ra **96**.
 *
 * Nó có mặt ở đây chỉ để đổi `share` (một TỈ LỆ) thành số mảng phủ (một thứ ĐẾM ĐƯỢC), vì trục bản
 * sắc mà mắt đọc được là *"kỷ này có bao nhiêu cái sân"*, không phải con số thập phân trong bảng.
 */
const O_TRONG_THAM_CHIEU = 96;

test('đủ 15 kỷ, không thiếu không thừa', () => {
  assert.equal(ERAS.length, 15);
  for (let era = 1; era <= 15; era += 1) {
    assert.ok(GROUND_COVER_STYLES[era], `kỷ ${era} không có bảng dùng đất`);
  }
});

test('MỌI KỶ HỢP LỆ **VÀ** THẬT SỰ DỰNG RA KHỐI — hai câu hỏi, không phải một', () => {
  // ⚠️ "Hợp lệ" và "dựng ra thật" là HAI câu hỏi khác nhau, và để một assert trả lời cả hai chính
  // là cách một kỷ lặng lẽ mất mảng phủ. Bài này hỏi cả hai, và đếm để không chạy rỗng.
  let daDuyet = 0;
  for (const era of ERAS) {
    const s = GROUND_COVER_STYLES[era];
    assert.ok(isValidGroundCoverStyle(s), `kỷ ${era}: chính validator của nó từ chối dòng này`);
    for (const [kind] of s.kinds) {
      assert.ok(KIND_SET.has(kind), `kỷ ${era} khai kiểu lạ "${kind}"`);
      const parts = buildGroundCover({ kind, scale: s.scale, enclose: s.enclose, seed: `t${era}` });
      assert.ok(parts.length > 0,
        `kỷ ${era}: kiểu "${kind}" hợp lệ nhưng KHÔNG dựng ra khối nào — im lặng mất một kiểu`);
      daDuyet += 1;
    }
  }
  assert.ok(daDuyet >= 15 * 2, `chỉ duyệt được ${daDuyet} cặp (kỷ × kiểu) — vòng lặp đang chạy hụt`);
});

test('ghi chú của mỗi kỷ phải nhắc đúng đất nước mà `eraStyle.js` đã khai', () => {
  // Luật từ Phase 5B, đã áp cho thảm thực vật · mặt đường · tầng trệt · mái. Không có ràng buộc này
  // thì 15 dòng là 15 lần chọn bừa, và chọn bừa chính là thứ đã sinh ra 15 kỷ giống hệt nhau.
  for (const era of ERAS) {
    const country = ERA_STYLES[era]?.country;
    assert.ok(country, `kỷ ${era} không có \`country\` ở eraStyle.js`);
    assert.ok(GROUND_COVER_STYLES[era].note.includes(country),
      `kỷ ${era}: ghi chú không nhắc "${country}" ⇒ mấy con số của dòng này không có gì neo lại`);
  }
});

test('`pickCoverKind` tất định, và chỉ bốc trong đúng những kiểu kỷ ấy khai', () => {
  for (const era of ERAS) {
    const choPhep = new Set(GROUND_COVER_STYLES[era].kinds.map(([k]) => k));
    const bocDuoc = new Set();
    for (let i = 0; i < 400; i += 1) {
      const k = pickCoverKind(era, `s|${i}`);
      assert.ok(choPhep.has(k), `kỷ ${era} bốc trúng "${k}" — kiểu này không có trong bảng của nó`);
      assert.equal(pickCoverKind(era, `s|${i}`), k, `kỷ ${era}: cùng hạt giống ra hai kiểu khác nhau`);
      bocDuoc.add(k);
    }
    assert.equal(bocDuoc.size, choPhep.size,
      `kỷ ${era}: khai ${choPhep.size} kiểu nhưng 400 lần bốc chỉ ra ${bocDuoc.size} ⇒ có kiểu không bao giờ mọc`);
  }
});

test('kỷ lạ → lùi về kỷ 1, không bao giờ ném lỗi (dữ liệu cloud có thể hỏng)', () => {
  for (const era of [0, -3, 16, 999, null, undefined, NaN, 'sáu']) {
    assert.equal(getGroundCoverStyle(era), GROUND_COVER_STYLES[1], `kỷ lạ ${String(era)} không lùi về kỷ 1`);
  }
});

test('ĐỐI CHỨNG — validator TỪ CHỐI THẲNG, và phải từ chối TỪNG kiểu hỏng một', () => {
  // ⚠️ HỎI TỪNG CHIỀU MỘT, đừng hỏi tổng. Một đối chứng gộp nhiều lỗi vào một dòng rồi hỏi "có sai
  // không" sẽ vẫn XANH khi chỉ còn một nhánh kiểm sót lại — đúng cái phễu đã cắn ở Phase 10 Bước 2.
  const lanh = { note: 'Việt Nam — sân phơi lúa lát gạch', kinds: [['drying', 6], ['yard', 3]], share: 0.5, scale: 1, enclose: 0.5 };
  assert.ok(isValidGroundCoverStyle(lanh), 'dòng mẫu LÀNH mà bị từ chối ⇒ đối chứng dưới đây vô nghĩa');
  const hong = {
    'kiểu không tồn tại':      { ...lanh, kinds: [['lake', 5]] },
    'trọng số 0':              { ...lanh, kinds: [['yard', 0]] },
    'trọng số âm':             { ...lanh, kinds: [['yard', -2]] },
    'trùng kiểu trong một dòng': { ...lanh, kinds: [['yard', 3], ['yard', 2]] },
    'không có kiểu nào':       { ...lanh, kinds: [] },
    'share = 0':               { ...lanh, share: 0 },
    'share > 1':               { ...lanh, share: 1.4 },
    'scale quá nhỏ':           { ...lanh, scale: 0.4 },
    'scale quá lớn':           { ...lanh, scale: 1.6 },
    'enclose > 1':             { ...lanh, enclose: 1.3 },
    'enclose âm':              { ...lanh, enclose: -0.2 },
    'ghi chú cụt':             { ...lanh, note: 'sân' },
    'không phải đối tượng':    'yard',
  };
  for (const [ten, dong] of Object.entries(hong)) {
    assert.equal(isValidGroundCoverStyle(dong), false, `validator NHẬN một dòng hỏng: ${ten}`);
  }
});

/**
 * SÁU TRỤC CẤU TRÚC — mỗi trục là một thứ MẮT ĐỌC ĐƯỢC ở khung toàn cảnh, không phải một con số
 * trong bảng. Bước lượng hoá suy từ đúng hai phép đo đã có (`CELL_PIXELS` · `EYE_PIXELS`, xem
 * `streetStyle.js`), cộng một phép đếm: 96 ô đất trống ở thành phố 20 phiên.
 */
function sauTruc(a, b) {
  const boA = new Set(a.kinds.map(([k]) => k));
  const boB = new Set(b.kinds.map(([k]) => k));
  const chuDao = (s) => s.kinds.reduce((m, e) => (e[1] > m[1] ? e : m))[0];
  const soPhia = (s) => Math.max(0, Math.min(4, Math.round(s.enclose * 4)));
  const caoRao = (s) => 0.07 + s.enclose * 0.20;
  const coMang = (s) => 0.86 * s.scale;
  const soMang = (s) => Math.floor(O_TRONG_THAM_CHIEU * s.share);
  const roRang = (x, y) => Math.abs(x - y) * CELL_PIXELS >= EYE_PIXELS;
  return {
    'bộ kiểu':      [...boA].some((k) => !boB.has(k)) || [...boB].some((k) => !boA.has(k)),
    'kiểu chủ đạo': chuDao(a) !== chuDao(b),
    'số phía quây': soPhia(a) !== soPhia(b),
    'cao tường':    roRang(caoRao(a), caoRao(b)),
    'cỡ mảng':      roRang(coMang(a), coMang(b)),
    // ⚠️ ĐÒI CHÊNH ≥ 2 MẢNG, KHÔNG PHẢI ≥ 1: chênh đúng 1 có thể sinh ra chỉ vì `Math.floor` rơi
    // hai bên một mốc, tức là một khác biệt của phép làm tròn chứ không của bảng.
    'số mảng phủ':  Math.abs(soMang(a) - soMang(b)) >= 2,
  };
}

test('15 KỶ RA 15 CÁCH DÙNG ĐẤT — 105 cặp, đo bằng sáu trục cấu trúc', () => {
  const diem = [];
  let yeuNhat = Infinity; let capYeu = '';
  const trucSong = {};
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      const t = sauTruc(GROUND_COVER_STYLES[ERAS[i]], GROUND_COVER_STYLES[ERAS[j]]);
      for (const [ten, co] of Object.entries(t)) if (co) trucSong[ten] = (trucSong[ten] ?? 0) + 1;
      const n = Object.values(t).filter(Boolean).length;
      diem.push(n);
      if (n < yeuNhat) { yeuNhat = n; capYeu = `${ERAS[i]}↔${ERAS[j]}`; }
    }
  }
  assert.equal(diem.length, 105, 'không duyệt đủ 105 cặp');
  // ⚠️ SÀN LẤY TỪ PHÉP ĐO, KHÔNG ĐOÁN. Đo lúc viết: yếu nhất **3/6**, trung vị **5/6**.
  assert.ok(yeuNhat >= 3, `cặp ${capYeu} chỉ khác nhau ${yeuNhat}/6 trục ⇒ hai kỷ đọc ra là một`);
  // Cực tiểu là một con số GỘP: nó đứng yên dù có MỘT cặp yếu hay bốn mươi cặp yếu. Trung vị mới
  // nói được cả bảng có đang dẹt đi không (bài học Phase 10 Bước 2).
  const sap = [...diem].sort((a, b) => a - b);
  const trungVi = sap[Math.floor(sap.length / 2)];
  assert.ok(trungVi >= 4, `trung vị chỉ ${trungVi}/6 trục ⇒ cả bảng đang dẹt lại`);
  // Và MỖI TRỤC phải còn sống: trục nào cả 15 kỷ khai giống nhau thì bảng thật ra hẹp hơn nó trông.
  for (const ten of Object.keys(sauTruc(GROUND_COVER_STYLES[1], GROUND_COVER_STYLES[2]))) {
    assert.ok((trucSong[ten] ?? 0) > 0, `trục "${ten}" không phân biệt được cặp nào ⇒ nó là một trục CHẾT`);
  }
});

test('ĐỐI CHỨNG — 15 kỷ giống hệt nhau phải ra 0 trục, và hạt bụi KHÔNG được tính thành trục', () => {
  const mau = { note: 'x', kinds: [['yard', 5], ['well', 2]], share: 0.5, scale: 1, enclose: 0.5 };
  assert.equal(Object.values(sauTruc(mau, mau)).filter(Boolean).length, 0,
    'hai dòng GIỐNG HỆT nhau mà phép đo vẫn tìm ra khác biệt ⇒ nó đang đếm nhiễu');
  // ⚠️ HỎI TỪNG TRỤC MỘT. Cộng ba lệch tí hon vào một dòng rồi hỏi "< 3" là tự dựng lại đúng cái
  // phễu mà đối chứng này sinh ra để chống: nới riêng MỘT ngưỡng thì tổng vẫn nhỏ hơn 3.
  const bui = sauTruc(mau, { ...mau, share: mau.share + 0.001, scale: mau.scale + 0.001, enclose: mau.enclose + 0.001 });
  for (const [ten, co] of Object.entries(bui)) {
    assert.equal(co, false, `trục "${ten}" coi một lệch 0,001 là một khác biệt đọc được`);
  }
});
