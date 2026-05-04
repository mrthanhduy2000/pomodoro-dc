/**
 * notifications.js — Quản Lý Thông Báo Trình Duyệt
 * ─────────────────────────────────────────────────────────────────────────────
 * Lớp bọc mỏng quanh Notification API của trình duyệt.
 *
 * Cách dùng:
 *   1. Gọi `notificationManager.requestPermission()` một lần khi mở Cài Đặt.
 *   2. Gọi `notificationManager.notify(...)` ở bất kỳ đâu cần thiết.
 *
 * Tất cả lời gọi đều an toàn dù quyền bị từ chối — chúng chỉ không làm gì.
 * ─────────────────────────────────────────────────────────────────────────────
 */

class NotificationManager {
  constructor() {
    this.enabled = true; // được bật/tắt bởi Cài Đặt
  }

  /** Trả về 'granted' | 'denied' | 'default' | 'unsupported' */
  get permission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  /**
   * requestPermission
   * Hiển thị hộp thoại xin quyền của trình duyệt.
   * Nên gọi từ sự kiện nhấn nút để tuân thủ chính sách trình duyệt.
   * @returns {Promise<string>} trạng thái quyền sau khi xử lý
   */
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
  }

  /**
   * notify
   * Bắn thông báo trình duyệt nếu đã được cấp quyền và đang bật.
   *
   * @param {object} opts
   *   title   {string}   - tiêu đề thông báo (bắt buộc)
   *   body    {string}   - nội dung
   *   icon    {string}   - URL biểu tượng (tùy chọn)
   *   tag     {string}   - tag loại trùng (thay thế thông báo cùng tag cũ)
   *   onClick {function} - callback khi nhấn vào thông báo
   */
  notify({ title, body = '', icon, tag, onClick } = {}) {
    if (!this.enabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notif = new Notification(title, {
      body,
      icon: icon ?? '/icon.svg',
      tag,
      silent: true, // âm thanh do soundEngine xử lý
    });

    if (onClick) {
      notif.onclick = () => {
        window.focus();
        onClick();
        notif.close();
      };
    }

    // Tự đóng sau 6 giây
    setTimeout(() => notif.close(), 6_000);

    return notif;
  }

  // ── Các phím tắt tiện lợi ─────────────────────────────────────────────────

  notifyFocusComplete(minutes) {
    this.notify({
      title: '🎇 XONG PHIÊN TẬP TRUNG!',
      body: `Phiên ${minutes} phút của Đàm đã xong. Mở app bấm nghỉ giải lao nha!`,
      tag: 'focus-complete',
      onClick: () => window.focus(),
    });
  }

  notifyBreakOver() {
    this.notify({
      title: '⏰ Hết Giờ Nghỉ!',
      body: 'Thời gian nghỉ đã kết thúc. Sẵn sàng cho phiên tập trung tiếp theo?',
      tag: 'break-over',
    });
  }

  notifyDisaster(disasterLabel) {
    this.notify({
      title: `💥 ${disasterLabel} Ập Đến!`,
      body: 'Bạn đã hủy phiên tập trung — tài nguyên bị thất thoát theo mức phạt hiện tại.',
      tag: 'disaster',
    });
  }

  notifyLevelUp(newLevel) {
    this.notify({
      title: `🆙 Lên Cấp! → Cấp ${newLevel}`,
      body: 'Bạn nhận được 1 Điểm Kỹ Năng. Vào tab Kỹ Năng để mở khóa.',
      tag: 'level-up',
    });
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
const notificationManager = new NotificationManager();
export default notificationManager;
