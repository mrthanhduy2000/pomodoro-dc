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
   **KHÔNG tự gộp `main`** — hỏi Đàm. Push xong phải xác nhận Vercel hiện "Ready".
3. **Không hạ DPR · không thêm nguồn sáng thứ tư.** Hai cách phá hình ảnh nhanh nhất.
4. **Không start phiên focus trên dev/localhost** — dùng chung Supabase row với bản thật.
5. **Vercel Hobby: tối đa 12 Serverless Function.** Test của `api/` phải nằm trong
   `api/_tests/`. Hiện có 10 function thật.

## Đang ở đâu
- Nhánh production: `main`. Mốc gần nhất: **ADR-058** (tim đường uốn cong, mạng đường ba hạng).
- Cảnh 3D: 15 kỷ, mỗi kỷ buộc vào một nước có thật (`country`/`landmark` ở `eraStyle.js`).
  Các bảng bản sắc 15 kỷ đã có: mái · tầng trệt · mặt đường · thực vật · địa thế/nước ·
  vùng phụ cận · khu phố · dáng đi · mạng đường.
- Lưới thành phố **12×12**: 80 ô là đường (55,6%) · 45 ô hứa cho kỳ quan (chỉ 5 ô có nhà)
  · **còn 30 ô cho nhà dân, đã chạm trần ở cả 15 kỷ**. Muốn thành phố đông hơn thì đổi
  thứ NẰM TRONG một ô, đừng thêm ô.
- Hiệu năng: đã đo dứt điểm trên Apple M3 — **dư 3,2 lần**, hình học gần như miễn phí.
  **KHÔNG đo lại** trừ khi Đàm thấy khung hình giật trên máy thật.

## Việc tiếp theo (chưa làm)
1. **Đường đứt nét** — Đàm báo mạng đường ra thành mảng chữ nhật rời có khe hở. Chưa chẩn đoán.
2. **Kim tự tháp / ziggurat** — kỷ 2 (Ai Cập) và kỷ 3 (Iraq) đang ra mái nón nhiều cạnh,
   không có khối chóp bốn mặt. `prism` với `sides: 4` + `taper: 0` chính là thứ cần.
3. **"Giống 3D hơn"** — bóng đổ nét hơn (`SHADOW_MAP_DESKTOP` 2048 → 4096, siết
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
