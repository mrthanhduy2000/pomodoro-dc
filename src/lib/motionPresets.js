/**
 * motionPresets.js — BA NHỊP CHUYỂN ĐỘNG DUY NHẤT CỦA APP.
 * ─────────────────────────────────────────────────────────────────────────────
 * VÌ SAO CÓ FILE NÀY: trước 2026-08-27, `initial`/`animate`/`transition` được khai RỜI RẠC ở hơn
 * ba mươi file — mỗi chỗ một thời lượng (0,18 · 0,22 · 0,26 · 0,28 · 0,35 giây) và một đường cong
 * riêng (`easeOut`, `[0.4,0,0.2,1]`, `[0.22,1,0.36,1]`, spring 200/300/380/420…). Mắt không đọc ra
 * "app này mượt"; nó đọc ra "mỗi chỗ một kiểu". Một hệ chuyển động chỉ thành HỆ khi số nhịp ít tới
 * mức nhớ được — và ba là con số ấy.
 *
 * ⚠️ ĐÚNG BA PRESET, KHÔNG HƠN. Thêm cái thứ tư là bắt đầu quay lại tình trạng cũ, chỉ chậm hơn.
 * Gặp một chuyển động không vừa ba nhịp này thì hỏi trước: *"nó có thật sự là một nhịp MỚI, hay
 * chỉ là một chỗ đáng lẽ phải dùng `enter`?"* — gần như luôn là vế sau.
 *
 *   enter  — thứ XUẤT HIỆN (thẻ, panel, modal, màn hình, dòng vừa được thêm vào danh sách).
 *   press  — thứ BẤM ĐƯỢC (phản hồi cho ngón tay: có, tôi nhận được cú bấm).
 *   reward — PHẦN THƯỞNG và CỘT MỐC. Đây là nhịp ĐẮT nhất; dùng bừa thì nó hết là phần thưởng.
 *
 * CÁCH DÙNG — trải preset vào thẳng thẻ `motion.*`, không viết lại `initial`/`animate` bằng tay:
 *
 *     const enter = useEnterMotion();
 *     return <Motion.div {...enter}>…</Motion.div>;
 *
 * ⚠️ CẢ BA TỰ LO "GIẢM CHUYỂN ĐỘNG": khi hệ điều hành bật *Giảm chuyển động* (Mac: Cài đặt hệ
 * thống → Trợ năng → Màn hình; iPhone: Trợ năng → Chuyển động), cả ba hook trả về **object rỗng**
 * ⇒ thẻ `motion.*` không nhận `initial`/`animate`/`whileTap` nào và đứng yên tuyệt đối. CHỖ GỌI
 * KHÔNG PHẢI TỰ KIỂM TRA — đó chính là lý do chúng là hook chứ không phải hằng số. Mỗi chỗ tự viết
 * `reduceMotion ? undefined : …` là "một luật ba mươi công thức", và đã có sẵn hai kiểu tên biến
 * khác nhau (`reduceMotion`, `shouldReduceMotion`, `prefersReducedMotion`) chứng minh điều đó.
 *
 * ⚠️ CHÚ Ý VỀ `transition` CỦA `press`: nó nằm BÊN TRONG `whileTap` chứ không ở cấp ngoài. Để ở
 * ngoài thì việc trải preset sẽ ĐÈ MẤT `transition` riêng của thẻ (nhiều nút vừa có `whileTap`
 * vừa có `animate` riêng) — một cách hỏng im lặng, không có gì đỏ lên.
 */
import { useReducedMotion } from 'framer-motion';

/**
 * Đường cong DUY NHẤT của app: bung nhanh rồi hãm mượt về đích (ease-out bậc bốn).
 * Nó vốn đã có mặt ở `PomodoroEngine.jsx` từ trước; chọn nó thay vì `[0.4,0,0.2,1]` (Material) vì
 * nó tới đích sớm hơn nên cùng một thời lượng lại CẢM GIÁC nhanh hơn.
 */
export const EASE = [0.22, 1, 0.36, 1];

/** Object rỗng dùng chung cho cả ba hook lúc "Giảm chuyển động" đang bật — đóng băng để khỏi ai sửa. */
const STILL = Object.freeze({});

/**
 * enter — 180ms. `y: 6` chứ không phải 10/12/16/24 như các bản cũ: đủ để mắt đọc ra hướng "đi lên
 * chỗ của mình", chưa đủ để thành một cú trượt. Có sẵn `exit` (ngược chiều) vì `AnimatePresence`
 * ở chế độ `mode="wait"` sẽ tháo phần tử NGAY LẬP TỨC nếu không có `exit` — bỏ nó đi là làm mọi
 * lần chuyển tab giật một cái.
 */
const ENTER = Object.freeze({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: EASE },
});

/**
 * press — 90ms. Đúng một nửa `enter`: phản hồi cho ngón tay phải tới TRƯỚC khi người ta kịp hỏi
 * "nó có nhận không?". `transition` nằm trong `whileTap` (xem chú thích đầu file).
 */
const PRESS = Object.freeze({
  whileTap: { scale: 0.97, transition: { duration: 0.09, ease: EASE } },
});

/**
 * reward — lò xo, KHÔNG phải thời lượng. Đây là nhịp duy nhất được phép vọt quá đích rồi lắc về:
 * chính cú vọt lố ấy là thứ mắt đọc ra "vừa được thưởng".
 *
 * ⚠️ ĐỘ VỌT LỐ LÀ HỆ QUẢ CỦA LÒ XO, KHÔNG PHẢI MỘT CON SỐ TỰ ĐẶT. Chỉ thị gốc ghi "0,9 sang 1,04
 * rồi về 1" KÈM "spring stiffness 420 damping 18" — hai vế ấy KHÔNG THỂ CÙNG ĐÚNG, và điều đó đã
 * được ĐO chứ không suy đoán:
 *   · framer-motion 12.38 CHẶN THẲNG lò xo có quá hai mốc (`JSAnimation.mjs`: *"Only two keyframes
 *     currently supported with spring and inertia animations"*) — và `invariant` ấy **ném lỗi ở
 *     bản dev, im lặng ở bản production**, tức viết `[0.9, 1.04, 1]` là gài một quả mìn chỉ nổ ở
 *     một trong hai môi trường.
 *   · Đo đỉnh thật của `spring(420, 18)` đi từ 0,9 tới 1: **1,0215 ở mốc 171ms, đứng yên ở 337ms**
 *     (chạy thẳng `spring()` của `motion-dom`). Muốn đỉnh đúng 1,04 thì phải hạ `damping` xuống
 *     **11,5** (đo được 1,0399) — đổi MỘT con số dưới đây là xong.
 * Giữ đúng 420/18 như chỉ thị đã ghi; hình dạng "co lại → vọt quá → về đúng 1" vẫn nguyên vẹn, chỉ
 * là cú vọt cao 2,2% thay vì 4%.
 */
const REWARD = Object.freeze({
  initial: { scale: 0.9 },
  animate: { scale: 1 },
  transition: { type: 'spring', stiffness: 420, damping: 18 },
});

/**
 * Hàm nhỏ lo việc "Giảm chuyển động" cho CẢ BA preset — một luật, một công thức.
 * Trả về `STILL` (object rỗng) thì thẻ `motion.*` nhận đúng không có prop chuyển động nào.
 */
function guard(preset, reduceMotion) {
  return reduceMotion ? STILL : preset;
}

/** Nhịp XUẤT HIỆN. Trải vào thẻ vừa hiện ra: `<Motion.div {...useEnterMotion()}>`. */
export function useEnterMotion() {
  return guard(ENTER, useReducedMotion());
}

/** Nhịp BẤM. Trải vào thứ bấm được: `<Motion.button {...usePressMotion()}>`. */
export function usePressMotion() {
  return guard(PRESS, useReducedMotion());
}

/** Nhịp PHẦN THƯỞNG. CHỈ dùng cho phần thưởng và cột mốc — không dùng cho thẻ thường. */
export function useRewardMotion() {
  return guard(REWARD, useReducedMotion());
}

/**
 * HAI CÁI GÁC CHO NGOẠI LỆ — dùng khi một chuyển động có lý do THẬT để giữ nhịp riêng.
 * ─────────────────────────────────────────────────────────────────────────────
 * Chúng KHÔNG phải preset thứ tư và thứ năm: chúng không mang nhịp nào cả, chỉ trả lời đúng một
 * câu *"đang bật Giảm chuyển động thì làm gì"*. Không có chúng thì mỗi ngoại lệ lại phải tự viết
 * một phép kiểm — tức đúng thứ file này sinh ra để xoá. Mỗi chỗ gọi PHẢI kèm một dòng chú thích
 * nói vì sao nó không dùng được ba nhịp trên.
 *
 * ⚠️ VÌ SAO PHẢI CÓ HAI, KHÔNG PHẢI MỘT: có hai loại ngoại lệ, và đối xử giống nhau thì VỠ GIAO
 * DIỆN. Câu hỏi phân loại: ***"bỏ hẳn `animate` đi thì phần tử còn ở đúng chỗ của nó không?"***
 *   · CÒN  → `useCustomMotion` — bỏ hẳn (lớp phủ tối của modal, đốm sáng, nhịp thở nền…).
 *   · KHÔNG → `useSnapMotion`  — giữ nguyên đích, chỉ bỏ QUÃNG ĐƯỜNG (`duration: 0`).
 *
 * Ví dụ đã suýt cắn thật: cột phải khai bề ngang BẰNG `animate={{ width }}` chứ không bằng CSS.
 * Trả về object rỗng ở đó thì cái cột mất luôn bề ngang và bung ra chiếm cả màn hình — một cách
 * "tắt hoạt hoạ" bằng cách phá vỡ bố cục.
 */

/**
 * LỚP PHỦ TỐI CỦA MODAL — ngoại lệ DUY NHẤT được đặt tên sẵn, vì nó lặp lại ở BẢY chỗ.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI NHỊP THỨ TƯ: nó không có quãng đường, không có lò xo, chỉ có "có mặt hay
 * không". Nó phải là dữ liệu dùng chung chứ không phải bảy lần gõ lại, đúng luật "một luật một
 * công thức" — bảy bản chép tay là bảy cơ hội để chúng trôi khỏi nhau.
 *
 * VÌ SAO KHÔNG DÙNG ĐƯỢC `enter`: lớp phủ là `fixed inset-0`, mà `enter` có `y: 6`. Hai hậu quả,
 * cả hai đều nhìn thấy được — (1) tấm phủ dịch xuống 6px để hở một dải mép trên; (2) tấm thân
 * modal là CON của lớp phủ ở phần lớn các modal, nên nó ăn CẢ HAI phép dịch và trôi 12px.
 * Thời lượng thì vẫn lấy đúng của `enter`, để lớp phủ và thân modal mở ra thành MỘT động tác.
 *
 *     const scrimMotion = useCustomMotion(SCRIM_FADE);
 */
export const SCRIM_FADE = Object.freeze({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: EASE },
});

/** Ngoại lệ KHÔNG mang bố cục: bật Giảm chuyển động thì bỏ hẳn, phần tử vẫn ở đúng chỗ. */
export function useCustomMotion(props) {
  return guard(props, useReducedMotion());
}

/**
 * Ngoại lệ CÓ mang bố cục (bề ngang cột, vị trí núm gạt, chiều dài thanh tiến độ, góc quay của
 * mũi tên chỉ hướng): giá trị `animate` chính LÀ trạng thái, nên nó phải ở lại. Bật Giảm chuyển
 * động thì nó NHẢY THẲNG tới đích — không còn quãng đường nào để mắt bám theo, tức không còn
 * hoạt hoạ, mà bố cục vẫn đúng.
 *
 * ⚠️ Ghi đè TRỌN `transition` chứ không trải thêm vào: một `{ type: 'spring' }` còn sót lại sẽ
 * phớt lờ `duration: 0` và vẫn nhún.
 */
export function useSnapMotion(props) {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? { ...props, transition: { duration: 0 } } : props;
}
