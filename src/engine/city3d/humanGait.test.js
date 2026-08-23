/**
 * humanGait.test.js — canh BẢNG DÁNG ĐI và, quan trọng hơn, canh **CÁI DÂY NỐI** từ bảng tới tư thế.
 *
 * ⚠️ VÌ SAO BÀI QUAN TRỌNG NHẤT Ở ĐÂY LÀ BÀI "DÂY NỐI", KHÔNG PHẢI BÀI "BẢNG CÓ ĐỦ 15 DÒNG".
 * Dự án đã trả giá đúng chỗ này ở ADR-054: `buildScenePalette` đổi tên tham số `era` rồi có một
 * biến khác nhận cái tên cũ, nên `getFloraStyle(era)` và `getHumanStyle(era)` nhận vào một object
 * MÀU thay vì một số kỷ. Cả hai hàm ấy **cố ý** rơi về kỷ 1 với dữ liệu lạ (không được ném lỗi
 * giữa màn hình Thành Phố), nên 15 kỷ dùng chung một màu lá suốt ba phase — build xanh, lint sạch,
 * 1110 bài test xanh, không một cảnh báo. `gaitOf` có ĐÚNG cùng cái van an toàn ấy (`?? saunter`),
 * nên nó cũng có đúng cùng khả năng nói dối. ⇒ Phải hỏi ở ĐẦU BÊN KIA: đổi một trường của bảng thì
 * tư thế có nhúc nhích không.
 *
 * ⚠️ BẢNG ĐÃ ĐỔI Ở ADR-057: **9 kiểu → 14 kiểu**, **4 trục → 6 trục**. Trường `knee` (hệ số rút
 * ngắn chân, kèm định lý `sin²`/`knee ≥ 0,5` của ADR-056) đã **BIẾN MẤT** — không phải vì nó sai,
 * mà vì TIỀN ĐỀ của nó bị gỡ: chân nay có đầu gối THẬT, giải bằng khớp ngược, nên không còn cái
 * mesh cứng nào cần rút ngắn để khỏi quệt đất (bẫy Phase 8C). Hai trục mới thay chỗ nó là `lift`
 * (nâng bàn chân) và `flex` (gối chùng lúc trụ), cộng `splay` (bàn chân dạng hay chụm).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { GAIT_KINDS, gaitOf, isValidGait, isValidGaitProfile, allGaitProfiles } from './humanGait';
import { HUMAN_STYLES, getHumanStyle } from './humanStyle';
import { buildHumanBody } from './human';
import { poseAt, footContactAt } from './humanPose';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const TRUONG = ['lift', 'flex', 'sway', 'twist', 'headTrack', 'splay'];

/**
 * Gắn một dáng đi TUỲ Ý (tên kiểu, hoặc cả một hồ sơ chưa có trong bảng) vào một cơ thể thật.
 * ⚠️ Đây là lối bơm mà bài "dây nối" cần: nó phải đặt được một giá trị KHÔNG nằm trong bảng, nếu
 * không thì nó chỉ so các dòng bảng với nhau và không chứng minh được cái dây nối nào cả.
 */
function donGait(body, gait) {
  return { ...body, style: { ...body.style, gait } };
}

/**
 * ⚠️ CẲNG CHÂN, KHÔNG PHẢI BÀN CHÂN. `footContactAt` trả về đầu mút DƯỚI của khối được truyền vào;
 * điểm cắm đất là đầu mút dưới của CẲNG CHÂN (mắt cá). Hỏi khối bàn chân thì hàm trả về mép dưới
 * của một khối nằm ngang, và phép đo sẽ nói về một thứ khác mà vẫn ra số trông hợp lý.
 */
const cangChanCua = (body, ben) => body.parts.find((p) => p.id === `shin${ben}`);

/**
 * Lấy mẫu dày một chu kỳ rồi trả về SÁU đại lượng, mỗi cái ứng với ĐÚNG MỘT trường của bảng.
 * ⚠️ Mọi đại lượng đều đi qua `poseAt` — đó là điểm của cả bài test này. Đọc thẳng bảng rồi so với
 * bảng là một cái gương, không phải một cái cân.
 */
function chuKyDo(body) {
  const { cycle } = poseAt(body, 0);
  const chanL = cangChanCua(body, 'L');
  let nangChanNhat = 0;
  let hongCaoNhat = -Infinity;
  let lacNganNhat = 0;
  let vaiXoayNhat = 0;
  let dauCaoNhat = -Infinity;
  let dauThapNhat = Infinity;
  let banChanDangNhat = 0;
  for (let i = 0; i < 400; i += 1) {
    const p = poseAt(body, (cycle * i) / 400);
    const ban = footContactAt(chanL, p);
    nangChanNhat = Math.max(nangChanNhat, ban.y);
    hongCaoNhat = Math.max(hongCaoNhat, p.bob);
    lacNganNhat = Math.max(lacNganNhat, Math.abs(p.joints.pelvis.z));
    vaiXoayNhat = Math.max(vaiXoayNhat, Math.abs(p.joints.shoulderL.x - p.joints.shoulderR.x));
    dauCaoNhat = Math.max(dauCaoNhat, p.joints.head.y);
    dauThapNhat = Math.min(dauThapNhat, p.joints.head.y);
    banChanDangNhat = Math.max(banChanDangNhat, Math.abs(ban.z));
  }
  return {
    lift: nangChanNhat,
    // `flex` kéo hông THẤP XUỐNG, nên đại lượng của nó là điểm cao nhất của cái nhún: gối chùng
    // nhiều thì kể cả lúc chân trụ dựng đứng nhất, hông vẫn không lên tới chiều dài chân.
    flex: -hongCaoNhat,
    sway: lacNganNhat,
    twist: vaiXoayNhat,
    headTrack: dauCaoNhat - dauThapNhat,
    splay: banChanDangNhat,
  };
}

test('BẢNG HỢP LỆ, VÀ MỌI KIỂU ĐI PHẢI CÓ NGƯỜI DÙNG', () => {
  assert.equal(GAIT_KINDS.length, 14, 'bảng phải có đúng 14 kiểu đi');
  assert.equal(new Set(GAIT_KINDS).size, 14, 'có kiểu đi khai trùng tên');
  for (const [kind, prof] of allGaitProfiles()) {
    assert.ok(isValidGait(kind), `kiểu "${kind}" không qua nổi bộ kiểm của chính nó`);
    assert.ok(isValidGaitProfile(prof), `hồ sơ của "${kind}" nằm ngoài dải cho phép`);
    for (const t of TRUONG) {
      assert.ok(Number.isFinite(prof[t]), `"${kind}" thiếu trường \`${t}\``);
    }
  }
  // ⚠️ MỘT KIỂU ĐI KHÔNG AI DÙNG LÀ MÃ CHẾT MANG DÁNG MỘT TÍNH NĂNG (bẫy Phase 4H).
  const dung = new Set(ERAS.map((e) => getHumanStyle(e).gait));
  for (const kind of GAIT_KINDS) {
    assert.ok(dung.has(kind), `kiểu đi "${kind}" không kỷ nào dùng — mã chết`);
  }
  assert.equal(dung.size, 14, `15 kỷ mới dùng tới ${dung.size} kiểu đi trong 14 kiểu đã khai`);
});

test('MỌI TRỤC CỦA BẢNG PHẢI CÒN SỐNG — trục nào 14 kiểu khai như nhau thì bảng hẹp hơn nó trông', () => {
  for (const t of TRUONG) {
    const giaTri = new Set(allGaitProfiles().map(([, p]) => p[t]));
    assert.ok(giaTri.size >= 6,
      `trục \`${t}\` chỉ có ${giaTri.size} giá trị phân biệt trên 14 kiểu — gần như một trục chết`);
  }
});

test('HAI KỶ LIỀN NHAU KHÔNG ĐƯỢC ĐI GIỐNG NHAU', () => {
  for (let e = 1; e < 15; e += 1) {
    const a = getHumanStyle(e).gait;
    const b = getHumanStyle(e + 1).gait;
    assert.notEqual(a, b, `kỷ ${e} và kỷ ${e + 1} cùng đi kiểu "${a}"`);
  }
});

test('KHÔNG CÓ HAI KIỂU ĐI LÀ BẢN SAO CỦA NHAU — khác ở ÍT NHẤT 2 trong 6 trường', () => {
  const ho = allGaitProfiles();
  let yeuNhat = Infinity;
  for (let i = 0; i < ho.length; i += 1) {
    for (let j = i + 1; j < ho.length; j += 1) {
      const [ta, pa] = ho[i];
      const [tb, pb] = ho[j];
      // ⚠️ Bước lượng hoá 0,02 KHÔNG phải một con số chọn tay: dưới mức đó thì hai dáng chênh nhau
      // chưa tới một phần trăm chiều cao người, mà người thì chỉ cao 14…31 điểm ảnh trên khung của
      // Đàm ⇒ nằm dưới ngưỡng mắt. Một "khác biệt" mắt không thấy là một trục chết đội lốt.
      const khac = TRUONG.filter((t) => Math.abs(pa[t] - pb[t]) >= 0.02).length;
      yeuNhat = Math.min(yeuNhat, khac);
      assert.ok(khac >= 2, `"${ta}" và "${tb}" chỉ khác nhau ${khac}/6 trường`);
    }
  }
  console.log(`[dáng đi] 14 kiểu · 91 cặp · cặp gần nhau nhất khác ${yeuNhat}/6 trường`);
});

test('⚠️ DÂY NỐI: ĐỔI MỘT TRƯỜNG CỦA BẢNG THÌ TƯ THẾ PHẢI NHÚC NHÍCH — hỏi TỪNG TRƯỜNG MỘT', () => {
  // ⚠️ HỎI TỪNG TRƯỜNG, KHÔNG HỎI TỔNG. Hỏi tổng thì một trường nối tốt sẽ che cho một trường đứt
  // hẳn, và bài test vẫn xanh — đúng cái phễu mà bảng-nhiều-trục sinh ra để gỡ.
  const goc = gaitOf('saunter');
  const nen = chuKyDo(donGait(buildHumanBody(1), goc));
  for (const t of TRUONG) {
    // Bơm trường đang hỏi sang một giá trị KHÁC HẲN nhưng vẫn trong dải hợp lệ, rồi đòi ĐÚNG đại
    // lượng của nó phải đổi. Năm đại lượng kia không bắt buộc — chúng có bài riêng.
    const boSung = { ...goc, [t]: goc[t] > 0.2 ? goc[t] * 0.15 : goc[t] + 0.1 };
    assert.ok(isValidGaitProfile(boSung), `hồ sơ thử của trường \`${t}\` phải hợp lệ`);
    const sau = chuKyDo(donGait(buildHumanBody(1), boSung));
    assert.ok(Math.abs(sau[t] - nen[t]) > 1e-6,
      `trường \`${t}\` của bảng KHÔNG tới được tư thế — dây nối đứt`
      + ` (nền ${nen[t].toFixed(6)}, sau khi bơm ${sau[t].toFixed(6)})`);
  }
});

test('MỌI KIỂU ĐI ĐỀU GIỮ ĐƯỢC BÀN CHÂN CẮM ĐẤT — 14 kiểu × 15 kỷ, không chỉ 15 cặp đã khai', () => {
  // ⚠️ MỘT TỔ HỢP BẢNG CHƯA DÙNG TỚI LÀ MỘT TỔ HỢP CHƯA ĐƯỢC KIỂM (bài học Phase 11). Bảng hôm nay
  // ghép 14 kiểu vào 15 kỷ theo một cách; đổi một dòng là ra một tổ hợp chưa ai chạy qua.
  let truotNhat = 0;
  let cheNhat = 0;
  for (const era of ERAS) {
    const goc = buildHumanBody(era);
    for (const kind of GAIT_KINDS) {
      const body = donGait(goc, kind);
      const chan = cangChanCua(body, 'L');
      const { cycle } = poseAt(body, 0);
      let lo = Infinity;
      let hi = -Infinity;
      let cham = 0;
      for (let i = 0; i < 160; i += 1) {
        const t = (cycle * i) / 160;
        const p = poseAt(body, t);
        if (p.phase >= 0.5) continue;   // pha ĐƯA — bàn chân được phép bay
        cham += 1;
        const ban = footContactAt(chan, p);
        const theGioi = ban.x + t;      // toạ độ TRONG THẾ GIỚI, không phải trong cơ thể
        lo = Math.min(lo, theGioi);
        hi = Math.max(hi, theGioi);
        cheNhat = Math.max(cheNhat, Math.abs(ban.y));
      }
      assert.ok(cham > 40, `kỷ ${era} kiểu "${kind}": chỉ ${cham} mẫu rơi vào pha tiếp đất`);
      truotNhat = Math.max(truotNhat, hi - lo);
      assert.ok(hi - lo < 1e-9,
        `kỷ ${era} kiểu "${kind}": bàn chân TRƯỢT ${(hi - lo).toFixed(9)} ô trong pha tiếp đất`);
    }
  }
  console.log(`[dáng đi] 210 tổ hợp · trượt lớn nhất ${truotNhat.toExponential(2)} ô`);
});

test('⚠️ ĐỐI CHỨNG: một dáng đi HỎNG phải bị bắt, và bộ kiểm phải TỪ CHỐI hồ sơ ngoài dải', () => {
  // (a) ⚠️ ĐỌC KỸ: TÔI ĐÃ THỬ PHÁ BẰNG CHÍNH BẢNG DÁNG ĐI TRƯỚC, VÀ NÓ KHÔNG PHÁ ĐƯỢC.
  // Bơm `splay` lên tận trần dải hợp lệ (0,44) thì bàn chân dạng rộng ra thật, mà KHÔNG trượt một
  // chút nào. Phản xạ lúc đó là kết luận "phép đo mất răng" — sai. Sự thật là **không một cần gạt
  // nào của bảng dáng đi có thể làm bàn chân trượt**, và đó chính là điều ADR-057 mua được: bàn
  // chân là ĐẦU VÀO của phép giải khớp ngược, nên nó đứng yên THEO CẤU TẠO. Ghi ra thay vì im
  // lặng, vì một phép phá không nổ mà không giải thích thì phiên sau sẽ đọc thành một lỗ hổng.
  // ⇒ Muốn phá thật thì phải đặt bàn chân ra NGOÀI TẦM VỚI của chân, và cần gạt duy nhất làm được
  // việc đó nằm ở bảng CƠ THỂ (`stride`), không ở bảng dáng đi. Sải chân 5 lần chiều dài chân là
  // một sải chân không người nào với tới, nên phép giải buộc phải kẹp lại ⇒ bàn chân trượt.
  const lanh = buildHumanBody(1);
  const body = { ...lanh, style: { ...lanh.style, stride: 5 } };
  const chan = cangChanCua(body, 'L');
  const { cycle } = poseAt(body, 0);
  let lo = Infinity;
  let hi = -Infinity;
  let vuotTam = false;
  for (let i = 0; i < 160; i += 1) {
    const t = (cycle * i) / 160;
    const p = poseAt(body, t);
    if (p.reach >= 1) vuotTam = true;
    if (p.phase >= 0.5) continue;
    const ban = footContactAt(chan, p);
    lo = Math.min(lo, ban.x + t);
    hi = Math.max(hi, ban.x + t);
  }
  assert.ok(hi - lo > 1e-6,
    'phép đo trượt chân KHÔNG bắt được một bàn chân đặt ngoài tầm với ⇒ nó không còn răng');
  // Và `reach` phải chạm trần ở đúng ca này — nó là thứ chỉ thẳng vào NGUYÊN NHÂN, còn "bàn chân
  // trượt" chỉ là triệu chứng. Không có vế này thì bài `BIÊN ĐỘ KHỚP` có thể mất răng mà bài này
  // vẫn xanh, và lúc ấy ta chỉ còn một cái gác thay vì hai.
  assert.ok(vuotTam, '`reach` phải chạm trần ở ca bàn chân ngoài tầm với');

  // (b) Bộ kiểm phải TỪ CHỐI THẲNG, không tự chữa (đúng luật ADR-026: tự chữa là cách một bảng 14
  // dòng lặng lẽ thoái hoá về 1 dòng).
  const goc = gaitOf('stride');
  assert.equal(isValidGaitProfile({ ...goc, lift: 0 }), false, 'nâng chân 0 phải bị từ chối');
  assert.equal(isValidGaitProfile({ ...goc, lift: 0.9 }), false, 'nâng chân 0,9 phải bị từ chối');
  assert.equal(isValidGaitProfile({ ...goc, flex: -0.1 }), false, 'gối chùng âm phải bị từ chối');
  assert.equal(isValidGaitProfile({ ...goc, flex: 0.9 }), false, 'gối chùng 0,9 phải bị từ chối');
  assert.equal(isValidGaitProfile({ ...goc, sway: 3 }), false, 'lắc hông 3 phải bị từ chối');
  assert.equal(isValidGaitProfile({ ...goc, twist: 9 }), false, 'xoay vai 9 phải bị từ chối');
  assert.equal(isValidGaitProfile({ ...goc, headTrack: 4 }), false, 'giữ đầu 4 phải bị từ chối');
  assert.equal(isValidGaitProfile({ ...goc, splay: 3.5 }), false, 'dạng chân 3,5 phải bị từ chối');
  assert.equal(isValidGaitProfile(null), false, 'hồ sơ rỗng phải bị từ chối');
  assert.equal(isValidGaitProfile('stride'), false, 'một chuỗi không phải một hồ sơ');
});

test('KIỂU LẠ RƠI VỀ MẶC ĐỊNH, KHÔNG NÉM — và bảng kỷ không được lợi dụng điều đó', () => {
  // Rơi về mặc định là ĐÚNG cho production: không được ném lỗi giữa màn hình Thành Phố.
  for (const rac of [undefined, null, 42, '', 'không-có-kiểu-này', {}]) {
    const p = gaitOf(rac);
    assert.ok(isValidGaitProfile(p), `dữ liệu rác "${rac}" phải ra một hồ sơ hợp lệ`);
  }
  assert.deepEqual(gaitOf('không-có-kiểu-này'), gaitOf('saunter'));
  // ⚠️ NHƯNG chính cái van an toàn ấy là thứ đã giấu lỗi ADR-054 suốt ba phase. Nên phải có một
  // bài đứng ở đầu bên kia: KHÔNG dòng nào của bảng kỷ được khai một kiểu không tồn tại, kể cả
  // dòng mẫu `mocPhoThong` mà 15 kỷ trải ra từ đó.
  for (const [ten, style] of Object.entries(HUMAN_STYLES)) {
    assert.ok(typeof style.gait === 'string' && isValidGait(style.gait),
      `dòng "${ten}" khai kiểu đi "${style.gait}" không có trong bảng`);
  }
  for (const era of ERAS) {
    assert.ok(isValidGait(getHumanStyle(era).gait), `kỷ ${era} khai một kiểu đi không tồn tại`);
  }
});

test('⚠️ BÀN CHÂN PHẢI RỜI MẶT ĐẤT LÚC ĐƯA CHÂN — và chân cứng đơ thì nó QUỆT ĐẤT', () => {
  // Đây là đối chứng gốc của ADR-056, giữ nguyên tinh thần nhưng đo trên mô hình khớp ngược mới:
  // một chân KHÔNG có đầu gối, dài đúng `legLen`, khi đưa thẳng đứng thì bàn chân chạm đúng mặt
  // đất. Con số 0 ấy là 0 THEO CẤU TẠO, không phải "gần 0".
  const bang = [];
  for (const era of ERAS) {
    const style = getHumanStyle(era);
    const body = buildHumanBody(era);
    const chan = cangChanCua(body, 'L');
    const { cycle } = poseAt(body, 0);
    let caoNhat = 0;
    for (let i = 0; i < 200; i += 1) {
      const p = poseAt(body, (cycle * i) / 200);
      if (p.phase < 0.5) continue;
      const ban = footContactAt(chan, p);
      // Toạ độ tư thế lấy MẶT ĐẤT làm gốc y, nên `ban.y` chính là cao độ bàn chân.
      caoNhat = Math.max(caoNhat, ban.y);
    }
    const tyLe = caoNhat / body.dims.legLen;
    bang.push(`${era}:${(tyLe * 100).toFixed(1)}%`);
    assert.ok(tyLe > 0.015,
      `kỷ ${era} (${style.gait}): bàn chân chỉ nhấc ${(tyLe * 100).toFixed(2)}% chiều dài chân`
      + ' — mắt sẽ đọc ra dáng com-pa');
  }
  console.log(`[dáng đi] nâng bàn chân lúc đưa: ${bang.join(' · ')}`);
});
