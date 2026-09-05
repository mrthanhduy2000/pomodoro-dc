/**
 * useCountUp.js — một con số ĐẾM LÊN tới đích (ease-out bậc ba).
 *
 * Tách ra từ `LootDropModal.jsx` (2026-09-05, ADR-068): chuỗi thẻ thưởng sau phiên cũng cần đúng
 * nhịp đếm này, và hai bản chép tay là hai nhịp sớm muộn trôi khỏi nhau — cùng lý do
 * `lib/motionPresets.js` tồn tại.
 *
 * ⚠️ Bật "Giảm chuyển động" thì trả THẲNG đích: một con số nhảy từng bước vẫn là một hoạt hoạ, và
 * nó là loại hoạt hoạ tuỳ chọn ấy nhắm tới. Bản cũ trong `LootDropModal` không có vế này.
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useCountUp(target, duration = 1000, active = true) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active || reduceMotion) return undefined;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, active, reduceMotion]);

  if (!active) return 0;
  return reduceMotion ? target : value;
}
