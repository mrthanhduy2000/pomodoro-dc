import { useCallback, useMemo, useState } from 'react';

import useGameStore from '../store/gameStore';
import {
  describeStageCountdown,
  getEraStage,
  medianSessionEP,
  pickStageCelebration,
  stageMilestoneKey,
} from '../engine/eraStage';

/** Dấu "đã ăn mừng tới mốc nào" — chuyện của TỪNG MÁY, như `dc-nav-seen-v1` và `dc-coach-nudge-v1`.
 *  Đẩy vào state đồng bộ thì xem trên iPhone sẽ tắt mất lời chúc mừng trên Mac, và nó thêm một
 *  trường nữa vào khối JSONB đang chịu cơ chế CAS. */
export const STAGE_SEEN_KEY = 'dc-stage-seen-v1';

/** Đọc dấu. Trả `null` khi máy CHƯA TỪNG ghi — khác hẳn `0` (đã ghi, và lúc ấy đang ở mốc 0). */
export function readSeenStage(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STAGE_SEEN_KEY);
    if (raw === null || raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    // localStorage bị chặn (Safari riêng tư) → coi như chưa có dấu. Không ném lỗi ra giữa màn
    // hình vì một lời chúc mừng.
    return null;
  }
}

function writeSeenStage(storage, key) {
  if (!storage) return;
  try { storage.setItem(STAGE_SEEN_KEY, String(key)); } catch { /* ghi hỏng thì lần sau khen lại */ }
}

/**
 * Dòng ở màn Tập trung: **vừa vượt mốc** (ăn mừng) hoặc **còn bao xa tới mốc kế** (đếm ngược).
 *
 * ⚠️ HAI TRẠNG THÁI, MỘT DÒNG — cố ý. Màn Tập trung đã có ba dòng phụ; thêm dòng thứ tư là biến
 * màn hình yên tĩnh nhất của app thành bảng điều khiển. Mà hai câu này lại nối tiếp nhau rất tự
 * nhiên: *"còn 1 phiên nữa"* → làm phiên → *"🎉 Vừa mở «…»"*. Cùng một chỗ, đúng lúc mắt vừa nhìn.
 *
 * ⚠️ NHỊP LẤY TỪ LỊCH SỬ THẬT, KHÔNG TỪ CÀI ĐẶT: `focusMinutes` là phiên Đàm ĐỊNH làm, không phải
 * phiên anh THẬT SỰ làm (fixture 180 ngày: 588 phiên xong, 36 phiên huỷ).
 */
export default function useStageCountdown() {
  const activeBook = useGameStore((state) => state.progress.activeBook);
  const totalEP = useGameStore((state) => state.progress.totalEP);
  const history = useGameStore((state) => state.history);

  const storage = typeof window === 'undefined' ? null : window.localStorage;

  // Đọc MỘT lần rồi giữ trong state — mỗi lần đọc là một lượt chạm localStorage, mà hook này bị
  // hỏi lại ở mọi lần store nhúc nhích.
  const [seenKey, setSeenKey] = useState(() => readSeenStage(storage));

  const stage = useMemo(() => getEraStage(activeBook, totalEP), [activeBook, totalEP]);

  // ⚠️ GIEO DẤU LẦN ĐẦU RỒI IM LẶNG. Máy chưa có dấu thì mọi mốc đã qua đều "mới" — Đàm sẽ nhận
  // một lời chúc mừng cho chặng anh đi qua từ nhiều tuần trước. `pickStageCelebration` trả `null`
  // khi `seenKey === null`, và ở đây ta ghi luôn mốc hiện tại để lần sau so được.
  const celebration = stage ? pickStageCelebration(stage, activeBook, seenKey) : null;
  if (stage && seenKey === null) {
    const key = stageMilestoneKey(activeBook, stage.index);
    writeSeenStage(storage, key);
    setSeenKey(key);
  }

  const dismiss = useCallback(() => {
    if (!stage) return;
    const key = stageMilestoneKey(activeBook, stage.index);
    writeSeenStage(storage, key);
    setSeenKey(key);
  }, [activeBook, stage, storage]);

  const countdown = useMemo(() => {
    if (!stage) return null;
    return describeStageCountdown(stage, medianSessionEP(history));
  }, [stage, history]);

  if (celebration) {
    return { tone: 'celebrate', text: celebration.text, dismiss };
  }
  return countdown ? { ...countdown, dismiss: null } : null;
}
