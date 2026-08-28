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
  BLOCK_ATTACH, BLOCK_LAYOUT, BLOCK_STYLES, MIN_UNITS, MAX_UNITS, MIN_UNIT_CELLS,
  BLOCK_YARD_MAX, EAVE_LAND_FACTOR,
  blockUnitCount, deriveBlockUnits, getBlockStyle, isValidBlockStyle, laLuoiDeu,
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
  const luoi = BLOCK_STYLES[11]; // dòng `grid`  — khai bằng cols × rows
  const huuCo = BLOCK_STYLES[9];  // dòng `organic` — khai bằng units
  const chung = [
    ['thiếu nước', { country: '' }],
    ['thiếu ghi chú', { note: '' }],
    ['kiểu dính lạ', { attach: 'terrace' }],
    ['kiểu bố cục lạ', { layout: 'voronoi' }],
    ['thiếu kiểu bố cục', { layout: undefined }],
    ['ngõ âm', { alley: -0.01 }],
    ['ngõ rộng hơn cả nhà', { alley: 0.41 }],
    // ⚠️ Cột `yard` (Phase 22) phải bị hỏi ĐỦ BA CHIỀU như mọi cột khác. Thiếu vế "thiếu yard"
    // thì một dòng quên khai sẽ lặng lẽ chạy như cũ và cả kỷ ấy quay về tấm-mái-liền — đúng bẫy
    // `MIN_STONE` (Phase 9D) mà `blockStyle.js` đã cảnh báo ngay tại chỗ khai `BLOCK_YARD_MAX`.
    ['thiếu sân', { yard: undefined }],
    ['sân âm', { yard: -0.01 }],
    ['sân vượt trần', { yard: BLOCK_YARD_MAX + 0.01 }],
    ['storey dưới sàn', { storey: 0.79 }],
    ['storey vượt trần', { storey: 2.01 }],
    ['vary âm', { vary: -0.01 }],
    ['vary vượt trần', { vary: 0.51 }],
    ['gableToStreet không phải boolean', { gableToStreet: 'có' }],
  ];
  for (const goc of [luoi, huuCo]) {
    for (const [ten, vet] of chung) {
      assert.equal(isValidBlockStyle({ ...goc, ...vet }), false,
        `validator BỎ QUA lỗi (${goc.layout}): ${ten}`);
    }
  }
  const rieng = [
    [luoi, 'cols không nguyên', { cols: 2.5 }],
    [luoi, 'cols vượt trần', { cols: 6 }],
    [luoi, 'rows bằng 0', { rows: 0 }],
    [luoi, 'ít hơn 4 đơn vị', { cols: 1, rows: 3, attach: 'party' }],
    [luoi, 'nhiều hơn 10 đơn vị', { cols: 4, rows: 3, attach: 'party' }],
    [luoi, 'quây sân mà không đủ 3×3', { cols: 2, rows: 5, attach: 'court' }],
    // ⚠️ HAI NGUỒN SỰ THẬT CHO MỘT CON SỐ — dòng nào khai cả hai cách thì chúng sẽ trôi khỏi
    // nhau trong im lặng ngay lần đầu có ai sửa một bên.
    [luoi, 'dòng lưới mà còn khai thêm units', { units: 8 }],
    [huuCo, 'dòng hữu cơ mà còn khai thêm cols', { cols: 3 }],
    [huuCo, 'dòng hữu cơ mà còn khai thêm rows', { rows: 2 }],
    [huuCo, 'units không nguyên', { units: 5.5 }],
    [huuCo, 'units bằng 0', { units: 0 }],
    [huuCo, 'ít hơn 4 đơn vị', { units: 3 }],
    [huuCo, 'nhiều hơn 10 đơn vị', { units: 11 }],
  ];
  for (const [goc, ten, vet] of rieng) {
    assert.equal(isValidBlockStyle({ ...goc, ...vet }), false, `validator BỎ QUA lỗi: ${ten}`);
  }
  assert.equal(isValidBlockStyle(null), false);
  assert.equal(isValidBlockStyle('party'), false);
});

test('`blockUnitCount` — quây sân chỉ giữ VÀNH NGOÀI, lòng để trống làm sân', () => {
  // Dòng hữu cơ: đọc thẳng `units`, không nhân hàng với cột (không có hàng cột nào để nhân).
  assert.equal(blockUnitCount({ layout: 'organic', units: 7 }), 7);
  assert.equal(blockUnitCount({ layout: 'organic', units: 7, attach: 'court' }), 7);
  assert.equal(blockUnitCount({ layout: 'organic' }), 0);
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
  const truc = ['layout', 'attach', 'alley', 'yard', 'storey', 'vary', 'gableToStreet'];
  for (const ten of truc) {
    const khac = new Set(ERAS.map((era) => BLOCK_STYLES[era][ten]));
    assert.ok(khac.size >= 2, `trục "${ten}" chỉ có ${khac.size} giá trị — cả 15 kỷ khai như nhau`);
  }
  // ⚠️ HAI NHÓM KHAI SỐ NHÀ BẰNG HAI CÁCH, nên phải hỏi TỪNG NHÓM MỘT. Hỏi gộp thì một nhóm còn
  // sống là đủ để câu hỏi xanh, trong khi nhóm kia đã dẹt — đúng cái phễu "hỏi tổng" ở dưới.
  const luoi = ERAS.filter((era) => BLOCK_STYLES[era].layout === 'grid');
  const huuCo = ERAS.filter((era) => BLOCK_STYLES[era].layout === 'organic');
  for (const ten of ['cols', 'rows']) {
    const khac = new Set(luoi.map((era) => BLOCK_STYLES[era][ten]));
    assert.ok(khac.size >= 2, `trục "${ten}" của nhóm lưới chỉ có ${khac.size} giá trị`);
  }
  assert.ok(new Set(huuCo.map((era) => BLOCK_STYLES[era].units)).size >= 3,
    'nhóm hữu cơ khai số nhà gần như giống nhau — bảng đang dẹt ở đúng trục quan trọng nhất');
  for (const attach of BLOCK_ATTACH) {
    assert.ok(ERAS.some((era) => BLOCK_STYLES[era].attach === attach),
      `không kỷ nào dùng kiểu dính "${attach}" — hoặc bỏ nó khỏi BLOCK_ATTACH, hoặc dùng nó`);
  }
  for (const layout of BLOCK_LAYOUT) {
    assert.ok(ERAS.some((era) => BLOCK_STYLES[era].layout === layout),
      `không kỷ nào dùng bố cục "${layout}"`);
  }
});

test('`MIN_UNIT_CELLS` là MAX của HAI ngưỡng đã hiệu chuẩn, không phải một số chọn tay', () => {
  // Vế (a) mắt còn đọc ra là căn nhà · vế (b) mái còn đội được chi tiết Phase 11. Bài này khoá cả
  // hai vế CÙNG một công thức mà mã sản phẩm dùng — chép lại giá trị là "một luật hai công thức".
  //
  // ⚠️ VẾ (b) CÓ THÊM `EAVE_LAND_FACTOR` TỪ PHASE 21, và bài test phải nhập nó chứ không chép số:
  // `ROOFTOP_MIN_SPAN` là ngưỡng của MẶT MÁI còn `MIN_UNIT_CELLS` là sàn của SUẤT ĐẤT, hai đại
  // lượng khác nhau. Nhưng nhập một hằng số vào test thì test TRÔI THEO hằng số ấy (bài học
  // `MAX_COURSES` Phase 8A), nên phải kèm một TRẦN CHO CHÍNH CÁI TRẦN: hệ số phải nằm trong dải
  // đã quét, và nếu ai nâng nó lên quá 1,3 thì đó là một quyết định mới cần đo lại, không phải
  // một phép chỉnh.
  const mat = (3 * EYE_PIXELS) / CELL_PIXELS;
  const mai = ROOFTOP_MIN_SPAN * BUILDING_SCALE * EAVE_LAND_FACTOR;
  assert.equal(MIN_UNIT_CELLS, Math.max(mat, mai));
  assert.ok(mai > mat, 'vế mái không còn là vế chặt hơn — xem lại vì sao vẫn lấy MAX');
  assert.ok(EAVE_LAND_FACTOR >= 1 && EAVE_LAND_FACTOR <= 1.3,
    `hệ số ${EAVE_LAND_FACTOR} nằm ngoài dải đã quét (1,00…1,20) — phải quét lại bảng ba cột ở `
    + '`blockStyle.js` trước khi chốt, đừng chỉnh tay');
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
        // ⚠️ MIỄN TRỪ PHẢI HỎI CHÍNH KHU PHỐ, ĐỪNG HỎI SỐ CỘT. Bản trước miễn trừ khi "mọi đơn
        // vị cùng một cột" — một dấu hiệu GIÁN TIẾP, và nó chết ngay khi Phase 21 cho kỷ 1–9 bỏ
        // hàng cột (mỗi đơn vị một suất riêng ⇒ không bao giờ cùng cột ⇒ miễn trừ không bao giờ
        // áp, rồi bài test kêu oan ở đúng những ô mà mã đang xử lý ĐÚNG). Câu hỏi thật là: *cả
        // khu phố này có hẹp hơn sàn không?* — hẹp thì không phép chia nào cứu được, đó là ô
        // chật chứ không phải bộ chia chọn làm căn tí hon.
        const keep = 1 - style.alley;
        const mienRong = rong * keep < MIN_UNIT_CELLS - 1e-9;
        const mienSau = sau * keep < MIN_UNIT_CELLS - 1e-9;
        for (const u of units) {
          if (!mienRong) {
            assert.ok(u.w >= MIN_UNIT_CELLS - 1e-9,
              `kỷ ${era} ${rong}×${sau}: đơn vị rộng ${u.w.toFixed(3)} ô, hẹp hơn sàn ${MIN_UNIT_CELLS}`);
          }
          if (!mienSau) {
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
  // ⚠️ Phải lấy một dòng `grid` để ép `cols`/`rows` — kỷ 9 nay là `organic` và validator TỪ CHỐI
  // một dòng hữu cơ có `cols`, nên ép vào đó thì `deriveBlockUnits` trả mảng RỖNG và bài test này
  // sẽ đỏ vì một lý do chẳng liên quan gì tới tường chung.
  const party = deriveBlockUnits({ style: { ...BLOCK_STYLES[11], cols: 3, rows: 2 }, seed: 's', blockW: 1.6, blockD: 1.2 });
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

test('MỐC LỊCH SỬ ĐÀM RA: kỷ 1–9 KHÔNG được xếp hàng lối, kỷ 10–15 thì phải', () => {
  // ⚠️ ĐÂY LÀ BÀI TEST HAI CHIỀU, và cả hai chiều đều cần thiết. Chiều "kỷ cổ phải trượt" một
  // mình thì đạt được bằng cách làm hỏng bộ chia lưới; chiều "kỷ hiện đại phải đạt" một mình thì
  // đạt được bằng cách chẳng đổi gì cả. Chỉ có cả hai mới nói được rằng cái mốc đã áp thật:
  //
  //   > *"quy hoạch ô bàn cờ chỉ bùng nổ và trở thành chuẩn mực từ thế kỷ 19"* — Đàm
  //
  // Kỷ 10 là Anh thời công nghiệp, tức đúng thế kỷ 19, nên nó nằm ở phía `grid`.
  //
  // ⚠️ HỎI Ở MẶT BẰNG ĐỦ RỘNG. Ô chật thì phép kẹp "trần thắng sàn" bóp lưới về một hàng hoặc
  // một cột, và `laLuoiDeu` trả `false` cho CẢ kỷ hiện đại — câu trả lời khi ấy nói về ô chật,
  // không nói về bảng.
  //
  // ⚠️ CỠ NÀY VỪA PHẢI NỚI 1,6×1,2 → 2,0×1,6 Ở PHASE 22, VÀ ĐÓ KHÔNG PHẢI NỚI NGƯỠNG CHO DỄ QUA.
  // Câu tự trấn an của chính chú thích cũ — *"1,6 × 1,2 là cỡ mà cả 15 kỷ đều chia được thoải
  // mái"* — đúng khi bảng chưa có cột `yard`. Cột ấy cắt một phần CHIỀU SÂU ra làm sân/vườn, nên
  // cùng một mặt bằng nay còn ít đất cho nhà hơn, và mấy kỷ vườn sâu bị bóp lại. Đo cả bốn cỡ:
  //
  //     1,6 × 1,2   ít nhất 3 đơn vị   mốc lịch sử SAI (kỷ 12 và 15 rơi nhầm sang nhóm "cổ")
  //     1,8 × 1,4   ít nhất 3 đơn vị   mốc lịch sử SAI (y hệt)
  //   → 2,0 × 1,6   ít nhất 4 đơn vị   mốc lịch sử ĐÚNG
  //     2,2 × 1,8   ít nhất 4 đơn vị   mốc lịch sử ĐÚNG
  //
  // Chọn 2,0 × 1,6 vì đó là cỡ NHỎ NHẤT đo được mà cả hai điều kiện cùng đạt — nới thêm nữa là
  // mua chỗ trống cho một hồi quy sau này nấp vào. Và điều đáng chú ý: ở cỡ chật thì bài test
  // **kêu oan về mốc lịch sử** (kỷ 12 · 15 bị đọc thành "không hàng lối") trong khi bảng hoàn toàn
  // đúng — tức nó đang trả lời về Ô CHẬT chứ không về BẢNG, đúng thứ đoạn trên vừa cảnh báo.
  // Vế `>= 4` bên dưới là gác chạy-rỗng và KHÔNG được hạ: hạ nó là bỏ luôn cái cảnh báo ấy.
  const RONG = 2.0;
  const SAU = 1.6;
  const co = [];
  const hienDai = [];
  for (const era of ERAS) {
    const units = deriveBlockUnits({ style: BLOCK_STYLES[era], seed: `moc-${era}`, blockW: RONG, blockD: SAU });
    assert.ok(units.length >= 4, `kỷ ${era}: chỉ ra ${units.length} đơn vị ở mặt bằng rộng rãi`);
    (laLuoiDeu(units) ? hienDai : co).push(era);
  }
  assert.deepEqual(co, [1, 2, 3, 4, 5, 6, 7, 8, 9],
    'nhóm KHÔNG-hàng-lối không đúng bằng kỷ 1–9 — mốc lịch sử đã trôi');
  assert.deepEqual(hienDai, [10, 11, 12, 13, 14, 15],
    'nhóm CÓ-hàng-lối không đúng bằng kỷ 10–15 — mốc lịch sử đã trôi');
});

test('ĐỐI CHỨNG: `laLuoiDeu` phải BẮT được một cái lưới thật và THA một bố cục lệch', () => {
  // Không có bài này thì bài trên có thể xanh vì `laLuoiDeu` luôn trả `false` — lúc ấy "kỷ 1–9
  // không hàng lối" là một lời nói suông và "kỷ 10–15 có hàng lối" sẽ đỏ, nhưng nếu ai đó lỡ
  // đảo vế thì cả hai cùng xanh oan. Nhốt sẵn hai bộ dữ liệu đã biết đáp án.
  const luoi = [];
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 3; c += 1) luoi.push({ ox: c * 0.5, oz: r * 0.4, ry: 0 });
  }
  assert.equal(laLuoiDeu(luoi), true, 'lưới 3×2 đều tăm tắp mà phép đo không nhận ra');
  assert.equal(laLuoiDeu(luoi.map((u, i) => (i === 4 ? { ...u, ox: u.ox + 0.07 } : u))), false,
    'xê một đơn vị ra khỏi cột mà phép đo vẫn gọi là lưới');
  assert.equal(laLuoiDeu(luoi.map((u, i) => (i === 4 ? { ...u, ry: 0.3 } : u))), false,
    'một đơn vị quay chệch đi mà phép đo vẫn gọi là lưới');
  // Bước KHÔNG đều: ba cột ở 0 · 0,5 · 1,4.
  const lech = luoi.map((u) => (u.ox > 0.9 ? { ...u, ox: 1.4 } : u));
  assert.equal(laLuoiDeu(lech), false, 'bước cột lệch hẳn mà phép đo vẫn gọi là lưới');
  // Vành ngoài của lưới quây sân VẪN là hàng lối — đừng để kiểu `court` lọt qua như "hữu cơ".
  const vanh = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (r === 1 && c === 1) continue;
      vanh.push({ ox: c * 0.5, oz: r * 0.4, ry: 0 });
    }
  }
  assert.equal(laLuoiDeu(vanh), true, 'vành ngoài lưới 3×3 vẫn là hàng lối, phép đo phải nhận ra');
  assert.equal(laLuoiDeu([]), false);
  assert.equal(laLuoiDeu(null), false);
});

test('KỶ 1–9: các suất đất RỜI NHAU theo cấu tạo — không căn nào xuyên qua căn nào', () => {
  // Nửa "chồng lấn" của VIỆC 4. Phép chia đôi đệ quy cho các mảnh rời nhau theo cấu tạo, nên bài
  // này không thể đỏ trừ khi ai đó thay bộ chia bằng một cơ chế rải-rồi-tránh-nhau — và đó chính
  // là lúc nó cần đỏ.
  const chong = (a, b) => a.ox - a.w / 2 < b.ox + b.w / 2 - 1e-9
    && b.ox - b.w / 2 < a.ox + a.w / 2 - 1e-9
    && a.oz - a.d / 2 < b.oz + b.d / 2 - 1e-9
    && b.oz - b.d / 2 < a.oz + a.d / 2 - 1e-9;
  // ⚠️ HỎI Ở CẢ HAI CHẾ ĐỘ, và đó là chỗ Phase 22 phải sửa. Bản cũ chỉ hỏi ở MỘT mặt bằng chật
  // (1,15 × 1,05 ≈ một ô thật) và đếm được 882 cặp. Cột `yard` cắt bớt chiều sâu cho nhà, nên
  // cùng mặt bằng ấy nay chỉ ra 575 cặp — gác chạy-rỗng đỏ, trong khi mã hoàn toàn đúng.
  //
  // Cách chữa KHÔNG phải hạ 800 xuống 500 (thế là đổi một con số đoán bằng một con số đoán khác,
  // và nó sẽ đỏ lại ở phase sau). Cách chữa là hỏi ở CẢ HAI chế độ, vì chúng là hai thế giới khác
  // nhau và mỗi bên có một cách hỏng riêng:
  //   · CHẬT (1,15 × 1,05) — phép kẹp "trần thắng sàn" đang cắn, số suất đất bị bóp xuống. Đây là
  //     chế độ RỦI RO: mọi phép kẹp đều là một cơ hội để hai mảnh đè lên nhau.
  //   · RỘNG (2,0 × 1,6) — lưới đầy đủ, không kẹp. Đây là chế độ mà bộ chia chạy đúng ý đồ.
  // Đo được: chật 575 cặp · rộng 1455 cặp · **cộng lại 2030 cặp trên 810 đơn vị**. Vừa nhiều răng
  // hơn bản cũ, vừa phủ đúng cái nhánh mã mà bản cũ không bao giờ chạm tới.
  const MAT_BANG = [[1.15, 1.05], [2.0, 1.6]];
  let cap = 0;
  for (const era of ERAS) {
    for (const hat of ['a', 'b', 'c', 'd', 'e']) {
      for (const [blockW, blockD] of MAT_BANG) {
        const u = deriveBlockUnits({ style: BLOCK_STYLES[era], seed: `${era}${hat}`, blockW, blockD });
        for (let i = 0; i < u.length; i += 1) {
          for (let j = i + 1; j < u.length; j += 1) {
            cap += 1;
            assert.equal(chong(u[i], u[j]), false,
              `kỷ ${era} hạt ${hat} ở mặt bằng ${blockW}×${blockD}: đơn vị ${i} xuyên qua ${j}`);
          }
        }
      }
    }
  }
  assert.ok(cap >= 1800, `chỉ kiểm được ${cap} cặp — vòng lặp đang chạy gần rỗng (đo được 2030)`);
});
