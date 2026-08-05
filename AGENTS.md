# AGENTS.md — điểm vào cho Codex / các AI agent khác

> **File này KHÔNG chứa quy tắc.** Toàn bộ quy tắc, bối cảnh kỹ thuật, Governance Protocol và
> AI Engineering Playbook nằm ở **`CLAUDE.md`** — đó là nguồn sự thật DUY NHẤT của dự án này,
> áp dụng cho MỌI AI (Claude Code, Codex, ChatGPT...), không riêng Claude.

## Bắt buộc làm ngay khi bắt đầu phiên

1. **Đọc `CLAUDE.md` toàn văn** — quy tắc bắt buộc, cấu trúc dự án, hạ tầng, các cái bẫy đã trả giá.
2. **Đọc `BAN_GIAO.md` toàn văn** — đang ở đâu, việc gì đang dở, nhật ký chi tiết từng thay đổi.
3. Rồi mới đọc các file liên quan tới việc sắp làm.

Chưa đọc xong 2 file trên thì **chưa được sửa dòng code nào**.

## Vì sao file này chỉ là con trỏ (đừng chép nội dung CLAUDE.md vào đây)

Trước 2026-08-05, `AGENTS.md` là một BẢN SAO nguyên văn của `CLAUDE.md` (288 dòng), tạo bằng cách
thay máy móc chữ "Claude" thành "Codex". Kết quả:

- Sinh ra nội dung vô nghĩa: *"dùng Codex + Codex để code"*, *"mọi AI tiếp quản project
  (Codex/Codex/ChatGPT...)"*, *"Hỏi Codex (`api/coach.js`...)"* — trong khi lịch sử thật là
  "Hỏi Claude", một tính năng đã gỡ.
- Sinh ra **đường dẫn không tồn tại**: `.Codex/session-start-bangiao.sh` và
  `/Users/damduy/.Codex/projects/...` (thư mục thật là `.claude/`). AI đọc vào sẽ đi tìm thứ không có.
- **Trôi khỏi bản gốc chỉ sau 5 ngày**: tới 2026-08-05 nó đã thiếu nguyên mục "App menu bar Mac —
  3 cái bẫy đã trả giá", tức Codex đọc `AGENTS.md` sẽ KHÔNG biết những cái bẫy đó và rất dễ dẫm lại.

Đây đúng là thứ mà quy tắc kiến trúc của chính dự án cấm: **Composition over Duplication**
(xem `CLAUDE.md` mục "Quy tắc kiến trúc"). Hai bản sao của cùng một tài liệu chắc chắn sẽ lệch nhau.
Vì vậy từ nay chỉ còn MỘT bản: `CLAUDE.md`.

**Sửa quy tắc → sửa `CLAUDE.md`. Không bao giờ chép ngược nội dung về file này.**

## Ba điều nguy hiểm nhất (nhắc lại ở đây để không cần đọc hết mới biết)

- ❌ **KHÔNG start phiên focus trên dev/localhost** — dev dùng CHUNG dòng dữ liệu Supabase với
  production, sẽ ghi đè dữ liệu thật của Đàm. Đây là hành động gây mất dữ liệu không hồi phục được.
- ⚠️ **Lệnh "nghiên cứu / tìm hiểu / cho ý kiến"** → chỉ phân tích rồi DỪNG, không sửa code, không
  commit, không deploy. Câu mơ hồ → coi là nghiên cứu và hỏi trước.
- ⚠️ **Push = deploy thẳng ra production** (Vercel tự deploy ra mọi thiết bị của Đàm).

Chi tiết đầy đủ của cả ba: `CLAUDE.md`.
