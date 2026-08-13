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
import { withEraCompletion } from '../engine/cityCompletion';
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
  // Công trình Đàm vừa chạm vào — chỉ giữ `{ kind, bpId }`, KHÔNG giữ cả object. Bố cục được tính
  // lại mỗi khi thành phố đổi, nên giữ nguyên object cũ nghĩa là thẻ thông tin sẽ hiện số liệu
  // của một phiên bản thành phố không còn tồn tại (rõ nhất ở giàn giáo: "còn 3 phiên" đứng im
  // trong khi phiên vừa xong đã kéo nó xuống 2).
  const [picked, setPicked] = useState(null);

  // ⚠️ KHOÁ THEO NỘI DUNG của state SỐNG, không theo danh tính mảng — store trả về mảng mới ở mỗi
  // lượt render. Hai khoá này CỐ Ý tách khỏi `builtKey`/`pendingKey` bên dưới: mấy khoá kia đi theo
  // kỷ ĐANG XEM (có thể là một kỷ trong bảo tàng), còn bảng sưu tập của kỷ HIỆN TẠI thì luôn phải
  // đọc state sống dù Đàm đang ngắm kỷ nào.
  const liveBuiltKey = Array.isArray(buildings) ? buildings.join(',') : '';
  const livePendingKey = (Array.isArray(craftingQueue) ? craftingQueue : [])
    .map((item) => item?.bpId).join(',');

  const eras = useMemo(
    () => withEraCompletion(listVisitableEras(cityArchive, activeBook), {
      built:   buildings,
      pending: craftingQueue,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cityArchive, activeBook, liveBuiltKey, livePendingKey],
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

  // ⚠️ GIÀN GIÁO NAY CÓ Ở CẢ KỶ CŨ — nhưng CHỈ vì nó đã thành sự thật, không phải vì tiện.
  //
  // Trước Phase 4D, dòng này là `isCurrent ? craftingQueue : null` với lý do: bảo tàng là ẢNH CHỤP
  // lúc niêm phong, ở thành phố đã đóng thì chẳng còn ai xây gì, dựng giàn giáo lên đó là NÓI DỐI
  // về quá khứ. Lý do ấy đúng — cho tới khi "di sản dang dở" (`engine/eraLegacy.js`) làm cho việc
  // xây tiếp ở kỷ cũ trở thành chuyện có thật. Nay giấu giàn giáo đi mới là nói dối: Đàm đang bỏ
  // phiên vào một công trình mà thành phố duy nhất có thể cho anh thấy nó lại không cho.
  //
  // ⚠️ Bất biến "bảo tàng bất động" (ADR-007) KHÔNG bị phá: `computeCityLayout` đặt công trình vào
  // khu đất cố định theo `rank`, nên thêm một căn nhà không xê dịch căn nào đã có. Truyền cả hàng
  // đợi vào là an toàn vì chính `computeCityLayout` lọc theo `era` — kỷ nào chỉ thấy giàn giáo của
  // kỷ đó.
  const pending = craftingQueue;

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

  // Tra lại trong bố cục MỚI NHẤT ở mỗi lượt vẽ ⇒ thẻ thông tin luôn nói con số hiện tại. Công
  // trình biến mất (đổi kỷ, xây xong thành nhà thật) ⇒ `undefined` ⇒ thẻ tự đóng, không cần dọn.
  const selection = useMemo(() => {
    if (!picked?.bpId) return null;
    const list = picked.kind === 'scaffold' ? layout.scaffolds : layout.buildings;
    const found = (list ?? []).find((entry) => entry.bpId === picked.bpId);
    return found ? { ...found, kind: picked.kind } : null;
  }, [picked, layout]);

  return (
    <CityViewShell
      eras={eras}
      viewing={viewing}
      layout={layout}
      stats={{ sessionCount, streakLength }}
      onSelectEra={(next) => { setPicked(null); setViewingEra(next); }}
      selectedId={selection?.bpId ?? null}
    >
      <CityStage
        layout={layout}
        dimmed={!isCurrent}
        reduceMotion={!!reduceMotion}
        sessionCount={sessionCount}
        streakLength={streakLength}
        onPick={setPicked}
        selection={selection}
      />
    </CityViewShell>
  );
}
