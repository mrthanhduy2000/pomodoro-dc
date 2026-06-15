/**
 * glyphData.js — Bộ biểu tượng hình học TỰ VẼ cho cây kỹ năng (thay emoji).
 * Phong cách: monoline, dựng trên lưới 24×24, kiểu pictogram Thụy Sĩ (Otl Aicher).
 * Mỗi giá trị là phần MARKUP BÊN TRONG <svg>; component bọc ngoài đặt
 * viewBox + stroke=currentColor nên icon tự đổi màu theo trạng thái & theo skin.
 */

// 6 nhánh
export const BRANCH_GLYPHS = {
  // Thiền Định — vòng tròn đồng tâm (tĩnh tại, chiều sâu)
  THIEN_DINH: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>`,
  // Ý Chí — khiên
  Y_CHI: `<path d="M12 3 L19 6 V11 C19 16 16 19 12 21 C8 19 5 16 5 11 V6 Z"/>`,
  // Nghỉ Ngơi — tách trà
  NGHI_NGOI: `<path d="M5 8 H17 V13 A4 4 0 0 1 13 17 H9 A4 4 0 0 1 5 13 Z"/><path d="M17 9 H19 A2.5 2.5 0 0 1 19 14 H17"/><line x1="6.5" y1="20" x2="15.5" y2="20"/>`,
  // Vận May — xúc xắc
  VAN_MAY: `<rect x="4.5" y="4.5" width="15" height="15"/><circle cx="8.6" cy="8.6" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.2" fill="currentColor" stroke="none"/>`,
  // Chiến Lược — cờ hiệu
  CHIEN_LUOC: `<line x1="6" y1="3.5" x2="6" y2="20.5"/><path d="M6 5 H18 L15 9 L18 13 H6 Z"/>`,
  // Thăng Hoa — ngôi sao 5 cánh
  THANG_HOA: `<polygon points="12 3 14.12 9.09 20.56 9.22 15.42 13.11 17.29 19.28 12 15.6 6.71 19.28 8.58 13.11 3.44 9.22 9.88 9.09"/>`,
};

// 36 nút
export const SKILL_GLYPHS = {
  // ── Thiền Định ──
  vao_guong:           `<polyline points="6 13 12 7 18 13"/><line x1="12" y1="7" x2="12" y2="19"/>`,
  chuyen_can:          `<circle cx="12" cy="12" r="8"/><polyline points="12 7.5 12 12 15.5 13.5"/>`,
  da_tap_trung:        `<polyline points="5.5 7 10.5 12 5.5 17"/><polyline points="12 7 17 12 12 17"/>`,
  vung_dong_chay:      `<path d="M4 10 q 4 -5 8 0 t 8 0"/><path d="M4 14.5 q 4 -5 8 0 t 8 0"/>`,
  tap_trung_sieu_viet: `<polyline points="3.5 18 9 8 13 14 16 9 20.5 18"/>`,
  sieu_tap_trung:      `<polygon points="13 3 7 13 11.5 13 10 21 17 10.5 12.5 10.5" fill="currentColor" stroke="none"/>`,

  // ── Ý Chí ──
  su_tha_thu:          `<path d="M12 20 C 4.5 14.5 5.5 7 9.7 7 C 11 7 12 8 12 9 C 12 8 13 7 14.3 7 C 18.5 7 19.5 14.5 12 20 Z"/>`,
  bo_nho_co_bap:       `<polyline points="7 4 17 4 12 12 17 20 7 20 12 12 7 4"/>`,
  phuc_hoi:            `<path d="M18.5 8.5 A 7 7 0 1 0 19 13.5"/><polyline points="14.3 7.4 18.7 8.5 18.2 4"/>`,
  chuoi_ngay:          `<rect x="3.5" y="9" width="9.8" height="6" rx="3"/><rect x="10.7" y="9" width="9.8" height="6" rx="3"/>`,
  la_chan_streak:      `<path d="M12 3 L19 6 V11 C19 16 16 19 12 21 C8 19 5 16 5 11 V6 Z"/><line x1="6.6" y1="10.5" x2="17.4" y2="10.5"/>`,
  ben_vung:            `<polygon points="4 18 4 9 8 12.5 12 6.5 16 12.5 20 9 20 18"/><line x1="4" y1="18" x2="20" y2="18"/>`,

  // ── Nghỉ Ngơi ──
  hit_tho_sau:         `<path d="M3.5 9 H13 A2.5 2.5 0 1 0 10.5 6.5"/><path d="M3.5 14.5 H16 A2.5 2.5 0 1 1 13.5 17"/>`,
  nap_nang_luong:      `<rect x="3.5" y="8" width="15" height="8"/><line x1="20" y1="10.5" x2="20" y2="13.5"/><line x1="7.5" y1="10.5" x2="7.5" y2="13.5"/><line x1="11" y1="10.5" x2="11" y2="13.5"/>`,
  tich_phien:          `<line x1="6" y1="19" x2="6" y2="13"/><line x1="12" y1="19" x2="12" y2="9"/><line x1="18" y1="19" x2="18" y2="5"/>`,
  phien_vang_sang:     `<line x1="3.5" y1="18" x2="20.5" y2="18"/><path d="M7 18 A 5 5 0 0 1 17 18"/><line x1="12" y1="6" x2="12" y2="8.5"/><line x1="5.8" y1="9.2" x2="7.4" y2="10.8"/><line x1="18.2" y1="9.2" x2="16.6" y2="10.8"/>`,
  nhip_sinh_hoc:       `<path d="M16.5 4.5 A 8 8 0 1 0 16.5 19.5 A 6.2 6.2 0 1 1 16.5 4.5 Z"/>`,
  nhip_hoan_hao:       `<circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="6.4" r="2.7"/><circle cx="12" cy="17.6" r="2.7"/><circle cx="6.4" cy="12" r="2.7"/><circle cx="17.6" cy="12" r="2.7"/>`,

  // ── Vận May ──
  ban_tay_vang:        `<path d="M12 3 L13.6 10.4 L21 12 L13.6 13.6 L12 21 L10.4 13.6 L3 12 L10.4 10.4 Z" fill="currentColor" stroke="none"/>`,
  nhan_quan:           `<path d="M3.5 12 C 7 7.5 17 7.5 20.5 12 C 17 16.5 7 16.5 3.5 12 Z"/><circle cx="12" cy="12" r="2.4"/>`,
  linh_cam:            `<circle cx="12" cy="10.5" r="6"/><path d="M8 17.6 H16 L14.5 20 H9.5 Z"/>`,
  loc_ban_tang:        `<rect x="4.5" y="9.5" width="15" height="9.5"/><line x1="12" y1="9.5" x2="12" y2="19"/><line x1="4.5" y1="13" x2="19.5" y2="13"/><path d="M12 9.5 C 9.5 5.5 6 7.5 12 9.5 C 18 7.5 14.5 5.5 12 9.5 Z"/>`,
  dai_trung_thuong:    `<circle cx="12" cy="12" r="3.5"/><line x1="12" y1="2.5" x2="12" y2="5.5"/><line x1="12" y1="18.5" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5.5" y2="12"/><line x1="18.5" y1="12" x2="21.5" y2="12"/><line x1="5.4" y1="5.4" x2="7.5" y2="7.5"/><line x1="16.5" y1="16.5" x2="18.6" y2="18.6"/><line x1="18.6" y1="5.4" x2="16.5" y2="7.5"/><line x1="5.4" y1="18.6" x2="7.5" y2="16.5"/>`,
  so_do:               `<circle cx="9.3" cy="9.3" r="3.1"/><circle cx="14.7" cy="9.3" r="3.1"/><circle cx="9.3" cy="14.7" r="3.1"/><circle cx="14.7" cy="14.7" r="3.1"/><line x1="12" y1="14" x2="13.6" y2="20"/>`,

  // ── Chiến Lược ──
  nguoi_lap_ke:        `<path d="M12 3.5 C 8.4 3.5 5.5 6.4 5.5 10 C 5.5 14 12 20.5 12 20.5 C 12 20.5 18.5 14 18.5 10 C 18.5 6.4 15.6 3.5 12 3.5 Z"/><circle cx="12" cy="10" r="2.4"/>`,
  cu_tri:              `<rect x="4.5" y="4.5" width="15" height="15"/><polyline points="8.5 12 11 14.5 16 8.5"/>`,
  co_van:              `<rect x="5" y="5" width="14" height="16"/><rect x="9" y="3.3" width="6" height="3.4"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="14" y2="15"/>`,
  lich_day:            `<rect x="4.5" y="6" width="15" height="14"/><line x1="4.5" y1="10" x2="19.5" y2="10"/><line x1="8.5" y1="3.5" x2="8.5" y2="7.5"/><line x1="15.5" y1="3.5" x2="15.5" y2="7.5"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="13" y1="14" x2="16" y2="14"/>`,
  bac_thay_chien_luoc: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>`,
  ke_hoach_hoan_hao:   `<path d="M7.5 4.5 H16.5 V8 A4.5 4.5 0 0 1 7.5 8 Z"/><path d="M16.5 5.5 H19 V7.5 A2.5 2.5 0 0 1 16.5 10"/><path d="M7.5 5.5 H5 V7.5 A2.5 2.5 0 0 0 7.5 10"/><line x1="12" y1="12.5" x2="12" y2="16"/><line x1="8.5" y1="19.5" x2="15.5" y2="19.5"/><line x1="9.7" y1="16" x2="14.3" y2="16"/>`,

  // ── Thăng Hoa ──
  ky_uc_ky_nguyen:     `<path d="M6 4.5 H14 L18 8.5 V19.5 H6 Z"/><polyline points="14 4.5 14 8.5 18 8.5"/><line x1="9" y1="12.5" x2="15" y2="12.5"/><line x1="9" y1="16" x2="13" y2="16"/>`,
  tri_tue_tich_luy:    `<rect x="5" y="15" width="14" height="4"/><rect x="6" y="11" width="12" height="4"/><rect x="5.5" y="7" width="13" height="4"/>`,
  kien_thuc_nen:       `<polyline points="4 8.5 12 4 20 8.5"/><line x1="5" y1="8.5" x2="19" y2="8.5"/><line x1="6.5" y1="9" x2="6.5" y2="17"/><line x1="10" y1="9" x2="10" y2="17"/><line x1="14" y1="9" x2="14" y2="17"/><line x1="17.5" y1="9" x2="17.5" y2="17"/><line x1="4.5" y1="19" x2="19.5" y2="19"/>`,
  bac_thay_ky_nguyen:  `<circle cx="12" cy="12" r="8"/><ellipse cx="12" cy="12" rx="3.3" ry="8"/><line x1="4" y1="12" x2="20" y2="12"/>`,
  ke_thua:             `<polygon points="12 4 18 9 12 20 6 9"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="12" y1="4" x2="9.5" y2="9"/><line x1="12" y1="4" x2="14.5" y2="9"/>`,
  sieu_viet:           `<path d="M16 4.5 L17.2 8.8 L21.5 10 L17.2 11.2 L16 15.5 L14.8 11.2 L10.5 10 L14.8 8.8 Z"/><line x1="3.5" y1="20.5" x2="9.5" y2="14.5"/>`,
};

// ổ khóa (nút chưa mở) + tia sét nhỏ cho pill SP
export const LOCK_GLYPH = `<rect x="5" y="10.5" width="14" height="9.5"/><path d="M8 10.5 V8 A4 4 0 0 1 16 8 V10.5"/><line x1="12" y1="14" x2="12" y2="16.5"/>`;
export const BOLT_GLYPH = `<polygon points="13 3 7 13 11.5 13 10 21 17 10.5 12.5 10.5" fill="currentColor" stroke="none"/>`;
