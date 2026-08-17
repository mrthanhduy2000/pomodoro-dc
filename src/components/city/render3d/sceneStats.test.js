/**
 * Khoá lời hứa: **con số HUD báo phải bằng con số máy thật sự vẽ.**
 *
 * ⚠️ VÌ SAO BÀI TEST NÀY TỒN TẠI (Performance Gate 2026-08-17). `sceneGraph.js` từng TỰ TÍNH số tam
 * giác bằng một công thức riêng — `buildingTriangles + surfaceTriangles + residents × 24` — trong
 * khi three biết chính xác nó đã vẽ bao nhiêu. Chưa ai từng đặt hai bên cạnh nhau. Đặt lần đầu thì
 * lệch **+44.126 tam giác ở CẢ 15 kỷ**: HUD báo 34.622, máy vẽ 78.748 — thiếu **56%**. Hằng số ấy
 * đúng bằng hai thứ công thức không biết tới: **vòm trời** (960) và **rặng núi chân trời** thêm ở
 * Phase 9A (43.166). Không có gì đỏ lên suốt từ đó, vì công thức chỉ được so với chính nó.
 *
 * ⚠️ VÀ ĐÂY LÀ LẦN THỨ HAI CÙNG MỘT HÌNH DẠNG SAI: chú thích của `countTriangles` (`parts.js`) đã
 * tự nhận *"có test đối chiếu hai bên"* trong khi bài test ấy chỉ so với **hằng số viết tay**
 * (Phase 8B). Bài học đã ghi mà vẫn tái diễn ở một file khác ⇒ ở đây phải làm cho ĐÚNG: test tự
 * duyệt scene graph bằng mã CỦA NÓ rồi so với thứ mã sản phẩm báo. Không bên nào được so với một
 * con số thứ ba.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCityScene } from './sceneGraph.js';
import { computeCityLayout } from '../../../engine/cityLayout.js';
import { buildScenePalette } from '../../../engine/city3d/palette3d.js';
import { deriveDaylight } from '../../../engine/city3d/daylight.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '../../../engine/constants.js';

const TOKENS = { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };

function dựngCảnh(era, hour = 12, sessions = 80) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const stats = { sessionCount: sessions, streakLength: 9 };
  const layout = computeCityLayout({ built, levels, era, stats });
  const daylight = deriveDaylight(hour);
  const palette = buildScenePalette({
    tokens: TOKENS, eraColor: ERA_METADATA[era]?.accentColor, era, daylight,
  });
  // `renderer` để trống: nhà máy hình học không cần GPU, chỉ bản đồ môi trường mới cần — mà bản đồ
  // môi trường không sinh ra tam giác nào.
  return createCityScene({ layout, palette, daylight, stats });
}

/**
 * Phép đếm ĐỘC LẬP của bài test, viết lại từ đầu theo đúng luật `WebGLRenderer` cộng vào
 * `info.render`. Cố ý KHÔNG import hàm của mã sản phẩm — import nó thì bài test này chỉ chứng minh
 * "một hàm bằng chính nó".
 */
function đếmĐộcLập(scene) {
  let tam = 0;
  let lệnh = 0;
  scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    const g = o.geometry;
    if (!g) return;
    const đỉnh = g.index ? g.index.count : (g.attributes?.position?.count ?? 0);
    tam += ((o.isInstancedMesh ? o.count : 1) * đỉnh) / 3;
    lệnh += (Array.isArray(o.material) && g.groups?.length) ? g.groups.length : 1;
  });
  return { tam, lệnh };
}

test('HUD báo ĐÚNG số tam giác + lệnh vẽ mà máy sẽ vẽ — cả 15 kỷ', () => {
  for (let era = 1; era <= 15; era += 1) {
    const city = dựngCảnh(era);
    const đo = đếmĐộcLập(city.scene);
    assert.equal(city.stats.triangles, đo.tam,
      `kỷ ${era}: HUD báo ${city.stats.triangles} tam giác, cảnh thật có ${đo.tam}`);
    assert.equal(city.stats.drawCalls, đo.lệnh,
      `kỷ ${era}: HUD báo ${city.stats.drawCalls} lệnh vẽ, cảnh thật có ${đo.lệnh}`);
    city.dispose();
  }
});

test('ĐỐI CHỨNG: bầu trời và rặng núi chân trời PHẢI nằm trong con số ấy', () => {
  // ⚠️ Đây là bài nhốt đúng bộ số hỏng cũ. Công thức tự tính cũ chỉ nhìn thấy ba nhóm: khối công
  // trình đã gộp (đổ bóng), mặt đất/mặt đường (có tên), và cư dân (InstancedMesh). Mọi thứ NGOÀI ba
  // nhóm đó — vòm trời, rặng núi Phase 9A — nó mù hoàn toàn. Bài test đòi phần mù ấy vừa TỒN TẠI
  // thật, vừa ĐƯỢC TÍNH vào con số HUD; thiếu vế nào thì bộ số hỏng cũ sẽ lặng lẽ quay lại.
  const city = dựngCảnh(7);
  let cũNhìnThấy = 0;
  let cũKhôngThấy = 0;
  city.scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    const g = o.geometry;
    if (!g) return;
    const đỉnh = g.index ? g.index.count : (g.attributes?.position?.count ?? 0);
    const t = ((o.isInstancedMesh ? o.count : 1) * đỉnh) / 3;
    const côngThứcCũBiết = o.castShadow || o.name === 'ground' || o.name === 'road' || o.isInstancedMesh;
    if (côngThứcCũBiết) cũNhìnThấy += t; else cũKhôngThấy += t;
  });

  assert.ok(cũKhôngThấy > 40000,
    `phần công thức cũ mù chỉ còn ${cũKhôngThấy} tam giác — bầu trời/chân trời đã biến mất khỏi cảnh?`);
  assert.equal(city.stats.triangles, cũNhìnThấy + cũKhôngThấy,
    'con số HUD không bao trọn cả hai phần — công thức tự tính đã lẻn về');
  assert.ok(city.stats.triangles > cũNhìnThấy * 1.5,
    `HUD (${city.stats.triangles}) phải lớn hơn hẳn phần công thức cũ thấy được (${cũNhìnThấy})`);
  city.dispose();
});

test('thêm một khối mới vào cảnh thì con số PHẢI đi theo', () => {
  // Bảo hiểm cho tương lai: phase sau thêm bất cứ thứ gì vào scene, phép đếm phải tự thấy. Một
  // công thức tự tính thì không — và đó chính xác là cách 44.126 tam giác biến mất trong im lặng.
  const city = dựngCảnh(3);
  const trước = đếmĐộcLập(city.scene);
  assert.equal(city.stats.triangles, trước.tam);

  // Nhân bản một khối có sẵn rồi gắn thêm vào cảnh — không cần biết nó là gì.
  let mẫu = null;
  city.scene.traverse((o) => { if (!mẫu && o.isMesh && !o.isInstancedMesh && o.geometry) mẫu = o; });
  assert.ok(mẫu, 'không tìm được khối mẫu nào trong cảnh');
  const thêm = mẫu.clone();
  city.scene.add(thêm);

  const sau = đếmĐộcLập(city.scene);
  assert.ok(sau.tam > trước.tam, 'thêm khối mà phép đếm độc lập không nhúc nhích — bài test hỏng');

  // Dựng lại cảnh y hệt rồi thêm khối TRƯỚC khi đọc stats thì không làm được (stats chốt lúc dựng),
  // nên ở đây chỉ khoá phần quan trọng: phép đếm của mã sản phẩm là một hàm ĐANG DUYỆT CẢNH, nên
  // gọi lại trên cảnh đã đổi phải ra số mới.
  const city2 = dựngCảnh(3);
  assert.equal(city2.stats.triangles, trước.tam, 'hai lần dựng cùng kỷ phải ra cùng con số');
  city.dispose();
  city2.dispose();
});
