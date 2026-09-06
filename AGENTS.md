# AGENTS.md — điểm vào cho Codex / các AI agent khác

> **File này KHÔNG chứa quy tắc.** Toàn bộ quy tắc, bối cảnh kỹ thuật, Governance Protocol và
> AI Engineering Playbook nằm ở **`CLAUDE.md`** — đó là nguồn sự thật DUY NHẤT của dự án này,
> áp dụng cho MỌI AI (Claude Code, Codex, ChatGPT...), không riêng Claude.

## Bắt buộc làm ngay khi bắt đầu phiên

1. **Đọc `START_HERE.md`** — đang ở đâu, việc gì đang dở, 5 luật cắn. Đây là file DUY NHẤT bắt buộc.
2. **Đọc `CLAUDE.md`** — quy tắc, ngân sách token, các cái bẫy đã trả giá. (Claude Code tự nạp file
   này; Codex thì phải tự mở.)
3. `PHASE_RULES.md` nếu đang làm một phase. Rồi mới `grep` các file liên quan tới việc sắp làm.

Chưa đọc xong 2 file trên thì **chưa được sửa dòng code nào**.

⚠️ **ĐÍNH CHÍNH 2026-09-06 — bản trước của file này bảo "đọc `BAN_GIAO.md` toàn văn".** Đó là một
chỉ dẫn tốn **134.000 token** (230.649 ký tự) ngay câu thứ hai của phiên, và nó MÂU THUẪN với
`PHASE_RULES.md` §5 (*"`BAN_GIAO.md` là nhật ký: chỉ ghi thêm, **chỉ đọc 60 dòng đầu**, không bao
giờ đọc trọn"*). Luật đúng: **`head -60 BAN_GIAO.md`**. Xem mục "NGÂN SÁCH TOKEN" ở `CLAUDE.md` —
kiểm bằng `node scripts/doc-budget.mjs`.

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
- ⚠️ **Push = deploy thẳng ra production** (Vercel tự deploy ra mọi thiết bị của Đàm) — nhưng CHỈ
  nhánh `main`. Nhánh phụ chỉ ra bản Preview.
- ❌ **KHÔNG `cat` các file kho tra cứu** (`TECH_DEBT.md` 250k token · `ARCHITECTURE_DECISIONS.md`
  223k · `CHANGELOG.md` 154k · `BAN_GIAO.md` 134k). Một lệnh `cat` là nổ cửa sổ ngữ cảnh.
  Dùng `grep -n` / `sed -n 'A,Bp'`, hoặc `node scripts/doc-budget.mjs --map <file>` để lấy mục lục.

Chi tiết đầy đủ của cả ba: `CLAUDE.md`.
