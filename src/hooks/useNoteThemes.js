/**
 * useNoteThemes — gom GHI CHÚ thành chủ đề theo nghĩa (engine semantic thuần-JS,
 * chạy trên máy, 0 tải). Memo theo lịch sử. Tách riêng, KHÔNG đụng đường coachIntel.
 */
import { useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { analyzeNoteThemes } from '../engine/semantic/semantic';

export default function useNoteThemes() {
  const history = useGameStore((s) => s.history);
  return useMemo(() => analyzeNoteThemes(history ?? []), [history]);
}
