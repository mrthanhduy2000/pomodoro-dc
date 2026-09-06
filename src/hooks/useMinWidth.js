/** `matchMedia(min-width)` as a hook (moved from PomodoroEngine.jsx, ADR-076). */
import { useEffect, useState } from 'react';

export default function useMinWidth(minWidth) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = (event) => setMatches(event.matches);

    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [minWidth]);

  return matches;
}
