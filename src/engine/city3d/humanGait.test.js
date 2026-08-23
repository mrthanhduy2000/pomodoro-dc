/**
 * humanGait.test.js — canh BẢNG DÁNG ĐI và, quan trọng hơn, canh **CÁI DÂY NỐI** từ bảng tới tư thế.
 *
 * ⚠️ VÌ SAO BÀI QUAN TRỌNG NHẤT Ở ĐÂY LÀ BÀI "DÂY NỐI", KHÔNG PHẢI BÀI "BẢNG CÓ ĐỦ 15 DÒNG".
 * Dự án vừa trả giá đúng chỗ này ở ADR-054: `buildScenePalette` đổi tên tham số `era` rồi có một
 * biến khác nhận cái tên cũ, nên `getFloraStyle(era)` và `getHumanStyle(era)` nhận vào một object
 * MÀU thay vì một số kỷ. Cả hai hàm ấy **cố ý** rơi về kỷ 1 với dữ liệu lạ (không được ném lỗi
 * giữa màn hình Thành Phố), nên 15 kỷ dùng chung một màu lá suốt ba phase — build xanh, lint sạch,
 * 1110 bài test xanh, không một cảnh báo. `gaitOf` có ĐÚNG cùng cái van an toàn ấy (`?? saunter`),
 * nên nó cũng có đúng cùng khả năng nói dối. ⇒ Phải hỏi ở ĐẦU BÊN KIA: đổi một trường của bảng thì
 * tư thế có nhúc nhích không.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { GAIT_KINDS, gaitOf, isValidGait, isValidGaitProfile, allGaitProfiles } from './humanGait';
import { HUMAN_STYLES, getHumanStyle } from './humanStyle';
import { buildHumanBody } from './human';
import { poseAt, footContactAt, legFactorAt } from './humanPose';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const TRUONG = ['knee', 'sway', 'twist', 'headTrack'];

/** Một cơ thể thật (kỷ 1) nhưng đội một kiểu đi tuỳ chọn — để cô lập đúng biến đang hỏi. */
function thanVoiDangDi(kind) {
  const goc = buildHumanBody(1);
  return { ...goc, style: { ...goc.style, gait: kind } };
}

/** Lấy mẫu dày một chu kỳ rồi trả về bốn đại lượng, mỗi cái ứng với ĐÚNG MỘT trường của bảng. */
function chuKyDo(body) {
  const { cycle } = poseAt(body, 0);
  let chanRutNhatConLai = Infinity;
  let lacNganNhat = 0;
  let vaiXoayNhat = 0;
  let dauCaoNhat = -Infinity;
  let dauThapNhat = Infinity;
  for (let i = 0; i < 400; i += 1) {
    const p = poseAt(body, (cycle * i) / 400);
    chanRutNhatConLai = Math.min(chanRutNhatConLai, p.stretch.hipL, p.stretch.hipR);
    lacNganNhat = Math.max(lacNganNhat, Math.abs(p.joints.torso.z));
    vaiXoayNhat = Math.max(vaiXoayNhat, Math.abs(p.joints.shoulderL.x - p.joints.shoulderR.x));
    dauCaoNhat = Math.max(dauCaoNhat, p.joints.head.y);
    dauThapNhat = Math.min(dauThapNhat, p.joints.head.y);
  }
  return {
    knee: chanRutNhatConLai,
    sway: lacNganNhat,
    twist: vaiXoayNhat,
    headTrack: dauCaoNhat - dauThapNhat,
  };
}

test('BẢNG HỢP LỆ, VÀ MỌI KIỂU ĐI PHẢI CÓ NGƯỜI DÙNG', () => {
  const bang = allGaitProfiles();
  assert.equal(bang.length, GAIT_KINDS.length, 'danh sách tên và bảng hồ sơ đã trôi khỏi nhau');
  for (const [ten, p] of bang) {
    assert.ok(isValidGaitProfile(p), `kiểu "${ten}" khai giá trị ngoài dải`);
    for (const t of TRUONG) assert.ok(Number.isFinite(p[t]), `kiểu "${ten}" thiếu trường ${t}`);
  }

  // ⚠️ MỘT KIỂU KHÔNG AI DÙNG LÀ MỘT TRỤC CHẾT — nó không làm gì hỏng nên không có gì đỏ lên, và
  // nó tiêu công thiết kế cho một thứ không bao giờ tới được màn hình (bài học Phase 11).
  const dung = new Set(ERAS.map((e) => getHumanStyle(e).gait));
  assert.deepEqual([...dung].sort(), [...GAIT_KINDS].sort(),
    `kiểu đi không kỷ nào dùng: [${GAIT_KINDS.filter((k) => !dung.has(k))}]`);

  const dem = {};
  for (const e of ERAS) dem[getHumanStyle(e).gait] = (dem[getHumanStyle(e).gait] ?? 0) + 1;
  console.log(`[dáng đi] ${GAIT_KINDS.map((k) => `${k} ${dem[k]}`).join(' · ')}`);
});

test('HAI KỶ LIỀN NHAU KHÔNG ĐƯỢC ĐI GIỐNG NHAU', () => {
  // ⚠️ CANH ĐÚNG CHỖ NGƯỜI CHƠI ĐI QUA. Đàm đi lần lượt kỷ 1 → 15; hai kỷ dùng chung một kiểu ở xa
  // nhau thì không ai đặt cạnh nhau được, còn hai kỷ LIỀN NHAU dùng chung thì lần lên kỷ mới không
  // cho thấy gì mới ở đúng cái trục vừa được thêm vào. Cùng lý do với luật "cặp chặng gần nhau" của
  // `daylight.test.js`: cực tiểu trên TOÀN BỘ cặp là một con số gộp, nó không thấy chỗ này.
  for (let e = 1; e < 15; e += 1) {
    const a = getHumanStyle(e).gait;
    const b = getHumanStyle(e + 1).gait;
    assert.notEqual(a, b, `kỷ ${e} và kỷ ${e + 1} cùng đi kiểu "${a}"`);
  }
});

test('KHÔNG CÓ HAI KIỂU ĐI LÀ BẢN SAO CỦA NHAU — khác ở ÍT NHẤT 2 trong 4 trường', () => {
  const bang = allGaitProfiles();
  let yeuNhat = 4;
  for (let i = 0; i < bang.length; i += 1) {
    for (let j = i + 1; j < bang.length; j += 1) {
      const khac = TRUONG.filter((t) => bang[i][1][t] !== bang[j][1][t]).length;
      assert.ok(khac >= 2,
        `kiểu "${bang[i][0]}" và "${bang[j][0]}" chỉ khác nhau ${khac}/4 trường — một bản sao`);
      yeuNhat = Math.min(yeuNhat, khac);
    }
  }
  assert.equal(yeuNhat >= 2, true);
  console.log(`[dáng đi] 36 cặp kiểu · cặp giống nhau nhất còn khác ${yeuNhat}/4 trường`);
});

test('⚠️ DÂY NỐI: ĐỔI MỘT TRƯỜNG CỦA BẢNG THÌ TƯ THẾ PHẢI NHÚC NHÍCH — hỏi TỪNG TRƯỜNG MỘT', () => {
  // ⚠️ HỎI TỪNG CHIỀU MỘT, KHÔNG HỎI TỔNG. Gộp bốn trường vào một con số rồi đòi "nó có đổi không"
  // thì một trường chết vẫn lọt, vì ba trường còn sống đã làm con số ấy đổi (bài học Phase 10:
  // đối chứng cộng cả ba lệch 0,001 vào một dòng rồi hỏi `< 3`, nới một ngưỡng vẫn xanh).
  const doDuoc = GAIT_KINDS.map((k) => [k, chuKyDo(thanVoiDangDi(k))]);
  assert.equal(doDuoc.length, 9, 'gác chạy-rỗng: phải đo đủ 9 kiểu');

  for (const t of TRUONG) {
    const gt = new Set(doDuoc.map(([, m]) => m[t].toFixed(9)));
    assert.ok(gt.size >= 5,
      `trường \`${t}\` chỉ cho ra ${gt.size} giá trị khác nhau trên 9 kiểu đi — dây nối đã đứt,`
      + ' hoặc `humanPose.js` đang bỏ qua trường này (đúng hình dạng ADR-054).');
  }

  // Và mỗi trường phải thật sự KHÁC 0 ở ít nhất một kiểu — một dây nối "sống" mà luôn ra 0 thì
  // cũng là một dây đứt, chỉ đứt ở chỗ khác.
  for (const t of TRUONG) {
    assert.ok(doDuoc.some(([, m]) => Math.abs(m[t]) > 1e-9),
      `trường \`${t}\` ra 0 ở cả 9 kiểu đi`);
  }

  const ke = doDuoc.map(([k, m]) => `${k} chân↓${m.knee.toFixed(2)} lắc${(m.sway * 1000).toFixed(1)}`
    + ` vai${(m.twist * 1000).toFixed(1)}`);
  console.log(`[dáng đi] ${ke.join(' · ')}`);
});

test('MỌI KIỂU ĐI ĐỀU GIỮ ĐƯỢC BÀN CHÂN CẮM ĐẤT — 9 kiểu × 15 kỷ, không chỉ 15 cặp đã khai', () => {
  // ⚠️ MỘT TỔ HỢP MÀ BẢNG CHƯA DÙNG TỚI LÀ MỘT TỔ HỢP CHƯA ĐƯỢC KIỂM (bài học Phase 11: bài đối
  // xứng cũ chỉ chạm 8/11 kiểu vì bảng kỷ chưa khai ba kiểu kia, nên nó chỉ đỏ vào ngày có ai gán
  // giá trị mới). Ở đây tổ hợp thật là 9 × 15 = 135, còn bảng mới dùng 15.
  let dem = 0;
  let truotXauNhat = 0;
  for (const era of ERAS) {
    const goc = buildHumanBody(era);
    const legL = goc.parts.find((p) => p.id === 'legL');
    for (const kind of GAIT_KINDS) {
      const body = { ...goc, style: { ...goc.style, gait: kind } };
      const { cycle } = poseAt(body, 0);
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i <= 40; i += 1) {
        const t = (0.02 + (0.46 * i) / 40) * cycle;
        const chan = footContactAt(legL, poseAt(body, t));
        lo = Math.min(lo, t + chan.x);
        hi = Math.max(hi, t + chan.x);
        assert.ok(Math.abs(chan.y) < 1e-9,
          `kỷ ${era} kiểu "${kind}": bàn chân tiếp đất ở cao độ ${chan.y.toFixed(6)}`);
      }
      truotXauNhat = Math.max(truotXauNhat, hi - lo);
      dem += 1;
    }
  }
  assert.equal(dem, 135, 'gác chạy-rỗng: phải duyệt đủ 135 tổ hợp');
  assert.ok(truotXauNhat < 1e-9, `trượt ${truotXauNhat.toExponential(2)} ô`);
});

test('⚠️ ĐỐI CHỨNG: `sin` thay cho `sin²` PHẢI phá trần góc hông, và bộ kiểm PHẢI chặn `knee < 0,5`', () => {
  // Hai cách hỏng ĐÃ BIẾT, dựng lại nguyên văn rồi đòi phép đo bắt được. Không có phần này thì
  // chứng minh trong chú thích `legFactorAt` chỉ là một câu tự trấn an (bài học Phase 4G).
  const body = buildHumanBody(1);
  const style = getHumanStyle(1);
  const legLen = body.dims.legLen;
  const cycle = style.stride * legLen;
  const tranHong = Math.asin(Math.min(1, style.stride / 4));

  /** Góc hông lớn nhất nếu chân rút theo hàm `mu` (mũ 1 = `sin`, mũ 2 = `sin²`). */
  const gocMax = (mu, knee) => {
    let mx = 0;
    for (let i = 0; i <= 500; i += 1) {
      const p = 0.5 + (0.5 * i) / 500;
      const u = (p - 0.5) * 2;
      const off = -(cycle * 0.25) * Math.cos(Math.PI * u);
      const f = 1 - (1 - knee) * Math.abs(Math.sin(Math.PI * u)) ** mu;
      mx = Math.max(mx, Math.abs(Math.asin(Math.max(-1, Math.min(1, off / (legLen * f))))));
    }
    return mx;
  };

  assert.ok(gocMax(1, 0.74) > tranHong + 1e-6,
    'bản HỎNG (`sin` thay `sin²`) phải vượt trần — nếu không thì phép đo này không có răng');
  assert.ok(gocMax(2, 0.74) <= tranHong + 1e-9,
    'bản ĐÚNG (`sin²`) phải nằm trong trần');
  // Và định lý chỉ đúng khi `knee ≥ 0,5`: dưới ngưỡng ấy thì chính `sin²` cũng vỡ.
  assert.ok(gocMax(2, 0.30) > tranHong + 1e-6, 'với `knee = 0,30` thì `sin²` cũng phải vỡ');
  assert.equal(isValidGaitProfile({ knee: 0.30, sway: 0.1, twist: 0.5, headTrack: 0 }), false,
    'bộ kiểm phải TỪ CHỐI `knee < 0,5`, không được kẹp im lặng');

  // `legFactorAt` phải trả về ĐÚNG 1 trong pha tiếp đất — mọi bất biến cũ dựa vào con số ấy.
  for (let i = 0; i < 50; i += 1) assert.equal(legFactorAt((0.499 * i) / 50, 0.6), 1);
  assert.ok(Math.abs(legFactorAt(0.75, 0.6) - 0.6) < 1e-12, 'giữa pha đưa chân phải rút đúng `knee`');
  assert.ok(Math.abs(legFactorAt(0.5, 0.6) - 1) < 1e-12, 'hai đầu pha đưa chân phải trở về 1');
});

test('KIỂU LẠ RƠI VỀ MẶC ĐỊNH, KHÔNG NÉM — và bảng kỷ không được lợi dụng điều đó', () => {
  assert.deepEqual(gaitOf('không-có-kiểu-này'), gaitOf('saunter'), 'kiểu lạ phải rơi về `saunter`');
  assert.deepEqual(gaitOf(undefined), gaitOf('saunter'));
  assert.equal(isValidGait('không-có-kiểu-này'), false);
  assert.equal(isValidGait(undefined), false);
  // ⚠️ Nhưng KHÔNG dòng nào của bảng kỷ được dựa vào cái van ấy: một dòng khai sai sẽ đi qua van
  // trong im lặng và kỷ đó lặng lẽ đi kiểu `saunter`. Hỏi thẳng BẢNG THÔ, không hỏi `getHumanStyle`.
  for (const era of ERAS) {
    assert.ok(isValidGait(HUMAN_STYLES[era].gait),
      `kỷ ${era} khai kiểu đi "${HUMAN_STYLES[era].gait}" không tồn tại`);
  }
});

test('⚠️ BÀN CHÂN PHẢI RỜI MẶT ĐẤT LÚC ĐƯA CHÂN — và chân cứng đơ thì nó QUỆT ĐẤT', () => {
  // ⚠️ BÀI NÀY SINH RA TỪ MỘT PHÉP THỬ NGƯỢC KHÔNG NỔ. Bỏ hệ số rút chân khỏi `footContactAt` thì
  // **không một bài nào đỏ**, vì bài "chân không trượt" chỉ hỏi trong pha TIẾP ĐẤT, mà ở đó hệ số
  // luôn bằng 1. Tức con số ấy khi đó là một bất biến ĐÚNG THEO CẤU TẠO chứ không phải một cái gác
  // (bài học ADR-048: `if (co !== undefined) return co;` làm một bài test không thể đỏ). Nay có
  // một chỗ HỎI nó trong pha đưa chân.
  //
  // ⚠️ VÀ ĐÂY MỚI LÀ LÝ DO THẬT SỰ CỦA CÁI ĐẦU GỐI, KHÔNG PHẢI "CHO ĐẸP". Chân cứng dài đúng
  // `legLen` thì ở GIỮA pha đưa chân, hông đang ở độ cao `legLen · cos(0) = legLen` (chân trụ
  // thẳng đứng) còn chân đưa cũng duỗi thẳng xuống đúng `legLen` ⇒ bàn chân ở **đúng cao độ 0**:
  // nó QUỆT mặt đường. Đó chính là dáng đi compa của hình nhân đồ chơi, và nó là thứ mắt gọi là
  // "cử động như robot" trước cả khi nghĩ tới tay chân. Rút chân còn `knee` phần nâng bàn chân lên
  // đúng `legLen · (1 − knee)`.
  let dem = 0;
  const bang = [];
  for (const kind of GAIT_KINDS) {
    const body = thanVoiDangDi(kind);
    const legL = body.parts.find((p) => p.id === 'legL');
    const { cycle } = poseAt(body, 0);
    const legLen = body.dims.legLen;
    let thapNhat = Infinity;
    let caoNhat = -Infinity;
    // Pha 0,52 tới 0,98 — TRONG pha đưa chân của chân trái, chừa hai đầu (ở đó chân chạm đất).
    for (let i = 0; i <= 120; i += 1) {
      const p = 0.52 + (0.46 * i) / 120;
      const y = footContactAt(legL, poseAt(body, p * cycle)).y;
      thapNhat = Math.min(thapNhat, y);
      caoNhat = Math.max(caoNhat, y);
    }
    assert.ok(thapNhat > 0,
      `kiểu "${kind}": bàn chân tụt xuống ${thapNhat.toFixed(6)} ô DƯỚI mặt đất lúc đưa chân`);
    bang.push([kind, caoNhat / legLen]);
    dem += 1;
  }
  assert.equal(dem, 9, 'gác chạy-rỗng: phải đo đủ 9 kiểu');

  // ĐỐI CHỨNG: chân cứng đơ (`knee = 1`) phải cho ra đúng 0 ở giữa pha — quệt đất. Dựng thẳng bằng
  // công thức của mã sản phẩm để không có chỗ nào chép tay.
  const body = thanVoiDangDi('trudge');
  const legLen = body.dims.legLen;
  const nhacCung = legLen * (1 - legFactorAt(0.75, 1));
  assert.ok(Math.abs(nhacCung) < 1e-12,
    'chân cứng đơ phải quệt đúng mặt đất ở giữa pha — nếu không thì phép đo này không có răng');

  // Và độ nhấc phải XẾP ĐÚNG THỨ TỰ theo `knee`: rút nhiều thì nhấc cao. Một trục mà thứ tự đảo
  // được thì nó không so được gì (bài học `cadenceOf`, lỗi NHÃN).
  const theoKnee = [...bang].sort((a, b) => gaitOf(a[0]).knee - gaitOf(b[0]).knee);
  const theoNhac = [...bang].sort((a, b) => b[1] - a[1]);
  assert.deepEqual(theoKnee.map((r) => r[0]), theoNhac.map((r) => r[0]),
    'thứ tự nhấc chân không khớp thứ tự `knee` đã khai');
  console.log(`[dáng đi] nhấc chân cao nhất (phần chiều dài chân): `
    + theoNhac.map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join(' · '));
});
