/**
 * blockStyle.test.js — khoá BẢNG hình thái khu phố (lớp BẢNG của khuôn ba lớp, lần thứ chín).
 *
 * ⚠️ Loại lỗi file này canh đều IM LẶNG: một dòng khai sai làm `isValidBlockStyle` từ chối, rồi cả
 * kỷ ấy không chia khu phố nữa mà không một cảnh báo nào (đúng ca kỷ 14 mất sạch cửa ở Phase 10
 * Bước 2). Hoặc 15 dòng lặng lẽ thoái hoá về một dòng, và "15 kỷ khác nhau" thành một lời nói
 * suông. Build/lint/test cũ đều xanh trong cả hai ca.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BLOCK_ATTACH, BLOCK_STYLES, MIN_UNITS, MAX_UNITS, MIN_UNIT_CELLS,
  MAX_COVERAGE, MAX_STOREY,
  blockUnitCount, deriveBlockUnits, getBlockStyle, isValidBlockStyle,
} from './blockStyle.js';
import { ERA_STYLES } from './eraStyle.js';
import { ROOFTOP_MIN_SPAN } from './rooftop.js';
import { BUILDING_SCALE } from './parts.js';
import { CELL_PIXELS, EYE_PIXELS } from './streetStyle.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

test('BẢNG ĐỦ 15 KỶ, và `country` bị KHOÁ CỨNG vào `eraStyle.js`', () => {
  // Không có ràng buộc này thì 15 dòng là 15 lần chọn bừa — mà chọn bừa chính là thứ đã sinh ra
  // "15 kỷ nhà giống hệt nhau" (Phase 5B). Mỗi dòng phải trả lời được *"khu dân cư ở NƯỚC ẤY,
  // THỜI ẤY, xếp nhà thế nào?"*, và câu hỏi ấy chỉ có nghĩa khi cái tên nước không tự trôi đi.
  assert.equal(Object.keys(BLOCK_STYLES).length, 15);
  for (const era of ERAS) {
    const style = BLOCK_STYLES[era];
    assert.ok(style, `kỷ ${era} không có dòng nào`);
    assert.equal(style.country, ERA_STYLES[era].country,
      `kỷ ${era}: bảng khu phố khai nước "${style.country}" còn eraStyle khai "${ERA_STYLES[era].country}"`);
    assert.ok(style.note.length >= 20, `kỷ ${era}: ghi chú quá ngắn để nói được lý do lịch sử`);
  }
});

test('CẢ 15 DÒNG PHẢI HỢP LỆ', () => {
  for (const era of ERAS) {
    assert.ok(isValidBlockStyle(BLOCK_STYLES[era]), `kỷ ${era} bị chính validator từ chối`);
  }
});

test('ĐỐI CHỨNG: validator TỪ CHỐI từng chiều MỘT — hỏi tổng thì không biết chiều nào đã chết', () => {
  // ⚠️ Hỏi tổng ("bơm cả ba lỗi vào rồi xem có đỏ không") là cái phễu đã cắn ở Phase 10 Bước 2:
  // nới đúng MỘT ngưỡng cho tiện thì đối chứng vẫn xanh. Phải hỏi TỪNG chiều.
  const goc = BLOCK_STYLES[9];
  const hong = [
    ['thiếu nước', { country: '' }],
    ['thiếu ghi chú', { note: '' }],
    ['kiểu dính lạ', { attach: 'terrace' }],
    ['cols không nguyên', { cols: 2.5 }],
    ['cols vượt trần', { cols: 6 }],
    ['rows bằng 0', { rows: 0 }],
    ['ngõ âm', { alley: -0.01 }],
    ['ngõ rộng hơn cả nhà', { alley: 0.41 }],
    ['storey dưới sàn', { storey: 0.79 }],
    ['storey vượt trần', { storey: MAX_STOREY + 0.01 }],
    ['vary âm', { vary: -0.01 }],
    ['vary vượt trần', { vary: 0.51 }],
    ['gableToStreet không phải boolean', { gableToStreet: 'có' }],
    // ── BỐN TRỤC PHASE 22 ─────────────────────────────────────────────────────────────────
    ['thiếu trần độ phủ', { coverage: undefined }],
    ['độ phủ dưới sàn', { coverage: 0.14 }],
    ['độ phủ vượt trần Đàm ra', { coverage: MAX_COVERAGE + 0.01 }],
    ['lùi mặt phố âm', { setFront: -0.01 }],
    ['lùi sau vượt trần', { setBack: 0.36 }],
    ['lùi hông không phải số', { setSide: 'ít' }],
    // ⚠️ Ca này là lời hứa TRUNG TÂM của Phase 22 viết thành một dòng: một thửa mà cả ba mặt đều
    // lùi 0 là quay lại đúng thế giới Đàm vừa bác — nhà lấp kín tới tận ranh thửa.
    ['không lùi mặt nào', { setFront: 0, setBack: 0, setSide: 0 }],
    ['lệch khoảng lùi vượt 1', { setJitter: 1.01 }],
    ['chênh cỡ âm', { sizeVary: -0.01 }],
    ['chênh cỡ vượt trần', { sizeVary: 0.51 }],
    ['ít hơn 4 đơn vị', { cols: 1, rows: 3, attach: 'party' }],
    ['nhiều hơn 10 đơn vị', { cols: 4, rows: 3, attach: 'party' }],
    ['quây sân mà không đủ 3×3', { cols: 2, rows: 5, attach: 'court' }],
  ];
  for (const [ten, vet] of hong) {
    assert.equal(isValidBlockStyle({ ...goc, ...vet }), false, `validator BỎ QUA lỗi: ${ten}`);
  }
  assert.equal(isValidBlockStyle(null), false);
  assert.equal(isValidBlockStyle('party'), false);
});

test('`blockUnitCount` — quây sân chỉ giữ VÀNH NGOÀI, lòng để trống làm sân', () => {
  assert.equal(blockUnitCount({ cols: 3, rows: 2, attach: 'party' }), 6);
  assert.equal(blockUnitCount({ cols: 2, rows: 2, attach: 'loose' }), 4);
  assert.equal(blockUnitCount({ cols: 3, rows: 3, attach: 'court' }), 8); // 9 − 1 ô lòng
  assert.equal(blockUnitCount({ cols: 3, rows: 4, attach: 'court' }), 10); // 12 − 2 ô lòng
  assert.equal(blockUnitCount({ cols: 2, rows: 4, attach: 'court' }), 0); // chưa đủ 3 cột thì không có lòng
  assert.equal(blockUnitCount({ cols: 0, rows: 3, attach: 'party' }), 0);
  assert.equal(blockUnitCount(), 0);
});

test('BẢNG KHÔNG DẸT — mọi TRỤC đều còn sống, và mọi kiểu dính đều được dùng', () => {
  // ⚠️ Điền cả 15 dòng bằng cùng một giá trị là cách rẻ nhất để mọi bài test khác hết đỏ, và nó
  // trông y hệt một bảng đầy đủ. Cơ chế "lùm cây" Phase 8D đã chết đúng kiểu đó suốt ba phase.
  const truc = ['cols', 'rows', 'attach', 'alley', 'storey', 'vary', 'gableToStreet',
    'coverage', 'setFront', 'setBack', 'setSide', 'setJitter', 'sizeVary'];
  for (const ten of truc) {
    const khac = new Set(ERAS.map((era) => BLOCK_STYLES[era][ten]));
    assert.ok(khac.size >= 2, `trục "${ten}" chỉ có ${khac.size} giá trị — cả 15 kỷ khai như nhau`);
  }
  for (const attach of BLOCK_ATTACH) {
    assert.ok(ERAS.some((era) => BLOCK_STYLES[era].attach === attach),
      `không kỷ nào dùng kiểu dính "${attach}" — hoặc bỏ nó khỏi BLOCK_ATTACH, hoặc dùng nó`);
  }
});

test('`MIN_UNIT_CELLS` là MAX của HAI ngưỡng đã hiệu chuẩn, không phải một số chọn tay', () => {
  // Vế (a) mắt còn đọc ra là căn nhà · vế (b) mái còn đội được chi tiết Phase 11. Bài này khoá cả
  // hai vế CÙNG một công thức mà mã sản phẩm dùng — chép lại giá trị là "một luật hai công thức".
  const mat = (3 * EYE_PIXELS) / CELL_PIXELS;
  const mai = ROOFTOP_MIN_SPAN * BUILDING_SCALE;
  assert.equal(MIN_UNIT_CELLS, Math.max(mat, mai));
  assert.ok(mai > mat, 'vế mái không còn là vế chặt hơn — xem lại vì sao vẫn lấy MAX');
});

test('`getBlockStyle` KẸP về dải 1..15, kỷ lạ rơi về kỷ 1', () => {
  assert.equal(getBlockStyle(1), BLOCK_STYLES[1]);
  assert.equal(getBlockStyle(15), BLOCK_STYLES[15]);
  assert.equal(getBlockStyle(0), BLOCK_STYLES[1]);
  assert.equal(getBlockStyle(99), BLOCK_STYLES[15]);
  assert.equal(getBlockStyle(NaN), BLOCK_STYLES[1]);
  assert.equal(getBlockStyle(), BLOCK_STYLES[1]);
  assert.equal(getBlockStyle(7.4), BLOCK_STYLES[7]);
});

test('TRẦN LUÔN THẮNG SÀN — ô chật thì ra ÍT căn, tuyệt đối không ra căn tí hon', () => {
  // Đây là luật đã trả giá ba lần: mái đua Phase 7C · cửa ADR-026 · `MIN_STONE` Phase 9D. Một
  // suất đất hẹp hơn `MIN_UNIT_CELLS` thì bỏ bớt hàng/cột, KHÔNG thu nhỏ căn nhà.
  let daKiem = 0;
  for (const era of ERAS) {
    const style = BLOCK_STYLES[era];
    for (const rong of [0.3, 0.5, 0.92, 1.2, 1.6, 2.4]) {
      for (const sau of [0.3, 0.5, 0.92, 1.2, 1.6, 2.4]) {
        const units = deriveBlockUnits({ style, seed: `k${era}`, blockW: rong, blockD: sau });
        assert.ok(units.length >= 1, `kỷ ${era} ${rong}×${sau}: không ra đơn vị nào`);
        assert.ok(units.length <= blockUnitCount(style),
          `kỷ ${era} ${rong}×${sau}: ra ${units.length} đơn vị, NHIỀU HƠN số đã khai ${blockUnitCount(style)}`);
        for (const u of units) {
          const motCot = units.every((x) => x.col === units[0].col);
          const motHang = units.every((x) => x.row === units[0].row);
          if (!motCot) {
            assert.ok(u.w >= MIN_UNIT_CELLS - 1e-9,
              `kỷ ${era} ${rong}×${sau}: đơn vị rộng ${u.w.toFixed(3)} ô, hẹp hơn sàn ${MIN_UNIT_CELLS}`);
          }
          if (!motHang) {
            assert.ok(u.d >= MIN_UNIT_CELLS - 1e-9,
              `kỷ ${era} ${rong}×${sau}: đơn vị sâu ${u.d.toFixed(3)} ô, mỏng hơn sàn ${MIN_UNIT_CELLS}`);
          }
          assert.ok(Number.isFinite(u.storey) && u.storey > 0);
          assert.ok(u.faces && typeof u.faces.xm === 'boolean');
        }
        daKiem += 1;
      }
    }
  }
  assert.equal(daKiem, 15 * 36, 'không quét đủ lưới tích — vòng lặp đang chạy rỗng');
});

test('ĐỐI CHỨNG: bỏ phép kẹp thì suất đất hẹp PHẢI sinh ra căn tí hon', () => {
  // Không có bài này thì bài trên có thể xanh vì `deriveBlockUnits` chưa bao giờ bị ép vào ca hẹp.
  // Nhốt sẵn ca hỏng: chia thẳng theo `cols`/`rows` đã khai, không kẹp.
  const style = BLOCK_STYLES[10]; // 4×2
  const HEP = 0.5;
  assert.ok(HEP / style.cols < MIN_UNIT_CELLS,
    'ca thử đã hết hẹp — chọn lại bề ngang, nếu không đối chứng này không còn răng');
  const units = deriveBlockUnits({ style, seed: 'hep', blockW: HEP, blockD: HEP });
  assert.ok(units.length < blockUnitCount(style),
    'ô hẹp mà vẫn ra đủ số đơn vị đã khai — phép kẹp không hề chạy');
});

test('QUÂY SÂN CO LẠI QUÁ THÌ THÀNH CỤM NHÀ RỜI, không thành một cái lỗ', () => {
  // `court` cần ít nhất 3×3 mới có lòng để chừa. Co xuống 2×2 mà vẫn giữ luật vành-ngoài thì cả
  // bốn ô đều là vành, nhưng nếu quên nhánh thoái hoá thì `coNha` trả `false` cho mọi ô và khu
  // phố RỖNG — im lặng tuyệt đối.
  //
  // ⚠️ THOÁI HOÁ VỀ `loose`, KHÔNG VỀ `party` (đổi ở Phase 22 — bài này trước đây mang tên "thành
  // dãy chung tường"). Cả năm kỷ khai `court` đều là kỷ KHÔNG có nhà phố chung tường; cho chúng
  // rơi về một dãy chung tường là dựng ra một kiểu nhà chưa từng có ở nước ấy, chỉ vì hôm nay
  // thửa đất hơi chật.
  const court = ERAS.find((era) => BLOCK_STYLES[era].attach === 'court');
  const units = deriveBlockUnits({ style: BLOCK_STYLES[court], seed: 'co', blockW: 0.7, blockD: 0.7 });
  assert.ok(units.length >= 1, 'quây sân co lại ra khu phố RỖNG');
  for (const u of units) assert.ok(u.faces.xm !== undefined);
});

test('TẤT ĐỊNH — cùng hạt giống ra đúng cùng một kết quả, mãi mãi (ADR-007)', () => {
  for (const era of ERAS) {
    const a = deriveBlockUnits({ style: BLOCK_STYLES[era], seed: `d-${era}-3-4`, blockW: 1.1, blockD: 0.95 });
    const b = deriveBlockUnits({ style: BLOCK_STYLES[era], seed: `d-${era}-3-4`, blockW: 1.1, blockD: 0.95 });
    assert.deepEqual(a, b, `kỷ ${era}: hai lần gọi ra hai kết quả`);
  }
  const x = deriveBlockUnits({ style: BLOCK_STYLES[6], seed: 'A', blockW: 1.1, blockD: 0.95 });
  const y = deriveBlockUnits({ style: BLOCK_STYLES[6], seed: 'B', blockW: 1.1, blockD: 0.95 });
  assert.notDeepEqual(x, y, 'đổi hạt giống mà khu phố không đổi gì — biến thể theo hạt đã chết');
});

test('SỐ ĐƠN VỊ ĐÃ KHAI nằm trong dải 4..10 ở CẢ 15 KỶ', () => {
  for (const era of ERAS) {
    const n = blockUnitCount(BLOCK_STYLES[era]);
    assert.ok(n >= MIN_UNITS && n <= MAX_UNITS, `kỷ ${era} khai ${n} đơn vị, ngoài dải ${MIN_UNITS}..${MAX_UNITS}`);
  }
});

test('TƯỜNG CHUNG: dãy `party` phải có mặt bị bịt, dãy `loose` thì không', () => {
  const party = deriveBlockUnits({ style: { ...BLOCK_STYLES[9], cols: 3, rows: 2 }, seed: 's', blockW: 1.6, blockD: 1.2 });
  assert.equal(party.length, 6);
  const biBit = party.filter((u) => !u.faces.xm || !u.faces.xp || !u.faces.zm || !u.faces.zp);
  assert.equal(biBit.length, 6, 'dãy chung tường mà không đơn vị nào bị bịt mặt nào');
  const giua = party.filter((u) => u.col === 1);
  for (const u of giua) {
    assert.equal(u.faces.xm, false, 'đơn vị GIỮA dãy vẫn hở mặt bên — mặt nạ tường chung sai');
    assert.equal(u.faces.xp, false);
  }
  const loose = deriveBlockUnits({ style: { ...BLOCK_STYLES[6] }, seed: 's', blockW: 1.6, blockD: 1.2 });
  for (const u of loose) {
    assert.deepEqual(u.faces, { xm: true, xp: true, zm: true, zp: true },
      'nhà rời mà vẫn bị bịt mặt — làng Bắc Bộ không chung tường');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PHASE 22 — «nhà nó san sát nhau một cách khó hiểu và không giống thực tế, rất phi logic»
// ═══════════════════════════════════════════════════════════════════════════════════════════════

test('TRẦN ĐỘ PHỦ THỬA — không thửa nào bị nhà chiếm quá `MAX_COVERAGE`, trừ chỗ SÀN ĐỌC-ĐƯỢC chặn', () => {
  // Lời hứa trung tâm của Phase 22, và là thứ Đàm chấm bằng mắt: *nhìn từ trên xuống phải thấy
  // ĐẤT giữa các căn nhà*. Trước phase này, độ phủ thật của 371 ô là **54,8 % … 96,0 %, trung vị
  // 88,4 %** — tức 13/15 kỷ là một mảng mái liền.
  //
  // ⚠️ NGOẠI LỆ DUY NHẤT ĐƯỢC PHÉP LÀ SÀN ĐỌC-ĐƯỢC. Khi một đơn vị đã chạm `MIN_UNIT_CELLS` thì
  // phép thu dừng lại, và độ phủ có thể nhỉnh hơn trần. Bài này ĐẾM những ô ấy ra thay vì nới
  // trần — nới trần là bỏ răng cho cả 15 kỷ (bài học Phase 9A).
  let vuot = 0;
  let daKiem = 0;
  let caoNhat = 0;
  for (const era of ERAS) {
    const style = BLOCK_STYLES[era];
    for (const rong of [0.92, 1.0, 1.1, 1.25]) {
      for (const sau of [0.92, 1.0, 1.1, 1.25]) {
        const units = deriveBlockUnits({ style, seed: `p22|${era}|${rong}|${sau}`, blockW: rong, blockD: sau });
        const phu = units.reduce((t, u) => t + u.w * u.d, 0) / (rong * sau);
        caoNhat = Math.max(caoNhat, phu);
        // ⚠️ HỎI CHÍNH CỜ MÀ MÃ SẢN PHẨM GẮN (`sanChan`), đừng suy nó từ kích thước. Bước 4b rắc
        // lại phương sai NGƯỢC LÊN từ sàn, nên sau đó một đơn vị từng bị sàn chặn KHÔNG còn bằng
        // đúng `MIN_UNIT_CELLS` nữa — suy từ kích thước là suy về một thế giới đã qua một bước.
        const chamSan = units.some((u) => u.sanChan);
        if (phu > style.coverage + 1e-9) {
          assert.ok(chamSan, `kỷ ${era} ${rong}×${sau}: phủ ${(phu * 100).toFixed(1)}% vượt trần `
            + `${(style.coverage * 100).toFixed(0)}% mà KHÔNG có đơn vị nào chạm sàn đọc-được — `
            + 'tức phép thu theo trần độ phủ không hề chạy');
          vuot += 1;
        }
        daKiem += 1;
      }
    }
  }
  assert.equal(daKiem, 15 * 16, 'gác chạy-rỗng');
  // Ngay cả khi sàn chặn, không thửa nào được quay lại mức "mảng mái liền" cũ.
  assert.ok(caoNhat <= 0.78, `vẫn còn thửa bị nhà chiếm ${(caoNhat * 100).toFixed(1)}% — `
    + 'trước Phase 22 trung vị là 88,4%, nên con số này mà bò về đó là phase đã bị hoàn tác');
  assert.ok(vuot > 0, 'không ô nào chạm sàn đọc-được — phép đo này thôi nhìn tới ca khó nhất');
});

test('KHOẢNG LÙI CÓ THẬT, VÀ NÓ LỆCH NHAU THEO HẠT GIỐNG', () => {
  // ⚠️ Đàm nói rõ cả hai vế: *"thêm trục lùi trước / lùi sau / lùi hông"* VÀ *"khoảng lùi phải
  // lệch nhau theo hạt giống — một dãy lùi đều tăm tắp chính là thứ đang bị kêu"*. Hai vế ấy là
  // hai bài đo khác nhau: vế một hỏi *có đất ở rìa thửa không*, vế hai hỏi *cái mép nhà có thẳng
  // như kẻ chỉ không*.
  for (const era of ERAS) {
    const style = BLOCK_STYLES[era];
    const units = deriveBlockUnits({ style, seed: `lui|${era}`, blockW: 1.1, blockD: 1.05 });
    assert.ok(units.length >= 1, `kỷ ${era}: không ra đơn vị nào`);
    // VẾ 1 — không đơn vị nào được chạm tới ranh thửa.
    for (const u of units) {
      assert.ok(Math.abs(u.ox) + u.w / 2 <= 1.1 / 2 + 1e-9,
        `kỷ ${era}: một đơn vị thò ra khỏi ranh thửa theo trục ngang`);
      assert.ok(Math.abs(u.oz) + u.d / 2 <= 1.05 / 2 + 1e-9,
        `kỷ ${era}: một đơn vị thò ra khỏi ranh thửa theo trục dọc`);
    }
    // VẾ 2 — mép trước của các đơn vị KHÔNG được trùng nhau tuyệt đối, trừ đúng hai kỷ có quy
    // chế bắt thế. `setJitter` của chúng khai gần 0, và đó là một sự thật lịch sử được ghi ở bảng.
    //
    // ── VẾ 2 — MÉP NHÀ KHÔNG ĐƯỢC THẲNG NHƯ KẺ CHỈ ─────────────────────────────────────────
    //
    // ⚠️ HAI CƠ CHẾ CÙNG ĐỔ VÀO MỘT CON SỐ, NÊN PHẢI TÁCH RA MỚI QUY TRÁCH NHIỆM ĐƯỢC. Bản đầu
    // của bài này đo **mép trước** (`oz − d/2`) rồi đòi nó đi cùng chiều với `setJitter`. Đo ra
    // thì hỏng: ép `setJitter = 0` mà mép trước vẫn trải **0,0188 ô** ở kỷ 2 — vì `sizeVary` làm
    // các căn SÂU NÔNG khác nhau, và cái đó tự nó đã đẩy mép trước lệch đi. Hai kỷ (2 và 14) còn
    // trải RỘNG HƠN khi tắt hẳn `setJitter`, thuần do hạt giống rơi khác. Một phép đo trộn hai
    // cơ chế thì không nói được cơ chế nào đang sống (đúng bài học fBm Phase 9A).
    //
    // ⇒ Đo TÂM (`oz`) để hỏi riêng cơ chế xê dịch, và đo MÉP để hỏi thứ mắt thật sự nhìn.
    const trai = (ds) => (ds.length >= 2 ? Math.max(...ds) - Math.min(...ds) : 0);
    const hang0 = (jit) => deriveBlockUnits({
      style: { ...style, setJitter: jit }, seed: `lui|${era}`, blockW: 1.1, blockD: 1.05,
    }).filter((u) => u.row === 0);

    // (a) NHÂN QUẢ: tắt hẳn thì tâm nhà phải về đúng lưới, không xê một chữ số nào.
    assert.equal(trai(hang0(0).map((u) => u.oz)), 0,
      `kỷ ${era}: setJitter = 0 mà tâm nhà vẫn xê dịch — cơ chế đang bị một thứ khác lái`);

    // (b) ĐƠN ĐIỆU: cùng bộ hạt giống, biên xê dịch tỉ lệ thẳng với `setJitter`, nên vặn hết cỡ
    //     phải trải rộng hơn hoặc bằng mức bảng khai. Đây là cái canh cho việc cơ chế CÓ NỐI.
    const tamKhai = trai(hang0(style.setJitter).map((u) => u.oz));
    const tamHetCo = trai(hang0(1).map((u) => u.oz));
    assert.ok(tamHetCo >= tamKhai - 1e-9,
      `kỷ ${era}: vặn setJitter lên 1 mà trải (${tamHetCo.toFixed(4)}) lại NHỎ hơn mức khai `
      + `(${tamKhai.toFixed(4)}) — biên xê dịch không còn tỉ lệ với cột bảng`);
    if (style.setJitter >= 0.2) {
      assert.ok(tamKhai > 0, `kỷ ${era}: bảng khai setJitter ${style.setJitter} mà không căn nào `
        + 'xê dịch — cột này đã chết, đúng kiểu cơ chế "lùm cây" Phase 8D');
    } else {
      // Kỷ 9 (quy chế Haussmann) và 12 (bản vẽ điển hình Liên Xô) CỐ Ý gần như không xê dịch.
      assert.ok(tamKhai <= 0.01, `kỷ ${era} khai setJitter ${style.setJitter} (quy chế bắt xây `
        + `thẳng chỉ giới) mà tâm nhà vẫn trải ${tamKhai.toFixed(4)} ô`);
    }

    // (c) THỨ MẮT NHÌN: mép trước của cả dãy phải so le ở mọi kỷ có khai biến thiên.
    if (style.setJitter >= 0.2 || style.sizeVary >= 0.15) {
      const mep = trai(hang0(style.setJitter).map((u) => u.oz - u.d / 2));
      assert.ok(mep > 0, `kỷ ${era}: cả dãy lùi đều tăm tắp — đúng thứ Đàm đang bác`);
    }
  }
});

test('TƯỜNG CHUNG CHỈ CHẠY DỌC MẶT PHỐ — căn nằm sâu trong thửa luôn tách rời', () => {
  // Đàm: *"nhà dính tường chỉ áp cho căn giáp ranh thửa phía có đường… Căn nằm sâu trong thửa
  // luôn tách rời. Kỷ 1–6 · 12 · 13 · 15 dùng cách khác: quây sân, tụ lỏng, nhà sân trong."*
  //
  // Danh sách viết BẰNG chứ không phải "bao gồm": kỷ thứ bảy khai `party` thì đỏ, mà một trong
  // sáu kỷ này bỏ `party` cũng đỏ. Một `continue` im lặng ở đây sẽ giấu mất cả một luật.
  const dayPho = ERAS.filter((era) => BLOCK_STYLES[era].attach === 'party');
  assert.deepEqual(dayPho, [7, 8, 9, 10, 11, 14],
    `kỷ khai nhà phố chung tường nay là [${dayPho.join(',')}] — chỉ kỷ CÓ nhà phố thật mới được `
    + 'nằm đây (7 Ý insula · 8 Bồ · 9 Pháp Haussmann · 10 Anh terrace · 11 Mỹ brownstone · 14 shophouse)');

  for (const era of dayPho) {
    const units = deriveBlockUnits({
      style: { ...BLOCK_STYLES[era], cols: 3, rows: 2 }, seed: `mp|${era}`, blockW: 1.7, blockD: 1.3,
    });
    assert.equal(units.length, 6, `kỷ ${era}: quần thể thử sai hình dạng`);
    for (const u of units) {
      // Trước/sau LUÔN hở: giữa hai hàng là sân sau (cavaedium · cour · ngõ dịch vụ · giếng trời).
      assert.equal(u.zm, undefined);
      assert.equal(u.faces.zm, true, `kỷ ${era}: căn ở hàng ${u.row} vẫn dính lưng vào hàng kia`);
      assert.equal(u.faces.zp, true, `kỷ ${era}: căn ở hàng ${u.row} vẫn dính lưng vào hàng kia`);
    }
    // Còn tường BÊN thì vẫn phải chung — nếu không thì `party` đã chết hẳn.
    const giua = units.filter((u) => u.col === 1);
    assert.equal(giua.length, 2);
    for (const u of giua) {
      assert.equal(u.faces.xm, false, `kỷ ${era}: căn GIỮA dãy hở cả hai bên — tường chung đã chết`);
      assert.equal(u.faces.xp, false);
    }
  }

  // Mọi kỷ còn lại: bốn mặt đều nhìn ra ngoài.
  for (const era of ERAS.filter((e) => !dayPho.includes(e))) {
    const units = deriveBlockUnits({ style: BLOCK_STYLES[era], seed: `roi|${era}`, blockW: 1.4, blockD: 1.4 });
    for (const u of units) {
      assert.deepEqual(u.faces, { xm: true, xp: true, zm: true, zp: true },
        `kỷ ${era} khai "${BLOCK_STYLES[era].attach}" mà vẫn có mặt bị bịt`);
    }
  }
});

test('HẾT NHÀ TRÙNG KHÍT — cỡ mặt bằng, chiều cao và hướng sống mái đều lệch theo hạt giống', () => {
  // Đàm: *"cỡ mặt bằng · chiều cao · hướng mái đều phải lệch theo hạt giống… Kỷ 12 (nhà tập thể
  // Liên Xô) được phép đều nhất; kỷ 1–9 không căn nào được trùng khít căn bên cạnh."*
  //
  // ⚠️ Đo TỪNG CHIỀU MỘT. Hỏi tổng ("có hai căn nào khác nhau không") là cái phễu: chỉ cần chiều
  // cao lệch là xanh, trong khi nhìn TỪ TRÊN XUỐNG — góc Đàm dùng để chấm — chiều cao gần như
  // không đọc ra được. Cái mắt đọc ra ở góc ấy chính là MẶT BẰNG.
  for (const era of ERAS) {
    const units = deriveBlockUnits({ style: BLOCK_STYLES[era], seed: `tk|${era}`, blockW: 1.2, blockD: 1.1 });
    assert.ok(units.length >= 4, `kỷ ${era}: chỉ ${units.length} đơn vị`);
    const matBang = new Set(units.map((u) => `${u.w.toFixed(4)}x${u.d.toFixed(4)}`));
    const chieuCao = new Set(units.map((u) => u.storey.toFixed(4)));
    if (era <= 9) {
      assert.ok(matBang.size >= 2, `kỷ ${era}: cả ${units.length} căn CÙNG một mặt bằng — `
        + 'đúng thứ Đàm gọi là "hàng chục căn trùng khít nhau"');
    }
    assert.ok(chieuCao.size >= 2 || BLOCK_STYLES[era].vary === 0,
      `kỷ ${era}: cả khu phố cùng một chiều cao mà bảng khai vary ${BLOCK_STYLES[era].vary}`);
  }
  // Kỷ 12 ĐƯỢC PHÉP đều nhất — và đó là một sự thật lịch sử (bản vẽ điển hình dùng chung cho cả
  // Liên bang), nên nó phải khai `vary`/`sizeVary` thấp nhất bảng chứ không phải tình cờ thấp.
  const deu = (e) => BLOCK_STYLES[e].vary + BLOCK_STYLES[e].sizeVary + BLOCK_STYLES[e].setJitter;
  const thapNhat = ERAS.slice().sort((a, b) => deu(a) - deu(b))[0];
  assert.ok([9, 12].includes(thapNhat),
    `kỷ đều nhất bảng nay là ${thapNhat} — chỉ kỷ 12 (bản vẽ điển hình Liên Xô) hoặc kỷ 9 `
    + '(quy chế Haussmann) mới có lý do để đứng đây');
});
