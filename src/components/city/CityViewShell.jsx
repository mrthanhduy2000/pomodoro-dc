/**
 * CityViewShell.jsx — KHUNG của màn hình Thành Phố: thanh chuyển kỷ, bức tranh, chú thích, bảng số
 * liệu, hàng đợi xây, danh sách công trình.
 *
 * ⚠️ Luật quan trọng nhất của file này: **nó không biết bộ vẽ nào đang chạy.** Bộ vẽ được truyền
 * vào qua `children`; KÍCH THƯỚC của nó do `stageMetrics.js` quyết (ADR-086), không do khung này.
 * Nhờ vậy khi thêm bộ vẽ 3D (`render3d/`), hay khi phải lùi từ 3D về 2D giữa chừng (mất WebGL
 * context), khung màn hình không đổi một dòng — chỉ nội dung trong ô trống đổi.
 *
 * Ba trạng thái rỗng (thất truyền / bãi đất trống) cũng nằm ở đây chứ không nằm trong bộ vẽ: chúng
 * là chuyện của DỮ LIỆU, không phải chuyện của cách vẽ.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ROUND 46 (ADR-086) — THE SCREEN CATCHES UP WITH THE CITY'S THREE ROLES
 * Round 43 made the city the destination (75 buildings); round 44 made it the bank (1 building =
 * 1 SP); ADR-007 makes it the one thing that can never be revised. Measured 2026-09-08 on an iPhone
 * (390×844, 12 eras): the picture was 201 px = 23,8 % of the screen and started at y = 494; the tab
 * said «SP» zero times while the ledger read 37. So, in this order, top to bottom:
 *   1. the era tiles (2 rows at 15 eras, `EraSwitcher.jsx`),
 *   2. the PICTURE, flush with the card's edges, sized by `stageMetrics.js` — biggest thing here,
 *   3. its caption (era name · status · country),
 *   4. four stat cells — the second now says what the city PAYS, in SP, from
 *      `engine/skillPointEconomy.js`; the museum's «EP lúc niêm phong» is gone (an EP number nobody
 *      could act on, printed raw against the round-43 rule).
 * Đàm's acceptance test is literal: open the tab on the phone, scroll nothing, see the city, how
 * far it is from the destination, and how many skill points it has paid.
 */

import { motion } from 'framer-motion';
import { pickSessionProject } from '../../engine/sessionBrick';
import { useEnterMotion, useSnapMotion } from '../../lib/motionPresets';

import { summarizeMuseum } from '../../engine/cityCompletion';
import { describeJourney } from '../../engine/journey';
import { cityEarnedSP } from '../../engine/skillPointEconomy';
import { getEraStyle } from '../../engine/city3d/eraStyle';
import EraSwitcher from './EraSwitcher';
import { cardStyle, eraSolid } from './cityTokens';
import { SP_TAG, eraStatusLine, slotNote } from './cityCopy';
import { DAY_PHASE_LABEL, deriveDaylight } from '../../engine/city3d/daylight';
import { getVietnamHour } from '../../engine/time';

const eyebrow = 'mono text-[10px] uppercase tracking-[0.2em]';

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

function Stat({ label, value, hint = null }) {
  return (
    <div>
      <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>
        {value}
        {/*
          ⚠️ `hint` là chỗ một con số LẠNH nói ra ý nghĩa của nó. "Công trình 4/5" đúng nhưng
          không hành động được; "4/5 · còn 1 nữa ★" thì nói thẳng rằng đây là mốc gần nhất và
          phần thưởng là cái sao vĩnh viễn trên thanh chuyển kỷ. Chỉ hiện khi CÒN ĐÚNG MỘT —
          một gợi ý lúc nào cũng bật thì hết là gợi ý.
        */}
        {hint && (
          <span className="ml-1.5 text-[12px] font-semibold" style={{ color: 'var(--accent2)' }}>{hint}</span>
        )}
      </div>
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
  const enterMotion = useEnterMotion();
  // NGOẠI LỆ (mang bố cục) — bề dài thanh CHÍNH LÀ tiến độ xây của giàn giáo ấy.
  const barMotion = useSnapMotion({ transition: { duration: 0.5, ease: 'easeOut' } });

  const scaffolds = layout.scaffolds ?? [];

  const era = viewing?.era;
  const label = viewing?.label ?? `Kỷ ${era}`;
  const isCurrent = !!viewing?.isCurrent;
  // ADR-077: at zero buildings the empty state names the project the FIRST session will lay a brick for —
  // the same auto-pick `completeFocusSession` makes, so the city and the Focus strip tell one story.
  const firstProject = (layout.isEmpty && scaffolds.length === 0 && isCurrent)
    ? pickSessionProject({ craftingQueue: [], activeBook: era, buildings: [] }).project
    : null;
  const isLost = !!viewing?.isLost;

  // BẢNG SƯU TẬP của kỷ đang xem (`engine/cityCompletion.js`). Suy ra, không lưu.
  const completion = viewing?.completion ?? null;
  const scoreText = completion?.total > 0 ? `${completion.done}/${completion.total}` : null;

  // Cấp công trình chỉ có trong `layout.buildings`; bảng sưu tập chỉ biết bản vẽ nào đã xây. Ghép
  // hai nguồn ở đây thay vì bắt tầng engine gánh thêm khái niệm "cấp" — cấp là chuyện của thành
  // phố, còn sưu tập là chuyện của catalog.
  const levelOf = new Map(layout.buildings.map((building) => [building.bpId, building.level]));

  // ⚠️ DÂN SỐ KHÔNG CÒN ĐƯỢC ĐẾM Ở ĐÂY (round 43) — the residents still walk the streets in the
  // picture above these cells (`buildResidents` calls the same engine function); only the NUMBER
  // went, because it was the one cell of four that was pure decoration.

  // ĐIỂM TỔNG CỦA CẢ BẢO TÀNG — "tôi đã đi được bao xa" trên toàn hành trình, không phải trong kỷ
  // này. Suy ra từ chính danh sách kỷ đã có, không lưu một byte nào.
  const museum = summarizeMuseum(eras);
  // ADR-082: the destination — 75 buildings across 15 eras. See the `Thành phố` cell below.
  const journey = describeJourney({ museum, activeBook: era });
  // ADR-084/086: what the city has PAID, straight from the economy — the whole city, and this era's
  // share of it. Never a typed rate: `cityEarnedSP` owns the arithmetic.
  const citySP = cityEarnedSP(museum.builtTotal);
  const eraSP = cityEarnedSP(completion?.done ?? 0);

  // ĐẤT NƯỚC BIỂU TƯỢNG của kỷ đang xem. Lấy thẳng từ bảng ngữ pháp đang dựng hình, KHÔNG chép lại
  // thành một bảng riêng ở tầng giao diện: chép ra là ngày nào đó đổi kiểu mái mà quên đổi nhãn,
  // rồi màn hình khoe "kiến trúc Ý" trong khi thành phố đang dựng mái chồng Á Đông.
  const eraStyle = getEraStyle(era);

  const hasPicture = !isLost && !(layout.isEmpty && scaffolds.length === 0);

  return (
    <div className="flex flex-col gap-3">
      <EraSwitcher eras={eras} viewingEra={era} onSelect={onSelectEra} />

      {/*
        THE PICTURE CARD. The stage sits FLUSH with the card's edges (the card clips it with its own
        radius) and its caption follows underneath, the way a photograph is captioned: the era's
        name and status, then where its architecture comes from. Before round 46 the title stood
        ABOVE the picture and the caption had its own line-height budget; at 390 px that was 60 px
        of words before the first pixel of city.
      */}
      <div className="overflow-hidden" style={cardStyle}>
        {isLost ? (
          <div className="p-3 sm:p-4">
            <EmptyState icon="🏛️" title="Thành phố thất truyền">
              {label} · thành phố này đã đi qua trước khi bảo tàng được dựng. Từ kỷ hiện tại trở đi,
              mọi thành phố sẽ được giữ lại.
            </EmptyState>
          </div>
        ) : !hasPicture ? (
          // ⚠️ CÓ CÔNG TRƯỜNG THÌ KHÔNG PHẢI "BÃI ĐẤT TRỐNG" NỮA, dù chưa công trình nào xong.
          // `layout.isEmpty` cố ý chỉ đếm công trình ĐÃ XÂY (lớp nền trang chủ dựa vào nó), nhưng
          // ở tab này mà chặn theo cờ đó thì hỏng đúng khoảnh khắc đáng giá nhất: lần đầu Đàm khởi
          // công, anh mở tab lên để xem thành quả phiên vừa rồi và nhận về đúng chữ "chưa có gì".
          <div className="p-3 sm:p-4">
            <EmptyState icon="🧱" title="Viên gạch đầu tiên đang chờ">
              {firstProject
                ? `Phiên tập trung đầu tiên đặt viên gạch đầu cho ${firstProject.label} — ${firstProject.total} phiên là nó mọc lên ở đây.`
                : `${label} chưa có công trình nào. Mỗi phiên tập trung là một viên gạch.`}
            </EmptyState>
          </div>
        ) : (
          <motion.div key={era} {...enterMotion}>
            {children}
            <div className="flex flex-col gap-1 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
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
                {/* «Đang xây · 143 phiên» / «Đã niêm phong 2026-05-01 · 143 phiên» — `cityCopy.js`.
                    The session count lives HERE now, not in a stat cell: for a sealed city it is the
                    plaque ("this one took 143 sessions"), and a plaque belongs under the picture. */}
                <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {eraStatusLine({ isCurrent, isLost, sealedAt: viewing?.sealedAt, sessionCount: stats.sessionCount })}
                </div>
              </div>
              {/*
                MỘT DÒNG NÓI RA "THÀNH PHỐ NÀY LẤY MẪU TỪ ĐÂU".
                Đàm: *"mỗi kỷ có thể lấy một đất nước làm biểu tượng"*. Hình khối đã theo đúng nước ấy
                từ `eraStyle.js`, nhưng nếu không nói ra thì Đàm phải TỰ ĐOÁN — mà đoán ra "Bồ Đào
                Nha" từ một cái kho có cột buồm thì gần như không ai làm được. Một dòng chữ biến công
                sức dựng hình thành thứ đọc được, và biến việc lên kỷ mới thành "đi thăm một nước mới".
                Nó là CHÚ THÍCH cho bức ảnh, mà chú thích thì đọc SAU khi đã nhìn — nên đứng dưới.
              */}
              {eraStyle.country && (
                <p className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                  Kiến trúc lấy mẫu từ{' '}
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>{eraStyle.country}</span>
                  {' '}· {eraStyle.landmark}
                  {/*
                    ⚠️ CHẶNG NGÀY — GHÉP VÀO DÒNG NÀY, KHÔNG THÊM DÒNG MỚI. Cảnh 3D đổi theo đồng hồ
                    thật (giờ Việt Nam): bình minh hồng, trưa gắt, đêm xanh có đèn cửa sổ. Một chữ
                    biến hiệu ứng vô hình thành lời mời quay lại, không tốn thêm dòng nào.
                    Chỉ hiện cho kỷ ĐANG chơi. Bảo tàng nay được THẮP CỐ ĐỊNH (ADR-086,
                    `museumDaylight`) — nên ở đó không có chặng ngày nào để mà nói.
                  */}
                  {isCurrent && ` · ${DAY_PHASE_LABEL[deriveDaylight(getVietnamHour()).phase]}`}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {!isLost && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            // ⚠️ CÓ MẪU SỐ. "Công trình: 3" là một con số không hành động được — 3 trên mấy thì
            // chính Đàm cũng không biết. "3/5" thì cùng ô đó tự đọc ra "còn 2 nữa là trọn vẹn".
            {
              label: 'Công trình',
              value: scoreText ?? layout.buildings.length,
              // Còn đúng một công trình nữa là kỷ này trọn vẹn — mốc gần nhất mà thành phố có,
              // và phần thưởng của nó (ngôi sao trên thanh chuyển kỷ) là thứ KHÔNG sửa lại được
              // nữa vì kỷ niêm phong vĩnh viễn (ADR-007).
              hint: isCurrent && completion?.total > 0 && completion.total - completion.done === 1
                ? 'còn 1 nữa ★'
                : null,
            },
            // ⚠️ Ô NÀY TỪNG LÀ «PHIÊN TRONG KỶ» (round 46, ADR-086). It failed the test round 43
            // used to retire «Cư dân» — *what can Đàm DO with this number?* — nothing: it only
            // grows, cannot be spent, aimed at or finished. The count itself is kept, as the plaque
            // in the caption above. What takes the cell is the number this tab had never printed
            // while being the screen that EARNS it: the skill points the city has paid, whole city
            // first (ADR-084's rule: a screen that names a reward names it in SP first), this era's
            // share as the hint. Both from `engine/skillPointEconomy.js` — no typed rate.
            {
              label: 'Điểm kỹ năng',
              value: `${citySP} SP`,
              hint: eraSP > 0 ? `+${eraSP} từ kỷ này` : null,
            },
            // ⚠️ Ô NÀY TỪNG LÀ "CHUỖI NGÀY", VÀ ĐÓ LÀ MỘT Ô BỊ LÃNG PHÍ — soi bằng mắt mới thấy
            // (2026-08-13, Phase 4H). Thanh tiêu đề của app đã hiện "CHUỖI 4" ở ngay trên đầu MỌI
            // tab, nên con số 4 xuất hiện HAI LẦN cách nhau vài phân. *Hai chỗ nói cùng một chuyện
            // thì chỗ nói ít hơn phải nhường.*
            //
            // Thay bằng ĐIỂM TỔNG BẢO TÀNG (`summarizeMuseum`, chết trong engine từ Phase 4B tới
            // 4H vì không màn hình nào gọi — xem `cityViewShellWiring.test.js`). Vì sao đáng một
            // trong bốn ô: kỷ cũ niêm phong VĨNH VIỄN (ADR-007), nên "6/8 kỷ trọn vẹn" là điểm số
            // DUY NHẤT trong app không sửa lại được nữa, và là chỗ duy nhất gộp những ngôi sao ★
            // rải trên thanh chuyển kỷ thành một con số.
            //
            // ⚠️ ROUND 46: the sealed-era variant «EP lúc niêm phong: 5006» is GONE. Raw EP, no
            // separator, and nothing Đàm could do with it — it failed the same question as
            // «Cư dân» and broke the round-43 rule that no screen prints raw EP. The museum score
            // is the same number whichever era he is looking at, like the destination cell: the
            // two things that must not move while he browses.
            {
              label: 'Kỷ trọn vẹn',
              // `countedEras === 0` chỉ xảy ra khi MỌI kỷ đều thất truyền (tài khoản có từ trước
              // khi bảo tàng được dựng, xem `MIGRATION.md` schema 3→4). "0/0" là một con số vô
              // nghĩa và lại còn trách oan, nên ca đó lùi về chuỗi ngày như cũ.
              value: museum.countedEras > 0
                ? `${museum.completeEras}/${museum.countedEras}`
                : stats.streakLength,
            },
            // THE DESTINATION (round 43, ADR-082). 15 eras × 5 blueprints = 75 buildings, and then
            // the city is DONE — the one unit in the game that ENDS, which is what makes it an
            // answer to "where am I going?". Numerator = `museum.builtTotal`, the same bricks the
            // SP cell just priced; denominator from the catalog, never typed.
            // ⚠️ Sống ở kỷ nào cũng ĐÚNG SỐ ẤY: the journey is the whole city, not the era on
            // screen, so this cell does NOT switch source when Đàm browses a sealed era.
            { label: 'Thành phố', value: journey.short, hint: journey.remaining > 0 ? `còn ${journey.remaining}` : 'trọn vẹn ★' },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-2.5" style={cardStyle}>
              <Stat label={stat.label} value={stat.value} hint={stat.hint ?? null} />
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
        ⚠️ KHÔNG gác `isCurrent` (đổi Phase 4D): kỷ đã niêm phong cũng có thể đang trùng tu một
        "di sản"; cảnh 3D bên trên đã dựng giàn giáo cho nó, nên giấu bảng này đi thì Đàm thấy giàn
        giáo mà không có chỗ nào nói còn mấy phiên nữa.
        ⚠️ ROUND 46: the card's header names the PAY — «xong là +1 SP» — from the economy, not a
        typed number. A building finishing is the most expensive event in the game and this list is
        where it is approached one session at a time; it must say what waits at the end.
      */}
      {!isLost && scaffolds.length > 0 && (
        <div className="p-3 sm:p-4" style={cardStyle}>
          <div className="flex items-baseline justify-between gap-2">
            <div className={eyebrow} style={{ color: 'var(--muted-2)' }}>Đang xây</div>
            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
              Mỗi phiên một nấc · xong là <span className="font-semibold" style={{ color: 'var(--accent)' }}>{SP_TAG}</span>
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
                      className="min-w-0 flex-1 break-words"
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
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(3, item.progress * 100)}%` }}
                      {...barMotion}
                    />
                  </div>
                  {item.reward && (
                    // "Còn 2 phiên" mới trả lời được CÒN BAO XA. Dòng này trả lời ĐI TỚI ĐÓ ĐỂ LÀM
                    // GÌ — nếu không có nó thì cái thanh tiến độ chỉ là một cái thanh tiến độ.
                    <div className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
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
        mở lên là thấy ngay còn bao nhiêu chỗ trống, và mỗi chỗ trống có TÊN — và có GIÁ (+1 SP).

        ⚠️ Với kỷ đã niêm phong, một ô mờ KHÔNG phải "mất vĩnh viễn" — câu đó đứng ở đây từ Phase
        4B và đã hết đúng từ ADR-012 (2026-08-13, Đàm chọn): bảo tàng trùng tu được, từng ô một,
        qua Hành trang › «Trùng tu di sản», và ô trùng tu xong trả đúng một điểm kỹ năng như mọi
        công trình khác (`countBuiltBuildings` đếm cả bảo tàng). Cái làm ngôi sao ★ đáng giá là
        thành phố KHÔNG XÊ DỊCH (ADR-007), không phải việc nó không thể lớn thêm. Nhãn ô nói đúng
        điều đó (`cityCopy.js`).

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
                    className="min-w-0 flex-1 break-words"
                    style={{ color: built ? 'var(--ink-2)' : 'var(--muted-2)' }}
                  >
                    {slot.label}
                  </span>
                  {built && level > 1 && (
                    <span className="mono shrink-0 text-[10px]" style={{ color: 'var(--muted)' }}>Lv.{level}</span>
                  )}
                  {!built && (
                    <span className="shrink-0 text-[11px]" style={{ color: 'var(--muted-2)' }}>
                      {slotNote(slot.state, { sealed: !isCurrent })}
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
