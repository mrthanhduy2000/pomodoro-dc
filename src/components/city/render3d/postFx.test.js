/**
 * postFx.test.js — ROUND 52 (ADR-092): the post pass, checked where it can be checked without a GPU.
 *
 * ⚠️ WHAT A TEST CAN AND CANNOT SAY HERE, stated up front so nobody mistakes green for proof. This
 * file checks the DECISION TABLE and the wiring contract — the parts that are pure. It cannot check
 * that bloom looks right; that is what the before/after photographs are for, and round 51 already
 * proved the point the hard way (a feature that emitted nothing in all fifteen eras with every test
 * green). So the numeric claims here are the ones that were LEARNED FROM A RENDERED FRAME, and each
 * carries the frame's verdict in its message.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { MSAA_SAMPLES, POST_PROFILE, postProfileFor } from './postFx.js';

const ROWS = ['day', 'golden', 'night'];

test('BA CHẶNG, BA HÀNG — và mọi hàng đủ bảy con số', () => {
  for (const name of ROWS) {
    const row = POST_PROFILE[name];
    assert.ok(row, `thiếu hàng "${name}"`);
    for (const k of ['bloom', 'threshold', 'radius', 'ao', 'rays', 'grain', 'vignette']) {
      assert.ok(Number.isFinite(row[k]), `${name}.${k} không phải số`);
      assert.ok(row[k] >= 0, `${name}.${k} âm`);
    }
  }
});

test('GIỜ NÀO RƠI VÀO HÀNG NÀO — và bình minh/hoàng hôn đi chung một hàng', () => {
  assert.equal(postProfileFor('night'), POST_PROFILE.night);
  assert.equal(postProfileFor('dawn'), POST_PROFILE.golden);
  assert.equal(postProfileFor('dusk'), POST_PROFILE.golden);
  for (const phase of ['morning', 'noon', 'afternoon']) {
    assert.equal(postProfileFor(phase), POST_PROFILE.day, `chặng "${phase}" phải là ban ngày`);
  }
  // một chặng lạ vẫn phải trả về một hàng dùng được, không phải `undefined`
  assert.equal(postProfileFor('không-có-chặng-này'), POST_PROFILE.day);
});

test('NGƯỠNG LOÉ SÁNG BAN ĐÊM PHẢI CAO HƠN 0,5 — bài học từ một khung hình cháy trắng', () => {
  /**
   * ⚠️ ĐÂY LÀ MỘT CON SỐ HỌC ĐƯỢC TỪ ẢNH, KHÔNG PHẢI MỘT SỞ THÍCH. Bản dựng đầu dùng đúng bộ số mà
   * mọi ví dụ bloom dùng cho ban đêm — cường độ 1,05, ngưỡng 0,26 — và con phố chụp ra có MỌI ô cửa
   * sổ sáng nở thành một mảng trắng ăn hết mặt tiền quanh nó. Lý do riêng của cảnh này: khung đệm là
   * HDR TUYẾN TÍNH, mà bồn chứa phát sáng của vòng 49 vẽ lửa và cửa sổ ở quãng 0,9 trong khi một bức
   * tường nắng cũng quãng 1,0 — nên ngưỡng dưới ~0,5 không tách được "một ngọn đèn" khỏi "một bức
   * tường sáng", nó chọn CẢ HAI.
   *
   * Bài test khoá đúng mệnh đề ấy, và nó nói về QUAN HỆ chứ không về một con số đẹp: ngưỡng phải
   * nằm trên vùng mà vật liệu thường của cảnh sinh sống.
   */
  assert.ok(POST_PROFILE.night.threshold > 0.5,
    `ngưỡng ban đêm ${POST_PROFILE.night.threshold} ≤ 0,5 — ở mức đó tường sáng cũng loé như đèn`);
  for (const name of ROWS) {
    assert.ok(POST_PROFILE[name].threshold > 0.5, `ngưỡng "${name}" quá thấp`);
    assert.ok(POST_PROFILE[name].bloom <= 0.8, `cường độ loé sáng "${name}" quá mạnh — xem ảnh cháy trắng`);
  }
});

test('BAN ĐÊM LOÉ NHIỀU HƠN BAN NGÀY, và tia nắng thì ngược lại', () => {
  // Hai QUAN HỆ, không phải hai con số: đêm là lúc duy nhất đèn là thứ sáng nhất khung hình, còn
  // tia nắng thì cần một mặt trời trên trời — nửa đêm phải gần như không có.
  assert.ok(POST_PROFILE.night.bloom > POST_PROFILE.day.bloom, 'ban đêm phải loé sáng hơn ban ngày');
  assert.ok(POST_PROFILE.night.threshold < POST_PROFILE.day.threshold,
    'ban đêm phải hạ ngưỡng so với ban ngày — đó mới là thứ quyết định CÁI GÌ loé');
  assert.ok(POST_PROFILE.golden.rays > POST_PROFILE.day.rays, 'giờ vàng phải nhiều tia nắng nhất');
  assert.ok(POST_PROFILE.night.rays < POST_PROFILE.day.rays * 0.5, 'nửa đêm gần như không có tia nắng');
  assert.ok(POST_PROFILE.night.vignette > POST_PROFILE.day.vignette, 'đêm dìm góc nhiều hơn ngày');
});

test('TẮT LÀ KHÔNG DỰNG GÌ — không có renderer thì trả về null, không nổ', async () => {
  const { createPostFx } = await import('./postFx.js');
  // Đây chính là hợp đồng của công tắc: `postFx` bằng `null` ⇒ bên gọi giữ `renderer.render(...)`,
  // tức đúng đường vẽ của vòng 51. Không có khung đệm nào được cấp phát.
  assert.equal(createPostFx({}), null);
  assert.equal(createPostFx({ renderer: {}, scene: null, camera: {} }), null);
  assert.equal(createPostFx(), null);
});

/**
 * ⚠️ ROUND 53 (ADR-093) — LUẬT "AO TẮT KHI ĐI BỘ" ĐÃ BỊ XOÁ, VÀ BÀI TEST NÀY THAY CHỖ NÓ.
 *
 * Vòng 52 phải tắt phép che khuất ở chế độ đi bộ vì `GTAOPass` của three trả về đệm ĐEN ĐẶC gần
 * camera (hàng 612/700, lệch 16,5/255). Bài cũ ở đây khoá cái luật ấy và nói thẳng: *"nếu gốc đã
 * được chữa thì phải xoá CẢ bài test này và mục #52, đừng chỉ xoá một vế"*. Vòng 53 chữa gốc —
 * phép che khuất nay nằm trong `LensShader`, không dùng `GTAOPass` nữa — nên cả ba vế đi cùng lúc:
 * luật, bài test, và mục nợ. Bài mới canh đúng chiều ngược lại: **`GTAOPass` không được quay lại.**
 */
test('GTAOPass KHÔNG được quay lại ống hậu kỳ — và AO phải chạy ở MỌI khung nhìn', () => {
  const src = readFileSync(new URL('./postFx.js', import.meta.url), 'utf8');
  // ⚠️ Hỏi cái IMPORT, không hỏi chữ "GTAO" — chữ ấy còn nằm trong hai khối chú thích kể lại
  // chuyện cũ, và một bài test đỏ vì người ta GHI LẠI một bài học là một bài test dạy sai.
  assert.doesNotMatch(src, /^import .*GTAOPass/m,
    '`GTAOPass` đã quay lại `postFx.js`. Nó có một khuyết tật ĐO ĐƯỢC ở tầm mắt (đệm AO đen đặc,'
    + ' hàng 612/700) — đọc `docs/archive/` hoặc lịch sử `TECH_DEBT.md` #52 trước khi thêm lại.');
  assert.match(src, /uAo\.value = want\('ao'\) \? profile\.ao : 0/,
    'phép che khuất phải bật theo hồ sơ chặng ngày và theo `--post ao`, không theo chế độ camera:'
    + ' tầm mắt CHÍNH LÀ chỗ những cái hốc của vòng 53 hiện ra');
  // Và đệm độ sâu phải được dựng khi AO bật, không chỉ khi xoá phông bật — nếu không thì AO lấy
  // mẫu trên một đệm chưa ai ghi vào, và kết quả là rác chứ không phải "không có AO".
  assert.match(src, /uDofAmount\.value > 0\.001 \|\| lens\.uniforms\.uAo\.value > 0\.001/,
    'đệm độ sâu nay có HAI người đọc (xoá phông và che khuất) — điều kiện dựng nó phải hỏi cả hai');
});

/**
 * ⚠️ KHỬ RĂNG CƯA — ROUND 55, VIỆC 1, VÀ BÀI TEST NÀY TỒN TẠI VÌ KHUYẾT TẬT ẤY SỐNG SÓT **BA VÒNG**.
 *
 * Vòng 52 chuyển cảnh từ "vẽ thẳng ra canvas" sang "vẽ vào khung đệm của `EffectComposer`". Cờ
 * `antialias: true` ở `CityScene3D.jsx` vẫn nằm nguyên đó — nhưng nó chỉ áp cho khung đệm MẶC ĐỊNH
 * của canvas, mà từ vòng 52 thứ duy nhất vẽ vào đó là một tấm quad phủ màn hình. Một hình chữ nhật
 * không có cạnh chéo nào để khử. Nên suốt vòng 52 · 53 · 54, mọi mép mái là bậc thang, và **không
 * một bài test nào có thể đỏ**, vì không bài nào hỏi câu ấy.
 *
 * ⇒ Bài học đã có tên trong dự án này: *"một câu tự trấn an phải được kiểm như một con số"*. Lần
 * này câu trấn an là một THAM SỐ THƯ VIỆN còn đúng cú pháp nhưng đã hết tác dụng vì đường vẽ đổi.
 *
 * THỬ-CHO-ĐỎ (đã chạy cả hai vế): bỏ `samples: MSAA_SAMPLES` khỏi lời `new WebGLRenderTarget` ⇒ vế
 * (b) đỏ. Đặt `MSAA_SAMPLES = 0` ⇒ vế (a) đỏ.
 * ⚠️ VÌ SAO PHẢI CÓ CẢ HAI VẾ: một hằng số đúng mà không ai dùng, và một lời gọi đúng với hằng số
 * bằng 0, đều cho ra CÙNG MỘT cái ảnh răng cưa. Chỉ hỏi một vế là để ngỏ vế kia.
 */
test('KHUNG ĐỆM HẬU KỲ PHẢI ĐA MẪU — cờ `antialias` của renderer đã hết tác dụng từ vòng 52', () => {
  // (a) con số phải là một mức đa mẫu THẬT. 2 là mức thấp nhất WebGL2 bảo đảm; dưới 4 thì mép chéo
  //     vẫn còn bậc nhìn thấy ở cỡ màn hình của Đàm, nên đây là sàn chứ không phải mức mong muốn.
  assert.ok(Number.isInteger(MSAA_SAMPLES) && MSAA_SAMPLES >= 4,
    `MSAA_SAMPLES = ${MSAA_SAMPLES} — phải là số nguyên ≥ 4. three tự kẹp xuống \`gl.MAX_SAMPLES\``
    + ' của phần cứng, nên đặt cao KHÔNG có rủi ro; đặt thấp thì ảnh răng cưa trên mọi máy.');

  // (b) và nó phải THẬT SỰ ĐI VÀO khung đệm mà `EffectComposer` dùng để vẽ cảnh.
  const src = readFileSync(new URL('./postFx.js', import.meta.url), 'utf8');
  assert.match(src, /new WebGLRenderTarget\(w, h, \{[^}]*samples: MSAA_SAMPLES/,
    'khung đệm của `EffectComposer` không khai `samples` ⇒ nó mặc định 0 ⇒ KHÔNG khử răng cưa, và'
    + ' cờ `antialias` của `WebGLRenderer` không cứu được vì cảnh không còn vẽ ra canvas nữa.');

  // (c) ⚠️ ĐỆM ĐỘ SÂU CỐ Ý KHÔNG ĐA MẪU — nó được ĐỌC từng điểm ảnh, không được NHÌN. Khoá lại để
  //     một phiên sau đừng "cho nhất quán" rồi trả một lượt phân giải mà không đổi một điểm ảnh nào.
  assert.doesNotMatch(src, /new WebGLRenderTarget\(w, h, \{\s*depthTexture[^}]*samples/,
    'đệm độ sâu không cần đa mẫu — xem chú thích ở chỗ dựng nó');
});
