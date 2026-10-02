/**
 * pushPayloads.js — nội dung thông báo push (title/body/icon/tag) dùng chung giữa
 * client (src/lib/pushService.js — gửi kèm lên server, dù server luôn tự dựng lại
 * chứ không đọc nội dung này) và server (api/push/schedule.js — bản thật sự được
 * gửi đi, api/push/notify-now.js — route legacy). Trước đây bị chép tay 3 nơi.
 * File thuần (không đụng DOM/Node API) nên import được từ cả src/ lẫn api/, giống
 * quy ước "api/coach-digest.js" đã import "src/engine/time.js".
 */
export function buildFocusCompletePayload(focusMinutes) {
  const roundedMinutes = Math.max(1, Math.round(focusMinutes || 0));
  return {
    title: '🎇 XONG PHIÊN TẬP TRUNG!',
    body: `Phiên ${roundedMinutes} phút của Đàm đã xong. Mở app bấm nghỉ giải lao nha!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-pomodoro-focus-complete',
    url: '/',
  };
}

export function buildPomodoroContinuePayload(focusMinutes) {
  const roundedMinutes = Math.max(1, Math.round(focusMinutes || 0));
  return {
    title: '⏱ Pomodoro đã hết',
    body: `Phiên ${roundedMinutes} phút đã chuyển sang Bấm giờ thêm. Bấm Hết Phiên khi muốn chốt phiên.`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-pomodoro-continue',
    url: '/',
  };
}

/*
 * v2 rewrite (ADR-101). Same push pipeline, but every v2 payload carries `app: 'v2'` and opens
 * `/v2/`. `api/_lib/push.js` (`subscriptionMatchesJob`) delivers a job only to subscriptions of
 * the same app, so a device with both apps installed never hears the same session twice.
 */
export function buildV2FocusCompletePayload(focusMinutes) {
  const roundedMinutes = Math.max(1, Math.round(focusMinutes || 0));
  return {
    title: '🧱 Xong phiên — một viên gạch mới',
    body: `${roundedMinutes} phút tập trung đã xong. Mở app nghỉ giải lao nhé.`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-v2-focus-complete',
    url: '/v2/',
    app: 'v2',
  };
}

export function buildV2BreakOverPayload(breakMinutes) {
  const roundedMinutes = Math.max(1, Math.round(breakMinutes || 0));
  return {
    title: '☕ Hết giờ nghỉ',
    body: `${roundedMinutes} phút nghỉ đã hết. Sẵn sàng cho phiên tiếp theo?`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dc-v2-break-over',
    url: '/v2/',
    app: 'v2',
  };
}
