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
      className="px-5 py-5"
      style={{
        background: 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width, 1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card, 18px)',
        boxShadow: lightTheme
          ? 'var(--skin-card-shadow, 0 10px 22px rgba(31, 30, 29, 0.04))'
          : 'var(--skin-card-shadow, 0 12px 28px rgba(0, 0, 0, 0.14))',
      }}
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
            Giai đoạn hiện tại
          </div>
          <div
            className="mt-1.5 text-[23px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ink)]"
            style={{ fontFamily: 'var(--skin-font-display)' }}
          >
            {stage?.label ?? eraMeta.label}
          </div>
          <div className="mt-1 text-[12px] text-[var(--muted)]">
            {stage
              ? `${eraMeta.label} · chặng ${stage.index + 1}/${stage.totalStages}`
              : eraMeta.label}
          </div>
        </div>
        <span
          className="mono shrink-0 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
          style={{
            color: 'var(--accent2)',
            background: 'rgba(var(--accent-rgb), 0.1)',
            borderRadius: 'var(--skin-radius-control, 14px)',
          }}
        >
          Kỷ {activeBook}
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Tiến độ chặng
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="mono text-[15px] font-semibold tabular-nums text-[var(--ink)]">
              {stageXP.toLocaleString()}
            </span>
            <span className="mono text-[11px] uppercase tabular-nums text-[var(--muted)]">
              / {stageRange.toLocaleString()} EP
            </span>
          </div>
        </div>

        <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[var(--line)]">
          <motion.div
            className="h-full rounded-full"
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? undefined : { width: `${stagePct}%` }}
            transition={reduceMotion ? undefined : { duration: 0.45, ease: 'easeOut' }}
            style={{
              width: reduceMotion ? `${stagePct}%` : undefined,
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
            }}
          />
        </div>
      </div>

      <div className="mt-5 border-t pt-3.5" style={{ borderColor: 'var(--line)' }}>
        <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
          Tài nguyên trong kỷ
        </div>
      </div>

      <div className="mt-0.5 divide-y" style={{ borderColor: 'var(--line)' }}>
        {resourceEntries.map((entry) => (
          <ResourceTile key={entry.id} label={entry.label} value={entry.value.toLocaleString()} />
        ))}
        <ResourceTile label="RP" value={researchRP.toLocaleString()} accent />
        <ResourceTile label={refined.t2Label} value={refinedBag.t2.toLocaleString()} accent />
      </div>

      <div className="mt-4 border-t pt-3.5" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted-2)]">
            Khoảng EP của chặng
          </div>
          <div className="mono text-[11px] tabular-nums text-[var(--muted)]">
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
      <div className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</div>
      {accent ? (
        <span
          className="mono px-2 py-0.5 text-[15px] font-semibold tabular-nums"
          style={{
            color: 'var(--accent2)',
            background: 'rgba(var(--accent-rgb), 0.1)',
            borderRadius: 'var(--skin-radius-control, 14px)',
          }}
        >
          {value}
        </span>
      ) : (
        <div className="mono text-[16px] font-semibold tabular-nums text-[var(--ink)]">
          {value}
        </div>
      )}
    </div>
  );
}
