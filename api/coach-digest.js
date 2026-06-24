/**
 * api/coach-digest.js — CRON "cảnh báo chuỗi sắp đứt" (Coach CHỦ ĐỘNG lúc người dùng VẮNG).
 * Mỗi ngày (chiều-tối VN, đặt lịch ở vercel.json) đọc game_state từ Supabase; nếu chuỗi đang
 * treo (còn chuỗi nhưng HÔM NAY chưa làm phiên nào) → đẩy 1 thông báo nhắc giữ chuỗi (kèm "buổi
 * hay làm" nếu rõ). Tái dùng hạ tầng push (getAdminClient/subscriptions/send). Bảo vệ bằng
 * CRON_SECRET (Vercel Cron tự gửi `Authorization: Bearer <CRON_SECRET>`). Thiếu env → lỗi nhẹ.
 */
import { methodNotAllowed, sendJson } from './_lib/http.js';
import {
  getAdminClient, listActivePushSubscriptions, sendPushNotification,
  isExpiredPushSubscriptionError, disablePushSubscription,
} from './_lib/push.js';
import { evaluateStreakRisk, pickActiveBucketLabel, buildStreakNudgePayload } from './_lib/coachDigest.js';
import { getVietnamHour, vietnamDayNumber } from '../src/engine/time.js';

const SYNC_ID = 'singleton';

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // chưa đặt secret → cho qua (giống dispatch.js)
  return (req.headers.authorization ?? '') === `Bearer ${secret}`;
}

async function readGameState() {
  const admin = getAdminClient();
  const { data, error } = await admin.from('game_state').select('data').eq('id', SYNC_ID).maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}

async function sendToAll(payload) {
  const subs = await listActivePushSubscriptions();
  let delivered = 0;
  for (const row of subs) {
    try {
      await sendPushNotification(row.subscription, payload);
      delivered += 1;
    } catch (err) {
      if (isExpiredPushSubscriptionError(err)) { await disablePushSubscription({ endpoint: row.endpoint }); continue; }
      // lỗi tạm của 1 sub → bỏ qua, tiếp tục các sub khác (không để 1 sub hỏng chặn cả lượt)
    }
  }
  return { subscribers: subs.length, delivered };
}

async function runDigest() {
  const state = await readGameState();
  if (!state) return { ran: true, atRisk: false, reason: 'no-state' };
  const history = state.history;
  const currentStreak = state.streak?.currentStreak ?? 0;
  const risk = evaluateStreakRisk({
    history,
    currentStreak,
    nowDayNumber: vietnamDayNumber(),
    getEntryDayNumber: (e) => vietnamDayNumber(new Date(e?.timestamp ?? e?.finishedAt ?? 0)),
  });
  if (!risk.atRisk) return { ran: true, atRisk: false, streak: risk.streak, hasToday: risk.hasToday };
  const activeBucketLabel = pickActiveBucketLabel({
    history,
    getEntryHour: (e) => getVietnamHour(new Date(e?.timestamp ?? 0)),
  });
  const payload = buildStreakNudgePayload({ streak: risk.streak, activeBucketLabel });
  const sent = await sendToAll(payload);
  return { ran: true, atRisk: true, streak: risk.streak, ...sent };
}

export default async function handler(req, res) {
  // Vercel Cron gửi GET (kèm Bearer CRON_SECRET); cũng cho POST (gọi tay).
  if (req.method !== 'GET' && req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
  if (!isAuthorized(req)) {
    // GET không/sai secret → trả ping vô hại (không lộ dữ liệu); POST sai secret → 401.
    if (req.method === 'GET') return sendJson(res, 200, { ok: true, status: 'warm' });
    return sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
  }
  try {
    const result = await runDigest();
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'digest-failed' });
  }
}
