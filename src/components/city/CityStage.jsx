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

import useSettingsStore from '../../store/settingsStore';
import {
  decideRenderMode,
  describeRenderMode,
  readDeviceHints,
} from '../../engine/city3d/renderMode';
import CityCanvas2D from './render2d/CityCanvas2D';
import CityPerfHud from './CityPerfHud';

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

export default function CityStage({ layout, dimmed = false, reduceMotion = false }) {
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

  const handleFallback = useCallback((reason) => {
    // Chỉ ghi nhận lần hỏng ĐẦU TIÊN: `lost-context` và `slow` có thể bắn liên tiếp, mà lý do đầu
    // mới là lý do thật.
    setFailure((current) => current ?? reason);
  }, []);

  const decision = decideRenderMode({ preference, hasWebGL2, hints });
  const mode = failure ? '2d' : decision.mode;
  const reason = failure ?? decision.reason;

  return (
    <div className="flex flex-col gap-2">
      {mode === '3d' ? (
        <Suspense fallback={<StagePlaceholder />}>
          <CityScene3D
            layout={layout}
            dimmed={dimmed}
            reduceMotion={reduceMotion}
            onStats={setStats}
            onFallback={handleFallback}
          />
        </Suspense>
      ) : (
        <CityCanvas2D layout={layout} dimmed={dimmed} />
      )}

      {/* Khi 3D bỏ cuộc GIỮA CHỪNG, phải nói cho Đàm biết — nếu không anh chỉ thấy hình đột nhiên
          đổi kiểu mà không hiểu vì sao, rồi tưởng app hỏng. */}
      {failure && (
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
          Đã chuyển về bản vẽ 2D: {FAILURE_LABEL[failure] ?? 'bản 3D gặp sự cố'}.
        </p>
      )}

      {showHud && (
        <CityPerfHud
          stats={stats}
          mode={mode}
          reason={failure ? FAILURE_LABEL[failure] ?? 'bản 3D gặp sự cố' : describeRenderMode(reason)}
        />
      )}
    </div>
  );
}
