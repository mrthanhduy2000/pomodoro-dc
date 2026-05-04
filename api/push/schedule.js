import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import { upsertPushJob } from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await readJsonBody(req);
    const jobKey = body?.jobKey;
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

    await upsertPushJob({
      jobKey,
      scheduledFor,
      payload,
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Cannot schedule push notification.',
    });
  }
}
