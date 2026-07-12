# BÀN GIAO TRI THỨC DỰ ÁN — Pomodoro DC
### (Viết cho một AI khác tiếp quản dự án mà KHÔNG được đọc source code)

> Tài liệu này được viết bởi Claude (Anthropic), người vừa hoàn tất một đợt refactor kiến trúc toàn diện dự án (2026-07-12), sau nhiều tuần làm việc liên tục với chủ dự án qua hàng chục phiên làm việc. Mục tiêu: sau khi đọc xong tài liệu này, một AI hoàn toàn mới — không được xem một dòng code nào — vẫn phải hiểu được dự án là gì, vì sao nó được xây như hiện tại, kiến trúc của nó, những quyết định quan trọng đã đưa ra, những rủi ro, nợ kỹ thuật, quy tắc bất thành văn, và những bài học xương máu tích lũy qua rất nhiều lần thử-sai thực tế. Đây không phải mô tả code — đây là truyền đạt NGỮ CẢNH và KINH NGHIỆM, thứ mà đọc source code một mình không bao giờ cho bạn biết.
>
> Toàn bộ số liệu kỹ thuật (số dòng file, tên hàm, tên hằng số) trong tài liệu này đã được xác minh trực tiếp từ code tại thời điểm viết (2026-07-12), không phải suy đoán.

---

# PHẦN 1 — EXECUTIVE SUMMARY

## Project giải quyết vấn đề gì

Đây là một ứng dụng Pomodoro (đếm giờ tập trung làm việc) được "game hoá" theo phong cách một game xây dựng văn minh kiểu Civilization/idle-game. Vấn đề gốc rất đơn giản: chủ dự án (Đàm) muốn dùng kỹ thuật Pomodoro để tập trung làm việc/học, nhưng các app Pomodoro thuần tuý (đếm giờ, xong) không đủ tạo động lực để duy trì lâu dài. Giải pháp: biến MỖI phút tập trung thật thành tài nguyên trong một game tiến triển dài hạn (XP, EP, tài nguyên, kỹ năng, công trình, di vật, kỷ nguyên...) — người dùng không chỉ "đếm giờ", mà đang "chơi một ván game" mà nguyên liệu duy nhất là sự tập trung thật của chính họ. Điểm mấu chốt: **không có gì trong game này được mua bằng tiền hay cheat được — mọi tiến triển đều bắt nguồn từ phút tập trung thật đã hoàn thành**, đây là ràng buộc thiết kế xuyên suốt toàn bộ hệ thống phần thưởng.

Về sau, một lớp thứ hai được thêm vào: một "AI Coach" đọc lại toàn bộ lịch sử phiên tập trung thật của người dùng và đưa ra nhận xét/gợi ý cá nhân hoá — nhưng với một nguyên tắc tối thượng là **không bao giờ được bịa số liệu hoặc phóng đại sự tự tin từ dữ liệu ít**. Đây là lớp "chuyên gia phân tích dữ liệu" chứ không phải chatbot giải trí.

## Đối tượng sử dụng

**Chỉ một người dùng thật: Đàm** (chủ dự án). Đây không phải là SaaS, không có hệ thống nhiều người dùng, không có bảng người dùng trong database — toàn bộ dữ liệu game của một người nằm trong đúng MỘT dòng của MỘT bảng Supabase (`game_state`, id cố định `'singleton'`). Điều này ảnh hưởng đến gần như mọi quyết định kiến trúc trong dự án: không cần multi-tenancy, không cần authentication phức tạp (chỉ cần 1 secret cho cron job), không cần tối ưu cho hàng nghìn người dùng đồng thời, và — quan trọng nhất — **mọi rủi ro về mất dữ liệu là rủi ro với dữ liệu của CHÍNH Đàm**, không có "người dùng khác" để cô lập lỗi. Đây là lý do vì sao một sự cố mất 1 phiên tập trung thật (xem Phần 11) lại được coi là nghiêm trọng đến mức phải sửa tận gốc kiến trúc đồng bộ, thay vì chỉ là một "edge case chấp nhận được".

Người dùng còn có một đặc điểm quan trọng khác: **Đàm là non-coder**. Anh không tự viết code — toàn bộ dự án được xây dựng thông qua các phiên làm việc với AI coding agent (Codex, và chủ yếu là Claude Code). Điều này giải thích vì sao tài liệu dự án (CLAUDE.md, BAN_GIAO.md) lại chi tiết và mang tính "sổ tay bàn giao" đến vậy — mỗi phiên AI mới coi như "người mới" không nhớ gì về các phiên trước, và tài liệu là bộ nhớ chung duy nhất. Nó cũng giải thích vì sao có một quy tắc "hỏi trước khi làm" rất nghiêm ngặt (xem Phần 13): Đàm cần hiểu được TẠI SAO trước khi một thay đổi diễn ra, bằng ngôn ngữ dễ hiểu, không hàn lâm.

## Mục tiêu dài hạn

Không có một "roadmap sản phẩm" theo nghĩa thương mại — mục tiêu dài hạn là: (1) một công cụ tập trung cá nhân mà Đàm thực sự thích dùng hằng ngày trong nhiều năm, (2) một hệ thống phần thưởng đủ sâu và cân bằng để không nhàm chán nhưng cũng không lạm phát (không có "tường tiền" hay giá trị nào bị mất ý nghĩa vì quá dễ đạt), (3) một AI Coach ngày càng hiểu Đàm sâu hơn theo thời gian — không phải chỉ đọc số một lần, mà nhớ lời khuyên đã đưa, theo dõi kết quả, dần dần "biết" phong cách làm việc thật của anh (xem memory `coach-personalization-priority`). Có một tài liệu cân bằng nội bộ (`ERA_METADATA`/comment trong `constants.js`) ghi rõ mốc hiệu chỉnh: với nhịp độ dùng thực tế ước tính (12 phiên × 25 phút/ngày), toàn bộ hành trình 15 kỷ nguyên phải kéo dài **≥365 ngày** — nghĩa là đây được thiết kế như một "game một năm", không phải game "hoàn thành trong một tuần rồi bỏ".

## Quy mô hiện tại

- **1 người dùng**, 1 dòng dữ liệu Supabase (~vài trăm KB).
- Khoảng **90+ file nguồn** JS/JSX (sau đợt refactor gom gọn 2026-07-12), tách theo domain rõ ràng (`src/engine/`, `src/store/`, `src/components/`, `api/`...).
- **208 bài test tự động** (`npm test`), chạy bằng Node test runner có sẵn (không dùng Jest/Vitest).
- **360 thành tích (achievements)**, **36 kỹ năng** (6 nhánh × 6 nút), **75 bản thiết kế công trình** (5/kỷ nguyên × 15 kỷ nguyên), **~30 mẫu nhiệm vụ ngày** + **8 chuỗi nhiệm vụ tuần**.
- **Đúng 10 Vercel Serverless Functions** (giới hạn cứng của gói Hobby là 12 — một ràng buộc hạ tầng ảnh hưởng trực tiếp tới cách tổ chức thư mục `api/`, xem Phần 7 và Phần 10).
- Deploy tự động: mọi lần `git push` lên `main` trên GitHub kích hoạt Vercel build lại và deploy production trong ~2 phút.

## Tình trạng hiện tại

Ổn định, đang chạy production hằng ngày. Vừa hoàn tất (2026-07-12) một đợt **refactor kiến trúc toàn diện theo yêu cầu rõ ràng của Đàm** ("Senior Software Architect" mode, 10 nguyên tắc cụ thể — dọn trùng lặp, gom AI Coach vào một thư mục, giảm coupling, KHÔNG đổi business logic) — kết quả: 90 file bị đụng tới, `npm test` từ 195 lên 208 bài, không có function Vercel nào tăng thêm, không đổi hành vi (chỉ 1 ngoại lệ: sửa 1 bug thật phát hiện trong lúc gộp code, xem Phần 9). Trước đó, dự án vừa trải qua 2 sự cố production liên tiếp trong cùng một ngày (2026-07-11): Supabase project tự pause vì log phình dung lượng, và một lỗ hổng thiết kế đồng bộ khiến 1 phiên tập trung thật bị mất — cả hai đều đã được xử lý tận gốc (không phải vá tạm), chi tiết ở Phần 11.

## Những tính năng nổi bật

1. **Hệ thống phần thưởng đa tầng chống lạm phát**: mỗi phút tập trung sinh ra XP + EP + tài nguyên thô + RP (điểm nghiên cứu), qua một công thức có nhiều tầng nhân (độ dài phiên, kỹ năng, di vật, prestige, "trump" ngẫu nhiên) nhưng LUÔN bị chặn bởi một trần cứng tổng (`XP_FACTOR_HARD_CAP = 4.25`, `EP_FACTOR_HARD_CAP = 2.5`), cộng thêm cơ chế "chỉ một hiệu ứng bùng nổ áp dụng mỗi phiên" (Dồn Lực) để 3 hiệu ứng ngẫu nhiên không bao giờ nhân dồn vào nhau thành một phiên thưởng >10 lần bình thường.
2. **Hệ thống tiến triển theo chiều dọc**: 6 nhánh kỹ năng × 4 bậc, 15 kỷ nguyên với "khủng hoảng kỷ nguyên" (chọn hy sinh tài nguyên hoặc "thách đấu" để đổi lấy di vật vĩnh viễn), prestige (làm lại từ đầu để lấy bonus vĩnh viễn +5%/lần, tối đa 10 lần).
3. **AI Coach chạy trên Gemini (đám mây) với lưới chống-bịa số tất định nhiều tầng** — đây là hệ thống phức tạp và được đầu tư kỹ lưỡng nhất dự án (xem Phần 6). Nguyên tắc cốt lõi: AI CHỈ ĐƯỢC PHÉP diễn đạt lại số liệu đã tính sẵn bởi code thuần (không AI), không bao giờ được tự "tính" hay "đoán" số.
4. **Đồng bộ đa thiết bị "First Action Wins"** qua Supabase, dùng cơ chế compare-and-swap dựa trên version tăng phía server (không dựa đồng hồ máy khách) — được thiết kế lại sau một sự cố mất dữ liệu thật (Phần 11).
5. **Web Push tới iPhone** (qua PWA cài vào Home Screen) cho thông báo hoàn thành phiên, và một cron hằng ngày cảnh báo "chuỗi ngày sắp đứt" nếu hôm đó chưa làm phiên nào.
6. **Electron companion app trên Mac** — chỉ để hiện đồng hồ đếm ngược trên thanh menu bar, đọc trạng thái qua Supabase Realtime, KHÔNG chứa logic game riêng.
7. **Bốn "skin" giao diện** (Editorial/Aurora/Ink&Gold/Swiss) chọn được trong Cài đặt, dùng biến CSS để đổi toàn bộ giao diện mà không phải viết lại từng component.

## Những tính năng đang phát triển

Hiện tại **không có tính năng lớn nào đang dang dở** — chuỗi 6 mảng nâng cấp AI Coach (2026-06-25) đã hoàn tất và thực sự chạy trên production (xác nhận 2026-07-11, xem Phần 11 về vụ deploy fail âm thầm). Việc còn tồn đọng chỉ là một backlog UI nhỏ (xem Phần 12) và một quyết định có chủ đích hoãn lại: tách nhỏ `gameStore.js` (God File, xem Phần 9) — hoãn vì rủi ro cao hơn lợi ích ở quy mô 1 người dùng hiện tại, không phải vì thiếu thời gian.

## Những tính năng đã loại bỏ

Đây là phần quan trọng để một AI mới không "vô tình đề xuất lại" thứ đã bị gỡ có chủ đích:
- **Toàn bộ các lối tiếp cận AI khác trước khi chốt Gemini-only**: engine luật giả lập câu nói theo tính cách (strict/zen/buddy) gọi là `coachVoice.js`; bộ trả lời theo luật cũ (`generateCoachBriefing`/`generateCoachInsight`); gọi Anthropic Claude API trực tiếp (`api/coach.js` bản cũ + `buildCoachContext`); model nhúng ngữ nghĩa MiniLM (`@huggingface/transformers`, 118MB, từng làm crash iPhone thật theo issue công khai); và **Qwen2.5-3B chạy on-device qua WebLLM** (từng là hướng chính, sau đó bị gỡ hoàn toàn ngày 2026-06-24 khi chuyển hẳn sang Gemini đám mây, vì lý do "3B ngu + tốn RAM/đĩa máy" theo lời Đàm). Tất cả các phiên bản cũ này ĐÃ BỊ XOÁ SẠCH khỏi repo — đừng khôi phục trừ khi được yêu cầu rõ ràng.
- **⚡Nhanh** (một engine hỏi-đáp offline dựa trên luật/router ý định, không dùng LLM) — bị gỡ cùng đợt dọn dẹp 2026-06-21 khi Đàm quyết định "chỉ dùng Qwen" (giai đoạn trước khi chuyển sang Gemini).
- **Bốn công cụ vận hành cục bộ cũ**: `serve-dist.mjs`, LaunchAgent local server — vẫn còn trong repo (không xoá) nhưng bị coi là legacy, KHÔNG phải luồng sử dụng hằng ngày (xem quy tắc "KHÔNG làm" ở CLAUDE.md).
- **`.vercelignore`-only fix cho lỗi vượt trần function** — một bản vá tạm đã bị Đàm bác bỏ có chủ đích để buộc sửa gốc (xem Phần 10, quyết định #Vercel-function-limit).

## Vì sao project tồn tại

Không phải để kiếm tiền, không phải một sản phẩm SaaS — đây là công cụ cá nhân được xây với tinh thần "làm cho đến khi thật sự tốt", trong đó bản thân quá trình xây dựng (làm việc với AI coding agent qua rất nhiều phiên, mỗi phiên đều ghi chép lại quyết định và bài học) cũng là một phần giá trị của dự án. Sự tồn tại của các tài liệu bàn giao cực kỳ chi tiết (CLAUDE.md, BAN_GIAO.md, và giờ là tài liệu này) phản ánh đúng bản chất đó: đây là một dự án được "nuôi" liên tục qua nhiều phiên AI độc lập, không có một đội ngũ kỹ sư liên tục theo dõi context — tài liệu CHÍNH LÀ cơ chế duy trì tính liên tục.

---

# PHẦN 2 — TỔNG QUAN KIẾN TRÚC

Hãy hình dung dự án như 3 lớp đồng tâm: (1) một **engine game thuần** (không phụ thuộc UI/framework, test được độc lập) nằm ở lõi; (2) một **store Zustand** bọc quanh engine đó, quản lý state và side-effect; (3) **UI React** hiển thị store đó. Song song, có một trục thứ hai chạy xuyên suốt: **đồng bộ + AI + thông báo**, nối app này với thế giới bên ngoài (Supabase, Gemini, trình duyệt/OS notification).

## Frontend
React 18 + Vite, build ra một Progressive Web App (PWA) tĩnh, deploy trên Vercel như static hosting. Toàn bộ logic chạy trong trình duyệt — không có server-side rendering. State toàn cục nằm trong 2 Zustand store: `gameStore.js` (toàn bộ dữ liệu game — cực lớn, xem Phần 9) và `settingsStore.js` (cài đặt UI: theme, skin, âm thanh — tách riêng có chủ đích để không lẫn với dữ liệu game). Cả hai đều dùng `zustand/persist` để tự động lưu vào `localStorage` dưới key `dc-pomodoro-v1` (vẫn đọc được key cũ `civjourney-v1` để không mất dữ liệu người dùng cũ từ trước khi đổi tên app). Routing không dùng React Router — đây là app một-trang với state `activeTab` chọn giữa các "màn hình" (Focus/Kỹ năng/Thống kê/Kho báu/Thành tích/Cài đặt), mỗi màn hình là một component lớn.

## Backend
Không có backend truyền thống theo nghĩa server luôn chạy. "Backend" ở đây là **Vercel Serverless Functions** — các file trong `api/`, mỗi file là một hàm chạy theo yêu cầu (cold-start), không giữ trạng thái giữa các lần gọi. Có đúng 10 hàm: `api/coach.js` (cổng gọi Gemini), `api/coach-digest.js` (cron cảnh báo chuỗi), `api/keepalive.js` (cron giữ Supabase không tự pause), và 7 route dưới `api/push/` (đăng ký/huỷ/lên lịch/huỷ lịch/gửi push, cộng route lấy public key). Toàn bộ logic nghiệp vụ thật (điểm số, XP, streak...) không hề chạy trên các hàm này — chúng chỉ phục vụ 2 việc: gọi AI hộ client (giấu API key) và gửi thông báo đẩy.

## Electron
Một app đồng hành (companion app) CHỈ chạy trên Mac, KHÔNG chứa cửa sổ/dock icon riêng — nó chỉ hiện một icon trên thanh menu bar hiển thị đồng hồ đếm ngược của phiên đang chạy. Nó không tự tính toán gì — nó đọc một dòng dữ liệu duy nhất từ bảng Supabase `timer_live` qua Realtime subscription, và tự nội suy số giây còn lại cục bộ mỗi giây (để không phải nhận cập nhật mỗi giây từ server). Khi người dùng click vào icon tray, nó mở app web thật (`pomodoro-dc.vercel.app`) trong trình duyệt mặc định — **Electron không chứa bất kỳ bản sao logic game nào**, đây là quy tắc kiến trúc tuyệt đối (xem Phần 14).

## Vercel
Nền tảng hosting chính, tự động deploy mỗi khi `git push` lên `main` (tích hợp GitHub). Có một ràng buộc hạ tầng quan trọng chi phối cấu trúc `api/`: gói Hobby (miễn phí) giới hạn **12 Serverless Functions/deploy**, và Vercel (ở chế độ build "Other"/không framework cho thư mục `api/`) coi MỌI file `.js` nằm trực tiếp trong `api/` là một function riêng — TRỪ file/thư mục có tên bắt đầu bằng `_`. Đây là lý do toàn bộ helper dùng chung (`api/_lib/`) và test (`api/_tests/`) phải đặt trong thư mục tiền tố gạch dưới — xem Phần 10 để hiểu đầy đủ quyết định này và sự cố nó từng gây ra.

## Supabase
Đóng 3 vai trò khác nhau, đừng nhầm lẫn: (1) **kho lưu trữ đồng bộ** — bảng `game_state` (1 dòng, JSONB, có cột `version` tăng bởi trigger server để chống ghi đè, xem Phần 8); (2) **kênh Realtime** — bảng `timer_live` (1 dòng) mà Electron subscribe để biết đồng hồ đang chạy; (3) **hạ tầng cron nội bộ** (pg_cron) — chạy một job mỗi 5 giây gọi lại endpoint push-dispatch như một lớp dự phòng độc lập với webhook (xem Phần 7). Supabase còn tự động fire một Database Webhook khi bảng `timer_live` được UPDATE, đó là đường dẫn kích hoạt chính (không phải duy nhất) cho việc gửi push thông báo.

## AI
Một cổng duy nhất: Google Gemini, gọi qua `api/coach.js` (server giữ API key). Có 2 điểm vào từ UI (Hỏi Coach = chat hội thoại; AI phân tích tổng thể = báo cáo 4 phần) và một điểm vào chủ động thứ ba (Coach tự nhắc sau mỗi phiên). Toàn bộ 3 điểm vào đều đi qua CÙNG một "bộ não" thuần luật (prompt cố định + lưới chống-bịa tất định + tầng số liệu đã tính sẵn) — Gemini KHÔNG BAO GIỜ tự tính số, chỉ được phép diễn đạt lại số đã có. Chi tiết đầy đủ ở Phần 6.

## Storage
Ba tầng lưu trữ độc lập, mỗi tầng phục vụ mục đích khác nhau: `localStorage` (bản sao local tức thời, luôn có sẵn kể cả offline), Supabase `game_state` (bản đồng bộ đám mây, nguồn thật khi có xung đột nhiều thiết bị), và file JSON export/import thủ công (bản sao lưu tay, người dùng tự tải về/nạp lại). Cả 3 đường đều phải đi qua đúng MỘT hàm chuẩn hoá `normalizePersistedGameState` trước khi ghi vào state sống — đây là "phễu an toàn" duy nhất chống dữ liệu hỏng/cũ/thiếu trường phá vỡ app (xem Phần 9).

## Notification
Ba cơ chế thông báo tách biệt hoàn toàn, đừng nhầm lẫn: (1) **In-tab Notification API** (`src/engine/notifications.js`) — chỉ hoạt động khi tab đang mở (kể cả nền), dùng cho "hoàn thành nghỉ giải lao"/"cấp độ mới" ngay trong phiên; (2) **Web Push** (`api/push/`) — hoạt động cả khi tab/app đã đóng hẳn, dùng cho "phiên tập trung đã xong" và "chuỗi ngày sắp đứt"; (3) **Electron native notification** (macOS) — do chính Electron tự phát hiện khi bảng `timer_live` đổi từ đang-chạy sang đã-hoàn-thành, độc lập với Web Push. Chi tiết Phần 7.

## Realtime
Chỉ dùng cho một việc: Electron subscribe bảng `timer_live` qua Supabase Realtime (`postgres_changes`) để cập nhật tray tức thời khi trạng thái timer đổi trên thiết bị khác. Việc đồng bộ TOÀN BỘ dữ liệu game (không chỉ timer) giữa các thiết bị KHÔNG dùng Realtime — nó dùng một cơ chế push/pull chủ động có debounce (xem Phần 8), vì dữ liệu game đầy đủ lớn hơn và không cần cập nhật tức thời từng field.

## Authentication
**Không có** — vì chỉ có một người dùng, không có đăng nhập/đăng ký nào trong app. "Xác thực" duy nhất tồn tại là ở tầng hạ tầng: các Vercel Cron job (keepalive, coach-digest, push-dispatch fallback) bảo vệ bằng một `CRON_SECRET` dùng chung, kiểm tra qua `isCronAuthorized()` — chỉ để đảm bảo không ai bên ngoài gọi được các endpoint cron này tuỳ tiện, không phải hệ thống phân quyền người dùng.

## Deployment
`git push origin main` → GitHub → Vercel tự build (`vite build`) và deploy. Không có staging environment riêng — chỉ có Production và Preview (Preview tự sinh cho mỗi PR nếu có, nhưng workflow thực tế của dự án này là commit thẳng lên `main`). **Bài học quan trọng**: một lần build fail (do vượt trần function Vercel) đã khiến Vercel âm thầm GIỮ NGUYÊN bản deploy cũ trong 2 tuần rưỡi mà không có cảnh báo hiển nhiên nào cho người dùng — từ đó có quy tắc bắt buộc: sau mỗi lần push, PHẢI xác nhận trực tiếp trên tab Deployments của Vercel dashboard rằng bản mới hiện "Ready" (xem Phần 11).

## Build
Vite, output tĩnh + service worker PWA (`vite-plugin-pwa`, chế độ `generateSW`) tự sinh cache offline (~1.6MB precache). Có `manualChunks` để tách các thư viện nặng (từng dùng cho WebLLM/transformers.js, giờ không còn cần vì đã gỡ) và `globIgnores` để loại các file không nên precache. `npm install` cần flag `--legacy-peer-deps` (một số peer dependency xung đột phiên bản, đã chấp nhận sống chung).

## Testing
Node built-in test runner (`node --test`), KHÔNG dùng Jest/Vitest/Playwright — một lựa chọn nhẹ, phù hợp quy mô dự án. Test file được liệt kê TƯỜNG MINH trong glob của script `npm test` ở `package.json` (không tự động tìm mọi `*.test.js` trong repo) — nghĩa là **thêm test file ở thư mục mới bắt buộc phải cập nhật glob này**, nếu không test đó sẽ không bao giờ chạy mà cũng không ai biết. 208 bài test hiện tại phủ: công thức game (`gameMath`), store actions phức tạp (`gameStore`), toàn bộ lưới chống-bịa AI Coach (`coachEval`), sync compare-and-swap logic, các helper API. Không có test E2E (Playwright từng được thử nhưng không có cấu hình chính thức trong repo — thư mục `test-results/` cũ đã bị xoá khỏi git vì là rác test thủ công lỡ commit).

## Monitoring / Analytics
**Không có hệ thống giám sát/phân tích chuyên dụng nào** (không Sentry, không Google Analytics, không dashboard lỗi). Đây là một khoảng trống có chủ đích chấp nhận ở quy mô 1 người dùng — cách "giám sát" thực tế của dự án là: Đàm tự báo lỗi khi anh gặp trong lúc dùng thật, và các phiên AI xác minh qua `npm test`/build log/Vercel dashboard/Supabase dashboard trực tiếp. Đây là một khoảng trống đáng lưu ý cho bất kỳ ai cân nhắc mở rộng dự án ra nhiều người dùng trong tương lai — xem Phần 12 (Technical Debt) và Phần 17 (Roadmap).

---

# PHẦN 3 — CẤU TRÚC THƯ MỤC

*(Xem thêm `PROJECT_STRUCTURE.md` trong repo — nội dung dưới đây tóm tắt lại có giải thích sâu hơn cho một AI chưa từng thấy code.)*

```
src/
├── components/       # Component React — mỗi file lớn là 1 màn hình/mảnh UI lớn
│   ├── shared/        # Component/style DÙNG CHUNG giữa ≥2 file khác (mới, từ đợt refactor 07-12)
│   └── icons/          # Bộ icon SVG tự vẽ (thay emoji), tách component khỏi dữ liệu markup
├── engine/            # Logic THUẦN — không JSX, không Zustand, không side-effect, TEST ĐƯỢC ĐỘC LẬP
│   └── coach/          # TOÀN BỘ "bộ não" AI Coach (model-agnostic — hiện chạy Gemini)
├── hooks/             # Cầu nối React ↔ store/engine (useTimer, useCoachContext...)
├── lib/               # Tích hợp dịch vụ NGOÀI (Supabase, sync, push) — KHÔNG phải logic game thuần
├── store/             # 2 Zustand store: gameStore.js (khổng lồ) + settingsStore.js
└── utils/             # Tiện ích thuần dùng nhiều nơi, không đặc thù domain game

api/                   # Vercel Serverless Functions — MỖI file .js trực tiếp = 1 function thật
├── _lib/               # Helper dùng chung — KHÔNG bị đếm vào trần 12 function (tiền tố _)
└── _tests/             # TOÀN BỘ test của api/ — cũng không bị đếm (tiền tố _)

electron/              # App phụ Mac (tray icon), KHÔNG chứa logic game
public/                # Asset tĩnh + service worker push + manifest PWA
scripts/               # Công cụ dev chạy tay (không vào app khi build) — vd sinh VAPID key, soi bảng số liệu Coach
supabase/              # File SQL chạy TAY trong Supabase SQL Editor — KHÔNG tự động migrate
```

## Giải thích các thư mục đặc biệt

**`src/engine/`** là trái tim triết lý kiến trúc của dự án: mọi công thức/quy tắc game (điểm số, streak, softcap, phân tích thống kê, ngay cả lưới chống-bịa của AI Coach) đều là **hàm thuần** — không gọi `Date.now()` trực tiếp (nhận qua tham số để test được xác định/deterministic), không phụ thuộc React, không phụ thuộc Zustand. Lý do tồn tại: những công thức này là phần dễ sai và khó phát hiện lỗi nhất của cả app (một lỗi tính XP sai sẽ không crash gì cả — nó chỉ âm thầm cho điểm sai), nên chúng cần được cô lập để test tự động phủ được, độc lập với UI.

**`src/engine/coach/`** (thư mục mới nhất, gom lại từ đợt refactor 2026-07-12) chứa toàn bộ hệ thống AI Coach: `prompt.js` (2 khung prompt hệ thống), `guard.js` (lưới chống-bịa số/chữ lạ — phần được đầu tư kỹ nhất dự án), `guardedGenerate.js` (pipeline dùng chung 3 lối vào Coach), `cloudEngine.js` (cổng gọi Gemini), `coachContext.js`/`coachIntel.js` (tầng số liệu đã tính sẵn nạp cho AI), `coachSuggest.js` (gợi ý câu hỏi tiếp theo, thuần luật), `coachAdviceMemory.js` (bộ nhớ lời khuyên theo thời gian). Trước đợt refactor này, các file này rải rác giữa `src/engine/llm/` và `src/engine/` gốc — việc gom lại KHÔNG đổi hành vi (đã verify điểm chấm anti-bịa giữ nguyên 100%/0% sau khi dời).

**`api/_lib/` và `api/_tests/`** tồn tại vì một ràng buộc hạ tầng cụ thể (trần 12 function Vercel) — xem Phần 2 và Phần 10. Đây KHÔNG phải quy ước "đẹp" tuỳ ý — nó là fix bắt buộc sau một sự cố deploy fail thật.

**`scripts/`** chứa công cụ dev một-lần chạy tay, không vào bundle production: `push:keys` (sinh khoá VAPID cho Web Push), `coach-sample.mjs` (dựng lịch sử mẫu ~24 giờ rồi in ra đúng bảng số liệu mà Gemini nhận được — công cụ "mắt soi" để kiểm tra tầng ngữ cảnh AI Coach mà không cần chạy app thật hay đụng dữ liệu Supabase thật).

**`supabase/`** chứa các file `.sql` PHẢI được chạy TAY qua Supabase SQL Editor — không có cơ chế migration tự động (không dùng Prisma/Drizzle hay bất kỳ ORM/migration framework nào). Đây là một điểm dễ quên: deploy code mới nếu phụ thuộc một cột/bảng mới (ví dụ cột `version` cho sync) mà quên chạy file SQL tương ứng trước, app sẽ lỗi ngay lập tức trên production (`column "version" does not exist`) cho tới khi SQL được chạy tay.

## Không có folder legacy hay chuẩn bị loại bỏ nào còn tồn tại đáng chú ý

Đợt refactor 2026-07-12 đã dọn sạch: `src/engine/llm/` (đã gom hết vào `src/engine/coach/`), các component chết (`EraHUD.jsx`, `ParticleBackground.jsx`, `DCPomodoroBrand.jsx`), asset brand cũ, `electron/preload.js` chết, và một khối 772 dòng code chết (`OverviewTabLegacy`) trong `StatsDashboard.jsx`. Hai công cụ được coi là "legacy nhưng vẫn giữ" (không phải chuẩn bị xoá, chỉ là không dùng hằng ngày): `scripts/serve-dist.mjs` và LaunchAgent local server — chỉ đụng vào khi thật sự cần một luồng chạy local đặc biệt.

---

# PHẦN 4 — DOMAIN KNOWLEDGE

Đây là phần giải thích "thế giới" của game — ý nghĩa, trách nhiệm, dữ liệu, và module liên quan của từng khái niệm.

## Pomodoro / Session (Phiên tập trung)

Đơn vị nguyên tử của toàn bộ hệ thống. Một "phiên" là một lượt tập trung liên tục (có thể có nhiều lần tạm dừng ở giữa — xem `pauseSegments` bên dưới), ở một trong hai chế độ: **Pomodoro** (đếm ngược tới một độ dài đặt trước — 15/25/52/90 phút theo các preset "Khởi động/Chuẩn/Sâu/Rất sâu", hoặc tuỳ chỉnh) hoặc **Stopwatch** (đếm lên tự do, người dùng tự bấm "Hết Phiên"). Mỗi phiên có: độ dài đã tính công (credited minutes — với Pomodoro không bao giờ vượt quá độ dài đặt trước dù chạy quá giờ; với Stopwatch là toàn bộ thời gian thật), một danh mục (category) được gắn nhãn, một "mục tiêu phiên" bắt buộc phải viết trước khi bắt đầu (tối thiểu 10 ký tự — ép người dùng thật sự nghĩ về việc sẽ làm gì, không chỉ bấm nút), một ghi chú tự do, và (sau khi hoàn thành) một đánh giá hồi tố "có đạt mục tiêu không" do chính người dùng tự chấm. Dữ liệu liên quan: mỗi phiên hoàn thành trở thành một entry trong mảng `history` của `gameStore` — đây là "sổ cái" nguồn thật duy nhất mà gần như mọi hệ thống khác (thống kê, thành tích, nhiệm vụ, AI Coach) đọc lại để tính toán, KHÔNG có hệ thống nào lưu trạng thái tổng hợp độc lập không thể suy ra lại từ `history`.

**Pause segments** — mỗi lần tạm dừng/tiếp tục trong một phiên được ghi lại thành một mục `{startedAt, endedAt, durationMs}`. Đây là dữ liệu tương đối mới (không phải mọi phiên cũ đều có trường này) và được dùng cho một tín hiệu phân tích riêng: "phiên liền mạch vs. ngắt quãng" (xem phần Insight bên dưới) — quy tắc quan trọng: phiên KHÔNG có trường này (dữ liệu cũ) phải bị LOẠI khỏi phép tính, không được coi mặc định là "liền mạch", nếu không sẽ thổi phồng sai tỉ lệ.

## Mission (Nhiệm vụ) / Daily Goal / Weekly Goal

Mỗi ngày người dùng nhận đúng **3 nhiệm vụ ngày** được chọn một cách "ngẫu nhiên nhưng có kiểm soát" — một PRNG hạt giống theo ngày (để cùng một ngày luôn ra cùng 3 nhiệm vụ dù tính lại nhiều lần) chọn 1 từ mỗi "bucket" (core/stretch-hoặc-rare/variety), với một cơ chế chống lặp nhìn lại 8 ngày gần nhất để tránh nhàm chán. Nhiệm vụ tự động hoàn thành khi tiến độ đạt mục tiêu (không cần bấm "nhận" — XP được cộng ngay khi phiên hoàn thành), riêng phần thưởng "hoàn thành cả 3" cần bấm nhận tay. Song song có **chuỗi nhiệm vụ tuần** (Weekly Chain) — 8 câu chuyện cố định xoay vòng, mỗi chuỗi 4 bước, phần thưởng lớn dồn vào bước cuối để "step-by-step nhỏ, payoff lớn ở cuối" (chống lạm phát từng bước nhỏ). Điểm thiết kế quan trọng nhất của toàn hệ thống nhiệm vụ: **trạng thái "đã hoàn thành/đã nhận" KHÔNG BAO GIỜ được tin là sự thật tuyệt đối** — nó luôn được TÁI TÍNH từ `history` thật mỗi lần đọc (hàm `rebuildMissionsFromHistory`), nên nếu một phiên bị xoá sau khi đã nhận thưởng nhiệm vụ, phần thưởng đó tự động bị thu hồi lại (kể cả XP đã cộng). Đây là cơ chế tự-vá chống gian lận/hỏng dữ liệu, không phải cơ chế nhiệm vụ thông thường.

"Daily Goal" trong ngữ cảnh này không phải một khái niệm tách biệt — nó là "mục tiêu số phiên/phút mỗi ngày" mà người dùng tự đặt (dùng để tính "đạt mục tiêu ngày" trong thống kê và để AI Coach hiệu chỉnh gợi ý), khác với "mục tiêu phiên" (goal của TỪNG phiên riêng lẻ, câu văn mô tả việc sẽ làm).

## Achievement (Thành tích)

360 thành tích cố định, chia 14 danh mục × 5 bậc hiếm (đồng/bạc/vàng/bạch kim/kim cương). Mỗi thành tích có một hàm `check(snapshot, unlockedIds)` thuần kiểm tra một "ảnh chụp" (snapshot) số liệu trọn đời. Có một chi tiết tinh vi quan trọng: các thành tích loại "meta" (tự tham chiếu tới chính danh sách thành tích đã mở, ví dụ "mở khoá 300 thành tích") nhận `unlockedIds` là danh sách TRƯỚC lượt kiểm tra này — để tránh một meta-achievement tự mở khoá đệ quy ngay trong cùng một lượt tính. Việc mở khoá kích hoạt một hàng đợi hiển thị (`ui.achievementQueue`) — nếu nhiều thành tích mở cùng lúc, chúng hiện popup TUẦN TỰ từng cái 3.5 giây, không hiện chồng lên nhau.

## XP / Level / EP

**XP** (kinh nghiệm) là đơn vị "nhanh" — mỗi 6000 XP lên 1 cấp (level), mỗi lần lên cấp cho 2 điểm kỹ năng (SP). **EP** (điểm kỷ nguyên) là một đơn vị RIÊNG BIỆT, cố ý được thiết kế "nén" hơn XP để cân bằng nhịp độ toàn game — cả hai bắt đầu cùng tốc độ cơ bản/phút nhưng có bậc nhân khác nhau (XP nhân mạnh hơn ở bậc cao), khiến XP lạm phát nhanh hơn EP theo thời kế hoạch — đây CHÍNH LÀ đòn bẩy cân bằng để hành trình 15 kỷ nguyên kéo dài cỡ 1 năm sử dụng thật thay vì vài tuần. Cả level và XP đều **thuần đơn điệu tăng theo tổng XP trọn đời** — nghĩa là chúng luôn có thể tính lại từ đầu một cách an toàn (không cần lưu trạng thái trung gian), điều này quan trọng cho cả cơ chế replay lịch sử thành tích lẫn khả năng phục hồi sau lỗi dữ liệu.

## Statistics / Heatmap / Insight / Analytics

Đây là cả một lớp phân tích tách biệt khỏi phần "chơi game", sống chủ yếu ở `src/engine/gameMath.js` (tầng tín hiệu thô) và `src/engine/coach/coachIntel.js` (tầng xếp hạng/dự đoán có độ tin cậy). **Nguyên tắc tối cao xuyên suốt cả lớp này**: KHÔNG BAO GIỜ tuyên bố một phát hiện từ mẫu dữ liệu quá nhỏ, và KHÔNG BAO GIỜ nói nhân-quả — chỉ nói tương quan. Cơ chế thực thi nguyên tắc này gồm hai tầng: (1) mỗi hàm tín hiệu (giờ vàng, xu hướng tuần, phiên bị bỏ dở, hiệu chỉnh mục tiêu, chuỗi liền mạch...) có một ngưỡng cỡ mẫu tối thiểu RIÊNG, được cân nhắc và ghi chú lý do cụ thể (ví dụ "giờ vàng" cần ≥4 mẫu mỗi khung giờ VÀ phải hơn khung giờ nhì ≥15 điểm phần trăm mới được công bố) — dưới ngưỡng, hàm trả về `null` thay vì đoán liều; (2) khi cần XẾP HẠNG các ứng viên (ví dụ khung giờ nào "tốt nhất"), hệ thống dùng **cận dưới Wilson** (z=1.96) thay vì tỉ lệ thô, để một mẫu nhỏ hoàn hảo (3/3) không thể thắng một mẫu lớn hơn hơi kém hoàn hảo hơn (18/24) — nhưng con số THỰC SỰ HIỂN THỊ cho người dùng luôn là tỉ lệ quan sát thô, Wilson chỉ dùng nội bộ để xếp hạng. **Heatmap** tồn tại ở 2 chỗ khác nhau với mục đích khác nhau: heatmap 16 tuần ở tab Tổng Quan (cái nhìn nhanh ~4 tháng gần nhất) và heatmap 365 ngày ở tab Tập Trung (cái nhìn cả năm, chỉ hiện khi đủ dữ liệu — người dùng mới ít phiên sẽ thấy một dạng "compact timeline" ngắn hơn thay vì một lưới gần như trống).

## Coach (AI Coach)

Xem Phần 6 để có giải thích đầy đủ — ở đây chỉ tóm ý nghĩa domain: Coach không phải một tính năng "trò chuyện cho vui", nó là một "chuyên gia phân tích dữ liệu cá nhân" đọc lại đúng những con số mà tầng Statistics/Insight ở trên đã tính sẵn và gác cổng, rồi diễn đạt lại bằng lời tự nhiên. Coach có 3 lối vào: **Hỏi Coach** (hội thoại tự do), **AI phân tích tổng thể** (báo cáo 4 phần theo yêu cầu), và **Coach tự nhắc** (chủ động sau mỗi phiên hoàn thành, không cần hỏi).

## Reminder / Notification

"Reminder" trong app này không phải là một tính năng lập lịch nhắc việc tổng quát — nó cụ thể là 2 thứ: (1) thông báo hoàn thành phiên/nghỉ giải lao (tức thời), (2) thông báo cảnh báo "chuỗi ngày sắp đứt" gửi mỗi chiều nếu hôm đó chưa có phiên nào hoàn thành (cron `coach-digest`, một dạng "Coach chủ động lúc người dùng vắng mặt"). Xem Phần 7 để phân biệt 3 cơ chế notification.

## Sync / Offline / Online

Xem Phần 8 (kiến trúc Sync) để có giải thích đầy đủ về cơ chế "First Action Wins". Về khái niệm domain: app hoạt động **offline-first cho phần game** (mọi thao tác ghi ngay vào state cục bộ trước, đồng bộ lên đám mây là một side-effect chạy nền có debounce) nhưng **online-only cho phần AI Coach** (mất mạng/hết quota Gemini = Coach ngừng hẳn, không còn lưới dự phòng chạy máy như thời còn Qwen). Đây là một đánh đổi CÓ CHỦ Ý, không phải thiếu sót — được chấp nhận đổi lấy việc AI Coach chạy được cả trên iPhone (mà không tốn RAM/đĩa của máy).

## Focus / Break

"Focus" (tập trung) là trạng thái chính của app khi một phiên Pomodoro/Stopwatch đang chạy — có một khái niệm UI gọi là "Focus tĩnh": khi đang chạy phiên, giao diện cố tình ẩn hết mọi huy hiệu/badge game (combo, multiplier tier, milestone) để "25 phút chỉ còn lại đồng hồ", giảm xao nhãng. "Break" (nghỉ giải lao) là một hệ thống timer HOÀN TOÀN RIÊNG, không dùng chung state machine với phiên tập trung — độ dài nghỉ được tính theo 2 chính sách khác nhau tuỳ chế độ: Pomodoro dùng chu kỳ cố định (nghỉ ngắn/dài theo số phiên đã hoàn thành), Stopwatch dùng bảng "Flowtime" (độ dài nghỉ tỉ lệ với số phút đã thực sự làm việc, càng làm lâu nghỉ càng dài).

## Game System / Reward / Penalty

Đây là "văn minh giả lập" bao trùm: XP/EP/tài nguyên thô/tài nguyên tinh chế/RP/TTCH là các loại tiền tệ; kỹ năng/công trình/di vật/prestige là các cách tiêu tiền tệ đó để tăng sức mạnh dài hạn; "khủng hoảng kỷ nguyên" và "thách đấu cấp bậc" là các sự kiện ép người chơi cam kết (hoàn thành N phiên trong X giờ) để đổi lấy phần thưởng lớn hơn, có rủi ro thật (mất tài nguyên) nếu thất bại — đây là "Penalty" (hình phạt) DUY NHẤT tồn tại trong game, và nó luôn được giới hạn theo % tài nguyên hiện có (1-5% cho huỷ phiên giữa chừng, tỉ lệ với % tiến độ đã chạy — huỷ sớm mất ít hơn), không bao giờ có thể khiến tổng tài nguyên âm hoặc mất nhiều hơn phiên đó đã đóng góp.

## Streak

Chuỗi ngày liên tiếp có ít nhất một phiên hoàn thành. Có một kỹ năng "Lá Chắn" cho phép bỏ qua 1 ngày mà không mất chuỗi (giới hạn số lần dùng). Chuỗi ảnh hưởng tới: một khoản thưởng XP tăng dần theo số ngày liên tiếp (trần ở ~15 ngày ≈ +18%, có thể nới bởi công trình), một cờ một-lần vĩnh viễn khi chuỗi lần đầu chạm 30 ngày ("Bền Vững", +5% thưởng vĩnh viễn từ đó), và một nhiệm vụ ẩn thưởng thêm XP nếu chuỗi ≥7 ngày. AI Coach cũng có riêng một tín hiệu "dự đoán khả năng giữ chuỗi hôm nay" dựa trên tần suất hành động vào đúng thứ trong tuần này ở các tuần trước (không trộn dữ liệu các thứ khác trong tuần).

---

# PHẦN 5 — LUỒNG DỮ LIỆU

## Timer Flow

Bắt đầu ở người dùng bấm "Bắt đầu phiên" trong `PomodoroEngine.jsx` (bị chặn nếu mục tiêu phiên chưa đủ 10 ký tự, hoặc nếu một "Khủng hoảng Kỷ nguyên" đang treo mà chưa chọn hướng xử lý) → `useTimer.start()` gọi `gameStore.prepareFocusSessionStart()` rồi khởi tạo các mốc thời gian dựa trên đồng hồ thật (không phải bộ đếm tick) → trạng thái được lưu ngay vào `gameStore.timerSession` (để sống sót qua reload) và đẩy lên Supabase `timer_live` (để Electron tray thấy) → mỗi giây, `useTimer` tự tính lại thời gian còn lại/đã trôi từ mốc gốc (không cộng dồn tick, tránh trôi số do tab bị treo) → khi đến 0 (Pomodoro) hoặc người dùng bấm "Hết Phiên" (Stopwatch), `finish()` được gọi → gọi `gameStore.completeFocusSession(...)` (hàm lớn nhất dự án, xử lý toàn bộ tính thưởng) → kết thúc ở một `history` entry mới được thêm vào, `timer_live` được cập nhật thành "đã hoàn thành" (kích hoạt push notification), và một break tự động có thể bắt đầu sau 500ms.

## Session Flow

Bắt đầu ở `completeFocusSession` nhận `(minutesFocused, categoryId, note, sessionTiming, sessionSnapshot)` → kiểm tra có đang trong "Khủng hoảng Kỷ nguyên" không (nếu có, rẽ nhánh hoàn toàn khác, không tính thưởng bình thường) → tính combo/momentum (phiên có nối tiếp phiên trước trong cửa sổ thời gian không) → gộp toàn bộ buff đang có (cấp bậc, di vật, prestige) → gọi `calculateRewards` (hàm thuần trong `gameMath.js`) để ra XP/EP/tài nguyên/RP → cộng thêm các lớp thưởng khác (đặt cược Overclock, công trình Kỳ Quan, sự kiện ngẫu nhiên) → kiểm tra/tiến triển Thách Đấu Cấp Bậc → cập nhật chuỗi ngày, tiến độ chuỗi nhiệm vụ tuần, hàng đợi chế tạo → tính tiến độ nhiệm vụ ngày và tự động nhận thưởng nhiệm vụ đã đạt → dựng "ảnh chụp thành tích" từ TOÀN BỘ lịch sử rồi so sánh để tìm thành tích mới mở khoá → kết thúc ở một `history` entry hoàn chỉnh được append và một object `pendingReward` được đẩy lên UI (hiện modal phần thưởng).

## Achievement Flow

Có 2 nhánh hoàn toàn tách biệt, không được gộp (xem Phần 9): (a) **real-time**: mỗi khi một phiên hoàn thành, `buildAchievementSnapshot` (gameStore.js) TÍNH LẠI TỪ ĐẦU toàn bộ số liệu từ `history`, so với danh sách đã mở khoá để tìm ID mới → thêm vào hàng đợi hiển thị popup tuần tự; (b) **replay lịch sử**: chạy khi app tải/nhập dữ liệu cũ có thành tích đã mở khoá nhưng KHÔNG có ngày mở khoá (dữ liệu từ trước khi tính năng ghi ngày ra đời) — `inferAchievementUnlockTimes` phát lại toàn bộ lịch sử theo thứ tự thời gian, dùng một bộ tích luỹ tăng dần (không tính lại từ đầu mỗi bước, vì đây chạy trên toàn bộ lịch sử một lần) để suy luận phiên nào là phiên đầu tiên thoả điều kiện mỗi thành tích còn thiếu ngày.

## Mission Flow

Mỗi ngày (theo giờ Việt Nam), nếu ngày lưu trong state khác ngày hôm nay → chọn lại 3 nhiệm vụ mới (PRNG hạt giống theo ngày + chống lặp 8 ngày gần nhất) → MỌI lần đọc trạng thái nhiệm vụ đều đi qua `rebuildMissionsFromHistory` để tái tính tiến độ từ `history` thật (không tin trạng thái đã lưu) → khi một phiên hoàn thành, tiến độ từng nhiệm vụ được cộng dồn ngay trong `completeFocusSession`, tự động đánh dấu hoàn thành nếu đạt mục tiêu, và cộng thẳng XP thưởng vào lượt thưởng của phiên đó (không cần bấm nhận riêng) → khi cả 3 nhiệm vụ đã xong, một nút "Nhận thưởng" xuất hiện cho phần thưởng gộp.

## Sync Flow

Xem Phần 8 chi tiết — tóm tắt luồng: mọi thay đổi state → lên lịch đẩy lên Supabase (debounce 5 giây, hoặc đẩy ngay lập tức cho các hành động nhạy cảm về độ trễ như bắt đầu/tạm dừng timer) → ghi kèm điều kiện "chỉ ghi nếu version phía server vẫn đúng như lần đọc gần nhất" → nếu bị từ chối (thiết bị khác đã ghi trước) → tự động kéo về bản đã thắng và ÁP DỤNG NÓ, không được phép ép ghi đè.

## Notification Flow / Push Flow

Bắt đầu ở `useTimer.start()`/`resume()`/`extendCurrentSession()` gọi `pushService.scheduleFocusCompletePush` → POST tới `/api/push/schedule`, tạo một dòng trong bảng `push_jobs` (khoá theo `jobKey` cố định cho loại job đó, để lần lên lịch lại thay thế chứ không chồng thêm) → độc lập, khi phiên hoàn thành thật, `timer_live` được UPDATE với `ended_reason='completed'` → cú UPDATE này kích hoạt Supabase Database Webhook gọi `api/push/dispatch.js` → hàm kiểm tra `isSessionEndEvent` (phân biệt hoàn thành thật với huỷ/reset) → nếu hợp lệ, claim job đến hạn trong `push_jobs` và gửi Web Push tới mọi thiết bị đã đăng ký. Song song, một cron Supabase gọi lại CHÍNH endpoint đó mỗi 5 giây làm lớp dự phòng độc lập, phòng khi webhook bị lỡ.

## Realtime Flow

Chỉ áp dụng cho Electron tray: khi bảng `timer_live` đổi, Supabase Realtime đẩy sự kiện `postgres_changes` tới `electron/main.js` đang subscribe → nó cập nhật mốc tham chiếu (`started_at`/`total_seconds`) và tự đếm ngược cục bộ mỗi giây từ đó, không phụ thuộc nhận cập nhật mỗi giây từ server.

## Database Flow

Ứng dụng KHÔNG có schema di trú tự động — mọi thay đổi cấu trúc bảng Supabase (thêm cột `version`, thêm cột `mode`/`ended_reason` cho `timer_live`...) đòi hỏi chạy tay một file `.sql` trong `supabase/` TRƯỚC KHI deploy code phụ thuộc vào nó, nếu không app sẽ lỗi ngay khi cố ghi vào cột chưa tồn tại.

## AI Coach Flow

Xem Phần 6 — tóm tắt: người dùng tương tác (hỏi câu hoặc bấm "phân tích tổng thể") hoặc một sự kiện tự động kích hoạt (phiên vừa hoàn thành, hoặc cron chiều tối phát hiện chuỗi treo) → tầng số liệu (`coachContext`/`coachIntel`) dựng một "bảng dữ liệu thật" từ `history` → ghép với prompt hệ thống cố định → gửi tới `api/coach.js` → Gemini trả lời → `guardedGenerate.js` chạy qua lưới sanitize + chống chữ lạ + chống bịa số (có thể yêu cầu Gemini viết lại một lần có hướng dẫn cụ thể chỉ ra số bịa) → nếu vẫn còn câu/dòng bịa sau khi thử lại, CẮT BỎ riêng câu/dòng đó (không xoá cả câu trả lời) → hiển thị cho người dùng.

## Offline Flow

Phần game: mọi hành động ghi ngay vào Zustand + localStorage, hoàn toàn hoạt động không mạng; đồng bộ lên đám mây chỉ là nỗ lực nền, thất bại không chặn UI. Phần AI Coach: mất mạng = lỗi hiển thị "mất mạng, thử lại" — không còn lối rẽ dự phòng chạy tại chỗ (khác thời còn Qwen).

## Startup Flow

`App.jsx` mount → Zustand `persist` tự rehydrate từ `localStorage` (qua `normalizePersistedGameState` làm hàm `merge`) → sau khi store "hydrated" xong (`storesHydrated`), `initSync()` chạy — pull dữ liệu mới nhất từ Supabase (có thể ghi đè bản local nếu đám mây có version mới hơn) → nếu có phiên timer đang treo dở từ trước khi đóng app (`timerSession.isRunning`), `useTimer`'s restore effect tính lại xem phiên đó đã kết thúc trong lúc đóng app chưa — nếu có, tự động chạy nốt luồng hoàn thành ngay lúc mở lại app.

## Shutdown Flow

Không có "graceful shutdown" chủ động — đóng tab/tắt máy không kích hoạt code nào chạy thêm. Đây CHÍNH LÀ LÝ DO thiết kế toàn bộ cơ chế "persist trạng thái timer + tính lại từ mốc thời gian gốc khi mở lại" (Phần Timer Flow ở trên) tồn tại: app phải giả định nó có thể bị đóng đột ngột bất cứ lúc nào, không có cơ hội dọn dẹp.

## Recovery Flow

Ba tình huống phục hồi khác nhau, tất cả đi qua `normalizePersistedGameState`: (a) mở lại app sau khi đóng đột ngột giữa phiên — timer tự tính bù; (b) nhập file JSON backup — qua màn hình xác nhận rõ ràng "sẽ ghi đè toàn bộ, không hoàn tác được"; (c) kéo dữ liệu từ Supabase khi thua trong xung đột đồng bộ — tự động, không cần xác nhận người dùng (vì đây là trạng thái ĐÚNG theo thiết kế "first action wins", không phải một tuỳ chọn).

## Error Flow

Không có một "error boundary" tập trung phức tạp — chiến lược chung là: (a) mọi lệnh gọi mạng (sync, push, AI) đều wrap try/catch và thoái lui về một thông báo lỗi thân thiện, KHÔNG BAO GIỜ để lỗi mạng chặn hành động timer cục bộ; (b) mọi dữ liệu từ nguồn không tin cậy (import/sync/localStorage cũ) đều đi qua chuẩn hoá phòng thủ thay vì crash; (c) có một cơ chế "runtimeRecovery" (`src/utils/runtimeRecovery.js`) bẫy lỗi runtime ở tầng ứng dụng.

---

# PHẦN 6 — KIẾN TRÚC AI

Đây là hệ thống được đầu tư công phu và trải qua nhiều vòng lặp nhất trong toàn dự án (ít nhất 6 đợt thiết kế lại lớn từ 2026-06-19 đến 2026-06-25, xem Phần 11 để có dòng thời gian đầy đủ). Nguyên tắc tối thượng, lặp đi lặp lại trong mọi tài liệu dự án: **"NIỀM TIN = TÀI SẢN QUÝ NHẤT"**. AI Coach không được phép mất niềm tin của người dùng bằng cách bịa số — thà im lặng/thiếu sót còn hơn nói sai.

## Prompt

Có đúng 2 prompt hệ thống cố định (`src/engine/coach/prompt.js`): `COACH_CHAT_SYSTEM` (cho hội thoại tự do "Hỏi Coach" — khung 3 nhịp: quan sát số → xu hướng/chân dung → 1 lời khuyên) và `COACH_OFFLINE_SYSTEM` (cho "AI phân tích tổng thể" — khung 4 phần bắt buộc: Quan sát/Xu hướng/Chân dung & mẫu hình/Thử nghiệm). Cả hai đều có các luật cứng nhúng ngay trong prompt: **"ĐỌC ĐÚNG GIÁ TRỊ"** (phải chép đúng nội dung sau dấu hai chấm trong bảng dữ liệu, không được tự suy diễn nhãn), **"TÊN MỤC ≠ NỘI DUNG"** (tên loại việc thật luôn đặt trong ngoặc kép để tránh nhầm với văn bản mô tả), **"KHÔNG CÓ SỐ THÌ NÓI KHÔNG CÓ"**, **"RANH GIỚI HỌC vs NÓI"** (chỉ được lấy số nằm giữa 2 dấu mốc `=== DỮ LIỆU THẬT ===` / `=== HẾT ===`, số trong các ví dụ minh hoạ prompt KHÔNG phải dữ liệu thật). Một điểm học được qua thất nghiệm thực tế: **KHÔNG dùng few-shot examples có số cụ thể** — từng thử và phát hiện model nhỏ (Qwen 3B thời đó) chép thẳng số trong ví dụ ra làm câu trả lời thật; giải pháp là dùng placeholder chữ cái (X/A/B/C) thay vì số thật trong mọi ví dụ minh hoạ.

## Memory (bộ nhớ)

Có 2 loại bộ nhớ khác nhau, đừng nhầm: (1) **bộ nhớ hội thoại ngắn hạn** — `CoachChat.jsx` lưu lịch sử chat vào `localStorage` (khoá `dc-coach-chat-v1`), nhưng các lượt "khôi phục" (đã lưu từ trước) CỐ Ý KHÔNG được đưa lại vào prompt gửi cho Gemini ở các lượt sau — để tránh "mồi" model bằng số cũ đã lỗi thời; (2) **bộ nhớ lời khuyên dài hạn** — `coachAdviceMemory.js`, cơ chế mới nhất và có giá trị cá nhân hoá cao nhất: mỗi khi Coach đưa ra lời khuyên chỉnh mục tiêu ngày, hệ thống ghi lại lời khuyên đó + số liệu tại thời điểm đó vào `localStorage`; sau ≥3 ngày (cửa sổ hợp lệ 3–21 ngày), một dòng "Ghi nhớ: khoảng N ngày trước gợi ý chỉnh mục tiêu về X... đối chiếu hiện tại... tương quan" tự động được chèn vào bảng dữ liệu — biến Coach từ "phân tích một lần" thành "theo dõi cam kết theo thời gian". Đây là hướng ưu tiên rõ ràng của Đàm cho các nâng cấp Coach tương lai (xem memory `coach-personalization-priority`).

## History (lịch sử)

Nguồn dữ liệu duy nhất Coach được phép đọc là mảng `history` (phiên tập trung thật) đã qua tầng `coachContext.js`/`coachIntel.js` xử lý thành một "bảng dữ liệu thật" dạng text, có giới hạn `COACH_MAX_CONTEXT_LINES = 18` dòng (cắt theo độ ưu tiên — giữ Tổng quan/Chân dung/Hôm nay + nhóm tín hiệu mạnh, cắt "Ghi chú" trước — KHÔNG cắt mù theo vị trí) để tránh làm model nhỏ "loạn" với bảng quá dài (bài học từ thời còn dùng model 3B on-device, vẫn giữ nguyên dù giờ dùng Gemini mạnh hơn nhiều).

## Evaluation (đánh giá)

Có một bộ chấm điểm tự động (`src/engine/coach/eval.test.js` + `coachEvalFixtures.js`) đẩy khoảng 30 câu mẫu (câu sạch/câu có số bịa/câu lẫn chữ nước ngoài) qua TOÀN BỘ lưới chống-bịa, đo 2 chỉ số mỗi lần `npm test`: **BẮT %** (recall — bắt được bao nhiêu % câu bịa thật) và **BÁO NHẦM %** (false positive rate — xoá oan bao nhiêu % câu SẠCH). Ngưỡng chất lượng đã chốt: **BÁO NHẦM PHẢI = 0%** (siết tuyệt đối — xoá oan một câu đúng nguy hiểm hơn bỏ sót một câu sai), **BẮT ≥ 90%**. Con số hiện tại (đã verify lại trong đợt refactor 2026-07-12): BẮT 16/16 (100%), BÁO NHẦM 0/16 (0%). Nếu một thay đổi làm điểm số này tụt, đó là dấu hiệu lưới đã bị nới lỏng quá tay và cần xem lại ngay.

## Guard (lưới chống-bịa) — phần quan trọng nhất

Sống ở `src/engine/coach/guard.js`, một tập hợp hàm THUẦN, TẤT ĐỊNH (không AI) chạy SAU khi Gemini trả lời, TRƯỚC khi hiển thị cho người dùng. Các lớp lưới, theo thứ tự phát triển và mức độ tinh vi:
1. **`findFabricatedNumbers`/`hasFabricatedNumbers`** — mọi con số kèm đơn vị dữ liệu (giờ/phút/phiên/ngày/tuần/lần/%/h) mà model viết ra nhưng KHÔNG tìm thấy trong bảng dữ liệu thật → coi là bịa. Có chuẩn hoá đơn vị (h/tiếng↔giờ, dấu phẩy↔chấm) để không báo nhầm do khác định dạng.
2. **`findFabricatedFractions`** — bắt các cặp phân số `N/M` bị ghép sai (ví dụ model viết "phiên sâu 7/18" trong khi bảng thật ghi "4/18") — có chừa lookbehind cho số thập phân để không nhầm "13.3" là một phân số.
3. **`findMismatchedPairs`** — bắt kiểu bịa tinh vi nhất: cả hai số ĐỀU có thật trong bảng, nhưng bị GHÉP SAI CẶP (ví dụ model viết "đạt 79% trên 18 phiên" trong khi 79% là tổng và 18 phiên là của một danh mục khác) — thiết kế BẢO THỦ, chỉ bắt cặp kề nhau rõ ràng, thà bỏ sót còn hơn báo nhầm (đã verify tay 9/9 câu diễn giải hợp lệ không bị báo nhầm).
4. **`hasForeignScript`** — bắt chữ Trung/Hàn/Nhật lẫn vào (di sản từ thời model nhỏ hay "trôi" ngôn ngữ — vẫn giữ vì không tốn gì để giữ).

**Chiến lược xử lý khi phát hiện bịa** (không phải "xoá sạch câu trả lời" — đây là một quyết định thiết kế quan trọng qua nhiều lần thử): (a) **viết-lại-CÓ-HƯỚNG-DẪN** — lần thử lại không phải "làm lại mù", mà CHÈN một lượt chỉ ĐÍCH DANH số nào bị coi là bịa, để model tự sửa có định hướng; (b) nếu vẫn còn bịa sau khi thử lại, **"cứu câu/cứu dòng"** thay vì huỷ toàn bộ — cắt bỏ RIÊNG câu (chế độ hội thoại) hoặc dòng (chế độ báo cáo 4 phần, giữ khung cấu trúc, phần rỗng thay bằng "chưa đủ dữ liệu") chứa số bịa, giữ lại phần còn lại vẫn sạch. Đây là kết quả của nhiều lần chỉnh sửa thực nghiệm — ban đầu hệ thống "nuke" (huỷ) toàn bộ câu trả lời khi phát hiện bịa, sau đó được tinh chỉnh để giữ được nhiều nội dung đúng hơn thay vì lãng phí toàn bộ câu trả lời vì một chi tiết sai.

**Những gì CỐ Ý KHÔNG làm** (đã cân nhắc và từ chối vì rủi ro báo nhầm cao hơn lợi ích): guard theo tên thực thể (kiểm tra tên danh mục có đúng không), kiểm tra cỡ mẫu ngay trong guard (việc đó thuộc về prompt + tầng số liệu), kiểm tra đơn vị kép ("20 phiên/tuần"), dung sai làm tròn số (giữ nguyên báo bịa cho "13.3" khi bảng ghi "13" — cố ý CHẶT CHẼ ở đây).

## Safety / Hallucination Prevention

Đã trình bày ở trên (Guard) — điểm bổ sung quan trọng: **toàn bộ số liệu mà Gemini nhận được đã được tính sẵn và gác cổng bởi tầng thuần luật `gameMath.js`/`coachIntel.js`** (xem Phần 4, mục Statistics/Insight) — nghĩa là Gemini không bao giờ được yêu cầu TỰ TÍNH bất cứ con số nào, chỉ được DIỄN ĐẠT LẠI số đã có sẵn trong bảng. Đây là lớp phòng thủ đầu tiên và quan trọng nhất — guard chỉ là lớp phòng thủ thứ hai bắt những trường hợp model vẫn cố "sáng tạo" thêm dù đã được cho số sẵn.

## Reasoning / Conversation

Không dùng chế độ "thinking"/chuỗi suy luận của Gemini 2.5 (`thinkingConfig.thinkingBudget: 0` bị ép tắt) — lý do thực nghiệm: bật thinking mặc định sẽ ngốn hết `maxOutputTokens` khiến câu trả lời thật bị CỤT hoặc RỖNG. "Conversation" (hội thoại nhiều lượt) chỉ tồn tại ở "Hỏi Coach" — mỗi lượt gửi kèm lịch sử hội thoại TRỪ các lượt đã khôi phục từ phiên trước (như đã nói ở mục Memory).

## Caching / Context

Không có cơ chế cache phản hồi AI (mỗi câu hỏi luôn gọi Gemini thật) — nhưng CÓ cache engine singleton ở tầng client cũ (thời Qwen on-device, giờ không còn áp dụng vì không còn model chạy máy). "Context" = bảng số liệu văn bản do `coachContext.js` dựng, giới hạn 18 dòng như đã nói.

## Gemini (nhà cung cấp model)

Chuỗi model tự động rơi xuống khi quá tải/hết lượt: `gemini-2.5-flash` (chính) → `gemini-2.5-flash-lite` → `gemini-2.0-flash` (dự phòng cuối, model đời cũ hơn nhưng RẤT ổn định, thêm vào vì cả 2 model 2.5 free hay CÙNG lúc bị lỗi 503 quá tải). Có một tầng model "deep" riêng CHỈ dùng cho "AI phân tích tổng thể" (bài khó nhất): thử `gemini-2.5-pro` trước rồi mới rơi về chuỗi flash — chat/nhắc thường vẫn dùng chuỗi flash nhanh+rẻ. `callModelOnce` gọi mỗi model ĐÚNG 1 LẦN không retry (triết lý: đổi sang model khác nhanh hơn là thử lại một model đang sập). Nhiệt độ giải mã: `temperature 0.2 · topP 0.8` — số này từng bị lệch thành 0.3/0.9 trong code so với tài liệu chủ trương, và đã được phát hiện + sửa lại đúng 0.2/0.8 (nhiệt độ thấp = model ít "chế" số/trôi hơn, phù hợp tác vụ chép-lại-số).

## Offline Mode / Fallback

**KHÔNG CÒN TỒN TẠI** kể từ 2026-06-24 (gỡ hẳn Qwen). Đây là một đánh đổi có chủ đích: mất mạng/hết quota/chưa cấu hình key = Coach hiển thị lỗi + nút "Thử lại", KHÔNG còn dự phòng chạy tại chỗ. Lý do: chạy một LLM on-device (dù chỉ 3B tham số) tốn RAM/đĩa đáng kể và KHÔNG chạy được trên iPhone (thiếu WebGPU) — đổi lấy việc Coach giờ chạy được TRÊN CẢ IPHONE và app nhẹ hơn hẳn.

## Rate Limit

Từng gặp lỗi 429 (vượt hạn mức) thường xuyên khi dùng Gemini free tier — đã giải quyết bằng cách BẬT BILLING (trả phí theo dùng, không phải trả phí cố định) cho API key, chi phí thực tế ước tính ~16-80 nghìn đồng/tháng cho một người dùng vài câu/ngày. Chuỗi fallback model (flash → flash-lite → 2.0-flash) cũng coi 429 là một lý do hợp lệ để rơi sang model kế tiếp trong CÙNG một lượt gọi.

---

# PHẦN 7 — KIẾN TRÚC NOTIFICATION

## Ba cơ chế tách biệt

1. **In-tab Notification API** (`src/engine/notifications.js`) — chỉ hoạt động khi tab đang mở (kể cả chạy nền). Dùng cho các sự kiện tức thời trong phiên: nghỉ giải lao xong, lên cấp, gặp thảm hoạ. Có yêu cầu quyền qua `requestPermission()` (phải gọi từ một hành động click thật của người dùng, không thể tự động), tự tắt tiếng (âm thanh xử lý riêng qua `soundEngine`), tự đóng sau 6 giây.
2. **Web Push** (`api/push/`) — hoạt động cả khi app/tab đã đóng hẳn. Đây là cơ chế phức tạp nhất, dùng cho 2 việc: thông báo "phiên tập trung đã xong" (tức thời) và thông báo "chuỗi ngày sắp đứt" (cron chiều tối). Trên iPhone, Apple CHỈ cho phép Web Push từ PWA đã "Add to Home Screen" — Safari mở trực tiếp không đủ điều kiện, và code có phát hiện trạng thái này để hướng dẫn người dùng.
3. **Electron native notification** (macOS) — Electron TỰ phát hiện một phiên vừa hoàn thành bằng cách so sánh dòng cũ/mới của `timer_live` nhận qua Realtime (dòng cũ đang chạy, dòng mới không chạy + không tạm dừng + lý do kết thúc = "completed" + không phải break) rồi tự hiện thông báo native của macOS — HOÀN TOÀN ĐỘC LẬP với luồng Web Push, cố tình lặp lại cùng logic kiểm tra chặt chẽ để tránh báo nhầm khi huỷ phiên.

## Cron

Ba cron job Vercel (gói Hobby giới hạn tối đa 1 lần/ngày cho Vercel Cron — nếu cần tần suất cao hơn phải dùng `pg_cron` bên Supabase như đã làm cho push-dispatch):
- `api/keepalive.js` — chạy 3h sáng mỗi ngày, gọi một query nhẹ vào Supabase để ngăn project tự "pause" do 7 ngày không hoạt động (sự cố thật đã xảy ra, xem Phần 11).
- `api/coach-digest.js` — chạy 17:00 giờ Việt Nam mỗi ngày, đọc `game_state`, kiểm tra nếu chuỗi ngày đang treo (còn chuỗi nhưng hôm nay theo giờ VN chưa có phiên nào hoàn thành) thì gửi push nhắc giữ chuỗi.
- Một `pg_cron` NỘI BỘ Supabase (không phải Vercel Cron) gọi lại `api/push/dispatch.js` mỗi **5 giây** — đây là lớp dự phòng cho việc gửi push hoàn thành phiên, KHÔNG phải cron chính (webhook mới là chính, xem dưới).

## Dispatch

`api/push/dispatch.js` được kích hoạt bởi HAI nguồn ĐỘC LẬP có chủ đích (dự phòng chéo): (1) Supabase Database Webhook fire khi `timer_live` được UPDATE — đường dẫn TỨC THỜI; (2) cron 5 giây nói trên — đường dẫn DỰ PHÒNG nếu webhook lỡ. Cả hai gọi cùng một hàm `runDispatch()`, dùng cùng cơ chế claim-job an toàn (đổi trạng thái job từ `scheduled` sang `processing` bằng một update có điều kiện, để webhook và cron không bao giờ gửi trùng một thông báo dù cùng chạy gần như đồng thời).

## Schedule

`api/push/schedule.js` nhận yêu cầu từ client, upsert một dòng vào bảng `push_jobs` khoá theo `jobKey` CỐ ĐỊNH theo loại job (ví dụ "focus-complete-push") — nghĩa là lên lịch lại (sau khi tạm dừng/tiếp tục) THAY THẾ dòng cũ chứ không tạo thêm dòng mới, tránh gửi trùng thông báo. Nội dung thông báo (title/body/tag) LUÔN được server tự dựng lại từ `focusMinutes` qua `src/engine/pushPayloads.js` (nguồn chung cho cả client lên lịch lẫn server gửi) — payload client gửi lên chỉ là gợi ý/xác nhận, KHÔNG được tin tưởng làm nội dung thật.

## Keepalive

Xem Cron ở trên — tồn tại vì Supabase Free tier tự pause project sau ~7 ngày không có hoạt động API thật (một sự cố thật đã từng xảy ra, xem Phần 11), và app 1 người dùng dễ rơi vào tình trạng im lặng lâu.

## Retry / Duplicate Prevention

Retry: một job thất bại không có subscription nào gửi thành công được trả về trạng thái `scheduled` (không đánh dấu lỗi vĩnh viễn) để lần cron 5-giây tiếp theo tự thử lại; một job không có subscriber ACTIVE nào vẫn được đánh dấu `sent` (không retry vô ích) kèm ghi chú "không có subscriber". Chống trùng: khoá `jobKey` cố định (không tạo thêm dòng khi lên lịch lại) + cơ chế claim atomic (update có điều kiện trạng thái) đảm bảo webhook và cron không bao giờ cùng gửi một job.

## Permission

Web Push cần quyền trình duyệt (`Notification.permission`) — trên iPhone còn cần thêm điều kiện "đã cài như PWA" (không thể xin quyền push từ tab Safari thường). Mọi lỗi permission đều thoái lui về thông báo rõ ràng, không chặn timer tiếp tục hoạt động bình thường.

## Timezone

TOÀN BỘ logic "hôm nay"/"ngày"/"tuần" trong hệ thống notification (đặc biệt là cron cảnh báo chuỗi 17:00) dùng giờ Việt Nam (UTC+7) cố định qua `src/engine/time.js`, KHÔNG dùng UTC hay giờ máy chủ Vercel trực tiếp — vì đây là app một-người-dùng cho một người ở Việt Nam, hardcode timezone là quyết định có chủ đích, không phải thiếu sót cần "sửa cho tổng quát" sau này.

## Sleep / Wake

Không có xử lý đặc biệt cho máy tính ngủ/thức — cơ chế "tính lại từ mốc thời gian gốc" (xem Timer Flow) tự nhiên xử lý được trường hợp này: nếu máy ngủ giữa phiên rồi thức dậy, `useTimer` tính lại elapsed time từ đồng hồ hệ thống thật (không phải đếm tick đã bị gián đoạn), nên không bị lệch số.

## Realtime

Chỉ Electron dùng Realtime (subscribe `timer_live`) — không dùng cho việc gửi push hay đồng bộ dữ liệu game đầy đủ (những cái đó dùng cơ chế push/pull chủ động, xem Phần 8).

---

# PHẦN 8 — KIẾN TRÚC SYNC

## Laptop / Phone — bối cảnh bắt buộc phải hiểu

Đây là app một người dùng chạy trên NHIỀU thiết bị (Mac laptop + iPhone), và **cả hai có thể mở cùng lúc**. Đây KHÔNG phải edge case hiếm — nó là tình huống bình thường (ví dụ điện thoại vừa hoàn thành một phiên trong khi laptop cũng đang mở app ở tab khác). Toàn bộ kiến trúc sync phải xử lý đúng tình huống này.

## Source of Truth

Bản thân KHÔNG có "nguồn thật" cố định là laptop hay điện thoại — nguồn thật là **Supabase, được phân xử bởi ai thao tác TRƯỚC theo thứ tự SERVER xác nhận** (không phải theo đồng hồ của bất kỳ thiết bị nào). Đây chính là ý nghĩa của tên gọi cơ chế: **"First Action Wins"**.

## Conflict / Timestamp / Version — quyết định kiến trúc quan trọng nhất của toàn dự án về mặt độ tin cậy dữ liệu

**Thiết kế CŨ (đã bị thay thế, đừng quay lại)**: mỗi thiết bị tự ghi `updated_at` bằng đồng hồ CỦA CHÍNH NÓ khi đẩy dữ liệu lên. Máy nào đẩy TỚI ĐÍCH sau cùng thắng, bất kể ai thao tác trước — đây là lỗ hổng THIẾT KẾ (không phải một bug cụ thể), vì bất cứ lúc nào 2 thiết bị mở gần như đồng thời đều có thể mất dữ liệu do "ăn may ai ghi cuối", không chỉ khi có sự cố mạng. Lỗ hổng này đã thực sự gây mất 1 phiên tập trung thật (xem Phần 11).

**Thiết kế MỚI (hiện tại)**: một cột `version` (số nguyên) trên bảng `game_state`, được tăng bởi MỘT TRIGGER PHÍA SERVER Postgres (`supabase/game_state_version.sql`) — hoàn toàn không phụ thuộc đồng hồ máy khách nào. Mọi lần ghi từ `src/lib/syncService.js` đều kèm điều kiện **compare-and-swap**: `.eq('version', expectedVersion)`. Nếu ghi THÀNH CÔNG (0 dòng nào khác đã thay đổi version từ lúc thiết bị này đọc lần cuối) → thiết bị đó THẮNG, version tăng lên 1. Nếu ghi BỊ TỪ CHỐI (server báo 0 dòng khớp điều kiện, nghĩa là thiết bị khác đã ghi trước) → thiết bị đó THUA, buộc phải `pullFromCloud()` để nhận lại đúng bản đã thắng — **TUYỆT ĐỐI không được phép ép ghi đè lên bản đã thắng**. Guard cũ dựa trên cờ `timerSession.isRunning` (từng thêm để chống một bug khác) đã bị gỡ hoàn toàn vì không còn cần thiết — version là nguồn xác định thứ tự chính xác tuyệt đối, mạnh hơn nhiều so với việc suy đoán qua trạng thái `isRunning`.

**Vì sao đây là quyết định đúng, không thể lùi lại "đơn giản hơn"**: bất kỳ ai muốn "đơn giản hoá" sync bằng cách quay về so sánh timestamp máy khách sẽ TÁI TẠO CHÍNH XÁC lỗ hổng đã gây mất dữ liệu thật. Đây là một trong số ít những chỗ trong dự án mà "đơn giản hơn" = "sai".

## Session / State

Không chỉ dữ liệu game tổng thể được đồng bộ — trạng thái timer ĐANG CHẠY cũng đồng bộ qua CÙNG cơ chế (là một phần của toàn bộ `game_state`, không phải kênh riêng), nghĩa là nếu thiết bị A tạm dừng phiên, thiết bị B (đang cùng mở app, xem cùng phiên đó) sẽ tự động thấy trạng thái tạm dừng cập nhật qua vòng lặp đồng bộ debounce/pull, và điều chỉnh đồng hồ hiển thị cục bộ cho khớp — có các `useEffect` chuyên biệt trong `useTimer.js` để "nhận" các thay đổi từ xa (tạm dừng/tiếp tục/đổi chế độ/gia hạn thời gian) mà không làm rối trạng thái UI cục bộ.

## Realtime / Reconnect

Đồng bộ dữ liệu game đầy đủ KHÔNG dùng Supabase Realtime (khác với `timer_live` cho Electron) — nó dùng một mô hình "push debounced 5 giây + pull khi mở app" chủ động, vì payload đầy đủ lớn hơn nhiều và không cần cập nhật tức thời từng trường riêng lẻ. "Reconnect" không có xử lý đặc biệt riêng — nếu một lần push thất bại (ví dụ mất mạng), lần thay đổi state tiếp theo sẽ tự kích hoạt một lượt push mới (không có hàng đợi retry phức tạp) — đây là một khoảng trống đã được ghi nhận là nguyên nhân trực tiếp của sự cố mất dữ liệu (một lần push thất bại ÂM THẦM đúng lúc Supabase đang khôi phục từ trạng thái pause, không có cơ chế tự thử lại).

## Offline / Merge / Recovery

App hoạt động đầy đủ offline cho phần game (mọi ghi luôn có bản local trước) — "merge" không phải theo nghĩa hợp nhất 2 bộ thay đổi khác nhau (kiểu CRDT) mà là "toàn thắng hoặc toàn thua" theo version — không có hợp nhất từng trường. Recovery sau xung đột: bên thua LUÔN pull toàn bộ state của bên thắng, không có cách nào giữ lại một phần thay đổi cục bộ đã thua.

---

# PHẦN 9 — NHỮNG MODULE QUAN TRỌNG

## `gameStore.js` (~6.000 dòng, `src/store/`)
**Nhiệm vụ**: toàn bộ state + action của game — timer, streak, nhiệm vụ, chuỗi tuần, công trình/nghiên cứu, di vật, prestige, thách đấu cấp bậc, khủng hoảng kỷ nguyên, thành tích, lưu/nạp/nhập/xuất. **Phụ thuộc**: `gameMath.js` (công thức), `constants.js` (dữ liệu tĩnh), `challengeEngine.js` (thách đấu/khủng hoảng), `achievementTimeline.js` (đối chiếu). **Ai dùng**: gần như MỌI component UI (qua hook Zustand). **Mức độ quan trọng**: tối đa — đây là "bộ não" thật của toàn app. **Rủi ro khi sửa**: RẤT CAO — một action như `completeFocusSession` (~760 dòng) đọc/ghi hàng chục slice state trong một lệnh `set()`, dễ nảy sinh bug "dùng giá trị cũ" (đọc snapshot trước khi một effect khác đã cập nhật). File có nhiều comment cảnh báo tường minh về class lỗi này (ví dụ "KHÔNG tin `spCost` từ UI, luôn tính lại từ `SKILL_TREE`"). Đây LÀ "God File" chính của dự án, và việc KHÔNG tách nhỏ nó là một quyết định có chủ đích (xem Phần 10).

## `gameMath.js` (~1.842 dòng, `src/engine/`)
**Nhiệm vụ**: mọi công thức thuần của game — tính thưởng phiên, streak, softcap, Wilson lower bound (thực ra sống ở `coachIntel.js`, không phải file này — một điểm dễ nhầm), các hàm tín hiệu phân tích (giờ vàng, xu hướng tuần, chuỗi liền mạch...). **Phụ thuộc**: chỉ `constants.js`, KHÔNG import React/Zustand/Date trực tiếp (mọi ngày giờ nhận qua tham số). **Ai dùng**: `gameStore.js`, `coachIntel.js`, `coachContext.js`, `StatsDashboard.jsx`. **Mức độ quan trọng**: tối đa — sai một công thức ở đây ảnh hưởng dây chuyền tới điểm số, cân bằng game, VÀ độ chính xác của AI Coach. **Rủi ro khi sửa**: cao — nhiều cơ chế chống lạm phát (softcap, trần cứng, Dồn Lực single-trump) được nhúng ở đây, xoá nhầm một trong số đó sẽ mở lại lạm phát phần thưởng không giới hạn.

## `src/engine/coach/` (toàn thư mục — prompt.js, guard.js, guardedGenerate.js, cloudEngine.js, coachContext.js, coachIntel.js)
**Nhiệm vụ**: toàn bộ "bộ não" AI Coach model-agnostic. **Phụ thuộc**: `gameMath.js` (số liệu nguồn), `api/_lib/gemini.js` (qua HTTP tới `api/coach.js`). **Ai dùng**: `CoachChat.jsx`, `CoachOffline.jsx`, `CoachNudge.jsx`. **Mức độ quan trọng**: cao — đây là tính năng khác biệt hoá lớn nhất của app. **Rủi ro khi sửa**: cao đặc biệt với `guard.js` — MỌI thay đổi ở đây PHẢI verify lại điểm `eval.test.js` (BẮT/BÁO NHẦM) không tụt, vì đây là lớp bảo vệ niềm tin người dùng.

## `PomodoroEngine.jsx` + `useTimer.js` (`src/components/` + `src/hooks/`)
**Nhiệm vụ**: màn hình chính + state machine của đồng hồ tập trung. **Phụ thuộc**: `gameStore.js` (gọi `completeFocusSession`/`cancelFocusSession`), `timerSession.js`/`breaks.js`/`challengeEngine.js` (quy tắc thuần), `pushService.js`/`timerLiveService.js` (đồng bộ ngoài). **Ai dùng**: là màn hình mặc định của app. **Mức độ quan trọng**: tối đa — nếu timer sai, cả sản phẩm mất ý nghĩa. **Rủi ro khi sửa**: cao — logic tính "elapsed time" dựa trên mốc thời gian gốc + bù trừ pause là tinh vi, sửa sai dễ gây lệch số đếm hoặc mất khả năng phục hồi sau reload/đóng app đột ngột.

## `StatsDashboard.jsx` (~4.885 dòng, `src/components/`)
**Nhiệm vụ**: toàn bộ tab Thống kê (5 tab con: Tổng Quan/Tập Trung/Phân Loại/Nhật Ký/Ghi Chú). **Phụ thuộc**: `gameMath.js` (các hàm `compute*Stats`), `statsFormatters.js` (định dạng, mới tách ra). **Mức độ quan trọng**: trung bình-cao (không ảnh hưởng game logic, nhưng là nơi người dùng "nhìn lại" toàn bộ nỗ lực). **Rủi ro khi sửa**: trung bình — file lớn, nhiều state cục bộ + `useMemo` phức tạp, nhưng phần lớn LÀ hiển thị (đọc, không ghi state game).

## `src/lib/syncService.js`
**Nhiệm vụ**: đồng bộ 2 chiều "First Action Wins" — implement chi tiết cơ chế compare-and-swap ở Phần 8. **Phụ thuộc**: `src/lib/supabase.js` (client), `normalizePersistedGameState` (gameStore.js). **Mức độ quan trọng**: tối đa cho tính TOÀN VẸN dữ liệu (không phải cho gameplay). **Rủi ro khi sửa**: RẤT CAO — đây là nơi từng có lỗ hổng gây mất dữ liệu thật; bất kỳ thay đổi nào ở đây PHẢI hiểu rõ cơ chế version compare-and-swap trước khi động vào, và không bao giờ được thêm một đường ghi trực tiếp vào `game_state` mà bỏ qua điều kiện version.

## `api/push/dispatch.js` + `api/_lib/push.js`
**Nhiệm vụ**: nhận trigger (webhook hoặc cron), claim job đến hạn, gửi Web Push, tắt subscription hết hạn. **Phụ thuộc**: bảng `push_jobs`/`push_subscriptions` Supabase. **Mức độ quan trọng**: cao cho trải nghiệm (thông báo là lý do người dùng biết phiên đã xong khi không nhìn màn hình). **Rủi ro khi sửa**: trung bình — logic claim atomic + `isSessionEndEvent` là phần tinh vi nhất, sửa sai dễ gây gửi trùng hoặc gửi nhầm lúc huỷ phiên.

## `achievementTimeline.js`
**Nhiệm vụ**: suy luận ngày mở khoá thành tích cũ bằng cách phát lại lịch sử. **Mức độ quan trọng**: thấp-trung bình (chỉ ảnh hưởng hiển thị ngày, không ảnh hưởng việc CÓ mở khoá hay không). **Rủi ro khi sửa**: trung bình — luôn phải sửa song song với `buildAchievementSnapshot` trong `gameStore.js` (2 file có comment cảnh báo tréo nhau) nếu thêm trường snapshot mới, nếu không thành tích mới sẽ không bao giờ suy luận được ngày mở khoá cho các save cũ.

---

# PHẦN 10 — CÁC QUYẾT ĐỊNH KIẾN TRÚC

### Quyết định: "First Action Wins" thay vì "ai ghi cuối thắng"
**Bối cảnh**: 2 thiết bị (laptop + điện thoại) có thể mở cùng lúc, cùng ghi vào 1 dòng Supabase. **Vấn đề**: cơ chế cũ dựa trên `updated_at` do client tự ghi khiến máy ghi TỚI ĐÍCH sau cùng thắng bất kể ai thao tác trước — có thể mất dữ liệu bất cứ lúc nào, không chỉ khi có sự cố. **Phương án đã cân nhắc**: giữ nguyên timestamp client (bị bác vì không đáng tin do lệch đồng hồ + không có khái niệm "thứ tự thật"); dùng khoá optimistic-lock qua version phía server (đã chọn). **Lý do chọn**: version tăng bởi trigger Postgres không phụ thuộc đồng hồ máy khách nào, cho một thứ tự "ai trước ai sau" TUYỆT ĐỐI và không thể tranh cãi. **Trade-off**: bên thua LUÔN mất mọi thay đổi cục bộ chưa kịp đồng bộ (không có hợp nhất từng phần) — chấp nhận được vì đơn giản và đáng tin hơn một cơ chế hợp nhất phức tạp dễ có lỗi tinh vi hơn. **Ảnh hưởng**: mọi ghi vào `game_state` bây giờ PHẢI qua `syncService.js`, không được viết tắt trực tiếp. **Có thể thay đổi được không**: có, nhưng bất kỳ thay thế nào cũng phải giữ tính chất "server xác định thứ tự tuyệt đối, không phụ thuộc đồng hồ client" — nếu không sẽ tái tạo đúng lỗ hổng đã gây sự cố thật.

### Quyết định: chuyển AI Coach từ Qwen on-device sang Gemini đám mây (rồi bỏ hẳn Qwen)
**Bối cảnh**: ban đầu (2026-06-20) Coach chạy 100% miễn phí bằng một model nhỏ (Qwen2.5, cuối cùng chốt bản 3B tham số) tải và chạy ngay trên máy qua WebGPU (thư viện WebLLM), không tốn phí API. **Vấn đề**: model 3B "ngu" so với nhu cầu phân tích chính xác, hay "trôi" sang tiếng Trung, và (quan trọng nhất) hoàn toàn KHÔNG chạy được trên iPhone (không có WebGPU) — người dùng chính lại chủ yếu dùng điện thoại. **Phương án đã cân nhắc**: nâng cấp lên Qwen 7B (thử, rồi rút lui vì nặng máy); Gemini làm CHÍNH + Qwen làm dự phòng (thử qua một giai đoạn trung gian); Gemini là DUY NHẤT (đã chốt). **Lý do chọn**: Gemini Flash miễn phí (sau đó trả phí rẻ khi bật billing), tiếng Việt tốt hơn nhiều, và quan trọng nhất — chạy được TRÊN IPHONE (chỉ cần gọi API, không cần tải model nặng vào máy). **Trade-off chấp nhận**: mất khả năng hoạt động khi mất mạng/hết quota (không còn lưới dự phòng chạy tại chỗ); dữ liệu số liệu (không phải dữ liệu cá nhân nhạy cảm) rời khỏi máy lên server Google. **Ảnh hưởng**: gỡ hẳn dependency `@mlc-ai/web-llm`, giảm kích thước app đáng kể. **Có thể thay đổi được không**: có, kiến trúc "bộ não" (prompt+guard+tầng số liệu) được thiết kế model-agnostic có chủ đích — đổi nhà cung cấp AI chỉ cần thay `cloudEngine.js`, không cần viết lại toàn bộ hệ thống.

### Quyết định: cấu trúc `api/_lib/`+`api/_tests/` với tiền tố gạch dưới
**Bối cảnh**: Vercel gói Hobby giới hạn 12 Serverless Functions/deploy; Vercel coi MỌI file `.js` trực tiếp trong `api/` là 1 function, kể cả file test. **Vấn đề**: một lần thêm cron mới (`api/keepalive.js`) khiến build FAIL vì vượt trần — nguyên nhân thật là 5 file test nằm lẫn trong `api/` bị tính oan là function. **Phương án đã cân nhắc**: vá tạm bằng `.vercelignore` loại trừ `*.test.js` theo tên (Đàm BÁC BỎ có chủ đích, yêu cầu xử lý gốc); chuyển toàn bộ test vào thư mục con tiền tố `_` (ĐÃ CHỌN) — vì Vercel đã sẵn tôn trọng quy ước này cho `api/_lib/`. **Lý do chọn**: an toàn VĨNH VIỄN, không phụ thuộc tên file cụ thể — dù sau này thêm hàng trăm file test bất kỳ tên gì đặt đúng trong `api/_tests/` cũng không bao giờ bị tính vào trần. **Trade-off**: không có — đây là giải pháp thuần lợi, không đánh đổi gì. **Ảnh hưởng**: mọi test API mới BẮT BUỘC đặt trong `api/_tests/` (mirror cấu trúc `api/`), không đặt cạnh route handler. `.vercelignore` vẫn giữ làm lớp phòng thủ THỨ HAI (mở rộng thêm các đuôi file phụ trợ khác) phòng khi lỡ tay đặt nhầm. **Bài học kèm theo**: một build fail do vượt trần này từng khiến Vercel ÂM THẦM giữ nguyên bản deploy CŨ suốt 2 tuần rưỡi (một tính năng "hoàn tất" trên giấy tờ chưa từng thực sự chạy production) — từ đó có quy tắc bắt buộc xác nhận tab Deployments hiện "Ready" sau mỗi lần push.

### Quyết định: `src/engine/` phải là hàm thuần, không phụ thuộc Date/React/Zustand
**Bối cảnh**: công thức game và tín hiệu phân tích cần test tự động chính xác, không phụ thuộc "giờ chạy test là mấy giờ". **Lý do chọn**: mọi hàm nhận ngày/giờ qua tham số `opts` thay vì gọi `new Date()` trực tiếp bên trong — cho phép test giả lập bất kỳ thời điểm nào một cách xác định (deterministic). **Trade-off**: hơi rườm rà hơn khi gọi (phải truyền thêm tham số ngày giờ ở caller), đổi lấy khả năng test đầy đủ và tránh bug timezone (đặc biệt quan trọng vì mọi "ngày"/"tuần" trong app đều theo giờ Việt Nam cố định, không theo giờ trình duyệt). **Có thể thay đổi được không**: về nguyên tắc có nhưng KHÔNG NÊN — vi phạm quy ước này sẽ âm thầm phá vỡ tính xác định của bộ test và có nguy cơ tái tạo lại đúng loại bug timezone mà quy ước này được lập ra để phòng.

### Quyết định: KHÔNG gộp `buildAchievementSnapshot` và `buildAchievementSnapshotForReplay`
**Bối cảnh**: hai hàm trông "giống nhau đến mức cám dỗ gộp lại" — cùng tính một tập trường số liệu tương tự để đưa vào các hàm `check()` thành tích. **Vấn đề nếu gộp**: một thuật toán tính lại từ đầu mỗi lần gọi (dùng cho kiểm tra real-time, chạy 1 lần/phiên — chấp nhận được vì tần suất thấp) và một thuật toán tích luỹ tăng dần (dùng để phát lại TOÀN BỘ lịch sử một lần, cần O(n) chứ không phải O(n²) mới chịu được với người dùng có hàng nghìn phiên). **Lý do KHÔNG gộp**: rủi ro hiệu năng thật (buộc phải chọn một trong hai đặc tính, gây hại cho trường hợp còn lại) cao hơn lợi ích "giảm trùng lặp code". **Ảnh hưởng**: cả 2 file đều có comment cảnh báo tréo nhau bằng tiếng Việt, nhắc rõ: đổi field snapshot ở một nơi PHẢI đổi luôn ở nơi kia hoặc chúng sẽ lệch nhau (thành tích vẫn mở khoá đúng real-time nhưng ngày mở khoá suy luận lại cho save cũ có thể sai/thiếu). **Bài học cho AI tương lai**: đây là ví dụ mẫu mực của "trông giống trùng lặp nhưng KHÔNG PHẢI trùng lặp thật" — quy tắc "gộp mọi logic lặp lại" từ đợt refactor 07-12 đã CỐ Ý chừa ngoại lệ này ra sau khi phân tích kỹ.

### Quyết định: KHÔNG tách nhỏ `gameStore.js` (God File) trong đợt refactor 07-12
**Bối cảnh**: đợt refactor kiến trúc toàn diện 2026-07-12 có yêu cầu rõ ràng "nếu buộc phải sửa God File thì tách nhỏ helper/hàm thuần ở mức thấp rủi ro, không cần tách hẳn store/component ngay". **Vấn đề**: tách một store 6000 dòng với ~78 action liên kết chặt chẽ (một action đọc/ghi hàng chục slice) đòi hỏi RẤT NHIỀU test hành vi mới để đảm bảo an toàn — sai điểm/XP/streak sẽ không có gì tự động bắt được ngay lập tức (không crash, chỉ âm thầm sai số), và app này không có E2E test để bắt loại lỗi "tính sai nhưng không crash" này. **Quyết định**: chỉ rút các hàm định dạng thuần (statsFormatters.js) ra khỏi `StatsDashboard.jsx`, KHÔNG động vào cấu trúc `gameStore.js`. **Trade-off**: file vẫn khó đọc/khó onboard, nhưng rủi ro tách sai thấp hơn. **Điều kiện nên tách trong tương lai**: xem Phần 17 (Roadmap).

---

# PHẦN 11 — NHỮNG LỖI LỚN TRONG QUÁ KHỨ

## Sự cố 1: Mất 1 phiên tập trung thật do lỗ hổng thiết kế sync (2026-07-11)
Điện thoại hoàn thành một phiên "Học Đại Học 25 phút" (+26 XP) nhưng lần đẩy dữ liệu đó thất bại ÂM THẦM do lỗi mạng (đúng lúc Supabase project đang khôi phục từ sự cố khác — xem Sự cố 2 bên dưới), không có cơ chế tự thử lại. Sau đó laptop mở app, một thao tác vô hại (chuyển tab Thống kê) khiến nó đẩy state CŨ (thiếu phiên đó) lên đè đám mây — vì cơ chế lúc đó là "ai ghi cuối thắng" theo đồng hồ client. Khi cố khắc phục bằng cách để cả 2 máy cùng mở, chúng GIÀNH NHAU ghi liên tục khiến đồng hồ timer nhảy qua nhảy lại, phải đóng hẳn một máy mới dừng được vòng lặp. **Phiên đó mất thật, không phục hồi được** (từ chối tái tạo tay qua SQL vì sẽ không đi qua đúng logic tính XP/streak/mission của game, dễ gây sai lệch số liệu khác — một quyết định đúng: thà chấp nhận mất 1 phiên còn hơn tạo dữ liệu "giả" đi vòng qua hệ thống). **Bài học cốt lõi**: đây là lỗ hổng THIẾT KẾ chứ không phải bug cụ thể — bất cứ lúc nào 2 thiết bị mở gần đồng thời đều CÓ THỂ mất dữ liệu do ăn may ai ghi cuối, không chỉ khi có sự cố mạng trùng hợp. **Đã sửa tận gốc** bằng "First Action Wins" (Phần 8/10). **Bài học vận hành bổ sung**: đừng test-thử-trực-tiếp trên 2 máy thật cùng lúc kiểu "bấm rồi xem" khi đang chẩn đoán sự cố — quá rối và có rủi ro mất thêm dữ liệu; nên kiểm tra qua Supabase REST API trước.

## Sự cố 2: Supabase tự pause project vì log cron phình dung lượng (2026-07-11, cùng ngày với Sự cố 1)
Đồng bộ 2 máy đột nhiên ngừng hoạt động. Kiểm tra DNS cho thấy subdomain Supabase trả về NXDOMAIN — **kết luận ban đầu SAI**: suy đoán project đã bị XOÁ. Thực tế project chỉ đang ở trạng thái **paused** (không phải xoá) — bài học quan trọng: **Supabase pause CÓ THỂ khiến subdomain NXDOMAIN thật**, không chỉ trả trang lỗi như giả định ban đầu; đừng bao giờ khẳng định chắc chắn "đã xoá" chỉ từ tín hiệu DNS, luôn xác nhận qua dashboard thật. **Nguyên nhân gốc thật**: KHÔNG phải do dữ liệu game (`game_state` chỉ ~192KB) mà do bảng nội bộ `cron.job_run_details` (nhật ký chạy của tiện ích pg_cron) phình tới **795MB/821MB** hạn mức Free — vì job đẩy push mỗi 5 giây chạy liên tục ~2 tháng mà chưa từng dọn log. **Đã xử lý**: resume project, dọn log cũ + VACUUM FULL, thêm job tự-dọn mỗi đêm (giữ 3 ngày gần nhất), và — quan trọng — **GIỮ NGUYÊN** tần suất 5 giây thay vì giãn ra, vì job tự-dọn ban đêm đã đủ để giữ dung lượng ổn định thấp (một quyết định có chủ đích ưu tiên phản hồi nhanh hơn tối ưu tài nguyên khi cả hai đều khả thi). **Bài học tổng quát**: nếu Database Size lại báo gần hạn mức, kiểm tra `cron.job_run_details` TRƯỚC, không phải bảng dữ liệu game.

## Sự cố 3: Deploy fail âm thầm suốt 2 tuần rưỡi vì vượt trần function Vercel (phát hiện lại 2026-07-11, xảy ra thật từ 2026-06-25)
Commit thêm `api/coach-digest.js` (mảng cuối cùng của chuỗi 6 nâng cấp AI Coach, "cảnh báo chuỗi sắp đứt qua push") từng bị Vercel FAIL BUILD do cùng nguyên nhân vượt trần 12 function — nhưng KHÔNG AI để ý lúc đó. Vercel, khi build fail, tự động GIỮ NGUYÊN bản deploy TRƯỚC ĐÓ mà không có cảnh báo hiển nhiên nào cho người dùng cuối. Kết quả: tính năng này **KHÔNG HỀ chạy thật trên production suốt 25/6 đến 11/7** dù code đã commit và tài liệu đã ghi "hoàn tất". Chỉ được phát hiện lại khi soát log Deployments trong lúc xử lý Sự cố khác cùng ngày. **Bài học quan trọng nhất từ toàn bộ lịch sử dự án**: **"code xanh + commit thành công + test pass KHÔNG CÓ NGHĨA đã thực sự lên production"** — PHẢI xác nhận trực tiếp tab Deployments trên Vercel dashboard hiện "Ready" sau mỗi lần push, đừng suy luận từ các tín hiệu gián tiếp khác.

## Lỗi lớn: model AI nhỏ "trôi" sang tiếng Trung
Trong giai đoạn dùng Qwen2.5-3B on-device, model thường xen lẫn ký tự Trung/Hàn/Nhật vào câu trả lời tiếng Việt (đặc biệt ở đơn vị/số). Đã thử 3 lớp chống: ép prompt 100% tiếng Việt + tự-kiểm, hạ nhiệt độ giải mã, và một hàm phát hiện ký tự CJK/Hangul/Kana (`hasForeignScript`) buộc viết lại 1 lần nếu dính. Hàm phát hiện này VẪN được giữ lại dù giờ dùng Gemini (ít trôi hơn nhiều) — chi phí giữ gần như bằng 0, và phòng hờ nếu tương lai lại đổi sang một model khác dễ trôi.

## Lỗi lớn: model nhỏ bịa số khi nhái theo ví dụ few-shot có số cụ thể
Ban đầu prompt "Hỏi Coach" có ví dụ mẫu (few-shot) chứa số cụ thể (ví dụ "2.3 giờ") để dạy văn phong — phát hiện model 3B THỰC SỰ CHÉP LUÔN con số trong ví dụ ra làm câu trả lời thật (dù số đó không liên quan gì tới dữ liệu người dùng). Đã sửa bằng cách bỏ hẳn few-shot có số, thay bằng placeholder chữ cái (X/A/B/C). Đây là bài học tổng quát quan trọng cho bất kỳ ai viết prompt cho model: **không bao giờ đặt số cụ thể trong ví dụ minh hoạ nếu model có xu hướng nhái khuôn**.

## Landmine đã vá: nhãn dải độ dài phiên thiếu đơn vị gây lưới chống-bịa báo nhầm
Nhãn "vừa (26–44 phút)" — mốc SỐ DƯỚI ("26") không có chữ "phút" NGAY SAU nó trong chuỗi hiển thị → lưới chống-bịa hiểu nhầm "26" là một con số riêng không có đơn vị đi kèm trực tiếp, và (tuỳ ngữ cảnh câu) có thể báo nhầm. Đã vá bằng cách đổi nhãn thành "vừa (26 phút–44 phút)" — cả 2 mốc đều có "phút" theo sau. **Bài học tổng quát**: bất kỳ chuỗi hiển thị số nào được lưới chống-bịa TẤT ĐỊNH đọc lại (không phải AI đọc) đều cực kỳ nhạy cảm với định dạng chuỗi chính xác — đổi một nhãn hiển thị tưởng như vô hại cũng có thể phá vỡ một lưới an toàn ở xa.

## Quyết định KHÔNG bị coi là lỗi nhưng suýt gây hiểu lầm: "restyle không phải rebuild"
Trong đợt làm lại giao diện (2026-06-14), một commit "pro redesign" chỉ re-skin màu sắc/token trên cấu trúc layout CŨ, nhưng ban đầu được mô tả như thể đã "khớp mockup hoàn toàn". Đàm phản hồi đúng: mockup thật ra có cấu trúc KHÁC (sidebar tối gọn, cột phải Focus riêng, thẻ AI Coach) mà bản restyle chưa hề dựng. **Bài học**: phân biệt rõ ràng "re-skin/restyle" (đổi màu/token trên cấu trúc cũ) với "rebuild" (dựng lại cấu trúc/layout mới) khi báo cáo tiến độ — đừng thổi phồng một thay đổi bề mặt thành một thay đổi cấu trúc.

---

# PHẦN 12 — TECHNICAL DEBT

## God Function: `completeFocusSession` (~760 dòng trong `gameStore.js`)
**Mô tả**: một action Zustand xử lý gần như mọi hệ quả của việc hoàn thành một phiên — thưởng, streak, nhiệm vụ, thành tích, thách đấu, chế tạo, sự kiện ngẫu nhiên — tất cả trong một chuỗi gọi hàm tuần tự dài. **Nguyên nhân**: các hệ thống game được thêm dần qua nhiều tháng, mỗi lần một tính năng mới ra đời lại "gắn thêm" vào đúng điểm nối duy nhất này (vì đây là nơi duy nhất biết "một phiên vừa xong"). **Ảnh hưởng**: khó đọc, khó test từng phần riêng, dễ sinh bug đọc nhầm snapshot state cũ/mới. **Mức ưu tiên**: trung bình (đã hoạt động ổn định, có test bao phủ các nhánh chính) — không phải cấp bách. **Điều kiện nên sửa**: khi cần thêm MỘT hệ thống gameplay mới lớn khác cắm vào đúng điểm này (dấu hiệu hàm đang tiếp tục phình to), hoặc khi có đủ ngân sách viết thêm test hành vi bao phủ TỪNG bước trước khi tách. **Ước lượng độ khó**: cao — cần thiết kế lại ranh giới rõ ràng (ví dụ tách theo "reward calculation" / "progression update" / "achievement check" thành các bước tuần tự composable) kèm bộ test hồi quy đầy đủ trước khi động vào.

## God File: `gameStore.js` (~6.000 dòng) và `StatsDashboard.jsx` (~4.885 dòng)
Đã thảo luận ở Phần 10/9. **Mức ưu tiên**: thấp hiện tại (quyết định có chủ đích hoãn lại). **Điều kiện nên sửa**: xem Phần 17.

## Code Smell: các skill/prestige "mô tả" không khớp code thật
Ba kỹ năng nhánh Thăng Hoa (`kien_thuc_nen`, `ke_thua`, `sieu_viet`) có văn bản mô tả hứa hẹn các đặc quyền giữ lại khi prestige (giữ 1 kỹ năng nâng cao, giữ 50% SP chưa dùng, +100% XP kỷ nguyên 1 sau prestige) — nhưng qua rà soát trực tiếp, KHÔNG tìm thấy đoạn code nào trong `triggerPrestige()` thực sự áp dụng các cờ này; việc reset khi prestige có vẻ diễn ra KHÔNG ĐIỀU KIỆN bất kể các kỹ năng này có được mở khoá hay không. **Nguyên nhân**: khả năng cao đây là tính năng được thiết kế trên giấy (mô tả trong `constants.js`) nhưng chưa từng được nối dây thật vào logic reset, hoặc đã bị bỏ sót khi logic prestige được viết/sửa sau đó. **Ảnh hưởng**: người chơi có thể mở khoá các kỹ năng này và KHÔNG nhận được đúng như mô tả — đây là một khác biệt giữa "văn bản hứa hẹn" và "hành vi thật", đáng lo ngại về tính trung thực của game. **Mức ưu tiên**: TRUNG BÌNH-CAO — nên xác minh trực tiếp (chơi thử hoặc viết test) trước khi Đàm đạt tới prestige đầu tiên trong đời thật, vì nếu đúng là thiếu, nó ảnh hưởng trực tiếp tới trải nghiệm và niềm tin vào tính minh bạch mà dự án luôn đề cao (cùng tinh thần "NIỀM TIN = TÀI SẢN QUÝ NHẤT" áp dụng cho AI Coach). **Ước lượng độ khó sửa**: thấp-trung bình nếu xác nhận thiếu — chỉ cần thêm 3 nhánh điều kiện vào hàm reset của prestige.

## Test Coverage: không có E2E, không giám sát production
**Mô tả**: 208 bài test đơn vị/tích hợp bao phủ tốt các hàm thuần và store action, nhưng KHÔNG có test end-to-end (click thật qua UI), và KHÔNG có công cụ giám sát lỗi/hiệu năng production nào (không Sentry, không analytics). **Nguyên nhân**: quy mô 1 người dùng khiến việc đầu tư hạ tầng giám sát chuyên nghiệp có vẻ "thừa" so với lợi ích trước mắt; cũng vì việc chạy thử E2E thật đòi hỏi một môi trường Supabase riêng (hiện dev share CHUNG row Supabase với production — xem mục "KHÔNG làm" — nên không thể chạy phiên thật trên dev để test). **Ảnh hưởng**: các loại lỗi "tính sai âm thầm, không crash" (như bug thiếu điều kiện prestige ở trên) có thể tồn tại lâu mà không ai biết cho tới khi Đàm tự trải nghiệm gặp phải. **Mức ưu tiên**: trung bình. **Điều kiện nên sửa**: khi có một môi trường Supabase project THỨ HAI dành riêng cho dev/test (tách khỏi production) — lúc đó E2E mới an toàn để chạy phiên thật.

## Documentation: một số mô tả tính năng cũ trong `constants.js` có thể không còn khớp code
Liên quan trực tiếp tới mục Code Smell ở trên — đây là dấu hiệu rộng hơn rằng văn bản mô tả trong dữ liệu tĩnh (`description` của skill/achievement) có thể "đi trước" hoặc "đi sau" so với code logic thật, và không có cơ chế kiểm tra tự động nào đối chiếu 2 thứ này. **Mức ưu tiên**: thấp-trung bình, mang tính phòng ngừa — nên rà soát định kỳ khi có thời gian.

## Performance: `StatsDashboard.jsx`'s `FocusTab`/`CategoryTab` tính toán nặng trên toàn bộ lịch sử mỗi lần render
Có `useMemo`/`useTransition`/`useDeferredValue` để giảm giật, nhưng về cơ bản mỗi lần đổi filter (kỳ/danh mục) đều quét lại toàn bộ mảng `history`. **Ảnh hưởng**: chưa phải vấn đề thật ở quy mô hiện tại (một người dùng, vài nghìn phiên tối đa trong nhiều năm), nhưng sẽ trở thành vấn đề nếu lịch sử phình lên rất lớn (nhiều năm sử dụng liên tục). **Mức ưu tiên**: thấp hiện tại — chỉ đáng làm nếu thực sự cảm nhận được độ trễ khi thao tác trên tab Thống kê.

## Dependency: một số gói phụ thuộc cũ (Electron, `@mlc-ai/web-llm` di sản trong lockfile lịch sử)
Không phải nợ hiện tại (đã gỡ sạch trong các đợt dọn dẹp), nhưng đáng lưu ý: `npm install` vẫn cần `--legacy-peer-deps` do một số xung đột phiên bản chưa giải quyết dứt điểm — chấp nhận sống chung, không coi là cấp bách.

---

# PHẦN 13 — NHỮNG QUY TẮC BẤT THÀNH VĂN

## Quy tắc phân loại lệnh "nghiên cứu" vs "làm" (quan trọng nhất, đứng trên mọi quy tắc khác)
Mọi yêu cầu của Đàm được chia thành 2 nhóm và xử lý HOÀN TOÀN KHÁC NHAU:
- **"Nghiên cứu/tìm hiểu/đề xuất/cho ý kiến/theo bạn..."** → CHỈ trình bày phân tích + khuyến nghị rồi DỪNG. TUYỆT ĐỐI không sửa code, không commit, không deploy. Câu mơ hồ không rõ ý → mặc định coi là nhóm này + hỏi lại trước khi làm.
- **"Làm đi/sửa/thêm/đổi/nâng cấp/deploy..."** → làm theo đúng 4 bước: (1) giải thích NGẮN GỌN, DỄ HIỂU (không hàn lâm, không jargon) sắp làm gì + công dụng, TRƯỚC khi sửa; (2) làm (kèm test/lint + cập nhật tài liệu); (3) giải thích SAU khi sửa đã đổi gì + ích lợi, vẫn dễ hiểu; (4) **TỰ ĐỘNG deploy lên Vercel** (commit + push) — KHÔNG hỏi lại, vì bản thân lệnh "làm" đã bao hàm cho phép deploy.

**Vì sao quy tắc này tồn tại và tại sao nó quan trọng bất thường**: đây là app PRODUCTION thật, mỗi lần push là một deploy ra MỌI thiết bị Đàm đang dùng thật hằng ngày. Từng có một lần một AI (không phải phiên hiện tại) hiểu nhầm "nghiên cứu + làm gọn model" thành lệnh làm, tự đổi model AI 7B→3B RỒI TỰ DEPLOY LUÔN — Đàm phản hồi rằng lần đó anh CHỈ MUỐN nghiên cứu, từ đó quy tắc phân loại này ra đời. Bài học: khi không chắc chắn, LUÔN coi là "nghiên cứu" và hỏi lại, không bao giờ tự suy diễn theo hướng "làm" khi câu chữ mơ hồ.

## Quy tắc "đọc tài liệu trước, cập nhật tài liệu sau" (NGUYÊN TẮC ƯU TIÊN SỐ 1)
Trước khi làm bất cứ việc gì: đọc `BAN_GIAO.md` + `CLAUDE.md` + các file liên quan tới việc sắp làm. Sau khi có bất kỳ cập nhật nào (dù nhỏ): cập nhật NGAY `CLAUDE.md` + `BAN_GIAO.md` + các tài liệu liên quan khác (README, ARCHITECTURE.md, PROJECT_STRUCTURE.md...) cho khớp. **"Làm xong việc mà chưa cập nhật tài liệu = CHƯA XONG"** — đây là câu nói được lặp lại nguyên văn nhiều lần trong tài liệu dự án, không phải một gợi ý mà là một tiêu chuẩn hoàn thành công việc. **Lý do**: Đàm là non-coder, mỗi phiên AI là "người mới" không nhớ gì phiên trước — các file tài liệu này CHÍNH LÀ bộ nhớ chung duy nhất nối liền các phiên làm việc rời rạc.

## Quy tắc test API mới phải nằm trong `api/_tests/`
Đã giải thích ở Phần 10 — không lặp lại chi tiết, chỉ nhấn mạnh: đây là quy tắc BẮT BUỘC, không phải khuyến nghị, vì hậu quả vi phạm là build fail trên production.

## Quy tắc "gộp code trùng lặp thật, KHÔNG gộp code trùng lặp bề ngoài"
Rút ra từ đợt refactor 07-12: khi 2 đoạn code trông giống hệt nhau, phải PHÂN TÍCH xem chúng có phục vụ mục đích khác nhau (dù trông giống) hay không TRƯỚC khi gộp. Ví dụ đã gặp: `BadgeKit.jsx`'s `TypeBadge`/`RarityBadge` có 2 "variant" trông giống nhưng cố ý render khác nhau ở chế độ sáng (một dùng CSS custom property theme, một dùng màu hardcode) — gộp ép thành 1 sẽ đổi hình ảnh hiển thị của 1 trong 2 màn hình; `getLabelMark`'s hành vi fallback khi label rỗng có một quirk tinh vi (chạy fallback string QUA LẠI cùng thuật toán initials, không trả nguyên fallback) mà một lần gộp "cho gọn" suýt vô tình xoá mất; `buildAchievementSnapshot`/`buildAchievementSnapshotForReplay` (Phần 10) là ví dụ rõ nhất — trông như trùng lặp hoàn hảo nhưng phục vụ 2 mục đích tính toán khác nhau về độ phức tạp thuật toán.

## Quy tắc "engine thuần không được gọi `Date.now()`/`Math.random()` trực tiếp"
Đã giải thích ở Phần 10 — mọi hàm trong `src/engine/` nhận thời gian/ngẫu nhiên qua tham số, không tự gọi trực tiếp, để giữ khả năng test xác định (deterministic).

## Quy tắc AI Coach: "diễn đạt lại số đã tính sẵn, không bao giờ tự tính"
Đã giải thích chi tiết ở Phần 6.

## Quy tắc ngầm về ngôn ngữ giao tiếp: đơn giản, không hàn lâm, không jargon
Đàm là non-coder — mọi giải thích (đặc biệt là bước "giải thích trước khi làm"/"giải thích sau khi làm") phải viết như nói chuyện với một người thông minh nhưng không biết kỹ thuật, không phải như viết tài liệu kỹ thuật cho một kỹ sư khác.

## Quy tắc ngầm về workflow đa-agent: dùng có kiểm soát, không mặc định
Rất nhiều tính năng lớn trong lịch sử dự án được thiết kế qua các "workflow N-agent" (nhiều AI con làm song song rồi tổng hợp/phản biện) — nhưng đây KHÔNG phải mặc định cho mọi việc, và từng có bài học: các workflow chạy nền lớn dễ bị GIÁN ĐOẠN giữa chừng trong môi trường này — bài học rút ra là ưu tiên sửa trực tiếp, tăng dần, commit thường xuyên hơn là dựa vào một workflow khổng lồ một lần cho giai đoạn XÂY DỰNG (workflow vẫn tốt cho giai đoạn THIẾT KẾ/rà soát).

## Quy tắc ngầm: không bắt đầu phiên tập trung thật trên môi trường dev/localhost
Vì dev dùng CHUNG một dòng Supabase với production — bắt đầu một phiên thật trên dev sẽ GHI ĐÈ dữ liệu thật của Đàm. Đây là lý do nhiều tính năng liên quan tới trạng thái RUNNING của timer (breathing ring, hiệu ứng khi đang chạy...) chưa từng được xác minh trực tiếp bằng cách chạy phiên thật trên dev — chỉ được xác minh qua test/lint + suy luận toán học khớp với logic đã hoạt động.

---

# PHẦN 14 — DANH SÁCH NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG NÊN LÀM

1. **Không tự ý sửa code hay deploy khi lệnh của Đàm thuộc nhóm "nghiên cứu"** — kể cả khi bạn (AI) tin chắc thay đổi đó đúng và tốt. Lý do: quyền quyết định cuối cùng về app production luôn phải ở Đàm, việc "làm giúp luôn cho nhanh" đã từng gây hiểu lầm và mất niềm tin.
2. **Không biến Electron thành một app chính riêng biệt, có logic game riêng** — Electron CHỈ là vỏ hiển thị đồng hồ tray, mọi logic thật nằm ở web app. Nhân đôi logic sẽ tạo ra 2 nguồn sự thật có thể lệch nhau.
3. **Không dùng localhost/`serve-dist.mjs`/LaunchAgent làm luồng sử dụng chính** — đây là công cụ dev cũ, không phải cách Đàm dùng app hằng ngày (anh dùng web Vercel + Electron companion).
4. **Không bắt đầu phiên tập trung thật trên dev/localhost** — sẽ ghi đè dữ liệu thật của Đàm qua chung một dòng Supabase. Nếu cần kiểm thử trạng thái RUNNING, dùng cách khác (đọc code + toán học suy luận, hoặc tạo cơ chế demo tách biệt tạm thời rồi khôi phục tài khoản thật sau).
5. **Không quay lại cơ chế sync dựa trên timestamp máy khách** — đây CHÍNH XÁC là lỗ hổng đã gây mất dữ liệu thật (Phần 11). Bất kỳ đề xuất "đơn giản hoá" sync nào bỏ compare-and-swap version phía server đều phải bị từ chối.
6. **Không nới lỏng ngưỡng "BÁO NHẦM = 0%" của bộ chấm điểm chống-bịa AI Coach** — nguyên tắc vàng đã chốt: thà bỏ sót một câu bịa còn hơn xoá oan một câu đúng. Bất kỳ thay đổi guard nào làm chỉ số BÁO NHẦM tăng lên trên 0 đều là một bước lùi cần được xem lại, không phải chấp nhận như một trade-off bình thường.
7. **Không đặt file test API mới cạnh route handler trong `api/`** — luôn đặt trong `api/_tests/` mirror cấu trúc, nếu không sẽ tái tạo sự cố vượt trần function Vercel.
8. **Không khôi phục Qwen/WebLLM/MiniLM/rule-based coach voice/⚡Nhanh/Hỏi Claude API** — tất cả đã bị gỡ có chủ đích qua nhiều quyết định cụ thể (xem Phần 1 và Phần 10). Nếu Đàm chưa yêu cầu rõ ràng, đừng tự ý khôi phục dù có vẻ "hữu ích".
9. **Không gộp `buildAchievementSnapshot` và `buildAchievementSnapshotForReplay` thành một hàm** — trông giống trùng lặp nhưng phục vụ 2 mục đích tính toán khác nhau về độ phức tạp thuật toán (xem Phần 10).
10. **Không tách nhỏ `gameStore.js`/`completeFocusSession` mà không có kế hoạch test hồi quy đầy đủ đi kèm trước** — đây là quyết định có chủ đích hoãn lại, không phải bị quên.
11. **Không thêm cột/bảng mới vào Supabase mà quên tạo file `.sql` tương ứng trong `supabase/` và nhắc chạy tay TRƯỚC khi deploy code phụ thuộc vào nó** — thiếu bước này sẽ khiến production lỗi ngay khi cố ghi vào cột chưa tồn tại.
12. **Không tự ý sửa `description` của skill/achievement mà không đối chiếu code logic thật đứng sau nó** — xem Phần 12, nợ kỹ thuật về mô tả prestige không khớp code là ví dụ cụ thể của rủi ro này.
13. **Không commit/push khi chưa chạy `npm test` + lint** — quy tắc cứng, không có ngoại lệ, ngay cả với thay đổi "nhỏ".
14. **Không cho rằng "code xanh + push thành công" nghĩa là đã lên production thật** — luôn xác nhận trực tiếp tab Deployments trên Vercel dashboard hiện "Ready" (bài học từ Sự cố 3, Phần 11).

---

# PHẦN 15 — NẾU BẮT ĐẦU LẠI TỪ ĐẦU

**Sẽ giữ lại**: triết lý tách "engine thuần" (`src/engine/`) khỏi state (`gameStore.js`) khỏi UI (`components/`) — đây là quyết định kiến trúc TỐT NHẤT của dự án, cho phép test công thức game độc lập và tái sử dụng cùng logic ở cả AI Coach lẫn giao diện thống kê mà không trùng lặp. Cũng sẽ giữ nguyên vẹn triết lý "AI chỉ diễn đạt số đã tính sẵn, không bao giờ tự tính" cho bất kỳ tính năng AI nào trong tương lai — đây là nền tảng của mọi lưới chống-bịa và là lý do niềm tin vào AI Coach được duy trì. Sẽ giữ cơ chế "mọi trạng thái tạm thời (nhiệm vụ/streak/thành tích) luôn được tái tính từ nguồn sự thật (`history`), không bao giờ tin trạng thái đã lưu" — đây là lý do dữ liệu game gần như không thể "hỏng vĩnh viễn" do một lần ghi sai.

**Sẽ bỏ**: quyết định để `gameStore.js` phình to không kiểm soát ngay từ đầu — nếu làm lại, sẽ thiết kế ranh giới module RÕ RÀNG NGAY TỪ ĐẦU cho từng hệ thống con (streak/mission/achievement/crafting/prestige) dưới dạng các slice Zustand riêng có API rõ ràng, thay vì để một action trung tâm (`completeFocusSession`) trở thành điểm nối của mọi thứ qua nhiều tháng phát triển tăng dần. Cũng sẽ đầu tư sớm hơn vào một môi trường Supabase THỨ HAI dành cho dev/test (tách biệt production) — việc dev và production dùng CHUNG một dòng dữ liệu là một quyết định tiết kiệm ban đầu hợp lý cho một dự án nhỏ, nhưng đã trở thành một hạn chế thật (không thể chạy E2E test thật, không thể xác minh trực tiếp một số hiệu ứng UI khi timer đang chạy).

**Sẽ thiết kế lại**: hệ thống thông báo/push — hiện tại có 3 cơ chế tách biệt (in-tab/push/Electron native) với logic phát hiện "hoàn thành thật" (`isSessionEndEvent`) bị lặp lại ở nhiều nơi (dù đã cố gom về một hàm chung phía server) — nếu làm lại, có thể thiết kế một "event bus" nội bộ duy nhất phát ra sự kiện "phiên đã hoàn thành" mà cả 3 kênh thông báo cùng lắng nghe, giảm nguy cơ 3 nơi định nghĩa "hoàn thành" hơi khác nhau.

**Công nghệ sẽ chọn**: vẫn React + Vite + Zustand (nhẹ, đơn giản, đủ cho quy mô 1 người dùng, không cần Redux/thư viện state nặng hơn). Vẫn Node built-in test runner (đủ dùng, không cần Jest/Vitest nặng hơn cho quy mô này). Vẫn Supabase (Postgres miễn phí + realtime + đủ đơn giản cho 1 người dùng) — nhưng sẽ cân nhắc kỹ hơn ngay từ đầu việc TÁCH môi trường dev/production. Vẫn chọn Vercel Serverless cho các tác vụ nhẹ (gọi AI hộ client, gửi push) — nhưng sẽ hiểu rõ giới hạn 12 function NGAY TỪ ĐẦU thay vì phát hiện qua một lần build fail.

**Workflow sẽ thay đổi**: sẽ thiết lập một quy trình kiểm tra "đã thực sự deploy chưa" NGAY TỪ ĐẦU (ví dụ một bước tự động kiểm tra trạng thái Deployment qua Vercel API sau mỗi push) thay vì phải học bài học đó qua một sự cố thật 2 tuần rưỡi tính năng không chạy mà không ai biết.

---

# PHẦN 16 — HƯỚNG DẪN TIẾP QUẢN DỰ ÁN

## Ngày đầu tiên cần đọc gì (theo đúng thứ tự)
1. `BAN_GIAO.md` — trạng thái hiện tại, việc đang dở, nhật ký cập nhật gần nhất. Đây LUÔN là file đọc đầu tiên của mọi phiên, không có ngoại lệ.
2. `CLAUDE.md` — quy tắc bắt buộc + bối cảnh kỹ thuật chi tiết (đặc biệt mục "HỎI TRƯỚC KHI LÀM" và "NGUYÊN TẮC ƯU TIÊN SỐ 1" ở đầu file — đây là 2 quy tắc quan trọng hơn mọi thứ khác).
3. `ARCHITECTURE.md` — bức tranh kiến trúc lớn, luồng dữ liệu, lý do chia lớp.
4. `PROJECT_STRUCTURE.md` — bản đồ thư mục chi tiết, để biết file nào nằm ở đâu khi cần tra cứu.
5. Tài liệu này (`AI_HANDOFF_KNOWLEDGE.md`) — bối cảnh sâu, lịch sử quyết định, bài học.

## Ngày thứ hai cần làm gì
Chạy thử `npm test` và `npm run build` để tự xác nhận môi trường dev hoạt động đúng và làm quen với con số hiện tại (208 bài test, build thành công, 10 Vercel function). Đọc lướt qua `src/engine/gameMath.js` và `src/engine/coach/guard.js` — đây là 2 file THUẦN dễ đọc nhất và mang tính đại diện cao nhất cho triết lý code của dự án (thuần, có test, có comment giải thích "vì sao"). KHÔNG thử chạy một phiên tập trung thật trên dev (xem Phần 14, mục 4).

## Module nào nên hiểu trước
Theo thứ tự ưu tiên: (1) `src/engine/time.js` (nền tảng — mọi khái niệm "ngày/tuần" phụ thuộc vào đây); (2) `src/engine/gameMath.js` (công thức game + tín hiệu phân tích — nền cho mọi thứ khác); (3) `src/hooks/useTimer.js` + `PomodoroEngine.jsx` (luồng chính người dùng tương tác hằng ngày); (4) `src/store/gameStore.js`'s `completeFocusSession` (nút thắt trung tâm, hiểu nó = hiểu cách toàn bộ hệ thống thưởng kết nối với nhau); (5) `src/engine/coach/` (nếu công việc liên quan AI Coach).

## Module nào để sau
`src/components/StatsDashboard.jsx` (lớn, chủ yếu là hiển thị, không ảnh hưởng game logic — an toàn để hiểu muộn hơn); `electron/` (chỉ cần hiểu khi thực sự sửa tính năng tray Mac); các file `BuildingWorkshop.jsx`/`BlueprintInventory.jsx`/`RelicInventory.jsx`/`SkillTree.jsx` (UI cho các hệ thống kinh tế phụ, có thể đọc theo nhu cầu cụ thể thay vì đọc trước toàn bộ).

## Nếu cần debug nên bắt đầu từ đâu
Xác định trước: lỗi thuộc về TÍNH SỐ SAI (mở `gameMath.js`/`gameStore.js`, thường không crash, chỉ số hiển thị sai — cách phát hiện: so sánh thủ công một trường hợp cụ thể với công thức) hay LỖI ĐỒNG BỘ/HẠ TẦNG (kiểm tra Supabase dashboard trước tiên — project có bị pause không, cột `version`/`mode`/`ended_reason` có tồn tại không — ĐỪNG vội đổ lỗi cho code trước khi xác nhận hạ tầng khoẻ mạnh, đây là bài học trực tiếp từ Sự cố 2 và 3 ở Phần 11) hay LỖI AI COACH (kiểm tra `api/coach.js`/`api/_lib/gemini.js` có lỗi API key/quota không TRƯỚC, rồi mới nghi ngờ tới guard/prompt).

## Nếu cần thêm feature nên bắt đầu từ đâu
Trước tiên xác định: đây có phải lệnh "làm" rõ ràng không (Phần 13) — nếu mơ hồ, dừng lại và hỏi. Sau đó: nếu feature liên quan tới công thức/số liệu mới → viết hàm THUẦN mới trong `src/engine/` trước (kèm test), rồi mới nối vào `gameStore.js`. Nếu feature liên quan AI Coach → xác định nó thuộc "tầng số liệu" (thêm hàm tín hiệu mới trong `gameMath.js`/`coachIntel.js`, có gate cỡ mẫu rõ ràng) hay "tầng diễn đạt" (sửa prompt trong `src/engine/coach/prompt.js`) — đừng lẫn hai tầng, tầng số liệu KHÔNG BAO GIỜ nên phụ thuộc vào cách AI diễn đạt. Nếu feature cần route API mới → nhớ đếm lại tổng function Vercel (`find api -type f -name "*.js" ! -path "api/_*"`, phải luôn ≤12) và đặt test tương ứng vào `api/_tests/`.

## Nếu cần refactor nên ưu tiên phần nào
Theo Phần 12: ưu tiên thấp trừ khi có tín hiệu cụ thể (một God File tiếp tục phình to khi thêm tính năng mới, hoặc phát hiện thêm các cặp "trùng lặp thật" chưa được gộp). KHÔNG chủ động đề xuất tách `gameStore.js` trừ khi có kế hoạch test hồi quy đầy đủ đi kèm.

## Nếu cần tối ưu hiệu năng nên xem phần nào
`StatsDashboard.jsx`'s các tab tính toán nặng (Focus/Category) — nhưng chỉ đáng làm nếu THỰC SỰ cảm nhận được độ trễ, không phải tối ưu phòng ngừa (xem Phần 12).

## Nếu cần sửa bug nên đọc những module nào trước
Luôn đọc `BAN_GIAO.md`'s "Nhật ký cập nhật" trước — rất có khả năng một hành vi "kỳ lạ" bạn gặp phải đã từng được ghi chú là một quyết định có chủ đích (ví dụ: guard AI Coach từ chối một câu trả lời hợp lý trông như đúng — có thể là gate cỡ mẫu đang hoạt động đúng thiết kế, không phải bug).

---

# PHẦN 17 — ROADMAP TƯƠNG LAI

## 1 tháng
Giải quyết backlog UI nhỏ đã tồn đọng lâu (Phần 12 nhắc lại từ `ui-review-2026-06`): full-screen iPhone (padding an toàn cho tai thỏ/Dynamic Island qua `env(safe-area-inset-top)`), nút đóng rõ ràng cho modal phần thưởng (hiện tự phát tự động, có thể cảm giác "ép buộc"), tôn trọng `prefers-reduced-motion` cho người nhạy cảm chuyển động. Xác minh trực tiếp (không chỉ đọc code) liệu 3 kỹ năng nhánh Thăng Hoa có thực sự hoạt động đúng mô tả khi prestige lần đầu xảy ra (Phần 12, nợ kỹ thuật ưu tiên trung bình-cao) — đây nên làm SỚM vì ảnh hưởng trực tiếp tới tính minh bạch của game khi Đàm đạt tới cột mốc đó.

## 3 tháng
Nếu Đàm tiếp tục ưu tiên cá nhân hoá sâu cho AI Coach (xu hướng rõ ràng từ memory `coach-personalization-priority`): mở rộng cơ chế "bộ nhớ lời khuyên" (`coachAdviceMemory.js`) sang các loại lời khuyên khác ngoài chỉnh mục tiêu ngày (ví dụ theo dõi khuyến nghị về "giờ vàng" hay "loại việc bị bỏ bê" theo thời gian tương tự). Cân nhắc thiết lập một môi trường Supabase project THỨ HAI cho dev/test (Phần 15) — đây là khoản đầu tư hạ tầng có lợi ích dài hạn lớn (mở khoá khả năng viết E2E test thật, xác minh trực tiếp các hiệu ứng UI khi timer chạy mà không sợ ghi đè dữ liệu thật).

## 6 tháng
Nếu `gameStore.js` tiếp tục phình to do thêm tính năng mới (dấu hiệu rõ ràng: `completeFocusSession` vượt quá ~900-1000 dòng, hoặc thêm một hệ thống gameplay lớn mới đòi hỏi cắm thêm vào action này), đây là lúc nên nghiêm túc lên kế hoạch tách store — NHƯNG PHẢI đi kèm một khoản đầu tư tương xứng vào test hành vi trước khi tách (không tách "cho gọn" mà không có lưới an toàn). Cân nhắc liệu có cần một dạng giám sát lỗi nhẹ (ví dụ chỉ ghi log lỗi runtime vào một bảng Supabase đơn giản, không cần dịch vụ trả phí như Sentry) để phát hiện sớm hơn các lỗi "âm thầm không crash" như đã xảy ra ở Phần 11/12.

## 1 năm
Đây là mốc mà theo chính comment hiệu chỉnh trong `constants.js`, một người dùng với nhịp độ trung bình (12 phiên × 25 phút/ngày) mới hoàn thành hết 15 kỷ nguyên và chạm ngưỡng prestige đầu tiên — đây là cột mốc tự nhiên để đánh giá lại: cân bằng phần thưởng có đúng như thiết kế không (game có cảm giác "kéo dài đủ 1 năm" như tính toán hay bị lệch), và liệu prestige (làm lại từ đầu) có thực sự hấp dẫn để chơi tiếp hay cần thêm động lực mới cho "New Game+".

## Technical debt nào nên giải quyết trước
Theo thứ tự ưu tiên thực tế (không phải theo "độ nghiêm trọng lý thuyết" mà theo tỷ lệ lợi ích/rủi ro thực tế ở quy mô 1 người dùng): (1) xác minh bug prestige-skill-description (rẻ, rủi ro thấp, ảnh hưởng trực tiếp trải nghiệm); (2) môi trường dev/test Supabase riêng (đắt hơn nhưng mở khoá rất nhiều khả năng kiểm thử an toàn); (3) tách `gameStore.js` (chỉ khi có tín hiệu cụ thể cần, không làm phòng ngừa).

## Những kiến trúc nào nên giữ nguyên
Toàn bộ triết lý "engine thuần tách khỏi state tách khỏi UI"; cơ chế "First Action Wins" cho sync; nguyên tắc "AI chỉ diễn đạt số đã tính sẵn" cho mọi tính năng AI tương lai; quy ước `api/_lib/`+`api/_tests/` cho cấu trúc Vercel functions; và quan trọng nhất — **văn hoá tài liệu hoá liên tục** (CLAUDE.md/BAN_GIAO.md/nhật ký cập nhật) — đây không phải "thủ tục hành chính thừa" mà là cơ chế sống còn cho một dự án được phát triển qua hàng chục phiên AI độc lập không có bộ nhớ chung nào khác.

---

# PHẦN 18 — ĐÁNH GIÁ TỔNG THỂ

*(Góc nhìn Software Architect, thang điểm 10, kèm lý do)*

**Điểm mạnh**: (1) kỷ luật kiến trúc "engine thuần" xuyên suốt — hiếm gặp ở một dự án được xây hoàn toàn qua AI-pair-programming với chủ dự án non-coder; (2) văn hoá tài liệu hoá cực kỳ nghiêm túc và nhất quán, phản ánh đúng bối cảnh vận hành (nhiều phiên AI rời rạc); (3) tư duy "trung thực dữ liệu" xuyên suốt không chỉ ở AI Coach mà cả tầng thống kê (luôn nói rõ cỡ mẫu, luôn từ chối tuyên bố khi thiếu bằng chứng) — đây là một tiêu chuẩn chất lượng hiếm thấy ngay cả ở các sản phẩm thương mại; (4) khả năng tự phục hồi qua nhiều sự cố thật — mỗi sự cố đều dẫn tới một fix TẬN GỐC (không vá tạm), và bài học được ghi lại đầy đủ, không lặp lại.

**Điểm yếu**: (1) một God File (`gameStore.js`) và một God Function (`completeFocusSession`) tồn tại có chủ đích nhưng vẫn là rủi ro tiềm ẩn thật; (2) không có E2E test hay giám sát production nào — mọi phát hiện lỗi phụ thuộc vào trải nghiệm thật của đúng một người dùng; (3) một khoảng cách xác nhận giữa "mô tả tính năng" (văn bản trong constants.js) và "hành vi thật" (nghi vấn prestige-skill) chưa được kiểm chứng; (4) môi trường dev/production dùng chung dữ liệu, giới hạn khả năng kiểm thử an toàn.

## Bảng điểm chi tiết

| Tiêu chí | Điểm /10 | Lý do |
|---|---|---|
| Kiến trúc tổng thể | 8 | Phân lớp engine/store/UI rõ ràng, nhất quán; điểm trừ vì God File/Function chưa được xử lý (dù có chủ đích) |
| Khả năng mở rộng (scale ra nhiều người dùng) | 4 | Toàn bộ thiết kế giả định 1 người dùng (1 dòng DB, không auth, không multi-tenancy) — mở rộng thật sẽ cần viết lại tầng dữ liệu/auth gần như từ đầu |
| Khả năng bảo trì | 8 | Tài liệu hoá xuất sắc + code thuần dễ test bù lại cho các God File còn tồn tại |
| Khả năng onboarding (cho AI/người mới) | 9 | Đây là điểm mạnh nhất — CLAUDE.md/BAN_GIAO.md/nay thêm ARCHITECTURE.md+PROJECT_STRUCTURE.md tạo thành một bộ tài liệu bàn giao thuộc hàng tốt nhất có thể có cho một dự án quy mô này |
| Khả năng test | 7 | 208 test đơn vị/tích hợp chất lượng cao, có cả bộ chấm điểm tự động cho AI Coach — nhưng thiếu hẳn E2E do ràng buộc dev/production dùng chung dữ liệu |
| Khả năng refactor | 7 | Đợt refactor 2026-07-12 chứng minh dự án CÓ THỂ tái cấu trúc an toàn (208/208 test xanh, 0 regression) — điểm trừ vì vẫn còn 2 God File/Function chưa động tới |
| Khả năng thêm AI (mới hoặc mở rộng) | 9 | Kiến trúc model-agnostic đã được chứng minh qua thực tế (đổi từ Qwen sang Gemini chỉ cần thay 1 file cổng gọi, giữ nguyên toàn bộ "bộ não") — cực kỳ tốt cho việc thử nghiệm model AI tương lai |
| Khả năng mở rộng tính năng gameplay | 8 | Hệ thống hằng số tập trung (`constants.js`) + softcap/trần cứng pre-installed cho tương lai cho thấy tư duy mở rộng đã được tính trước, dù một số cơ chế (TTCH_PER_CHARGE_SUB, prestige-skill) có dấu hiệu chưa hoàn thiện 100% |

**Đánh giá tổng thể**: đây là một dự án cá nhân được xây dựng với kỷ luật kỹ thuật cao hơn hẳn mức cần thiết cho quy mô của nó — một sự đầu tư có chủ đích vào chất lượng vì bản thân quá trình xây dựng cũng là một phần mục tiêu. Rủi ro lớn nhất không nằm ở kiến trúc (đã khá vững) mà ở **quy mô một-người-dùng-một-điểm-lỗi**: mọi sự cố đều là sự cố với dữ liệu THẬT của một người, không có "người dùng khác" để giảm thiểu tác động — điều này giải thích tại sao dự án phản ứng RẤT NGHIÊM TÚC với những sự cố mà ở một sản phẩm nhiều người dùng có thể chỉ coi là "edge case chấp nhận được".
