import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import {
  disablePushSubscription,
  isExpiredPushSubscriptionError,
  listActivePushSubscriptions,
  sendPushNotification,
  markPushJobSent,
} from '../_lib/push.js';

const FOCUS_JOB_KEY = 'dc-pomodoro:focus-complete';

// Supabase webhook fires on every timer_live UPDATE — only send when session actually ended
function isSessionEndEvent(body) {
  return (
    body?.type === 'UPDATE' &&
    body?.old_record?.is_running === true &&
    body?.record?.is_running === false &&
    body?.record?.paused_seconds_remaining == null
  );
}

function buildPayload(focusMinutes) {
  return {
    title: '🎇 XONG PHIÊN TẬP TRUNG!',
    body: `Phiên ${focusMinutes} phút của Đàm đã xong. Mở app bấm nghỉ giải lao nha!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-pomodoro-focus-complete',
    url: '/',
  };
}

async function sendToAll(focusMinutes) {
  const subscriptions = await listActivePushSubscriptions();
  let sent = 0;
  for (const row of subscriptions) {
    try {
      await sendPushNotification(row.subscription, buildPayload(focusMinutes));
      sent += 1;
    } catch (error) {
      if (isExpiredPushSubscriptionError(error)) {
        await disablePushSubscription({ endpoint: row.endpoint });
      }
    }
  }
  return sent;
}

export default async function handler(req, res) {
  // Warm-up ping from tickClock at 30s remaining
  if (req.method === 'GET') {
    return sendJson(res, 200, { ok: true, status: 'warm' });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  try {
    const body = await readJsonBody(req);

    // Path A: called from Supabase Database Webhook
    if (body?.type === 'UPDATE' && body?.record) {
      if (!isSessionEndEvent(body)) {
        return sendJson(res, 200, { ok: true, skipped: true });
      }
      const totalSec = body.old_record?.total_seconds ?? 0;
      const focusMinutes = Math.max(1, Math.round(totalSec / 60));
      const sent = await sendToAll(focusMinutes);
      await markPushJobSent(FOCUS_JOB_KEY, null).catch(() => {});
      return sendJson(res, 200, { ok: true, sent, source: 'webhook' });
    }

    // Path B: called directly from browser (FINISHED state)
    const focusMinutes = Math.max(1, Math.round(Number(body?.focusMinutes) || 25));
    const jobKey = body?.jobKey ?? FOCUS_JOB_KEY;
    const sent = await sendToAll(focusMinutes);
    await markPushJobSent(jobKey, null).catch(() => {});
    return sendJson(res, 200, { ok: true, sent, source: 'browser' });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Notify failed.',
    });
  }
}
