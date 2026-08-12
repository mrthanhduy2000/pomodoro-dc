import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGrowthMoment } from './cityMoment.js';
import { computeCityLayout } from './cityLayout.js';
import { BLUEPRINT_CATALOG } from './constants.js';

const ERA6 = BLUEPRINT_CATALOG[6].map((bp) => bp.id);
const scaffoldsFor = (pending) => computeCityLayout({ built: [], era: 6, pending }).scaffolds;

test('KHÔNG có gì đang xây ⇒ KHÔNG có khoảnh khắc nào — thà im lặng còn hơn khen rỗng', () => {
  // ⚠️ Đây là bài quan trọng nhất của cả file. Một lời chúc mừng sai MỘT lần thì mọi lời chúc mừng
  // sau đó đều mất giá — cùng nguyên tắc chống-bịa mà AI Coach đang sống bằng nó. Phiên nào thành
  // phố thật sự không nhúc nhích thì đi thẳng vào hộp thoại phần thưởng, không diễn.
  assert.equal(buildGrowthMoment({}), null);
  assert.equal(buildGrowthMoment({ newlyBuilt: [], scaffolds: [] }), null);
  assert.equal(buildGrowthMoment(), null, 'gọi không tham số cũng không được ném lỗi');
});

test('CÔNG TRÌNH VỪA XONG là tin lớn nhất — luôn thắng giàn giáo', () => {
  const moment = buildGrowthMoment({
    newlyBuilt: [ERA6[1]],
    scaffolds: scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 1 }]),
  });
  assert.equal(moment.kind, 'built');
  assert.equal(moment.bpId, ERA6[1]);
  assert.equal(moment.progress, 1);
  assert.ok(moment.detail.length > 0, 'thiếu tên công trình vừa xong');
  assert.ok(moment.icon, 'thiếu biểu tượng');
});

test('NHIỀU công trình cùng xong thì ghép tên đọc được, không phải một mảng thô', () => {
  const two = buildGrowthMoment({ newlyBuilt: [ERA6[0], ERA6[1]] });
  assert.match(two.detail, / và /, 'hai công trình phải nối bằng "và"');
  assert.match(two.headline, /Nhiều/);

  const three = buildGrowthMoment({ newlyBuilt: [ERA6[0], ERA6[1], ERA6[2]] });
  assert.match(three.detail, /, .* và /, 'ba công trình phải là "A, B và C"');
});

test('GIÀN GIÁO: chọn cái GẦN XONG NHẤT, cùng thứ tự với bảng "Đang xây"', () => {
  // Hai màn hình phải nói về CÙNG một công trình. Nếu khoảnh khắc khoe cái này còn bảng liệt kê
  // cái kia lên đầu thì Đàm sẽ tưởng app đang đếm hai thứ khác nhau.
  const moment = buildGrowthMoment({
    scaffolds: scaffoldsFor([
      { bpId: ERA6[0], sessionsRemaining: 5 },
      { bpId: ERA6[1], sessionsRemaining: 1 },
    ]),
  });
  assert.equal(moment.kind, 'scaffold');
  assert.equal(moment.bpId, ERA6[1]);
  assert.match(moment.detail, /còn 1 phiên/);
});

test('GIÀN GIÁO sắp xong (còn 0 phiên) KHÔNG được viết "còn 0 phiên"', () => {
  const moment = buildGrowthMoment({
    scaffolds: scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 0 }]),
  });
  assert.match(moment.detail, /sắp xong/);
  assert.doesNotMatch(moment.detail, /còn 0/);
});

test('tiến độ luôn nằm trong [0,1] kể cả khi dữ liệu vào hỏng', () => {
  // Tiến độ chảy thẳng vào chiều rộng một thanh CSS. Số âm hoặc >1 sẽ vẽ ra một thanh tràn khỏi
  // thẻ — hỏng theo kiểu nhìn thấy được, ngay giữa khoảnh khắc đáng lẽ phải đẹp nhất.
  for (const progress of [-3, 5, NaN, undefined, 'x']) {
    const moment = buildGrowthMoment({
      scaffolds: [{ bpId: ERA6[0], label: 'X', icon: '🏗️', remaining: 2, progress }],
    });
    assert.ok(moment.progress >= 0 && moment.progress <= 1, `tiến độ ${progress} lọt ra ngoài [0,1]`);
  }
});

test('VẠCH XUẤT PHÁT của thanh tiến độ là con số THẬT của phiên trước, không phải đoán', () => {
  // Cái thanh này sinh ra để khoe "vừa nhích thêm một nấc". Vẽ sai vạch xuất phát thì nó đang nói
  // dối về đúng thứ nó tồn tại để nói.
  const [s] = scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 2 }]);
  const total = s.total;

  const plain = buildGrowthMoment({ scaffolds: [s] });
  assert.equal(plain.progress, 1 - 2 / total);
  assert.equal(plain.fromProgress, 1 - 3 / total, 'một phiên thường = lùi đúng 1 bước');

  // Đặc quyền "Tăng tốc" đẩy THÊM 1 bước ⇒ vạch xuất phát phải lùi 2 bước.
  const fast = buildGrowthMoment({ scaffolds: [s], acceleratedIds: [ERA6[0]] });
  assert.equal(fast.fromProgress, 1 - 4 / total);
  assert.ok(fast.fromProgress < plain.fromProgress, 'tăng tốc phải cho cú nhảy DÀI hơn');

  // Đẩy nhanh công trình KHÁC thì không được ăn theo.
  const other = buildGrowthMoment({ scaffolds: [s], acceleratedIds: [ERA6[1]] });
  assert.equal(other.fromProgress, plain.fromProgress);
});

test('vạch xuất phát không bao giờ âm, và luôn ≤ vạch đích', () => {
  for (const remaining of [0, 1, 5, 99]) {
    const [s] = scaffoldsFor([{ bpId: ERA6[3], sessionsRemaining: remaining }]);
    for (const ids of [[], [ERA6[3]]]) {
      const m = buildGrowthMoment({ scaffolds: [s], acceleratedIds: ids });
      assert.ok(m.fromProgress >= 0 && m.fromProgress <= 1, 'vạch xuất phát lọt ngoài [0,1]');
      assert.ok(m.fromProgress <= m.progress, 'thanh tiến độ chạy LÙI — nhìn như vừa mất tiến độ');
    }
  }
  // Thiếu tổng số phiên (dữ liệu lạ) ⇒ chạy từ 0, không ném lỗi, không ra NaN.
  const odd = buildGrowthMoment({ scaffolds: [{ bpId: 'x', label: 'X', remaining: 1, progress: 0.5 }] });
  assert.equal(odd.fromProgress, 0);
});

test('bpId lạ bị BỎ QUA chứ không dựng một khoảnh khắc rỗng', () => {
  assert.equal(buildGrowthMoment({ newlyBuilt: ['bp_khong_ton_tai'] }), null);
  // Lẫn lộn thật/giả thì vẫn phải khoe cái thật.
  const mixed = buildGrowthMoment({ newlyBuilt: ['bp_khong_ton_tai', ERA6[2]] });
  assert.equal(mixed.bpId, ERA6[2]);
});

test('dữ liệu rác không được ném lỗi — đây là màn hình chạy NGAY SAU khi phiên xong', () => {
  // Ném lỗi ở đây là chặn mất hộp thoại phần thưởng của một phiên làm việc thật.
  for (const bad of [{ newlyBuilt: 'x', scaffolds: 'y' }, { newlyBuilt: null, scaffolds: null },
    { scaffolds: [null, undefined, {}] }]) {
    assert.doesNotThrow(() => buildGrowthMoment(bad));
  }
});
