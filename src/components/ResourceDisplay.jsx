import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import {
  ERA_METADATA,
  ERA_THRESHOLDS,
  ERA_REFINED,
  normalizeRefinedBag,
} from '../engine/constants';

function getCurrentStage(eraMeta, totalEP) {
  if (!eraMeta?.stages?.length) return null;

  for (let index = eraMeta.stages.length - 1; index >= 0; index -= 1) {
    if (totalEP >= eraMeta.stages[index].epStart) {
      return {
        ...eraMeta.stages[index],
        index,
        totalStages: eraMeta.stages.length,
      };
    }
  }

  return {
    ...eraMeta.stages[0],
    index: 0,
    totalStages: eraMeta.stages.length,
  };
}

export default function ResourceDisplay() {
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const allResources = useGameStore((s) => s.resources);
  const totalEP = useGameStore((s) => s.progress.totalEP);
  const researchRP = useGameStore((s) => s.research?.rp ?? 0);
  const resourcesRefined = useGameStore((s) => s.resourcesRefined);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const reduceMotion = useReducedMotion();

  const lightTheme = uiTheme === 'light';
  const bookKey = `book${activeBook}`;
  const eraMeta = ERA_METADATA[activeBook] ?? ERA_METADATA[1];
  const stage = getCurrentStage(eraMeta, totalEP);
  const stageStart = stage?.epStart ?? 0;
  const stageEnd = stage?.epEnd ?? stageStart;
  const stageRange = Math.max(1, stageEnd - stageStart);
  const stageXP = Math.max(0, totalEP - stageStart);
  const stagePct = Math.max(0, Math.min(100, (stageXP / stageRange) * 100));
  const refined = ERA_REFINED[activeBook] ?? ERA_REFINED[1];
  const refinedBag = normalizeRefinedBag(resourcesRefined?.[activeBook]);
  const resourceEntries = (eraMeta.resources ?? []).map((def) => ({
    id: def.id,
    label: def.label,
    value: allResources[bookKey]?.[def.id] ?? 0,
  }));

  return (
    <section
      className="rounded-[18px] border px-4 py-4"
      style={{
        background: lightTheme ? 'rgba(255, 255, 255, 0.84)' : 'rgba(24, 21, 17, 0.9)',
        borderColor: lightTheme ? 'var(--line)' : 'rgba(148, 163, 184, 0.14)',
        boxShadow: lightTheme ? '0 10px 22px rgba(31, 30, 29, 0.04)' : '0 12px 28px rgba(0, 0, 0, 0.14)',
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Giai đoạn hiện tại
        </div>
        <span className="mono text-[11px] text-[var(--muted)]">
          Kỷ {activeBook}
        </span>
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="serif text-[22px] font-medium leading-tight tracking-[-0.02em] text-[var(--ink)]">
              {stage?.label ?? eraMeta.label}
            </div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">
              {stage
                ? `${eraMeta.label} · chặng ${stage.index + 1}/${stage.totalStages}`
                : eraMeta.label}
            </div>
          </div>
          <div className="text-right">
            <div className="mono text-[12px] font-semibold text-[var(--ink)]">
              {stageXP.toLocaleString()}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              / {stageRange.toLocaleString()} EP
            </div>
          </div>
        </div>

        <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-[var(--line)]">
          <motion.div
            className="h-full rounded-full"
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? undefined : { width: `${stagePct}%` }}
            transition={reduceMotion ? undefined : { duration: 0.45, ease: 'easeOut' }}
            style={{
              width: reduceMotion ? `${stagePct}%` : undefined,
              background: 'var(--ink)',
            }}
          />
        </div>
      </div>

      <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
        <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Tài nguyên trong kỷ
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
        {resourceEntries.map((entry) => (
          <ResourceTile key={entry.id} label={entry.label} value={entry.value.toLocaleString()} />
        ))}
        <ResourceTile label="RP" value={researchRP.toLocaleString()} accent />
        <ResourceTile label={refined.t2Label} value={refinedBag.t2.toLocaleString()} accent />
      </div>

      <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Khoảng EP của chặng
          </div>
          <div className="mono text-[11px] text-[var(--muted)]">
            {stageStart.toLocaleString()} → {stageEnd.toLocaleString()}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResourceTile({ accent = false, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="text-[11px] text-[var(--muted)]">{label}</div>
      <div className="mono mt-1 text-[16px] font-semibold" style={{ color: accent ? 'var(--accent)' : 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}
