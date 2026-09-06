# TECH_DEBT — closed entries, frozen 2026-09-06 (ADR-075)

> Full text of **40 closed debt entries**, moved verbatim out of the active `TECH_DEBT.md`.
> Nothing was rewritten or deleted: each entry keeps all 14 fields, its rationale and its history.
>
> **Why:** the active file had grown to 435,288 chars ≈ 252,634 tokens = **126% of a 200k context
> window**, so a single careless read blew the whole context, and every `grep` had to wade through
> debts that were already fixed. Closed entries are history, not work — they belong in an archive
> that is opened deliberately.
>
> **How to find one:** `grep -n '^## #<number>' docs/archive/TECH_DEBT_CLOSED_2026-09-06.md`, or use
> `node scripts/doc-budget.mjs --map docs/archive/TECH_DEBT_CLOSED_2026-09-06.md` for the full index without reading the file.
> The active `TECH_DEBT.md` keeps a one-line index pointing here for every entry below.

---

## #5 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — Rủi ro lệch giữa mô tả tĩnh (`constants.js`) và hành vi code thật

- **Module**: `src/engine/constants.js` nói chung (không chỉ 3 kỹ năng ở mục #3)
- **Priority**: Low-Medium
- **Severity**: Low
- **Impact**: mang tính phòng ngừa — mục #3 là MỘT ví dụ cụ thể đã phát hiện; có khả năng còn các
  mô tả khác (achievement/skill/building) cũng lệch so với code thật mà chưa được rà soát.
- **Root Cause**: không có cơ chế kiểm tra tự động nào đối chiếu văn bản `description` với hành vi
  `check()`/logic thật tương ứng.
- **Current Risk**: thấp (chỉ 1 trường hợp cụ thể đã xác nhận khả nghi).
- **Future Risk**: thấp-trung bình, tăng dần theo thời gian nếu không rà soát định kỳ.
- **Recommended Solution**: rà soát định kỳ (không cần gấp) khi có thời gian rảnh giữa các tính
  năng lớn — đọc lại một lượt các mô tả skill/achievement và đối chiếu nhanh với code.
- **Estimated Complexity**: Thấp mỗi lần rà soát, nhưng tốn thời gian vì khối lượng lớn (360
  achievement + 36 skill + 75 blueprint).
- **Blocking Conditions**: không có.
- **Review Trigger**: định kỳ, hoặc khi phát hiện thêm 1 trường hợp lệch cụ thể khác (như #3).
- **Owner**: (chưa gán)
- **Status**: Open — mang tính phòng ngừa, không cấp bách.


- **✅ ĐÃ XỬ LÝ 2026-09-02 — biến một LỜI HẸN thành một CỔNG.** Mục này kê đơn *"rà soát định kỳ
  khi có thời gian rảnh"*, mà một lời hẹn rà soát thì **không bao giờ đỏ lên**: chính #3 đã chứng
  minh — ba kỹ năng Thăng Hoa hứa hẹn rành mạch mà code chưa bao giờ nối dây, nằm im gần **hai
  tháng** qua nhiều phiên đọc đúng file ấy. Nguyên nhân gốc mà mục này tự nêu là *"không có cơ chế
  kiểm tra tự động nào"* — nay đã có: `src/engine/descriptionDrift.test.js` (2 bài, đã thử-cho-đỏ
  3 cách) đối chiếu con số trong `description` với `moc` thật ở **310 thành tích**.
- **Kết quả lần chạy đầu: 0 chỗ lệch thật.** 49 chỗ "lệch" là ĐỔI ĐƠN VỊ (`moc` tính bằng phút,
  mô tả nói giờ) — cổng hiểu điều đó; 11 chỗ còn lại có số trong mô tả là SỐ THÁNG chứ không phải
  ngưỡng, nằm trong danh sách miễn trừ **tường minh đếm được** (`assert.deepEqual`), nên mục thứ
  mười hai rơi vào đây sẽ đỏ — **và một mục được SỬA để hết lệch cũng đỏ**, nhắc dọn danh sách.
- ⚠️ Cổng này chỉ khả thi nhờ vòng 24 đổi 310/360 thành tích từ `check: (s) => s.x >= N` (một hàm,
  đọc không ra ngưỡng) sang **DỮ LIỆU** `dem`/`moc`. *Biến luật thành dữ liệu thì mới canh được luật.*

---

## #6 — ✅ **ĐÃ XỬ LÝ (2026-09-06, ADR-071)** — Hiệu năng: các tab nặng của `StatsDashboard.jsx` tính lại toàn bộ lịch sử mỗi lần render

- **Module**: `src/components/StatsDashboard.jsx` (`FocusTab`, `CategoryTab`)
- **Priority**: Low
- **Severity**: Low
- **Impact**: mỗi lần đổi filter (kỳ/danh mục) quét lại toàn bộ mảng `history`. Chưa phải vấn đề
  thật ở quy mô hiện tại (đã có `useMemo`/`useTransition`/`useDeferredValue` giảm giật).
- **Root Cause**: thiết kế đơn giản ban đầu (quét toàn bộ, không cache/index) phù hợp quy mô nhỏ.
- **Current Risk**: rất thấp.
- **Future Risk**: trung bình nếu lịch sử phình lên rất lớn (nhiều năm sử dụng liên tục, hàng chục
  nghìn phiên).
- **Recommended Solution**: nếu thực sự cảm nhận được độ trễ, cân nhắc index hoá theo thời gian
  (ví dụ nhóm sẵn theo tuần/tháng) thay vì quét tuyến tính mỗi lần.
- **Estimated Complexity**: Trung bình.
- **Blocking Conditions**: chỉ đáng làm khi CẢM NHẬN ĐƯỢC độ trễ thật, không tối ưu phòng ngừa.
- **Review Trigger**: người dùng báo cáo tab Thống kê bị giật/chậm.
- **Owner**: (chưa gán)
- **Status**: Open — không cấp bách.

---
- **Đóng 2026-09-06 (ADR-071)**: `FocusTab` · `CategoryTab` · `OverviewTab` đã XOÁ cùng bộ chọn kỳ; màn Thống kê nay tính đúng MỘT lần qua `useMemo` (`buildStatsAnswers` + `buildStatsInsights`, O(n) trên lịch sử) và không có bộ lọc nào để đổi.

## #7 — ✅ **ĐÃ HẾT HIỆU LỰC (2026-09-02)** — Dependency: `npm install` cần flag `--legacy-peer-deps`

- **Module**: `package.json` (toàn dự án)
- **Priority**: Low
- **Severity**: Low
- **Impact**: một số peer dependency xung đột phiên bản chưa giải quyết dứt điểm — không ảnh
  hưởng runtime, chỉ ảnh hưởng bước cài đặt.
- **Root Cause**: chưa rà soát/nâng cấp để giải quyết xung đột peer dependency triệt để.
- **Current Risk**: rất thấp — đã biết và có quy trình cài đặt rõ ràng (luôn dùng flag này).
- **Future Risk**: thấp, trừ khi một bản nâng cấp dependency lớn trong tương lai làm xung đột này
  trầm trọng hơn.
- **Recommended Solution**: khi có thời gian rảnh, rà soát `package.json` để xác định chính xác
  cặp dependency nào xung đột và cân nhắc nâng cấp/hạ cấp để bỏ được flag này.
- **Estimated Complexity**: Thấp-trung bình (cần thử nghiệm kỹ sau khi đổi để không phá build).
- **Blocking Conditions**: không có, nhưng không cấp bách.
- **Review Trigger**: khi cần thêm một dependency mới mà xung đột trở nên khó quản lý hơn.
- **Owner**: (chưa gán)
- **Status**: Open — chấp nhận sống chung, không cấp bách.


- **✅ ĐÃ HẾT HIỆU LỰC 2026-09-02.** Chạy `npm install --dry-run` **không kèm cờ nào**: giải xong
  cây phụ thuộc, thêm 51 gói, **không một lỗi `ERESOLVE`**. Xung đột peer đã tự tan theo các lần
  nâng cấp gói, mà không ai kiểm lại mục nợ. ⇒ cùng bài học với #13: *một mục nợ không được kiểm
  lại cũng trôi y như một con số không được đo lại*.
  ⚠️ `CLAUDE.md` vẫn ghi "cần `--legacy-peer-deps`" — giữ nguyên câu ấy vì nó VÔ HẠI (dùng cờ vẫn
  chạy đúng) và vì máy của Đàm có thể có `node_modules` đời khác; nhưng nay nó là một lời khuyên
  phòng hờ, không còn là một yêu cầu.

---

## #9 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — Persist localStorage không bắt `QuotaExceededError`

- **Module**: `src/lib/appIdentity.js` (`createLegacyCompatibleJSONStorage`, `storage.setItem`)
- **Priority**: Medium
- **Severity**: High (nếu xảy ra thì app ngừng lưu được state cục bộ)
- **Impact**: `storage.setItem(name, value)` gọi trần, không có `try/catch`. Khi localStorage đầy
  (state ở mức trần ~2-2,5 MB, cộng các khoá khác), lỗi ném thẳng vào trong zustand persist.
- **Root Cause**: đường ghi được viết cho trường hợp bình thường; hạn mức chưa từng bị chạm nên
  chưa lộ ra.
- **Current Risk**: thấp hiện tại (state thật còn xa mức trần 2000 mục).
- **Future Risk**: tăng dần theo số phiên tích luỹ; sẽ tăng vọt nếu có thêm bất kỳ cơ chế nào ghi
  bản sao state vào localStorage (chính là lý do #8 loại phương án snapshot).
- **Recommended Solution**: bọc `try/catch` quanh `setItem`, ghi log rõ ràng và có đường xử lý
  (cảnh báo người dùng / dọn bớt dữ liệu cũ) thay vì để ném lỗi.
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không có — chỉ nằm ngoài phạm vi bản vá C1 nên không "tiện tay sửa luôn".
- **Review Trigger**: khi làm backup/recovery, hoặc khi thấy lỗi lưu state trong log production.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện trong lúc phân tích bản vá C1 (2026-07-17), chưa xử lý.

- **✅ ĐÃ XỬ LÝ 2026-09-02.** `setItem` nay bọc `try/catch`, và khi đầy thì **dọn `legacyKeys`
  trước rồi thử lại** — những khoá ấy là bản sao của chính dữ liệu đang ghi nên xoá chúng vừa giải
  phóng đúng lượng chỗ cần vừa không mất gì. Thất bại lần hai thì `console.error` nói rõ, KHÔNG
  nuốt im lặng: nuốt lỗi ở đây nghĩa là Đàm mở lại app thấy mất tiến độ mà không có một dòng nào
  giải thích.

---

## #20 — ✅ **ĐÃ XỬ LÝ (2026-08-14, Phase 6B)** — Mái kỷ 1 (lều da thú) ra màu XANH LÁ, sai họ vật liệu — không phải lỗi phân biệt, mà lỗi NGHĨA

> ✅ **ĐÃ ĐÓNG — và giải pháp đi XA HƠN đề xuất ghi ở dưới, một cách có chủ đích.**
> Mục này đề xuất thêm một trường `roofHue` **tuỳ chọn** cho riêng kỷ 1. Khi bắt tay vào làm thì
> thấy chẩn đoán ở phần *Root Cause* dưới đây đúng nhưng CHƯA đủ rộng: `accentColor` không chỉ làm
> hỏng kỷ 1 — nó làm hỏng **cả bảng**. Đo được cùng lúc: mái đình làng Bắc Bộ (kỷ 6) ra **TÍM**,
> mái vòm Duomo Firenze (kỷ 7) cũng **TÍM**, bê tông Nakagin (kỷ 13) ra **XANH LƠ**, mái kẽm Paris
> (kỷ 9) ra **XANH NÕN CHUỐI**. Vá riêng kỷ 1 thì 14 kỷ kia vẫn sai, và món nợ sẽ quay lại lần nữa.
> ⇒ Đã làm đúng thứ mục này gọi tên: **tách hẳn hai vai**. Thêm `roofColor` **bắt buộc cho cả 15
> kỷ** trong `eraStyle.js` — mỗi kỷ khai đúng vật liệu lợp của công trình có thật ở nước biểu tượng
> của nó (kỷ 1 `#745339` da thú & gỗ hun khói · kỷ 7 `#c5572b` ngói terracotta · kỷ 11 `#3e9883`
> đồng oxy hoá · kỷ 13 `#ccc9c7` bê tông đúc sẵn…). `accentColor` giữ NGUYÊN, nên màu nhận diện kỷ
> trên toàn app không đổi một pixel.
> **Đo lại sau khi sửa** (bảng màu, giữa trưa, theme sáng): trung vị 105 cặp **46,2 → 62,7** ·
> trải độ sáng **0,18 → 0,40** · cặp gần nhất 6,9 → 10,9. Bốn hàng rào ở `palette3d.test.js` đều
> qua, cộng một **bài đối chứng** mới nhốt sẵn bảng mái hỏng cũ và bắt bộ hàng rào phải còn bắt
> được nó.
> ⚠️ **Ba bài học rút ra, đều đã ghi vào chỗ tương ứng:**
> 1. Phép đếm "15 mái phủ được mấy múi màu 30°" **thưởng cho đúng cái lỗi này** — đường hỏng ăn 9
>    múi, đường vật liệu thật chỉ 6. Vật liệu lợp có thật không trải khắp vòng tròn màu; chúng phân
>    biệt nhau bằng ĐỘ SÁNG. Hàng rào đã đổi theo (`palette3d.test.js`).
> 2. Trần độ tươi từng được phát biểu ở **hai** chỗ với **hai** số (mã kẹp 0,70, test canh 0,66) —
>    nay là một hằng số `ROOF_MAX_SATURATION` mà bài test `import` thẳng.
> 3. Việc sửa này **làm hỏng công cụ đo** `sweep-score.mjs` → mục **#22** (nay đã ĐÓNG, 2026-08-16:
>    proxy "mái" bị bỏ hẳn, thay bằng lưới ô con không giả định gì về màu).

<details>
<summary>Nội dung gốc của mục (giữ nguyên để đối chiếu)</summary>


- **Module**: `src/engine/city3d/palette3d.js` (hàm `eraRoof`) đọc `ERA_METADATA[1].accentColor`
  = `#4ade80`. KHÔNG phải `eraStyle.js` — hình khối đã sửa xong ở Phase 5B.
- **Priority / Severity**: Low-Medium / Low (thuần mỹ thuật, không có gì hỏng, không ai mất dữ liệu).
- **Impact**: Kỷ 1 là kỷ **mọi người dùng đều đi qua đầu tiên** và là ấn tượng đầu về cả màn Thành
  Phố. Mái nón xanh lá trên nền cỏ xanh làm cụm lều đọc ra là **bụi cây / cây thông**, chứ không
  phải chỗ có người ở. Phase 5B đã sửa được phần lớn bằng hình khối (bỏ vành mái thò ra, dựng lều
  nón cao sát đất — trước đó nó đọc ra là *cây nấm*), nhưng sắc xanh vẫn còn.
- **Root Cause**: `accentColor` của mỗi kỷ mang HAI vai không liên quan nhau — vừa là màu nhận diện
  của kỷ trên toàn app (thanh chuyển kỷ, chấm tròn, biểu đồ), vừa là nguồn góc màu cho MÁI trong
  cảnh 3D. Hai vai đó chỉ tình cờ hợp nhau ở 14 kỷ. Đây đúng cùng một hình dạng sai với bài học
  Phase 5B ngay bên trên (`storyHeight` gánh hai việc) — chỉ khác là lần này hai vai nằm ở hai
  **module** khác nhau nên khó thấy hơn.
- **Current Risk**: Không có. Cảnh vẫn dựng đúng, test vẫn xanh, 15 kỷ vẫn phân biệt được với nhau.
- **Future Risk**: Ai đó "sửa cho hợp lý" bằng cách đổi thẳng `ERA_METADATA[1].accentColor` sẽ đổi
  màu nhận diện của kỷ 1 trên **toàn bộ app**, và gần như chắc chắn làm đỏ bài duyệt 105 cặp mái ở
  `palette3d.test.js` — vì bảng màu đó đã được tinh chỉnh qua năm đợt đo.
- **Recommended Solution**: Thêm một trường TUỲ CHỌN `roofHue` trong `eraStyle.js` (nơi đã giữ mọi
  quyết định vật liệu của kỷ), để `eraRoof` ưu tiên nó và lùi về `accentColor` khi không có. Kỷ 1
  đặt ~28° (da thú / rơm rạ). Cách này KHÔNG đụng `accentColor`, nên màu nhận diện của kỷ trên toàn
  app giữ nguyên, và nó tách đúng hai vai đang bị trộn.
- **Estimated Complexity**: Thấp (một trường + một nhánh `??`), nhưng PHẢI chạy lại phép duyệt 105
  cặp mái + quét ảnh 15 kỷ để chắc chắn không đẩy kỷ 1 vào sát một kỷ khác.
- **Blocking Conditions**: Nên gộp vào **cùng một đợt rà soát `palette3d.js`** với #19 thay vì vá
  riêng — đúng luật "đợt vá thứ 6 thì phải rà soát tử tế, không vá điểm" đã ghi ở đầu file này.
- **Review Trigger**: Khi mở đợt rà soát `palette3d.js` cho #19, HOẶC khi Đàm nhắc lại rằng kỷ đầu
  trông không giống chỗ có người ở.
- **Owner**: chưa ai nhận.
- **Status**: MỞ — phát hiện 2026-08-14 (Phase 5B), cố ý CHƯA sửa trong phase đó vì phạm vi của
  phase là HÌNH KHỐI, và đụng vào bảng màu là mở một mặt trận khác hẳn.

</details>

---

## #16 — ✅ **ĐÃ XỬ LÝ (2026-08-13, Phase 3X)** — Vòng ngày của thành phố gần như VÔ HÌNH ở trang chủ, nơi Đàm nhìn nhiều nhất

- **Module**: `src/components/city/CityBackdrop.jsx` — cụ thể là **lớp phủ giữ-chữ-đọc-được**, KHÔNG
  phải `BACKDROP_OPACITY` và KHÔNG phải lỗi của `daylight.js`/`palette3d.js`.
- **Priority**: Medium · **Severity**: Low (không có gì hỏng) · **Estimated Complexity**: Low về mã
- **SỐ ĐO** (ảnh chụp app đã build, bề ngang 1280, đo hai dải thành phố lộ ra hai bên thẻ đồng hồ,
  y = 300–800):

  | chặng | màu trung bình | sắc | tươi | sáng |
  |---|---|---|---|---|
  | bình minh | `#d6d3cc` | 39° | 0,11 | 0,82 |
  | sáng | `#d9d8d3` | 49° | 0,07 | 0,84 |
  | giữa trưa | `#dddcd7` | 48° | 0,09 | 0,86 |
  | chiều | `#dad7d0` | 42° | 0,12 | 0,84 |
  | hoàng hôn | `#d7d3cc` | 37° | 0,11 | 0,82 |
  | đêm | `#cececc` | 49° | 0,02 | 0,80 |

  Cặp cách nhau **XA NHẤT** — giữa trưa ↔ ban đêm, tức hai cực của cả ngày — chỉ **14/255**. Đó là
  mức CAO NHẤT, không phải thấp nhất. Ngưỡng "mắt gần như không phân biệt được" là 12.
- **Root Cause**: lớp phủ pha về `var(--canvas)` — một màu **PHẲNG** — ở 55–92% tuỳ độ cao. Pha bất
  kỳ màu nào về phía một màu phẳng thì **độ tươi tụt theo đúng tỉ lệ đó**, trong khi hình khối (tín
  hiệu ĐỘ SÁNG) vẫn sống sót. Mà vòng ngày là tín hiệu **SẮC** gần như thuần tuý ⇒ lớp phủ lọc đúng
  cái cần giữ và giữ đúng cái không thiếu cũng được.
- **Impact**: `CityBackdrop` sinh ra để "đem thành phố ra trang chủ" (Phase 3F), và Phase 3V vừa bỏ
  công dựng cả một hành trình màu 178° cho sáu chặng ngày. Ở tab Thành Phố thì thấy rõ; ở TRANG CHỦ
  — màn hình Đàm nhìn nhiều nhất, và là nơi cái đồng hồ chạy suốt 25 phút — nó gần như không tới.
- **⚠️ (Đánh giá BAN ĐẦU, giữ lại vì bài học nằm ở chỗ nó SAI ở đâu.)** Lúc mới phát hiện, mục này
  kết luận "đây là thiết kế có chủ đích, không được tự ý chỉnh", dựa vào chú thích tại chỗ: *"đây là
  chỗ mà 'đẹp' và 'dùng được' đối đầu nhau trực diện, và dùng được phải thắng"*.
  **Phần đúng**: dải đậm ở TRÊN đúng là có chủ đích và tuyệt đối không được đụng — điều đó giữ
  nguyên tới hôm nay. **Phần sai**: từ đó suy ra rằng *cả hồ sơ* là một đánh đổi đã cân nhắc, nên
  bất kỳ thay đổi nào cũng phải do Đàm quyết. Thực tế mốc "dải đậm kết thúc ở đâu" chưa từng được
  đo — nó dựa trên niềm tin rằng mặt đồng hồ nằm trên nền, mà đồng hồ thì nằm trong thẻ đặc.
  ⇒ **Bài học**: một chú thích chứng minh ý định, KHÔNG chứng minh rằng con số đi kèm đã được đo.
- **✅ GIẢI PHÁP ĐÃ LÀM (2026-08-13, Phase 3X) — và hoá ra KHÔNG HỀ có đánh đổi nào để mà quyết.**
  Mục này ban đầu ghi "chờ Đàm chọn 1 trong 3 hướng", vì chú thích tại chỗ tuyên bố đánh đổi có chủ
  đích. Đọc kỹ lại thì chú thích ấy tuyên bố **HAI** ý định: (1) chữ phải đọc được — ĐẠT; và
  (2) *"thành phố lộ ra rõ nhất ở khoảng trống phía dưới — đúng chỗ chẳng có chữ gì"* — **KHÔNG
  ĐẠT**. Không có xung đột giữa hai vế; chỉ có vế thứ hai chưa được thực hiện.
- **NGUYÊN NHÂN GỐC THẬT SỰ — một niềm tin sai về chỗ chữ đứng, không phải một con số chọn ẩu.**
  Chú thích cũ ghi dải đậm ở trên là *"nơi có tiêu đề và mặt đồng hồ"*. Đo bằng `textmap3.mjs`
  (có bài kiểm ngược để chứng minh bộ phân loại còn phân loại được) thì:
  - mặt đồng hồ `25:00` **KHÔNG nằm trên nền** — nó ở trong một thẻ ĐẶC (`rgb(255,253,250)`), tại
    **82%** chiều cao lớp phủ. Lớp phủ chưa từng bảo vệ nó, và cũng không cần;
  - chữ THẬT SỰ trên nền chỉ là khối lời chào: máy bàn **7%→21%**, điện thoại **31%→48%**.
  ⇒ Từ mốc đó trở xuống, lớp phủ không làm gì cho khả năng đọc — nó chỉ xoá thành phố. Mà ở 38% nó
  vẫn còn 80%, ở 72% vẫn còn 55%.
- **Cách sửa**: tách hồ sơ mốc thuần ra `src/components/city/cityBackdropScrim.js` (chuỗi CSS nằm
  trong JSX thì không bài test nào chạm tới được), **hai hồ sơ theo khung** — dùng lại đúng
  `useIsPhone()` mà `CityBackdrop` đã có sẵn cho `still`, không thêm hạ tầng. Giữ nguyên (thực tế là
  đậm hơn một chút) tới mốc bảo vệ 28%/55%, rồi thả nhanh về 0 ở vùng không có chữ.
- **BẰNG CHỨNG (đo trên điểm ảnh thật, trước ↔ sau, cả 6 chặng ngày)**:
  - vòng ngày: cặp xa nhau nhất **14,0 → 25,0 / 255** (ngưỡng nhìn ra được là 12) — từ dưới ngưỡng
    lên gần gấp đôi ngưỡng;
  - dải CÓ CHỮ: lệch tối đa **0,43/255**, và **sáng hơn ở cả 6/6 chặng, không chặng nào tối đi** ⇒
    tương phản chữ không giảm một phần nghìn nào (pha thêm về nền sáng thì chữ tối càng nổi);
  - dải KHÔNG CHỮ: lệch **22–33/255** ⇒ thành phố mở ra thật, không phải thay đổi lấy lệ.
- **Khoá bằng test**: `cityBackdropScrim.test.js` (7 bài) giữ nguyên hồ sơ CŨ làm mốc và quét **từng
  phần trăm một** — vì `linear-gradient` nội suy giữa các mốc, hai hồ sơ có thể bằng nhau ở mọi mốc
  mà vẫn cắt nhau ở GIỮA (kiểm mốc là cái phễu, không phải hàng rào). Đã thử ngược với hồ sơ cố ý
  nhạt hơn ⇒ đỏ ngay tại **1%**.
- **Review Trigger**: **đổi bố cục trang chủ** (thêm chữ đặt thẳng lên nền, hoặc dời khối lời chào)
  ⇒ phải đo lại bằng `textmap3.mjs` và cập nhật `TEXT_ENDS_PCT`. Sai chỗ này **không có gì đỏ cả**,
  chỉ là chữ khó đọc dần.
- **Owner**: đã xử lý · **Status**: ✅ **RESOLVED (2026-08-13, Phase 3X)** — phát hiện khi tự hỏi
  "thành quả Phase 3V có thật sự tới màn hình Đàm không", câu hỏi đến từ chính Review Trigger của #14.

---

## #15 — ✅ **ĐÃ XỬ LÝ (2026-08-13, Phase 3V)** — Trời ban ngày KHÔNG BAO GIỜ xanh: cả ngày chỉ là dốc sáng–tối, không phải hành trình màu

> **KẾT QUẢ**: đo lại cùng phép đo, cùng kỷ 7, cùng điểm lấy mẫu — đỉnh trời cả ngày nay là
> `27° · 203° · 211° · 37° · 18° · 223°`, thay cho `26° · 40° · 41° · 38° · 19° · 224°`. Bốn chặng
> ban ngày không còn nằm gọn trong một dải cam-nâu 22°; chúng trải **178°**. Giữa trưa ra
> `#7d8fa3` — xanh trời thật. Đã kiểm đủ **90 ô** (15 kỷ × 6 chặng): không ô nào đen, xám hay
> cháy; 6/6 chặng vẫn phân biệt được.
> ⚠️ **ĐÍNH CHÍNH 2026-08-13 (Phase 3W)**: bản đầu của mục này (và commit `83fa6cb`) ghi "180 ô ×
> 2 theme". **SAI.** So từng điểm ảnh giữa hai bản quét: **0/421.200 điểm bên trong các ô khác
> nhau**, chỉ khung ngoài đổi màu. Lý do ở `palette3d.js:183` — hễ có `daylight` thì ĐỒNG HỒ quyết
> `isDark`, theme bị bỏ qua. Số ô thật là 90, dựng hai lần. Phạm vi kiểm vẫn ĐỦ (15 kỷ × 6 chặng
> là toàn bộ không gian có ý nghĩa), nhưng con số thì đã bị thổi gấp đôi. Chi tiết cách sửa: xem chú thích dài
> ngay trên dòng `noon` trong `src/engine/city3d/daylight.js`. Bài test khoá: bài 81
> `daylight.test.js` (đã thử NGƯỢC với bộ số hỏng cũ → báo đỏ đúng như mong đợi, 38° < 90°).
>
> **Giữ nguyên toàn bộ phần chẩn đoán bên dưới** — nó là bằng chứng cho bài học "chỉnh tham số
> không chữa nổi một phép toán sai", và hai thí nghiệm thất bại ở đó vẫn còn giá trị cảnh báo.

- **Module**: `src/components/city/render3d/sceneGraph.js` (số mũ pha vòm trời) + `skyward()` trong
  `src/engine/city3d/palette3d.js` (phép trộn màu). **KHÔNG phải lỗi của `daylight.js`** — bảng ở
  đó ghi đúng ý đồ, chỉ là ý đồ không tới được màn hình.
- **Priority**: **Medium-High**
- **Severity**: Medium
- **Impact**: đây là phần đo được của "chán" ở lớp HÌNH ẢNH, song sinh với #14 ở lớp phần thưởng.
  Đàm mở app nhiều lần mỗi ngày; nếu 5/6 chặng ngày cho ra cùng một sắc trời thì thành phố không
  còn là "nơi chốn đang trôi qua thời gian" như `daylight.js` tự nhận, mà chỉ là một ảnh chụp được
  chỉnh sáng-tối.
- **SỐ ĐO** (kỷ 7, theme sáng, đo đỉnh trời ở giữa khung, y = 12%):

  | chặng | màu ra | sắc | tươi |
  |---|---|---|---|
  | bình minh | `#8e7969` | 26° | 0,15 |
  | sáng | `#a29781` | 40° | 0,15 |
  | **giữa trưa** | `#b1a790` | **41°** | 0,18 |
  | chiều | `#a1957f` | 38° | 0,15 |
  | hoàng hôn | `#8e7468` | 19° | 0,15 |
  | đêm | `#1b2238` | 224° | 0,35 |

  **5/6 chặng nằm gọn trong dải 19°–41° (cam-nâu); chỉ ĐÊM thoát ra.** Cả ngày chỉ đổi độ sáng
  (0,46 → 0,60 → 0,46) — mà độ sáng là tín hiệu thị giác yếu nhất.
- **Root Cause (hai tầng nhân nhau)**:
  (1) **Dải trời nhìn thấy được là 64–84% MÀU CHÂN TRỜI.** `sceneGraph.js` pha vòm trời theo
  `t^2.6`; camera chúc xuống nên phần trời lọt khung chỉ ở `t ≈ 0,50–0,67`, mà `0,5^2,6 = 0,17`.
  ⇒ `skyHue` (đỉnh vòm) gần như KHÔNG BAO GIỜ hiện ra. Giữa trưa khai `skyHue: 212, skyPull: 0.70`
  — lực kéo mạnh nhất cả ngày — nhưng vô hiệu, vì người quyết định màu trời ban ngày là
  `horizonHue`, và giữa trưa nó là `48°` (vàng ấm) với lực kéo chỉ `0,22`.
  ⚠️ Số mũ 2,6 KHÔNG phải lỗi ẩu — chú thích tại chỗ ghi rõ nó được nâng từ 1,2 lên để cứu một lỗi
  khác ("mảng oải hương xam xám"). Sửa mù số mũ sẽ làm sống lại lỗi cũ.
  (2) **`skyward()` trộn bằng `mixRgb`.** Sắc ấm 40° pha sắc lạnh 205° trong RGB thì đi qua vùng
  TRUNG TÍNH — **đúng họ lỗi đã sửa cho MÁI NHÀ ở Phase 3N** (15 kỷ ra 2 cụm màu).
- **⚠️ ĐÃ THỬ VÀ THẤT BẠI — đừng lặp lại** (đo thật, 2026-08-13):
  - `noon.horizonHue: 205, horizonPull: 0.42` → `#a6a69a`, 61°, tươi **0,06** → xám, không xanh.
  - `noon.horizonHue: 205, horizonPull: 0.78` → `#9ca7a3`, **157° lục-lam**, tươi **0,05**.
  - Càng kéo mạnh càng lạc sang lục rồi chết ở xám. ⇒ **Chỉnh số trong `DAYLIGHT_PROFILES` KHÔNG
    chữa được.** Cả hai thử nghiệm đã được HOÀN TÁC; mã hiện tại giữ nguyên giá trị cũ.
- **Current Risk**: thấp về kỹ thuật (không có gì hỏng), trung bình về trải nghiệm.
- **Future Risk**: trung bình. Mỗi phase mỹ thuật về sau đều đâm vào cùng phép trộn sai này.
- **Recommended Solution**: sửa `skyward()` cho xoay sắc trong **không gian HSL** thay vì trộn RGB —
  đúng khuôn đã dùng thành công cho mái nhà ở Phase 3N (`eraRoof` trong `palette3d.js`). ⚠️ Cẩn
  trọng: sắc nền và đích ở nhiều chặng gần như ĐỐI NHAU (40° vs 205°/226°), nên phép nội suy sắc
  ngây thơ sẽ đi qua LỤC hoặc TÍA ở quãng giữa — cần chọn mô hình cho `pull` (ví dụ: lấy thẳng sắc
  đích, để `pull` điều khiển ĐỘ TƯƠI) rồi **tinh chỉnh lại cả 6 chặng**.
- **Estimated Complexity**: **Medium-High** — phép toán thì nhỏ, nhưng phải tinh chỉnh lại 6 chặng
  và kiểm đủ **90 ô** (15 kỷ × 6 chặng) bằng `--sweep --all` trước khi phát hành. ⚠️ `--theme`
  KHÔNG nhân đôi phạm vi khi đã truyền giờ — xem đính chính ở đầu mục.
- **Blocking Conditions**: không có blocker kỹ thuật. Cần một phase riêng, KHÔNG làm kèm việc khác —
  đây là loại thay đổi mà "sửa một chỗ, hỏng ba chỗ" đã xảy ra nhiều lần trong lịch sử tầng màu.
- **Review Trigger**: trước bất kỳ thay đổi nào ở `skyward()`, số mũ vòm trời, hoặc
  `DAYLIGHT_PROFILES`.
- **Owner**: (chưa gán)
- **Status**: ✅ **RESOLVED 2026-08-13 (Phase 3V)** — phát hiện cùng ngày ở Phase 3U khi quét lại đủ
  15 kỷ × 6 chặng trên mã hiện tại. ⚠️ Mắt tôi ban đầu chẩn "3 chặng ban ngày giống hệt nhau" —
  **phép đo BÁC BỎ điều đó** (6/6 chặng vẫn phân biệt được, khoảng cách nhỏ nhất 17/255) nhưng lại
  lộ ra lỗi thật và chính xác hơn: không phải "giống nhau", mà là **cùng một SẮC, chỉ khác ĐỘ SÁNG**.
- **CÁCH SỬA THẬT SỰ ĐÃ DÙNG** (khác một chút so với mục "Recommended Solution" ở trên — ghi lại vì
  chỗ khác nhau chính là phần học được):
  1. `skyward()` xoay sắc bằng **vector chroma** (cộng hai vector đơn vị theo góc rồi `atan2`), giữ
     nguyên độ tươi/độ sáng gốc. Cách này tự tránh được đúng cái bẫy mà mục trên cảnh báo — sắc
     gần đối nhau thì vector tổng ngắn lại chứ không quét qua lục/tía. Trường hợp suy biến (hai
     vector triệt tiêu) đã có nhánh riêng. `t === 0` ra byte y hệt bản cũ ⇒ chỗ nào không kéo thì
     không đổi một pixel.
  2. **Không chỉ là phép trộn.** Còn hai tầng nữa mới ra màu trên màn hình, và nếu bỏ qua thì sửa
     đúng toán vẫn ra trời xám: (a) `NeutralToneMapping` phơi sáng 1,2 nén mạnh vùng sáng, mà chân
     trời để độ sáng 0,80 thì nằm đúng giữa vùng bị nén ⇒ độ tươi ra màn hình chỉ còn **1/5** —
     phải hạ độ sáng xuống 0,70/0,72 và nâng độ tươi lên 0,60/0,44; (b) nắng ấm nhân vào trời làm
     sắc lạnh tụt **13–22°** về phía lục ⇒ hai chặng sáng/trưa phải khai cao hơn đích thật ~15°.
- **Nợ CÒN LẠI, có chủ đích**: số mũ `t^2.6` ở `sceneGraph.js` **không đụng tới**. Chú thích tại chỗ
  ghi rõ nó được nâng từ 1,2 lên để cứu lỗi "mảng oải hương xam xám"; sửa nó là mở lại một lỗi cũ
  để đổi lấy một cải thiện mà đường khác đã đạt được rồi. Vẫn đúng là **màu trời ban ngày do
  `horizonHue` quyết định, không phải `skyHue`** — ai chỉnh bảng `DAYLIGHT_PROFILES` phải nhớ điều đó.

---

## #13 — ✅ **ĐÃ HẾT HIỆU LỰC (2026-09-02)** — `useTimer.js` (1 100+ dòng, hot spot) có ĐÚNG 0 bài test — và tài liệu từng ghi ngược lại

- **Module**: `src/hooks/useTimer.js`
- **Priority**: **Medium-High**
- **Severity**: High
- **Impact**: `useTimer` là trái tim của app — đếm giờ, hoàn tất phiên, nghỉ tự động, khôi phục sau
  khi đóng tab, đồng bộ trạng thái tray. Nó gọi `commitCompletedSession` → `completeFocusSession`
  (God function, mục #1). **Không một dòng nào của nó được test bao phủ**: `find src/hooks -name
  '*.test.js'` = 0 file. Mọi thay đổi liên quan nhịp phiên (gồm cả mục #12) hiện đều là sửa mù.
- **Root Cause (hai tầng, tầng thứ hai mới là tầng nguy hiểm)**:
  (1) Hook React có nhiều tác dụng phụ theo thời gian ⇒ khó test bằng `node --test` thuần, nên bị
  hoãn nhiều lần.
  (2) ⚠️ **Tài liệu đã che mất khoản nợ này suốt nhiều tháng.** `BAN_GIAO.md` ghi ở mục "Đang dở"
  rằng đã có `src/hooks/useTimer.test.js` với "41 bài characterization test, **tất cả đều xanh**",
  chỉ vướng chuyện chưa nối vào `npm test`. Kiểm cạn kiệt ngày 2026-08-12:
  `git log --all --diff-filter=A -- '*useTimer.test.js'` **rỗng** ⇒ file chưa từng được commit ở
  bất kỳ đâu. Nó được viết trong một phiên chạy trên container tạm rồi mất khi container bị thu
  hồi. Hệ quả: mọi phiên AI đọc `BAN_GIAO.md` đều tin rằng "lưới đã có, chỉ cần cắm vào" — trong
  khi thực tế là **chưa có gì cả**. Chính phiên 2026-08-12 đã đề xuất "nối 41 bài test vào
  `npm test`" làm task ưu tiên số một trước khi phát hiện ra sự thật.
- **Current Risk**: trung bình-cao — mã đã chạy ổn định nhiều tháng nên rủi ro *tĩnh* thấp, nhưng
  rủi ro *khi sửa* thì cao và hiện đang chặn mục #12.
- **Future Risk**: cao — mọi điều chỉnh nhịp phiên về sau (gần như chắc chắn sẽ có, sau khi Đàm
  chạy phiên thật và phản hồi) đều đâm vào đúng chỗ không có lưới này.
- **Recommended Solution**: KHÔNG cố test cả hook một lượt. Làm theo đúng khuôn đã dùng thành công
  ở `syncService` (hàm thuần `shouldImportVersion` + `hasMeaningfulState` tách ra test riêng): rút
  các quyết định THUẦN ra khỏi hook rồi test chúng — đường nghỉ tự động là ứng viên số một
  (`shouldStartBreakAfterCompletion` đã thuần sẵn; độ trễ 500 ms nên thành hằng số có tên, đặt cạnh
  `MOMENT_MS`, kèm test khoá quan hệ giữa hai số đó). Bao phủ đủ để gỡ chặn #12 TRƯỚC, không cần
  characterization đầy đủ ngay.
- **Estimated Complexity**: Medium (phần thuần) · High (characterization đầy đủ cả hook)
- **Blocking Conditions**: không có blocker kỹ thuật — chỉ cần quyết định làm. Việc test hook React
  đầy đủ thì cần thêm công cụ render, nhưng phần THUẦN thì không cần gì thêm.
- **Review Trigger**: trước bất kỳ thay đổi hành vi nào của `useTimer`, gồm cả mục #12.
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-12 khi định thực hiện chính task "nối bộ test đã có" và
  phát hiện bộ test đó không tồn tại.


- **✅ MỤC NÀY ĐÃ LỖI THỜI 2026-09-02.** Đếm lại: `src/hooks/useTimer.test.js` có **41 bài test**
  (57 KB), trong đó có cả bài canh độ trễ vào nghỉ vừa viết lại ở vòng 27. Tiêu đề mục nợ ("có ĐÚNG
  0 bài test") đã sai sự thật từ lâu mà không ai đóng nó. ⇒ *Một mục nợ không được kiểm lại cũng
  trôi y như một con số không được đo lại* — đúng bài học `TECH_DEBT #43`, áp cho chính file này.

---

## #12 — ✅ [ĐÃ XỬ LÝ 2026-08-12] Lễ mừng bị TÍNH VÀO giờ nghỉ: nghỉ tự động chạy trước khi lễ mừng xong

> **Đã xử lý cùng ngày phát hiện (Phase 3Q)** bằng phương án (a): `BREAK_START_DELAY_MS` **500 →
> 3 200 ms**, phủ trọn lễ mừng. Bài test "NHỊP MỘT PHIÊN" (`timerSession.test.js`) đổi từ *chốt mức
> nợ* sang khẳng định **bất biến thật**: `BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS`. Đã chứng minh
> ĐỎ theo CẢ HAI chiều hồi quy: hạ độ trễ về 500 ⇒ đỏ; kéo lễ mừng lên 5 000 mà quên chỉnh độ trễ
> ⇒ cũng đỏ.
> **Đánh đổi đã chấp nhận**: phiên KHÔNG có lễ mừng nay cũng chờ 3,2 s mới vào nghỉ — chấp nhận
> được vì cả hai trường hợp người dùng đều đang nhìn hộp phần thưởng chứ không nhìn đồng hồ, và vì
> lệch về phía "được nghỉ đủ" an toàn hơn lệch về phía "bị ăn bớt".
> Phương án (b) (tầng hiển thị phát tín hiệu "lễ mừng xong") KHÔNG làm — nó đúng hơn về ngữ nghĩa
> nhưng tạo coupling đồng hồ ↔ thành phố, đắt hơn nhiều, để đổi lấy vài trăm mili-giây.
> Giữ nguyên mục này (không xoá) để phiên sau hiểu vì sao độ trễ là 3 200 chứ không phải 500.

**Nội dung gốc lúc phát hiện:**


- **Module**: `src/hooks/useTimer.js` (2 chỗ: dòng ~610 và ~1089) ↔ `src/components/city/CityGrowthMoment.jsx` (`MOMENT_MS`) ↔ `src/App.jsx` (`RewardSequence`)
- **Priority**: Medium
- **Severity**: Low-Medium
- **Impact**: Với cấu hình MẶC ĐỊNH (`autoStartBreak: true`, `settingsStore.js:92`), phiên nghỉ bắt
  đầu đếm sau **500 ms**, trong khi lễ mừng "thành phố lớn lên" chạy **3 200 ms** và hộp thoại phần
  thưởng chỉ hiện ra SAU đó. Nghĩa là đồng hồ nghỉ đã chạy **2 700 ms trước khi lễ mừng kết thúc**,
  rồi tiếp tục chạy suốt lúc Đàm đọc hộp phần thưởng. Tổng thiệt hại thực tế ~8–18 giây trên một
  phiên nghỉ 5 phút (~3–6%).
  Vấn đề KHÔNG nằm ở con số đó mà ở ý nghĩa: **phần thưởng của việc đã làm xong đang bị trừ vào
  thời gian nghỉ.** Lễ mừng lẽ ra là tiền công, không phải khoản Đàm tự trả.
- **Root Cause**: Phase 4′ cắm lễ mừng vào TẦNG HIỂN THỊ (`App.jsx`) — đúng theo thiết kế, để không
  phải sửa store và không phá 3 bài test đang khẳng định `lootModalOpen` bật đồng bộ. Nhưng
  `useTimer` thì không hề biết tầng hiển thị đang chạy một lễ mừng, nên nó vẫn hẹn giờ 500 ms như
  thời chưa có lễ mừng. Độ trễ 500 ms đó có từ TRƯỚC Phase 4′ và chưa ai chỉnh lại cho khớp.
- **Current Risk**: thấp — không mất dữ liệu, không sai số liệu thống kê (phiên nghỉ vẫn được ghi
  đúng độ dài của nó), chỉ là Đàm được nghỉ ít hơn vài giây so với ý định.
- **Future Risk**: trung bình — nếu lễ mừng dài thêm (hoặc thêm màn khác chen vào giữa: mở khoá kỷ
  mới, thành tích…), phần bị trừ sẽ lớn dần mà không có gì cảnh báo. Không có bài test nào canh
  quan hệ giữa `MOMENT_MS` và độ trễ 500 ms, nên nó sẽ trôi âm thầm.
- **Recommended Solution**: KHÔNG nên nối thẳng `useTimer` vào tầng thành phố (sẽ tạo coupling đúng
  thứ mà kiến trúc Phase 4′ cố tránh). Hai hướng sạch hơn:
  (a) đưa độ trễ ra thành hằng số dùng chung, đặt `≥ MOMENT_MS`, kèm bài test khoá
  `delay >= MOMENT_MS` — rẻ nhất, nhưng làm chậm cả trường hợp KHÔNG có lễ mừng (lễ mừng chỉ chạy
  khi thật sự có công trình tiến triển);
  (b) để tầng hiển thị phát một tín hiệu "lễ mừng xong" mà `useTimer` chờ, có timeout dự phòng —
  đúng hơn về ngữ nghĩa, nhưng đắt hơn và đụng vào hot spot.
  Cần Đàm quyết vì đây là thay đổi HÀNH VI đồng hồ trên app production, không phải sửa lỗi hiển thị.
- **Estimated Complexity**: (a) thấp · (b) trung bình
- **Blocking Conditions**: `useTimer.js` là hot spot (`CLAUDE.md`) và **hiện có ĐÚNG 0 bài test**
  (xem mục #13 — bản ghi cũ nói có "41 bài đã xanh, chỉ chưa nối vào `npm test`" là SAI, file chưa
  từng tồn tại). Sửa hành vi đồng hồ lúc này là sửa mà **hoàn toàn không có lưới**, chứ không phải
  "có lưới nhưng chưa cắm". ⇒ Điều kiện gỡ chặn nay là **viết** test bao phủ đường nghỉ tự động
  (mục #13), không phải "nối" gì cả.
- **Review Trigger**: khi Đàm phản hồi về nhịp một phiên thật; hoặc khi lễ mừng/`MOMENT_MS` đổi;
  hoặc khi thêm bất kỳ màn nào chen giữa "phiên xong" và "bắt đầu nghỉ".
  ✅ **Đã có hàng rào tự động (2026-08-12)**: hai con số nay có TÊN và nằm ở tầng thuần
  (`GROWTH_MOMENT_MS` ở `engine/cityMoment.js`, `BREAK_START_DELAY_MS` ở `engine/timerSession.js`),
  kèm bài test "NHỊP MỘT PHIÊN" ở `timerSession.test.js` **CHỐT khoảng lệch ở mức 2 700 ms**. Nợ
  chưa trả, nhưng nay **không thể âm thầm phình to**: kéo dài lễ mừng hay rút ngắn độ trễ đều làm
  bài test ĐỎ và buộc người sửa đọc mục này trước. (Đã chứng minh: nâng lễ mừng lên 5 000 ms ⇒ đỏ.)
- **Owner**: (chưa gán)
- **Status**: Open — phát hiện 2026-08-12 khi rà lại mục "nhịp phiên" của `/goal`. Chưa xử lý vì là
  thay đổi hành vi đồng hồ production + đang thiếu lưới test (xem Blocking Conditions).

---

## #11 — ✅ [ĐÃ XỬ LÝ] Theme TỐI: bầu trời gần như đen ở MỌI giờ, kể cả giữa trưa

- **Module**: `src/engine/city3d/palette3d.js` (độ đậm nhánh `isDark` của `horizon` và `sky2.top`)
- **Priority**: Medium
- **Severity**: Medium (thẩm mỹ, không phải lỗi chức năng — thành phố vẫn đọc được)
- **Impact**: ở theme tối, chân trời có độ đậm 0,27 và đỉnh trời 0,17 **bất kể giờ nào**. Ảnh chụp
  lúc 12 giờ trưa ở theme tối cho ra một bầu trời gần như đen, nhìn không khác gì lúc nửa đêm — tức
  là với người dùng theme tối, cả tính năng "thành phố đổi theo giờ" của Phase 3D mất phần lớn tác
  dụng ở BẦU TRỜI (mặt đất và ánh nắng vẫn đổi đúng).
- **Root Cause**: hai con số này có từ Phase 3C, thời điểm chưa có khái niệm "giờ trong ngày" —
  lúc đó "theme tối" ngầm hiểu là "cảnh chạng vạng", nên để trời tối là hợp lý. Phase 3D tách hai
  khái niệm ra (`nightByClock` ≠ `isDark`) nhưng CHỈ tách ở phần bảng màu vật liệu; độ đậm bầu trời
  vẫn còn dính vào theme.
- **Current Risk**: thấp — chỉ ảnh hưởng thẩm mỹ, và chưa rõ Đàm có dùng theme tối cho tab Thành
  Phố hay không.
- **Future Risk**: thấp, không tăng theo thời gian.
- **Recommended Solution**: cho độ đậm bầu trời phụ thuộc vào CHẶNG TRONG NGÀY thay vì vào theme
  (ví dụ thêm một trường `skyLightness` vào `DAYLIGHT_PROFILES`), giữ theme chỉ còn quyết định độ
  tươi và sắc nền. ⚠️ Đổi sẽ làm mọi ảnh chụp theme tối đã duyệt ở Phase 3C khác đi ⇒ phải chụp
  lại và soi đủ 6 chặng trước khi nhận.
- **Estimated Complexity**: Thấp về code, Trung bình về hiệu chỉnh mỹ thuật (phải soi ảnh lại).
- **Blocking Conditions**: không có. Cố ý KHÔNG sửa trong Phase 3D để commit này chỉ chứa đúng một
  chủ đề và rollback được độc lập — đúng quy tắc commit ở `CLAUDE.md`.
- **Review Trigger**: khi Đàm phản hồi về theme tối, hoặc lần sau có ai chỉnh bảng màu bầu trời.
- **Owner**: (chưa gán)
- **Status**: ✅ **ĐÃ XỬ LÝ 2026-08-12 (Phase 3G)** — và hoá ra vấn đề RỘNG HƠN mục này mô tả.
  Bản quét đủ 15 kỷ × 6 chặng cho thấy không chỉ bầu trời tối, mà **cả cảnh** ở theme tối đều tối
  như nửa đêm vào giữa trưa (mặt đất, tường, mái — tất cả đều đi theo nhánh `isDark`).
  - **Cách sửa KHÁC với "Recommended Solution" ở trên, và cố ý.** Đề xuất cũ là thêm một trường
    `skyLightness` vào hồ sơ chặng — tức chữa đúng cái triệu chứng đã ghi (bầu trời), và bỏ sót
    mặt đất/tường/mái vốn cùng gốc. Bản vá thật đánh vào gốc: đổi ý nghĩa của chính `isDark`.
    Có `daylight` ⇒ **đồng hồ quyết định**, không phải theme; không có `daylight` (bảo tàng, các
    chỗ gọi cũ) ⇒ vẫn theo theme y như trước, nên không chỗ nào đang chạy bị đổi kết quả.
  - **Nguyên tắc rút ra**: *thành phố là một Ô CỬA SỔ.* Cảnh nhìn qua cửa sổ không tối đi vì ta sơn
    tường phòng màu đen. Theme quyết định KHUNG cửa (nền thẻ, viền, lớp tối góc — vẫn giữ nguyên),
    đồng hồ quyết định độ sáng BÊN TRONG khung.
  - **Khoá bằng test**: `palette3d.test.js` → "THÀNH PHỐ LÀ Ô CỬA SỔ: để theme tối thì giữa trưa
    vẫn phải sáng như giữa trưa" (đã xác minh bài này ĐỎ trên code cũ).
  - Đã chụp lại đủ 15 kỷ × 6 chặng × 2 theme và soi bằng mắt trước khi nhận, đúng cảnh báo ở trên.

---

## #10 — ✅ [ĐÃ XỬ LÝ] Glob test chỉ quét MỘT cấp: test đặt trong thư mục con sẽ im lặng không bao giờ chạy

- **Module**: `package.json` (script `test`)
- **Priority**: Low-Medium
- **Severity**: Medium
- **Impact**: câu lệnh test liệt kê tay từng thư mục và mỗi mục chỉ có `*.test.js` — **một cấp**
  (vd `src/components/*.test.js`). Một file test đặt trong thư mục con (`src/components/city/`,
  `src/components/city/render2d/`, `src/components/icons/`, `src/components/shared/`) sẽ **không
  bao giờ được chạy, mà cũng không báo lỗi gì**. Đây là loại hỏng nguy hiểm hơn test đỏ: nó tạo
  cảm giác an toàn giả — người viết tin là có lưới, thực tế không có. Hiện chưa có file test nào
  rơi vào bẫy này (đã kiểm), nhưng số thư mục con trong `src/components/` đang tăng.
- **Root Cause**: glob viết tay, thêm dần theo từng lần có thư mục mới; POSIX `sh` không có
  `globstar` nên `**` không mở rộng đệ quy như trực giác — `src/components/**/*.test.js` thực chất
  chỉ ra đúng MỘT cấp con và sẽ **làm mất** các test đang chạy ở cấp trên.
- **Current Risk**: thấp — chưa file nào bị bỏ sót. Đã né tạm bằng cách đặt
  `src/components/cityRenderers.test.js` ở cấp trên (kèm chú thích giải thích vì sao nó không nằm
  cạnh thứ nó kiểm tra).
- **Future Risk**: trung bình và tăng dần. Kế hoạch Thành Phố 3D sẽ thêm `city/render3d/` cùng
  nhiều module con; đặt test cạnh file nguồn là **quy ước chính thức của dự án**
  (`PROJECT_STRUCTURE.md`), nên khả năng ai đó làm đúng quy ước rồi mất test là có thật.
- **Recommended Solution**: hai hướng, ưu tiên hướng (b) vì không đụng vào bộ chạy test.
  (a) Đổi sang `node --test --test-... 'src/**/*.test.js'` với glob do CHÍNH node mở rộng (đặt
  trong dấu nháy để `sh` không đụng vào) — gọn nhưng phải kiểm lại kỹ danh sách file thực tế được
  chọn, vì đây là đường sống của mọi lưới an toàn.
  (b) Thêm một bài test tự canh: quét mọi `*.test.js` trong `src/` + `api/` rồi khẳng định mỗi file
  đều khớp ít nhất một mẫu trong glob của `package.json` — sai là đỏ ngay, không cần đổi bộ chạy.
- **Estimated Complexity**: Thấp.
- **Blocking Conditions**: không có.
- **Review Trigger**: (đã kích hoạt ngay trong ngày — xem Status).
- **Owner**: (chưa gán)
- **Status**: ✅ **RESOLVED 2026-08-12**, cùng ngày phát hiện. "Review Trigger" ghi ở trên nổ ngay
  ở Phase 3A: cần đặt test cạnh `src/engine/city3d/` và `city/render3d/`, tức phải né glob một lần
  nữa hoặc sửa dứt điểm. Đã chọn sửa dứt điểm bằng **hướng (a)**, sau khi chứng minh nó an toàn:
  glob nay là `'electron/**/*.test.js' 'src/**/*.test.js' 'api/**/*.test.js'` — **đặt trong dấu
  nháy đơn để `sh` KHÔNG đụng vào**, để chính `node --test` mở rộng (node hiểu `**` đệ quy thật,
  POSIX `sh` thì không). Trước khi đổi đã đối chiếu **tập hợp file** của glob cũ và glob mới bằng
  `fs.globSync`: **31 file, giống hệt nhau, 0 mất 0 thêm**, và `npm test` giữ nguyên 315 bài — nên
  đây là thay thế tương đương chứng minh được, không phải đổi liều. Từ nay đặt test cạnh file
  nguồn ở BẤT KỲ độ sâu nào cũng chạy, đúng quy ước chính thức ở `PROJECT_STRUCTURE.md`.
  ⚠️ Ràng buộc còn lại: cú pháp nháy đơn này cần shell kiểu POSIX (Mac/Linux — đúng môi trường dự
  án); chạy `npm test` từ `cmd.exe` của Windows sẽ không mở rộng đúng.

---

## #30 — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Mặt đường render ra DƯỚI ngưỡng mắt đọc được, xét riêng vật liệu (kỷ 11 · 13 · 10 · 3)

> **ĐÃ ĐÓNG CÙNG #27 — hai mục là một bài toán, đúng như hai mục này đã tự nối cứng với nhau.**
> Nguyên nhân gốc KHÔNG phải con số `roadColor` của một kỷ nào, mà là: **màu là trục DUY NHẤT mang
> bản sắc mặt đường**, nên toàn bộ sức ép "15 kỷ phải khác nhau" dồn vào ĐỘ ĐẬM — và độ đậm có đáy.
> Phase 9D mở thêm chín trục (`src/engine/city3d/streetStyle.js`: bề rộng đại lộ · bề rộng ngõ ·
> vật liệu lát · cỡ viên · độ mòn · bó vỉa · vỉa hè · vạch kẻ · kiểu mép) và cho phép đẩy độ đậm
> **bão hoà** (`roadContrastGap`: sàn 0,13 · trần 0,26 · vẫn đơn điệu ngặt).
>
> **Nghiệm thu, đo trên ảnh dựng thật, `--no-shadow`, 4 kỷ × 3 giờ = 12 tổ hợp** (công cụ
> `scripts/road-score.mjs`, mặt nạ do chính bên dựng cấp qua `city-preview.mjs --mask road,ground`):
> **12/12 ĐẠT**. Khoảng cách đường↔đất xấu nhất **0,061** (kỷ 11, 22h — ngưỡng mắt 0,05, biên 23%);
> "hố" sâu nhất **0,202** (kỷ 3, 12h — trần 0,26, biên 22%). So với con số mở mục này: kỷ 11 từ
> **0,113 trên nền đất 0,406** nay là **0,302 trên nền 0,495**.
>
> ⚠️ **Kèm một phát hiện ngoài dự kiến, đã sửa**: kỷ 7 lấy `roadColor` từ **pietraforte** — đá XÂY
> TƯỜNG của Palazzo Vecchio — trong khi Firenze LÁT đường bằng **pietra serena** (xám-xanh). Đá ấy
> cùng họ màu với nền đất ấm của kỷ 7, nên con đường chỉ còn độ sáng để tách khỏi đất, mà độ sáng
> thì đang ở đúng sàn: đo được **0,050 lúc 12h và 0,019 lúc 22h**, dưới ngưỡng mắt. Sửa sang đúng
> vật liệu lịch sử ⇒ **0,200 / 0,191 / 0,198**. Đây là chính bệnh của cả Phase 9D, thu nhỏ vào một
> kỷ: một trục (sáng) phải gánh việc của hai (sáng + sắc).

- **Module**: `src/engine/city3d/palette3d.js` (luật `roadL`), đo ở Phase 9B
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: đo trên ảnh dựng thật kỷ 11 lúc 15 giờ, **đã TẮT HẲN `sun.castShadow`** để tách vật
  liệu khỏi ánh sáng: mặt đất sáng **0,406**, còn ngõ phố **0,113** — tức nằm DƯỚI ngưỡng 0,12 mà
  mắt còn đọc ra chi tiết, trước khi bóng đổ chạm vào. Trên ảnh, mạng đường đọc ra thành những
  RÃNH ĐEN cắt qua thành phố chứ không phải phố xá. Phép thử ngược: trong 11,1% khung hình bị
  nghiền của kỷ 11, **9,6 điểm phần trăm vẫn còn nguyên khi tắt sạch bóng đổ** ⇒ phần lớn mảng đen
  của kỷ này là MẶT ĐƯỜNG, không phải bóng. Đây chính là chữ *"mảng đen … tuyệt đối"* trong yêu
  cầu của Đàm, ở dạng literal nhất của nó.
- **Root Cause**: `ROAD_MIN_CONTRAST` (0,13) mang nghĩa *"đường và đất phải cách nhau ÍT NHẤT
  chừng này"*, nhưng nó được **CỘNG THÊM** vào phần chênh lệch riêng của vật liệu chứ không làm
  SÀN cho tổng: `roadL = groundL ± (MIN + |off| × SPAN)`. Vật liệu nào vốn đã xa mức trung tính
  thì bị đẩy HAI LẦN. Nhựa đường kỷ 11 (`#3a3b3e`, cách trung tính 0,265) nhận tổng đẩy **0,289**
  — lớn hơn cả chênh lệch của chính nó — và **không có gì chặn lại**. Luật có SÀN mà không có TRẦN;
  chưa ai từng hỏi *"đẩy xa bao nhiêu thì là quá xa?"*.
- **Current Risk**: trung bình. Ảnh hưởng rõ nhất ở 4 kỷ hiện đại/tối (11, 13, 10, 3) — đúng nửa
  sau hành trình, tức phần Đàm sẽ ở lại lâu nhất.
- **Future Risk**: mỗi lần ai đó làm mặt đất SÁNG lên, mặt đường tự động chìm sâu thêm đúng bằng
  chừng ấy, vĩnh viễn, và không có gì đỏ lên (bài test hiện chỉ canh khoảng cách TỐI THIỂU giữa
  đường và đất — nó canh "đủ khác nhau", không canh "đủ sáng để nhìn ra").
- **Recommended Solution**: ĐÃ VIẾT VÀ ĐÃ ĐO XONG, chỉ chưa ship — thay phép đẩy vô hạn bằng phép
  **đẩy BÃO HOÀ**, có cả sàn lẫn trần mà vẫn đơn điệu ngặt:
  `gap = MIN + (MAX − MIN) × (1 − exp(−|off| × SPAN / (MAX − MIN)))`, với `MAX = 0.26`.
  Kết quả đo đủ 15 kỷ: kỷ 11 đại lộ 0,243 → **0,309** (+27%), ngõ 0,208 → **0,266** (+28%); các kỷ
  sáng gần như không nhúc nhích; **thứ tự 15 kỷ giữ nguyên tuyệt đối**. ⚠️ KHÔNG được sửa bằng
  `Math.max(MIN, …)` (phá thứ tự — đúng phép KẸP mà Phase 7D đã phải gỡ) và cũng không nên chỉ hạ
  `ROAD_SPAN` (bóp đều cả 15 kỷ, kể cả những kỷ đang đúng). Luật cũ là **trường hợp giới hạn** của
  công thức trên khi `MAX → ∞`, nên có thể dò dần rất an toàn.
- **⚠️ BỊ CHẶN BỞI #27, VÀ ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA MỤC NÀY**: bản vá trên **làm ĐỎ** bài
  `15 KỶ RA 15 MẶT ĐƯỜNG` (`palette3d.test.js`) — cặp 3↔10 ban đêm tụt từ 10,3 xuống **7,9**, dưới
  ngưỡng 10. Đo tiếp thì thấy điều đáng nói hơn nhiều: **kể cả khi nới trần tới 0,46 (gần như không
  bão hoà nữa) cặp ấy cũng chỉ lên được 9,8** — tức lời hứa "15 kỷ ra 15 mặt đường" xưa nay **chỉ
  đạt nhờ 3% biên** (10,3 so với ngưỡng 10), và nó đạt được **chính nhờ cái khuyết tật này**: phép
  đẩy vô hạn đang thổi phồng khác biệt ở đầu tối. Gỡ khuyết tật thì lời hứa mất theo.
  ⇒ **#27 và #30 nay là MỘT cặp, phải làm cùng nhau.** Và phương án "chấp nhận vĩnh viễn" mà #27
  đề xuất KHÔNG còn dùng được nữa: chấp nhận #27 nghĩa là giữ #30. Muốn cả hai thì phải tách 15 kỷ
  bằng thứ KHÔNG phải độ đậm — vạch kẻ, bề rộng làn, vỉa hè (tức hình học, đúng như #27 đã gợi ý).
- **Estimated Complexity**: thấp cho riêng công thức (một hàm thuần, đã viết + đã đo); trung bình
  nếu làm trọn gói cùng #27.
- **Blocking Conditions**: #27 (xem trên)
- **Review Trigger**: khi bắt tay vào #27, hoặc khi Đàm nói đường trông như rãnh đen
- **Owner**: phiên AI kế tiếp · **Status**: Open (đã đo đủ, có bản vá, CỐ Ý chưa ship vì sẽ phải
  nới một lời hứa đang có — xem `CLAUDE.md` mục cấm nới ngưỡng cho tiện)

---

## #28 — ✅ [ĐÃ XỬ LÝ 2026-08-15] Mặt đất vẫn là bàn cờ ô vuông phẳng

- **Module**: `src/components/city/render3d/geometryFactory.js` (cạnh) + `sceneGraph.js` (ô nền),
  phát hiện bằng ảnh chụp ở Phase 8A
- **Priority**: Medium-High
- **Severity**: Medium
- **Impact**: ~~(a) **Cạnh sắc**~~ → **ĐÃ ĐÓNG ở Phase 8B** (`bevelWidth` + ba vành mặt bên; ×1,24
  tam giác, 3,8% khung hình đổi đủ để mắt thấy — xem ADR-018). Còn lại:
  (b) **Bàn cờ**: nhìn ảnh kỷ 7 ở khoảng cách thường thấy rõ mặt đất là 144 ô vuông phẳng, mỗi ô
  một sắc độ hơi khác — đúng thứ Đàm gọi là *"grid 12×12 với object đặt trong từng ô"*. ⚠️ Mặt đất
  **không** đi qua `geometryFactory` (nó là `InstancedMesh` riêng ở `sceneGraph.js`), nên cạnh vát
  của Phase 8B **không chạm tới nó** — đừng tưởng vát cạnh đã sửa luôn phần này.
- **Root Cause**: ô nền là `InstancedMesh` của một khối hộp — rẻ và đúng lúc mặt đất còn phẳng,
  nhưng Phase 7B đã cho mặt đất cao độ mà ô nền vẫn giữ nguyên cách dựng cũ.
- **Current Risk**: thấp về kỹ thuật (không có gì hỏng), cao về mục tiêu — đây chính là điều Đàm
  đang phàn nàn, và Definition of Done của anh nói rõ *"nếu câu trả lời vẫn là pixel / blocky /
  low-poly / flat, hãy tiếp tục sửa nền tảng thay vì đánh dấu phase hoàn thành"*.
- **Future Risk**: gộp 144 ô thành một lưới liền có cao độ sẽ làm ô nền hết là `InstancedMesh` —
  phải cân lại lệnh vẽ. Ngược lại, để nguyên thì mọi công sức làm mặt đất và ánh sáng vẫn bị một
  lưới ô vuông đè lên trên.
- **Recommended Solution**: gộp mặt đất thành một lưới liền (mỗi ô 2 tam giác nhưng dùng chung
  đỉnh ở mép) hoặc phá nhịp ô vuông bằng biến thiên cao độ/màu trong từng ô. Đo lệnh vẽ trước–sau.
- **Estimated Complexity**: trung bình
- **Blocking Conditions**: không có blocker cứng. Nhưng cần đo cổng hiệu năng (#23/#26) để biết còn
  bao nhiêu chỗ trống thật.
- **Review Trigger**: khi quay lại mảng "thành phố phải có quy mô" trong chỉ thị của Đàm
- **Owner**: chưa gán
- **Status**: ✅ **ĐÃ ĐÓNG CẢ HAI PHẦN.** (a) cạnh sắc → Phase 8B (ADR-018). (b) bàn cờ → **Phase
  8C** (ADR-019): mặt đất và mặt đường mỗi thứ là MỘT tấm lưới liền lấy mẫu từ `surfaceHeightAt`
  (`render3d/terrainMesh.js`), thay cho 144 + ~52 khối hộp. Dữ liệu thềm bậc **không đổi một con
  số** — chỉ cách vẽ đổi, đúng như Đàm cho phép (*"giữ data/progression nhưng thay đổi cách render"*).
  - **Đã trả lời câu hỏi "Future Risk" ở trên bằng số đo**: lệnh vẽ **KHÔNG đổi** (2 trước, 2 sau —
    tấm liền cũng chỉ là 1 lệnh vẽ như `InstancedMesh`). Tam giác thì có: địa hình **2.330 → 7.130**
    (6.498 đất + ~630 đường), tức +4.800 = **+8% ngân sách**; cả cảnh ~29.000 → **~36.100 = 60%**
    của trần 60.000. Đây là khoản chi lớn nhất từ đầu mảng 8 và nó **chưa được đo trên iPhone thật**
    — xem #23/#26, nay gấp hơn một bậc.
  - **Đi kèm**: `terrain.js` thêm `smoothHeightAt`/`surfaceHeightAt`/`tintAt` + vùng đất thoải
    (`APRON_*`) để mép lưới thôi là một hình vuông sắc lẹm; mặt đất thêm hai tầng biến thiên (vết
    loang tần số ~2,9 ô + sườn dốc lộ đất). 11 bài test mới, tất cả đã thử ngược.

---

## #27 — ✅ [ĐÃ XỬ LÝ 2026-08-16, Phase 9D] Ba cặp kỷ có mặt đường gần trùng nhau VÀO BAN ĐÊM (ban ngày thì không)

> **ĐÃ ĐÓNG CÙNG #30 — và đóng bằng cách BỎ HẲN câu hỏi cũ, không phải bằng cách kéo con số lên.**
>
> Mục này đo bản sắc mặt đường bằng **khoảng cách RGB**. Sau khi #30 được vá (phép đẩy độ đậm có
> trần), bài test `15 KỶ RA 15 MẶT ĐƯỜNG` ĐỎ ở cặp **11↔13 (7,9)** — và nó đỏ **một cách đúng đắn**:
> kỷ 11 là lưới Manhattan, kỷ 13 là phố Nhật, **cả hai đều lát NHỰA ĐƯỜNG**. Nhựa đường ở New York
> và ở Tokyo là cùng một vật liệu, nên chúng gần nhau về màu là sự thật vật lý; ép hai con đường
> nhựa ra hai màu khác nhau để một con số đẹp lên mới là nói dối. Đàm nói thẳng ở Phase 9D:
> *"không nới threshold và không giả màu — hãy thay metric RGB bằng đặc trưng structural thực sự."*
>
> ⇒ Phép đo bản sắc chuyển sang **8 trục CẤU TRÚC** (`src/engine/city3d/streetStyle.test.js`), mỗi
> trục lượng hoá về thứ mắt thật sự đọc được, suy từ hai phép đo đã có (một ô ≈ 64 điểm ảnh; ngưỡng
> mắt 12/255) chứ không từ ba hằng số chọn tay. Kết quả trên **cả 105 cặp**: cặp yếu nhất khác nhau
> **3/8 trục**, trung vị **6/8**, không cặp nào dưới 3; **kỷ liền nhau** yếu nhất cũng 3/8.
> Kèm **hai bài đối chứng**: một thế giới 15 kỷ giống hệt nhau (phải ra 0 trục) và một thế giới 15 kỷ
> chỉ chênh nhau 0,001 ô ≈ 0,06 điểm ảnh (sàn 3 trục phải TỪ CHỐI) — để ngưỡng không bị nới dần.
>
> Tầng bảng màu giữ lại đúng hai lời hứa mà **màu** thật sự chịu trách nhiệm được: bảng không dẹt
> (trung vị 105 cặp ≥ 90; đo được 116,4 lúc 12h và 115,9 lúc 22h) và không hai kỷ nào ra ĐÚNG cùng
> một mã màu. Cộng thêm một bài canh chiều ngược: **cặp gần nhau nhất về màu PHẢI là hai kỷ dùng
> chung vật liệu** — nếu một ngày gạch nung và nhựa đường ra cùng màu thì lúc đó bảng màu mới có lỗi.

- **Module**: `src/engine/city3d/eraStyle.js` (`roadColor` 15 kỷ), phát hiện + đo ở Phase 7D
- **Priority**: Low
- **Severity**: Low
- **Impact**: đo 105 cặp kỷ trên bảng màu mặt đường. **Ban ngày: 0 cặp** dưới ngưỡng nhìn-thấy-
  khác-nhau (cặp gần nhất 12,4 · trung vị 116,4). **Ban đêm: 3 cặp** — kỷ 3↔10 = 10,3 · 10↔13 =
  10,3 · 1↔5 = 10,9 (trung vị 116,6). Không cặp nào là hai kỷ LIỀN NHAU (cách nhau lần lượt 7, 3
  và 4 kỷ), nên Đàm gần như không bao giờ nhìn hai cái cạnh nhau.
- **Root Cause**: hai tầng cộng lại. (a) Vật liệu thật sự CÓ trùng họ — nhựa đường Babylon và
  macadam ám bồ hóng Manchester đều là mặt tối gốc hắc ín; ép chúng khác nhau là bịa ra một khác
  biệt không có ngoài đời, đúng thứ luật `country`/`landmark` ở `eraStyle.js` cấm. (b) Ban đêm bảng
  màu hạ độ tươi 20% (hiệu ứng Purkinje), mà độ tươi chính là chỗ ba cặp này khác nhau — nên chúng
  chỉ chụm lại khi trời tối.
- **Current Risk**: rất thấp. Ba cặp trên tổng 105, đều cách nhau ≥3 kỷ, và chỉ vào ban đêm.
- **Future Risk**: nếu sau này có ai hạ độ tươi ban đêm sâu hơn nữa (về 0,6 như mặt đất), số cặp
  trùng ban đêm nhảy từ 3 lên 7 — đã đo. Bài test `palette3d.test.js` canh cực tiểu ≥ 10 và trung
  vị ≥ 90 nên nó sẽ ĐỎ, không trôi ngầm.
- **Recommended Solution**: đừng chỉnh mã màu để chạy theo con số — ba lần thử ở Phase 7D đều
  chỉ ĐỔI CHỖ vấn đề (kéo kỷ 12 ra khỏi 13 thì nó dính vào kỷ 5). Nếu muốn tách thật thì tách
  bằng thứ KHÔNG phải màu: bề rộng làn, vạch kẻ đường, hoặc vỉa hè — tức hình học, thuộc một
  phase sau. Cũng có thể chấp nhận vĩnh viễn: đường Manchester và đường Babylon giống nhau là
  một sự thật, không phải một lỗi.
- **Estimated Complexity**: trung bình (nếu chọn tách bằng hình học); bằng 0 nếu chấp nhận
- **Blocking Conditions**: lưới 12×12 đã đầy (80 ô đường · 34 ô kỳ quan · 30 ô nhà dân = 144),
  nên thêm chi tiết đường phải làm trong CÙNG ô, không được cấp ô mới
- **Review Trigger**: khi làm bước "Historical Architecture", hoặc nếu Đàm nói hai kỷ nào đó có
  đường giống nhau
- **⚠️ CẬP NHẬT 2026-08-15 (Phase 9B) — MỤC NÀY NAY BỊ NỐI CỨNG VỚI #30**: phương án "chấp nhận
  vĩnh viễn" ở trên **không còn dùng được**. Ba cặp này chỉ đạt ngưỡng 10 nhờ đúng cái khuyết tật
  mà #30 phải sửa (phép đẩy độ đậm KHÔNG CÓ TRẦN đang thổi phồng khác biệt ở đầu tối). Bản vá của
  #30 kéo cặp 3↔10 xuống 7,9; nới trần tới mức gần như không bão hoà cũng chỉ lên 9,8. ⇒ chấp
  nhận #27 = giữ #30 (mặt đường đen dưới ngưỡng nhìn). Hai mục phải làm CÙNG NHAU, và lối ra
  nằm ở gợi ý sẵn có ngay trên: tách bằng HÌNH HỌC chứ không bằng độ đậm.
- **Owner**: phiên AI kế tiếp · **Status**: Open (đã đo đủ, có chủ đích chưa xử lý)

---

## #31 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — `city.dispose()` KHÔNG giải phóng bản đồ bóng (app hiện KHÔNG dính, công cụ thì dính)

- **Tên**: Bản đồ bóng của mặt trời sống sót qua `city.dispose()`
- **Module**: `src/components/city/render3d/sceneGraph.js` (hàm `dispose()`, ~dòng 1167)
- **Priority**: Low · **Severity**: Low hôm nay, Medium nếu kiến trúc đổi
- **Impact**: Mỗi lần dựng-rồi-dọn một cảnh để lại **+2 texture sống sót**. Bản đồ bóng desktop là
  2048×2048; chạy 24 cảnh liên tiếp trên MỘT renderer để lại gần **800 MB bộ nhớ đồ hoạ**.
- **Root Cause**: `dispose()` duyệt `meshes` + `disposables` — hai danh sách chứa những thứ nó TỰ
  tạo ra. Bản đồ bóng thì không nằm trong danh sách nào: nó do chính three tạo ra **muộn hơn**, ở
  lần render đầu tiên, và treo vào `sun.shadow.map`. Đây là hình dạng sai quen thuộc — *dọn theo
  danh sách mình ghi, trong khi có thứ được sinh ra ngoài danh sách ấy*.
- **Current Risk**: **App KHÔNG dính.** `CityScene3D.jsx` (`runtime.dispose()`, ~dòng 422) gọi
  `city.dispose()` RỒI `renderer.dispose()` + `renderer.forceContextLoss()` — mất context thì cả
  bối cảnh đồ hoạ bị thu hồi, kể cả những texture không ai gọi tên. Chỉ CÔNG CỤ dính, vì công cụ
  cố ý dùng lại một renderer cho nhiều cảnh (`bench-suite.mjs`, `--sweep`).
- **Future Risk**: ⚠️ Đây là **mìn hẹn giờ**, không phải lỗi đang chảy máu. Ngày nào có ai làm app
  dùng lại renderer khi chuyển kỷ — một tối ưu hoàn toàn hợp lý và rất dễ được đề xuất, vì dựng lại
  context tốn cả trăm mili-giây — thì rò rỉ này thức dậy trên máy Đàm, và triệu chứng sẽ là *"đi qua
  vài kỷ trong bảo tàng thì máy nóng dần rồi tab sập"*, một triệu chứng KHÔNG trỏ về đây chút nào.
- **Recommended Solution**: một dòng trong `dispose()` — `sun?.shadow?.map?.dispose?.()`. Kèm một
  bài test đòi số texture sau dispose KHÔNG tăng qua nhiều vòng dựng-dọn (đã đo được bằng
  `.city-preview/.leak-work/`, hiệu số rất rõ: bật cập nhật bóng thì 1→3→5→7…, tắt thì đứng yên).
- **Estimated Complexity**: Thấp (1 dòng + 1 bài test)
- **Blocking Conditions**: Không có. CỐ Ý chưa sửa trong phiên Performance Gate vì Đàm đã yêu cầu
  *"không benchmark code đang thay đổi"* — sửa renderer giữa lúc đo thì bảng số không còn nói về
  bản `9b9cb66` nữa. Bản vá đã áp **phía công cụ** để bộ đo không tự làm hỏng con số nó đang đo.
- **Review Trigger**: NGAY khi có ai đề xuất dùng lại renderer giữa các cảnh/kỷ; hoặc phiên nào
  đụng vào `dispose()` vì lý do khác thì sửa luôn.
- **Owner**: phiên AI kế tiếp · **Status**: Open



- **✅ ĐÃ XỬ LÝ 2026-09-02.** `dispose()` nay dọn cả `sun.shadow.map` rồi **gỡ tham chiếu về
  `null`** — dọn mà giữ tham chiếu thì đối tượng đã chết vẫn bị neo. Dùng `?.` ở mọi bậc vì
  `shadow.map` là `null` cho tới lần render ĐẦU TIÊN: một cảnh dựng rồi dọn mà chưa kịp vẽ lần nào
  vẫn phải chạy qua đây không ném lỗi.
- ⚠️ **VÌ SAO VẪN ĐÁNG SỬA DÙ APP KHÔNG DÍNH.** `CityScene3D.jsx` gọi `renderer.forceContextLoss()`
  ngay sau, mất context thì GPU dọn sạch — nên app không rò rỉ. Nhưng một hàm tên `dispose()` mà chỉ
  đúng **nhờ người gọi làm thêm một bước nữa** là đúng nhờ một thứ chẳng liên quan, đúng bẫy
  Phase 7D (`roadColor` đúng nhờ một hằng số ở file khác). Công cụ dựng 24 cảnh liên tiếp trên MỘT
  renderer thì dính thật: +2 texture mỗi cảnh, bản đồ bóng desktop 4096² ⇒ gần **800 MB**.
- Khoá bằng `sceneStats.test.js` (bài "dispose() dọn cả bản đồ bóng, và chịu được gọi hai lần").
  ⚠️ Phép thử ngược "gỡ hẳn phần dọn bóng" ĐÃ chạy và ĐỎ; hai phép còn lại bị hết bộ nhớ giữa
  chừng (bộ test này dựng cảnh thật, rất nặng) — và chính lượt bị giết ấy để lại một file sửa dở,
  bắt được nhờ chạy lại test chứ không nhờ `git status`. *Bộ thử ngược trên test nặng phải chạy
  TỪNG phép một, và phải xác nhận khôi phục bằng cách CHẠY LẠI, không chỉ nhìn `git status`.*

---

## #32 — ✅ [ĐÃ XỬ LÝ 2026-08-17, Performance Gate] Đồng hồ đo HUD báo THIẾU 56% số tam giác

- **Tên**: `stats.triangles` tự tính bằng công thức riêng, lệch +44.126 so với thực tế
- **Module**: `src/components/city/render3d/sceneGraph.js` · `CityScene3D.jsx` · `CityPerfHud.jsx`
- **Priority**: (đã đóng) — lúc phát hiện là **High**, vì đây là con số Đàm dùng để quyết định
- **Impact**: HUD và trang xem thử báo **34.622** tam giác cho kỷ 7 trong khi máy thật sự vẽ
  **78.748** — thiếu **56%**. Sai theo hướng **trấn an**, tức loại sai nguy hiểm nhất cho một đồng
  hồ đo: nó khiến mọi quyết định "còn dư sức, thêm chi tiết đi" dựa trên một ngân sách bịa.
- **Root Cause**: `stats.triangles` được **DỰ ĐOÁN** bằng công thức
  `buildingTriangles + surfaceTriangles + residents × 24`, trong khi three biết chính xác qua
  `renderer.info.render.triangles`. **Chưa ai từng đặt hai bên cạnh nhau.** Hằng số lệch 44.126
  giống hệt ở cả 15 kỷ chính là hai thứ công thức không biết tới: **vòm trời** (960) và **rặng núi
  chân trời** thêm ở **Phase 9A** (43.166). Người thêm chúng không sửa công thức, và **không có gì
  đỏ lên** vì công thức chỉ được so với chính nó.
- **⚠️ Đây là lần thứ HAI cùng một hình dạng sai**: chú thích của `countTriangles` (`parts.js`) đã
  tự nhận *"có test đối chiếu hai bên"* trong khi bài test ấy chỉ so với **hằng số viết tay**
  (Phase 8B, đã ghi trong `CLAUDE.md`). Bài học đã được viết ra mà vẫn tái diễn ở một file khác ⇒
  bài học chưa đủ, phải có **test thật** mới chặn được.
- **Giải pháp đã áp dụng**: thôi DỰ ĐOÁN, chuyển sang **ĐẾM** — `countSceneTriangles(scene)` /
  `countSceneDrawCalls(scene)` duyệt scene graph theo đúng luật `WebGLRenderer` cộng vào
  `info.render`. Một phép đo trên chính thứ sẽ được vẽ thì không thể lạc hậu khi ai đó thêm khối
  mới. `CityScene3D.publishStats()` còn **đè lên** bằng `renderer.info.render` — HUD phải nói máy
  vừa làm gì, nên nó đọc từ đồng hồ chứ không đọc từ dự báo.
- **Nghiệm thu**: `[stats] tam giác | 78748 | 78748 | +0 (0.0%)` — đo bằng
  `node scripts/city-preview.mjs --era 7 --sessions 80 --level 3 --hour 12 --bench 24`.
  Lệnh vẽ vốn đã đúng (13 = 13) nên phần đó không đổi.
- **Test khoá**: `src/components/city/render3d/sceneStats.test.js` — 3 bài, **cả 3 đã thử-cho-đỏ**
  bằng cách khôi phục đúng công thức cũ. Bài test tự duyệt scene graph bằng mã CỦA NÓ rồi so với
  thứ mã sản phẩm báo (chạy CẢ HAI bên, không bên nào so với hằng số thứ ba), kèm một **đối chứng**
  đòi phần "công thức cũ mù" phải còn > 40.000 tam giác và phải nằm trong con số HUD.
- **Owner**: đã đóng · **Status**: Resolved

---

## #34 — ✅ [ĐÃ XỬ LÝ 2026-08-17, vòng 4] `--thu` không kiểm điều kiện tiên quyết, nên lỗi "thiếu thư viện" hiện ra thành 20 dòng lỗi Vite

> ✅ **ĐÃ ĐÓNG.** `--thu` nay chạy **preflight 8 mục trước khi gói bundle**, xếp theo giá (kiểm thư
> mục tức thì → gọi node đọc phiên bản → hỏi Chromium → ghi thử file → hỏi git), **dừng ngay ở mục
> đầu tiên hỏng** và in ✅/❌ kèm **ĐÚNG MỘT lệnh cần gõ**. Ca đã cắn Đàm (`node_modules` có nhưng
> thiếu `three`) nay bị bắt trước khi Vite kịp nói một chữ.
>
> Kèm hai thứ phát sinh, cả hai đều do **thử ngược** lộ ra chứ không do đọc mã:
> **(a)** Mục "đúng thư mục dự án" phải đứng **TRƯỚC** mục `node_modules` — hai triệu chứng giống
> hệt nhau (không có `node_modules`) nhưng cách sửa **ngược nhau**: bảo một người đang đứng nhầm
> chỗ chạy `npm install` là làm họ mất vài phút cài vào thư mục chẳng liên quan rồi hỏng y như cũ.
> **(b)** Mục kiểm git tự tố cáo **sản phẩm của chính nó** — script ghi báo cáo vào `.city-preview/`
> trước khi preflight chạy, nên `git status` thấy nó là "thay đổi chưa lưu". Trong kho thật điều đó
> bị `.gitignore` che đi, tức lời cảnh báo đang đúng **nhờ một file chẳng liên quan** — đúng hình
> dạng quả mìn. Đã lọc. Một cảnh báo kêu oan còn tệ hơn không có: nó dạy người dùng bỏ qua MỌI
> cảnh báo.
>
> **Khoá bằng test** (`scripts/benchMacbookSource.test.js`, 8 bài, tất cả đã thử-cho-đỏ). ⚠️ Chính
> phép thử ngược đã bắt được một lỗ hổng trong bài test đầu tiên tôi viết: nó dựng dự án **không
> có `node_modules` nào cả**, nên mục kiểm số 1 bắt trước và **mục kiểm số 2 chưa từng được chạy** —
> gỡ hẳn mục 2 khỏi script mà test vẫn xanh. Đúng bài học Phase 4D: *"một bài test xanh không cho
> biết có BAO NHIÊU thứ đang giữ nó xanh"*. Nay có bài riêng dựng đúng ca "đủ mọi gói, khuyết đúng
> `three`".
>
> **Chỗ cắt log cũng đã sửa (phần B của vòng 4)**: bản cũ `tail -n 20` giữ 20 dòng CUỐI, mà với lỗi
> build thì **nguyên nhân luôn ở ĐẦU còn ngăn xếp ở cuối** — nên nó đã vứt đúng dòng
> `Rolldown failed to resolve import "three"` và giữ lại toàn `at viteLog (...)`. Nay in **15 dòng
> đầu + 8 dòng cuối** có nhãn rõ ràng, lọc bỏ dòng ngăn xếp thuần khỏi phần trích (KHÔNG lọc khỏi
> file log), và luôn ghi đường dẫn đầy đủ tới `.city-preview/bench-loi-toanvan.log`.

**(Bản ghi gốc, giữ nguyên để đối chiếu:)**

- **Tên**: Chế độ thử nhanh của bộ đo báo SAI NGUYÊN NHÂN khi thiếu `node_modules/three`
- **Module**: `scripts/bench-macbook.sh` (chế độ `--thu`) · `scripts/city-preview.mjs`
- **Priority**: **Medium** · **Severity**: Medium
- **Impact**: **Đã cắn Đàm thật ngày 2026-08-17, mất 4 vòng qua lại.** Máy anh chưa cài đủ phụ
  thuộc; `--thu` chạy tới bước gói bundle rồi Vite đổ ra ~20 dòng lỗi phân giải module. Bộ đo báo
  đúng là "HỎNG", nhưng **không nói được vì sao**, nên cả hai bên phải đoán qua lại vài lượt mới ra
  nguyên nhân thật — trong khi bản sửa chỉ là một câu tiếng Việt.
- **Root Cause**: `--thu` sinh ra ở vòng 2 để **chứng minh bộ đo chạy được trước khi chạy thật**, và
  nó làm đúng phần *phát hiện*: nó dừng, in `!!! CẢNH NÀY HỎNG` kèm 20 dòng cuối. Cái thiếu là phần
  *chẩn đoán*: nó không kiểm **điều kiện tiên quyết** (có `node_modules/three` không) TRƯỚC khi
  khởi động, nên nguyên nhân gốc bị chôn dưới hậu quả. Cùng họ với luật "kiểm CÔNG CỤ trước, kiểm
  mã sau" — chỉ là ở đây phải kiểm **môi trường** trước cả hai.
- **Current Risk**: **Trung bình, và nó chỉ nổ với đúng người không biết code.** Một AI đọc lỗi Vite
  là hiểu ngay; Đàm thì không, mà `--thu` được thiết kế riêng cho Đàm. Tức lỗi này nhắm đúng vào
  người dùng duy nhất của tính năng.
- **Future Risk**: mỗi lần Đàm đổi máy / xoá `node_modules` / clone lại repo là lặp lại y hệt. Và
  mọi phụ thuộc tiên quyết khác (Chromium của Playwright, `zlib`, quyền ghi `.city-preview/`) đều
  có cùng hình dạng — chưa cái nào được kiểm trước.
- **Recommended Solution**: thêm một hàm `kiem_moi_truong()` chạy **trước mọi thứ khác** trong cả
  `--thu` lẫn chạy thật, kiểm theo thứ tự và **dừng ngay ở cái đầu tiên thiếu**, mỗi lỗi in **đúng
  một câu tiếng Việt + đúng một câu lệnh cần gõ**:
  (1) `node_modules/three` → *"Thiếu thư viện 3D. Chạy: `npm install --legacy-peer-deps`"*;
  (2) `node_modules` rỗng/không có → cùng câu lệnh trên;
  (3) không tìm thấy Chromium → câu lệnh tương ứng.
  ⚠️ Kiểm bằng **sự tồn tại của thư mục**, đừng kiểm bằng cách chạy thử rồi bắt lỗi — chạy thử
  chính là thứ sinh ra 20 dòng nhiễu.
- **Estimated Complexity**: **Thấp** (~10 dòng shell). Đây là mục rẻ nhất trong cả file này.
- **Blocking Conditions**: không có.
- **Review Trigger**: lần kế tiếp bất kỳ ai chạm vào `bench-macbook.sh`.
- **Owner**: phiên AI kế tiếp · **Status**: ✅ **ĐÃ XỬ LÝ 2026-08-17 (vòng 4)**

---

## #36 — ✅ ĐÃ ĐÓNG (2026-08-18, Phase 10 Bước 2) — Kỷ 1 và kỷ 2 vẫn KHÔNG có cửa ra vào

- **Module**: `src/engine/city3d/eraStyle.js` (bảng `groundFloor` của kỷ 1, 2) · `buildingSpec.js`
- **Priority**: Medium · **Severity**: Low (mỹ thuật, không ảnh hưởng dữ liệu hay hiệu năng)
- **Impact**: hai kỷ đầu của hành trình — tức thứ Đàm nhìn thấy TRƯỚC TIÊN khi mở bảo tàng — có
  công trình không có lối vào. Nhìn kỹ thì mỗi khối là một hình đặc.
- **Root Cause**: cửa đời cũ nằm ở cuối `emitWindows`, mà hàm ấy thoát ngay ở dòng đầu khi
  `style.windows === 'none'`. Kỷ 1 (lều da thú) và kỷ 2 (nhà bùn) khai `'none'` — hoàn toàn đúng về
  lịch sử — nên chưa bao giờ chạy tới dòng cửa. Hai luật chẳng liên quan gì nhau (có cửa sổ không /
  có cửa ra vào không) dùng chung một câu `return`.
- **Current Risk**: thấp. **Nguyên nhân gốc ĐÃ được sửa ở Phase 10**: `emitGroundFloor` nay được
  gọi từ `buildBuildingSpec` chứ không từ `emitWindows`, nên cửa đã thôi phụ thuộc vào cửa sổ. Hai
  kỷ này chưa hưởng chỉ vì Bước 1 cố ý chỉ làm 3 kỷ (6 · 9 · 13) để nghiệm thu hướng mỹ thuật.
- **Future Risk**: thấp — mục này tự đóng khi Bước 2 chạy.
- **Recommended Solution**: ở Bước 2, khai `groundFloor` thật cho kỷ 1 và 2. Gợi ý đã có sẵn dữ
  liệu: kỷ 1 (Göbekli Tepe) là tấm da thú vén lên trên một khung gỗ — `frame: 'wood'`, `steps: 0`,
  `feature: 'none'` (thời đồ đá thì mặt tiền KHÔNG có gì, và khai `'none'` là một câu trả lời hợp
  lệ chứ không phải chỗ trống). Kỷ 2 (làng ven sông Nin) là lỗ cửa trổ trong tường bùn dày, có
  ngưỡng đất nện.
- **Estimated Complexity**: Thấp — chỉ là hai dòng bảng, mã dựng đã có.
- **Blocking Conditions**: chờ Đàm gật cho Bước 1 (xem `BAN_GIAO.md`).
- **Review Trigger**: khi bắt đầu Bước 2 của Phase 10.
- **Owner**: chưa phân công · **Status**: ✅ **ĐÓNG 2026-08-18 (Phase 10 Bước 2)**

**Đã đóng thế nào** — kỷ 1 khai `door: 'flap'` (tấm da căng treo trên thanh ngang, `frame: 'none'`,
`steps: 0`, `feature: 'none'`), kỷ 2 khai `door: 'flap'` + `frame: 'wood'` (lanh tô gỗ sơn đỏ của
làng thợ Deir el-Medina) + `vernacularFeature: 'awning'` (mành sậy chắn nắng). Phải THÊM một kiểu
cửa mới (`flap`) chứ không tái dùng `panel`: dựng cửa bức bàn cho một túp lều da thú là nói dối
lịch sử tới tám nghìn năm. Gợi ý cũ ở mục này ghi kỷ 1 dùng `frame: 'wood'` — **đã đổi thành
`'none'` sau khi đọc lại**: một tấm da vắt qua thanh ngang thì không có khuôn cửa.

⚠️ **BÀI HỌC RÚT RA — và nó lớn hơn chính mục nợ này.** Mục #36 được đóng ĐÚNG HẠN không phải nhờ
ai nhớ ra, mà nhờ **một con số nằm trong một bài test**: Bước 1 viết `assert.equal(soKyLegacy, 12)`.
Con số ấy là thứ buộc Bước 2 phải mở lại bài test mới chạy xanh được. Một mục nợ ghi trong tài liệu
thì chỉ được đọc khi có người đi tìm; một con số trong bài test thì **tự đòi được đọc**. ⇒ Khi phải
ship một trạng thái dở dang, hãy làm nó **ĐẾM ĐƯỢC trong một bài test**, đừng chỉ ghi vào đây.

---

## #64 — ✅ **ĐÃ ĐÓNG 2026-08-20** — KỶ 5 LÀ MỘT **ĐẢO**: `MEANDER_NECK = 1,6` KHÔNG CẮT RA ĐƯỢC LỐI VÀO NÀO

- **Tên**: vành nước `meander` khép kín hoàn toàn quanh thành phố; "dải yên ngựa khô" mà cả bảng
  lẫn ADR đều dựa vào để biện minh cho kiểu nước này **không tồn tại trên màn hình**
- **Module**: `src/engine/city3d/setting.js` (`MEANDER_NECK`, nhánh `meander` của `insetGoc`) ·
  `src/engine/city3d/settingStyle.js` (chú thích dòng kỷ 5 + khối "sáu kiểu nước")
- **Priority**: Medium · **Severity**: Medium (hình vẫn dựng ra, không lỗi runtime — nhưng nó kể
  SAI câu chuyện mà cả kiểu nước ấy sinh ra để kể)
- **Impact**: ĐO ĐƯỢC, hai phép độc lập, cùng kết luận.
  1. **Tia toả tròn**: bắn **720 tia** từ tâm thành phố ra bán kính 14 ô, hỏi mỗi tia *"có gặp
     `blendAt > 0` không?"*. Kết quả **0/720 tia khô suốt**. Tia "cạn nhất" (95°) vẫn chạm
     `blendAt = 0,157` và độ sâu đáy **0,080 ô** — tức có một chỗ NÔNG hơn, nhưng nó vẫn là NƯỚC,
     không phải đất. (Chỗ sâu nhất của vành: `blendAt = 1,000`, đáy 0,111 ô.)
  2. **Loang trên ô khô**: loang từ tâm ra, bước 0,1 ô, chỉ đi qua ô có `blendAt <= 0`, hỏi có tới
     được mép thế giới không. Kỷ 5 = **KHÔNG**. Tám kỷ có nước khác đem thử cùng cách (2 · 4 · 8 ·
     10 · 12 · 13 · 14 · 15) đều = **CÓ**. Kỷ 5 là ca duy nhất.
  3. **Nhìn ảnh** (`--era 5 --hour 12 --zoom 1,7 --width 1400`): một **hào nước hình vuông, bốn góc
     vuông vức**, khép kín quanh thành phố. Nó đọc ra là *"lâu đài có hào"*, không phải *"suối uốn
     ôm quanh mỏm đá"*.
- **Root Cause**: `MEANDER_NECK` là **nửa bề rộng** của hành lang khô, còn `SHORE_BAND = 0,9` là bề
  dày dải hoà bờ. Trong hành lang, "độ khô" bị chặn trên bởi `-min(d[doi], MEANDER_NECK)`, mà
  `d[doi]` chính là khoảng cách ra khỏi mặt lưới — nên ở đoạn hành lang **sát mép lưới** (`d < 0,9`)
  giá trị ấy chưa đủ âm để `blendAt` về 0. Hành lang vì thế bị dải hoà bờ **bịt lại đúng ở đầu
  trong**, tức đúng đầu nối với thành phố. Một hành lang bịt một đầu thì không phải lối vào.

  ⚠️ **VÀ ĐÂY LÀ HÌNH DẠNG SAI ĐÁNG NHỚ: hai hằng số ở hai file/khối khác nhau, mỗi cái đúng riêng
  nó, mà QUAN HỆ giữa chúng thì không ai sở hữu.** `SHORE_BAND` là quyết định về độ mềm của mép
  nước; `MEANDER_NECK` là quyết định về bề rộng lối vào; không có một dòng nào nói *"lối vào phải
  rộng hơn dải hoà bờ"*. Cùng đúng bệnh của `TECH_DEBT #57` (`side` đúng, `DEFAULT_YAW` đúng, quan
  hệ giữa chúng vô chủ) mà ADR-041 đã phải sửa bằng "thứ thứ ba".
- **Current Risk**: trung bình — chú thích trong `setting.js` và `settingStyle.js` hiện **khẳng
  định** rằng có một lối vào duy nhất, và cả hai dùng chính điều đó để biện minh vì sao `meander`
  phải là một kiểu riêng chứ không ép vào `river`. Phiên sau đọc chú thích sẽ tin, và sẽ không đi
  kiểm.
- **Future Risk**: trung bình — Đàm đã nói thẳng trong lệnh nghiệm thu: *"nếu nó không đọc ra là
  'suối ôm quanh mỏm đá' thì đó là một hình dạng CHƯA NGHIỆM THU, không phải một con số cần chỉnh"*.
- **Recommended Solution**: ⚠️ **KHÔNG tự chọn — đây là quyết định mỹ thuật, chờ Đàm.** Ba hướng,
  đã đo sẵn:
  **(a) Chữa cái khe** — cho hành lang khô "trừ hao" dải hoà bờ (ví dụ lấy `-(trongKhe + SHORE_BAND)`
  thay vì `-trongKhe`), tức viết ra thành QUAN HỆ thay vì hai hằng số rời. Rẻ, giữ nguyên ý đồ
  Burg Eltz, và có thể khoá bằng đúng phép loang ở trên (`0/720` → phải có lối ra).
  **(b) Nhận rằng hào-quanh-lâu-đài là một câu chuyện ĐÚNG** — Burg Eltz thật thì nằm trên mỏm đá
  được suối ôm ba mặt, nhưng lâu đài Đức thời ấy có hào là chuyện phổ biến và nó vẫn kể đúng
  *"vì sao lâu đài nằm ở đó"*. Nếu chọn hướng này thì phải **sửa chú thích + đổi tên kiểu**, vì giữ
  chữ `meander` cho một cái hào là để lại một lời nói dối trong bảng.
  **(c) Đổi kỷ 5 sang `river`** — Đàm đã bác hướng này ngày 2026-08-19 với lý do rõ ràng (*"nước
  chắn ba mặt chính là câu trả lời cho vì sao lâu đài nằm ở đó"*), nên nêu ra chỉ để đủ bộ.
  ⚠️ Dù chọn hướng nào, việc BẮT BUỘC là **một bài test đếm được**: phép loang từ tâm phải trả lời
  đúng điều bảng đang hứa. Hôm nay không có bài test nào chạm tới mệnh đề "có lối vào" — đó là lý do
  nó sai suốt từ Bước B mà không có gì đỏ.
- **Estimated Complexity**: (a) nhỏ · (b) nhỏ (chỉ chữ nghĩa + đổi tên) · (c) nhỏ
- **Blocking Conditions**: không còn
- **Review Trigger**: khi có phase đổi `SHORE_BAND`, `MEANDER_NECK`, hoặc thêm kỷ `meander` thứ hai
- **Owner**: — · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-20** — Đàm chọn hướng **(a)**, làm xong.

### ✅ ĐÃ SỬA — 2026-08-20

**Đàm chốt hướng (a)** kèm hai điều kiện thêm: *"bo góc: hào 90° sắc lẹm là dấu hiệu hình dạng sinh
từ LƯỚI VUÔNG, không phải từ DÒNG CHẢY. Suối thật uốn"* và *"nghiệm thu bằng chính phép bắn 720
tia: phải có ít nhất một cung liên tục ra được đất khô, kèm đối chứng nhốt trạng thái hòn đảo"*.

**Hai thay đổi, cả hai đều là QUAN HỆ chứ không phải số hiệu chỉnh** (`src/engine/city3d/setting.js`):

1. `trongKhe = min(d[doi] **+ SHORE_BAND**, MEANDER_NECK − |doc − tâm|)`. Quan hệ được viết ra:
   *một lối vào phải khô hẳn ngay khi nó rời khỏi lưới*, tức độ khô của nó phải vượt trọn dải hoà
   bờ tại `d[doi] = 0`. Cộng đúng `SHORE_BAND` là cách ngắn nhất phát biểu điều đó, và nó **không có
   tham số tự do nào để trôi**.
2. Nhánh `meander` đổi sang hàm khoảng cách mới `distanceOutsideGridRounded` (Ơclit ⇒ **bo góc**).
   `distanceOutsideGrid` (L∞) **giữ nguyên** cho `outskirts.js` — hai nơi đang hỏi hai câu khác
   nhau (*"ra khỏi lưới bao xa theo trục nào"* vs *"cách cái lưới bao xa"*), nên đây KHÔNG phải
   "một luật hai công thức".

**Số nghiệm thu** (`node --test src/engine/city3d/setting.test.js`, và ảnh `--era 5 --hour 12
--sessions 40 --width 1500 --zoom 2.4`):

| Đại lượng | TRƯỚC (`b87df3c`) | SAU | Cách đo |
|---|---|---|---|
| cung liên tục ra đất khô (720 tia, `blendAt`) | **0** | **1 cung, 9,5° (19 tia)** | `cungKhoRaNgoai` |
| bề rộng eo đất, phần KHÔ HẲN | **0,000 ô** | **1,400 ô** = `2×(MEANDER_NECK − SHORE_BAND)` | `beRongEoDat(blendAt)` |
| bề rộng hành lang danh nghĩa | 3,203 ô | **3,203 ô** = `2×MEANDER_NECK` | `beRongEoDat(insetAt)` |
| bo góc: bờ ngoài chéo / trục | **1,3543** (vuông) | **1,0215** (tròn) | `tiSoBoNgoaiCheoTruc`, cổng 1,10 |
| nước chiếm khung hình (kỷ 5) | 3,34 % | 3,49 % | `water-score.mjs --eras 5` |
| tương phản nước↔bờ | 41,7 | 42,7 | như trên (ngưỡng mắt 12) |
| điểm ảnh đổi quá ngưỡng mắt | — | **1,0 %** (khung mặc định) · 0,7 % (cận cảnh) | `sweep-diff --frame` |
| tam giác thành phố kỷ 5 | 85.016 | 85.214 (**+198**) | `city-preview` |
| lệnh vẽ kỷ 5 | 13 | **13** (không đổi) | như trên |

**Bốn bài test mới** (`setting.test.js`, tất cả đã thử-cho-đỏ, 7 phép phá, mỗi phép nêu TRƯỚC chỗ
mong đợi đỏ): *KHÔNG KỶ NÀO ĐƯỢC LÀ HÒN ĐẢO* (15 kỷ, kèm đối chứng vành khép kín) · *EO ĐẤT RỘNG
ĐÚNG BẰNG QUAN HỆ* (khoá cả hai bề rộng + khoá `MEANDER_NECK > SHORE_BAND`) · *HÀO PHẢI BO GÓC*
(kèm hai đối chứng hào-vuông và hào-tròn dựng tay) · *HAI HÀM KHOẢNG CÁCH PHẢI LÀ HAI HÌNH*.

### ⚠️ CÒN LẠI MỘT NỬA CHƯA ĐẠT — VÀ NÓ KHÔNG PHẢI LỖI, NÓ LÀ MỘT QUYẾT ĐỊNH MỸ THUẬT KHÁC

Đàm ra ba điều kiện; **hai điều kiện đo được đã đạt** (có cung liên tục · đã bo góc). Điều kiện thứ
ba — *"nhìn ảnh cận cảnh phải đọc ra **mỏm đá trong khúc uốn**, không phải **lâu đài giữa hào
nước**"* — **CHƯA ĐẠT**, và tôi nói thẳng thay vì tự nhận là xong.

Ảnh sau khi vá đọc ra là *"lâu đài có hào, hào đã bo góc và có một lối vào"*. Nó tốt hơn hẳn bản
trước (hào vuông vức khép kín), nhưng vẫn chưa phải một khúc suối. Lý do nằm ở tầng khác: mặt nước
`meander` lấy hình từ **khoảng cách tới hình chữ nhật lưới**, nên dù bo góc thì nó vẫn là một vành
đai **đều bề rộng ôm quanh một hình vuông**. Suối thật thì bề rộng thay đổi, ôm ba mặt chứ không
bốn, và không lấy tâm là thành phố. Đổi được điều đó nghĩa là đổi **hình** của kiểu `meander` (bảng
`settingStyle.js` + một dòng hình học riêng), tức chính là việc `#65` đang giữ. → **gộp vào `#65`**.

---

---

## #59 — ✅ ĐÃ ĐÓNG (2026-08-20, Đàm chốt hướng (b)) — **BỀ RỘNG**: ba kỷ nước hẹp (6 · 7 · 10) không thể đạt cổng 5% ở **bất kỳ** góc nhìn nào

> ⚠️ **CẬP NHẬT 2026-08-24 (Phase 19) — MỘT LỜI KHẲNG ĐỊNH TRONG CHÍNH TIÊU ĐỀ MỤC NÀY ĐÃ BỊ BÁC BỎ
> BẰNG SỐ.** Tiêu đề nói kỷ 6 *"không thể đạt cổng 5% ở **bất kỳ** góc nhìn nào"*. Đo lại sau
> ADR-061: **trần toàn cục của kỷ 6 đi từ 4,36% lên 7,24%** — tức nay CÓ góc cứu được, chữ "bất kỳ"
> hết đúng. Nguyên nhân không phải bề rộng đổi (bảng `settingStyle` không đụng tới) mà là khung
> toàn cảnh lùi ra, kéo thêm mặt nước ngoài lưới vào khung.
> ⇒ `waterView.test.js` đã **đảo vế** bài kỷ 6 kèm giải thích: góc MẶC ĐỊNH vẫn trượt (2,59% < 5%)
> **nhưng** trần toàn cục nay > 5%. Hai câu ấy phải cùng được khẳng định, vì chỉ câu đầu thì đọc
> thành "vẫn hỏng", chỉ câu sau thì đọc thành "đã xong".
> ⚠️ Kết luận **BỀ RỘNG** của mục này (kỷ 7 và 10) vẫn nguyên giá trị, và mục vẫn ĐÓNG — thứ đổi là
> một chữ trong tiêu đề, không phải hướng chữa. Và nó cũng đứng nhờ ADR-061 (xem `#89`).

> ⚠️ **MỤC NÀY ĐÃ ĐƯỢC TÁCH ĐÔI (2026-08-21, Đàm ra lệnh: *"`#59` chứa hai loại nguyên nhân: TÁCH"*).**
> Nó từng ôm cả hai chứng bệnh: **(1) nước quá HẸP** (kỷ 6 · 7 · 10) và **(2) địa hình CHE** (kỷ 4 · 5,
> phát sinh ở §1(B) khi `drain` được sửa cho khớp `side`). Hai chứng ấy có nguyên nhân khác nhau, hướng
> chữa khác nhau, và **điều kiện đóng khác nhau** — gộp chung thì mục này không bao giờ đóng dứt điểm
> được, vì một nửa đã xong còn một nửa chờ Đàm. Nửa **(2)** nay sống riêng ở **`#67`**.
> Mục này từ đây **CHỈ** nói về bề rộng, và nó **ĐÃ ĐÓNG**.

- **Tên**: kỷ 6, 7, 10 khai nước quá hẹp; xoay kiểu gì cũng không đưa nổi lên 5% khung hình
- **Module**: `src/engine/city3d/settingStyle.js` (cột bề rộng nước) · đo bằng `scripts/water-view.mjs`
- **Priority**: Medium · **Severity**: Medium (Bước C sẽ tiêu ngân sách cho ba kỷ nhìn gần như không thấy)
- **Impact**: `worldYaw` (ADR-041) đã đưa 11/14 kỷ có nước lên trên cổng 5% của §3. Ba kỷ còn lại
  thì **không** — và không phải vì xoay sai, mà vì **dòng nước của chúng quá hẹp**:

  | kỷ | nước | bề rộng (ô) | trần TOÀN CỤC (đo 24 góc) | đạt 5%? |
  |---|---|---:|---:|:--:|
  | 6 | sông | 1,2 | **4,44%** | ❌ **không ở MỌI góc** |
  | 7 | sông | 1,4 | 9,05% | chỉ ở góc xiên, phá khung các kỷ khác |
  | 10 | kênh | 0,9 | 7,37% | chỉ ở một góc phá hỏng mọi kỷ khác |

  ⚠️ **Kỷ 6 là ca cứng nhất và cũng là ca sạch nhất**: trần toàn cục 4,44% nghĩa là *không tồn tại*
  góc nhìn nào đạt cổng. Đó là một sự thật về **DÒNG BẢNG**, không về phép xoay — nên mọi cố gắng
  chỉnh `worldYaw` cho kỷ 6 đều là chỉnh sai chỗ.
- **Root Cause**: cổng 5% được đặt từ hai kỷ ĐÃ DỰNG HÌNH (12 sông rộng, 14 biển) rồi mặc nhiên áp
  cho cả 14 kỷ. ⚠️ Đúng hình dạng **`TECH_DEBT #38`**: *một con số suy từ một mẫu nhỏ được đọc thành
  luật của cả tập*. Khác biệt duy nhất là lần này ta biết TRƯỚC khi tiêu ngân sách, chứ không phải sau.
- **Current Risk**: bằng 0 hôm nay — ba kỷ ấy **chưa dựng hình nước** (`ERAS_WITH_WATER_GEOMETRY`
  mới có [12, 14], xem #56). Rủi ro chỉ hiện thực khi Bước C trải nốt.
- **Future Risk**: trải Bước C mà không chốt mục này ⇒ ba kỷ tốn +1 lệnh vẽ và hàng nghìn tam giác
  cho một dải nước Đàm gần như không thấy — **đúng bài học §2-C** (*đo TRẦN của một cơ chế TRƯỚC khi
  tiêu ngân sách cho nó*).
- **Recommended Solution**: **KHÔNG tự chọn — đụng bảng đã duyệt.** Ba hướng:
  - **(a) Nới bề rộng nước ở ba kỷ ấy.** Giá: đụng sự thật địa lý. Kênh Amsterdam RỘNG 0,9 ô là
    đúng — kênh thật hẹp thật. Nới là mua một con số bằng cách nói dối, thứ ADR-025 đã cấm.
  - **(b) Chấp nhận ba kỷ dưới cổng, ghi tường minh ĐẾM ĐƯỢC trong test.** Trung thực nhất; theo
    đúng khuôn `assert.deepEqual(TRUOT, [...])` đã dùng cho `TECH_DEBT #44`. Kỷ thứ tư trượt thì đỏ,
    mà một trong ba kỷ được sửa xong cũng đỏ.
  - **(c) Với nước hẹp thì đổi thứ mang bản sắc**: không đo bằng % khung hình mà bằng **cầu, bến,
    thuyền, kè** — một con kênh 0,9 ô có bốn cây cầu đọc ra là *Amsterdam* rõ hơn một vệt xanh 5%.
    Đắt nhất, và cũng là hướng duy nhất giải đúng bài toán *"đọc ra là gì"* thay vì *"chiếm bao nhiêu"*.
- **Estimated Complexity**: (a) thấp · (b) rất thấp · (c) cao

### ✅ ĐÃ CHỐT THẾ NÀO (2026-08-20)

Đàm chọn **(b)**, và bác (a) bằng đúng một câu: *"nới kênh là **nói dối địa lý** — kênh Bridgewater
hẹp thật."* Hướng (c) được công nhận là **đúng về mỹ thuật** nhưng *"là cả một phase mới"* ⇒ tách
ra thành `TECH_DEBT #60` với điều kiện xem lại riêng, KHÔNG nhét vào khe hở của Bước C.

⚠️ **VÀ MỘT CÂU CẤM RÕ RÀNG: KHÔNG NỚI CỔNG 5% XUỐNG CHO VỪA BA KỶ ĐÓ.** Nguyên văn: *"Nới một
ngưỡng cho vừa kết quả là cái phễu Phase 9A."* Con số 5% đã hiệu chuẩn ở **cả hai đầu** bằng phép
đo thật (0,09% = không nhìn thấy gì · 23,75% = đọc ra ngay là thành phố cảng), nên hạ nó xuống là
vứt một thứ đã hiệu chuẩn để lấy một thứ chưa hiệu chuẩn.

**Đóng bằng một con số trong bài test, không bằng một dòng trong tài liệu** (`scripts/waterView.test.js`):

```js
assert.deepEqual(TRUOT, [6, 7, 10], '…');
assert.equal(DAT.length, 11, 'phải có đúng 11 kỷ đạt cổng 5%');
```

Nó tự đỏ **cả hai chiều**: kỷ thứ tư trượt thì đỏ, mà một trong ba kỷ được chữa xong cũng đỏ. Kèm
một bài riêng — `KỶ 6 TRƯỢT VÌ BỀ RỘNG` — quét đủ 24 góc và đòi trần toàn cục của kỷ 6 phải **dưới**
5%; đó là vế chứng minh câu *"giới hạn của bề rộng, không phải của góc nhìn"*, thay vì để nó nằm
làm một lời khẳng định chưa kiểm trong chú thích (bài học Phase 4G).

⚠️ **Kỷ 7 và 10 KHÔNG có bài tương tự, và đó là sự thật chứ không phải chỗ bỏ sót**: trần toàn cục
của chúng (9,11% · 7,22% — đo lại ở độ mịn bài test) CÓ vượt 5%, chỉ là ở những góc phá hỏng bố cục
của 14 kỷ còn lại. Viết *"không góc nào cứu được"* cho chúng sẽ là một câu sai.

**Nghiệm thu bằng mắt (Bước C, 2026-08-20)** — Đàm đặt điều kiện xem lại ở `#61`: kỷ 10 trượt cổng
(1,60%) **và mắt cũng không đọc ra là thành phố bên kênh** (ảnh cận cảnh: con kênh là một vệt xanh
mảnh ở góc trên-trái, thành phố không có quan hệ gì với nó). Tức cổng và mắt **đồng ý** ở ca này —
chưa có bằng chứng cổng đang đo sai đại lượng.
### ⚠️ CẬP NHẬT 2026-08-20 → ĐÃ TÁCH SANG `#67` (2026-08-21)

§1(B) làm danh sách trượt cổng đi từ 3 lên 5 kỷ, và hai kỷ mới (4 và 5) trượt vì **địa hình che**,
không vì bề rộng. Toàn bộ bảng số + phân tích của nửa ấy nay nằm ở **`#67`**; con số đang khoá trong
`scripts/waterView.test.js` là con số CHUNG của cả hai chứng (`TRUOT = [4, 5, 6, 7, 10]`,
`DAT.length === 9`) và nó sẽ đổi khi **một trong hai** mục được chữa — đó chính là lý do phải đọc cả
hai mục trước khi sửa con số ấy.

- **Owner**: Đàm chốt · **Status**: **✅ Closed (2026-08-20)** — ba kỷ 6 · 7 · 10, đúng khuôn (b);
  điều kiện xem lại duy nhất là nếu ai đó muốn nới bề rộng nước của chúng (⇒ nói dối địa lý, đã bị bác)

---

## #57 — ✅ ĐÃ ĐÓNG (2026-08-20, ADR-041) — Camera mặc định quay lưng lại phía có nước: kỷ 14 chỉ thấy **0,09%** mặt biển, trần là **31,43%**

- **Tên**: bờ nước và góc camera mặc định chỏi nhau; 8/14 kỷ có nước sẽ gần như vô hình
- **Module**: `src/engine/city3d/settingStyle.js` (cột `side`) ↔ `src/engine/city3d/orbit.js`
  (`DEFAULT_YAW`) · đo bằng `scripts/water-view.mjs`
- **Priority**: **High** · **Severity**: High (nó vô hiệu hoá phần thưởng chính của cả VIỆC 2)
- **Impact**: Đàm mở màn Thành Phố ở kỷ 14 — kỷ *đảo quốc Singapore* — và **không nhìn thấy biển**.
  Toàn bộ hình học biển vẫn được dựng, vẫn tốn +1 lệnh vẽ, vẫn tốn 16.128 tam giác; nó chỉ nằm
  ngoài khung hình. Đây chính xác là cổng không-đo-được-bằng-test mà Đàm đặt ra (*"phải đọc ra là
  thành phố cảng, không phải thành phố cạnh một vũng xanh"*) — và nó **TRƯỢT**.
- **Root Cause**: `DEFAULT_YAW = π/4` đặt camera ở góc **ĐÔNG-NAM** rồi nhìn về gốc toạ độ, tức
  nhìn về hướng **tây-bắc**. Nên bờ `nam` và bờ `dong` nằm **SAU LƯNG** camera, còn bờ `bac`/`tay`
  thì nằm trọn trong khung. Kỷ 14 khai `side: 'nam'` — và khai ĐÚNG (Marina Bay thật sự nhìn nam ra
  eo Malacca). Hai quyết định đều đúng một mình, và **chúng chưa bao giờ được đặt cạnh nhau**.
  ⚠️ Đây là **cùng một hình dạng sai với `TECH_DEBT #38`/Phase 7D**: một lời hứa nói về QUAN HỆ
  (*"nước phải NHÌN THẤY ĐƯỢC"*) được cài đặt bằng hai HẰNG SỐ ở hai file không tham chiếu nhau.
- **Current Risk**: đã hiện thực, không phải rủi ro tiềm tàng — đo được ở HAI kỷ đã dựng hình.
- **Future Risk**: Bước C trải nốt 12 kỷ ⇒ **8/14 kỷ có nước rơi vào phía khuất** (`nam`: 6, 7, 8,
  14 · `dong`: 2, 5, 12, 13). Làm xong Bước C mà không chốt mục này là **tiêu ngân sách cho một
  thứ hơn nửa số kỷ sẽ không nhìn thấy** — đúng bài học §2-C (*đo TRẦN trước khi tiêu*), chỉ khác
  là lần này trần đã đo xong TRƯỚC, nên không còn cớ.
- **SỐ ĐO** (`node --import ./scripts/register-esm-loader.mjs scripts/water-view.mjs --eras 12,14,1`,
  2026-08-19; bắn tia qua đúng camera app dùng, không đếm màu):

  | kỷ | loại nước | bờ | mặc định 45° | trần (đứng đối diện) | gấp |
  |---|---|---|---:|---:|---:|
  | 14 | sea | nam | **0,09%** | **31,43%** | **345,7×** |
  | 12 | river | dong | 2,30% | 9,16% | 4,0× |
  | 1 | none | none | 0,00% | 0,00% | — |

  ⚠️ Sông đỡ hơn biển rất nhiều (4,0× so với 345,7×) vì một dòng sông **cắt ngang cả cảnh** nên
  luôn còn một khúc trong khung, còn biển là một **nửa mặt phẳng** nằm trọn về một phía.
- **Recommended Solution**: **KHÔNG tự chọn — Đàm quyết** (đụng `camera` hoặc đụng bảng đã duyệt,
  cả hai đều nằm trong 6 ca phải dừng hỏi). Bốn hướng, kèm giá đã cân:
  - **(a) Xoay `DEFAULT_YAW` thêm 180°** (45° → 225°). Rẻ nhất về mã (một số), đắt nhất về hệ quả:
    **mọi kỷ đổi khung hình**, nên toàn bộ mốc `sweep-score`, mọi kết luận mỹ thuật đã duyệt, và
    `PERFORMANCE.md` đều phải đo lại. Và nó chỉ đổi chỗ vấn đề: `bac`/`tay` (6 kỷ) sẽ thành phía khuất.
  - **(b) Camera xoay THEO bờ nước của kỷ** (`yaw` suy từ `side`). Giải đúng gốc — mọi kỷ đều nhìn
    ra nước. Giá: chuyển kỷ thì góc nhìn nhảy, và `cityFocus`/`sceneStats` phải kiểm lại.
  - **(c) Sửa cột `side`** cho các kỷ vào phía khuất. **Không nên**: nó mua một con số đẹp bằng cách
    nói dối địa lý — đúng thứ ADR-025 đã cấm với mặt đường.
  - **(d) Chấp nhận**: nước là phần thưởng khi Đàm TỰ xoay camera (app cho kéo). Giá bằng 0 về mã,
    nhưng ảnh mặc định — thứ Đàm nhìn thấy hằng ngày — vẫn không có biển.
- **Estimated Complexity**: (a) rất thấp về mã / rất cao về nghiệm thu lại · (b) trung bình ·
  (c) thấp · (d) 0
- **Blocking Conditions**: **Bước C không nên bắt đầu trước khi mục này được chốt** — trải 12 kỷ
  rồi mới đổi góc nhìn là phải nghiệm thu lại toàn bộ hai lần.
- **Review Trigger**: ngay khi Đàm trả lời cổng "thành phố cảng"
- **Owner**: Đàm đã chốt 2026-08-20 · **Status**: ✅ **ĐÃ ĐÓNG**

### ĐÃ SỬA THẾ NÀO — Đàm bác cả bốn hướng trên và ra hướng thứ NĂM

⚠️ **Bài học đáng giá nhất của mục này nằm ở chỗ cả bốn hướng tôi đề xuất đều SAI CHỖ.** Đàm:
*"KHÔNG SỬA CAMERA, KHÔNG SỬA `side`. SỬA THỨ THỨ BA."* Câu hỏi đúng không phải *"nên xoay camera
hay sửa bảng"* mà là ***"vì sao một dữ kiện QUAN TRỌNG của cảnh lại nằm ở một hướng mà KHÔNG CƠ CHẾ
NÀO chịu trách nhiệm?"*** — `side` đúng (sự thật lịch sử), `DEFAULT_YAW` đúng (hằng số mỹ thuật),
thứ sai là **quan hệ giữa chúng không ai sở hữu**. Bốn hướng (a)–(d) đều là *"hy sinh một trong hai
vế"*; hướng thứ năm là **cho cái quan hệ ấy một cái tên**: trường `worldYaw` (ADR-041) xoay ĐỊA THẾ
(nước + địa hình + vùng quê + rặng núi) chứ không xoay camera và không xoay lưới 12×12.

**Số đo sau khi sửa** (cùng lệnh, cùng công cụ, 2026-08-20):

| kỷ | bờ (`side`, GIỮ NGUYÊN) | `worldYaw` | mặc định TRƯỚC | mặc định SAU | trần |
|---|---|---:|---:|---:|---:|
| 14 | `nam` | +90° | 0,09% | **23,75%** | 31,43% |
| 12 | `dong` | +90° | 2,30% | **9,32%** | 8,97% |
| 1 | `none` | 0° | 0,00% | 0,00% | 0,00% |

⚠️ Kỷ 12 SAU (9,32%) **cao hơn cả trần cũ** (8,97%) — không phải lỗi làm tròn: trần đo bằng cách
đứng ĐỐI DIỆN bờ, mà với một dải sông thì góc chính diện KHÔNG phải góc tối ưu (nhìn xiên thì khúc
sông trải dài hơn trong khung). Đã đo lại cả 14 kỷ × 24 góc, xem `PERFORMANCE.md`.

**Cái canh cho nó không bị mất**: `scripts/waterView.test.js` khoá `macDinh >= 0.05` cho mọi kỷ
trong `ERAS_WITH_WATER_GEOMETRY`, kèm đối chứng trần. Đây là cách mục nợ này được đóng tử tế thay
vì nằm mãi ở Open — và bài kiểm cũ (`KHUYẾT TẬT VẪN CÒN NGUYÊN`) **đã reo đúng như thiết kế** khi
mã hết bệnh, một bằng chứng thực nghiệm cho luật *"một con số trong bài test là cái hẹn giờ duy
nhất chạy được"*.

---

## #56 — ✅ ĐÃ ĐÓNG (2026-08-20, Bước C) — 12/14 kỷ có nước trong bảng nhưng chưa được dựng hình (dở dang CÓ CHỦ Ý, và nó đếm được)

- **Tên**: `settingStyle.js` khai 14 kỷ có nước; `ERAS_WITH_WATER_GEOMETRY` mới dựng 2 (12 và 14)
- **Module**: `src/engine/city3d/setting.js` · `settingStyle.js` · `drawCallBudget.test.js`
- **Priority**: Medium · **Severity**: Low (không hỏng gì; chỉ là 12 kỷ chưa nhận phần thưởng)
- **Impact**: mười hai kỷ vẫn hiện đúng như trước Bước B — không nước, không lỗi, không hồi quy.
  Cái mất là **bản sắc địa lý** mà bảng đã hứa: kỷ 3 (Ur bên Euphrates), kỷ 9 (Paris bên Seine),
  kỷ 13 (vịnh Tokyo)… hôm nay vẫn là những thành phố giữa đồng.
- **Root Cause**: **KHÔNG PHẢI một thiếu sót — là lệnh của Đàm.** Chỉ thị Bước B ghi rõ: *"DỰNG
  HÌNH, ĐÚNG 3 KỶ… Đừng trải 12 kỷ còn lại"*, và kèm một cổng không đo được bằng test (*"kỷ có
  biển phải đọc ra là 'thành phố cảng', không phải 'thành phố cạnh một vũng xanh'"*). Trải 12 kỷ
  trước khi Đàm nhìn ảnh là trải một hướng mỹ thuật chưa được duyệt ra mười hai chỗ.
- **Current Risk**: gần như không. Trạng thái dở dang này **ĐẾM ĐƯỢC trong `npm test`**:
  `assert.deepEqual(ERAS_WITH_WATER_GEOMETRY, [12, 14])` + `soKyKho === 13` +
  `assert.equal(soKyTang, 2)` ở `drawCallBudget.test.js`. Đúng bài học Phase 10 (`door: 'legacy'`):
  *"một mục nợ trong tài liệu chỉ được đọc khi có người đi tìm; một con số trong bài test thì tự
  đòi được đọc."* Ba con số ấy — chứ không phải mục này — là thứ buộc phiên sau phải mở lại.
- **Future Risk**: nếu để lâu, `hasWater` (BẢNG khai) và `waterIsBuilt` (HÌNH đã dựng) sẽ bắt đầu
  bị dùng lẫn lộn. Hai cái tên đã cố tình tách nhau vì lý do đó, nhưng tên chỉ nhắc chứ không chặn.
- **Recommended Solution**: sau khi Đàm gật hướng mỹ thuật → trải nốt, **đo lại mốc lệnh vẽ của
  TỪNG kỷ** (không cộng đều: một kỷ có thể vốn đã dùng họ vật liệu ấy). Chú ý riêng **kỷ 5**
  (`meander` — khúc uốn ôm ba mặt): đó là kiểu nước DUY NHẤT chưa ai nhìn bằng mắt, và
  `MEANDER_NECK = 1,6` hôm nay là một suy luận, không phải một quyết định đã nghiệm thu.
- **Estimated Complexity**: Thấp về mã (một dòng danh sách), Trung bình về nghiệm thu (12 ảnh +
  12 mốc lệnh vẽ + một vòng quét không-trôi).

### ✅ ĐÃ ĐÓNG THẾ NÀO (2026-08-20, Bước C)

Đàm duyệt ảnh Bước B (*"DUYỆT ẢNH — ĐẠT"*) ⇒ trải nốt. `ERAS_WITH_WATER_GEOMETRY` nay là đủ 14 kỷ,
và **lời hứa đổi hình dạng**: từ một danh sách đếm một trạng thái DỞ DANG thành một **QUAN HỆ** —
*mọi kỷ bảng khai có nước thì phải dựng ra nước*, kiểm ở cả 15 kỷ bằng `hasWater(era) === waterIsBuilt(era)`.

⚠️ **`hasWater` và `waterIsBuilt` VẪN LÀ HAI CÁI TÊN, kể cả bây giờ khi hai tập hợp đã trùng nhau.**
Việc chúng trùng là một **sự thật của hôm nay**, không phải một định nghĩa. Gộp chúng lại là xoá
mất chỗ để ghi *"kỷ này khai có nước mà chưa dựng"* — thứ sẽ cần lại ngay lần tới có ai thêm một kỷ.

**Số đo nghiệm thu (đo ngày 2026-08-20, lệnh ghi ngay dưới mỗi bảng):**

| hạng mục | trước Bước C | sau Bước C |
|---|---|---|
| kỷ đã dựng nước | 2 (12, 14) | **14** |
| kỷ khô | 13 | **1** (kỷ 1 — nhân chứng của luật *"nước không tính tiền lên kỷ không có nước"*) |
| kỷ đạt cổng 5% | 2/2 | **11/14** (ba kỷ hẹp nằm trong bảng `TRUOT`, xem `#59`) |
| lệnh vẽ | mốc riêng từng kỷ | **mỗi kỷ có nước đúng +1**, kỷ 1 không đổi |

⚠️ **Kỷ 5 (`meander`) đã được nhìn bằng mắt** như mục này yêu cầu: hai nhánh nước ôm lấy một sống
đất, thành phố đứng trên sống — đúng hình khúc uốn. `MEANDER_NECK = 1,6` thôi là một suy luận.
- **Owner**: đã xong · **Status**: **✅ Closed (2026-08-20)**

---

## #46 — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-035) — Chế độ cận cảnh ở những kỷ CAO ngả thành nhìn-từ-trên-xuống: kỷ 15 ngẩng 65,3°, tầng trệt gần như biến mất

- **Module**: `src/engine/city3d/cityFocus.js` (thứ tự chữa trong `planCityFocus`)
- **Priority**: Medium · **Severity**: Low
- **Impact**: chế độ cận cảnh sinh ra để Đàm NHÌN THẤY công sức của Phase 10 (tầng trệt: cửa ra
  vào, cửa lùa, bức bàn) và Phase 11 (mái). Ở những kỷ thấp nó làm được cả hai. Ở kỷ 15 (Dubai —
  thành phố cao nhất) lưới an toàn phải ngẩng camera lên **65,3°**, và ở góc ấy màn hình gần như
  chỉ còn MÁI: tường bị chính mái che, nên đúng nửa số chi tiết mới không tới được mắt. Ảnh nghiệm
  thu `.city-preview/city-era15-light-h12-focus1.png` cho thấy rõ.
- **Root Cause**: `planCityFocus` chữa va chạm theo thứ tự **ngẩng trước → lùi sau**, chọn vì
  "ngẩng giữ nguyên độ lớn của vật, lùi thì làm vật nhỏ đi". Lý lẽ ấy đúng về mặt số điểm ảnh và
  **bỏ sót một chiều khác**: ngẩng quá cao thì vật vẫn to nhưng ta không còn nhìn thấy MẶT ĐỨNG
  của nó nữa. Đo 1200 chuyến bay: 0 chuyến phải lùi, tức thứ tự này khiến cách chữa thứ hai **chưa
  bao giờ được dùng** — cái giá dồn hết vào góc nhìn.
- **Current Risk**: thấp — không sai chức năng, camera vẫn thoáng (1,06 ô ở kỷ 15, trên mức tối
  thiểu 1 ô), và 14/15 kỷ có góc dễ nhìn (34,4°–45°).
- **Future Risk**: trung bình. Kỷ mới cao hơn nữa sẽ đẩy góc lên sát trần `MAX_PITCH` (85,4°) —
  lúc đó cận cảnh thành ảnh chụp từ trực thăng, và **không có gì đỏ lên** vì mọi bài test hiện có
  chỉ đòi "thoáng", không đòi "còn nhìn thấy mặt đứng".
- **Recommended Solution**: một trong hai, **Đàm chọn** (đây là quyết định MỸ THUẬT, không phải kỹ
  thuật): (a) **đổi thứ tự** — lùi ra trước, ngẩng sau; vật nhỏ đi nhưng giữ được góc nhìn ngang,
  và ngân sách lùi có sẵn vì chưa dùng bao giờ. (b) **đặt trần góc ngẩng riêng cho chế độ cận
  cảnh** (ví dụ 50°), vượt trần thì chuyển sang lùi. Cách nào cũng phải đo lại đủ 1200 chuyến +
  chụp lại ảnh kỷ 15.
- **Estimated Complexity**: Thấp (một khối trong `planCityFocus` + đo lại).
- **Blocking Conditions**: cần Đàm chọn hướng — xem ảnh kỷ 15 rồi quyết "thà nhỏ hơn mà thấy mặt
  tiền" hay "thà to mà nhìn từ trên xuống".
- **Review Trigger**: khi thêm kỷ mới cao hơn kỷ 15, hoặc khi Đàm nói cận cảnh ở kỷ cao khó nhìn.
- **Owner**: đã xong · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-18** — Đàm chọn **(a) đổi thứ tự**, xem
  ADR-035.

### Đã đóng thế nào, và cái giá thật là bao nhiêu

`planCityFocus` nay chữa theo thứ tự **lùi ra (giữ nguyên góc) → ngẩng lên → đứng yên**.

| Đo lại sau khi đổi | Trước (ngẩng trước) | Sau (lùi trước) |
|---|--:|--:|
| góc ngẩng kỷ 15, ca thật của app | 65,3° | **34,4°** |
| số chuyến phải NGẨNG (75 chuyến ca thật) | 8 | **0** |
| số chuyến phải NGẨNG (1200 chuyến, 4 góc xuất phát) | 109 | **0** |
| số chuyến bị kẹt cứng | 0 | **0** |
| chỗ phải lùi xa nhất | — | 11,00 (kỷ 15) |
| tỉ lệ thu phóng tệ nhất | — | 0,664 (kỷ 11) |

⚠️ **Giá phải trả, nói thẳng**: 3 kỷ (11 · 14 · 15) nay có ca xấu nhất nằm **ngoài dải thu phóng
0,38–0,58** mà Đàm chốt ở ADR-034 — lần lượt 0,664 · 0,623 · 0,579. Dải ấy là một lời hứa về
*"công trình chiếm bao nhiêu khung hình"*, và ở ca phải lùi thì nó không giữ được. Đổi lại, lời hứa
*"còn nhìn thấy mặt đứng"* thì giữ được ở **15/15 kỷ**.

⚠️ **Và điều quan trọng nhất, đo bằng đối chứng chứ không suy luận**: việc lùi ra **KHÔNG làm mất
chi tiết**. Đo cùng một kỷ ở khoảng cách lý tưởng 7,5 rồi ở ca xấu nhất của nó, lệch trung bình cả
khung thay đổi trong khoảng **−0,72 … +2,14** — có kỷ còn TĂNG, vì lùi ra thì lọt vào khung nhiều
nhà hơn. **Không một kỷ nào tụt qua ngưỡng mắt vì lùi ra.** Đây chính là điều kiện Đàm đặt ra
(*"nếu một kỷ nào tụt xuống dưới 12 thì DỪNG và báo"*): số kỷ TỤT vì bản vá này là **0**.
⚠️ Nhưng phép đo ấy lôi ra một sự thật KHÁC và lớn hơn, không liên quan gì tới thứ tự chữa — xem
**#48**.

---

## #44 — ✅ ĐÃ ĐÓNG (2026-08-18) — KHÔNG PHẢI NỢ, LÀ LỰA CHỌN: kỷ 4 là kinh thành trên đồng bằng

- **Module**: `src/engine/city3d/terrain.js` (bảng `ERA_TERRAIN`) ↔ `src/engine/city3d/terrain.test.js`
- **Priority**: Low · **Severity**: Low
- **Impact**: bài `kỷ khai TỪ 3 BẬC TRỞ LÊN thì không bậc nào được chiếm quá 60% số ô` là thứ canh
  bài học Phase 7B (*phân bố một trường nhiễu trên lưới nhỏ không tuân luật số lớn*). Kỷ 4 hiện ở
  **64%** — tức trường nhiễu của kỷ ấy vẫn dồn cục, và người chơi thấy một mảng phẳng chiếm gần hai
  phần ba thành phố thay vì ba thềm rõ rệt.
- **Root Cause**: ⚠️ **đây KHÔNG phải hồi quy do việc san đường.** Đo lại trên cây git ở `be261ef`
  (trước khi san) thì kỷ 4 **đã là 64%**. Bài test cũ xanh chỉ vì nó đếm **cả ô đường**: 80 ô đường
  trên 144 ô (56% lưới) nằm rải đều mọi bậc, nên chúng pha loãng phép đếm xuống dưới 60%. Sau khi
  tách ô đất ra đo riêng — việc bắt buộc, vì ô đường nay không còn là bội số của bậc thềm — con số
  thật lộ ra. Đúng hình dạng `TECH_DEBT #22`: **trung bình trên vùng quá rộng làm loãng tín hiệu.**
- **Current Risk**: thấp. Một kỷ hơi phẳng là chuyện mỹ thuật, không phải lỗi chạy; và 14/15 kỷ còn
  lại vẫn đạt.
- **Future Risk**: trung bình nếu bị bỏ quên — cách rẻ nhất để "sửa" là nới ngưỡng 60% lên 65%, và
  lúc ấy phép đo mất răng cho **cả 15 kỷ**. Đã chặn bằng cách ghi ngoại lệ ra **tường minh đếm
  được**: `assert.deepEqual(TRUOT, [4])` — kỷ thứ hai trượt thì đỏ ngay, mà kỷ 4 được sửa xong cũng
  đỏ (buộc phải xoá tên khỏi danh sách).
- **Recommended Solution**: chỉnh `noiseScale`/`shape` của riêng kỷ 4 rồi đo lại bằng chính bài test
  ấy; hoặc hạ `terraces` của kỷ 4 từ 3 xuống 2 nếu bảng chấp nhận (lúc đó bài test không áp cho nó
  nữa — nhưng phải hỏi *"kỷ này ĐÁNG có mấy thềm?"* trước, đừng hạ chỉ để hết đỏ).
- **Estimated Complexity**: Thấp (một dòng bảng + đo lại 15 kỷ).
- **Blocking Conditions**: không có.
- **Review Trigger**: khi `TRUOT` khác `[4]`, hoặc khi có phase chỉnh bảng `ERA_TERRAIN`.
- **Owner**: Đàm quyết 2026-08-18 · **Status**: ✅ **ĐÃ ĐÓNG — phân loại lại, không phải sửa**

### Vì sao đóng mà không sửa gì (ADR-032 bổ sung (b))

Đàm đặt đúng câu hỏi mà mục này chưa từng hỏi: ***"đây là thứ mình MẮC hay thứ mình CHỌN?"*** —
*"Nợ là thứ mình MẮC; cái này có thể là thứ mình CHỌN. Phân biệt hai cái đó, đừng để sổ nợ phình
bằng những lựa chọn có chủ ý."* Đi kiểm ý định trước khi đi sửa, và ba bằng chứng đều nói CHỌN:

1. **Bảng khai đúng như vậy.** `ERA_TERRAIN[4]` = `{ shape: 'valley', terraces: 3, relief: 0.60 }`
   kèm `note` nguyên văn *"kinh thành Trung Hoa trên ĐỒNG BẰNG, đồi thấp vây bốn phía"*. Trường An
   và Lạc Dương nằm trên bình nguyên Quan Trung / bồn địa Lạc Dương — đồng bằng có đồi thấp vây
   quanh. Một dải phẳng chiếm phần lớn mặt đất **chính là** câu ấy dịch sang hình học.
2. **Không mất bậc nào** — đây là dấu hiệu phân biệt quyết định. Kỷ 4 khai 3 bậc và **dùng đủ 3**:
   20% ở đáy lòng chảo · 64% ở dải đồng bằng · 16% ở vành đồi. Một trường nhiễu *sập* (bẫy Phase
   7B) thì mất bậc, hoặc dồn về một ĐẦU; ở đây dải đông nhất nằm ở **GIỮA**, có đất thấp hơn bên
   dưới và vành cao hơn bên trên. Đó là mặt cắt của một lòng chảo, không phải của một mặt phẳng.
3. **Kỷ 9 khai cùng một thứ và chỉ cách 6 điểm.** Kỷ 9 (`valley`, 3 bậc, *"lòng chảo sông Seine,
   gần phẳng"*) đo ra **58%** — cùng hình dạng phân bố, chỉ tình cờ nằm dưới vạch. Vạch 60% đang
   cắt ngang giữa hai kỷ mô tả **cùng một loại địa hình**, nên nó không phân biệt được "đồng bằng
   có chủ ý" với "địa hình sập".

**Không sửa một dòng mã nào.** Bài test giữ nguyên `assert.deepEqual(TRUOT, [4])` — vẫn là hàng
rào, chỉ đổi vai: từ *"một khuyết tật chờ sửa"* thành *"một ngoại lệ đã khai, đếm được"*, đỏ theo
cả hai chiều (kỷ thứ hai tụt xuống ⇒ đỏ; kỷ 4 hoá gồ ghề ⇒ cũng đỏ). Chú thích của bài test đã
viết lại cho khớp — **một lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào**.

⚠️ **Ghi kèm cho trung thực**: ngưỡng 60% là một con số **CHỌN TAY** (bản đầu 70% cho cả 15 kỷ, hạ
xuống sau khi nó đòi bịa ra đồi ở Lưỡng Hà và thảo nguyên Nga), không phải con số đo được, và kỷ 9
chỉ đứng cách vạch 2 điểm. Thứ thật sự canh *"địa hình có sập không"* là bài **"MỌI KỶ PHẢI DÙNG ĐỦ
SỐ BẬC MÌNH KHAI"** — nó hỏi thẳng vào khuyết tật thay vì hỏi qua một tỉ lệ. Theo chỉ đạo của Đàm,
**KHÔNG thêm một ngưỡng thứ hai** bên cạnh nó (một ngưỡng chưa hiệu chuẩn đặt cạnh một ngưỡng có
gốc là đúng cái phễu Phase 9A).

---

## #43 — ✅ **ĐÃ ĐÓNG (2026-09-05)** — Số tam giác không có gì canh, và nó ĐÃ trôi ở 6/15 kỷ

- **Module**: `PERFORMANCE.md` (bảng số) ↔ `src/engine/city3d/*` + `src/components/city/render3d/*`
  (nguồn sinh ra số)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: `PERFORMANCE.md` là nơi DUY NHẤT trả lời *"thêm thứ này vào cảnh có nặng không?"*, và
  mọi quyết định "còn dư sức, thêm chi tiết đi" đều dựa vào nó. Đo lại đủ 15 kỷ ngày 2026-08-18 thì
  **6/15 kỷ sai**: kỷ 8 lệch −3.560 tam giác, kỷ 11 +3.776, kỷ 12 +4.160, kỷ 13 +3.776, kỷ 14
  +2.624, kỷ 15 +3.584; tổng lệch **+14.360**. Nguyên nhân: `e95cdf1` (Phase 11-B) sửa
  `roofStyle.js` — hình học thật — và không đụng `PERFORMANCE.md`.
- **Root Cause**: **cột lệnh vẽ có một bài test canh (`drawCallBudget.test.js`, bảng 15 mốc), cột
  tam giác thì không có gì cả.** Chỗ có test không trôi, chỗ không có test trôi — ngay trong cùng
  một bảng, cùng một phase. Đây đúng bài học đã ghi ở `CLAUDE.md`: *"một bài học được ghi ra KHÔNG
  chặn được gì; chỉ một bài TEST mới chặn được"*. Definition of Done có ghi "tài liệu đã đồng bộ",
  nhưng nó là một câu chữ, và một câu chữ thì không đỏ lên được.
- **Current Risk**: trung bình. Không hỏng gì lúc chạy, nhưng một con số ngân sách sai theo hướng
  **trấn an** (bảng ghi kỷ 11 = 50.114 trong khi thật là 53.890) là loại sai tệ nhất cho một đồng
  hồ đo — cùng hình dạng với vụ HUD thiếu 56% tam giác ngày 2026-08-17.
- **Future Risk**: trung bình-cao và TĂNG DẦN. Mỗi phase mới lại thêm một bảng "trước → sau"; càng
  nhiều bảng thì xác suất một bảng nào đó mô tả một commit đã chết càng cao, và không có cách nào
  phát hiện ngoài việc đo lại tay đủ 15 kỷ (≈15 phút Chromium mỗi lượt).
- **Recommended Solution**: ba hướng, chưa chọn.
  (1) **Một bài test THUẦN cho tam giác**, giống hệt cách `drawCallBudget.test.js` đã làm cho lệnh
  vẽ: hiện `countSceneTriangles` cần `three`, nhưng `collectCitySpecs` + `countTriangles` (`parts.js`)
  thì THUẦN. Cần thêm phần mặt đất/đường/vòm trời/rặng núi mới ra được số tổng — tức phải tìm một
  công thức thuần cho chúng, đúng kiểu `lệnh vẽ = họ vật liệu + 4` đã tìm được ở ADR-028.
  (2) **Bảng 15 mốc tam giác riêng từng kỷ** (không phải một trần chung — bẫy `TECH_DEBT #38`), đặt
  cạnh `MOC_LENH_VE`, có dung sai; rẻ hơn (1) nhưng vẫn cần (1) để tính được số.
  (3) **Chấp nhận + đổi cách viết tài liệu**: mọi bảng ghi rõ HAI commit nó so, và mỗi phase bắt
  buộc tự đo mốc nền (đã làm ở Phase 12 + đã thêm luật vào mục "Khi nào phải đo lại"). Rẻ nhất,
  nhưng vẫn là một câu chữ, tức vẫn không đỏ lên được.
- **Estimated Complexity**: (3) đã xong · (2) thấp một khi có (1) · (1) trung bình — chỗ khó là
  mặt đất/đường/chân trời, vì số ô con của chúng phụ thuộc `pavingSubdivision` và lưới địa hình.
- **Blocking Conditions**: không có blocker kỹ thuật. Nằm ngoài phạm vi Việc 1 (chỉ nhận hai nguyên
  nhân "đường lởm chởm") ⇒ ghi lại thay vì mở rộng phạm vi.
- **Review Trigger**: ngay trước phase kế tiếp có đụng hình học; hoặc khi có ai định trích một con
  số tam giác từ `PERFORMANCE.md` mà không tự đo lại.
- **Owner**: phiên 2026-09-05 · **Status**: ✅ **ĐÃ ĐÓNG** — làm hướng **(1) + (2)**.

### Đã đóng thế nào

`src/engine/city3d/triangleBudget.test.js` — **bảng 15 mốc riêng từng kỷ**, đúng khuôn
`drawCallBudget.test.js`, chạy trong `npm test` **dưới 1 giây**, không cần Chromium và không cần
`three`.

Chỗ khó mà mục nợ nêu (*"mặt đất/đường/chân trời, vì số ô con của chúng phụ thuộc
`pavingSubdivision` và lưới địa hình"*) hoá ra **không phải chỗ cần giải**: thứ đã TRÔI là khối
`city` (`e95cdf1` sửa `roofStyle.js`), còn mặt đất/đường/vòm trời/rặng núi là nền **cố định** —
gộp chúng vào chỉ pha loãng tín hiệu, đúng `TECH_DEBT #22`. Nên bảng canh đúng khối `city`, và
`collectCitySpecs` + `countTriangles` + `plinthParts` cộng lại là **đúng** nội dung khối ấy, không
phải một thứ đại diện cho nó.

**Neo vào một đường đo độc lập** (nếu không thì nó chỉ là một công thức tự soi gương — đúng bẫy
`drawCallBudget` đã sập 2026-08-23): `scene-tri.mjs --era N --sessions 40 --level 1` ở bốn kỷ
**1 · 6 · 8 · 15** ra **100.876 · 198.388 · 124.348 · 108.660**, khớp TỪNG ĐƠN VỊ.

**Phép thử ngược**: sửa MỘT dòng `crown` trong `roofStyle.js` — đúng loại thay đổi mà `e95cdf1` đã
làm — thì bảng ĐỎ ngay. Tức cổng này bắt được chính ca lịch sử đã sinh ra mục nợ.

### Ba thứ tìm thấy trong lúc đóng

1. ⚠️ **Chú thích ở `sceneGraph.js` ghi bệ kè *"chỉ tốn 12 tam giác"* — sai từ Phase 8B.** Phase ấy
   làm bề rộng vát phụ thuộc KÍCH THƯỚC khối, nên bệ đủ lớn có vát ⇒ **28**. Chính phép đối chiếu
   chéo lộ ra: hiệu số giữa phép đếm thuần và phép duyệt cảnh đúng bằng `số bệ × 28` (kỷ 6: 4 bệ ⇒
   +112 · kỷ 8: 1 bệ ⇒ +28).
2. ⚠️ **VÀ ĐỪNG ĐỌC NGƯỢC LẠI THÀNH "12 ĐÃ CHẾT"** — bản vá tôi suýt ship. Đếm đủ 27 bệ: **26 ăn
   28, ĐÚNG MỘT ăn 12** (mỏng tới mức `bevelWidth` trả 0, vì nó lấy `min(w,d,h)` mà cái mỏng ấy
   mỏng theo `h`). Ngoại lệ nay được đếm tường minh, không bị làm tròn.
3. ⚠️ **Luật bệ kè có BA bản chép tay** (`sceneGraph.js` dựng · `plinth-tri.mjs` đo · bài test
   canh). Đã gom về hai hàm THUẦN ở `parts.js` (`buildingSpanCells`, `plinthParts`) — hình học
   trùng từng đơn vị sau khi gom (kỷ 6 vẫn 198.388).

### Hai cái bẫy trong chính bài test này, cả hai do phép thử ngược bắt

- Bài "tổng bệ khớp hiệu số" bản đầu viết `khongBe = tổng − soBe×28` rồi assert
  `tổng === khongBe + soBe×28` — một hằng đẳng thức `x === x`, **không thể đỏ** (cùng bẫy ADR-048).
  Nay nó đếm TỪNG bệ và đòi đúng phân bố `{12: 1, 28: 26}`.
- Phép phá đầu tiên (nới `w`/`d` của bệ) **không nổ**, và **phép phá mới là thứ sai**: `bevelWidth`
  lấy `min(w, d, h)`, mà cái bệ mỏng là mỏng theo `h`. Phá đúng (`h × 3`) thì đỏ 2 bài.

### Còn lại có chủ đích

Các BẢNG SỐ trong `PERFORMANCE.md` **chưa đo lại** — phiên này không được đụng file ấy. Nhưng nguyên
nhân gốc của mục nợ (*"không có gì canh"*) đã hết: từ nay một dòng trôi sẽ ĐỎ ở `npm test`, chứ
không đợi ai đó tình cờ đo lại.

---

## #42 — ✅ ĐÃ ĐÓNG (2026-08-18, ADR-033) — Vỉa hè bị bóp trong im lặng trên ĐẠI LỘ ở 8/15 kỷ, kỷ tệ nhất chỉ còn 11% bề rộng đã khai

- **Module**: `src/engine/city3d/streetStyle.js` (`streetCrossSection`)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: `walk` là **một trong 8 trục bản sắc** của bảng mặt đường (ADR-025), nhưng trên đại lộ
  nó bị cái kẹp `walk ≤ 0,5 − half` nuốt gần hết ở hơn nửa số kỷ. Đo ngày 2026-08-18 (sau khi đã
  đặt `MAX_AVENUE = 0,96`):

  | kỷ | khai | dựng ra trên đại lộ | còn lại | trên ngõ |
  |---|--:|--:|--:|--:|
  | 12 (Nga) | 0,190 | 0,020 | **11%** | 100% |
  | 15 (UAE) | 0,180 | 0,020 | **11%** | 100% |
  | 9 (Pháp) | 0,170 | 0,030 | **18%** | 100% |
  | 14 (Singapore) | 0,200 | 0,050 | **25%** | 100% |
  | 11 (Mỹ) | 0,140 | 0,040 | **29%** | 100% |
  | 10 (Anh) | 0,150 | 0,110 | 73% | 100% |
  | 13 (Nhật) | 0,160 | 0,140 | 88% | 100% |
  | 4 (Trung Quốc) | 0,100 | 0,090 | 90% | 100% |

  Kỷ 12 khai `walk: 0,19` và `note` của nó viết nguyên chữ *"vỉa hè mênh mông"* — con số và lời
  giải thích cùng bị bóp còn một phần chín, **không có gì đỏ lên**. Đúng hình dạng bẫy `MIN_STONE`
  (Phase 9D) và bẫy Phase 7D: một giá trị khai ra rồi bị một cái kẹp ở nơi khác nuốt mất.
- **Root Cause**: vỉa hè bị buộc phải nằm **trong đúng một ô lưới** cùng với lòng đường, nên tổng
  `half + walk ≤ 0,5` là một ràng buộc cứng. Đại lộ càng rộng thì chỗ còn lại càng ít, và ở những
  kỷ hiện đại (đại lộ rộng **và** vỉa hè rộng — đúng đặc điểm lịch sử của chúng) hai vế chọi nhau
  trực diện. Ngoài đời, đại lộ Haussmann rộng *và* có vỉa hè rộng vì cả mặt cắt phố rộng ra; ở đây
  mặt cắt bị khoá cứng bằng một ô.
- **Current Risk**: thấp về kỹ thuật (không hỏng gì, không lệnh vẽ mới), trung bình về giá trị: một
  trục bản sắc đang chỉ sống ở các **ngõ**, còn ở đại lộ — chỗ mắt nhìn nhiều nhất — thì gần như
  không phát biểu được. Bài `15 KỶ RA 15 MẶT ĐƯỜNG` vẫn xanh vì nó đọc **bảng khai**, không đọc
  thứ dựng ra ⇒ hiện KHÔNG có gì canh chỗ này.
- **Future Risk**: trung bình. Thêm một kỷ mới khai đại lộ rộng + vỉa hè rộng sẽ lặng lẽ rơi vào
  cùng cái kẹp, và người thêm sẽ tưởng mình vừa khai một đặc điểm mới.
- **Recommended Solution**: ba hướng, chưa chọn.
  (1) **Cho vỉa hè lấn sang ô ĐẤT bên cạnh** khi ô ấy không phải công trình — đúng như ngoài đời
  (vỉa hè thuộc lộ giới, không thuộc lòng đường). Đắt nhất: phải biết ô bên cạnh là gì, tức lại là
  một phép hỏi hàng xóm như `carriagewayShape`.
  (2) **Từ chối thẳng ở `isValidStreetStyle`**: `avenue/2 + walk ≤ 0,5`, buộc bảng khai ra thứ dựng
  được. Rẻ nhất, trung thực nhất, nhưng ép 8 kỷ phải hạ một trong hai con số — tức đổi bản sắc.
  (3) **Chấp nhận + ghi thành lời hứa tường minh** ("vỉa hè là đặc điểm của NGÕ, không phải của đại
  lộ") và thêm test khoá điều đó, để nó thôi là một khuyết tật vô danh.
  ⚠️ Cả ba đều đụng bản sắc 15 kỷ ⇒ là **quyết định mỹ thuật**, không tự chọn.
- **Estimated Complexity**: (2) và (3) thấp (một buổi); (1) trung bình — cần dữ liệu ô hàng xóm và
  phải nghĩ lại ai sở hữu phần đất giáp ranh.
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** (mục 5 ca 6 — quyết định mỹ thuật). Nằm ngoài phạm
  vi Việc 1, vốn chỉ nhận hai nguyên nhân "đường lởm chởm".
- **Review Trigger**: khi Đàm trả lời; hoặc ngay khi có ai định thêm/sửa một dòng `walk` trong
  `STREET_STYLES`.
- **Owner**: Đàm quyết 2026-08-18 · **Status**: ✅ **ĐÃ ĐÓNG** — chọn phương án (2) "từ chối thẳng",
  kèm một luật mà cả ba phương án cũ đều thiếu: **nới cho vượt ngưỡng nhìn thấy được, HOẶC khai
  thẳng `walk: 0` — không có gì ở giữa.**

### Đã đóng thế nào (2026-08-18, ADR-033)

Sửa được nhờ nhìn ra một chuyện lớn hơn cái kẹp: **`avenue` đang được VIẾT như thể nó trả lời câu
"đại lộ này oai tới đâu", trong khi mã ĐỌC nó là "bao nhiêu phần mặt cắt dành cho XE".** Ngoài đời
hai câu ấy gần như ngược nhau — Champs-Élysées rộng 70m thì **21m mỗi bên là vỉa hè**, tức hơn 60%
mặt cắt dành cho người đi bộ. Nên khai Paris `0,94` không phải "chật quá không đủ chỗ", mà là **sai
lịch sử**. Sửa bảng, mỗi dòng kèm một mặt cắt có thật:

| kỷ | avenue T→S | walk khai T→S | **dựng ra** T→S | điểm ảnh T→S |
|---|--:|--:|--:|--:|
| 4 Trung Quốc | 0,82 → 0,80 | 0,10 → 0,08 | 0,09 → **0,08** | 5,8 → 5,1 |
| 9 Pháp | 0,94 → **0,54** | 0,17 → 0,22 | 0,03 → **0,22** | 1,9 → **14,1** |
| 10 Anh | 0,78 → 0,78 | 0,15 → 0,10 | 0,11 → **0,10** | 7,0 → 6,4 |
| 11 Mỹ | 0,92 → **0,62** | 0,14 → 0,17 | 0,04 → **0,17** | 2,6 → **10,9** |
| 12 Nga | 0,96 → **0,70** | 0,19 → 0,14 | 0,02 → **0,14** | 1,3 → **9,0** |
| 13 Nhật | 0,72 → 0,72 | 0,16 → 0,12 | 0,14 → **0,12** | 9,0 → 7,7 |
| 14 Singapore | 0,90 → **0,54** | 0,20 → 0,19 | 0,05 → **0,19** | 3,2 → **12,2** |
| 15 UAE | 0,96 → **0,84** | 0,18 → 0,07 | 0,02 → **0,07** | 1,3 → **4,5** |

**Kết quả: 0/15 kỷ bị kẹp** (trước 8/15) · **0/15 kỷ dưới ngưỡng mắt** (trước 5/15). Vỉa hè dựng ra
nay bằng ĐÚNG con số khai ở cả 15 kỷ. Kỷ 15 (UAE) là kỷ hiện đại nhất mà vỉa hè HẸP nhất bảng —
đó là sự thật về Dubai: Sheikh Zayed Road là trục 12+ làn bắc qua bằng cầu bộ hành, còn chỗ đi bộ
tử tế thì nằm ở các promenade riêng (Mohammed Bin Rashid Boulevard, The Walk at JBR) và đều CÓ MÁI
CHE — một thiết bị chống 45°C, khác hẳn cái trottoir Paris làm ra để kê bàn cà phê.

⚠️ **Bài học lớn hơn cái lỗi** — bài test canh trục này đọc **thứ đã KHAI** (`s.walk`) chứ không đọc
**thứ đã DỰNG** (`streetCrossSection().walk`), nên nó xanh suốt nhiều tháng về một con số chưa bao
giờ tới được mắt Đàm. Hai con số hiệu chuẩn (`CELL_PIXELS`, `EYE_PIXELS`) khi ấy chỉ là bản chép tay
nằm trong file test, còn mã sản phẩm không biết chúng tồn tại ⇒ `isValidStreetStyle` **không thể**
canh ngưỡng mắt dù có muốn. Nay cả hai `export` từ `streetStyle.js` và bài test `import` về — một
luật một công thức. Xem `CLAUDE.md`.

⚠️ **Vì sao mục này ra đời trong lúc sửa một việc khác**: đi tìm nguyên nhân "đường lởm chởm" thì
phát hiện `avenue: 1.00` của kỷ 12/15 làm vỉa hè **bằng 0 tuyệt đối**. Phần ấy đã sửa trong ADR-031
(vì nó chặn chính lời hứa "hết bậc"), nhưng nó chỉ kéo hai kỷ ấy từ 0% lên 11% — bệnh gốc thì rộng
hơn và nằm ngoài phạm vi. Ghi lại thay vì mở rộng phạm vi, đúng luật `CLAUDE.md`.

---

## #41 — ✅ ĐÃ ĐÓNG (2026-08-18) — Chi tiết mái KHÔNG sống sót tới thang bản quét: 90/90 ô dưới ngưỡng mắt

- **Module**: `src/engine/city3d/rooftop.js` + `roofStyle.js` (kích cỡ), `scripts/sweep-diff.mjs` (đo)
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Phase 11 thêm **110.076 tam giác (+20,6%)** lên mái, và ở **thang bản quét 15 kỷ ×
  6 chặng thì gần như không thấy gì**: 90/90 ô dưới ngưỡng mắt 12, trung vị **2,2**, ô đổi mạnh
  nhất (kỷ 7 @ 12h) mới 10,6. Đây chính là điều kiện nghiệm thu Đàm đặt ra cho phase — *"nếu hai
  bản quét vẫn khó phân biệt thì phase này CHƯA đạt mục tiêu của nó"* — nên phải ghi là **CHƯA
  ĐẠT**, không phải "đạt có bảo lưu".
- **Root Cause**: hai nguyên nhân độc lập, và cái thứ hai mới là cái sâu. **(a) Kích cỡ**: vật trên
  mái bị kẹp bởi `STACK_W_MAX_RATIO = 0,3` và `STACK_W_MIN = 0,055`, cỡ ấy chọn để không thành "cây
  nấm" khi nhìn gần, nhưng ở thang quét (một thành phố ≈ 300 × 186 điểm ảnh) thì một cái ống khói
  rộng 0,3 lần bề ngang mái chỉ còn **vài điểm ảnh**. **(b) Loại chi tiết**: đo theo từng kỷ thì
  thứ sống sót là thứ phá **ĐƯỜNG VIỀN** mái (`dormer` kỷ 9 = 5,3% ở khung app · `balustrade` kỷ 7
  = 8,4%), còn thứ chỉ thêm **BỀ MẶT** thì tan biến — kỷ 8 tốn nhiều hình học nhất (**+48,5%** tam
  giác, ngói bò `barrel`) mà đổi **ít nhất (1,2%)**. Ngói bò là những cục nhỏ lặp lại: đắt nhất về
  khối, rẻ nhất về thứ mắt đọc được ở xa.
- **Current Risk**: thấp về mặt kỹ thuật (không có gì hỏng, không có lệnh vẽ mới, hiệu năng vẫn nằm
  sâu trong vùng rẻ), **cao về mặt giá trị**: một phase đã tiêu hết ngân sách hình học của nó mà
  Đàm mở app ra vẫn thấy gần như y cũ. Ở khung app thì có thấy (1,2–8,4% điểm ảnh), nhưng bản quét
  — chỗ DUY NHẤT đặt 15 kỷ cạnh nhau — thì không.
- **Future Risk**: trung bình-cao **nếu không quyết**. Phase 12 sẽ lại thêm chi tiết lên cùng những
  bề mặt ấy; nếu không biết "thứ gì sống sót ở xa" thì nó sẽ lặp lại đúng kết quả này với một ngân
  sách nữa. Ngược lại, phóng đại vật trên mái mà không có gác tỉ lệ sẽ dựng lại bẫy **"cây nấm"** —
  Phase 7C đã trả giá một lần vì `eaves` là số tuyệt đối áp lên những khối chênh nhau vài lần.
- **Recommended Solution**: KHÔNG phải "nhân mọi thứ lên cho to". Ba hướng, theo thứ tự ROI đo được:
  (1) **ưu tiên thứ phá đường viền** — nâng `crown` (lan can, đầu đao, sống mái nổi) và `dormer` ở
  những kỷ đang chỉ có `stack`, vì đó là loại chi tiết đã ĐO ra là sống sót; (2) **nâng trần tỉ lệ
  của riêng vật cao** (bể nước, lồng thang máy, cột ăng-ten — thứ nhô lên khỏi đường viền mái) chứ
  không nâng đều mọi `stack`; (3) chấp nhận rằng chi tiết mái là phần thưởng khi nhìn GẦN và ghi
  điều đó thành lời hứa tường minh, thay vì để nó là một thất bại không tên. **Cả ba đều là quyết
  định MỸ THUẬT ⇒ phải Đàm chọn.**
- **Estimated Complexity**: thấp cho (1) và (2) — bảng đã có sẵn cả hai trục, sửa là sửa giá trị
  trong `roofStyle.js` cộng nới `STACK_W_MAX_RATIO`; phần tốn là chụp + đo lại 15 kỷ (~12 phút).
- **Blocking Conditions**: ⛔ **CHỜ ĐÀM QUYẾT** — mục 5 ca 6 của chương trình làm việc (quyết định
  mỹ thuật với độ tự tin dưới 80%). Tuyệt đối không tự phóng to rồi báo "đã đạt".
- **Review Trigger**: ngay khi Đàm trả lời; hoặc trước khi Phase 12 bắt đầu thêm bất cứ chi tiết
  nào lên mái/tường, vì cùng câu hỏi sẽ lặp lại.
- **Owner**: đã xong · **Status**: ✅ **ĐÃ ĐÓNG 2026-08-18** (xem mục "ĐÓNG NGÀY 2026-08-18" bên
  dưới; phần chưa giải chuyển sang `#48`) — VIỆC 2
  (2026-08-18, ADR-034) chọn một hướng thứ TƯ mà mục này chưa liệt kê: **không phóng to chi tiết,
  mà đưa MẮT lại gần** (chạm vào công trình → camera bay tới, khoảng cách 7,5). Đo được: cùng thay
  đổi mã ấy, lệch trung bình cả khung đi từ **5,54 (dưới ngưỡng mắt 12)** ở khung toàn cảnh lên
  **15,45 (trên ngưỡng)** ở khung cận cảnh. ⚠️ **Câu chữ của mục này vẫn ĐÚNG và vì vậy chưa đóng**:
  chi tiết mái vẫn KHÔNG sống sót tới thang **bản quét** (mỗi thành phố ~300 điểm ảnh), và sẽ không
  bao giờ sống sót tới thang đó. Cái đã đổi là **nó không còn cần phải sống sót tới đó nữa**. Ba
  phương án (1)(2)(3) ở trên còn nguyên giá trị nếu Đàm muốn chi tiết đọc được ngay ở khung mặc
  định — nhưng nay chúng là *thêm*, không phải *cứu*.

### ĐÓNG NGÀY 2026-08-18 — ghi CẢ HAI NỬA, vì mỗi nửa là một kết luận khác nhau

**NỬA ĐÃ GIẢI:** chi tiết Phase 10–11 **có** vượt ngưỡng mắt khi camera lại gần — nhưng **chỉ ở
4/15 kỷ**, không phải cả 15 như bản ghi trước của mục này (VIỆC 2) để người đọc tưởng. Đo lần đầu
đủ 15 kỷ, cùng một dòng lệnh, `b98a47d` → `e95cdf1`, lệch trung bình cả khung ở khoảng cách cận
cảnh: kỷ 7 = **15,52** · kỷ 9 = **15,45** · kỷ 11 = **12,61** · kỷ 13 = **12,20** (bốn kỷ trên
ngưỡng 12); 11 kỷ còn lại từ **0,71** (kỷ 1) tới 11,19 (kỷ 8). Con số 15,45 mà VIỆC 2 khoe là kỷ 9
— **một mẫu, đọc thành luật của cả tập**, đúng hình dạng đã sinh ra `#38`.

**NỬA VĨNH VIỄN KHÔNG GIẢI (kết luận cuối, KHÔNG phải việc còn tồn):** ở **thang bản quét** thì chi
tiết mái sẽ **không bao giờ** đọc được, và đó không phải một thất bại cần chữa. Mỗi thành phố trong
bản quét rộng ~300 điểm ảnh, mỗi căn nhà cao 40–60 điểm ảnh, nên mọi chi tiết cỡ ống khói còn 3–5
điểm ảnh — **bất kể nó nằm trên mái hay dưới đất**. Từ nay bản quét chỉ dùng để canh
**KHÔNG-TRÔI** (15 kỷ còn phân biệt được với nhau không), không dùng để chứng minh một phase chi
tiết có tác dụng.

### ⚠️ LUẬT MỚI CHO MỌI PHASE SAU (Đàm chốt 2026-08-18)

> **Trước khi thêm bất kỳ chi tiết nào, trả lời trước: nó dành cho khung TOÀN CẢNH hay khung CẬN
> CẢNH? Chi tiết cỡ dưới ~12 điểm ảnh ở toàn cảnh thì chỉ đáng làm nếu nó phục vụ cận cảnh.**

Hệ quả thực hành, đã đo trên chính Phase 11: thứ sống sót ở xa là thứ đổi **ĐƯỜNG VIỀN** (lan can
kỷ 7 → 8,4% · cửa sổ mái kỷ 9 → 5,3%), không phải thứ thêm **BỀ MẶT** (ngói bò kỷ 8 tốn nhiều hình
học nhất bảng, **+48,5%** tam giác, mà chỉ đổi **1,2%**). Nên câu hỏi thứ hai luôn là: *"cái này
đổi đường viền hay đổi bề mặt?"*

**Phần chưa giải được chuyển sang `#48`** — nó là một câu hỏi KHÁC (*"vì sao 11 kỷ có quá ít thứ để
mà nhìn"*), không phải phần còn lại của câu hỏi này.

⚠️ **Bài học đi kèm, đáng giá hơn cả mục nợ này**: bản quét là thang NHỎ NHẤT dự án có, và nó
**không phải** thang Đàm dùng app. Một thay đổi có thể thật ở khung app mà chết ở bản quét (đúng ca
này), hoặc ngược lại. `sweep-diff.mjs` nay có **hai chế độ** (`--sweep` mặc định và `--frame`) dùng
CHUNG đơn vị + ngưỡng, để hai con số đặt cạnh nhau được. **Đọc cả hai, đừng chọn con số dễ nghe.**

---

## #38 — ✅ ĐÃ ĐÓNG (2026-08-18) — Trần "13 lệnh vẽ" là con số suy từ MẪU 3 KỶ, và kỷ 10 nằm ngoài nó

- **Module**: `src/engine/city3d/materials.js` (bảng `MATERIAL_ORDER`) · `eraStyle.js` (vai vật liệu
  của kỷ 10) · `PERFORMANCE.md` (chỗ phát biểu cái trần)
- **Priority**: **Low-Medium**
- **Severity**: **Low** — không phải lỗi hiệu năng, là lỗi **của một con số nghiệm thu**.
- **Impact**: Ràng buộc "không quá 13 lệnh vẽ" là một trong sáu mục cổng nghiệm thu Đàm đặt ra cho
  cả chương trình Phase 10–12. Một cổng mà **thực tế đã vượt sẵn từ trước khi chương trình bắt đầu**
  thì hoặc sẽ báo đỏ oan ở mọi phase sau (và bị nới dần cho tiện — đúng cái phễu Phase 9A), hoặc bị
  ngó lơ và mất luôn tác dụng.
- **Root Cause**: Bảng "Sau Phase 10" bản đầu đo **ba kỷ** (6 · 9 · 13 → 13 · 12 · 11 lệnh vẽ cả
  cảnh) rồi con số cao nhất trong ba ấy được viết ra như **luật của cả 15 kỷ**. Đo đủ 15 kỷ lần đầu
  tiên (2026-08-18) ra kỷ 10 = **14**. Kỷ 10 (Anh, thời công nghiệp) là kỷ **duy nhất** dùng cùng
  lúc cả `brick` lẫn `slate`, cộng `glass` · `stone` · `wood` ⇒ 5 họ vật liệu riêng phần thành phố,
  nhiều hơn mọi kỷ khác đúng một họ.
  ⚠️ Đây **KHÔNG phải hồi quy của Phase 10**: đo trên `HEAD` (trước Bước 2) cũng ra **14**. Cùng
  hình dạng với bài học *"một ngân sách tự tính mà chưa bao giờ được đặt cạnh sự thật thì không phải
  ngân sách"* — cái trần chưa bao giờ được kiểm với cả 15 kỷ, nó chỉ được kiểm với **chính cái mẫu
  đã sinh ra nó**.
- **Current Risk**: **Thấp.** Mô hình chi phí đo trên M3 nói 80% chi phí đi theo ĐIỂM ẢNH; một lệnh
  vẽ thêm trong một cảnh 12–14 lệnh vẽ nằm dưới mức phép đo phân giải được. Không có triệu chứng
  nào Đàm nhìn thấy.
- **Future Risk**: **Trung bình.** Phase 11 (mái) sẽ đụng đúng tầng vật liệu này. Nếu để nguyên,
  phase ấy sẽ hoặc phải làm việc với một cổng đã đỏ sẵn, hoặc vô tình được miễn cổng.
- **Recommended Solution**: ⚠️ **Đề xuất ban đầu của tôi — "ghi trần là 14" — ĐÃ BỊ ĐÀM BÁC, và
  anh đúng.** Lý do anh nêu: *"14 kỷ khác đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ
  trống để trôi vào trong im lặng. Cổng chỉ bắt được kỷ tệ nhất."* Đó chính là bẫy Phase 7D — **một
  con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ**; lời hứa thật không phải "≤ 13" mà
  là *"kỷ này không được tốn hơn chính nó hôm nay"*.
  ⇒ **Giải pháp đã làm: MỘT BẢNG 15 MỐC RIÊNG**, mỗi mốc là số đo của chính kỷ ấy.
  ❌ **KHÔNG** gộp `brick` với `slate` để lấy lại con số 13: hai vật liệu ấy khác nhau thật, và mua
  một con số đẹp bằng cách nói dối vật liệu chính là thứ `ADR-025` đã cấm với mặt đường.
- **Estimated Complexity**: Thấp (một mục tài liệu + một bài test thuần).
- **Blocking Conditions**: (đã gỡ) — hoá ra **không cần đụng `materials.js` một dòng nào**: cổng
  mới chỉ ĐỌC bảng vật liệu, không sửa nó, nên nó nằm gọn trong `src/engine/city3d/*` mà §3 cho
  phép. Cái tưởng là blocker thật ra là hệ quả của việc đề xuất sai giải pháp.
- **Review Trigger**: (đã tới) Trước Phase 11 (mái) — và đã xử lý xong trước khi Phase 11 bắt đầu.
- **Owner**: Việc 1 của chương trình "CHỐT #38 + DỌN QUY ƯỚC + VÀO PHASE 11".
- **Status**: ✅ **ĐÓNG 2026-08-18.**

### Đã làm gì để đóng

1. **`src/engine/city3d/drawCallBudget.test.js`** (mới, 4 bài) — bảng `MOC_LENH_VE` 15 dòng, mỗi
   dòng là số đo ngày 2026-08-18 kèm **lệnh đo chép sẵn trong chú thích** để phiên sau tái lập được:
   `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow`.
   | Kỷ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
   |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
   | Mốc (thành phố) | 9 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 10 | **12** | 10 | 10 | 10 | 10 | 10 |
2. **ĐỐI CHỨNG bắt buộc** (Đàm: *"Không có đối chứng thì không biết bài test có còn răng hay
   không"*): kéo thêm một họ vật liệu vào một kỷ ⇒ **đúng kỷ ấy** phải vượt mốc, và vượt **đúng 1**.
   Hỏi từng kỷ một, không hỏi tổng.
3. **Bài chống "trần chung đội lốt"**: cách rẻ nhất để bài 1 hết đỏ là điền cả 15 dòng cùng một số;
   bài này đòi khoảng trải ≥ 2 và ≥ 10/15 kỷ nằm dưới mốc cao nhất.
4. **Bài khoá quan hệ nền** `lệnh vẽ thành phố = (số họ vật liệu) + 4` — đúng **15/15 kỷ, không một
   ngoại lệ**. Đây là thứ cho phép cả bộ chạy trong `npm test` bằng `node --test`, không cần
   Chromium. Hằng số 4 = nền ô lưới · mặt đường · thân cư dân · đầu cư dân, và nó là **hiệu số đo
   được**, không phải kết quả đếm bằng mắt trong `sceneGraph.js`.
5. **`src/engine/city3d/cityParts.js`** (mới) — trả lời câu *"thành phố kỷ N gồm những khối nào?"*
   ở đúng MỘT nơi. Trước đó câu ấy nằm giữa thân `sceneGraph.js` nên mọi thứ muốn hỏi đều phải chép
   lại, và một bài test đã chép rồi chép sai. Nay `sceneGraph.js` gọi nó để DỰNG, bài test gọi nó
   để ĐO. Đàm: *"Đừng cố khoá hai bản chép cho khớp nhau — hãy làm cho chỉ còn một bản."*
6. **Tài liệu đã sửa**: `PERFORMANCE.md` (mục "Sau Phase 10" — bỏ hẳn phát biểu "không quá 13", thay
   bằng bảng 15 mốc + cách khoá), `ARCHITECTURE_DECISIONS.md` (ADR-028), `PROJECT_STRUCTURE.md`,
   `BAN_GIAO.md`, `CLAUDE.md`.

### 12 phép thử ngược (mỗi bài test mới đều đã thấy ĐỎ ở đúng chỗ dự đoán trước)

Phá `role:'stone'` → `'water'` · điền cả 15 mốc = 12 · `TAM_CO_DINH` 4→5 · `collectCitySpecs` trả
rỗng · đối chứng chọn họ ĐÃ CÓ · bảng 14 dòng bằng nhau + 1 dòng lệch · `NHIP_SESSIONS` còn một
dòng · `SWEEP_MAX` 150→0 · `kieuNhaDan` trả rỗng · đối chứng dùng nhịp già thay nhịp trẻ · nới kẹp
cấp `Math.min(3,…)` → `Math.min(9,…)` · cắt bớt danh sách cấp thử. **Cả 12 đều đỏ đúng câu assert
đã nêu trước khi chạy.**

---

## #95 — ✅ **ĐÃ XỬ LÝ (2026-09-06, ADR-069)** — Xây MỘT công trình phải qua BA cổng tiền tệ, cả ba đều là hàm của số phút

> **Đóng 2026-09-06**: Đàm ra lệnh *"cơ chế nào tồn tại chỉ vì được code ra thì xoá"* ⇒ ba cổng
> (RP · nguyên liệu · tinh luyện) rời khỏi đường chơi; cái giá còn lại là N PHIÊN + Ô hàng chờ
> (`startProject`, `BuildScreen`). Tài nguyên/RP/tinh luyện VẪN được cộng vào store (không xoá thứ
> đã kiếm, không đổi đồng bộ) nhưng không còn cổng tiêu ⇒ dữ liệu ngủ, theo dõi ở `#99`.
> Phương án "đổi 8 thô lấy 1 tinh luyện" bị bác ở dưới nay vô nghĩa vì cả hai đều không tiêu được.

> Mở 2026-09-01 (vòng 23). Đây là phát hiện có điểm ĐƠN GIẢN HOÁ cao nhất cả vòng (8/10) nhưng
> cũng có điểm RỦI RO cao nhất (6/10), vì nó đụng vào kinh tế game — thứ Đàm đã tích luỹ 180 ngày.

- **Tên**: ba cổng tiền tệ chồng nhau trên cùng một hành động "xây một công trình"
- **Module**: `src/engine/constants.js` (RP · tài nguyên thô · tinh luyện) · `BuildingWorkshop.jsx`
- **Priority**: Medium · **Severity**: Medium
- **Impact**: Đàm phải hiểu và theo dõi BA loại tiền để làm MỘT việc, mà cả ba đều suy ra từ cùng
  một đại lượng gốc là SỐ PHÚT TẬP TRUNG. Ba con số cho một quyết định.
- **Số đo**: kho thô thừa **20.422 đơn vị** = 2.552 tinh luyện quy đổi, trong khi nâng trọn 5 công
  trình kỷ 8 lên cấp 3 chỉ tốn **180** ⇒ dư **14 lần**. (Đo trên fixture 180 ngày; công thức là
  thật, nhịp chơi là giả — xem cảnh báo ở đầu `make-fixture.mjs`.)
- **VÌ SAO CHƯA LÀM**: gộp hay bỏ một loại tiền là đổi luật KINH TẾ, không phải đổi hiển thị.
  Nguyên tắc an toàn của vòng 23 là *đơn giản hoá thứ Đàm THẤY và CẢM, đừng xoá thứ Đàm đã KIẾM
  ĐƯỢC* — mục này nằm ở phía bên kia ranh giới ấy.
- **⚠️ ĐÃ BÁC một "phương án đỡ phí"**: nối dây một nút "đổi 8 thô lấy 1 tinh luyện" (hàm
  `craftTier` từng tồn tại với 0 nơi gọi, đã xoá ở vòng 23). Chính con số 14 lần bác nó: bấm cái
  nút ấy một buổi là xoá sạch tính khan hiếm của tinh luyện. Việc nó chưa bao giờ có nút bấm là
  điều MAY, không phải điều thiếu.
- **Review Trigger**: khi Đàm thấy kho tài nguyên là thứ phiền chứ không phải thứ vui.
- **Owner**: Đàm quyết · **Status**: MỞ, chờ Đàm

## #94 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — `BREAK_START_DELAY_MS` chờ 3,2 giây ở ~82% số phiên KHÔNG có lễ mừng nào để che

> Mở 2026-09-01 (vòng 23). Tiền đề của hằng số này chết do HAI bản vá ở chỗ khác, không do ai
> động vào `timerSession.js`.

- **Tên**: độ trễ vào nghỉ là HẰNG SỐ trong khi thứ nó sinh ra để che là BIẾN
- **Module**: `src/engine/timerSession.js` (`BREAK_START_DELAY_MS`) · `src/hooks/useTimer.js`
- **Priority**: Medium · **Severity**: Low
- **Impact**: sau mỗi phiên, màn hình giữ trạng thái vừa-xong thêm 3,2 giây trước khi chuyển sang
  nghỉ. Chú thích của hằng số biện minh cho con số ấy bằng câu *"cả hai trường hợp người dùng đều
  đang nhìn hộp phần thưởng"* — câu ấy nay SAI ở ~82% số phiên.
- **Root Cause**: ADR-060 làm phiên thường thôi tự mở hộp phần thưởng; vòng 22 siết lễ mừng thành
  phố xuống CHỈ khi có công trình vừa xong. Đo `sessionsToComplete` qua 15 kỷ: trung bình **5,60
  phiên mỗi công trình ⇒ lễ mừng chỉ chạy ở 17,9% số phiên**. Trên fixture 588 phiên hoàn thành:
  **31,4 phút** chờ không còn lý do, trong 180 ngày.
- **Recommended Solution**: làm độ trễ THEO chính thứ nó che — 3.200 ms khi có lễ mừng, 500 ms khi
  không (500 là giá trị đã chạy đúng suốt thời kỳ trước khi có lễ mừng). Tức đổi một HẰNG SỐ thành
  một QUAN HỆ. Hai bài test hiện khoá quan hệ `BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS` sẽ phải
  viết lại thành có điều kiện.
- **⚠️ VÌ SAO CHƯA LÀM**: (a) nó đụng thẳng luồng tự-vào-nghỉ, nơi một sai lầm sẽ **ÂM THẦM ăn bớt
  giờ nghỉ thật** của Đàm; (b) khoảnh khắc ấy **KHÔNG chụp ảnh kiểm được trên bản dev** — `ui`
  không nằm trong `partialize` nên không gieo được bằng `--fixture`, và cấm bấm "Bắt đầu" trên dev
  vì dùng chung một hàng Supabase với bản thật. **Đổi một hành vi đồng hồ mà không quan sát được
  nó là thứ phải hỏi Đàm trước.**
- **Blocking Conditions**: cần một cách quan sát được khoảnh khắc sau-phiên trên dev.
- **Owner**: Đàm quyết · **Status**: MỞ, chờ Đàm

## #93 — ✅ **HẾT ĐỐI TƯỢNG (2026-09-06, ADR-071: tab Phân Loại đã xoá)** — 📌 từng là QUYẾT ĐỊNH, KHÔNG PHẢI NỢ (2026-09-02) — `buildCategoryAdvisor` (170 dòng) vẫn nằm trong file giao diện, và ĐÓ LÀ CÓ CHỦ ĐÍCH — đừng "dọn" nó xuống engine

> Mở 2026-08-30, ngay sau khi chuyển thành công `summarizeFocusStats` xuống
> `engine/statsFocus.js`. Ghi mục này để phiên sau **không mất công phân tích lại rồi đi tới cùng
> một kết luận** — hoặc tệ hơn, đi tới kết luận ngược rồi kéo màu sắc xuống tầng engine.

- **Tên**: khối sinh lời khuyên của tab Phân Loại còn ở `StatsDashboard.jsx`
- **Module**: `src/components/StatsDashboard.jsx` (`buildCategoryAdvisor`, ~170 dòng)
- **Priority**: Low · **Severity**: Low
- **Impact**: 170 dòng sinh **văn bản Đàm đọc** (giọng cố vấn + tối đa 4 khuyến nghị + 3 kịch bản
  + 3 tín hiệu) mà không có bài test nào.
- **Root Cause / VÌ SAO KHÔNG CHUYỂN**: nó **không phải logic thuần** — nó là một *bộ dựng
  view-model*. Đo được: mã màu dệt vào **7 chỗ** (`color: bestEfficiencyCat?.color ?? '#0ea5e9'`,
  `uncategorizedShare >= 20 ? '#ef4444' : '#64748b'`…), có cả `icon: 'NX'/'XP'/'CB'`, và nó gọi
  `fmtHours` — một hàm ĐỊNH DẠNG. Kéo nguyên khối xuống `engine/` là kéo bảng màu và hàm định
  dạng xuống theo, tức phá đúng ranh giới mà `PROJECT_STRUCTURE.md` đang giữ (*"engine = logic
  THUẦN, không JSX"*), và đi ngược bài học vừa rút ra ở `statsFocus.js` (*màu rời khỏi engine*).
- **Current Risk**: thấp — văn bản viết dè dặt ("Thử…", "Hãy thử…"), không phát biểu như kết luận.
  ⚠️ **Đã kiểm một nghi vấn và BÁC BỎ**: nhánh `Math.round(longestAvgCat.minutes /
  longestAvgCat.sessions)` không có gác chia-cho-0 trong khi nhánh kế bên có
  (`Math.max(sessions, 1)`) — bất đối xứng đáng ngờ, nhưng **không phải lỗi**:
  `computeCategoryStats` đã lọc `sessions > 0` ở engine, và `longestAvgCat` lọc lại lần nữa. Gác
  thừa, không phải gác thiếu.
- **Future Risk**: trung bình — nó gác cỡ mẫu ở `totalSess < 4`, LỎNG hơn nhiều so với các tín
  hiệu ở `gameMath.js` (cần 8–24 phiên). Tức nó có thể nói *"X mới là loại cho XP/phút tốt nhất"*
  dựa trên 4 phiên.
- **Recommended Solution**: **KHÔNG** chuyển nguyên khối. Nếu muốn test nó thì tách theo ĐÚNG
  ranh giới: phần *quyết định* (chọn kịch bản nào, ngưỡng nào) xuống engine dưới dạng trả về
  **khoá** (`'thieu-du-lieu'` · `'loang-vi-chua-phan-loai'` · …), còn phần *câu chữ + màu + icon*
  ở lại giao diện tra theo khoá ấy. Đó cũng là cách gỡ được cái gác cỡ mẫu quá lỏng.
- **Estimated Complexity**: trung bình (đụng văn bản người dùng đọc ⇒ phải chụp ảnh nghiệm thu).
- **Blocking Conditions**: không có — nhưng đây là việc cải thiện cấu trúc, không phải sửa lỗi.
- **Review Trigger**: khi có ai định "dọn nốt cho đồng bộ với `statsFocus.js`", hoặc khi cái gác
  `totalSess < 4` sinh ra một lời khuyên sai mà Đàm để ý thấy.
- **Owner**: chưa ai · **Status**: MỞ (có chủ đích)
- **Cập nhật 2026-09-06 (ADR-071)**: `buildCategoryAdvisor` đã XOÁ cùng tab Phân Loại — màn Thống kê nay trả lời ba câu, dòng «loại việc mạnh nhất» đọc thẳng hồ sơ `buildFocusProfile` (cùng số với Coach, có test). Kết luận «không kéo view-model xuống engine» vẫn đúng và vẫn áp dụng cho `StatsJournal.jsx`.

## #92 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — `no-unused-vars` đang TẮT cho MỌI file `.jsx`, nên code chết ở cả tầng giao diện là vô hình với lint

> Mở 2026-08-30, phát hiện khi đi tìm lý do ba bảng kỳ chết sống sót nhiều tháng trong
> `StatsDashboard.jsx`. ⚠️ **Rule ấy tắt KHÔNG phải do cẩu thả — đã kiểm và phải đính chính chẩn
> đoán đầu tiên của chính tôi.** Bật thử lên thì ra 45 lỗi, nhưng phần lớn là **BÁO NHẦM**:
> `DisasterModal.jsx` dùng `motion.` 6 lần mà vẫn bị tố "motion không dùng", vì luật gốc
> `no-unused-vars` không hiểu `<motion.div>` trong JSX. Tắt rule là một cách NÉ lỗi giả, không
> phải bỏ mặc.

- **Tên**: tầng `.jsx` không có cổng nào bắt biến/hằng/import chết
- **Module**: `eslint.config.js` dòng ~53 (`'no-unused-vars': 'off'` trong khối `files: ['**/*.jsx']`)
- **Priority**: Medium · **Severity**: Low (không gây lỗi chạy, nhưng làm rác tích lại im lặng)
- **Impact**: đo được trong đúng MỘT file (`StatsDashboard.jsx`, trước bản vá 2026-08-30): **3 hằng
  số chết** (`PERIODS` · `METRIC_OPTIONS` · `PERIOD_UNITS`), **1 hàm chết** 30 dòng
  (`summarizeSessionReviews`), **3 import chết** (`useReducedMotion` · `createRichTextPreview` ·
  `computeAllTimeStats`) — tất cả đều có TỪ TRƯỚC bản vá, không ai biết. Toàn repo: 45 lỗi thô,
  trong đó ~30 là `motion` báo nhầm ⇒ khoảng **15 lỗi THẬT** nằm rải ở ~10 file.
- **Root Cause**: dự án không cài `eslint-plugin-react`, nên không có `react/jsx-uses-vars` — luật
  duy nhất dạy `no-unused-vars` rằng một định danh xuất hiện trong JSX là ĐANG ĐƯỢC DÙNG.
- **Current Risk**: thấp. Rác không chạy thì không hỏng gì; nó chỉ làm file phình và làm phiên sau
  tưởng một hằng số chết là đang có tác dụng (đã suýt xảy ra: `PERIODS` có 5 kỳ trong khi màn hình
  chỉ hiện 3, đọc lướt sẽ tưởng hai kỳ kia đang ở đâu đó).
- **Future Risk**: trung bình, và **tăng dần theo thời gian** — mỗi phiên thêm một ít rác mà không
  có cổng nào đếm. Đây chính là cách `StatsDashboard.jsx` đi tới 4.901 dòng.
- **Recommended Solution**: thêm `eslint-plugin-react` (devDependency, không vào bundle) và bật
  đúng **một** luật của nó — `react/jsx-uses-vars` — rồi mở lại `no-unused-vars` cho `.jsx` với
  cùng `varsIgnorePattern: '^[A-Z_]'` mà khối `.js` đang dùng. Sau đó dọn ~15 lỗi thật.
  ⚠️ **ĐỪNG** bật `no-unused-vars` mà chưa có plugin ấy: 30 lỗi giả sẽ khiến người ta hoặc tắt lại
  rule, hoặc tệ hơn là đổi `varsIgnorePattern` thành một cái rây thủng để cho qua — tức mua một
  cổng xanh bằng cách bỏ hết răng của nó.
- **Estimated Complexity**: nhỏ (1 dependency + 2 dòng cấu hình), nhưng phần dọn 15 lỗi chạm nhiều
  file ở nhiều màn khác nhau nên phải đi kèm một lượt chụp ảnh nghiệm thu.
- **Blocking Conditions**: thêm một dependency là quyết định của Đàm, không phải của phiên AI —
  dự án có lịch sử CỐ Ý gỡ dependency cho nhẹ (Qwen/WebLLM, `@huggingface/transformers`,
  `@anthropic-ai/sdk`). Cần Đàm đồng ý trước.
- **Review Trigger**: lần tới có ai đụng `eslint.config.js`, hoặc khi một file `.jsx` vượt 3.000
  dòng và cần biết bao nhiêu phần trong đó là rác.
- **Owner**: chưa ai · **Status**: MỞ
- **Giảm nhẹ tạm thời (đã làm 2026-08-30)**: `src/components/statsPeriodWiring.test.js` đọc mã
  nguồn và cấm bảng kỳ chết quay lại **trong riêng màn Thống kê**. Nó KHÔNG thay được cái cổng
  toàn cục — nó chỉ bịt đúng chỗ vừa bị cắn, đúng tinh thần *"một bài học được ghi ra không chặn
  được gì; chỉ một bài TEST mới chặn được"*.

## #91 — ✅ **ĐÃ XỬ LÝ (2026-09-02)** — Bài test canh khung bóng đổ CHÉP TAY hệ số `0,8` thay vì đọc từ mã, nên nó xanh kể cả khi mã dùng một `reach` khác

> Mở 2026-08-28, phát hiện trong lúc gộp nhánh Phase 19–21 vào `main`. Suýt cắn thật: phép gộp có
> một xung đột đúng ở dòng ấy (`main` chốt 0,75 · nhánh chốt 0,80), và **chọn nhầm bên thì bóng bị
> cắt cụt trên production mà bài test này vẫn xanh**.

- **Tên**: `sceneStats.test.js` viết cứng `const reachBong = 12 * 0.8` thay vì đọc `reach` đã dựng
- **Module**: `src/components/city/render3d/sceneStats.test.js` (~dòng 754) ↔ `sceneGraph.js`
  (`createCityScene`, `const reach = gridSize * 0.8`)
- **Priority**: Medium · **Severity**: Medium (khuyết tật nhìn thấy được, và im lặng tuyệt đối)
- **Impact**: khối đổ bóng xa tâm nhất nằm ở bán kính **9,2275** (kỷ 13, 120 phiên). Với 0,80 thì
  `reach` = 9,60 (dư 4%); với 0,75 thì 9,00 — **nhỏ hơn 9,2275**, tức nhà ở vành ngoài bị cụt bóng.
  Bài test tự tính `12 × 0,8 = 9,60` nên nó so khối xa nhất với một con số KHÔNG phải con số mã
  đang chạy: cả hai vế (không-được-thiếu và không-được-thừa) đều xanh ở cả hai giá trị.
- **Root Cause**: `reach` là biến cục bộ trong `createCityScene`, không export, nên bài test không
  có đường nào hỏi mã ngoài việc chép lại công thức. Đây đúng khuôn `#42` (*assert con số đã KHAI
  thay vì con số đã DỰNG*) và *một luật một công thức* — chỉ khác là ở đây bản chép nằm phía test.
  Chú thích ngay trên dòng ấy còn tự nhận *"không có bài test nào từng phát biểu quan hệ ấy"*,
  trong khi chính nó là bài test được giao việc đó.
- **Current Risk**: thấp ngay lúc này — hai bên đang khớp (mã 0,8 · test 0,8), đã kiểm bằng tay
  trong phép gộp 2026-08-28.
- **Future Risk**: **cao**. Bất kỳ ai siết `reach` cho "nét hơn" (đúng cám dỗ mà chú thích của
  `SHADOW_MAP_DESKTOP` kể là đã xảy ra một lần) sẽ không thấy gì đỏ lên, và triệu chứng là bóng
  cụt ở góc lưới — thứ chỉ lộ ra khi soi ảnh đúng kỷ, đúng giờ.
- **Recommended Solution**: export hệ số ra một hằng số có tên (`SHADOW_REACH_RATIO = 0.8`) đặt
  cạnh `SHADOW_MAP_DESKTOP`, cho `createCityScene` VÀ bài test cùng `import` nó. Rẻ, không đổi hành
  vi, và xoá hẳn khả năng hai bên trôi khỏi nhau.
- **Estimated Complexity**: rất thấp (một hằng số + hai lời gọi `import`)
- **Blocking Conditions**: không có
- **Review Trigger**: lần tới có ai đụng `sun.shadow.camera`, `SHADOW_MAP_DESKTOP`, hoặc bố cục
  thành phố làm khối lan xa hơn
- **Owner**: chưa ai nhận · **Status**: MỞ


- **✅ ĐÃ XỬ LÝ 2026-09-02.** Hằng số thành hàm: `breakStartDelayMs(hasCelebration)` — 3.200ms khi
  có lễ mừng, **500ms** khi không (500 là giá trị đã chạy đúng suốt thời kỳ trước khi có lễ mừng,
  không phải một con số mới chọn tay). `completeFocusSession` nay trả thêm `celebrates`, đọc CHÍNH
  hai biến mà `App.jsx` dùng để quyết định hiện lễ mừng (`activeNewlyBuilt` · `eraChanged`) chứ
  không chép lại điều kiện. Bài test ở `useTimer.test.js` đã đổi từ canh MỘT MỨC sang canh QUAN
  HỆ và chạy CẢ HAI nhánh — một nhánh thôi thì đổi hằng số nào cũng xanh.


- **✅ ĐÃ XỬ LÝ 2026-09-02.** Bật `no-unused-vars` cho `.jsx` — bắt ra **27 chỗ mã chết thật**
  (import không ai dùng, biến tính rồi vứt, tàn dư của những khối vừa bị xoá ở vòng 28). Kèm
  `src/lintConfig.test.js` (2 bài, đã thử-cho-đỏ) canh nó không lặng lẽ tắt về.
- ⚠️ **VÀ ĐÂY LÀ LÝ DO NÓ TỪNG BỊ TẮT — tôi đã phải trả giá mới hiểu.** Bật lần đầu ra **54** báo
  cáo; tôi tin cả 54 và đi gỡ. Kết quả: **lint sạch · build sạch · 1.524 bài test XANH · và app ra
  thẳng màn hình "RENDER RECOVERY: motion is not defined"**. ESLint lõi KHÔNG coi `<motion.div>`
  trong JSX là một lần DÙNG biến `motion`, nên **27/54 là BÁO NHẦM**, và chúng nhắm đúng vào những
  import đang sống. Mắt xích thiếu là **`react/jsx-uses-vars`** (`eslint-plugin-react`, nay đã
  thêm vào devDependencies). ⇒ *Bật `no-unused-vars` cho `.jsx` mà không có nó thì luật ấy không
  phải một cái gác — nó là một cái bẫy.* Gỡ plugin thì PHẢI tắt lại luật.
- ⚠️ **Bài học rộng hơn, đáng nhớ hơn cả bản vá:** ba cổng mạnh nhất của dự án (lint · build ·
  1.524 test) **cùng xanh trên một app đã vỡ hoàn toàn**. Thứ duy nhất bắt được là một ẢNH CHỤP.


- **📌 ĐÁNH DẤU LẠI 2026-09-02.** Mục này nói *"ĐÓ LÀ CÓ CHỦ ĐÍCH — đừng dọn nó xuống engine"*, tức
  nó là một QUYẾT ĐỊNH đã chốt, không phải một khoản nợ đang chờ trả. Để nó trong danh sách "còn
  mở" làm phồng con số nợ và khiến phiên sau tưởng còn việc phải làm — đúng thứ nó sinh ra để
  ngăn. Không đổi một dòng mã nào.


- **✅ ĐÃ XỬ LÝ 2026-09-02.** Hệ số nay là một hằng số CÓ TÊN và được `export`:
  `SHADOW_REACH_RATIO = 0.8` ở `sceneGraph.js`; `sceneStats.test.js` `import` nó thay vì chép tay
  `12 * 0.8`. Bài test khi ấy khoá cái LUẬT chứ không khoá một CON SỐ — đổi hệ số mà quên sửa test
  thì nay không còn xảy ra được. (Suýt cắn thật ở lần gộp nhánh Phase 19–21: xung đột đúng dòng ấy,
  `main` chốt 0,75 · nhánh chốt 0,80, và chọn nhầm bên thì không gì đỏ lên.)

---

## #87 — ~~Báo cáo tuần VẪN tự bật sáng thứ Hai~~ ✅ **ĐÃ ĐÓNG 2026-08-27 (ADR-061)**

- **Tên**: `weeklyReportOpen` tự bật (không do Đàm bấm) và mở một hộp thoại toàn màn hình.
- **Module**: `src/App.jsx` (`OverlayStack`) · `src/store/gameStore.js` (`checkWeeklyReport`) ·
  `src/components/WeeklyReportModal.jsx`.
- **Priority**: Low · **Severity**: Low.
- **Impact**: sáng thứ Hai đầu tiên trong tuần, Đàm mở app và bị chặn bởi một bản tổng kết mà anh
  không xin. Đúng loại làm phiền mà ADR-060 sinh ra để dẹp — nhưng nó là bản tổng kết chứ không
  phải một phần thưởng, nên nó nằm ngoài phạm vi bảy đường trao thưởng của phase này.
- **Root Cause**: `checkWeeklyReport` đặt `weeklyReportOpen: true` + `weeklyReportMode: 'previous'`
  vào sáng thứ Hai. Có sẵn hai chế độ (`'previous'` = tự bật · `'current'` = Đàm bấm ở thanh bên),
  nên phân biệt "tự bật" với "được gọi" là chuyện SẴN CÓ, không cần thêm cờ mới.
- **Current Risk**: thấp — mỗi tuần đúng một lần.
- **Future Risk**: nó là ngoại lệ duy nhất còn lại; ngoại lệ nào cũng là chỗ để ngoại lệ thứ hai
  bám vào (*"nếu báo cáo tuần được phép tự bật thì cái này cũng được"*).
- **Recommended Solution**: `showWeeklyModal = weeklyReportOpen && (weeklyReportMode === 'current'
  || detail === 'weekly')`, và chế độ `'previous'` sinh một thẻ toast bấm-để-mở.
- **⚠️ ĐIỀU KIỆN BẮT BUỘC trước khi làm** (đây là lý do phase này KHÔNG làm luôn): `dismissWeeklyReport`
  ghi `lastWeeklyReportDate` ⇒ **đóng một lần là mất báo cáo của cả tuần**. Một toast tự tắt sau 4
  giây mà cũng gọi hàm ấy thì lỡ một cái toast = mất báo cáo. Phải tách "đã xem" khỏi "đã bỏ qua"
  TRƯỚC, nếu không bản vá đổi một phiền toái nhỏ lấy một mất mát thật.
- **Estimated Complexity**: Small (nếu đã tách xong hai trạng thái trên); Medium nếu tính cả việc tách.
- **Blocking Conditions**: không có blocker kỹ thuật; chỉ chờ quyết định của Đàm về đánh đổi ở trên.
- **Review Trigger**: khi Đàm nói báo cáo tuần làm phiền, hoặc khi có mục thứ hai xin được tự bật.
- **Owner**: chưa giao · **Status**: ✅ **ĐÓNG 2026-08-27** (ADR-061) — cùng ngày mở.
- **Đã làm gì**: tách trường theo đúng "ĐIỀU KIỆN BẮT BUỘC" ở trên trước khi đụng vào tính năng.
  `lastWeeklyReportDate` = *đã MỜI* · `lastWeeklyReportSeenDate` = *đã XEM*. `checkWeeklyReport`
  nay chỉ bật `ui.weeklyReportPending` (một thẻ toast, nguồn `weekly` trong `rewardFeed.js`); hộp
  thoại chỉ mở khi Đàm bấm. Toast hết 4 giây gọi `dismissWeeklyReportToast` — **không ghi ngày nào**.
- **Lưới an toàn** (thứ khiến bản vá này KHÔNG phải là đánh đổi mà mục này cảnh báo): chấm "chưa
  xem" ở nút *Báo cáo tuần* trên thanh bên, do `lastWeeklyReportSeenDate` điều khiển nên nó KHÔNG
  hết hạn; và cú bấm đầu tiên trong tuần mở thẳng bản `'previous'` — đúng thứ hộp thoại tự bật đưa ra.
- **Khoá bằng test**: `src/store/gameStore.weeklyReport.test.js` (9 bài, 7 phép thử ngược đã đỏ),
  trong đó có bài dựng lại chính khuyết tật cũ và ĐÒI nó phải đỏ.
- ⚠️ **BỔ SUNG cùng ngày — lưới an toàn phải căng ở CẢ HAI nền tảng.** Cái chấm ở trên lúc đầu chỉ
  có ở thanh bên desktop (`hidden md:flex`), mà **trước ADR-061 iPhone không có nút nào mở báo cáo
  tuần** — nút duy nhất nằm đúng ở cái thanh bên ấy. Trên iPhone, hộp thoại tự bật vì thế không
  phải cách báo cáo *xuất hiện* mà là cách nó *tồn tại*; lưới căng ở nền tảng kia thì lỡ toast vẫn
  là mất báo cáo cả tuần. Đã thêm mục **"Báo cáo tuần" vào menu "Thêm" trên điện thoại**, mang cùng
  chấm `weeklyReportUnseen`, và khoá bằng `rewardToastWiring.test.js` (đòi cả lối vào lẫn cái chấm
  ở CẢ HAI thanh điều hướng). **Bài học**: gỡ một cơ chế rồi thay bằng "một lưới an toàn" thì phải
  liệt kê MỌI đường vào hiện có trước — một lưới chỉ căng một bên là một lời hứa đúng một nửa.

---

## #78 — 14/15 kỷ vẫn dùng chung MỘT mốc người phổ thông (chỉ kỷ 1 có bản sắc thật) — ✅ ĐÃ ĐÓNG 2026-08-23

> **✅ ĐÃ ĐÓNG 2026-08-23.** Cả 15 dòng nay được thiết kế thật, mỗi dòng buộc vào `country` mà
> `eraStyle.js` khai và có `note` giải thích. `designedEras()` báo **15/15**, không kỷ nào còn trỏ
> preset. Bộ chấm `humanIdentity.test.js` đo được: (A) 105/105 cặp khác nhau, yếu nhất **5/9 trục**
> (kỷ 4↔15), trung vị **8/9**; (B) 105/105 cặp khác nhau ở ít nhất một thứ **mắt đọc được ở 18
> điểm ảnh**. Tam giác không đổi (tối đa 9 hộp/người, 2,03% ngân sách).
> ⚠️ **Mục *«phần nào của việc này chỉ phục vụ máy bàn»* bên dưới VẪN NGUYÊN GIÁ TRỊ** — nó là kết
> luận đã đo, không phải một việc còn dở: trên iPhone 10/11 trục bản sắc không đọc ra được. Ba
> hướng ĐỀ XUẤT ở mục Recommended Solution chưa hướng nào được làm.
> ⚠️ Và một khuyết tật do chính việc này phơi ra đã được vá riêng ở **ADR-054**: 15 kỷ từng dùng
> chung MỘT màu vải và MỘT màu lá vì một tham số bị một biến cùng tên che khuất ở `palette3d.js`.


- **Tên**: `HUMAN_STYLES` mới thiết kế thật 1/15 dòng
- **Module**: `src/engine/city3d/humanStyle.js` (bảng) · `src/engine/city3d/human.js` (thư viện hình
  — hiện mới có 7 loại trang phục, 7 loại đội đầu, 6 loại đồ mang theo, đủ dùng cho vài kỷ nữa
  nhưng chưa đủ cho cả 15)
- **Priority**: Medium · **Severity**: Low
- **Impact**: Đi từ kỷ 2 tới kỷ 15, con người trong thành phố **không đổi gì cả** — cùng áo chẽn,
  cùng đầu trần, cùng tay không, cùng sải chân 1,62 và tốc độ 0,42. Đúng thứ bệnh mà bảng cây cối
  (trước Phase 8D) và bảng mặt đường (trước Phase 9D) đã mắc, chỉ khác là lần này nó **được khai
  báo công khai** chứ không núp sau một giá trị mặc định ngầm.
- **Root Cause**: có chủ đích. Đàm yêu cầu *"chỉ hoàn thiện kỷ 1, nhưng khung phải dựng cho cả 15
  kỷ"* — nên khung, bảng, bộ kiểm và phép đo đã xong; chỉ 14 dòng dữ liệu là chưa.
- **Current Risk**: Không có rủi ro kỹ thuật. `getHumanStyle` luôn trả bộ ĐẦY ĐỦ, bộ kiểm
  `isValidHumanStyle` chặn dòng sai, và bài test **in ra** `[humanStyle] đã thiết kế thật: 1/15 kỷ`
  mỗi lần chạy `npm test` — nên con số này không thể lặng lẽ bị đọc thành "xong rồi".
- **Future Risk**: Nếu để lâu, cái preset `mocPhoThong` sẽ dần được coi là "người nói chung" và
  phiên sau sẽ chỉnh THẲNG vào nó khi thấy một kỷ nào đó trông chưa ưng — lúc ấy 14 kỷ cùng đổi
  theo và không ai biết. ⚠️ Chỉnh preset là chỉnh 14 kỷ một lúc; muốn sửa một kỷ thì phải **tách
  dòng riêng cho kỷ ấy trước**.
- **Recommended Solution**: mỗi kỷ thêm một dòng, và dòng ấy phải trả lời được đúng câu mà kỷ 1 đã
  trả lời: *"người ở nước ấy, thời ấy, mặc gì và đi thế nào?"* — `country` đã bị khoá cứng vào
  `eraStyle.js` nên câu hỏi luôn có địa chỉ. Bài test đòi **≥5 trục khác preset** cho mọi kỷ được
  liệt vào `designedEras()`, nên không thể "làm cho có" bằng cách đổi một số thập phân. Ưu tiên
  theo mức tương phản với kỷ 1: kỷ 14 (Singapore, sơ mi công sở, cặp tài liệu, bước ngắn nhanh) và
  kỷ 5 (Đức trung cổ, áo choàng dài, mũ trùm) là hai kỷ cho khác biệt lớn nhất trên mỗi giờ bỏ ra.
- **Estimated Complexity**: Thấp cho mỗi kỷ (1 dòng bảng + có thể 1–2 hình mới trong `human.js`);
  trung bình nếu làm cả 14 kỷ một lượt.
- **Blocking Conditions**: Không có. Chỉ cần Đàm quyết làm kỷ nào tiếp.
- **Review Trigger**: khi Đàm yêu cầu kỷ tiếp theo, hoặc khi số kỷ đã thiết kế đủ nhiều để cần một
  phép chấm bản sắc kiểu `streetStyle.test.js` (105 cặp × N trục) thay cho phép so với preset.
- ⚠️ **PHẦN NÀY CHỈ PHỤC VỤ MÁY BÀN — ĐÃ ĐO, KHÔNG PHẢI PHỎNG ĐOÁN** (bổ sung 2026-08-23, theo
  yêu cầu kiểm chéo). Báo cáo trước dựa vào câu *"Đàm chỉ dùng MacBook Air M3"* rồi lấy đó làm cớ
  bỏ qua iPhone. Câu ấy **chưa được kiểm**, và nó sai về mặt hệ thống: `renderMode.js` KHÔNG loại
  iPhone khỏi 3D (chú thích trong đó nói rõ coi *"thiếu `deviceMemory`"* là máy yếu thì mọi iPhone
  đều rớt, tức giết luôn mục tiêu), `CLAUDE.md` ghi *"Web Vercel là bản đầy đủ, dùng trên iPhone và
  Mac"*, và Đàm dùng iPhone 17 Pro Max hằng ngày. Nên phải đo, và đây là số đo.
  - **Khung 3D đo thật** (`node scripts/shot.mjs --tab "Thành Phố" --width 390 --probe …` trên bản
    dựng ngày 2026-08-23, KHÔNG nhân nhẩm từ CSS): iPhone 390 ⇒ **324 × 201** điểm ảnh CSS
    (bộ đệm 648 × 402, `devicePixelRatio` 2). Máy bàn chạm trần **990 × 614** từ bề ngang 1440 trở
    lên, nên MacBook Air M3 (1470 điểm logic) đúng là 990 × 614.
  - **Cư dân kỷ 1 cao bao nhiêu** (`human-scale.mjs --eras 1`): MacBook **18,3 px** trung vị
    (13,5–29,3; kéo sát nhất 29,5) · iPhone **6,0 px** trung vị (4,4–9,6; kéo sát nhất 9,7).
  - **Từng bộ phận, đo riêng, so với ngưỡng mắt 4 px của dự án** (`EYE_PIXELS`, `streetStyle.js`):

    | bộ phận (kỷ 1) | MacBook cao × rộng | iPhone cao × rộng |
    |---|---|---|
    | thân (hình bóng trang phục) | 7,8 × 6,2 ✅ | 2,5 × 2,0 ❌ |
    | khoác da thú (mảng lệch vai) | 6,7 × 5,3 ✅ | 2,2 × 1,8 ❌ |
    | đầu | 5,9 × 5,5 ✅ | 1,9 × 1,8 ❌ |
    | chân | 8,2 × 3,9 ⚠️ | 2,7 × 1,3 ❌ |
    | tay | 6,0 × 3,5 ⚠️ | 2,0 × 1,1 ❌ |
    | cây giáo | 17,2 × 3,8 ⚠️ | 5,6 × 1,2 ❌ |
    | **búi tóc** | **2,7 × 2,5 ❌** | 0,9 × 0,8 ❌ |

  - **Dáng đi** (`human-scale.mjs --gait --eras 1`, cùng chỗ cùng hướng khác pha): hình bóng đổi
    **1,9 px trên bề rộng 10,8 px** ở MacBook, nhưng chỉ **0,6 px trên 3,5 px** ở iPhone.
  - ⇒ **KẾT LUẬN TRUNG THỰC — trên iPhone thì 10/11 trục bản sắc KHÔNG đọc ra được.** Cụ thể:
    tỉ lệ cơ thể (chênh so với preset chỉ ~0,9 px) · dáng đứng (lệch dưới một điểm ảnh) · hình
    bóng trang phục · đội đầu · sải chân · tần số bước · biên độ vung tay · tốc độ đi (chỉ đọc
    được nếu nhìn liên tục vài giây) · và cả cụm dáng đi gộp lại (0,6 px). **Đồ mang theo** là trục
    duy nhất còn cửa: cây giáo cao 5,6 px và tách khỏi thân, tức một vệt dọc mảnh — nhưng rộng
    1,2 px nên sau khử răng cưa nó là một vết mờ, xếp loại **MARGINAL, không phải đọc được**.
    **Màu vải** không cần độ phân giải không gian nên về lý còn sống, nhưng nó chỉ còn ~5 điểm ảnh
    vuông pha rất mạnh với nền đất ⇒ cũng marginal.
  - ⚠️ **VÀ MỘT SỰ THẬT KHÓ CHỊU NGAY TRÊN CHÍNH MÁY ĐÍCH**: **búi tóc 2,7 × 2,5 px ở MacBook cũng
    đã DƯỚI ngưỡng mắt 4 px.** Tức trong bốn trục Đàm chọn cho kỷ 1, trục *"đội đầu"* gần như không
    trả về gì kể cả trên máy bàn. Ba trục kia (trang phục + khoác da thú, đồ mang theo, tỉ lệ cơ
    thể + dáng đứng) thì đọc được rõ. Ghi ra đây vì im lặng chuyện này chính là cách một trục chết
    được tính vào công lao — đúng bài học cơ chế *"lùm cây"* chết trong im lặng ở Phase 8D.
  - **Recommended Solution cho phần iPhone (CHỈ ĐỀ XUẤT, CHƯA LÀM — cần Đàm quyết)**: KHÔNG nên
    phóng to cư dân (nó phá tỉ lệ với nhà, và ADR-053 buộc mọi trục phải có lý do lịch sử
    viết ra được — xem đính chính `stature: 1.18` ngày 2026-08-23: phóng đại thì được, miễn KHAI RA). Ba hướng, xếp theo mức tôi tin:
    1. **Chấp nhận và ghi rõ** — iPhone xem thành phố ở mức *bố cục và màu*, máy bàn mới là chỗ
       xem *con người*. Rẻ nhất, trung thực nhất, và khớp với việc màn Thành Phố vốn là màn để
       ngắm chứ không phải màn thao tác. Hôm nay dự án đang ở đúng trạng thái này.
    2. **Cho iPhone một mức thu-phóng mặc định GẦN HƠN** — kéo sát nhất đã đưa cư dân lên 9,7 px,
       vẫn dưới ngưỡng cho từng bộ phận nhưng đủ để cả người đọc ra là một người. Rủi ro: đổi khung
       mặc định là đổi thứ Đàm đã quen nhìn, và mọi con số nghiệm thu ảnh phải đo lại.
    3. **ADR-034 đã có sẵn lối đi đúng: chạm vào một công trình thì camera bay tới** (`FOCUS_VIEW_
       DISTANCE = 7,5`). Mở rộng cho phép chạm vào một **cư dân** thì con người sẽ đọc ra được ở
       mọi khung hình mà không đụng gì tới khung mặc định. Đây là hướng tôi tin nhất về lâu dài,
       nhưng nó là một tính năng tương tác chứ không phải một chỉnh số, nên phải là task riêng.
  - **Cách tái lập mọi con số trên** (đủ ba vế CÔNG CỤ · ĐẦU VÀO · ĐỜI ẢNH theo luật `PERFORMANCE.md`):
    `node scripts/shot.mjs --tab "Thành Phố" --width 390 --probe "…getBoundingClientRect()…"` (cần
    `CHROME_PATH` trỏ Chrome, và `npm run build` TRƯỚC vì `shot.mjs` phục vụ `dist/`) ·
    `node --import ./scripts/register-esm-loader.mjs scripts/human-scale.mjs --eras 1` ·
    `… scripts/human-scale.mjs --gait --eras 1`. Đo trên cây mã tại commit `be9d2ea`.
- **Owner**: phiên AI kế tiếp · **Status**: Open (có chủ đích, đúng phạm vi Đàm giao)

---


## #96 — ✅ **ĐÃ XỬ LÝ (2026-09-06, ADR-070)** — Tiến hoá di vật là một cơ chế CHẾT: nó đòi tinh luyện của kỷ ĐÃ QUA

> Mở 2026-09-01 (vòng 24, lúc soi lại tab Hành trang). Đây là một NGÕ CỤT cấu trúc, không phải một
> con số cần cân bằng lại — nên nó khác `#95`, và nó cũng không sửa được bằng cách chỉnh giá.

- **Tên**: `evolveRelic` tiêu `resourcesRefined[kỷ của di vật]`, mà tinh luyện chỉ rơi vào kỷ ĐANG CHƠI
- **Module**: `src/store/gameStore.js` (`evolveRelic` ~5795, credit tinh luyện ~4135) · `RelicInventory.jsx`
- **Priority**: Medium · **Severity**: Medium
- **Số đo**: `evolveRelic` đọc `state.resourcesRefined[evoDef.era]`; còn tinh luyện khi xong phiên
  được cộng vào `resourcesRefined[reward.activeBook]` — **kỷ đang chơi**. Nguồn duy nhất khác là
  đặc quyền hạ tầng, nhưng `pruneEraScopedBlueprintState` gỡ công trình của kỷ cũ khi lên kỷ ⇒
  **không có đường nào kiếm tinh luyện của một kỷ đã qua**. Ảnh chụp fixture (3 di vật, kỷ 8):
  **3/3 nút tiến hoá đều "Chưa đủ tài nguyên"**, và chúng sẽ ở nguyên như vậy vĩnh viễn.
- **Impact**: màn hình vẽ ra một thang tiến hoá `1 → 2 → 3` kèm một dòng chi phí và một cái nút —
  cả ba đều là lời hứa về một việc **không thể làm được**. Cửa sổ dùng được của cơ chế này chỉ là
  khoảng thời gian giữa lúc thắng khủng hoảng và lúc lên kỷ, mà khủng hoảng nổ ở ~95% ngưỡng kết
  thúc kỷ ⇒ cửa sổ ấy gần như bằng không.
- **⚠️ VÌ SAO CHƯA LÀM**: mọi lối ra đều là đổi luật KINH TẾ, không phải đổi hiển thị —
  (a) cho tinh luyện của kỷ cũ tiếp tục rơi, (b) cho đổi tinh luyện kỷ mới lấy kỷ cũ, (c) đổi chi
  phí tiến hoá sang tinh luyện của kỷ ĐANG chơi. Nguyên tắc an toàn đang áp: *đơn giản hoá thứ Đàm
  THẤY và CẢM, đừng xoá thứ Đàm đã KIẾM ĐƯỢC* — cả ba phương án nằm ở phía bên kia ranh giới ấy.
- **⚠️ ĐÃ CÂN NHẮC VÀ BÁC "vá bằng cách giấu đi"**: ẩn thang tiến hoá khi không đủ tài nguyên. Nó
  làm màn hình hết nói dối nhưng cũng xoá luôn dấu vết của một cơ chế đã viết xong — và phiên sau
  sẽ không có cách nào biết nó tồn tại. Ghi ra một mục nợ đọc được thì hơn.
- **Review Trigger**: khi Đàm hỏi "sao cái nút tiến hoá di vật không bấm được bao giờ".
- **Owner**: Đàm quyết · **Status**: ✅ **ĐÓNG 2026-09-06 (ADR-070)** — lệnh mới uỷ quyền quyết
  (*"cho phép bạn tự quyết định mọi thứ và tech debt"*). Chọn phương án KHÔNG nằm trong ba lối ra
  kinh tế ở trên: bỏ hẳn cái GIÁ. Di vật lên bậc theo số phiên ≥25′ kể từ lúc nhận (`engine/
  relicGrowth.js`, mốc `RELIC_EVOLVE_SESSIONS = [0, 20, 50]`), chốt ngay trong `completeFocusSession`,
  kể ở chuỗi thẻ. `evolveRelic` + `t2Cost`/`t3Cost` + nút «Tiến hoá di vật» xoá; kho di vật hiện thanh
  «N/20 phiên · còn M». Save cũ đóng dấu `earnedAt` lúc nạp (không nhảy bậc từ lịch sử cũ).

## #98 — ✅ **ĐÃ XỬ LÝ (2026-09-06, ADR-070)** — `LootDropModal` (7 giai đoạn) và `SessionRewardStory` cùng trình bày MỘT `pendingReward`

- **Tên**: hai bản trình bày của cùng một phần thưởng, sau ADR-068
- **Module**: `src/components/LootDropModal.jsx` (1.078 dòng) · `src/components/SessionRewardStory.jsx` · `OverlayStack` trong `src/App.jsx`
- **Priority**: Low · **Severity**: Low
- **Impact**: ADR-068 cho mọi phiên kết thúc bằng chuỗi thẻ; hộp thoại 7 giai đoạn chỉ còn mở khi lên
  kỷ hoặc khi Đàm bấm "Xem chi tiết". Hai màn đọc cùng `reward.*`, cùng phát cùng bộ tiếng
  (`playChestOpen`/`playLevelUp`/`playEraChange`) — ca lên kỷ hiện nghe tiếng mở rương HAI lần (một ở
  thẻ xp, một khi hộp thoại mở), và mọi trường mới thêm vào `pendingReward` phải nối vào hai chỗ.
  `previewStage.test.js` đã đọc cả hai file nên bản giả không trôi, nhưng hai bản trình bày thì có thể.
- **Root Cause**: chuỗi thẻ được xây MỚI (nhẹ, thuần, có test) thay vì cắt hộp thoại cũ — đúng lệnh
  "có thể xoá và xây lại"; hộp thoại được giữ làm màn CHI TIẾT vì nó là chỗ duy nhất liệt kê tài
  nguyên/RP/tinh luyện theo từng dòng, và chưa đo được Đàm có mở nó không.
- **Current Risk**: Thấp — hai màn không chồng nhau (cổng `storyDone` đứng trước `showLootModal`).
- **Future Risk**: Trung bình — thêm một loại thưởng mới là phải sửa hai chỗ; sửa một chỗ thì lệch
  trong im lặng.
- **Recommended Solution**: nếu sau vài tuần "Xem chi tiết" gần như không được bấm ⇒ XOÁ
  `LootDropModal`, thêm một thẻ "tài nguyên" vào chuỗi thẻ (liệt kê `reward.resources` + RP + tinh
  luyện bằng `RewardCard`), và cho ca lên kỷ dùng thẻ `era` làm màn cuối. Khi ấy `previewStage.test`
  chỉ còn đọc một file, và tiếng chỉ phát một lần.
- **Estimated Complexity**: Low–Medium.
- **Kèm (cùng nơi, cùng nguyên nhân "hai lớp phủ, một `key`")**: bấm "Nhận thưởng trọn ngày" ngay trong
  chuỗi thẻ mà cú nhận ấy làm LÊN CẤP ⇒ `levelUpHead` đổi ⇒ `key` của `GlobalOverlays` đổi ⇒ chuỗi thẻ
  dựng lại từ thẻ đầu. Hiếm, chỉ tốn một lượt xem lại; sửa cùng lúc với việc gộp hai màn.
- **Blocking Conditions**: cần biết Đàm có dùng "Xem chi tiết" không — hỏi anh, đừng đo.
- **Review Trigger**: lần tới thêm một loại phần thưởng mới vào `completeFocusSession`.
- **Owner**: chưa ai · **Status**: MỞ (2026-09-05, ADR-068)
- **Cập nhật 2026-09-06 (ADR-069)**: chuỗi thẻ nay có thêm thẻ công trình · lên cấp kèm chọn kỹ năng ·
  thử thách kỷ · bậc · di vật ⇒ nó đã là bản trình bày CHÍNH. `LootDropModal` chỉ còn hơn ở phần liệt
  kê tài nguyên/RP/tinh luyện — mà ba thứ ấy không còn cổng tiêu (`#99`). Lý do giữ nó teo lại; khi
  dọn `#99` thì gộp luôn (thẻ `era` làm màn cuối cho ca lên kỷ).
- **✅ ĐÓNG 2026-09-06 (ADR-070)**: `LootDropModal.jsx` xoá hẳn cùng mọi cổng ở `OverlayStack`
  (`showLootModal` · `detail === 'loot'` · `pendingEraChanged` · preload). Chuỗi thẻ là cái kết duy
  nhất; thẻ «Kỷ nguyên mới» có nút «Xem thành phố mới» và phát `playEraChange` (tiếng kêu MỘT lần).
  Ca "bấm Nhận trong chuỗi thẻ làm lên cấp ⇒ chuỗi thẻ dựng lại" hết theo cấu tạo: không còn nút
  Nhận nào trong chuỗi thẻ. `previewStage.test.js` chỉ còn đọc hai file chuỗi thẻ. Không hỏi Đàm
  "có bấm Xem chi tiết không" vì lệnh mới uỷ quyền quyết — và màn ấy chỉ còn hơn ở phần liệt kê ba
  đồng tiền ngủ.

## #99 — ✅ **ĐÃ XỬ LÝ (2026-09-06, ADR-071)** — DỮ LIỆU NGỦ sau ADR-069: tài nguyên · RP · tinh luyện vẫn được cộng, không còn cổng tiêu; 5 action + 1 hộp thoại còn nằm lại không ai gọi

> Mở 2026-09-06 (ADR-069). Đây là cái giá CỐ Ý của vòng ấy: gỡ cổng khỏi đường chơi mà KHÔNG xoá
> thứ Đàm đã kiếm và KHÔNG đụng state đồng bộ. Mục này để phiên sau biết cái gì đang ngủ, chứ không
> phải để dọn ngay.

- **Tên**: kinh tế tài nguyên còn chạy ngầm sau khi lối vào của nó đã đóng
- **Module**: `src/store/gameStore.js` (`resources` · `research.rp` · `resourcesRefined` · `tinhThe`
  vẫn cộng ở `completeFocusSession`; `startCrafting` · `researchBlueprint` · `craftBuilding` ·
  `upgradeBuilding` · `cancelCrafting` (hoàn tài nguyên) giữ lại cho test + dữ liệu cũ) ·
  `src/engine/craftReadiness.js` (không còn ai gọi; `DisasterModal.jsx` thì ĐÃ xoá hẳn cùng ngày —
  huỷ phiên vẫn trừ tài nguyên theo trần và ghi `cancelPenalty` vào lịch sử, chỉ là không ai xem) · `LootDropModal.jsx` (liệt kê ba loại tiền ngủ)
- **Priority**: Low · **Severity**: Low
- **Impact**: mỗi phiên vẫn tính toán và đồng bộ một bộ số không ai đọc; hộp thoại chi tiết vẫn
  liệt kê chúng; sáu bài test store vẫn canh luật tiêu tiền của một đường không còn màn hình.
- **Root Cause**: ADR-069 chọn "đóng cửa" thay vì "phá nhà" để giữ tương thích ngược và không đổi
  JSONB đang tranh chấp CAS (`syncService`).
- **Current Risk**: Thấp. **Future Risk**: Trung bình — phiên sau tưởng ba loại tiền vẫn là một
  phần của trò chơi rồi thiết kế thêm cổng lên chúng. ⚠️ Cùng ngày đã gỡ MỌI phần thưởng còn trỏ vào
  ba đồng tiền này (bậc lẻ, 12/15 di vật, 4 kỹ năng — xem ADR-069 mục 6) và `rewardAxes.test.js` từ
  chối bất kỳ bảng phần thưởng nào nhắc lại chúng ⇒ phần còn ngủ CHỈ là phép cộng vào store + 5 action
  + `craftReadiness.js` + phần liệt kê ở `LootDropModal`; không còn màn hình nào HỨA chúng.
- **Recommended Solution** (sau khi Đàm chơi vài tuần với luật mới): (1) ngừng cộng RP/tinh luyện
  và thu `resources` về một con số kỷ niệm hoặc bỏ hẳn (cần bước migration + `normalizePersisted
  GameState`); (2) xoá 5 action + `craftReadiness.js` + phép trừ tài nguyên khi huỷ, cùng test của chúng;
  (3) gộp `LootDropModal` vào chuỗi thẻ (`#98`). Nếu muốn thêm "khan hiếm" thì đặt nó ở PHIÊN
  (kỳ quan tốn nhiều phiên hơn), không mở lại tiền tệ.
- **Estimated Complexity**: Medium (vì có migration dữ liệu thật).
- **Blocking Conditions**: Đàm xác nhận không nhớ tiếc kho tài nguyên.
- **Review Trigger**: lần tới ai thêm một loại phần thưởng "tài nguyên".
- **Owner**: phiên 2026-09-06 · **Status**: ✅ ĐÃ XỬ LÝ (2026-09-06, ADR-071)
- **Cập nhật 2026-09-06 (ADR-070, cùng ngày)**: đã dọn phần NHÌN THẤY và phần MÃ CHẾT của mục này —
  xoá 5 action (`startCrafting` · `researchBlueprint` · `craftBuilding` · `upgradeBuilding` ·
  `evolveRelic`) + `engine/craftReadiness.js` + `LootDropModal.jsx` (màn cuối liệt kê ba đồng tiền);
  kỳ quan/đặc quyền công trình thôi trả bằng tinh luyện/RP; nhãn «Tinh luyện» ở lịch sử Thống kê,
  hàng «Tài nguyên» ở Thăng hoa, câu onboarding đều đã đổi. **Còn ngủ**: phép cộng `resources` ·
  `research.rp` · `resourcesRefined` ở `completeFocusSession`, `cancelCrafting` hoàn tài nguyên, phép
  trừ tài nguyên khi huỷ phiên, `tinhThe` (không còn được cộng). Vẫn KHÔNG đụng state đồng bộ — phần
  (1) của Recommended Solution (migration) vẫn chờ Đàm chơi vài tuần với luật mới.
- **Đóng 2026-09-06 (ADR-071, vòng 36)**: chọn phương án (B) *THÔI GHI, giữ khoá* thay vì migration: `calculateRewards` thôi trả `resources/rpEarned/t2Drop/largeChest`; store xoá `mergeResources` + ba hàm trừ khi xoá phiên, khối RP/tinh luyện, phạt tài nguyên + lượt tha thứ khi huỷ (`applyDisasterPenalty` · `calculateSessionResourceFloor` xoá), hoàn tiền `cancelCrafting`, hai nhiệm vụ «Kiếm N RP» và loại `researchPoints`; thẻ tổng kết/chuỗi thẻ bỏ «Rương Lớn/+tài nguyên/+RP». Bản ghi lịch sử MỚI không còn ba trường ấy; bản cũ giữ nguyên. **Còn lại có chủ đích**: các khoá `resources` · `research` · `resourcesRefined` · `tinhThe` · `forgiveness` vẫn trong save (dữ liệu chết) — migration xoá khoá chỉ khi Đàm xác nhận không tiếc kho.

## #100 — ✅ **ĐÃ XỬ LÝ (2026-09-06, ADR-070)** — Hai chỗ vẫn phải BẤM để nhận thứ đã đạt: "Chốt bước" chuỗi tuần, và lưới 360 huy hiệu dài ~5.350px

> Mở 2026-09-06 (ADR-069). Hai việc vòng ấy KHÔNG làm vì phạm vi đã rộng; ghi để phiên sau khỏi
> tưởng chúng là quyết định.

- **Tên**: phần thưởng đã đạt mà còn một nút giữa nó và người chơi
- **Module**: `DailyMissions.jsx` (`claimWeeklyStep` — nút "Chốt bước") · `Achievements.jsx` (lưới
  360 ô, ảnh 390px cao 10.702px ở DPR 2)
- **Priority**: Low · **Severity**: Low
- **Impact**: bước tuần đủ điều kiện vẫn đứng đó cho tới khi bấm — cùng loại ma sát mà ADR-069 vừa
  gỡ ở bậc/khủng hoảng. Lưới huy hiệu là một bảng tra cứu 60 hàng ở nơi người chơi vào để xem "sắp
  đạt gì" (dải hero đã trả lời câu ấy ở đầu màn).
- **Recommended Solution**: (1) tự chốt bước tuần ở `completeFocusSession` khi đủ, kể vào chuỗi thẻ
  (cùng khuôn `rankUp`); (2) Huy hiệu: mặc định chỉ hiện "Sắp đạt" + "Mới mở" + đếm theo nhóm, lưới
  đầy đủ nằm sau một nút gấp.
- **Estimated Complexity**: Low.
- **Review Trigger**: khi Đàm hỏi "sao phải bấm Chốt bước".
- **Owner**: chưa ai · **Status**: ✅ **ĐÓNG 2026-09-06 (ADR-070)** — (1) `autoClaimWeeklySteps` chốt
  liền mọi bước đủ ngay trong `completeFocusSession` (XP cùng công thức nút cũ, SP chuỗi, buff Cử Tri/
  Kế Hoạch Hoàn Hảo), kể ở thẻ «Bước tuần»; thưởng trọn ngày cũng tự vào ở phiên khép nốt nhiệm vụ
  cuối (kèm phép đối chiếu lịch sử mà nút cũ làm). Xoá `claimWeeklyStep` · `claimMissionAllBonus` và
  mọi nút Nhận. (2) Huy hiệu: khối «Kế tiếp» (4 huy hiệu gần đạt nhất, thanh + «còn N») sau dải hero;
  bỏ bộ lọc bậc; lưới vẫn là điểm chính (ADR-028: «không giấu, chỉ gấp» — phần "chưa chạm" đã gấp từ
  2026-09-02). Không làm "đếm theo nhóm": nó là một bảng số nữa chứ không phải một việc.

## #101 — ✅ **ĐÃ XỬ LÝ (2026-09-06 tối, ADR-074)** — 47 lời trỏ "xem `CLAUDE.md`" trong 38 file mã nay trỏ tới file KHÔNG CÒN chứa bài học 3D
> ✅ **XỬ LÝ 2026-09-06 (tối)**: quét lại ra **63 dòng / 39 file** (nhiều hơn con số 47 ghi lúc mở, vì
> hai file `scripts/doc-budget*.js` mới thêm cũng nhắc `CLAUDE.md` một cách hợp lệ). Đã phân loại
> theo NỘI DUNG từng dòng thay vì thay hàng loạt:
> · **40 dòng → `docs/LESSONS_3D.md`** (bài học mỹ thuật/đo lường, đã tách sang đó sáng cùng ngày);
> · **1 dòng → `docs/OPERATIONS.md`** (bẫy NFC/NFD của launchd — thuộc nhóm bẫy Electron tray);
> · **22 dòng GIỮ NGUYÊN `CLAUDE.md`** vì chúng nói về luật vẫn nằm ở đó (cấm chạy phiên thật trên
>   dev/localhost, "KHÔNG làm những thứ này", ngân sách token, luật ngôn ngữ).
> ⚠️ **Một chỗ chưa xác minh được đích**: `src/engine/eraLegacy.js:40` trích *"một luật mới làm cho
> điều kiện cũ hết đúng"* — `grep` không tìm thấy nguyên văn câu này ở `docs/LESSONS_3D.md` hay
> `CLAUDE.md`; nó đã được trỏ sang `LESSONS_3D.md` vì đó là nơi khả dĩ nhất, nhưng phiên nào đụng
> tới file ấy nên xác minh lại và ghi bài học vào đúng chỗ nếu nó thật sự chưa được ghi ở đâu.


- **Tên**: Con trỏ chú thích trỏ một cấp thiếu sau khi tách `docs/LESSONS_3D.md`
- **Module**: `src/engine/city3d/**` · `src/components/city/**` · `scripts/**` (38 file)
- **Priority**: Low · **Severity**: Low
- **Impact**: Một phiên sau đọc chú thích *"xem `CLAUDE.md`"* rồi `grep` `CLAUDE.md` sẽ **không
  thấy** bài học được nhắc tới, vì nó đã sang `docs/LESSONS_3D.md`. Chuỗi KHÔNG đứt (mở
  `CLAUDE.md` là gặp ngay mục «🎨 Bài học mỹ thuật 3D → `docs/LESSONS_3D.md`» kèm lệnh `grep`),
  nhưng nó tốn thêm một nhịp và có thể bị đọc thành *"bài học ấy đã bị xoá"*.
- **Root Cause**: Tách file ngày 2026-09-06 để cắt 88,2% `CLAUDE.md`. Cái tên `CLAUDE.md` trong 47
  chú thích là một **địa chỉ cứng** — đúng họ với bài học *"một luật một công thức"*: địa chỉ của
  một tri thức được chép ra 47 chỗ thì đổi chỗ tri thức ấy là 47 chỗ cùng lạc hậu.
- **Current Risk**: Thấp — con trỏ trung gian đã có và nằm ở đúng chỗ người ta mở đầu tiên.
- **Future Risk**: Trung bình nếu sau này `CLAUDE.md` bỏ mục con trỏ ấy đi. **Mục con trỏ 🎨 trong
  `CLAUDE.md` vì vậy KHÔNG được xoá** chừng nào 47 lời trỏ này còn.
- **Recommended Solution**: KHÔNG sửa hàng loạt 38 file. Sửa hàng loạt chú thích là thay đổi rủi ro
  cao (dễ trượt regex, dễ đụng chuỗi trong template literal — cái bẫy nháy ngược đã cắn 4 lần) đổi
  lấy lợi ích bằng không. Khi nào chạm vào một file vì lý do khác thì sửa luôn con trỏ của file đó.
- **Estimated Complexity**: Thấp nhưng rải rác.
- **Blocking Conditions**: Không có.
- **Review Trigger**: Khi có ai định xoá/đổi tên mục «🎨 Bài học mỹ thuật thành phố 3D» trong
  `CLAUDE.md`, hoặc khi đổi tên `docs/LESSONS_3D.md`.
- **Owner**: chưa ai · **Status**: MỞ (chấp nhận có chủ đích)

---

## Threshold history — snapshots older than 2026-08-27

> *(mốc trước)* **(2026-09-06, sau ADR-072 "tray: realtime không phải nguồn duy nhất")**: thêm
> **#102** (Medium — `main.js` không có test tự động cho lưới poll/`powerMonitor` vừa thêm). **102
> mục · 43 đã đóng · 59 còn mở**. Vẫn **1 mục Priority High còn mở** (#53), **0 mục Critical** → xa
> ngưỡng Maintenance Sprint.
>
> *(mốc trước)* **(2026-09-06, sau ADR-071 "Thống kê trả lời · đóng #99")**: đóng **#99 · #6**,
> **#93 hết đối tượng** (khối ấy đã xoá cùng tab Phân Loại), **#2** xử lý xong vế `StatsDashboard.jsx` (vế `gameStore.js`
> còn mở). **101 mục · 43 đã đóng · 58 còn mở** theo cách đếm của mốc trước (40 + 3, cộng **#101** mở cùng ngày bởi
> phiên tối ưu context window); đếm dấu ✅ trên tiêu đề mục ra 39, vì bốn mục đóng cũ không mang dấu ✅. Vẫn **1 mục Priority High còn
> mở** (#53), **0 mục Critical** → xa ngưỡng Maintenance Sprint.
>
> *(mốc trước)* **(2026-09-06, sau ADR-070 "một cái kết duy nhất")**: đóng **#96 · #98 · #100**, cập nhật **#99**.
> **100 mục · 40 đã đóng · 60 còn mở**.
>
> *(mốc trước)* **Trạng thái ngưỡng (2026-08-27 tối, sau ADR-061 "tách đã-mời khỏi đã-xem")**:
> **#87 ĐÃ ĐÓNG cùng ngày mở** — báo cáo tuần thôi tự bật, và luật mức độ làm phiền của ADR-060 nay
> **không còn ngoại lệ nào**. Vẫn **1 mục Priority High còn mở** (#53), **0 mục Critical** → xa
> ngưỡng Maintenance Sprint.
>
> *(mốc trước)* **(2026-08-27 tối, sau ADR-060 "một ngôn ngữ hình cho phần thưởng")**: thêm **#87**
> (báo cáo tuần vẫn tự bật sáng thứ Hai) ở mức **Low**.
>
> *(mốc trước)* **(2026-08-27, sau khi viết lại `ActionButton`)**: thêm **#86**
> (137 nút tự vẽ không đọc token skin) ở mức **Medium** — vẫn **1 mục Priority High còn mở**
> (#53), **0 mục Critical** → xa ngưỡng Maintenance Sprint.
>
> *(mốc trước)* **Trạng thái ngưỡng (2026-08-24 chiều, sau ADR-059)**: thêm **#84** (kỷ 1 và 2 thấp đi

> *(mốc trước)* **Trạng thái ngưỡng (2026-08-24, sau Phase 21 — HỢP NHẤT hai nhánh)**: phiên này không
> mở mục nợ mới và không đóng mục nào — nó gộp hai bộ sinh bố cục đã giải cùng một bài toán hai
> lần. `buildRoadPlan` cùng năm bộ dựng khung của ADR-059 **đã bị xoá**; nay `buildCityPlan` (chia
> thửa đệ quy, ADR-066) quyết CHỖ CẮT còn `arcTrace` (ADR-059) quyết HÌNH DẠNG nét cắt — xem
> ADR-064. Hệ quả phải biết: **mọi bảng số đo trên một trong hai nhánh cũ đều đã lạc hậu** (quần
> thể ô nhà dân đi 371 → 432 → **476**), nên đừng chép cột "sau" của Phase 19 hay Phase 20 làm mốc
> nền — tự đo lại (bài học `#43`). Con số ngưỡng thì KHÔNG đổi: vẫn **0 Critical**, **2 mục đúng
> chữ `High`** (`#14`, `#53`) ⇒ **dưới ngưỡng 8–10, KHÔNG cần Maintenance Sprint**.

> **(Mốc trước) 2026-08-24 tối (Phase 20)**: Phase 20 **MỞ 1 mục** (`#90` — khu phố
> làm 4 kỷ thấp đi + kỷ 6 mất chi tiết mái) và **KHÔNG đóng mục nào**. `#89` vẫn MỞ nhưng đã nhẹ
> đi: cổng qua ngưỡng (11,33 → **12,44** ✓) nhờ một dải KHÔNG liên quan tới nguyên nhân, còn dải
> TRỜI — cần gạt thật — vẫn đứng yên ở 4,05. `#52` cũng nhẹ đi (đã vá kiểu báo oan trên ảnh
> nhìn-từ-trên-xuống) nhưng nguyên nhân vết rách vẫn chưa truy được. Đếm lại theo đúng cách đã ghi
> bên dưới: **80 mục · 60 còn mở · 0 Critical**; đếm **đúng chữ `High`** ra **2** (`#14`, `#53`),
> đếm **gộp cả `Medium-High`** ra **6** (`#3`, `#13`, `#14`, `#15`, `#53`, `#89`) — `#90` là
> Medium nên không vào cả hai. Cả hai con số vẫn **dưới ngưỡng 8–10** ⇒ **KHÔNG cần Maintenance
> Sprint**.


> **(Mốc trước) 2026-08-24 chiều (ADR-059)**: thêm **#84** (kỷ 1 và 2 thấp đi
> ~4% sau khi ô nhà dân thành khu phố — đã đếm tường minh) ở mức **Low**; **#85 mở rồi ĐÓNG ngay
> trong phiên** (`road-bend.mjs` đo một đại lượng mà ADR-059 đã thay — và trong lúc vá thì lộ ra
> `--selftest` của nó ĐỎ trên một mạng đường lành, vì đối chứng hỏi sai đại lượng). Đếm lại toàn file bằng cách quét trường
> `**Priority**` của TỪNG mục: **1 mục Priority High còn mở** (#53), **0 mục Critical** → xa ngưỡng
> 8–10 mục, KHÔNG cần Maintenance Sprint.
> **(2026-08-24 tối muộn, sau ADR-058)**: thêm **#83** (ngưỡng "lượn
> bao nhiêu thì mắt đọc ra" chưa hiệu chuẩn) ở mức **Low** — không đụng ngưỡng Maintenance Sprint.
> **(2026-08-24 tối, sau ADR-057)**: **#82 ĐÃ ĐÓNG** — chân giải bằng
> khớp ngược nên cả ba chiều bị cấm đều thành miễn phí. (Ghi chú cũ giữ lại bên dưới.)
> **(2026-08-24 sáng, sau ADR-056)**: thêm **#82** (bộ khớp chỉ có một trục
> quay ⇒ hông không lắc ngang, đai hông không xoay) ở mức **Low**. Trước đó: **#80** (cư dân chiếm
> 0,29% khung hình ⇒ chi tiết cơ thể chỉ đọc được ở cận cảnh) ở mức **Medium** và **#81** (mũ có
> chỏm thừa hưởng phép phóng đại của cái đầu) ở mức **Low**. Đếm lại toàn file bằng cách quét trường
> `**Priority**` của TỪNG mục: **1 mục Priority High còn mở** (#53, đang đóng dần), **0 mục
> Critical** → xa ngưỡng 8–10 mục, KHÔNG cần Maintenance Sprint. ⚠️ Con số này đếm bằng cách quét trường `**Priority**` của TỪNG mục, không chép lại từ
> dòng cũ — dòng ngưỡng bên dưới đã đứng yên từ 2026-08-16 trong khi file nở từ #33 lên #78, đúng
> kiểu "một con số tự trấn an" mà `CLAUDE.md` bắt phải kiểm như mọi con số khác.
>
> **(2026-08-16, sau Phase 9D)**: **#30 và #27 đã ĐÓNG CẢ HAI**
> — đúng như hai mục ấy đã tự nối cứng, chúng là một bài toán duy nhất (*màu là trục DUY NHẤT mang
> bản sắc mặt đường*) và được giải cùng lúc bằng cách mở thêm chín trục cấu trúc, chứ không phải
> bằng cách chỉnh lại con số nào. Nay còn **1 mục High** (#14) + **2 mục Medium-High** (#3, #13) +
> **1 mục Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10 mục, KHÔNG cần Maintenance Sprint.
>
> **Cập nhật 2026-08-21 (Phase 14 §1(3), hình thái khu phố — MỚI NHẤT)**: **MỞ #77**
> (`ROOFTOP_MIN_SPAN` là mức tuyệt đối ⇒ 9/15 kỷ mất một phần chi tiết mái khi nhà dân được chia
> nhỏ; giữ 313/371 ô = 84% — Medium). **RÀ SOÁT #76 đúng hẹn** (Review Trigger của nó là "ngay khi
> bắt đầu §1(3)"): phân bố mái nhà dân KHÔNG đổi, nhưng số khối nhìn thấy tăng từ 371 lên 1812 ⇒
> **Severity Low → Medium**, hoãn có lý do ghi rõ, đặt Review Trigger mới. Nay **2 mục High**
> (#14 · #53), 0 Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 (Phase 14 §1(2), kim tự tháp + ziggurat)**: **MỞ #75** (ziggurat
> kỷ 3 đã có hình ĐÚNG nhưng tỉ lệ mái/thân chỉ 34,6% ⇒ mắt đọc ra "cao ốc đội mũ"; đây là bài toán
> KHỐI TÍCH chứ không phải bài toán MÁI — Medium, cố ý hoãn) và **MỞ #76** (mái NHÀ DÂN chỉ có 3 giá
> trị cho 15 kỷ, trong khi mái kỳ quan đã có 10 — Medium, phải gộp vào §1(3)). Cả hai đều Medium ⇒
> **số mục High vẫn là 2** (#14 · #53), 0 Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 (Phase 13 VIỆC B, vùng phụ cận)**: **MỞ #74** (vùng phụ cận
> không lớn lên theo số phiên ⇒ tín hiệu quy mô nằm NGOÀI vòng lặp phần thưởng — Medium, CHỜ ĐÀM
> QUYẾT, cùng một câu hỏi với #14). **CẬP NHẬT #53**: hướng Đàm chọn (LẤP) nay đã được thực hiện ở
> phần *dấu vết con người*, và ba con số cũ của mục ấy đã được ĐO LẠI. Số mục High vẫn là 2
> (#14 · #53) ⇒ xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 (Phase 13 §2–§3, đo mốc nền)**: **MỞ #71** (khu 3×3 giữ chỗ cho
> HÌNH CHIẾU chứ không cho một ô ⇒ VIỆC A giải phóng 12,2 ô/kỷ chứ không phải 40 — Medium, CHỜ ĐÀM),
> **MỞ #72** (cổng (M2) đã đạt sẵn 15/15 ở mọi mức sàn ⇒ không có răng — Medium, CHỜ ĐÀM) và **MỞ
> #73** (camera buộc cứng vào `gridSize` — Low, cố ý hoãn theo đúng chỉ thị §5 của Đàm). Cả ba đều
> Medium/Low ⇒ **số mục High vẫn là 2** (#14 · #53), 0 Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần
> Maintenance Sprint. ⚠️ Không mục nào được đóng bằng cách nới ngưỡng; hai mục #71 và #72 chính là
> hai điều kiện DỪNG mà Đàm đặt sẵn trong §7, và chúng đã kích hoạt đúng như dự phòng.
>
> **(Mốc trước) Cập nhật 2026-08-21 (ADR-048, «nhớ giá trị nút lưới nhiễu»)**: **MỞ #70** — không có
> cổng nào canh THỜI GIAN dựng cảnh, nên chính bản vá "xoá cái bệ" đã ship kèm một hồi quy 1,7 lần
> trong im lặng (đã vá, xem ADR-048). Priority Medium ⇒ **số mục High vẫn là 2** (#14 · #53), 0
> Critical ⇒ vẫn xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Mốc trước) Cập nhật 2026-08-21 («XOÁ CÁI BỆ»)**: đếm lại bằng máy toàn bộ file ⇒ **2 mục High
> còn mở** (#14 · #53), 0 mục Critical ⇒ **xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint**. (Con số
> "3 mục High" của hai mốc trước đếm cả **#32**, mà #32 đã ở trạng thái Resolved từ 2026-08-17 —
> đính chính, không phải mục nào vừa được đóng.) Trong phiên này: **MỞ #68** (chỉ số bệ chia cho độ
> dốc trong lưới ⇒ ba kỷ cố ý phẳng luôn điểm cao — Low, đã có cột thứ hai để đọc thay) và **MỞ #69**
> (`terrain-score --ngoai` trả về NaN ở 13/15 kỷ vì tiền đề `settle` đã bị gỡ — Low, công cụ đã tự
> khai bệnh). **CẬP NHẬT #53**: nửa "địa thế theo kỷ" nay đã đi thêm một bước lớn — cái BỆ (mặt bàn
> vuông nổi lên) đã bị xoá ở **15/15 kỷ theo cổng mắt**, nhưng **ba con số của #53 (21% khung · 35,1%
> đất trơ · 63,0% là vành ngoài) CHƯA được đo lại** sau ADR-046 nên mục vẫn để **Open**, không tự
> đóng. **KHÔNG mục nào bị đóng bằng cách nới ngưỡng.** ⚠️ Nhắc lại một sự thật đã đo: **kỷ 5 vẫn
> hiện một đường hào VUÔNG** — đó là hình dạng NƯỚC (`#65`, nửa mỹ thuật của `#64`), **không** phải
> một bậc địa hình, nên nó KHÔNG được tính là "bệ chưa xoá xong".


> **(Mốc trước) 2026-08-24 (Phase 19)**: Phase 19 **ĐÓNG 2 mục** (`#24` khung hình cắt công
> trình · `#75` ziggurat đọc ra là khối đội mũ) và **MỞ 1** (`#89`, trục chặng ngày dưới ngưỡng mắt
> — cái giá của ADR-061, đang chờ Đàm chọn hướng). Đếm lại bằng cách quét trường `**Priority**` của
> TỪNG mục rồi loại mục đã đóng: **79 mục · 59 còn mở · 0 Critical**. High thì phải nói rõ cách
> đếm, vì đây đúng chỗ dòng này đã trôi một lần: đếm **đúng chữ `High`** ra **2** (`#14`, `#53`);
> đếm **gộp cả `Medium-High`** ra **6** (`#3`, `#13`, `#14`, `#15`, `#53`, `#89`). Cả hai con số
> đều **dưới ngưỡng 8–10** ⇒ **KHÔNG cần Maintenance Sprint**. ⚠️ Lần trước dòng này ghi "1 mục
> High" mà không nói đếm kiểu gì, nên không ai tái lập được — một con số nghiệm thu phải đi kèm
> cách đo ra nó, kể cả khi con số ấy chỉ nằm trong một dòng tài liệu.

> **(Mốc trước) Cập nhật 2026-08-20 (§1(B))**: đếm lại ⇒ **3 mục High còn mở** (#14 · #32 · #53),
> 0 mục Critical ⇒ **xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint**. Trong phiên §1(B): **MỞ #66**
> (kỷ 12 không phản ứng với hạt giống nhiễu — Low, đã đo là dưới ngưỡng mắt) và **MỞ LẠI MỘT PHẦN
> #59** cho kỷ 4 và 5 (cổng "thấy nước" tệ đi vì một bản vá ĐÚNG về vật lý; nguyên nhân khác hẳn ba
> kỷ 6·7·10 nên hướng chữa cũng khác ⇒ **CHỜ ĐÀM QUYẾT**). Không mục nào bị đóng bằng cách nới ngưỡng.
>
> **(Mốc trước) Cập nhật 2026-08-20 (nghiệm thu Bước C)**: đếm lại bằng máy toàn bộ file ⇒ **3 mục
> High còn mở** (#14 · #32 · #53), 0 mục Critical ⇒ **xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint**.
> Trong phiên này: **ĐÓNG #56** (12 kỷ chưa dựng nước) và **ĐÓNG #62** (tiền đề sai — kỷ 4 chưa bao
> giờ vượt cổng); **MỞ #63** (phép tia mù với cây cối ⇒ cổng nước thật là 5/14 chứ không phải 11/14),
> **#64** (kỷ 5 là một hòn đảo — khuyết tật SẢN PHẨM thật, đã xác nhận bằng ảnh), **#65** (`canal`
> và `estuary` không có hình học riêng); **CẬP NHẬT #55** (trục chặng 13,96 — đã chạm điều kiện
> "< 14", nhưng chẩn đoán cũ bị chính số đo bác bỏ) và **#61** (phép thay thế "chiều dài đường bờ"
> đã ĐO và PHẢI BÁC — nó tương quan NGƯỢC với khả năng đọc ra). Bốn mục **#55 · #61 · #64 · #65**
> đều đã chuẩn bị sẵn phương án, **CHỜ ĐÀM QUYẾT**, không tự chọn.
>
> **Cập nhật 2026-08-20 (Đàm trả lời bốn mục — mới nhất)**: **ĐÓNG #64** (kỷ 5 nay có eo đất rộng
> 1,40 ô = `2×(MEANDER_NECK − SHORE_BAND)` và hào đã bo góc: tỉ số chéo/trục 1,3543 → 1,0215; 7 phép
> phá đều đỏ đúng chỗ đã nêu trước). **#61** thôi là một mục nợ — cổng 5% GIỮ NGUYÊN, và con số thật
> *"5/14 đủ diện tích · **14/14 đọc ra được** (tương phản 30,8–115,5 trên ngưỡng mắt 12)"* nay được
> ghi như một **SỰ THẬT ĐÃ ĐO**, không phải một câu hỏi treo. **#55 HOÃN** (đơn thuốc cũ đã bị số đo
> bác bỏ; mặt trận hình ảnh sắp tới rất có thể tự nâng dải trời + dải thành phố ⇒ đo lại SAU). **#65
> HOÃN** tới sau mặt trận hình ảnh, và nay nó **gánh thêm nửa còn lại của #64** (hình `meander` vẫn
> là một vành đai đều bề rộng ôm quanh hình vuông, chưa đọc ra là một khúc suối).
>
> **Cập nhật 2026-08-20 (chốt #57 — `worldYaw`)**: **ĐÓNG #57**, mở **#59**. Đàm bác cả bốn hướng
> đã đề xuất (*"KHÔNG SỬA CAMERA, KHÔNG SỬA `side`. SỬA THỨ THỨ BA"*) — cả bốn đều hy sinh một
> trong hai vế, trong khi thứ sai là **quan hệ giữa chúng không ai sở hữu**. Đóng bằng ADR-041.
> #59 là phần TRẦN của cùng bài toán: ba kỷ nước hẹp (6, 7, 10) không đạt cổng 5% ở BẤT KỲ góc nào
> — biết TRƯỚC khi Bước C tiêu ngân sách, đúng bài học §2-C. Nay còn **1 mục High** (#14) +
> **2 mục Medium-High** (#3, #13) + **1 chờ Đàm** (#24) + **#59 Medium** → xa ngưỡng 8–10.

> **Cập nhật 2026-08-18 (Việc 1 — chốt #38)**: **ĐÓNG #38** ngay trong ngày mở. Đàm bác đề xuất
> "nâng trần chung lên 14" và chọn **15 mốc riêng từng kỷ** + đối chứng bắt buộc; hoá ra cách ấy
> **không cần đụng `materials.js`** (cổng chỉ ĐỌC bảng vật liệu), nên cái tưởng là blocker thật ra
> là hệ quả của việc đề xuất sai giải pháp. Nay còn **1 mục High** (#14) + **2 mục Medium-High**
> (#3, #13) + **1 mục Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10, KHÔNG cần Maintenance
> Sprint.
>
> **Cập nhật 2026-08-18 (Phase 12 / Việc 1 — đường sá, nguyên nhân 1)**: **MỞ #42, Priority
> Medium** — vỉa hè bị cái kẹp `walk ≤ 0,5 − half` bóp trong im lặng trên ĐẠI LỘ ở **8/15 kỷ**, tệ
> nhất còn **11%** bề rộng đã khai (kỷ 12 khai "vỉa hè mênh mông" mà dựng ra 0,02 ô). Phát hiện
> trong lúc sửa mép đường; phần chặn lời hứa "hết bậc" đã sửa ở ADR-031, phần còn lại là quyết định
> mỹ thuật ⇒ chờ Đàm. Nay còn **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết**
> (#24, #41, #42) = 6 → vẫn dưới ngưỡng 8–10, chưa cần Maintenance Sprint, nhưng **đã có ba mục
> liên tiếp bị chặn bởi cùng một lý do (quyết định mỹ thuật)** — nếu con số này lên 4 thì nên gộp
> thành một lượt hỏi Đàm duy nhất thay vì hỏi lẻ.
>
> **Cập nhật 2026-08-19 (§3a — sai số hộp bao)**: **ĐÓNG luôn câu hỏi hộp bao, nhưng KHÔNG theo
> cách cố vấn đoán.** Cố vấn bảo *"giữ hộp bao, đo sai số một lần, dưới ~5 điểm phần trăm thì đóng
> vĩnh viễn"*. Đo ra **11,10 đpt trung bình, tới 24,47 đpt** — không đóng được, phải sửa. Tách ba
> nguồn: **6,11 đpt** do LUẬT TÔ *"ô mẫu bị chạm vào là tô trọn"* (không liên quan gì tới hộp bao —
> đó là sai số của chính cái bút vẽ) · **4,86 đpt** do tô hộp bao CẢ công trình (sân giữa bốn tháp
> góc bị tính là nhà) · **0,13 đpt** do hình từng khối. ⇒ Phần cố vấn dự đoán là nguồn sai số hoá ra
> là phần **duy nhất không đáng lo**. `planCoverage` nay tô **đa giác đáy thật, luật tâm ô, lưới 16
> mẫu/ô**; bản cũ giữ lại tên `planCoverageCu` chỉ để đối chứng. ⚠️ **Bảng mật độ mặt bằng cũ
> (26,6 / 48,8 / 72,4%) KHÔNG so trực tiếp được** với bảng mới (**20,1 / 37,6 / 55,8%**).
> Khoá bằng `scripts/planCoverage.test.js` (5 bài, 6/7 phép phá đỏ đúng chỗ đã nêu trước; phép phá
> thứ 7 không đỏ và đã đo chứng minh nó là TỊNH TIẾN lưới lấy mẫu chứ không phải sai số).
>
> **Cập nhật 2026-08-19 (§1 — vá #49)**: **ĐÓNG #49** (ảnh nay cắt đúng hộp bao canvas qua CDP
> `clip`, không còn cờ đoán nào) và **MỞ #50, Priority Medium** — `md5sum` ảnh dựng đổi theo TẢI
> MÁY (±1 trên ~2% điểm ảnh), nên nó chỉ chứng minh được một chiều. Số mục High/Critical KHÔNG đổi:
> **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41, #42) = 6, vẫn
> dưới ngưỡng 8–10.
>
> **Cập nhật 2026-08-19 (VIỆC 2 Bước B — mặt nước)**: **MỞ #56** (Low, dở dang CÓ CHỦ Ý — 12 kỷ khai
> có nước mà chưa dựng hình, đã khoá bằng `assert.deepEqual(ERAS_WITH_WATER_GEOMETRY, [12, 14])`),
> **#57** (**High**, chờ Đàm quyết — camera mặc định quay lưng lại bờ nước; kỷ 14 chỉ thấy 0,09% mặt
> biển trong khi trần là 31,43%) và **#58** (Medium — ảnh rộng >1300px có thể nhiễm một khối chữ
> nhật mà cổng chống-rách không thấy). ⚠️ **#57 là mục High THỨ HAI**, nên nay còn **2 High** (#14,
> #57) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41, #42) + **2 Medium** (#43, #58)
> = 9 → **ĐÃ CHẠM DẢI NGƯỠNG 8–10**. Nhưng đọc kỹ thì 4/9 mục đang chờ **quyết định của Đàm** chứ
> không chờ công sức kỹ thuật (#57, #24, #41, #42), tức một Maintenance Sprint sẽ không đụng được
> vào chúng. ⇒ **Đề xuất đúng không phải mở Sprint mà là gom MỘT lượt hỏi Đàm duy nhất** — đúng
> điều bản cập nhật 2026-08-18 đã dự báo (*"nếu con số này lên 4 thì nên gộp thành một lượt hỏi
> duy nhất thay vì hỏi lẻ"*); con số ấy nay **đúng là 4**.
>
> **Cập nhật 2026-08-18 (Phase 12 — đo mốc nền)**: **MỞ #43, Priority Medium** — `PERFORMANCE.md`
> KHÔNG có gì máy đọc được canh, và nó đã trôi thật: Phase 11-B sửa hình học mái rồi không cập nhật
> tài liệu, để **6/15 kỷ sai số tam giác** suốt từ đó. Cột lệnh vẽ thì có `drawCallBudget.test.js`
> canh nên vẫn đúng — tức chỗ có test thì không trôi, chỗ không có test thì trôi, ngay trong cùng
> một bảng. Nay còn **1 High** (#14) + **2 Medium-High** (#3, #13) + **3 chờ Đàm quyết** (#24, #41,
> #42) + **1 Medium** (#43) = 7 → vẫn dưới ngưỡng 8–10, nhưng chỉ còn cách một mục.
>
> **Cập nhật 2026-08-18 (Phase 11 — mái, ĐO ẢNH XONG)**: **MỞ #41, Priority Medium** — phase thêm
> 110.076 tam giác lên mái mà **bản quét 15 kỷ vẫn không phân biệt được với bản trước** (90/90 ô
> dưới ngưỡng mắt 12, trung vị 2,2), tức **KHÔNG đạt** điều kiện nghiệm thu Đàm đặt ra. Chi tiết có
> thật ở thang gần (1,2–8,4% điểm ảnh ở khung app; 15,1% khi zoom sát mái kỷ 9) nhưng không sống
> sót tới thang quét. Đo được thêm một quy luật dùng được cho Phase 12: **thứ phá ĐƯỜNG VIỀN sống
> sót, thứ chỉ thêm BỀ MẶT thì không** — kỷ 8 tốn nhiều hình học nhất (+48,5%) mà đổi ít nhất
> (1,2%). ⛔ Cách chữa là quyết định MỸ THUẬT ⇒ **chờ Đàm**, không tự phóng to. Nay còn **1 High**
> (#14) + **2 Medium-High** (#3, #13) + **2 chờ Đàm quyết** (#24, #41) = 5 → vẫn xa ngưỡng 8–10.
>
> **Cập nhật 2026-08-18 (Phase 11 — mái)**: **MỞ #39 và #40**, cả hai Priority **Low**. #39 =
> `crownWeight` là trục mỏng (6/105 cặp) và với `barrel` thì bước lượng hoá còn rộng hơn cả dải hợp
> lệ — đã khoá sự thật ấy bằng một `assert` tự đỏ nếu có kiểu thứ hai rơi vào. #40 = `parts.js`
> không có `rx`/`rz` nên ngói ống là phép xấp xỉ. Cả hai đều là **giới hạn đã biết có điều kiện xem
> lại**, không phải lỗi. Nay còn **1 mục High** (#14) + **2 Medium-High** (#3, #13) + **1
> Medium-High chờ Đàm quyết** (#24) = 4 → xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **Cập nhật 2026-08-18 (Phase 10, Bước 2)**: **ĐÓNG #36** — cả 15 kỷ nay đều có cửa ra vào thật,
> kể cả kỷ 1 và 2. **MỞ #38** (Priority Low-Medium): đo đủ 15 kỷ lần đầu tiên thì lộ ra **kỷ 10 =
> 14 lệnh vẽ**, tức vượt cái trần "13" mà cổng nghiệm thu đang dùng — nhưng nó **đã như vậy từ
> trước Phase 10** (đo trên `HEAD` cũng ra 14), nên đây là một **con số nền chưa từng được đo**,
> không phải hồi quy. Sửa nó phải đụng `materials.js`, nằm ngoài phạm vi file được phép của chương
> trình hiện hành ⇒ ghi nợ, không tự sửa. Ngoài ra Bước 2 phát hiện hai chuyện đáng ghi nhưng cả
> hai đều đã xử lý ngay trong phiên nên không thành nợ: (a) kỷ 14 khai `doorWidth` vượt trần khiến cả
> kỷ ấy **mất cửa trong im lặng** — validator từ chối đúng, `emitGroundFloor` trả `false` đúng, và
> không gì đỏ lên; nay có một assert bắt "khai hợp lệ nhưng không dựng ra khối nào"; (b) kỷ 4 và
> kỷ 6 chỉ khác nhau **1/8 trục** tầng trệt — sửa BẢNG (kỷ 4 lùi cửa sâu hơn, mở rộng hơn, đúng
> quy chế điện cung đình) chứ không hạ sàn. Số mục High vẫn là **1** (#14) — #38 là Low-Medium nên
> không đổi ngưỡng; tổng vẫn **5 mục**, vẫn xa ngưỡng 8–10.
>
> **(Ảnh chụp trước đó, Phase 10 Bước 1)**: mở **#36** (Priority **Medium** — kỷ 1 và 2 vẫn chưa
> có cửa; nguyên nhân gốc đã sửa, tự đóng khi Bước 2 chạy) và **#37** (Priority **Low** — cửa sổ
> không xoay theo độ nghiêng thân nhà, sai số hiện dưới một điểm ảnh). Không mục nào là High/
> Critical ⇒ số mục High vẫn là **1** (#14), vẫn xa ngưỡng.
>
> ⚠️ **Phase 9D KHÔNG mở mục nợ mới**, nhưng có ghi hai bài học vào `CLAUDE.md` (công cụ đo tự chế
> nói dối lần thứ 20 và 21 — cả hai đều nằm trong công cụ vừa viết ra trong chính phiên ấy).
>
> **Cập nhật 2026-08-17 (Performance Gate)**: mở **#31** (Priority **Low** — bản đồ bóng sống sót
> qua `city.dispose()`; app hiện KHÔNG dính vì mỗi cảnh một renderer riêng, nhưng là mìn hẹn giờ
> nếu sau này có ai dùng lại renderer giữa các kỷ) và **#32** (đồng hồ đo HUD báo thiếu 56% số tam
> giác — **ĐÃ SỬA ngay trong phiên**, ghi lại vì nguyên nhân gốc là một hình dạng sai đã tái diễn
> lần thứ hai). Số mục High/Critical **KHÔNG đổi**: vẫn 1 mục High (#14) + 3 mục Medium-High
> (#3, #13, #24) → xa ngưỡng 8–10, KHÔNG cần Maintenance Sprint.
>
> **(Ảnh chụp trước đó, sau Phase 9B)**: thêm **#30** (Medium-High —
> mặt đường render DƯỚI ngưỡng mắt đọc được xét riêng vật liệu; đã có bản vá đo xong nhưng CỐ Ý
> chưa ship vì nó làm đỏ một lời hứa đang có). ⚠️ **#30 và #27 nay là MỘT cặp phải làm cùng nhau** —
> #30 phơi ra rằng lời hứa "15 kỷ ra 15 mặt đường" xưa nay chỉ đạt nhờ **3% biên**, và đạt được
> chính nhờ khuyết tật mà #30 phải sửa. Nay là **1 mục High** (#14) + **4 mục Medium-High**
> (#3, #13, #24, #30) = 5 → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint, nhưng đã
> đi được nửa đường tới đó; nếu phase sau lại thêm một mục Medium-High nữa thì phải cân nhắc.
>
> **(Ảnh chụp trước đó, sau Phase 8D)**: thêm **#29** (Low — cọ nhìn
> từ đúng trên xuống dẹt thành dấu "✳", do `parts.js` không nghiêng được khối; đã giảm nhẹ ở 8D,
> ĐỪNG vá nếu chỉ vì cây cọ). Vẫn **1 mục Priority High**
> (#14) → vẫn CHƯA đạt ngưỡng 8–10 mục để đề xuất Maintenance Sprint. Còn **3 mục Medium-High**
> (#3, #13, và **#24**: 14/15 kỷ có công trình bị mép khung hình cắt, đã đo đủ, chờ Đàm chọn
> hướng). **#28 đã ĐÓNG CẢ HAI PHẦN** — cạnh sắc ở Phase 8B, bàn cờ ô vuông ở Phase 8C.
> Còn **4 mục Medium** và **2 mục Low** (#25 — nhà dân nhỏ nhất ở 3 kỷ không có cửa sổ; **#27**
> — 3 cặp kỷ có mặt đường gần trùng nhau vào BAN ĐÊM, đều cách nhau ≥3 kỷ, đã đo đủ và có
> chủ đích chưa xử lý).
> ⚠️ **#26 và #23 đóng được bằng CÙNG MỘT lần đo, và mảng 8 đã làm nó GẤP HƠN BỐN LẦN**: sau 7C
> cảnh nặng nhất là 21.244 tam giác; **8A → 24.532 (41%)**, **8B → ~29.000 (48%)**, **8C → ~36.100
> (60%)** trần 60.000. Cổng hiệu năng iPhone **chưa được cân lại kể từ trước Phase 7A** — tức đã
> BỐN phase liền cộng tải lên một con số chưa ai kiểm, và phase mới nhất là phase đắt nhất
> (+4.800 tam giác cho địa hình). Một ảnh chụp HUD trên máy Đàm đóng cả hai. ⚠️ Đàm đã chỉ thị rõ
> **không được lấy blocker này làm lý do dừng cải thiện hình ảnh** — nên vẫn làm tiếp, nhưng đây
> nay là mục cần đo GẤP NHẤT: nếu iPhone không gánh nổi thì `SUB = 3` ở `terrainMesh.js` là cái núm
> hạ tải rẻ nhất (SUB 3 → 2 cắt 6.498 xuống 2.888, tức trả lại gần hết khoản chi của 8C).
> ⚠️ **CẬP NHẬT 2026-08-16 — #22 VÀ #19 ĐỀU ĐÃ ĐÓNG.** #22 vá gốc bằng cách **bỏ hẳn** proxy "mái"
> (lưới 6×3 ô con ở `scripts/sweepMetric.mjs`, không còn giả định mỹ thuật nào để mà hỏng lần nữa);
> #19 nhờ đó đo lại được và **cả 105 cặp kỷ đều trên ngưỡng mắt** (gần nhất 23,3 · trung vị 41,1).
> ⚠️ Hai bộ số của #19 **KHÔNG so trực tiếp được** (cũ đo màu mái, mới đo cả dải thành phố) — chi
> tiết ở đầu mục #19. Nay còn **hai mục Medium**: **#26** và **#23** (cổng hiệu năng iPhone chưa đo
> lại sau khi đổi sang PBR). **#15, #16, #17 và #20 đều đã đóng** — không còn mục nào chờ Đàm chọn
> hướng mỹ thuật.
> ⚠️ **#22 là ví dụ sạch nhất trong cả file này của một luật đáng nhớ**: *sửa đúng mã sản phẩm vẫn
> có thể làm HỎNG công cụ đo*, vì công cụ đo bao giờ cũng đứng trên vài giả định không được viết ra
> về thứ nó đang đo. Ở đây giả định ngầm là *"mái là thứ tươi nhất khung hình"* — đúng suốt thời kỳ
> mái suy từ màu nhấn giao diện, và chết ngay khi mái thành vật liệu lợp thật. **Bài học rút ra khi
> đóng nó còn quan trọng hơn**: đừng vá một proxy hỏng bằng một proxy khôn hơn — hỏi lại xem nó
> sinh ra để giải bài toán gì, rồi giải thẳng bài toán đó, để không còn proxy nào mà hỏng.
> ⚠️ **#17 LÀ VÍ DỤ THỨ HAI CỦA ĐÚNG CÁI BẪY MÀ BÀI HỌC #16 DƯỚI ĐÂY CẢNH BÁO** — và lần này nặng
> hơn: mục đó không chỉ ghi nhầm một lỗi thành "đánh đổi cần Đàm quyết", nó còn **chẩn đoán nhầm
> hẳn chặng ngày** (đổ cho chặng chiều, trong khi cặp hỏng thật là bình minh ↔ hoàng hôn). Nguyên
> nhân: đo đúng MỘT trục (góc màu của dải trời) rồi kết luận về cả bức tranh. Đọc phần đóng khung
> ở đầu #17 trước khi viết bất kỳ mục nợ mỹ thuật nào.
> ⚠️ **CÒN MỘT mục đang CHỜ ĐÀM QUYẾT, không phải chờ AI làm**: #14 (phiên im lặng — cân bằng
> game). **Đã nhẹ đi thật, đo lại 2026-08-14: 95% → 80–85%** (Phase 4I + Phase 5D). Nhưng phần còn
> lại **không sửa được bằng mã**: sau phiên thứ 44 của mỗi kỷ, thành phố hết chỗ để lớn thật, nên
> nói thêm câu nào cũng là bịa. Câu hỏi cho Đàm nay đã thành câu hỏi CÓ/KHÔNG, không còn là "vá thế
> nào" — xem cuối mục #14. Review Trigger của nó vẫn chặn các khoản đầu tư kế tiếp vào lễ mừng.
> ⚠️ **BÀI HỌC TỪ #16 — ĐỌC TRƯỚC KHI GHI MỘT MỤC NỢ MỚI LÀ "ĐÁNH ĐỔI CẦN NGƯỜI QUYẾT"**: #16 từng
> được ghi vào đây là *"đánh đổi thẩm mỹ, chờ Đàm quyết"*, vì chú thích tại chỗ tuyên bố nó có chủ
> đích. Nhưng chú thích ấy tuyên bố **HAI** ý định, không phải một — và ý định thứ hai (*"thành phố
> lộ ra rõ nhất ở khoảng trống phía dưới, đúng chỗ chẳng có chữ gì"*) **đang không đạt**. Đo chỗ chữ
> thật đứng thì hoá ra không có gì phải đánh đổi cả. ⇒ Trước khi kết luận "cần người quyết", hãy
> kiểm xem mã có đang làm ĐÚNG điều nó tự nhận không; một trade-off chỉ có thật khi cả hai vế đều
> đã đạt và phải hy sinh một vế.
> ⚠️ **Vế THỨ HAI của ngưỡng ĐÃ CHẠM và đã được XỬ LÝ MỘT PHẦN**: `palette3d.js` đã qua **5 đợt** vá
> mỹ thuật (3C · 3G · 3M · 3N · 3V). Phase 3V không vá riêng bầu trời mà **sửa đúng phép toán dùng
> chung** (`skyward()` chuyển từ trộn RGB sang xoay sắc, cùng khuôn đã dùng cho mái nhà ở 3N) — tức
> đã đi theo khuyến nghị "xem xét tổng thể" thay vì vá điểm.
> **Phần CHƯA làm của khuyến nghị đó**: mặt đất và nước vẫn còn vài chỗ trộn RGB. Chưa thấy triệu
> chứng nào ở 180 ô vừa quét, nên KHÔNG mở mục nợ mới — nhưng nếu xuất hiện **đợt vá thứ 6** cho
> `palette3d.js` thì lần đó phải là một đợt rà soát toàn bộ phép trộn màu còn lại, không vá tiếp.
> ⚠️ **#14 là nợ THIẾT KẾ, không phải nợ mã** — không có gì hỏng, nhưng nó chặn giá trị của mọi đầu
> tư về sau vào lớp thành phố (95% số phiên không thấy lễ mừng). Nó **cần Đàm chọn hướng** trước
> khi bất kỳ phiên AI nào động vào, vì mọi phương án đều đổi cân bằng kinh tế.
> ⚠️ **Cảnh báo quy trình từ mục #13**: một khoản nợ đã bị TÀI LIỆU CHE MẤT nhiều tháng — sổ ghi
> "lưới test đã có, chỉ chưa cắm vào" trong khi thực tế chưa từng có file nào. Khi đọc bất kỳ mục
> nào trong sổ này mà nó khẳng định "đã có sẵn X", hãy **kiểm bằng lệnh trước khi tin** (`git log
> --all --diff-filter=A -- '<đường dẫn>'` / `find`). Sổ nợ mà ghi sai thì còn nguy hơn không có sổ.
> *(Lịch sử của mốc trên, giữ lại để thấy nó tới từ đâu: `palette3d.js` qua 3C ánh sáng · 3G bảng
> quét · 3M sắc độ đêm · 3N màu mái — bốn đợt, đều tìm ra lỗi THẬT bằng phép đo, nên khi đó CHƯA
> phải "vá đi vá lại một chỗ"; `daylight.js` qua 3 đợt 3D · 3G · 3M. Mốc đặt ra khi đó là "đợt thứ
> 5 cùng loại thì dừng xem xét tổng thể" — #15 chính là đợt thứ 5 đó.)*

---

---

## Additional closed entries found 2026-09-06 (night)

> Their titles already said ĐÃ ĐÓNG / RESOLVED but they were still sitting in the active file.

## #18 — ĐÃ ĐÓNG (2026-08-13) · Kỷ 12–14 không hề có bề mặt nào mang màu kỷ

> ⚠️ **ĐÍNH CHÍNH (2026-08-13, cùng ngày, muộn hơn)**: dòng "0/105 ✅" trong bảng bên dưới **chỉ
> đúng với phép đo lúc đó**, không phải một lời bảo đảm chung. Đo lại bằng `scripts/sweep-score.mjs`
> (công cụ mới, có `--selftest` chứng minh bộ lọc mái thật sự chạy: bỏ lọc thì tụt về 51/105) ra
> **2/105 cặp dưới ngưỡng**. Hai phép đo khác nhau ở cách chuẩn hoá khoảng cách và ở ranh giới dải,
> nên **không cái nào "sai"** — nhưng con số 0/105 không được đọc như "đã xong vĩnh viễn". Việc mà
> #18 tuyên bố là đã làm (kỷ mái bằng nay có bề mặt mang màu kỷ) thì vẫn đúng và vẫn đứng. Phần còn
> lại chuyển sang **#19**. 👉 Bài học: **một con số nghiệm thu phải đi kèm CÔNG CỤ đã đo ra nó** —
> ghi mỗi kết quả mà không ghi cách đo thì phiên sau không thể tái lập, và sẽ tưởng là đã đóng.

- **Module**: `src/engine/city3d/buildingSpec.js` — nhánh `case 'flat'` của `roofParts`.
- **Priority / Severity**: Medium / Low-Medium (thuần mỹ thuật) — **đã xử lý xong trong ngày**.
- **Triệu chứng**: duyệt đủ 105 cặp kỷ trên ảnh thật, kỷ 12 ↔ 13 chỉ cách **6,4/255** (ngưỡng mắt
  ~12), và ba trong bốn cặp yếu nhất đều dính kỷ 12 hoặc 13.
- **Root Cause — KHÔNG phải màu, và đây là chỗ đáng học.** Nhánh `'flat'` đẩy ĐÚNG MỘT khối với
  `role: 'trim'` — vai TRUNG TÍNH thuộc họ tường, chỉ ngấm 0,18 sắc kỷ. Ba kỷ 12/13/14 đều dùng
  `roof: 'flat'`, nghĩa là **cả ba chưa bao giờ hiện lấy một milimét vuông vai `roof` nào**. Bảng
  màu hoàn toàn đúng, ánh sáng hoàn toàn đúng, bài test "15 kỷ ra 15 màu mái" xanh suốt — vì nó đo
  MÀU TRONG BẢNG chứ không hỏi màu ấy có được đem VẼ RA hay không.
  ⇒ **Một bài test về BẢNG MÀU không bao giờ thay thế được một bài test về việc màu đó có xuất hiện
  trong HÌNH HỌC hay không. Hai câu hỏi khác nhau, và khoảng trống giữa chúng đủ chỗ cho ba kỷ.**
- **Giải pháp đã làm**: giữ nguyên gờ chắn mái trung tính ở vành ngoài (đó là bê tông/đá ốp thật),
  thêm một **tấm phủ hẹp hơn (0,94) mang vai `roof`** nằm trong lòng nó — đúng cấu tạo mái bằng
  ngoài đời: diềm parapet một vật liệu, sàn mái chống thấm một vật liệu khác. Nhìn từ góc camera
  chúc xuống của thành phố này thì sàn mái là một mảng RẤT to.
- **KẾT QUẢ ĐO LẠI** (105 cặp kỷ, dải thành phố, trung bình 6 chặng):

  | | trước phiên này | sau `eraRoof` 0,55 | sau tấm phủ mái bằng |
  |---|---|---|---|
  | số cặp DƯỚI ngưỡng mắt | 5/105 | 4/105 | **0/105** ✅ |
  | cặp gần nhau nhất | 6,0 | 6,0 | **12,6** |
  | trung vị 105 cặp | 27,9 | 27,6 | **28,2** |

  ⇒ **Cả 105 cặp kỷ nay đều phân biệt được**, cùng với cả 15 cặp chặng ngày (nhỏ nhất 29,5).
- **Bài test khoá lại** (`buildingSpec.test.js`): mọi bản vẽ × mọi kỷ × cả 3 cấp đều phải có ít
  nhất một phần mang vai `roof`, cộng một bài riêng cho các kỷ mái bằng. Đã thử ngược (gỡ tấm phủ)
  và thấy **báo đỏ, gọi đích danh kỷ 12**.
- **Status**: **CLOSED 2026-08-13.** 510/510 test xanh · lint sạch · build xanh.

---

## #17 — ĐÃ ĐÓNG (2026-08-13) · Bình minh và hoàng hôn là CÙNG MỘT BỨC ẢNH

> ⚠️ **MỤC NÀY TỪNG CHẨN ĐOÁN SAI, VÀ CÁI SAI ĐÓ ĐÁNG GHI LẠI HƠN CẢ LỖI.** Bản đầu (viết cùng
> ngày, sớm hơn vài giờ) đặt tên mục là *"Chặng CHIỀU là chặng xấu nhất trong ngày"*, kết luận
> rằng có **hai hướng mỹ thuật khác hẳn nhau cần Đàm chọn**, rồi DỪNG LẠI chờ. Cả ba phần đều sai:
> chặng chiều không phải chặng tệ nhất, không có hai hướng nào cả, và không có gì để chờ.
>
> **Vì sao sai: đo một trục rồi kết luận về cả bức tranh.** Bản đầu đo GÓC MÀU của dải trời, thấy
> ba chặng ấm (bình minh 33° · chiều 43° · hoàng hôn 25°) nằm gọn trong 20°, và suy ra "một nửa số
> chặng trong ngày là cùng một cảnh". Nhưng góc màu chỉ là MỘT trong ba thành phần của màu, và dải
> trời chỉ là MỘT trong ba dải của khung hình. Đo lại bằng vector 9 chiều (trời + thành phố + đất,
> mỗi dải 3 kênh, trung bình 15 kỷ) thì bức tranh lật ngược hẳn:
>
> | cặp chặng | khoảng cách cả cảnh (0–255) | kết luận |
> |---|---|---|
> | **bình minh ↔ hoàng hôn** | **5,9** | dưới ngưỡng mắt (~12) ⇒ **ĐÚNG LÀ MỘT BỨC ẢNH** |
> | chiều ↔ hoàng hôn | 37,6 | cách nhau rõ |
> | chiều ↔ bình minh | 42,1 | cách nhau rõ |
>
> Tức chặng chiều chưa bao giờ là vấn đề "trùng lặp" — nó chỉ ĐỤC (độ tươi 0,25, ra kaki chứ không
> ra vàng), là một lỗi nhỏ và có một cách sửa đúng duy nhất. Còn cặp thật sự trùng nhau thì bản đầu
> **không hề nhắc tới**, vì hai chặng đó góc màu 33° và 25° — trông đã "khác nhau 8°" trên bảng.
>
> ⇒ **Bài học, và nó tổng quát hơn mỹ thuật:** khi kết luận là *"hai thứ này giống nhau"*, phép đo
> phải phủ HẾT những gì mắt nhìn thấy. Đo một trục thì sẽ vừa **báo nhầm** (chiều bị kết tội oan)
> vừa **bỏ sót** (bình minh ↔ hoàng hôn thoát). Và cái sau nguy hiểm hơn nhiều, vì nó im lặng.
>
> **Và vì sao việc "chờ Đàm chọn" là sai:** dự án đã có sẵn luật cho đúng tình huống này
> (`CLAUDE.md`, bài học Phase 3X) — *"một trade-off chỉ có thật khi CẢ HAI vế đều đã đạt và buộc
> phải hy sinh một vế"*. Ở đây không vế nào đạt: chú thích hứa "chiều vàng" mà ra kaki, tức là một
> **lỗi**, và sửa lỗi thì không cần xin phép. Đưa cho Đàm một lựa chọn giả rồi dừng lại chỉ làm mất
> thời gian của anh và để nguyên bức tranh hỏng trên máy anh thêm một vòng nữa.

- **Module**: `src/engine/city3d/daylight.js` (`DAYLIGHT_PROFILES`), `daylight.test.js`,
  `src/components/city/render3d/sceneGraph.js` (sương mù).
- **Priority / Severity**: Medium / Medium (thuần mỹ thuật) — **đã xử lý xong**.
- **Root Cause**: hồ sơ `dawn` và `dusk` không được THIẾT KẾ riêng, chúng được chép ra từ nhau rồi
  chỉnh vài phần trăm ở mỗi tham số (cao độ 0,22 vs 0,18 · ấm 0,85 vs 1,00 · chân trời 18° vs 10° ·
  lực kéo 0,70 vs 0,78 · tươi 1,15 vs 1,25). Không ai chọn cho chúng giống nhau.
- **Vì sao không bài test nào bắt được**: bài *"hai chặng liền nhau không được giống nhau"* duyệt
  danh sách `DAY_PHASES` **theo thứ tự**, tức chỉ các cặp KỀ NHAU. `dawn` ở đầu và `dusk` ở cuối
  nên không bao giờ được đem so với nhau. **Đây là lần thứ HAI cùng một hình dạng sai xuất hiện
  trong chính file test đó** (lần trước: bài "hành trình màu" tính cả `night` nên bộ số hỏng vẫn
  qua). Luật rút ra, nay đã thành mã: **bất biến kiểu "các thứ này phải khác nhau" phải duyệt TỔ
  HỢP ĐÔI, không được duyệt danh sách theo thứ tự** — duyệt theo thứ tự là cái phễu, không phải
  hàng rào.
- **Giải pháp đã làm** — tách hai chặng ở NĂM trục cùng lúc, neo vào một sự thật khí quyển duy
  nhất (*qua đêm thì bụi lắng xuống, hơi nước đọng lại*):
  - **Sương theo giờ** (`haze`, trường mới + hàm thuần `fogRangeFor`). Trước đây sương là hằng số.
    Đây là thứ đóng góp gần như toàn bộ kết quả — tắt riêng nó ra rồi bật lại (giữ nguyên mọi tham
    số khác): **17,2 → 75,1**. Lý do nó hiệu quả: sương lấy MÀU CHÂN TRỜI, nên nó sơn lại cả mảng
    nền phía sau và quanh thành phố bằng sắc của buổi đó.
    ⚠️ **ĐO CHÍNH XÁC NÓ LÀM GÌ, VÀ KHÔNG LÀM GÌ** — nền/chân trời **12,9 → 74,6**; dải THÀNH PHỐ
    **8,4 → 3,3** (GIẢM, không tăng); mặt đất 7,2 → 7,2 (không đổi). Toàn bộ khoảng cách đến từ
    phần NỀN, không từ các công trình — đúng như thiết kế, vì sương cố ý bắt đầu SAU rìa thành phố.
    Và việc nhà cửa ở gần trông na ná nhau ở hai đầu ngày là **đúng vật lý** (cùng một mặt trời
    thấp, cùng một thứ ánh sáng ấm), không phải thiếu sót: ngoài đời cũng vậy, thứ cho ta biết đang
    là sáng hay chiều là bầu trời và sương, không phải màu bức tường trước mặt.
    ⚠️ Bản chú thích đầu tiên viết ngược điều này ("sương quét sắc lên chính những công trình ở xa
    nên cuối cùng chạm được vào dải THÀNH PHỐ") — nghe rất xuôi tai, và SAI. Đã đo lại và sửa.
  - Đỉnh trời tách 202° (lam sạch) vs 252° (tím chàm — "đai sao Kim").
  - Chân trời: bình minh vàng nhạt 34°/0,62/1,00 · hoàng hôn cam đỏ đậm 8°/0,88/1,46.
  - Nắng: 0,50 vs 1,06 · đèn sân: 0,16 vs 0,78.
  - **Chặng chiều** (lỗi thật của nó — đục chứ không trùng): độ tươi 1,05 → 1,30, sắc 34° → 44°.
- **Hai nước đi đã thử và ĐÃ BỊ TEST BẮT** (giữ lại để đừng ai thử lại):
  1. Hạ `dawn.sunWarmth` xuống 0,22 cho nắng sớm LẠNH → bài *"nắng ẤM lúc bình minh/hoàng hôn"* đỏ,
     và nó đúng: mặt trời thấp thì ánh sáng xuyên quãng khí quyển dài — ở CẢ HAI đầu ngày. Cái
     "mát" của buổi sớm nằm ở BẦU TRỜI và SƯƠNG, không ở đĩa mặt trời.
  2. Đẩy chân trời bình minh sang hồng sen 312° → bài *"bầu trời KHÔNG BAO GIỜ ngả tím sen"*
     (`palette3d.test.js`) đỏ với `#d189a5` (28 điểm, lưới cấm ở 10). Quét cả vòng màu: cửa an
     toàn chỉ mở từ **16°**, và thứ chạm trần trước tiên là **MẶT NƯỚC** chứ không phải bầu trời.
     Không nới lưới đó — nó sinh ra từ hai màu hỏng có thật. Và hoá ra không cần: sương mới là
     nguồn khoảng cách chính.
- **KẾT QUẢ ĐO LẠI** (cùng phép đo, cùng bản quét 15 kỷ × 6 chặng):

  | cặp | trước | sau |
  |---|---|---|
  | **bình minh ↔ hoàng hôn** | **5,9** ❌ | **75,1** ✅ |
  | cặp GẦN NHAU NHẤT trong cả ngày | 5,9 ❌ | **29,8** (8h ↔ 12h) ✅ |
  | chiều ↔ hoàng hôn | 37,6 | 44,0 |
  | chiều ↔ bình minh | 42,1 | 46,6 |

  Ngưỡng mắt phân biệt được là ~12 ⇒ **cả 15 cặp nay đều trên ngưỡng, cặp yếu nhất gấp 2,5 lần.**
- **Còn lại một quan sát, KHÔNG phải nợ**: ba chặng ấm vẫn chung họ màu (bình minh 38° · chiều 46° ·
  hoàng hôn 20°, trải 26°). Bản đầu coi đó là bằng chứng "ba chặng là một cảnh" — sai, vì chúng
  khác nhau ở ĐỘ SÁNG và SƯƠNG chứ không ở góc màu: độ sáng trời 0,65 · 0,48 · 0,38, và bình minh
  có sương dày còn hoàng hôn thì trong. Đo cả cảnh thì cặp gần nhất trong bộ ba là 44,0 — gấp 3,7
  lần ngưỡng mắt. **Cùng họ màu ≠ cùng một cảnh.**
- **Bài test mới khoá lại** (`daylight.test.js`): duyệt ĐỦ 15 cặp trên khoảng cách hồ sơ đa-trục
  (ngưỡng 0,40, hiệu chuẩn với phép đo pixel — Spearman 0,854), **cộng một bài đối chứng nhốt sẵn
  bộ số hỏng cũ** và bắt buộc phép đo phải còn bắt được nó. Nhờ vậy nếu về sau ai nới ngưỡng hoặc
  bỏ bớt trục cho tiện thì đỏ ngay — cái phễu không thể lặng lẽ quay lại lần thứ ba.
- **Status**: **CLOSED 2026-08-13.** 509/509 test xanh · lint sạch · build xanh.

---

## #86 — ⚠️ **NỬA GỐC ĐÃ XỬ LÝ (2026-09-02)** — 137 nút tự vẽ trên 28 file KHÔNG đọc token skin, và `ActionButton` không nhận nổi chúng

- **Tên**: nút hành động của app tồn tại hai thế giới — `ActionButton` (nay đọc token, đúng ở cả 10
  tổ hợp skin × chế độ) và 137 thẻ `<button>`/`<motion.button>` tự vẽ bằng lớp Tailwind chốt cứng.
- **Module**: 28 file dưới `src/components/` (đậm nhất: `StatsDashboard.jsx` 38 · `PomodoroEngine.jsx`
  35 · `Settings.jsx` 15 · `NotificationCenter.jsx` 8 · `SkillTree.jsx` 11)
- **Priority**: Medium · **Severity**: Low
- **Impact**: Những nút ấy chốt cứng bảng màu **editorial** — `rgba(201,100,66,…)` (terracotta),
  `border-emerald-200`, `bg-[rgba(244,242,236,0.82)]` — và rẽ nhánh theo `lightTheme`, tức chúng chỉ
  đúng ở **2 trong 10** tổ hợp skin × chế độ. Đây ĐÚNG cái bệnh vừa chữa cho `ActionButton`
  (2026-08-27), chỉ là ở 137 chỗ khác. Chưa ai kêu vì cả 5 skin đều dùng chung một họ màu ấm.
- **Root Cause**: `ActionButton` có `sizeMap` là một bộ **ĐÓNG gồm 3 cỡ**, cả ba đều `text-lg px-7`
  và `rounded-2xl` — chúng được đo riêng cho HÀNG NÚT LỚN của đồng hồ. Mọi ứng viên khác đều lệch ít
  nhất một chiều, nên chuyển sang là ĐỔI HÌNH DẠNG chứ không phải hợp nhất. Đã soi từng cái:
  | Chỗ | Vì sao KHÔNG chuyển được |
  |---|---|
  | `PomodoroEngine.jsx:1772` "Thu nhỏ" | `position: fixed` + `style` safe-area riêng, chữ 11px, `rounded-full` |
  | `PomodoroEngine.jsx:2023` chọn chế độ | có TRẠNG THÁI ĐƯỢC CHỌN + con trỏ trượt `layoutId`; `ActionButton` không có khái niệm "đang chọn" |
  | `PomodoroEngine.jsx:2241` chip phân loại | màu lấy từ dữ liệu người dùng qua `style` inline |
  | `PomodoroEngine.jsx:2292 · 2307` đạt/không đạt | cặp hai lựa chọn có trạng thái chọn, `flex-1 rounded-full` |
  | `PomodoroEngine.jsx:2395 · 2406` Quay lại / Hủy phiên | `rounded-full px-4 py-2.5 text-sm` — chuyển thì thành `rounded-2xl px-7 py-3.5 text-lg` |
  | `PomodoroEngine.jsx:2524` "Thêm" | `px-4 py-2 text-sm`, nằm cùng hàng với một ô nhập — cỡ `default` sẽ phá hàng |
  | `AppErrorBoundary.jsx:115 · 128` | màn hình lỗi CỐ Ý không phụ thuộc component nào khác (nó chạy khi cây React đã hỏng) |
  | `CoachChat` · `CoachOffline` · `Achievements` · `RichText` · `SkillTree` · `StatsDashboard` | `ActionButton` KHÔNG được export — nằm trong `PomodoroEngine.jsx` (2.598 dòng); dùng xuyên file phải export hoặc tách ra file riêng |
- **Current Risk**: Thấp — 5 skin hiện tại cùng họ màu ấm nên mã cứng terracotta chưa chọi rõ với
  skin nào. Rủi ro nhảy lên NGAY khi có một skin lệch tông (xanh/lam/tím).
- **Future Risk**: Medium. Mỗi phase thêm nút mới lại nhân thêm một chỗ phải sửa tay.
- **Recommended Solution**: theo THỨ TỰ, đừng làm ngược: **(1)** tách `ActionButton` ra
  `src/components/ActionButton.jsx` và export (thuần trình bày, không đọc store nữa từ 2026-08-27 nên
  tách là an toàn); **(2)** thêm các mục `sizeMap` còn thiếu (`dialog` = `px-4 py-2.5 text-sm`,
  `inline` = `px-4 py-2 text-sm`) — đúng lối mà chú thích `sizeMap` đã chỉ, KHÔNG chồng lớp qua
  `className`; **(3)** thêm `shape` (`pill` | `card`) vì `rounded-2xl` đang chốt cứng trong khuôn;
  **(4)** thêm khái niệm "đang chọn" HOẶC tách hẳn một `ToggleButton` riêng cho nhóm có trạng thái —
  đây là nhóm đông nhất và KHÔNG nên nhồi vào `ActionButton`.
- **Estimated Complexity**: Medium–High (đụng 28 file; phải chụp ảnh đối chiếu từng màn hình).
- **Blocking Conditions**: không có blocker kỹ thuật; chỉ cần một phiên riêng đủ dài, vì rủi ro thật
  nằm ở việc ĐỔI BỐ CỤC 137 chỗ chứ không ở việc viết mã.
- **Review Trigger**: khi thêm một skin **lệch tông** với họ ấm hiện tại, hoặc khi ai đó báo "nút chỗ
  này không đổi màu theo skin".
- **Owner**: chưa ai · **Status**: MỞ (mở 2026-08-27, cùng phiên viết lại `ActionButton`)

## #103 — ✅ **RESOLVED (2026-09-06 night, ADR-075)** — Reference archive so large that one `cat` blew the context window, with no guard

> ✅ **RESOLVED 2026-09-06 (night, ADR-075)**, all three recommended actions done:
> (a) the warning thresholds are in `scripts/doc-budget.mjs` **and** a hard ceiling gate now fails
> `npm test` if any reference doc exceeds one context window; (b) closed knowledge frozen —
> 40 closed debt entries and 50 oldest ADRs moved verbatim to `docs/archive/`, plus the accumulated
> threshold snapshots out of this file's header (28,849 → 1,858 chars); (c) each archive carries an
> index in the active file, and `node scripts/doc-budget.mjs --map <file>` gives a table of contents
> without reading anything. Result: `TECH_DEBT.md` 126% → 72% of a 200k window,
> `ARCHITECTURE_DECISIONS.md` 114% → 46%, largest file in the repo 486,294 → 266,956 chars.
> ⚠️ Still open as a habit, not a defect: `CHANGELOG.md` (78%) and `docs/LESSONS_3D.md` (76%) are the
> next to cross 50%; the warning in `doc-budget` fires for them already.

- **Tên**: `TECH_DEBT.md` · `ARCHITECTURE_DECISIONS.md` · `CHANGELOG.md` · `BAN_GIAO.md` phình
  không giới hạn; luật "cấm `cat`" (ADR-073) là VĂN BẢN, không phải cổng thi hành được
- **Module**: tài liệu gốc repo + `docs/`
- **Priority**: Medium · **Severity**: Medium
- **Impact**: `cat TECH_DEBT.md` = 430.761 ký tự ≈ **250.000 token = 125% cửa sổ 200k trong MỘT
  lệnh** — phiên chết ngay tại đó. `ARCHITECTURE_DECISIONS.md` 223k · `CHANGELOG.md` 154k ·
  `BAN_GIAO.md` 134k. Chính hình dạng này đã đẩy `Messages` lên 62,5% cửa sổ 1M trong phiên
  2026-09-06 khiến Đàm phải yêu cầu tối ưu.
- **Root Cause**: cả bốn file đều là sổ **CHỈ GHI THÊM** (append-only) theo thiết kế — mỗi phase
  cộng thêm mục mới, không bao giờ có nhịp đóng băng. `BAN_GIAO.md` từng được cắt (còn
  `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` = 486.294 ký tự ≈ 282k token) nhưng đã phình lại
  230.649 ký tự chỉ trong 13 ngày ⇒ **tốc độ phình ~17.700 ký tự/ngày**, tức chạm lại mốc cũ sau
  ~2 tuần nữa. Không có cơ chế tự động nào cắt hay cảnh báo.
- **Current Risk**: Trung bình — ADR-073 đã đặt luật "cấm `cat`" ở ĐẦU `CLAUDE.md` (nơi AI chắc
  chắn đọc) và `node scripts/doc-budget.mjs` in ra %cửa sổ của từng file, nên khả năng một phiên
  vô tình `cat` đã giảm mạnh. Nhưng đó vẫn là kỷ luật, không phải cơ chế.
- **Future Risk**: Trung bình–Cao — mỗi phase cộng thêm ~10–50k ký tự vào bốn file này. Khi
  `TECH_DEBT.md` vượt ~340.000 ký tự thì ngay cả `grep` với nhiều dòng ngữ cảnh cũng bắt đầu đắt,
  và `docs/archive/BAN_GIAO_ARCHIVE_2026-08-24.md` (282k token) hiện đã lớn hơn cả cửa sổ 200k.
- **Recommended Solution**: (a) cho `scripts/doc-budget.mjs` một **ngưỡng CẢNH BÁO** cho kho tra
  cứu (vd. in ⚠️ khi một file vượt 50% cửa sổ 200k) — cảnh báo, KHÔNG chặn, vì chúng được phép lớn;
  (b) đặt nhịp đóng băng định kỳ: `TECH_DEBT.md` chuyển mục ✅ đã đóng >60 ngày sang
  `docs/archive/TECH_DEBT_CLOSED_*.md`, `ARCHITECTURE_DECISIONS.md` chuyển ADR cũ hơn 50 số sang
  `docs/archive/`, `CHANGELOG.md` cắt theo quý; (c) mỗi file lớn có **mục lục ở đầu** (như
  `docs/LESSONS_3D.md` đã có 89 dòng) để `head -80` là đủ định vị, khỏi `grep` mò.
- **Estimated Complexity**: Thấp–Trung bình (thao tác cắt + sửa con trỏ; rủi ro chính là làm đứt
  các lời trỏ chéo giữa các file — xem #101)
- **Blocking Conditions**: Không có. Làm được ngay, nhưng nên làm SAU khi #101 (47 lời trỏ
  "xem `CLAUDE.md`" trong 38 file mã) được xử lý, để không phải sửa con trỏ hai lần.
- **Review Trigger**: khi `node scripts/doc-budget.mjs` cho thấy `TECH_DEBT.md` vượt 340.000 ký tự
  (~200k token = 100% cửa sổ 200k), hoặc khi `BAN_GIAO.md` vượt 250.000 ký tự.
- **Owner**: chưa phân công · **Status**: 🔵 Còn mở (ghi 2026-09-06 chiều, ADR-073)

---


