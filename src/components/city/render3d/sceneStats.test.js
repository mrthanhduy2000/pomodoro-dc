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
import { Frustum, Matrix4, PerspectiveCamera } from 'three';

import {
  createCityScene, cellToWorld, NHOM_TACH_THANH_PHO, NHOM_TACH_MAT_DAT,
} from './sceneGraph.js';
import { deriveOutskirts } from '../../../engine/city3d/outskirts.js';
import { computeCityLayout } from '../../../engine/cityLayout.js';
import { buildScenePalette } from '../../../engine/city3d/palette3d.js';
import { deriveDaylight } from '../../../engine/city3d/daylight.js';
import { CITY_CAMERA_FOV, cityOrbitOptions, createOrbit } from '../../../engine/city3d/orbit.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from '../../../engine/constants.js';

const TOKENS = { canvas2: '#f4f2ec', ink: '#1f1e1d', line: '#e8e6de', accent: '#c96442' };

/** MỘT đường dựng tham số cho cả file — bài nào cần `layout` thì lấy từ đây, đừng dựng lại. */
function thamSố(era, hour = 12, sessions = 80) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const stats = { sessionCount: sessions, streakLength: 9 };
  const layout = computeCityLayout({ built, levels, era, stats });
  const daylight = deriveDaylight(hour);
  const palette = buildScenePalette({
    tokens: TOKENS, eraColor: ERA_METADATA[era]?.accentColor, era, daylight,
  });
  return { layout, palette, daylight, stats };
}

function dựngCảnh(era, hour = 12, sessions = 80) {
  // `renderer` để trống: nhà máy hình học không cần GPU, chỉ bản đồ môi trường mới cần — mà bản đồ
  // môi trường không sinh ra tam giác nào.
  return createCityScene(thamSố(era, hour, sessions));
}

/**
 * Phép đếm ĐỘC LẬP của bài test, viết lại từ đầu theo đúng luật `WebGLRenderer` cộng vào
 * `info.render`. Cố ý KHÔNG import hàm của mã sản phẩm — import nó thì bài test này chỉ chứng minh
 * "một hàm bằng chính nó".
 */
function đếmĐộcLập(scene, khungNhìn = null) {
  let tam = 0;
  let lệnh = 0;
  scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    const g = o.geometry;
    if (!g) return;
    // Luật cắt của `WebGLRenderer.projectObject`: bỏ qua khối có `frustumCulled` mà hộp bao của nó
    // không giao với khung nhìn. Truyền `khungNhìn = null` là đếm TRONG CẢNH (không cắt gì).
    if (khungNhìn && o.frustumCulled && !khungNhìn.intersectsObject(o)) return;
    const đỉnh = g.index ? g.index.count : (g.attributes?.position?.count ?? 0);
    tam += ((o.isInstancedMesh ? o.count : 1) * đỉnh) / 3;
    lệnh += (Array.isArray(o.material) && g.groups?.length) ? g.groups.length : 1;
  });
  return { tam, lệnh };
}

/**
 * Dựng ĐÚNG camera mà `CityScene3D.jsx` dựng, rồi trả về khung nhìn của nó.
 * `zoom` mô phỏng cờ `--zoom` của `city-preview.mjs` (nhân vào `distance`, xem dòng
 * `distance: orbitOptions.distance * ZOOM`) — 1 là khung mặc định, 0,4 là đóng sát.
 */
function khungNhìnCủa(scene, layout, zoom = 1) {
  const opts = cityOrbitOptions(layout.gridSize, layout.era);
  const orbit = createOrbit({ ...opts, distance: opts.distance * zoom });
  const eye = orbit.getPosition();
  const target = orbit.getTarget();
  // Tỉ lệ khung 1 : 0,62 — đúng mặc định của `resize()` trong `CityScene3D.jsx`.
  const camera = new PerspectiveCamera(CITY_CAMERA_FOV, 1 / 0.62, 0.5, layout.gridSize * 8);
  camera.position.set(eye.x, eye.y, eye.z);
  camera.lookAt(target.x, target.y, target.z);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  scene.updateMatrixWorld(true);
  return new Frustum().setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
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
  const đo = (era) => {
    const c = dựngCảnh(era);
    let thấy = 0;
    let mù = 0;
    const tên = new Set();
    c.scene.traverse((o) => {
      if (!o.isMesh || o.visible === false) return;
      const g = o.geometry;
      if (!g) return;
      const đỉnh = g.index ? g.index.count : (g.attributes?.position?.count ?? 0);
      const t = ((o.isInstancedMesh ? o.count : 1) * đỉnh) / 3;
      const cũBiết = o.castShadow || o.name === 'ground' || o.name === 'road' || o.isInstancedMesh;
      if (cũBiết) thấy += t;
      else { mù += t; tên.add(o.name || '(không tên)'); }
    });
    return { c, thấy, mù, tên: [...tên].sort() };
  };
  const ướt = đo(7);
  const khô = đo(1);
  const city = ướt.c;
  const cũNhìnThấy = ướt.thấy;
  const cũKhôngThấy = ướt.mù;
  const tênPhầnMù = new Set(ướt.tên);

  assert.ok(cũKhôngThấy > 40000,
    `phần công thức cũ mù chỉ còn ${cũKhôngThấy} tam giác — bầu trời/chân trời đã biến mất khỏi cảnh?`);
  assert.equal(city.stats.triangles, cũNhìnThấy + cũKhôngThấy,
    'con số HUD không bao trọn cả hai phần — công thức tự tính đã lẻn về');
  /**
   * ⚠️ HỎI **PHẦN MÙ LÀ NHỮNG AI**, KHÔNG HỎI "phần mù chiếm bao nhiêu phần trăm".
   *
   * Bản trước viết `HUD > cũNhìnThấy × 1,5`, và nó ĐỎ vào ngày thành phố có thêm cây cối vùng quê —
   * tức mẫu số phình ra, trong khi thứ bài test này canh (HUD có đếm cả vòm trời + rặng núi không)
   * hoàn toàn không đổi. Một phép đo GIÀ ĐI, đúng họ với `assert.equal(seen.size, 4)` ở Phase 7C và
   * ngưỡng `|x| > 0,5` lọc tháp góc ở Phase 5B. Nó cũng chẳng thêm thông tin gì: hai dòng ngay trên
   * đã ép `HUD ≥ cũNhìnThấy + 40000` rồi.
   *
   * Thứ đáng canh mà chưa ai canh là **danh tính** của phần mù: nếu ngày nào một khối THÀNH PHỐ rơi
   * vào nhóm mù (ví dụ ai đó tắt `castShadow` của khối gộp) thì `cũKhôngThấy` vẫn > 40000, tổng vẫn
   * khớp, và bài test cũ vẫn xanh — trong khi bộ số hỏng cũ đã lẻn về đúng một nửa.
   */
  /**
   * ⚠️ BƯỚC C (2026-08-20) — `water` NHẬP NHÓM MÙ, VÀ ĐÓ LÀ ĐÚNG. Tấm nước là một mặt phẳng nằm
   * ngang: nó KHÔNG đổ bóng (một mặt phẳng đổ bóng lên chính mặt đất ngay dưới nó là một mảng đen
   * vô nghĩa), không tên `ground`/`road`, không phải khối lặp ⇒ công thức cũ mù với nó.
   * ⚠️ Nhưng nó KHÔNG phải phông nền: nó không mang nhãn `SCENE_LAYER_BACKDROP`, nên trong phép
   * chia ba con số nó nằm ở phía **thành phố**, đứng cùng chỗ với `ground` và `road`. Đó là chỗ
   * đúng, vì lý do sinh ra phép chia ấy là *"phần nào KHÔNG ĐỔI qua các kỷ thì phải tách ra"* —
   * vòm trời và rặng núi là hằng số ở cả 15 kỷ, còn mặt nước thì có ở 14 kỷ và mỗi kỷ một hình.
   *
   * Và để câu trên không phải một lời khẳng định suông: đo CẢ HAI phía, kỷ 7 (có nước) và kỷ 1
   * (kỷ khô DUY NHẤT). Hai danh sách phải khác nhau ĐÚNG một cái tên. Thiếu vế thứ hai thì ngày
   * nào ai đó cho mọi kỷ dựng nước (kể cả kỷ khô) sẽ không có gì đỏ lên.
   */
  assert.deepEqual([...tênPhầnMù].sort(), ['horizon', 'sky', 'water'],
    'phần mà công thức cũ mù phải ĐÚNG BẰNG vòm trời + rặng núi + mặt nước, không hơn không kém');
  assert.deepEqual(khô.tên, ['horizon', 'sky'],
    'kỷ 1 là kỷ khô duy nhất — nó KHÔNG được có khối `water` nào, đó là +1 lệnh vẽ không ai trả');
  city.dispose();
  khô.c.dispose();
});

test('BA con số: thành phố + nền = tổng, và phần nền tách theo NGUỒN GỐC chứ không theo ngưỡng', () => {
  // ⚠️ VÌ SAO BÀI NÀY TỒN TẠI (Performance Gate vòng 2). Con số TỔNG đúng cho câu "GPU vẽ bao
  // nhiêu", nhưng sai cho câu "kỷ nào nặng": 44.126 tam giác vòm trời + rặng núi là HẰNG SỐ ở cả
  // 15 kỷ, và một hằng số cộng vào cả tử lẫn mẫu thì pha loãng khác biệt. Trên 4 kỷ của ma trận
  // đo, chênh lệch thật 1,43 lần bị đọc thành 1,16 lần.
  const nềnTheoKỷ = [];
  for (let era = 1; era <= 15; era += 1) {
    const city = dựngCảnh(era);
    const g = city.stats.geometry;

    assert.equal(g.triangles.city + g.triangles.backdrop, g.triangles.total,
      `kỷ ${era}: thành phố + nền không bằng tổng tam giác`);
    assert.equal(g.drawCalls.city + g.drawCalls.backdrop, g.drawCalls.total,
      `kỷ ${era}: thành phố + nền không bằng tổng lệnh vẽ`);
    assert.equal(g.triangles.total, city.stats.triangles, `kỷ ${era}: tổng phẳng lệch tổng tách`);
    assert.equal(g.drawCalls.total, city.stats.drawCalls, `kỷ ${era}: tổng phẳng lệch tổng tách`);

    // Phép đếm ĐỘC LẬP của bài test, phân loại bằng chính NHÃN mà bên dựng gắn — nếu ai đó đổi sang
    // đoán bằng kích thước/màu thì hai bên sẽ lệch ngay.
    let nềnRiêng = 0;
    let khốiNền = 0;
    city.scene.traverse((o) => {
      if (!o.isMesh || o.visible === false || !o.geometry) return;
      if (o.userData?.sceneLayer !== 'backdrop') return;
      khốiNền += 1;
      const đỉnh = o.geometry.index
        ? o.geometry.index.count : (o.geometry.attributes?.position?.count ?? 0);
      nềnRiêng += đỉnh / 3;
    });
    assert.equal(g.triangles.backdrop, nềnRiêng, `kỷ ${era}: phần nền báo sai`);
    assert.equal(khốiNền, 2, `kỷ ${era}: nền phải đúng 2 khối (vòm trời + rặng núi), thấy ${khốiNền}`);

    nềnTheoKỷ.push(g.triangles.backdrop);
    assert.ok(g.triangles.city > 0 && g.triangles.backdrop > 0,
      `kỷ ${era}: một trong hai phần bằng 0 — nhãn nguồn gốc đã rơi mất?`);
    city.dispose();
  }

  // ĐỐI CHỨNG nhốt đúng cái bẫy: phần nền là HẰNG SỐ. Ngày nào nó thôi hằng số thì lý lẽ "trừ nền
  // ra mới so được kỷ" phải được viết lại, và bài này phải đỏ để bắt người ta viết lại.
  assert.equal(new Set(nềnTheoKỷ).size, 1,
    `phần nền đáng lẽ giống hệt ở cả 15 kỷ, nhưng thấy ${new Set(nềnTheoKỷ).size} giá trị khác nhau`);
});

test('"ĐÃ VẼ" ≤ "TRONG CẢNH" ở mọi camera, và BẰNG NHAU ở camera mặc định', () => {
  /**
   * ⚠️ BÀI NÀY CỐ Ý **KHÔNG** KHOÁ "HAI BÊN LUÔN BẰNG NHAU" — khoá thế là gài mìn.
   * Hôm nay chúng bằng nhau chỉ vì camera mặc định thấy trọn cảnh. Ma trận đo có `--zoom 0.4`, ở
   * đó rặng núi chân trời (rộng gấp sáu lần lưới) rơi ra ngoài khung và three bỏ qua nó trước khi
   * vẽ. Một bài test đòi "luôn bằng" sẽ ĐỎ ở đúng lúc mã đang chạy ĐÚNG.
   * Thứ thật sự là luật là QUAN HỆ: cắt bỏ thì chỉ có thể vẽ ÍT ĐI, không bao giờ nhiều hơn.
   */
  for (const era of [1, 3, 7, 11, 13, 15]) {
    const p = thamSố(era);
    const city = createCityScene(p);
    const trongCảnh = đếmĐộcLập(city.scene);
    assert.equal(city.stats.triangles, trongCảnh.tam, `kỷ ${era}: số "trong cảnh" lệch`);

    // (1) Camera MẶC ĐỊNH: bằng nhau — đây là điều kiện đã kiểm chứng trong trình duyệt (kỷ 7 ra
    // 78.748 ở cả hai cột) và là thứ giữ cho bảng [stats] có ý nghĩa đối chiếu.
    const mặcĐịnh = đếmĐộcLập(city.scene, khungNhìnCủa(city.scene, p.layout, 1));
    assert.equal(mặcĐịnh.tam, trongCảnh.tam,
      `kỷ ${era}: camera mặc định đáng lẽ thấy trọn cảnh, nhưng cắt mất ${trongCảnh.tam - mặcĐịnh.tam} tam giác`);
    assert.equal(mặcĐịnh.lệnh, trongCảnh.lệnh, `kỷ ${era}: camera mặc định cắt mất lệnh vẽ`);

    // (2) Mọi camera khác: chỉ được ÍT ĐI. Gồm cả `--zoom 0.4` của ma trận đo.
    for (const zoom of [1.5, 1, 0.6, 0.4, 0.25]) {
      const đãVẽ = đếmĐộcLập(city.scene, khungNhìnCủa(city.scene, p.layout, zoom));
      assert.ok(đãVẽ.tam <= trongCảnh.tam,
        `kỷ ${era} zoom ${zoom}: "đã vẽ" (${đãVẽ.tam}) > "trong cảnh" (${trongCảnh.tam})`);
      assert.ok(đãVẽ.lệnh <= trongCảnh.lệnh,
        `kỷ ${era} zoom ${zoom}: lệnh vẽ "đã vẽ" (${đãVẽ.lệnh}) > "trong cảnh" (${trongCảnh.lệnh})`);
      assert.ok(đãVẽ.tam > 0, `kỷ ${era} zoom ${zoom}: cắt sạch cả cảnh — phép dựng camera hỏng`);
    }
    city.dispose();
  }
});

test('ĐỐI CHỨNG cho bài trên: phép cắt của bài test PHẢI có răng, nếu không "≤" là cái phễu', () => {
  /**
   * ⚠️ Bài "≤" ở trên sẽ XANH VĨNH VIỄN kể cả khi phép cắt của bài test hỏng và không bao giờ cắt
   * gì (0 ≤ 0 luôn đúng) — đúng hình dạng "ngưỡng một phía là cái phễu, không phải hàng rào".
   *
   * ⚠️ VÀ ĐO RA MỘT SỰ THẬT NGƯỢC VỚI DỰ ĐOÁN, GHI LẠI ĐỂ PHIÊN SAU KHỎI ĐI TÌM LỖI KHÔNG CÓ:
   * cảnh này **không thể** bị cắt bớt bởi bất kỳ camera nào app dựng ra được. Cả thành phố chỉ gồm
   * 7 khối, mà khối nào cũng hoặc bao trùm camera hoặc nằm ngay giữa tầm ngắm: vòm trời bán kính
   * 43,2 và rặng núi 51,1 (camera đứng cách tâm 4,3–17,2 nên nó ở BÊN TRONG cả hai), còn mặt đất
   * 13,5 · mặt đường 8,5 · toàn bộ công trình đã GỘP làm một khối bán kính 7,5 đều tâm ở gốc toạ
   * độ — mà camera thì luôn ngắm vào gốc toạ độ. Cắt theo hộp bao là phép cắt rất thô, nên
   * `--zoom 0.4` hay 0,25 đều KHÔNG bỏ được khối nào (đã đo: 78.748 = 78.748 ở cả ba mức zoom).
   * ⇒ Hai cột "trong cảnh" và "đã vẽ" hôm nay **buộc phải bằng nhau**, và đó là lý do phép đối
   * chiếu ở Bước 1 khớp — không phải nhờ may. Ngày nào tách công trình thành nhiều khối riêng thì
   * chúng mới lệch, và lúc ấy lệch là ĐÚNG.
   *
   * Vì vậy đối chứng này KHÔNG dùng camera của app (sẽ chẳng bao giờ cắt được gì), mà vặn tới mức
   * PHI LÝ — quay lưng lại thành phố — rồi ĐÒI thấy hậu quả phi lý.
   */
  const p = thamSố(7);
  const city = createCityScene(p);
  const trongCảnh = đếmĐộcLập(city.scene);

  // ⚠️ ĐỨNG THẬT XA rồi mới quay lưng. Đứng ở gốc toạ độ mà quay lưng thì KHÔNG cắt được gì, vì
  // camera lúc ấy nằm BÊN TRONG hộp bao của cả 7 khối (kể cả mặt đường bán kính 8,5) — và một hộp
  // bao chứa camera thì luôn giao với khung nhìn. Đây chính là bản đối chứng đầu tiên tôi viết, và
  // nó ĐỎ; đọc kỹ mới thấy lỗi nằm ở phép thử chứ không ở phép cắt.
  const xa = p.layout.gridSize * 25;
  const camera = new PerspectiveCamera(CITY_CAMERA_FOV, 1 / 0.62, 0.5, p.layout.gridSize * 8);
  camera.position.set(0, 2, xa);
  camera.lookAt(0, 2, xa * 2);   // ngắm ra hư không, thành phố ở sau lưng và ngoài mặt phẳng xa
  camera.updateMatrixWorld(true);
  city.scene.updateMatrixWorld(true);
  const quayLưng = new Frustum().setFromProjectionMatrix(
    new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
  const đãVẽ = đếmĐộcLập(city.scene, quayLưng);
  assert.equal(đãVẽ.tam, 0,
    `đứng xa quay lưng lại thành phố mà vẫn "vẽ" ${đãVẽ.tam} tam giác — phép cắt của bài test không nối vào đâu cả`);
  assert.ok(trongCảnh.tam > 0, 'cảnh rỗng thì đối chứng này vô nghĩa');
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

/**
 * ⚠️ `tachDeDo` LÀ CỜ CHỈ DÀNH CHO PHÉP ĐO — VÀ MỘT CỜ ĐO LỌT VÀO APP LÀ MỘT LỆNH VẼ MẤT TRẮNG.
 *
 * Cả thành phố gộp làm MỘT khối lưới để tốn đúng một lệnh vẽ mỗi họ vật liệu; đó là ràng buộc cứng
 * nhất của giai đoạn "tiêu ngân sách" (được tiêu tam giác, CẤM tiêu lệnh vẽ). Hỏi một trong các tên
 * `NHOM_TACH_THANH_PHO` thì cờ cắt khối ấy làm ba (`buildings`/`props`/`landscape`) để
 * `city-preview.mjs --mask` hỏi được "điểm ảnh nào là nhà" — một câu hỏi không trả lời được bằng
 * cách dò màu (`TECH_DEBT #22`).
 *
 * Nhưng cắt đôi thì cộng thêm lệnh vẽ. Nếu cờ này lặng lẽ bật trong app thì không có gì đỏ lên:
 * ảnh y hệt, tam giác y hệt, chỉ có ngân sách lệnh vẽ bị thủng. Ba assert dưới đây khoá cả ba vế:
 * mặc định TẮT · bật thì đúng là có cắt (nếu không, phép đo mật độ đang đo một tấm mặt nạ rỗng) ·
 * và app KHÔNG BAO GIỜ truyền cờ này.
 */
test('`tachDeDo` MẶC ĐỊNH TẮT — app phải thấy MỘT khối `city` duy nhất', () => {
  for (let era = 1; era <= 15; era += 1) {
    const city = dựngCảnh(era);
    const tên = [];
    city.scene.traverse((o) => { if (o.isMesh && o.name) tên.push(o.name); });
    assert.ok(tên.includes('city'), `kỷ ${era}: không có khối nào tên "city" — cờ đo đã rò vào đường mặc định?`);
    assert.equal(tên.filter((t) => t === 'city').length, 1, `kỷ ${era}: có nhiều hơn một khối "city"`);
    assert.ok(!tên.includes('buildings') && !tên.includes('props'),
      `kỷ ${era}: cảnh mặc định đã bị cắt làm hai (${tên.join(', ')}) — mất một lệnh vẽ`);
    city.dispose();
  }
});

test('ĐỐI CHỨNG: hỏi tên nhóm thành phố thì PHẢI cắt thật, và cái giá đúng bằng 1 lệnh vẽ', () => {
  // Không có đối chứng này thì assert ở trên vẫn xanh khi cờ bị nối hỏng và chẳng làm gì cả — lúc
  // ấy mọi tấm mặt nạ "buildings" sẽ ném lỗi "không khớp đối tượng nào", hoặc tệ hơn là khớp nhầm.
  for (const era of [1, 7, 15]) {
    const thường = createCityScene(thamSố(era));
    const cắt = createCityScene({ ...thamSố(era), tachDeDo: NHOM_TACH_THANH_PHO });

    const tên = [];
    cắt.scene.traverse((o) => { if (o.isMesh && o.name) tên.push(o.name); });
    assert.ok(tên.includes('buildings'), `kỷ ${era}: bật cờ mà không có khối "buildings"`);
    assert.ok(tên.includes('props'), `kỷ ${era}: bật cờ mà không có khối "props"`);
    assert.ok(!tên.includes('city'), `kỷ ${era}: bật cờ mà khối gộp "city" vẫn còn`);

    // Tam giác KHÔNG được đổi — cắt là chia lại cùng một đống hình học, không phải dựng thêm.
    assert.equal(đếmĐộcLập(cắt.scene).tam, đếmĐộcLập(thường.scene).tam,
      `kỷ ${era}: cắt khối làm đổi số tam giác — vậy nó không còn là cùng một thành phố`);
    // ⚠️ VÀ CÁI GIÁ LÀ LỆNH VẼ — ĐÂY MỚI LÀ LÝ DO CỜ NÀY CẤM VÀO APP.
    // Đừng khoá bằng "đúng +1": một khối gộp tốn MỘT lệnh vẽ mỗi HỌ VẬT LIỆU (mảng material +
    // groups), nên cắt đôi làm mọi họ có mặt ở CẢ HAI nửa bị đếm hai lần. Giá thật vì thế bằng số
    // họ dùng chung, và nó khác nhau theo kỷ — đo ra: kỷ 1 tốn +2. Viết cứng +1 là gài mìn, viết
    // cứng một bảng 15 số là khoá một phép làm tròn. Thứ đáng khoá là QUAN HỆ: cắt thì ĐẮT LÊN.
    const lệnhThường = đếmĐộcLập(thường.scene).lệnh;
    const lệnhCắt = đếmĐộcLập(cắt.scene).lệnh;
    assert.ok(lệnhCắt > lệnhThường,
      `kỷ ${era}: cắt khối mà lệnh vẽ không tăng (${lệnhThường} → ${lệnhCắt}) — vậy cờ này không hề cắt`);

    thường.dispose();
    cắt.dispose();
  }
});

test('CƯ DÂN PHẢI CÓ TÊN — không thì phép đo mật độ đọc họ thành nền trời', () => {
  // Bài học 2026-08-19: bảng mật độ đầu tiên có 15,6% khung hình nằm trong "sọt đen" không tên, và
  // tôi suýt đọc phần ấy thành trời. Đặt tên là cách rẻ nhất để một phép đo tự khai ra chỗ mù.
  const city = dựngCảnh(7);
  const cưDân = [];
  city.scene.traverse((o) => { if (o.isInstancedMesh) cưDân.push(o.name); });
  assert.ok(cưDân.length > 0, 'không có InstancedMesh nào — fixture hỏng, bài test đang chạy rỗng');
  assert.deepEqual([...new Set(cưDân)], ['residents'],
    `cư dân đang mang tên ${JSON.stringify(cưDân)} — mặt nạ sẽ không hỏi được họ`);
  city.dispose();
});

/**
 * ⚠️ NHÁT CẮT THỨ HAI CỦA `tachDeDo` — mở ra khi hỏi tên `NHOM_TACH_MAT_DAT`, cùng luật.
 *
 * Mặt đất là MỘT tấm lưới đỉnh liền trải từ rìa vành đất bên này, qua thành phố, sang rìa bên kia.
 * Ở tầng scene vì thế KHÔNG còn cách nào hỏi *"bao nhiêu phần khung hình là đất TRONG lưới thành
 * phố, bao nhiêu là vành đất NGOÀI?"* — mà đó đúng là câu hỏi §1 phải trả lời, sau khi §2-C đo
 * được rằng phủ kín MỌI ô đất trống trong lưới cũng chỉ hạ "đất trống" 7,13 điểm phần trăm.
 *
 * Tách bằng MÀU thì rơi thẳng vào `TECH_DEBT #22` (bộ lọc "8% tươi nhất ≈ mái" hoá ra chấm cỏ suốt
 * ba phase) — huống hồ hai vùng ở đây dùng chung một dải sắc độ, tức còn khó tách hơn cả mái. Bên
 * DỰNG biết chắc ô nào nằm đâu, nên bên dựng phải nói ra.
 *
 * Bốn assert dưới đây khoá bốn vế KHÁC NHAU (đừng gộp — mỗi vế đỏ vì một lý do riêng):
 *   1. mặc định TẮT ở cả 15 kỷ;
 *   2. bật thì CÓ cắt thật, tam giác được BẢO TOÀN, và cái giá là lệnh vẽ;
 *   3. chỗ cắt nằm ĐÚNG ranh giới lưới thành phố — không phải "có cắt là được";
 *   4. app không bao giờ truyền cờ này.
 */
test('`tachDeDo` MẶC ĐỊNH TẮT — app phải thấy MỘT khối `ground` duy nhất', () => {
  for (let era = 1; era <= 15; era += 1) {
    const city = dựngCảnh(era);
    const tên = [];
    city.scene.traverse((o) => { if (o.isMesh && o.name) tên.push(o.name); });
    assert.equal(tên.filter((t) => t === 'ground').length, 1,
      `kỷ ${era}: phải có đúng MỘT khối "ground", đang có ${tên.filter((t) => t === 'ground').length}`);
    assert.ok(!tên.includes('ground-grid') && !tên.includes('ground-apron'),
      `kỷ ${era}: mặt đất mặc định đã bị cắt làm hai (${tên.join(', ')}) — mất một lệnh vẽ`);
    city.dispose();
  }
});

test('ĐỐI CHỨNG: hỏi tên nhóm mặt đất thì PHẢI cắt thật, tam giác bảo toàn, giá là lệnh vẽ', () => {
  // Không có đối chứng này thì assert trên vẫn xanh khi cờ bị nối hỏng và chẳng làm gì cả — lúc ấy
  // `--mask ground-grid` sẽ ném lỗi "không khớp đối tượng nào", hoặc tệ hơn là khớp một tấm rỗng
  // rồi báo 0,00% mà trông hoàn toàn hợp lý.
  for (const era of [1, 7, 15]) {
    const thường = createCityScene(thamSố(era));
    const cắt = createCityScene({ ...thamSố(era), tachDeDo: NHOM_TACH_MAT_DAT });

    const tên = [];
    cắt.scene.traverse((o) => { if (o.isMesh && o.name) tên.push(o.name); });
    assert.ok(tên.includes('ground-grid'), `kỷ ${era}: bật cờ mà không có khối "ground-grid"`);
    assert.ok(tên.includes('ground-apron'), `kỷ ${era}: bật cờ mà không có khối "ground-apron"`);
    assert.ok(!tên.includes('ground'), `kỷ ${era}: bật cờ mà khối gộp "ground" vẫn còn`);

    // Cắt là CHIA LẠI cùng một đống hình học, không phải dựng thêm. Nếu số này lệch thì hai nửa
    // không cộng lại thành cái cũ, và mọi tỉ lệ đo từ mặt nạ sẽ sai theo — đúng bài học "mọi phép
    // chia-một-cái-toàn-thể-thành-nhiều-phần phải in ra TỔNG và đòi nó bằng 100%".
    assert.equal(đếmĐộcLập(cắt.scene).tam, đếmĐộcLập(thường.scene).tam,
      `kỷ ${era}: cắt mặt đất làm đổi số tam giác — vậy nó không còn là cùng một mặt đất`);

    // ⚠️ CÁI GIÁ LÀ LỆNH VẼ — lý do cờ này CẤM vào app. Khoá QUAN HỆ ("cắt thì đắt lên"), không
    // khoá "+1": hai nửa dùng chung `tileMaterial` nên hôm nay đúng +1, nhưng viết cứng con số là
    // gài mìn cho ngày vật liệu mặt đất được tách ra.
    //
    // ⚠️ NÓI THẲNG MỘT ĐIỀU VỀ CHÍNH ASSERT NÀY: hôm nay nó KHÔNG THỂ ĐỎ MỘT MÌNH. Hai khối lưới
    // thì tất yếu tốn nhiều lệnh vẽ hơn một khối, nên mọi phép phá làm nó đỏ đều đã bị assert
    // "phải có ground-grid/ground-apron" ở trên bắt trước. Đã thử ngược 9 phép phá; không phép nào
    // cô lập được nó. Vậy nó ở đây để làm gì? Để **cái giá được viết ra thành số**, và để bắt được
    // đúng MỘT tương lai mà ba assert kia mù: có ai đó "tối ưu" phép cắt thành hai NHÓM VẬT LIỆU
    // trong CÙNG một khối hình học — lúc ấy tên khối vẫn đủ, tam giác vẫn bảo toàn, và nếu hai
    // nhóm dùng chung vật liệu thì lệnh vẽ có thể KHÔNG tăng ⇒ cờ đo hết đắt ⇒ luật "cấm vào app"
    // mất lý do tồn tại mà không ai biết. Ghi rõ ở đây thay vì để nó trông như một cái bẫy đang
    // canh gác — một assert chưa từng thấy đỏ mà không nói ra là một assert đang cho vay uy tín.
    const lệnhThường = đếmĐộcLập(thường.scene).lệnh;
    const lệnhCắt = đếmĐộcLập(cắt.scene).lệnh;
    assert.ok(lệnhCắt > lệnhThường,
      `kỷ ${era}: cắt mà lệnh vẽ không tăng (${lệnhThường} → ${lệnhCắt}) — vậy cờ này không hề cắt`);

    thường.dispose();
    cắt.dispose();
  }
});

test('CHỖ CẮT PHẢI TRÙNG RANH GIỚI LƯỚI THÀNH PHỐ — đối xứng, và sai lệch đúng NỬA Ô', () => {
  // ⚠️ "Có cắt" KHÔNG bằng "cắt đúng chỗ". Một bộ phân loại lệch tâm, hoặc lấy nhầm nửa bề rộng,
  // vẫn cho ra hai khối đầy đủ, tam giác vẫn bảo toàn, lệnh vẽ vẫn tăng — cả ba assert trên đều
  // xanh, và bảng số §1 sẽ nói dối về việc vành đất chiếm bao nhiêu khung hình.
  //
  // Đo bằng HỘP BAO trong toạ độ THẾ GIỚI, vì đó là thứ camera nhìn thấy. Lưới thành phố trải
  // `world ∈ [−gridSize/2 ; +gridSize/2]` (12 ô, tâm ở gốc toạ độ).
  const { layout } = thamSố(7);
  const nửaLưới = layout.gridSize / 2;                      // 6 với lưới 12
  const city = createCityScene({ ...thamSố(7), tachDeDo: NHOM_TACH_MAT_DAT });

  let trong = null;
  let vành = null;
  city.scene.traverse((o) => {
    if (o.name === 'ground-grid') trong = o;
    if (o.name === 'ground-apron') vành = o;
  });
  assert.ok(trong && vành, 'thiếu một trong hai khối — bài test đang chạy rỗng');

  const hộpBao = (mesh) => {
    const p = mesh.geometry.attributes.position.array;
    let xMin = Infinity; let xMax = -Infinity; let zMin = Infinity; let zMax = -Infinity;
    for (let k = 0; k < p.length; k += 3) {
      if (p[k] < xMin) xMin = p[k];
      if (p[k] > xMax) xMax = p[k];
      if (p[k + 2] < zMin) zMin = p[k + 2];
      if (p[k + 2] > zMax) zMax = p[k + 2];
    }
    return { xMin, xMax, zMin, zMax };
  };
  const g = hộpBao(trong);
  const v = hộpBao(vành);

  // (a) ĐỐI XỨNG. Đây là vế bắt được kiểu hỏng tinh vi nhất: `<` một phía, `<=` phía kia thì một
  // bên ăn thêm nguyên một hàng ô mà bên kia không — phép đo lệch 1/3 ô về một phía, không ai thấy.
  assert.ok(Math.abs(g.xMin + g.xMax) < 1e-6,
    `khối trong lưới lệch tâm theo X: [${g.xMin}; ${g.xMax}] — phép phân loại không đối xứng`);
  assert.ok(Math.abs(g.zMin + g.zMax) < 1e-6,
    `khối trong lưới lệch tâm theo Z: [${g.zMin}; ${g.zMax}] — phép phân loại không đối xứng`);

  // (b) BƯỚC LƯỚI đo THẲNG TỪ HÌNH HỌC, không chép hằng số `TERRAIN_SUB` — chép là "một luật hai
  // công thức", và bài test sẽ trôi theo đúng thứ nó định canh.
  const xs = [...new Set(Array.from(
    { length: trong.geometry.attributes.position.count },
    (_, k) => Math.round(trong.geometry.attributes.position.array[k * 3] * 1e6) / 1e6,
  ))].sort((a, b) => a - b);
  let bước = Infinity;
  for (let k = 1; k < xs.length; k += 1) bước = Math.min(bước, xs[k] - xs[k - 1]);
  assert.ok(bước > 0 && Number.isFinite(bước), 'không đo được bước lưới — hình học không phải lưới đều');

  // (c) VÀO ĐÚNG RANH GIỚI, sai lệch đúng NỬA Ô. Tâm ô biên rơi CHÍNH XÁC lên mốc ±6, và phép so
  // `<` đối xứng đẩy CẢ HAI ô biên ra vành ngoài ⇒ khối trong lưới hụt đúng `bước/2` mỗi cạnh.
  // Đây là con số ĐO ĐƯỢC (0,1667 trên bước 0,3333), không phải một dung sai nới cho chắc: không
  // phép phân loại theo ô nào làm tốt hơn nửa ô được.
  for (const [tên2, hụt] of [['X', nửaLưới - g.xMax], ['Z', nửaLưới - g.zMax]]) {
    assert.ok(Math.abs(hụt - bước / 2) < 1e-6,
      `mép ${tên2} của khối trong lưới hụt ${hụt} so với ranh giới ${nửaLưới} — phải đúng nửa ô (${bước / 2})`);
  }

  // (d) VÀNH NGOÀI PHẢI BAO TRỌN khối trong lưới, và phải vươn ra XA HƠN hẳn — nếu không thì thứ
  // đang được gọi là "vành đất" thật ra chỉ là một viền mỏng, và bảng §1 sẽ đọc sai chỗ trống.
  assert.ok(v.xMax > g.xMax && v.zMax > g.zMax && v.xMin < g.xMin && v.zMin < g.zMin,
    `vành ngoài không bao trọn khối trong lưới: vành [${v.xMin}; ${v.xMax}], trong [${g.xMin}; ${g.xMax}]`);
  assert.ok(v.xMax > nửaLưới, `vành ngoài không vươn quá ranh giới lưới (${v.xMax} ≤ ${nửaLưới})`);

  city.dispose();
});

/**
 * ⚠️ VÙNG QUÊ KHÔNG ĐƯỢC LÀ VẬT CẢN — và bài này tồn tại vì phép thử ngược đã bắt được một LỖ TRỐNG.
 *
 * `sceneGraph.js` cố ý bỏ cây/bụi/đá ngoại ô ra khỏi `blockers` (ADR-038 + `TECH_DEBT #54`): bộ
 * hoạch định đường bay chỉ biết CÔNG TRÌNH, không biết ĐỊA HÌNH, nên nhét cây vào đó là mua một sự
 * an toàn GIẢ — camera sẽ né một bụi cây rồi bay thẳng vào sườn đồi ngay dưới nó (đo được: mặt đất
 * vùng quê kỷ 8 dâng tới +2,18 trong khi nền phố quanh 0), lại còn cắt khoảng hở của ADR-034 từ
 * 7,5 xuống 0,81 và làm bài test kêu OAN về một nguyên nhân sai.
 *
 * ⚠️ NHƯNG LÚC MỚI VIẾT, LUẬT ẤY KHÔNG CÓ GÌ CANH. Gỡ hẳn dòng `if (placement.vungQue) continue;`
 * ra khỏi `sceneGraph.js` thì **toàn bộ 891 bài vẫn xanh** — vì `cityFocus.test.js` tự dựng lấy
 * danh sách khối của nó (và tự bỏ qua vùng quê), nên nó KHÔNG BAO GIỜ nhìn thấy `blockers` thật mà
 * cảnh trả ra. Đúng bài học *"một bài học được ghi ra không chặn được gì; chỉ một bài TEST mới chặn
 * được"* — nên bài này hỏi thẳng cảnh THẬT, không hỏi mã nguồn và không hỏi một bản dựng lại.
 *
 * THỬ-CHO-ĐỎ ĐÃ CHẠY THẬT (nêu trước chỗ mong đợi đỏ): gỡ `if (placement.vungQue) continue;`
 * ⇒ mong đợi đỏ ở assert "vật cản nằm ngoài lưới" ngay dưới, kèm toạ độ của khối phạm luật.
 */
test('⚠️ VẬT CẢN CHỈ GỒM KHỐI TRONG LƯỚI THÀNH PHỐ — cây ngoại ô KHÔNG chặn camera', () => {
  // Nửa bề rộng lưới, quy ra toạ độ THẾ GIỚI: ô chạy từ −0,5 tới gridSize−0,5, `cellToWorld` trừ đi
  // `(gridSize−1)/2` ⇒ mép lưới cách tâm đúng `gridSize / 2` = 6,000 đơn vị thế giới.
  //
  // ⚠️ DUNG SAI 0,6 LÀ SỐ ĐO, KHÔNG PHẢI SỐ ĐOÁN — và bản đầu của chính bài này đã đoán 1,5.
  // Phần khối nhô ra khỏi tâm ô (mái đua, bệ kè) đo trên CẢ 15 KỶ ở 80 phiên: xa nhất **6,340**
  // (kỷ 9), tức dung sai thật đang dùng chỉ **0,340**; 11/15 kỷ còn không quá 5,88. Ngưỡng 1,5 để
  // ngỏ một khe rộng gấp 4,4 lần chỗ thật sự cần — đúng cái phễu Phase 9A ("một ngưỡng nới rộng
  // cho chắc là một cái phễu, và nó im lặng đúng lúc cần kêu nhất"). 0,6 chừa biên 1,8× so với số
  // đo mà vẫn nằm xa dưới mức bắt đầu nuốt vùng quê.
  const NUA_LUOI = 12 / 2;
  const DUNG_SAI = 0.6;
  let tongVatCan = 0;
  let xaNhat = 0;
  for (const era of [1, 3, 8, 12, 14]) {
    const scene = dựngCảnh(era);
    const vatCan = scene.blockers ?? [];
    assert.ok(vatCan.length > 0, `kỷ ${era}: không có vật cản nào — bài này đang kiểm một danh sách rỗng`);
    tongVatCan += vatCan.length;
    for (const b of vatCan) {
      const xa = Math.max(Math.abs(b.minX), Math.abs(b.maxX), Math.abs(b.minZ), Math.abs(b.maxZ));
      if (xa > xaNhat) xaNhat = xa;
      assert.ok(xa <= NUA_LUOI + DUNG_SAI,
        `kỷ ${era}: có vật cản cách tâm ${xa.toFixed(2)} (> ${NUA_LUOI + DUNG_SAI}) — một khối NGOÀI `
        + 'lưới đã lọt vào `blockers`. Vùng quê là địa hình, không phải công trình: xem ADR-038.');
    }
    scene.dispose?.();
  }
  assert.ok(tongVatCan > 100, `mới duyệt ${tongVatCan} vật cản — quá ít để bài này nói được điều gì`);

  // ⚠️ ĐỐI CHỨNG — NHỐT ĐÚNG CA HỎNG, để ngưỡng trên không bị nới dần cho tiện. Không có vế này thì
  // `DUNG_SAI` có thể trôi lên tới mức nuốt trọn vùng quê mà bài test vẫn xanh, và lúc ấy nó chỉ
  // còn là một dòng chữ. Hỏi thẳng: NẾU vùng quê bị để lại trong `blockers` thì phép đo này có bắt
  // được không, và bắt được bao nhiêu khối?
  const ngoaiO = deriveOutskirts({ era: 8, gridSize: 12 });
  const soLotLuoi = ngoaiO.filter((it) => {
    const { x, z } = cellToWorld(it.x, it.y, 12);
    return Math.max(Math.abs(x), Math.abs(z)) > NUA_LUOI + DUNG_SAI;
  }).length;
  assert.ok(soLotLuoi > 100,
    `chỉ ${soLotLuoi} khối vùng quê vượt ngưỡng ${NUA_LUOI + DUNG_SAI} — dung sai đã nới tới mức `
    + 'gần như không còn bắt được ca hỏng. Ngưỡng này phải TÁCH được hai bên, không chỉ tồn tại.');

  // Và ghi lại biên thật, để lần sau ai đọc cũng thấy ngay khoảng cách giữa số đo và ngưỡng —
  // "đo BIÊN của mọi lời hứa, đừng chỉ đọc xanh/đỏ" (Phase 9B).
  assert.ok(xaNhat > NUA_LUOI - 1,
    `vật cản xa nhất chỉ ${xaNhat.toFixed(3)} — thành phố co lại bất thường, phép đo mất ngữ cảnh`);
});

/**
 * ⚠️ TRẦN CHO HỘP BAO KHỐI `city` — VÌ VIỆC 1 VỪA BIẾN MỘT SỰ THẬT CHẮC CHẮN THÀNH MỘT SỰ THẬT
 * MONG MANH, VÀ MỘT SỰ THẬT MONG MANH KHÔNG CÓ TEST THÌ MỤC NÁT TRONG IM LẶNG.
 *
 * Nền của nó là một sự thật kiến trúc đã ghi trong `CLAUDE.md` (Performance Gate vòng 2): *"cả
 * thành phố chỉ có 7 khối, khối nào cũng hoặc bao trùm camera hoặc có tâm ngay tại gốc toạ độ mà
 * camera thì luôn ngắm vào gốc ⇒ phép cắt theo hộp bao không bỏ được gì"*. Câu ấy nói ra một điều
 * dễ chịu: **KHÔNG có gì bị cắt, nên `đã vẽ` luôn bằng `trong cảnh`** (bài ở trên khoá đúng quan hệ
 * ấy). VIỆC 1 nhập vùng quê vào khối `city` để không tốn lệnh vẽ nào, và cái giá là hộp bao khối ấy
 * **phình 2,32 lần** — từ 8,4836 (nhà + cảnh vật, đo bằng cách hỏi ba nhóm tách) lên **19,7239**.
 *
 * Vì sao con số ấy đáng canh, nói cho đúng: three cắt theo **HÌNH CẦU BAO của TỪNG MESH**. Khối
 * `city` là MỘT mesh, nên hôm nay nó có to tới đâu cũng chẳng đổi gì — cắt hay không cắt thì vẫn
 * vẽ trọn hoặc bỏ trọn, và nó bao trùm camera nên luôn vẽ trọn. Điều đáng sợ nằm ở NGÀY MAI: ngày
 * nào có người tách thành phố ra nhiều mesh (LOD, cắt theo khu, tách nhà khỏi cây cho đúng), phép
 * cắt mới bắt đầu có nghĩa — và lúc ấy một hộp bao rộng gấp 2,32 lần sẽ âm thầm vô hiệu hoá nó.
 * Không có gì đỏ lên: ảnh y hệt, tam giác y hệt, chỉ mất một cơ hội tiết kiệm mà không ai biết đã
 * từng có.
 *
 * ⚠️ NGƯỠNG 20,12 = giá trị THẬT lớn nhất đo được (19,7239, kỷ 3) **cộng 2%**, KHÔNG phải một số
 * tròn chọn cho dễ nhớ. Biên 2% chỉ đủ che hai thứ: một kỷ mới khai `size` cây nhỉnh hơn chút, và
 * sai số dấu phẩy động giữa các máy. Nó **CỐ Ý KHÔNG đủ** để che việc nâng `OUTSKIRT_REACH` — nâng
 * 8 → 9 đưa hộp bao lên ~21,2 và bài này đỏ ngay, đúng thứ cần đỏ.
 *
 * ⚠️ VÀ ĐỪNG ĐỌC 19,72 THÀNH "BÁN KÍNH VÙNG QUÊ": vùng quê với tay ra 8 ô ngoài lưới nửa-rộng 6 ⇒
 * NỬA CẠNH 14, mà hình cầu bao của một hình VUÔNG thì lớn hơn nửa cạnh đúng √2 lần (14 × 1,414 =
 * 19,80). Đây chính là cái bẫy `computeBoundingSphere` đã cắn ngày 2026-08-19 — bán kính chỉ là bán
 * kính khi vật thể TRÒN. Bản đầu của ADR-038 ước lượng "~14" theo nửa cạnh và đã phải sửa.
 */
const NGUONG_HOP_BAO_CITY = 20.12;

function banKinhBao(scene, tên) {
  let r = 0;
  scene.traverse((o) => {
    if (!o.isMesh || o.name !== tên) return;
    o.geometry.computeBoundingSphere();
    r = Math.max(r, o.geometry.boundingSphere?.radius ?? 0);
  });
  return r;
}

test('⚠️ TRẦN HỘP BAO khối `city` — và nội thành PHẢI vẫn nhỏ', () => {
  let lớnNhấtCity = 0;
  let lớnNhấtNộiThành = 0;
  let sốCảnh = 0;

  for (let era = 1; era <= 15; era += 1) {
    // Hai mốc tuổi: thành phố trẻ (ít nhà) và già (kín nhà). Hộp bao vùng quê không đổi theo tuổi —
    // vùng quê là ĐỊA LÝ, không phải TIẾN ĐỘ (ADR-038) — nhưng phần nội thành thì có, nên phải hỏi
    // cả hai chứ đừng hỏi một.
    for (const phiên of [12, 120]) {
      const gộp = createCityScene(thamSố(era, 12, phiên));
      const tách = createCityScene({ ...thamSố(era, 12, phiên), tachDeDo: NHOM_TACH_THANH_PHO });
      sốCảnh += 1;

      const rCity = banKinhBao(gộp.scene, 'city');
      // "Nội thành" = thành phố THẬT, tức thứ nằm trong lưới 12×12: nhà + cảnh vật, KHÔNG có vùng
      // quê. Hỏi bằng cách bảo bên dựng tách ra — không suy từ toạ độ, không dò màu (`TECH_DEBT
      // #22`: một thứ đại diện là một giả định mỹ thuật đội lốt một phép đo).
      const rNộiThành = Math.max(
        banKinhBao(tách.scene, 'buildings'),
        banKinhBao(tách.scene, 'props'),
      );

      assert.ok(rCity > 0, `kỷ ${era} · ${phiên} phiên: không tìm thấy khối "city" để đo`);
      assert.ok(rCity <= NGUONG_HOP_BAO_CITY,
        `kỷ ${era} · ${phiên} phiên: hộp bao khối "city" = ${rCity.toFixed(4)} > trần `
        + `${NGUONG_HOP_BAO_CITY}. Một khối bao trùm cả thế giới thì phép cắt theo hộp bao không `
        + 'bao giờ bỏ được gì — hôm nay vô hại (chỉ có MỘT mesh), ngày mai tách mesh thì nó âm thầm '
        + 'vô hiệu hoá phép cắt. Nếu đây là chủ ý (nâng OUTSKIRT_REACH?) thì ĐO LẠI rồi sửa trần '
        + 'kèm lý do, đừng nới cho vừa.');

      lớnNhấtCity = Math.max(lớnNhấtCity, rCity);
      lớnNhấtNộiThành = Math.max(lớnNhấtNộiThành, rNộiThành);
      gộp.dispose();
      tách.dispose();
    }
  }

  // Gác chạy-rỗng: một `continue` đặt nhầm chỗ sẽ làm vòng lặp trên im lặng bỏ qua cả bảng.
  assert.equal(sốCảnh, 30, 'phải duyệt đủ 15 kỷ × 2 mốc tuổi');

  // ⚠️ ĐỐI CHỨNG 1 — CHỐNG PHỄU (bài học Phase 9A: khoảng cách giữa giá trị thật và ngưỡng chính là
  // phần dự án đang KHÔNG được bảo vệ). Trần 20,12 chỉ có răng khi giá trị thật còn nằm sát nó.
  // Bài này đỏ nếu ai đó thu vùng quê lại — và đó là hành vi ĐÚNG: thu xong thì phải hạ trần theo,
  // nếu không ta để lại một khoảng trống rộng cho lần phình sau đi qua mà không kêu.
  assert.ok(lớnNhấtCity >= NGUONG_HOP_BAO_CITY * 0.95,
    `hộp bao lớn nhất đo được chỉ ${lớnNhấtCity.toFixed(4)}, thấp hơn 95% của trần `
    + `${NGUONG_HOP_BAO_CITY} — trần đã thành cái phễu. Vùng quê vừa bị thu lại? Hạ trần cho khớp `
    + 'số đo mới (kèm lý do), đừng để nguyên.');

  // ⚠️ ĐỐI CHỨNG 2 — GIỮ ĐÚNG SỰ THẬT KIẾN TRÚC GỐC. Thứ Đàm muốn bảo tồn không phải con số 20,12
  // mà là câu *"cả thành phố là một khối NHỎ"*. Vùng quê được phép rộng vì nó là cảnh nền; NHÀ thì
  // không. Đo được 8,4836 (kỷ 9) ⇒ trần 9 là sát, không phải phễu.
  assert.ok(lớnNhấtNộiThành <= 9,
    `nội thành (nhà + cảnh vật, KHÔNG tính vùng quê) đã phình tới ${lớnNhấtNộiThành.toFixed(4)} — `
    + 'thành phố thật đang tràn ra ngoài lưới 12×12, mà lưới ấy là thứ ADR-007 khoá.');
});
