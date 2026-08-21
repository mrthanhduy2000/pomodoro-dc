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
    ['storey vượt trần', { storey: 2.01 }],
    ['vary âm', { vary: -0.01 }],
    ['vary vượt trần', { vary: 0.51 }],
    ['gableToStreet không phải boolean', { gableToStreet: 'có' }],
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
  const truc = ['cols', 'rows', 'attach', 'alley', 'storey', 'vary', 'gableToStreet'];
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

test('QUÂY SÂN CO LẠI QUÁ THÌ THÀNH DÃY CHUNG TƯỜNG, không thành một cái lỗ', () => {
  // `court` cần ít nhất 3×3 mới có lòng để chừa. Co xuống 2×2 mà vẫn giữ luật vành-ngoài thì cả
  // bốn ô đều là vành ⇒ đúng bằng `party`, nhưng nếu quên nhánh thoái hoá thì `coNha` trả `false`
  // cho mọi ô và khu phố RỖNG — im lặng tuyệt đối.
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
