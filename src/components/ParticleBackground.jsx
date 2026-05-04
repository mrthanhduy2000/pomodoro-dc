/**
 * ParticleBackground.jsx — Hạt bụi sáng nổi lơ lửng (pure CSS, zero dependency)
 * Keyframes được inject 1 lần vào <head>, các hạt dùng CSS custom properties
 * để mỗi hạt có quỹ đạo riêng mà không cần nhiều @keyframes.
 */
import React, { useEffect, useMemo } from 'react';
import { PARTICLE_STYLE_ID } from '../lib/appIdentity';

// ─── Seed-based pseudo-random (deterministic — tránh layout shift khi HMR) ───
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const STYLE_ID = PARTICLE_STYLE_ID;

const GLOBAL_CSS = `
@keyframes cj-particle {
  0%   { transform: translate(0, 0) scale(1);    opacity: var(--p-op); }
  30%  { transform: translate(calc(var(--p-dx) * .6), calc(var(--p-dy) * .4)) scale(1.1); }
  60%  { transform: translate(var(--p-dx), var(--p-dy)) scale(.85);
         opacity: calc(var(--p-op) * .35); }
  100% { transform: translate(0, 0) scale(1);    opacity: var(--p-op); }
}
`;

function injectCSS() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ─── Config ──────────────────────────────────────────────────────────────────
const COLORS = [
  '99,102,241',   // indigo
  '139,92,246',   // violet
  '56,189,248',   // sky
  '168,85,247',   // purple
  '255,255,255',  // white
];

export default function ParticleBackground() {
  useEffect(() => { injectCSS(); }, []);

  const particles = useMemo(() => {
    const r = seeded(137);
    return Array.from({ length: 28 }, (_, i) => {
      const size    = r() * 2.6 + 0.5;
      const color   = COLORS[Math.floor(r() * COLORS.length)];
      const opacity = r() * 0.25 + 0.06;
      const dur     = r() * 20 + 12;           // 12–32s
      const delay   = -(r() * 30);             // staggered start
      const dx      = (r() - 0.5) * 80;        // horizontal drift px
      const dy      = -(r() * 55 + 15);        // rise px (always upward)
      const glow    = size > 1.8
        ? `0 0 ${Math.round(size * 5)}px rgba(${color},${(opacity * .7).toFixed(2)})`
        : 'none';
      return { id: i, x: r() * 100, y: r() * 100, size, color, opacity, dur, delay, dx, dy, glow };
    });
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left:      `${p.x}%`,
            top:       `${p.y}%`,
            width:     `${p.size}px`,
            height:    `${p.size}px`,
            background: `rgba(${p.color},${p.opacity})`,
            boxShadow:  p.glow,
            animationName:           'cj-particle',
            animationDuration:       `${p.dur}s`,
            animationDelay:          `${p.delay}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            '--p-dx': `${p.dx}px`,
            '--p-dy': `${p.dy}px`,
            '--p-op': p.opacity,
          }}
        />
      ))}
    </div>
  );
}
