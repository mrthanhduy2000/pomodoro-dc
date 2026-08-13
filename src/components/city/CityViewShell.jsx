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

import { deriveResidentCount } from '../../engine/city3d/residents';
import EraSwitcher from './EraSwitcher';
import { cardStyle, eraSolid } from './cityTokens';

const eyebrow = 'mono text-[10px] uppercase tracking-[0.2em]';

/** Nhãn phụ của một ô trong bảng sưu tập. Ô đã xây không cần nhãn — cấp Lv. đã nói thay. */
const SLOT_NOTE = {
  building: 'đang xây',
  empty:    'chưa xây',
};

/**
 * Tô nhẹ dòng ứng với công trình Đàm vừa chạm trong cảnh 3D.
 *
 * ⚠️ Đây là nửa còn lại của cú chạm, không phải trang trí: chạm vào một khối nhà mà chỉ có thẻ nổi
 * lên thì Đàm vẫn không biết nó là dòng nào trong danh sách bên dưới. Nối hai chỗ lại thì hình và
 * chữ trở thành CÙNG MỘT thứ được nhìn theo hai cách, chứ không phải hai bảng rời nhau.
 */
const rowHighlight = (on) => (on
  ? { background: 'var(--canvas-2)', boxShadow: 'inset 2px 0 0 var(--accent)' }
  : undefined);

function Stat({ label, value }) {
  return (
    <div>
      <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}

/**
 * Xếp hàng đợi xây dựng theo thứ tự ĐÁNG QUAN TÂM: gần xong nhất lên đầu.
 *
 * ⚠️ KHÔNG sửa mảng gốc — `layout.scaffolds` đã được sắp theo chiều sâu đẳng cự để bộ vẽ biết vẽ
 * cái nào trước cái nào; đảo mảng đó tại chỗ sẽ làm nhà đằng trước che nhà đằng sau. Hai thứ tự
 * này phục vụ hai mục đích khác nhau và phải sống song song.
 *
 * Hoà nhau thì so `bpId` để thứ tự KHÔNG BAO GIỜ nhảy giữa hai lần vẽ — danh sách tự đổi chỗ sau
 * mỗi lần render là kiểu nhấp nháy khiến người dùng tưởng mình bấm nhầm.
 */
function buildQueueOrder(scaffolds) {
  return [...scaffolds].sort((a, b) => (a.remaining - b.remaining) || a.bpId.localeCompare(b.bpId));
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
export default function CityViewShell({
  eras, viewing, layout, stats, onSelectEra, selectedId = null, children,
}) {
  const reduceMotion = useReducedMotion();

  const scaffolds = layout.scaffolds ?? [];
  const era = viewing?.era;
  const label = viewing?.label ?? `Kỷ ${era}`;
  const isCurrent = !!viewing?.isCurrent;
  const isLost = !!viewing?.isLost;

  // BẢNG SƯU TẬP của kỷ đang xem (`engine/cityCompletion.js`). Suy ra, không lưu.
  const completion = viewing?.completion ?? null;
  const scoreText = completion?.total > 0 ? `${completion.done}/${completion.total}` : null;

  // Cấp công trình chỉ có trong `layout.buildings`; bảng sưu tập chỉ biết bản vẽ nào đã xây. Ghép
  // hai nguồn ở đây thay vì bắt tầng engine gánh thêm khái niệm "cấp" — cấp là chuyện của thành
  // phố, còn sưu tập là chuyện của catalog.
  const levelOf = new Map(layout.buildings.map((building) => [building.bpId, building.level]));

  // ⚠️ CÙNG CÔNG THỨC với dân số trong cảnh 3D (`buildResidents` gọi đúng hàm này). Tự nhân chia
  // lại ở đây thì sớm muộn hai chỗ nói hai con số khác nhau về cùng một thành phố.
  const residents = deriveResidentCount({
    buildingCount: layout.buildings.length,
    sessionCount:  stats.sessionCount,
    streakLength:  stats.streakLength,
  });

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
        ) : (layout.isEmpty && scaffolds.length === 0) ? (
          // ⚠️ CÓ CÔNG TRƯỜNG THÌ KHÔNG PHẢI "BÃI ĐẤT TRỐNG" NỮA, dù chưa công trình nào xong.
          // `layout.isEmpty` cố ý chỉ đếm công trình ĐÃ XÂY (lớp nền trang chủ dựa vào nó), nhưng
          // ở tab này mà chặn theo cờ đó thì hỏng đúng khoảnh khắc đáng giá nhất: lần đầu Đàm khởi
          // công, anh mở tab lên để xem thành quả phiên vừa rồi và nhận về đúng chữ "chưa có gì".
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
            // ⚠️ CÓ MẪU SỐ. "Công trình: 3" là một con số không hành động được — 3 trên mấy thì
            // chính Đàm cũng không biết. "3/5" thì cùng ô đó tự đọc ra "còn 2 nữa là trọn vẹn".
            { label: 'Công trình', value: scoreText ?? layout.buildings.length },
            { label: 'Phiên trong kỷ', value: stats.sessionCount },
            {
              label: isCurrent ? 'Chuỗi ngày' : 'EP lúc niêm phong',
              value: isCurrent ? stats.streakLength : (viewing?.epAtSeal ?? 0),
            },
            // DÂN SỐ. Con số này vốn đã được tính để sinh người đi lại trong cảnh 3D
            // (`deriveResidentCount`), nhưng trước nay chỉ hiện trong BẢNG ĐO HIỆU NĂNG — một bảng
            // gỡ lỗi phải vào Cài đặt bật lên mới thấy. Một thành phố đông dần lên là phần thưởng;
            // để phần thưởng nằm trong bảng gỡ lỗi thì coi như không có phần thưởng.
            //
            // ⚠️ Ô này TỪNG đổi nghĩa thành "Đang xây: N" khi có công trường. Đo bằng mắt
            // (2026-08-13) thì thấy nó THỪA: điều kiện hiện nó trùng khít với điều kiện hiện thẻ
            // "Đang xây" ngay bên dưới, mà thẻ đó nói đủ tên công trình + còn mấy phiên + mở khoá
            // gì. Hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường. Và vì công trường
            // gần như LÚC NÀO cũng có, ô đổi-nghĩa đó khiến dân số thực tế vẫn vô hình.
            // ("Cảnh vật" — số cây cối — thì đã nhường chỗ từ trước: con số chẳng nói lên điều gì.)
            { label: 'Cư dân', value: residents },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-2.5" style={cardStyle}>
              <Stat label={stat.label} value={stat.value} />
            </div>
          ))}
        </div>
      )}

      {/*
        ĐANG XÂY — mảnh ghép còn thiếu giữa "giàn giáo trong thành phố" và "Đàm biết phải làm gì".
        Nhìn thấy giàn giáo mọc lên là đẹp; biết **còn đúng 2 phiên nữa** thì mới thành một mục tiêu
        cho hôm nay. Đây là chỗ duy nhất trong app trả lời được câu "làm nốt phiên này thì được gì".

        ⚠️ Đặt TRÊN danh sách công trình đã xây, có chủ ý: cái đã xong là phần thưởng đã lĩnh, cái
        đang xây mới là thứ đang chờ chính anh — mà thứ đang chờ thì phải nằm trên.
      */}
      {!isLost && isCurrent && scaffolds.length > 0 && (
        <div className="p-3 sm:p-4" style={cardStyle}>
          <div className="flex items-baseline justify-between gap-2">
            <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>Đang xây</div>
            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
              Mỗi phiên xong là một nấc giàn giáo
            </div>
          </div>
          <ul className="mt-2.5 flex flex-col gap-3">
            {buildQueueOrder(scaffolds).map((item, index) => {
              // Cái gần xong nhất nằm đầu danh sách ⇒ nó cũng là cái đáng làm nổi bật.
              const next = index === 0;
              return (
                <li key={item.bpId} className="flex flex-col gap-1" style={rowHighlight(item.bpId === selectedId)}>
                  <div className="flex items-baseline gap-2 text-[12px]">
                    <span aria-hidden="true">{item.icon}</span>
                    <span
                      className="min-w-0 flex-1 truncate"
                      style={{ color: next ? 'var(--ink)' : 'var(--ink-2)', fontWeight: next ? 600 : 400 }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="mono shrink-0 text-[11px]"
                      style={{ color: next ? eraSolid(era) : 'var(--muted)' }}
                    >
                      {/* Nói bằng SỐ PHIÊN — thứ Đàm hành động được — chứ không phải phần trăm. */}
                      {item.remaining > 0 ? `còn ${item.remaining} phiên` : 'sắp xong'}
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: 'var(--line-2)' }}
                    role="progressbar"
                    aria-valuenow={Math.round(item.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.label}: đã xây ${Math.round(item.progress * 100)}%`}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: eraSolid(era), opacity: next ? 1 : 0.55 }}
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: `${Math.max(3, item.progress * 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  {item.reward && (
                    // "Còn 2 phiên" mới trả lời được CÒN BAO XA. Dòng này trả lời ĐI TỚI ĐÓ ĐỂ LÀM
                    // GÌ — nếu không có nó thì cái thanh tiến độ chỉ là một cái thanh tiến độ.
                    <div className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>
                      Mở khoá: {item.reward}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/*
        BẢNG SƯU TẬP — trước đây chỗ này chỉ liệt kê những gì ĐÃ xây, nên nó là một tấm biên lai:
        đọc xong biết mình có gì, không biết mình thiếu gì. Nay nó liệt kê ĐỦ cả 5 bản vẽ của kỷ,
        ô chưa xây để mờ. Cùng một danh sách, nhưng nó thôi làm biên lai và thành một tấm bản đồ:
        mở lên là thấy ngay còn bao nhiêu chỗ trống, và mỗi chỗ trống có TÊN.

        ⚠️ Với kỷ đã niêm phong, những ô mờ đó VĨNH VIỄN mờ (ADR-007: bảo tàng bất động). Đó chính
        là thứ khiến ngôi sao "trọn vẹn" đáng giá — nếu lúc nào cũng quay lại xây bù được thì nó
        chỉ là chuyện sớm muộn, không phải thành tích.

        ⚠️ Vẫn hiện cả khi chưa xây gì. Đúng lúc thành phố trống trơn mới là lúc cần nhất một danh
        sách nói "đây là 5 thứ sẽ mọc lên ở đây" — chứ không phải một khoảng trắng.
      */}
      {!isLost && completion?.total > 0 && (
        <div className="p-3 sm:p-4" style={cardStyle}>
          <div className="flex items-baseline justify-between gap-2">
            <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>Công trình trong thành phố</div>
            {/* ⚠️ Dấu "trọn vẹn" dùng `--accent`, KHÔNG dùng màu kỷ — xem phần đo tương phản ở đầu
                `EraSwitcher.jsx`: màu kỷ 9/kỷ 3 chỉ đạt ~1,5:1 trên nền thẻ sáng. Ở ĐÂY còn nặng
                hơn bên thanh chuyển kỷ, vì chính con số "5/5" đổi màu theo — tức màu tệ làm mất
                luôn thứ mang thông tin, chứ không chỉ mất phần trang trí. */}
            <div className="mono flex items-baseline gap-1 text-[11px]">
              <span style={{ color: completion.isComplete ? 'var(--accent)' : 'var(--muted)' }}>
                {scoreText}
              </span>
              {completion.isComplete && (
                <span style={{ color: 'var(--accent)' }} title="Trọn vẹn — đã xây đủ mọi công trình của kỷ này">
                  ★ trọn vẹn
                </span>
              )}
            </div>
          </div>

          <ul className="mt-2 flex flex-col gap-1.5">
            {completion.slots.map((slot) => {
              const built = slot.state === 'built';
              const level = levelOf.get(slot.bpId) ?? 1;
              return (
                <li
                  key={slot.bpId}
                  className="flex items-center gap-2 rounded-[8px] px-1.5 py-0.5 text-[12px]"
                  style={rowHighlight(slot.bpId === selectedId)}
                >
                  {/* Ô chưa xây vẫn giữ biểu tượng, chỉ mờ đi — một cái bóng của thứ sắp tới đọc
                      ra "chỗ này còn trống" rõ hơn nhiều so với một dấu chấm hỏi chung chung. */}
                  <span aria-hidden="true" style={{ opacity: built ? 1 : 0.35 }}>{slot.icon}</span>
                  <span
                    className="min-w-0 flex-1 truncate"
                    style={{ color: built ? 'var(--ink-2)' : 'var(--muted-2)' }}
                  >
                    {slot.label}
                  </span>
                  {built && level > 1 && (
                    <span className="mono shrink-0 text-[10px]" style={{ color: 'var(--muted)' }}>Lv.{level}</span>
                  )}
                  {!built && (
                    <span className="shrink-0 text-[11px]" style={{ color: 'var(--muted-2)' }}>
                      {SLOT_NOTE[slot.state]}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
