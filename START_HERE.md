# START_HERE — đọc file này, và chỉ file này, khi mở một phiên mới

> **Đây là file DUY NHẤT bắt buộc đọc trước khi làm việc.** Mọi file khác là KHO TRA CỨU:
> chỉ mở khi `grep` trúng thứ đang cần. Trước đây quy tắc bắt đọc trọn `CLAUDE.md` +
> `BAN_GIAO.md` = **6.323 dòng** mỗi phiên; đó là lý do mỗi phiên chỉ còn ~20% sức để xây.
> Cách làm việc + cách ra prompt + cách báo cáo: **`PHASE_RULES.md`**.

## Dự án là gì
App Pomodoro cá nhân của Đàm (non-coder). React + Vite + PWA · Zustand + localStorage ·
Supabase sync · Vercel. Bản thật: `https://pomodoro-dc.vercel.app`.
Mặt trận đang làm: **thành phố 3D** (`src/engine/city3d/` + `src/components/city/render3d/`).

## 5 luật thật sự cắn — vi phạm là hỏng thật
1. **ADR-007 — bảo tàng bất động.** Công trình đã xây KHÔNG BAO GIỜ đổi chỗ. Địa hình
   không được phụ thuộc tiến độ chơi. Hỏng luật này = mất thành phố của Đàm.
2. **Chỉ nhánh `main` mới lên production.** Push nhánh phụ = chỉ có bản Preview.
   ⚠️ **TỰ GỘP VÀO `main` RỒI PUSH, KHÔNG HỎI** — Đàm chốt 2026-08-22: *"sau này tự deploy,
   tôi không có việc gì phải tự deploy cả"*. CHỈ dừng lại hỏi khi gỡ xung đột đòi phải vứt
   bỏ công của một phiên khác. Vẫn phải BÁO RÕ những gì NGOÀI phần việc của mình cũng vừa
   lên production. Push xong phải xác nhận Vercel hiện "Ready".
   *(Bản đầu của file này ghi ngược — "KHÔNG tự gộp, hỏi Đàm" — trong khi `CLAUDE.md` mục
   "Quy trình deploy" nói rõ điều ngược lại. `CLAUDE.md` là NGUỒN SỰ THẬT DUY NHẤT về quy
   tắc; một bản tóm tắt chép sai một luật vận hành thì tệ hơn không có bản tóm tắt.)*
3. **Không hạ DPR · không thêm nguồn sáng thứ tư.** Hai cách phá hình ảnh nhanh nhất.
4. **Không start phiên focus trên dev/localhost** — dùng chung Supabase row với bản thật.
5. **Vercel Hobby: tối đa 12 Serverless Function.** Test của `api/` phải nằm trong
   `api/_tests/`. Hiện có 10 function thật.

## Đang ở đâu
- Nhánh production: `main`. Mốc gần nhất: **ADR-060** (MỘT thẻ phần thưởng chung cho cả app +
  luật mức độ làm phiền: **chặn màn hình CHỈ dành cho lên kỷ · thăng hoa · khủng hoảng kỷ · thảm
  hoạ**; mọi phần thưởng khác đi qua chồng toast `RewardToastHost`, tự tắt sau 4 giây).
  Trước đó: **ADR-059** (mỗi kỷ MỘT MẠNG ĐƯỜNG riêng — hết bàn cờ; `roadPlan.js` nối các điểm mốc
  bằng cung cong ⇒ giao lộ chữ T/Y/ngã năm).
- Chuyển động: **ĐÚNG BA NHỊP**, nguồn duy nhất `src/lib/motionPresets.js` — `enter` (thứ xuất
  hiện) · `press` (thứ bấm được) · `reward` (phần thưởng, cột mốc). Cả ba **tự im** khi bật
  "Giảm chuyển động" nên chỗ gọi đừng tự kiểm tra. ⚠️ Đừng gõ lại `initial`/`animate` bằng tay,
  đừng thêm nhịp thứ tư (`motionPresets.test.js` đếm và sẽ đỏ). Ngoại lệ đi qua `useCustomMotion`
  (bỏ hẳn) hoặc `useSnapMotion` (nhảy tới đích, cho thứ mà `animate` MANG BỐ CỤC — trả rỗng ở đó
  là vỡ giao diện), và phải kèm một dòng lý do. **KHÔNG áp cho thành phố 3D.**
- Điều hướng: **5 mục** ở thanh bên desktop (Tập trung · Hành trang · Thành Phố · Thống kê · Cài
  đặt); iPhone **4 nút + "Thêm"**. Kỹ năng/Kho báu/Thành tích là ba TAB CON của "Hành trang" và
  **vẫn mang id cũ** — thông báo đã lưu trỏ vào chúng, `resolveTabTarget` (`App.jsx`) là cửa dịch.
- Giao diện: **5 skin**, mặc định là **"Sân Chơi" (`arcade`)** — phẳng, sans đậm, thẻ có chân bóng
  đặc 3px. Danh sách skin + mặc định có MỘT nguồn duy nhất: `src/store/uiSkins.js`. ⚠️ Thêm skin thì
  phải đủ ba chỗ (danh sách · `SKIN_OPTIONS` ở `Settings.jsx` · khối `[data-skin=…]` ở `index.css`)
  **và** một khối `[data-theme="dark"][data-skin=…]`, vì khối `[data-theme="dark"]` đứng sau mọi
  khối skin với độ đặc hiệu bằng nhau nên nó thắng. `uiSkins.test.js` canh cả bốn.
- Phần thưởng: MỘT thẻ chung `components/shared/RewardCard.jsx`, MỘT thang độ hiếm **đúng bốn
  bậc** ở `engine/rewardTiers.js` (thường/tốt/hiếm/huyền thoại). ⚠️ Đừng thêm bậc thứ năm và đừng
  vẽ thẻ phần thưởng riêng ở một màn nào nữa — `rewardTiers.test.js` khoá con số 4.
- Cảnh 3D: 15 kỷ, mỗi kỷ buộc vào một nước có thật (`country`/`landmark` ở `eraStyle.js`).
  Các bảng bản sắc 15 kỷ đã có: mái · tầng trệt · mặt đường · thực vật · địa thế/nước ·
  vùng phụ cận · khu phố · dáng đi · mạng đường.
- Lưới thành phố **12×12**. Từ ADR-059 mỗi kỷ có mạng đường RIÊNG (**29…83 ô**, không còn
  là 80 ô chung); 45 ô hứa cho kỳ quan (chỉ 5 ô có nhà); còn **371 ô nhà dân trên cả 15 kỷ**,
  đã chạm trần. Muốn thành phố đông hơn thì đổi thứ NẰM TRONG một ô, đừng thêm ô.
  ⚠️ Hỏi mạng đường thì phải truyền `era`: `roadCellCandidates(era)` / `roadCellCount(era)` —
  gọi thiếu tham số sẽ **im lặng** trả lời về kỷ 1.
- Hiệu năng: đã đo dứt điểm trên Apple M3 — **dư 3,2 lần**, hình học gần như miễn phí.
  **KHÔNG đo lại** trừ khi Đàm thấy khung hình giật trên máy thật.

## Việc tiếp theo (chưa làm)
0. **Báo cáo tuần vẫn tự bật sáng thứ Hai** — ngoại lệ DUY NHẤT của luật mức độ làm phiền
   (ADR-060). ⚠️ Đọc `TECH_DEBT #87` TRƯỚC: phải tách "đã xem" khỏi "đã bỏ qua" rồi mới đụng,
   nếu không lỡ một cái toast 4 giây = mất báo cáo của cả tuần.
1. **Kim tự tháp / ziggurat** — kỷ 2 (Ai Cập) và kỷ 3 (Iraq) đang ra mái nón nhiều cạnh,
   không có khối chóp bốn mặt. `prism` với `sides: 4` + `taper: 0` chính là thứ cần.
2. **"Giống 3D hơn"** — bóng đổ nét hơn (`SHADOW_MAP_DESKTOP` 2048 → 4096, siết
   `sun.shadow.camera` về phạm vi thành phố) + thêm che khuất môi trường (AO).

## Lệnh hay dùng
```
npm install --legacy-peer-deps          # cần flag này
npm test                                # in số bài THẬT ở dòng cuối
npm run lint && npm run build
node scripts/city-preview.mjs --era 6 --hour 12 --width 1500     # soi một kỷ
node scripts/city-preview.mjs --sweep --eras 1,2,3,4,5           # bảng so sánh
```

## Tra cứu ở đâu
`PHASE_RULES.md` cách làm việc · `CLAUDE.md` quy tắc đầy đủ + lịch sử bài học ·
`PROJECT_STRUCTURE.md` file nằm đâu · `ARCHITECTURE.md` luồng dữ liệu ·
`ARCHITECTURE_DECISIONS.md` vì sao chọn thế · `TECH_DEBT.md` nợ đã biết ·
`PERFORMANCE.md` số đo · `BAN_GIAO.md` nhật ký (chỉ đọc 60 dòng đầu) ·
`docs/archive/` lịch sử đầy đủ.
