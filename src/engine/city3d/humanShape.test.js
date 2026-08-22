/**
 * humanShape.test.js — sáu… bảy cái khuôn của cơ thể, và những thứ chúng KHÔNG được phép làm.
 *
 * ⚠️ BÀI QUAN TRỌNG NHẤT FILE NÀY KHÔNG PHẢI BÀI ĐẾM TAM GIÁC, MÀ LÀ BÀI CHIỀU QUAY.
 * Phase 14 §1(1) đã mất 19,2% diện tích mặt đường vì ba đỉnh nằm ĐÚNG CHỖ mà xếp NGƯỢC CHIỀU:
 * `FrontSide` (mặc định của three) vứt tam giác quay lưng, nên một mặt có thể tồn tại hoàn hảo
 * trong dữ liệu mà không bao giờ hiện lên màn hình. Khuyết tật ấy **không có triệu chứng nào
 * khác** — không cảnh báo, không lệch số, không đỏ ở đâu cả.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody } from './human.js';
import { HUMAN_SHAPES, humanShapeMesh, isValidHumanShape, shapeTriangles } from './humanShape.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoa = (x, y, z) => `${x.toFixed(6)}|${y.toFixed(6)}|${z.toFixed(6)}`;

/** Ba đỉnh của tam giác thứ `t`. */
function tamGiac(mesh, t) {
  const o = t * 9;
  const p = mesh.positions;
  return [
    [p[o], p[o + 1], p[o + 2]],
    [p[o + 3], p[o + 4], p[o + 5]],
    [p[o + 6], p[o + 7], p[o + 8]],
  ];
}

test('MỌI KHUÔN NGỬA MẶT RA NGOÀI — kiểm bằng CHIỀU CẠNH và THỂ TÍCH CÓ DẤU', () => {
  // ⚠️ BẢN ĐẦU CỦA BÀI NÀY DÙNG MỘT PHÉP THỬ SAI, VÀ NÓ KÊU OAN NGAY KHUÔN ĐẦU TIÊN CÓ CHỖ LÕM.
  // Phép cũ hỏi *"pháp tuyến có cùng phía với vector từ GỐC tới trọng tâm mặt không"* — chỉ đúng
  // cho khối **hình sao đối với gốc**. Khuôn `hat` có một bậc thụt vào (mặt TRÊN của vành, ngửa
  // lên trời nhưng nằm DƯỚI gốc toạ độ) ⇒ 16/60 mặt bị tố oan, và tôi suýt đi sửa một hình học
  // hoàn toàn lành. Đúng luật đã cứu dự án hai mươi mấy lần: **kiểm CÔNG CỤ trước, kiểm mã sau.**
  //
  // Phép đúng gồm hai vế, và chúng bắt hai loại lỗi KHÁC NHAU — thiếu vế nào cũng lọt:
  //   (a) **CHIỀU CẠNH**: trong một mặt kín định hướng nhất quán, mỗi cạnh CÓ HƯỚNG `a→b` xuất
  //       hiện đúng MỘT lần (và `b→a` đúng một lần ở tam giác kề). Hai tam giác cãi nhau về chiều
  //       ⇒ có một cạnh có hướng đếm được 2. Vế này bắt được MỘT tam giác lật đơn lẻ.
  //   (b) **THỂ TÍCH CÓ DẤU** (định lý phân kỳ): Σ a·(b×c)/6 phải DƯƠNG. Vế (a) vẫn xanh nếu ai đó
  //       lật TOÀN BỘ khuôn (nhất quán theo hướng ngược); chỉ vế này bắt được — và một khuôn lộn
  //       trái thì tàng hình hoàn toàn.
  // THỬ-CHO-ĐỎ (đã chạy cả hai): đổi `pushTri(pos, nor, a, c, b)` thành `(a, b, c)` ở nhánh mặt
  // bên ⇒ vế (a) đỏ; đảo thứ tự ở MỌI lời `pushTri` ⇒ vế (a) xanh, vế (b) đỏ.
  for (const ten of HUMAN_SHAPES) {
    const mesh = humanShapeMesh(ten);
    const huong = new Map();
    let theTich = 0;
    for (let t = 0; t < mesh.triangles; t += 1) {
      const [a, b, c] = tamGiac(mesh, t);
      const v = [a, b, c].map((q) => khoa(q[0], q[1], q[2]));
      for (let i = 0; i < 3; i += 1) {
        const k = `${v[i]}→${v[(i + 1) % 3]}`;
        huong.set(k, (huong.get(k) ?? 0) + 1);
      }
      theTich += (a[0] * (b[1] * c[2] - b[2] * c[1])
        + a[1] * (b[2] * c[0] - b[0] * c[2])
        + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    }
    const cai = [...huong.entries()].filter(([, n]) => n !== 1);
    assert.equal(cai.length, 0,
      `khuôn "${ten}": ${cai.length} cạnh có hướng bị dùng hai lần (ví dụ ${cai[0]?.[0]}) — hai tam `
      + 'giác kề nhau đang cãi nhau về chiều quay, và mặt thua sẽ TÀNG HÌNH trên màn hình trong khi '
      + 'dữ liệu vẫn hợp lệ (đúng khuyết tật đã nuốt 19,2% mặt đường ở Phase 14 §1(1))');
    assert.ok(theTich > 0.02,
      `khuôn "${ten}" có thể tích ${theTich.toFixed(6)} — âm nghĩa là cả khuôn lộn trái (tàng hình `
      + 'hoàn toàn), gần 0 nghĩa là nó dẹt tới mức không còn là một khối');
  }
});

test('PHÁP TUYẾN PHẢI KHỚP THỨ TỰ ĐỈNH — không được khai một đằng dựng một nẻo', () => {
  // Bài trên canh THỨ TỰ ĐỈNH (thứ quyết định mặt nào bị `FrontSide` vứt đi). Bài này canh mảng
  // `normals` — thứ quyết định ĐỘ SÁNG. Hai đại lượng độc lập: một hình có thứ tự đỉnh hoàn hảo
  // vẫn có thể mang pháp tuyến ngược và render ra đen kịt dưới nắng.
  for (const ten of HUMAN_SHAPES) {
    const mesh = humanShapeMesh(ten);
    for (let t = 0; t < mesh.triangles; t += 1) {
      const [a, b, c] = tamGiac(mesh, t);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const d = Math.hypot(...n) || 1;
      const o = t * 9;
      const cham = (n[0] / d) * mesh.normals[o]
        + (n[1] / d) * mesh.normals[o + 1] + (n[2] / d) * mesh.normals[o + 2];
      assert.ok(cham > 0.999,
        `khuôn "${ten}" mặt ${t}: pháp tuyến khai lệch khỏi thứ tự đỉnh (cos = ${cham.toFixed(4)})`);
    }
  }
});

test('MỌI KHUÔN KÍN — mỗi cạnh dùng đúng hai lần', () => {
  // ⚠️ Đây là bài bắt được một cái NẮP BỊ QUÊN, thứ mà bài chiều quay ở trên hoàn toàn mù: bỏ nắp
  // đáy đi thì mọi mặt còn lại vẫn ngửa đúng hướng, số tam giác vẫn "hợp lý", và khối chỉ hở ra
  // khi camera liếc đúng góc. THỬ-CHO-ĐỎ: bỏ vòng `if (rings[0][1] > 0)` ⇒ 6 khuôn có nắp đáy đỏ.
  for (const ten of HUMAN_SHAPES) {
    const mesh = humanShapeMesh(ten);
    const canh = new Map();
    for (let t = 0; t < mesh.triangles; t += 1) {
      const v = tamGiac(mesh, t).map((q) => khoa(q[0], q[1], q[2]));
      for (let i = 0; i < 3; i += 1) {
        const k = [v[i], v[(i + 1) % 3]].sort().join('#');
        canh.set(k, (canh.get(k) ?? 0) + 1);
      }
    }
    const hong = [...canh.entries()].filter(([, n]) => n !== 2);
    assert.equal(hong.length, 0,
      `khuôn "${ten}" hở: ${hong.length} cạnh không được dùng đúng hai lần (ví dụ ${hong[0]?.[0]})`);
  }
});

test('MỌI KHUÔN NẰM GỌN TRONG HỘP ĐƠN VỊ THEO x VÀ z — và chạm ĐÚNG mép', () => {
  // ⚠️ ĐÂY LÀ BẤT BIẾN GIỮ CHO MỌI PHÉP ĐO HÌNH BÓNG CŨ CÒN ĐÚNG. `humanPose.partCornersAt` và
  // `silhouetteSpanX` tính từ TÁM ĐỈNH CỦA HỘP (±0,5); `human-scale.mjs` và `humanIdentity.test.js`
  // dựa vào đó. Nếu một khuôn hẹp hơn hộp thì mọi con số ấy nói quá; rộng hơn thì nói thiếu — và
  // cả hai kiểu đều IM LẶNG (đúng họ `TECH_DEBT #42`: assert con số đã KHAI thay vì con số đã DỰNG).
  // Chỉ side chia hết cho 4 mới giữ được bất biến này, nên đây cũng là cái gác cho việc chọn `sides`.
  for (const ten of HUMAN_SHAPES) {
    const mesh = humanShapeMesh(ten);
    for (const [truc, buoc] of [['x', 0], ['y', 1], ['z', 2]]) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = buoc; i < mesh.positions.length; i += 3) {
        lo = Math.min(lo, mesh.positions[i]);
        hi = Math.max(hi, mesh.positions[i]);
      }
      assert.ok(Math.abs(lo + 0.5) < 1e-9 && Math.abs(hi - 0.5) < 1e-9,
        `khuôn "${ten}" trục ${truc}: trải [${lo.toFixed(6)}, ${hi.toFixed(6)}], phải là đúng`
        + ' [−0,5, 0,5]. Số cạnh KHÔNG chia hết cho 4 sẽ phá bất biến này.');
    }
  }
});

test('`box` PHẢI LÀ HỘP ĐƠN VỊ CHÍNH XÁC — nó là một trường hợp của cùng công thức, không phải ngoại lệ', () => {
  // ⚠️ Nếu `box` phải viết riêng thì "một luật một công thức" đã gãy ngay ở khuôn đầu tiên: sẽ có
  // hai đường dựng hình song song và chúng sẽ trôi khỏi nhau. Bài này chứng minh `sides: 4` +
  // `twist` nửa cung cho ra ĐÚNG tám đỉnh của hộp cũ, không xê dịch một phần triệu nào.
  const mesh = humanShapeMesh('box');
  assert.equal(mesh.triangles, 12, 'hộp phải đúng 12 tam giác như `BoxGeometry(1,1,1)` cũ');
  const dinh = new Set();
  for (let i = 0; i < mesh.positions.length; i += 3) {
    dinh.add(khoa(mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]));
  }
  assert.equal(dinh.size, 8, `hộp phải có đúng 8 đỉnh phân biệt, thấy ${dinh.size}`);
  for (const k of dinh) {
    for (const v of k.split('|')) {
      assert.equal(Math.abs(Number(v)), 0.5, `đỉnh hộp lệch khỏi ±0,5: ${k}`);
    }
  }
});

test('SỐ TAM GIÁC ĐẾM TỪ MẢNG ĐÃ DỰNG, VÀ MỌI KHUÔN PHẢI KHÁC NHAU THẬT', () => {
  const bang = HUMAN_SHAPES.map((t) => [t, shapeTriangles(t)]);
  for (const [ten, n] of bang) {
    assert.equal(n, humanShapeMesh(ten).positions.length / 9,
      `khuôn "${ten}": \`shapeTriangles\` và mảng toạ độ đã trôi khỏi nhau`);
    assert.ok(n >= 12 && n <= 80, `khuôn "${ten}" có ${n} tam giác — ngoài dải hợp lý 12…80`);
  }
  // ⚠️ HAI KHUÔN TRÙNG ĐỈNH LÀ MỘT TRỤC CHẾT (bài học Phase 11). Nó không làm gì hỏng, nó chỉ tiêu
  // một lệnh vẽ để dựng lại một khối đã có — và không có gì đỏ lên.
  const vanTay = new Map();
  for (const ten of HUMAN_SHAPES) {
    const k = humanShapeMesh(ten).positions.map((v) => v.toFixed(5)).join(',');
    assert.ok(!vanTay.has(k), `khuôn "${ten}" trùng khít khuôn "${vanTay.get(k)}" — một trục chết`);
    vanTay.set(k, ten);
  }
  console.log(`[khuôn] ${bang.map(([t, n]) => `${t} ${n}`).join(' · ')} tam giác`);
});

test('MỌI KHUÔN PHẢI CÓ NGƯỜI DÙNG — không được có khuôn nằm không', () => {
  // ⚠️ Bảy khuôn mà chỉ năm cái được dùng thì hai cái kia là mã chết mang dáng một tính năng (bẫy
  // Phase 4H: `summarizeMuseum` chạy đúng, có test riêng, và chưa bao giờ được ai gọi).
  const dung = new Set();
  for (const era of ERAS) for (const p of buildHumanBody(era).parts) dung.add(p.shape);
  assert.deepEqual([...dung].sort(), [...HUMAN_SHAPES].sort(),
    `khuôn không kỷ nào dùng: [${HUMAN_SHAPES.filter((t) => !dung.has(t))}]`);
});

test('MỌI BỘ PHẬN CỦA MỌI KỶ PHẢI KHAI MỘT KHUÔN HỢP LỆ', () => {
  for (const era of ERAS) {
    for (const p of buildHumanBody(era).parts) {
      assert.ok(isValidHumanShape(p.shape),
        `kỷ ${era}, khối "${p.id}" khai khuôn "${p.shape}" không tồn tại`);
    }
  }
  assert.equal(isValidHumanShape('hình trụ'), false, 'tên lạ phải bị từ chối');
  assert.equal(isValidHumanShape(undefined), false, '`undefined` phải bị từ chối');
  assert.throws(() => humanShapeMesh('không-có'), /khuôn lạ/, 'khuôn lạ phải NÉM, không rơi ngầm');
});

test('MŨ VÀNH PHẢI ĐỘI VỪA CÁI ĐẦU — chỏm rộng hơn sọ', () => {
  // ⚠️ Bản đầu của khuôn `hat` để chỏm bằng 0,42 bề rộng vành ⇒ với vành 1,9 `headW` thì chỏm chỉ
  // 0,80 `headW`, tức HẸP HƠN cái đầu nó đang đội lên. Con số ấy không sai về mặt hình học nên
  // không gì đỏ; nó chỉ sai về mặt vật lý, và chỉ lộ ra khi hỏi thẳng câu này.
  //
  // ⚠️ VÀ BẢN ĐẦU CỦA CHÍNH BÀI TEST NÀY CŨNG HỎNG — nó CHÉP TAY con số 0,62 từ hồ sơ khuôn. Phép
  // thử ngược (đặt chỏm về 0,42) **KHÔNG đỏ**, vì bài test vẫn nhân với 0,62 của riêng nó. Đúng
  // quả mìn `BUILDING_SCALE = 0.86` chép tay ở `plinth-tri.mjs` (đếm 3 bệ thay vì 31): một hằng số
  // chép tay thì hôm nay đúng và sai vĩnh viễn trong im lặng vào ngày ai đó sửa bản gốc.
  // ⇒ Nay ĐO chỏm từ chính mảng toạ độ đã dựng: bề rộng ngang mặt phẳng = 2 × max|x| của những đỉnh
  // nằm TRÊN bậc thụt của vành.
  // ⚠️ ĐỌC CẤU TRÚC, ĐỪNG CẮM MỘT NGƯỠNG y. Bản đầu lọc `y > -0,3` — một con số chọn tay, và nó
  // rơi trúng khe giữa hai vành của chỏm nên đo nhầm vành TRÊN (0,52) thay vì chỗ rộng nhất (0,62).
  // Vành nào thuộc VÀNH MŨ thì suy từ chính hồ sơ: đó là hai mức y thấp nhất (đáy và mặt trên của
  // tấm vành); chỏm là tất cả những gì nằm trên chúng.
  const mesh = humanShapeMesh('hat');
  const mucY = [...new Set(Array.from(
    { length: mesh.positions.length / 3 }, (_, i) => mesh.positions[i * 3 + 1].toFixed(6),
  ))].map(Number).sort((a, b) => a - b);
  assert.ok(mucY.length >= 4, `khuôn \`hat\` chỉ có ${mucY.length} mức cao độ — không còn là mũ vành`);
  const dinhVanh = mucY[1];
  let chomNuaRong = 0;
  for (let i = 0; i < mesh.positions.length; i += 3) {
    if (mesh.positions[i + 1] > dinhVanh + 1e-9) {
      chomNuaRong = Math.max(chomNuaRong, Math.abs(mesh.positions[i]));
    }
  }
  const tyLeChom = chomNuaRong * 2;
  assert.ok(tyLeChom > 0.3 && tyLeChom < 0.95,
    `chỏm chiếm ${tyLeChom.toFixed(3)} bề rộng vành — ngoài dải hợp lý, hồ sơ khuôn đã đổi kiểu`);

  let soKyDoiMu = 0;
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const mu = body.parts.find((q) => q.id === 'headgear' && q.shape === 'hat');
    if (!mu) continue;
    soKyDoiMu += 1;
    const dau = body.parts.find((q) => q.id === 'head');
    assert.ok(mu.w * tyLeChom > dau.w,
      `kỷ ${era}: chỏm mũ rộng ${(mu.w * tyLeChom).toFixed(4)} mà đầu rộng ${dau.w.toFixed(4)}`
      + ' — cái mũ không đội vừa cái đầu nó đang đội lên');
  }
  // ⚠️ GÁC CHẠY-RỖNG: không kỷ nào đội `hat` thì vòng trên xanh trơn tru mà chẳng kiểm gì.
  assert.equal(soKyDoiMu, 3, `phải có đúng 3 kỷ đội mũ vành (7 · 8 · 11), thấy ${soKyDoiMu}`);
});
