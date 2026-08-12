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

const PROP_SHAPES = { tree: Tree, rock: Rock, lamp: Lamp, water: Water, field: Field };

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

  const Shape = PROP_SHAPES[item.kind];
  if (!Shape) return null;
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={dimmed ? 0.5 : 0.9}>
      <Shape variant={item.variant ?? 0} palette={palette} />
    </g>
  );
}
