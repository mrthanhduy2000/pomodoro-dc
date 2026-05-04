import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import { upsertPushSubscription } from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await readJsonBody(req);
    const subscription = body?.subscription;

    if (!subscription?.endpoint) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Missing subscription.endpoint.',
      });
    }

    await upsertPushSubscription({
      subscription,
      deviceId: body?.deviceId ?? null,
      userAgent: body?.userAgent ?? null,
      platform: body?.platform ?? null,
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Cannot save push subscription.',
    });
  }
}
