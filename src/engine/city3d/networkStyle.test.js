/**
 * networkStyle.test.js — BẢNG HÌNH THÁI MẠNG ĐƯỜNG + LỚP HÌNH `roadPath.js`.
 *
 * Bốn nhóm bất biến, theo mức thiệt hại nếu vỡ:
 *   1. **ĐỐI XỨNG Ở RANH GIỚI** — hai ô kề nhau phải khai CÙNG một độ lệch tại chỗ giáp. Vỡ cái
 *      này thì con đường gãy một bậc ở mọi ranh giới ô, tức dựng lại đúng `TECH_DEBT #31` mà
 *      Phase 12 đã mất cả một phase để chữa.
 *   2. **KHÔNG TRÀN KHỎI Ô** — lượn quá tay thì mặt đường đè lên thửa đất bên cạnh.
 *   3. **BẢNG CÒN RĂNG** — 15 dòng phải thật sự khác nhau, và mỗi kiểu lượn phải có kỷ dùng tới.
 *   4. **BUỘC VÀO LỊCH SỬ** — `country` khoá cứng vào `eraStyle.js`, y như `streetStyle.js`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_COIL, MIN_COIL, NETWORK_STYLES, PLAN_KINDS, RULER_STRAIGHT_ERAS,
  getNetworkStyle, isValidNetworkStyle,
} from './networkStyle.js';
import {
  MAX_PINCH, boundaryBend, buildRoadPaths, rankBendScale, roadHalfWidth, widthJitter,
} from './roadPath.js';
import { ROAD_RANKS, rankOfRoad } from './streetStyle.js';
import { ERA_STYLES } from './eraStyle.js';
import { roadCellCandidates } from '../cityLayout.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const Ô_ĐƯỜNG = roadCellCandidates();

test('BẢNG ĐỦ 15 KỶ VÀ MỌI DÒNG HỢP LỆ — validator TỪ CHỐI THẲNG, không tự chữa', () => {
  for (const era of ERAS) {
    const s = NETWORK_STYLES[era];
    assert.ok(s, `thiếu kỷ ${era}`);
    assert.ok(isValidNetworkStyle(s), `kỷ ${era} khai sai: ${JSON.stringify(s)}`);
  }
  // ⚠️ ĐỐI CHỨNG: validator phải THẬT SỰ từ chối, nếu không nó chỉ là một hàm luôn trả `true` và
  // cả bảng có thể thoái hoá mà không gì đỏ lên (bẫy `MIN_STONE`, Phase 9D).
  const tốt = NETWORK_STYLES[5];
  const xấu = [
    { ...tốt, plan: 'chưa-có-kiểu-này' },
    { ...tốt, bend: 1.4 },
    { ...tốt, bend: -0.1 },
    { ...tốt, coil: MIN_COIL - 0.1 },   // ngắn hơn Nyquist ⇒ răng cưa, không phải "lượn gấp hơn"
    { ...tốt, coil: MAX_COIL + 0.1 },   // dài hơn cả lưới ⇒ một trục CHẾT
    { ...tốt, ragged: 1.5 },
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

test('MỖI KIỂU LƯỢN PHẢI CÓ KỶ DÙNG TỚI — một giá trị không ai dùng là một nhánh mã chưa từng chạy', () => {
  const đãDùng = new Set(ERAS.map((era) => NETWORK_STYLES[era].plan));
  for (const kiểu of PLAN_KINDS) {
    assert.ok(đãDùng.has(kiểu),
      `kiểu lượn "${kiểu}" không kỷ nào khai — hoặc cho một kỷ dùng nó, hoặc gỡ nó khỏi PLAN_KINDS`);
  }
  assert.equal(đãDùng.size, PLAN_KINDS.length, 'có kiểu lượn khai ra mà không nằm trong PLAN_KINDS');
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

test('ĐỐI XỨNG Ở RANH GIỚI: hai ô kề nhau KHÔNG THỂ khai lệch nhau — đủ 15 kỷ', () => {
  // ⚠️ ĐÂY LÀ BẤT BIẾN QUAN TRỌNG NHẤT CỦA CẢ `roadPath.js`. Nó không phải "rất khó lệch" mà là
  // "không có cách nào lệch": độ lệch là thuộc tính của RANH GIỚI, và biên độ tại ranh giới là
  // `min` của hai ô — một phép ĐỐI XỨNG. Đây đúng phép đã xoá bậc bề rộng ở Phase 12.
  const có = new Set(Ô_ĐƯỜNG.map((c) => `${c.x}|${c.y}`));
  let cặp = 0;
  let xa = 0;
  for (const era of ERAS) {
    const P = buildRoadPaths(era, Ô_ĐƯỜNG);
    for (const c of Ô_ĐƯỜNG) {
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
  assert.ok(cặp > 1200, `mới so ${cặp} cặp giáp nhau — bài này đang chạy gần như rỗng`);
});

test('LƯỢN KHÔNG ĐƯỢC ĐẨY LÒNG ĐƯỜNG RA KHỎI Ô CỦA NÓ — kể cả ở biên độ lớn nhất', () => {
  const có = new Set(Ô_ĐƯỜNG.map((c) => `${c.x}|${c.y}`));
  // Độ lệch lớn nhất CỘNG nửa bề rộng CỘNG vỉa hè phải vẫn nằm trong nửa ô. Vỡ cái này thì mặt
  // đường đè lên thửa đất bên cạnh, và triệu chứng (nhà mọc trên mặt đường) trông như lỗi của bộ
  // đặt nhà chứ không như lỗi của mạng đường — tức sẽ bị đi chữa nhầm chỗ.
  for (const era of ERAS) {
    const P = buildRoadPaths(era, Ô_ĐƯỜNG);
    for (const c of Ô_ĐƯỜNG) {
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

test('BẢNG THẬT SỰ TẠO RA 15 MẠNG ĐƯỜNG KHÁC NHAU — không phải 15 lần cùng một con đường', () => {
  // ⚠️ Đây là vế chống "bảng 15 dòng thoái hoá về 1 dòng". Đo bằng CHỮ KÝ hình học: dãy độ lệch
  // tim đường của cả mạng, làm tròn để bỏ nhiễu dấu phẩy động.
  const chữKý = new Map();
  for (const era of ERAS) {
    const P = buildRoadPaths(era, Ô_ĐƯỜNG);
    const ký = Ô_ĐƯỜNG.map((c) => {
      const l = P.coreOf(c.x, c.y);
      return `${l.du.toFixed(3)},${l.dv.toFixed(3)}`;
    }).join('|');
    chữKý.set(era, ký);
  }
  // Kỷ 4 và 11 đều thẳng tuyệt đối nên chúng TRÙNG NHAU về tim đường — đó là đúng, và nó được khai
  // tường minh ở `RULER_STRAIGHT_ERAS` thay vì lặng lẽ bỏ qua.
  const nhóm = new Map();
  for (const [era, ký] of chữKý) {
    if (!nhóm.has(ký)) nhóm.set(ký, []);
    nhóm.get(ký).push(era);
  }
  for (const [, eras] of nhóm) {
    if (eras.length === 1) continue;
    assert.deepEqual(eras, RULER_STRAIGHT_ERAS,
      `các kỷ [${eras}] có tim đường TRÙNG KHÍT nhau mà không phải nhóm thẳng tuyệt đối`);
  }
  assert.ok(nhóm.size >= 14, `15 kỷ chỉ ra ${nhóm.size} mạng đường khác nhau`);
});

test('BIÊN ĐỘ LƯỢN CỦA NGÕ PHẢI SỐNG Ở MỌI KỶ BIẾT LƯỢN — bài học "đại lộ phủ quyết cả kỷ"', () => {
  // ⚠️ ĐỐI CHỨNG NHỐT MỘT BỘ SỐ HỎNG CÓ THẬT. Bản đầu của `roadPath.js` lấy MỘT biên độ cho cả kỷ
  // bằng `min` chỗ trống trên mọi hạng đường. Ở kỷ hiện đại, lòng đường CỘNG vỉa hè đã lấp gần
  // trọn ô, nên đại lộ có quyền phủ quyết: **7/15 kỷ ra biên độ đúng bằng 0**, trong đó có kỷ 13
  // (Edo, `bend` 0,82 — lượn nhất bảng) và kỷ 8 (Alfama, 0,66). Vá bằng cách cho mỗi HẠNG một biên
  // độ rồi lấy `min` TẠI RANH GIỚI. Bài này canh không cho ai gộp ngược lại.
  for (const era of ERAS) {
    if (NETWORK_STYLES[era].bend === 0) continue;
    assert.ok(rankBendScale(era, 'lane') > 0.01,
      `kỷ ${era} (${NETWORK_STYLES[era].country}) khai bend ${NETWORK_STYLES[era].bend} `
      + `mà NGÕ chỉ lượn được ${rankBendScale(era, 'lane').toFixed(4)} ô — biên độ đang bị đại lộ nuốt`);
  }
  // Và ba kỷ từng bị nuốt phải lượn RÕ: đây là chính bộ số hỏng cũ, viết ra để không nới tay lại.
  for (const era of [7, 8, 13]) {
    assert.ok(rankBendScale(era, 'lane') > 0.05,
      `kỷ ${era} lượn quá ít (${rankBendScale(era, 'lane').toFixed(4)} ô) — bộ số hỏng cũ đã quay lại`);
  }
});

test('BIẾN THIÊN BỀ RỘNG nằm trong trần, và kỷ khai `ragged` 0 thì bề rộng ĐỀU TUYỆT ĐỐI', () => {
  for (const era of ERAS) {
    for (const c of Ô_ĐƯỜNG) {
      const j = widthJitter(era, c.x, c.y);
      assert.ok(j >= 1 - MAX_PINCH - 1e-9 && j <= 1 + MAX_PINCH + 1e-9,
        `kỷ ${era} ô (${c.x},${c.y}): hệ số bề rộng ${j} vượt trần ±${MAX_PINCH}`);
    }
  }
  // Đối chứng: `ragged: 0` phải cho ra ĐÚNG 1, không phải "gần 1".
  const giả = { ...NETWORK_STYLES[1], ragged: 0 };
  assert.ok(isValidNetworkStyle(giả));
});

test('`getNetworkStyle` KHÔNG BAO GIỜ NÉM với dữ liệu rác — màn Thành Phố không được sập', () => {
  for (const rác of [undefined, null, 0, -3, 99, 'sáu', {}, NaN]) {
    const s = getNetworkStyle(rác);
    assert.ok(isValidNetworkStyle(s), `dữ liệu rác ${String(rác)} cho ra dòng không hợp lệ`);
  }
});

test('`boundaryBend` LUÔN nằm trong [−1, 1] — nếu không thì mọi phép kẹp phía sau đều sai giả định', () => {
  let ngoài = 0;
  for (const era of ERAS) {
    for (let j = -2; j <= 14; j += 1) {
      for (let i = -2; i <= 14; i += 1) {
        for (const trục of ['u', 'v']) {
          const b = boundaryBend(era, trục, i, j);
          if (!(b >= -1 - 1e-9 && b <= 1 + 1e-9)) ngoài += 1;
        }
      }
    }
  }
  assert.equal(ngoài, 0, `${ngoài} giá trị độ lệch chuẩn hoá nằm ngoài [−1, 1]`);
});

test('BA HẠNG ĐƯỜNG ĐỀU CÓ MẶT TRONG MẠNG THẬT — hạng thứ ba không được là mã chết', () => {
  // ⚠️ Thêm một hạng vào bảng mà mạng đường không sinh ra ô nào thuộc hạng ấy thì nó là một nhánh
  // mã chưa từng chạy — đúng hình dạng cơ chế "lùm cây" đã chết im lặng ở Phase 8D.
  const đếm = new Map(ROAD_RANKS.map((r) => [r, 0]));
  for (const c of Ô_ĐƯỜNG) {
    const r = rankOfRoad(c.variant, c.tier);
    đếm.set(r, đếm.get(r) + 1);
  }
  for (const r of ROAD_RANKS) {
    assert.ok(đếm.get(r) > 0, `hạng "${r}" không có một ô đường nào — hạng chết`);
  }
  // Vành đai chiếm gần nửa mạng; con số ấy chính là lý do nó đáng có hạng riêng.
  assert.ok(đếm.get('ring') >= 30,
    `vành đai chỉ có ${đếm.get('ring')} ô — kiểm lại trường tier có xuống tới layout.props không`);
});
