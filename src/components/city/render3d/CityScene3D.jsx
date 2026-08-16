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
import { PerspectiveCamera, Raycaster, Vector2, WebGLRenderer } from 'three';

import { buildScenePalette } from '../../../engine/city3d/palette3d';
import { deriveDaylight } from '../../../engine/city3d/daylight';
import { CITY_CAMERA_FOV, cityOrbitOptions, createOrbit } from '../../../engine/city3d/orbit';
import { createRenderLoop } from '../../../engine/city3d/renderLoop';
import { pickNearest } from '../../../engine/city3d/pick';
import { ERA_METADATA } from '../../../engine/constants';
import { getVietnamHour } from '../../../engine/time';
import { applyPaintedLook, createCityScene, MAX_PIXEL_RATIO } from './sceneGraph';
import { readThemeSignature, readThemeTokens } from './themeBridge';

/**
 * Trần nhịp khung hình cho hoạt hoạ cư dân.
 * 30 là điểm cân bằng: đủ mượt để mắt đọc ra "đang đi bộ", và bằng đúng một phần tư công việc so
 * với màn 120 Hz của iPhone đời mới. Người đi bộ không phải trò bắn súng — thêm khung hình ở đây
 * không đổi lấy gì ngoài nhiệt máy.
 */
const ANIMATION_FPS = 30;

export default function CityScene3D({
  layout,
  dimmed = false,
  reduceMotion = false,
  // ⚠️ Nhận SỐ RỜI chứ không nhận một object `stats`. Cảnh WebGL được dựng lại mỗi khi phụ thuộc
  // của effect đổi, mà một object mới được tạo ở mỗi lượt render cha sẽ đổi danh tính LIÊN TỤC —
  // tức là dựng lại cả cảnh 3D vài lần mỗi giây. Số nguyên thì so sánh bằng giá trị, luôn ổn định.
  sessionCount = 0,
  streakLength = 0,
  onStats,
  onFallback,
  // ── Ba công tắc dưới đây sinh ra cho LỚP NỀN Ở TRANG CHỦ (Phase 3F) ──────────
  // ⚠️ Cùng một cảnh, hai vai trò khác hẳn nhau — và đó chính là lý do phải có tham số chứ KHÔNG
  // được tách một bản sao thứ hai của file này: tab Thành Phố là chỗ để NGẮM (chuyển động chính là
  // nội dung, kéo xoay được, khung hình giữ tỉ lệ cố định); trang chủ là chỗ để LÀM VIỆC (thành
  // phố chỉ là khung cảnh phía sau — không được nuốt thao tác, không được ăn pin suốt 25 phút).
  /** Đứng yên tuyệt đối: không cư dân, vẽ xong khung đầu là hết nhịp rAF. */
  still = false,
  /** Lấp đầy CHIỀU CAO ô chứa thay vì giữ tỉ lệ khung 1 : 0,62. */
  fill = false,
  /** Nhận thao tác kéo/lăn chuột. Lớp nền phải TẮT — nếu không nó nuốt cú cuộn trang của Đàm. */
  interactive = true,
  /**
   * Chạm vào một công trình → gọi với `{ kind, bpId }`; chạm vào chỗ trống → gọi với `null`.
   * ⚠️ Chỉ hoạt động khi `interactive`. Lớp nền trang chủ không nhận thao tác nào, nên nó cũng
   * không thể chạm — đúng ý: ở đó thành phố là khung cảnh, không phải thứ để bấm.
   */
  onPick,
}) {
  const hostRef = useRef(null);
  const runtimeRef = useRef(null);
  const [failed, setFailed] = useState(false);
  // Theme của cảnh, do chính bảng màu quyết định (`palette.isDark`) chứ không đoán lại từ DOM.
  // Chỉ dùng cho lớp viền tối bên dưới — xem giải thích ở đó.
  const [darkScene, setDarkScene] = useState(false);

  // ⚠️ CHẶNG NGÀY PHẢI ĐI THEO ĐỒNG HỒ KHI ĐÀM MỞ LẠI APP — nếu không thì lời hứa "mỗi lần mở app
  // là một cảnh khác" (`daylight.js`) BỊ VỠ đúng ở cách Đàm dùng nhiều nhất.
  // Cảnh đọc đồng hồ đúng một lần lúc dựng, rồi giữ nguyên tới lần dựng lại kế tiếp. Danh sách phụ
  // thuộc của effect chính KHÔNG có gì liên quan tới thời gian, nên phần lớn trường hợp được
  // `sessionCount` cứu (xong một phiên là dựng lại ⇒ đọc lại đồng hồ). Trường hợp KHÔNG được cứu:
  // **iPhone (PWA) chỉ ĐÓNG BĂNG tab chứ không đóng hẳn.** Mở app buổi sáng, cất máy, mở lại lúc
  // tối → React KHÔNG mount lại, cảnh giữ nguyên bầu trời buổi sáng giữa đêm.
  // Đây đúng họ lỗi mà tầng đồng bộ đã phải vá (`syncService.js`, "BẢN VÁ C1": timer debounce
  // KHÔNG BAO GIỜ nổ trên iOS vì tab bị đóng băng) — cùng nền tảng, cùng nguyên nhân, nên dùng lại
  // đúng tín hiệu đó: `visibilitychange`.
  // ⚠️ CHỈ SO SÁNH TÊN CHẶNG, không so giờ: giá trị chỉ đổi tối đa 6 lần/ngày nên `setState` gần
  // như luôn bị React bỏ qua ⇒ không có lượt render thừa, không có cảnh dựng lại thừa.
  // ⚠️ CỐ Ý KHÔNG hẹn giờ định kỳ. Trường hợp duy nhất còn hở là app mở + đang hiện suốt nhiều giờ
  // mà không xong phiên nào — tức đang có người nhìn một app đứng yên. Đổi lại, không có nguy cơ
  // cảnh dựng lại GIỮA một phiên tập trung (chớp hình lúc đang tập trung tệ hơn bầu trời trễ vài
  // phút). Ghi rõ đánh đổi ở đây để phiên sau đừng "sửa" bằng cách thêm `setInterval`.
  const [dayPhase, setDayPhase] = useState(() => deriveDaylight(getVietnamHour()).phase);
  useEffect(() => {
    const recheck = () => {
      if (document.visibilityState !== 'visible') return;
      const now = deriveDaylight(getVietnamHour()).phase;
      setDayPhase((prev) => (prev === now ? prev : now));
    };
    document.addEventListener('visibilitychange', recheck);
    return () => document.removeEventListener('visibilitychange', recheck);
  }, []);

  // Giữ callback trong ref: chúng đổi mỗi lần render cha, mà ta KHÔNG muốn dựng lại cả cảnh WebGL
  // chỉ vì một hàm mới được tạo.
  const onStatsRef = useRef(onStats);
  const onFallbackRef = useRef(onFallback);
  const onPickRef = useRef(onPick);
  useEffect(() => { onStatsRef.current = onStats; }, [onStats]);
  useEffect(() => { onFallbackRef.current = onFallback; }, [onFallback]);
  useEffect(() => { onPickRef.current = onPick; }, [onPick]);

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
      // Nén dải sáng + cấu hình bóng đổ — xem `applyPaintedLook`. Dùng CHUNG với trang xem thử,
      // và đó là điều kiện để công cụ xem thử nhìn thấy đúng thứ máy của Đàm nhìn thấy.
      applyPaintedLook(renderer);

      const isMobile = Math.min(window.innerWidth, window.innerHeight) < 768;

      // ⚠️ ĐỌC ĐỒNG HỒ ĐÚNG MỘT LẦN, TẠI ĐÂY. `deriveDaylight` là hàm thuần nhận GIỜ (test được với
      // bất kỳ giờ nào, không cần giả lập `Date`); việc lấy giờ thật là của tầng ngoài — đúng ranh
      // giới engine/tầng-ngoài mà cả dự án đang giữ.
      // ⚠️ Và phải là GIỜ VIỆT NAM, không phải giờ máy: một cái máy để nhầm múi giờ không được biến
      // buổi chiều của Đàm thành nửa đêm.
      // Cảnh giữ nguyên chặng cho tới lần dựng lại kế tiếp — cố ý: theo dõi đồng hồ từng phút để
      // đổi màu trời là tốn pin cho một thứ không ai ngồi nhìn.
      const daylight = deriveDaylight(getVietnamHour());

      const palette = buildScenePalette({
        tokens: readThemeTokens(canvas),
        eraColor: ERA_METADATA[layout.era]?.accentColor,
        // ⚠️ `era` (số) KHÁC `eraColor` (sắc kỷ dùng cho tường/đất): nó cho bảng màu tra được VẬT
        // LIỆU LỢP MÁI thật của kỷ. Thiếu nó thì mái lùi về dùng `accentColor` — tức đình làng
        // Việt lại ra mái tím. Xem đầu `palette3d.js`.
        era: layout.era,
        daylight,
      });
      // An toàn trong thân effect: `darkScene` KHÔNG nằm trong danh sách phụ thuộc, nên đổi nó
      // chỉ sinh thêm một lượt render chứ không dựng lại cảnh (càng không thành vòng lặp).
      setDarkScene(palette.isDark);

      const city = createCityScene({
        layout,
        palette,
        dimmed,
        stats: { sessionCount, streakLength },
        daylight,
        // ⚠️ CẢNH CẦN RENDERER để nướng bản đồ môi trường (PMREM) từ chính bầu trời của nó. Thiếu
        // tham số này thì cảnh vẫn dựng được nhưng mọi bề mặt kim loại sẽ ĐEN — xem
        // `createSkyEnvironment` ở `sceneGraph.js`.
        renderer,
        // Điện thoại bớt một đèn đêm. Đèn điểm là thứ duy nhất ở đây tính tiền theo từng điểm ảnh,
        // mà iPhone của Đàm vừa có mật độ điểm ảnh cao vừa là máy phải giữ mát suốt phiên 25 phút.
        // Dùng CHUNG tín hiệu `isMobile` với cỡ shadow map ngay dưới — một máy đã đáng hạ bóng thì
        // cũng đáng bớt đèn, để hai ngưỡng không trôi khỏi nhau theo thời gian.
        maxLamps: isMobile ? 2 : 3,
        // Cùng tín hiệu ấy quyết luôn cỡ bản đồ bóng đổ, ngay trong lúc dựng cảnh — xem
        // `SHADOW_MAP_DESKTOP` ở `sceneGraph.js`.
        isMobile,
        // Bảo tàng (kỷ đã niêm phong) đứng yên tuyệt đối — đúng tinh thần "bảo tàng bất động";
        // và khi Đàm bật giảm chuyển động ở mức hệ điều hành thì KHÔNG có gì được nhúc nhích.
        still: dimmed || reduceMotion || still,
      });

      // ⚠️ Mặt phẳng xa 8 × gridSize, KHÔNG phải 6. Vòm trời ở `sceneGraph.js` có bán kính
      // 3,6 × gridSize và camera lùi được tới 3,1 × gridSize — tổng 6,7 phải NHỎ HƠN mặt phẳng xa,
      // nếu không nửa vòm phía sau bị cắt và bầu trời chuyển sắc biến mất, chỉ còn màu nền phẳng.
      const camera = new PerspectiveCamera(CITY_CAMERA_FOV, 1, 0.5, layout.gridSize * 8);
      const orbit = createOrbit(cityOrbitOptions(layout.gridSize, layout.era));

      // Dùng LẠI hai đối tượng này cho mọi cú chạm. Tạo mới mỗi lần chạm thì chẳng chết ai, nhưng
      // đây là file mà cả bộ dọn rác lẫn nhịp vẽ đều đang được giữ gìn từng chút một.
      const raycaster = new Raycaster();
      const pickPointer = new Vector2();

      function applyCamera() {
        const eye = orbit.getPosition();
        const target = orbit.getTarget();
        camera.position.set(eye.x, eye.y, eye.z);
        camera.lookAt(target.x, target.y, target.z);
      }

      function resize() {
        const width = Math.max(1, host.clientWidth);
        // `fill`: bám đúng chiều cao ô chứa (lớp nền trang chủ, cao thấp tuỳ màn hình).
        // Mặc định: tỉ lệ khung cố định 1 : 0,62 — hợp cả màn dọc lẫn màn ngang.
        const height = fill
          ? Math.max(1, host.clientHeight)
          : Math.max(1, Math.round(width * 0.62));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Mốc thời gian gốc của hoạt hoạ. Dùng đồng hồ TUYỆT ĐỐI chứ không cộng dồn từng khung:
      // nhờ vậy bỏ lỡ khung hình (máy bận, tab bị treo) không làm thành phố trôi chậm lại, và
      // quay lại tab sau nửa tiếng thì cư dân đang ở đúng chỗ đáng lẽ phải tới.
      const startedAt = performance.now();

      let shadowsDirty = true;
      function renderFrame() {
        if (city.isAnimated) city.updateResidents((performance.now() - startedAt) / 1000);
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
        // ⚠️ Trần nhịp khung hình. Cư dân đi bộ ở 30 khung/giây trông y hệt ở 120 — chỉ khác cái
        // pin. Trên iPhone ProMotion, không có trần này thì mở tab Thành Phố là vẽ gấp bốn lần
        // công việc cần thiết. Ngưỡng watchdog tự tính theo trần (xem `slowThresholdFor`).
        targetFps: ANIMATION_FPS,
        onSlow: ({ fps }) => giveUp('slow', new Error(`FPS thấp kéo dài (${Math.round(fps)})`)),
        onError: (error) => giveUp('render-error', error),
      });

      // Cư dân đi lại ⇒ phải vẽ liên tục. Đây là ĐÁNH ĐỔI CÓ CHỦ Ý với luật "đứng yên = 0 nhịp
      // rAF": tab Thành Phố là màn hình Đàm mở ra để NGẮM, chuyển động chính là nội dung của nó.
      // Ba lớp bảo vệ pin vẫn còn nguyên: trần 30 khung/giây, dừng hẳn khi rời tab
      // (`visibilitychange`), và tắt sạch khi bật giảm chuyển động.
      if (city.isAnimated) loop.beginSustained('cư-dân');

      // ── Tương tác: kéo để xoay, CHẠM để xem công trình ──────────────────────
      let dragPointer = null;
      let lastX = 0;
      let lastY = 0;
      // Chỗ ngón tay ĐẶT XUỐNG và tổng quãng đường nó đi — dùng để phân biệt "chạm" với "kéo".
      let downX = 0;
      let downY = 0;
      let travelled = 0;

      /**
       * Ngón tay nhích bao nhiêu điểm ảnh thì coi là ĐANG KÉO chứ không phải chạm.
       *
       * ⚠️ Không được để 0. Không ai chạm màn hình cảm ứng mà giữ yên tuyệt đối được — ngón tay
       * luôn trượt vài điểm ảnh khi nhấc lên. Để 0 thì trên iPhone gần như KHÔNG BAO GIỜ chạm
       * trúng, còn trên máy tính (chuột đứng yên thật) lại chạy tốt — đúng kiểu lỗi chỉ Đàm gặp
       * còn người viết code thì không.
       */
      const TAP_SLOP = 8;

      function onPointerDown(event) {
        if (dragPointer !== null) return;
        dragPointer = event.pointerId;
        lastX = event.clientX;
        lastY = event.clientY;
        downX = event.clientX;
        downY = event.clientY;
        travelled = 0;
        canvas.setPointerCapture?.(event.pointerId);
        loop.beginSustained('drag');
      }

      function onPointerMove(event) {
        if (event.pointerId !== dragPointer) {
          // KHÔNG kéo ⇒ chỉ rê chuột qua. Đổi con trỏ khi nó nằm trên một công trình: đây là cách
          // DUY NHẤT trên máy tính để biết cảnh này bấm được, mà không phải in thêm một dòng chữ
          // hướng dẫn nào lên màn hình. Phép dò là toán thuần trên dăm cái hộp — rẻ hơn nhiều so
          // với một khung hình, nên rê chuột liên tục cũng không tốn gì đáng kể.
          if (onPickRef.current) updateHoverCursor(event);
          return;
        }
        orbit.drag(event.clientX - lastX, event.clientY - lastY);
        lastX = event.clientX;
        lastY = event.clientY;
        // ⚠️ Giữ khoảng cách XA NHẤT đã rời khỏi điểm đặt tay, không lấy khoảng cách lúc nhấc tay.
        // Kéo xoay một vòng rồi thả về đúng chỗ cũ là một cú KÉO — nhưng đo ở thời điểm nhấc tay
        // thì nó ra 0, và thành phố sẽ bật lên một thẻ thông tin mà Đàm không hề yêu cầu.
        travelled = Math.max(travelled, Math.hypot(event.clientX - downX, event.clientY - downY));
      }

      function endDrag(event) {
        if (event.pointerId !== dragPointer) return;
        dragPointer = null;
        canvas.releasePointerCapture?.(event.pointerId);
        loop.endSustained('drag');
        if (event.type === 'pointerup' && travelled <= TAP_SLOP) reportPick(event);
        publishStats();
      }

      /** Ngón tay ở đâu trên màn hình → công trình nào trong thành phố (hoặc `null`). */
      function pickAt(event) {
        const box = canvas.getBoundingClientRect();
        if (!box.width || !box.height) return null;

        // Toạ độ thiết bị chuẩn hoá: (−1,−1) góc dưới-trái → (1,1) góc trên-phải.
        pickPointer.set(
          ((event.clientX - box.left) / box.width) * 2 - 1,
          -(((event.clientY - box.top) / box.height) * 2 - 1),
        );
        raycaster.setFromCamera(pickPointer, camera);
        // Phần khó (tia cắt hộp, chọn cái gần nhất) nằm ở engine THUẦN và test được — ở đây chỉ
        // làm đúng một việc mà three.js buộc phải làm hộ: đổi điểm ảnh thành một tia.
        return pickNearest(raycaster.ray, city.pickTargets) ?? null;
      }

      function reportPick(event) {
        const report = onPickRef.current;
        if (report) report(pickAt(event));
      }

      let hoverCursor = '';
      function updateHoverCursor(event) {
        const next = pickAt(event) ? 'pointer' : 'grab';
        // Chỉ ghi khi ĐỔI: gán `style.cursor` mỗi lần chuột nhích là một phép ghi DOM mỗi vài
        // mili-giây, đúng kiểu chi phí lặt vặt mà không ai để ý cho tới lúc quạt máy kêu.
        if (next !== hoverCursor) { hoverCursor = next; canvas.style.cursor = next; }
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
          // ⚠️ `pause()` xoá SẠCH các hoạt hoạ đang chạy (đúng — ngón tay đâu còn trên màn hình
          // khi Đàm chuyển sang app khác). Nhưng cư dân thì không phải thao tác của người dùng,
          // nên phải tự bật lại; quên bước này thì quay lại tab sẽ thấy một thành phố chết đứng.
          if (city.isAnimated) loop.beginSustained('cư-dân');
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

      // ⚠️ Lớp nền KHÔNG gắn một trình xử lý thao tác nào. Chỉ đặt `pointer-events: none` lên thẻ
      // bọc là chưa đủ an tâm: `wheel` ở đây đăng ký `passive: false` và có `preventDefault`, nên
      // nếu vì lý do nào đó nó vẫn nhận được sự kiện thì cú cuộn trang của Đàm bị nuốt mất. Không
      // gắn thì không có gì để nuốt.
      if (interactive) {
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);
        canvas.addEventListener('wheel', onWheel, { passive: false });
      }
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
    // ⚠️ `reduceMotion`, `sessionCount`, `streakLength` PHẢI có mặt: cả ba đều được đọc lúc dựng
    // cảnh (`still`, dân số) và cảnh không có đường nào cập nhật chúng sau khi đã dựng xong. Thiếu
    // chúng thì bật "giảm chuyển động" xong cư dân vẫn đi, và xong thêm 20 phiên mà phố vẫn vắng
    // như cũ cho tới lần đổi kỷ kế tiếp. Dựng lại cảnh ở đây rẻ và hiếm — cả ba đều là số nguyên
    // đổi vài lần mỗi ngày, không phải object mới mỗi lượt render.
    // ⚠️ `dayPhase` nằm trong danh sách này để cảnh dựng lại KHI SANG CHẶNG NGÀY MỚI — xem khối
    // giải thích ở chỗ khai báo `dayPhase`. Nó KHÔNG được dùng trong thân effect (thân effect đọc
    // đồng hồ tươi qua `getVietnamHour()`, là nguồn sự thật duy nhất); có mặt ở đây thuần tuý làm
    // TÍN HIỆU dựng lại. Bỏ nó ra = bầu trời đứng im khi mở lại app trên iPhone.
  }, [layout, dimmed, failed, giveUp, reduceMotion, sessionCount, streakLength,
    still, fill, interactive, dayPhase]);

  if (failed) return null;

  return (
    <div
      className={`relative w-full overflow-hidden ${fill ? 'h-full' : 'rounded-[14px]'}`}
      style={{ background: fill ? 'transparent' : 'var(--canvas-2)' }}
    >
      <div
        ref={hostRef}
        className={fill ? 'h-full w-full' : 'w-full'}
        style={interactive ? { cursor: 'grab' } : undefined}
        // Lớp nền là TRANG TRÍ, không phải nội dung: gắn nhãn cho nó chỉ làm trình đọc màn hình
        // đọc thừa một câu vô nghĩa giữa lúc Đàm đang tìm nút Bắt đầu.
        role={fill ? undefined : 'img'}
        aria-hidden={fill ? 'true' : undefined}
        aria-label={fill ? undefined : `Thành phố 3D có ${layout.buildings.length} công trình`}
      />
      {/*
        VIỀN TỐI GÓC (vignette) — thứ rẻ nhất trong cả phase mà đổi được nhiều nhất về "chất tranh".

        ⚠️ VÌ SAO LÀ MỘT LỚP CSS CHỨ KHÔNG PHẢI POST-PROCESSING: cách "đúng bài" của đồ hoạ 3D là
        dựng thêm một lượt vẽ hậu kỳ (EffectComposer). Nó đòi thêm thư viện, thêm một khung đệm
        toàn màn hình, và **vẽ lại toàn bộ điểm ảnh mỗi khung hình** — trên iPhone đó là khoản đắt
        nhất có thể thêm vào, đúng thứ luật pin cấm. Một lớp gradient CSS đứng yên cho ra hiệu quả
        thị giác gần như y hệt với giá bằng KHÔNG: trình duyệt vẽ nó một lần rồi ghép ở tầng
        compositor, không đụng tới GPU của cảnh 3D và không tốn thêm khung hình nào.

        Vì sao nó làm cảnh trông như tranh: người vẽ sơn dầu luôn dìm bốn góc xuống để dồn mắt vào
        vùng sáng ở giữa — và lớp vecni ngả nâu của tranh cổ cũng đúng là đậm dần ra rìa. Ở đây
        dùng đen NGẢ NÂU ẤM (#2a1c0f) chứ không phải đen thuần: đen thuần cho cảm giác "hỏng màn
        hình", nâu ấm cho cảm giác "vecni cũ".
        `pointer-events: none` là BẮT BUỘC — thiếu nó thì lớp này nuốt hết thao tác kéo xoay.

        ⚠️ ĐẬM NHẠT PHẢI THEO THEME, và đây là lỗi đã thấy tận mắt ở ảnh chụp: cùng một độ đậm
        0,42 đặt lên theme sáng thì ra "vecni cũ", đặt lên theme tối thì bốn góc thành ĐEN ĐẶC —
        cảnh vốn đã tối sẵn, dìm thêm nữa là mất luôn. Viền tối là thứ tương đối với nền nó phủ
        lên, không phải một con số tuyệt đối.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: darkScene
            ? 'radial-gradient(ellipse 82% 74% at 50% 44%,'
              + ' rgba(10,8,14,0) 48%, rgba(10,8,14,0.10) 78%, rgba(10,8,14,0.24) 100%)'
            : 'radial-gradient(ellipse 76% 68% at 50% 44%,'
              + ' rgba(42,28,15,0) 42%, rgba(42,28,15,0.16) 74%, rgba(42,28,15,0.42) 100%)',
        }}
      />
    </div>
  );
}
