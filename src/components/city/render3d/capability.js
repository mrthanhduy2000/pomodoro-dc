/**
 * capability.js — dò xem máy có thật sự chạy được WebGL2 không.
 *
 * ⚠️ PHẢI DÒ BẰNG CÁCH TẠO THỬ CONTEXT, không được chỉ kiểm tra `'WebGL2RenderingContext' in
 * window`. Safari (và một số máy Android) có sẵn constructor nhưng `getContext('webgl2')` vẫn trả
 * `null` khi máy hết tài nguyên đồ hoạ hoặc người dùng đã tắt tăng tốc phần cứng. Kiểm tra kiểu
 * "có tên biến không" sẽ báo CÓ rồi để cảnh 3D sập lúc dựng — đúng thứ ta muốn tránh.
 *
 * Context dò xong được **huỷ ngay** (`loseContext`): trình duyệt giới hạn số WebGL context sống
 * cùng lúc (Safari khá chặt), giữ lại một cái chỉ để "đã dò rồi" là phí một suất.
 *
 * Luật quyết định (thuần, có test) nằm ở `src/engine/city3d/renderMode.js` — file này chỉ ĐO.
 */

/**
 * @param {Document} [doc]
 * @returns {boolean} luôn trả boolean, không bao giờ ném lỗi
 */
export function probeWebGL2(doc) {
  const d = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!d?.createElement) return false;

  let canvas = null;
  let gl = null;
  try {
    canvas = d.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    // `failIfMajorPerformanceCaveat` loại đúng trường hợp trình duyệt phải vẽ bằng CPU (rất chậm),
    // vốn là kịch bản tệ nhất: chạy được nhưng giật và nóng máy.
    gl = canvas.getContext('webgl2', {
      failIfMajorPerformanceCaveat: true,
      powerPreference: 'default',
    });
    return !!gl;
  } catch {
    return false;
  } finally {
    try {
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      // Không dọn được thì thôi — context 1×1 sẽ được thu hồi khi canvas bị bỏ.
    }
  }
}
