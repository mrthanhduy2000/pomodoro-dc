# Architecture Decision Records — Pomodoro DC

> "Bộ nhớ kiến trúc" của dự án — trả lời **VÌ SAO** hệ thống được thiết kế như hiện tại, không chỉ
> **NHƯ THẾ NÀO**. Xem `ARCHITECTURE.md` để biết hệ thống đang vận hành ra sao; xem file này để
> biết vì sao nó lại vận hành đúng như vậy chứ không phải một cách khác tưởng như đơn giản hơn.
>
> **Quy tắc ghi**: mỗi quyết định kiến trúc thật (không phải chi tiết vặt) phải có đủ 9 mục dưới
> đây. Thêm bản ghi mới ở ĐẦU danh sách (mới nhất trước). Không xoá bản ghi cũ dù quyết định sau
> này bị đảo ngược — thêm bản ghi MỚI ghi rõ "đảo ngược quyết định #X, lý do", để lịch sử tư duy
> không bị mất. Đây là một phần bắt buộc của Project Governance Protocol — xem `CLAUDE.md`.

---

## ADR-012 — "Trùng tu di sản": mở cho xây bù bản vẽ kỷ cũ — thay thế phần bị TỪ CHỐI ở ADR-011, và cái giá không phải là ô hàng đợi mà là NGUYÊN LIỆU KHÔNG KIẾM LẠI ĐƯỢC

- **Ngày**: 2026-08-13
- **Bối cảnh**: `TECH_DEBT #14` đo được **95% số phiên tập trung không có lễ mừng nào**, và càng
  chơi lâu càng im lặng (kỷ 1: 81% → kỷ 15: 98%). Nguyên nhân gốc là số BƯỚC XÂY của cả game chỉ
  có 420, trong khi tới Prestige là ~4 428 phiên. Đàm đã chọn hướng (b) — "bỏ lọc theo kỷ hiện
  tại" — và trong phiên này chọn tiếp cách hiện thực **(b2)**: công trình kỷ cũ mọc thẳng vào BẢO
  TÀNG của kỷ đó, không mọc trong thành phố đang chơi.
- **Vấn đề**: ADR-011 đã **cân nhắc và LOẠI BỎ** đúng phương án này (phương án (4) trong mục đó),
  với lý do: *"'trọn vẹn kỷ' mất sạch ý nghĩa — cái sao ★ chỉ đáng giá vì nó chấm điểm cho quyết
  định anh đã đưa ra LÚC ĐÓ"*. Lý do ấy KHÔNG sai, nên ADR này phải trả lời nó, không được lờ đi.
  ADR-011 cũng đã ghi sẵn điều kiện xem lại: *"nếu Đàm muốn xây bù các kỷ cũ từ đầu → phải viết
  ADR mới"*. Điều kiện đó nay đã xảy ra.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên ADR-011 (không cho xây bù) → `TECH_DEBT #14` không có đường xử lý nào còn lại.
  2. Cho xây bù, **tính vào 2 ô hàng đợi** của kỷ hiện tại.
  3. Cho xây bù, **ô riêng `LEGACY_QUEUE_SLOTS = 1`**, giữ cổng nguyên liệu. ← **CHỌN**
  4. Cho xây bù không giới hạn (không ô riêng).
- **Lý do loại bỏ (2)**: đúng cái bẫy Phase 4D vừa gỡ. Trùng tu KHÔNG sinh đặc quyền, nên bắt hy
  sinh một ô xây dựng thật để đổi lấy một dòng lịch sử là ép Đàm chọn giữa sức mạnh và sưu tập —
  và người chơi lý trí sẽ luôn chọn sức mạnh, tức tính năng chết ngay khi ra đời.
- **Lý do loại bỏ (4)**: mỗi phiên đẩy MỌI ô trong hàng đợi tiến 1 nấc. Không có trần thì Đàm xếp
  cả ~70 bản vẽ kỷ cũ vào một lượt và cả bảo tàng mọc lên đồng thời — phần thưởng loãng thành vô
  nghĩa, và nó biến 420 bước xây thành một con số vô hạn.
- **Giải pháp được chọn** — và **cách nó trả lời mối lo của ADR-011**: cái giữ cho ngôi sao ★ còn
  sức nặng KHÔNG phải là cấm xây bù, mà là **nguyên liệu**. `mergeResources` chỉ cộng thưởng vào
  `book${activeBook}`, nên túi `book5` **đóng băng vĩnh viễn** đúng lúc Đàm rời kỷ 5 — không một
  đường nào trong game nạp lại được nó. Trùng tu chỉ tiêu được phần dư mà **người-Đàm-ngày-xưa để
  lại**. Nghĩa là những quyết định lúc đó *vẫn* còn nguyên sức nặng, chỉ đổi hình thức: trước là
  "xây kịp hay không", nay là "để dành đủ hay không". Một kỷ bị vắt kiệt nguyên liệu thì vẫn không
  bao giờ chạm được ★, đúng như ADR-011 muốn.
- **Ba lớp chống lạm dụng** (mỗi lớp chặn một đường, không lớp nào thừa):
  1. `LEGACY_QUEUE_SLOTS = 1` — mỗi lúc một công trường trong bảo tàng.
  2. Nguyên liệu kỷ cũ hữu hạn, không tái tạo (đoạn trên).
  3. Không sinh `BUILDING_EFFECTS` — sức mạnh không đổi một điểm nào. Đường đi này đã có sẵn từ
     Phase 4D (`pickLegacyCompletions`), ADR này không phải viết mới.
- **Bỏ cổng NGHIÊN CỨU cho kỷ cũ** (quyết định con, cố ý): `pruneEraScopedBlueprintState` xoá
  `research.researched` của kỷ cũ, mà RP kỷ cũ thì không kiếm lại được. Đòi nghiên-cứu-trước ⇒ bản
  vẽ nào chưa kịp nghiên cứu sẽ **vĩnh viễn** không xây được ⇒ ★ của kỷ đó vĩnh viễn ngoài tầm —
  đúng cái bất công mà Phase 4D sinh ra để xoá, chỉ đổi chỗ. Bỏ cổng này KHÔNG cho thêm sức mạnh
  (không có perk) và KHÔNG bỏ cái giá (vẫn trả đủ nguyên liệu). ⚠️ Cổng nghiên cứu của **kỷ hiện
  tại** giữ NGUYÊN — có bài test riêng canh việc nó không bị nới lây.
- **Trade-off**: (a) một kỷ đã niêm phong nay có thể có công trường mới mọc lên — bảo tàng bớt
  "tĩnh" hơn nữa so với ADR-007 gốc (ADR-011 đã nới lần một, đây là lần hai, và đây là **giới hạn**:
  công trình đã đứng thì vẫn không bao giờ xê dịch); (b) ★ nay có nghĩa "trọn vẹn", không còn hàm ý
  "trọn vẹn NGAY LÚC ĐÓ" — chấp nhận, đổi lại nó thành mục tiêu **với tới được**, mà một mục tiêu
  với tới được thì tạo động lực còn một mục tiêu đã khoá thì chỉ tạo tiếc nuối; (c) tính năng có
  thể **không dùng được** với một kỷ đã bị vắt kiệt nguyên liệu — đó là tính năng, không phải lỗi.
- **Ảnh hưởng**: `engine/constants.js` (`LEGACY_QUEUE_SLOTS`) · `engine/eraLegacy.js`
  (`countLegacyCrafting`, `listRestorableBlueprints`, `canRestoreBlueprint`; sửa lại đoạn ghi chú
  "không thể lạm dụng" đã hết đúng) · `store/gameStore.js` (`startCrafting` tách hai diện) ·
  `components/BuildingWorkshop.jsx` (mục "Trùng tu di sản"; `ReadyCard` nhận cờ `restoration` để
  **không khoe đặc quyền** — bắt được bằng cách soi ảnh chụp, không phải bằng test).
  Test: `engine/eraLegacyRestore.test.js` (9) + `store/gameStore.restore.test.js` (8).
  **KHÔNG có migration**: không thêm trường state nào, không đổi schema.
- **Điều kiện xem xét lại**: nếu đo lại `TECH_DEBT #14` mà tỉ lệ phiên im lặng vẫn trên ~80%, thì
  ô riêng =1 là quá chặt và phải xét nâng; nếu Đàm thấy bảo tàng mọc quá nhanh thì hạ cổng nguyên
  liệu thay vì siết ô.

## ADR-011 — "Di sản dang dở": công trình kỷ cũ được xây tiếp, nhưng phần thưởng chỉ là LỊCH SỬ — nới bất biến của ADR-007 từ "bảo tàng bất động" thành "bảo tàng không xê dịch"

- **Ngày**: 2026-08-13
- **Bối cảnh**: Phase 4B gắn mẫu số vào mọi kỷ (`3/5`) và gắn sao ★ cho kỷ xây trọn vẹn — biến bảo
  tàng từ album ảnh thành bảng thành tích. Ngay sau đó lộ ra một hệ quả không ai thiết kế: cho tới
  lúc ấy, khởi công một công trình sát ngày lên kỷ là **tự phạt mình**. `pruneEraScopedBlueprintState`
  cắt sạch hàng đợi của kỷ cũ, nên bao nhiêu phiên đã đổ vào đó bốc hơi, và ngôi sao của kỷ ấy đóng
  lại vĩnh viễn. Đàm được hỏi và chọn thẳng: *"Cho xây tiếp công trình kỷ cũ"*.
- **Vấn đề**: bảo tàng là quá khứ đã niêm phong (ADR-007). Cho một công trình mọc lên trong đó là
  chạm vào bất biến quan trọng nhất của cả lớp Thành Phố. Vậy nới tới đâu thì vẫn còn là bảo tàng?
- **Phương án đã cân nhắc**:
  1. **Không làm gì** — giữ luật cũ, coi việc mất tiến độ là "chi phí của việc lên kỷ".
  2. **Xây tiếp và cho công trình vào `buildings` như bình thường** — tức nó có hiệu lực thật.
  3. **Xây tiếp, nhưng thành quả chỉ ghi vào `cityArchive`** — vào bảo tàng, không vào state chơi.
  4. Cho **khởi công lại** bản vẽ kỷ cũ bất cứ lúc nào (mở hẳn cửa quay về xây bù các kỷ trước).
- **Lý do loại bỏ (1)**: nó không trung lập. Sau Phase 4B, luật cũ dạy đúng một bài học — *"đừng bao
  giờ bắt đầu thứ gì khi sắp lên kỷ"* — tức app tự thưởng cho việc NGỪNG làm việc ở đúng đoạn Đàm
  đang chạy tốt nhất. Đó là phản-mục-tiêu của cả sản phẩm.
- **Lý do loại bỏ (2)**: `BUILDING_EFFECTS` là perk có hiệu lực vĩnh viễn. Cho công trình kỷ 5 sống
  tiếp ở kỷ 9 là phá thẳng luật cân bằng "mỗi kỷ chỉ hưởng công trình của kỷ mình" —
  `pruneEraScopedBlueprintState` tồn tại chính vì luật đó. Sửa cân bằng game là việc phải hỏi Đàm,
  và anh không hề yêu cầu điều đó.
- **Lý do loại bỏ (4)**: mở cửa quay lại xây bù mọi kỷ cũ thì "trọn vẹn kỷ" mất sạch ý nghĩa — cái
  làm ngôi sao đáng giá là **nó KHÔNG lấy lại được**. Còn nữa: 15 kỷ × 5 bản vẽ thành một danh sách
  việc vặt dài dằng dặc, đúng thứ Đàm bảo là *"chán"*.
- **Giải pháp được chọn**: phương án (3), có biên rõ ràng. Một công trình **đã khởi công trước khi
  lên kỷ** thì sống sót qua ranh giới kỷ và xây tiếp bằng chính những phiên tập trung sau đó; lúc
  hoàn thành, nó **không** vào `buildings` (⇒ không perk, không tài nguyên, **không một đơn vị cân
  bằng nào đổi**) mà được ghi bổ sung vào `cityArchive` của kỷ sinh ra nó. Phần thưởng thuần tuý là
  lịch sử: con số `4/5` nhích lên `5/5`, ngôi sao sáng lên. Không khởi công mới được — cửa vẫn đóng,
  chỉ những gì đã bắt đầu mới được đi hết.
  - Tầng thuần `src/engine/eraLegacy.js` (`blueprintEraOf` · `splitCraftingQueue` ·
    `countActiveCrafting` · `pickLegacyCompletions`), test riêng 10 bài.
  - Ghi bổ sung dùng lại `mergeCityArchive` với `sealedAt: null` — hàm đã sẵn có, và có test khoá
    rằng nó **không** ghi đè `sealedAt`/`epAtSeal`/`sessionCount` của lần niêm phong thật.
  - **Di sản KHÔNG chiếm ô hàng đợi** (`CRAFT_QUEUE_SLOTS = 2`): một phần thưởng thuần lịch sử mà
    lại chặn mất một ô xây dựng thì nó là cái BẪY, và người chơi vẫn học đúng bài học sai ở (1).
- **Nới bất biến ADR-007**: từ *"thành phố cũ không bao giờ đổi sau khi niêm phong"* thành **"công
  trình đã có không bao giờ xê dịch; có thể ghi THÊM một công trình đã khởi công từ trước"**. Đây
  KHÔNG phải nới lỏng bừa: bất biến gốc bảo vệ đúng một thứ — *nhà xây sau không được đẩy nhà xây
  trước đi chỗ khác* — mà `computeCityLayout` đặt nhà theo **khu đất cố định suy từ thứ hạng bản
  vẽ**, nên thêm nhà không thể xê dịch nhà nào. Vế bị nới là vế "bất động", vế được bảo vệ là vế
  "không xê dịch", và chỉ vế thứ hai mới là thứ ADR-007 thật sự mua bằng phương án (3) của nó.
- **Trade-off**: (a) một kỷ đã niêm phong nay có thể có giàn giáo đứng trong đó — trông "kém tĩnh
  lặng" hơn một bảo tàng thuần tuý, nhưng giấu nó đi mới là nói dối (Đàm đang đổ phiên vào đúng
  công trình ấy). (b) Hàng đợi có thể phình quá 2 mục nếu Đàm khởi công 2 cái rồi lên kỷ — chấp
  nhận, vì nó **bị chặn trên**: không khởi công mới được ở kỷ cũ, nên số di sản không bao giờ vượt
  quá số đã bắt đầu, và nó giảm dần một chiều. (c) Thêm một khái niệm mới cho người chơi phải hiểu
  — bù bằng nhãn "DI SẢN KỶ N" ngay trong hàng đợi và chữ "· đang xây" trên thanh chuyển kỷ.
- **Ảnh hưởng**: `gameStore.js` (`pruneEraScopedBlueprintState` giữ lại nhánh legacy ·
  `completeFocusSession` ghi bổ sung + sinh thông báo riêng · `startCrafting` đếm ô theo kỷ hiện
  tại) · `BuildingWorkshop.jsx` · `NotificationCenter.jsx` · `CityView.jsx` ·
  `cityCompletion.js` (`pending` áp cho MỌI kỷ) · `EraSwitcher.jsx`. **Không đổi schema, không đổi
  cân bằng, không thêm trường state nào** — nên không có migration.
- **Điều kiện xem xét lại**: nếu Đàm muốn xây bù các kỷ cũ từ đầu (→ đó là phương án (4), phải viết
  ADR mới đảo ngược bản này và tính lại ý nghĩa của ngôi sao), hoặc nếu số di sản tồn đọng có lúc
  nào đó lớn tới mức hàng đợi khó đọc (→ gom nhóm hiển thị, không sửa luật).

---

## ADR-010 — Khoảnh khắc "thành phố lớn lên" chen ở TẦNG HIỂN THỊ, không hoãn `lootModalOpen` trong store; và cổng phải hỏng theo hướng MỞ

- **Ngày**: 2026-08-12
- **Bối cảnh**: Đàm ra lệnh *"mọi thứ phải hoàn hảo và không bị chán"*. Sau Phase 3H–3L thành phố đã
  ĐỌC được (biết còn bao xa) và SỜ được (chạm vào xem), nhưng đúng khoảnh khắc đáng giá nhất — lúc
  chuông báo hết 25 phút — Đàm vẫn chỉ thấy một hộp thoại vật phẩm. Thành phố có lớn lên thật, chỉ
  là **anh không được nhìn thấy nó lớn lên**. Vòng lặp "làm việc → thấy thành quả" đứt đúng ở mắt
  xích cuối.
- **Vấn đề**: chèn một màn 3,2 giây vào GIỮA "phiên vừa xong" và "hộp thoại phần thưởng" — mà cái
  đứng sau là **màn hình phần thưởng của một phiên làm việc THẬT**. Chèn hỏng thì không mất một hiệu
  ứng đẹp, mà mất 25 phút công sức của Đàm.
- **Phương án đã cân nhắc**:
  1. Hoãn ngay trong store: `completeFocusSession` đặt `lootModalOpen: true` **chậm lại** 3,2 giây.
  2. Thêm một cờ mới vào store (`growthMomentOpen`) rồi cho `LootDropModal` đợi cờ đó tắt.
  3. Chặn ở TẦNG HIỂN THỊ: store không đổi một dòng nào; một component `RewardSequence` quyết định
     đang hiện cái nào.
- **Lý do loại bỏ (1)**: `lootModalOpen` bật ĐỒNG BỘ là một hành vi đang được **ba bài test khẳng
  định** (`completeFocusSession.test.js`). Làm nó thành bất đồng bộ nghĩa là sửa đúng hàm dài nhất
  dự án (~760 dòng, đã ghi là điểm nóng ở `ARCHITECTURE.md` mục 6) để đổi lấy một hiệu ứng hình
  ảnh. Đây chính là kiểu đánh đổi mà Playbook cấm: hy sinh phần lõi ổn định cho phần trang trí.
- **Lý do loại bỏ (2)**: thêm trạng thái vào store nghĩa là thêm một thứ **có thể kẹt ở trạng thái
  bật**. Một cờ "đang chạy lễ mừng" mà quên tắt (thoát app giữa chừng, lỗi render, hết pin) sẽ chặn
  hộp thoại phần thưởng **vĩnh viễn**, kể cả sau khi khởi động lại app.
- **Giải pháp chọn — (3), và nguyên tắc đứng sau nó**: *trạng thái của một hoạt hoạ 3 giây không
  phải là dữ liệu; nó là vòng đời của một component.* `RewardSequence` được React dựng MỚI mỗi lần
  `lootModalOpen` đi từ tắt sang bật, nên biến "đã xem chưa" tự khởi động lại — không có `useEffect`
  nào đi dọn, tức là **không có chỗ nào để quên dọn**. Không thêm một byte nào vào store, nên cũng
  không thêm gì vào JSONB đang tranh chấp CAS.
- **Nguyên tắc thứ hai — HỎNG THEO HƯỚNG MỞ**: cổng được viết sao cho phần thưởng hiện ra **TRỪ KHI**
  khoảnh khắc đang thật sự chạy, chứ không phải "hiện ra KHI khoảnh khắc đã xong". Không có gì thật
  để khoe · Đàm bật giảm chuyển động · dữ liệu lạ · engine trả `null` — mọi nhánh đều dẫn thẳng tới
  phần thưởng. Cộng thêm hai lưới: một chạm là bỏ qua, và một đồng hồ bảo hiểm 3,2 giây.
- **Nguyên tắc thứ ba — TRUNG THỰC HƠN HIỆU ỨNG**: `buildGrowthMoment` trả `null` khi thành phố
  **không** đổi gì. Thà không có khoảnh khắc nào còn hơn một câu chúc mừng rỗng — đúng nguyên tắc
  chống-bịa mà AI Coach đang sống bằng nó (`engine/coach/guard.js`). Vì cùng lẽ đó, vạch xuất phát
  của thanh tiến độ đọc `acceleratedCraftingIds` để biết phiên này đẩy 1 hay 2 bước, thay vì đoán.
- **Trade-off**:
  - Đàm phải chờ thêm ~3 giây trước khi thấy phần thưởng. Đây là cái giá CÓ CHỦ Ý; nút vặn là hằng
    số `MOMENT_MS` và một cú chạm bỏ qua bất cứ lúc nào.
  - Khi một công trình VỪA XONG, thanh chạy từ 0 % chứ không từ vạch thật của phiên trước — vì hàng
    đợi đã dọn mục đó đi rồi, con số cũ không còn tồn tại ở đâu cả. Thà chạy từ 0 (một sự kiện
    "xong rồi") còn hơn bịa ra một vạch xuất phát.
  - Khoảnh khắc **không dựng cảnh 3D**. Trang chủ đã giữ một WebGL context cho lớp nền; mở context
    thứ hai đúng lúc máy vừa chạy xong 25 phút là cách nhanh nhất để iOS thu hồi cả hai.
- **Ảnh hưởng**: `createRecoverableLazy` được bổ sung `preload()` — đo bằng máy cho thấy nếu không
  có nó, gói mã của màn phần thưởng chỉ **bắt đầu tải SAU khi khoảnh khắc kết thúc**, tức là ta vừa
  đẩy nó lùi 3,2 giây so với trước. Nay hai việc chạy song song (đo được: gói phần thưởng bắt đầu
  tải ở mốc 326 ms, xong trước khi khoảnh khắc hết). Store, engine game, cân bằng: không đổi.
- **Điều kiện xem lại**: nếu Đàm thấy 3,2 giây là dài (vặn `MOMENT_MS`); nếu sau này có nhu cầu cho
  khoảnh khắc dựng cảnh 3D thật (phải đo lại việc thu hồi context trên iPhone TRƯỚC); hoặc nếu xuất
  hiện một màn hình thứ ba cũng muốn chen vào chuỗi này — lúc đó `RewardSequence` nên thành một
  danh sách các chặng có thứ tự, chứ không phải thêm một `if` nữa.

---

## ADR-009 — Thành Phố là một Ô CỬA SỔ: đồng hồ quyết độ sáng cảnh, theme chỉ quyết cái khung — và sắc kỷ trộn trong RGB, không xoay góc màu

- **Ngày**: 2026-08-12
- **Bối cảnh**: Đàm yêu cầu quét đủ 15 kỷ × 6 chặng ngày rồi "đánh bóng mọi thứ lên". Bản quét 180
  cảnh (90 ô × 2 theme) phơi ra 6 lỗi mỹ thuật mà **soi từng ảnh rời chưa bao giờ bắt được**, dù
  chúng đã chạy trên production nhiều ngày.
- **Vấn đề**: hai câu hỏi kiến trúc, không phải hai con số cần chỉnh.
  1. `isDark` đang trả lời HAI câu hỏi khác nhau bằng một biến: *"giao diện đang dùng bảng màu
     nào?"* và *"ngoài trời có tối không?"*. Hệ quả: để theme tối thì giữa trưa cảnh cũng tối như
     nửa đêm — cả 15 kỷ ở cột 12 giờ đều là một mảng đen kịt.
  2. Sắc riêng của kỷ (góc màu chạy khắp vòng tròn màu) đang được pha vào các sắc NEO của vật liệu
     bằng cách **nội suy góc màu**. Đây là lần thứ TƯ cái bẫy này cắn dự án, ở vai màu thứ tư.
- **Phương án đã cân nhắc — câu hỏi (1)**:
  1. Thêm trường `skyLightness` vào từng chặng trong `DAYLIGHT_PROFILES` (chính là "Recommended
     Solution" đã ghi sẵn ở `TECH_DEBT #11`).
  2. Bỏ hẳn ảnh hưởng của theme lên cảnh 3D, luôn dùng bảng màu sáng.
  3. Đổi Ý NGHĨA của `isDark`: có `daylight` ⇒ **đồng hồ quyết**; không có ⇒ vẫn theo theme.
- **Lý do loại bỏ (1)**: nó chữa đúng cái triệu chứng đã ghi trong sổ nợ (bầu trời) và bỏ sót mặt
  đất, tường, mái — vốn cùng một gốc. Vá xong sẽ vẫn còn một thành phố tối om dưới một bầu trời
  sáng, tức là tệ hơn cả trước khi vá.
- **Lý do loại bỏ (2)**: mất luôn cảnh đêm ở theme sáng — tức là mất phần lớn giá trị của Phase 3D
  với người để theme sáng, đúng cái lỗi đối xứng mà ta đang đi sửa.
- **Giải pháp chọn — (3), và nguyên tắc đứng sau nó**: *thành phố là một Ô CỬA SỔ.* Cảnh nhìn qua
  cửa sổ không tối đi vì ta sơn tường phòng màu đen. **Theme quyết định cái KHUNG** (nền thẻ, viền,
  lớp tối góc, lớp phủ giữ chữ đọc được ở trang chủ — tất cả giữ nguyên); **đồng hồ quyết định độ
  sáng BÊN TRONG khung**. Nhánh "không có `daylight`" giữ nguyên hành vi cũ, nên bảo tàng và mọi
  màn hình cũ không đổi một byte nào.
- **Phương án đã cân nhắc — câu hỏi (2)**:
  1. Sửa số cho từng kỷ bị hỏng (6 kỷ mái tím, 7 kỷ đất cỏ).
  2. Kẹp góc lệch của sắc kỷ vào một dải hẹp quanh sắc neo (`clamp`).
  3. Trộn trong RGB thay vì nội suy góc màu.
- **Lý do loại bỏ (1)**: đã làm ba lần rồi, và lỗi mọc lại ở vai màu thứ tư. Nó cũng sẽ mọc lại ở
  kỷ thứ 16 hoặc ở vai màu tiếp theo ai đó thêm vào.
- **Lý do loại bỏ (2)**: đo thử thì 4 kỷ (5, 8, 11, 15) đều đụng trần kẹp và ra **cùng một màu mái**
  — tức là chữa được màu xấu bằng cách xoá mất bản sắc của 4 kỷ.
- **Giải pháp chọn — (3)**: một phép pha duy nhất (`blend`) cho cả bảng màu. Đường thẳng nối hai màu
  trong RGB luôn cắt qua vùng trung tính — đúng cách người vẽ pha bột màu, và cũng đúng cách các
  hoạ sĩ Phục Hưng pha màu bổ túc. Không có khái niệm "hướng đi" nên không có gì để lật; không đầu
  vào nào đẻ ra được màu tím.
- **Trade-off**:
  - Người để theme tối nay thấy một thành phố SÁNG trong thẻ vào ban ngày. Đây là cái giá có chủ ý,
    và nó đúng với ẩn dụ ô cửa sổ; nếu Đàm thấy chói thì nút vặn nằm ở lớp phủ/độ mờ của KHUNG, chứ
    không phải quay lại làm tối cả cảnh.
  - Trộn RGB **tự bạc màu** ở giữa: kỷ có sắc đối lập với sắc neo sẽ ra màu TRẦM hơn hẳn kỷ có sắc
    gần. Nghe như mất mát, nhưng đo lại đủ 15 kỷ thì đó chính là thứ cho ra 15 sắc mái phân biệt
    được (đất nung, ngói đỏ, vàng đất, đồng xanh, xám tía, mận chín, rượu vang) mà không sắc nào
    rơi ra ngoài dải vật liệu có thật. `mixHue` vẫn giữ lại và vẫn đúng cho hai góc màu GẦN nhau.
- **Ảnh hưởng**: đóng `TECH_DEBT #11`. `DAYLIGHT_PROFILES` thêm `horizonHue`/`horizonPull` (đỉnh
  trời và chân trời có đích riêng — đỉnh luôn lạnh, chân luôn giữ hơi ấm trừ ban đêm). 5 bài test
  mới, **tất cả đã xác minh ĐỎ trên code cũ** trước khi nhận.
- **Điều kiện xem lại**: nếu Đàm phản hồi rằng thành phố sáng quá trong theme tối ban ngày; hoặc
  nếu thêm chặng ngày mới / kỷ thứ 16 mà bảng quét lộ ra sắc lạ.

---

## ADR-008 — Thành Phố: tách KHUNG màn hình khỏi BỘ VẼ, và giữ bộ vẽ 2D làm nền vĩnh viễn (không phải bản nháp)

- **Ngày**: 2026-08-12
- **Bối cảnh**: sau khi bộ vẽ 2D isometric (SVG) chạy được, Đàm duyệt kế hoạch thay nó bằng 3D thật
  (three.js) cộng lớp thời gian/cảm giác. Câu hỏi đặt ra ngay trước khi commit bản 2D: **có nên
  commit nó không, hay bỏ đi và làm thẳng 3D?**
- **Vấn đề**: WebGL không phải thứ chắc chắn có. Máy có thể không hỗ trợ WebGL2, trình duyệt có thể
  **mất context giữa chừng** (`webglcontextlost` — hay xảy ra trên iOS khi máy thiếu bộ nhớ), người
  dùng có thể tự chọn tắt 3D để tiết kiệm pin, và bản thân cổng hiệu năng của Phase 3A có thể
  TRƯỢT. Trong mọi tình huống đó màn hình Thành Phố vẫn phải hiện ra được một cái gì đó.
- **Phương án đã cân nhắc**:
  1. **Vứt bản 2D**, làm thẳng 3D; nếu 3D hỏng thì hiện thông báo lỗi.
  2. **Giữ bản 2D nhưng coi là code tạm**, sau này 3D chạy tốt thì xoá.
  3. **Giữ bản 2D làm chế độ ngang hàng vĩnh viễn**, và tách kiến trúc thành KHUNG (`CityViewShell`)
     + BỘ VẼ (`render2d/`, sau này `render3d/`) để hai bộ vẽ thay nhau mà khung không đổi.
- **Lý do loại bỏ phương án (1)**: biến một sự cố tạm thời của trình duyệt thành một màn hình chết.
  Tệ hơn, nó đặt toàn bộ giá trị của 4 Phase trước vào tay một cổng hiệu năng chưa đo — trượt cổng
  là mất trắng.
- **Lý do loại bỏ phương án (2)**: "code tạm rồi xoá" chỉ đúng khi có ngày xoá thật. Ở đây đường lui
  là **yêu cầu vận hành thường trực**, không phải giai đoạn chuyển tiếp — gọi nó là tạm sẽ khiến
  phiên sau bỏ bê nó, đúng lúc cần nhất thì nó đã mục.
- **Giải pháp được chọn**: phương án (3). `CityViewShell.jsx` giữ thanh chuyển kỷ, tiêu đề, bảng số
  liệu, danh sách công trình và **hai trạng thái rỗng** (thất truyền / bãi đất trống); bộ vẽ được
  truyền vào qua `children`. Khung **không biết** bộ vẽ nào đang chạy, và **bộ vẽ tự quyết định kích
  thước của mình** (SVG cần chiều rộng tối thiểu + cuộn ngang; canvas 3D sẽ cần tỉ lệ cố định) —
  nên khung không phải chứa `if` cho từng chế độ.
- **Trade-off**: (a) thêm một tầng component và một lần truyền props cho thứ hiện chỉ có MỘT bộ vẽ —
  chấp nhận vì bộ vẽ thứ hai đã nằm trong kế hoạch đã duyệt, không phải suy đoán. (b) Hai bộ vẽ
  nghĩa là hai chỗ phải sửa khi ngôn ngữ hình ảnh đổi — giảm nhẹ bằng cách để **bố cục trừu tượng
  dùng chung** (`computeCityLayout` trả ô lưới `(x,y)`, không trả pixel), hai bộ vẽ chỉ khác nhau ở
  bước cuối. (c) Token thiết kế phải tách làm hai: `cityTokens.js` (dùng chung) và
  `render2d/tokens2d.js` (bảng màu `rgba()` + phép chiếu isometric — mẹo compositing chỉ đúng trong
  SVG/CSS, WebGL không dùng lại được).
- **Ảnh hưởng**: `src/components/city/render3d/` sẽ là **nơi DUY NHẤT** được phép `import 'three'` —
  luật này kiểm tra được bằng grep và là thứ giữ cho `src/engine/` tiếp tục test được bằng
  `node --test` (không DOM, không WebGL). Mọi thay đổi ở khung phải giữ nguyên giao kèo "khung cấp
  một ô trống, không áp kích thước".
- **Điều kiện xem xét lại**: nếu cổng hiệu năng Phase 3A trượt và nhánh 3D bị bỏ hẳn, tầng tách này
  trở thành thừa — khi đó có thể gộp `CityViewShell` ngược vào `CityView` (một thao tác nhỏ, không
  mất dữ liệu). Ngược lại, nếu sau nhiều tháng 3D chạy ổn trên MỌI thiết bị Đàm dùng, vẫn **không**
  xoá bộ vẽ 2D — nó là đường lui cho `webglcontextlost`, không phải bản nháp.

---

## ADR-007 — Thành Phố Pixel: toạ độ SUY RA từ id, không lưu vào state; và đặt nhà theo "khu đất cố định" thay vì dò xoắn ốc

- **Ngày**: 2026-08-12
- **Bối cảnh**: xây lớp hình ảnh "Thành Phố Pixel" — mỗi công trình đã xây hiện thành một căn nhà
  trên lưới isometric 12×12. Đàm chọn **mô hình BẢO TÀNG**: qua kỷ mới thì xây thành phố MỚI, thành
  phố cũ được niêm phong để ghé thăm bất cứ lúc nào (có thể là nhiều năm sau).
- **Vấn đề**: cần một cách xác định "căn nhà A đứng ở ô nào". Hai câu hỏi tách biệt: (a) lưu toạ độ
  hay suy ra? (b) khi hai căn nhà rơi vào cùng một ô thì giải quyết thế nào?
- **Phương án đã cân nhắc**:
  1. **Lưu toạ độ** vào state cho từng công trình của từng kỷ.
  2. **Suy ra toạ độ** bằng băm tất định từ chính `bpId`, va chạm thì **dò xoắn ốc** theo danh sách
     `bpId` đã sắp xếp (đề xuất ban đầu của spec).
  3. **Suy ra toạ độ**, nhưng mỗi bản vẽ có **khu đất riêng** suy từ thứ hạng cố định của nó trong
     `BLUEPRINT_CATALOG` của kỷ đó (mỗi kỷ đúng 5 bản vẽ → 5 khu đất rời nhau).
- **Lý do loại bỏ phương án (1)**: thêm ~15–20 KB vào state cho 15 kỷ, đẩy sát trần localStorage
  (`TECH_DEBT #9`, đường ghi persist chưa bắt `QuotaExceededError`), thêm 15 nhánh dữ liệu cho cơ
  chế đồng bộ nguyên-khối (`TECH_DEBT #8`), và quan trọng nhất: mất/hỏng dữ liệu = mất luôn bố cục
  thành phố cũ. Lợi ích duy nhất — kéo thả tự sắp xếp — gần như vô dụng với một thành phố ĐÃ BỊ
  NIÊM PHONG, không ai xây thêm nữa.
- **Lý do loại bỏ phương án (2)**: dò xoắn ốc chỉ giữ được bất biến "bảo tàng bất động" (xây thêm
  nhà mới KHÔNG làm xê dịch nhà cũ) khi KHÔNG có va chạm. Xác suất ít nhất một va chạm với 5 công
  trình trên 144 ô là **~7%** — không hiếm. Khi va chạm xảy ra, một căn nhà xây SAU có thể chiếm ô
  của căn nhà xây TRƯỚC và đẩy nó đi chỗ khác, tức thành phố tự động đậy sau lưng người dùng. Đây
  đúng là rủi ro #5 trong bảng rủi ro của spec, và bất biến này được chính spec gọi là "bất biến
  quan trọng nhất".
- **Giải pháp được chọn**: phương án (3) — suy ra toạ độ, đặt nhà vào khu đất riêng theo thứ hạng
  bản vẽ. Vì các khu đất không giao nhau, hai công trình cùng một kỷ KHÔNG BAO GIỜ tranh nhau một
  ô ⇒ vị trí mỗi căn nhà chỉ phụ thuộc **chính id của nó**, không phụ thuộc việc có bao nhiêu căn
  khác đang đứng cạnh. Bất biến trở thành đúng TUYỆT ĐỐI thay vì đúng ~93%. Chữ ký
  `placeBuilding(bpId, occupiedSet)` giữ nguyên như spec và dò xoắn ốc vẫn còn — nhưng chỉ làm lưới
  an toàn cho id lạ đến từ dữ liệu cloud hỏng, với dữ liệu hợp lệ nó không bao giờ phải chạy.
- **Trade-off**: (a) mất khả năng kéo thả sắp xếp nhà — chấp nhận vì thành phố cũ đã niêm phong;
  nếu sau này Đàm thật sự muốn kéo thả, chỉ cần lưu **phần lệch** so với vị trí mặc định, không
  phải làm lại từ đầu. (b) Bố cục bị ràng buộc vào 5 khu đất cố định nên ít "ngẫu nhiên tự nhiên"
  hơn — bù lại thành phố luôn trải đều, không bao giờ dồn cục một góc. (c) Thêm một phụ thuộc ngầm:
  **thứ tự các phần tử trong `BLUEPRINT_CATALOG[era]` trở thành dữ liệu có ý nghĩa hình ảnh** —
  đảo thứ tự 5 bản vẽ trong một kỷ sẽ làm thành phố kỷ đó đổi bố cục.
- **Ảnh hưởng**: `src/engine/cityLayout.js` không bao giờ được dùng `Math.random`/`Date`; mọi thay
  đổi thuật toán băm/khu đất sẽ **đổi bố cục của MỌI thành phố cũ** — coi như thay đổi phá vỡ tương
  thích về mặt hình ảnh, phải cân nhắc như đổi schema. Test `cityLayout.test.js` khoá cả 3 bất biến
  (tất định · bảo tàng bất động · không phụ thuộc thứ tự đầu vào).
- **Điều kiện xem xét lại**: nếu Đàm yêu cầu kéo thả sắp xếp nhà (→ thêm lớp "phần lệch" lưu riêng,
  giữ nguyên hàm suy ra làm vị trí mặc định), hoặc nếu một kỷ nào đó có số bản vẽ khác 5 (khi ấy
  bảng khu đất phải mở rộng tương ứng).

---

## ADR-006 — Không tách nhỏ `gameStore.js` trong đợt refactor kiến trúc toàn diện

- **Ngày**: 2026-07-12
- **Bối cảnh**: Đàm yêu cầu refactor kiến trúc toàn dự án theo 10 nguyên tắc rõ ràng, trong đó có
  điều khoản riêng cho "God File": nếu buộc phải sửa `gameStore.js`/`StatsDashboard.jsx` thì phải
  tách các phần logic độc lập ra ngoài (helper thuần, hàm định dạng...) ở mức rủi ro thấp, nhưng
  KHÔNG bắt buộc tách hẳn store/component thành nhiều phần ngay trong đợt này.
- **Vấn đề**: `gameStore.js` dài ~6.000 dòng, có ~78 action, một action (`completeFocusSession`)
  dài ~760 dòng đọc/ghi hàng chục slice state trong một lệnh `set()`. Đây là "God File" kinh điển.
- **Phương án đã cân nhắc**:
  1. Tách toàn bộ thành nhiều slice Zustand riêng (streak/mission/achievement/crafting/prestige...).
  2. Chỉ rút các hàm/logic thuần độc lập ra `src/engine/`/file riêng, giữ nguyên cấu trúc store.
  3. Không đụng gì tới `gameStore.js` trong đợt này.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì tách một store có ~78 action liên kết chặt chẽ
  (một action đọc/ghi hàng chục slice) mà KHÔNG có bộ test hành vi đầy đủ bao phủ trước sẽ tạo rủi
  ro "tính sai điểm/XP/streak âm thầm, không crash" — loại lỗi nguy hiểm nhất vì không tự lộ ra;
  đợt refactor này ưu tiên "không đổi hành vi" tuyệt đối, không phù hợp để đánh cược rủi ro lớn.
  (3) bị loại vì bỏ qua yêu cầu rõ ràng của Đàm về xử lý God File khi động vào khu vực liên quan
  (đã phải sửa `StatsDashboard.jsx` trong đợt này để xoá dead code, nên "không đụng gì" không khả thi).
- **Giải pháp được chọn**: phương án (2) — rút `statsFormatters.js` (11 hàm định dạng thuần + test)
  khỏi `StatsDashboard.jsx`; giữ nguyên cấu trúc `gameStore.js`.
- **Trade-off**: file vẫn khó đọc/khó onboard cho một AI/người mới; đổi lại rủi ro giới thiệu bug
  âm thầm gần như bằng 0 vì không đổi luồng logic nào.
- **Ảnh hưởng**: `gameStore.js` vẫn là "God File" — bất kỳ ai sửa nó phải đọc kỹ trước, đặc biệt
  action `completeFocusSession`. Xem `TECH_DEBT.md` mục tương ứng.
- **Điều kiện xem xét lại**: khi `completeFocusSession` tiếp tục phình to (dấu hiệu cụ thể: vượt
  ~900-1000 dòng, hoặc thêm 1 hệ thống gameplay lớn mới cần cắm vào đúng điểm này) — và CHỈ khi có
  kế hoạch viết thêm test hành vi bao phủ đầy đủ TRƯỚC khi tách, không tách "cho gọn" suông.

---

## ADR-005 — Cấu trúc `api/_lib/` + `api/_tests/` với tiền tố gạch dưới

- **Ngày**: 2026-07-11
- **Bối cảnh**: Vercel gói Hobby giới hạn 12 Serverless Functions/deploy. Thêm `api/keepalive.js`
  (cron giữ Supabase không tự pause) khiến deploy FAIL: "No more than 12 Serverless Functions...".
- **Vấn đề gốc**: Vercel (chế độ build "Other"/không framework cho `api/`) coi MỌI file `.js` nằm
  TRỰC TIẾP trong `api/` (đệ quy) là 1 Serverless Function riêng — kể cả file test — TRỪ file/thư
  mục có tên bắt đầu bằng `_`. Lúc đó có 5 file `*.test.js` nằm lẫn trong `api/`/`api/push/` bị
  tính oan vào trần 12.
- **Phương án đã cân nhắc**:
  1. `.vercelignore` loại trừ `*.test.js` theo tên/pattern (vá nhanh).
  2. Chuyển toàn bộ test của `api/` vào `api/_tests/` (mirror cấu trúc `api/`), dùng đúng quy ước
     underscore-prefix Vercel đã tôn trọng sẵn cho `api/_lib/`.
  3. Xoá bớt function (gộp nhiều route thành 1 file dùng router nội bộ) để có dư chỗ.
- **Lý do loại bỏ từng phương án**: (1) bị Đàm BÁC BỎ có chủ đích — đây là vá THEO TÊN FILE, nghĩa
  là phải nhớ cập nhật blacklist mỗi khi thêm loại file test mới (`.spec.js`, `.mock.js`...), một
  gánh nặng bảo trì vĩnh viễn thay vì fix gốc; (3) bị loại vì làm giảm khả năng đọc/tách bạch từng
  route, và không giải quyết được vấn đề gốc (Vercel vẫn đếm sai file test nếu lỡ đặt nhầm chỗ).
- **Giải pháp được chọn**: phương án (2) — cấu trúc này AN TOÀN VĨNH VIỄN vì không phụ thuộc tên
  file cụ thể: dù sau này thêm hàng trăm file test bất kỳ tên gì đặt ĐÚNG trong `api/_tests/` cũng
  không bao giờ bị tính vào trần 12. `.vercelignore` vẫn giữ làm lớp phòng thủ THỨ HAI (mở rộng
  thêm các đuôi file phụ trợ khác) phòng khi lỡ tay đặt nhầm file vào thẳng `api/`.
- **Trade-off**: không có — đây là giải pháp thuần lợi so với phương án vá tạm.
- **Ảnh hưởng**: mọi test API mới BẮT BUỘC đặt trong `api/_tests/` (mirror đường dẫn file đang
  test), không đặt cạnh route handler nữa. `package.json` test glob phải trỏ đúng thư mục này.
- **Bài học đi kèm** (xem thêm `TECH_DEBT.md`/lịch sử sự cố): một lần build fail do vượt trần này
  (`api/coach-digest.js`, commit `8ee264d` ngày 2026-06-25) từng khiến Vercel ÂM THẦM giữ nguyên
  bản deploy CŨ suốt ~2 tuần rưỡi mà không ai để ý — một tính năng "hoàn tất" trên giấy tờ chưa hề
  chạy thật trên production. Từ đó có quy tắc: LUÔN xác nhận tab Deployments trên Vercel dashboard
  hiện "Ready" sau mỗi lần push.
- **Điều kiện xem xét lại**: nếu Vercel đổi chính sách đếm function (không còn áp dụng quy ước
  underscore-prefix), hoặc nếu dự án nâng cấp lên gói trả phí có trần function cao hơn nhiều (khi
  đó áp lực tổ chức theo trần 12 không còn, nhưng cấu trúc `_lib`/`_tests` vẫn nên giữ vì bản thân
  nó là một quy ước tổ chức tốt, độc lập với lý do Vercel).

---

## ADR-004 — "First Action Wins": đồng bộ đa thiết bị dựa trên version phía server, không phải timestamp máy khách

- **Ngày**: 2026-07-11
- **Bối cảnh**: App chạy trên nhiều thiết bị (Mac laptop + iPhone) có thể mở CÙNG LÚC, cùng ghi
  dữ liệu vào 1 dòng Supabase (`game_state`).
- **Vấn đề**: cơ chế cũ ghi `updated_at` bằng đồng hồ CỦA CHÍNH THIẾT BỊ khi đẩy dữ liệu lên —
  máy nào đẩy TỚI ĐÍCH sau cùng thắng, bất kể ai thao tác trước. Đây là lỗ hổng THIẾT KẾ (không
  phải bug cụ thể): bất cứ lúc nào 2 thiết bị mở gần đồng thời đều CÓ THỂ mất dữ liệu do "ăn may
  ai ghi cuối". Đã thực sự gây mất 1 phiên tập trung thật (25 phút, +26 XP) không thể phục hồi.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên so sánh timestamp client, chỉ thêm cảnh báo UI khi phát hiện xung đột.
  2. Khoá optimistic-lock qua cột `version` tăng bởi TRIGGER PHÍA SERVER (compare-and-swap).
  3. Khoá bi quan (pessimistic lock) — một thiết bị phải "xin khoá" trước khi ghi.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì timestamp client KHÔNG đáng tin — lệch đồng hồ
  giữa thiết bị, và quan trọng hơn, không có khái niệm "thứ tự thao tác THẬT" được cả 2 bên đồng
  thuận — chỉ thêm cảnh báo không giải quyết được gốc rễ mất dữ liệu; (3) bị loại vì phức tạp hoá
  quá mức cho một app 1-người-dùng (cần xử lý khoá hết hạn, deadlock, UX xin/nhả khoá) trong khi
  lợi ích không hơn nhiều so với (2).
- **Giải pháp được chọn**: phương án (2) — cột `version` (integer) trên `game_state`, tăng bởi
  trigger Postgres (`supabase/game_state_version.sql`), KHÔNG phụ thuộc đồng hồ máy khách nào.
  Mọi lần ghi từ `syncService.js` kèm điều kiện `.eq('version', expectedVersion)`; ghi bị từ chối
  (0 dòng khớp) → thiết bị đó THUA, buộc `pullFromCloud()` nhận lại bản đã thắng, TUYỆT ĐỐI không
  được ép ghi đè. Gỡ guard cũ dựa trên `timerSession.isRunning` (không còn cần — version mạnh hơn
  suy đoán qua trạng thái).
- **Trade-off**: bên thua LUÔN mất mọi thay đổi cục bộ chưa kịp đồng bộ (không có hợp nhất từng
  phần/CRDT) — chấp nhận được vì đơn giản và đáng tin hơn nhiều so với một cơ chế hợp nhất phức
  tạp dễ có lỗi tinh vi hơn chính vấn đề nó giải quyết.
- **Ảnh hưởng**: MỌI ghi vào `game_state` phải qua `syncService.js`, không được viết tắt trực tiếp
  ở bất kỳ đâu khác trong code.
- **Điều kiện xem xét lại**: về nguyên tắc có thể thay bằng CRDT/hợp nhất từng trường nếu tương lai
  dự án cần nhiều người dùng thao tác đồng thời phức tạp hơn — nhưng với app 1-người-dùng hiện tại,
  KHÔNG có lý do chính đáng để thay đổi. **Bất kỳ đề xuất "đơn giản hoá" nào quay lại so sánh
  timestamp client đều phải bị từ chối ngay** — đó chính xác là lỗ hổng đã gây sự cố thật.

---

## ADR-003 — AI Coach: chỉ dùng Gemini đám mây, gỡ hẳn Qwen on-device (WebLLM)

- **Ngày**: 2026-06-24 (quyết định cuối, sau một giai đoạn trung gian "Gemini chính + Qwen dự phòng")
- **Bối cảnh**: AI Coach ban đầu (2026-06-20) chạy 100% miễn phí bằng Qwen2.5 (chốt bản 3B tham
  số) tải và chạy ngay trên máy qua WebGPU (thư viện WebLLM) — không tốn phí API.
- **Vấn đề**: model 3B chất lượng phân tích kém, hay "trôi" sang tiếng Trung, và quan trọng nhất —
  **hoàn toàn không chạy được trên iPhone** (không có WebGPU), trong khi người dùng chính lại chủ
  yếu dùng điện thoại.
- **Phương án đã cân nhắc**:
  1. Nâng cấp lên Qwen2.5-7B (thử qua một đợt, rồi rút lui).
  2. Gemini làm CHÍNH + Qwen làm dự phòng khi mất mạng/hết quota (thử qua giai đoạn trung gian).
  3. Gemini là DUY NHẤT, gỡ hẳn Qwen/WebLLM.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì 7B nặng máy hơn nhiều (~4.5GB tải, ~5GB VRAM)
  mà vẫn không giải quyết được vấn đề cốt lõi là không chạy được trên iPhone; (2) bị loại sau khi
  thử vì duy trì 2 pipeline AI song song (đám mây + on-device) làm tăng độ phức tạp bảo trì đáng kể
  (2 bộ decode config, 2 luồng lỗi, 2 UI trạng thái) trong khi Gemini đã đủ ổn định để không cần
  dự phòng on-device nữa.
- **Giải pháp được chọn**: phương án (3) — xoá hẳn `webllmEngine.js`, dependency `@mlc-ai/web-llm`,
  toàn bộ code nhánh fallback on-device. Giữ nguyên "bộ não" model-agnostic (prompt + lưới chống-
  bịa + tầng số liệu) — chỉ thay cổng gọi model.
- **Trade-off chấp nhận**: mất khả năng hoạt động khi mất mạng/hết quota Gemini/chưa cấu hình key
  (Coach NGỪNG hẳn, không còn lưới dự phòng chạy tại chỗ); dữ liệu số liệu (không phải dữ liệu cá
  nhân nhạy cảm dạng văn bản tự do) rời khỏi máy lên server Google.
- **Ảnh hưởng**: giảm kích thước app đáng kể (không còn tải model ~2.4GB); AI Coach giờ CHẠY ĐƯỢC
  TRÊN CẢ IPHONE — đây là lợi ích chính biện minh cho trade-off.
- **Điều kiện xem xét lại**: nếu Gemini đổi chính sách giá/ngừng free tier đột ngột theo hướng bất
  lợi, hoặc nếu tương lai có một model on-device đủ nhỏ+đủ tốt+chạy được cả trên iPhone (hiện chưa
  có công nghệ này ở thời điểm quyết định). Kiến trúc model-agnostic (prompt/guard tách khỏi cổng
  gọi model) được thiết kế có chủ đích để đổi nhà cung cấp AI trong tương lai chỉ cần thay 1 file
  (`cloudEngine.js`), không cần viết lại "bộ não".

---

## ADR-002 — Lưới chống-bịa AI Coach: "cứu câu/cứu dòng" thay vì huỷ toàn bộ câu trả lời

- **Ngày**: 2026-06-24 (qua nhiều vòng tinh chỉnh, 2026-06-22 → 2026-06-24)
- **Bối cảnh**: Lưới chống-bịa số (`findFabricatedNumbers` và tương tự) phát hiện AI viết ra một
  con số không có trong bảng dữ liệu thật.
- **Vấn đề**: phiên bản đầu tiên của lưới, khi phát hiện MỘT con số bịa, sẽ huỷ TOÀN BỘ câu trả
  lời (hoặc rơi về một câu fallback chung chung) — lãng phí phần lớn nội dung ĐÚNG chỉ vì một chi
  tiết sai.
- **Phương án đã cân nhắc**:
  1. Giữ nguyên "nuke toàn bộ" khi phát hiện bịa (đơn giản nhất).
  2. Viết lại MÙ (yêu cầu model thử lại từ đầu, không nói rõ cái gì sai).
  3. Viết-lại-CÓ-HƯỚNG-DẪN (chỉ đích danh số bịa) + nếu vẫn còn bịa, cắt riêng câu/dòng chứa nó
     ("cứu câu/cứu dòng"), giữ nguyên phần còn lại sạch.
- **Lý do loại bỏ từng phương án**: (1) bị loại vì trải nghiệm tệ — người dùng mất toàn bộ phân
  tích chỉ vì 1 con số sai trong 10 câu đúng; (2) thử qua nhưng kém hiệu quả hơn vì model không
  biết chính xác cần sửa gì, dễ tiếp tục bịa ở lượt thử lại.
- **Giải pháp được chọn**: phương án (3) — hai lớp: (a) lượt thử lại đầu tiên LUÔN chỉ đích danh
  số bị coi là bịa (`buildCorrectionNote`), không phải yêu cầu chung chung; (b) nếu vẫn còn bịa sau
  thử lại, cắt bỏ RIÊNG câu (`stripFabricatedSentences`, chế độ hội thoại) hoặc dòng
  (`scrubFabricatedLines`, chế độ báo cáo 4 phần — giữ khung cấu trúc, phần rỗng → "chưa đủ dữ
  liệu"), giữ lại phần còn lại vẫn sạch.
- **Trade-off**: phức tạp hơn về code (nhiều bước xử lý hơn "nuke" đơn giản); đổi lại giữ được
  nhiều giá trị thật hơn cho người dùng mỗi lần guard phải can thiệp.
- **Ảnh hưởng**: mọi lối vào Coach (Chat/Offline/Nudge) dùng chung pipeline này qua
  `guardedGenerate.js`.
- **Điều kiện xem xét lại**: không có kế hoạch đảo ngược — đây là kết quả của nhiều lần tinh chỉnh
  thực nghiệm, đã ổn định. Chỉ nên xem lại nếu bộ chấm điểm `eval.test.js` (BẮT %/BÁO NHẦM %) cho
  thấy chiến lược "cứu câu/cứu dòng" đang tạo ra câu văn cụt/khó hiểu quá mức trong thực tế sử dụng.

---

## ADR-001 — Không gộp `buildAchievementSnapshot` (real-time) và `buildAchievementSnapshotForReplay` (lịch sử)

- **Ngày**: không rõ ngày chính xác thiết lập ban đầu (trước 2026-07-12) — được TÁI XÁC NHẬN và
  ghi chép rõ trong đợt refactor 2026-07-12 khi rà soát toàn bộ trùng lặp code.
- **Bối cảnh**: hai hàm tính "ảnh chụp số liệu" (snapshot) trông giống nhau đến mức dễ bị đề xuất
  gộp lại trong bất kỳ đợt dọn dẹp trùng lặp nào.
- **Vấn đề**: `buildAchievementSnapshot` (gameStore.js) tính lại TỪ ĐẦU mỗi lần gọi — chấp nhận
  được vì chỉ chạy 1 lần/phiên hoàn thành (tần suất thấp). `buildAchievementSnapshotForReplay`
  (achievementTimeline.js) dùng thuật toán TÍCH LUỸ-GIA-TĂNG để phát lại TOÀN BỘ lịch sử một lần
  (suy luận ngày mở khoá cũ) — cần O(n), không thể chấp nhận O(n²) nếu phải tính lại từ đầu ở mỗi
  bước phát lại.
- **Phương án đã cân nhắc**:
  1. Gộp thành một hàm duy nhất, tham số hoá chế độ "tính từ đầu" vs "tích luỹ".
  2. Giữ 2 hàm riêng biệt, đồng bộ bằng kỷ luật comment cảnh báo tréo nhau.
- **Lý do loại bỏ phương án (1)**: buộc phải chọn MỘT đặc tính hiệu năng, gây hại cho trường hợp
  còn lại — nếu ép real-time dùng thuật toán tích luỹ, phải luồn một accumulator xuyên suốt toàn bộ
  `completeFocusSession` (thay đổi kiến trúc lớn cho lợi ích nhỏ); nếu ép replay dùng "tính từ đầu
  mỗi bước", một người dùng có hàng nghìn phiên sẽ có replay chậm rõ rệt (O(n²)).
- **Giải pháp được chọn**: phương án (2) — giữ 2 hàm tách biệt, mỗi file có một comment tiếng Việt
  cảnh báo TRỎ CHÉO sang file kia, yêu cầu tường minh: "Đổi field ở đây thì kiểm tra luôn bên kia
  kẻo lệch."
- **Trade-off**: rủi ro 2 hàm lệch nhau theo thời gian nếu ai đó thêm trường snapshot mới ở một
  nơi mà quên nơi kia — rủi ro này được giảm nhẹ (không loại bỏ hoàn toàn) bằng kỷ luật comment,
  KHÔNG có test/type tự động enforce việc này.
- **Ảnh hưởng**: bất kỳ achievement mới nào đọc một trường snapshot mới phải được thêm vào CẢ HAI
  hàm, nếu không thành tích đó sẽ mở khoá đúng real-time nhưng KHÔNG BAO GIỜ suy luận được ngày mở
  khoá hồi tố cho các save cũ.
- **Điều kiện xem xét lại**: nếu trong tương lai có bằng chứng cụ thể 2 hàm đã lệch nhau NHIỀU lần
  do lỗi con người quên đồng bộ, cân nhắc đầu tư một test tự động đối chiếu field-parity giữa 2
  hàm (không phải gộp hàm — chỉ enforce tự động rằng chúng luôn cùng field), hoặc một schema chung
  mô tả field bắt buộc để cả 2 hàm cùng implement.

---

## Ghi chú vận hành cho ADR log này

- Không backfill NGÀY một cách suy đoán — nếu không chắc chắn ngày chính xác, ghi rõ "không rõ
  ngày chính xác" thay vì bịa một ngày cụ thể. Nguyên tắc này nhất quán với triết lý chống-bịa số
  của chính AI Coach (xem `ARCHITECTURE.md` mục 3) — áp dụng cho cả tài liệu, không chỉ cho AI.
- Không phải mọi thay đổi đều xứng đáng một ADR — chỉ ghi quyết định có: (a) nhiều phương án thật
  sự được cân nhắc, (b) trade-off thật (không phải "chỉ có 1 cách làm đúng"), (c) ảnh hưởng lâu
  dài tới cách code được viết sau này. Một lần sửa bug thông thường không cần ADR — ghi vào
  `CHANGELOG.md`/`BAN_GIAO.md` là đủ.
