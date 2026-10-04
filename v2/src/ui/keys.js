/**
 * keys.js — the one keyboard shortcut of v2: Space starts, pauses and resumes a focus (laptop
 * first, v2/DESIGN.md law 6). Discovery is the button's `title`, never a static hint on screen
 * (v1 round 40/64 law). Kept to one key on purpose: every extra shortcut is one more thing to learn.
 */
import { useEffect, useRef } from 'react';

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY']);

/**
 * A bare Space meant for the app — not typed into a field, not pressed on a focused control
 * (the browser already "clicks" that one, so acting too would fire twice), no modifier, no repeat.
 */
export function isAppSpace(e) {
  if (e.code !== 'Space' && e.key !== ' ') return false;
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
  const t = e.target;
  if (t && (TYPING.has(t.tagName) || t.isContentEditable)) return false;
  return true;
}

/** Run `handler` on an app Space while mounted. The latest handler is always the one called. */
export function useSpaceKey(handler) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);
  useEffect(() => {
    const onKey = (e) => {
      if (!isAppSpace(e)) return;
      e.preventDefault(); // or the page scrolls
      ref.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
