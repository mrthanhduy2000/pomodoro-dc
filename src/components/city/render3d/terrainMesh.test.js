import test from 'node:test';
import assert from 'node:assert/strict';

import { LANE_WIDTH, ROAD_LIFT, buildRoadSurface, buildTerrainSurface } from './terrainMesh.js';
import { APRON_DROP, buildTerrain } from '../../../engine/city3d/terrain.js';
import { buildScenePalette } from '../../../engine/city3d/palette3d.js';
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

test('RÌA TẤM ĐẤT PHẲNG ĐÚNG `-APRON_DROP` để khớp tấm ván vùng ngoài', () => {
  // Tấm ván vùng ngoài của `sceneGraph.js` ngồi ở đúng cao độ này. Rìa lưới còn gợn ⇒ hở một khe
  // răng cưa vòng quanh thành phố, im lặng.
  for (const era of ERAS) {
    const { ground } = dựng(era);
    const v = đỉnh(ground);
    const maxX = Math.max(...v.map((p) => p[0]));
    for (const [x, y, z] of v) {
      if (Math.abs(Math.abs(x) - maxX) > 1e-6 && Math.abs(Math.abs(z) - maxX) > 1e-6) continue;
      assert.ok(
        Math.abs(y + APRON_DROP) < 1e-6,
        `kỷ ${era}: đỉnh rìa (${x.toFixed(2)},${z.toFixed(2)}) ở cao độ ${y.toFixed(4)}, `
        + `đáng lẽ ${-APRON_DROP}`,
      );
    }
  }
});

test('MẶT ĐƯỜNG BÁM SÁT SƯỜN DỐC — đúng `ROAD_LIFT` phía trên mặt đất, không phải một phiến phẳng', () => {
  // ⚠️ Nửa còn lại của việc bỏ thềm bậc, và là nửa dễ quên: mặt đất đã mượt mà đường vẫn là những
  // phiến vuông nằm ngang thì cái lưới quay về ngay, chỉ mảnh hơn. Hỏi từng ĐỈNH một, không hỏi
  // trung bình — một phiến phẳng vẫn có thể trùng cao độ ở tâm mà sai ở bốn góc.
  let đã_kiểm = 0;
  for (const era of ERAS) {
    const { terrain, road } = dựng(era);
    if (!road) continue;
    for (const [x, y, z] of đỉnh(road)) {
      const đúng = terrain.surfaceHeightAt(về_ô(x), về_ô(z)) + ROAD_LIFT;
      assert.ok(
        Math.abs(y - đúng) < 1e-5,
        `kỷ ${era}: đỉnh đường (${x.toFixed(2)},${z.toFixed(2)}) ở ${y.toFixed(4)}, đáng lẽ `
        + `${đúng.toFixed(4)} — mặt đường đang là phiến phẳng, không bám sườn dốc`,
      );
      đã_kiểm += 1;
    }
  }
  assert.ok(đã_kiểm > 100, `chỉ kiểm được ${đã_kiểm} đỉnh đường — bài test này đang chạy không`);
});

test('NGÕ PHỐ HẸP HƠN ĐẠI LỘ **VÀ NẰM CÂN GIỮA Ô** — chính ràng buộc đã bắt tách tấm đường ra', () => {
  // ⚠️ ĐÂY LÀ LÝ DO MẶT ĐƯỜNG KHÔNG NẰM CHUNG LƯỚI VỚI MẶT ĐẤT. Nhét chung thì bề rộng ngõ bị làm
  // tròn về bội của một ô con (1/3), mà muốn CÂN GIỮA thì số ô con phải cùng chẵn-lẻ với 3 ⇒ chỉ
  // còn 1/3 (mảnh như sợi chỉ) hoặc 3/3 (bằng đại lộ). Lấy 2/3 thì đúng bề rộng nhưng LỆCH TÂM
  // 1/6 ô, và cư dân đi đúng tâm ô sẽ đi sát mép đường. Bài này khoá cả hai vế cùng lúc: bỏ vế
  // "cân giữa" thì bản dựng chung lưới sẽ lại qua cửa.
  let ngõ = 0; let đại_lộ = 0;
  for (const era of ERAS) {
    const { layout, road } = dựng(era);
    if (!road) continue;
    // ⚠️ GOM THEO TAM GIÁC, KHÔNG THEO ĐỈNH. Bản đầu lọc "mọi đỉnh cách tâm ô ≤ 0,5" và báo ngõ
    // dọc kỷ 1 rộng đúng 1,0 — nghe y hệt một lỗi thật. Không phải: ô ĐẠI LỘ bên cạnh có đỉnh nằm
    // đúng trên ranh giới ±0,5, nên chúng lọt vào mẫu của ô ngõ và thổi bề ngang lên. Mỗi tam giác
    // thì chỉ thuộc về MỘT ô (trọng tâm nằm hẳn bên trong), nên gom theo tam giác thì không có
    // chuyện nhận vơ. Cùng bẫy với "hạ tầng epic có hai mảng rộng bằng nhau" ở Phase 8A.
    const v = đỉnh(road);
    const theo_ô = new Map();
    for (let i = 0; i < v.length; i += 3) {
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
      const us = trong.map(([x]) => về_ô(x));
      const rộng = Math.max(...us) - Math.min(...us);
      const tâm = (Math.max(...us) + Math.min(...us)) / 2;
      if (prop.variant === 1) {
        assert.ok(
          Math.abs(rộng - LANE_WIDTH) < 1e-6,
          `kỷ ${era} ngõ dọc (${prop.x},${prop.y}) rộng ${rộng.toFixed(4)}, đáng lẽ ${LANE_WIDTH}`,
        );
        assert.ok(
          Math.abs(tâm - prop.x) < 1e-6,
          `kỷ ${era} ngõ dọc (${prop.x},${prop.y}) lệch tâm ${(tâm - prop.x).toFixed(4)} ô — `
          + 'cư dân đi đúng tâm ô sẽ đi sát mép đường',
        );
        ngõ += 1;
      } else if (prop.variant === 0) {
        assert.ok(Math.abs(rộng - 1) < 1e-6, `kỷ ${era} đại lộ (${prop.x},${prop.y}) không rộng trọn ô`);
        đại_lộ += 1;
      }
    }
  }
  assert.ok(ngõ > 0 && đại_lộ > 0, `phải gặp cả hai hạng đường (ngõ ${ngõ}, đại lộ ${đại_lộ})`);
  assert.ok(LANE_WIDTH < 1, 'ngõ phải hẹp hơn đại lộ');
});

test('NGÂN SÁCH TAM GIÁC CỦA ĐỊA HÌNH KHÔNG ĐƯỢC PHÌNH LÊN TRONG IM LẶNG', () => {
  // Số tam giác của tấm đất đi theo BÌNH PHƯƠNG độ mịn: nâng `SUB` từ 3 lên 4 là +77%, lên 6 là
  // +287%. Không có gì đỏ khi làm vậy — chỉ có iPhone của Đàm nóng lên. Trần này là dây bẫy, không
  // phải mục tiêu: nó chỉ cần bắt được một lần nâng độ mịn mà quên tính tiền.
  for (const era of ERAS) {
    const { ground, road } = dựng(era);
    const tổng = (ground?.triangles ?? 0) + (road?.triangles ?? 0);
    assert.ok(tổng > 0, `kỷ ${era}: địa hình không sinh ra tam giác nào`);
    assert.ok(
      tổng <= 9000,
      `kỷ ${era}: địa hình tốn ${tổng} tam giác (trần 9.000). Ngân sách cả cảnh là 60.000 và công `
      + 'trình đã ăn ~29.000 sau Phase 8B.',
    );
  }
});
