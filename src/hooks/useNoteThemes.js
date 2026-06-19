/**
 * useNoteThemes — gom GHI CHÚ thành chủ đề theo nghĩa (engine semantic thuần-JS,
 * chạy trên máy, 0 tải). Memo theo lịch sử. Tách riêng, KHÔNG đụng đường coachIntel.
 */
import { useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { analyzeNoteThemes, collectNoteItems } from '../engine/semantic/semantic';

export default function useNoteThemes() {
  const history = useGameStore((s) => s.history);
  return useMemo(() => {
    const tfidf = analyzeNoteThemes(history ?? []);
    const collected = collectNoteItems(history ?? []);
    return { ...tfidf, items: collected.items, texts: collected.texts };
  }, [history]);
}
