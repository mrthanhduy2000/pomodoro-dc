import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import {
  disablePushSubscription,
  isExpiredPushSubscriptionError,
  listActivePushSubscriptions,
  markPushJobSent,
  sendPushNotification,
} from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return sendJson(res, 200, { ok: true, status: 'warm' });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  try {
    const body = await readJsonBody(req);
    const focusMinutes = Math.max(1, Math.round(Number(body?.focusMinutes) || 25));
    const jobKey = body?.jobKey ?? null;

    const payload = {
      title: '🎇 XONG PHIÊN TẬP TRUNG!',
      body: `Phiên ${focusMinutes} phút của Đàm đã xong. Mở app bấm nghỉ giải lao nha!`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'dc-pomodoro-focus-complete',
      url: '/',
    };

    const subscriptions = await listActivePushSubscriptions();
    let sent = 0;

    for (const row of subscriptions) {
      try {
        await sendPushNotification(row.subscription, payload);
        sent += 1;
      } catch (error) {
        if (isExpiredPushSubscriptionError(error)) {
          await disablePushSubscription({ endpoint: row.endpoint });
        }
      }
    }

    // Mark the push_job as sent so cron doesn't send a duplicate
    if (jobKey) {
      await markPushJobSent(jobKey, null).catch(() => {});
    }

    return sendJson(res, 200, { ok: true, sent });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Notify failed.',
    });
  }
}
