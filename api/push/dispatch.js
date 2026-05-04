import { methodNotAllowed, sendJson } from '../_lib/http.js';
import {
  disablePushSubscription,
  getDuePushJobs,
  isExpiredPushSubscriptionError,
  listActivePushSubscriptions,
  markPushJobError,
  markPushJobSent,
  sendPushNotification,
} from '../_lib/push.js';

function isAuthorizedCronRequest(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.authorization ?? '';
  return authHeader === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  if (!isAuthorizedCronRequest(req)) {
    return sendJson(res, 401, {
      ok: false,
      error: 'Unauthorized cron request.',
    });
  }

  try {
    const jobs = await getDuePushJobs(10);
    if (jobs.length === 0) {
      return sendJson(res, 200, {
        ok: true,
        dueJobs: 0,
        sentJobs: 0,
        report: [],
      });
    }

    const subscriptions = await listActivePushSubscriptions();
    const report = [];
    let sentJobs = 0;

    for (const job of jobs) {
      if (subscriptions.length === 0) {
        await markPushJobSent(job.job_key, 'no-active-subscriptions');
        sentJobs += 1;
        report.push({
          jobKey: job.job_key,
          status: 'sent-without-subscribers',
        });
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

      await markPushJobError(job.job_key, transientError);
      report.push({
        jobKey: job.job_key,
        status: 'retrying',
        deliveredTo: successCount,
        error: transientError,
      });
    }

    return sendJson(res, 200, {
      ok: true,
      dueJobs: jobs.length,
      sentJobs,
      report,
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Cannot dispatch push notifications.',
    });
  }
}
