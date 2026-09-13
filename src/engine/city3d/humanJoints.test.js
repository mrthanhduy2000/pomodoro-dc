/**
 * humanJoints.test.js — ROUND 58, VIỆC 2. *"Quả cầu ở khớp phải KHÔNG TO HƠN đoạn dày nhất nó nối,
 * và phải LÚN VÀO."* (Đàm)
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * PHÉP ĐO ĐÀM YÊU CẦU, VÀ KẾT QUẢ MẠNH HƠN CÂU HỎI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm viết: *"lấy góc xoay lớn nhất `humanGait` sinh ra, tính bán kính cầu nhỏ nhất còn lấp kín khe
 * ở góc ấy — rồi dùng đúng con số đó, không lớn hơn."*
 *
 * Đo góc trước (bài 1 dưới đây tự đo lại, không tin một hằng số cũ): trên 15 kỷ × một chu kỳ trọn
 * vẹn, góc gập lớn nhất là **đầu gối ≈ 84°**, khuỷu ≈ 33°, vai ≈ 27°.
 *
 * Rồi đến chỗ bất ngờ: **bán kính nhỏ nhất còn lấp kín KHÔNG PHỤ THUỘC GÓC.** Vành mút của một đoạn
 * chi là một đường tròn TÂM ĐÚNG TẠI KHỚP, nên mọi điểm của nó cách khớp đúng bằng bán kính vành —
 * và một phép xoay quanh khớp thì bảo toàn khoảng cách tới khớp. Vậy quả cầu tâm tại khớp bán kính
 * `R` phủ kín cả hai vành khi và chỉ khi `R ≥ max(hai bán kính vành)`, ở MỌI góc, kể cả 84°.
 * ⇒ Con số phải dùng là `max(hai bán kính vành)`, và 84° không làm nó lớn thêm một chút nào.
 *
 * ⚠️ VÌ THẾ BÀI 4 KHÔNG ĐI KIỂM LẠI MỘT ĐẲNG THỨC ĐẠI SỐ (nó sẽ là một phép đo hiển nhiên đúng, tức
 * một bài test không bao giờ đỏ). Nó kiểm cái vế DỄ MẤT của lập luận trên: rằng quả cầu THẬT SỰ có
 * tâm tại khớp trong tư thế thật. Dịch quả cầu đi một chút — một dòng `rest` khác 0 — là toàn bộ
 * chứng minh sụp, và không có bài test nào khác trong dự án nhận ra.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { ELBOW_GAIN, partCenterAt, poseAt, rotateByJoint } from './humanPose.js';
import { getHumanStyle } from './humanStyle.js';
import { shapeEndRadius, shapeMaxRadius } from './humanShape.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoi = (body, id) => body.parts.find((p) => p.id === id);
const deg = (r) => (r * 180) / Math.PI;

/** Hướng của đoạn chi treo từ một khớp — dùng ĐÚNG hàm bộ dựng hình dùng, không tự suy lại. */
const dirOf = (j) => rotateByJoint(j.a, j.b ?? 0, { x: 0, y: -1, z: 0 });
const gocGiua = (u, v) => Math.acos(Math.max(-1, Math.min(1,
  (u.x * v.x + u.y * v.y + u.z * v.z) / Math.hypot(u.x, u.y, u.z) / Math.hypot(v.x, v.y, v.z))));

/*
  ⚠️ HAI HÀM DƯỚI ĐÂY ĐÃ SAI MỘT LẦN, VÀ CÁI SAI LÀ CỦA PHÉP ĐO CHỨ KHÔNG PHẢI CỦA MÃ — lần thứ 30
  của bài học *"nghi cái THƯỚC trước khi nghi cái máy"* (`CLAUDE.md`, luật 1). Bản đầu lấy vành
  TRÊN cho mọi khối, nên ở khuỷu nó đo vành trên của CÁNH TAY TRÊN (0,4406 — chỗ gắn vào vai) thay
  vì vành dưới (0,3505 — chỗ gắn vào khuỷu), rồi báo `elbowBall` "nhỏ hơn cần 12%". Mã đang đúng.

  Một cái khớp có HAI khối gặp nó theo hai kiểu khác nhau, và đó là chỗ dễ lẫn:
    · khối TREO TỪ khớp ấy (`part.joint === khớp`)      → gặp khớp bằng vành GẦN
    · khối treo từ khớp TRÊN, mút xa của nó rơi xuống đây → gặp khớp bằng vành XA
*/
/** Chiều vành: `rest.y < 0` là khối treo DƯỚI khớp của nó ⇒ vành gần là TRÊN (+1), xa là DƯỚI (−1). */
const chieuMut = (part, gan) => ((part.rest.y < 0) === gan ? 1 : -1);
const banKinhMut = (part, gan) => shapeEndRadius(part.shape, chieuMut(part, gan)) * part.w;
/** `y` cục bộ của vành ấy, so với khớp mà khối đang treo. */
const yMutCua = (part, gan) => part.rest.y + (chieuMut(part, gan) * part.h) / 2;

/** Ba cặp khớp: [tên cầu, khối treo ở khớp ấy, khối phía trên gặp khớp ấy] — `null` = lồng ngực. */
const CAP = (s) => [
  [`shoulderBall${s}`, `upperArm${s}`, null],
  [`elbowBall${s}`, `forearm${s}`, `upperArm${s}`],
  [`kneeBall${s}`, `shin${s}`, `thigh${s}`],
];

test('GÓC GẬP LỚN NHẤT `humanGait` SINH RA — đo lại, không tin hằng số', () => {
  const to = { khuyu: 0, goi: 0, vai: 0 };
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    let khuyuMin = Infinity;
    let khuyuMax = 0;
    /*
      ⚠️ QUÉT ĐÚNG MỘT SỐ NGUYÊN LẦN CHU KỲ CỦA CHÍNH KỶ ẤY — không phải một bước cố định.
      Bản đầu lấy `i * 0,012` cho mọi kỷ, và biên độ đo được lệch tới 1e-3 tương đối ⇒ tôi đã định
      nới sai số lên 1%. Sai: `cycle` khác nhau ở từng kỷ, nên một bước cố định cắt ngang chu kỳ và
      bỏ lỡ chính cái đỉnh. Quét theo `cycle` thì quan hệ khớp tới **1e-14** — tức chỗ hỏng là PHÉP
      LẤY MẪU, không phải mô hình, và nới sai số sẽ là che đúng thứ cần thấy (`CLAUDE.md`, luật 1).
    */
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

    /*
      ⚠️ VẾ NÀY ĐƯỢC THÊM VÌ MỘT THỬ-CHO-ĐỎ KHÔNG ĐỎ, VÀ ĐÓ LÀ MỘT PHÁT HIỆN CHỨ KHÔNG PHẢI MỘT
      PHIỀN TOÁI. Bản đầu của bài này chỉ đòi `khuỷu > 0`. Đặt `swing = 0` trong `humanPose.js` —
      tức TẮT HẲN nhịp vung tay — mà bài vẫn XANH, vì `ELBOW_REST_RAD = 0,16` là một độ gập SẴN,
      luôn dương, không liên quan gì tới dáng đi. Một bài test xanh khi nhịp đi đã chết thì nó
      không canh nhịp đi.
      ⇒ Đòi đúng thứ nó định nói: BIÊN ĐỘ (max − min), và biên độ ấy đo được bằng **đúng**
      `ELBOW_GAIN × armSwing` ở cả 15 kỷ (tỉ lệ 1,000 — tay không bị hãm luôn đạt trọn biên).
      Một quan hệ chính xác thì gác được cả hai đầu: tắt nhịp đi, hoặc bỏ qua `ELBOW_GAIN`.
    */
    const bienDo = khuyuMax - khuyuMin;
    const can = ELBOW_GAIN * getHumanStyle(era).armSwing;
    assert.ok(Math.abs(bienDo - can) < can * 1e-9,
      `kỷ ${era}: khuỷu chỉ đổi ${deg(bienDo).toFixed(2)}° qua cả chu kỳ, mà \`armSwing\` của kỷ ấy`
      + ` đòi ${deg(can).toFixed(2)}°. Nhịp vung tay đang không tới được khuỷu.`);
  }
  // Viết thành QUAN HỆ, không thành ba con số tuyệt đối: một hằng số không diễn đạt được một luật
  // về một quan hệ (`CLAUDE.md`, luật 2). Đầu gối phải là khớp gập mạnh nhất — nó gánh cả pha đưa
  // chân — và không khớp nào được vượt 100°, vì quá đó thì `solveTwoBone` đang bị đòi một tư thế
  // không phải đi bộ (ngồi, quỳ) và cả bài này phải được viết lại.
  assert.ok(to.goi > to.khuyu && to.khuyu > 0,
    `đầu gối ${deg(to.goi).toFixed(1)}° phải gập mạnh hơn khuỷu ${deg(to.khuyu).toFixed(1)}°`);
  assert.ok(to.goi > Math.PI / 3, `đầu gối chỉ gập ${deg(to.goi).toFixed(1)}° — dưới 60° thì đó là`
    + ' một cái chân trượt trên mặt đất, không phải một bước đi');
  for (const [ten, g] of Object.entries(to)) {
    assert.ok(g < (Math.PI * 100) / 180,
      `${ten} gập ${deg(g).toFixed(1)}° — vượt 100° thì tư thế ấy không còn là đi bộ`);
  }
});

test('QUẢ CẦU KHỚP = ĐÚNG `max(hai bán kính vành)`, KHÔNG LỚN HƠN MỘT CHÚT NÀO', () => {
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    for (const s of ['L', 'R']) {
      for (const [idCau, idDuoi, idTren] of CAP(s)) {
        const cau = khoi(body, idCau);
        const duoi = khoi(body, idDuoi);
        assert.ok(cau && duoi, `kỷ ${era}: thiếu \`${idCau}\` hoặc \`${idDuoi}\``);
        const tren = idTren ? khoi(body, idTren) : null;
        if (idTren) assert.ok(tren, `kỷ ${era}: thiếu \`${idTren}\``);

        const can = Math.max(banKinhMut(duoi, true), tren ? banKinhMut(tren, false) : 0);
        const co = shapeMaxRadius(cau.shape) * cau.w;
        assert.ok(Math.abs(co - can) < 1e-9,
          `kỷ ${era} \`${idCau}\`: bán kính ${co.toFixed(5)} mà vành lớn nhất nó phải phủ là`
          + ` ${can.toFixed(5)}. To hơn = một cái đốt xương lồi ra (đúng "sáu đinh tán" của vòng 54);`
          + ' nhỏ hơn = một khe hở ở khớp. Con số phải bằng, không phải "đủ an toàn".');
      }
    }
  }
  // ⚠️ ĐỎ KHI BỎ GÌ: nhân bán kính `elbowBall` với 1,15 trong `human.js` → đỏ ở cả 15 kỷ. Đã thử.
});

test('KHÔNG TO HƠN ĐOẠN DÀY NHẤT NÓ NỐI — lời hứa Đàm viết thành một phép so', () => {
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    for (const s of ['L', 'R']) {
      for (const [idCau, idDuoi, idTren] of CAP(s)) {
        const cau = khoi(body, idCau);
        const day = Math.max(
          shapeMaxRadius(khoi(body, idDuoi).shape) * khoi(body, idDuoi).w,
          idTren ? shapeMaxRadius(khoi(body, idTren).shape) * khoi(body, idTren).w : 0,
        );
        const co = shapeMaxRadius(cau.shape) * cau.w;
        assert.ok(co <= day + 1e-9,
          `kỷ ${era} \`${idCau}\`: bán kính ${co.toFixed(5)} > chỗ dày nhất của chi ${day.toFixed(5)}`
          + ' — quả cầu phải LÚN VÀO chi, không được phình ra khỏi nó');
      }
    }
  }
});

test('QUẢ CẦU CÓ TÂM ĐÚNG TẠI KHỚP — vế dễ mất nhất của cả chứng minh', () => {
  /*
    ⚠️ ĐÂY LÀ BÀI CÓ RĂNG, VÀ NÓ KIỂM MỘT THỨ KHÔNG BÀI NÀO KHÁC KIỂM. Toàn bộ lập luận
    "bán kính không phụ thuộc góc" đứng trên MỘT giả thiết: tâm cầu trùng khớp. Lệch tâm thì phép
    xoay không còn bảo toàn khoảng cách tới tâm, và khe hở quay lại ở đúng những góc lớn — tức lỗi
    sẽ chỉ hiện trong ẢNH ĐANG BƯỚC, không hiện trong ảnh đứng yên. Đàm đã nói thẳng phải kiểm ở
    lúc tay vung mạnh nhất *"không phải một ảnh tĩnh"*.
  */
  const PHA = [0, 0.37, 0.73];   // ba khung của một dải bước — không phải một ảnh tĩnh
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    for (const t of PHA) {
      const pose = poseAt(body, t * 3.1);
      for (const s of ['L', 'R']) {
        for (const [idCau, idDuoi, idTren] of CAP(s)) {
          const cau = khoi(body, idCau);
          const tam = partCenterAt(cau, pose);
          const khop = pose.joints[cau.joint];
          const lech = Math.hypot(tam.x - khop.x, tam.y - khop.y, tam.z - khop.z);
          const R = shapeMaxRadius(cau.shape) * cau.w;
          assert.ok(lech < 1e-9,
            `kỷ ${era}, pha ${t}: tâm \`${idCau}\` lệch khớp ${lech.toFixed(6)} (bán kính ${R.toFixed(5)})`
            + ' — lệch tâm thì quả cầu không còn phủ nổi vành ở góc gập lớn, và khe hở chỉ hiện ra'
            + ' trong ảnh ĐANG BƯỚC. Trả `rest` của quả cầu về [0, 0, 0].');

          // Và vành mút thật, dựng bằng đúng phép xoay của bộ dựng hình, phải nằm TRONG quả cầu.
          for (const [idChi, gan] of [[idDuoi, true], [idTren, false]]) {
            if (!idChi) continue;
            const chi = khoi(body, idChi);
            const r = banKinhMut(chi, gan);
            const kj = pose.joints[chi.joint];
            const yMut = yMutCua(chi, gan);
            for (let k = 0; k < 24; k++) {
              const phi = (k / 24) * Math.PI * 2;
              const v = rotateByJoint(kj.a, kj.b ?? 0,
                { x: r * Math.cos(phi), y: yMut, z: r * Math.sin(phi) });
              const p = { x: kj.x + v.x, y: kj.y + v.y, z: kj.z + v.z };
              const cach = Math.hypot(p.x - tam.x, p.y - tam.y, p.z - tam.z);
              assert.ok(cach <= R + 1e-9,
                `kỷ ${era}, pha ${t}: một điểm vành của \`${idChi}\` cách tâm \`${idCau}\``
                + ` ${cach.toFixed(6)} > bán kính ${R.toFixed(6)} ⇒ hở khớp`);
            }
          }
        }
      }
    }
  }
  // ⚠️ ĐỎ KHI BỎ GÌ: đổi `rest` của quả cầu từ `[0, 0, 0]` thành `[0, d.limbW * 0.1, 0]` → đỏ.
  //    Và nhân bán kính cầu với 0,95 → vế "vành nằm trong cầu" đỏ. Cả hai đã thử.
});
