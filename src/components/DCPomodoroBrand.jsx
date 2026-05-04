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
