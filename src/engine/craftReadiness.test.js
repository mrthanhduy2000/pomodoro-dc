/**
 * craftReadiness.test.js — canh luật "khởi công được ngay bây giờ không".
 * Chạy: node --test src/engine/craftReadiness.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { lyDoKhongKhoiCongDuoc, khoiCongDuoc, demKhoiCongDuoc, LY_DO, NHAN_LY_DO } from './craftReadiness.js';

const DU = {
  rawCost: { wood: 10, stone: 5 },
  refinedCost: 3,
  bookResources: { wood: 10, stone: 5 },
  refinedT2: 3,
};

test('ĐỦ SÁT NÚT VẪN LÀ ĐỦ — biên phải mở, không phải đóng', () => {
  assert.equal(lyDoKhongKhoiCongDuoc(DU), null);
  assert.equal(khoiCongDuoc(DU), true);
  // thiếu ĐÚNG một đơn vị nguyên liệu thô
  assert.equal(lyDoKhongKhoiCongDuoc({ ...DU, bookResources: { wood: 9, stone: 5 } }), LY_DO.THIEU);
  // thiếu ĐÚNG một đơn vị tinh luyện
  assert.equal(lyDoKhongKhoiCongDuoc({ ...DU, refinedT2: 2 }), LY_DO.THIEU);
});

test('HÀNG ĐỢI ĐẦY LÀ MỘT LÝ DO RIÊNG, KHÔNG GỘP VÀO "THIẾU NGUYÊN LIỆU"', () => {
  // Hai ca cần hai hành động ngược nhau: đi kiếm tài nguyên · chờ hoặc huỷ một công trình.
  const day = lyDoKhongKhoiCongDuoc({ ...DU, conOTrong: false });
  assert.equal(day, LY_DO.HANG_DOI_DAY);
  assert.notEqual(day, LY_DO.THIEU);
  assert.equal(NHAN_LY_DO[day], 'Hàng đợi đầy');
  // …và nó thắng cả khi ĐỦ nguyên liệu — vì đủ đồ mà hết ô thì vẫn không bấm được.
  assert.equal(khoiCongDuoc({ ...DU, conOTrong: false }), false);
});

test('CHÍNH BẢN VẼ NÀY ĐANG XÂY thì thắng mọi lý do khác', () => {
  assert.equal(
    lyDoKhongKhoiCongDuoc({ ...DU, dangTrongHangDoi: true, conOTrong: false, refinedT2: 0 }),
    LY_DO.DANG_XAY,
    'sự thật về CHÍNH bản vẽ này phải được nói trước sự thật về cả xưởng',
  );
});

test('KHÔNG CẦN TINH LUYỆN (refinedCost = 0) thì không bao giờ vướng vì tinh luyện', () => {
  assert.equal(khoiCongDuoc({ ...DU, refinedCost: 0, refinedT2: 0 }), true);
});

test('THIẾU HẲN MỘT LOẠI NGUYÊN LIỆU (không có khoá) tính là THIẾU, không phải là 0 cần 0', () => {
  assert.equal(lyDoKhongKhoiCongDuoc({ ...DU, bookResources: { wood: 10 } }), LY_DO.THIEU);
});

test('demKhoiCongDuoc CHỈ ĐẾM THỨ BẤM ĐƯỢC NGAY — đây là con số dải mở đầu phải dùng', () => {
  const n = demKhoiCongDuoc([
    DU,                                   // được
    { ...DU, refinedT2: 0 },              // thiếu
    { ...DU, conOTrong: false },          // hàng đợi đầy
    { ...DU, dangTrongHangDoi: true },    // đang xây
    { ...DU, bookResources: { wood: 99, stone: 99 }, refinedT2: 99 }, // được
  ]);
  assert.equal(n, 2);
  assert.equal(demKhoiCongDuoc(), 0);
});

test('KHÔNG TRUYỀN GÌ ⇒ khởi công được (không có khoản nào phải trả), không ném', () => {
  assert.equal(lyDoKhongKhoiCongDuoc(), null);
});
