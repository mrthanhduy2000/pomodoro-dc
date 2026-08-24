/**
 * orbit.test.js — camera xoay quanh thành phố.
 *
 * Bất biến số 1: **camera không bao giờ chui xuống dưới sàn hay lật ngược.** Kéo mạnh tay là thao
 * tác bình thường trên điện thoại; nếu góc không bị kẹp thì thành phố sẽ lộn ngược hoặc biến mất,
 * và người dùng không có cách nào tự sửa ngoài việc thoát tab.
 *
 * Bất biến số 2: **thao tác không làm đổi gì thì không được báo "có đổi"** — mỗi lần báo nhầm là
 * một khung hình vẽ thừa, tức là ăn pin vô ích (xem `renderLoop.js`).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CAMERA_DISTANCE_FACTOR,
  CITY_CAMERA_FOV,
  DEFAULT_PITCH,
  DEFAULT_YAW,
  MAX_PITCH,
  MIN_PITCH,
  clampPitch,
  cityOrbitOptions,
  TERRAIN_TO_DISTANCE,
  TERRAIN_TO_TARGET_Y,
  FRAME_FIT_MARGIN,
  cityFrameBoxes,
  worstFrameMargin,
  createOrbit,
  orbitPosition,
  wrapYaw,
} from './orbit.js';

test('clampPitch: kẹp trong khoảng an toàn, không chạm 0 và không chạm 90°', () => {
  assert.equal(clampPitch(-99), MIN_PITCH);
  assert.equal(clampPitch(99), MAX_PITCH);
  assert.equal(clampPitch(DEFAULT_PITCH), DEFAULT_PITCH);
  assert.ok(MIN_PITCH > 0, 'pitch = 0 ⇒ camera nằm đúng mặt sàn, không thấy gì');
  assert.ok(MAX_PITCH < Math.PI / 2, 'pitch = 90° ⇒ vector "lên trên" suy biến, cảnh lật');
});

test('wrapYaw: xoay mãi một chiều không làm số lớn dần vô hạn', () => {
  const orbit = createOrbit();
  for (let i = 0; i < 5000; i += 1) orbit.drag(50, 0);
  const { yaw } = orbit.getState();
  assert.ok(yaw >= 0 && yaw < Math.PI * 2, `yaw thoát khỏi [0, 2π): ${yaw}`);

  assert.ok(wrapYaw(-0.5) > 0, 'góc âm phải được đưa về dương');
  assert.ok(Math.abs(wrapYaw(Math.PI * 2 + 0.25) - 0.25) < 1e-9);
});

test('kéo mạnh tay lên/xuống: camera KHÔNG chui xuống dưới sàn', () => {
  const orbit = createOrbit();

  for (let i = 0; i < 200; i += 1) orbit.drag(0, 500);   // kéo hết cỡ xuống → nhìn từ trên
  assert.ok(orbit.getPosition().y > 0, 'camera đã xuống dưới mặt sàn');
  assert.equal(orbit.getState().pitch, MAX_PITCH);

  for (let i = 0; i < 200; i += 1) orbit.drag(0, -500);  // kéo hết cỡ lên → nhìn ngang tầm mắt
  assert.ok(orbit.getPosition().y > 0);
  assert.equal(orbit.getState().pitch, MIN_PITCH);
});

test('chiều kéo đúng quy ước OrbitControls — kéo xuống là nghiêng về góc nhìn từ trên', () => {
  // Đảo dấu chỗ này là bug người dùng cảm thấy ngay ("sao kéo ngược thế") nhưng không ai đọc code
  // mà thấy được. Khoá lại bằng test.
  const orbit = createOrbit();
  const start = orbit.getState();

  orbit.drag(0, 30);
  assert.ok(orbit.getState().pitch > start.pitch, 'kéo XUỐNG phải TĂNG pitch (nhìn từ trên nhiều hơn)');

  orbit.reset();
  orbit.drag(30, 0);
  assert.ok(orbit.getState().yaw < start.yaw || orbit.getState().yaw > Math.PI,
    'kéo SANG PHẢI phải GIẢM yaw');
});

test('drag báo "có đổi" đúng lúc — chạm rồi thả không được sinh khung hình thừa', () => {
  const orbit = createOrbit();
  assert.equal(orbit.drag(0, 0), false, 'kéo 0 pixel mà báo có đổi ⇒ vẽ thừa mỗi lần chạm');
  assert.equal(orbit.drag(10, 0), true);

  // đã kịch trần pitch rồi mà vẫn kéo tiếp cùng chiều → không đổi nữa
  for (let i = 0; i < 200; i += 1) orbit.drag(0, 500);
  assert.equal(orbit.drag(0, 500), false, 'kéo tiếp khi đã kịch trần vẫn báo có đổi ⇒ vẽ thừa liên tục');
});

test('zoom: kẹp trong khoảng, và báo "có đổi" đúng lúc', () => {
  const orbit = createOrbit({ distance: 26, minDistance: 12, maxDistance: 48 });

  assert.equal(orbit.zoom(0.5), true);
  assert.equal(orbit.getState().distance, 13);

  assert.equal(orbit.zoom(0.5), true);
  assert.equal(orbit.getState().distance, 12, 'phải kẹp ở minDistance');
  assert.equal(orbit.zoom(0.5), false, 'đã kịch min mà còn báo đổi ⇒ vẽ thừa');

  for (let i = 0; i < 20; i += 1) orbit.zoom(2);
  assert.equal(orbit.getState().distance, 48, 'phải kẹp ở maxDistance');
  assert.equal(orbit.zoom(2), false);
});

test('orbitPosition: luôn cách target đúng `distance`, ở mọi góc', () => {
  const target = { x: 3, y: 1, z: -2 };
  for (const yaw of [0, 0.7, Math.PI, 5.9]) {
    for (const pitch of [MIN_PITCH, DEFAULT_PITCH, MAX_PITCH]) {
      const p = orbitPosition({ yaw, pitch, distance: 20, target });
      const d = Math.hypot(p.x - target.x, p.y - target.y, p.z - target.z);
      assert.ok(Math.abs(d - 20) < 1e-9, `sai khoảng cách ở yaw=${yaw} pitch=${pitch}: ${d}`);
    }
  }
});

test('orbitPosition: pitch ngoài khoảng vẫn bị kẹp (không tin bên gọi)', () => {
  const wild = orbitPosition({ yaw: 0, pitch: -10, distance: 20 });
  const clamped = orbitPosition({ yaw: 0, pitch: MIN_PITCH, distance: 20 });
  assert.deepEqual(wild, clamped);
});

test('reset đưa về đúng góc mặc định — cùng hướng nhìn với bộ vẽ 2D', () => {
  const orbit = createOrbit({ distance: 26 });
  orbit.drag(400, 300);
  orbit.zoom(0.5);
  orbit.reset();

  assert.deepEqual(orbit.getState(), {
    yaw: DEFAULT_YAW,
    pitch: DEFAULT_PITCH,
    distance: 26,
    target: { x: 0, y: 0, z: 0 },
  });
});

test('set(): đặt thẳng góc cho hoạt hoạ, bỏ qua giá trị rác', () => {
  const orbit = createOrbit({ minDistance: 12, maxDistance: 48 });

  orbit.set({ yaw: 1, pitch: 0.5, distance: 30 });
  assert.deepEqual(orbit.getState().yaw, 1);
  assert.equal(orbit.getState().pitch, 0.5);
  assert.equal(orbit.getState().distance, 30);

  // NaN/undefined từ một hoạt hoạ tính sai không được phá trạng thái camera
  orbit.set({ yaw: NaN, pitch: undefined, distance: 'gần' });
  assert.equal(orbit.getState().yaw, 1);
  assert.equal(orbit.getState().pitch, 0.5);
  assert.equal(orbit.getState().distance, 30);

  // vẫn phải kẹp
  orbit.set({ pitch: 99, distance: 9999 });
  assert.equal(orbit.getState().pitch, MAX_PITCH);
  assert.equal(orbit.getState().distance, 48);
});

test('getState/getTarget trả BẢN SAO — bên ngoài không sửa lén được camera', () => {
  const orbit = createOrbit();
  const state = orbit.getState();
  state.target.x = 999;
  assert.equal(orbit.getTarget().x, 0, 'trả tham chiếu ⇒ một component vô tình sửa là camera lệch');
});

// ─── KHUNG HÌNH THEO CHIỀU CAO CỦA KỶ ────────────────────────────────────────

test('KHÔNG CẮT NGỌN: công trình cao nhất của mọi kỷ đều nằm trong khung hình', async () => {
  // ⚠️ BÀI TEST NÀY SINH RA TỪ MỘT LỖI ĐO ĐƯỢC, không phải từ lo xa.
  // Khi `massScale` ra đời (2026-08-14), chiều cao công trình trải 0,36–1,72 lần. Với khung hình
  // cố định cũ, nóc tháp kỷ 15 nằm ở 13,7° dưới đường chân trời trong khi mép TRÊN khung hình ở
  // 15,4° — lọt ra ngoài đúng 1,3°, và ảnh quét cho thấy tháp bị cắt cụt nóc. Không có gì đỏ lên:
  // build xanh, lint sạch, 572 bài test xanh. Chỉ có mắt nhìn vào ảnh mới bắt được.
  //
  // Hình học: camera nhìn xuống một góc `pitch`; khung hình trải `fov/2` về mỗi phía. Mép TRÊN
  // khung hình vì vậy nằm ở `pitch − fov/2` (tính từ phương ngang, hướng xuống). Một điểm nằm cao
  // hơn góc đó thì KHÔNG lọt vào ảnh.
  //
  // ⚠️ BỔ SUNG 2026-08-14 (Phase 7B) — VÌ SAO BÀI NÀY PHẢI CỘNG THÊM ĐỘ CAO ĐỊA HÌNH.
  // Bài viết lần đầu dựa trên một mệnh đề khi đó đúng: "thứ cao nhất thành phố = nóc công trình
  // cao nhất". Địa hình có cao độ làm mệnh đề ấy SAI — kỷ 5 nâng nền lên 2,70 đơn vị, tức nóc nhà
  // thật sự ở 5,52 chứ không phải 2,82. Nếu để nguyên, bài test vẫn XANH trong khi ảnh chụp bị cắt
  // ngọn, đúng hình dạng sai của Phase 4D: một luật mới làm điều kiện cũ hết đúng, mà bài test cũ
  // thì canh điều kiện cũ nên không đỏ. Đo lại sau khi cộng: biên hẹp nhất tụt từ 30,6° xuống 22,1°
  // ở kỷ 5 — vẫn qua, nhưng đó là nhờ `TERRAIN_TO_DISTANCE`/`TERRAIN_TO_TARGET_Y` bù vào, và chính
  // phép cộng này mới là thứ chứng minh hai hằng số ấy có tác dụng.
  const [{ buildBuildingSpec }, { BLUEPRINT_CATALOG, BUILDING_EFFECTS }, { buildTerrain }] = await Promise.all([
    import('./buildingSpec.js'),
    import('../constants.js'),
    import('./terrain.js'),
  ]);

  const GRID = 12;
  const halfFov = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;
  // Đòi nóc nhà nằm SÂU trong khung ít nhất 3°, không phải "vừa đúng mép". Vừa đúng mép nghĩa là
  // chỉ cần đổi tỉ lệ khung hình một chút là lại cắt — một hàng rào dựng ngay sát vực.
  const MARGIN = (3 * Math.PI) / 180;

  for (let era = 1; era <= 15; era += 1) {
    const opts = cityOrbitOptions(GRID, era);
    const orbit = createOrbit(opts);
    const { yaw, pitch, distance, target } = orbit.getState();
    const eye = orbitPosition({ yaw, pitch, distance, target });

    // Công trình cao nhất của kỷ. Kỳ quan LUÔN đứng ở khu đất trung tâm (`cityLayout.js`), và kỳ
    // quan cũng luôn là thứ cao nhất — nên đo ở tâm lưới là đo đúng ca xấu nhất có thật.
    const tallest = Math.max(...BLUEPRINT_CATALOG[era].map((bp) => buildBuildingSpec({
      bpId: bp.id, era, rarity: bp.rarity,
      type: BUILDING_EFFECTS[bp.id]?.type ?? 'infrastructure',
      level: 3,
    }).height));

    // Kỳ quan đứng ở khu đất trung tâm, nên nền dưới chân nó là thềm ở giữa lưới. `footprint` với
    // bề rộng 3 ô = đúng cách `sceneGraph.js` đặt công trình: đứng ở cao độ CAO NHẤT dưới bóng mình.
    const groundLift = buildTerrain({ era, gridSize: GRID })
      .footprint(Math.floor(GRID / 2), Math.floor(GRID / 2), 3).top;
    const roof = tallest + groundLift;

    const horizontal = Math.hypot(eye.x, eye.z);
    const angleToRoof = Math.atan2(eye.y - roof, horizontal);
    const topEdge = pitch - halfFov;

    assert.ok(angleToRoof > topEdge + MARGIN,
      `kỷ ${era}: nóc công trình cao nhất (cao ${tallest.toFixed(2)} + đồi ${groundLift.toFixed(2)} `
      + `= ${roof.toFixed(2)} đơn vị) nằm ở `
      + `${((angleToRoof * 180) / Math.PI).toFixed(1)}° trong khi mép trên khung hình ở `
      + `${((topEdge * 180) / Math.PI).toFixed(1)}° ⇒ bị cắt ngọn`);
  }
});

test('ĐỐI CHỨNG: gỡ phần bù địa hình khỏi camera thì kỷ dốc nhất PHẢI cắt ngọn', () => {
  // ⚠️ Không có bài này thì bài trên chỉ đang MAY MẮN, và tôi sẽ không biết.
  // Bài trên xanh với `TERRAIN_TO_DISTANCE`/`TERRAIN_TO_TARGET_Y` hiện tại — nhưng nó cũng xanh nếu
  // hai hằng số đó bằng 0 mà biên vốn đã rộng sẵn. Bài này dựng lại đúng phép tính ấy với camera
  // KHÔNG bù địa hình, rồi đòi kết quả phải THẤT BẠI. Cùng kỷ luật với ô "trường phẳng lì" ở
  // `terrain.test.js`: một ngưỡng không có ca đối chứng là một ngưỡng ai cũng hạ được cho tiện.
  //
  // Kỷ 5 (Burg Eltz trên mỏm đá) là kỷ dốc nhất: 5 thềm × 1,35 = 2,70 đơn vị.
  const GRID = 12;
  const ERA = 5;
  const TALLEST = 2.82;      // nóc kỳ quan kỷ 5 ở cấp 3, đo bằng `buildBuildingSpec` (bài trên)
  const LIFT = 2.70;         // `terrainMaxHeight(5)`
  const halfFov = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;

  // Camera KHÔNG bù địa hình = đúng công thức trước Phase 7B: chỉ theo `massScale`.
  // ⚠️ Gỡ bằng chính hằng số đã cộng vào, KHÔNG chép lại con số — chép lại là "một luật hai công
  // thức", và cái chép lại sẽ đứng yên khi ai đó chỉnh hằng số thật.
  const opts = cityOrbitOptions(GRID, ERA);
  const naive = {
    ...opts,
    distance: opts.distance - LIFT * TERRAIN_TO_DISTANCE,
    target: { ...opts.target, y: opts.target.y - LIFT * TERRAIN_TO_TARGET_Y },
  };
  const { yaw, pitch, distance, target } = createOrbit(naive).getState();
  const eye = orbitPosition({ yaw, pitch, distance, target });
  const angleToRoof = Math.atan2(eye.y - (TALLEST + LIFT), Math.hypot(eye.x, eye.z));
  const topEdge = pitch - halfFov;

  assert.ok(angleToRoof <= topEdge + (3 * Math.PI) / 180,
    'camera KHÔNG bù địa hình mà vẫn lọt khung ⇒ phần bù không phải thứ đang giữ bài trên xanh, '
    + 'và hai hằng số TERRAIN_TO_* đang là số trang trí');
});

test('KHUNG HÌNH SÁT NHẤT CÓ THỂ MÀ VẪN KHÔNG CẮT CÔNG TRÌNH NÀO', async () => {
  const { terrainMaxHeight } = await import('./terrain.js');
  // ⚠️ BÀI NÀY THAY BÀI CŨ `KỶ THẤP GIỮ NGUYÊN KHUNG SÁT` (Phase 19, VIỆC 5) — VÀ LÝ DO PHẢI THAY
  // MỚI LÀ THỨ ĐÁNG ĐỌC, KHÔNG PHẢI BỘ SỐ MỚI.
  //
  // Bài cũ kẹp trần ở `1,35 lần mức sát`, dựng từ lời Đàm ở Phase 5A: *"thu phóng cho vừa đủ thôi,
  // không thu quá xa rồi bị mờ"*. Lời ấy vẫn đúng. Nhưng cái TRẦN thì **không thể cùng đúng** với
  // lời hứa "không công trình nào bị mép khung cắt": đo bằng `frame-fit.mjs` thì 13/15 kỷ cần từ
  // **1,47** trở lên, cao nhất kỷ 8 = **1,88**. Nghĩa là suốt từ Phase 5A tới nay, cái trần 1,35
  // chính là THỨ SINH RA `TECH_DEBT #24` — nó bảo đảm 14/15 kỷ phải cắt mất một công trình, và nó
  // xanh suốt vì chưa ai đặt hai lời hứa ấy cạnh nhau. Một cái trần và một lời hứa loại trừ nhau
  // thì cái xanh không phải cái đúng, nó chỉ là cái được viết ra trước.
  //
  // ⇒ Thứ thay thế KHÔNG phải một con số to hơn (nới ngưỡng = cái phễu Phase 9A). Nó là chính cái
  // QUAN HỆ mà Đàm muốn: **camera không được lùi xa hơn MỘT LI so với mức vừa đủ để lọt hết**.
  // Cách canh ấy chặt hơn `1,35` rất nhiều — 1,35 cho phép mọi kỷ lùi tuỳ ý miễn dưới trần, còn
  // bài này thì mỗi kỷ chỉ có ĐÚNG MỘT khoảng cách hợp lệ. Đúng bài học Phase 7D: một lời hứa nói
  // về QUAN HỆ ("vừa đủ") thì phải viết thành quan hệ, đừng viết thành một mức.
  const GRID = 12;
  const BASE = GRID * CAMERA_DISTANCE_FACTOR;

  // (a) LỜI HỨA CHÍNH: không kỷ nào còn công trình bị mép khung cắt.
  for (let era = 1; era <= 15; era += 1) {
    const opts = cityOrbitOptions(GRID, era);
    const xau = worstFrameMargin(cityFrameBoxes(era, GRID), {
      distance: opts.distance, targetY: opts.target.y,
    });
    assert.ok(xau.margin >= FRAME_FIT_MARGIN - 1e-6,
      `kỷ ${era}: ${xau.id} lọt ra ngoài mép ${xau.edge} `
      + `(biên ${xau.margin.toFixed(3)} < ${FRAME_FIT_MARGIN})`);
  }

  // (b) KHÔNG MỘT LI THỪA. Đây là vế ĐỐI CHỨNG, và nó là chỗ lời Đàm ở Phase 5A vẫn sống: thiếu
  // nó thì (a) vẫn xanh ngay cả khi ai đó nhân đôi mọi khoảng cách "cho chắc ăn", tức quay lại
  // đúng cái *"thu quá xa rồi bị mờ"*. Cách canh: biên thật phải BẰNG mức fit đã nhắm, không được
  // rộng hơn — 14/15 kỷ đo được đúng `0,0400`, tức camera đứng ở khoảng cách sát nhất có thể.
  //
  // ⚠️ NGOẠI LỆ TƯỜNG MINH ĐẾM ĐƯỢC, KHÔNG NỚI NGƯỠNG CHO CẢ BẢNG (`TECH_DEBT #44`). Kỷ 15 ra
  // `0,0736` vì `cityOrbitOptions` lấy `max()` của HAI đường: khoảng cách theo `massScale` (1,571)
  // vốn đã lớn hơn mức fit cần (1,52), nên ở kỷ ấy fit không phải bên quyết định. Đó là dư địa
  // THẬT (~3,3%) và nó có lý do đọc được, không phải nhiễu. Thêm một kỷ thứ hai vào danh sách này
  // là thêm một kỷ bị thu nhỏ vô cớ, và kỷ 15 rơi ra cũng phải xem lại — cả hai chiều đều đỏ.
  const DU_DIA = [];
  for (let era = 1; era <= 15; era += 1) {
    const opts = cityOrbitOptions(GRID, era);
    const xau = worstFrameMargin(cityFrameBoxes(era, GRID), {
      distance: opts.distance, targetY: opts.target.y,
    });
    if (xau.margin > FRAME_FIT_MARGIN + 1e-3) DU_DIA.push(era);
  }
  assert.deepEqual(DU_DIA, [15],
    `những kỷ đứng XA HƠN mức vừa đủ đã đổi: ${JSON.stringify(DU_DIA)}`);

  // (c) SÀN GIỮ NGUYÊN, KHÔNG ĐỔI MỘT CHỮ SỐ. Vế này chưa bao giờ mâu thuẫn với lời hứa nào:
  // thiếu nó thì một bản sửa "dí thật gần cho rõ" sẽ cắm camera vào giữa thành phố mà không có gì
  // đỏ lên.
  for (let era = 1; era <= 15; era += 1) {
    const ratio = cityOrbitOptions(GRID, era).distance / BASE;
    assert.ok(ratio >= 0.86,
      `kỷ ${era} dí vào ${ratio.toFixed(2)} lần mức sát — camera chui vào giữa thành phố`);
  }

  // (d) ĐIỂM NGẮM vẫn không được nâng lên vô cớ — vế này của bài cũ giữ nguyên, vì nó nói về
  // `target.y` chứ không nói về khoảng cách, nên VIỆC 5 không chạm tới nó.
  for (const era of [1, 2]) {
    const opts = cityOrbitOptions(GRID, era);
    const targetMassOnly = opts.target.y - terrainMaxHeight(era) * TERRAIN_TO_TARGET_Y;
    assert.ok(Math.abs(targetMassOnly) < 1e-9,
      `kỷ ${era}: nâng điểm ngắm lên vô cớ ⇒ mặt đất tụt khỏi khung (${targetMassOnly.toFixed(3)})`);
  }
});

test('kỷ lạ vẫn ra được khung hình dùng được', () => {
  for (const era of [0, 16, NaN, undefined, 'bảy']) {
    const opts = cityOrbitOptions(12, era);
    assert.ok(Number.isFinite(opts.distance) && opts.distance > 0, `kỷ ${era}: khoảng cách hỏng`);
    assert.ok(Number.isFinite(opts.target.y), `kỷ ${era}: điểm ngắm hỏng`);
  }
});
