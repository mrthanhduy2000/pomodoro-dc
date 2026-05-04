import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import { cancelPushJob } from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await readJsonBody(req);
    const jobKey = body?.jobKey;

    if (!jobKey || typeof jobKey !== 'string') {
      return sendJson(res, 400, {
        ok: false,
        error: 'Missing jobKey.',
      });
    }

    await cancelPushJob(jobKey, body?.reason ?? 'cancelled');

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Cannot cancel push notification.',
    });
  }
}
