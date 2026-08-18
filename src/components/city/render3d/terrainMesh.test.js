import test from 'node:test';
import assert from 'node:assert/strict';

import { ROAD_LIFT, ROAD_PART, buildRoadSurface, buildTerrainSurface } from './terrainMesh.js';
import { APRON_DROP, buildTerrain } from '../../../engine/city3d/terrain.js';
import { buildScenePalette } from '../../../engine/city3d/palette3d.js';
import {
  carriagewayShape, getStreetStyle, streetCrossSection,
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
