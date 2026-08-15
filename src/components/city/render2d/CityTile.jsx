/**
 * CityTile.jsx — vẽ MỘT vật thể nổi trên lưới isometric: công trình hoặc cảnh vật.
 *
 * Ô nền và đường sá KHÔNG đi qua đây — chúng được gộp thành vài `<path>` duy nhất trong
 * `CityCanvas2D.jsx` để giữ số phần tử DOM thấp (ngân sách ≤200 cho cả thành phố).
 *
 * Mọi hình đều là SVG thuần, 0 KB asset, không ảnh, không precache PWA.
 */

import { TILE, cellCenter } from './tokens2d';

/** Điểm của hình thoi nền, quanh tâm (0,0). */
const DIAMOND = `0,${-TILE.H / 2} ${TILE.W / 2},0 0,${TILE.H / 2} ${-TILE.W / 2},0`;

// ─── CẢNH VẬT ────────────────────────────────────────────────────────────────

function Tree({ variant, palette }) {
  const h = 16 + variant * 3;
  return (
    <>
      <path d={`M0 0 L0 ${-h * 0.35}`} stroke={palette.wallLeft} strokeWidth="2" strokeLinecap="round" />
      <path
        d={`M0 ${-h} L${6 + variant} ${-h * 0.3} L${-6 - variant} ${-h * 0.3} Z`}
        fill={palette.roofTop}
        stroke={palette.accent}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </>
  );
}

function Rock({ variant, palette }) {
  const s = 5 + variant;
  return (
    <path
      d={`M${-s} 0 L${-s * 0.5} ${-s} L${s * 0.6} ${-s * 0.8} L${s} 0 Z`}
      fill={palette.wallLeft}
      stroke={palette.edge}
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
  );
}

function Lamp({ palette }) {
  return (
    <>
      <path d="M0 0 L0 -14" stroke={palette.wallLeft} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="0" cy="-16" r="3" fill={palette.roofTop} stroke={palette.accent} strokeWidth="0.6" />
    </>
  );
}

function Water({ palette }) {
  return (
    <>
      <polygon points={DIAMOND} fill={palette.road} stroke={palette.edge} strokeWidth="0.5" />
      <path
        d="M-14 -2 q7 -3 14 0 t14 0"
        fill="none"
        stroke={palette.accent}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M-11 4 q6 -3 11 0 t11 0"
        fill="none"
        stroke={palette.accent}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />
    </>
  );
}

function Field({ palette }) {
  return (
    <>
      <polygon points={DIAMOND} fill={palette.ground[3]} stroke={palette.edge} strokeWidth="0.5" />
      {[-6, 0, 6].map((offset) => (
        <path
          key={offset}
          d={`M${-20 + offset} ${offset / 2 + 4} L${offset} ${-8 + offset / 2}`}
          stroke={palette.accent}
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.4"
        />
      ))}
    </>
  );
}

/**
 * Công trình ĐANG XÂY — giàn giáo dựng cao dần theo `progress` (0..1).
 *
 * ⚠️ VÌ SAO BỘ VẼ 2D CŨNG PHẢI CÓ, DÙ NÓ CHỈ LÀ ĐƯỜNG LÙI: giàn giáo không phải đồ trang trí, nó
 * là **phần thưởng cho phiên vừa xong**. Nếu máy nào đó lùi về 2D (không có WebGL2, mất context,
 * Đàm tự chọn tắt 3D) mà thành phố lại đứng im suốt cả tuần cho tới lúc một công trình hoàn thành,
 * thì đúng người dùng máy yếu nhất là người mất đi vòng lặp động viên — trong khi họ chẳng làm gì
 * sai cả. Hai bộ vẽ được phép khác nhau về ĐỘ ĐẸP, không được khác nhau về NỘI DUNG.
 */
function Scaffold({ item, palette }) {
  const t = Math.min(1, Math.max(0, item.progress ?? 0));
  const h = 8 + t * 20;                 // cột giàn giáo
  const built = h * 0.72;               // phần tường đã xây, luôn thấp hơn cột
  const halfW = 9;
  const rungs = Math.max(1, Math.round(t * 3));

  return (
    <>
      {/* phần đã xây, nằm trong lòng giàn giáo */}
      {t > 0.12 && (
        <rect
          x={-halfW * 0.62} y={-built} width={halfW * 1.24} height={built}
          fill={palette.wallLeft} stroke={palette.edge} strokeWidth="0.5"
        />
      )}
      {/* hai cột + các thanh giằng — mỗi phiên xong lại thêm một tầng giằng */}
      <path
        d={`M${-halfW} 0 L${-halfW} ${-h} M${halfW} 0 L${halfW} ${-h}`}
        stroke={palette.accent} strokeWidth="1.6" strokeLinecap="round"
      />
      {Array.from({ length: rungs }, (_, i) => {
        const y = -h * ((i + 1) / (rungs + 0.5));
        return (
          <path
            key={i} d={`M${-halfW} ${y} L${halfW} ${y}`}
            stroke={palette.accent} strokeWidth="1.1" strokeLinecap="round" opacity="0.85"
          />
        );
      })}
    </>
  );
}

/**
 * Bụi cây (Phase 8D). Hai ba khối tròn sát đất, không có thân — đó là toàn bộ điều cần nói ở cỡ
 * một ô isometric.
 *
 * ⚠️ PHẢI CÓ MẶT Ở ĐÂY, KHÔNG ĐƯỢC ĐỂ BỘ VẼ 2D LỜ ĐI. `CityTile` xử lý loại lạ bằng
 * `if (!Shape) return null` — nghĩa là thêm một loại cảnh vật mới mà quên khai ở đây thì bản dự
 * phòng 2D sẽ **âm thầm bỏ trống** đúng những ô ấy: không lỗi, không cảnh báo, chỉ là một thành
 * phố thưa hơn thật. Bộ vẽ 2D tồn tại để làm lưới an toàn khi 3D không chạy được, mà một lưới an
 * toàn kể một câu chuyện khác thì không còn là lưới an toàn.
 */
function Bush({ variant, palette }) {
  const s = 4 + variant;
  return (
    <>
      <ellipse cx={-s * 0.5} cy={-s * 0.5} rx={s * 0.9} ry={s * 0.7} fill={palette.wallLeft} />
      <ellipse cx={s * 0.5} cy={-s * 0.4} rx={s * 0.8} ry={s * 0.6} fill={palette.roofTop} />
      <ellipse cx={0} cy={-s * 0.9} rx={s * 0.7} ry={s * 0.55} fill={palette.roofTop} />
    </>
  );
}

const PROP_SHAPES = { tree: Tree, bush: Bush, rock: Rock, lamp: Lamp, water: Water, field: Field };

// ─── CÔNG TRÌNH ──────────────────────────────────────────────────────────────

/**
 * Khối nhà isometric: mặt trên + 2 mặt tường, cao dần theo cấp công trình.
 * Emoji của bản vẽ (`BLUEPRINT_CATALOG[...].icon`) đặt trên nóc — bộ vẽ 2D cố tình dừng ở mức
 * "khối + emoji"; hình khối riêng cho từng công trình là việc của bộ vẽ 3D (`render3d/`).
 */
function Building({ item, palette, dimmed }) {
  const h = TILE.LIFT + (item.level - 1) * TILE.LIFT_STEP;
  const halfW = TILE.W / 2;
  const halfH = TILE.H / 2;
  const isEpic = item.rarity === 'epic';

  return (
    <g opacity={dimmed ? 0.55 : 1}>
      {/* mặt tường trái */}
      <polygon
        points={`${-halfW},0 0,${halfH} 0,${halfH - h} ${-halfW},${-h}`}
        fill={palette.wallLeft}
        stroke={palette.edge}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* mặt tường phải */}
      <polygon
        points={`${halfW},0 0,${halfH} 0,${halfH - h} ${halfW},${-h}`}
        fill={palette.wallRight}
        stroke={palette.edge}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* mặt nóc */}
      <polygon
        points={DIAMOND}
        transform={`translate(0 ${-h})`}
        fill={palette.roofTop}
        stroke={isEpic ? palette.accent : palette.edge}
        strokeWidth={isEpic ? 1.4 : 0.8}
        strokeLinejoin="round"
      />
      <text
        x="0"
        y={-h - 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={isEpic ? 24 : 20}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {item.icon}
      </text>
    </g>
  );
}

// ─── ĐIỂM VÀO ────────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {'building'|'prop'} props.kind
 * @param {object} props.item     công trình (`{bpId,x,y,level,label,icon,rarity}`) hoặc cảnh vật
 * @param {object} props.palette  `getEraPalette(era)`
 * @param {boolean} [props.dimmed] thành phố đã niêm phong → làm nhạt cho có vẻ "quá khứ"
 */
export default function CityTile({ kind, item, palette, dimmed = false }) {
  const { cx, cy } = cellCenter(item.x, item.y);

  if (kind === 'building') {
    return (
      <g transform={`translate(${cx} ${cy})`}>
        <title>{`${item.label} · Lv.${item.level}`}</title>
        <Building item={item} palette={palette} dimmed={dimmed} />
      </g>
    );
  }

  if (kind === 'scaffold') {
    return (
      <g transform={`translate(${cx} ${cy})`} opacity={dimmed ? 0.5 : 0.95}>
        <title>{`${item.label} · đang xây (${Math.round((item.progress ?? 0) * 100)}%)`}</title>
        <Scaffold item={item} palette={palette} />
      </g>
    );
  }

  const Shape = PROP_SHAPES[item.kind];
  if (!Shape) return null;
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={dimmed ? 0.5 : 0.9}>
      <Shape variant={item.variant ?? 0} palette={palette} />
    </g>
  );
}
