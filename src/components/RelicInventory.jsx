/**
 * RelicInventory.jsx — Kho Di Vật
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useCustomMotion, useEnterMotion, usePressMotion } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { chiaNhomDiVat } from './relicReach';
import useSettingsStore from '../store/settingsStore';
import {
  ERA_CRISES,
  ERA_REFINED,
  RELIC_EVOLUTION,
  BUILDING_EFFECTS,
  normalizeRefinedBag,
  getRelicEvolutionRefinedCost,
} from '../engine/constants';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';

const ALL_RELIC_DEFS = Object.entries(ERA_CRISES)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([era, crisis]) => ({
    ...crisis.challengeOption.successRelic,
    crisisName: crisis.name,
    crisisIcon: crisis.icon,
    // ⚠️ `triggerEP` là con số DUY NHẤT trả lời "khủng hoảng kế tiếp còn bao xa", và trước
    // 2026-09-01 nó được đọc bởi **0 component** — chỉ `constants.js` khai và `challengeEngine.js`
    // dò. Không màn nào nói cho người chơi biết mốc ấy tồn tại.
    triggerEP: crisis.triggerEP,
    era: Number(era),
  }));

const STAGE_TOKENS = [
  {
    label: 'Cơ Bản',
    accent: '#9a5a48',
    accentSoft: 'rgba(var(--accent-rgb), 0.08)',
    accentBorder: 'rgba(var(--accent-rgb), 0.18)',
    darkCard: 'border-white/8 bg-white/[0.04]',
    darkBadge: 'bg-white/[0.05] border border-white/8 text-[var(--accent-light)]',
  },
  {
    label: 'Tiến Hóa',
    accent: '#7a6877',
    accentSoft: 'rgba(122, 104, 119, 0.10)',
    accentBorder: 'rgba(122, 104, 119, 0.18)',
    darkCard: 'border-white/8 bg-white/[0.04]',
    darkBadge: 'bg-white/[0.05] border border-white/8 text-[var(--accent-light)]',
  },
  {
    label: 'Huyền Thoại',
    accent: '#9c7645',
    accentSoft: 'rgba(156, 118, 69, 0.10)',
    accentBorder: 'rgba(156, 118, 69, 0.20)',
    darkCard: 'border-white/8 bg-white/[0.04]',
    darkBadge: 'bg-white/[0.05] border border-white/8 text-[var(--accent-light)]',
  },
];

function getDisplayedRelicEvolutionCost(buildings = [], nextStageDef) {
  const baseCost = getRelicEvolutionRefinedCost(nextStageDef);
  const hasDiscount = buildings.some(
    (bpId) => BUILDING_EFFECTS[bpId]?.wonderEffect === 'relic_evo_30off',
  );
  if (!hasDiscount) return baseCost;
  return Math.max(1, Math.round(baseCost * 0.7));
}

function paperCardStyle(lightTheme, accentBorder = 'var(--line)', accentShadow = 'rgba(31, 30, 29, 0.05)') {
  if (!lightTheme) return null;
  return {
    background: 'var(--card-bg-solid)',
    border: `var(--skin-card-border-width, 1px) solid ${accentBorder}`,
    borderRadius: 'var(--skin-radius-card, 18px)',
    boxShadow: 'var(--skin-card-shadow, 0 12px 26px ' + accentShadow + ')',
  };
}

export default function RelicInventory() {
  const relics = useGameStore((s) => s.relics);
  const relicEvolutions = useGameStore((s) => s.relicEvolutions ?? {});
  const totalEP = useGameStore((s) => s.progress?.totalEP ?? 0);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const collectedIds = new Set(relics.map((r) => r.id));

  return (
    <div className="space-y-5">
      <div>
        {/*
          ⚠️ CHỮ "DI VẬT" TỪNG XUẤT HIỆN BA LẦN trong ba dòng liên tiếp (soi ảnh 390px,
          2026-08-29): nút tab con đang sáng · eyebrow `mono` · rồi `h2` cỡ 2rem. Ba lần cùng một
          chữ cách nhau vài chục điểm ảnh, tốn ~110px ở chỗ đắt nhất — trong khi nút tab đang sáng
          đã trả lời xong câu "tôi đang ở đâu". Giữ lại đúng dòng MANG THÔNG TIN ("0/15 — chinh
          phục Khủng Hoảng Kỷ Nguyên để nhận buff vĩnh viễn"), nâng nó lên cỡ đọc được.
          Cùng luật đã áp cho `ShellPane` và màn Thành tích: *hai chỗ nói cùng một chuyện thì chỗ
          nói ít hơn phải nhường.*
        */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[13px] leading-snug" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>
              {relics.length}/{ALL_RELIC_DEFS.length} — chinh phục Khủng Hoảng Kỷ Nguyên để nhận buff vĩnh viễn.
            </p>
          </div>
          {/*
            ⚠️ CHIP "kho lưu trữ · N" ĐÃ GỠ (2026-08-29). `N` chính là con số đứng đầu dòng ngay
            bên trái ("0/15 — …"), cách chưa tới một đốt ngón tay — lần thứ tư cùng một thông tin
            trên một màn hình, sau nút tab / eyebrow / tiêu đề đã gỡ ở trên. Một chip nhấn màu chỉ
            đáng có khi nó nói điều gì khác.
          */}
        </div>
      </div>

      {/*
        ⚠️ THẺ RỖNG "Chưa có di vật nào" ĐÃ GỠ (2026-08-30) — nó là lần nói thứ HAI trong ba lần.
        Cùng một màn hình, khi chưa có di vật nào, từng nói điều đó ba chỗ: dòng ngay trên đầu
        ("0/15 — chinh phục Khủng Hoảng Kỷ Nguyên để nhận buff vĩnh viễn"), thẻ rỗng này, rồi tiêu
        đề của chính danh sách bên dưới ("Chưa thu thập"). Và câu hướng dẫn của thẻ này *"Chọn chế
        độ Đương Đầu khi Khủng Hoảng xuất hiện…"* là bản viết lại của câu nằm cách nó chưa tới 60px.
        Nó tốn ~500px — sau khi danh sách khoá được thu về một dòng mỗi cái (cùng ngày), thẻ rỗng
        này thành thứ TO NHẤT màn hình, và thứ to nhất đang nói rằng bạn không có gì.
        ⚠️ VÀ ĐÂY KHÔNG CHỈ LÀ CẮT CHO GỌN: bỏ nó đi thì thứ đầu tiên đập vào mắt là **danh sách
        những gì LẤY ĐƯỢC** thay vì một lời nhắc rằng bạn chưa có gì. Cùng một sự thật, hai cách
        mở màn hình, và chỉ một cách khiến người ta muốn đi lấy.
      */}
      {relics.length === 0 ? (
        <LockedRelics collectedIds={collectedIds} lightTheme={lightTheme} totalEP={totalEP} />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {relics.map((relic) => (
              <RelicCard
                key={relic.id}
                relic={relic}
                stage={relicEvolutions[relic.id] ?? 0}
                lightTheme={lightTheme}
              />
            ))}
          </div>
          <LockedRelics collectedIds={collectedIds} lightTheme={lightTheme} totalEP={totalEP} />
        </>
      )}
    </div>
  );
}

function RelicCard({ relic, stage, lightTheme }) {
  const enterMotion = useEnterMotion();
  const pressMotion = usePressMotion();
  // Phóng to khi DI CHUỘT không thuộc ba nhịp — đi qua cái gác ngoại lệ.
  const hoverGrow = useCustomMotion({ whileHover: { scale: 1.02 } });
  const evolveRelic = useGameStore((s) => s.evolveRelic);
  const resourcesRefined = useGameStore((s) => s.resourcesRefined);
  const buildings = useGameStore((s) => s.buildings);
  const tinhThe = useGameStore((s) => s.tinhThe);

  const [useTinhThe, setUseTinhThe] = React.useState(false);

  const evoDef = RELIC_EVOLUTION[relic.id];
  const maxStage = evoDef ? evoDef.stages.length - 1 : 0;
  const isMaxStage = stage >= maxStage;
  const nextStageDef = evoDef?.stages[stage + 1];
  const era = evoDef?.era ?? 1;
  const refined = normalizeRefinedBag(resourcesRefined?.[era]);
  const refinedDef = ERA_REFINED[era] ?? ERA_REFINED[1];
  const refinedCost = getDisplayedRelicEvolutionCost(buildings, nextStageDef);
  const canEvolve = !isMaxStage && refined.t2 >= refinedCost;
  const currentBuff = evoDef?.stages[stage]?.buff ?? relic.buff;
  const token = STAGE_TOKENS[stage] ?? STAGE_TOKENS[0];
  const hasTinhThe = (tinhThe ?? 0) > 0;

  return (
    <motion.div
      {...enterMotion}
      className={`p-5 ${lightTheme ? '' : `rounded-[var(--skin-radius-card,28px)] border ${token.darkCard}`}`}
      style={lightTheme ? paperCardStyle(lightTheme, token.accentBorder, 'rgba(31, 30, 29, 0.05)') : undefined}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className={`mono flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[var(--skin-radius-control,22px)] font-semibold ${hasGlyphIcon(relic.icon) ? 'text-[30px] leading-none' : 'text-[12px] uppercase tracking-[0.18em]'}`}
            style={lightTheme ? {
              background: token.accentSoft,
              border: `1px solid ${token.accentBorder}`,
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--accent-light)',
            }}
          >
            {getGlyph(relic.icon, relic.label, 'RL')}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={lightTheme ? 'text-[1.3rem] font-semibold leading-none tracking-[-0.02em]' : 'text-base font-semibold'}
                style={lightTheme ? { color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' } : { color: 'var(--ink)' }}
              >
                {relic.label}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${lightTheme ? '' : token.darkBadge}`}
                style={lightTheme ? {
                  background: token.accentSoft,
                  border: `1px solid ${token.accentBorder}`,
                  color: token.accent,
                } : undefined}
              >
                {token.label}
              </span>
            </div>

            <p className="mt-1 text-sm leading-relaxed" style={lightTheme ? { color: 'var(--muted)' } : { color: '#cbd5e1' }}>
              {relic.description}
            </p>

            <BuffTagRow buff={currentBuff} lightTheme={lightTheme} token={token} />
          </div>
        </div>

        <div className="w-full lg:max-w-[18rem]">
          <div className="flex items-center justify-between">
            <p className="mono text-[10px] uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)' } : { color: '#94a3b8' }}>
              Tiến hóa
            </p>
            <span className="text-xs" style={lightTheme ? { color: 'var(--muted)' } : { color: '#64748b' }}>
              {isMaxStage ? 'Tối đa' : `${token.label} → ${(STAGE_TOKENS[stage + 1] ?? token).label}`}
            </span>
          </div>

          {evoDef && (
            <div className="mt-2 flex items-center gap-2">
              {evoDef.stages.map((_, index) => {
                const done = index < stage;
                const current = index === stage;
                return (
                  <React.Fragment key={index}>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                      style={lightTheme ? {
                        background: done ? token.accent : current ? token.accentSoft : 'rgba(255,255,255,0.72)',
                        border: done
                          ? `1px solid ${token.accent}`
                          : current
                            ? `1px solid ${token.accentBorder}`
                            : '1px solid rgba(31, 30, 29, 0.08)',
                        color: done ? '#fffdf9' : current ? token.accent : '#8a8a86',
                      } : undefined}
                    >
                      {done ? '✓' : index + 1}
                    </div>
                    {index < evoDef.stages.length - 1 && (
                      <div
                        className="h-[2px] flex-1 rounded-full"
                        style={lightTheme ? {
                          background: done ? token.accent : 'rgba(31, 30, 29, 0.08)',
                        } : {
                          background: done ? '#f59e0b' : '#334155',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {!isMaxStage && nextStageDef && (
            <div
              className="mt-4 rounded-[var(--skin-radius-control,16px)] px-3 py-3"
              style={lightTheme ? {
                background: 'rgba(var(--accent-rgb), 0.05)',
                border: '1px solid var(--line)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="mono text-[10px] uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>
                  Chi phí tiến hóa
                </span>
                <span className="mono text-xs tabular-nums" style={lightTheme ? { color: refined.t2 >= refinedCost ? token.accent : '#9f4a3e' } : { color: refined.t2 >= refinedCost ? 'var(--accent-light)' : '#f87171' }}>
                  {Math.floor(refined.t2)}/{refinedCost} {refinedDef.t2Label}
                </span>
              </div>
              {refinedCost < getRelicEvolutionRefinedCost(nextStageDef) && (
                <p className="mt-1 text-[11px]" style={lightTheme ? { color: '#6f7b62' } : { color: 'var(--muted)' }}>
                  Đã áp dụng giảm 30% từ kỳ quan hỗ trợ.
                </p>
              )}
              {hasTinhThe && (
                <label
                  className="mt-2 flex cursor-pointer items-center justify-between gap-2"
                  style={{ userSelect: 'none' }}
                >
                  <span className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                    <input
                      type="checkbox"
                      checked={useTinhThe}
                      onChange={(e) => setUseTinhThe(e.target.checked)}
                      className="h-3.5 w-3.5"
                      style={{ accentColor: 'var(--accent2)' }}
                    />
                    Dùng Tinh Thể (giảm tối đa 50%)
                  </span>
                  <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--accent2)' }}>
                    {tinhThe} TTCH
                  </span>
                </label>
              )}
              <motion.button
                {...(canEvolve ? hoverGrow : {})}
                {...(canEvolve ? pressMotion : {})}
                onClick={() => canEvolve && evolveRelic(relic.id, useTinhThe && hasTinhThe ? { ttchToSpend: true } : undefined)}
                disabled={!canEvolve}
                className="mt-3 w-full rounded-[var(--skin-radius-control,16px)] py-2.5 text-sm font-semibold transition-colors"
                style={canEvolve ? (
                  lightTheme ? {
                    background: 'var(--ink)',
                    color: 'var(--card-bg-solid)',
                    border: '1px solid rgba(31,30,29,0.12)',
                    boxShadow: '0 10px 22px rgba(31, 30, 29, 0.10)',
                  } : {
                    background: 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                  }
                ) : (
                  lightTheme ? {
                    background: 'rgba(31, 30, 29, 0.06)',
                    color: '#8a8a86',
                    border: '1px solid var(--line)',
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    color: '#64748b',
                  }
                )}
              >
                {canEvolve ? 'Tiến hóa di vật' : 'Chưa đủ tài nguyên'}
              </motion.button>
            </div>
          )}

          {isMaxStage && (
            <div
              className="mt-4 rounded-[var(--skin-radius-control,16px)] px-3 py-3 text-sm font-semibold"
              style={lightTheme ? {
                background: token.accentSoft,
                border: `1px solid ${token.accentBorder}`,
                color: token.accent,
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--accent-light)',
              }}
            >
              Đã đạt giai đoạn huyền thoại.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function BuffTagRow({ buff, lightTheme, token }) {
  if (!buff) return null;

  const parts = [];
  if (buff.allBonus) parts.push(`+${(buff.allBonus * 100).toFixed(0)}% tất cả`);
  if (buff.epBonus) parts.push(`+${(buff.epBonus * 100).toFixed(0)}% EP`);
  if (buff.expBonus) parts.push(`+${(buff.expBonus * 100).toFixed(0)}% XP`);
  if (buff.resourceBonus) parts.push(`+${(buff.resourceBonus * 100).toFixed(0)}% tài nguyên`);
  if (buff.gachaBonus) parts.push(`+${buff.gachaBonus}% RP`);
  if (buff.pitySeal) parts.push(`+${buff.pitySeal * 2}% RP`);
  if (buff.disasterReduction) parts.push(`-${(buff.disasterReduction * 100).toFixed(0)}% thất thoát`);
  if (buff.comboWindowHours) parts.push(`+${buff.comboWindowHours}h combo`);
  if (buff.xpSeal) parts.push(`+${(buff.xpSeal * 100).toFixed(0)}% XP ★★★`);

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {parts.map((part) => (
        <span
          key={part}
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={lightTheme ? {
            background: token.accentSoft,
            border: `1px solid ${token.accentBorder}`,
            color: token.accent,
          } : {
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--ink)',
          }}
        >
          {part}
        </span>
      ))}
    </div>
  );
}

function LockedRelics({ collectedIds, lightTheme, totalEP }) {
  const locked = ALL_RELIC_DEFS.filter((relic) => !collectedIds.has(relic.id));
  if (!locked.length) return null;

  // ⚠️ HAI NHÓM, VÌ CHÚNG LÀ HAI SỰ THẬT KHÁC HẲN NHAU. `detectEraCrisis`
  // (`challengeEngine.js:187`) chỉ nổ đúng lúc `prevEP < triggerEP && newEP >= triggerEP` — tức
  // mỗi khủng hoảng có ĐÚNG MỘT khoảnh khắc trong cả đời một ván. Đi qua mốc rồi thì di vật ấy
  // **không bao giờ lấy được nữa**. Đo trên một ván 23.553 EP: 5/12 dòng đang khoá là loại ấy,
  // mà màn hình vẫn gộp chung và mời "chinh phục Khủng Hoảng Kỷ Nguyên để nhận" — một lời hứa
  // sai cho gần một nửa danh sách. Gộp chung thì cái danh sách vừa nói dối vừa vô dụng: người
  // chơi không biết dòng nào còn đáng chờ.
  const { conLay, daLo, sapToi, conBaoNhieuEP } = chiaNhomDiVat(ALL_RELIC_DEFS, collectedIds, totalEP);

  return (
    <section className="space-y-4">
      {sapToi ? (
        <div
          className="rounded-[18px] border px-3.5 py-3"
          style={{
            borderColor: lightTheme ? 'var(--line)' : 'rgba(255,255,255,0.08)',
            background: lightTheme ? 'rgba(255,255,255,0.72)' : 'rgba(30,41,59,0.4)',
          }}
        >
          <p className="mono text-[10px] uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)' } : { color: '#64748b' }}>
            Khủng hoảng kế tiếp
          </p>
          <p className="mt-1 text-[15px] font-semibold" style={lightTheme ? { color: 'var(--ink)' } : { color: '#e2e8f0' }}>
            {sapToi.crisisIcon} {sapToi.crisisName}
          </p>
          <div className="mt-2 overflow-hidden rounded-full" style={{ background: lightTheme ? 'var(--line)' : 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-[3px] rounded-full transition-all"
              style={{
                width: `${Math.max(2, Math.min(100, Math.floor((totalEP / sapToi.triggerEP) * 100)))}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <p className="mono mt-1.5 text-[11px]" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>
            còn {conBaoNhieuEP.toLocaleString('vi-VN')} EP · thắng thì được{' '}
            {sapToi.icon} {sapToi.label}
          </p>
        </div>
      ) : null}

      <div>
        <p className="mono text-[10px] uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)' } : { color: '#64748b' }}>
          Còn lấy được
        </p>
        <p className="mt-1 text-sm font-semibold" style={lightTheme ? { color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' } : { color: '#e2e8f0' }}>
          {conLay.length} di vật phía trước
        </p>
      </div>

      {/*
        ⚠️ HIỆN PHẦN THƯỞNG THẬT, KHÔNG PHẢI "???". Mỗi phần tử `ALL_RELIC_DEFS` mang 7 trường
        (id · label · icon · description · buff · crisisName · crisisIcon) và bản cũ dùng đúng
        HAI (`id` làm khoá, `crisisName` làm chữ) — **5/7 trường bị vứt, trong đó có chính cái
        tên và cái phần thưởng**. Mười lăm dòng "???" giống hệt nhau không tạo ra ham muốn nào;
        chúng chỉ nói "bạn đang thiếu mười lăm thứ".
        ⚠️ Vẫn GIỮ tên khủng hoảng ở mỗi dòng — nó là danh từ riêng trả lời đúng câu *"cái này
        rơi ở đâu"*, và một vòng soi trước đã bác đúng đắn đề nghị thay 15 dòng bằng một dòng tổng.
      */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-0 sm:grid-cols-2">
        {conLay.map((relic) => (
          <div
            key={relic.id}
            className="flex items-baseline justify-between gap-3 border-b py-2.5"
            style={{ borderColor: lightTheme ? 'var(--line)' : 'rgba(255,255,255,0.08)' }}
          >
            <p className="min-w-0 flex-1 truncate text-[13px]" style={lightTheme ? { color: 'var(--ink-2)' } : { color: '#cbd5e1' }}>
              <span className="mr-1">{relic.icon}</span>
              <span className="font-semibold">{relic.label}</span>
              <span style={{ opacity: 0.7 }}> · từ {relic.crisisName}</span>
            </p>
          </div>
        ))}
      </div>

      {daLo.length > 0 ? (
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted-2)' } : { color: '#64748b' }}>
            Đã lỡ trong ván này
          </p>
          {/*
            ⚠️ NÓI THẲNG RA THAY VÌ ĐỂ NGƯỜI CHƠI CHỜ MÃI. Khủng hoảng chỉ nổ đúng một lần lúc
            vượt mốc EP, nên đi qua rồi là hết — giấu chuyện đó đi thì người chơi vẫn nhìn danh
            sách và tưởng mình còn cơ hội. Chúng sẽ quay lại ở ván sau (Prestige), nên đây là một
            sự thật về LƯỢT CHƠI NÀY, không phải một cánh cửa đóng vĩnh viễn.
          */}
          <p className="mt-1 text-[12px]" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>
            {daLo.length} di vật đã đi qua mốc — ván sau (Prestige) mới gặp lại:{' '}
            {daLo.map((relic) => relic.label).join(' · ')}
          </p>
        </div>
      ) : null}
    </section>
  );
}
