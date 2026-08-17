/**
 * CityPerfHud.jsx — bảng số liệu hiệu năng của cảnh 3D.
 *
 * ⚠️ LÝ DO TỒN TẠI: cổng hiệu năng của Phase 3A yêu cầu đo FPS trên chính iPhone Đàm dùng. Nhưng
 * Đàm không mở được Web Inspector của Safari (cần cắm cáp vào Mac + bật chế độ nhà phát triển), nên
 * một cổng "hãy đo FPS đi" mà không có công cụ đo thì không thực hiện được — nó sẽ thành cái cổng
 * ai cũng gật bừa cho qua. Bảng này để Đàm chỉ cần **chụp màn hình gửi lại**.
 *
 * ⚠️ FPS = 0 KHÔNG phải lúc nào cũng là hỏng. Cảnh chỉ vẽ khi có gì đó đổi (render-on-demand), nên
 * một thành phố đứng yên tuyệt đối thì đúng là 0. Từ khi có CƯ DÂN đi lại thì thành phố có người là
 * vẽ liên tục ⇒ số này phải có. Còn 0 ở đây nghĩa là: chưa có nhà nào (chưa có ai ở), hoặc Đàm đang
 * xem bảo tàng, hoặc đã bật "giảm chuyển động". Chữ dưới bảng nói đúng trường hợp đang xảy ra, vì
 * nếu chỉ nói chung chung thì Đàm sẽ tưởng máy mình hỏng.
 *
 * ⚠️ TRẦN 30 KHUNG/GIÂY: cư dân bị giới hạn nhịp (xem `ANIMATION_FPS` ở `CityScene3D.jsx`), nên
 * thấy đúng ~30 là ĐẠT chứ không phải "chỉ được một nửa 60". Đừng sửa ngưỡng ở đây thành 60.
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
  const hìnhHọc = stats?.geometry ?? null;

  /**
   * ⚠️ "đã vẽ" ÍT HƠN "trong cảnh" LÀ ĐÚNG, KHÔNG PHẢI LỖI — và nếu không nói ra thì hai con số
   * lệch nhau trên màn hình sẽ bị đọc thành "app đang báo sai". three bỏ qua khối nằm ngoài khung
   * hình trước khi vẽ (frustum culling), nên kéo camera lại gần là số "đã vẽ" tụt xuống trong khi
   * cảnh không hề mất gì. Chiều NGƯỢC LẠI ("đã vẽ" nhiều hơn) cũng có thật và cũng đúng: đúng
   * khung hình dựng lại bản đồ bóng thì các khối đổ bóng được vẽ thêm một lượt nữa.
   */
  const trongCảnh = hìnhHọc?.triangles.total ?? null;
  const đãVẽ = stats?.triangles ?? null;
  const chênh = (trongCảnh != null && đãVẽ != null) ? trongCảnh - đãVẽ : 0;
  const lờiGiảiThích = chênh > 0
    ? `${chênh.toLocaleString('vi-VN')} tam giác trong cảnh không được vẽ vì nằm ngoài khung hình — bình thường khi camera đóng sát, không phải lỗi.`
    : (chênh < 0
      ? `Khung vừa đo có dựng lại bóng đổ nên vẽ nhiều hơn số trong cảnh ${(-chênh).toLocaleString('vi-VN')} tam giác — đúng, lượt vẽ bóng là lượt thứ hai.`
      : null);

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
          <Row label="Lệnh vẽ · đã vẽ" value={stats?.drawCalls ?? '—'} />
          <Row label="Tam giác · đã vẽ" value={stats?.triangles?.toLocaleString('vi-VN') ?? '—'} />
          {/* Hai dòng THỤT VÀO: số đếm TRONG CẢNH, tách theo nguồn gốc khối. Dòng "thành phố" mới
              là dòng trả lời câu Đàm thật sự hỏi — "xây thêm nhà có nặng máy không" — vì nhà không
              nằm ở phần nền. Xem `measureSceneGeometry` để biết vì sao gộp lại là đọc sai. */}
          <Row label="↳ thành phố" value={hìnhHọc ? hìnhHọc.triangles.city.toLocaleString('vi-VN') : '—'} />
          <Row label="↳ nền (trời + núi)" value={hìnhHọc ? hìnhHọc.triangles.backdrop.toLocaleString('vi-VN') : '—'} />
          <Row label="Mỗi khung" value={stats?.lastFrameMs != null ? `${stats.lastFrameMs} ms` : '—'} />
          <Row label="Đã vẽ" value={stats?.framesRendered ?? '—'} />
          <Row
            label="Nền · nhà"
            value={stats ? `${stats.groundTiles} · ${stats.buildings}` : '—'}
          />
          <Row label="Cư dân" value={stats?.residents ?? '—'} />
          {/* Đèn trong nhà hắt ra sân — chỉ có ban đêm, và là nguồn sáng duy nhất tính tiền theo
              từng điểm ảnh. Ban ngày luôn là 0; thấy khác 0 giữa trưa là có gì đó sai giờ. */}
          <Row label="Đèn đêm" value={stats?.lamps ?? '—'} />
          <Row
            label="Bóng · điểm ảnh"
            value={stats ? `${stats.shadowMap}px · ${stats.pixelRatio}×` : '—'}
          />
          {lờiGiảiThích && (
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {lờiGiảiThích}
            </p>
          )}
          <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {measured
              ? 'Cư dân đang đi lại nên thành phố vẽ liên tục. Nhịp vẽ được giới hạn ở 30 khung/giây để đỡ tốn pin — thấy khoảng 30 là ĐẠT, không phải thiếu.'
              : 'Chưa có khung hình nào được vẽ. Bình thường khi thành phố đứng yên tuyệt đối: chưa có công trình nào, đang xem bảo tàng, hoặc bạn đã bật "giảm chuyển động". Hãy KÉO XOAY thành phố vài giây rồi xem lại số này.'}
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
