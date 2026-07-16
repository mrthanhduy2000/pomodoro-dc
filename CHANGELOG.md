# Changelog — Pomodoro DC

> Đây KHÔNG phải lịch sử commit, và KHÔNG phải bản sao của `BAN_GIAO.md`. File này là bản tóm tắt
> CHÍNH THỨC, NGẮN GỌN theo mốc thay đổi quan trọng — chỉ ghi mục đích/phạm vi/ảnh hưởng/tương
> thích, để người đọc (hoặc AI) nắm nhanh project đã tiến hoá thế nào theo thời gian mà không phải
> đọc hết nhật ký chi tiết.
>
> **Muốn xem bối cảnh đầy đủ, lý do từng dòng, số liệu test chính xác từng lần** → đọc mục "Nhật ký
> cập nhật" trong `BAN_GIAO.md` (đó mới là nguồn chi tiết đầy đủ nhất, cập nhật ngay sau mỗi việc).
> **Muốn hiểu VÌ SAO một quyết định được chọn** → `ARCHITECTURE_DECISIONS.md`. **Muốn biết migration
> cụ thể nào cần chạy** → `MIGRATION.md`.

---

## 2026-07-17 — Giai đoạn A: lưới an toàn đợt 2 (level-up, prestige, streak, skill, sync-retry)

- **Mục đích**: hoàn tất phần còn thiếu của "safety net" — bảo đảm các tài sản quan trọng (SP,
  cấp độ, chuỗi ngày, và đặc biệt toàn bộ dữ liệu giữ-lại khi Thăng Hoa) không mất âm thầm sau
  các thao tác chính.
- **Phạm vi**: +16 bài test (237→253), gồm 1 file MỚI `gameStore.prestige.test.js` (bảo toàn
  từng khoá whitelist qua `triggerPrestige` + đóng băng bug TECH_DEBT #3 bằng characterization)
  và bổ sung vào 4 file test có sẵn (`computeLevelUps` trực tiếp, streak nối/đứt chuỗi,
  `unlockSkill` cơ bản, sync retry-sau-lỗi).
- **Ảnh hưởng**: chỉ-thêm-test; không đổi một dòng code ứng dụng; lint sạch; build OK.
- **Tương thích**: không thay đổi runtime/API/migration.
- **Ghi chú**: bug #3 (3 kỹ năng Thăng Hoa hứa đặc quyền nhưng không nối dây) nay bị ĐÓNG BĂNG
  bằng test — sửa #3 trong tương lai bắt buộc phải cập nhật test đó một cách có ý thức.

## 2026-07-13 — Giai đoạn A: lưới an toàn test cho đường-tiền + đường-sync + hủy phiên

- **Mục đích**: dựng "safety net" characterization/behavior test TRƯỚC khi được phép refactor hoặc
  sửa logic quan trọng — đòn bẩy #1 để tiến gần cổng Giai đoạn A của roadmap POS (tiêu chí "test đủ
  bảo vệ module quan trọng").
- **Phạm vi**: 3 file test MỚI, chỉ-thêm-test: `gameStore.completeFocusSession.test.js` (15 bài),
  `syncService.behavior.test.js` (8 bài), `gameStore.cancelFocusSession.test.js` (6 bài). Khóa
  hành vi thật của XP/EP/level/loot/RNG-tất-định, push/pull compare-and-swap (thắng/thua/re-pull/
  lỗi), và phạt/rollback khi hủy phiên.
- **Ảnh hưởng**: `npm test` 208→237 bài (xanh hết); lint sạch; build OK. **KHÔNG đổi một dòng code
  ứng dụng nào** — bundle production không đổi (Vite không đóng gói file test).
- **Tương thích**: không có thay đổi runtime, không đổi API, không migration.
- **Ghi chú**: test #7 của sync KHÓA CHỦ ĐÍCH hành vi rủi ro C1 (initSync đẩy local vô điều kiện khi
  cloud không mới hơn) làm đặc tả hiện trạng; các nhánh phạt early-return + waive-bằng-than-lượng +
  bảo tồn dữ liệu qua prestige còn để dành (NOTE trong file test).

## 2026-07-12 — Refactor kiến trúc toàn dự án + thiết lập Project Governance Protocol

- **Mục đích**: dọn trùng lặp code tích luỹ qua nhiều tháng, chuẩn hoá cấu trúc thư mục theo domain,
  giảm coupling — theo yêu cầu "Senior Software Architect" của Đàm (10 nguyên tắc rõ ràng).
- **Phạm vi**: 90 file bị đụng (thêm/sửa/xoá/dời); gom toàn bộ AI Coach vào `src/engine/coach/`;
  gộp 9 mảng logic bị chép tay nhiều nơi (mark-label, AudioContext, auth-check cron, badge/style,
  Rich Text parser, Glyph icon, pipeline Gemini, payload push, helper Gemini thuần); xoá dead code
  (~1350 dòng); thêm `ARCHITECTURE.md`+`PROJECT_STRUCTURE.md`.
- **Ảnh hưởng**: `npm test` 195→208 bài; lint sạch; build OK; vẫn đúng 10 Serverless Functions.
- **Tương thích**: không đổi business logic ngoài 1 bug xác nhận đã sửa (`isSessionEndEvent` lệch
  chuẩn giữa 2 route push, nay hợp nhất 1 bản đúng).
- **Đi kèm**: thiết lập Project Governance Protocol (file này + `TECH_DEBT.md`+`MIGRATION.md`+
  `ARCHITECTURE_DECISIONS.md`+`AI_ONBOARDING.md` mới, section governance mới trong `CLAUDE.md`).

## 2026-07-11 — Sự cố kép: sync mất dữ liệu + Supabase tự pause + vượt trần Vercel function

- **Mục đích**: xử lý 3 sự cố production liên tiếp trong cùng một ngày.
- **Phạm vi**: (1) thiết kế lại cơ chế sync sang "First Action Wins" (version compare-and-swap
  phía server, thay cho so sánh timestamp client); (2) dọn log cron phình dung lượng + thêm cron
  keepalive chống Supabase tự pause; (3) chuyển toàn bộ test `api/` vào `api/_tests/` để không còn
  bị Vercel tính oan vào trần 12 Serverless Functions.
- **Ảnh hưởng**: mất vĩnh viễn 1 phiên tập trung thật (không phục hồi được, chấp nhận có chủ đích
  để không tạo dữ liệu giả đi vòng qua hệ thống XP/streak).
- **Tương thích**: đổi schema DB (thêm cột `version` cho `game_state`) — xem `MIGRATION.md`.
- **Chi tiết đầy đủ**: `BAN_GIAO.md` (3 mục nhật ký cùng ngày) + `ARCHITECTURE_DECISIONS.md` ADR-004/005.

## 2026-06-25 — Hoàn tất chuỗi 6 mảng nâng cấp trí tuệ AI Coach

- **Mục đích**: nâng cấp toàn diện AI Coach theo lệnh "làm toàn bộ, chuyên sâu" của Đàm.
- **Phạm vi**: (1) siết niềm tin (nhiệt độ giải mã, bộ chấm điểm chống-bịa, timeout); (2) tín hiệu
  "phiên liền mạch vs ngắt quãng" (`pauseSegments`); (3) Coach chủ động tự nhắc sau mỗi phiên; (4)
  model mạnh hơn (`gemini-2.5-pro`) cho bài phân tích 4 phần; (5) bộ nhớ lời khuyên theo thời gian;
  (6) cảnh báo chuỗi sắp đứt qua push (cron chiều tối).
- **Ảnh hưởng**: AI Coach trở thành tính năng khác biệt hoá lớn nhất của app.
- **Lưu ý tương thích quan trọng**: mảng (6) từng bị Vercel build FAIL âm thầm ngay khi commit (do
  cùng nguyên nhân vượt trần function ở trên) — KHÔNG chạy thật trên production suốt 25/6–11/7 dù
  tài liệu ghi "hoàn tất". Bài học: xác nhận Vercel Deployments "Ready", đừng tin code xanh.

## 2026-06-24 — Chốt AI Coach: chỉ Gemini đám mây, gỡ hẳn Qwen/WebLLM on-device

- **Mục đích**: Qwen 3B chất lượng kém + không chạy được trên iPhone.
- **Phạm vi**: xoá `webllmEngine.js`, dependency `@mlc-ai/web-llm`, mọi nhánh fallback on-device.
  Bật billing Gemini (hết lỗi 429).
- **Ảnh hưởng**: app nhẹ hơn hẳn, AI Coach chạy được TRÊN CẢ IPHONE.
- **Tương thích**: đánh đổi có chủ đích — mất mạng/hết quota = Coach ngừng, không còn dự phòng
  chạy tại chỗ. Xem `ARCHITECTURE_DECISIONS.md` ADR-003.

## 2026-06-20 → 2026-06-24 — Nhiều vòng nâng cấp "bộ não" AI Coach (chuyên gia hoá + chống-bịa)

- **Mục đích**: Coach từ một bộ trả lời đơn giản trở thành "chuyên gia phân tích dữ liệu" đáng tin.
- **Phạm vi**: khung 3 nhịp (chat)/4 phần (báo cáo tổng thể); lưới chống-bịa số nhiều tầng
  (`findFabricatedNumbers`/`findFabricatedFractions`/`findMismatchedPairs`); tầng số liệu
  `coachIntel.js` (Wilson lower bound, hồ sơ tập trung, dự đoán); nhiều tín hiệu phân tích mới
  (giờ vàng, xu hướng dài hạn, cuối tuần vs trong tuần, phục hồi sau nghỉ...).
- **Ảnh hưởng**: đặt nền móng "AI chỉ diễn đạt số đã tính sẵn, không bao giờ tự tính" — nguyên tắc
  áp dụng xuyên suốt tới nay.
- **Chi tiết đầy đủ**: `BAN_GIAO.md` có ~15 mục nhật ký riêng cho giai đoạn này (mỗi lần chỉnh guard
  đều ghi số liệu BẮT%/BÁO NHẦM% cụ thể).

## 2026-06-20 — "Cộng Hưởng": nối Kỹ năng ↔ Nhiệm vụ ↔ Kho báu

- **Mục đích**: liên kết 3 hệ thống tiến triển vốn tách rời, không lạm phát.
- **Phạm vi**: thêm currency TTCH (Tinh Thể Cộng Hưởng, cap 12), cơ chế cộng hưởng di vật↔kỹ năng
  (giảm 50% giá SP), "Dồn Lực" (chỉ 1 hiệu ứng bùng nổ/phiên), softcap phòng-hờ cho tương lai.
- **Ảnh hưởng**: không đổi additive-pool hiện có; mọi softcap mới là no-op tại thời điểm ra mắt
  (phòng hờ cho nội dung tương lai).

## 2026-06-14 → 2026-06-16 — Làm lại giao diện theo hướng "calm focus" + 4 skin + icon riêng

- **Mục đích**: UI/UX review đa chiều, chọn hướng "tập trung tĩnh lặng".
- **Phạm vi**: "Focus tĩnh" khi đang chạy phiên (ẩn huy hiệu game); 4 skin (Editorial/Aurora/
  Ink&Gold/Swiss) qua token CSS; bộ icon hình học tự vẽ thay emoji; sidebar tối gọn; cột phải
  Focus (Hôm nay/Chuỗi/AI Coach).
- **Ảnh hưởng**: chỉ giao diện — không đổi game logic.

## 2026-06-14 — Khởi động chuỗi nâng cấp gameplay ("upgrade roadmap")

- **Mục đích**: audit đa-agent tìm hướng nâng cấp UX/UI/gameplay, chọn hướng "deep & differentiating".
- **Phạm vi**: thưởng mục tiêu thật (+12% khi đạt goal), gợi ý độ dài phiên thông minh, lá chắn
  streak, onboarding 3 thẻ, và khởi đầu ý tưởng AI Coach.
- **Ảnh hưởng**: đặt nền cho toàn bộ các đợt nâng cấp lớn sau này.

---

## Ghi chú vận hành

- Mỗi lần hoàn thành một thay đổi ĐÁNG KỂ (không phải mọi commit nhỏ), thêm 1 mục MỚI vào ĐẦU file
  này — ngắn gọn (mục đích/phạm vi/ảnh hưởng/tương thích), không kể lể chi tiết như `BAN_GIAO.md`.
- Nếu thay đổi có một quyết định kiến trúc đáng ghi ADR → thêm cả vào `ARCHITECTURE_DECISIONS.md`
  và trỏ chéo. Nếu có migration thật → thêm vào `MIGRATION.md` và trỏ chéo.
