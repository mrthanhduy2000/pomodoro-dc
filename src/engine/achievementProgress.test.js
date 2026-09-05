import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkTuNguong,
  tienDoThanhTich,
  thanhTichGanDat,
  SAN_GAN_DAT,
} from './achievementProgress.js';

test('check SINH RA từ ngưỡng khớp đúng phép so >=', () => {
  const check = checkTuNguong('sessionsCompleted', 5);
  assert.equal(check({ sessionsCompleted: 4 }), false);
  assert.equal(check({ sessionsCompleted: 5 }), true, 'đúng mốc phải là ĐẠT (>=, không phải >)');
  assert.equal(check({ sessionsCompleted: 6 }), true);
  // Ảnh chụp số liệu thiếu trường ⇒ coi như 0, KHÔNG được ném lỗi giữa màn hình Thành tích.
  assert.equal(check({}), false);
  assert.equal(check(null), false);
  assert.equal(check({ sessionsCompleted: 'bảy' }), false, 'chuỗi không phải số ⇒ 0');
});

test('tiến độ trả về null khi KHÔNG tính được — không được trả 0%', () => {
  // Một mục "0%" đọc lên như "bạn chưa làm gì"; sự thật là "chỗ này không đo được".
  assert.equal(tienDoThanhTich({ id: 'x' }, { a: 1 }), null, 'mục không khai ngưỡng');
  assert.equal(tienDoThanhTich({ dem: 'a' }, { a: 1 }), null, 'thiếu moc');
  assert.equal(tienDoThanhTich({ dem: 'a', moc: 0 }, { a: 1 }), null, 'moc = 0 thì tỉ lệ vô nghĩa');
  assert.equal(tienDoThanhTich({ dem: 'a', moc: -3 }, { a: 1 }), null);
  assert.equal(tienDoThanhTich({ dem: 'a', moc: 5 }, {}), null, 'ảnh chụp thiếu trường');
  assert.equal(tienDoThanhTich({ dem: 'a', moc: 5 }, { a: NaN }), null);
});

test('tiến độ KẸP ở 100% — không bao giờ hiện "588/365"', () => {
  const td = tienDoThanhTich({ dem: 'n', moc: 365 }, { n: 588 });
  assert.equal(td.hienTai, 365);
  assert.equal(td.tiLe, 1);
  assert.equal(td.con, 0, 'vượt mốc thì "còn" phải là 0, không phải số âm');
});

test('tiến độ tính đúng ở giữa, và "còn" là số người chơi đọc được', () => {
  const td = tienDoThanhTich({ dem: 'phut', moc: 21900 }, { phut: 21149 });
  assert.equal(td.con, 751);
  assert.equal(Math.round(td.tiLe * 100), 97);
  assert.equal(td.dem, 'phut', 'giữ tên trường để chỗ hiển thị biết đơn vị');
});

test('"gần đạt" bỏ mục ĐÃ CÓ, mục 0% và mục đã chạm mốc', () => {
  const A = [
    { id: 'da_co',  dem: 'n', moc: 10 },
    { id: 'cham',   dem: 'n', moc: 5 },   // n=8 ⇒ đã chạm mốc, chờ phiên sau chốt
    { id: 'chua',   dem: 'm', moc: 1000 }, // m=8 ⇒ 0,8% < sàn
    { id: 'gan',    dem: 'n', moc: 10 },  // 80%
  ];
  const ra = thanhTichGanDat(A, { n: 8, m: 8 }, ['da_co'], 5);
  assert.deepEqual(ra.map((r) => r.achievement.id), ['gan']);
});

test('"gần đạt" sắp gần nhất trước, hoà thì mục còn ÍT hơn đứng trước', () => {
  const A = [
    { id: 'xa',      dem: 'a', moc: 100 }, // 50%
    { id: 'gan',     dem: 'a', moc: 60 },  // 83%
    { id: 'hoa_it',  dem: 'b', moc: 10 },  // 50%, còn 5
    { id: 'hoa_nhieu', dem: 'c', moc: 1000 }, // 50%, còn 500
  ];
  const ra = thanhTichGanDat(A, { a: 50, b: 5, c: 500 }, [], 4);
  // ⚠️ Khoá THỨ TỰ ĐẦY ĐỦ, không chỉ khoá mục đứng đầu: ba mục sau đều đúng 50% nên chỉ có vế
  // "hoà thì còn ÍT hơn đứng trước" mới phân biệt được chúng. Bản đầu của bài này viết một
  // `assert.deepEqual` mà hai nhánh của ternary GIỐNG HỆT nhau — một phép so luôn đúng, đội lốt
  // một cái gác.
  assert.deepEqual(
    ra.map((r) => r.achievement.id),
    ['gan', 'hoa_it', 'xa', 'hoa_nhieu'],
  );
});

test('limit cắt đúng, và limit 0 / âm không làm nổ', () => {
  const A = Array.from({ length: 9 }, (_, i) => ({ id: `a${i}`, dem: 'n', moc: 10 + i }));
  assert.equal(thanhTichGanDat(A, { n: 9 }, [], 3).length, 3);
  assert.equal(thanhTichGanDat(A, { n: 9 }, [], 0).length, 0);
  assert.equal(thanhTichGanDat(A, { n: 9 }, [], -1).length, 0);
  assert.equal(thanhTichGanDat(null, { n: 9 }, [], 3).length, 0, 'danh sách rỗng không được ném');
});

test('SÀN là một quyết định, không phải con số tuỳ tiện', () => {
  // Ghim cả hai phía: đúng dưới sàn thì rớt, đúng sàn thì đậu. Không có vế thứ hai thì hạ sàn về 0
  // vẫn xanh, và lúc ấy màn "gần đạt" sẽ đầy những mục "còn 900/1000" — đọc y hệt "chưa bắt đầu".
  assert.equal(SAN_GAN_DAT, 0.1);
  const duoi = thanhTichGanDat([{ id: 'x', dem: 'n', moc: 1000 }], { n: 99 }, [], 3);
  assert.equal(duoi.length, 0, '9,9% phải rớt');
  const dau = thanhTichGanDat([{ id: 'x', dem: 'n', moc: 1000 }], { n: 100 }, [], 3);
  assert.equal(dau.length, 1, 'đúng 10,0% phải đậu');
});
