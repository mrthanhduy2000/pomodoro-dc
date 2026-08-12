import test from 'node:test';
import assert from 'node:assert/strict';

import { pickNearest, placeBounds, rayBoxDistance, specBounds } from './pick.js';
import { prism } from './parts.js';
import { buildBuildingSpec } from './buildingSpec.js';

const box = (minX, maxX, minY, maxY, minZ, maxZ) => ({ minX, maxX, minY, maxY, minZ, maxZ });
const UNIT = box(-0.5, 0.5, 0, 1, -0.5, 0.5);

test('hộp bao ôm đúng khối — `y` là ĐÁY chứ không phải tâm', () => {
  // ⚠️ Nhầm chỗ này là kiểu sai không ai nhìn ra: hộp bao lệch xuống nửa chiều cao, cú chạm vào
  // nóc nhà thành ra trượt còn chạm vào mặt đất trước nhà lại trúng. Quy ước "y là đáy" đến từ
  // `parts.js` và cả bộ vẽ đang dựa vào nó.
  const bounds = specBounds([prism({ x: 0, y: 0, z: 0, w: 2, d: 4, h: 3 })]);
  assert.deepEqual(bounds, box(-1, 1, 0, 3, -2, 2));
});

test('hộp bao gộp NHIỀU khối, kể cả khối nhô ra ngoài thân', () => {
  const bounds = specBounds([
    prism({ x: 0, y: 0, z: 0, w: 2, h: 2 }),
    prism({ x: 3, y: 1, z: 0, w: 1, h: 1 }),   // cái mái đua ra bên phải
  ]);
  assert.equal(bounds.maxX, 3.5);
  assert.equal(bounds.maxY, 2);
  assert.equal(bounds.minY, 0);
});

test('dữ liệu hình học rác không được sinh ra NaN', () => {
  // NaN lọt vào hộp bao thì mọi phép so đều trả `false` một cách im lặng: cú chạm không bao giờ
  // trúng, và không có lỗi nào hiện ra để truy.
  const bounds = specBounds([
    null,
    { x: NaN, y: undefined, z: 'x', w: -5, h: NaN },
    prism({ x: 0, y: 0, z: 0, w: 2, h: 2 }),
  ]);
  for (const value of Object.values(bounds)) assert.ok(Number.isFinite(value), 'hộp bao có NaN');
  assert.equal(specBounds([]), null, 'không có khối nào thì phải trả null, không phải hộp vô cực');
  assert.equal(specBounds('rác'), null);
});

test('nhận CẢ mảng khối trần lẫn object `{ parts }` do hai hàm dựng hình trả về', () => {
  // ⚠️ `buildBuildingSpec` trả `{ parts, height, span, triangles }` chứ không trả mảng. Đưa nhầm
  // object vào một hàm chỉ nhận mảng thì KHÔNG có lỗi nào ném ra — chỉ trả `null`, và cả tính năng
  // chạm im lặng không hoạt động ở đúng nơi khó ngờ nhất. Đã dính thật một lần lúc viết test này.
  const parts = [prism({ x: 0, y: 0, z: 0, w: 2, h: 2 })];
  assert.deepEqual(specBounds({ parts, height: 2, span: 2 }), specBounds(parts));
});

test('tia bắn thẳng vào hộp thì trúng, bắn ra ngoài thì trượt', () => {
  const from = { x: 0, y: 0.5, z: 5 };
  assert.equal(rayBoxDistance(from, { x: 0, y: 0, z: -1 }, UNIT), 4.5);
  assert.equal(rayBoxDistance(from, { x: 0, y: 0, z: 1 }, UNIT), null, 'bắn ra xa mà vẫn trúng');
  assert.equal(rayBoxDistance({ x: 9, y: 0.5, z: 5 }, { x: 0, y: 0, z: -1 }, UNIT), null);
});

test('hộp nằm SAU LƯNG camera thì không được tính là trúng', () => {
  // Xoay camera qua bên kia thành phố là lúc lỗi này lộ ra: chạm vào khoảng trời trống lại chọn
  // trúng một công trình nằm sau gáy.
  const t = rayBoxDistance({ x: 0, y: 0.5, z: -5 }, { x: 0, y: 0, z: -1 }, UNIT);
  assert.equal(t, null);
});

test('camera ĐỨNG TRONG hộp thì vẫn tính là trúng (khoảng cách 0)', () => {
  assert.equal(rayBoxDistance({ x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: -1 }, UNIT), 0);
});

test('tia song song với một trục: nằm trong dải thì trúng, ngoài dải thì trượt', () => {
  // ⚠️ Đây là ca sinh ra `0/0 = NaN` nếu viết ẩu. NaN làm mọi phép so ra `false`, và kết quả là
  // "chạm không bao giờ trúng" ở đúng những góc camera nhất định — cực khó truy.
  assert.equal(rayBoxDistance({ x: 0, y: 0, z: 5 }, { x: 0, y: 0, z: -1 }, UNIT), 4.5,
    'tia đi đúng trên mặt đáy hộp');
  assert.equal(rayBoxDistance({ x: 0, y: 9, z: 5 }, { x: 0, y: 0, z: -1 }, UNIT), null,
    'tia bay cao hơn nóc hộp mà vẫn báo trúng');
});

test('hướng KHÔNG chuẩn hoá vẫn cho cùng một lựa chọn', () => {
  // Bên gọi lấy hướng từ camera; bắt nhớ chuẩn hoá là một cái bẫy đặt sẵn cho phiên sau.
  const from = { x: 0, y: 0.5, z: 5 };
  const a = rayBoxDistance(from, { x: 0, y: 0, z: -1 }, UNIT);
  const b = rayBoxDistance(from, { x: 0, y: 0, z: -7 }, UNIT);
  assert.equal(a, 4.5);
  assert.equal(b, 4.5 / 7, 'khoảng cách theo tham số t, tỉ lệ với độ dài vector hướng');
});

test('chọn công trình GẦN CAMERA NHẤT, không phải cái đầu danh sách', () => {
  // Cả nửa thành phố nằm trên cùng một đường ngắm. Chọn nhầm cái đằng sau nghĩa là chạm vào nhà
  // này lại mở ra thông tin nhà khác — hỏng theo kiểu người dùng nghĩ là app bịa.
  const far = { id: 'xa', box: box(-0.5, 0.5, 0, 1, -10.5, -9.5) };
  const near = { id: 'gần', box: box(-0.5, 0.5, 0, 1, -0.5, 0.5) };
  const hit = pickNearest({ origin: { x: 0, y: 0.5, z: 5 }, direction: { x: 0, y: 0, z: -1 } }, [far, near]);
  assert.equal(hit.id, 'gần');
  assert.equal(hit.distance, 4.5);

  // Đảo thứ tự đầu vào không được đổi kết quả.
  const again = pickNearest({ origin: { x: 0, y: 0.5, z: 5 }, direction: { x: 0, y: 0, z: -1 } }, [near, far]);
  assert.equal(again.id, 'gần');
});

test('chạm vào chỗ trống thì KHÔNG chọn bừa cái nào', () => {
  // Thà không chọn gì còn hơn chọn đại — chạm vào bầu trời mà bật lên một thẻ thông tin thì Đàm
  // sẽ không bao giờ tin cú chạm nữa.
  const hit = pickNearest(
    { origin: { x: 0, y: 0.5, z: 5 }, direction: { x: 1, y: 0, z: 0 } },
    [{ id: 'a', box: UNIT }],
  );
  assert.equal(hit, null);
  assert.equal(pickNearest(null, [{ id: 'a', box: UNIT }]), null, 'tia rác');
  assert.equal(pickNearest({ origin: {}, direction: {} }, null), null, 'danh sách rác');
});

test('placeBounds: dời + nhân tỉ lệ + nới vùng chạm', () => {
  const placed = placeBounds(UNIT, { x: 10, z: -4, scale: 2, pad: 0.25 });
  assert.equal(placed.minX, 10 - 1 - 0.25);
  assert.equal(placed.maxX, 10 + 1 + 0.25);
  assert.equal(placed.minY, -0.25);
  assert.equal(placed.maxY, 2 + 0.25);
  assert.equal(placed.minZ, -4 - 1 - 0.25);
  assert.equal(placed.maxZ, -4 + 1 + 0.25);
  assert.equal(placeBounds(null, {}), null);
});

test('CÔNG TRÌNH THẬT của cả 15 kỷ đều có hộp chạm dùng được', () => {
  // Bài này bắt cái ca "một kỷ nào đó sinh hình theo cách khác nên hộp bao rỗng" — chạm vào nhà
  // của đúng kỷ đó thì không có gì xảy ra, mà 14 kỷ kia vẫn tốt nên rất dễ tưởng là mình bấm hụt.
  for (let era = 1; era <= 15; era += 1) {
    for (const level of [1, 3]) {
      const spec = buildBuildingSpec({ bpId: `bp_test_${era}`, era, level });
      const bounds = specBounds(spec);
      assert.ok(bounds, `kỷ ${era} cấp ${level} không có hộp chạm`);
      assert.ok(bounds.maxY - bounds.minY > 0.2, `kỷ ${era} cấp ${level} hộp chạm dẹt lép`);
      assert.ok(bounds.maxX - bounds.minX > 0.2, `kỷ ${era} cấp ${level} hộp chạm mỏng dính`);
      // Nhà đứng TRÊN mặt đất: đáy không được chìm sâu xuống dưới.
      assert.ok(bounds.minY > -0.5, `kỷ ${era} cấp ${level} có đáy chìm dưới đất (${bounds.minY})`);
    }
  }
});
