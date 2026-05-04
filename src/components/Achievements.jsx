import React, {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_TIERS,
} from '../engine/constants';
import { formatVietnamDateTime } from '../engine/time';
import useGameStore from '../store/gameStore';

const TIER_SEQUENCE = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const CATEGORY_KEYS = Object.keys(ACHIEVEMENT_CATEGORIES);
const DEFAULT_UNLOCKED_BATCH = 24;
const DEFAULT_LOCKED_BATCH = 24;
const VI_COLLATOR = new Intl.Collator('vi-VN');
const ACHIEVEMENT_LOOKUP = new Map(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));
const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';
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

function getLabelMark(label, fallback = 'TC') {
  return String(label ?? fallback)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || fallback;
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

function buildAiRemark(entry, totalUnlocked, latestId) {
  const categoryRemark = CATEGORY_REMARKS[entry.achievement.category] ?? CATEGORY_REMARKS.special;

  if (!entry.isUnlocked) {
    return `Mốc này còn ở phía trước. ${categoryRemark}`;
  }

  if (!entry.unlockedAt) {
    return `Save cũ không giữ lại giờ đạt cho mốc này, nên hệ thống chỉ giữ đúng vị trí tương đối. ${categoryRemark}`;
  }

  if (entry.timeSource === 'reconstructed') {
    return `Giờ đạt ở đây được suy từ nhật ký phiên cũ. ${categoryRemark}`;
  }

  if (entry.id === latestId) {
    return `Đây là cột mốc mới nhất trong tiến trình hiện tại. ${categoryRemark}`;
  }

  return `Đây là cột mốc thứ ${entry.order} trên tổng ${totalUnlocked} dấu đã đạt. ${categoryRemark}`;
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

function sortLockedEntries(left, right) {
  if (left.definitionIndex !== right.definitionIndex) {
    return left.definitionIndex - right.definitionIndex;
  }
  return VI_COLLATOR.compare(left.achievement.label, right.achievement.label);
}

function FilterChip({
  active,
  countLabel,
  icon,
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
          className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
          style={tone ? { backgroundColor: active ? withAlpha('#ffffff', 0.14) : withAlpha(tone, 0.12) } : undefined}
        >
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      <span
        className={[
          'rounded-full px-2 py-0.5 text-[10px] font-semibold',
          active ? 'bg-white/12 text-white/82' : 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]',
        ].join(' ')}
        style={{ fontFamily: MONO_FONT }}
      >
        {countLabel}
      </span>
    </button>
  );
}

function AchievementCard({
  entry,
  latestId,
  totalUnlocked,
}) {
  const tierInfo = ACHIEVEMENT_TIERS[entry.achievement.tier] ?? ACHIEVEMENT_TIERS.silver;
  const categoryInfo = ACHIEVEMENT_CATEGORIES[entry.achievement.category] ?? ACHIEVEMENT_CATEGORIES.special;
  const tierSurface = getTierSurface(entry.achievement.tier);
  const aiRemark = buildAiRemark(entry, totalUnlocked, latestId);
  const unlockLabel = formatUnlockLabel(entry.unlockedAt);
  const showOrder = entry.isUnlocked && clampOrder(entry.order);

  return (
    <div
      className={[
        'relative overflow-hidden rounded-[28px] border px-4 py-4 transition',
        entry.isUnlocked
          ? 'border-[var(--line)]'
          : 'border-[rgba(217,214,204,0.8)]',
      ].join(' ')}
      style={{
        background: entry.isUnlocked
          ? `rgba(255,255,255,0.97)`
          : 'rgba(248,247,243,0.94)',
        boxShadow: entry.isUnlocked
          ? '0 18px 44px rgba(31,30,29,0.06)'
          : '0 10px 24px rgba(31,30,29,0.035)',
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
            'mono flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border text-[10px] font-semibold uppercase tracking-[0.16em]',
            entry.isUnlocked ? 'bg-[rgba(255,255,255,0.88)] text-[var(--ink)]' : 'bg-[rgba(255,255,255,0.68)] text-[var(--muted-2)]',
          ].join(' ')}
          style={{
            borderColor: entry.isUnlocked ? withAlpha(tierSurface.line, 0.26) : 'rgba(217,214,204,0.92)',
            boxShadow: entry.isUnlocked ? `0 12px 28px ${withAlpha(tierSurface.line, 0.1)}` : 'inset 0 1px 0 rgba(255,255,255,0.72)',
            fontFamily: MONO_FONT,
          }}
        >
          {getLabelMark(entry.achievement.label, 'DG')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-[25px] font-medium leading-tight tracking-[-0.03em] text-[var(--ink)]"
              style={{ fontFamily: DISPLAY_FONT }}
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

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[var(--muted)]">
            {showOrder ? (
              <span
                className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.9)] px-3 py-1 text-[11px] text-[var(--ink-2)]"
                style={{ fontFamily: MONO_FONT }}
              >
                #{padOrder(entry.order)}
              </span>
            ) : null}

            <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-3 py-1">
              {entry.isUnlocked ? `Thời điểm đạt: ${unlockLabel}` : 'Trạng thái: chưa đạt'}
            </span>

            {entry.timeSource === 'reconstructed' ? (
              <span className="rounded-full border border-[rgba(131,155,176,0.22)] bg-[rgba(236,241,245,0.9)] px-3 py-1 text-[#5f7386]">
                Suy từ nhật ký
              </span>
            ) : null}
          </div>

          <div className="mt-3 rounded-[20px] border border-[var(--line)] bg-[rgba(244,242,236,0.76)] px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Ghi chú tiến trình
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">
              {aiRemark}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Achievements() {
  const unlockedIds = useGameStore((state) => state.achievements?.unlocked ?? []);
  const timeline = useGameStore((state) => state.achievements?.timeline ?? {});

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
  }, [timeline, unlockedIds]);

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
  const latestAchievement = dataset.latestEntry?.achievement;

  return (
    <div className="space-y-5 text-[var(--ink)]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
        <MotionSection
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: 'easeOut' }}
          className="overflow-hidden rounded-[30px] border p-6"
          style={{
            borderColor: 'var(--line)',
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 22px 60px rgba(31,30,29,0.08)',
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Lưu trữ thành tích
              </p>
              <h2
                className="mt-2 text-[40px] font-medium tracking-[-0.05em] text-[var(--ink)]"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                {dataset.totalUnlocked}/{dataset.totalAchievements} dấu đã đạt
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--ink-2)]">
                Mỗi dấu ghi lại một chặng tiến. Màn này giữ thứ tự đạt, thời điểm mở và một ghi chú ngắn để đọc lại tiến trình như một lưu trữ gọn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                Tiến độ tổng: {totalProgress}%
              </span>
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

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border p-4" style={{ borderColor: 'var(--line)', background: 'rgba(255,255,255,0.76)' }}>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Gần nhất
              </p>
              <p className="mt-2 text-[20px] font-medium text-[var(--ink)]" style={{ fontFamily: DISPLAY_FONT }}>
                {latestAchievement ? latestAchievement.label : 'Chưa có dấu nào'}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {dataset.latestEntry
                  ? formatUnlockLabel(dataset.latestEntry.unlockedAt)
                  : 'Bắt đầu bằng phiên tập trung đầu tiên.'}
              </p>
            </div>

            <div className="rounded-[20px] border p-4" style={{ borderColor: 'var(--line)', background: 'rgba(255,255,255,0.76)' }}>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Theo tier
              </p>
              <p className="mt-2 text-[20px] font-medium text-[var(--ink)]" style={{ fontFamily: DISPLAY_FONT }}>
                {TIER_SEQUENCE.map((tier) => dataset.tierStats[tier]?.unlocked ?? 0).join(' · ')}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Đồng · Bạc · Vàng · Bạch Kim · Kim Cương
              </p>
            </div>

            <div className="rounded-[20px] border p-4" style={{ borderColor: 'var(--line)', background: 'rgba(255,255,255,0.76)' }}>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Hiển thị
              </p>
              <p className="mt-2 text-[20px] font-medium text-[var(--ink)]" style={{ fontFamily: DISPLAY_FONT }}>
                {filteredUnlockedEntries.length} đã đạt / {filteredLockedEntries.length} chưa đạt
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Bộ lọc đang áp dụng trực tiếp lên cả hai danh sách bên dưới.
              </p>
            </div>
          </div>
        </MotionSection>

        <MotionAside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.04 }}
          className="rounded-[30px] border p-5"
          style={{
            borderColor: 'var(--line)',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 20px 52px rgba(31,30,29,0.07)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
                <p className="mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                  Dấu gần đây
                </p>
              <h3
                className="mt-2 text-[30px] font-medium tracking-[-0.04em] text-[var(--ink)]"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                Mới đạt gần đây
              </h3>
            </div>
            {dataset.latestEntry?.order ? (
              <span
                className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.85)] px-3 py-1 text-sm text-[var(--muted)]"
                style={{ fontFamily: MONO_FONT }}
              >
                #{padOrder(dataset.latestEntry.order)}
              </span>
            ) : null}
          </div>

          {latestThreeEntries.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--line-2)] bg-[rgba(255,255,255,0.72)] px-4 py-6 text-sm leading-6 text-[var(--muted)]">
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
                      <div className="mono mt-0.5 flex h-10 w-10 items-center justify-center rounded-[14px] border bg-[rgba(255,255,255,0.78)] text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: withAlpha(getTierSurface(entry.achievement.tier).line, 0.2), fontFamily: MONO_FONT }}>{getLabelMark(entry.achievement.label, 'DG')}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[16px] font-medium text-[var(--ink)]" style={{ fontFamily: DISPLAY_FONT }}>
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
        className="rounded-[28px] border p-5"
        style={{
          borderColor: 'var(--line)',
          background: 'rgba(255,255,255,0.82)',
          boxShadow: '0 20px 56px rgba(31,30,29,0.05)',
        }}
      >
        <div className="space-y-4">
          <div>
            <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Lọc theo tier
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterChip
                active={selectedTier === 'all'}
                countLabel={`${dataset.totalUnlocked}/${dataset.totalAchievements}`}
                    icon="TC"
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
                    icon={getLabelMark(tierInfo.label, 'TR')}
                    label={tierInfo.label}
                    onClick={() => handleTierChange(tier)}
                    tone={tierInfo.color}
                  />
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Lọc theo danh mục
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterChip
                active={selectedCategory === 'all'}
                countLabel={`${dataset.totalUnlocked}/${dataset.totalAchievements}`}
                icon="TC"
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
                    icon={getLabelMark(categoryInfo.label, 'DM')}
                    label={categoryInfo.label}
                    onClick={() => handleCategoryChange(categoryKey)}
                    tone={ACHIEVEMENT_TIERS[activeTierInfo ? deferredTier : 'silver']?.color ?? '#94a3b8'}
                  />
                );
              })}
            </div>
          </div>
        </div>
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
          <div className="rounded-[28px] border border-dashed border-[var(--line-2)] bg-[rgba(255,255,255,0.8)] px-5 py-10 text-center text-sm text-[var(--muted)]">
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
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut', delay: Math.min(index, 5) * 0.02 }}
                  >
                    <AchievementCard
                      entry={entry}
                      latestId={dataset.latestEntry?.id ?? null}
                      totalUnlocked={dataset.totalUnlocked}
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
          <div className="rounded-[28px] border border-dashed border-[var(--line-2)] bg-[rgba(255,255,255,0.8)] px-5 py-10 text-center text-sm text-[var(--muted)]">
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
                  totalUnlocked={dataset.totalUnlocked}
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
    </div>
  );
}
