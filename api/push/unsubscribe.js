import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import { disablePushSubscription } from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const body = await readJsonBody(req);
    await disablePushSubscription({
      endpoint: body?.endpoint ?? null,
      deviceId: body?.deviceId ?? null,
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Cannot disable push subscription.',
    });
  }
}
