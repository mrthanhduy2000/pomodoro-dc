import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import { upsertPushJob } from '../_lib/push.js';
import {
  buildFocusCompletePayload,
  buildPomodoroContinuePayload,
  buildV2BreakOverPayload,
  buildV2FocusCompletePayload,
} from '../../src/engine/pushPayloads.js';

// The server always rebuilds the payload from `kind`; whatever text the client sent is ignored.
const KNOWN_KINDS = {
  'focus-complete': buildFocusCompletePayload,
  'pomodoro-continue': buildPomodoroContinuePayload,
  'v2-focus-complete': buildV2FocusCompletePayload,
  'v2-break-over': buildV2BreakOverPayload,
};

export function resolvePushKind(kind) {
  return Object.hasOwn(KNOWN_KINDS, kind) ? kind : 'focus-complete';
}

function buildKnownPayload(kind, focusMinutes) {
  return KNOWN_KINDS[resolvePushKind(kind)](focusMinutes);
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
    const kind = resolvePushKind(body?.kind);
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
