/**
 * humanPose.test.js — dáng đi.
 *
 * Bốn lời hứa, và bài quan trọng nhất là bài ĐỐI CHỨNG ở cuối.
 *   1. **TẤT ĐỊNH** — cùng quãng đường ⇒ cùng tư thế, mãi mãi. Đây là thứ cho phép rời tab nửa
 *      tiếng rồi quay lại mà thành phố ở đúng chỗ đáng lẽ phải có.
 *   2. **CHÂN KHÔNG TRƯỢT** — trong pha tiếp đất, bàn chân đứng yên trong toạ độ THẾ GIỚI.
 *   3. **BIÊN ĐỘ KHỚP CÓ TRẦN** — tay không quay như chong chóng ở bất kỳ kỷ nào.
 *   4. **HÌNH BÓNG ĐỔI THEO PHA BƯỚC** — và mô hình 2 hộp cũ phải cho ra ĐÚNG 0 ở cùng phép đo.
 *      Không có vế thứ hai thì con số ở vế thứ nhất có thể chỉ là nhiễu, và dự án này đã bị đúng
 *      chuyện đó cắn ở Phase 8D (cơ chế lùm cây "hoạt động" trên ảnh, đo ra là chưa bao giờ làm gì).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody, buildHumanBodyLowDetail, humanDims } from './human.js';
import { gaitOf } from './humanGait.js';
import { getHumanStyle } from './humanStyle.js';
import {
  ELBOW_GAIN,
  ELBOW_REST_RAD,
  footContactAt,
  footOffsetAt,
  partCenterAt,
  partCornersAt,
  poseAt,
  silhouetteSpanX,
} from './humanPose.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

test('tất định: cùng quãng đường ⇒ cùng tư thế, và trọn một chu kỳ thì về đúng chỗ cũ', () => {
  const body = buildHumanBody(1);
  for (const d of [0, 0.013, 0.4, 97.25]) {
    assert.deepEqual(poseAt(body, d), poseAt(body, d), `lệch ở quãng đường ${d}`);
  }
  const { cycle } = poseAt(body, 0);
  const a = poseAt(body, 0.31);
  const b = poseAt(body, 0.31 + cycle * 4);
  for (const joint of Object.keys(a.joints)) {
    assert.ok(Math.abs(a.joints[joint].a - b.joints[joint].a) < 1e-9,
      `khớp ${joint} không tuần hoàn theo chu kỳ bước`);
  }
  assert.ok(Math.abs(a.bob - b.bob) < 1e-9, 'cái nhún không tuần hoàn');
});

test('dữ liệu rác không làm nổ màn hình Thành Phố', () => {
  assert.equal(poseAt(null, 3), null);
  assert.equal(poseAt({}, 3), null);
  const body = buildHumanBody(1);
  for (const bad of [undefined, NaN, Infinity, -Infinity]) {
    const pose = poseAt(body, bad);
    assert.ok(pose && Number.isFinite(pose.bob), `quãng đường "${bad}" phải ra tư thế hợp lệ`);
  }
  assert.equal(partCenterAt({ joint: 'khôngCóThật', rest: { x: 0, y: 0, z: 0 } }, poseAt(body, 0)), null);
});

test('CHÂN KHÔNG TRƯỢT: bàn chân đứng yên trong THẾ GIỚI suốt pha tiếp đất', () => {
  // ⚠️ ĐO TRONG TOẠ ĐỘ THẾ GIỚI, KHÔNG ĐO GÓC. Một bộ góc trông hợp lý hoàn toàn có thể cho ra
  // bàn chân quét trên mặt đường; thứ duy nhất chứng minh được là cộng quãng đường thân đã đi vào
  // vị trí bàn chân rồi xem nó có nhúc nhích không.
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    // ⚠️ CẲNG CHÂN, KHÔNG PHẢI ĐÙI (từ ADR-057). Bàn chân nằm ở đầu mút dưới của cẳng chân, treo
    // vào khớp GỐI. Hỏi khối đùi thì hàm trả về chỗ đặt đầu gối, và bài test sẽ đo một thứ hoàn
    // toàn khác mà vẫn ra những con số trông hợp lý.
    const legL = body.parts.find((p) => p.id === 'shinL');
    const { cycle } = poseAt(body, 0);

    let lo = Infinity;
    let hi = -Infinity;
    // Lấy mẫu dày TRONG pha tiếp đất của chân trái: pha 0,02 tới 0,48.
    for (let i = 0; i <= 60; i += 1) {
      const phase = 0.02 + (0.46 * i) / 60;
      const travelled = phase * cycle;
      const foot = footContactAt(legL, poseAt(body, travelled));
      // Thân đã tiến `travelled` theo hướng đi; bàn chân lệch `foot.x` so với thân.
      const worldX = travelled + foot.x;
      if (worldX < lo) lo = worldX;
      if (worldX > hi) hi = worldX;
      // Và bàn chân phải ở NGAY TRÊN MẶT ĐẤT trong suốt pha tiếp đất, không lún không lơ lửng.
      assert.ok(Math.abs(foot.y) < 1e-9,
        `kỷ ${era}: bàn chân tiếp đất ở cao độ ${foot.y.toFixed(5)} thay vì 0`);
    }
    const trượt = hi - lo;
    const H = humanDims(getHumanStyle(era)).height;
    assert.ok(trượt < H * 1e-6,
      `kỷ ${era}: bàn chân trượt ${trượt.toFixed(6)} ô trong pha tiếp đất (bằng`
      + ` ${(trượt / H * 100).toFixed(2)}% chiều cao người)`);
  }
});

test('ĐỐI CHỨNG cho phép đo chân: một dáng đi HỎNG phải bị bắt', () => {
  // ⚠️ Phép đo ở bài trên chỉ đáng tin nếu nó BẮT ĐƯỢC cái sai. Bản đầu của `footOffsetAt` dùng
  // biên độ `cycle/2` thay vì `cycle/4` — nghe hợp lý ("bước dài bằng cả sải chân") và cho ra một
  // dáng đi trông vẫn ổn trên ảnh. Dựng lại đúng phép tính hỏng ấy rồi đòi phép đo phải kêu.
  const body = buildHumanBody(1);
  const { cycle } = poseAt(body, 0);
  const legLen = body.dims.legLen;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= 60; i += 1) {
    const phase = 0.02 + (0.46 * i) / 60;
    const travelled = phase * cycle;
    // Bản HỎNG: biên độ gấp đôi ⇒ chân lùi nhanh gấp đôi thân.
    const offHỏng = cycle * 0.5 - phase * cycle * 2;
    const worldX = travelled + legLen * Math.sin(Math.asin(Math.max(-1, Math.min(1, offHỏng / legLen))));
    if (worldX < lo) lo = worldX;
    if (worldX > hi) hi = worldX;
  }
  assert.ok(hi - lo > body.dims.height * 0.05,
    `phép đo không bắt được dáng đi hỏng (chỉ thấy trượt ${(hi - lo).toFixed(5)} ô)`);
});

test('BIÊN ĐỘ KHỚP CÓ TRẦN: chân không duỗi quá tầm, gối không bẻ ngược, tay không như chong chóng', () => {
  for (const era of ERAS) {
    const style = getHumanStyle(era);
    const body = buildHumanBody(era);
    const { cycle } = poseAt(body, 0);

    // ⚠️ ĐỌC KỸ TRƯỚC KHI SỬA — TRẦN CŨ `asin(stride/4)` ĐÃ CHẾT CÙNG CHÂN CỨNG (ADR-057).
    // Nó suy từ một tam giác vuông: chân là MỘT đoạn thẳng dài `legLen`, bàn chân xa nhất `cycle/4`
    // ⇒ đùi nghiêng đúng `asin`. Có đầu gối thật thì đùi phải nghiêng NHIỀU HƠN thế, vì cẳng chân
    // gập lại "ăn bớt" một đoạn với. Đo được: kỷ 1 hông 57,3° trong khi trần cũ nói 27,5°.
    // Giữ nguyên con số ấy làm trần là ép mã sản phẩm quay lại mô hình chân cứng — tức dùng một
    // bài test để hoàn tác một bản vá đúng. Nay nó đổi vai: thành SÀN.
    const gócBànChân = Math.asin(Math.min(1, style.stride / 4));
    const trầnTay = Math.abs(style.stance) + style.armSwing;
    const trầnKhuỷu = ELBOW_REST_RAD + ELBOW_GAIN * style.armSwing;

    let hôngMax = 0;
    let tayMax = 0;
    let khuỷuMin = Infinity;
    let khuỷuMax = -Infinity;
    let gốiMax = -Infinity;
    let vớiMax = 0;
    for (let i = 0; i < 240; i += 1) {
      const pose = poseAt(body, (cycle * i) / 240);

      // (1) CHÂN KHÔNG BAO GIỜ ĐÒI VƯƠN QUÁ TẦM. Đây là bất biến CỐT LÕI của phép giải khớp
      // ngược: `reach` là tỉ số giữa khoảng cách hông→bàn chân và (đùi + cẳng chân). Chạm 1 nghĩa
      // là chân duỗi thẳng đơ; vượt 1 nghĩa là bàn chân nằm ở chỗ chân KHÔNG với tới, và lúc ấy
      // hàm giải phải kẹp lại ⇒ bàn chân TRƯỢT. Bài `CHÂN KHÔNG TRƯỢT` sẽ đỏ theo, nhưng bài này
      // đỏ TRƯỚC và chỉ thẳng vào nguyên nhân.
      assert.ok(Number.isFinite(pose.reach) && pose.reach < 1,
        `kỷ ${era}: chân phải vươn ${pose.reach.toFixed(4)} lần tầm với — quá tầm`);
      vớiMax = Math.max(vớiMax, pose.reach);

      for (const [tên, j] of Object.entries(pose.joints)) {
        assert.ok(Number.isFinite(j.a), `kỷ ${era}: khớp ${tên} ra góc ngửa không hợp lệ`);
        assert.ok(Number.isFinite(j.b ?? 0), `kỷ ${era}: khớp ${tên} ra góc lắc không hợp lệ`);
        // Trần THÔ, tuyệt đối: không khớp nào của DÁNG ĐI được quay quá 91°. Đây KHÔNG phải cái
        // gác chính (bốn phép dưới mới là) — nó chỉ bắt ca mã pose loạn hẳn. Ca xấu nhất đo được
        // là gối kỷ 1 (`prowl`, chùng nhất bảng) ở 84,3°.
        assert.ok(Math.abs(j.a) < 1.6,
          `kỷ ${era}: khớp ${tên} quay ${(j.a * 180 / Math.PI).toFixed(1)}° — quá 91°`);
        if (tên.startsWith('hip')) hôngMax = Math.max(hôngMax, Math.abs(j.a));
        if (tên.startsWith('shoulder')) tayMax = Math.max(tayMax, Math.abs(j.a));
      }
      for (const bên of ['L', 'R']) {
        // (2) GỐI KHÔNG BẺ NGƯỢC. Góc cẳng chân trừ góc đùi là độ gập của gối, và ở người nó chỉ
        // gập được về MỘT phía. Dấu phải âm ở MỌI thời điểm, MỌI kỷ — dương một lần là đầu gối
        // vừa gập ngược ra sau, thứ mà mắt đọc ra ngay là "con bọ" chứ không phải người.
        const gối = pose.joints[`knee${bên}`].a - pose.joints[`hip${bên}`].a;
        assert.ok(gối < 0,
          `kỷ ${era}: gối ${bên} bẻ ngược ${(gối * 180 / Math.PI).toFixed(1)}°`);
        gốiMax = Math.max(gốiMax, gối);
        // (3) KHUỶU CHỈ GẬP VÀO, KHÔNG BAO GIỜ DUỖI QUÁ THẲNG, và không quá tầm đã khai.
        const khuỷu = pose.joints[`elbow${bên}`].a - pose.joints[`shoulder${bên}`].a;
        khuỷuMin = Math.min(khuỷuMin, khuỷu);
        khuỷuMax = Math.max(khuỷuMax, khuỷu);
      }
    }

    // (4) SÀN HÔNG — buộc vào chính con số đã khai. Nâng `stride` thì sàn tự nâng theo; mã pose
    // lén thu biên độ chân lại thì bài này đỏ ngay. Đây là vế thay cho cái trần đã chết ở trên.
    assert.ok(hôngMax > gócBànChân + 1e-9,
      `kỷ ${era}: đùi chỉ nghiêng ${(hôngMax * 180 / Math.PI).toFixed(1)}°, không hơn góc bàn chân`
      + ` ${(gócBànChân * 180 / Math.PI).toFixed(1)}° — có đầu gối thật thì nó PHẢI nghiêng hơn`);
    assert.ok(tayMax <= trầnTay + 1e-9,
      `kỷ ${era}: tay quay ${(tayMax * 180 / Math.PI).toFixed(1)}° vượt trần`
      + ` ${(trầnTay * 180 / Math.PI).toFixed(1)}° suy từ (độ khom + biên độ vung)`);
    assert.ok(tayMax > trầnTay * 0.98,
      `kỷ ${era}: tay không bao giờ dùng tới biên độ vung đã khai`);
    assert.ok(khuỷuMin >= ELBOW_REST_RAD - 1e-9 && khuỷuMax <= trầnKhuỷu + 1e-9,
      `kỷ ${era}: khuỷu chạy [${(khuỷuMin * 180 / Math.PI).toFixed(1)},`
      + `${(khuỷuMax * 180 / Math.PI).toFixed(1)}]° ngoài dải cho phép`);
    assert.ok(khuỷuMax > khuỷuMin + 0.02,
      `kỷ ${era}: khuỷu đứng yên ⇒ trục gập tay là một trục CHẾT`);
    // Gối phải THẬT SỰ gập, không chỉ hơi nhúc nhích — nếu không thì cả phép giải khớp ngược chỉ
    // là một cách viết dài dòng của mô hình chân cứng cũ.
    assert.ok(gốiMax < -0.1,
      `kỷ ${era}: gối gập nhiều nhất mới ${(gốiMax * 180 / Math.PI).toFixed(1)}° — gần như thẳng đơ`);
    // Và tầm với phải được dùng gần hết: một cái chân chỉ vươn 40% tầm thì sải chân đã khai
    // không hề tới được màn hình.
    assert.ok(vớiMax > 0.6, `kỷ ${era}: chân chỉ vươn tối đa ${vớiMax.toFixed(3)} lần tầm`);
  }
});

/**
 * Bề rộng hình bóng (theo TRỤC ĐI) của một TẬP CON các bộ phận, tại một quãng đường đã đi.
 * `silhouetteSpanX` của mã sản phẩm lấy TOÀN BỘ bộ phận; hàm này cho phép hỏi riêng "chỉ hai chân"
 * — xem lý do ở bài test ngay dưới.
 */
function spanCua(body, parts, travelled) {
  const pose = poseAt(body, travelled);
  let lo = Infinity;
  let hi = -Infinity;
  for (const part of parts) {
    for (const c of partCornersAt(part, pose)) {
      if (c.x < lo) lo = c.x;
      if (c.x > hi) hi = c.x;
    }
  }
  return hi - lo;
}

/**
 * CỤM CHÂN — đùi (khớp hông) + cẳng chân và bàn chân (khớp GỐI).
 * ⚠️ Từ ADR-057 phải hỏi CẢ BỐN khớp. Lọc mỗi `hip*` thì chỉ còn hai cái đùi, và hai cái đùi thì
 * tách ra ÍT hơn hẳn cả cụm chân — phép đo sẽ nói thiếu mà không có gì đỏ lên.
 */
const chanCua = (body) => body.parts.filter(
  (q) => q.joint === 'hipL' || q.joint === 'hipR' || q.joint === 'kneeL' || q.joint === 'kneeR');

test('HÌNH BÓNG ĐỔI THEO PHA BƯỚC — và mô hình 2 hộp cũ ra ĐÚNG 0', () => {
  // ⚠️ SO PHA 0 VỚI PHA 0,25 — KHÔNG PHẢI 0,5, VÀ ĐÂY LÀ MỘT CÁI BẪY THẬT.
  // Yêu cầu ban đầu ghi "đo bề ngang ở pha 0 và pha 0,5". Nhưng ở pha 0,5 hai chân chỉ ĐỔI CHỖ
  // cho nhau: chân trái đang ở trước thì thành chân phải ở trước. Hình bóng là ẢNH GƯƠNG của pha
  // 0, tức **bề rộng y hệt**, và phép đo sẽ ra 0 trên một dáng đi hoàn toàn đúng. Bề rộng nhỏ
  // nhất nằm ở pha 0,25 — lúc hai chân chụm và hai tay buông thẳng.
  //
  // ⚠️ VÀ ĐÂY LÀ BẢN VÁ THỨ HAI (2026-08-23) — LẦN NÀY PHÉP ĐO BỊ PHA LOÃNG BỞI NHỮNG BỘ PHẬN
  // **ĐỨNG YÊN MÀ RỘNG**, VÀ NÓ CHỈ LỘ RA KHI BẢNG ĐỦ 15 KỶ.
  // Bản cũ đo bề rộng CẢ NGƯỜI. Khi chỉ có kỷ 1 (búi tóc bé) thì bề rộng ấy do hai chân quyết, nên
  // nó đúng là "dáng đi đổi bao nhiêu". Thêm 14 kỷ thì nón lá kỷ 6 **rộng hơn cả sải chân**
  // (1,12 lần) và mũ vành kỷ 7 gần bằng (0,92 lần) — cái đĩa ấy quyết cả `min` lẫn `max` ở CẢ HAI
  // pha, nên hiệu số về gần 0 (kỷ 6: **2,1%**) trong khi hai chân vẫn tách ra **31,7%**. Cơ chế
  // chạy hoàn hảo; phép đo mù.
  // ⇒ Cùng đúng hình dạng `TECH_DEBT #22` (trung bình trên vùng quá rộng pha loãng tín hiệu ~10
  // lần) và bài học ngân sách tam giác 2026-08-17 (hằng số nền pha loãng 43% xuống 16%): **một
  // phần con số KHÔNG ĐỔI qua các trường hợp đang so thì phần đó phải được tách ra**.
  // ⇒ Nên nay có HAI phép đo, mỗi phép trả lời một câu:
  //     (A) CHỈ HAI CHÂN  → "cơ chế dáng đi có chạy không?"  — mọi kỷ phải đạt.
  //     (B) CẢ NGƯỜI      → "đường bao NGOÀI có đổi không?" — có ngoại lệ, và ngoại lệ được ĐẾM.
  const RỘNG = 0;
  const HẸP = 0.25;

  // ── (A) CƠ CHẾ: hai chân phải tách ra, ở CẢ 15 KỶ ───────────────────────────────────────────
  // Ngưỡng 0,20 chiều cao người. ⚠️ ĐO BIÊN chứ đừng chỉ đọc xanh/đỏ (bài học Phase 9B): sàn thật
  // đo được là **24,7% ở kỷ 4** (áo chấm sàn + sải ngắn nhất bộ), tức biên 23,5%. Trần là 44,3% ở
  // kỷ 1. Nếu một phase sau kéo sàn ấy xuống dưới 20% thì cái đỏ là ĐÚNG, đừng nới ngưỡng.
  // ⚠️ HAI CON SỐ ẤY VỪA DỊCH NHẸ (25,1→24,7 · 45,2→44,3) khi cụm chân được thêm BÀN CHÂN
  // (2026-08-23), và chúng dịch XUỐNG chứ không lên — nghe ngược, nên phải nói ra lý do: bàn chân
  // cộng một lượng gần như KHÔNG ĐỔI vào cả hai pha (nó dài theo trục đi ở mọi tư thế), nên nó vào
  // cả số bị trừ lẫn số trừ và làm loãng HIỆU SỐ đúng vài phần trăm. Cùng hình dạng `TECH_DEBT #22`
  // — chỉ khác là ở đây mức loãng nhỏ và đã được đo, chứ không bị đọc nhầm thành hồi quy.
  const banA = [];
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const { cycle } = poseAt(body, 0);
    const H = body.dims.height;
    const chan = chanCua(body);
    // ⚠️ SÁU, KHÔNG PHẢI BỐN — "chân" nay là một CỤM: đùi + cẳng chân + bàn chân mỗi bên
    // (ADR-057; trước đó là 4, và trước nữa là 2).
    // Gác chạy-rỗng này vẫn giữ nguyên công dụng (bộ lọc trả về rỗng thì `spanCua` ra −∞ và mọi
    // assert dưới đều xanh oan), chỉ là con số đúng đã đổi. Và nó PHẢI đổi theo: để nguyên 2 thì
    // hoặc test đỏ oan, hoặc — tệ hơn — có người "sửa" bằng cách lọc riêng `id.startsWith('leg')`,
    // lúc ấy vế bất biến ngay dưới sẽ đỏ THẬT vì bàn chân thò ra trước làm đường bao ngoài đổi
    // NHIỀU HƠN phần cẳng chân, và người ta sẽ đi chữa một cơ chế hoàn toàn lành.
    assert.equal(chan.length, 6, `kỷ ${era}: phải có đúng 6 khối cụm chân, thấy ${chan.length}`);
    const chenhChan = (spanCua(body, chan, cycle * RỘNG) - spanCua(body, chan, cycle * HẸP)) / H;
    const chenhNguoi = (silhouetteSpanX(body, cycle * RỘNG) - silhouetteSpanX(body, cycle * HẸP)) / H;
    banA.push({ era, chenhChan, chenhNguoi });

    assert.ok(chenhChan > 0.20,
      `kỷ ${era}: hai chân chỉ tách ${(chenhChan * 100).toFixed(1)}% chiều cao giữa hai pha`
      + ' — cơ chế dáng đi không chạy');

    // ⚠️ BẤT BIẾN CÓ RĂNG: đường bao NGOÀI không bao giờ được đổi NHIỀU HƠN hai chân. Thứ duy nhất
    // chuyển động là chân và tay, mà tay thì gắn vào thân nên biên độ ngang của nó nhỏ hơn chân.
    // Nếu vế này đỏ thì có một vật ĐỨNG YÊN đang đu đưa — đúng cái lỗi "cây giáo thành quả lắc" mà
    // bài dưới bắt, chỉ khác là bài này bắt được cả những vật KHÔNG gắn vào tay cầm.
    assert.ok(chenhNguoi <= chenhChan + 1e-9,
      `kỷ ${era}: đường bao ngoài đổi ${(chenhNguoi * 100).toFixed(1)}% trong khi hai chân chỉ đổi`
      + ` ${(chenhChan * 100).toFixed(1)}% — có thứ đứng yên đang đu đưa`);
  }

  // ── (B) ĐƯỜNG BAO NGOÀI: ngoại lệ phải ĐẾM ĐƯỢC, không được nới ngưỡng ───────────────────────
  // ⚠️ `assert.deepEqual` chứ không phải "bao gồm": kỷ thứ ba rơi vào thì ĐỎ, mà kỷ 6 được chữa
  // xong cũng ĐỎ. Một danh sách "bao gồm" là cách một bản vá lặng lẽ thành cái chăn trùm.
  const CHE = banA.filter((r) => r.chenhNguoi < 0.06).map((r) => r.era);
  // ⚠️ DANH SÁCH NÀY ĐÃ CẠN: [6, 7] → [6] → **[] (2026-08-23, ADR-055)**, và một ngoại lệ BIẾN MẤT
  // là bằng chứng mạnh hơn một ngoại lệ được THÊM VÀO. Hai nguyên nhân, cả hai đều đo được:
  //   • BÀN CHÂN (khối mới) thò ra phía trước ở đầu mút cẳng chân ⇒ cụm chân trải rộng hơn cái
  //     vành mũ 1,9 `headW` của kỷ 7, nên dáng đi đọc ra được ở đường bao ngoài.
  //   • NÓN LÁ kỷ 6 thu từ 2,2 xuống 1,71 `headW` (xem `headgearPieces` — nó được phép thu vì bề
  //     rộng của một cái nón KHÔNG bị cái đầu ràng buộc theo tỉ lệ, chỉ bị chặn dưới).
  // Nếu bản vá nào sau này làm danh sách này DÀI RA thì gần như chắc chắn nó đang vá triệu chứng.
  assert.deepEqual(CHE, [],
    `kỷ có đường bao ngoài gần như đứng yên: [${CHE}] — mong đợi RỖNG`);

  // ⚠️ MỘT DANH SÁCH RỖNG LÀM CHO MỌI VÒNG LẶP TRÊN NÓ THÀNH VÔ NGHĨA, nên chỗ này KHÔNG duyệt
  // `CHE` nữa (duyệt một tập rỗng là "kết luận sạch từ một tập RỖNG", đúng cái bẫy đã cắn
  // `shot.mjs --fit`). Thay bằng một phép đo NÓI ĐƯỢC VÌ SAO nó rỗng: lấy kỷ đội thứ RỘNG NHẤT
  // bảng — ca khó nhất, vì cái đĩa trên đầu là thứ duy nhất có thể quyết cả hai đầu hình bóng —
  // rồi đòi sải chân của chính kỷ ấy phải VƯỢT bề ngang đội đầu. Đây là một QUAN HỆ, không phải
  // một mức, nên nó không già đi khi bảng mũ được chỉnh (bài học Phase 7D).
  const độiRộngNhất = ERAS
    .map((era) => {
      const body = buildHumanBody(era);
      const q = body.parts.find((x) => x.id === 'headgear');
      return { era, body, rộngMũ: q ? q.w : 0 };
    })
    .reduce((a, b) => (a.rộngMũ >= b.rộngMũ ? a : b));
  assert.ok(độiRộngNhất.rộngMũ > 0, 'không kỷ nào đội gì ⇒ phép đo này không còn ca khó nhất để canh');
  const sảiChânCaKhó = spanCua(độiRộngNhất.body, chanCua(độiRộngNhất.body), 0);
  assert.ok(sảiChânCaKhó > độiRộngNhất.rộngMũ,
    `kỷ ${độiRộngNhất.era} đội thứ rộng nhất bảng (${độiRộngNhất.rộngMũ.toFixed(4)}) mà sải chân chỉ`
    + ` ${sảiChânCaKhó.toFixed(4)} ⇒ cái đĩa trên đầu quyết cả hai đầu hình bóng, và danh sách CHE`
    + ' sắp có người quay lại');

  // ── ĐỐI CHỨNG: mô hình 2 hộp cũ ─────────────────────────────────────────────────────────────
  // Cả hai hộp treo vào khớp `torso`, mà khớp ấy có góc CỐ ĐỊNH — nên bề rộng phải đứng yên tuyệt
  // đối qua mọi pha. Nếu phép đo trên vẫn báo một con số khác 0 ở đây thì nó đang đo nhiễu, và
  // mọi kết luận bên trên vô giá trị.
  const cũ = buildHumanBodyLowDetail(1);
  const { cycle: cycleCũ } = poseAt(cũ, 0);
  const rộngCũ = silhouetteSpanX(cũ, 0);
  const hẹpCũ = silhouetteSpanX(cũ, cycleCũ * HẸP);
  assert.ok(Math.abs(rộngCũ - hẹpCũ) < 1e-12,
    `mô hình 2 hộp cũ mà hình bóng đổi ${(rộngCũ - hẹpCũ).toFixed(9)} — phép đo đang bắt nhiễu`);
  // ⚠️ VÀ PHẢI KIỂM RẰNG NÓ ĐO ĐƯỢC GÌ ĐÓ. Một phép đo luôn trả 0 cũng qua được assert trên; đó
  // đúng là cái bẫy "kết luận sạch từ một tập RỖNG" đã cắn `shot.mjs --fit`.
  assert.ok(rộngCũ > 0, 'phép đo ra 0 trên chính mô hình cũ ⇒ nó chưa hề đo gì');
  // Và mô hình cũ KHÔNG có khối chân riêng — nên phép đo (A) phải trả về một tập rỗng ở đó, chứ
  // không phải một con số nhỏ trông như "gần đúng".
  assert.equal(chanCua(cũ).length, 0, 'mô hình 2 hộp mà có khối gắn vào khớp hông ⇒ đối chứng hỏng');

  const sanA = banA.reduce((a, b) => (a.chenhChan < b.chenhChan ? a : b));
  const sanB = banA.filter((r) => !CHE.includes(r.era))
    .reduce((a, b) => (a.chenhNguoi < b.chenhNguoi ? a : b));
  console.log(`[humanPose] 15 kỷ · hai chân tách ${(sanA.chenhChan * 100).toFixed(1)}%…`
    + `${(Math.max(...banA.map((r) => r.chenhChan)) * 100).toFixed(1)}% chiều cao (sàn ở kỷ ${sanA.era})`
    + ` · đường bao ngoài thấp nhất: kỷ ${sanB.era} ${(sanB.chenhNguoi * 100).toFixed(1)}%`
    + ` · 0 kỷ bị đội đầu che dáng đi (ca khó nhất: kỷ ${độiRộngNhất.era}, mũ`
    + ` ${độiRộngNhất.rộngMũ.toFixed(4)} so với sải chân ${sảiChânCaKhó.toFixed(4)})`
    + ` · mô hình 2 hộp cũ: 0,0%`);
});

test('CÁI NHÚN là hệ quả của chân trụ, không phải một hàm sin riêng', () => {
  const body = buildHumanBody(1);
  const { cycle } = poseAt(body, 0);
  const legLen = body.dims.legLen;

  // Cao nhất ở GIỮA pha tiếp đất (chân trụ dựng đứng), thấp nhất ở hai đầu bước. Đó là hình dạng
  // nhún của người thật — và nó phải rơi ra từ hình học, không phải từ một biên độ chọn tay.
  const giữa = poseAt(body, cycle * 0.25).bob;
  const đầu = poseAt(body, cycle * 0.0).bob;
  assert.ok(giữa > đầu, 'hông phải cao nhất ở giữa pha tiếp đất');

  // ⚠️ TỪ ADR-057 CÓ THÊM MỘT SỐ HẠNG, VÀ NÓ KHÔNG PHẢI "MỘT LUẬT THỨ HAI" — nó là gối chùng
  // (`flex`). Bản trước đòi `bob` ở giữa pha tiếp đất bằng ĐÚNG 0, tức ngầm khẳng định chân trụ
  // lúc nào cũng duỗi thẳng đơ. Điều đó đúng khi chân là một khối cứng và SAI ngay khi có đầu gối
  // thật: người đi bộ thật không bao giờ khoá gối ở giữa pha trụ, và đó chính là thứ phân biệt
  // dáng rình (`flex` 0,14) với dáng đi đều (`flex` 0,01).
  // ⇒ Công thức đầy đủ: `hipY = √(legLen² − off²) × (1 − flex)`. Vẫn KHÔNG có hằng số chọn tay
  // nào; cả hai vế đều suy từ bảng.
  const style = getHumanStyle(1);
  const g = gaitOf(style.gait);
  const trầnHông = Math.asin(Math.min(1, style.stride / 4));
  assert.ok(Math.abs(giữa - (-legLen * g.flex)) < 1e-9,
    `giữa pha tiếp đất, hông phải thấp đúng bằng phần gối chùng (${(-legLen * g.flex).toFixed(6)}),`
    + ` đo được ${giữa.toFixed(6)}`);
  assert.ok(Math.abs(đầu - legLen * (Math.cos(trầnHông) * (1 - g.flex) - 1)) < 1e-9,
    'biên độ nhún không khớp với hình học chân trụ ⇒ có một luật thứ hai đang chen vào');

  // Và nhún luôn KÉO XUỐNG, không bao giờ đẩy người lên trên chiều cao đứng yên.
  for (let i = 0; i < 120; i += 1) {
    assert.ok(poseAt(body, (cycle * i) / 120).bob <= 1e-12, 'cái nhún không được đẩy người bay lên');
  }
});

test('pha tiếp đất và pha đưa chân nối liền, không gãy khúc', () => {
  const cycle = 0.24;
  // Liên tục ở chỗ nối p = 0,5 và ở chỗ gói vòng p = 1 → 0.
  assert.ok(Math.abs(footOffsetAt(0.4999999, cycle) - footOffsetAt(0.5, cycle)) < 1e-6);
  assert.ok(Math.abs(footOffsetAt(0.9999999, cycle) - footOffsetAt(0, cycle)) < 1e-6);
  // Và pha tiếp đất phải THẲNG theo pha — đó là điều kiện để bàn chân đứng yên.
  const d1 = footOffsetAt(0.2, cycle) - footOffsetAt(0.1, cycle);
  const d2 = footOffsetAt(0.4, cycle) - footOffsetAt(0.3, cycle);
  assert.ok(Math.abs(d1 - d2) < 1e-12, 'pha tiếp đất không thẳng ⇒ bàn chân sẽ trượt');
});

test('TAY ĐANG CẦM ĐỒ gần như không vung — cây giáo không được thành quả lắc', () => {
  // ⚠️ BÀI NÀY SINH RA TỪ MỘT LỖI NHÌN THẤY TRÊN ẢNH CHỤP GẦN, không phải từ suy luận. Cây giáo
  // kỷ 1 treo vào vai phải nên nó vung theo tay: đo ra **52,7° qua lại**. Một bàn tay đu 52° thì
  // bình thường; một cây gậy dài hơn cả người đu 52° thì là cái quả lắc đồng hồ.
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    if (!body.carryArm) continue;
    const { cycle } = poseAt(body, 0);
    const biênĐộ = (khớp) => {
      let mn = Infinity;
      let mx = -Infinity;
      for (let i = 0; i < 200; i += 1) {
        const a = poseAt(body, (cycle * i) / 200).joints[khớp].a;
        mn = Math.min(mn, a);
        mx = Math.max(mx, a);
      }
      return mx - mn;
    };
    const bận = biênĐộ(body.carryArm);
    const rảnh = biênĐộ(body.carryArm === 'shoulderR' ? 'shoulderL' : 'shoulderR');
    assert.ok(bận < rảnh * 0.5,
      `kỷ ${era}: tay cầm đồ vung ${(bận * 180 / Math.PI).toFixed(1)}° so với tay rảnh`
      + ` ${(rảnh * 180 / Math.PI).toFixed(1)}° — chưa được ghìm lại`);
    // ⚠️ VÀ NHỐT LUÔN CON SỐ HỎNG CŨ. Không có vế này thì ngưỡng "một nửa" sẽ bị nới dần cho tiện.
    assert.ok(bận < 20 * Math.PI / 180,
      `kỷ ${era}: tay cầm đồ còn vung ${(bận * 180 / Math.PI).toFixed(1)}° — bản hỏng cũ là 52,7°`);
    // ⚠️ VÀ TAY RẢNH PHẢI VUNG THẬT — NHƯNG VUNG BAO NHIÊU LÀ CHUYỆN CỦA BẢNG, KHÔNG PHẢI CỦA BÀI
    // TEST. Bản cũ viết `rảnh > 20°`, một MỨC TUYỆT ĐỐI hiệu chuẩn trên kỷ 1 (`armSwing` 0,46 ⇒
    // 52,7°). Khi đủ 15 kỷ thì nó kêu OAN ở kỷ 6: người gánh đòn khai `armSwing` 0,12 nên tay rảnh
    // vung 13,8° — ĐÚNG như bảng khai, và cái đỏ ấy là *phép đo già đi*, không phải mã hỏng. Đúng
    // bẫy Phase 7D: một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ.
    // Nay hỏi chính cái quan hệ: biên độ tay rảnh phải bằng ĐÚNG `2 × armSwing` (vì
    // `a = aTorso − swing·cos(2π·pha)`). Nếu cả hai tay cùng đứng im thì `rảnh ≈ 0` trong khi bảng
    // khai 0,12 ⇒ vẫn ĐỎ. Chặt hơn bản cũ, và không thể già đi.
    const khai = 2 * getHumanStyle(era).armSwing;
    assert.ok(Math.abs(rảnh - khai) < 1e-9,
      `kỷ ${era}: tay rảnh vung ${(rảnh * 180 / Math.PI).toFixed(1)}° trong khi bảng khai`
      + ` armSwing ${getHumanStyle(era).armSwing} (⇒ phải là ${(khai * 180 / Math.PI).toFixed(1)}°)`
      + ' — hoặc tay đứng im, hoặc có thứ khác đang ghì nó lại');
    // Và bảng KHÔNG được khai `armSwing: 0` cho một kỷ có mang đồ: khi ấy vế "tay bận < nửa tay
    // rảnh" thành 0 < 0 và cả bài mất răng.
    assert.ok(getHumanStyle(era).armSwing > 0.05,
      `kỷ ${era} mang đồ mà khai armSwing ${getHumanStyle(era).armSwing} — phép so hai tay mất nghĩa`);
  }
});
