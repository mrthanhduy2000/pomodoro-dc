/**
 * ExportImport.jsx — Xuất / Nhập Dữ Liệu Game
 * ─────────────────────────────────────────────────────────────────────────────
 * Card nhỏ trong tab Cài Đặt.
 * - Xuất: serialize toàn bộ store state → JSON blob download
 * - Nhập: file input → parse JSON → call _importGameData
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore, { GAME_STORE_EXPORT_VERSION } from '../store/gameStore';
import { formatVietnamOffsetISOString, localDateStr } from '../engine/time';
import { EXPORT_FILENAME_PREFIX } from '../lib/appIdentity';

export default function ExportImport() {
  const storeState   = useGameStore.getState;
  const importData   = useGameStore((s) => s._importGameData);
  const fileInputRef = useRef(null);

  const [importStatus, setImportStatus] = useState(null); // { type, message } | null

  const handleExport = () => {
    const state = storeState();
    // Only export persisted fields
    const exportObj = {
      _version:     GAME_STORE_EXPORT_VERSION,
      _exportedAt:  formatVietnamOffsetISOString(),
      player:       state.player,
      progress:     state.progress,
      resources:    state.resources,
      timerConfig:  state.timerConfig,
      forgiveness:  state.forgiveness,
      rankSystem:   state.rankSystem,
      rankChallenge: state.rankChallenge,
      eraCrisis:    state.eraCrisis,
      relics:       state.relics,
      blueprints:   state.blueprints,
      achievements: state.achievements,
      history:      state.history,
      historyStats: state.historyStats,
      savedNotes:   state.savedNotes,
      sessionCategories: state.sessionCategories,
      pendingCategoryId: state.pendingCategoryId,
      pendingNote:  state.pendingNote,
      pendingBreakNote: state.pendingBreakNote,
      pendingSessionGoal: state.pendingSessionGoal,
      pendingNextSessionNote: state.pendingNextSessionNote,
      streak:       state.streak,
      missions:     state.missions,
      buildings:    state.buildings,
      staking:      state.staking,
      prestige:     state.prestige,
      timerSession: state.timerSession,
      breakSession: state.breakSession,
      weeklyChain:  state.weeklyChain,
      combo:        state.combo,
      dailyTracking: state.dailyTracking,
      skillActivations: state.skillActivations,
      categoryTracking: state.categoryTracking,
      eraTracking:  state.eraTracking,
      sessionMeta:  state.sessionMeta,
      research:     state.research,
      craftingQueue: state.craftingQueue,
      buildingHP:   state.buildingHP,
      buildingLevels: state.buildingLevels,
      resourcesRefined: state.resourcesRefined,
      relicEvolutions: state.relicEvolutions,
      lastWeeklyReportDate: state.lastWeeklyReportDate,
      buildingLastUsed: state.buildingLastUsed,
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${EXPORT_FILENAME_PREFIX}-${localDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text   = await file.text();
      const parsed = JSON.parse(text);
      const result = importData(parsed);
      setImportStatus({
        type: result.ok ? 'success' : 'error',
        message: result.message,
      });
    } catch (error) {
      console.error('[ExportImport] Failed to parse import file', { error, fileName: file.name });
      setImportStatus({
        type: 'error',
        message: error instanceof SyntaxError
          ? 'File JSON không hợp lệ. Hãy kiểm tra lại nội dung backup.'
          : 'Không thể đọc file đã chọn.',
      });
    }

    // Reset input so same file can be re-imported
    e.target.value = '';
    setTimeout(() => setImportStatus(null), 3000);
  };

  return (
    <div className="space-y-3">
      <div
        className="rounded-[24px] border px-4 py-4"
        style={{ background: 'var(--card-bg-solid, rgba(255,255,255,0.94))', borderColor: 'var(--line-2, #d9d6cc)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--muted-2, #9b9892)' }}>
          Dữ liệu
        </p>
        <h3 className="mt-2 text-[1.6rem] font-semibold leading-none" style={{ color: 'var(--ink, #1f1e1d)', fontFamily: '"Source Serif 4", Georgia, serif' }}>
          Xuất hoặc khôi phục dữ liệu
        </h3>
        <p className="mt-3 text-[13px] leading-6" style={{ color: 'var(--muted, #6a6862)' }}>
          Tạo một bản sao JSON trước khi đổi máy hoặc thử những thay đổi lớn. Khi nhập lại, toàn bộ tiến trình sẽ được phục hồi từ file sao lưu đó.
        </p>
      </div>

      {/* Status banner */}
      {importStatus && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[18px] border px-3 py-2.5 text-center text-xs font-medium"
          style={importStatus.type === 'success'
            ? {
                background: 'var(--good-soft, #e5ecdf)',
                borderColor: 'rgba(91,122,82,0.2)',
                color: 'var(--good, #5b7a52)',
              }
            : {
                background: 'rgba(201,100,66,0.1)',
                borderColor: 'rgba(201,100,66,0.18)',
                color: 'var(--accent2, #8a3f24)',
              }}
        >
          {importStatus.message}
        </motion.div>
      )}

      <div className="flex gap-2">
        {/* Export */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          className="flex flex-1 items-center justify-center gap-2 rounded-[18px] px-3 py-3 text-xs font-bold transition-colors"
          style={{
            background: '#1f1e1d',
            color: '#faf9f6',
          }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.14em]">JSON</span>
          Xuất bản sao
        </motion.button>

        {/* Import */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleImportClick}
          className="flex flex-1 items-center justify-center gap-2 rounded-[18px] border px-3 py-3 text-xs font-bold transition-colors"
          style={{
            background: 'var(--card-bg-solid2, rgba(244,242,236,0.96))',
            borderColor: 'var(--line-2, #d9d6cc)',
            color: 'var(--ink, #1f1e1d)',
          }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.14em]">JSON</span>
          Khôi phục
        </motion.button>
      </div>

      <p className="text-center text-xs" style={{ color: 'var(--muted, #6a6862)' }}>
        Dữ liệu được lưu cục bộ. Xuất file khi muốn sao lưu hoặc chuyển thiết bị.
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
