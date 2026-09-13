/**
 * humanStance.test.js — ROUND 58, VIỆC 8. *"Chân trụ · hông lệch · vai nghiêng NGƯỢC · đầu nghiêng
 * · một tay co… và nó phải là hàm của danh tính cư dân."* (Đàm)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { poseAt } from './humanPose.js';
import { buildResidentRoute } from './residents.js';
import {
  STANCE_ELBOW, STANCE_HEAD, STANCE_HIP, STANCE_SHOULDER, stanceOf,
} from './humanStance.js';

const MAU = Array.from({ length: 400 }, (_, i) => i / 400);

test('TẤT ĐỊNH: cùng danh tính thì cùng dáng, và không có một hạt ngẫu nhiên nào', () => {
  for (const d of MAU.slice(0, 40)) {
    assert.deepEqual(stanceOf(d), stanceOf(d), `danh tính ${d} cho hai dáng khác nhau`);
  }
  // Danh tính hỏng (undefined / NaN / ngoài khoảng) không được ném lỗi và không được cho ra `NaN`:
  // dữ liệu đám mây có thể hỏng, và một ngoại lệ ở đây làm sập cả màn hình Thành Phố.
  for (const xau of [undefined, null, NaN, Infinity, -0.3, 7.25]) {
    const d = stanceOf(xau);
    for (const [k, v] of Object.entries(d)) {
      assert.ok(Number.isFinite(v), `danh tính ${String(xau)} cho \`${k}\` = ${v}`);
    }
  }
});

test('VAI NGHIÊNG NGƯỢC CHIỀU HÔNG — dấu trừ ấy là cả cái luật', () => {
  /*
    ⚠️ ĐÂY LÀ BÀI CÓ RĂNG NHẤT FILE, và nó canh đúng MỘT KÝ TỰ. Đứng dồn trọng tâm vào một chân thì
    đai hông nghiêng về phía chân KHÔNG chịu lực, còn cột sống phải bù lại bằng một đường cong ngược
    để cái đầu còn ở trên trục. Vai nghiêng CÙNG chiều hông thì người ấy đang ĐỔ, không đang đứng —
    và ở biên độ 3° thì mắt không gọi tên được cái sai, nó chỉ thấy "trông kỳ kỳ". Loại lỗi ấy sống
    sót qua mọi lần soi ảnh; chỉ một bài test mới bắt được.
  */
  for (const d of MAU) {
    const s = stanceOf(d);
    assert.ok(s.hong * s.vai < 0,
      `danh tính ${d}: hông ${s.hong.toFixed(4)} và vai ${s.vai.toFixed(4)} CÙNG dấu`);
    assert.equal(Math.sign(s.hong), s.ben, `danh tính ${d}: hông không nghiêng về bên chân trụ`);
  }
});

test('BIÊN ĐỘ ĐÚNG BẬC NGƯỜI THẬT — không kỷ nào lệch quá contrapposto', () => {
  // ⚠️ Cả `hairTop` (vòng 52) lẫn `browRidge` (vòng 58) đều hỏng vì CÙNG một kiểu sai: một đặc điểm
  // giải phẫu đúng hướng nhưng gấp ba biên độ thật. Nên biên độ ở đây được khoá, không chỉ hướng.
  for (const d of MAU) {
    const s = stanceOf(d);
    assert.ok(Math.abs(s.hong) <= STANCE_HIP + 1e-12, `hông ${s.hong} vượt ${STANCE_HIP}`);
    assert.ok(Math.abs(s.vai) <= STANCE_SHOULDER + 1e-12, `vai ${s.vai} vượt ${STANCE_SHOULDER}`);
    assert.ok(Math.abs(s.dau) <= STANCE_HEAD + 1e-12, `đầu ${s.dau} vượt ${STANCE_HEAD}`);
    assert.ok(s.tayCo >= 0 && s.tayCo <= STANCE_ELBOW + 1e-12, `tay co ${s.tayCo}`);
  }
  // 0,055 rad = 3,2°. Trên 0,12 rad (7°) thì một đám đông đọc ra là đang nghiêng ngả.
  assert.ok(STANCE_HIP < 0.12 && STANCE_SHOULDER < 0.12 && STANCE_HEAD < 0.12);
});

test('MỖI NGƯỜI MỘT KIỂU: năm trục độc lập nhau, hai bên chân trụ cân nhau', () => {
  /*
    ⚠️ VẾ "ĐỘC LẬP" MỚI LÀ VẾ ĐÁNG TIỀN. Nếu cả năm đại lượng cùng suy từ `danhTinh` theo một hàm
    đơn điệu thì ai nghiêng hông nhiều sẽ ĐỒNG THỜI co tay nhiều, và một đám 28 người đọc ra là
    HAI KIỂU người chứ không phải nhiều người — tức tốn hết chi phí của Việc 8 mà không mua được
    thứ nó định mua. Đo bằng tương quan Pearson trên 400 mẫu.
  */
  /*
    ⚠️ SO **ĐỘ LỚN**, KHÔNG SO GIÁ TRỊ CÓ DẤU — VÀ MỘT THỬ-CHO-ĐỎ KHÔNG ĐỎ ĐÃ DẠY ĐIỀU NÀY.
    Bản đầu tương quan thẳng `hong` với `tayCo`. Tôi cho `tayCo` dùng CHUNG hạt muối với `hong`
    (0,37) — tức ép hai trục dính chặt vào nhau, đúng cái bài này tuyên bố sẽ bắt — và bài vẫn
    XANH. Lý do: `hong = ben × …` mà `ben` là ±1 độc lập, nên cái dấu ngẫu nhiên ấy xoá sạch mọi
    tương quan TUYẾN TÍNH dù hai độ lớn giống hệt nhau. Phép đo đang bị chính một trục khác che mắt.
    ⇒ Lấy `Math.abs`: `ben` bị loại khỏi phép so, và cái dính nhau thật thì hiện ra.
  */
  const hong = MAU.map((d) => Math.abs(stanceOf(d).hong));
  const tay = MAU.map((d) => stanceOf(d).tayCo);
  const dau = MAU.map((d) => Math.abs(stanceOf(d).dau));
  const tuongQuan = (a, b) => {
    const ma = a.reduce((s, v) => s + v, 0) / a.length;
    const mb = b.reduce((s, v) => s + v, 0) / b.length;
    let tu = 0;
    let sa = 0;
    let sb = 0;
    for (let i = 0; i < a.length; i += 1) {
      tu += (a[i] - ma) * (b[i] - mb);
      sa += (a[i] - ma) ** 2;
      sb += (b[i] - mb) ** 2;
    }
    return tu / Math.sqrt(sa * sb);
  };
  for (const [ten, r] of [['hông↔tay', tuongQuan(hong, tay)], ['hông↔đầu', tuongQuan(hong, dau)]]) {
    assert.ok(Math.abs(r) < 0.35,
      `${ten}: tương quan ${r.toFixed(3)} — hai trục đang dính nhau, tức đám đông chỉ có vài kiểu`);
  }

  // Hai bên chân trụ phải xấp xỉ cân: lệch hẳn một bên thì cả phố đứng chống một chân giống nhau.
  const trai = MAU.filter((d) => stanceOf(d).ben < 0).length;
  assert.ok(trai > MAU.length * 0.35 && trai < MAU.length * 0.65,
    `${trai}/${MAU.length} người trụ chân trái — lệch quá thì cả phố đứng một kiểu`);
});

test('CHÂN ĐỨNG YÊN: dáng lệch KHÔNG được kéo bàn chân trượt trên mặt đất', () => {
  /*
    ⚠️ ĐÂY LÀ LÝ DO ĐỘ LỆCH ĐƯỢC CỘNG **SAU** BÀI TOÁN ĐỘNG HỌC NGƯỢC, và bài test này là thứ giữ
    cho ai đó khỏi "dọn dẹp" bằng cách cộng nó vào trước. Cộng trước thì đai hông nghiêng sẽ kéo
    theo chỗ treo chân, `solveTwoBone` phải bù, và bàn chân trượt — đúng thứ ADR-057 sinh ra để xoá.
  */
  for (let era = 1; era <= 15; era += 1) {
    const body = buildHumanBody(era);
    for (const d of [0.07, 0.41, 0.83]) {
      const khong = poseAt(body, 1.3);
      const co = poseAt(body, 1.3, stanceOf(d));
      for (const khop of ['kneeL', 'kneeR', 'hipL', 'hipR']) {
        for (const truc of ['x', 'y', 'z']) {
          assert.ok(Math.abs(khong.joints[khop][truc] - co.joints[khop][truc]) < 1e-12,
            `kỷ ${era}, danh tính ${d}: dáng lệch đã dời \`${khop}\`.${truc}`
            + ` (${khong.joints[khop][truc]} → ${co.joints[khop][truc]}) ⇒ bàn chân sẽ trượt.`);
        }
      }
    }
  }
});

test('KHÔNG TRUYỀN DÁNG THÌ RA ĐÚNG TƯ THẾ CŨ — bit-for-bit', () => {
  // `scripts/human-scale.mjs` và một loạt bài cũ gọi `poseAt` HAI tham số. Một sai lệch âm thầm ở
  // đó sẽ đọc thành "hình học trôi" ở tận đâu, nên hợp đồng này được khoá tuyệt đối.
  for (let era = 1; era <= 15; era += 1) {
    const body = buildHumanBody(era);
    assert.deepEqual(poseAt(body, 2.1), poseAt(body, 2.1, null),
      `kỷ ${era}: \`poseAt\` hai tham số không còn bằng ba tham số với \`null\``);
  }
});

test('CƯ DÂN THẬT MANG DANH TÍNH RIÊNG, VÀ NÓ KHÔNG ĐỔI THEO THỜI GIAN', () => {
  // Một mạng đường giả, đủ để `buildResidentRoute` dựng được tuyến — bài này hỏi về DANH TÍNH,
  // không hỏi về hình mạng đường, nên dùng đầu vào nhỏ nhất còn có nghĩa.
  const o = [];
  for (let x = 0; x < 6; x += 1) o.push({ x, y: 0 }, { x: 5, y: x }, { x: 5 - x, y: 5 }, { x: 0, y: 5 - x });
  const ds = [];
  for (let i = 0; i < 12; i += 1) {
    const r = buildResidentRoute(i, o, 0.4, 1);
    if (r) ds.push(r);
  }
  assert.ok(ds.length >= 4, `chỉ dựng được ${ds.length} cư dân — bài này đang đo một đám trống`);
  const ten = new Set();
  for (const r of ds) {
    assert.ok(Number.isFinite(r.danhTinh) && r.danhTinh >= 0 && r.danhTinh < 1,
      `cư dân có danh tính ${r.danhTinh} — phải là số thực [0,1)`);
    ten.add(r.danhTinh.toFixed(6));
  }
  assert.ok(ten.size >= Math.ceil(ds.length * 0.8),
    `${ds.length} cư dân mà chỉ ${ten.size} danh tính khác nhau — hạt giống đang bị dùng lại`);
  // ⚠️ VÀ VẾ NÀY LÀ VẾ CHỐNG MỘT LỖI CỤ THỂ: danh tính phải KHÁC `phase`, nếu không dáng đứng bị
  // buộc chặt vào chỗ xuất phát và cả đoàn hiện ra một quy luật thấy được (xem `residents.js`).
  const trung = ds.filter((r) => Math.abs(r.danhTinh - r.phase) < 1e-9).length;
  assert.equal(trung, 0, `${trung} cư dân có danh tính TRÙNG pha — hai đại lượng phải độc lập`);
});

test('NĂM ĐỘ LỆCH PHẢI TỚI ĐƯỢC CÁI KHỚP — không trục nào được rơi im lặng dọc đường', () => {
  /*
    ⚠️ BÀI NÀY SINH RA VÌ MỘT THỬ-CHO-ĐỎ KHÔNG ĐỎ: tôi xoá `+ lechDau` khỏi góc `b` của khớp `head`
    trong `humanPose.js` — tức TẮT HẲN cái đầu nghiêng, một trong năm thứ Đàm đặt hàng — và cả bộ
    test vẫn xanh. `stanceOf` vẫn trả về `dau` đúng, `humanStance.test.js` vẫn đo được nó; chỉ có
    điều không ai hỏi xem nó có ĐẾN NƠI không. Một đại lượng tính đúng rồi bị bỏ rơi ở tầng sau là
    đúng họ lỗi "mũ trụ mang màu vải" của vòng 49→56, sống sót bảy vòng.
    ⇒ Đo ở đầu ra: đổi ĐÚNG MỘT trường của dáng, rồi đòi tư thế phải khác đi. Một trục bị bỏ rơi
    thì tư thế không đổi và bài này đỏ.
  */
  const body = buildHumanBody(5);
  const goc = { ben: 1, hong: 0, vai: 0, dau: 0, tayCo: 0 };
  const chuan = poseAt(body, 1.7, goc);
  const TRUC = [
    ['hong', 0.05, ['pelvis', 'torso', 'head']],
    ['vai', 0.04, ['torso', 'head']],
    ['dau', 0.03, ['head']],
    ['tayCo', 0.25, ['elbowL']],
  ];
  for (const [ten, gia, khops] of TRUC) {
    const pose = poseAt(body, 1.7, { ...goc, [ten]: gia });
    const doi = khops.some((k) => Math.abs(pose.joints[k].a - chuan.joints[k].a) > 1e-9
      || Math.abs(pose.joints[k].b - chuan.joints[k].b) > 1e-9);
    assert.ok(doi,
      `đổi \`${ten}\` thành ${gia} mà ${khops.join('/')} không nhúc nhích — trục này đang được`
      + ' tính ra rồi bỏ rơi trước khi tới khớp. Xem `poseAt` ở `humanPose.js`.');
  }

  // Và vế NGƯỢC, vế giữ cho bài trên khỏi xanh vì "mọi thứ đều đổi": `tayCo` bên phải KHÔNG được
  // động vào khi `ben > 0` — một tay co, không phải hai.
  const coTay = poseAt(body, 1.7, { ...goc, tayCo: 0.25 });
  assert.ok(Math.abs(coTay.joints.elbowR.a - chuan.joints.elbowR.a) < 1e-12,
    'cả HAI khuỷu cùng co — đó là tư thế thủ, không phải dáng lệch trọng tâm');
});
