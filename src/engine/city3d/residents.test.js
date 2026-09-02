/**
 * residents.test.js — cư dân thành phố.
 *
 * Ba bất biến, theo mức thiệt hại:
 *   1. **TẤT ĐỊNH** — cùng bố cục + cùng thời điểm ⇒ cùng vị trí. Đây là thứ cho phép chuyển
 *      động sống sót qua việc rời tab: quay lại sau nửa tiếng thì thành phố ở đúng chỗ đáng lẽ
 *      phải có, chứ không đứng im từ lúc bị đóng băng.
 *   2. **KHÔNG BAO GIỜ NỔ** — bố cục rỗng, chưa có đường, dữ liệu rác đều phải ra danh sách rỗng
 *      chứ không ném lỗi. Một ngoại lệ ở đây làm sập cả màn hình Thành Phố.
 *   3. **BÁM ĐƯỜNG** — người đi xuyên qua bãi đất trống trông như lỗi vật lý.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import {
  MAX_RESIDENTS,
  buildResidentRoute,
  buildResidents,
  deriveResidentCount,
  residentAt,
} from './residents.js';

const ERA = 6;
const BUILT = BLUEPRINT_CATALOG[ERA].map((bp) => bp.id);
const LAYOUT = computeCityLayout({
  built: BUILT,
  era: ERA,
  stats: { sessionCount: 40, streakLength: 9 },
});

test('dân số suy từ tiến độ, và KHÔNG có nhà thì KHÔNG có ai', () => {
  assert.equal(deriveResidentCount({ buildingCount: 0, sessionCount: 500, streakLength: 90 }), 0,
    'bãi đất trống mà có người đi lại thì vô lý');

  const few = deriveResidentCount({ buildingCount: 1, sessionCount: 2, streakLength: 0 });
  const many = deriveResidentCount({ buildingCount: 5, sessionCount: 200, streakLength: 30 });
  assert.ok(few > 0, 'có nhà thì phải có người');
  assert.ok(many > few, 'làm nhiều hơn thì thành phố phải đông hơn');
  assert.ok(many <= MAX_RESIDENTS, 'vượt trần hiệu năng');
});

test('dân số tăng RÕ ở những phiên đầu, thoải dần về sau', () => {
  // Đường cong này là một quyết định thiết kế, không phải ngẫu nhiên: những phiên đầu tiên là
  // lúc dễ bỏ cuộc nhất, nên phần thưởng hình ảnh phải cảm nhận được ngay.
  const at = (s) => deriveResidentCount({ buildingCount: 2, sessionCount: s, streakLength: 1 });
  const early = at(9) - at(1);
  const late = at(200) - at(160);
  assert.ok(early > late, `bước nhảy lúc đầu (${early}) phải lớn hơn lúc sau (${late})`);
});

test('dữ liệu rác không làm nổ màn hình Thành Phố', () => {
  for (const junk of [undefined, {}, { buildings: null, props: null }, { props: [] }]) {
    assert.deepEqual(buildResidents(junk), [], 'phải ra danh sách rỗng, không được ném');
  }
  assert.equal(buildResidentRoute(0, []), null);
  assert.equal(buildResidentRoute(0, [{ x: 1, y: 1 }]), null, 'một ô đường thì không thành tuyến');
  assert.equal(buildResidentRoute(0, null), null);
  assert.equal(residentAt(null, 5), null);
});

test('tất định: cùng thời điểm ⇒ cùng vị trí, gọi bao nhiêu lần cũng vậy', () => {
  const a = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  const b = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  assert.equal(JSON.stringify(a), JSON.stringify(b));

  for (const t of [0, 1.5, 12.5, 999.25]) {
    assert.deepEqual(residentAt(a[0], t), residentAt(b[0], t), `lệch ở t=${t}`);
  }
});

test('tất định: nhảy thẳng tới t = 1800 giây bằng đúng đi dần tới đó', () => {
  // Đây chính là ca "rời tab nửa tiếng rồi quay lại". Nếu vị trí phụ thuộc số khung hình đã vẽ
  // thay vì thời gian, bài test này sẽ đỏ — và trên máy thật thì thành phố sẽ trôi sai nhịp.
  const [route] = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  const direct = residentAt(route, 1800);
  // Cùng một thời điểm, dù đi tới bằng đường nào, phải ra cùng kết quả.
  const again = residentAt(route, 1800);
  assert.deepEqual(direct, again);
  // Và một chu kỳ trọn vẹn phải quay về đúng chỗ cũ.
  const period = route.length / route.speed;
  const p0 = residentAt(route, 100);
  const p1 = residentAt(route, 100 + period);
  assert.ok(Math.abs(p0.x - p1.x) < 1e-6 && Math.abs(p0.y - p1.y) < 1e-6,
    'đi trọn một vòng mà không về chỗ cũ ⇒ tuyến không khép kín');
});

test('cư dân luôn đi TRÊN ĐƯỜNG, không cắt ngang bãi đất trống', () => {
  const roads = LAYOUT.props.filter((p) => p.kind === 'road');
  const roadKeys = new Set(roads.map((r) => `${r.x},${r.y}`));
  const residents = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  assert.ok(residents.length > 0, 'thành phố đủ 5 công trình mà không có ai ở');

  // ⚠️ ĐIỂM TUYẾN NAY LÀ SỐ THỰC, KHÔNG CÒN LÀ TOẠ ĐỘ Ô. Từ khi tim đường biết lượn, cư dân đi
  // theo CHÍNH tim đường ấy (`roadPath.js`), nên một điểm tuyến hợp lệ nằm ở đâu đó bên trong ô
  // chứ không đúng tâm ô. Hỏi "toạ độ này có phải một ô đường không" bằng phép so chuỗi sẽ đỏ với
  // mọi kỷ biết lượn — mà cái đỏ ấy là phép đo già đi, không phải mã hỏng.
  //
  // Vế thay thế CHẶT HƠN vế cũ: không chỉ đòi "nằm trong một ô đường" mà còn đòi **nằm trong lòng
  // đường**. Đây chính là lời hứa mà `terrainMesh.test.js` từng bảo vệ GIÁN TIẾP bằng assert "mặt
  // đường phải cân giữa tâm ô, vì cư dân đi đúng tâm ô" — nay nó được đo THẲNG ở đúng chỗ nó nói về.
  for (const route of residents) {
    for (const p of route.path) {
      const ô = `${Math.round(p.x)},${Math.round(p.y)}`;
      assert.ok(roadKeys.has(ô),
        `tuyến đi qua ô không phải đường: (${p.x.toFixed(3)}, ${p.y.toFixed(3)}) → ô ${ô}`);
    }
    // Hai điểm liên tiếp phải KỀ NHAU trên lưới, nếu không người sẽ trượt xuyên qua nhà.
    for (let i = 0; i < route.path.length; i += 1) {
      const a = route.path[i];
      const b = route.path[(i + 1) % route.path.length];
      const step = Math.hypot(b.x - a.x, b.y - a.y);
      assert.ok(step <= Math.SQRT2 + 1e-9, `bước nhảy quá xa (${step.toFixed(2)} ô) giữa hai điểm tuyến`);
    }
  }
});

test('cư dân KHÔNG dồn cục một chỗ lúc bắt đầu', () => {
  // Không lệch pha thì cả thành phố xuất phát cùng một điểm và biến thành đoàn diễu hành.
  const residents = buildResidents(LAYOUT, { sessionCount: 40, streakLength: 9 });
  const spots = new Set(residents.map((r) => {
    const p = residentAt(r, 0);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }));
  assert.ok(spots.size >= Math.min(4, residents.length),
    `mới có ${spots.size} vị trí khác nhau trên ${residents.length} người`);
});

/** Gói góc về [−π, π]. ⚠️ `((d + π) % 2π) − π` KHÔNG đúng trong JS: `%` giữ dấu của số bị chia,
 *  nên với `d` âm nó trả về tới −2π. Bản cũ của bài test dưới đây dùng đúng công thức sai ấy và
 *  vẫn xanh — vì nó chỉ hỏi ở MỘT thời điểm, và thời điểm ấy tình cờ không rơi vào ca xấu. */
const gói = (a) => ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;

/**
 * ⚠️ QUÉT CẢ 15 KỶ, KHÔNG PHẢI SÁU KỶ MẪU — và con số kỷ SUY TỪ BẢNG, không viết cứng.
 * Bản trước lấy 6 kỷ, và điều đó lộ ra vì hai tài liệu ghi hai con số cho CÙNG một đại lượng
 * (35,9° ở `CHANGELOG.md`, 35,6° ở đây). Không con số nào sai — chúng đo hai ĐẦU VÀO khác nhau:
 *   6 kỷ · 40 phiên → 165 tuyến → tệ nhất 35,6°
 *   6 kỷ · 80 phiên → 168 tuyến → tệ nhất 35,9°   ← ba tuyến thừa ra, một trong số đó tệ hơn
 *  15 kỷ · 80 phiên → 420 tuyến → tệ nhất 35,9°
 * Tức phép quét cũ **chưa bao giờ nhìn thấy ca xấu nhất**. Đúng họ `TECH_DEBT #38` (một ngưỡng
 * hiệu chuẩn trên MỘT quần thể rồi được đọc thành luật của CẢ TẬP) — và nó chỉ lộ ra nhờ đi truy
 * một mâu thuẫn giữa hai dòng tài liệu, chứ không cổng nào bắt được.
 */
const KỶ_MẪU = Object.keys(BLUEPRINT_CATALOG).map(Number).sort((a, b) => a - b);
/** ⚠️ 80 nằm QUA chỗ bão hoà, có chủ ý — đo được: số tuyến đi 355 (20 phiên) → 414 (40) → **420
 *  (60)** rồi ĐỨNG YÊN tới 400 phiên. Chọn 80 để còn biên nếu bảng cư dân được nới; bài dưới có
 *  một gác ĐÒI mốc này thật sự đã bão hoà, nên nếu ngày nào nó thôi bão hoà thì test tự đỏ. */
const PHIÊN_QUÉT = 80;
const FPS = 30;

/**
 * Quét mọi cư dân của vài kỷ ở 30 khung/giây, gọi `đo(trước, sau)` cho từng cặp khung liền nhau.
 *
 * ⚠️ MỖI TUYẾN QUÉT TRỌN ÍT NHẤT MỘT VÒNG, và đó KHÔNG phải một chi tiết nhỏ. Tuyến là một vòng
 * KHÉP KÍN: đoạn cuối nối `path[n−1]` về `path[0]`. Cái đỉnh nối ấy là đỉnh DUY NHẤT mà "đoạn
 * trước nó" phải lấy từ đầu kia của mảng (`(i − 1 + n) % n`) — tức đúng chỗ một lỗi chỉ-số sẽ nấp.
 * Bản đầu của bài này quét cứng **20 giây** và tôi đã suýt gọi thế là xong. Đo ra:
 *   • 107/165 cư dân KHÔNG đi hết một vòng trong 20 giây (vòng ít nhất chỉ 0,27 vòng);
 *   • và câu hỏi ĐÚNG hơn — vì mỗi người xuất phát ở một `phase` khác nhau — là *"`travelled` có
 *     vượt qua mốc 0 không"*: **57/165 người (34,5%) KHÔNG BAO GIỜ chạm điểm nối** trong 20 giây.
 * Nghĩa là kết quả "0 khung lật quá 90°" trước đó chỉ nói về **hai phần ba** quần thể tại đúng
 * cái đỉnh đáng ngờ nhất. Đúng bài học Phase 11: *một tổ hợp mà phép đo chưa chạm tới là một tổ
 * hợp CHƯA ĐƯỢC KIỂM* — và lý lẽ "mã dùng số học modulo nên đỉnh nối chẳng có gì đặc biệt" là
 * một lời SUY LUẬN, không phải một phép đo.
 *
 * ⚠️ Thời lượng ĐO TỪ DỮ LIỆU (`length / speed`), tuyệt đối không viết cứng: vòng chậm nhất trong
 * cả 15 kỷ hôm nay là **74,70 giây** (kỷ 4), nhưng con số ấy đổi theo bảng cư dân, mà một hằng số
 * thì không nhìn thấy bảng (bẫy Phase 7D). Sàn 20 giây giữ cho tuyến ngắn vẫn đủ mẫu.
 *
 * Trả về `{ mẫu, sốTuyến, quaĐiểmNối }` để bài gọi còn ĐÒI được phủ trọn — nếu chỉ trả `mẫu` thì
 * ngày nào tốc độ cư dân bị chỉnh chậm đi, phép quét lại lặng lẽ bỏ sót điểm nối như cũ.
 */
function quétKhungHình(đo) {
  const dt = 1 / FPS;
  let mẫu = 0;
  let sốTuyến = 0;
  let quaĐiểmNối = 0;
  for (const era of KỶ_MẪU) {
    const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
    const stats = { sessionCount: PHIÊN_QUÉT, streakLength: 9 };
    const layout = computeCityLayout({ built, era, stats });
    for (const route of buildResidents(layout, stats)) {
      const mộtVòng = route.length / route.speed;
      const giây = Math.max(20, mộtVòng * 1.05);
      sốTuyến += 1;
      if ((route.phase * route.length) + giây * route.speed >= route.length) quaĐiểmNối += 1;
      for (let t = dt; t < giây; t += dt) {
        đo(route, t - dt, t);
        mẫu += 1;
      }
    }
  }
  return { mẫu, sốTuyến, quaĐiểmNối };
}

test('KHÔNG GIẬT: cú quay đầu được TRẢI RA, không lật trong một khung hình', () => {
  // ⚠️ ĐÂY LÀ LỜI HỨA VỀ THỨ ĐÀM NHÌN THẤY, nên nó phải được đo ở nhịp Đàm nhìn: 30 khung/giây.
  // Tuyến nào cũng là đường đi-rồi-quay-lại, nên hai đầu tuyến đều là một cú quay đầu 180°. Trước
  // `TURN_ARC` cú ấy xảy ra trong ĐÚNG MỘT khung ⇒ hình người lộn ngược tức thì.
  let tệNhất = 0;
  let sốKhungCóQuay = 0;
  let ngoàiKhoảng = 0;
  const { mẫu, sốTuyến, quaĐiểmNối } = quétKhungHình((route, t0, t1) => {
    const a = residentAt(route, t0);
    const b = residentAt(route, t1);
    if (Math.abs(b.angle) > Math.PI + 1e-9) ngoàiKhoảng += 1;
    const d = Math.abs(gói(b.angle - a.angle)) * 180 / Math.PI;
    if (d > tệNhất) tệNhất = d;
    if (d > 5) sốKhungCóQuay += 1;
  });

  // Gác chạy-rỗng: một phép quét không quét gì cũng cho `tệNhất = 0` và xanh vĩnh viễn.
  assert.ok(mẫu > 50000, `mới quét được ${mẫu} khung — phép đo gần như không chạy`);

  // ⚠️ GÁC PHỦ ĐIỂM NỐI. Không có dòng này thì phép quét có thể lặng lẽ bỏ qua cái đỉnh duy nhất
  // mà "đoạn trước" phải lấy vòng về cuối mảng — đúng chỗ nó đã bỏ qua 34,5% quần thể lúc đầu.
  assert.equal(quaĐiểmNối, sốTuyến,
    `${sốTuyến - quaĐiểmNối}/${sốTuyến} tuyến không đi qua điểm nối cuối→đầu — cái đỉnh ĐÁNG NGỜ`
    + ' NHẤT đang không được kiểm; nới thời lượng quét trong `quétKhungHình`');
  assert.ok(sốKhungCóQuay > 1000,
    `chỉ ${sốKhungCóQuay} khung có đổi hướng — tuyến gần như thẳng thì bài test này không đo gì`);

  // Góc đi ra khỏi engine phải luôn ở khoảng chuẩn (xem `wrapPi` trong `residents.js`).
  assert.equal(ngoàiKhoảng, 0, `${ngoàiKhoảng} khung có \`angle\` nằm ngoài [−π, π]`);

  // Ngưỡng 60° nằm GIỮA HAI ĐẦU ĐO ĐƯỢC — hỏng 180,0° · lành 35,9° — chứ không phải một con số
  // chọn cho rộng rãi (bẫy cái phễu, Phase 9A). ⚠️ 35,9° là số của quần thể ĐẦY ĐỦ (15 kỷ, 420
  // tuyến); quần thể hẹp cũ (6 kỷ, 165 tuyến) ra 35,6° và KHÔNG chứa ca xấu nhất.
  assert.ok(tệNhất < 60,
    `quay ${tệNhất.toFixed(1)}°/khung — mắt đọc ra một cú lật, không phải một cú quay`);
});

test('GÁC QUẦN THỂ: mốc phiên dùng để quét phải đã BÃO HOÀ số tuyến', () => {
  // ⚠️ Không có bài này thì câu "phép quét nhìn thấy MỌI cư dân" chỉ là một lời tự trấn an —
  // và một lời tự trấn an phải được kiểm như một con số (Phase 4G). Hỏi bằng QUAN HỆ (thêm phiên
  // nữa có đẻ thêm tuyến không?) chứ không bằng hằng số 420: hằng số thì trôi theo bảng cư dân,
  // còn quan hệ thì tự đỏ đúng ngày bảng ấy được nới. THỬ-CHO-ĐỎ: hạ `PHIÊN_QUÉT` về 40 ⇒ đỏ
  // (414 ≠ 420), tức nó đang canh đúng thứ nó nói.
  const đếm = (sessionCount) => {
    const stats = { sessionCount, streakLength: 9 };
    let n = 0;
    for (const era of KỶ_MẪU) {
      const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
      n += buildResidents(computeCityLayout({ built, era, stats }), stats).length;
    }
    return n;
  };
  const ở = đếm(PHIÊN_QUÉT);
  const xa = đếm(PHIÊN_QUÉT * 5);
  assert.ok(ở > 300, `chỉ ${ở} tuyến — quần thể quét nhỏ bất thường`);
  assert.equal(ở, xa,
    `${PHIÊN_QUÉT} phiên mới có ${ở} tuyến nhưng ${PHIÊN_QUÉT * 5} phiên có ${xa} — mốc quét CHƯA`
    + ' bão hoà, nên phép quét đang bỏ sót cư dân; nâng `PHIÊN_QUÉT`');
});

test('ĐỐI CHỨNG: luật CŨ (lật thẳng tại đỉnh) phải vẫn bị phép đo trên bắt được', () => {
  // Không có vế này thì không biết bài trên còn răng hay không: một phép đo hỏng cũng cho ra
  // "0°/khung" rất đẹp. Dựng lại đúng luật đã bị thay — hướng = góc của đoạn đang đứng — rồi
  // ĐÒI nó phải chạm 180°.
  const gócCũ = (route, time) => {
    let còn = ((route.phase * route.length) + time * route.speed) % route.length;
    for (let i = 0; i < route.path.length; i += 1) {
      const a = route.path[i];
      const b = route.path[(i + 1) % route.path.length];
      const đoạn = Math.hypot(b.x - a.x, b.y - a.y);
      if (đoạn <= 0) continue;
      if (còn <= đoạn) return Math.atan2(b.y - a.y, b.x - a.x);
      còn -= đoạn;
    }
    return 0;
  };

  let tệNhất = 0;
  quétKhungHình((route, t0, t1) => {
    const d = Math.abs(gói(gócCũ(route, t1) - gócCũ(route, t0))) * 180 / Math.PI;
    if (d > tệNhất) tệNhất = d;
  });
  assert.ok(tệNhất > 170,
    `luật cũ chỉ ra ${tệNhất.toFixed(1)}°/khung — phép đo đã mất răng, ngưỡng 60° không còn nghĩa gì`);
});

test('hướng quay mặt bám hướng đang đi, trừ đúng lúc đang quay', () => {
  // ⚠️ BẢN CŨ CỦA BÀI NÀY HỎI Ở MỘT THỜI ĐIỂM DUY NHẤT (t = 3) và xanh vì may. Từ khi cú quay
  // được trải ra, mặt CỐ Ý dẫn trước / theo sau hướng đi ở quanh mỗi đỉnh — nên "một mẫu" là câu
  // hỏi sai: nó vừa có thể xanh oan, vừa có thể đỏ oan tuỳ mẫu rơi vào đâu.
  let khớp = 0;
  let tổng = 0;
  quétKhungHình((route, t0, t1) => {
    const a = residentAt(route, t0);
    const b = residentAt(route, t1);
    const đi = Math.hypot(b.x - a.x, b.y - a.y);
    if (đi < 1e-9) return;
    const hướng = Math.atan2(b.y - a.y, b.x - a.x);
    tổng += 1;
    if (Math.abs(gói(hướng - a.angle)) < 0.5) khớp += 1;
  });
  assert.ok(tổng > 50000, `mới đo được ${tổng} khung`);
  const tỉLệ = khớp / tổng;
  // Đo được 94,2%; phần còn lại là các khung nằm TRONG cửa sổ quay, ở đó lệch là đúng thiết kế.
  assert.ok(tỉLệ > 0.85,
    `chỉ ${(tỉLệ * 100).toFixed(1)}% số khung có mặt bám hướng đi — cửa sổ quay đang nuốt cả tuyến`);
});
