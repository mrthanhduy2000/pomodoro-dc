import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://jcefdsdccmnmqvuwelmm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const WEB_PUSH_PUBLIC_KEY = process.env.WEB_PUSH_PUBLIC_KEY ?? '';
const WEB_PUSH_PRIVATE_KEY = process.env.WEB_PUSH_PRIVATE_KEY ?? '';
const WEB_PUSH_SUBJECT = process.env.WEB_PUSH_SUBJECT ?? 'mailto:hello@pomodoro-dc.local';

let adminClient = null;
let webPushConfigured = false;

export function getPushConfig() {
  return {
    publicKey: WEB_PUSH_PUBLIC_KEY,
    hasAdmin: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    hasKeys: Boolean(WEB_PUSH_PUBLIC_KEY && WEB_PUSH_PRIVATE_KEY),
  };
}

function assertAdminConfigured() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  }
}

function assertPushKeysConfigured() {
  if (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY) {
    throw new Error('Missing WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY.');
  }
}

export function getAdminClient() {
  assertAdminConfigured();

  if (adminClient) return adminClient;

  adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}

export function configureWebPush() {
  assertPushKeysConfigured();

  if (webPushConfigured) return;

  webpush.setVapidDetails(
    WEB_PUSH_SUBJECT,
    WEB_PUSH_PUBLIC_KEY,
    WEB_PUSH_PRIVATE_KEY,
  );
  webPushConfigured = true;
}

export async function upsertPushSubscription({
  subscription,
  deviceId = null,
  userAgent = null,
  platform = null,
}) {
  const admin = getAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from('push_subscriptions')
    .upsert({
      endpoint: subscription.endpoint,
      subscription,
      device_id: deviceId,
      user_agent: userAgent,
      platform,
      enabled: true,
      created_at: now,
      updated_at: now,
      last_seen_at: now,
    }, {
      onConflict: 'endpoint',
    });

  if (error) throw error;

  if (userAgent || platform || deviceId) {
    let cleanupQuery = admin
      .from('push_subscriptions')
      .update({
        enabled: false,
        updated_at: now,
      })
      .neq('endpoint', subscription.endpoint)
      .eq('enabled', true);

    if (deviceId) {
      cleanupQuery = cleanupQuery.eq('device_id', deviceId);
    } else if (userAgent && platform) {
      cleanupQuery = cleanupQuery.eq('user_agent', userAgent).eq('platform', platform);
    } else if (userAgent) {
      cleanupQuery = cleanupQuery.eq('user_agent', userAgent);
    } else if (platform) {
      cleanupQuery = cleanupQuery.eq('platform', platform);
    }

    const { error: cleanupError } = await cleanupQuery;
    if (cleanupError) throw cleanupError;
  }
}

export async function disablePushSubscription({ endpoint = null, deviceId = null }) {
  if (!endpoint && !deviceId) return;

  const admin = getAdminClient();
  const now = new Date().toISOString();
  let query = admin
    .from('push_subscriptions')
    .update({
      enabled: false,
      updated_at: now,
      last_seen_at: now,
    });

  query = endpoint
    ? query.eq('endpoint', endpoint)
    : query.eq('device_id', deviceId);

  const { error } = await query;
  if (error) throw error;
}

export async function upsertPushJob({ jobKey, scheduledFor, payload }) {
  const admin = getAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from('push_jobs')
    .upsert({
      job_key: jobKey,
      scheduled_for: scheduledFor,
      payload,
      status: 'scheduled',
      created_at: now,
      updated_at: now,
      sent_at: null,
      cancelled_at: null,
      last_error: null,
    }, {
      onConflict: 'job_key',
    });

  if (error) throw error;
}

export async function cancelPushJob(jobKey, reason = 'cancelled') {
  const admin = getAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from('push_jobs')
    .update({
      status: 'cancelled',
      cancelled_at: now,
      updated_at: now,
      last_error: reason,
    })
    .eq('job_key', jobKey);

  if (error) throw error;
}

export async function getDuePushJobs(limit = 10) {
  const admin = getAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('push_jobs')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function listActivePushSubscriptions() {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('enabled', true);

  if (error) throw error;
  return data ?? [];
}

export async function markPushJobSent(jobKey, lastError = null) {
  const admin = getAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from('push_jobs')
    .update({
      status: 'sent',
      sent_at: now,
      updated_at: now,
      last_error: lastError,
    })
    .eq('job_key', jobKey);

  if (error) throw error;
}

export async function markPushJobError(jobKey, errorMessage) {
  const admin = getAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from('push_jobs')
    .update({
      updated_at: now,
      last_error: errorMessage,
    })
    .eq('job_key', jobKey);

  if (error) throw error;
}

export async function sendPushNotification(subscription, payload) {
  configureWebPush();
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 60 * 60,
    urgency: 'high',
  });
}

export function isExpiredPushSubscriptionError(error) {
  const code = error?.statusCode ?? error?.status ?? 0;
  return code === 404 || code === 410;
}
