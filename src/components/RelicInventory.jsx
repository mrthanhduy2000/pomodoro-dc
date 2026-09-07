/**
 * RelicInventory.jsx — Kho Di Vật
 *
 * ⚠️ ADR-070 (2026-09-06, đóng `TECH_DEBT #96`): KHÔNG CÒN NÚT "TIẾN HOÁ", KHÔNG CÒN GIÁ. Di vật lên
 * bậc theo số PHIÊN ≥25′ đã hoàn thành kể từ lúc nhận (`engine/relicGrowth.js`, chốt ở
 * `completeFocusSession`, kể ở chuỗi thẻ thưởng). Màn này chỉ trả lời "còn bao nhiêu phiên". Giá cũ
 * (tinh luyện của kỷ ĐÃ QUA) là một cánh cửa khoá vĩnh viễn: tinh luyện chỉ rơi vào kỷ đang chơi, nên
 * 14/15 di vật không bao giờ tiến hoá được — nút ấy đứng đó nói dối suốt nhiều tháng.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useEnterMotion } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { chiaNhomDiVat } from './relicReach';
import useSettingsStore from '../store/settingsStore';
import { ERA_CRISES, RELIC_EVOLUTION, RELIC_EVOLVE_MIN_MINUTES } from '../engine/constants';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import { describeBuffParts } from '../engine/buffLabel.js';
import { describeRelicGrowth } from '../engine/relicGrowth.js';
import { wonderRelicEvolveFactor } from '../engine/wonderEffects.js';

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

/** Dòng mở đầu nói mốc lên bậc bằng chữ — đọc từ bảng, không chép số. */
const RELIC_EVOLVE_SESSIONS_TEXT = `${describeRelicGrowth({ relic: { id: 'mam_song_bat_diet', earnedAt: 0 } }).nextAt} phiên ≥${RELIC_EVOLVE_MIN_MINUTES}′`;

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
  const history = useGameStore((s) => s.history);
  const buildings = useGameStore((s) => s.buildings);
  const totalEP = useGameStore((s) => s.progress?.totalEP ?? 0);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const collectedIds = new Set(relics.map((r) => r.id));
  // Kỳ quan kỷ 15 rút ngắn mốc phiên — đọc qua `wonderEffects`, không chép tay (bài học 2026-09-05).
  const factor = wonderRelicEvolveFactor(buildings);
  // Đếm phiên trên toàn lịch sử cho từng di vật — khoá theo đúng ba lát state nó đọc, vì lịch sử có
  // thể dài 2.000 dòng và màn này dựng lại mỗi lần đổi tab.
  const growthById = React.useMemo(() => Object.fromEntries(relics.map((relic) => [
    relic.id,
    describeRelicGrowth({ relic, stage: relicEvolutions[relic.id] ?? 0, history, factor }),
  ])), [relics, relicEvolutions, history, factor]);

  return (
    <div className="space-y-5">
      <div>
        {/*
          ⚠️ CHỮ "DI VẬT" TỪNG XUẤT HIỆN BA LẦN trong ba dòng liên tiếp (soi ảnh 390px,
          2026-08-29): nút tab con đang sáng · eyebrow `mono` · rồi `h2` cỡ 2rem. Ba lần cùng một
          chữ cách nhau vài chục điểm ảnh, tốn ~110px ở chỗ đắt nhất — trong khi nút tab đang sáng
          đã trả lời xong câu "tôi đang ở đâu". Giữ lại đúng dòng MANG THÔNG TIN, nâng nó lên cỡ
          đọc được. Cùng luật đã áp cho `ShellPane` và màn Thành tích: *hai chỗ nói cùng một chuyện
          thì chỗ nói ít hơn phải nhường.*
        */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[13px] leading-snug" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>
              {relics.length}/{ALL_RELIC_DEFS.length} — qua Thử thách kỷ nguyên là có; mỗi {RELIC_EVOLVE_SESSIONS_TEXT} lại lên bậc.
            </p>
          </div>
        </div>
      </div>

      {/*
        ⚠️ THẺ RỖNG "Chưa có di vật nào" ĐÃ GỠ (2026-08-30) — nó là lần nói thứ HAI trong ba lần.
        Bỏ nó đi thì thứ đầu tiên đập vào mắt là **danh sách những gì LẤY ĐƯỢC** thay vì một lời
        nhắc rằng bạn chưa có gì. Cùng một sự thật, hai cách mở màn hình, và chỉ một cách khiến
        người ta muốn đi lấy.
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
                growth={growthById[relic.id]}
                factor={factor}
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

function RelicCard({ relic, stage, growth, factor, lightTheme }) {
  const enterMotion = useEnterMotion();

  const evoDef = RELIC_EVOLUTION[relic.id];
  const maxStage = evoDef ? evoDef.stages.length - 1 : 0;
  const isMaxStage = stage >= maxStage;
  const nextStageDef = evoDef?.stages[stage + 1];
  const currentBuff = evoDef?.stages[stage]?.buff ?? relic.buff;
  const token = STAGE_TOKENS[stage] ?? STAGE_TOKENS[0];
  const nextToken = STAGE_TOKENS[stage + 1] ?? token;
  const sessions = growth?.sessions ?? 0;
  const nextAt = Math.max(1, growth?.nextAt ?? 1);
  const remaining = growth?.remaining ?? nextAt;
  const pct = Math.max(2, Math.min(100, Math.floor((sessions / nextAt) * 100)));

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
              {isMaxStage ? 'Tối đa' : `${token.label} → ${nextToken.label}`}
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
              {/*
                ⚠️ TIẾN ĐỘ, KHÔNG PHẢI GIÁ. Con số bên phải là phiên ≥25′ đã làm KỂ TỪ LÚC NHẬN —
                phiên nhận không tính, và phiên trước khi có di vật cũng không (nếu không thì một
                người chơi lâu năm nhận di vật là lên thẳng Huyền Thoại, tức chẳng có gì để chờ).
              */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="mono text-[10px] uppercase tracking-[0.2em]" style={lightTheme ? { color: 'var(--muted)' } : { color: '#94a3b8' }}>
                  Phiên ≥{RELIC_EVOLVE_MIN_MINUTES}′ từ khi nhận
                </span>
                <span className="mono text-xs tabular-nums" style={lightTheme ? { color: token.accent } : { color: 'var(--accent-light)' }}>
                  {sessions}/{nextAt}
                </span>
              </div>
              <div className="mt-2 overflow-hidden rounded-full" style={{ background: lightTheme ? 'var(--line)' : 'rgba(255,255,255,0.1)' }}>
                <div className="h-[3px] rounded-full" style={{ width: `${pct}%`, background: token.accent }} />
              </div>
              <p className="mt-2 text-[12px] leading-snug" style={lightTheme ? { color: 'var(--ink-2)' } : { color: '#cbd5e1' }}>
                Còn {remaining} phiên nữa lên «{nextToken.label}»
                {describeBuffParts(nextStageDef.buff).length > 0 ? ` — ${describeBuffParts(nextStageDef.buff).join(' · ')}` : ''}.
              </p>
              {factor < 1 && (
                <p className="mt-1 text-[11px]" style={lightTheme ? { color: '#6f7b62' } : { color: 'var(--muted)' }}>
                  Kỳ quan đang rút ngắn mốc {Math.round((1 - factor) * 100)}%.
                </p>
              )}
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
  // Cùng phép dịch với thẻ "di vật lên bậc" trong chuỗi thẻ thưởng (`engine/buffLabel.js`).
  const parts = describeBuffParts(buff);
  if (parts.length === 0) return null;

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
  // (`challengeEngine.js`) chỉ nổ đúng lúc `prevEP < triggerEP && newEP >= triggerEP` — tức
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
            Thử thách kế tiếp
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
            còn {conBaoNhieuEP.toLocaleString('vi-VN')} EP · qua thì được{' '}
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
            <p className="min-w-0 flex-1 text-[13px] leading-snug" style={lightTheme ? { color: 'var(--ink-2)' } : { color: '#cbd5e1' }}>
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
