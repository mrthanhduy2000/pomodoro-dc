import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FLIGHT_SAMPLES,
  FOCUS_CLEARANCE,
  FOCUS_VIEW_DISTANCE,
  boxDistance,
  flightState,
  focusZoom,
  nearestBlocker,
  pathClearance,
  pathGuarantee,
  planCityFocus,
} from './cityFocus.js';
import {
  CITY_CAMERA_FOV,
  DEFAULT_PITCH,
  DEFAULT_YAW,
  MAX_PITCH,
  MIN_PITCH,
  cityOrbitOptions,
  createOrbit,
  orbitPosition,
} from './orbit.js';
import { specBounds, placeBounds } from './pick.js';
import { collectCitySpecs, KIND_NGOAI_LUOI } from './cityParts.js';
import { buildTerrain } from './terrain.js';
import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';

const GRID = 12;
/**
 * ⚠️ CHÉP TỪ `sceneGraph.js`, và bài test biết rõ mình đang chép.
 *
 * Hai con số này (`BUILDING_SCALE`, cách quy ô lưới ra toạ độ thế giới) sống trong một file có
 * `import 'three'`, nên `node --test` không nạp được. Bản dựng lại dưới đây KHÔNG phải nguồn sự
 * thật về vật cản — nguồn sự thật là `city.blockers`, do chính `sceneGraph.js` đọc thẳng từ danh
 * sách khối nó vừa đem đi dựng hình, và có `sceneGraphWiring.test.js` canh đường dây ấy.
 * Việc của bản dựng lại ở đây chỉ là tạo ra một THÀNH PHỐ CÓ THẬT-CỠ để thử phép canh: cao 2,5–7,5
 * đơn vị, rộng 6–8 đơn vị bán kính. Bài `THÀNH PHỐ DỰNG THỬ PHẢI ĐÚNG CỠ` bên dưới khẳng định
 * điều đó bằng số, nên nếu ngày nào mã thật đổi tỉ lệ công trình thì con số ở đây sẽ lệch khỏi tài
 * liệu và có người phải xem lại.
 */
const BUILDING_SCALE = 1.3;
const cellToWorld = (x, y) => ({ x: x - (GRID - 1) / 2, z: y - (GRID - 1) / 2 });

function specSpan(parts) {
  let span = 0;
  for (const part of parts ?? []) {
    span = Math.max(
      span,
      Math.abs(part.x ?? 0) + (part.w ?? 0) / 2,
      Math.abs(part.z ?? 0) + (part.d ?? part.w ?? 0) / 2,
    );
  }
  return span * 2;
}

/** Một thành phố đã trưởng thành của kỷ `era`: vật cản + hộp bao của 5 công trình mốc. */
function buildCity(era) {
  const built = (BLUEPRINT_CATALOG[era] ?? []).map((bp) => bp.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  const layout = computeCityLayout({
    built, levels, era, stats: { sessionCount: 40, streakLength: 9 },
  });
  const terrain = buildTerrain({ era, gridSize: GRID });
  const blockers = [];
  const landmarks = [];
  const nhaOnly = [];   // chỉ CÔNG TRÌNH — dùng cho bài đối chứng "cảnh vật có trói camera không"

  let soVungQue = 0;
  for (const item of collectCitySpecs({ layout, detail: 'high' })) {
    const src = item.source;
    /**
     * ⚠️ MỌI THỨ NGOÀI LƯỚI CỐ Ý ĐỨNG NGOÀI DANH SÁCH VẬT CẢN — cùng luật với `sceneGraph.js`, đọc
     * lý do đầy đủ ở đó (tóm tắt: cho cái cây vào mà bỏ quả đồi nó đứng trên thì tệ hơn không cho
     * gì; kỷ 8 có mặt đất vùng quê dâng tới +2,18 mà bộ lập kế hoạch không hề biết — `TECH_DEBT
     * #54`). Vùng phụ cận (Phase 13) thừa hưởng đúng lý do ấy.
     *
     * ⚠️ VÀ CÂU "cùng luật với `sceneGraph.js`" NAY LÀ MỘT SỰ THẬT ĐƯỢC MÃ BẢO ĐẢM, KHÔNG CÒN LÀ
     * MỘT LỜI TỰ NHẬN. Bản trước viết thẳng `item.kind === 'outskirt'` ở đây và `placement.vungQue`
     * ở bên kia — hai công thức cho một luật, và chúng trôi khỏi nhau đúng cái ngày Phase 13 thêm
     * loại khối thứ sáu: bài test này đỏ với `bán kính phố = 21,44`, một con số nói về một thành
     * phố không tồn tại. Nay cả hai bên đọc `KIND_NGOAI_LUOI` ở `cityParts.js`.
     *
     * ⚠️ VÀ NÓ PHẢI ĐƯỢC **ĐẾM**, không được `continue` im lặng. Một `continue` đặt nhầm chỗ sẽ
     * lặng lẽ nuốt luôn nhà cửa và cả bài test này đo một thành phố rỗng mà vẫn xanh — bài
     * `THÀNH PHỐ DỰNG THỬ PHẢI ĐÚNG CỠ` bên dưới đòi con số này khác 0.
     */
    if (KIND_NGOAI_LUOI.has(item.kind)) { soVungQue += 1; continue; }
    let box;
    if (item.kind === 'prop') {
      const ux = src.x + (src.ox ?? 0);
      const uy = src.y + (src.oy ?? 0);
      const { x, z } = cellToWorld(ux, uy);
      box = placeBounds(specBounds(item.spec), { x, z, y: terrain.surfaceHeightAt(ux, uy), scale: 1 });
    } else {
      const { x, z } = cellToWorld(src.x, src.y);
      const span = Math.max(1, Math.round(specSpan(item.spec.parts) * BUILDING_SCALE));
      box = placeBounds(specBounds(item.spec), {
        x, z, y: terrain.footprint(src.x, src.y, span).top, scale: BUILDING_SCALE,
      });
    }
    if (!box) continue;
    blockers.push(box);
    if (item.kind !== 'prop') nhaOnly.push(box);
    if (item.kind === 'building') landmarks.push(box);
  }
  return { blockers, landmarks, nhaOnly, soVungQue, orbit: cityOrbitOptions(GRID, era) };
}

const centreOf = (box) => ({
  x: (box.minX + box.maxX) / 2,
  y: (box.minY + box.maxY) / 2,
  z: (box.minZ + box.maxZ) / 2,
});

/** Bốn hướng nhìn cách đều — Đàm có thể đã xoay thành phố tới bất kỳ đâu trước khi chạm. */
const YAWS = [0, 1, 2, 3].map((k) => DEFAULT_YAW + (k * Math.PI) / 2);

/**
 * BỐN GÓC NHÌN XUẤT PHÁT, và đây KHÔNG phải chi tiết trang trí — nó là thứ làm cả bài đối chứng
 * bên dưới sống hay chết.
 *
 * Bản đầu của bài test này chỉ thử từ đúng góc mặc định 34°, và bài đối chứng ĐỎ với thông báo
 * *"không ca nào lọt lưới"* — tức phép canh cả đường bay đang không kiếm được bữa nào, và tôi suýt
 * kết luận rằng lấy mẫu 48 chặng là thừa. Sai: nguyên nhân là **chỗ xuất phát tôi chọn quá hiền**.
 * Đàm hoàn toàn có thể đã kéo camera xuống gần ngang tầm mắt trước khi chạm vào một căn nhà — và
 * đúng lúc ấy camera bay là là qua nóc phố. Thêm góc thấp vào: **9 trên 1200 chuyến** có điểm đến
 * thoáng mà ĐOẠN GIỮA thì không, chênh nhau tới 1,19 đơn vị.
 * ⇒ "Phép canh không bắt được gì" gần như luôn có nghĩa là **đầu vào chưa đủ khắc nghiệt**, chứ
 * không có nghĩa là phép canh vô dụng (bài học Phase 8A, ở đây lặp lại với một phép ĐỐI CHỨNG).
 */
const PITCHES = [MIN_PITCH, 0.35, DEFAULT_PITCH, 1.0];

const CITIES = new Map();
const cityOf = (era) => {
  if (!CITIES.has(era)) CITIES.set(era, buildCity(era));
  return CITIES.get(era);
};

/**
 * PHÉP ĐO ĐỘC LẬP — bài test tự đi dọc đường bay bằng vòng lặp CỦA NÓ, không mượn `pathClearance`.
 *
 * ⚠️ VÌ SAO PHẢI VIẾT LẠI THAY VÌ GỌI HÀM SẴN CÓ. Phép thử ngược đã chứng minh: bóp
 * `pathClearance` cho nó chỉ nhìn mỗi chặng cuối thì bài "camera không chui vào phố" **vẫn XANH**,
 * vì cả bộ lập kế hoạch lẫn phép nghiệm thu đều hỏi đúng cái hàm vừa bị bóp. Đó chính là bẫy
 * "một bài test so mỗi bên với một con số thứ ba" (Phase 8B, `countTriangles`): muốn khoá SỰ KHỚP
 * NHAU thì phải chạy CẢ HAI bên rồi so, không được để hai bên là một.
 * Lấy mẫu DÀY GẤP ĐÔI (`FLIGHT_SAMPLES * 2`) — bài test được phép đắt hơn mã sản phẩm.
 */
function doDuongBayDocLap(from, to, blockers) {
  const n = FLIGHT_SAMPLES * 2;
  let hep = Infinity;
  for (let i = 0; i <= n; i += 1) {
    const k = i / n;
    const eye = orbitPosition({
      yaw: from.yaw + (to.yaw - from.yaw) * k,
      pitch: from.pitch + (to.pitch - from.pitch) * k,
      distance: from.distance + (to.distance - from.distance) * k,
      target: {
        x: from.target.x + (to.target.x - from.target.x) * k,
        y: from.target.y + (to.target.y - from.target.y) * k,
        z: from.target.z + (to.target.z - from.target.z) * k,
      },
    });
    for (const box of blockers) {
      const dx = Math.max(box.minX - eye.x, 0, eye.x - box.maxX);
      const dy = Math.max(box.minY - eye.y, 0, eye.y - box.maxY);
      const dz = Math.max(box.minZ - eye.z, 0, eye.z - box.maxZ);
      hep = Math.min(hep, Math.hypot(dx, dy, dz));
    }
  }
  return hep;
}

test('THÀNH PHỐ DỰNG THỬ PHẢI ĐÚNG CỠ — nếu không thì mọi con số dưới đây nói về một thành phố khác', () => {
  let cao = 0;
  let banKinh = 0;
  let soMoc = 0;
  let soVungQue = 0;
  for (let era = 1; era <= 15; era += 1) {
    const { blockers, landmarks, soVungQue: vq } = cityOf(era);
    soMoc += landmarks.length;
    soVungQue += vq;
    for (const box of blockers) {
      cao = Math.max(cao, box.maxY);
      for (const x of [box.minX, box.maxX]) {
        for (const z of [box.minZ, box.maxZ]) banKinh = Math.max(banKinh, Math.hypot(x, z));
      }
    }
  }
  assert.equal(soMoc, 75, 'phải đủ 15 kỷ × 5 bản vẽ — thiếu là bài test đang chạy trên nửa thành phố');
  // ⚠️ VÙNG QUÊ PHẢI CÓ THẬT RỒI MỚI ĐƯỢC LOẠI RA. Không có dòng này thì `continue` ở `buildCity`
  // có thể đang nuốt một danh sách RỖNG (ví dụ `deriveOutskirts` hỏng và trả về `[]`) mà mọi con
  // số dưới đây vẫn xanh — đúng bẫy "một cơ chế chết vẫn được ship kèm một chú thích dài".
  assert.ok(soVungQue > 1000, `cả 15 kỷ chỉ có ${soVungQue} vật vùng quê — `
    + 'phép loại-ra ở `buildCity` đang loại một danh sách rỗng, tức nó không kiểm được gì');
  assert.ok(cao > 5 && cao < 12, `nóc cao nhất của 15 kỷ = ${cao.toFixed(2)}, ngoài dải 5–12 đã ghi ở tài liệu`);
  assert.ok(banKinh > 5 && banKinh < 12, `bán kính phố = ${banKinh.toFixed(2)}, ngoài dải 5–12`);
});

test('MỖI KỶ MỘT MỨC THU PHÓNG RIÊNG, cả 15 đều nằm trong dải 0,38–0,58 Đàm chốt', () => {
  const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
  const zooms = [];
  for (const era of ERAS) {
    const zoom = focusZoom(cityOf(era).orbit.distance);
    zooms.push(zoom);
    assert.ok(
      zoom >= 0.38 && zoom <= 0.58,
      `kỷ ${era} thu phóng ${zoom.toFixed(3)} — ra ngoài dải 0,38–0,58`,
    );
  }
  // ⚠️ VÀ PHẢI THẬT SỰ KHÁC NHAU. Không có vế này thì mười lăm con số bằng nhau vẫn qua bài trên,
  // tức "mỗi kỷ một mức riêng" thoái hoá về "một mức chung" mà không có gì đỏ lên — đúng bẫy
  // "một bảng nhiều dòng vẫn có thể thoái hoá về một trần chung" (2026-08-18, ADR-028).
  const rong = Math.max(...zooms) - Math.min(...zooms);
  assert.ok(rong > 0.1, `15 mức thu phóng chỉ trải ${rong.toFixed(3)} — gần như một con số chung`);

  // ⚠️ HỎI TRÊN KHOẢNG CÁCH THẬT, ĐỪNG HỎI TRÊN BA CHỮ SỐ THẬP PHÂN. Bản cũ viết
  // `new Set(zooms.map((z) => z.toFixed(3))).size === 15`, tức khoá một PHÉP LÀM TRÒN. §1(B) hạ
  // `relief` ở cả 15 kỷ ⇒ phần đóng góp của địa hình vào khoảng cách camera co lại ⇒ mười lăm con
  // số xích lại gần nhau, và hai cặp rơi vào cùng một ô làm tròn. Khoảng cách THẬT thì vẫn khác
  // nhau đủ mười lăm giá trị — nên bài cũ sẽ đỏ vì một chuyện KHÔNG PHẢI thứ nó tuyên bố canh.
  const khoangCach = ERAS.map((era) => cityOf(era).orbit.distance);
  assert.equal(new Set(khoangCach).size, 15,
    '15 kỷ phải ra 15 khoảng cách camera khác nhau — trùng nhau là bảng đã thoái hoá thật');

  // Và ĐẾM RA những cặp gần nhau tới mức làm tròn ba chữ số không phân biệt nổi. Danh sách dài
  // thêm ⇒ các camera đang hội tụ về một chỗ, đó mới là điều đáng biết (bài học ADR-028: một bảng
  // nhiều dòng vẫn có thể thoái hoá về một trần chung mà trông y hệt).
  const capSatNhau = [];
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      if (zooms[i].toFixed(3) === zooms[j].toFixed(3)) capSatNhau.push([ERAS[i], ERAS[j]]);
    }
  }
  assert.deepEqual(capSatNhau, [[5, 9], [7, 11]],
    `cặp kỷ có mức thu phóng trùng nhau tới ba chữ số: ${JSON.stringify(capSatNhau)}. Dài thêm ⇒ `
    + 'camera 15 kỷ đang hội tụ; ngắn đi ⇒ ai đó vừa nới lại chênh lệch địa hình.');
});

test('CHI TIẾT Ở KỶ NÀO CŨNG TO BẰNG NHAU TRÊN MÀN HÌNH — đó mới là việc của một mức thu phóng riêng từng kỷ', () => {
  // Số điểm ảnh trên mỗi đơn vị thế giới chỉ phụ thuộc KHOẢNG CÁCH, nên khoảng cách cố định ⇒
  // một cái ống khói ở kỷ 1 và ở kỷ 15 chiếm đúng bằng nhau. Đây là lời hứa mà mức thu phóng
  // riêng từng kỷ sinh ra để giữ; giữ được nó thì 15 con số kia không phải tuỳ hứng.
  const tam = 2 * FOCUS_VIEW_DISTANCE * Math.tan(((CITY_CAMERA_FOV * Math.PI) / 180) / 2);
  const doPhongTo = [];
  for (let era = 1; era <= 15; era += 1) {
    const { orbit } = cityOf(era);
    const tamToanCanh = 2 * orbit.distance * Math.tan(((CITY_CAMERA_FOV * Math.PI) / 180) / 2);
    doPhongTo.push(tamToanCanh / tam);
  }
  assert.ok(tam > 4.5 && tam < 6, `tầm nhìn dọc ${tam.toFixed(2)} đơn vị — phải là một KHU PHỐ (≈5 ô), không phải một bức tường`);
  assert.ok(
    Math.min(...doPhongTo) > 1.7,
    `kỷ ít lợi nhất chỉ phóng to ${Math.min(...doPhongTo).toFixed(2)}× — chưa đủ để chi tiết vượt ngưỡng mắt`,
  );
});

test('CAMERA KHÔNG BAO GIỜ CHUI VÀO PHỐ — canh CẢ ĐƯỜNG BAY, 15 kỷ × 5 công trình × 4 hướng × 4 góc', () => {
  let chuyenBay = 0;
  let hep = Infinity;
  let ngangNhat = 0;
  const phaiLuiRa = [];
  const phaiNgang = [];
  const ketCung = [];
  let bienHep = Infinity;
  let dayHep = Infinity;
  for (let era = 1; era <= 15; era += 1) {
    const { blockers, landmarks, orbit } = cityOf(era);
    for (const box of landmarks) {
      for (const yaw of YAWS) {
        for (const pitch of PITCHES) {
          const from = { yaw, pitch, distance: orbit.distance, target: orbit.target };
          const plan = planCityFocus({ from, focus: centreOf(box), blockers });
          chuyenBay += 1;
          const thucTe = doDuongBayDocLap(from, plan, blockers);
          assert.ok(
            thucTe >= FOCUS_CLEARANCE - 1e-9,
            `kỷ ${era}: đường bay chỉ còn ${thucTe.toFixed(2)} đơn vị tới khối gần nhất`,
          );
          hep = Math.min(hep, thucTe);
          ngangNhat = Math.max(ngangNhat, plan.pitch);
          if (plan.raisedDistance > 0) phaiLuiRa.push(era);
          if (plan.raisedPitch > 0) phaiNgang.push(era);
          if (plan.blocked) ketCung.push(era);
          // Biên CHỨNG MINH ĐƯỢC (`gap − step/2`) và một phép đo lại DÀY GẤP 10. Xem `pathGuarantee`.
          const bien = pathGuarantee(from, plan, blockers).guaranteed;
          assert.ok(bien >= FOCUS_CLEARANCE - 1e-9, `kỷ ${era}: biên chứng minh được chỉ còn ${bien.toFixed(3)}`);
          bienHep = Math.min(bienHep, bien);
          dayHep = Math.min(dayHep, pathGuarantee(from, plan, blockers, FLIGHT_SAMPLES * 10).gap);
        }
      }
    }
  }
  assert.equal(chuyenBay, 1200, 'phải thử đủ 1200 chuyến — ít hơn là vòng lặp đã lặng lẽ bỏ qua kỷ nào đó');
  assert.ok(hep >= FOCUS_CLEARANCE - 1e-9, `chỗ hẹp nhất ${hep.toFixed(2)}`);
  // ⚠️ ĐẾM RA TƯỜNG MINH, không nuốt im lặng (bài học Phase 10 Bước 2: "từ chối thẳng" chỉ an toàn
  // khi có người đếm số lần từ chối). Từ 2026-08-18 thứ tự chữa là LÙI trước, NGẨNG sau
  // (`TECH_DEBT #46` — Đàm chốt), nên hai con số dưới đây đã ĐỔI VAI:
  //   · lùi ra xa: nay là cách chữa THỨ NHẤT ⇒ có thật, và phải có thật (nếu về 0 thì hoặc thành
  //     phố đã teo lại, hoặc phép canh đã mù — cả hai đều đáng biết).
  //   · ngẩng thêm: nay là cách chữa CUỐI ⇒ phải bằng 0. Ngày nào nó khác 0 nghĩa là có kỷ mà lùi
  //     hết cỡ vẫn kẹt, và lúc ấy cận cảnh ở kỷ đó lại ngả thành ảnh chụp từ trực thăng.
  assert.ok(phaiLuiRa.length > 0, 'KHÔNG chuyến nào phải lùi ra — cơ chế chữa va chạm đang chạy rỗng');
  assert.deepEqual([...new Set(phaiNgang)], [], 'có kỷ lùi hết cỡ vẫn kẹt, phải NGẨNG lên — mất mặt đứng');
  assert.deepEqual([...new Set(ketCung)], [], 'có kỷ hết cách, camera đứng yên');
  // Cần gạt thứ hai (ngẩng) chưa bao giờ phải cứu ai ⇒ con số "0 lần ngẩng" ở trên không phải may
  // mắn sát nút, và cái trần `MAX_PITCH` vẫn còn nguyên chỗ dự phòng.
  assert.ok(ngangNhat < MAX_PITCH - 0.3, `góc ngẩng tệ nhất ${ngangNhat.toFixed(3)} đã sát trần ${MAX_PITCH.toFixed(3)}`);
  // ⚠️ HAI CON SỐ CHỨNG MINH 48 CHẶNG LÀ ĐỦ — trả lời thẳng câu "có nên quét liên tục không".
  assert.ok(bienHep >= FOCUS_CLEARANCE - 1e-9, `biên chứng minh được hẹp nhất ${bienHep.toFixed(4)}`);
  assert.ok(dayHep >= FOCUS_CLEARANCE - 1e-9, `đo lại dày gấp 10 vẫn phải thoáng, nhưng ra ${dayHep.toFixed(4)}`);
});

test('ĐỐI CHỨNG: chỉ canh ĐIỂM ĐẾN thôi là chưa đủ — và đây là danh sách kỷ chứng minh điều đó', () => {
  // Nếu bỏ phép canh đường bay và chỉ hỏi "chỗ đứng cuối cùng có thoáng không" thì bài trên vẫn
  // xanh, và cả cơ chế lấy mẫu 48 chặng thành mã chết. Bài này liệt kê ĐÍCH DANH những kỷ mà điểm
  // đến thoáng nhưng ĐOẠN GIỮA thì không — kỷ thứ bảy rơi vào thì đỏ, mà một kỷ rơi ra cũng đỏ.
  const lotLuoi = [];
  let cheoNhat = 0;
  for (let era = 1; era <= 15; era += 1) {
    const { blockers, landmarks, orbit } = cityOf(era);
    for (const box of landmarks) {
      for (const yaw of YAWS) {
        for (const pitch of PITCHES) {
          const from = { yaw, pitch, distance: orbit.distance, target: orbit.target };
          // Kế hoạch NGÂY THƠ: bay thẳng tới, không ngẩng lên, không hỏi đường bay có thoáng không.
          const to = {
            yaw,
            pitch,
            distance: Math.min(FOCUS_VIEW_DISTANCE, orbit.distance),
            target: centreOf(box),
          };
          const diemDen = nearestBlocker(orbitPosition(to), blockers);
          const caDuong = doDuongBayDocLap(from, to, blockers);
          if (diemDen >= FOCUS_CLEARANCE && caDuong < FOCUS_CLEARANCE) {
            lotLuoi.push(era);
            cheoNhat = Math.max(cheoNhat, diemDen - caDuong);
          }
        }
      }
    }
  }
  assert.deepEqual(
    [...new Set(lotLuoi)].sort((a, b) => a - b),
    [1, 2, 3, 5, 7, 8, 9, 11, 12, 13, 15],
    'danh sách kỷ mà phép canh cả đường bay thật sự cứu — đổi là phải xem lại vì sao',
  );
  // 2026-08-20, HAI lần đổi trong cùng một ngày và cả hai đều có lý do đo được:
  //   9 kỷ / 9 chuyến  → nền `9c7032c`
  //   9 kỷ / 12 chuyến → sau §1(B) (nền phẳng hơn ⇒ camera toàn cảnh đứng gần hơn ⇒ đường bay đi
  //                      sát mái nhà hơn)
  //   11 kỷ / 14 chuyến→ sau khi sửa `drain` cho khớp `settingStyle.side`: đất thoải về phía nước
  //                      nên bên bờ THẤP hẳn xuống, camera bay ngang qua đó lại càng sát mái.
  // Con số TĂNG nghĩa là phép canh cả-đường-bay càng đáng giá, không phải càng tệ.
  assert.equal(lotLuoi.length, 14, 'đúng 14 chuyến trên 1200 lọt lưới nếu chỉ canh điểm đến');
  assert.ok(cheoNhat > 1, `chênh lớn nhất giữa điểm-đến và cả-đường mới ${cheoNhat.toFixed(2)} — quá nhỏ để gọi là cứu được ai`);
});

test('`boxDistance`: nằm TRONG hộp phải ra đúng 0, không phải một số âm lẫn với "cách ra một chút"', () => {
  const box = { minX: -1, maxX: 1, minY: 0, maxY: 2, minZ: -1, maxZ: 1 };
  assert.equal(boxDistance({ x: 0, y: 1, z: 0 }, box), 0, 'tâm hộp');
  assert.equal(boxDistance({ x: 1, y: 2, z: 1 }, box), 0, 'đúng trên mặt hộp');
  assert.equal(boxDistance({ x: 4, y: 1, z: 0 }, box), 3, 'lệch một trục');
  assert.equal(boxDistance({ x: 4, y: 6, z: 0 }, box), 5, 'lệch hai trục (3-4-5)');
  assert.equal(nearestBlocker({ x: 0, y: 1, z: 0 }, []), Infinity, 'phố rỗng ⇒ thoáng vô hạn');
});

test('PHÉP TÌM LUÔN DỪNG — kể cả khi thành phố đã phình ra bọc lấy camera', () => {
  // Một khối khổng lồ trùm cả camera lẫn điểm ngắm: không có góc nào, khoảng cách nào thoát được.
  // Đúng lúc ấy hàm phải TRẢ VỀ với `blocked: true` chứ không quay vòng vô tận.
  const khoiKhongLo = [{
    minX: -1e3, maxX: 1e3, minY: -1e3, maxY: 1e3, minZ: -1e3, maxZ: 1e3,
  }];
  const from = { yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: 16, target: { x: 0, y: 0, z: 0 } };
  const plan = planCityFocus({ from, focus: { x: 3, y: 1, z: 2 }, blockers: khoiKhongLo });
  assert.equal(plan.blocked, true, 'phải nói thẳng là bí, không im lặng bay vào');
  assert.equal(plan.distance, from.distance, 'bí thì đứng yên tại chỗ cũ');
  assert.deepEqual(plan.target, from.target, 'bí thì giữ nguyên điểm ngắm');
});

test('CHUYẾN BAY ĐI QUA ĐÚNG NHỮNG TRẠNG THÁI ĐƯỢC LẤY MẪU — hai đầu khớp tuyệt đối', () => {
  const from = { yaw: 0.3, pitch: 0.4, distance: 18, target: { x: 0, y: 1, z: 0 } };
  const to = { yaw: 0.3, pitch: 0.9, distance: 7.5, target: { x: 4, y: 1.2, z: -3 } };
  assert.deepEqual(flightState(from, to, 0), from);
  assert.deepEqual(flightState(from, to, 1), to);
  // Kẹp hai đầu: `t` ngoài [0,1] không được ném camera ra ngoài đoạn bay.
  assert.deepEqual(flightState(from, to, -5), from);
  assert.deepEqual(flightState(from, to, 9), to);
  assert.ok(FLIGHT_SAMPLES >= 24, 'lấy mẫu quá thưa thì một khối mảnh lọt qua giữa hai chặng');
});

test('SÀN GÓC NHÌN SỐNG MÃI SAU KHI HẠ CÁNH — kéo xuống cỡ nào cũng không chui xuống dưới', () => {
  const orbit = createOrbit({ distance: 16, minDistance: 8, maxDistance: 40, target: { x: 0, y: 0, z: 0 } });
  orbit.set({ pitch: 0.9, distance: 7.5, target: { x: 3, y: 1, z: -2 } });
  orbit.setLimits({ minPitch: 0.9, minDistance: 7.5 });

  for (let i = 0; i < 200; i += 1) orbit.drag(0, -40);   // kéo LÊN hết cỡ = hạ góc nhìn
  assert.ok(orbit.getState().pitch >= 0.9 - 1e-9, 'kéo mãi vẫn không xuống dưới sàn đã chứng minh là thoáng');
  // ⚠️ PHẢI LÀ `equal`, KHÔNG PHẢI `>=`. Bản đầu viết `>= 7,5` và phép thử ngược **không nổ**:
  // trả `zoom` về kẹp TĨNH thì nó dừng ở sàn TOÀN CẢNH (8), mà 8 vẫn ≥ 7,5 nên assert xanh — trong
  // khi lỗi thật đã xảy ra và Đàm nhìn thấy ngay: bay vào ngắm gần, lăn chuột một cái là camera
  // BẬT NGƯỢC RA. Sàn cận cảnh nằm THẤP HƠN sàn toàn cảnh, nên phép kiểm phải hỏi "có ở lại đúng
  // chỗ đã hạ cánh không", chứ hỏi "có dưới sàn không" thì vĩnh viễn không bắt được gì.
  for (let i = 0; i < 200; i += 1) orbit.zoom(0.89);     // lăn chuột vào gần hết cỡ
  assert.equal(orbit.getState().distance, 7.5, 'lăn chuột một cái là camera bật ngược ra khỏi khu phố');
  assert.ok(orbit.zoom(1.12), 'vẫn phải lùi ra được — sàn chỉ chặn chiều VÀO');

  orbit.reset();
  const sau = orbit.getState();
  assert.deepEqual(sau.target, { x: 0, y: 0, z: 0 }, '`reset` phải trả cả ĐIỂM NGẮM về toàn cảnh');
  assert.deepEqual(orbit.getLimits(), { minPitch: 0.18, minDistance: 8 }, '`reset` phải hạ cả hai sàn');
  orbit.drag(0, -400);
  assert.ok(orbit.getState().pitch < 0.9, 'sau `reset` thì lại kéo thấp xuống được như toàn cảnh');
});

test('ĐIỂM NGẮM DI CHUYỂN ĐƯỢC, và mọi chỗ ĐỌC nó đều thấy chỗ mới', () => {
  // ⚠️ Bản gốc `getState()` trả về chính tham số `target` đóng kín trong closure. Thêm đường GHI
  // mà quên sửa đường ĐỌC thì camera bay đi trong khi mọi phép đo tưởng nó còn đứng giữa phố.
  const orbit = createOrbit({ distance: 16, minDistance: 8, maxDistance: 40, target: { x: 0, y: 0, z: 0 } });
  orbit.set({ target: { x: 5, y: 2, z: -4 } });
  assert.deepEqual(orbit.getTarget(), { x: 5, y: 2, z: -4 });
  assert.deepEqual(orbit.getState().target, { x: 5, y: 2, z: -4 });
  const eye = orbit.getPosition();
  const doiChieu = orbitPosition({ ...orbit.getState(), target: { x: 5, y: 2, z: -4 } });
  assert.deepEqual(eye, doiChieu, '`getPosition` phải quay quanh điểm ngắm MỚI');
  assert.deepEqual(orbit.getHome().target, { x: 0, y: 0, z: 0 }, 'chỗ cũ vẫn được giữ để còn đường về');
});

test('LÙI RA TRƯỚC, NGẨNG SAU — thứ tự chữa phải giữ được MẶT ĐỨNG', () => {
  // ⚠️ Thứ tự này NGƯỢC lại với bản trước 2026-08-18, và đó là cả nội dung của `TECH_DEBT #46`.
  // Lý lẽ cũ ("ngẩng lên mất ít nhất") đo bằng ĐỘ PHÓNG TO: lùi ra thì vật nhỏ đi, nên nghe như
  // lùi ra là mất nhiều hơn. Nó bỏ sót thứ đắt hơn: ngẩng lên thì MẶT ĐỨNG biến mất, mà tầng trệt
  // (Phase 10) và mái (Phase 11) là hai thứ chế độ cận cảnh sinh ra để cho xem. Đàm chốt:
  // "(a) giữ được LỜI HỨA, (b) giữ được CON SỐ" — lùi ra vẫn còn cả hai, ngẩng lên thì mất (a).
  // Một bức tường dài chắn ngang giữa camera và điểm ngắm, cao vừa đủ để góc nhìn mặc định đâm vào.
  const tuong = [{ minX: -20, maxX: 20, minY: 0, maxY: 6, minZ: -1.2, maxZ: 1.2 }];
  const from = { yaw: 0, pitch: DEFAULT_PITCH, distance: 18, target: { x: 0, y: 5, z: 12 } };
  const plan = planCityFocus({ from, focus: { x: 0, y: 1, z: -6 }, blockers: tuong });
  assert.equal(plan.blocked, false);
  assert.ok(plan.raisedDistance > 0, 'phải lùi ra mới qua được bức tường');
  assert.equal(plan.raisedPitch, 0, 'lùi ra đã đủ thì KHÔNG được ngẩng — ngẩng lên là mất mặt đứng vô cớ');
  assert.equal(plan.pitch, DEFAULT_PITCH, 'góc nhìn phải NGUYÊN VẸN như lúc Đàm đang đứng ngắm');
  assert.ok(plan.distance <= from.distance + 1e-9, 'lùi ra thì cùng lắm về đúng chỗ cũ, không được lùi xa hơn');
  assert.ok(plan.pitch <= MAX_PITCH + 1e-9);
  // Ở ĐÂY thì cố ý dùng `pathClearance` của mã sản phẩm, và so nó với phép đo độc lập: đó là cách
  // duy nhất khoá được rằng HAI BÊN CÒN KHỚP NHAU. Bài trên đã không dùng nó, nên nếu không có
  // dòng này thì `pathClearance` sẽ chẳng còn assert nào của riêng mình.
  assert.ok(pathClearance(from, plan, tuong) >= FOCUS_CLEARANCE - 1e-9);
  assert.ok(
    Math.abs(pathClearance(from, plan, tuong) - doDuongBayDocLap(from, plan, tuong)) < 0.05,
    '`pathClearance` của mã sản phẩm đã trôi khỏi phép đo độc lập của bài test',
  );
});

test('CA THẬT CỦA APP — xuất phát từ đúng khung TOÀN CẢNH thì KHÔNG kỷ nào phải ngẩng lên', () => {
  // ⚠️ VÌ SAO CẦN BÀI NÀY KHI ĐÃ CÓ BÀI 1200 CHUYẾN Ở TRÊN.
  // Bài kia cố ý thử từ BỐN góc xuất phát, kể cả góc 0,18 rad (gần sát mặt đất) mà Đàm chỉ tới
  // được nếu đã tự kéo camera xuống — nó trả lời câu *"có ca nào phá được phép canh không"*.
  // Bài này trả lời một câu KHÁC và cụ thể hơn: *"mở app lên, không đụng gì, chạm vào một công
  // trình — thì Đàm nhận được gì?"* Đó là ca duy nhất xảy ra hằng ngày, và nó là ca mà
  // `TECH_DEBT #46` nói tới (kỷ 15 từng phải ngẩng tới 65,3° và mất sạch mặt đứng).
  // Hai bài KHÔNG thay thế nhau: bài kia rộng mà không nói được ca thường gặp, bài này hẹp mà nói
  // đúng ca ấy.
  const luiRa = [];
  let xaNhat = 0;
  let tiLeTe = 0;
  let soChuyen = 0;
  for (let era = 1; era <= 15; era += 1) {
    const { blockers, landmarks, orbit } = cityOf(era);
    for (const box of landmarks) {
      const from = { yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: orbit.distance, target: orbit.target };
      const plan = planCityFocus({ from, focus: centreOf(box), blockers });
      soChuyen += 1;
      assert.equal(
        plan.pitch, DEFAULT_PITCH,
        `kỷ ${era}: mở app rồi chạm một cái mà camera đã phải ngẩng lên ${plan.pitch.toFixed(3)} — mất mặt đứng`,
      );
      assert.equal(plan.blocked, false, `kỷ ${era}: bí ngay từ khung toàn cảnh`);
      if (plan.raisedDistance > 0 && !luiRa.includes(era)) luiRa.push(era);
      xaNhat = Math.max(xaNhat, plan.distance);
      tiLeTe = Math.max(tiLeTe, focusZoom(orbit.distance, plan.distance));
    }
  }
  assert.equal(soChuyen, 75, 'phải thử đủ 15 kỷ × 5 công trình mốc');
  // ⚠️ ĐẾM RA TƯỜNG MINH — danh sách, không phải một con số tổng. Thêm một kỷ vào là đỏ, mà một kỷ
  // được chữa xong cũng đỏ; cả hai đều là tin đáng biết. (Bài học `TECH_DEBT #44`: ngoại lệ phải
  // đếm được, đừng nới ngưỡng cho vừa.)
  // 2026-08-20: kỷ 7 RỜI danh sách sau khi `drain` của nó được sửa từ 'tay' về 'nam' (Duomo đứng
  // bờ BẮC, sông Arno chảy phía nam — xem `terrain.test.js`, bài *"NƯỚC NẰM Ở CHỖ THẤP"*). Nền
  // Firenze nay thoải đều về phía sông thay vì vắt ngang, nên không còn công trình nào phải lùi ra.
  // Một kỷ RỜI danh sách là tin tốt, và bài test vẫn đỏ khi nó rời — đúng ý đồ hai chiều.
  assert.deepEqual(luiRa, [5, 10, 11, 14, 15], 'danh sách kỷ có công trình phải lùi ra mới ngắm được');
  assert.ok(xaNhat <= 11 + 1e-9, `chỗ phải lùi xa nhất ${xaNhat} — xa hơn nữa là chi tiết cận cảnh bắt đầu tan`);
  // ⚠️ 0,664 → 0,6672 (2026-08-20). Đây là một con số ĐO ĐƯỢC chứ không phải một mức Đàm chốt, và
  // nó nhích lên vì §1(B): nền phẳng hơn ⇒ camera toàn cảnh vốn đã đứng gần hơn ⇒ chuyến cận cảnh
  // còn ít phần để rút ngắn. Vẫn là phóng to 1,50 lần (trước là 1,51). Lời hứa Đàm chốt ở ADR-035
  // là `xaNhat <= 11` ngay trên, và nó không nhúc nhích.
  assert.ok(tiLeTe <= 0.668 + 1e-9, `kỷ ít lợi nhất chỉ còn tỉ lệ ${tiLeTe.toFixed(4)} so với toàn cảnh`);
});

test('CẢNH VẬT NẰM TRONG DANH SÁCH VẬT CẢN, và hôm nay nó TRÓI ĐÚNG 0 KỶ — đếm ra, đừng đoán', () => {
  // ⚠️ ĐÂY LÀ MỘT MỤC KIỂM CHO MỘT DÒNG CHÚ THÍCH. `sceneGraph.js` nhét cả cây/đá/đèn vào
  // `blockers` và tự giải thích rằng làm vậy "rẻ bằng không". Câu ấy là một CON SỐ trá hình, nên
  // nó phải được đếm chứ không được tin — và nó cũng là thứ ngăn phiên sau đọc nhầm dòng ấy thành
  // mã chết rồi gỡ đi (Đàm chốt 2026-08-18: GIỮ, và ghi rõ hôm nay nó trói mấy kỷ).
  // Ngày nào một kỷ có hàng cọ/tháp đèn cao hơn mái thì con số 0 này thành khác 0 và bài test đỏ —
  // đúng lúc đáng biết, chứ không phải im lặng bảo vệ rồi chẳng ai hay.
  const troi = [];
  for (let era = 1; era <= 15; era += 1) {
    const { blockers, nhaOnly, landmarks, orbit } = cityOf(era);
    assert.ok(blockers.length > nhaOnly.length, `kỷ ${era}: cảnh vật đã rơi khỏi danh sách vật cản`);
    for (const box of landmarks) {
      const from = { yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: orbit.distance, target: orbit.target };
      const focus = centreOf(box);
      const co = planCityFocus({ from, focus, blockers });
      const khong = planCityFocus({ from, focus, blockers: nhaOnly });
      if (co.distance !== khong.distance || co.pitch !== khong.pitch) troi.push(era);
    }
  }
  assert.deepEqual([...new Set(troi)], [], 'cảnh vật đã bắt đầu trói camera — cập nhật lại chú thích ở `sceneGraph.js`');

  // ⚠️ ĐỐI CHỨNG BẮT BUỘC — nếu không có nó thì assert trên là một cái PHỄU: một phép so "hai kế
  // hoạch giống nhau" cũng xanh y hệt khi `nhaOnly` tình cờ bằng `blockers`, khi vòng lặp chạy
  // rỗng, hoặc khi `planCityFocus` bỏ qua tham số `blockers`. Nên phải chứng minh phép đo ấy CÓ
  // THỂ thấy sự khác biệt: thổi mỗi cảnh vật cao lên quá mái (y tới 12) thì nó phải trói được ít
  // nhất một kỷ. Đây chính là ngày mai của dòng chú thích ở `sceneGraph.js` — "ngày nào có hàng
  // cọ cao hơn mái".
  const nhaSet = new Set();
  const { blockers, nhaOnly, landmarks, orbit } = cityOf(1);
  for (const b of nhaOnly) nhaSet.add(b);
  const phongTo = blockers.map((b) => (nhaSet.has(b) ? b : { ...b, maxY: 12 }));
  let doiChung = 0;
  for (const box of landmarks) {
    const from = { yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance: orbit.distance, target: orbit.target };
    const focus = centreOf(box);
    const a = planCityFocus({ from, focus, blockers: phongTo });
    const b = planCityFocus({ from, focus, blockers: nhaOnly });
    if (a.distance !== b.distance || a.pitch !== b.pitch) doiChung += 1;
  }
  assert.ok(doiChung > 0, 'thổi cảnh vật cao quá mái mà kế hoạch bay KHÔNG đổi ⇒ phép so ở trên đang mù');
});
