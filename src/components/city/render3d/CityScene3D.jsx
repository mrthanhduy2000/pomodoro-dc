/**
 * CityScene3D.jsx — vỏ React của bộ vẽ 3D: vòng đời, đổi kích thước, mất WebGL context, dọn dẹp.
 *
 * ⚠️ File này KHÔNG chứa logic 3D. Dựng cảnh ở `sceneGraph.js`, camera ở `engine/city3d/orbit.js`,
 * nhịp khung hình ở `engine/city3d/renderLoop.js`, màu ở `engine/city3d/palette3d.js`. Giữ như vậy
 * để phần khó nhất (nhịp vẽ, camera) test được bằng `node --test` không cần trình duyệt.
 *
 * BỐN CÁI BẪY VÒNG ĐỜI đã tính trước:
 *   1. **StrictMode** (`src/main.jsx`) mount → unmount → mount lại ngay ở dev. Mọi thứ phải dọn
 *      được và dọn NHIỀU LẦN cũng không sao. TUYỆT ĐỐI không giữ renderer ở biến cấp module.
 *   2. **Tab bị unmount khi chuyển** — nhưng pane cũ còn sống thêm ~180 ms vì hoạt hoạ thoát.
 *      Vì vậy phải dừng vòng lặp bằng tín hiệu tường minh trong hàm dọn, không dựa vào việc
 *      "chắc là không ai vẽ nữa".
 *   3. **`webglcontextlost`** — iOS thu hồi context khi máy thiếu bộ nhớ. Phải `preventDefault()`
 *      (nếu không trình duyệt sẽ không bao giờ khôi phục) rồi báo lên trên để lùi về 2D.
 *   4. **Rời tab / khoá màn hình** — dừng hẳn, đừng vẽ vào một canvas không ai nhìn.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PerspectiveCamera, WebGLRenderer, PCFSoftShadowMap } from 'three';

import { buildScenePalette } from '../../../engine/city3d/palette3d';
import { createOrbit } from '../../../engine/city3d/orbit';
import { createRenderLoop } from '../../../engine/city3d/renderLoop';
import { ERA_METADATA } from '../../../engine/constants';
import { createCityScene } from './sceneGraph';
import { readThemeSignature, readThemeTokens } from './themeBridge';

/** Giới hạn tỉ lệ điểm ảnh. Màn Retina 3x mà vẽ đủ 3x thì tốn gấp 9 lần mà mắt gần như không thấy. */
const MAX_PIXEL_RATIO = 2;

/** Kích thước shadow map. Điện thoại lấy nửa — đây là thứ đắt thứ nhì sau số lệnh vẽ. */
const SHADOW_MAP_DESKTOP = 1024;
const SHADOW_MAP_MOBILE = 512;

export default function CityScene3D({
  layout,
  dimmed = false,
  reduceMotion = false,
  onStats,
  onFallback,
}) {
  const hostRef = useRef(null);
  const runtimeRef = useRef(null);
  const [failed, setFailed] = useState(false);

  // Giữ callback trong ref: chúng đổi mỗi lần render cha, mà ta KHÔNG muốn dựng lại cả cảnh WebGL
  // chỉ vì một hàm mới được tạo.
  const onStatsRef = useRef(onStats);
  const onFallbackRef = useRef(onFallback);
  useEffect(() => { onStatsRef.current = onStats; }, [onStats]);
  useEffect(() => { onFallbackRef.current = onFallback; }, [onFallback]);

  const giveUp = useCallback((reason, error) => {
    setFailed(true);
    onFallbackRef.current?.(reason, error);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || failed) return undefined;

    let renderer = null;
    let runtime = null;

    try {
      const canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.touchAction = 'none';       // cần, nếu không iOS sẽ cuộn trang khi kéo camera
      host.appendChild(canvas);

      renderer = new WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        // 'default' chứ KHÔNG phải 'high-performance': trên laptop hai card, 'high-performance'
        // đánh thức card rời chỉ để vẽ vài trăm tam giác — tốn pin mà không nhanh hơn chút nào.
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
      // ⚠️ Đôi với `shadow.autoUpdate = false` ở `sceneGraph.js`: shadow map chỉ được vẽ lại khi
      // ta chủ động yêu cầu, không phải mỗi khung hình.
      renderer.shadowMap.autoUpdate = false;

      const isMobile = Math.min(window.innerWidth, window.innerHeight) < 768;
      const palette = buildScenePalette({
        tokens: readThemeTokens(canvas),
        eraColor: ERA_METADATA[layout.era]?.accentColor,
      });

      const city = createCityScene({ layout, palette, dimmed });
      city.sun.shadow.mapSize.setScalar(isMobile ? SHADOW_MAP_MOBILE : SHADOW_MAP_DESKTOP);

      const camera = new PerspectiveCamera(38, 1, 0.5, layout.gridSize * 6);
      const orbit = createOrbit({
        distance: layout.gridSize * 1.85,
        minDistance: layout.gridSize * 0.95,
        maxDistance: layout.gridSize * 3.1,
      });

      function applyCamera() {
        const eye = orbit.getPosition();
        const target = orbit.getTarget();
        camera.position.set(eye.x, eye.y, eye.z);
        camera.lookAt(target.x, target.y, target.z);
      }

      function resize() {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, Math.round(width * 0.62));   // tỉ lệ khung cố định, hợp cả 2 hướng
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      let shadowsDirty = true;
      function renderFrame() {
        applyCamera();
        if (shadowsDirty) {
          // Chỉ vẽ lại bóng đúng khung hình cần. Bật `autoUpdate` lên một nhịp rồi tắt ngay là
          // cách chính thức của three để "cập nhật một lần".
          renderer.shadowMap.needsUpdate = true;
          shadowsDirty = false;
        }
        renderer.render(city.scene, camera);
      }

      const loop = createRenderLoop({
        render: renderFrame,
        requestFrame: (cb) => window.requestAnimationFrame(cb),
        cancelFrame: (id) => window.cancelAnimationFrame(id),
        now: () => performance.now(),
        onSlow: ({ fps }) => giveUp('slow', new Error(`FPS thấp kéo dài (${Math.round(fps)})`)),
        onError: (error) => giveUp('render-error', error),
      });

      // ── Tương tác: kéo để xoay ──────────────────────────────────────────────
      let dragPointer = null;
      let lastX = 0;
      let lastY = 0;

      function onPointerDown(event) {
        if (dragPointer !== null) return;
        dragPointer = event.pointerId;
        lastX = event.clientX;
        lastY = event.clientY;
        canvas.setPointerCapture?.(event.pointerId);
        loop.beginSustained('drag');
      }

      function onPointerMove(event) {
        if (event.pointerId !== dragPointer) return;
        orbit.drag(event.clientX - lastX, event.clientY - lastY);
        lastX = event.clientX;
        lastY = event.clientY;
      }

      function endDrag(event) {
        if (event.pointerId !== dragPointer) return;
        dragPointer = null;
        canvas.releasePointerCapture?.(event.pointerId);
        loop.endSustained('drag');
        publishStats();
      }

      function onWheel(event) {
        event.preventDefault();
        if (orbit.zoom(event.deltaY > 0 ? 1.12 : 0.89)) loop.invalidate();
      }

      // ── Mất/khôi phục WebGL context ─────────────────────────────────────────
      function onContextLost(event) {
        // Bắt buộc: không chặn mặc định thì trình duyệt sẽ KHÔNG bao giờ bắn `restored`.
        event.preventDefault();
        loop.stop();
        giveUp('lost-context', new Error('Trình duyệt thu hồi WebGL context'));
      }

      // ── Rời tab ─────────────────────────────────────────────────────────────
      // ⚠️ `pause` chứ KHÔNG phải `stop`: `stop` là vĩnh viễn (dùng khi tháo cảnh), gọi nhầm ở đây
      // thì quay lại tab sẽ thấy thành phố đóng băng và không có cách nào cứu ngoài đổi kỷ.
      function onVisibility() {
        if (document.visibilityState === 'hidden') {
          dragPointer = null;         // ngón tay không còn trên màn hình nữa
          loop.pause();
        } else {
          loop.resume();
        }
      }

      function publishStats() {
        onStatsRef.current?.({
          ...loop.getStats(),
          ...city.stats,
          shadowMap: city.sun.shadow.mapSize.width,
          pixelRatio: renderer.getPixelRatio(),
        });
      }

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);
      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.addEventListener('webglcontextlost', onContextLost);
      document.addEventListener('visibilitychange', onVisibility);

      const observer = new ResizeObserver(() => { resize(); loop.invalidate(); });
      observer.observe(host);

      // Đổi theme/skin → đọc lại token màu rồi dựng lại cảnh. Rẻ hơn nhiều so với việc theo dõi
      // từng biến CSS, và chuyện này chỉ xảy ra khi Đàm bấm đổi giao diện.
      const themeSignature = readThemeSignature(canvas);

      resize();
      applyCamera();
      loop.invalidate();

      // Số liệu đầu tiên gửi ở khung hình kế — lúc này `renderer.info` còn rỗng.
      const statsTimer = window.setTimeout(publishStats, 120);

      runtime = {
        canvas,
        loop,
        city,
        observer,
        statsTimer,
        themeSignature,
        invalidate: () => loop.invalidate(),
        markShadowsDirty: () => { shadowsDirty = true; city.invalidateShadows(); },
        dispose() {
          window.clearTimeout(statsTimer);
          loop.stop();
          observer.disconnect();
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', endDrag);
          canvas.removeEventListener('pointercancel', endDrag);
          canvas.removeEventListener('wheel', onWheel);
          canvas.removeEventListener('webglcontextlost', onContextLost);
          document.removeEventListener('visibilitychange', onVisibility);
          city.dispose();
          renderer.dispose();
          // Trả context về cho trình duyệt ngay thay vì đợi bộ dọn rác. Safari giới hạn số
          // context sống cùng lúc khá chặt — giữ lại là lần sau mở tab sẽ không dựng được.
          renderer.forceContextLoss?.();
          canvas.remove();
        },
      };
      runtimeRef.current = runtime;
    } catch (error) {
      // Dựng WebGL thất bại (máy từ chối, hết bộ nhớ đồ hoạ...) → lùi về 2D, không để màn hình trống.
      runtime?.dispose?.();
      renderer?.dispose?.();
      runtimeRef.current = null;
      // ⚠️ Hoãn sang microtask thay vì gọi thẳng: đổi state NGAY trong thân effect sẽ kích hoạt
      // một lượt render lồng nhau ngay giữa lúc effect chưa chạy xong (react-hooks bắt lỗi này).
      // Ở đây không cần gấp một nhịp nào — chỉ cần lùi về 2D ở lượt render kế tiếp.
      queueMicrotask(() => giveUp('init-failed', error));
      return undefined;
    }

    return () => {
      runtime.dispose();
      if (runtimeRef.current === runtime) runtimeRef.current = null;
    };
    // Dựng lại cảnh khi bố cục đổi (đổi kỷ, xây thêm nhà) hoặc khi đổi giữa "đang xây"/"đã niêm phong".
  }, [layout, dimmed, failed, giveUp]);

  // Bật/tắt giảm chuyển động không cần dựng lại cảnh — chỉ đổi cách vẽ khung tiếp theo.
  useEffect(() => {
    runtimeRef.current?.invalidate();
  }, [reduceMotion]);

  if (failed) return null;

  return (
    <div
      ref={hostRef}
      className="w-full overflow-hidden rounded-[14px]"
      style={{ background: 'var(--canvas-2)', cursor: 'grab' }}
      role="img"
      aria-label={`Thành phố 3D có ${layout.buildings.length} công trình`}
    />
  );
}
