import React, {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BadgeGrid from './shared/BadgeGrid.jsx';
import { splitLockedBadges } from './shared/badgeGroups.js';
import InventoryHero from './shared/InventoryHero.jsx';
import { heroHuyHieu } from './shared/inventoryHero.js';

import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIERS,
} from '../engine/constants';
import { formatVietnamDateTime } from '../engine/time';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import { thanhTichGanDat, tienDoThanhTich } from '../engine/achievementProgress';
import { cauConLai } from './achievementUnit';
import useGameStore from '../store/gameStore';

const TIER_SEQUENCE = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const CATEGORY_KEYS = Object.keys(ACHIEVEMENT_CATEGORIES);
const DEFAULT_UNLOCKED_BATCH = 24;
const DEFAULT_LOCKED_BATCH = 24;
const VI_COLLATOR = new Intl.Collator('vi-VN');
const ACHIEVEMENT_LOOKUP = new Map(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));
const DISPLAY_FONT = 'var(--skin-font-display)';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';
const CARD_SURFACE = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};
const MotionSection = motion.section;
const MotionAside = motion.aside;
const MotionDiv = motion.div;

const CATEGORY_REMARKS = {
  sessions: 'Nhịp phiên đang dựng nền rất rõ; đây thường là nhóm tạo đà cho toàn bộ chặng sau.',
  time: 'Tổng thời lượng tăng đều, nên nhóm này phản ánh sức bền hơn là vài ngày bốc cao.',
  streak: 'Chuỗi ngày cho thấy nếp sinh hoạt đang thắng cảm hứng nhất thời.',
  timeofday: 'Khung giờ học đã bắt đầu thành dấu riêng, chứ không còn ngẫu nhiên.',
  annual: 'Mốc theo năm và theo mùa cho thấy quãng học đủ dài để nhìn ra chu kỳ.',
  collection: 'Bạn đang lan sang các dấu phụ trợ, không chỉ chăm mỗi bộ đếm chính.',
  session_type: 'Chất lượng từng phiên đang lộ rõ, chứ không chỉ có số lần hoàn thành.',
  notes: 'Việc vừa học vừa ghi lại khiến tiến trình có chiều sâu và dễ giữ hơn.',
  era_rank: 'Tiến trình kỷ nguyên đã đủ dài để bắt đầu thấy những bậc mới.',
  day_of_week: 'Lịch học đang dần ghim vào những ngày cố định trong tuần.',
  monthly: 'Nhóm theo tháng cho thấy sức bền dài hơi, không chỉ vài ngày dồn lực.',
  xp_level: 'XP và cấp độ đang tăng như hệ quả của thói quen, không phải chỉ số rời rạc.',
  special: 'Đây là nhóm hiếm hơn, thường chỉ tới khi một thói quen rất cụ thể lặp lại đủ lâu.',
  meta: 'Tổng số dấu đã đạt đang tự kể câu chuyện tiến bộ chung của tài khoản.',
};

const TIER_SURFACES = {
  bronze: {
    badge: 'border-[rgba(178,124,80,0.24)] bg-[rgba(246,237,226,0.92)] text-[#8f5b33]',
    glow: 'from-[rgba(246,237,226,0.98)] via-[rgba(255,255,255,0.96)] to-[rgba(250,249,246,0.96)]',
    line: '#b27c50',
  },
  silver: {
    badge: 'border-[rgba(163,158,150,0.24)] bg-[rgba(243,241,236,0.92)] text-[#68645c]',
    glow: 'from-[rgba(243,241,236,0.98)] via-[rgba(255,255,255,0.96)] to-[rgba(250,249,246,0.96)]',
    line: '#a39e96',
  },
  gold: {
    badge: 'border-[rgba(195,154,88,0.24)] bg-[rgba(247,240,221,0.92)] text-[#8b6a2d]',
    glow: 'from-[rgba(247,240,221,0.98)] via-[rgba(255,255,255,0.96)] to-[rgba(250,249,246,0.96)]',
    line: '#c39a58',
  },
  platinum: {
    badge: 'border-[rgba(166,137,149,0.22)] bg-[rgba(243,236,239,0.92)] text-[#7b5c68]',
    glow: 'from-[rgba(243,236,239,0.98)] via-[rgba(255,255,255,0.96)] to-[rgba(250,249,246,0.96)]',
    line: '#a68995',
  },
  diamond: {
    badge: 'border-[rgba(131,155,176,0.24)] bg-[rgba(236,241,245,0.92)] text-[#5f7386]',
    glow: 'from-[rgba(236,241,245,0.98)] via-[rgba(255,255,255,0.96)] to-[rgba(250,249,246,0.96)]',
    line: '#839bb0',
  },
};

function hexToRgb(hex) {
  const normalized = `${hex}`.replace('#', '');
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(148, 163, 184, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function clampOrder(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getUnlockTimestamp(value) {
  const ts = typeof value === 'string' ? new Date(value).getTime() : Number(value);
  return Number.isFinite(ts) ? ts : null;
}

function padOrder(value) {
  return String(value ?? 0).padStart(2, '0');
}

function formatUnlockLabel(unlockedAt) {
  if (!unlockedAt) return 'Chưa có dấu thời gian';
  return formatVietnamDateTime(unlockedAt, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTierSurface(tier) {
  return TIER_SURFACES[tier] ?? TIER_SURFACES.silver;
}

function sortUnlockedEntries(left, right) {
  const leftTs = getUnlockTimestamp(left.unlockedAt);
  const rightTs = getUnlockTimestamp(right.unlockedAt);

  if (leftTs !== null || rightTs !== null) {
    if (leftTs === null) return 1;
    if (rightTs === null) return -1;
    if (leftTs !== rightTs) return rightTs - leftTs;
  }

  const leftOrder = clampOrder(left.order) ?? 0;
  const rightOrder = clampOrder(right.order) ?? 0;
  if (leftOrder !== rightOrder) return rightOrder - leftOrder;

  return left.definitionIndex - right.definitionIndex;
}

/**
 * Danh sách "Chưa đạt" sắp theo TIẾN ĐỘ giảm dần — gần nhất lên đầu.
 *
 * ⚠️ Trước 2026-09-01 nó sắp theo THỨ TỰ KHAI BÁO trong `constants.js`, tức theo thứ tự người
 * viết dữ liệu gõ ra. Hậu quả đo được: mục gần đạt nhất ("Một Năm Tập Trung", 97%, còn 751 phút)
 * nằm ở y=9.606px — **11,4 màn hình điện thoại** phải vuốt xuống mới gặp, trong khi thứ đứng đầu
 * danh sách là một mục người chơi còn cách rất xa. Danh sách 213 mục thì thứ tự KHÔNG phải chuyện
 * thẩm mỹ: nó quyết định người chơi có bao giờ nhìn thấy thứ mình sắp lấy được hay không.
 *
 * Mục không đo được tiến độ (50/360 mục có điều kiện ghép) xuống cuối, giữ nguyên thứ tự cũ giữa
 * chúng với nhau — chúng không có gì để so, và đẩy chúng lên đầu là đẩy đúng phần mù mịt nhất lên
 * chỗ đắt nhất.
 */
function sortLockedEntries(left, right) {
  const l = left.tienDo?.tiLe ?? -1;
  const r = right.tienDo?.tiLe ?? -1;
  if (l !== r) return r - l;
  if (left.definitionIndex !== right.definitionIndex) {
    return left.definitionIndex - right.definitionIndex;
  }
  return VI_COLLATOR.compare(left.achievement.label, right.achievement.label);
}

function FilterChip({
  active,
  countLabel,
  icon,
  // Ô biểu tượng của chip chỉ rộng 20px: emoji cần 13px mới đọc được, còn ký hiệu 2 chữ cái
  // ở 13px thì tràn ra ngoài. Cờ này do NƠI GỌI truyền vào (nó biết dữ liệu có icon hay không),
  // KHÔNG đoán bằng cách soi chuỗi — xem chú thích `hasGlyphIcon` ở `utils/labelMark.js`.
  iconIsPicture = false,
  label,
  onClick,
  tone,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        // ⚠️ CHIP LỌC ĐÃ NÉN (2026-09-02). Ở khung 390px, sáu chip bậc + bảy chip danh mục ở cỡ
        // cũ (px-3.5 py-2, 12.5px, icon 18px) xếp thành **chín hàng** và ăn gần trọn một màn hình
        // TRƯỚC khi Đàm thấy được một huy hiệu nào. Bộ lọc là công cụ phụ; nó không được đứng
        // chắn trước chính thứ nó lọc. Cỡ mới vẫn trên ngưỡng chạm 44px về chiều cao hàng.
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11.5px] font-medium transition',
        active
          ? 'border-[rgba(31,30,29,0.10)] bg-[rgba(31,30,29,0.98)] text-[var(--canvas)] shadow-[0_12px_24px_rgba(31,30,29,0.12)]'
          : 'border-[var(--line)] bg-[rgba(255,255,255,0.9)] text-[var(--muted)] hover:border-[var(--line-2)] hover:text-[var(--ink)] hover:bg-[rgba(250,249,246,0.98)]',
      ].join(' ')}
      style={active && tone ? { boxShadow: `0 14px 34px ${withAlpha(tone, 0.22)}` } : undefined}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 items-center justify-center rounded-full ${iconIsPicture ? 'text-[13px] leading-none' : 'text-[11px]'}`}
          style={tone ? { backgroundColor: active ? withAlpha('#ffffff', 0.14) : withAlpha(tone, 0.12) } : undefined}
        >
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      {countLabel ? (
        <span
          className={[
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            active ? 'bg-white/12 text-white/82' : 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]',
          ].join(' ')}
          style={{ fontFamily: MONO_FONT }}
        >
          {countLabel}
        </span>
      ) : null}
    </button>
  );
}

function AchievementCard({
  entry,
  latestId,
}) {
  const tierInfo = ACHIEVEMENT_TIERS[entry.achievement.tier] ?? ACHIEVEMENT_TIERS.silver;
  const categoryInfo = ACHIEVEMENT_CATEGORIES[entry.achievement.category] ?? ACHIEVEMENT_CATEGORIES.special;
  const tierSurface = getTierSurface(entry.achievement.tier);
  const unlockLabel = formatUnlockLabel(entry.unlockedAt);
  const showOrder = entry.isUnlocked && clampOrder(entry.order);

  return (
    <div
      className="relative overflow-hidden px-5 py-5 transition"
      style={{
        background: entry.isUnlocked
          ? 'var(--card-bg-solid)'
          : 'var(--card-bg-solid2)',
        border: `var(--skin-card-border-width,1px) solid ${entry.isUnlocked ? 'var(--line)' : 'var(--line-2)'}`,
        borderRadius: 'var(--skin-radius-card,18px)',
        boxShadow: entry.isUnlocked
          ? 'var(--skin-card-shadow)'
          : 'none',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ backgroundColor: entry.isUnlocked ? tierSurface.line : 'rgba(217,214,204,0.92)' }}
      />

      <div className="flex items-start gap-4">
        <div
          className={[
            'mono flex h-14 w-14 shrink-0 items-center justify-center border font-semibold',
            // Emoji cần TO mới đọc được trong ô 56px; ký hiệu 2 chữ cái thì cần nhỏ + giãn chữ.
            hasGlyphIcon(entry.achievement.icon) ? 'text-[26px] leading-none' : 'text-[10px] uppercase tracking-[0.16em]',
            entry.isUnlocked ? 'bg-[var(--card-bg-solid)] text-[var(--ink)]' : 'bg-[var(--card-bg-solid2)] text-[var(--muted-2)]',
          ].join(' ')}
          style={{
            borderColor: entry.isUnlocked ? withAlpha(tierSurface.line, 0.26) : 'var(--line-2)',
            borderRadius: 'var(--skin-radius-control,14px)',
            boxShadow: entry.isUnlocked ? `0 12px 28px ${withAlpha(tierSurface.line, 0.1)}` : 'inset 0 1px 0 rgba(255,255,255,0.72)',
            fontFamily: MONO_FONT,
          }}
        >
          {getGlyph(entry.achievement.icon, entry.achievement.label, 'DG')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-[25px] leading-tight tracking-[-0.03em] text-[var(--ink)]"
              style={{ fontFamily: DISPLAY_FONT, fontWeight: 600 }}
            >
              {entry.achievement.label}
            </h3>

            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tierSurface.badge}`}>
              {tierInfo.label}
            </span>

            <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
              {categoryInfo.label}
            </span>

            {entry.id === latestId && entry.isUnlocked ? (
              <span className="rounded-full border border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-xs font-semibold text-[var(--accent2)]">
                Mới nhất
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[14px] leading-6 text-[var(--ink-2)]">
            {entry.achievement.description}
          </p>

          {/*
            ⚠️ THANH TIẾN ĐỘ CHỈ MỌC RA Ở THẺ CHƯA ĐẠT CÓ ĐO ĐƯỢC — không phải ở cả 360 thẻ.
            Thẻ đã đạt không cần (100% là chuyện đã rồi), và 50/360 mục có điều kiện ghép trả về
            `null` nên chúng CÂM chứ không hiện "0%": một con số 0% đọc lên như "bạn chưa làm gì",
            còn sự thật là "chỗ này không đo được".
            Nó THAY câu mô tả trả lời "cần gì" bằng câu trả lời "còn bao xa" — mô tả vẫn ở ngay
            trên, nên đây là một dòng THÊM có mẫu số chứ không phải một dòng lặp lại.
          */}
          {entry.tienDo ? (
            <div className="mt-2">
              <div className="overflow-hidden rounded-full bg-[var(--line)]">
                <div
                  className="h-[3px] rounded-full transition-all"
                  style={{
                    width: `${Math.max(2, Math.floor(entry.tienDo.tiLe * 100))}%`,
                    background: 'var(--accent)',
                  }}
                />
              </div>
              <div className="mono mt-1 text-[11px] text-[var(--muted)]">
                {entry.tienDo.hienTai.toLocaleString('vi-VN')}/{entry.tienDo.moc.toLocaleString('vi-VN')}
                {cauConLai(entry.tienDo.con, entry.tienDo.dem) ? ` · ${cauConLai(entry.tienDo.con, entry.tienDo.dem)}` : ''}
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[var(--muted)]">
            {showOrder ? (
              <span
                className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.9)] px-3 py-1 text-[11px] text-[var(--ink-2)]"
                style={{ fontFamily: MONO_FONT }}
              >
                #{padOrder(entry.order)}
              </span>
            ) : null}

            {/* ⚠️ BỎ TIỀN TỐ, VÀ BỎ HẲN CHIP Ở NHÁNH CHƯA ĐẠT (vòng 20, 2026-08-30).
                "Thời điểm đạt: " — trong một mục tên là "Đã đạt (146)" thì một con dấu thời gian
                không cần được giới thiệu; bỏ tiền tố làm chip ngắn đi ~90px nên nó thôi phải
                chiếm trọn một hàng riêng ở cột chữ 191px.
                "Trạng thái: chưa đạt" — tiêu đề mục và kiểu vẽ mờ đã nói xong, mà nó lặp ở 24
                thẻ. Bỏ đi thì phần "Chưa đạt" LIẾC được thay vì phải đọc. */}
            {entry.isUnlocked ? (
              <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-3 py-1">
                {unlockLabel}
              </span>
            ) : null}

            {entry.timeSource === 'reconstructed' ? (
              <span className="rounded-full border border-[rgba(131,155,176,0.22)] bg-[rgba(236,241,245,0.9)] px-3 py-1 text-[#5f7386]">
                Suy từ nhật ký
              </span>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Achievements() {
  const unlockedIds = useGameStore((state) => state.achievements?.unlocked ?? []);
  const timeline = useGameStore((state) => state.achievements?.timeline ?? {});

  // ⚠️ `buildAchievementSnapshotNow` quét lại TOÀN BỘ lịch sử (624 phiên trên fixture 180 ngày),
  // nên nó PHẢI nằm trong `useMemo` khoá theo đúng những lát state nó đọc — gọi thẳng trong thân
  // render là quét lại 624 phiên mỗi lần bấm một cái chip lọc.
  const history = useGameStore((state) => state.history);
  const progressSlice = useGameStore((state) => state.progress);
  const streakSlice = useGameStore((state) => state.streak);
  const playerSlice = useGameStore((state) => state.player);
  const buildSnapshot = useGameStore((state) => state.buildAchievementSnapshotNow);
  const snapshot = useMemo(
    () => buildSnapshot(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, progressSlice, streakSlice, playerSlice],
  );
  const sapDat = useMemo(
    () => thanhTichGanDat(ACHIEVEMENTS, snapshot, unlockedIds, 3),
    [snapshot, unlockedIds],
  );

  const [filterOpen, setFilterOpen] = useState(false);
  const [showUntouched, setShowUntouched] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const deferredTier = useDeferredValue(selectedTier);
  const deferredCategory = useDeferredValue(selectedCategory);

  const handleTierChange = (tier) => {
    startTransition(() => {
      setSelectedTier(tier);
    });
  };

  const handleCategoryChange = (category) => {
    startTransition(() => {
      setSelectedCategory(category);
    });
  };

  const dataset = useMemo(() => {
    const unlockedSet = new Set(unlockedIds);
    const unlockedOrder = new Map(unlockedIds.map((id, index) => [id, index + 1]));

    const tierStats = Object.fromEntries(
      TIER_SEQUENCE.map((key) => [key, { total: 0, unlocked: 0 }]),
    );
    const categoryStats = Object.fromEntries(
      CATEGORY_KEYS.map((key) => [key, { total: 0, unlocked: 0 }]),
    );

    const entries = ACHIEVEMENTS.map((achievement, definitionIndex) => {
      const storedRecord = timeline?.[achievement.id];
      const storedOrder = clampOrder(
        Number.isFinite(storedRecord?.order) ? storedRecord.order : Number(storedRecord?.order),
      );
      const storedUnlockedAt = typeof storedRecord?.unlockedAt === 'string'
        ? storedRecord.unlockedAt
        : null;
      const isUnlocked = unlockedSet.has(achievement.id);
      const order = storedOrder ?? unlockedOrder.get(achievement.id) ?? null;
      const unlockedAt = storedUnlockedAt;
      const timeSource = storedUnlockedAt
        ? storedRecord?.source === 'inferred'
          ? 'reconstructed'
          : 'stored'
        : 'missing';

      if (tierStats[achievement.tier]) {
        tierStats[achievement.tier].total += 1;
        if (isUnlocked) tierStats[achievement.tier].unlocked += 1;
      }

      if (categoryStats[achievement.category]) {
        categoryStats[achievement.category].total += 1;
        if (isUnlocked) categoryStats[achievement.category].unlocked += 1;
      }

      return {
        id: achievement.id,
        achievement,
        definitionIndex,
        // `null` cho 50/360 mục có điều kiện ghép — đó là câu trả lời thật, không phải 0%.
        tienDo: isUnlocked ? null : tienDoThanhTich(achievement, snapshot),
        isUnlocked,
        order,
        unlockedAt,
        timeSource,
      };
    });

    const unknownUnlockedEntries = unlockedIds
      .filter((id) => !ACHIEVEMENT_LOOKUP.has(id))
      .map((id, index) => ({
        id,
        definitionIndex: ACHIEVEMENTS.length + index,
        isUnlocked: true,
        order: unlockedOrder.get(id) ?? index + 1,
        unlockedAt: typeof timeline?.[id]?.unlockedAt === 'string'
          ? timeline[id].unlockedAt
          : null,
        timeSource: typeof timeline?.[id]?.unlockedAt === 'string'
          ? timeline[id]?.source === 'inferred'
            ? 'reconstructed'
            : 'stored'
          : 'missing',
        achievement: {
          id,
          icon: '•',
          label: id,
          description: 'Không tìm thấy metadata cho thành tích này trong constants hiện tại.',
          tier: 'silver',
          category: 'special',
        },
      }));

    const allEntries = [...entries, ...unknownUnlockedEntries];
    const unlockedEntries = allEntries.filter((entry) => entry.isUnlocked).sort(sortUnlockedEntries);
    const latestEntry = unlockedEntries[0] ?? null;

    return {
      allEntries,
      categoryStats,
      latestEntry,
      tierStats,
      totalAchievements: allEntries.length,
      totalUnlocked: unlockedEntries.length,
      unlockedEntries,
    };
  }, [timeline, unlockedIds, snapshot]);

  const filteredEntries = useMemo(() => (
    dataset.allEntries.filter((entry) => {
      if (deferredTier !== 'all' && entry.achievement.tier !== deferredTier) return false;
      if (deferredCategory !== 'all' && entry.achievement.category !== deferredCategory) return false;
      return true;
    })
  ), [dataset.allEntries, deferredCategory, deferredTier]);

  const filteredUnlockedEntries = useMemo(() => (
    filteredEntries.filter((entry) => entry.isUnlocked).sort(sortUnlockedEntries)
  ), [filteredEntries]);

  const filteredLockedEntries = useMemo(() => (
    filteredEntries.filter((entry) => !entry.isUnlocked).sort(sortLockedEntries)
  ), [filteredEntries]);

  /*
    ⚠️ TÁCH "ĐANG TIẾN TỚI" KHỎI "CHƯA CHẠM TỚI" (2026-09-02). Đo trên fixture đã chơi 6 tháng:
    tab Huy hiệu dài **4.915px ở khung 390px**, và phần lớn chiều dài ấy là những ô có tiến độ
    ĐÚNG BẰNG 0 — chúng giống hệt nhau, nên một trăm ô như thế không nói được nhiều hơn một ô.
    ⚠️ KHÔNG GIẤU, CHỈ GẤP LẠI: nút mở nằm ngay đó và ghi rõ còn bao nhiêu ô. Luật cũ của file này
    (*"ô chưa đạt không bị giấu — một bộ sưu tập chỉ có nghĩa khi thấy được phần còn thiếu"*) vẫn
    đứng, nhưng nó nói về việc THẤY ĐƯỢC phần còn thiếu, không đòi phải cuộn qua hết phần ấy mỗi
    lần mở màn hình. Con số "còn N ô" cho thấy phần thiếu ngay cả khi đang gấp.
  */
  const { dangTien: lockedInProgress, chuaCham: lockedUntouched } = useMemo(
    () => splitLockedBadges(filteredLockedEntries),
    [filteredLockedEntries],
  );





  const activeTierInfo = deferredTier === 'all' ? null : ACHIEVEMENT_TIERS[deferredTier];

  return (
    <div className="space-y-5 text-[var(--ink)]">
      {/* Dải mở đầu Hành trang — xem `shared/inventoryHero.js`. Dùng LẠI `sapDat` (đã tính ở trên
          cho danh sách "sắp đạt") chứ không tính lại: một luật một công thức. */}
      <InventoryHero
        hero={heroHuyHieu({
          daMo: unlockedIds.length,
          tong: ACHIEVEMENTS.length,
          ganDat: sapDat[0]
            ? { ten: sapDat[0].achievement?.label ?? 'Huy hiệu', pct: sapDat[0].tiLe }
            : null,
        })}
        icon="🏅"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
        {/*
          ⚠️ THẺ TÓM TẮT ĐÃ GỠ (2026-09-02) — nó nói ĐÚNG hai điều mà dải hero ngay trên nó vừa
          nói: tổng "157 / 360 dấu" và danh sách "SẮP ĐẠT". Hai chỗ nói cùng một chuyện, cách nhau
          chưa tới một màn hình, và chỗ nói SAU lại nói ÍT hơn (không màu, không có câu "còn bao
          xa"). Luật của dự án: *hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường*.
          ⚠️ VÀ ĐÂY CHÍNH LÀ LÝ DO ĐÀM NÓI BA LẦN RẰNG HÀNH TRANG "CHƯA THẤY THAY ĐỔI GÌ": vòng
          trước tôi THÊM một dải mới lên trên một thẻ nói cùng nội dung, nên màn hình dài thêm mà
          không mới thêm. **Thêm mà không bớt thì không phải thiết kế lại.**
        */}

        {/*
          ⚠️ DANH SÁCH "MỚI ĐẠT GẦN ĐÂY" ĐÃ GỠ (2026-09-02). Đây là chỗ thứ TƯ trên cùng một màn
          nói rằng Đàm có huy hiệu: dải hero · thẻ tóm tắt (cũng đã gỡ) · danh sách này · và lưới.
          Lưới xếp ĐÃ ĐẠT LÊN TRƯỚC, nên "mới đạt gần đây" chính là góc trên bên trái của nó, và
          chạm một ô là ra tên. Thứ duy nhất mất đi là số thứ tự + ngày giờ — dữ liệu để TRA CỨU,
          không phải để liếc, và nó không xứng với ~1.400px ở màn hình chính.
        */}
      </div>

      {/*
        ⚠️ BỘ LỌC THU GỌN MẶC ĐỊNH (2026-09-02). Đo trước khi sửa: lưới huy hiệu bắt đầu ở **y=1398**
        — tức gần HAI màn hình điện thoại trôi qua trước khi Đàm thấy được một huy hiệu nào, và
        phần lớn quãng ấy là mười ba cái chip lọc. Bộ lọc là công cụ PHỤ; nó không được đứng chắn
        trước chính thứ nó lọc. Nay nó là một nút một dòng, mở ra khi cần.
        ⚠️ Nút vẫn nói TRẠNG THÁI ĐANG LỌC ngay trên mặt nút — thu gọn một bộ lọc đang bật mà không
        nói gì thì Đàm sẽ thấy một bộ sưu tập thiếu mục và không hiểu vì sao.
      */}
      <section className="p-5" style={CARD_SURFACE}>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3"
        >
          <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted-2)' }}>
            Bộ lọc
          </span>
          <span className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--muted)' }}>
            {selectedTier === 'all' && selectedCategory === 'all'
              ? 'Đang xem tất cả'
              : 'Đang lọc'}
            <span aria-hidden>{filterOpen ? '▲' : '▼'}</span>
          </span>
        </button>

        <div className="space-y-4" hidden={!filterOpen}>
          <div>
            <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
              Lọc theo tier
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterChip
                active={selectedTier === 'all'}
                countLabel={`${dataset.totalUnlocked}/${dataset.totalAchievements}`}
                    icon="✦"
                    iconIsPicture
                label="Tất cả"
                onClick={() => handleTierChange('all')}
              />
              {TIER_SEQUENCE.map((tier) => {
                const tierInfo = ACHIEVEMENT_TIERS[tier];
                const stats = dataset.tierStats[tier];
                return (
                  <FilterChip
                    key={tier}
                    active={selectedTier === tier}
                    countLabel={`${stats?.unlocked ?? 0}/${stats?.total ?? 0}`}
                    icon={getGlyph(tierInfo.icon, tierInfo.label, 'TR')}
                    iconIsPicture={hasGlyphIcon(tierInfo.icon)}
                    label={tierInfo.label}
                    onClick={() => handleTierChange(tier)}
                    tone={tierInfo.color}
                  />
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
              Lọc theo danh mục
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {/*
                ⚠️ KHÔNG truyền `countLabel` ở đây (2026-09-01): viên này và viên "Tất cả" của
                hàng HẠNG cách nhau ĐÚNG 282px và in ra CÙNG một chuỗi từng ký tự, vì cả hai
                dùng chung biểu thức `totalUnlocked/totalAchievements` — một con số HẰNG, không
                đổi theo bộ lọc nào. Hàng hạng nằm TRÊN nên nó giữ con số; hàng này nằm ngay dưới
                một hàng vừa nói xong đúng con số ấy.
                ⚠️ `FilterChip` phải bọc `{countLabel ? … : null}` — bản cũ dựng bong bóng đếm VÔ
                ĐIỀU KIỆN, không truyền prop thì còn lại một bong bóng xám rỗng.
              */}
              <FilterChip
                active={selectedCategory === 'all'}
                icon="✦"
                iconIsPicture
                label="Tất cả"
                onClick={() => handleCategoryChange('all')}
              />
              {CATEGORY_KEYS.map((categoryKey) => {
                const categoryInfo = ACHIEVEMENT_CATEGORIES[categoryKey];
                const stats = dataset.categoryStats[categoryKey];
                return (
                  <FilterChip
                    key={categoryKey}
                    active={selectedCategory === categoryKey}
                    countLabel={`${stats?.unlocked ?? 0}/${stats?.total ?? 0}`}
                    icon={getGlyph(categoryInfo.icon, categoryInfo.label, 'DM')}
                    iconIsPicture={hasGlyphIcon(categoryInfo.icon)}
                    label={categoryInfo.label}
                    onClick={() => handleCategoryChange(categoryKey)}
                    tone={ACHIEVEMENT_TIERS[activeTierInfo ? deferredTier : 'silver']?.color ?? '#94a3b8'}
                  />
                );
              })}
            </div>

            {/*
              ⚠️ MỘT LẦN, KHÔNG PHẢI BỐN MƯƠI TÁM LẦN (2026-09-01). `CATEGORY_REMARKS` trước nay
              được nối vào ĐUÔI của một câu dựng riêng cho TỪNG thẻ (`buildAiRemark`), rồi đóng
              khung trong một cái hộp có viền — 48 hộp trên một trang, chiếm **38,4% chiều dài
              trang** (19.059 → 11.739px sau khi xoá), mà nửa đầu mỗi câu chỉ chép lại chip `#N`
              cùng thẻ và nửa đuôi thì giống hệt nhau ở mọi thẻ cùng danh mục (đuôi lặp nhiều
              nhất 17 lần, và 24/48 hộp mở đầu bằng đúng chữ "Mốc này còn ở phía trước.").
              Kiểm cả 5 nhánh của hàm cũ: KHÔNG nhánh nào là tín hiệu duy nhất — "chưa có dấu
              thời gian" đã có ở `formatUnlockLabel`, "suy từ nhật ký" và "mới nhất" đã là chip
              riêng, thứ tự đã là chip `#N`, danh mục đã là chip danh mục. Xoá không mất dữ kiện.
              Giữ lại giọng văn ở ĐÚNG chỗ nó có nghĩa: một dòng cho danh mục Đàm vừa chọn — nó
              vừa nói về đúng thứ anh đang xem, vừa là phản hồi nhìn thấy được cho cú chạm lọc.
            */}
            {selectedCategory !== 'all' && CATEGORY_REMARKS[selectedCategory] ? (
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {CATEGORY_REMARKS[selectedCategory]}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/*
        ⚠️ HAI DANH SÁCH DÀI ĐÃ THÀNH MỘT LƯỚI (2026-09-02, lệnh Đàm lặp lần thứ ba: *"hành trang
        vẫn chưa thấy thay đổi gì… thực hiện lớn"*). Bản cũ vẽ mỗi huy hiệu thành một HÀNG CHỮ đầy
        đủ (icon nhỏ · tên · mô tả · thanh tiến độ · ngày đạt) cho **360 mục** — đó là một bảng
        tính, không phải một bộ sưu tập. Nó dài tới mức chính giao diện phải thừa nhận và cắt bớt:
        *"đang hiện 40/203 mục để giữ giao diện nhẹ hơn"*. Một danh sách bị cắt thì không bao giờ
        cho được cảm giác *"nhìn kìa, mình có ngần này rồi"*.
        ⚠️ Ô CHƯA ĐẠT KHÔNG BỊ GIẤU — một bộ sưu tập chỉ có nghĩa khi thấy được phần còn thiếu; đó
        chính là thứ khiến người ta muốn lấp đầy. Nên bỏ luôn phân trang: xem hết là ĐIỂM CHÍNH.
      */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="mono text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
            Bộ sưu tập
          </h3>
          <span className="mono text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
            {filteredUnlockedEntries.length} đã đạt · {lockedInProgress.length} đang tiến tới · {lockedUntouched.length} chưa chạm
          </span>
        </div>

        {/* ⚠️ Lưới chỉ hiện ICON nên phải có chỗ đọc TÊN — nếu không thì đổi một bảng tính quá dài
            lấy một bức tranh không đọc được. Dải này nằm NGAY TRÊN lưới (không phải hộp thoại):
            chạm ô này rồi chạm ô kế tiếp là đọc được luôn, không phải đóng-mở gì cả. */}
        {selectedEntry && (
          <div
            className="flex items-start gap-3 px-4 py-3"
            style={{
              borderRadius: 'var(--skin-radius-card,18px)',
              background: 'var(--card-bg-solid)',
              border: 'var(--skin-card-border-width,1px) solid var(--line)',
            }}
          >
            <span className="text-[22px] leading-none" aria-hidden>
              {selectedEntry.achievement?.icon ?? '•'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
                {selectedEntry.achievement?.label ?? selectedEntry.id}
              </p>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
                {selectedEntry.isUnlocked
                  ? 'Đã đạt.'
                  : (selectedEntry.achievement?.description ?? 'Chưa đủ dữ liệu để đo tiến độ.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEntry(null)}
              className="mono shrink-0 text-[11px] uppercase tracking-[0.16em]"
              style={{ color: 'var(--muted-2)' }}
            >
              Đóng
            </button>
          </div>
        )}

        <BadgeGrid
          entries={[...filteredUnlockedEntries, ...lockedInProgress]}
          onSelect={setSelectedEntry}
          emptyLabel="Bộ lọc hiện tại không còn dấu nào."
        />

        {lockedUntouched.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowUntouched((v) => !v)}
              className="mono w-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{
                background: 'var(--card-bg-solid)',
                border: 'var(--skin-card-border-width,1px) solid var(--line)',
                borderRadius: 'var(--skin-radius-card,18px)',
                color: 'var(--muted)',
              }}
            >
              {showUntouched
                ? `Thu gọn ${lockedUntouched.length} dấu chưa chạm tới`
                : `Còn ${lockedUntouched.length} dấu chưa chạm tới — xem`}
            </button>
            {showUntouched && (
              <BadgeGrid entries={lockedUntouched} onSelect={setSelectedEntry} emptyLabel="" />
            )}
          </>
        )}
      </section>
    </div>
  );
}
