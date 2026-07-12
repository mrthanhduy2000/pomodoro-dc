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
