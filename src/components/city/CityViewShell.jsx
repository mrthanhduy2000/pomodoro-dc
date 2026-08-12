/**
 * CityViewShell.jsx — KHUNG của màn hình Thành Phố: thanh chuyển kỷ, tiêu đề kỷ, ô đặt bộ vẽ,
 * bảng số liệu, danh sách công trình.
 *
 * ⚠️ Luật quan trọng nhất của file này: **nó không biết bộ vẽ nào đang chạy.** Bộ vẽ được truyền
 * vào qua `children` và tự quyết định kích thước của mình. Nhờ vậy khi thêm bộ vẽ 3D (`render3d/`),
 * hay khi phải lùi từ 3D về 2D giữa chừng (mất WebGL context), khung màn hình không đổi một dòng —
 * chỉ nội dung trong ô trống đổi.
 *
 * Ba trạng thái rỗng (thất truyền / bãi đất trống) cũng nằm ở đây chứ không nằm trong bộ vẽ: chúng
 * là chuyện của DỮ LIỆU, không phải chuyện của cách vẽ.
 */

import { motion, useReducedMotion } from 'framer-motion';

import EraSwitcher from './EraSwitcher';
import { cardStyle, eraSolid } from './cityTokens';

const eyebrow = 'mono text-[10px] uppercase tracking-[0.2em]';

function Stat({ label, value }) {
  return (
    <div>
      <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}

/** Khối rỗng dùng chung cho cả hai trạng thái "không có gì để vẽ". */
function EmptyState({ icon, title, children }) {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[14px] px-6 py-10 text-center"
      style={{ background: 'var(--canvas-2)', border: '1px dashed var(--line-2)' }}
    >
      <div className="text-[26px]" aria-hidden="true">{icon}</div>
      <div className="text-[14px] font-semibold" style={{ color: 'var(--ink-2)' }}>{title}</div>
      <div className="max-w-[380px] text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {children}
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array}  props.eras       `listVisitableEras(...)`
 * @param {object} props.viewing    phần tử đang xem trong `eras`
 * @param {object} props.layout     `computeCityLayout(...)` — chỉ dùng để đếm, không để vẽ
 * @param {object} props.stats      `{ sessionCount, streakLength }`
 * @param {Function} props.onSelectEra
 * @param {React.ReactNode} props.children  BỘ VẼ — khung này không biết nó là 2D hay 3D
 */
export default function CityViewShell({ eras, viewing, layout, stats, onSelectEra, children }) {
  const reduceMotion = useReducedMotion();

  const era = viewing?.era;
  const label = viewing?.label ?? `Kỷ ${era}`;
  const isCurrent = !!viewing?.isCurrent;
  const isLost = !!viewing?.isLost;

  return (
    <div className="flex flex-col gap-3">
      <EraSwitcher eras={eras} viewingEra={era} onSelect={onSelectEra} />

      <div className="overflow-hidden p-3 sm:p-4" style={cardStyle}>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: eraSolid(era) }}
              aria-hidden="true"
            />
            <h2
              className="text-[16px] font-semibold"
              style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display, inherit)' }}
            >
              {label}
            </h2>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {isCurrent
              ? 'Đang xây · thành phố lớn lên sau mỗi phiên'
              : (isLost
                  ? 'Thất truyền'
                  : `Đã niêm phong${viewing?.sealedAt ? ` ngày ${viewing.sealedAt}` : ''}`)}
          </div>
        </div>

        {isLost ? (
          <EmptyState icon="🏛️" title="Thành phố thất truyền">
            {label} · thành phố này đã đi qua trước khi bảo tàng được dựng. Từ kỷ hiện tại trở đi,
            mọi thành phố sẽ được giữ lại.
          </EmptyState>
        ) : layout.isEmpty ? (
          <EmptyState icon="⛰️" title="Bãi đất trống">
            {label} chưa có công trình nào. Nghiên cứu bản vẽ ở Kho báu → Xưởng, rồi hoàn thành các
            phiên tập trung để dựng căn nhà đầu tiên.
          </EmptyState>
        ) : (
          <motion.div
            key={era}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </div>

      {!isLost && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Công trình', value: layout.buildings.length },
            { label: 'Phiên trong kỷ', value: stats.sessionCount },
            {
              label: isCurrent ? 'Chuỗi ngày' : 'EP lúc niêm phong',
              value: isCurrent ? stats.streakLength : (viewing?.epAtSeal ?? 0),
            },
            { label: 'Cảnh vật', value: layout.props.length },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-2.5" style={cardStyle}>
              <Stat label={stat.label} value={stat.value} />
            </div>
          ))}
        </div>
      )}

      {!isLost && layout.buildings.length > 0 && (
        <div className="p-3 sm:p-4" style={cardStyle}>
          <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>Công trình trong thành phố</div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {layout.buildings.map((building) => (
              <li key={building.bpId} className="flex items-center gap-2 text-[12px]">
                <span aria-hidden="true">{building.icon}</span>
                <span style={{ color: 'var(--ink-2)' }}>{building.label}</span>
                {building.level > 1 && (
                  <span className="mono text-[10px]" style={{ color: 'var(--muted)' }}>Lv.{building.level}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
