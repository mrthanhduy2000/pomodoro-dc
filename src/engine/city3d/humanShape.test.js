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

import { HUMAN_ROLES, buildHumanBody, humanRoleColors } from './human.js';
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

test('PHÁP TUYẾN PHẢI NGỬA CÙNG PHÍA VỚI THỨ TỰ ĐỈNH — không được khai một đằng dựng một nẻo', () => {
  // Bài trên canh THỨ TỰ ĐỈNH (thứ quyết định mặt nào bị `FrontSide` vứt đi). Bài này canh mảng
  // `normals` — thứ quyết định ĐỘ SÁNG. Hai đại lượng độc lập: một hình có thứ tự đỉnh hoàn hảo
  // vẫn có thể mang pháp tuyến ngược và render ra đen kịt dưới nắng.
  //
  /*
    ⚠️ NGƯỠNG 0,999 → 0 — ĐỔI CÂU HỎI, KHÔNG NỚI TAY (round 54, ADR-094).
    0,999 là phát biểu *"pháp tuyến phải BẰNG pháp tuyến mặt"*, tức nó đòi tô sáng PHẲNG THEO
    TỪNG MẶT. Kể từ khi `humanShapeMesh` gọi `smoothCrease`, điều đó cố Ý không còn đúng nữa:
    trên thân tròn 20 cạnh, mỗi đỉnh nay mang trung bình của hai mặt kề — đúng cái làm nó thôi
    trông như hai mươi tấm phẳng.
    ⚠️ NHƯNG KHUYẾT TẬT BÀI NÀY SINH RA ĐỂ BẮT THÌ KHÔNG ĐỔI: một pháp tuyến NGƯỢC (khối đen kịt
    dưới nắng) vẫn cho tích vô hướng ÂM, và làm mềm thì không bao giờ lật được một pháp tuyến
    sang nửa không gian bên kia (nó chỉ gộp những mặt lệch dưới 40° — xem `creaseNormals.js`).
    ⇒ Câu hỏi đúng là *"có ngửa cùng phía không"*, và ngưỡng đúng là **> 0**.
    THỬ-CHO-ĐỎ (đã chạy): đảo dấu ba số `nor` trong `pushTri` ⇒ cả chín khuôn đỏ.
    ⚠️ VÀ MỘT GIÀNG BUỘC NỮA THAY CHỖ PHẦN VỪA MẤT: pháp tuyến phải còn là VÉC-TƠ ĐƠN VỊ. Một
    phép trung bình quên chuẩn hoá sẽ làm cả mảng khuếch tán tối đi một cách êm ả — không gì đỏ,
    không gì thiếu, chỉ là ai cũng hơi xám.
  */
  for (const ten of HUMAN_SHAPES) {
    const mesh = humanShapeMesh(ten);
    for (let t = 0; t < mesh.triangles; t += 1) {
      const [a, b, c] = tamGiac(mesh, t);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const d = Math.hypot(...n) || 1;
      for (let k = 0; k < 3; k += 1) {
        const o = t * 9 + k * 3;
        const cham = (n[0] / d) * mesh.normals[o]
          + (n[1] / d) * mesh.normals[o + 1] + (n[2] / d) * mesh.normals[o + 2];
        assert.ok(cham > 0,
          `khuôn "${ten}" mặt ${t} đỉnh ${k}: pháp tuyến ngửa ngược phía với thứ tự đỉnh `
          + `(cos = ${cham.toFixed(4)}) — khối này sẽ đen kịt dưới nắng`);
        const dai = Math.hypot(mesh.normals[o], mesh.normals[o + 1], mesh.normals[o + 2]);
        assert.ok(Math.abs(dai - 1) < 1e-6,
          `khuôn "${ten}" mặt ${t} đỉnh ${k}: pháp tuyến dài ${dai.toFixed(6)}, phải là 1`);
      }
    }
  }
});

test('LÀM MỀM CHẠY THẬT — khối tròn được gộp, `box` không mất một cạnh nào', () => {
  /*
    ⚠️ BÀI NÀY TỒN TẠI VÌ BÀI TRÊN ĐÃ PHẢI NỚI TỪ 0,999 XUỐNG 0. Một ngưỡng bị nới mà không
    ai canh chỗ trống nó để lại thì `smoothCrease` có thể bị gỡ khỏi `humanShapeMesh` và MỌI bài
    trong file này vẫn xanh — đúng hình dạng *"một cơ chế chạy xanh mà không làm gì"*.
    Đo bằng một QUAN HỆ, không bằng một con số tuyệt đối: **hình tròn phải có đỉnh được gộp, cái
    hộp phải không có đỉnh nào được gộp** — và hai vế đó đúng với mọi số cạnh về sau.
    THỬ-CHO-ĐỎ (đã chạy): xóa lời `smoothCrease(pos, nor)` ⇒ vế tròn đỏ ngay.
  */
  // Một đỉnh được gộp khi pháp tuyến của nó lệch khỏi pháp tuyến MẶT mà nó thuộc về.
  const tyLeGop = (ten) => {
    const mesh = humanShapeMesh(ten);
    let gop = 0;
    let tong = 0;
    for (let t = 0; t < mesh.triangles; t += 1) {
      const [a, b, c] = tamGiac(mesh, t);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const d = Math.hypot(...n) || 1;
      for (let k = 0; k < 3; k += 1) {
        const o = t * 9 + k * 3;
        const cham = (n[0] / d) * mesh.normals[o]
          + (n[1] / d) * mesh.normals[o + 1] + (n[2] / d) * mesh.normals[o + 2];
        if (cham < 0.9999) gop += 1;
        tong += 1;
      }
    }
    return gop / tong;
  };

  assert.equal(tyLeGop('box'), 0,
    'khuôn `box` có đỉnh bị gộp pháp tuyến — hai mặt kề của nó lệch 90°, trên ngưỡng gãy 40°, '
    + 'nên nó phải giữ nguyên từng byte. Góc gãy bị nới quá tay rồi.');
  for (const ten of ['prism', 'limb', 'calf', 'chest', 'flare', 'cone', 'dome']) {
    assert.ok(tyLeGop(ten) > 0.5,
      `khuôn "${ten}" chỉ gộp ${(tyLeGop(ten) * 100).toFixed(1)}% số đỉnh — một khối tiện tròn nhiều `
      + 'cạnh phải được gộp gần hết mặt bên. `smoothCrease` có còn được gọi không?');
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
    /*
      ⚠️ ROUND 54 (ADR-094): TRẦN TRÊN ĐÃ BỎ, SÀN GIỮ NGUYÊN — và chỗ này đáng ghi lại vì nó là
      lần thứ HAI cùng một con số bị nâng, nên lần này nó được thay bằng một thứ không phải con số.
      Lịch sử: 80 (trước ADR-057) → 160 (ADR-057, Đàm chốt *"vẽ thêm tam giác tới lúc nó bo
      tròn"*) → bỏ hẳn (vòng 54, Đàm chốt phong cách Pixar và *"KHÔNG trần số cạnh"*).
      Một con số bị nâng hai lần vì cùng một lý do là một con số đang làm sai việc.

      Cái trần ấy chỉ có MỘT công dụng thật — "có ai vừa dựng thừa hình học không" — và công dụng
      ấy đã được canh bởi vế NGAY TRÊN, chặt hơn nhiều: `shapeTriangles(ten)` phải bằng ĐÚNG số
      tam giác đếm từ mảng toạ độ đã dựng. Đó là một ĐẲNG THỨC, không phải một ngưỡng: nó đỏ khi
      hai bên lệch nhau dù một tam giác, ở mọi số cạnh, mãi mãi, và không bao giờ phải nâng.
      Sàn 12 thì giữ: đó là cái hộp, khuôn rẻ nhất bảng, và một khuôn dưới 12 tam giác là một khuôn
      không dựng nổi sáu mặt — tức một lỗi, không phải một lựa chọn.
    */
    assert.ok(n >= 12, `khuôn "${ten}" chỉ có ${n} tam giác — không dựng nổi sáu mặt của một cái hộp`);
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

/**
 * Bề mặt cái đầu ở độ cao `y` (toạ độ khớp `head`), tính bằng BÁN KÍNH NGOẠI TIẾP.
 *
 * ⚠️ NGOẠI TIẾP LÀ CỐ Ý VÀ NÓ LÀM BÀI TEST KHÓ HƠN, không dễ hơn: mặt sọ thật là một đa giác 60
 * cạnh nằm TRONG đường tròn ngoại tiếp, nên "nằm ngoài đường tròn ngoại tiếp" là một đòi hỏi
 * mạnh hơn "nằm ngoài mặt sọ". Lấy bán kính nội tiếp cho dễ thì bài test sẽ xanh cả với một mũ
 * tóc đang cắm vào sọ ở giữa hai đỉnh.
 */
function matSo(y, headW, headH) {
  const rings = [[-0.5, 0.60], [-0.28, 0.84], [-0.02, 1.00], [0.20, 0.92], [0.38, 0.74], [0.50, 0.40]];
  const R = 0.5 / Math.cos(Math.PI / 60);
  const u = y / headH - 0.5;
  if (u < -0.5 || u > 0.5) return null;            // ngoài khoảng cái đầu ⇒ chắc chắn không đâm vào
  for (let i = 0; i < rings.length - 1; i += 1) {
    const [y0, r0] = rings[i];
    const [y1, r1] = rings[i + 1];
    if (u >= y0 && u <= y1) return R * (r0 + (r1 - r0) * ((u - y0) / (y1 - y0))) * headW;
  }
  return null;
}

/** Mọi đỉnh của một khối, đã đưa về toạ độ khớp mà nó treo vào. */
function dinhTheoKhop(part) {
  const mesh = humanShapeMesh(part.shape);
  const out = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    out.push([
      mesh.positions[i] * part.w + part.rest.x,
      mesh.positions[i + 1] * part.h + part.rest.y,
      mesh.positions[i + 2] * part.d + part.rest.z,
    ]);
  }
  return out;
}

test('MŨ TÓC PHẢI NẰM NGOÀI CÁI SỌ — nếu không thì đường viền ta thấy KHÔNG PHẢI cái vành ta vẽ', () => {
  /*
    ⚠️ ĐÂY LÀ BÀI GIỮ CHO MỘT PHÉP ĐO KHỎI QUAY LẠI, VÀ PHÉP ĐO ẤY MỚI LÀ THỨ ĐÁNG ĐỌC.
    Tóc `crop` của vòng 52 là một `dome` rộng hơn sọ 6% nhưng chỉ cao 0,52 `headH`, đặt ở 0,74
    `headH`. Vành đáy của nó nằm ở bán kính 0,3184 `headW` trong khi mặt sọ ở chỗ ấy là 0,5007 —
    tức **vành tóc nằm sâu 36% BÊN TRONG sọ**. Thứ mắt thấy vì thế không phải cái vành, mà là
    GIAO TUYẾN của hai mặt tròn xoay cùng trục — và giao tuyến ấy luôn là một đường tròn NẰM
    NGANG, ở đây là `y/headH = 0,6364`, giống hệt nhau ở cả 60 phương vị.
    ⇒ Vẽ lại cái vành cho đẹp không sửa được gì. Điều kiện cần là mũ tóc nằm HẲN bên ngoài sọ.

    THỬ-CHO-ĐỎ (đã chạy): hạ `SCALP_LIFT` từ 1,07 về 1,00 ⇒ **1.191/2.154 đỉnh đâm vào sọ**.
  */
  const body = buildHumanBody(13);                 // kỷ 13: `crop`, đầu trần ⇒ mũ tóc lộ nguyên
  const scalp = body.parts.find((p) => p.shape === 'scalp');
  assert.ok(scalp, 'kỷ 13 phải dựng một mũ tóc — nếu không, bài test này đang đo cái không có');
  const { headW, headH } = body.dims;

  let dam = 0;
  let leMin = Infinity;
  for (const [x, y, z] of dinhTheoKhop(scalp)) {
    const ban = Math.hypot(x, z);
    if (ban < 1e-9) continue;                      // mũi nhọn bịt đáy — nằm trong sọ CÓ CHỦ Ý
    const so = matSo(y, headW, headH);
    if (so === null) continue;                     // cao hơn đỉnh sọ ⇒ đã ở ngoài
    if (ban <= so) dam += 1;
    leMin = Math.min(leMin, ban / so);
  }
  assert.equal(dam, 0, `${dam} đỉnh mũ tóc nằm TRONG sọ — đường viền sẽ lại là một vòng tròn ngang`);
  assert.ok(leMin > 1.03,
    `chỗ sát nhất chỉ hở ${((leMin - 1) * 100).toFixed(2)}% — dưới 3% thì một lần chỉnh `
    + '`headW` cũng đủ làm tóc thụt vào sọ');
  console.log(`[tóc] mũ tóc hở sọ ít nhất ${((leMin - 1) * 100).toFixed(1)}%`);
});

test('CHÂN TÓC KHÔNG ĐƯỢC NẰM NGANG — trán phải cao hơn gáy, thái dương ở giữa', () => {
  /*
    ⚠️ BÀI NÀY ĐỎ VỚI ĐÚNG KHUYẾT TẬT VÒNG 56 ĐI CHỮA, và đó là lý do nó tồn tại: bài trên chỉ nói
    mũ tóc nằm ngoài sọ — một cái `dome` phóng to đều cũng thoả, mà nó lại cho ra đúng một đường
    viền NẰM NGANG. Câu hỏi thật là *"cái viền ấy có hình của một chân tóc không"*.
    Đàm, vòng 56: *"có đường viền màu nào đang nằm ở chỗ đời thật không có đường viền không?"*
    ⚠️ THỬ-CHO-ĐỎ PHẢI LÀM ĐỎ ĐÚNG PHÉP ĐO, KHÔNG PHẢI LÀM SẬP BÀI TEST. Lần thử đầu đổi khuôn
    `scalp` sang `dome`, và bài đỏ vì `find` trả về `undefined` — một cái đỏ KHÔNG chứng minh gì
    về phép đo cả, vì phép đo chưa kịp chạy. Thử-cho-đỏ đúng là để nguyên khuôn mà **làm phẳng
    chân tóc**: `HAIRLINE_SWING = HAIRLINE_BULGE = HAIRLINE_PEAK = 0` ⇒ chênh lệch trán − gáy đo
    ra **0,000** (đã chạy). Đó là con số của chính khuyết tật vòng 52.
  */
  const body = buildHumanBody(13);
  const scalp = body.parts.find((p) => p.shape === 'scalp');
  assert.ok(scalp, 'kỷ 13 phải dựng một mũ tóc — nếu không, bài test này đang đo cái không có');
  const { headH } = body.dims;

  // Chân tóc theo phương vị: đỉnh THẤP NHẤT của mũ tóc ở mỗi hướng, bỏ mũi nhọn trên trục.
  let tran = -Infinity;
  let gay = Infinity;
  let thaiDuong = null;
  const day = new Map();
  for (const [x, y, z] of dinhTheoKhop(scalp)) {
    if (Math.hypot(x, z) < 1e-9) continue;
    const goc = Math.round((Math.atan2(z, x) * 180) / Math.PI);
    day.set(goc, Math.min(day.get(goc) ?? Infinity, y / headH));
  }
  for (const [goc, y] of day) {
    if (Math.abs(goc) <= 4) tran = Math.max(tran, y);
    if (Math.abs(Math.abs(goc) - 180) <= 4) gay = Math.min(gay, y);
    if (Math.abs(Math.abs(goc) - 90) <= 4) thaiDuong = thaiDuong === null ? y : Math.min(thaiDuong, y);
  }
  assert.ok(tran - gay > 0.40,
    `chân tóc trán ${tran.toFixed(3)} − gáy ${gay.toFixed(3)} = ${(tran - gay).toFixed(3)} `
    + 'lần chiều cao đầu. Dưới 0,40 thì nó vẫn đọc ra một cái vạch ngang quanh sọ.');
  assert.ok(thaiDuong > gay && thaiDuong < tran,
    `thái dương ${thaiDuong?.toFixed(3)} phải nằm GIỮA gáy ${gay.toFixed(3)} và trán `
    + `${tran.toFixed(3)} — bậc nhất theo cos(θ) cho thái dương ra đúng trung điểm, tức tóc dừng `
    + 'ngang tầm mắt hai bên đầu.');
  console.log(`[tóc] chân tóc: gáy ${gay.toFixed(3)} · thái dương ${thaiDuong.toFixed(3)}`
    + ` · trán ${tran.toFixed(3)} (lần chiều cao đầu)`);
});

test('MỌI VAI MÀU PHẢI CÓ MÀU — và phải là màu của CHÍNH nó, không phải màu rơi nhầm', () => {
  /*
    ⚠️ BÀI NÀY SINH RA TỪ MỘT LỖI ĐÃ SỐNG BA TUẦN MÀ KHÔNG GÌ ĐỎ.
    Round 49 tách vai `steel` khỏi `gear` và làm đủ mọi phía: `HUMAN_ROLES` thêm tên, `palette3d.js`
    thêm `steel`, `palette3d.test.js` thêm cả danh sách ngoại lệ cho nó. Chỉ bảng `roleColor` bên
    `sceneGraph.js` là không ai sửa — nó khai sáu vai và dòng dùng nó kết thúc bằng `?? cloth`.
    ⇒ Mọi mũ trụ và mọi đầu công cụ kim loại tô đúng **màu vải** của kỷ suốt từ đó. Bài test của
    bảng màu vẫn xanh, vì nó kiểm BẢNG chứ không kiểm chỗ TIÊU THỤ bảng (`TECH_DEBT #42`).

    ⚠️ DÙNG BẢNG MÀU GIẢ VỚI MỖI VAI MỘT SỐ RIÊNG, KHÔNG DÙNG BẢNG THẬT. Bảng thật có thể tình cờ
    cho hai vai cùng màu ở một kỷ nào đó, và khi ấy bài test không phân biệt được "đi đúng đường"
    với "rơi nhầm mà may". Bảng giả thì mỗi vai một giá trị duy nhất, nên một vai rơi nhầm là lộ
    ngay và lộ ở mọi vai, không riêng `steel`. Vế "màu kim loại khác màu vải ở cả 15 kỷ thật" nằm
    ở `palette3d.test.js`, cạnh chỗ dựng bảng màu.
    THỬ-CHO-ĐỎ (đã chạy): bỏ dòng `steel:` trong `humanRoleColors` ⇒ vế một đỏ; đổi nó thành
    `r.cloth` ⇒ vế hai đỏ.
  */
  const gia = { wall: 0x101010, roof: 0x202020, roles: {} };
  HUMAN_ROLES.forEach((vai, i) => { gia.roles[vai] = 0xa00000 + i; });
  const mau = humanRoleColors(gia);
  assert.deepEqual(Object.keys(mau).sort(), [...HUMAN_ROLES].sort(),
    'bảng màu vai không khớp HUMAN_ROLES — một vai thiếu màu sẽ tô nhầm trong im lặng');
  for (const vai of HUMAN_ROLES) {
    assert.equal(mau[vai], gia.roles[vai],
      `vai "${vai}" nhận ${mau[vai]?.toString(16)} trong khi bảng khai ${gia.roles[vai].toString(16)}`
      + ' — nó đang rơi về màu của một vai khác.');
  }
  // Và khi bảng màu KHÔNG khai gì cả thì vẫn phải ra đủ số, không được ra `undefined`.
  const tran = humanRoleColors({});
  for (const vai of HUMAN_ROLES) {
    assert.equal(typeof tran[vai], 'number', `vai "${vai}" ra ${tran[vai]} khi bảng màu rỗng`);
  }
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
