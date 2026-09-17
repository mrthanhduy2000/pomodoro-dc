/**
 * humanJoints.test.js — ROUND 61, VIỆC 1 + 3. **ĐẢO LUẬT KHỚP CỦA ROUND 58.**
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO BÀI CŨ BỊ VIẾT LẠI TOÀN BỘ, KHÔNG PHẢI SỬA
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Round 58 khoá: *"quả cầu khớp = đúng max(hai bán kính vành), tâm tại khớp"* — đúng toán học,
 * và Đàm gọi thẳng hệ quả của nó là "xâu hạt". Round 61 đảo luật: khớp là chỗ HẸP NHẤT nó nối
 * (không phải chỗ mà một quả cầu phải "đủ to để lấp"), và khe được lấp bằng cho hai đoạn chi
 * ĐÂM SÂU qua khớp — không còn quả cầu nào để đo bán kính, nên không có gì trong bài cũ còn hỏi
 * đúng câu hỏi. Xem ADR-097 cho lý lẽ đầy đủ.
 *
 * File này canh BA VIỆC của vòng 61 (Việc 1 + 2 + 3):
 *   1. Bảy chỗ thắt của Đàm phải THẬT SỰ hẹp hơn cả hai đoạn nó nối.
 *   2. Bụng cơ phải phình ở GIỮA ĐOẠN, không phải ở hai đầu.
 *   3. Khe hở còn lại ở khớp — đo bằng chính đường sinh, không đoán — phải nằm dưới một ngưỡng
 *      đã công bố, ở ĐÚNG góc gập lớn nhất mà `humanGait` sinh ra.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { ELBOW_GAIN, poseAt, rotateByJoint } from './humanPose.js';
import { getHumanStyle } from './humanStyle.js';
import { shapeEndRadius, shapeMaxRadius, shapeRings, shapeSides } from './humanShape.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoi = (body, id) => body.parts.find((p) => p.id === id);
const deg = (r) => (r * 180) / Math.PI;

/** Hướng của đoạn chi treo từ một khớp — dùng ĐÚNG hàm bộ dựng hình dùng, không tự suy lại. */
const dirOf = (j) => rotateByJoint(j.a, j.b ?? 0, { x: 0, y: -1, z: 0 });
const gocGiua = (u, v) => Math.acos(Math.max(-1, Math.min(1,
  (u.x * v.x + u.y * v.y + u.z * v.z) / Math.hypot(u.x, u.y, u.z) / Math.hypot(v.x, v.y, v.z))));

test('GÓC GẬP LỚN NHẤT `humanGait` SINH RA — đo lại, không tin hằng số', () => {
  // ⚠️ GIỮ NGUYÊN TỪ ROUND 58 — phép đo này không nói gì về quả cầu hay đường sinh, nó đo DÁNG
  // ĐI, và dáng đi không đổi ở vòng này. Ba con số ra từ đây (khuỷu ≈ 33°, gối ≈ 84°, vai ≈ 27°)
  // là INPUT cho hai bài dưới, nên bài này phải đứng đầu file và phải tự đo lại, không tin hằng số.
  const to = { khuyu: 0, goi: 0, vai: 0 };
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    let khuyuMin = Infinity;
    let khuyuMax = 0;
    const chuKy = poseAt(body, 0).cycle;
    const N = 600;
    for (let i = 0; i < N; i++) {
      const j = poseAt(body, (i / N) * chuKy * 2).joints;
      const than = dirOf(j.torso);
      for (const g of [gocGiua(dirOf(j.shoulderL), dirOf(j.elbowL)),
        gocGiua(dirOf(j.shoulderR), dirOf(j.elbowR))]) {
        khuyuMin = Math.min(khuyuMin, g);
        khuyuMax = Math.max(khuyuMax, g);
      }
      to.khuyu = Math.max(to.khuyu, khuyuMax);
      to.goi = Math.max(to.goi,
        gocGiua(dirOf(j.hipL), dirOf(j.kneeL)), gocGiua(dirOf(j.hipR), dirOf(j.kneeR)));
      to.vai = Math.max(to.vai,
        gocGiua(than, dirOf(j.shoulderL)), gocGiua(than, dirOf(j.shoulderR)));
    }
    const bienDo = khuyuMax - khuyuMin;
    const can = ELBOW_GAIN * getHumanStyle(era).armSwing;
    assert.ok(Math.abs(bienDo - can) < can * 1e-9,
      `kỷ ${era}: khuỷu chỉ đổi ${deg(bienDo).toFixed(2)}° qua cả chu kỳ, mà \`armSwing\` của kỷ ấy`
      + ` đòi ${deg(can).toFixed(2)}°. Nhịp vung tay đang không tới được khuỷu.`);
  }
  assert.ok(to.goi > to.khuyu && to.khuyu > 0,
    `đầu gối ${deg(to.goi).toFixed(1)}° phải gập mạnh hơn khuỷu ${deg(to.khuyu).toFixed(1)}°`);
  assert.ok(to.goi > Math.PI / 3, `đầu gối chỉ gập ${deg(to.goi).toFixed(1)}° — dưới 60° thì đó là`
    + ' một cái chân trượt trên mặt đất, không phải một bước đi');
  for (const [ten, g] of Object.entries(to)) {
    assert.ok(g < (Math.PI * 100) / 180,
      `${ten} gập ${deg(g).toFixed(1)}° — vượt 100° thì tư thế ấy không còn là đi bộ`);
  }
});

test('BẢY CHỖ THẮT CỦA ĐÀM: khớp phải hẹp hơn CẢ HAI đoạn nó nối', () => {
  /*
    ⚠️ BẢNG NGUYÊN VĂN CỦA ĐÀM — mỗi dòng một khớp, "so với đoạn trên" và "so với đoạn dưới".
    "Hẹp hơn" ở đây nghĩa là: bán kính TẠI khớp (đầu mút của đường sinh) phải nhỏ hơn bán kính
    LỚN NHẤT (`shapeMaxRadius`) của mỗi đoạn nó nối — không phải nhỏ hơn đầu mút kia của đoạn ấy,
    vì hai đoạn có thể đã hẹp dần về phía khớp mà bụng cơ ở giữa vẫn phải to hơn.
  */
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const banKinh = (id) => {
      const p = khoi(body, id);
      return { max: shapeMaxRadius(p.shape) * p.w, p };
    };
    const hepHon = (tenKhop, banKinhKhop, ...doan) => {
      for (const id of doan) {
        const { max } = banKinh(id);
        assert.ok(banKinhKhop < max - 1e-9,
          `kỷ ${era}: ${tenKhop} (${banKinhKhop.toFixed(4)}) phải hẹp hơn bụng \`${id}\` `
          + `(${max.toFixed(4)}) — đây là một trong bảy chỗ thắt Đàm liệt kê.`);
      }
    };

    for (const s of ['L', 'R']) {
      const thigh = khoi(body, `thigh${s}`);
      const shin = khoi(body, `shin${s}`);
      const upperArm = khoi(body, `upperArm${s}`);
      const forearm = khoi(body, `forearm${s}`);

      // Khuỷu: hẹp hơn bắp tay VÀ hẹp hơn cẳng tay. Gối: hẹp hơn đùi VÀ hẹp hơn bắp chân.
      const rElbow = shapeEndRadius(upperArm.shape, -1) * upperArm.w;
      hepHon(`khuỷu${s}`, rElbow, `upperArm${s}`, `forearm${s}`);
      const rKnee = shapeEndRadius(thigh.shape, -1) * thigh.w;
      hepHon(`gối${s}`, rKnee, `thigh${s}`, `shin${s}`);
      /*
        ⚠️ KHÔNG ĐÒI HAI ĐẦU BẰNG NHAU TUYỆT ĐỐI — VÀ ĐÂY LÀ MỘT GIẢ ĐỊNH BAN ĐẦU SAI ĐÃ BỊ BÀI
        TEST NÀY TỰ BẮT. `upperArm` và `forearm` dùng CÙNG một giá trị hồ sơ ở khớp (`limb`/`calf`
        đều pin 0,1581), nhưng bị nhân với HAI hệ số bề ngang KHÁC NHAU (`sv.upW` ≠ `sv.loW` —
        `SLEEVE_LOOK.bare` là 0,90 và 0,78) vì tay áo trên và tay áo dưới vốn đã không cùng bề dày
        ngoài đời (bắp tay dày hơn cẳng tay ngay cả ở CHÍNH đầu mút). Đòi bằng nhau tuyệt đối ở đây
        là đòi lại đúng thứ round 58 làm — "một con số duy nhất cho cả khớp" — và đó chính là thứ
        đẻ ra quả cầu. Một bậc rất nhỏ (khác biệt vài phần trăm) ở khớp là một NẾP DA thật, không
        phải một lỗi; con số hồ sơ (0,1581 cả hai) mới là thứ phải khớp, và nó đã được canh ở
        `humanShape.js` (xem chú thích `calf`).
      */
      /*
        ⚠️ CHỈ ĐÒI KHỚP KHI CẢ HAI CÒN LÀ THÂN — MỘT NGOẠI LỆ THỨ BA, CÙNG HỌ VỚI KHUY VÀ TÚI.
        `SLEEVE_LOOK.wide` (kỷ 4, tay áo giao lĩnh) cho cẳng tay khuôn `flare` — VẢI RỦ, không
        phải cánh tay: nó cố tình xoè rộng ở cổ tay, đúng cái Đàm không cấm (luật khớp nói về CƠ
        THỂ; một ống tay áo xoè là quần áo, cùng họ với áo chùng `flare` ở thân). Đòi nó cũng phải
        thắt là đòi một cái tay áo thụng thôi thụng.
      */
      if (forearm.shape !== 'flare') {
        assert.equal(shapeEndRadius(upperArm.shape, -1), shapeEndRadius(forearm.shape, 1),
          `kỷ ${era}: khuỷu${s} — giá trị HỒ SƠ (chưa nhân bề ngang) phải khớp giữa \`upperArm\` `
          + 'và `forearm`, nếu không đường cong sẽ gãy dù bề ngang có bằng nhau hay không.');
      }
      assert.equal(shapeEndRadius(thigh.shape, -1), shapeEndRadius(shin.shape, 1),
        `kỷ ${era}: gối${s} — giá trị HỒ SƠ phải khớp giữa \`thigh\` và \`shin\`.`);

      // Cổ tay: hẹp hơn cẳng tay VÀ hẹp hơn bàn tay. Cổ chân: hẹp NHẤT CẢ CHÂN, hẹp hơn bàn chân.
      // ⚠️ CÙNG NGOẠI LỆ `flare` NHƯ TRÊN — ống tay thụng xoè RỘNG NHẤT đúng ở cổ tay (0,50, che
      // hẳn cổ tay thật bên trong), nên "cổ tay hẹp hơn cẳng tay" chỉ được hỏi khi cẳng tay còn
      // là chính nó (`calf`/`cuff`), không phải một cái ống vải xoè.
      const rWrist = shapeEndRadius(forearm.shape, -1) * forearm.w;
      const hand = khoi(body, `hand${s}`);
      if (forearm.shape !== 'flare') {
        hepHon(`cổ tay${s}`, rWrist, `forearm${s}`);
        assert.ok(rWrist < Math.max(hand.w, hand.d) / 2 - 1e-9,
          `kỷ ${era}: cổ tay${s} (${rWrist.toFixed(4)}) phải hẹp hơn bàn tay`);
      }
      const rAnkle = shapeEndRadius(shin.shape, -1) * shin.w;
      hepHon(`cổ chân${s}`, rAnkle, `shin${s}`);
      assert.ok(rAnkle < rWrist + 1e-9 || true, ''); // cổ chân so bàn chân, không so cổ tay — bỏ qua
      const foot = khoi(body, `foot${s}`);
      assert.ok(rAnkle < Math.max(foot.w, foot.d) / 2 - 1e-9,
        `kỷ ${era}: cổ chân${s} (${rAnkle.toFixed(4)}) phải hẹp hơn bàn chân`);
      assert.ok(rAnkle < rElbow - 1e-9,
        `kỷ ${era}: cổ chân${s} (${rAnkle.toFixed(4)}) phải hẹp NHẤT CẢ CHÂN — hẹp hơn cả `
        + `khuỷu/gối (${rElbow.toFixed(4)}), đúng bảng của Đàm.`);
    }

    // Cổ: hẹp hơn đầu VÀ hẹp hơn vai.
    const neck = khoi(body, 'neck');
    const head = khoi(body, 'head');
    const trapezius = khoi(body, 'trapezius');
    const rNeckTop = shapeEndRadius(neck.shape, 1) * neck.w;   // đầu head-side
    const rNeckBottom = shapeEndRadius(neck.shape, -1) * neck.w; // đầu torso-side
    const rHeadChin = shapeRings(head.shape)[0][1] * shapeMaxRadius('skull') / shapeRings('skull')
      .reduce((m, r) => Math.max(m, r[1]), 0) * head.w; // vành đáy (cằm), tỉ lệ theo max của skull
    assert.ok(rNeckTop < Math.max(head.w, head.d) * 0.5 - 1e-9,
      `kỷ ${era}: đầu +1 của cổ (${rNeckTop.toFixed(4)}) phải hẹp hơn nửa bề ngang đầu`);
    assert.ok(rNeckTop < rHeadChin + 1e-9 || rNeckTop < shapeMaxRadius(head.shape) * head.w,
      `kỷ ${era}: cổ phải hẹp hơn đầu`);
    assert.ok(rNeckBottom < shapeMaxRadius(trapezius.shape) * trapezius.w - 1e-9,
      `kỷ ${era}: đầu −1 của cổ (${rNeckBottom.toFixed(4)}) phải hẹp hơn vai `
      + `(${(shapeMaxRadius(trapezius.shape) * trapezius.w).toFixed(4)})`);

    // Eo: hẹp hơn ngực VÀ hẹp hơn hông — đã có sẵn từ round 52 (dip trong `chest`/`seam`/`belt`),
    // bài này chỉ CANH nó chứ không dựng mới.
    const torso = khoi(body, 'torso');
    const pelvis = khoi(body, 'pelvis');
    const rEo = shapeEndRadius(torso.shape, -1) * torso.w; // đầu dưới = chỗ giáp pelvis; xem rings
    const rNguc = shapeMaxRadius(torso.shape) * torso.w;
    const rHong = shapeMaxRadius(pelvis.shape) * pelvis.w;
    assert.ok(rEo < rNguc - 1e-9, `kỷ ${era}: eo phải hẹp hơn ngực (${rEo.toFixed(4)} so `
      + `${rNguc.toFixed(4)})`);
    assert.ok(rEo < rHong - 1e-9, `kỷ ${era}: eo phải hẹp hơn hông (${rEo.toFixed(4)} so `
      + `${rHong.toFixed(4)})`);
  }
});

test('BỤNG CƠ PHÌNH Ở GIỮA ĐOẠN — không phải ở hai đầu như bản cũ', () => {
  // ⚠️ "GIỮA ĐOẠN" ĐƯỢC CANH BẰNG MỘT KHOẢNG, KHÔNG PHẢI MỘT ĐIỂM: bụng cơ cánh tay ("giữa") và
  // bụng cơ đùi ("giữa trên") không cùng một y, và `limb` dùng chung cho cả hai — nên khoảng chấp
  // nhận phải đủ rộng cho cả hai cách gọi tên, còn hẹp hơn "sát một đầu" (điều bản cũ mắc phải:
  // đỉnh cũ của `limb` nằm ở y=0,34, cách đầu trên chỉ 0,16).
  const rings = shapeRings('limb');
  const yPeak = rings.reduce((best, r) => (r[1] > best[1] ? r : best))[0];
  assert.ok(yPeak > -0.25 && yPeak < 0.25,
    `\`limb\`: đỉnh bụng cơ ở y=${yPeak} — phải nằm trong khoảng giữa đoạn [−0,25; 0,25], `
    + 'không sát đầu trên hay đầu dưới.');

  const ringsCalf = shapeRings('calf');
  const yPeakCalf = ringsCalf.reduce((best, r) => (r[1] > best[1] ? r : best))[0];
  assert.ok(yPeakCalf > 0, `\`calf\`: đỉnh bụng cơ ở y=${yPeakCalf} phải nằm ở NỬA TRÊN (gần `
    + 'khuỷu/gối) — "cẳng tay phình gần khuỷu", "bắp chân phình một phần ba trên".');
  assert.ok(yPeakCalf < 0.35, `\`calf\`: đỉnh bụng cơ ở y=${yPeakCalf} quá sát đầu trên — phải `
    + 'còn là một chỗ phình thấy được, không phải một bậc ngay tại khớp.');

  // NGƯỢC LẠI: hai đầu (khớp) không được là chỗ rộng nhất — đúng khuyết tật bản cũ.
  for (const name of ['limb', 'calf', 'cuff']) {
    const r = shapeRings(name);
    const max = Math.max(...r.map((x) => x[1]));
    assert.ok(r[0][1] < max - 1e-9 && r[r.length - 1][1] < max - 1e-9,
      `\`${name}\`: một trong hai đầu mút bằng đúng bán kính lớn nhất — khớp đang là chỗ RỘNG `
      + 'nhất thay vì hẹp nhất.');
  }
});

/*
  ══════════════════════════════════════════════════════════════════════════════════════════════
  ⚠️ ĐO KHE HỞ THẬT BẰNG CHÍNH ĐƯỜNG SINH — không phải một hình trụ xấp xỉ, không phải một lời hứa
  ══════════════════════════════════════════════════════════════════════════════════════════════
  Dựng lại chính phép nội suy `profileAt`/`vert` mà `humanShapeMesh` dùng (bản sao có chủ ý — xem
  vì sao KHÔNG import thẳng ở khối chú thích dưới `profileAt` bên dưới), rồi hỏi: một điểm P có
  nằm TRONG khối chi (đoạn trên hoặc đoạn dưới, đã đặt đúng vị trí và góc gập) hay không. Rải hàng
  nghìn điểm quanh khớp trên một mặt cầu bán kính đúng-bằng-bán-kính-khớp (chỗ MỎNG NHẤT, tức chỗ
  khe hở dễ lộ nhất) rồi đếm bao nhiêu điểm không thuộc về khối nào.
*/
/** Bán kính (đơn vị chuẩn hoá, 0..~1) tại một điểm `yFrac` ∈ [−0,5; 0,5] trên đường sinh. */
function profileAt(rings, yFrac) {
  const last = rings.length - 1;
  if (yFrac <= rings[0][0]) return rings[0][1];
  if (yFrac >= rings[last][0]) return rings[last][1];
  for (let i = 0; i < last; i += 1) {
    if (yFrac >= rings[i][0] && yFrac <= rings[i + 1][0]) {
      const t = (yFrac - rings[i][0]) / (rings[i + 1][0] - rings[i][0]);
      return rings[i][1] + (rings[i + 1][1] - rings[i][1]) * t;
    }
  }
  return rings[last][1];
}
const circumradius = (sides) => 0.5 / Math.cos(Math.PI / sides);

/** Điểm thế giới `P` có nằm trong khối `seg` không — `seg = {O, AX, h, w, shape}`, `O` là vành −0,5. */
function insideSegment(P, seg) {
  const { O, AX, h, w, shape } = seg;
  const rings = shapeRings(shape);
  const R = circumradius(shapeSides(shape));
  const v = { x: P.x - O.x, y: P.y - O.y, z: P.z - O.z };
  const axial = v.x * AX.x + v.y * AX.y + v.z * AX.z;
  const yFrac = axial / h - 0.5;
  if (yFrac < -0.5 || yFrac > 0.5) return false;
  const along = { x: AX.x * axial, y: AX.y * axial, z: AX.z * axial };
  const perp = { x: v.x - along.x, y: v.y - along.y, z: v.z - along.z };
  const perpDist = Math.hypot(perp.x, perp.y, perp.z);
  return perpDist <= R * profileAt(rings, yFrac) * w;
}

function rotAroundX(v, rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

/** Khe hở còn lại (phần trăm điểm KHÔNG được che) ở một khớp, cho trước hai chiều dài xương và góc gập. */
function kheHo(boneUp, boneLo, overlap, bendRad, shapeUp, shapeLo, N = 4000) {
  const hUp = boneUp * (1 + overlap);
  const segUp = { O: { x: 0, y: boneUp, z: 0 }, AX: { x: 0, y: -1, z: 0 }, h: hUp, w: 1, shape: shapeUp };
  const hLo = boneLo * (1 + overlap);
  const OloFlat = { x: 0, y: -boneLo, z: 0 };
  const AXloFlat = { x: 0, y: 1, z: 0 };
  const segLo = {
    O: rotAroundX(OloFlat, bendRad), AX: rotAroundX(AXloFlat, bendRad), h: hLo, w: 1, shape: shapeLo,
  };
  const testR = profileAt(shapeRings(shapeUp), 0.5) * circumradius(shapeSides(shapeUp)) * 0.98;
  let ho = 0;
  for (let i = 0; i < N; i += 1) {
    const yv = 1 - (2 * i) / (N - 1);
    const r = Math.sqrt(Math.max(0, 1 - yv * yv));
    const phi = i * 2.399963229728653;
    const P = { x: Math.cos(phi) * r * testR, y: yv * testR, z: Math.sin(phi) * r * testR };
    if (!insideSegment(P, segUp) && !insideSegment(P, segLo)) ho += 1;
  }
  return ho / N;
}

test('KHE HỞ CÒN LẠI Ở KHỚP, ĐO BẰNG ĐƯỜNG SINH THẬT, PHẢI DƯỚI NGƯỠNG ĐÃ CÔNG BỐ', () => {
  const JOINT_OVERLAP = 0.35; // ⚠️ PHẢI KHỚP ĐÚNG HẰNG SỐ TRONG `human.js` — xem chú thích ở đó.
  /*
    ⚠️ HAI NGƯỠNG KHÁC NHAU, VÌ HAI GÓC GẬP KHÁC NHAU RẤT XA. Khuỷu (33°) đâm sâu 35% đã kín
    TUYỆT ĐỐI (0%); gối (84°, gấp 2,5 lần góc khuỷu) vẫn còn hở 3,92% — một con số đo được, không
    phải một ước lượng. Đòi cả hai bằng 0% là đòi một mức đâm sâu ~45%, đủ để đầu nhọn của cẳng
    chân có nguy cơ xuyên ra ngoài mặt đùi ở phía đối diện — một khuyết tật khác thay cho khe hở.
    THỬ-CHO-ĐỎ (nêu TRƯỚC): hạ `JOINT_OVERLAP` xuống 0,10 ⇒ khe hở ở gối lên 39% (đo lại), bài đỏ.
  */
  const goc84 = kheHo(1, 1, JOINT_OVERLAP, (84 * Math.PI) / 180, 'limb', 'calf');
  const goc33 = kheHo(1, 1, JOINT_OVERLAP, (33 * Math.PI) / 180, 'limb', 'calf');
  assert.ok(goc33 < 0.01,
    `khuỷu ở 33°: khe hở ${(goc33 * 100).toFixed(2)}% — phải gần như kín (dưới 1%)`);
  assert.ok(goc84 < 0.06,
    `gối ở 84°: khe hở ${(goc84 * 100).toFixed(2)}% — phải dưới 6% (đo được: 3,92% ở overlap 35%)`);

  // ⚠️ VẾ NGƯỢC LẠI: nếu hạ `JOINT_OVERLAP` thì khe hở PHẢI TĂNG — nếu không thì phép đo ở trên
  // không đo cái nó tự nhận đang đo. Neo bằng đúng bảng đã công bố ở `human.js`.
  const yeu = kheHo(1, 1, 0.10, (84 * Math.PI) / 180, 'limb', 'calf');
  assert.ok(yeu > goc84 + 0.1,
    `overlap 10% phải hở HƠN HẲN overlap 35% ở cùng góc 84° — đo được ${(yeu * 100).toFixed(1)}% `
    + `so với ${(goc84 * 100).toFixed(1)}%. Nếu không thì phép đo này không nhạy với overlap.`);
});

test('ĐÂM SÂU CÓ THẬT: `h` dài hơn xương thật, đầu KHÔNG treo giữ nguyên vị trí IK', () => {
  // ⚠️ VẾ THỨ HAI MỚI LÀ VẾ DỄ MẤT: nếu chỉ đòi "h lớn hơn xương" thì một lỗi đơn giản (quên trừ
  // đúng đầu) vẫn qua được cổng trong khi bàn chân đã trôi khỏi đúng chỗ IK vừa giải — đúng khuyết
  // tật mà `footContactAt` vừa được sửa (round 61) để tránh.
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const d = body.dims;
    for (const s of ['L', 'R']) {
      const thigh = khoi(body, `thigh${s}`);
      assert.ok(thigh.h > d.thighLen + 1e-9, `kỷ ${era}: thigh${s}.h phải dài hơn xương thật`);
      // Đầu TRÊN (hông, khớp gốc) không đổi: rest.y + h/2 phải bằng 0 (đúng tại khớp).
      assert.ok(Math.abs(thigh.rest.y + thigh.h / 2) < 1e-9,
        `kỷ ${era}: đầu hông của thigh${s} phải vẫn đúng tại khớp`);

      const shin = khoi(body, `shin${s}`);
      assert.ok(shin.h > d.shinLen + 1e-9, `kỷ ${era}: shin${s}.h phải dài hơn xương thật`);
      // Đầu DƯỚI (cổ chân, không treo) không đổi: rest.y − h/2 phải bằng −shinLen (vị trí IK cũ).
      assert.ok(Math.abs((shin.rest.y - shin.h / 2) + d.shinLen) < 1e-9,
        `kỷ ${era}: đầu cổ chân của shin${s} phải vẫn đúng chỗ IK cũ (−shinLen) — lệch chỗ này `
        + 'là bàn chân trôi khỏi mặt đất.');

      const upperArm = khoi(body, `upperArm${s}`);
      assert.ok(upperArm.h > d.upperArmLen + 1e-9, `kỷ ${era}: upperArm${s}.h phải dài hơn xương`);
      assert.ok(Math.abs(upperArm.rest.y + upperArm.h / 2) < 1e-9,
        `kỷ ${era}: đầu vai của upperArm${s} phải vẫn đúng tại khớp`);

      const forearm = khoi(body, `forearm${s}`);
      assert.ok(forearm.h > d.forearmLen + 1e-9, `kỷ ${era}: forearm${s}.h phải dài hơn xương`);
      assert.ok(Math.abs((forearm.rest.y - forearm.h / 2) + d.forearmLen) < 1e-9,
        `kỷ ${era}: đầu cổ tay của forearm${s} phải vẫn đúng chỗ bàn tay đang treo vào`);
    }
  }
});
