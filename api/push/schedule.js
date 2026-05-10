import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import { upsertPushJob } from '../_lib/push.js';

function buildFocusCompletePayload(focusMinutes) {
  const roundedMinutes = Math.max(1, Math.round(focusMinutes || 0));
  return {
    title: '🎇 XONG PHIÊN TẬP TRUNG!',
    body: `Phiên ${roundedMinutes} phút của Đàm đã xong. Mở app bấm nghỉ giải lao nha!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-pomodoro-focus-complete',
    url: '/',
  };
}

function buildPomodoroContinuePayload(focusMinutes) {
  const roundedMinutes = Math.max(1, Math.round(focusMinutes || 0));
  return {
    title: '⏱ Pomodoro đã hết',
    body: `Phiên ${roundedMinutes} phút đã chuyển sang Bấm giờ thêm. Bấm Hết Phiên khi muốn chốt phiên.`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-pomodoro-continue',
    url: '/',
  };
}

function buildKnownPayload(kind, focusMinutes) {
  return kind === 'pomodoro-continue'
    ? buildPomodoroContinuePayload(focusMinutes)
    : buildFocusCompletePayload(focusMinutes);
}

function inferFocusMinutes(body) {
  if (Number.isFinite(body?.focusMinutes)) return Number(body.focusMinutes);
  const text = body?.payload?.body ?? '';
  const match = text.match(/(\d+)\s*phút/i);
  return match ? Number(match[1]) : 1;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await readJsonBody(req);
    const jobKey = body?.jobKey;
    const kind = body?.kind === 'pomodoro-continue' ? 'pomodoro-continue' : 'focus-complete';
    const scheduledFor = body?.scheduledFor;
    const payload = body?.payload;

    if (!jobKey || typeof jobKey !== 'string') {
      return sendJson(res, 400, {
        ok: false,
        error: 'Missing jobKey.',
      });
    }

    if (!scheduledFor || Number.isNaN(Date.parse(scheduledFor))) {
      return sendJson(res, 400, {
        ok: false,
        error: 'scheduledFor must be a valid ISO timestamp.',
      });
    }

    if (!payload || typeof payload !== 'object') {
      return sendJson(res, 400, {
        ok: false,
        error: 'Missing payload.',
      });
    }

    const focusMinutes = inferFocusMinutes(body);

    await upsertPushJob({
      jobKey,
      scheduledFor,
      payload: buildKnownPayload(kind, focusMinutes),
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Cannot schedule push notification.',
    });
  }
}
