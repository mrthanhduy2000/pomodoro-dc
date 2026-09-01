import React, {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEnterMotion, withDelay } from '../lib/motionPresets';

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
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition',
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
  const enterMotion = useEnterMotion();
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

  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [unlockedVisibleCount, setUnlockedVisibleCount] = useState(DEFAULT_UNLOCKED_BATCH);
  const [lockedVisibleCount, setLockedVisibleCount] = useState(DEFAULT_LOCKED_BATCH);

  const deferredTier = useDeferredValue(selectedTier);
  const deferredCategory = useDeferredValue(selectedCategory);

  const handleTierChange = (tier) => {
    startTransition(() => {
      setSelectedTier(tier);
      setUnlockedVisibleCount(DEFAULT_UNLOCKED_BATCH);
      setLockedVisibleCount(DEFAULT_LOCKED_BATCH);
    });
  };

  const handleCategoryChange = (category) => {
    startTransition(() => {
      setSelectedCategory(category);
      setUnlockedVisibleCount(DEFAULT_UNLOCKED_BATCH);
      setLockedVisibleCount(DEFAULT_LOCKED_BATCH);
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

  const visibleUnlockedEntries = useMemo(() => (
    filteredUnlockedEntries.slice(0, unlockedVisibleCount)
  ), [filteredUnlockedEntries, unlockedVisibleCount]);

  const visibleLockedEntries = useMemo(() => (
    filteredLockedEntries.slice(0, lockedVisibleCount)
  ), [filteredLockedEntries, lockedVisibleCount]);

  const latestThreeEntries = useMemo(() => (
    dataset.unlockedEntries.slice(0, 3)
  ), [dataset.unlockedEntries]);

  const totalProgress = dataset.totalAchievements > 0
    ? Math.round((dataset.totalUnlocked / dataset.totalAchievements) * 100)
    : 0;

  const activeTierInfo = deferredTier === 'all' ? null : ACHIEVEMENT_TIERS[deferredTier];
  const heroSurface = dataset.latestEntry
    ? getTierSurface(dataset.latestEntry.achievement.tier)
    : TIER_SURFACES.silver;

  return (
    <div className="space-y-5 text-[var(--ink)]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
        <MotionSection
          {...enterMotion}
          className="overflow-hidden p-6"
          style={CARD_SURFACE}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              {/* ⚠️ ĐÃ GỠ nhãn "Lưu trữ thành tích" (vòng 20, 2026-08-30): nút tab con đang SÁNG,
                  cách 56px phía trên, đã trả lời xong câu "tôi đang ở đâu". Cùng luật đã áp cho
                  `RelicInventory` và `BuildingWorkshop` ngày 2026-08-30 nhưng còn sót ở file này. */}
              {/*
                ⚠️ NHẤN VÀO CON SỐ ĐÃ ĐẠT, KHÔNG NHẤN VÀO MẪU SỐ (đổi 2026-08-29).
                Bản cũ viết `{đã đạt}/{360} dấu đã đạt` ở cỡ 40px — ở khung 390px nó tràn thành HAI
                DÒNG CHỮ KHỔNG LỒ, và là thứ ĐẦU TIÊN, TO NHẤT màn hình. Với một mẫu số 360 thì câu
                ấy luôn đọc ra là *"bạn mới đi được vài phần trăm"*, kể cả khi người chơi vừa mở
                được cái thứ một trăm. Đó là mở màn hình bằng một lời chê.
                Nay: con số ĐÃ ĐẠT to (đó là thành quả), mẫu số lùi về cỡ nhỏ bên cạnh (vẫn có mặt
                để biết còn bao xa — không giấu sự thật, chỉ thôi hét nó lên).
                Cỡ chữ 40 → 30: hai dòng ở khung 390px là hai dòng cho một con số.
                ⚠️ Bốn dòng mô tả "màn này là gì" ĐÃ GỠ — nó giải thích một màn hình mà người đọc
                đang đứng trong đó, và đọc một lần là đủ cho cả đời dùng app. Cùng lý do đã gỡ
                subtitle của `ShellPane` khỏi khổ điện thoại.
              */}
              <h2
                className="mt-2 text-[30px] leading-tight tracking-[-0.04em] text-[var(--ink)]"
                style={{ fontFamily: DISPLAY_FONT, fontWeight: 600 }}
              >
                {dataset.totalUnlocked}
                <span className="ml-2 text-[15px] font-semibold tracking-normal text-[var(--muted)]">
                  / {dataset.totalAchievements} dấu
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTierInfo ? (
                <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  Đang lọc theo tier: {activeTierInfo.label}
                </span>
              ) : null}
              {deferredCategory !== 'all' ? (
                <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  Danh mục: {ACHIEVEMENT_CATEGORIES[deferredCategory]?.label ?? deferredCategory}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-[3px] rounded-full transition-all"
              style={{
                width: `${Math.max(totalProgress, dataset.totalUnlocked > 0 ? 2 : 0)}%`,
                background: heroSurface.line,
              }}
            />
          </div>

          {/*
            ⚠️ HAI THẺ TÓM TẮT ĐÃ GỠ (vòng 20, 2026-08-30) — cả hai đều là chỗ nói lần thứ hai, và
            cả hai đều đứng ở vùng ĐẮT NHẤT màn hình (trên nếp gấp 390px).
            · "Gần nhất" (111px): dòng đầu của mục "Mới đạt gần đây" ở ngay dưới nói y hệt và nói
              NHIỀU hơn — thêm bậc độ hiếm và số thứ tự. Chỗ nói ít hơn phải nhường.
            · "Theo tier" (131px): "43 · 51 · 34 · 14 · 4" trên một dòng và "Đồng · Bạc · Vàng ·
              Bạch Kim · Kim Cương" trên dòng kế — mắt phải ĐẾM VỊ TRÍ để ghép số với tên, và
              "Kim Cương" còn rớt xuống dòng thứ hai ở 390px. Hàng chip lọc ngay dưới nói cùng
              điều đó, có MẪU SỐ ("43/64" ⇒ đọc được "còn 21 cái nữa"), lại còn BẤM ĐƯỢC.
              Chữ "tier" trong nhãn cũng là tiếng Anh.
          */}
          {/*
            SẮP ĐẠT — thứ DUY NHẤT trên màn này trả lời "tôi sắp được gì", và nó phải đứng trên
            nếp gấp.

            ⚠️ VÌ SAO NÓ ĐÁNG CHỖ ĐẮT NHẤT MÀN HÌNH. Trước 2026-09-01, cả 360 thành tích chỉ có
            đạt/chưa-đạt — `Achievements.jsx` chỉ biết `isUnlocked`, và chữ "progress" xuất hiện
            đúng MỘT lần trong cả file, trong một chú thích nói về màn khác. Nghĩa là 213 mục chưa
            đạt là 213 ô xám giống hệt nhau, không ô nào cho biết mình còn cách bao xa. Đo ra:
            310/360 mục (86%) chỉ là một phép so ngưỡng đơn, tức con số "còn bao nhiêu nữa" đã nằm
            sẵn trong dữ liệu từ đầu — chưa ai lấy nó ra.

            ⚠️ VÀ VÌ SAO CHỈ BA MỤC, KHÔNG PHẢI MỘT THANH TIẾN ĐỘ TRÊN CẢ 213 Ô. Gắn thanh cho mọi
            ô là THÊM 213 thứ phải đọc để trả lời một câu hỏi — đúng cái "lạm phát thông tin" mà
            vòng trước vừa gỡ. Ba dòng cô đặc nói được nhiều hơn 213 thanh, và chúng tự biến mất
            khi không còn mục nào ở gần (ngưỡng 10%: dưới đó thì "còn 900/1000" đọc y hệt "chưa
            bắt đầu").
          */}
          {sapDat.length > 0 ? (
            <div className="mt-5">
              <div className="mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Sắp đạt
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {sapDat.map(({ achievement, tiLe, con, dem }) => (
                  <div
                    key={achievement.id}
                    className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[14px] font-semibold text-[var(--ink)]">
                        <span className={hasGlyphIcon(achievement.icon) ? 'mr-1.5' : 'mr-1.5 text-[11px]'}>
                          {getGlyph(achievement.icon, achievement.label, 'TT')}
                        </span>
                        {achievement.label}
                      </span>
                      <span className="mono shrink-0 text-[12px] font-semibold text-[var(--accent)]">
                        {Math.floor(tiLe * 100)}%
                      </span>
                    </div>
                    <div className="mt-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                      <div
                        className="h-[3px] rounded-full transition-all"
                        style={{ width: `${Math.max(2, Math.floor(tiLe * 100))}%`, background: heroSurface.line }}
                      />
                    </div>
                    <div className="mt-1.5 text-[12px] text-[var(--muted)]">{cauConLai(con, dem)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2">

            {/*
              ⚠️ THẺ "HIỂN THỊ" ĐÃ GỠ (2026-08-30) — nó là chỗ nói lần thứ hai, và cả hai vế của nó
              đều thừa. Vế con số (*"N đã đạt / M chưa đạt"*) là ĐÚNG hai con số mà hai danh sách
              ngay bên dưới tự in ra làm tiêu đề của chính chúng: «Đã đạt (N)» và «Chưa đạt (M)» —
              gần hơn, và gắn liền với thứ chúng đếm. Vế câu chữ (*"Bộ lọc đang áp dụng trực tiếp
              lên cả hai danh sách bên dưới"*) là một câu HƯỚNG DẪN SỬ DỤNG: nó mô tả cách giao
              diện hoạt động, đúng một lần là đủ cho cả đời dùng app, rồi nằm đó mãi mãi.
              Đo ở khung 390px: ba thẻ con này XẾP DỌC (grid chỉ chia 3 cột từ `md:`), mỗi thẻ
              ~130px — nên thẻ thừa này chiếm 130px của màn hình trước khi thấy một thành tích nào.
              GIỮ hai thẻ kia: "Gần nhất" là thẻ khoe thành quả (dopamine), "Theo tier" là một hình
              dạng liếc-một-cái-biết-ngay mà không chỗ nào khác nói.
            */}
          </div>
        </MotionSection>

        <MotionAside
          {...withDelay(enterMotion, 0.04)}
          className="p-5"
          style={CARD_SURFACE}
        >
          {/*
            ⚠️ HAI THỨ ĐÃ GỠ Ở HÀNG TIÊU ĐỀ NÀY (vòng 20, 2026-08-30), cả hai là khuôn 1 + 11:
            · Nhãn "Dấu gần đây" đứng ngay TRÊN tiêu đề "Mới đạt gần đây" — hai cách nói cùng một
              câu, cách nhau 8px.
            · Chip "#146": số thứ tự ấy ĐÃ có ở dòng đầu tiên của chính danh sách ngay dưới
              ("#146 · 14:24 30/08/2026"). Và vì nó là `shrink-0` cạnh một tiêu đề 30px, ở 390px
              nó ép "Mới đạt gần đây" **vỡ thành hai dòng** — một chip 60px thêm vào "cho gọn"
              lại đẻ ra một dòng chữ 45px. Đúng khuôn `truncate + shrink-0` ở dạng nhỏ: thứ bị bóp
              luôn là cái không khai `shrink-0`.
          */}
          <div className="flex items-center justify-between gap-3">
            <h3
              className="text-[30px] tracking-[-0.04em] text-[var(--ink)]"
              style={{ fontFamily: DISPLAY_FONT, fontWeight: 600 }}
            >
              Mới đạt gần đây
            </h3>
          </div>

          {latestThreeEntries.length === 0 ? (
            <div
              className="mt-5 border border-dashed border-[var(--line-2)] bg-[var(--card-bg-solid2)] px-4 py-6 text-sm leading-6 text-[var(--muted)]"
              style={{ borderRadius: 'var(--skin-radius-card,18px)' }}
            >
              Khi có phiên đầu tiên, khu này sẽ hiện dấu mới nhất cùng hai mốc đứng ngay sau nó.
            </div>
          ) : (
            <div className="mt-5 divide-y" style={{ borderColor: 'rgba(217,214,204,0.82)' }}>
              {latestThreeEntries.map((entry) => {
                const tierInfo = ACHIEVEMENT_TIERS[entry.achievement.tier] ?? ACHIEVEMENT_TIERS.silver;
                return (
                  <div
                    key={entry.id}
                    className="px-0 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mono mt-0.5 flex h-10 w-10 items-center justify-center border bg-[var(--card-bg-solid2)] font-semibold ${hasGlyphIcon(entry.achievement.icon) ? 'text-[19px] leading-none' : 'text-[9px] uppercase tracking-[0.14em]'}`} style={{ borderColor: withAlpha(getTierSurface(entry.achievement.tier).line, 0.2), borderRadius: 'var(--skin-radius-control,14px)', fontFamily: MONO_FONT }}>{getGlyph(entry.achievement.icon, entry.achievement.label, 'DG')}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[16px] text-[var(--ink)]" style={{ fontFamily: DISPLAY_FONT, fontWeight: 600 }}>
                            {entry.achievement.label}
                          </p>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTierSurface(entry.achievement.tier).badge}`}>
                            {tierInfo.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          #{padOrder(entry.order)} · {formatUnlockLabel(entry.unlockedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MotionAside>
      </div>

      <section
        className="p-5"
        style={CARD_SURFACE}
      >
        <div className="space-y-4">
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

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Chưa đạt ({filteredLockedEntries.length})
          </h3>

          {filteredLockedEntries.length > DEFAULT_LOCKED_BATCH ? (
            <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.85)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]">
              Đang hiện {visibleLockedEntries.length}/{filteredLockedEntries.length} mục để giữ giao diện nhẹ hơn.
            </span>
          ) : null}
        </div>

        {filteredLockedEntries.length === 0 ? (
          <div
            className="border border-dashed border-[var(--line-2)] bg-[var(--card-bg-solid)] px-5 py-10 text-center text-sm text-[var(--muted)]"
            style={{ borderRadius: 'var(--skin-radius-card,18px)' }}
          >
            Bộ lọc hiện tại không còn dấu nào ở trạng thái chờ.
          </div>
        ) : (
          <>
            <div
              className="grid gap-3"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: '1px 1600px',
              }}
            >
              {visibleLockedEntries.map((entry) => (
                <AchievementCard
                  key={entry.id}
                  entry={entry}
                  latestId={dataset.latestEntry?.id ?? null}
                />
              ))}
            </div>

            {visibleLockedEntries.length < filteredLockedEntries.length ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setLockedVisibleCount((count) => (
                    Math.min(count + DEFAULT_LOCKED_BATCH, filteredLockedEntries.length)
                  ))}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold transition"
                  style={{
                    borderColor: 'var(--line)',
                    background: 'rgba(255,255,255,0.92)',
                    color: 'var(--ink-2)',
                  }}
                >
                  Xem thêm {Math.min(DEFAULT_LOCKED_BATCH, filteredLockedEntries.length - visibleLockedEntries.length)} mục
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Đã đạt ({filteredUnlockedEntries.length})
          </h3>
          {filteredUnlockedEntries.length > DEFAULT_UNLOCKED_BATCH ? (
            <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.85)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]">
              Đang hiện {visibleUnlockedEntries.length}/{filteredUnlockedEntries.length} mục để giữ danh sách gọn hơn.
            </span>
          ) : null}
          {filteredUnlockedEntries.length > 0 && filteredUnlockedEntries.length <= DEFAULT_UNLOCKED_BATCH ? (
            <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.85)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]">
              Sắp theo thời điểm gần nhất trước, vẫn giữ số thứ tự thật của từng dấu.
            </span>
          ) : null}
        </div>

        {filteredUnlockedEntries.length === 0 ? (
          <div
            className="border border-dashed border-[var(--line-2)] bg-[var(--card-bg-solid)] px-5 py-10 text-center text-sm text-[var(--muted)]"
            style={{ borderRadius: 'var(--skin-radius-card,18px)' }}
          >
            Bộ lọc hiện tại chưa có dấu nào đã đạt.
          </div>
        ) : (
          <>
            <AnimatePresence initial={false} mode="popLayout">
              <div className="grid gap-3">
                {visibleUnlockedEntries.map((entry, index) => (
                  <MotionDiv
                    key={entry.id}
                    layout
                    {...withDelay(enterMotion, Math.min(index, 5) * 0.02)}
                  >
                    <AchievementCard
                      entry={entry}
                      latestId={dataset.latestEntry?.id ?? null}
                    />
                  </MotionDiv>
                ))}
              </div>
            </AnimatePresence>

            {visibleUnlockedEntries.length < filteredUnlockedEntries.length ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setUnlockedVisibleCount((count) => (
                    Math.min(count + DEFAULT_UNLOCKED_BATCH, filteredUnlockedEntries.length)
                  ))}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold transition"
                  style={{
                    borderColor: 'var(--line)',
                    background: 'rgba(255,255,255,0.92)',
                    color: 'var(--ink-2)',
                  }}
                >
                  Xem thêm {Math.min(DEFAULT_UNLOCKED_BATCH, filteredUnlockedEntries.length - visibleUnlockedEntries.length)} mục đã đạt
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
