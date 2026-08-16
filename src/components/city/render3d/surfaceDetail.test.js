import test from 'node:test';
import assert from 'node:assert/strict';

import { applySurfaceDetail, ENV_SPECULAR, specularGainFor } from './surfaceDetail';

/**
 * ⚠️ FILE NÀY NẰM TRONG `render3d/` MÀ VẪN CHẠY ĐƯỢC BẰNG `node --test` — vì `surfaceDetail.js`
 * KHÔNG import three (nó chỉ ghép chuỗi GLSL và gắn một hàm gọi lại). Đó là chủ ý: phần quyết định
 * "vá bao nhiêu, vá vào đâu" tách hẳn khỏi phần cần WebGL, nên nó kiểm được không cần trình duyệt.
 * Đường dây với cảnh thì `sceneGraphWiring.test.js` canh bằng cách đọc mã nguồn.
 */

test('specularGainFor bù đúng phần `envMapIntensity` đã bóp đi', () => {
  // Bề mặt khuếch tán khai 0,12 ⇒ phải nhân bù ~8,33 lần để phản chiếu chạy ở mức đầy đủ.
  assert.ok(Math.abs(specularGainFor(0.12) - ENV_SPECULAR / 0.12) < 1e-9);

  // ⚠️ KIM LOẠI PHẢI KHÔNG BỊ ĐỤNG. Chúng vốn đã khai 1,0; nhân thêm lần nữa là thổi phồng phản
  // chiếu của đúng nhóm vật liệu vốn đã sáng nhất khung hình, và đó là đường ngắn nhất tới một
  // mái đồng cháy trắng.
  assert.equal(specularGainFor(1), 1);

  // Không bao giờ được trả về số < 1: nhân một số nhỏ hơn 1 vào `radiance` là LÀM TỐI phản chiếu,
  // tức bản vá quay ngược 180° so với mục đích của nó mà vẫn "chạy".
  assert.equal(specularGainFor(4), 1);
  assert.equal(specularGainFor(0), 1);
  assert.equal(specularGainFor(undefined), 1);
  assert.equal(specularGainFor(Number.NaN), 1);
});

test('applySurfaceDetail cắm đúng ba chỗ trong shader và không cắm nhầm chỗ thứ tư', () => {
  // Giả lập tối thiểu những gì three đưa vào `onBeforeCompile`.
  const material = {};
  applySurfaceDetail(material, { scale: 7, strength: 0.2, roughness: 0.3, specularGain: 5 });

  const shader = {
    uniforms: {},
    vertexShader: 'void main() {\n#include <worldpos_vertex>\n}',
    fragmentShader: 'void main() {\n#include <color_fragment>\n'
      + '#include <roughnessmap_fragment>\n#include <lights_fragment_maps>\n}',
  };
  material.onBeforeCompile(shader);

  assert.equal(shader.uniforms.uDetailScale.value, 7);
  assert.equal(shader.uniforms.uDetailStrength.value, 0.2);
  assert.equal(shader.uniforms.uDetailRough.value, 0.3);
  assert.equal(shader.uniforms.uSpecGain.value, 5);

  // Đỉnh: phải mang được toạ độ thế giới xuống, và phải TỰ TÍNH chứ không mượn biến `worldPosition`
  // của three (biến đó chỉ tồn tại bên trong một `#if` — xem chú thích tại chỗ).
  assert.match(shader.vertexShader, /varying vec3 vDetailPos;/);
  assert.match(shader.vertexShader, /vDetailPos = \( modelMatrix \* detailWorld \)\.xyz;/);
  assert.ok(!/worldPosition/.test(shader.vertexShader.split('#include <worldpos_vertex>')[1] ?? ''),
    'Đoạn chèn đang mượn biến `worldPosition` của three — nó không phải lúc nào cũng tồn tại.');

  // Mảnh: vân phải nhân SAU `color_fragment` (nếu trước, màu đỉnh sẽ ghi đè và vân biến mất im lặng).
  const afterColor = shader.fragmentShader.split('#include <color_fragment>')[1];
  assert.match(afterColor, /diffuseColor\.rgb \*= 1\.0 \+/);
  assert.match(shader.fragmentShader, /roughnessFactor = clamp\(/);

  // ⚠️ BẤT BIẾN QUAN TRỌNG NHẤT CỦA CẢ MODULE: nhân PHẢN CHIẾU, không nhân KHUẾCH TÁN.
  assert.match(shader.fragmentShader, /radiance \*= uSpecGain;/);
  assert.ok(!/iblIrradiance\s*\*=/.test(shader.fragmentShader),
    'Đang nhân vào đường khuếch tán — đó là cách làm nhạt cả thành phố (thất bại Phase 7A).');

  // Không khai khoá riêng thì three gộp chương trình của vật liệu đã vá với vật liệu chưa vá.
  assert.equal(typeof material.customProgramCacheKey, 'function');
  assert.equal(material.customProgramCacheKey(), 'city-surface-detail-v1');
});

test('applySurfaceDetail có mặc định an toàn khi không truyền gì', () => {
  const material = {};
  applySurfaceDetail(material);
  const shader = {
    uniforms: {},
    vertexShader: '#include <worldpos_vertex>',
    fragmentShader: '#include <color_fragment>\n#include <roughnessmap_fragment>\n'
      + '#include <lights_fragment_maps>',
  };
  material.onBeforeCompile(shader);
  // Mặc định phải là 1 — tức KHÔNG bóc phanh phản chiếu. Nơi gọi phải nói rõ mình muốn bóc thì mới
  // được bóc; mặc định "bóc sẵn" là cách mặt đất/đường/đồi lặng lẽ mất màu (xem bảng đo ở đầu file).
  assert.equal(shader.uniforms.uSpecGain.value, 1);
  assert.ok(shader.uniforms.uDetailStrength.value > 0, 'Vân mặc định bằng 0 thì bản vá thành vô hình.');
});
