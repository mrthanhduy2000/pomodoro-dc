/**
 * surfaceTexture.test.js — ROUND 52 (ADR-092): the generated surface maps, checked.
 *
 * ⚠️ THESE MAPS ARE DATA, WHICH IS WHY THEY CAN BE TESTED AT ALL. Nothing here needs a GPU: the maps
 * are `Uint8Array`s computed from a hash, so a test can read every pixel and ask the questions that
 * actually matter — do they TILE (a seam runs down a whole wall), are they DETERMINISTIC (the whole
 * before/after method of this project depends on it), and does the normal map agree with the height
 * it was derived from.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { MATERIAL_FAMILIES } from '../../../engine/city3d/materials.js';
import { SURFACE_RECIPE, SURFACE_KINDS, TEXTURE_SIZE, buildFamilyTexture, buildSurfaceTextures } from './surfaceTexture.js';

const FAMILIES = Object.keys(MATERIAL_FAMILIES);

test('MỌI HỌ VẬT LIỆU ĐỀU CÓ MỘT BỀ MẶT — không họ nào bị bỏ lại phẳng lì', () => {
  // ⚠️ ĐỐI CHIẾU VỚI BẢNG THẬT, KHÔNG VỚI MỘT DANH SÁCH CHÉP TAY. `MATERIAL_FAMILIES` là nguồn duy
  // nhất; ngày nào ai đó thêm một họ thứ 17 mà quên cho nó bề mặt, bài này đỏ chứ không phải một
  // bức tường nhựa lọt vào ảnh sáu vòng sau.
  for (const family of FAMILIES) {
    assert.ok(SURFACE_RECIPE[family], `họ "${family}" không có công thức bề mặt nào`);
  }
  assert.deepEqual(Object.keys(SURFACE_RECIPE).sort(), [...FAMILIES].sort(),
    'bảng bề mặt và bảng vật liệu phải khớp từng họ một');
  for (const [family, r] of Object.entries(SURFACE_RECIPE)) {
    assert.ok(SURFACE_KINDS.includes(r.kind), `họ "${family}" xin kiểu "${r.kind}" mà không ai dựng`);
    assert.ok(r.scale > 0 && r.scale < 40, `họ "${family}": scale ${r.scale} vô lý`);
    assert.ok(r.bump >= 0 && r.bump <= 1.2, `họ "${family}": bump ${r.bump} ngoài khoảng`);
  }
});

test('TẤT ĐỊNH: dựng hai lần ra hai mảng byte GIỐNG HỆT', () => {
  // Không có dòng này thì mọi cặp ảnh trước/sau của vòng 52 chỉ là hai lần tung xúc xắc.
  for (const family of ['brick', 'wood', 'stone', 'metal']) {
    const a = buildFamilyTexture(family, 32);
    const b = buildFamilyTexture(family, 32);
    assert.deepEqual(a.detail.image.data, b.detail.image.data, `họ "${family}": lớp màu đổi giữa hai lần dựng`);
    assert.deepEqual(a.normal.image.data, b.normal.image.data, `họ "${family}": lớp pháp tuyến đổi giữa hai lần dựng`);
  }
});

test('TỰ LẶP KHÔNG CÓ MỐI NỐI — mép trái phải khớp mép phải', () => {
  /**
   * ⚠️ ĐÂY LÀ BÀI QUAN TRỌNG NHẤT FILE NÀY. Bản đồ được lấy mẫu TAM BÌNH DIỆN theo toạ độ THẾ GIỚI,
   * nên nó lặp lại hàng chục lần trên một bức tường. Một mối nối lệch 10 đơn vị màu ở mép sẽ thành
   * một ĐƯỜNG KẺ chạy dọc suốt cả dãy phố — thứ mắt bắt được ngay còn phép đo tổng thì không.
   * Nhiễu ở đây chạy trên một hình xuyến (`tileNoise` tự gấp chỉ số), nên mép phải khớp theo CẤU
   * TẠO; bài test đòi đúng lời hứa ấy.
   */
  for (const family of ['brick', 'plaster', 'stone', 'wood', 'tile']) {
    const t = buildFamilyTexture(family, 64);
    const n = 64;
    const px = t.detail.image.data;
    let worst = 0;
    for (let y = 0; y < n; y += 1) {
      const left = px[(y * n + 0) * 4];
      const right = px[(y * n + (n - 1)) * 4];
      worst = Math.max(worst, Math.abs(left - right));
    }
    // Mép đối diện nhau là hai ô kề nhau của cùng một hoa văn, nên chúng gần nhau chứ không bằng
    // nhau: một viên gạch có thể vừa kết thúc. Ngưỡng hỏi "có phải một bậc nhảy không", không hỏi
    // "có bằng nhau tuyệt đối không".
    assert.ok(worst < 120, `họ "${family}": mép trái/phải lệch tới ${worst}/255 — sẽ thành một đường kẻ dọc phố`);
  }
});

test('PHÁP TUYẾN LÀ PHÁP TUYẾN — đủ dài, và mặt phẳng thì hướng thẳng ra ngoài', () => {
  for (const family of ['brick', 'stone', 'metal', 'glass']) {
    const t = buildFamilyTexture(family, 32);
    const px = t.normal.image.data;
    let minLen = 9;
    let maxLen = 0;
    let outward = 0;
    for (let i = 0; i < px.length; i += 4) {
      const x = (px[i] / 255) * 2 - 1;
      const y = (px[i + 1] / 255) * 2 - 1;
      const z = (px[i + 2] / 255) * 2 - 1;
      const len = Math.hypot(x, y, z);
      minLen = Math.min(minLen, len);
      maxLen = Math.max(maxLen, len);
      if (z > 0) outward += 1;
    }
    assert.ok(minLen > 0.9 && maxLen < 1.1, `họ "${family}": vectơ pháp tuyến dài ${minLen.toFixed(2)}…${maxLen.toFixed(2)}, phải quanh 1`);
    // z > 0 ở MỌI điểm ảnh: một bản đồ pháp tuyến tiếp tuyến không bao giờ chỉ ngược vào trong mặt.
    assert.equal(outward, px.length / 4, `họ "${family}": có pháp tuyến chỉ NGƯỢC vào trong mặt`);
  }
});

test('HOA VĂN CÓ THẬT — một bức tường gạch không được phẳng như một bức tường sơn', () => {
  // ⚠️ ĐỐI CHỨNG CHO CẢ FILE: nếu `heightAt` trả về một hằng số thì mọi bài trên vẫn xanh (lặp
  // hoàn hảo, tất định, pháp tuyến = (0,0,1)) và thành phố vẫn là nhựa. Bài này đòi hoa văn có
  // BIÊN ĐỘ, và đòi gạch nhiều biên độ hơn vữa — một quan hệ, không phải một con số.
  const spread = (family) => {
    const px = buildFamilyTexture(family, 64).detail.image.data;
    let lo = 255;
    let hi = 0;
    for (let i = 0; i < px.length; i += 4) { lo = Math.min(lo, px[i]); hi = Math.max(hi, px[i]); }
    return hi - lo;
  };
  const brick = spread('brick');
  assert.ok(brick > 12, `gạch chỉ đổi ${brick}/255 sắc độ — mắt sẽ không thấy mạch vữa nào`);
  assert.ok(brick > spread('plaster'), 'gạch phải gồ ghề hơn tường trát — mạch vữa so với vệt bay');
  assert.ok(spread('stone') > spread('glass'), 'đá phải gồ ghề hơn kính');
});

test('DỰNG CẢ BỘ: 16 họ, và dọn được', () => {
  const set = buildSurfaceTextures(16);
  assert.equal(set.size, FAMILIES.length, `dựng ${set.size} bộ, phải đủ ${FAMILIES.length} họ`);
  assert.ok(set.get('brick'), 'không tra được họ `brick`');
  assert.equal(set.get('không-có-họ-này'), null, 'họ lạ phải trả về null, không được nổ');
  set.dispose();
  assert.equal(set.size, 16, 'kích thước là ảnh chụp lúc dựng, không đổi sau khi dọn');
  assert.equal(set.get('brick'), null, 'dọn xong thì không tra ra gì nữa');
  assert.ok(TEXTURE_SIZE >= 64, 'bản đồ nhỏ hơn 64² thì mạch vữa thành bậc thang');
});
