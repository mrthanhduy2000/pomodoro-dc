/**
 * surfaceDetail.js — VÁ MỘT LẦN CHO MỌI BỀ MẶT: hạt vân theo toạ độ thế giới + tách đôi
 * ánh sáng môi trường (Phase 9C).
 *
 * ⚠️ MỘT MODULE, HAI BẢN VÁ, VÀ CHÚNG PHẢI ĐI CÙNG NHAU VÌ MỘT LÝ DO KỸ THUẬT CỤ THỂ:
 * `three` chỉ cho MỘT `onBeforeCompile` trên mỗi vật liệu. Viết thành hai hàm độc lập thì hàm sau
 * xoá hàm trước — im lặng, không lỗi, chỉ là một nửa bản vá biến mất. Nên hai việc gộp vào đúng
 * một lần vá, và mỗi việc có công tắc riêng để bật/tắt mà thử ngược được.
 *
 * ══ BẢN VÁ 1 — HẠT VÂN ══════════════════════════════════════════════════════════════════════
 * Đợt audit đo ra: toàn tầng vẽ có **0 texture và 0 toạ độ UV**. Hình học chỉ mang position /
 * normal / color, nghĩa là một bức tường 3 × 20 mét là ĐÚNG MỘT MÀU và một quả đồi 70 mét là một
 * màu cộng vài đốm mờ. Không lượng ánh sáng nào chữa được chuyện đó — chiếu sáng hoàn hảo một mặt
 * phẳng đơn sắc thì nó vẫn là mặt phẳng đơn sắc, và đó là lý do mọi thứ đọc ra "đất nặn".
 *
 * ⚠️ VÌ SAO KHÔNG THÊM UV RỒI DÁN ẢNH: thêm UV nghĩa là sửa cả `geometryFactory` lẫn
 * `terrainMesh` (mỗi khối, mỗi tam giác địa hình), rồi phải nghĩ ra luật trải UV cho hình lăng trụ
 * n cạnh, rồi gánh thêm bộ nhớ texture — thứ mà iOS Safari giết tab vì nó. Nhiễu 3 CHIỀU theo toạ
 * độ THẾ GIỚI không cần gì trong số đó: nó liền mạch trên mọi hình dạng, không có đường nối, không
 * co giãn theo tỉ lệ khối, và hai khối cạnh nhau tự khớp vân vì chúng đọc cùng một trường nhiễu.
 * Đây cũng là lý do nó thay được "triplanar": triplanar sinh ra để dán ảnh 2D lên vật thể không có
 * UV, còn nhiễu 3D thì bỏ qua luôn cả bước ấy.
 *
 * ⚠️ VÀ NÓ PHẢI VẶN ĐỘ NHÁM, KHÔNG CHỈ VẶN MÀU. Bề mặt thật lấp lánh không phải vì màu nó lốm đốm
 * mà vì **độ nhẵn của nó lốm đốm** — chỗ mòn thì bóng hơn chỗ ráp. Vặn cả hai là chỗ hai nửa của
 * Phase 9C gặp nhau: những mảng vô tình nhẵn hơn sẽ bắt được đĩa mặt trời mới nướng vào môi
 * trường, tức hạt vân TỰ SINH RA điểm loé thay vì chỉ tô màu.
 *
 * ══ BẢN VÁ 2 — TÁCH ĐÔI ÁNH SÁNG MÔI TRƯỜNG ═════════════════════════════════════════════════
 * ⚠️ ĐÂY LÀ NGUYÊN NHÂN GỐC THẬT SỰ CỦA "KHÔNG CÓ ĐIỂM SÁNG NÀO", và nó đúng bằng cái bẫy mà dự
 * án đã gặp bốn lần: **MỘT TRƯỜNG GÁNH HAI VIỆC** — chỉ lần này thủ phạm là API của three.
 *
 * `envMapIntensity` nhân vào CẢ HAI đường: ánh sáng khuếch tán từ môi trường (`getIBLIrradiance`)
 * và phản chiếu bóng từ môi trường (`getIBLRadiance`). Dự án đặt nó 0,12 sau khi ĐO — vì đường
 * khuếch tán rọi đều mọi hướng, để 1,0 thì nó kéo mặt khuất lên ngang mặt hứng nắng và giết sạch
 * chiaroscuro (bảng đo ở `ENV_DIFFUSE`, `sceneGraph.js`). Con số ấy đúng cho việc của nó.
 * Nhưng nó bóp luôn đường thứ hai xuống 12%, mà đường thứ hai mới là chỗ điểm loé sống. Hệ quả:
 * cảnh **về mặt cấu trúc không thể** có một vệt nắng bắt trên mái ngói, dù có nướng bao nhiêu mặt
 * trời vào môi trường đi nữa. Đo thật: thêm đĩa mặt trời độ chói 30 mà kỷ 7 chỉ nhích 0,747 →
 * 0,755, còn "% điểm sáng hơn 0,75" vẫn đứng nguyên 0,00%.
 *
 * ⇒ Tách ra: khuếch tán GIỮ NGUYÊN 0,12 (không được đụng, đó là số bảo vệ độ tươi), phản chiếu
 * nhân bù lên `ENV_SPECULAR`. Chỗ cắm là ngay sau `lights_fragment_maps`, nơi three vừa cộng xong
 * `radiance` (phản chiếu) và `iblIrradiance` (khuếch tán) thành HAI biến riêng — nên nhân vào một
 * biến là chạm đúng một đường. Và điều này ĐÚNG HƠN về vật lý chứ không phải gian lận: phản chiếu
 * bóng của một vật thể ngoài trời vốn nhận trọn bầu trời; chính con số 0,12 mới là chỗ nói dối,
 * nó chỉ được phép nói dối ở đường khuếch tán.
 *
 * ⚠️⚠️ NHƯNG CHỈ ÁP CHO CÔNG TRÌNH — MẶT ĐẤT, MẶT ĐƯỜNG VÀ VÙNG ĐẤT XA THÌ KHÔNG. Đây là kết quả
 * ĐO, không phải trực giác, và bản đầu của chính bản vá này đã làm sai:
 *
 *     kỷ 3 / kỷ 7 / kỷ 14, 12 giờ        độ tươi TB          sáng nhất
 *     trước                              0,120 · 0,082 · 0,109    0,740 · 0,747 · 0,798
 *     bóc phanh CHO TẤT CẢ               0,109 · 0,070 · 0,102    0,753 · 0,773 · 0,869
 *     bóc phanh CHỈ CÔNG TRÌNH  ← chọn   0,119 · 0,078 · 0,109    0,753 · 0,773 · 0,869
 *
 * Đọc hai dòng cuối: bỏ mặt đất/đường/đồi ra khỏi bản vá thì **đỉnh sáng KHÔNG mất một chút nào**
 * (0,753 · 0,773 · 0,869 y hệt) mà độ tươi gần như hồi nguyên. Nghĩa là ba bề mặt ấy gây RA TOÀN
 * BỘ phần mất màu và ĐÓNG GÓP BẰNG KHÔNG cho phần được. Lý do có thật: chúng nhám 0,96–0,98, thuỳ
 * phản chiếu rộng gần bằng cả bán cầu, nên "phản chiếu" của chúng chính là một lớp sáng đều phủ
 * lên trên — tức đúng cơ chế đã làm hỏng Phase 7A, chỉ vào bằng cửa khác. Còn công trình thì có
 * mặt nghiêng, có mép, có vật liệu nhẵn, nên phản chiếu ở đó ra ĐIỂM chứ không ra MẢNG.
 * ⇒ Luật rút ra, áp cho mọi lần sau: **bóc phanh phản chiếu chỉ có nghĩa trên bề mặt đủ nhẵn để
 * phản chiếu thành hình. Trên bề mặt rất nhám nó chỉ là ánh sáng nền đội lốt phản chiếu.**
 */

/**
 * Mức phản chiếu môi trường ĐẦY ĐỦ. 1,0 = đúng vật lý (mặt bóng ngoài trời nhận trọn bầu trời).
 * ⚠️ Đây KHÔNG phải cần gạt để "làm sáng cảnh lên". Với vật liệu điện môi, số này còn bị nhân tiếp
 * với hệ số Fresnel (~0,04 khi nhìn thẳng, tăng dần ở góc xiên), nên nó gần như chỉ hiện ra ở mép
 * khối và mặt nghiêng — đúng chỗ ảnh chụp thật có ánh sáng viền. Kim loại vốn đã nhận trọn 1,0 nên
 * `specularGainFor` trả về 1 cho chúng, tức bản vá này KHÔNG đụng tới kim loại.
 */
export const ENV_SPECULAR = 1;

/**
 * Hệ số nhân bù cho một vật liệu đang khai `envMapIntensity` bằng bao nhiêu.
 *
 * ⚠️ MỘT LUẬT MỘT CÔNG THỨC. Hàm này là nơi DUY NHẤT biết cách quy đổi; nơi gọi chỉ việc truyền
 * đúng cái `envMapIntensity` mình vừa khai. Chép công thức `1 / 0.12` ra chỗ gọi thì ngày nào có
 * ai chỉnh `ENV_DIFFUSE`, phản chiếu sẽ lặng lẽ lệch đi mà không có gì đỏ lên — đúng hình dạng lỗi
 * mà `TECH_DEBT #27` (mặt đường) đã trả giá.
 */
export function specularGainFor(envMapIntensity) {
  const base = Number.isFinite(envMapIntensity) && envMapIntensity > 0 ? envMapIntensity : 1;
  return Math.max(1, ENV_SPECULAR / base);
}

/**
 * Nhiễu giá trị 3 chiều + hai tầng, viết bằng GLSL.
 *
 * ⚠️ HAI TẦNG CHỨ KHÔNG PHẢI MỘT, và mỗi tầng một việc: tầng thô (`nBig`) tạo vệt loang cỡ vài
 * chục xăng-ti-mét — thứ đọc ra "vữa trát không đều", "đất chỗ ẩm chỗ khô"; tầng mịn (`nFine`)
 * tạo hạt cỡ centimet — thứ đọc ra "bề mặt có nhám". Chỉ một tầng thì hoặc ra vệt loang trông như
 * lỗi bảng màu, hoặc ra hạt đều trông như bộ lọc nhiễu dán đè lên ảnh.
 *
 * ⚠️ `uDetailPos` là toạ độ THẾ GIỚI, không phải toạ độ đối tượng. Dùng toạ độ đối tượng thì hai
 * căn nhà cùng bản vẽ sẽ có vân giống hệt nhau tới từng vệt, và mắt bắt được ngay sự lặp lại đó.
 */
const NOISE_GLSL = /* glsl */`
varying vec3 vDetailPos;
uniform float uDetailScale;
uniform float uDetailStrength;
uniform float uDetailRough;
uniform float uSpecGain;

float detailHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float detailNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(detailHash(i + vec3(0.0, 0.0, 0.0)), detailHash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(detailHash(i + vec3(0.0, 1.0, 0.0)), detailHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(detailHash(i + vec3(0.0, 0.0, 1.0)), detailHash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(detailHash(i + vec3(0.0, 1.0, 1.0)), detailHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
`;

/**
 * Vá một `MeshStandardMaterial`.
 *
 * @param {object} material  vật liệu three (bị sửa tại chỗ)
 * @param {object} [opts]
 * @param {number} [opts.scale]     số chu kỳ vân trên MỘT ô lưới. Lớn = hạt mịn.
 * @param {number} [opts.strength]  biên độ đổi màu, dạng tỉ lệ (0,08 = ±8%).
 * @param {number} [opts.roughness] biên độ đổi độ nhám (0,12 = ±0,12).
 * @param {number} [opts.specularGain] hệ số nhân cho phản chiếu môi trường — dùng `specularGainFor`.
 * @returns {object} chính `material`, để gọi lồng được vào `track(new MeshStandardMaterial(...))`
 */
export function applySurfaceDetail(material, opts = {}) {
  const scale = Number.isFinite(opts.scale) ? opts.scale : 6;
  const strength = Number.isFinite(opts.strength) ? opts.strength : 0.09;
  const roughness = Number.isFinite(opts.roughness) ? opts.roughness : 0.12;
  const specularGain = Number.isFinite(opts.specularGain) ? opts.specularGain : 1;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDetailScale = { value: scale };
    shader.uniforms.uDetailStrength = { value: strength };
    shader.uniforms.uDetailRough = { value: roughness };
    shader.uniforms.uSpecGain = { value: specularGain };

    // ── ĐỈNH: mang toạ độ thế giới xuống mảnh ────────────────────────────────────────────────
    // ⚠️ TỰ TÍNH, KHÔNG MƯỢN BIẾN `worldPosition` CỦA THREE. Biến đó chỉ tồn tại bên trong một
    // `#if defined( USE_ENVMAP ) || defined( USE_SHADOWMAP ) || …` — hôm nay vật liệu của ta thoả
    // điều kiện đó, nhưng gỡ `envMap` khỏi một vật liệu nào đó trong tương lai sẽ làm shader
    // KHÔNG BIÊN DỊCH ĐƯỢC, và lỗi sẽ hiện ra dưới dạng một khối đen chứ không phải một dòng báo.
    shader.vertexShader = `varying vec3 vDetailPos;\n${shader.vertexShader}`.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
      vec4 detailWorld = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        detailWorld = instanceMatrix * detailWorld;
      #endif
      vDetailPos = ( modelMatrix * detailWorld ).xyz;`,
    );

    // ── MẢNH: vân + độ nhám + phản chiếu ─────────────────────────────────────────────────────
    shader.fragmentShader = `${NOISE_GLSL}\n${shader.fragmentShader}`
      // Sau `color_fragment` là lúc `diffuseColor` đã ngậm xong màu đỉnh — vân phải nhân LÊN màu
      // cuối cùng ấy, nếu không nó sẽ bị màu đỉnh ghi đè và biến mất trong im lặng.
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 detailP = vDetailPos * uDetailScale;
        float nBig = detailNoise( detailP );
        float nFine = detailNoise( detailP * 3.7 + 11.3 );
        float detailMix = nBig * 0.62 + nFine * 0.38;
        diffuseColor.rgb *= 1.0 + ( detailMix - 0.5 ) * 2.0 * uDetailStrength;`,
      )
      // Vặn độ nhám bằng TẦNG MỊN. Dùng tầng thô thì cả một mảng tường cùng bóng lên một lượt,
      // trông như vết ố; tầng mịn cho ra những mảng nhỏ rải rác — đúng cách một bề mặt thật lấp
      // lánh, và là chỗ đĩa mặt trời có cửa lọt vào.
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp( roughnessFactor + ( nFine - 0.5 ) * uDetailRough, 0.04, 1.0 );`,
      )
      // ⚠️ CHỈ NHÂN `radiance` (phản chiếu), KHÔNG ĐỤNG `iblIrradiance` (khuếch tán). Đây chính là
      // phép tách đôi nói ở đầu file. Nhân nhầm biến kia = quay lại đúng thất bại "pastel như
      // sữa" của Phase 7A, chỉ khác đường đi.
      .replace(
        '#include <lights_fragment_maps>',
        `#include <lights_fragment_maps>
        radiance *= uSpecGain;`,
      );
  };

  // ⚠️ BẮT BUỘC. `three` gộp chương trình shader theo khoá; không khai thêm khoá riêng thì một
  // vật liệu ĐÃ vá và một vật liệu CHƯA vá có cùng cấu hình gốc sẽ dùng chung một chương trình đã
  // biên dịch — tức bản vá hoặc rò sang chỗ không nên có, hoặc biến mất ở chỗ nên có, tuỳ cái nào
  // biên dịch trước. Chuỗi hằng là đủ: mọi khác biệt giữa các vật liệu đã vá đều đi qua uniform.
  material.customProgramCacheKey = () => 'city-surface-detail-v1';
  return material;
}
