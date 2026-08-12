/**
 * CityView.jsx — màn hình "Thành Phố".
 *
 * Mỗi công trình đã xây hiện thành một căn nhà trên lưới 12×12. Chuyển được sang các kỷ đã niêm
 * phong ("bảo tàng") để ngắm lại thành phố cũ.
 *
 * File này chỉ lo ba việc, cố ý giữ mỏng:
 *   1. lấy dữ liệu đúng nguồn (kỷ hiện tại = state sống · kỷ cũ = ảnh chụp lúc niêm phong),
 *   2. suy ra bố cục,
 *   3. chọn bộ vẽ rồi thả vào khung `CityViewShell`.
 * Trình bày nằm ở `city/CityViewShell.jsx`, cách vẽ nằm ở `city/render2d/`.
 *
 * ⚠️ Toạ độ KHÔNG nằm trong state — `computeCityLayout` suy ra từ chính id công trình mỗi lần vẽ
 * (xem ADR-007). Vì vậy hàm đó BẮT BUỘC phải bọc `useMemo`, và tuyệt đối không quét lại `history`
 * trong lúc render (lỗi đã ghi ở `TECH_DEBT #6`).
 */

import { useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import { computeCityLayout } from '../engine/cityLayout';
import { listVisitableEras } from '../engine/cityArchive';
import CityViewShell from './city/CityViewShell';
import CityStage from './city/CityStage';

export default function CityView() {
  const buildings       = useGameStore((s) => s.buildings);
  const buildingLevels  = useGameStore((s) => s.buildingLevels);
  const cityArchive     = useGameStore((s) => s.cityArchive);
  const craftingQueue   = useGameStore((s) => s.craftingQueue);
  const activeBook      = useGameStore((s) => s.progress.activeBook);
  const sessionsInEra   = useGameStore((s) => s.eraTracking?.sessionsInCurrentEra);
  const currentStreak   = useGameStore((s) => s.streak?.currentStreak);

  const reduceMotion = useReducedMotion();
  const [viewingEra, setViewingEra] = useState(activeBook);

  const eras = useMemo(
    () => listVisitableEras(cityArchive, activeBook),
    [cityArchive, activeBook],
  );

  // Kỷ đang xem có thể biến mất khỏi danh sách (vd nhận dữ liệu mới từ cloud) → lùi về kỷ hiện tại.
  const viewing = eras.find((era) => era.era === viewingEra) ?? eras.find((era) => era.isCurrent) ?? eras[0];
  const era = viewing?.era ?? activeBook;
  const isCurrent = !!viewing?.isCurrent;

  // Nguồn dữ liệu KHÁC NHAU tuỳ đang xem kỷ nào — chỗ này dễ sai nhất cả màn hình:
  //   • kỷ hiện tại      → state sống
  //   • kỷ đã niêm phong → ảnh chụp lúc niêm phong (`eraTracking` KHÔNG có lịch sử theo kỷ)
  const built  = isCurrent ? buildings : (viewing?.built ?? []);
  const levels = isCurrent ? buildingLevels : (viewing?.levels ?? {});
  const sessionCount = isCurrent ? (sessionsInEra ?? 0) : (viewing?.sessionCount ?? 0);
  const streakLength = isCurrent ? (currentStreak ?? 0) : 0;

  // ⚠️ GIÀN GIÁO CHỈ CÓ Ở KỶ HIỆN TẠI. Bảo tàng là ẢNH CHỤP lúc niêm phong, và ở một thành phố đã
  // niêm phong thì chẳng còn ai đang xây gì nữa — dựng giàn giáo lên đó là nói dối về quá khứ, đúng
  // thứ bất biến "bảo tàng bất động" mà ADR-007 dựng lên. (`craftingQueue` trong store vốn đã được
  // gạn theo kỷ hiện tại, và `computeCityLayout` cũng lọc theo kỷ lần nữa — nhưng cả hai lớp đó
  // đều là lưới an toàn, còn Ý ĐỊNH thì phải nói rõ ngay tại chỗ này.)
  const pending = isCurrent ? craftingQueue : null;

  const builtKey  = Array.isArray(built) ? built.join(',') : '';
  const levelsKey = Object.entries(levels ?? {}).map(([id, lv]) => `${id}:${lv}`).sort().join(',');
  // Khoá theo NỘI DUNG chứ không theo danh tính mảng: mỗi lượt render store trả về một mảng mới,
  // mà `layout` đổi thì `CityScene3D` dựng lại CẢ CẢNH WebGL.
  const pendingKey = (Array.isArray(pending) ? pending : [])
    .map((item) => `${item?.bpId}:${item?.sessionsRemaining}`).join(',');

  const layout = useMemo(
    () => computeCityLayout({
      built: builtKey ? builtKey.split(',') : [],
      levels,
      era,
      stats: { sessionCount, streakLength },
      pending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builtKey, levelsKey, era, sessionCount, streakLength, pendingKey],
  );

  return (
    <CityViewShell
      eras={eras}
      viewing={viewing}
      layout={layout}
      stats={{ sessionCount, streakLength }}
      onSelectEra={setViewingEra}
    >
      <CityStage
        layout={layout}
        dimmed={!isCurrent}
        reduceMotion={!!reduceMotion}
        sessionCount={sessionCount}
        streakLength={streakLength}
      />
    </CityViewShell>
  );
}
