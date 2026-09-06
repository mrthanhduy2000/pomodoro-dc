/**
 * ActionButton.jsx — THE button (TECH_DEBT #86, ADR-076). Extracted from `PomodoroEngine.jsx` on
 * 2026-09-06 so that every screen draws its buttons through ONE door: token colours (skin + dark
 * mode follow automatically), one `sizeMap`, press depth = shadow depth. Never branch on
 * `lightTheme` here and never pass size classes through `className` — see the two guard tests
 * `actionButtonPress.test.js` and `actionButtonSizing.test.js`.
 */
import { motion, useReducedMotion } from 'framer-motion';

/** Bật Giảm chuyển động thì trải cái này SAU `whileHover`/`whileTap` để xoá cả hai — xem chú thích dưới. */
const ACTION_BUTTON_STILL = Object.freeze({ whileHover: undefined, whileTap: undefined });

export default function ActionButton({ children, className = '', disabled = false, onClick, size = 'default', title, variant = 'soft', ...motionProps }) {
  const reduceMotion = useReducedMotion();
  // Bóng đặc dày ĐÚNG bằng quãng lún của `whileTap` bên dưới. Đổi một con số thì phải đổi cả hai.
  const themeMap = {
    primary: 'border-transparent bg-[var(--ink)] text-[var(--canvas)] shadow-[0_4px_0_0_var(--line-2)]',
    accent: 'border-transparent bg-[var(--accent)] text-white shadow-[0_4px_0_0_var(--accent2)]',
    soft: 'border-[var(--line-2)] bg-[var(--card-bg-solid)] text-[var(--ink)] shadow-[0_4px_0_0_var(--line-2)]',
    // `--accent-soft` chưa skin nào khai (2026-08-27) nên hôm nay fallback luôn là đường chạy thật.
    // Giữ nguyên lối `var(a, b)` để skin nào muốn có nền nhấn riêng thì chỉ cần khai thêm token.
    info: 'border-transparent bg-[var(--accent-soft,var(--card-bg-solid2))] text-[var(--accent-ink)] shadow-[0_4px_0_0_var(--line-2)]',
    // ⚠️ `danger` PHẢI LÙI VỀ SAU, KHÔNG ĐƯỢC NỔI (đổi 2026-08-29). Bản cũ dùng nền ĐẶC
    // (`--card-bg-solid2`) + chữ `--ink` đen đậm, tức nặng hơn cả `soft` đứng ngay cạnh — nên trên
    // màn hình phiên đang chạy, "Hủy phiên" là nút HÚT MẮT NHẤT trong ba nút. Mà nó là hành động
    // phá hoại: mất toàn bộ tiến độ phiên VÀ chịu phạt tài nguyên (`DISASTER_*_PENALTY_RATE`).
    // Thứ tự thị giác phải khớp thứ tự hậu quả. Nay: nền trong, viền nhạt, chữ `--muted` — vẫn tìm
    // ra ngay khi cần, nhưng thôi mời gọi. KHÔNG tô đỏ rực: đỏ cũng là một cách để nổi nhất, chỉ
    // đổi từ "mời gọi" sang "doạ", mà cả hai đều kéo mắt khỏi cái đồng hồ.
    danger: 'border-[var(--line-2)] bg-transparent text-[var(--muted)] shadow-[0_4px_0_0_var(--line-2)]',
  };

  // ⚠️ MỖI `size` LÀ MỘT BỘ TRỌN VẸN, CỐ Ý — đừng "gọn hơn" bằng cách để nơi gọi chồng thêm lớp.
  // `sizeMap[size] ?? sizeMap.default` chỉ phát ra ĐÚNG MỘT bộ, nên không có hai lớp nào cùng khai
  // một thuộc tính để mà tranh nhau. Dự án không có `tailwind-merge`, và Tailwind quyết lớp nào
  // thắng theo thứ tự trong BẢNG KIỂU chứ không theo thứ tự viết trong `className` — đã có một lần
  // thua mà không hay biết (xem chú thích ở nút "Cần điền mục tiêu"). Cần cỡ khác ⇒ THÊM một mục
  // vào đây. Có test canh: `components/actionButtonSizing.test.js`.
  const sizeMap = {
    default: 'px-7 py-3.5 text-lg font-bold leading-none whitespace-nowrap',
    // Cho HÀNG 4–5 NÚT lúc phiên đang chạy: mỗi nút chỉ được ~70px nên phải bóp rất mạnh.
    compactMobile: 'min-w-0 w-full px-1 py-2.5 text-[10px] font-semibold leading-[1.05] tracking-[-0.03em] whitespace-normal sm:w-auto sm:px-7 sm:py-3.5 sm:text-lg sm:font-bold sm:leading-none sm:tracking-normal sm:whitespace-nowrap',
    // Cho HÀNG 2 NÚT lúc chưa bắt đầu. Đo thật ở 390px: nút chính được **186px** — rộng gấp 2,7
    // lần một ô của hàng 4–5 nút, nên dùng `compactMobile` ở đây là bóp chữ xuống 10px một cách
    // không cần thiết cho nút QUAN TRỌNG NHẤT màn hình. 13px vẫn vừa (đo lại sau khi đổi), lại
    // trên ngưỡng cỡ chữ dễ đọc trên điện thoại.
    compactPrimary: 'min-w-0 w-full px-3 py-3 text-[13px] font-semibold leading-tight tracking-[-0.01em] whitespace-normal sm:w-auto sm:px-7 sm:py-3.5 sm:text-lg sm:font-bold sm:leading-none sm:tracking-normal sm:whitespace-nowrap',
    // ADR-076 / TECH_DEBT #86 — the two sizes every OTHER screen needs, so nobody hand-draws a
    // button with an editorial rgba() again: a small pill and a medium control.
    sm: 'px-3 py-1.5 text-[12px] font-semibold leading-tight whitespace-nowrap',
    md: 'px-4 py-2.5 text-[13px] font-semibold leading-tight whitespace-nowrap',
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      title={title}
      data-variant={variant}
      // Nhấc nhẹ 1px + sáng lên 6%: đủ để biết con trỏ đang ở đâu, không đủ để chữ nhoè.
      // (Bản cũ dùng `scale: 1.03` — phóng to cả khối làm chữ bị nội suy lại nên MỜ đi đúng lúc
      // người dùng đang nhìn vào nó.)
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { y: 4 }}
      // ⚠️ NGOẠI LỆ CÓ LÝ DO — nút này KHÔNG dùng nhịp `press` (scale 0,97) của `motionPresets.js`.
      // Cú lún `y: 4` không phải một lựa chọn mỹ thuật rời rạc: nó BẰNG ĐÚNG chiều dày vạch bóng
      // đặc bên dưới, nên khi bấm thì nút hạ xuống đúng bằng vạch rồi vạch tắt đi ⇒ mép dưới đứng
      // yên và mắt đọc ra "lún chạm mặt bàn". `actionButtonPress.test.js` khoá cứng quan hệ ấy,
      // và cùng bài test cấm `scale` trong `whileHover` (phóng to làm chữ nhoè). Một nhịp `press`
      // dùng `scale` sẽ vừa phá quan hệ lún↔bóng vừa mất luôn hiệu ứng bóng đặc của skin.
      // Trải SAU hai dòng trên nên nó THẮNG: bật Giảm chuyển động là nút đứng yên hoàn toàn.
      // (Phải ghi đè chứ không gộp vào hai dòng trên, vì bài test khoá NGUYÊN VĂN dòng `whileTap`.)
      {...(reduceMotion ? ACTION_BUTTON_STILL : null)}
      onClick={onClick}
      // ⚠️ `disabled:shadow-none` chứ KHÔNG phải `shadow-none` trần. Lớp trần có cùng độ đặc hiệu
      // (0,1,0) với `shadow-[0_4px…]` của biến thể, nên ai thắng là do THỨ TỰ trong bảng kiểu
      // Tailwind quyết — hôm nay đo được `.shadow-none` tình cờ đứng sau nên nó thắng, nhưng đó là
      // một sự trùng hợp, không phải một luật. `:disabled` nâng độ đặc hiệu lên (0,2,0) nên nó
      // thắng bất kể thứ tự. Cùng lý do với `active:shadow-none`. (Đây đúng là cái canh bạc mà
      // chú thích của `sizeMap` ngay trên đã cảnh báo — chỉ khác là ở thuộc tính `box-shadow`.)
      className={`inline-flex max-w-full items-center justify-center rounded-2xl border text-center transition-[background-color,border-color,color,box-shadow,filter] duration-150 disabled:shadow-none ${
        sizeMap[size] ?? sizeMap.default
      } ${
        themeMap[variant] ?? themeMap.soft
      } ${
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'hover:brightness-[1.06] active:shadow-none'
      } ${className}`}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
