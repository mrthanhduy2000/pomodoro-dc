/**
 * humanTailoring.test.js — round 60, Việc 2 + 3. **MÉP QUẦN ÁO LÀ MỘT BẬC TRONG ĐƯỜNG SINH.**
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * LUẬT ĐÀM RA CHO CẢ VÒNG, VÀ VÌ SAO NÓ PHẢI ĐƯỢC CANH BẰNG MỘT GÓC CHỨ KHÔNG BẰNG MỘT SỐ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * *"mỗi mép quần áo là một BẬC TRONG ĐƯỜNG SINH, không phải một khối dán lên."*
 *
 * Một cái bậc chỉ ĐỌC RA là một cái mép khi nó còn SẮC sau khi `smoothCrease` chạy. Phép làm mềm
 * ấy gộp pháp tuyến của hai mặt kề nhau khi chúng lệch **dưới `CREASE_DEGREES` = 40°**; một chỗ
 * đổi bán kính thoai thoải sẽ bị gộp và biến thành một chỗ phình mềm — vẫn tốn đủ tam giác, vẫn
 * đúng mọi con số, và trên ảnh thì **không có cái mép nào cả**. Đó đúng là họ khuyết tật của vòng
 * 58 (tám khối sọ) và vòng 59 (bốn khối mí mắt): mọi phép đo xanh, tấm ảnh bác.
 * ⇒ Nên bài test không hỏi *"bán kính nhảy bao nhiêu"* (một con số tuyệt đối, sẽ sai ngay khi tỉ
 * lệ cơ thể đổi) mà hỏi *"hai mặt ở chỗ ấy gãy nhau mấy độ"* — một QUAN HỆ, và đúng cái đại lượng
 * mà `smoothCrease` dùng để quyết định. Bài học 2 của `CLAUDE.md`.
 *
 * ⚠️ VÀ CÓ MỘT BÀI NGƯỢC: `chest` và `calf` — hai khuôn KHÔNG có mép — phải KHÔNG có góc gãy nào
 * trên 40°. Không có nó thì "khuôn có mép" chẳng phân biệt được với "khuôn nào cũng thế".
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { CREASE_DEGREES } from './creaseNormals.js';
import { buildHumanBody, humanShapesUsed } from './human.js';
import { shapeEndRadius, shapeRings } from './humanShape.js';
import { CITY_CAMERA_FOV } from './orbit.js';
import { residentViewDistance } from './residentFocus.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
/** Hai khuôn thân CÓ ĐƯỜNG MAY. `chest` (vải quấn) không nằm trong đây. */
const THAN_CO_MAY = ['seam', 'belt'];
/** Khung ảnh ở chỗ nhìn gần nhất app tới được — cùng công thức chụp với `humanCoarse.test.js`. */
const FRAME_PX = 726;

/**
 * Góc gãy (độ) giữa hai dải mặt bên kề nhau của một đường sinh, tại vành thứ `i`.
 * Mặt cắt dọc của một dải đi theo hướng `(Δr, Δy)`, nên pháp tuyến của nó là `(Δy, −Δr)`.
 */
function creaseAt(rings, i) {
  const seg = (a, b) => {
    const dy = rings[b][0] - rings[a][0];
    const dr = rings[b][1] - rings[a][1];
    const len = Math.hypot(dy, dr) || 1;
    return [dy / len, -dr / len];
  };
  const [ax, ay] = seg(i - 1, i);
  const [bx, by] = seg(i, i + 1);
  return (Math.acos(Math.max(-1, Math.min(1, ax * bx + ay * by))) * 180) / Math.PI;
}

/**
 * ⚠️ ĐỊNH NGHĨA NÀY LÀ BẢN THỨ HAI, VÀ BẢN ĐẦU SAI — GHI LẠI VÌ NÓ LÀ MỘT PHÉP ĐO NÓI DỐI.
 * Bản đầu định nghĩa "mép may" là *"một chỗ gãy trên 40°"*. Nó đỏ ngay ở bài NGƯỢC, và cái đỏ ấy
 * ĐÚNG: `chest` vốn đã có **hai** chỗ gãy trên ngưỡng — **53,6° ở eo** và **88° ở vai** — từ
 * round 52, nghĩa là cơ thể luôn có sẵn những đường sắc mà không ai gọi chúng là mép quần áo.
 * Nếu tôi tin phép đo đầu tiên thì hoặc tôi đã nới ngưỡng lên 90° (làm bài test mất răng), hoặc
 * đã kết luận rằng `chest` cũng "có may". Lần thứ ba mươi của bài học *"nghi cái THƯỚC trước"*.
 *
 * ⇒ Thứ phân biệt một **MÉP MAY** với một **nếp giải phẫu** không phải độ sắc, mà là HƯỚNG:
 *   · một mép may là một cái **GỜ NẰM NGANG NHÔ RA** — bán kính nhảy trong khi chiều cao gần như
 *     đứng yên (`Δr ≥ 3·|Δy|`, và `Δr > 0`), rồi **SẮC Ở CẢ HAI ĐẦU** của cái gờ ấy
 *   · một nếp giải phẫu (eo, vai, bắp chân) là một chỗ ĐỔI ĐỘ DỐC: cả hai đoạn đều chạy DỌC
 * Đo trên bộ khuôn hiện có, tỉ số `|Δr|/|Δy|` lớn nhất của các khuôn KHÔNG có mép là **1,54**
 * (`calf`, chỗ bắp chân phình) và **2,88** (`skull`, chóp sọ) — nên ngưỡng 3 tách được hai họ,
 * và bài NGƯỢC ở dưới canh đúng điều đó thay vì tin lời tôi.
 */
function outwardLedges(name) {
  const r = shapeRings(name);
  const out = [];
  for (let i = 0; i < r.length - 1; i += 1) {
    const dy = Math.abs(r[i + 1][0] - r[i][0]);
    const dr = r[i + 1][1] - r[i][1];
    if (!(dr > 0 && dr >= 3 * dy)) continue;
    // Sắc ở cả hai đầu. Vành đầu mút giáp với NẮP nên nó sắc sẵn 90° theo cách dựng lưới.
    const sacDuoi = i === 0 || creaseAt(r, i) > CREASE_DEGREES;
    const sacTren = i + 1 === r.length - 1 || creaseAt(r, i + 1) > CREASE_DEGREES;
    if (sacDuoi && sacTren) out.push({ i, y: r[i][0], nho: dr, tiSo: dr / (dy || 1e-9) });
  }
  return out;
}

test('`seam` có ĐÚNG HAI mép may — một ở gấu áo, một ở cổ áo', () => {
  const go = outwardLedges('seam');
  assert.equal(go.length, 2,
    `phải đúng hai gờ nhô ra — đếm được ${go.length}: ` + go.map((g) => `y=${g.y}`).join(' '));
  assert.ok(go[0].y < -0.3, `gờ gấu áo phải nằm sát đáy — đo được y = ${go[0].y}`);
  assert.ok(go[1].y > 0.2, `gờ cổ áo phải nằm sát đỉnh — đo được y = ${go[1].y}`);
  // Và mép phải NHÔ RA so với tấm vải ngay cạnh nó, không phải thụt vào.
  const r = shapeRings('seam');
  assert.ok(r[1][1] > r[0][1], 'mép gấu phải nhô ra so với vành đáy');
  assert.ok(r[7][1] > r[6][1], 'mép cổ phải nhô ra so với chỗ thắt ở chân cổ');
});

test('`cuff` có MỘT mép may ở đầu dưới, và đầu trên bằng ĐÚNG `calf`', () => {
  const go = outwardLedges('cuff');
  assert.equal(go.length, 1, `cửa tay là MỘT cái mép — đếm được ${go.length}`);
  assert.ok(go[0].y < -0.25,
    `mép của \`cuff\` phải ở đầu DƯỚI (cổ tay / cổ chân) — đo được y = ${go[0].y}`);
  /*
    ⚠️ RÀNG BUỘC NÀY KHÔNG PHẢI CHUYỆN GỌN GÀNG — NÓ LÀ HỢP ĐỒNG VỚI ROUND 58, VIỆC 2.
    Đường kính quả cầu khớp được suy từ `shapeEndRadius(shape, +1)` của đoạn chi dưới. Lệch một
    chút ở đây là quả cầu khuỷu và quả cầu gối sai cỡ — một cục u, hoặc một cái khe hở khi chân
    gập hết cỡ — và cả hai chỉ hiện ra trên một tấm ảnh chứ không có phép đo nào kêu lên.
  */
  assert.equal(shapeEndRadius('cuff', 1), shapeEndRadius('calf', 1),
    'đầu trên của `cuff` phải bằng ĐÚNG `calf`: quả cầu khớp đo bằng chính con số này');
});

test('NGƯỢC LẠI: khuôn KHÔNG phải quần áo thì không được có mép may nào', () => {
  /*
    ⚠️ BÀI LÀM CHO HAI BÀI TRÊN CÓ NGHĨA, và nó cũng là bài đã bác bản đầu của phép đo (xem
    `outwardLedges`). Nếu `chest` và `calf` cũng "có mép" thì Việc 2 và Việc 3 chỉ là đổi tên.
    Bài này đồng thời khoá luôn cái ngưỡng: nó in ra tỉ số lớn nhất mà một khuôn không-may đạt
    tới, nên hạ ngưỡng 3 xuống dưới con số ấy là đỏ ngay.
  */
  let caoNhat = 0;
  for (const name of ['chest', 'calf', 'limb', 'dome', 'skull', 'flare']) {
    assert.equal(outwardLedges(name).length, 0, `\`${name}\` không phải quần áo mà lại có mép may`);
    const r = shapeRings(name);
    for (let i = 0; i < r.length - 1; i += 1) {
      const dy = Math.abs(r[i + 1][0] - r[i][0]);
      const dr = r[i + 1][1] - r[i][1];
      if (dr > 0) caoNhat = Math.max(caoNhat, dr / (dy || 1e-9));
    }
  }
  assert.ok(caoNhat < 3,
    `khuôn không-may đạt tỉ số ${caoNhat.toFixed(2)} — đã chạm ngưỡng 3, phép đo sắp mất răng`);
  console.log(`[mép may] khuôn KHÔNG may: tỉ số |Δr|/|Δy| lớn nhất ${caoNhat.toFixed(2)} (ngưỡng 3)`);
});

test('MÉP MAY NHÌN THẤY ĐƯỢC: gờ nhô ra quá hai điểm ảnh ở chỗ nhìn gần nhất', () => {
  /*
    ⚠️ MỘT CÁI BẬC SẮC MÀ RỘNG NỬA ĐIỂM ẢNH THÌ KHÔNG PHẢI MỘT CÁI CỔ ÁO. Bài trên canh nó có
    GÃY hay không; bài này canh nó có ĐỦ TO để mắt đọc ra hay không — hai câu hỏi khác nhau, và
    round 56 đã trả tiền cho việc chỉ hỏi câu đầu (lông mày, lòng trắng, con ngươi đều "đúng" mà
    nằm dưới một điểm ảnh, tức công của ba vòng chưa từng có chỗ nào được nhìn thấy).
  */
  const tinh = (era) => {
    const body = buildHumanBody(era);
    const px = FRAME_PX / (2 * residentViewDistance(body.dims.height)
      * Math.tan(((CITY_CAMERA_FOV / 2) * Math.PI) / 180));
    return { body, px };
  };
  const bao = [];
  for (const era of ERAS) {
    const khuonThan = THAN_CO_MAY.find((k) => humanShapesUsed(era).includes(k));
    if (!khuonThan) continue;
    const { body, px } = tinh(era);
    const ao = body.parts.find((p) => p.id === 'trapezius');
    // Gờ CỔ ÁO = mép ngoài cùng của đường sinh thân, đo bằng chính khuôn kỷ ấy đang dùng — không
    // viết cứng tên `seam`, vì tám kỷ dùng `belt`, và một bản chép tên khuôn ở đây sẽ lặng lẽ đo
    // nhầm hình của kỷ khác. Lấy gờ NHÔ RA nằm cao nhất: đó là cổ áo ở cả hai khuôn.
    const goCo = outwardLedges(khuonThan).at(-1);
    const go = goCo.nho * 0.5 * Math.max(ao.w, ao.d) * px;
    assert.ok(go > 2,
      `kỷ ${era}: gờ cổ áo chỉ nhô ${go.toFixed(2)} điểm ảnh ở cận cảnh — dưới hai điểm ảnh thì `
      + 'nó không phải một cái cổ áo, nó là một dòng mã. Cho nó dày hơn, đừng hạ ngưỡng.');
    bao.push(go);
  }
  assert.equal(bao.length, 13, `đúng 13 kỷ có đường may (15 trừ hai kỷ vải quấn) — đếm được ${bao.length}`);
  console.log(`[mép may] gờ cổ áo ${Math.min(...bao).toFixed(1)}–${Math.max(...bao).toFixed(1)} điểm ảnh`
    + ` ở chế độ chạm-để-nhìn-gần`);
});

test('HAI KỶ MẶC VẢI QUẤN KHÔNG ĐƯỢC CÓ MỘT ĐƯỜNG MAY NÀO', () => {
  // ⚠️ MỘT CÂU HỎI LỊCH SỬ. Tấm da Göbekli Tepe và cái khố shendyt là vải QUẤN — cho chúng một
  // cái cổ áo bẻ là bịa ra ba nghìn năm nghề may, và nó cũng làm hai kỷ ấy trả một lệnh vẽ vô ích.
  const VAI_QUAN = [1, 2];
  for (const era of ERAS) {
    const khuon = humanShapesUsed(era);
    const coMay = THAN_CO_MAY.some((k) => khuon.includes(k)) || khuon.includes('cuff');
    assert.equal(coMay, !VAI_QUAN.includes(era),
      `kỷ ${era}: ${coMay ? 'CÓ' : 'KHÔNG có'} khuôn mép may mà đáng lẽ phải `
      + `${VAI_QUAN.includes(era) ? 'KHÔNG có' : 'CÓ'} — bộ khuôn: ${khuon.join(', ')}`);
  }
});

test('`belt` = `seam` + một chỗ thắt, BA mép may, và tốn 0 lệnh vẽ thêm', () => {
  const go = outwardLedges('belt');
  assert.equal(go.length, 3,
    `thắt lưng thêm đúng MỘT mép so với \`seam\` ⇒ ba mép — đếm được ${go.length}`);
  const [gau, dai, co] = go;
  assert.ok(gau.y < -0.4, `mép gấu áo phải sát đáy — y = ${gau.y}`);
  assert.ok(dai.y > -0.3 && dai.y < 0, `mép trên đai phải ở ngang eo — y = ${dai.y}`);
  assert.ok(co.y > 0.2, `mép cổ áo phải sát đỉnh — y = ${co.y}`);

  // Cái đai phải là một DẢI có bề dày, không phải một chỗ thắt: bán kính phải đi NGANG một quãng.
  const r = shapeRings('belt');
  const daiTu = r.findIndex(([, ban]) => ban === Math.min(...r.map(([, b]) => b).slice(3, 7)));
  assert.equal(r[daiTu][1], r[daiTu + 1][1], 'dải đai phải có hai vành CÙNG bán kính — nếu không nó '
    + 'chỉ là một chỗ thắt hình chữ V, và mắt đọc ra là cái eo chứ không phải cái thắt lưng');

  /*
    ⚠️ VÀ ĐÂY LÀ CÂU ĐÁNG TIỀN NHẤT CỦA BÀI NÀY: **THẮT LƯNG TỐN 0 LỆNH VẼ.**
    Ba khối thân dùng CHUNG một khuôn, nên một kỷ thắt lưng dùng `belt` THAY CHỖ `seam` chứ không
    dùng thêm. Ba nhóm phải RỜI NHAU tuyệt đối — một kỷ có cả hai nghĩa là `bodyShape` đã bị gọi
    hai lần với hai câu trả lời khác nhau, đúng hình dạng "một luật hai công thức".
  */
  const nhom = { chest: [], seam: [], belt: [] };
  for (const era of ERAS) {
    const khuon = humanShapesUsed(era);
    const co2 = ['chest', 'seam', 'belt'].filter((k) => khuon.includes(k));
    // `chest` vẫn còn ở mọi kỷ vì bàn tay dùng nó — nên chỉ hai khuôn THÂN mới phải rời nhau.
    assert.ok(!(khuon.includes('seam') && khuon.includes('belt')),
      `kỷ ${era} dùng CẢ \`seam\` lẫn \`belt\` (${co2.join(', ')}) — thân chỉ được có một khuôn`);
    nhom[khuon.includes('belt') ? 'belt' : (khuon.includes('seam') ? 'seam' : 'chest')].push(era);
  }
  assert.deepEqual(nhom.belt, [3, 4, 5, 6, 8, 9, 10, 12],
    'tám kỷ thắt lưng là một danh sách LỊCH SỬ — đổi nó là đổi cách một thế kỷ mặc quần áo');
  assert.deepEqual(nhom.chest, [1, 2], 'hai kỷ vải quấn');
  assert.equal(nhom.seam.length, 5, 'năm kỷ có may mà không thắt lưng: 7 · 11 · 13 · 14 · 15');
  console.log(`[thắt lưng] vải quấn ${nhom.chest.length} kỷ · có may ${nhom.seam.length}`
    + ` · có may + thắt lưng ${nhom.belt.length} — ba nhóm rời nhau, mỗi kỷ đúng MỘT khuôn thân`);
});
