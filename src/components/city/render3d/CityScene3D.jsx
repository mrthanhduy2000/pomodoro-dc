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
import { deriveDaylight, museumDaylight, MUSEUM_HOUR } from '../../../engine/city3d/daylight';
import { museumWeather, weatherAt } from '../../../engine/city3d/weather';
import { museumSeason, seasonForMonth } from '../../../engine/city3d/season';
import { CITY_CAMERA_FOV, MIN_PITCH, cityOrbitOptions, createOrbit } from '../../../engine/city3d/orbit';
import { STEP, WALK_FOV, WALK_NEAR, WALK_PITCH_MAX, WALK_PITCH_MIN, createWalker } from '../../../engine/city3d/walk';
import { boxDistance, nearestBlocker, planCityFocus } from '../../../engine/city3d/cityFocus';
import { createRenderLoop } from '../../../engine/city3d/renderLoop';
import { createPostFx, postProfileFor } from './postFx';
import { pickNearest } from '../../../engine/city3d/pick';
import { planResidentFocus } from '../../../engine/city3d/residentFocus';
import { orbitPosition } from '../../../engine/city3d/orbit';
import { ERA_METADATA } from '../../../engine/constants';
import { getVietnamDayIndex, getVietnamHour, getVietnamMonthIndex } from '../../../engine/time';
import { applyPaintedLook, createCityScene, MAX_PIXEL_RATIO } from './sceneGraph';
import { readThemeSignature, readThemeTokens } from './themeBridge';

/**
 * Trần nhịp khung hình cho hoạt hoạ cư dân.
 * 30 là điểm cân bằng: đủ mượt để mắt đọc ra "đang đi bộ", và bằng đúng một phần tư công việc so
 * với màn 120 Hz của iPhone đời mới. Người đi bộ không phải trò bắn súng — thêm khung hình ở đây
 * không đổi lấy gì ngoài nhiệt máy.
 */
const ANIMATION_FPS = 30;

/**
 * Chuyến bay tới một khu phố dài bao lâu (mili-giây).
 *
 * 700 ms là chỗ cân bằng đã có tiền lệ trong dự án (camera chuyển kỷ 2,5 s là quãng đường dài hơn
 * nhiều): đủ chậm để mắt bám được là camera đang HẠ XUỐNG chứ không phải màn hình vừa nhảy sang
 * cảnh khác, đủ nhanh để không ai kịp sốt ruột. Nhịp bay đi qua `loop.beginSustained` nên nó vẫn
 * nằm dưới trần 30 khung/giây — một chuyến bay tốn nhiều nhất ~21 khung hình rồi trả nhịp về.
 * ⚠️ Bật "giảm chuyển động" ⇒ 0 ms: nhảy thẳng tới nơi, không một khung hoạt hoạ nào.
 */
const FLIGHT_MS = 700;

/** Dịu hai đầu. Nội suy vẫn TUYẾN TÍNH theo `t` đã dịu, nên tập trạng thái đi qua không đổi —
 *  đó là điều kiện để phép canh thoáng ở `cityFocus.js` còn giá trị. */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

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
  /**
   * Công trình đang được CHỌN — camera bay tới ngắm nó (VIỆC 2). Nhận HAI SỐ RỜI chứ không nhận
   * một object `{kind, bpId}`: object mới ở mỗi lượt render cha sẽ đổi danh tính liên tục và
   * effect bay sẽ nổ vài lần mỗi giây. Cùng lý do đã ghi ở `sessionCount`/`streakLength`.
   * `null` ở cả hai ⇒ thu về toàn cảnh.
   */
  focusKind = null,
  focusBpId = null,
  hour = null,      // round 50 (ADR-090): Đàm's slider — a fixed hour instead of the clock (ignored by a museum piece)
  season = null,    // round 50 (ADR-090): Đàm's picker — a season instead of the calendar (ignored by a museum piece)
  walk = false,     // round 50 (ADR-090): down on the street — the same orbit crane in walk mode (`walk.js`)
  walkApiRef = null, // round 50: the stage's buttons reach `{ step, turn }` through this ref
  cameraApiRef = null, // round 50: the postcard button reaches `{ capture }` through this ref
  /**
   * ROUND 52 (ADR-092): the post pass — ambient occlusion, god rays, bloom, lens. Đàm's switch, in
   * Settings, because he lifted a ban that was measured rather than guessed and asked to be able to
   * take it back himself. `false` builds NOTHING (see `createPostFx`), so off is genuinely free.
   */
  postFx: postFxOn = true,
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

  // Công trình đang chọn, giữ trong ref để cảnh vừa dựng xong biết ngay phải bay đi đâu. Không có
  // nó thì đổi kỷ trong lúc đang ngắm cận cảnh sẽ dựng lại cảnh ở toàn cảnh còn thẻ thông tin vẫn
  // mở — hai thứ nói hai chuyện khác nhau trên cùng một màn hình.
  const focusRef = useRef(null);
  focusRef.current = focusBpId ? { kind: focusKind, bpId: focusBpId } : null;

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
      // ⚠️ MUSEUM LIGHT (round 46, ADR-086): a SEALED era (`dimmed`) is lit at one fixed hour,
      // never by tonight's clock — measured 2,5× darker at night than at noon on a city that will
      // never change again. Same daylight profile machinery, one constant hour (`daylight.js`).
      // Round 50 (ADR-090): ONE hour and ONE season for light, weather and colour. The slider and the
      // picker override the clock and the calendar; a museum piece ignores both (its hour, weather and
      // season are frozen — ADR-086, ADR-089, ADR-090).
      const hourNow = Number.isFinite(hour) ? hour : getVietnamHour();
      const seasonNow = dimmed ? museumSeason(layout.era) : (season ?? seasonForMonth(getVietnamMonthIndex()));
      const daylight = dimmed ? museumDaylight() : deriveDaylight(hourNow);
      // Round 49 (ADR-089): the weather reads the SAME hour, and a museum piece the museum hour — forever
      const weather = dimmed ? museumWeather(layout.era) : weatherAt(layout.era, hourNow, seasonNow);
      // Round 51 (ADR-091): the sky reads the SAME hour, and a museum piece the museum hour — a sealed
      // era must not gain a different cloud when the slider moves (ADR-007).
      const skyHour = dimmed ? MUSEUM_HOUR : hourNow;
      // Which day it is, for the moon's 29,53-day cycle. Read ONCE here, through the SAME Vietnam
      // clock the hour comes from (`engine/time.js`) — a machine on the wrong timezone must not give
      // Đàm a different moon, and `Date.now()` in this file is forbidden for that exact reason.
      const dayIndex = dimmed ? 0 : getVietnamDayIndex();

      const palette = buildScenePalette({
        tokens: readThemeTokens(canvas),
        eraColor: ERA_METADATA[layout.era]?.accentColor,
        // ⚠️ `era` (số) KHÁC `eraColor` (sắc kỷ dùng cho tường/đất): nó cho bảng màu tra được VẬT
        // LIỆU LỢP MÁI thật của kỷ. Thiếu nó thì mái lùi về dùng `accentColor` — tức đình làng
        // Việt lại ra mái tím. Xem đầu `palette3d.js`.
        era: layout.era,
        daylight,
        season: seasonNow,
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
        weather,   // round 49 (ADR-089): same hour as `daylight`
        season: seasonNow,   // round 50 (ADR-090)
        hour: skyHour,       // round 51 (ADR-091): clouds, stars and the moon need the CLOCK, not just the sun
        dayIndex,            // round 51: the moon's phase
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
      const orbit = createOrbit(cityOrbitOptions(layout.gridSize, layout.era, layout.sessionCount));
      // Round 50 (ADR-090): the walker — a position on the road network; the orbit crane frames it.
      const walker = createWalker({
        roadCells: (layout.props ?? []).filter((p) => p.kind === 'road'),
        gridSize: layout.gridSize,
        groundAt: (wx, wz) => city.groundHeightAt(wx, wz),   // the eye stands ON the street, not at y = 0
      });
      let walking = false;
      let walkHome = null;   // the overview state to fly back to when climbing out
      const OVERVIEW_NEAR = 0.5;

      // Dùng LẠI hai đối tượng này cho mọi cú chạm. Tạo mới mỗi lần chạm thì chẳng chết ai, nhưng
      // đây là file mà cả bộ dọn rác lẫn nhịp vẽ đều đang được giữ gìn từng chút một.
      const raycaster = new Raycaster();
      const pickPointer = new Vector2();

      function applyCamera() {
        const eye = orbit.getPosition();
        const target = orbit.getTarget();
        camera.position.set(eye.x, eye.y, eye.z);
        camera.lookAt(target.x, target.y, target.z);
        // Round 50: on the street the lens is wider and the near plane closer (else every facade clips)
        const fov = walking ? WALK_FOV : CITY_CAMERA_FOV;
        const near = walking ? WALK_NEAR : OVERVIEW_NEAR;
        if (camera.fov !== fov || camera.near !== near) {
          camera.fov = fov; camera.near = near; camera.updateProjectionMatrix();
        }
      }


      /**
       * ROUND 52 (ADR-092): THE POST PASS, AND ITS SWITCH.
       *
       * ⚠️ CONSTRUCTED ONLY WHEN ON. `postFx` is `null` when Đàm turns it off in Settings, and every
       * line below that touches it is guarded — so "off" is not "on with the effects at zero", it is
       * the round-51 path with no extra render target allocated at all. That is the difference
       * between a switch that costs nothing and a switch that only looks like it does.
       */
      const postFx = postFxOn
        ? createPostFx({
          renderer,
          scene: city.scene,
          camera,
          // ⚠️ ĐIỂM ẢNH THẬT, KHÔNG PHẢI ĐIỂM ẢNH CSS — round 57. Cả `postFx.js` nhận cỡ bằng
          // điểm ảnh thật (xem khối `setPixelRatio(1)` ở đó); truyền cỡ CSS vào đây thì lượt cấp
          // phát ĐẦU TIÊN nhỏ đi đúng `pixelRatio` lần. `resize()` ngay dưới sửa lại được, nên
          // khuyết tật này chưa từng lên tới màn hình — nhưng một dòng mã nói sai ý mình là thứ
          // phiên sau sẽ đọc và tin. Đàm nghi đúng chỗ này ở vòng 57; nó chỉ không phải nguyên
          // nhân của vết mờ (nguyên nhân là `MAX_PIXEL_RATIO`, xem `sceneGraph.js`).
          width: Math.max(1, Math.round(host.clientWidth * renderer.getPixelRatio())),
          height: Math.max(1, Math.round(host.clientWidth * 0.62 * renderer.getPixelRatio())),
          profile: postProfileFor(daylight.phase),
          walk: false,
        })
        : null;
      if (postFx) {
        // Air is what a shaft of light scatters off. Round 49's fog and round 51's cloud both count;
        // a clear desert noon has nothing in the air and gets no shafts.
        postFx.update({
          sunDirection: city.sun?.position ? city.sun.position.clone().normalize() : null,
          air: Math.min(1, 0.20 + (weather?.fog ?? 0) * 0.9 + (city.stats?.sky?.amount ?? 0) * 0.35),
        });
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
        // ⚠️ THE COMPOSER HAS ITS OWN BUFFERS AND THEY DO NOT FOLLOW `renderer.setSize`. Miss this
        // and the scene renders at the new size into a target still the old size — the picture
        // stretches, and nothing errors.
        postFx?.setSize(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
      }

      // Mốc thời gian gốc của hoạt hoạ. Dùng đồng hồ TUYỆT ĐỐI chứ không cộng dồn từng khung:
      // nhờ vậy bỏ lỡ khung hình (máy bận, tab bị treo) không làm thành phố trôi chậm lại, và
      // quay lại tab sau nửa tiếng thì cư dân đang ở đúng chỗ đáng lẽ phải tới.
      const startedAt = performance.now();
      /*
        ⚠️ MỘT CÁI ĐỒNG HỒ, MỘT CÔNG THỨC — round 57, Việc 6. Cư dân được ĐẶT bằng
        `city.update((now - startedAt) / 1000)`; hộp chạm của họ phải hỏi ĐÚNG con số ấy. Viết lại
        phép tính ở chỗ dò chạm (dù chỉ là một phép trừ) là dựng công thức thứ hai cho cùng một
        quan hệ: ngày nào đồng hồ đổi (tạm dừng, tua, đóng băng bảo tàng), hình người đi một đằng
        còn hộp chạm ở một nẻo — và cú chạm trượt mà không có gì đỏ lên.
      */
      const motionTimeNow = () => (performance.now() - startedAt) / 1000;
      /** `bpId` của cư dân đang được ngắm, hoặc `null`. Xem `applyFocus` và vòng lặp vẽ. */
      let followResident = null;

      // ── BAY TỚI MỘT KHU PHỐ (VIỆC 2) ────────────────────────────────────────
      //
      // ⚠️ KHÔNG có hệ camera thứ hai: vẫn đúng `orbit` ở trên, chỉ là điểm ngắm và giới hạn góc
      // được đổi. Phần TOÁN (đường bay có thoáng không, phải ngẩng lên bao nhiêu) nằm trọn ở
      // `engine/city3d/cityFocus.js` — thuần, test được bằng `node --test`, không cần trình duyệt.
      //
      // `flight` là chuyến bay đang chạy; `homeState` là chỗ Đàm đứng TRƯỚC khi bay đi (đường về).
      let flight = null;
      let homeState = null;
      let focusedRef = null;          // `${kind}|${bpId}` đang ngắm, hoặc `null`

      function beginFlight(to, { minPitch, minDistance }) {
        const from = orbit.getState();
        // Bật sàn an toàn NGAY nếu nhảy thẳng (giảm chuyển động), còn bay thì bật lúc hạ cánh —
        // xem lý do ở `orbit.set`.
        if (reduceMotion || FLIGHT_MS <= 0) {
          orbit.set(to);
          orbit.setLimits({ minPitch, minDistance });
          flight = null;
          // `loop` khai bên dưới, nhưng hàm này chỉ CHẠY sau khi nó đã khởi tạo (closure, không
          // phải lời gọi ngay) — nên đây là ca hợp lệ, không phải lỗi thứ tự.
          // eslint-disable-next-line no-use-before-define
          loop.invalidate();
          return;
        }
        flight = { from, to, minPitch, minDistance, startedAt: performance.now() };
        // eslint-disable-next-line no-use-before-define -- xem lý do ở `loop.invalidate()` bên trên.
        loop.beginSustained('bay-camera');
      }

      /** Nhích chuyến bay một nhịp. Gọi ngay đầu mỗi khung hình, trước khi đặt camera. */
      function stepFlight(now) {
        if (!flight) return;
        const t = Math.min(1, (now - flight.startedAt) / FLIGHT_MS);
        const k = ease(t);
        const { from, to } = flight;
        orbit.set({
          yaw: from.yaw + (to.yaw - from.yaw) * k,
          pitch: from.pitch + (to.pitch - from.pitch) * k,
          distance: from.distance + (to.distance - from.distance) * k,
          target: {
            x: from.target.x + (to.target.x - from.target.x) * k,
            y: from.target.y + (to.target.y - from.target.y) * k,
            z: from.target.z + (to.target.z - from.target.z) * k,
          },
        });
        if (t >= 1) {
          orbit.setLimits({ minPitch: flight.minPitch, minDistance: flight.minDistance });
          flight = null;
          // eslint-disable-next-line no-use-before-define -- xem lý do ở `loop.invalidate()` bên trên.
          loop.endSustained('bay-camera');
        }
      }

      const home = orbit.getHome();

      function applyFocus(ref) {
        const key = ref?.bpId ? `${ref.kind}|${ref.bpId}` : null;
        if (key === focusedRef) return;

        if (!key) {
          // ── ĐƯỜNG VỀ ─────────────────────────────────────────────────────────
          // Về ĐÚNG chỗ đã rời đi, không về góc mặc định: Đàm có thể đã xoay thành phố sang hướng
          // khác trước khi chạm, và trả anh về một hướng anh không chọn thì đó là app tự ý đổi
          // cảnh chứ không phải "thoát ra".
          if (homeState) {
            beginFlight(homeState, { minPitch: MIN_PITCH, minDistance: home.minDistance });
            homeState = null;
          }
          focusedRef = null;
          followResident = null;
          return;
        }

        /*
          ⚠️ HAI LOẠI ĐÍCH, HAI LUẬT KHOẢNG CÁCH — round 57, Việc 6.
          Một công trình cao ~7 đơn vị và `FOCUS_VIEW_DISTANCE = 7,5` được chọn cho nó. Một cư dân
          cao chưa tới 1 đơn vị; dùng lại 7,5 là đứng xa gấp bảy lần mức cần — và đó KHÔNG phải suy
          đoán, Việc 5 đã đo: cận cảnh công trình cho cư dân **22 điểm ảnh**, còn NHỎ HƠN khung
          toàn cảnh (82). Tức trước vòng này, không có cách nào nhìn gần một con người.
        */
        const nguoi = ref.kind === 'resident'
          ? (city.residentTargets ? city.residentTargets(motionTimeNow()) : [])
            .find((t) => t.bpId === ref.bpId)
          : null;
        const target = nguoi
          ?? city.pickTargets.find((t) => t.kind === ref.kind && t.bpId === ref.bpId);
        if (!target?.box) return;    // công trình vừa biến mất (đổi kỷ, xây xong) ⇒ đứng yên

        const box = target.box;
        /*
          ⚠️ HAI LOẠI ĐÍCH, HAI PHÉP DỰNG ĐƯỜNG BAY — và bản đầu của vòng 57 đã dùng chung, rồi ảnh
          chụp ra một MÁI NHÀ. `planCityFocus` giữ nguyên `yaw` và chỉ biết hai cách gỡ vướng: ngẩng
          lên, lùi ra. Với người thì ngẩng = nhìn đỉnh đầu, lùi = mất đúng cái vừa muốn xem (đo được:
          xin 0,60 đơn vị, nhận về 6,10). Người thì phải **đi vòng quanh** — xem `planResidentFocus`.
        */
        const plan = nguoi
          ? planResidentFocus({
            resident: nguoi,
            /*
              ⚠️ ĐO CHỖ ĐỨNG, KHÔNG ĐO ĐƯỜNG BAY — và bản đầu của vòng 57 đo nhầm cái thứ hai.
              `pathGuarantee` hỏi *"cả chuyến bay có chỗ nào cọ vào công trình không"*, đúng cho một
              công trình vì ta bay NGANG tới nó. Bay xuống đứng cạnh một người thì đường bay gần như
              luôn liếm qua một mái nhà trên đường hạ xuống — nên phép đo ấy báo vướng ở MỌI hướng,
              và cái cận cảnh lại lùi ra 3,30 đơn vị (đo được). Câu hỏi đúng với một người là
              *"chỗ camera dừng lại có nằm trong tường không"*.
            */
            clearanceOf: (to) => boxDistance(orbitPosition(to), nearestBlocker(orbitPosition(to), city.blockers)),
          })
          : planCityFocus({
            from: orbit.getState(),
            focus: {
              x: (box.minX + box.maxX) / 2,
              // Ngắm vào GIỮA THÂN chứ không vào chân tường: ngắm chân thì mái chạy lên mép trên
              // khung hình, mà mái mới là nơi Phase 11 để chi tiết.
              y: (box.minY + box.maxY) / 2,
              z: (box.minZ + box.maxZ) / 2,
            },
            blockers: city.blockers,
          });

        if (!homeState) homeState = orbit.getState();
        beginFlight(
          { yaw: plan.yaw, pitch: plan.pitch, distance: plan.distance, target: plan.target },
          { minPitch: plan.pitch, minDistance: plan.distance },
        );
        focusedRef = key;
        // ⚠️ NHỚ LẠI AI ĐANG ĐƯỢC NGẮM. Người thì ĐI: bay tới chỗ họ vừa đứng rồi thả ra là nhìn
        // họ bước ra khỏi khung trong hai giây. `followResident` dưới vòng lặp kéo điểm ngắm theo.
        followResident = nguoi ? ref.bpId : null;
      }

      let shadowsDirty = true;
      /*
        ⚠️ ROUND 52 (ADR-092): NHỊP VẼ LẠI BẢN ĐỒ BÓNG KHI CƯ DÂN ĐANG ĐI.
        Từ vòng này cư dân ĐỔ BÓNG (`sceneGraph.js`, chỗ đặt `castShadow` của lưới `residents`).
        Nhưng bản đồ bóng của cảnh cố ý KHÔNG tự cập nhật — nếu để nguyên thì người đi một đằng,
        bóng đứng một nẻo, và không có test nào đỏ vì hình học vẫn hợp lệ.

        ⚠️ VÌ SAO 2 CHỨ KHÔNG PHẢI 1, VÀ CŨNG KHÔNG PHẢI 4. Vẽ lại bản đồ bóng là vẽ lại TOÀN BỘ
        cảnh vào một tấm 4096×4096 — đắt ngang một khung hình nữa. Ở trần 30 khung/giây thì:
          • mỗi khung (1) ⇒ trả gần gấp đôi công, để đổi lấy một cái bóng nhúc nhích ở 30 Hz mà
            mắt không phân biệt được với 15 Hz;
          • mỗi 4 khung ⇒ bóng giật thành từng nấc 7,5 Hz — thấy rõ khi một người đi ngang qua
            một vũng nắng.
        2 cho bóng chạy ở 15 Hz: liền mạch với mắt, mà chỉ tốn thêm một nửa.
        ⚠️ ĐÂY LÀ MỘT CON SỐ ĐO BẰNG MẮT TRÊN ẢNH DỰNG, KHÔNG PHẢI ĐO BẰNG MILI-GIÂY — hộp cát dựng
        bằng SwiftShader nên mọi con số mili-giây ở đó chỉ so được với nhau. Máy Đàm là chỗ đo thật.
      */
      const SHADOW_EVERY_N = 2;
      let shadowTick = 0;
      function renderFrame() {
        const now = performance.now();
        stepFlight(now);
        if (city.isAnimated) city.update((now - startedAt) / 1000);
        /*
          ⚠️ NGƯỜI THÌ ĐI — round 57, Việc 6. Bay tới chỗ họ VỪA đứng rồi thả ra là nhìn họ bước ra
          khỏi khung trong khoảng hai giây, và cái cận cảnh vừa mua bằng cả một vòng thành vô dụng.
          ⇒ Trong lúc đang ngắm một người, kéo ĐIỂM NGẮM theo họ mỗi khung hình. Chỉ đổi `target`,
          KHÔNG đổi `yaw`/`pitch`/`distance`: Đàm vẫn xoay và phóng được như thường, camera chỉ
          không chịu rời mắt khỏi người ấy.
          ⚠️ Không chạy trong lúc `flight` còn bay: chuyến bay đang nội suy `target`, ghi đè giữa
          chừng thì đường bay giật. Người đi 0,34–0,62 đơn vị/giây nên trong 0,6 giây bay họ nhích
          không đáng kể; tới nơi là bám ngay.
        */
        if (followResident && !flight && city.residentTargets) {
          const ai = city.residentTargets(motionTimeNow()).find((t) => t.bpId === followResident);
          if (ai) {
            const st = orbit.getState();
            orbit.set({ ...st, target: ai.eye });
          }
        }
        applyCamera();
        // Cảnh vừa đổi (dựng xong, đổi giờ, đổi mùa) thì vẽ lại ngay, không chờ nhịp.
        if (city.isAnimated) {
          shadowTick = (shadowTick + 1) % SHADOW_EVERY_N;
          if (shadowTick === 0) shadowsDirty = true;
        }
        if (shadowsDirty) {
          // Chỉ vẽ lại bóng đúng khung hình cần. Bật `autoUpdate` lên một nhịp rồi tắt ngay là
          // cách chính thức của three để "cập nhật một lần".
          renderer.shadowMap.needsUpdate = true;
          shadowsDirty = false;
        }
        if (postFx) postFx.render();
        else renderer.render(city.scene, camera);
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

      // ── Round 50 (ADR-090): DOWN TO THE STREET ────────────────────────────────
      // One crane. `orbit.setWalk(true)` frees its pitch floor and its distance clamp; the walker
      // produces orbit states; drag looks around, wheel/keys/buttons walk. Leaving flies back to the
      // overview the way a focus flight does (`beginFlight`), so nothing about the return is new.
      function syncWalk() { orbit.set(walker.orbitState()); loop.invalidate(); }
      function setWalk(on) {
        if (on === walking) return;
        if (on) {
          if (!walker.start()) return;
          flight = null;
          walkHome = orbit.getState();
          walking = true;
          orbit.setWalk(true, { pitchMin: WALK_PITCH_MIN, pitchMax: WALK_PITCH_MAX });
          syncWalk();
        } else {
          walking = false;
          orbit.setWalk(false);
          if (walkHome) {
            beginFlight(walkHome, { minPitch: MIN_PITCH, minDistance: orbit.getHome().minDistance });
            walkHome = null;
          }
          applyCamera();
          loop.invalidate();
        }
      }
      function walkStep(steps) { if (walking && walker.advance(steps)) syncWalk(); }
      function walkTurn(rad) { if (walking) { walker.turn(rad); syncWalk(); } }
      function onWalkKey(event) {
        if (!walking) return;
        const k = event.key;
        if (k === 'ArrowUp' || k === 'w' || k === 'W') { walkStep(2); event.preventDefault(); }
        else if (k === 'ArrowDown' || k === 's' || k === 'S') { walkStep(-2); event.preventDefault(); }
        else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { walkTurn(-Math.PI / 12); event.preventDefault(); }
        else if (k === 'ArrowRight' || k === 'd' || k === 'D') { walkTurn(Math.PI / 12); event.preventDefault(); }
      }
      window.addEventListener('keydown', onWalkKey);
      if (walkApiRef) walkApiRef.current = { step: walkStep, turn: walkTurn };

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
        if (walking) {
          // look around: yaw with the finger, pitch inverted like a head (drag down = look down)
          walker.look((event.clientX - lastX) * 0.006, (event.clientY - lastY) * 0.005);
          syncWalk();
        } else {
          orbit.drag(event.clientX - lastX, event.clientY - lastY);
        }
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
        /*
          ⚠️ CƯ DÂN ĐỨNG SAU CÔNG TRÌNH TRONG DANH SÁCH — round 57, Việc 6, và thứ tự ấy là một
          quyết định, không phải tình cờ. `pickNearest` dùng `t <= bestT`, tức khi hai hộp cho
          CÙNG một khoảng cách thì cái ĐỨNG SAU thắng. Người đứng sát tường nhà thì hai hộp chồng
          lên nhau; ngón tay chỉ vào một hình người rõ ràng phải trúng NGƯỜI, không trúng bức tường
          sau lưng họ. Đặt trước thì ngược lại, và cú chạm sẽ "không ăn" đúng lúc nó hiển nhiên
          nhất với người dùng.
          ⚠️ Hộp người dựng lại theo THỜI ĐIỂM HIỆN TẠI (họ đi) — xem `residentTargets` ở sceneGraph.
        */
        const nguoi = city.residentTargets ? city.residentTargets(motionTimeNow()) : [];
        return pickNearest(raycaster.ray, [...city.pickTargets, ...nguoi]) ?? null;
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
        if (walking) { walkStep(event.deltaY > 0 ? -1 : 1); return; }   // round 50: the wheel walks
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
          // ⚠️ ĐÈ LÊN hai con số vừa spread từ `city.stats` bằng SỰ THẬT của khung hình vừa vẽ.
          // `city.stats` đếm scene graph (đúng, và có ngay trước khi vẽ lần nào), nhưng thứ HUD
          // phải nói là *máy vừa làm gì*, và chỉ `renderer.info` biết điều đó — nó tính cả lượt
          // dựng bản đồ bóng ở đúng khung hình có dựng lại. Đây là một cái đồng hồ đo, nên nó phải
          // đọc từ đồng hồ chứ không đọc từ dự báo. (Performance Gate 2026-08-17: hai bên từng lệch
          // 56% suốt nhiều tháng vì không ai đặt chúng cạnh nhau.)
          //
          // ⚠️ HAI CON SỐ NÀY LÀ **"ĐÃ VẼ (SAU KHI CẮT)"**, còn `...city.stats.geometry` giữ nguyên
          // bên dưới là **"TRONG CẢNH"** — chúng KHÔNG buộc phải bằng nhau, và HUD nói rõ điều đó.
          // three bỏ qua khối nằm ngoài khung hình trước khi vẽ, nên camera đóng sát ⇒ "đã vẽ" nhỏ
          // hơn; khung dựng lại bóng ⇒ "đã vẽ" lớn hơn. Cả hai chiều đều đúng. Đừng "sửa" cho khớp.
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
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
      // Cảnh vừa dựng lại (đổi kỷ, xong một phiên) mà thẻ thông tin vẫn đang mở ⇒ bay lại tới đúng
      // công trình ấy. Đọc từ ref chứ không từ prop: effect này KHÔNG có `focusKind`/`focusBpId`
      // trong danh sách phụ thuộc, và cố ý như vậy — thêm vào là dựng lại cả cảnh WebGL mỗi lần
      // Đàm chạm vào một căn nhà.
      applyFocus(focusRef.current);
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
        applyFocus,
        /**
         * Round 50 (ADR-090): THE POSTCARD. A WebGL drawing buffer is cleared the moment the browser
         * composites it, so `toDataURL` on a canvas that was drawn last frame returns black. The only
         * honest way without `preserveDrawingBuffer` (which costs memory on every frame of every
         * session) is to render and read IN THE SAME TURN — that is exactly what this does.
         */
        capture() {
          renderFrame();
          return { url: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
        },
        setWalk,
        walkStep,
        walkTurn,
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
          window.removeEventListener('keydown', onWalkKey);
          if (walkApiRef) walkApiRef.current = null;
          if (cameraApiRef) cameraApiRef.current = null;
          document.removeEventListener('visibilitychange', onVisibility);
          postFx?.dispose();
          city.dispose();
          renderer.dispose();
          // Trả context về cho trình duyệt ngay thay vì đợi bộ dọn rác. Safari giới hạn số
          // context sống cùng lúc khá chặt — giữ lại là lần sau mở tab sẽ không dựng được.
          renderer.forceContextLoss?.();
          canvas.remove();
        },
      };
      runtimeRef.current = runtime;
      if (cameraApiRef) cameraApiRef.current = { capture: runtime.capture };
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
    still, fill, interactive, dayPhase, hour, season, walkApiRef, cameraApiRef, postFxOn]);

  // Chạm vào công trình → bay tới. Effect RIÊNG, cố ý tách khỏi effect dựng cảnh: nó chỉ gọi một
  // hàm trên cảnh đang sống, không dựng lại gì cả. Gộp chung thì mỗi cú chạm sẽ tháo cả WebGL
  // context rồi dựng lại — tức là một cú chạm tốn bằng một lần đổi kỷ.
  useEffect(() => {
    runtimeRef.current?.applyFocus(focusBpId ? { kind: focusKind, bpId: focusBpId } : null);
  }, [focusKind, focusBpId]);

  // Round 50 (ADR-090): walk mode is a flag on the living scene — never a rebuild.
  useEffect(() => {
    runtimeRef.current?.setWalk(Boolean(walk));
  }, [walk]);

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
        VIỀN TỐI GÓC (vignette) — LỚP DỰ PHÒNG, CHỈ HIỆN KHI HẬU KỲ TẮT (round 52, ADR-092).

        ⚠️ CÂU DƯỚI ĐÂY ĐÃ ĐƯỢC VIẾT LẠI 2026-09-11. Bản cũ nói *"VÌ SAO LÀ MỘT LỚP CSS CHỨ KHÔNG
        PHẢI POST-PROCESSING"* và từ chối `EffectComposer` vì nó *"đòi thêm thư viện, thêm một khung
        đệm toàn màn hình, và vẽ lại toàn bộ điểm ảnh mỗi khung hình"*. Lý do ấy đo được và đúng khi
        nó được viết. **Đàm gỡ nó ở vòng 52**: *"Cả hai lần đều từ chối vì lo máy yếu. Tôi gỡ cái lo
        đó: máy tôi rất mạnh. Lag thì tôi nói. Làm hậu kỳ."* Nay `postFx.js` dựng đúng lượt hậu kỳ
        ấy — che khuất, tia nắng, loé sáng, ống kính — và viền tối là một phần của lượt ống kính.

        ⇒ Lớp CSS này KHÔNG bị xoá, nó lùi về làm dự phòng: khi Đàm tắt công tắc hậu kỳ trong Cài
        đặt, viền tối vẫn còn, vì nó là thứ rẻ nhất còn lại và cảnh không có nó thì phẳng ra ngay.
        Bật hậu kỳ mà vẫn để lớp này thì viền tối bị cộng HAI LẦN và bốn góc đen đặc — đúng cái lỗi
        "cùng một luật phát biểu ở hai chỗ" mà dự án đã trả giá nhiều lần.

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
      {!postFxOn && (
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
      )}
    </div>
  );
}
