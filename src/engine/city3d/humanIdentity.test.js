/**
 * humanIdentity.test.js — 15 KỶ CÓ RA 15 DÂN TỘC KHÔNG?
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO CÓ HAI PHÉP CHẤM CHỨ KHÔNG PHẢI MỘT — ĐỌC TRƯỚC KHI SỬA BẤT KỲ NGƯỠNG NÀO
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `humanStyle.test.js` chỉ hỏi *"kỷ này có khác MỐC PHỔ THÔNG không"*. Câu ấy đủ khi mới có một kỷ
 * được thiết kế, và VÔ DỤNG khi có đủ 15: mười lăm kỷ đều khác preset ở 8 trục vẫn có thể giống
 * hệt NHAU. Đây là bài thay thế, đúng khuôn `streetStyle.test.js` (105 cặp × N trục).
 *
 * ⚠️ NHƯNG KHÔNG ĐƯỢC CHÉP KHUÔN ẤY NGUYÊN XI, VÌ MỘT SỰ THẬT ĐÃ ĐO ĐƯỢC: **phần lớn các trục của
 * bảng người nằm DƯỚI ngưỡng mắt ở cỡ thật.** Một cư dân cao 18,3 điểm ảnh trên khung 990×614 của
 * Đàm (`scripts/human-scale.mjs`), còn ngưỡng mắt của dự án là `EYE_PIXELS = 4`. Đo TRẢI RỘNG TỐI
 * ĐA của từng trục qua cả 15 kỷ, quy ra điểm ảnh:
 *
 *     stature   4,34 px  ← trên ngưỡng (vừa đủ)
 *     legShare  3,13 px  ← DƯỚI
 *     armSwing  3,01 px  ← DƯỚI
 *     build     2,05 px  ← DƯỚI
 *     stance    1,35 px  ← DƯỚI
 *
 * Nghĩa là bốn trục ấy **không thể** một mình tách được hai kỷ trên màn hình, kể cả khi khai hai
 * giá trị xa nhất bảng. Chấm chúng ngang hàng với `garment` (đổi hẳn hình khối thân) hay `spear`
 * (một vệt dọc 22,7 điểm ảnh) là tự cho mình điểm — đúng cái bẫy "một con số đúng trả lời sai câu
 * hỏi" (Performance Gate vòng 2, 2026-08-17).
 *
 * ⇒ HAI PHÉP CHẤM, HAI CÂU HỎI KHÁC HẲN NHAU:
 *   (A) **BẢNG CÓ THẬT KHÔNG** — 9 trục, bước lượng hoá bằng "một quyết định thiết kế thật".
 *       Trả lời: người điền bảng có thật sự quyết 15 lần khác nhau, hay chép một dòng 15 lượt?
 *   (B) **ĐÀM CÓ THẤY KHÔNG** — chỉ những trục ĐO ĐƯỢC là trên ngưỡng mắt.
 *       Trả lời: trên màn hình thật, hai kỷ bất kỳ có đọc ra là hai dân tộc không?
 * Cả hai đều cần. Chỉ (A) thì bảng đẹp trên giấy mà màn hình vẫn một màu; chỉ (B) thì bảng bị bào
 * mòn dần về vài cái cờ có/không.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { HUMAN_STYLES, cadenceOf, getHumanStyle } from './humanStyle.js';
import { buildHumanBody, humanDims } from './human.js';
import { EYE_PIXELS } from './streetStyle.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

/**
 * ⚠️ HAI CON SỐ HIỆU CHUẨN, CẢ HAI ĐỀU LÀ SỐ ĐO, KHÔNG PHẢI SỐ CHỌN.
 * `EYE_PIXELS` nhập từ `streetStyle.js` — MỘT bản duy nhất cho cả dự án (bài học `TECH_DEBT #42`:
 * hai con số hiệu chuẩn của mắt từng chỉ là bản chép tay nằm trong file test, nên mã sản phẩm mù).
 * `CAO_ĐIỂM_ẢNH` đo bằng `node --import ./scripts/register-esm-loader.mjs scripts/human-scale.mjs`
 * trên khung 3D THẬT 990×614 (đo lại bằng `shot.mjs --probe` ngày 2026-08-23). Đổi bố cục màn
 * Thành Phố hoặc đổi camera ⇒ PHẢI đo lại con số này, y như luật đã ghi cho `TEXT_ENDS_PCT`.
 */
const CAO_ĐIỂM_ẢNH = 18.3;
const MẮT_MÀU = 12 / 255;

const dimsCủa = (era) => humanDims(getHumanStyle(era));
/** Quy một độ dài trong hệ toạ độ người sang điểm ảnh trên khung thật. */
const raĐiểmẢnh = (dài, era) => (dài / dimsCủa(era).height) * CAO_ĐIỂM_ẢNH;

// ⚠️ HAI HÀM DƯỚI ĐÂY TÌM BỘ PHẬN THEO `id`, KHÔNG THEO `role` HAY `joint` — và đó là một bản vá,
// không phải sở thích. Bản trước hỏi `role === 'gear'` để lấy đồ mang theo, nhưng **mũ trụ kỷ 12
// cũng mang vai `gear`** và nó đứng TRƯỚC trong danh sách hộp ⇒ `find` trả về cái mũ, nên trục
// "đồ mang" của kỷ 12 xưa nay đo nhầm cái mũ thay vì khẩu súng (2,2 thay vì 22,7 điểm ảnh). Bản
// trước hỏi `joint === 'head' && role !== 'skin'` để lấy đội đầu, mà **cái vò kỷ 2 cũng đội trên
// đầu** — nó chỉ đúng nhờ thứ tự hộp, tức đúng nhờ một thứ chẳng liên quan (bẫy Phase 7D).
// Đây đúng là bài học Phase 8A: *vai màu là VẬT LIỆU, không phải CHỨC NĂNG* — hỏi theo nó thì
// nguyên mẫu này tàng hình và nguyên mẫu kia nhận vơ.

/** Bề rộng khối đội đầu (điểm ảnh). 0 nghĩa là đầu trần. */
function rộngĐộiĐầu(era) {
  const q = buildHumanBody(era).parts.find((x) => x.id === 'headgear');
  return q ? raĐiểmẢnh(q.w, era) : 0;
}

/** Cạnh LỚN NHẤT của đồ mang theo (điểm ảnh). Cây giáo dài 22,7; cái cặp chỉ 2,2. */
function cỡĐồMang(era) {
  const q = buildHumanBody(era).parts.find((x) => x.id === 'carry');
  return q ? raĐiểmẢnh(Math.max(q.w, q.h, q.d), era) : 0;
}

const khoảngCáchMàu = (a, b) => {
  // Hue là góc ⇒ phải quấn vòng, nếu không thì 355° và 5° đọc thành xa nhau nhất.
  const dh = Math.min(Math.abs(a.hue - b.hue), 360 - Math.abs(a.hue - b.hue)) / 180;
  return Math.max(Math.abs(a.light - b.light), Math.abs(a.sat - b.sat), dh * a.sat * b.sat);
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// (A) BẢNG CÓ THẬT KHÔNG — 9 trục, bước = "một quyết định thiết kế thật"
// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ⚠️ CÁC BƯỚC DƯỚI ĐÂY KHÔNG PHẢI NGƯỠNG MẮT, và đừng đọc chúng như thế. Chúng chỉ trả lời "chênh
// lệch này có phải một quyết định, hay là bụi?". Chúng đủ thô để một bảng chênh nhau 0,001 bị TỪ
// CHỐI (có đối chứng bên dưới) và đủ mịn để không nuốt mất một quyết định thật.
const BƯỚC = { stature: 0.03, build: 0.04, legShare: 0.02, stance: 0.03, armSwing: 0.05 };
const BƯỚC_NHỊP = 0.12;  // 12% — dưới mức này thì hai dáng đi cùng nhịp

const TÊN_TRỤC_A = ['tầm vóc', 'bề ngang', 'tỉ lệ chân', 'dáng đứng',
  'trang phục', 'đội đầu', 'đồ mang', 'nhịp bước', 'vung tay'];

function vectorA(era) {
  const s = getHumanStyle(era);
  return [
    Math.round(s.stature / BƯỚC.stature),
    Math.round(s.build / BƯỚC.build),
    Math.round(s.legShare / BƯỚC.legShare),
    Math.round(s.stance / BƯỚC.stance),
    s.garment,
    khoáĐộiĐầu(era),
    s.carry,
    Math.round(Math.log(cadenceOf(s)) / Math.log(1 + BƯỚC_NHỊP)),
    Math.round(s.armSwing / BƯỚC.armSwing),
  ];
}

/**
 * "ĐỘI ĐẦU" LÀ HÌNH **CỘNG** VẬT LIỆU — mũ rơm Firenze và mũ phớt New York cùng là `brim` nhưng
 * chênh nhau 0,5 độ đậm, tức mắt đọc ra hai thứ khác hẳn.
 *
 * ⚠️ NHƯNG VẬT LIỆU CHỈ ĐƯỢC TÍNH KHI NÓ THẬT SỰ TỚI ĐƯỢC HÌNH. Năm kỷ có `headMaterial` TRƠ
 * (không đội gì · búi tóc lấy vai `hair` · mũ trụ lấy vai `gear`); nhét vật liệu vào khoá ở những
 * kỷ ấy thì kỷ 3 và kỷ 13 — cả hai đều đầu trần — sẽ bị chấm là "khác nhau", tức phép chấm tự bịa
 * ra một khác biệt không có trên màn hình. Nên: hỏi thẳng VAI MÀU mà `buildHumanBody` dựng ra, chứ
 * không đọc trường trong bảng. Danh sách kỷ trơ được khoá riêng ở `humanStyle.test.js`.
 */
function khoáĐộiĐầu(era) {
  const hg = buildHumanBody(era).parts.find((x) => x.id === 'headgear');
  const vai = hg?.role;
  return vai === 'straw' || vai === 'cloth2'
    ? `${getHumanStyle(era).headgear}/${vai}`
    : getHumanStyle(era).headgear;
}

const sốTrụcKhácA = (x, y) => vectorA(x).filter((v, t) => v !== vectorA(y)[t]).length;
const trụcKhácA = (x, y) => TÊN_TRỤC_A.filter((_, t) => vectorA(x)[t] !== vectorA(y)[t]);

test('(A) 15 KỶ RA 15 BẢNG NGƯỜI — duyệt đủ 105 CẶP, không phải danh sách theo thứ tự', () => {
  // ⚠️ TỔ HỢP ĐÔI, KHÔNG PHẢI VÒNG LẶP THEO THỨ TỰ. Bài học `daylight.test.js`: duyệt danh sách
  // theo thứ tự thì kỷ đầu và kỷ cuối KHÔNG BAO GIỜ được đem so với nhau, và lỗi sống sót qua mọi
  // lần chạy test.
  const cặp = [];
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      cặp.push({ a: ERAS[i], b: ERAS[j], k: sốTrụcKhácA(ERAS[i], ERAS[j]) });
    }
  }
  assert.equal(cặp.length, 105, 'phải duyệt đủ tổ hợp đôi');
  cặp.sort((x, y) => x.k - y.k);

  const yếu = cặp[0];
  assert.ok(yếu.k >= 4,
    `kỷ ${yếu.a}↔${yếu.b} chỉ khác nhau ${yếu.k}/9 trục (${trụcKhácA(yếu.a, yếu.b).join(', ')})`
    + ' — ĐỪNG nới ngưỡng: sửa BẢNG, và sửa bằng một lý do lịch sử viết được vào `note`');

  // ⚠️ CỰC TIỂU LÀ MỘT CON SỐ GỘP. "Cặp yếu nhất = 4" đứng yên y hệt dù có MỘT cặp yếu hay BỐN
  // MƯƠI. Bốn mươi cặp yếu nghĩa là cả bảng đang dẹt lại mà cực tiểu không hé một lời.
  const trungVị = cặp[Math.floor(cặp.length / 2)].k;
  assert.ok(trungVị >= 6, `trung vị 105 cặp chỉ còn ${trungVị}/9 trục — bảng đang dẹt lại`);

  // KỶ LIỀN NHAU: đây là chỗ Đàm THẬT SỰ đi qua khi lên kỷ.
  for (let e = 1; e < 15; e += 1) {
    const k = sốTrụcKhácA(e, e + 1);
    assert.ok(k >= 5,
      `kỷ ${e} sang kỷ ${e + 1} con người chỉ đổi ${k}/9 trục (${trụcKhácA(e, e + 1).join(', ')})`
      + ' — đây là chỗ Đàm nhìn thấy sự chuyển kỷ, nó phải rõ hơn một cặp kỷ xa nhau');
  }

  // MỖI TRỤC PHẢI CÒN SỐNG. Một trục mà cả 15 kỷ khai giống hệt nhau vẫn nằm trong bảng, vẫn được
  // đọc, vẫn làm bảng trông phong phú — mà không tách được cặp nào. Đúng hình dạng cơ chế "lùm cây"
  // chết trong im lặng ở Phase 8D.
  const sốGiáTrị = TÊN_TRỤC_A.map((_, t) => new Set(ERAS.map((e) => vectorA(e)[t])).size);
  for (let t = 0; t < TÊN_TRỤC_A.length; t += 1) {
    assert.ok(sốGiáTrị[t] >= 3,
      `trục "${TÊN_TRỤC_A[t]}" chỉ có ${sốGiáTrị[t]} giá trị trên cả 15 kỷ — gần như một trục chết`);
  }

  console.log(`[humanIdentity] (A) bảng: 105 cặp · yếu nhất ${cặp[0].k}/9 (kỷ ${cặp[0].a}↔${cặp[0].b})`
    + ` · trung vị ${trungVị}/9 · mạnh nhất ${cặp[104].k}/9`
    + ` · số giá trị mỗi trục: ${sốGiáTrị.join('/')}`);
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// (B) ĐÀM CÓ THẤY KHÔNG — CHỈ những trục ĐO ĐƯỢC là trên ngưỡng mắt
// ═════════════════════════════════════════════════════════════════════════════════════════════════
test('(B) HAI KỶ BẤT KỲ PHẢI KHÁC NHAU Ở ÍT NHẤT MỘT THỨ MẮT ĐỌC ĐƯỢC Ở 18 ĐIỂM ẢNH', () => {
  // Bốn thứ dưới đây được chọn vì ĐO ĐƯỢC là trên ngưỡng, không phải vì nghe hợp lý:
  //   · `trang phục` — đổi hẳn hình khối thân (áo chùng nuốt chân so với sơ mi bó sát).
  //   · `đội đầu`   — BỀ RỘNG ĐO ĐƯỢC chia cho `EYE_PIXELS`, **cộng VẬT LIỆU** (sợi mộc nhạt so
  //                   với vải nhuộm sẫm chênh tới 0,61 độ đậm ở kỷ 6 — xa trên ngưỡng 12/255),
  //                   chứ KHÔNG theo tên
  //                   kiểu: búi tóc kỷ 1 chỉ 1,7 điểm ảnh nên nó rơi CÙNG bậc với đầu trần, và
  //                   điều đó là ĐÚNG (xem `TECH_DEBT #78` — trục đội đầu của kỷ 1 gần như không
  //                   trả về gì ngay cả trên máy đích).
  //   · `đồ mang`   — cũng lượng hoá theo cạnh lớn nhất ĐO ĐƯỢC: cây giáo 22,7 điểm ảnh và cái
  //                   cặp 2,2 điểm ảnh không thể được tính ngang nhau.
  //   · `màu vải`   — ngưỡng 12/255 đã hiệu chuẩn từ Phase 3Y.
  //   · `nhịp bước` — trục THỜI GIAN, nên nó không bị giới hạn bởi 18 điểm ảnh; mắt phân biệt nhịp
  //                   tốt hơn nhiều so với phân biệt bề ngang.
  // ⚠️ `build`/`legShare`/`stance`/`armSwing` CỐ Ý KHÔNG có mặt: trải rộng tối đa của chúng lần
  // lượt là 2,05 · 3,13 · 1,35 · 3,01 điểm ảnh — đều dưới 4. Chúng vẫn có ích (chúng cộng dồn vào
  // đường bao), nhưng chúng KHÔNG được tính là một lý do để nói "hai kỷ này khác nhau".
  const vectorB = (era) => {
    const s = getHumanStyle(era);
    return {
      garment: s.garment,
      mũ: `${Math.round(rộngĐộiĐầu(era) / EYE_PIXELS)}|${khoáĐộiĐầu(era)}`,
      mang: Math.round(cỡĐồMang(era) / EYE_PIXELS),
      nhịp: Math.round(Math.log(cadenceOf(s)) / Math.log(1 + BƯỚC_NHỊP)),
      cloth: s.cloth,
    };
  };

  const yếu = [];
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      const a = vectorB(ERAS[i]); const b = vectorB(ERAS[j]);
      const khác = [];
      if (a.garment !== b.garment) khác.push('trang phục');
      if (a.mũ !== b.mũ) khác.push('đội đầu');
      if (a.mang !== b.mang) khác.push('đồ mang');
      if (a.nhịp !== b.nhịp) khác.push('nhịp bước');
      if (khoảngCáchMàu(a.cloth, b.cloth) >= MẮT_MÀU) khác.push('màu vải');
      if (khác.length === 0) yếu.push(`${ERAS[i]}↔${ERAS[j]}`);
    }
  }
  assert.deepEqual(yếu, [],
    `những cặp kỷ KHÔNG khác nhau ở bất kỳ thứ gì mắt đọc được: [${yếu.join(', ')}]`
    + ' — trên màn hình thật chúng là cùng một dân tộc');

  console.log('[humanIdentity] (B) 105/105 cặp khác nhau ở ít nhất một thứ trên ngưỡng mắt 4 px'
    + ' · KHÔNG tính build/legShare/stance/armSwing (trải rộng tối đa 2,05/3,13/1,35/3,01 px — dưới ngưỡng)');
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ĐỐI CHỨNG — không có nó thì không biết phép chấm còn răng hay không
// ═════════════════════════════════════════════════════════════════════════════════════════════════
test('ĐỐI CHỨNG — phép chấm phải TỪ CHỐI đúng hai thế giới hỏng đã biết', () => {
  // (1) THẾ GIỚI TRƯỚC 2026-08-23: 14 kỷ dùng CHUNG preset `mocPhoThong`. Phép chấm phải ra 0.
  const preset = { ...HUMAN_STYLES[1] };
  const vec = (s) => [
    Math.round(s.stature / BƯỚC.stature), Math.round(s.build / BƯỚC.build),
    Math.round(s.legShare / BƯỚC.legShare), Math.round(s.stance / BƯỚC.stance),
    s.garment, s.headgear, s.carry,
    Math.round(Math.log(cadenceOf(s)) / Math.log(1 + BƯỚC_NHỊP)),
    Math.round(s.armSwing / BƯỚC.armSwing),
  ];
  const đếm = (a, b) => vec(a).filter((v, t) => v !== vec(b)[t]).length;
  assert.equal(đếm(preset, { ...preset }), 0,
    'phép chấm cho hai dòng GIỐNG HỆT nhau một điểm khác 0 ⇒ nó đã hỏng');

  // (2) THẾ GIỚI "KHÁC NHAU NHƯNG DƯỚI MỌI NGƯỠNG": 15 dòng chênh nhau 0,001 ở mọi trục số. Đây là
  // cách một bảng trông rất phong phú trên giấy mà trên màn hình vẫn là một.
  // ⚠️ HỎI TỪNG CHIỀU MỘT, ĐỪNG HỎI TỔNG. Bài học Phase 10 Bước 2: bản đầu của một đối chứng y hệt
  // đã cộng ba lệch 0,001 vào một dòng rồi hỏi `< 3`, nên nới RIÊNG một ngưỡng vẫn xanh.
  for (const trục of ['stature', 'build', 'legShare', 'stance', 'armSwing']) {
    const a = { ...preset };
    const b = { ...preset, [trục]: preset[trục] + 0.001 };
    assert.equal(đếm(a, b), 0,
      `trục "${trục}": chênh 0,001 vẫn bị tính thành một trục khác nhau — bước lượng hoá quá mịn`);
  }
  // Và nhịp bước cũng vậy: chênh 1% không được tính.
  const nhanhHơn1PhầnTrăm = { ...preset, walkSpeed: preset.walkSpeed * 1.01 };
  assert.equal(đếm(preset, nhanhHơn1PhầnTrăm), 0, 'chênh nhịp 1% bị tính thành một trục khác nhau');

  // ⚠️ VÀ VẾ NGƯỢC LẠI, nếu không thì mọi bước lượng hoá đặt bằng vô cực cũng "qua" hai vế trên.
  // ⚠️ KẾT QUẢ LÀ **3**, KHÔNG PHẢI 2 — VÀ CON SỐ ẤY LỘ RA MỘT RÀNG BUỘC THẬT GIỮA HAI TRỤC.
  // Bản đầu của đối chứng này đòi đúng 2 (tầm vóc + vung tay) và nó ĐỎ. Không phải phép chấm hỏng:
  // `cadenceOf` = tốc độ ÷ (sải × `HUMAN_BASE_HEIGHT` × stature × legShare), tức **cẳng chân nằm ở
  // mẫu số**, nên đổi `stature` thì nhịp bước đổi theo. Đó là VẬT LÝ THẬT (người cao hơn, cùng sải
  // tính theo cẳng chân và cùng tốc độ, thì nhịp chân thưa hơn), không phải một hiệu ứng phụ cần
  // gỡ.
  // ⇒ HỆ QUẢ PHẢI GHI RA: chín trục của phép chấm (A) **KHÔNG độc lập hoàn toàn** — `tầm vóc`,
  // `tỉ lệ chân` và `nhịp bước` dính nhau qua chiều dài cẳng chân. Nên một cặp chấm "5/9 trục" có
  // thể thật ra chỉ mang 4 quyết định độc lập. Đó là lý do sàn ở (A) đặt 4 chứ không phải 3, và là
  // lý do phép chấm (B) mới là phép chấm trả lời câu hỏi của Đàm.
  const chênhThật = { ...preset, stature: preset.stature + 0.10, armSwing: preset.armSwing + 0.12 };
  assert.equal(đếm(preset, chênhThật), 3,
    'chênh 0,10 tầm vóc và 0,12 vung tay mà phép chấm KHÔNG thấy ⇒ bước lượng hoá quá thô'
    + ' (mong đợi 3: tầm vóc + vung tay + nhịp bước, vì nhịp phụ thuộc cẳng chân)');

  // Và tách riêng để chứng minh chính cái ràng buộc vừa nói — nếu ngày nào `cadenceOf` thôi phụ
  // thuộc cẳng chân thì vế này ĐỎ, và lời giải thích ở trên phải được viết lại.
  assert.equal(đếm(preset, { ...preset, stature: preset.stature + 0.10 }), 2,
    'đổi riêng tầm vóc mà nhịp bước KHÔNG đổi theo ⇒ `cadenceOf` đã thôi phụ thuộc cẳng chân');
});
