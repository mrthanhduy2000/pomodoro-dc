/**
 * CityStage.jsx — CHỌN bộ vẽ và tự lùi khi 3D hỏng.
 *
 * Đây là ranh giới giữa "khung màn hình" (`CityViewShell`, không biết bộ vẽ nào đang chạy) và các
 * bộ vẽ cụ thể. Toàn bộ tri thức "khi nào 3D, khi nào 2D" gom về đúng file này.
 *
 * ⚠️ `CityScene3D` phải nạp LƯỜI (`lazy`). Import tĩnh sẽ kéo ~130 KB three.js vào chunk chính,
 * tức là mọi lần Đàm mở app đều tải nó — kể cả khi máy không có WebGL2 và không bao giờ dùng tới.
 * Có test đọc mã nguồn canh luật "chỉ `render3d/` được import 'three'"
 * (`cityRenderers.test.js`), nhưng luật đó không bắt được việc nạp tĩnh — chunk `vendor-three`
 * biến mất khỏi kết quả build mới là dấu hiệu.
 *
 * Đường lùi có BA cửa, và cửa nào cũng phải dẫn về 2D chứ không dẫn tới màn hình trống:
 *   1. dò trước khi dựng   — máy không có WebGL2 / đang tiết kiệm dữ liệu / quá yếu
 *   2. dựng thất bại       — `new WebGLRenderer(...)` ném lỗi
 *   3. đang chạy thì hỏng  — mất context, hoặc FPS thấp kéo dài
 */

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEnterMotion } from '../../lib/motionPresets';

import useSettingsStore from '../../store/settingsStore';
import {
  decideRenderMode,
  describeRenderMode,
  readDeviceHints,
} from '../../engine/city3d/renderMode';
import CityCanvas2D from './render2d/CityCanvas2D';
import CityPerfHud from './CityPerfHud';
import BuildingCard from './BuildingCard';

const CityScene3D = lazy(() => import('./render3d/CityScene3D'));

/**
 * Lý do 3D bỏ cuộc GIỮA CHỪNG. Cố ý tách khỏi bảng lý do trong `engine/city3d/renderMode.js` —
 * bảng đó nói về quyết định TRƯỚC khi dựng cảnh, bảng này nói về sự cố lúc đang chạy.
 */
const FAILURE_LABEL = {
  'init-failed':  'máy không dựng được cảnh 3D',
  'render-error': 'bản 3D gặp lỗi khi vẽ',
  'slow':         'máy chạy 3D không đủ mượt',
  'lost-context': 'trình duyệt vừa thu hồi tài nguyên đồ hoạ',
};

/** Chỗ giữ nhịp trong lúc chunk three.js đang tải — cùng tỉ lệ khung với cảnh 3D, khỏi giật layout. */
function StagePlaceholder() {
  return (
    <div
      className="w-full rounded-[14px]"
      style={{ background: 'var(--canvas-2)', aspectRatio: '1 / 0.62' }}
      aria-hidden="true"
    />
  );
}

export default function CityStage({
  layout,
  dimmed = false,
  reduceMotion = false,
  // Dân số suy ra từ hai số này (xem `engine/city3d/residents.js`). Truyền SỐ RỜI xuống thay vì gói
  // vào một object: object mới ở mỗi lượt render sẽ khiến `CityScene3D` dựng lại cả cảnh WebGL.
  sessionCount = 0,
  streakLength = 0,
  // ── Chế độ LỚP NỀN (Phase 3F: thành phố ra trang chủ) ───────────────────────
  /**
   * `chrome = false` ⇒ bỏ bảng số liệu và câu báo "đã lùi về 2D".
   * ⚠️ Không phải để giấu lỗi: ở tab Thành Phố, việc lùi về 2D là chuyện Đàm CẦN biết (nếu không
   * anh chỉ thấy hình đột nhiên đổi kiểu rồi tưởng app hỏng). Còn ở trang chủ, thành phố chỉ là
   * khung cảnh — một dòng chữ lỗi kỹ thuật nổi lên sau lưng cái đồng hồ đếm ngược thì vừa vô
   * nghĩa với anh vừa phá mất chính sự yên tĩnh mà màn hình đó tồn tại để giữ.
   */
  chrome = true,
  still = false,
  fill = false,
  interactive = true,
  // ── CHẠM VÀO CÔNG TRÌNH (Phase 3K) ──────────────────────────────────────────
  /** `{ kind, bpId }` do bộ vẽ 3D báo về → gọi lên trên để lưu lựa chọn. */
  onPick,
  /** Phần tử của `layout.buildings` / `layout.scaffolds` đang được chọn, đã kèm `kind`. */
  selection = null,
}) {
  const enterMotion = useEnterMotion();
  const preference = useSettingsStore((s) => s.cityRenderMode);
  const showHud = useSettingsStore((s) => s.cityPerfHud);

  const [hasWebGL2, setHasWebGL2] = useState(null);   // null = chưa dò xong
  const [hints, setHints] = useState(null);
  const [stats, setStats] = useState(null);
  const [failure, setFailure] = useState(null);       // lý do 3D bỏ cuộc trong phiên này

  // Dò MỘT lần cho cả vòng đời component. Việc dò phải nằm trong effect chứ không nằm lúc render:
  // nó tạo một WebGL context thật, và render của React có thể chạy nhiều lần.
  useEffect(() => {
    let alive = true;
    // Hoãn tới sau khung hình đầu: dò WebGL ngay lúc mount sẽ tranh tài nguyên với chính việc
    // hiện tab ra, làm cảm giác mở tab bị khựng.
    const timer = window.setTimeout(async () => {
      try {
        const { probeWebGL2 } = await import('./render3d/capability');
        if (!alive) return;
        setHasWebGL2(probeWebGL2());
        setHints(readDeviceHints());
      } catch {
        if (alive) setHasWebGL2(false);
      }
    }, 0);

    return () => { alive = false; window.clearTimeout(timer); };
  }, []);

  // Đàm đổi lựa chọn trong Cài đặt ⇒ cho 3D một cơ hội mới, quên lần hỏng trước đi.
  const prevPreference = useRef(preference);
  useEffect(() => {
    if (prevPreference.current !== preference) {
      prevPreference.current = preference;
      setFailure(null);
      setStats(null);
    }
  }, [preference]);

  // Phím Esc = lối thoát thứ ba. Chỉ gắn khi ĐANG ngắm một công trình: gắn thường trực thì Esc ở
  // màn hình Thành Phố sẽ âm thầm "làm gì đó" ngay cả lúc chẳng có gì để đóng.
  useEffect(() => {
    if (!selection || !interactive) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onPick?.(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection, interactive, onPick]);

  const handleFallback = useCallback((reason) => {
    // Chỉ ghi nhận lần hỏng ĐẦU TIÊN: `lost-context` và `slow` có thể bắn liên tiếp, mà lý do đầu
    // mới là lý do thật.
    setFailure((current) => current ?? reason);
  }, []);

  const decision = decideRenderMode({ preference, hasWebGL2, hints });
  const mode = failure ? '2d' : decision.mode;
  const reason = failure ?? decision.reason;

  return (
    <div className={fill ? 'h-full' : 'flex flex-col gap-2'}>
      {mode === '3d' ? (
        // `relative` để thẻ thông tin nổi ĐÈ LÊN cảnh. Đặt thẻ ở dưới cảnh thì trên iPhone nó rơi
        // xuống dưới mép màn hình: chạm vào nhà xong chẳng thấy gì xảy ra, phải cuộn mới biết.
        <div className={`relative ${fill ? 'h-full' : ''}`}>
          <Suspense fallback={fill ? null : <StagePlaceholder />}>
            <CityScene3D
              layout={layout}
              dimmed={dimmed}
              reduceMotion={reduceMotion}
              sessionCount={sessionCount}
              streakLength={streakLength}
              onStats={setStats}
              onFallback={handleFallback}
              still={still}
              fill={fill}
              interactive={interactive}
              onPick={interactive ? onPick : undefined}
              // ⚠️ HAI SỐ RỜI, không phải object `selection`: `selection` được `useMemo` dựng lại
              // mỗi khi bố cục đổi, và một object mới sẽ làm effect bay nổ lại vô cớ.
              // Cũng chỉ truyền khi `interactive` — lớp nền trang chủ không được tự bay đi đâu cả.
              focusKind={interactive ? (selection?.kind ?? null) : null}
              focusBpId={interactive ? (selection?.bpId ?? null) : null}
            />
          </Suspense>

          {/*
            ĐƯỜNG THOÁT. Camera bay vào một khu phố mà không có lối ra hiển nhiên thì Đàm sẽ phải
            đoán (kéo ngược lại? bấm đâu?) — và đoán sai vài lần là thôi không dám chạm nữa, tức
            mất luôn cả tính năng. Ba lối, cố ý dư thừa vì mỗi lối hỏng theo một kiểu:
              1. nút này — thấy được, không cần biết trước gì cả;
              2. chạm vào chỗ trống — phản xạ tự nhiên, đã có sẵn từ Phase 3K;
              3. phím Esc — quen tay trên máy tính.
            ⚠️ `pointer-events-none` ở lớp bọc, `auto` ở chính cái nút: thiếu luật này thì cả dải
            trống bên cạnh nút nuốt mất thao tác kéo xoay (đúng bài học của thẻ thông tin bên dưới).
          */}
          <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-end">
            <AnimatePresence>
              {selection && (
                <motion.button
                  type="button"
                  {...enterMotion}
                  onClick={() => onPick?.(null)}
                  className="pointer-events-auto rounded-full px-3 py-1.5 text-[11px] font-medium shadow-sm"
                  style={{ background: 'var(--canvas)', color: 'var(--ink)', border: '1px solid var(--line)' }}
                >
                  ⤺ Toàn cảnh
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ⚠️ `pointer-events-none` trên lớp bọc, `pointer-events-auto` trên chính thẻ: thiếu
              luật này thì cả vùng trống quanh thẻ nuốt mất thao tác kéo xoay của Đàm. */}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-start">
            <AnimatePresence>
              {selection && (
                <BuildingCard
                  item={selection}
                  era={layout.era}
                  onClose={() => onPick?.(null)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        // ⚠️ Ở chế độ lớp nền, máy không chạy được 3D thì KHÔNG vẽ gì cả. Bản 2D isometric là một
        // hình minh hoạ sắc nét, có viền — đặt sau lưng đồng hồ đếm ngược nó đọc ra "cái ảnh dán
        // nhầm chỗ" chứ không ra "khung cảnh". Lùi về nền trơn là lựa chọn ĐẸP hơn ở đây, còn tab
        // Thành Phố thì vẫn luôn có bản 2D đầy đủ.
        !fill && <CityCanvas2D layout={layout} dimmed={dimmed} />
      )}

      {/*
        ⚠️ MỘT TÍNH NĂNG KHÔNG AI BIẾT LÀ MỘT TÍNH NĂNG KHÔNG TỒN TẠI. Chạm-vào-công-trình được
        dựng xong ở Phase 3K nhưng KHÔNG có gì trên màn hình nói rằng nó tồn tại: cảnh 3D trông y
        hệt một bức tranh, và không ai đi chạm thử vào một bức tranh. Trên máy tính còn có con trỏ
        đổi hình khi rê qua nhà; trên iPhone — tức là máy Đàm dùng hằng ngày — thì KHÔNG có gì cả.
        Một dòng chữ nhỏ rẻ hơn nhiều so với việc để cả tính năng nằm im.
      */}
      {chrome && mode === '3d' && interactive && (
        <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
          {selection
            ? 'Đang ngắm gần · kéo để xoay quanh · bấm “Toàn cảnh” hoặc Esc để lùi ra'
            // ⚠️ RÚT GỌN 2026-08-29, KHÔNG GỠ. Lý do dòng này tồn tại (khối chú thích ngay trên)
            // vẫn nguyên giá trị: trên iPhone không có con trỏ đổi hình, nên không gì nói rằng
            // chạm được. Nhưng câu đầy đủ chiếm trọn một dòng ở khung 390px ngay dưới hình, cạnh
            // một dòng chú thích khác — hai dòng chữ nhỏ liên tiếp thì mắt bỏ qua cả hai.
            : 'Kéo để xoay · chạm để ngắm gần'}
        </p>
      )}

      {/* Khi 3D bỏ cuộc GIỮA CHỪNG, phải nói cho Đàm biết — nếu không anh chỉ thấy hình đột nhiên
          đổi kiểu mà không hiểu vì sao, rồi tưởng app hỏng. */}
      {chrome && failure && (
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
          Đã chuyển về bản vẽ 2D: {FAILURE_LABEL[failure] ?? 'bản 3D gặp sự cố'}.
        </p>
      )}

      {chrome && showHud && (
        <CityPerfHud
          stats={stats}
          mode={mode}
          reason={failure ? FAILURE_LABEL[failure] ?? 'bản 3D gặp sự cố' : describeRenderMode(reason)}
        />
      )}
    </div>
  );
}
