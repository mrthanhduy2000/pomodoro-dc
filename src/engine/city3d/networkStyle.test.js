/**
 * networkStyle.test.js — BẢNG HÌNH THÁI MẠNG ĐƯỜNG + bộ sinh `roadPlan.js` + lớp hình `roadPath.js`.
 *
 * Bốn nhóm bất biến, xếp theo mức thiệt hại nếu vỡ:
 *   1. **KHÔNG ĐỔI THEO TIẾN ĐỘ** — mạng đường của một kỷ phải là hàm THUẦN của `era`. Vỡ cái này
 *      thì `city3d/terrain.js` san lại cao độ mỗi lần Đàm xây xong một căn nhà, và nhà cũ lún.
 *   2. **ĐỐI XỨNG Ở RANH GIỚI + KHÔNG TRÀN KHỎI Ô** — vỡ thì con đường gãy một bậc ở mọi ranh giới
 *      ô (`TECH_DEBT #31`, Phase 12 đã mất cả một phase để chữa), hoặc mặt đường đè lên thửa đất.
 *   3. **BẢNG CÒN RĂNG** — 15 dòng phải ra 15 MẠNG khác nhau, mỗi `plan` phải có kỷ dùng tới, và
 *      kỷ khai cong phải cong THẬT (đo được), kỷ khai thẳng phải thẳng TUYỆT ĐỐI.
 *   4. **BUỘC VÀO LỊCH SỬ** — `country` khoá cứng vào `eraStyle.js`, y như `streetStyle.js`.
 *
 * ⚠️ **BỘ TRỤC ĐÃ ĐỔI, VÀ FILE NÀY GIỮ ĐỐI CHỨNG CHO ĐIỀU ĐÓ.** Bản trước có `coil` (bước sóng
 * lượn) và `ragged` (biến thiên bề rộng) — cả hai chỉ đổi được MÉP của một đoạn đường bên trong ô
 * của nó, nên nhìn từ trên xuống cả 15 kỷ vẫn là 4 hàng × 4 cột. Đàm bác đúng chỗ: *"không phải
 * kiểu đường lồi lõm, mà là dạng đường cong hay không cong, như thể là có giao lộ, đường uốn quanh
 * ấy"*. Nay hình dạng đến từ `roadPlan.js` (ô NÀO là đường), và bài `BỀ RỘNG ĐỀU TUYỆT ĐỐI` ở cuối
 * file là cái chốt không cho ai lén cắm lại một hệ số "chỗ thắt chỗ phình".
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  NETWORK_STYLES, PLAN_KINDS, RULER_STRAIGHT_ERAS, getNetworkStyle, isValidNetworkStyle,
} from './networkStyle.js';
import { boundaryBend, buildRoadPaths, rankBendScale, roadHalfWidth } from './roadPath.js';
import { ROAD_RANKS, rankOfRoad, getStreetStyle, streetCrossSection } from './streetStyle.js';
import { ERA_STYLES } from './eraStyle.js';
import { buildRoadPlan, eraWonderAnchors } from '../roadPlan.js';
import { CITY_GRID_SIZE } from '../cityGrid.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

/** Mạng đường THẬT của một kỷ — đúng thứ `deriveProps` đem đi dựng hình. */
const mạng = (era) => buildRoadPlan(era, getNetworkStyle(era));
const ô = (era) => mạng(era).cells;
const kho = (era) => new Set(ô(era).map((c) => `${c.x}|${c.y}`));

test('BẢNG ĐỦ 15 KỶ VÀ MỌI DÒNG HỢP LỆ — validator TỪ CHỐI THẲNG, không tự chữa', () => {
  for (const era of ERAS) {
    const s = NETWORK_STYLES[era];
    assert.ok(s, `thiếu kỷ ${era}`);
    assert.ok(isValidNetworkStyle(s), `kỷ ${era} khai sai: ${JSON.stringify(s)}`);
  }
  // ⚠️ ĐỐI CHỨNG: validator phải THẬT SỰ từ chối, nếu không nó chỉ là một hàm luôn trả `true` và
  // cả bảng có thể thoái hoá mà không gì đỏ lên (bẫy `MIN_STONE`, Phase 9D). Hỏi TỪNG trường một,
  // không hỏi gộp — một đối chứng hỏi tổng sẽ vẫn xanh khi đúng một trường bị nới (Phase 10 B2).
  const tốt = NETWORK_STYLES[5];
  const xấu = [
    { ...tốt, plan: 'chưa-có-kiểu-này' },
    { ...tốt, bend: 1.4 },
    { ...tốt, bend: -0.1 },
    { ...tốt, arms: 1 },      // một nhánh thì không thành mạng, chỉ thành một con đường
    { ...tốt, arms: 9 },      // nhiều hơn số hàng lưới ⇒ các nhánh đè lên nhau, một trục CHẾT
    { ...tốt, loops: -1 },
    { ...tốt, loops: 4 },
    { ...tốt, tangle: 1.2 },
    { ...tốt, tangle: -0.01 },
    { ...tốt, country: '' },
    { ...tốt, note: '' },
    { ...tốt, plan: 'grid', bend: 0.9 },  // bảng tự mâu thuẫn: "bàn cờ" mà lại lượn mạnh
    null, undefined, 42,
  ];
  for (const s of xấu) {
    assert.equal(isValidNetworkStyle(s), false, `đáng lẽ phải TỪ CHỐI: ${JSON.stringify(s)}`);
  }
});

test('`country` KHOÁ CỨNG vào bảng kiến trúc — hai bảng không được trôi khỏi nhau', () => {
  // Mỗi dòng phải trả lời được "quy hoạch ở NƯỚC ẤY thời ấy thế nào", và nước ấy là nước mà
  // `eraStyle.js` đã chọn. Sửa một bên mà quên bên kia thì kỷ đó kể hai câu chuyện khác nhau.
  for (const era of ERAS) {
    assert.equal(NETWORK_STYLES[era].country, ERA_STYLES[era].country,
      `kỷ ${era}: bảng mạng đường ghi "${NETWORK_STYLES[era].country}" `
      + `còn bảng kiến trúc ghi "${ERA_STYLES[era].country}"`);
  }
});

test('MỖI KIỂU KHUNG PHẢI CÓ KỶ DÙNG TỚI — một giá trị không ai dùng là một nhánh mã chưa từng chạy', () => {
  const đãDùng = new Set(ERAS.map((era) => NETWORK_STYLES[era].plan));
  for (const kiểu of PLAN_KINDS) {
    assert.ok(đãDùng.has(kiểu),
      `kiểu khung "${kiểu}" không kỷ nào khai — hoặc cho một kỷ dùng nó, hoặc gỡ khỏi PLAN_KINDS`);
  }
  assert.equal(đãDùng.size, PLAN_KINDS.length, 'có kiểu khung khai ra mà không nằm trong PLAN_KINDS');
});

test('SỐ KỶ THẲNG TUYỆT ĐỐI ĐƯỢC ĐẾM — thẳng là một lời khai MẠNH, không phải chỗ trốn việc', () => {
  // ⚠️ Khai `bend: 0` vừa là một tuyên bố lịch sử thật (Chang'an, Manhattan), vừa là cách rẻ nhất
  // để một kỷ né hẳn việc phải có bản sắc đường. Nên nó được đếm: kỷ thứ ba khai 0 thì bài này đỏ,
  // mà một trong hai kỷ đang khai 0 bỏ đi thì cũng đỏ. Một con số trong bài test là cái hẹn giờ
  // duy nhất chạy được (bài học Phase 10 Bước 1).
  const thẳng = ERAS.filter((era) => NETWORK_STYLES[era].bend === 0);
  assert.deepEqual(thẳng, RULER_STRAIGHT_ERAS,
    `kỷ khai thẳng tuyệt đối nay là [${thẳng}], bảng khai [${RULER_STRAIGHT_ERAS}]`);
  for (const era of RULER_STRAIGHT_ERAS) {
    assert.equal(NETWORK_STYLES[era].plan, 'grid',
      `kỷ ${era} khai thẳng tuyệt đối thì trường plan phải là "grid"`);
  }
});

test('MẠNG ĐƯỜNG LÀ HÀM THUẦN CỦA `era` — gọi kèm dữ liệu rác vẫn ra y hệt', () => {
  /**
   * ⚠️ **BẤT BIẾN ĐẮT NHẤT CỦA CẢ FILE, VÀ NÓ KHÔNG HIỂN NHIÊN.** `city3d/terrain.js` san cao độ
   * mặt đất theo mạng đường. Nếu mạng đổi theo `sessionCount` hay `built` thì mỗi lần Đàm xây xong
   * một căn nhà, cả quả đồi nhích một chút và nhà cũ lún hoặc nhô — **không có gì đỏ lên**.
   *
   * Cách khoá là cách đã dùng cho `buildTerrain` ở Phase 7B: gọi KÈM DỮ LIỆU RÁC rồi đòi kết quả
   * y hệt. "Hàm hiện không nhận tham số đó" là một sự thật rất dễ mất — người sau chỉ cần thêm
   * một tham số tuỳ chọn là bất biến chết mà mọi test khác vẫn xanh.
   */
  for (const era of ERAS) {
    const sạch = JSON.stringify(ô(era));
    const rác = JSON.stringify(buildRoadPlan(era, {
      ...getNetworkStyle(era),
      sessionCount: 400, built: ['a', 'b', 'c'], levels: { a: 3 }, pending: [1, 2],
    }).cells);
    assert.equal(rác, sạch, `kỷ ${era}: mạng đường đổi khi bị truyền kèm dữ liệu tiến độ`);
  }
});

test('MẠNG ĐƯỜNG LIÊN THÔNG — không cụm nào bị bỏ rơi, và số lần phải VÁ phải nhỏ', () => {
  /**
   * Một cụm đường bị cô lập là một khu phố cư dân không đi tới được, và triệu chứng (người đứng
   * im ở một góc) trông như lỗi của bộ dẫn đường chứ không như lỗi của mạng — tức sẽ bị đi chữa
   * nhầm chỗ. `vaLienThong` nối chúng lại, nhưng **số lần phải vá được đếm**: vá nhiều nghĩa là
   * bộ sinh đang dựng ra những mảnh rời rồi mới chắp, chứ không dựng ra một mạng.
   */
  let tổngVá = 0;
  for (const era of ERAS) {
    const có = kho(era);
    const đầu = ô(era)[0];
    const thấy = new Set([`${đầu.x}|${đầu.y}`]);
    const hàngĐợi = [[đầu.x, đầu.y]];
    while (hàngĐợi.length > 0) {
      const [x, y] = hàngĐợi.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx}|${y + dy}`;
        if (có.has(k) && !thấy.has(k)) { thấy.add(k); hàngĐợi.push([x + dx, y + dy]); }
      }
    }
    assert.equal(thấy.size, có.size,
      `kỷ ${era}: mạng đường vỡ thành nhiều cụm (${thấy.size}/${có.size} ô nối được tới nhau)`);
    tổngVá += mạng(era).soVa;
  }
  assert.ok(tổngVá <= 3,
    `phải vá liên thông ${tổngVá} lần trên 15 kỷ — bộ sinh đang dựng ra mảnh rời rồi mới chắp`);
});

test('MỌI KỲ QUAN CÓ MẶT TIỀN QUAY RA ĐƯỜNG — mạng mới không được thua mạng bàn cờ cũ', () => {
  /**
   * ⚠️ Mạng bàn cờ cũ có đúng MỘT lý lẽ để tồn tại, ghi ngay trong `cityLayout.js`: bốn trục
   * `x,y ∈ {0,4,8,11}` chạy sát mép mọi khu đất *"nghĩa là mỗi công trình đều có mặt tiền quay ra
   * đường"*. Đo lại thì lời ấy gần đúng — **2/75** kỳ quan của mạng cũ không có ô đường nào kề
   * bên. Mạng mới phải làm TỐT HƠN, không được lấy cớ "cong thì khó".
   */
  let thiếu = 0;
  for (const era of ERAS) {
    const có = kho(era);
    for (const neo of eraWonderAnchors(era)) {
      const kề = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
        .some(([dx, dy]) => có.has(`${neo.x + dx}|${neo.y + dy}`));
      if (!kề) thiếu += 1;
    }
  }
  assert.equal(thiếu, 0, `${thiếu}/75 kỳ quan không có lối vào — mạng cũ chỉ hụt 2/75`);
});

test('ĐỐI XỨNG Ở RANH GIỚI: hai ô kề nhau KHÔNG THỂ khai lệch nhau — đủ 15 kỷ', () => {
  // ⚠️ BẤT BIẾN QUAN TRỌNG NHẤT CỦA `roadPath.js`. Nó không phải "rất khó lệch" mà là "không có
  // cách nào lệch": độ lệch là thuộc tính của RANH GIỚI (một ô nhớ duy nhất, khoá `'u|i|j'`), và
  // biên độ tại ranh giới là `min` của hai ô — một phép ĐỐI XỨNG. Đây đúng phép đã xoá bậc bề
  // rộng ở Phase 12, dùng lại nguyên vẹn cho độ lệch.
  let cặp = 0;
  let xa = 0;
  for (const era of ERAS) {
    const cells = ô(era);
    const có = kho(era);
    const P = buildRoadPaths(era, cells);
    for (const c of cells) {
      if (có.has(`${c.x + 1}|${c.y}`)) {
        xa = Math.max(xa, Math.abs(P.edgeOf(c.x, c.y, 'east') - P.edgeOf(c.x + 1, c.y, 'west')));
        cặp += 1;
      }
      if (có.has(`${c.x}|${c.y + 1}`)) {
        xa = Math.max(xa, Math.abs(P.edgeOf(c.x, c.y, 'south') - P.edgeOf(c.x, c.y + 1, 'north')));
        cặp += 1;
      }
    }
  }
  assert.equal(xa, 0, `có cặp ô kề nhau khai lệch ${xa} ô tại chỗ giáp — con đường sẽ gãy một bậc`);
  // Gác chạy-rỗng: không có nó thì một bộ lọc đặt nhầm chỗ sẽ làm bài này xanh mà chẳng so cặp nào.
  // ⚠️ SÀN ĐO ĐƯỢC, KHÔNG ĐOÁN: 923 cặp ngày 2026-08-24 (sau phép tỉa mảng ở `roadPlan.js`), nên
  // sàn 800 nằm ngay dưới giá trị thật — sát đủ để một lần mạng đường teo lại là đỏ.
  assert.ok(cặp >= 800, `mới so ${cặp} cặp giáp nhau — bài này đang chạy gần như rỗng`);
});

test('LƯỢN KHÔNG ĐƯỢC ĐẨY LÒNG ĐƯỜNG RA KHỎI Ô CỦA NÓ — kể cả ở biên độ lớn nhất', () => {
  // Độ lệch lớn nhất CỘNG nửa bề rộng phải vẫn nằm trong nửa ô. Vỡ cái này thì mặt đường đè lên
  // thửa đất bên cạnh, và triệu chứng (nhà mọc trên mặt đường) trông như lỗi của bộ đặt nhà chứ
  // không như lỗi của mạng đường — tức sẽ bị đi chữa nhầm chỗ.
  for (const era of ERAS) {
    const cells = ô(era);
    const có = kho(era);
    const P = buildRoadPaths(era, cells);
    for (const c of cells) {
      const nửa = roadHalfWidth(era, c.x, c.y, rankOfRoad(c.variant, c.tier));
      const lõi = P.coreOf(c.x, c.y);
      for (const [tên, lệch] of [['u', lõi.du], ['v', lõi.dv]]) {
        assert.ok(Math.abs(lệch) + nửa <= 0.5 + 1e-9,
          `kỷ ${era} ô (${c.x},${c.y}) trục ${tên}: lệch ${lệch.toFixed(4)} + nửa bề rộng `
          + `${nửa.toFixed(4)} = ${(Math.abs(lệch) + nửa).toFixed(4)} > 0,5 — tràn khỏi ô`);
      }
      // ⚠️ CHỈ XÉT RANH GIỚI **CÓ ĐƯỜNG NỐI TIẾP**. Phía không có đường thì `edgeOf` vẫn trả ra một
      // con số (dùng biên độ của chính ô, để `coreOf` lấy trung bình cho mượt), nhưng KHÔNG cánh
      // tay nào được dựng ở đó nên con số ấy không tới được hình học. Đòi nó cũng phải nằm gọn
      // trong ô là đòi một thứ không ai đọc — và một assert như thế sẽ kêu oan.
      for (const [phía, dx, dy] of [['west', -1, 0], ['east', 1, 0], ['north', 0, -1], ['south', 0, 1]]) {
        if (!có.has(`${c.x + dx}|${c.y + dy}`)) continue;
        const b = P.edgeOf(c.x, c.y, phía);
        assert.ok(Math.abs(b) + nửa <= 0.5 + 1e-9,
          `kỷ ${era} ô (${c.x},${c.y}) ranh giới ${phía}: lệch ${b.toFixed(4)} + nửa bề rộng `
          + `${nửa.toFixed(4)} — tràn khỏi ô`);
      }
    }
  }
});

test('15 KỶ RA 15 MẠNG ĐƯỜNG KHÁC NHAU — đo bằng TẬP Ô, không đo bằng mép một đoạn', () => {
  /**
   * ⚠️ **ĐÂY LÀ BÀI ĐÃ ĐỔI ĐẠI LƯỢNG, VÀ VIỆC ĐỔI MỚI LÀ ĐIỀU ĐÁNG GHI.** Bản trước ký tên bằng
   * dãy độ lệch tim đường — tức nó đo MÉP của những con đường nằm trên cùng một bàn cờ, nên nó
   * xanh rực rỡ trong khi cả 15 kỷ dùng chung đúng một mạng. Nay ký tên bằng chính TẬP Ô là đường:
   * hai kỷ trùng tập ô nghĩa là chúng thật sự có cùng một thành phố.
   */
  const chữKý = new Map();
  for (const era of ERAS) {
    chữKý.set(era, ô(era).map((c) => `${c.x},${c.y}`).sort().join('|'));
  }
  const nhóm = new Map();
  for (const [era, ký] of chữKý) {
    if (!nhóm.has(ký)) nhóm.set(ký, []);
    nhóm.get(ký).push(era);
  }
  const trùng = [...nhóm.values()].filter((g) => g.length > 1);
  assert.deepEqual(trùng, [],
    `các nhóm kỷ dùng CHUNG một mạng đường: ${JSON.stringify(trùng)} — bảng đang thoái hoá`);
  assert.equal(nhóm.size, 15);
});

/**
 * ⚠️ **KỶ CÓ MỘT CON ĐƯỜNG KHÔNG THEO LƯỚI — ĐẾM TƯỜNG MINH, ĐỪNG ĐỂ NÓ LÀ MỘT NGOẠI LỆ IM LẶNG.**
 * Kỷ 11 khai `bend: 0` (Commissioners' Plan 1811 kẻ bằng thước) NHƯNG cũng khai `diagonal: true`,
 * vì Broadway là đường mòn của người Lenape có TRƯỚC cái lưới và đã sống sót qua nó. Hai lời khai
 * ấy không mâu thuẫn — chúng nói về hai con đường khác nhau. Nhưng nếu không đếm ra thì mọi bài
 * test về "thẳng tuyệt đối" phải nới ngưỡng cho vừa kỷ 11, tức bỏ răng cho cả 14 kỷ kia.
 */
const CÓ_ĐƯỜNG_CHÉO = ERAS.filter((e) => NETWORK_STYLES[e].diagonal === true);

/** Độ lệch TRUNG BÌNH của tim đường khỏi tâm ô, tính trên mọi ranh giới con đường đi qua. */
const độCong = (era) => {
  const v = [...mạng(era).crossings.values()].map(Math.abs);
  return v.length === 0 ? 0 : v.reduce((a, b) => a + b, 0) / v.length;
};

test('ĐƯỜNG CHÉO ĐƯỢC ĐẾM — Broadway là ngoại lệ có thật, không phải chỗ nới ngưỡng', () => {
  assert.deepEqual(CÓ_ĐƯỜNG_CHÉO, [11],
    `kỷ khai có đường chéo nay là [${CÓ_ĐƯỜNG_CHÉO}] — thêm một kỷ thì phải kể được nó là con `
    + 'đường nào có thật, và phải sửa hai bài test bên dưới cho khớp');
});

test('KỶ KHAI CONG THÌ CONG THẬT, KỶ KHAI THẲNG THÌ THẲNG TUYỆT ĐỐI — đo trên tim đường', () => {
  /**
   * ⚠️ **ĐO ĐỘ LỆCH THẬT, KHÔNG ĐỌC LẠI CON SỐ ĐÃ KHAI.** Đây đúng bẫy `TECH_DEBT #42`: một bài
   * test hỏi `NETWORK_STYLES[era].bend` là đang hỏi thứ bảng KHAI, còn màn hình dựng theo thứ
   * `crossings` GHI RA. Hai đại lượng ấy có thể lệch nhau tuỳ ý mà không gì đỏ lên.
   *
   * ⚠️ VÀ ĐO **TRUNG BÌNH**, KHÔNG ĐO CỰC ĐẠI. Cực đại bão hoà ở 1,0 ngay khi có một ranh giới
   * duy nhất bị cắt sát mép, nên nó ra 1,000 ở 13/15 kỷ — một con số không phân biệt được kỷ
   * ngoằn ngoèo với kỷ chỉ hơi cong. Trung bình thì trải ra thật: 0,372 … 0,590.
   */
  const thẳngTuyệtĐối = RULER_STRAIGHT_ERAS.filter((e) => !CÓ_ĐƯỜNG_CHÉO.includes(e));
  assert.ok(thẳngTuyệtĐối.length > 0, 'không còn kỷ nào thẳng tuyệt đối để làm đối chứng');
  for (const era of thẳngTuyệtĐối) {
    assert.equal(độCong(era), 0,
      `kỷ ${era} khai thẳng tuyệt đối và không có đường chéo, mà tim đường vẫn lệch ${độCong(era)}`);
  }
  // Kỷ có đường chéo: cong RẤT ÍT (chỉ một con đường trong cả mạng), nhưng KHÔNG được bằng 0 —
  // bằng 0 nghĩa là Broadway đã lặng lẽ biến mất.
  for (const era of CÓ_ĐƯỜNG_CHÉO) {
    assert.ok(độCong(era) > 0 && độCong(era) < 0.2,
      `kỷ ${era} có đúng một con đường không theo lưới, nên độ cong trung bình phải nhỏ mà khác 0 `
      + `— đo được ${độCong(era).toFixed(3)}`);
  }
  const cong = ERAS.filter((e) => !RULER_STRAIGHT_ERAS.includes(e));
  for (const era of cong) {
    assert.ok(độCong(era) > 0.3,
      `kỷ ${era} (${NETWORK_STYLES[era].country}) khai bend ${NETWORK_STYLES[era].bend} mà tim `
      + `đường chỉ cong trung bình ${độCong(era).toFixed(3)} — cong trên giấy, thẳng trên màn hình`);
  }
  // Và cả bảng phải TRẢI ra, không dồn về một mức.
  const ds = cong.map(độCong);
  assert.ok(Math.max(...ds) - Math.min(...ds) > 0.1,
    `13 kỷ biết cong chỉ trải ${(Math.max(...ds) - Math.min(...ds)).toFixed(3)} — bảng gần như một dòng`);
});

test('MẠNG ĐƯỜNG KHÔNG PHẢI MỘT BÀN CỜ — kỷ hữu cơ phải có ô đường NGOÀI bốn trục cũ', () => {
  /**
   * ⚠️ **BÀI CHỐT CỦA CẢ PHIÊN, VÀ NÓ NHỐT ĐÚNG THỨ ĐÀM CHỈ VÀO.** Mạng cũ là bốn hàng × bốn cột
   * `x,y ∈ {0, 4, 8, 11}`. Một bản vá chỉ đụng vào MÉP đường sẽ để nguyên tập ô ấy, nên bài này
   * đỏ ngay nếu có ai hoàn tác `roadPlan.js` — kể cả khi mọi bài khác vẫn xanh.
   */
  const trụcCũ = new Set([0, 4, 8, CITY_GRID_SIZE - 1]);
  const ngoàiTrục = (era) => ô(era).filter((c) => !trụcCũ.has(c.x) && !trụcCũ.has(c.y)).length;
  for (const era of ERAS) {
    const s = NETWORK_STYLES[era];
    if (s.plan === 'grid' && s.bend === 0 && !s.diagonal) {
      // Bàn cờ thẳng tuyệt đối thì KHÔNG có ô nào ngoài trục — và đó là đúng, Trường An quy hoạch
      // đúng như thế. Nó cũng là ĐỐI CHỨNG: nếu bài này xanh ở mọi kỷ thì nó không còn răng.
      assert.equal(ngoàiTrục(era), 0,
        `kỷ ${era} khai bàn cờ thẳng tuyệt đối mà vẫn có ${ngoàiTrục(era)} ô lệch khỏi trục`);
      continue;
    }
    if (s.plan === 'grid' && s.bend === 0) {
      // Lưới CỘNG một con đường chéo: chỉ chừng một chục ô lệch khỏi trục, đúng bằng Broadway.
      assert.ok(ngoàiTrục(era) >= 6 && ngoàiTrục(era) <= 20,
        `kỷ ${era} có đúng một con đường không theo lưới, nên phải có 6–20 ô ngoài trục — `
        + `đo được ${ngoàiTrục(era)}`);
      continue;
    }
    assert.ok(ngoàiTrục(era) >= 15,
      `kỷ ${era} (${s.plan}) chỉ có ${ngoàiTrục(era)} ô đường nằm ngoài bốn trục bàn cờ cũ — `
      + 'nhìn từ trên xuống nó vẫn là cái bàn cờ mà Đàm đã bác');
  }
});

test('BIÊN ĐỘ LƯỢN CỦA NGÕ PHẢI SỐNG Ở MỌI KỶ — bài học "đại lộ phủ quyết cả kỷ"', () => {
  // ⚠️ ĐỐI CHỨNG NHỐT MỘT BỘ SỐ HỎNG CÓ THẬT. Bản đầu của `roadPath.js` lấy MỘT biên độ cho cả kỷ
  // bằng `min` chỗ trống trên mọi hạng đường. Ở kỷ hiện đại, lòng đường CỘNG vỉa hè đã lấp gần
  // trọn ô, nên đại lộ có quyền phủ quyết: **7/15 kỷ ra biên độ đúng bằng 0**, trong đó có kỷ 13
  // và kỷ 8 — hai kỷ lượn nhiều nhất bảng. Vá bằng cách cho mỗi HẠNG một biên độ rồi lấy `min`
  // TẠI RANH GIỚI. Bài này canh không cho ai gộp ngược lại.
  for (const era of ERAS) {
    assert.ok(rankBendScale(era, 'lane') > 0.05,
      `kỷ ${era} (${NETWORK_STYLES[era].country}): NGÕ chỉ còn `
      + `${rankBendScale(era, 'lane').toFixed(4)} ô để xê dịch — biên độ đang bị đại lộ nuốt`);
  }
});

test('BỀ RỘNG ĐỀU TUYỆT ĐỐI DỌC MỘT HẠNG ĐƯỜNG — không "chỗ thắt chỗ phình"', () => {
  /**
   * ⚠️ **ĐÂY LÀ CÁI CHỐT CHỐNG "LỒI LÕM", VÀ NÓ NHỐT MỘT CƠ CHẾ ĐÃ TỪNG TỒN TẠI THẬT.** Bản trước
   * có `widthJitter` nhân bề rộng theo băm từng ô (biên độ tới ±35%), nên cùng một con đường chỗ
   * nở chỗ tóp. Đàm bác thẳng bằng đúng chữ *"lồi lõm"*. Nó cũng đã đẻ ra một lỗi hình học thật:
   * ô vừa phình to nhất vừa lượn xa nhất cho ra `0,25 + 0,3105 = 0,5605 > 0,5` ⇒ mặt đường lấn
   * sang thửa bên cạnh.
   *
   * Nay bề rộng CHỈ đến từ bảng `streetStyle.js`, nên hai ô cùng hạng phải ra ĐÚNG cùng một số —
   * không phải "gần bằng". Bơm lại một hệ số nhiễu vào `roadHalfWidth` thì bài này đỏ ngay.
   */
  for (const era of ERAS) {
    const theoHạng = new Map();
    for (const c of ô(era)) {
      const h = rankOfRoad(c.variant, c.tier);
      const w = roadHalfWidth(era, c.x, c.y, h);
      if (!theoHạng.has(h)) theoHạng.set(h, w);
      assert.equal(w, theoHạng.get(h),
        `kỷ ${era} ô (${c.x},${c.y}) hạng "${h}": bề rộng ${w} khác ô cùng hạng ${theoHạng.get(h)}`);
    }
    // Và nó phải khớp ĐÚNG bảng — không có tầng biến đổi nào lén nằm giữa (bẫy `TECH_DEBT #42`).
    for (const [h, w] of theoHạng) {
      const khai = streetCrossSection(getStreetStyle(era), h);
      assert.equal(w, Math.max(0.04, Math.min(khai.half, 0.5 - khai.walk)),
        `kỷ ${era} hạng "${h}": bề rộng dựng ra không khớp bảng khai`);
    }
  }
});

test('`getNetworkStyle` KHÔNG BAO GIỜ NÉM với dữ liệu rác — màn Thành Phố không được sập', () => {
  for (const rác of [undefined, null, 0, -3, 99, 'sáu', {}, NaN]) {
    const s = getNetworkStyle(rác);
    assert.ok(isValidNetworkStyle(s), `dữ liệu rác ${String(rác)} cho ra dòng không hợp lệ`);
  }
});

test('`boundaryBend` LUÔN nằm trong [−1, 1] — nếu không thì mọi phép kẹp phía sau đều sai giả định', () => {
  let ngoài = 0;
  let khác0 = 0;
  for (const era of ERAS) {
    for (let j = -2; j <= 14; j += 1) {
      for (let i = -2; i <= 14; i += 1) {
        for (const trục of ['u', 'v']) {
          const b = boundaryBend(era, trục, i, j);
          if (!(b >= -1 - 1e-9 && b <= 1 + 1e-9)) ngoài += 1;
          if (b !== 0) khác0 += 1;
        }
      }
    }
  }
  assert.equal(ngoài, 0, `${ngoài} giá trị độ lệch chuẩn hoá nằm ngoài [−1, 1]`);
  // Gác chạy-rỗng: một hàm luôn trả 0 cũng "luôn nằm trong [−1, 1]".
  assert.ok(khác0 > 200, `chỉ ${khác0} ranh giới có tim đường lệch — bài này đang chạy gần như rỗng`);
});

/**
 * ⚠️ **KỶ KHÔNG CÓ VÀNH ĐAI — MỘT NGOẠI LỆ TƯỜNG MINH ĐẾM ĐƯỢC, KHÔNG PHẢI MỘT NGƯỠNG NỚI RA.**
 * Vành đai là một thứ CÓ THẬT trong lịch sử (tường thành, hào, đường bao) chứ không phải một hạng
 * đường bịa ra cho đủ ba. Một khu đền đá mới (Göbekli Tepe) và một xóm thợ 68 nóc nhà
 * (Deir el-Medina) thì không có đường bao quanh — ép chúng phải có là mua một con số bằng cách nói
 * dối lịch sử, đúng thứ ADR-025 cấm.
 *
 * Danh sách này tự đỏ theo CẢ HAI chiều: kỷ thứ ba rơi vào thì đỏ, mà một trong hai kỷ này được
 * cho một vành đai thì cũng đỏ.
 */
const KHÔNG_VÀNH_ĐAI = [1, 2];

test('BA HẠNG ĐƯỜNG ĐỀU CÓ MẶT TRONG MẠNG THẬT — hạng thứ ba không được là mã chết', () => {
  // ⚠️ Thêm một hạng vào bảng mà mạng đường không sinh ra ô nào thuộc hạng ấy thì nó là một nhánh
  // mã chưa từng chạy — đúng hình dạng cơ chế "lùm cây" đã chết im lặng ở Phase 8D.
  // ⚠️ VÀ PHẢI HỎI TỪNG KỶ MỘT: hỏi gộp cả 15 kỷ thì một kỷ có đủ ba hạng sẽ che cho 14 kỷ kia.
  const thiếuVànhĐai = [];
  for (const era of ERAS) {
    const đếm = new Map(ROAD_RANKS.map((r) => [r, 0]));
    for (const c of ô(era)) {
      const r = rankOfRoad(c.variant, c.tier);
      đếm.set(r, đếm.get(r) + 1);
    }
    if (đếm.get('ring') === 0) thiếuVànhĐai.push(era);
    for (const r of ROAD_RANKS) {
      if (r === 'ring') continue;
      assert.ok(đếm.get(r) > 0, `kỷ ${era}: hạng "${r}" không có ô đường nào — hạng chết`);
    }
  }
  assert.deepEqual(thiếuVànhĐai, KHÔNG_VÀNH_ĐAI,
    `kỷ không có vành đai nay là [${thiếuVànhĐai}], danh sách khai [${KHÔNG_VÀNH_ĐAI}]`);
  // ⚠️ Và hai kỷ ấy phải khai `loops: 0` — nếu một kỷ khai CÓ vòng mà dựng ra không vòng nào thì
  // đó là một trục bị cái kẹp nuốt trong im lặng (bẫy `MIN_STONE`), không phải một lựa chọn.
  for (const era of KHÔNG_VÀNH_ĐAI) {
    assert.equal(NETWORK_STYLES[era].loops, 0,
      `kỷ ${era} khai loops ${NETWORK_STYLES[era].loops} mà không dựng ra ô vành đai nào`);
  }
});
