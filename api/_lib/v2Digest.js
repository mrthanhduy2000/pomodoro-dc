/**
 * _lib/v2Digest.js — the v2 "come back" push, PURE (plan stage 4, ADR-102). No Supabase, no push:
 * given the v2 event log and a moment, decide the ONE message worth sending today, or none.
 *
 * It reuses the v2 engine itself (timer reducer + city), so the server and the app can never
 * disagree about which building is unfinished or whether a welcome-back bonus is waiting.
 * Under `_lib`, so Vercel does not count it as a function.
 */
import { reduce } from '../../v2/src/engine/timer.js';
import { buildCity } from '../../v2/src/engine/city.js';
import { currentStreak, todaySummary } from '../../v2/src/engine/stats.js';

const base = (title, body, tag) => ({
  title, body, tag, icon: '/icon-192.png', badge: '/icon-192.png', url: '/v2/', app: 'v2',
});

/**
 * Priority (first match wins — at most one push a day, plan stage 4):
 * 1. welcome back — absent ≥ 2 days: the double brick is the reason to return, name the building;
 * 2. an unfinished building close to done and nothing done today;
 * 3. worked today and one or two sessions from a full day (the lantern);
 * 4. a streak that breaks tonight;
 * otherwise silence. Never nag someone who already reached today's goal.
 */
export function pickV2Nudge(events, now) {
  const state = reduce(events, now);
  const city = buildCity(events, state, now);
  if (!city.totalBricks) return null; // never used the game: nothing to come back to
  const today = todaySummary(state, now);
  const goal = city.goalToday;
  const b = city.current;
  const left = b ? b.size - b.bricks.length : 0;

  if (city.welcomeBack) {
    const where = b ? `«${b.name}» còn ${left} tầng nữa là xong.` : 'Chọn công trình kế tiếp và đặt viên gạch đầu tiên.';
    return { reason: 'welcome-back', payload: base('🏙️ Thành phố đang chờ', `Phiên đầu tiên hôm nay được nhân đôi gạch. ${where}`, 'dc-v2-welcome') };
  }
  if (today.count === 0 && b && left <= 3) {
    return { reason: 'unfinished', payload: base(`🧱 «${b.name}» còn ${left} viên`, `${left} phiên nữa là xong ${b.size} tầng. Một phiên tối nay?`, 'dc-v2-unfinished') };
  }
  if (today.count > 0 && today.count < goal && goal - today.count <= 2) {
    const n = goal - today.count;
    return { reason: 'full-day', payload: base('🏮 Sắp thành ngày trọn', `Còn ${n} phiên nữa là đèn lồng hôm nay sáng suốt đêm.`, 'dc-v2-full-day') };
  }
  const streak = currentStreak(state, now);
  if (today.count === 0 && streak >= 2) {
    return { reason: 'streak', payload: base(`🔥 Chuỗi ${streak} ngày`, 'Hôm nay chưa có phiên nào — một phiên là giữ được chuỗi.', 'dc-v2-streak') };
  }
  return null;
}
