import { methodNotAllowed, readJsonBody, sendJson } from '../_lib/http.js';
import {
  getDuePushJobs,
  disablePushSubscription,
  isExpiredPushSubscriptionError,
  listActivePushSubscriptions,
  markPushJobSent,
  sendPushNotification,
} from '../_lib/push.js';

function isAuthorizedRequest(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = req.headers.authorization ?? '';
  return authHeader === `Bearer ${secret}`;
}

// Supabase webhook fires on every timer_live UPDATE.
// Detect session-end by new record state alone (old_record not always included in webhook payload).
// is_running=false + paused_seconds_remaining=null = clearTimerLive() was called (session ended/cancelled).
// This is distinct from pause (is_running=false + paused_seconds_remaining=<number>).
function isSessionEndEvent(body) {
  return (
    body?.type === 'UPDATE' &&
    body?.record?.is_running === false &&
    body?.record?.paused_seconds_remaining == null
  );
}

async function runDispatch(graceSeconds) {
  const jobs = await getDuePushJobs(10, graceSeconds);
  if (jobs.length === 0) {
    return { dueJobs: 0, sentJobs: 0, report: [] };
  }

  const subscriptions = await listActivePushSubscriptions();
  const report = [];
  let sentJobs = 0;

  for (const job of jobs) {
    if (subscriptions.length === 0) {
      await markPushJobSent(job.job_key, 'no-active-subscriptions');
      sentJobs += 1;
      report.push({ jobKey: job.job_key, status: 'sent-without-subscribers' });
      continue;
    }

    let successCount = 0;
    let transientError = null;

    for (const subscriptionRow of subscriptions) {
      try {
        await sendPushNotification(subscriptionRow.subscription, job.payload);
        successCount += 1;
      } catch (error) {
        if (isExpiredPushSubscriptionError(error)) {
          await disablePushSubscription({ endpoint: subscriptionRow.endpoint });
          continue;
        }
        transientError = error instanceof Error ? error.message : 'Unknown push send failure.';
      }
    }

    if (successCount > 0 || !transientError) {
      await markPushJobSent(job.job_key, transientError);
      sentJobs += 1;
      report.push({
        jobKey: job.job_key,
        status: successCount > 0 ? 'sent' : 'no-valid-subscribers',
        deliveredTo: successCount,
        error: transientError,
      });
      continue;
    }

    // Transient error with no successes — job stays 'scheduled', next cron tick retries it
    report.push({
      jobKey: job.job_key,
      status: 'retrying',
      deliveredTo: successCount,
      error: transientError,
    });
  }

  return { dueJobs: jobs.length, sentJobs, report };
}

export default async function handler(req, res) {
  // Warm-up ping from tickClock at 30s remaining
  if (req.method === 'GET') {
    return sendJson(res, 200, { ok: true, status: 'warm' });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (!isAuthorizedRequest(req)) {
    return sendJson(res, 401, { ok: false, error: 'Unauthorized.' });
  }

  try {
    const body = await readJsonBody(req);

    // Supabase Database Webhook: POST with timer_live UPDATE payload → dispatch immediately
    if (body?.type === 'UPDATE' && body?.record) {
      if (!isSessionEndEvent(body)) {
        return sendJson(res, 200, { ok: true, skipped: true });
      }
      const result = await runDispatch(0);
      return sendJson(res, 200, { ok: true, ...result, source: 'webhook' });
    }

    // Cron or manual trigger
    const result = await runDispatch(0);
    return sendJson(res, 200, { ok: true, ...result, source: 'cron' });
  } catch (error) {
    const msg = error instanceof Error
      ? error.message
      : (JSON.stringify(error) || String(error) || 'Cannot dispatch push notifications.');
    return sendJson(res, 500, { ok: false, error: msg });
  }
}
