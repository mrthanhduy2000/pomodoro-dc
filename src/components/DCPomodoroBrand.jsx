import React from 'react';

const BRAND = {
  bronze: '#8a6a3d',
  bronzeSoft: '#b69567',
  cream: '#f5f3ed',
  line: '#ddd9cc',
};

export function DCPomodoroMarkClockC({
  size = 28,
  color = 'var(--ink)',
  accent = BRAND.bronze,
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="1.2" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x1 = 50 + Math.cos(angle) * 42;
        const y1 = 50 + Math.sin(angle) * 42;
        const len = i % 3 === 0 ? 4 : 2;
        const x2 = 50 + Math.cos(angle) * (42 - len);
        const y2 = 50 + Math.sin(angle) * (42 - len);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={i % 3 === 0 ? 1 : 0.6}
          />
        );
      })}
      <path d="M 72 26 A 32 32 0 1 0 72 74" stroke={color} strokeWidth="6" fill="none" strokeLinecap="square" />
      <path d="M 50 14 q 2 -3 4 -1 M 50 14 q -2 -3 -4 -1" stroke={accent} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="50" r="1.4" fill={color} />
    </svg>
  );
}

export function DCPomodoroMarkJourneyArc({
  size = 28,
  color = 'var(--ink)',
  accent = BRAND.bronze,
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <line x1="10" y1="86" x2="110" y2="86" stroke={color} strokeWidth="1" />
      <circle cx="60" cy="56" r="22" stroke={color} strokeWidth="1.2" fill="none" />
      <path d="M 60 34 A 22 22 0 0 1 80.7 64.6" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="22" y1="86" x2="22" y2="74" stroke={color} strokeWidth="1.6" />
      <line x1="60" y1="86" x2="60" y2="78" stroke={color} strokeWidth="1.2" />
      <line x1="98" y1="86" x2="98" y2="68" stroke={color} strokeWidth="2" />
      <circle cx="22" cy="74" r="1" fill={color} />
      <circle cx="60" cy="78" r="1" fill={color} />
      <circle cx="98" cy="68" r="1" fill={accent} />
    </svg>
  );
}

export function DCPomodoroMarkSeal({
  size = 28,
  color = 'var(--ink)',
  accent = BRAND.bronze,
}) {
  const leaves = [];
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const angle = -110 + t * 120;
    const radius = 50;
    const cx = 60 + Math.cos(angle * Math.PI / 180) * radius;
    const cy = 60 + Math.sin(angle * Math.PI / 180) * radius;
    const rotation = angle + 90;
    leaves.push({ cx, cy, rotation });
  }

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="56" stroke={color} strokeWidth="0.8" />
      <circle cx="60" cy="60" r="51" stroke={color} strokeWidth="0.4" />
      {leaves.map((leaf, index) => (
        <g key={`left-${index}`} transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.rotation})`}>
          <path d="M 0 0 q -3 -2 -6 0 q 3 2 6 0 z" fill={color} />
        </g>
      ))}
      {leaves.map((leaf, index) => (
        <g key={`right-${index}`} transform={`translate(${120 - leaf.cx} ${leaf.cy}) scale(-1 1) rotate(${leaf.rotation})`}>
          <path d="M 0 0 q -3 -2 -6 0 q 3 2 6 0 z" fill={color} />
        </g>
      ))}
      <path d="M 50 102 q 10 5 20 0" stroke={color} strokeWidth="0.6" fill="none" />
      <circle cx="60" cy="104" r="1" fill={accent} />
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Source Serif 4', Georgia, serif"
        fontSize="56"
        fontWeight="500"
        fill={color}
        letterSpacing="-2"
      >
        C
      </text>
      <text
        x="60"
        y="89"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="6"
        fill={color}
        letterSpacing="3"
      >
        MMXXVI
      </text>
    </svg>
  );
}

export function DCPomodoroMarkStamp({
  size = 28,
  color = 'var(--ink)',
  accent = BRAND.bronze,
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="92" height="92" stroke={color} strokeWidth="1" fill="none" />
      <rect x="9" y="9" width="82" height="82" stroke={color} strokeWidth="0.4" fill="none" />
      <text
        x="50"
        y="73"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Source Serif 4', Georgia, serif"
        fontSize="78"
        fontWeight="500"
        fill={color}
        letterSpacing="-3"
      >
        C
      </text>
      <line x1="74" y1="22" x2="74" y2="32" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="74" cy="20" r="1.4" fill={accent} />
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="3.6"
        fill={color}
        letterSpacing="1.2"
      >
        DC POMODORO
      </text>
    </svg>
  );
}

export function DCPomodoroMarkAnalemma({
  size = 28,
  color = 'var(--ink)',
  accent = BRAND.bronze,
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path
        d="M 50 14 C 40 26 40 38 50 50 C 60 62 60 74 50 86 C 40 74 40 62 50 50 C 60 38 60 26 50 14 Z"
        stroke={color}
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="58" cy="42" r="2.4" fill={accent} />
      <line x1="20" y1="50" x2="80" y2="50" stroke={color} strokeWidth="0.5" strokeDasharray="1 2" />
      <circle cx="50" cy="14" r="0.9" fill={color} />
      <circle cx="50" cy="50" r="0.9" fill={color} />
      <circle cx="50" cy="86" r="0.9" fill={color} />
    </svg>
  );
}

export function DCPomodoroWordmark({
  color = 'var(--ink)',
  size = 1,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', 'Source Serif 4', Georgia, serif",
          fontWeight: 500,
          fontSize: `${18 * size}px`,
          letterSpacing: '-0.03em',
          lineHeight: 0.92,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        DC
        <span style={{ fontStyle: 'italic', fontWeight: 400 }}> Pomodoro</span>
      </div>
    </div>
  );
}

export function DCPomodoroWordmarkStacked({
  color = 'var(--ink)',
  size = 1,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: `${8 * size}px`,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color,
          opacity: 0.6,
        }}
      >
        EST · MMXXVI
      </div>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', 'Source Serif 4', Georgia, serif",
          fontWeight: 500,
          fontSize: `${64 * size}px`,
          letterSpacing: '-0.04em',
          color,
          lineHeight: 1,
          marginTop: `${6 * size}px`,
        }}
      >
        DC Pomodoro
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: `${10 * size}px`, marginTop: `${10 * size}px` }}>
        <span style={{ width: `${30 * size}px`, height: 1, background: color, opacity: 0.35 }} />
        <span
          style={{
            fontFamily: "'Cormorant Garamond', 'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            fontSize: `${14 * size}px`,
            color,
            letterSpacing: '0.01em',
          }}
        >
          a deep-work atelier
        </span>
        <span style={{ width: `${30 * size}px`, height: 1, background: color, opacity: 0.35 }} />
      </div>
    </div>
  );
}

export function DCPomodoroSidebarBrand({ isOpen }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pb-3 pr-3 pt-4">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-[10px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
        style={{
          borderColor: BRAND.line,
          background: BRAND.cream,
        }}
      >
        <DCPomodoroMarkStamp size={22} color="#1a1918" accent={BRAND.bronze} />
      </div>
      {isOpen && (
        <div className="shrink-0">
          <DCPomodoroWordmark size={1.12} />
        </div>
      )}
    </div>
  );
}
