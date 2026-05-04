import { APP_DISPLAY_NAME, APP_SLUG } from './appIdentity';

const PUSH_DEVICE_ID_KEY = `${APP_SLUG}:push-device-id`;
export const FOCUS_COMPLETE_PUSH_JOB_KEY = `${APP_SLUG}:focus-complete`;
const FOCUS_COMPLETE_OWNER_NAME = 'Đàm';

function createFocusCompleteNotificationPayload(focusMinutes) {
  const roundedMinutes = Math.max(1, Math.round(focusMinutes || 0));
  return {
    title: '🎇 XONG PHIÊN TẬP TRUNG!',
    body: `Phiên ${roundedMinutes} phút của ${FOCUS_COMPLETE_OWNER_NAME} đã xong. Mở app bấm nghỉ giải lao nha!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-pomodoro-focus-complete',
    url: '/',
  };
}

function canUseBrowserApis() {
  return typeof window !== 'undefined';
}

function isAppleMobile() {
  if (!canUseBrowserApis()) return false;

  const ua = navigator.userAgent || '';
  const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/i.test(ua) || touchMac;
}

export function isStandaloneDisplayMode() {
  if (!canUseBrowserApis()) return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function getPushSupportStatus() {
  if (!canUseBrowserApis()) return 'unsupported';

  const hasNotifications = 'Notification' in window;
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;

  if (isAppleMobile() && !isStandaloneDisplayMode()) {
    return 'needs-install';
  }

  if (!hasNotifications || !hasServiceWorker || !hasPushManager) {
    return 'unsupported';
  }

  return 'ready';
}

export function getNotificationPermission() {
  if (!canUseBrowserApis() || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function getPushDeviceId() {
  if (!canUseBrowserApis()) return null;

  try {
    const existing = window.localStorage.getItem(PUSH_DEVICE_ID_KEY);
    if (existing) return existing;

    const nextId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${APP_SLUG}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(PUSH_DEVICE_ID_KEY, nextId);
    return nextId;
  } catch {
    return null;
  }
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function fetchPushJson(path, init = {}) {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }

  return data;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Trình duyệt hiện tại chưa có service worker.');
  }

  return navigator.serviceWorker.ready;
}

async function getPushPublicKey() {
  const data = await fetchPushJson('/api/push/public-key');
  if (!data?.publicKey) {
    throw new Error('Server chưa có WEB_PUSH_PUBLIC_KEY.');
  }

  return data.publicKey;
}

function getInstallHintMessage() {
  return 'Trên iPhone, hãy mở bằng Safari rồi thêm app ra Home Screen trước khi bật thông báo.';
}

export async function getPushRuntimeState() {
  const supportStatus = getPushSupportStatus();
  const permission = getNotificationPermission();
  const deviceId = getPushDeviceId();

  if (supportStatus !== 'ready') {
    return {
      permission,
      supportStatus,
      subscribed: false,
      deviceId,
      errorMessage: supportStatus === 'needs-install' ? getInstallHintMessage() : '',
    };
  }

  if (permission !== 'granted') {
    return {
      permission,
      supportStatus,
      subscribed: false,
      deviceId,
      errorMessage: '',
    };
  }

  try {
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();

    return {
      permission,
      supportStatus,
      subscribed: Boolean(subscription),
      deviceId,
      endpoint: subscription?.endpoint ?? null,
      errorMessage: '',
    };
  } catch (error) {
    return {
      permission,
      supportStatus,
      subscribed: false,
      deviceId,
      errorMessage: error instanceof Error ? error.message : 'Không đọc được trạng thái Web Push.',
    };
  }
}

export async function ensurePushSubscription({ requestPermission = true } = {}) {
  const supportStatus = getPushSupportStatus();
  const deviceId = getPushDeviceId();
  let permission = getNotificationPermission();

  if (supportStatus === 'needs-install') {
    return {
      ok: false,
      permission,
      supportStatus,
      subscribed: false,
      deviceId,
      errorMessage: getInstallHintMessage(),
    };
  }

  if (permission === 'default' && requestPermission && 'Notification' in window) {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return {
      ok: false,
      permission,
      supportStatus,
      subscribed: false,
      deviceId,
      errorMessage: permission === 'denied'
        ? 'Thông báo đang bị chặn trong cài đặt Safari hoặc iPhone.'
        : '',
    };
  }

  if (supportStatus !== 'ready') {
    return {
      ok: true,
      permission,
      supportStatus,
      subscribed: false,
      deviceId,
      errorMessage: '',
    };
  }

  try {
    const registration = await getServiceWorkerRegistration();
    const publicKey = await getPushPublicKey();

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await fetchPushJson('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        deviceId,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        subscription,
      }),
    });

    return {
      ok: true,
      permission,
      supportStatus,
      subscribed: true,
      deviceId,
      endpoint: subscription.endpoint,
      errorMessage: '',
    };
  } catch (error) {
    return {
      ok: false,
      permission,
      supportStatus,
      subscribed: false,
      deviceId,
      errorMessage: error instanceof Error ? error.message : 'Không bật được Web Push.',
    };
  }
}

export async function disablePushSubscription() {
  const deviceId = getPushDeviceId();

  try {
    if ('serviceWorker' in navigator) {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      await fetchPushJson('/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subscription?.endpoint ?? null,
          deviceId,
        }),
      });

      if (subscription) {
        await subscription.unsubscribe();
      }
    }

    return {
      ok: true,
      deviceId,
      errorMessage: '',
    };
  } catch (error) {
    return {
      ok: false,
      deviceId,
      errorMessage: error instanceof Error ? error.message : 'Không tắt được Web Push.',
    };
  }
}

export async function scheduleFocusCompletePush({ endsAtMs, focusMinutes }) {
  if (!Number.isFinite(endsAtMs)) return { ok: false };

  try {
    return await fetchPushJson('/api/push/schedule', {
      method: 'POST',
      body: JSON.stringify({
        jobKey: FOCUS_COMPLETE_PUSH_JOB_KEY,
        focusMinutes: Math.max(1, Math.round(focusMinutes || 0)),
        scheduledFor: new Date(endsAtMs).toISOString(),
        payload: createFocusCompleteNotificationPayload(focusMinutes),
      }),
    });
  } catch (error) {
    console.warn('[push] schedule failed', error);
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : 'Không lên lịch được Web Push.',
    };
  }
}

export async function cancelFocusCompletePush(reason = 'cancelled') {
  try {
    return await fetchPushJson('/api/push/cancel', {
      method: 'POST',
      body: JSON.stringify({
        jobKey: FOCUS_COMPLETE_PUSH_JOB_KEY,
        reason,
      }),
    });
  } catch (error) {
    console.warn('[push] cancel failed', error);
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : 'Không hủy được Web Push.',
    };
  }
}
