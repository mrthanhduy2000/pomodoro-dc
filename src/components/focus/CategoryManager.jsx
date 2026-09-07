/**
 * CategoryManager.jsx — extracted from PomodoroEngine.jsx (ADR-077, round 37): the Focus screen keeps only what answers
 * "what session, how long, how long left"; leaf controls live here so the main file can be read.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEnterMotion } from '../../lib/motionPresets';
import useSettingsStore from '../../store/settingsStore';
import ActionButton from '../shared/ActionButton';

const Motion = motion;

export default function CategoryManager({ categories, onClose, onAdd, onDelete }) {
  const enterMotion = useEnterMotion();
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#f97316'];
  const defaultIds = ['cat_hoc_dh', 'cat_tu_hoc', 'cat_lam_viec', 'cat_doc_sach', 'cat_luyen_tap', 'cat_khac'];
  const customCategories = categories.filter((category) => !defaultIds.includes(category.id));

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;

    onAdd({ id: `cat_${Date.now()}`, label, icon: '', color: newColor });
    setNewLabel('');
  };

  return (
    <motion.div
      {...enterMotion}
      className={`mt-3 rounded-3xl border p-4 ${
        lightTheme
          ? 'border-[var(--line)] bg-[var(--card-bg-solid)] shadow-[0_18px_40px_rgba(31,30,29,0.06)]'
          : 'border-[var(--line)] bg-[var(--panel-soft)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold text-[var(--ink)]`}>Quản lý phân loại</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng quản lý phân loại"
          className={`text-xl leading-none transition text-[var(--muted)] hover:text-[var(--ink)]`}
        >
          ✕
        </button>
      </div>

      {customCategories.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {customCategories.map((category) => (
            <div
              key={category.id}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                lightTheme ? 'border-[var(--line)] bg-[rgba(244,242,236,0.78)]' : 'border-[var(--line)] bg-[var(--panel-soft)]'
              }`}
            >
              <span style={{ color: category.color }}>{category.label}</span>
              <button
                type="button"
                onClick={() => onDelete(category.id)}
                className={`text-xs font-semibold transition text-[var(--muted)] hover:text-[var(--accent2)]`}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`mt-4 rounded-2xl border p-3 ${
        lightTheme ? 'border-[var(--line)] bg-[rgba(244,242,236,0.78)]' : 'border-[var(--line)] bg-[var(--panel-soft)]'
      }`}>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              aria-label={`Chọn màu ${color}`}
              aria-pressed={newColor === color}
              className={`h-6 w-6 rounded-full ${newColor === color ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--canvas)]' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            name="newCategoryLabel"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAdd();
            }}
            aria-label="Tên phân loại mới"
            autoComplete="off"
            placeholder="Tên phân loại mới"
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm focus:outline-none ${
              lightTheme
                ? 'border-[var(--line)] bg-[var(--card-bg-solid)] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--line-2)]'
                : 'border-[var(--line)] bg-[var(--canvas-2)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--line)]'
            }`}
          />
          <button
            type="button"
            disabled={!newLabel.trim()}
            onClick={handleAdd}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${
              lightTheme
                ? 'border-[rgba(var(--accent-rgb),0.22)] bg-[var(--ink)] text-[var(--canvas)] hover:bg-[var(--ink-2)]'
                : 'border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.88)] text-[var(--canvas)] hover:bg-[rgba(var(--accent-rgb),0.78)]'
            }`}
          >
            Thêm
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * ActionButton — nút hành động chuẩn của app.
 *
 * ⚠️ MÀU ĐỌC TỪ TOKEN, KHÔNG RẼ NHÁNH THEO `lightTheme`. Bản cũ khai hai bảng màu cứng (một cho
 * sáng, một cho tối) với mã màu chốt thẳng vào chuỗi lớp — nên **đổi skin không đổi được nút**:
 * app có 5 skin × 2 chế độ = 10 tổ hợp, mà bảng cứng chỉ biết 2. Nay mỗi biến thể chỉ trỏ tới
 * token; token đã tự đổi theo CẢ skin lẫn chế độ sáng/tối, nên nút đi theo miễn phí. Vì vậy
 * component này KHÔNG còn đọc `useSettingsStore` nữa — nó không cần biết đang ở chế độ nào.
 *
 * ⚠️ BÓNG LÀ BÓNG ĐẶC (`0 4px 0 0`), KHÔNG PHẢI BÓNG MỜ. Bóng mờ nhiều lớp làm nút trông như một
 * thẻ giấy đang trôi; một vạch đặc dày 4px dưới đáy làm nó trông như một PHÍM BẤM có chiều dày.
 * Cả cảm giác bấm nằm ở chỗ đó: `whileTap` hạ nút xuống **đúng 4px** — bằng chiều dày vạch —
 * đồng thời `active:shadow-none` xoá vạch, nên mép dưới của nút đứng yên tại chỗ và mắt đọc ra
 * "nút vừa lún xuống chạm mặt bàn". Lệch hai con số ấy là hỏng hiệu ứng.
 *
 * ⚠️ VÌ SAO BÓNG XOÁ BẰNG CSS `active:` CHỨ KHÔNG BẰNG `whileTap: { boxShadow }` — đây là cái bẫy
 * đắt nhất ở đây. Framer Motion animate `boxShadow` bằng cách ghi một **style inline đã resolve**
 * (`var(--line-2)` bị thay bằng mã màu cụ thể tại thời điểm chạm). Style inline thắng mọi lớp CSS,
 * và nó ở lại sau khi animation kết thúc ⇒ nút sẽ **đóng băng màu bóng của skin cũ**: đổi skin
 * xong, mọi nút đã từng được bấm vẫn giữ bóng cũ, mà không có gì đỏ lên. Dùng `active:` thì `var()`
 * còn sống, nên bóng luôn đi theo skin. Framer chỉ lo `y` — thứ không chứa màu.
 *
 * ⚠️ `transition` CHỈ LIỆT KÊ THUỘC TÍNH CSS THẬT SỰ SỞ HỮU. Bản cũ dùng `transition-all`, mà
 * `all` bao gồm `transform` — thứ Framer đang tự animate bằng vòng lặp riêng của nó. Hai bên cùng
 * điều khiển một thuộc tính thì trình duyệt phải nội suy lại từng giá trị Framer ghi ra, và cú bấm
 * thành nhão. Bỏ `transform` khỏi danh sách thì cú lún đanh lại.
 */
