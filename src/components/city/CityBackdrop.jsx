/**
 * CityBackdrop.jsx — THÀNH PHỐ RA TRANG CHỦ (Phase 3F).
 *
 * Đàm: *"đem nó ra trang chủ hoặc làm cái gì đó đột phá hơn nữa"*.
 *
 * ⚠️ VÌ SAO ĐÂY LÀ THAY ĐỔI CÓ SỨC NẶNG NHẤT CỦA CẢ NHÁNH 3D, DÙ CODE ÍT NHẤT:
 * Cho tới giờ, thành phố nằm trong một tab riêng — muốn thấy nó thì phải chủ động đi tìm, mà lúc
 * đang tập trung thì không ai đi tìm cả. Nghĩa là **thứ Đàm xây được gần như vô hình đúng vào lúc
 * anh đang xây nó**. Đưa nó ra sau lưng cái đồng hồ đếm ngược thì vòng lặp khép kín lại: làm việc →
 * nhìn thấy thành phố lớn lên → muốn làm tiếp. Không thêm một tính năng nào, chỉ đổi chỗ đứng.
 *
 * ⚠️ VÀ CŨNG LÀ CHỖ NGUY HIỂM NHẤT VỀ PIN, vì đúng lý do đó: trang chủ là màn hình Đàm mở lâu nhất
 * (25 phút mỗi phiên), khác hẳn tab Thành Phố vốn chỉ ghé vài chục giây. Nên ở đây luật ngặt hơn:
 *
 *   1. **Đang chạy phiên ⇒ thành phố ĐỨNG YÊN tuyệt đối** (`still`). Đứng yên nghĩa là 0 nhịp rAF
 *      chứ không phải "vẽ lại cùng một hình" — xem `renderLoop.js`. Vừa là quyết định về pin, vừa
 *      là quyết định về sự tập trung: có người đi lại lấp ló sau lưng đồng hồ thì mắt cứ bị kéo
 *      theo, mà cả màn hình này tồn tại để giữ yên tĩnh. Lúc RẢNH (chưa bấm bắt đầu) thì thành phố
 *      sống lại — đó là lúc nhìn ngắm hợp lý.
 *   2. **Không nhận thao tác** (`interactive={false}`): lớp nền mà nuốt cú cuộn trang thì hỏng cả
 *      trang chủ.
 *   3. **Không có bản 2D dự phòng ở đây** — máy không chạy được 3D thì trả về nền trơn như cũ.
 *   4. Đàm tắt được hẳn trong Cài đặt (`cityHomeBackdrop`), và "giảm chuyển động" của hệ điều hành
 *      vẫn được tôn trọng như mọi chỗ khác.
 *
 * ⚠️ CHỈ VẼ KỶ HIỆN TẠI. Bảo tàng (các kỷ đã niêm phong) là chỗ để GHÉ THĂM có chủ đích ở tab
 * Thành Phố; đặt một thành phố quá khứ làm nền cho việc hôm nay thì sai hẳn ý nghĩa.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'framer-motion';

import useGameStore from '../../store/gameStore';
import useSettingsStore from '../../store/settingsStore';
import { computeCityLayout } from '../../engine/cityLayout';
import AppErrorBoundary from '../AppErrorBoundary';
import CityStage from './CityStage';

/**
 * Độ mờ của lớp nền. Thấp có chủ ý — đây là KHUNG CẢNH, không phải nội dung.
 * ⚠️ Chữ trên trang chủ phải đọc được ở mọi tổ hợp theme × skin (8 tổ hợp). Lớp phủ ngay dưới đây
 * mới là thứ bảo đảm điều đó; con số này chỉ quyết định thành phố hiện ra đậm hay nhạt.
 */
const BACKDROP_OPACITY = 0.5;

/**
 * Dưới bề ngang này thì coi là điện thoại. Trùng ngưỡng `isMobile` trong `CityScene3D.jsx` (nơi nó
 * quyết định cỡ shadow map và số đèn đêm) — để hai ngưỡng không trôi khỏi nhau theo thời gian.
 */
const PHONE_QUERY = '(max-width: 767px)';

/**
 * Màn hình có hẹp không.
 *
 * ⚠️ Phải LẮNG NGHE `matchMedia`, không phải đọc `innerWidth` một lần lúc render: xoay ngang điện
 * thoại hay kéo hẹp cửa sổ Mac là chuyện xảy ra thật, mà đọc một lần thì thành phố kẹt vĩnh viễn ở
 * quyết định của giây đầu tiên.
 *
 * ⚠️ Và phải là `useSyncExternalStore` chứ không phải `useState` + `useEffect`. `matchMedia` đúng
 * nghĩa là một NGUỒN DỮ LIỆU BÊN NGOÀI React, mà cặp state+effect thì luôn render một lượt với giá
 * trị cũ rồi mới sửa lại — chính là kiểu "render dây chuyền" mà lint của dự án chặn. Hook này sinh
 * ra đúng cho việc này: React đọc thẳng giá trị hiện tại, không có lượt render thừa nào.
 */
const phoneStore = {
  subscribe(onChange) {
    const mq = window.matchMedia?.(PHONE_QUERY);
    if (!mq) return () => {};
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  },
  getSnapshot() {
    return window.matchMedia?.(PHONE_QUERY).matches === true;
  },
};

function useIsPhone() {
  return useSyncExternalStore(phoneStore.subscribe, phoneStore.getSnapshot, () => false);
}

export default function CityBackdrop({ hasFocusSessionInProgress = false }) {
  const enabled = useSettingsStore((s) => s.cityHomeBackdrop);

  const buildings      = useGameStore((s) => s.buildings);
  const buildingLevels = useGameStore((s) => s.buildingLevels);
  const activeBook     = useGameStore((s) => s.progress.activeBook);
  const sessionsInEra  = useGameStore((s) => s.eraTracking?.sessionsInCurrentEra);
  const currentStreak  = useGameStore((s) => s.streak?.currentStreak);

  const reduceMotion = useReducedMotion();
  const isPhone = useIsPhone();

  const sessionCount = sessionsInEra ?? 0;
  const streakLength = currentStreak ?? 0;

  // Cùng cách khoá phụ thuộc với `CityView.jsx`: mảng và object đổi danh tính ở mỗi lượt render,
  // mà `computeCityLayout` thì không rẻ và `CityScene3D` dựng lại CẢ CẢNH WEBGL khi `layout` đổi.
  const builtKey  = Array.isArray(buildings) ? buildings.join(',') : '';
  const levelsKey = Object.entries(buildingLevels ?? {}).map(([id, lv]) => `${id}:${lv}`).sort().join(',');

  const layout = useMemo(
    () => computeCityLayout({
      built: builtKey ? builtKey.split(',') : [],
      levels: buildingLevels,
      era: activeBook,
      stats: { sessionCount, streakLength },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builtKey, levelsKey, activeBook, sessionCount, streakLength],
  );

  if (!enabled) return null;
  // Chưa xây gì thì chưa có gì để khoe — và một bãi đất trống sau lưng đồng hồ trông như lỗi hiển
  // thị chứ không ra "thành phố của bạn sẽ mọc lên ở đây".
  if (!layout.buildings.length) return null;

  return (
    <AppErrorBoundary
      area="lớp nền thành phố ở trang chủ"
      // ⚠️ Hỏng thì BIẾN MẤT KHÔNG MỘT LỜI, đây là điểm mấu chốt. Mọi chỗ khác trong app hiện bảng
      // báo lỗi để Đàm biết đường xử lý; riêng chỗ này thì không — nó chỉ là thứ trang trí, mà cái
      // nó nằm phía sau lại là công cụ chính của cả app. Đánh đổi một bảng báo lỗi lấy việc cái
      // đồng hồ đếm ngược không bao giờ biến mất vì một lớp nền là đánh đổi quá hời.
      fallback={() => null}
      variant="section"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ opacity: BACKDROP_OPACITY }}
      >
        <CityStage
          layout={layout}
          sessionCount={sessionCount}
          streakLength={streakLength}
          reduceMotion={!!reduceMotion}
          // Đang chạy phiên ⇒ đứng yên tuyệt đối. Xem ghi chú đầu file.
          // ⚠️ ĐIỆN THOẠI THÌ LUÔN ĐỨNG YÊN, kể cả lúc rảnh. Trên màn hẹp, thẻ đồng hồ chiếm gần
          // hết bề ngang nên thành phố chỉ ló ra một dải mỏng sau phần lời chào — ở dải đó thì
          // vài cư dân cao 0,2 ô nhúc nhích là thứ MẮT KHÔNG NHẬN RA, trong khi cái giá phải trả
          // (vẽ 30 khung/giây liên tục) thì y hệt máy bàn. Đây đúng là chỗ mà bỏ hoạt hoạ đi không
          // mất gì cả: điện thoại lại là máy nhạy pin nhất, và là máy Đàm dùng nhiều nhất.
          still={hasFocusSessionInProgress || isPhone}
          chrome={false}
          fill
          interactive={false}
        />
      </div>

      {/*
        LỚP PHỦ GIỮ CHỮ ĐỌC ĐƯỢC — bắt buộc, không phải trang trí.

        ⚠️ Đây là chỗ mà "đẹp" và "dùng được" đối đầu nhau trực diện, và dùng được phải thắng: nền
        càng rõ thì chữ càng khó đọc, mà chữ ở đây là ĐỒNG HỒ ĐẾM NGƯỢC — thứ Đàm nhìn nhiều nhất
        trong cả app. Dải chuyển sắc đậm ở TRÊN (nơi có tiêu đề và mặt đồng hồ) và nhạt dần xuống
        DƯỚI, nên thành phố lộ ra rõ nhất ở khoảng trống phía dưới — đúng chỗ chẳng có chữ gì.

        Dùng `var(--canvas)` chứ KHÔNG phải một mã màu cố định: app có 2 theme × 4 skin, một màu
        chốt cứng sẽ sai ở 7/8 tổ hợp. `color-mix` cho phép lấy chính màu nền của theme rồi pha
        loãng — vẫn đúng luật "chỉ dùng biến CSS" mà không cần thêm token mới.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom,'
            + ' color-mix(in srgb, var(--canvas) 92%, transparent) 0%,'
            + ' color-mix(in srgb, var(--canvas) 80%, transparent) 38%,'
            + ' color-mix(in srgb, var(--canvas) 55%, transparent) 72%,'
            + ' color-mix(in srgb, var(--canvas) 34%, transparent) 100%)',
        }}
      />
    </AppErrorBoundary>
  );
}
