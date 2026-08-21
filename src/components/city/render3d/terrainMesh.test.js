import test from 'node:test';
import assert from 'node:assert/strict';
import { Color } from 'three';

import {
  ROAD_LIFT, ROAD_PART, buildHorizonSurface, buildRoadSurface, buildTerrainSurface, buildWaterSurface,
} from './terrainMesh.js';
import { APRON_DROP, WATER_SURFACE_Y, buildTerrain } from '../../../engine/city3d/terrain.js';
import { buildHorizon } from '../../../engine/city3d/horizon.js';
import { ERAS_WITH_WATER_GEOMETRY, WATER_TINT } from '../../../engine/city3d/setting.js';
import { buildScenePalette } from '../../../engine/city3d/palette3d.js';
import {
  STREET_STYLES, carriagewayShape, getStreetStyle, streetCrossSection,
} from '../../../engine/city3d/streetStyle.js';
import { computeCityLayout } from '../../../engine/cityLayout.js';
import { BLUEPRINT_CATALOG } from '../../../engine/constants.js';

/**
 * Bài test cho TẤM ĐỊA HÌNH — hình học thật, không phải đọc mã nguồn.
 *
 * ⚠️ `terrain.test.js` đã canh TRƯỜNG CAO ĐỘ (hàm thuần). File này canh thứ hoàn toàn khác: cái
 * lưới đỉnh dựng RA từ trường ấy có nằm đúng chỗ không. Hai chuyện đó lệch nhau được, và khi lệch
 * thì lệch trong im lặng tuyệt đối — một sai số nửa ô ở `u0` sẽ cho ra một tấm đất đẹp đẽ, mượt
 * mà, đúng hình dạng, chỉ là **đặt lệch nửa ô so với thành phố đứng trên nó**. Build xanh, lint
 * sạch, mọi bài test tầng thuần xanh, và mỗi căn nhà lơ lửng hoặc lún vài phân.
 *
 * Cả năm bài dưới đây đều đã thử NGƯỢC (làm hỏng mã rồi xem có đỏ không) trước khi giữ lại.
 */

const GRID = 12;
const ERAS = [1, 4, 5, 8, 12, 15];

/**
 * ⚠️ PHẢI XÂY ĐỦ CẢ 5 BẢN VẼ, KHÔNG ĐƯỢC ĐỂ `built: []`. Đường sá MỞ DẦN theo số công trình đã
 * xây (`tier`, Phase 6C), nên một thành phố trống có ĐÚNG KHÔNG ô đường nào — và hai bài canh mặt
 * đường bên dưới sẽ "xanh" vì chẳng có gì để kiểm. Đúng cái bẫy fixture của Phase 4B ("fixture đều
 * tăm tắp là fixture vô dụng"): dữ liệu mẫu thiếu đa dạng thì một tính năng hỏng vẫn trông bình
 * thường. Cả hai bài ấy vì vậy đều có một dòng đếm cuối để tự tố cáo nếu lại chạy không.
 */
function dựng(era) {
  const terrain = buildTerrain({ era, gridSize: GRID });
  const built = (BLUEPRINT_CATALOG[era] ?? []).map((bp) => bp.id);
  const layout = computeCityLayout({ era, built, stats: { sessionCount: 400, streakLength: 30 } });
  const palette = buildScenePalette({ era });
  return {
    terrain,
    layout,
    palette,
    ground: buildTerrainSurface({ terrain, gridSize: GRID, layout, palette }),
    road: buildRoadSurface({ terrain, gridSize: GRID, layout, palette }),
  };
}

/** Đọc mảng vị trí ra từng bộ ba `[x, y, z]`. */
function đỉnh(surface) {
  const p = surface.geometry.getAttribute('position').array;
  const out = [];
  for (let i = 0; i < p.length; i += 3) out.push([p[i], p[i + 1], p[i + 2]]);
  return out;
}

/** Toạ độ thế giới → toạ độ ô. Nghịch đảo của `toWorld`; phải khớp `cellToWorld`. */
const về_ô = (w) => w + (GRID - 1) / 2;

test('LƯỚI ĐỈNH PHẢI CÓ MỘT ĐỈNH ĐÚNG TÂM MỖI Ô, ở đúng cao độ mọi vật đang đứng', () => {
  // ⚠️ BÀI QUAN TRỌNG NHẤT FILE. `terrain.test.js` đã chứng minh `smoothHeightAt(x, y)` bằng đúng
  // `heightAt(x, y)` — nhưng đó là chuyện của HÀM. Bài này hỏi chuyện của HÌNH: tấm lưới có thật
  // sự đặt một đỉnh ở đúng chỗ ấy, ở đúng cao độ ấy, trong TOẠ ĐỘ THẾ GIỚI không. Lệch nửa ô ở
  // `u0`, hay lệch `half` ở `toWorld`, thì hàm vẫn đúng còn thành phố vẫn trôi.
  for (const era of ERAS) {
    const { terrain, ground } = dựng(era);
    const mốc = new Map();
    for (const [x, y, z] of đỉnh(ground)) mốc.set(`${x.toFixed(6)}|${z.toFixed(6)}`, y);
    for (let cy = 0; cy < GRID; cy += 1) {
      for (let cx = 0; cx < GRID; cx += 1) {
        const wx = cx - (GRID - 1) / 2; const wz = cy - (GRID - 1) / 2;
        const y = mốc.get(`${wx.toFixed(6)}|${wz.toFixed(6)}`);
        assert.notEqual(y, undefined, `kỷ ${era}: không có đỉnh nào ở tâm ô (${cx},${cy})`);
        assert.ok(
          Math.abs(y - terrain.heightAt(cx, cy)) < 1e-5,
          `kỷ ${era} ô (${cx},${cy}): mặt đất ở ${y}, mà nhà/cây/cư dân đứng ở `
          + `${terrain.heightAt(cx, cy)} — chênh ${(y - terrain.heightAt(cx, cy)).toFixed(4)}`,
        );
      }
    }
  }
});

test('MẶT ĐẤT LIỀN MẠCH: hai đỉnh kề nhau không được chênh nhau như một cái BẬC', () => {
  // Cả Phase 8C nằm gọn trong bài này. Nếu ai đó cho `surfaceHeightAt` quay về làm tròn theo ô thì
  // tấm lưới vẫn dựng ra bình thường, vẫn đủ đỉnh, vẫn đúng cao độ ở tâm ô (bài trên vẫn XANH) —
  // chỉ là giữa hai ô sẽ có một vách đứng. Đo bằng cách so bước nhảy cao độ với bước nhảy NGANG:
  // một sườn dốc thật thì tỉ số ấy có trần, một cái bậc thì nó vọt lên vô hạn.
  const DU = 1 / 3;              // bước ngang của lưới đỉnh (SUB = 3)
  for (const era of ERAS) {
    const { ground } = dựng(era);
    const hàng = new Map();
    for (const [x, y, z] of đỉnh(ground)) {
      const key = z.toFixed(6);
      if (!hàng.has(key)) hàng.set(key, new Map());
      hàng.get(key).set(Number(x.toFixed(6)), y);
    }
    // ⚠️ CHỈ ĐO TRONG CAO NGUYÊN. Vùng đất thoải bên ngoài dốc gắt hơn nhiều **có chủ đích** —
    // nó là vách của một cao nguyên, tụt tới 3,0 đơn vị trong khoảng 1,6 ô ở kỷ nhiều relief. Đo
    // cả vùng ấy thì bài này báo 2,28 ở kỷ 8 và tôi suýt đi "sửa" một thứ đang đúng. Thềm bậc —
    // thứ bài này sinh ra để canh — chỉ tồn tại BÊN TRONG lưới.
    const BIÊN = (GRID - 1) / 2;      // toạ độ thế giới của ô mép
    let dốc_nhất = 0;
    for (const [zKey, cột] of hàng) {
      if (Math.abs(Number(zKey)) > BIÊN + 1e-6) continue;
      const xs = [...cột.keys()].sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i += 1) {
        if (Math.abs(xs[i] - xs[i - 1] - DU) > 1e-6) continue;
        if (Math.abs(xs[i]) > BIÊN + 1e-6 || Math.abs(xs[i - 1]) > BIÊN + 1e-6) continue;
        dốc_nhất = Math.max(dốc_nhất, Math.abs(cột.get(xs[i]) - cột.get(xs[i - 1])) / DU);
      }
    }
    // Bậc thềm cao nhất là 0,675 (kỷ 5); rơi trọn trong MỘT bước ngang 1/3 ⇒ độ dốc 2,0.
    // Trải mượt qua cả ô thì đỉnh dốc chỉ khoảng 1,0. Ngưỡng 1,45 nằm giữa hai con số đó.
    assert.ok(
      dốc_nhất < 1.45,
      `kỷ ${era}: có chỗ dốc ${dốc_nhất.toFixed(2)} — đó là một VÁCH, không phải sườn đồi. `
      + 'Mặt đất đã lén quay về thềm bậc.',
    );
  }
});

test('RÌA TẤM ĐẤT PHẢI KHỚP TẤM CHÂN TRỜI — một QUAN HỆ, không phải một MỨC', () => {
  // ⚠️ 2026-08-21 — BÀI NÀY LÀ BẢN THỨ BA CỦA CÙNG MỘT LỜI HỨA, VÀ CẢ BA ĐỀU TỪNG VIẾT SAI KIỂU
  // (hai bản kia ở `terrain.test.js` và `horizon.test.js`). Lời hứa gốc (Phase 9A, hai cái nêm sáng
  // chói ở chỗ giáp) là **hai tấm phải KHỚP NHAU**; cả ba bản đều viết thành *"cả hai phải bằng
  // `-APRON_DROP`"* — đúng bẫy Phase 7D. Cái giá là một vành phẳng tuyệt đối rộng 5,7 ô quanh thành
  // phố: cái sàn để mắt đọc phần đất trong lưới thành một mặt bàn (§0 lệnh Đàm 2026-08-21).
  //
  // Bài này canh thứ mà hai bản kia KHÔNG canh được: **lưới đỉnh dựng ra** có nằm đúng trên trường
  // cao độ không. Trường đúng mà lưới đặt lệch nửa ô thì hậu quả y hệt, và im lặng tuyệt đối.
  // Hỏi thẳng `horizon.heightAt` (chứ không phải `terrain.surfaceHeightAt`) vì tấm chân trời mới là
  // thứ NẰM CẠNH nó trên màn hình — đó đúng là hai bên của cái khe hở cần canh.
  //
  // Nhánh ướt/khô đã GỘP: hai tấm nay dùng chung một nền (`terrain.nenKho`) và chung một phép khoét,
  // nên câu hỏi ướt và câu hỏi khô là CÙNG một câu. Một ngoại lệ biến mất.
  let soKho = 0;
  let soUot = 0;
  const cao = [];
  for (const era of ERAS) {
    const { ground, terrain } = dựng(era);
    const horizon = buildHorizon({ era, gridSize: GRID, terrain });
    const v = đỉnh(ground);
    const maxX = Math.max(...v.map((p) => p[0]));
    const half = (GRID - 1) / 2;
    for (const [x, y, z] of v) {
      if (Math.abs(Math.abs(x) - maxX) > 1e-6 && Math.abs(Math.abs(z) - maxX) > 1e-6) continue;
      if (terrain.setting.blendAt(x + half, z + half) > 0) soUot += 1; else soKho += 1;
      cao.push(y);
      assert.ok(Math.abs(y - horizon.heightAt(x, z)) < 1e-5,
        `kỷ ${era}: đỉnh rìa (${x.toFixed(2)},${z.toFixed(2)}) ở ${y.toFixed(4)}, còn tấm chân trời `
        + `ở ${horizon.heightAt(x, z).toFixed(4)} — có một khe hở chạy vòng quanh thành phố`);
    }
  }
  assert.ok(soKho > 3000, `chỉ còn ${soKho} đỉnh rìa khô — lời hứa "hai tấm khớp" đang rỗng dần`);
  assert.ok(soUot > 0, 'không đỉnh rìa nào chạm nước — nhánh phép khoét chưa bao giờ chạy');

  // ⚠️ ĐỐI CHỨNG — HAI TẤM PHẲNG THÌ CŨNG KHỚP. Không có vế này thì bài trên vẫn XANH TRỌN VẸN
  // trong đúng cái thế giới cũ có cái bệ: "khớp nhau" canh cái KHE HỞ, nó không canh cái BỆ.
  const trai = Math.max(...cao) - Math.min(...cao);
  assert.ok(trai > 0.3,
    `cao độ rìa chỉ trải ${trai.toFixed(4)} đơn vị — nó đang phẳng trở lại, tức cái vành mà mắt đọc `
    + 'ra là mép bàn vừa quay về.');
});

test('RÌA TẤM ĐẤT PHẢI KHỚP TẤM CHÂN TRỜI VỀ **MÀU** — và phải còn VÂN khi ra tới rìa', () => {
  // ⚠️ 2026-08-21 — BÀI NÀY SINH RA TỪ MỘT ĐƯỜNG VIỀN VUÔNG SẮC LẸM CHẠY QUANH THÀNH PHỐ Ở CẢ 15
  // KỶ. Bài ngay bên trên canh CAO ĐỘ ở đúng chỗ giáp ấy và nó xanh tuyệt đối (lệch đúng 0) — thế
  // mà mắt vẫn thấy một hình vuông. Đó là bài học Phase 9B đúng nguyên văn: *"đại lượng tôi vừa
  // vặn có nằm trong thứ công cụ này đo không?"* Cao độ khớp KHÔNG kéo theo màu khớp, và không một
  // bài nào trong dự án từng hỏi câu thứ hai.
  //
  // Bệnh: `groundColorAt` áp vết loang + sườn-dốc-lộ-đất RỒI mới hoà về `outerRgb`. Ở mép tấm hệ số
  // hoà đã bằng 1, nên phép hoà XOÁ SẠCH hai tầng vừa tính — cả vành ngoài ra đúng một màu phẳng,
  // trong khi tấm chân trời ngay sát bên vẫn còn đủ hai tầng. Đo trên chính ảnh dựng (kỷ 15, quét
  // ngang y=550): 113,124,111 → 132,144,129, tức **26,8 trên thang RGB/255**, gấp hơn hai lần
  // ngưỡng mắt 12. Đo trên tầng thuần thì trung vị 20–36 và p99 60–74 ở **cả 15 kỷ**.
  //
  // Hai vế, và vế thứ hai mới là vế nhốt được thế giới cũ:
  //   (a) QUAN HỆ — ở những đỉnh mà HAI tấm cùng có, màu hai bên phải bằng nhau dưới ngưỡng mắt.
  //   (b) ĐỐI CHỨNG — vành rìa phải còn VÂN. Không có vế (b) thì vế (a) vẫn xanh trong thế giới cũ
  //       ở phần lớn số đỉnh, vì chỗ nào vết loang tình cờ ≈ 1 thì hai bên vẫn khớp; và tệ hơn,
  //       cách "sửa" rẻ nhất để vế (a) xanh là làm PHẲNG cả hai tấm — đúng thứ ta vừa gỡ bỏ.
  const NGƯỠNG_MẮT = 12 / 255;
  let sốCặp = 0;
  let lệchMax = 0;
  for (const era of ERAS) {
    const { ground, terrain, palette } = dựng(era);
    const horizon = buildHorizon({ era, gridSize: GRID, terrain });
    const chânTrời = buildHorizonSurface({ horizon, palette, terrain, gridSize: GRID });
    assert.ok(chânTrời, `kỷ ${era}: không dựng được tấm chân trời`);

    const đọc = (surface) => {
      const p = surface.geometry.getAttribute('position').array;
      const c = surface.geometry.getAttribute('color').array;
      const out = [];
      for (let i = 0; i < p.length; i += 3) {
        out.push({ x: p[i], z: p[i + 2], c: [c[i], c[i + 1], c[i + 2]] });
      }
      return out;
    };
    const đất = đọc(ground);
    const trời = đọc(chânTrời);
    const maxX = Math.max(...đất.map((v) => Math.abs(v.x)));
    const khoá = (v) => `${v.x.toFixed(5)}|${v.z.toFixed(5)}`;
    const bảng = new Map();
    for (const v of trời) if (!bảng.has(khoá(v))) bảng.set(khoá(v), v);

    const rìa = đất.filter((v) => Math.abs(Math.abs(v.x) - maxX) < 1e-6
      || Math.abs(Math.abs(v.z) - maxX) < 1e-6);
    for (const v of rìa) {
      const o = bảng.get(khoá(v));
      if (!o) continue;   // hai lưới có bước khác nhau nên chỉ trùng ở vài đỉnh — xem gác đếm dưới
      sốCặp += 1;
      const d = Math.hypot(v.c[0] - o.c[0], v.c[1] - o.c[1], v.c[2] - o.c[2]);
      if (d > lệchMax) lệchMax = d;
      assert.ok(d < NGƯỠNG_MẮT,
        `kỷ ${era}: ở (${v.x.toFixed(2)},${v.z.toFixed(2)}) tấm đất tô ${v.c.map((k) => Math.round(k * 255))}`
        + ` còn tấm chân trời tô ${o.c.map((k) => Math.round(k * 255))} — lệch ${(d * 255).toFixed(1)}/255,`
        + ' tức một đường viền vuông mắt đọc ra được, chạy vòng quanh thành phố');
    }

    // ── (b) ĐỐI CHỨNG: vành rìa phải còn VÂN ────────────────────────────────
    // Trong thế giới cũ mọi đỉnh rìa ra ĐÚNG `outerRgb`, nên con số này bằng ĐÚNG 0 ở cả 15 kỷ.
    // So với chính phần trong lưới (một QUAN HỆ, không phải một mức) — mỗi kỷ một bảng màu riêng
    // nên một ngưỡng tuyệt đối sẽ đúng ở vài kỷ và chỏi ở số còn lại (bẫy Phase 7D).
    const tản = (mẫu, k) => {
      const a = mẫu.map((v) => v.c[k]);
      return Math.max(...a) - Math.min(...a);
    };
    const trong = đất.filter((v) => Math.abs(v.x) < 4 && Math.abs(v.z) < 4);
    for (let k = 0; k < 3; k += 1) {
      assert.ok(tản(rìa, k) > tản(trong, k) * 0.5,
        `kỷ ${era}: kênh ${k} — vành rìa chỉ tản ${(tản(rìa, k) * 255).toFixed(1)}/255 trong khi phần `
        + `trong lưới tản ${(tản(trong, k) * 255).toFixed(1)}/255. Vành ngoài đang bị san phẳng thành `
        + 'một màu, và cái mép phẳng ấy chính là đường viền hình vuông.');
    }
  }
  assert.equal(sốCặp, ERAS.length * 6,
    `chỉ tìm được ${sốCặp} cặp đỉnh trùng nhau (đáng lẽ ${ERAS.length * 6}) — bước lưới của một `
    + 'trong hai tấm vừa đổi, và vế (a) đang chạy gần như rỗng.');
  assert.ok(lệchMax > 0, 'lệch max bằng 0 tuyệt đối — nghi chính phép đo, không phải mã.');
});

test('MẶT ĐƯỜNG BÁM SÁT SƯỜN DỐC — đúng `ROAD_LIFT` phía trên mặt đất, không phải một phiến phẳng', () => {
  // ⚠️ Nửa còn lại của việc bỏ thềm bậc, và là nửa dễ quên: mặt đất đã mượt mà đường vẫn là những
  // phiến vuông nằm ngang thì cái lưới quay về ngay, chỉ mảnh hơn. Hỏi từng ĐỈNH một, không hỏi
  // trung bình — một phiến phẳng vẫn có thể trùng cao độ ở tâm mà sai ở bốn góc.
  //
  // ⚠️ TỪ PHASE 9D KHÔNG PHẢI ĐỈNH ĐƯỜNG NÀO CŨNG NẰM ĐÚNG `ROAD_LIFT`: vỉa hè nhô lên bằng chiều
  // cao bó vỉa, vạch kẻ nhô một chút để khỏi chọi mặt, và mặt bên bó vỉa thì có hẳn hai cao độ. Bài
  // này vì vậy hỏi RIÊNG **lòng đường** một cách chính xác tuyệt đối — đó là 90% số tam giác và là
  // đúng thứ "phiến phẳng" sẽ phá — rồi hỏi các lớp còn lại rằng chúng có nằm trong một dải mỏng
  // ngay trên mặt đất không. Lớp nào là lớp nào thì đọc từ `road.kinds` do chính bên dựng cấp.
  const NHÔ_TỐI_ĐA = 0.06;   // bó vỉa cao nhất (0,055) + chống chọi mặt (0,0035)
  let đã_kiểm = 0; let lòng_đường = 0;
  for (const era of ERAS) {
    const { terrain, road } = dựng(era);
    if (!road) continue;
    const v = đỉnh(road);
    for (let t = 0; t < road.kinds.length; t += 1) {
      const là_lòng = road.kinds[t] === ROAD_PART.CARRIAGEWAY;
      for (let k = 0; k < 3; k += 1) {
        const [x, y, z] = v[t * 3 + k];
        const nền = terrain.surfaceHeightAt(về_ô(x), về_ô(z)) + ROAD_LIFT;
        if (là_lòng) {
          assert.ok(
            Math.abs(y - nền) < 1e-5,
            `kỷ ${era}: đỉnh LÒNG ĐƯỜNG (${x.toFixed(2)},${z.toFixed(2)}) ở ${y.toFixed(4)}, đáng lẽ `
            + `${nền.toFixed(4)} — mặt đường đang là phiến phẳng, không bám sườn dốc`,
          );
          lòng_đường += 1;
        } else {
          assert.ok(
            y >= nền - 1e-5 && y <= nền + NHÔ_TỐI_ĐA + 1e-5,
            `kỷ ${era}: đỉnh lớp ${road.kinds[t]} ở (${x.toFixed(2)},${z.toFixed(2)}) cao ${y.toFixed(4)}, `
            + `ngoài dải [${nền.toFixed(4)} … ${(nền + NHÔ_TỐI_ĐA).toFixed(4)}] — vỉa hè/bó vỉa/vạch `
            + 'kẻ đang trôi khỏi mặt đường',
          );
        }
        đã_kiểm += 1;
      }
    }
  }
  assert.ok(đã_kiểm > 100, `chỉ kiểm được ${đã_kiểm} đỉnh đường — bài test này đang chạy không`);
  assert.ok(lòng_đường > 100, `chỉ kiểm được ${lòng_đường} đỉnh LÒNG ĐƯỜNG — mặt nạ lớp đang hỏng`);
});

test('LÒNG ĐƯỜNG DỰNG ĐÚNG HÌNH MÀ `carriagewayShape` KHAI — LÕI + CÁNH TAY, không bậc ở mép', () => {
  // ⚠️ ĐÂY LÀ LÝ DO MẶT ĐƯỜNG KHÔNG NẰM CHUNG LƯỚI VỚI MẶT ĐẤT. Nhét chung thì bề rộng ngõ bị làm
  // tròn về bội của một ô con (1/3), mà muốn CÂN GIỮA thì số ô con phải cùng chẵn-lẻ với 3 ⇒ chỉ
  // còn 1/3 (mảnh như sợi chỉ) hoặc 3/3 (bằng đại lộ). Lấy 2/3 thì đúng bề rộng nhưng LỆCH TÂM
  // 1/6 ô, và cư dân đi đúng tâm ô sẽ đi sát mép đường.
  //
  // ⚠️ VÀ NÓ CANH THÊM MỘT LỖI ĐÃ NHÌN THẤY TẬN MẮT Ở KỶ 13: bản đầu Phase 9D thu hẹp ô đường ở CẢ
  // HAI chiều, nên hai ô kề nhau chừa một khe cỏ và con đường vỡ thành những mảnh vuông rời rạc.
  // Bề rộng là đại lượng của mặt cắt NGANG; chiều DỌC phải vươn tới ranh giới ô khi còn đường nối
  // tiếp. Bài này hỏi CHÍNH hàm thuần mà bên dựng hỏi (`carriagewayShape`) rồi đối chiếu với đỉnh
  // dựng ra — nó canh việc bên dựng CÓ DÙNG luật ấy, chứ không diễn đạt lại luật bằng công thức
  // riêng (hai công thức "tương đương" luôn lệch nhau ở biên — Phase 3Y).
  let ngõ = 0; let đại_lộ = 0; let liền = 0; let cặpGiáp = 0;
  for (const era of ERAS) {
    const { layout, road } = dựng(era);
    if (!road) continue;
    const street = getStreetStyle(era);
    const ôĐường = new Set();
    const nửaCủa = new Map();
    for (const prop of layout.props ?? []) {
      if (prop.kind !== 'road') continue;
      ôĐường.add(`${prop.x}|${prop.y}`);
      const lane = prop.variant === 1 || prop.variant === 2;
      nửaCủa.set(`${prop.x}|${prop.y}`, streetCrossSection(street, lane).half);
    }
    const hàngXóm = (x, y) => ({
      west: nửaCủa.has(`${x - 1}|${y}`) ? nửaCủa.get(`${x - 1}|${y}`) : null,
      east: nửaCủa.has(`${x + 1}|${y}`) ? nửaCủa.get(`${x + 1}|${y}`) : null,
      north: nửaCủa.has(`${x}|${y - 1}`) ? nửaCủa.get(`${x}|${y - 1}`) : null,
      south: nửaCủa.has(`${x}|${y + 1}`) ? nửaCủa.get(`${x}|${y + 1}`) : null,
    });
    // ⚠️ GOM THEO TAM GIÁC, KHÔNG THEO ĐỈNH. Bản đầu lọc "mọi đỉnh cách tâm ô ≤ 0,5" và báo ngõ
    // dọc kỷ 1 rộng đúng 1,0 — nghe y hệt một lỗi thật. Không phải: ô ĐẠI LỘ bên cạnh có đỉnh nằm
    // đúng trên ranh giới ±0,5, nên chúng lọt vào mẫu của ô ngõ và thổi bề ngang lên. Mỗi tam giác
    // thì chỉ thuộc về MỘT ô (trọng tâm nằm hẳn bên trong), nên gom theo tam giác thì không có
    // chuyện nhận vơ. Cùng bẫy với "hạ tầng epic có hai mảng rộng bằng nhau" ở Phase 8A.
    //
    // ⚠️ VÀ CHỈ LẤY TAM GIÁC **LÒNG ĐƯỜNG**. Từ Phase 9D một ô đường còn có vỉa hè + bó vỉa nằm
    // NGOÀI lòng đường, nên "bề ngang của mọi tam giác trong ô" nay là bề ngang cả mặt cắt chứ
    // không phải bề rộng con đường — đo nhầm thì bài này báo ngõ rộng gần gấp đôi. Lớp nào là lớp
    // nào thì HỎI CHÍNH BÊN DỰNG (`road.kinds`), không phân loại lại bằng màu: mặt đường mòn nhất
    // của kỷ đá cuội sáng hơn vỉa hè của kỷ nhựa đường, nên phân loại bằng màu là đoán. Đây đúng
    // bài học `TECH_DEBT #22` — việc "đâu là cái gì" phải là dữ kiện do bên DỰNG cung cấp.
    const v = đỉnh(road);
    assert.ok(road.kinds?.length === v.length / 3, `kỷ ${era}: thiếu bảng phân lớp tam giác`);
    const theo_ô = new Map();
    for (let t = 0; t < road.kinds.length; t += 1) {
      if (road.kinds[t] !== ROAD_PART.CARRIAGEWAY) continue;
      const i = t * 3;
      const cx = (về_ô(v[i][0]) + về_ô(v[i + 1][0]) + về_ô(v[i + 2][0])) / 3;
      const cz = (về_ô(v[i][2]) + về_ô(v[i + 1][2]) + về_ô(v[i + 2][2])) / 3;
      const key = `${Math.round(cx)}|${Math.round(cz)}`;
      if (!theo_ô.has(key)) theo_ô.set(key, []);
      theo_ô.get(key).push(v[i], v[i + 1], v[i + 2]);
    }
    for (const prop of layout.props ?? []) {
      if (prop.kind !== 'road') continue;
      const trong = theo_ô.get(`${prop.x}|${prop.y}`);
      if (!trong || trong.length === 0) continue;
      const isLane = prop.variant === 1 || prop.variant === 2;
      const cross = streetCrossSection(street, isLane);
      const shape = carriagewayShape(cross.half, hàngXóm(prop.x, prop.y));
      const ext = shape.reach;
      const nối = {
        west: shape.arms.west !== null, east: shape.arms.east !== null,
        north: shape.arms.north !== null, south: shape.arms.south !== null,
      };
      // ⚠️ MỘT Ô KHÔNG BAO GIỜ ĐƯỢC RỘNG HƠN CHÍNH CON ĐƯỜNG CỦA NÓ. Đây là thứ giết cái phình
      // 0,5 ô ở ngã ba — bản trước Phase 12 cho mọi ô có nhánh nở ra trọn ô bất kể nhánh ấy hẹp
      // cỡ nào, và đó là nguồn của ~50% số bậc mép đường.
      for (const [trục, giá] of [['u', shape.coreU], ['v', shape.coreV]]) {
        assert.ok(
          giá <= cross.half + 1e-9,
          `kỷ ${era} ô (${prop.x},${prop.y}): lõi theo ${trục} rộng ${giá}, hơn cả con đường ${cross.half}`,
        );
      }
      const us = trong.map(([x]) => về_ô(x));
      const vs = trong.map(([, , z]) => về_ô(z));
      const mép = [
        ['tây', Math.min(...us), prop.x - ext.west],
        ['đông', Math.max(...us), prop.x + ext.east],
        ['bắc', Math.min(...vs), prop.y - ext.north],
        ['nam', Math.max(...vs), prop.y + ext.south],
      ];
      for (const [tên, đo, mong] of mép) {
        assert.ok(
          Math.abs(đo - mong) < 1e-6,
          `kỷ ${era} ô (${prop.x},${prop.y}) variant ${prop.variant}: mép ${tên} ở ${đo.toFixed(4)}, `
          + `đáng lẽ ${mong.toFixed(4)}`,
        );
      }
      // LIỀN MẠCH: cạnh nào giáp một ô đường khác thì lòng đường PHẢI chạm đúng ranh giới ô, nếu
      // không sẽ có khe cỏ chen giữa hai đoạn đường.
      for (const [tên, có, đo, ranh] of [
        ['tây', nối.west, Math.min(...us), prop.x - 0.5],
        ['đông', nối.east, Math.max(...us), prop.x + 0.5],
        ['bắc', nối.north, Math.min(...vs), prop.y - 0.5],
        ['nam', nối.south, Math.max(...vs), prop.y + 0.5],
      ]) {
        if (!có) continue;
        assert.ok(
          Math.abs(đo - ranh) < 1e-6,
          `kỷ ${era} ô (${prop.x},${prop.y}): phía ${tên} có ô đường nối tiếp mà lòng đường dừng ở `
          + `${đo.toFixed(4)} thay vì ${ranh.toFixed(4)} — hai đoạn đường hở một khe cỏ`,
        );
        liền += 1;
      }
      // CÂN GIỮA theo trục NGANG của chính nó — chỉ xét ô không phải ngã ba/ngã tư trên trục ấy.
      if (!nối.west && !nối.east) {
        const tâm = (Math.min(...us) + Math.max(...us)) / 2;
        assert.ok(
          Math.abs(tâm - prop.x) < 1e-6,
          `kỷ ${era} ô (${prop.x},${prop.y}) lệch tâm ngang ${(tâm - prop.x).toFixed(4)} ô — `
          + 'cư dân đi đúng tâm ô sẽ đi sát mép đường',
        );
        // ⚠️ SO VỚI `shape.coreU`, KHÔNG VỚI `cross.half`. Từ Phase 12 một ô có thể HẸP HƠN con
        // đường nó khai — đó chính là bản vá: ô nào chỉ chạm toàn ngõ thì thu về đúng bề ngõ thay
        // vì phình ra. Trần `coreU ≤ cross.half` đã được canh riêng ở trên, nên vế "không rộng hơn
        // con đường của mình" vẫn còn nguyên răng.
        assert.ok(
          Math.abs((Math.max(...us) - Math.min(...us)) - shape.coreU * 2) < 1e-6,
          `kỷ ${era} ô (${prop.x},${prop.y}) rộng ${(Math.max(...us) - Math.min(...us)).toFixed(4)}, `
          + `đáng lẽ ${(shape.coreU * 2).toFixed(4)}`,
        );
        if (isLane) ngõ += 1; else đại_lộ += 1;
      }
    }

    // ⚠️ ĐÂY LÀ LỜI HỨA CHÍNH CỦA PHASE 12, VÀ NÓ PHẢI ĐO TRÊN ĐỈNH THẬT, KHÔNG ĐỌC LẠI HÀM THUẦN.
    // Hai ô đường kề nhau phải trình ra CÙNG một bề rộng tại chỗ giáp. Lệch một chút là một BẬC
    // vuông góc chạy dọc mép đường — thứ Đàm gọi là "đường lòi lõm". Đo bằng cách lấy mọi đỉnh
    // lòng đường NẰM ĐÚNG trên ranh giới chung rồi so khoảng chúng phủ.
    for (const prop of layout.props ?? []) {
      if (prop.kind !== 'road') continue;
      for (const [du, dv] of [[1, 0], [0, 1]]) {
        if (!ôĐường.has(`${prop.x + du}|${prop.y + dv}`)) continue;
        const ranh = (du ? prop.x : prop.y) + 0.5;
        // ⚠️ HAI CHỈ SỐ NÀY TỪNG VIẾT NGƯỢC, và bài test "xanh" một cách vô nghĩa vì `phủ` không
        // tìm thấy đỉnh nào — chính dòng đếm `cặpGiáp` cuối bài mới tố cáo. Ranh giới ĐÔNG-TÂY
        // (`du`) là một đường thẳng đứng: toạ độ bị CẮT là `u` (chỉ số 0), toạ độ chạy DỌC nó là
        // `v` (chỉ số 2). Viết ngược thì đi tìm đỉnh ở một nơi không có đỉnh nào.
        const cắtNgang = du ? 0 : 2;        // toạ độ vuông góc với ranh giới
        const dọcTheo = du ? 2 : 0;         // toạ độ chạy DỌC ranh giới
        const phủ = (key) => {
          const ds = (theo_ô.get(key) ?? [])
            .filter((đ) => Math.abs(về_ô(đ[cắtNgang]) - ranh) < 1e-6)
            .map((đ) => về_ô(đ[dọcTheo]));
          return ds.length ? [Math.min(...ds), Math.max(...ds)] : null;
        };
        const a = phủ(`${prop.x}|${prop.y}`);
        const b = phủ(`${prop.x + du}|${prop.y + dv}`);
        if (!a || !b) continue;
        cặpGiáp += 1;
        assert.ok(
          Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6,
          `kỷ ${era}: ô (${prop.x},${prop.y}) và (${prop.x + du},${prop.y + dv}) giáp nhau mà bên `
          + `này phủ [${a[0].toFixed(4)}, ${a[1].toFixed(4)}] còn bên kia phủ `
          + `[${b[0].toFixed(4)}, ${b[1].toFixed(4)}] — đó là một BẬC ở mép đường`,
        );
      }
    }
    assert.ok(
      street.lane < street.avenue,
      `kỷ ${era}: ngõ (${street.lane}) phải hẹp hơn đại lộ (${street.avenue})`,
    );
  }
  assert.ok(ngõ > 0 && đại_lộ > 0, `phải gặp cả hai hạng đường (ngõ ${ngõ}, đại lộ ${đại_lộ})`);
  assert.ok(liền > 50, `chỉ gặp ${liền} mép nối — bài canh liền mạch đang chạy không`);
  // Gác chạy-rỗng cho phép đo bậc: nó duyệt một tập con của `liền`, nên phải tự khai số cặp đã xét.
  assert.ok(cặpGiáp > 500, `chỉ so ${cặpGiáp} cặp giáp nhau — phép canh bậc đang chạy gần như rỗng`);
});

test('NGÂN SÁCH TAM GIÁC CỦA ĐỊA HÌNH KHÔNG ĐƯỢC PHÌNH LÊN TRONG IM LẶNG', () => {
  // Số tam giác của tấm đất đi theo BÌNH PHƯƠNG độ mịn: nâng `SUB` từ 3 lên 4 là +77%, lên 6 là
  // +287%. Không có gì đỏ khi làm vậy — chỉ có iPhone của Đàm nóng lên. Trần này là dây bẫy, không
  // phải mục tiêu: nó chỉ cần bắt được một lần nâng độ mịn mà quên tính tiền.
  //
  // ⚠️ TRẦN NÂNG 9.000 → 16.000 Ở PHASE 9D, VÀ ĐÂY LÀ SỐ ĐO CHỨ KHÔNG PHẢI SỰ NHÂN NHƯỢNG. Mặt
  // đường thôi là một dải màu phẳng và thành một hệ có lớp (lòng đường chia theo cỡ viên lát · bó
  // vỉa · vỉa hè · vạch kẻ), nên nó tốn hơn — đó là thứ mua được, không phải thứ trượt ra.
  // Đo thật (kỷ 8, viên lát mịn nhất bộ, nên là ca đắt nhất trong 15 kỷ):
  //   • địa hình + đường : 7.122 → 14.914 tam giác   (kỷ rẻ nhất vẫn giữ nguyên 7.122)
  //   • CẢ CẢNH          : 27.626 → 31.546 tam giác  (ngân sách cảnh là 60.000 ⇒ còn dư 47%)
  //   • lệnh vẽ          : 13 → 13  (KHÔNG đổi — cả bốn lớp dùng chung một khối, một vật liệu)
  //   • ms/khung         : 2.378 → 2.461  (+3,5%)
  // ⚠️ Con số ms ấy đo bằng SwiftShader (rasterise bằng CPU), tức là CẬN TRÊN: CPU không có phần
  // cứng cho phép tính đỉnh, nên trên GPU MacBook phần tăng còn nhỏ hơn nhiều. Đọc nó như "thêm
  // 3,5% ở trường hợp tệ nhất có thể", không phải như FPS thật.
  // Trần 16.000 để lại ~7% dư trên ca đắt nhất — đủ chật để một lần nâng độ mịn nữa là đỏ ngay.
  for (const era of ERAS) {
    const { ground, road } = dựng(era);
    const tổng = (ground?.triangles ?? 0) + (road?.triangles ?? 0);
    assert.ok(tổng > 0, `kỷ ${era}: địa hình không sinh ra tam giác nào`);
    assert.ok(
      tổng <= 16000,
      `kỷ ${era}: địa hình tốn ${tổng} tam giác (trần 16.000). Ngân sách cả cảnh là 60.000 và công `
      + 'trình đã ăn ~17.000 sau Phase 8B.',
    );
  }
});

test('VỈA HÈ DỰNG RA ĐÚNG THỨ BẢNG KHAI — khai 0 thì KHÔNG một tam giác vỉa hè nào, khai khác 0 thì có', () => {
  // ⚠️ ĐÂY LÀ CHIỀU THỨ HAI CỦA KHOÁ VỈA HÈ (`TECH_DEBT #42`). `streetStyle.test.js` canh ở tầng DỮ
  // LIỆU — "bảng khai gì, `streetCrossSection` trả về gì". Bài này canh ở tầng HÌNH HỌC — "tam giác
  // có thật sự sinh ra không". Hai câu hỏi khác nhau, và bài học Phase 4H nói rõ vì sao phải hỏi cả
  // hai: một hàm chạy đúng KHÔNG chứng minh có ai gọi nó.
  const CÓ = [4, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const KHÔNG = [1, 2, 3, 5, 6];
  let sốCó = 0; let sốKhông = 0;

  for (const era of [...CÓ, ...KHÔNG]) {
    const { road } = dựng(era);
    let tamGiácVỉaHè = 0; let tamGiácBóVỉa = 0; let tamGiácLòngĐường = 0;
    for (let t = 0; t < road.kinds.length; t += 1) {
      if (road.kinds[t] === ROAD_PART.WALK) tamGiácVỉaHè += 1;
      else if (road.kinds[t] === ROAD_PART.CURB) tamGiácBóVỉa += 1;
      else if (road.kinds[t] === ROAD_PART.CARRIAGEWAY) tamGiácLòngĐường += 1;
    }
    // Gác chạy-rỗng TỪNG KỶ: nếu kỷ này chẳng có mét đường nào thì mọi khẳng định bên dưới đều vô
    // nghĩa mà vẫn xanh — đúng bẫy fixture đã ghi ở đầu file.
    assert.ok(tamGiácLòngĐường > 100,
      `kỷ ${era} chỉ dựng ${tamGiácLòngĐường} tam giác lòng đường — fixture rỗng, bài test không canh gì`);

    if (KHÔNG.includes(era)) {
      sốKhông += 1;
      assert.equal(tamGiácVỉaHè, 0, `kỷ ${era} khai walk 0 mà vẫn dựng ${tamGiácVỉaHè} tam giác vỉa hè`);
      assert.equal(tamGiácBóVỉa, 0, `kỷ ${era} không có vỉa hè mà vẫn dựng ${tamGiácBóVỉa} tam giác bó vỉa`);
    } else {
      sốCó += 1;
      assert.ok(tamGiácVỉaHè > 0,
        `kỷ ${era} khai vỉa hè ${STREET_STYLES[era].walk} mà tầng vẽ dựng ra 0 tam giác — `
        + `bảng nói một đằng, màn hình hiện một nẻo`);
    }
  }
  assert.equal(sốCó, CÓ.length);
  assert.equal(sốKhông, KHÔNG.length);

  // Và danh sách trên phải BÁM theo bảng, không phải một bản chép tay già đi trong im lặng.
  for (const era of CÓ) assert.ok(STREET_STYLES[era].walk > 0, `kỷ ${era} nằm trong danh sách CÓ nhưng bảng khai walk 0`);
  for (const era of KHÔNG) assert.equal(STREET_STYLES[era].walk, 0, `kỷ ${era} nằm trong danh sách KHÔNG nhưng bảng khai walk khác 0`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// MẶT NƯỚC — VIỆC 2 Bước B (2026-08-19)
// ═══════════════════════════════════════════════════════════════════════════════

test('MẶT NƯỚC LÀ ĐÚNG MỘT TẤM PHẲNG — cùng một cao độ ở mọi đỉnh, không một gợn nào', () => {
  // ⚠️ Đàm CẤM shader nước động (sóng, gợn, phản chiếu động): *"Mặt nước phẳng, vật liệu tĩnh."*
  // Một tấm phẳng tuyệt đối giữa một mặt đất gợn CHÍNH LÀ tín hiệu để mắt đọc ra "đây là nước" —
  // nó không phải một sự thiếu thốn phải bù bằng hiệu ứng.
  //
  // THỬ-CHO-ĐỎ: trong `buildWaterSurface`, đổi `WATER_SURFACE_Y` thành `WATER_SURFACE_Y + u * 0.01`
  // ⇒ đỏ ngay ở dòng `assert.equal(pos[i + 1], ...)`.
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const terrain = buildTerrain({ era, gridSize: 12 });
    const horizon = buildHorizon({ era, gridSize: 12 });
    const out = buildWaterSurface({ setting: terrain.setting, gridSize: 12, horizon });
    assert.ok(out, `kỷ ${era}: không dựng được tấm nước nào`);
    assert.ok(out.triangles > 200, `kỷ ${era}: tấm nước chỉ ${out.triangles} tam giác — quá mỏng`);

    // ⚠️ HỎI "PHẲNG" BẰNG CÁCH SO CÁC ĐỈNH VỚI NHAU, KHÔNG SO VỚI HẰNG SỐ. Bản đầu viết
    // `assert.equal(pos[i + 1], WATER_SURFACE_Y)` và ĐỎ trên mã đang đúng: kho đỉnh là `Float32Array`
    // nên −0,9199999999999999 (float64) cất vào rồi đọc ra thành −0,9200000166893005. Đó là phép
    // làm tròn của kiểu dữ liệu, không phải một gợn sóng. So các đỉnh với nhau thì phép đo hỏi đúng
    // câu nó muốn hỏi ("có phẳng không") và CHẶT HƠN: nó bắt được cả một gợn 1e-7 lẫn một tấm
    // nghiêng đều. Vế "đúng mực nước" hỏi riêng, với dung sai của float32.
    const pos = out.geometry.getAttribute('position').array;
    const y0 = pos[1];
    for (let i = 0; i < pos.length; i += 3) {
      assert.equal(pos[i + 1], y0,
        `kỷ ${era}: mặt nước không phẳng — một đỉnh ở ${pos[i + 1]}, đỉnh đầu ở ${y0}`);
    }
    assert.ok(Math.abs(y0 - WATER_SURFACE_Y) < 1e-6,
      `kỷ ${era}: mặt nước phẳng nhưng đặt sai cao độ (${y0} thay vì ${WATER_SURFACE_Y})`);

    // Pháp tuyến phải hướng thẳng lên: nghiêng một chút là ánh sáng loang lổ trên một mặt phẳng.
    const nor = out.geometry.getAttribute('normal').array;
    for (let i = 0; i < nor.length; i += 3) {
      assert.equal(nor[i], 0, `kỷ ${era}: pháp tuyến mặt nước nghiêng theo x`);
      assert.equal(nor[i + 1], 1, `kỷ ${era}: pháp tuyến mặt nước không hướng lên`);
      assert.equal(nor[i + 2], 0, `kỷ ${era}: pháp tuyến mặt nước nghiêng theo z`);
    }
  }
});

test('TẤM NƯỚC PHẢI NẰM GỌN TRONG THẾ GIỚI — không thò ra ngoài rặng núi chân trời', () => {
  // ⚠️ `setting.bounds` có thể là ±Infinity (dải nước cắt ngang toàn cảnh, hoặc biển ra tới chân
  // trời), nên phép kẹp theo `horizon.reach` là BẮT BUỘC, không phải phòng xa. Thiếu nó thì
  // `Math.ceil(Infinity)` cho ra một vòng lặp không bao giờ dừng.
  //
  // THỬ-CHO-ĐỎ: bỏ `Math.min(reach + half, …)` ⇒ kỷ 14 treo máy (biển `width: null`), nên bài này
  // vừa là hàng rào vừa là cái phanh.
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const terrain = buildTerrain({ era, gridSize: 12 });
    const horizon = buildHorizon({ era, gridSize: 12 });
    const out = buildWaterSurface({ setting: terrain.setting, gridSize: 12, horizon });
    const pos = out.geometry.getAttribute('position').array;
    for (let i = 0; i < pos.length; i += 3) {
      assert.ok(Math.abs(pos[i]) <= horizon.reach + 1e-6,
        `kỷ ${era}: đỉnh mặt nước ở x=${pos[i]}, ra ngoài chân trời ${horizon.reach}`);
      assert.ok(Math.abs(pos[i + 2]) <= horizon.reach + 1e-6,
        `kỷ ${era}: đỉnh mặt nước ở z=${pos[i + 2]}, ra ngoài chân trời ${horizon.reach}`);
    }
  }
});

test('KỶ KHÔ KHÔNG ĐƯỢC DỰNG MỘT TAM GIÁC NƯỚC NÀO — đây là ràng buộc lệnh vẽ của Đàm', () => {
  // THỬ-CHO-ĐỎ: bỏ `if (!setting?.built …) return null` ⇒ đỏ ở kỷ 1 (và kèm theo, mốc lệnh vẽ của
  // 13 kỷ khô ở `drawCallBudget.test.js` cũng đỏ).
  const kyKho = [];
  for (let era = 1; era <= 15; era += 1) {
    if (ERAS_WITH_WATER_GEOMETRY.includes(era)) continue;
    kyKho.push(era);
    const terrain = buildTerrain({ era, gridSize: 12 });
    const horizon = buildHorizon({ era, gridSize: 12 });
    assert.equal(buildWaterSurface({ setting: terrain.setting, gridSize: 12, horizon }), null,
      `kỷ ${era} chưa dựng nước mà vẫn sinh ra hình học mặt nước — đó là +1 lệnh vẽ không ai trả`);
  }
  // ⚠️ BƯỚC C (2026-08-20): con số này ĐI THEO bảng `ERAS_WITH_WATER_GEOMETRY`, nên nó phải đổi mỗi
  // lần một kỷ được dựng nước. Sau Bước C chỉ còn ĐÚNG một kỷ khô (kỷ 1 — Göbekli Tepe trên sườn
  // núi, không có nước theo đúng lịch sử). Để nguyên số 13 thì bài này chạy RỖNG mà vẫn xanh.
  assert.deepEqual(kyKho, [1], 'sau Bước C chỉ còn ĐÚNG kỷ 1 là khô');
});

test('MÀU NƯỚC ĐI TỪ CẠN SANG SÂU — đó là thứ thay cho sóng, nên nó phải THẬT SỰ đổi', () => {
  // ⚠️ Bài học Phase 8D: một cơ chế trông thuyết phục trên ảnh mà chưa bao giờ làm gì. Ở đây phải
  // đo: hai đầu bảng màu có thật sự xuất hiện trên tấm nước không, hay cả tấm ra một sắc duy nhất?
  //
  // ⚠️ BƯỚC C (2026-08-20) — LẦN NỮA: MỘT LỜI HỨA VỀ QUAN HỆ ĐƯỢC VIẾT THÀNH MỘT MỨC (bẫy Phase 7D).
  // Bản cũ đòi `trai > 0.02` ở MỌI kỷ. Con số ấy đúng khi chỉ có hai kỷ nước, cả hai đều là biển/
  // sông lớn nên chạm đáy tối đa. Bước C dựng nước cho 14 kỷ, trong đó có sông hẹp — và sắc nước
  // suy từ ĐỘ SÂU, mà độ sâu thì ĐI THEO BỀ RỘNG (xem `setting.test.js`, bảng SÂU/NÔNG). Kỷ 5 chỉ
  // sâu tới 0,111 trên trần 0,55 ⇒ trải sắc 0,0042. Đó KHÔNG phải cơ chế chết; nó là cùng một cơ
  // chế đang chạy trên một dải hẹp hơn năm lần.
  // ⚠️ Còn một tầng nén THỨ HAI ít ai để ý: sắc nước là `smoothstep(sâu / WATER_BED_DEPTH)`, mà
  // `smoothstep` PHẲNG ở gần 0 (bậc ba). Nước nông vì thế bị nén HAI lần — một lần vì dải sâu ngắn,
  // một lần nữa vì nó rơi vào đúng khúc phẳng của đường cong. Đo được: trải-sắc ÷ dải-sâu là 0,038
  // ở kỷ 5 nhưng 0,079 ở kỷ 8 — cùng một công thức, khác nhau vì chỗ đứng trên đường cong.
  //
  // ⇒ Ba câu hỏi TÁCH RA, mỗi câu một phép đo:
  //   (1) mỗi kỷ có một DẢI SÂU thật để mà ánh xạ không (nếu không thì mọi thứ sau là vô nghĩa);
  //   (2) ánh xạ sâu→sắc có CÒN SỐNG và có DÙNG CHUNG một đường cong không — hỏi bằng QUAN HỆ:
  //       kỷ nào có dải sâu rộng hơn hẳn thì trải sắc phải KHÔNG kém hơn. Đây là thứ bắt được một
  //       bản vá "chữa riêng kỷ 5 cho qua cổng", mà một cái ngưỡng thì không bắt được;
  //       ⚠️ và phép so ấy phải CHIA cho BIÊN ĐỘ bảng sắc của TỪNG KIỂU NƯỚC trước khi so, vì năm
  //       kiểu nước có năm bảng sắc rộng hẹp khác nhau (kênh 0,0264 · cửa sông 0,0433 — chênh 1,6
  //       lần). So thô thì đang trộn HAI đại lượng (dải sâu và biên độ bảng sắc) vào một con số, và
  //       đo được là nó chỉ còn **0,00070** biên ở cặp 4→12 — mỏng tới mức một lần chỉnh màu vu vơ
  //       cũng làm nó kêu oan. Chuẩn hoá xong thì biên mỏng nhất là **0,01776** (cặp 4→8), rộng
  //       gấp 25 lần, VÀ nó đúng về cấu trúc: trải-chuẩn-hoá chính là bề rộng của `smoothstep`
  //       trên dải sâu, nên nó ĐƠN ĐIỆU theo dải sâu bởi định nghĩa. Sáu kỷ chạm đáy tối đa đều ra
  //       đúng **1,0000** — khớp từng đơn vị với bảng SÂU ở `setting.test.js`;
  //       ⚠️ chuẩn hoá thì chia mất biên độ bảng sắc, nên phải hỏi RIÊNG một câu nữa: mỗi kiểu nước
  //       có còn hai đầu phân biệt được không (nếu không, cả tấm một màu mà phép đơn điệu vẫn xanh);
  //   (3) kỷ nào có tín hiệu mờ hơn mức cũ 0,02 — ghi ra TƯỜNG MINH ĐẾM ĐƯỢC, đúng khuôn `TRUOT`
  //       mà Đàm đã chốt cho #59, thay vì hạ ngưỡng cho vừa (hạ ngưỡng = cái phễu Phase 9A).
  //
  // THỬ-CHO-ĐỎ (đã chạy, nêu TRƯỚC chỗ mong đỏ): (a) `depthAt` trả hằng số ⇒ đỏ ở `dai > 0.10`;
  // (b) nới bề rộng kỷ 5 ⇒ đỏ ở phép đơn điệu; (c) bóp dẹt riêng bảng sắc `sea` ⇒ đỏ ở sàn biên độ;
  // (d) rút một kỷ khỏi `ERAS_WITH_WATER_GEOMETRY` ⇒ đỏ ở bài "kỷ khô" bên trên.
  const CONG_TRAI = 0.02;
  const KHE_DAI = 0.02;    // hai kỷ chênh dải sâu ít hơn ngần này thì KHÔNG so — chúng ngang nhau
  const SAN_BIEN_DO = 0.02; // đo thật: hẹp nhất là `canal` 0,0264; rộng nhất `estuary` 0,0433
  const scratch = new Color();
  const meanRgb = (hex) => { scratch.setHex(hex); return (scratch.r + scratch.g + scratch.b) / 3; };
  const do_ = new Map();
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const terrain = buildTerrain({ era, gridSize: 12 });
    const horizon = buildHorizon({ era, gridSize: 12 });
    const out = buildWaterSurface({ setting: terrain.setting, gridSize: 12, horizon });
    const col = out.geometry.getAttribute('color').array;
    const pos = out.geometry.getAttribute('position').array;
    const half = (12 - 1) / 2;
    let lo = Infinity;
    let hi = -Infinity;
    let sauLo = Infinity;
    let sauHi = -Infinity;
    for (let i = 0; i < col.length; i += 3) {
      const v = (col[i] + col[i + 1] + col[i + 2]) / 3;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
      const s = terrain.setting.depthAt(pos[i] + half, pos[i + 2] + half);
      sauLo = Math.min(sauLo, s);
      sauHi = Math.max(sauHi, s);
    }
    const kieu = terrain.setting.style.water;
    assert.ok(WATER_TINT[kieu],
      `kỷ ${era}: kiểu nước "${kieu}" không có màu trong \`WATER_TINT\``);
    const bienDo = Math.abs(meanRgb(WATER_TINT[kieu].sau) - meanRgb(WATER_TINT[kieu].can));
    assert.ok(bienDo > SAN_BIEN_DO,
      `kiểu nước "${kieu}" có bảng sắc dẹt (biên độ ${bienDo.toFixed(4)}) — hai đầu cạn/sâu đã gần `
      + 'như cùng một màu, nên chia thế nào cũng không còn tín hiệu để mà đơn điệu.');
    do_.set(era, { kieu, trai: hi - lo, dai: sauHi - sauLo, chuan: (hi - lo) / bienDo });
    // (1) Đo thật: mỏng nhất là kỷ 5 = 0,1108. Sàn 0,10 để nó còn kêu nếu ai đó thu nước hẹp thêm.
    assert.ok(sauHi - sauLo > 0.10,
      `kỷ ${era}: cả tấm nước chỉ có dải sâu ${(sauHi - sauLo).toFixed(4)} — không có gì để ánh xạ `
      + 'thành sắc, tức lời hứa "cạn dần vào bờ" rỗng ngay từ hình học.');
  }

  // (2) QUAN HỆ, không phải MỨC. Đo thật: 76 cặp đủ điều kiện so, 0 cặp vi phạm, biên mỏng nhất
  // 0,01776 ở cặp 4→8.
  let soCapSo = 0;
  for (const a of ERAS_WITH_WATER_GEOMETRY) {
    for (const b of ERAS_WITH_WATER_GEOMETRY) {
      const A = do_.get(a);
      const B = do_.get(b);
      if (!(A.dai + KHE_DAI < B.dai)) continue;
      soCapSo += 1;
      assert.ok(A.chuan <= B.chuan + 1e-9,
        `kỷ ${a} có dải sâu ${A.dai.toFixed(3)} (hẹp hơn kỷ ${b}: ${B.dai.toFixed(3)}) mà trải sắc `
        + `chuẩn hoá ${A.chuan.toFixed(4)} lại ĐẬM HƠN ${B.chuan.toFixed(4)} — hai kỷ đang dùng hai `
        + 'đường cong khác nhau, tức có ai đó vá riêng một kỷ.');
    }
  }
  assert.ok(soCapSo > 60, `chỉ so được ${soCapSo} cặp — phép đơn điệu đang teo lại`);

  // (3) Ghi ra tường minh, đỏ CẢ HAI CHIỀU: kỷ thứ năm mờ đi thì đỏ, một trong bốn kỷ này đậm lên
  // cũng đỏ. Cùng gốc với `TRUOT = [6, 7, 10]` ở `waterView.test.js` — nước hẹp thì vừa chiếm ít
  // khung hình vừa nhạt sắc, một nguyên nhân sinh ra hai triệu chứng. Xem `TECH_DEBT` #60.
  const MO_NHAT = ERAS_WITH_WATER_GEOMETRY.filter((era) => do_.get(era).trai < CONG_TRAI);
  assert.deepEqual(MO_NHAT, [5, 6, 7, 10],
    'bảng kỷ có tín hiệu cạn-sâu mờ hơn cổng cũ đã đổi — nếu vì nước rộng ra thì mừng, nhưng phải '
    + 'sửa bảng này và ghi lại; nếu vì nước hẹp thêm thì đó là hồi quy.');
});
