/**
 * human-scale.mjs — CƯ DÂN CAO BAO NHIÊU ĐIỂM ẢNH TRÊN MÀN HÌNH ĐÀM?
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO PHẢI CÓ FILE NÀY, VÀ VÌ SAO NÓ KHÔNG ĐƯỢC TỰ VIẾT CÔNG THỨC CAMERA
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Trước khi bỏ công dựng một cơ thể có khớp, phải trả lời được câu hỏi rẻ hơn nhiều: *ở cỡ thật,
 * mắt có đọc ra nổi cái khớp ấy không?* Trả lời câu đó bằng suy luận là cách chắc chắn nhất để
 * dựng xong rồi mới biết mình vừa dựng một thứ nhỏ hơn một điểm ảnh.
 *
 * ⚠️ TUYỆT ĐỐI KHÔNG VIẾT CÔNG THỨC CHIẾU RIÊNG. Cám dỗ ở đây rất lớn: công thức
 * `px = H * Hpx / (2 · d · tan(fov/2))` viết ra chỉ mất một dòng và trông đúng. Nhưng nó là một
 * công thức THỨ HAI song song với thứ three thật sự dùng để vẽ, và dự án này đã trả giá 22 lần cho
 * đúng hình dạng ấy (`sweep-score.mjs` chép hình học của `city-preview.mjs` rồi lệch mặc định
 * `--cell`; `sceneGraph.js` DỰ ĐOÁN số tam giác trong khi `renderer.info` biết chính xác). Nên ở
 * đây: dựng ĐÚNG camera mà `CityScene3D.jsx` dựng (`cityOrbitOptions` + `CITY_CAMERA_FOV` +
 * `createOrbit`), rồi gọi `camera.project()` của chính three trên hai điểm bàn-chân/đỉnh-đầu.
 * Không có phép nhân nào của tôi nằm giữa.
 *
 * ⚠️ VÀ KÍCH THƯỚC KHUNG PHẢI ĐO, KHÔNG ĐƯỢC ĐOÁN. Hai con số 918×569 (máy bàn 1280) và 324×201
 * (iPhone 390) lấy từ `node scripts/shot.mjs --tab "Thành Phố" --probe …` trên bản dựng thật, chứ
 * không phải từ việc đọc CSS rồi nhân nhẩm. Truyền `--viewport WxH` để đo khung khác.
 *
 * ⚠️ ĐÃ ĐỐI CHIẾU VỚI ẢNH THẬT, VÀ LẦN ĐỐI CHIẾU ẤY BẮT ĐƯỢC MỘT LỖI TRONG CHÍNH FILE NÀY.
 * `--selftest` bên dưới chỉ chứng minh phép chiếu NHẤT QUÁN VỚI CHÍNH NÓ; nó không chứng minh
 * con số khớp với thứ máy vẽ ra. Phép đối chiếu độc lập là dựng mặt nạ rồi đếm điểm ảnh:
 *
 *   node scripts/city-preview.mjs --era 7 --hour 12 --width 918 --height 569 --sessions 80 \
 *     --mask resident,resident-head
 *
 * rồi gom cụm liên thông trên ảnh ấy. Kết quả ngày 2026-08-22 (kỷ 7, giữa trưa):
 *   máy bàn 918×569 — ảnh thật trung vị 11,0 điểm ảnh · file này 11,1
 *   iPhone 324×201  — ảnh thật trung vị  4,0 điểm ảnh · file này  3,9
 * Bản ĐẦU của file này ra 8,1 cho ca thứ nhất (lệch 1,36 lần) vì nó chiếu một ĐOẠN THẲNG thay vì
 * một KHỐI — xem chú thích hàm `silhouette`.
 *
 * Dùng:
 *   node --import ./scripts/register-esm-loader.mjs scripts/human-scale.mjs
 *   node --import ./scripts/register-esm-loader.mjs scripts/human-scale.mjs --eras 1,7,15
 *   node --import ./scripts/register-esm-loader.mjs scripts/human-scale.mjs --gait
 *   node --import ./scripts/register-esm-loader.mjs scripts/human-scale.mjs --selftest
 */
import { PerspectiveCamera, Vector3 } from 'three';

import { computeCityLayout } from '../src/engine/cityLayout.js';
import { BLUEPRINT_CATALOG } from '../src/engine/constants.js';
import { CITY_CAMERA_FOV, cityOrbitOptions, createOrbit } from '../src/engine/city3d/orbit.js';
import { buildTerrain } from '../src/engine/city3d/terrain.js';
import { buildResidents, residentAt } from '../src/engine/city3d/residents.js';
import { buildHumanBody, buildHumanBodyLowDetail } from '../src/engine/city3d/human.js';
import { partCornersAt, poseAt } from '../src/engine/city3d/humanPose.js';
import { cellToWorld } from '../src/components/city/render3d/sceneGraph.js';

const argv = process.argv;
const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const has = (f) => argv.includes(f);

/**
 * Khung 3D THẬT, đo bằng `shot.mjs --probe` trên bản dựng ngày 2026-08-22.
 * ⚠️ Đây là số ĐO, không phải số đoán — đổi bố cục màn Thành Phố thì phải đo lại, y như luật đã
 * ghi cho `TEXT_ENDS_PCT` của lớp phủ trang chủ.
 *
 * ⚠️ DÒNG ĐẦU LÀ MÁY THẬT CỦA ĐÀM, KHÔNG PHẢI MỘT "MÁY BÀN" GIẢ ĐỊNH. Bản đầu của file này lấy
 * `--width 1280` vì đó là mặc định của `shot.mjs`, và 1280 là một con số tôi tự chọn chứ không ai
 * dùng. MacBook Air M3 13,6 inch chạy ở **1470 × 956 điểm logic** (`osascript` hỏi Finder, panel
 * thật 2560 × 1664 nên `devicePixelRatio` báo 2). Chrome toàn màn hình ⇒ khung 3D **990 × 614**,
 * tức rộng hơn con số giả định 8%. Một khung hình đoán mò thì mọi kết luận "đọc ra được hay không"
 * đều nói về màn hình của người khác.
 *
 * ⚠️ iPhONE GIỮ LẠI DÙ ĐÀM ĐÃ NÓI KHÔNG NHẮM TỚI NÓ (2026-08-22). Bỏ hẳn dòng ấy đi thì phiên sau
 * sẽ đọc sự im lặng thành "chỗ đó cũng ổn". Nó ở đây để nói rõ: cỡ này KHÔNG đọc được trên iPhone,
 * và đó là một đánh đổi đã biết, không phải một chỗ chưa ai nhìn tới.
 */
const VIEWPORTS = [
  { name: 'MacBook Air M3', w: 990, h: 614 },
  { name: 'iPhone 390', w: 324, h: 201 },
];

/** Các mức thu-phóng đáng quan tâm: mặc định, và sát nhất mà `createOrbit` cho phép. */
const ZOOMS = ['mặc định', 'sát nhất'];

function dựngThànhPhố(era, sessions = 80) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const stats = { sessionCount: sessions, streakLength: 9 };
  const layout = computeCityLayout({ built, levels, era, stats });
  return { layout, stats };
}

/**
 * Camera y hệt `CityScene3D.jsx`: cùng `cityOrbitOptions`, cùng `CITY_CAMERA_FOV`, cùng
 * `createOrbit`, và tỉ lệ khung lấy từ chính bề ngang/chiều cao ĐO ĐƯỢC của khung 3D.
 * `sát` = kéo `dist` về `minDistance` bằng chính API của orbit (`zoom` rất lớn), chứ không tự
 * gán `opts.minDistance` — để nếu orbit đổi luật kẹp thì phép đo đi theo.
 */
function cameraCủa(layout, viewport, sát) {
  const opts = cityOrbitOptions(layout.gridSize, layout.era);
  const orbit = createOrbit(opts);
  if (sát) orbit.zoom(1e-6);                 // nhân xuống dưới mọi trần → orbit tự kẹp về `minDistance`
  const eye = orbit.getPosition();
  const target = orbit.getTarget();
  const camera = new PerspectiveCamera(CITY_CAMERA_FOV, viewport.w / viewport.h, 0.5, layout.gridSize * 8);
  camera.position.set(eye.x, eye.y, eye.z);
  camera.lookAt(target.x, target.y, target.z);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  return { camera, dist: Math.hypot(eye.x - target.x, eye.y - target.y, eye.z - target.z) };
}

/** Đổi một điểm thế giới sang toạ độ ĐIỂM ẢNH bằng phép chiếu CỦA THREE. */
function sangĐiểmẢnh(camera, viewport, x, y, z) {
  const v = new Vector3(x, y, z).project(camera);
  return { px: (v.x * 0.5 + 0.5) * viewport.w, py: (0.5 - v.y * 0.5) * viewport.h };
}

/**
 * Chiều cao SILHOUETTE (hình bóng) trên màn hình, tính bằng điểm ảnh CSS.
 *
 * ⚠️ ĐÂY LÀ BẢN VÁ CỦA MỘT LẦN CÔNG CỤ NÓI DỐI — bản đầu của chính file này chỉ chiếu MỘT ĐOẠN
 * THẲNG từ bàn chân lên đỉnh đầu, và cho ra trung vị 8,1 điểm ảnh cho kỷ 7 máy bàn. Đo lại trên
 * ẢNH THẬT (mặt nạ `--mask resident`) thì ra 11,0 — lệch 1,36 lần. Nguyên nhân: một con người là
 * một KHỐI ĐẶC, không phải một đoạn thẳng. Camera nhìn chếch 34° từ trên xuống nên mặt trên của
 * khối cũng chiếm chỗ theo chiều DỌC màn hình, và mắt thì đọc cái hình bóng ấy chứ không đọc cái
 * trục.
 *
 * ⚠️ VÀ ĐÂY LÀ BẢN VÁ THỨ HAI: nó nay hỏi ĐÚNG BỘ HỘP mà `sceneGraph.js` dựng (`buildHumanBody` +
 * `partCornersAt`), chứ không dựng lại một mô hình 2 hộp riêng. Bản trước chép tay mô hình cũ vào
 * đây, nên từ lúc cư dân có khớp thì nó đo một thành phố KHÔNG CÒN TỒN TẠI — đúng cái bẫy
 * `countTriangles` (Phase 8B): một phép đo song song với thứ nó nói là đang đo.
 */
function silhouette(camera, viewport, body, pose, { x, z, chân, góc }) {
  const cosG = Math.cos(-góc);
  const sinG = Math.sin(-góc);
  let trên = Infinity;
  let dưới = -Infinity;
  let trái = Infinity;
  let phải = -Infinity;
  for (const part of body.parts) {
    for (const c of partCornersAt(part, pose)) {
      // Xoay quanh trục đứng đúng như `rotation.setFromAxisAngle(UP, -spot.angle)` ở sceneGraph.
      const wx = c.x * cosG - c.z * sinG;
      const wz = c.x * sinG + c.z * cosG;
      const p = sangĐiểmẢnh(camera, viewport, x + wx, chân + c.y, z + wz);
      if (p.py < trên) trên = p.py;
      if (p.py > dưới) dưới = p.py;
      if (p.px < trái) trái = p.px;
      if (p.px > phải) phải = p.px;
    }
  }
  return { cao: dưới - trên, rộng: phải - trái };
}

/**
 * Chiều cao TRÊN MÀN HÌNH của từng cư dân, tính bằng điểm ảnh CSS.
 * Trả về mảng, vì người đứng gần camera to hơn người đứng xa — một con số trung bình giấu mất
 * đúng cái khoảng ấy.
 *
 * `pha` ép mọi cư dân về CÙNG một pha bước (0…1) thay vì pha thật của họ — cần cho phép đo dáng
 * đi, nơi phải so hai tư thế cụ thể chứ không so hai đám đông.
 */
function chiềuCaoCưDân(era, viewport, sát, { thời = 17.5, pha = null, lod = false, trục = false } = {}) {
  const { layout, stats } = dựngThànhPhố(era);
  const { camera, dist } = cameraCủa(layout, viewport, sát);
  const terrain = buildTerrain({ era, gridSize: layout.gridSize });
  const residents = buildResidents(layout, stats);
  const body = lod ? buildHumanBodyLowDetail(era) : buildHumanBody(era);
  const chu = poseAt(body, 0).cycle;
  const cao = [];
  const rộng = [];
  for (const route of residents) {
    const spot = residentAt(route, thời);
    if (!spot) continue;
    const { x, z } = cellToWorld(spot.x, spot.y, layout.gridSize);
    const chân = terrain.heightAt(spot.x, spot.y);
    const pose = poseAt(body, pha === null ? spot.travelled : chu * pha);
    if (trục) {
      // ⚠️ CHỈ CHIẾU MỘT ĐOẠN THẲNG từ mặt đất lên đỉnh đầu — dùng KHI VÀ CHỈ KHI đang hỏi về
      // TỈ LỆ giữa hai kỷ. Hình bóng đầy đủ chứa bề dày hộp chiếu xuống trục dọc, mà bề dày ấy
      // gần như KHÔNG ĐỔI giữa hai kỷ, nên nó nằm trong cả tử lẫn mẫu và pha loãng tỉ lệ thật
      // (đo được 1,10 thay vì 1,18). Đúng hình dạng `TECH_DEBT #22` và Performance Gate vòng 2.
      // Cho câu hỏi "Đàm thấy người cao mấy điểm ảnh" thì hình bóng mới đúng — xem chú thích hàm.
      const a = sangĐiểmẢnh(camera, viewport, x, chân, z);
      const b = sangĐiểmẢnh(camera, viewport, x, chân + body.dims.height, z);
      cao.push(Math.abs(a.py - b.py));
      rộng.push(0);
      continue;
    }
    const s = silhouette(camera, viewport, body, pose, { x, z, chân, góc: spot.angle });
    cao.push(s.cao);
    rộng.push(s.rộng);
  }
  return { cao, rộng, dist, số: residents.length };
}

const f1 = (n) => n.toFixed(1);

function bảng() {
  const eras = (arg('--eras', '1,7,15')).split(',').map(Number);
  console.log('CHIỀU CAO CƯ DÂN TRÊN MÀN HÌNH (điểm ảnh CSS) — chiếu bằng chính three\n');
  console.log(`  FOV dọc ${CITY_CAMERA_FOV}° · hình bóng của ĐÚNG bộ hộp mà cảnh dựng\n`);
  console.log('  khung 3D           kỷ  thu-phóng   k.cách   thấp nhất  cao nhất  trung vị  số người');
  console.log('  ' + '─'.repeat(88));
  for (const vp of VIEWPORTS) {
    for (const era of eras) {
      for (const [i, nhãn] of ZOOMS.entries()) {
        const { cao, dist, số } = chiềuCaoCưDân(era, vp, i === 1);
        const sorted = cao.slice().sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)] ?? 0;
        console.log(`  ${(vp.name + ` (${vp.w}×${vp.h})`).padEnd(19)}${String(era).padStart(2)}`
          + `  ${nhãn.padEnd(10)}${f1(dist).padStart(6)}`
          + `${f1(sorted[0] ?? 0).padStart(11)}${f1(sorted[sorted.length - 1] ?? 0).padStart(10)}`
          + `${f1(med).padStart(10)}${String(số).padStart(10)}`);
      }
    }
  }
}

/**
 * ⚠️ PHÉP TỰ KIỂM PHẢI CHẠM TỪNG CHIỀU NÓ MUỐN BẢO CHỨNG (bài học Phase 4G/7B). Ba ca dưới đây
 * lần lượt vặn: chiều cao vật (trục dọc thế giới), khoảng cách camera (trục sâu), và bề cao khung
 * (trục điểm ảnh). Một ca duy nhất kiểu "đổi cái gì đó rồi thấy số nhảy" chỉ chứng minh phép đo CÓ
 * nối, không chứng minh nó nối ĐÚNG chiều.
 */
function tựKiểm() {
  const vp = VIEWPORTS[0];
  let hỏng = 0;
  const đòi = (tên, thật, mong, dung = 0.02) => {
    const ok = Math.abs(thật - mong) <= dung * Math.abs(mong);
    console.log(`  ${ok ? '✓' : '✗'} ${tên}: đo ${f1(thật)} · đòi ≈ ${f1(mong)}`);
    if (!ok) hỏng += 1;
  };
  const tb = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const gốc = tb(chiềuCaoCưDân(7, vp, false).cao);

  // (1) TRỤC ĐIỂM ẢNH — khung cao gấp đôi thì cùng vật chiếm gấp đôi điểm ảnh.
  //     ⚠️ Phải giữ NGUYÊN tỉ lệ khung, nếu không FOV ngang đổi theo và phép thử trộn hai nguyên
  //     nhân (đúng bài học "đổi giờ trong ngày làm mờ hai nguyên nhân", Phase 9B).
  const khungTo = { name: 'thử', w: vp.w * 2, h: vp.h * 2 };
  đòi('khung cao gấp 2 ⇒ điểm ảnh gấp 2', tb(chiềuCaoCưDân(7, khungTo, false).cao), gốc * 2);

  // (2) TRỤC SÂU — kéo sát thì phải TO RA, và to đúng theo tỉ lệ khoảng cách.
  const sát = chiềuCaoCưDân(7, vp, true);
  const xa = chiềuCaoCưDân(7, vp, false);
  đòi('kéo sát ⇒ to lên theo tỉ lệ k.cách', tb(sát.cao), tb(xa.cao) * (xa.dist / sát.dist), 0.12);

  // (3) TRỤC TẦM VÓC — kỷ 1 khai `stature` 1,18 nên phải cao hơn kỷ 7 (mốc phổ thông, 1,00) đúng
  //     chừng ấy lần, sau khi bù chênh lệch khoảng cách camera giữa hai kỷ.
  //     ⚠️ PHẢI ĐO TRÊN THÂN TRẦN (`lod`), KHÔNG ĐO TRÊN HÌNH BÓNG ĐẦY ĐỦ. Bản đầu của ca này đo
  //     hình bóng đầy đủ và ra 1,30 thay vì 1,18 — không phải vì `stature` sai, mà vì kỷ 1 VÁC
  //     GIÁO, và cây giáo cao hơn đỉnh đầu 27%. Phép đo đang chứa một thứ nó không định hỏi. Đúng
  //     họ với bài học `|Δ|` bị cái dốc át ở Phase 9A — chỉ khác là lần này tôi tự gây ra nó trong
  //     chính phiên đang viết công cụ.
  const k1 = chiềuCaoCưDân(1, vp, false, { trục: true });
  const k7 = chiềuCaoCưDân(7, vp, false, { trục: true });
  đòi('kỷ 1 cao hơn kỷ 7 đúng 1,18 lần',
    tb(k1.cao) / tb(k7.cao) * (k1.dist / k7.dist), 1.18, 0.05);

  // (4) ĐỐI CHỨNG NHỐT MÔ HÌNH CŨ — và nó phải nhốt đúng thứ đáng nhốt.
  //     ⚠️ Bản đầu đòi "cơ thể có khớp phải RỘNG HƠN 2 hộp cũ" và ĐỎ (0,9 lần). Nó đỏ ĐÚNG, chỉ
  //     là nó đang canh một thứ chẳng ai hứa: hộp thân của mô hình cũ rộng 0,085 ô = 42% chiều
  //     cao người (rất mập, một con súc sắc), còn thân mới rộng 25% (gần tỉ lệ người thật). Cơ
  //     thể mới HẸP hơn là ĐÚNG THIẾT KẾ. Thứ thật sự đáng khoá là điều mô hình cũ KHÔNG LÀM ĐƯỢC:
  //     đổi hình bóng theo pha bước.
  const đổi = (lod) => Math.abs(
    tb(chiềuCaoCưDân(1, vp, false, { pha: 0, lod }).rộng)
    - tb(chiềuCaoCưDân(1, vp, false, { pha: 0.25, lod }).rộng),
  );
  const mới = đổi(false);
  const cũ = đổi(true);
  // ⚠️ NGƯỠNG 0,05 px CHỨ KHÔNG PHẢI 0 TUYỆT ĐỐI, và lý do đáng ghi: mô hình 2 hộp KHÔNG có khớp
  // nào quay, nhưng nó vẫn NHÚN — `bob` nằm ở chiều cao hông, tức cả hai hộp dịch lên xuống theo
  // pha bước. Dịch chỗ thì phối cảnh đổi một tí, và bề rộng trên màn hình đổi theo. Đo được
  // 0,0083 px, tức 1/280 của tín hiệu thật. Ở tầng thuần (`humanPose.test.js`) con số ấy là 0
  // TUYỆT ĐỐI vì ở đó không có phối cảnh — hai phép đo trả lời hai câu khác nhau, và cả hai đúng.
  const ok = mới > 1 && cũ < 0.05;
  console.log(`  ${ok ? '✓' : '✗'} đối chứng: dáng đi đổi ${f1(mới)} px, mô hình 2 hộp cũ đổi`
    + ` ${cũ.toFixed(4)} px (phải > 1 và < 0,05)`);
  if (!ok) hỏng += 1;

  console.log(hỏng === 0 ? '\n  TỰ KIỂM ĐẠT' : `\n  TỰ KIỂM HỎNG ${hỏng} ca`);
  process.exitCode = hỏng === 0 ? 0 : 1;
}

/**
 * DÁNG ĐI ĐỔI ĐƯỢC BAO NHIÊU ĐIỂM ẢNH — câu hỏi cuối cùng, và câu duy nhất quyết định việc dựng
 * khớp có đáng hay không.
 *
 * ⚠️ VÌ SAO ĐO Ở ĐÂY CHỨ KHÔNG ĐO TRÊN ẢNH CHỤP. Đã thử đo trên ảnh (theo dõi từng cụm điểm ảnh
 * qua 4 khung của một chu kỳ bước) và **phép đo ấy hỏng**: trong 0,57 giây cư dân đi được ~10
 * điểm ảnh, đi khuất sau cây, rẽ ở góc phố, và lại gần/ra xa camera. Đối chứng mô hình 2 hộp cho
 * ra diện tích hình bóng đổi **94,2%** — mà mô hình ấy KHÔNG có khớp nào, tức 94,2% ấy toàn là
 * che khuất và rẽ hướng. Tín hiệu dáng đi nằm chìm dưới sàn nhiễu đó (1,2 tới 1,3 lần), nên con
 * số rút ra được từ ảnh là vô nghĩa — đúng bài học Phase 9B: *"đại lượng tôi đang đo có chứa thứ
 * tôi KHÔNG muốn đo không?"*.
 * ⇒ Ở đây ép mọi cư dân về CÙNG một pha, giữ nguyên vị trí và hướng, rồi so hai pha. Mọi nguyên
 * nhân khác bị giữ cố định, chỉ còn tư thế. Phép chiếu vẫn là phép chiếu của three.
 */
function dángĐi() {
  console.log('DÁNG ĐI ĐỔI HÌNH BÓNG BAO NHIÊU ĐIỂM ẢNH (cùng chỗ, cùng hướng, khác pha)\n');
  console.log('  khung 3D            kỷ   cao(pha 0)  rộng(pha 0)  rộng(pha ¼)  ĐỔI   so 2 hộp cũ');
  console.log('  ' + '─'.repeat(78));
  const tb = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  for (const vp of VIEWPORTS) {
    for (const era of (arg('--eras', '1,7')).split(',').map(Number)) {
      const p0 = chiềuCaoCưDân(era, vp, false, { pha: 0 });
      const p4 = chiềuCaoCưDân(era, vp, false, { pha: 0.25 });
      const c0 = chiềuCaoCưDân(era, vp, false, { pha: 0, lod: true });
      const c4 = chiềuCaoCưDân(era, vp, false, { pha: 0.25, lod: true });
      const đổi = tb(p0.rộng) - tb(p4.rộng);
      const đổiCũ = Math.abs(tb(c0.rộng) - tb(c4.rộng));
      console.log(`  ${(vp.name + ` (${vp.w}×${vp.h})`).padEnd(20)}${String(era).padStart(2)}`
        + `${f1(tb(p0.cao)).padStart(11)}${f1(tb(p0.rộng)).padStart(13)}${f1(tb(p4.rộng)).padStart(13)}`
        + `${f1(đổi).padStart(7)}${f1(đổiCũ).padStart(14)}`);
    }
  }
  console.log('\n  Cột cuối là ĐỐI CHỨNG: mô hình 2 hộp không có khớp nên nó PHẢI ra 0,0.');
}

if (has('--selftest')) tựKiểm();
else if (has('--gait')) dángĐi();
else bảng();
