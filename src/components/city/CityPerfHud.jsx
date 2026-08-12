/**
 * CityPerfHud.jsx — bảng số liệu hiệu năng của cảnh 3D.
 *
 * ⚠️ LÝ DO TỒN TẠI: cổng hiệu năng của Phase 3A yêu cầu đo FPS trên chính iPhone Đàm dùng. Nhưng
 * Đàm không mở được Web Inspector của Safari (cần cắm cáp vào Mac + bật chế độ nhà phát triển), nên
 * một cổng "hãy đo FPS đi" mà không có công cụ đo thì không thực hiện được — nó sẽ thành cái cổng
 * ai cũng gật bừa cho qua. Bảng này để Đàm chỉ cần **chụp màn hình gửi lại**.
 *
 * ⚠️ FPS = 0 lúc đứng yên là ĐÚNG, không phải hỏng: cảnh chỉ vẽ khi có gì đó đổi (render-on-demand).
 * Muốn thấy FPS thật thì phải KÉO XOAY thành phố — chữ dưới bảng nói rõ điều này, vì nếu không Đàm
 * sẽ tưởng máy mình hỏng.
 */

const eyebrow = 'mono text-[9px] uppercase tracking-[0.18em]';

function Row({ label, value, hint }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={eyebrow} style={{ color: 'var(--muted-2)' }}>{label}</span>
      <span className="mono text-[12px] font-semibold" style={{ color: hint ?? 'var(--ink)' }}>
        {value}
      </span>
    </div>
  );
}

/**
 * @param {object} props
 * @param {object|null} props.stats  số liệu do `CityScene3D` gửi lên
 * @param {string} props.mode        chế độ đang chạy ('3d' | '2d')
 * @param {string} props.reason      vì sao đang ở chế độ đó (đã dịch sang tiếng Việt)
 */
export default function CityPerfHud({ stats, mode, reason }) {
  const fps = stats?.fps ?? 0;
  const measured = fps > 0;

  // Ngưỡng của cổng Phase 3A: từ 30 khung/giây trở lên là đạt.
  const fpsColor = !measured
    ? 'var(--muted)'
    : (fps >= 30 ? 'var(--ink)' : 'var(--danger, #c0392b)');

  return (
    <div
      className="flex flex-col gap-1.5 rounded-[12px] px-3 py-2.5"
      style={{ background: 'var(--canvas-2)', border: '1px dashed var(--line-2)' }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={eyebrow} style={{ color: 'var(--muted-2)' }}>Hiệu năng</span>
        <span className="mono text-[10px]" style={{ color: 'var(--muted)' }}>
          {mode === '3d' ? '3D' : '2D'} · {reason}
        </span>
      </div>

      {mode === '3d' ? (
        <>
          <Row label="Khung/giây" value={measured ? fps : '—'} hint={fpsColor} />
          <Row label="Lệnh vẽ" value={stats?.drawCalls ?? '—'} />
          <Row label="Tam giác" value={stats?.triangles?.toLocaleString('vi-VN') ?? '—'} />
          <Row label="Mỗi khung" value={stats?.lastFrameMs != null ? `${stats.lastFrameMs} ms` : '—'} />
          <Row label="Đã vẽ" value={stats?.framesRendered ?? '—'} />
          <Row
            label="Nền · nhà"
            value={stats ? `${stats.groundTiles} · ${stats.buildings}` : '—'}
          />
          <Row
            label="Bóng · điểm ảnh"
            value={stats ? `${stats.shadowMap}px · ${stats.pixelRatio}×` : '—'}
          />
          <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {measured
              ? 'Số khung/giây chỉ đo trong lúc bạn đang kéo xoay. Từ 30 trở lên là đạt.'
              : 'Thành phố đứng yên thì không vẽ khung nào — đó là cách tiết kiệm pin, không phải lỗi. Hãy KÉO XOAY thành phố vài giây rồi xem lại số này.'}
          </p>
        </>
      ) : (
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Đang dùng bộ vẽ 2D nên không có số liệu 3D. Bộ vẽ 2D không dùng tới card đồ hoạ.
        </p>
      )}
    </div>
  );
}
