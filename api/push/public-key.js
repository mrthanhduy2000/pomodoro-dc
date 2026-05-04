import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { getPushConfig } from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const { publicKey } = getPushConfig();
  if (!publicKey) {
    return sendJson(res, 503, {
      ok: false,
      error: 'WEB_PUSH_PUBLIC_KEY chưa được cấu hình trên Vercel.',
    });
  }

  return sendJson(res, 200, {
    ok: true,
    publicKey,
  });
}
