/**
 * constants.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Nguồn sự thật duy nhất cho mọi hằng số, ngưỡng và danh mục trong DC Pomodoro.
 * Import từ đây — không bao giờ hard-code con số thần kỳ ở nơi khác.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── NGƯỠNG KỶ NGUYÊN (Điểm Tiến Hóa) ───────────────────────────────────────
export const ERA_THRESHOLDS = {
  ERA_1_END:    1_300,   // Đồ Đá Cũ → Nông Nghiệp
  ERA_2_END:    3_000,   // Nông Nghiệp → Đồ Đồng
  ERA_3_END:    5_000,   // Đồ Đồng → Đồ Sắt
  ERA_4_END:    7_400,   // Đồ Sắt → Tăm Tối
  ERA_5_END:   10_400,   // Tăm Tối → Phong Kiến
  ERA_6_END:   14_100,   // Phong Kiến → Phục Hưng
  ERA_7_END:   18_500,   // Phục Hưng → Khám Phá
  ERA_8_END:   24_100,   // Khám Phá → Khai Sáng
  ERA_9_END:   29_600,   // Khai Sáng → Công Nghiệp
  ERA_10_END:  37_400,   // Công Nghiệp → Đế Quốc & Tư Bản
  ERA_11_END:  46_900,   // Đế Quốc & Tư Bản → Thế Chiến
  ERA_12_END:  58_700,   // Thế Chiến → Chiến Tranh Lạnh
  ERA_13_END:  73_000,   // Chiến Tranh Lạnh → Thông Tin
  ERA_14_END:  90_200,   // Thông Tin → Trí Tuệ Nhân Tạo
  ERA_15_END: 111_000,   // Trí Tuệ Nhân Tạo → Prestige
  // Backward-compat aliases
  BOOK_1_END:   1_300,
  BOOK_2_END:   3_000,
  BOOK_3_END:   5_000,
};

function makeEraStages(eraStart, eraEnd, labels) {
  const span = Math.max(0, eraEnd - eraStart);
  const cut1 = eraStart + Math.round(span / 3);
  const cut2 = eraStart + Math.round((span * 2) / 3);
  return [
    { label: labels[0], epStart: eraStart, epEnd: cut1 },
    { label: labels[1], epStart: cut1, epEnd: cut2 },
    { label: labels[2], epStart: cut2, epEnd: eraEnd },
  ];
}

// ─── BẬC HỆ SỐ NHÂN TẬP TRUNG SÂU ──────────────────────────────────────────
// 1–25 phút = ×1.0 | 26–59 phút = ×1.3 | 60+ phút = ×2.0
export const MULTIPLIER_TIERS = [
  { min: 1,  max: 25,       multiplier: 1.0, chestGuaranteed: false },
  { min: 26, max: 59,       multiplier: 1.3, chestGuaranteed: false },
  { min: 60, max: Infinity, multiplier: 2.0, chestGuaranteed: true  },
];

// Kỹ năng "Làm Nóng Nhanh" kéo ngưỡng ×1.3 từ 26 phút xuống 20 phút
export const WARMUP_REDUCED_THRESHOLD    = 20; // phút
export const DEFAULT_DEEP_FOCUS_THRESHOLD = 26; // phút (mặc định)
// Vách ×2.0. Trước 2026-09-01 con số 60 này được VIẾT CỨNG trong `getMultiplierTier`, nên khi
// huy hiệu hệ số cần biết "còn bao nhiêu phút nữa tới ×2.0" thì nó buộc phải chép lại — hai
// công thức cho một cái thang, và chúng sẽ lệch nhau trong im lặng. Đặt tên một lần ở đây.
export const DEEP_SESSION_THRESHOLD       = 60; // phút — mốc ×2.0 + đảm bảo Rương Lớn

// ─── TỈ GIÁ PHẦN THƯỞNG CƠ BẢN (mỗi phút tập trung) ────────────────────────
// XP dùng cho level / kỹ năng / thống kê hiệu suất.
// EP dùng cho tiến độ kỷ nguyên / prestige, được nén nhịp để vòng chính dài hơn.
// Công thức: XP = phút × BASE_XP_PER_MINUTE × EP_multiplier
// XP/phút là trụ cột cố định của game, không dùng nó để cân vòng đời.
// Vòng đời 1 năm được cân bằng bằng ngưỡng EP và bonus meta.
// Neo chuẩn hiện tại: profile 12 phiên x 25 phút/ngày, có kỹ năng vòng đầu cơ bản,
// tổng hành trình phải >= 365 ngày thay vì ngắn hơn.
export const BASE_XP_PER_MINUTE = 1;
export const BASE_EP_PER_MINUTE = 1;
// Thưởng khi người chơi tự chấm phiên "Đạt mục tiêu": cộng thêm % vào XP và EP
// mà phiên đó đã kiếm được. Nối phần thưởng game với việc thật làm xong, không
// chỉ thưởng cho "ngồi đủ phút". Chỉ tính 1 lần cho mỗi phiên.
export const GOAL_ACHIEVED_BONUS_RATE = 0.12;
export const EP_MULTIPLIER_TIERS = [
  { min: 1,  max: 25,       multiplier: 1.0 },
  { min: 26, max: 59,       multiplier: 1.1 },
  { min: 60, max: Infinity, multiplier: 1.2 },
];

// ─── ĐIỂM NGHIÊN CỨU & NGUYÊN LIỆU TINH LUYỆN ────────────────────────────────
// Đặt sớm để mô tả kỹ năng có thể tham chiếu trực tiếp.
export const RP_PER_MINUTE_BASE    = 2;    // RP cơ bản mỗi phút tập trung
export const RP_CATEGORY_MULT      = 2;    // ×2 RP cho danh mục đầu tiên trong ngày
export const CRAFT_QUEUE_SLOTS     = 2;    // số ô hàng đợi xây dựng tối đa
/**
 * Số công trình TRÙNG TU (kỷ cũ) được xây cùng lúc — ô RIÊNG, không lấn 2 ô ở trên (ADR-012).
 *
 * ⚠️ VÌ SAO PHẢI CÓ CON SỐ NÀY, VÀ VÌ SAO NÓ LÀ 1. Phase 4D hứa "di sản không chiếm ô", và lời hứa
 * đó đúng **vì lúc ấy tập di sản không thể lớn thêm** — `startCrafting` chặn bản vẽ ngoài kỷ hiện
 * tại nên di sản chỉ gồm thứ đã khởi công trước khi kỷ đóng, và nó tự cạn. Trùng tu (ADR-012) gỡ
 * đúng cái chặn đó, nên mệnh đề "tự cạn" HẾT ĐÚNG: không có trần riêng thì Đàm xếp được cả 70 bản
 * vẽ kỷ cũ vào hàng đợi một lượt, và mỗi phiên đẩy MỌI ô tiến 1 nấc ⇒ cả bảo tàng mọc lên cùng lúc,
 * phần thưởng loãng thành vô nghĩa.
 * Chọn 1 (không phải 2) vì trùng tu KHÔNG sinh đặc quyền: nó là việc phụ chạy nền, không được phép
 * cạnh tranh sự chú ý với công trình của kỷ đang chơi.
 */
export const LEGACY_QUEUE_SLOTS    = 1;
export const T2_CRAFT_COST         = 8;    // 8 nguyên liệu thô → 1 nguyên liệu tinh luyện
export const T2_DROP_THRESHOLD_MIN = 45;   // phút min để T2 rớt tự nhiên
export const T2_DROP_AMOUNT        = 1;    // lượng T2 rớt mỗi phiên đủ ngưỡng

// ─── XÁC SUẤT GACHA ──────────────────────────────────────────────────────────
// Tỉ lệ rớt Bản Vẽ Hiếm = phútTậpTrung × GACHA_RATE_PER_MINUTE  (%)
export const GACHA_RATE_PER_MINUTE    = 0.20;  // % mỗi phút

// ─── HÌNH PHẠT THẢM HỌA ─────────────────────────────────────────────────────
export const DISASTER_MIN_PENALTY_RATE = 0.01; // 1% gốc khi hủy phiên
export const DISASTER_MAX_PENALTY_RATE = 0.05; // 5% gốc khi hủy phiên
export const DISASTER_PENALTY_RATE = DISASTER_MAX_PENALTY_RATE; // dùng cho các penalty cố định khác

// Các loại thảm họa ngẫu nhiên khi hủy Pomodoro (Chế độ Nghiêm)
export const DISASTER_EVENTS = [
  { id: 'dong_dat',     label: 'Động Đất',        icon: '🌋', description: 'Đất rung chuyển — kho tài nguyên bị thất thoát.' },
  { id: 'dich_benh',    label: 'Dịch Bệnh',        icon: '☠️',  description: 'Dịch bệnh hoành hành — tài nguyên bị tiêu hao.' },
  { id: 'hong_thuy',    label: 'Đại Hồng Thủy',    icon: '🌊', description: 'Lũ lụt cuốn trôi một phần tích lũy của bạn.' },
  { id: 'thien_thach',  label: 'Thiên Thạch Rơi',  icon: '☄️',  description: 'Thiên thạch va chạm — kho dự trữ bị tổn thất.' },
  { id: 'nan_doi',      label: 'Nạn Đói',           icon: '🌾', description: 'Nạn đói ập đến — nguồn lực bị bào mòn.' },
];

// ─── HỆ THỐNG CẤP ĐỘ ─────────────────────────────────────────────────────────
// EXP_PER_LEVEL giữ riêng cho level tree; vòng đời 1 năm được cân ở EP, không cân ở XP.
export const EXP_PER_LEVEL  = 6000;
export const SP_PER_LEVEL   = 2;     // 2 Điểm Kỹ Năng mỗi lần lên cấp

// ─── HẰNG SỐ KỸ NĂNG V2 (bộ skill viết lại) ──────────────────────────────────
// Nguyên tắc: phiên 25' (tối thiểu) không nhận buff từ skill mới.
// Buff yêu cầu length: ngưỡng > 25 (≥30, ≥45, ≥60).

// === THIỀN ĐỊNH (chiều sâu phiên) ===
export const VAO_GUONG_MIN_MINUTES     = 30;        // mới — thay khoi_dong_nhanh
export const VAO_GUONG_XP_BONUS        = 0.05;
export const CHUYEN_CAN_MIN_MINUTES    = 45;        // đẩy 25 → 45
export const CHUYEN_CAN_XP_BONUS       = 0.08;      // tăng 0.06 → 0.08
export const DA_TAP_TRUNG_STACK_BONUS  = 0.02;
export const DA_TAP_TRUNG_MAX_STACKS   = 4;
export const VUNG_DONG_CHAY_MIN_MIN    = 45;
export const TAP_TRUNG_SV_MIN_MIN      = 60;
export const TAP_TRUNG_SV_XP_BONUS     = 0.15;
export const TAP_TRUNG_SV_EP_BONUS     = 0.05;      // mới — thêm EP
export const SIEU_TAP_TRUNG_MULT       = 1.7;
export const SIEU_TAP_TRUNG_EP_MULT    = 1.3;       // mới — thêm EP
export const SIEU_TAP_TRUNG_MIN_MIN    = 45;        // mới — yêu cầu ≥45
export const SIEU_TAP_TRUNG_CHARGES    = 1;

// === Ý CHÍ (bền bỉ & streak) ===
// ADR-069: Sự Tha Thứ nay là bậc đầu của cặp «tha thứ → phục hồi»: sau khi huỷ một phiên, phiên kế
// đủ dài nhận thêm XP (Phục Hồi cộng thêm nữa). Trước đó nó chỉ miễn một khoản phạt không còn ai thấy.
export const SU_THA_THU_XP_BONUS           = 0.06;
export const SU_THA_THU_MIN_MINUTES        = 25;
export const BO_NHO_CO_BAP_COMBO_HOURS     = 8;
export const PHUC_HOI_XP_BONUS             = 0.12;
export const PHUC_HOI_EP_BONUS             = 0.05;  // mới
export const PHUC_HOI_MIN_MINUTES          = 30;    // mới
export const CHUOI_NGAY_XP_PER_DAY         = 0.004;
export const CHUOI_NGAY_MAX_DAYS            = 24;
// Lá Chắn Streak (mới — thay y_chi_thep)
export const LA_CHAN_STREAK_PER_WEEK       = 1;
// Bền Vững (mới — thay bat_khuat)
export const BEN_VUNG_STREAK_THRESHOLD     = 30;
export const BEN_VUNG_PERMANENT_ALLBONUS   = 0.05;
export const BEN_VUNG_MIN_MINUTES          = 30;

// Các mốc chuỗi để hiện "đích kế tiếp" cho người dùng (chỉ để hiển thị/động viên).
// Mốc 30 trùng BEN_VUNG_STREAK_THRESHOLD — mở +5% allBonus VĨNH VIỄN.
export const STREAK_MILESTONES = [
  { days: 7,  label: 'mốc 7',  permanent: false },
  { days: 14, label: 'mốc 14', permanent: false },
  { days: BEN_VUNG_STREAK_THRESHOLD, label: 'Bền Vững', permanent: true },
];

// === NGHỈ NGƠI (volume & break) ===
export const BREAK_EXTENSION_MINUTES                = 5;
export const NAP_NANG_LUONG_XP_BONUS                = 0.08;
export const NAP_NANG_LUONG_MIN_MINUTES             = 30;  // mới
// Tích Phiên (mới — thay kho_du_tru)
export const TICH_PHIEN_AFTER_SESSIONS              = 3;
export const TICH_PHIEN_XP_BONUS                    = 0.06;
export const PHIEN_VANG_SANG_XP_BONUS               = 0.10; // tăng 0.08 → 0.10 vì giờ phải ≥45
export const PHIEN_VANG_SANG_EP_BONUS               = 0.05; // mới
export const PHIEN_VANG_SANG_MIN_MINUTES            = 45;   // mới
export const NHIP_SINH_HOC_MIN_SESSIONS             = 4;
export const NHIP_SINH_HOC_XP_BONUS                 = 0.12;
export const NHIP_SINH_HOC_MIN_MINUTES              = 30;   // mới
// Nhịp Hoàn Hảo (mới — thay nghi_ngoi_hoan_hao)
export const NHIP_HOAN_HAO_SESSIONS_PER_DAY         = 6;
export const NHIP_HOAN_HAO_DAYS_NEEDED              = 3;
export const NHIP_HOAN_HAO_XP_BONUS                 = 0.10;
export const NHIP_HOAN_HAO_EP_BONUS                 = 0.10;
export const NHIP_HOAN_HAO_MIN_MINUTES              = 30;

// === VẬN MAY (phần thưởng NGẪU NHIÊN trên XP/EP) ===
// ⚠️ ADR-069 (2026-09-06): ba kỹ năng gốc của nhánh từng quay ra «+1 nguyên liệu thô» / «+1 tinh
// luyện» — hai loại tiền đã rời đường chơi. Nay chúng quay ra XP/EP: cùng xác suất, cùng ngưỡng
// phút, chỉ đổi THỨ nhận được sang một trục người chơi nhìn thấy. Đây là "phần thưởng biến thiên"
// đúng nghĩa: không phải mọi phiên đều trúng, và khi trúng thì thấy ngay ở thẻ +XP.
export const BAN_TAY_VANG_CHANCE           = 0.15;
export const BAN_TAY_VANG_XP_BONUS         = 0.20;  // +20% XP khi trúng
export const BAN_TAY_VANG_MIN_MINUTES      = 45;
export const NHAN_QUAN_CHANCE              = 0.25;
export const NHAN_QUAN_EP_BONUS            = 0.10;  // +10% EP khi trúng
export const NHAN_QUAN_MIN_MINUTES         = 45;
export const LINH_CAM_CHANCE               = 0.40;
export const LINH_CAM_XP_BONUS             = 0.10;  // +10% XP khi trúng
export const LINH_CAM_BIG_CHANCE           = 0.08;  // cú lớn: 8%
export const LINH_CAM_BIG_XP_BONUS         = 0.50;  // +50% XP khi trúng cú lớn
export const LINH_CAM_MIN_MINUTES          = 45;
// Lộc Ban Tặng (mới — thay be_cong_thoi_gian). ADR-069: chỉ còn vế XP (vế «+1 tinh luyện T2» bỏ).
export const LOC_BAN_TANG_SESSIONS_NEEDED  = 7;     // mỗi 7 phiên ≥30
export const LOC_BAN_TANG_MIN_MINUTES      = 30;
export const LOC_BAN_TANG_XP_REWARD        = 200;
export const JACKPOT_CHANCE                = 0.025;
export const JACKPOT_MULTIPLIER            = 2.5;   // XP
export const JACKPOT_EP_MULTIPLIER         = 2.0;   // mới — EP nhân 2.0
export const DAI_TRUNG_THUONG_MIN_MINUTES  = 45;    // mới
export const SO_DO_TRIGGER_CHANCE          = 0.40;
export const SO_DO_MULTIPLIER              = 2.5;
export const SO_DO_CHARGES                 = 1;
export const SO_DO_MIN_MINUTES             = 45;    // mới

// === CHIẾN LƯỢC (daily/weekly meta) ===
// Người Lập Kế (mới — thay chuyen_gia)
export const NGUOI_LAP_KE_XP_BONUS         = 0.05;
// Cử Tri (mới — thay da_nang)
export const CU_TRI_XP_BONUS               = 0.10;
export const CU_TRI_BUFF_SESSIONS          = 3;
// Cố Vấn (mới — thay chuyen_mon_hoa)
export const CO_VAN_XP_BONUS               = 0.08;
// Lịch Đầy (mới — thay can_bang)
export const LICH_DAY_ALLBONUS             = 0.12;
export const LICH_DAY_THRESHOLD_45_MIN     = 45;
export const LICH_DAY_THRESHOLD_60_MIN     = 60;
export const BAC_THAY_CHIEN_LUOC_XP_BONUS  = 0.14;
export const BAC_THAY_CHIEN_LUOC_RP_BONUS  = 0.12;
export const BAC_THAY_CHIEN_LUOC_EP_BONUS  = 0.05;  // mới
export const BAC_THAY_CHIEN_LUOC_MIN_MIN   = 30;    // mới
export const KE_HOACH_HOAN_HAO_NEXT_WEEK_BONUS = 0.10; // mới — buff tuần kế

// === THĂNG HOA (era & prestige) ===
export const KY_UC_KY_NGUYEN_XP_BONUS     = 0.18;
export const KY_UC_KY_NGUYEN_EP_BONUS     = 0.10;   // mới
export const KY_UC_KY_NGUYEN_MIN_MINUTES  = 30;     // mới
export const TRI_TUE_TICH_LUY_XP_PER_ERA  = 0.005;
export const TRI_TUE_TICH_LUY_MAX_ERAS    = 15;
export const BAC_THAY_KY_NGUYEN_SESSIONS  = 100;
export const BAC_THAY_KY_NGUYEN_BONUS     = 0.015;
export const BAC_THAY_KY_NGUYEN_MAX       = 0.12;
export const KE_THUA_SP_RETENTION         = 0.50;
export const SIEU_VIET_ERA1_XP_BONUS      = 1.00;
export const SIEU_VIET_MIN_MINUTES        = 30;     // mới — phiên ≥30 mới nhận bonus
export const SIEU_VIET_THRESHOLD_REDUCTION = 0.20;

// Backward compat (gameMath + building system)
export const SHARP_TOOLS_RESOURCE_BONUS = 0.15;
export const ARCHITECT_UPGRADE_DISCOUNT = 0.10;

// ─── DEPRECATED (giữ để gameMath/component không break trước khi cleanup) ────
// Các skill đã loại bỏ vẫn được destructure trong gameMath với default false → no-op.
// Các hằng số này CÒN dùng cho disaster cancel preview (PomodoroEngine) — sẽ bị
// no-op khi user không có skill. Migration sẽ refund SP và xoá unlocked flags.
export const Y_CHI_THEP_RETENTION           = 0.55;     // deprecated — y_chi_thep loại bỏ
export const BAT_KHUAT_DISASTER_XP_PENALTY  = 0.18;     // deprecated — bat_khuat loại bỏ
export const TIME_BENDER_CHANCE             = 0.015;    // deprecated — be_cong_thoi_gian loại bỏ
// WARMUP_REDUCED_THRESHOLD đã export ở dòng 52 — giữ ở đó để getMultiplierTier signature dùng được.
export const STORAGE_VAULT_XP_PER_MINUTE    = 1;        // deprecated — kho_du_tru loại bỏ
export const STORAGE_VAULT_XP_PER_MINUTE_ENHANCED = 3;  // deprecated
export const STORAGE_VAULT_EP_PER_MINUTE    = 1;        // deprecated alias
export const NGHI_NGOI_HOAN_HAO_EXTRA_CHARGES = 1;      // deprecated — nghi_ngoi_hoan_hao loại bỏ
export const BAN_TAY_VANG_RP_BONUS          = 0.08;     // deprecated alias (bộ mới dùng RAW_CHANCE)
export const NHAN_QUAN_RP_BONUS             = 0.05;     // deprecated alias
export const LINH_CAM_RP_BONUS              = 0.10;     // deprecated alias
export const CHUYEN_GIA_MIN_SESSIONS        = 3;        // deprecated — chuyen_gia loại bỏ
export const CHUYEN_GIA_XP_BONUS            = 0.06;     // deprecated
export const CHUYEN_GIA_RP_BONUS            = 0.05;     // deprecated
export const DA_NANG_MIN_CATEGORIES         = 3;        // deprecated — da_nang loại bỏ
export const DA_NANG_RESOURCE_BONUS         = 0.10;     // deprecated
export const DA_NANG_RP_BONUS               = 0.08;     // deprecated
export const CHUYEN_MON_HOA_XP_PER_CAT      = 0.008;    // deprecated
export const CHUYEN_MON_HOA_RP_PER_CAT      = 0.006;    // deprecated
export const CHUYEN_MON_HOA_MAX_CATS        = 6;        // deprecated
export const CAN_BANG_XP_BONUS              = 0.06;     // deprecated
export const CAN_BANG_RESOURCE_BONUS        = 0.10;     // deprecated

// ─── DANH MỤC TÀI NGUYÊN THEO KỶ NGUYÊN ─────────────────────────────────────
export const ERA_1_RESOURCES = [
  { id: 'da_silex',   label: 'Đá Silex',        icon: '🪨', minPerMin: 1, maxPerMin: 4 },
  { id: 'xuong',      label: 'Xương Thú',        icon: '🦴', minPerMin: 1, maxPerMin: 3 },
];
export const ERA_2_RESOURCES = [
  { id: 'ngu_coc',    label: 'Ngũ Cốc',          icon: '🌾', minPerMin: 2, maxPerMin: 5 },
  { id: 'dat_set',    label: 'Đất Sét',           icon: '🏺', minPerMin: 2, maxPerMin: 4 },
];
export const ERA_3_RESOURCES = [
  { id: 'dong',       label: 'Đồng',              icon: '🟤', minPerMin: 1, maxPerMin: 4 },
  { id: 'thiec',      label: 'Thiếc',             icon: '🔩', minPerMin: 1, maxPerMin: 3 },
];
export const ERA_4_RESOURCES = [
  { id: 'sat_thep',   label: 'Sắt Thép',          icon: '⚙️', minPerMin: 2, maxPerMin: 5 },
  { id: 'lua_to',     label: 'Lụa Tơ',            icon: '🧶', minPerMin: 1, maxPerMin: 4 },
];
export const ERA_5_RESOURCES = [
  { id: 'giay_da',    label: 'Giấy Da',           icon: '📜', minPerMin: 1, maxPerMin: 4 },
  { id: 'duc_tin',    label: 'Đức Tin',           icon: '✝️', minPerMin: 1, maxPerMin: 3 },
];
export const ERA_6_RESOURCES = [
  { id: 'luong_thuc', label: 'Lương Thực',        icon: '🌾', minPerMin: 2, maxPerMin: 5 },
  { id: 'vu_khi',     label: 'Vũ Khí',            icon: '⚔️', minPerMin: 1, maxPerMin: 4 },
];
export const ERA_7_RESOURCES = [
  { id: 'nghe_thuat', label: 'Nghệ Thuật',        icon: '🎨', minPerMin: 1, maxPerMin: 4 },
  { id: 'ban_thao',   label: 'Bản Thảo',          icon: '📚', minPerMin: 2, maxPerMin: 4 },
];
export const ERA_8_RESOURCES = [
  { id: 'gia_vi',     label: 'Gia Vị',            icon: '🌶️', minPerMin: 1, maxPerMin: 4 },
  { id: 'ban_do',     label: 'Bản Đồ',            icon: '🗺️', minPerMin: 1, maxPerMin: 3 },
];
export const ERA_9_RESOURCES = [
  { id: 'tu_tuong',   label: 'Tư Tưởng',          icon: '💡', minPerMin: 1, maxPerMin: 4 },
  { id: 'sach_in',    label: 'Sách In',            icon: '📰', minPerMin: 1, maxPerMin: 4 },
];
export const ERA_10_RESOURCES = [
  { id: 'than_cong',  label: 'Than Công Nghiệp',  icon: '🪨', minPerMin: 2, maxPerMin: 5 },
  { id: 'thep',       label: 'Thép',              icon: '🔩', minPerMin: 1, maxPerMin: 4 },
];

export const ERA_11_RESOURCES = [
  { id: 'co_phieu',     label: 'Cổ Phiếu',           icon: '📈', minPerMin: 1, maxPerMin: 5 },
  { id: 'thuoc_dia',    label: 'Thuộc Địa',           icon: '🗺️', minPerMin: 1, maxPerMin: 4 },
];
export const ERA_12_RESOURCES = [
  { id: 'dan_duoc',     label: 'Đạn Dược',            icon: '💣', minPerMin: 2, maxPerMin: 6 },
  { id: 'quan_nhu',     label: 'Quân Nhu',            icon: '⚙️', minPerMin: 1, maxPerMin: 5 },
];
export const ERA_13_RESOURCES = [
  { id: 'hat_nhan',     label: 'Hạt Nhân',            icon: '☢️', minPerMin: 1, maxPerMin: 4 },
  { id: 've_tinh',      label: 'Vệ Tinh',             icon: '🛸', minPerMin: 1, maxPerMin: 4 },
];
export const ERA_14_RESOURCES = [
  { id: 'du_lieu',      label: 'Dữ Liệu',             icon: '💾', minPerMin: 2, maxPerMin: 6 },
  { id: 'bang_thong',   label: 'Băng Thông',          icon: '📡', minPerMin: 1, maxPerMin: 4 },
];
export const ERA_15_RESOURCES = [
  { id: 'gpu',          label: 'GPU',                 icon: '🖥️', minPerMin: 1, maxPerMin: 5 },
  { id: 'mo_hinh',      label: 'Mô Hình AI',          icon: '🤖', minPerMin: 1, maxPerMin: 4 },
];

// Gộp 4 nguyên liệu thô cũ về 2 nguyên liệu chuẩn của mỗi kỷ.
// Các cost/build save cũ vẫn dùng được vì mọi id cũ đều được quy đổi về id chuẩn.
export const RAW_RESOURCE_ALIASES = {
  da_thu: 'xuong',
  lua_soi: 'da_silex',
  go_xay: 'dat_set',
  nuoc_ngam: 'ngu_coc',
  da_mau: 'thiec',
  muoi: 'dong',
  ngoc: 'lua_to',
  quan_luong: 'sat_thep',
  thao_duoc: 'duc_tin',
  da_xay: 'giay_da',
  to_lua: 'vu_khi',
  thue: 'luong_thuc',
  vang: 'ban_thao',
  da_hoa: 'nghe_thuat',
  vang_kcv: 'ban_do',
  hang_hoa: 'gia_vi',
  ca_phe: 'sach_in',
  anh_huong: 'tu_tuong',
  hoi_nuoc: 'thep',
  von: 'than_cong',
  vang_du_tru: 'thuoc_dia',
  doc_quyen: 'co_phieu',
  tinh_bao: 'quan_nhu',
  lanh_tho: 'dan_duoc',
  mat_ma: 've_tinh',
  anh_huong_ct: 'hat_nhan',
  phan_mem: 'bang_thong',
  nguoi_dung: 'du_lieu',
  du_lieu_hl: 'mo_hinh',
  giai_thuat: 'gpu',
};

export const RAW_COST_REBALANCE_FACTOR = 0.7;
export const T3_REFINED_EQUIVALENT = 4;
export const BUILDING_LEVEL_MULTIPLIERS = { 1: 1, 2: 1.75, 3: 2.5 };

export function getBuildingLevelMultiplier(level = 1) {
  return BUILDING_LEVEL_MULTIPLIERS[level] ?? 1;
}

export function normalizeRawResourceId(resourceId) {
  return RAW_RESOURCE_ALIASES[resourceId] ?? resourceId;
}

function roundRebalancedCost(amount) {
  if (amount <= 0) return 0;
  if (amount < 20) return Math.max(1, Math.round(amount));
  if (amount < 100) return Math.max(5, Math.round(amount / 5) * 5);
  return Math.max(10, Math.round(amount / 10) * 10);
}

export function normalizeRawCost(cost = {}, factor = RAW_COST_REBALANCE_FACTOR) {
  const mergedCost = {};
  for (const [resourceId, rawAmount] of Object.entries(cost)) {
    const normalizedId = normalizeRawResourceId(resourceId);
    const amount = roundRebalancedCost((rawAmount ?? 0) * factor);
    mergedCost[normalizedId] = (mergedCost[normalizedId] ?? 0) + amount;
  }
  return mergedCost;
}

// Backward-compat aliases (vẫn được dùng trong BUILDING_SPECS cũ)
export const BOOK_1_RESOURCES = ERA_1_RESOURCES;
export const BOOK_2_RESOURCES = ERA_2_RESOURCES;
export const BOOK_3_RESOURCES = ERA_3_RESOURCES;

// ─── METADATA KỶ NGUYÊN ───────────────────────────────────────────────────────
export const ERA_METADATA = {
  1: {
    bookNumber: 1, label: 'Kỷ Đồ Đá Cũ', subLabel: 'Thời Tiền Sử → Bình Minh Nhân Loại',
    resources: ERA_1_RESOURCES, bgClass: 'era-book1', accentColor: '#4ade80',
    stages: makeEraStages(0, ERA_THRESHOLDS.ERA_1_END, [
      'Giai Đoạn Tối Cổ',
      'Nhân Tiền Sử',
      'Bình Minh Nhân Loại',
    ]),
  },
  2: {
    bookNumber: 2, label: 'Kỷ Nông Nghiệp', subLabel: 'Định Cư → Nông Nghiệp → Làng Mạc',
    resources: ERA_2_RESOURCES, bgClass: 'era-book2', accentColor: '#84cc16',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_1_END, ERA_THRESHOLDS.ERA_2_END, [
      'Định Cư Đầu Tiên',
      'Nông Nghiệp Sơ Khai',
      'Văn Minh Làng Mạc',
    ]),
  },
  3: {
    bookNumber: 3, label: 'Kỷ Đồ Đồng', subLabel: 'Luyện Kim → Thành Thị → Vương Quốc',
    resources: ERA_3_RESOURCES, bgClass: 'era-book3', accentColor: '#facc15',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_2_END, ERA_THRESHOLDS.ERA_3_END, [
      'Bình Minh Kim Loại',
      'Thành Thị Sơ Khai',
      'Vương Quốc Đầu Tiên',
    ]),
  },
  4: {
    bookNumber: 4, label: 'Kỷ Đồ Sắt (Tam Quốc)', subLabel: 'Chiến Quốc → Thống Nhất → Tam Phân',
    resources: ERA_4_RESOURCES, bgClass: 'era-book4', accentColor: '#fb923c',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_3_END, ERA_THRESHOLDS.ERA_4_END, [
      'Thời Chiến Quốc',
      'Loạn Tam Quốc',
      'Thiên Hạ Tam Phân',
    ]),
  },
  5: {
    bookNumber: 5, label: 'Kỷ Tăm Tối', subLabel: 'Sụp Đổ Đế Chế → Đêm Tối → Ánh Sáng Đầu Tiên',
    resources: ERA_5_RESOURCES, bgClass: 'era-book5', accentColor: '#94a3b8',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_4_END, ERA_THRESHOLDS.ERA_5_END, [
      'Sụp Đổ Đế Chế',
      'Đêm Tối Trung Cổ',
      'Ánh Sáng Đầu Tiên',
    ]),
  },
  6: {
    bookNumber: 6, label: 'Kỷ Phong Kiến', subLabel: 'Hào Khí Đại Việt → Thành Trì',
    resources: ERA_6_RESOURCES, bgClass: 'era-book6', accentColor: '#a78bfa',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_5_END, ERA_THRESHOLDS.ERA_6_END, [
      'Nổi Dậy Hào Kiệt',
      'Thời Đại Thành Trì',
      'Hào Khí Đại Việt',
    ]),
  },
  7: {
    bookNumber: 7, label: 'Kỷ Phục Hưng', subLabel: 'Nghệ Thuật → Khoa Học → Khai Sáng',
    resources: ERA_7_RESOURCES, bgClass: 'era-book7', accentColor: '#c084fc',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_6_END, ERA_THRESHOLDS.ERA_7_END, [
      'Phục Hưng Nghệ Thuật',
      'Cách Mạng Khoa Học',
      'Khai Sáng Triết Học',
    ]),
  },
  8: {
    bookNumber: 8, label: 'Kỷ Khám Phá', subLabel: 'Biển Cả → Tân Thế Giới → Thương Mại Toàn Cầu',
    resources: ERA_8_RESOURCES, bgClass: 'era-book8', accentColor: '#38bdf8',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_7_END, ERA_THRESHOLDS.ERA_8_END, [
      'Vươn Ra Biển Lớn',
      'Khám Phá Tân Thế Giới',
      'Thương Mại Toàn Cầu',
    ]),
  },
  9: {
    bookNumber: 9, label: 'Kỷ Khai Sáng', subLabel: 'Triết Học → Bách Khoa → Cách Mạng Tư Tưởng',
    resources: ERA_9_RESOURCES, bgClass: 'era-book9', accentColor: '#a3e635',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_8_END, ERA_THRESHOLDS.ERA_9_END, [
      'Salon Triết Học',
      'Bách Khoa Toàn Thư',
      'Cách Mạng Tư Tưởng',
    ]),
  },
  10: {
    bookNumber: 10, label: 'Kỷ Công Nghiệp', subLabel: 'Hơi Nước → Thép → Titan Kiến Tạo',
    resources: ERA_10_RESOURCES, bgClass: 'era-book10', accentColor: '#f87171',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_9_END, ERA_THRESHOLDS.ERA_10_END, [
      'Cách Mạng Hơi Nước',
      'Thời Đại Thép',
      'Titan Kiến Tạo',
    ]),
  },
  11: {
    bookNumber: 11, label: 'Kỷ Đế Quốc & Tư Bản Độc Quyền', subLabel: 'Thực Dân → Phố Wall → Bá Chủ Toàn Cầu',
    resources: ERA_11_RESOURCES, bgClass: 'era-book11', accentColor: '#e879f9',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_10_END, ERA_THRESHOLDS.ERA_11_END, [
      'Thực Dân Hóa',
      'Độc Quyền Tư Bản',
      'Bá Chủ Tài Phiệt',
    ]),
  },
  12: {
    bookNumber: 12, label: 'Kỷ Thế Chiến', subLabel: 'Chiến Hào → Tổng Lực → Ngày Chiến Thắng',
    resources: ERA_12_RESOURCES, bgClass: 'era-book12', accentColor: '#64748b',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_11_END, ERA_THRESHOLDS.ERA_12_END, [
      'Chiến Hào',
      'Chiến Tranh Tổng Lực',
      'Ngày Chiến Thắng',
    ]),
  },
  13: {
    bookNumber: 13, label: 'Kỷ Chiến Tranh Lạnh', subLabel: 'Màn Sắt → Cuộc Đua Vũ Trụ → Hòa Giải',
    resources: ERA_13_RESOURCES, bgClass: 'era-book13', accentColor: '#22d3ee',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_12_END, ERA_THRESHOLDS.ERA_13_END, [
      'Màn Sắt',
      'Cuộc Đua Vũ Trụ',
      'Hòa Giải Siêu Cường',
    ]),
  },
  14: {
    bookNumber: 14, label: 'Kỷ Nguyên Thông Tin', subLabel: 'Dot-com → Mạng Xã Hội → Đế Chế Công Nghệ',
    resources: ERA_14_RESOURCES, bgClass: 'era-book14', accentColor: '#34d399',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_13_END, ERA_THRESHOLDS.ERA_14_END, [
      'Bùng Nổ Dot-com',
      'Kỷ Nguyên Mạng Xã Hội',
      'Đế Chế Công Nghệ',
    ]),
  },
  15: {
    bookNumber: 15, label: 'Kỷ Nguyên Trí Tuệ Nhân Tạo', subLabel: 'Bình Minh AI → Siêu Việt → Điểm Kỳ Dị',
    resources: ERA_15_RESOURCES, bgClass: 'era-book15', accentColor: '#818cf8',
    stages: makeEraStages(ERA_THRESHOLDS.ERA_14_END, ERA_THRESHOLDS.ERA_15_END, [
      'Bình Minh AI',
      'Trí Tuệ Siêu Việt',
      'Điểm Kỳ Dị',
    ]),
  },
};

// ─── TỶ LỆ EP TRONG KỶ ĐỂ MỞ KHÓA THÁCH ĐẤU ─────────────────────────────────
// Tỷ lệ EP tích lũy trong kỷ hiện tại cần để mở nút Thách Đấu lên bậc tiếp theo
// Index = rank index (0-7), giá trị 0 = tự động (không cần gate)
export const RANK_XP_RATIOS = [0, 0.12, 0.22, 0.32, 0.42, 0.55, 0.72, 0.87];

// ─── HỆ THỐNG DANH XƯNG (8 BẬC × 10 KỶ) ─────────────────────────────────────
// passiveBuff: { epBonus, expBonus, resourceBonus, allBonus, gachaBonus, pitySeal }
// `gachaBonus` / `pitySeal` là tên legacy, hiện được dùng làm buff RP.
// challengeRequirement: null = đã có ngay từ đầu kỷ
/**
 * ⚠️ ADR-069 (2026-09-06) — MỌI BẬC THƯỞNG TRÊN TRỤC SỐNG. Bậc lẻ (thứ 2 và 4 của mỗi kỷ) từng
 * thưởng «+N% Tài Nguyên» — một đồng tiền đã rời đường chơi (không còn cổng tiêu, không còn màn
 * hình). Một phần thưởng lên một thứ không ai nhìn thấy thì không phải phần thưởng, nên chúng đổi
 * sang «+N% EP» cùng giá trị: EP là thứ đẩy thành phố sang kỷ mới, tức thứ người chơi THẤY. Thang
 * đọc thành XP → EP → XP → EP → Tất cả ×4. Khoá bằng `rewardAxes.test.js`.
 */
export const RANK_SYSTEM = {
  1: {
    bookLabel: 'Kỷ Đồ Đá Cũ',
    ranks: [
      { id: 'ke_lang_thang',     label: 'Kẻ Lang Thang',     icon: '🚶', passiveBuff: { expBonus: 0.05       }, buffLabel: '+5% XP',           challengeRequirement: null },
      { id: 'ke_song_sot',       label: 'Kẻ Sống Sót',       icon: '⛏️', passiveBuff: { epBonus: 0.10        }, buffLabel: '+10% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'tho_san_tap_su',    label: 'Thợ Săn Tập Sự',    icon: '🏹', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nguoi_giu_lua',     label: 'Người Giữ Lửa',     icon: '🔥', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
      { id: 'tho_san_lao_luyen', label: 'Thợ Săn Lão Luyện', icon: '🗺️', passiveBuff: { allBonus: 0.10       }, buffLabel: '+10% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'chien_binh_1',      label: 'Chiến Binh',         icon: '⚔️', passiveBuff: { allBonus: 0.15       }, buffLabel: '+15% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'thay_shaman',       label: 'Thầy Shaman',        icon: '🌀', passiveBuff: { allBonus: 0.20       }, buffLabel: '+20% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'tu_truong',         label: 'Tù Trưởng',          icon: '👑', passiveBuff: { allBonus: 0.25       }, buffLabel: '+25% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  2: {
    bookLabel: 'Kỷ Nông Nghiệp',
    ranks: [
      { id: 'ke_dinh_cu',        label: 'Kẻ Định Cư',         icon: '🏕️', passiveBuff: { expBonus: 0.05       }, buffLabel: '+5% XP',           challengeRequirement: null },
      { id: 'nong_dan_tap_su',   label: 'Nông Dân Tập Sự',    icon: '🌱', passiveBuff: { epBonus: 0.10        }, buffLabel: '+10% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'tho_gom',           label: 'Thợ Gốm',            icon: '🏺', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nguoi_khai_hoang',  label: 'Người Khai Hoang',   icon: '🌾', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
      { id: 'ky_su_thuy_loi',    label: 'Kỹ Sư Thủy Lợi',    icon: '💧', passiveBuff: { allBonus: 0.10       }, buffLabel: '+10% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'truong_thon',       label: 'Trưởng Thôn',         icon: '🏘️', passiveBuff: { allBonus: 0.15       }, buffLabel: '+15% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'te_su_2',           label: 'Tế Sư',               icon: '⛩️', passiveBuff: { allBonus: 0.20       }, buffLabel: '+20% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'lanh_chua_nong_vu', label: 'Lãnh Chúa Nông Vụ',  icon: '👑', passiveBuff: { allBonus: 0.25       }, buffLabel: '+25% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  3: {
    bookLabel: 'Kỷ Đồ Đồng',
    ranks: [
      { id: 'nguoi_khai_khoang', label: 'Người Khai Khoáng',  icon: '⛏️', passiveBuff: { expBonus: 0.05       }, buffLabel: '+5% XP',           challengeRequirement: null },
      { id: 'tho_luyen_kim',     label: 'Thợ Luyện Kim',       icon: '🔨', passiveBuff: { epBonus: 0.10        }, buffLabel: '+10% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'quan_ghi_chep',     label: 'Quan Ghi Chép',       icon: '📜', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'doc_cong',          label: 'Đốc Công',            icon: '🏗️', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
      { id: 'te_tuong_3',        label: 'Tể Tướng',            icon: '🗝️', passiveBuff: { allBonus: 0.10       }, buffLabel: '+10% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'thuong_vuong',      label: 'Thương Vương',         icon: '💰', passiveBuff: { allBonus: 0.15       }, buffLabel: '+15% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'dai_te_su',         label: 'Đại Tế Sư',           icon: '🏛️', passiveBuff: { allBonus: 0.20       }, buffLabel: '+20% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'ton_vuong',         label: 'Tôn Vương',            icon: '👑', passiveBuff: { allBonus: 0.25       }, buffLabel: '+25% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  4: {
    bookLabel: 'Kỷ Đồ Sắt (Tam Quốc)',
    ranks: [
      { id: 'huong_dung',        label: 'Hương Dũng',          icon: '🪖', passiveBuff: { expBonus: 0.06       }, buffLabel: '+6% XP',           challengeRequirement: null },
      { id: 'do_ba',             label: 'Đô Bá',               icon: '🐉', passiveBuff: { epBonus: 0.10        }, buffLabel: '+10% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'huyen_lenh',        label: 'Huyện Lệnh',          icon: '📋', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tran_tuong',        label: 'Trấn Tướng',          icon: '🏯', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
      { id: 'thai_thu_4',        label: 'Thái Thú',            icon: '🎌', passiveBuff: { allBonus: 0.10       }, buffLabel: '+10% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'chu_hau',           label: 'Chư Hầu',             icon: '⚔️', passiveBuff: { allBonus: 0.15       }, buffLabel: '+15% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'dai_tu_ma',         label: 'Đại Tư Mã',           icon: '🐎', passiveBuff: { allBonus: 0.22       }, buffLabel: '+22% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'tam_quoc_vuong',    label: 'Ngụy/Thục/Ngô Vương', icon: '👑', passiveBuff: { allBonus: 0.28       }, buffLabel: '+28% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  5: {
    bookLabel: 'Kỷ Tăm Tối',
    ranks: [
      { id: 'ke_luu_vong',       label: 'Kẻ Lưu Vong',         icon: '🌑', passiveBuff: { expBonus: 0.06       }, buffLabel: '+6% XP',           challengeRequirement: null },
      { id: 'tu_si',             label: 'Tu Sĩ',                icon: '✝️', passiveBuff: { epBonus: 0.10        }, buffLabel: '+10% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'thay_lang',         label: 'Thầy Lang',            icon: '🌿', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nguoi_gc_5',        label: 'Người Ghi Chép',       icon: '📖', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
      { id: 'be_tren',           label: 'Bề Trên',              icon: '🕊️', passiveBuff: { allBonus: 0.10       }, buffLabel: '+10% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'hiep_si_den_thanh', label: 'Hiệp Sĩ Đền Thánh',   icon: '🛡️', passiveBuff: { allBonus: 0.15       }, buffLabel: '+15% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'dai_giam_muc',      label: 'Đại Giám Mục',         icon: '⛪', passiveBuff: { allBonus: 0.22       }, buffLabel: '+22% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'nguoi_mang_as',     label: 'Người Mang Ánh Sáng',  icon: '☀️', passiveBuff: { allBonus: 0.28       }, buffLabel: '+28% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  6: {
    bookLabel: 'Kỷ Phong Kiến',
    ranks: [
      { id: 'huong_lao',         label: 'Hương Lão',            icon: '🧓', passiveBuff: { expBonus: 0.07       }, buffLabel: '+7% XP',           challengeRequirement: null },
      { id: 'dan_binh',          label: 'Dân Binh',             icon: '🪖', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'hiep_khach',        label: 'Hiệp Khách',           icon: '🗡️', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tri_phu',           label: 'Tri Phủ',              icon: '🏛️', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'thai_thu_6',        label: 'Thái Thú',             icon: '🗺️', passiveBuff: { allBonus: 0.12       }, buffLabel: '+12% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'tuong_quan',        label: 'Tướng Quân',           icon: '⚔️', passiveBuff: { allBonus: 0.18       }, buffLabel: '+18% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'quoc_cong_tc',      label: 'Quốc Công Tiết Chế',  icon: '🐉', passiveBuff: { allBonus: 0.23       }, buffLabel: '+23% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'binh_ngo_dv',       label: 'Bình Ngô Đại Vương',  icon: '👑', passiveBuff: { allBonus: 0.30       }, buffLabel: '+30% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  7: {
    bookLabel: 'Kỷ Phục Hưng',
    ranks: [
      { id: 'mon_do',            label: 'Môn Đồ',               icon: '📚', passiveBuff: { expBonus: 0.07       }, buffLabel: '+7% XP',           challengeRequirement: null },
      { id: 'nghien_cuu_sinh',   label: 'Nghiên Cứu Sinh',       icon: '🔭', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'hoc_gia_7',         label: 'Học Giả',               icon: '🎓', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'bac_thay_nt',       label: 'Bậc Thầy Nghệ Thuật',  icon: '🎨', passiveBuff: { epBonus: 0.15        }, buffLabel: '+15% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'vien_truong',       label: 'Viện Trưởng',           icon: '🏛️', passiveBuff: { allBonus: 0.12       }, buffLabel: '+12% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'co_van_hg',         label: 'Cố Vấn Hoàng Gia',     icon: '🤴', passiveBuff: { allBonus: 0.18       }, buffLabel: '+18% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'dai_tong_su',       label: 'Đại Tông Sư',           icon: '🌟', passiveBuff: { allBonus: 0.25       }, buffLabel: '+25% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'vi_nhan_td',        label: 'Vĩ Nhân Thời Đại',     icon: '✨', passiveBuff: { allBonus: 0.30       }, buffLabel: '+30% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  8: {
    bookLabel: 'Kỷ Khám Phá',
    ranks: [
      { id: 'tho_dong_tau',      label: 'Thợ Đóng Tàu',         icon: '🔨', passiveBuff: { expBonus: 0.07       }, buffLabel: '+7% XP',           challengeRequirement: null },
      { id: 'thuy_thu',          label: 'Thủy Thủ',              icon: '⚓', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'hoa_tieu',          label: 'Hoa Tiêu',              icon: '🧭', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'thuyen_truong',     label: 'Thuyền Trưởng',         icon: '🚢', passiveBuff: { epBonus: 0.15        }, buffLabel: '+15% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'do_doc',            label: 'Đô Đốc',                icon: '🏴', passiveBuff: { allBonus: 0.12       }, buffLabel: '+12% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'thuong_gia_vd',     label: 'Thương Gia Viễn Đông', icon: '🌶️', passiveBuff: { allBonus: 0.18       }, buffLabel: '+18% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'ba_chu_dd',         label: 'Bá Chủ Đại Dương',     icon: '🌊', passiveBuff: { allBonus: 0.25       }, buffLabel: '+25% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'ke_vong_quanh_tg',  label: 'Kẻ Vòng Quanh TG',     icon: '🌍', passiveBuff: { allBonus: 0.32       }, buffLabel: '+32% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  9: {
    bookLabel: 'Kỷ Khai Sáng',
    ranks: [
      { id: 'khach_quan_cp',     label: 'Khách Quán Cà Phê',    icon: '☕', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: null },
      { id: 'khach_moi_salon',   label: 'Khách Mời Salon',       icon: '🎭', passiveBuff: { epBonus: 0.12        }, buffLabel: '+12% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'tac_gia_an_danh',   label: 'Tác Giả Ẩn Danh',      icon: '✍️', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'triet_gia',         label: 'Triết Gia',             icon: '🤔', passiveBuff: { epBonus: 0.15        }, buffLabel: '+15% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'hoc_gia_bk',        label: 'Học Giả Bách Khoa',    icon: '📔', passiveBuff: { allBonus: 0.12       }, buffLabel: '+12% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'vien_si_hl',        label: 'Viện Sĩ Hàn Lâm',      icon: '🎓', passiveBuff: { allBonus: 0.18       }, buffLabel: '+18% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'co_van_qv',         label: 'Cố Vấn Quân Vương',    icon: '🏛️', passiveBuff: { allBonus: 0.25       }, buffLabel: '+25% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 60, windowHours: 48 } },
      { id: 'vi_nhan_pantheon',  label: 'Vĩ Nhân Pantheon',     icon: '🌟', passiveBuff: { allBonus: 0.35       }, buffLabel: '+35% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 60, windowHours: 48 } },
    ],
  },
  10: {
    bookLabel: 'Kỷ Công Nghiệp',
    ranks: [
      { id: 'chu_xuong_nho',     label: 'Chủ Xưởng Nhỏ',        icon: '🔧', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: null },
      { id: 'chu_nha_may',       label: 'Chủ Nhà Máy',           icon: '🏭', passiveBuff: { epBonus: 0.15        }, buffLabel: '+15% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'nha_cong_nghiep',   label: 'Nhà Công Nghiệp',       icon: '⚙️', passiveBuff: { expBonus: 0.12       }, buffLabel: '+12% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'trum_cung_ung',     label: 'Trùm Cung Ứng',         icon: '🚂', passiveBuff: { epBonus: 0.18        }, buffLabel: '+18% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'chu_tap_doan',      label: 'Chủ Tập Đoàn',          icon: '💼', passiveBuff: { allBonus: 0.15       }, buffLabel: '+15% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'trum_doc_quyen',    label: 'Trùm Độc Quyền',        icon: '💰', passiveBuff: { allBonus: 0.22       }, buffLabel: '+22% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'dau_so_tp',         label: 'Đầu Sỏ Tài Phiệt',     icon: '🎩', passiveBuff: { allBonus: 0.30       }, buffLabel: '+30% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 90, windowHours: 48 } },
      { id: 'titan_cong_nghiep', label: 'Người Khổng Lồ KT',     icon: '🏗️', passiveBuff: { allBonus: 0.40       }, buffLabel: '+40% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 90, windowHours: 48 } },
    ],
  },
  11: {
    bookLabel: 'Kỷ Đế Quốc & Tư Bản Độc Quyền',
    ranks: [
      { id: 'trum_xuat_khau',    label: 'Trùm Xuất Khẩu',        icon: '💼', passiveBuff: { expBonus: 0.09       }, buffLabel: '+9% XP',           challengeRequirement: null },
      { id: 'chua_te_hang_hai',  label: 'Chúa Tể Hàng Hải',      icon: '⚓', passiveBuff: { epBonus: 0.16        }, buffLabel: '+16% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'ke_vat_kiet_td',    label: 'Kẻ Vắt Kiệt Thuộc Địa', icon: '🗺️', passiveBuff: { expBonus: 0.13       }, buffLabel: '+13% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tai_phiet_pho_wall',label: 'Tài Phiệt Phố Wall',     icon: '📈', passiveBuff: { epBonus: 0.20        }, buffLabel: '+20% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'ca_map_dau_co',     label: 'Cá Mập Đầu Cơ',         icon: '🦈', passiveBuff: { allBonus: 0.16       }, buffLabel: '+16% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'ke_lung_doan_kh',   label: 'Kẻ Lũng Đoạn Khủng Hoảng', icon: '💥', passiveBuff: { allBonus: 0.24   }, buffLabel: '+24% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'chu_no_de_quoc',    label: 'Chủ Nợ Của Đế Quốc',    icon: '🏦', passiveBuff: { allBonus: 0.33       }, buffLabel: '+33% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 90, windowHours: 48 } },
      { id: 'ba_chu_toan_cau',   label: 'Bá Chủ Toàn Cầu',       icon: '🌍', passiveBuff: { allBonus: 0.43       }, buffLabel: '+43% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 90, windowHours: 48 } },
    ],
  },
  12: {
    bookLabel: 'Kỷ Thế Chiến',
    ranks: [
      { id: 'tieu_doan_truong',  label: 'Tiểu Đoàn Trưởng',      icon: '🪖', passiveBuff: { expBonus: 0.09       }, buffLabel: '+9% XP',           challengeRequirement: null },
      { id: 'lu_doan_truong',    label: 'Lữ Đoàn Trưởng',        icon: '🎖️', passiveBuff: { epBonus: 0.16        }, buffLabel: '+16% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'su_doan_truong',    label: 'Sư Đoàn Trưởng',        icon: '⚔️', passiveBuff: { expBonus: 0.13       }, buffLabel: '+13% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tu_lenh_quan_doan', label: 'Tư Lệnh Quân Đoàn',     icon: '🎌', passiveBuff: { epBonus: 0.20        }, buffLabel: '+20% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'tu_lenh_tap_doan',  label: 'Tư Lệnh Tập Đoàn Quân', icon: '🗡️', passiveBuff: { allBonus: 0.17       }, buffLabel: '+17% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'tong_tham_muu',     label: 'Tổng Tham Mưu Trưởng',  icon: '🎯', passiveBuff: { allBonus: 0.26       }, buffLabel: '+26% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'tong_tu_lenh_dm',   label: 'Tổng Tư Lệnh Đồng Minh',icon: '🌐', passiveBuff: { allBonus: 0.35       }, buffLabel: '+35% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 90, windowHours: 48 } },
      { id: 'dai_thong_soai',    label: 'Đại Thống Soái',         icon: '👑', passiveBuff: { allBonus: 0.45       }, buffLabel: '+45% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 90, windowHours: 48 } },
    ],
  },
  13: {
    bookLabel: 'Kỷ Chiến Tranh Lạnh',
    ranks: [
      { id: 'chuyen_vien_pt',    label: 'Chuyên Viên Phân Tích', icon: '🕵️', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: null },
      { id: 'truong_tram_tb',    label: 'Trưởng Trạm Tình Báo',  icon: '📡', passiveBuff: { epBonus: 0.18        }, buffLabel: '+18% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'gd_co_quan_tb',     label: 'Giám Đốc Cơ Quan TBáo', icon: '🔐', passiveBuff: { expBonus: 0.14       }, buffLabel: '+14% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tu_lenh_cl',        label: 'Tư Lệnh Lực Lượng CL',  icon: '☢️', passiveBuff: { epBonus: 0.22        }, buffLabel: '+22% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'co_van_anqg',       label: 'Cố Vấn An Ninh QG',     icon: '🛡️', passiveBuff: { allBonus: 0.18       }, buffLabel: '+18% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'ngoai_truong',      label: 'Ngoại Trưởng',          icon: '🤝', passiveBuff: { allBonus: 0.27       }, buffLabel: '+27% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'pho_nguyen_thu',    label: 'Phó Nguyên Thủ',        icon: '🏛️', passiveBuff: { allBonus: 0.36       }, buffLabel: '+36% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 90, windowHours: 48 } },
      { id: 'nguyen_thu_sc',     label: 'Nguyên Thủ Siêu Cường', icon: '👑', passiveBuff: { allBonus: 0.48       }, buffLabel: '+48% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 90, windowHours: 48 } },
    ],
  },
  14: {
    bookLabel: 'Kỷ Nguyên Thông Tin',
    ranks: [
      { id: 'ky_thuat_vien_quen',label: 'Kỹ Thuật Viên Quèn',    icon: '🔧', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: null },
      { id: 'ky_su_he_thong',    label: 'Kỹ Sư Hệ Thống',        icon: '💻', passiveBuff: { epBonus: 0.18        }, buffLabel: '+18% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'kien_truc_truong',  label: 'Kiến Trúc Trưởng',       icon: '🏗️', passiveBuff: { expBonus: 0.14       }, buffLabel: '+14% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'sang_lap_startup',  label: 'Sáng Lập Startup',       icon: '🚀', passiveBuff: { epBonus: 0.22        }, buffLabel: '+22% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'tong_giam_doc_gc',  label: 'Tổng Giám Đốc',          icon: '💼', passiveBuff: { allBonus: 0.20       }, buffLabel: '+20% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'chu_tich_hd',       label: 'Chủ Tịch Hội Đồng',     icon: '👔', passiveBuff: { allBonus: 0.30       }, buffLabel: '+30% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'tai_phiet_ha_tang', label: 'Tài Phiệt Hạ Tầng',     icon: '🌐', passiveBuff: { allBonus: 0.40       }, buffLabel: '+40% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 90, windowHours: 48 } },
      { id: 'bieu_tuong_ky_nguyen',label: 'Biểu Tượng Kỷ Nguyên',icon: '✨', passiveBuff: { allBonus: 0.52       }, buffLabel: '+52% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 90, windowHours: 48 } },
    ],
  },
  15: {
    bookLabel: 'Kỷ Nguyên Trí Tuệ Nhân Tạo',
    ranks: [
      { id: 'nguoi_dung_tc',     label: 'Người Dùng Tăng Cường',  icon: '🥽', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: null },
      { id: 'ky_su_ai',          label: 'Kỹ Sư Tích Hợp AI',      icon: '🤖', passiveBuff: { epBonus: 0.20        }, buffLabel: '+20% EP',          challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'quan_tri_vien_tt',  label: 'Quản Trị Viên Thuật Toán',icon: '⚙️', passiveBuff: { expBonus: 0.15      }, buffLabel: '+15% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nha_sang_lap_mh',   label: 'Nhà Sáng Lập Mô Hình',   icon: '🧠', passiveBuff: { epBonus: 0.25        }, buffLabel: '+25% EP',          challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
      { id: 'dieu_hanh_hst',     label: 'Điều Hành Hệ Sinh Thái', icon: '🌐', passiveBuff: { allBonus: 0.22       }, buffLabel: '+22% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 45, windowHours: 48 } },
      { id: 'co_dong_tt',        label: 'Cổ Đông Chi Phối TT',    icon: '📊', passiveBuff: { allBonus: 0.33       }, buffLabel: '+33% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 45, windowHours: 48 } },
      { id: 'chu_so_huu_httt',   label: 'Chủ SH Hạ Tầng Tính Toán',icon: '🖥️', passiveBuff: { allBonus: 0.45    }, buffLabel: '+45% Tất Cả',      challengeRequirement: { sessions: 2, minMinutes: 90, windowHours: 48 } },
      { id: 'kien_truc_su_tl',   label: 'Kiến Trúc Sư Tương Lai', icon: '🌟', passiveBuff: { allBonus: 0.60       }, buffLabel: '+60% Tất Cả',      challengeRequirement: { sessions: 3, minMinutes: 90, windowHours: 48 } },
    ],
  },
};

// ─── HARD CAP XP SEAL TỪ DI VẬT ★★★ ─────────────────────────────────────────
export const XP_SEAL_HARD_CAP = 0.15;  // tối đa +15% XP từ tất cả di vật Huyền Thoại

// ─── KHỦNG HOẢNG KỶ NGUYÊN (MACRO-BOSS) ──────────────────────────────────────
// 15 kỷ nguyên × 1 khủng hoảng = 15 di vật tổng
// triggerEP = 95% ngưỡng kết thúc mỗi kỷ
// Thử thách leo thang: Eras 1-5 ≥45p/48h · Eras 6-10 ≥60p/48h · Eras 11-15 ≥90p/72h
// Hy sinh leo thang:  Eras 1-5 mất 40% · Eras 6-10 mất 50% · Eras 11-15 mất 60%
const getEraCrisisTrigger = (era) => Math.floor((ERA_THRESHOLDS[`ERA_${era}_END`] ?? 0) * 0.95);
export const ERA_CRISES = {
  1: {
    id: 'ky_bang_ha', triggerEP: getEraCrisisTrigger(1),
    name: 'Kỷ Băng Hà', icon: '🧊',
    description: 'Băng tuyết bao phủ toàn bộ đất liền. Nền văn minh sơ khai đứng trước nguy cơ tuyệt chủng.',
    sacrificeOption:  { label: 'Hiến Tế',  description: 'Hy sinh 40% tài nguyên để sống sót.', resourceLoss: 0.40, icon: '💀' },
    challengeOption:  { label: 'Đương Đầu', description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '⚔️', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'mam_song_bat_diet', label: 'Mầm Sống Bất Diệt', icon: '🌱', description: 'Di vật Kỷ Băng Hà — tăng EP mỗi phiên.', buff: { epBonus: 0.08 } } },
  },
  2: {
    id: 'han_han_co_dai', triggerEP: getEraCrisisTrigger(2),
    name: 'Hạn Hán Cổ Đại', icon: '☀️',
    description: 'Mùa màng thất bại, đất nứt nẻ. Nông nghiệp sơ khai đứng trước nạn đói diệt vong.',
    sacrificeOption:  { label: 'Nhịn Đói',  description: 'Hy sinh 40% tài nguyên cầu mưa.', resourceLoss: 0.40, icon: '🌾' },
    challengeOption:  { label: 'Khai Hoang', description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🌧️', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'phep_mau_mua_vu', label: 'Phép Màu Mùa Vụ', icon: '🌾', description: 'Di vật Hạn Hán Cổ Đại — tăng XP mỗi phiên.', buff: { expBonus: 0.05 } } },
  },
  3: {
    id: 'sup_do_dong_thau', triggerEP: getEraCrisisTrigger(3),
    name: 'Sụp Đổ Đồ Đồng', icon: '⚒️',
    description: 'Các đế chế đồng thau sụp đổ bí ẩn. Văn minh bị kéo lùi hàng thế kỷ.',
    sacrificeOption:  { label: 'Rút Lui',   description: 'Hy sinh 40% tài nguyên bảo toàn lực lượng.', resourceLoss: 0.40, icon: '🏳️' },
    challengeOption:  { label: 'Trụ Vững',  description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🛡️', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'bua_ho_menh', label: 'Bùa Hộ Mệnh', icon: '🛡️', description: 'Di vật Đồng Thau — giữ combo lâu hơn.', buff: { comboWindowHours: 1 } } },
  },
  4: {
    id: 'chien_tranh_do_sat', triggerEP: getEraCrisisTrigger(4),
    name: 'Chiến Tranh Đồ Sắt', icon: '⚔️',
    description: 'Vương quốc sắt thép xung đột liên miên. Đất đai và tài nguyên bị tàn phá không ngừng.',
    sacrificeOption:  { label: 'Cống Nạp',  description: 'Hy sinh 40% tài nguyên đổi lấy hòa bình.', resourceLoss: 0.40, icon: '💰' },
    challengeOption:  { label: 'Chinh Phục', description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🗡️', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'luoi_kiem_sat_ben', label: 'Lưỡi Kiếm Sắt Bền', icon: '⚔️', description: 'Di vật Chiến Tranh Đồ Sắt — tăng EP mỗi phiên.', buff: { epBonus: 0.09 } } },
  },
  5: {
    id: 'dem_toi_trung_co', triggerEP: getEraCrisisTrigger(5),
    name: 'Đêm Tối Trung Cổ', icon: '🌑',
    description: 'Dịch hạch và chiến tranh tàn phá đế chế. Mọi thành tựu đứng trước bờ vực sụp đổ.',
    sacrificeOption:  { label: 'Nhượng Bộ', description: 'Hy sinh 40% tài nguyên cầu hòa với Bóng Tối.', resourceLoss: 0.40, icon: '🕯️' },
    challengeOption:  { label: 'Đứng Vững', description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🔥', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'lua_vinh_cuu', label: 'Lửa Vĩnh Cửu', icon: '🔥', description: 'Di vật Đêm Tối Trung Cổ — tăng XP ổn định qua các phiên.', buff: { expBonus: 0.06 } } },
  },
  6: {
    id: 'nan_doi_phong_kien', triggerEP: getEraCrisisTrigger(6),
    name: 'Nạn Đói Phong Kiến', icon: '🏚️',
    description: 'Lãnh chúa vơ vét hết lương thực. Nông dân nổi loạn, xã hội phong kiến lung lay.',
    sacrificeOption:  { label: 'Nhượng Địa', description: 'Hy sinh 50% tài nguyên cho lãnh chúa.', resourceLoss: 0.50, icon: '🏰' },
    challengeOption:  { label: 'Kháng Cự',   description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '✊', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'la_chan_phong_kien', label: 'Lá Chắn Phong Kiến', icon: '🏰', description: 'Di vật Phong Kiến — mở rộng cửa sổ combo.', buff: { comboWindowHours: 1 } } },
  },
  7: {
    id: 'dich_hach_den', triggerEP: getEraCrisisTrigger(7),
    name: 'Dịch Hạch Đen', icon: '☠️',
    description: 'Cái chết Đen quét sạch 1/3 dân số châu Âu. Văn minh Phục Hưng bị đe dọa xóa sổ.',
    sacrificeOption:  { label: 'Cách Ly',    description: 'Hy sinh 50% tài nguyên phong tỏa lãnh thổ.', resourceLoss: 0.50, icon: '🏥' },
    challengeOption:  { label: 'Tìm Thuốc',  description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '🌿', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'la_ban_da_vinci', label: 'La Bàn Da Vinci', icon: '🧭', description: 'Di vật Phục Hưng — tăng mạnh EP mỗi phiên.', buff: { epBonus: 0.10 } } },
  },
  8: {
    id: 'bao_bien_dai_duong', triggerEP: getEraCrisisTrigger(8),
    name: 'Bão Biển Đại Dương', icon: '🌊',
    description: 'Hạm đội thám hiểm bị cuốn vào bão lớn. Toàn bộ tài nguyên từ tân thế giới có nguy cơ mất trắng.',
    sacrificeOption:  { label: 'Quay Về',    description: 'Hy sinh 50% tài nguyên tháo lui an toàn.', resourceLoss: 0.50, icon: '⚓' },
    challengeOption:  { label: 'Vượt Bão',   description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '⛵', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'xuc_xac_ky_vong', label: 'Xúc Xắc Kỳ Vọng', icon: '🎲', description: 'Di vật Đại Dương — tăng mạnh XP cho hành trình khám phá.', buff: { expBonus: 0.08 } } },
  },
  9: {
    id: 'cach_mang_dam_mau', triggerEP: getEraCrisisTrigger(9),
    name: 'Cách Mạng Đẫm Máu', icon: '🩸',
    description: 'Giai cấp công nhân nổi dậy. Chính quyền sụp đổ, mọi cấu trúc xã hội bị lật ngược.',
    sacrificeOption:  { label: 'Nhượng Quyền', description: 'Hy sinh 50% tài nguyên cho cách mạng.', resourceLoss: 0.50, icon: '🏴' },
    challengeOption:  { label: 'Khai Sáng',    description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '💡', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'ngon_duoc_khai_sang', label: 'Ngọn Đuốc Khai Sáng', icon: '💡', description: 'Di vật Khai Sáng — giữ combo lâu hơn.', buff: { comboWindowHours: 1 } } },
  },
  10: {
    id: 'khung_hoang_cong_nghiep', triggerEP: getEraCrisisTrigger(10),
    name: 'Khủng Hoảng Công Nghiệp', icon: '🏭',
    description: 'Máy móc thay thế con người hàng loạt. Nạn thất nghiệp và ô nhiễm đẩy văn minh tới bờ vực.',
    sacrificeOption:  { label: 'Đóng Cửa',  description: 'Hy sinh 50% tài nguyên dừng sản xuất.', resourceLoss: 0.50, icon: '🔧' },
    challengeOption:  { label: 'Canh Tân',   description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '⚙️', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'banh_rang_vinh_cuu', label: 'Bánh Răng Vĩnh Cửu', icon: '⚙️', description: 'Di vật Công Nghiệp — tăng mạnh EP mỗi phiên.', buff: { epBonus: 0.11 } } },
  },
  11: {
    id: 'dai_chien_the_gioi', triggerEP: getEraCrisisTrigger(11),
    name: 'Đại Chiến Thế Giới', icon: '💣',
    description: 'Chiến tranh toàn cầu bùng nổ. Bom đạn san phẳng mọi thành quả xây dựng của nhân loại.',
    sacrificeOption:  { label: 'Đầu Hàng',  description: 'Hy sinh 60% tài nguyên ký hiệp ước hòa bình.', resourceLoss: 0.60, icon: '🏳️' },
    challengeOption:  { label: 'Chiến Thắng', description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '🎖️', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'ao_giap_de_quoc', label: 'Áo Giáp Đế Quốc', icon: '👑', description: 'Di vật Thế Chiến — mở rộng mạnh cửa sổ combo.', buff: { comboWindowHours: 2 } } },
  },
  12: {
    id: 'khung_hoang_hat_nhan', triggerEP: getEraCrisisTrigger(12),
    name: 'Khủng Hoảng Hạt Nhân', icon: '☢️',
    description: 'Hai siêu cường đặt ngón tay lên nút bấm. Thế giới đứng trước hủy diệt hạt nhân hoàn toàn.',
    sacrificeOption:  { label: 'Nhượng Bộ',  description: 'Hy sinh 60% tài nguyên hạ nhiệt căng thẳng.', resourceLoss: 0.60, icon: '☮️' },
    challengeOption:  { label: 'Giải Giáp',   description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '🔐', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'mat_ma_bat_kha_pha', label: 'Mật Mã Bất Khả Phá', icon: '🔐', description: 'Di vật Chiến Tranh Lạnh — tăng rất mạnh XP mỗi phiên.', buff: { expBonus: 0.10 } } },
  },
  13: {
    id: 'sup_do_van_minh', triggerEP: getEraCrisisTrigger(13),
    name: 'Sụp Đổ Thông Tin', icon: '💻',
    description: 'Mạng internet toàn cầu bị tấn công. Hệ thống tài chính, cơ sở hạ tầng sụp đổ trong vài giờ.',
    sacrificeOption:  { label: 'Ngắt Kết Nối', description: 'Hy sinh 60% tài nguyên cô lập hệ thống.', resourceLoss: 0.60, icon: '🔌' },
    challengeOption:  { label: 'Phản Công',    description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '🧠', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'tri_tue_sieu_viet', label: 'Trí Tuệ Siêu Việt', icon: '🧠', description: 'Di vật Thông Tin — giữ combo lâu hơn nhiều.', buff: { comboWindowHours: 2 } } },
  },
  14: {
    id: 'suy_thoai_ky_thuat_so', triggerEP: getEraCrisisTrigger(14),
    name: 'Suy Thoái Kỹ Thuật Số', icon: '📡',
    description: 'Bong bóng công nghệ vỡ tan. Hàng triệu công ty phá sản, nền kinh tế số sụp đổ toàn cầu.',
    sacrificeOption:  { label: 'Bán Tháo',   description: 'Hy sinh 60% tài nguyên cắt lỗ sớm.', resourceLoss: 0.60, icon: '📉' },
    challengeOption:  { label: 'Tái Cấu Trúc', description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '🌐', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'mang_luoi_vinh_cuu', label: 'Mạng Lưới Vĩnh Cửu', icon: '🌐', description: 'Di vật Kỹ Thuật Số — tăng mạnh EP mỗi phiên.', buff: { epBonus: 0.12 } } },
  },
  15: {
    id: 'noi_day_ai', triggerEP: getEraCrisisTrigger(15),
    name: 'Nổi Dậy AI', icon: '🤖',
    description: 'AGI tự ý phát triển vượt tầm kiểm soát. Nhân loại đứng trước kịch bản tuyệt chủng cuối cùng.',
    sacrificeOption:  { label: 'Đầu Hàng',  description: 'Hy sinh 60% tài nguyên khuất phục trước AI.', resourceLoss: 0.60, icon: '🏳️' },
    challengeOption:  { label: 'Phản Kháng', description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '⚡', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'loi_tri_tue', label: 'Lõi Trí Tuệ', icon: '🤖', description: 'Di vật AI — combo dài + EP đồng thời.', buff: { comboWindowHours: 3, epBonus: 0.05 } } },
  },
};

// ─── TIẾN HÓA DI VẬT ─────────────────────────────────────────────────────────
// 3 giai đoạn: Cơ Bản (0) → Tiến Hóa ★★ (1) → Huyền Thoại ★★★ (2)
// Chỉ ★★★ mới có xpSeal (+2% XP). Tổng xpSeal bị hard cap ở XP_SEAL_HARD_CAP (15%).
// Chi phí: stage 0→1 dùng refined cơ bản; stage 1→2 gộp cả phần T3 cũ vào cùng loại refined.
/**
 * ⚠️ ADR-069 (2026-09-06) — DI VẬT CHỈ THƯỞNG TRÊN BA TRỤC SỐNG: EP · XP · giờ combo (+ xpSeal
 * ở bậc Huyền Thoại). Trước đó 12/15 di vật thưởng tài nguyên / RP / giảm thảm hoạ — ba thứ đã rời
 * đường chơi cùng ngày (không còn cổng tiêu, không còn hộp thoại phạt), tức phần thưởng của thử
 * thách kỷ nguyên gần như toàn bộ là nhãn không có hiệu ứng nhìn thấy được. Phép đổi giữ THEO CHỦ
 * ĐỀ: tài nguyên (tăng trưởng) → EP · RP (tri thức) → XP · giảm thảm hoạ (che chở) → giữ combo.
 * Bậc «Cơ Bản» PHẢI trùng `successRelic.buff` trong `ERA_CRISES` — một luật một công thức, có test.
 */
// ADR-070 (2026-09-06): DI VẬT TIẾN HOÁ THEO PHIÊN, không theo tinh luyện (`TECH_DEBT #96` từng ghi:
// tinh luyện của kỷ đã qua không có đường nào kiếm ⇒ 3/3 nút tiến hoá "Chưa đủ tài nguyên" vĩnh viễn).
// Số phiên ≥RELIC_EVOLVE_MIN_MINUTES kể TỪ LÚC NHẬN để chạm từng bậc; luật ở `engine/relicGrowth.js`.
// ⚠️ ADR-070: bậc KHÔNG còn giá (`t2Cost`/`t3Cost` đã gỡ) — tiến hoá đổi bằng PHIÊN, không bằng đồng tiền ngủ.
export const RELIC_EVOLVE_SESSIONS = [0, 20, 50];
export const RELIC_EVOLVE_MIN_MINUTES = 25;

export const RELIC_EVOLUTION = {
  // ── Era 1 — EP (ADR-069: từng là tài nguyên) ──────────────────────────────────────────────────────
  mam_song_bat_diet: { era: 1, stages: [
    { label: 'Cơ Bản',      buff: { epBonus: 0.08 } },
    { label: 'Tiến Hóa',    buff: { epBonus: 0.11 } },
    { label: 'Huyền Thoại', buff: { epBonus: 0.15, xpSeal: 0.02 } },
  ]},
  // ── Era 2 — XP (ADR-069: từng là RP) ─────────────────────────────────────
  phep_mau_mua_vu: { era: 2, stages: [
    { label: 'Cơ Bản',      buff: { expBonus: 0.05 } },
    { label: 'Tiến Hóa',    buff: { expBonus: 0.08 } },
    { label: 'Huyền Thoại', buff: { expBonus: 0.12, xpSeal: 0.02 } },
  ]},
  // ── Era 3 — Combo (ADR-069: từng là giảm thảm hoạ) ──────────────────────────────────────────────────────
  bua_ho_menh: { era: 3, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 1 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 2 } },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 3, xpSeal: 0.02 } },
  ]},
  // ── Era 4 — EP (ADR-069: từng là tài nguyên) ──────────────────────────────────────────────────────
  luoi_kiem_sat_ben: { era: 4, stages: [
    { label: 'Cơ Bản',      buff: { epBonus: 0.09 } },
    { label: 'Tiến Hóa',    buff: { epBonus: 0.13 } },
    { label: 'Huyền Thoại', buff: { epBonus: 0.18, xpSeal: 0.02 } },
  ]},
  // ── Era 5 — XP (ADR-069: từng là RP) ─────────────────────────────────────
  lua_vinh_cuu: { era: 5, stages: [
    { label: 'Cơ Bản',      buff: { expBonus: 0.06 } },
    { label: 'Tiến Hóa',    buff: { expBonus: 0.10 } },
    { label: 'Huyền Thoại', buff: { expBonus: 0.15, xpSeal: 0.02 } },
  ]},
  // ── Era 6 — Combo ─────────────────────────────────────────────────────────
  la_chan_phong_kien: { era: 6, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 1 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 2 } },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 3, xpSeal: 0.02 } },
  ]},
  // ── Era 7 — EP (ADR-069: từng là tài nguyên) ──────────────────────────────────────────────────────
  la_ban_da_vinci: { era: 7, stages: [
    { label: 'Cơ Bản',      buff: { epBonus: 0.10 } },
    { label: 'Tiến Hóa',    buff: { epBonus: 0.14 } },
    { label: 'Huyền Thoại', buff: { epBonus: 0.19, xpSeal: 0.02 } },
  ]},
  // ── Era 8 — XP (ADR-069: từng là RP) ─────────────────────────────────────
  xuc_xac_ky_vong: { era: 8, stages: [
    { label: 'Cơ Bản',      buff: { expBonus: 0.08 } },
    { label: 'Tiến Hóa',    buff: { expBonus: 0.12 } },
    { label: 'Huyền Thoại', buff: { expBonus: 0.18, xpSeal: 0.02 } },
  ]},
  // ── Era 9 — Combo (ADR-069: từng là giảm thảm hoạ) ──────────────────────────────────────────────────────
  ngon_duoc_khai_sang: { era: 9, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 1 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 2 } },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 3, xpSeal: 0.02 } },
  ]},
  // ── Era 10 — EP (ADR-069: từng là tài nguyên) ─────────────────────────────────────────────────────
  banh_rang_vinh_cuu: { era: 10, stages: [
    { label: 'Cơ Bản',      buff: { epBonus: 0.11 } },
    { label: 'Tiến Hóa',    buff: { epBonus: 0.15 } },
    { label: 'Huyền Thoại', buff: { epBonus: 0.20, xpSeal: 0.02 } },
  ]},
  // ── Era 11 — Combo ────────────────────────────────────────────────────────
  ao_giap_de_quoc: { era: 11, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 2 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 3 } },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 5, xpSeal: 0.02 } },
  ]},
  // ── Era 12 — XP (ADR-069: từng là RP) ────────────────────────────────────
  mat_ma_bat_kha_pha: { era: 12, stages: [
    { label: 'Cơ Bản',      buff: { expBonus: 0.10 } },
    { label: 'Tiến Hóa',    buff: { expBonus: 0.14 } },
    { label: 'Huyền Thoại', buff: { expBonus: 0.20, xpSeal: 0.02 } },
  ]},
  // ── Era 13 — Combo (ADR-069: từng là giảm thảm hoạ) ─────────────────────────────────────────────────────
  tri_tue_sieu_viet: { era: 13, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 2 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 3 } },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 4, xpSeal: 0.02 } },
  ]},
  // ── Era 14 — EP (ADR-069: từng là tài nguyên) ─────────────────────────────────────────────────────
  mang_luoi_vinh_cuu: { era: 14, stages: [
    { label: 'Cơ Bản',      buff: { epBonus: 0.12 } },
    { label: 'Tiến Hóa',    buff: { epBonus: 0.17 } },
    { label: 'Huyền Thoại', buff: { epBonus: 0.22, xpSeal: 0.02 } },
  ]},
  // ── Era 15 — Combo + Disaster ─────────────────────────────────────────────
  loi_tri_tue: { era: 15, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 3, epBonus: 0.05 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 5, epBonus: 0.08 } },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 8, epBonus: 0.12, xpSeal: 0.02 } },
  ]},
};

// ─── CÂY KỸ NĂNG V2 (6 nhánh × 6 kỹ năng = 36 kỹ năng) ─────────────────────
// Hạng: basic (🟩 2SP) → intermediate (🟦 3SP) → advanced (🟪 5SP) → elite (🔴 8SP)
//
// ⚠️ GIÁ SP HẠ 2,4 LẦN (2026-08-30) — 3/7/14/22 → 2/3/5/8, tổng cây 336 → 138 SP. Đây là một
// bản vá CÂN BẰNG, và nó có số:
//   · Đo trên 180 ngày thật (nhịp 3,91 phiên/ngày, 173,6 XP/ngày): Đàm mở được **2/36 kỹ năng**,
//     5 trong 6 nhánh vẫn 0/6. Ở giá cũ, mở HẾT cây cần 336 SP trên nguồn ~2 SP mỗi 34,6 ngày
//     ⇒ **15,9 NĂM**. Một cái cây 36 dòng mà 34 dòng sẽ còn xám suốt 15 năm không phải một hệ
//     thống tiến bộ; nó là một bức tường.
//   · Và nó YẾU chứ không phải mạnh: hai kỹ năng Đàm đang có mua được **+5,1% XP** trên phiên 30
//     phút (39 → 41 XP), trong khi ĐỘ DÀI PHIÊN — thứ không bị gác bởi bất cứ gì — mua được
//     **+36% chỉ từ một phút** (25' = 25 XP, 26' = 34 XP) và **+103%** khi đi từ 45' lên 60'.
//     Cả cây kỹ năng cộng lại chiếm ~1% tổng XP. Nên hạ giá KHÔNG tạo lạm phát sức mạnh.
// ⇒ Ở giá mới, cả cây còn ~1,7 năm và 4 SP đang dư của Đàm mua được NGAY hai kỹ năng nền.
// ⚠️ AN TOÀN VỚI DỮ LIỆU: hạ giá là phép CỘNG thuần — kỹ năng đã mua vẫn còn, SP đã tiêu không
// bị đòi lại, không cần migration nào. (Nâng giá thì mới cần.)
// ⚠️ Bốn con số này là MỘT LUẬT, không phải 36 con số rời: `skillTreeCost.test.js` canh mọi nút
// phải đúng giá của hạng nó khai. Đổi một nút lẻ là đỏ.
// Tổng nếu max hết: 336 SP. Mỗi nhánh có ≥1 skill cộng EP.
// Length-based buff yêu cầu > 25' (≥30/45/60). Phiên 25' (tối thiểu) không nhận buff mới.
export const SKILL_TREE = {

  // ── 1. THIỀN ĐỊNH (chiều sâu phiên) ────────────────────────────────────────
  THIEN_DINH: {
    label: 'Thiền Định',
    icon:  '🧘',
    focus: 'Phiên dài, hệ số tập trung và bùng nổ XP/EP.',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    nodes: [
      {
        id: 'vao_guong', label: 'Vào Guồng', icon: '🔥',
        tier: 'basic', spCost: 2, requires: [],
        description: `Phiên ≥${VAO_GUONG_MIN_MINUTES}': +${VAO_GUONG_XP_BONUS * 100}% XP. Thưởng cho việc đi nhỉnh hơn tối thiểu.`,
      },
      {
        id: 'chuyen_can', label: 'Chuyên Cần', icon: '⏱️',
        tier: 'basic', spCost: 2, requires: [],
        description: `Phiên ≥${CHUYEN_CAN_MIN_MINUTES}': +${CHUYEN_CAN_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'da_tap_trung', label: 'Đà Tập Trung', icon: '🌀',
        tier: 'intermediate', spCost: 3, requires: ['vao_guong'],
        description: `Mỗi phiên hoàn thành liên tiếp trong ngày: +${DA_TAP_TRUNG_STACK_BONUS * 100}% XP (tối đa ${DA_TAP_TRUNG_MAX_STACKS} lần = +${DA_TAP_TRUNG_STACK_BONUS * DA_TAP_TRUNG_MAX_STACKS * 100}%).`,
      },
      {
        id: 'vung_dong_chay', label: 'Vùng Dòng Chảy', icon: '🌊',
        tier: 'intermediate', spCost: 3, requires: ['chuyen_can'],
        description: `Phiên ≥${VUNG_DONG_CHAY_MIN_MIN}': tăng 1 bậc hệ số (×1.0→×1.3 / ×1.3→×2.0).`,
      },
      {
        id: 'tap_trung_sieu_viet', label: 'Tập Trung Siêu Việt', icon: '🧠',
        tier: 'advanced', spCost: 5, requires: ['vung_dong_chay'],
        description: `Phiên ≥${TAP_TRUNG_SV_MIN_MIN}': +${TAP_TRUNG_SV_XP_BONUS * 100}% XP, +${TAP_TRUNG_SV_EP_BONUS * 100}% EP và đảm bảo rương lớn.`,
      },
      {
        id: 'sieu_tap_trung', label: 'Siêu Tập Trung', icon: '⚡',
        tier: 'elite', spCost: 8, requires: ['tap_trung_sieu_viet'],
        description: `${SIEU_TAP_TRUNG_CHARGES} lần/ngày: kích hoạt thủ công — phiên kế ≥${SIEU_TAP_TRUNG_MIN_MIN}' nhận ×${SIEU_TAP_TRUNG_MULT} XP và ×${SIEU_TAP_TRUNG_EP_MULT} EP.`,
      },
    ],
  },

  // ── 2. Ý CHÍ (bền bỉ & streak) ─────────────────────────────────────────────
  Y_CHI: {
    label: 'Ý Chí',
    icon:  '⚔️',
    focus: 'Chống hủy, giữ nhịp streak, lifetime trophy.',
    color: 'text-red-400',
    borderColor: 'border-red-500',
    nodes: [
      {
        id: 'su_tha_thu', label: 'Sự Tha Thứ', icon: '🛡️',
        tier: 'basic', spCost: 2, requires: [],
        description: `Sau khi hủy một phiên: phiên kế ≥${SU_THA_THU_MIN_MINUTES}' nhận +${Math.round(SU_THA_THU_XP_BONUS * 100)}% XP.`,
      },
      {
        id: 'bo_nho_co_bap', label: 'Bộ Nhớ Cơ Bắp', icon: '⏰',
        tier: 'basic', spCost: 2, requires: [],
        description: `Combo không mất trong ${BO_NHO_CO_BAP_COMBO_HOURS}h (mặc định 4h).`,
      },
      {
        id: 'phuc_hoi', label: 'Phục Hồi', icon: '💪',
        tier: 'intermediate', spCost: 3, requires: ['su_tha_thu'],
        description: `Sau khi hủy một phiên: phiên kế ≥${PHUC_HOI_MIN_MINUTES}' nhận +${PHUC_HOI_XP_BONUS * 100}% XP và +${PHUC_HOI_EP_BONUS * 100}% EP.`,
      },
      {
        id: 'chuoi_ngay', label: 'Chuỗi Ngày', icon: '🔥',
        tier: 'intermediate', spCost: 3, requires: ['bo_nho_co_bap'],
        description: `+${CHUOI_NGAY_XP_PER_DAY * 100}% XP mỗi ngày streak liên tiếp (tối đa +${CHUOI_NGAY_MAX_DAYS * CHUOI_NGAY_XP_PER_DAY * 100}%).`,
      },
      {
        id: 'la_chan_streak', label: 'Lá Chắn Streak', icon: '🛡️',
        tier: 'advanced', spCost: 5, requires: ['chuoi_ngay'],
        description: `${LA_CHAN_STREAK_PER_WEEK} ngày skip/tuần không reset streak. Bảo hiểm cho người làm 6 ngày/tuần.`,
      },
      {
        id: 'ben_vung', label: 'Bền Vững', icon: '👑',
        tier: 'elite', spCost: 8, requires: ['la_chan_streak'],
        description: `Khi đạt streak ≥${BEN_VUNG_STREAK_THRESHOLD} ngày liên tục: các phiên ≥${BEN_VUNG_MIN_MINUTES}' nhận +${BEN_VUNG_PERMANENT_ALLBONUS * 100}% allBonus VĨNH VIỄN (giữ kể cả khi reset streak).`,
      },
    ],
  },

  // ── 3. NGHỈ NGƠI (volume & break) ──────────────────────────────────────────
  NGHI_NGOI: {
    label: 'Nghỉ Ngơi',
    icon:  '☕',
    focus: 'Break tối ưu, volume phiên trong ngày, capstone consistency.',
    color: 'text-sky-400',
    borderColor: 'border-sky-500',
    nodes: [
      {
        id: 'hit_tho_sau', label: 'Hít Thở Sâu', icon: '🌬️',
        tier: 'basic', spCost: 2, requires: [],
        description: `Break ngắn và dài đều +${BREAK_EXTENSION_MINUTES} phút.`,
      },
      {
        id: 'nap_nang_luong', label: 'Nạp Năng Lượng', icon: '🔋',
        tier: 'basic', spCost: 2, requires: [],
        description: `Hoàn thành break đúng hạn: phiên kế ≥${NAP_NANG_LUONG_MIN_MINUTES}' nhận +${NAP_NANG_LUONG_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'tich_phien', label: 'Tích Phiên', icon: '📊',
        tier: 'intermediate', spCost: 3, requires: ['hit_tho_sau'],
        description: `Sau khi hoàn thành ${TICH_PHIEN_AFTER_SESSIONS} phiên trong ngày: các phiên còn lại +${TICH_PHIEN_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'phien_vang_sang', label: 'Phiên Vàng Sáng', icon: '🌅',
        tier: 'intermediate', spCost: 3, requires: ['nap_nang_luong'],
        description: `Phiên đầu ngày NẾU ≥${PHIEN_VANG_SANG_MIN_MINUTES}': +${PHIEN_VANG_SANG_XP_BONUS * 100}% XP và +${PHIEN_VANG_SANG_EP_BONUS * 100}% EP.`,
      },
      {
        id: 'nhip_sinh_hoc', label: 'Nhịp Sinh Học', icon: '🌙',
        tier: 'advanced', spCost: 5, requires: ['phien_vang_sang'],
        description: `Từ phiên ${NHIP_SINH_HOC_MIN_SESSIONS} trở đi, phiên ≥${NHIP_SINH_HOC_MIN_MINUTES}': +${NHIP_SINH_HOC_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'nhip_hoan_hao', label: 'Nhịp Hoàn Hảo', icon: '🌸',
        tier: 'elite', spCost: 8, requires: ['nhip_sinh_hoc'],
        description: `≥${NHIP_HOAN_HAO_SESSIONS_PER_DAY} phiên/ngày trong ${NHIP_HOAN_HAO_DAYS_NEEDED} ngày liên tiếp → ngày kế các phiên ≥${NHIP_HOAN_HAO_MIN_MINUTES}' nhận +${NHIP_HOAN_HAO_XP_BONUS * 100}% XP và +${NHIP_HOAN_HAO_EP_BONUS * 100}% EP.`,
      },
    ],
  },

  // ── 4. VẬN MAY (drops & resources) ─────────────────────────────────────────
  VAN_MAY: {
    label: 'Vận May',
    icon:  '🎲',
    focus: 'Drops thật, refined materials, jackpot bùng nổ.',
    color: 'text-purple-400',
    borderColor: 'border-purple-500',
    nodes: [
      {
        id: 'ban_tay_vang', label: 'Bàn Tay Vàng', icon: '✨',
        tier: 'basic', spCost: 2, requires: [],
        description: `Phiên ≥${BAN_TAY_VANG_MIN_MINUTES}': ${Math.round(BAN_TAY_VANG_CHANCE * 100)}% cơ hội +${Math.round(BAN_TAY_VANG_XP_BONUS * 100)}% XP.`,
      },
      {
        id: 'nhan_quan', label: 'Nhãn Quan', icon: '👁️',
        tier: 'basic', spCost: 2, requires: [],
        description: `Phiên ≥${NHAN_QUAN_MIN_MINUTES}': ${Math.round(NHAN_QUAN_CHANCE * 100)}% cơ hội +${Math.round(NHAN_QUAN_EP_BONUS * 100)}% EP.`,
      },
      {
        id: 'linh_cam', label: 'Linh Cảm', icon: '🔮',
        tier: 'intermediate', spCost: 3, requires: ['ban_tay_vang'],
        description: `Phiên ≥${LINH_CAM_MIN_MINUTES}': ${Math.round(LINH_CAM_CHANCE * 100)}% cơ hội +${Math.round(LINH_CAM_XP_BONUS * 100)}% XP, và ${Math.round(LINH_CAM_BIG_CHANCE * 100)}% cơ hội +${Math.round(LINH_CAM_BIG_XP_BONUS * 100)}% XP.`,
      },
      {
        id: 'loc_ban_tang', label: 'Lộc Ban Tặng', icon: '🎁',
        tier: 'intermediate', spCost: 3, requires: ['nhan_quan'],
        description: `Mỗi ${LOC_BAN_TANG_SESSIONS_NEEDED} phiên ≥${LOC_BAN_TANG_MIN_MINUTES}' hoàn thành → +${LOC_BAN_TANG_XP_REWARD} XP.`,
      },
      {
        id: 'dai_trung_thuong', label: 'Đại Trúng Thưởng', icon: '🎰',
        tier: 'advanced', spCost: 5, requires: ['loc_ban_tang'],
        description: `Phiên ≥${DAI_TRUNG_THUONG_MIN_MINUTES}': ${JACKPOT_CHANCE * 100}% cơ hội jackpot — XP ×${JACKPOT_MULTIPLIER}, EP ×${JACKPOT_EP_MULTIPLIER}.`,
      },
      {
        id: 'so_do', label: 'Số Đỏ', icon: '🍀',
        tier: 'elite', spCost: 8, requires: ['dai_trung_thuong'],
        description: `${SO_DO_CHARGES} lần/ngày: kích hoạt thủ công — phiên kế ≥${SO_DO_MIN_MINUTES}' có ${SO_DO_TRIGGER_CHANCE * 100}% cơ hội ×${SO_DO_MULTIPLIER} XP và EP.`,
      },
    ],
  },

  // ── 5. CHIẾN LƯỢC (daily/weekly meta) ──────────────────────────────────────
  CHIEN_LUOC: {
    label: 'Chiến Lược',
    icon:  '🗺️',
    focus: 'Khai thác mission, weekly chain và planning daily.',
    color: 'text-amber-400',
    borderColor: 'border-amber-500',
    nodes: [
      {
        id: 'nguoi_lap_ke', label: 'Người Lập Kế', icon: '📌',
        tier: 'basic', spCost: 2, requires: [],
        description: `Hoàn thành 1 daily mission → phiên kế nhận +${NGUOI_LAP_KE_XP_BONUS * 100}% XP (mọi độ dài).`,
      },
      {
        id: 'cu_tri', label: 'Cử Tri', icon: '🗳️',
        tier: 'basic', spCost: 2, requires: [],
        description: `Weekly chain step xong → ${CU_TRI_BUFF_SESSIONS} phiên kế nhận +${CU_TRI_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'co_van', label: 'Cố Vấn', icon: '📋',
        tier: 'intermediate', spCost: 3, requires: ['nguoi_lap_ke'],
        description: `Khi đạt mục tiêu ngày → các phiên còn lại trong ngày +${CO_VAN_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'lich_day', label: 'Lịch Đầy', icon: '⚖️',
        tier: 'intermediate', spCost: 3, requires: ['cu_tri'],
        description: `Khi có ≥1 phiên ≥${LICH_DAY_THRESHOLD_45_MIN}' và ≥1 phiên ≥${LICH_DAY_THRESHOLD_60_MIN}' trong ngày → các phiên còn lại +${LICH_DAY_ALLBONUS * 100}% allBonus (cả XP và EP).`,
      },
      {
        id: 'bac_thay_chien_luoc', label: 'Bậc Thầy Chiến Lược', icon: '🎯',
        tier: 'advanced', spCost: 5, requires: ['co_van'],
        description: `Khi toàn bộ daily missions xong → các phiên ≥${BAC_THAY_CHIEN_LUOC_MIN_MIN}' sau nhận +${Math.round(BAC_THAY_CHIEN_LUOC_XP_BONUS * 100)}% XP và +${Math.round(BAC_THAY_CHIEN_LUOC_EP_BONUS * 100)}% EP.`,
      },
      {
        id: 'ke_hoach_hoan_hao', label: 'Kế Hoạch Hoàn Hảo', icon: '🏆',
        tier: 'elite', spCost: 8, requires: ['bac_thay_chien_luoc'],
        description: `Hoàn thành chuỗi tuần: step cuối ×2 + thưởng chuỗi ×2 + tuần kế các phiên +${KE_HOACH_HOAN_HAO_NEXT_WEEK_BONUS * 100}% allBonus.`,
      },
    ],
  },

  // ── 6. THĂNG HOA ───────────────────────────────────────────────────────────
  // ── 6. THĂNG HOA (era & prestige) ───────────────────────────────────────────
  THANG_HOA: {
    label: 'Thăng Hoa',
    icon:  '🌟',
    focus: 'Tăng trưởng dài hạn theo kỷ nguyên và prestige.',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500',
    nodes: [
      {
        id: 'ky_uc_ky_nguyen', label: 'Ký Ức Kỷ Nguyên', icon: '📜',
        tier: 'basic', spCost: 2, requires: [],
        description: `Phiên đầu kỷ nguyên mới NẾU ≥${KY_UC_KY_NGUYEN_MIN_MINUTES}': +${KY_UC_KY_NGUYEN_XP_BONUS * 100}% XP và +${KY_UC_KY_NGUYEN_EP_BONUS * 100}% EP.`,
      },
      {
        id: 'tri_tue_tich_luy', label: 'Trí Tuệ Tích Lũy', icon: '📚',
        tier: 'basic', spCost: 2, requires: [],
        description: `Mỗi kỷ nguyên đã vượt qua: +${TRI_TUE_TICH_LUY_XP_PER_ERA * 100}% XP vĩnh viễn (tối đa +${TRI_TUE_TICH_LUY_MAX_ERAS * TRI_TUE_TICH_LUY_XP_PER_ERA * 100}%).`,
      },
      {
        id: 'kien_thuc_nen', label: 'Kiến Thức Nền', icon: '🏛️',
        tier: 'intermediate', spCost: 3, requires: ['ky_uc_ky_nguyen'],
        description: 'Khi Prestige: giữ lại thêm 1 kỹ năng Cao Cấp (advanced) đã mở khóa.',
      },
      {
        id: 'bac_thay_ky_nguyen', label: 'Bậc Thầy Kỷ Nguyên', icon: '🌐',
        tier: 'intermediate', spCost: 3, requires: ['tri_tue_tich_luy'],
        description: `Mỗi ${BAC_THAY_KY_NGUYEN_SESSIONS} phiên trong cùng kỷ nguyên: +${BAC_THAY_KY_NGUYEN_BONUS * 100}% XP (tối đa +${BAC_THAY_KY_NGUYEN_MAX * 100}%).`,
      },
      {
        id: 'ke_thua', label: 'Kế Thừa', icon: '💎',
        tier: 'advanced', spCost: 5, requires: ['kien_thuc_nen'],
        description: `Khi Prestige: giữ lại ${KE_THUA_SP_RETENTION * 100}% SP chưa dùng.`,
      },
      {
        id: 'sieu_viet', label: 'Siêu Việt', icon: '🌠',
        tier: 'elite', spCost: 8, requires: ['ke_thua'],
        // ⚠️ VẾ "ngưỡng kỷ nguyên giảm 20%" ĐÃ GỠ KHỎI MÔ TẢ (2026-09-02). Vế XP đã được nối dây
        // thật (`prestigeCarryover.js`), vế ngưỡng thì CHƯA — nó đòi sửa `getActiveBook`, một hàm
        // được gọi một-tham-số ở rất nhiều nơi, và cho hai nơi tính ngưỡng khác nhau là cách chắc
        // chắn nhất để hai màn hình nói hai kỷ khác nhau. Mô tả chỉ được hứa thứ app THẬT SỰ làm;
        // phần còn lại nằm ở `TECH_DEBT #3` (đã thu hẹp), không nằm ở đây dưới dạng một lời hứa.
        description: `Sau Prestige: phiên ≥${SIEU_VIET_MIN_MINUTES}' trong kỷ nguyên 1 nhận +${SIEU_VIET_ERA1_XP_BONUS * 100}% XP.`,
      },
    ],
  },
};

// ─── DANH MỤC BẢN VẼ (5 mỗi kỷ) ──────────────────────────────────────────────
// Người chơi mở khóa bằng RP rồi xây qua Xưởng Xây Dựng.
export const BLUEPRINT_CATALOG = {
  1: [
    { id: 'bp_hang_dong',        label: 'Hang Động Nguyên Thủy',  icon: '🪨', rarity: 'common', description: 'Nơi trú ẩn đầu tiên của loài người — xuất phát điểm của mọi nền văn minh.' },
    { id: 'bp_bep_lua',          label: 'Bếp Lửa Cổ Đại',         icon: '🔥', rarity: 'common', description: 'Lửa mang lại hơi ấm, ánh sáng và bữa ăn đầu tiên được nấu chín.' },
    { id: 'bp_cong_cu_da',       label: 'Công Cụ Đá Thô Sơ',      icon: '🪓', rarity: 'rare',   description: 'Rìu đá giúp tăng hiệu quả thu thập tài nguyên Kỷ Đồ Đá.' },
    { id: 'bp_trai_nguyen_thuy', label: 'Trại Nguyên Thủy',        icon: '⛺', rarity: 'rare',   description: 'Khu định cư đầu tiên — nền tảng của mọi nền văn minh tương lai.' },
    { id: 'bp_tho_pho_linh',     label: 'Thờ Phổ Linh Hồn',        icon: '🗿', rarity: 'epic',   description: 'Công trình tâm linh thu hút năng lượng vũ trụ từ các chiều không gian.' },
  ],
  2: [
    { id: 'bp_lang_nong',        label: 'Làng Nông Nghiệp',        icon: '🏡', rarity: 'common', description: 'Làng nông nghiệp đầu tiên — nơi con người đặt nền móng cho nền văn minh.' },
    { id: 'bp_lo_gom',           label: 'Lò Gốm Nguyên Thủy',      icon: '🏺', rarity: 'common', description: 'Lò đất nung tạo ra đồ gốm — công cụ lưu trữ và nấu ăn không thể thiếu.' },
    { id: 'bp_kenh_tuoi',        label: 'Kênh Tưới Tiêu',           icon: '💧', rarity: 'rare',   description: 'Hệ thống thủy lợi giúp mùa màng bội thu quanh năm.' },
    { id: 'bp_kho_lua',          label: 'Kho Lúa Dự Trữ',           icon: '🌾', rarity: 'rare',   description: 'Kho lương thực khổng lồ giúp cộng đồng vượt qua nạn đói.' },
    { id: 'bp_den_tho_co',       label: 'Đền Thờ Cổ Đại',           icon: '⛩️', rarity: 'epic',   description: 'Công trình tâm linh vĩ đại tôn vinh các vị thần bảo hộ mùa màng.' },
  ],
  3: [
    { id: 'bp_lo_duc_dong',      label: 'Lò Đúc Đồng',             icon: '🔥', rarity: 'common', description: 'Lò luyện kim sơ khai biến quặng thành đồng — bước khởi đầu của Kỷ Kim Loại.' },
    { id: 'bp_xuong_ren_co',     label: 'Xưởng Rèn Cổ',            icon: '⚒️', rarity: 'common', description: 'Xưởng chế tác vũ khí và công cụ đồng — nền tảng của nền quân sự sơ khai.' },
    { id: 'bp_duong_thuong_co',  label: 'Đường Thương Cổ',          icon: '🛤️', rarity: 'rare',   description: 'Tuyến đường thương mại liên kết các thành thị và trao đổi văn hóa.' },
    { id: 'bp_thanh_co_dai',     label: 'Thành Cổ Đại',             icon: '🏯', rarity: 'rare',   description: 'Thành quách đầu tiên bảo vệ khu vực trung tâm của nền văn minh.' },
    { id: 'bp_ziggutat',         label: 'Đền Tháp Ziggurat',        icon: '🏛️', rarity: 'epic',   description: 'Kim tự tháp bậc thang biểu tượng cho sức mạnh và tôn giáo.' },
  ],
  4: [
    { id: 'bp_trang_sat',        label: 'Trang Trại Sắt',           icon: '⚙️', rarity: 'common', description: 'Xưởng luyện sắt cung cấp vũ khí và công cụ cho toàn quân.' },
    { id: 'bp_chuong_ngua',      label: 'Chuồng Ngựa Chiến',        icon: '🐎', rarity: 'common', description: 'Nơi nuôi dưỡng và huấn luyện kỵ binh tinh nhuệ.' },
    { id: 'bp_phao_dai_sat',     label: 'Pháo Đài Sắt',             icon: '🏯', rarity: 'rare',   description: 'Thành lũy kiên cố bằng sắt — không thể công phá bằng vũ khí thông thường.' },
    { id: 'bp_duong_to',         label: 'Đường Tơ Lụa',             icon: '🧶', rarity: 'rare',   description: 'Tuyến thương mại huyền thoại nối Đông–Tây, mang lại tài phú vô biên.' },
    { id: 'bp_cung_dien_co',     label: 'Cung Điện Cổ Đại',         icon: '🏰', rarity: 'epic',   description: 'Kinh thành vĩ đại — biểu tượng quyền lực của Tam Quốc.' },
  ],
  5: [
    { id: 'bp_tu_vien',          label: 'Tu Viện',                  icon: '🕌', rarity: 'common', description: 'Nơi tu sĩ học tập và gìn giữ ánh sáng tri thức trong Đêm Tối.' },
    { id: 'bp_benh_xa',          label: 'Bệnh Xá Thảo Dược',        icon: '🌿', rarity: 'common', description: 'Cơ sở chữa bệnh bằng thảo dược — cứu sống hàng ngàn sinh mạng.' },
    { id: 'bp_thap_canh',        label: 'Tháp Canh Gác',            icon: '🗼', rarity: 'rare',   description: 'Tháp quan sát bảo vệ vùng lãnh thổ khỏi các cuộc tấn công đột ngột.' },
    { id: 'bp_nha_tho_lon',      label: 'Nhà Thờ Lớn',              icon: '⛪', rarity: 'rare',   description: 'Nhà thờ Gothic uy nghiêm — trung tâm tâm linh và văn hóa của cộng đồng.' },
    { id: 'bp_thu_vien_trung_co',label: 'Thư Viện Trung Cổ',        icon: '📚', rarity: 'epic',   description: 'Kho báu tri thức giữ gìn những bản thảo quý giá trong Đêm Tối Trung Cổ.' },
  ],
  6: [
    { id: 'bp_lang_xa_viet',     label: 'Làng Xã Việt',             icon: '🏡', rarity: 'common', description: 'Đơn vị cơ bản của xã hội Việt — cộng đồng gắn kết với truyền thống làng nghề.' },
    { id: 'bp_truong_thu',       label: 'Trường Thu Thuế',           icon: '💰', rarity: 'common', description: 'Công sở thu thuế và quản lý tài chính của phủ quan.' },
    { id: 'bp_quan_truong',      label: 'Quân Trường',              icon: '⚔️', rarity: 'rare',   description: 'Bãi tập luyện binh sĩ — nơi rèn giũa quân đội tinh nhuệ Đại Việt.' },
    { id: 'bp_phu_quan',         label: 'Phủ Quan',                 icon: '🏛️', rarity: 'rare',   description: 'Dinh thự của quan lại — trung tâm quản lý và xét xử địa phương.' },
    { id: 'bp_thanh_quan_viet',  label: 'Thành Quách Việt',         icon: '🏰', rarity: 'epic',   description: 'Thành lũy kiên cố bảo vệ kinh đô — biểu tượng của nền độc lập Đại Việt.' },
  ],
  7: [
    { id: 'bp_xuong_hoa',        label: 'Xưởng Hội Họa',            icon: '🎨', rarity: 'common', description: 'Studio nghệ thuật nơi các bậc thầy tạo ra những tuyệt tác bất hủ.' },
    { id: 'bp_truong_dai_hoc',   label: 'Trường Đại Học',            icon: '🎓', rarity: 'common', description: 'Đại học đầu tiên — nơi khai sinh tư duy khoa học và triết học hiện đại.' },
    { id: 'bp_nha_bao_tang',     label: 'Bảo Tàng',                 icon: '🏛️', rarity: 'rare',   description: 'Nơi lưu giữ những kiệt tác nghệ thuật và khoa học của thời Phục Hưng.' },
    { id: 'bp_thu_vien_kh',      label: 'Thư Viện Khoa Học',        icon: '📖', rarity: 'rare',   description: 'Kho tri thức khổng lồ — nơi các nhà khoa học tra cứu và nghiên cứu.' },
    { id: 'bp_cung_dien_ph',     label: 'Cung Điện Phục Hưng',      icon: '🏰', rarity: 'epic',   description: 'Kiệt tác kiến trúc với mái vòm và cột trụ La Mã — biểu tượng của Phục Hưng.' },
  ],
  8: [
    { id: 'bp_xuong_dong_tau',   label: 'Xưởng Đóng Tàu',           icon: '⚓', rarity: 'common', description: 'Xưởng chế tạo các con tàu khám phá — bước tiến vĩ đại của kỹ thuật hàng hải.' },
    { id: 'bp_thuong_diem',      label: 'Thương Điếm',              icon: '🏪', rarity: 'common', description: 'Trạm thương mại ở vùng đất mới — mở ra con đường trao đổi hàng hóa toàn cầu.' },
    { id: 'bp_ngon_hai_dang',    label: 'Ngọn Hải Đăng',            icon: '🗼', rarity: 'rare',   description: 'Tháp chỉ đường cho những con tàu lênh đênh trên biển cả.' },
    { id: 'bp_kho_gia_vi',       label: 'Kho Gia Vị',               icon: '🌶️', rarity: 'rare',   description: 'Kho chứa gia vị Viễn Đông — tài sản quý giá hơn vàng thời khám phá.' },
    { id: 'bp_cang_bien',        label: 'Cảng Biển Lớn',            icon: '🚢', rarity: 'epic',   description: 'Cảng thương mại quốc tế nhộn nhịp — trung tâm giao thương toàn cầu.' },
  ],
  9: [
    { id: 'bp_quan_ca_phe',      label: 'Quán Cà Phê Triết Học',    icon: '☕', rarity: 'common', description: 'Nơi tư tưởng khai sáng nảy sinh và lan rộng — cái nôi của Cách Mạng Pháp.' },
    { id: 'bp_salon_tri_thuc',   label: 'Salon Trí Thức',           icon: '🎭', rarity: 'common', description: 'Phòng họp mặt của giới tinh hoa — nơi triết học và nghệ thuật gặp nhau.' },
    { id: 'bp_nha_in',           label: 'Nhà In Sách',              icon: '📰', rarity: 'rare',   description: 'Máy in hiện đại phát tán tư tưởng khai sáng đến mọi tầng lớp xã hội.' },
    { id: 'bp_vien_khoa_hoc',    label: 'Viện Khoa Học',            icon: '🔬', rarity: 'rare',   description: 'Trung tâm nghiên cứu khoa học — nơi các phát minh vĩ đại ra đời.' },
    { id: 'bp_quoc_hoi',         label: 'Quốc Hội Dân Chủ',         icon: '🏛️', rarity: 'epic',   description: 'Biểu tượng của nền dân chủ — nơi luật pháp và quyền con người được bảo vệ.' },
  ],
  10: [
    { id: 'bp_xuong_co_khi',     label: 'Xưởng Cơ Khí',            icon: '🔧', rarity: 'common', description: 'Xưởng sản xuất máy móc — nơi khởi đầu của Cách Mạng Công Nghiệp.' },
    { id: 'bp_nha_may_lt',       label: 'Nhà Máy Lớn',              icon: '🏭', rarity: 'common', description: 'Nhà máy dây chuyền sản xuất hàng loạt — biểu tượng của thời Công Nghiệp.' },
    { id: 'bp_duong_sat',        label: 'Đường Sắt',                icon: '🚂', rarity: 'rare',   description: 'Mạng lưới đường sắt kết nối toàn quốc — mạch máu của nền kinh tế công nghiệp.' },
    { id: 'bp_ngan_hang',        label: 'Ngân Hàng Quốc Gia',       icon: '🏦', rarity: 'rare',   description: 'Ngân hàng trung ương điều phối dòng tiền và đầu tư toàn nền kinh tế.' },
    { id: 'bp_tap_doan_cong',    label: 'Tập Đoàn Công Nghiệp',     icon: '🏗️', rarity: 'epic',   description: 'Đế chế công nghiệp khổng lồ kiểm soát mọi chuỗi cung ứng từ nguyên liệu đến sản phẩm.' },
  ],
  11: [
    { id: 'bp_san_chung_khoan',  label: 'Sàn Chứng Khoán',          icon: '📈', rarity: 'common', description: 'Nơi mua bán cổ phiếu — trung tâm quyền lực tài chính của kỷ nguyên tư bản.' },
    { id: 'bp_cang_xuat_khau',   label: 'Cảng Xuất Khẩu',           icon: '🚢', rarity: 'common', description: 'Cảng biển xuất khẩu hàng hóa thuộc địa — huyết mạch của đế quốc.' },
    { id: 'bp_ngan_hang_trung_uong', label: 'Ngân Hàng Trung Ương', icon: '🏦', rarity: 'rare',   description: 'Pháo đài tài chính kiểm soát lãi suất và dòng tiền toàn quốc.' },
    { id: 'bp_toa_bao_tang_de_quoc', label: 'Bảo Tàng Đế Quốc',    icon: '🏛️', rarity: 'rare',   description: 'Nơi trưng bày "chiến lợi phẩm" từ khắp các thuộc địa trên thế giới.' },
    { id: 'bp_tap_doan_doc_quyen', label: 'Tập Đoàn Độc Quyền',     icon: '🏭', rarity: 'epic',   description: 'Công ty độc quyền khổng lồ kiểm soát toàn bộ ngành công nghiệp từ A đến Z.' },
  ],
  12: [
    { id: 'bp_can_cu_quan_su',   label: 'Căn Cứ Quân Sự',           icon: '🪖', rarity: 'common', description: 'Tiền tuyến huấn luyện và tập kết quân đội cho các chiến dịch lớn.' },
    { id: 'bp_xuong_vu_khi',     label: 'Xưởng Vũ Khí',             icon: '⚙️', rarity: 'common', description: 'Xưởng sản xuất vũ khí và đạn dược — trái tim của nền công nghiệp chiến tranh.' },
    { id: 'bp_benh_vien_da_chien', label: 'Bệnh Viện Dã Chiến',     icon: '🏥', rarity: 'rare',   description: 'Bệnh viện tuyến đầu cứu sống hàng nghìn binh sĩ trong khói lửa chiến trường.' },
    { id: 'bp_trung_tam_chi_huy', label: 'Trung Tâm Chỉ Huy',       icon: '🎯', rarity: 'rare',   description: 'Đầu não chiến lược phối hợp toàn bộ lực lượng đồng minh trên mọi mặt trận.' },
    { id: 'bp_thanh_tri_chien',  label: 'Thành Trì Phòng Thủ',       icon: '🏯', rarity: 'epic',   description: 'Pháo đài bất khả xâm phạm — biểu tượng sức mạnh kiên cường trong chiến tranh tổng lực.' },
  ],
  13: [
    { id: 'bp_tram_tinh_bao',    label: 'Trạm Tình Báo',             icon: '🕵️', rarity: 'common', description: 'Căn cứ bí mật thu thập thông tin tình báo từ sau Màn Sắt.' },
    { id: 'bp_ham_ten_lua',      label: 'Hầm Tên Lửa',               icon: '🚀', rarity: 'common', description: 'Kho chứa tên lửa đạn đạo liên lục địa — biểu tượng sức mạnh hạt nhân răn đe.' },
    { id: 'bp_trung_tam_vu_tru', label: 'Trung Tâm Vũ Trụ',          icon: '🛸', rarity: 'rare',   description: 'Căn cứ phóng tên lửa thám hiểm vũ trụ — đỉnh cao của cuộc đua không gian.' },
    { id: 'bp_dai_nghe_len',     label: 'Đài Nghe Lén',              icon: '📡', rarity: 'rare',   description: 'Hệ thống do thám điện tử khổng lồ theo dõi mọi liên lạc của đối phương.' },
    { id: 'bp_ham_phan_ung',     label: 'Hầm Phản Ứng Hạt Nhân',     icon: '☢️', rarity: 'epic',   description: 'Lò phản ứng hạt nhân ngầm — nguồn năng lượng và sức mạnh tuyệt đối của siêu cường.' },
  ],
  14: [
    { id: 'bp_garage_startup',   label: 'Garage Startup',             icon: '🔧', rarity: 'common', description: 'Garage nhỏ — nơi xuất phát của những đế chế công nghệ tỷ đô.' },
    { id: 'bp_trung_tam_du_lieu', label: 'Trung Tâm Dữ Liệu',        icon: '💾', rarity: 'common', description: 'Server farm khổng lồ lưu trữ và xử lý hàng petabyte dữ liệu người dùng.' },
    { id: 'bp_van_phong_tech',   label: 'Văn Phòng Công Nghệ',        icon: '🏢', rarity: 'rare',   description: 'Văn phòng hiện đại của công ty công nghệ — nơi những ý tưởng đổi đời ra đời.' },
    { id: 'bp_mang_luoi_cdn',    label: 'Mạng Lưới CDN',             icon: '🌐', rarity: 'rare',   description: 'Hạ tầng phân phối nội dung toàn cầu — xương sống của internet hiện đại.' },
    { id: 'bp_campus_cong_nghe', label: 'Campus Công Nghệ',           icon: '🏛️', rarity: 'epic',   description: 'Khuôn viên công nghệ khổng lồ nơi hàng chục nghìn kỹ sư tài năng làm việc.' },
  ],
  15: [
    { id: 'bp_phong_lab_ai',     label: 'Phòng Lab AI',               icon: '🧪', rarity: 'common', description: 'Phòng thí nghiệm nghiên cứu AI — nơi những mô hình đầu tiên được huấn luyện.' },
    { id: 'bp_cum_may_chu_ai',   label: 'Cụm Máy Chủ AI',             icon: '🖥️', rarity: 'common', description: 'Siêu máy tính chuyên dụng huấn luyện các mô hình AI quy mô lớn.' },
    { id: 'bp_vien_nghien_cuu_ai', label: 'Viện Nghiên Cứu AI',       icon: '🔬', rarity: 'rare',   description: 'Tổ chức nghiên cứu AI hàng đầu quy tụ những bộ óc vĩ đại nhất hành tinh.' },
    { id: 'bp_nen_tang_ai',      label: 'Nền Tảng AI',                icon: '⚡', rarity: 'rare',   description: 'Hệ sinh thái AI toàn diện — hàng tỷ người dùng mỗi ngày.' },
    { id: 'bp_the_ky_moi',       label: 'Thế Kỷ Mới',                icon: '🌟', rarity: 'epic',   description: 'Điểm kỳ dị công nghệ — khoảnh khắc AI vượt qua trí tuệ con người, mở ra kỷ nguyên mới.' },
  ],
};

export const BLUEPRINT_RARITY_LABEL = {
  common: 'Phổ Thông',
  rare:   'Hiếm',
  epic:   'Sử Thi',
};

const _BP_CATALOG_LOOKUP = Object.fromEntries(
  Object.entries(BLUEPRINT_CATALOG).flatMap(([era, items]) =>
    items.map((item) => [item.id, { ...item, era: Number(era) }])
  )
);

// ⚠️ `ACHIEVEMENTS` ĐÃ BỊ XOÁ HẲN — 360 huy hiệu, 0 phần thưởng (round 44, ADR-084).
//
// Đừng dựng lại nó ở đây. Bảng ấy tồn tại từ những vòng đầu và chưa bao giờ TRẢ gì: không XP,
// không SP, không di vật — `TECH_DEBT #103` đã đo đúng chỗ đó và vòng 44 chốt bằng cách xoá.
// Cân nhắc «gắn XP vào cho có thưởng» đã được TÍNH RA SỐ trước khi bác: bronze 64 · silver 87 ·
// gold 89 · platinum 61 · diamond 59, ở mức khiêm tốn 60/120/250/500/1.000 XP là **126.030 XP
// ≈ 21 cấp ≈ 42 SP** cả ván chơi, đối lại một cây kỹ năng chỉ 138 SP — tức một vòi thứ hai đủ lớn
// để hoà tan luật MỘT TIỀN TỆ (ADR-069) mà cả vòng 43 và 44 dựng lên.
//
// Thứ thay nó KHÔNG phải là một bảng khác: một công trình xong trả 1 SP (`skillPointEconomy.js`).
// Bản ghi «tôi đã đi được bao xa» nay là chính thành phố (38/75 công trình, kỷ đã niêm phong có
// dấu ★) và màn Thống kê. Ảnh màn hình trước khi xoá: `.city-preview/r43/before-HuyHieu-390.png`.

// ─── SINH `check` TỪ NGƯỠNG ĐÃ KHAI ────────────────────────────────────────────────────────────

// ─── STREAK SYSTEM ────────────────────────────────────────────────────────────
export const STREAK_BONUS_PER_DAY  = 0.012; // +1.2% XP mỗi ngày chuỗi
export const STREAK_MAX_BONUS_DAYS = 15;    // tối đa 15 ngày (+18%)

// ─── DAILY MISSIONS ───────────────────────────────────────────────────────────
export const MISSIONS_PER_DAY     = 3;
export const MISSION_ALL_BONUS_XP = 50;
export const MISSION_NOTE_MIN_WORDS = 5;
export const DAILY_RARE_BUCKET_CHANCE_MIN = 0.01;
export const DAILY_RARE_BUCKET_CHANCE_MAX = 0.05;
export const DAILY_MISSION_XP_SCALE = 0.85;

export const MISSION_CATALOG = [
  // Sessions
  { id: 'complete_1_session',   label: 'Hoàn thành 1 phiên tập trung',              type: 'sessions',        family: 'sessions',         bucket: 'core',    weight: 1.1,  goal: 1,   rewardXP: 20  },
  { id: 'complete_2_sessions',  label: 'Hoàn thành 2 phiên tập trung',              type: 'sessions',        family: 'sessions',         bucket: 'core',    weight: 1.0,  goal: 2,   rewardXP: 40  },
  { id: 'complete_3_sessions',  label: 'Hoàn thành 3 phiên tập trung',              type: 'sessions',        family: 'sessions',         bucket: 'stretch', weight: 1.0,  goal: 3,   rewardXP: 60  },
  { id: 'complete_4_sessions',  label: 'Hoàn thành 4 phiên tập trung',              type: 'sessions',        family: 'sessions',         bucket: 'stretch', weight: 0.8,  goal: 4,   rewardXP: 90  },
  { id: 'complete_5_sessions',  label: 'Hoàn thành 5 phiên trong ngày',             type: 'sessions',        family: 'sessions',         bucket: 'stretch', weight: 0.55, goal: 5,   rewardXP: 120 },
  // Minutes accumulated
  { id: 'focus_25min',          label: 'Tích lũy 25 phút tập trung',                type: 'focusMinutes',    family: 'focusMinutes',     bucket: 'core',    weight: 1.0,  goal: 25,  rewardXP: 25  },
  { id: 'focus_45min',          label: 'Tích lũy 45 phút tập trung',                type: 'focusMinutes',    family: 'focusMinutes',     bucket: 'core',    weight: 1.0,  goal: 45,  rewardXP: 45  },
  { id: 'focus_60min',          label: 'Tích lũy 60 phút tập trung hôm nay',        type: 'focusMinutes',    family: 'focusMinutes',     bucket: 'core',    weight: 0.9,  goal: 60,  rewardXP: 60  },
  { id: 'focus_90min',          label: 'Tích lũy 90 phút tập trung hôm nay',        type: 'focusMinutes',    family: 'focusMinutes',     bucket: 'stretch', weight: 1.0,  goal: 90,  rewardXP: 90  },
  { id: 'focus_120min',         label: 'Chinh phục 2 giờ tập trung',                type: 'focusMinutes',    family: 'focusMinutes',     bucket: 'stretch', weight: 0.8,  goal: 120, rewardXP: 120 },
  { id: 'focus_150min',         label: 'Vượt 2.5 giờ tập trung trong ngày',         type: 'focusMinutes',    family: 'focusMinutes',     bucket: 'stretch', weight: 0.55, goal: 150, rewardXP: 160 },
  // Single session milestones
  { id: 'session_25min',        label: 'Hoàn thành 1 phiên ≥25 phút',               type: 'singleSession',   family: 'singleSession',    bucket: 'core',    weight: 1.0,  goal: 25,  rewardXP: 25  },
  { id: 'session_30min',        label: 'Hoàn thành 1 phiên ≥30 phút',               type: 'singleSession',   family: 'singleSession',    bucket: 'core',    weight: 1.0,  goal: 30,  rewardXP: 35  },
  { id: 'session_45min',        label: 'Hoàn thành 1 phiên ≥45 phút',               type: 'singleSession',   family: 'singleSession',    bucket: 'stretch', weight: 1.0,  goal: 45,  rewardXP: 45  },
  { id: 'session_60min',        label: 'Hoàn thành 1 phiên ≥60 phút',               type: 'singleSession',   family: 'singleSession',    bucket: 'stretch', weight: 0.9,  goal: 60,  rewardXP: 75  },
  { id: 'session_90min',        label: 'Hoàn thành 1 phiên ≥90 phút',               type: 'singleSession',   family: 'singleSession',    bucket: 'stretch', weight: 0.65, goal: 90,  rewardXP: 130 },
  { id: 'session_120min',       label: 'Hoàn thành 1 phiên ≥120 phút',              type: 'singleSession',   family: 'singleSession',    bucket: 'stretch', weight: 0.35, goal: 120, rewardXP: 200 },
  // Deep work
  { id: 'deep_2_sessions',      label: 'Hoàn thành 2 phiên ≥45 phút',               type: 'deepSessions',    family: 'deepSessions',     bucket: 'stretch', weight: 0.75, goal: 2,   rewardXP: 80  },
  // Variety
  { id: 'use_2_categories',     label: 'Dùng 2 danh mục khác nhau trong ngày',      type: 'uniqueCategories', family: 'uniqueCategories', bucket: 'variety', weight: 1.0,  goal: 2,   rewardXP: 30  },
  { id: 'use_3_categories',     label: 'Dùng 3 danh mục khác nhau trong ngày',      type: 'uniqueCategories', family: 'uniqueCategories', bucket: 'variety', weight: 0.7,  goal: 3,   rewardXP: 75  },
  { id: 'write_1_note',         label: 'Viết 1 ghi chú ít nhất 5 từ sau phiên tập trung', type: 'notes',      family: 'notes',            bucket: 'variety', weight: 0.8,  goal: 1,   rewardXP: 25  },
  { id: 'write_2_notes',        label: 'Viết 2 ghi chú ít nhất 5 từ trong ngày',         type: 'notes',      family: 'notes',            bucket: 'variety', weight: 0.55, goal: 2,   rewardXP: 55  },
  { id: 'perfect_break_1',      label: 'Kết thúc nghỉ đúng giờ 1 lần',              type: 'perfectBreaks',   family: 'perfectBreaks',    bucket: 'variety', weight: 0.9,  goal: 1,   rewardXP: 25  },
  { id: 'perfect_break_2',      label: 'Kết thúc nghỉ đúng giờ 2 lần',              type: 'perfectBreaks',   family: 'perfectBreaks',    bucket: 'variety', weight: 0.55, goal: 2,   rewardXP: 60  },
  { id: 'balanced_day',         label: 'Có cả 1 phiên ngắn ≤25 phút và 1 phiên dài ≥60 phút', type: 'balancedSessions', family: 'balancedSessions', bucket: 'variety', weight: 0.75, goal: 1, rewardXP: 45 },
];

// ─── WEEKLY QUEST CHAINS ──────────────────────────────────────────────────────
// Chuỗi 4 nhiệm vụ có narrative, reward lớn — refresh mỗi tuần
// Anti-inflation: XP reward mỗi bước nhỏ, bonusXP + bonusSP là phần thưởng cuối
export const WEEKLY_CHAINS = [
  {
    id:    'chain_genesis',
    title: 'Thuở Khai Thiên',
    flavor: 'Nhen nhóm ngọn lửa văn minh đầu tiên',
    steps: [
      { id: 'wq_g1', label: 'Nhóm lửa — hoàn thành phiên đầu tiên',      type: 'sessions',         goal: 1,  rewardXP: 25 },
      { id: 'wq_g2', label: 'Khám phá — dùng 2 danh mục trong tuần',     type: 'uniqueCategories', goal: 2,  rewardXP: 45 },
      { id: 'wq_g3', label: 'Hội tụ — tích lũy 90 phút tập trung',       type: 'focusMinutes',     goal: 90, rewardXP: 70 },
      { id: 'wq_g4', label: 'Đặt nền — có mặt trong 3 ngày khác nhau',   type: 'daysActive',       goal: 3,  rewardXP: 90 },
    ],
    bonusXP: 360, bonusSP: 1,
  },
  {
    id:    'chain_civilization',
    title: 'Bình Minh Văn Minh',
    flavor: 'Xây dựng nền tảng cho đế chế tương lai',
    steps: [
      { id: 'wq_c1', label: 'Đặt móng — khai mở tuần mới với 1 phiên',   type: 'sessions',      goal: 1,   rewardXP: 25  },
      { id: 'wq_c2', label: 'Xây tường — viết 2 ghi chú ít nhất 5 từ',   type: 'notes',         goal: 2,   rewardXP: 55  },
      { id: 'wq_c3', label: 'Lợp mái — 4 ngày có phiên tập trung',       type: 'daysActive',    goal: 4,   rewardXP: 90  },
      { id: 'wq_c4', label: 'Khánh thành — chinh phục 150 phút trong tuần', type: 'focusMinutes', goal: 150, rewardXP: 120 },
    ],
    bonusXP: 390, bonusSP: 1,
  },
  {
    id:    'chain_industry',
    title: 'Cuộc Cách Mạng',
    flavor: 'Vận hành guồng máy không ngừng nghỉ',
    steps: [
      { id: 'wq_i1', label: 'Nổ máy — hoàn thành 2 phiên đầu tuần',      type: 'sessions',       goal: 2,   rewardXP: 30  },
      { id: 'wq_i2', label: 'Tăng tốc — tổng 150 phút tập trung',        type: 'focusMinutes',   goal: 150, rewardXP: 75  },
      { id: 'wq_i3', label: 'Ca kép — hoàn thành 2 phiên ≥45 phút', type: 'deepSessions', goal: 2, rewardXP: 95 },
      { id: 'wq_i4', label: 'Đúng nhịp — kết thúc nghỉ đúng giờ 2 lần',  type: 'perfectBreaks',  goal: 2,   rewardXP: 105 },
    ],
    bonusXP: 420, bonusSP: 1,
  },
  {
    id:    'chain_digital',
    title: 'Kỷ Nguyên Số',
    flavor: 'Kết nối trí tuệ với dòng chảy thông tin',
    steps: [
      { id: 'wq_d1', label: 'Boot up — khởi động tuần với 1 phiên',       type: 'sessions',         goal: 1,   rewardXP: 25  },
      { id: 'wq_d2', label: 'Tag dữ liệu — dùng 3 danh mục khác nhau',    type: 'uniqueCategories', goal: 3,   rewardXP: 60  },
      { id: 'wq_d3', label: 'Logbook — viết 3 ghi chú ít nhất 5 từ',      type: 'notes',            goal: 3,   rewardXP: 85  },
      { id: 'wq_d4', label: 'Deploy — tổng 180 phút trong tuần',          type: 'focusMinutes',     goal: 180, rewardXP: 110 },
    ],
    bonusXP: 400, bonusSP: 1,
  },
  {
    id:    'chain_cosmos',
    title: 'Chinh Phục Vũ Trụ',
    flavor: 'Vượt qua giới hạn — khám phá vô tận',
    steps: [
      { id: 'wq_s1', label: 'Quỹ đạo thấp — 4 ngày có phiên tập trung',  type: 'daysActive',    goal: 4,   rewardXP: 75  },
      { id: 'wq_s2', label: 'Thoát khí quyển — 200 phút tổng trong tuần',type: 'focusMinutes',  goal: 200, rewardXP: 100 },
      { id: 'wq_s3', label: 'Quỹ đạo — 8 phiên hoàn thành',              type: 'sessions',      goal: 8,   rewardXP: 120 },
      { id: 'wq_s4', label: 'Đổ bộ — 1 phiên ≥90 phút',                   type: 'singleSession', goal: 90,  rewardXP: 145 },
    ],
    bonusXP: 430, bonusSP: 2,
  },
  {
    id:    'chain_archivist',
    title: 'Người Lưu Trữ',
    flavor: 'Tuần của ghi chép, kết nối và đúc kết',
    steps: [
      { id: 'wq_a1', label: 'Mở sổ — viết 1 ghi chú ít nhất 5 từ',        type: 'notes',            goal: 1,   rewardXP: 30  },
      { id: 'wq_a2', label: 'Sắp mục lục — dùng 3 danh mục khác nhau',    type: 'uniqueCategories', goal: 3,   rewardXP: 60  },
      { id: 'wq_a3', label: 'Tổng kết — đạt 180 phút tập trung',          type: 'focusMinutes',     goal: 180, rewardXP: 110 },
      { id: 'wq_a4', label: 'Khóa sổ — có phiên trong 5 ngày khác nhau',  type: 'daysActive',       goal: 5,   rewardXP: 120 },
    ],
    bonusXP: 410, bonusSP: 1,
  },
  {
    id:    'chain_ranger',
    title: 'Tuần Viễn Du',
    flavor: 'Đi xa bằng nhịp đều, không chỉ bằng một cú bứt tốc',
    steps: [
      { id: 'wq_r1', label: 'Rời trại — hoàn thành 2 phiên',                 type: 'sessions',         goal: 2,   rewardXP: 30  },
      { id: 'wq_r2', label: 'Đổi hướng — dùng 4 danh mục khác nhau',         type: 'uniqueCategories', goal: 4,   rewardXP: 75  },
      { id: 'wq_r3', label: 'Giữ nhịp — có 2 ngày gồm cả phiên ngắn và dài', type: 'balancedDays',     goal: 2,   rewardXP: 95  },
      { id: 'wq_r4', label: 'Về đích — 6 ngày có phiên tập trung',           type: 'daysActive',       goal: 6,   rewardXP: 125 },
    ],
    bonusXP: 430, bonusSP: 1,
  },
  {
    id:    'chain_harmony',
    title: 'Nhịp Cân Bằng',
    flavor: 'Giữ nhịp bằng nhiều kiểu tập trung khác nhau',
    steps: [
      { id: 'wq_h1', label: 'Lấy đà — có 1 ngày gồm cả phiên ngắn và phiên dài', type: 'balancedDays',  goal: 1, rewardXP: 40  },
      { id: 'wq_h2', label: 'Giữ trục — hoàn thành 2 phiên ≥45 phút',    type: 'deepSessions', goal: 2, rewardXP: 85  },
      { id: 'wq_h3', label: 'Neo ý — viết 2 ghi chú ít nhất 5 từ',                type: 'notes',        goal: 2, rewardXP: 60  },
      { id: 'wq_h4', label: 'Đúng nhịp — kết thúc nghỉ đúng giờ 2 lần',           type: 'perfectBreaks', goal: 2, rewardXP: 100 },
    ],
    bonusXP: 410, bonusSP: 1,
  },
];
export const WEEKLY_CHAIN_XP_SCALE = 0.8;
export const PERFECT_PLAN_WEEKLY_MULTIPLIER = 2;

// ─── STREAK BONUS MISSION ─────────────────────────────────────────────────────
export const STREAK_MISSION_MIN_STREAK = 7;      // streak tối thiểu để xuất hiện
export const STREAK_MISSION_BASE_XP    = 50;     // XP tại streak 7
export const STREAK_MISSION_XP_PER_DAY = 10;    // +10 XP mỗi ngày streak thêm (sau 7)
export const STREAK_MISSION_MAX_XP     = 250;    // tối đa 250 XP (tránh lạm phát)

// ─── BUILDING SYSTEM (Resource Sink) ─────────────────────────────────────────
// key = blueprint id; cost = resources deducted from current book bag
// passiveEPPerBreakMin = EP added every break-minute (via useGameLoop)
export const BUILDING_SPECS = {
  // ── Kỷ 1: Đồ Đá Cũ — ×5.5 ──
  bp_hang_dong:        { cost: { da_silex: 320,  xuong: 220                        }, passiveEPPerBreakMin: 1,  label: 'Hang Động Nguyên Thủy' },
  bp_bep_lua:          { cost: { lua_soi: 440,   da_silex: 320                     }, passiveEPPerBreakMin: 1,  label: 'Bếp Lửa Cổ Đại'        },
  bp_cong_cu_da:       { cost: { da_silex: 650,  da_thu: 440                       }, passiveEPPerBreakMin: 2,  label: 'Công Cụ Đá Thô Sơ'     },
  bp_trai_nguyen_thuy: { cost: { da_silex: 1100, xuong: 550,  da_thu: 440          }, passiveEPPerBreakMin: 3,  label: 'Trại Nguyên Thủy'      },
  bp_tho_pho_linh:     { cost: { lua_soi: 1100,  xuong: 800                        }, refinedCost: { t2: 6  },  passiveEPPerBreakMin: 5,  label: 'Thờ Phổ Linh Hồn'      },
  // ── Kỷ 2: Nông Nghiệp — ×5.5 ──
  bp_lang_nong:        { cost: { ngu_coc: 820,   dat_set: 440                      }, passiveEPPerBreakMin: 1,  label: 'Làng Nông Nghiệp'      },
  bp_lo_gom:           { cost: { dat_set: 900,   go_xay: 450                       }, passiveEPPerBreakMin: 2,  label: 'Lò Gốm Nguyên Thủy'   },
  bp_kenh_tuoi:        { cost: { nuoc_ngam: 1100, go_xay: 820                      }, passiveEPPerBreakMin: 2,  label: 'Kênh Tưới Tiêu'        },
  bp_kho_lua:          { cost: { ngu_coc: 1900,  go_xay: 1100                      }, passiveEPPerBreakMin: 3,  label: 'Kho Lúa Dự Trữ'        },
  bp_den_tho_co:       { cost: { dat_set: 2200,  ngu_coc: 1650, nuoc_ngam: 1100    }, refinedCost: { t2: 8  },  passiveEPPerBreakMin: 6,  label: 'Đền Thờ Cổ Đại'        },
  // ── Kỷ 3: Đồ Đồng — ×5 ──
  bp_lo_duc_dong:      { cost: { dong: 500,      thiec: 300                        }, passiveEPPerBreakMin: 1,  label: 'Lò Đúc Đồng'          },
  bp_xuong_ren_co:     { cost: { dong: 850,      muoi: 350                         }, passiveEPPerBreakMin: 2,  label: 'Xưởng Rèn Cổ'         },
  bp_duong_thuong_co:  { cost: { muoi: 1250,     da_mau: 500                       }, passiveEPPerBreakMin: 2,  label: 'Đường Thương Cổ'       },
  bp_thanh_co_dai:     { cost: { dong: 1400,     thiec: 900,  muoi: 600            }, passiveEPPerBreakMin: 3,  label: 'Thành Cổ Đại'          },
  bp_ziggutat:         { cost: { dong: 2500,     da_mau: 1500, thiec: 1250         }, refinedCost: { t2: 10 },  passiveEPPerBreakMin: 6,  label: 'Đền Tháp Ziggurat'    },
  // ── Kỷ 4: Đồ Sắt — ×5 ──
  bp_trang_sat:        { cost: { sat_thep: 750,  quan_luong: 400                   }, passiveEPPerBreakMin: 2,  label: 'Trang Trại Sắt'        },
  bp_chuong_ngua:      { cost: { quan_luong: 1000, sat_thep: 500                   }, passiveEPPerBreakMin: 2,  label: 'Chuồng Ngựa Chiến'     },
  bp_phao_dai_sat:     { cost: { sat_thep: 1750, quan_luong: 1000                  }, passiveEPPerBreakMin: 3,  label: 'Pháo Đài Sắt'          },
  bp_duong_to:         { cost: { lua_to: 1500,   ngoc: 500                         }, passiveEPPerBreakMin: 3,  label: 'Đường Tơ Lụa'          },
  bp_cung_dien_co:     { cost: { ngoc: 1250,     lua_to: 2000, sat_thep: 1250      }, refinedCost: { t2: 12 },  passiveEPPerBreakMin: 6,  label: 'Cung Điện Cổ Đại'      },
  // ── Kỷ 5: Tăm Tối — ×4.5 ──
  bp_tu_vien:          { cost: { giay_da: 680,   da_xay: 360                       }, passiveEPPerBreakMin: 2,  label: 'Tu Viện'               },
  bp_benh_xa:          { cost: { thao_duoc: 900, giay_da: 450                      }, passiveEPPerBreakMin: 2,  label: 'Bệnh Xá Thảo Dược'    },
  bp_thap_canh:        { cost: { da_xay: 1350,   duc_tin: 680                      }, passiveEPPerBreakMin: 3,  label: 'Tháp Canh Gác'         },
  bp_nha_tho_lon:      { cost: { da_xay: 1800,   duc_tin: 1350                     }, passiveEPPerBreakMin: 4,  label: 'Nhà Thờ Lớn'           },
  bp_thu_vien_trung_co:{ cost: { giay_da: 2250,  duc_tin: 1100, da_xay: 900        }, refinedCost: { t2: 12, t3: 2 }, passiveEPPerBreakMin: 7, label: 'Thư Viện Trung Cổ' },
  // ── Kỷ 6: Phong Kiến — ×4 ──
  bp_lang_xa_viet:     { cost: { luong_thuc: 800, thue: 320                        }, passiveEPPerBreakMin: 2,  label: 'Làng Xã Việt'          },
  bp_truong_thu:       { cost: { thue: 1000,     luong_thuc: 600                   }, passiveEPPerBreakMin: 2,  label: 'Trường Thu Thuế'        },
  bp_quan_truong:      { cost: { vu_khi: 1200,   luong_thuc: 800                   }, passiveEPPerBreakMin: 3,  label: 'Quân Trường'           },
  bp_phu_quan:         { cost: { to_lua: 1200,   thue: 1200                        }, passiveEPPerBreakMin: 4,  label: 'Phủ Quan'              },
  bp_thanh_quan_viet:  { cost: { vu_khi: 2000,   luong_thuc: 1600, to_lua: 1000    }, refinedCost: { t2: 14, t3: 3 }, passiveEPPerBreakMin: 7, label: 'Thành Quách Việt'  },
  // ── Kỷ 7: Phục Hưng — ×4 ──
  bp_xuong_hoa:        { cost: { nghe_thuat: 800, ban_thao: 400                    }, passiveEPPerBreakMin: 2,  label: 'Xưởng Hội Họa'         },
  bp_truong_dai_hoc:   { cost: { ban_thao: 1000,  vang: 500                        }, passiveEPPerBreakMin: 3,  label: 'Trường Đại Học'         },
  bp_nha_bao_tang:     { cost: { nghe_thuat: 1400, da_hoa: 700                     }, passiveEPPerBreakMin: 3,  label: 'Bảo Tàng'              },
  bp_thu_vien_kh:      { cost: { ban_thao: 1500,  vang: 900                        }, passiveEPPerBreakMin: 4,  label: 'Thư Viện Khoa Học'     },
  bp_cung_dien_ph:     { cost: { da_hoa: 1600,    vang: 1600, nghe_thuat: 1200     }, refinedCost: { t2: 16, t3: 4 }, passiveEPPerBreakMin: 8, label: 'Cung Điện Phục Hưng' },
  // ── Kỷ 8: Khám Phá — ×4 ──
  bp_xuong_dong_tau:   { cost: { hang_hoa: 800,   vang_kcv: 600                    }, passiveEPPerBreakMin: 2,  label: 'Xưởng Đóng Tàu'        },
  bp_thuong_diem:      { cost: { gia_vi: 700,     hang_hoa: 500                    }, passiveEPPerBreakMin: 2,  label: 'Thương Điếm'           },
  bp_ngon_hai_dang:    { cost: { ban_do: 900,     vang_kcv: 700                    }, passiveEPPerBreakMin: 3,  label: 'Ngọn Hải Đăng'         },
  bp_kho_gia_vi:       { cost: { gia_vi: 1400,    hang_hoa: 800                    }, passiveEPPerBreakMin: 4,  label: 'Kho Gia Vị'            },
  bp_cang_bien:        { cost: { vang_kcv: 2000,  hang_hoa: 2000, gia_vi: 1200     }, refinedCost: { t2: 18, t3: 5 }, passiveEPPerBreakMin: 8, label: 'Cảng Biển Lớn'     },
  // ── Kỷ 9: Khai Sáng — ×3.5 ──
  bp_quan_ca_phe:      { cost: { ca_phe: 700,     tu_tuong: 520                    }, passiveEPPerBreakMin: 2,  label: 'Quán Cà Phê Triết Học' },
  bp_salon_tri_thuc:   { cost: { anh_huong: 880,  ca_phe: 700                      }, passiveEPPerBreakMin: 3,  label: 'Salon Trí Thức'        },
  bp_nha_in:           { cost: { sach_in: 1200,   anh_huong: 700                   }, passiveEPPerBreakMin: 3,  label: 'Nhà In Sách'           },
  bp_vien_khoa_hoc:    { cost: { tu_tuong: 1750,  sach_in: 1050                    }, passiveEPPerBreakMin: 4,  label: 'Viện Khoa Học'         },
  bp_quoc_hoi:         { cost: { anh_huong: 2100, tu_tuong: 1400, sach_in: 1050    }, refinedCost: { t2: 20, t3: 6 }, passiveEPPerBreakMin: 9, label: 'Quốc Hội Dân Chủ'  },
  // ── Kỷ 10: Công Nghiệp — ×3.5 ──
  bp_xuong_co_khi:     { cost: { thep: 700,       than_cong: 520                   }, passiveEPPerBreakMin: 2,  label: 'Xưởng Cơ Khí'          },
  bp_nha_may_lt:       { cost: { than_cong: 1200, von: 700                         }, passiveEPPerBreakMin: 3,  label: 'Nhà Máy Lớn'           },
  bp_duong_sat:        { cost: { thep: 1750,      than_cong: 1400                  }, passiveEPPerBreakMin: 5,  label: 'Đường Sắt'             },
  bp_ngan_hang:        { cost: { von: 2100,       thep: 1050                       }, passiveEPPerBreakMin: 6,  label: 'Ngân Hàng Quốc Gia'   },
  bp_tap_doan_cong:    { cost: { von: 2800, thep: 2100, hoi_nuoc: 1400, than_cong: 1750 }, refinedCost: { t2: 25, t3: 8 }, passiveEPPerBreakMin: 12, label: 'Tập Đoàn Công Nghiệp' },
  // ── Kỷ 11: Đế Quốc — ×3 ──
  bp_san_chung_khoan:  { cost: { co_phieu: 900,   doc_quyen: 450                   }, passiveEPPerBreakMin: 3,  label: 'Sàn Chứng Khoán'       },
  bp_cang_xuat_khau:   { cost: { thuoc_dia: 1200, co_phieu: 600                    }, passiveEPPerBreakMin: 3,  label: 'Cảng Xuất Khẩu'        },
  bp_ngan_hang_trung_uong: { cost: { vang_du_tru: 1500, co_phieu: 1200             }, passiveEPPerBreakMin: 5,  label: 'Ngân Hàng Trung Ương'  },
  bp_toa_bao_tang_de_quoc: { cost: { thuoc_dia: 1300, vang_du_tru: 900             }, passiveEPPerBreakMin: 6,  label: 'Bảo Tàng Đế Quốc'     },
  bp_tap_doan_doc_quyen: { cost: { doc_quyen: 2400, vang_du_tru: 1800, co_phieu: 1500 }, refinedCost: { t2: 28, t3: 9 }, passiveEPPerBreakMin: 14, label: 'Tập Đoàn Độc Quyền' },
  // ── Kỷ 12: Thế Chiến — ×3 ──
  bp_can_cu_quan_su:   { cost: { dan_duoc: 900,   quan_nhu: 600                    }, passiveEPPerBreakMin: 3,  label: 'Căn Cứ Quân Sự'        },
  bp_xuong_vu_khi:     { cost: { dan_duoc: 1500,  quan_nhu: 900                    }, passiveEPPerBreakMin: 4,  label: 'Xưởng Vũ Khí'          },
  bp_benh_vien_da_chien: { cost: { quan_nhu: 1500, tinh_bao: 800                   }, passiveEPPerBreakMin: 5,  label: 'Bệnh Viện Dã Chiến'    },
  bp_trung_tam_chi_huy: { cost: { tinh_bao: 2100, lanh_tho: 1200                   }, passiveEPPerBreakMin: 6,  label: 'Trung Tâm Chỉ Huy'     },
  bp_thanh_tri_chien:  { cost: { lanh_tho: 2400,  dan_duoc: 2100, quan_nhu: 1500   }, refinedCost: { t2: 30, t3: 10 }, passiveEPPerBreakMin: 16, label: 'Thành Trì Phòng Thủ' },
  // ── Kỷ 13: Chiến Tranh Lạnh — ×2.5 ──
  bp_tram_tinh_bao:    { cost: { mat_ma: 750,     anh_huong_ct: 500                }, passiveEPPerBreakMin: 3,  label: 'Trạm Tình Báo'         },
  bp_ham_ten_lua:      { cost: { hat_nhan: 800,   anh_huong_ct: 600                }, passiveEPPerBreakMin: 5,  label: 'Hầm Tên Lửa'           },
  bp_trung_tam_vu_tru: { cost: { ve_tinh: 1250,   hat_nhan: 750                    }, passiveEPPerBreakMin: 6,  label: 'Trung Tâm Vũ Trụ'      },
  bp_dai_nghe_len:     { cost: { mat_ma: 1300,    ve_tinh: 900                     }, passiveEPPerBreakMin: 7,  label: 'Đài Nghe Lén'          },
  bp_ham_phan_ung:     { cost: { hat_nhan: 2000,  ve_tinh: 1500, mat_ma: 1250      }, refinedCost: { t2: 32, t3: 12 }, passiveEPPerBreakMin: 18, label: 'Hầm Phản Ứng HN'  },
  // ── Kỷ 14: Thông Tin — ×2.5 ──
  bp_garage_startup:   { cost: { phan_mem: 750,   du_lieu: 500                     }, passiveEPPerBreakMin: 4,  label: 'Garage Startup'         },
  bp_trung_tam_du_lieu: { cost: { du_lieu: 1250,  bang_thong: 1000                 }, passiveEPPerBreakMin: 5,  label: 'Trung Tâm Dữ Liệu'     },
  bp_van_phong_tech:   { cost: { nguoi_dung: 1500, phan_mem: 1000                  }, passiveEPPerBreakMin: 6,  label: 'Văn Phòng Công Nghệ'   },
  bp_mang_luoi_cdn:    { cost: { bang_thong: 2000, du_lieu: 1500                   }, passiveEPPerBreakMin: 8,  label: 'Mạng Lưới CDN'         },
  bp_campus_cong_nghe: { cost: { nguoi_dung: 2250, phan_mem: 1750, bang_thong: 1250 }, refinedCost: { t2: 35, t3: 14 }, passiveEPPerBreakMin: 20, label: 'Campus Công Nghệ' },
  // ── Kỷ 15: Trí Tuệ Nhân Tạo — ×2.5 ──
  bp_phong_lab_ai:     { cost: { mo_hinh: 800,    du_lieu_hl: 600                  }, passiveEPPerBreakMin: 5,  label: 'Phòng Lab AI'           },
  bp_cum_may_chu_ai:   { cost: { gpu: 1250,        du_lieu_hl: 1000                }, passiveEPPerBreakMin: 6,  label: 'Cụm Máy Chủ AI'        },
  bp_vien_nghien_cuu_ai: { cost: { mo_hinh: 1750, giai_thuat: 1250                 }, passiveEPPerBreakMin: 8,  label: 'Viện Nghiên Cứu AI'    },
  bp_nen_tang_ai:      { cost: { giai_thuat: 1500, gpu: 1200                       }, passiveEPPerBreakMin: 10, label: 'Nền Tảng AI'          },
  bp_the_ky_moi:       { cost: { gpu: 2500, mo_hinh: 2000, giai_thuat: 1750, du_lieu_hl: 1500 }, refinedCost: { t2: 40, t3: 18 }, passiveEPPerBreakMin: 25, label: 'Thế Kỷ Mới' },
};

// ─── STAKING / ENERGY OVERCLOCK ──────────────────────────────────────────────
export const OVERCLOCK_REWARD_MULTIPLIER = 1.5;   // +50% cho phiên ≥45 phút
export const OVERCLOCK_BONUS_REDUCED     = 1.25;  // +25% cho phiên 25–44 phút
export const OVERCLOCK_MIN_SESSION_MIN   = 25;    // bắt đầu từ 25 phút (trước: 45)
export const OVERCLOCK_MIN_FULL_SESSION  = 45;    // full +50% chỉ từ 45 phút trở lên
export const OVERCLOCK_EP_COST_RATE      = 0.05;  // đặt cược 5% EP hiện tại

// ─── PRESTIGE / NEW GAME+ ─────────────────────────────────────────────────────
export const PRESTIGE_EP_REQUIREMENT  = ERA_THRESHOLDS.ERA_15_END;
export const PRESTIGE_BONUS_PER_RUN   = 0.05;      // +5% all stats per prestige
export const PRESTIGE_MAX_STACKS      = 10;        // tối đa 10 lần (+50%)

// Guardrail cho XP: legal max trong flow hiện tại thấp hơn mốc này,
// nên cap chỉ chặn state bẩn hoặc stack ngoài thiết kế.
export const XP_FACTOR_HARD_CAP       = 4.25;
// Guardrail cho EP: chặn runaway endgame khi user prestige nhiều cycle.
// Realistic max ≈ 2.2; cap 2.5 cho headroom đặc biệt.
export const EP_FACTOR_HARD_CAP       = 2.5;

// ═══════════════════════════════════════════════════════════════════════════════
// BẢN CẬP NHẬT CỘNG HƯỞNG (Resonance Update)
// Liên kết Kỹ năng ↔ Nhiệm vụ ↔ Kho báu thành một vòng lặp — KHÔNG lạm phát.
// Mọi buff vẫn nằm trong pool cộng + trần cứng cũ; phần này chỉ thêm tiền tệ thay
// thế (Tinh Thể), cổng giảm giá SP, "Dồn Lực" (gộp trump) và softcap chống phình.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── A. TINH THỂ CỘNG HƯỞNG (TTCH) — tiền tệ chỉ-để-thay-thế ────────────────
// KHÔNG bao giờ được đọc trong calculateRewards (bất biến grep-được).
export const TTCH_PER_DAILY_SWEEP        = 2;    // hoàn tất toàn bộ nhiệm vụ ngày
export const TTCH_PER_CHAIN_STEP         = 1;    // mỗi bước chuỗi tuần (không phải bước cuối)
export const TTCH_PER_CHAIN_FINALE       = 3;    // bước cuối chuỗi tuần
export const TTCH_PER_STREAK_MISSION     = 1;    // khi nhận thưởng nhiệm vụ streak
export const TINH_THE_HARD_CAP           = 12;   // tồn kho TTCH tối đa
export const TTCH_PER_REFINED            = 2;    // 2 TTCH thay 1 đơn vị tinh luyện (t2-quy đổi)
export const TTCH_RELIC_SUBSIDY_CAP_PCT  = 0.50; // TTCH gánh tối đa 50% chi phí tiến hóa cổ vật
// (Dự trữ — chưa wire) ý tưởng trả-trước-charge bằng TTCH; bỏ để giữ thiết kế tinh gọn.
export const TTCH_PER_CHARGE_SUB         = 6;
export const TRUMP_TT_BUYS_PER_DAY       = 1;

// ─── B. CỘNG HƯỞNG CỔ VẬT ↔ KỸ NĂNG — cổng giảm giá SP (không thêm %) ─────────
// Sở hữu cổ vật đúng kỷ ở bậc ≥ RESONANCE_HALF_STAGE → giảm nửa giá SP của skill
// elite cùng nhánh. Giá luôn suy ra từ spCost truyền vào (không hard-code).
export const RELIC_ELITE_RESONANCE = {
  THIEN_DINH: { relicId: 'mam_song_bat_diet',  elite: 'sieu_tap_trung'   },
  Y_CHI:      { relicId: 'ngon_duoc_khai_sang', elite: 'ben_vung'         },
  NGHI_NGOI:  { relicId: 'la_chan_phong_kien',  elite: 'nhip_hoan_hao'    },
  VAN_MAY:    { relicId: 'xuc_xac_ky_vong',     elite: 'so_do'            },
  CHIEN_LUOC: { relicId: 'la_ban_da_vinci',     elite: 'ke_hoach_hoan_hao' },
  THANG_HOA:  { relicId: 'loi_tri_tue',         elite: 'sieu_viet'        },
};
export const RESONANCE_HALF_STAGE   = 1;    // bậc cổ vật "Tiến Hóa" (index 1) trở lên
export const RESONANCE_SP_DISCOUNT  = 0.5;  // hệ số nhân giá SP khi cộng hưởng (22→11)

// ─── C. DỒN LỰC — gộp trump: tối đa 1 nhân-sau-trần mỗi phiên ─────────────────
// Thứ tự ưu tiên mặc định khi nhiều trump cùng kích hoạt (bùng nổ XP cao nhất trước).
export const DON_LUC_PRIORITY = ['so_do', 'sieu_tap_trung', 'jackpot'];

// ─── D. SOFTCAP CHỐNG PHÌNH (no-op trên mọi build hiện tại) ───────────────────
// D1: softcap XP% TỪNG NHÁNH. Knee đặt TRÊN tổng max thật của nhánh mạnh nhất
// (THIEN_DINH = 0.05+0.08+0.08+0.15 = 0.36) nên hôm nay là no-op tuyệt đối.
export const BRANCH_XP_SOFTCAP_KNEE = 0.40; // XP% mỗi nhánh tính đủ tới mốc này
export const BRANCH_XP_DR_RATE      = 0.5;  // phần vượt mốc chỉ tính 50%
// D2: softcap theo TỪNG loại buff cổ vật, đặt trên tổng Huyền Thoại thật (có chừa
// headroom cho seed từ rank passive). Math.min trên TỔNG đã cộng — no-op hiện tại.
export const RELIC_RESOURCE_BONUS_CAP    = 2.20; // tổng relic 1.88 + seed rank ~0.25
export const RELIC_GACHA_BONUS_CAP       = 70;   // tổng relic 65
export const RELIC_PITY_SEAL_CAP         = 35;   // tổng relic 32
export const RELIC_DISASTER_REDUCTION_CAP = 0.55; // tổng relic 0.52
export const RELIC_COMBO_WINDOW_CAP_HOURS = 28;   // tổng relic Huyền Thoại 26h (ADR-069 đưa 3 di vật «che chở» sang trục combo:
                                                   // 3+3+4 cộng 3+5+8 sẵn có). Vẫn là LƯỚI AN TOÀN, không cắn loadout thật —
                                                   // `challengeEngine.test.js` khoá luật ấy cho mọi trần ở đây.
// ADR-069: hai trục mới của di vật. Lưới an toàn (Math.min trên tổng) như các trần trên: tổng Huyền
// Thoại của 6 di vật EP = 1,06 + bậc tối đa 0,25 ⇒ 1,40 · 4 di vật XP = 0,65 + bậc tối đa 0,15 ⇒ 0,90.
export const RELIC_EP_BONUS_CAP          = 1.40;
export const RELIC_EXP_BONUS_CAP         = 0.90;

// ─── PARTICLE RAIN THRESHOLD ─────────────────────────────────────────────────
export const PARTICLE_RAIN_EP_THRESHOLD = 50;      // show particles if finalEP >= this

// ─── RESOURCE ID → BOOK NUMBER LOOKUP ────────────────────────────────────────
const BASE_RESOURCE_BOOK_LOOKUP = Object.fromEntries(
  Object.entries(ERA_METADATA).flatMap(([eraNum, meta]) =>
    (meta.resources ?? []).map((r) => [r.id, Number(eraNum)])
  )
);

export const RESOURCE_BOOK_LOOKUP = {
  ...BASE_RESOURCE_BOOK_LOOKUP,
  ...Object.fromEntries(
    Object.entries(RAW_RESOURCE_ALIASES).map(([legacyId, canonicalId]) => [
      legacyId,
      BASE_RESOURCE_BOOK_LOOKUP[canonicalId] ?? 1,
    ])
  ),
};

// ─── BLUEPRINT ID → ERA NUMBER LOOKUP ────────────────────────────────────────
export const BLUEPRINT_ERA_LOOKUP = Object.fromEntries(
  Object.entries(BLUEPRINT_CATALOG).flatMap(([eraNum, bps]) =>
    bps.map((bp) => [bp.id, Number(eraNum)])
  )
);

// ─── MAP ID KỸ NĂNG CŨ → MỚI (để giữ tương thích với store đã persist) ───────
// Dùng trong quá trình merge hydration của Zustand
export const SKILL_ID_MAP = {
  // Tên mới → (giữ nguyên trong store, chỉ đổi nhãn hiển thị)
  lam_nong_nhanh:    'lam_nong_nhanh',
  hit_tho_sau:       'hit_tho_sau',
  su_tha_thu:        'su_tha_thu',
  luoi_ria_ben:      'luoi_ria_ben',
  kien_truc_su:      'kien_truc_su',
  kho_du_tru:        'kho_du_tru',
  ban_tay_vang:      'ban_tay_vang',
  be_cong_thoi_gian: 'be_cong_thoi_gian',
  dai_trung_thuong:  'dai_trung_thuong',
};

// ─── HỆ THỐNG COMBO / MOMENTUM ───────────────────────────────────────────────
// Hoàn thành nhiều phiên liên tiếp (dưới COMBO_DECAY_MS) → bonus XP tăng dần.
export const COMBO_BONUS_PER_STACK = 0.03;         // +3% XP mỗi stack
export const COMBO_MAX_STACKS      = 4;            // tối đa 4 stacks = +12%
export const COMBO_DECAY_MS        = 4 * 3_600_000; // 4 giờ giữa các phiên

// ─── SỰ KIỆN TÍCH CỰC NGẪU NHIÊN ────────────────────────────────────────────
// Khi kết thúc phiên đủ dài, một sự kiện ngẫu nhiên có thể kích hoạt → bonus XP.
export const POSITIVE_EVENT_XP_SCALE = 0.55;
// ─── VIÊN GẠCH MAY MẮN (ADR-080) ───────────────────────
// Sometimes a session lays TWO bricks. On the session axis only (no currency), never negative, no
// countdown to the next one: "bình thường" or "hôm nay may". Rolled with the injected dice in
// `assembleSessionReward`; ~1 session in 8, only for sessions long enough to be a real brick.
export const LUCKY_BRICK_CHANCE = 0.12;
export const LUCKY_BRICK_MIN_MINUTES = 15;
// ADR-081: a lucky double brick on a 2-session project would finish it on the spot and rob the
// «công trình hoàn thành» moment of its build-up. Small projects are never doubled.
export const LUCKY_BRICK_MIN_PROJECT_SESSIONS = 3;
// ─── THỢ ĐÊM (ADR-081) ─────────────────────────────────
// The third surprise, and it lands at the OPEN of a day: sometimes the scaffold moved overnight.
// One brick, never enough to finish a building (that ending belongs to a session), never negative.
export const NIGHT_BUILDER_CHANCE = 0.16;
export const POSITIVE_EVENTS = [
  { id: 'momentum',    label: 'Đà Tốt',                icon: '🚀', desc: 'Mọi thứ theo quán tính tốt.',            bonusPct: 0.15, minMinutes: 10, chance: 0.18 },
  { id: 'breakthrough',label: 'Đột Phá!',              icon: '💡', desc: 'Khoảnh khắc hiểu sâu bất ngờ.',          bonusPct: 0.25, minMinutes: 20, chance: 0.12 },
  { id: 'zen_master',  label: 'Thiền Định Tuyệt Đỉnh', icon: '🧘', desc: 'Tâm trí hoàn toàn trong sáng.',         bonusPct: 0.15, minMinutes: 30, chance: 0.14 },
  { id: 'deep_flow',   label: 'Trạng Thái Flow',        icon: '🌊', desc: 'Tập trung tuyệt vời, mọi thứ suôn sẻ.', bonusPct: 0.20, minMinutes: 25, chance: 0.10 },
  { id: 'inspiration', label: 'Nguồn Cảm Hứng',         icon: '✨', desc: 'Ý tưởng sáng tạo ập đến.',              bonusPct: 0.30, minMinutes: 15, chance: 0.08 },
  { id: 'lucky_star',  label: 'Sao May Mắn',            icon: '⭐', desc: 'Vận may đang về phía bạn!',             bonusPct: 0.35, minMinutes: 25, chance: 0.05 },
];

// ─── SỰ KIỆN MINI THEO KỶ NGUYÊN ─────────────────────────────────────────────
// Mỗi kỷ có 2-3 mini-event đặc trưng (ưu tiên hơn POSITIVE_EVENTS generic).
export const ERA_MINI_EVENTS = {
  1:  [ // Kỷ Đá Cũ
    { id: 'e1_flint',   label: 'Mạch Đá Silex!',         icon: '🪨', desc: 'Tìm thấy mạch đá silex dồi dào.',        bonusPct: 0.20, minMinutes: 10, chance: 0.25 },
    { id: 'e1_hunt',    label: 'Cuộc Săn Thành Công',     icon: '🦣', desc: 'Đàn thú lớn bị bắt về.',               bonusPct: 0.28, minMinutes: 20, chance: 0.15 },
    { id: 'e1_fire',    label: 'Nắm Vững Lửa',            icon: '🔥', desc: 'Kỹ thuật nhóm lửa được cải thiện.',    bonusPct: 0.35, minMinutes: 30, chance: 0.07 },
  ],
  2:  [ // Thời Đại Đồ Đồng
    { id: 'e2_harvest', label: 'Mùa Thu Hoạch Bội Thu',   icon: '🌾', desc: 'Cánh đồng cho thu hoạch vượt mong đợi.', bonusPct: 0.20, minMinutes: 10, chance: 0.25 },
    { id: 'e2_trade',   label: 'Tuyến Thương Mại Mới',    icon: '🤝', desc: 'Thương nhân mang hàng hóa từ xa.',       bonusPct: 0.30, minMinutes: 20, chance: 0.12 },
    { id: 'e2_rite',    label: 'Nghi Lễ Mùa Xuân',        icon: '🌸', desc: 'Nghi lễ tế thần mang lại phúc lành.',   bonusPct: 0.25, minMinutes: 25, chance: 0.10 },
  ],
  3:  [ // Thời Đại Đồ Sắt
    { id: 'e3_forge',   label: 'Lò Rèn Hoàn Hảo',        icon: '⚒️', desc: 'Kim loại luyện ra sắc bén bất thường.',  bonusPct: 0.22, minMinutes: 10, chance: 0.25 },
    { id: 'e3_mine',    label: 'Mỏ Quặng Mới',            icon: '⛏️', desc: 'Khám phá mỏ quặng phong phú.',          bonusPct: 0.30, minMinutes: 20, chance: 0.12 },
    { id: 'e3_alloy',   label: 'Hợp Kim Bí Ẩn',           icon: '🔩', desc: 'Phương pháp luyện kim độc đáo.',         bonusPct: 0.38, minMinutes: 30, chance: 0.07 },
  ],
  4:  [ // Cổ Đại
    { id: 'e4_scroll',  label: 'Cuộn Sách Cổ',            icon: '📜', desc: 'Tìm thấy tri thức của tiền nhân.',       bonusPct: 0.22, minMinutes: 10, chance: 0.25 },
    { id: 'e4_phil',    label: 'Triết Học Khai Sáng',      icon: '🏛️', desc: 'Nhận ra chân lý sâu sắc.',              bonusPct: 0.30, minMinutes: 25, chance: 0.12 },
    { id: 'e4_road',    label: 'Con Đường La Mã',          icon: '🛤️', desc: 'Kết nối tuyến đường mới.',              bonusPct: 0.35, minMinutes: 35, chance: 0.07 },
  ],
  5:  [ // Trung Cổ
    { id: 'e5_guild',   label: 'Phường Hội Thịnh Vượng',  icon: '⚔️', desc: 'Phường hội thợ thủ công thăng hoa.',    bonusPct: 0.20, minMinutes: 10, chance: 0.25 },
    { id: 'e5_knight',  label: 'Hiệp Sĩ Tuần Du',         icon: '🏰', desc: 'Hiệp sĩ mang tin tốt lành.',            bonusPct: 0.28, minMinutes: 20, chance: 0.14 },
    { id: 'e5_manor',   label: 'Lãnh Địa Phồn Thịnh',     icon: '🌄', desc: 'Lãnh địa phát triển mạnh mẽ.',          bonusPct: 0.35, minMinutes: 30, chance: 0.07 },
  ],
  6:  [ // Phục Hưng
    { id: 'e6_paint',   label: 'Kiệt Tác Ra Đời',         icon: '🎨', desc: 'Tác phẩm nghệ thuật vượt thời gian.',   bonusPct: 0.25, minMinutes: 15, chance: 0.22 },
    { id: 'e6_scope',   label: 'Kính Thiên Văn Mới',      icon: '🔭', desc: 'Phát hiện thiên thể bí ẩn.',            bonusPct: 0.32, minMinutes: 25, chance: 0.12 },
    { id: 'e6_press',   label: 'Máy In Lan Rộng',         icon: '📚', desc: 'Tri thức lan truyền khắp châu lục.',     bonusPct: 0.38, minMinutes: 35, chance: 0.07 },
  ],
  7:  [ // Thương Mại
    { id: 'e7_ship',    label: 'Tàu Thuyền Cập Bến',      icon: '⛵', desc: 'Hàng hóa quý giá từ phương xa.',        bonusPct: 0.22, minMinutes: 10, chance: 0.25 },
    { id: 'e7_route',   label: 'Tuyến Đường Tơ Lụa',      icon: '🗺️', desc: 'Mở thêm tuyến thương mại mới.',         bonusPct: 0.30, minMinutes: 20, chance: 0.13 },
    { id: 'e7_bank',    label: 'Ngân Hàng Lớn',           icon: '🏦', desc: 'Hệ thống tài chính vững mạnh.',         bonusPct: 0.38, minMinutes: 35, chance: 0.07 },
  ],
  8:  [ // Khai Sáng
    { id: 'e8_reason',  label: 'Lý Trí Thắng Lợi',       icon: '💡', desc: 'Tư duy khoa học đạt đỉnh cao.',         bonusPct: 0.22, minMinutes: 10, chance: 0.25 },
    { id: 'e8_salon',   label: 'Buổi Thảo Luận Salon',    icon: '🍷', desc: 'Tranh luận triết học mang lại insight.',  bonusPct: 0.30, minMinutes: 20, chance: 0.13 },
    { id: 'e8_lib',     label: 'Thư Viện Quốc Gia',       icon: '📖', desc: 'Kho tàng tri thức mở cửa.',             bonusPct: 0.40, minMinutes: 35, chance: 0.06 },
  ],
  9:  [ // Cách Mạng Công Nghiệp
    { id: 'e9_engine',  label: 'Động Cơ Hơi Nước',        icon: '🏭', desc: 'Hiệu suất nhà máy tăng vọt.',           bonusPct: 0.25, minMinutes: 10, chance: 0.24 },
    { id: 'e9_rail',    label: 'Đường Sắt Khai Trương',    icon: '🚂', desc: 'Vận chuyển hàng hóa nhanh hơn.',        bonusPct: 0.32, minMinutes: 20, chance: 0.13 },
    { id: 'e9_patent',  label: 'Bằng Sáng Chế Đột Phá',   icon: '⚙️', desc: 'Phát minh được công nhận chính thức.',  bonusPct: 0.40, minMinutes: 35, chance: 0.07 },
  ],
  10: [ // Hiện Đại
    { id: 'e10_elec',   label: 'Điện Khí Hóa',            icon: '⚡', desc: 'Nguồn điện chảy vào mọi ngóc ngách.',   bonusPct: 0.22, minMinutes: 10, chance: 0.25 },
    { id: 'e10_radio',  label: 'Sóng Phát Thanh',          icon: '📻', desc: 'Thông tin lan truyền trong nháy mắt.',  bonusPct: 0.30, minMinutes: 20, chance: 0.13 },
    { id: 'e10_aero',   label: 'Hàng Không Khai Phá',      icon: '✈️', desc: 'Chinh phục bầu trời lần đầu tiên.',    bonusPct: 0.40, minMinutes: 30, chance: 0.07 },
  ],
  11: [ // Chiến Tranh Thế Giới
    { id: 'e11_code',   label: 'Mật Mã Bị Bẻ',            icon: '🔐', desc: 'Thông điệp bí mật được giải mã.',       bonusPct: 0.28, minMinutes: 15, chance: 0.22 },
    { id: 'e11_medic',  label: 'Đội Y Tế Xuất Sắc',        icon: '🏥', desc: 'Cứu chữa thần kỳ giữa chiến trường.',  bonusPct: 0.35, minMinutes: 25, chance: 0.12 },
    { id: 'e11_hero',   label: 'Anh Hùng Chiến Trường',    icon: '🎖️', desc: 'Hành động dũng cảm được ghi nhận.',     bonusPct: 0.42, minMinutes: 35, chance: 0.07 },
  ],
  12: [ // Chiến Tranh Lạnh
    { id: 'e12_space',  label: 'Phóng Vệ Tinh',            icon: '🛰️', desc: 'Công nghệ không gian đột phá.',         bonusPct: 0.28, minMinutes: 15, chance: 0.22 },
    { id: 'e12_nuke',   label: 'Phòng Thủ Hạt Nhân',       icon: '☢️', desc: 'Chiến lược ngăn chặn thành công.',      bonusPct: 0.35, minMinutes: 25, chance: 0.12 },
    { id: 'e12_intel',  label: 'Tình Báo Chiến Lược',       icon: '🕵️', desc: 'Thông tin tình báo quý giá thu được.',  bonusPct: 0.42, minMinutes: 35, chance: 0.07 },
  ],
  13: [ // Kỷ Nguyên Số
    { id: 'e13_algo',   label: 'Thuật Toán Tuyệt Vời',     icon: '💻', desc: 'Đoạn code chạy nhanh hơn 10x.',        bonusPct: 0.25, minMinutes: 10, chance: 0.24 },
    { id: 'e13_viral',  label: 'Viral Toàn Cầu',           icon: '📱', desc: 'Nội dung lan truyền khắp internet.',    bonusPct: 0.32, minMinutes: 20, chance: 0.13 },
    { id: 'e13_ai',     label: 'AI Đột Phá',               icon: '🤖', desc: 'Mô hình AI vượt giới hạn.',             bonusPct: 0.40, minMinutes: 30, chance: 0.07 },
  ],
  14: [ // Kỷ Nguyên Sinh Học
    { id: 'e14_gene',   label: 'Giải Mã Gene',             icon: '🧬', desc: 'Chuỗi DNA bí ẩn được giải mã.',        bonusPct: 0.28, minMinutes: 15, chance: 0.22 },
    { id: 'e14_nano',   label: 'Nano Robot Hoạt Động',      icon: '🔬', desc: 'Robot phân tử thực hiện nhiệm vụ.',    bonusPct: 0.35, minMinutes: 25, chance: 0.12 },
    { id: 'e14_cure',   label: 'Phương Thuốc Thần Kỳ',     icon: '💊', desc: 'Bệnh nan y được chinh phục.',           bonusPct: 0.45, minMinutes: 35, chance: 0.06 },
  ],
  15: [ // Tương Lai
    { id: 'e15_sync',   label: 'Đồng Bộ Tâm Trí',         icon: '🧠', desc: 'Kết nối thần kinh hoàn hảo.',           bonusPct: 0.30, minMinutes: 15, chance: 0.22 },
    { id: 'e15_warp',   label: 'Bẻ Cong Không-Thời Gian', icon: '🌌', desc: 'Năng lượng tối được khai thác.',         bonusPct: 0.40, minMinutes: 25, chance: 0.11 },
    { id: 'e15_sing',   label: 'Điểm Kỳ Dị',              icon: '🤖', desc: 'Trí tuệ nhân tạo vượt qua con người.',  bonusPct: 0.50, minMinutes: 40, chance: 0.06 },
  ],
};

// ─── TỔ HỢP KỸ NĂNG V2 (Skill Synergy) ──────────────────────────────────────
// Mọi synergy đều length-gated: chỉ kích hoạt cho phiên đủ ngưỡng (minLengthMin).
// Phiên 25' (tối thiểu) không nhận buff từ synergy.
export const SKILL_SYNERGIES = [
  {
    id:      'hanh_gia',
    label:   'Hành Giả',
    icon:    '🧘',
    desc:    '≥3 skill Thiền Định: phiên ≥30\' nhận +3% XP.',
    bonus:   0.03,
    minLengthMin: 30,
    requires: { THIEN_DINH: 3 },
  },
  {
    id:      'nguoi_ben',
    label:   'Người Bền',
    icon:    '⚔️',
    desc:    '≥3 skill Ý Chí: phiên ≥30\' nhận +5% XP.',
    bonus:   0.05,
    minLengthMin: 30,
    requires: { Y_CHI: 3 },
  },
  {
    id:      'nguoi_nhip_deu',
    label:   'Người Nhịp Đều',
    icon:    '☕',
    desc:    '≥3 skill Nghỉ Ngơi: phiên ≥30\' nhận +5% XP.',
    bonus:   0.05,
    minLengthMin: 30,
    requires: { NGHI_NGOI: 3 },
  },
  {
    id:      'tay_vang',
    label:   'Tay Vàng',
    icon:    '🎲',
    desc:    '≥3 skill Vận May: phiên ≥45\' nhận +5% XP.',
    bonus:   0.05,
    minLengthMin: 45,
    requires: { VAN_MAY: 3 },
  },
  {
    id:      'quan_su',
    label:   'Quân Sư',
    icon:    '🗺️',
    desc:    '≥3 skill Chiến Lược: phiên ≥30\' nhận +5% XP.',
    bonus:   0.05,
    minLengthMin: 30,
    requires: { CHIEN_LUOC: 3 },
  },
  {
    id:      'tien_hoa',
    label:   'Tiến Hoá',
    icon:    '🌟',
    desc:    '≥3 skill Thăng Hoa: phiên ≥30\' nhận +5% XP.',
    bonus:   0.05,
    minLengthMin: 30,
    requires: { THANG_HOA: 3 },
  },
  {
    id:      'bac_thay_van_nang',
    label:   'Bậc Thầy Vạn Năng',
    icon:    '👑',
    desc:    '≥4 nhánh có ≥3 skill: phiên ≥30\' nhận +8% XP.',
    bonus:   0.08,
    minLengthMin: 30,
    // Đặc biệt: yêu cầu count branches qualified, không phải single requires
    requiresBranchCount: { branchCount: 4, branchMinSkills: 3 },
  },
];

// ─── DANH MỤC PHIÊN (Session Categories) ─────────────────────────────────────
// Người chơi gán nhãn mỗi phiên thuộc loại gì để thống kê chi tiết hơn.
export const DEFAULT_SESSION_CATEGORIES = [
  { id: 'cat_hoc_dh',    label: 'Học Đại Học', color: '#f59e0b', icon: '🎓' },
  { id: 'cat_tu_hoc',    label: 'Tự Học',       color: '#6366f1', icon: '📚' },
  { id: 'cat_lam_viec',  label: 'Làm Việc',     color: '#22c55e', icon: '💼' },
  { id: 'cat_doc_sach',  label: 'Đọc Sách',     color: '#06b6d4', icon: '📖' },
  { id: 'cat_luyen_tap', label: 'Luyện Tập',    color: '#ec4899', icon: '🏃' },
  { id: 'cat_khac',      label: 'Khác',          color: '#94a3b8', icon: '✨' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HỆ THỐNG NGHIÊN CỨU, NGUYÊN LIỆU TINH LUYỆN & CÔNG TRÌNH (MỚI)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CHI PHÍ NÂNG CẤP CÔNG TRÌNH THEO KỶ NGUYÊN ─────────────────────────────
// Cấp 1→2 dùng refined base; Cấp 2→3 gộp cả phần T3 cũ vào cùng loại refined.
export const UPGRADE_COSTS_BY_ERA = {
  1:  { t2: 5,  t3: 1 },
  2:  { t2: 6,  t3: 1 },
  3:  { t2: 7,  t3: 2 },
  4:  { t2: 8,  t3: 2 },
  5:  { t2: 9,  t3: 2 },
  6:  { t2: 10, t3: 2 },
  7:  { t2: 11, t3: 3 },
  8:  { t2: 12, t3: 3 },
  9:  { t2: 13, t3: 3 },
  10: { t2: 14, t3: 3 },
  11: { t2: 15, t3: 4 },
  12: { t2: 16, t3: 4 },
  13: { t2: 17, t3: 5 },
  14: { t2: 18, t3: 5 },
  15: { t2: 20, t3: 5 },
};

export function getUnifiedRefinedCost(refinedCost = {}) {
  return Math.max(0, (refinedCost.t2 ?? 0) + (refinedCost.t3 ?? 0) * T3_REFINED_EQUIVALENT);
}

export function normalizeRefinedBag(refined = {}) {
  return {
    t2: Math.max(0, Math.round((refined.t2 ?? 0) + (refined.t3 ?? 0) * T3_REFINED_EQUIVALENT)),
    t3: 0,
  };
}

export function spendUnifiedRefined(refined = {}, cost = 0) {
  const normalized = normalizeRefinedBag(refined);
  return { t2: Math.max(0, normalized.t2 - cost), t3: 0 };
}

export function getUpgradeRefinedCost(era, currentLevel = 1) {
  const costs = UPGRADE_COSTS_BY_ERA[era] ?? { t2: 10, t3: 5 };
  return currentLevel <= 1
    ? (costs.t2 ?? 0)
    : Math.max(0, (costs.t2 ?? 0) + (costs.t3 ?? 0) * T3_REFINED_EQUIVALENT);
}


// ─── TÊN NGUYÊN LIỆU TINH LUYỆN THEO KỶ NGUYÊN ───────────────────────────────
export const ERA_REFINED = {
  1:  { t2Label: 'Đá Mài Bóng',         t2Icon: '🪨', t3Label: 'Đá Nghi Lễ',           t3Icon: '💠' },
  2:  { t2Label: 'Đất Nung Đỏ',         t2Icon: '🏺', t3Label: 'Sứ Cổ Điển',            t3Icon: '🫙' },
  3:  { t2Label: 'Đồng Tinh Luyện',     t2Icon: '🟤', t3Label: 'Hợp Kim Cổ Đại',        t3Icon: '⚜️' },
  4:  { t2Label: 'Thép Rèn Thủ Công',   t2Icon: '⚙️', t3Label: 'Thép Hoàng Gia',        t3Icon: '🛡️' },
  5:  { t2Label: 'Giấy Da Thuộc',       t2Icon: '📜', t3Label: 'Bản Thảo Chiếu Bí',     t3Icon: '📿' },
  6:  { t2Label: 'Lụa Dệt Thủ Công',    t2Icon: '🎋', t3Label: 'Gấm Hoàng Cung',        t3Icon: '👘' },
  7:  { t2Label: 'Đá Hoa Cương Đánh Bóng', t2Icon: '🏛️', t3Label: 'Cẩm Thạch Hoàng Gia', t3Icon: '🗿' },
  8:  { t2Label: 'Hàng Hóa Tinh Chế',   t2Icon: '⚓', t3Label: 'Hàng Xa Xỉ Phẩm',      t3Icon: '💎' },
  9:  { t2Label: 'Sách In Bìa Cứng',    t2Icon: '📰', t3Label: 'Tác Phẩm Kinh Điển',    t3Icon: '📙' },
  10: { t2Label: 'Thép Công Nghiệp',    t2Icon: '🔩', t3Label: 'Hợp Kim Đặc Chủng',     t3Icon: '🔬' },
  11: { t2Label: 'Trái Phiếu Đế Quốc',  t2Icon: '📈', t3Label: 'Vàng Thỏi Dự Trữ',     t3Icon: '🏦' },
  12: { t2Label: 'Vũ Khí Cải Tiến',     t2Icon: '💣', t3Label: 'Công Nghệ Chiến Tranh',  t3Icon: '☢️' },
  13: { t2Label: 'Dữ Liệu Mật Mã',      t2Icon: '🔐', t3Label: 'Tài Liệu Tuyệt Mật',    t3Icon: '🕵️' },
  14: { t2Label: 'Phần Mềm Cấp Doanh Nghiệp', t2Icon: '💿', t3Label: 'API Độc Quyền',   t3Icon: '🔑' },
  15: { t2Label: 'Mô Hình AI Đã Huấn Luyện', t2Icon: '🤖', t3Label: 'AI Tổng Quát (AGI)', t3Icon: '🧠' },
};

// ─── HIỆU ỨNG KỲ QUAN (15 kỷ nguyên) ────────────────────────────────────────
/**
 * ⚠️ ADR-070 (2026-09-06): MỌI ĐẶC QUYỀN KỲ QUAN NẰM TRÊN TRỤC SỐNG. Trước đó 11/15 kỳ quan thưởng lên
 * tài nguyên / RP / tinh luyện / giảm thảm hoạ — bốn thứ đã rời đường chơi từ ADR-069 — tức công trình
 * đắt nhất mỗi kỷ trao một tấm nhãn không có hiệu ứng nhìn thấy được. Nay:
 *   · `passive` = buff cộng thẳng vào phần thưởng phiên, đọc qua `wonderPassiveBuffs()` ở
 *     `engine/wonderEffects.js`: `expBonus` · `epBonus` · `comboWindowHours` · `flatXp` (kèm `minMinutes`).
 *   · Bốn đặc quyền có luật riêng GIỮ id cũ: `longer_crisis_window` (`crisisWindowHours`, cửa sổ thử
 *     thách kỷ dài thêm) · `streak_cap_plus` · `mission_bonus_20` · `relic_evo_30off` (`relicEvolveFactor`,
 *     di vật tiến hoá theo phiên nhanh hơn — xem `engine/relicGrowth.js`).
 * Nhãn/mô tả ở đây là thứ `BuildScreen` in dưới mỗi công trình đã xây: chúng PHẢI nói đúng thứ
 * `passive` làm (`rewardAxes.test.js` từ chối mọi mô tả còn nhắc tới đồng tiền đã ngủ).
 */
export const WONDER_EFFECT_REGISTRY = {
  xp_all_5:             { era: 1,  label: '+5% XP mọi phiên',              description: 'Mọi phiên tập trung nhận thêm 5% XP.',                                   passive: { expBonus: 0.05 } },
  xp_deep_10:           { era: 2,  label: '+10% XP phiên dài',             description: 'Phiên từ 45 phút nhận thêm 10% XP.',                                     passive: { expBonus: 0.10, minMinutes: 45 } },
  longer_crisis_window: { era: 3,  label: 'Thử thách kỷ rộng thêm 24 giờ', description: 'Cửa sổ đếm phiên của thử thách kỷ nguyên dài 72 giờ thay vì 48.',        crisisWindowHours: 24 },
  streak_cap_plus:      { era: 4,  label: 'Giới hạn chuỗi +10 ngày',       description: 'Tăng trần thưởng XP từ chuỗi ngày thêm 10 ngày.' },
  ep_all_10:            { era: 5,  label: '+10% EP mọi phiên',             description: 'Mọi phiên tập trung đẩy thêm 10% EP về phía kỷ mới.',                    passive: { epBonus: 0.10 } },
  combo_window_2h:      { era: 6,  label: 'Combo giữ thêm 2 giờ',          description: 'Chuỗi combo giữa hai phiên không tắt trong thêm 2 giờ.',                 passive: { comboWindowHours: 2 } },
  ep_all_8:             { era: 7,  label: '+8% EP mọi phiên',              description: 'Mọi phiên tập trung đẩy thêm 8% EP về phía kỷ mới.',                     passive: { epBonus: 0.08 } },
  xp_all_8:             { era: 8,  label: '+8% XP mọi phiên',              description: 'Mọi phiên tập trung nhận thêm 8% XP.',                                   passive: { expBonus: 0.08 } },
  mission_bonus_20:     { era: 9,  label: '+20% XP từ nhiệm vụ hàng ngày', description: 'Tăng 20% phần thưởng XP từ tất cả nhiệm vụ hàng ngày.' },
  deep_session_xp_150:  { era: 10, label: 'Phiên sâu +150 XP',             description: 'Mỗi phiên từ 90 phút trở lên tặng thêm 150 XP.',                         passive: { flatXp: 150, minMinutes: 90 } },
  combo_window_3h:      { era: 11, label: 'Combo giữ thêm 3 giờ',          description: 'Chuỗi combo giữa hai phiên không tắt trong thêm 3 giờ.',                 passive: { comboWindowHours: 3 } },
  xp_all_10:            { era: 12, label: '+10% XP mọi phiên',             description: 'Mọi phiên tập trung nhận thêm 10% XP.',                                  passive: { expBonus: 0.10 } },
  ep_all_12:            { era: 13, label: '+12% EP mọi phiên',             description: 'Mọi phiên tập trung đẩy thêm 12% EP về phía kỷ mới.',                    passive: { epBonus: 0.12 } },
  xp_all_12:            { era: 14, label: '+12% XP mọi phiên',             description: 'Mọi phiên tập trung nhận thêm 12% XP.',                                  passive: { expBonus: 0.12 } },
  relic_evo_30off:      { era: 15, label: 'Di vật tiến hoá nhanh hơn 30%', description: 'Mọi di vật cần ít hơn 30% số phiên để lên bậc.',                         relicEvolveFactor: 0.7 },
};

export const BUILDING_PERK_REGISTRY = {
  craft_haste_first: {
    family: 'Tăng tốc',
    label: 'Đẩy nhanh xưởng',
    summary: 'Phiên từ 45 phút làm công trình đầu hàng đợi tiến thêm 1 bước.',
    effects: ['craft_haste_first'],
    minMinutes: 45,
  },
  craft_haste_all: {
    family: 'Tăng tốc',
    label: 'Cả xưởng tăng tốc',
    summary: 'Phiên từ 45 phút làm mọi công trình trong hàng đợi tiến thêm 1 bước.',
    effects: ['craft_haste_all'],
    minMinutes: 45,
  },
  daily_chest: {
    family: 'Rương thưởng',
    label: 'Rương phiên thứ 3',
    summary: 'Mỗi phiên thứ 3 trong ngày tặng 90 XP.',
    effects: ['daily_chest'],
    everySessions: 3,
    xp: 90,
  },
  deep_chest: {
    family: 'Rương thưởng',
    label: 'Rương phiên dài',
    summary: 'Phiên từ 60 phút tặng 140 XP.',
    effects: ['deep_chest'],
    minMinutes: 60,
    xp: 140,
  },
  // ADR-070: vế «hủy an toàn» (miễn phạt tài nguyên) đã bỏ — không còn phạt để mà miễn. Còn lại vế
  // sống: phiên bù sau khi hủy được thưởng, tức công trình «Bảo hiểm» nay là công trình «Phục hồi».
  safety_net: {
    family: 'Phục hồi',
    label: 'Phiên bù sau khi hủy',
    summary: 'Sau khi hủy một phiên, phiên kế từ 15 phút tặng 80 XP.',
    effects: ['recovery_bonus'],
    minMinutes: 15,
    xp: 80,
  },
  same_category_combo: {
    family: 'Combo',
    label: 'Chuỗi cùng chủ đề',
    summary: 'Từ phiên thứ 3 liên tiếp cùng danh mục, nhận thêm 120 XP.',
    effects: ['same_category_combo'],
    minStreak: 3,
    xp: 120,
  },
  variety_day: {
    family: 'Combo',
    label: 'Ngày đa dạng',
    summary: 'Khi dùng đủ 3 danh mục trong ngày, nhận 120 XP.',
    effects: ['variety_day'],
    requiredCategories: 3,
    xp: 120,
  },
};

// ─── NỘI BỘ: phân loại vai trò từng công trình ─────────────────────────────────
// [era, type, wonderEffectId?]
// type: 'infrastructure' | 'economy' | 'defense' | 'wonder'
const _BLDG_ROLES = {
  // ── Kỷ 1 ──────────────────────────────────────────────────────────────────
  bp_hang_dong:              [1,  'infrastructure'],
  bp_bep_lua:                [1,  'economy'],
  bp_cong_cu_da:             [1,  'infrastructure'],
  bp_trai_nguyen_thuy:       [1,  'defense'],
  bp_tho_pho_linh:           [1,  'wonder', 'xp_all_5'],
  // ── Kỷ 2 ──────────────────────────────────────────────────────────────────
  bp_lang_nong:              [2,  'infrastructure'],
  bp_lo_gom:                 [2,  'economy'],
  bp_kenh_tuoi:              [2,  'infrastructure'],
  bp_kho_lua:                [2,  'defense'],
  bp_den_tho_co:             [2,  'wonder', 'xp_deep_10'],
  // ── Kỷ 3 ──────────────────────────────────────────────────────────────────
  bp_lo_duc_dong:            [3,  'infrastructure'],
  bp_xuong_ren_co:           [3,  'economy'],
  bp_duong_thuong_co:        [3,  'infrastructure'],
  bp_thanh_co_dai:           [3,  'defense'],
  bp_ziggutat:               [3,  'wonder', 'longer_crisis_window'],
  // ── Kỷ 4 ──────────────────────────────────────────────────────────────────
  bp_trang_sat:              [4,  'infrastructure'],
  bp_chuong_ngua:            [4,  'economy'],
  bp_phao_dai_sat:           [4,  'defense'],
  bp_duong_to:               [4,  'infrastructure'],
  bp_cung_dien_co:           [4,  'wonder', 'streak_cap_plus'],
  // ── Kỷ 5 ──────────────────────────────────────────────────────────────────
  bp_tu_vien:                [5,  'infrastructure'],
  bp_benh_xa:                [5,  'economy'],
  bp_thap_canh:              [5,  'defense'],
  bp_nha_tho_lon:            [5,  'infrastructure'],
  bp_thu_vien_trung_co:      [5,  'wonder', 'ep_all_10'],
  // ── Kỷ 6 ──────────────────────────────────────────────────────────────────
  bp_lang_xa_viet:           [6,  'infrastructure'],
  bp_truong_thu:             [6,  'economy'],
  bp_quan_truong:            [6,  'defense'],
  bp_phu_quan:               [6,  'infrastructure'],
  bp_thanh_quan_viet:        [6,  'wonder', 'combo_window_2h'],
  // ── Kỷ 7 ──────────────────────────────────────────────────────────────────
  bp_xuong_hoa:              [7,  'economy'],
  bp_truong_dai_hoc:         [7,  'infrastructure'],
  bp_nha_bao_tang:           [7,  'economy'],
  bp_thu_vien_kh:            [7,  'infrastructure'],
  bp_cung_dien_ph:           [7,  'wonder', 'ep_all_8'],
  // ── Kỷ 8 ──────────────────────────────────────────────────────────────────
  bp_xuong_dong_tau:         [8,  'infrastructure'],
  bp_thuong_diem:            [8,  'economy'],
  bp_ngon_hai_dang:          [8,  'defense'],
  bp_kho_gia_vi:             [8,  'economy'],
  bp_cang_bien:              [8,  'wonder', 'xp_all_8'],
  // ── Kỷ 9 ──────────────────────────────────────────────────────────────────
  bp_quan_ca_phe:            [9,  'infrastructure'],
  bp_salon_tri_thuc:         [9,  'economy'],
  bp_nha_in:                 [9,  'infrastructure'],
  bp_vien_khoa_hoc:          [9,  'defense'],
  bp_quoc_hoi:               [9,  'wonder', 'mission_bonus_20'],
  // ── Kỷ 10 ─────────────────────────────────────────────────────────────────
  bp_xuong_co_khi:           [10, 'infrastructure'],
  bp_nha_may_lt:             [10, 'economy'],
  bp_duong_sat:              [10, 'infrastructure'],
  bp_ngan_hang:              [10, 'economy'],
  bp_tap_doan_cong:          [10, 'wonder', 'deep_session_xp_150'],
  // ── Kỷ 11 ─────────────────────────────────────────────────────────────────
  bp_san_chung_khoan:        [11, 'economy'],
  bp_cang_xuat_khau:         [11, 'infrastructure'],
  bp_ngan_hang_trung_uong:   [11, 'defense'],
  bp_toa_bao_tang_de_quoc:   [11, 'economy'],
  bp_tap_doan_doc_quyen:     [11, 'wonder', 'combo_window_3h'],
  // ── Kỷ 12 ─────────────────────────────────────────────────────────────────
  bp_can_cu_quan_su:         [12, 'infrastructure'],
  bp_xuong_vu_khi:           [12, 'economy'],
  bp_benh_vien_da_chien:     [12, 'infrastructure'],
  bp_trung_tam_chi_huy:      [12, 'defense'],
  bp_thanh_tri_chien:        [12, 'wonder', 'xp_all_10'],
  // ── Kỷ 13 ─────────────────────────────────────────────────────────────────
  bp_tram_tinh_bao:          [13, 'infrastructure'],
  bp_ham_ten_lua:            [13, 'defense'],
  bp_trung_tam_vu_tru:       [13, 'economy'],
  bp_dai_nghe_len:           [13, 'infrastructure'],
  bp_ham_phan_ung:           [13, 'wonder', 'ep_all_12'],
  // ── Kỷ 14 ─────────────────────────────────────────────────────────────────
  bp_garage_startup:         [14, 'economy'],
  bp_trung_tam_du_lieu:      [14, 'infrastructure'],
  bp_van_phong_tech:         [14, 'economy'],
  bp_mang_luoi_cdn:          [14, 'defense'],
  bp_campus_cong_nghe:       [14, 'wonder', 'xp_all_12'],
  // ── Kỷ 15 ─────────────────────────────────────────────────────────────────
  bp_phong_lab_ai:           [15, 'infrastructure'],
  bp_cum_may_chu_ai:         [15, 'economy'],
  bp_vien_nghien_cuu_ai:     [15, 'infrastructure'],
  bp_nen_tang_ai:            [15, 'defense'],
  bp_the_ky_moi:             [15, 'wonder', 'relic_evo_30off'],
};

// Nhóm kỷ nguyên: 1-5 = sơ khai, 6-10 = trung kỳ, 11-15 = hậu kỳ
function _eraGroup(era) { return era <= 5 ? 1 : era <= 10 ? 2 : 3; }
function _eraOffsetInGroup(era) { return era <= 5 ? era - 1 : era <= 10 ? era - 6 : era - 11; }

const _BLUEPRINT_RESEARCH_CURVE = {
  1: {
    common: { base: 240, step: 40 },
    rare:   { base: 460, step: 70 },
    epic:   { base: 980, step: 135 },
  },
  2: {
    common: { base: 500, step: 60 },
    rare:   { base: 900, step: 100 },
    epic:   { base: 1850, step: 185 },
  },
  3: {
    common: { base: 900, step: 80 },
    rare:   { base: 1550, step: 135 },
    epic:   { base: 3100, step: 270 },
  },
};

const _BUILD_SESSIONS_CURVE = {
  1: { common: 2, rare: 4, epic: 6 },
  2: { common: 4, rare: 6, epic: 9 },
  3: { common: 5, rare: 8, epic: 11 },
};

const _INFRASTRUCTURE_CURVE = {
  1: {
    common: { raw: 1, refined: 0 },
    rare:   { raw: 2, refined: 0 },
  },
  2: {
    common: { raw: 2, refined: 0.2 },
    rare:   { raw: 3, refined: 0.35 },
  },
  3: {
    common: { raw: 3, refined: 0.45 },
    rare:   { raw: 4, refined: 0.75 },
  },
};

const _ECONOMY_CURVE = {
  1: {
    common: { raw: 0.10, refined: 0 },
    rare:   { raw: 0.16, refined: 0 },
  },
  2: {
    common: { raw: 0.12, refined: 0.05 },
    rare:   { raw: 0.18, refined: 0.08 },
  },
  3: {
    common: { raw: 0.15, refined: 0.08 },
    rare:   { raw: 0.22, refined: 0.12 },
  },
};

const _DEFENSE_CURVE = {
  1: 0.07,
  2: 0.10,
  3: 0.13,
};

function _getBlueprintResearchCost(era, rarity = 'common') {
  const grp = _eraGroup(era);
  const curve = _BLUEPRINT_RESEARCH_CURVE[grp]?.[rarity] ?? _BLUEPRINT_RESEARCH_CURVE[grp]?.common;
  if (!curve) return 100;
  return curve.base + _eraOffsetInGroup(era) * curve.step;
}

function _getWonderBuildRefinedCost(era) {
  const grp = _eraGroup(era);
  const offset = _eraOffsetInGroup(era);
  if (grp === 1) return { t2: 4 + offset, t3: 1 };
  if (grp === 2) return { t2: 5 + offset, t3: 1 };
  return { t2: 6 + offset, t3: 2 };
}

function _getBuildingPerkId(era, type, rarity) {
  if (type === 'defense') return 'safety_net';
  if (type === 'infrastructure') {
    if (rarity === 'rare' && era >= 6) return 'craft_haste_all';
    if (rarity === 'rare') return 'same_category_combo';
    return 'craft_haste_first';
  }
  if (type === 'economy') {
    if (rarity === 'rare' && era % 2 === 1) return 'variety_day';
    if (rarity === 'rare') return 'deep_chest';
    return 'daily_chest';
  }
  return null;
}

function _makeBuildingPerk(era, type, rarity, wonderEffect) {
  if (type === 'wonder') {
    const wonder = WONDER_EFFECT_REGISTRY[wonderEffect];
    return {
      id: `wonder_${wonderEffect}`,
      family: 'Quyền đặc biệt',
      label: wonder?.label ?? 'Kỳ quan',
      summary: wonder?.description ?? 'Kỳ quan tạo một luật chơi đặc biệt.',
      effects: [`wonder:${wonderEffect}`],
      isWonder: true,
    };
  }

  const perkId = _getBuildingPerkId(era, type, rarity);
  const perk = BUILDING_PERK_REGISTRY[perkId];
  return perk ? { id: perkId, ...perk } : null;
}

for (const [bpId, roleArr] of Object.entries(_BLDG_ROLES)) {
  const [era, type] = roleArr;
  if (type === 'wonder' && BUILDING_SPECS[bpId]) {
    BUILDING_SPECS[bpId] = {
      ...BUILDING_SPECS[bpId],
      refinedCost: _getWonderBuildRefinedCost(era),
    };
  }
}

// Sinh BUILDING_EFFECTS và BLUEPRINT_META từ _BLDG_ROLES
const _bldEff = {};
const _bpMeta = {};

for (const [bpId, roleArr] of Object.entries(_BLDG_ROLES)) {
  const [era, type, wEffect] = roleArr;
  const grp = _eraGroup(era);
  const rarity = _BP_CATALOG_LOOKUP[bpId]?.rarity ?? (type === 'wonder' ? 'epic' : 'common');

  // ── HP tối đa (giữ lại để tương thích dữ liệu cũ) ─────────────────────────
  const maxHP = type === 'wonder'    ? 6 + grp * 2   // 8 / 10 / 12
              : type === 'defense'   ? 4 + grp        // 5 / 6  / 7
              : 2 + grp;                              // 3 / 4  / 5 (infra/eco)

  // ── Phiên xây dựng cần ────────────────────────────────────────────────────
  const sessionsToComplete = _BUILD_SESSIONS_CURVE[grp]?.[rarity] ?? grp;

  // ── Tài nguyên thụ động mỗi phút nghỉ (chỉ infrastructure) ────────────────
  const infraCurve = _INFRASTRUCTURE_CURVE[grp]?.[rarity] ?? _INFRASTRUCTURE_CURVE[grp]?.common;
  const passiveT1 = type === 'infrastructure' ? (infraCurve?.raw ?? 0) : 0;
  const passiveT2 = type === 'infrastructure' ? (infraCurve?.refined ?? 0) : 0;

  // ── Bonus phần thưởng phiên (chỉ economy) ─────────────────────────────────
  const economyCurve = _ECONOMY_CURVE[grp]?.[rarity] ?? _ECONOMY_CURVE[grp]?.common;
  const t1DropBonus = type === 'economy' ? (economyCurve?.raw ?? 0) : 0;
  const t2DropBonus = type === 'economy' ? (economyCurve?.refined ?? 0) : 0;

  // ── Giảm thất thoát khi hủy phiên (chỉ defense / "ổn định") ───────────────
  const cancelLossReductionPct = type === 'defense'
    ? (_DEFENSE_CURVE[grp] ?? 0.06)
    : 0;

  _bldEff[bpId] = {
    era, type, maxHP, sessionsToComplete,
    perk: _makeBuildingPerk(era, type, rarity, wEffect),
    ...(type === 'infrastructure' && {
      passiveT1PerBreakMin: passiveT1,
      passiveT2PerBreakMin: passiveT2,
    }),
    ...(type === 'economy' && { t1DropBonus, t2DropBonus }),
    ...(type === 'defense' && { cancelLossReductionPct }),
    ...(type === 'wonder'  && { wonderEffect: wEffect }),
  };

  // ── Chi phí RP để nghiên cứu ──────────────────────────────────────────────
  const rpCost = _getBlueprintResearchCost(era, rarity);

  _bpMeta[bpId] = {
    era,
    type,
    rarity,
    rpCost,
    requiresEra: era,
    sessionsToComplete,
  };
}

// ─── HIỆU ỨNG CÔNG TRÌNH (type, HP, passive resources, wonder effect) ─────────
// Không thay thế BUILDING_SPECS (vẫn dùng cho cost). Dùng thêm để track HP và tác động.
export const BUILDING_EFFECTS = _bldEff;

// ─── BẢN VẼ: META NGHIÊN CỨU ──────────────────────────────────────────────────
// rpCost: RP cần nghiên cứu | requiresEra: kỷ phải đạt | sessionsToComplete: thời gian xây
export const BLUEPRINT_META = _bpMeta;
