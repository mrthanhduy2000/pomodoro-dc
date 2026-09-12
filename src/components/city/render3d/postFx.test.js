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

import { PerspectiveCamera, Scene, Vector2 } from 'three';

import { MSAA_SAMPLES, POST_PROFILE, createPostFx, postProfileFor } from './postFx.js';

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

/*
  ══════════════════════════════════════════════════════════════════════════════════════════════
  ĐỘ PHÂN GIẢI CỦA CẢ CHUỖI — ROUND 57, VIỆC 3. LẦN THỨ HAI `EffectComposer` KHÔNG THỪA HƯỞNG
  CẤU HÌNH CỦA BỘ DỰNG, NÊN CÁI GÁC NÀY CANH **QUAN HỆ**, KHÔNG CANH MỘT CON SỐ.
  ══════════════════════════════════════════════════════════════════════════════════════════════
  Lần đầu là `samples` (round 55): cờ `antialias` của renderer không tới được khung đệm composer.
  Lần này là KÍCH THƯỚC, và nó đi theo hướng ngược lại — `EffectComposer.setSize` **tự nhân**
  `pixelRatio` (`this._width * this._pixelRatio`, ba chỗ trong three), trong khi chỗ gọi đã nhân
  sẵn. ⇒ Nhân hai lần.

  ĐO ĐƯỢC 2026-09-12 bằng dòng `[res]` của công cụ chụp, khung 1400×700 · pixelRatio 2:
      chuỗi (composer)            5600×2800   ← nhân hai lần
      đệm độ sâu                  2800×1400
      bloom (tấm đích THẬT)       1400×700    ← nửa của 2800, tức MỘT PHẦN TƯ chuỗi
      `uTexel` của lượt ống kính  2800×1400
  Hậu quả nặng nhất không phải lãng phí mà là **lượt ống kính làm mờ gấp đôi bán kính định làm**:
  `uTexel` là bề rộng một điểm ảnh của tấm nó lấy mẫu, khai theo 2800 mà tấm thật 5600 thì mỗi
  bước nhảy HAI điểm ảnh. Che khuất và xoá phông đều nhoè gấp đôi — đúng vết "mềm nhũn".

  ⚠️ BLOOM CHẠY Ở NỬA CỠ LÀ CÓ CHỦ Ý, KHÔNG PHẢI LỖI (`Math.round(width / 2)` trong three). Nên
  bài này đòi **bằng nhau** ở ba lượt và **đúng một nửa** ở bloom. Một bài đòi cả bốn bằng nhau sẽ
  đỏ vĩnh viễn và sẽ bị ai đó tắt đi — một cái gác sai là một cái gác sắp bị gỡ.

  ⚠️ VÀ `sizes()` PHẢI ĐỌC TẤM ĐÍCH THẬT. Bản đầu của nó đọc `bloom.resolution`, thứ `setSize()`
  của three KHÔNG cập nhật — nên nó báo bloom đã đổi cỡ trong khi chưa. Dụng cụ đo suýt nói dối
  ngay trong hàm sinh ra để bắt lỗi ấy (`TECH_DEBT #42`).
*/
function boDungGia(pixelRatio, cssW, cssH) {
  return {
    getPixelRatio: () => pixelRatio,
    getSize: (v) => (v ?? new Vector2()).set(cssW, cssH),
    getDrawingBufferSize: (v) => (v ?? new Vector2()).set(cssW * pixelRatio, cssH * pixelRatio),
    getRenderTarget: () => null,
    setRenderTarget: () => {},
    capabilities: { isWebGL2: true, maxSamples: 8 },
    outputColorSpace: 'srgb',
    toneMapping: 0,
  };
}

function dungChuoi(pixelRatio, cssW, cssH, truyenCo) {
  const renderer = boDungGia(pixelRatio, cssW, cssH);
  const be = renderer.getDrawingBufferSize(new Vector2());
  const fx = createPostFx({
    renderer,
    scene: new Scene(),
    camera: new PerspectiveCamera(),
    width: truyenCo[0],
    height: truyenCo[1],
    profile: postProfileFor('day'),
  });
  return { fx, be };
}

test('MỌI LƯỢT CÙNG MỘT CỠ, VÀ CỠ ẤY BẰNG CỠ BỘ DỰNG — canh quan hệ, không canh con số', () => {
  for (const pixelRatio of [1, 2, 3]) {
    const { fx, be } = dungChuoi(pixelRatio, 1400, 700, [1400 * pixelRatio, 700 * pixelRatio]);
    const co = fx.sizes();
    assert.deepEqual(co.composer, [be.x, be.y],
      `pixelRatio ${pixelRatio}: chuỗi hậu kỳ ${co.composer} ≠ cỡ bộ dựng ${[be.x, be.y]}. `
      + 'Nếu lớn hơn đúng pixelRatio lần thì `composer.setPixelRatio(1)` đã bị gỡ và three đang '
      + 'nhân lần thứ hai.');
    assert.deepEqual(co.depth, co.composer, `pixelRatio ${pixelRatio}: đệm độ sâu lệch cỡ với chuỗi`);
    assert.deepEqual(co.lensTexel, co.composer,
      `pixelRatio ${pixelRatio}: uTexel khai theo ${co.lensTexel} trong khi tấm thật là `
      + `${co.composer} — lượt ống kính sẽ làm mờ sai bán kính đúng ${co.composer[0] / co.lensTexel[0]} lần`);
    assert.deepEqual(co.bloom, [Math.round(co.composer[0] / 2), Math.round(co.composer[1] / 2)],
      `pixelRatio ${pixelRatio}: bloom phải chạy ở ĐÚNG nửa cỡ chuỗi (thiết kế của three)`);
  }
});

test('ĐỔI CỠ PHẢI ĐI QUA **MỌI** LƯỢT — một lượt ở lại cỡ cũ là cả chuỗi sai', () => {
  /*
    ⚠️ THỬ-CHO-ĐỎ, VÀ LẦN THỬ THỨ TƯ ĐÃ VẠCH RA MỘT LỖ TRONG CHÍNH BÀI TEST NÀY — ghi lại nguyên văn
    vì cái lỗ ấy mới là thứ đáng học. Đo được:
        bỏ `depthTarget.setSize(sw, sh)`      ⇒ ĐỎ  ✓
        bỏ `lens.uniforms.uTexel...`          ⇒ ĐỎ  ✓
        bỏ `composer.setPixelRatio(1)`        ⇒ ĐỎ ba bài  ✓
        bỏ `bloom.setSize(sw, sh)`            ⇒ **VẪN XANH** ✗
    Vì sao: `EffectComposer.setSize` tự gọi `pass.setSize` cho MỌI lượt đang nằm trong danh sách của
    nó, và bloom là một lượt. Nên ở bản dựng đầy đủ, dòng `bloom.setSize` của ta là thừa.
    ⚠️ NHƯNG NÓ KHÔNG THỪA Ở BẢN DỰNG LỌC. Với `only`, bloom vẫn được DỰNG nhưng KHÔNG được
    `addPass` (xem `want('bloom')`), nên composer không với tới nó — và khi ấy dòng của ta là thứ
    duy nhất giữ nó đúng cỡ. Bài dưới dựng đúng trường hợp đó, nên lần thử thứ tư nay ĐỎ.
    ⇒ Bài học: **một thử-cho-đỏ không đỏ là một phát hiện, không phải một phiền toái.** Nó nói rằng
    bài test đang canh ít hơn nó tưởng, và ở đây nó chỉ ra đúng một trường hợp chưa ai canh.
    Đây đúng kiểu lỗi Đàm gọi tên ở vòng 57: *"một lượt còn ở độ phân giải thấp là cả chuỗi vẫn mờ"*.
  */
  const { fx } = dungChuoi(3, 1400, 700, [4200, 2100]);
  fx.setSize(2400, 1200);
  const co = fx.sizes();
  assert.deepEqual(co.composer, [2400, 1200], 'chuỗi không nhận cỡ mới');
  assert.deepEqual(co.depth, [2400, 1200], 'đệm độ sâu ở lại cỡ cũ');
  assert.deepEqual(co.lensTexel, [2400, 1200], 'uTexel ở lại cỡ cũ');
  assert.deepEqual(co.bloom, [1200, 600], 'bloom ở lại cỡ cũ');
});

test('TRUYỀN CỠ CSS THAY VÌ ĐIỂM ẢNH THẬT PHẢI ĐỎ — đây là nghi vấn Đàm nêu ở vòng 57', () => {
  /*
    Vế thứ hai Đàm đặt hàng: *"đỏ khi truyền cỡ CSS"*. Chuỗi nhận đúng con số ta đưa, nên nếu chỗ
    gọi quên nhân `pixelRatio` thì cả chuỗi nhỏ đi đúng ngần ấy lần và ảnh bị kéo giãn khi ghép lên
    canvas. Bài này dựng đúng cái sai ấy rồi đòi nó KHÔNG khớp cỡ bộ dựng — tức chứng minh phép đo
    ở bài trên có răng, chứ không xanh với mọi thứ.
    ⚠️ Giả thuyết gốc của Đàm là chuỗi ĐANG chạy ở cỡ CSS. Đo ra thì NGƯỢC LẠI (nó chạy ở
    pixelRatio²). Bài test vẫn giữ cả hai chiều, vì cái cần canh là QUAN HỆ chứ không phải một
    trong hai hướng lệch.
  */
  const { fx, be } = dungChuoi(3, 1400, 700, [1400, 700]);   // quên nhân — cỡ CSS
  const co = fx.sizes();
  assert.notDeepEqual(co.composer, [be.x, be.y],
    'truyền cỡ CSS mà chuỗi vẫn khớp cỡ bộ dựng ⇒ phép đo ở bài trên không phân biệt được gì');
  assert.equal(be.x / co.composer[0], 3,
    'cỡ CSS phải cho ra một chuỗi nhỏ hơn đúng pixelRatio lần — đó là tỉ lệ ảnh bị kéo giãn');
});

test('BẢN DỰNG LỌC (`--post ao`) CŨNG PHẢI ĐỔI CỠ MỌI LƯỢT — kể cả lượt KHÔNG nằm trong chuỗi', () => {
  // ⚠️ Bài này tồn tại vì lần thử-cho-đỏ thứ tư ở bài trên KHÔNG đỏ (đọc khối chú thích ở đó).
  // Với `only`, bloom được dựng nhưng không được `addPass`, nên `composer.setSize` không với tới.
  // THỬ-CHO-ĐỎ (đã chạy): bỏ `bloom.setSize(sw, sh)` ⇒ bài này đỏ, bloom ở lại 2100×1050.
  const renderer = boDungGia(3, 1400, 700);
  const fx = createPostFx({
    renderer,
    scene: new Scene(),
    camera: new PerspectiveCamera(),
    width: 4200,
    height: 2100,
    profile: postProfileFor('day'),
    only: ['ao'],
  });
  fx.setSize(2400, 1200);
  const co = fx.sizes();
  assert.deepEqual(co.bloom, [1200, 600],
    'bloom không nhận cỡ mới ở bản dựng lọc — composer không với tới nó, chỉ `setSize` của ta với tới');
  assert.deepEqual(co.depth, [2400, 1200], 'đệm độ sâu ở lại cỡ cũ ở bản dựng lọc');
});
