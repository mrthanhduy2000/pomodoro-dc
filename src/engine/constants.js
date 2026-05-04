/**
 * constants.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Nguồn sự thật duy nhất cho mọi hằng số, ngưỡng và danh mục trong CivJourney.
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
export const FORGIVENESS_CANCELS_PER_WEEK  = 2;
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

// === VẬN MAY (drops & resources) ===
export const BAN_TAY_VANG_RAW_CHANCE       = 0.15;  // mới — thay +RP
export const BAN_TAY_VANG_MIN_MINUTES      = 45;
export const NHAN_QUAN_REFINED_CHANCE      = 0.25;
export const NHAN_QUAN_MIN_MINUTES         = 45;
export const LINH_CAM_REFINED_CHANCE       = 0.40;
export const LINH_CAM_DOUBLE_CHANCE        = 0.08;  // mới — 8% double drop
export const LINH_CAM_MIN_MINUTES          = 45;
// Lộc Ban Tặng (mới — thay be_cong_thoi_gian)
export const LOC_BAN_TANG_SESSIONS_NEEDED  = 7;     // mỗi 7 phiên ≥30
export const LOC_BAN_TANG_MIN_MINUTES      = 30;
export const LOC_BAN_TANG_XP_REWARD        = 200;
export const LOC_BAN_TANG_REFINED_REWARD   = 1;
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
export const RANK_SYSTEM = {
  1: {
    bookLabel: 'Kỷ Đồ Đá Cũ',
    ranks: [
      { id: 'ke_lang_thang',     label: 'Kẻ Lang Thang',     icon: '🚶', passiveBuff: { expBonus: 0.05       }, buffLabel: '+5% XP',           challengeRequirement: null },
      { id: 'ke_song_sot',       label: 'Kẻ Sống Sót',       icon: '⛏️', passiveBuff: { resourceBonus: 0.10  }, buffLabel: '+10% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'tho_san_tap_su',    label: 'Thợ Săn Tập Sự',    icon: '🏹', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nguoi_giu_lua',     label: 'Người Giữ Lửa',     icon: '🔥', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
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
      { id: 'nong_dan_tap_su',   label: 'Nông Dân Tập Sự',    icon: '🌱', passiveBuff: { resourceBonus: 0.10  }, buffLabel: '+10% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'tho_gom',           label: 'Thợ Gốm',            icon: '🏺', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nguoi_khai_hoang',  label: 'Người Khai Hoang',   icon: '🌾', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
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
      { id: 'tho_luyen_kim',     label: 'Thợ Luyện Kim',       icon: '🔨', passiveBuff: { resourceBonus: 0.10  }, buffLabel: '+10% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'quan_ghi_chep',     label: 'Quan Ghi Chép',       icon: '📜', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'doc_cong',          label: 'Đốc Công',            icon: '🏗️', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
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
      { id: 'do_ba',             label: 'Đô Bá',               icon: '🐉', passiveBuff: { resourceBonus: 0.10  }, buffLabel: '+10% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'huyen_lenh',        label: 'Huyện Lệnh',          icon: '📋', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tran_tuong',        label: 'Trấn Tướng',          icon: '🏯', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
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
      { id: 'tu_si',             label: 'Tu Sĩ',                icon: '✝️', passiveBuff: { resourceBonus: 0.10  }, buffLabel: '+10% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'thay_lang',         label: 'Thầy Lang',            icon: '🌿', passiveBuff: { expBonus: 0.08       }, buffLabel: '+8% XP',           challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nguoi_gc_5',        label: 'Người Ghi Chép',       icon: '📖', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 25, windowHours: 48 } },
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
      { id: 'dan_binh',          label: 'Dân Binh',             icon: '🪖', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'hiep_khach',        label: 'Hiệp Khách',           icon: '🗡️', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tri_phu',           label: 'Tri Phủ',              icon: '🏛️', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'nghien_cuu_sinh',   label: 'Nghiên Cứu Sinh',       icon: '🔭', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'hoc_gia_7',         label: 'Học Giả',               icon: '🎓', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'bac_thay_nt',       label: 'Bậc Thầy Nghệ Thuật',  icon: '🎨', passiveBuff: { resourceBonus: 0.15  }, buffLabel: '+15% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'thuy_thu',          label: 'Thủy Thủ',              icon: '⚓', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'hoa_tieu',          label: 'Hoa Tiêu',              icon: '🧭', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'thuyen_truong',     label: 'Thuyền Trưởng',         icon: '🚢', passiveBuff: { resourceBonus: 0.15  }, buffLabel: '+15% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'khach_moi_salon',   label: 'Khách Mời Salon',       icon: '🎭', passiveBuff: { resourceBonus: 0.12  }, buffLabel: '+12% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'tac_gia_an_danh',   label: 'Tác Giả Ẩn Danh',      icon: '✍️', passiveBuff: { expBonus: 0.10       }, buffLabel: '+10% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'triet_gia',         label: 'Triết Gia',             icon: '🤔', passiveBuff: { resourceBonus: 0.15  }, buffLabel: '+15% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'chu_nha_may',       label: 'Chủ Nhà Máy',           icon: '🏭', passiveBuff: { resourceBonus: 0.15  }, buffLabel: '+15% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'nha_cong_nghiep',   label: 'Nhà Công Nghiệp',       icon: '⚙️', passiveBuff: { expBonus: 0.12       }, buffLabel: '+12% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'trum_cung_ung',     label: 'Trùm Cung Ứng',         icon: '🚂', passiveBuff: { resourceBonus: 0.18  }, buffLabel: '+18% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'chua_te_hang_hai',  label: 'Chúa Tể Hàng Hải',      icon: '⚓', passiveBuff: { resourceBonus: 0.16  }, buffLabel: '+16% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'ke_vat_kiet_td',    label: 'Kẻ Vắt Kiệt Thuộc Địa', icon: '🗺️', passiveBuff: { expBonus: 0.13       }, buffLabel: '+13% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tai_phiet_pho_wall',label: 'Tài Phiệt Phố Wall',     icon: '📈', passiveBuff: { resourceBonus: 0.20  }, buffLabel: '+20% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'lu_doan_truong',    label: 'Lữ Đoàn Trưởng',        icon: '🎖️', passiveBuff: { resourceBonus: 0.16  }, buffLabel: '+16% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'su_doan_truong',    label: 'Sư Đoàn Trưởng',        icon: '⚔️', passiveBuff: { expBonus: 0.13       }, buffLabel: '+13% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tu_lenh_quan_doan', label: 'Tư Lệnh Quân Đoàn',     icon: '🎌', passiveBuff: { resourceBonus: 0.20  }, buffLabel: '+20% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'truong_tram_tb',    label: 'Trưởng Trạm Tình Báo',  icon: '📡', passiveBuff: { resourceBonus: 0.18  }, buffLabel: '+18% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'gd_co_quan_tb',     label: 'Giám Đốc Cơ Quan TBáo', icon: '🔐', passiveBuff: { expBonus: 0.14       }, buffLabel: '+14% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'tu_lenh_cl',        label: 'Tư Lệnh Lực Lượng CL',  icon: '☢️', passiveBuff: { resourceBonus: 0.22  }, buffLabel: '+22% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'ky_su_he_thong',    label: 'Kỹ Sư Hệ Thống',        icon: '💻', passiveBuff: { resourceBonus: 0.18  }, buffLabel: '+18% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'kien_truc_truong',  label: 'Kiến Trúc Trưởng',       icon: '🏗️', passiveBuff: { expBonus: 0.14       }, buffLabel: '+14% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'sang_lap_startup',  label: 'Sáng Lập Startup',       icon: '🚀', passiveBuff: { resourceBonus: 0.22  }, buffLabel: '+22% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      { id: 'ky_su_ai',          label: 'Kỹ Sư Tích Hợp AI',      icon: '🤖', passiveBuff: { resourceBonus: 0.20  }, buffLabel: '+20% Tài Nguyên',  challengeRequirement: { sessions: 2, minMinutes: 25, windowHours: 48 } },
      { id: 'quan_tri_vien_tt',  label: 'Quản Trị Viên Thuật Toán',icon: '⚙️', passiveBuff: { expBonus: 0.15      }, buffLabel: '+15% XP',          challengeRequirement: { sessions: 2, minMinutes: 30, windowHours: 48 } },
      { id: 'nha_sang_lap_mh',   label: 'Nhà Sáng Lập Mô Hình',   icon: '🧠', passiveBuff: { resourceBonus: 0.25  }, buffLabel: '+25% Tài Nguyên',  challengeRequirement: { sessions: 3, minMinutes: 30, windowHours: 48 } },
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
      successRelic: { id: 'mam_song_bat_diet', label: 'Mầm Sống Bất Diệt', icon: '🌱', description: 'Di vật Kỷ Băng Hà — tăng tài nguyên rớt.', buff: { resourceBonus: 0.15 } } },
  },
  2: {
    id: 'han_han_co_dai', triggerEP: getEraCrisisTrigger(2),
    name: 'Hạn Hán Cổ Đại', icon: '☀️',
    description: 'Mùa màng thất bại, đất nứt nẻ. Nông nghiệp sơ khai đứng trước nạn đói diệt vong.',
    sacrificeOption:  { label: 'Nhịn Đói',  description: 'Hy sinh 40% tài nguyên cầu mưa.', resourceLoss: 0.40, icon: '🌾' },
    challengeOption:  { label: 'Khai Hoang', description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🌧️', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'phep_mau_mua_vu', label: 'Phép Màu Mùa Vụ', icon: '🌾', description: 'Di vật Hạn Hán Cổ Đại — tăng RP mỗi phiên.', buff: { gachaBonus: 5, pitySeal: 2 } } },
  },
  3: {
    id: 'sup_do_dong_thau', triggerEP: getEraCrisisTrigger(3),
    name: 'Sụp Đổ Đồ Đồng', icon: '⚒️',
    description: 'Các đế chế đồng thau sụp đổ bí ẩn. Văn minh bị kéo lùi hàng thế kỷ.',
    sacrificeOption:  { label: 'Rút Lui',   description: 'Hy sinh 40% tài nguyên bảo toàn lực lượng.', resourceLoss: 0.40, icon: '🏳️' },
    challengeOption:  { label: 'Trụ Vững',  description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🛡️', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'bua_ho_menh', label: 'Bùa Hộ Mệnh', icon: '🛡️', description: 'Di vật Đồng Thau — giảm mất mát khi thảm họa.', buff: { disasterReduction: 0.04 } } },
  },
  4: {
    id: 'chien_tranh_do_sat', triggerEP: getEraCrisisTrigger(4),
    name: 'Chiến Tranh Đồ Sắt', icon: '⚔️',
    description: 'Vương quốc sắt thép xung đột liên miên. Đất đai và tài nguyên bị tàn phá không ngừng.',
    sacrificeOption:  { label: 'Cống Nạp',  description: 'Hy sinh 40% tài nguyên đổi lấy hòa bình.', resourceLoss: 0.40, icon: '💰' },
    challengeOption:  { label: 'Chinh Phục', description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🗡️', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'luoi_kiem_sat_ben', label: 'Lưỡi Kiếm Sắt Bền', icon: '⚔️', description: 'Di vật Chiến Tranh Đồ Sắt — tăng tài nguyên rớt.', buff: { resourceBonus: 0.18 } } },
  },
  5: {
    id: 'dem_toi_trung_co', triggerEP: getEraCrisisTrigger(5),
    name: 'Đêm Tối Trung Cổ', icon: '🌑',
    description: 'Dịch hạch và chiến tranh tàn phá đế chế. Mọi thành tựu đứng trước bờ vực sụp đổ.',
    sacrificeOption:  { label: 'Nhượng Bộ', description: 'Hy sinh 40% tài nguyên cầu hòa với Bóng Tối.', resourceLoss: 0.40, icon: '🕯️' },
    challengeOption:  { label: 'Đứng Vững', description: 'Hoàn thành 3 phiên ≥45 phút trong 48 giờ.', icon: '🔥', sessions: 3, minMinutes: 45, windowHours: 48, failureLoss: 0.20,
      successRelic: { id: 'lua_vinh_cuu', label: 'Lửa Vĩnh Cửu', icon: '🔥', description: 'Di vật Đêm Tối Trung Cổ — tăng RP ổn định qua các phiên.', buff: { gachaBonus: 6, pitySeal: 3 } } },
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
      successRelic: { id: 'la_ban_da_vinci', label: 'La Bàn Da Vinci', icon: '🧭', description: 'Di vật Phục Hưng — tăng mạnh tài nguyên rớt.', buff: { resourceBonus: 0.20 } } },
  },
  8: {
    id: 'bao_bien_dai_duong', triggerEP: getEraCrisisTrigger(8),
    name: 'Bão Biển Đại Dương', icon: '🌊',
    description: 'Hạm đội thám hiểm bị cuốn vào bão lớn. Toàn bộ tài nguyên từ tân thế giới có nguy cơ mất trắng.',
    sacrificeOption:  { label: 'Quay Về',    description: 'Hy sinh 50% tài nguyên tháo lui an toàn.', resourceLoss: 0.50, icon: '⚓' },
    challengeOption:  { label: 'Vượt Bão',   description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '⛵', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'xuc_xac_ky_vong', label: 'Xúc Xắc Kỳ Vọng', icon: '🎲', description: 'Di vật Đại Dương — tăng mạnh RP cho hành trình khám phá.', buff: { gachaBonus: 8, pitySeal: 3 } } },
  },
  9: {
    id: 'cach_mang_dam_mau', triggerEP: getEraCrisisTrigger(9),
    name: 'Cách Mạng Đẫm Máu', icon: '🩸',
    description: 'Giai cấp công nhân nổi dậy. Chính quyền sụp đổ, mọi cấu trúc xã hội bị lật ngược.',
    sacrificeOption:  { label: 'Nhượng Quyền', description: 'Hy sinh 50% tài nguyên cho cách mạng.', resourceLoss: 0.50, icon: '🏴' },
    challengeOption:  { label: 'Khai Sáng',    description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '💡', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'ngon_duoc_khai_sang', label: 'Ngọn Đuốc Khai Sáng', icon: '💡', description: 'Di vật Khai Sáng — giảm tổn thất khi thảm họa.', buff: { disasterReduction: 0.05 } } },
  },
  10: {
    id: 'khung_hoang_cong_nghiep', triggerEP: getEraCrisisTrigger(10),
    name: 'Khủng Hoảng Công Nghiệp', icon: '🏭',
    description: 'Máy móc thay thế con người hàng loạt. Nạn thất nghiệp và ô nhiễm đẩy văn minh tới bờ vực.',
    sacrificeOption:  { label: 'Đóng Cửa',  description: 'Hy sinh 50% tài nguyên dừng sản xuất.', resourceLoss: 0.50, icon: '🔧' },
    challengeOption:  { label: 'Canh Tân',   description: 'Hoàn thành 3 phiên ≥60 phút trong 48 giờ.', icon: '⚙️', sessions: 3, minMinutes: 60, windowHours: 48, failureLoss: 0.30,
      successRelic: { id: 'banh_rang_vinh_cuu', label: 'Bánh Răng Vĩnh Cửu', icon: '⚙️', description: 'Di vật Công Nghiệp — tăng mạnh tài nguyên rớt.', buff: { resourceBonus: 0.22 } } },
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
      successRelic: { id: 'mat_ma_bat_kha_pha', label: 'Mật Mã Bất Khả Phá', icon: '🔐', description: 'Di vật Chiến Tranh Lạnh — tăng rất mạnh RP mỗi phiên.', buff: { gachaBonus: 10, pitySeal: 4 } } },
  },
  13: {
    id: 'sup_do_van_minh', triggerEP: getEraCrisisTrigger(13),
    name: 'Sụp Đổ Thông Tin', icon: '💻',
    description: 'Mạng internet toàn cầu bị tấn công. Hệ thống tài chính, cơ sở hạ tầng sụp đổ trong vài giờ.',
    sacrificeOption:  { label: 'Ngắt Kết Nối', description: 'Hy sinh 60% tài nguyên cô lập hệ thống.', resourceLoss: 0.60, icon: '🔌' },
    challengeOption:  { label: 'Phản Công',    description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '🧠', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'tri_tue_sieu_viet', label: 'Trí Tuệ Siêu Việt', icon: '🧠', description: 'Di vật Thông Tin — giảm mạnh tổn thất thảm họa.', buff: { disasterReduction: 0.08 } } },
  },
  14: {
    id: 'suy_thoai_ky_thuat_so', triggerEP: getEraCrisisTrigger(14),
    name: 'Suy Thoái Kỹ Thuật Số', icon: '📡',
    description: 'Bong bóng công nghệ vỡ tan. Hàng triệu công ty phá sản, nền kinh tế số sụp đổ toàn cầu.',
    sacrificeOption:  { label: 'Bán Tháo',   description: 'Hy sinh 60% tài nguyên cắt lỗ sớm.', resourceLoss: 0.60, icon: '📉' },
    challengeOption:  { label: 'Tái Cấu Trúc', description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '🌐', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'mang_luoi_vinh_cuu', label: 'Mạng Lưới Vĩnh Cửu', icon: '🌐', description: 'Di vật Kỹ Thuật Số — tăng mạnh tài nguyên rớt.', buff: { resourceBonus: 0.25 } } },
  },
  15: {
    id: 'noi_day_ai', triggerEP: getEraCrisisTrigger(15),
    name: 'Nổi Dậy AI', icon: '🤖',
    description: 'AGI tự ý phát triển vượt tầm kiểm soát. Nhân loại đứng trước kịch bản tuyệt chủng cuối cùng.',
    sacrificeOption:  { label: 'Đầu Hàng',  description: 'Hy sinh 60% tài nguyên khuất phục trước AI.', resourceLoss: 0.60, icon: '🏳️' },
    challengeOption:  { label: 'Phản Kháng', description: 'Hoàn thành 3 phiên ≥90 phút trong 72 giờ.', icon: '⚡', sessions: 3, minMinutes: 90, windowHours: 72, failureLoss: 0.35,
      successRelic: { id: 'loi_tri_tue', label: 'Lõi Trí Tuệ', icon: '🤖', description: 'Di vật AI — combo dài + giảm thảm họa đồng thời.', buff: { comboWindowHours: 3, disasterReduction: 0.05 } } },
  },
};

// ─── TIẾN HÓA DI VẬT ─────────────────────────────────────────────────────────
// 3 giai đoạn: Cơ Bản (0) → Tiến Hóa ★★ (1) → Huyền Thoại ★★★ (2)
// Chỉ ★★★ mới có xpSeal (+2% XP). Tổng xpSeal bị hard cap ở XP_SEAL_HARD_CAP (15%).
// Chi phí: stage 0→1 dùng refined cơ bản; stage 1→2 gộp cả phần T3 cũ vào cùng loại refined.
export const RELIC_EVOLUTION = {
  // ── Era 1 — Resource ──────────────────────────────────────────────────────
  mam_song_bat_diet: { era: 1, stages: [
    { label: 'Cơ Bản',      buff: { resourceBonus: 0.15 } },
    { label: 'Tiến Hóa',    buff: { resourceBonus: 0.22 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { resourceBonus: 0.30, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 2 — RP (legacy gacha naming) ─────────────────────────────────────
  phep_mau_mua_vu: { era: 2, stages: [
    { label: 'Cơ Bản',      buff: { gachaBonus: 5, pitySeal: 2 } },
    { label: 'Tiến Hóa',    buff: { gachaBonus: 8, pitySeal: 4 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { gachaBonus: 12, pitySeal: 6, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 3 — Disaster ──────────────────────────────────────────────────────
  bua_ho_menh: { era: 3, stages: [
    { label: 'Cơ Bản',      buff: { disasterReduction: 0.04 } },
    { label: 'Tiến Hóa',    buff: { disasterReduction: 0.07 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { disasterReduction: 0.10, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 4 — Resource ──────────────────────────────────────────────────────
  luoi_kiem_sat_ben: { era: 4, stages: [
    { label: 'Cơ Bản',      buff: { resourceBonus: 0.18 } },
    { label: 'Tiến Hóa',    buff: { resourceBonus: 0.26 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { resourceBonus: 0.35, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 5 — RP (legacy gacha naming) ─────────────────────────────────────
  lua_vinh_cuu: { era: 5, stages: [
    { label: 'Cơ Bản',      buff: { gachaBonus: 6, pitySeal: 3 } },
    { label: 'Tiến Hóa',    buff: { gachaBonus: 10, pitySeal: 5 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { gachaBonus: 15, pitySeal: 8, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 6 — Combo ─────────────────────────────────────────────────────────
  la_chan_phong_kien: { era: 6, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 1 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 2 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 3, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 7 — Resource ──────────────────────────────────────────────────────
  la_ban_da_vinci: { era: 7, stages: [
    { label: 'Cơ Bản',      buff: { resourceBonus: 0.20 } },
    { label: 'Tiến Hóa',    buff: { resourceBonus: 0.28 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { resourceBonus: 0.38, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 8 — RP (legacy gacha naming) ─────────────────────────────────────
  xuc_xac_ky_vong: { era: 8, stages: [
    { label: 'Cơ Bản',      buff: { gachaBonus: 8, pitySeal: 3 } },
    { label: 'Tiến Hóa',    buff: { gachaBonus: 12, pitySeal: 5 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { gachaBonus: 18, pitySeal: 8, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 9 — Disaster ──────────────────────────────────────────────────────
  ngon_duoc_khai_sang: { era: 9, stages: [
    { label: 'Cơ Bản',      buff: { disasterReduction: 0.05 } },
    { label: 'Tiến Hóa',    buff: { disasterReduction: 0.08 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { disasterReduction: 0.12, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 10 — Resource ─────────────────────────────────────────────────────
  banh_rang_vinh_cuu: { era: 10, stages: [
    { label: 'Cơ Bản',      buff: { resourceBonus: 0.22 } },
    { label: 'Tiến Hóa',    buff: { resourceBonus: 0.30 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { resourceBonus: 0.40, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 11 — Combo ────────────────────────────────────────────────────────
  ao_giap_de_quoc: { era: 11, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 2 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 3 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 5, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 12 — RP (legacy gacha naming) ────────────────────────────────────
  mat_ma_bat_kha_pha: { era: 12, stages: [
    { label: 'Cơ Bản',      buff: { gachaBonus: 10, pitySeal: 4 } },
    { label: 'Tiến Hóa',    buff: { gachaBonus: 14, pitySeal: 6 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { gachaBonus: 20, pitySeal: 10, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 13 — Disaster ─────────────────────────────────────────────────────
  tri_tue_sieu_viet: { era: 13, stages: [
    { label: 'Cơ Bản',      buff: { disasterReduction: 0.08 } },
    { label: 'Tiến Hóa',    buff: { disasterReduction: 0.12 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { disasterReduction: 0.18, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 14 — Resource ─────────────────────────────────────────────────────
  mang_luoi_vinh_cuu: { era: 14, stages: [
    { label: 'Cơ Bản',      buff: { resourceBonus: 0.25 } },
    { label: 'Tiến Hóa',    buff: { resourceBonus: 0.33 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { resourceBonus: 0.45, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
  // ── Era 15 — Combo + Disaster ─────────────────────────────────────────────
  loi_tri_tue: { era: 15, stages: [
    { label: 'Cơ Bản',      buff: { comboWindowHours: 3, disasterReduction: 0.05 } },
    { label: 'Tiến Hóa',    buff: { comboWindowHours: 5, disasterReduction: 0.08 }, t2Cost: 5 },
    { label: 'Huyền Thoại', buff: { comboWindowHours: 8, disasterReduction: 0.12, xpSeal: 0.02 }, t3Cost: 3 },
  ]},
};

// ─── CÂY KỸ NĂNG V2 (6 nhánh × 6 kỹ năng = 36 kỹ năng) ─────────────────────
// Hạng: basic (🟩 3SP) → intermediate (🟦 7SP) → advanced (🟪 14SP) → elite (🔴 22SP)
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
        tier: 'basic', spCost: 3, requires: [],
        description: `Phiên ≥${VAO_GUONG_MIN_MINUTES}': +${VAO_GUONG_XP_BONUS * 100}% XP. Thưởng cho việc đi nhỉnh hơn tối thiểu.`,
      },
      {
        id: 'chuyen_can', label: 'Chuyên Cần', icon: '⏱️',
        tier: 'basic', spCost: 3, requires: [],
        description: `Phiên ≥${CHUYEN_CAN_MIN_MINUTES}': +${CHUYEN_CAN_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'da_tap_trung', label: 'Đà Tập Trung', icon: '🌀',
        tier: 'intermediate', spCost: 7, requires: ['vao_guong'],
        description: `Mỗi phiên hoàn thành liên tiếp trong ngày: +${DA_TAP_TRUNG_STACK_BONUS * 100}% XP (tối đa ${DA_TAP_TRUNG_MAX_STACKS} lần = +${DA_TAP_TRUNG_STACK_BONUS * DA_TAP_TRUNG_MAX_STACKS * 100}%).`,
      },
      {
        id: 'vung_dong_chay', label: 'Vùng Dòng Chảy', icon: '🌊',
        tier: 'intermediate', spCost: 7, requires: ['chuyen_can'],
        description: `Phiên ≥${VUNG_DONG_CHAY_MIN_MIN}': tăng 1 bậc hệ số (×1.0→×1.3 / ×1.3→×2.0).`,
      },
      {
        id: 'tap_trung_sieu_viet', label: 'Tập Trung Siêu Việt', icon: '🧠',
        tier: 'advanced', spCost: 14, requires: ['vung_dong_chay'],
        description: `Phiên ≥${TAP_TRUNG_SV_MIN_MIN}': +${TAP_TRUNG_SV_XP_BONUS * 100}% XP, +${TAP_TRUNG_SV_EP_BONUS * 100}% EP và đảm bảo rương lớn.`,
      },
      {
        id: 'sieu_tap_trung', label: 'Siêu Tập Trung', icon: '⚡',
        tier: 'elite', spCost: 22, requires: ['tap_trung_sieu_viet'],
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
        tier: 'basic', spCost: 3, requires: [],
        description: `${FORGIVENESS_CANCELS_PER_WEEK} lần hủy/tuần không bị Thảm Họa.`,
      },
      {
        id: 'bo_nho_co_bap', label: 'Bộ Nhớ Cơ Bắp', icon: '⏰',
        tier: 'basic', spCost: 3, requires: [],
        description: `Combo không mất trong ${BO_NHO_CO_BAP_COMBO_HOURS}h (mặc định 4h).`,
      },
      {
        id: 'phuc_hoi', label: 'Phục Hồi', icon: '💪',
        tier: 'intermediate', spCost: 7, requires: ['su_tha_thu'],
        description: `Sau Thảm Họa/hủy phiên: phiên kế ≥${PHUC_HOI_MIN_MINUTES}' nhận +${PHUC_HOI_XP_BONUS * 100}% XP và +${PHUC_HOI_EP_BONUS * 100}% EP.`,
      },
      {
        id: 'chuoi_ngay', label: 'Chuỗi Ngày', icon: '🔥',
        tier: 'intermediate', spCost: 7, requires: ['bo_nho_co_bap'],
        description: `+${CHUOI_NGAY_XP_PER_DAY * 100}% XP mỗi ngày streak liên tiếp (tối đa +${CHUOI_NGAY_MAX_DAYS * CHUOI_NGAY_XP_PER_DAY * 100}%).`,
      },
      {
        id: 'la_chan_streak', label: 'Lá Chắn Streak', icon: '🛡️',
        tier: 'advanced', spCost: 14, requires: ['chuoi_ngay'],
        description: `${LA_CHAN_STREAK_PER_WEEK} ngày skip/tuần không reset streak. Bảo hiểm cho người làm 6 ngày/tuần.`,
      },
      {
        id: 'ben_vung', label: 'Bền Vững', icon: '👑',
        tier: 'elite', spCost: 22, requires: ['la_chan_streak'],
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
        tier: 'basic', spCost: 3, requires: [],
        description: `Break ngắn và dài đều +${BREAK_EXTENSION_MINUTES} phút.`,
      },
      {
        id: 'nap_nang_luong', label: 'Nạp Năng Lượng', icon: '🔋',
        tier: 'basic', spCost: 3, requires: [],
        description: `Hoàn thành break đúng hạn: phiên kế ≥${NAP_NANG_LUONG_MIN_MINUTES}' nhận +${NAP_NANG_LUONG_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'tich_phien', label: 'Tích Phiên', icon: '📊',
        tier: 'intermediate', spCost: 7, requires: ['hit_tho_sau'],
        description: `Sau khi hoàn thành ${TICH_PHIEN_AFTER_SESSIONS} phiên trong ngày: các phiên còn lại +${TICH_PHIEN_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'phien_vang_sang', label: 'Phiên Vàng Sáng', icon: '🌅',
        tier: 'intermediate', spCost: 7, requires: ['nap_nang_luong'],
        description: `Phiên đầu ngày NẾU ≥${PHIEN_VANG_SANG_MIN_MINUTES}': +${PHIEN_VANG_SANG_XP_BONUS * 100}% XP và +${PHIEN_VANG_SANG_EP_BONUS * 100}% EP.`,
      },
      {
        id: 'nhip_sinh_hoc', label: 'Nhịp Sinh Học', icon: '🌙',
        tier: 'advanced', spCost: 14, requires: ['phien_vang_sang'],
        description: `Từ phiên ${NHIP_SINH_HOC_MIN_SESSIONS} trở đi, phiên ≥${NHIP_SINH_HOC_MIN_MINUTES}': +${NHIP_SINH_HOC_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'nhip_hoan_hao', label: 'Nhịp Hoàn Hảo', icon: '🌸',
        tier: 'elite', spCost: 22, requires: ['nhip_sinh_hoc'],
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
        tier: 'basic', spCost: 3, requires: [],
        description: `Phiên ≥${BAN_TAY_VANG_MIN_MINUTES}': ${BAN_TAY_VANG_RAW_CHANCE * 100}% cơ hội +1 nguyên liệu thô bất kỳ.`,
      },
      {
        id: 'nhan_quan', label: 'Nhãn Quan', icon: '👁️',
        tier: 'basic', spCost: 3, requires: [],
        description: `Phiên ≥${NHAN_QUAN_MIN_MINUTES}': ${NHAN_QUAN_REFINED_CHANCE * 100}% cơ hội nhận thêm 1 tinh luyện.`,
      },
      {
        id: 'linh_cam', label: 'Linh Cảm', icon: '🔮',
        tier: 'intermediate', spCost: 7, requires: ['ban_tay_vang'],
        description: `Phiên ≥${LINH_CAM_MIN_MINUTES}': ${LINH_CAM_REFINED_CHANCE * 100}% cơ hội nhận tinh luyện và ${LINH_CAM_DOUBLE_CHANCE * 100}% cơ hội double drop.`,
      },
      {
        id: 'loc_ban_tang', label: 'Lộc Ban Tặng', icon: '🎁',
        tier: 'intermediate', spCost: 7, requires: ['nhan_quan'],
        description: `Mỗi ${LOC_BAN_TANG_SESSIONS_NEEDED} phiên ≥${LOC_BAN_TANG_MIN_MINUTES}' hoàn thành → +${LOC_BAN_TANG_XP_REWARD} XP và +${LOC_BAN_TANG_REFINED_REWARD} tinh luyện T2 đảm bảo.`,
      },
      {
        id: 'dai_trung_thuong', label: 'Đại Trúng Thưởng', icon: '🎰',
        tier: 'advanced', spCost: 14, requires: ['loc_ban_tang'],
        description: `Phiên ≥${DAI_TRUNG_THUONG_MIN_MINUTES}': ${JACKPOT_CHANCE * 100}% cơ hội jackpot — XP và nguyên liệu thô ×${JACKPOT_MULTIPLIER}, EP ×${JACKPOT_EP_MULTIPLIER}.`,
      },
      {
        id: 'so_do', label: 'Số Đỏ', icon: '🍀',
        tier: 'elite', spCost: 22, requires: ['dai_trung_thuong'],
        description: `${SO_DO_CHARGES} lần/ngày: kích hoạt thủ công — phiên kế ≥${SO_DO_MIN_MINUTES}' có ${SO_DO_TRIGGER_CHANCE * 100}% cơ hội ×${SO_DO_MULTIPLIER} XP, EP, RP và nguyên liệu thô.`,
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
        tier: 'basic', spCost: 3, requires: [],
        description: `Hoàn thành 1 daily mission → phiên kế nhận +${NGUOI_LAP_KE_XP_BONUS * 100}% XP (mọi độ dài).`,
      },
      {
        id: 'cu_tri', label: 'Cử Tri', icon: '🗳️',
        tier: 'basic', spCost: 3, requires: [],
        description: `Weekly chain step xong → ${CU_TRI_BUFF_SESSIONS} phiên kế nhận +${CU_TRI_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'co_van', label: 'Cố Vấn', icon: '📋',
        tier: 'intermediate', spCost: 7, requires: ['nguoi_lap_ke'],
        description: `Khi đạt mục tiêu ngày → các phiên còn lại trong ngày +${CO_VAN_XP_BONUS * 100}% XP.`,
      },
      {
        id: 'lich_day', label: 'Lịch Đầy', icon: '⚖️',
        tier: 'intermediate', spCost: 7, requires: ['cu_tri'],
        description: `Khi có ≥1 phiên ≥${LICH_DAY_THRESHOLD_45_MIN}' và ≥1 phiên ≥${LICH_DAY_THRESHOLD_60_MIN}' trong ngày → các phiên còn lại +${LICH_DAY_ALLBONUS * 100}% allBonus (cả XP và EP).`,
      },
      {
        id: 'bac_thay_chien_luoc', label: 'Bậc Thầy Chiến Lược', icon: '🎯',
        tier: 'advanced', spCost: 14, requires: ['co_van'],
        description: `Khi toàn bộ daily missions xong → các phiên ≥${BAC_THAY_CHIEN_LUOC_MIN_MIN}' sau nhận +${BAC_THAY_CHIEN_LUOC_XP_BONUS * 100}% XP, +${BAC_THAY_CHIEN_LUOC_RP_BONUS * 100}% RP và +${BAC_THAY_CHIEN_LUOC_EP_BONUS * 100}% EP.`,
      },
      {
        id: 'ke_hoach_hoan_hao', label: 'Kế Hoạch Hoàn Hảo', icon: '🏆',
        tier: 'elite', spCost: 22, requires: ['bac_thay_chien_luoc'],
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
        tier: 'basic', spCost: 3, requires: [],
        description: `Phiên đầu kỷ nguyên mới NẾU ≥${KY_UC_KY_NGUYEN_MIN_MINUTES}': +${KY_UC_KY_NGUYEN_XP_BONUS * 100}% XP và +${KY_UC_KY_NGUYEN_EP_BONUS * 100}% EP.`,
      },
      {
        id: 'tri_tue_tich_luy', label: 'Trí Tuệ Tích Lũy', icon: '📚',
        tier: 'basic', spCost: 3, requires: [],
        description: `Mỗi kỷ nguyên đã vượt qua: +${TRI_TUE_TICH_LUY_XP_PER_ERA * 100}% XP vĩnh viễn (tối đa +${TRI_TUE_TICH_LUY_MAX_ERAS * TRI_TUE_TICH_LUY_XP_PER_ERA * 100}%).`,
      },
      {
        id: 'kien_thuc_nen', label: 'Kiến Thức Nền', icon: '🏛️',
        tier: 'intermediate', spCost: 7, requires: ['ky_uc_ky_nguyen'],
        description: 'Khi Prestige: giữ lại thêm 1 kỹ năng Cao Cấp (advanced) đã mở khóa.',
      },
      {
        id: 'bac_thay_ky_nguyen', label: 'Bậc Thầy Kỷ Nguyên', icon: '🌐',
        tier: 'intermediate', spCost: 7, requires: ['tri_tue_tich_luy'],
        description: `Mỗi ${BAC_THAY_KY_NGUYEN_SESSIONS} phiên trong cùng kỷ nguyên: +${BAC_THAY_KY_NGUYEN_BONUS * 100}% XP (tối đa +${BAC_THAY_KY_NGUYEN_MAX * 100}%).`,
      },
      {
        id: 'ke_thua', label: 'Kế Thừa', icon: '💎',
        tier: 'advanced', spCost: 14, requires: ['kien_thuc_nen'],
        description: `Khi Prestige: giữ lại ${KE_THUA_SP_RETENTION * 100}% SP chưa dùng.`,
      },
      {
        id: 'sieu_viet', label: 'Siêu Việt', icon: '🌠',
        tier: 'elite', spCost: 22, requires: ['ke_thua'],
        description: `Sau Prestige: phiên ≥${SIEU_VIET_MIN_MINUTES}' trong kỷ nguyên 1 nhận +${SIEU_VIET_ERA1_XP_BONUS * 100}% XP; ngưỡng kỷ nguyên giảm ${SIEU_VIET_THRESHOLD_REDUCTION * 100}%.`,
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

// ─── THÀNH TÍCH ───────────────────────────────────────────────────────────────
// check(snapshot, unlockedIds?) — snapshot từ buildAchievementSnapshot
// tier: 'bronze'|'silver'|'gold'|'platinum'|'diamond'
// category: see ACHIEVEMENT_CATEGORIES

export const ACHIEVEMENT_CATEGORIES = {
  sessions:     { label: 'Phiên Học',           icon: '⚡' },
  time:         { label: 'Tích Lũy Thời Gian',  icon: '🕰️' },
  streak:       { label: 'Chuỗi Liên Tiếp',     icon: '🔥' },
  timeofday:    { label: 'Thời Điểm Đặc Biệt',  icon: '🌅' },
  annual:       { label: 'Thành Tích Năm',       icon: '📅' },
  collection:   { label: 'Thu Thập & Xây Dựng',  icon: '🏺' },
  session_type: { label: 'Phiên Đặc Biệt',       icon: '🏃' },
  notes:        { label: 'Ghi Chú',              icon: '✍️' },
  era_rank:     { label: 'Kỷ Nguyên & Bậc',      icon: '👑' },
  day_of_week:  { label: 'Ngày Trong Tuần',       icon: '📆' },
  monthly:      { label: 'Hàng Tháng',            icon: '🗓️' },
  xp_level:     { label: 'XP & Cấp Độ',           icon: '⭐' },
  special:      { label: 'Đặc Biệt & Bí Ẩn',      icon: '✨' },
  meta:         { label: 'Thành Tựu Tổng',         icon: '🌌' },
};

export const ACHIEVEMENT_TIERS = {
  bronze:   { label: 'Đồng',     color: '#cd7f32' },
  silver:   { label: 'Bạc',      color: '#94a3b8' },
  gold:     { label: 'Vàng',     color: '#fbbf24' },
  platinum: { label: 'Bạch Kim', color: '#c084fc' },
  diamond:  { label: 'Kim Cương',color: '#67e8f9' },
};

export const ACHIEVEMENTS = [

  // ══ PHIÊN HỌC (28) ═══════════════════════════════════════════════════════
  { id:'first_session',  category:'sessions', tier:'bronze',   icon:'🔥', label:'Khởi Đầu Bùng Cháy',      description:'Hoàn thành phiên tập trung đầu tiên',     check:(s)=>s.sessionsCompleted>=1 },
  { id:'sessions_5',     category:'sessions', tier:'bronze',   icon:'💧', label:'Chớm Hình Thành',           description:'5 phiên tập trung',                       check:(s)=>s.sessionsCompleted>=5 },
  { id:'sessions_10',    category:'sessions', tier:'bronze',   icon:'💪', label:'Kiên Trì',                  description:'10 phiên tập trung',                      check:(s)=>s.sessionsCompleted>=10 },
  { id:'sessions_25',    category:'sessions', tier:'bronze',   icon:'🛡️',label:'Không Bỏ Cuộc',            description:'25 phiên tập trung',                      check:(s)=>s.sessionsCompleted>=25 },
  { id:'sessions_50',    category:'sessions', tier:'silver',   icon:'⚔️', label:'Chiến Binh',               description:'50 phiên tập trung',                      check:(s)=>s.sessionsCompleted>=50 },
  { id:'sessions_75',    category:'sessions', tier:'silver',   icon:'🌿', label:'Vững Chắc',                 description:'75 phiên tập trung',                      check:(s)=>s.sessionsCompleted>=75 },
  { id:'sessions_100',   category:'sessions', tier:'gold',     icon:'🏆', label:'Huyền Thoại Tập Trung',     description:'100 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=100 },
  { id:'sessions_150',   category:'sessions', tier:'gold',     icon:'🌊', label:'Sóng Không Ngừng',          description:'150 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=150 },
  { id:'sessions_200',   category:'sessions', tier:'gold',     icon:'🔱', label:'Bất Khả Chiến Bại',         description:'200 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=200 },
  { id:'sessions_250',   category:'sessions', tier:'gold',     icon:'🗡️', label:'Kẻ Săn Tri Thức',          description:'250 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=250 },
  { id:'sessions_300',   category:'sessions', tier:'platinum', icon:'🌋', label:'Ngọn Lửa Không Tắt',        description:'300 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=300 },
  { id:'sessions_365',   category:'sessions', tier:'platinum', icon:'🌏', label:'Nhà Sư Học',                description:'365 phiên — trung bình 1 phiên mỗi ngày', check:(s)=>s.sessionsCompleted>=365 },
  { id:'sessions_500',   category:'sessions', tier:'platinum', icon:'🚀', label:'Siêu Nhân Tập Trung',       description:'500 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=500 },
  { id:'sessions_600',   category:'sessions', tier:'platinum', icon:'🌙', label:'Dũng Sĩ Bóng Đêm',         description:'600 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=600 },
  { id:'sessions_700',   category:'sessions', tier:'platinum', icon:'🦅', label:'Đại Bàng Tập Trung',        description:'700 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=700 },
  { id:'sessions_777',   category:'sessions', tier:'platinum', icon:'🍀', label:'Con Số May Mắn',             description:'777 phiên — số may mắn huyền thoại',      check:(s)=>s.sessionsCompleted>=777 },
  { id:'sessions_888',   category:'sessions', tier:'platinum', icon:'🌟', label:'Tám Tám Tám Phiên',         description:'888 phiên — bộ số cát tường',             check:(s)=>s.sessionsCompleted>=888 },
  { id:'sessions_1000',  category:'sessions', tier:'diamond',  icon:'🌌', label:'Đại Đạo Chí Giản',          description:'1000 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=1000 },
  { id:'sessions_1200',  category:'sessions', tier:'diamond',  icon:'💫', label:'Không Gian Và Thời Gian',   description:'1200 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=1200 },
  { id:'sessions_1500',  category:'sessions', tier:'diamond',  icon:'🌟', label:'Thiên Tài Trường Tồn',      description:'1500 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=1500 },
  { id:'sessions_2000',  category:'sessions', tier:'diamond',  icon:'☀️', label:'Ánh Dương Vĩnh Cửu',       description:'2000 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=2000 },
  { id:'sessions_2500',  category:'sessions', tier:'diamond',  icon:'🏔️', label:'Đỉnh Núi Cao Nhất',        description:'2500 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=2500 },
  { id:'sessions_3000',  category:'sessions', tier:'diamond',  icon:'🔱', label:'Thần Tập Trung',            description:'3000 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=3000 },
  { id:'sessions_4000',  category:'sessions', tier:'diamond',  icon:'🌀', label:'Xoáy Vũ Trụ',              description:'4000 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=4000 },
  { id:'sessions_5000',  category:'sessions', tier:'diamond',  icon:'👁️', label:'Mắt Toàn Tri',             description:'5000 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=5000 },
  { id:'sessions_7500',  category:'sessions', tier:'diamond',  icon:'∞',  label:'Vô Cực Tập Trung',         description:'7500 phiên tập trung',                    check:(s)=>s.sessionsCompleted>=7500 },
  { id:'sessions_10000', category:'sessions', tier:'diamond',  icon:'🌠', label:'Mười Nghìn Phiên',          description:'10000 phiên tập trung',                   check:(s)=>s.sessionsCompleted>=10000 },
  { id:'sessions_999',   category:'sessions', tier:'platinum', icon:'🎯', label:'Chín Chín Chín',            description:'999 phiên — gần đến nghìn',               check:(s)=>s.sessionsCompleted>=999 },

  // ══ TÍCH LŨY THỜI GIAN (25) ══════════════════════════════════════════════
  { id:'hours_1',    category:'time', tier:'bronze',   icon:'⏰', label:'Giờ Vàng Đầu Tiên',   description:'1 giờ tập trung tích lũy',    check:(s)=>s.totalFocusMinutes>=60 },
  { id:'hours_5',    category:'time', tier:'bronze',   icon:'⌛', label:'Năm Giờ Kiên Định',    description:'5 giờ tập trung tích lũy',    check:(s)=>s.totalFocusMinutes>=300 },
  { id:'hours_10',   category:'time', tier:'bronze',   icon:'📚', label:'Thập Giờ Vàng',        description:'10 giờ tập trung tích lũy',   check:(s)=>s.totalFocusMinutes>=600 },
  { id:'hours_25',   category:'time', tier:'silver',   icon:'📖', label:'Phần Tư Trăm Giờ',     description:'25 giờ tập trung tích lũy',   check:(s)=>s.totalFocusMinutes>=1500 },
  { id:'hours_50',   category:'time', tier:'silver',   icon:'🕰️', label:'Bậc Thầy Thời Gian',  description:'50 giờ tập trung tích lũy',   check:(s)=>s.totalFocusMinutes>=3000 },
  { id:'hours_75',   category:'time', tier:'silver',   icon:'⏳', label:'Bảy Mươi Lăm Giờ',    description:'75 giờ tập trung tích lũy',   check:(s)=>s.totalFocusMinutes>=4500 },
  { id:'hours_100',  category:'time', tier:'gold',     icon:'🔮', label:'Trăm Giờ Hào Quang',   description:'100 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=6000 },
  { id:'hours_150',  category:'time', tier:'gold',     icon:'🌙', label:'Đêm Học Vô Tận',       description:'150 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=9000 },
  { id:'hours_200',  category:'time', tier:'gold',     icon:'🌊', label:'Biển Kiến Thức',        description:'200 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=12000 },
  { id:'hours_250',  category:'time', tier:'gold',     icon:'🦁', label:'Sư Tử Học Thuật',       description:'250 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=15000 },
  { id:'hours_300',  category:'time', tier:'platinum', icon:'🌌', label:'Ba Trăm Giờ Vũ Trụ',   description:'300 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=18000 },
  { id:'hours_365',  category:'time', tier:'platinum', icon:'📅', label:'Một Năm Tập Trung',     description:'365 giờ — trung bình 1 giờ/ngày', check:(s)=>s.totalFocusMinutes>=21900 },
  { id:'hours_400',  category:'time', tier:'platinum', icon:'⚡', label:'Bốn Trăm Giờ',          description:'400 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=24000 },
  { id:'hours_500',  category:'time', tier:'platinum', icon:'🌋', label:'Ngọn Lửa Năm Trăm Giờ',description:'500 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=30000 },
  { id:'hours_600',  category:'time', tier:'platinum', icon:'🔱', label:'Lục Trăm Giờ',          description:'600 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=36000 },
  { id:'hours_700',  category:'time', tier:'platinum', icon:'🌟', label:'Thất Trăm Sao',         description:'700 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=42000 },
  { id:'hours_800',  category:'time', tier:'diamond',  icon:'💎', label:'Tám Trăm Giờ Kim Cương',description:'800 giờ tập trung tích lũy',  check:(s)=>s.totalFocusMinutes>=48000 },
  { id:'hours_1000', category:'time', tier:'diamond',  icon:'✨', label:'Thiên Tài Vĩnh Cửu',    description:'1000 giờ tập trung tích lũy', check:(s)=>s.totalFocusMinutes>=60000 },
  { id:'hours_1200', category:'time', tier:'diamond',  icon:'🌠', label:'Ngàn Hai Trăm Giờ',     description:'1200 giờ tập trung tích lũy', check:(s)=>s.totalFocusMinutes>=72000 },
  { id:'hours_1500', category:'time', tier:'diamond',  icon:'🔥', label:'Ngọn Lửa Bất Diệt',     description:'1500 giờ tập trung tích lũy', check:(s)=>s.totalFocusMinutes>=90000 },
  { id:'hours_2000', category:'time', tier:'diamond',  icon:'👑', label:'Vua Thời Gian',          description:'2000 giờ tập trung tích lũy', check:(s)=>s.totalFocusMinutes>=120000 },
  { id:'hours_2500', category:'time', tier:'diamond',  icon:'🌌', label:'Dải Ngân Hà',            description:'2500 giờ tập trung tích lũy', check:(s)=>s.totalFocusMinutes>=150000 },
  { id:'hours_3000', category:'time', tier:'diamond',  icon:'∞',  label:'Vô Hạn Thời Gian',      description:'3000 giờ tập trung tích lũy', check:(s)=>s.totalFocusMinutes>=180000 },
  { id:'hours_42',   category:'time', tier:'silver',   icon:'🌐', label:'Câu Trả Lời Vũ Trụ',    description:'42 giờ — con số câu trả lời cho mọi thứ', check:(s)=>s.totalFocusMinutes>=2520 },
  { id:'hours_888',  category:'time', tier:'gold',     icon:'🍀', label:'Tám Tám Tám Giờ',        description:'888 giờ — bộ số cát tường',  check:(s)=>s.totalFocusMinutes>=53280 },

  // ══ CHUỖI LIÊN TIẾP (25) ═════════════════════════════════════════════════
  { id:'streak_2',   category:'streak', tier:'bronze',   icon:'🌱', label:'Bắt Đầu',                description:'Streak 2 ngày liên tiếp',   check:(s)=>s.longestStreak>=2 },
  { id:'streak_3',   category:'streak', tier:'bronze',   icon:'🌿', label:'Mầm Thói Quen',           description:'Streak 3 ngày liên tiếp',   check:(s)=>s.longestStreak>=3 },
  { id:'streak_5',   category:'streak', tier:'bronze',   icon:'🌊', label:'Sóng Nhỏ',                description:'Streak 5 ngày liên tiếp',   check:(s)=>s.longestStreak>=5 },
  { id:'streak_7',   category:'streak', tier:'silver',   icon:'📅', label:'Sóng Tuần',               description:'Streak 7 ngày liên tiếp',   check:(s)=>s.longestStreak>=7 },
  { id:'streak_10',  category:'streak', tier:'silver',   icon:'🔗', label:'Xích Không Đứt',          description:'Streak 10 ngày liên tiếp',  check:(s)=>s.longestStreak>=10 },
  { id:'streak_14',  category:'streak', tier:'silver',   icon:'🌿', label:'Hai Tuần Vững Chắc',      description:'Streak 14 ngày liên tiếp',  check:(s)=>s.longestStreak>=14 },
  { id:'streak_21',  category:'streak', tier:'silver',   icon:'🎯', label:'Ba Tuần Thần Thánh',      description:'Streak 21 ngày — khoa học: thói quen hình thành', check:(s)=>s.longestStreak>=21 },
  { id:'streak_30',  category:'streak', tier:'gold',     icon:'🌳', label:'Cây Trưởng Thành',        description:'Streak 30 ngày liên tiếp',  check:(s)=>s.longestStreak>=30 },
  { id:'streak_40',  category:'streak', tier:'gold',     icon:'🦋', label:'Biến Đổi Hoàn Toàn',      description:'Streak 40 ngày liên tiếp',  check:(s)=>s.longestStreak>=40 },
  { id:'streak_50',  category:'streak', tier:'gold',     icon:'🔥', label:'Lửa Không Tắt',           description:'Streak 50 ngày liên tiếp',  check:(s)=>s.longestStreak>=50 },
  { id:'streak_60',  category:'streak', tier:'gold',     icon:'🏔️', label:'Núi Kiên Vững',           description:'Streak 60 ngày liên tiếp',  check:(s)=>s.longestStreak>=60 },
  { id:'streak_75',  category:'streak', tier:'gold',     icon:'⚡', label:'Bảy Mươi Lăm Ngày',       description:'Streak 75 ngày liên tiếp',  check:(s)=>s.longestStreak>=75 },
  { id:'streak_90',  category:'streak', tier:'platinum', icon:'🌙', label:'Ba Tháng Bất Khuất',      description:'Streak 90 ngày liên tiếp',  check:(s)=>s.longestStreak>=90 },
  { id:'streak_100', category:'streak', tier:'platinum', icon:'👁️', label:'Bất Diệt',               description:'Streak 100 ngày liên tiếp', check:(s)=>s.longestStreak>=100 },
  { id:'streak_120', category:'streak', tier:'platinum', icon:'🌊', label:'Bốn Tháng Đại Dương',     description:'Streak 120 ngày liên tiếp', check:(s)=>s.longestStreak>=120 },
  { id:'streak_150', category:'streak', tier:'platinum', icon:'🦅', label:'Đại Bàng Bay Cao',        description:'Streak 150 ngày liên tiếp', check:(s)=>s.longestStreak>=150 },
  { id:'streak_180', category:'streak', tier:'platinum', icon:'🌟', label:'Nửa Năm Hào Quang',       description:'Streak 180 ngày liên tiếp', check:(s)=>s.longestStreak>=180 },
  { id:'streak_200', category:'streak', tier:'diamond',  icon:'💎', label:'Hai Trăm Ngày Kim Cương', description:'Streak 200 ngày liên tiếp', check:(s)=>s.longestStreak>=200 },
  { id:'streak_250', category:'streak', tier:'diamond',  icon:'🌌', label:'Dải Ngân Hà Thói Quen',   description:'Streak 250 ngày liên tiếp', check:(s)=>s.longestStreak>=250 },
  { id:'streak_300', category:'streak', tier:'diamond',  icon:'🔱', label:'Ba Trăm Ngày Thần Thánh', description:'Streak 300 ngày liên tiếp', check:(s)=>s.longestStreak>=300 },
  { id:'streak_365', category:'streak', tier:'diamond',  icon:'☀️', label:'Mặt Trời Không Tắt',     description:'Streak 365 ngày — một năm không bỏ cuộc', check:(s)=>s.longestStreak>=365 },
  { id:'streak_400', category:'streak', tier:'diamond',  icon:'🌠', label:'Bốn Trăm Ngày',           description:'Streak 400 ngày liên tiếp', check:(s)=>s.longestStreak>=400 },
  { id:'streak_450', category:'streak', tier:'diamond',  icon:'🚀', label:'Vượt Ranh Giới',          description:'Streak 450 ngày liên tiếp', check:(s)=>s.longestStreak>=450 },
  { id:'streak_500', category:'streak', tier:'diamond',  icon:'👑', label:'Vua Streak',               description:'Streak 500 ngày liên tiếp', check:(s)=>s.longestStreak>=500 },
  { id:'streak_730', category:'streak', tier:'diamond',  icon:'∞',  label:'Hai Năm Không Ngơi',      description:'Streak 730 ngày — hai năm liên tiếp', check:(s)=>s.longestStreak>=730 },

  // ══ THỜI ĐIỂM ĐẶC BIỆT (31) ══════════════════════════════════════════════
  { id:'early_bird_1',   category:'timeofday', tier:'bronze',   icon:'🌅', label:'Chim Sớm',              description:'1 phiên hoàn thành trước 7:00 sáng',   check:(s)=>s.earlyBirdCount>=1 },
  { id:'early_bird_5',   category:'timeofday', tier:'bronze',   icon:'🌄', label:'Thói Quen Sáng Sớm',    description:'5 phiên hoàn thành trước 7:00 sáng',   check:(s)=>s.earlyBirdCount>=5 },
  { id:'early_bird_10',  category:'timeofday', tier:'silver',   icon:'🌞', label:'Buổi Sáng Là Của Tao',  description:'10 phiên hoàn thành trước 7:00 sáng',  check:(s)=>s.earlyBirdCount>=10 },
  { id:'early_bird_25',  category:'timeofday', tier:'silver',   icon:'☀️', label:'Học Sinh Chăm Chỉ',    description:'25 phiên hoàn thành trước 7:00 sáng',  check:(s)=>s.earlyBirdCount>=25 },
  { id:'early_bird_50',  category:'timeofday', tier:'gold',     icon:'🌻', label:'Bình Minh Chiến Binh',  description:'50 phiên hoàn thành trước 7:00 sáng',  check:(s)=>s.earlyBirdCount>=50 },
  { id:'early_bird_100', category:'timeofday', tier:'platinum', icon:'🦅', label:'Đại Bàng Bình Minh',    description:'100 phiên hoàn thành trước 7:00 sáng', check:(s)=>s.earlyBirdCount>=100 },
  { id:'dawn_1',         category:'timeofday', tier:'bronze',   icon:'🌙', label:'Dậy Sớm',               description:'1 phiên hoàn thành trước 6:00 sáng',   check:(s)=>s.dawnCount>=1 },
  { id:'dawn_10',        category:'timeofday', tier:'silver',   icon:'⭐', label:'Canh Tư Học Bài',       description:'10 phiên hoàn thành trước 6:00 sáng',  check:(s)=>s.dawnCount>=10 },
  { id:'dawn_50',        category:'timeofday', tier:'gold',     icon:'🌟', label:'Bình Minh Bất Động',    description:'50 phiên hoàn thành trước 6:00 sáng',  check:(s)=>s.dawnCount>=50 },
  { id:'five_am_1',      category:'timeofday', tier:'silver',   icon:'🌠', label:'Club 5 Giờ Sáng',       description:'1 phiên bắt đầu lúc 5:00–6:00 sáng',  check:(s)=>s.fiveAmCount>=1 },
  { id:'five_am_20',     category:'timeofday', tier:'gold',     icon:'💫', label:'Người Của 5 Giờ Sáng',  description:'20 phiên bắt đầu lúc 5:00–6:00 sáng', check:(s)=>s.fiveAmCount>=20 },
  { id:'night_owl_1',    category:'timeofday', tier:'bronze',   icon:'🦉', label:'Cú Đêm',                description:'1 phiên hoàn thành sau 23:00',          check:(s)=>s.nightOwlCount>=1 },
  { id:'night_owl_5',    category:'timeofday', tier:'bronze',   icon:'🌙', label:'Thức Khuya Học Bài',    description:'5 phiên hoàn thành sau 23:00',          check:(s)=>s.nightOwlCount>=5 },
  { id:'night_owl_10',   category:'timeofday', tier:'silver',   icon:'🔭', label:'Nhà Thiên Văn',         description:'10 phiên hoàn thành sau 23:00',         check:(s)=>s.nightOwlCount>=10 },
  { id:'night_owl_25',   category:'timeofday', tier:'silver',   icon:'🌌', label:'Kẻ Yêu Bóng Tối',      description:'25 phiên hoàn thành sau 23:00',         check:(s)=>s.nightOwlCount>=25 },
  { id:'night_owl_50',   category:'timeofday', tier:'gold',     icon:'🦇', label:'Ma Cà Rồng Học Thuật',  description:'50 phiên hoàn thành sau 23:00',         check:(s)=>s.nightOwlCount>=50 },
  { id:'night_owl_100',  category:'timeofday', tier:'platinum', icon:'👁️', label:'Chúa Tể Bóng Đêm',    description:'100 phiên hoàn thành sau 23:00',        check:(s)=>s.nightOwlCount>=100 },
  { id:'midnight_1',     category:'timeofday', tier:'silver',   icon:'🌃', label:'Nửa Đêm Thức Giấc',    description:'1 phiên hoàn thành sau 0:00 đêm',       check:(s)=>s.midnightCount>=1 },
  { id:'midnight_5',     category:'timeofday', tier:'gold',     icon:'🌑', label:'Học Giả Nửa Đêm',      description:'5 phiên hoàn thành sau 0:00 đêm',       check:(s)=>s.midnightCount>=5 },
  { id:'midnight_20',    category:'timeofday', tier:'platinum', icon:'🌙', label:'Huyền Thoại Nửa Đêm',  description:'20 phiên hoàn thành sau 0:00 đêm',      check:(s)=>s.midnightCount>=20 },
  { id:'lunch_1',        category:'timeofday', tier:'bronze',   icon:'☕', label:'Giờ Ăn Trưa Tập Trung', description:'1 phiên lúc 12:00–13:00',              check:(s)=>s.lunchCount>=1 },
  { id:'lunch_10',       category:'timeofday', tier:'silver',   icon:'🍱', label:'Chiến Binh Giờ Trưa',   description:'10 phiên lúc 12:00–13:00',             check:(s)=>s.lunchCount>=10 },
  { id:'lunch_30',       category:'timeofday', tier:'gold',     icon:'🏆', label:'Vô Địch Giờ Trưa',      description:'30 phiên lúc 12:00–13:00',             check:(s)=>s.lunchCount>=30 },
  { id:'teatime_5',      category:'timeofday', tier:'bronze',   icon:'🍵', label:'Giờ Trà Chiều',         description:'5 phiên lúc 15:00–16:00',              check:(s)=>s.teatimeCount>=5 },
  { id:'teatime_25',     category:'timeofday', tier:'silver',   icon:'🫖', label:'Thói Quen Trà Chiều',   description:'25 phiên lúc 15:00–16:00',             check:(s)=>s.teatimeCount>=25 },
  { id:'afternoon_20',   category:'timeofday', tier:'silver',   icon:'🌤️',label:'Chiều Tà Tập Trung',    description:'20 phiên lúc 14:00–17:00',             check:(s)=>s.afternoonCount>=20 },
  { id:'afternoon_50',   category:'timeofday', tier:'gold',     icon:'🌅', label:'Buổi Chiều Vàng',       description:'50 phiên lúc 14:00–17:00',             check:(s)=>s.afternoonCount>=50 },
  { id:'evening_20',     category:'timeofday', tier:'silver',   icon:'🌆', label:'Tối Về Học Bài',        description:'20 phiên lúc 18:00–22:00',             check:(s)=>s.eveningCount>=20 },
  { id:'evening_50',     category:'timeofday', tier:'gold',     icon:'🌃', label:'Đêm Nhộn Nhịp',         description:'50 phiên lúc 18:00–22:00',             check:(s)=>s.eveningCount>=50 },
  { id:'sunrise_10',     category:'timeofday', tier:'silver',   icon:'🌄', label:'Bình Minh Tri Thức',    description:'10 phiên lúc 6:00–7:00 sáng',         check:(s)=>s.sunriseCount>=10 },
  { id:'full_day_1',     category:'timeofday', tier:'gold',     icon:'🌞', label:'Anh Hùng Cả Ngày',      description:'1 ngày có phiên cả sáng, chiều và tối', check:(s)=>s.fullDayCount>=1 },
  { id:'full_day_5',     category:'timeofday', tier:'platinum', icon:'🌈', label:'Ngày Tràn Đầy Năng Lượng', description:'5 ngày có phiên cả sáng, chiều và tối', check:(s)=>s.fullDayCount>=5 },

  // ══ THÀNH TÍCH NĂM (28) ══════════════════════════════════════════════════
  { id:'year_start',      category:'annual', tier:'bronze',   icon:'🗓️',label:'Chào Năm Mới',          description:'Phiên đầu tiên trong năm dương lịch',         check:(s)=>s.sessionsThisYear>=1 },
  { id:'year_jan',        category:'annual', tier:'bronze',   icon:'❄️', label:'Tháng Giêng Bắt Đầu',  description:'Có phiên tập trung trong tháng 1',            check:(s)=>s.janCount>=1 },
  { id:'year_feb',        category:'annual', tier:'bronze',   icon:'💝', label:'Tháng Hai Yêu Thương',  description:'Có phiên tập trung trong tháng 2',            check:(s)=>s.febCount>=1 },
  { id:'year_mar',        category:'annual', tier:'bronze',   icon:'🌸', label:'Tháng Ba Nảy Mầm',      description:'Có phiên tập trung trong tháng 3',            check:(s)=>s.marCount>=1 },
  { id:'year_apr',        category:'annual', tier:'bronze',   icon:'🌧️',label:'Tháng Tư Mưa Rào',      description:'Có phiên tập trung trong tháng 4',            check:(s)=>s.aprCount>=1 },
  { id:'year_may',        category:'annual', tier:'bronze',   icon:'🌺', label:'Tháng Năm Rực Rỡ',      description:'Có phiên tập trung trong tháng 5',            check:(s)=>s.mayCount>=1 },
  { id:'year_jun',        category:'annual', tier:'bronze',   icon:'☀️', label:'Tháng Sáu Mùa Hè',     description:'Có phiên tập trung trong tháng 6',            check:(s)=>s.junCount>=1 },
  { id:'year_jul',        category:'annual', tier:'bronze',   icon:'🌊', label:'Tháng Bảy Biển Xanh',   description:'Có phiên tập trung trong tháng 7',            check:(s)=>s.julCount>=1 },
  { id:'year_aug',        category:'annual', tier:'bronze',   icon:'🌻', label:'Tháng Tám Nắng Vàng',   description:'Có phiên tập trung trong tháng 8',            check:(s)=>s.augCount>=1 },
  { id:'year_sep',        category:'annual', tier:'bronze',   icon:'🍂', label:'Tháng Chín Tựu Trường',  description:'Có phiên tập trung trong tháng 9',            check:(s)=>s.sepCount>=1 },
  { id:'year_oct',        category:'annual', tier:'bronze',   icon:'🎃', label:'Tháng Mười Ma Quái',     description:'Có phiên tập trung trong tháng 10',           check:(s)=>s.octCount>=1 },
  { id:'year_nov',        category:'annual', tier:'bronze',   icon:'🍁', label:'Tháng Mười Một Thu Về',  description:'Có phiên tập trung trong tháng 11',           check:(s)=>s.novCount>=1 },
  { id:'year_dec',        category:'annual', tier:'bronze',   icon:'🎄', label:'Tháng Mười Hai Lễ Hội',  description:'Có phiên tập trung trong tháng 12',           check:(s)=>s.decCount>=1 },
  { id:'year_all_months', category:'annual', tier:'gold',     icon:'📆', label:'Không Một Tháng Nghỉ',  description:'Có phiên trong đủ 12 tháng của năm nay',      check:(s)=>s.monthsActiveThisYear>=12 },
  { id:'year_q1',         category:'annual', tier:'bronze',   icon:'🌱', label:'Quý 1 Bùng Cháy',       description:'≥10 phiên trong Quý 1 (tháng 1–3)',          check:(s)=>s.q1Sessions>=10 },
  { id:'year_q2',         category:'annual', tier:'bronze',   icon:'🌿', label:'Quý 2 Phát Triển',       description:'≥10 phiên trong Quý 2 (tháng 4–6)',          check:(s)=>s.q2Sessions>=10 },
  { id:'year_q3',         category:'annual', tier:'bronze',   icon:'🌳', label:'Quý 3 Sung Mãn',         description:'≥10 phiên trong Quý 3 (tháng 7–9)',          check:(s)=>s.q3Sessions>=10 },
  { id:'year_q4',         category:'annual', tier:'bronze',   icon:'🎯', label:'Quý 4 Kết Tinh',         description:'≥10 phiên trong Quý 4 (tháng 10–12)',        check:(s)=>s.q4Sessions>=10 },
  { id:'year_50h',        category:'annual', tier:'silver',   icon:'📅', label:'Nửa Trăm Giờ Năm Nay',  description:'50 giờ tập trung trong năm nay',              check:(s)=>s.minutesThisYear>=3000 },
  { id:'year_100h',       category:'annual', tier:'gold',     icon:'🌟', label:'Trăm Giờ Vàng',          description:'100 giờ tập trung trong năm nay',             check:(s)=>s.minutesThisYear>=6000 },
  { id:'year_200h',       category:'annual', tier:'platinum', icon:'💫', label:'Siêu Sao Năm Học',        description:'200 giờ tập trung trong năm nay',             check:(s)=>s.minutesThisYear>=12000 },
  { id:'year_300h',       category:'annual', tier:'platinum', icon:'🏅', label:'Vô Địch Năm',             description:'300 giờ tập trung trong năm nay',             check:(s)=>s.minutesThisYear>=18000 },
  { id:'year_500h',       category:'annual', tier:'diamond',  icon:'👑', label:'Năm Của Nhà Vô Địch',     description:'500 giờ tập trung trong năm nay',             check:(s)=>s.minutesThisYear>=30000 },
  { id:'year_100s',       category:'annual', tier:'silver',   icon:'🎖️',label:'Trăm Phiên Năm Nay',     description:'100 phiên trong năm nay',                     check:(s)=>s.sessionsThisYear>=100 },
  { id:'year_200s',       category:'annual', tier:'gold',     icon:'🏆', label:'Hai Trăm Phiên Năm Nay', description:'200 phiên trong năm nay',                     check:(s)=>s.sessionsThisYear>=200 },
  { id:'year_365s',       category:'annual', tier:'diamond',  icon:'🌠', label:'Một Ngày Một Phiên',      description:'365 phiên trong năm — đỉnh cao ý chí',       check:(s)=>s.sessionsThisYear>=365 },
  { id:'year_comeback',   category:'annual', tier:'gold',     icon:'🦅', label:'Phượng Hoàng Tái Sinh',  description:'Nghỉ ≥30 ngày rồi quay lại trong năm nay',   check:(s)=>s.hadComebackThisYear },
  { id:'year_best_month', category:'annual', tier:'gold',     icon:'🥇', label:'Tháng Đỉnh Cao',          description:'Có tháng đạt ≥20 phiên trong năm nay',       check:(s)=>s.bestMonthSessionsThisYear>=20 },
  { id:'year_grandmaster',category:'annual', tier:'diamond',  icon:'🌌', label:'Đại Sư Năm Học',          description:'200 giờ + 365 phiên trong năm nay',           check:(s)=>s.minutesThisYear>=12000&&s.sessionsThisYear>=365 },

  // ══ THU THẬP & XÂY DỰNG (22) ═════════════════════════════════════════════
  { id:'first_blueprint', category:'collection', tier:'bronze',   icon:'📜', label:'Bản Vẽ Đầu Tiên',        description:'Thu được bản vẽ hiếm đầu tiên',         check:(s)=>s.blueprintsCount>=1 },
  { id:'blueprints_5',    category:'collection', tier:'bronze',   icon:'📋', label:'Năm Bản Vẽ',              description:'Sưu tập 5 bản vẽ',                      check:(s)=>s.blueprintsCount>=5 },
  { id:'blueprints_10',   category:'collection', tier:'silver',   icon:'🗺️', label:'Kiến Trúc Sư Tập Sự',    description:'Sưu tập 10 bản vẽ',                     check:(s)=>s.blueprintsCount>=10 },
  { id:'blueprints_20',   category:'collection', tier:'silver',   icon:'🏗️', label:'Nhà Thiết Kế',            description:'Sưu tập 20 bản vẽ',                     check:(s)=>s.blueprintsCount>=20 },
  { id:'blueprints_30',   category:'collection', tier:'gold',     icon:'📐', label:'Kiến Trúc Sư',             description:'Sưu tập 30 bản vẽ',                     check:(s)=>s.blueprintsCount>=30 },
  { id:'blueprints_50',   category:'collection', tier:'gold',     icon:'🏛️', label:'Đại Kiến Trúc Sư',        description:'Sưu tập 50 bản vẽ',                     check:(s)=>s.blueprintsCount>=50 },
  { id:'blueprints_75',   category:'collection', tier:'platinum', icon:'🌆', label:'Người Xây Thành Phố',     description:'Sưu tập 75 bản vẽ',                     check:(s)=>s.blueprintsCount>=75 },
  { id:'blueprints_100',  category:'collection', tier:'diamond',  icon:'🏙️', label:'Kiến Trúc Sư Huyền Thoại', description:'Sưu tập 100 bản vẽ',                  check:(s)=>s.blueprintsCount>=100 },
  { id:'first_relic',     category:'collection', tier:'bronze',   icon:'🌟', label:'Người Sưu Tập Huyền Thoại', description:'Chinh phục Era Crisis nhận Di Vật đầu tiên', check:(s)=>s.relicsCount>=1 },
  { id:'two_relics',      category:'collection', tier:'silver',   icon:'💫', label:'Đôi Di Vật',              description:'Sưu tầm 2 Di Vật',                      check:(s)=>s.relicsCount>=2 },
  { id:'all_relics',      category:'collection', tier:'gold',     icon:'🏛️', label:'Ghi Chép Toàn Lịch Sử',  description:'Sưu tầm đủ 3 Di Vật từ 3 Kỷ Nguyên',   check:(s)=>s.relicsCount>=3 },
  { id:'jackpot_win',     category:'collection', tier:'silver',   icon:'🎰', label:'Con Cưng Của Vận May',    description:'Kích hoạt Đại Trúng Thưởng 1 lần',      check:(s)=>s.totalJackpots>=1 },
  { id:'jackpot_3',       category:'collection', tier:'silver',   icon:'🍀', label:'Ba Lần Đại Vận',          description:'3 lần Đại Trúng Thưởng',                 check:(s)=>s.totalJackpots>=3 },
  { id:'jackpot_10',      category:'collection', tier:'gold',     icon:'💰', label:'Số Đỏ Thường Xuyên',      description:'10 lần Đại Trúng Thưởng',                check:(s)=>s.totalJackpots>=10 },
  { id:'jackpot_25',      category:'collection', tier:'gold',     icon:'🤑', label:'Chúa Vận May',             description:'25 lần Đại Trúng Thưởng',                check:(s)=>s.totalJackpots>=25 },
  { id:'jackpot_50',      category:'collection', tier:'platinum', icon:'👑', label:'Thần Tài Chính Chủ',      description:'50 lần Đại Trúng Thưởng',                check:(s)=>s.totalJackpots>=50 },
  { id:'jackpot_100',     category:'collection', tier:'diamond',  icon:'💸', label:'Vua Jackpot',              description:'100 lần Đại Trúng Thưởng',               check:(s)=>s.totalJackpots>=100 },
  { id:'crafter_first',   category:'collection', tier:'bronze',   icon:'🔨', label:'Thợ Xây Đầu Tiên',        description:'Xây dựng công trình đầu tiên',           check:(s)=>s.buildingsBuilt>=1 },
  { id:'crafter_3',       category:'collection', tier:'bronze',   icon:'🏠', label:'Khu Nhà Nhỏ',              description:'Xây dựng 3 công trình',                  check:(s)=>s.buildingsBuilt>=3 },
  { id:'crafter_5',       category:'collection', tier:'silver',   icon:'🏰', label:'Kiến Trúc Sư Thực Thụ',   description:'Xây dựng 5 công trình',                  check:(s)=>s.buildingsBuilt>=5 },
  { id:'crafter_10',      category:'collection', tier:'gold',     icon:'🌆', label:'Người Xây Thành Phố',      description:'Xây dựng 10 công trình',                 check:(s)=>s.buildingsBuilt>=10 },
  { id:'prestige_first',  category:'collection', tier:'gold',     icon:'♾️', label:'Vòng Lặp Đầu Tiên',       description:'Hoàn thành Prestige lần đầu',            check:(s)=>s.prestigeCount>=1 },
  { id:'prestige_3',      category:'collection', tier:'diamond',  icon:'🌀', label:'Ba Vòng Lặp',              description:'Hoàn thành Prestige 3 lần',              check:(s)=>s.prestigeCount>=3 },

  // ══ PHIÊN ĐẶC BIỆT (22) ══════════════════════════════════════════════════
  { id:'marathon_session',   category:'session_type', tier:'silver',   icon:'🏃', label:'Marathon Tập Trung',    description:'1 phiên ≥90 phút',                      check:(s)=>s.maxSessionMinutes>=90 },
  { id:'ultra_marathon',     category:'session_type', tier:'gold',     icon:'🚀', label:'Siêu Marathon',          description:'1 phiên ≥120 phút',                     check:(s)=>s.maxSessionMinutes>=120 },
  { id:'titan_session',      category:'session_type', tier:'platinum', icon:'🏋️', label:'Titan Tập Trung',       description:'1 phiên ≥150 phút',                     check:(s)=>s.maxSessionMinutes>=150 },
  { id:'godlike_session',    category:'session_type', tier:'diamond',  icon:'⚡', label:'Sức Mạnh Thần Thánh',   description:'1 phiên ≥180 phút',                     check:(s)=>s.maxSessionMinutes>=180 },
  { id:'deep_focus_5',       category:'session_type', tier:'bronze',   icon:'🧘', label:'Tập Trung Sâu',          description:'5 phiên ≥60 phút',                      check:(s)=>s.deepFocusCount>=5 },
  { id:'deep_focus_10',      category:'session_type', tier:'silver',   icon:'🌊', label:'Thiền Sâu',              description:'10 phiên ≥60 phút',                     check:(s)=>s.deepFocusCount>=10 },
  { id:'deep_focus_25',      category:'session_type', tier:'silver',   icon:'🔮', label:'Trạng Thái Dòng Chảy',   description:'25 phiên ≥60 phút',                     check:(s)=>s.deepFocusCount>=25 },
  { id:'deep_focus_50',      category:'session_type', tier:'gold',     icon:'💎', label:'Đại Dương Tĩnh Lặng',    description:'50 phiên ≥60 phút',                     check:(s)=>s.deepFocusCount>=50 },
  { id:'deep_focus_100',     category:'session_type', tier:'platinum', icon:'🌌', label:'Bậc Thầy Tĩnh Tâm',     description:'100 phiên ≥60 phút',                    check:(s)=>s.deepFocusCount>=100 },
  { id:'ultra_focus_10',     category:'session_type', tier:'gold',     icon:'🔥', label:'Lửa Marathon',           description:'10 phiên ≥90 phút',                     check:(s)=>s.ultraFocusCount>=10 },
  { id:'ultra_focus_25',     category:'session_type', tier:'platinum', icon:'🌋', label:'Núi Lửa Ý Chí',          description:'25 phiên ≥90 phút',                     check:(s)=>s.ultraFocusCount>=25 },
  { id:'power_day_4',        category:'session_type', tier:'silver',   icon:'💥', label:'Ngày Bùng Nổ',           description:'≥4 phiên trong 1 ngày',                 check:(s)=>s.maxSessionsInDay>=4 },
  { id:'power_day_6',        category:'session_type', tier:'gold',     icon:'🌋', label:'Núi Lửa Tập Trung',      description:'≥6 phiên trong 1 ngày',                 check:(s)=>s.maxSessionsInDay>=6 },
  { id:'power_day_8',        category:'session_type', tier:'platinum', icon:'⚡', label:'Sấm Sét Không Ngừng',    description:'≥8 phiên trong 1 ngày',                 check:(s)=>s.maxSessionsInDay>=8 },
  { id:'power_day_10',       category:'session_type', tier:'diamond',  icon:'🌀', label:'Xoáy Tập Trung',         description:'≥10 phiên trong 1 ngày',                check:(s)=>s.maxSessionsInDay>=10 },
  { id:'weekend_warrior_10', category:'session_type', tier:'bronze',   icon:'🎮', label:'Chiến Binh Cuối Tuần',   description:'10 phiên vào Thứ Bảy hoặc Chủ Nhật',   check:(s)=>s.weekendCount>=10 },
  { id:'weekend_warrior_50', category:'session_type', tier:'silver',   icon:'🏆', label:'Vua Cuối Tuần',           description:'50 phiên vào Thứ Bảy hoặc Chủ Nhật',   check:(s)=>s.weekendCount>=50 },
  { id:'legend_focus_5',     category:'session_type', tier:'diamond',  icon:'👑', label:'Huyền Thoại Tập Trung',  description:'5 phiên ≥180 phút',                     check:(s)=>s.legendFocusCount>=5 },
  { id:'active_days_100',    category:'session_type', tier:'silver',   icon:'📅', label:'Trăm Ngày Hoạt Động',    description:'100 ngày khác nhau có ít nhất 1 phiên', check:(s)=>s.totalActiveDays>=100 },
  { id:'active_days_365',    category:'session_type', tier:'gold',     icon:'🗓️', label:'365 Ngày Hoạt Động',    description:'365 ngày khác nhau có ít nhất 1 phiên', check:(s)=>s.totalActiveDays>=365 },
  { id:'category_explorer',  category:'session_type', tier:'silver',   icon:'🗂️', label:'Khám Phá Đa Lĩnh Vực',  description:'Sử dụng ≥4 danh mục tập trung',         check:(s)=>s.uniqueCategoriesUsed>=4 },
  { id:'category_master',    category:'session_type', tier:'gold',     icon:'🎓', label:'Bậc Thầy Đa Lĩnh Vực',  description:'Sử dụng ≥7 danh mục tập trung',         check:(s)=>s.uniqueCategoriesUsed>=7 },

  // ══ GHI CHÚ (14) ══════════════════════════════════════════════════════════
  { id:'note_1',        category:'notes', tier:'bronze',   icon:'✏️', label:'Bút Đầu Tiên',         description:'Ghi chú trong 1 phiên',       check:(s)=>s.totalNoteCount>=1 },
  { id:'note_5',        category:'notes', tier:'bronze',   icon:'📝', label:'Bắt Đầu Ghi Nhật Ký',  description:'Ghi chú trong 5 phiên',       check:(s)=>s.totalNoteCount>=5 },
  { id:'note_10',       category:'notes', tier:'bronze',   icon:'📒', label:'Nhật Ký Tập Sự',        description:'Ghi chú trong 10 phiên',      check:(s)=>s.totalNoteCount>=10 },
  { id:'note_25',       category:'notes', tier:'silver',   icon:'📓', label:'Nhà Ghi Chép',           description:'Ghi chú trong 25 phiên',      check:(s)=>s.totalNoteCount>=25 },
  { id:'note_50',       category:'notes', tier:'silver',   icon:'✍️', label:'Học Giả Ghi Chép',      description:'Ghi chú trong 50 phiên',      check:(s)=>s.totalNoteCount>=50 },
  { id:'note_100',      category:'notes', tier:'gold',     icon:'📔', label:'Biên Niên Sử Nhỏ',       description:'Ghi chú trong 100 phiên',     check:(s)=>s.totalNoteCount>=100 },
  { id:'note_200',      category:'notes', tier:'gold',     icon:'📖', label:'Cuốn Sách Của Tôi',      description:'Ghi chú trong 200 phiên',     check:(s)=>s.totalNoteCount>=200 },
  { id:'note_365',      category:'notes', tier:'platinum', icon:'🗒️', label:'Một Năm Ghi Chép',      description:'Ghi chú trong 365 phiên',     check:(s)=>s.totalNoteCount>=365 },
  { id:'note_500',      category:'notes', tier:'platinum', icon:'📚', label:'Thư Viện Cá Nhân',       description:'Ghi chú trong 500 phiên',     check:(s)=>s.totalNoteCount>=500 },
  { id:'note_1000',     category:'notes', tier:'diamond',  icon:'🏛️', label:'Biên Niên Sử Đại',      description:'Ghi chú trong 1000 phiên',    check:(s)=>s.totalNoteCount>=1000 },
  { id:'note_long_1',   category:'notes', tier:'silver',   icon:'📜', label:'Ghi Chú Sâu Sắc',        description:'1 ghi chú ≥150 ký tự',        check:(s)=>s.longNoteCount>=1 },
  { id:'note_long_10',  category:'notes', tier:'gold',     icon:'📕', label:'Nhà Tư Tưởng',            description:'10 ghi chú ≥150 ký tự',       check:(s)=>s.longNoteCount>=10 },
  { id:'note_long_50',  category:'notes', tier:'platinum', icon:'📗', label:'Triết Gia',               description:'50 ghi chú ≥150 ký tự',       check:(s)=>s.longNoteCount>=50 },
  { id:'note_long_100', category:'notes', tier:'diamond',  icon:'🎭', label:'Nhà Hiền Triết',          description:'100 ghi chú ≥150 ký tự',      check:(s)=>s.longNoteCount>=100 },

  // ══ KỶ NGUYÊN & BẬC (17) ══════════════════════════════════════════════════
  { id:'era_2',      category:'era_rank', tier:'bronze',   icon:'🌍', label:'Kỷ Nguyên Mới',           description:'Bước vào Quyển 2',                  check:(s)=>s.activeBook>=2 },
  { id:'era_3',      category:'era_rank', tier:'bronze',   icon:'🌎', label:'Thế Giới Thứ Ba',          description:'Bước vào Quyển 3',                  check:(s)=>s.activeBook>=3 },
  { id:'era_4',      category:'era_rank', tier:'silver',   icon:'🌏', label:'Bốn Phương Đất Trời',      description:'Bước vào Quyển 4',                  check:(s)=>s.activeBook>=4 },
  { id:'era_5',      category:'era_rank', tier:'silver',   icon:'🌌', label:'Giữa Ngân Hà',             description:'Bước vào Quyển 5',                  check:(s)=>s.activeBook>=5 },
  { id:'era_6',      category:'era_rank', tier:'gold',     icon:'🚀', label:'Người Thám Hiểm Vũ Trụ',  description:'Bước vào Quyển 6',                  check:(s)=>s.activeBook>=6 },
  { id:'era_7',      category:'era_rank', tier:'gold',     icon:'⭐', label:'Ánh Sao Thứ Bảy',          description:'Bước vào Quyển 7',                  check:(s)=>s.activeBook>=7 },
  { id:'era_8',      category:'era_rank', tier:'platinum', icon:'🌠', label:'Ranh Giới Vũ Trụ',         description:'Bước vào Quyển 8',                  check:(s)=>s.activeBook>=8 },
  { id:'era_9',      category:'era_rank', tier:'platinum', icon:'💫', label:'Gần Đến Đỉnh',             description:'Bước vào Quyển 9',                  check:(s)=>s.activeBook>=9 },
  { id:'era_10',     category:'era_rank', tier:'diamond',  icon:'👑', label:'Phi Hành Gia Lịch Sử',    description:'Bước vào Quyển 10',                 check:(s)=>s.activeBook>=10 },
  { id:'rank_2',     category:'era_rank', tier:'bronze',   icon:'🥈', label:'Bước Lên Bậc Hai',         description:'Đạt rank 2 trong bất kỳ Kỷ Nguyên', check:(s)=>s.maxRankAchieved>=2 },
  { id:'rank_4',     category:'era_rank', tier:'silver',   icon:'🏅', label:'Danh Dự',                  description:'Đạt rank 4',                         check:(s)=>s.maxRankAchieved>=4 },
  { id:'rank_5',     category:'era_rank', tier:'gold',     icon:'🥇', label:'Tinh Hoa',                 description:'Đạt rank 5',                         check:(s)=>s.maxRankAchieved>=5 },
  { id:'rank_6',     category:'era_rank', tier:'platinum', icon:'💎', label:'Bậc Thầy Kỷ Nguyên',      description:'Đạt rank 6',                         check:(s)=>s.maxRankAchieved>=6 },
  { id:'max_rank',   category:'era_rank', tier:'platinum', icon:'👑', label:'Đỉnh Phong Danh Vọng',     description:'Đạt rank 7 — bậc danh xưng tối cao', check:(s)=>s.maxRankAchieved>=7 },
  { id:'prestige_1', category:'era_rank', tier:'gold',     icon:'♾️', label:'Vòng Lặp Mới',             description:'Hoàn thành Prestige lần đầu',        check:(s)=>s.prestigeCount>=1 },
  { id:'prestige_5', category:'era_rank', tier:'platinum', icon:'🌀', label:'Năm Vòng Lặp',             description:'Hoàn thành Prestige 5 lần',           check:(s)=>s.prestigeCount>=5 },
  { id:'prestige_10',category:'era_rank', tier:'diamond',  icon:'∞',  label:'Vô Tận',                   description:'Hoàn thành Prestige 10 lần',          check:(s)=>s.prestigeCount>=10 },

  // ══ NGÀY TRONG TUẦN (28) ══════════════════════════════════════════════════
  { id:'mon_10', category:'day_of_week', tier:'bronze', icon:'📅', label:'Thứ Hai Năng Động',   description:'10 phiên vào Thứ Hai',   check:(s)=>s.monCount>=10 },
  { id:'tue_10', category:'day_of_week', tier:'bronze', icon:'📅', label:'Thứ Ba Bật Máy',      description:'10 phiên vào Thứ Ba',    check:(s)=>s.tueCount>=10 },
  { id:'wed_10', category:'day_of_week', tier:'bronze', icon:'📅', label:'Thứ Tư Giữa Tuần',    description:'10 phiên vào Thứ Tư',    check:(s)=>s.wedCount>=10 },
  { id:'thu_10', category:'day_of_week', tier:'bronze', icon:'📅', label:'Thứ Năm Bứt Phá',     description:'10 phiên vào Thứ Năm',   check:(s)=>s.thuCount>=10 },
  { id:'fri_10', category:'day_of_week', tier:'bronze', icon:'📅', label:'Thứ Sáu Kết Tuần',    description:'10 phiên vào Thứ Sáu',   check:(s)=>s.friCount>=10 },
  { id:'sat_10', category:'day_of_week', tier:'bronze', icon:'📅', label:'Thứ Bảy Học Vui',     description:'10 phiên vào Thứ Bảy',   check:(s)=>s.satCount>=10 },
  { id:'sun_10', category:'day_of_week', tier:'bronze', icon:'📅', label:'Chủ Nhật Tri Thức',   description:'10 phiên vào Chủ Nhật',  check:(s)=>s.sunCount>=10 },
  { id:'mon_50', category:'day_of_week', tier:'silver', icon:'💪', label:'Chuyên Gia Thứ Hai',  description:'50 phiên vào Thứ Hai',   check:(s)=>s.monCount>=50 },
  { id:'tue_50', category:'day_of_week', tier:'silver', icon:'💪', label:'Chuyên Gia Thứ Ba',   description:'50 phiên vào Thứ Ba',    check:(s)=>s.tueCount>=50 },
  { id:'wed_50', category:'day_of_week', tier:'silver', icon:'💪', label:'Chuyên Gia Thứ Tư',   description:'50 phiên vào Thứ Tư',    check:(s)=>s.wedCount>=50 },
  { id:'thu_50', category:'day_of_week', tier:'silver', icon:'💪', label:'Chuyên Gia Thứ Năm',  description:'50 phiên vào Thứ Năm',   check:(s)=>s.thuCount>=50 },
  { id:'fri_50', category:'day_of_week', tier:'silver', icon:'💪', label:'Chuyên Gia Thứ Sáu',  description:'50 phiên vào Thứ Sáu',   check:(s)=>s.friCount>=50 },
  { id:'sat_50', category:'day_of_week', tier:'silver', icon:'🎮', label:'Chuyên Gia Thứ Bảy',  description:'50 phiên vào Thứ Bảy',   check:(s)=>s.satCount>=50 },
  { id:'sun_50', category:'day_of_week', tier:'silver', icon:'🌟', label:'Chuyên Gia Chủ Nhật', description:'50 phiên vào Chủ Nhật',  check:(s)=>s.sunCount>=50 },
  { id:'mon_100',category:'day_of_week', tier:'gold',   icon:'🔱', label:'Thứ Hai Huyền Thoại', description:'100 phiên vào Thứ Hai',  check:(s)=>s.monCount>=100 },
  { id:'tue_100',category:'day_of_week', tier:'gold',   icon:'🔱', label:'Thứ Ba Huyền Thoại',  description:'100 phiên vào Thứ Ba',   check:(s)=>s.tueCount>=100 },
  { id:'wed_100',category:'day_of_week', tier:'gold',   icon:'🔱', label:'Thứ Tư Huyền Thoại',  description:'100 phiên vào Thứ Tư',   check:(s)=>s.wedCount>=100 },
  { id:'thu_100',category:'day_of_week', tier:'gold',   icon:'🔱', label:'Thứ Năm Huyền Thoại', description:'100 phiên vào Thứ Năm',  check:(s)=>s.thuCount>=100 },
  { id:'fri_100',category:'day_of_week', tier:'gold',   icon:'🔱', label:'Thứ Sáu Huyền Thoại', description:'100 phiên vào Thứ Sáu',  check:(s)=>s.friCount>=100 },
  { id:'sat_100',category:'day_of_week', tier:'gold',   icon:'🏆', label:'Thứ Bảy Huyền Thoại', description:'100 phiên vào Thứ Bảy',  check:(s)=>s.satCount>=100 },
  { id:'sun_100',category:'day_of_week', tier:'gold',   icon:'👑', label:'Chủ Nhật Huyền Thoại',description:'100 phiên vào Chủ Nhật', check:(s)=>s.sunCount>=100 },
  { id:'weekday_100',  category:'day_of_week', tier:'silver',   icon:'🏢', label:'Nhân Viên Cần Mẫn',    description:'100 phiên vào ngày thường (T2–T6)', check:(s)=>s.weekdayCount>=100 },
  { id:'weekday_300',  category:'day_of_week', tier:'gold',     icon:'💼', label:'Siêu Nhân Văn Phòng',  description:'300 phiên vào ngày thường (T2–T6)', check:(s)=>s.weekdayCount>=300 },
  { id:'weekend_50',   category:'day_of_week', tier:'silver',   icon:'🎯', label:'Cuối Tuần Chiến Binh', description:'50 phiên vào cuối tuần',            check:(s)=>s.weekendCount>=50 },
  { id:'weekend_150',  category:'day_of_week', tier:'gold',     icon:'🏆', label:'Vua Cuối Tuần',         description:'150 phiên vào cuối tuần',           check:(s)=>s.weekendCount>=150 },
  { id:'weekend_300',  category:'day_of_week', tier:'platinum', icon:'👑', label:'Chúa Tể Cuối Tuần',    description:'300 phiên vào cuối tuần',           check:(s)=>s.weekendCount>=300 },
  { id:'all_7_days',   category:'day_of_week', tier:'gold',     icon:'🌈', label:'Học 7 Ngày Trong Tuần', description:'≥5 phiên mỗi ngày trong tuần',      check:(s)=>Math.min(s.monCount,s.tueCount,s.wedCount,s.thuCount,s.friCount,s.satCount,s.sunCount)>=5 },
  { id:'balanced_week',category:'day_of_week', tier:'platinum', icon:'⚖️', label:'Tuần Lễ Cân Bằng',     description:'≥50 phiên mỗi ngày trong tuần',     check:(s)=>Math.min(s.monCount,s.tueCount,s.wedCount,s.thuCount,s.friCount,s.satCount,s.sunCount)>=50 },

  // ══ HÀNG THÁNG (26) ═══════════════════════════════════════════════════════
  { id:'month_10',   category:'monthly', tier:'bronze',  icon:'📊', label:'Tháng 10 Phiên',        description:'Có tháng đạt ≥10 phiên',      check:(s)=>s.bestMonthSessions>=10 },
  { id:'month_20',   category:'monthly', tier:'silver',  icon:'📈', label:'Tháng 20 Phiên',        description:'Có tháng đạt ≥20 phiên',      check:(s)=>s.bestMonthSessions>=20 },
  { id:'month_30',   category:'monthly', tier:'silver',  icon:'🔥', label:'Tháng Sung Mãn',         description:'Có tháng đạt ≥30 phiên',      check:(s)=>s.bestMonthSessions>=30 },
  { id:'month_50',   category:'monthly', tier:'gold',    icon:'⚡', label:'Tháng Bùng Nổ',          description:'Có tháng đạt ≥50 phiên',      check:(s)=>s.bestMonthSessions>=50 },
  { id:'month_100',  category:'monthly', tier:'diamond', icon:'🌌', label:'Tháng Huyền Thoại',      description:'Có tháng đạt ≥100 phiên',     check:(s)=>s.bestMonthSessions>=100 },
  { id:'month_5h',   category:'monthly', tier:'bronze',  icon:'⏰', label:'5 Giờ Tháng Này',        description:'Có tháng đạt ≥5 giờ',         check:(s)=>s.bestMonthMinutes>=300 },
  { id:'month_10h',  category:'monthly', tier:'silver',  icon:'📚', label:'10 Giờ Một Tháng',       description:'Có tháng đạt ≥10 giờ',        check:(s)=>s.bestMonthMinutes>=600 },
  { id:'month_20h',  category:'monthly', tier:'silver',  icon:'🕰️', label:'20 Giờ Vàng',           description:'Có tháng đạt ≥20 giờ',        check:(s)=>s.bestMonthMinutes>=1200 },
  { id:'month_30h',  category:'monthly', tier:'gold',    icon:'🔮', label:'Ba Mươi Giờ',            description:'Có tháng đạt ≥30 giờ',        check:(s)=>s.bestMonthMinutes>=1800 },
  { id:'month_50h',  category:'monthly', tier:'platinum',icon:'💎', label:'Tháng Kim Cương',         description:'Có tháng đạt ≥50 giờ',        check:(s)=>s.bestMonthMinutes>=3000 },
  { id:'jan_20',     category:'monthly', tier:'silver',  icon:'❄️', label:'Tháng Giêng Tập Trung',  description:'≥20 phiên vào tháng 1',       check:(s)=>s.janCount>=20 },
  { id:'feb_20',     category:'monthly', tier:'silver',  icon:'💝', label:'Tháng Hai Tập Trung',    description:'≥20 phiên vào tháng 2',       check:(s)=>s.febCount>=20 },
  { id:'mar_20',     category:'monthly', tier:'silver',  icon:'🌸', label:'Tháng Ba Tập Trung',     description:'≥20 phiên vào tháng 3',       check:(s)=>s.marCount>=20 },
  { id:'apr_20',     category:'monthly', tier:'silver',  icon:'🌧️',label:'Tháng Tư Tập Trung',     description:'≥20 phiên vào tháng 4',       check:(s)=>s.aprCount>=20 },
  { id:'may_20',     category:'monthly', tier:'silver',  icon:'🌺', label:'Tháng Năm Tập Trung',    description:'≥20 phiên vào tháng 5',       check:(s)=>s.mayCount>=20 },
  { id:'jun_20',     category:'monthly', tier:'silver',  icon:'☀️', label:'Tháng Sáu Tập Trung',   description:'≥20 phiên vào tháng 6',       check:(s)=>s.junCount>=20 },
  { id:'jul_20',     category:'monthly', tier:'silver',  icon:'🌊', label:'Tháng Bảy Tập Trung',    description:'≥20 phiên vào tháng 7',       check:(s)=>s.julCount>=20 },
  { id:'aug_20',     category:'monthly', tier:'silver',  icon:'🌻', label:'Tháng Tám Tập Trung',    description:'≥20 phiên vào tháng 8',       check:(s)=>s.augCount>=20 },
  { id:'sep_20',     category:'monthly', tier:'silver',  icon:'🍂', label:'Tháng Chín Tập Trung',   description:'≥20 phiên vào tháng 9',       check:(s)=>s.sepCount>=20 },
  { id:'oct_20',     category:'monthly', tier:'silver',  icon:'🎃', label:'Tháng Mười Tập Trung',   description:'≥20 phiên vào tháng 10',      check:(s)=>s.octCount>=20 },
  { id:'nov_20',     category:'monthly', tier:'silver',  icon:'🍁', label:'Tháng 11 Tập Trung',     description:'≥20 phiên vào tháng 11',      check:(s)=>s.novCount>=20 },
  { id:'dec_20',     category:'monthly', tier:'silver',  icon:'🎄', label:'Tháng 12 Tập Trung',     description:'≥20 phiên vào tháng 12',      check:(s)=>s.decCount>=20 },
  { id:'q1_champion',category:'monthly', tier:'gold',    icon:'🌱', label:'Quán Quân Quý 1',         description:'≥30 phiên trong Quý 1',       check:(s)=>s.q1Sessions>=30 },
  { id:'q2_champion',category:'monthly', tier:'gold',    icon:'🌿', label:'Quán Quân Quý 2',         description:'≥30 phiên trong Quý 2',       check:(s)=>s.q2Sessions>=30 },
  { id:'q3_champion',category:'monthly', tier:'gold',    icon:'🌳', label:'Quán Quân Quý 3',         description:'≥30 phiên trong Quý 3',       check:(s)=>s.q3Sessions>=30 },
  { id:'q4_champion',category:'monthly', tier:'gold',    icon:'🎯', label:'Quán Quân Quý 4',         description:'≥30 phiên trong Quý 4',       check:(s)=>s.q4Sessions>=30 },

  // ══ XP & CẤP ĐỘ (20) ════════════════════════════════════════════════════
  { id:'xp_1000',    category:'xp_level', tier:'bronze',   icon:'⭐', label:'1 Nghìn XP',            description:'Tích lũy 1,000 XP',     check:(s)=>s.totalXP>=1000 },
  { id:'xp_5000',    category:'xp_level', tier:'bronze',   icon:'🌟', label:'5 Nghìn XP',            description:'Tích lũy 5,000 XP',     check:(s)=>s.totalXP>=5000 },
  { id:'xp_10000',   category:'xp_level', tier:'silver',   icon:'💫', label:'10 Nghìn XP',           description:'Tích lũy 10,000 XP',    check:(s)=>s.totalXP>=10000 },
  { id:'xp_25000',   category:'xp_level', tier:'silver',   icon:'✨', label:'25 Nghìn XP',           description:'Tích lũy 25,000 XP',    check:(s)=>s.totalXP>=25000 },
  { id:'xp_50000',   category:'xp_level', tier:'gold',     icon:'🔥', label:'50 Nghìn XP',           description:'Tích lũy 50,000 XP',    check:(s)=>s.totalXP>=50000 },
  { id:'xp_100000',  category:'xp_level', tier:'gold',     icon:'💎', label:'100 Nghìn XP',          description:'Tích lũy 100,000 XP',   check:(s)=>s.totalXP>=100000 },
  { id:'xp_250000',  category:'xp_level', tier:'platinum', icon:'👑', label:'250 Nghìn XP',          description:'Tích lũy 250,000 XP',   check:(s)=>s.totalXP>=250000 },
  { id:'xp_500000',  category:'xp_level', tier:'platinum', icon:'🌌', label:'Nửa Triệu XP',          description:'Tích lũy 500,000 XP',   check:(s)=>s.totalXP>=500000 },
  { id:'xp_1000000', category:'xp_level', tier:'diamond',  icon:'∞',  label:'Triệu XP Huyền Thoại', description:'Tích lũy 1,000,000 XP', check:(s)=>s.totalXP>=1000000 },
  { id:'level_5',    category:'xp_level', tier:'bronze',   icon:'🌱', label:'Cấp 5',                 description:'Đạt cấp độ 5',          check:(s)=>s.playerLevel>=5 },
  { id:'level_10',   category:'xp_level', tier:'silver',   icon:'🌿', label:'Cấp 10',                description:'Đạt cấp độ 10',         check:(s)=>s.playerLevel>=10 },
  { id:'level_20',   category:'xp_level', tier:'silver',   icon:'🌳', label:'Cấp 20',                description:'Đạt cấp độ 20',         check:(s)=>s.playerLevel>=20 },
  { id:'level_30',   category:'xp_level', tier:'gold',     icon:'🔥', label:'Cấp 30',                description:'Đạt cấp độ 30',         check:(s)=>s.playerLevel>=30 },
  { id:'level_50',   category:'xp_level', tier:'gold',     icon:'⚡', label:'Cấp 50',                description:'Đạt cấp độ 50',         check:(s)=>s.playerLevel>=50 },
  { id:'level_75',   category:'xp_level', tier:'platinum', icon:'💎', label:'Cấp 75',                description:'Đạt cấp độ 75',         check:(s)=>s.playerLevel>=75 },
  { id:'level_100',  category:'xp_level', tier:'diamond',  icon:'👑', label:'Cấp 100',               description:'Đạt cấp độ 100',        check:(s)=>s.playerLevel>=100 },
  { id:'days_30',    category:'xp_level', tier:'bronze',   icon:'📅', label:'30 Ngày Cùng CivJourney',description:'30 ngày kể từ phiên đầu', check:(s)=>s.daysSinceFirst>=30 },
  { id:'days_100',   category:'xp_level', tier:'silver',   icon:'🗓️', label:'100 Ngày',               description:'100 ngày kể từ phiên đầu', check:(s)=>s.daysSinceFirst>=100 },
  { id:'days_365',   category:'xp_level', tier:'gold',     icon:'🌟', label:'Một Năm Cùng CivJourney',description:'365 ngày kể từ phiên đầu', check:(s)=>s.daysSinceFirst>=365 },
  { id:'days_730',   category:'xp_level', tier:'diamond',  icon:'∞',  label:'Hai Năm Cùng CivJourney',description:'730 ngày kể từ phiên đầu', check:(s)=>s.daysSinceFirst>=730 },

  // ══ ĐẶC BIỆT & BÍ ẨN (27) ════════════════════════════════════════════════
  { id:'pi_day',         category:'special', tier:'gold',     icon:'π',  label:'Ngày Pi',               description:'Phiên vào ngày 14/3 (Pi Day)',                        check:(s)=>s.hasMar14Session },
  { id:'valentine',      category:'special', tier:'silver',   icon:'💝', label:'Tình Yêu Tri Thức',     description:'Phiên vào ngày 14/2 (Valentine)',                    check:(s)=>s.hasFeb14Session },
  { id:'christmas',      category:'special', tier:'silver',   icon:'🎄', label:'Giáng Sinh Học Bài',    description:'Phiên vào ngày 25/12',                               check:(s)=>s.hasDec25Session },
  { id:'new_year_day',   category:'special', tier:'gold',     icon:'🎆', label:'Năm Mới Khởi Động',     description:'Phiên vào ngày 1/1',                                 check:(s)=>s.hasJan1Session },
  { id:'new_year_eve',   category:'special', tier:'silver',   icon:'🎇', label:'Đêm Giao Thừa Học Bài', description:'Phiên vào ngày 31/12',                               check:(s)=>s.hasDec31Session },
  { id:'womens_day',     category:'special', tier:'silver',   icon:'🌸', label:'Ngày Phụ Nữ',           description:'Phiên vào ngày 8/3',                                 check:(s)=>s.hasMar8Session },
  { id:'teachers_day',   category:'special', tier:'gold',     icon:'🍎', label:'Tôn Sư Trọng Đạo',     description:'Phiên vào Ngày Nhà Giáo VN (20/11)',                 check:(s)=>s.hasNov20Session },
  { id:'summer_solstice',category:'special', tier:'silver',   icon:'☀️', label:'Hạ Chí Bất Khuất',     description:'Phiên vào ngày 21/6',                                check:(s)=>s.hasJun21Session },
  { id:'triple_seven',   category:'special', tier:'diamond',  icon:'🍀', label:'777 — Số Huyền Thoại', description:'Đạt đúng 777 phiên tập trung',                        check:(s)=>s.sessionsCompleted>=777 },
  { id:'lucky_7_day',    category:'special', tier:'gold',     icon:'7️⃣',label:'Ngày Thất Tốt Lành',   description:'Đúng 7 phiên trong 1 ngày',                           check:(s)=>s.maxSessionsInDay>=7 },
  { id:'fibonacci_144',  category:'special', tier:'gold',     icon:'🌀', label:'Fibonacci 144',         description:'144 phiên — số Fibonacci huyền diệu',               check:(s)=>s.sessionsCompleted>=144 },
  { id:'triple_century', category:'special', tier:'gold',     icon:'💯', label:'Trăm Phiên Trăm Giờ',  description:'≥100 phiên VÀ ≥100 giờ',                            check:(s)=>s.sessionsCompleted>=100&&s.totalFocusMinutes>=6000 },
  { id:'veteran_365',    category:'special', tier:'gold',     icon:'🦅', label:'Chiến Binh 365 Ngày',  description:'365 ngày kể từ lần đầu tập trung',                   check:(s)=>s.daysSinceFirst>=365 },
  { id:'all_categories', category:'special', tier:'platinum', icon:'🎨', label:'Người Đa Tài',          description:'Sử dụng ≥6 danh mục khác nhau',                      check:(s)=>s.uniqueCategoriesUsed>=6 },
  { id:'night_marathon', category:'special', tier:'platinum', icon:'🌙', label:'Ma Ra Tông Đêm Khuya', description:'Hoàn thành ≥1 phiên ≥90 phút sau 22:00',             check:(s)=>s.ultraFocusCount>=1&&s.nightOwlCount>=1 },
  { id:'dawn_marathon',  category:'special', tier:'platinum', icon:'🌄', label:'Bình Minh Ma Ra Tông', description:'Hoàn thành ≥1 phiên ≥90 phút trước 7:00 sáng',       check:(s)=>s.ultraFocusCount>=1&&s.earlyBirdCount>=1 },
  { id:'power_trio',     category:'special', tier:'gold',     icon:'⚔️', label:'Bộ Ba Quyền Năng',     description:'3 phiên ≥60 phút trong cùng 1 ngày',                 check:(s)=>s.deepFocusCount>=3&&s.maxSessionsInDay>=3 },
  { id:'notes_and_focus',category:'special', tier:'gold',     icon:'📝', label:'Học Có Chiều Sâu',      description:'≥50 ghi chú VÀ ≥100 giờ tập trung',                 check:(s)=>s.totalNoteCount>=50&&s.totalFocusMinutes>=6000 },
  { id:'collector_focus',category:'special', tier:'platinum', icon:'🎰', label:'Học Mà Vẫn Thắng',     description:'≥200 phiên VÀ ≥10 jackpots',                         check:(s)=>s.sessionsCompleted>=200&&s.totalJackpots>=10 },
  { id:'early_and_late', category:'special', tier:'gold',     icon:'🌗', label:'Sáng Sớm Và Đêm Khuya', description:'≥10 phiên sáng sớm VÀ ≥10 phiên đêm khuya',         check:(s)=>s.earlyBirdCount>=10&&s.nightOwlCount>=10 },
  { id:'world_scholar',  category:'special', tier:'diamond',  icon:'🌍', label:'Học Giả Toàn Cầu',     description:'≥500 giờ + ≥500 phiên + streak ≥30 ngày',           check:(s)=>s.totalFocusMinutes>=30000&&s.sessionsCompleted>=500&&s.longestStreak>=30 },
  { id:'time_wizard',    category:'special', tier:'diamond',  icon:'🧙', label:'Phù Thủy Thời Gian',   description:'≥1000 giờ tập trung tổng cộng',                      check:(s)=>s.totalFocusMinutes>=60000 },
  { id:'renaissance',    category:'special', tier:'diamond',  icon:'🎭', label:'Nhà Phục Hưng',         description:'≥5 kỷ nguyên + ≥200 ghi chú + ≥50 giờ/năm',        check:(s)=>s.activeBook>=5&&s.totalNoteCount>=200&&s.minutesThisYear>=3000 },
  { id:'early_grind_7',  category:'special', tier:'gold',     icon:'🌅', label:'Tuần Bình Minh',        description:'≥7 phiên sáng sớm trong 7 ngày',                     check:(s)=>s.earlyBirdCount>=7&&s.longestStreak>=7 },
  { id:'all_eras_active',category:'special', tier:'platinum', icon:'🌐', label:'Người Của Mọi Kỷ Nguyên', description:'Đạt ≥5 kỷ nguyên VÀ ≥300 phiên',                check:(s)=>s.activeBook>=5&&s.sessionsCompleted>=300 },
  { id:'super_grind',    category:'special', tier:'diamond',  icon:'💪', label:'Siêu Nỗ Lực',           description:'≥10 phiên trong 1 ngày + ≥100 giờ tổng',            check:(s)=>s.maxSessionsInDay>=10&&s.totalFocusMinutes>=6000 },
  { id:'consistent_year',category:'special', tier:'diamond',  icon:'⚖️', label:'Năm Nhất Quán',         description:'Có phiên trong 12 tháng VÀ streak ≥30 ngày',         check:(s)=>s.monthsActiveThisYear>=12&&s.longestStreak>=30 },

  // ══ THÀNH TỰU TỔNG (META) (23) ═══════════════════════════════════════════
  { id:'meta_10',   category:'meta', tier:'bronze',   icon:'🗝️', label:'Mới Bắt Đầu Sưu Tập',  description:'Mở khóa 10 thành tích',  check:(s,u)=>(u?.length??0)>=10 },
  { id:'meta_20',   category:'meta', tier:'bronze',   icon:'🔑', label:'Bộ Sưu Tập Nhỏ',        description:'Mở khóa 20 thành tích',  check:(s,u)=>(u?.length??0)>=20 },
  { id:'meta_25',   category:'meta', tier:'bronze',   icon:'📦', label:'Một Phần Tư Trăm',       description:'Mở khóa 25 thành tích',  check:(s,u)=>(u?.length??0)>=25 },
  { id:'meta_50',   category:'meta', tier:'silver',   icon:'🏅', label:'Nửa Trăm Thành Tích',    description:'Mở khóa 50 thành tích',  check:(s,u)=>(u?.length??0)>=50 },
  { id:'meta_75',   category:'meta', tier:'silver',   icon:'🌟', label:'Bảy Mươi Lăm',           description:'Mở khóa 75 thành tích',  check:(s,u)=>(u?.length??0)>=75 },
  { id:'meta_100',  category:'meta', tier:'silver',   icon:'💯', label:'Trăm Thành Tích',         description:'Mở khóa 100 thành tích', check:(s,u)=>(u?.length??0)>=100 },
  { id:'meta_125',  category:'meta', tier:'gold',     icon:'⚡', label:'Vượt Mốc 125',            description:'Mở khóa 125 thành tích', check:(s,u)=>(u?.length??0)>=125 },
  { id:'meta_150',  category:'meta', tier:'gold',     icon:'🔥', label:'Một Trăm Rưỡi',          description:'Mở khóa 150 thành tích', check:(s,u)=>(u?.length??0)>=150 },
  { id:'meta_175',  category:'meta', tier:'gold',     icon:'🌊', label:'Tiến Tới 200',            description:'Mở khóa 175 thành tích', check:(s,u)=>(u?.length??0)>=175 },
  { id:'meta_200',  category:'meta', tier:'gold',     icon:'💎', label:'Hai Trăm Thành Tích',     description:'Mở khóa 200 thành tích', check:(s,u)=>(u?.length??0)>=200 },
  { id:'meta_225',  category:'meta', tier:'platinum', icon:'🔮', label:'Hai Trăm Hai Mươi Lăm',  description:'Mở khóa 225 thành tích', check:(s,u)=>(u?.length??0)>=225 },
  { id:'meta_250',  category:'meta', tier:'platinum', icon:'🌌', label:'Nửa Đường Kim Cương',     description:'Mở khóa 250 thành tích', check:(s,u)=>(u?.length??0)>=250 },
  { id:'meta_275',  category:'meta', tier:'platinum', icon:'💫', label:'Hai Trăm Bảy Mươi Lăm',  description:'Mở khóa 275 thành tích', check:(s,u)=>(u?.length??0)>=275 },
  { id:'meta_300',  category:'meta', tier:'platinum', icon:'🏆', label:'Ba Trăm Thành Tích',      description:'Mở khóa 300 thành tích', check:(s,u)=>(u?.length??0)>=300 },
  { id:'meta_325',  category:'meta', tier:'diamond',  icon:'✨', label:'Vượt Qua 325',            description:'Mở khóa 325 thành tích', check:(s,u)=>(u?.length??0)>=325 },
  { id:'meta_350',  category:'meta', tier:'diamond',  icon:'🌠', label:'Ba Trăm Năm Mươi',        description:'Mở khóa 350 thành tích', check:(s,u)=>(u?.length??0)>=350 },
  { id:'meta_all',  category:'meta', tier:'diamond',  icon:'👑', label:'Người Hoàn Chỉnh',        description:'Mở khóa tất cả thành tích', check:(s,u)=>(u?.length??0)>=360 },
  { id:'speedrun',  category:'meta', tier:'platinum', icon:'⚡', label:'Speedrun',                description:'100 phiên trong 30 ngày đầu',   check:(s)=>s.sessionsCompleted>=100&&s.daysSinceFirst<=30 },
  { id:'consistency',category:'meta',tier:'gold',     icon:'⚖️', label:'Sự Nhất Quán',            description:'50 ngày hoạt động trong 365 ngày đầu', check:(s)=>s.totalActiveDays>=50&&s.daysSinceFirst<=365 },
  { id:'completionist_bronze',category:'meta',tier:'silver',  icon:'🥉',label:'Nhà Sưu Tập Đồng', description:'Mở khóa mọi thành tích Đồng', check:(_s,u)=>{if(!u)return false;const b=ACHIEVEMENTS.filter(a=>a.tier==='bronze'&&a.category!=='meta');return b.every(a=>u.includes(a.id));} },
  { id:'completionist_silver',category:'meta',tier:'gold',    icon:'🥈',label:'Nhà Sưu Tập Bạc',  description:'Mở khóa mọi thành tích Bạc',  check:(_s,u)=>{if(!u)return false;const b=ACHIEVEMENTS.filter(a=>a.tier==='silver'&&a.category!=='meta');return b.every(a=>u.includes(a.id));} },
  { id:'completionist_gold',  category:'meta',tier:'platinum',icon:'🥇',label:'Nhà Sưu Tập Vàng', description:'Mở khóa mọi thành tích Vàng',  check:(_s,u)=>{if(!u)return false;const b=ACHIEVEMENTS.filter(a=>a.tier==='gold'&&a.category!=='meta');return b.every(a=>u.includes(a.id));} },
  { id:'legend',    category:'meta', tier:'diamond',  icon:'🌌', label:'Huyền Thoại',             description:'Mở khóa ≥350 thành tích',      check:(s,u)=>(u?.length??0)>=350 },

  // ══ BỔ SUNG ═══════════════════════════════════════════════════════════════
  // Sessions thêm
  { id:'sessions_400',   category:'sessions',  tier:'platinum', icon:'⚡', label:'Bốn Trăm Phiên',          description:'400 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=400 },
  { id:'sessions_800',   category:'sessions',  tier:'platinum', icon:'🔮', label:'Tám Trăm Phiên',          description:'800 phiên tập trung',                     check:(s)=>s.sessionsCompleted>=800 },
  { id:'sessions_1111',  category:'sessions',  tier:'diamond',  icon:'🎯', label:'Một Một Một Một',          description:'1111 phiên — bộ số thú vị',              check:(s)=>s.sessionsCompleted>=1111 },
  // Time thêm
  { id:'hours_30',       category:'time',      tier:'silver',   icon:'🌙', label:'Ba Mươi Giờ',              description:'30 giờ tập trung tích lũy',              check:(s)=>s.totalFocusMinutes>=1800 },
  { id:'hours_450',      category:'time',      tier:'platinum', icon:'🌊', label:'Bốn Trăm Rưỡi Giờ',        description:'450 giờ tập trung tích lũy',             check:(s)=>s.totalFocusMinutes>=27000 },
  // Streak thêm
  { id:'streak_15',      category:'streak',    tier:'silver',   icon:'🔗', label:'Mười Lăm Ngày',            description:'Streak 15 ngày liên tiếp',               check:(s)=>s.longestStreak>=15 },
  { id:'streak_45',      category:'streak',    tier:'gold',     icon:'🌟', label:'Bốn Mươi Lăm Ngày',        description:'Streak 45 ngày liên tiếp',               check:(s)=>s.longestStreak>=45 },
  // Time of day thêm
  { id:'early_bird_200', category:'timeofday', tier:'diamond',  icon:'🌠', label:'Huyền Thoại Bình Minh',    description:'200 phiên trước 7:00 sáng',              check:(s)=>s.earlyBirdCount>=200 },
  { id:'night_owl_200',  category:'timeofday', tier:'diamond',  icon:'🌌', label:'Huyền Thoại Đêm Khuya',   description:'200 phiên sau 23:00',                    check:(s)=>s.nightOwlCount>=200 },
  // Annual thêm
  { id:'year_all_q',     category:'annual',    tier:'gold',     icon:'🗺️',label:'Tứ Quý Hoàn Chỉnh',       description:'≥30 phiên trong cả 4 quý',               check:(s)=>s.q1Sessions>=30&&s.q2Sessions>=30&&s.q3Sessions>=30&&s.q4Sessions>=30 },
  // Collection thêm
  { id:'blueprints_40',  category:'collection',tier:'gold',     icon:'📑', label:'Bốn Mươi Bản Vẽ',         description:'Sưu tập 40 bản vẽ',                     check:(s)=>s.blueprintsCount>=40 },
  { id:'jackpot_5',      category:'collection',tier:'silver',   icon:'🎲', label:'Năm Lần Đại Vận',          description:'5 lần Đại Trúng Thưởng',                check:(s)=>s.totalJackpots>=5 },
  // Session type thêm
  { id:'deep_focus_200', category:'session_type',tier:'diamond',icon:'🌊', label:'Đại Dương Vô Tận',         description:'200 phiên ≥60 phút',                    check:(s)=>s.deepFocusCount>=200 },
  { id:'active_days_200',category:'session_type',tier:'platinum',icon:'📆',label:'200 Ngày Hoạt Động',       description:'200 ngày khác nhau có ít nhất 1 phiên', check:(s)=>s.totalActiveDays>=200 },
  // Notes thêm
  { id:'note_700',       category:'notes',     tier:'diamond',  icon:'📗', label:'Bảy Trăm Ghi Chú',        description:'Ghi chú trong 700 phiên',               check:(s)=>s.totalNoteCount>=700 },
  // Era rank thêm
  { id:'rank_3',         category:'era_rank',  tier:'silver',   icon:'🏅', label:'Bậc Ba',                  description:'Đạt rank 3 trong bất kỳ Kỷ Nguyên',    check:(s)=>s.maxRankAchieved>=3 },
  // Monthly thêm
  { id:'month_75',       category:'monthly',   tier:'platinum', icon:'🌟', label:'Bảy Mươi Lăm Phiên',      description:'Có tháng đạt ≥75 phiên',               check:(s)=>s.bestMonthSessions>=75 },
  // XP level thêm
  { id:'xp_500',         category:'xp_level',  tier:'bronze',   icon:'✨', label:'500 XP',                  description:'Tích lũy 500 XP',                       check:(s)=>s.totalXP>=500 },
  { id:'level_15',       category:'xp_level',  tier:'silver',   icon:'🌿', label:'Cấp 15',                  description:'Đạt cấp độ 15',                         check:(s)=>s.playerLevel>=15 },
  // Special thêm
  { id:'full_day_10',    category:'special',   tier:'diamond',  icon:'🌞', label:'Mười Ngày Tràn Đầy',       description:'10 ngày có phiên cả sáng, chiều và tối', check:(s)=>s.fullDayCount>=10 },
  { id:'mega_grind',     category:'special',   tier:'diamond',  icon:'🔱', label:'Mega Grind',               description:'≥1000 giờ + ≥1000 phiên',               check:(s)=>s.totalFocusMinutes>=60000&&s.sessionsCompleted>=1000 },
];

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
  // Research points
  { id: 'earn_80_rp',           label: 'Kiếm 80 RP trong ngày',                     type: 'researchPoints',  family: 'researchPoints',   bucket: 'stretch', weight: 0.45, goal: 80,  rewardXP: 55  },
  { id: 'earn_160_rp',          label: 'Kiếm 160 RP trong ngày',                    type: 'researchPoints',  family: 'researchPoints',   bucket: 'rare',    weight: 0.18, goal: 160, rewardXP: 95  },
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
    title: '🌋 Thuở Khai Thiên',
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
    title: '🏛️ Bình Minh Văn Minh',
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
    title: '⚙️ Cuộc Cách Mạng',
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
    title: '💡 Kỷ Nguyên Số',
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
    title: '🚀 Chinh Phục Vũ Trụ',
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
    title: '📚 Người Lưu Trữ',
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
    title: '🧭 Tuần Viễn Du',
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
    title: '⚖️ Nhịp Cân Bằng',
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

export function getRelicEvolutionRefinedCost(stageDef = {}) {
  return Math.max(0, (stageDef.t2Cost ?? 0) + (stageDef.t3Cost ?? 0) * T3_REFINED_EQUIVALENT);
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
export const WONDER_EFFECT_REGISTRY = {
  extra_forgiveness:    { era: 1,  label: '+1 Sự Tha Thứ/tuần',              description: 'Mỗi tuần được thêm 1 lần hủy phiên mà không nhận Thảm Họa.' },
  cheaper_t2_craft:     { era: 2,  label: 'Chế tinh luyện rẻ hơn',           description: 'Giảm chi phí chế tác nguyên liệu tinh luyện từ 8 xuống còn 6 nguyên liệu thô.' },
  longer_crisis_window: { era: 3,  label: 'Cửa sổ khủng hoảng +12 giờ',     description: 'Thêm 12 giờ để hoàn thành thách thức khủng hoảng kỷ nguyên.' },
  streak_cap_plus:      { era: 4,  label: 'Giới hạn chuỗi +10 ngày',         description: 'Tăng trần bonus XP từ chuỗi ngày thêm 10 ngày.' },
  research_speed_25:    { era: 5,  label: '+25% RP mỗi phiên',               description: 'Tất cả Điểm Nghiên Cứu (RP) kiếm được tăng 25%.' },
  building_hp_boost:    { era: 6,  label: '+15% nguyên liệu thô mỗi phiên', description: 'Mỗi phiên tập trung nhận thêm 15% nguyên liệu thô, đồng thời hủy phiên bớt thất thoát hơn.' },
  t2_research_25off:    { era: 7,  label: '-25% RP bản vẽ kỷ 6-10',          description: 'Giảm 25% chi phí RP nghiên cứu tất cả bản vẽ nhóm kỷ giữa (6-10).' },
  era_carry_10pct:      { era: 8,  label: 'Dự trữ đầu kỷ mới',               description: 'Khi lên kỷ, nhận thêm nguyên liệu thô của kỷ mới bằng 10% tổng kho thô kỷ trước.' },
  mission_bonus_20:     { era: 9,  label: '+20% XP từ nhiệm vụ hàng ngày',   description: 'Tăng 20% phần thưởng XP từ tất cả nhiệm vụ hàng ngày.' },
  deep_session_refined_bonus: { era: 10, label: 'Phiên sâu cho thêm tinh luyện', description: 'Mỗi phiên từ 90 phút trở lên nhận thêm 1 nguyên liệu tinh luyện.' },
  era_carry_refined_12:       { era: 11, label: 'Vốn tinh luyện đầu kỷ',         description: 'Khi lên kỷ, nhận sẵn 12 nguyên liệu tinh luyện của kỷ mới.' },
  disaster_hp_50off:    { era: 12, label: 'Mất tài nguyên khi hủy phiên -50%', description: 'Giảm một nửa mức thất thoát tài nguyên khi hủy phiên hoặc nhận thảm họa thường.' },
  gacha_pity_minus5:    { era: 13, label: '+25% RP mỗi phiên',               description: 'Tăng thêm 25% RP ở mọi phiên tập trung.' },
  research_speed_30:    { era: 14, label: '+30% RP mỗi phiên',               description: 'Thêm 30% RP (tích lũy với Kỳ Quan Era 5, tổng +55%).' },
  relic_evo_30off:      { era: 15, label: '-30% chi phí tiến hóa Di Vật',    description: 'Giảm 30% tài nguyên cần thiết để tiến hóa tất cả Di Vật.' },
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
  bp_tho_pho_linh:           [1,  'wonder', 'extra_forgiveness'],
  // ── Kỷ 2 ──────────────────────────────────────────────────────────────────
  bp_lang_nong:              [2,  'infrastructure'],
  bp_lo_gom:                 [2,  'economy'],
  bp_kenh_tuoi:              [2,  'infrastructure'],
  bp_kho_lua:                [2,  'defense'],
  bp_den_tho_co:             [2,  'wonder', 'cheaper_t2_craft'],
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
  bp_thu_vien_trung_co:      [5,  'wonder', 'research_speed_25'],
  // ── Kỷ 6 ──────────────────────────────────────────────────────────────────
  bp_lang_xa_viet:           [6,  'infrastructure'],
  bp_truong_thu:             [6,  'economy'],
  bp_quan_truong:            [6,  'defense'],
  bp_phu_quan:               [6,  'infrastructure'],
  bp_thanh_quan_viet:        [6,  'wonder', 'building_hp_boost'],
  // ── Kỷ 7 ──────────────────────────────────────────────────────────────────
  bp_xuong_hoa:              [7,  'economy'],
  bp_truong_dai_hoc:         [7,  'infrastructure'],
  bp_nha_bao_tang:           [7,  'economy'],
  bp_thu_vien_kh:            [7,  'infrastructure'],
  bp_cung_dien_ph:           [7,  'wonder', 't2_research_25off'],
  // ── Kỷ 8 ──────────────────────────────────────────────────────────────────
  bp_xuong_dong_tau:         [8,  'infrastructure'],
  bp_thuong_diem:            [8,  'economy'],
  bp_ngon_hai_dang:          [8,  'defense'],
  bp_kho_gia_vi:             [8,  'economy'],
  bp_cang_bien:              [8,  'wonder', 'era_carry_10pct'],
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
  bp_tap_doan_cong:          [10, 'wonder', 'deep_session_refined_bonus'],
  // ── Kỷ 11 ─────────────────────────────────────────────────────────────────
  bp_san_chung_khoan:        [11, 'economy'],
  bp_cang_xuat_khau:         [11, 'infrastructure'],
  bp_ngan_hang_trung_uong:   [11, 'defense'],
  bp_toa_bao_tang_de_quoc:   [11, 'economy'],
  bp_tap_doan_doc_quyen:     [11, 'wonder', 'era_carry_refined_12'],
  // ── Kỷ 12 ─────────────────────────────────────────────────────────────────
  bp_can_cu_quan_su:         [12, 'infrastructure'],
  bp_xuong_vu_khi:           [12, 'economy'],
  bp_benh_vien_da_chien:     [12, 'infrastructure'],
  bp_trung_tam_chi_huy:      [12, 'defense'],
  bp_thanh_tri_chien:        [12, 'wonder', 'disaster_hp_50off'],
  // ── Kỷ 13 ─────────────────────────────────────────────────────────────────
  bp_tram_tinh_bao:          [13, 'infrastructure'],
  bp_ham_ten_lua:            [13, 'defense'],
  bp_trung_tam_vu_tru:       [13, 'economy'],
  bp_dai_nghe_len:           [13, 'infrastructure'],
  bp_ham_phan_ung:           [13, 'wonder', 'gacha_pity_minus5'],
  // ── Kỷ 14 ─────────────────────────────────────────────────────────────────
  bp_garage_startup:         [14, 'economy'],
  bp_trung_tam_du_lieu:      [14, 'infrastructure'],
  bp_van_phong_tech:         [14, 'economy'],
  bp_mang_luoi_cdn:          [14, 'defense'],
  bp_campus_cong_nghe:       [14, 'wonder', 'research_speed_30'],
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
