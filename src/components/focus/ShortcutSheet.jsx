/**
 * ShortcutSheet.jsx — HOLD `?` AND THE KEYS APPEAR; LET GO AND THEY ARE GONE (round 64, ADR-100).
 *
 * ⚠️ WHY THIS EXISTS: ROUND 63 BROKE ITS OWN RULE AND ĐÀM CAUGHT IT IN THE SCREENSHOT.
 * Round 40's law — *"không thêm thứ đứng yên trên màn hình để quảng cáo phím tắt"* — was restated
 * verbatim in round 63's own brief, and round 63 then shipped a permanent line of text reading
 * *"SPACE BẮT ĐẦU · SHIFT TRÁI + F FULL SCREEN · SHIFT TRÁI + G THU/MỞ CỘT · 1–5 ĐỔI TAB"* in the
 * middle column. It was there every second of every session to teach four things Đàm learns once.
 *
 * ⚠️ THE FIX IS THE SAME SHAPE AS THE FEATURE. A shortcut is a thing you reach for with the
 * keyboard, so the way to ask about it is the keyboard: **hold `?`**. It appears while held and
 * vanishes on release — round 40's own definition of a reward rather than noise ("xảy ra rồi biến
 * mất"). Nothing occupies the screen when the question is not being asked.
 *
 * ⚠️ AND IT IS NOT THE ONLY PATH. The sidebar rows carry their number in a hover `title` (round 63),
 * so the tabs are discoverable by cursor alone; this sheet is the complete list for someone who
 * wants one. A phone sees neither and needs neither — it has no keyboard to describe.
 *
 * ⚠️ `?` IS SAFE TO TAKE. It is not a browser or macOS shortcut, it needs no modifier, and it is
 * the near-universal convention for "show me the keys". The handler still stands down inside a text
 * field (typing "?" into the session goal must stay a "?") and while any modifier is held.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { isEditableShortcutTarget } from '../../lib/keyboard';
import { useEnterMotion } from '../../lib/motionPresets';
import { CARD, EYEBROW } from '../shared/surface';
import { SHORTCUTS } from '../../lib/shortcuts';


export default function ShortcutSheet() {
  const [held, setHeld] = useState(false);
  const enterMotion = useEnterMotion();

  useEffect(() => {
    const isQuestion = (e) => e.key === '?' || (e.key === '/' && e.shiftKey);
    const down = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!isQuestion(e)) return;
      if (isEditableShortcutTarget(e.target)) return;
      e.preventDefault();
      setHeld(true);
    };
    // ⚠️ RELEASE ON `keyup` OF EITHER KEY. `?` is Shift+/, so letting go of Shift first turns the
    // event's `key` into `/` and a handler that only watched `?` would leave the sheet stuck open
    // with no way to dismiss it.
    const up = (e) => {
      if (e.key === '?' || e.key === '/' || e.key === 'Shift') setHeld(false);
    };
    // A lost window (⌘-Tab away while holding) never delivers the key-up.
    const blur = () => setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  return (
    <AnimatePresence>
      {held && (
        <motion.div
          {...enterMotion}
          // `pointer-events-none`: it answers a question, it never intercepts a click.
          className="pointer-events-none fixed inset-0 z-[60] hidden items-center justify-center md:flex"
          style={{ background: 'rgba(0,0,0,0.42)' }}
          aria-hidden="true"
        >
          <div className="w-[min(420px,88vw)] px-6 py-5" style={CARD}>
            <p className={EYEBROW} style={{ color: 'var(--muted)' }}>Phím tắt</p>
            <dl className="mt-3 flex flex-col gap-2.5">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} className="flex items-baseline justify-between gap-4">
                  <dt
                    className="mono shrink-0 rounded-[7px] px-2 py-1 text-[12px] font-semibold"
                    style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent2)' }}
                  >
                    {s.keys}
                  </dt>
                  <dd className="min-w-0 text-right text-[13px] leading-snug" style={{ color: 'var(--ink-2)' }}>
                    {s.what}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
