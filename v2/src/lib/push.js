/**
 * push.js — v2's side of the shared push pipeline (api/push/*). The subscription is saved with
 * `platform: 'v2:…'` so the dispatcher sends v2 jobs only to this service worker (ADR-101).
 * Every call is best-effort: a failed push must never break the timer.
 */
const ENABLED_KEY = 'dc-pomodoro-v2:push-enabled';

function isAppleMobile() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function pushSupport() {
  if (isAppleMobile() && !isStandalone()) return 'needs-install';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  return 'ready';
}

export function pushEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1' && Notification.permission === 'granted';
  } catch {
    return false;
  }
}

async function postJson(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

function base64UrlToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob(`${b64}${pad}`.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function enablePush(deviceId) {
  if (pushSupport() !== 'ready') throw new Error('Thiết bị này chưa hỗ trợ thông báo (iPhone: thêm app ra Màn hình chính trước).');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Chưa cấp quyền thông báo.');
  const reg = await navigator.serviceWorker.ready;
  const keyRes = await fetch('/api/push/public-key').then((r) => r.json());
  if (!keyRes?.publicKey) throw new Error('Máy chủ chưa có khoá thông báo.');
  const subscription = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(keyRes.publicKey) }));
  await postJson('/api/push/subscribe', {
    subscription: subscription.toJSON(),
    deviceId,
    userAgent: navigator.userAgent,
    platform: `v2:${navigator.platform || 'web'}`,
  });
  localStorage.setItem(ENABLED_KEY, '1');
}

/*
 * Scheduling and cancelling do NOT depend on this device having notifications on: a session
 * started on the phone and paused on the Mac must be cancelled by the Mac, or the phone rings at
 * the wrong time. The server delivers only to devices that subscribed.
 */
export function schedulePush(kind, jobKey, scheduledForMs, minutes) {
  postJson('/api/push/schedule', {
    kind,
    jobKey,
    scheduledFor: new Date(scheduledForMs).toISOString(),
    focusMinutes: minutes,
    payload: { app: 'v2' },
  }).catch(() => {});
}

export function cancelPush(jobKey) {
  postJson('/api/push/cancel', { jobKey, reason: 'v2-user' }).catch(() => {});
}

export const focusJobKey = (sid) => `v2:focus:${sid}`;
export const breakJobKey = (sid) => `v2:break:${sid}`;
