/**
 * drawCallBudget.test.js — MỐC LỆNH VẼ RIÊNG CHO TỪNG KỶ.
 *
 * ⚠️ ĐỌC ĐOẠN NÀY TRƯỚC (Đàm chốt 2026-08-21, §0 của Phase 13): **BẢNG NÀY NAY LÀ MỘT CÁI CÂN,
 * KHÔNG PHẢI MỘT CÁI CỔNG.** Luật cũ *"không được thêm một lệnh vẽ nào"* đã bị THU HỒI, vì số đo
 * trên máy thật bác nó: Apple M3, cảnh chậm nhất **5,20 ms** trên trần 16,67 ms ⇒ **dư 3,2 lần**,
 * và **80% chi phí tính theo ĐIỂM ẢNH** chứ không theo hình học (`PERFORMANCE.md`). Nguyên văn:
 * *"Tôi cần thành phố rộng hơn, quy mô hơn nữa và giống với thực tế lịch sử hơn nữa, không quan
 * trọng hiệu năng"* · *"Máy tôi là M3 MacBook Air chứ có yếu đâu"*.
 *
 * Vậy vì sao KHÔNG xoá file này đi? Vì cái cổng và cái cân trả lời hai câu khác nhau. Cổng hỏi
 * *"có được phép tốn thêm không?"* — câu ấy nay là **được**. Cân hỏi *"số ấy có đổi mà không ai
 * biết không?"* — câu ấy vẫn phải là **không**. Bỏ bảng đi là thả tự do cho trôi âm thầm, mà trôi
 * âm thầm chính là thứ đã để `PERFORMANCE.md` sai 6/15 dòng suốt một phase (`TECH_DEBT #43`).
 *
 * ⇒ Cách dùng từ nay: một dòng đi lên thì **đo lại, ghi ngày, và nói ra nó kéo thêm HỌ VẬT LIỆU
 * nào**. Cái vẫn bị cấm không phải việc tăng, mà là việc tăng **không giải thích được**.
 *
 * ⚠️ VÌ SAO KHÔNG CÓ MỘT CÁI TRẦN CHUNG (Đàm chốt 2026-08-18)
 *
 * Tài liệu từng ghi *"không quá 13 lệnh vẽ"*. Con số ấy đo trên đúng BA kỷ (6 · 9 · 13) rồi được
 * viết ra như luật của cả 15 kỷ; đo đủ 15 kỷ thì kỷ 10 ra 14 — và ra 14 **từ trước Phase 10**.
 * Cách sửa hiển nhiên là nâng trần lên 14. Đàm bác, vì lý do đúng:
 *
 *   *"14 kỷ khác đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ trống để trôi vào trong im
 *   lặng. Cổng chỉ bắt được kỷ tệ nhất."*
 *
 * Đây đúng bẫy Phase 7D — **một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ**. Lời
 * hứa thật không phải "≤ 13"; nó là *"kỷ này không được tốn hơn chính nó hôm nay"*. Nên mốc phải là
 * MỘT BẢNG 15 DÒNG, và mỗi dòng là một SỰ THẬT ĐO ĐƯỢC chứ không phải một con số ai đó chọn.
 *
 * ⚠️ PHÉP ĐO SINH RA BẢNG NÀY — chép lại để phiên sau tái lập được, đừng sửa số mà không chạy lại:
 *
 *     node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow
 *
 * chạy N = 1..15, ngày **2026-08-18**, trên cây làm việc sau Phase 10 Bước 2. Cột đọc là cột đầu
 * ("thành phố") của dòng `[stats] | lệnh vẽ | …`, tức KHÔNG gồm 2 lệnh vẽ của vòm trời + rặng núi.
 *
 * ⚠️ VÀ VÌ SAO BÀI TEST NÀY CHẠY ĐƯỢC BẰNG `node --test`, KHÔNG CẦN CHROMIUM
 *
 * Cả thành phố gộp thành **một khối hình học có nhóm vật liệu**, mỗi họ vật liệu một nhóm, và three
 * vẽ mỗi nhóm bằng một lệnh vẽ (`mergeSinks` ở `geometryFactory.js` duyệt theo `MATERIAL_ORDER`).
 * Ngoài khối gộp ấy, cảnh còn đúng bốn tấm cố định. Đem đối chiếu với phép đo thật ở cả 15 kỷ:
 *
 *     lệnh vẽ thành phố = (số họ vật liệu) + 4      ← đúng 15/15 kỷ, KHÔNG một ngoại lệ
 *
 * Đây **không phải một xấp xỉ** — hiệu số ra đúng 4 ở cả mười lăm kỷ, nên số họ vật liệu là một
 * phép tính CHÍNH XÁC cho số lệnh vẽ, không phải một thứ đại diện cho nó (`TECH_DEBT #22` là bài
 * học về việc nhầm hai chuyện đó). Vì `collectCitySpecs` thuần nên bài test này rẻ, chạy trong
 * `npm test`, và tự đỏ ngay lần đầu có ai kéo thêm một họ vật liệu vào một kỷ.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import { collectCitySpecs } from './cityParts.js';
import { getEraStyle, ERA_STYLES } from './eraStyle.js';
import { materialFamilyFor, MATERIAL_ORDER } from './materials.js';
import { humanShapesUsed } from './human.js';
import { waterIsBuilt } from './setting.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);

/**
 * ⚠️ HAI TẤM CỐ ĐỊNH — VÀ CON SỐ NÀY VỪA ĐƯỢC SỬA TỪ **4** XUỐNG **2 + số khuôn cư dân**
 * (2026-08-23), SAU KHI ĐẶT CẢ BẢNG CẠNH PHÉP ĐO THẬT LẦN ĐẦU TIÊN.
 *
 * Chú thích cũ ghi bốn tấm là *"nền ô lưới · mặt đường · **thân cư dân · đầu cư dân**"* — tức nó
 * đếm cư dân là HAI mesh, đúng như mô hình hai hộp thời ấy. **ADR-053 (2026-08-22) đã gộp hai mesh
 * đó làm một**, tiết kiệm thật một lệnh vẽ ở cả 15 kỷ; hằng số này thì đứng yên, và cả bảng
 * `MOC_LENH_VE` cao hơn sự thật đúng **+1 ở mười lăm dòng** kể từ hôm ấy.
 *
 * ⚠️ VÌ SAO KHÔNG CÓ GÌ ĐỎ LÊN, VÀ ĐÂY MỚI LÀ BÀI HỌC: bài *"QUAN HỆ ... phải còn đúng với phép đo
 * thật"* ở cuối file so `hoVatLieu(era).length + tamCoDinh(era)` với `MOC_LENH_VE[era]` — nhưng
 * `MOC_LENH_VE` **được suy ra từ chính công thức ấy**. Hai vế của phép so đều chứa cùng một hằng
 * số sai, nên chúng khớp nhau hoàn hảo trong khi cùng lệch khỏi thực tế. Đó đúng là *"một ngân
 * sách tự tính mà chưa bao giờ được đặt cạnh sự thật"* (Performance Gate 2026-08-17) — tái diễn
 * trong chính file sinh ra để chống trôi âm thầm, và tệ hơn một bậc: ở đó công thức lệch với thực
 * tế, ở đây công thức lệch với thực tế **rồi cái bảng dùng để kiểm nó cũng lệch y hệt**.
 *
 * ⇒ Cách vá không phải sửa 4 thành 3 (lại một hằng số chờ trôi) mà là **HỎI THẲNG thứ đang đếm**:
 * `humanShapesUsed(era).length`. Từ nay thêm/bớt một khuôn cơ thể là con số này tự đổi.
 *
 * ⚠️ VÀ BẢNG MỚI ĐÃ ĐƯỢC NEO VÀO THỰC TẾ: ba kỷ (1 · 8 · 13) đo lại bằng `city-preview --bench`
 * trong Chromium ngày 2026-08-23 ra ĐÚNG 11 · 17 · 12, khớp từng đơn vị với công thức. Không có
 * cái neo ấy thì bảng này lại chỉ là một công thức tự soi gương.
 */
const TAM_NEN_KHO = 2;      // nền ô lưới + mặt đường

function tamCoDinh(era) {
  return TAM_NEN_KHO + humanShapesUsed(era).length + (waterIsBuilt(era) ? 1 : 0);
}

/**
 * MỐC LỆNH VẼ THÀNH PHỐ của từng kỷ — đo ngày 2026-08-18 bằng lệnh ghi ở đầu file.
 *
 * ⚠️ ĐÂY LÀ SỐ ĐO, KHÔNG PHẢI SỐ CHỌN. Muốn sửa một dòng thì phải chạy lại phép đo và ghi lại ngày,
 * chứ không phải nới cho vừa kết quả — *"cổng KHÔNG mất tác dụng răn đe khi đặt lại cho đúng; nó
 * mất tác dụng khi giữ một con số sai rồi ai cũng học cách ngó lơ"* (Đàm, 2026-08-18).
 *
 * ⚠️ Kỷ 10 = 13 (cao nhất) vì nó là kỷ DUY NHẤT dùng cùng lúc cả `brick` lẫn `slate`. Đó là sự thật
 * về vật liệu thời công nghiệp Anh, không phải một khuyết tật — và tuyệt đối KHÔNG được gộp hai
 * vật liệu ấy lại để lấy một con số đẹp hơn (ADR-025 đã cấm đúng kiểu mua-số-bằng-cách-nói-dối này).
 *
 * ⚠️ ĐO LẠI NGÀY **2026-08-24** SAU ADR-057 (chân có đầu gối thật): mỗi kỷ **+1**, không ngoại lệ.
 * Hai đường đo độc lập cùng nói một con số — `node --import ./scripts/register-esm-loader.mjs
 * scripts/scene-tri.mjs --eras 1..15 --sessions 40 --level 1` (thuần Node, duyệt cảnh) và
 * `node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow` (Chromium, đọc thẳng
 * `renderer.info`) ở ba kỷ neo **1 · 8 · 13 = 13 · 19 · 14**. Không có cái neo ấy thì bảng 15 dòng
 * chỉ là một công thức tự soi gương.
 *
 * ⚠️ ĐO LẠI NGÀY 2026-08-20 SAU BƯỚC C (trải nước ra đủ 14 kỷ). So với `MOC_TRUOC_NUOC` bên dưới:
 * **kỷ 1 KHÔNG đổi một đơn vị, mười bốn kỷ còn lại đúng +1** — không kỷ nào +2, không kỷ khô nào
 * nhích. Đó chính là ràng buộc Đàm ra, và nó được kiểm bằng một PHÉP TRỪ ở bài test cuối file chứ
 * không bằng cách đọc hai bảng bằng mắt.
 */
/*
  ⚠️ ROUND 54 (ADR-094), VIỆC 6 — KỶ 2 ĐI XUỐNG MỘT ĐƠN VỊ: 17 → 16. ĐÂY LÀ MỘT KHOẢN TIẾT KIỆM,
  KHÔNG PHẢI MỘT KHOẢN CHI, và đó là lý do nó được ghi vào bảng chứ không được làm ngơ.
  Việc 6 đổi cái khố/xà rông (`wrap`) từ khuôn `prism` sang khuôn `flare` — một tấm vải quấn hông
  rồi buông xuống thì rộng ở gấu hơn ở thắt lưng, `prism` đọc ra một cái thùng đai. Kỷ 2 là kỷ
  DUY NHẤT trong 15 kỷ dùng `prism` chỉ vì cái khố ấy, nên nó rơi từ **7 khuôn xuống 6**, tức bớt
  đúng một `InstancedMesh` ⇒ bớt đúng một lệnh vẽ. Mười bốn kỷ còn lại không nhúc nhích
  (`humanShapesUsed` in ra đủ 15 dòng — đã đối chiếu từng dòng trước và sau).
  ⚠️ BA CÁI NEO CHROMIUM (kỷ 1 · 8 · 13) KHÔNG ĐỔI MỘT ĐƠN VỊ NÀO, nên bảng này vẫn còn được
  neo vào một phép đo thật chứ không trôi thành một công thức tự soi gương — đúng điều khối chú
  thích ngay trên cảnh báo. Bài test ở cuối file vẫn kiểm hiệu số `− MOC_TRUOC_HINH_KHOI` từng kỷ,
  nên nếu con số 16 này bịa ra thì kỷ 2 đỏ ngay: 16 − 11 = 5 = số khuôn (6) − 1.
*/
/*
  ⚠️ ROUND 58, VIỆC 3: **+1 Ở CẢ MƯỜI LĂM KỶ**, VÀ CON SỐ 1 ẤY CÓ TÊN — khuôn `skull`.
  Cái đầu thôi dùng `dome` và có đường sinh riêng: cằm · hàm thu · gò má · **chỗ thót ở thái
  dương** · trán dốc — năm trong bảy đặc điểm sọ Đàm đặt hàng, gói trong MỘT mặt tròn xoay không
  có chỗ gãy nào. Bản trước đã thử làm đúng bảy đặc điểm ấy bằng **tám khối lồi dán lên quả cầu**
  với 0 khuôn mới, tức 0 lệnh vẽ; ảnh chụp chính diện bác thẳng: gờ mày thành một thanh ngang như
  băng-đô, hai gò má thành hai quả bóng, cằm thành quả bóng thứ ba. Cộng nhiều vật LỒI không ra một
  mặt cong liền.
  ⇒ Đây là +1 lệnh vẽ cho toàn bộ dân số, ở mọi kỷ, và nó được trả tường minh: thành phố tiêu 18
  lệnh vẽ nên đây là +5,5%, đổi lấy hình dạng của thứ Đàm nay nhìn ở cự ly gần gấp năm. Không né
  được bằng cách sửa `dome`: `dome` còn dùng cho hai con mắt, con ngươi và sáu khớp cầu — một cái
  đầu gối hình đầu lâu thì tệ hơn nhiều.
  ⚠️ HIỆU SỐ VỚI MỐC CŨ PHẢI LÀ **+1 ĐỀU Ở CẢ 15 KỶ** — không kỷ nào +2. Một kỷ +2 nghĩa là có
  người vừa thêm một khuôn thứ hai mà không khai ở đây. Đo lại: 2026-09-13.
*/
const MOC_LENH_VE = {
  1: 15, 2: 17, 3: 19, 4: 17, 5: 18,
  6: 19, 7: 19, 8: 20, 9: 16, 10: 19,
  11: 16, 12: 16, 13: 16, 14: 16, 15: 16,
};

/**
 * MỐC NGAY TRƯỚC KHI CÁI ĐẦU CÓ KHUÔN RIÊNG — round 58, Việc 3. Giữ lại làm ĐỐI CHỨNG, đúng luật
 * riêng của file: *mỗi phase một mốc, mỗi mốc một phép trừ riêng*. Hiệu số phải là +1 ở cả 15 kỷ.
 */
const MOC_TRUOC_SO_RIENG = {
  1: 14, 2: 16, 3: 18, 4: 16, 5: 17,
  6: 18, 7: 18, 8: 19, 9: 15, 10: 18,
  11: 15, 12: 15, 13: 15, 14: 15, 15: 15,
};

/**
 * MỐC NGAY TRƯỚC KHI TÓC CÓ CHÂN TÓC — round 56, Phần A. Đây là `MOC_LENH_VE` nguyên văn của vòng
 * 55, giữ lại làm ĐỐI CHỨNG, đúng luật riêng của file: *mỗi phase một mốc, mỗi mốc một phép trừ
 * riêng*.
 *
 * ⚠️ HIỆU SỐ PHẢI LÀ **+1 Ở ĐÚNG BỐN KỶ 1 · 3 · 13 · 14, VÀ 0 Ở MƯỜI MỘT KỶ CÒN LẠI.** Con số 1
 * ấy có tên: khuôn `scalp` (mũ tóc có chân tóc) là một `InstancedMesh` mới. Bốn kỷ ấy là bốn kỷ
 * **đầu trần** — mũ thắng tóc (xem `buildHumanBody`), nên mười một kỷ đội mũ không dựng mũ tóc và
 * không được nhúc nhích. Một kỷ đội mũ mà nhích lên nghĩa là cái mũ đã thôi thắng và mỗi người
 * đang đeo cả hai.
 */
const MOC_TRUOC_CHAN_TOC = {
  1: 13, 2: 16, 3: 17, 4: 16, 5: 17,
  6: 18, 7: 18, 8: 19, 9: 15, 10: 18,
  11: 15, 12: 15, 13: 14, 14: 14, 15: 15,
};

/**
 * MỐC NGAY TRƯỚC KHI CHÂN CÓ ĐẦU GỐI THẬT (ADR-057) — đo ngày **2026-08-24** tại commit `ee6aee7`.
 * Giữ nguyên văn làm ĐỐI CHỨNG, và bài test cuối file lấy hiệu số của đúng hai bảng này.
 *
 * ⚠️ HIỆU SỐ PHẢI LÀ **+1 Ở CẢ 15 KỶ**, và con số 1 ấy có tên: cơ thể mới tách cẳng chân ra khỏi
 * đùi bằng một khuôn riêng (`calf`), tức thêm ĐÚNG MỘT khuôn ⇒ đúng một `InstancedMesh` ⇒ đúng một
 * lệnh vẽ. Không kỷ nào +2 (nghĩa là còn thứ khác đi ké), không kỷ nào +0 (nghĩa là kỷ ấy chưa
 * nhận bản vá). Đây là phép trừ riêng của phase này — KHÔNG được cộng dồn vào phép trừ của mặt
 * nước hay của vùng phụ cận, vì một hiệu số trộn hai thay đổi thì không ai đọc được vế nào tốn
 * bao nhiêu (bài học Performance Gate vòng 2).
 */
const MOC_TRUOC_KHOP_NGUOC = {
  1: 12, 2: 16, 3: 16, 4: 15, 5: 16,
  6: 17, 7: 17, 8: 18, 9: 14, 10: 17,
  11: 14, 12: 14, 13: 13, 14: 13, 15: 14,
};

/**
 * MỐC NGAY TRƯỚC KHI VẢI BIẾT XOÈ — round 54 (ADR-094), Việc 6. Đây là `MOC_LENH_VE` nguyên văn
 * của vòng 53, giữ lại làm ĐỐI CHỨNG.
 *
 * ⚠️ VÌ SAO PHẢI THÊM MỘT BẢNG NỮA THAY VÌ SỬA PHÉP TRỪ CỦA ĐẦU GỐI. Luật riêng của file này là
 * *mỗi phase một mốc, mỗi mốc một phép trừ riêng*, và vòng 54 là lần đầu luật ấy bị thử thật:
 * phép trừ đầu gối (`MOC_LENH_VE − MOC_TRUOC_KHOP_NGUOC = +1 ở cả 15 kỷ`) chạy xanh suốt ba vòng
 * chỉ vì KHÔNG AI đụng vào bộ khuôn cư dân kể từ ADR-057. Việc 6 đụng vào, và lập tức hiệu số của
 * kỷ 2 trộn HAI thay đổi khác nhau (đầu gối +1, vải xoè −1) rồi ra 0 — đúng con số mà thông điệp
 * lỗi gọi là *"kỷ ấy chưa nhận bản vá"*, tức một lời nói dối rất thuyết phục.
 * ⇒ Phép trừ đầu gối nay đọc cột "sau" của CHÍNH NÓ (bảng này), nên nó vẫn canh đúng lịch sử nó
 * sinh ra để canh, vĩnh viễn, dù vòng 60 có đổi bộ khuôn thêm mười lần nữa.
 */
const MOC_TRUOC_VAI_XOE = {
  1: 13, 2: 17, 3: 17, 4: 16, 5: 17,
  6: 18, 7: 18, 8: 19, 9: 15, 10: 18,
  11: 15, 12: 15, 13: 14, 14: 14, 15: 15,
};

/**
 * MỐC NGAY TRƯỚC KHI CƠ THỂ CÓ NHIỀU KHUÔN — đo ngày **2026-08-23** tại commit `f5a4e11` trong một
 * `git worktree` riêng, bằng `scripts/scene-tri.mjs`, và neo lại bằng `city-preview --bench` ở kỷ 1
 * (ra đúng 8 ở CẢ cấp 1 lẫn cấp 3).
 *
 * ⚠️ TỰ ĐO MỐC NỀN CỦA MÌNH, ĐỪNG CHÉP CỘT "SAU" CỦA PHASE TRƯỚC (`TECH_DEBT #43`). Nếu chép
 * `MOC_TRUOC_PHU_CAN` làm mốc nền cho bản này thì mọi hiệu số sẽ lệch +1, vì bảng ấy mang sẵn hằng
 * số `TAM_CO_DINH_KHO = 4` đã hỏng — và cái lệch ấy trông hoàn toàn hợp lý.
 */
const MOC_TRUOC_HINH_KHOI = {
  1: 8, 2: 11, 3: 11, 4: 11, 5: 11,
  6: 11, 7: 12, 8: 12, 9: 11, 10: 12,
  11: 10, 12: 10, 13: 10, 14: 10, 15: 10,
};

/**
 * BẢNG MỐC TRƯỚC KHI CÓ VÙNG PHỤ CẬN — đo ngày 2026-08-20, giữ nguyên văn làm ĐỐI CHỨNG THỨ HAI.
 *
 * ⚠️ VÌ SAO THÊM MỘT BẢNG NỮA THAY VÌ SỬA PHÉP TRỪ CŨ. Phép trừ cũ (`MOC_LENH_VE − MOC_TRUOC_NUOC`)
 * là câu hỏi *"mặt nước tốn bao nhiêu?"*. Nếu để Phase 13 cộng thêm vào chính hiệu số ấy thì nó
 * thành một con số TRỘN HAI THAY ĐỔI, và không ai còn đọc được vế nào tốn bao nhiêu — đúng bài học
 * *"một con số đúng vẫn trả lời sai câu hỏi nếu nó trộn hai đại lượng"* (Performance Gate vòng 2,
 * hằng số nền pha loãng 43% xuống 16%). Nên mỗi phase một mốc, mỗi mốc một phép trừ riêng.
 */
const MOC_TRUOC_PHU_CAN = {
  1: 8, 2: 11, 3: 11, 4: 11, 5: 10,
  6: 11, 7: 11, 8: 11, 9: 10, 10: 12,
  11: 10, 12: 10, 13: 10, 14: 10, 15: 10,
};

/**
 * ⚠️ BỐN KỶ MÀ VÙNG PHỤ CẬN KÉO THÊM ĐÚNG MỘT HỌ VẬT LIỆU — VÀ CẢ BỐN CÙNG MỘT LÝ DO.
 *
 * Kỷ 5 · 7 · 8 · 9 dựng bến hoặc cầu bắc qua mặt nước, nên chúng kéo họ `water` vào khối gộp thành
 * phố — một họ mà thành phố của chính chúng chưa từng dùng. Mười một kỷ còn lại **không đổi một
 * đơn vị**: hoặc chúng đã có sẵn họ `water` (kỷ 12–15), hoặc bảng khai `dock: 'none'` (kỷ 1).
 *
 * ⚠️ KHAI RA TƯỜNG MINH VÀ SO BẰNG `deepEqual`, KHÔNG PHẢI "bao gồm". Kỷ thứ năm trượt vào thì đỏ;
 * một trong bốn kỷ này được sửa cho hết trượt thì CŨNG đỏ. Đó là hai chiều, và chỉ phép so bằng
 * mới có cả hai — *"bao gồm" là cách một bản vá lặng lẽ thành một cái chăn trùm* (`TECH_DEBT #52`).
 */
const KY_PHU_CAN_THEM_HO = [5, 7, 8, 9];

/**
 * BẢNG MỐC TRƯỚC KHI CÓ MẶT NƯỚC — đo ngày 2026-08-18, giữ nguyên văn để làm ĐỐI CHỨNG.
 *
 * ⚠️ Không có bảng này thì câu *"nước chỉ tốn +1 lệnh vẽ, chỉ ở kỷ có nước"* là một lời hứa không
 * ai kiểm được: mốc mới sẽ chỉ là 15 con số, và bất kỳ con số nào cũng "khớp" với chính nó. Có nó
 * thì lời hứa trở thành một PHÉP TRỪ có thể đỏ (xem bài test cuối file).
 *
 * Đây cũng là chỗ kỷ 1 làm chứng, đúng ý Đàm khi anh chọn kỷ 1 vào bộ ba dựng hình:
 * *"Kỷ 1 làm chứng cho ràng buộc cứng: kỷ không nước giữ nguyên mốc lệnh vẽ, không đổi một đơn vị."*
 */
const MOC_TRUOC_NUOC = {
  1: 8, 2: 10, 3: 10, 4: 10, 5: 9,
  6: 10, 7: 10, 8: 10, 9: 9, 10: 11,
  11: 9, 12: 9, 13: 9, 14: 9, 15: 9,
};

/** Dựng đúng thành phố mà phép đo đã chụp: cả 5 bản vẽ, cấp 1, 40 phiên, chuỗi 9. */
function thanhPhoDoDuoc(era) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  return computeCityLayout({
    built:  ids,
    levels: Object.fromEntries(ids.map((id) => [id, 1])),
    era,
    stats:  { sessionCount: 40, streakLength: 9 },
  });
}

/**
 * Họ vật liệu của CẢ thành phố, theo đúng thứ tự `MATERIAL_ORDER` mà `mergeSinks` duyệt.
 *
 * ⚠️ `themHo` nhận một HỌ, không phải một VAI — và sự khác biệt ấy đã làm bản đầu của bài đối chứng
 * dưới đây ĐỎ OAN. `materialFamilyFor(vai, style)` là một phép ÁNH XẠ phụ thuộc kỷ: nhiều vai khác
 * nhau gộp về cùng một họ, và gộp về họ nào thì tuỳ kỷ. Nên "chọn một vai mà kỷ này chưa dùng"
 * KHÔNG bảo đảm sinh ra một họ mới — ở kỷ 2 cả tám vai thử đều rơi trúng bốn họ nó đã có. Đối
 * chứng phải nói thẳng bằng ngôn ngữ của thứ nó đang đếm.
 */
function hoVatLieu(era, themHo = null) {
  const style = getEraStyle(era);
  const ho = new Set();
  for (const item of collectCitySpecs({ layout: thanhPhoDoDuoc(era) })) {
    for (const part of item.spec.parts) ho.add(materialFamilyFor(part.role, style));
  }
  // Móng (plinth) do `sceneGraph.js` dựng, luôn mang vai `stone`. Nó nằm ngoài `collectCitySpecs`
  // vì cần cao độ địa hình, nhưng nó CÓ đi vào khối gộp nên phải tính vào đây.
  ho.add(materialFamilyFor('stone', style));
  if (themHo) ho.add(themHo);
  return MATERIAL_ORDER.filter((f) => ho.has(f));
}

function lenhVe(era, themHo = null) {
  return hoVatLieu(era, themHo).length + tamCoDinh(era);
}

/**
 * Tổng số khối của cả thành phố — chỉ dùng làm GÁC CHẠY-RỖNG.
 *
 * ⚠️ Không thể gác bằng chính số lệnh vẽ: `hoVatLieu` luôn cộng thêm họ của móng, nên kể cả khi
 * `collectCitySpecs` trả về RỖNG thì số lệnh vẽ vẫn ra 5 — lớn hơn `TAM_CO_DINH`, tức cái gác cũ
 * không thể đỏ. Phải hỏi thẳng thứ có thể biến mất.
 */
function soKhoiThanhPho(era) {
  let n = 0;
  for (const item of collectCitySpecs({ layout: thanhPhoDoDuoc(era) })) n += item.spec.parts.length;
  return n;
}

// ═══════════════════════════════════════════════════════════════════════════════

test('MỖI KỶ KHÔNG ĐƯỢC TỐN HƠN MỐC CỦA CHÍNH KỶ ĐÓ', () => {
  // THỬ-CHO-ĐỎ: đổi một vai bất kỳ trong `groundFloor.js`/`buildingSpec.js` sang một họ mà kỷ ấy
  // chưa có (ví dụ `'water'` ở kỷ 1) → chỉ kỷ đó đỏ, kèm tên họ vừa bị kéo vào.
  const bang = [];
  for (const era of ERAS) {
    const moc = MOC_LENH_VE[era];
    assert.ok(Number.isFinite(moc), `kỷ ${era} không có mốc — bảng phải đủ 15 dòng`);
    const thuc = lenhVe(era);
    bang.push({ era, thuc, moc });
    assert.ok(thuc <= moc,
      `kỷ ${era} tốn ${thuc} lệnh vẽ, vượt mốc ${moc} đo được ngày 2026-08-18. `
      + `Họ vật liệu hiện tại: ${hoVatLieu(era).join(', ')}. `
      + 'Đây KHÔNG phải chỗ để nới mốc — hoặc dùng lại một họ đã có, hoặc đo lại rồi ghi ngày mới.');
  }
  // Gác chạy-rỗng: phải duyệt đủ 15 kỷ và mọi kỷ phải thật sự sinh ra khối. Ngưỡng 100 khối lấy
  // rất thấp so với thực tế (kỷ mỏng nhất đo được 1.400+) — nó ở đây để bắt ca `collectCitySpecs`
  // trả rỗng, không phải để canh một ngân sách.
  assert.equal(bang.length, 15, 'không duyệt đủ 15 kỷ');
  for (const { era } of bang) {
    assert.ok(soKhoiThanhPho(era) > 100,
      `kỷ ${era}: thành phố chỉ có ${soKhoiThanhPho(era)} khối — \`collectCitySpecs\` gần như `
      + 'trả rỗng, cả bài test này đang đếm một thành phố không tồn tại');
  }
});

test('ĐỐI CHỨNG: kéo thêm MỘT họ vật liệu vào một kỷ thì mốc của kỷ ấy phải ĐỎ', () => {
  // ⚠️ Không có bài này thì bài trên có thể xanh vì nó chẳng đo gì. Luật Phase 9A: mỗi ngưỡng phải
  // kèm một đối chứng nhốt sẵn ca hỏng, nếu không nó sẽ bị nới dần cho tiện.
  //
  // Hỏi TỪNG KỶ MỘT, không hỏi tổng: một họ lạ ở đúng một kỷ phải làm ĐÚNG kỷ ấy vượt mốc. Hỏi
  // tổng thì một kỷ dư chỗ có thể bù cho một kỷ vượt — đúng cái phễu mà bảng-15-dòng sinh ra để gỡ.
  let soCaDoiChung = 0;
  for (const era of ERAS) {
    const dangCo = new Set(hoVatLieu(era));
    // Lấy một HỌ mà kỷ này chưa dùng, ngay từ `MATERIAL_ORDER`. Kỷ dày nhất mới dùng 8/16 họ nên
    // luôn còn — và nếu hết thì chính điều đó là một phát hiện, phải đỏ chứ không được bỏ qua.
    const hoLa = MATERIAL_ORDER.find((f) => !dangCo.has(f));
    assert.ok(hoLa, `kỷ ${era} đã dùng hết ${MATERIAL_ORDER.length} họ — đối chứng mất tác dụng`);
    const sauKhiThem = lenhVe(era, hoLa);
    assert.equal(sauKhiThem, MOC_LENH_VE[era] + 1,
      `kỷ ${era}: thêm họ "${hoLa}" mà số lệnh vẽ không nhích lên đúng 1 — phép đo đã hỏng`);
    assert.ok(sauKhiThem > MOC_LENH_VE[era],
      `kỷ ${era}: thêm họ "${hoLa}" mà vẫn lọt mốc ⇒ mốc của kỷ này đang rộng, không phải hàng rào`);
    soCaDoiChung += 1;
  }
  assert.equal(soCaDoiChung, 15, 'đối chứng không chạy đủ 15 kỷ');
});

test('BẢNG MỐC PHẢI LÀ 15 MỐC RIÊNG, KHÔNG PHẢI MỘT TRẦN CHUNG ĐỘI LỐT', () => {
  // ⚠️ ĐÂY LÀ BÀI CANH CHÍNH CÁI LÝ DO Đàm CHỌN CÁCH NÀY. Không có nó thì cách rẻ nhất để làm bài
  // đầu tiên hết đỏ là điền cả 15 dòng bằng cùng một số — bảng vẫn "có 15 dòng", vẫn xanh, và ta
  // quay lại đúng cái trần chung đã bị bác: 14 kỷ được tặng chỗ trống để trôi trong im lặng.
  const moc = ERAS.map((e) => MOC_LENH_VE[e]);
  const cao = Math.max(...moc);
  const thap = Math.min(...moc);
  assert.ok(cao - thap >= 2,
    `mọi mốc nằm trong ${thap}–${cao}: bảng này đang hành xử như một trần chung. Mốc phải bám sát `
    + 'phép đo của TỪNG kỷ, nếu không cổng chỉ bắt được kỷ tệ nhất.');
  // Và phần lớn các kỷ phải nằm THẤP HƠN mốc cao nhất — đó chính là phần mà một trần chung sẽ cho
  // không. Đo được 14/15 kỷ dưới mốc của kỷ 10 lúc viết bài này.
  const duoiDinh = moc.filter((m) => m < cao).length;
  assert.ok(duoiDinh >= 10,
    `chỉ ${duoiDinh}/15 kỷ nằm dưới mốc cao nhất — một trần chung sẽ gần như không cho không gì cả, `
    + 'tức bảng riêng từng kỷ mất lý do tồn tại. Xem lại phép đo.');
});

test('QUAN HỆ "lệnh vẽ = số họ + 2 + số khuôn cư dân (+1 nếu có nước)" phải khớp phép đo thật', () => {
  // ⚠️ ĐÂY LÀ BÀI ĐÃ TỪNG XANH TRONG KHI CẢ BẢNG SAI +1 Ở MƯỜI LĂM DÒNG — đọc kỹ trước khi tin nó.
  // Nó so `hoVatLieu + tamCoDinh` với `MOC_LENH_VE`, mà `MOC_LENH_VE` lại được SUY RA từ chính công
  // thức ấy. Hai vế cùng chứa một hằng số hỏng thì chúng khớp nhau hoàn hảo trong khi cùng lệch
  // khỏi thực tế (xem chú thích `TAM_NEN_KHO`: ADR-053 gộp hai mesh cư dân làm một, hằng số 4 không
  // ai sửa). ⇒ Một bài test tự soi gương thì không phải một cái gác.
  // Cái vá là ba dòng `assert.equal` NEO ngay bên dưới: chúng chép lại số đo Chromium thật, tức
  // một đường đo hoàn toàn độc lập với công thức này.
  for (const era of ERAS) {
    assert.equal(hoVatLieu(era).length + tamCoDinh(era), MOC_LENH_VE[era],
      `kỷ ${era}: số họ + ${tamCoDinh(era)} không còn khớp mốc đo được. Hoặc có tấm cố định mới (thì `
      + 'sửa `tamCoDinh` và đo lại cả bảng), hoặc thành phố đã đổi họ vật liệu.');
  }

  // ⚠️ NEO VÀO THỰC TẾ. Không có ba dòng này thì cả file chỉ là một công thức tự soi gương, và nó
  // ĐÃ từng lệch +1 suốt một phase mà không gì đỏ lên.
  // ⚠️ NEO VÀO CHROMIUM, VÀ PHẢI TRỪ ĐÚNG HAI TẤM NỀN. `renderer.info.render.calls` đếm CẢ KHUNG
  // HÌNH, tức cộng thêm vòm trời và rặng núi — hai mesh cố định ở mọi kỷ, không nằm trong
  // `hoVatLieu`. Bản trước ghi *"Chromium đo 11 lệnh vẽ thành phố"* trong khi Chromium chưa bao giờ
  // in ra con số 11: nó in ra con số của cả khung hình. Một lỗi NHÃN, đúng họ `frame-fit.mjs`
  // (Phase 7B) — số thì đúng, ý nghĩa thì sai, và phần dễ kiểm nhất của nó vẫn "khớp".
  //
  // ⚠️ VÀ PHẢI ĐO Ở ĐÚNG FIXTURE CỦA CHÍNH BÀI TEST NÀY (`--sessions 40 --level 1`, xem
  // `thanhPhoDoDuoc`). Trong lúc dựng bảng này tôi đã đo nhầm ở `--sessions 80 --level 3` và ra
  // kỷ 13 = 12 thay vì 13 — rồi suýt kết luận rằng công thức sai. Hai con số ấy nói về HAI THÀNH
  // PHỐ KHÁC NHAU (mạng đường và số nhà dân mở dần theo `sessionCount`). Đúng bài học
  // `TECH_DEBT #43`: *khi chép một fixture, cái được chép là một LỰA CHỌN của file ấy, không phải
  // mặc định của hệ thống.*
  //
  // Đo lại ngày **2026-08-24 (tối)** sau ADR-057, bằng ĐÚNG fixture của bài test này:
  //     node scripts/city-preview.mjs --era N --hour 12 --sessions 40 --level 1 --bench 1 --no-shadow
  // ⇒ kỷ 1 = **15** · kỷ 8 = **21** · kỷ 13 = **16** cả khung, tức đúng bảng dưới đây cộng 2 ở CẢ
  // BA kỷ, và đúng +1 so với bộ neo cũ (14 · 20 · 15).
  //
  // ⚠️ ĐO LẠI 2026-09-12 (round 56) — VÀ PHÉP ĐO LẠI ẤY BẮT ĐƯỢC MỘT CÁI GÁC ĐÃ NGỦ BA TUẦN.
  // Bộ neo cũ (15 · 21 · 16 cả khung, trừ 2) được ghi ngày 2026-08-24 và **chưa ai đo lại** suốt
  // các vòng 49…55. Đo lại hôm nay bằng ĐÚNG câu lệnh trên:
  //     kỷ 1  → cả khung 21 = thành phố 17 + nền 2 + trời 2
  //     kỷ 8  → cả khung 26 = thành phố 22 + nền 2 + trời 2
  //     kỷ 13 → cả khung 20 = thành phố 16 + nền 2 + trời 2
  // Hai điều lộ ra:
  //   1. **PHÉP TRỪ "− 2" ĐÃ SAI TỪ VÒNG 51.** Lớp trời (mây · sao · trăng) là một NHÓM MESH THỨ
  //      HAI ngoài nền, và `[stats]` in nó thành một cột riêng. Cả khung nay trừ BỐN, không phải
  //      hai. ⇒ Nay neo thẳng vào cột "thành phố" mà chính công cụ in ra, thay vì tự làm một phép
  //      trừ song song — đúng luật *một quan hệ một công thức*.
  //   2. **CÔNG THỨC ĐANG ĐẾM THIẾU 3 · 3 · 1 LỆNH VẼ.** Con số ấy KHÔNG phải của round 56 (round
  //      56 thêm đúng +1 và +1 đó đã nằm trong `MOC_LENH_VE`); nó tích lại giữa 2026-08-24 và
  //      2026-09-12. Kỷ 13 lệch 1 còn kỷ 1 và 8 lệch 3, tức nó phụ thuộc NỘI DUNG chứ không phải
  //      một hằng số nền — nghi can là những mesh sinh sau: hạt bụi/lửa (`motion.js`), khối phát
  //      sáng của lò rèn (`sceneGraph.js` glowMesh), vùng phụ cận (`outskirts`). Chưa truy ra thì
  //      chưa được đoán: khoản lệch được ghi thành một bảng CÓ TÊN, CÓ NGÀY, và vào `TECH_DEBT`.
  // ⚠️ VÌ SAO VẪN LÀ `assert.equal` CHỨ KHÔNG PHẢI `<=`. Một cái gác nới thành "không vượt quá" là
  // một cái gác đã chết: nó xanh với mọi thứ nhỏ hơn. Viết khoản lệch ra thành số thì hai vế vẫn
  // khớp CHÍNH XÁC, và bất kỳ ai đổi một trong hai bên đều làm nó đỏ ngay.
  /*
    ⚠️ ROUND 58: +1 Ở CẢ BA KỶ ĐO ĐƯỢC — khuôn `skull`. Đây là một bảng ĐO BẰNG CHROMIUM, không phải
    một bảng suy ra từ công thức, nên nó chỉ được sửa khi biết chắc khoản +1 ấy là gì. Ở đây biết:
    cái đầu có `InstancedMesh` riêng từ vòng 58, ở mọi kỷ, nên mọi cảnh đều +1. Khoản "lệch chưa
    truy nguyên nhân" giữ NGUYÊN (3 · 3 · 1) — nếu nó cũng phải đổi thì thay đổi này không phải
    chỉ là +1 khuôn, và đó mới là tin đáng sợ.
  */
  const DO_CHROMIUM_2026_09_12 = { 1: 18, 8: 23, 13: 17 };
  const HO_CHUA_TRUY_NGUYEN_NHAN = { 1: 3, 8: 3, 13: 1 };
  for (const era of [1, 8, 13]) {
    assert.equal(MOC_LENH_VE[era] + HO_CHUA_TRUY_NGUYEN_NHAN[era], DO_CHROMIUM_2026_09_12[era],
      `kỷ ${era}: công thức ra ${MOC_LENH_VE[era]} + khoản lệch chưa truy `
      + `${HO_CHUA_TRUY_NGUYEN_NHAN[era]} phải bằng ${DO_CHROMIUM_2026_09_12[era]} lệnh vẽ THÀNH PHỐ `
      + 'mà Chromium đo ngày 2026-09-12. Lệch đi thì hoặc công thức đổi, hoặc cảnh đổi — đo lại '
      + 'bằng: node scripts/city-preview.mjs --era N --hour 12 --sessions 40 --level 1 --bench 1 '
      + '--no-shadow, rồi đọc cột "thành phố" của dòng [stats] | lệnh vẽ |.');
  }
});

test('MẶT NƯỚC TỐN ĐÚNG +1 LỆNH VẼ, VÀ CHỈ Ở KỶ ĐÃ DỰNG HÌNH NƯỚC', () => {
  // THỬ-CHO-ĐỎ (nêu TRƯỚC, đúng luật Phase 8A): sửa `tamCoDinh` thành `TAM_CO_DINH_KHO + 1` (tức
  // nâng trần chung) ⇒ KỶ 1 đỏ ở dòng `assert.equal(hieu, ...)` với `hieu = 1` mà chờ 0. Sửa ngược
  // lại thành hằng số 4 ⇒ mười bốn kỷ có nước đỏ với `hieu = 0` mà chờ 1.
  //
  // ⚠️ SAU BƯỚC C CHỈ CÒN MỘT KỶ KHÔ, nên vế "không được tính tiền lên kỷ khô" nay chỉ còn ĐÚNG
  // MỘT nhân chứng. Đó là lý do gác chạy-rỗng bên dưới đếm cả hai phía (14 kỷ tăng · 1 kỷ không),
  // chứ không chỉ đếm phía tăng: một `waterIsBuilt` hỏng theo hướng "luôn trả true" sẽ làm kỷ 1
  // im lặng đi theo, và phía tăng vẫn ra 15 trông rất giống 14.
  let soKyTang = 0;
  for (const era of ERAS) {
    const truoc = MOC_TRUOC_NUOC[era];
    assert.ok(Number.isFinite(truoc), `kỷ ${era} thiếu mốc trước-nước — đối chứng mất một dòng`);
    const hieu = MOC_TRUOC_PHU_CAN[era] - truoc;
    const coNuoc = waterIsBuilt(era);
    assert.equal(hieu, coNuoc ? 1 : 0,
      `kỷ ${era}: mốc đi từ ${truoc} lên ${MOC_TRUOC_PHU_CAN[era]} (lệch ${hieu}) trong khi kỷ này `
      + `${coNuoc ? 'CÓ' : 'KHÔNG có'} mặt nước đã dựng. Nước được phép tốn đúng +1 lệnh vẽ và chỉ `
      + 'ở kỷ có nước — mọi thay đổi khác phải đo lại rồi ghi ngày mới, không được đi ké dòng này.');
    if (coNuoc) soKyTang += 1;
  }
  // Đếm CẢ HAI PHÍA. Xem chú thích thử-cho-đỏ ở đầu bài: đếm một phía thì một `waterIsBuilt` hỏng
  // theo hướng "luôn trả true" cho ra 15 — sát 14 tới mức rất dễ được đọc lướt thành đúng.
  assert.equal(ERAS.length - soKyTang, 1, 'phải còn ĐÚNG một kỷ khô (kỷ 1) sau Bước C');
  // Gác chạy-rỗng: nếu `waterIsBuilt` hỏng và trả `false` ở mọi kỷ thì vòng trên vẫn xanh trơn tru
  // trong khi nó chẳng kiểm gì về nước cả.
  assert.equal(soKyTang, 14,
    `chỉ ${soKyTang} kỷ được cộng lệnh vẽ nước — Bước C đã dựng hình cho ĐỦ 14 kỷ có nước (mọi kỷ `
    + 'trừ kỷ 1). Số này đổi thì phải đổi cùng lúc với `ERAS_WITH_WATER_GEOMETRY` và phải đo lại '
    + 'từng kỷ.');
});

test('KỶ KHÔ KHÔNG ĐƯỢC ĐỔI MỘT ĐƠN VỊ NÀO — KỶ 1 LÀM CHỨNG', () => {
  // ⚠️ Bài trên so hai BẢNG SỐ; bài này so bảng số với thứ mã THẬT SỰ TÍNH RA. Hai câu hỏi khác
  // nhau: bảng có thể được sửa cho khớp nhau mà mã lại tính ra một con số thứ ba.
  //
  // THỬ-CHO-ĐỎ: bỏ điều kiện `waterIsBuilt` trong `tamCoDinh` ⇒ kỷ 1 đỏ ngay ở dòng đầu (10 ≠ 9).
  assert.equal(waterIsBuilt(1), false, 'kỷ 1 phải là kỷ KHÔ — cả bộ ba Bước B dựa vào điều đó');

  // ⚠️ LỜI HỨA PHẢI ĐƯỢC PHÁT BIỂU LẠI, KHÔNG PHẢI BỎ ĐI (2026-08-23). Bản cũ đòi `lenhVe(1)` bằng
  // ĐÚNG mốc trước-nước — đúng chừng nào không phase nào sau đó chạm vào kỷ 1. Phase "cơ thể có
  // nhiều khuôn" chạm: kỷ 1 tốn thêm 3 lệnh vẽ, vì cư dân đi từ 1 khuôn lên 4. Cách vá SAI là xoá
  // bài này ("nó cản đường"); cách vá đúng là tách hiệu số ra thành các nguyên nhân ĐẾM ĐƯỢC rồi
  // đòi phần còn lại bằng 0. Nước vẫn phải không tính tiền lên kỷ khô, và nay điều đó vẫn kiểm được.
  const doHinhKhoi = humanShapesUsed(1).length - 1;   // cư dân xưa là ĐÚNG một mesh
  assert.equal(lenhVe(1) - doHinhKhoi, MOC_TRUOC_NUOC[1],
    `kỷ 1 (Thổ Nhĩ Kỳ, khô) tốn ${lenhVe(1)} lệnh vẽ; trừ ${doHinhKhoi} lệnh do cơ thể có nhiều `
    + `khuôn thì còn ${lenhVe(1) - doHinhKhoi}, đáng lẽ phải bằng mốc trước-nước ${MOC_TRUOC_NUOC[1]}. `
    + 'Đây là kỷ Đàm chọn làm nhân chứng cho ràng buộc "nước không được tính tiền lên kỷ không có '
    + 'nước" — phần dư khác 0 nghĩa là có thứ khác vừa lén tính tiền lên nó.');

  const kho = ERAS.filter((e) => !waterIsBuilt(e));
  assert.equal(kho.length, 1, 'sau Bước C chỉ còn ĐÚNG một kỷ khô (kỷ 1)');
  for (const era of kho) {
    assert.equal(lenhVe(era) - (humanShapesUsed(era).length - 1), MOC_TRUOC_NUOC[era],
      `kỷ ${era} không có mặt nước nhưng số lệnh vẽ đã đổi khỏi mốc trước-nước (${MOC_TRUOC_NUOC[era]}) `
      + 'bởi một nguyên nhân KHÁC hình khối cư dân.');
  }
});

test('CƠ THỂ NHIỀU KHUÔN TỐN ĐÚNG (số khuôn − 1) LỆNH VẼ, TỪNG KỶ MỘT', () => {
  // ⚠️ MỘT PHÉP TRỪ RIÊNG CHO PHASE NÀY — đúng luật file này đã tự đặt: *mỗi phase một mốc, mỗi
  // mốc một phép trừ riêng*. Trước 2026-08-23 cả cộng đồng đi qua ĐÚNG MỘT `InstancedMesh` (một
  // hộp đơn vị), nên cái giá của việc cơ thể thôi làm chồng gạch phải bằng đúng `số khuôn − 1`.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC): cho `headgearPieces` trả về hai khối cho `brim` (một `prism` + một
  // `dome`) ⇒ kỷ 7 · 8 · 11 đỏ, vì số khuôn nhích lên mà `MOC_LENH_VE` thì không.
  const boSung = [];
  for (const era of ERAS) {
    const truoc = MOC_TRUOC_HINH_KHOI[era];
    assert.ok(Number.isFinite(truoc), `kỷ ${era} thiếu mốc trước-hình-khối`);
    const soKhuon = humanShapesUsed(era).length;
    const hieu = MOC_LENH_VE[era] - truoc;
    assert.equal(hieu, soKhuon - 1,
      `kỷ ${era}: mốc đi từ ${truoc} lên ${MOC_LENH_VE[era]} (lệch ${hieu}) trong khi cơ thể kỷ này `
      + `dùng ${soKhuon} khuôn (${humanShapesUsed(era).join(', ')}) ⇒ đáng lẽ lệch ${soKhuon - 1}. `
      + 'Lệch nhiều hơn nghĩa là có thứ KHÁC cũng vừa thêm một lệnh vẽ và đang đi ké dòng này.');
    boSung.push(soKhuon);
  }

  // ⚠️ GÁC CHẠY-RỖNG HAI PHÍA. Nếu mọi kỷ dùng cùng một số khuôn thì phép trừ trên vẫn xanh trơn
  // tru trong khi nó chẳng phân biệt được gì — và lúc ấy "một mesh cho mỗi khuôn" thật ra đã thoái
  // hoá về "một mesh cho tất cả", đúng thứ bảng-15-dòng sinh ra để bắt.
  assert.ok(Math.max(...boSung) - Math.min(...boSung) >= 2,
    `số khuôn của 15 kỷ nằm gọn trong ${Math.min(...boSung)}–${Math.max(...boSung)} — bộ khuôn đang `
    + 'hành xử như một khuôn chung, tức 15 kỷ lại dựng cùng một hình người.');
  assert.ok(Math.min(...boSung) >= 3, 'kỷ mỏng nhất phải còn ít nhất 3 khuôn (chi · hộp · vòm)');

  console.log(`[lệnh vẽ] cư dân: ${Math.min(...boSung)}–${Math.max(...boSung)} khuôn/kỷ`
    + ` ⇒ +${Math.min(...boSung) - 1}…+${Math.max(...boSung) - 1} lệnh vẽ so với mô hình một-hộp`);
});

test('VÙNG PHỤ CẬN CHỈ ĐƯỢC TỐN +1 LỆNH VẼ, VÀ CHỈ Ở KỶ KÉO THÊM MỘT HỌ VẬT LIỆU', () => {
  /**
   * ⚠️ §0 CỦA PHASE 13 ĐÃ THU HỒI CÁI HÀNG RÀO, NHƯNG KHÔNG THU HỒI PHÉP ĐẾM — và đây là chỗ phân
   * biệt hai chuyện đó. Đàm viết: *"Máy tôi là M3 MacBook Air chứ có yếu đâu"*, và số đo đồng ý:
   * cảnh chậm nhất 5,20 ms trên trần 16,67 ms ⇒ **dư 3,2 lần**, mà 80% chi phí tính theo ĐIỂM ẢNH
   * chứ không theo hình học (`PERFORMANCE.md`). Nên "thêm một lệnh vẽ" thôi KHÔNG còn là lý do để
   * chặn một phase.
   *
   * Nhưng bảng này vẫn phải sống, vì nó trả lời một câu KHÁC: *"số ấy có đổi mà không ai biết
   * không?"* Một mốc đo được, cập nhật có chủ đích, vẫn bắt được **trôi âm thầm** — thứ mà việc bỏ
   * hẳn bảng đi sẽ thả tự do. Nói gọn: nay nó là một **CÁI CÂN**, không phải một **CÁI CỔNG**.
   *
   * THỬ-CHO-ĐỎ (đã chạy thật, nêu trước chỗ mong đợi đỏ): sửa `KY_PHU_CAN_THEM_HO` thành
   * `[5, 7, 8]` ⇒ đỏ ở `deepEqual` với thông báo kể tên kỷ 9.
   */
  const tang = [];
  for (const era of ERAS) {
    const truoc = MOC_TRUOC_PHU_CAN[era];
    assert.ok(Number.isFinite(truoc), `kỷ ${era} thiếu mốc trước-phụ-cận — đối chứng mất một dòng`);
    // ⚠️ CỘT "SAU" LÀ `MOC_TRUOC_HINH_KHOI`, KHÔNG PHẢI `MOC_LENH_VE` (sửa 2026-08-23). Phase
    // "cơ thể có nhiều khuôn" nằm SAU vùng phụ cận, nên để `MOC_LENH_VE` ở đây là trộn hai thay
    // đổi vào một hiệu số và không ai còn đọc được vế nào tốn bao nhiêu — đúng luật file này đã
    // tự đặt ra: *mỗi phase một mốc, mỗi mốc một phép trừ riêng*.
    const hieu = MOC_TRUOC_HINH_KHOI[era] - truoc;
    assert.ok(hieu === 0 || hieu === 1,
      `kỷ ${era}: mốc đi từ ${truoc} lên ${MOC_TRUOC_HINH_KHOI[era]} (lệch ${hieu}). Vùng phụ cận được `
      + 'phép kéo thêm TỐI ĐA một họ vật liệu; lệch 2 nghĩa là nó kéo hai họ, và lúc đó phải đi tìm '
      + 'xem hình nào dùng vai lạ chứ không phải sửa con số cho vừa.');
    if (hieu === 1) tang.push(era);
  }
  assert.deepEqual(tang, KY_PHU_CAN_THEM_HO,
    'danh sách kỷ tốn thêm lệnh vẽ đã đổi. Cả bốn kỷ trong bảng đều tăng vì CÙNG một họ (`water`, '
    + 'do bến/cầu chạm mặt nước). Một kỷ thứ năm trượt vào thì phải nói được nó kéo họ NÀO và vì '
    + 'sao — đừng thêm số vào bảng trước rồi mới đi tìm lý do.');

  // Gác chạy-rỗng: bảng phải THẬT SỰ có kỷ tăng và THẬT SỰ có kỷ đứng yên. Không có vế này thì một
  // `MOC_LENH_VE` bị chép đè bằng chính `MOC_TRUOC_PHU_CAN` sẽ cho ra `tang = []` và bài test xanh
  // trơn tru về một thế giới mà phase này chưa hề xảy ra.
  assert.ok(tang.length > 0 && tang.length < ERAS.length,
    'hoặc không kỷ nào tăng, hoặc mọi kỷ đều tăng — cả hai đều là dấu hiệu bảng bị chép đè.');
});

test('ADR-057: CẲNG CHÂN TÁCH RA KHỎI ĐÙI TỐN ĐÚNG **MỘT** LỆNH VẼ, Ở CẢ 15 KỶ', () => {
  // ⚠️ MỘT PHÉP TRỪ RIÊNG CHO PHASE NÀY — đúng luật file này đã tự đặt: *mỗi phase một mốc, mỗi mốc
  // một phép trừ riêng*. Cộng dồn vào phép trừ của phase trước thì ra một hiệu số TRỘN HAI THAY
  // ĐỔI, và không ai còn đọc được vế nào tốn bao nhiêu.
  //
  // Vì sao đúng 1: chân cũ là MỘT khối `limb` từ hông xuống bàn chân. Chân mới là đùi (`limb`, đã
  // có) + cẳng chân (`calf`, MỚI) + bàn chân (`box`, đã có) ⇒ bộ khuôn của mọi kỷ dài thêm đúng
  // một phần tử ⇒ đúng một `InstancedMesh`.
  //
  // THỬ-CHO-ĐỎ (nêu TRƯỚC): đổi khuôn cẳng chân từ `calf` sang `limb` (dùng lại khuôn đùi) ⇒ số
  // khuôn không nhích, hiệu số về 0, và cả 15 kỷ đỏ.
  // ⚠️ CỘT "SAU" LÀ `MOC_TRUOC_VAI_XOE`, KHÔNG PHẢI `MOC_LENH_VE` (sửa ở round 54 — xem khối chú
  // thích của bảng ấy). Đọc `MOC_LENH_VE` thì hiệu số này trộn đầu gối với mọi thay đổi bộ khuôn
  // về sau, và ở kỷ 2 nó vừa ra 0 kèm một thông điệp lỗi đổ tội cho đúng thứ không có lỗi.
  const lech = [];
  for (const era of ERAS) {
    const truoc = MOC_TRUOC_KHOP_NGUOC[era];
    assert.ok(Number.isFinite(truoc), `kỷ ${era} thiếu mốc trước-khớp-ngược`);
    const hieu = MOC_TRUOC_VAI_XOE[era] - truoc;
    assert.equal(hieu, 1,
      `kỷ ${era}: mốc đi từ ${truoc} lên ${MOC_TRUOC_VAI_XOE[era]} (lệch ${hieu}). Đầu gối thật chỉ được`
      + ' tốn ĐÚNG một lệnh vẽ — lệch hơn nghĩa là có thứ khác đang đi ké dòng này, lệch 0 nghĩa là'
      + ' kỷ ấy chưa nhận bản vá.');
    lech.push(hieu);
    // Và cái khuôn mới ấy phải THẬT SỰ có mặt ở mọi kỷ — nếu không thì hiệu số +1 đang được trả
    // bằng một thứ khác và phép trừ trên chỉ đúng nhờ một sự trùng hợp (bẫy Phase 7D).
    assert.ok(humanShapesUsed(era).includes('calf'),
      `kỷ ${era}: bộ khuôn không có \`calf\` — cẳng chân chưa tách khỏi đùi`);
    assert.ok(humanShapesUsed(era).includes('limb'),
      `kỷ ${era}: bộ khuôn không có \`limb\``);
  }
  assert.equal(new Set(lech).size, 1, 'phải là +1 ĐỒNG ĐỀU ở 15 kỷ, không phải trung bình +1');
});

test('ROUND 54 · VIỆC 6: VẢI XOÈ BỚT ĐÚNG MỘT LỆNH VẼ, VÀ CHỈ Ở KỶ 2', () => {
  /*
    ⚠️ PHÉP TRỪ RIÊNG CỦA VÒNG 54 — và nó canh một khoản TIẾT KIỆM, thứ dễ bị bỏ qua nhất.
    Việc 6 đổi cái khố/xà rông từ `prism` sang `flare`. Kỷ 2 là kỷ duy nhất dùng `prism` CHỈ vì
    cái khố ấy, nên nó bớt đúng một `InstancedMesh`. Mười bốn kỷ còn lại không được nhúc nhích:
    nếu một kỷ khác cũng đổi thì hoặc `flare` đã lén thay một khuôn khác, hoặc một khuôn mới vừa
    vào mà không ai khai.
    ⚠️ VÀ VẾ THỨ HAI MỚI LÀ VẾ KHÓ: `prism` phải BIẾN MẤT khỏi kỷ 2 chứ không chỉ là con số nhỏ đi.
    Không có vế ấy thì một bản vá làm số lệnh vẽ nhỏ đi vì lý do hoàn toàn khác vẫn xanh trơn tru.
    THỬ-CHO-ĐỎ (đã chạy): trả `wrap` về khuôn `prism` ⇒ cả hai vế đỏ.
  */
  for (const era of ERAS) {
    const hieu = MOC_TRUOC_CHAN_TOC[era] - MOC_TRUOC_VAI_XOE[era];
    assert.equal(hieu, era === 2 ? -1 : 0,
      `kỷ ${era}: mốc đi từ ${MOC_TRUOC_VAI_XOE[era]} xuống ${MOC_TRUOC_CHAN_TOC[era]} (lệch ${hieu}) — `
      + 'Việc 6 chỉ được bớt một lệnh vẽ ở ĐÚNG kỷ 2, và không được thêm ở kỷ nào.');
  }
  assert.ok(!humanShapesUsed(2).includes('prism'),
    'kỷ 2 vẫn còn khuôn `prism` — cái khố chưa đổi sang `flare`, nên con số 16 ở trên là bịa');
  assert.ok(humanShapesUsed(2).includes('flare'),
    'kỷ 2 không có khuôn `flare` — cái khố đã mất khuôn cũ mà chưa nhận khuôn mới');
});

test('ROUND 56 · PHẦN A: CHÂN TÓC TỐN ĐÚNG MỘT LỆNH VẼ, VÀ CHỈ Ở BỐN KỶ ĐẦU TRẦN', () => {
  /*
    ⚠️ PHÉP TRỪ RIÊNG CỦA VÒNG 56, và vế thứ hai mới là vế đáng tiền.
    Phần A thay mũ tóc `dome` bằng khuôn `scalp` (chân tóc không nằm ngang) và cho cả `bun` lẫn
    `braid` một mũ tóc — trước đó hai kiểu ấy dựng búi/bím trên một cái SỌ TRỌC. Chi phí là đúng
    một khuôn mới ⇒ đúng một `InstancedMesh` ⇒ đúng một lệnh vẽ, ở đúng bốn kỷ đầu trần.
    ⚠️ Vế hai: `scalp` phải CÓ MẶT ở đúng bốn kỷ ấy và VẮNG ở mười một kỷ kia. Không có vế ấy thì
    một bản vá làm số lệnh vẽ nhích lên vì lý do hoàn toàn khác vẫn xanh trơn tru — đúng cái bẫy
    mà phép trừ của vòng 54 đã phải thêm vế `prism` biến mất để tránh.
    THỬ-CHO-ĐỎ (đã chạy): bỏ dòng `scalp` trong `hairPieces` ⇒ cả hai vế đỏ ở bốn kỷ.
  */
  const DAU_TRAN = [1, 3, 13, 14];
  for (const era of ERAS) {
    // ⚠️ ROUND 58: VẾ TRÁI ĐỔI TỪ `MOC_LENH_VE` SANG `MOC_TRUOC_SO_RIENG`, VÀ ĐÓ LÀ LUẬT CỦA CHÍNH
    // FILE NÀY: *mỗi phase một mốc, mỗi mốc một phép trừ riêng*. Vòng 58 thêm khuôn `skull` (+1 ở
    // CẢ 15 kỷ), nên nếu phép trừ của vòng 56 vẫn trỏ vào mốc hiện tại thì nó đo HAI thay đổi cùng
    // lúc và báo "lệch 2" ở bốn kỷ đầu trần. Mỗi phép trừ phải kẹp đúng một thay đổi.
    const hieu = MOC_TRUOC_SO_RIENG[era] - MOC_TRUOC_CHAN_TOC[era];
    assert.equal(hieu, DAU_TRAN.includes(era) ? 1 : 0,
      `kỷ ${era}: mốc đi từ ${MOC_TRUOC_CHAN_TOC[era]} lên ${MOC_TRUOC_SO_RIENG[era]} (lệch ${hieu}) — `
      + 'chân tóc chỉ được tốn một lệnh vẽ ở đúng bốn kỷ đầu trần 1 · 3 · 13 · 14.');
    assert.equal(humanShapesUsed(era).includes('scalp'), DAU_TRAN.includes(era),
      `kỷ ${era}: khuôn \`scalp\` ${humanShapesUsed(era).includes('scalp') ? 'CÓ' : 'VẮNG'} mà `
      + `đáng lẽ phải ${DAU_TRAN.includes(era) ? 'CÓ' : 'VẮNG'} — con số mốc ở trên đang bịa.`);
  }
});
