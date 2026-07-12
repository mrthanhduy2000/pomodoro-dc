/**
 * api/keepalive.js — CRON "giữ nhịp tim" cho Supabase (chống tự pause vì "không hoạt động").
 * Gói Free của Supabase tự tạm dừng project nếu không có request API nào trong ~7 ngày.
 * App này chỉ 1 người dùng nên dễ rơi vào im lặng lâu — job này gọi 1 câu query cực nhẹ
 * mỗi ngày (đặt lịch ở vercel.json) qua đúng client Supabase (không phải cron nội bộ Postgres)
 * để Supabase luôn thấy project "đang hoạt động". Bảo vệ bằng CRON_SECRET như các cron khác.
 */
import { isCronAuthorized, methodNotAllowed, sendJson } from './_lib/http.js';
import { getAdminClient } from './_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);
  if (!isCronAuthorized(req)) {
    if (req.method === 'GET') return sendJson(res, 200, { ok: true, status: 'warm' });
    return sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
  }
  try {
    const admin = getAdminClient();
    const { error } = await admin.from('game_state').select('id').limit(1);
    if (error) throw error;
    return sendJson(res, 200, { ok: true, pinged: true });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'keepalive-failed' });
  }
}
