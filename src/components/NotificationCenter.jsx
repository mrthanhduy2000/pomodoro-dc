import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import {
  BLUEPRINT_CATALOG,
  BLUEPRINT_META,
  BUILDING_EFFECTS,
  BUILDING_SPECS,
  CRAFT_QUEUE_SLOTS,
  SKILL_TREE,
  normalizeRawCost,
  normalizeRefinedBag,
  getUnifiedRefinedCost,
} from '../engine/constants';

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';

const ALL_SKILLS = Object.values(SKILL_TREE).flatMap((branch) =>
  branch.nodes.map((node) => ({
    ...node,
    branchLabel: branch.label,
  }))
);

const BLUEPRINT_LOOKUP = Object.fromEntries(
  Object.values(BLUEPRINT_CATALOG)
    .flat()
    .map((blueprint) => [blueprint.id, blueprint])
);

function Glyph({ size = 16, stroke = 1.7, children, fill = 'none' }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const CenterIcon = {
  bell: (props) => (
    <Glyph {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Glyph>
  ),
  spark: (props) => (
    <Glyph {...props}>
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </Glyph>
  ),
  chevron: (props) => (
    <Glyph {...props}>
      <path d="M9 6l6 6-6 6" />
    </Glyph>
  ),
  close: (props) => (
    <Glyph {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Glyph>
  ),
  skill: (props) => (
    <Glyph {...props}>
      <path d="M12 3v18" />
      <path d="M12 7c3 0 5-2 8-2" />
      <path d="M12 11c-3 0-5-2-8-2" />
      <path d="M12 15c3 0 5-2 8-2" />
    </Glyph>
  ),
  blueprint: (props) => (
    <Glyph {...props}>
      <path d="M5 5h14v14H5z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </Glyph>
  ),
  workshop: (props) => (
    <Glyph {...props}>
      <path d="M4 19h16" />
      <path d="M6 19V9l6-4 6 4v10" />
      <path d="M9 13h6" />
    </Glyph>
  ),
};

function describeSample(list = [], totalCount = 0) {
  const sample = list.filter(Boolean).slice(0, 3);
  if (sample.length === 0) return '';
  if (totalCount <= 3) return sample.join(' · ');
  return `${sample.slice(0, 2).join(' · ')} · +${totalCount - 2} mục`;
}

function compactBodyText(text = '', maxLength = 72) {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function formatRelativeTime(createdAt) {
  const diffMs = Math.max(0, Date.now() - (createdAt ?? 0));
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes <= 0) return 'vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function aggregateWonderEffects(buildings = []) {
  const effects = new Set();
  for (const bpId of buildings) {
    const effect = BUILDING_EFFECTS[bpId];
    if (effect?.type === 'wonder' && effect.wonderEffect) {
      effects.add(effect.wonderEffect);
    }
  }
  return effects;
}

function getEffectiveResearchCost(buildings = [], bpId, baseCost) {
  const wonderEffects = aggregateWonderEffects(buildings);
  const meta = BLUEPRINT_META[bpId];
  let cost = Math.max(0, Math.round(baseCost ?? 0));

  if (meta && wonderEffects.has('t2_research_25off') && meta.era >= 6 && meta.era <= 10) {
    cost = Math.round(cost * 0.75);
  }

  return Math.max(1, cost);
}

function getActionLabel(action) {
  if (action?.tab === 'skills') return 'Kỹ năng';
  if (action?.tab === 'collection' && action?.collectionTab === 'blueprints') return 'Bản vẽ';
  if (action?.tab === 'collection' && action?.collectionTab === 'workshop') return 'Xưởng';
  if (action?.tab === 'focus') return 'Trung tâm';
  return 'Mở';
}

export default function NotificationCenter({ onNavigate }) {
  const isOpen = useGameStore((state) => state.ui.notificationCenterOpen);
  const notificationFeed = useGameStore((state) => state.ui.notificationFeed);
  const setNotificationCenterOpen = useGameStore((state) => state.setNotificationCenterOpen);
  const dismissUiNotification = useGameStore((state) => state.dismissUiNotification);
  const clearUiNotifications = useGameStore((state) => state.clearUiNotifications);

  const sp = useGameStore((state) => state.player.sp);
  const unlockedSkills = useGameStore((state) => state.player.unlockedSkills);
  const activeBook = useGameStore((state) => state.progress.activeBook);
  const research = useGameStore((state) => state.research);
  const blueprints = useGameStore((state) => state.blueprints);
  const buildings = useGameStore((state) => state.buildings);
  const resources = useGameStore((state) => state.resources);
  const resourcesRefined = useGameStore((state) => state.resourcesRefined);
  const craftingQueue = useGameStore((state) => state.craftingQueue);

  const rootRef = useRef(null);
  const popupTimersRef = useRef(new Map());
  const seenFeedIdsRef = useRef(new Set());
  const prevOpportunityCountsRef = useRef({});
  const initializedFeedRef = useRef(false);
  const initializedOpportunityRef = useRef(false);
  const [popupItems, setPopupItems] = useState([]);

  const availableSkills = useMemo(() => (
    ALL_SKILLS.filter((skill) => {
      if (unlockedSkills[skill.id]) return false;
      if (sp < skill.spCost) return false;
      return skill.requires.every((requirement) => unlockedSkills[requirement]);
    })
  ), [sp, unlockedSkills]);

  const researchableBlueprints = useMemo(() => {
    const ownedIds = new Set((blueprints ?? []).map((item) => item.id));
    const researchedIds = new Set(research?.researched ?? []);
    const builtIds = new Set(buildings ?? []);

    return Object.entries(BLUEPRINT_META)
      .filter(([bpId, meta]) => {
        if ((activeBook ?? 1) < (meta.requiresEra ?? 1)) return false;
        if (ownedIds.has(bpId) || researchedIds.has(bpId) || builtIds.has(bpId)) return false;
        const cost = getEffectiveResearchCost(buildings, bpId, meta.rpCost);
        return (research?.rp ?? 0) >= cost;
      })
      .map(([bpId]) => BLUEPRINT_LOOKUP[bpId])
      .filter(Boolean);
  }, [activeBook, blueprints, buildings, research]);

  const buildableBlueprints = useMemo(() => {
    if ((craftingQueue?.length ?? 0) >= CRAFT_QUEUE_SLOTS) return [];

    const ownedIds = new Set((blueprints ?? []).map((item) => item.id));
    const researchedIds = new Set(research?.researched ?? []);
    const builtIds = new Set(buildings ?? []);
    const queuedIds = new Set((craftingQueue ?? []).map((item) => item.bpId));

    return Object.entries(BLUEPRINT_META)
      .filter(([bpId, meta]) => {
        const spec = BUILDING_SPECS[bpId];
        if (!spec) return false;
        if (!(ownedIds.has(bpId) || researchedIds.has(bpId))) return false;
        if (builtIds.has(bpId) || queuedIds.has(bpId)) return false;

        const bookBag = resources?.[`book${meta.era}`] ?? {};
        const rawCost = normalizeRawCost(spec.cost ?? {});
        const hasRaw = Object.entries(rawCost).every(([resourceId, amount]) => (bookBag[resourceId] ?? 0) >= amount);

        if (!hasRaw) return false;

        const refined = normalizeRefinedBag(resourcesRefined?.[meta.era]);
        const refinedCost = getUnifiedRefinedCost(spec.refinedCost);
        return refined.t2 >= refinedCost;
      })
      .map(([bpId]) => BLUEPRINT_LOOKUP[bpId])
      .filter(Boolean);
  }, [blueprints, buildings, craftingQueue, research, resources, resourcesRefined]);

  const opportunities = useMemo(() => {
    const nextItems = [];

    if (availableSkills.length > 0) {
      nextItems.push({
        id: 'skills',
        count: availableSkills.length,
        Icon: CenterIcon.skill,
        title: `${availableSkills.length} kỹ năng sẵn sàng`,
        body: describeSample(availableSkills.map((skill) => skill.label), availableSkills.length),
        action: { tab: 'skills' },
      });
    }

    if (researchableBlueprints.length > 0) {
      nextItems.push({
        id: 'blueprints',
        count: researchableBlueprints.length,
        Icon: CenterIcon.blueprint,
        title: `${researchableBlueprints.length} bản vẽ sẵn sàng`,
        body: describeSample(researchableBlueprints.map((blueprint) => blueprint.label), researchableBlueprints.length),
        action: { tab: 'collection', collectionTab: 'blueprints' },
      });
    }

    if (buildableBlueprints.length > 0) {
      nextItems.push({
        id: 'workshop',
        count: buildableBlueprints.length,
        Icon: CenterIcon.workshop,
        title: `${buildableBlueprints.length} công trình sẵn sàng`,
        body: describeSample(buildableBlueprints.map((blueprint) => blueprint.label), buildableBlueprints.length),
        action: { tab: 'collection', collectionTab: 'workshop' },
      });
    }

    return nextItems;
  }, [availableSkills, researchableBlueprints, buildableBlueprints]);

  const unreadCount = notificationFeed.reduce((count, item) => (
    item.readAt ? count : count + 1
  ), 0);
  const badgeCount = Math.min(99, unreadCount + opportunities.length);

  const removePopup = useCallback((popupId) => {
    const timeoutId = popupTimersRef.current.get(popupId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      popupTimersRef.current.delete(popupId);
    }
    setPopupItems((current) => current.filter((item) => item.id !== popupId));
  }, []);

  const removePopupScope = useCallback((scope) => {
    setPopupItems((current) => {
      current
        .filter((item) => item.scope === scope)
        .forEach((item) => {
          const timeoutId = popupTimersRef.current.get(item.id);
          if (timeoutId) {
            window.clearTimeout(timeoutId);
            popupTimersRef.current.delete(item.id);
          }
        });
      return current.filter((item) => item.scope !== scope);
    });
  }, []);

  const queuePopup = useCallback((popup) => {
    if (!popup?.title || isOpen) return;

    const popupId = popup.id ?? `popup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nextPopup = { ...popup, id: popupId };

    setPopupItems((current) => [
      nextPopup,
      ...current.filter((item) => item.id !== popupId && item.scope !== popup.scope),
    ].slice(0, 4));

    const existingTimeout = popupTimersRef.current.get(popupId);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    const timeoutId = window.setTimeout(() => removePopup(popupId), 6200);
    popupTimersRef.current.set(popupId, timeoutId);
  }, [isOpen, removePopup]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setNotificationCenterOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotificationCenterOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setNotificationCenterOpen]);

  useEffect(() => {
    const nextCounts = Object.fromEntries(opportunities.map((item) => [item.id, item.count]));

    if (!initializedOpportunityRef.current) {
      prevOpportunityCountsRef.current = nextCounts;
      initializedOpportunityRef.current = true;
      return;
    }

    opportunities.forEach((item) => {
      const previousCount = prevOpportunityCountsRef.current[item.id] ?? 0;
      if (item.count > previousCount) {
        queuePopup({
          id: `opportunity_${item.id}_${Date.now()}`,
          scope: `opportunity_${item.id}`,
          icon: item.id === 'skills' ? '↑' : item.id === 'blueprints' ? 'BP' : 'XS',
          title: item.title,
          body: item.body,
          action: item.action,
        });
      }
    });

    ['skills', 'blueprints', 'workshop'].forEach((scopeId) => {
      if ((nextCounts[scopeId] ?? 0) === 0) {
        removePopupScope(`opportunity_${scopeId}`);
      }
    });

    prevOpportunityCountsRef.current = nextCounts;
  }, [opportunities, queuePopup, removePopupScope]);

  useEffect(() => {
    const currentIds = new Set(notificationFeed.map((item) => item.id));

    if (!initializedFeedRef.current) {
      seenFeedIdsRef.current = currentIds;
      initializedFeedRef.current = true;
      return;
    }

    notificationFeed.forEach((item) => {
      if (!seenFeedIdsRef.current.has(item.id)) {
        queuePopup({
          id: `feed_${item.id}`,
          scope: `feed_${item.id}`,
          sourceId: item.id,
          icon: item.icon ?? '✦',
          title: item.title,
          body: item.body,
          action: item.action,
        });
      }
    });

    seenFeedIdsRef.current = currentIds;
  }, [notificationFeed, queuePopup]);

  useEffect(() => () => {
    popupTimersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    popupTimersRef.current.clear();
  }, []);

  return (
    <div ref={rootRef} className="relative z-[75] flex items-center justify-end">
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              popupTimersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
              popupTimersRef.current.clear();
              setPopupItems([]);
            }
            setNotificationCenterOpen();
          }}
          className="group relative flex h-[48px] min-w-[54px] items-center justify-center rounded-[18px] border px-3.5 shadow-[0_8px_18px_rgba(31,30,29,0.08)] transition-transform hover:-translate-y-[1px] md:h-[42px] md:min-w-[46px] md:rounded-[16px] md:px-3"
          style={{
            borderColor: 'var(--line)',
            background: 'var(--panel)',
            color: 'var(--ink)',
            boxShadow: '0 8px 16px rgba(31,30,29,0.03)',
          }}
          aria-expanded={isOpen}
          aria-label="Mở trung tâm thông báo"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[11px] border md:h-7 md:w-7 md:rounded-[10px]"
            style={{
              borderColor: 'rgba(var(--accent-rgb),0.18)',
              background: 'rgba(var(--accent-rgb),0.08)',
              color: 'var(--accent2)',
            }}
          >
              <CenterIcon.bell size={14} />
            </span>

          {badgeCount > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-semibold"
              style={{
                background: 'var(--ink)',
                color: 'var(--canvas)',
                fontFamily: MONO_FONT,
              }}
            >
              {badgeCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto absolute right-0 top-[calc(100%+10px)] w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border"
            style={{
              maxHeight: 'min(64vh, 640px)',
              borderColor: 'var(--line)',
              background: 'var(--panel-strong)',
              boxShadow: '0 20px 48px rgba(31,30,29,0.14)',
              backdropFilter: 'blur(18px)',
            }}
          >
            <div className="border-b px-4 pb-3 pt-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                  >
                    Trung tâm
                  </div>
                  <h2
                    className="mt-1.5 text-[24px] font-medium leading-none tracking-[-0.03em]"
                    style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}
                  >
                    Thông báo
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {notificationFeed.length > 0 && (
                    <button
                      type="button"
                      onClick={clearUiNotifications}
                      className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: 'var(--line)',
                        color: 'var(--muted)',
                        background: 'var(--item-bg)',
                        fontFamily: MONO_FONT,
                      }}
                    >
                      Xóa hết
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setNotificationCenterOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border"
                    style={{
                      borderColor: 'var(--line)',
                      color: 'var(--muted)',
                      background: 'var(--item-bg)',
                    }}
                    aria-label="Đóng trung tâm thông báo"
                  >
                    <CenterIcon.close size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto px-3.5 pb-3.5 pt-3.5">
              <section>
                <div className="mb-2.5 flex items-center gap-2">
                  <CenterIcon.spark size={13} />
                  <span
                    className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                  >
                    Có thể làm ngay
                  </span>
                </div>

                {opportunities.length > 0 ? (
                  <div className="space-y-3">
                    {opportunities.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigate?.(item.action);
                          setNotificationCenterOpen(false);
                        }}
                        className="flex w-full items-start gap-2.5 rounded-[18px] border px-3.5 py-3 text-left transition-transform hover:-translate-y-[1px]"
                        style={{
                          borderColor: 'rgba(var(--accent-rgb),0.14)',
                          background: 'var(--panel)',
                          boxShadow: '0 8px 18px rgba(31,30,29,0.05)',
                        }}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border"
                          style={{
                            borderColor: 'rgba(var(--accent-rgb),0.18)',
                            background: 'rgba(var(--accent-rgb),0.08)',
                            color: 'var(--accent2)',
                          }}
                        >
                          <item.Icon size={16} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                            style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                          >
                            {item.count} mục
                          </span>
                          <span className="mt-1 block text-[16px] font-medium leading-tight" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
                            {item.title}
                          </span>
                          <span className="mt-1.5 block text-[12px] leading-[1.45]" style={{ color: 'var(--muted)' }}>
                            {compactBodyText(item.body, 44)}
                          </span>
                        </span>

                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]"
                          style={{
                            borderColor: 'var(--line)',
                            color: 'var(--ink)',
                            background: 'var(--item-bg-solid)',
                            fontFamily: MONO_FONT,
                          }}
                        >
                          Mở
                          <CenterIcon.chevron size={11} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    className="rounded-[18px] border px-3.5 py-4"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'var(--panel)',
                    }}
                  >
                    <p className="text-[12px] leading-[1.55]" style={{ color: 'var(--muted)' }}>
                      Chưa có mục nào sẵn sàng ngay.
                    </p>
                  </div>
                )}
              </section>

              <section className="mt-5">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CenterIcon.bell size={13} />
                    <span
                      className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                    >
                      Gần đây
                    </span>
                  </div>

                  {unreadCount > 0 && (
                    <span
                      className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: 'rgba(var(--accent-rgb),0.16)',
                        background: 'rgba(var(--accent-rgb),0.08)',
                        color: 'var(--accent2)',
                        fontFamily: MONO_FONT,
                      }}
                    >
                      {unreadCount} mới
                    </span>
                  )}
                </div>

                {notificationFeed.length > 0 ? (
                  <div className="space-y-3">
                    {notificationFeed.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[18px] border px-3.5 py-3"
                        style={{
                          borderColor: item.readAt ? 'var(--line)' : 'rgba(var(--accent-rgb),0.14)',
                          background: item.readAt ? 'var(--panel)' : 'var(--panel-strong)',
                          boxShadow: item.readAt ? 'none' : '0 8px 18px rgba(31,30,29,0.04)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border text-[16px]"
                            style={{
                              borderColor: 'rgba(var(--accent-rgb),0.14)',
                              background: 'rgba(var(--accent-rgb),0.08)',
                              color: 'var(--accent2)',
                            }}
                          >
                            {item.icon}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div
                                className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                                style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                              >
                                {item.category}
                              </div>
                              <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                                {formatRelativeTime(item.createdAt)}
                              </div>
                            </div>

                            <div className="mt-1 text-[16px] font-medium leading-tight" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
                              {item.title}
                            </div>
                            <div className="mt-1 text-[12px] leading-[1.45]" style={{ color: 'var(--muted)' }}>
                              {compactBodyText(item.body, 68)}
                            </div>

                            {item.action && (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigate?.(item.action);
                                  setNotificationCenterOpen(false);
                                }}
                                className="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]"
                                style={{
                                  borderColor: 'var(--line)',
                                  color: 'var(--ink)',
                                  background: 'var(--item-bg-solid)',
                                  fontFamily: MONO_FONT,
                                }}
                              >
                                Mở
                                <CenterIcon.chevron size={11} />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => dismissUiNotification(item.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                            style={{
                              borderColor: 'var(--line)',
                              color: 'var(--muted)',
                              background: 'var(--item-bg)',
                            }}
                            aria-label={`Xóa thông báo ${item.title}`}
                          >
                            <CenterIcon.close size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="rounded-[18px] border px-3.5 py-4"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'var(--panel)',
                    }}
                  >
                    <p className="text-[12px] leading-[1.55]" style={{ color: 'var(--muted)' }}>
                      Chưa có thông báo mới.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div
        className="absolute right-0 top-[calc(100%+10px)] flex w-[min(280px,calc(100vw-2rem))] flex-col gap-2.5"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {popupItems.map((popup) => (
            <motion.div
              key={popup.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pointer-events-auto overflow-hidden rounded-[18px] border"
              style={{
                borderColor: 'rgba(var(--accent-rgb),0.16)',
                background: 'var(--panel-strong)',
                boxShadow: '0 14px 30px rgba(31,30,29,0.12)',
                backdropFilter: 'blur(18px)',
              }}
            >
              <div className="flex items-start gap-2.5 px-3.5 py-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border text-[13px] font-semibold uppercase"
                  style={{
                    borderColor: 'rgba(var(--accent-rgb),0.16)',
                    background: 'rgba(var(--accent-rgb),0.08)',
                    color: 'var(--accent2)',
                    fontFamily: MONO_FONT,
                  }}
                >
                  {popup.icon}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (popup.action) {
                      onNavigate?.(popup.action);
                      setNotificationCenterOpen(false);
                    }
                    removePopup(popup.id);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div
                    className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: 'var(--muted)', fontFamily: MONO_FONT }}
                  >
                    Mới
                  </div>
                  <div className="mt-1 text-[16px] font-medium leading-tight" style={{ color: 'var(--ink)', fontFamily: DISPLAY_FONT }}>
                    {popup.title}
                  </div>
                  <div className="mt-1 text-[12px] leading-[1.45]" style={{ color: 'var(--muted)' }}>
                    {compactBodyText(popup.body, 52)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => removePopup(popup.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: 'var(--line)',
                    color: 'var(--muted)',
                    background: 'var(--item-bg)',
                  }}
                  aria-label={`Đóng thông báo ${popup.title}`}
                >
                  <CenterIcon.close size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
