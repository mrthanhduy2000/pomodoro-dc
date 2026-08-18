import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MARKING_KINDS, MIN_STONE, PAVING_KINDS, STREET_STYLES,
  carriagewayShape, getStreetStyle, isValidStreetStyle, pavingSubdivision, streetCrossSection,
} from './streetStyle.js';
import { ERA_STYLES } from './eraStyle.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// BƯỚC LƯỢNG HOÁ — SUY TỪ SỰ THẬT ĐO ĐƯỢC, KHÔNG PHẢI CHỌN CHO VỪA Ý
// ═════════════════════════════════════════════════════════════════════════════════════════════════
// Câu hỏi "hai kỷ này có mặt đường KHÁC NHAU không" chỉ trả lời được khi đã định nghĩa "khác nhau
// bao nhiêu thì mắt đọc ra". Ba con số dưới đây đều suy từ ĐÚNG HAI phép đo đã có sẵn trong dự án,
// không có con số thứ ba nào được bịa thêm:
//
//   • MỘT Ô THÀNH PHỐ ≈ 64 ĐIỂM ẢNH ở khoảng nhìn thật của app (đo ở `MIN_STONE`, `streetStyle.js`).
//   • NGƯỠNG MẮT = 12/255 khoảng cách RGB (hiệu chuẩn ở Phase 3Y, dùng xuyên suốt `sweep-score.mjs`).
//
// ⚠️ VÌ SAO PHẢI LƯỢNG HOÁ CHỨ KHÔNG SO SỐ THỰC: `avenue` 0,74 và 0,75 là hai số khác nhau nhưng
// trên màn hình là **cùng một con đường** — chênh 0,64 điểm ảnh. Một phép so số thực sẽ báo "15 kỷ
// đều khác nhau" ngay cả khi cả 15 dồn trong một khoảng mắt không tách nổi. Đó đúng là cái bẫy mà
// bài test màu cũ đã dính theo chiều ngược lại.
const Ô_ĐIỂM_ẢNH = 64;
const MẮT_ĐIỂM_ẢNH = 4;    // mép một dải hẹp hơn 4 điểm ảnh thì không đọc chắc được
const MẮT_MÀU = 12 / 255;  // ngưỡng mắt đã hiệu chuẩn

/** Bước cho mọi trục mang nghĩa BỀ RỘNG (tính theo phần của một ô). */
const BƯỚC_BỀ_RỘNG = MẮT_ĐIỂM_ẢNH / Ô_ĐIỂM_ẢNH; // = 1/16

/**
 * Bước cho `wear`. `terrainMesh.js` dùng nó là `k = 1 + (n − 0,5) × wear`, tức biên độ đậm nhạt
 * giữa các viên bằng `độ_sáng_nền × wear`. Muốn chênh lệch biên độ ấy vượt ngưỡng mắt thì
 * `Δwear ≥ MẮT_MÀU / độ_sáng_nền`. Độ sáng mặt đường đo được qua 15 kỷ: 0,331–0,765 (12h) và
 * 0,186–0,625 (22h) — lấy 0,40 là mức thấp-điển hình để bước đủ THẬN TRỌNG ở chỗ khó đọc nhất.
 */
const NỀN_ĐƯỜNG = 0.40;
const BƯỚC_MÒN = MẮT_MÀU / NỀN_ĐƯỜNG;

/**
 * TÁM TRỤC BẢN SẮC, mỗi trục lượng hoá về thứ MẮT THẬT SỰ ĐỌC ĐƯỢC.
 *
 * ⚠️ TRỤC `viên` HỎI THẲNG `pavingSubdivision`, KHÔNG lượng hoá lại `stone` bằng một bước riêng —
 * vì `pavingSubdivision` mới là thứ hình học thật sự dùng, và nó có kẹp. Tự dựng một công thức
 * "tương đương" ở đây là đúng cái bẫy "một luật hai công thức" (Phase 3Y): hai kỷ khai `stone` khác
 * nhau nhưng cùng rơi về một số ô con thì trên màn hình là CÙNG một cỡ viên, và bài test phải nói
 * đúng như vậy chứ không được nói theo bảng.
 */
const TÊN_TRỤC = ['avenue', 'lane', 'paving', 'viên', 'wear', 'curb', 'walk', 'markings'];
const vectorBảnSắc = (s) => [
  Math.round(s.avenue / BƯỚC_BỀ_RỘNG),
  Math.round(s.lane / BƯỚC_BỀ_RỘNG),
  s.paving,
  pavingSubdivision(s),
  Math.round(s.wear / BƯỚC_MÒN),
  s.curb > 0 ? 1 : 0,   // bó vỉa: mắt đọc ra CÓ hay KHÔNG (nó đổ bóng dọc mép), không đọc ra cao bao nhiêu
  Math.round(s.walk / BƯỚC_BỀ_RỘNG),
  s.markings,
];

/** Số trục mà hai kỷ khác nhau. */
function sốTrụcKhác(a, b) {
  const va = vectorBảnSắc(a); const vb = vectorBảnSắc(b);
  let k = 0;
  for (let t = 0; t < TÊN_TRỤC.length; t += 1) if (va[t] !== vb[t]) k += 1;
  return k;
}

/** Trục nào khác — chỉ để câu báo lỗi nói được chỗ hỏng, không dùng trong phép đo. */
function trụcKhác(a, b) {
  const va = vectorBảnSắc(a); const vb = vectorBảnSắc(b);
  return TÊN_TRỤC.filter((_, t) => va[t] !== vb[t]);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════

test('BẢNG 15 KỶ HỢP LỆ — không kỷ nào khai vật liệu/vạch kẻ mà tầng vẽ không dựng được', () => {
  for (const era of ERAS) {
    const s = STREET_STYLES[era];
    assert.ok(s, `kỷ ${era} chưa có dòng nào trong bảng`);
    assert.ok(isValidStreetStyle(s), `kỷ ${era} khai một giá trị tầng vẽ không dựng được: ${JSON.stringify(s)}`);
    assert.ok(s.lane < s.avenue, `kỷ ${era}: ngõ (${s.lane}) phải HẸP hơn đại lộ (${s.avenue}) — thứ bậc đường`);
    assert.ok(s.note && s.note.length > 20, `kỷ ${era} thiếu câu \`note\` giải thích con số`);
  }
  // Kỷ ngoài bảng vẫn phải dùng được — tầng vẽ không kiểm `null`.
  for (const era of [0, 16, 99, -1, NaN, undefined]) {
    assert.ok(isValidStreetStyle(getStreetStyle(era)), `kỷ ${era} rơi về một dòng dự phòng không hợp lệ`);
  }
  // ⚠️ Kỷ chưa khai KHÔNG được bịa ra đặc điểm hiện đại — thiếu dữ liệu thì nói ít đi, không nói bừa.
  const fb = getStreetStyle(999);
  assert.equal(fb.markings, 'none', 'kỷ chưa khai lại mọc vạch kẻ — đang bịa ra lịch sử');
  assert.equal(fb.curb, 0, 'kỷ chưa khai lại mọc bó vỉa');
});

test('COUNTRY KHÔNG TRÔI KHỎI eraStyle.js — hai bảng phải kể về cùng một đất nước', () => {
  // Bảng đường và bảng kiến trúc là hai file khác nhau, nhưng mỗi dòng của bảng đường lấy lý do tồn
  // tại từ đất nước mà bảng kiến trúc đã chọn. Sửa `country` ở một bên mà quên bên kia thì kỷ ấy
  // sẽ có nhà Nhật đứng trên đường Pháp — và KHÔNG có gì đỏ lên nếu không có bài này.
  for (const era of ERAS) {
    assert.equal(STREET_STYLES[era].country, ERA_STYLES[era].country,
      `kỷ ${era}: bảng đường ghi "${STREET_STYLES[era].country}" còn bảng kiến trúc ghi "${ERA_STYLES[era].country}"`);
  }
});

test('KHÔNG NHÉT ĐẶC ĐIỂM HIỆN ĐẠI VÀO KỶ CỔ — bó vỉa, vỉa hè, vạch kẻ đúng mốc lịch sử', () => {
  // ⚠️ ĐÂY LÀ RÀNG BUỘC LÀM CHO BÀI TEST BẢN SẮC BÊN DƯỚI TRỞ NÊN KHÓ. Không có mục này thì cách
  // dễ nhất để "15 kỷ khác nhau" là rắc bó vỉa và vạch kẻ khắp nơi cho đủ trục — tức mua điểm bản
  // sắc bằng cách nói dối lịch sử, đúng thứ yêu cầu Phase 9D cấm thẳng.
  for (const era of ERAS) {
    const s = STREET_STYLES[era];
    if (era <= 6) {
      assert.equal(s.curb, 0, `kỷ ${era} có bó vỉa — bó vỉa là phát minh La Mã, kỷ 1–6 chưa có`);
    }
    // ⚠️ `edge` BUỘC VÀO VẬT LIỆU, KHÔNG BUỘC VÀO SỐ KỶ — và bản đầu của chính bài test này đã viết
    // sai thành `era <= 6 ⇒ blend`, rồi đỏ ở kỷ 5 (đá cuội trung cổ) trong khi bảng hoàn toàn đúng.
    // Sự thật vật lý: vật liệu RỜI không giữ nổi một cái mép — đất và sỏi luôn tãi dần vào cỏ. Vật
    // liệu ĐỔ/ĐÚC thì ngược lại, nó đông cứng áp vào ván khuôn nên mép luôn sắc. Ở giữa (gạch, đá
    // cuội, phiến đá) là lựa chọn của từng kỷ: gạch bùn thành Ur chỉ đặt lên cát nên tan vào đất,
    // còn đá cuội Đức được ken chặt xuống nền nên có mép rõ. Bài test chỉ khoá hai đầu chắc chắn.
    if (s.paving === 'dirt' || s.paving === 'gravel') {
      assert.equal(s.edge, 'blend', `kỷ ${era}: vật liệu rời (${s.paving}) không thể giữ một cái mép sắc`);
    }
    if (s.paving === 'asphalt' || s.paving === 'slab') {
      assert.equal(s.edge, 'hard', `kỷ ${era}: vật liệu đổ/đúc (${s.paving}) luôn có mép sắc theo ván khuôn`);
    }
    if (era <= 10) {
      assert.equal(s.markings, 'none', `kỷ ${era} có vạch kẻ — vạch kẻ tim đường là thế kỷ 20`);
    }
    if (era <= 3) {
      assert.equal(s.walk, 0, `kỷ ${era} có vỉa hè tách khỏi lòng đường — quá sớm`);
    }
  }
  // Và chiều ngược lại: kỷ hiện đại KHÔNG được thiếu thứ nó phải có, nếu không "đúng lịch sử" sẽ
  // biến thành cái cớ để mọi kỷ đều trống trơn.
  for (const era of [11, 13, 14, 15]) {
    assert.notEqual(STREET_STYLES[era].markings, 'none', `kỷ ${era} là thế kỷ 20+ mà không có vạch kẻ nào`);
    assert.ok(STREET_STYLES[era].walk > 0.1, `kỷ ${era} phải có vỉa hè rõ`);
    assert.ok(STREET_STYLES[era].curb > 0, `kỷ ${era} phải có bó vỉa`);
  }
});

test('15 KỶ RA 15 MẶT ĐƯỜNG — bản sắc đo bằng CẤU TRÚC, duyệt đủ 105 CẶP', () => {
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // ⚠️ BÀI NÀY THAY THẾ MỘT BÀI ĐO BẰNG KHOẢNG CÁCH RGB — VÀ ĐÂY LÀ LÝ DO, ĐỌC TRƯỚC KHI SỬA.
  // ═══════════════════════════════════════════════════════════════════════════════════════════════
  // Bản cũ (`palette3d.test.js`, Phase 7D) hỏi "màu mặt đường 15 kỷ có cách nhau đủ xa không". Câu
  // hỏi ấy đo đúng thứ nó nói, nhưng nó KHOÁ CHẶT một thiết kế sai: nếu màu là trục duy nhất mang
  // bản sắc thì mọi sức ép "15 kỷ phải khác nhau" dồn hết vào ĐỘ ĐẬM, và độ đậm thì có đáy — nhựa
  // đường kỷ 11 từng bị đẩy xuống độ sáng 0,113 (mặt đất 0,406), tức thành một cái rãnh đen
  // (`TECH_DEBT #30`). Vá cái rãnh ⇒ bài test cũ ĐỎ ở cặp 11↔13, và nó đỏ **một cách đúng đắn**:
  // Manhattan và Tokyo đều lát NHỰA ĐƯỜNG, nên chúng có màu gần nhau là sự thật vật lý. Ép hai con
  // đường nhựa ra hai màu khác nhau mới là nói dối.
  //
  // ⇒ Bản sắc chuyển sang thứ nó vốn phải là: BỀ RỘNG · CỠ VIÊN · VẬT LIỆU · ĐỘ MÒN · BÓ VỈA ·
  // VỈA HÈ · VẠCH KẺ. Hai con đường nhựa cùng màu nhưng một cái rộng 0,92 ô có vạch tim vàng còn
  // cái kia rộng 0,72 ô có vạch sang đường — mắt đọc ra hai thành phố khác nhau ngay lập tức.
  const cặp = [];
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      const a = ERAS[i]; const b = ERAS[j];
      cặp.push({ a, b, k: sốTrụcKhác(STREET_STYLES[a], STREET_STYLES[b]) });
    }
  }
  assert.equal(cặp.length, 105, 'phải duyệt đủ tổ hợp đôi, không phải danh sách theo thứ tự');
  cặp.sort((x, y) => x.k - y.k);

  // SÀN: ba trục độc lập. Vì sao ba chứ không phải một — một trục có thể chỉ hơn nhau đúng một bậc
  // lượng hoá, tức nằm ngay mép ngưỡng mắt và có thể tuột xuống khi ai đó chỉnh một con số cho việc
  // khác. Ba trục nghĩa là mắt có ba cơ hội độc lập để đọc ra sự khác biệt.
  const yếuNhất = cặp[0];
  assert.ok(yếuNhất.k >= 3,
    `kỷ ${yếuNhất.a}↔${yếuNhất.b} chỉ khác nhau ${yếuNhất.k}/8 trục `
    + `(${trụcKhác(STREET_STYLES[yếuNhất.a], STREET_STYLES[yếuNhất.b]).join(', ')}) — `
    + 'ĐỪNG nới ngưỡng này: hãy sửa BẢNG, và sửa bằng một lý do lịch sử viết được vào `note`');

  // PHÂN BỐ: cực tiểu là một con số gộp — "cặp yếu nhất = 3" đứng yên y hệt dù có MỘT cặp yếu hay
  // BỐN MƯƠI cặp yếu. Bốn mươi cặp yếu nghĩa là cả bảng đang dẹt lại mà cực tiểu không hé một lời.
  const trungVị = cặp[Math.floor(cặp.length / 2)].k;
  assert.ok(trungVị >= 5, `trung vị 105 cặp chỉ còn ${trungVị}/8 trục — bảng đang dẹt lại`);

  // KỶ LIỀN NHAU: đây là chỗ Đàm THẬT SỰ đi qua. Cặp xa nhau anh không bao giờ nhìn cạnh nhau.
  for (let e = 1; e < 15; e += 1) {
    const k = sốTrụcKhác(STREET_STYLES[e], STREET_STYLES[e + 1]);
    assert.ok(k >= 3,
      `kỷ ${e} sang kỷ ${e + 1} mặt đường chỉ đổi ${k}/8 trục `
      + `(${trụcKhác(STREET_STYLES[e], STREET_STYLES[e + 1]).join(', ')})`);
  }

  // MỖI TRỤC PHẢI CÒN SỐNG. Một trục mà cả 15 kỷ khai giống hệt nhau là một trục CHẾT — nó vẫn nằm
  // trong bảng, vẫn được đọc, vẫn làm bảng trông phong phú, nhưng không tách được cặp nào. Đây đúng
  // hình dạng của cơ chế "lùm cây" đã chết trong im lặng ở Phase 8D.
  const sốGiáTrị = TÊN_TRỤC.map((_, t) => new Set(ERAS.map((e) => vectorBảnSắc(STREET_STYLES[e])[t])).size);
  for (let t = 0; t < TÊN_TRỤC.length; t += 1) {
    assert.ok(sốGiáTrị[t] >= 2,
      `trục "${TÊN_TRỤC[t]}" chỉ có MỘT giá trị trên cả 15 kỷ — trục chết, không tách được cặp nào`);
  }
  // ⚠️ "CÒN SỐNG" LÀ MỘT CÁI SÀN RẤT THẤP, và bản đầu của bài này đòi ≥3 giá trị cho MỌI trục rồi
  // đỏ ở `curb` — trong khi `curb` được lượng hoá thành CÓ/KHÔNG một cách cố ý (mắt đọc ra bó vỉa
  // đổ bóng dọc mép, không đọc ra nó cao 4 hay 5 phân). Một trục nhị phân thì 2 giá trị đã là tối
  // đa; đòi 3 là đang canh phép lượng hoá chứ không canh cái luật. Thứ đáng canh là: phần LỚN bản
  // sắc phải đến từ các trục có THANG ĐỘ thật, chứ không từ mấy cái cờ có/không.
  const trụcGiàu = sốGiáTrị.filter((n) => n >= 4).length;
  assert.ok(trụcGiàu >= 5,
    `chỉ ${trụcGiàu}/8 trục có từ 4 giá trị trở lên — bản sắc đang dồn vào các cờ có/không`);
});

test('ĐỐI CHỨNG — phép đo bản sắc phải TỪ CHỐI đúng thế giới trước Phase 9D', () => {
  // ⚠️ MỘT NGƯỠNG KHÔNG CÓ ĐỐI CHỨNG SẼ BỊ NỚI DẦN CHO TIỆN (bài học Phase 9A, sương mù). Bài này
  // nhốt lại ĐÚNG bộ dữ liệu hỏng cũ: trước Phase 9D, cả 15 kỷ dùng CHUNG một hình dạng đường —
  // cùng bề rộng (`LANE_WIDTH` viết cứng), cùng số ô con (`ROAD_SUB` viết cứng), không bó vỉa,
  // không vỉa hè, không vạch kẻ — và bản sắc nằm gọn trong một mã màu mà phép đo này KHÔNG NHÌN.
  // Nếu một ngày ai đó nới phép đo cho dễ, bài này phải đỏ trước.
  const TRƯỚC_9D = ERAS.map(() => ({
    avenue: 0.62, lane: 0.62, paving: 'dirt', stone: 0, wear: 0.2,
    curb: 0, walk: 0, markings: 'none', edge: 'blend',
  }));
  let xấuNhất = 99;
  for (let i = 0; i < TRƯỚC_9D.length; i += 1) {
    for (let j = i + 1; j < TRƯỚC_9D.length; j += 1) {
      xấuNhất = Math.min(xấuNhất, sốTrụcKhác(TRƯỚC_9D[i], TRƯỚC_9D[j]));
    }
  }
  assert.equal(xấuNhất, 0, 'phép đo đang chấm điểm cho một thế giới 15 kỷ GIỐNG HỆT NHAU — nó đã hỏng');

  // Và một đối chứng thứ hai, tinh vi hơn: thế giới "khác nhau nhưng khác DƯỚI ngưỡng mắt". Đây là
  // cách một bảng có thể trông rất phong phú trên giấy (15 con số khác nhau!) mà trên màn hình vẫn
  // là một. Phép đo phải bắt được cả kiểu này, không chỉ kiểu giống hệt.
  const VI_LƯỢNG = ERAS.map((_, i) => ({
    avenue: 0.62 + i * 0.001, lane: 0.40 + i * 0.001, paving: 'dirt', stone: 0,
    wear: 0.2 + i * 0.001, curb: 0, walk: 0, markings: 'none', edge: 'blend',
  }));
  let viXấuNhất = 99;
  for (let i = 0; i < VI_LƯỢNG.length; i += 1) {
    for (let j = i + 1; j < VI_LƯỢNG.length; j += 1) {
      viXấuNhất = Math.min(viXấuNhất, sốTrụcKhác(VI_LƯỢNG[i], VI_LƯỢNG[j]));
    }
  }
  // ⚠️ ĐÒI ĐÚNG 0 THÌ SAI, VÀ BẢN ĐẦU CỦA BÀI NÀY ĐÃ SAI ĐÚNG KIỂU ĐÓ — nó đỏ với `1 !== 0`. Lý do
  // đáng ghi lại vì nó là một tính chất THẬT của mọi phép chia bậc: hai giá trị cách nhau ít hơn
  // một bậc VẪN có thể rơi vào hai bậc khác nhau nếu chúng nằm vắt qua đúng cái mép bậc (ở đây
  // `lane` 0,400 và 0,414 vắt qua mép 0,40625). Bậc hoá làm mờ những khác biệt nhỏ, nó không xoá
  // sạch được chúng. Vì vậy đối chứng phải hỏi đúng câu mà bài test thật hỏi — "cái sàn 3 trục có
  // còn TỪ CHỐI thế giới này không" — chứ không hỏi một câu chặt hơn mà chính phép đo không hứa.
  assert.ok(viXấuNhất < 3,
    `sàn 3 trục KHÔNG còn từ chối nổi một thế giới mà 15 kỷ chỉ chênh nhau 0,001 ô (≈0,06 điểm ảnh): `
    + `cặp yếu nhất ra ${viXấuNhất}/8`);
});

test('MIN_STONE — bảng không được khai cỡ viên mà màn hình nuốt mất', () => {
  // ⚠️ ĐÂY LÀ CÁI BẪY "KẸP NUỐT THAM SỐ TRONG IM LẶNG" (Phase 7B). `pavingSubdivision` có kẹp trên;
  // khai `stone` nhỏ hơn `MIN_STONE` thì mọi giá trị đều rơi về cùng một số ô con — bốn kỷ khai bốn
  // con số khác nhau mà dựng ra một kết quả, và KHÔNG gì đỏ lên. Người sau chỉnh con số ấy sẽ thấy
  // ảnh không đổi rồi kết luận trục này đã chết.
  for (const era of ERAS) {
    const s = STREET_STYLES[era];
    assert.ok(s.stone === 0 || s.stone >= MIN_STONE - 1e-9,
      `kỷ ${era} khai stone=${s.stone} < MIN_STONE=${MIN_STONE.toFixed(4)} — cái kẹp sẽ nuốt mất phần chênh`);
  }
  // Bộ kiểm phải TỪ CHỐI, không chỉ bảng phải ngoan.
  assert.equal(isValidStreetStyle({ ...STREET_STYLES[8], stone: 0.05 }), false,
    'isValidStreetStyle vẫn nhận một cỡ viên màn hình không dựng ra được');
  // Liền khối vẫn phải hợp lệ — 0 là "không có viên", không phải "viên quá nhỏ".
  assert.equal(isValidStreetStyle({ ...STREET_STYLES[8], stone: 0 }), true);

  // Và cái kẹp phải thật sự kẹp ở đúng chỗ đã khai.
  assert.equal(pavingSubdivision({ stone: 0 }), 2, 'liền khối phải ra mức chia thấp nhất');
  assert.equal(pavingSubdivision({ stone: MIN_STONE }), Math.round(1 / MIN_STONE));
  assert.equal(pavingSubdivision({ stone: 0.001 }), Math.round(1 / MIN_STONE), 'phải kẹp ở MIN_STONE');
});

test('carriagewayShape — LÕI + CÁNH TAY: liền dọc, không phình ngang, không rộng hơn chính mình', () => {
  // ⚠️ BÀI NÀY NHỐT HAI LỖI ĐÃ NHÌN THẤY TẬN MẮT, cách nhau một phase.
  // (1) Bản đầu Phase 9D thu ô đường ở CẢ HAI chiều nên kỷ 13 ra những hình vuông rời rạc có khe
  //     cỏ chen giữa — con đường vỡ thành mấy cái sân đỗ xe.
  // (2) Bản vá của nó lại để MỘT hình chữ nhật gánh cả bốn bề rộng, nên ngã ba phải phình trọn ô
  //     theo hướng có nhánh. Đo ở Phase 12: ~50% số mép đường có một bậc vuông góc.
  const rong = streetCrossSection(STREET_STYLES[13], false).half;   // đại lộ
  const hep = streetCrossSection(STREET_STYLES[13], true).half;     // ngõ
  assert.ok(hep < rong, 'ca thử phải có hai bề rộng thật khác nhau');

  const doc = carriagewayShape(rong, { north: rong, south: rong });
  assert.equal(doc.reach.north, 0.5, 'đường chạy dọc phải LIỀN sang ô trên');
  assert.equal(doc.reach.south, 0.5, 'đường chạy dọc phải LIỀN sang ô dưới');
  assert.equal(doc.reach.west, rong, 'mép giáp đất phải dừng ở đúng nửa bề rộng');
  assert.equal(doc.coreU, rong, 'đoạn thẳng thì lõi rộng đúng bằng con đường');
  assert.equal(doc.coreV, rong, 'không có nhánh ngang ⇒ lõi vuông, mũ đầu đoạn đúng bề rộng');

  // NGÃ TƯ ĐẠI LỘ × NGÕ — đây là ca mà bản cũ sai. Hộp bao vẫn trọn ô (đường vẫn liền bốn phía),
  // nhưng CÁNH TAY dọc phải hẹp đúng bằng cái ngõ, không phải trọn ô.
  const nga = carriagewayShape(rong, { west: rong, east: rong, north: hep, south: hep });
  for (const mep of ['north', 'south', 'west', 'east']) {
    assert.equal(nga.reach[mep], 0.5, `ngã tư phải liền sang ô ${mep}`);
  }
  assert.equal(nga.arms.west, rong, 'nhánh ngang là đại lộ ⇒ giữ nguyên bề rộng');
  assert.equal(nga.arms.north, hep, 'nhánh dọc là ngõ ⇒ chỗ nối chỉ rộng bằng cái ngõ');
  // ⚠️ LÕI LÀ MỘT HÌNH CHỮ NHẬT, và đó chính là bản vá: bề ngang theo `u` bằng bề rộng của con
  // đường chạy DỌC (cái ngõ), bề ngang theo `v` bằng con đường chạy NGANG (đại lộ). Bản trước cho
  // nó là hình vuông cạnh bằng con đường LỚN, tức ngã ba phình ra trọn ô theo cả hai chiều.
  assert.equal(nga.coreU, hep, 'lõi theo u phải hẹp bằng cái NGÕ, không phải bằng đại lộ');
  assert.equal(nga.coreV, rong, 'lõi theo v rộng bằng ĐẠI LỘ — đường lớn chạy thẳng qua');

  // ⚠️ ĐỐI XỨNG LÀ THỨ XOÁ BẬC, và phải kiểm bằng cách hỏi TỪ PHÍA BÊN KIA. Ô ngõ nằm ngay trên ô
  // ngã tư phải trình ra ĐÚNG con số mà ô ngã tư trình ra tại cùng chỗ giáp; lệch một chút là một
  // bậc vuông góc chạy dọc mép đường.
  const oNgo = carriagewayShape(hep, { north: hep, south: rong });
  assert.equal(oNgo.arms.south, nga.arms.north, 'hai ô kề nhau phải khai CÙNG bề rộng tại chỗ giáp');

  // GÓC VÀNH ĐAI — ô khai đại lộ nhưng chỉ chạm hai cái ngõ. Bản cũ cho nó phình trọn ô.
  const goc = carriagewayShape(rong, { east: hep, south: hep });
  assert.equal(goc.coreU, hep, 'ô chỉ chạm ngõ thì không được rộng hơn cái ngõ');
  assert.equal(goc.coreV, hep);

  const cut = carriagewayShape(rong, { north: rong });
  assert.equal(cut.reach.south, rong, 'đầu đường cụt kết thúc bằng đúng bề ngang của nó');
  assert.equal(cut.arms.south, null, 'phía cụt không có cánh tay nào');

  // Ô đường cô lập vẫn phải ra một mảng vuông đúng bề rộng, không ra số âm/0.
  const coLap = carriagewayShape(rong, {});
  assert.equal(coLap.coreU, rong);
  assert.equal(coLap.coreV, rong);
  for (const mep of ['north', 'south', 'west', 'east']) {
    assert.ok(coLap.reach[mep] > 0 && coLap.reach[mep] <= 0.5, `mép ${mep} ngoài khoảng dựng được`);
  }
});

test('ĐỐI CHỨNG — luật `min` phải ĐỐI XỨNG ở MỌI cặp bề rộng, không chỉ ở cặp tôi chọn tay', () => {
  // ⚠️ VÌ SAO CẦN BÀI NÀY DÙ BÀI TRÊN ĐÃ KIỂM MỘT CẶP: một cặp là một mẫu, và "ba mẫu là đủ" đã
  // đẻ ra `TECH_DEBT #38`. `carriagewayShape` là hàm THUẦN nên quét cả bảng rẻ tới mức không có cớ
  // để đoán — 15 kỷ × 2 hạng = 30 bề rộng thật, 900 cặp.
  const be = [];
  for (let era = 1; era <= 15; era += 1) {
    be.push(streetCrossSection(STREET_STYLES[era], false).half);
    be.push(streetCrossSection(STREET_STYLES[era], true).half);
  }
  let cap = 0;
  for (const a of be) {
    for (const b of be) {
      const A = carriagewayShape(a, { east: b });
      const B = carriagewayShape(b, { west: a });
      assert.ok(
        Math.abs(A.arms.east - B.arms.west) < 1e-12,
        `bề rộng ${a} gặp ${b}: một bên khai ${A.arms.east}, bên kia ${B.arms.west} — đó là một bậc`,
      );
      // Và không ô nào được rộng hơn chính con đường của nó — đây là thứ giết cái phình 0,5 ô.
      assert.ok(A.coreU <= a + 1e-12 && A.coreV <= a + 1e-12,
        `lõi (${A.coreU}, ${A.coreV}) rộng hơn con đường ${a}`);
      cap += 1;
    }
  }
  assert.equal(cap, be.length * be.length, 'phép quét chạy hụt — không đủ số cặp');
  assert.ok(cap >= 900, `chỉ quét ${cap} cặp, quá ít để nói lên điều gì`);
});

test('VỈA HÈ KHÔNG BAO GIỜ TRÀN KHỎI Ô — hai ô đường kề nhau không chọi mặt', () => {
  // Vỉa hè nằm NGOÀI lòng đường. Nếu nửa bề rộng + vỉa hè vượt quá 0,5 thì vỉa hè của ô này thò
  // sang ô bên và sinh một dải chọi mặt (z-fight) chạy dọc cả thành phố.
  for (const era of ERAS) {
    for (const isLane of [false, true]) {
      const c = streetCrossSection(STREET_STYLES[era], isLane);
      assert.ok(c.half + c.walk <= 0.5 + 1e-9,
        `kỷ ${era} (${isLane ? 'ngõ' : 'đại lộ'}): nửa đường ${c.half} + vỉa hè ${c.walk} vượt quá nửa ô`);
      assert.ok(c.half > 0, `kỷ ${era}: lòng đường có bề rộng 0`);
      // Bó vỉa chỉ tồn tại khi CÓ vỉa hè — bó vỉa là mép của vỉa hè, không phải một vật thể rời.
      if (c.walk <= 0.01) assert.equal(c.curb, 0, `kỷ ${era}: có bó vỉa mà không có vỉa hè để bó`);
    }
  }
  // Đại lộ rộng trọn ô (kỷ 12, 15) là ca biên: không còn chỗ cho vỉa hè, và hàm phải tự thu nó về 0
  // thay vì trả một số âm.
  const rộngNhất = streetCrossSection({ ...STREET_STYLES[12], avenue: 1 }, false);
  assert.equal(rộngNhất.walk, 0, 'đại lộ rộng trọn ô mà vẫn cấp vỉa hè — sẽ tràn sang ô bên');
  assert.equal(rộngNhất.curb, 0, 'không có vỉa hè thì không được có bó vỉa');
});

test('DANH SÁCH VẬT LIỆU/VẠCH KẺ KHÔNG CÓ MỤC CHẾT — mỗi kiểu khai ra phải có kỷ dùng', () => {
  // Một mục nằm trong danh sách mà không kỷ nào dùng thì tầng vẽ vẫn phải mang mã xử lý nó, mà mã
  // ấy chưa bao giờ chạy — tức mã chết đội lốt tính năng.
  const dùng = new Set(ERAS.map((e) => STREET_STYLES[e].paving));
  for (const kiểu of PAVING_KINDS) {
    assert.ok(dùng.has(kiểu), `vật liệu "${kiểu}" khai trong PAVING_KINDS mà không kỷ nào dùng`);
  }
  const vạch = new Set(ERAS.map((e) => STREET_STYLES[e].markings));
  for (const kiểu of MARKING_KINDS) {
    assert.ok(vạch.has(kiểu), `vạch kẻ "${kiểu}" khai trong MARKING_KINDS mà không kỷ nào dùng`);
  }
});
