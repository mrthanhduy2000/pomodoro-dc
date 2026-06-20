# BÀN GIAO — Pomodoro DC

> Dành cho AI/người làm tiếp. File này trả lời: **đang ở đâu, làm gì tiếp, đã đổi những gì.**
> Chi tiết kỹ thuật + quy tắc cấm: xem `CLAUDE.md`. Lịch sử thiết kế sâu: thư mục memory của Claude.
> **Quy tắc:** mọi phiên AI phải đọc file này + `CLAUDE.md` TRƯỚC khi làm, và cập nhật file này (Nhật ký + Đã/Sẽ làm) NGAY SAU khi thay đổi gì.
> Cập nhật lần cuối: **2026-06-20**.

---

## ✅ Đã làm (xong, đa số đã deploy)
- **AI Coach 3 tầng**: (a) Hỏi Coach trả lời từ số liệu, không cần mạng; (b) Coach chạy AI ngay trên máy (chỉ desktop, tự bật khi đủ điều kiện); (c) Hỏi Claude qua mạng (chỉ khi bấm).
- **Giọng Coach theo tính cách**: strict / zen / buddy.
- **Cộng Hưởng**: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu, có chặn lạm phát.
- **Focus Intelligence**: hồ sơ + dự đoán "giờ vàng" + khuyến nghị + báo cáo.
- **Đọc-nghĩa ghi chú** chạy ngay trên máy (gom chủ đề, tìm phiên giống nhau).
- **Web Push iPhone**: đã làm xong & deploy.
- **Giao diện Thụy Sĩ** + bộ icon tự vẽ thay emoji.
- **Đồng bộ Supabase** (game_state + timer_live cho menu bar Mac).
- **Gộp engine Coach về 1 nguồn** — hết bản chép đôi.

## 🔧 Đang làm
- (Trống — việc gần nhất đã xong. Xem "Sẽ làm tiếp".)

## 🔜 Sẽ làm tiếp (ưu tiên từ trên xuống)
1. **Nối giọng Coach vào sự kiện timer thật** — để Coach biết lúc phiên kết thúc/bị gián đoạn (giờ mới chỉ phản chiếu trạng thái cả ngày).
2. **Thêm test cho `coachVoice.js`** — engine Coach của app thật hiện chưa có test riêng.
3. **Giao diện còn dở**: full-screen iPhone (tai thỏ che mép trên), nút đóng ✕ cho hộp phần thưởng, gom cỡ chữ cho đồng nhất, tắt hiệu ứng cho người nhạy chuyển động.
4. *(khi cần)* Giới hạn lượt gọi `api/coach.js`; thêm `vercel.json` + file SQL cho bảng gốc Supabase.

## ⚠️ Nhớ kỹ (kẻo hỏng)
- **Không bấm chạy phiên focus trên bản dev/localhost** — nó dùng chung dữ liệu với bản thật, sẽ ghi đè dữ liệu của Đàm.
- **Coach mặc định miễn phí** — đừng tự bật hướng trả tiền (Claude API) trừ khi Đàm yêu cầu.
- **Engine Coach chỉ có 1 nguồn**: muốn sửa câu/giọng → chỉ sửa `src/engine/coachVoice.js`.
- Luôn `npm test` trước khi commit; luôn chạy `git status` tươi (đừng tin ảnh chụp cũ).

## 🗒️ Nhật ký cập nhật
> Mỗi lần xong việc đáng kể, thêm 1 dòng vào ĐẦU danh sách.

- **2026-06-20** — Bắt buộc quy trình bàn giao: thêm hook tự chèn BAN_GIAO.md vào đầu MỖI phiên AI (`.claude/session-start-bangiao.sh` + `.claude/settings.local.json`), và ghi 2 quy tắc bắt buộc (đọc-trước / cập-nhật-sau) lên đầu CLAUDE.md.
- **2026-06-20** — Gọn tài liệu về 2 file (CLAUDE.md + BAN_GIAO.md), đổi tên HANDOVER → BAN_GIAO.
- **2026-06-20** — Gộp engine Coach về 1 nguồn (`ai-coach-sim/ai-coach.mjs` chỉ trỏ về `src/engine/coachVoice.js`). Verify: test sandbox 4104/4104 + `npm test` 131/131.
- **2026-06-20** — Vá CLAUDE.md (thêm mục AI Coach, tick web push đã xong) + lập bàn giao đầu tiên.
- **2026-06-20** (`7a72f48`) — Giọng Coach theo tính cách gắn vào thẻ Coach.
- **2026-06-20** (`b94db18`) — Cộng Hưởng: nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu.
- (cũ hơn) — Xem `git log` + thư mục memory cho lịch sử đầy đủ.
