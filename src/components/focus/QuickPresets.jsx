/**
 * QuickPresets.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import { motion } from 'framer-motion';
import { usePressMotion, useSnapMotion } from '../../lib/motionPresets';
import useSettingsStore from '../../store/settingsStore';
import { TIMER_MODES } from '../../hooks/useTimer';
import { QUICK_FOCUS_PRESETS } from '../../engine/breaks';

/**
 * Trục «cứ mấy phiên thì nghỉ dài» có THẬT SỰ phân biệt được các preset không?
 * Hỏi thẳng bảng thay vì viết cứng `!== 4`: hôm nay cả 4 preset đều khai 4, nhưng ngày nào có
 * một preset khai số khác thì viên «×N» phải tự hiện lại — mà không ai phải nhớ sửa chỗ này.
 */
const CHU_KY_NGHI_CO_KHAC_NHAU = new Set(QUICK_FOCUS_PRESETS.map((p) => p.longBreakAfterN)).size > 1;

export default function QuickPresets({ className = '', activePresetId, disabled, mode, onSelect }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const pressMotion = usePressMotion();
  // NGOẠI LỆ (mang bố cục) — thẻ đang chọn được nhấc lên 1px; `y` chính là trạng thái "đang chọn".
  const liftMotion = useSnapMotion({ transition: { type: 'spring', stiffness: 360, damping: 28 } });
  // NGOẠI LỆ (mang bố cục) — vạch nhấn trượt sang thẻ mới bằng `layoutId`, cùng chuyện với ModeSwitch.
  const activeLineMotion = useSnapMotion({ transition: { type: 'spring', stiffness: 420, damping: 34 } });

  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-2.5 gap-y-3.5 sm:gap-2 ${className}`}>
      {QUICK_FOCUS_PRESETS.map((preset) => {
        const active = activePresetId === preset.id;

        return (
          <motion.button
            key={preset.id}
            layout
            type="button"
            disabled={disabled}
            aria-label={`Chọn preset ${preset.label}: ${preset.focusMinutes} phút tập trung`}
            onClick={() => onSelect(preset)}
            initial={false}
            // `animate` phải ở lại tại chỗ vì `active` chỉ có trong vòng lặp, không có ở tầng hook.
            animate={{ y: active ? -1 : 0 }}
            {...liftMotion}
            {...(disabled ? {} : pressMotion)}
            className={`relative min-w-0 overflow-hidden rounded-[20px] border px-3.5 py-4 text-left transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed sm:rounded-[18px] sm:px-3 sm:py-2.5 ${
              active
                ? lightTheme
                  ? 'border-[rgba(31,30,29,0.16)] bg-[rgba(238,234,227,0.99)] text-[var(--ink)] shadow-[0_10px_20px_rgba(31,30,29,0.05)] focus-visible:ring-[rgba(31,30,29,0.12)]'
                  : 'border-[rgba(var(--accent-rgb),0.20)] bg-white/[0.08] text-[var(--ink)] focus-visible:ring-white/30'
                : lightTheme
                  ? 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--line-2)] hover:bg-[rgba(250,249,246,0.98)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/16 hover:text-slate-100 focus-visible:ring-white/30'
            }`}
          >
            {active && (
              <motion.span
                layoutId="quick-preset-active-line"
                className={`absolute inset-x-3 top-0 h-0.5 rounded-full ${
                  lightTheme ? 'bg-[var(--accent)]' : 'bg-[var(--accent-light)]'
                }`}
                {...activeLineMotion}
              />
            )}
            {/*
              ⚠️ XẾP DỌC Ở MỌI BỀ NGANG — ĐỪNG CHIA TRÁI–PHẢI. Bản trước chia đôi hàng ngang (số
              phút bên trái, tên + mô tả bên phải). Đo thật: thẻ này KHÔNG BAO GIỜ rộng, vì lưới
              là `minmax(120px,1fr)` và nó luôn nằm trong một cột hẹp — 390px cho thẻ ~131px, còn
              1280px thì thẻ nằm trong bảng "Thời lượng countdown" chỉ ~130px. Trừ đệm còn ~103px,
              số phút ăn ~33px + khoảng cách 8px ⇒ mô tả chỉ còn **60–65px**, trong khi "Vào việc
              nhanh" cần 77px và "Nhịp hằng ngày" cần 79px ⇒ hiện ra "Vào việc …", "Nhịp hằn…" —
              nhãn cố định viết sẵn trong mã bị cắt ngang từ, trông như app hỏng.
              ⚠️ ĐÃ THỬ cách vá theo breakpoint (`sm:flex-row`) và nó SAI: `sm:` hỏi bề ngang MÀN
              HÌNH, còn thứ quyết định ở đây là bề ngang CỦA THẺ. Hai đại lượng đó không liên quan
              nhau ở chỗ này — máy bàn 1280 lại cho thẻ HẸP HƠN điện thoại. Nên xếp dọc luôn.
              ⚠️ `truncate` KHÔNG được gỡ — nó vẫn là lưới an toàn cho những bề ngang chưa từng đo.
              Đo lại bằng: `node scripts/shot.mjs --fit --phone` (các dòng bắt đầu bằng "…").
            */}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={`font-mono text-lg font-bold tabular-nums ${
                active
                  ? lightTheme
                    ? 'text-[var(--ink)]'
                    : 'text-white'
                  : lightTheme
                    ? 'text-slate-900'
                    : 'text-slate-100'
              }`}>
                {preset.focusMinutes}'
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-[11px] font-semibold leading-4 ${
                  active
                    ? lightTheme ? 'text-[var(--ink)]' : 'text-white'
                    : lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'
                }`}>
                  {preset.label}
                </span>
                <span className={`block truncate text-[10px] leading-4 ${
                  active
                    ? lightTheme ? 'text-[var(--muted)]' : 'text-slate-300'
                    : lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'
                }`}>
                  {preset.description}
                </span>
              </span>
            </span>
            <span className="mt-3 flex flex-wrap gap-2 sm:mt-2.5 sm:gap-1.5">
              {/*
                ⚠️ VIÊN «×N» CHỈ HIỆN KHI NÓ THẬT SỰ KHÁC (2026-09-01). Cả 4 preset trong
                `engine/breaks.js` đều khai `longBreakAfterN: 4`, nên bốn viên giống hệt nhau
                đứng trong đúng cái lưới sinh ra để SO SÁNH — ba trục kia thì phân biệt được
                (15/25/52/90 phút · nghỉ 3/5/17/20 · dài 12/15/30/45), riêng trục này thì không.
                Cùng con số 4 còn được nói ở dòng "Phiên dài xuất hiện sau mỗi 4 lượt hoàn thành"
                và ở chuỗi bốn cái chấm "Chu kỳ nghỉ ●●●●" — cả hai đều rõ hơn một viên "×4".
                Viết thành ĐIỀU KIỆN chứ không xoá thẳng: ngày nào có một preset khai số khác thì
                viên tự hiện lại, và lúc ấy nó mới thật sự nói được điều gì.
              */}
              {CHU_KY_NGHI_CO_KHAC_NHAU && (
                <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold tabular-nums ${
                  active
                    ? lightTheme
                      ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                      : 'bg-white/[0.08] text-[var(--ink)]'
                    : lightTheme
                      ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                      : 'bg-white/[0.06] text-slate-500'
                }`}>
                  ×{preset.longBreakAfterN}
                </span>
              )}
              {mode === TIMER_MODES.STOPWATCH ? (
                <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                  active
                    ? lightTheme
                      ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                      : 'bg-white/[0.08] text-[var(--ink)]'
                    : lightTheme
                      ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                      : 'bg-white/[0.06] text-[var(--muted)]'
                }`}>
                  nghỉ theo phiên
                </span>
              ) : (
                <>
                  <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                    active
                      ? lightTheme
                        ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                        : 'bg-white/[0.08] text-[var(--ink)]'
                      : lightTheme
                        ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                        : 'bg-white/[0.05] text-slate-300'
                  }`}>
                    nghỉ {preset.shortBreakDuration}'
                  </span>
                  <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                    active
                      ? lightTheme
                        ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                        : 'bg-white/[0.08] text-[var(--ink)]'
                      : lightTheme
                        ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                        : 'bg-white/[0.05] text-slate-300'
                  }`}>
                    dài {preset.longBreakDuration}'
                  </span>
                </>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
