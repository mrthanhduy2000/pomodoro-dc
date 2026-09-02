/**
 * SkillTree.jsx — Cây Kỹ Năng (36 kỹ năng · 6 nhánh · 4 bậc)
 * ─────────────────────────────────────────────────────────────────────────────
 * Trạng thái hiển thị mỗi nút:
 *   LOCKED          – chưa đủ điều kiện tiên quyết → mờ, biểu tượng khóa
 *   AVAILABLE       – đủ điều kiện, đủ SP           → viền sáng, nút mua
 *   INSUFFICIENT_SP – đủ điều kiện, thiếu SP        → hiển thị nhưng không mua được
 *   UNLOCKED        – đã mua                        → sáng hoàn toàn, dấu tích
 *
 * 4 bậc độ:
 *   basic (🟩 3 ĐKN) · intermediate (🟦 7 ĐKN) · advanced (🟪 14 ĐKN) · elite (🔴 22 ĐKN)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useMemo } from 'react';
import InventoryHero from './shared/InventoryHero.jsx';
import { heroKyNang } from './shared/inventoryHero.js';
import { motion, AnimatePresence } from 'framer-motion';
import { SCRIM_FADE, useCustomMotion, useEnterMotion, usePressMotion, useSnapMotion } from '../lib/motionPresets';

import useGameStore       from '../store/gameStore';
import useSettingsStore   from '../store/settingsStore';
import soundEngine        from '../engine/soundEngine';
import DailyMissions      from './DailyMissions';
import { SkillGlyph, BranchGlyph, BoltGlyph } from './icons/Glyph';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import {
  SKILL_TREE,
  SKILL_SYNERGIES,
  SIEU_TAP_TRUNG_CHARGES,
  SO_DO_CHARGES,
  EXP_PER_LEVEL,
  SP_PER_LEVEL,
  ACHIEVEMENTS,
  ACHIEVEMENT_TIERS,
} from '../engine/constants';
import { getLevelProgress, getEffectiveSkillCost } from '../engine/gameMath';
import { RELIC_ELITE_RESONANCE } from '../engine/constants';
import { giaCaChuoi } from './skillChainCost';

const NODE_STATE = {
  LOCKED:          'LOCKED',
  AVAILABLE:       'AVAILABLE',
  INSUFFICIENT_SP: 'INSUFFICIENT_SP',
  UNLOCKED:        'UNLOCKED',
};

const TIER_STYLE = {
  basic: {
    label: 'Cơ Bản',
    bg: 'bg-emerald-900/70',
    text: 'text-emerald-300',
    border: 'border-emerald-700',
    light: { background: 'rgba(201, 100, 66, 0.08)', color: '#8f4d3a', border: 'rgba(201, 100, 66, 0.16)' },
  },
  intermediate: {
    label: 'Trung Cấp',
    bg: 'bg-blue-900/70',
    text: 'text-blue-300',
    border: 'border-blue-700',
    light: { background: 'rgba(143, 122, 138, 0.10)', color: '#6f5c69', border: 'rgba(143, 122, 138, 0.18)' },
  },
  advanced: {
    label: 'Cao Cấp',
    bg: 'bg-purple-900/70',
    text: 'text-purple-300',
    border: 'border-purple-700',
    light: { background: 'rgba(124, 139, 116, 0.10)', color: '#5f6e58', border: 'rgba(124, 139, 116, 0.18)' },
  },
  elite: {
    label: 'Tinh Hoa',
    bg: 'bg-red-900/70',
    text: 'text-red-300',
    border: 'border-red-700',
    light: { background: 'rgba(31, 30, 29, 0.08)', color: '#433630', border: 'rgba(31, 30, 29, 0.14)' },
  },
};

const SKILL_LABELS = Object.fromEntries(
  Object.values(SKILL_TREE).flatMap((branch) => branch.nodes.map((node) => [node.id, node.label]))
);

const BRANCH_KEYS = Object.keys(SKILL_TREE);

// Bảng tra id → nút, dựng MỘT LẦN từ chính `SKILL_TREE`. Không chép danh sách nút ra đâu cả: một
// bảng chép tay sẽ trôi khỏi dữ liệu ngay lần ai đó thêm một nhánh.
const NODE_BY_ID = new Map(
  Object.values(SKILL_TREE).flatMap((branch) => (branch.nodes ?? []).map((node) => [node.id, node])),
);

// Cộng hưởng Di Vật — bản đồ tra cứu theo elite: nhãn di vật cùng kỷ để gợi ý giảm giá
const RELIC_LABELS_VI = {
  mam_song_bat_diet:  'Mầm Sống Bất Diệt',
  ngon_duoc_khai_sang: 'Ngọn Đuốc Khai Sáng',
  la_chan_phong_kien:  'Lá Chắn Phong Kiến',
  xuc_xac_ky_vong:     'Xúc Xắc Kỳ Vọng',
  la_ban_da_vinci:     'La Bàn Da Vinci',
  loi_tri_tue:         'Lõi Trí Tuệ',
};
const ELITE_RESONANCE_BY_SKILL = Object.fromEntries(
  Object.values(RELIC_ELITE_RESONANCE).map((m) => [m.elite, m]),
);

// Bản đồ tra cứu thành tựu theo id + tông màu bậc dịu mắt (hợp nền giấy ấm)
const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
const ACH_TIER_TINT = {
  bronze: '#b27c50',
  silver: '#a39e96',
  gold: '#c39a58',
  platinum: '#a68995',
  diamond: '#839bb0',
};


// Thẻ chuẩn dùng chung — tự đổi theo skin (bo góc, viền, bóng)
const CARD = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};

function getTierBadgeProps(tierStyle, lightTheme) {
  if (!lightTheme) {
    return {
      className: `text-xs px-1.5 py-0.5 rounded-full border font-semibold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`,
    };
  }

  return {
    className: 'text-xs px-1.5 py-0.5 rounded-full border font-semibold',
    style: {
      background: tierStyle.light.background,
      color: tierStyle.light.color,
      borderColor: tierStyle.light.border,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SkillTree({ _onOpenAchievements }) {
  const uiTheme            = useSettingsStore((s) => s.uiTheme);
  const sp                 = useGameStore((s) => s.player.sp);
  const totalEXP           = useGameStore((s) => s.player.totalEXP);
  const level              = useGameStore((s) => s.player.level);
  const unlockedSkills     = useGameStore((s) => s.player.unlockedSkills);
  const unlockSkill        = useGameStore((s) => s.unlockSkill);
  const skillActivations   = useGameStore((s) => s.skillActivations);
  const activateSuperFocus = useGameStore((s) => s.activateSuperFocus);
  const activateLuckyMode  = useGameStore((s) => s.activateLuckyMode);
  const relics             = useGameStore((s) => s.relics);
  const relicEvolutions    = useGameStore((s) => s.relicEvolutions);

  const { progressPct, currentLevelEXP, nextLevelEXP } = getLevelProgress(totalEXP);

  const [confirmNode, setConfirmNode] = useState(null);
  const [activeBranch, setActiveBranch] = useState(BRANCH_KEYS[0]);
  // NGOẠI LỆ (mang bố cục) — bề dài thanh CHÍNH LÀ phần trăm kinh nghiệm đã tích.
  const expBarMotion = useSnapMotion({
    animate: { width: `${progressPct}%` },
    transition: { duration: 0.6, ease: 'easeOut' },
  });
  const lightTheme = uiTheme === 'light';

  const getNodeState = useCallback((node) => {
    if (unlockedSkills[node.id]) return NODE_STATE.UNLOCKED;
    const prereqsMet = node.requires.every((req) => unlockedSkills[req]);
    if (!prereqsMet) return NODE_STATE.LOCKED;
    const effectiveCost = getEffectiveSkillCost(node.id, node.spCost, relics, relicEvolutions);
    if (sp < effectiveCost) return NODE_STATE.INSUFFICIENT_SP;
    return NODE_STATE.AVAILABLE;
  }, [unlockedSkills, sp, relics, relicEvolutions]);

  const handleBuy = (node) => {
    if (getNodeState(node) !== NODE_STATE.AVAILABLE) return;
    setConfirmNode(node);
  };

  const handleConfirmBuy = () => {
    if (!confirmNode) return;
    const success = unlockSkill(confirmNode.id, confirmNode.spCost, confirmNode.requires);
    if (success) soundEngine.playSkillUnlock();
    setConfirmNode(null);
  };

  // Đếm kỹ năng đã mở khóa
  const totalNodes    = Object.values(SKILL_TREE).reduce((s, b) => s + b.nodes.length, 0);
  const unlockedCount = Object.values(SKILL_TREE).reduce(
    (s, b) => s + b.nodes.filter((n) => unlockedSkills[n.id]).length, 0,
  );

  // Tính synergy đang active
  const { activeSynergies, branchCounts } = useMemo(() => {
    const counts = {};
    for (const [branchKey, branch] of Object.entries(SKILL_TREE)) {
      counts[branchKey] = branch.nodes.filter((n) => !!unlockedSkills[n.id]).length;
    }
    const active = SKILL_SYNERGIES.filter((syn) => {
      // V2: synergy có 2 dạng — requires {branch:N} hoặc requiresBranchCount {branchCount, branchMinSkills}
      if (syn.requiresBranchCount) {
        const { branchCount, branchMinSkills } = syn.requiresBranchCount;
        const qualified = Object.values(counts).filter((c) => c >= branchMinSkills).length;
        return qualified >= branchCount;
      }
      if (syn.requires) {
        return Object.entries(syn.requires).every(([branch, minCount]) => (counts[branch] ?? 0) >= minCount);
      }
      return false;
    });
    return { activeSynergies: active, branchCounts: counts };
  }, [unlockedSkills]);

  const selectedBranch = SKILL_TREE[activeBranch];

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4">

      {/* ── Dải mở đầu Hành trang — xem `shared/inventoryHero.js` ────────── */}
      <InventoryHero hero={heroKyNang({ spChuaTieu: sp, daMo: unlockedCount, tongKyNang: totalNodes })} icon="✦" />

      {/* ── Tóm tắt tiến trình: cấp + XP ─────────────────────────────────── */}
      <div className="px-5 py-4" style={CARD}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {/* ⚠️ NHÃN "TIẾN TRÌNH" ĐÃ GỠ (2026-08-30). Ngay dưới nó là "Cấp 5 · 2.445/6.000 XP"
                cộng một thanh chạy — một con số có mẫu số và một thanh đang đầy dần thì tự nó đã
                là tiến trình; cái nhãn chỉ gọi tên thứ mắt vừa đọc xong. Cùng luật đã áp cho khối
                tiêu đề `ShellPane` và dòng "NGÀY HÔM NAY" ở màn Tập trung: *hai chỗ nói cùng một
                chuyện thì chỗ nói ít hơn phải nhường*. */}
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[1.7rem] font-semibold leading-none" style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--ink)' }}>Cấp {level}</span>
              <span className="mono text-[12px] tabular-nums" style={{ color: 'var(--muted)' }}>{currentLevelEXP.toLocaleString()} / {nextLevelEXP.toLocaleString()} XP</span>
            </div>
          </div>
          <span className="mono text-[11px] uppercase tracking-[0.16em] tabular-nums" style={{ color: 'var(--muted)' }}>{unlockedCount}/{totalNodes} kỹ năng</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--timer-track)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }}
            {...expBarMotion}
          />
        </div>
        {/*
          ⚠️ DÒNG NÀY ĐỔI TỪ "LUẬT CHƠI" SANG "CÒN BAO XA" (2026-08-30).
          Bản cũ ghi «6.000 XP/cấp · 2 SP mỗi cấp» — hai vế, và cả hai đều hỏng theo cách riêng:
          · «6.000 XP/cấp» nói lại đúng con số vừa hiện ngay phía trên nó («2.445 / 6.000 XP»),
            tức chỗ nói lần thứ hai.
          · «2 SP mỗi cấp» là một câu LUẬT — đúng mãi mãi, giống hệt nhau ở mọi lần mở màn hình.
            Một dòng không bao giờ đổi thì sau lần đọc thứ hai nó thôi là thông tin.
          Nay nó nói KHOẢNG CÁCH tới phần thưởng kế tiếp: cùng một dòng, cùng bằng ấy chỗ, nhưng
          nó ĐỔI sau mỗi phiên và nó trả lời được câu "cày thêm chút nữa thì được gì". Đúng luật
          của dự án: *một con số không có mẫu số thì không phải mục tiêu* — ở đây còn đi thêm một
          bước, nói luôn cái mẫu số ấy đổi lấy được gì.
        */}
        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
          Còn <strong style={{ color: 'var(--ink)' }}>{Math.max(0, nextLevelEXP - currentLevelEXP).toLocaleString()} XP</strong> nữa lên cấp {level + 1} → +{SP_PER_LEVEL} SP
        </p>
      </div>

      {/* ── Bố cục 2 cột: cây kỹ năng (trái) · ngữ cảnh (phải) ──────────── */}
      {/*
        ⚠️ `min-w-0` TRÊN CỘT GRID LÀ BẮT BUỘC, KHÔNG PHẢI TRANG TRÍ. Mặc định của một ô grid là
        `min-width: auto`, tức nó PHÌNH theo nội dung dài nhất bên trong thay vì co về bề rộng cột.
        Ở đây nội dung dài nhất là mô tả kỹ năng, nên trên khung 390px cột phình thành **567px** và
        mô tả bị mép màn hình cắt mất ~100px — đúng thứ Đàm đọc để quyết mở kỹ năng nào.
        ⚠️ Nó IM LẶNG trên desktop: ở đó cột rộng sẵn nên không có gì tràn, và `--fit` của
        `shot.mjs` cũng không kêu vì nó chỉ soi NÚT, còn đây là thẻ `<p>`. Chỉ nhìn ảnh chụp khung
        390px mới thấy.
        ⚠️ VÀ `min-w-0` TRÊN ITEM MỘT MÌNH KHÔNG ĐỦ — đã thử và đo: cột vẫn 567px. Ở khung hẹp,
        `lg:grid-cols-…` chưa áp nên grid chỉ có MỘT cột ngầm cỡ `auto`, mà một track `auto` thì tự
        phình theo nội dung bất kể item khai `min-width: 0`. Thứ chữa được là `grid-cols-1`:
        Tailwind dựng nó thành `repeat(1, minmax(0, 1fr))`, và chính vế `minmax(0, …)` mới ép được
        track co lại.
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">

        {/* TRÁI — Cây kỹ năng */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="px-5 py-5" style={CARD}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* ⚠️ NHÃN "CÂY KỸ NĂNG" ĐÃ GỠ (2026-08-30) — đây là chỗ nói lần thứ HAI: cái
                    tab Đàm vừa bấm để tới đây tên là "Kỹ năng", và nó đang sáng ngay phía trên.
                    Một nhãn nhắc lại tên màn hình mình đang đứng thì không phân biệt được gì. */}
                <h3 className="flex items-center gap-2 text-[1.45rem] font-semibold leading-tight" style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--ink)' }}>
                  <BranchGlyph branch={activeBranch} size={24} />{selectedBranch.label}
                </h3>
                <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>{selectedBranch.focus}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 px-3 py-1.5" style={{ background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.18)', borderRadius: 'var(--skin-radius-control,14px)' }}>
                <span style={{ color: 'var(--accent2)', display: 'inline-flex' }}><BoltGlyph size={14} /></span>
                <span className="mono text-[15px] font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{sp}</span>
                <span className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--accent2)' }}>SP</span>
              </div>
            </div>

            {/*
              ⚠️ TÊN NHÁNH PHẢI HIỆN Ở KHỔ ĐIỆN THOẠI (vòng 20, 2026-08-30). Nhãn từng là
              `hidden sm:inline`, mà `sm` là 640px — tức ở 390px sáu nút chỉ còn một glyph nhỏ và
              một phân số. Đo trên fixture đã chơi 6 tháng: 5 trong 6 nhánh cùng ghi "0/6" ⇒ **năm
              nút trông y hệt nhau**, và cách duy nhất biết nút nào là "Ý Chí" hay "Vận May" là
              bấm thử từng cái. Một hàng nút mà không đọc được nhãn thì không phải một hàng nút.
              ⚠️ Cái giá phải TRẢ chứ không giấu: hàng chip cao thêm (nó wrap thành nhiều dòng ở
              390px). Đổi lại sáu nút thôi giống hệt nhau — và trang Kỹ năng vừa ngắn đi 1.113px ở
              chính vòng này nên chỗ ấy có sẵn.
            */}
            {/* Chọn nhánh */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {BRANCH_KEYS.map((key) => {
                const b = SKILL_TREE[key];
                const active = key === activeBranch;
                const owned = branchCounts[key] ?? 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveBranch(key)}
                    className="mono inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                    style={active
                      ? { background: 'var(--ink)', color: 'var(--canvas)' }
                      : { background: 'rgba(var(--accent-rgb),0.06)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                  >
                    <BranchGlyph branch={key} size={14} />
                    <span>{b.label}</span>
                    <span className="tabular-nums" style={{ opacity: 0.7 }}>{owned}/{b.nodes.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách nút kỹ năng (nối nhau bằng đường mảnh) */}
            <div className="mt-5">
              {selectedBranch.nodes.map((node, i) => (
                <SkillNode
                  key={node.id}
                  node={node}
                  nodeState={getNodeState(node)}
                  effectiveCost={getEffectiveSkillCost(node.id, node.spCost, relics, relicEvolutions)}
                  giaChuoi={giaCaChuoi(
                    node.id,
                    NODE_BY_ID,
                    (id) => !!unlockedSkills[id],
                    (n) => getEffectiveSkillCost(n.id, n.spCost, relics, relicEvolutions) ?? n.spCost,
                  )}
                  isLast={i === selectedBranch.nodes.length - 1}
                  onBuy={() => handleBuy(node)}
                />
              ))}
            </div>
          </div>

          {/* Kỹ năng chủ động (chỉ hiện khi đã sở hữu) */}
          {(unlockedSkills.sieu_tap_trung || unlockedSkills.so_do) && (
            <ActiveAbilityBar
              lightTheme={lightTheme}
              unlockedSkills={unlockedSkills}
              skillActivations={skillActivations}
              onActivateSuperFocus={activateSuperFocus}
              onActivateLuckyMode={activateLuckyMode}
            />
          )}
        </div>

        {/* PHẢI — Ngữ cảnh: nhiệm vụ ngày + chuỗi tuần + thành tựu */}
        <div className="flex flex-col gap-4">
          {/*
            ⚠️ `hidden lg:block` CHO NHIỆM VỤ NGÀY, và đây là một phép GỠ TRÙNG chứ không phải ẩn
            một tính năng (vòng 20, 2026-08-30). Ở màn RỘNG thẻ này là cột NGỮ CẢNH bên phải cây
            kỹ năng — hoàn toàn đúng chỗ, vì thanh bên desktop KHÔNG có mục "Nhiệm vụ". Nhưng ở
            390px hai cột XẾP CHỒNG, nên nó thành **1.097px chắn ngang giữa trang** — và đúng cái
            thẻ ấy LÀ TOÀN BỘ nội dung của tab "Nhiệm vụ", cách một cú chạm trên thanh dưới.
            Đo được: gỡ khỏi khổ điện thoại thì trang Kỹ năng 3.145 → ~2.048px và "Tổ hợp kỹ năng"
            từ y=2382 lên y≈1285.
            ⚠️ Đây là mặt TRÁI của khuôn "hidden … lg:" quen thuộc: thường nó giấu mất thứ iPhone
            cần thấy; ở đây nó là cách duy nhất để iPhone THÔI phải xem hai lần cùng một thẻ, vì
            desktop thật sự cần nó ở chỗ này còn iPhone thì đã có nguyên một tab riêng.
            ⚠️ ĐÍNH CHÍNH 2026-09-01 — `RecentAchievements` NAY ĐÃ GỠ, và lý do giữ nó ghi ở
            dòng ngay trên (*"nó KHÔNG có tab nào của riêng nó"*) đã **chết vì một tiền đề bị gỡ ở
            chỗ khác**: sau khi ba hàng tab gộp làm một, "Huy hiệu" là một trong BA viên cùng hàng,
            luôn nhìn thấy, cách đúng một cú chạm. Đo được sự trùng lặp: probe bốn chuỗi (con số
            "147" + ba tên huy hiệu gần nhất) ra **4/4 xuất hiện ở CẢ màn Kỹ năng lẫn màn Huy
            hiệu**. Hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường — và ở đây chỗ nói
            ít hơn còn đứng trong một màn chẳng liên quan gì tới thành tích.
          */}
          <div className="hidden lg:block">
            <DailyMissions />
          </div>
        </div>
      </div>

      {/* ── Tổ hợp kỹ năng (toàn chiều rộng) ─────────────────────────────── */}
      <SynergyPanel
        lightTheme={lightTheme}
        synergies={SKILL_SYNERGIES}
        activeSynergies={activeSynergies}
        branchCounts={branchCounts}
      />

      {/* ── Chú thích bậc độ ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 justify-center mt-5 pb-2">
        {Object.entries(TIER_STYLE).map(([, style]) => {
          const badgeProps = getTierBadgeProps(style, lightTheme);
          return (
            <span key={style.label} {...badgeProps} className={`${badgeProps.className} px-3 py-1`}>
              {style.label}
            </span>
          );
        })}
      </div>

      {/* ── Hộp xác nhận mua ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmNode && (
          <PurchaseConfirmDialog
            node={confirmNode}
            sp={sp}
            lightTheme={lightTheme}
            onConfirm={handleConfirmBuy}
            onCancel={() => setConfirmNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ActiveAbilityBar ─────────────────────────────────────────────────────────

function ActiveAbilityBar({ lightTheme, unlockedSkills, skillActivations, onActivateSuperFocus, onActivateLuckyMode }) {
  const sa      = skillActivations ?? {};
  const sfActive = sa.superFocusActive;
  // V2: nghi_ngoi_hoan_hao đã loại bỏ → chỉ còn base charge
  const superFocusCap = SIEU_TAP_TRUNG_CHARGES;
  const sfUsedCount = sa.superFocusChargesUsed ?? 0;
  const sfUsed   = sfUsedCount >= superFocusCap;
  const lmActive = sa.luckyModeActive;
  const luckyModeCap = SO_DO_CHARGES;
  const lmUsedCount = sa.luckyModeChargesUsed ?? 0;
  const lmUsed   = lmUsedCount >= luckyModeCap;

  const getButtonStyles = (tone) => {
    if (!lightTheme) return null;

    const controlRadius = 'var(--skin-radius-control,14px)';

    if (tone === 'active') {
      return {
        background: 'rgba(var(--accent-rgb), 0.12)',
        border: '1px solid rgba(var(--accent-rgb), 0.24)',
        color: 'var(--accent2)',
        borderRadius: controlRadius,
      };
    }

    if (tone === 'disabled') {
      return {
        background: 'rgba(255, 255, 255, 0.74)',
        border: '1px solid var(--line)',
        color: 'var(--muted-2)',
        borderRadius: controlRadius,
      };
    }

    return tone === 'purple'
      ? {
          background: 'rgba(var(--accent-rgb), 0.1)',
          border: '1px solid rgba(var(--accent-rgb), 0.18)',
          color: 'var(--accent2)',
          borderRadius: controlRadius,
        }
      : {
          background: 'rgba(31, 30, 29, 0.04)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          borderRadius: controlRadius,
        };
  };

  return (
      <div className="mb-5 flex gap-3 flex-wrap">
      {unlockedSkills.sieu_tap_trung && (
        <button
          onClick={onActivateSuperFocus}
          disabled={sfActive || sfUsed}
          className={`flex w-full justify-between gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-[background-color,border-color,color,opacity] sm:w-auto sm:justify-start ${
            lightTheme
              ? sfActive
                ? 'cursor-default'
                : sfUsed
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              : sfActive
                ? 'bg-white/[0.06] border-white/10 text-[var(--accent-light)] cursor-default'
                : sfUsed
                  ? 'bg-white/[0.03] border-white/8 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-white/[0.04] border-[rgba(var(--accent-rgb),0.20)] text-[var(--accent-light)] hover:bg-white/[0.06] cursor-pointer'
          }`}
          style={getButtonStyles(sfActive ? 'active' : sfUsed ? 'disabled' : 'purple') ?? undefined}
        >
          <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]">SF</span>
          <span>Siêu Tập Trung</span>
          {sfActive  && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--accent2)' } : undefined}>(Đang chờ phiên · {sfUsedCount}/{superFocusCap})</span>}
          {sfUsed && !sfActive && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Đã dùng {sfUsedCount}/{superFocusCap})</span>}
          {!sfActive && !sfUsed && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Còn {superFocusCap - sfUsedCount}/{superFocusCap})</span>}
        </button>
      )}

      {unlockedSkills.so_do && (
        <button
          onClick={onActivateLuckyMode}
          disabled={lmActive || lmUsed}
          className={`flex w-full justify-between gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-[background-color,border-color,color,opacity] sm:w-auto sm:justify-start ${
            lightTheme
              ? lmActive
                ? 'cursor-default'
                : lmUsed
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              : lmActive
                ? 'bg-white/[0.06] border-white/10 text-[var(--accent-light)] cursor-default'
                : lmUsed
                  ? 'bg-white/[0.03] border-white/8 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-white/[0.04] border-[rgba(var(--accent-rgb),0.20)] text-[var(--accent-light)] hover:bg-white/[0.06] cursor-pointer'
          }`}
          style={getButtonStyles(lmActive ? 'active' : lmUsed ? 'disabled' : 'amber') ?? undefined}
        >
          <span className="mono text-[10px] font-semibold uppercase tracking-[0.16em]">SD</span>
          <span>Số Đỏ</span>
          {lmActive  && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--accent2)' } : undefined}>(Đang chờ phiên · {lmUsedCount}/{luckyModeCap})</span>}
          {lmUsed && !lmActive && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Đã dùng {lmUsedCount}/{luckyModeCap})</span>}
          {!lmActive && !lmUsed && <span className="text-xs ml-1" style={lightTheme ? { color: 'var(--muted)' } : undefined}>(Còn {luckyModeCap - lmUsedCount}/{luckyModeCap})</span>}
        </button>
      )}
    </div>
  );
}

// ─── SkillNode (một hàng trong cây, kiểu mockup) ──────────────────────────────

function SkillNode({ node, nodeState, effectiveCost, giaChuoi, isLast, onBuy }) {
  const pressMotion = usePressMotion();
  // Nhấc khi DI CHUỘT không thuộc ba nhịp — đi qua cái gác ngoại lệ.
  const hoverLift = useCustomMotion({ whileHover: { y: -1 } });
  // NGOẠI LỆ (trang trí) — quầng sáng THỞ quanh kỹ năng đã mở khoá được, lặp vô hạn.
  // ⚠️ Điều kiện nay chỉ còn `isAvailable`: cái gác đã lo vế `!reducedMotion`, giữ lại là
  // "một luật hai công thức" và sớm muộn hai vế sẽ lệch nhau.
  const haloMotion = useCustomMotion({
    animate: { boxShadow: ['0 0 0 0 rgba(var(--accent-rgb),0)', '0 0 0 4px rgba(var(--accent-rgb),0.12)', '0 0 0 0 rgba(var(--accent-rgb),0)'] },
    transition: { duration: 2.4, repeat: Infinity },
  });
  const isUnlocked     = nodeState === NODE_STATE.UNLOCKED;
  const isAvailable    = nodeState === NODE_STATE.AVAILABLE;
  const isLocked       = nodeState === NODE_STATE.LOCKED;
  const isInsufficient = nodeState === NODE_STATE.INSUFFICIENT_SP;

  // Cộng hưởng Di Vật (B): giá hiển thị = effectiveCost; nếu rẻ hơn → có giảm giá
  const cost          = effectiveCost ?? node.spCost;
  const isDiscounted  = cost < node.spCost;
  const resonance     = ELITE_RESONANCE_BY_SKILL[node.id]; // chỉ có ở 6 elite
  const showHint      = !!resonance && !isDiscounted && !isUnlocked;
  const hintRelicLabel = resonance ? RELIC_LABELS_VI[resonance.relicId] : null;

  const circleStyle = isUnlocked
    ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
    : isAvailable
      ? { background: 'rgba(var(--accent-rgb),0.10)', color: 'var(--accent2)', border: '1.5px solid rgba(var(--accent-rgb),0.45)' }
      : { background: 'var(--card-bg-solid2)', color: 'var(--muted-2)', border: '1px solid var(--line)' };

  return (
    <div className="flex gap-3.5">
      {/* Cột trái: vòng tròn + đường nối */}
      <div className="flex flex-col items-center">
        <motion.span
          className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[17px] leading-none"
          style={{ ...circleStyle, opacity: isLocked ? 0.6 : 1 }}
          {...(isAvailable ? haloMotion : {})}
        >
          <SkillGlyph id={node.id} locked={isLocked} size={20} />
        </motion.span>
        {!isLast && (
          <span
            className="mt-1 w-px flex-1"
            style={{ background: isUnlocked ? 'rgba(var(--accent-rgb),0.30)' : 'var(--line)', minHeight: '14px' }}
          />
        )}
      </div>

      {/* Cột phải: tên + mô tả + hành động */}
      <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-5'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-tight" style={{ color: isLocked ? 'var(--muted-2)' : 'var(--ink)' }}>
              {node.label}
            </p>
            {/*
              ⚠️ MÔ TẢ LUÔN HIỆN, KỂ CẢ KHI NÚT ĐANG KHOÁ. Bản cũ THAY mô tả bằng dòng
              "Cần mở: X" ⇒ đo được **21/32 nút chưa mua (66%) không có một chữ nào nói mình làm
              gì** — màn hình cho biết GIÁ nhưng giấu MÓN HÀNG. Người ta chỉ thèm thứ mình biết là
              gì; "Bền Vững · 8 SP · Cần mở: Lá Chắn Chuỗi" không tạo ra ham muốn nào, nó chỉ là
              một ô xám có giá. Và đúng thứ đáng thèm nhất (6 nút Tinh Hoa) lại là thứ bị giấu
              kín nhất. Nay "Cần mở" xuống thành DÒNG PHỤ bên dưới thay vì thay thế.
            */}
            <p className="mt-1 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
              {node.description}
            </p>
            {isLocked ? (
              <p className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--muted-2)' }}>
                {node.requires.length > 0
                  ? `Cần mở trước: ${node.requires.map((r) => SKILL_LABELS[r] ?? r.replace(/_/g, ' ')).join(', ')}`
                  : 'Cần mở nút trước'}
              </p>
            ) : null}
            {showHint && (
              <p className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--accent2)', opacity: 0.85 }}>
                {hintRelicLabel
                  ? `Tiến hóa "${hintRelicLabel}" để giảm nửa giá`
                  : 'Tiến hóa di vật cùng kỷ để giảm nửa giá'}
              </p>
            )}
          </div>

          <div className="shrink-0 pt-0.5">
            {isUnlocked ? (
              <span className="mono inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--good)' }}>
                ✓ Đã mở
              </span>
            ) : isAvailable ? (
              <motion.button
                type="button"
                onClick={onBuy}
                {...hoverLift}
                {...pressMotion}
                className="mono inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tabular-nums transition-colors"
                style={{ background: 'rgba(var(--accent-rgb),0.10)', border: '1px solid rgba(var(--accent-rgb),0.30)', color: 'var(--accent2)' }}
              >
                Mở ·{' '}
                {isDiscounted && (
                  <span className="line-through opacity-60 mr-1" style={{ color: 'var(--muted)' }}>{node.spCost}</span>
                )}
                {cost} SP
              </motion.button>
            ) : (
              <span
                className="mono inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold tabular-nums"
                style={{ background: 'var(--card-bg-solid2)', border: '1px solid var(--line)', color: 'var(--muted-2)', opacity: isInsufficient ? 0.95 : 0.7 }}
              >
                {isDiscounted && (
                  <span className="line-through opacity-60 mr-1">{node.spCost}</span>
                )}
                {/*
                  ⚠️ NÚT ĐANG KHOÁ HIỆN GIÁ CẢ CHUỖI, KHÔNG PHẢI GIÁ LẺ. Đo trên một ván thật:
                  **21/32 nút chưa mua (66%) từng hiện một con số thấp hơn giá thật**, tệ nhất gấp
                  **2,3 lần** — ô ghi "8 SP" trong khi phải tiêu 18 SP mới chạm tới được nó (≈ 9
                  cấp ≈ 254 ngày ở nhịp chơi thật). Con số duy nhất người chơi đọc được lại là con
                  số nói dối, và nó nói dối theo hướng DỄ CHỊU — khi phát hiện ra, lòng tin vào mọi
                  con số khác trên màn cũng mất theo.
                  Nút MỞ ĐƯỢC vẫn hiện giá lẻ, vì lúc ấy giá lẻ CHÍNH LÀ số SP sắp bị trừ.
                */}
                {giaChuoi > cost ? `${giaChuoi} SP cả chuỗi` : `${cost} SP`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── PurchaseConfirmDialog ────────────────────────────────────────────────────

function PurchaseConfirmDialog({ node, sp, lightTheme, onConfirm, onCancel }) {
  const enterMotion = useEnterMotion();
  // Lớp phủ tối chỉ mờ dần, không trôi — xem `SCRIM_FADE` ở `motionPresets.js`.
  const scrimMotion = useCustomMotion(SCRIM_FADE);
  const tierStyle = TIER_STYLE[node.tier] ?? TIER_STYLE.basic;
  const tierBadgeProps = getTierBadgeProps(tierStyle, lightTheme);

  return (
    <motion.div
      {...scrimMotion}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onCancel}
    >
      <motion.div
        {...enterMotion}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm p-6 ${lightTheme ? '' : 'bg-white/[0.04] border border-white/8 rounded-2xl shadow-2xl'}`}
        style={lightTheme ? {
          background: 'var(--card-bg-solid)',
          border: 'var(--skin-card-border-width,1px) solid var(--line)',
          borderRadius: 'var(--skin-radius-card,18px)',
          boxShadow: 'var(--skin-card-shadow)',
        } : undefined}
      >
        <div className="text-center mb-4">
          <span className={`mono inline-flex h-14 w-14 items-center justify-center rounded-full border font-semibold ${hasGlyphIcon(node.icon) ? 'text-[26px] leading-none' : 'text-[12px] uppercase tracking-[0.18em]'}`}
                style={lightTheme ? { borderColor: 'var(--line)', background: 'var(--card-bg-solid2)', color: 'var(--accent2)' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>
            {getGlyph(node.icon, node.label)}
          </span>
          <h3 className="font-bold text-xl mt-2" style={lightTheme ? { fontFamily: 'var(--skin-font-display)', fontWeight: 600, color: 'var(--ink)' } : { color: '#ffffff' }}>{node.label}</h3>
          <span className={`inline-block mt-1.5 ${tierBadgeProps.className}`} style={tierBadgeProps.style}>
            {tierStyle.label}
          </span>
          <p className="text-sm mt-2" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>{node.description}</p>
        </div>

        <div
          className={`flex items-center justify-center gap-2 mb-5 py-2.5 ${lightTheme ? '' : 'bg-slate-800 rounded-xl'}`}
          style={lightTheme ? {
            background: 'rgba(var(--accent-rgb), 0.1)',
            border: '1px solid rgba(var(--accent-rgb), 0.16)',
            borderRadius: 'var(--skin-radius-control,14px)',
          } : undefined}
        >
          <span className="mono text-[10px] uppercase tracking-[0.18em]" style={lightTheme ? { color: 'var(--accent2)' } : { color: 'var(--accent-light)' }}>SP</span>
          <span className="mono font-bold tabular-nums" style={lightTheme ? { color: 'var(--ink)' } : undefined}>{node.spCost} SP</span>
          <span className="text-sm" style={lightTheme ? { color: 'var(--muted)' } : undefined}>· còn {sp} SP</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${lightTheme ? '' : 'bg-white/[0.05] hover:bg-white/[0.08] text-[var(--ink)] rounded-xl'}`}
            style={lightTheme ? {
              background: 'var(--card-bg-solid2)',
              color: 'var(--muted)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--skin-radius-control,14px)',
            } : undefined}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-sm font-bold transition-colors ${lightTheme ? '' : 'bg-[rgba(var(--accent-rgb),0.9)] hover:bg-[rgba(var(--accent-rgb),0.82)] text-white rounded-xl'}`}
            style={lightTheme ? {
              background: 'var(--accent)',
              color: '#ffffff',
              borderRadius: 'var(--skin-radius-control,14px)',
            } : undefined}
          >
            Mở Khóa
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Synergy Panel ────────────────────────────────────────────────────────────
function SynergyPanel({ synergies, activeSynergies, branchCounts, lightTheme }) {
  const enterMotion = useEnterMotion();
  // NGOẠI LỆ (trang trí) — thẻ hiệp trợ đang bật thì THỞ, lặp vô hạn. Cùng lý do với quầng ở
  // `SkillNode`: điều kiện chỉ còn `active`, phần `!reducedMotion` đã có cái gác lo.
  const glowMotion = useCustomMotion({
    animate: { boxShadow: ['0 0 0px rgba(var(--accent-rgb),0)', '0 0 12px rgba(var(--accent-rgb),0.18)', '0 0 0px rgba(var(--accent-rgb),0)'] },
    transition: { duration: 2.5, repeat: Infinity },
  });
  const activeIds  = new Set(activeSynergies.map((s) => s.id));
  const totalBonus = activeSynergies.reduce((s, syn) => s + syn.bonus, 0);

  return (
    <div
      className={`mb-5 overflow-hidden ${lightTheme ? '' : 'border border-white/8 rounded-2xl'}`}
      style={lightTheme ? {
        background: 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width,1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card,18px)',
        boxShadow: 'var(--skin-card-shadow)',
      } : { background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${lightTheme ? '' : 'border-b border-white/8'}`}
        style={lightTheme ? { borderBottom: '1px solid var(--line)' } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="mono inline-flex h-7 w-7 items-center justify-center rounded-full border text-[8px] font-semibold uppercase tracking-[0.14em]" style={lightTheme ? { borderColor: 'var(--line)', background: 'rgba(255,255,255,0.74)', color: 'var(--accent2)' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--accent-light)' }}>SG</span>
          <span className="font-bold text-sm" style={lightTheme ? { fontFamily: 'var(--skin-font-display)', fontWeight: 600, color: 'var(--ink)' } : { color: 'var(--ink)' }}>Tổ hợp kỹ năng</span>
          <span className="text-xs text-slate-500" style={lightTheme ? { color: 'var(--muted)' } : { color: 'var(--muted)' }}>({activeSynergies.length}/{synergies.length} kích hoạt)</span>
        </div>
        {totalBonus > 0 && (
          <motion.div
            {...enterMotion}
            className="mono flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums"
            style={lightTheme
              ? { background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid rgba(var(--accent-rgb), 0.16)', color: 'var(--accent2)' }
              : { background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.20)', color: 'var(--accent-light)' }}
          >
            +{(totalBonus * 100).toFixed(0)}% XP tổng
          </motion.div>
        )}
      </div>

      {/* Grid synergies */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
        {synergies.map((syn) => {
          const active   = activeIds.has(syn.id);
          // V2: support 2 dạng synergy
          let metCount, totalReq;
          if (syn.requiresBranchCount) {
            const { branchCount, branchMinSkills } = syn.requiresBranchCount;
            const qualified = Object.values(branchCounts).filter((c) => c >= branchMinSkills).length;
            metCount = Math.min(qualified, branchCount);
            totalReq = branchCount;
          } else if (syn.requires) {
            metCount = Object.entries(syn.requires).filter(([b, n]) => (branchCounts[b] ?? 0) >= n).length;
            totalReq = Object.keys(syn.requires).length;
          } else {
            metCount = 0; totalReq = 1;
          }
          const progress = metCount / Math.max(totalReq, 1);

          return (
            <motion.div
              key={syn.id}
              {...(active ? glowMotion : {})}
              className="p-3 flex flex-col gap-1.5 relative overflow-hidden"
              style={{
                borderRadius: 'var(--skin-radius-control,14px)',
                background: active
                  ? (lightTheme
                      ? 'rgba(var(--accent-rgb),0.1)'
                      : 'rgba(255,255,255,0.06)')
                  : (lightTheme
                      ? 'var(--card-bg-solid2)'
                      : 'rgba(255,255,255,0.03)'),
                border: active
                  ? (lightTheme ? '1px solid rgba(var(--accent-rgb),0.18)' : '1px solid rgba(var(--accent-rgb),0.20)')
                  : (lightTheme ? '1px solid var(--line)' : '1px solid rgba(255,255,255,0.06)'),
              }}
            >
              {active && (
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: lightTheme
                       ? 'radial-gradient(ellipse at 50% 0%, rgba(var(--accent-rgb),0.08) 0%, transparent 72%)'
                       : 'radial-gradient(ellipse at 50% 0%, rgba(var(--accent-rgb),0.10) 0%, transparent 70%)' }} />
              )}

              <div className="flex items-center gap-2 relative z-10">
                <span className={`mono inline-flex h-6 w-6 items-center justify-center rounded-full border font-semibold ${hasGlyphIcon(syn.icon) ? 'text-[13px] leading-none' : 'text-[7px] uppercase tracking-[0.12em]'}`} style={lightTheme ? { borderColor: 'var(--line)', background: 'rgba(255,255,255,0.74)', color: active ? 'var(--accent2)' : 'var(--muted)' } : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: active ? 'var(--accent-light)' : '#94a3b8' }}>{getGlyph(syn.icon, syn.label)}</span>
                {/*
                  ⚠️ TÊN HỢP LỰC ĐƯỢC XUỐNG DÒNG, KHÔNG CẮT BẰNG DẤU … — đây là TÊN RIÊNG, cắt đi
                  thì mất luôn thứ để gọi nó. Đo ở 390px (lưới 2 cột): chỗ cho tên chỉ **74px**,
                  trong khi "Người Nhịp Đều" cần 106px và "Bậc Thầy Vạn Năng" cần 131px ⇒ hiện ra
                  "Bậc Thầy…". Cho phép 2 dòng thì cả hai vừa (131/74 < 2), lưới vẫn 2 cột nên
                  không loãng, và các thẻ trong cùng hàng vẫn cao bằng nhau (grid tự kéo).
                  `line-clamp-2` vẫn là lưới an toàn cho cái tên nào đó dài bất thường sau này.
                  Đo lại: `node scripts/shot.mjs --phone --fit --tab "Kỹ năng"`.
                */}
                <p
                  className={`text-xs font-semibold flex-1 min-w-0 leading-tight line-clamp-2 break-words ${lightTheme ? '' : active ? 'text-[var(--accent-light)]' : 'text-slate-300'}`}
                  style={lightTheme ? { color: active ? 'var(--accent2)' : 'var(--ink)' } : undefined}
                >
                  {syn.label}
                </p>
                {active
                  ? <span className="text-[var(--accent-light)] text-xs flex-shrink-0 font-bold">✓</span>
                  : <span className={`mono text-[10px] flex-shrink-0 tabular-nums ${lightTheme ? '' : 'text-slate-600'}`} style={lightTheme ? { color: 'var(--muted-2)' } : undefined}>{metCount}/{totalReq}</span>
                }
              </div>

              <p className={`text-[10px] relative z-10 leading-tight line-clamp-2 ${lightTheme ? '' : 'text-slate-500'}`} style={lightTheme ? { color: 'var(--muted)' } : undefined}>{syn.desc}</p>

              {/*
                ⚠️ ĐÃ GỠ huy hiệu «+N% XP» (2026-09-01). Nó chép lại ĐÚNG sáu ký tự cuối của câu
                mô tả nằm 31px ngay trên nó, và đo trên bảng thật thì **7/7 mô tả đều đã kết thúc
                bằng chính con số ấy** ("≥3 skill Ý Chí: phiên ≥30' nhận **+5% XP**."). Bảy thẻ ×
                một dòng thừa = 60px trên màn Kỹ năng.
                Thanh tiến độ thì GIỮ NGUYÊN — nó mang tin "còn bao xa", thứ không câu nào nói.
              */}
              <div className="flex items-center gap-2 relative z-10">
                {!active && progress > 0 && (
                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={{ background: lightTheme ? 'var(--timer-track)' : 'var(--timer-track, #1e293b)' }}
                  >
                    <div className="h-full rounded-full transition-[width] duration-500"
                         style={{ width: `${progress * 100}%`, background: lightTheme ? 'linear-gradient(90deg, var(--accent), var(--accent2))' : 'var(--accent)' }} />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
